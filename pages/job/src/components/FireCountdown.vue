<script setup lang="ts">
/**
 * 「下次触发」列：绝对时刻在上、行内倒计时在下，两行并排。
 *
 * 第一行是台账里的触发时刻，原样保留（翻页/刷新时列宽不跳）；第二行是每秒递减的倒计时。
 *
 * 每秒都在变的文本不放进页面级状态：JobView 里若用一个 ref 当"当前时刻"，每次 tick 都会让
 * 父组件重渲染、整张 ReTable 跟着重新 diff，行数一多就与表格自带的自动刷新叠在一起。所以
 * 倒计时收在这个行内组件里，订阅共享心跳（见 {@code utils/ticker.ts}），每帧只更新这一个
 * 文本节点，整页只有一个定时器。
 *
 * 没有可倒数的目标时（未排期、停用）只显示占位符，不硬凑一行空倒计时。
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { fmtDuration, fmtMs } from "../utils/time";
import { onTick } from "../utils/ticker";

const props = defineProps<{
  /** 下次触发时刻（毫秒时间戳）；0 / null / 非法值都按"没有目标"处理 */
  at?: number | null;
  /**
   * 只渲染倒计时文本，不带第一行的绝对时刻。
   *
   * <p>用在「下次触发」与「倒计时」分成两列的表里（调度总览的即将触发）：此时绝对时刻
   * 由所在列自己渲染，本组件再包一层会把同一时刻显示两次。默认 false 保持两行并排的
   * 原样，调度作业页的工作台表依赖那个布局。</p>
   */
  bare?: boolean;
}>();

const now = ref(Date.now());
let unsubscribe: (() => void) | null = null;

onMounted(() => {
  unsubscribe = onTick((tick) => {
    now.value = tick;
  });
});

onBeforeUnmount(() => {
  unsubscribe?.();
  unsubscribe = null;
});

/** 合法的目标时刻；0 表示这一行没有可倒数的目标 */
const target = computed(() => {
  const value = Number(props.at ?? 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
});

/** 第一行：台账里的触发时刻，原样保留 */
const atText = computed(() => (target.value === 0 ? "—" : fmtMs(target.value)));

/** 第二行：剩余 >0 显示倒计时；已到点但台账还没刷新时说明状态，不显示一个负数 */
const leftText = computed(() => {
  if (target.value === 0) {
    return "";
  }
  const left = target.value - now.value;
  return left > 0 ? fmtDuration(left) : "已到点";
});
</script>

<template>
  <span v-if="target === 0" class="collect-num">—</span>
  <span v-else-if="bare" class="fire-cell__left">{{ leftText }}</span>
  <span v-else class="fire-cell">
    <span class="fire-cell__at collect-num">{{ atText }}</span>
    <span class="fire-cell__left">{{ leftText }}</span>
  </span>
</template>

<style scoped>
/* 两行并排：时刻在上、倒计时在下。倒计时同样用等宽数字，秒级跳动时列宽不抖 */
.fire-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.35;
}

.fire-cell__left {
  font-family: var(--cc-font-num, ui-monospace, SFMono-Regular, Consolas, "Courier New", monospace);
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  /* 次要说明文字取 koi 的 tertiary；宿主未挂 koi 时回落 Element Plus 同义变量 */
  color: var(--text-tertiary, var(--el-text-color-secondary));
}
</style>
