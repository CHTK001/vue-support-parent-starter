<script setup lang="ts">
/**
 * ReCountdown —— 倒计时组件
 *
 * layout 只负责展示，不碰倒计时逻辑；
 * 逻辑层走 workjs（基于 @repo/work/countdown 的全局 worker 秒级 tick + rAF 插值）。
 *
 * 默认 layout = dial。
 *
 * 用法：
 *   <ReCountdown :duration="60" layout="dial" />
 *   <ReCountdown :end="Date.now() + 120_000" layout="segment" />
 *   <ReCountdown v-model:paused="isPaused" :duration="300" />
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { CountdownColor, CountdownLayout } from "./types";
import { destroyCountdown, initCountdown, pauseCountdown, resumeCountdown, startCountdownLoop } from "./workjs";

import ReCountdownDial from "./layouts/Dial.vue";
import ReCountdownRibbon from "./layouts/Ribbon.vue";
import ReCountdownPulse from "./layouts/Pulse.vue";
import ReCountdownSegmented from "./layouts/Segmented.vue";
import ReCountdownTicker from "./layouts/Ticker.vue";

const LAYOUTS: Record<CountdownLayout, unknown> = {
  dial: ReCountdownDial,
  ribbon: ReCountdownRibbon,
  pulse: ReCountdownPulse,
  segment: ReCountdownSegmented,
  ticker: ReCountdownTicker,
};

const props = withDefaults(
  defineProps<{
    /** 倒计时秒数 */
    duration?: number;
    /** 目标时间戳（ms） */
    end?: number;
    /** 是否暂停 */
    paused?: boolean;
    /** 倒计时总时长（ms），用于表盘环的进度；0 = 不画进度环 */
    total?: number;
    /** 展示布局 */
    layout?: CountdownLayout;
    /** 尺寸 px */
    size?: number;
    /** 颜色 */
    color?: CountdownColor;
    /** 是否展示数字 */
    showNumber?: boolean;
    /** 是否展示文本 */
    showText?: boolean;
    /** 是否展示标签 */
    showLabel?: boolean;
    /** 结束动画 */
    endAnimation?: boolean;
    /** 结束回调 */
    onEnd?: () => void;
    /** 标签 */
    label?: string;
    /** 外部任务 id */
    id?: string;
  }>(),
  {
    duration: undefined,
    end: undefined,
    paused: false,
    total: 0,
    layout: "dial",
    size: 60,
    color: "primary",
    showNumber: true,
    showText: true,
    showLabel: false,
    endAnimation: false,
    onEnd: undefined,
    label: undefined,
    id: undefined,
  }
);

const emit = defineEmits<{
  end: [];
  pause: [];
  resume: [];
}>();

/** 任务 id 计数 */
let taskIdCounter = 0;

/** 任务 id（全局唯一） */
const taskId = computed(() => props.id ?? `recountdown-${taskIdCounter++}`);

/** 剩余 ms（循环驱动，各 layout 消费） */
const remaining = ref(0);
/** 是否已结束 */
const finished = ref(false);
/** 是否已触发过 end（防重复） */
const ended = ref(false);

/** 停止 rAF 循环的函数 */
let stopLoop: (() => void) | null = null;

/** 目标时间戳（ms） */
const endTime = computed(() => {
  if (props.end) return props.end;
  return (props.duration ?? 60) * 1000 + Date.now();
});

const layoutComponent = computed(() => LAYOUTS[props.layout] ?? ReCountdownDial);

onMounted(() => {
  // 注册到 workjs（由 registry 驱动，确保暂停/恢复/剩余时间走同一套）
  const task = { id: taskId.value, endTime: endTime.value, label: props.label, paused: props.paused };
  initCountdown(task);
  // 恢复态也是：已暂停的任务不驱动循环
  if (props.paused) pauseCountdown(taskId.value);
  stopLoop = startCountdownLoop((tasks) => {
    const task = tasks.find((t) => t.id === taskId.value);
    if (!task || task.paused) return; // 暂停：不驱动 remaining 与 finished
    const next = Math.max(0, task.endTime - Date.now());
    remaining.value = next;
    const isDone = next <= 0;
    finished.value = isDone;
    if (isDone && !ended.value) {
      ended.value = true;
      emit("end");
      props.onEnd?.();
    }
  });
  remaining.value = Math.max(0, endTime.value - Date.now());
});

onBeforeUnmount(() => {
  stopLoop?.();
  destroyCountdown(taskId.value);
});

/** 动态暂停/恢复（父态Sync 到 workjs） */
watch(
  () => props.paused,
  (paused: boolean) => {
    if (paused) {
      pauseCountdown(taskId.value);
      emit("pause");
    } else {
      resumeCountdown(taskId.value);
      emit("resume");
    }
  }
);

/**
 * 目标时间变化（父级刷新了「上次执行时间 / 间隔」）时重新登记：
 * 否则 workjs 里仍是挂载时的那条任务，表盘会停在旧倒计时上不动。
 */
watch(endTime, (value: number) => {
  initCountdown({ id: taskId.value, endTime: value, label: props.label, paused: props.paused });
  if (props.paused) pauseCountdown(taskId.value);
  else resumeCountdown(taskId.value);
  ended.value = false;
  remaining.value = Math.max(0, value - Date.now());
  finished.value = remaining.value <= 0;
});

/** 暴露 API */
defineExpose({
  /** 剩余 ms */
  getRemaining: () => remaining.value,
  /** 是否结束 */
  isFinished: () => finished.value,
});
</script>

<template>
  <component
    :is="layoutComponent"
    :layout="layout"
    :remaining="remaining"
    :finished="finished"
    :size="size"
    :color="color"
    :show-number="showNumber"
    :show-text="showText"
    :show-label="showLabel"
    :end-animation="endAnimation"
    :label="label"
    :total="total"
    :paused="paused"
  />
</template>
