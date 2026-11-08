<!--
  协同文档编辑器 —— office-engine 版（excel = xlsx，word = docx）。

  <p><b>为什么换成 office-engine</b>：旧实现 excel 用 Univer、word 用
  contenteditable 富文本，两套引擎各自维护「服务端不认识的私有表示」，而且
  Univer 首屏要拉公式 worker + 十余个分包，新建文档先白屏数秒。现在统一交给
  {@code @p10node/office-engine}：文档就是真实的 xlsx/docx 字节，解析与保存都在
  Web Worker 里完成，主线程不参与解压/序列化。</p>

  <p><b>快照格式</b>：见 {@code utils/collabOffice.ts}。新格式 {@code ooxml1:<base64>}
  直接装文件字节；历史快照（Univer JSON / 富文本 HTML）在打开时经
  {@code snapshotToBlob} 转成字节，用户首次保存后自动升级。</p>

  <p><b>保存策略</b>：不做实时保存。用户停手约 3s 才写一次（连续输入零请求），
  但连续输入最多 15s 一定强制写一次（见 {@code utils/collabAutosave.ts}）。
  写入动作复用引擎自己的保存链路（工具栏 Save / Ctrl+S 同一条），因为它保存完
  会把引擎内部的 dirty 状态清零；直接调 {@code client.call("save")} 不会清零，
  第二次编辑就再也收不到 dirty 回调，自动保存会静默失效。</p>

  <p><b>协同同步</b>：版本号乐观锁 + SSE 推送 + 15s 轮询兜底。轮询只取版本号
  （几十字节），版本没变就结束；本地有未保存改动时静默跳过，不打断输入。</p>

  @author Buffy
  @since 2026/11/06（office-engine 迁移：2026/11/07）
-->

<template>
  <div class="fc-editor" data-testid="fc-collab-editor" :data-doc-type="collabType()">
    <div class="fc-editor-bar">
      <!-- 文件名由引擎工具栏与页面标题展示，这里不再重复，只留同步状态 -->
      <span class="fc-editor-status" :class="saveState" data-testid="fc-collab-status">{{ saveStatusText }}</span>
      <span class="fc-editor-ver">v{{ currentVersion }}</span>
      <!-- 实时协同状态：连接态 + 在线人数。引擎会把远程操作直接应用到文档，
           所以「是否同步」对用户来说是第一等信息，不能只在控制台里看。 -->
      <span
        v-if="hubState !== 'idle'"
        class="fc-editor-hub"
        :class="`hub-${hubState}`"
        :title="hubTitle"
        data-testid="fc-collab-hub"
        :data-hub-state="hubState"
        :data-hub-peers="hubPeers.length"
      >
        <i class="fc-editor-hub-dot" aria-hidden="true" />
        {{ hubText }}
      </span>
      <template v-if="!readonly">
        <el-button
          size="small"
          :loading="saving"
          data-testid="fc-collab-save"
          @click="saveNow()"
        >保存</el-button>
        <el-button size="small" text data-testid="fc-collab-refresh" @click="refreshSnapshot(false, undefined, true)">从服务器刷新</el-button>
      </template>
      <span v-else class="fc-editor-readonly">只读</span>
    </div>
    <div class="fc-editor-body">
      <div ref="mountRef" class="fc-editor-mount" data-testid="fc-collab-mount" />
      <!-- 引擎加载态：解析 xlsx/docx 在 worker 里跑，大文件要几百毫秒到数秒，
           没有遮罩时容器是一片纯白，用户会以为白屏。 -->
      <div v-if="!ready" class="fc-editor-loading" role="status" aria-live="polite" data-testid="fc-collab-loading">
        <span class="fc-editor-spinner" aria-hidden="true" />
        <span class="fc-editor-loading-text">{{ loadingText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { ElMessage } from "element-plus";
import { mount, type MountedViewer } from "@p10node/office-engine/embed";
import type { CollabStatus } from "@p10node/office-engine/collab";
import {
  collabCurrentUserId,
  collabCurrentUserName,
  getFileCollab,
  getFileCollabHubState,
  getFileCollabVersion,
  registerFileCollabHubSnapshot,
  saveFileCollabSnapshot,
  subscribeFileCollab,
  type CollabDocType,
  type FileCollabInfo,
} from "../../api/filestorageApi";
import { nextAutoSaveDelay, shouldPollCollab } from "../../utils/collabAutosave";
import { blobToOfficeSnapshot, officeMimeOf } from "../../utils/collabOffice";
import { snapshotToOfficeBytes } from "../../utils/collabExport";
import { CollabHubTransport } from "../../utils/collabHubTransport";

const props = defineProps<{
  /** 协同文档号 */
  collabId: string;
  /** 展示文件名 */
  fileName: string;
  /** 文档类型：excel → xlsx，word → docx（text 不走本组件） */
  docType?: CollabDocType;
  /** 只读模式（分享 / 预览）：隐藏保存与刷新，不做轮询同步 */
  readonly?: boolean;
}>();

/** 初始快照（打开时的最新版本，父组件传入避免首帧空窗） */
const initialSnapshot = defineModel<string>("initialSnapshot", { default: "" });
/** 初始版本号 */
const initialVersion = defineModel<number>("initialVersion", { default: 0 });

/** 向父组件报告「引擎就绪、首帧已绘制」 */
const emit = defineEmits<{ (e: "ready"): void }>();

/** 引擎挂载点 */
const mountRef = ref<HTMLElement | null>(null);
/** mount() 返回的句柄（update / destroy） */
const viewer = shallowRef<MountedViewer | null>(null);
/** 引擎文档句柄（加载完成后由 onLoad 给出） */
const client = shallowRef<{ call: (m: string, ...a: unknown[]) => Promise<unknown> } | null>(null);

/** 引擎是否就绪（false = 显示加载遮罩） */
const ready = ref(false);
/** 加载态文案 */
const loadingText = ref("正在加载文档引擎…");

/** 当前已加载版本号（乐观锁基准） */
const currentVersion = ref(initialVersion.value);
/** 保存中 */
const saving = ref(false);
/** 保存状态：saved / dirty / saving / conflict */
const saveState = ref<"saved" | "dirty" | "saving" | "conflict">("saved");
const saveStatusText = ref(`已同步 · v${initialVersion.value}`);

/** 卸载标记 */
let disposed = false;
/** 是否已有未保存改动 */
let dirtyFlag = false;
/** 本轮「首次变脏」的时刻：自动保存最长等待以它为起点 */
let dirtySince = 0;
/** 编辑序号：每次编辑自增，用于判断「保存期间是否又有新编辑」 */
let dirtySeq = 0;
/** 最近一次成功保存对应的编辑序号 */
let savedSeq = 0;
/** 自动保存定时器 */
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
/** 轮询定时器 */
let pollTimer: ReturnType<typeof setInterval> | null = null;
/** 就绪兜底定时器（异常时也不能永久转圈） */
let readyFallbackTimer: ReturnType<typeof setTimeout> | null = null;
/** 保存失败时抑制引擎 onError 的通用提示（错误已由 pushBlob 明确提示过） */
let suppressEngineError = false;

/** 实时协同传输层（SSE 下行 + POST 上行；每次换文档都要新建实例） */
let transport: CollabHubTransport | null = null;
/** 观察引擎自带协同条（.de-collab-* / .de-peers）的 DOM 观察器 */
let hubObserver: MutationObserver | null = null;

/** 协同连接状态：idle = 未启用 */
const hubState = ref<CollabStatus | "idle">("idle");
/** 在线协作者（不含自己） */
const hubPeers = ref<{ name: string; color: string }[]>([]);
/** 协同状态说明（悬停提示，含失败原因） */
const hubTitle = ref("");

/**
 * 协同状态文案。
 *
 * <p>只读用户也挂协同层（要看在线成员和实时内容），所以文案不区分角色；
 * error 时把具体原因放进 title，页面标题区不放长句。</p>
 */
const hubText = ref("");

/** 同步状态文案与提示 */
function renderHubState(): void {
  const peers = hubPeers.value.length;
  switch (hubState.value) {
    case "connecting":
      hubText.value = "协同连接中…";
      break;
    case "syncing":
      hubText.value = "协同同步中…";
      break;
    case "live":
      hubText.value = peers > 0 ? `协同在线 · ${peers} 人` : "协同在线";
      break;
    case "offline":
      hubText.value = "协同离线 · 改动待同步";
      break;
    case "error":
      hubText.value = "协同异常";
      break;
    default:
      hubText.value = "";
      break;
  }
}

/** 协同类型（父组件未显式传时按文件名猜，兼容旧调用方） */
function collabType(): CollabDocType {
  if (props.docType) return props.docType;
  return /\.docx?$/i.test(props.fileName) ? "word" : "excel";
}

/** 保存状态文案 */
function renderSaveStatus(): void {
  switch (saveState.value) {
    case "saved":
      saveStatusText.value = `已同步 · v${currentVersion.value}`;
      break;
    case "dirty":
      saveStatusText.value = "有未保存改动";
      break;
    case "saving":
      saveStatusText.value = "保存中…";
      break;
    case "conflict":
      saveStatusText.value = "保存冲突，请刷新";
      break;
  }
}

/**
 * 观察引擎自带的协同状态条与成员头像。
 *
 * <p>引擎已经在自己的工具栏里渲染 {@code .de-collab-status} 与 {@code .de-peers}，
 * 并且持有真正的 {@code CollabSession}。如果这里再调一次 {@code startCollab}，
 * 就会开出第二条会话、把同一批操作投递两遍。所以状态只从 DOM 读，不复制会话。</p>
 */
function observeHub(): void {
  const host = mountRef.value;
  if (!host || hubObserver) return;
  const scan = () => scanHubDom();
  hubObserver = new MutationObserver(scan);
  hubObserver.observe(host, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class", "title"],
  });
  scan();
}

/** 断开协同 DOM 观察器 */
function stopHubObserver(): void {
  hubObserver?.disconnect();
  hubObserver = null;
}

/** 把引擎协同条映射到页面状态（连接态 + 在线人数） */
function scanHubDom(): void {
  const host = mountRef.value;
  if (!host) return;
  const statusEl = host.querySelector<HTMLElement>(".de-collab-status");
  if (!statusEl) {
    return;
  }
  const matched = /de-collab-(connecting|syncing|live|offline|error)/.exec(statusEl.className);
  const next = (matched?.[1] as CollabStatus | undefined) ?? "live";
  const peers: { name: string; color: string }[] = [];
  host.querySelectorAll<HTMLElement>(".de-peers .de-peer").forEach((el) => {
    if (el.classList.contains("de-peer-more")) {
      // 「+N」不是人，是溢出标记：把 N 折算成占位人数
      const more = Number.parseInt((el.textContent ?? "").replace(/[^\d]/g, ""), 10);
      for (let i = 0; i < (Number.isFinite(more) ? more : 0); i += 1) {
        peers.push({ name: "", color: "" });
      }
      return;
    }
    peers.push({ name: el.title ?? "", color: el.style.background ?? "" });
  });
  const changed =
    hubState.value !== next ||
    hubPeers.value.length !== peers.length ||
    hubPeers.value.some((p, i) => p.name !== peers[i]?.name);
  if (!changed) return;
  hubState.value = next;
  hubPeers.value = peers;
  hubTitle.value = statusEl.title ?? "";
  renderHubState();
}

/**
 * 等待本地改动全部定序（保存快照前必须为 0，否则文件内容会超前于 seq）。
 *
 * @param timeoutMs 最长等待时间
 * @returns 是否已清空
 */
async function waitHubIdle(timeoutMs = 4000): Promise<boolean> {
  const t = transport;
  if (!t) return true;
  const deadline = Date.now() + timeoutMs;
  while (t.pending > 0) {
    if (disposed || Date.now() > deadline) return false;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return true;
}

/**
 * 把引擎当前内容写进协同服务（版本乐观锁）。
 *
 * @param file 引擎产出的文件字节
 */
async function pushBlob(file: Blob): Promise<void> {
  const seqAtStart = dirtySeq;
  saving.value = true;
  saveState.value = "saving";
  renderSaveStatus();
  try {
    // 快照点的 seq 必须与文件内容对齐：先等本地批次全部定序，再取 lastSeq。
    // 超时也继续保存，但只写文件、不登记 hub 快照，避免把「文档内容对应的 seq」
    // 指到一个文件里并不包含的位置。
    const settled = await waitHubIdle();
    const hubSeq = settled && transport ? transport.lastSeq : 0;
    const hubCtx = settled && transport ? transport.context() : [];
    const snapshot = await blobToOfficeSnapshot(file);
    const updated = await saveFileCollabSnapshot(props.collabId, snapshot, currentVersion.value, undefined, hubSeq);
    currentVersion.value = updated.version;
    if (hubSeq > 0) {
      // ctx 单独 POST：条目数组塞进 URL 会撞网关长度上限
      try {
        await registerFileCollabHubSnapshot(props.collabId, hubSeq, hubCtx);
      } catch {
        // 上下文登记失败不影响文件本身：新加入者会从更早的 base 重放，
        // 属于「多算一次」而不是丢内容，下一次保存会自动纠正。
      }
    }
    savedSeq = seqAtStart;
    // 保存期间用户又改了：这一版已经落后，仍算「有未保存改动」
    dirtyFlag = dirtySeq !== savedSeq;
    saveState.value = dirtyFlag ? "dirty" : "saved";
    renderSaveStatus();
    if (dirtyFlag) scheduleAutoSave(250);
  } catch (e) {
    // 不吞错：抛回引擎，引擎就不会把 dirty 清零，避免「保存失败却显示已同步」
    saveState.value = "conflict";
    renderSaveStatus();
    suppressEngineError = true;
    ElMessage.warning(e instanceof Error ? e.message : "保存失败（可能与他人冲突）");
    // 冲突/网络错误都不自动重试（会一直撞版本），等用户手动刷新或再改一次
    throw e;
  } finally {
    saving.value = false;
  }
}

/**
 * 触发引擎自己的保存链路（与用户点工具栏 Save / Ctrl+S 完全同一条路径）。
 *
 * <p>为什么不直接 {@code client.call("save")}：那条路不会清掉引擎内部的 dirty
 * 状态，React 侧的 {@code onDirtyChange} 只在值变化时回调，于是第二次编辑就再也
 * 收不到通知 —— 自动保存看起来在跑，实际一次都没写。</p>
 *
 * @returns 是否成功点到保存按钮
 */
function triggerEngineSave(): boolean {
  const root = mountRef.value?.querySelector(".de-root");
  if (!root) return false;
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("button.de-mode"));
  const saveBtn = buttons.find((b) => {
    const title = (b.getAttribute("title") ?? "").toLowerCase();
    const text = (b.textContent ?? "").trim().toLowerCase();
    return title.startsWith("save") || text === "save" || text.startsWith("saving");
  });
  if (!saveBtn || saveBtn.disabled) return false;
  saveBtn.click();
  return true;
}

/** 安排一次延迟自动保存（连续输入时不断顺延，最长 15s 强制写一次） */
function scheduleAutoSave(delay?: number): void {
  if (props.readonly) return;
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  autoSaveTimer = setTimeout(() => {
    autoSaveTimer = null;
    void saveNow(true);
  }, delay ?? nextAutoSaveDelay(dirtySince, Date.now()));
}

/** 标脏并安排自动保存 */
function markDirty(): void {
  if (props.readonly) return;
  const now = Date.now();
  dirtySeq += 1;
  if (!dirtyFlag) {
    dirtyFlag = true;
    dirtySince = now;
  }
  if (saveState.value !== "saving" && saveState.value !== "conflict") {
    saveState.value = "dirty";
    renderSaveStatus();
  }
  scheduleAutoSave();
}

/** 立即保存（版本乐观锁） */
async function saveNow(auto = false): Promise<void> {
  if (props.readonly) return;
  if (auto && !dirtyFlag) return;
  if (saving.value) {
    // 已有一次保存在飞：等它结束后补一次，别把这次改动漏掉
    if (dirtyFlag) scheduleAutoSave(800);
    return;
  }
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  // 协同层还有未定序的本地改动时先等它们落地：写进文件的字节里包含的操作
  // 必须都已经有 seq，否则新加入者会把它们再应用一遍。
  if (!(await waitHubIdle())) {
    scheduleAutoSave(600);
    return;
  }
  // 走引擎保存链路：它保存完会把 dirty 清零
  if (triggerEngineSave()) return;
  // 兜底（工具栏不可用）：直接问 worker 要字节
  const c = client.value;
  if (!c) return;
  try {
    const blob = (await c.call("save")) as Blob;
    await pushBlob(blob);
  } catch {
    // 错误已在 pushBlob / 引擎里提示
  }
}

/**
 * 从服务器拉最新内容并重放。
 *
 * @param silent       静默模式（轮询/SSE 触发时不打扰用户）
 * @param knownVersion 已知的最新版本（SSE 推送里带了版本号，省掉一次版本探针）
 * @param force        用户主动点「从服务器刷新」：本地未保存改动按放弃处理
 */
async function refreshSnapshot(silent = false, knownVersion?: number, force = false): Promise<void> {
  try {
    const version = knownVersion ?? (await getFileCollabVersion(props.collabId)).version;
    if (version === currentVersion.value) {
      if (!silent && force) ElMessage.info("当前已是最新版本");
      return;
    }
    if (dirtyFlag && !force) {
      if (!silent) {
        ElMessage.warning("本地有未保存改动，为避免覆盖他人内容请先保存或放弃本地改动");
      }
      return;
    }
    const latest: FileCollabInfo = await getFileCollab(props.collabId);
    if (latest.version === currentVersion.value) return;
    const bytes = await snapshotToOfficeBytes(collabType(), latest.snapshot ?? "");
    const fileName = latest.fileName || props.fileName;
    const src = new File([bytes as unknown as BlobPart], fileName, {
      type: officeMimeOf(collabType()),
    });
    // 换 src 会重建引擎会话，旧 transport 也随之作废：引擎的 collabKey 里带了
    // transport 身份，复用同一个实例会把新旧两段日志接到一起。
    let base = 0;
    try {
      base = (await getFileCollabHubState(props.collabId)).snapshotSeq ?? 0;
    } catch {
      base = 0;
    }
    const previous = transport;
    const nextTransport = new CollabHubTransport(props.collabId);
    transport = nextTransport;
    previous?.close();
    // update 会整树重渲染 DocViewer，src 换了就等于换文档
    client.value = null;
    viewer.value?.update({
      src,
      name: fileName,
      collab: {
        transport: nextTransport,
        room: props.collabId,
        user: { id: collabCurrentUserId(), name: collabCurrentUserName() },
        base,
      },
    });
    currentVersion.value = latest.version;
    dirtyFlag = false;
    dirtySeq = 0;
    savedSeq = 0;
    saveState.value = "saved";
    renderSaveStatus();
    if (!silent) ElMessage.success(`已刷新到他人保存的版本 v${latest.version}`);
  } catch (e) {
    if (!silent) ElMessage.error(e instanceof Error ? e.message : "刷新快照失败");
  }
}

/** SSE 变更订阅的取消函数（卸载时调用） */
let unsubscribe: (() => void) | null = null;

/** 启动 office-engine 并把初始快照作为文档打开 */
async function initEngine(): Promise<void> {
  const host = mountRef.value;
  if (!host) return;
  const type = collabType();
  try {
    loadingText.value = type === "word" ? "正在解析 Word 文档…" : "正在解析 Excel 工作簿…";
    // 协同基线：文档文件里已经包含到哪一批操作。必须在 mount() 之前定值——
    // 它参与引擎的 collabKey，首帧之后再改会导致会话重建。
    let base = 0;
    try {
      base = (await getFileCollabHubState(props.collabId)).snapshotSeq ?? 0;
    } catch {
      // 房间还不存在（从没人协同编辑过）时按 0 处理，等同「原始上传」
    }
    if (disposed) return;
    const bytes = await snapshotToOfficeBytes(type, initialSnapshot.value ?? "");
    const fileName = props.fileName || (type === "word" ? "document.docx" : "workbook.xlsx");
    const src = new File([bytes as unknown as BlobPart], fileName, { type: officeMimeOf(type) });

    transport = new CollabHubTransport(props.collabId);
    const hubTransport = transport;
    viewer.value = mount(host, {
      src,
      name: fileName,
      // 编辑能力全部交给协同层控制：只读时连 Edit 开关都不给
      editable: !props.readonly,
      allowEdit: !props.readonly,
      allowSave: !props.readonly,
      allowDownload: false,
      fileMenu: false,
      allowOpen: false,
      theme: "light",
      // 实时协同：只读用户也挂（要看在线成员与最新内容），由引擎的门控决定能否编辑
      collab: {
        transport: hubTransport,
        room: props.collabId,
        user: { id: collabCurrentUserId(), name: collabCurrentUserName() },
        base,
      },
      onLoad: (c) => {
        client.value = c as unknown as typeof client.value;
        if (readyFallbackTimer) {
          clearTimeout(readyFallbackTimer);
          readyFallbackTimer = null;
        }
        ready.value = true;
        observeHub();
        emit("ready");
      },
      onError: (err) => {
        // 引擎自身会渲染错误面板；这里只撤遮罩，避免永远转圈
        ready.value = true;
        emit("ready");
        if (suppressEngineError) {
          suppressEngineError = false;
          return;
        }
        ElMessage.error(`文档打开失败：${err.message}`);
      },
      onDirtyChange: (dirty) => {
        if (props.readonly) return;
        if (dirty) {
          markDirty();
          return;
        }
        // 引擎在「保存完成」时回调 false；如果保存期间又有新编辑，
        // 这一版已经落后，不能把本地脏标记清掉。
        if (dirtySeq !== savedSeq) {
          dirtyFlag = true;
          saveState.value = "dirty";
          renderSaveStatus();
          scheduleAutoSave(250);
          return;
        }
        dirtyFlag = false;
        dirtySince = 0;
        if (saveState.value !== "conflict") {
          saveState.value = "saved";
          renderSaveStatus();
        }
      },
      onSave: async (file) => {
        await pushBlob(file);
      },
    });
  } catch (e) {
    ready.value = true;
    emit("ready");
    ElMessage.error(`文档引擎初始化失败：${(e as Error)?.message ?? e}`);
  }
}

onMounted(async () => {
  await initEngine();
  // 容器缺失 / 初始化异常时也要撤掉遮罩，不能把用户永远锁在加载态
  if (!ready.value) {
    readyFallbackTimer = setTimeout(() => {
      readyFallbackTimer = null;
      if (!ready.value) {
        ready.value = true;
        emit("ready");
      }
    }, 8000);
  }
  if (props.readonly) return;
  // 主通道：SSE 变更推送 —— 别人一保存就立刻知道，不用等轮询
  unsubscribe = subscribeFileCollab(props.collabId, (change) => {
    if (disposed || change.version <= currentVersion.value) return;
    // 实时协同在线时内容已通过操作流到达本端，重建文档只会打断输入与光标位置；
    // 只有协同不在线（离线/异常）才退回到「拉整份快照」这条老路。
    if (hubState.value === "live") {
      currentVersion.value = change.version;
      saveState.value = dirtyFlag ? "dirty" : "saved";
      renderSaveStatus();
      return;
    }
    void refreshSnapshot(true, change.version);
  });
  // 兜底通道（SSE 断连时保同步）：15s 一次，只问版本号
  pollTimer = setInterval(() => {
    if (disposed || !shouldPollCollab(document.visibilityState === "visible", saving.value, dirtyFlag)) {
      return;
    }
    if (hubState.value === "live") return;
    void refreshSnapshot(true);
  }, 15000);
});

onBeforeUnmount(() => {
  disposed = true;
  stopHubObserver();
  if (pollTimer) clearInterval(pollTimer);
  if (readyFallbackTimer) {
    clearTimeout(readyFallbackTimer);
    readyFallbackTimer = null;
  }
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  const v = viewer.value;
  const c = client.value;
  viewer.value = null;
  client.value = null;
  // 卸载前把未落盘的改动补一次：先问 worker 要字节（destroy 之后再问就没了），
  // 写完再销毁 React 根。加超时兜底，别让路由切换卡在一个坏掉的文档上。
  if (dirtyFlag && !props.readonly && c) {
    const flush = (c.call("save") as Promise<Blob>)
      .then((blob) => pushBlobUnmount(blob))
      .catch(() => undefined);
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 4000));
    void Promise.race([flush, timeout]).finally(() => {
      v?.destroy();
      transport?.close();
      transport = null;
    });
    return;
  }
  v?.destroy();
  transport?.close();
  transport = null;
});

/**
 * 卸载途中的补存：不再更新 UI 状态，只把字节写进服务端。
 *
 * @param blob 引擎产出的文件
 */
async function pushBlobUnmount(blob: Blob): Promise<void> {
  try {
    const t = transport;
    const hubSeq = t && t.pending === 0 ? t.lastSeq : 0;
    const snapshot = await blobToOfficeSnapshot(blob);
    await saveFileCollabSnapshot(props.collabId, snapshot, currentVersion.value, undefined, hubSeq);
    if (hubSeq > 0 && t) {
      await registerFileCollabHubSnapshot(props.collabId, hubSeq, t.context()).catch(() => undefined);
    }
  } catch {
    // 卸载时的补存失败只能放弃：组件已经不可见，弹提示反而打断用户下一步操作
  }
}
</script>

<style scoped>
.fc-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 480px;
  overflow: hidden;
  border-radius: var(--radius-md, 10px);
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  background: var(--el-bg-color, #fff);
}
.fc-editor-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  flex-wrap: wrap;
  flex: none;
}
.fc-editor-status {
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--brand-500, #409eff);
  color: #fff;
  white-space: nowrap;
}
.fc-editor-status.saving {
  background: var(--metric-cpu, #409eff);
}
.fc-editor-status.dirty {
  background: var(--status-warning, #e6a23c);
}
.fc-editor-status.conflict {
  background: var(--status-error, #f56c6c);
}
.fc-editor-hub {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter, #e8ebf0);
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  white-space: nowrap;
}
.fc-editor-hub-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-info, #909399);
}
.fc-editor-hub.hub-live {
  border-color: var(--el-color-success-light-5, #b3e19d);
  color: var(--el-color-success, #67c23a);
}
.fc-editor-hub.hub-live .fc-editor-hub-dot {
  background: var(--el-color-success, #67c23a);
}
.fc-editor-hub.hub-connecting .fc-editor-hub-dot,
.fc-editor-hub.hub-syncing .fc-editor-hub-dot {
  background: var(--el-color-warning, #e6a23c);
  animation: fc-editor-pulse 1.2s ease-in-out infinite;
}
.fc-editor-hub.hub-offline {
  border-color: var(--el-color-warning-light-5, #f3d19e);
  color: var(--el-color-warning, #e6a23c);
}
.fc-editor-hub.hub-offline .fc-editor-hub-dot {
  background: var(--el-color-warning, #e6a23c);
}
.fc-editor-hub.hub-error {
  border-color: var(--el-color-danger-light-5, #fab6b6);
  color: var(--el-color-danger, #f56c6c);
}
.fc-editor-hub.hub-error .fc-editor-hub-dot {
  background: var(--el-color-danger, #f56c6c);
}
@keyframes fc-editor-pulse {
  50% { opacity: 0.35; }
}
.fc-editor-ver {
  font-size: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  font-variant-numeric: tabular-nums;
}
.fc-editor-readonly {
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter, #e8ebf0);
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.fc-editor-body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
}
.fc-editor-mount {
  position: absolute;
  inset: 0;
}
/* 引擎根节点自己带 height:100%，父级必须有确定高度才解析得出来 */
.fc-editor-mount :deep(.de-root) {
  height: 100%;
}
.fc-editor-loading {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--el-bg-color, #fff);
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  font-size: 13px;
}
.fc-editor-spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid var(--el-border-color-lighter, #e8ebf0);
  border-top-color: var(--brand-500, #409eff);
  animation: fc-editor-spin 0.8s linear infinite;
}
@keyframes fc-editor-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .fc-editor-spinner { animation-duration: 2s; }
}
</style>
