<!--
  协同表格编辑器 —— Vue 3 封装 Univer（@univerjs/preset-sheets-core）。

  职责：
    1) 初始化 Univer（createUniver + UniverSheetsCorePreset + zh-CN locale），
       容器挂到本组件 DOM；
    2) 加载快照：createWorkbook(JSON.parse(snapshot))（无快照则空工作簿）；
    3) 保存快照：fWorkbook.save() → 后端（版本乐观锁，冲突提示）；
    4) 协同同步：轮询详情接口比版本号，版本变化（他人已保存）且本地无
       未保存改动时自动刷新快照重放；保存冲突时提示刷新。

  数据来源：@pages/filesystem/api/filestorageApi 的 fileCollab* 系列
  （后端 FileCollabStore，快照式协同，SSE 通知 + 轮询兜底）。
-->

<template>
  <div class="fc-editor">
    <div class="fc-editor-bar">
      <span class="fc-editor-title">{{ fileName }}</span>
      <span class="fc-editor-status" :class="saveState">{{ saveStatusText }}</span>
      <span class="fc-editor-ver">版本 v{{ currentVersion }}</span>
      <template v-if="!readonly">
        <el-button size="small" :loading="saving" @click="saveNow()">保存</el-button>
        <el-button size="small" text @click="refreshSnapshot()">从服务器刷新</el-button>
      </template>
      <span v-else class="fc-editor-readonly">只读分享</span>
    </div>
    <div class="fc-editor-body">
      <div ref="containerRef" class="fc-editor-container" />
      <!-- 引擎加载态：Univer 首次进入要拉公式 worker + 十余个分包，
           没有遮罩时容器是一块纯白，用户会以为白屏。 -->
      <div v-if="!ready" class="fc-editor-loading" role="status" aria-live="polite">
        <span class="fc-editor-spinner" aria-hidden="true" />
        <span class="fc-editor-loading-text">{{ loadingText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { ElMessage } from "element-plus";
import type { FUniver } from "@univerjs/presets";
// worker：Univer 公式引擎运行在独立 worker，Vite 用 ?worker&url 打包。
// 注意：worker.js 是 ESM（顶层 import），但 @univerjs/rpc 的 UniverRPCMainThreadPlugin
// 内部是 `new Worker(url)`（classic 模式），直接传 URL 会报
// "Cannot use import statement outside a module"。这里手动按 { type: "module" }
// 创建 Worker 实例再传入（IUniverRPCMainThreadConfig.workerURL 支持 Worker 实例直通）。
import workerUrl from "@univerjs/preset-sheets-core/lib/worker.js?worker&url";
// 样式副作用导入（preset-sheets-core/lib/index.css）
import "@univerjs/preset-sheets-core/lib/index.css";
import {
  getFileCollab,
  getFileCollabVersion,
  saveFileCollabSnapshot,
  subscribeFileCollab,
  type FileCollabInfo,
} from "../../api/filestorageApi";
import { nextAutoSaveDelay, shouldPollCollab } from "../../utils/collabAutosave";

const props = defineProps<{
  /** 协同文档号 */
  collabId: string;
  /** 展示文件名 */
  fileName: string;
  /** 只读模式（分享视图用）：隐藏保存/刷新按钮，不做轮询同步 */
  readonly?: boolean;
}>();

/** Univer 容器引用 */
const containerRef = ref<HTMLElement | null>(null);
/** 初始快照（打开时的最新版本，父组件传入避免首帧空窗） */
const initialSnapshot = defineModel<string>("initialSnapshot", { default: "" });
/** 初始版本号 */
const initialVersion = defineModel<number>("initialVersion", { default: 0 });

/** 向父组件报告「引擎就绪、首帧已绘制」 */
const emit = defineEmits<{ (e: "ready"): void }>();

/** 引擎是否就绪（false = 显示加载遮罩，避免白屏） */
const ready = ref(false);
/** 加载态文案（引擎初始化/重放快照分两段，用户能看出还在动） */
const loadingText = ref("正在加载表格引擎…");

/** 当前已加载版本号（乐观锁基准） */
const currentVersion = ref(initialVersion.value);
/** 保存中 */
const saving = ref(false);
/** 保存状态：saved / dirty / saving / conflict */
const saveState = ref<"saved" | "dirty" | "saving" | "conflict">("saved");

const saveStatusText = ref(`已同步 · v${initialVersion.value}`);

/** Univer facade 实例（懒加载后持有） */
const univerAPI = shallowRef<FUniver | null>(null);
/** Univer 公式 worker（module 模式，随组件卸载一并释放） */
let univerWorker: Worker | null = null;
/** 卸载标记 */
let disposed = false;
/** 轮询定时器 */
let pollTimer: ReturnType<typeof setInterval> | null = null;
/** 是否已有未保存改动 */
let dirtyFlag = false;
/** 本轮「首次变脏」的时刻：自动保存最长等待以它为起点（连续输入也不能永远不写） */
let dirtySince = 0;

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
 * 创建 Univer 公式引擎 worker（module 模式）。
 *
 * <p>worker.js 为 ESM（顶层 import），浏览器必须按 {@code { type: "module" }}
 * 加载；而 {@code UniverRPCMainThreadPlugin} 内部对 string/URL 走 classic
 * {@code new Worker(e)}，会抛 "Cannot use import statement outside a module"。
 * 因此这里手动创建 module Worker 实例（{@code IUniverRPCMainThreadConfig.workerURL}
 * 接受 Worker 实例并直通），并记录引用以便随组件卸载释放。</p>
 *
 * @return module Worker 实例
 */
function createUniverWorker(): Worker {
  if (!univerWorker) {
    univerWorker = new Worker(workerUrl as unknown as string, { type: "module" });
  }
  return univerWorker;
}

/** 懒加载并初始化 Univer */
async function initUniver(): Promise<FUniver | null> {
  const container = containerRef.value;
  if (!container) return null;
  try {
    const [{ createUniver, LocaleType, mergeLocales }, { UniverSheetsCorePreset }, zhCN] =
      await Promise.all([
        import("@univerjs/presets"),
        import("@univerjs/preset-sheets-core"),
        import("@univerjs/preset-sheets-core/locales/zh-CN"),
      ]);
    const { univerAPI: api } = createUniver({
      locale: LocaleType.ZH_CN,
      locales: {
        [LocaleType.ZH_CN]: mergeLocales((zhCN as { default?: unknown }).default ?? {}),
      },
      presets: [
        UniverSheetsCorePreset({
          container,
          workerURL: createUniverWorker(),
        }),
      ],
    });
    // 加载初始快照：有快照用快照重建工作簿，否则空工作簿
    // （initialSnapshot 是 defineModel 的本地 ref，不在 props 上，不能写 props.initialSnapshot）
    if (initialSnapshot.value) {
      const raw = initialSnapshot.value;
      try {
        const data = typeof raw === "string" ? JSON.parse(raw) : raw;
        api.createWorkbook(data ?? {});
      } catch {
        api.createWorkbook({});
      }
    } else {
      api.createWorkbook({});
    }
    univerAPI.value = api;
    // 命令级监听：只有「会改内容」的命令才标脏。选区/滚动/激活这类纯浏览命令
    // 不参与，否则用户点一下格子就排一次自动保存，既吵又浪费带宽。
    bindDirtyWatcher(api);
    // 首帧绘制完成后再撤加载遮罩：requestAnimationFrame 保证 canvas 已经出图，
    // 否则撤罩子的瞬间仍是一片空白（用户感知就是「白屏一闪」）。
    await nextTick();
    requestAnimationFrame(() => {
      ready.value = true;
      emit("ready");
    });
    return api;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[FileCollabEditor] Univer 初始化失败", e);
    ElMessage.error("协同表格初始化失败：" + (e as Error)?.message);
    ready.value = true;
    emit("ready");
    return null;
  }
}

/** 纯浏览类命令：命中即不标脏（不触发自动保存） */
const NON_EDIT_COMMAND = /(set-selections?|set-active|change-selection|scroll|move-selection|toggle|activate|focus|set-zoom|set-frozen|set-visible)/i;

/**
 * 绑定「脏标记」监听。
 *
 * <p>Univer 的 facade 在不同版本里可能没有 {@code onCommandExecuted}，
 * 这里做能力探测；不可用时仍可手动保存，不影响主流程。</p>
 *
 * @param api Univer facade
 */
function bindDirtyWatcher(api: FUniver): void {
  const anyApi = api as unknown as {
    onCommandExecuted?: (cb: (command: { id?: string }) => void) => unknown;
  };
  if (typeof anyApi.onCommandExecuted !== "function") return;
  try {
    anyApi.onCommandExecuted((command) => {
      const id = String(command?.id ?? "");
      if (NON_EDIT_COMMAND.test(id)) return;
      markDirty();
    });
  } catch {
    // 监听注册失败不阻断编辑：只是失去自动保存，手动保存仍在
  }
}

/** 自动保存定时器 */
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 标脏并安排一次延迟自动保存。
 *
 * <p>用户要求：不做实时保存，改为定时异步保存，且不得阻塞输入。
 * 因此这里只在「最后一次编辑后约 3s」触发一次；每次新编辑都会重置计时器，
 * 连续输入期间一条请求都不会发。</p>
 *
 * <p>但连续输入不能等于永远不保存：第一次改动开始计时，最多
 * {@link COLLAB_AUTOSAVE_MAX_WAIT_MS} 一定强制写一次（见 {@link nextAutoSaveDelay}）。</p>
 */
function markDirty(): void {
  if (props.readonly) return;
  const now = Date.now();
  if (!dirtyFlag) {
    dirtySince = now;
  }
  dirtyFlag = true;
  if (saveState.value !== "saving") {
    saveState.value = "dirty";
    renderSaveStatus();
  }
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    autoSaveTimer = null;
    void saveNow(true);
  }, nextAutoSaveDelay(dirtySince, now));
}

/** 立即保存当前快照（版本乐观锁） */
async function saveNow(auto = false): Promise<void> {
  if (saving.value) {
    // 已经有一次保存在飞：等它结束后补一次，别把这次改动漏掉
    // （老实现直接 return，定时器又已清空，用户不再编辑就再也存不上去）
    if (dirtyFlag && !autoSaveTimer) {
      autoSaveTimer = setTimeout(() => {
        autoSaveTimer = null;
        void saveNow(true);
      }, 800);
    }
    return;
  }
  if (auto && !dirtyFlag) return;
  const api = univerAPI.value;
  if (!api) return;
  const wb = api.getActiveWorkbook();
  if (!wb) return;
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  saving.value = true;
  saveState.value = "saving";
  renderSaveStatus();
  try {
    // 快照序列化是主线程 CPU：放在 requestIdleCallback 里跑，尽量避开用户正在输入的时刻
    const snapshot = await idleStringify(wb);
    const updated = await saveFileCollabSnapshot(
      props.collabId,
      snapshot,
      currentVersion.value,
    );
    currentVersion.value = updated.version;
    dirtyFlag = false;
    saveState.value = "saved";
    renderSaveStatus();
  } catch (e) {
    saveState.value = "conflict";
    renderSaveStatus();
    ElMessage.warning(e instanceof Error ? e.message : "保存失败（可能与他人冲突）");
  } finally {
    saving.value = false;
  }
}

/**
 * 在浏览器空闲时把工作簿序列化成 JSON 字符串。
 *
 * <p>大工作簿的 {@code save() + JSON.stringify} 是几百毫秒的主线程计算，
 * 紧跟在用户最后一下输入之后跑就表现为「停手瞬间卡一下」。这里先让一帧空闲
 * （最长等 {@code timeout}），没有 requestIdleCallback 的环境直接同步跑。</p>
 *
 * @param wb 当前工作簿 facade
 * @returns 快照 JSON 字符串
 */
function idleStringify(wb: { save: () => unknown }): Promise<string> {
  const build = (): string => JSON.stringify(wb.save());
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
    .requestIdleCallback;
  if (typeof ric !== "function") {
    return Promise.resolve(build());
  }
  return new Promise<string>((resolve) => {
    ric(() => resolve(build()), { timeout: 1200 });
  });
}

/**
 * 从服务器拉最新快照并重放（本地无未保存改动时直接覆盖；有改动则提示）
 *
 * @param silent       静默模式（轮询/SSE 触发时不打扰用户）
 * @param knownVersion 已知的最新版本（SSE 推送里带了版本号，省掉一次版本探针）
 */
async function refreshSnapshot(silent = false, knownVersion?: number): Promise<void> {
  const api = univerAPI.value;
  if (!api) return;
  try {
    // 有版本提示（SSE）就直接用，否则先只问版本号：编辑期间绝大多数轮询到这里就结束了
    const version = knownVersion ?? (await getFileCollabVersion(props.collabId)).version;
    if (version === currentVersion.value) {
      return;
    }
    if (dirtyFlag) {
      // 轮询触发的检查不打扰用户：本地有改动时静默跳过，等自动保存完成后再同步
      if (!silent) {
        ElMessage.warning("本地有未保存改动，为避免覆盖他人内容请先保存或放弃本地改动");
      }
      return;
    }
    // 版本真的变了（且有新内容）才取全文
    const latest: FileCollabInfo = await getFileCollab(props.collabId);
    if (latest.version === currentVersion.value) {
      currentVersion.value = latest.version;
      return;
    }
    // 版本变化且无本地改动 → 直接重放最新快照
    const data = latest.snapshot ? JSON.parse(latest.snapshot) : {};
    // 重建工作簿：简单可靠（快照式协同）
    // Univer 无公开的"原地 load"facade，重开一个工作簿并切换当前
    api.createWorkbook(data);
    currentVersion.value = latest.version;
    saveState.value = "saved";
    renderSaveStatus();
    if (!silent) {
      // 提示已用他人版本刷新
      ElMessage.success(`已刷新到他人保存的版本 v${latest.version}`);
    }
  } catch (e) {
    if (!silent) ElMessage.error(e instanceof Error ? e.message : "刷新快照失败");
  }
}

/** SSE 变更订阅的取消函数（卸载时调用） */
let unsubscribe: (() => void) | null = null;

onMounted(async () => {
  await initUniver();
  // 容器缺失 / 初始化异常时也要撤掉遮罩，不能把用户永远锁在加载态
  if (!ready.value) {
    ready.value = true;
    emit("ready");
  }
  // 轮询兜底（SSE 断连时保同步）：15s 一次即可。
  // 原来 5s 且带全量快照，等于每 5s 拉一次整本工作簿；改慢 + 本地有改动时静默跳过，
  // 避免后台请求和用户输入抢主线程。
  if (props.readonly) return;
  // 主通道：SSE 变更推送 —— 别人一保存就立刻知道，不用等轮询
  unsubscribe = subscribeFileCollab(props.collabId, (change) => {
    if (disposed || change.version <= currentVersion.value) {
      return;
    }
    void refreshSnapshot(true, change.version);
  });
  // 兜底通道（SSE 断连时保同步）：15s 一次，但只问版本号（几十字节）。
  // 后台标签页不轮询；本地有未保存改动 / 正在保存也不轮询（此时版本检查没意义）。
  pollTimer = setInterval(() => {
    if (disposed || !shouldPollCollab(document.visibilityState === "visible", saving.value, dirtyFlag)) {
      return;
    }
    void refreshSnapshot(true);
  }, 15000);
});

onBeforeUnmount(() => {
  disposed = true;
  if (pollTimer) clearInterval(pollTimer);
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  // 卸载前把未落盘的改动补一次保存（不等待结果，避免卡住路由切换）
  if (dirtyFlag && !props.readonly) {
    void saveNow(true);
  }
  if (univerAPI.value) {
    try {
      univerAPI.value.dispose();
    } catch {
      // 卸载时 dispose 失败可忽略
    }
  }
  if (univerWorker) {
    try {
      univerWorker.terminate();
    } catch {
      // worker 已退出时忽略
    }
    univerWorker = null;
  }
});
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
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  flex-wrap: wrap;
}
.fc-editor-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fc-editor-status {
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--brand-500, #409eff);
  color: #fff;
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
.fc-editor-ver {
  font-size: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  font-variant-numeric: tabular-nums;
  margin-left: auto;
}
.fc-editor-readonly {
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter, #e8ebf0);
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  margin-left: auto;
}
.fc-editor-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  /* Univer 根节点靠 .univer-h-full { height: 100% } 撑满容器。
     容器若是 display:block + 由 flex 分配高度，该 100% 在部分浏览器/嵌套场景下
     解析不出基准（实测根节点停在内容高度 141px，表格 canvas 变成 0 高、
     只剩工具栏），因此这里把容器改成 flex 列，直接用 flex 把根节点撑满，
     不依赖 Univer 内部的百分比高度。 */
  display: flex;
  flex-direction: column;
}
.fc-editor-body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
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
/* Univer 的根节点（唯一直接子元素）：吃满容器高度 */
.fc-editor-container > :deep(*) {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}
</style>