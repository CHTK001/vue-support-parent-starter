<script setup lang="ts">
/**
 * 「触发轨迹」列：一条横条，左边是最近 N 次已触发、右边是接下来 N 次将触发。
 *
 * <p>形态照参考图做成「一段轨道 + 滑块」：左半段是已经过去的节奏（轨道填色到「现在」为止），
 * 右半段还没发生（轨道留空），中间那个白色圆点就是「现在」。轨道上的小点是一次次触发，
 * 位置按真实时间比例落点，所以间隔不匀的 cron（比如工作日 9 点）也能一眼看出疏密。</p>
 *
 * <p>为什么单独成组件：轨迹要跟着「当前时刻」走，且每个点都要带时刻提示。把这段放进 JobView
 * 会让整张表在每次心跳时重渲染；收在这里只重排这一格，与「下次触发」列的 {@link FireCountdown}
 * 共用一套心跳（utils/ticker.ts，整页一个定时器）。</p>
 *
 * <p>口径：历史点由 cron 表达式回溯算出（utils/fireTrail.ts，解析器与服务端同源），
 * 与台账里的 lastFireTime 并不必然一致——台账只记「实际派发过」的时刻，回溯是「本该派发」。
 * 因此历史点只作节奏参考，悬停说明里明确标注两者差别，不谎称它是真实执行记录。</p>
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { fmtFireTime } from "../utils/jobFormat";
import { buildFireTrail } from "../utils/fireTrail";
import { fmtDuration } from "../utils/time";
import { onTick } from "../utils/ticker";

const props = withDefaults(
  defineProps<{
    /** cron 表达式；空值 / 非法时整条轨迹退化为占位符 */
    cron?: string | null;
    /** 台账里的最近一次实际触发时刻（毫秒），用于校准「现在」标记的说明 */
    lastFireTime?: number | null;
    /** 左侧历史点数，默认 4 */
    past?: number;
    /** 右侧未来点数，默认 4 */
    future?: number;
  }>(),
  { cron: "", lastFireTime: null, past: 4, future: 4 },
);

/** 当前时刻：只在本组件内跳，父表不跟着重渲染 */
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

/** 轨迹是按分钟量级的表达式算的，心跳每秒重算一次太浪费：按分钟粒度缓存 */
const nowMinute = computed(() => Math.floor(now.value / 60_000) * 60_000);

const trail = computed(() => buildFireTrail(props.cron, nowMinute.value, props.past, props.future));

/** 没有任何可算的点：表达式为空或永不匹配 */
const empty = computed(() => !trail.value.past.length && !trail.value.future.length);

/** 最近一个未来点的剩余时间，作为这条轨迹的一句话结论 */
const nextLeft = computed(() => {
  const next = trail.value.future[0];
  return next ? fmtDuration(next - now.value) : "";
});

/** 一个轨道点：时间比例位置 + 是否已经过去 + 悬停说明 */
interface TrailDot {
  /** 在轨道上的百分比位置（0-100） */
  pos: number;
  past: boolean;
  tip: string;
}

/** 历史点的悬停说明：写明是「按 cron 推算」，与台账的实际派发时刻区分开 */
function pastTip(at: number): string {
  const line = `按 cron 推算 · ${fmtFireTime(new Date(at))}`;
  const actual = Number(props.lastFireTime ?? 0);
  if (!Number.isFinite(actual) || actual <= 0) {
    return `${line}\n台账暂无实际派发记录`;
  }
  return `${line}\n台账最近一次实际派发：${fmtFireTime(new Date(actual))}`;
}

function futureTip(at: number): string {
  return `计划触发 · ${fmtFireTime(new Date(at))}`;
}

/**
 * 时间轴布局：以「最早的历史点 → 最远的未来点」为整段轨道。
 *
 * <p>按真实时间比例落点，而不是把 N 个点等分——等分会把「每分钟一次」和「每周一次」
 * 两种节奏画成同一个样子，也就失去了看轨迹的意义。</p>
 */
const layout = computed(() => {
  const past = trail.value.past;
  const future = trail.value.future;
  const start = past.length ? past[0] : nowMinute.value;
  const end = future.length ? future[future.length - 1] : nowMinute.value;
  const span = Math.max(1, end - start);
  const percent = (ms: number) => Math.min(100, Math.max(0, ((ms - start) / span) * 100));
  const dots: TrailDot[] = [
    ...past.map(at => ({ pos: percent(at), past: true, tip: pastTip(at) })),
    ...future.map(at => ({ pos: percent(at), past: false, tip: futureTip(at) })),
  ];
  return { dots, nowPercent: percent(now.value) };
});
</script>

<template>
  <span v-if="empty" class="collect-num">—</span>
  <span
    v-else
    class="fire-trail"
    :title="nextLeft ? `现在 · ${nextLeft}后触发` : '按 cron 推算的触发节奏'"
  >
    <span class="fire-trail__bar">
      <!-- 已过去的部分：轨道填色到「现在」为止，长度就等于这一轮周期的进度 -->
      <span class="fire-trail__fill" :style="{ width: `${layout.nowPercent}%` }"/>
      <i
        v-for="dot in layout.dots"
        :key="`${dot.past ? 'p' : 'f'}-${dot.pos}-${dot.tip}`"
        class="fire-trail__dot"
        :class="dot.past ? 'fire-trail__dot--past' : 'fire-trail__dot--future'"
        :style="{ left: `${dot.pos}%` }"
        :title="dot.tip"
      />
      <!-- 「现在」滑块：白色圆点压在轨道上，与参考图的滑块位置同义 -->
      <span class="fire-trail__thumb" :style="{ left: `${layout.nowPercent}%` }" aria-hidden="true"/>
    </span>
    <span class="fire-trail__left">{{ nextLeft ? `${nextLeft}后触发` : "已到点" }}</span>
  </span>
</template>

<style scoped>
/* 整条轨迹：轨道在上、剩余时间在下，与「下次触发」列的两行布局对齐 */
.fire-trail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  min-width: 0;
}

/* 轨道：圆头长条，未发生的部分留空 */
.fire-trail__bar {
  position: relative;
  display: block;
  height: 10px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--text-tertiary, var(--el-text-color-placeholder)) 24%, transparent);
}

/* 已发生的部分：主色填充，右端由滑块盖住，不强调自己的硬边 */
.fire-trail__fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: var(--el-color-primary);
  opacity: 0.85;
}

/* 每次触发的小点：垂直居中压在轨道上，位置按时间比例 */
.fire-trail__dot {
  position: absolute;
  top: 50%;
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  transform: translate(-50%, -50%);
  cursor: help;
}

/* 已经过去的点：落在填色区上，用白色半透明把「节奏」托出来 */
.fire-trail__dot--past {
  background: color-mix(in srgb, var(--el-bg-color, #fff) 78%, transparent);
}

/* 还没到的点：落在空轨道上，用中性色 —— 不抢「现在」的注意力 */
.fire-trail__dot--future {
  background: var(--text-tertiary, var(--el-text-color-placeholder));
}

/* 「现在」滑块：比轨道略高，带一点投影把它从轨道上抬起来 */
.fire-trail__thumb {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  background: var(--el-bg-color, #fff);
  border: 1px solid color-mix(in srgb, var(--text-tertiary, var(--el-text-color-placeholder)) 30%, transparent);
  box-shadow: 0 1px 3px rgb(0 0 0 / 18%);
  transform: translate(-50%, -50%);
}

/* 剩余时间：等宽数字，秒级跳动时列宽不抖 */
.fire-trail__left {
  font-family: var(--cc-font-num, ui-monospace, SFMono-Regular, Consolas, "Courier New", monospace);
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
