<template>
  <div class="list-view-container thin-scrollbar" ref="listContainer" :style="containerStyle"
    @scroll="handleScroll">
    <!-- 顶部加载状态 -->
    <div v-if="isScrollPagination && loadingPrev && hasMorePrevData" class="loading-indicator loading-prev">
      <el-icon class="is-loading"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zm448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32zm-640 0a32 32 0 0 1-32 32H96a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32zM195.2 195.2a32 32 0 0 1 45.248 0L376.32 331.008a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248zm452.544 452.544a32 32 0 0 1 45.248 0L828.8 783.552a32 32 0 0 1-45.248 45.248L647.744 692.992a32 32 0 0 1 0-45.248zM828.8 195.264a32 32 0 0 1 0 45.184L692.992 376.32a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0zm-452.544 452.48a32 32 0 0 1 0 45.248L240.448 828.8a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0z"></path></svg></el-icon>
      <span>加载上一页...</span>
    </div>

    <!-- 向上滚动提示 -->
    <div v-if="isScrollPagination && !loadingPrev && hasMorePrevData" class="scroll-tip scroll-tip-prev" @click="loadPrevPage">
      <span>向上滚动加载更多</span>
    </div>

    <!-- 列表为空时显示空状态 -->
    <template v-if="!currentDataList || currentDataList.length === 0">
      <el-empty :description="emptyText" :image-size="100" />
    </template>

    <!-- 列表布局 -->
    <div v-else class="list-items">
      <div v-for="(row, index) in currentDataList" :key="rowKey ? row[rowKey] : index" class="list-item"
        :class="{ 'is-selected': isSelected(row) }" 
        @click="onRowClick(row)" 
        @contextmenu.prevent="handleContextMenu($event, row)">
        <!-- 选择框 -->
        <div v-if="hasSelectionColumn" class="list-item-selection">
          <el-checkbox v-model="row.isSelected" @change="(val) => toggleSelection(row, val)" />
        </div>

        <!-- 自定义内容插槽 -->
        <div class="list-item-content">
          <slot :row="row" :index="index"></slot>
        </div>
      </div>
    </div>

    <!-- 向下滚动提示 -->
    <div v-if="isScrollPagination && !loadingNext && hasMoreNextData" class="scroll-tip scroll-tip-next" @click="loadNextPage">
      <span>向下滚动加载更多</span>
    </div>

    <!-- 底部加载状态 -->
    <div v-if="isScrollPagination && loadingNext && hasMoreNextData" class="loading-indicator loading-next">
      <el-icon class="is-loading"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zm448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32zm-640 0a32 32 0 0 1-32 32H96a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32zM195.2 195.2a32 32 0 0 1 45.248 0L376.32 331.008a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248zm452.544 452.544a32 32 0 0 1 45.248 0L828.8 783.552a32 32 0 0 1-45.248 45.248L647.744 692.992a32 32 0 0 1 0-45.248zM828.8 195.264a32 32 0 0 1 0 45.184L692.992 376.32a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0zm-452.544 452.48a32 32 0 0 1 0 45.248L240.448 828.8a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0z"></path></svg></el-icon>
      <span>加载下一页...</span>
    </div>

    <!-- 没有更多数据提示 -->
    <div v-if="isScrollPagination && !loadingNext && !hasMoreNextData && currentDataList.length > 0" class="no-more-data">
      <span>没有更多数据了</span>
    </div>

    <!-- 引入右键菜单组件 -->
    <ContextMenu ref="contextMenuRef" :menu-items="menuItems" :row-data="currentRowData" :class-name="config.contextmenuClass" @menu-action="handleMenuAction" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue';
import { debounce } from 'lodash-es';
import { ElIcon, ElEmpty, ElCheckbox } from 'element-plus';
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
  pageSize: {
    type: Number,
    default: 10
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
  emptyText: {
    type: String,
    default: '暂无数据'
  },
  paginationType: {
    type: String,
    default: 'default'  // 默认分页方式，可选：default, scroll
  },
  loading: {
    type: Boolean,
    default: false
  },
  currentPage: {
    type: Number,
    default: 1
  },
  total: {
    type: Number,
    default: 0
  }
});

// 定义emits
const emit = defineEmits([
  'row-click', 
  'selection-change', 
  'prev-page',
  'next-page',
  'update:currentPage'
]);

// 响应式数据
const selectedRows = ref([]);
const internalCurrentPage = ref(props.currentPage);
const listContainer = ref(null);
const lastScrollTop = ref(0);
const loadingNext = ref(false);
const loadingPrev = ref(false);
const scrollThreshold = 100; // 滚动阈值，距离顶部或底部多少像素时触发加载
const canLoadMore = ref(true); // 防止重复加载
const scrollDirection = ref(''); // 'up' 或 'down'

// 右键菜单相关状态
const contextMenuRef = ref(null);
const menuItems = ref([]);
const currentRowData = ref({});

// 计算属性
const isScrollPagination = computed(() => {
  return props.paginationType === 'scroll';
});

const hasMoreNextData = computed(() => {
  if (!props.total) return false;
  return internalCurrentPage.value * props.pageSize < props.total;
});

const hasMorePrevData = computed(() => {
  return internalCurrentPage.value > 1;
});

// 监听currentPage
watch(() => props.currentPage, (newVal) => {
  internalCurrentPage.value = newVal;
});

// 计算容器样式
const containerStyle = computed(() => {
  const style = {
    width: '100%',
    padding: '8px',
    overflowY: 'auto',
    position: 'relative'
  };

  // 处理高度设置
  if (props.height) {
    if (props.height === 'auto') {
      style.height = '100%';
      style.maxHeight = 'calc(100vh - 200px)'; // 设置最大高度以确保在小屏幕上显示正常
    } else if (typeof props.height === 'number') {
      style.height = `${props.height}px`;
    } else {
      style.height = props.height;
    }
  } else {
    style.height = '400px'; // 设置默认高度
    style.maxHeight = 'calc(100vh - 200px)';
  }

  return style;
});

// 更新容器样式
const updateContainerStyles = () => {
  if (!listContainer.value) return;
  
  // 确保容器启用滚动
  listContainer.value.style.overflowY = 'auto';
};

// 监听高度变化
watch(() => props.height, () => {
  nextTick(() => {
    updateContainerStyles();
  });
});

// 生命周期钩子
onMounted(() => {
  nextTick(() => {
    updateContainerStyles();
  });
});

onBeforeUnmount(() => {
  // 清理工作
});

// 计算属性
const currentDataList = computed(() => {
  return props.tableData;
});

const firstColumn = computed(() => {
  return props.userColumn.find(col => !col.hide && col.prop !== 'selection');
});

const displayColumns = computed(() => {
  return props.userColumn.filter(col =>
    !col.hide &&
    col.prop !== 'selection' &&
    col.prop !== firstColumn.value?.prop
  );
});

const hasSelectionColumn = computed(() => {
  return props.userColumn.some(col => col.prop === 'selection');
});

// 滚动处理函数
const handleScroll = debounce((e) => {
  if (!isScrollPagination.value || !canLoadMore.value || props.loading) {
    return;
  }

  const container = listContainer.value;
  if (!container) return;

  const { scrollTop, scrollHeight, clientHeight } = container;
  
  // 确定滚动方向
  const direction = scrollTop > lastScrollTop.value ? 'down' : 'up';
  scrollDirection.value = direction;
  lastScrollTop.value = scrollTop;
  
  // 检查是否滚动到底部
  if (direction === 'down' && scrollHeight - scrollTop - clientHeight < scrollThreshold) {
    loadNextPage();
  }
  
  // 检查是否滚动到顶部
  if (direction === 'up' && scrollTop < scrollThreshold) {
    loadPrevPage();
  }
}, 200);

// 加载下一页
const loadNextPage = () => {
  if (loadingNext.value || !hasMoreNextData.value || !canLoadMore.value) return;
  
  canLoadMore.value = false;
  loadingNext.value = true;
  
  // 记住当前滚动位置
  const scrollPosition = listContainer.value.scrollTop;
  
  // 触发下一页事件
  emit('next-page');
  
  // 发送当前页更新事件
  const nextPage = internalCurrentPage.value + 1;
  internalCurrentPage.value = nextPage;
  emit('update:currentPage', nextPage);
  emit('load-page', nextPage);
  // 延迟重置状态，允许数据加载完成
  setTimeout(() => {
    loadingNext.value = false;
    canLoadMore.value = true;
    
    // 在数据加载后保持相对滚动位置
    nextTick(() => {
      if (listContainer.value) {
        listContainer.value.scrollTop = scrollPosition;
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
  const contentHeight = listContainer.value.scrollHeight;
  
  // 触发上一页事件
  emit('prev-page');
  
  // 发送当前页更新事件
  const prevPage = internalCurrentPage.value - 1;
  internalCurrentPage.value = prevPage;
  emit('update:currentPage', prevPage);
   emit('load-page', prevPage);
  // 延迟重置状态，允许数据加载完成
  setTimeout(() => {
    loadingPrev.value = false;
    canLoadMore.value = true;
    
    // 在数据加载后尝试维持相对位置
    nextTick(() => {
      if (listContainer.value) {
        // 计算新的滚动位置以保持相对位置
        const newContentHeight = listContainer.value.scrollHeight;
        const heightDifference = newContentHeight - contentHeight;
        listContainer.value.scrollTop = heightDifference + listContainer.value.scrollTop;
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
  if (isScrollPagination.value && listContainer.value) {
    listContainer.value.scrollTop = 0;
  }
};

// 方法
const onRowClick = (row) => {
  emit('row-click', row);
};

const toggleSelection = (row, selected) => {
  if (selected) {
    if (!isSelected(row)) {
      selectedRows.value.push(row);
      row.isSelected = true;
    }
  } else {
    const index = selectedRows.value.findIndex(item =>
      props.rowKey ? item[props.rowKey] === row[props.rowKey] : item === row
    );
    if (index !== -1) {
      selectedRows.value.splice(index, 1);
      row.isSelected = false;
    }
  }
  emit('selection-change', selectedRows.value);
};

const isSelected = (row) => {
  return selectedRows.value.some(item =>
    props.rowKey ? item[props.rowKey] === row[props.rowKey] : item === row
  );
};

const clearSelection = () => {
  selectedRows.value = [];
  props.tableData.forEach(row => {
    row.isSelected = false;
  });
  emit('selection-change', []);
};

const toggleRowSelection = (row, selected) => {
  if (selected) {
    if (!isSelected(row)) {
      selectedRows.value.push(row);
      row.isSelected = true;
    }
  } else {
    const index = selectedRows.value.findIndex(item =>
      props.rowKey ? item[props.rowKey] === row[props.rowKey] : item === row
    );
    if (index !== -1) {
      selectedRows.value.splice(index, 1);
      row.isSelected = false;
    }
  }
  emit('selection-change', selectedRows.value);
};

const toggleAllSelection = () => {
  if (selectedRows.value.length === props.tableData.length) {
    clearSelection();
  } else {
    selectedRows.value = [...props.tableData];
    props.tableData.forEach(row => {
      row.isSelected = true;
    });
    emit('selection-change', selectedRows.value);
  }
};

// 以下方法保持API一致性，但在列表视图中不需要实际实现
const setCurrentRow = () => {
  // 列表视图不需要实现此方法，但需要保持API一致性
};

const clearSort = () => {
  // 列表视图不需要实现此方法，但需要保持API一致性
};

const clearFilter = () => {
  // 列表视图不需要实现此方法，但需要保持API一致性
};

const doLayout = () => {
  // 列表视图不需要实现此方法，但需要保持API一致性
  updateContainerStyles();
};

const sort = () => {
  // 列表视图不需要实现此方法，但需要保持API一致性
};

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
const handleMenuAction = (action) => {
  // 如果需要，可以在这里处理菜单动作
  console.log('菜单动作:', action);
};

// 暴露方法给父组件
defineExpose({
  toggleSelection,
  isSelected,
  clearSelection,
  toggleRowSelection,
  toggleAllSelection,
  setCurrentRow,
  clearSort,
  clearFilter,
  doLayout,
  sort,
  resetScrollState
});
</script>

<style lang="scss" scoped>
.list-view-container {
  position: relative;
  
  .list-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .list-item {
    display: flex;
    align-items: center;
    border-radius: 4px;
    transition: all 0.3s;
    background-color: var(--el-bg-color);
    padding: 12px 16px;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--el-box-shadow-light);
    }
    
    &.is-selected {
      border: 1px solid var(--el-color-primary);
      background-color: rgba(var(--el-color-primary-rgb), 0.05);
    }
    
    .list-item-selection {
      margin-right: 16px;
    }
    
    .list-item-content {
      flex: 1;
    }
  }
  
  .loading-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    gap: 8px;
    background-color: rgba(var(--el-color-primary-rgb), 0.05);
    border-radius: 4px;
    margin: 8px 0;
    
    .el-icon {
      animation: rotating 2s linear infinite;
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }
  
  .scroll-tip {
    text-align: center;
    padding: 8px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s;
    border-radius: 4px;
    
    &:hover {
      background-color: rgba(var(--el-color-primary-rgb), 0.05);
      color: var(--el-color-primary);
    }
  }
  
  .no-more-data {
    text-align: center;
    padding: 12px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    border-top: 1px dashed var(--el-border-color-lighter);
    margin-top: 8px;
  }
}

// 暗黑模式适配
:root[data-theme='dark'] {
  .list-item {
    background-color: var(--el-bg-color-overlay);
    
    &.is-selected {
      background-color: rgba(var(--el-color-primary-rgb), 0.15);
    }
  }
  
  .loading-indicator {
    background-color: rgba(var(--el-color-primary-rgb), 0.1);
  }
  
  .scroll-tip:hover {
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