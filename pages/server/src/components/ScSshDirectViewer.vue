<script setup lang="ts">
/**
 * SSH 直连渲染组件 —— iframe 嵌入后端静态页 /ssh-direct.html
 *
 * 与 ScGuacViewer 的分工：本组件不经过 guacd，页面内的 xterm 直接对接
 * 平台自研的 /ws/ms/server/terminal/ssh 端点（MINA SSHD PTY 桥接）。
 */
import { computed } from 'vue';

const props = defineProps<{
  connection: {
    hostId: number;
    hostName: string;
    protocol: string;
    identityId: number | null;
    targetPort: number | null;
  } | null;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

/** iframe src：直连端点只需主机与身份定位，端口由后端按主机配置解析 */
const iframeSrc = computed(() => {
  const c = props.connection;
  if (!c) return '';
  const params = new URLSearchParams({ hostId: String(c.hostId) });
  if (c.identityId != null) params.set('identityId', String(c.identityId));
  return `/ssh-direct.html?${params.toString()}`;
});
</script>

<template>
  <div class="ssh-wrap">
    <div v-if="connection" class="ssh-status">
      <span class="ssh-status-tag is-ok">
        {{ connection.hostName }} · SSH 直连
      </span>
      <button class="ssh-close" type="button" @click="emit('close')">断开</button>
    </div>
    <iframe
      v-if="connection"
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
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.ssh-status-tag.is-ok { background: #e6f4ea; color: #137333; }
.ssh-close {
  margin-left: auto;
  padding: 2px 12px;
  font-size: 12px;
  color: var(--text-secondary, #606266);
  background: transparent;
  border: 1px solid var(--border-subtle, #dcdfe6);
  border-radius: 4px;
  cursor: pointer;
}
.ssh-close:hover { color: var(--brand-600, #5a4ae0); border-color: var(--brand-400, #8b7ffb); }
.ssh-iframe {
  flex: 1;
  width: 100%;
  border: none;
  border-radius: 8px;
  background: #111;
  min-height: 300px;
}
</style>
