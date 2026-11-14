<template>
  <div class="re-chart-matrix" :style="{ height }">
    <div v-if="!data" class="re-chart-matrix__empty">
      <span class="re-chart-matrix__empty-title">暂无可展示的矩阵数据</span>
      <span class="re-chart-matrix__empty-desc">
        数据结构须为 { rows, columns, values }；来源形状不同请传入 transform 归一
      </span>
    </div>

    <div v-else-if="!rows.length || !columns.length" class="re-chart-matrix__empty">
      <span class="re-chart-matrix__empty-title">矩阵还没有行或列</span>
      <span class="re-chart-matrix__empty-desc">rows / columns 至少各给一项才会出图</span>
    </div>

    <template v-else>
      <div class="re-chart-matrix__scroll">
        <div class="re-chart-matrix__grid" :style="gridStyle" role="table">
          <!-- 表头 -->
          <div class="re-chart-matrix__corner" role="columnheader">{{ data.cornerLabel || "能力域" }}</div>
          <button
            v-for="col in columns"
            :key="col.key"
            type="button"
            class="re-chart-matrix__colhead"
            :class="{ 'is-active': col.key === data.activeColumn }"
            :title="col.detail ? `${col.label} · ${col.detail}` : col.label"
            role="columnheader"
            @click="pickColumn(col.key)"
          >
            <span class="re-chart-matrix__colhead-label">{{ col.label }}</span>
            <small v-if="col.detail">{{ col.detail }}</small>
          </button>

          <!-- 行 -->
          <template v-for="(row, rowIndex) in rows" :key="row.key">
            <button
              type="button"
              class="re-chart-matrix__rowhead"
              :class="{ 'is-active': row.key === data.activeRow }"
              :title="row.detail ? `${row.label} · ${row.detail}` : row.label"
              role="rowheader"
              @click="pickRow(row.key)"
            >
              <span class="re-chart-matrix__rowhead-label">{{ row.label }}</span>
              <small v-if="row.detail">{{ row.detail }}</small>
            </button>
            <button
              v-for="(col, colIndex) in columns"
              :key="col.key"
              type="button"
              class="re-chart-matrix__cell"
              :class="{
                'is-blank': valueAt(rowIndex, colIndex) == null,
                'is-active': col.key === data.activeColumn,
                'is-hot': (valueAt(rowIndex, colIndex) ?? 0) >= Math.ceil(levels * 0.75),
              }"
              :style="cellStyle(valueAt(rowIndex, colIndex))"
              :title="cellTitle(row, col, valueAt(rowIndex, colIndex))"
              :aria-label="cellTitle(row, col, valueAt(rowIndex, colIndex))"
              role="cell"
              @click="pickCell(row.key, col.key)"
            >
              {{ displayValue(valueAt(rowIndex, colIndex)) }}
            </button>
          </template>
        </div>
      </div>

      <div class="re-chart-matrix__legend">
        <span class="re-chart-matrix__legend-label">强度</span>
        <span v-for="level in levelList" :key="level" class="re-chart-matrix__legend-item">
          <i class="re-chart-matrix__swatch" :style="cellStyle(level)" />
          {{ levelName(level) }}
        </span>
        <span v-if="data.note" class="re-chart-matrix__note">{{ data.note }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 热力矩阵（ReChart type="matrix"）。
 *
 * 解决的问题：十来个对象 × 十来个能力域时，卡片和列表都没法横向比较。
 * 这里用「行 × 列」的色阶网格，把强度一次性铺开：同一行的深浅看趋势，
 * 同一列的深浅看排名，深色格天然吸睛。
 *
 * 取值口径：
 *  - `values[row][col]` 取 0~levels，`null` 表示不适用（灰底 + 斜纹）；
 *  - 0 用底色（无权限），其余按 `level / levels` 混品牌色，深浅线性可读；
 *  - 深色格文字自动转反色，保证对比度。
 *
 * 颜色只取 koi 令牌（--brand-500 与 --bg-*），暗色主题下随令牌翻转。
 */
import { computed, type CSSProperties } from "vue";
import type { MatrixAxisItem, ReChartMatrixData } from "./types";

const props = withDefaults(
  defineProps<{
    /** 矩阵数据；null 时渲染空态 */
    data: ReChartMatrixData | null;
    /** 容器高度 */
    height?: string;
  }>(),
  { height: "100%" },
);

const emit = defineEmits<{
  /** 点了行头 / 列头 / 单元格 */
  (e: "select", payload: { rowKey?: string; columnKey?: string }): void;
}>();

const rows = computed<MatrixAxisItem[]>(() => props.data?.rows ?? []);
const columns = computed<MatrixAxisItem[]>(() => props.data?.columns ?? []);

/** 分档上限，最少 1 档最多 8 档，避免色阶糊成一片 */
const levels = computed(() => {
  const raw = props.data?.levels ?? 4;
  return Math.min(8, Math.max(1, Math.round(raw)));
});

const levelList = computed(() => Array.from({ length: levels.value + 1 }, (_, i) => i));

const gridStyle = computed<CSSProperties>(() => ({
  gridTemplateColumns: `minmax(110px, 1.5fr) repeat(${columns.value.length}, minmax(42px, 1fr))`,
}));

/** 取一个格子的强度；越界或非数字一律按「不适用」处理 */
function valueAt(rowIndex: number, colIndex: number): number | null {
  const raw = props.data?.values?.[rowIndex]?.[colIndex];
  if (raw == null || !Number.isFinite(raw)) return null;
  return Math.round(raw);
}

/** 色阶：0 走底色，其余按档位混品牌色，深色格反白 */
function cellStyle(value: number | null): CSSProperties {
  if (value == null) {
    return {
      background:
        "repeating-linear-gradient(135deg, var(--bg-fill, #f5f7fa) 0 5px, var(--bg-container, #fff) 5px 10px)",
      color: "var(--text-tertiary, #6b7280)",
    };
  }
  const level = Math.min(levels.value, Math.max(0, value));
  if (level === 0) {
    return {
      background: "var(--bg-fill, #f5f7fa)",
      color: "var(--text-tertiary, #6b7280)",
    };
  }
  // 8%~96%：最弱一档也看得出颜色，最强一档也不会糊成纯色块
  const mix = Math.round(8 + (level / levels.value) * 88);
  return {
    background: `color-mix(in srgb, var(--brand-500) ${mix}%, var(--bg-container, #fff))`,
    color: mix >= 55 ? "var(--text-inverse, #fff)" : "var(--text-primary, #1f2430)",
  };
}

function levelName(level: number): string {
  if (level === 0) return "无";
  const ratio = level / levels.value;
  if (ratio <= 0.25) return "弱";
  if (ratio <= 0.5) return "中";
  if (ratio <= 0.75) return "强";
  return "完全";
}

/** 单元格只在有强度时显示数字，0 留空，避免满屏 0 */
function displayValue(value: number | null): string {
  if (value == null || value <= 0) return "";
  return String(value);
}

function cellTitle(row: MatrixAxisItem, col: MatrixAxisItem, value: number | null): string {
  const text = value == null ? "不适用" : `${value} / ${levels.value}`;
  return `${row.label} × ${col.label}：${text}`;
}

function pickRow(rowKey: string) {
  emit("select", { rowKey });
}

function pickColumn(columnKey: string) {
  emit("select", { columnKey });
}

function pickCell(rowKey: string, columnKey: string) {
  emit("select", { rowKey, columnKey });
}
</script>

<style scoped>
.re-chart-matrix {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 280px;
  min-width: 0;
  font-size: 13px;
  color: var(--text-primary, var(--el-text-color-primary, #1f2430));
}

/* 列多时横向滚动，行头不跟着滚（行头在网格内，随内容一起滚） */
.re-chart-matrix__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-bottom: 2px;
}

.re-chart-matrix__grid {
  display: grid;
  gap: 3px;
  /* 行少（如只有 5 个角色）时把余量摊给各行，格子铺满卡片；
     行多时按内容高度撑开，超出走 .re-chart-matrix__scroll 滚动 */
  align-content: stretch;
  min-height: 100%;
  min-width: 100%;
}

.re-chart-matrix__corner {
  align-self: end;
  padding: 0 4px 4px 2px;
  font-size: 9.5px;
  letter-spacing: 0.12em;
  color: var(--text-tertiary, #6b7280);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---- 列头 ---- */
.re-chart-matrix__colhead {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 4px 2px 5px;
  border: none;
  border-bottom: 1px solid var(--border-subtle, #eef0f6);
  background: transparent;
  color: var(--text-secondary, #5c6270);
  font-family: inherit;
  font-size: 10.5px;
  line-height: 1.25;
  text-align: center;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  transition: color 0.2s ease, background 0.2s ease;
}
.re-chart-matrix__colhead small {
  font-size: 8.5px;
  color: var(--text-tertiary, #6b7280);
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
}
.re-chart-matrix__colhead:hover {
  background: var(--bg-fill, #f5f7fa);
  color: var(--text-primary, #1f2430);
}
.re-chart-matrix__colhead.is-active {
  color: var(--brand-600, var(--brand-500, #6d5dfc));
  border-bottom-color: var(--brand-500, #6d5dfc);
}
.re-chart-matrix__colhead-label {
  font-weight: 600;
  overflow-wrap: anywhere;
}

/* ---- 行头 ---- */
.re-chart-matrix__rowhead {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  padding: 4px 8px 4px 6px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm, 6px);
  background: transparent;
  color: var(--text-primary, #1f2430);
  font-family: inherit;
  font-size: 11.5px;
  line-height: 1.25;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.re-chart-matrix__rowhead:hover {
  background: var(--bg-fill, #f5f7fa);
}
.re-chart-matrix__rowhead.is-active {
  background: var(--brand-50, #f6f4ff);
  border-color: color-mix(in srgb, var(--brand-500) 26%, transparent);
}
.re-chart-matrix__rowhead-label {
  max-width: 100%;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-chart-matrix__rowhead small {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 8.5px;
  color: var(--text-tertiary, #6b7280);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- 单元格 ---- */
.re-chart-matrix__cell {
  min-height: 30px;
  padding: 0;
  border: none;
  border-radius: 5px;
  color: var(--text-primary, #1f2430);
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: filter 0.15s ease, box-shadow 0.15s ease;
}
.re-chart-matrix__cell:hover {
  filter: brightness(1.04) saturate(1.05);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--brand-500) 22%, transparent);
}
.re-chart-matrix__cell.is-active {
  outline: 2px solid var(--brand-500, #6d5dfc);
  outline-offset: -2px;
}
.re-chart-matrix__cell.is-hot {
  font-weight: 600;
}

/* ---- 图例 ---- */
.re-chart-matrix__legend {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 12px;
  font-size: 10.5px;
  color: var(--text-secondary, #5c6270);
}
.re-chart-matrix__legend-label {
  letter-spacing: 0.1em;
  color: var(--text-tertiary, #6b7280);
}
.re-chart-matrix__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.re-chart-matrix__swatch {
  width: 13px;
  height: 13px;
  border-radius: 3px;
  display: inline-block;
}
.re-chart-matrix__note {
  margin-left: auto;
  color: var(--text-tertiary, #6b7280);
}

/* ---- 空态 ---- */
.re-chart-matrix__empty {
  flex: 1;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px dashed var(--border-default, #e3e6ef);
  border-radius: var(--radius-lg, 12px);
  background: var(--bg-container, #fff);
}
.re-chart-matrix__empty-title {
  font-size: 13px;
  color: var(--text-secondary, #5c6270);
}
.re-chart-matrix__empty-desc {
  font-size: 11px;
  color: var(--text-tertiary, #6b7280);
}

@media (prefers-reduced-motion: reduce) {
  .re-chart-matrix__cell,
  .re-chart-matrix__colhead,
  .re-chart-matrix__rowhead {
    transition: none;
  }
}
</style>
