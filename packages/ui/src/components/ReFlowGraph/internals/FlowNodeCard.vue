<script setup lang="ts">
/**
 * FlowNodeCard —— 画布节点的卡片体
 *
 * 对应 X6 官方 DAG 示例（https://x6.antv.antgroup.com/examples/showcase/practices/#dag ，
 * 源码 site/examples/showcase/practices/demo/dag.tsx）里的 `AlgoNode`：官方用
 * `@antv/x6-react-shape` 把节点体交给 React 组件渲染，本组件用 Vue 侧的对应物
 * `@antv/x6-vue-shape` 注册，视觉同样是一张 180×36 的横向卡片 —— 白底、1px 描边、
 * 左侧 4px 主色竖条、20×20 图标 + 文本标签。
 *
 * 之所以自己订阅 `change:data` 而不等 vue-shape 重渲：`x6-vue-shape` 是用
 * `createApp` 把本组件挂到 `<foreignObject>` 里的，`node` 只是普通 prop、不是响应式，
 * 且 x6 的 `NodeView.confirmUpdate` 不会因为 `setData` 带上 `vue` action
 * （见 node_modules/@antv/x6-vue-shape/es/view.js 与 x6/es/view/node.js）。
 * 所以 `updateNode()` 改了 label / 颜色 / 图标后，必须靠这里的订阅把新值读进 state，
 * 否则画布上的名字不会跟着变。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Graph, Node } from "@antv/x6";

/** vue-shape 注入的 X6 节点实例 */
const props = defineProps<{ node: Node; graph: Graph }>();

/** 卡片上真正要显示的东西；每次 change:data 整体重算 */
interface CardState {
  /** 节点类型标识 */
  type: string;
  /** 显示名，用户可改 */
  label: string;
  /** 类型中文名，作为标签右侧的弱化说明 */
  typeLabel: string;
  /** 左侧竖条与图标底色 */
  color: string;
  /** 24×24 描边 path */
  icon: string;
  /** 节点图片 URL；非空时优先于 icon 渲染 <img> */
  image: string;
  /** 回放/校验描边色；空串表示不启用状态描边 */
  strokeColor: string;
  /** 回放/校验描边粗细（px） */
  strokeWidth: number;
}

const state = ref<CardState>({
  type: "",
  label: "",
  typeLabel: "",
  color: "#4f7cff",
  icon: "",
  image: "",
  strokeColor: "",
  strokeWidth: 1.5,
});

/** 从节点 data 读出卡片状态 */
function read(): CardState {
  const data = (props.node.getData() ?? {}) as {
    flowType?: string;
    flowLabel?: string;
    flowTypeLabel?: string;
    flowColor?: string;
    flowIcon?: string;
    flowImage?: string;
    flowStrokeColor?: string;
    flowStrokeWidth?: number;
  };
  return {
    type: data.flowType ?? "default",
    label: data.flowLabel ?? "",
    typeLabel: data.flowTypeLabel ?? "",
    color: data.flowColor || "#4f7cff",
    icon: data.flowIcon || "",
    image: data.flowImage || "",
    strokeColor: data.flowStrokeColor ?? "",
    strokeWidth: data.flowStrokeWidth ?? 1.5,
  };
}

/** 状态描边只加粗高亮边框，不改变节点白底和图标底色 */
const cardStyle = computed(() => {
  const style: Record<string, string> = {};
  if (state.value.strokeColor) {
    style.borderColor = state.value.strokeColor;
    style.borderWidth = `${state.value.strokeWidth}px`;
    style.boxShadow = `0 0 0 1px ${state.value.strokeColor} inset, 0 2px 5px 1px rgba(0, 0, 0, 0.06)`;
  } else {
    style.borderLeftColor = state.value.color;
  }
  return style;
});

state.value = read();

/**
 * 类型标签只在与显示名**不同**时才占位。
 *
 * 调色板里 `typeLabel` 多半就等于新建时的 label（如「HTTP 请求」），照原样再渲染一遍
 * 就是「HTTP 请求  HTTP 请求」的噪声；但用户改名后它又是唯一能看出节点类型的线索，
 * 所以判据是「不相等才显示」，不是「非空才显示」。
 */
function kindOf(): string {
  const s = state.value;
  if (!s.typeLabel || s.typeLabel === s.label) {
    return "";
  }
  return s.typeLabel;
}

/** data 变了就把新值读进 state，触发重绘 */
function sync() {
  const next = read();
  // 换图时要复位「加载失败」标记，否则上一张图裂了之后换张好图也永远显示不出来
  if (next.image !== state.value.image) {
    imageBroken.value = false;
  }
  state.value = next;
}

/** 图片 URL 是否已加载失败；失败则回落到 SVG path */
const imageBroken = ref(false);

// 首次挂载后订阅。onMounted 之前 getData 已可读，故 state 的初值在 setup 里就填好，
// 避免「先渲染空卡片再补数据」造成的一帧闪烁。
onMounted(() => {
  props.node.on("change:data", sync);
});

onBeforeUnmount(() => {
  props.node.off("change:data", sync);
});

// 兜底：若 vue-shape 未来改成把 node 换成新引用，靠 watch 也能补一次同步
watch(() => props.node, sync);
</script>

<template>
  <!--
    官方 CSS 是 `.node`；这里用 `flow-node-card` 以免与宿主页面样式串味。
    宽度/高度必须写死成 100%：foreignObject 内的根元素要铺满 X6 给的 180×36 盒子。
  -->
  <div class="flow-node-card" :style="cardStyle">
    <span class="flow-node-icon" :style="{ background: state.color }">
      <!--
        图片优先于 SVG path：内部业务图（应用/处理器图标）用 <img> 比硬凑 24×24
        path 方便得多。object-fit: contain 保证非方图不撑破圆角块。
        加载失败（onerror）时回落到 path —— 图标 URL 挂了不应该让节点变成空白。
      -->
      <img
        v-if="state.image && !imageBroken"
        class="flow-node-img"
        :src="state.image"
        alt=""
        @error="imageBroken = true"
      />
      <svg
        v-else
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="#fff"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path :d="state.icon" />
      </svg>
    </span>
    <span class="flow-node-label" :title="state.label">{{ state.label }}</span>
    <span v-if="kindOf()" class="flow-node-kind" :title="state.type">{{ kindOf() }}</span>
  </div>
</template>

<style scoped>
/*
 * 尺寸刻意不写 180/36，而是 100%：X6 会按 register 时给的 width/height 建 foreignObject，
 * 卡片跟着走，以后调 shapes.ts 里的 NODE_WIDTH/NODE_HEIGHT 不必再回来改这里。
 */
.flow-node-card {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 0 8px 0 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #c2c8d5;
  /* 左侧 4px 主色竖条：官方用来表达状态，这里用来表达节点类型 */
  border-left: 4px solid #4f7cff;
  border-radius: 4px;
  box-shadow: 0 2px 5px 1px rgba(0, 0, 0, 0.06);
  font-family: var(--flow-font, inherit);
  cursor: grab;
  user-select: none;
}
.flow-node-card:active {
  cursor: grabbing;
}
.flow-node-icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  margin: 0 8px 0 4px;
  overflow: hidden;
  border-radius: 4px;
}
/* 图片铺满图标块并保持比例：非方图直接 width/height 100% 会被拉变形 */
.flow-node-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.flow-node-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  color: #4e5969;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/*
 * 类型标签：与 label 重复时（调色板里就那几个类型，name 常常等于 label）不再占位，
 * 避免出现「HTTP 请求  HTTP 请求」这种噪声。
 */
.flow-node-kind {
  flex: none;
  max-width: 56px;
  margin-left: 6px;
  overflow: hidden;
  font-size: 11px;
  color: #a4abb5;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
