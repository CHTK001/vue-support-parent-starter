<template>
  <!-- Modern 布局（异步加载） -->
  <ModernLayout
    v-if="isModern"
    :total="total"
    :current-page="currentPage"
    :page-size="pageSize"
    :page-sizes="pageSizes"
    :disabled="disabled"
    :small="small"
    v-bind="$attrs"
    @update:current-page="emit('update:currentPage', $event)"
    @update:page-size="emit('update:pageSize', $event)"
    @current-change="emit('current-change', $event)"
    @size-change="emit('size-change', $event)"
    @prev-click="emit('prev-click', $event)"
    @next-click="emit('next-click', $event)"
  />

  <!-- 默认 el-pagination 布局 -->
  <el-pagination
    v-else
    v-bind="$attrs"
    :current-page="currentPage"
    :page-size="pageSize"
    :total="total"
    :page-sizes="pageSizes"
    :disabled="disabled"
    :background="background"
    :layout="resolvedPaginationLayout"
    :small="small"
    @update:current-page="emit('update:currentPage', $event)"
    @update:page-size="emit('update:pageSize', $event)"
    @current-change="emit('current-change', $event)"
    @size-change="emit('size-change', $event)"
    @prev-click="emit('prev-click', $event)"
    @next-click="emit('next-click', $event)"
  />
</template>

<script setup lang="ts">
/**
 * RePagination —— 分页组件
 *
 * 透传 el-pagination 全部能力，增加：
 *   - layout：布局变体，"el"（默认，el-pagination）/ "modern"（现代化扁平分页，异步加载）
 *   - paginationLayout：el-pagination 内部布局字符串（如 "total, sizes, prev, pager, next"）
 *
 * 兼容说明：历史调用方把 el-pagination 的布局串直接传给了 `layout`（如
 * `<RePagination layout="prev, pager, next" />`）。为避免这类调用静默失效，
 * `layout` 取到非变体值时按"布局串"处理（见 resolvedPaginationLayout）。
 */
import { computed, defineAsyncComponent } from "vue";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));

defineOptions({ name: "RePagination" });

const props = withDefaults(
  defineProps<{
    /**
     * 布局变体："el"（默认 el-pagination）/ "modern"（现代化扁平分页）。
     * 兼容历史用法：也可直接传 el-pagination 的布局串（如 "prev, pager, next"），
     * 此时按布局串处理，等价于 paginationLayout。
     */
    layout?: "el" | "modern" | (string & {});
    total: number;
    currentPage?: number;
    pageSize?: number;
    pageSizes?: number[];
    disabled?: boolean;
    background?: boolean;
    /** el-pagination 内部布局字符串（layout 传布局串时以 layout 为准） */
    paginationLayout?: string;
    small?: boolean;
  }>(),
  {
    layout: "el",
    currentPage: undefined,
    pageSize: undefined,
    pageSizes: undefined,
    disabled: false,
    background: false,
    paginationLayout: "total, sizes, prev, pager, next, jumper",
    small: false,
  },
);

/** 是否为 Modern 变体 */
const isModern = computed<boolean>(() => props.layout === "modern");

/**
 * el-pagination 实际布局串。
 *
 * `layout` 是变体名时用 paginationLayout；否则说明调用方把布局串传给了 `layout`
 * （历史用法），此时以 `layout` 为准 —— 否则该入参会静默失效。
 */
const resolvedPaginationLayout = computed<string>(() => {
  const value = props.layout;
  if (value === "el" || value === "modern") {
    return props.paginationLayout;
  }
  return value;
});

const emit = defineEmits<{
  "update:currentPage": [val: number];
  "update:pageSize": [val: number];
  "current-change": [val: number];
  "size-change": [val: number];
  "prev-click": [val: number];
  "next-click": [val: number];
}>();
</script>
