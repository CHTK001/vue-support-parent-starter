<template>
  <!-- Modern 布局（异步加载） -->
  <ModernLayout
    v-if="layout === 'modern'"
    :description="description"
    :image="image"
    :image-size="imageSize"
    v-bind="$attrs"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.image" #image>
      <slot name="image" />
    </template>
    <template v-if="$slots.description" #description>
      <slot name="description" />
    </template>
  </ModernLayout>

  <!-- plot 布局：hairline plot 图挂载到 .re-empty__figure；始终保留（非 plot 布局下 v-show 隐藏，
       这样 layout 切换时图宿主始终存在，图的生命周期才由 mount/destroy 单独控制） -->
  <div v-show="layout === 'plot'" class="re-empty__figure" ref="figureEl" />

  <!-- 默认 el-empty 布局 -->
  <el-empty
    v-if="layout === 'el'"
    v-bind="$attrs"
    :image="image"
    :image-size="imageSize"
    :description="description"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.image" #image>
      <slot name="image" />
    </template>
    <template v-if="$slots.description" #description>
      <slot name="description" />
    </template>
  </el-empty>
</template>

<script setup lang="ts">
/**
 * ReEmpty —— 空状态组件
 *
 * 透传 el-empty 全部能力。
 *   - layout：布局变体，"el"（默认，el-empty）/ "modern"（现代化扁平空状态）
 *            / "plot"（以 hairline plot 图代替文字，挂载于 .re-empty__figure）
 */
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { plot } from "@lucasmarkes/hairline";
import type { Figure } from "@lucasmarkes/hairline";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));

defineOptions({ name: "ReEmpty" });

const props = withDefaults(
  defineProps<{
    /** 布局变体："el"（默认 el-empty）/ "modern"（现代化扁平空状态）/ "plot"（hairline 图） */
    layout?: "el" | "modern" | "plot";
    image?: string;
    imageSize?: number;
    description?: string;
  }>(),
  {
    layout: "el",
    image: undefined,
    imageSize: undefined,
    description: undefined,
  },
);

/** 图挂载的位置；plot 布局下是唯一的根元素 */
const figureEl = ref<HTMLDivElement>();
const figure = ref<Figure | null>(null);

/** 挂载 plot 图（SSR 安全：没有 DOM 时不创建） */
function mountFigure() {
  // SSR 安全：无 DOM 时不创建。
  if (typeof document === "undefined") return;
  const el = figureEl.value;
  if (!el) return;
  figure.value = plot(el, { theme: "auto" });
  if (props.description) figure.value.update({ label: props.description });
}

/** 销毁图（幂等：停止动画，卸下 svg / aria / 属性） */
function unmountFigure() {
  figure.value?.destroy();
  figure.value = null;
}

onMounted(() => {
  if (props.layout === "plot") nextTick(mountFigure);
});

onBeforeUnmount(unmountFigure);

watch(
  () => props.layout,
  (nextLayout) => {
    if (nextLayout === "plot") nextTick(mountFigure);
    else unmountFigure();
  },
);

watch(
  () => props.description,
  (label) => {
    if (props.layout !== "plot" || !figure.value) return;
    if (label) figure.value.update({ label });
    else figure.value.update({ label: undefined });
  },
);
</script>

<style scoped>
/* plot 布局：图占满空块，宽度由宿主（如 .re-table__view-empty）通过
   --re-empty-figure-width 下达（336px），不加注时填充满零块，上限 336px。
   高由 hairline 的 aspect-ratio: 5/4 控制。

   ⚠ margin-inline: auto 不是可有可无的。宿主是「width:100% + max-width:336px」的块级元素，
   父级一旦不是「flex 居中」，它就会贴左 —— 实测（test/vue/re-empty-plot/probe.mjs）：
     · 纯块级父级（<ReEmpty layout="plot"> 直接放进普通 div）：图中心偏左 282px，几乎整块空白；
     · element-plus 的 #empty 插槽：插槽内容包在 span.el-table__empty-text{width:50%} 里，
       336px 在 450px 的 span 内靠左，视觉上偏左 57px（"图不在中间"的那种别扭）。
   两种都是"宿主没居中"，与 hairline 无关：图形本身在 viewBox 400×320 里是正中的
   （包围盒 x=92.6 / 宽=214.9，中心正好 200）。auto 外边距对 flex 居中的父级也无副作用。 */
.re-empty__figure {
  width: 100%;
  max-width: var(--re-empty-figure-width, 336px);
  box-sizing: border-box;
  margin-inline: auto;
}
</style>
