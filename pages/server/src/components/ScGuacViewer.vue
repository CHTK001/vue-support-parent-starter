<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import type { SpecialKeyStep } from './specialKeys';

/**
 * guacd 远控渲染组件 —— iframe 嵌入本地 /remote.html 页面
 *
 * 后端集中管理 guacamole-common-js 客户端 + WS 隧道，
 * 前端只负责拼 URL 和容器尺寸。
 *
 * inline=true 时直接在父容器内渲染（终端页右侧主区域），
 * inline=false 时以 ReDrawer 弹出（资产页等独立场景）。
 *
 * 父组件可通过模板 ref 调用 {@link sendSpecialKey} 下发
 * 本机 OS 会截获的特殊组合键（Ctrl+Alt+Del 等），经 postMessage 交给
 * iframe 内的 Guacamole 客户端发送。
 */

const props = defineProps<{
  connection: {
    hostId: number;
    hostName: string;
    protocol: string;
    identityId: number | null;
    targetPort: number | null;
    /** 远控通道；DIRECT 由 ScSshDirectViewer 接管，本组件只处理 GUACD */
    mode?: string | null;
  } | null;
  /** inline 模式：不包 drawer，直接渲染在父容器内 */
  inline?: boolean;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

const drawerVisible = ref(false);

/** 拼接 iframe src：使用本地 remote.html 页面 */
const iframeSrc = computed(() => {
  const c = props.connection;
  if (!c) return '';
  const params = new URLSearchParams({
    hostId: String(c.hostId),
    protocol: c.protocol,
  });
  if (c.identityId != null) params.set('identityId', String(c.identityId));
  if (c.targetPort != null) params.set('targetPort', String(c.targetPort));
  return `/remote.html?${params.toString()}`;
});

/** 内嵌远控页 iframe（drawer / inline 二选一挂载，共用同一 ref） */
const iframeRef = ref<HTMLIFrameElement | null>(null);

/**
 * 向 iframe 内的 Guacamole 客户端下发特殊按键序列
 *
 * 本机操作系统会截获 Ctrl+Alt+Del / Alt+Tab / Win 等组合，浏览器键盘事件
 * 无法透传到被控端；由远控工具条显式调用本方法，经 postMessage 让页内客户端
 * 直接构造 Guacamole key 指令。
 *
 * @param keys 按键序列（按顺序按下，客户端会逆序松开）
 */
function sendSpecialKey(keys: SpecialKeyStep[]): void {
  const win = iframeRef.value?.contentWindow;
  if (!win || !keys?.length) return;
  win.postMessage({ source: 'sc-remote', type: 'send-special-key', keys }, window.location.origin);
}

defineExpose({ sendSpecialKey });

/** iframe 加载完成后触发 resize，确保 guacd 客户端拿到正确尺寸 */
function onIframeLoad(): void {
  nextTick(() => {
    setTimeout(() => {
      const iframe = document.querySelector('.guac-iframe') as HTMLIFrameElement | null;
      iframe?.contentWindow?.dispatchEvent(new Event('resize'));
    }, 200);
    setTimeout(() => {
      const iframe = document.querySelector('.guac-iframe') as HTMLIFrameElement | null;
      iframe?.contentWindow?.dispatchEvent(new Event('resize'));
    }, 800);
  });
}

// drawer 模式：connection 变化时开关抽屉
if (!props.inline) {
  // drawer 模式下不需要复杂逻辑，v-model 控制即可
}

</script>

<template>
  <!-- drawer 模式：从底部弹出 -->
  <ReDrawer
    v-if="!inline"
    v-model="drawerVisible"
    :title="`远程控制 - ${connection?.hostName ?? ''}`"
    direction="btt"
    :size="'92%'"
    :footer-hidden="true"
    close-only
    @close="emit('close')"
  >
    <template #content>
      <iframe
        ref="iframeRef"
        v-if="connection"
        :src="iframeSrc"
        class="guac-iframe"
        frameborder="0"
        allow="clipboard-read; clipboard-write; keyboard"
        @load="onIframeLoad"
      />
    </template>
  </ReDrawer>

  <!-- inline 模式：直接渲染在父容器内 -->
  <div v-else class="guac-wrap guac-wrap--inline">
    <div v-if="connection" class="guac-status">
      <span class="guac-status-tag is-ok">
        {{ connection.hostName }} · {{ connection.protocol.toUpperCase() }}
      </span>
    </div>
    <iframe
      ref="iframeRef"
      v-if="connection"
      :src="iframeSrc"
      class="guac-iframe"
      frameborder="0"
      allow="clipboard-read; clipboard-write; keyboard"
      @load="onIframeLoad"
    />
  </div>
</template>

<style scoped lang="scss">
.guac-wrap--inline {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
}
.guac-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 4px 0;
}
.guac-status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.guac-status-tag.is-ok { background: #e6f4ea; color: #137333; }
.guac-iframe {
  flex: 1;
  width: 100%;
  border: none;
  border-radius: 8px;
  background: #111;
  min-height: 300px;
}
</style>
