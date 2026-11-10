<script setup lang="ts">
/**
 * ReCountdown — dial 表盘布局
 *
 * 环形进度作为外壳，中心数字展示时间。最经典的仪表盘排布。
 *
 * 环形中间的数字格式由 format 与总时长（total）决定：
 *   <= 60s auto → 只显示秒（"45"），不再显示 HH:MM:SS；
 *   60s~1h auto → MM:SS；1h~1d auto → HH:MM:SS；> 1d auto → "1天 01:00:45"。
 * 数据源：父组件透传的 remaining（ms）。
 */
import { computed } from "vue";
import type { CountdownLayoutProps } from "../types";
import { formatRemaining, relevantUnits, toShortText } from "../utils";

const props = withDefaults(defineProps<CountdownLayoutProps>(), {
  size: 60,
  color: "primary",
  showNumber: true,
  showText: true,
  showLabel: false,
  endAnimation: false,
  total: 0,
  paused: false,
  format: "auto",
  colorThresholds: undefined,
  unitShape: "ring",
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

/** 按格式/总时长要的显示单位 */
const units = computed(() => relevantUnits(props.total ?? 0, props.format));

/** 环形中心的数字（按格式切单位） */
const value = computed(() => {
  if (!props.showNumber || props.remaining <= 0) return "00:00:00";
  return formatRemaining(props.remaining, units.value, props.format);
});

/** 短提示（sub） */
const sub = computed(() => (props.finished ? "已结束" : toShortText(props.remaining)));
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
        {{ value }}
      </div>
      <div class="re-countdown__sub" v-if="props.showText && !props.showLabel">
        {{ sub }}
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
  stroke-width: 9;
}

/*
 * 环的残留比例由 rAF 每帧写入（remaining 每帧刷新），
 * 所以绝不能给 stroke-dashoffset 加 transition：每帧重启的过渡会把环按在初始位置，
 * 看上去就是「数字在走、环不动」。只让描边颜色做过渡。
 */
.re-countdown__ring {
  fill: none;
  stroke: var(--cd-color);
  stroke-width: 9;
  stroke-linecap: round;
  transition: stroke 250ms var(--rm-transition);
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
