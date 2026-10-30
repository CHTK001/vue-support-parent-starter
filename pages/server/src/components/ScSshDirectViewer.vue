<script setup lang="ts">
/**
 * SSH 直连渲染组件 —— iframe 嵌入后端静态页 /ssh-direct.html
 *
 * 与 ScGuacViewer 的分工：本组件不经过 guacd，页面内的 xterm 直接对接
 * 平台自研的 /ws/ms/server/terminal/ssh 端点（MINA SSHD PTY 桥接）。
 */
import { computed, ref } from 'vue';
import { getAccessToken } from "@repo/utils";

const props = defineProps<{
  connection: {
    hostId: number;
    hostName: string;
    protocol: string;
    identityId: number | null;
    targetPort: number | null;
  } | null;
  /** 由外层工具条接管断开时，隐藏 viewer 自带的「断开」按钮 */
  hideClose?: boolean;
}>();

/** 当前连接绑定的 iframe（供外层下发命令/文本到终端） */
const iframeEl = ref<HTMLIFrameElement | null>(null);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'files'): void;
}>();

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

/** iframe src：直连端点只需主机与身份定位，端口由后端按主机配置解析 */
const iframeSrc = computed(() => {
  const c = props.connection;
  if (!c) return '';
  const params = new URLSearchParams({ hostId: String(c.hostId) });
  if (c.identityId != null) params.set('identityId', String(c.identityId));
  const token = getAccessToken();
  if (token) params.set('x-oauth-token', token);
  return `/ssh-direct.html?${params.toString()}`;
});
</script>

<template>
  <div class="ssh-wrap">
    <div v-if="connection" class="ssh-status">
      <span class="ssh-status-tag is-ok">
        {{ connection.hostName }} · SSH 直连
      </span>
      <div class="ssh-actions">
        <button v-if="!hideClose" class="ssh-btn" type="button" @click="emit('close')">断开</button>
        <button class="ssh-btn ssh-btn--files" type="button" title="打开 SFTP 文件面板" @click="emit('files')">文件</button>
      </div>
    </div>
    <iframe
      v-if="connection"
      ref="iframeEl"
      :src="iframeSrc"
      class="ssh-iframe"
      frameborder="0"
      allow="clipboard-read; clipboard-write; keyboard"
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
.ssh-btn--files {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}
.ssh-btn--files:hover { background: color-mix(in srgb, var(--el-color-primary) 8%, transparent); }
.ssh-iframe {
  flex: 1;
  width: 100%;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  /* 刻意保留 #111：iframe 里跑的是 xterm 终端，固定深底才能保证终端配色对比度，
     不能跟随主题切成浅底 */
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
