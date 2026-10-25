<script setup lang="ts">
/**
 * 主机工作台 —— 分屏终端 + Docker/K8s + 隧道（真实版）
 *
 * <p>这是分屏终端工作台的落地容器，嵌入 AssetsView 工作区页签：</p>
 * <ul>
 *   <li><b>分屏终端</b>：多屏自由画布，每屏是真终端（SSH 直连 / VNC / Guacd），
 *       每屏底部工具条跟着屏幕走。</li>
 *   <li><b>Docker · K8s</b>：点分屏里某屏的 Docker 工具条进入，以该屏主机为上下文，
 *       能力门控（没装不显示）；数据走后端
 *       {@code /ms/server/host/{id}/docker|kubernetes}（SSH 执行 CLI）。</li>
 *   <li><b>隧道</b>：同上，点隧道工具条进入对应主机。</li>
 * </ul>
 *
 * <p>Docker/K8s 已接真实后端；隧道面板仍是 mock（后端隧道接口尚未提供）。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { ref, watch } from "vue";
import ScRealScreenWorkbench from "../components/lab/ScRealScreenWorkbench.vue";
import ScDockerK8sWorkbench from "../components/lab/ScDockerK8sWorkbench.vue";
import ScTunnelWorkbench from "../components/lab/ScTunnelWorkbench.vue";

type Panel = "screen" | "docker" | "tunnel";

const props = withDefaults(
  defineProps<{
    /** 初始面板（从右键菜单直入时定位 Docker / 隧道） */
    start?: "screen" | "docker" | "tunnel";
    /** 工作台所在页签绑定的主机 id（进入 Docker/隧道面板的默认上下文） */
    hostId?: number;
    /** 工作台所在页签绑定的主机名（无分屏上下文时显示用） */
    hostName?: string;
  }>(),
  { start: "screen", hostId: 0, hostName: "" },
);

/** 当前面板 */
const panel = ref<Panel>(props.start || "screen");
/** Docker/隧道面板的上下文主机（分屏工具条优先，其次页签绑定主机） */
const panelHostId = ref(props.hostId || 0);
const panelHost = ref(props.hostName || "");

function onOpenPanel(p: "docker" | "tunnel", hostId: number, hostName: string): void {
  panelHostId.value = hostId || props.hostId || 0;
  panelHost.value = hostName || props.hostName || `#${hostId || props.hostId}`;
  panel.value = p;
}

function backToScreen(): void {
  panel.value = "screen";
}

watch(
  () => props.start,
  (s) => {
    if (s) panel.value = s;
  },
);
</script>

<template>
  <div class="wb">
    <!-- 页头：面板切换（分屏是主舞台，Docker/隧道可一键回来） -->
    <div class="wb-head">
      <div class="lb-seg">
        <button
          type="button"
          class="lb-seg__btn"
          :class="{ 'is-active': panel === 'screen' }"
          @click="panel = 'screen'"
        >
          <ReIcon name="Monitor" :size="12" />分屏终端
        </button>
        <button
          type="button"
          class="lb-seg__btn"
          :class="{ 'is-active': panel === 'docker' }"
          @click="panel = 'docker'"
        >
          <ReIcon name="Box" :size="12" />Docker · K8s
        </button>
        <button
          type="button"
          class="lb-seg__btn"
          :class="{ 'is-active': panel === 'tunnel' }"
          @click="panel = 'tunnel'"
        >
          <ReIcon name="Connection" :size="12" />隧道
        </button>
      </div>
      <span class="wb-panel-desc">
        {{ panel === 'screen' ? '多服务器终端并排 · 每屏独立底部工具条' : panel === 'docker' ? `Docker · Kubernetes（${panelHost || '主机'}）` : `隧道 · 反向隧道（${panelHost || '主机'}）` }}
      </span>
    </div>

    <div class="wb-body">
      <ScRealScreenWorkbench
        v-show="panel === 'screen'"
        @open-panel="onOpenPanel"
      />
      <ScDockerK8sWorkbench
        v-if="panel === 'docker'"
        :host-id="panelHostId"
        :host-name="panelHost || props.hostName || 'web-01'"
        @back="backToScreen"
      />
      <ScTunnelWorkbench
        v-else-if="panel === 'tunnel'"
        :host-id="panelHostId"
        :host-name="panelHost || props.hostName || 'web-01'"
        @back="backToScreen"
      />
    </div>
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
  gap: 8px;
}
.wb-head {
  display: flex;
  flex: none;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 10px;
}
.wb-panel-desc {
  font-size: 11.5px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.wb-body {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
}
.wb-body > * {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
</style>