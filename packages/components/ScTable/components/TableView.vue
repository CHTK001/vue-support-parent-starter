<template>
  <div class="table-container" :class="[`theme--${theme}`, { 'cross-highlight-enabled': config.crossHighlight }]">
    <el-table
      ref="scTable"
      v-bind="$attrs"
      :data="tableData"
      :row-key="rowKey"
      :border="config.border"
      :stripe="config.stripe"
      :size="config.size"
      :height="config.height"
      v-loading="loading"
      style="width: 100%"
      @row-click="onRowClick"
      @selection-change="onSelectionChange"
      @sort-change="onSortChange"
      @header-dragend="onHeaderDragend"
      @expand-change="onExpandChange"
    >
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
  </div>
</template>

<script setup>
import { ref, defineExpose } from 'vue';

const props = defineProps({
  tableData: { type: Array, default: () => [] },
  userColumn: { type: Array, default: () => [] },
  config: { type: Object, default: () => ({}) },
  theme: { type: String, default: '' },
  rowKey: { type: String, default: '' },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits([
  'row-click', 
  'selection-change', 
  'sort-change', 
  'header-dragend', 
  'expand-change'
]);

const scTable = ref(null);

const onRowClick = (row, column, event) => {
  emit('row-click', row, column, event);
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
  background-color: var(--stitch-lay-bg-panel);
  transition: var(--stitch-lay-transition);

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
.sortable-ghost {
  opacity: 0.5;
  background: var(--stitch-lay-primary-alpha) !important;
}

.sortable-drag {
  background: var(--stitch-lay-bg-panel) !important;
  box-shadow: var(--stitch-lay-shadow-md);
}

/* 十字高亮样式 */
.cross-highlight-enabled {
  :deep(td.cross-highlight-row),
  :deep(td.cross-highlight-col) {
    background-color: var(--stitch-lay-bg-hover) !important;
  }

  :deep(td.cross-highlight-center) {
    background-color: var(--stitch-lay-primary-alpha) !important;
  }
}
</style>
