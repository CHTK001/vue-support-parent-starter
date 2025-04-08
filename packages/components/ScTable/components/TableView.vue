<template>
  <div 
    class="table-container"
    ref="tableContainer"
  >
    <div 
      class="scroll-wrapper "
      ref="scrollWrapper"
      :style="{ overflow: 'auto', width: '100%', height: _height }"
    >
      <el-table 
        v-bind="$attrs" 
        :key="toggleIndex" 
        class="modern-table max-w-full" 
        ref="scTable" 
        :data="tableData"
        :row-contextmenu="contextmenu" 
        :row-key="rowKey" 
        :height="_height2"
        :size="config.size" 
        :border="config.border" 
        :stripe="config.stripe"
        :summary-method="remoteSummary ? remoteSummaryMethod : summaryMethod" 
        @row-click="onRowClick"
        @selection-change="selectionChange" 
        @sort-change="sortChange" 
        @filter-change="filterChange"
      >
        <template v-for="(item, index) in userColumn" :key="index">
          <el-table-column 
            v-if="(!item.hide || !item?.handleHide(item)) && columnInTemplate"
            :column-key="item.prop" 
            :label="item.label" 
            :prop="item.prop" 
            :width="item.width"
            :sortable="item.sortable" 
            :fixed="item.fixed" 
            :align="item.align || 'center'" 
            :filters="item.filters"
            :filter-method="remoteFilter || !item.filters ? null : filterHandler" 
            show-overflow-tooltip
          >
            <template #default="scope">
              <slot :name="item.prop" v-bind="scope" :row="scope.row">
                {{ item.formatter ? item.formatter(scope.row) : (scope.row[item.prop] || (item.defaultValue || '-')) }}
              </slot>
            </template>
          </el-table-column>
        </template>
        <slot />
        <template #empty>
          <el-empty :description="emptyText" :image-size="100" />
        </template>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

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
  emptyText: String
});

// 定义emits
const emit = defineEmits(['row-click', 'selection-change', 'sort-change', 'filter-change']);

// refs
const tableContainer = ref(null);
const scrollWrapper = ref(null);
const scTable = ref(null);

// 计算属性
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
        return `${availableHeight}px`;
      }
    }
    
    // 如果无法获取父元素高度，则尝试使用视窗高度的一个合理比例
    // 考虑到页面可能有导航栏、页头、页脚等元素
    const viewportHeight = (window.innerHeight || document.documentElement.clientHeight)- 120;
    return `${viewportHeight * 0.7}px`;
  }
  return props.height;
});

const _height2 = computed(() => {
  const _tableHeight = _height.value;
  return _tableHeight.endsWith('px') ? `${parseInt(_tableHeight) - 60}px` : `${_tableHeight}`;
});

// 方法
const handleResize = () => {
  nextTick(() => {
    doLayout();
  });
};

// 原生方法转发
const clearSelection = () => {
  scTable.value?.clearSelection();
};

const toggleRowSelection = (row, selected) => {
  scTable.value.toggleRowSelection(row, selected);
};

const toggleAllSelection = () => {
  scTable.value.toggleAllSelection();
};

const toggleRowExpansion = (row, expanded) => {
  scTable.value.toggleRowExpansion(row, expanded);
};

const setCurrentRow = (row) => {
  scTable.value.setCurrentRow(row);
};

const clearSort = () => {
  scTable.value.clearSort();
};

const clearFilter = (columnKey) => {
  scTable.value.clearFilter(columnKey);
};

const doLayout = () => {
  scTable.value?.doLayout();
};

const sort = (prop, order) => {
  scTable.value.sort(prop, order);
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
    const values = props.summary?.[column.property];
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
    doLayout();
  });
});

watch(() => props.userColumn, () => {
  nextTick(() => {
    doLayout();
  });
});

// 生命周期钩子
onMounted(() => {
  // 初始化表格布局
  nextTick(() => {
    doLayout();
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
.table-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.scroll-wrapper {
  width: 100%;
  max-width: 100%;
  overflow: auto;
}

.modern-table {
  :deep(.el-table__header) {
    background: rgba(var(--el-color-primary-rgb), 0.02);
    
    th {
      font-weight: 600;
      color: var(--el-text-color-primary);
      
      &.is-sortable:hover {
        background: rgba(var(--el-color-primary-rgb), 0.04);
      }
    }
  }
  
  :deep(.el-table__body) {
    tr {
      transition: all 0.3s;
      
      &:hover {
        background: rgba(var(--el-color-primary-rgb), 0.04);
        transform: translateY(-1px);
      }
      
      td {
        transition: all 0.3s;
      }
    }
  }
  
  :deep(.el-table__footer) {
    .cell {
      font-weight: bold;
    }
  }
}
</style>