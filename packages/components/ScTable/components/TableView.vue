<template>
  <div ref="tableContainer" class="table-container" :style="containerStyle">
    <div ref="scrollWrapper" class="scroll-wrapper" :style="scrollWrapperStyle">
      <el-table
        v-bind="$attrs"
        :key="toggleIndex"
        ref="scTable"
        class="modern-table max-w-full headerSticky"
        :class="{ 'is-draggable': draggable, 'cross-highlight-enabled': config.crossHighlight }"
        :data="tableData"
        :row-key="rowKey"
        :size="config.size"
        :border="config.border"
        :stripe="config.stripe"
        :height="tableHeight"
        :max-height="undefined"
        :summary-method="remoteSummary ? remoteSummaryMethod : summaryMethod"
        :highlight-current-row="config.crossHighlight"
        @row-click="onRowClick"
        @selection-change="selectionChange"
        @sort-change="sortChange"
        @filter-change="filterChange"
        @row-contextmenu="handleRowContextMenu"
        @cell-click="handleCellClick"
      >
        <!-- 拖拽手柄列 -->
        <el-table-column v-if="draggable" :width="dragHandleWidth" align="center" fixed="left">
          <template #header>
            <IconifyIconOnline icon="ep:sort" />
          </template>
          <template #default>
            <div class="drag-handle">
              <IconifyIconOnline icon="ep:rank" />
            </div>
          </template>
        </el-table-column>

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
            <template #header="{ column }">
              <span style="cursor: pointer" @click="onColClick(column, $event)">
                {{ item.label }}
              </span>
            </template>
            <template #default="scope">
              <slot :name="item.prop" v-bind="scope" :row="scope.row">
                {{ item.formatter ? item.formatter(scope.row) : scope.row[item.prop] || item.defaultValue || "-" }}
              </slot>
            </template>
          </el-table-column>
        </template>
        <slot />
        <template #empty>
          <slot name="empty">
            <el-empty :description="emptyText" :image-size="100" />
          </slot>
        </template>
      </el-table>
    </div>
    <!-- 引入右键菜单组件 -->
    <ContextMenu ref="contextMenuRef" :menu-items="menuItems" :row-data="currentRowData" :class-name="config.contextmenuClass" @menu-action="handleMenuAction" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import Sortable from "sortablejs";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import ContextMenu from "../plugins/ContextMenu.vue";

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
      size: "default"
    })
  },
  paginationType: {
    type: String,
    default: "default"
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
  },
  // 拖拽排序相关属性
  draggable: {
    type: Boolean,
    default: false
  },
  dragRowKey: {
    type: String,
    default: "id"
  },
  dragHandleWidth: {
    type: Number,
    default: 50
  }
});

// 十字标记相关状态
const highlightRowIndex = ref(-1);
const highlightColIndex = ref(-1);

// 定义emits
const emit = defineEmits(["row-click", "selection-change", "sort-change", "filter-change", "col-click", "drag-sort-change", "cell-click"]);

// 拖拽排序实例
let sortableInstance = null;

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
const handleMenuAction = action => {
  // 如果需要，可以在这里处理菜单动作
  console.log("菜单动作:", action);
};

// refs
const tableContainer = ref(null);
const scrollWrapper = ref(null);
const scTable = ref(null);

// 计算容器样式
const containerStyle = computed(() => {
  return {
    position: "relative",
    width: "100%",
    height: "100%", // 设置高度为100%以适应父容器
    overflow: "hidden" // 防止内容溢出
  };
});

// 计算滚动容器样式
const scrollWrapperStyle = computed(() => {
  return {
    width: "100%",
    height: "100%", // 设置高度为100%以适应父容器
    maxWidth: "100%",
    maxHeight: "100%", // 限制最大高度
    overflow: "auto" // 允许内容溢出时滚动
  };
});

// 计算表格高度，处理各种高度值
const tableHeight = computed(() => {
  // 如果 height 为 'auto'，返回 '100%' 让表格撑满父容器
  if (props.height === "auto") {
    return "100%";
  }
  
  // 如果 height 未定义、为 null、为 undefined，返回 undefined 让表格自适应内容高度
  if (!props.height || props.height === "null") {
    return undefined;
  }
  
  // 如果是数字，添加 px 单位
  if (typeof props.height === "number") {
    return `${props.height}px`;
  }
  
  // 如果是字符串（如 "500px"、"100%" 等），直接返回
  return props.height;
});

// 方法
const handleResize = () => {
  nextTick(() => {
    doLayout();
  });
};

// 处理表头和表体滚动同步
const handleHeaderScroll = e => {
  if (!scTable.value) return;

  const tableEl = scTable.value.$el;
  const headerWrapper = tableEl.querySelector(".el-table__header-wrapper");
  const bodyWrapper = tableEl.querySelector(".el-table__body-wrapper");

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
      const headerWrapper = tableEl.querySelector(".el-table__header-wrapper");
      const bodyWrapper = tableEl.querySelector(".el-table__body-wrapper");

      if (headerWrapper) {
        // 设置表头固定样式
        headerWrapper.style.position = "sticky";
        headerWrapper.style.top = `${props.stickyTop}px`;
        headerWrapper.style.zIndex = "10";
        headerWrapper.style.width = "100%";

        // 增加阴影效果以增强视觉区分
        headerWrapper.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.05)";

        // 确保表头内容背景色不透明
        const headers = headerWrapper.querySelectorAll("th");
        headers.forEach(header => {
          header.style.backgroundColor = "var(--el-bg-color, #ffffff)";
        });

        // 添加滚动事件监听
        if (headerWrapper && bodyWrapper) {
          headerWrapper.removeEventListener("scroll", handleHeaderScroll);
          bodyWrapper.removeEventListener("scroll", handleHeaderScroll);

          headerWrapper.addEventListener("scroll", handleHeaderScroll);
          bodyWrapper.addEventListener("scroll", handleHeaderScroll);
        }
      }

      // 处理固定列的表头
      const fixedHeaderWrappers = tableEl.querySelectorAll(".el-table__fixed-header-wrapper");
      fixedHeaderWrappers.forEach(wrapper => {
        wrapper.style.position = "sticky";
        wrapper.style.top = `${props.stickyTop}px`;
        wrapper.style.zIndex = "11";
      });
    }
  });
};

// 同步表格宽度
const syncTableWidth = () => {
  if (!scTable.value) return;

  const tableEl = scTable.value.$el;
  const headerTable = tableEl.querySelector(".el-table__header");
  const bodyTable = tableEl.querySelector(".el-table__body");
  const headerWrapper = tableEl.querySelector(".el-table__header-wrapper");
  const bodyWrapper = tableEl.querySelector(".el-table__body-wrapper");

  if (headerTable && bodyTable && headerWrapper && bodyWrapper) {
    // 获取容器宽度
    const containerWidth = tableEl.offsetWidth;
    const headerTableWidth = headerTable.scrollWidth;
    const bodyTableWidth = bodyTable.scrollWidth;
    
    // 只有当内容宽度超出容器宽度时才设置固定宽度
    const maxTableWidth = Math.max(headerTableWidth, bodyTableWidth);
    
    if (maxTableWidth > containerWidth) {
      // 内容超出，需要横向滚动
      headerTable.style.width = `${maxTableWidth}px`;
      bodyTable.style.width = `${maxTableWidth}px`;
    } else {
      // 内容未超出，使用100%自适应
      headerTable.style.width = "100%";
      bodyTable.style.width = "100%";
      // 确保滚动条隐藏
      headerWrapper.style.overflowX = "hidden";
      bodyWrapper.style.overflowX = "hidden";
    }
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

const setCurrentRow = row => {
  scTable.value.setCurrentRow(row);
};

const clearSort = () => {
  scTable.value.clearSort();
};

const clearFilter = columnKey => {
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

const onColClick = (column, event) => {
  emit("col-click", column, event);
};

// 处理单元格点击，实现十字标记
const handleCellClick = (row, column, cell, event) => {
  if (!props.config.crossHighlight) return;

  // 获取行索引
  const rowIndex = props.tableData.indexOf(row);
  // 获取列索引
  const colIndex = props.userColumn.findIndex(col => col.prop === column.property);

  highlightRowIndex.value = rowIndex;
  highlightColIndex.value = colIndex;

  // 移除之前的高亮
  const tableEl = scTable.value?.$el;
  if (tableEl) {
    tableEl.querySelectorAll(".cross-highlight-row, .cross-highlight-col").forEach(el => {
      el.classList.remove("cross-highlight-row", "cross-highlight-col");
    });

    // 添加行高亮
    const rows = tableEl.querySelectorAll(".el-table__body tr");
    if (rows[rowIndex]) {
      rows[rowIndex].classList.add("cross-highlight-row");
    }

    // 添加列高亮
    const allRows = tableEl.querySelectorAll(".el-table__body tr");
    allRows.forEach(tr => {
      const cells = tr.querySelectorAll("td");
      // 计算实际列索引（考虑拖拽手柄列和选择列）
      let actualColIndex = colIndex;
      if (props.draggable) actualColIndex += 1;

      if (cells[actualColIndex]) {
        cells[actualColIndex].classList.add("cross-highlight-col");
      }
    });
  }

  emit("cell-click", row, column, cell, event);
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
    const values = props.summary?.[column.property];
    if (values) {
      sums[index] = values;
    } else {
      sums[index] = "";
    }
  });
  return sums;
};

// 监听数据变化
watch(
  () => props.tableData,
  () => {
    nextTick(() => {
      doLayout();
    });
  }
);

watch(
  () => props.userColumn,
  () => {
    nextTick(() => {
      doLayout();
    });
  }
);

// 确保在每次 toggleIndex 变化时重新应用设置
watch(
  () => props.toggleIndex,
  () => {
    nextTick(() => {
      doLayout();
    });
  }
);

// 监听配置变更以重新应用表格布局
watch(
  () => props.config,
  () => {
    nextTick(() => {
      doLayout();
    });
  },
  { deep: true }
);

// 监听拖拽属性变化
watch(
  () => props.draggable,
  newVal => {
    nextTick(() => {
      if (newVal) {
        initSortable();
      } else if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
      }
    });
  }
);

// 监听数据变化重新初始化拖拽
watch(
  () => props.tableData,
  () => {
    if (props.draggable) {
      nextTick(() => {
        initSortable();
      });
    }
  }
);

// 监听列位置交换配置变化
watch(
  () => props.config.columnDraggable,
  newVal => {
    nextTick(() => {
      if (newVal) {
        initHeaderSortable();
      } else if (headerSortableInstance) {
        headerSortableInstance.destroy();
        headerSortableInstance = null;
      }
    });
  }
);

// 监听十字标记配置变化
watch(
  () => props.config.crossHighlight,
  newVal => {
    if (!newVal) {
      // 清除十字标记
      highlightRowIndex.value = -1;
      highlightColIndex.value = -1;
      const tableEl = scTable.value?.$el;
      if (tableEl) {
        tableEl.querySelectorAll(".cross-highlight-row, .cross-highlight-col").forEach(el => {
          el.classList.remove("cross-highlight-row", "cross-highlight-col");
        });
      }
    }
  }
);

/**
 * 初始化拖拽排序
 */
const initSortable = () => {
  if (!props.draggable || !scTable.value) return;

  // 销毁旧实例
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }

  const tableEl = scTable.value.$el;
  const tbody = tableEl.querySelector(".el-table__body-wrapper tbody");

  if (!tbody) return;

  sortableInstance = Sortable.create(tbody, {
    handle: ".drag-handle",
    animation: 150,
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    onEnd: evt => {
      const { oldIndex, newIndex } = evt;
      if (oldIndex === newIndex) return;

      // 创建新的排序数组
      const newOrder = [...props.tableData];
      const movedItem = newOrder.splice(oldIndex, 1)[0];
      newOrder.splice(newIndex, 0, movedItem);

      // 触发排序变化事件
      emit("drag-sort-change", {
        oldIndex,
        newIndex,
        movedItem,
        newOrder
      });
    }
  });
};

// 列位置交换实例
let headerSortableInstance = null;

/**
 * 初始化列位置交换
 */
const initHeaderSortable = () => {
  if (!props.config.columnDraggable || !scTable.value) return;

  // 销毁旧实例
  if (headerSortableInstance) {
    headerSortableInstance.destroy();
    headerSortableInstance = null;
  }

  const tableEl = scTable.value.$el;
  const headerRow = tableEl.querySelector(".el-table__header-wrapper thead tr");

  if (!headerRow) return;

  headerSortableInstance = Sortable.create(headerRow, {
    animation: 150,
    ghostClass: "header-sortable-ghost",
    chosenClass: "header-sortable-chosen",
    filter: ".el-table-fixed-column--left, .el-table-fixed-column--right, .el-table__expand-column",
    onEnd: evt => {
      const { oldIndex, newIndex } = evt;
      if (oldIndex === newIndex) return;

      // 注意：这里只是临时交换视觉位置，不会影响实际数据
      console.log(`列位置交换: ${oldIndex} -> ${newIndex}`);
    }
  });
};

// 生命周期钩子
onMounted(() => {
  // 初始化表格布局
  nextTick(() => {
    doLayout();

    // 监听父元素滚动，保持表头固定
    const parentScrollElement = findScrollParent(tableContainer.value);
    if (parentScrollElement && parentScrollElement !== document) {
      parentScrollElement.addEventListener("scroll", applyHeaderSticky);
    }

    // 初始化拖拽排序
    if (props.draggable) {
      initSortable();
    }

    // 初始化列位置交换
    if (props.config.columnDraggable) {
      initHeaderSortable();
    }
  });

  // 添加窗口大小变化的监听，以便动态调整表格高度
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  // 组件销毁前移除事件监听，避免内存泄漏
  window.removeEventListener("resize", handleResize);

  // 移除滚动监听
  const parentScrollElement = findScrollParent(tableContainer.value);
  if (parentScrollElement && parentScrollElement !== document) {
    parentScrollElement.removeEventListener("scroll", applyHeaderSticky);
  }

  // 移除表头和表体滚动同步监听
  if (scTable.value) {
    const tableEl = scTable.value.$el;
    const headerWrapper = tableEl.querySelector(".el-table__header-wrapper");
    const bodyWrapper = tableEl.querySelector(".el-table__body-wrapper");

    if (headerWrapper && bodyWrapper) {
      headerWrapper.removeEventListener("scroll", handleHeaderScroll);
      bodyWrapper.removeEventListener("scroll", handleHeaderScroll);
    }
  }

  // 销毁拖拽排序实例
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }

  // 销毁列位置交换实例
  if (headerSortableInstance) {
    headerSortableInstance.destroy();
    headerSortableInstance = null;
  }
});

// 查找最近的可滚动父元素
const findScrollParent = element => {
  if (!element) return document;

  let parent = element.parentElement;
  while (parent) {
    const hasScroll = parent.scrollHeight > parent.clientHeight;
    const overflow = window.getComputedStyle(parent).overflow;
    if (hasScroll && (overflow === "auto" || overflow === "scroll")) {
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
      width: 100% !important;
      min-width: 100% !important;
    }

    .el-table__header {
      width: 100% !important;
      min-width: 100% !important;
    }
  }

  /* 防止不必要的横向滚动条 */
  :deep(.el-table__inner-wrapper) {
    width: 100% !important;
  }

  :deep(.el-table__body-wrapper)::-webkit-scrollbar-track,
  :deep(.el-table__header-wrapper)::-webkit-scrollbar-track {
    background: transparent;
  }

  // 拖拽相关样式
  &.is-draggable {
    :deep(.el-table__body) {
      tr {
        cursor: default;
      }
    }
  }
}

// 拖拽手柄样式
.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: var(--el-text-color-secondary);
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  &:active {
    cursor: grabbing;
  }
}

// Sortable 拖拽样式
:deep(.sortable-ghost) {
  opacity: 0.5;
  background: var(--el-color-primary-light-9) !important;
}

:deep(.sortable-chosen) {
  background: var(--el-color-primary-light-8) !important;
}

:deep(.sortable-drag) {
  opacity: 1;
  background: var(--el-bg-color) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

// 列位置交换样式
:deep(.header-sortable-ghost) {
  opacity: 0.5;
  background: var(--el-color-primary-light-9) !important;
}

:deep(.header-sortable-chosen) {
  background: var(--el-color-primary-light-8) !important;
  cursor: grabbing !important;
}

// 十字标记样式
.cross-highlight-enabled {
  :deep(.cross-highlight-row) {
    background: rgba(var(--el-color-primary-rgb), 0.08) !important;

    td {
      background: rgba(var(--el-color-primary-rgb), 0.08) !important;
    }
  }

  :deep(.cross-highlight-col) {
    background: rgba(var(--el-color-primary-rgb), 0.08) !important;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-left: 2px solid var(--el-color-primary-light-5);
      border-right: 2px solid var(--el-color-primary-light-5);
      pointer-events: none;
    }
  }

  :deep(.cross-highlight-row .cross-highlight-col) {
    background: rgba(var(--el-color-primary-rgb), 0.15) !important;
    box-shadow: inset 0 0 0 2px var(--el-color-primary-light-3);
  }

  :deep(.el-table__body) {
    tr {
      cursor: pointer;
    }
  }
}
</style>
