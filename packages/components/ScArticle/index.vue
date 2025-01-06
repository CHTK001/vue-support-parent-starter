<script>
/**
    id: 452,
    blog_class: '42',
    title: 'Node.js + Docker自动化部署',
    count: 56,
    create_time: '2024-08-26T00:00:00.000Z',
    home_img: '',
    brief:
      '本章将介绍 Node.js 使用 Docker 、Webhook 自动化部署、蓝绿部署、项目到服务器。1、Mac os 安装 Docker 客户端 OrbStack我这里使用的是第三方客户端，相比于官方的，较轻量，启动速度快OrbStack 是一种快速、轻便且简单的运行 Docker 容器和 Linux 的方法。使用我们的 Docker Desktop 替代方案以光速进行开发。下载地址： http',
    type_name: 'Node.js',
    html_content: ''
 */
import { config, parseData, columnSettingGet, columnSettingReset, columnSettingSave } from "./column";
import columnSettingLayout from "./columnSetting.vue";
import { defineComponent, markRaw } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { paginate } from "@repo/utils";
import { useDateFormat } from '@vueuse/core'
const columnSetting = markRaw(columnSettingLayout);
export default defineComponent({
  name: "ScArticle",
  components: {
    columnSetting
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
    appendable: { type: Boolean, default: false },
    countDownable: { type: Boolean, default: false },
    countDownTime: { type: Number, default: 10 },
    countDownText: { type: String, default: "刷新" },
    /**是否开启缓存 */
    cacheable: { type: Boolean, default: false },
    /**开启缓存后缓存页数 */
    cachePage: { type: Number, default: 3 },
    height: { type: [String, Number], default: "100%" },
    size: { type: String, default: "default" },
    border: { type: Boolean, default: false },
    stripe: { type: Boolean, default: false },
    span: { type: Number, default: 6 },
    xs: { type: Number, default: 6 },
    lg: { type: Number, default: 6 },
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
      customColumnShow: false,
      summary: {},
      cacheData: {},
      config: {
        size: this.size,
        border: this.border,
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
      return this.hidePagination && this.hideDo ? "100%" : "calc(100% - 70px)";
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
  unmounted() {
    this.closeTimer();
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
    useDateFormat,
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
      // this.total = this.data.total || newTableData.length;
      const page = this.currentPage;
      const pageSize = this.scPageSize;
      const { data, total } = paginate(newTableData, pageSize, page, this.filter);
      this.loading = false;
      this.tableData = data;
      this.total = total;
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
      var res = {};
      if (this.tableParams instanceof FormData) {
        try {
          res = await this.url(this.tableParams);
        } catch (error) {
          this.loading = false;
          this.emptyText = error?.statusText;
          return false;
        }
      } else {
        Object.assign(reqData, this.tableParams);
        try {
          delete reqData["undefined"];

          res = await this.url(reqData);
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
        this.rebuildCache(response);
      }
      this.$emit("dataChange", res, this.tableData, this.total);
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
      this.total = response.total || 0;
      this.summary = response.summary || {};
      this.loading = false;
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
    //分页点击
    paginationChange() {
      if (this.url) {
        this.getData(true);
        return false;
      }
      this.tableData = this.data;
    },
    //条数变化
    pageSizeChange(size) {
      this.scPageSize = size;
      this.getData(true);
    },
    //刷新数据
    refresh() {
      this.getData(true);
    },
    //更新数据 合并上一次params
    upData(params, page = 1) {
      this.currentPage = page;
      this.$refs.scTable?.clearSelection();
      Object.assign(this.tableParams, params || {});
      this.getData(true);
    },
    //重载数据 替换params
    reload(params, page = 1) {
      if (this.url) {
        this.currentPage = page;
        this.tableParams = params || {};
        this.getData(true);
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
    }
  }
});
</script>
<template>
  <div v-if="tableData && tableData.length > 0">
    <div class="item" v-for="item in tableData" :key="item.id" @click="toDetail(item)">
      <el-skeleton :loading="loading" animated>
        <template #template>
          <div class="top">
            <el-skeleton-item variant="image" style="width: 100%; height: 100%; border-radius: 10px" />
            <div style="padding: 16px 0">
              <el-skeleton-item variant="p" style="width: 80%" />
              <el-skeleton-item variant="p" style="width: 40%; margin-top: 10px" />
            </div>
          </div>
        </template>

        <template #default>
          <div class="top">
            <el-image class="cover" :src="item.home_img" lazy fit="cover">
              <template #error>
                <div class="image-slot">
                  <el-icon><icon-picture /></el-icon>
                </div>
              </template>
            </el-image>

            <span class="type">{{ item.type_name }}</span>
          </div>
          <div class="bottom">
            <h2>{{ item.title }}</h2>
            <div class="info">
              <div class="text">
                <i class="iconfont-sys">&#xe6f7;</i>
                <span>{{ useDateFormat(item.create_time, 'YYYY-MM-DD') }}</span>
                <div class="line"></div>
                <i class="iconfont-sys">&#xe689;</i>
                <span>{{ item.count }}</span>
              </div>
              <el-button v-auth="'edit'" size="small" @click.stop="toEdit(item)">编辑</el-button>
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
  <el-empty v-else></el-empty>
  <div style="display: flex; justify-content: center; margin-top: 20px">
    <div v-if="!hidePagination || !hideDo" class="scTable-page">
      <div class="scTable-pagination">
        <el-pagination v-if="!hidePagination" v-model:currentPage="currentPage" background :size="config.size" :layout="paginationLayout" :total="total" :page-size="scPageSize" :page-sizes="pageSizes" @current-change="paginationChange" @update:page-size="pageSizeChange" />
      </div>
      <div v-if="!hideDo" class="scTable-do">
        <div v-if="config.countDownable">
          <slot :row="countDown" name="time" />
        </div>
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

            <el-form-item :label="'刷新' + customCountDownTime + 's'">
              <el-radio-group v-model="config.countDownable" size="small">
                <el-radio-button :value="true">开启</el-radio-button>
                <el-radio-button :value="false">关闭</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </el-popover>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.item {
  box-sizing: border-box;
  width: calc(20% - 20px);
  margin: 0 20px 20px 0;
  cursor: pointer;
  border: 1px solid var(--art-border-color);
  border-radius: calc(var(--custom-radius) / 2 + 2px) !important;

  &:hover {
    .el-button {
      opacity: 1 !important;
    }
  }

  .top {
    position: relative;
    aspect-ratio: 16/9.5;

    .cover {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      object-fit: cover;
      background: var(--art-gray-200);
      border-radius: calc(var(--custom-radius) / 2 + 2px) calc(var(--custom-radius) / 2 + 2px) 0 0;

      .image-slot {
        font-size: 26px;
        color: var(--art-gray-400);
      }
    }

    .type {
      position: absolute;
      top: 5px;
      right: 5px;
      padding: 5px 4px;
      font-size: 12px;
      color: var(--art-gray-300);
      background: rgba($color: #000, $alpha: 60%);
      border-radius: 4px;
    }
  }

  .bottom {
    padding: 5px 10px;

    h2 {
      font-size: 16px;
      font-weight: 500;
      color: #333;

      @include ellipsis();
    }

    .info {
      display: flex;
      justify-content: space-between;
      width: 100%;
      height: 25px;
      margin-top: 6px;
      line-height: 25px;

      .text {
        display: flex;
        align-items: center;
        color: var(--art-text-gray-600);

        i {
          margin-right: 5px;
          font-size: 14px;
        }

        span {
          font-size: 13px;
        }

        .line {
          width: 1px;
          height: 12px;
          margin: 0 15px;
          background-color: var(--art-border-dashed-color);
        }
      }

      .el-button {
        opacity: 0;
        transition: all 0.3s;
      }
    }
  }
}
</style>
