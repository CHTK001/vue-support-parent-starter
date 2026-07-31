<script setup lang="ts">
/**
 * ReTime —— 时间展示组件
 *
 * 接受任意时间输入（Date / string / number），按 format 输出对应格式。
 * 支持同时展示格式化时间 + 灰色"多久之前"中文相对时间。
 *
 * 用法：
 *   <ReTime :value="1719700000000" format="YYYY-MM-DD HH:mm:ss" />
 *   <ReTime :value="date" :relative="true" />
 *   <ReTime :value="ms" format="duration" />
 *   <ReTime :value="ms" format="ms" />
 *
 * 用 absoluteTime / relativeTime 插槽可自定义主行/副行的渲染。
 */
import { computed, onBeforeUnmount, ref, watch } from "vue";
import type { ReTimeFormat, ReTimeValue } from "./types";
import { formatValue, relativeTime, toMs } from "./utils";

defineOptions({ name: "ReTime", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 时间值：Date / string / number（毫秒或秒级时间戳）/ null */
    value?: ReTimeValue;
    /** 输出格式。内置或自定义 token 串 */
    format?: ReTimeFormat;
    /** 是否同时显示灰色相对时间（中文 "3 分钟前"） */
    relative?: boolean;
    /** 相对时间更新间隔（毫秒）。传 0 / false 关闭定时刷新。 */
    refreshInterval?: number;
    /** 占位文本（value 为空时显示） */
    placeholder?: string;
    /** 自定义基准时间（用于 relative，主要用于测试） */
    base?: number;
  }>(),
  {
    value: undefined,
    format: "YYYY-MM-DD HH:mm:ss",
    relative: false,
    refreshInterval: 30_000,
    placeholder: "-",
    base: undefined,
  },
);

/** 主行格式化结果 */
const display = computed<string>(() => {
  if (props.value === null || props.value === undefined || props.value === "") {
    return "";
  }
  return formatValue(props.value, props.format);
});

/** 副行相对时间 */
const relText = computed<string>(() => {
  if (!props.relative) return "";
  const base = props.base ?? Date.now();
  return relativeTime(props.value, base);
});

/** 触发刷新（用于相对时间随时间流逝） */
const tick = ref<number>(0);
let timer: ReturnType<typeof setInterval> | null = null;

function startTimer(): void {
  stopTimer();
  if (!props.relative) return;
  if (!props.refreshInterval || props.refreshInterval <= 0) return;
  // 距离最近一次刷新阈值超过 60 秒时，按 refreshInterval 刷新
  timer = setInterval(() => {
    tick.value = Date.now();
  }, props.refreshInterval);
}

function stopTimer(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

watch(
  () => [props.relative, props.refreshInterval, props.value] as const,
  () => {
    startTimer();
  },
  { immediate: true },
);

onBeforeUnmount(stopTimer);

/** 给副行 computed 留个依赖以便 tick 触发刷新 */
const relTextLive = computed<string>(() => {
  // 读取 tick 以建立响应式依赖
  void tick.value;
  return relText.value;
});

/** 最终展示：无值时显示 placeholder */
const finalDisplay = computed<string>(() => {
  if (props.value === null || props.value === undefined || props.value === "" || Number.isNaN(toMs(props.value))) {
    return props.placeholder;
  }
  return display.value;
});

/** 供外部校验/格式化复用 */
const msValue = computed<number>(() => toMs(props.value));

defineExpose({
  /** 当前解析后的毫秒时间戳 */
  getMs(): number {
    return msValue.value;
  },
  /** 当前格式化结果 */
  format(): string {
    return display.value;
  },
});
</script>

<template>
  <span class="re-time">
    <span class="re-time__main" :title="display">
      <slot name="absoluteTime" :value="display" :ms="msValue">
        {{ finalDisplay }}
      </slot>
    </span>
    <span v-if="relative && relTextLive" class="re-time__relative">
      <slot name="relativeTime" :value="relTextLive">{{ relTextLive }}</slot>
    </span>
  </span>
</template>

<style scoped>
.re-time {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.4;
  font-size: inherit;
}
.re-time__main {
  color: var(--el-text-color-primary);
}
.re-time__relative {
  color: var(--el-text-color-secondary);
  font-size: 0.85em;
  margin-top: 2px;
}
</style>