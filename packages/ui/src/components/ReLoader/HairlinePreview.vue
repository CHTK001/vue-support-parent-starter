<template>
  <!-- 图由库自己创建（svg + aria），这里只给一个宿主元素 -->
  <span ref="hostEl" class="re-hairline-preview" role="img" :aria-label="label || undefined" />
</template>

<script setup lang="ts">
/**
 * 矢量（hairline）加载动画的渲染层（ReLoader 与主题配置预览共用）。
 *
 * <p>只有点阵 / 传送带 / 柱阵 / 卡片翻动这四款走这里：它们在应用内由
 * {at code at lucasmarkes/hairline} 真画。其余动画是纯 CSS，不会挂载本组件。</p>
 *
 * <p>库约 200KB，只能动态 {at code import()}：首屏不背它，普通加载态（dots / rings / …）也不背。
 * 分包还没到位时宿主留空，同一位置先显示由 {at code animations.ts} 生成的 CSS 近似层，
 * 拿不到库也只是少了精致度，不会白屏。</p>
 */
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Figure } from "@lucasmarkes/hairline";

const props = withDefaults(
  defineProps<{
    /** 图形键（phosphor / slow / terrain / turntable / …） */
    figure: string;
    /** 无障碍名称 */
    label?: string;
    /** 是否自己循环演示（默认开：加载态没有指针可交互） */
    play?: boolean;
  }>(),
  { label: "", play: true },
);

const hostEl = ref<HTMLElement>();
const figure = ref<Figure | null>(null);
/** 令牌：换图 / 卸载时，旧的异步加载不能回来覆盖 */
let token = 0;

function destroy() {
  token += 1;
  figure.value?.destroy();
  figure.value = null;
}

async function mount() {
  if (typeof document === "undefined") return;
  destroy();
  const host = hostEl.value;
  if (!host) return;
  const mine = token;
  try {
    const { mountLoaderFigure } = await import("./hairline");
    if (mine !== token || !hostEl.value) return;
    const made = await mountLoaderFigure(host, props.figure, {
      play: props.play,
      ...(props.label ? { label: props.label } : {}),
    });
    if (mine !== token) {
      // 等图库期间换了图或已卸载：这一份作废，别再往宿主上留东西
      made.destroy();
      return;
    }
    figure.value = made;
  } catch {
    // 分包不可用（离线 / 旧构建）：这里留空，外层的 CSS 近似图顶上
  }
}

onMounted(mount);
watch(
  () => props.figure,
  () => void mount(),
);
onBeforeUnmount(destroy);
</script>

<style scoped>
/*
  宽度即基准（库按 5/4 出高度），跟随 --sla-s 缩放，
  于是缩略图、应用内遮罩、首屏三处的矢量图尺寸口径一致。
  描边略细一档：默认 0.9px 的线在缩略图里细节过于抢眼。
*/
.re-hairline-preview {
  --hairline-stroke: 0.6;
  display: block;
  width: var(--sla-s, 64px);
  aspect-ratio: 5 / 4;
}
</style>
