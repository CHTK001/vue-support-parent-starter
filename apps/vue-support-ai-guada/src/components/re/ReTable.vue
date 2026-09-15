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

defineProps({
  data: { type: Array, default: () => [] },
  stripe: { type: Boolean, default: true },
  border: { type: Boolean, default: false },
  size: { type: String, default: 'default' },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: '暂无数据' },
  rowKey: { type: [String, Function], default: 'id' },
  selectable: { type: Boolean, default: false },
  showIndex: { type: Boolean, default: true },
  toolbar: { type: Boolean, default: false },
  pagination: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
})

const emit = defineEmits([
  'selection-change', 'row-click', 'size-change', 'current-change',
  'update:current-page', 'update:page-size'
])

const currentPage = ref(1)
const pageSize = ref(10)
</script>

<style scoped>
.re-table-wrapper {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
}

.re-table-toolbar {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafbfc;
}

.re-table :deep(.el-table__header-wrapper) {
  border-radius: 12px 12px 0 0;
}

.re-table :deep(.el-table__header th) {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  font-size: 13px;
  height: 48px;
  border-bottom: 2px solid #e2e8f0;
}

.re-table :deep(.el-table__body tr) {
  transition: background 0.15s ease;
}

.re-table :deep(.el-table__body tr:hover > td) {
  background: #f0f4ff !important;
}

.re-table :deep(.el-table__body td) {
  height: 52px;
  font-size: 14px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}

.re-table :deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background: #fafbfc;
}

.re-table-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
}

.re-table-pagination {
  padding: 16px 20px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  background: #fafbfc;
}

.re-table-pagination :deep(.el-pagination) {
  --el-pagination-button-bg-color: #ffffff;
  --el-pagination-hover-color: #667eea;
}

.re-table-pagination :deep(.el-pagination.is-background .el-pager li:not(.is-active):hover) {
  color: #667eea;
}

.re-table-pagination :deep(.el-pagination.is-background .el-pager li.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
