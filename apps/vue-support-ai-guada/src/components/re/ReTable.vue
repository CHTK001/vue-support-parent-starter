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
import { ref, type PropType } from 'vue'

defineProps({
  data: { type: Array as PropType<Record<string, any>[]>, default: () => [] },
  stripe: { type: Boolean, default: true },
  border: { type: Boolean, default: false },
  size: { type: String as PropType<'' | 'small' | 'default' | 'large'>, default: 'default' },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: '暂无数据' },
  rowKey: {
    type: [String, Function] as PropType<string | ((row: Record<string, any>) => string)>,
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
  border-radius: var(--mp-radius, 12px);
  overflow: hidden;
}

.re-table-toolbar {
  padding: 14px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter, #f1f5f9);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--el-fill-color-light, transparent);
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
  transition: background 0.15s ease;
}

.re-table :deep(.el-table__body td) {
  height: 50px;
  font-size: 13.5px;
  color: var(--el-table-text-color, var(--el-text-color-regular));
  border-bottom-color: var(--el-border-color-lighter, #f1f5f9);
}

.re-table-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--el-fill-color, #f1f5f9);
  color: var(--el-text-color-secondary, #64748b);
  font-size: 12px;
  font-weight: 500;
}

.re-table-pagination {
  padding: 14px 18px;
  border-top: 1px solid var(--el-border-color-lighter, #f1f5f9);
  display: flex;
  justify-content: flex-end;
  background: var(--el-fill-color-light, transparent);
}

.re-table-pagination :deep(.el-pagination) {
  --el-pagination-hover-color: var(--el-color-primary);
}

.re-table-pagination :deep(.el-pagination.is-background .el-pager li.is-active) {
  background: var(--el-color-primary, #667eea);
  color: var(--el-color-white, #ffffff);
}
</style>
