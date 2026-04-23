<template>
  <div
    ref="tableContainerRef"
    class="table-container"
    :class="[
      `theme--${theme}`,
      resolvedSkin ? `skin--${resolvedSkin}` : '',
      {
        'cross-highlight-enabled': config.crossHighlight && config.border,
        'is-draggable': draggable,
        'has-horizontal-overflow': hasHorizontalOverflow,
      },
    ]"
    :data-skin="resolvedSkin || undefined"
    :style="tableContainerStyle"
    @contextmenu.prevent="handleTableContextMenu"
  >
    <VueDragScroll
      v-if="dragScrollEnabled"
      class="drag-scroll-wrapper"
      :drag-direction="'horizontal'"
      :drag-disabled="false"
    >
      <component
        :is="currentTableComponent"
        ref="scTable"
        v-bind="$attrs"
        v-loading="loading"
        :data="tableData"
        :row-key="rowKey"
        :border="config.border"
        :stripe="config.stripe"
        :size="config.size"
        :height="config.height"
        :row-class-name="getRowClassName"
        :cell-class-name="getCellClassName"
        style="width: 100%; max-width: 100%"
        @row-click="onRowClick"
        @cell-click="onCellClick"
        @cell-dblclick="onCellDblClick"
        @selection-change="onSelectionChange"
        @sort-change="onSortChange"
        @header-dragend="onHeaderDragend"
        @expand-change="onExpandChange"
      >
        <!-- 拖拽手柄列 -->
        <ScTableColumn
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
        </ScTableColumn>
        <template v-for="(col, index) in userColumn" :key="col.prop || index">
          <ScTableColumn v-if="!col.hide" v-bind="col" :column-key="col.prop">
            <template v-if="col.slot" #default="scope">
              <slot :name="col.slot" v-bind="scope" />
            </template>
            <template v-if="col.headerSlot" #header="scope">
              <slot :name="col.headerSlot" v-bind="scope" />
            </template>
            <template v-else-if="columnHeaderMenu" #header="scope">
              <div class="col-header-wrapper">
                <span class="col-header-title">{{ col.label }}</span>
                <small
                  v-if="columnHeaderMenuState.showColumnType && getColMeta(col.prop)?.type"
                  class="col-type"
                >{{ getColMeta(col.prop)?.type }}</small>
                <small
                  v-if="columnHeaderMenuState.showColumnComment && getColMeta(col.prop)?.comment"
                  class="col-comment"
                >{{ getColMeta(col.prop)?.comment }}</small>
              </div>
            </template>
          </ScTableColumn>
        </template>
        <slot />
      </component>
    </VueDragScroll>
    <component
      :is="currentTableComponent"
      v-else
      ref="scTable"
      v-bind="$attrs"
      v-loading="loading"
      :data="tableData"
      :row-key="rowKey"
      :border="config.border"
      :stripe="config.stripe"
      :size="config.size"
      :height="config.height"
      :row-class-name="getRowClassName"
      :cell-class-name="getCellClassName"
      style="width: 100%; max-width: 100%"
      @row-click="onRowClick"
      @cell-click="onCellClick"
      @cell-dblclick="onCellDblClick"
      @selection-change="onSelectionChange"
      @sort-change="onSortChange"
      @header-dragend="onHeaderDragend"
      @expand-change="onExpandChange"
    >
      <!-- 拖拽手柄列 -->
      <ScTableColumn
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
      </ScTableColumn>
      <template v-for="(col, index) in userColumn" :key="col.prop || index">
        <ScTableColumn v-if="!col.hide" v-bind="col" :column-key="col.prop">
          <template v-if="col.slot" #default="scope">
            <slot :name="col.slot" v-bind="scope" />
          </template>
          <template v-if="col.headerSlot" #header="scope">
            <slot :name="col.headerSlot" v-bind="scope" />
          </template>
          <template v-else-if="columnHeaderMenu" #header="scope">
            <div
              class="col-header-wrapper"
            >
              <span class="col-header-title">{{ col.label }}</span>
              <small
                v-if="columnHeaderMenuState.showColumnType && getColMeta(col.prop)?.type"
                class="col-type"
              >{{ getColMeta(col.prop)?.type }}</small>
              <small
                v-if="columnHeaderMenuState.showColumnComment && getColMeta(col.prop)?.comment"
                class="col-comment"
              >{{ getColMeta(col.prop)?.comment }}</small>
            </div>
          </template>
        </ScTableColumn>
      </template>
      <slot />
    </component>
    <!-- 右键菜单组件 -->
    <ContextMenu
      ref="contextMenuRef"
      :menu-items="menuItems"
      :row-data="currentRowData"
      :class-name="config.contextmenuClass"
      @menu-action="handleMenuAction"
    />
    <!-- 列头右键菜单 -->
    <ColumnHeaderMenu
      v-if="columnHeaderMenu"
      :visible="columnHeaderMenuState.visible"
      :position="columnHeaderMenuState.position"
      :column="columnHeaderMenuState.column"
      :column-meta="columnHeaderMenuState.columnMeta"
      :show-column-type="columnHeaderMenuState.showColumnType"
      :show-column-comment="columnHeaderMenuState.showColumnComment"
      :show-data-comment="columnHeaderMenuState.showDataComment"
      :table-id="tableId"
      @close="columnHeaderMenuState.visible = false"
      @sort-asc="handleHeaderSortAsc"
      @sort-desc="handleHeaderSortDesc"
      @fit-width="handleHeaderFitWidth"
      @toggle-type="columnHeaderMenuState.showColumnType = !columnHeaderMenuState.showColumnType; saveHeaderMenuState()"
      @toggle-comment="columnHeaderMenuState.showColumnComment = !columnHeaderMenuState.showColumnComment; saveHeaderMenuState()"
      @toggle-data-comment="columnHeaderMenuState.showDataComment = !columnHeaderMenuState.showDataComment; saveHeaderMenuState()"
      @edit-annotation="handleEditAnnotation"
    />
  </div>
</template>

<script setup>
import {
  ref,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
  computed,
  reactive,
  defineComponent,
  h,
  useAttrs,
} from "vue";
import { ElTable, ElTableColumn } from "element-plus";
import Sortable from "sortablejs";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { getLogger } from "@repo/utils";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import ContextMenu from "../plugins/ContextMenu.vue";
import ColumnHeaderMenu from "../plugins/ColumnHeaderMenu.vue";
import { useTableCrossHighlight } from "../composables/useTableCrossHighlight";
import { ScTableColumn } from "../../ScTableColumn";

const logger = getLogger("[ScTable][TableView]");

// 创建一个简单的拖拽滚动包装组件
// 如果 vue-drag-scroll 包已安装，可以替换为实际导入
const VueDragScroll = defineComponent({
  name: "VueDragScroll",
  props: {
    dragDirection: { type: String, default: "horizontal" },
    dragDisabled: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    const containerRef = ref(null);
    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    const handleMouseDown = (e) => {
      if (props.dragDisabled || e.button !== 0) return;
      const target = e.target;
      if (
        target.closest(
          "button, a, input, select, textarea, .el-checkbox, .el-radio",
        )
      )
        return;

      const scrollContainer = containerRef.value?.querySelector(
        ".el-table__body-wrapper",
      );
      if (
        !scrollContainer ||
        scrollContainer.scrollWidth <= scrollContainer.clientWidth
      )
        return;

      isDragging = true;
      startX = e.pageX;
      startScrollLeft = scrollContainer.scrollLeft;
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";

      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const scrollContainer = containerRef.value?.querySelector(
        ".el-table__body-wrapper",
      );
      if (!scrollContainer) return;

      const deltaX = e.pageX - startX;
      scrollContainer.scrollLeft = startScrollLeft - deltaX;
    };

    const handleMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    onMounted(() => {
      if (containerRef.value) {
        containerRef.value.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      }
    });

    onBeforeUnmount(() => {
      if (containerRef.value) {
        containerRef.value.removeEventListener("mousedown", handleMouseDown);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      }
    });

    return () =>
      h(
        "div",
        {
          ref: containerRef,
          class: "vue-drag-scroll-wrapper",
          style: { cursor: props.dragDisabled ? "default" : "grab" },
        },
        slots.default?.(),
      );
  },
});

const props = defineProps({
  tableData: { type: Array, default: () => [] },
  userColumn: { type: Array, default: () => [] },
  config: { type: Object, default: () => ({}) },
  theme: { type: String, default: "" },
  rowKey: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  draggable: { type: Boolean, default: false },
  dragRowKey: { type: String, default: "id" },
  dragHandleWidth: { type: Number, default: 50 },
  contextmenu: { type: Function, default: null },
  dragScrollEnabled: { type: Boolean, default: false },
  columnHeaderMenu: { type: Boolean, default: false },
  columnMeta: { type: Array, default: () => [] },
  tableId: { type: String, default: "" },
});
const attrs = useAttrs();

const emit = defineEmits([
  "row-click",
  "selection-change",
  "sort-change",
  "header-dragend",
  "expand-change",
  "drag-sort-change",
  "edit-annotation",
  "cell-dblclick",
]);

// ==================== 列头右键菜单 ====================
const columnHeaderMenuState = reactive({
  visible: false,
  position: { x: 0, y: 0 },
  column: null,
  columnMeta: null,
  showColumnType: false,
  showColumnComment: false,
  showDataComment: false,
})

const HEADER_MENU_STORAGE_KEY = computed(
  () => `sc_table_column_header_${props.tableId || 'shared'}`
)

const loadHeaderMenuState = () => {
  try {
    const raw = localStorage.getItem(HEADER_MENU_STORAGE_KEY.value)
    if (raw) {
      const saved = JSON.parse(raw)
      columnHeaderMenuState.showColumnType = !!saved.showColumnType
      columnHeaderMenuState.showColumnComment = !!saved.showColumnComment
      columnHeaderMenuState.showDataComment = !!saved.showDataComment
    }
  } catch (_) { /* ignore */ }
}

const saveHeaderMenuState = () => {
  try {
    localStorage.setItem(HEADER_MENU_STORAGE_KEY.value, JSON.stringify({
      showColumnType: columnHeaderMenuState.showColumnType,
      showColumnComment: columnHeaderMenuState.showColumnComment,
      showDataComment: columnHeaderMenuState.showDataComment,
    }))
  } catch (_) { /* ignore */ }
}

const getColMeta = (prop) => {
  if (!props.columnMeta || !prop) return null
  return props.columnMeta.find(m => m.name === prop) || null
}

const handleHeaderSortAsc = ({ prop }) => {
  emit('sort-change', { prop, order: 'ascending' })
}

const handleHeaderSortDesc = ({ prop }) => {
  emit('sort-change', { prop, order: 'descending' })
}

const handleHeaderFitWidth = ({ prop }) => {
  if (!prop || !scTable.value) return
  const tableEl = scTable.value.$el
  if (!tableEl) return
  // 找到该列所有单元格，取最大内容宽度
  const cells = tableEl.querySelectorAll(`td[class*="el-table__cell"] .cell`)
  let maxWidth = 80
  // 通过列 prop 找到对应列索引
  const colIndex = props.userColumn.findIndex(c => c.prop === prop)
  if (colIndex >= 0) {
    const allRows = tableEl.querySelectorAll('.el-table__body tbody tr')
    allRows.forEach(row => {
      const tds = row.querySelectorAll('td.el-table__cell')
      // 偏移：如果有拖拽列则 +1
      const offset = props.draggable ? 1 : 0
      const td = tds[colIndex + offset]
      if (td) {
        const cell = td.querySelector('.cell')
        if (cell) {
          maxWidth = Math.max(maxWidth, cell.scrollWidth + 16)
        }
      }
    })
  }
  // 更新列宽
  const col = props.userColumn[colIndex]
  if (col) {
    col.width = maxWidth
  }
  nextTick(() => {
    scTable.value?.doLayout()
  })
}

const handleEditAnnotation = ({ prop, currentComment }) => {
  // 只 emit 事件，由业务层处理
  emit('edit-annotation', { prop, currentComment })
}
// ==================== END 列头右键菜单 ====================

const scTable = ref(null);
const tableContainerRef = ref(null);
const sortableInstance = ref(null);
const isDragging = ref(false);
const hasHorizontalOverflow = ref(false);
const tableHeaderOffset = ref(0);
let overflowResizeObserver = null;
let overflowSyncFrame = 0;
let hiddenInteractiveObserver = null;
let hiddenInteractiveSyncFrame = 0;
let isHiddenInteractiveSyncing = false;

const HIDDEN_INTERACTIVE_ATTR = "data-sc-hidden-interactive";
const HIDDEN_INTERACTIVE_ORIGINAL_TABINDEX_ATTR =
  "data-sc-hidden-interactive-original-tabindex";
const HIDDEN_INTERACTIVE_ORIGINAL_ARIA_HIDDEN_ATTR =
  "data-sc-hidden-interactive-original-aria-hidden";
const HIDDEN_INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[role='link']",
  "[tabindex]:not(table):not(tbody):not(tr):not(td):not(th)",
].join(", ");

// 使用主题组件系统
const { currentComponent } = useThemeComponent("ElTable");

// 当前实际渲染的组件
const currentTableComponent = currentComponent;

// 右键菜单相关
const contextMenuRef = ref(null);
const menuItems = ref([]);
const currentRowData = ref({});

// 十字高亮功能
const crossHighlight = useTableCrossHighlight({
  enabled: computed(() => props.config.crossHighlight && props.config.border),
  highlightColor: "var(--stitch-lay-bg-hover)",
  intersectionColor: "var(--stitch-lay-primary-alpha)",
  borderColor: "var(--stitch-lay-primary)",
  showBorder: true,
});

// 监听crossHighlight启用状态
watch(
  () => props.config.crossHighlight && props.config.border,
  (enabled) => {
    crossHighlight.toggleEnabled(enabled);
  },
);

// 获取十字高亮的CSS变量
const crossHighlightCssVars = computed(() => {
  if (!props.config.crossHighlight || !props.config.border) {
    return {};
  }
  return crossHighlight.cssVars.value;
});

const tableContainerStyle = computed(() => ({
  ...crossHighlightCssVars.value,
  "--sc-table-header-offset": `${tableHeaderOffset.value}px`,
}));

const resolvedSkin = computed(() => {
  const attrSkin = attrs["data-skin"];
  if (typeof attrSkin === "string" && attrSkin.trim()) {
    return attrSkin.trim().toLowerCase();
  }
  if (typeof document !== "undefined") {
    const htmlSkin = document.documentElement?.getAttribute("data-skin");
    if (htmlSkin) {
      return htmlSkin.trim().toLowerCase();
    }
    const bodySkin = document.body?.getAttribute("data-skin");
    if (bodySkin) {
      return bodySkin.trim().toLowerCase();
    }
  }
  return "";
});

const onRowClick = (row, column, event) => {
  emit("row-click", row, column, event);
};

// 获取行类名（用于十字高亮）
const getRowClassName = ({ row, rowIndex }) => {
  if (!props.config.crossHighlight || !props.config.border) {
    return "";
  }
  return crossHighlight.getRowClass(rowIndex);
};

// 获取单元格类名（用于十字高亮）
const getCellClassName = ({ row, rowIndex, column, columnIndex }) => {
  if (!props.config.crossHighlight || !props.config.border) {
    return "";
  }

  // 拖拽列不参与十字高亮
  if (props.draggable && columnIndex === 0) {
    return "";
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
    return "";
  }

  return crossHighlight.getCellClass(rowIndex, actualColIndex);
};

// 处理单元格点击事件
const onCellClick = (row, column, cell, event) => {
  if (!props.config.crossHighlight || !props.config.border) {
    return;
  }

  // 获取行索引
  const rowIndex = props.tableData.findIndex((item) => {
    if (props.rowKey) {
      return item[props.rowKey] === row[props.rowKey];
    }
    return item === row;
  });

  if (rowIndex < 0) return;

  // 获取列索引（优先通过 userColumn 查找，这样索引不包含拖拽列）
  let colIndex = -1;
  if (column.property) {
    const userColIndex = props.userColumn.findIndex(
      (col) => col.prop === column.property,
    );
    if (userColIndex !== -1) {
      colIndex = userColIndex; // 不包含拖拽列，与 getCellClassName 中的逻辑一致
    }
  }

  // 如果通过 userColumn 找不到，尝试通过 DOM 查找（需要考虑拖拽列）
  if (colIndex === -1) {
    const tableEl = scTable.value?.$el;
    if (tableEl) {
      const headerCells = tableEl.querySelectorAll(
        ".el-table__header-wrapper thead th",
      );
      for (let i = 0; i < headerCells.length; i++) {
        const cellEl = headerCells[i];
        const columnKey =
          cellEl.getAttribute("column-key") ||
          cellEl.getAttribute("data-column-key");
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
  emit("selection-change", selection);
};

const onCellDblClick = (row, column, cell, event) => {
  emit("cell-dblclick", row, column, cell, event);
};

const onSortChange = (data) => {
  emit("sort-change", data);
};

const onHeaderDragend = (newWidth, oldWidth, column, event) => {
  emit("header-dragend", newWidth, oldWidth, column, event);
};

const onExpandChange = (row, expandedRows) => {
  emit("expand-change", row, expandedRows);
};

// 初始化拖拽排序
const initDragSort = () => {
  if (!props.draggable || !scTable.value) return;

  destroyDragSort();

  nextTick(() => {
    const tableEl = scTable.value?.$el;
    if (!tableEl) return;

    const tbody = tableEl.querySelector(".el-table__body-wrapper tbody");
    if (!tbody) return;

    sortableInstance.value = Sortable.create(tbody, {
      animation: 150,
      handle: ".drag-handle",
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      dragClass: "sortable-drag",
      filter: ".el-table__expand-column, .el-table__selection-column",
      onStart: () => {
        isDragging.value = true;
      },
      onEnd: (evt) => {
        isDragging.value = false;
        const { oldIndex, newIndex } = evt;
        if (
          oldIndex === undefined ||
          newIndex === undefined ||
          oldIndex === newIndex
        )
          return;

        // 创建新数组以避免直接修改原数组
        const newOrder = [...props.tableData];
        const movedItem = newOrder.splice(oldIndex, 1)[0];
        newOrder.splice(newIndex, 0, movedItem);

        // 触发拖拽排序变化事件
        emit("drag-sort-change", {
          oldIndex,
          newIndex,
          newOrder,
          movedItem,
        });
      },
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
  { immediate: true },
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
    nextTick(() => {
      syncHorizontalOverflow();
      syncHiddenInteractiveElements();
    });
  },
  { deep: false },
);

const getBodyWrapper = () => {
  return scTable.value?.$el?.querySelector(".el-table__body-wrapper");
};

const getBodyScrollContainer = () => {
  const bodyWrapper = getBodyWrapper();
  return bodyWrapper?.querySelector(".el-scrollbar__wrap") || bodyWrapper;
};

const getBodyTable = () => {
  return (
    getBodyScrollContainer()?.querySelector("table") ||
    getBodyWrapper()?.querySelector("table")
  );
};

const restoreHiddenInteractiveState = (element) => {
  const originalTabIndex = element.getAttribute(
    HIDDEN_INTERACTIVE_ORIGINAL_TABINDEX_ATTR,
  );
  const originalAriaHidden = element.getAttribute(
    HIDDEN_INTERACTIVE_ORIGINAL_ARIA_HIDDEN_ATTR,
  );

  if (originalTabIndex === null) {
    element.removeAttribute("tabindex");
  } else {
    element.setAttribute("tabindex", originalTabIndex);
  }

  if (originalAriaHidden === null) {
    element.removeAttribute("aria-hidden");
  } else {
    element.setAttribute("aria-hidden", originalAriaHidden);
  }

  element.removeAttribute(HIDDEN_INTERACTIVE_ATTR);
  element.removeAttribute(HIDDEN_INTERACTIVE_ORIGINAL_TABINDEX_ATTR);
  element.removeAttribute(HIDDEN_INTERACTIVE_ORIGINAL_ARIA_HIDDEN_ATTR);
};

const syncHiddenInteractiveElements = () => {
  if (hiddenInteractiveSyncFrame) {
    cancelAnimationFrame(hiddenInteractiveSyncFrame);
  }

  hiddenInteractiveSyncFrame = requestAnimationFrame(() => {
    const tableEl = scTable.value?.$el;
    if (!tableEl) {
      return;
    }

    const hiddenElements = new Set(
      Array.from(
        tableEl.querySelectorAll(`.hidden-columns ${HIDDEN_INTERACTIVE_SELECTOR}`),
      ),
    );
    const markedElements = Array.from(
      tableEl.querySelectorAll(`[${HIDDEN_INTERACTIVE_ATTR}="true"]`),
    );

    // 没有隐藏列元素且没有历史标记时，直接跳过，避免无效 DOM 写入
    if (hiddenElements.size === 0 && markedElements.length === 0) {
      return;
    }

    isHiddenInteractiveSyncing = true;
    try {
      markedElements.forEach((element) => {
        if (!hiddenElements.has(element)) {
          restoreHiddenInteractiveState(element);
        }
      });

      hiddenElements.forEach((element) => {
        if (!element.hasAttribute(HIDDEN_INTERACTIVE_ATTR)) {
          const currentTabIndex = element.getAttribute("tabindex");
          const currentAriaHidden = element.getAttribute("aria-hidden");
          if (currentTabIndex !== null) {
            element.setAttribute(
              HIDDEN_INTERACTIVE_ORIGINAL_TABINDEX_ATTR,
              currentTabIndex,
            );
          }
          if (currentAriaHidden !== null) {
            element.setAttribute(
              HIDDEN_INTERACTIVE_ORIGINAL_ARIA_HIDDEN_ATTR,
              currentAriaHidden,
            );
          }
        }

        element.setAttribute(HIDDEN_INTERACTIVE_ATTR, "true");
        element.setAttribute("tabindex", "-1");
        element.setAttribute("aria-hidden", "true");
      });
    } finally {
      isHiddenInteractiveSyncing = false;
    }
  });
};

const syncHorizontalOverflow = () => {
  if (overflowSyncFrame) {
    cancelAnimationFrame(overflowSyncFrame);
  }

  overflowSyncFrame = requestAnimationFrame(() => {
    const scrollContainer = getBodyScrollContainer();
    if (!scrollContainer) {
      hasHorizontalOverflow.value = false;
      return;
    }

    const bodyTable = getBodyTable();
    const verticalScrollbarWidth = Math.max(
      scrollContainer.offsetWidth - scrollContainer.clientWidth,
      0,
    );
    const contentWidth = bodyTable?.scrollWidth || scrollContainer.scrollWidth;
    const visibleWidth = scrollContainer.clientWidth + verticalScrollbarWidth;

    hasHorizontalOverflow.value = contentWidth - visibleWidth > 1;
  });
};

const syncTableHeaderOffset = () => {
  requestAnimationFrame(() => {
    const tableEl = scTable.value?.$el;
    if (!tableEl) {
      tableHeaderOffset.value = 0;
      return;
    }

    const headerWrapper = tableEl.querySelector(".el-table__header-wrapper");
    tableHeaderOffset.value = headerWrapper?.offsetHeight || 0;
  });
};

const destroyOverflowObserver = () => {
  if (overflowResizeObserver) {
    overflowResizeObserver.disconnect();
    overflowResizeObserver = null;
  }
};

const destroyHiddenInteractiveObserver = () => {
  if (hiddenInteractiveObserver) {
    hiddenInteractiveObserver.disconnect();
    hiddenInteractiveObserver = null;
  }
  if (hiddenInteractiveSyncFrame) {
    cancelAnimationFrame(hiddenInteractiveSyncFrame);
    hiddenInteractiveSyncFrame = 0;
  }
};

const initOverflowObserver = () => {
  destroyOverflowObserver();
  syncHorizontalOverflow();

  if (typeof ResizeObserver === "undefined") {
    return;
  }

  const scrollContainer = getBodyScrollContainer();
  if (!scrollContainer) {
    return;
  }

  overflowResizeObserver = new ResizeObserver(() => {
    syncHorizontalOverflow();
  });
  overflowResizeObserver.observe(scrollContainer);

  const bodyTable = getBodyTable();
  if (bodyTable) {
    overflowResizeObserver.observe(bodyTable);
  }

  if (tableContainerRef.value) {
    overflowResizeObserver.observe(tableContainerRef.value);
  }
};

const initHiddenInteractiveObserver = () => {
  destroyHiddenInteractiveObserver();
  syncHiddenInteractiveElements();

  if (typeof MutationObserver === "undefined") {
    return;
  }

  const tableEl = scTable.value?.$el;
  if (!tableEl) {
    return;
  }

  hiddenInteractiveObserver = new MutationObserver((mutations) => {
    if (isHiddenInteractiveSyncing) {
      return;
    }

    // 仅当变更与 hidden-columns 或已标记元素有关时才触发同步，降低观察器噪音
    const shouldSync = mutations.some((mutation) => {
      const target = mutation.target;
      if (!(target instanceof Element)) {
        return mutation.type === "childList";
      }

      const inHiddenColumns = !!target.closest(".hidden-columns");
      const isHiddenColumnsRoot = target.classList?.contains("hidden-columns");
      const touchesHiddenColumns =
        target.querySelector?.(".hidden-columns") ||
        (mutation.type === "childList" &&
          [...mutation.addedNodes, ...mutation.removedNodes].some(
            (node) =>
              node instanceof Element &&
              (node.classList?.contains("hidden-columns") ||
                !!node.closest?.(".hidden-columns") ||
                !!node.querySelector?.(".hidden-columns")),
          ));
      const touchesMarked =
        target.hasAttribute(HIDDEN_INTERACTIVE_ATTR) ||
        target.hasAttribute(HIDDEN_INTERACTIVE_ORIGINAL_TABINDEX_ATTR) ||
        target.hasAttribute(HIDDEN_INTERACTIVE_ORIGINAL_ARIA_HIDDEN_ATTR);

      return (
        inHiddenColumns ||
        isHiddenColumnsRoot ||
        !!touchesHiddenColumns ||
        touchesMarked
      );
    });

    if (!shouldSync) {
      return;
    }
    syncHiddenInteractiveElements();
  });

  hiddenInteractiveObserver.observe(tableEl, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["style", "class"],
  });
};

watch(
  () => [props.userColumn?.length, props.loading],
  () => {
    nextTick(() => {
      syncTableHeaderOffset();
      initOverflowObserver();
      initHiddenInteractiveObserver();
    });
  },
  { immediate: true },
);

onMounted(() => {
  if (props.draggable) {
    initDragSort();
  }
  nextTick(() => {
    syncTableHeaderOffset();
    initOverflowObserver();
    initHiddenInteractiveObserver();
  });
  loadHeaderMenuState();
});

// 处理表格右键菜单（行右键 + 表头右键统一入口）
const handleTableContextMenu = (event) => {
  const target = event.target

  // ---- 表头右键 ----
  if (props.columnHeaderMenu) {
    const headerWrapper = scTable.value?.$el?.querySelector('.el-table__header-wrapper')
    if (headerWrapper && headerWrapper.contains(target)) {
      // 找到点击的 th，从中取 column-key
      const th = target.closest('th.el-table__cell')
      let col = null
      if (th) {
        const columnKey = th.getAttribute('column-key') || th.getAttribute('data-column-key')
        col = props.userColumn.find(c => c.prop === columnKey) || null
      }
      // 如果没找到具体列（如点在空白处），取第一列兜底
      if (!col && props.userColumn.length) col = props.userColumn[0]
      if (col) {
        columnHeaderMenuState.column = col
        columnHeaderMenuState.columnMeta = getColMeta(col.prop)
        columnHeaderMenuState.position = { x: event.clientX + 2, y: event.clientY + 2 }
        columnHeaderMenuState.visible = true
      }
      return
    }
  }

  // ---- 行右键 ----
  if (!props.contextmenu || !scTable.value) return

  const tableEl = scTable.value.$el
  if (!tableEl) return

  let rowElement = target.closest(".el-table__row")
  if (!rowElement) return

  const rows = tableEl.querySelectorAll(".el-table__body tbody tr")
  const rowIndex = Array.from(rows).indexOf(rowElement)
  if (rowIndex === -1 || rowIndex >= props.tableData.length) return

  const row = props.tableData[rowIndex]
  currentRowData.value = row

  const items = props.contextmenu(row, null, event)
  if (items && items.length > 0) {
    menuItems.value = items
    nextTick(() => {
      contextMenuRef.value?.open(event, row)
    })
  }
};

// 处理菜单动作
const handleMenuAction = (action) => {
  // 如果需要，可以在这里处理菜单动作
  logger.info("菜单动作: {}", action);
};

onBeforeUnmount(() => {
  destroyDragSort();
  destroyOverflowObserver();
  destroyHiddenInteractiveObserver();
  if (overflowSyncFrame) {
    cancelAnimationFrame(overflowSyncFrame);
  }
});

// Expose el-table methods
const clearSelection = () => scTable.value?.clearSelection();
const toggleRowSelection = (row, selected) =>
  scTable.value?.toggleRowSelection(row, selected);
const toggleAllSelection = () => scTable.value?.toggleAllSelection();
const toggleRowExpansion = (row, expanded) =>
  scTable.value?.toggleRowExpansion(row, expanded);
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
  setScrollLeft,
});
</script>

<style lang="scss" scoped>
.table-container {
  position: relative;
  --sc-table-header-offset: 0px;
  width: 100%;
  height: 100%;
  max-width: 100%; /* 限制容器最大宽度 */
  box-sizing: border-box; /* 确保宽度计算包含边框和内边距 */
  min-width: 0;
  overflow: hidden;

  :deep(.el-table) {
    width: 100% !important;
    max-width: 100% !important; /* 限制表格最大宽度 */
    min-width: 0;
  }

  :deep(.el-table .el-loading-mask) {
    top: var(--sc-table-header-offset);
    height: calc(100% - var(--sc-table-header-offset));
    border-top: 1px solid var(--el-border-color-lighter);
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

  &.theme--primary {
    @include theme-variant("primary");
  }
  &.theme--success {
    @include theme-variant("success");
  }
  &.theme--warning {
    @include theme-variant("warning");
  }
  &.theme--danger {
    @include theme-variant("danger");
  }
  &.theme--info {
    @include theme-variant("info");
  }

  // 深色主题适配
  html.dark &,
  [data-theme='dark'] &,
  &.theme--dark {
    :deep(.el-table) {
      background-color: var(--el-bg-color);
      color: var(--el-text-color-primary);

      th.el-table__cell,
      td.el-table__cell {
        background-color: var(--el-bg-color);
        border-bottom-color: var(--el-border-color);
      }

      // 表头样式
      th.el-table__cell {
        background-color: var(--el-fill-color-light) !important;
        color: var(--el-text-color-primary);
      }

      // 斑马纹
      .el-table__row--striped td.el-table__cell {
        background-color: var(--el-fill-color-lighter);
      }

      // 悬停
      .el-table__body tr:hover > td.el-table__cell {
        background-color: var(--el-fill-color-light) !important;
      }

      // 边框
      &.el-table--border {
        .el-table__cell {
          border-right-color: var(--el-border-color);
        }
      }
    }

    // 滚动条样式
    :deep(.el-scrollbar__bar) {
      background-color: var(--el-fill-color-dark);
    }

    :deep(.el-table__empty-text) {
      color: var(--el-text-color-secondary);
    }
  }

  &[data-skin="tech"],
  &.skin--tech,
  &[data-skin="cyber"],
  &.skin--cyber {
    --sc-tech-line: rgba(48, 226, 217, 0.28);
    --sc-tech-line-strong: rgba(67, 243, 238, 0.62);
    --sc-tech-bg: linear-gradient(180deg, rgba(8, 20, 34, 0.92), rgba(5, 14, 24, 0.96));
    --sc-tech-header: linear-gradient(180deg, rgba(10, 30, 48, 0.96), rgba(9, 24, 38, 0.96));
    --sc-tech-hover: rgba(66, 245, 230, 0.09);
    --sc-tech-stripe: rgba(255, 255, 255, 0.02);
    --sc-tech-text: #d9f7ff;
    --sc-tech-sub: rgba(168, 221, 235, 0.78);
    --sc-tech-glow: 0 0 0 1px rgba(66, 245, 230, 0.1) inset, 0 0 24px rgba(66, 245, 230, 0.08);

    :deep(.el-table) {
      color: var(--sc-tech-text);
      background: transparent;
      box-shadow: var(--sc-tech-glow);

      &::before,
      .el-table__inner-wrapper::before,
      .el-table__border-left-patch {
        background: var(--sc-tech-line) !important;
      }

      th.el-table__cell {
        color: var(--sc-tech-sub);
        background: var(--sc-tech-header) !important;
        border-bottom-color: var(--sc-tech-line) !important;
      }

      td.el-table__cell {
        color: var(--sc-tech-text);
        background: rgba(8, 18, 30, 0.88);
        border-bottom-color: var(--sc-tech-line) !important;
      }

      .el-table__row--striped td.el-table__cell {
        background: rgba(255, 255, 255, 0.025);
      }

      .el-table__body tr:hover > td.el-table__cell {
        background: var(--sc-tech-hover) !important;
      }

      &.el-table--border .el-table__cell {
        border-right-color: var(--sc-tech-line) !important;
      }
    }

    :deep(.el-pagination) {
      color: var(--sc-tech-sub);
    }
  }
}

.table-container :deep(.el-table__body-wrapper) {
  overflow-x: hidden !important;
}

.table-container :deep(.el-table__body-wrapper .el-scrollbar__wrap) {
  overflow-x: hidden !important;
}

.table-container :deep([data-sc-hidden-interactive="true"]) {
  pointer-events: none !important;
}

.table-container.has-horizontal-overflow
  :deep(.el-table__body-wrapper .el-scrollbar__wrap) {
  overflow-x: auto !important;
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
      background: var(
        --cross-highlight-color,
        var(--stitch-lay-bg-hover)
      ) !important;
      position: relative;
    }

    .cross-highlight-row::before,
    .cross-highlight-row::after {
      content: "";
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
      background: var(
        --cross-highlight-color,
        var(--stitch-lay-bg-hover)
      ) !important;
    }

    /* 列高亮单元格 */
    .cross-highlight-col-cell {
      background: var(
        --cross-highlight-color,
        var(--stitch-lay-bg-hover)
      ) !important;
      position: relative;
    }

    .cross-highlight-col-cell::before,
    .cross-highlight-col-cell::after {
      content: "";
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
      background: var(
        --cross-intersection-color,
        var(--stitch-lay-primary-alpha)
      ) !important;
      box-shadow: inset 0 0 0 var(--cross-border-width, 3px)
        var(--cross-border-color, var(--stitch-lay-primary));
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
      background: var(
        --cross-highlight-color,
        var(--stitch-lay-bg-hover)
      ) !important;
      position: relative;
    }

    .cross-highlight-row-cell {
      background: var(
        --cross-highlight-color,
        var(--stitch-lay-bg-hover)
      ) !important;
    }

    .cross-highlight-col-cell {
      background: var(
        --cross-highlight-color,
        var(--stitch-lay-bg-hover)
      ) !important;
      position: relative;
    }

    .cross-highlight-intersection {
      background: var(
        --cross-intersection-color,
        var(--stitch-lay-primary-alpha)
      ) !important;
      box-shadow: inset 0 0 0 var(--cross-border-width, 3px)
        var(--cross-border-color, var(--stitch-lay-primary));
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

/* 列头右键菜单 - 列头 wrapper 样式 */
:deep(.col-header-wrapper) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.4;
}

:deep(.col-header-title) {
  font-weight: 500;
}

:deep(.col-type),
:deep(.col-comment) {
  font-size: 11px;
  color: var(--stitch-lay-text-secondary);
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
