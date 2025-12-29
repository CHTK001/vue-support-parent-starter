/**
 * ScTable 拖拽排序 Composable
 * 处理表格行拖拽排序、列拖拽排序等
 */
import { ref, onUnmounted, nextTick } from 'vue';
import Sortable from 'sortablejs';

export interface UseTableDragSortOptions {
  /** 是否启用行拖拽 */
  rowDraggable?: boolean;
  /** 是否启用列拖拽 */
  columnDraggable?: boolean;
  /** 拖拽手柄选择器 */
  handleSelector?: string;
  /** 拖拽动画时长 */
  animationDuration?: number;
  /** 行拖拽完成回调 */
  onRowDragEnd?: (oldIndex: number, newIndex: number, data: any[]) => void;
  /** 列拖拽完成回调 */
  onColumnDragEnd?: (oldIndex: number, newIndex: number, columns: any[]) => void;
}

export function useTableDragSort(options: UseTableDragSortOptions = {}) {
  const {
    rowDraggable = false,
    columnDraggable = false,
    handleSelector = '.drag-handle',
    animationDuration = 150,
    onRowDragEnd,
    onColumnDragEnd,
  } = options;
  
  // Sortable 实例
  const rowSortable = ref<Sortable | null>(null);
  const columnSortable = ref<Sortable | null>(null);
  
  // 拖拽状态
  const isDragging = ref(false);
  const dragType = ref<'row' | 'column' | null>(null);
  
  /**
   * 初始化行拖拽
   */
  const initRowDrag = (
    tableEl: HTMLElement | null,
    data: any[],
    callback?: (oldIndex: number, newIndex: number, data: any[]) => void
  ) => {
    if (!rowDraggable || !tableEl) return;
    
    destroyRowDrag();
    
    nextTick(() => {
      const tbody = tableEl.querySelector('.el-table__body-wrapper tbody');
      if (!tbody) return;
      
      rowSortable.value = Sortable.create(tbody as HTMLElement, {
        animation: animationDuration,
        handle: handleSelector,
        ghostClass: 'sc-table-drag-ghost',
        chosenClass: 'sc-table-drag-chosen',
        dragClass: 'sc-table-drag-active',
        onStart: () => {
          isDragging.value = true;
          dragType.value = 'row';
        },
        onEnd: (evt) => {
          isDragging.value = false;
          dragType.value = null;
          
          const { oldIndex, newIndex } = evt;
          if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;
          
          // 更新数据顺序
          const movedItem = data.splice(oldIndex, 1)[0];
          data.splice(newIndex, 0, movedItem);
          
          // 触发回调
          if (callback) {
            callback(oldIndex, newIndex, [...data]);
          }
          if (onRowDragEnd) {
            onRowDragEnd(oldIndex, newIndex, [...data]);
          }
        },
      });
    });
  };
  
  /**
   * 初始化列拖拽
   */
  const initColumnDrag = (
    tableEl: HTMLElement | null,
    columns: any[],
    callback?: (oldIndex: number, newIndex: number, columns: any[]) => void
  ) => {
    if (!columnDraggable || !tableEl) return;
    
    destroyColumnDrag();
    
    nextTick(() => {
      const headerRow = tableEl.querySelector('.el-table__header-wrapper tr');
      if (!headerRow) return;
      
      columnSortable.value = Sortable.create(headerRow as HTMLElement, {
        animation: animationDuration,
        ghostClass: 'sc-table-column-ghost',
        chosenClass: 'sc-table-column-chosen',
        filter: '.el-table__expand-column, .el-table__selection-column',
        onStart: () => {
          isDragging.value = true;
          dragType.value = 'column';
        },
        onEnd: (evt) => {
          isDragging.value = false;
          dragType.value = null;
          
          const { oldIndex, newIndex } = evt;
          if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;
          
          // 更新列顺序
          const movedColumn = columns.splice(oldIndex, 1)[0];
          columns.splice(newIndex, 0, movedColumn);
          
          // 触发回调
          if (callback) {
            callback(oldIndex, newIndex, [...columns]);
          }
          if (onColumnDragEnd) {
            onColumnDragEnd(oldIndex, newIndex, [...columns]);
          }
        },
      });
    });
  };
  
  /**
   * 销毁行拖拽
   */
  const destroyRowDrag = () => {
    if (rowSortable.value) {
      rowSortable.value.destroy();
      rowSortable.value = null;
    }
  };
  
  /**
   * 销毁列拖拽
   */
  const destroyColumnDrag = () => {
    if (columnSortable.value) {
      columnSortable.value.destroy();
      columnSortable.value = null;
    }
  };
  
  /**
   * 销毁所有拖拽
   */
  const destroyAll = () => {
    destroyRowDrag();
    destroyColumnDrag();
    isDragging.value = false;
    dragType.value = null;
  };
  
  /**
   * 手动触发拖拽重新初始化
   */
  const refresh = (
    tableEl: HTMLElement | null,
    data: any[],
    columns: any[],
    callbacks?: {
      onRowDrag?: (oldIndex: number, newIndex: number, data: any[]) => void;
      onColumnDrag?: (oldIndex: number, newIndex: number, columns: any[]) => void;
    }
  ) => {
    if (rowDraggable) {
      initRowDrag(tableEl, data, callbacks?.onRowDrag);
    }
    if (columnDraggable) {
      initColumnDrag(tableEl, columns, callbacks?.onColumnDrag);
    }
  };
  
  // 组件卸载时清理
  onUnmounted(() => {
    destroyAll();
  });
  
  return {
    // 状态
    isDragging,
    dragType,
    // 方法
    initRowDrag,
    initColumnDrag,
    destroyRowDrag,
    destroyColumnDrag,
    destroyAll,
    refresh,
  };
}
