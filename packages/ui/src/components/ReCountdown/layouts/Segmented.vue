<script setup lang="ts">
/**
 * ReCountdown — segment 分段布局
 *
 * 数字卡片 + 冒号分隔，终端/看板风格。
 * 位数由 format/总时长决定：hms 三列、ms 两列、s 一列。
 * 数据源：父组件透传的 remaining（ms）。
 */
import { computed } from "vue";
import "../../shared/modern-vars.css";
import type { CountdownLayoutProps } from "../types";
import { relevantUnits, toShortText, unitTexts } from "../utils";

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

/** 按格式/总时长要的显示单位 */
const units = computed(() => relevantUnits(props.total ?? 0, props.format));

/** 各单位数值文本（已补零，顺序与 units 一致） */
const digits = computed(() => unitTexts(props.remaining, units.value));

/** 冒号数量 = 数字块数量 - 1 */
const colons = computed(() => Math.max(0, digits.value.length - 1));

/** 短提示（status） */
const sub = computed(() => (props.finished ? "已结束" : toShortText(props.remaining)));
</script>

<template>
  <div
    class="re-countdown re-countdown--segmented"
    :class="{ 're-countdown--finished': props.finished, 're-countdown--paused': props.paused }"
  >
    <div class="re-countdown__body">
      <div class="re-countdown__title" v-if="props.showLabel">
        {{ props.label ?? "倒计时" }}
      </div>
      <div class="re-countdown__digits">
        <div class="re-countdown__digit" v-for="(v, i) in digits" :key="`${props.remaining}-${i}`">
          {{ v }}
        </div>
        <div class="re-countdown__colon" v-for="(c, i) in colons" :key="`${props.remaining}-colon-${i}`">:
        </div>
      </div>
      <div class="re-countdown__status" v-if="props.showText">
        {{ sub }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.re-countdown {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
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

.re-countdown__digits {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.re-countdown__digit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 3.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: "SF Mono", ui-monospace, Menlo, monospace;
  color: var(--rm-text, #1e293b);
  background: var(--rm-bg-subtle, #f8fafc);
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius);
  animation: re-countdown-pop 0.2s ease-out;
}

@keyframes re-countdown-pop {
  0% {
    transform: scale(0.92);
    opacity: 0.6;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.re-countdown__colon {
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--rm-text-regular);
  line-height: 1.2;
  padding: 0 4px;
  animation: re-countdown-colon-blink 1s ease-in-out infinite;
}

@keyframes re-countdown-colon-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.re-countdown--finished .re-countdown__digits {
  filter: saturate(0);
}

.re-countdown__status {
  font-size: 0.65rem;
  color: var(--rm-text-secondary, #64748b);
  margin-top: 8px;
}
</style>
