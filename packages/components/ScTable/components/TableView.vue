<template>
  <div class="table-container" ref="tableContainer" :style="containerStyle">
    <div class="scroll-wrapper" ref="scrollWrapper" :style="scrollWrapperStyle">
      <el-table v-bind="$attrs" :key="toggleIndex" class="modern-table max-w-full headerSticky" ref="scTable"
        :data="tableData" :row-key="rowKey" :size="config.size" :border="config.border"
        :stripe="config.stripe" :height="undefined" :max-height="undefined"
        :summary-method="remoteSummary ? remoteSummaryMethod : summaryMethod" 
        @row-click="onRowClick"
        @selection-change="selectionChange" 
        @sort-change="sortChange" 
        @filter-change="filterChange"
        @row-contextmenu="handleRowContextMenu">
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
    <!-- 引入右键菜单组件 -->
    <ContextMenu ref="contextMenuRef" :menu-items="menuItems" :row-data="currentRowData" :class-name="config.contextmenuClass" @menu-action="handleMenuAction" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import ContextMenu from '../plugins/ContextMenu.vue';

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
    required: true,
    default: () => ({
      border: false,
      stripe: false,
      size: 'default'
    })
  },
  paginationType: {
    type: String,
    default: 'default'
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

// 右键菜单相关状态
const contextMenuRef = ref(null);
const menuItems = ref([]);
const currentRowData = ref({});
const currentColumn = ref(null);

// 处理行右键菜单
const handleRowContextMenu = (row, column, event) => {
  if (!props.contextmenu) return;
  
  // 阻止默认右键菜单
  event.preventDefault();
  
  // 保存当前行数据和列信息
  currentRowData.value = row;
  currentColumn.value = column;
  
  // 调用外部传入的contextmenu函数获取菜单项
  const items = props.contextmenu(row, column, event);
  
  if (items && items.length > 0) {
    menuItems.value = items;
    // 显示右键菜单
    nextTick(() => {
      contextMenuRef.value.open(event, row);
    });
  }
};

// 处理菜单动作
const handleMenuAction = (action) => {
  // 如果需要，可以在这里处理菜单动作
  console.log('菜单动作:', action);
};

// refs
const tableContainer = ref(null);
const scrollWrapper = ref(null);
const scTable = ref(null);

// 计算容器样式
const containerStyle = computed(() => {
  return {
    position: 'relative',
    width: '100%',
    height: '100%',  // 设置高度为100%以适应父容器
    overflow: 'hidden' // 防止内容溢出
  };
});

// 计算滚动容器样式
const scrollWrapperStyle = computed(() => {
  return {
    width: '100%',
    height: '100%', // 设置高度为100%以适应父容器
    maxWidth: '100%',
    maxHeight: '100%', // 限制最大高度
    overflow: 'auto' // 允许内容溢出时滚动
  };
});

// 直接使用 100% 作为表格高度，让它填充滚动容器
const tableHeight = computed(() => {
  return '100%';
});

// 方法
const handleResize = () => {
  nextTick(() => {
    doLayout();
  });
};

// 处理表头和表体滚动同步
const handleHeaderScroll = (e) => {
  if (!scTable.value) return;
  
  const tableEl = scTable.value.$el;
  const headerWrapper = tableEl.querySelector('.el-table__header-wrapper');
  const bodyWrapper = tableEl.querySelector('.el-table__body-wrapper');
  
  if (e.target === headerWrapper) {
    // 表头滚动同步到表体
    bodyWrapper.scrollLeft = headerWrapper.scrollLeft;
  } else if (e.target === bodyWrapper) {
    // 表体滚动同步到表头
    headerWrapper.scrollLeft = bodyWrapper.scrollLeft;
  }
};

// 应用表头吸附样式
const applyHeaderSticky = () => {
  nextTick(() => {
    if (scTable.value) {
      const tableEl = scTable.value.$el;
      const headerWrapper = tableEl.querySelector('.el-table__header-wrapper');
      const bodyWrapper = tableEl.querySelector('.el-table__body-wrapper');

      if (headerWrapper) {
        // 设置表头固定样式
        headerWrapper.style.position = 'sticky';
        headerWrapper.style.top = `${props.stickyTop}px`;
        headerWrapper.style.zIndex = '10';
        headerWrapper.style.width = '100%';

        // 增加阴影效果以增强视觉区分
        headerWrapper.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.05)';

        // 确保表头内容背景色不透明
        const headers = headerWrapper.querySelectorAll('th');
        headers.forEach(header => {
          header.style.backgroundColor = 'var(--el-bg-color, #ffffff)';
        });
        
        // 添加滚动事件监听
        if (headerWrapper && bodyWrapper) {
          headerWrapper.removeEventListener('scroll', handleHeaderScroll);
          bodyWrapper.removeEventListener('scroll', handleHeaderScroll);
          
          headerWrapper.addEventListener('scroll', handleHeaderScroll);
          bodyWrapper.addEventListener('scroll', handleHeaderScroll);
        }
      }

      // 处理固定列的表头
      const fixedHeaderWrappers = tableEl.querySelectorAll('.el-table__fixed-header-wrapper');
      fixedHeaderWrappers.forEach(wrapper => {
        wrapper.style.position = 'sticky';
        wrapper.style.top = `${props.stickyTop}px`;
        wrapper.style.zIndex = '11';
      });
    }
  });
};

// 同步表格宽度
const syncTableWidth = () => {
  if (!scTable.value) return;
  
  const tableEl = scTable.value.$el;
  const headerTable = tableEl.querySelector('.el-table__header');
  const bodyTable = tableEl.querySelector('.el-table__body');
  
  if (headerTable && bodyTable) {
    // 确保表头和表体宽度一致
    const width = Math.max(headerTable.offsetWidth, bodyTable.offsetWidth);
    headerTable.style.width = `${width}px`;
    bodyTable.style.width = `${width}px`;
  }
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
  
  // 延迟执行以确保布局完成后再同步宽度和应用吸附样式
  setTimeout(() => {
    syncTableWidth();
    applyHeaderSticky();
  }, 50);
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

// 确保在每次 toggleIndex 变化时重新应用设置
watch(() => props.toggleIndex, () => {
  nextTick(() => {
    doLayout();
  });
});

// 监听配置变更以重新应用表格布局
watch(() => props.config, () => {
  nextTick(() => {
    doLayout();
  });
}, { deep: true });

// 生命周期钩子
onMounted(() => {
  // 初始化表格布局
  nextTick(() => {
    doLayout();

    // 监听父元素滚动，保持表头固定
    const parentScrollElement = findScrollParent(tableContainer.value);
    if (parentScrollElement && parentScrollElement !== document) {
      parentScrollElement.addEventListener('scroll', applyHeaderSticky);
    }
  });

  // 添加窗口大小变化的监听，以便动态调整表格高度
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  // 组件销毁前移除事件监听，避免内存泄漏
  window.removeEventListener('resize', handleResize);

  // 移除滚动监听
  const parentScrollElement = findScrollParent(tableContainer.value);
  if (parentScrollElement && parentScrollElement !== document) {
    parentScrollElement.removeEventListener('scroll', applyHeaderSticky);
  }
  
  // 移除表头和表体滚动同步监听
  if (scTable.value) {
    const tableEl = scTable.value.$el;
    const headerWrapper = tableEl.querySelector('.el-table__header-wrapper');
    const bodyWrapper = tableEl.querySelector('.el-table__body-wrapper');
    
    if (headerWrapper && bodyWrapper) {
      headerWrapper.removeEventListener('scroll', handleHeaderScroll);
      bodyWrapper.removeEventListener('scroll', handleHeaderScroll);
    }
  }
});

// 查找最近的可滚动父元素
const findScrollParent = (element) => {
  if (!element) return document;

  let parent = element.parentElement;
  while (parent) {
    const hasScroll = parent.scrollHeight > parent.clientHeight;
    const overflow = window.getComputedStyle(parent).overflow;
    if (hasScroll && (overflow === 'auto' || overflow === 'scroll')) {
      return parent;
    }
    parent = parent.parentElement;
  }

  return document;
};

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
.modern-table {
  :deep(.el-table__body-wrapper) {
    overflow: auto !important;
  }

  &:deep(.headerSticky) {
    overflow: visible;

    .el-table__header-wrapper {
      position: sticky !important;
      top: 0;
      z-index: 10;
      background-color: var(--el-bg-color, #ffffff);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      width: 100%;
      overflow-x: hidden !important;

      th {
        background-color: var(--el-bg-color, #ffffff) !important;
      }
    }

    .el-table__fixed-header-wrapper {
      position: sticky !important;
      top: 0;
      z-index: 11;
    }
  }

  :deep(.el-table__header) {
    background: rgba(var(--el-color-primary-rgb), 0.02);
    table-layout: fixed !important;

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
    table-layout: fixed !important;
    
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
    z-index: 9;
    height: 100% !important;
    bottom: 0 !important;
  }

  :deep(.el-table__fixed-right) {
    z-index: 9;
    height: 100% !important;
    bottom: 0 !important;
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
  
  /* 修复滚动到最后一列时对齐问题 */
  :deep(.el-table) {
    overflow-x: hidden !important;
    
    .el-table__header-wrapper,
    .el-table__body-wrapper {
      width: 100% !important;
      overflow-x: auto !important;
    }
    
    /* 保持表头和表体滚动同步 */
    .el-table__body {
      width: 100%;
      min-width: 100%;
    }
    
    .el-table__header {
      width: 100%;
      min-width: 100%;
    }
  }
}
</style>