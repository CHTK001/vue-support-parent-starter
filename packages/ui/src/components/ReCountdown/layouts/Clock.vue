<script setup lang="ts">
/**
 * ReCountdown — clock 数字时钟布局
 *
 * 每个时间单位（时/分/秒）是一个独立卡片：
 *   卡片顶部是单位进度环（ring）或进度方（square），
 *   中间显示该单位的数值，
 *   底部显示单位标签。
 *
 * 数据源：父组件透传的 remaining（ms）。
 */
import { computed } from "vue";
import "../../shared/modern-vars.css";
import type { CountdownLayoutProps, CountdownUnit } from "../types";
import { relevantUnits, unitTexts, timeValues, unitTotal, UNIT_LABELS } from "../utils";

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

const colorMap = {
  primary: "var(--rm-primary)",
  success: "var(--rm-success)",
  warning: "var(--rm-warning)",
  danger: "var(--rm-danger)",
  info: "var(--rm-info)",
  secondary: "var(--rm-text-regular)",
};

/** 要显示的单位 */
const units = computed(() => relevantUnits(props.total ?? 0, props.format));

/** 各单位数值（h/m/s/d） */
const values = computed(() => timeValues(props.remaining));

/** 各单位的数值文本（已补零，顺序与 units 一致） */
const texts = computed(() => unitTexts(props.remaining, units.value));

/**
 * 各单位的进度（0~1）
 *
 * 秒环按 60 秒的周期跳动（像数字表的秒），分/时/天环按总时长的占比跳动
 *（如 5 分的倒计时，"分" 环从 100% 掉到 0%）。
 */
const ratios = computed(() => {
  const total = props.total ?? 0;
  return units.value.map((u: CountdownUnit) => {
    const max = unitTotal(total, u);
    return Math.min(1, Math.max(0, values.value[u] / max));
  });
});

/** 是否结束（全部置灰） */
const finished = props.finished;
</script>

<template>
  <div
    class="re-countdown re-countdown--clock"
    :class="{ 're-countdown--finished': finished, 're-countdown--paused': props.paused }"
    :style="{ '--cd-color': colorMap[props.color] }"
  >
    <div class="re-countdown__body">
      <div class="re-countdown__title" v-if="props.showLabel">
        {{ props.label ?? "倒计时" }}
      </div>
      <div class="re-countdown__units">
        <div class="re-countdown__unit" v-for="(u, i) in units" :key="`${u}-${props.remaining}`">
          <!-- 顶部进度：环或方 -->
          <div class="re-countdown__progress">
            <svg v-if="props.unitShape === 'ring'" class="re-countdown__progress__ring" viewBox="0 0 100 100">
              <circle class="re-countdown__progress__track" cx="50" cy="50" r="45" />
              <circle
                class="re-countdown__progress__indicator"
                cx="50" cy="50" r="45"
                stroke-linecap="round"
                :stroke-dasharray="CIRCUMFERENCE"
                :stroke-dashoffset="CIRCUMFERENCE * (1 - ratios[i])"
              />
            </svg>
            <div v-else class="re-countdown__progress__square">
              <div class="re-countdown__progress__fill" :style="{ '--p': `${ratios[i] * 100}%` }" />
            </div>
          </div>
          <div class="re-countdown__value">{{ texts[i] }}</div>
          <div class="re-countdown__label">{{ UNIT_LABELS[u] }}</div>
        </div>
      </div>
      <div class="re-countdown__status" v-if="props.showText">
        {{ finished ? "已结束" : `剩余 ${Math.round(props.remaining)} ms` }}
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

.re-countdown--finished .re-countdown__unit {
  filter: saturate(0);
}

.re-countdown__title {
  font-size: 0.75rem;
  color: var(--rm-text-regular, #475569);
  margin-bottom: 6px;
  line-height: 1.2;
}

.re-countdown__units {
  display: inline-flex;
  align-items: flex-start;
  gap: 6px;
}

.re-countdown__unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

/* ---- 顶部进度（环/方） ---- */
.re-countdown__progress {
  width: 2rem;
  height: 2rem;
  line-height: 0;
  color: var(--rm-text, #1e293b);
}

.re-countdown__progress__ring,
.re-countdown__progress__square {
  width: 100%;
  height: 100%;
}

.re-countdown__progress__ring {
  transform: rotate(-90deg);
  transform-origin: center;
}

.re-countdown__progress__track {
  fill: none;
  stroke: var(--rm-border);
  stroke-width: 8;
}

.re-countdown__progress__indicator {
  fill: none;
  stroke: var(--cd-color);
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke 250ms var(--rm-transition);
}

/* 正方形进度 */
.re-countdown__progress__square {
  position: relative;
  border: 2px solid var(--rm-border);
  border-radius: var(--rm-radius);
  background: var(--rm-bg-subtle, #f8fafc);
  overflow: hidden;
}

.re-countdown__progress__fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: var(--p, 100%);
  background: var(--cd-color);
  /* 高度每帧刷新，不做过渡（只让描边颜色变） */
  transition: background 250ms var(--rm-transition);
}

/* ---- 数字 ---- */
.re-countdown__value {
  font-size: 1rem;
  font-weight: 600;
  font-family: "SF Mono", ui-monospace, Menlo, monospace;
  color: var(--rm-text, #1e293b);
  line-height: 1.2;
}

/* ---- 标签 ---- */
.re-countdown__label {
  font-size: 0.625rem;
  color: var(--rm-text-secondary, #64748b);
  line-height: 1.2;
}

.re-countdown__status {
  font-size: 0.65rem;
  color: var(--rm-text-secondary, #64748b);
  margin-top: 8px;
}
</style>
