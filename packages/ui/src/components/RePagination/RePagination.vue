<template>
  <el-pagination
    v-bind="$attrs"
    :current-page="currentPage"
    :page-size="pageSize"
    :total="total"
    :page-sizes="pageSizes"
    :disabled="disabled"
    :background="background"
    :layout="layout"
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
defineOptions({ name: "RePagination" });

defineProps<{
  total: number;
  currentPage?: number;
  pageSize?: number;
  pageSizes?: number[];
  disabled?: boolean;
  background?: boolean;
  layout?: string;
  small?: boolean;
}>();

const emit = defineEmits<{
  "update:currentPage": [val: number];
  "update:pageSize": [val: number];
  "current-change": [val: number];
  "size-change": [val: number];
  "prev-click": [val: number];
  "next-click": [val: number];
}>();
</script>
