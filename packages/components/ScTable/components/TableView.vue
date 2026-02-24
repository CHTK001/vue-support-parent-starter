<template>
  <div class="table-container" :class="[`theme--${theme}`, { 'cross-highlight-enabled': config.crossHighlight && config.border, 'is-draggable': draggable }]" :style="crossHighlightCssVars" @contextmenu.prevent="handleTableContextMenu" @wheel="handleWheel">
    <VueDragScroll
      v-if="dragScrollEnabled"
      class="drag-scroll-wrapper"
      :drag-direction="'horizontal'"
      :drag-disabled="false"
    >
      <el-table
        ref="scTable"
        v-bind="$attrs"
        :data="tableData"
        :row-key="rowKey"
        :border="config.border"
        :stripe="config.stripe"
        :size="config.size"
        :height="config.height"
        :row-class-name="getRowClassName"
        :cell-class-name="getCellClassName"
        v-loading="loading"
        style="width: 100%; max-width: 100%"
        @row-click="onRowClick"
        @cell-click="onCellClick"
        @selection-change="onSelectionChange"
        @sort-change="onSortChange"
        @header-dragend="onHeaderDragend"
        @expand-change="onExpandChange"
      >
        <!-- 拖拽手柄列 -->
        <el-table-column
          v-if="draggable"
          :width="dragHandleWidth"
          label=""
          fixed="left"
          class-name="drag-handle-column"
        >
          <template #default>
            <div class="drag-handle">
              <IconifyIconOnline icon="ep:rank" />
            </div>
          </template>
        </el-table-column>
        <template v-for="(col, index) in userColumn" :key="col.prop || index">
          <el-table-column
            v-if="!col.hide"
            v-bind="col"
            :column-key="col.prop"
          >
            <template #default="scope" v-if="col.slot">
              <slot :name="col.slot" v-bind="scope"></slot>
            </template>
            <template #header="scope" v-if="col.headerSlot">
              <slot :name="col.headerSlot" v-bind="scope"></slot>
            </template>
          </el-table-column>
        </template>
        <slot></slot>
      </el-table>
    </VueDragScroll>
    <el-table
      v-else
      ref="scTable"
      v-bind="$attrs"
      :data="tableData"
      :row-key="rowKey"
      :border="config.border"
      :stripe="config.stripe"
      :size="config.size"
      :height="config.height"
      :row-class-name="getRowClassName"
      :cell-class-name="getCellClassName"
      v-loading="loading"
      style="width: 100%; max-width: 100%"
      @row-click="onRowClick"
      @cell-click="onCellClick"
      @selection-change="onSelectionChange"
      @sort-change="onSortChange"
      @header-dragend="onHeaderDragend"
      @expand-change="onExpandChange"
    >
      <!-- 拖拽手柄列 -->
      <el-table-column
        v-if="draggable"
        :width="dragHandleWidth"
        label=""
        fixed="left"
        class-name="drag-handle-column"
      >
        <template #default>
          <div class="drag-handle">
            <IconifyIconOnline icon="ep:rank" />
          </div>
        </template>
      </el-table-column>
      <template v-for="(col, index) in userColumn" :key="col.prop || index">
        <el-table-column
          v-if="!col.hide"
          v-bind="col"
          :column-key="col.prop"
        >
          <template #default="scope" v-if="col.slot">
            <slot :name="col.slot" v-bind="scope"></slot>
          </template>
          <template #header="scope" v-if="col.headerSlot">
            <slot :name="col.headerSlot" v-bind="scope"></slot>
          </template>
        </el-table-column>
      </template>
      <slot></slot>
    </el-table>
    <!-- 右键菜单组件 -->
    <ContextMenu ref="contextMenuRef" :menu-items="menuItems" :row-data="currentRowData" :class-name="config.contextmenuClass" @menu-action="handleMenuAction" />
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount, computed, defineComponent, h } from 'vue';
import Sortable from 'sortablejs';
import { IconifyIconOnline } from '@repo/components';
import { getLogger } from '@repo/utils';
import ContextMenu from '../plugins/ContextMenu.vue';
import { useTableCrossHighlight } from '../composables/useTableCrossHighlight';

const logger = getLogger("[ScTable][TableView]");

// 创建一个简单的拖拽滚动包装组件
// 如果 vue-drag-scroll 包已安装，可以替换为实际导入
const VueDragScroll = defineComponent({
  name: 'VueDragScroll',
  props: {
    dragDirection: { type: String, default: 'horizontal' },
    dragDisabled: { type: Boolean, default: false }
  },
  setup(props, { slots }) {
    const containerRef = ref(null);
    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    const handleMouseDown = (e) => {
      if (props.dragDisabled || e.button !== 0) return;
      const target = e.target;
      if (target.closest('button, a, input, select, textarea, .el-checkbox, .el-radio')) return;
      
      const scrollContainer = containerRef.value?.querySelector('.el-table__body-wrapper');
      if (!scrollContainer || scrollContainer.scrollWidth <= scrollContainer.clientWidth) return;

      isDragging = true;
      startX = e.pageX;
      startScrollLeft = scrollContainer.scrollLeft;
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const scrollContainer = containerRef.value?.querySelector('.el-table__body-wrapper');
      if (!scrollContainer) return;
      
      const deltaX = e.pageX - startX;
      scrollContainer.scrollLeft = startScrollLeft - deltaX;
    };

    const handleMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    onMounted(() => {
      if (containerRef.value) {
        containerRef.value.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    });

    onBeforeUnmount(() => {
      if (containerRef.value) {
        containerRef.value.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    });

    return () => h('div', { 
      ref: containerRef,
      class: 'vue-drag-scroll-wrapper',
      style: { cursor: props.dragDisabled ? 'default' : 'grab' }
    }, slots.default?.());
  }
});

const props = defineProps({
  tableData: { type: Array, default: () => [] },
  userColumn: { type: Array, default: () => [] },
  config: { type: Object, default: () => ({}) },
  theme: { type: String, default: '' },
  rowKey: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  draggable: { type: Boolean, default: false },
  dragRowKey: { type: String, default: 'id' },
  dragHandleWidth: { type: Number, default: 50 },
  contextmenu: { type: Function, default: null },
  dragScrollEnabled: { type: Boolean, default: false }
});

const emit = defineEmits([
  'row-click', 
  'selection-change', 
  'sort-change', 
  'header-dragend', 
  'expand-change',
  'drag-sort-change'
]);

const scTable = ref(null);
const sortableInstance = ref(null);
const isDragging = ref(false);
let scrollContainer = null;
let wheelHandler = null;

// 右键菜单相关
const contextMenuRef = ref(null);
const menuItems = ref([]);
const currentRowData = ref({});

// 十字高亮功能
const crossHighlight = useTableCrossHighlight({
  enabled: computed(() => props.config.crossHighlight && props.config.border),
  highlightColor: 'var(--stitch-lay-bg-hover)',
  intersectionColor: 'var(--stitch-lay-primary-alpha)',
  borderColor: 'var(--stitch-lay-primary)',
  showBorder: true
});

// 监听crossHighlight启用状态
watch(() => props.config.crossHighlight && props.config.border, (enabled) => {
  crossHighlight.toggleEnabled(enabled);
});

// 获取十字高亮的CSS变量
const crossHighlightCssVars = computed(() => {
  if (!props.config.crossHighlight || !props.config.border) {
    return {};
  }
  return crossHighlight.cssVars.value;
});

const onRowClick = (row, column, event) => {
  emit('row-click', row, column, event);
};

// 获取行类名（用于十字高亮）
const getRowClassName = ({ row, rowIndex }) => {
  if (!props.config.crossHighlight || !props.config.border) {
    return '';
  }
  return crossHighlight.getRowClass(rowIndex);
};

// 获取单元格类名（用于十字高亮）
const getCellClassName = ({ row, rowIndex, column, columnIndex }) => {
  if (!props.config.crossHighlight || !props.config.border) {
    return '';
  }
  
  // 拖拽列不参与十字高亮
  if (props.draggable && columnIndex === 0) {
    return '';
  }
  
  // 计算实际的列索引（考虑拖拽列）
  // 如果 columnIndex 是通过 userColumn 的索引，需要减去拖拽列
  // 但 Element Plus 传递的 columnIndex 是包含拖拽列的，所以需要减去1
  let actualColIndex = columnIndex;
  if (props.draggable) {
    actualColIndex = columnIndex - 1;
  }
  
  // 确保索引有效
  if (actualColIndex < 0) {
    return '';
  }
  
  return crossHighlight.getCellClass(rowIndex, actualColIndex);
};

// 处理单元格点击事件
const onCellClick = (row, column, cell, event) => {
  if (!props.config.crossHighlight || !props.config.border) {
    return;
  }
  
  // 获取行索引
  const rowIndex = props.tableData.findIndex(item => {
    if (props.rowKey) {
      return item[props.rowKey] === row[props.rowKey];
    }
    return item === row;
  });
  
  if (rowIndex < 0) return;
  
  // 获取列索引（优先通过 userColumn 查找，这样索引不包含拖拽列）
  let colIndex = -1;
  if (column.property) {
    const userColIndex = props.userColumn.findIndex(col => col.prop === column.property);
    if (userColIndex !== -1) {
      colIndex = userColIndex; // 不包含拖拽列，与 getCellClassName 中的逻辑一致
    }
  }
  
  // 如果通过 userColumn 找不到，尝试通过 DOM 查找（需要考虑拖拽列）
  if (colIndex === -1) {
    const tableEl = scTable.value?.$el;
    if (tableEl) {
      const headerCells = tableEl.querySelectorAll('.el-table__header-wrapper thead th');
      for (let i = 0; i < headerCells.length; i++) {
        const cellEl = headerCells[i];
        const columnKey = cellEl.getAttribute('column-key') || cellEl.getAttribute('data-column-key');
        if (columnKey === column.property || columnKey === column.columnKey) {
          // 如果有拖拽列，需要减去拖拽列的索引（通常是0）
          colIndex = props.draggable ? Math.max(0, i - 1) : i;
          break;
        }
      }
    }
  }
  
  if (rowIndex >= 0 && colIndex >= 0) {
    crossHighlight.handleCellClick(rowIndex, colIndex, column.property);
  }
};

const onSelectionChange = (selection) => {
  emit('selection-change', selection);
};

const onSortChange = (data) => {
  emit('sort-change', data);
};

const onHeaderDragend = (newWidth, oldWidth, column, event) => {
  emit('header-dragend', newWidth, oldWidth, column, event);
};

const onExpandChange = (row, expandedRows) => {
  emit('expand-change', row, expandedRows);
};

// 初始化拖拽排序
const initDragSort = () => {
  if (!props.draggable || !scTable.value) return;
  
  destroyDragSort();
  
  nextTick(() => {
    const tableEl = scTable.value?.$el;
    if (!tableEl) return;
    
    const tbody = tableEl.querySelector('.el-table__body-wrapper tbody');
    if (!tbody) return;
    
    sortableInstance.value = Sortable.create(tbody, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      filter: '.el-table__expand-column, .el-table__selection-column',
      onStart: () => {
        isDragging.value = true;
      },
      onEnd: (evt) => {
        isDragging.value = false;
        const { oldIndex, newIndex } = evt;
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;
        
        // 创建新数组以避免直接修改原数组
        const newOrder = [...props.tableData];
        const movedItem = newOrder.splice(oldIndex, 1)[0];
        newOrder.splice(newIndex, 0, movedItem);
        
        // 触发拖拽排序变化事件
        emit('drag-sort-change', {
          oldIndex,
          newIndex,
          newOrder,
          movedItem
        });
      }
    });
  });
};

// 销毁拖拽排序
const destroyDragSort = () => {
  if (sortableInstance.value) {
    sortableInstance.value.destroy();
    sortableInstance.value = null;
  }
};

// 监听 draggable 变化
watch(
  () => props.draggable,
  (newVal) => {
    if (newVal) {
      // 当启用拖拽时，先强制表格重新布局，确保拖拽列渲染完成
      if (scTable.value?.doLayout) {
        scTable.value.doLayout();
      }
      nextTick(() => {
        initDragSort();
      });
    } else {
      destroyDragSort();
    }
  },
  { immediate: true }
);

// 监听表格数据变化，重新初始化拖拽排序（因为 DOM 可能被重新渲染）
// 但在拖拽过程中不重新初始化，避免冲突
watch(
  () => props.tableData,
  () => {
    if (props.draggable && !isDragging.value) {
      nextTick(() => {
        initDragSort();
      });
    }
  },
  { deep: false }
);

// 处理滚轮事件（直接在模板中绑定）
const handleWheel = (event) => {
  // 只处理 Shift+滚轮的情况
  if (!event.shiftKey) {
    return;
  }
  
  // 查找表格的滚动容器
  if (!scTable.value) {
    return;
  }
  
  const tableEl = scTable.value?.$el;
  if (!tableEl) {
    return;
  }
  
  // 优先查找 el-table__body-wrapper，这是 el-table 的主要滚动容器
  let targetScrollContainer = tableEl.querySelector('.el-table__body-wrapper');
  if (!targetScrollContainer) {
    // 如果找不到，尝试查找 el-scrollbar__wrap
    targetScrollContainer = tableEl.querySelector('.el-scrollbar__wrap');
  }
  if (!targetScrollContainer) {
    // 最后尝试使用表格元素本身
    targetScrollContainer = tableEl;
  }
  
  if (targetScrollContainer) {
    // 阻止默认的垂直滚动行为
    event.preventDefault();
    event.stopPropagation();
    
    // 将垂直滚动转换为横向滚动
    // deltaY 是垂直滚动量，deltaX 是横向滚动量
    const deltaX = event.deltaY !== 0 ? event.deltaY : (event.deltaX || 0);
    
    // 执行横向滚动
    targetScrollContainer.scrollLeft += deltaX;
  }
};

// 初始化 Shift+滚轮横向滚动功能
const initShiftWheelScroll = () => {
  if (!scTable.value) {
    return;
  }
  
  nextTick(() => {
    const tableEl = scTable.value?.$el;
    if (!tableEl) {
      return;
    }
    
    // 查找表格的滚动容器
    scrollContainer = tableEl.querySelector('.el-table__body-wrapper');
    if (!scrollContainer) {
      scrollContainer = tableEl.querySelector('.el-scrollbar__wrap');
    }
    if (!scrollContainer) {
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
    
    // 同时监听表格容器，确保在表格任何位置都能触发
    if (tableEl !== scrollContainer) {
      tableEl.addEventListener('wheel', wheelHandler, { passive: false, capture: true });
    }
  });
};

// 销毁 Shift+滚轮横向滚动功能
const destroyShiftWheelScroll = () => {
  if (scTable.value && wheelHandler) {
    const tableEl = scTable.value?.$el;
    if (tableEl) {
      tableEl.removeEventListener('wheel', wheelHandler, { capture: true });
    }
  }
  if (scrollContainer && wheelHandler) {
    scrollContainer.removeEventListener('wheel', wheelHandler, { capture: true });
    scrollContainer = null;
  }
  wheelHandler = null;
};

// 监听表格高度变化，重新初始化滚动功能（因为 DOM 可能被重新渲染）
watch(
  () => props.config.height,
  () => {
    destroyShiftWheelScroll();
    nextTick(() => {
      initShiftWheelScroll();
    });
  }
);

onMounted(() => {
  if (props.draggable) {
    initDragSort();
  }
  initShiftWheelScroll();
});

// 处理表格右键菜单
const handleTableContextMenu = (event) => {
  if (!props.contextmenu || !scTable.value) return;
  
  const tableEl = scTable.value.$el;
  if (!tableEl) return;
  
  // 查找点击的行
  const target = event.target;
  let rowElement = target.closest('.el-table__row');
  
  if (!rowElement) {
    // 如果点击的不是行，不处理
    return;
  }
  
  // 获取行索引
  const rows = tableEl.querySelectorAll('.el-table__body tbody tr');
  const rowIndex = Array.from(rows).indexOf(rowElement);
  
  if (rowIndex === -1 || rowIndex >= props.tableData.length) {
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
      contextMenuRef.value?.open(event, row);
    });
  }
};

// 处理菜单动作
const handleMenuAction = (action) => {
  // 如果需要，可以在这里处理菜单动作
  logger.info('菜单动作: {}', action);
};

onBeforeUnmount(() => {
  destroyDragSort();
  destroyShiftWheelScroll();
});

// Expose el-table methods
const clearSelection = () => scTable.value?.clearSelection();
const toggleRowSelection = (row, selected) => scTable.value?.toggleRowSelection(row, selected);
const toggleAllSelection = () => scTable.value?.toggleAllSelection();
const toggleRowExpansion = (row, expanded) => scTable.value?.toggleRowExpansion(row, expanded);
const setCurrentRow = (row) => scTable.value?.setCurrentRow(row);
const clearSort = () => scTable.value?.clearSort();
const clearFilter = (columnKeys) => scTable.value?.clearFilter(columnKeys);
const doLayout = () => scTable.value?.doLayout();
const sort = (prop, order) => scTable.value?.sort(prop, order);
const scrollTo = (options) => scTable.value?.scrollTo(options);
const setScrollTop = (top) => scTable.value?.setScrollTop(top);
const setScrollLeft = (left) => scTable.value?.setScrollLeft(left);

defineExpose({
  scTable,
  clearSelection,
  toggleRowSelection,
  toggleAllSelection,
  toggleRowExpansion,
  setCurrentRow,
  clearSort,
  clearFilter,
  doLayout,
  sort,
  scrollTo,
  setScrollTop,
  setScrollLeft
});
</script>

<style lang="scss" scoped>
.table-container {
  width: 100%;
  max-width: 100%; /* 限制容器最大宽度 */
  background-color: var(--stitch-lay-bg-panel);
  transition: var(--stitch-lay-transition);
  box-sizing: border-box; /* 确保宽度计算包含边框和内边距 */
  overflow-x: auto; /* 允许横向滚动 */
  
  :deep(.el-table) {
    width: 100% !important;
    max-width: 100% !important; /* 限制表格最大宽度 */
  }

  // 主题变体混合宏
  @mixin theme-variant($type) {
    :deep(.el-table) {
      // 表头样式
      th.el-table__cell {
        background-color: var(--el-color-#{$type}-light-9) !important;
        color: var(--el-color-#{$type});
      }

      // 选中行样式
      .el-table__row--striped {
        td.el-table__cell {
          background-color: var(--el-color-#{$type}-light-9);
        }
      }

      // 悬停样式
      .el-table__body tr:hover > td.el-table__cell {
        background-color: var(--el-color-#{$type}-light-9) !important;
      }

      // 边框颜色
      .el-table__inner-wrapper::before,
      .el-table__border-left-patch {
        background-color: var(--el-color-#{$type}-light-8);
      }

      td.el-table__cell,
      th.el-table__cell {
        border-bottom-color: var(--el-color-#{$type}-light-8);
      }

      &.el-table--border {
        .el-table__cell {
          border-right-color: var(--el-color-#{$type}-light-8);
        }
      }
    }
  }

  &.theme--primary { @include theme-variant('primary'); }
  &.theme--success { @include theme-variant('success'); }
  &.theme--warning { @include theme-variant('warning'); }
  &.theme--danger { @include theme-variant('danger'); }
  &.theme--info { @include theme-variant('info'); }
}

.scroll-wrapper {
  overflow: auto;
  /* 隐藏滚动条但保留功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */

  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
}

.modern-table {
  width: 100%;
  background-color: transparent;

  /* 移除 Element Plus 表格默认边框 */
  :deep(.el-table__inner-wrapper::before) {
    display: none;
  }
}

.drag-handle {
  cursor: grab;
  color: var(--stitch-lay-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: var(--stitch-lay-transition-fast);

  &:hover {
    color: var(--stitch-lay-primary);
    background-color: var(--stitch-lay-bg-hover);
  }

  &:active {
    cursor: grabbing;
  }
}

.is-draggable {
  :deep(.el-table__row) {
    transition: transform 0.2s;
  }
}

/* 拖拽时的样式 */
:deep(.sortable-ghost) {
  opacity: 0.5;
  background: var(--stitch-lay-primary-alpha) !important;
}

:deep(.sortable-chosen) {
  background: var(--stitch-lay-bg-hover) !important;
}

:deep(.sortable-drag) {
  background: var(--stitch-lay-bg-panel) !important;
  box-shadow: var(--stitch-lay-shadow-md);
}

/* 拖拽手柄列样式 */
:deep(.drag-handle-column) {
  .cell {
    padding: 0 !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* 十字高亮样式 */
.cross-highlight-enabled {
  /* 行高亮 */
  :deep(.el-table__body-wrapper) {
    .cross-highlight-row {
      background: var(--cross-highlight-color, var(--stitch-lay-bg-hover)) !important;
      position: relative;
    }

    .cross-highlight-row::before,
    .cross-highlight-row::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      height: var(--cross-border-width, 3px);
      background: var(--cross-border-color, var(--stitch-lay-primary));
      pointer-events: none;
      z-index: 2;
    }

    .cross-highlight-row::before {
      top: 0;
    }

    .cross-highlight-row::after {
      bottom: 0;
    }

    /* 行内单元格 */
    .cross-highlight-row-cell {
      background: var(--cross-highlight-color, var(--stitch-lay-bg-hover)) !important;
    }

    /* 列高亮单元格 */
    .cross-highlight-col-cell {
      background: var(--cross-highlight-color, var(--stitch-lay-bg-hover)) !important;
      position: relative;
    }

    .cross-highlight-col-cell::before,
    .cross-highlight-col-cell::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      width: var(--cross-border-width, 3px);
      background: var(--cross-border-color, var(--stitch-lay-primary));
      pointer-events: none;
      z-index: 1;
    }

    .cross-highlight-col-cell::before {
      left: 0;
    }

    .cross-highlight-col-cell::after {
      right: 0;
    }

    /* 交叉点 */
    .cross-highlight-intersection {
      background: var(--cross-intersection-color, var(--stitch-lay-primary-alpha)) !important;
      box-shadow: inset 0 0 0 var(--cross-border-width, 3px) var(--cross-border-color, var(--stitch-lay-primary));
      position: relative;
      z-index: 3;
    }

    /* 交叉点不需要列的左右边框 */
    .cross-highlight-intersection::before,
    .cross-highlight-intersection::after {
      display: none;
    }
  }
  
  /* 固定列也需要支持十字高亮 */
  :deep(.el-table__fixed),
  :deep(.el-table__fixed-right) {
    .cross-highlight-row {
      background: var(--cross-highlight-color, var(--stitch-lay-bg-hover)) !important;
      position: relative;
    }

    .cross-highlight-row-cell {
      background: var(--cross-highlight-color, var(--stitch-lay-bg-hover)) !important;
    }

    .cross-highlight-col-cell {
      background: var(--cross-highlight-color, var(--stitch-lay-bg-hover)) !important;
      position: relative;
    }

    .cross-highlight-intersection {
      background: var(--cross-intersection-color, var(--stitch-lay-primary-alpha)) !important;
      box-shadow: inset 0 0 0 var(--cross-border-width, 3px) var(--cross-border-color, var(--stitch-lay-primary));
      position: relative;
      z-index: 3;
    }
  }
}

/* 固定列背景色设置 */
:deep(.el-table__fixed),
:deep(.el-table__fixed-right) {
  background-color: var(--stitch-lay-bg-panel) !important;
  
  th.el-table__cell,
  td.el-table__cell {
    background-color: var(--stitch-lay-bg-panel) !important;
  }
  
  /* 固定列表头背景 */
  .el-table__header-wrapper {
    background-color: var(--stitch-lay-bg-panel) !important;
  }
  
  /* 固定列表体背景 */
  .el-table__body-wrapper {
    background-color: var(--stitch-lay-bg-panel) !important;
  }
  
  /* 固定列斑马纹背景 */
  .el-table__row--striped td.el-table__cell {
    background-color: var(--stitch-lay-bg-group) !important;
  }
  
  /* 固定列悬停背景 */
  .el-table__body tr:hover > td.el-table__cell {
    background-color: var(--stitch-lay-bg-hover) !important;
  }
}

/* vue-drag-scroll 包装器样式 */
.vue-drag-scroll-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  
  &:active {
    cursor: grabbing !important;
  }
  
  .el-table {
    width: 100%;
    height: 100%;
  }
}

.drag-scroll-wrapper {
  width: 100%;
  height: 100%;
}
</style>
