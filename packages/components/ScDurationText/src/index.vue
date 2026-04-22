<template>
  <span class="duration-display" :title="titleText">
    {{ display }}
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

// --- 类型定义 ---
type InputTime = string | number | Date | null | undefined;

const props = withDefaults(
  defineProps<{
    /** 起始时间：用于计算 “已持续” */
    from?: InputTime;
    /** 可选：如果你已经有 durationMs，可直接传入 */
    durationMs?: number | null;
    /** 自动刷新间隔（毫秒），0 / 不传：不自动刷新 */
    refreshMs?: number;
    /** 最大展示粒度 */
    precision?: "ms" | "s" | "m";
  }>(),
  {
    refreshMs: 0,
    precision: "s",
  }
);

// --- 响应式状态 ---
const now = ref<number>(Date.now());
// 使用 ReturnType 兼容浏览器和 Node(SSR) 环境的定时器类型
let timer: ReturnType<typeof setInterval> | null = null;

// --- 工具函数 ---
function toMs(v: InputTime): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.getTime();
  
  const s = String(v).trim();
  if (!s) return null;
  // 兼容老版本 Safari 的日期格式
  const d = new Date(s.replace(/-/g, "/"));
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

/** 
 * 核心格式化逻辑（优化了 if-else 嵌套，扩展了天数支持）
 */
function formatDuration(ms: number, precision: "ms" | "s" | "m"): string {
  const v = Math.max(0, ms);

  // 毫秒级直接返回
  if (precision === "ms" && v < 1000) {
    return `${v} ms`;
  }

  // 预先计算各个时间单位
  const totalSeconds = Math.floor(v / 1000);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600) % 24;
  const d = Math.floor(totalSeconds / 86400);

  // 如果指定了以“分钟”为基础精度
  if (precision === "m") {
    const totalMinutes = Math.floor(v / 60000);
    return totalMinutes > 0 ? `${totalMinutes} 分 ${s} 秒` : `${s} 秒`;
  }

  // 默认精度 "s" 的展示逻辑（逐级降级显示）
  if (d > 0) return `${d} 天 ${h} 小时 ${m} 分`;
  if (h > 0) return `${h} 小时 ${m} 分`;
  if (m > 0) return `${m} 分 ${s} 秒`;
  return `${s} 秒`;
}

// --- 计算属性 ---
const durationValue = computed(() => {
  // 1. 如果直接传入了持续时间，优先使用
  if (typeof props.durationMs === "number" && Number.isFinite(props.durationMs)) {
    return Math.max(0, props.durationMs);
  }
  // 2. 否则根据 from 和当前时间计算
  const fromMs = toMs(props.from);
  if (fromMs == null) return null;
  
  // 依赖 now.value，当定时器更新 now 时，这里会自动重新计算
  return Math.max(0, now.value - fromMs);
});

const display = computed(() => {
  const v = durationValue.value;
  return v == null ? "—" : formatDuration(v, props.precision);
});

const titleText = computed(() => {
  const v = durationValue.value;
  return v == null ? "" : `${v} ms`;
});

// --- 定时器控制 ---
function startTimer() {
  stopTimer();
  if (props.refreshMs > 0) {
    timer = setInterval(() => {
      now.value = Date.now(); // 更新当前时间，驱动 computed 重新计算
    }, props.refreshMs);
  }
}

function stopTimer() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

// --- 生命周期与侦听器 ---
onMounted(startTimer);
onUnmounted(stopTimer);

watch(() => props.refreshMs, startTimer);
</script>

<style scoped>
.duration-display {
  /* 使用等宽数字字体特性，防止秒数跳动时 span 宽度忽长忽短导致画面抖动 */
  font-variant-numeric: tabular-nums;
  /* 下面是一些可选的 UI 美化，可以根据你的项目风格删除或修改 */
  color: var(--text-color, #333);
  font-size: 0.95em;
  transition: color 0.2s ease;
}

/* 鼠标悬浮时给一点小反馈 */
.duration-display:hover {
  color: var(--primary-color, #409eff);
  cursor: default;
}
</style>
