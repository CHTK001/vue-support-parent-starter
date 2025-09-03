<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { deepCopy, localStorageProxy, paginate } from "@repo/utils";
import { computed, defineAsyncComponent, nextTick, onActivated, onDeactivated, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { columnSettingGet, columnSettingReset, columnSettingSave, config, parseData } from "./column";
import CanvasTableView from "./components/CanvasTableView.vue";
import CardView from "./components/CardView.vue";
import ListView from "./components/ListView.vue";
import TableView from "./components/TableView.vue";
import VirtualTableView from "./components/VirtualTableView.vue";
import Pagination from "./plugins/Pagination.vue";

const columnSetting = defineAsyncComponent(() => import("./plugins/columnSetting.vue"));

// 定义组件属性
const props = defineProps({
  tableName: { type: String, default: "" },
  tableId: { type: String, default: "" },
  url: { type: Function, default: null },
  data: { type: Object, default: null },
  contextmenu: { type: Function, default: () => ({}) },
  contextmenuClass: { type: String, default: "" },
  params: { type: Object, default: () => ({}) },
  layout: { type: String, default: "table" }, // 支持 table, card, list, virtual, canvas 五种布局
  cardLayout: { type: String, default: "default" }, // 卡片布局类型，可选值：card, default
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
  border: { type: [Boolean, String], default: false },
  stripe: { type: [Boolean, String], default: false },
  pageSize: { type: Number, default: config.pageSize },
  colSize: { type: Number, default: 3 },
  rowSize: { type: Number, default: 3 },
  pageSizes: { type: Array, default: config.pageSizes },
  rowKey: { type: String, default: "" },
  summaryMethod: { type: Function, default: null },
  rowClick: { type: Function, default: () => {} },
  columns: { type: Array, default: () => [] },
  dataLoaded: { type: Function, default: () => {} },
  sorted: { type: Function, default: data => data },
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
  paginationType: { type: String, default: "default" }, // 分页类型：default-当前分页，scroll-滚动分页
  autoLoad: { type: Boolean, default: true }, // 是否在滚动到底部时自动加载更多数据
  loadDistance: { type: Number, default: 50 } // 距离底部多少像素时触发加载
});

// 定义组件事件
const emit = defineEmits(["loaded", "data-loaded", "dataChange", "finish", "update:cardLayout"]);

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
const tableHeight = ref(props.height);
const tableParams = ref(props.params);
const userColumn = ref(props.columns);
const selectCacheData = ref({});
const customColumnShow = ref(false);
const summary = ref({});
const cacheData = ref({});
const isLoading = ref(false); // 是否正在加载中，避免重复加载
const observerRef = ref(null); // 用于存储IntersectionObserver实例
const rowSize = ref(props.rowSize); // 卡片布局行数
const colSize = ref(props.colSize); // 卡片布局列数

// 确保配置对象是响应式的
const configState = reactive({
  size: props.size,
  border: typeof props.border === "string" ? props.border === "true" : !!props.border,
  stripe: typeof props.stripe === "string" ? props.stripe === "true" : !!props.stripe,
  countDownable: props.countDownable
});

const customCountDownTime = ref(10);
const timer = ref(null);

const countDown = computed(() => {
  const minutes = Math.floor(customCountDownTime.value / 60);
  const seconds = customCountDownTime.value % 60;
  return {
    minutes: minutes,
    seconds: seconds
  };
});

const storageKey = computed(() => {
  return `table_config_${props.tableId || props.tableName || "default"}`;
});

// 计算高度
const computedHeight = computed(() => {
  if (props.height === "auto") {
    return "100%";
  }
  return props.height;
});

// 从localStorage加载配置
const loadConfigFromStorage = () => {
  try {
    const savedConfig = localStorageProxy().getItem(storageKey.value);
    if (savedConfig) {
      if (savedConfig.table) {
        // 加载表格配置
        configState.border = savedConfig.table.border !== undefined ? savedConfig.table.border : configState.border;
        configState.stripe = savedConfig.table.stripe !== undefined ? savedConfig.table.stripe : configState.stripe;
        configState.size = savedConfig.table.size || configState.size;
      }
      // 可以在这里加载其他配置
    }
  } catch (error) {
    console.error("加载表格配置失败:", error);
  }
};

// 监听属性变化
watch(
  () => props.size,
  newVal => {
    configState.size = newVal;
  },
  { immediate: true }
);

watch(
  () => props.border,
  newVal => {
    configState.border = typeof newVal === "string" ? newVal === "true" : !!newVal;
    // 触发重新渲染
    nextTick(() => {
      toggleIndex.value += 1;
    });
  },
  { immediate: true }
);

watch(
  () => props.stripe,
  newVal => {
    configState.stripe = typeof newVal === "string" ? newVal === "true" : !!newVal;
    // 触发重新渲染
    nextTick(() => {
      toggleIndex.value += 1;
    });
  },
  { immediate: true }
);

watch(
  () => props.height,
  newVal => {
    tableHeight.value = newVal;
  },
  { immediate: true }
);

// 监听配置状态变化，触发重新渲染
watch(
  configState,
  () => {
    nextTick(() => {
      toggleIndex.value += 1;
    });
  },
  { deep: true }
);

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

const icon = iconName => {
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
const getStatisticData = async isLoading => {
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
  if (props.layout == "card") {
    return rowSize.value * colSize.value;
  }
  if (props.cacheable && props.cachePage > 0) {
    return scPageSize.value * props.cachePage;
  }
  return scPageSize.value;
};

/**
 * 获取远程数据
 */
const getRemoteData = async isLoading => {
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
    delete tableParams.value["pageSize"];
    delete tableParams.value["page"];
    delete tableParams.value["pageNumber"];
    delete tableParams.value["pageNum"];
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

const rebuildCache = async response => {
  let newData = [];
  if (props.hidePagination) {
    newData = handleSorted(response.data || []);
  } else {
    newData = handleSorted(response.rows || []);
  }

  // 处理滚动分页模式
  if (props.paginationType === "scroll" && props.layout === "card" && currentPage.value > 1) {
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
    if (props.paginationType !== "scroll" || props.layout !== "card") {
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
const handleSorted = data => {
  if (props.sorted) {
    return props.sorted(data);
  }
  return data;
};

// 获取数据
const getData = async isLoading => {
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
const pageSizeChange = size => {
  scPageSize.value = size;
  getData(true);
};

// 加载更多数据（滚动分页）
const loadMore = () => {
  if (props.paginationType !== "scroll") return;
  if (isLoading.value) return; // 防止重复加载
  if (tableData.value.length >= total.value) return; // 已加载全部数据

  isLoading.value = true;
  // 增加页码并加载下一页
  currentPage.value++;
  getData(true).finally(() => {
    isLoading.value = false;
  });
};

// 设置滚动监听
const setupScrollObserver = () => {
  // 仅针对card和list布局，table布局使用el-table-infinite-scroll
  if (props.paginationType !== "scroll" || !props.autoLoad || props.layout === "table") return;

  // 清除之前的监听器
  removeScrollObserver();

  // 创建一个新的监听器
  nextTick(() => {
    const target = document.querySelector(".scroll-pagination-trigger");
    if (!target) return;

    observerRef.value = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoading.value && tableData.value.length < total.value) {
          loadMore();
        }
      },
      {
        rootMargin: `0px 0px ${props.loadDistance}px 0px`
      }
    );

    observerRef.value.observe(target);
  });
};

// 移除滚动监听
const removeScrollObserver = () => {
  if (observerRef.value) {
    observerRef.value.disconnect();
    observerRef.value = null;
  }
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
const columnSettingChangeHandler = column => {
  userColumn.value = column;
  toggleIndex.value += 1;
};

// 自定义列保存
const columnSettingSaveHandler = async column => {
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

// 排序事件
const sortChange = obj => {
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
const filterChange = filters => {
  if (!props.remoteFilter) {
    return false;
  }
  Object.keys(filters).forEach(key => {
    filters[key] = filters[key].join(",");
  });
  upData(filters);
};

// 远程合计行处理
const remoteSummaryMethod = param => {
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
const unshiftRow = row => {
  tableData.value.unshift(row);
};

// 插入行 pushRow
const pushRow = row => {
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
const removeIndex = index => {
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

const setCurrentRow = row => {
  scTable.value.setCurrentRow(row);
};

const clearSort = () => {
  scTable.value.clearSort();
};

const clearFilter = columnKey => {
  scTable.value.clearFilter(columnKey);
};

const doLayout = () => {
  scTable.value.doLayout();
};

const sort = (prop, order) => {
  scTable.value.sort(prop, order);
};

const selectionChange = values => {
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
watch(
  () => props.params,
  newValue => {
    tableParams.value = newValue;
  },
  { immediate: true, deep: true }
);

// 监听是否开启定时刷新
watch(
  () => configState.countDownable,
  newValue => {
    closeTimer();
    if (newValue) {
      openTimer();
    }
  },
  { immediate: true }
);

// 监听data变化
watch(
  () => props.data,
  newData => {
    if (!newData) {
      return;
    }
    getStatisticData(false);
  },
  { immediate: true, deep: true }
);

// 监听url变化
watch(
  () => props.url,
  () => {
    tableParams.value = props.params;
    refresh();
  }
);

// 监听columns变化
watch(
  () => props.columns,
  () => {
    userColumn.value = props.columns;
    console.log(userColumn.value);
  }
);

// 监听分页类型变化
watch(
  () => props.paginationType,
  newValue => {
    if (newValue === "scroll" && props.autoLoad) {
      nextTick(() => {
        setupScrollObserver();
      });
    } else {
      removeScrollObserver();
    }
  }
);

// 表格无限滚动处理函数
const handleTableScroll = () => {
  if (props.paginationType !== "scroll" || props.layout !== "table") return;
  if (isLoading.value || tableData.value.length >= total.value) return;

  isLoading.value = true;
  currentPage.value++;
  getData(true).finally(() => {
    isLoading.value = false;
  });
};

// 生命周期钩子
onMounted(() => {
  configState.border = props.border;
  configState.stripe = props.stripe;
  configState.size = props.size;
  scPageSize.value = props.pageSize || 10;
  if (props.layout == "card") {
    scPageSize.value = props.colSize * props.rowSize;
  }
  scPageSizes.value = [scPageSize.value, scPageSize.value * 2, scPageSize.value * 3, scPageSize.value * 4, scPageSize.value * 5, scPageSize.value * 6, scPageSize.value * 7];
  customCountDownTime.value = props.countDownTime;

  // 从localStorage加载配置
  loadConfigFromStorage();

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

  // 如果是滚动分页并且需要自动加载，设置滚动监听
  if (props.paginationType === "scroll" && props.autoLoad) {
    setupScrollObserver();
  }
});

onUnmounted(() => {
  closeTimer();
  removeScrollObserver();
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

// 新增的方法
const onRefresh = () => {
  currentPage.value = 1;
  refresh();
};

const onCustomColumn = () => {
  customColumnShow.value = true;
};

const onColumnSave = async data => {
  await columnSettingSave(props.tableName, data);
  customColumnShow.value = false;
  getData();
};

const onColumnReset = async () => {
  await columnSettingReset(props.tableName);
  getCustomColumn();
  customColumnShow.value = false;
  getData();
};

// 行点击事件处理
const onRowClick = (row, index, event) => {
  props.rowClick(row, index, event);
  emit("row-click", row, index, event);
};

// 当前页变更处理
const onCurrentChange = val => {
  currentPage.value = val;
  getData(true);
};

// 每页条数变更处理
const onSizeChange = val => {
  scPageSize.value = val;
  currentPage.value = 1;
  getData(true);
};

// 加载更多数据
const onLoadMore = () => {
  if (isLoading.value || tableData.value.length >= total.value) return;

  currentPage.value++;
  getData(true, true);
};

// 执行汇总方法
const doSummary = param => {
  if (props.summaryMethod) {
    return props.summaryMethod(param);
  }
  return null;
};

// 使用父组件传入的属性访问
watch(
  () => props.layout,
  newVal => {
    // 修改布局时重新布局
    nextTick(() => {
      if (scTable.value && typeof scTable.value.doLayout === "function") {
        scTable.value.doLayout();
      } else if (scTable.value && typeof scTable.value.rerenderTable === "function") {
        scTable.value.rerenderTable();
      }
    });
  },
  { immediate: true }
);

// 监听行列数变化
watch(
  [rowSize, colSize],
  ([newRowSize, newColSize]) => {
    if (props.layout === "card") {
      // 如果是卡片布局，更新每页显示数量
      scPageSize.value = newRowSize * newColSize;
      // 如果数据已加载，重新获取数据以应用新的分页大小
      if (tableData.value.length > 0) {
        // 返回到第一页
        currentPage.value = 1;
        nextTick(() => {
          getData(true);
        });
      }
      // 触发重新渲染
      nextTick(() => {
        toggleIndex.value += 1;
      });
    }
  },
  { immediate: true }
);

// 新增的handleSaveConfig方法
const handleSaveConfig = config => {
  if (config.type === "table") {
    // 更新表格配置
    configState.border = config.config.border;
    configState.stripe = config.config.stripe;
    configState.size = config.config.size;

    // 处理卡片布局的行列数设置
    if (config.config.rowSize !== undefined) {
      rowSize.value = config.config.rowSize;
    }

    if (config.config.colSize !== undefined) {
      colSize.value = config.config.colSize;
    }

    // 处理卡片布局类型
    if (config.config.cardLayout !== undefined && props.layout === "card") {
      // 这里只能修改内部状态，不能直接修改props
      // 可以通过事件通知父组件更新
      emit("update:cardLayout", config.config.cardLayout);
    }

    // 保存到localStorage
    try {
      const currentConfig = localStorageProxy().getItem(storageKey.value) || {};
      localStorageProxy().setItem(storageKey.value, {
        ...currentConfig,
        table: config.config
      });
    } catch (error) {
      console.error("保存表格配置失败:", error);
    }

    // 触发重新渲染
    nextTick(() => {
      toggleIndex.value += 1;
      scTable.value?.doLayout();
    });
  } else if (config.type === "column") {
    // 处理列设置
    if (config.config && config.config.length > 0) {
      // 更新列配置
      userColumn.value = JSON.parse(JSON.stringify(config.config));

      // 保存列设置
      try {
        const currentConfig = localStorageProxy().getItem(storageKey.value) || {};
        localStorageProxy().setItem(storageKey.value, {
          ...currentConfig,
          column: config.config
        });

        // 更新到columnSetting组件
        columnSettingSave(props.tableName, config.config);
      } catch (error) {
        console.error("保存列配置失败:", error);
      }

      // 触发重新渲染
      nextTick(() => {
        toggleIndex.value += 1;
        if (scTable.value?.doLayout) {
          scTable.value.doLayout();
        }
      });
    } else {
      // 如果没有有效的列配置，打开列设置对话框
      onCustomColumn();
    }
  }
};

// 获取列配置
const getColumns = () => {
  if (!userColumn.value || userColumn.value.length === 0) {
    getCustomColumn();
  }
  return userColumn.value;
};

// 获取表格配置
const getTableConfig = () => {
  return configState;
};

// 处理列表视图中加载页面的事件
const onLoadPage = page => {
  currentPage.value = page;
  getData(true);
};

// 处理列表视图中加载下一页事件
const onNextPage = () => {
  if (isLoading.value || tableData.value.length >= total.value) return;
  getData(true, true);
};

// 处理列表视图中加载上一页事件
const onPrevPage = () => {
  if (isLoading.value || currentPage.value <= 1) return;
  getData(true);
};

// 处理列表视图中更新当前页事件
const onUpdateCurrentPage = page => {
  currentPage.value = page;
};

// 添加组件映射对象
const componentMap = {
  table: TableView,
  card: CardView,
  list: ListView,
  virtual: VirtualTableView,
  canvas: CanvasTableView
};
</script>

<template>
  <div ref="scTableMain" class="sc-table-container" :class="{ 'auto-height': height === 'auto' }">
    <div class="sc-table-wrapper">
      <!-- 表格内容区域 -->
      <div class="sc-table-auto-height">
        <component
          :is="componentMap[layout]"
          ref="scTable"
          :key="toggleIndex"
          v-loading="loading"
          v-bind="$attrs"
          :table-data="tableData"
          :user-column="userColumn"
          :config="configState"
          :pagination-type="paginationType"
          :contextmenu="contextmenu"
          :contextmenu-class="contextmenuClass"
          :row-key="rowKey"
          :height="computedHeight"
          :column-in-template="columnInTemplate"
          :remote-filter="remoteFilter"
          :remote-summary="remoteSummary"
          :summary-method="summaryMethod"
          :toggle-index="toggleIndex"
          :empty-text="emptyText"
          :col-size="colSize"
          :row-size="rowSize"
          :layout="layout === 'card' ? cardLayout : undefined"
          @row-click="onRowClick"
          @selection-change="selectionChange"
          @sort-change="sortChange"
          @filter-change="filterChange"
        >
          <template #default="{ row, index }">
            <slot :row="row" :index="index" :default="row" />
          </template>
          <!-- 添加empty插槽，用于自定义无数据展示 -->
          <template #empty>
            <slot name="empty">
              <el-empty :description="emptyText" :image-size="100" />
            </slot>
          </template>
        </component>
      </div>

      <!-- 分页区域 -->
      <div v-if="!hidePagination" class="sc-table-pagination-wrapper">
        <Pagination
          v-model:current-page="currentPage"
          v-model:page-size="scPageSize"
          v-model:row-size="rowSize"
          v-model:col-size="colSize"
          :page-sizes="scPageSizes"
          :total="total"
          :layout="paginationLayout"
          :pagination-type="paginationType"
          :loading="loading"
          :hide-pagination="hidePagination"
          :hide-refresh="hideRefresh"
          :hide-setting="hideSetting"
          :columns="userColumn"
          :table-config="configState"
          :table-layout="layout"
          @current-change="onCurrentChange"
          @size-change="onSizeChange"
          @load-more="loadMore"
          @refresh="getData(false)"
          @column-setting="openColumnSetting"
          @save-config="saveConfig"
          @get-table-config="getTableConfig"
        />
      </div>
    </div>

    <!-- 列设置弹窗 -->
    <columnSetting ref="columnSettingRef" :column="userColumn" :table-name="tableName" @save="columnSave" @reset="columnReset" />
  </div>
</template>

<style lang="scss" scoped>
.sc-table-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.auto-height {
    position: relative;
    flex: 1;
    min-height: 400px;
  }
}

.sc-table-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;

  .auto-height & {
    min-height: 400px;
  }
  .sc-table-auto-height {
    flex: 1;
  }
}

.sc-table-content-wrapper {
  flex: 1;
  min-height: 0; /* 关键属性：防止内容溢出 */
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;

  .auto-height & {
    flex: none;
    height: auto;
    min-height: 300px;
    overflow-y: auto;
  }
}

.sc-table-pagination-wrapper {
  flex-shrink: 0; /* 防止分页区域被压缩 */
  padding: 10px 0;
  width: 100%;
  padding: 16px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* 确保表格内容区域不会被分页挤压 */
:deep(.el-table__body-wrapper) {
  overflow: auto !important;
  height: auto !important;
  flex: 1;
}

:deep(.el-table) {
  height: 100% !important;
  display: flex;
  flex-direction: column;
}

:deep(.el-table__inner-wrapper) {
  height: 100% !important;
  display: flex;
  flex-direction: column;
}

:deep(.el-table__header-wrapper) {
  width: 100%;
  flex-shrink: 0;
}

/* 表头固定样式 */
:deep(.headerSticky .el-table__header-wrapper) {
  position: sticky;
  top: 0;
  z-index: 10;
}
</style>
