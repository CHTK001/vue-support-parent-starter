<script setup lang="ts">
/**
 * 主机工作台 —— 单面板容器（拆分版）
 *
 * <p>分屏终端 / K8s / 隧道 / 反向隧道 各自是独立页签，一个页签只渲染
 * 一种面板，不再在页内做二级切换（用户要求「工作台的都分开」）。页签由右键菜单
 * 直接指定 {@code start}，本组件按 start 只渲染对应面板。</p>
 *
 * <p>Docker 是<b>这台主机的页签</b>：主机行右键「工作台 → Docker」与分屏工具条
 * 都会打开 {@code start="docker"} 的工作台页签，页内复用独立页面包
 * {@code @pages/docker} 的双栏实现（左容器清单 + 右工作区），主机由页签上下文锁定。</p>
 *
 * <p>分屏终端里点某屏底部的 K8s / 隧道工具条时，不再页内切换，而是把
 * {@code open-panel} 上抛给 AssetsView，由它开一个独立页签 —— 保持「一个功能一个页签」。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import ScRealScreenWorkbench from "../components/lab/ScRealScreenWorkbench.vue";
import ScDockerK8sWorkbench from "../components/lab/ScDockerK8sWorkbench.vue";
import ScTunnelWorkbench from "../components/lab/ScTunnelWorkbench.vue";
// Docker 页面本体来自独立页面包；宿主（monitor-starter）已把 @pages/docker 指到 pages/docker/src，
// 这里直接复用同一份双栏实现，不在 pages/server 里再维护一份卡片墙。
import DockerView from "@pages/docker/src/views/DockerView.vue";

/** 工作台面板类型（每个对应一个独立页签） */
export type WorkbenchPanel = "screen" | "docker" | "k8s" | "tunnel" | "tunnel-reverse";

const props = withDefaults(
  defineProps<{
    /** 本页签要渲染的面板 */
    start?: WorkbenchPanel;
    /** 页签绑定的主机 id（Docker/K8s/隧道面板的上下文主机） */
    hostId?: number;
    /** 页签绑定的主机名（展示用） */
    hostName?: string;
  }>(),
  { start: "screen", hostId: 0, hostName: "" },
);

const emit = defineEmits<{
  /** 分屏里点工具条：请父级按该面板开新页签 */
  (e: "open-panel", panel: "docker" | "k8s" | "tunnel" | "tunnel-reverse", hostId: number, hostName: string): void;
}>();

/** 分屏工具条 → 上抛父级开新页签 */
function onOpenPanel(
  panel: "docker" | "k8s" | "tunnel" | "tunnel-reverse",
  hostId: number,
  hostName: string,
): void {
  emit("open-panel", panel, hostId, hostName);
}
</script>

<template>
  <div class="wb">
    <!-- 分屏终端 -->
    <ScRealScreenWorkbench
      v-if="props.start === 'screen'"
      :host-id="props.hostId"
      :host-name="props.hostName"
      @open-panel="onOpenPanel"
    />
    <!-- Docker（页签形态：复用独立页面包的双栏实现，主机锁定） -->
    <DockerView
      v-else-if="props.start === 'docker'"
      :host-id="props.hostId"
    />
    <!-- K8s -->
    <ScDockerK8sWorkbench
      v-else-if="props.start === 'k8s'"
      domain="k8s"
      :host-id="props.hostId"
      :host-name="props.hostName"
    />
    <!-- 隧道（正向） -->
    <ScTunnelWorkbench
      v-else-if="props.start === 'tunnel'"
      mode="forward"
      :host-id="props.hostId"
      :host-name="props.hostName"
    />
    <!-- 反向隧道 -->
    <ScTunnelWorkbench
      v-else
      mode="reverse"
      :host-id="props.hostId"
      :host-name="props.hostName"
    />
  </div>
</template>

<style scoped lang="scss">
@use "../components/lab/_lab-kit.scss";

.wb {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.wb > * {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
</style>