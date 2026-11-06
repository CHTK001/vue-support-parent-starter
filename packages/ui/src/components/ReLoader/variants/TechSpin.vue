<template>
  <!--
    科技双环（原 TechScanLoader 的通用化版本）。
    外环顺时针 + 内环逆时针，弧长各约 180°（主弧 + 两段递减余晖），
    中心点脉冲、一道扫描线；小尺寸下比圆点/进度条更清晰，故保留为内联首选。
  -->
  <div class="re-loader-spin" :class="[`is-${size}`]" role="status" :aria-label="text || '正在处理'">
    <div class="re-loader-spin__rings" aria-hidden="true">
      <span class="re-loader-spin__ring is-outer" />
      <span class="re-loader-spin__ring is-inner" />
      <span class="re-loader-spin__core" />
    </div>
    <div class="re-loader-spin__beam" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
/**
 * ReLoader 内置动画之三：科技双环。
 *
 * <p>只动 transform / opacity，均在合成层完成，不触发布局与重绘。</p>
 */
import type { ReLoaderSize } from "../types";

withDefaults(defineProps<{ size?: ReLoaderSize; text?: string }>(), {
  size: "md",
  text: "",
});
</script>

<style scoped>
.re-loader-spin {
  /* 尺寸由 ReLoader 的 wrapper 以 --rl-size 下发；单独使用时回落到 44px。
     is-sm/is-lg 优先读变量，保证"外部指定 > 组件默认"。 */
  --re-loader-spin-size: var(--rl-size, 44px);
  --re-loader-spin-ring: 2px;
  --re-loader-spin-color: var(--rl-color, var(--el-color-primary));
  --re-loader-spin-color-2: color-mix(in srgb, var(--rl-color, var(--el-color-primary)) 45%, var(--el-color-info));
  position: relative;
  display: block;
  width: var(--re-loader-spin-size);
  aspect-ratio: 1 / 1;
  height: auto;
}

.re-loader-spin.is-sm { --re-loader-spin-size: var(--rl-size, 22px); --re-loader-spin-ring: 1.5px; }
.re-loader-spin.is-lg { --re-loader-spin-size: var(--rl-size, 64px); --re-loader-spin-ring: 2.5px; }

.re-loader-spin__rings {
  position: relative;
  width: 100%;
  height: 100%;
}

.re-loader-spin__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: var(--re-loader-spin-ring) solid transparent;
  will-change: transform;
}

.re-loader-spin__ring.is-outer {
  border-top-color: var(--re-loader-spin-color);
  border-right-color: color-mix(in srgb, var(--re-loader-spin-color) 45%, transparent);
  border-bottom-color: color-mix(in srgb, var(--re-loader-spin-color) 12%, transparent);
  animation: re-loader-spin-rotate 1.1s linear infinite;
}

.re-loader-spin__ring.is-inner {
  inset: calc(var(--re-loader-spin-ring) * 3);
  border-bottom-color: var(--re-loader-spin-color-2);
  border-left-color: color-mix(in srgb, var(--re-loader-spin-color-2) 45%, transparent);
  border-top-color: color-mix(in srgb, var(--re-loader-spin-color-2) 12%, transparent);
  animation: re-loader-spin-rotate 0.8s linear infinite reverse;
}

.re-loader-spin__core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(var(--re-loader-spin-size) * 0.16);
  height: calc(var(--re-loader-spin-size) * 0.16);
  margin: calc(var(--re-loader-spin-size) * -0.08) 0 0 calc(var(--re-loader-spin-size) * -0.08);
  border-radius: 50%;
  background: var(--re-loader-spin-color);
  animation: re-loader-spin-pulse 1.1s ease-in-out infinite;
}

.re-loader-spin__beam {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 0;
  height: 45%;
  border-radius: 50%;
  background: linear-gradient(to bottom, transparent,
      color-mix(in srgb, var(--re-loader-spin-color) 22%, transparent));
  animation: re-loader-spin-sweep 1.6s ease-in-out infinite;
  will-change: transform, opacity;
  pointer-events: none;
}

@keyframes re-loader-spin-rotate {
  to { transform: rotate(360deg); }
}

@keyframes re-loader-spin-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.55; }
}

@keyframes re-loader-spin-sweep {
  0% { transform: translateY(0); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateY(160%); opacity: 0; }
}

/* 减少动态效果：**保留旋转**、只放慢（去掉缩放脉冲）。
   实测：完全停转会让用户以为请求挂了而反复点击；透明度呼吸在小尺寸上又几乎看不出来。 */
@media (prefers-reduced-motion: reduce) {
  .re-loader-spin__ring.is-outer { animation: re-loader-spin-rotate 2.2s linear infinite; }
  .re-loader-spin__ring.is-inner { animation: re-loader-spin-rotate 1.6s linear infinite reverse; }
  .re-loader-spin__core { animation: re-loader-spin-breathe 1.6s ease-in-out infinite; }
  .re-loader-spin__beam { animation: re-loader-spin-sweep 2.8s ease-in-out infinite; }
}

@keyframes re-loader-spin-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}


/* 页面切到后台时暂停动画：用户看不见，但 CSS 动画仍会消耗绘制资源。 */
.re-loader__anim.is-paused .re-loader-spin__ring,
.re-loader__anim.is-paused .re-loader-spin__core,
.re-loader__anim.is-paused .re-loader-spin__beam {
  animation-play-state: paused !important;
}
</style>
