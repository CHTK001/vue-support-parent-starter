<template>
  <!--
    进度条动画。
    确定进度（percent 非空）→ 填充到对应比例，并让右端有一道流光；
    不确定进度（percent 为 null）→ 条纹整体横向滚动，表示"在跑但不知道多久"。
    两者共用同一条轨道，避免状态切换时结构变化导致跳动。
  -->
  <div class="re-loader-bar" :class="{ 'is-indeterminate': percent === null }" role="progressbar"
    :aria-valuenow="percent === null ? undefined : Math.round(percent)" aria-valuemin="0" aria-valuemax="100">
    <div class="re-loader-bar__track">
      <div class="re-loader-bar__fill" :style="{ width: fillWidth }">
        <span class="re-loader-bar__shine" />
      </div>
    </div>
    <div v-if="showPercent" class="re-loader-bar__percent">{{ Math.round(percent ?? 0) }}%</div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReLoader 内置动画之一：进度条。
 */
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    /** 0-100；null 表示不确定进度 */
    percent?: number | null;
    /** 是否在右侧显示百分比数字 */
    showPercent?: boolean;
  }>(),
  { percent: null, showPercent: true },
);

/** 限幅到 0-100，避免调用方传入 103 / -5 把轨道画歪 */
const clamped = computed(() => {
  if (props.percent === null || props.percent === undefined) return 0;
  return Math.max(0, Math.min(100, props.percent));
});

const fillWidth = computed(() => `${clamped.value}%`);
</script>

<style scoped>
.re-loader-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 140px;
}

.re-loader-bar__track {
  position: relative;
  flex: 1;
  /* 轨道厚度由 ReLoader wrapper 以 --rl-bar-height 下发（sm/md/lg/像素/auto） */
  height: var(--rl-bar-height, 6px);
  border-radius: 999px;
  background: var(--el-fill-color);
  overflow: hidden;
}

.re-loader-bar__fill {
  position: relative;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg,
      color-mix(in srgb, var(--rl-color, var(--el-color-primary)) 62%, white),
      var(--rl-color, var(--el-color-primary)));
  transition: width 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);
}

/* 右端流光：让"条在动"这件事在小尺寸下也看得出来 */
.re-loader-bar__shine {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 40px;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 55%));
  animation: re-loader-bar-shine 1.2s ease-in-out infinite;
}

/* 不确定进度：填充缩到 40% 并整体来回滑动，比"定格在某比例"更符合"未知"的语义 */
.re-loader-bar.is-indeterminate .re-loader-bar__fill {
  width: 40% !important;
  transition: none;
  animation: re-loader-bar-slide 1.4s ease-in-out infinite;
}

.re-loader-bar__percent {
  flex: none;
  min-width: 38px;
  text-align: right;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
}

@keyframes re-loader-bar-shine {
  0% { opacity: 0; transform: translateX(-12px); }
  40% { opacity: 1; }
  100% { opacity: 0; transform: translateX(12px); }
}

@keyframes re-loader-bar-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}

/* 减少动态效果：保留"在动"但不做大幅位移 —— 仍能读出未完成 */
@media (prefers-reduced-motion: reduce) {
  .re-loader-bar__shine { animation-duration: 2.4s; }
  .re-loader-bar.is-indeterminate .re-loader-bar__fill {
    animation-duration: 2.8s;
  }
}


/* 页面切到后台时暂停动画：用户看不见，但 CSS 动画仍会消耗绘制资源。
   暂停标记由 visibility.ts 打在动画容器上（见 ReLoader.vue 的 animVars 绑定）。 */
.re-loader__anim.is-paused .re-loader-bar__fill,
.re-loader__anim.is-paused .re-loader-bar__shine {
  animation-play-state: paused !important;
}
</style>
