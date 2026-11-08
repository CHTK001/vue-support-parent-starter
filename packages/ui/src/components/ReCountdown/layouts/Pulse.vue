<script setup lang="ts">
/**
 * ReCountdown — pulse 脉冲布局
 *
 * 外圈脉冲环 + 中心数字；越接近结束脉冲越快，结束时红色呼吸。
 * 数据源：父组件透传的 remaining（ms）。
 */
import { computed } from "vue";
import "../../shared/modern-vars.css";
import type { CountdownLayoutProps } from "../types";
import { isUrgent, toHHMMSS } from "../utils";

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

const colorMap = {
  primary: "var(--rm-primary)",
  success: "var(--rm-success)",
  warning: "var(--rm-warning)",
  danger: "var(--rm-danger)",
  info: "var(--rm-info)",
  secondary: "var(--rm-text-regular)",
};

const pulseRing = computed(() => {
  const ms = props.finished ? 0 : props.remaining;
  if (isUrgent(ms)) return 0.4;
  if (ms <= 60_000) return 0.6;
  return 1.2;
});

const activeColor = computed(() => {
  if (props.finished) return "var(--rm-danger)";
  return colorMap[props.color];
});

const ringSize = computed(() => `${props.size * 1.6}px`);
</script>

<template>
  <div
    class="re-countdown re-countdown--pulse"
    :class="{ 're-countdown--finished': props.finished, 're-countdown--paused': props.paused }"
    :style="{ '--cd-color': activeColor, '--cd-pulse': `${pulseRing}s`, '--cd-size': ringSize }"
  >
    <div class="re-countdown__pulse">
      <span class="re-countdown__ring"></span>
      <span class="re-countdown__ring re-countdown__ring--2"></span>
    </div>
    <div class="re-countdown__body">
      <div class="re-countdown__value" v-if="props.showNumber">
        {{ props.finished ? "00:00:00" : toHHMMSS(props.remaining) }}
      </div>
      <div class="re-countdown__sub" v-if="props.showLabel">
        {{ props.label ?? "倒计时" }}
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
  gap: 12px;
  color: var(--rm-text, #1e293b);
}

.re-countdown--paused .re-countdown__pulse {
  animation: none;
  opacity: 0.4;
}

.re-countdown__pulse {
  position: relative;
  width: var(--cd-size, 100px);
  height: var(--cd-size, 100px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.re-countdown__ring {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: var(--cd-color, var(--rm-primary));
  border-right-color: var(--cd-color, var(--rm-primary));
  animation: re-countdown-pulse var(--cd-pulse, 1s) cubic-bezier(0.4, 0, 0.2, 1) infinite;
  transform-origin: center;
}

.re-countdown__ring--2 {
  animation: re-countdown-pulse var(--cd-pulse, 1s) cubic-bezier(0.4, 0, 0.2, 1) infinite 0.3s;
  opacity: 0.5;
}

.re-countdown__body {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.re-countdown__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--rm-text, #1e293b);
  line-height: 1.2;
}

.re-countdown__sub {
  font-size: 0.75rem;
  color: var(--rm-text-secondary, #64748b);
  margin-top: 4px;
}

/* 脉冲 */
@keyframes re-countdown-pulse {
  0% {
    transform: scale(0.75);
    opacity: 1;
  }
  100% {
    transform: scale(1.35);
    opacity: 0;
  }
}

/* 结束呼吸 */
.re-countdown--finished .re-countdown__ring {
  animation: re-countdown-pulse 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  border-top-color: var(--rm-danger);
  border-right-color: var(--rm-danger);
}
</style>
