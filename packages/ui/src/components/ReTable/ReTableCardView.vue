<script setup lang="ts">
/**
 * ReTable 卡片模式视图
 *
 * 默认按 columns 中的 prop 渲染字段；可通过 fields 自定义；
 * 标记 title 的字段在卡片头部放大展示；
 * 标记 cover 的字段作为封面图渲染。
 */
import type { PropType } from "vue";
import { computed } from "vue";
import type { ReCardField, ReCardLayoutProps, ReTableColumn } from "./types";

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
});

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

/** 标题字段 */
const titleField = computed<ReCardField | undefined>(() =>
  fields.value.find((f) => f.title),
);

/** 封面字段 */
const coverField = computed<ReCardField | undefined>(() =>
  fields.value.find((f) => f.cover),
);

/** 非标题/封面字段（按 fields 顺序） */
const bodyFields = computed<ReCardField[]>(() =>
  fields.value.filter((f) => !f.title && !f.cover),
);

/** 卡片容器样式 */
const containerStyle = computed(() => ({
  display: "grid",
  gridTemplateColumns: `repeat(${props.layout.columns ?? 3}, minmax(${props.layout.minWidth ?? 240}px, 1fr))`,
  gap: `${props.layout.gap ?? 12}px`,
}));

/** 单卡样式 */
function cardStyle(): Record<string, string> {
  const radius = props.layout.radius ?? 8;
  const bg = props.layout.background ?? "var(--el-bg-color-overlay)";
  const hover = props.layout.hoverable !== false;
  return {
    background: bg,
    borderRadius: `${radius}px`,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    transition: "all 0.2s",
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

const emit = defineEmits<{
  (e: "row-click", row: Record<string, unknown>): void;
}>();

function onCardClick(row: Record<string, unknown>): void {
  emit("row-click", row);
}
</script>

<template>
  <div class="re-table__card-layout" :style="containerStyle">
    <div
      v-for="(row, idx) in rows"
      :key="idx"
      class="re-table__card"
      :style="cardStyle()"
      @click="onCardClick(row)"
    >
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
        <!-- 标题 -->
        <div
          v-if="titleField"
          class="re-table__card-title"
        >
          {{ renderValue(row, titleField) }}
        </div>

        <!-- 字段列表 -->
        <div class="re-table__card-fields">
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
</template>

<style scoped>
.re-table__card-layout {
  padding: 4px;
}
.re-table__card {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}
.re-table__card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.re-table__card-cover {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: var(--el-fill-color-light);
}
.re-table__card-body {
  padding: 12px;
}
.re-table__card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  line-height: 1.4;
}
.re-table__card-fields {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.re-table__card-field {
  display: flex;
  font-size: 13px;
  line-height: 1.5;
}
.re-table__card-field-label {
  color: var(--el-text-color-secondary);
  flex: 0 0 auto;
  margin-right: 8px;
  min-width: 60px;
}
.re-table__card-field-value {
  color: var(--el-text-color-primary);
  word-break: break-word;
  flex: 1;
}
</style>