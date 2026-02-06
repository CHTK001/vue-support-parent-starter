<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { deepCopy, localStorageProxy, paginate } from "@repo/utils";
import { computed, defineAsyncComponent, nextTick, onActivated, onDeactivated, onMounted, onUnmounted, reactive, ref, shallowRef, watch } from "vue";
import { columnSettingGet, columnSettingReset, columnSettingSave, config, parseData } from "./column";
import { useKeyboard } from "./composables/useKeyboard";
import { useTableCache } from "./composables/useTableCache";
import { useTableSelection } from "./composables/useTableSelection";
import { useTableDragScroll } from "./composables/useTableDragScroll";
import { useTableLocalPagination } from "./composables/useTableLocalPagination";
import { useTablePrefetch } from "./composables/useTablePrefetch";
import { useTableEdit } from "./composables/useTableEdit";
import { useTablePerformance } from "./composables/useTablePerformance";
import CanvasTableView from "./components/CanvasTableView.vue";
import CardView from "./components/CardView.vue";
import GalleryView from "./components/GalleryView.vue";
import ListView from "./components/ListView.vue";
import TableView from "./components/TableView.vue";
import TimelineView from "./components/TimelineView.vue";
import VirtualTableView from "./components/VirtualTableView.vue";
import WaterfallView from "./components/WaterfallView.vue";
import Pagination from "./plugins/Pagination.vue";

const columnSetting = defineAsyncComponent(() => import("./plugins/columnSetting.vue"));

// 定义组件属性
const props = defineProps({
  tableName: { type: String, default: "" },
  tableId: { type: String, default: "" },
  url: { type: Function, default: null },
  data: { type: Object, default: null },
  center: { type: Boolean, default: false },
  contextmenu: { type: Function, default: () => ({}) },
  contextmenuClass: { type: String, default: "" },
  params: { type: Object, default: () => ({}) },
  layout: { type: String, default: "table" }, // 支持 table, card, list, virtual, canvas, waterfall 六种布局
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
  afterLoadedData: { type: Function, default: () => {} },
  sorted: { type: Function, default: data => data },
  columnInTemplate: { type: Boolean, default: true },
  remoteSort: { type: Boolean, default: false },
  remoteFilter: { type: Boolean, default: false },
  // 默认开启表头排序
  defaultSortable: { type: [Boolean, String], default: true },
  // 是否将过滤参数携带到请求中
  filterToParams: { type: Boolean, default: true },
  remoteSummary: { type: Boolean, default: false },
  search: { type: Boolean, default: true },
  hidePagination: { type: Boolean, default: false },
  hideDo: { type: Boolean, default: false },
  hideRefresh: { type: Boolean, default: false },
  hideSetting: { type: Boolean, default: false },
  paginationLayout: { type: String, default: config.paginationLayout },
  paginationType: { type: String, default: "default" }, // 分页类型：default-当前分页，scroll-滚动分页
  autoLoad: { type: Boolean, default: true }, // 是否在滚动到底部时自动加载更多数据
  loadDistance: { type: Number, default: 50 }, // 距离底部多少像素时触发加载
  // 瀑布流相关配置
  waterfallGap: { type: Number, default: 16 }, // 瀑布流卡片间距
  estimatedItemHeight: { type: Number, default: 200 }, // 预估卡片高度
  bufferSize: { type: Number, default: 5 }, // 虚拟滚动缓冲区大小
  // 拖拽排序相关配置
  /**
   * 是否启用行拖拽排序
   */
  draggable: { type: Boolean, default: false },
  /**
   * 拖拽排序远程地址，设置后会将排序结果提交到后端
   */
  dragSortUrl: { type: Function, default: null },
  /**
   * 拖拽交互次数
   * 1: 每次拖拽直接触发提交
   * >1: 显示保存按钮，点击后批量提交
   */
  dragInteractionCount: { type: Number, default: 1 },
  /**
   * 拖拽排序使用的行标识字段
   */
  dragRowKey: { type: String, default: "id" },
  /**
   * 拖拽手柄列宽度
   */
  dragHandleWidth: { type: Number, default: 50 },
  // 表格专有功能
  /**
   * 是否启用列位置交换（拖动表头列交换位置）
   */
  columnDraggable: { type: Boolean, default: false },
  /**
   * 是否启用十字标记（点击单元格高亮横向和纵向）
   */
  crossHighlight: { type: Boolean, default: false },
  // 时间线布局配置
  /**
   * 时间戳字段名
   */
  timestampField: { type: String, default: "createTime" },
  /**
   * 时间线节点大小
   */
  timelineSize: { type: String, default: "normal" },
  /**
   * 时间线节点是否空心
   */
  timelineHollow: { type: Boolean, default: false },
  /**
   * 时间戳位置
   */
  timelinePlacement: { type: String, default: "bottom" },
  // 画廊布局配置
  /**
   * 图片字段名
   */
  galleryImageField: { type: String, default: "image" },
  /**
   * 标题字段名
   */
  galleryTitleField: { type: String, default: "title" },
  /**
   * 描述字段名
   */
  galleryDescField: { type: String, default: "desc" },
  /**
   * 是否可预览
   */
  galleryPreviewable: { type: Boolean, default: true },
  /**
   * 是否可下载
   */
  galleryDownloadable: { type: Boolean, default: false },
  /**
   * 是否可选择
   */
  gallerySelectable: { type: Boolean, default: false },
  /**
   * 是否显示信息区域
   */
  galleryShowInfo: { type: Boolean, default: true },
  /**
   * 图片宽高比
   */
  galleryAspectRatio: { type: String, default: "1/1" },
  /**
   * 记忆功能ID
   * 0 或空字符串：所有 ScTable 共享配置
   * 其他值：按 ID 独立存储配置
   * 用于记录上次访问的页码，刷新后恢复
   */
  memoryId: { type: [String, Number], default: 0 },
  /**
   * 是否启用快捷键
   */
  keyboardEnabled: { type: Boolean, default: true },
  /**
   * ScFilterBar筛选条件
   */
  filterConditions: { type: Object, default: () => ({}) },
  /**
   * 是否启用列宽自适应
   */
  autoColumnWidth: { type: Boolean, default: false },
  /**
   * 是否启用鼠标拖拽水平滚动
   */
  dragScrollEnabled: { type: Boolean, default: false },
  /**
   * 分页模式
   * - server: 服务器分页（默认），每次翻页请求服务器
   * - local: 本地分页/静态数据模式，首次查询全量数据，后续前端分页
   */
  paginationMode: { type: String, default: "server" },
  /**
   * @deprecated 请使用 paginationMode="local" 代替
   * 是否启用本地分页/静态数据模式
   */
  localPagination: { type: Boolean, default: false },
  /**
   * 是否启用预加载缓存（仅在 server 模式下生效）
   * 访问当前页时后台预加载下N页数据
   */
  prefetchEnabled: { type: Boolean, default: false },
  /**
   * 预加载页数，默认3页
   */
  prefetchCount: { type: Number, default: 3 },
  /**
   * 预加载缓存过期时间（毫秒），默认5分钟
   */
  prefetchExpiry: { type: Number, default: 5 * 60 * 1000 },
  // ==================== 新增功能 Props ====================
  /**
   * 是否启用数据导出功能
   */
  exportEnabled: { type: Boolean, default: false },
  /**
   * 导出类型：excel/csv/json
   */
  exportTypes: { type: Array, default: () => ['excel', 'csv', 'json'] },
  /**
   * 导出文件名
   */
  exportFilename: { type: String, default: 'table-data' },
  /**
   * 是否启用打印功能
   */
  printEnabled: { type: Boolean, default: false },
  /**
   * 打印标题
   */
  printTitle: { type: String, default: '表格数据' },
  /**
   * 是否启用行展开功能
   */
  expandable: { type: Boolean, default: false },
  /**
   * 手风琴模式（同时只展开一行）
   */
  expandAccordion: { type: Boolean, default: false },
  /**
   * 默认展开的行键值
   */
  defaultExpandKeys: { type: Array, default: () => [] },
  /**
   * 是否启用批量操作工具栏
   */
  batchActionEnabled: { type: Boolean, default: false },
  /**
   * 批量操作项配置
   */
  batchActions: { type: Array, default: () => [] },
  /**
   * 是否启用数据编辑模式
   */
  editable: { type: Boolean, default: false },
  /**
   * 编辑模式：cell(单元格)/row(行)
   */
  editMode: { type: String, default: 'cell' },
  /**
   * 可编辑的列（空为全部）
   */
  editableColumns: { type: Array, default: () => [] },
  /**
   * 是否启用列搜索
   */
  columnSearchEnabled: { type: Boolean, default: false },
  /**
   * 可搜索的列（空为全部）
   */
  searchableColumns: { type: Array, default: () => [] },
  /**
   * 是否启用数据统计面板
   */
  statisticsEnabled: { type: Boolean, default: false },
  /**
   * 统计列配置 [{column: 'amount', types: ['sum', 'avg']}]
   */
  statisticsColumns: { type: Array, default: () => [] },
  /**
   * 是否启用变更高亮
   */
  changeHighlightEnabled: { type: Boolean, default: false },
  /**
   * 高亮持续时间（毫秒）
   */
  highlightDuration: { type: Number, default: 3000 },
  /**
   * 是否启用行合并
   */
  rowMergeEnabled: { type: Boolean, default: false },
  /**
   * 需要合并的列
   */
  rowMergeColumns: { type: Array, default: () => [] }
});

// 定义组件事件
const emit = defineEmits([
  "loaded",
  "data-loaded",
  "dataChange",
  "finish",
  "update:cardLayout",
  "rowClick",
  "colClick",
  "drag-sort-change", // 拖拽排序变化
  "drag-sort-save", // 拖拽排序保存
  "drag-sort-success", // 拖拽排序保存成功
  "drag-sort-error", // 拖拽排序保存失败
  "keyboard-delete", // 快捷键删除事件
  "edit-save", // 编辑保存
  "edit-cancel", // 编辑取消
  "cell-copy", // 单元格复制
]);

// 拖拽排序相关状态
const dragSortPending = ref(false); // 是否有待保存的排序
const dragChangeCount = ref(0); // 拖抽变化次数
const dragSortLoading = ref(false); // 拖拽排序保存中

// 编辑功能相关状态
const editPending = ref(false); // 是否有待保存的编辑
const editChangeCount = ref(0); // 编辑变化次数
const editSaveLoading = ref(false); // 编辑保存中

// 引用
const scTableMain = ref(null);
const scTable = ref(null);
const columnSettingRef = ref(null);

// 组件缓存命名空间（组件ID优先，其次表名，否则 shared）
const cacheNamespaceKey = computed(() => {
  return props.tableId || props.tableName || "shared";
});

// 使用缓存管理 composable（修复内存泄漏）
const {
  getCache,
  setCache,
  hasCache,
  clearCache: clearNamespaceCache,
} = useTableCache({
  storageKey: cacheNamespaceKey.value,
  maxCachePages: 3,
});

// 使用选择管理 composable
const {
  selectedRows,
  selectedKeys,
  selectRow,
  unselectRow,
  toggleRowSelection: toggleSelectionInCache,
  onSelectionChange: setPageSelection,
  getCurrentSelection: getPageSelection,
  clearSelection: clearSelectionCache,
  getAllSelection: getSelection,
  hasSelection,
} = useTableSelection({
  tableRef: scTable,
  rowKey: props.rowKey || 'id',
  crossPageSelection: true,
});

// 使用鼠标拖拽滚动 composable
const {
  initDragScroll,
  destroyDragScroll,
  isDragging: isDragScrolling,
  isEnabled: isDragScrollEnabled,
  toggleEnabled: toggleDragScrollEnabled,
} = useTableDragScroll({
  enabled: props.dragScrollEnabled,
  speedMultiplier: 1,
  threshold: 5,
  showGrabCursor: true,
});

// 分页模式计算属性（paginationMode 优先级高于单独的 boolean props）
const actualPaginationMode = computed(() => {
  // 如果明确设置了 paginationMode，优先使用
  if (props.paginationMode && props.paginationMode !== 'server') {
    return props.paginationMode;
  }
  // 向后兼容：检查旧的 boolean props
  if (props.localPagination) return 'local';
  return props.paginationMode || 'server';
});

// 是否使用本地分页模式
const useLocalPagination = computed(() => actualPaginationMode.value === 'local');
// 是否使用服务器分页模式
const useServerPagination = computed(() => actualPaginationMode.value === 'server');
// 是否启用预取缓存（仅 server 模式下生效）
const usePrefetch = computed(() => useServerPagination.value && props.prefetchEnabled);

// 使用本地分页/静态数据模式 composable
const {
  fullData: localFullData,
  pageData: localPageData,
  currentPage: localCurrentPage,
  pageSize: localPageSize,
  total: localTotal,
  totalPages: localTotalPages,
  isEnabled: isLocalPaginationEnabled,
  isLoaded: isLocalDataLoaded,
  setFullData: setLocalFullData,
  clearData: clearLocalData,
  goToPage: goToLocalPage,
  filterData: filterLocalData,
  clearFilter: clearLocalFilter,
  sortData: sortLocalData,
} = useTableLocalPagination({
  enabled: useLocalPagination.value,
  pageSize: props.pageSize,
});

// 使用预加载缓存 composable
const {
  isEnabled: isPrefetchEnabled,
  prefetchCount: prefetchPageCount,
  initPrefetch,
  getPageData: getPrefetchPageData,
  triggerPrefetch,
  hasCache: hasPrefetchCache,
  clearCache: clearPrefetchCache,
  getCacheStats: getPrefetchCacheStats,
} = useTablePrefetch({
  enabled: usePrefetch.value,
  prefetchCount: props.prefetchCount,
  cacheExpiry: props.prefetchExpiry,
  maxCachePages: 10,
});

// 使用编辑 composable
const {
  isEnabled: isEditEnabled,
  editMode: currentEditMode,
  editingStates,
  isEditing,
  hasChanges: hasEditChanges,
  startCellEdit,
  startRowEdit,
  updateEditValue,
  cancelEdit,
  cancelAllEdits,
  saveEdit,
  saveAllEdits,
  isCellEditing,
  isRowEditing,
  isColumnEditable,
  getEditValue,
  getRowChanges,
} = useTableEdit({
  enabled: props.editable,
  mode: props.editMode,
  rowKey: props.rowKey || 'id',
  editableColumns: props.editableColumns,
});

// 使用性能优化 composable
const {
  metrics: performanceMetrics,
  isLargeData,
  showLargeDataTip,
  debouncedDoLayout,
  startTiming,
  endTiming,
  recordDataSize,
  dismissLargeDataTip,
  getReport: getPerformanceReport,
} = useTablePerformance({
  enableMonitor: import.meta.env?.DEV ?? false,
  layoutDebounce: 50,
  largeDataThreshold: 500,
  renderWarnThreshold: 100,
});

// 监听编辑变化
watch(hasEditChanges, (newVal) => {
  editPending.value = newVal;
  if (newVal) {
    editChangeCount.value++;
  }
});

// 响应式数据
const scPageSize = ref(props.pageSize);
const scPageSizes = ref(props.pageSizes);
const isActive = ref(true);
const emptyText = ref("暂无数据");
// 使用计算属性替代 toggleIndex 强制刷新
const renderVersion = ref(0);
const tableData = shallowRef([]); // 使用 shallowRef 优化大数据性能
const total = ref(0);
const currentPage = ref(1);
const prop = ref(null);
const order = ref(null);
const loading = ref(false);
const tableHeight = ref(props.height);
const tableParams = ref(props.params);
const userColumn = ref(props.columns);
const customColumnShow = ref(false);
const summary = ref({});
const filterParams = ref({}); // 存储当前的过滤参数
const isLoading = ref(false); // 是否正在加载中，避免重复加载
const observerRef = ref(null); // 用于存储IntersectionObserver实例
const rowSize = ref(props.rowSize); // 卡片布局行数
const colSize = ref(props.colSize); // 卡片布局列数

// 计算渲染 key（替代 toggleIndex += 1 的强制刷新方式）
const tableRenderKey = computed(() => 
  `${renderVersion.value}-${configState.border}-${configState.stripe}-${configState.size}`
);

// 触发重新渲染的方法
const triggerRerender = () => {
  renderVersion.value++;
};

// 确保配置对象是响应式的
const configState = reactive({
  size: props.size,
  border: typeof props.border === "string" ? props.border === "true" : !!props.border,
  stripe: typeof props.stripe === "string" ? props.stripe === "true" : !!props.stripe,
  countDownable: props.countDownable,
  draggable: props.draggable,
  crossHighlight: props.crossHighlight,
  cacheEnabled: false,
  cachePageCount: 3,
  // 新增：页码缓存开关
  pageMemoryEnabled: false
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

// 配置存储key - 统一使用ID
const storageKey = computed(() => {
  const id = props.tableId || props.memoryId;
  // 如果没有ID,使用共享key
  if (!id || id === 0 || id === "0" || id === "") {
    return "sc_table_config_shared";
  }
  return `sc_table_config_${id}`;
});

// 页码记忆存储key - 统一使用ID
const memoryStorageKey = computed(() => {
  const id = props.tableId || props.memoryId;
  // 如果没有ID,使用共享key
  if (!id || id === 0 || id === "0" || id === "") {
    return "sc_table_memory_shared";
  }
  return `sc_table_memory_${id}`;
});

// 计算高度
const scTableContentWrapper = ref(null);

// 移除 ResizeObserver，直接使用 CSS 控制
const computedHeight = computed(() => {
  // 当 height 为 auto 时，返回 '100%' 让表格填满父容器
  // 前提是父容器（scTableContentWrapper）必须有确定高度
  if (props.height === "auto") {
    return "100%";
  }
  
  // 未设置时返回 undefined 让表格自适应内容
  if (!props.height) {
    return undefined;
  }
  
  // 如果是数字，添加 px 单位
  if (typeof props.height === "number") {
    return `${props.height}px`;
  }
  
  // 直接返回字符串值
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
        configState.draggable = savedConfig.table.draggable !== undefined ? savedConfig.table.draggable : configState.draggable;
        configState.crossHighlight = savedConfig.table.crossHighlight !== undefined ? savedConfig.table.crossHighlight : configState.crossHighlight;
        configState.cacheEnabled = savedConfig.table.cacheEnabled !== undefined ? savedConfig.table.cacheEnabled : configState.cacheEnabled;
        configState.pageMemoryEnabled = savedConfig.table.pageMemoryEnabled !== undefined ? savedConfig.table.pageMemoryEnabled : configState.pageMemoryEnabled;
        configState.cachePageCount = savedConfig.table.cachePageCount !== undefined ? savedConfig.table.cachePageCount : configState.cachePageCount;
      }
    }
  } catch (error) {
    console.error("加载表格配置失败:", error);
  }
};

/**
 * 从 localStorage 加载页码记忆
 */
const loadPageMemory = () => {
  if (!configState.pageMemoryEnabled) return;
  try {
    const memory = localStorageProxy().getItem(memoryStorageKey.value);
    if (memory && memory.currentPage) {
      // 确保页码有效（大于 0）
      const savedPage = parseInt(memory.currentPage, 10);
      if (savedPage > 0) {
        currentPage.value = savedPage;
      }
    }
  } catch (error) {
    console.error("加载页码记忆失败:", error);
  }
};

/**
 * 保存页码记忆到 localStorage
 */
const savePageMemory = () => {
  if (!configState.pageMemoryEnabled) return;
  try {
    const memory = localStorageProxy().getItem(memoryStorageKey.value) || {};
    memory.currentPage = currentPage.value;
    memory.timestamp = Date.now();
    localStorageProxy().setItem(memoryStorageKey.value, memory);
  } catch (error) {
    console.error("保存页码记忆失败:", error);
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
  },
  { immediate: true }
);

watch(
  () => props.stripe,
  newVal => {
    configState.stripe = typeof newVal === "string" ? newVal === "true" : !!newVal;
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

// 配置状态变化时自动触发重新渲染（通过 tableRenderKey 计算属性实现）

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
  // 处理默认排序属性
  userColumn.value = column.map(col => {
    // 如果列没有明确设置 sortable，则使用 defaultSortable 的值
    if (col.sortable === undefined && props.defaultSortable !== false) {
      return { ...col, sortable: props.defaultSortable === true ? "custom" : props.defaultSortable };
    }
    return col;
  });
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
 * 如果启用了缓存，会根据缓存页数计算实际请求的数据量
 */
const getPageSize = () => {
  if (props.layout == "card") {
    return rowSize.value * colSize.value;
  }
  // 每次仅请求当前页大小，缓存逻辑在点击分页后保存当前页数据
  return scPageSize.value;
};
/**
 * 获取远程数据
 */
const getRemoteData = async isLoading => {
  // 如果启用缓存且命中缓存,直接返回缓存数据
  if (configState.cacheEnabled && hasCache(currentPage.value)) {
    tableData.value = getCache(currentPage.value);
    loading.value = false;
    loaded();
    return;
  }

  loading.value = isLoading;
  var reqData = {
    [config.request.page]: currentPage.value,
    [config.request.pageSize]: configState.cacheEnabled ? getPageSize() * 3 : getPageSize(),
    [config.request.prop]: prop.value,
    [config.request.order]: order.value
  };

  // 如果开启了过滤参数携带,将过滤参数添加到请求中
  if (props.filterToParams && Object.keys(filterParams.value).length > 0) {
    Object.assign(reqData, filterParams.value);
  }
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

  // 启用数据缓存:预取3页数据并分别缓存
  if (configState.cacheEnabled) {
    const size = getPageSize();
    // 将预取的3页数据分别存入缓存
    for (let i = 0; i < 3; i++) {
      const pageNo = currentPage.value + i;
      const slice = newData.slice(i * size, (i + 1) * size);
      if (slice && slice.length > 0) {
        setCache(pageNo, slice);
      }
    }
    // 当前页从缓存中取数据
    tableData.value = getCache(currentPage.value) || [];
  } else {
    // 未启用缓存:直接显示数据
    tableData.value = newData;
  }

  // 更新总数与汇总
  total.value = response.total || 0;
  summary.value = response.summary || {};
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
  // 记录数据量用于性能监控
  recordDataSize(tableData.value.length);
  
  emit("loaded");
  emit("data-loaded", tableData.value, total.value);
  props.dataLoaded(tableData.value, total.value);
  props.afterLoadedData(tableData.value, total.value);
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
  clearNamespaceCache();
  getData(true);
};

// 更新数据 合并上一次params
const upData = (params, page = 1) => {
  currentPage.value = page;
  scTable.value?.clearSelection();
  clearSelectionValue();
  Object.assign(tableParams.value, params || {});
  clearNamespaceCache();
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
    clearNamespaceCache();
    getData(true);
    return false;
  }
  clearNamespaceCache();
  getData(true);
};

// 自定义变化事件
const columnSettingChangeHandler = column => {
  userColumn.value = column;
  triggerRerender();
};

// 自定义列保存
const columnSettingSaveHandler = async column => {
  columnSettingRef.value.isSave = true;
  try {
    await columnSettingSave(props.tableName, column);
  } catch (error) {
    message("保存失败", { type: "error" });
    columnSettingRef.value.isSave = false;
  }
  message("保存成功", { type: "success" });
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
    message("重置失败", { type: "error" });
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
  // 存储过滤参数
  Object.keys(filters).forEach(key => {
    if (filters[key] && filters[key].length > 0) {
      filterParams.value[key] = filters[key].join(",");
    } else {
      delete filterParams.value[key];
    }
  });

  if (!props.remoteFilter) {
    return false;
  }
  upData(filterParams.value);
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

/**
 * 处理拖拽排序变化
 * @param {Object} sortInfo - 排序信息
 * @param {number} sortInfo.oldIndex - 原索引
 * @param {number} sortInfo.newIndex - 新索引
 * @param {Array} sortInfo.newOrder - 新排序数组
 */
const onDragSortChange = sortInfo => {
  dragChangeCount.value++;
  dragSortPending.value = true;

  // 更新表格数据
  tableData.value = sortInfo.newOrder;

  // 触发排序变化事件
  emit("drag-sort-change", sortInfo);
};

/**
 * 保存拖拽排序
 */
const saveDragSort = async () => {
  if (!props.dragSortUrl || !dragSortPending.value) return;

  dragSortLoading.value = true;

  // 构建排序数据
  const sortData = tableData.value.map((item, index) => ({
    [props.dragRowKey]: item[props.dragRowKey],
    sort: index + 1
  }));

  emit("drag-sort-save", sortData);

  try {
    const result = await props.dragSortUrl(sortData);
    dragSortPending.value = false;
    dragChangeCount.value = 0;
    emit("drag-sort-success", result);
  } catch (error) {
    emit("drag-sort-error", error);
  } finally {
    dragSortLoading.value = false;
  }
};

/**
 * 取消拖拽排序（恢复原始顺序）
 */
const cancelDragSort = () => {
  if (dragSortPending.value) {
    getData(false);
    dragSortPending.value = false;
    dragChangeCount.value = 0;
  }
};

/**
 * 保存编辑更改
 */
const saveEditChanges = async () => {
  if (!editPending.value) return;
  
  editSaveLoading.value = true;
  
  try {
    // 获取所有编辑状态
    const editStates = saveAllEdits();
    
    // 构建更改数据
    const changes = editStates.map(state => ({
      rowKey: state.rowKey,
      columnKey: state.columnKey,
      originalValue: state.originalValue,
      newValue: state.currentValue,
    }));
    
    // 触发保存事件，由父组件处理实际保存逻辑
    emit("edit-save", changes);
    
    editPending.value = false;
    editChangeCount.value = 0;
  } catch (error) {
    console.error('保存编辑失败:', error);
  } finally {
    editSaveLoading.value = false;
  }
};

/**
 * 取消编辑更改
 */
const cancelEditChanges = () => {
  if (editPending.value) {
    cancelAllEdits();
    editPending.value = false;
    editChangeCount.value = 0;
    emit("edit-cancel");
  }
};

// 选择变化处理（使用 composable）
const selectionChange = values => {
  setPageSelection(currentPage.value, values);
};

// 清除选择值
const clearSelectionValue = () => {
  scTable.value?.clearSelection();
  clearSelectionCache();
};

// 重置选中值（切换页面后恢复选中状态）
const resetSelectedValue = () => {
  nextTick(async () => {
    const selectedValues = getPageSelection(currentPage.value);
    if (selectedValues && selectedValues.length > 0) {
      selectedValues.forEach(it => {
        scTable.value?.toggleRowSelection(it, true);
      });
    }
  });
};

// 集成快捷键支持
if (props.keyboardEnabled) {
  useKeyboard({
    enabled: props.keyboardEnabled,
    onCopy: () => {
      // 复制选中的数据
      const selection = getSelection();
      if (selection && selection.length > 0) {
        const text = JSON.stringify(selection, null, 2);
        navigator.clipboard?.writeText(text);
      }
    },
    onSelectAll: () => {
      // 全选
      scTable.value?.toggleAllSelection();
    },
    onDelete: () => {
      // 删除选中项 - 触发事件由用户处理
      const selection = getSelection();
      if (selection && selection.length > 0) {
        emit("keyboard-delete", selection);
      }
    },
    onEscape: () => {
      // 取消选择
      scTable.value?.clearSelection();
    }
  });
}

// 监听属性变化 - 使用版本号避免深度监听
const paramsVersion = computed(() => JSON.stringify(props.params));
watch(
  paramsVersion,
  () => {
    tableParams.value = props.params;
  },
  { immediate: true }
);

// 监听ScFilterBar筛选条件变化 - 使用版本号避免深度监听
const filterConditionsVersion = computed(() => JSON.stringify(props.filterConditions));
watch(
  filterConditionsVersion,
  () => {
    const newValue = props.filterConditions;
    if (newValue && Object.keys(newValue).length > 0) {
      // 合并筛选条件到请求参数
      Object.assign(tableParams.value, newValue);
      // 重置到第一页并刷新
      currentPage.value = 1;
      clearNamespaceCache();
      getData(true);
    }
  }
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

// 监听data变化 - 使用引用和长度作为触发条件，避免深度监听
const dataVersion = computed(() => {
  const d = props.data;
  if (!d) return 'null';
  const arr = d.data || d;
  return `${Array.isArray(arr) ? arr.length : 0}-${d.total || 0}`;
});
watch(
  [() => props.data, dataVersion],
  ([newData]) => {
    if (!newData) {
      return;
    }
    getStatisticData(false);
  },
  { immediate: true }
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

  // 加载页码记忆
  loadPageMemory();

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

  // 初始化鼠标拖拽滚动
  if (props.dragScrollEnabled) {
    nextTick(() => {
      if (scTableMain.value) {
        initDragScroll(scTableMain.value);
      }
    });
  }

  // 初始化预加载功能
  if (props.prefetchEnabled && props.url) {
    initPrefetch(async (params) => {
      const reqData = {
        [config.request.page]: params.page,
        [config.request.pageSize]: params.pageSize,
        ...tableParams.value,
      };
      const res = await props.url(reqData);
      const response = parseData(res);
      return {
        data: response.rows || [],
        total: response.total || 0,
      };
    });
  }
});

onUnmounted(() => {
  closeTimer();
  removeScrollObserver();
  // 清理拖拽滚动
  destroyDragScroll();
  // 清理本地分页数据
  clearLocalData();
  // 清理预加载缓存
  clearPrefetchCache();
});

onActivated(() => {
  if (!isActive.value) {
    scTable.value.doLayout();
  }
});

onDeactivated(() => {
  isActive.value = false;
});

// 新增的方法
const onRefresh = () => {
  currentPage.value = 1;
  refresh();
};

const onCustomColumn = () => {
  customColumnShow.value = true;
};

// 打开列设置(由Pagination组件触发)
const openColumnSetting = () => {
  // Pagination组件自行处理,此处无需操作
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

// 列点击事件处理
const onColClick = (column, event) => {
  emit("colClick", column, event);
};

// 当前页变更处理
const onCurrentChange = val => {
  currentPage.value = val;
  // 保存页码记忆
  savePageMemory();
  getData(true);
};

// 每页条数变更处理
const onSizeChange = val => {
  scPageSize.value = val;
  currentPage.value = 1;
  clearNamespaceCache();
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
        triggerRerender();
      });
    }
  },
  { immediate: true }
);

// 保存配置方法
const saveConfig = config => {
  if (config.type === "table") {
    // 更新表格配置
    configState.border = config.config.border;
    configState.stripe = config.config.stripe;
    configState.size = config.config.size;

    // 处理拖拽排序和十字标记
    if (config.config.draggable !== undefined) {
      configState.draggable = config.config.draggable;
    }
    if (config.config.crossHighlight !== undefined) {
      configState.crossHighlight = config.config.crossHighlight;
    }
    // 处理缓存配置
    if (config.config.cacheEnabled !== undefined) {
      configState.cacheEnabled = config.config.cacheEnabled;
      // 如果关闭缓存,清空缓存数据
      if (!config.config.cacheEnabled) {
        clearNamespaceCache();
      }
    }
    if (config.config.cachePageCount !== undefined) {
      configState.cachePageCount = config.config.cachePageCount;
    }
    // 处理页码缓存配置
    if (config.config.pageMemoryEnabled !== undefined) {
      configState.pageMemoryEnabled = config.config.pageMemoryEnabled;
    }

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
      triggerRerender();
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
        triggerRerender();
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

// 列宽自适应功能
const autoFitColumnWidth = (columnProp) => {
  if (!scTable.value) return;
  
  nextTick(() => {
    const table = scTable.value.$el;
    if (!table) return;
    
    // 查找列
    const columns = table.querySelectorAll('.el-table__header-wrapper th');
    const cells = table.querySelectorAll('.el-table__body-wrapper td');
    
    // 计算每列的最大宽度
    const columnWidths = new Map();
    
    cells.forEach(cell => {
      const prop = cell.dataset.columnProp || cell.className;
      const width = cell.scrollWidth + 20; // 加上内边距
      
      if (!columnWidths.has(prop) || columnWidths.get(prop) < width) {
        columnWidths.set(prop, width);
      }
    });
    
    // 应用宽度
    if (columnProp) {
      // 单列自适应
      const column = userColumn.value.find(col => col.prop === columnProp);
      if (column && columnWidths.has(columnProp)) {
        column.width = columnWidths.get(columnProp);
      }
    } else {
      // 所有列自适应
      userColumn.value.forEach(column => {
        if (columnWidths.has(column.prop)) {
          column.width = columnWidths.get(column.prop);
        }
      });
    }
    
    // 保存列宽到localStorage
    try {
      const currentConfig = localStorageProxy().getItem(storageKey.value) || {};
      const columnWidthConfig = {};
      userColumn.value.forEach(col => {
        if (col.width) {
          columnWidthConfig[col.prop] = col.width;
        }
      });
      localStorageProxy().setItem(storageKey.value, {
        ...currentConfig,
        columnWidths: columnWidthConfig
      });
    } catch (error) {
      console.error('保存列宽失败:', error);
    }
    
    // 重新渲染
    triggerRerender();
  });
};

// 重置列宽
const resetColumnWidth = () => {
  userColumn.value.forEach(col => {
    delete col.width;
  });
  
  // 清除localStorage中的列宽
  try {
    const currentConfig = localStorageProxy().getItem(storageKey.value) || {};
    delete currentConfig.columnWidths;
    localStorageProxy().setItem(storageKey.value, currentConfig);
  } catch (error) {
    console.error('重置列宽失败:', error);
  }
  
  triggerRerender();
};

// 处理列表视图中加载页面的事件
const onLoadPage = page => {
  currentPage.value = 1;
  clearNamespaceCache();
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
  canvas: CanvasTableView,
  waterfall: WaterfallView,
  timeline: TimelineView,
  gallery: GalleryView
};

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
  loadMore,
  onColClick,
  // 拖拽排序方法
  saveDragSort,
  cancelDragSort,
  dragSortPending,
  dragChangeCount,
  dragSortLoading,
  // 列宽自适应
  autoFitColumnWidth,
  resetColumnWidth,
  // 鼠标拖拽滚动
  isDragScrolling,
  isDragScrollEnabled,
  toggleDragScrollEnabled,
  // 本地分页/静态数据模式
  isLocalPaginationEnabled,
  isLocalDataLoaded,
  localFullData,
  setLocalFullData,
  clearLocalData,
  goToLocalPage,
  filterLocalData,
  clearLocalFilter,
  sortLocalData,
  // 预加载缓存
  isPrefetchEnabled,
  hasPrefetchCache,
  clearPrefetchCache,
  getPrefetchCacheStats,
  // 分页模式
  paginationMode: actualPaginationMode,
  useLocalPagination,
  useServerPagination,
  usePrefetch,
  // 编辑功能
  isEditEnabled,
  isEditing,
  hasEditChanges,
  editPending,
  editChangeCount,
  editSaveLoading,
  startCellEdit,
  startRowEdit,
  updateEditValue,
  cancelEdit,
  cancelAllEdits,
  saveEdit,
  saveAllEdits,
  saveEditChanges,
  cancelEditChanges,
  isCellEditing,
  isRowEditing,
  getEditValue,
  getRowChanges,
  // 性能监控
  performanceMetrics,
  isLargeData,
  showLargeDataTip,
  dismissLargeDataTip,
  getPerformanceReport,
});
</script>

<template>
  <div ref="scTableMain" class="sc-table-container">
    <div class="sc-table-wrapper">
      <!-- 拖拽排序操作栏 - 显示在表头上方 -->
      <div v-if="configState.draggable && dragSortPending" class="sc-table-drag-actions">
        <div class="drag-action-info">
          <IconifyIconOnline icon="ep:sort" />
          <span>已拖拽 {{ dragChangeCount }} 次，排序已变更</span>
        </div>
        <div class="drag-action-buttons">
          <el-button size="small" @click="cancelDragSort">
            <IconifyIconOnline icon="ep:refresh-left" />
            取消
          </el-button>
          <el-button type="primary" size="small" :loading="dragSortLoading" @click="saveDragSort">
            <IconifyIconOnline icon="ep:check" />
            保存排序
          </el-button>
        </div>
      </div>

      <!-- 编辑操作栏 - 显示在表头上方 -->
      <div v-if="editable && editPending" class="sc-table-edit-actions">
        <div class="edit-action-info">
          <IconifyIconOnline icon="ep:edit" />
          <span>已编辑 {{ editChangeCount }} 处，数据已变更</span>
        </div>
        <div class="edit-action-buttons">
          <el-button size="small" @click="cancelEditChanges">
            <IconifyIconOnline icon="ep:refresh-left" />
            取消
          </el-button>
          <el-button type="primary" size="small" :loading="editSaveLoading" @click="saveEditChanges">
            <IconifyIconOnline icon="ep:check" />
            保存编辑
          </el-button>
        </div>
      </div>

      <!-- 大数据量提示 - 建议切换虚拟滚动 -->
      <div v-if="showLargeDataTip && layout === 'table'" class="sc-table-large-data-tip">
        <div class="tip-content">
          <IconifyIconOnline icon="ep:warning-filled" />
          <span>检测到大数据量 ({{ performanceMetrics.rowCount }} 行)，建议切换到虚拟滚动模式以获得更好的性能</span>
        </div>
        <el-button size="small" text @click="dismissLargeDataTip">
          <IconifyIconOnline icon="ep:close" />
        </el-button>
      </div>

      <!-- 表格内容区域 -->
      <div class="sc-table-auto-height" ref="scTableContentWrapper">
        <component
          :is="componentMap[layout]"
          ref="scTable"
          :key="tableRenderKey"
          v-loading="loading"
          :center="center"
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
          :toggle-index="renderVersion"
          :empty-text="emptyText"
          :col-size="colSize"
          :row-size="rowSize"
          :layout="layout === 'card' ? cardLayout : undefined"
          :loading="loading"
          :total="total"
          :current-page="currentPage"
          :page-size="scPageSize"
          :gap="waterfallGap"
          :estimated-item-height="estimatedItemHeight"
          :buffer-size="bufferSize"
          :draggable="configState.draggable"
          :drag-row-key="dragRowKey"
          :drag-handle-width="dragHandleWidth"
          @row-click="onRowClick"
          @col-click="onColClick"
          @selection-change="selectionChange"
          @sort-change="sortChange"
          @filter-change="filterChange"
          @load-more="onLoadMore"
          @next-page="onNextPage"
          @update:current-page="onUpdateCurrentPage"
          @drag-sort-change="onDragSortChange"
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

      <!-- 分页区域 - 瀑布流布局使用滚动分页，不显示分页按钮 -->
      <div v-if="!hidePagination && layout !== 'waterfall'" class="sc-table-pagination-wrapper">
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
  </div>
</template>

<style lang="scss" scoped>
.sc-table-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sc-table-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;

  .sc-table-auto-height {
    flex: 1;
    min-height: 0; /* 关键属性：允许flex子项收缩 */
    overflow: hidden; /* 防止内容溢出 */
    display: flex;
    flex-direction: column;
  }
}

.sc-table-content-wrapper {
  flex: 1;
  min-height: 0; /* 关键属性：防止内容溢出 */
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

// 拖拽排序操作栏样式 - 现代化设计
.sc-table-drag-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, 
    var(--el-color-warning-light-9) 0%, 
    var(--el-color-warning-light-8) 50%,
    var(--el-color-warning-light-9) 100%);
  border-radius: 12px;
  margin-bottom: 16px;
  border: 2px solid var(--el-color-warning-light-5);
  box-shadow: 0 4px 16px rgba(230, 162, 60, 0.15);
  animation: slideDown 0.3s ease-out;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shimmer 2s infinite;
  }

  .drag-action-info {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--el-color-warning-dark-2);
    font-size: 14px;
    font-weight: 600;
    position: relative;
    z-index: 1;
    
    svg {
      font-size: 20px;
      animation: pulse 2s ease-in-out infinite;
    }
    
    span {
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
    }
  }

  .drag-action-buttons {
    display: flex;
    gap: 10px;
    position: relative;
    z-index: 1;
    
    .el-button {
      font-weight: 500;
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

// 编辑操作栏样式 - 现代化设计
.sc-table-edit-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, 
    var(--el-color-primary-light-9) 0%, 
    var(--el-color-primary-light-8) 50%,
    var(--el-color-primary-light-9) 100%);
  border-radius: 12px;
  margin-bottom: 16px;
  border: 2px solid var(--el-color-primary-light-5);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
  animation: slideDown 0.3s ease-out;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shimmer 2s infinite;
  }

  .edit-action-info {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--el-color-primary-dark-2);
    font-size: 14px;
    font-weight: 600;
    position: relative;
    z-index: 1;
    
    svg {
      font-size: 20px;
      animation: pulse 2s ease-in-out infinite;
    }
    
    span {
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
    }
  }

  .edit-action-buttons {
    display: flex;
    gap: 10px;
    position: relative;
    z-index: 1;
    
    .el-button {
      font-weight: 500;
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
  }
}

// 大数据量提示样式
.sc-table-large-data-tip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, 
    var(--el-color-warning-light-9) 0%, 
    var(--el-color-warning-light-8) 100%);
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid var(--el-color-warning-light-5);
  animation: slideDown 0.3s ease-out;
  
  .tip-content {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--el-color-warning-dark-2);
    font-size: 13px;
    
    svg {
      font-size: 18px;
      color: var(--el-color-warning);
    }
  }
  
  .el-button {
    color: var(--el-color-warning-dark-2);
    
    &:hover {
      color: var(--el-color-warning);
    }
  }
}

.sc-table-pagination-wrapper {
  flex-shrink: 0;
  padding: 10px 0;
  width: 100%;
  padding-top: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  background: var(--app-bg-overlay);
  transition: box-shadow 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
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
