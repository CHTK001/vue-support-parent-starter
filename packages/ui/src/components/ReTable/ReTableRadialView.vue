<script setup lang="ts">
/**
 * ReTableRadialView —— 放射菜单表格布局
 *
 * 每行左侧有一个正方形/圆形图表按钮，点击后向四个方向（上/下/左/右）自适应展开子菜单。
 * 适用于操作密集型列表（如设备管理、任务调度、服务节点等）。
 *
 * 特性：
 *   - 中心图表支持 circle / square，可配置颜色字段
 *   - 点击图表向四周展开子菜单（支持静态 menuItems 或动态 menuItemsFn）
 *   - 自动根据图表在行中的位置判断"自适应方向"（优先向内展开）
 *   - 支持 checkbox 批量选择、行点击事件、右键菜单
 */
import { computed, ref } from "vue";
import { ElCheckbox, ElEmpty } from "element-plus";
import type { ReTableColumn, ReTableContextMenuItem, ReTableContextMenuContext, ReRadialLayoutProps, ReRadialMenuItem } from "./types";

defineOptions({ name: "ReTableRadialView" });

const props = withDefaults(
  defineProps<{
    rows: Array<Record<string, unknown>>;
    columns: ReTableColumn[];
    layout?: ReRadialLayoutProps;
    rowKey?: string;
    selectable?: boolean;
    contextMenu?: ReTableContextMenuItem[];
    emptyText?: string;
  }>(),
  {
    rows: () => [],
    columns: () => [],
    layout: () => ({}),
    rowKey: "id",
    selectable: false,
    contextMenu: () => [],
    emptyText: "暂无数据",
  },
);

const emit = defineEmits<{
  (e: "row-click", row: Record<string, unknown>): void;
  (e: "cell-click", payload: { row: Record<string, unknown>; columnProp: string; cellValue: unknown }): void;
  (e: "selection-change", rows: Record<string, unknown>[]): void;
  (e: "context-menu", ctx: ReTableContextMenuContext): void;
  (e: "menu-select", payload: { row: Record<string, unknown>; item: ReRadialMenuItem }): void;
}>();

/** 已展开的图表 key 集合 */
const expandedKeys = ref<Set<string>>(new Set());

/** 选中行 key 集合 */
const selectedKeys = ref<Set<string>>(new Set());

const isEmpty = computed(() => props.rows.length === 0);

const isAllSelected = computed(() => {
  if (isEmpty.value) return false;
  return props.rows.every((r) => selectedKeys.value.has(String(r[props.rowKey] ?? "")));
});

const isIndeterminate = computed(() => {
  if (isEmpty.value) return false;
  const count = props.rows.filter((r) => selectedKeys.value.has(String(r[props.rowKey] ?? ""))).length;
  return count > 0 && count < props.rows.length;
});

function getChartType(row: Record<string, unknown>): string {
  const field = props.layout.chartTypeField;
  if (field && row[field] != null) return String(row[field]);
  if (row.type != null) return String(row.type);
  return "primary";
}

function getChartColor(row: Record<string, unknown>): string {
  const color = props.layout.chartColor;
  if (typeof color === "function") return color(row);
  if (color) return color;
  const typeMap: Record<string, string> = {
    success: "var(--el-color-success)",
    warning: "var(--el-color-warning)",
    danger: "var(--el-color-danger)",
    info: "var(--el-color-info)",
    primary: "var(--el-color-primary)",
  };
  return typeMap[getChartType(row)] ?? "var(--el-color-primary)";
}

function getMenuItems(row: Record<string, unknown>): ReRadialMenuItem[] {
  if (props.layout.menuItemsFn) return props.layout.menuItemsFn(row);
  if (props.layout.menuItems) return props.layout.menuItems;
  return [];
}

function getAutoDirections(_row: Record<string, unknown>, idx: number): ("top" | "bottom" | "left" | "right")[] {
  const cfg = props.layout.menuDirections;
  if (cfg === "all") return ["top", "bottom", "left", "right"];
  if (Array.isArray(cfg)) return cfg as ("top" | "bottom" | "left" | "right")[];
  // auto: 根据位置决定
  const total = props.rows.length;
  const isTop = idx === 0;
  const isBottom = idx === total - 1;
  const dirs: ("top" | "bottom" | "left" | "right")[] = ["left", "right"];
  if (!isTop) dirs.push("top");
  if (!isBottom) dirs.push("bottom");
  return dirs;
}

function calcMenuItemPosition(
  itemIndex: number,
  totalItems: number,
  rowIndex: number,
  totalRows: number,
): { top: string; left: string; transform: string } {
  const offset = props.layout.menuOffset ?? 60;
  const mw = props.layout.menuItemWidth ?? 80;
  const itemH = 32;
  const gap = 8;

  // 根据总项数均匀分配到四个方向
  const dirs: ("top" | "right" | "bottom" | "left")[] = ["top", "right", "bottom", "left"];
  const perDir = Math.max(1, Math.ceil(totalItems / 4));
  const dirIndex = Math.min(Math.floor(itemIndex / perDir), 3);
  const itemInDir = itemIndex % perDir;
  const dir = dirs[dirIndex];

  const spread = itemInDir * (itemH + gap);

  // 如果是 auto 模式，根据行位置决定优先方向
  const isTopRow = rowIndex === 0;
  const isBottomRow = rowIndex === totalRows - 1;
  const prefersBottom = !isTopRow && isBottomRow;
  const prefersTop = isTopRow && !isBottomRow;

  let finalDir = dir;
  if (props.layout.menuDirections === "auto") {
    if (prefersBottom) finalDir = "bottom";
    else if (prefersTop) finalDir = "top";
  }

  switch (finalDir) {
    case "top":
      return {
        top: `-${offset + spread + itemH}px`,
        left: `calc(50% - ${mw / 2}px)`,
        transform: "translateX(-50%)",
      };
    case "bottom":
      return {
        top: `${offset + spread}px`,
        left: `calc(50% - ${mw / 2}px)`,
        transform: "translateX(-50%)",
      };
    case "left":
      return {
        top: `calc(50% - ${itemH / 2}px)`,
        left: `-${offset + mw / 2 + 4}px`,
        transform: "translateY(-50%)",
      };
    case "right":
      return {
        top: `calc(50% - ${itemH / 2}px)`,
        left: `${offset + mw / 2 + 4}px`,
        transform: "translateY(-50%)",
      };
  }
  return { top: "0", left: "0", transform: "none" };
}

function toggleExpand(row: Record<string, unknown>): void {
  const key = String(row[props.rowKey] ?? "");
  const set = new Set(expandedKeys.value);
  if (set.has(key)) {
    set.delete(key);
  } else {
    if (!props.layout.multipleOpen) {
      set.clear();
    }
    set.add(key);
  }
  expandedKeys.value = set;
}

function isExpanded(row: Record<string, unknown>): boolean {
  return expandedKeys.value.has(String(row[props.rowKey] ?? ""));
}

function onMenuSelect(row: Record<string, unknown>, item: ReRadialMenuItem): void {
  if (item.disabled) return;
  emit("menu-select", { row, item });
}

function onSelectAll(val: boolean): void {
  const keys = new Set(selectedKeys.value);
  if (val) {
    for (const r of props.rows) keys.add(String(r[props.rowKey] ?? ""));
  } else {
    keys.clear();
  }
  selectedKeys.value = keys;
  emit("selection-change", props.rows.filter((r) => keys.has(String(r[props.rowKey] ?? ""))));
}

function onToggleRow(row: Record<string, unknown>): void {
  const key = String(row[props.rowKey] ?? "");
  const keys = new Set(selectedKeys.value);
  if (keys.has(key)) keys.delete(key); else keys.add(key);
  selectedKeys.value = keys;
  emit("selection-change", props.rows.filter((r) => keys.has(String(r[props.rowKey] ?? ""))));
}

function isRowSelected(row: Record<string, unknown>): boolean {
  return selectedKeys.value.has(String(row[props.rowKey] ?? ""));
}

function onRowClick(row: Record<string, unknown>): void {
  if (props.layout.rowExpandable !== false) {
    toggleExpand(row);
  }
  emit("row-click", row);
}

function onContextMenu(row: Record<string, unknown>, event: MouseEvent): void {
  if (!props.contextMenu || props.contextMenu.length === 0) return;
  event.preventDefault();
  emit("context-menu", { row, rowIndex: props.rows.indexOf(row), event });
}
</script>

<template>
  <div class="re-table__radial-layout">
    <!-- 全选栏 -->
    <div v-if="selectable && !isEmpty" class="re-table__radial-header">
      <ElCheckbox
        :model-value="isAllSelected"
        :indeterminate="isIndeterminate"
        @change="(v: any) => onSelectAll(v as boolean)"
      />
      <span class="re-table__radial-header-count">共 {{ rows.length }} 条</span>
    </div>

    <!-- 空数据 -->
    <div v-if="isEmpty" class="re-table__radial-empty">
      <ElEmpty :description="emptyText" :image-size="64" />
    </div>

    <!-- 行列表 -->
    <div v-else class="re-table__radial-rows">
      <div
        v-for="(row, idx) in rows"
        :key="String(row[rowKey] ?? idx)"
        :class="['re-table__radial-row', { 're-table__radial-row--selected': isRowSelected(row) }]"
        :style="{ height: `${layout.rowHeight ?? 56}px` }"
        @click="onRowClick(row)"
        @contextmenu="(e: MouseEvent) => onContextMenu(row, e)"
      >
        <!-- Checkbox -->
        <div v-if="selectable" class="re-table__radial-row-check" @click.stop>
          <ElCheckbox
            :model-value="isRowSelected(row)"
            @change="onToggleRow(row)"
          />
        </div>

        <!-- 中心图表按钮 -->
        <div
          class="re-table__radial-chart"
          :class="[
            `re-table__radial-chart--${layout.chartShape ?? 'circle'}`,
            { 're-table__radial-chart--active': isExpanded(row) },
          ]"
          :style="{
            width: `${layout.chartSize ?? 48}px`,
            height: `${layout.chartSize ?? 48}px`,
            background: getChartColor(row),
          }"
          @click.stop="toggleExpand(row)"
        >
          <svg v-if="!isExpanded(row)" class="re-table__radial-chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="7" x2="12" y2="17" />
            <line x1="7" y1="12" x2="17" y2="12" />
          </svg>
          <svg v-else class="re-table__radial-chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </div>

        <!-- 放射子菜单（绝对定位） -->
        <template v-if="isExpanded(row)">
          <div
            v-for="(item, itemIdx) in getMenuItems(row)"
            :key="item.key"
            class="re-table__radial-menu-item"
            :class="[`re-table__radial-menu-item--${item.type ?? 'primary'}`, { 're-table__radial-menu-item--disabled': item.disabled }]"
            :style="{
              ...calcMenuItemPosition(itemIdx, getMenuItems(row).length, idx, rows.length),
            }"
            @click.stop="onMenuSelect(row, item)"
          >
            <span v-if="item.icon" class="re-table__radial-menu-icon">{{ item.icon }}</span>
            <span class="re-table__radial-menu-label">{{ item.label }}</span>
          </div>
        </template>

        <!-- 列数据区域 -->
        <div v-if="columns.length > 0" class="re-table__radial-row-data">
          <div
            v-for="col in columns.filter((c) => !c.hidden)"
            :key="col.prop"
            class="re-table__radial-cell"
            :style="{ minWidth: col.minWidth ? `${col.minWidth}px` : undefined }"
            @click.stop="emit('cell-click', { row, columnProp: col.prop, cellValue: row[col.prop] })"
          >
            {{ col.formatter ? col.formatter(row, col, row[col.prop]) : (row[col.prop] ?? "-") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.re-table__radial-layout {
  width: 100%;
  position: relative;
}

/* 表头 */
.re-table__radial-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.re-table__radial-header-count {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* 空数据 */
.re-table__radial-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

/* 行容器 */
.re-table__radial-rows {
  display: flex;
  flex-direction: column;
}

.re-table__radial-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  position: relative;
  transition: background 0.15s;
  overflow: visible;
}
.re-table__radial-row:last-child { border-bottom: none; }
.re-table__radial-row:hover { background: var(--el-fill-color-light); }
.re-table__radial-row--selected { background: var(--el-color-primary-light-9); }

.re-table__radial-row-check {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}

/* 中心图表 */
.re-table__radial-chart {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  user-select: none;
}
.re-table__radial-chart:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}
.re-table__radial-chart:active {
  transform: scale(0.95);
}
.re-table__radial-chart--circle { border-radius: 50%; }
.re-table__radial-chart--square { border-radius: 8px; }
.re-table__radial-chart--active {
  transform: rotate(45deg);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-7);
}
.re-table__radial-chart--active.re-table__radial-chart--square {
  border-radius: 12px;
}
.re-table__radial-chart-icon {
  color: #fff;
  width: 20px;
  height: 20px;
  transition: transform 0.2s;
  pointer-events: none;
}

/* 子菜单项 */
.re-table__radial-menu-item {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  border-radius: 6px;
  cursor: pointer;
  z-index: 10;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  border: 1px solid transparent;
  color: #fff;
  background: var(--el-color-primary);
  font-size: 12px;
  font-weight: 500;
  pointer-events: auto;
}
.re-table__radial-menu-item:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
.re-table__radial-menu-item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.re-table__radial-menu-item--disabled:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.re-table__radial-menu-item--success { background: var(--el-color-success); }
.re-table__radial-menu-item--warning { background: var(--el-color-warning); }
.re-table__radial-menu-item--danger  { background: var(--el-color-danger); }
.re-table__radial-menu-item--info    { background: var(--el-color-info); }
.re-table__radial-menu-item--primary { background: var(--el-color-primary); }

.re-table__radial-menu-icon {
  font-size: 12px;
  line-height: 1;
}

.re-table__radial-menu-label {
  letter-spacing: 0.02em;
}

/* 列数据 */
.re-table__radial-row-data {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 16px;
  overflow: hidden;
}
.re-table__radial-cell {
  font-size: 13px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}
.re-table__radial-cell:hover { color: var(--el-color-primary); }

/* 动画 */
.re-table__radial-menu-item {
  animation: radial-menu-in 0.2s ease-out both;
}
.re-table__radial-menu-item:nth-child(1) { animation-delay: 0.0s; }
.re-table__radial-menu-item:nth-child(2) { animation-delay: 0.03s; }
.re-table__radial-menu-item:nth-child(3) { animation-delay: 0.06s; }
.re-table__radial-menu-item:nth-child(4) { animation-delay: 0.09s; }
.re-table__radial-menu-item:nth-child(5) { animation-delay: 0.12s; }
.re-table__radial-menu-item:nth-child(6) { animation-delay: 0.15s; }

@keyframes radial-menu-in {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 收起动画 */
.re-table__radial-row.expanding .re-table__radial-menu-item {
  animation: radial-menu-out 0.12s ease-in both;
}

@keyframes radial-menu-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.6);
  }
}
</style>
