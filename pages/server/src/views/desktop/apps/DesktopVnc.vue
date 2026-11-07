<!--
  /**
   * 虚拟桌面 · 远程桌面窗口（VNC）
   *
   * <p>复用「远程控制」页的 noVNC 直连组件：WS 走
   * {@code /ws/ms/server/terminal/vnc}，凭据由后端按台账解出，
   * 桌面壳这边只负责把 hostId / 端口递进去。</p>
   *
   * <p>只在台账远控协议是 VNC 的主机上出现（见 DesktopView 的 dockApps），
   * 所以这里不再做协议判定，避免两处口径分叉。</p>
   */
  -->
<template>
  <div class="dvnc">
    <ScVncDirectViewer :connection="connection" hide-close />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ScVncDirectViewer from "../../../components/ScVncDirectViewer.vue";

const props = defineProps<{
  /** 主机标识 */
  hostId: number;
  /** 主机名（状态栏文案） */
  hostName?: string;
  /** 台账远控端口（VNC 自己的端口，空则后端回落 5900） */
  remotePort?: number | null;
  /** 窗口是否处于前台（保留给后续自动重连用） */
  active?: boolean;
}>();

/** noVNC 组件要求的连接描述 */
const connection = computed(() => ({
  hostId: props.hostId,
  hostName: props.hostName ?? "",
  protocol: "vnc",
  targetPort: props.remotePort ?? null,
}));
</script>

<style scoped>
.dvnc {
  display: flex;
  flex: 1;
  min-height: 0;
  height: 100%;
  background: #120510;
}

.dvnc :deep(.sc-vnc) {
  height: 100%;
}
</style>
