<template>
  <!-- Modern 布局（异步加载） -->
  <ModernLayout
    v-if="layout === 'modern'"
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
    :layout="paginationLayout"
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
 */
import { defineAsyncComponent } from "vue";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));

defineOptions({ name: "RePagination" });

withDefaults(
  defineProps<{
    /** 布局变体："el"（默认 el-pagination）/ "modern"（现代化扁平分页） */
    layout?: "el" | "modern";
    total: number;
    currentPage?: number;
    pageSize?: number;
    pageSizes?: number[];
    disabled?: boolean;
    background?: boolean;
    /** el-pagination 内部布局字符串 */
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

const emit = defineEmits<{
  "update:currentPage": [val: number];
  "update:pageSize": [val: number];
  "current-change": [val: number];
  "size-change": [val: number];
  "prev-click": [val: number];
  "next-click": [val: number];
}>();
</script>
