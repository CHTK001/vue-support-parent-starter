<template>
  <div class="list-view-container thin-scrollbar" ref="listContainer" :style="containerStyle">
    <!-- 列表为空时显示空状态 -->
    <template v-if="!currentDataList || currentDataList.length === 0">
      <el-empty :description="emptyText" :image-size="100" />
    </template>

    <!-- 列表布局 -->
    <div v-else class="list-items">
      <div v-for="(row, index) in currentDataList" :key="rowKey ? row[rowKey] : index" class="list-item"
        :class="{ 'is-selected': isSelected(row) }" @click="onRowClick(row)">
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
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue';

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
  }
});

// 定义emits
const emit = defineEmits(['row-click', 'selection-change']);

// 响应式数据
const selectedRows = ref([]);
const currentPage = ref(1);
const listContainer = ref(null);

// 计算容器样式
const containerStyle = computed(() => {
  const style = {
    width: '100%',
    padding: '8px',
    overflowY: 'auto',
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
  sort
});
</script>

<style lang="scss" scoped>
.list-view-container {
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
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--el-box-shadow-light);
  }
  
  &.is-selected {
    border-color: var(--el-color-primary);
    background-color: rgba(var(--el-color-primary-rgb), 0.05);
  }
  
  .list-item-selection {
    margin-right: 16px;
  }
  
  .list-item-content {
    flex: 1;
    }
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
}
</style>