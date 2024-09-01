<script>
import { config, parseData, columnSettingGet, columnSettingReset, columnSettingSave } from "./column";
import columnSetting from "./columnSetting.vue";
import { defineComponent } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

export default defineComponent({
  name: "scTable",
  components: {
    columnSetting
  },
  props: {
    tableName: { type: String, default: "" },
    url: { type: Function, default: () => {} },
    data: { type: Object, default: null },
    contextmenu: { type: Function, default: () => ({}) },
    params: { type: Object, default: () => ({}) },
    filter: {
      type: Object,
      default: () => {
        return;
      }
    },
    height: { type: [String, Number], default: "100%" },
    size: { type: String, default: "default" },
    border: { type: Boolean, default: false },
    stripe: { type: Boolean, default: false },
    pageSize: { type: Number, default: config.pageSize },
    pageSizes: { type: Array, default: config.pageSizes },
    rowKey: { type: String, default: "" },
    summaryMethod: { type: Function, default: null },
    rowClick: { type: Function, default: null },
    columns: { type: Object, default: () => {} },
    columnInTemplate: { type: Boolean, default: true },
    remoteSort: { type: Boolean, default: false },
    remoteFilter: { type: Boolean, default: false },
    remoteSummary: { type: Boolean, default: false },
    search: { type: Boolean, default: true },
    hidePagination: { type: Boolean, default: false },
    hideDo: { type: Boolean, default: false },
    hideRefresh: { type: Boolean, default: false },
    hideSetting: { type: Boolean, default: false },
    paginationLayout: { type: String, default: config.paginationLayout }
  },
  data() {
    return {
      scPageSize: this.pageSize,
      isActive: true,
      emptyText: "暂无数据",
      toggleIndex: 0,
      tableData: [],
      total: 0,
      currentPage: 1,
      prop: null,
      order: null,
      loading: false,
      tableHeight: "100%",
      tableParams: this.params,
      userColumn: [],
      customColumnShow: false,
      summary: {},
      config: {
        size: this.size,
        border: this.border,
        stripe: this.stripe
      }
    };
  },
  computed: {
    _height() {
      return Number(this.height) ? Number(this.height) + "px" : this.height;
    },
    _table_height() {
      return this.hidePagination && this.hideDo ? "100%" : "calc(100% - 50px)";
    }
  },
  watch: {
    //监听从props里拿到值了
    data() {
      this.tableData = this.data.data || this.data;
      this.total = this.data.total || this.tableData.length;
    },
    tableData: {
      immediate: !0,
      deep: !0,
      handler(newValue, oldValue) {
        if (this.apiObj) {
          return newValue;
        }

        if (!newValue || newValue.length == 0 || newValue.length <= this.pageSize) {
          return newValue;
        }

        if (this.hidePagination) {
          return newValue;
        }
        this.total = newValue.length;
        const rsValue = [];
        let cnt = 0;
        let endOffset = Math.min(this.currentPage * this.pageSize, this.total);
        let startOffset = (this.currentPage - 1) * this.pageSize;
        for (let index = 0; index <= newValue.length; index++) {
          let _value = newValue[index];
          if (!this.filter(_value)) {
            continue;
          }

          cnt++;
          if (cnt >= startOffset && cnt < endOffset) {
            rsValue.push(_value);
          }
        }

        this.tableData = rsValue;
        this.total = cnt;
        return rsValue;
      }
    },
    url() {
      this.tableParams = this.params;
      this.refresh();
    },
    columns() {
      this.userColumn = this.columns;
    }
  },
  mounted() {
    //判断是否开启自定义列
    if (this.columns) {
      this.getCustomColumn();
    } else {
      this.userColumn = this.columns;
    }

    if (!this.search) {
      return false;
    }
    //判断是否静态数据
    if (this.data) {
      this.tableData = this.data.data || this.data;
      this.total = this.data.total || this.tableData.length;
      return;
    }

    if (this.url) {
      this.getData();
    }
  },
  activated() {
    if (!this.isActive) {
      this.$refs.scTable.doLayout();
    }
  },
  deactivated() {
    this.isActive = false;
  },
  methods: {
    icon(icon) {
      return useRenderIcon(icon);
    },
    //获取列
    async getCustomColumn() {
      const userColumn = await columnSettingGet(this.tableName, this.columns);
      this.userColumn = userColumn;
    },
    //获取数据
    async getData() {
      this.loading = true;
      var reqData = {
        [config.request.page]: this.currentPage,
        [config.request.pageSize]: this.scPageSize,
        [config.request.prop]: this.prop,
        [config.request.order]: this.order
      };
      if (this.hidePagination) {
        delete reqData[config.request.page];
        delete reqData[config.request.pageSize];
      }
      if (this.tableParams instanceof FormData) {
        try {
          var res = await this.url(this.tableParams);
        } catch (error) {
          this.loading = false;
          this.emptyText = error?.statusText;
          return false;
        }
      } else {
        Object.assign(reqData, this.tableParams);
        try {
          delete reqData["undefined"];

          var res = await this.url(reqData);
        } catch (error) {
          this.loading = false;
          this.emptyText = error.statusText;
          return false;
        }
      }

      try {
        var response = parseData(res);
      } catch (error) {
        this.loading = false;
        this.emptyText = "数据格式错误";
        return false;
      }
      if (response.code != config.successCode) {
        this.loading = false;
        this.emptyText = response.msg;
      } else {
        this.emptyText = "暂无数据";
        if (this.hidePagination) {
          this.tableData = response.data || [];
        } else {
          this.tableData = response.rows || [];
        }
        this.total = response.total || 0;
        this.summary = response.summary || {};
        this.loading = false;
      }
      this.$refs.scTable.setScrollTop(0);
      this.$emit("dataChange", res, this.tableData, this.total);
    },
    //分页点击
    paginationChange() {
      if (this.url) {
        this.getData();
        return false;
      }
      this.tableData = this.data;
    },
    //条数变化
    pageSizeChange(size) {
      this.scPageSize = size;
      this.getData();
    },
    //刷新数据
    refresh() {
      this.$refs.scTable.clearSelection();
      this.getData();
    },
    //更新数据 合并上一次params
    upData(params, page = 1) {
      this.currentPage = page;
      this.$refs.scTable.clearSelection();
      Object.assign(this.tableParams, params || {});
      this.getData();
    },
    //重载数据 替换params
    reload(params, page = 1) {
      if (this.url) {
        this.currentPage = page;
        this.tableParams = params || {};
        this.$refs.scTable.clearSelection();
        this.$refs.scTable.clearSort();
        this.$refs.scTable.clearFilter();
        this.getData();
        return false;
      }
      this.tableData = this.data;
    },
    //自定义变化事件
    columnSettingChangeHandler(userColumn) {
      this.userColumn = userColumn;
      this.toggleIndex += 1;
    },
    //自定义列保存
    async columnSettingSaveHandler(userColumn) {
      this.$refs.columnSetting.isSave = true;
      try {
        await columnSettingSave(this.tableName, userColumn);
      } catch (error) {
        this.$message.error("保存失败");
        this.$refs.columnSetting.isSave = false;
      }
      this.$message.success("保存成功");
      this.$refs.columnSetting.isSave = false;
    },
    //自定义列重置
    async columnSettingBackHandler() {
      this.$refs.columnSetting.isSave = true;
      try {
        const column = await columnSettingReset(this.tableName, this.columns);
        this.userColumn = column;
        this.$refs.columnSetting.usercolumn = JSON.parse(JSON.stringify(this.userColumn || []));
      } catch (error) {
        this.$message.error("重置失败");
        this.$refs.columnSetting.isSave = false;
      }
      this.$refs.columnSetting.isSave = false;
    },
    onRowClick(obj) {
      this.rowClick(obj);
    },
    //排序事件
    sortChange(obj) {
      if (!this.remoteSort) {
        return false;
      }
      if (obj.column && obj.prop) {
        this.prop = obj.prop;
        this.order = obj.order;
      } else {
        this.prop = null;
        this.order = null;
      }
      this.getData();
    },
    //本地过滤
    filterHandler(value, row, column) {
      const property = column.property;
      return row[property] === value;
    },
    //过滤事件
    filterChange(filters) {
      if (!this.remoteFilter) {
        return false;
      }
      Object.keys(filters).forEach(key => {
        filters[key] = filters[key].join(",");
      });
      this.upData(filters);
    },
    //远程合计行处理
    remoteSummaryMethod(param) {
      const { columns } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = "合计";
          return;
        }
        const values = this.summary[column.property];
        if (values) {
          sums[index] = values;
        } else {
          sums[index] = "";
        }
      });
      return sums;
    },
    configSizeChange() {
      this.$refs.scTable.doLayout();
    },
    //插入行 unshiftRow
    unshiftRow(row) {
      this.tableData.unshift(row);
    },
    //插入行 pushRow
    pushRow(row) {
      this.tableData.push(row);
    },
    //根据key覆盖数据
    updateKey(row, rowKey = this.rowKey) {
      this.tableData
        .filter(item => item[rowKey] === row[rowKey])
        .forEach(item => {
          Object.assign(item, row);
        });
    },
    //根据index覆盖数据
    updateIndex(row, index) {
      Object.assign(this.tableData[index], row);
    },
    //根据index删除
    removeIndex(index) {
      this.tableData.splice(index, 1);
    },
    //根据index批量删除
    removeIndexes(indexes = []) {
      indexes.forEach(index => {
        this.tableData.splice(index, 1);
      });
    },
    //根据key删除
    removeKey(key, rowKey = this.rowKey) {
      this.tableData.splice(
        this.tableData.findIndex(item => item[rowKey] === key),
        1
      );
    },
    //根据keys批量删除
    removeKeys(keys = [], rowKey = this.rowKey) {
      keys.forEach(key => {
        this.tableData.splice(
          this.tableData.findIndex(item => item[rowKey] === key),
          1
        );
      });
    },
    //原生方法转发
    clearSelection() {
      this.$refs.scTable.clearSelection();
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
    }
  }
});
</script>
<template>
  <div ref="scTableMain" v-loading="loading" class="scTable bg-color" :style="{ height: _height }">
    <div class="scTable-table" :style="{ height: _table_height }">
      <el-table
        v-bind="$attrs"
        :key="toggleIndex"
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
        @sort-change="sortChange"
        @filter-change="filterChange"
      >
        <template v-for="(item, index) in userColumn" :key="index">
          <el-table-column
            v-if="!item.hide && columnInTemplate"
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
              <slot :name="item.prop" v-bind="scope">
                {{ item.handler ? item.handler(scope.row) : scope.row[item.prop] }}
              </slot>
            </template>
          </el-table-column>
        </template>
        <slot />
        <template #empty>
          <el-empty :description="emptyText" :image-size="100" />
        </template>
      </el-table>
    </div>
    <div v-if="!hidePagination || !hideDo" class="scTable-page">
      <div class="scTable-pagination">
        <el-pagination
          v-if="!hidePagination"
          v-model:currentPage="currentPage"
          background
          :size="config.size"
          :layout="paginationLayout"
          :total="total"
          :page-size="scPageSize"
          :page-sizes="pageSizes"
          @current-change="paginationChange"
          @update:page-size="pageSizeChange"
        />
      </div>
      <div v-if="!hideDo" class="scTable-do">
        <el-button v-if="!hideRefresh" :icon="icon('ep:refresh')" circle style="margin-left: 15px" @click="refresh" />
        <el-popover v-if="columns" placement="top" title="列设置" :width="500" trigger="click" :hide-after="0" @show="customColumnShow = true" @after-leave="customColumnShow = false">
          <template #reference>
            <el-button :icon="icon('ep:set-up')" circle style="margin-left: 15px" />
          </template>
          <columnSetting v-if="customColumnShow" ref="columnSetting" :column="userColumn" @userChange="columnSettingChangeHandler" @save="columnSettingSaveHandler" @back="columnSettingBackHandler" />
        </el-popover>
        <el-popover v-if="!hideSetting" placement="top" title="表格设置" :width="400" trigger="click" :hide-after="0">
          <template #reference>
            <el-button :icon="icon('ep:setting')" circle style="margin-left: 15px" />
          </template>
          <el-form label-width="80px" label-position="left">
            <el-form-item label="表格尺寸">
              <el-radio-group v-model="config.size" size="small" @change="configSizeChange">
                <el-radio-button value="large">大</el-radio-button>
                <el-radio-button value="default">正常</el-radio-button>
                <el-radio-button value="small">小</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="样式">
              <el-checkbox v-model="config.border" label="纵向边框" />
              <el-checkbox v-model="config.stripe" label="斑马纹" />
            </el-form-item>
          </el-form>
        </el-popover>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-color {
  background-color: var(--el-bg-color);
}
.scTable-table {
  height: calc(100% - 50px);
}

.scTable-page {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
}

.scTable-do {
  white-space: nowrap;
}

.scTable:deep(.el-table__footer) .cell {
  font-weight: bold;
}

.scTable:deep(.el-table__body-wrapper) .el-scrollbar__bar.is-horizontal {
  height: 12px;
  border-radius: 12px;
}

.scTable:deep(.el-table__body-wrapper) .el-scrollbar__bar.is-vertical {
  width: 12px;
  border-radius: 12px;
}
</style>
