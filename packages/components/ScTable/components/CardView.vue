<template>
  <div
    ref="cardContainer"
    class="card-view-container thin-scrollbar"
    :class="{
      'flex justify-center items-center': !currentDataList || currentDataList.length === 0,
      'h-full': height === 'full'
    }"
    :style="containerStyle"
    @scroll="handleScroll"
  >
    <!-- 顶部加载状态 -->
    <div v-if="isScrollPagination && loadingPrev && hasMorePrevData" class="loading-more flex justify-center items-center py-4">
      <el-icon class="is-loading mr-2">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="currentColor"
            d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zm448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32zm-640 0a32 32 0 0 1-32 32H96a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32zM195.2 195.2a32 32 0 0 1 45.248 0L376.32 331.008a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248zm452.544 452.544a32 32 0 0 1 45.248 0L828.8 783.552a32 32 0 0 1-45.248 45.248L647.744 692.992a32 32 0 0 1 0-45.248zM828.8 195.264a32 32 0 0 1 0 45.184L692.992 376.32a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0zm-452.544 452.48a32 32 0 0 1 0 45.248L240.448 828.8a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0z"
          />
        </svg>
      </el-icon>
      <span>加载上一页...</span>
    </div>

    <!-- 向上滚动提示 -->
    <div v-if="isScrollPagination && !loadingPrev && hasMorePrevData" class="scroll-tip flex justify-center items-center py-2 text-gray-500 text-sm" @click="loadPrevPage">
      <span>向上滚动加载更多</span>
    </div>

    <!-- 卡片为空时显示空状态 -->
    <template v-if="!currentDataList || currentDataList.length === 0">
      <slot name="empty">
        <el-empty :description="emptyText" :image-size="100" />
      </slot>
    </template>

    <!-- 卡片网格布局 -->
    <el-row v-else :gutter="16">
      <el-col
        v-for="(row, index) in currentDataList"
        :key="rowKey ? row[rowKey] : index"
        :xs="computedPageSize"
        :sm="computedPageSize"
        :md="computedPageSize"
        :lg="computedPageSize"
        :xl="computedPageSize"
        class="card-col"
      >
        <div class="is-always-shadow" @contextmenu="handleContextMenu($event, row)">
          <!-- 根据layout属性决定是否使用ScCard包装 -->
          <template v-if="layout === 'card'">
            <ScCard hoverable class="is-always-shadow-item">
              <slot :row="row" :index="index" />
            </ScCard>
          </template>
          <template v-else>
            <slot :row="row" :index="index" class="is-always-shadow-item" />
          </template>
        </div>
      </el-col>
    </el-row>

    <!-- 向下滚动提示 -->
    <div v-if="isScrollPagination && !loadingNext && hasMoreNextData" class="scroll-tip flex justify-center items-center py-2 text-gray-500 text-sm" @click="loadNextPage">
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
    <div v-if="isScrollPagination && !loadingNext && !hasMoreNextData && currentDataList.length > 0" class="no-more flex justify-center items-center py-2 text-gray-400 text-sm">
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
  }
});

// 定义emits
const emit = defineEmits(["row-click", "selection-change", "load-more", "layout-updated", "next-page", "prev-page", "update:currentPage"]);

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
  .is-always-shadow-item {
    box-shadow: var(--el-box-shadow-light);
  }
  .card-col {
    margin-bottom: 16px;
    min-height: 100px;
  }

  .card-item {
    height: 100%;
    transition: all 0.3s;
    border: 1px solid var(--el-border-color-lighter);

    &:hover {
      transform: translateY(-5px);
      box-shadow: var(--el-box-shadow-light);
    }

    &.is-selected {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.3);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;

      .card-title {
        flex: 1;
        font-weight: bold;
        font-size: 16px;
        color: var(--el-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .card-content {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .card-field {
        display: flex;
        align-items: flex-start;

        .field-label {
          width: 80px;
          color: var(--el-text-color-secondary);
          font-size: 14px;
        }

        .field-value {
          flex: 1;
          color: var(--el-text-color-primary);
          word-break: break-all;
        }
      }
    }

    .card-actions {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--el-border-color-lighter);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  }

  .loading-more {
    margin-top: 10px;
    padding: 8px 0;
    background-color: rgba(var(--el-color-primary-rgb), 0.05);
    border-radius: 4px;

    svg {
      width: 20px;
      height: 20px;
    }
  }

  .scroll-tip,
  .no-more {
    margin-top: 10px;
    padding: 8px 0;
    border-top: 1px dashed var(--el-border-color-lighter);
    cursor: pointer;
    transition: all 0.3s;
    border-radius: 4px;

    &:hover {
      background-color: rgba(var(--el-color-primary-rgb), 0.05);
      color: var(--el-color-primary);
    }
  }
}

// 暗黑模式适配
:root[data-theme="dark"] {
  .card-item {
    background-color: var(--el-bg-color-overlay);

    &.is-selected {
      box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.5);
    }
  }

  .scroll-tip:hover,
  .loading-more {
    background-color: rgba(var(--el-color-primary-rgb), 0.1);
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
