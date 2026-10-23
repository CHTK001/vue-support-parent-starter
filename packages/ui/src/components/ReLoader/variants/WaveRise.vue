<template>
  <!--
    海浪缓慢上升。
    结构分三层：
      pool     —— 不可见的裁剪区（左右柔化），不画圆、不画底、不画描边；
      surface  —— 承载"水位"的可动层，水位升降就是它的 top；
      crest    —— 超大圆角方形，贴在 surface 上缘，转动时上缘高度起伏 → 波浪；
      water    —— 水体，**在 crest 之后绘制**，因此会盖住 crest 探下来的部分，
                 于是只有水面之上的起伏可见（不会在水里留下一条浅色横带）。
    纯 CSS，无 SVG、无 canvas。
  -->
  <div class="re-loader-wave" :class="[`is-${size}`]" role="progressbar"
    :aria-valuenow="percent === null ? undefined : Math.round(percent ?? 0)" aria-valuemin="0" aria-valuemax="100">
    <div class="re-loader-wave__pool">
      <div class="re-loader-wave__surface" :class="{ 'is-determinate': determinate }" :style="waterStyle">
        <span class="re-loader-wave__crest is-a" />
        <span class="re-loader-wave__crest is-b" />
        <div class="re-loader-wave__water">
          <span class="re-loader-wave__bubble is-1" />
          <span class="re-loader-wave__bubble is-2" />
          <span class="re-loader-wave__bubble is-3" />
        </div>
      </div>
      <div v-if="showPercent" class="re-loader-wave__label">{{ label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReLoader 内置动画之一：海浪慢慢上升。
 *
 * <p>不确定进度时水位在低位缓慢涨落；一旦拿到真实进度（{@code percent} 非空），
 * 水位直接由进度驱动（不再自走），于是同一个动画既能"转着等"又能"报进度"。</p>
 */
import { computed } from "vue";
import type { ReLoaderSize } from "../types";

/** 水位下限（%）：留一点底水，避免"完全空了"看着像坏了 */
const MIN_LEVEL = 12;
/** 水位上限（%）：**不满** —— 灌满会变成一整块纯色，很难看 */
const MAX_LEVEL = 62;

const props = withDefaults(
  defineProps<{
    /** 0-100；null 表示不确定进度（水位自走） */
    percent?: number | null;
    size?: ReLoaderSize;
    /** 是否在水面上显示百分比 */
    showPercent?: boolean;
  }>(),
  { percent: null, size: "md", showPercent: false },
);

/** 是否由真实进度驱动水位（否则水位自走） */
const determinate = computed(() => props.percent !== null && props.percent !== undefined);

/**
 * 水位：把 0-100 的进度线性映射到 {@link MIN_LEVEL}~{@link MAX_LEVEL}。
 *
 * <p>用**高度**（height）表达水位，而不是 top：
 * 绝对定位里 top 与 bottom 同时存在时，高度由两者共同决定（bottom 优先），
 * 于是"top:78%"算出的实际水位是 22%，与预期相反（实测踩过：进度 100% 时
 * 水位只有 38%，因为 38% 是"距顶距离"）。只给 height + bottom:0，
 * 水位 = height / 池高，含义唯一、无歧义。</p>
 *
 * <p>不确定进度时不写内联值，交给 CSS 的 rise 动画自走。</p>
 */
const waterStyle = computed(() => {
  if (!determinate.value) return undefined;
  const v = Math.max(0, Math.min(100, props.percent as number));
  const level = MIN_LEVEL + (v / 100) * (MAX_LEVEL - MIN_LEVEL);
  // 水位 = 池高的 level%，用 height 表达（与 .surface 的写法一致）。
  // 写成百分比而不是 calc(变量 × 系数)：auto 模式下变量本身含百分比，
  // 出现在 height 里会解析失败（池高由 aspect-ratio 定死，百分比基准是确定的）。
  return { height: `${level.toFixed(2)}%` };
});

const label = computed(() => (determinate.value ? `${Math.round(props.percent as number)}%` : ""));
</script>

<style scoped>
.re-loader-wave {
  /* 尺寸由 ReLoader 的 wrapper 以 --rl-size 下发；单独使用时回落到 56px。
     is-sm/is-lg 也优先读变量，保证"外部指定 > 组件默认"的优先级。 */
  --re-loader-wave-size: var(--rl-size, 56px);
  display: flex;
  width: 100%;
  justify-content: center;
}

.re-loader-wave.is-sm { --re-loader-wave-size: var(--rl-size, 28px); }
.re-loader-wave.is-lg { --re-loader-wave-size: var(--rl-size, 84px); }

/*
  裁剪区：本身**完全不可见**（无圆角、无底色、无描边），
  形状只由水与浪尖构成 —— 所以不会出现"一个圆被灌满纯色"的样子。
  左右用 mask 淡出，避免水体的竖直边缘显得像水箱壁。
*/
.re-loader-wave__pool {
  position: relative;
  /*
    宽度用尺寸变量算、高度用 aspect-ratio 由宽度反推。

    为什么不用 height: var(--re-loader-wave-size)：size="auto" 时这个变量的值是
    clamp(18px, min(46%, 72px), 72px)，里面的百分比在**自动高度的父容器**里无法
    解析 —— 整条 height 退化成 auto，池子底下只有一个绝对定位的子元素，于是高度
    塌成 0（实测 auto 下 130×0）。宽度上的百分比能正常解析（基准是父容器宽度），
    所以把变量放在 width 上、高度用宽高比反推，两种 size 模式都成立。
  */
  width: calc(var(--re-loader-wave-size) * 1.8);
  aspect-ratio: 1.8;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent);
}

/*
  水位层：**用 height 表达水位**，底边锚定在池底。

  为什么不用 top：绝对定位里 top 与 bottom 同时存在时，高度由两者共同决定
  （bottom 优先），于是"top:78%"实际算出的水位是 22%，与预期相反。
  只给 height + bottom:0，水位 = height / 池高，含义唯一、无歧义。

  百分比基准是池高（池高已由 aspect-ratio 定死），所以 22% 就是"两成水"。
  */
.re-loader-wave__surface {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 22%;
  animation: re-loader-wave-rise 5.4s ease-in-out infinite alternate;
}

/* 水位由真实进度驱动时停掉自走动画，避免"进度条打架" */
.re-loader-wave__surface.is-determinate {
  animation: none;
  transition: top 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
}

/*
  浪尖：超大圆角方形，贴住水位层上缘（bottom:100% 会随水位自动跟随）。
  负 margin-bottom 让它略微下探 —— 下探部分会被后绘制的水体盖住，
  所以只有"露出水面之上"的起伏可见，形成干净的波浪边缘。
  尺寸一律用 calc(尺寸变量) 计算，不用百分比：百分比在不同属性上的基准不同
  （top/height 对高度、width 对宽度），改形状时极易错位。
*/
.re-loader-wave__crest {
  position: absolute;
  bottom: 100%;
  left: 50%;
  /*
    尺寸一律换算成**百分比**，不再写 calc(变量 × 系数)：auto 模式下变量含百分比，
    放在 height / margin 上解析不出来（见 __pool 的注释）。
    基准换算（池宽 = 高 × 1.8）：
      · width  = 2.9×高 = 2.9/1.8 ≈ 161.1% 池宽
      · height = 2.9×高 = 290% 池高
      · margin-* 的百分比基准恒为**池宽**，故 1.45×高 → 80.55%、
        0.22×高 → 0.22/1.8 ≈ 12.22%
  */
  width: 161.1%;
  height: 290%;
  margin-left: -80.55%;
  margin-bottom: -12.22%;
  border-radius: 44%;
  background: color-mix(in srgb, var(--rl-color, var(--el-color-primary)) 46%, white);
  animation: re-loader-wave-spin 7s linear infinite;
}

.re-loader-wave__crest.is-b {
  border-radius: 37%;
  background: color-mix(in srgb, var(--rl-color, var(--el-color-primary)) 62%, white);
  animation-duration: 11s;
  animation-direction: reverse;
}

/* 水体：只画水，不再画圆底；半透明渐变避免"一整块纯色" */
.re-loader-wave__water {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--rl-color, var(--el-color-primary)) 52%, white) 0%,
    color-mix(in srgb, var(--rl-color, var(--el-color-primary)) 82%, white) 42%,
    var(--rl-color, var(--el-color-primary)) 100%
  );
}

/* 上升气泡：给"水在动"再加一层可读信号（尺寸小，几乎不占性能） */
.re-loader-wave__bubble {
  position: absolute;
  width: 7%;
  height: 7%;
  border-radius: 50%;
  background: rgb(255 255 255 / 72%);
  opacity: 0;
  animation: re-loader-wave-bubble 3.6s ease-in infinite;
}

.re-loader-wave__bubble.is-1 { left: 28%; animation-delay: 0.2s; }
.re-loader-wave__bubble.is-2 { left: 50%; animation-delay: 1.3s; }
.re-loader-wave__bubble.is-3 { left: 70%; animation-delay: 2.4s; }

.re-loader-wave__label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
  pointer-events: none;
}

/*
  涨落区间：水位 22% → 62%（height 从 0.22 到 0.62 倍池高）。
  配 animation-direction: alternate 往返无缝，且**永远不满**。
*/
@keyframes re-loader-wave-rise {
  0% { height: 22%; }
  100% { height: 62%; }
}

@keyframes re-loader-wave-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes re-loader-wave-bubble {
  0% { opacity: 0; transform: translateY(0) scale(0.7); }
  25% { opacity: 0.9; }
  100% { opacity: 0; transform: translateY(-360%) scale(1.1); }
}

/* 减少动态效果：整体放慢，但**不停** —— 加载指示器停住会让用户以为卡死 */
@media (prefers-reduced-motion: reduce) {
  .re-loader-wave__surface { animation-duration: 9s; }
  .re-loader-wave__crest { animation-duration: 12s; }
  .re-loader-wave__crest.is-b { animation-duration: 18s; }
  .re-loader-wave__bubble { animation-duration: 6s; }
}

/* 页面切到后台时暂停动画：用户看不见，但 CSS 动画仍会消耗绘制资源。 */
.re-loader__anim.is-paused .re-loader-wave__surface,
.re-loader__anim.is-paused .re-loader-wave__crest,
.re-loader__anim.is-paused .re-loader-wave__bubble {
  animation-play-state: paused !important;
}
</style>
