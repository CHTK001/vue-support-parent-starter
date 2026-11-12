<script setup lang="ts">
/**
 * 字符终端直连渲染组件 —— iframe 嵌入后端静态页
 *
 * 与 ScGuacViewer 的分工：本组件不经过 guacd，页面内的 xterm 直接对接平台自研端点。
 * 按连接协议选页面：
 * <ul>
 *   <li>{@code ssh} → `/ssh-direct.html`，对接 /ws/ms/server/terminal/ssh（MINA SSHD PTY 桥接）</li>
 *   <li>{@code telnet} → `/telnet-direct.html`，对接 /ws/ms/server/terminal/telnet（WS ↔ TCP 透传）</li>
 * </ul>
 * Telnet 没有身份/口令与共享房间概念，这些参数只对 SSH 生效。
 *
 * <p>配色由后台持久化（{@code /ms/server/terminal/theme}），打开终端时以 iframe 参数
 * 一次性下发；运行中改配色走 postMessage 热更新，绝不改 iframe 的 src ——
 * 改 src 等于重载页面，SSH 会话会当场断掉。</p>
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { getAccessToken } from "@repo/utils";
import ScTerminalThemeDialog from "./ScTerminalThemeDialog.vue";
import {
  DEFAULT_TERMINAL_THEME,
  encodeThemeParam,
  getTerminalTheme,
  type TerminalTheme,
} from "../api/terminalTheme";

const props = defineProps<{
  connection: {
    hostId: number;
    hostName: string;
    protocol: string;
    identityId: number | null;
    targetPort: number | null;
    /** 共享终端房间号：带上即接入已有共享会话（同一 SSH 连接），不另开一条 */
    roomId?: string | null;
    /** 共享成员显示名（后端房间成员列表里展示） */
    userName?: string | null;
    /** 当前账号用户标识（后端按它判定共享记录里的写权限） */
    userId?: string | null;
    /** 当前账号是否有协同操作权限；false 时终端只读 */
    writable?: boolean;
  } | null;
  /** 由外层工具条接管断开时，隐藏 viewer 自带的「断开」按钮 */
  hideClose?: boolean;
}>();

/** 当前连接绑定的 iframe（供外层下发命令/文本到终端） */
const iframeEl = ref<HTMLIFrameElement | null>(null);

const emit = defineEmits<{
  (e: 'close'): void;
  /** 终端执行 pwd 后回传的当前目录（外层用来定位文件面板） */
  (e: 'cwd', cwd: string): void;
}>();

/**
 * iframe（/ssh-direct.html）里执行 `pwd` 后会把绝对路径 postMessage 上来。
 * 只认自己 iframe 发出的消息，避免同页其它组件的 postMessage 串台。
 */
function onIframeMessage(e: MessageEvent): void {
  if (e.source !== iframeEl.value?.contentWindow) return;
  const data = e.data as { type?: string; cwd?: unknown } | null;
  if (data && data.type === 'TERMINAL_CWD' && typeof data.cwd === 'string' && data.cwd.trim()) {
    emit('cwd', data.cwd.trim());
  }
}

/* ===== 终端配色 ===== */

/** 当前生效配色（保存过的那份；弹窗里的临时改动不进这里） */
const theme = ref<TerminalTheme>({ ...DEFAULT_TERMINAL_THEME });

/**
 * 参与 iframe src 的配色串。
 *
 * <p>只在首次渲染前写一次：iframe 的 src 一变浏览器就重载页面，SSH 会话会当场断开，
 * 所以「后读回来的配色」不能改它，只能走 {@link postTheme} 热更新。</p>
 */
const srcTheme = ref('');

/** 配色已定（读回来，或超时兜底）：定下来才渲染 iframe，避免先闪一下默认深色 */
const themeReady = ref(false);

/** 配色设置面板是否打开 */
const themeDialogVisible = ref(false);

/** 等待后台配色的兜底定时器 */
let themeTimer: number | undefined;

/**
 * 把配色推给正在运行的终端（iframe 里改 {@code term.options.theme} 并同步页面底色）。
 *
 * @param value 配色
 */
function postTheme(value: TerminalTheme): void {
  const frame = iframeEl.value;
  if (!frame?.contentWindow) return;
  try {
    // 必须给一份普通对象快照：传进来的常是 ref/computed 包出来的响应式代理，
    // 结构化克隆跨窗口时不该指望对方能读代理内部（也避免把响应式对象泄漏到 iframe）
    const snapshot = { ...value };
    frame.contentWindow.postMessage({ type: 'TERMINAL_THEME', theme: snapshot } as Record<string, unknown>, '*');
  } catch {
    // 后端静态页未实现该通道时不可见，颜色退回打开时的配色
  }
}

/**
 * 读取后台配色；接口失败/超时都退回默认配色，不能因为一个配色把终端挡在门外。
 */
async function loadTheme(): Promise<void> {
  let loaded: TerminalTheme | null = null;
  try {
    loaded = await getTerminalTheme();
  } catch {
    loaded = null;
  }
  if (loaded) theme.value = loaded;
  if (!themeReady.value) {
    srcTheme.value = encodeThemeParam(theme.value);
    themeReady.value = true;
    return;
  }
  // 超时兜底已经渲染了 iframe：用消息补一次（底色会跳一下，但连接不断）
  if (loaded) postTheme(loaded);
}

onMounted(() => {
  window.addEventListener('message', onIframeMessage);
  // 接口慢不能卡住终端：1.5s 内没读回来就先按默认配色渲染
  themeTimer = window.setTimeout(() => {
    if (themeReady.value) return;
    srcTheme.value = encodeThemeParam(theme.value);
    themeReady.value = true;
  }, 1500);
  void loadTheme();
});

onBeforeUnmount(() => {
  window.removeEventListener('message', onIframeMessage);
  if (themeTimer) window.clearTimeout(themeTimer);
});

/** 弹窗里改色：实时下发，调到满意再保存 */
function onThemePreview(value: TerminalTheme): void {
  postTheme(value);
}

/** 保存/恢复默认后：记住新配色并下发 */
function onThemeSaved(value: TerminalTheme): void {
  theme.value = value;
  postTheme(value);
}

// 弹窗关闭（取消或保存后关闭）时回到「已保存」的配色，撤掉临时预览
watch(themeDialogVisible, v => {
  if (!v) postTheme(theme.value);
});

// 换连接（重连/切主机）时 iframe 的 src 本来就要变，顺手把当前配色也写进去，
// 新终端首帧就是对的颜色，不必等 @load 再补
watch(
  () => props.connection,
  () => {
    srcTheme.value = encodeThemeParam(theme.value);
  },
);

/**
 * 向 iframe 中渲染的终端写入一行命令文本（终端在 iframe 里，只能跨窗口发消息）
 * 具体行为在 iframe 所属的页面（`/ssh-direct.html`）中实现；
 * 本端只负责把命令送到：
 *
 * ```js
 * // 发向 /ssh-direct.html 的约定消息
 * parent.postMessage({ type: 'TERMINAL_INPUT', command: 'ls -la && git status' }, '*')
 * ```
 * @param command 整行命令文本（回车与下发后的行为由 iframe 页面端的 xterm 负责，
 *                本端只把文本送到终端的输入口）
 */
function sendCommand(command: string): void {
  if (!command || !command.trim()) return;
  const frame = iframeEl.value;
  if (!frame || !frame.contentWindow) {
    return;
  }
  try {
    frame.contentWindow.postMessage({ type: 'TERMINAL_INPUT', command } as Record<string, unknown>, '*');
  } catch {
    // 后端 iframe 未实现该通道时（跨域/策略），对外不可见，由外层通过状态提示
  }
}

/**
 * 多条命令合并成一次下发（换行做界，终端按换行逐行执行）
 * @param commands 多条命令
 */
function sendCommands(commands: string[]): void {
  sendCommand(commands.join('\n'));
}

/** 暴露给外层的终端操作 */
defineExpose({
  /** 写入一行命令（追加换行，等价于执行） */
  sendCommand,
  /** 下发多条命令 */
  sendCommands,
});

/** 是否 Telnet 连接 */
const isTelnet = computed(() => (props.connection?.protocol ?? '').toLowerCase() === 'telnet');

/** iframe src：直连端点只需主机与身份定位，端口由后端按主机配置解析 */
const iframeSrc = computed(() => {
  const c = props.connection;
  if (!c) return '';
  const params = new URLSearchParams({ hostId: String(c.hostId) });
  // 配色随 src 一次性下发：iframe 首次渲染就得是对的颜色（晚一步会闪一下深色底）。
  // 值是 URL-safe base64，不含需要转义的字符。
  if (srcTheme.value) params.set('theme', srcTheme.value);
  if (isTelnet.value) {
    // Telnet 不带 identity/room/pwd 语义，只把目标端口透给后端解析
    if (c.targetPort != null) params.set('targetPort', String(c.targetPort));
    const telnetToken = getAccessToken();
    if (telnetToken) params.set('x-oauth-token', telnetToken);
    return `/telnet-direct.html?${params.toString()}`;
  }
  if (c.identityId != null) params.set('identityId', String(c.identityId));
  // 共享终端：roomId 接入已有房间；userId 让后端按共享记录判定写权限；
  // readonly 让 iframe 本地也不发包（后端同样会丢弃）
  if (c.roomId) {
    params.set('roomId', c.roomId);
    if (c.userName) params.set('user', c.userName);
    if (c.userId) params.set('userId', c.userId);
    if (c.writable === false) params.set('readonly', '1');
  }
  const token = getAccessToken();
  if (token) params.set('x-oauth-token', token);
  return `/ssh-direct.html?${params.toString()}`;
});

/** 只读态：状态条给明确提示，避免用户以为终端卡住 */
const readonly = computed(() => !!props.connection?.roomId && props.connection?.writable === false);
</script>

<template>
  <div class="ssh-wrap">
    <div v-if="connection" class="ssh-status">
      <span class="ssh-status-tag is-ok">
        {{ connection.hostName }} · {{ isTelnet ? 'TELNET 直连' : 'SSH 直连' }}
      </span>
      <span v-if="connection.roomId" class="ssh-status-tag" :class="readonly ? 'is-readonly' : 'is-shared'">
        {{ readonly ? '只读（无协同权限）' : '共享协同中' }}
      </span>
      <div class="ssh-actions">
        <!-- 配色是平台级设置：任何一条终端都能就地打开调整，改完对已开的终端实时生效 -->
        <button class="ssh-btn" type="button" title="调整终端配色" @click="themeDialogVisible = true">主题</button>
        <button v-if="!hideClose" class="ssh-btn" type="button" @click="emit('close')">断开</button>
      </div>
    </div>
    <iframe
      v-if="connection && themeReady"
      ref="iframeEl"
      :src="iframeSrc"
      class="ssh-iframe"
      :style="{ background: theme.background }"
      frameborder="0"
      allow="clipboard-read; clipboard-write; keyboard"
      @load="postTheme(theme)"
    />
    <ScTerminalThemeDialog
      v-model="themeDialogVisible"
      @preview="onThemePreview"
      @saved="onThemeSaved"
    />
  </div>
</template>

<style scoped lang="scss">
.ssh-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
}
.ssh-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 4px 0;
}
.ssh-status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  /* 原为 999px；胶囊形只需远超半高，改用 EP 的 full 档（9999px），视觉等价 */
  border-radius: var(--el-radius-full, 9999px);
  font-size: 12px;
  font-weight: 600;
}
/* 原来是写死的浅绿底 + 深绿字（#e6f4ea / #137333），暗色模式下会变成刺眼亮块；
   换成 EP 成功色浅底 + 深色档文字，亮暗色自动适配 */
.ssh-status-tag.is-ok { background: var(--el-color-success-light-9); color: var(--el-color-success-dark-2); }
/* 共享协同中：与「已连接」区分开，提示这条终端有他人一起看/一起操作 */
.ssh-status-tag.is-shared { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
/* 只读：私有共享未授权，给出显式提示而不是让用户怀疑卡住 */
.ssh-status-tag.is-readonly { background: var(--el-color-warning-light-9); color: var(--el-color-warning-dark-2); }
.ssh-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ssh-btn {
  padding: 3px 14px;
  font-size: 12px;
  /* 原来的 --text-secondary / --border-subtle / --brand-* 全仓无人定义（只有兜底 hex 生效），
     等于写死颜色；这里统一换成 EP 真实存在的语义令牌 */
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xs, 4px);
  cursor: pointer;
  /* 原生 button：去掉浏览器默认轮廓，改用全站统一的自绘焦点环 */
  outline: none;
  transition:
    color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.ssh-btn:hover { color: var(--el-color-primary); border-color: var(--el-color-primary-light-5); }
/* 原生 button：自绘焦点环 */
.ssh-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.ssh-iframe {
  flex: 1;
  width: 100%;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  /* iframe 加载前看到的底色；真正显示的是 xterm 的 theme.background：
     跟着用户在设置面板里选的配色走（行内 style 会覆盖这里的 #111） */
  background: #111;
  min-height: 300px;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .ssh-btn {
    transition: none;
  }
}
</style>
