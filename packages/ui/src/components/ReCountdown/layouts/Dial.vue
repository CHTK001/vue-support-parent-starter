<script setup lang="ts">
/**
 * ReCountdown — dial 表盘布局
 *
 * 环形进度作为外壳，中心数字展示时间。最经典的仪表盘排布。
 *
 * 数据源：父组件透传的 remaining（ms）。
 */
import { computed } from "vue";
import type { CountdownLayoutProps } from "../types";
import { toHHMMSS } from "../utils";

const props = withDefaults(defineProps<CountdownLayoutProps>(), {
  size: 60,
  color: "primary",
  showNumber: true,
  showText: true,
  showLabel: false,
  endAnimation: false,
  total: 0,
  paused: false,
});

/** 弧度参数 */
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const percent = computed(() => {
  if (!props.total || props.total <= 0) return 0;
  return Math.min(1, Math.max(0, props.remaining / props.total));
});

const offset = computed(() => CIRCUMFERENCE * (1 - percent.value));

const colorMap = {
  primary: "var(--rm-primary)",
  success: "var(--rm-success)",
  warning: "var(--rm-warning)",
  danger: "var(--rm-danger)",
  info: "var(--rm-info)",
  secondary: "var(--rm-text-regular)",
};
</script>

<template>
  <div
    class="re-countdown re-countdown--dial"
    :class="{ 're-countdown--finished': props.finished, 're-countdown--paused': props.paused }"
    :style="{ '--cd-color': colorMap[props.color], '--cd-percent': `${percent * 100}%` }"
  >
    <svg class="re-countdown__svg" viewBox="0 0 100 100" :width="size" :height="size">
      <circle class="re-countdown__track" cx="50" cy="50" r="45" />
      <circle
        class="re-countdown__ring"
        cx="50" cy="50" r="45"
        :style="{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: offset }"
      />
    </svg>
    <div class="re-countdown__body">
      <div class="re-countdown__title" v-if="props.showLabel">
        {{ props.label ?? "倒计时" }}
      </div>
      <div class="re-countdown__value">
        {{ props.showNumber && props.remaining > 0 ? toHHMMSS(props.remaining) : "00:00:00" }}
      </div>
      <div class="re-countdown__sub" v-if="props.showText && !props.showLabel">
        remaining ms {{ Math.round(props.remaining) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.re-countdown {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--rm-text, #1e293b);
}

.re-countdown__svg {
  transform: scale(1);
  transition: transform 250ms var(--rm-transition);
}

.re-countdown--paused .re-countdown__svg {
  opacity: 0.6;
}

.re-countdown__track {
  fill: none;
  stroke: var(--rm-border);
  stroke-width: 6;
}

.re-countdown__ring {
  fill: none;
  stroke: var(--cd-color);
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 250ms var(--rm-transition), stroke 250ms var(--rm-transition);
  transform-origin: center;
}

.re-countdown__body {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.9;
  color: var(--rm-text, #1e293b);
  pointer-events: none;
}

.re-countdown__title {
  font-size: 0.75rem;
  color: var(--rm-text-regular, #475569);
  margin-bottom: 4px;
  line-height: 1.2;
}

.re-countdown__value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--rm-text, #1e293b);
  line-height: 1.2;
}

.re-countdown__sub {
  font-size: 0.65rem;
  color: var(--rm-text-secondary, #64748b);
  margin-top: 4px;
}

/* 结束抖动 */
@keyframes countdown-jitter {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-3deg);
  }
  75% {
    transform: rotate(3deg);
  }
}

.re-countdown--finished .re-countdown__svg {
  animation: countdown-jitter 0.3s var(--rm-transition);
}
</style>
