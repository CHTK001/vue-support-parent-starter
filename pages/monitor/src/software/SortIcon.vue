<template>
  <span class="sort-icon" :class="{ 'is-active': isActive, 'is-desc': isDesc && isActive }">
    <ReIcon :name="isActive ? (isDesc ? 'SortDown' : 'SortUp') : 'Sort'" :size="11" />
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { SortField } from "./useSoftwareTable";

const props = defineProps<{
  field: SortField;
  sortBy: SortField;
  sortDir: "asc" | "desc";
}>();

const isActive = computed(() => props.sortBy === props.field);
const isDesc = computed(() => props.sortDir === "desc");
</script>

<style scoped>
.sort-icon {
  display: inline-flex;
  align-items: center;
  color: var(--el-text-color-placeholder);
  opacity: 0.5;
  transition: opacity 0.2s;
}
.sort-icon.is-active {
  opacity: 1;
  color: var(--el-color-primary);
}
</style>
