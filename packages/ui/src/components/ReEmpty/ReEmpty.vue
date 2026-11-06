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
 *   - layout：布局变体，"el"（el-empty）/ "modern"（现代化扁平空状态）
 *            / "plot"（以 hairline 图代替文字，挂载于 .re-empty__figure）
 *   - figure：plot 用哪款 hairline 图形（plot / phosphor / terrain / …，
 *            可选键见 ./figures.ts）。不传时取全局配置，默认 "plot"。
 *   - 不传 layout 时取 app.yaml 的 other.emptyState（默认 "el"，与接入配置前一致）；
 *     显式传值永远优先，所以业务里写死的 layout 不会被部署配置改掉。
 */
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { getConfig } from "@repo/config";
import type { Figure } from "@lucasmarkes/hairline";
import { mountHairlineFigure, normalizeHairlineFigure } from "./figures";
import { resolveEmptyFigure, resolveEmptyLayout } from "./resolve";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));

defineOptions({ name: "ReEmpty" });

const props = withDefaults(
  defineProps<{
    /** 布局变体："el"（el-empty）/ "modern"（现代化扁平空状态）/ "plot"（hairline 图）。
     *  不传时由 app.yaml 的 other.emptyState 决定（默认 "el"）。 */
    layout?: "el" | "modern" | "plot";
    /** 「plot」用哪款 hairline 图形（如 plot / phosphor / terrain …）。
     *  不传时由 app.yaml 的 other.emptyState.hairline 决定（默认 "plot"）。 */
    figure?: string;
    image?: string;
    imageSize?: number;
    description?: string;
  }>(),
  {
    // 故意不设默认值：要区分「没传」与「显式传 el」——前者才允许被全局配置接管
    layout: undefined,
    figure: undefined,
    image: undefined,
    imageSize: undefined,
    description: undefined,
  },
);

/**
 * 实际布局：显式 prop > 全局配置 other.emptyState > "el"。
 * 用 computed 而不是 prop 默认值，这样 admin 在主题配置里切换样式时能即时生效。
 */
const layout = computed(() => {
  const appConfig = getConfig();
  return resolveEmptyLayout(props.layout, appConfig?.other?.emptyState);
});

/** 实际的 hairline 图形键：显式 prop > 全局配置 > "plot"（非法键名会被兜底） */
const figureKey = computed(() => {
  const appConfig = getConfig();
  return normalizeHairlineFigure(
    resolveEmptyFigure(props.figure, appConfig?.other?.emptyState),
  );
});

/** 图挂载的位置；plot 布局下是唯一的根元素 */
const figureEl = ref<HTMLDivElement>();
const figure = ref<Figure | null>(null);

/** 令牌：换图 / 卸载时，尚未回来的异步加载不能覆盖新的图 */
let mountToken = 0;

/** 挂载 hairline 图（SSR 安全：没有 DOM 时不创建；图库是懒加载的，等它到） */
async function mountFigure() {
  // SSR 安全：无 DOM 时不创建。
  if (typeof document === "undefined") return;
  const el = figureEl.value;
  if (!el) return;
  // 挂之前先清：图形切换 / 布局来回切时不能叠层
  unmountFigure();
  const mine = mountToken;
  let made: Figure;
  try {
    made = await mountHairlineFigure(el, figureKey.value, { theme: "auto" });
  } catch {
    // 图库分包拿不到（离线 / 旧构建）：空状态退回文案，不白屏
    return;
  }
  if (mine !== mountToken || !figureEl.value) {
    made.destroy();
    return;
  }
  figure.value = made;
  if (props.description) made.update({ label: props.description });
}

/** 销毁图（幂等：停止动画，卸下 svg / aria / 属性） */
function unmountFigure() {
  mountToken += 1;
  figure.value?.destroy();
  figure.value = null;
}

onMounted(() => {
  if (layout.value === "plot") nextTick(mountFigure);
});

onBeforeUnmount(unmountFigure);

watch(layout, (nextLayout) => {
  if (nextLayout === "plot") nextTick(mountFigure);
  else unmountFigure();
});

// 图形类型变化（主题配置里换一款）→ 重新挂，旧图先销毁
watch(figureKey, () => {
  if (layout.value === "plot") nextTick(mountFigure);
});

watch(
  () => props.description,
  (label) => {
    if (layout.value !== "plot" || !figure.value) return;
    if (label) figure.value.update({ label });
    else figure.value.update({ label: undefined });
  },
);
</script>

<style scoped>
/* plot 布局：图占满空块，宽度由宿主（如 .re-table__view-empty）通过
   --re-empty-figure-width 下达（336px），不加注时填充满零块，上限 336px。
   高默认跟 Hairline 的 aspect-ratio: 5/4 走，宿主通过 --re-empty-aspect-ratio
   接管高度逻辑；给死 host 高度的 e.g. height:100% 时 ratio 自动退让。

   ⚠ 这是 ReTable 侧的「宿主 vartight 契约」：宿主 CSS 里写
     --re-empty-figure-width: 100%;
     --re-empty-aspect-ratio: auto;
     height: 100%;
   图就铺满宿主的宽高（box-sizing 已关）—— 两空零块填满。standalone
   ReEmpty（不进 ReTable）什么都不写，照旧 336px 宽 / 5/4 高：aspect-ratio
   兜底，图不塌。aspect-ratio 天生低权的唯一原因：宿主没有显式高度时，
   它是唯一判定图尺寸的手腕（hairline 的 :where([data-hairline]) 零权，
   这里的 .re-empty__figure 永远压它）。

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
  height: auto;
  aspect-ratio: var(--re-empty-aspect-ratio, 5/4);
}
</style>
