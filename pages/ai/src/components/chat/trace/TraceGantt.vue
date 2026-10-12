<template>
  <!--
    执行轨迹甘特图：输入 / 模型 / 工具 三条泳道，横条宽度 = 该区间的实际时长。

    只画后端能证实的时长：没有配对结束事件的区间不给宽度，也不推算，
    而是画成一个未闭合标记——编一个数字出来比空着更容易让人误判性能。
  -->
  <div class="trace-gantt">
    <!-- 时间刻度 -->
    <div class="gantt-axis">
      <div class="gantt-axis-label" />
      <div class="gantt-axis-track">
        <span
          v-for="tick in ticks"
          :key="tick"
          class="gantt-tick"
          :style="{ left: tickPercent(tick) }"
        >{{ formatDuration(tick) }}</span>
      </div>
    </div>

    <!-- 泳道 -->
    <div v-for="lane in lanes" :key="lane.key" class="gantt-lane">
      <div class="gantt-lane-label">{{ lane.label }}</div>
      <div class="gantt-lane-track">
        <!-- 明细点（无区间的轨迹，如提示 / 边缘事件 / Agent 起止） -->
        <span
          v-for="(point, i) in pointsOfLane(lane.key)"
          :key="`p-${i}-${point.seq}`"
          class="gantt-point"
          :style="{ left: percentOf(point.time) }"
          :title="`${formatClock(point.time)} ${point.label}${point.text ? '：' + truncate(point.text) : ''}`"
        />
        <!-- 区间横条 -->
        <template v-if="!isHiddenLane(lane.key)">
          <div
            v-for="span in spansOfLane(lane.key)"
            :key="span.spanId"
            class="gantt-bar"
            :class="[`lane-${span.lane}`, { 'is-open': !span.closed }]"
            :style="barStyle(span)"
            :title="barTitle(span)"
          >
            <span class="gantt-bar-text">{{ barText(span) }}</span>
          </div>
        </template>
        <div v-else class="gantt-lane-collapsed">
          已隐藏（{{ spansOfLane(lane.key).length }} 项）
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  TRACE_LANES,
  formatClock,
  formatDuration,
  type TraceLane,
  type TracePoint,
  type TraceSpan,
} from "./traceTypes";

const props = defineProps<{
  spans: TraceSpan[];
  points: TracePoint[];
  /** 整次运行起点 */
  start: number;
  /** 整次运行时长（毫秒） */
  totalMs: number;
  /** 是否显示时长 */
  showDuration: boolean;
  /** 是否显示轮次 */
  showTurn: boolean;
  /** 是否显示工具调用明细 */
  showCalls: boolean;
}>();

const lanes = TRACE_LANES;

const ticks = computed(() => {
  const total = props.totalMs;
  if (total <= 0) return [0];
  // 5 等分刻度；总时长极短时用更细的步进，避免刻度文字挤成一团
  const step = total / 5;
  return [0, 1, 2, 3, 4, 5].map((i) => Math.round(step * i));
});

function spansOfLane(lane: TraceLane): TraceSpan[] {
  return props.spans.filter((s) => s.lane === lane);
}

function pointsOfLane(lane: TraceLane): TracePoint[] {
  return props.points.filter((p) => p.lane === lane);
}

/** 工具泳道受「调用」开关控制；输入/模型泳道始终可见 */
function isHiddenLane(lane: TraceLane): boolean {
  return lane === "tool" && !props.showCalls;
}

function percentOf(time: number): number {
  if (props.totalMs <= 0) return 0;
  const ratio = (time - props.start) / props.totalMs;
  return Math.min(100, Math.max(0, ratio * 100));
}

function tickPercent(tick: number): string {
  return props.totalMs <= 0 ? "0%" : `${(tick / props.totalMs) * 100}%`;
}

function barStyle(span: TraceSpan) {
  const left = percentOf(span.start);
  if (!span.closed || span.durationMs === null) {
    // 未闭合：只标出发生位置，不给宽度
    return { left: `${left}%`, width: "0" };
  }
  const width = Math.min(100 - left, (span.durationMs / Math.max(1, props.totalMs)) * 100);
  return { left: `${left}%`, width: `${Math.max(0.35, width)}%` };
}

function barText(span: TraceSpan): string {
  const parts: string[] = [];
  if (props.showTurn && span.turn !== null) parts.push(`第${span.turn}轮`);
  if (props.showCalls && span.lane === "tool" && span.toolName) parts.push(span.toolName);
  if (!parts.length) parts.push(span.label);
  if (props.showDuration && span.closed) parts.push(formatDuration(span.durationMs));
  return parts.join(" · ");
}

function barTitle(span: TraceSpan): string {
  const head = `${span.label}｜${formatClock(span.start)}`;
  const dur = span.closed ? `｜耗时 ${formatDuration(span.durationMs)}` : "｜未闭合";
  const detail = span.texts.length ? `｜${truncate(span.texts[span.texts.length - 1])}` : "";
  return `${head}${dur}${detail}`;
}

function truncate(text: string, max = 80): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
</script>

<style scoped>
.trace-gantt {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px 16px;
  font-size: 12px;
}

.gantt-axis,
.gantt-lane {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.gantt-axis-label,
.gantt-lane-label {
  flex: 0 0 44px;
  text-align: right;
  color: #6b7280;
  line-height: 20px;
  user-select: none;
}

.gantt-axis-track,
.gantt-lane-track {
  position: relative;
  flex: 1;
  min-width: 0;
  border-radius: 4px;
  background: #f3f4f6;
  overflow: visible;
}

.gantt-axis-track {
  height: 18px;
  background: transparent;
}

.gantt-lane-track {
  height: 22px;
}

.gantt-tick {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  font-variant-numeric: tabular-nums;
  color: #9ca3af;
  white-space: nowrap;
}

.gantt-point {
  position: absolute;
  top: 50%;
  width: 6px;
  height: 6px;
  margin-left: -3px;
  transform: translateY(-50%) rotate(45deg);
  background: #9ca3af;
}

.gantt-bar {
  position: absolute;
  top: 3px;
  height: 16px;
  min-width: 3px;
  border-radius: 3px;
  overflow: hidden;
  white-space: nowrap;
}

.gantt-bar-text {
  display: block;
  padding: 0 4px;
  font-size: 11px;
  line-height: 16px;
  color: #111827;
  white-space: nowrap;
}

.lane-input {
  background: #c7d2fe;
}

.lane-model {
  background: #a7f3d0;
}

.lane-tool {
  background: #fed7aa;
}

/* 未闭合区间：只有起点，没有宽度 */
.gantt-bar.is-open {
  width: 0 !important;
  border-left: 2px dashed #9ca3af;
  border-radius: 0;
  background: transparent;
}

.gantt-bar.is-open .gantt-bar-text {
  display: none;
}

.gantt-lane-collapsed {
  padding: 0 6px;
  line-height: 22px;
  color: #9ca3af;
}
</style>
