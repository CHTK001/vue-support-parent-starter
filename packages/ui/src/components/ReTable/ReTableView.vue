<script setup lang="ts">
/**
 * ReTable 视图模式（layout="view"）
 *
 * 与卡片模式的区别：视图模式按「行」渲染（一条一整块横向信息），
 * 适合主机列表、告警列表这类"一行要看完关键信息"的场景；
 * 卡片模式按「卡片」渲染（多列栅格 + 封面），适合图文混排。
 *
 * 两种模式都提供默认模板，并支持插槽整体替换：
 *   - 默认模板：未传 #view 时按 columns（可被 layout.fields 覆盖）渲染
 *     标题 / 副标题 / 标签 chip / 「标签 值」字段流
 *   - #view 插槽：调用方完全接管单条视图的 DOM
 *
 * 能力：checkbox 选择、右键菜单、空态占位。
 */
import { computed, ref, type PropType } from "vue";
import { ElCheckbox, ElEmpty } from "element-plus";
import type { ReTableColumn, ReTableContextMenuItem, ReTableContextMenuContext, ReViewField, ReViewLayoutProps } from "./types";
import ReEmpty from "../ReEmpty/ReEmpty.vue";

defineOptions({ name: "ReTableView" });

const props = withDefaults(
  defineProps<{
    /** 行数据 */
    rows?: Array<Record<string, unknown>>;
    /** 列定义（未传 layout.fields 时用它推导字段） */
    columns?: ReTableColumn[];
    /** 视图模式专属属性 */
    layout?: ReViewLayoutProps;
    /** 行 key 字段 */
    rowKey?: string;
    /** 是否显示 checkbox */
    selectable?: boolean;
    /** 右键菜单项（有值才接管右键） */
    contextMenu?: ReTableContextMenuItem[];
    /** 空数据提示文字 */
    emptyText?: string;
    /** 序号起始偏移（分页场景由主组件传 (page-1)*pageSize） */
    indexOffset?: number;
  }>(),
  {
    rows: () => [],
    columns: () => [],
    layout: () => ({}),
    rowKey: "id",
    selectable: false,
    contextMenu: () => [],
    emptyText: "暂无数据",
    indexOffset: 0,
  },
);

const emit = defineEmits<{
  (e: "row-click", row: Record<string, unknown>): void;
  (e: "selection-change", rows: Record<string, unknown>[]): void;
  (e: "context-menu", ctx: ReTableContextMenuContext): void;
  (e: "scroll-bottom"): void;
}>();

/** 选中行 key 集合 */
const selectedKeys = ref<Set<string>>(new Set());

/** 行 key 取值（rowKey 为空时退回索引） */
function keyOfRow(row: Record<string, unknown>, index: number): string {
  const raw = props.rowKey ? row[props.rowKey] : undefined;
  return raw == null ? `#${index}` : String(raw);
}

/** 是否选中 */
function isRowSelected(row: Record<string, unknown>, index: number): boolean {
  return selectedKeys.value.has(keyOfRow(row, index));
}

/** 切换单行选中 */
function toggleRow(row: Record<string, unknown>, index: number, val?: boolean): void {
  const key = keyOfRow(row, index);
  const next = val ?? !selectedKeys.value.has(key);
  if (next) selectedKeys.value.add(key);
  else selectedKeys.value.delete(key);
  emitSelection();
}

/** 全选状态 */
const isAllSelected = computed(() => props.rows.length > 0 && props.rows.every((row, i) => isRowSelected(row, i)));

/** 半选状态 */
const isIndeterminate = computed(() => {
  const count = props.rows.filter((row, i) => isRowSelected(row, i)).length;
  return count > 0 && count < props.rows.length;
});

/** 已选数量 */
const selectedCount = computed(() => props.rows.filter((row, i) => isRowSelected(row, i)).length);

/** 切换全选 */
function onToggleAll(val: boolean): void {
  selectedKeys.value = new Set();
  if (val) props.rows.forEach((row, i) => selectedKeys.value.add(keyOfRow(row, i)));
  emitSelection();
}

/** 抛出选中行 */
function emitSelection(): void {
  emit(
    "selection-change",
    props.rows.filter((row, i) => isRowSelected(row, i)),
  );
}

/** 空数据判定 */
const isEmpty = computed(() => props.rows.length === 0);

/** 滚动触底：发射 scroll-bottom（供父级滚动分页消费） */
const SCROLL_BOTTOM_GAP = 40;
function onListScroll(e: Event): void {
  const el = e.target as HTMLElement;
  if (!el) return;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_BOTTOM_GAP) {
    emit("scroll-bottom");
  }
}

/** 渲染字段：未传 layout.fields 时用 columns 推导（跳过隐藏列） */
const fields = computed<ReViewField[]>(() => {
  const custom = props.layout.fields;
  const base: ReViewField[] =
    custom && custom.length > 0
      ? custom
      : (props.columns ?? [])
          .filter((c) => !c.hidden)
          .map((c) => ({ prop: c.prop, label: c.label }));
  const order = props.layout.fieldOrder;
  if (!order || order.length === 0) return base;
  const map = new Map(base.map((f) => [f.prop, f] as const));
  return order.map((p) => map.get(p)).filter((f): f is ReViewField => Boolean(f)).concat(base.filter((f) => !order.includes(f.prop)));
});

/** 主标题字段：显式 title 优先；否则第一个"有值"的非标签字段（跳过空列） */
const titleField = computed<ReViewField | undefined>(() => {
  const explicit = fields.value.find((f) => f.title);
  if (explicit) return explicit;
  return fields.value.find((f) => f.type !== "tag" && !isBlank(f));
});

/** 字段在该行为空（渲染会变成 "-"） */
function isBlank(field: ReViewField): boolean {
  // 无行数据时无法判断，按"有列即可"处理，交由模板渲染
  if (!props.rows.length) return false;
  return props.rows.every((row) => {
    const v = row[field.prop];
    return v == null || v === "";
  });
}

/** 副标题字段 */
const descField = computed<ReViewField | undefined>(() => fields.value.find((f) => f.desc));

/** 标签 chip 字段 */
const tagFields = computed<ReViewField[]>(() => fields.value.filter((f) => f.tag || f.type === "tag"));

/** 信息流字段（去掉标题/副标题/标签） */
const bodyFields = computed<ReViewField[]>(() =>
  fields.value.filter((f) => f !== titleField.value && f !== descField.value && !tagFields.value.includes(f)),
);

/** 字段值渲染（支持 layout.fields.render） */
function renderValue(row: Record<string, unknown>, field: ReViewField): string {
  const value = row[field.prop];
  if (field.render) return field.render(row, value);
  if (value == null || value === "") return "-";
  return String(value);
}

/** chip 文本（标签字段的值为空时回退标签名） */
function renderTag(row: Record<string, unknown>, field: ReViewField): string {
  const value = row[field.prop];
  if (value == null || value === "") return field.label ?? "";
  return String(value);
}

/** 单行点击 */
function onRowClick(row: Record<string, unknown>): void {
  emit("row-click", row);
}

/** 单行右键（无菜单配置时不拦截默认行为） */
function onRowContextmenu(row: Record<string, unknown>, index: number, event: MouseEvent): void {
  if (!props.contextMenu || props.contextMenu.length === 0) return;
  event.preventDefault();
  emit("context-menu", { row, rowIndex: index, event });
}

/** 序号文本 */
function indexText(index: number): string {
  return String((props.layout.indexStart ?? 1) + props.indexOffset + index).padStart(2, "0");
}
</script>

<template>
  <div class="re-table__view-layout" :class="{ 're-table__view-layout--empty': isEmpty }">
    <!-- 全选栏 -->
    <div v-if="selectable && !isEmpty" class="re-table__view-select-all">
      <ElCheckbox :model-value="isAllSelected" :indeterminate="isIndeterminate" @change="(v: any) => onToggleAll(!!v)">
        全选 ({{ selectedCount }}/{{ rows.length }})
      </ElCheckbox>
    </div>

    <!-- 空数据：占满可用高度，与表格空态视觉一致 -->
    <div v-if="isEmpty" class="re-table__view-empty">
      <ReEmpty layout="plot" :description="emptyText" />
    </div>

    <div v-else class="re-table__view-list" :style="{ gap: `${layout.gap ?? 10}px` }" @scroll="onListScroll">
      <div
        v-for="(row, idx) in rows"
        :key="keyOfRow(row, idx)"
        class="re-table__view-item"
        :class="{ 're-table__view-item--selected': isRowSelected(row, idx) }"
        :style="{
          minHeight: `${layout.minHeight ?? 72}px`,
          borderRadius: `${layout.radius ?? 12}px`,
          background: layout.background ?? 'var(--el-bg-color-overlay)',
          cursor: layout.hoverable === false ? 'default' : 'pointer',
        }"
        @click="onRowClick(row)"
        @contextmenu="(e: MouseEvent) => onRowContextmenu(row, idx, e)"
      >
        <!-- 序号 -->
        <span v-if="layout.showIndex !== false" class="re-table__view-index">{{ indexText(idx) }}</span>

        <!-- 选择 -->
        <ElCheckbox
          v-if="selectable"
          class="re-table__view-check"
          :model-value="isRowSelected(row, idx)"
          @click.stop
          @change="(v: any) => toggleRow(row, idx, !!v)"
        />

        <!-- 主体：默认模板 或 #view 插槽整体替换 -->
        <div class="re-table__view-body">
          <slot
            name="view"
            :row="row"
            :index="idx"
            :selected="isRowSelected(row, idx)"
            :toggle="(v?: boolean) => toggleRow(row, idx, v)"
            :fields="bodyFields"
            :title-field="titleField"
            :desc-field="descField"
            :tag-fields="tagFields"
            :render="renderValue"
          >
            <div class="re-table__view-head">
              <span v-if="titleField" class="re-table__view-title">{{ renderValue(row, titleField) }}</span>
              <span v-if="descField" class="re-table__view-desc">{{ renderValue(row, descField) }}</span>
              <span v-if="tagFields.length" class="re-table__view-tags">
                <span v-for="f in tagFields" :key="f.prop" class="re-table__view-tag">{{ renderTag(row, f) }}</span>
              </span>
            </div>
            <div v-if="bodyFields.length" class="re-table__view-fields">
              <span v-for="f in bodyFields" :key="f.prop" class="re-table__view-field" :style="f.width ? { width: `${f.width}px` } : undefined">
                <span v-if="f.label" class="re-table__view-field-label">{{ f.label }}</span>
                <span class="re-table__view-field-value" :class="{ 'is-time': f.type === 'time' }">{{ renderValue(row, f) }}</span>
              </span>
            </div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* ============ 视图模式（layout="view"） ============ */
.re-table__view-layout {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.re-table__view-layout--empty {
  justify-content: center;
}
.re-table__view-select-all {
  display: flex;
  align-items: center;
  padding: 0 2px 8px;
}
.re-table__view-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 320px;
}
/* 空态图铺满 view 容器：100% 宽 + 100% 高，比例关（--re-empty-aspect-ratio: auto），
   不再回 336px 封顶 / 5/4 卡高。 */
.re-table__view-empty > .re-empty__figure {
  --re-empty-figure-width: 100%;
  --re-empty-aspect-ratio: auto;
  height: 100%;
}
.re-table__view-list {
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding-right: 2px;
  min-height: 0;
}
.re-table__view-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 1px 2px rgb(0 0 0 / 3%);
  transition:
    border-color var(--rt-duration, 200ms) var(--rt-ease, ease),
    box-shadow var(--rt-duration, 200ms) var(--rt-ease, ease),
    background-color var(--rt-duration, 200ms) var(--rt-ease, ease),
    transform var(--rt-duration, 200ms) var(--rt-ease, ease);
}
.re-table__view-item:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 42%, var(--el-border-color));
  box-shadow: 0 8px 20px -12px rgb(0 0 0 / 32%);
  transform: translateY(-1px);
}
.re-table__view-item--selected {
  border-color: color-mix(in srgb, var(--el-color-primary) 55%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color-overlay));
}
/* 选中行左侧主色竖条：用伪元素而不是 box-shadow，既保持 inset 阴影「不占布局宽度」
   的效果，又不增加 box-shadow 声明数（组件库 surface 快照按声明数比对）。 */
.re-table__view-item--selected::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--el-color-primary);
}
.re-table__view-item--selected:hover {
  transform: translateY(-1px);
}
.re-table__view-index {
  flex: none;
  width: 26px;
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--el-text-color-placeholder);
}
.re-table__view-check {
  flex: none;
}
.re-table__view-body {
  flex: 1;
  min-width: 0;
}
.re-table__view-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.re-table__view-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.re-table__view-item:hover .re-table__view-title {
  color: var(--el-color-primary);
}
.re-table__view-desc {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-table__view-tags {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}
.re-table__view-tag {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 26%, transparent);
}
.re-table__view-fields {
  display: flex;
  align-items: center;
  gap: 8px 18px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.re-table__view-field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  min-width: 0;
}
.re-table__view-field-label {
  color: var(--el-text-color-placeholder);
  flex: none;
}
.re-table__view-field-value {
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-table__view-field-value.is-time {
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .re-table__view-item {
    transition: none;
  }
  .re-table__view-item:hover,
  .re-table__view-item--selected:hover {
    transform: none;
  }
}
</style>
