<!--
  临时验收页：验证 ReFlowGraph 本轮新增的细粒度开关与自定义节点体。
  验收通过后连同 routes.ts 的临时路由一起删除，不进版本库。
-->
<script setup lang="ts">
import { ref } from "vue";
import { h } from "vue";
import ReFlowGraph from "@repo/ui/re-flow-graph";
import type {
  FlowGraphData,
  FlowGraphEngine,
  FlowMenuItem,
  FlowNodeTypeDef,
} from "@repo/ui/re-flow-graph";

/** 开始节点带 image，专门验 <img> 分支；任务/结束只有 path，验回退分支 */
const NODE_TYPES: FlowNodeTypeDef[] = [
  { type: "start", label: "开始", color: "#31d0c6", image: "/favicon.ico" },
  { type: "task", label: "任务", color: "#4f7cff" },
  { type: "end", label: "结束", color: "#c9403f" },
];

const DATA: FlowGraphData = {
  nodes: [
    { id: "n1", type: "start", label: "开始", x: 60, y: 60 },
    { id: "n2", type: "task", label: "采集", x: 300, y: 60 },
    { id: "n3", type: "end", label: "结束", x: 540, y: 60 },
  ],
  edges: [
    { id: "e1", from: "n1", to: "n2", fromPort: "right", toPort: "left" },
    { id: "e2", from: "n2", to: "n3", fromPort: "right", toPort: "left" },
  ],
};

/** 自定义节点体：证明 nodeComponent 真的接管了渲染 */
const CustomCard = {
  name: "ProbeCustomCard",
  props: ["node"],
  render(this: { node: { getData(): Record<string, unknown> } }) {
    const d = this.node.getData() as { flowLabel?: string };
    return h("div", { class: "probe-card" }, d.flowLabel ?? "?");
  },
};

const engine = ref<FlowGraphEngine | null>(null);
const ui = ref({
  showMinimap: false,
  panning: true,
  zoom: true,
  nodeDraggable: true,
  menu: "default",
});
/** 自定义项被点后回显，验收脚本读它确认 onClick 真的透传了 */
const lastAction = ref("");

const MENUS: Record<string, FlowMenuItem[]> = {
  default: [
    { key: "rename", label: "重命名", action: "rename" },
    { key: "locate", label: "定位", action: "locate" },
    { key: "copy", label: "复制", action: "copy" },
    { key: "delete", label: "删除", action: "delete", danger: true },
  ],
  custom: [
    { key: "hi", label: "自定义项", onClick: (c) => (lastAction.value = `hi:${c.node.id}@${Math.round(c.event.clientX)}`) },
    { key: "no", label: "禁用项", disabled: true },
    { key: "rm", label: "走内置删除", action: "delete", danger: true },
  ],
  none: [],
};

function toggle(k: "showMinimap" | "panning" | "zoom" | "nodeDraggable") {
  ui.value[k] = !ui.value[k];
}

function cycleMenu() {
  ui.value.menu = ui.value.menu === "default" ? "custom" : ui.value.menu === "custom" ? "none" : "default";
}
</script>

<template>
  <div class="probe-bar">
    <button id="t-minimap" :data-v="String(ui.showMinimap)" @click="toggle('showMinimap')">缩略图</button>
    <button id="t-panning" :data-v="String(ui.panning)" @click="toggle('panning')">平移</button>
    <button id="t-zoom" :data-v="String(ui.zoom)" @click="toggle('zoom')">缩放</button>
    <button id="t-drag" :data-v="String(ui.nodeDraggable)" @click="toggle('nodeDraggable')">拖拽</button>
    <button id="t-menu" :data-v="ui.menu" @click="cycleMenu">菜单</button>
    <span id="probe-last">{{ lastAction }}</span>
    <span id="probe-nodes">{{ engine ? engine.getData().nodes.length : -1 }}</span>
  </div>
  <ReFlowGraph
    :data="DATA"
    :node-types="NODE_TYPES"
    height="600px"
    :show-minimap="ui.showMinimap"
    :panning="ui.panning"
    :zoom="ui.zoom"
    :node-draggable="ui.nodeDraggable"
    :menu-items="MENUS[ui.menu]"
    @ready="(e: FlowGraphEngine) => (engine = e)"
  />
</template>

<style scoped>
.probe-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px;
}
</style>
