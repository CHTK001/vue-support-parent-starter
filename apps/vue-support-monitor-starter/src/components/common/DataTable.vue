<template>
  <div class="data-table">
    <!-- 工具栏 -->
    <div v-if="showToolbar" class="table-toolbar">
      <div class="toolbar-left">
        <slot name="toolbar-left">
          <el-button v-if="showRefresh" size="small" @click="handleRefresh">
            <IconifyIconOnline icon="ep:refresh" class="mr-1" />
            刷新
          </el-button>
        </slot>
      </div>
      
      <div class="toolbar-right">
        <slot name="toolbar-right">
          <el-input
            v-if="showSearch"
            v-model="searchKeyword"
            placeholder="搜索..."
            size="small"
            style="width: 200px"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <IconifyIconOnline icon="ep:search" />
            </template>
          </el-input>
        </slot>
      </div>
    </div>

    <!-- 表格 -->
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="displayData"
      :stripe="stripe"
      :border="border"
      :size="size"
      :height="height"
      :max-height="maxHeight"
      :row-key="rowKey"
      :default-sort="defaultSort"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @row-click="handleRowClick"
      @row-dblclick="handleRowDblClick"
    >
      <!-- 选择列 -->
      <el-table-column
        v-if="showSelection"
        type="selection"
        width="55"
        :selectable="selectable"
      />
      
      <!-- 序号列 -->
      <el-table-column
        v-if="showIndex"
        type="index"
        label="序号"
        width="60"
        align="center"
      />
      
      <!-- 动态列 -->
      <template v-for="column in columns" :key="column.prop">
        <el-table-column
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :fixed="column.fixed"
          :sortable="column.sortable"
          :align="column.align || 'left'"
          :show-overflow-tooltip="column.showOverflowTooltip !== false"
        >
          <template #default="{ row, column: col, $index }">
            <slot
              :name="column.prop"
              :row="row"
              :column="col"
              :index="$index"
              :value="getColumnValue(row, column.prop)"
            >
              <span v-if="column.formatter">
                {{ column.formatter(getColumnValue(row, column.prop), row, col, $index) }}
              </span>
              <span v-else>
                {{ getColumnValue(row, column.prop) }}
              </span>
            </slot>
          </template>
        </el-table-column>
      </template>
      
      <!-- 操作列 -->
      <el-table-column
        v-if="showActions"
        label="操作"
        :width="actionsWidth"
        :fixed="actionsFixed"
        align="center"
      >
        <template #default="{ row, $index }">
          <slot name="actions" :row="row" :index="$index">
            <el-button size="small" type="primary" @click="$emit('edit', row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="$emit('delete', row)">
              删除
            </el-button>
          </slot>
        </template>
      </el-table-column>
      
      <!-- 空数据 -->
      <template #empty>
        <slot name="empty">
          <el-empty :description="emptyText" />
        </slot>
      </template>
    </el-table>

    <!-- 分页 -->
    <div v-if="showPagination" class="table-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="pageSizes"
        :layout="paginationLayout"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";

// 列配置接口
interface TableColumn {
  prop: string;
  label: string;
  width?: string | number;
  minWidth?: string | number;
  fixed?: boolean | 'left' | 'right';
  sortable?: boolean | 'custom';
  align?: 'left' | 'center' | 'right';
  showOverflowTooltip?: boolean;
  formatter?: (value: any, row: any, column: any, index: number) => string;
}

// 定义属性
interface Props {
  data: any[];
  columns: TableColumn[];
  loading?: boolean;
  stripe?: boolean;
  border?: boolean;
  size?: 'large' | 'default' | 'small';
  height?: string | number;
  maxHeight?: string | number;
  rowKey?: string;
  defaultSort?: { prop: string; order: 'ascending' | 'descending' };
  
  // 功能开关
  showToolbar?: boolean;
  showRefresh?: boolean;
  showSearch?: boolean;
  showSelection?: boolean;
  showIndex?: boolean;
  showActions?: boolean;
  showPagination?: boolean;
  
  // 选择相关
  selectable?: (row: any, index: number) => boolean;
  
  // 操作列配置
  actionsWidth?: string | number;
  actionsFixed?: boolean | 'left' | 'right';
  
  // 分页配置
  total?: number;
  pageSize?: number;
  pageSizes?: number[];
  paginationLayout?: string;
  
  // 其他
  emptyText?: string;
  searchFields?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  stripe: true,
  border: false,
  size: 'default',
  showToolbar: true,
  showRefresh: true,
  showSearch: true,
  showSelection: false,
  showIndex: false,
  showActions: true,
  showPagination: true,
  actionsWidth: 150,
  actionsFixed: 'right',
  total: 0,
  pageSize: 20,
  pageSizes: () => [10, 20, 50, 100],
  paginationLayout: 'total, sizes, prev, pager, next, jumper',
  emptyText: '暂无数据',
  searchFields: () => [],
});

// 定义事件
const emit = defineEmits<{
  refresh: [];
  search: [keyword: string];
  'selection-change': [selection: any[]];
  'sort-change': [sort: { prop: string; order: string }];
  'row-click': [row: any, column: any, event: Event];
  'row-dblclick': [row: any, column: any, event: Event];
  'size-change': [size: number];
  'current-change': [page: number];
  edit: [row: any];
  delete: [row: any];
}>();

// 响应式状态
const tableRef = ref();
const searchKeyword = ref("");
const currentPage = ref(1);
const pageSize = ref(props.pageSize);

// 计算属性
const displayData = computed(() => {
  let result = props.data;
  
  // 搜索过滤
  if (searchKeyword.value && props.searchFields.length > 0) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(row => {
      return props.searchFields.some(field => {
        const value = getColumnValue(row, field);
        return String(value).toLowerCase().includes(keyword);
      });
    });
  }
  
  return result;
});

/**
 * 获取列值
 */
const getColumnValue = (row: any, prop: string) => {
  return prop.split('.').reduce((obj, key) => obj?.[key], row);
};

/**
 * 处理刷新
 */
const handleRefresh = () => {
  emit('refresh');
};

/**
 * 处理搜索
 */
const handleSearch = () => {
  emit('search', searchKeyword.value);
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: any[]) => {
  emit('selection-change', selection);
};

/**
 * 处理排序变化
 */
const handleSortChange = (sort: { prop: string; order: string }) => {
  emit('sort-change', sort);
};

/**
 * 处理行点击
 */
const handleRowClick = (row: any, column: any, event: Event) => {
  emit('row-click', row, column, event);
};

/**
 * 处理行双击
 */
const handleRowDblClick = (row: any, column: any, event: Event) => {
  emit('row-dblclick', row, column, event);
};

/**
 * 处理页面大小变化
 */
const handleSizeChange = (size: number) => {
  pageSize.value = size;
  emit('size-change', size);
};

/**
 * 处理当前页变化
 */
const handleCurrentChange = (page: number) => {
  currentPage.value = page;
  emit('current-change', page);
};

/**
 * 清空选择
 */
const clearSelection = () => {
  tableRef.value?.clearSelection();
};

/**
 * 切换行选择
 */
const toggleRowSelection = (row: any, selected?: boolean) => {
  tableRef.value?.toggleRowSelection(row, selected);
};

/**
 * 设置当前行
 */
const setCurrentRow = (row: any) => {
  tableRef.value?.setCurrentRow(row);
};

/**
 * 刷新表格布局
 */
const doLayout = () => {
  tableRef.value?.doLayout();
};

// 监听页面大小变化
watch(
  () => props.pageSize,
  (newSize) => {
    pageSize.value = newSize;
  }
);

// 暴露方法
defineExpose({
  clearSelection,
  toggleRowSelection,
  setCurrentRow,
  doLayout,
  tableRef,
});
</script>

<style scoped lang="scss">
.data-table {
  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 0;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .table-pagination {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}
</style>
