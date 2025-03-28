<template>
  <div class="list-view-container h-full">
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

<script>
export default {
  name: 'ListView',
  inheritAttrs: false,
  props: {
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
    height: String,
    columnInTemplate: Boolean,
    toggleIndex: Number,
    emptyText: {
      type: String,
      default: '暂无数据'
    }
  },
  data() {
    return {
      selectedRows: [],
      currentPage: 1
    };
  },
  computed: {
    // 当前页数据
    currentDataList() {
      return this.tableData;
    },
    // 获取第一列作为标题
    firstColumn() {
      return this.userColumn.find(col => !col.hide && col.prop !== 'selection');
    },
    // 获取除第一列外的其他列作为列表内容
    displayColumns() {
      return this.userColumn.filter(col =>
        !col.hide &&
        col.prop !== 'selection' &&
        col.prop !== this.firstColumn?.prop
      );
    },
    // 判断是否有选择列
    hasSelectionColumn() {
      return this.userColumn.some(col => col.prop === 'selection');
    }
  },
  methods: {
    // 行点击事件
    onRowClick(row) {
      this.$emit('row-click', row);
    },

    // 切换选择状态
    toggleSelection(row, selected) {
      if (selected) {
        if (!this.isSelected(row)) {
          this.selectedRows.push(row);
          row.isSelected = true;
        }
      } else {
        const index = this.selectedRows.findIndex(item =>
          this.rowKey ? item[this.rowKey] === row[this.rowKey] : item === row
        );
        if (index !== -1) {
          this.selectedRows.splice(index, 1);
          row.isSelected = false;
        }
      }
      this.$emit('selection-change', this.selectedRows);
    },

    // 判断行是否被选中
    isSelected(row) {
      return this.selectedRows.some(item =>
        this.rowKey ? item[this.rowKey] === row[this.rowKey] : item === row
      );
    },

    // 清除所有选择
    clearSelection() {
      this.selectedRows = [];
      this.tableData.forEach(row => {
        row.isSelected = false;
      });
      this.$emit('selection-change', []);
    },

    // 设置行的选择状态
    toggleRowSelection(row, selected) {
      if (selected) {
        if (!this.isSelected(row)) {
          this.selectedRows.push(row);
          row.isSelected = true;
        }
      } else {
        const index = this.selectedRows.findIndex(item =>
          this.rowKey ? item[this.rowKey] === row[this.rowKey] : item === row
        );
        if (index !== -1) {
          this.selectedRows.splice(index, 1);
          row.isSelected = false;
        }
      }
      this.$emit('selection-change', this.selectedRows);
    },

    // 全选
    toggleAllSelection() {
      if (this.selectedRows.length === this.tableData.length) {
        this.clearSelection();
      } else {
        this.selectedRows = [...this.tableData];
        this.tableData.forEach(row => {
          row.isSelected = true;
        });
        this.$emit('selection-change', this.selectedRows);
      }
    },

    // 设置当前行
    setCurrentRow() {
      // 列表视图不需要实现此方法，但需要保持API一致性
    },

    // 清除排序
    clearSort() {
      // 列表视图不需要实现此方法，但需要保持API一致性
    },

    // 清除过滤
    clearFilter() {
      // 列表视图不需要实现此方法，但需要保持API一致性
    },

    // 重新布局
    doLayout() {
      // 列表视图不需要实现此方法，但需要保持API一致性
    },

    // 排序
    sort() {
      // 列表视图不需要实现此方法，但需要保持API一致性
    }
  }
};
</script>

<style lang="scss" scoped>
.list-view-container {
  overflow: auto;
  padding: 8px;
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-item {
  display: flex;
  align-items: center;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateX(5px);
  }

  &.is-selected {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);

    &:hover {
      box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }
}

.list-item-selection {
  margin-right: 16px;
}

.list-item-content {
  flex: 1;
  display: flex;
  align-items: center;
}

// 动画效果
.list-item {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>