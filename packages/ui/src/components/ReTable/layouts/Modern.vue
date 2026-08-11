<script setup lang="ts">
/**
 * ReTable Modern 布局 —— 现代化扁平表格布局
 *
 * 设计特点：
 *   - 无边框行分隔（或极细线）
 *   - 干净的表头（浅色背景）
 *   - hover 行高亮（平滑过渡）
 *   - 现代卡片式行（可选）
 *   - 大圆角表格容器
 */
import "../../shared/modern-vars.css";
import type { ReTableColumn } from "../types";

defineOptions({ name: "ReTableModernView" });

const props = withDefaults(
  defineProps<{
    rows: Array<Record<string, unknown>>;
    columns: ReTableColumn[];
    loading?: boolean;
    emptyText?: string;
    rowKey?: string;
    cardStyle?: boolean;
  }>(),
  {
    rows: () => [],
    columns: () => [],
    loading: false,
    emptyText: "暂无数据",
    rowKey: "id",
    cardStyle: false,
  },
);

const emit = defineEmits<{
  (e: "row-click", row: Record<string, unknown>): void;
}>();

function getCellValue(row: Record<string, unknown>, col: ReTableColumn): string {
  const value = row[col.prop];
  if (col.formatter) return col.formatter(row, col, value);
  if (value == null) return "-";
  return String(value);
}
</script>

<template>
  <div
    :class="[
      'rm-table',
      {
        'rm-table--card': cardStyle,
        'rm-table--loading': loading,
      },
    ]"
  >
    <!-- Loading overlay -->
    <div v-if="loading" class="rm-table__loading">
      <svg class="rm-table__spinner" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="30 70" stroke-linecap="round" />
      </svg>
    </div>

    <!-- Table header -->
    <div v-if="!cardStyle" class="rm-table__header">
      <div
        v-for="col in columns"
        :key="col.prop"
        class="rm-table__th"
        :style="{
          width: col.width ? (typeof col.width === 'number' ? col.width + 'px' : col.width) : undefined,
          minWidth: col.minWidth ? (typeof col.minWidth === 'number' ? col.minWidth + 'px' : col.minWidth) : undefined,
          textAlign: col.align || 'left',
        }"
      >
        {{ col.label }}
      </div>
    </div>

    <!-- Table body -->
    <div v-if="rows.length > 0" class="rm-table__body">
      <div
        v-for="(row, idx) in rows"
        :key="String(row[rowKey] ?? idx)"
        :class="['rm-table__row', { 'rm-table__row--card': cardStyle }]"
        @click="emit('row-click', row)"
      >
        <template v-if="!cardStyle">
          <div
            v-for="col in columns"
            :key="col.prop"
            class="rm-table__td"
            :style="{
              width: col.width ? (typeof col.width === 'number' ? col.width + 'px' : col.width) : undefined,
              minWidth: col.minWidth ? (typeof col.minWidth === 'number' ? col.minWidth + 'px' : col.minWidth) : undefined,
              textAlign: col.align || 'left',
            }"
          >
            {{ getCellValue(row, col) }}
          </div>
        </template>
        <template v-else>
          <!-- Card style row -->
          <div class="rm-table__card">
            <div
              v-for="col in columns"
              :key="col.prop"
              class="rm-table__card-field"
            >
              <span class="rm-table__card-label">{{ col.label }}</span>
              <span class="rm-table__card-value">{{ getCellValue(row, col) }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!loading" class="rm-table__empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="rm-table__empty-icon">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="9" y1="3" x2="9" y2="9"/>
      </svg>
      <span>{{ emptyText }}</span>
    </div>
  </div>
</template>

<style scoped>
.rm-table {
  position: relative;
  width: 100%;
  border-radius: var(--rm-radius-lg);
  background: var(--rm-bg);
  border: 1px solid var(--rm-border-light);
  overflow: hidden;
}

/* Header */
.rm-table__header {
  display: flex;
  padding: 0 16px;
  background: var(--rm-bg-subtle);
  border-bottom: 1px solid var(--rm-border-light);
}
.rm-table__th {
  flex: 1;
  padding: 12px 8px;
  font-size: var(--rm-font-sm);
  font-weight: 600;
  color: var(--rm-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

/* Body */
.rm-table__body {
  overflow-y: auto;
}

/* Row */
.rm-table__row {
  display: flex;
  padding: 0 16px;
  border-bottom: 1px solid var(--rm-border-light);
  transition: background var(--rm-transition);
  cursor: pointer;
}
.rm-table__row:last-child { border-bottom: none; }
.rm-table__row:hover { background: var(--rm-bg-hover); }

.rm-table__td {
  flex: 1;
  padding: 14px 8px;
  font-size: var(--rm-font-md);
  color: var(--rm-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Card style */
.rm-table__row--card {
  padding: 12px 16px;
}
.rm-table__card {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  width: 100%;
}
.rm-table__card-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
}
.rm-table__card-label {
  font-size: var(--rm-font-xs);
  font-weight: 600;
  color: var(--rm-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.rm-table__card-value {
  font-size: var(--rm-font-md);
  color: var(--rm-text);
}

/* Empty */
.rm-table__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 16px;
  color: var(--rm-text-secondary);
  font-size: var(--rm-font-md);
}
.rm-table__empty-icon {
  width: 48px;
  height: 48px;
  color: var(--rm-text-disabled);
}

/* Loading */
.rm-table__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rm-bg-glass);
  z-index: 10;
  border-radius: inherit;
}
.rm-table__spinner {
  width: 32px;
  height: 32px;
  color: var(--rm-primary);
  animation: rm-spin 0.8s linear infinite;
}
@keyframes rm-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
