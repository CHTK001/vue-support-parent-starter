<template>
  <div class="card-view-container h-full" ref="cardContainer" :class="{
    'flex justify-center items-center': !currentDataList || currentDataList.length === 0
  }" @scroll="handleScroll">
    <!-- 卡片为空时显示空状态 -->
    <template v-if="!currentDataList || currentDataList.length === 0">
      <el-empty :description="emptyText" :image-size="100" />
    </template>

    <!-- 卡片网格布局 -->
    <el-row :gutter="16" v-else>
      <el-col v-for="(row, index) in currentDataList" :key="rowKey ? row[rowKey] : index" :xs="computedPageSize" :sm="computedPageSize"
        :md="computedPageSize" :lg="computedPageSize" :xl="computedPageSize" class="card-col">
        <slot :row="row" :index="index"></slot>
      </el-col>
    </el-row>
    
    <!-- 加载更多指示器 -->
    <div v-if="isScrollPagination && loading" class="loading-more flex justify-center items-center py-4">
      <el-icon class="is-loading mr-2"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zm448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32zm-640 0a32 32 0 0 1-32 32H96a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32zM195.2 195.2a32 32 0 0 1 45.248 0L376.32 331.008a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248zm452.544 452.544a32 32 0 0 1 45.248 0L828.8 783.552a32 32 0 0 1-45.248 45.248L647.744 692.992a32 32 0 0 1 0-45.248zM828.8 195.264a32 32 0 0 1 0 45.184L692.992 376.32a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0zm-452.544 452.48a32 32 0 0 1 0 45.248L240.448 828.8a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0z"></path></svg></el-icon>
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, useSlots, onMounted, onUnmounted, nextTick } from 'vue';

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
  pageSize: Number,
  paginationType: {
    type: String,
    default: 'current'
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// 定义emits
const emit = defineEmits(['row-click', 'selection-change', 'load-more']);

// 响应式数据
const currentDataList = ref([]);
const selectedRows = ref([]);
const slots = useSlots();
const cardContainer = ref(null);
const isScrolling = ref(false);
const scrollThreshold = 100; // 距离底部多少像素时触发加载
const canLoadMore = ref(true);

// 计算属性
const isScrollPagination = computed(() => {
  return props.paginationType === 'scroll';
});

// 监听tableData变化
watch(() => props.tableData, (newVal) => {
  if (isScrollPagination.value && currentDataList.value.length > 0 && newVal.length > 0) {
    // 滚动分页模式下，追加新数据而不是替换
    const existingIds = new Set(currentDataList.value.map(item => props.rowKey ? item[props.rowKey] : JSON.stringify(item)));
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
}, { immediate: true });

// 滚动事件处理
const handleScroll = () => {
  if (!isScrollPagination.value || !canLoadMore.value || props.loading) {
    return;
  }
  
  const container = cardContainer.value;
  if (!container) return;
  
  const scrollHeight = container.scrollHeight;
  const scrollTop = container.scrollTop;
  const clientHeight = container.clientHeight;
  
  // 当滚动到接近底部时触发加载更多
  if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
    loadMore();
  }
};

// 加载更多数据
const loadMore = () => {
  if (!canLoadMore.value || props.loading) return;
  
  canLoadMore.value = false; // 防止重复触发
  emit('load-more');
};

// 生命周期钩子
onMounted(() => {
  if (isScrollPagination.value && cardContainer.value) {
    // 设置容器样式以支持滚动
    cardContainer.value.style.overflowY = 'auto';
    cardContainer.value.style.height = props.height ? 
      (typeof props.height === 'number' ? `${props.height}px` : props.height) : 
      '100%';
  }
});

onUnmounted(() => {
  // 清理工作
});

// 计算属性
const computedPageSize = computed(() => {
  return Math.ceil(24 / props.colSize);
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

const hasActionSlot = computed(() => {
  return !!slots.action;
});

// 方法
const onRowClick = (row) => {
  emit('row-click', row);
};

const toggleSelection = (row) => {
  const index = selectedRows.value.findIndex(item =>
    props.rowKey ? item[props.rowKey] === row[props.rowKey] : item === row
  );

  if (index === -1) {
    selectedRows.value.push(row);
    row.isSelected = true;
  } else {
    selectedRows.value.splice(index, 1);
    row.isSelected = false;
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

const getSelectionRows = () => {
  return selectedRows.value;
};

const doLayout = () => {
  // 卡片布局不需要特殊处理
};

// 暴露方法给父组件
defineExpose({
  toggleSelection,
  isSelected,
  clearSelection,
  toggleRowSelection,
  toggleAllSelection,
  getSelectionRows,
  doLayout
});
</script>

<style lang="scss" scoped>
.card-view-container {
  width: 100%;
  padding: 16px;
  overflow-y: auto; /* 启用垂直滚动 */

  .card-col {
    margin-bottom: 16px;
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
}

// 暗黑模式适配
:root[data-theme='dark'] {
  .card-item {
    background-color: var(--el-bg-color-overlay);

    &.is-selected {
      box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.5);
    }
  }
}
</style>