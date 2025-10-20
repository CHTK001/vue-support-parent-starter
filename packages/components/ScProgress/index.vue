<template>
  <div class="sc-progress" :class="[`type-${innerType}`, `text-${textPosition}`]" :style="rootStyle">
    <!-- Element Plus 模式 -->
    <template v-if="innerType === 'el'">
      <el-progress
        :percentage="clamped"
        :stroke-width="strokeWidth"
        :text-inside="textPosition === 'inside' && showText"
        :show-text="textPosition === 'inside' ? showText : false"
        :color="currentColor"
        :status="status"
      />
      <div v-if="showText && textPosition !== 'inside'" class="sc-progress__text" :style="{ color: effectiveTextColor }">
        {{ displayText }}
      </div>
    </template>

    <!-- 线性进度条（自定义） -->
    <template v-else-if="innerType === 'line'">
      <div class="sc-progress__bar" :style="barStyle">
        <div class="sc-progress__inner" :style="innerStyle">
          <span v-if="showText && textPosition === 'inside'" class="sc-progress__text--inside" :style="{ color: effectiveTextColor }">
            {{ displayText }}
          </span>
        </div>
        <!-- 右侧液体边缘覆盖层（使用轨道色绘制，使边缘呈现液体侵蚀效果） -->
        <div v-if="lineLiquidCap && clamped > 0" class="sc-progress__wave-cap" :style="waveCapStyle" aria-hidden="true">
          <svg :viewBox="`0 0 100 100`" preserveAspectRatio="none" width="100%" height="100%">
            <path :d="verticalWavePath" :fill="trailColor" />
          </svg>
        </div>
      </div>
      <div v-if="showText && textPosition !== 'inside'" class="sc-progress__text" :style="{ color: effectiveTextColor }">
        {{ displayText }}
      </div>
    </template>

    <!-- 液体上升圆形进度条 -->
    <template v-else-if="innerType === 'liquid'">
      <div class="sc-progress__liquid" :style="circleBoxStyle">
        <svg :width="sizePx" :height="sizePx" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="progress">
          <defs>
            <clipPath :id="clipId">
              <circle cx="50" cy="50" :r="radius" />
            </clipPath>
          </defs>

          <g :clip-path="`url(#${clipId})`">
            <!-- 背景 -->
            <rect x="0" y="0" width="100" height="100" :fill="trailColor" />

            <!-- 液面填充层 -->
            <rect x="0" :y="100 - clamped" width="100" :height="clamped" :fill="currentColor" />

            <!-- 波浪层 1 -->
            <g :transform="`translate(${waveOffset1}, 0)`" opacity="0.4">
              <path :d="wavePath(100 - clamped, 4, 25)" :fill="currentColor">
                <animateTransform attributeName="transform" type="translate" from="0 0" to="25 0" dur="2s" repeatCount="indefinite" />
              </path>
            </g>
            <!-- 波浪层 2 -->
            <g :transform="`translate(${waveOffset2}, 0)`" opacity="0.6">
              <path :d="wavePath(100 - clamped + 1.5, 3, 20)" :fill="currentColor">
                <animateTransform attributeName="transform" type="translate" from="0 0" to="20 0" dur="3s" repeatCount="indefinite" />
              </path>
            </g>
          </g>

          <!-- 外环描边 -->
          <circle cx="50" cy="50" :r="radius" :stroke="ringColor" :stroke-width="ringWidth" fill="none" />

          <!-- 文本 -->
          <template v-if="showText">
            <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" :fill="effectiveTextColor" :font-size="fontSize">
              {{ displayText }}
            </text>
          </template>
        </svg>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Stage {
  /** 达到该阈值(<=)时使用的颜色 */
  threshold: number;
  /** 颜色值 */
  color: string;
}

interface Props {
  /** 进度百分比 0-100 */
  percentage: number;
  /** 类型：'line' | 'el' | 'liquid' */
  type?: "line" | "el" | "liquid";
  /** 显示文本 */
  showText?: boolean;
  /** 文本位置：inside | top | bottom | left | right */
  textPosition?: "inside" | "top" | "bottom" | "left" | "right";
  /** 文本颜色 */
  textColor?: string;
  /** 进度值颜色（优先级高于 textColor） */
  valueColor?: string;
  /** 自定义文本格式化 */
  valueFormat?: (p: number) => string;
  /** 轨道颜色（未完成部分） */
  trailColor?: string;
  /** 进度颜色（与 stages 二选一，stages 优先） */
  color?: string;
  /** 多阶段阈值配置 */
  stages?: Stage[];
  /** 线性/ElementPlus 宽度（容器宽度），可用百分比/px */
  width?: string | number;
  /** 线性高度/粗细 */
  strokeWidth?: number;
  /** 状态（Element Plus）success/exception/warning */
  status?: "success" | "exception" | "warning";
  /** 液体/圆形大小（px） */
  size?: number;
  /** 圆环描边颜色 */
  ringColor?: string;
  /** 圆环描边宽度 */
  ringWidth?: number;
  /** 圆半径（视图坐标系 0-50 默认48） */
  radius?: number;
  /** 字体大小（液体模式） */
  fontSize?: number;
  /** 线性进度右侧液体边缘（默认开启） */
  lineLiquidCap?: boolean;
  /** 液体边缘宽度(px)，默认 1.6 * strokeWidth */
  capWidth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  type: "line",
  showText: true,
  textPosition: "inside",
  strokeWidth: 8,
  trailColor: "#f5f7fa",
  ringColor: "var(--el-border-color, #dcdfe6)",
  ringWidth: 2,
  size: 120,
  radius: 48,
  fontSize: 18,
  lineLiquidCap: true
});

const clamped = computed(() => Math.max(0, Math.min(100, props.percentage ?? 0)));
const innerType = computed(() => props.type || "line");

const stagesSorted = computed(() => {
  if (!props.stages || props.stages.length === 0) return [] as Stage[];
  return [...props.stages].sort((a, b) => a.threshold - b.threshold);
});

const currentColor = computed(() => {
  const p = clamped.value;
  if (stagesSorted.value.length) {
    for (const s of stagesSorted.value) {
      if (p <= s.threshold) return s.color;
    }
    return stagesSorted.value[stagesSorted.value.length - 1].color;
  }
  return props.color || "#409eff";
});

const effectiveTextColor = computed(() => props.valueColor || props.textColor || "var(--el-text-color-primary, #303133)");

const displayText = computed(() => {
  if (props.valueFormat) return props.valueFormat(clamped.value);
  return `${Math.round(clamped.value)}%`;
});

const rootStyle = computed(() => ({
  width: props.width != null ? (typeof props.width === "number" ? `${props.width}px` : String(props.width)) : undefined
}));

// line
const barStyle = computed(() => ({
  height: `${props.strokeWidth}px`,
  background: props.trailColor
}));

const innerStyle = computed(() => ({
  width: `${clamped.value}%`,
  background: currentColor.value,
  height: "100%"
}));

// line liquid right cap
const capWidthPx = computed(() => props.capWidth ?? Math.round(props.strokeWidth * 1.6));
const waveCapStyle = computed(() => ({
  width: `${capWidthPx.value}px`,
  height: "100%"
}));

function buildVerticalWavePath(W = 100, H = 100, ampRate = 0.45, cycles = 2): string {
  const A = W * ampRate; // 振幅（最大侵蚀宽度）
  const steps = 24;
  const k = cycles * Math.PI * 2; // 角频率
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const y = (H * i) / steps;
    const s = Math.sin((k * y) / H);
    const x = W - A * (1 + s); // x ∈ [W-2A, W]
    pts.push(`${Math.max(0, Math.min(W, x)).toFixed(3)} ${y.toFixed(3)}`);
  }
  // 构造路径：右上 -> 依次波形 -> 右下 -> 右上
  let d = `M ${W} 0 L ${pts[0]}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i]}`;
  d += ` L ${W} ${H} Z`;
  return d;
}

const verticalWavePath = computed(() => buildVerticalWavePath(100, 100, 0.45, 2));

// liquid
const sizePx = computed(() => props.size);
const circleBoxStyle = computed(() => ({ width: `${sizePx.value}px`, height: `${sizePx.value}px` }));
const ringColor = computed(() => props.ringColor);
const ringWidth = computed(() => props.ringWidth);

// 波浪初始偏移
const waveOffset1 = 0;
const waveOffset2 = -10;

function wavePath(y: number, amp = 4, waveLen = 25): string {
  const startY = Math.max(0, Math.min(100, y));
  let d = `M 0 ${startY}`;
  let x = 0;
  while (x <= 100 + waveLen) {
    const mid = x + waveLen / 2;
    const next = x + waveLen;
    d += ` Q ${mid} ${startY - amp} ${next} ${startY}`;
    x = next;
  }
  d += ` L 100 100 L 0 100 Z`;
  return d;
}

const status = computed(() => props.status);
const trailColor = computed(() => props.trailColor);
const radius = computed(() => props.radius);
const fontSize = computed(() => props.fontSize);
const clipId = `clip-${Math.random().toString(36).slice(2, 8)}`;
</script>

<style scoped>
.sc-progress {
  display: inline-flex;
  flex-direction: column;
}

.sc-progress.text-top .sc-progress__text {
  order: -1;
  margin-bottom: 6px;
}

.sc-progress.text-bottom .sc-progress__text {
  margin-top: 6px;
}

.sc-progress.text-left {
  flex-direction: row;
  align-items: center;
}
.sc-progress.text-left .sc-progress__text {
  order: -1;
  margin-right: 8px;
}

.sc-progress.text-right {
  flex-direction: row;
  align-items: center;
}
.sc-progress.text-right .sc-progress__text {
  margin-left: 8px;
}

.sc-progress__bar {
  position: relative;
  width: 100%;
  border-radius: 100px;
  overflow: hidden;
}

.sc-progress__wave-cap {
  position: absolute;
  top: 0;
  right: 0;
  pointer-events: none;
}

.sc-progress__inner {
  position: relative;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s ease;
}

.sc-progress__text--inside {
  font-size: 12px;
  white-space: nowrap;
  padding: 0 6px;
}

.sc-progress__text {
  font-size: 12px;
  line-height: 1;
}

.sc-progress__liquid {
  display: inline-block;
}
</style>
