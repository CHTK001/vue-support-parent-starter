<script setup lang="ts">
/**
 * 主机工作台 —— 分屏终端 + Docker/K8s + 隧道（真实版）
 *
 * <p>这是分屏终端工作台的落地容器，嵌入 AssetsView 工作区页签：</p>
 * <ul>
 *   <li><b>分屏终端</b>：多屏自由画布，每屏是真终端（SSH 直连 / VNC / Guacd），
 *       每屏底部工具条跟着屏幕走。</li>
 *   <li><b>Docker · K8s</b>：点分屏里某屏的 Docker 工具条进入，以该屏主机为上下文，
 *       能力门控（没装不显示）。</li>
 *   <li><b>隧道</b>：同上，点隧道工具条进入对应主机。</li>
 * </ul>
 *
 * <p>Docker/K8s 与隧道后端接口尚未提供，这两个面板目前是 mock 形态
 * （{@code ScDockerK8sWorkbench} / {@code ScTunnelWorkbench}）；分屏终端是
 * 真实连接。后端接口到位后，把两个面板的数据源换成真实 API 即可。</p>
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
  }>(),
  { start: "screen" },
);

/** 当前面板 */
const panel = ref<Panel>(props.start || "screen");
/** Docker/隧道面板的上下文主机 */
const panelHost = ref("");

function onOpenPanel(p: "docker" | "tunnel", hostId: number, hostName: string): void {
  panelHost.value = hostName || `#${hostId}`;
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
        :host="panelHost || 'web-01'"
        @back="backToScreen"
      />
      <ScTunnelWorkbench
        v-else-if="panel === 'tunnel'"
        :host="panelHost || 'web-01'"
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