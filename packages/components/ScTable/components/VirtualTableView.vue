<template>
  <div class="virtual-table-container" ref="tableContainer">
    <div 
      class="scroll-wrapper"
      ref="scrollWrapper"
      :style="{ width: '100%', height: _height }"
    >
      <!-- 使用Element Plus的el-table-v2组件 -->
      <el-table-v2
        v-bind="$attrs"
        :key="toggleIndex"
        class="modern-table virtual-table max-w-full"
        ref="virtualTable"
        :data="tableData"
        :columns="columns"
        :width="tableWidth"
        :height="tableHeight"
        :row-height="estimatedRowHeight"
        :row-key="rowKey"
        :fixed="true"
        :row-class="getRowClass"
        :cell-props="getCellProps"
        :header-cell-props="getHeaderCellProps"
        :header-class="getHeaderClass"
        :header-height="40"
        :sort-by="sortState"
        :sort-state="sortState"
        @row-click="onRowClick"
        @sort-change="handleSortChange"
      >
        <template #empty>
          <div class="virtual-table-empty">
            <el-empty :description="emptyText" :image-size="100" />
          </div>
        </template>
      </el-table-v2>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount, reactive } from 'vue';

// 定义props
const props = defineProps({
  tableData: {
    type: Array,
    default: () => []
  },
  userColumn: {
    type: Array,
    default: () => []
  },
  config: {
    type: Object,
    required: true
  },
  contextmenu: Function,
  rowKey: String,
  height: [String, Number],
  columnInTemplate: Boolean,
  remoteFilter: Boolean,
  remoteSummary: Boolean,
  summaryMethod: Function,
  toggleIndex: Number,
  emptyText: String,
  pageSize: {
    type: Number,
    default: 10
  }
});

// 定义emits
const emit = defineEmits(['row-click', 'selection-change', 'sort-change', 'filter-change']);

// refs
const tableContainer = ref(null);
const scrollWrapper = ref(null);
const virtualTable = ref(null);

// 虚拟表格相关的响应式数据
const estimatedRowHeight = ref(50); // 估计的行高
const tableWidth = ref(0); // 表格宽度
const tableHeight = ref(400); // 表格高度
const summary = ref({}); // 汇总数据
const sortState = reactive({
  key: '',
  order: ''
});

// 计算属性
const columns = computed(() => {
  if (!props.userColumn || props.userColumn.length === 0) return [];
  
  return props.userColumn
    .filter(item => !item.hide && (!item.handleHide || !item.handleHide(item)))
    .map(item => ({
      key: item.prop,
      dataKey: item.prop,
      title: item.label,
      width: item.width || 150,
      sortable: !!item.sortable,
      fixed: item.fixed,
      align: item.align || 'center',
      cellRenderer: ({ cellData, rowData }) => {
        return item.formatter 
          ? item.formatter(rowData) 
          : (cellData || item.defaultValue || '-');
      }
    }));
});

const _height = computed(() => {
  if (props.height === 'auto') {
    // 当设置为auto时，尝试获取父元素的可视高度
    if (tableContainer.value && tableContainer.value.parentElement) {
      const parentElement = tableContainer.value.parentElement;
      const parentHeight = parentElement.clientHeight;
      
      // 如果父元素有可视高度，则使用父元素高度
      if (parentHeight > 0) {
        // 计算父元素内其他可能的元素（如分页、工具栏等）占用的空间
        const siblings = Array.from(parentElement.children).filter(el => el !== tableContainer.value);
        let occupiedHeight = 0;
        
        siblings.forEach(sibling => {
          if (sibling.offsetHeight) {
            occupiedHeight += sibling.offsetHeight;
          }
        });
        
        // 计算可用高度，确保至少有100px的最小高度
        const availableHeight = Math.max(parentHeight - occupiedHeight, 100) - 120;
        tableHeight.value = availableHeight;
        return `${availableHeight}px`;
      }
    }
    
    // 如果无法获取父元素高度，则尝试使用视窗高度的一个合理比例
    const viewportHeight = (window.innerHeight || document.documentElement.clientHeight) - 120;
    tableHeight.value = viewportHeight * 0.7;
    return `${viewportHeight * 0.7}px`;
  }
  
  // 如果是数字，转换为像素值
  if (typeof props.height === 'number') {
    tableHeight.value = props.height;
    return `${props.height}px`;
  }
  
  // 如果是字符串（如'500px'），直接使用
  tableHeight.value = parseInt(props.height);
  return props.height;
});

// 方法
const updateTableSize = () => {
  if (scrollWrapper.value) {
    tableWidth.value = scrollWrapper.value.clientWidth || 800;
  }
};

const getRowClass = ({ rowIndex }) => {
  const classes = ['virtual-table-row'];
  if (props.config.stripe && rowIndex % 2 === 1) {
    classes.push('is-striped');
  }
  return classes;
};

const getHeaderClass = ({ columnIndex }) => {
  return ['virtual-table-header-cell'];
};

const getCellProps = ({ columnIndex, rowIndex }) => {
  return {
    class: 'virtual-table-cell',
    style: { borderBottom: props.config.border ? '1px solid var(--el-border-color-lighter)' : 'none' }
  };
};

const getHeaderCellProps = ({ columnIndex }) => {
  return {
    class: 'virtual-table-header-cell',
    style: { borderBottom: '1px solid var(--el-border-color-lighter)' }
  };
};

const handleSortChange = ({ key, order }) => {
  sortState.key = key;
  sortState.order = order;
  emit('sort-change', { prop: key, order });
};

const handleResize = () => {
  nextTick(() => {
    updateTableSize();
  });
};

// 原生方法转发
const clearSelection = () => {
  // el-table-v2 目前不支持选择功能，需要自行实现
  console.warn('el-table-v2 does not support selection directly');
};

const toggleRowSelection = (row, selected) => {
  // el-table-v2 目前不支持选择功能，需要自行实现
  console.warn('el-table-v2 does not support selection directly');
};

const toggleAllSelection = () => {
  // el-table-v2 目前不支持选择功能，需要自行实现
  console.warn('el-table-v2 does not support selection directly');
};

const toggleRowExpansion = (row, expanded) => {
  // el-table-v2 目前不支持展开行功能，需要自行实现
  console.warn('el-table-v2 does not support row expansion directly');
};

const setCurrentRow = (row) => {
  // el-table-v2 目前不支持当前行功能，需要自行实现
  console.warn('el-table-v2 does not support current row directly');
};

const clearSort = () => {
  sortState.key = '';
  sortState.order = '';
};

const clearFilter = (columnKey) => {
  // el-table-v2 目前不支持筛选功能，需要自行实现
  console.warn('el-table-v2 does not support filtering directly');
};

const doLayout = () => {
  nextTick(() => {
    updateTableSize();
  });
};

const sort = (prop, order) => {
  sortState.key = prop;
  sortState.order = order;
};

const onRowClick = (row) => {
  emit('row-click', row);
};

const selectionChange = (selection) => {
  emit('selection-change', selection);
};

const sortChange = (sort) => {
  emit('sort-change', sort);
};

const filterChange = (filters) => {
  emit('filter-change', filters);
};

const filterHandler = (value, row, column) => {
  const property = column.property;
  return row[property] === value;
};

const remoteSummaryMethod = (param) => {
  const { columns } = param;
  const sums = [];
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计';
      return;
    }
    const values = summary.value[column.property];
    if (values) {
      sums[index] = values;
    } else {
      sums[index] = '';
    }
  });
  return sums;
};

// 监听数据变化
watch(() => props.tableData, () => {
  nextTick(() => {
    updateTableSize();
  });
});

watch(() => props.userColumn, () => {
  nextTick(() => {
    updateTableSize();
  });
});

// 生命周期钩子
onMounted(() => {
  // 初始化表格布局
  nextTick(() => {
    updateTableSize();
  });
  
  // 添加窗口大小变化的监听，以便动态调整表格高度
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  // 组件销毁前移除事件监听，避免内存泄漏
  window.removeEventListener('resize', handleResize);
});

// 暴露方法给父组件
defineExpose({
  clearSelection,
  toggleRowSelection,
  toggleAllSelection,
  toggleRowExpansion,
  setCurrentRow,
  clearSort,
  clearFilter,
  doLayout,
  sort
});
</script>

<style lang="scss" scoped>
.virtual-table-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.scroll-wrapper {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.virtual-table {
  :deep(.el-table-v2__header-row) {
    background: rgba(var(--el-color-primary-rgb), 0.02);
    font-weight: 600;
    color: var(--el-text-color-primary);
    
    .el-table-v2__header-cell.sortable:hover {
      background: rgba(var(--el-color-primary-rgb), 0.04);
    }
  }
  
  :deep(.el-table-v2__row) {
    transition: all 0.3s;
    
    &:hover {
      background: rgba(var(--el-color-primary-rgb), 0.04);
      transform: translateY(-1px);
    }
    
    &.is-striped {
      background-color: var(--el-fill-color-lighter);
    }
  }
}

.virtual-table-empty {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  transform: translateY(-50%);
  text-align: center;
}

.virtual-table-cell {
  padding: 8px;
  transition: all 0.3s;
}

.virtual-table-header-cell {
  padding: 8px;
  background: rgba(var(--el-color-primary-rgb), 0.02);
}
</style>