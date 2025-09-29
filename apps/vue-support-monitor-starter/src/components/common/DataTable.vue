<template>
  <div class="data-table">
    <el-table
      ref="tableRef"
      :data="data"
      :loading="loading"
      v-bind="$attrs"
      @selection-change="handleSelectionChange"
    >
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
        :fixed="column.fixed"
        :align="column.align || 'left'"
        :header-align="column.headerAlign"
        :sortable="column.sortable"
        :formatter="column.formatter"
      >
        <template #default="scope" v-if="slots[column.prop]">
          <slot :name="column.prop" :row="scope.row" :column="scope.column" :$index="scope.$index"></slot>
        </template>
      </el-table-column>
      
      <!-- 默认插槽用于添加额外的列 -->
      <slot></slot>
    </el-table>
    
    <!-- 分页 -->
    <div class="data-table__pagination" v-if="showPagination">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        :layout="paginationLayout"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, useSlots } from 'vue'
import { ElTable } from 'element-plus'

interface Column {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  fixed?: boolean | 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  headerAlign?: 'left' | 'center' | 'right'
  sortable?: boolean | 'custom'
  formatter?: (row: any, column: any, cellValue: any, index: number) => any
}

interface Props {
  columns: Column[]
  data: any[]
  loading?: boolean
  total?: number
  currentPage?: number
  pageSize?: number
  pageSizes?: number[]
  showPagination?: boolean
  paginationLayout?: string
}

const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
  data: () => [],
  loading: false,
  total: 0,
  currentPage: 1,
  pageSize: 10,
  pageSizes: () => [10, 20, 50, 100],
  showPagination: true,
  paginationLayout: 'total, sizes, prev, pager, next, jumper'
})

const emit = defineEmits<{
  (e: 'size-change', size: number): void
  (e: 'current-change', page: number): void
  (e: 'selection-change', selection: any[]): void
}>()

const tableRef = ref<InstanceType<typeof ElTable> | null>(null)
const slots = useSlots()

function handleSizeChange(size: number) {
  emit('size-change', size)
}

function handleCurrentChange(page: number) {
  emit('current-change', page)
}

function handleSelectionChange(selection: any[]) {
  emit('selection-change', selection)
}

// 暴露方法给父组件
defineExpose({
  tableRef
})
</script>

<style scoped>
.data-table {
  width: 100%;
}

.data-table__pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>