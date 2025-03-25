<script>
import { config, parseData, columnSettingGet, columnSettingReset, columnSettingSave } from "./column";
import { defineAsyncComponent, defineComponent, markRaw } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { paginate, deepCopy } from "@repo/utils";
import TableView from './components/TableView.vue'
export default defineComponent({
  name: "scTable",
  components: {
    columnSetting: defineAsyncComponent(() => import("./columnSetting.vue")),
    TableView
  },
  props: {
    tableName: { type: String, default: "" },
    url: { type: Function, default: null },
    data: { type: Object, default: null },
    contextmenu: { type: Function, default: () => ({}) },
    params: { type: Object, default: () => ({}) },
    filter: {
      type: Object,
      default: () => {
        return;
      }
    },
    /**是否开启缓存 */
    cacheable: { type: Boolean, default: false },
    countDownable: { type: Boolean, default: false },
    countDownTime: { type: Number, default: 10 },
    countDownText: { type: String, default: "刷新" },
    /**开启缓存后缓存页数 */
    cachePage: { type: Number, default: 3 },
    height: { type: [String, Number], default: "100%" },
    size: { type: String, default: "default" },
    border: { type: Boolean, default: false },
    stripe: { type: Boolean, default: false },
    pageSize: { type: Number, default: config.pageSize },
    pageSizes: { type: Array, default: config.pageSizes },
    rowKey: { type: String, default: "" },
    summaryMethod: { type: Function, default: null },
    rowClick: { type: Function, default: () => { } },
    columns: { type: Object, default: () => { } },
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
      selectCacheData: {},
      customColumnShow: false,
      summary: {},
      cacheData: {},
      config: {
        size: this.size,
        border: this.border == "true",
        stripe: this.stripe,
        countDownable: this.countDownable
      },
      customCountDownTime: 10,
      timer: null
    };
  },
  computed: {
    _height() {
      return Number(this.height) ? Number(this.height) + "px" : this.height;
    },
    _table_height() {
      return this.hidePagination && this.hideDo ? "100%" : "calc(100% - 55px)";
    },
    countDown() {
      const minutes = Math.floor(this.customCountDownTime / 60);
      const seconds = this.customCountDownTime % 60;
      return {
        minutes: minutes,
        seconds: seconds
      };
    }
  },
  watch: {
    /**
     * 监听是否开启定时刷新
     */
    "config.countDownable": {
      immediate: !0,
      handler(newValue) {
        this.closeTimer();
        if (newValue) {
          this.openTimer();
        }
      }
    },
    //监听从props里拿到值了
    data() {
      this.tableData = this.data.data || this.data;
      this.total = this.data.total || this.tableData.lenwgth;
    },
    // tableData: {
    //   immediate: !0,
    //   deep: !0,
    //   handler(newValue, oldValue) {
    //     if (this.apiObj) {
    //       return newValue;
    //     }

    //     if (!newValue || newValue.length == 0 || newValue.length <= this.pageSize) {
    //       return newValue;
    //     }

    //     if (oldValue.length == 0) {
    //       this.getData(true);
    //     }
    //     return newValue;
    //   }
    // },
    url() {
      this.tableParams = this.params;
      this.refresh();
    },
    columns() {
      this.userColumn = this.columns;
    }
  },
  unmounted() {
    this.closeTimer();
  },
  mounted() {
    this.config.border = this.border;
    this.config.stripe = this.stripe;
    this.config.size = this.size;
    this.customCountDownTime = this.countDownTime;
    //判断是否开启自定义列
    if (this.columns) {
      this.getCustomColumn();
    } else {
      this.userColumn = this.columns;
    }

    if (!this.search) {
      return false;
    }
    this.getData(true);
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
    openTimer() {
      this.timer = setInterval(() => {
        this.customCountDownTime--;
        if (this.customCountDownTime <= 0) {
          this.$emit("finish");
          this.getData(false);
          this.customCountDownTime = this.countDownTime;
        }
      }, 1000);
    },
    closeTimer() {
      this.timer && clearInterval(this.timer);
    },
    icon(icon) {
      return useRenderIcon(icon);
    },
    //获取列
    async getCustomColumn() {
      const userColumn = await columnSettingGet(this.tableName, this.columns);
      this.userColumn = userColumn;
    },
    /**
     * 获取静态数据
     */
    async getStatisticData(loading) {
      this.loading = loading;
      const newTableData = this.data.data || this.data;
      this.total = this.data.total || newTableData.length;
      const page = this.currentPage;
      const pageSize = this.scPageSize;
      const { data, total } = paginate(newTableData, pageSize, page, this.filter);
      this.loading = false;
      this.tableData = data;//Object.freeze(data);
      this.total = total;
      this.resetSelectedValue();
      this.loaded();
    },

    /**
     * 获取分页大小
     */
    getPageSize() {
      if (this.cacheable && this.cachePage > 0) {
        return this.scPageSize * this.cachePage;
      }

      return this.scPageSize;
    },
    /**
     * 获取远程数据
     */
    async getRemoteData(loading) {
      if (this.cacheData[this.currentPage]) {
        this.tableData = this.cacheData[this.currentPage];
        return;
      }

      this.cacheData = {};
      this.loading = loading;
      var reqData = {
        [config.request.page]: this.currentPage,
        [config.request.pageSize]: this.getPageSize(),
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
          this.loaded();
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
          this.loaded();
          return false;
        }
      }

      try {
        var response = parseData(res);
      } catch (error) {
        this.loading = false;
        this.emptyText = "数据格式错误";
        this.loaded();
        return false;
      }
      if (response.code != config.successCode) {
        this.loading = false;
        this.emptyText = response.msg;
      } else {
        this.emptyText = "暂无数据";
        this.rebuildCache(response);
      }
      this.$emit("dataChange", res, this.tableData, this.total);
      this.loaded();
    },

    async rebuildCache(response) {
      if (this.hidePagination) {
        this.tableData = response.data || [];
      } else {
        this.tableData = response.rows || [];
      }

      if (this.cacheable) {
        for (var index = 0; index < this.cachePage; index++) {
          this.cacheData[this.currentPage + index] = this.tableData.slice(index * this.scPageSize, (index + 1) * this.scPageSize);
        }
        this.tableData = this.cacheData[this.currentPage];
      }
      if (this.currentPage == 1) {
        this.total = response.total || 0;
        this.summary = response.summary || {};
      }
      this.loading = false;
      this.resetSelectedValue();
    },
    //获取数据
    async getData(loading) {
      //判断是否静态数据
      if (this.data) {
        this.getStatisticData(loading);
        return;
      }

      this.getRemoteData(loading);
    },
    loaded() {
      this.$emit("loaded");
    },
    //分页点击
    paginationChange() {
      this.getData(true);
    },
    //条数变化
    pageSizeChange(size) {
      this.scPageSize = size;
      this.getData(true);

    },
    //刷新数据
    refresh() {
      this.$refs.scTable?.clearSelection();
      this.clearSelectionValue();
      this.getData(true);
    },
    //更新数据 合并上一次params
    upData(params, page = 1) {
      this.currentPage = page;
      this.$refs.scTable?.clearSelection();
      this.clearSelectionValue();
      Object.assign(this.tableParams, params || {});
      this.getData(true);
    },
    //更新数据, 合并原始数据
    updateData(updateData, filter) {
      const _updateData = updateData;
      for (let index = 0; index < this.tableData.length; index++) {
        const element = this.tableData[index];
        if (filter(element)) {
          deepCopy(element, _updateData)
          break;
        }
      }
    },
    //重载数据 替换params
    reload(params, page = 1) {
      if (this.url) {
        this.currentPage = page;
        this.tableParams = params || {};
        this.$refs.scTable?.clearSelection();
        this.$refs.scTable?.clearSort();
        this.$refs.scTable?.clearFilter();
        this.clearSelectionValue();
        this.getData(true);
        return false;
      }
      this.getData(true);
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
      this.getData(true);
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
    selectionChange(values) {
      this.selectCacheData[this.currentPage] = values;
    },
    clearSelectionValue() {
      this.$refs.scTable.clearSelection();
      this.selectCacheData = {};
    },
    resetSelectedValue() {
      const _this = this
      this.$nextTick(async () => {
        const selectedValues = this.selectCacheData[this.currentPage];
        if (selectedValues) {
          selectedValues.forEach(it => {
            _this.$refs.scTable.toggleRowSelection(it, true)
          });
        }
      })
    },
    getSelection() {
      return Object.values(this.selectCacheData).flat();
    }
  }
});
</script>
<template>
  <div :style="{ height: _height}" class="modern-table-container">
    <el-skeleton :loading="loading" animated :style="{ height: _table_height }">
      <template #default>
        <div ref="scTableMain" class="sc-table-wrapper" :style="{ height: _table_height }">
          <div class="sc-table-content" :style="{ height: _table_height }">
            <TableView
              ref="scTable"
              v-bind="$attrs"
              :table-data="tableData"
              :user-column="userColumn"
              :config="config"
              :contextmenu="contextmenu"
              :row-key="rowKey"
              :height="height"
              :column-in-template="columnInTemplate"
              :remote-filter="remoteFilter"
              :remote-summary="remoteSummary"
              :summary-method="summaryMethod"
              :toggle-index="toggleIndex"
              :empty-text="emptyText"
              @row-click="onRowClick"
              @selection-change="selectionChange"
              @sort-change="sortChange"
              @filter-change="filterChange"
            >
              <slot />
            </TableView>
          </div>
        </div>
      </template>
    </el-skeleton>
    
    <!-- 分页和操作区域保持不变 -->
    <div v-if="!hidePagination || !hideDo" class="table-footer">
      <div class="scTable-pagination">
        <el-pagination
          v-if="!hidePagination"
          v-model:currentPage="currentPage"
          background
          :small="false"
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
        <el-popover v-if="column" placement="top" title="列设置" :width="500" trigger="click" :hide-after="0" @show="customColumnShow = true" @after-leave="customColumnShow = false">
          <template #reference>
            <el-button :icon="icon('ep:set-up')" circle style="margin-left: 15px" />
          </template>
          <columnSetting v-if="customColumnShow" ref="columnSetting" :column="userColumn" @userChange="columnSettingChange" @save="columnSettingSave" @back="columnSettingBack" />
        </el-popover>
        <el-popover v-if="!hideSetting" placement="top" title="表格设置" :width="400" trigger="click" :hide-after="0">
          <template #reference>
            <el-button :icon="icon('ep:setting')" circle style="margin-left: 15px" />
          </template>
          <el-form label-width="80px" label-position="left">
            <el-form-item label="表格尺寸">
              <el-radio-group v-model="config.size" size="small" @change="configSizeChange">
                <el-radio-button label="large">大</el-radio-button>
                <el-radio-button label="default">正常</el-radio-button>
                <el-radio-button label="small">小</el-radio-button>
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

<style lang="scss" scoped>
.modern-table-container {
  position: relative;
  overflow: hidden;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.sc-table-wrapper {
  overflow: auto;
  position: relative;
  flex: 1;
  width: 100%;
}

.sc-table-content {
  height: calc(100% - 50px);
  position: absolute;
  width: 100%;
}

.table-footer {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  position: absolute;
  bottom: 55px;
  width: 100%;
  background: var(--el-bg-color);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  box-shadow:
    0 -4px 20px rgba(0, 0, 0, 0.06),
    0 2px 6px rgba(0, 0, 0, 0.03);
  z-index: 10;
  margin: 7px 0px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.95);
    box-shadow:
      0 -4px 24px rgba(0, 0, 0, 0.08),
      0 2px 8px rgba(0, 0, 0, 0.04);
  }
}
</style>