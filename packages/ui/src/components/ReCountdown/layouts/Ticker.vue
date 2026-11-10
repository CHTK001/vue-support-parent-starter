<script setup lang="ts">
/**
 * ReCountdown — ticker 滚动布局
 *
 * 单位行（按 format / 总时长挑单位） + 底部进度条，进度条带流光，适合看板/列表。
 * 数据源：父组件透传的 remaining（ms）。
 */
import { computed } from "vue";
import "../../shared/modern-vars.css";
import type { CountdownLayoutProps, CountdownUnit } from "../types";
import { relevantUnits, toShortText, UNIT_LABELS, unitTexts } from "../utils";

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

/** 百分比 */
const percent = computed(() => {
  if (!props.total || props.total <= 0) return 0;
  return Math.min(1, Math.max(0, props.remaining / props.total));
});

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

/** 单位行：单位标签 + 该单位的数值 */
const rows = computed(() => {
  const ts = unitTexts(props.remaining, units.value);
  return units.value.map((u: CountdownUnit, i: number) => ({
    label: UNIT_LABELS[u],
    value: ts[i],
  }));
});

/** 短提示（sub） */
const sub = computed(() => (props.finished ? "已结束" : toShortText(props.remaining)));
</script>

<template>
  <div
    class="re-countdown re-countdown--ticker"
    :class="{ 're-countdown--finished': props.finished, 're-countdown--paused': props.paused }"
    :style="{ '--cd-color': colorMap[props.color] }"
  >
    <div class="re-countdown__body">
      <div class="re-countdown__title" v-if="props.showLabel">
        {{ props.label ?? "倒计时" }}
      </div>
      <div class="re-countdown__rows">
        <div class="re-countdown__row" v-for="r in rows" :key="`${props.remaining}-${r.label}`">
          <div class="re-countdown__label">{{ r.label }}</div>
          <div class="re-countdown__value">{{ r.value }}</div>
        </div>
      </div>
      <div class="re-countdown__bar">
        <div class="re-countdown__fill re-countdown__fill--stripe" :style="{ width: `${percent * 100}%` }" />
      </div>
      <div class="re-countdown__status" v-if="props.showText">
        {{ props.finished ? "已结束" : `剩余 ${Math.round(props.remaining)} ms` }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.re-countdown {
  display: inline-flex;
  flex-direction: column;
  color: var(--rm-text, #1e293b);
}

.re-countdown--paused {
  opacity: 0.6;
}

.re-countdown__title {
  font-size: 0.75rem;
  color: var(--rm-text-regular, #475569);
  margin-bottom: 4px;
  line-height: 1.2;
}

.re-countdown__rows {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.re-countdown__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 7rem;
  height: 2.25rem;
  padding: 0 12px;
  background: var(--rm-bg-subtle, #f8fafc);
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius);
}

.re-countdown__label {
  font-size: 0.75rem;
  color: var(--rm-text-secondary, #64748b);
}

.re-countdown__value {
  font-size: 1rem;
  font-weight: 600;
  font-family: "SF Mono", ui-monospace, Menlo, monospace;
  color: var(--rm-text, #1e293b);
}

/* 流光进度条 */
.re-countdown__bar {
  position: relative;
  width: 100%;
  height: 4px;
  margin-top: 8px;
  background: var(--rm-bg-subtle, #f8fafc);
  border-radius: 2px;
  overflow: hidden;
}

.re-countdown__fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--cd-color, var(--rm-primary));
  border-radius: inherit;
  transition: width 150ms var(--rm-transition);
}

/* 流光扫过 */
.re-countdown__fill--stripe {
  background-size: 200% 100%;
  background-image: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 4px,
    rgba(255, 255, 255, 0.25) 4px,
    rgba(255, 255, 255, 0.25) 8px
  );
  animation: re-countdown-stream 0.8s linear infinite;
}

.re-countdown--finished .re-countdown__fill--stripe,
.re-countdown--paused .re-countdown__fill--stripe {
  animation: none;
}

@keyframes re-countdown-stream {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}

.re-countdown--finished .re-countdown__value,
.re-countdown--finished .re-countdown__label {
  color: var(--rm-text-disabled);
}

.re-countdown__status {
  font-size: 0.65rem;
  color: var(--rm-text-secondary, #64748b);
  margin-top: 8px;
}
</style>
