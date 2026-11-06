<script setup lang="ts">
/**
 * ReTable 卡片模式视图
 *
 * 默认按 columns 中的 prop 渲染字段；可通过 fields 自定义；
 * 标记 title 的字段在卡片头部放大展示；
 * 标记 cover 的字段作为封面图渲染。
 * 支持：checkbox 选择、右键菜单
 */
import { computed, ref, type PropType } from "vue";
import { ElCheckbox, ElEmpty } from "element-plus";
import type { ReCardField, ReCardLayoutProps, ReTableColumn, ReTableContextMenuItem, ReTableContextMenuContext } from "./types";
import ReEmpty from "../ReEmpty/ReEmpty.vue";
// 卡片视觉基线（库级共享）：圆角 / 投影 / 悬停令牌
import "../shared/re-surface.css";

defineOptions({ name: "ReTableCardView" });

const props = defineProps({
  rows: {
    type: Array as PropType<Array<Record<string, unknown>>>,
    default: () => [],
  },
  columns: {
    type: Array as PropType<ReTableColumn[]>,
    default: () => [],
  },
  /** 卡片专属属性 */
  layout: {
    type: Object as PropType<ReCardLayoutProps>,
    default: () => ({}),
  },
  rowKey: {
    type: String,
    default: "id",
  },
  /** 是否显示 checkbox */
  selectable: {
    type: Boolean,
    default: false,
  },
  /** 右键菜单项 */
  contextMenu: {
    type: Array as PropType<ReTableContextMenuItem[]>,
    default: () => [],
  },
  /** 空数据提示文字 */
  emptyText: {
    type: String,
    default: "暂无数据",
  },
});

const emit = defineEmits<{
  (e: "row-click", row: Record<string, unknown>): void;
  (e: "selection-change", rows: Record<string, unknown>[]): void;
  (e: "context-menu", ctx: ReTableContextMenuContext): void;
  (e: "scroll-bottom"): void;
}>();

/** 选中行 key 集合 */
const selectedKeys = ref<Set<string>>(new Set());

/** 全选状态 */
const isAllSelected = computed(() => {
  if (props.rows.length === 0) return false;
  return props.rows.every((row) => selectedKeys.value.has(String(row[props.rowKey] ?? "")));
});

/** 半选状态 */
const isIndeterminate = computed(() => {
  if (props.rows.length === 0) return false;
  const count = props.rows.filter((row) => selectedKeys.value.has(String(row[props.rowKey] ?? ""))).length;
  return count > 0 && count < props.rows.length;
});

/** 切换全选 */
function onToggleAll(val: boolean): void {
  if (val) {
    for (const row of props.rows) {
      selectedKeys.value.add(String(row[props.rowKey] ?? ""));
    }
  } else {
    selectedKeys.value.clear();
  }
  emitSelectionChange();
}

/** 切换单行选中 */
function onToggleRow(row: Record<string, unknown>): void {
  const key = String(row[props.rowKey] ?? "");
  if (selectedKeys.value.has(key)) {
    selectedKeys.value.delete(key);
  } else {
    selectedKeys.value.add(key);
  }
  emitSelectionChange();
}

/** 判断行是否选中 */
function isRowSelected(row: Record<string, unknown>): boolean {
  return selectedKeys.value.has(String(row[props.rowKey] ?? ""));
}

/** 发射选中变化 */
function emitSelectionChange(): void {
  const selectedRows = props.rows.filter((row) => selectedKeys.value.has(String(row[props.rowKey] ?? "")));
  emit("selection-change", selectedRows);
}

/** 字段列表 */
const fields = computed<ReCardField[]>(() => {
  const order = props.layout.fieldOrder;
  const customFields = props.layout.fields;
  if (customFields && customFields.length > 0) {
    if (order) {
      const map = new Map(customFields.map((f) => [f.prop, f] as const));
      return order
        .map((p) => map.get(p))
        .filter((f): f is ReCardField => Boolean(f))
        .concat(customFields.filter((f) => !order.includes(f.prop)));
    }
    return customFields;
  }
  // 默认用 columns 转 field
  const list = (props.columns ?? [])
    .filter((c) => !c.hidden)
    .map<ReCardField>((c) => ({
      prop: c.prop,
      label: c.label,
    }));
  if (order) {
    return order
      .map((p) => list.find((f) => f.prop === p))
      .filter((f): f is ReCardField => Boolean(f))
      .concat(list.filter((f) => !order.includes(f.prop)));
  }
  return list;
});

/** 字段在该行为空（渲染会变成 "-"） */
function isBlankField(field: ReCardField): boolean {
  if (!props.rows.length) return false;
  return props.rows.every((row) => {
    const v = row[field.prop];
    return v == null || v === "";
  });
}

/** 标题字段：显式 title 优先；未配置时取第一个有值的非封面字段 */
const titleField = computed<ReCardField | undefined>(() => {
  const explicit = fields.value.find((f) => f.title);
  if (explicit) return explicit;
  return fields.value.find((f) => !f.cover && !isBlankField(f));
});

/** 副标题字段：显式 desc */
const descField = computed<ReCardField | undefined>(() => fields.value.find((f) => f.desc));

/** 标签字段：显式 tag / type=tag */
const tagFields = computed<ReCardField[]>(() => fields.value.filter((f) => f.tag || f.type === "tag"));

/** 封面字段 */
const coverField = computed<ReCardField | undefined>(() =>
  fields.value.find((f) => f.cover),
);

/** 非标题/副标题/封面/标签字段（按 fields 顺序） */
const bodyFields = computed<ReCardField[]>(() =>
  fields.value.filter(
    (f) => f !== titleField.value && f !== descField.value && f !== coverField.value && !tagFields.value.includes(f),
  ),
);

/** 卡片容器样式 */
const containerStyle = computed(() => ({
  display: "grid",
  gridTemplateColumns: `repeat(${props.layout.columns ?? 3}, minmax(${props.layout.minWidth ?? 240}px, 1fr))`,
  gap: `${props.layout.gap ?? 12}px`,
  alignItems: "start",
}));

/**
 * 单卡样式。
 *
 * 圆角缺省走基线令牌 --re-surface-radius（与 ReStatCard / ReCard 同一规格），
 * 调用方传 layout.radius 时仍以传入值为准（保持既有 API 语义）。
 *
 * 底色用**自定义属性**下发而不是直接写 background：
 * 内联 style 优先级高于类选择器，直接写 background 会让
 * `.re-table__card--selected` 的选中底色永远被压制（历史 bug）。
 */
function cardStyle(): Record<string, string> {
  const bg = props.layout.background ?? "var(--el-bg-color-overlay)";
  const hover = props.layout.hoverable !== false;
  return {
    "--re-table-card-bg": bg,
    borderRadius:
      props.layout.radius != null ? `${props.layout.radius}px` : "var(--re-surface-radius, 12px)",
    ...(hover ? { cursor: "pointer" } : {}),
  };
}

/** 渲染字段值 */
function renderValue(row: Record<string, unknown>, field: ReCardField): string {
  const value = row[field.prop];
  if (field.render) return field.render(row, value);
  if (value == null) return "-";
  return String(value);
}

/** 空数据状态 */
const isEmpty = computed<boolean>(() => !props.rows || props.rows.length === 0);

/** 滚动触底：发射 scroll-bottom（供父级滚动分页消费） */
const SCROLL_BOTTOM_GAP = 40;
function onGridScroll(e: Event): void {
  const el = e.target as HTMLElement;
  if (!el) return;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_BOTTOM_GAP) {
    emit("scroll-bottom");
  }
}

function onCardClick(row: Record<string, unknown>): void {
  emit("row-click", row);
}

/** 卡片右键 */
function onCardContextmenu(row: Record<string, unknown>, index: number, event: MouseEvent): void {
  if (!props.contextMenu || props.contextMenu.length === 0) return;
  event.preventDefault();
  emit("context-menu", {
    row,
    rowIndex: index,
    event,
  });
}
</script>

<template>
  <div class="re-table__card-layout" :class="{ 're-table__card-layout--empty': isEmpty }">
    <!-- 全选栏 -->
    <div v-if="selectable && !isEmpty" class="re-table__card-select-all">
      <ElCheckbox
        :model-value="isAllSelected"
        :indeterminate="isIndeterminate"
        @change="(v: any) => onToggleAll(v as boolean)"
      >
        全选 ({{ rows.filter((r: Record<string, unknown>) => isRowSelected(r)).length }}/{{ rows.length }})
      </ElCheckbox>
    </div>

    <!-- 空数据提示 -->
    <div v-if="isEmpty" class="re-table__card-empty">
      <ReEmpty layout="plot" :description="emptyText" />
    </div>

    <div v-else class="re-table__card-grid" :style="containerStyle" @scroll="onGridScroll">
      <div
        v-for="(row, idx) in rows"
        :key="idx"
        :class="['re-table__card', { 're-table__card--selected': isRowSelected(row) }]"
        :style="cardStyle()"
        @click="onCardClick(row)"
        @contextmenu="(e: MouseEvent) => onCardContextmenu(row, idx, e)"
      >
        <!-- Checkbox -->
        <div v-if="selectable" class="re-table__card-check" @click.stop>
          <ElCheckbox
            :model-value="isRowSelected(row)"
            @change="onToggleRow(row)"
          />
        </div>

        <!-- 封面图 -->
        <div
          v-if="coverField && row[coverField.prop]"
          class="re-table__card-cover"
          :style="{
            height: `${layout.coverHeight ?? 160}px`,
            backgroundImage: `url(${String(row[coverField.prop])})`,
          }"
        />

        <div class="re-table__card-body">
          <!-- 标题（显式 title 或兜底首个字段） -->
          <div v-if="titleField" class="re-table__card-title">
            {{ renderValue(row, titleField) }}
          </div>

          <!-- 副标题 -->
          <div v-if="descField" class="re-table__card-desc">
            {{ renderValue(row, descField) }}
          </div>

          <!-- 标签行 -->
          <div v-if="tagFields.length" class="re-table__card-tags">
            <span v-for="f in tagFields" :key="f.prop" class="re-table__card-tag">{{ renderValue(row, f) }}</span>
          </div>

          <!-- 字段网格 -->
          <div v-if="bodyFields.length" class="re-table__card-fields">
            <div
              v-for="field in bodyFields"
              :key="field.prop"
              class="re-table__card-field"
            >
              <span v-if="field.label" class="re-table__card-field-label">{{ field.label }}</span>
              <span class="re-table__card-field-value">{{ renderValue(row, field) }}</span>
            </div>
          </div>

          <!-- 自定义插槽 -->
          <slot :name="`card-${idx}`" :row="row" />
          <slot name="card" :row="row" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 卡片默认模板：与视图模式同一套视觉语言（koi / element-plus 令牌，亮暗自适应） */
.re-table__card-layout {
  padding: 4px;
  display: flex;
  flex-direction: column;
  /* fill 模式（ReTable 的 .re-table--fill）：本组件是 .re-table__main 的最后一个子元素
     （measureFillHeight 量的就是它），要变成高度确定的列容器才能吃满。
     与 ReTableView 的 .re-table__view-layout 同一套写法。 */
  height: 100%;
  min-height: 0;
}
/* 滚动落在网格上而不是根节点：全选栏要留在视口内固定，不能跟着卡片一起滚走
   （与 .re-table__view-list 的处理一致）。 */
.re-table__card-grid {
  flex: 1 1 auto;
  overflow: auto;
  min-height: 0;
  /* 抵消网格自身右内边距，避免滚动条压住卡片内容 */
  padding-right: 2px;
}
.re-table__card-layout--empty {
  min-height: var(--re-table-min-height, 300px);
}
.re-table__card-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 40px 0;
}
/* 空态图铺满 card 容器：100% 宽 + 100% 高，比例关（--re-empty-aspect-ratio: auto），
   不再回 336px 封顶 / 5/4 卡高。 */
.re-table__card-empty > .re-empty__figure {
  --re-empty-figure-width: 100%;
  --re-empty-aspect-ratio: auto;
  height: 100%;
}
.re-table__card-select-all {
  padding: 8px 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 8px;
}
/* 卡片外壳：圆角 / 投影 / 悬停走库级基线令牌（components/shared/re-surface.css），
   不再自写一套实色边框 + 独立阴影值；--selected 等组件特有状态保留。
   底色由 cardStyle() 以 --re-table-card-bg 下发（不能写成内联 background，
   否则会压过下面的 --selected 选中底色）。 */
.re-table__card {
  position: relative;
  overflow: hidden;
  background: var(--re-table-card-bg, var(--el-bg-color-overlay));
  border: 1px solid transparent;
  box-shadow: var(--re-surface-shadow);
  transition:
    box-shadow var(--el-transition-duration, 0.2s) ease,
    transform var(--el-transition-duration, 0.2s) ease;
}
.re-table__card:hover {
  box-shadow: var(--re-surface-shadow-hover);
  transform: translateY(-2px);
}
.re-table__card--selected {
  background: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color-overlay));
  box-shadow:
    var(--re-surface-shadow),
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
}
.re-table__card--selected:hover {
  box-shadow:
    var(--re-surface-shadow-hover),
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
}
.re-table__card-check {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}
.re-table__card-cover {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: var(--el-fill-color-light);
}
.re-table__card-body {
  padding: 12px 14px 14px;
  position: relative;
}
.re-table__card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-table__card-desc {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-table__card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.re-table__card-tag {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 26%, transparent);
}
.re-table__card-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 14px;
}
.re-table__card:hover .re-table__card-title {
  color: var(--el-color-primary);
}
.re-table__card-field {
  display: flex;
  align-items: baseline;
  font-size: 13px;
  line-height: 1.5;
  min-width: 0;
}
.re-table__card-field-label {
  color: var(--el-text-color-placeholder);
  flex: 0 0 auto;
  margin-right: 8px;
  min-width: 56px;
}
.re-table__card-field-value {
  color: var(--el-text-color-regular);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>