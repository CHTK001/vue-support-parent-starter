<script setup lang="ts">
/**
 * 容器工作区（右栏）
 *
 * <p>内部页签收进「概览 / 实时日志 / 终端 / 环境变量 / 挂载」，右上角可关闭右栏。</p>
 *
 * <p>实时日志、交互终端、卸载容器全部走 SSE：
 * 日志 {@code GET .../logs/stream}，终端 {@code POST .../exec}，
 * 卸载 {@code POST .../remove-stream}。切换页签或关闭右栏时主动断开，
 * 避免后台通道继续占用后端 SSH 会话。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/core";
import type { SseClient } from "@repo/utils";
import {
  containerAction,
  containerExecClose,
  containerExecInput,
  containerExecUrl,
  containerLogsStreamUrl,
  getContainer,
  openDockerSse,
  removeContainerStreamUrl,
} from "../api";
import type { DockerContainer, DockerContainerDetail } from "../api";
import ProgressDialog from "./ProgressDialog.vue";

/** 右栏页签 */
type WorkspaceTab = "overview" | "logs" | "terminal" | "env" | "mounts";

const props = defineProps<{
  /** 主机 id */
  hostId: number;
  /** 当前选中容器 */
  container: DockerContainer;
  /** 当前页签（父级持有，右键菜单可直接指定） */
  tab: WorkspaceTab;
}>();

const emit = defineEmits<{
  (e: "update:tab", value: WorkspaceTab): void;
  (e: "close"): void;
  /** 容器状态变化：刷新左栏清单 */
  (e: "refresh"): void;
  /** 容器已删除：父级关闭右栏并移除选中项 */
  (e: "removed", id: string): void;
}>();

/* ==================== 详情 ==================== */

const detail = ref<DockerContainerDetail | null>(null);
const detailLoading = ref(false);
const detailError = ref("");

const isRunning = computed(() => props.container.state === "running");
const isPaused = computed(() => props.container.state === "paused");
const stateTone = computed(() => (isRunning.value ? "is-ok" : isPaused.value ? "is-warn" : "is-off"));

async function loadDetail(): Promise<void> {
  const id = props.container.id;
  detail.value = null;
  detailError.value = "";
  if (!props.hostId || !id) return;
  detailLoading.value = true;
  try {
    const data = (await getContainer(props.hostId, id)) as DockerContainerDetail;
    detail.value = data ?? null;
  } catch (e: any) {
    detailError.value = e?.message ?? "读取容器详情失败";
  } finally {
    detailLoading.value = false;
  }
}

/* ==================== 操作 ==================== */

const acting = ref("");

/** 动作中文名 */
function actionLabel(action: string): string {
  return { start: "启动", stop: "停止", restart: "重启", pause: "暂停", unpause: "恢复", kill: "强制停止", remove: "删除" }[action] ?? action;
}

/** 是否正在执行某个动作 */
function isActing(action: string): boolean {
  return acting.value === `${action}:${props.container.id}`;
}

/**
 * 容器操作（start / stop / restart / pause / unpause / kill / remove）
 *
 * @param action 动作
 */
async function runAction(action: string): Promise<void> {
  if (!props.hostId) return;
  if (action === "remove") {
    try {
      await ElMessageBox.confirm(
        `确认删除容器「${props.container.name}」？删除后容器内未挂载的数据将不可恢复。`,
        "删除容器",
        { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" },
      );
    } catch {
      return;
    }
    startRemove();
    return;
  }
  acting.value = `${action}:${props.container.id}`;
  try {
    await containerAction(props.hostId, props.container.id, action);
    message.success(`${actionLabel(action)}成功：${props.container.name}`);
    await loadDetail();
    emit("refresh");
  } catch (e: any) {
    message.error(e?.message ?? `${actionLabel(action)}失败`);
  } finally {
    acting.value = "";
  }
}

/* ==================== 卸载容器（SSE remove-stream） ==================== */

const removeDlg = reactive({ open: false, running: false, done: false, failed: false });
const removeLines = ref<string[]>([]);
let removeSse: SseClient | null = null;

/** 开启卸载进度并建立 SSE */
function startRemove(): void {
  removeSse?.close();
  removeSse = null;
  removeDlg.open = true;
  removeDlg.running = true;
  removeDlg.done = false;
  removeDlg.failed = false;
  removeLines.value = [];
  removeSse = openDockerSse(
    removeContainerStreamUrl(props.hostId, props.container.id, true),
    { method: "POST" },
    {
      onEvent: (event, data) => {
        if (event === "step") removeLines.value.push(`▶ ${data}`);
        else if (event === "log") removeLines.value.push(data);
        else if (event === "error") {
          removeLines.value.push(`✖ ${data}`);
          removeDlg.running = false;
          removeDlg.failed = true;
        } else if (event === "done") {
          removeLines.value.push(`✔ ${data || "容器已删除"}`);
          removeDlg.running = false;
          removeDlg.done = true;
          message.success(`已删除 ${props.container.name}`);
          emit("removed", props.container.id);
          emit("refresh");
        }
      },
      onError: () => {
        if (!removeDlg.done) {
          removeDlg.running = false;
          removeDlg.failed = true;
          removeLines.value.push("✖ 与服务器的实时通道断开，请刷新列表确认是否已删除");
        }
      },
      onClose: () => {
        if (removeDlg.running) {
          removeDlg.running = false;
          removeDlg.failed = true;
          removeLines.value.push("✖ 实时通道已关闭，请刷新列表确认是否已删除");
        }
      },
    },
  );
}

/** 关闭卸载进度弹窗 */
function closeRemoveDialog(): void {
  removeSse?.close();
  removeSse = null;
  removeDlg.open = false;
  removeDlg.running = false;
}

/* ==================== 实时日志（SSE） ==================== */

const logLines = ref<string[]>([]);
const logState = ref<"idle" | "connecting" | "streaming" | "error" | "closed">("idle");
const logAutoScroll = ref(true);
const logBox = ref<HTMLElement | null>(null);
let logSse: SseClient | null = null;

/** 停止日志流 */
function stopLogs(): void {
  logSse?.close();
  logSse = null;
  if (logState.value === "streaming" || logState.value === "connecting") logState.value = "closed";
}

/** 追加一行日志（限制 4000 行，自动滚动） */
function pushLog(line: string): void {
  logLines.value.push(line);
  if (logLines.value.length > 4000) logLines.value.splice(0, logLines.value.length - 4000);
  if (logAutoScroll.value) {
    void nextTick(() => {
      if (logBox.value) logBox.value.scrollTop = logBox.value.scrollHeight;
    });
  }
}

/** 建立日志流 */
function startLogs(): void {
  stopLogs();
  if (!props.hostId || !props.container.id) return;
  logLines.value = [];
  logState.value = "connecting";
  logSse = openDockerSse(
    containerLogsStreamUrl(props.hostId, props.container.id, 300),
    { method: "GET" },
    {
      onEvent: (event, data) => {
        if (event === "log") {
          logState.value = "streaming";
          pushLog(data);
        } else if (event === "session") {
          logState.value = "streaming";
        } else if (event === "error") {
          logState.value = "error";
          pushLog(`[错误] ${data}`);
        }
      },
      onError: () => {
        logState.value = "error";
      },
      onClose: () => {
        if (logState.value !== "error") logState.value = "closed";
      },
    },
  );
}

/** 复制日志 */
async function copyLogs(): Promise<void> {
  try {
    await navigator.clipboard.writeText(logLines.value.join("\n"));
    message.success("日志已复制");
  } catch {
    message.error("复制失败，请使用下载");
  }
}

/** 下载日志（浏览器本地生成文本，不经后端） */
function downloadLogs(): void {
  const blob = new Blob([logLines.value.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${props.container.name}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "")}.log`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ==================== 终端（SSE） ==================== */

const terminalSession = ref("");
const terminalBuffer = ref("");
const terminalState = ref<"idle" | "connecting" | "running" | "closed" | "error">("idle");
const terminalConsole = ref<HTMLElement | null>(null);
let terminalSse: SseClient | null = null;
/** 终端会话所属容器（异步关闭时容器可能已切走，必须记住） */
let terminalContainerId = "";

/** 转义终端输出的 ASCII 控制字符（含 ESC/CSI 序列与零宽控制符，避免原始控制符写 DOM 后打乱 pre-wrap 排版） */
function escapeTerminal(text: string): string {
  return text
    // ESC 开头 + CSI 控制序列（如清屏 \x1b[2J、颜色 \x1b[0;31m）：保留原文为 `␛` 开头的可见标记
    .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, m => `␛${m}`)
    // 其余 C0/C1 控制字符（回退 \b、\x00、换页等）：全部转义为可见标记，绝不允许原始控制符落盘
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, () => "␛");
}

/** 追加终端输出（限制缓冲 400KB） */
function appendTerminal(text: string): void {
  terminalBuffer.value += escapeTerminal(text);
  if (terminalBuffer.value.length > 400000) terminalBuffer.value = terminalBuffer.value.slice(-320000);
  void nextTick(() => {
    if (terminalConsole.value) terminalConsole.value.scrollTop = terminalConsole.value.scrollHeight;
  });
}

/** 建立终端会话 */
function startTerminal(): void {
  stopTerminal();
  if (!props.hostId || !props.container.id) return;
  if (!isRunning.value) {
    terminalState.value = "idle";
    terminalBuffer.value = "容器未运行，启动后才能进入。\r\n";
    return;
  }
  terminalContainerId = props.container.id;
  terminalBuffer.value = "";
  terminalState.value = "connecting";
  void nextTick(() => terminalConsole.value?.focus());
  terminalSse = openDockerSse(
    containerExecUrl(props.hostId, props.container.id),
    { method: "POST", body: { command: "/bin/sh" } },
    {
      onEvent: (event, data) => {
        if (event === "session") {
          terminalSession.value = data;
          terminalState.value = "running";
        } else if (event === "output") {
          appendTerminal(data);
        } else if (event === "closed") {
          terminalState.value = "closed";
          appendTerminal("\r\n[session closed]\r\n");
        } else if (event === "error") {
          terminalState.value = "error";
          appendTerminal(`\r\n[错误] ${data}\r\n`);
        }
      },
      onError: () => {
        terminalState.value = "error";
        appendTerminal("\r\n[连接已断开]\r\n");
      },
    },
  );
}

/** 停止终端：先通知后端关闭会话，再断开 SSE */
function stopTerminal(): void {
  const sid = terminalSession.value;
  const containerId = terminalContainerId;
  terminalSse?.close();
  terminalSse = null;
  if (sid && containerId && props.hostId) {
    void containerExecClose(props.hostId, containerId, sid).catch(() => undefined);
  }
  terminalSession.value = "";
  terminalContainerId = "";
  if (terminalState.value === "running" || terminalState.value === "connecting") {
    terminalState.value = "closed";
  }
}

/** 发送终端输入 */
function sendTerminal(input: string): void {
  if (!props.hostId || !terminalSession.value) return;
  const containerId = terminalContainerId || props.container.id;
  void containerExecInput(props.hostId, containerId, terminalSession.value, input).catch((e: any) => {
    message.error(e?.message ?? "发送输入失败");
  });
}

/** 终端按键映射：行编辑与常用控制键原样送给容器内 shell */
function onTerminalKey(e: KeyboardEvent): void {
  if (props.tab !== "terminal") return;
  const special: Record<string, string> = {
    Enter: "\r",
    Backspace: "\u007f",
    Tab: "\t",
    Escape: "\u001b",
    ArrowUp: "\u001b[A",
    ArrowDown: "\u001b[B",
    ArrowLeft: "\u001b[D",
    ArrowRight: "\u001b[C",
    Home: "\u001b[H",
    End: "\u001b[F",
    Delete: "\u001b[3~",
  };
  if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
    e.preventDefault();
    sendTerminal("\u0003");
    return;
  }
  if (e.ctrlKey && (e.key === "d" || e.key === "D")) {
    e.preventDefault();
    sendTerminal("\u0004");
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const seq = special[e.key];
  if (seq) {
    e.preventDefault();
    sendTerminal(seq);
    return;
  }
  if (e.key.length === 1) {
    e.preventDefault();
    sendTerminal(e.key);
  }
}

/* ==================== 生命周期 ==================== */

/** 切换页签：按需建立 / 断开 SSE */
function switchTab(t: WorkspaceTab): void {
  emit("update:tab", t);
}

watch(
  () => props.container.id,
  () => {
    stopLogs();
    stopTerminal();
    void loadDetail();
    if (props.tab === "logs") startLogs();
    if (props.tab === "terminal") startTerminal();
  },
  { immediate: true },
);

watch(
  () => props.tab,
  (t) => {
    if (t === "logs") startLogs();
    else stopLogs();
    if (t === "terminal") startTerminal();
    else stopTerminal();
  },
);

onBeforeUnmount(() => {
  stopLogs();
  stopTerminal();
  removeSse?.close();
  removeSse = null;
});

defineExpose({
  /** 供父级右键菜单触发删除（复用同一套确认 + SSE 进度） */
  requestRemove: () => void runAction("remove"),
});
</script>

<template>
  <div class="dk-workspace">
    <!-- 顶部：容器名 + 状态 + 操作 -->
    <div class="dk-pane-head">
      <span class="dk-dot" :class="stateTone" />
      <b class="dk-ws-name" :title="container.name">{{ container.name }}</b>
      <span class="dk-pill" :class="isRunning ? 'is-ok' : isPaused ? 'is-warn' : ''">{{ container.state }}</span>
      <span class="dk-spacer" />

      <ReButton
        v-if="!isRunning"
        layout="square"
        link
        icon="VideoPlay"
        tip="启动容器"
        :loading="isActing('start')"
        @click="runAction('start')"
      />
      <ReButton
        v-if="isRunning"
        layout="square"
        link
        icon="VideoPause"
        tip="停止容器"
        :loading="isActing('stop')"
        @click="runAction('stop')"
      />
      <ReButton layout="square" link icon="RefreshRight" tip="重启容器" :loading="isActing('restart')" @click="runAction('restart')" />
      <ReButton
        v-if="!isPaused"
        layout="square"
        link
        icon="CircleClose"
        tip="暂停容器"
        :disabled="!isRunning"
        :loading="isActing('pause')"
        @click="runAction('pause')"
      />
      <ReButton
        v-else
        layout="square"
        link
        icon="CircleCheck"
        tip="恢复容器"
        :loading="isActing('unpause')"
        @click="runAction('unpause')"
      />
      <ReButton layout="square" link icon="Delete" type="danger" tip="删除容器（SSE 实时进度）" @click="runAction('remove')" />
      <ReButton layout="square" link icon="Close" tip="关闭右栏" @click="emit('close')" />
    </div>

    <!-- 右栏页签 -->
    <nav class="dk-tabs dk-tabs--inner">
      <button type="button" :class="{ on: tab === 'overview' }" @click="switchTab('overview')">概览</button>
      <button type="button" :class="{ on: tab === 'logs' }" @click="switchTab('logs')">
        实时日志<i class="dk-live" :class="{ on: logState === 'streaming' }" />
      </button>
      <button type="button" :class="{ on: tab === 'terminal' }" @click="switchTab('terminal')">
        终端<i class="dk-live" :class="{ on: terminalState === 'running' }" />
      </button>
      <button type="button" :class="{ on: tab === 'env' }" @click="switchTab('env')">环境变量</button>
      <button type="button" :class="{ on: tab === 'mounts' }" @click="switchTab('mounts')">挂载</button>
    </nav>

    <div class="dk-pane-body dk-log-wrap">
      <div v-if="detailLoading && !detail" v-loading="true" class="dk-loading" />

      <!-- 概览 -->
      <template v-else-if="tab === 'overview'">
        <div v-if="detailError" class="dk-banner is-bad">{{ detailError }}</div>

        <div class="dk-stats">
          <div class="dk-stat"><span>状态</span><b>{{ detail?.state?.status || container.state }}</b></div>
          <div class="dk-stat"><span>重启次数</span><b>{{ detail?.restartCount ?? 0 }}</b></div>
          <div class="dk-stat"><span>PID</span><b>{{ detail?.state?.pid || "-" }}</b></div>
          <div class="dk-stat"><span>健康检查</span><b>{{ detail?.state?.health || "无" }}</b></div>
        </div>

        <div class="dk-sec">
          <h4>基本信息</h4>
          <dl class="dk-kv">
            <dt>容器 ID</dt>
            <dd class="dk-mono">{{ detail?.id || container.id }}</dd>
            <dt>镜像</dt>
            <dd>{{ detail?.image || container.image }}</dd>
            <dt>创建时间</dt>
            <dd>{{ detail?.created || container.createdAt || "-" }}</dd>
            <dt>启动时间</dt>
            <dd>{{ detail?.state?.startedAt || "-" }}</dd>
            <dt>退出码</dt>
            <dd>{{ detail?.state?.exitCode ?? 0 }}</dd>
            <dt>启动命令</dt>
            <dd class="dk-mono">{[...(detail?.entrypoint || []), ...(detail?.cmd || [])].join(" ") || "-"}</dd>
            <dt>工作目录</dt>
            <dd class="dk-mono">{{ detail?.workingDir || "-" }}</dd>
            <dt>日志路径</dt>
            <dd class="dk-mono">{{ detail?.logPath || "-" }}</dd>
          </dl>
        </div>

        <div class="dk-sec">
          <h4>网络与端口</h4>
          <dl class="dk-kv">
            <dt>网络模式</dt>
            <dd>{{ detail?.networkMode || container.network || "bridge" }}</dd>
            <dt>重启策略</dt>
            <dd>{{ detail?.restartPolicy || "-" }}{{ detail?.autoRemove ? " · 自动删除" : "" }}</dd>
            <dt>端口映射</dt>
            <dd>
              <template v-if="detail?.ports?.length">
                <span v-for="(p, i) in detail.ports" :key="i" class="dk-tag">
                  {{ p.hostIp ? p.hostIp + ":" : "" }}{{ p.host || "-" }} → {{ p.container }}
                </span>
              </template>
              <span v-else>{{ container.ports || "未映射" }}</span>
            </dd>
            <dt>网络</dt>
            <dd>
              <template v-if="detail?.networks?.length">
                <span v-for="(n, i) in detail.networks" :key="i" class="dk-tag">
                  {{ n.name || n }}{{ n.ipAddress ? " · " + n.ipAddress : "" }}
                </span>
              </template>
              <span v-else>{{ container.network || "-" }}</span>
            </dd>
          </dl>
        </div>
      </template>

      <!-- 实时日志 -->
      <template v-else-if="tab === 'logs'">
        <div class="dk-logbar">
          <span class="dk-live-label">
            <i class="dk-live" :class="{ on: logState === 'streaming' }" />
            {{ logState === "streaming" ? "实时接收中" : logState === "connecting" ? "连接中…" : logState === "error" ? "连接中断" : logState === "closed" ? "已停止" : "未开始" }}
          </span>
          <span class="dk-spacer" />
          <ReButton
            layout="square"
            link
            :icon="logAutoScroll ? 'VideoPause' : 'VideoPlay'"
            :tip="logAutoScroll ? '暂停自动滚动' : '继续自动滚动'"
            @click="logAutoScroll = !logAutoScroll"
          />
          <ReButton v-if="logState !== 'streaming'" layout="square" link icon="RefreshRight" tip="重新连接日志流" @click="startLogs" />
          <ReButton v-else layout="square" link icon="Close" tip="停止日志流" @click="stopLogs" />
          <ReButton layout="square" link icon="CopyDocument" tip="复制全部日志" @click="copyLogs" />
          <ReButton layout="square" link icon="Download" tip="下载日志" @click="downloadLogs" />
          <ReButton layout="square" link icon="Delete" tip="清空日志" @click="logLines = []" />
        </div>
        <pre ref="logBox" class="dk-log">{{ logLines.length ? logLines.join("\n") : "等待日志输出…" }}</pre>
        <div v-if="logState === 'error'" class="dk-banner is-bad">日志流已断开，可点击「重新连接日志流」继续跟踪。</div>
      </template>

      <!-- 终端 -->
      <template v-else-if="tab === 'terminal'">
        <div class="dk-logbar">
          <span class="dk-live-label">
            <i class="dk-live" :class="{ on: terminalState === 'running' }" />
            {{ terminalState === "running" ? "终端已连接" : terminalState === "connecting" ? "连接中…" : terminalState === "error" ? "连接失败" : terminalState === "closed" ? "已结束" : !isRunning ? "容器未运行" : "未连接" }}
          </span>
          <span v-if="terminalSession" class="dk-hint dk-mono">会话 {{ terminalSession.slice(0, 8) }}</span>
          <span class="dk-spacer" />
          <ReButton v-if="terminalState !== 'running'" layout="square" link icon="RefreshRight" tip="重新进入容器" :disabled="!isRunning" @click="startTerminal" />
          <ReButton v-else layout="square" link icon="Close" tip="关闭终端会话" @click="stopTerminal" />
        </div>
        <div
          ref="terminalConsole"
          class="dk-term"
          tabindex="0"
          spellcheck="false"
          @keydown="onTerminalKey"
        >{{ terminalBuffer || (terminalState === "connecting" ? "正在启动容器终端…" : "点击此处后直接输入；支持方向键、Tab、Ctrl+C / Ctrl+D") }}</div>
      </template>

      <!-- 环境变量 -->
      <template v-else-if="tab === 'env'">
        <div v-if="!detail?.env?.length" class="dk-empty">
          <ReIcon name="Memo" :size="22" />
          <b>没有环境变量</b>
        </div>
        <ul v-else class="dk-lines">
          <li v-for="(e, i) in detail.env" :key="i" class="dk-mono">{{ e }}</li>
        </ul>
      </template>

      <!-- 挂载 -->
      <template v-else>
        <div v-if="!detail?.mounts?.length" class="dk-empty">
          <ReIcon name="Folder" :size="22" />
          <b>没有挂载卷</b>
          <span>容器数据仅保存在容器层，删除容器后会丢失</span>
        </div>
        <ul v-else class="dk-lines">
          <li v-for="(m, i) in detail.mounts" :key="i">
            <span class="dk-tag">{{ m.type }}</span>
            <span class="dk-mono">{{ m.source }}</span>
            <span class="dk-arrow">→</span>
            <span class="dk-mono">{{ m.destination }}</span>
            <span class="dk-hint">{{ m.rw ? "读写" : "只读" }}</span>
          </li>
        </ul>
      </template>
    </div>

    <ProgressDialog
      :model-value="removeDlg.open"
      title="卸载容器（SSE 实时进度）"
      :running="removeDlg.running"
      :done="removeDlg.done"
      :failed="removeDlg.failed"
      :lines="removeLines"
      @close="closeRemoveDialog"
    />
  </div>
</template>
