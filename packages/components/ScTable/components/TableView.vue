<template>
  <el-table 
    v-bind="$attrs" 
    :key="toggleIndex" 
    class="modern-table w-full" 
    ref="scTable" 
    :data="tableData"
    :row-contextmenu="contextmenu" 
    :row-key="rowKey" 
    :height="height == 'auto' ? null : '100%'"
    :size="config.size" 
    :border="config.border" 
    :stripe="config.stripe"
    :summary-method="remoteSummary ? remoteSummaryMethod : summaryMethod" 
    @row-click="onRowClick"
    @selection-change="selectionChange" 
    @sort-change="sortChange" 
    @filter-change="filterChange"
  >
    <template v-for="(item, index) in userColumn" :key="index">
      <el-table-column 
        v-if="(!item.hide || !item?.handleHide(item)) && columnInTemplate"
        :column-key="item.prop" 
        :label="item.label" 
        :prop="item.prop" 
        :width="item.width"
        :sortable="item.sortable" 
        :fixed="item.fixed" 
        :align="item.align || 'center'" 
        :filters="item.filters"
        :filter-method="remoteFilter || !item.filters ? null : filterHandler" 
        show-overflow-tooltip
      >
        <template #default="scope">
          <slot :name="item.prop" v-bind="scope" :row="scope.row">
            {{ item.formatter ? item.formatter(scope.row) : (scope.row[item.prop] || (item.defaultValue || '-')) }}
          </slot>
        </template>
      </el-table-column>
    </template>
    <slot />
    <template #empty>
      <el-empty :description="emptyText" :image-size="100" />
    </template>
  </el-table>
</template>

<script>
export default {
  name: 'TableView',
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
    remoteFilter: Boolean,
    remoteSummary: Boolean,
    summaryMethod: Function,
    toggleIndex: Number,
    emptyText: String
  },
  emits: ['row-click', 'selection-change', 'sort-change', 'filter-change'],
  methods: {
 //原生方法转发
    clearSelection() {
      this.$refs.scTable?.clearSelection();
    },
    toggleRowSelection(row, selected) {
      this.$refs.scTable.toggleRowSelection(row, selected);
    },
    toggleAllSelection() {
      this.$refs.scTable.toggleAllSelection();
    },
    toggleRowExpansion(row, expanded) {
      this.$refs.scTable.toggleRowExpansion(row, expanded);
    },
    setCurrentRow(row) {
      this.$refs.scTable.setCurrentRow(row);
    },
    clearSort() {
      this.$refs.scTable.clearSort();
    },
    clearFilter(columnKey) {
      this.$refs.scTable.clearFilter(columnKey);
    },
    doLayout() {
      this.$refs.scTable.doLayout();
    },
    sort(prop, order) {
      this.$refs.scTable.sort(prop, order);
    },
    onRowClick(row) {
      this.$emit('row-click', row)
    },
    selectionChange(selection) {
      this.$emit('selection-change', selection)
    },
    sortChange(sort) {
      this.$emit('sort-change', sort)
    },
    filterChange(filters) {
      this.$emit('filter-change', filters)
    },
    filterHandler(value, row, column) {
      const property = column.property
      return row[property] === value
    },
    remoteSummaryMethod(param) {
      const { columns } = param
      const sums = []
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计'
          return
        }
        const values = this.summary[column.property]
        if (values) {
          sums[index] = values
        } else {
          sums[index] = ''
        }
      })
      return sums
    }
  }
}
</script>

<style lang="scss" scoped>
.modern-table {
  :deep(.el-table__header) {
    background: rgba(var(--el-color-primary-rgb), 0.02);
    
    th {
      font-weight: 600;
      color: var(--el-text-color-primary);
      
      &.is-sortable:hover {
        background: rgba(var(--el-color-primary-rgb), 0.04);
      }
    }
  }
  
  :deep(.el-table__body) {
    tr {
      transition: all 0.3s;
      
      &:hover {
        background: rgba(var(--el-color-primary-rgb), 0.04);
        transform: translateY(-1px);
      }
      
      td {
        transition: all 0.3s;
      }
    }
  }
  
  :deep(.el-table__footer) {
    .cell {
      font-weight: bold;
    }
  }
  
  :deep(.el-scrollbar__bar) {
    &.is-horizontal {
      height: 8px;
      border-radius: 4px;
    }
    
    &.is-vertical {
      width: 8px;
      border-radius: 4px;
    }
  }
}
</style>