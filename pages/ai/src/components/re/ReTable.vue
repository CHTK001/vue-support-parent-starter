<template>
  <div class="re-table-wrapper">
    <div v-if="toolbar || $slots.toolbar" class="re-table-toolbar">
      <slot name="toolbar" />
    </div>
    <el-table
      :data="data"
      :stripe="stripe"
      :border="border"
      :size="size"
      :loading="loading"
      :empty-text="emptyText"
      :row-key="rowKey"
      :row-style="rowStyle"
      class="re-table"
      @selection-change="$emit('selection-change', $event)"
      @row-click="$emit('row-click', $event)"
    >
      <el-table-column v-if="selectable" type="selection" width="50" align="center" />
      <el-table-column v-if="showIndex" type="index" label="#" width="60" align="center">
        <template #default="{ $index }">
          <span class="re-table-index">{{ $index + 1 }}</span>
        </template>
      </el-table-column>
      <slot />
    </el-table>
    <div v-if="pagination" class="re-table-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="$emit('size-change', $event)"
        @current-change="$emit('current-change', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PropType } from 'vue'
import type { ComponentSize } from 'element-plus'

defineProps({
  data: { type: Array as PropType<Record<string, any>[]>, default: () => [] },
  stripe: { type: Boolean, default: true },
  border: { type: Boolean, default: false },
  size: { type: String as PropType<ComponentSize | ''>, default: 'default' },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: '暂无数据' },
  rowKey: {
    type: [String, Function] as PropType<
      string | ((row: Record<string, any>) => string)
    >,
    default: 'id',
  },
  rowStyle: {
    type: [Object, Function] as PropType<
      Record<string, any> | ((row: Record<string, any>) => Record<string, any>)
    >,
    default: () => ({}),
  },
  selectable: { type: Boolean, default: false },
  showIndex: { type: Boolean, default: true },
  toolbar: { type: Boolean, default: false },
  pagination: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  pageSizes: { type: Array as PropType<number[]>, default: () => [20, 50, 100] },
})

const emit = defineEmits([
  'selection-change', 'row-click', 'size-change', 'current-change',
  'update:current-page', 'update:page-size'
])

const currentPage = ref(1)
const pageSize = ref(50)
</script>

<style scoped>
.re-table-wrapper {
  background: transparent;
  /* 原 var(--mp-radius, 12px) 里的 --mp-radius 不是 koi 令牌（永远取不到），统一到 --el-radius-lg */
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
}

.re-table-toolbar {
  padding: 14px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--el-fill-color-light);
}

.re-table :deep(.el-table) {
  background: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
}

.re-table :deep(.el-table__header th) {
  background: var(--el-table-header-bg-color, var(--el-fill-color-light));
  color: var(--el-table-header-text-color, var(--el-text-color-secondary));
  font-weight: 600;
  font-size: 13px;
  height: 46px;
}

.re-table :deep(.el-table__body tr) {
  /* 原 0.15s 偏快，行高 50px 下会显得「闪」；统一到 --el-transition-duration 与其余组件同档 */
  transition: background var(--el-transition-duration-fast, 0.2s) ease;
}

.re-table :deep(.el-table__body td) {
  height: 50px;
  font-size: 13.5px;
  color: var(--el-table-text-color, var(--el-text-color-regular));
  border-bottom-color: var(--el-border-color-lighter);
}

.re-table-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 500;
}

.re-table-pagination {
  padding: 14px 18px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: flex-end;
  background: var(--el-fill-color-light);
}

.re-table-pagination :deep(.el-pagination) {
  --el-pagination-hover-color: var(--el-color-primary);
}

.re-table-pagination :deep(.el-pagination.is-background .el-pager li.is-active) {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .re-table :deep(.el-table__body tr) {
    transition: none;
  }
}
</style>
