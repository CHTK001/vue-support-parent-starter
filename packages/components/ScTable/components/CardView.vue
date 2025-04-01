:<template>
  <div class="card-view-container h-full flex justify-center items-center">
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
  </div>
</template>

<script>
export default {
  name: 'CardView',
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
    height: [String, Number],
    columnInTemplate: Boolean,
    toggleIndex: Number,
    emptyText: String
  },
  emits: ['row-click', 'selection-change'],
  data() {
    return {
      currentDataList: [],
      selectedRows: []
    }
  },
  watch: {
    tableData: {
      immediate: true,
      handler(newVal, oldVal) {
        this.currentDataList = newVal;
      }
    }
  },
  computed: {
     // 计算当前页的数据
    computedPageSize() {
      return Math.ceil(24 / (this.pageSize / 3));
    },
    // 获取第一列作为卡片标题
    firstColumn() {
      return this.userColumn.find(col => !col.hide && col.prop !== 'selection');
    },
    // 获取除第一列外的其他列作为卡片内容
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
    },
    // 判断是否有操作列插槽
    hasActionSlot() {
      return !!this.$slots.action;
    }
  },
  methods: {
    // 行点击事件
    onRowClick(row) {
      this.$emit('row-click', row);
    },

    // 切换选择状态
    toggleSelection(row) {
      const index = this.selectedRows.findIndex(item =>
        this.rowKey ? item[this.rowKey] === row[this.rowKey] : item === row
      );

      if (index === -1) {
        this.selectedRows.push(row);
        row.isSelected = true;
      } else {
        this.selectedRows.splice(index, 1);
        row.isSelected = false;
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

    // 获取当前选中的行
    getSelectionRows() {
      return this.selectedRows;
    },

    // 布局重置
    doLayout() {
      // 卡片布局不需要特殊处理
    }
  }
}
</script>

<style lang="scss" scoped>
.card-view-container {
  width: 100%;
  padding: 16px;

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