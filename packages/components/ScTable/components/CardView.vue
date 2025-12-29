<template>
  <div
    ref="cardContainer"
    class="card-view-container thin-scrollbar"
    :class="{
      'is-empty': !currentDataList || currentDataList.length === 0,
      'h-full': height === 'full',
      'is-draggable': draggable
    }"
    :style="containerStyle"
    @scroll="handleScroll"
  >
    <!-- 顶部加载状态 -->
    <div v-if="isScrollPagination && loadingPrev && hasMorePrevData" class="loading-more">
      <el-icon class="is-loading">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zm448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32zm-640 0a32 32 0 0 1-32 32H96a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32zM195.2 195.2a32 32 0 0 1 45.248 0L376.32 331.008a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248zm452.544 452.544a32 32 0 0 1 45.248 0L828.8 783.552a32 32 0 0 1-45.248 45.248L647.744 692.992a32 32 0 0 1 0-45.248zM828.8 195.264a32 32 0 0 1 0 45.184L692.992 376.32a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0zm-452.544 452.48a32 32 0 0 1 0 45.248L240.448 828.8a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0z" />
        </svg>
      </el-icon>
      <span>加载上一页...</span>
    </div>

    <!-- 向上滚动提示 -->
    <div v-if="isScrollPagination && !loadingPrev && hasMorePrevData" class="scroll-tip" @click="loadPrevPage">
      <span>向上滚动加载更多</span>
    </div>

    <!-- 卡片为空时显示空状态 -->
    <template v-if="!currentDataList || currentDataList.length === 0">
      <slot name="empty">
        <el-empty :description="emptyText" :image-size="100" />
      </slot>
    </template>

    <!-- 卡片网格布局 - 使用 CSS Grid -->
    <div 
      v-else 
      ref="cardGridRef"
      class="card-grid"
      :style="gridStyle"
    >
      <div
        v-for="(row, index) in currentDataList"
        :key="rowKey ? row[rowKey] : index"
        class="card-item-wrapper"
        :class="{ 
          'is-selected': isSelected(row),
          'is-dragging': draggingIndex === index
        }"
        :data-index="index"
        @contextmenu="handleContextMenu($event, row)"
        @click="onRowClick(row)"
      >
        <!-- 序号角标 -->
        <div v-if="showIndex" class="card-index-badge">
          <span>{{ (currentPage - 1) * pageSize + index + 1 }}</span>
        </div>
        
        <!-- 拖拽手柄 -->
        <div v-if="draggable" class="card-drag-handle">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </div>
        
        <!-- 选择框 -->
        <div v-if="selectable" class="card-checkbox" @click.stop="toggleSelection(row)">
          <el-checkbox :model-value="isSelected(row)" @change="toggleSelection(row)" />
        </div>
        
        <!-- 卡片内容 -->
        <div class="card-content-wrapper">
          <template v-if="layout === 'card'">
            <ScCard hoverable class="card-inner">
              <slot :row="row" :index="index" />
            </ScCard>
          </template>
          <template v-else>
            <div class="card-inner card-default">
              <slot :row="row" :index="index" />
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 向下滚动提示 -->
    <div v-if="isScrollPagination && !loadingNext && hasMoreNextData" class="scroll-tip flex justify-center items-center py-2 text-[var(--el-text-color-regular)] text-sm" @click="loadNextPage">
      <span>向下滚动加载更多</span>
    </div>

    <!-- 底部加载状态 -->
    <div v-if="isScrollPagination && loadingNext && hasMoreNextData" class="loading-more flex justify-center items-center py-4">
      <el-icon class="is-loading mr-2">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="currentColor"
            d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zm448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32zm-640 0a32 32 0 0 1-32 32H96a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32zM195.2 195.2a32 32 0 0 1 45.248 0L376.32 331.008a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248zm452.544 452.544a32 32 0 0 1 45.248 0L828.8 783.552a32 32 0 0 1-45.248 45.248L647.744 692.992a32 32 0 0 1 0-45.248zM828.8 195.264a32 32 0 0 1 0 45.184L692.992 376.32a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0zm-452.544 452.48a32 32 0 0 1 0 45.248L240.448 828.8a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0z"
          />
        </svg>
      </el-icon>
      <span>加载下一页...</span>
    </div>

    <!-- 没有更多数据提示 -->
    <div v-if="isScrollPagination && !loadingNext && !hasMoreNextData && currentDataList.length > 0" class="no-more flex justify-center items-center py-2 text-[var(--el-text-color-placeholder)] text-sm">
      <span>没有更多数据了</span>
    </div>

    <!-- 引入右键菜单组件 -->
    <ContextMenu ref="contextMenuRef" :menu-items="menuItems" :row-data="currentRowData" :class-name="config.contextmenuClass" @menu-action="handleMenuAction" />
  </div>
</template>

<script setup>
import ScCard from "@repo/components/ScCard/index.vue";
import { debounce } from "lodash-es";
import { computed, nextTick, onMounted, onUnmounted, ref, useSlots, watch } from "vue";
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
  colSize: {
    type: Number,
    default: 1
  },
  rowSize: {
    type: Number,
    default: 1
  },
  config: {
    type: Object,
    required: true
  },
  center: {
    type: Boolean,
    default: false
  },
  contextmenu: Function,
  rowKey: String,
  height: [String, Number],
  columnInTemplate: Boolean,
  toggleIndex: Number,
  emptyText: String,
  pageSize: {
    type: Number,
    default: 10
  },
  paginationType: {
    type: String,
    default: "current"
  },
  loading: {
    type: Boolean,
    default: false
  },
  total: {
    type: Number,
    default: 0
  },
  currentPage: {
    type: Number,
    default: 1
  },
  cardGap: {
    type: Number,
    default: 16
  },
  // 新增layout属性，支持card和default两种布局模式
  layout: {
    type: String,
    default: "card",
    validator: val => ["card", "default"].includes(val)
  },
  // 是否显示序号
  showIndex: {
    type: Boolean,
    default: false
  },
  // 是否可选择
  selectable: {
    type: Boolean,
    default: false
  },
  // 是否可拖拽排序
  draggable: {
    type: Boolean,
    default: false
  },
  // 布局模式: grid | flex
  layoutMode: {
    type: String,
    default: "grid",
    validator: val => ["grid", "flex"].includes(val)
  },
  // 卡片最小宽度 (flex模式下有效)
  cardMinWidth: {
    type: Number,
    default: 280
  },
  // 拖拽行标识字段
  dragRowKey: {
    type: String,
    default: "id"
  }
});

// 定义emits
const emit = defineEmits(["row-click", "selection-change", "load-more", "layout-updated", "next-page", "prev-page", "update:currentPage", "col-click", "drag-sort-change"]);

// 响应式数据
const currentDataList = ref([]);
const selectedRows = ref([]);
const slots = useSlots();
const cardContainer = ref(null);
const lastScrollTop = ref(0);
const scrollThreshold = 100; // 滚动阈值，距离顶部或底部多少像素时触发加载
const canLoadMore = ref(true); // 防止重复加载
const scrollDirection = ref(""); // 'up' 或 'down'
const loadingNext = ref(false);
const loadingPrev = ref(false);
const internalCurrentPage = ref(props.currentPage);
const cardGridRef = ref(null);
const draggingIndex = ref(-1);

// 右键菜单相关状态
const contextMenuRef = ref(null);
const menuItems = ref([]);
const currentRowData = ref({});

// 监听currentPage
watch(
  () => props.currentPage,
  newVal => {
    internalCurrentPage.value = newVal;
  }
);

// 计算容器样式
const containerStyle = computed(() => {
  const style = {
    width: "100%",
    padding: "16px",
    overflowY: "auto",
    position: "relative"
  };

  // 处理高度设置
  if (!props.height || props.height === "auto") {
    style.height = "100%";
    style.maxHeight = "calc(100vh - 200px)"; // 设置最大高度以确保在小屏幕上显示正常
  } else if (typeof props.height === "number") {
    style.height = `${props.height}px`;
  } else {
    style.height = props.height;
  }

  return style;
});

// 计算属性
const isScrollPagination = computed(() => {
  return props.paginationType === "scroll";
});

// Grid/Flex 布局样式
const gridStyle = computed(() => {
  if (props.layoutMode === 'flex') {
    // Flex 布局：自动换行，自适应宽度
    return {
      display: 'flex',
      flexWrap: 'wrap',
      gap: `${props.cardGap}px`,
      justifyContent: props.center ? 'center' : 'flex-start',
      alignItems: 'stretch'
    };
  }
  // Grid 布局：固定列数
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${props.colSize}, 1fr)`,
    gap: `${props.cardGap}px`,
    justifyItems: props.center ? 'center' : 'stretch'
  };
});

// 卡片项样式 (flex 模式)
const cardItemStyle = computed(() => {
  if (props.layoutMode === 'flex') {
    return {
      flex: `1 1 ${props.cardMinWidth}px`,
      maxWidth: `calc(${100 / Math.min(props.colSize, 4)}% - ${props.cardGap}px)`,
      minWidth: `${props.cardMinWidth}px`
    };
  }
  return {};
});

// 判断是否还有更多下一页数据
const hasMoreNextData = computed(() => {
  if (!props.total || !props.pageSize) return false;
  return internalCurrentPage.value * props.pageSize < props.total;
});

// 判断是否还有更多上一页数据
const hasMorePrevData = computed(() => {
  return internalCurrentPage.value > 1;
});

// 监听tableData变化
watch(
  () => props.tableData,
  newVal => {
    if (isScrollPagination.value && currentDataList.value.length > 0 && newVal.length > 0) {
      // 滚动分页模式下，追加新数据而不是替换
      const existingIds = new Set(currentDataList.value.map(item => (props.rowKey ? item[props.rowKey] : JSON.stringify(item))));
      const newItems = newVal.filter(item => {
        const itemId = props.rowKey ? item[props.rowKey] : JSON.stringify(item);
        return !existingIds.has(itemId);
      });

      if (newItems.length > 0) {
        currentDataList.value = [...currentDataList.value, ...newItems];
      }
    } else {
      // 当前分页模式或首次加载，直接替换数据
      currentDataList.value = newVal;
    }

    // 加载完成后重置状态
    nextTick(() => {
      canLoadMore.value = true;
    });
  },
  { immediate: true }
);

// 监听高度变化
watch(
  () => props.height,
  () => {
    nextTick(() => {
      updateContainerStyles();
    });
  }
);

// 监听colSize和rowSize变化
watch(
  [() => props.colSize, () => props.rowSize],
  () => {
    nextTick(() => {
      // 更新布局
      emit("layout-updated", {
        colSize: props.colSize,
        rowSize: props.rowSize
      });
    });
  },
  { immediate: true }
);

// 更新容器样式
const updateContainerStyles = () => {
  if (!cardContainer.value) return;

  // 确保容器启用滚动
  cardContainer.value.parentElement.style.overflowY = "auto";

  // 设置卡片容器高度
  const containerHeight = cardContainer.value.parentElement.clientHeight + "px";
  if (containerHeight) {
    cardContainer.value.style.height = containerHeight;
  }

  // 通知父组件布局变化
  nextTick(() => {
    emit("layout-updated");
  });
};

// 滚动事件处理
const handleScroll = debounce(() => {
  if (!isScrollPagination.value || !canLoadMore.value || props.loading) {
    return;
  }

  const container = cardContainer.value;
  if (!container) return;

  const { scrollTop, scrollHeight, clientHeight } = container;

  // 确定滚动方向
  const direction = scrollTop > lastScrollTop.value ? "down" : "up";
  scrollDirection.value = direction;
  lastScrollTop.value = scrollTop;

  // 检查是否滚动到底部
  if (direction === "down" && scrollHeight - scrollTop - clientHeight < scrollThreshold) {
    loadNextPage();
  }

  // 检查是否滚动到顶部
  if (direction === "up" && scrollTop < scrollThreshold) {
    loadPrevPage();
  }
}, 200);

// 加载下一页
const loadNextPage = () => {
  if (loadingNext.value || !hasMoreNextData.value || !canLoadMore.value) return;

  canLoadMore.value = false;
  loadingNext.value = true;

  // 记住当前滚动位置
  const scrollPosition = cardContainer.value.scrollTop;

  // 触发下一页事件
  emit("next-page");

  // 发送当前页更新事件
  const nextPage = internalCurrentPage.value + 1;
  internalCurrentPage.value = nextPage;
  emit("update:currentPage", nextPage);

  // 延迟重置状态，允许数据加载完成
  setTimeout(() => {
    loadingNext.value = false;
    canLoadMore.value = true;

    // 在数据加载后保持相对滚动位置
    nextTick(() => {
      if (cardContainer.value) {
        cardContainer.value.scrollTop = scrollPosition;
      }
    });
  }, 500);
};

// 加载上一页
const loadPrevPage = () => {
  if (loadingPrev.value || !hasMorePrevData.value || !canLoadMore.value) return;

  canLoadMore.value = false;
  loadingPrev.value = true;

  // 记住当前内容高度
  const contentHeight = cardContainer.value.scrollHeight;

  // 触发上一页事件
  emit("prev-page");

  // 发送当前页更新事件
  const prevPage = internalCurrentPage.value - 1;
  internalCurrentPage.value = prevPage;
  emit("update:currentPage", prevPage);

  // 延迟重置状态，允许数据加载完成
  setTimeout(() => {
    loadingPrev.value = false;
    canLoadMore.value = true;

    // 在数据加载后尝试维持相对位置
    nextTick(() => {
      if (cardContainer.value) {
        // 计算新的滚动位置以保持相对位置
        const newContentHeight = cardContainer.value.scrollHeight;
        const heightDifference = newContentHeight - contentHeight;
        cardContainer.value.scrollTop = heightDifference + cardContainer.value.scrollTop;
      }
    });
  }, 500);
};

// 重置滚动状态
const resetScrollState = () => {
  canLoadMore.value = true;
  loadingNext.value = false;
  loadingPrev.value = false;

  // 如果是滚动分页模式，滚动到顶部
  if (isScrollPagination.value && cardContainer.value) {
    cardContainer.value.scrollTop = 0;
  }
};

// 生命周期钩子
onMounted(() => {
  nextTick(() => {
    updateContainerStyles();
  });
});

onUnmounted(() => {
  // 清理工作
});

// 计算属性
const computedPageSize = computed(() => {
  return Math.ceil(24 / props.colSize);
});

const firstColumn = computed(() => {
  return props.userColumn.find(col => !col.hide && col.prop !== "selection");
});

const displayColumns = computed(() => {
  return props.userColumn.filter(col => !col.hide && col.prop !== "selection" && col.prop !== firstColumn.value?.prop);
});

const hasSelectionColumn = computed(() => {
  return props.userColumn.some(col => col.prop === "selection");
});

const hasActionSlot = computed(() => {
  return !!slots.action;
});

// 方法
const onRowClick = row => {
  emit("row-click", row);
};

const toggleSelection = row => {
  const index = selectedRows.value.findIndex(item => (props.rowKey ? item[props.rowKey] === row[props.rowKey] : item === row));

  if (index === -1) {
    selectedRows.value.push(row);
    row.isSelected = true;
  } else {
    selectedRows.value.splice(index, 1);
    row.isSelected = false;
  }

  emit("selection-change", selectedRows.value);
};

const isSelected = row => {
  return selectedRows.value.some(item => (props.rowKey ? item[props.rowKey] === row[props.rowKey] : item === row));
};

const clearSelection = () => {
  selectedRows.value = [];
  props.tableData.forEach(row => {
    row.isSelected = false;
  });
  emit("selection-change", []);
};

const toggleRowSelection = (row, selected) => {
  if (selected) {
    if (!isSelected(row)) {
      selectedRows.value.push(row);
      row.isSelected = true;
    }
  } else {
    const index = selectedRows.value.findIndex(item => (props.rowKey ? item[props.rowKey] === row[props.rowKey] : item === row));
    if (index !== -1) {
      selectedRows.value.splice(index, 1);
      row.isSelected = false;
    }
  }
  emit("selection-change", selectedRows.value);
};

const toggleAllSelection = () => {
  if (selectedRows.value.length === props.tableData.length) {
    clearSelection();
  } else {
    selectedRows.value = [...props.tableData];
    props.tableData.forEach(row => {
      row.isSelected = true;
    });
    emit("selection-change", selectedRows.value);
  }
};

const getSelectionRows = () => {
  return selectedRows.value;
};

const doLayout = () => {
  // 卡片布局不需要特殊处理
  updateContainerStyles();
  resetScrollState();
};

// 暴露方法给父组件
defineExpose({
  toggleSelection,
  isSelected,
  clearSelection,
  toggleRowSelection,
  toggleAllSelection,
  getSelectionRows,
  doLayout,
  resetScrollState
});

// 处理右键菜单
const handleContextMenu = (event, row) => {
  if (!props.contextmenu) return;

  // 保存当前行数据
  currentRowData.value = row;

  // 调用外部传入的contextmenu函数获取菜单项
  const items = props.contextmenu(row, null, event);

  if (items && items.length > 0) {
    menuItems.value = items;
    // 显示右键菜单
    contextMenuRef.value.open(event, row);
  }
};

// 处理菜单动作
const handleMenuAction = action => {
  // 如果需要，可以在这里处理菜单动作
  console.log("菜单动作:", action);
};
</script>

<style lang="scss" scoped>
.card-view-container {
  &.is-empty {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &.is-draggable .card-item-wrapper {
    cursor: default;
  }

  // Grid/Flex 布局容器
  .card-grid {
    width: 100%;

    &.card-grid-flex {
      .card-item-wrapper {
        flex: 1 1 280px;
        max-width: calc(33.333% - 12px);
        min-width: 280px;
        
        @media (max-width: 768px) {
          max-width: calc(50% - 8px);
          min-width: 240px;
        }
        
        @media (max-width: 480px) {
          max-width: 100%;
          min-width: 100%;
        }
      }
    }
  }

  // 卡片项包装器
  .card-item-wrapper {
    position: relative;
    border-radius: 14px;
    overflow: visible;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-6px);
      z-index: 10;

      .card-inner {
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
        border-color: var(--el-color-primary-light-5);
      }

      .card-drag-handle {
        opacity: 1;
      }
    }

    &.is-selected {
      .card-inner {
        border-color: var(--el-color-primary);
        box-shadow: 0 4px 16px var(--el-color-primary-light-7);
        background: linear-gradient(180deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);
      }

      .card-index-badge {
        background: var(--el-color-primary);
      }
    }

    &.is-dragging {
      opacity: 0.5;
      transform: scale(1.02);
    }
  }

  // 序号角标
  .card-index-badge {
    position: absolute;
    top: -8px;
    left: -8px;
    min-width: 28px;
    height: 28px;
    padding: 0 8px;
    background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.4);
  }

  // 拖拽手柄
  .card-drag-handle {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    opacity: 0;
    transition: all 0.2s;
    z-index: 20;
    color: var(--el-text-color-secondary);

    &:hover {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      border-color: var(--el-color-primary-light-5);
    }

    &:active {
      cursor: grabbing;
      background: var(--el-color-primary-light-8);
    }
  }

  // 选择框
  .card-checkbox {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 20;
    background: var(--el-bg-color);
    border-radius: 4px;
    padding: 2px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  // 卡片内容区域
  .card-content-wrapper {
    height: 100%;
  }

  // 卡片内部样式
  .card-inner {
    height: 100%;
    border-radius: 14px;
    border: 2px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    overflow: hidden;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

    &.card-default {
      padding: 16px;
    }
  }

  .card-item {
    height: 100%;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid var(--el-border-color-lighter);
    border-radius: 14px;
    background: var(--el-bg-color);
    overflow: hidden;
    position: relative;

    // 底部装饰条
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--el-color-primary-light-3), var(--el-color-primary));
      border-radius: 3px 3px 0 0;
      transition: width 0.3s ease;
    }

    &:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
      border-color: var(--el-color-primary-light-5);

      &::after {
        width: 40%;
      }
    }

    &.is-selected {
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 16px var(--el-color-primary-light-7);
      background: linear-gradient(180deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);

      &::after {
        width: 60%;
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 16px 12px;

      .card-title {
        flex: 1;
        font-weight: 600;
        font-size: 15px;
        color: var(--el-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .card-content {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 0 16px 16px;

      .card-field {
        display: flex;
        align-items: flex-start;

        .field-label {
          width: 80px;
          color: var(--el-text-color-secondary);
          font-size: 13px;
          flex-shrink: 0;
        }

        .field-value {
          flex: 1;
          color: var(--el-text-color-primary);
          word-break: break-all;
          font-size: 13px;
        }
      }
    }

    .card-actions {
      margin-top: 12px;
      padding: 12px 16px;
      background: var(--el-fill-color-lighter);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  }

  // 加载状态
  .loading-more {
    margin: 16px 0;
    padding: 12px 0;
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
    border-radius: 10px;
    color: var(--el-color-primary);
    font-size: 13px;
    font-weight: 500;

    svg {
      width: 18px;
      height: 18px;
    }
  }

  // 滚动提示
  .scroll-tip,
  .no-more {
    margin: 16px 0;
    padding: 10px 0;
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 8px;
    font-size: 13px;
    background: var(--el-fill-color-light);

    &:hover {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      transform: translateY(-2px);
    }
  }

  .no-more {
    cursor: default;
    opacity: 0.7;

    &:hover {
      transform: none;
    }
  }
}

// 暗黑模式适配
:root[data-theme="dark"] {
  .card-view-container {
    .is-always-shadow-item {
      background: var(--el-bg-color-overlay);
      border-color: var(--el-border-color-light);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    }

    .is-always-shadow:hover .is-always-shadow-item {
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
    }

    .card-item {
      background: var(--el-bg-color-overlay);

      &.is-selected {
        box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.3);
        background: linear-gradient(180deg, rgba(var(--el-color-primary-rgb), 0.1) 0%, var(--el-bg-color-overlay) 100%);
      }

      .card-actions {
        background: rgba(0, 0, 0, 0.2);
      }
    }

    .loading-more {
      background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.15), rgba(var(--el-color-primary-rgb), 0.1));
    }

    .scroll-tip:hover {
      background: rgba(var(--el-color-primary-rgb), 0.15);
    }
  }
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
