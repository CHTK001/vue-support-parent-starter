<template>
  <div ref="tableContainer" class="virtual-table-container" @wheel="handleWheel">
    <div ref="scrollWrapper" class="scroll-wrapper" :style="{ width: '100%', height: _height }" @contextmenu.prevent="handleWrapperContextMenu">
      <!-- 使用Element Plus的el-table-v2组件 -->
      <el-table-v2
        v-bind="$attrs"
        :key="toggleIndex"
        ref="virtualTable"
        class="modern-table virtual-table max-w-full"
        :class="[`size-${currentSize}`]"
        :data="tableData"
        :columns="columns"
        :width="tableWidth"
        :height="tableHeight"
        :row-height="estimatedRowHeight"
        :header-height="headerHeight"
        :row-key="rowKey"
        :fixed="true"
        :row-class="getRowClass"
        :cell-props="getCellProps"
        :header-cell-props="getHeaderCellProps"
        :header-class="getHeaderClass"
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

    <!-- 右键菜单组件 -->
    <ContextMenu ref="contextMenuRef" :menu-items="menuItems" :row-data="currentRowData" :class-name="config.contextmenuClass" @menu-action="handleMenuAction" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount, reactive } from "vue";
import { getLogger } from "@repo/utils";
import ContextMenu from "../plugins/ContextMenu.vue";

const logger = getLogger("[ScTable][VirtualTableView]");

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
const emit = defineEmits(["row-click", "selection-change", "sort-change", "filter-change", "col-click"]);

// refs
const tableContainer = ref(null);
const scrollWrapper = ref(null);
const virtualTable = ref(null);
let wheelHandler = null;

// 虚拟表格相关的响应式数据
const estimatedRowHeight = ref(50); // 估计的行高
const tableWidth = ref(0); // 表格宽度
const tableHeight = ref(400); // 表格高度
const headerHeight = ref(40); // 表头高度
const summary = ref({}); // 汇总数据
const sortState = reactive({
  key: "",
  order: ""
});

// 添加右键菜单相关
const contextMenuRef = ref(null);
const menuItems = ref([]);
const currentRowData = ref({});

// 根据表格尺寸计算行高和表头高度
const updateSizeBasedStyles = size => {
  switch (size) {
    case "large":
      estimatedRowHeight.value = 60;
      headerHeight.value = 50;
      break;
    case "small":
      estimatedRowHeight.value = 36;
      headerHeight.value = 32;
      break;
    case "default":
    default:
      estimatedRowHeight.value = 48;
      headerHeight.value = 40;
      break;
  }
};

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
      align: item.align || "center",
      cellRenderer: ({ cellData, rowData }) => {
        return item.formatter ? item.formatter(rowData) : cellData || item.defaultValue || "-";
      }
    }));
});

// 获取当前表格size
const currentSize = computed(() => {
  return props.config?.size || "default";
});

const _height = computed(() => {
  if (props.height === "auto") {
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
        // 设置表格高度
        //@ts-ignore
        tableHeight.value = availableHeight;
        return `${availableHeight}px`;
      }
    }

    // 如果无法获取父元素高度，则尝试使用视窗高度的一个合理比例
    const viewportHeight = (window.innerHeight || document.documentElement.clientHeight) - 120;
    //@ts-ignore
    tableHeight.value = viewportHeight * 0.7;
    return `${viewportHeight * 0.7}px`;
  }

  // 如果是数字，转换为像素值
  if (typeof props.height === "number") {
    //@ts-ignore
    tableHeight.value = props.height;
    return `${props.height}px`;
  }

  // 如果是百分比字符串
  if (typeof props.height === "string" && props.height.endsWith("%")) {
    const percentage = parseInt(props.height) / 100;
    let pxHeight = 0;
    
    // 尝试获取父元素高度
    if (tableContainer.value && tableContainer.value.parentElement) {
      const parentHeight = tableContainer.value.parentElement.clientHeight;
      if (parentHeight > 0) {
        pxHeight = Math.floor(parentHeight * percentage);
      }
    }
    
    // 降级方案：使用视窗高度
    if (pxHeight === 0) {
       const viewportHeight = (window.innerHeight || document.documentElement.clientHeight);
       pxHeight = Math.floor(viewportHeight * percentage);
    }
    
    //@ts-ignore
    tableHeight.value = pxHeight;
    return props.height; 
  }

  // 如果是字符串（如'500px'），直接使用
  //@ts-ignore
  tableHeight.value = parseInt(props.height);
  return props.height;
});

// 方法
const updateTableSize = () => {
  if (scrollWrapper.value) {
    tableWidth.value = scrollWrapper.value.clientWidth || 800;
  }

  // 根据当前size更新行高和表头高度
  updateSizeBasedStyles(currentSize.value);
};

// 完整重新渲染表格
const rerenderTable = () => {
  nextTick(() => {
    updateTableSize();
    if (virtualTable.value) {
      // 尝试调用el-table-v2的内部刷新方法
      virtualTable.value.scrollToRow(0);

      // 强制更新DOM
      if (virtualTable.value.$el) {
        const el = virtualTable.value.$el;
        el.style.display = "none";
        // 触发回流
        void el.offsetHeight;
        el.style.display = "";
      }
    }
  });
};

const getRowClass = ({ rowIndex }) => {
  const classes = ["virtual-table-row", `size-${currentSize.value}`];
  if (props.config.stripe && rowIndex % 2 === 1) {
    classes.push("is-striped");
  }
  return classes;
};

const getHeaderClass = ({ columnIndex }) => {
  return ["virtual-table-header-cell", `size-${currentSize.value}`];
};

const getCellProps = ({ columnIndex, rowIndex }) => {
  return {
    class: "virtual-table-cell",
    style: {
      borderBottom: props.config.border ? "1px solid var(--stitch-lay-border)" : "none",
      padding: currentSize.value === "large" ? "12px 8px" : currentSize.value === "small" ? "4px 8px" : "8px"
    }
  };
};

const getHeaderCellProps = ({ columnIndex }) => {
  return {
    class: "virtual-table-header-cell",
    style: {
      borderBottom: "1px solid var(--stitch-lay-border)",
      padding: currentSize.value === "large" ? "12px 8px" : currentSize.value === "small" ? "4px 8px" : "8px"
    }
  };
};

const handleSortChange = ({ key, order }) => {
  sortState.key = key;
  sortState.order = order;
  emit("sort-change", { prop: key, order });
};

const handleResize = () => {
  nextTick(() => {
    updateTableSize();
  });
};

// 原生方法转发
const clearSelection = () => {
  // el-table-v2 目前不支持选择功能，需要自行实现
  logger.warn("el-table-v2 does not support selection directly");
};

const toggleRowSelection = (row, selected) => {
  // el-table-v2 目前不支持选择功能，需要自行实现
  logger.warn("el-table-v2 does not support selection directly");
};

const toggleAllSelection = () => {
  // el-table-v2 目前不支持选择功能，需要自行实现
  logger.warn("el-table-v2 does not support selection directly");
};

const toggleRowExpansion = (row, expanded) => {
  // el-table-v2 目前不支持展开行功能，需要自行实现
  logger.warn("el-table-v2 does not support row expansion directly");
};

const setCurrentRow = row => {
  // el-table-v2 目前不支持当前行功能，需要自行实现
  logger.warn("el-table-v2 does not support current row directly");
};

const clearSort = () => {
  sortState.key = "";
  sortState.order = "";
};

const clearFilter = columnKey => {
  // el-table-v2 目前不支持筛选功能，需要自行实现
  logger.warn("el-table-v2 does not support filtering directly");
};

const doLayout = () => {
  nextTick(() => {
    updateTableSize();
    rerenderTable();
  });
};

const sort = (prop, order) => {
  sortState.key = prop;
  sortState.order = order;
};

const onRowClick = row => {
  emit("row-click", row);
};

const selectionChange = selection => {
  emit("selection-change", selection);
};

const sortChange = sort => {
  emit("sort-change", sort);
};

const filterChange = filters => {
  emit("filter-change", filters);
};

const filterHandler = (value, row, column) => {
  const property = column.property;
  return row[property] === value;
};

const remoteSummaryMethod = param => {
  const { columns } = param;
  const sums = [];
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = "合计";
      return;
    }
    const values = summary.value[column.property];
    if (values) {
      sums[index] = values;
    } else {
      sums[index] = "";
    }
  });
  return sums;
};

// 处理菜单动作
const handleMenuAction = action => {
  // 如果需要，可以在这里处理菜单动作
  logger.info("菜单动作: {}", action);
};

// 添加包装器的右键菜单处理函数
const handleWrapperContextMenu = event => {
  if (!props.contextmenu || !virtualTable.value) return;

  const tableEl = virtualTable.value.$el;
  if (!tableEl) return;
  
  const rect = tableEl.getBoundingClientRect();

  // 计算鼠标相对于表格的位置
  const relativeY = event.clientY - rect.top;

  // 计算行索引：减去表头高度，然后除以每行高度
  let rowIndex = Math.floor((relativeY - headerHeight.value) / estimatedRowHeight.value);

  // 确保行索引有效
  if (rowIndex < 0 || rowIndex >= props.tableData.length) {
    // 如果点击在表头或者无效区域，不处理
    return;
  }

  const row = props.tableData[rowIndex];

  // 保存当前行数据
  currentRowData.value = row;

  // 调用外部传入的contextmenu函数获取菜单项
  const items = props.contextmenu(row, null, event);

  if (items && items.length > 0) {
    menuItems.value = items;
    // 显示右键菜单
    nextTick(() => {
      if (contextMenuRef.value) {
        contextMenuRef.value.open(event, row);
      }
    });
  }
};

// 监听数据变化
watch(
  () => props.tableData,
  () => {
    nextTick(() => {
      updateTableSize();
    });
  }
);

watch(
  () => props.userColumn,
  () => {
    nextTick(() => {
      updateTableSize();
    });
  }
);

// 监听config变化，特别是size属性
watch(
  () => props.config.size,
  newSize => {
    nextTick(() => {
      updateSizeBasedStyles(newSize);
      rerenderTable();
    });
  },
  { immediate: true }
);

// 监听toggleIndex变化，用于触发重新渲染
watch(
  () => props.toggleIndex,
  () => {
    nextTick(() => {
      rerenderTable();
    });
  }
);

// 处理滚轮事件（直接在模板中绑定）
const handleWheel = (event) => {
  // 只处理 Shift+滚轮的情况
  if (!event.shiftKey) {
    return;
  }
  
  if (!virtualTable.value) {
    return;
  }
  
  const tableEl = virtualTable.value?.$el;
  if (!tableEl) {
    return;
  }
  
  // el-table-v2 的滚动容器是 .el-scrollbar__wrap
  let targetScrollContainer = tableEl.querySelector('.el-scrollbar__wrap');
  if (!targetScrollContainer) {
    targetScrollContainer = scrollWrapper.value;
  }
  if (!targetScrollContainer) {
    targetScrollContainer = tableEl;
  }
  
  if (targetScrollContainer) {
    // 阻止默认的垂直滚动行为
    event.preventDefault();
    event.stopPropagation();
    
    // 将垂直滚动转换为横向滚动
    const deltaX = event.deltaY !== 0 ? event.deltaY : (event.deltaX || 0);
    targetScrollContainer.scrollLeft += deltaX;
  }
};

// 初始化 Shift+滚轮横向滚动功能
const initShiftWheelScroll = () => {
  if (!virtualTable.value) {
    return;
  }
  
  nextTick(() => {
    const tableEl = virtualTable.value?.$el;
    if (!tableEl) {
      return;
    }
    
    // el-table-v2 的滚动容器是 .el-scrollbar__wrap
    let scrollContainer = tableEl.querySelector('.el-scrollbar__wrap');
    if (!scrollContainer) {
      // 如果找不到，尝试使用scrollWrapper
      scrollContainer = scrollWrapper.value;
    }
    if (!scrollContainer) {
      // 如果还是找不到，使用表格元素本身
      scrollContainer = tableEl;
    }
    if (!scrollContainer) {
      return;
    }
    
    // 创建滚轮事件处理函数
    wheelHandler = (event) => {
      // 检查是否按下了 Shift 键
      if (event.shiftKey) {
        // 阻止默认的垂直滚动行为
        event.preventDefault();
        event.stopPropagation();
        
        // 将垂直滚动转换为横向滚动
        const deltaX = event.deltaY !== 0 ? event.deltaY : (event.deltaX || 0);
        if (scrollContainer) {
          scrollContainer.scrollLeft += deltaX;
        }
      }
    };
    
    // 添加滚轮事件监听器到滚动容器
    // 使用 capture 模式确保事件在捕获阶段被处理
    scrollContainer.addEventListener('wheel', wheelHandler, { passive: false, capture: true });
    
    // 同时监听表格容器和包装器，确保在表格任何位置都能触发
    if (tableEl !== scrollContainer) {
      tableEl.addEventListener('wheel', wheelHandler, { passive: false, capture: true });
    }
    if (scrollWrapper.value && scrollWrapper.value !== scrollContainer && scrollWrapper.value !== tableEl) {
      scrollWrapper.value.addEventListener('wheel', wheelHandler, { passive: false, capture: true });
    }
  });
};

// 销毁 Shift+滚轮横向滚动功能
const destroyShiftWheelScroll = () => {
  if (virtualTable.value && wheelHandler) {
    const tableEl = virtualTable.value?.$el;
    if (tableEl) {
      tableEl.removeEventListener('wheel', wheelHandler, { capture: true });
      const scrollContainer = tableEl.querySelector('.el-scrollbar__wrap');
      if (scrollContainer && scrollContainer !== tableEl) {
        scrollContainer.removeEventListener('wheel', wheelHandler, { capture: true });
      }
    }
  }
  if (scrollWrapper.value && wheelHandler) {
    scrollWrapper.value.removeEventListener('wheel', wheelHandler, { capture: true });
  }
  wheelHandler = null;
};

// 生命周期钩子
onMounted(() => {
  // 初始化表格布局
  nextTick(() => {
    updateTableSize();
    initShiftWheelScroll();
  });

  // 添加窗口大小变化的监听，以便动态调整表格高度
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  // 组件销毁前移除事件监听，避免内存泄漏
  window.removeEventListener("resize", handleResize);
  destroyShiftWheelScroll();
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
  sort,
  rerenderTable
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
    background: var(--stitch-lay-bg-group);
    font-weight: 600;
    color: var(--stitch-lay-text-main);

    .el-table-v2__header-cell.sortable:hover {
      background: var(--stitch-lay-bg-hover);
    }
  }

  :deep(.el-table-v2__row) {
    transition: var(--stitch-lay-transition-fast);

    &:hover {
      background: var(--stitch-lay-bg-hover);
      transform: translateY(-1px);
    }

    &.is-striped {
      background-color: var(--stitch-lay-bg-group);
    }
  }

  // 大号表格样式
  &.size-large {
    :deep(.el-table-v2__header-row) {
      font-size: 16px;
    }

    :deep(.el-table-v2__row) {
      font-size: 15px;
    }
  }

  // 默认表格样式
  &.size-default {
    :deep(.el-table-v2__header-row) {
      font-size: 14px;
    }

    :deep(.el-table-v2__row) {
      font-size: 14px;
    }
  }

  // 小号表格样式
  &.size-small {
    :deep(.el-table-v2__header-row) {
      font-size: 13px;
    }

    :deep(.el-table-v2__row) {
      font-size: 13px;
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
  transition: var(--stitch-lay-transition-fast);
}

.virtual-table-header-cell {
  background: var(--stitch-lay-bg-group);
}

// 基于size的行高样式
.size-large.virtual-table-row {
  height: 60px !important;
}

.size-default.virtual-table-row {
  height: 48px !important;
}

.size-small.virtual-table-row {
  height: 36px !important;
}

// 基于size的表头样式
.size-large.virtual-table-header-cell {
  height: 50px !important;
}

.size-default.virtual-table-header-cell {
  height: 40px !important;
}

.size-small.virtual-table-header-cell {
  height: 32px !important;
}
</style>
