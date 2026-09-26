<template>
  <div
    class="re-stats-card"
    :class="{ 'is-clickable': clickable }"
    :style="gridStyle"
  >
    <!-- #card 插槽：整卡接管渲染（传入时优先），否则走内置 ReStatCard 骨架 -->
    <template v-for="(item, index) in list" :key="item.key ?? index">
      <slot
        v-if="$slots.card"
        name="card"
        :item="item"
        :index="index"
        :level-class="levelClass(item)"
        :aria-label="ariaLabel(item)"
        :display-value="displayValue(item)"
        :ring-percent="ringPercent(item)"
        :has-ring="hasRing(item)"
        :icon-style="iconStyle(item)"
        :ring-style="ringStyle(item)"
        :spark-points="sparkPoints(item)"
        :spark-area-points="sparkAreaPoints(item)"
        :spark-color="trendColor(item)"
        :spark-gradient-id="sparkGradientId(item)"
        @click="onClick(item)"
        @keydown.enter.prevent="onClick(item)"
        @keydown.space.prevent="onClick(item)"
      />

      <ReStatCard
        v-else
        class="re-stats-card__item"
        :class="levelClass(item)"
        :title="item.title"
        :desc="item.desc"
        :icon="item.icon"
        :icon-color="item.iconColor"
        :role="clickable ? 'button' : undefined"
        :tabindex="clickable ? 0 : undefined"
        :aria-label="ariaLabel(item)"
        :aria-disabled="clickable ? undefined : 'true'"
        @click="onClick(item)"
        @keydown.enter.prevent="onClick(item)"
        @keydown.space.prevent="onClick(item)"
      >
        <template #value>
          <!-- 打字机：逐位滚动（每位独立纵向位移，模拟字符逐个浮现） -->
          <span
            class="re-stats-card__value"
            :style="item.valueColor ? { color: item.valueColor } : undefined"
          >
            <span class="re-stats-card__typed" :aria-hidden="true">
              <span
                v-for="(ch, ci) in typedChars(item)"
                :key="`${item.key ?? item.title}-c${ci}`"
                class="re-stats-card__char"
                :style="charDelay(ci)"
              >{{ ch }}</span>
            </span>
            <small v-if="item.unit" class="re-stats-card__unit">{{ item.unit }}</small>
            <!-- 读屏用：打字机是视觉动效，语义仍要给出完整当前值 -->
            <span v-if="typedActive(item)" class="re-stats-card__sr">{{ displayValue(item) }}</span>
          </span>
        </template>

        <template #icon>
          <!-- 进度环优先；环与环内数值分层：环做 mask 挖空，数值独立一层不参与 mask -->
          <span
            v-if="hasRing(item)"
            class="re-stats-card__ring-box"
            :style="ringStyle(item)"
            role="img"
            :aria-label="`${item.title} ${ringPercent(item)}%`"
          >
            <span class="re-stats-card__ring" />
            <span class="re-stats-card__ring-inner">{{ ringPercent(item) }}<i>%</i></span>
          </span>
          <span
            v-else-if="item.icon"
            class="re-stats-card__icon"
            :style="iconStyle(item)"
          >
            <!-- 图标打字机式入场：模糊+缩放 淡入，key 变化时重播 -->
            <el-icon :size="24" class="re-stats-card__icon-glyph">
              <component :is="item.icon" />
            </el-icon>
          </span>
        </template>

        <!-- 迷你趋势线：作为卡片底部的背景层，不与主数值争视觉 -->
        <svg
          v-if="sparkPoints(item)"
          class="re-stats-card__spark"
          :style="sparkStyle(item)"
          viewBox="0 0 100 32"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient :id="sparkGradientId(item)" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="trendColor(item)" stop-opacity="0.28" />
              <stop offset="100%" :stop-color="trendColor(item)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <polygon :points="sparkAreaPoints(item)" :fill="`url(#${sparkGradientId(item)})`" />
          <polyline
            :points="sparkPoints(item)"
            fill="none"
            :stroke="trendColor(item)"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>

        <slot name="card-extra" :item="item" :index="index" />
      </ReStatCard>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * ReStatsCard —— 统计卡片列表（传入数组直接渲染）
 *
 *   <ReStatsCard :list="[{ title, value, desc, icon }]" @item-click="..." />
 *
 * 增强点：
 *   1. 告警态：item.level 驱动卡片描边/底色/角标，warn、danger 一眼可辨
 *   2. 趋势线：item.series 渲染 sparkline（含渐变面积），作为底部背景层
 *   3. 环内数值：进度环中心显示百分比，补齐 52px 的信息空档
 *   4. 打字机平滑：数字逐位滚动浮现，图标模糊缩放入场（typeit 观感，纯 CSS 实现）
 *   5. 类型补全：补 level / sub / series / animate / duration / precision
 *   6. 无障碍：role/tabindex/aria-label 齐备，支持 Enter 与 Space 触发
 *   7. prefers-reduced-motion：动画与过渡统一降级
 *
 * 插槽：
 *   - #card：整卡接管渲染（传入即优先），仍会下发告警类名/数值/环/趋势等计算结果
 *   - #card-extra：内置骨架下追加内容（告警徽标、底部说明等）
 *   - 其余经由内部 ReStatCard 透传 #value / #icon
 */
import { computed, onBeforeUnmount, ref, watch } from "vue";
import ReStatCard from "../ReStatCard";
import type { ReStatsCardItem, ReStatsLevel } from "./index";

const props = withDefaults(
  defineProps<{
    list: ReStatsCardItem[];
    /** 每行列数，默认自适应 */
    columns?: number | "auto";
    /** 是否响应点击 */
    clickable?: boolean;
    /** count-up 时长（ms） */
    duration?: number;
  }>(),
  {
    columns: "auto",
    clickable: true,
    duration: 600,
  },
);

const emit = defineEmits<{
  "item-click": [item: ReStatsCardItem, index: number];
}>();

const gridStyle = computed(() => {
  if (props.columns === "auto" || !props.columns) return undefined;
  return { gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))` };
});

function onClick(item: ReStatsCardItem) {
  if (!props.clickable) return;
  emit("item-click", item, props.list.indexOf(item));
}

/* ==================== 1. 告警态 ==================== */

/** 各级别对应的主题色与色板 */
const LEVEL_TOKENS: Record<ReStatsLevel, { color: string; label: string }> = {
  ok: { color: "var(--el-color-success)", label: "正常" },
  info: { color: "var(--el-color-info)", label: "提示" },
  warn: { color: "var(--el-color-warning)", label: "警告" },
  danger: { color: "var(--el-color-danger)", label: "严重" },
};

/** 卡片附加类名：承载描边色、底色与角标 */
function levelClass(item: ReStatsCardItem): string[] {
  return item.level && item.level !== "ok" ? [`is-${item.level}`] : [];
}

/** 无障碍文案：把标题、数值、单位、告警级别串成一句可读描述 */
function ariaLabel(item: ReStatsCardItem): string {
  const parts = [item.title];
  if (item.value !== undefined && item.value !== null && item.value !== "") {
    parts.push(`${item.value}${item.unit ?? ""}`);
  }
  if (item.level && item.level !== "ok") parts.push(LEVEL_TOKENS[item.level].label);
  if (item.desc) parts.push(item.desc);
  return parts.join(" ");
}

/* ==================== 2. 趋势线 ==================== */

/** 取有效序列（至少 2 个点才画线） */
function seriesOf(item: ReStatsCardItem): number[] {
  const s = item.series;
  if (!Array.isArray(s) || s.length < 2) return [];
  return s.map((n) => (Number.isFinite(Number(n)) ? Number(n) : 0));
}

/** 折线路径（viewBox 100x32） */
function sparkPoints(item: ReStatsCardItem): string {
  const s = seriesOf(item);
  if (s.length < 2) return "";
  const min = Math.min(...s);
  const max = Math.max(...s);
  const span = max - min || 1;
  const step = 100 / (s.length - 1);
  return s
    .map((v, i) => `${(i * step).toFixed(2)},${(30 - ((v - min) / span) * 28 + 1).toFixed(2)}`)
    .join(" ");
}

/** 面积路径：折线 + 回到基线闭合，形成渐变填充 */
function sparkAreaPoints(item: ReStatsCardItem): string {
  const line = sparkPoints(item);
  return line ? `0,32 ${line} 100,32` : "";
}

/** 线条/渐变取色：优先用条目色，其次按告警级别 */
function trendColor(item: ReStatsCardItem): string {
  if (item.valueColor) return item.valueColor;
  if (item.level) return LEVEL_TOKENS[item.level].color;
  return "var(--el-color-primary)";
}

/** 线条颜色随告警升级（ok/info 用主色，warn/danger 用告警色） */
function sparkStyle(item: ReStatsCardItem): Record<string, string> {
  return { color: trendColor(item) };
}

/** 渐变 id 需唯一，用 key 或下标兜底 */
function sparkGradientId(item: ReStatsCardItem): string {
  return `re-stats-spark-${String(item.key ?? item.title).replace(/[^\w-]/g, "")}`;
}

/* ==================== 3. 环内数值 ==================== */

function hasRing(item: ReStatsCardItem): boolean {
  return item.ringPercent !== undefined && item.ringPercent !== null;
}

function ringPercent(item: ReStatsCardItem): number {
  return Math.max(0, Math.min(100, Math.round(Number(item.ringPercent ?? 0))));
}

/* ==================== 4. 数值过渡 ==================== */

/** 展示值：非数字或关闭动画时直接用原值；否则走 count-up */
const animated = ref<Record<string, number>>({});
let raf = 0;

function isNumeric(item: ReStatsCardItem): boolean {
  return item.value !== undefined && item.value !== null && item.value !== "" && !Number.isNaN(Number(item.value));
}

function displayValue(item: ReStatsCardItem): string {
  const numeric = isNumeric(item);
  const animate = item.animate ?? true;
  if (!numeric || !animate) {
    return formatValue(item);
  }
  const key = String(item.key ?? item.title);
  const target = Number(item.value);
  const current = animated.value[key];
  if (current === undefined) {
    // 首帧直接落终值，避免初次渲染从 0 跳上来
    return formatValue(item, target);
  }
  return formatValue(item, current);
}

function formatValue(item: ReStatsCardItem, n?: number): string {
  if (n === undefined) {
    return item.value === undefined || item.value === null ? "" : String(item.value);
  }
  const p = item.precision;
  return p === undefined ? String(round(n)) : n.toFixed(p);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** 监听数值变化，启动 count-up */
watch(
  () => props.list.map((i) => (isNumeric(i) ? Number(i.value) : null)),
  (next, prev) => {
    next.forEach((target, idx) => {
      if (target === null) return;
      const key = String(props.list[idx]?.key ?? props.list[idx]?.title ?? idx);
      const from = animated.value[key];
      if (from === undefined || !props.list[idx]?.animate) {
        animated.value = { ...animated.value, [key]: target };
        return;
      }
      const dur = props.list[idx]?.duration ?? props.duration;
      if (from === target || dur <= 0) {
        animated.value = { ...animated.value, [key]: target };
        return;
      }
      cancelAnimationFrame(raf);
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        // easeOutCubic：起步快、收尾稳，读数不抖动
        const eased = 1 - Math.pow(1 - p, 3);
        const cur = from + (target - from) * eased;
        if (p >= 1) {
          animated.value = { ...animated.value, [key]: target };
        } else {
          animated.value = { ...animated.value, [key]: cur };
          raf = requestAnimationFrame(step);
        }
      };
      raf = requestAnimationFrame(step);
    });
    void prev;
  },
  { deep: false },
);

onBeforeUnmount(() => cancelAnimationFrame(raf));

/* ==================== 4. 打字机平滑（typeit 观感） ==================== */

/** 关闭动效时（prefers-reduced-motion）直接落终态，不做逐位动画 */
const reducedMotion = ref(false);

if (typeof window !== "undefined" && window.matchMedia) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  reducedMotion.value = mq.matches;
  const onChange = (e: MediaQueryListEvent) => { reducedMotion.value = e.matches; };
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onChange);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(onChange);
  }
}

/** 是否启用打字机效果：条目未显式关闭且用户未要求减少动效 */
function typedEnabled(item: ReStatsCardItem): boolean {
  return (item.animate ?? true) && !reducedMotion.value;
}

/** 是否正在动画中（动画期间为读屏补充完整值） */
function typedActive(item: ReStatsCardItem): boolean {
  if (!typedEnabled(item)) return false;
  const key = String(item.key ?? item.title);
  const target = Number(item.value);
  const cur = animated.value[key];
  return cur !== undefined && cur !== target;
}

/**
 * 把当前展示值拆成逐位字符数组，供 v-for 渲染打字机效果。
 *
 * <p>数字与文本统一处理：非数字（"运行中"等）也逐字显现，观感一致。</p>
 */
function typedChars(item: ReStatsCardItem): string[] {
  return Array.from(displayValue(item));
}

/**
 * 逐位错峰延迟：最后一位先落定，越靠后延迟越短，形成"从右往左点亮"的节奏。
 *
 * @param index 字符下标
 * @returns 行内 style
 */
function charDelay(index: number): Record<string, string> {
  return { animationDelay: `${index * 28}ms` };
}

/* ==================== 颜色工具 ==================== */

/** 图标圆底色（供进度环轨道复用）：按 iconColor 的 12%~14% 透明度混入 */
function softBg(color?: string): string {
  const c = color || "var(--el-color-primary)";
  if (c.startsWith("var(")) return `color-mix(in srgb, ${c} 12%, transparent)`;
  return `color-mix(in srgb, ${c} 14%, transparent)`;
}

/** 图标圆：渐变实底 + 白色图标 + 同色柔和投影（与 ReStatCard 一致的"柔和层次感"） */
function iconStyle(item: ReStatsCardItem): Record<string, string> {
  const c = item.iconColor || "var(--el-color-primary)";
  return {
    background: `linear-gradient(140deg, color-mix(in srgb, ${c} 72%, var(--el-color-white)) 0%, ${c} 100%)`,
    color: "var(--el-color-white)",
    boxShadow: `0 10px 18px -8px color-mix(in srgb, ${c} 55%, transparent)`,
  };
}

/** 右侧粗环：conic-gradient + mask 挖空，颜色跟随主题/业务色 */
function ringStyle(item: ReStatsCardItem): Record<string, string> {
  const p = hasRing(item) ? ringPercent(item) : 0;
  const c = item.ringColor || item.valueColor || "var(--el-color-primary)";
  const track = softBg(c);
  return {
    "--ring-p": `${p * 3.6}deg`,
    "--ring-c": c,
    "--ring-track": track,
  };
}
</script>

<style scoped>
.re-stats-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.re-stats-card__item {
  position: relative;
  min-width: 0;
  cursor: pointer;
  overflow: hidden;
}

/* 告警态：描边 + 极淡底色，不盖住主数值与图标 */
.re-stats-card__item.is-warn {
  background: color-mix(in srgb, var(--el-color-warning) 6%, var(--el-bg-color));
}

.re-stats-card__item.is-danger {
  background: color-mix(in srgb, var(--el-color-danger) 8%, var(--el-bg-color));
}

/* 告警角标：右上角小圆点，纯 CSS，不占布局 */
.re-stats-card__item.is-warn::after,
.re-stats-card__item.is-danger::after {
  content: "";
  position: absolute;
  top: 10px;
  right: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.re-stats-card__item.is-warn::after {
  background: var(--el-color-warning);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-warning) 22%, transparent);
}

.re-stats-card__item.is-danger::after {
  background: var(--el-color-danger);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-danger) 22%, transparent);
  animation: re-stats-pulse 1.6s ease-in-out infinite;
}

@keyframes re-stats-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

/* 键盘可达：与 hover 同等反馈，明确 focus 可见 */
.re-stats-card__item:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.re-stats-card__item.is-clickable:hover {
  cursor: pointer;
}

.re-stats-card__value {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

/* 打字机：逐位容器，裁掉位移溢出，避免影响基线对齐 */
.re-stats-card__typed {
  display: inline-flex;
  overflow: hidden;
}

/* 单字符：自下方淡入 + 轻微上浮，逐位错峰形成"字符浮现" */
.re-stats-card__char {
  display: inline-block;
  white-space: pre;
  animation: re-stats-type 0.34s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

@keyframes re-stats-type {
  from {
    opacity: 0;
    transform: translateY(0.42em) scale(0.86);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

/* 图标打字机式入场：模糊缩放淡入 */
.re-stats-card__icon-glyph {
  animation: re-stats-icon-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

@keyframes re-stats-icon-in {
  from {
    opacity: 0;
    transform: scale(0.6) rotate(-12deg);
    filter: blur(3px);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0);
    filter: blur(0);
  }
}

/* 仅读屏可见：打字机逐位会把数字拆散，读屏需要一个完整值 */
.re-stats-card__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 单位（如「台」）：小号、弱化，跟在大数字后面 */
.re-stats-card__unit {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

/* 图标圆：56px 渐变实底 + 白色图标（底色/投影由 iconStyle 内联下发） */
.re-stats-card__icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 进度环外框：只做定位，mask 交给内层 .re-stats-card__ring */
.re-stats-card__ring-box {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 右侧粗环：外径 52、环宽 9（挖空后可见粗环；与图标圆同量级） */
.re-stats-card__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(var(--ring-c) var(--ring-p), var(--ring-track) 0);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 8.5px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 8.5px));
}

/* 环内数值：独立于 mask 层，落在环之上 */
.re-stats-card__ring-inner {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  color: var(--ring-c);
  font-variant-numeric: tabular-nums;
}

.re-stats-card__ring-inner i {
  font-style: normal;
  font-size: 9px;
  font-weight: 600;
  margin-left: 1px;
  opacity: 0.8;
}

/* 迷你趋势线：贴卡片底部，弱化为背景层，不与主数值争视觉 */
.re-stats-card__spark {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 34px;
  pointer-events: none;
  opacity: 0.9;
}

@media (prefers-reduced-motion: reduce) {
  .re-stats-card__item {
    transition: none;
    transform: none;
  }

  .re-stats-card__item.is-danger::after {
    animation: none;
  }

  /* 逐位浮现与图标入场在降级下全部关闭，数值直接落终态 */
  .re-stats-card__char,
  .re-stats-card__icon-glyph {
    animation: none;
  }
}
</style>
