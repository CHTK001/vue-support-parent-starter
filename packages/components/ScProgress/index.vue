<template>
  <el-tooltip :content="tooltipText" :placement="tooltipPlacement" :show-after="tooltipShowAfter">
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
        <div v-if="showText && textPosition !== 'inside'" class="sc-progress__text" :style="{ color: effectiveTextColor }">{{ displayText }}</div>
      </template>

      <!-- 线性进度条（div 主体三段：完成部分 | 1px 波浪条 | 未完成部分） -->
      <template v-else-if="innerType === 'line'">
        <div class="sc-progress__bar" :style="barStyle">
          <!-- 完成部分（左）：宽度 = percentage% - capWidth -->
          <div class="sc-progress__fill" :style="fillStyle" />
          <!-- 波浪条（中）：固定 capWidth 宽度，波浪填充为背景色，形成波浪边界 -->
          <div v-if="clamped > 0 && clamped < 100" class="sc-progress__wave-strip" :style="waveStripStyle" aria-hidden="true">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" :style="{ transform: 'scaleX(-1)', transformOrigin: 'center' }">
              <path :d="waveBasePath" :fill="currentColor">
                <animate attributeName="d" :values="waveAnimValues" keyTimes="0;0.33;0.66;1" :dur="waveDur" repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="translate" from="0 0" to="2 0" :dur="waveDur2" repeatCount="indefinite" />
              </path>
            </svg>
          </div>
          <!-- 未完成部分（右）：填充背景色，自动占满剩余空间 -->
          <div class="sc-progress__unfilled" />
          <!-- 文字覆盖层：在整个条中居中显示 -->
          <div v-if="showText && textPosition === 'inside'" class="sc-progress__text-overlay">
            <span class="sc-progress__text--inside" :style="{ color: effectiveTextColor }">{{ displayText }}</span>
          </div>
        </div>
        <div v-if="showText && textPosition !== 'inside'" class="sc-progress__text" :style="{ color: effectiveTextColor }">{{ displayText }}</div>
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
              <rect x="0" y="0" width="100" height="100" :fill="trailColor" />
              <rect x="0" :y="100 - clamped" width="100" :height="clamped" :fill="currentColor" />
              <g :transform="`translate(${waveOffset1}, 0)`" opacity="0.4">
                <path :d="wavePath(100 - clamped, 4, 25)" :fill="currentColor">
                  <animateTransform attributeName="transform" type="translate" from="0 0" to="25 0" dur="2s" repeatCount="indefinite" />
                </path>
              </g>
              <g :transform="`translate(${waveOffset2}, 0)`" opacity="0.6">
                <path :d="wavePath(100 - clamped + 1.5, 3, 20)" :fill="currentColor">
                  <animateTransform attributeName="transform" type="translate" from="0 0" to="20 0" dur="3s" repeatCount="indefinite" />
                </path>
              </g>
            </g>
            <circle cx="50" cy="50" :r="radius" :stroke="ringColor" :stroke-width="ringWidth" fill="none" />
            <template v-if="showText">
              <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" :fill="effectiveTextColor" :font-size="fontSize">{{ displayText }}</text>
            </template>
          </svg>
        </div>
      </template>
    </div>
  </el-tooltip>
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
  /** 背景层颜色（容器底色），默认同 trailColor */
  bgColor?: string;
  /** 描述前缀，如 CPU/内存，将拼接到显示文本前 */
  desc?: string;
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
  /** 启用/内容提示：false 关闭；true 使用进度文本；字符串则为自定义内容 */
  tooltip?: boolean | string;
  /** 提示位置 */
  tooltipPlacement?: string;
  /** 提示延时（ms） */
  tooltipShowAfter?: number;
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
  lineLiquidCap: true,
  capWidth: 10,
  tooltip: false,
  tooltipPlacement: "top",
  tooltipShowAfter: 300
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

const baseText = computed(() => (props.valueFormat ? props.valueFormat(clamped.value) : `${Math.round(clamped.value)}%`));
const displayText = computed(() => (props.desc ? `${props.desc} ${baseText.value}` : baseText.value));

const rootStyle = computed(() => ({
  width: props.width != null ? (typeof props.width === "number" ? `${props.width}px` : String(props.width)) : undefined
}));

// line
const bgLayerColor = computed(() => props.bgColor ?? props.trailColor);
const barStyle = computed(() => ({
  height: `${props.strokeWidth}px`,
  background: bgLayerColor.value
}));

// 完成部分：左->右按百分比填充（减去波浪条 1px 宽度）
const capWidthPx = computed(() => props.capWidth ?? 10);
const fillStyle = computed(() => ({
  width: `max(0px, calc(${clamped.value}% - ${capWidthPx.value}px))`,
  background: currentColor.value
}));

// 波浪条（中间 capWidth）样式（绝对定位覆盖在边界处）
const waveStripStyle = computed(() => ({
  width: `${capWidthPx.value}px`,
  height: "100%",
  left: `clamp(0px, calc(${clamped.value}% - ${capWidthPx.value}px), calc(100% - ${capWidthPx.value}px))`
}));

// 兼容保留（不再用于渲染宽度），避免破坏外部依赖
const innerStyle = computed(() => ({
  width: `${clamped.value}%`,
  background: currentColor.value,
  height: "100%",
  zIndex: 2
}));

function buildVerticalWavePath(W = 100, H = 100, ampRate = 0.45, cycles = 2, phase = 0): string {
  const A = W * ampRate; // 振幅（最大侵蚀宽度）
  const steps = 24;
  const k = cycles * Math.PI * 2; // 角频率
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const y = (H * i) / steps;
    const s = Math.sin((k * y) / H + phase);
    const x = W - A * (1 + s); // x ∈ [W-2A, W]
    pts.push(`${Math.max(0, Math.min(W, x)).toFixed(3)} ${y.toFixed(3)}`);
  }
  // 构造路径：右上 -> 依次波形 -> 右下 -> 右上
  let d = `M ${W} 0 L ${pts[0]}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i]}`;
  d += ` L ${W} ${H} Z`;
  return d;
}

const verticalWavePath = computed(() => buildVerticalWavePath(100, 100, 0.45, 2, 0));

// line 波浪动画（伪随机）
const waveSeed = Math.random();
const waveBasePath = computed(() => buildVerticalWavePath(100, 100, 0.44, 2.0, 0));
const wavePathVar1 = computed(() => buildVerticalWavePath(100, 100, 0.4 + waveSeed * 0.08, 1.8 + waveSeed * 0.5, 0.6 + waveSeed));
const wavePathVar2 = computed(() => buildVerticalWavePath(100, 100, 0.48, 2.3, 1.2 + waveSeed * 1.5));
const waveAnimValues = computed(() => [waveBasePath.value, wavePathVar1.value, wavePathVar2.value, waveBasePath.value].join(";"));
const waveDur = computed(() => `${(2.2 + waveSeed * 1.6).toFixed(2)}s`);
const waveDur2 = computed(() => `${(3.0 + waveSeed * 1.2).toFixed(2)}s`);

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

// tooltip
const tooltipText = computed(() => {
  if (typeof props.tooltip === "string") {
    const t = props.tooltip.trim();
    return t.length > 0 ? t : displayText.value;
  }
  return displayText.value;
});
const tooltipPlacement = computed(() => props.tooltipPlacement || "top");
const tooltipShowAfter = computed(() => props.tooltipShowAfter || 300);
</script>

<style scoped>
.sc-progress {
  display: inline-flex;
  flex-direction: column;
  filter: saturate(1.02);
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

.type-line {
  width: 100%;
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
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.12),
    inset 0 1px 1px rgba(255, 255, 255, 0.08);
}

.sc-progress__fill {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 6px rgba(255, 255, 255, 0.12);
}

.sc-progress__wave-strip {
  position: absolute;
  top: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 3;
  will-change: transform;
}

.sc-progress__unfilled {
  flex: 1 1 auto;
  background: v-bind("bgLayerColor");
}

.sc-progress__text-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
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
