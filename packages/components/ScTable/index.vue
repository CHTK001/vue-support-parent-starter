<script setup>
import { config, parseData, columnSettingGet, columnSettingReset, columnSettingSave } from "./column";
import { defineAsyncComponent, ref, reactive, computed, watch, nextTick, onMounted, onUnmounted, onActivated, onDeactivated } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { paginate, deepCopy } from "@repo/utils";
import TableView from './components/TableView.vue'
import CardView from './components/CardView.vue'
import ListView from './components/ListView.vue'
import VirtualTableView from './components/VirtualTableView.vue'
import Pagination from './components/Pagination.vue'

const columnSetting = defineAsyncComponent(() => import("./columnSetting.vue"));

// 定义组件属性
const props = defineProps({
  tableName: { type: String, default: "" },
  url: { type: Function, default: null },
  data: { type: Object, default: null },
  contextmenu: { type: Function, default: () => ({}) },
  params: { type: Object, default: () => ({}) },
  layout: { type: String, default: "table" }, // 支持 table, card, list, virtual 四种布局
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
  height: { type: [String, Number], default: "auto" },
  size: { type: String, default: "default" },
  border: { type: Boolean, default: false },
  stripe: { type: Boolean, default: false },
  pageSize: { type: Number, default: config.pageSize },
  colSize: { type: Number, default: 3 },
  rowSize: { type: Number, default: 3 },
  pageSizes: { type: Array, default: config.pageSizes },
  rowKey: { type: String, default: "" },
  summaryMethod: { type: Function, default: null },
  rowClick: { type: Function, default: () => { } },
  columns: { type: Object, default: () => { } },
  dataLoaded: { type: Function, default: () => { } },
  sorted: {type: Function, default: (data) => data },
  columnInTemplate: { type: Boolean, default: true },
  remoteSort: { type: Boolean, default: false },
  remoteFilter: { type: Boolean, default: false },
  remoteSummary: { type: Boolean, default: false },
  search: { type: Boolean, default: true },
  hidePagination: { type: Boolean, default: false },
  hideDo: { type: Boolean, default: false },
  hideRefresh: { type: Boolean, default: false },
  hideSetting: { type: Boolean, default: false },
  paginationLayout: { type: String, default: config.paginationLayout },
  paginationType: { type: String, default: "default" } // 分页类型：default-当前分页，scroll-滚动分页
});

// 定义组件事件
const emit = defineEmits(["loaded", "data-loaded", "dataChange", "finish"]);

// 引用
const scTableMain = ref(null);
const scTable = ref(null);
const columnSettingRef = ref(null);

// 响应式数据
const scPageSize = ref(props.pageSize);
const scPageSizes = ref(props.pageSizes);
const isActive = ref(true);
const emptyText = ref("暂无数据");
const toggleIndex = ref(0);
const tableData = ref([]);
const total = ref(0);
const currentPage = ref(1);
const prop = ref(null);
const order = ref(null);
const loading = ref(false);
const tableHeight = ref("100%");
const tableParams = ref(props.params);
const userColumn = ref([]);
const selectCacheData = ref({});
const customColumnShow = ref(false);
const summary = ref({});
const cacheData = ref({});
const configState = reactive({
  size: props.size,
  border: props.border == "true",
  stripe: props.stripe,
  countDownable: props.countDownable
});
const customCountDownTime = ref(10);
const timer = ref(null);

// 计算属性
const _height = computed(() => {
  return Number(props.height) ? Number(props.height) + "px" : props.height;
});

const _table_height = computed(() => {
  return props.hidePagination && props.hideDo ? "100%" : "calc(100% - 55px)";
});

const countDown = computed(() => {
  const minutes = Math.floor(customCountDownTime.value / 60);
  const seconds = customCountDownTime.value % 60;
  return {
    minutes: minutes,
    seconds: seconds
  };
});

// 方法
const openTimer = () => {
  timer.value = setInterval(() => {
    customCountDownTime.value--;
    if (customCountDownTime.value <= 0) {
      emit("finish");
      getData(false);
      customCountDownTime.value = props.countDownTime;
    }
  }, 1000);
};

const closeTimer = () => {
  timer.value && clearInterval(timer.value);
};

const icon = (iconName) => {
  return useRenderIcon(iconName);
};

// 获取列
const getCustomColumn = async () => {
  const column = await columnSettingGet(props.tableName, props.columns);
  userColumn.value = column;
};

/**
 * 获取静态数据
 */
const getStatisticData = async (isLoading) => {
  loading.value = isLoading;
  const newTableData = props.data.data || props.data;
  total.value = props.data.total || newTableData.length;
  const page = currentPage.value;
  const pageSize = scPageSize.value;
  const { data, total: totalCount } = paginate(newTableData, pageSize, page, props.filter);
  loading.value = false;
  tableData.value = handleSorted(data);
  total.value = totalCount;
  resetSelectedValue();
  loaded();
};

/**
 * 获取分页大小
 */
const getPageSize = () => {
  if (props.layout == 'card') {
    return props.rowSize * props.colSize;
  }
  if (props.cacheable && props.cachePage > 0) {
    return scPageSize.value * props.cachePage;
  }
  return scPageSize.value;
};

/**
 * 获取远程数据
 */
const getRemoteData = async (isLoading) => {
  if (cacheData.value[currentPage.value]) {
    tableData.value = cacheData.value[currentPage.value];
    return;
  }

  cacheData.value = {};
  loading.value = isLoading;
  var reqData = {
    [config.request.page]: currentPage.value,
    [config.request.pageSize]: getPageSize(),
    [config.request.prop]: prop.value,
    [config.request.order]: order.value
  };
  if (props.hidePagination) {
    delete reqData[config.request.page];
    delete reqData[config.request.pageSize];
  }
  
  let res;
  try {
    delete tableParams.value['pageSize'];
    delete tableParams.value['page'];
    delete tableParams.value['pageNumber'];
    delete tableParams.value['pageNum'];
    if (tableParams.value instanceof FormData) {
      res = await props.url(tableParams.value);
    } else {
      Object.assign(reqData, tableParams.value);
      delete reqData["undefined"];
      res = await props.url(reqData);
    }
  } catch (error) {
    loading.value = false;
    emptyText.value = error?.statusText;
    loaded();
    return false;
  }

  try {
    var response = parseData(res);
  } catch (error) {
    loading.value = false;
    emptyText.value = "数据格式错误";
    loaded();
    return false;
  }
  
  if (response.code != config.successCode) {
    loading.value = false;
    emptyText.value = response.msg;
  } else {
    emptyText.value = "暂无数据";
    rebuildCache(response);
  }
  emit("dataChange", res, tableData.value, total.value);
  loaded();
};

const rebuildCache = async (response) => {
  let newData = [];
  if (props.hidePagination) {
    newData = handleSorted(response.data || []);
  } else {
    newData = handleSorted(response.rows || []);
  }

  // 处理滚动分页模式
  if (props.paginationType === 'scroll' && props.layout === 'card' && currentPage.value > 1) {
    // 滚动分页模式下，追加新数据而不是替换
    tableData.value = [...tableData.value, ...newData];
  } else {
    // 普通模式，直接替换数据
    tableData.value = newData;
  }

  if (props.cacheable) {
    for (var index = 0; index < props.cachePage; index++) {
      cacheData.value[currentPage.value + index] = tableData.value.slice(index * scPageSize.value, (index + 1) * scPageSize.value);
    }
    
    // 在非滚动分页模式下才替换为缓存数据
    if (props.paginationType !== 'scroll' || props.layout !== 'card') {
      tableData.value = handleSorted(cacheData.value[currentPage.value]);
    }
  }
  
  if (currentPage.value == 1) {
    total.value = response.total || 0;
    summary.value = response.summary || {};
  }
  loading.value = false;
  resetSelectedValue();
};

/**
 * 重排数据
 */
const handleSorted = (data) => {
  if (props.sorted) {
    return props.sorted(data);
  }
  return data;
};

// 获取数据
const getData = async (isLoading) => {
  // 判断是否静态数据
  if (props.data) {
    getStatisticData(isLoading);
    return;
  }
  getRemoteData(isLoading);
};

const loaded = () => {
  emit("loaded");
  emit("data-loaded", tableData.value, total.value);
  props.dataLoaded(tableData.value, total.value);
};

// 分页点击
const paginationChange = () => {
  getData(true);
};

// 条数变化
const pageSizeChange = (size) => {
  scPageSize.value = size;
  getData(true);
};

// 加载更多数据（滚动分页）
const loadMore = () => {
  if (props.paginationType !== 'scroll') return;
  
  // 增加页码并加载下一页
  currentPage.value++;
  getData(true);
};

// 刷新数据
const refresh = () => {
  scTable.value?.clearSelection();
  clearSelectionValue();
  getData(true);
};

// 更新数据 合并上一次params
const upData = (params, page = 1) => {
  currentPage.value = page;
  scTable.value?.clearSelection();
  clearSelectionValue();
  Object.assign(tableParams.value, params || {});
  getData(true);
};

// 更新数据, 合并原始数据
const updateData = (updateData, filter) => {
  const _updateData = updateData;
  for (let index = 0; index < tableData.value.length; index++) {
    const element = tableData.value[index];
    if (filter(element)) {
      deepCopy(element, _updateData);
      break;
    }
  }
};

// 重载数据 替换params
const reload = (params, page = 1) => {
  if (props.url) {
    currentPage.value = page;
    tableParams.value = params || {};
    scTable.value?.clearSelection();
    // scTable.value?.clearSort();
    // scTable.value?.clearFilter();
    clearSelectionValue();
    getData(true);
    return false;
  }
  getData(true);
};

// 自定义变化事件
const columnSettingChangeHandler = (column) => {
  userColumn.value = column;
  toggleIndex.value += 1;
};

// 自定义列保存
const columnSettingSaveHandler = async (column) => {
  columnSettingRef.value.isSave = true;
  try {
    await columnSettingSave(props.tableName, column);
  } catch (error) {
    ElMessage.error("保存失败");
    columnSettingRef.value.isSave = false;
  }
  ElMessage.success("保存成功");
  columnSettingRef.value.isSave = false;
};

// 自定义列重置
const columnSettingBackHandler = async () => {
  columnSettingRef.value.isSave = true;
  try {
    const column = await columnSettingReset(props.tableName, props.columns);
    userColumn.value = column;
    columnSettingRef.value.usercolumn = JSON.parse(JSON.stringify(userColumn.value || []));
  } catch (error) {
    ElMessage.error("重置失败");
    columnSettingRef.value.isSave = false;
  }
  columnSettingRef.value.isSave = false;
};

const onRowClick = (obj) => {
  props.rowClick(obj);
};

// 排序事件
const sortChange = (obj) => {
  if (!props.remoteSort) {
    return false;
  }
  if (obj.column && obj.prop) {
    prop.value = obj.prop;
    order.value = obj.order;
  } else {
    prop.value = null;
    order.value = null;
  }
  getData(true);
};

// 本地过滤
const filterHandler = (value, row, column) => {
  const property = column.property;
  return row[property] === value;
};

// 过滤事件
const filterChange = (filters) => {
  if (!props.remoteFilter) {
    return false;
  }
  Object.keys(filters).forEach(key => {
    filters[key] = filters[key].join(",");
  });
  upData(filters);
};

// 远程合计行处理
const remoteSummaryMethod = (param) => {
  const { columns } = param;
  const sums = [];
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = "合计";
      return;
    }
    const values = summary.value[column.property];
    if (values) {
      sums[index] = values;
    } else {
      sums[index] = "";
    }
  });
  return sums;
};

const configSizeChange = () => {
  scTable.value.doLayout();
};

// 插入行 unshiftRow
const unshiftRow = (row) => {
  tableData.value.unshift(row);
};

// 插入行 pushRow
const pushRow = (row) => {
  tableData.value.push(row);
};

// 根据key覆盖数据
const updateKey = (row, rowKey = props.rowKey) => {
  tableData.value
    .filter(item => item[rowKey] === row[rowKey])
    .forEach(item => {
      Object.assign(item, row);
    });
};

// 根据index覆盖数据
const updateIndex = (row, index) => {
  Object.assign(tableData.value[index], row);
};

// 根据index删除
const removeIndex = (index) => {
  tableData.value.splice(index, 1);
};

// 根据index批量删除
const removeIndexes = (indexes = []) => {
  indexes.forEach(index => {
    tableData.value.splice(index, 1);
  });
};

// 根据key删除
const removeKey = (key, rowKey = props.rowKey) => {
  tableData.value.splice(
    tableData.value.findIndex(item => item[rowKey] === key),
    1
  );
};

// 根据keys批量删除
const removeKeys = (keys = [], rowKey = props.rowKey) => {
  keys.forEach(key => {
    tableData.value.splice(
      tableData.value.findIndex(item => item[rowKey] === key),
      1
    );
  });
};

// 原生方法转发
const clearSelection = () => {
  scTable.value?.clearSelection();
};

const toggleRowSelection = (row, selected) => {
  scTable.value.toggleRowSelection(row, selected);
};

const toggleAllSelection = () => {
  scTable.value.toggleAllSelection();
};

const toggleRowExpansion = (row, expanded) => {
  scTable.value.toggleRowExpansion(row, expanded);
};

const setCurrentRow = (row) => {
  scTable.value.setCurrentRow(row);
};

const clearSort = () => {
  scTable.value.clearSort();
};

const clearFilter = (columnKey) => {
  scTable.value.clearFilter(columnKey);
};

const doLayout = () => {
  scTable.value.doLayout();
};

const sort = (prop, order) => {
  scTable.value.sort(prop, order);
};

const selectionChange = (values) => {
  selectCacheData.value[currentPage.value] = values;
};

const clearSelectionValue = () => {
  scTable.value?.clearSelection();
  selectCacheData.value = {};
};

const resetSelectedValue = () => {
  nextTick(async () => {
    const selectedValues = selectCacheData.value[currentPage.value];
    if (selectedValues) {
      selectedValues.forEach(it => {
        scTable.value.toggleRowSelection(it, true);
      });
    }
  });
};

const getSelection = () => {
  return Object.values(selectCacheData.value).flat();
};

// 监听属性变化
watch(() => props.params, (newValue) => {
  tableParams.value = newValue;
}, { immediate: true, deep: true });

// 监听是否开启定时刷新
watch(() => configState.countDownable, (newValue) => {
  closeTimer();
  if (newValue) {
    openTimer();
  }
}, { immediate: true });

// 监听data变化
watch(() => props.data, (newData) => {
  if (!newData) {
    return
  }
  tableData.value = handleSorted(newData.data || newData);
  total.value = newData.data?.total || newData.data?.length || newData.length;
}, { immediate: true, deep: true });

// 监听url变化
watch(() => props.url, () => {
  tableParams.value = props.params;
  refresh();
});

// 监听columns变化
watch(() => props.columns, () => {
  userColumn.value = props.columns;
});

// 生命周期钩子
onMounted(() => {
  configState.border = props.border;
  configState.stripe = props.stripe;
  configState.size = props.size;
  scPageSize.value = props.pageSize || 10;
  if (props.layout == 'card') {
    scPageSize.value = props.colSize * props.rowSize;
  }
  scPageSizes.value = [
    scPageSize.value,
    scPageSize.value * 2,
    scPageSize.value * 3,
    scPageSize.value * 4,
    scPageSize.value * 5,
    scPageSize.value * 6,
    scPageSize.value * 7
  ];
  customCountDownTime.value = props.countDownTime;
  
  // 判断是否开启自定义列
  if (props.columns) {
    getCustomColumn();
  } else {
    userColumn.value = props.columns;
  }

  if (!props.search) {
    return false;
  }
  getData(true);
});

onUnmounted(() => {
  closeTimer();
});

onActivated(() => {
  if (!isActive.value) {
    scTable.value.doLayout();
  }
});

onDeactivated(() => {
  isActive.value = false;
});

// 暴露方法给父组件
defineExpose({
  refresh,
  upData,
  updateData,
  reload,
  unshiftRow,
  pushRow,
  updateKey,
  updateIndex,
  removeIndex,
  removeIndexes,
  removeKey,
  removeKeys,
  clearSelection,
  toggleRowSelection,
  toggleAllSelection,
  toggleRowExpansion,
  setCurrentRow,
  clearSort,
  clearFilter,
  doLayout,
  sort,
  getSelection,
  loadMore
});
</script>

<template>
  <div class="modern-table-container">
    <el-skeleton :loading="loading" animated class="h-full">
      <template #default>
        <div ref="scTableMain" class="sc-table-wrapper">
          <div class="sc-table-content">
            <!-- 表格视图 -->
            <TableView v-if="props.layout === 'table'" ref="scTable" v-bind="$attrs" :table-data="tableData"
              :user-column="userColumn" :config="configState" :contextmenu="props.contextmenu" :row-key="props.rowKey" :height="props.height"
              :column-in-template="props.columnInTemplate" :remote-filter="props.remoteFilter" :remote-summary="props.remoteSummary"
              :summary-method="props.summaryMethod" :toggle-index="toggleIndex" :empty-text="emptyText"
              @row-click="onRowClick" @selection-change="selectionChange" @sort-change="sortChange"
              @filter-change="filterChange">
              <slot />
            </TableView>

            <!-- 卡片视图 -->
            <CardView v-else-if="props.layout === 'card'" ref="scTable" v-bind="$attrs" :table-data="tableData"
              :user-column="userColumn" :config="configState" :contextmenu="props.contextmenu" :row-key="props.rowKey" :height="props.height"
              :column-in-template="props.columnInTemplate" :toggle-index="toggleIndex" :empty-text="emptyText"
              :row-size="props.rowSize" :col-size="props.colSize" :pagination-type="props.paginationType" :loading="loading"
              @row-click="onRowClick" @selection-change="selectionChange" @load-more="loadMore" :page-size="scPageSize">
              <template #default="{ row }">
                <slot :row="row" />
              </template>
            </CardView>

            <!-- 列表视图 -->
            <ListView v-else-if="props.layout === 'list'" ref="scTable" v-bind="$attrs" :table-data="tableData"
              :user-column="userColumn" :config="configState" :contextmenu="props.contextmenu" :row-key="props.rowKey" :height="props.height"
              :column-in-template="props.columnInTemplate" :toggle-index="toggleIndex" :empty-text="emptyText"
              @row-click="onRowClick" @selection-change="selectionChange" :page-size="scPageSize">
              <template #default="{ row }">
                <slot :row="row" />
              </template>
            </ListView>
            
            <!-- 虚拟表格视图 -->
            <VirtualTableView v-else-if="props.layout === 'virtual'" ref="scTable" v-bind="$attrs" :table-data="tableData"
              :user-column="userColumn" :config="configState" :contextmenu="props.contextmenu" :row-key="props.rowKey" :height="props.height"
              :column-in-template="props.columnInTemplate" :remote-filter="props.remoteFilter" :remote-summary="props.remoteSummary"
              :summary-method="props.summaryMethod" :toggle-index="toggleIndex" :empty-text="emptyText" :page-size="scPageSize"
              @row-click="onRowClick" @selection-change="selectionChange" @sort-change="sortChange"
              @filter-change="filterChange">
              <slot />
            </VirtualTableView>
          </div>
        </div>
      </template>
    </el-skeleton>

    <!-- 分页和操作区域保持不变 -->
    <div v-if="!props.hidePagination || !props.hideDo" class="table-footer">
      <div class="scTable-pagination">
        <Pagination 
          v-if="!props.hidePagination" 
          v-model:currentPage="currentPage" 
          :total="total" 
          :page-size="scPageSize" 
          :page-sizes="scPageSizes"
          :layout="props.paginationLayout"
          :pagination-type="props.paginationType"
          :loading="loading"
          :hide-pagination="props.hidePagination"
          @current-change="paginationChange" 
          @size-change="pageSizeChange"
          @load-more="loadMore" />
      </div>
      <div v-if="!props.hideDo" class="scTable-do">
        <el-button v-if="!props.hideRefresh" :icon="icon('ep:refresh')" circle style="margin-left: 15px" @click="refresh" />
        <el-popover v-if="props.column" placement="top" title="列设置" :width="500" trigger="click" :hide-after="0"
          @show="customColumnShow = true" @after-leave="customColumnShow = false">
          <template #reference>
            <el-button :icon="icon('ep:set-up')" circle style="margin-left: 15px" />
          </template>
          <columnSetting v-if="customColumnShow" ref="columnSettingRef" :column="userColumn" :layout="props.layout"
            @userChange="columnSettingChangeHandler" @save="columnSettingSaveHandler"
            @back="columnSettingBackHandler" />
        </el-popover>
        <el-popover v-if="!props.hideSetting" placement="top" title="表格设置" :width="400" trigger="click" :hide-after="0">
          <template #reference>
            <el-button :icon="icon('ep:setting')" circle style="margin-left: 15px" />
          </template>
          <el-form label-width="80px" label-position="left">
            <el-form-item label="表格尺寸">
              <el-radio-group v-model="configState.size" size="small" @change="configSizeChange">
                <el-radio-button label="large">大</el-radio-button>
                <el-radio-button label="default">正常</el-radio-button>
                <el-radio-button label="small">小</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="布局方式">
              <el-radio-group v-model="props.layout" size="small">
                <el-radio-button label="table">表格</el-radio-button>
                <el-radio-button label="card">卡片</el-radio-button>
                <el-radio-button label="list">列表</el-radio-button>
                <el-radio-button label="virtual">虚拟表格</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="表格边框">
              <el-switch v-model="configState.border" />
            </el-form-item>
            <el-form-item label="斑马纹">
              <el-switch v-model="configState.stripe" />
            </el-form-item>
            <el-form-item label="自动刷新">
              <el-switch v-model="configState.countDownable" />
            </el-form-item>
            <el-form-item v-if="configState.countDownable" label="刷新时间">
              <div class="flex items-center">
                <span class="mr-2">{{ countDown.minutes }}分{{ countDown.seconds }}秒</span>
                <el-button type="primary" size="small" @click="refresh">{{ props.countDownText }}</el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-popover>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.modern-table-container {
  display: flex;
  flex: 1;
  max-height: 100%;
  flex-direction: column;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
}

.sc-table-wrapper {
  flex: 1;
  overflow: hidden;
}

.sc-table-content {
  max-height: 100%;
  overflow: auto;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.scTable-pagination {
  flex: 1;
}

.scTable-do {
  display: flex;
  align-items: center;
}
</style>