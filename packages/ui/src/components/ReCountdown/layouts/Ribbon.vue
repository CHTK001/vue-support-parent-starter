<script setup lang="ts">
/**
 * ReCountdown — ribbon 缎带布局
 *
 * 270° 右偏弧线 + 右侧数字列表并排，适合表格/行内紧凑场景。
 * 数据源：父组件透传的 remaining（ms）。
 */
import { computed } from "vue";
import "../../shared/modern-vars.css";
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

const arcSize = computed(() => `${props.size * 1.2}px`);

const offset = computed(() => CIRCUMFERENCE * 0.75 * (1 - percent.value));

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
    class="re-countdown re-countdown--ribbon"
    :class="{ 're-countdown--finished': props.finished, 're-countdown--paused': props.paused }"
    :style="{ '--cd-color': colorMap[props.color] }"
  >
    <svg
      class="re-countdown__arc"
      viewBox="0 0 100 100"
      :style="{ width: arcSize, height: arcSize }"
    >
      <defs>
        <linearGradient id="ribbon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="var(--rm-primary-hover)" />
          <stop offset="100%" stop-color="var(--cd-color)" />
        </linearGradient>
      </defs>
      <circle class="re-countdown__track" cx="50" cy="50" r="45" />
      <circle
        class="re-countdown__ring"
        cx="50" cy="50" r="45"
        :style="{
          strokeDasharray: CIRCUMFERENCE * 0.75,
          strokeDashoffset: offset,
          transition: 'stroke-dashoffset 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        }"
      />
    </svg>
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
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--rm-text, #1e293b);
}

.re-countdown--paused .re-countdown__arc,
.re-countdown--paused .re-countdown__value {
  opacity: 0.6;
}

.re-countdown__arc {
  transform: rotate(-135deg);
  transform-origin: center;
}

.re-countdown__track {
  fill: none;
  stroke: var(--rm-border);
  stroke-width: 6;
}

.re-countdown__ring {
  fill: none;
  stroke: url(#ribbon-grad);
  stroke-width: 6;
  stroke-linecap: round;
}

.re-countdown__body {
  display: flex;
  flex-direction: column;
}

.re-countdown__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--rm-text, #1e293b);
  line-height: 1.2;
}

.re-countdown__sub {
  font-size: 0.75rem;
  color: var(--rm-text-secondary, #64748b);
  margin-top: 4px;
}
</style>
