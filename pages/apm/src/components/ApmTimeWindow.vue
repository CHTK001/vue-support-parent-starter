<!--
  APM 时间窗选择器 —— 预设分钟数 + 自定义起止区间。

  <p>为什么把「时间窗」做成一个组件：12 个页签原来各放一个 minutes 下拉，
  加「自定义区间」就得改 12 处、且各自演化出 12 种交互。收在这里之后，
  预设与自定义永远同框出现 —— 选「自定义」时区间选择器紧贴着下拉展开，
  不会出现「选了自定义却找不到在哪里填时间」的断片。</p>

  <p>区间值用毫秒时间戳（value-format="x"）与后端 ApmQuery 的 startTime/endTime
  直接对齐，组件不持有自己的口径。</p>
-->
<template>
  <span class="apm-time-window">
    <ReSelect v-model="mode" :options="options" style="width: 148px" @change="onModeChange" />
    <ReDatePicker
      v-if="mode === CUSTOM_WINDOW_VALUE"
      v-model="range"
      type="datetimerange"
      value-format="x"
      :clearable="false"
      start-placeholder="开始时间"
      end-placeholder="结束时间"
      style="width: 336px"
      @change="onRangeChange"
    />
  </span>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import ReDatePicker from "@repo/ui/re-date-picker";
import ReSelect from "@repo/ui/re-select";
import { WINDOW_OPTIONS } from "../utils/format";
import { CUSTOM_WINDOW_VALUE, DEFAULT_WINDOW_MINUTES, isCustomWindow } from "../utils/timeRange";
import type { ApmTimeWindow } from "../utils/timeRange";

const props = defineProps<{
  /** 当前时间窗（受控）：预设给 minutes，自定义给 startTime/endTime */
  modelValue: ApmTimeWindow;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: ApmTimeWindow): void;
  (e: "change", value: ApmTimeWindow): void;
}>();

/** 预设 + 自定义；自定义用 0 占位，不会与正分钟数撞车 */
const options = [...WINDOW_OPTIONS, { label: "自定义", value: CUSTOM_WINDOW_VALUE }];

const mode = ref<number>(DEFAULT_WINDOW_MINUTES);
const range = ref<[number, number]>(defaultRange());

function defaultRange(): [number, number] {
  const end = Date.now();
  return [end - DEFAULT_WINDOW_MINUTES * 60_000, end];
}

/**
 * 外部窗口变化（如消费跳转上下文）→ 同步控件显示。
 * 只回填显示、不再对外发事件，避免父组件 setState → 子组件 emit 的回环。
 */
watch(
  () => props.modelValue,
  (value) => {
    if (isCustomWindow(value)) {
      mode.value = CUSTOM_WINDOW_VALUE;
      range.value = [value.startTime!, value.endTime!];
      return;
    }
    mode.value = value.minutes > 0 ? value.minutes : DEFAULT_WINDOW_MINUTES;
  },
  { immediate: true, deep: true },
);

function emitWindow(value: ApmTimeWindow): void {
  emit("update:modelValue", value);
  emit("change", value);
}

/** 切预设 → 立即按分钟数生效；切自定义 → 先冻结一个「最近 30 分钟」的固定区间，选了再改 */
function onModeChange(value: number): void {
  if (value === CUSTOM_WINDOW_VALUE) {
    range.value = defaultRange();
    emitWindow({ minutes: CUSTOM_WINDOW_VALUE, startTime: range.value[0], endTime: range.value[1] });
    return;
  }
  emitWindow({ minutes: value });
}

/** 区间确认（value-format="x"，拿到的是毫秒对） */
function onRangeChange(value: [number, number] | null): void {
  if (!value || !value[0] || !value[1] || value[1] <= value[0]) {
    return;
  }
  range.value = value;
  emitWindow({ minutes: CUSTOM_WINDOW_VALUE, startTime: value[0], endTime: value[1] });
}
</script>

<style scoped>
.apm-time-window {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
</style>
