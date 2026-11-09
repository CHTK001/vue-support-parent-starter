<script setup lang="ts">
/**
 * RDP 直连渲染组件 —— iframe 嵌入后端静态页 `/rdp-direct.html`
 *
 * 与 guacd 中转的分工：本组件不经过 guacd，页面通过 WebSocket 直连
 * `/ws/ms/server/terminal/rdp`，由后端 `RdpDirectWebSocketHandler` 调用
 * rdpj.dll（FreeRDP 3.x 原生桥）接出到目标 RDP 服务器；
 * 画面按「32 字节帧头 + 脏行 BGRA」推给 canvas，键鼠事件以 JSON 文本帧回传。
 */
import { computed } from 'vue';
import { getAccessToken } from '@repo/utils';

const props = defineProps<{
  connection: {
    hostId: number;
    hostName: string;
    protocol: string;
    identityId?: number | null;
    targetPort?: number | null;
    /** 申请的分辨率：缺省 1280×800，服务端会按协商结果回推真实尺寸 */
    width?: number | null;
    height?: number | null;
  } | null;
  /** 由外层工具条接管断开时，隐藏 viewer 自带的「断开」按钮 */
  hideClose?: boolean;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

/** iframe 地址：只带定位信息与申请分辨率，凭据由后端按主机台账解析 */
const iframeSrc = computed(() => {
  const c = props.connection;
  if (!c) return '';
  const params = new URLSearchParams({
    hostId: String(c.hostId),
    width: String(c.width && c.width > 0 ? c.width : 1280),
    height: String(c.height && c.height > 0 ? c.height : 800),
  });
  if (c.identityId != null) params.set('identityId', String(c.identityId));
  const token = getAccessToken();
  if (token) params.set('x-oauth-token', token);
  return `/rdp-direct.html?${params.toString()}`;
});
</script>

<template>
  <div class="rdp-wrap">
    <div v-if="connection" class="rdp-status">
      <span class="rdp-status-tag is-ok">{{ connection.hostName }} · RDP 直连</span>
      <span class="rdp-status-hint">点击画面后即可使用键盘鼠标</span>
      <div class="rdp-actions">
        <button v-if="!hideClose" class="rdp-btn" type="button" @click="emit('close')">断开</button>
      </div>
    </div>
    <iframe
      v-if="connection"
      :src="iframeSrc"
      class="rdp-iframe"
      frameborder="0"
      allow="clipboard-read; clipboard-write; keyboard; fullscreen"
    />
  </div>
</template>

<style scoped lang="scss">
.rdp-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
}
.rdp-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 4px 0;
}
.rdp-status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--el-radius-full, 9999px);
  font-size: 12px;
  font-weight: 600;
}
.rdp-status-tag.is-ok { background: var(--el-color-success-light-9); color: var(--el-color-success-dark-2); }
.rdp-status-hint { font-size: 12px; color: var(--el-text-color-secondary); }
.rdp-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}
.rdp-btn {
  padding: 3px 14px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xs, 4px);
  cursor: pointer;
  outline: none;
  transition:
    color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
}
.rdp-btn:hover { color: var(--el-color-primary); border-color: var(--el-color-primary-light-5); }
.rdp-btn:focus-visible { box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent); }
.rdp-iframe {
  flex: 1;
  width: 100%;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: #0b0d10;
  min-height: 300px;
}
@media (prefers-reduced-motion: reduce) {
  .rdp-btn { transition: none; }
}
</style>
