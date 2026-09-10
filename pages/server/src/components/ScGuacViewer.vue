<script setup lang="ts">
/**
 * guacd 远控渲染组件（改为后端生成 URL——iframe 嵌入——前端不再自己实现 Guacamole 客户端）
 *
 * 后端 /ms/server/remote/connect 生成远程控制页面（内嵌 guacamole-common-js 客户端，
 * 连现有 /ws/ms/server/terminal 隧道——guacd 地址由系统配置表动态提供），
 * 此处仅嵌入该 URL。
 */
import { computed, ref, watch } from 'vue';

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

const visible = ref(false);

watch(
  () => props.connection,
  conn => {
    visible.value = !!conn;
  },
);

watch(
  visible,
  show => {
    if (!show) emit('close');
  },
);

/** 后端生成的远程控制页面 URL（前端只嵌入——不自己实现） */
const iframeUrl = computed(() => {
  const c = props.connection;
  if (!c) return '';
  const q = new URLSearchParams({
    hostId: String(c.hostId),
    protocol: c.protocol,
    ...(c.identityId != null ? { identityId: String(c.identityId) } : {}),
    ...(c.targetPort != null ? { targetPort: String(c.targetPort) } : {}),
  });
  return `/ms/server/remote/connect?${q.toString()}`;
});
</script>

<template>
  <ReDrawer
    v-model="visible"
    :title="`远程控制 - ${connection?.hostName ?? ''}`"
    direction="btt"
    :size="'92%'"
    :footer-hidden="true"
    close-only
  >
    <template #content>
      <div class="guac-wrap">
        <div class="guac-status">
          <ReTag type="info" size="small">嵌入远程控制页面</ReTag>
          <ReText size="small" type="info">{{ connection?.protocol.toUpperCase() }}</ReText>
        </div>
        <div class="guac-display">
          <iframe v-if="iframeUrl" :src="iframeUrl" class="guac-frame" title="远程控制" />
        </div>
      </div>
    </template>
  </ReDrawer>
</template>

<style scoped lang="scss">
.guac-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
}
.guac-status {
  display: flex;
  align-items: center;
  gap: 8px;
}
.guac-display {
  flex: 1;
  background: var(--terminal-bg);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}
.guac-frame {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
</style>
