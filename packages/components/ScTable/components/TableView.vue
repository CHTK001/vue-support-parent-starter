<template>
  <div class="table-container" ref="tableContainer">
    <div class="scroll-wrapper" ref="scrollWrapper" :style="{ width: '100%', height: _height }">
      <el-table v-bind="$attrs" :key="toggleIndex" class="modern-table max-w-full" :class="{ 'headerSticky': true }"
        ref="scTable" :data="tableData" :row-contextmenu="contextmenu" :row-key="rowKey" :size="config.size"
        :border="config.border" :stripe="config.stripe" :height="_height2 !== 'auto' ? _height2 : undefined"
        :max-height="_height2 === 'auto' ? undefined : undefined"
        :summary-method="remoteSummary ? remoteSummaryMethod : summaryMethod" @row-click="onRowClick"
        @selection-change="selectionChange" @sort-change="sortChange" @filter-change="filterChange">
        <template v-for="(item, index) in userColumn" :key="index">
          <el-table-column v-if="(!item.hide || !item?.handleHide(item)) && columnInTemplate" :column-key="item.prop"
            :label="item.label" :prop="item.prop" :width="item.width" :sortable="item.sortable" :fixed="item.fixed"
            :align="item.align || 'center'" :filters="item.filters"
            :filter-method="remoteFilter || !item.filters ? null : filterHandler" show-overflow-tooltip>
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
  emptyText: String,
  stickyTop: {
    type: Number,
    default: 0
  }
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
        const availableHeight = Math.max(parentHeight - occupiedHeight, 100) - 20;
        return `${availableHeight}px`;
      }
    }

    // 如果无法获取父元素高度，则尝试使用视窗高度的一个合理比例
    const viewportHeight = (window.innerHeight || document.documentElement.clientHeight) - 120;
    return `${viewportHeight * 0.7}px`;
  }

  // 直接返回高度值
  if (typeof props.height === 'number') {
    return `${props.height}px`;
  }

  return props.height;
});

const _height2 = computed(() => {
  if (props.height === 'auto') {
    return 'auto';
  }

  const tableHeight = _height.value;
  if (typeof tableHeight === 'string') {
    // 减去2px的边框空间
    return tableHeight.endsWith('px') ? `${parseInt(tableHeight) - 2}px` : tableHeight;
  }
  return tableHeight;
});

// 方法
const handleResize = () => {
  nextTick(() => {
    doLayout();
  });
};

// 应用表头吸附样式
const applyHeaderSticky = () => {
  nextTick(() => {
    if (scTable.value) {
      const tableEl = scTable.value.$el;
      const headerWrapper = tableEl.querySelector('.el-table__header-wrapper');

      if (headerWrapper) {
        // 如果指定了吸附位置，则应用
        if (props.stickyTop !== 0) {
          headerWrapper.style.top = `${props.stickyTop}px`;
        }

        // 确保表头内容背景色不透明
        const headers = headerWrapper.querySelectorAll('th');
        headers.forEach(header => {
          header.style.backgroundColor = 'var(--el-bg-color, #ffffff)';
        });
      }
    }
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
  applyHeaderSticky(); // 重新应用吸附样式
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
    applyHeaderSticky();
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
  :deep(.el-table.headerSticky) {
    overflow: visible;

    .el-table__header-wrapper {
      position: sticky;
      z-index: calc(var(--el-table-index, 2000) + 2);
      top: 0;
      background-color: var(--el-bg-color, #ffffff);
      box-shadow: var(--el-box-shadow-light);
    }

    .el-table__fixed-header-wrapper {
      position: sticky;
      z-index: calc(var(--el-table-index, 2000) + 3);
      top: 0;
    }
  }

  :deep(.el-table__header) {
    background: rgba(var(--el-color-primary-rgb), 0.02);

    th {
      font-weight: 600;
      color: var(--el-text-color-primary);
      background-color: var(--el-bg-color, #ffffff) !important;

      &.is-sortable:hover {
        background: rgba(var(--el-color-primary-rgb), 0.04) !important;
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

  /* 确保固定列与主表格同步 */
  :deep(.el-table__fixed) {
    z-index: calc(var(--el-table-index, 2000) + 1);
  }

  /* 修复表头下面的线条问题 */
  :deep(.el-table__header-wrapper),
  :deep(.el-table__fixed-header-wrapper) {
    th.is-leaf {
      border-bottom: 1px solid var(--el-table-border-color);
    }
  }

  /* 确保滚动容器内的内容可以正常滚动 */
  :deep(.el-scrollbar__wrap) {
    overflow-x: auto !important;
    overflow-y: auto !important;
  }

  /* 固定表格滚动限制 */
  :deep(.el-table__fixed-body-wrapper),
  :deep(.el-table__fixed-right),
  :deep(.el-table__fixed) {
    .el-scrollbar__wrap {
      overflow-x: hidden !important;
    }
  }
}
</style>