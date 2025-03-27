<template>
  <div class="card-view-container">
    <!-- 卡片为空时显示空状态 -->
    <template v-if="tableData.length === 0">
      <el-empty :description="emptyText" :image-size="100" />
    </template>

    <!-- 卡片网格布局 -->
    <el-row :gutter="16" v-else>
      <el-col v-for="(row, index) in tableData" :key="rowKey ? row[rowKey] : index" :xs="24" :sm="12" :md="8" :lg="6"
        :xl="4" class="card-col">
        <el-card shadow="hover" class="card-item" :class="{ 'is-selected': isSelected(row) }" @click="onRowClick(row)">
          <!-- 卡片头部 -->
          <template #header>
            <div class="card-header">
              <!-- 选择框 -->
              <el-checkbox v-if="hasSelectionColumn" v-model="row.isSelected" @click.stop="toggleSelection(row)" />

              <!-- 标题 - 使用第一列作为标题 -->
              <div class="card-title">
                <slot :name="firstColumn?.prop" :row="row" :$index="index">
                  {{ firstColumn?.formatter ? firstColumn.formatter(row) : (row[firstColumn?.prop] || '-') }}
                </slot>
              </div>
            </div>
          </template>

          <!-- 卡片内容 -->
          <div class="card-content">
            <div v-for="item in displayColumns" :key="item.prop" class="card-field">
              <div class="field-label">{{ item.label }}</div>
              <div class="field-value">
                <slot :name="item.prop" :row="row" :$index="index">
                  {{ item.formatter ? item.formatter(row) : (row[item.prop] || (item.defaultValue || '-')) }}
                </slot>
              </div>
            </div>
          </div>

          <!-- 卡片操作区 -->
          <div class="card-actions" v-if="hasActionSlot">
            <slot name="action" :row="row" :$index="index"></slot>
          </div>
        </el-card>
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
      selectedRows: []
    }
  },
  computed: {
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