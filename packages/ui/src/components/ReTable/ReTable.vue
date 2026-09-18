<script setup lang="ts">
/**
 * ReTable —— 表格组件
 *
 * 三种数据源模式：
 *   1) 静态数组：:data="[...]"
 *   2) 远程 url：url="/api/users" + :params="{...}" + 分页会自动带上 page/pageSize
 *   3) 自定义函数：:data="(p) => fetchUsers(p)"
 *
 * 暴露方法：
 *   - reload()  重新加载（带 resetPage 选项）
 *   - goto(p?, s?)  跳转页 / 每页条数（参数缺省保持原值）
 *   - resetColumns()  重置列配置（清除持久化）
 *   - clearAllSelection()  清空所有选中行
 *   - toggleBatchSelect()  切换批量选择模式
 *   - getSelectedRows()  获取所有选中行
 *
 * 工具栏（分页上方右侧）：
 *   - 刷新：触发 reload()
 *   - 列设置：popover 中可搜索 / 排序 / 隐藏 / 显示
 *   - 表格设置：popover 中切换斑马纹 / 边框 / 紧凑 / 高亮当前行 / 可调整列宽
 *
 * 列配置持久化：
 *   - 传 tableId 后，会按 "re-table:<tableId>" 持久化到 storage（默认 localStorage）
 *   - 可通过 :storage="myAdapter" 注入自定义存储
 *
 * 批量操作：
 *   - toolbarConfig.batchSelect → checkbox 列 + 跨页选择(sessionStorage)
 *   - toolbarConfig.batchDelete → 批量删除(带确认)
 *   - toolbarConfig.batchEdit → 批量修改(编辑→保存切换 + inline edit)
 *
 * 事件：
 *   - row-click / cell-click / selection-change
 *   - context-menu-select（右键菜单）
 *   - sort-change（远程排序）
 *   - row-sort（行拖拽排序）
 *   - batch-delete / batch-edit / batch-save
 */
import { computed, defineAsyncComponent, inject, ref, useSlots, watch, nextTick } from "vue";
import { ElTable, ElTableColumn, ElPagination, ElButton, ElPopover, ElInput, ElCheckbox, ElCheckboxGroup, ElTooltip, ElIcon } from "element-plus";
import { Refresh, Setting, Menu, Delete, Edit, Check, Select, Search, ArrowUp, ArrowDown } from "@element-plus/icons-vue";
import { http, useDataSource, type ReDataSource } from "@repo/core";
import ReTableVirtualView from "./ReTableVirtualView.vue";
import ReTableCardView from "./ReTableCardView.vue";
import ReTableToolbar from "./ReTableToolbar.vue";
import ReTableContextMenu from "./ReTableContextMenu.vue";
import ReTableRadialView from "./ReTableRadialView.vue";
import ReButton from "../ReButton/ReButton.vue";
import ReSearch from "../ReSearch/index";

/** Modern 表格布局组件（按需异步加载） */
const ReTableModernView = defineAsyncComponent(() => import("./layouts/Modern.vue"));

/** Canvas 表格布局组件（按需异步加载，AG Grid 体积较大） */
const ReTableCanvasView = defineAsyncComponent(() => import("./ReTableCanvasView.vue"));

import ReSwitch from "../ReSwitch/ReSwitch.vue";
import "./shared/table-vars.css";
import type {
  ReCanvasLayoutProps,
  ReCardLayoutProps,
  RePageResult,
  ReRadialLayoutProps,
  ReTableColumn,
  ReTableColumnState,
  ReTableFullState,
  ReTableLayout,
  ReTableLoader,
  ReTableSettings,
  ReVirtualLayoutProps,
  ReTableToolbarConfig,
  ReTableSearchConfig,
  ReTableContextMenuItem,
  ReTableContextMenuContext,
  ReTableCellClickPayload,
  ReTableSortChangePayload,
  ReTableRowSortPayload,
  ReTableTreeProps,
} from "./types";
import type { ReTableColumnStorage } from "./columnStorage";
import { localColumnStorage, sessionColumnStorage } from "./columnStorage";

defineOptions({ name: "ReTable", inheritAttrs: true });

/** 父组件传入的具名插槽（兼容 `#col-actions` 与 `#actions` 两种命名） */
const parentSlots = useSlots();
function resolveColSlotName(col: ReTableColumn): string | undefined {
  const candidates = [col.slot || `col-${col.prop}`];
  if (col.slot) {
    candidates.push(`col-${col.slot}`);
    candidates.push(col.slot);
  }
  for (const name of candidates) {
    if (parentSlots[name]) return name;
  }
  return candidates[0];
}
function hasColSlot(col: ReTableColumn): boolean {
  return Boolean(parentSlots[col.slot || `col-${col.prop}`] || (col.slot && (parentSlots[`col-${col.slot}`] || parentSlots[col.slot])));
}

/** 全局可注入 storage（key 与 columnStorage 一致，方便业务注入） */
const RE_TABLE_STORAGE_KEY = Symbol("ReTableStorage") as unknown as import("vue").InjectionKey<ReTableColumnStorage>;

const props = withDefaults(
  defineProps<{
    /** 静态行数据 */
    data?: Array<Record<string, unknown>>;
    /** 远程 url（与 data/loader 二选一） */
    url?: string;
    /** 自定义加载器（与 url 二选一），签名见 types.ts */
    loader?: ReTableLoader;
    /** 远程查询参数 */
    params?: Record<string, unknown>;
    /** 列定义 */
    columns?: ReTableColumn[];
    /** 加载状态（外部控制） */
    loading?: boolean;
    /** 表格外观设置（受控，可被工具栏修改） */
    settings?: ReTableSettings;
    /** 行 key 字段 */
    rowKey?: string;
    /** 空数据文案 */
    emptyText?: string;
    /** 是否显示分页 */
    pagination?: boolean;
    /** 分页总条数（静态模式下生效） */
    total?: number;
    /** 分页当前页 */
    page?: number;
    /** 分页每页条数 */
    pageSize?: number;
    /** 每页条数选项 */
    pageSizes?: number[];
    /** 远程模式：自动随 params / page / pageSize 重新加载 */
    autoReload?: boolean;
    /** 表格唯一标识；传入后列配置（顺序 / 隐藏）会持久化 */
    tableId?: string;
    /** 自定义 storage（默认 localStorage），可通过 app.provide 注入全局 */
    storage?: ReTableColumnStorage;
    /** 是否显示工具栏（刷新 / 列设置 / 表格设置） */
    toolbar?: boolean;
    /** toolbar 配置（批量删除/选择/修改等），toolbar=true 时生效 */
    toolbarConfig?: ReTableToolbarConfig;
    /** 右键菜单项（传入行/cell 入参） */
    contextMenu?: ReTableContextMenuItem[];
    /** 列设置 popover 触发文案 */
    columnsTriggerText?: string;
    /** 表格设置 popover 触发文案 */
    settingsTriggerText?: string;
    /** 布局模式：默认表格 / 虚拟表格 / 卡片（瀑布流）/ 现代化扁平 / Canvas(AG Grid) */
    layout?: ReTableLayout;
    /** 卡片模式专属属性（layout-card-*） */
    layoutCard?: ReCardLayoutProps;
    /** 虚拟表格模式专属属性（layout-virtual-*） */
    layoutVirtual?: ReVirtualLayoutProps;
    /** Canvas 表格模式专属属性（layout-canvas-*，基于 AG Grid） */
    layoutCanvas?: ReCanvasLayoutProps;
    /** 放射菜单模式专属属性（layout-radial-*） */
    layoutRadial?: ReRadialLayoutProps;
    /** 默认表格模式专属属性（layout-table-*） */
    layoutTable?: {
      /** 是否显示表头 */
      showHeader?: boolean;
      /** 表格高度 */
      height?: string | number;
      /** 最大高度 */
      maxHeight?: string | number;
      /** 表格最小高度（空数据时也保持此高度，默认 300px） */
      minHeight?: string | number;
    };
    /** 树形数据配置（透传 el-table tree-props） */
    treeProps?: ReTableTreeProps;
    /** 是否启用行拖拽排序 */
    rowDraggable?: boolean;
    /** 是否可调整列宽（需 border 模式，默认 true） */
    resizable?: boolean;
    /** 默认展开所有树节点 */
    defaultExpandAll?: boolean;
    /** 是否显示搜索开关按钮（切换内置搜索区显示） */
    showSearch?: boolean;
    /** 搜索区是否显示（v-model 支持） */
    searchVisible?: boolean;
    /** 是否显示搜索区右上角的展开/收起切换按钮 */
    showSearchToggle?: boolean;
    showSearchTitle?: boolean;
    showSelection?: boolean;
    /** 内置 ReSearch 搜索区（true=默认配置；传对象可配 filters/title/btnMode 等） */
    search?: boolean | ReTableSearchConfig;
    /** 搜索区与表格的间距（px），0 时搜索与表格连为一体 */
    searchGap?: number;
    /** 搜索值（v-model:search-model，内置 ReSearch filters 模式下双向绑定） */
    searchModel?: Record<string, unknown>;
  }>(),
  {
    data: () => [],
    url: "",
    loader: undefined,
    params: () => ({}),
    columns: () => [],
    loading: false,
    settings: () => ({}),
    rowKey: "id",
    emptyText: "暂无数据",
    pagination: true,
    total: 0,
    page: 1,
    pageSize: 10,
    pageSizes: () => [10, 20, 50, 100],
    autoReload: true,
    tableId: "",
    storage: undefined,
    toolbar: true,
    toolbarConfig: () => ({}),
    contextMenu: () => [],
    columnsTriggerText: "列设置",
    settingsTriggerText: "表格设置",
    layout: "table",
    layoutCard: () => ({}),
    layoutVirtual: () => ({}),
    layoutCanvas: () => ({}),
    layoutRadial: () => ({}),
    layoutTable: () => ({}),
    treeProps: undefined,
    rowDraggable: false,
    resizable: true,
    defaultExpandAll: false,
    showSearch: false,
    searchVisible: true,
    showSearchToggle: true,
    showSearchTitle: true,
    showSelection: false,
    search: false,
    searchGap: 16,
    searchModel: undefined,
  },
);

const emit = defineEmits<{
  (e: "update:page", page: number): void;
  (e: "update:pageSize", size: number): void;
  (e: "update:total", total: number): void;
  (e: "update:settings", settings: ReTableSettings): void;
  (e: "row-click", row: Record<string, unknown>): void;
  (e: "cell-click", payload: ReTableCellClickPayload): void;
  (e: "selection-change", rows: Record<string, unknown>[]): void;
  (e: "context-menu-select", item: ReTableContextMenuItem, ctx: ReTableContextMenuContext): void;
  (e: "batch-delete", rows: Record<string, unknown>[]): void;
  (e: "batch-edit"): void;
  (e: "batch-save", rows: Record<string, unknown>[]): void;
  (e: "sort-change", payload: ReTableSortChangePayload): void;
  (e: "row-sort", payload: ReTableRowSortPayload): void;
  (e: "load", payload: RePageResult): void;
  (e: "load-error", err: Error): void;
  (e: "update:searchVisible", visible: boolean): void;
  (e: "toggle-search"): void;
  (e: "update:searchModel", value: Record<string, unknown>): void;
  (e: "search"): void;
  (e: "search-reset"): void;
  (e: "refresh"): void;
}>();

/** ========== 批量选择状态（sessionStorage 记住跨页选择） ========== */
const elTableRef = ref<any>(null);

/** 选中行缓存：使用 sessionStorage 持久化跨页选择 */
const batchSelectionKey = computed(() => (props.tableId ? `re-table-sel:${props.tableId}` : ""));

/** 从 sessionStorage 读取选中行 */
function loadSelectionFromStorage(): Record<string, Record<string, unknown>> {
  if (!batchSelectionKey.value) return {};
  try {
    const raw = sessionStorage.getItem(batchSelectionKey.value);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

/** 保存选中行到 sessionStorage */
function saveSelectionToStorage(selection: Record<string, Record<string, unknown>>): void {
  if (!batchSelectionKey.value) return;
  try {
    sessionStorage.setItem(batchSelectionKey.value, JSON.stringify(selection));
  } catch { /* ignore */ }
}

/** 从 sessionStorage 删除选中行缓存 */
function removeSelectionFromStorage(): void {
  if (!batchSelectionKey.value) return;
  try {
    sessionStorage.removeItem(batchSelectionKey.value);
  } catch { /* ignore */ }
}

/** 当前选中行（keyed by rowKey） */
const selectedRowsMap = ref<Record<string, Record<string, unknown>>>(loadSelectionFromStorage());

/** 当前页选中行（el-table selection-change 回调更新） */
const currentPageSelection = ref<Record<string, unknown>[]>([]);

/** 内部分页状态（与 props 同步，确保 reload 时读到最新值） */
const internalPage = ref(props.page ?? 1);
const internalPageSize = ref(props.pageSize ?? 10);
// 强制响应式：用 shallowRef 或 triggerRef
import { triggerRef } from "vue";
watch(() => props.page, (v) => { if (typeof v === "number") internalPage.value = v; });
watch(() => props.pageSize, (v) => { if (typeof v === "number") internalPageSize.value = v; });

/** 所有选中行（跨页合并） */
const allSelectedRows = computed<Record<string, unknown>[]>(() => Object.values(selectedRowsMap.value));

/** 选中行数量 */
const selectedCount = computed(() => Object.keys(selectedRowsMap.value).length);

/** 是否有选中行 */
const hasSelected = computed(() => selectedCount.value > 0);

/** 批量选择模式是否激活 */
const batchSelectActive = ref(false);

/** 编辑模式 */
const batchEditing = ref(false);

/** 批量处理中 */
const batchProcessing = ref(false);

/** el-table selection-change 回调 */
function onSelectionChange(rows: Record<string, unknown>[]): void {
  currentPageSelection.value = rows;
  // 更新当前页的选中状态到 map
  const currentPageKeys = new Set<string>();
  for (const row of rows) {
    const key = String(row[props.rowKey] ?? "");
    if (key) {
      selectedRowsMap.value[key] = row;
      currentPageKeys.add(key);
    }
  }
  // 移除当前页中未选中的行（从 dataList 中获取当前页所有 key）
  for (const row of dataList.value ?? []) {
    const key = String(row[props.rowKey] ?? "");
    if (key && !currentPageKeys.has(key) && selectedRowsMap.value[key]) {
      delete selectedRowsMap.value[key];
    }
  }
  saveSelectionToStorage(selectedRowsMap.value);
  emit("selection-change", allSelectedRows.value);
}

/** 切换批量选择模式 */
function toggleBatchSelect(): void {
  batchSelectActive.value = !batchSelectActive.value;
  if (!batchSelectActive.value) {
    // 退出批量选择模式，清空选中
    clearAllSelection();
  }
}

/** 清空所有选中 */
function clearAllSelection(): void {
  selectedRowsMap.value = {};
  currentPageSelection.value = [];
  removeSelectionFromStorage();
  elTableRef.value?.clearSelection();
  emit("selection-change", []);
}

/** 批量删除 */
async function onBatchDelete(): Promise<void> {
  const rows = allSelectedRows.value;
  const handler = getBatchDeleteHandler();
  if (!handler) return;
  batchProcessing.value = true;
  try {
    await handler(rows);
    clearAllSelection();
  } finally {
    batchProcessing.value = false;
  }
}

/** 获取批量删除 handler */
function getBatchDeleteHandler() {
  const cfg = props.toolbarConfig?.batchDelete;
  if (!cfg || cfg === true) return undefined;
  return cfg.handler;
}

/** 批量编辑 */
function onBatchEdit(): void {
  batchEditing.value = true;
  emit("batch-edit");
}

/** 批量保存 */
async function onBatchSave(): Promise<void> {
  const rows = allSelectedRows.value;
  const handler = getBatchEditHandler();
  if (!handler) return;
  batchProcessing.value = true;
  try {
    await handler(rows);
    batchEditing.value = false;
    clearAllSelection();
  } finally {
    batchProcessing.value = false;
  }
}

/** 获取批量修改 handler */
function getBatchEditHandler() {
  const cfg = props.toolbarConfig?.batchEdit;
  if (!cfg || cfg === true) return undefined;
  return cfg.handler;
}

/** ========== 右键菜单状态 ========== */
const ctxMenuVisible = ref(false);
/** 内部兜底状态：父组件未绑定 v-model:search-visible 时本地生效 */
const localSearchVisible = ref(props.searchVisible ?? true);
watch(
  () => props.searchVisible,
  (v) => { if (v !== undefined) localSearchVisible.value = v; },
);
const searchVisible = computed({
  get: () => props.searchVisible ?? localSearchVisible.value,
  set: (v: boolean) => {
    localSearchVisible.value = v;
    emit('update:searchVisible', v);
  },
});

/** ========== 内置 ReSearch 搜索区 ========== */
const searchEnabled = computed(() => props.search === true || (typeof props.search === "object" && props.search !== null));
const searchConfig = computed<ReTableSearchConfig>(() => (props.search && typeof props.search === "object" ? props.search : {}));
/** 搜索区是否渲染：开启内置 ReSearch 或（showSearch 且有 #search 插槽） */
const searchAreaVisible = computed(() => searchEnabled.value || (props.showSearch && !!parentSlots.search));
/** searchGap > 0 时搜索区渲染为独立卡片样式（与表格之间露出间距） */
const searchSeparated = computed(() => (props.searchGap ?? 0) > 0);
const searchGapStyle = computed(() => ({ marginBottom: `${props.searchGap ?? 0}px` }));
function onSearchModelUpdate(value: Record<string, unknown>): void {
  emit("update:searchModel", value);
}
function onBuiltinSearch(): void {
  emit("search");
  void reload();
}
function onBuiltinSearchReset(): void {
  emit("search-reset");
}
function onBuiltinSearchRefresh(): void {
  emit("refresh");
  void reload();
}
const ctxMenuX = ref(0);
const ctxMenuY = ref(0);
const ctxMenuContext = ref<ReTableContextMenuContext | undefined>(undefined);

/** 行右键事件（el-table） */
function onRowContextMenu(row: Record<string, unknown>, _column: any, event: MouseEvent): void {
  if (!props.contextMenu || props.contextMenu.length === 0) return;
  event.preventDefault();
  ctxMenuX.value = event.clientX;
  ctxMenuY.value = event.clientY;
  ctxMenuContext.value = {
    row,
    rowIndex: (dataList.value ?? []).indexOf(row),
    event,
  };
  ctxMenuVisible.value = true;
}

/** 单元格右键事件 */
function onCellContextMenu(row: Record<string, unknown>, column: any, event: MouseEvent): void {
  if (!props.contextMenu || props.contextMenu.length === 0) return;
  event.preventDefault();
  ctxMenuX.value = event.clientX;
  ctxMenuY.value = event.clientY;
  ctxMenuContext.value = {
    row,
    rowIndex: (dataList.value ?? []).indexOf(row),
    columnProp: column?.property || column?.prop,
    columnLabel: column?.label,
    event,
  };
  ctxMenuVisible.value = true;
}

/** 右键菜单选择 */
function onContextMenuSelect(item: ReTableContextMenuItem, ctx: ReTableContextMenuContext): void {
  emit("context-menu-select", item, ctx);
}

/** ========== 缺陷4: 列设置面板搜索 ========== */
const columnSearchKey = ref("");
const filteredColumnsForSettings = computed<ReTableColumn[]>(() => {
  if (!columnSearchKey.value) return allColumnsForSettings.value;
  const key = columnSearchKey.value.toLowerCase();
  return allColumnsForSettings.value.filter((c) => c.label.toLowerCase().includes(key) || c.prop.toLowerCase().includes(key));
});

/** ========== 缺陷5: 行拖拽排序 ========== */
const rowDragIndex = ref<number>(-1);

function onRowDragStart(index: number, event: DragEvent): void {
  rowDragIndex.value = index;
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
}

function onRowDragOver(event: DragEvent): void {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
}

function onRowDrop(index: number): void {
  if (rowDragIndex.value === -1 || rowDragIndex.value === index) return;
  const data = [...(dataList.value ?? [])];
  const [moved] = data.splice(rowDragIndex.value, 1);
  data.splice(index, 0, moved);
  rowDragIndex.value = -1;
  emit("row-sort", {
    row: moved,
    fromIndex: rowDragIndex.value,
    toIndex: index,
    newData: data,
  });
}

function onRowDragEnd(): void {
  rowDragIndex.value = -1;
}

/** ========== 缺陷6: 列宽调整 ========== */
/** border 模式 + resizable 设置 → 列宽拖拽 */
const borderResizable = computed(() => (localSettings.value.resizable ?? true) && (localSettings.value.border ?? false));

/** ========== 缺陷8: inline edit 编辑值缓存 ========== */
const editCache = ref<Record<string, Record<string, unknown>>>({});

/** 获取编辑值 */
function getEditValue(row: Record<string, unknown>, col: ReTableColumn): unknown {
  const key = String(row[props.rowKey] ?? "");
  if (editCache.value[key]?.[col.prop] !== undefined) {
    return editCache.value[key][col.prop];
  }
  return row[col.prop];
}

/** 设置编辑值 */
function setEditValue(row: Record<string, unknown>, col: ReTableColumn, value: unknown): void {
  const key = String(row[props.rowKey] ?? "");
  if (!editCache.value[key]) editCache.value[key] = {};
  editCache.value[key][col.prop] = value;
}

/** 判断列是否可编辑 */
function isColEditable(col: ReTableColumn): boolean {
  return batchEditing.value && (col.editable ?? false);
}

/** ========== 缺陷9: 远程排序 ========== */
function onSortChange(payload: { column?: any; prop: string; order: "ascending" | "descending" | null }): void {
  emit("sort-change", { prop: payload.prop, order: payload.order });
}

/** ========== 缺陷10: 树形数据 ========== */
const effectiveTreeProps = computed(() => props.treeProps ?? undefined);

/** 单元格点击事件 */
function onCellClick(row: Record<string, unknown>, column: any, cell: any, event: MouseEvent): void {
  emit("cell-click", {
    row,
    rowIndex: (dataList.value ?? []).indexOf(row),
    columnProp: column?.property || column?.prop || "",
    columnLabel: column?.label || "",
    cellValue: row[column?.property || column?.prop || ""],
    event,
  });
}

/** 恢复当前页选中状态（分页切换后调用） */
function restoreSelection(): void {
  if (!batchSelectActive.value || !elTableRef.value) return;
  nextTick(() => {
    const data = dataList.value ?? [];
    for (const row of data) {
      const key = String(row[props.rowKey] ?? "");
      if (key && selectedRowsMap.value[key]) {
        elTableRef.value?.toggleRowSelection(row, true);
      }
    }
  });
}

/** 是否使用远程模式 */
const isRemote = computed<boolean>(() => Boolean(props.url) || typeof props.loader === "function");

/** 远程模式：总条数由接口返回 */
const remoteTotal = ref<number>(0);
const totalToShow = computed<number>(() => (isRemote.value ? remoteTotal.value : props.total));

/** 表格外观设置：受控（v-model:settings），并写入 props.settings 响应 */
const localSettings = ref<ReTableSettings>({ border: true, ...props.settings });
watch(
  () => props.settings,
  (v) => {
    localSettings.value = { ...v };
  },
  { deep: true, immediate: true },
);

function emitSettings(): void {
  emit("update:settings", { ...localSettings.value });
}

function onSettingChange<K extends keyof ReTableSettings>(key: K, value: ReTableSettings[K]): void {
  localSettings.value = { ...localSettings.value, [key]: value };
  emitSettings();
  saveColumnState();
}

/** 实际生效的 storage：props 注入 → provide 注入 → localStorage 默认 */
const injectedStorage = inject<ReTableColumnStorage | undefined>(RE_TABLE_STORAGE_KEY, undefined);
const effectiveStorage = computed<ReTableColumnStorage>(() => props.storage ?? injectedStorage ?? localColumnStorage);

/** 列持久化状态（顺序 + 隐藏） */
const columnState = ref<ReTableColumnState>({ order: [], hidden: [] });

/** 标记：正在从持久化恢复分页状态 */
let isRestoringState = false;

/** 初始化列顺序：props.columns 决定默认顺序，持久化存在时覆盖 */
function defaultOrderFromColumns(): string[] {
  return props.columns.filter((c) => !c.hidden).map((c) => c.prop);
}

function loadColumnState(): void {
  if (!props.tableId) {
    columnState.value = { order: defaultOrderFromColumns(), hidden: [] };
    return;
  }
  const saved = effectiveStorage.value.get(props.tableId);
  if (saved) {
    // 过滤掉已不存在的列 prop
    const propsList = props.columns.map((c) => c.prop);
    const validOrder = saved.order.filter((p) => propsList.includes(p));
    // 把新出现的列追加到末尾
    for (const p of propsList) {
      if (!validOrder.includes(p) && !saved.hidden.includes(p)) validOrder.push(p);
    }
    columnState.value = {
      order: validOrder,
      hidden: saved.hidden.filter((p) => propsList.includes(p)),
    };
    // 恢复分页与设置（完整状态扩展字段）
    // 标记 isRestoringState，避免 emit page/pageSize 时触发多余 reload
    isRestoringState = true;
    let restoredPage = false;
    try {
      const full = saved as ReTableFullState;
      if (typeof full.page === "number") { emit("update:page", full.page); restoredPage = true; }
      if (typeof full.pageSize === "number") emit("update:pageSize", full.pageSize);
      if (full.settings) {
        localSettings.value = { ...localSettings.value, ...full.settings };
        emitSettings();
      }
    } finally {
      // nextTick 后重置标记，并确保恢复的分页状态生效后重新加载数据
      nextTick(() => {
        isRestoringState = false;
        // 恢复了分页状态时，等 props 更新后重新加载对应页的数据
        if (restoredPage && isRemote.value && props.autoReload) {
          void dsReload();
        }
      });
    }
    return;
  }
  columnState.value = { order: defaultOrderFromColumns(), hidden: [] };
}

function saveColumnState(): void {
  if (!props.tableId) return;
  // 保存列配置 + 分页 + 设置（完整状态）
  const fullState: ReTableFullState = {
    ...columnState.value,
    page: props.page,
    pageSize: props.pageSize,
    settings: localSettings.value,
  };
  effectiveStorage.value.set(props.tableId, fullState);
}

/** 监听 tableId / columns 变化时重载列配置 */
watch(
  () => [props.tableId, props.columns] as const,
  () => {
    loadColumnState();
  },
  { immediate: true, deep: true },
);

/** 应用列顺序与隐藏后的最终列数组 */
const visibleColumns = computed<ReTableColumn[]>(() => {
  const baseList = props.columns;
  const order = columnState.value.order;
  const hidden = new Set(columnState.value.hidden);
  const byProp = new Map(baseList.map((c) => [c.prop, c] as const));
  // 先按 order 排，再追加 order 中没有的列
  const ordered: ReTableColumn[] = [];
  const seen = new Set<string>();
  for (const prop of order) {
    const col = byProp.get(prop);
    if (col) {
      ordered.push(col);
      seen.add(prop);
    }
  }
  for (const col of baseList) {
    if (!seen.has(col.prop)) ordered.push(col);
  }
  return ordered.filter((c) => !hidden.has(c.prop) && !c.hidden);
});

/** 列设置面板使用：含所有列（隐藏列也展示） */
const allColumnsForSettings = computed<ReTableColumn[]>(() => {
  const order = columnState.value.order;
  const byProp = new Map(props.columns.map((c) => [c.prop, c] as const));
  const ordered: ReTableColumn[] = [];
  const seen = new Set<string>();
  for (const prop of order) {
    const col = byProp.get(prop);
    if (col) {
      ordered.push(col);
      seen.add(prop);
    }
  }
  for (const col of props.columns) {
    if (!seen.has(col.prop)) ordered.push(col);
  }
  return ordered;
});

/** 列设置面板：可见列的 prop（未隐藏 = 选中） */
const visiblePropList = computed<string[]>(() =>
  allColumnsForSettings.value
    .map((c) => c.prop)
    .filter((p) => !columnState.value.hidden.includes(p)),
);

function onColumnCheckChange(propsList: string[]): void {
  const all = allColumnsForSettings.value.map((c) => c.prop);
  const visible = new Set(propsList);
  const hidden = all.filter((p) => !visible.has(p));
  columnState.value = { ...columnState.value, hidden };
  saveColumnState();
}

/** 列设置面板拖拽排序 */
const dragIndex = ref<number>(-1);

function onDragStart(index: number, event: DragEvent): void {
  dragIndex.value = index;
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
}

function onDragOver(event: DragEvent): void {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
}

function onDrop(index: number): void {
  if (dragIndex.value === -1 || dragIndex.value === index) return;
  const list = [...columnState.value.order];
  const [moved] = list.splice(dragIndex.value, 1);
  list.splice(index, 0, moved);
  columnState.value = { ...columnState.value, order: list };
  dragIndex.value = -1;
  saveColumnState();
}

function onDragEnd(): void {
  dragIndex.value = -1;
}

function moveColumn(index: number, delta: number): void {
  const list = [...columnState.value.order];
  const target = index + delta;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
  columnState.value = { ...columnState.value, order: list };
  saveColumnState();
}

function resetColumns(): void {
  if (props.tableId) effectiveStorage.value.remove(props.tableId);
  loadColumnState();
}

/** 远程数据加载 */
function buildRemoteSource(): ReDataSource<Array<Record<string, unknown>>> {
  const run = async (): Promise<Array<Record<string, unknown>>> => {
    const paramObj = { ...(props.params ?? {}), ...(props.searchModel ?? {}) };
    const curPage = internalPage.value || props.page || 1;
    const curSize = internalPageSize.value || props.pageSize || 10;
    const loadParams = {
      page: curPage,
      pageSize: curSize,
      params: { ...paramObj, page: curPage, pageSize: curSize },
    };
    let result: RePageResult | undefined;
    try {
      if (typeof props.loader === "function") {
        result = await props.loader(loadParams);
      } else if (props.url) {
        const qs = new URLSearchParams();
        qs.set("page", String(loadParams.page));
        qs.set("pageSize", String(loadParams.pageSize));
        for (const [k, v] of Object.entries(paramObj)) {
          if (v === undefined || v === null || v === "") continue;
          qs.set(k, String(v));
        }
        const sep = props.url.includes("?") ? "&" : "?";
        const fullUrl = `${props.url}${sep}${qs.toString()}`;
        const { data } = await http().get(fullUrl).headers({ Accept: "application/json" });
        result = extractPageResult(data);
      }
      if (!result) throw new Error("未获取到分页数据");
      remoteTotal.value = Number(result.total ?? 0);
      emit("update:total", remoteTotal.value);
      emit("load", result);
      return extractRecords(result);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      emit("load-error", err);
      throw err;
    }
  };
  return run;
}

function extractPageResult(payload: unknown): RePageResult | undefined {
  if (payload == null || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.total === "number") return obj as unknown as RePageResult;
  const inner = (typeof obj.data === "object" && obj.data !== null ? obj.data : obj) as Record<
    string,
    unknown
  >;
  if (typeof inner.total === "number") return inner as unknown as RePageResult;
  return undefined;
}

function extractRecords(result: RePageResult): Array<Record<string, unknown>> {
  for (const key of ["records", "rows", "list", "items", "content", "data"] as const) {
    if (Array.isArray(result[key])) return result[key] as Array<Record<string, unknown>>;
  }
  return [];
}

const sourceRef = computed<ReDataSource<Array<Record<string, unknown>>>>(() => {
  if (isRemote.value) return buildRemoteSource();
  return props.data ?? [];
});

const { loading: dataLoading, data: dataList, reload: dsReload } = useDataSource<Array<Record<string, unknown>>>(
  sourceRef,
);

/** params 变化 → 重置回第 1 页并重新加载 */
const internalParamsKey = computed<string>(() => {
  const p = { ...(props.params ?? {}) } as Record<string, unknown>;
  delete p.page;
  delete p.pageSize;
  return JSON.stringify(p);
});
const lastParamsKey = ref<string>(internalParamsKey.value);

watch(internalParamsKey, (key) => {
  if (!isRemote.value || !props.autoReload) return;
  if (key === lastParamsKey.value) return;
  lastParamsKey.value = key;
  if (props.page !== 1) {
    emit("update:page", 1);
  }
  // params 变化后等 props 更新再重新加载
  nextTick(() => { void dsReload(); });
});

/** page 变化 → 重新加载远程数据 */
watch(() => props.page, (p, oldP) => {
  if (!isRemote.value || !props.autoReload) return;
  if (p === oldP) return;
  nextTick(() => { void dsReload(); });
});

/** internalPage 变化（用户点击分页）→ 同步并 reload */
watch(internalPage, (p, oldP) => {
  if (!isRemote.value || !props.autoReload) return;
  if (p === oldP) return;
  emit("update:page", p);
  nextTick(() => { void dsReload(); });
});

/** 原生分页辅助 */
const paginationTotalPages = computed(() => Math.max(1, Math.ceil(totalToShow.value / internalPageSize.value)));
const paginationPageList = computed(() => {
  const total = paginationTotalPages.value;
  const cur = internalPage.value;
  const list: number[] = [];
  for (let i = 1; i <= total; i++) list.push(i);
  return list;
});
function goToPage(p: number) {
  if (p < 1 || p > paginationTotalPages.value || p === internalPage.value) return;
  internalPage.value = p;
  // watch internalPage 会自动 emit update:page 和 dsReload
}
function onPageClick(p: number) {
  goToPage(p);
}
function onPrevPage() {
  goToPage((props.page || internalPage.value) - 1);
}
function onNextPage() {
  goToPage((props.page || internalPage.value) + 1);
}

function formatCell(row: Record<string, unknown>, column: ReTableColumn): string {
  const value = row[column.prop];
  if (column.formatter) {
    return column.formatter(row, column, value);
  }
  if (value == null) return "-";
  return String(value);
}

function onPageChange(p: number): void {
  (window as any).__onPageChange = p;
  internalPage.value = p;
  emit("update:page", p);
  saveColumnState();
  restoreSelection();
  // 等 props 更新后重新加载远程数据
  if (isRemote.value && props.autoReload) {
    nextTick(() => { void dsReload(); });
  }
}
function onSizeChange(s: number): void {
  internalPageSize.value = s;
  emit("update:pageSize", s);
  if (props.page !== 1) {
    internalPage.value = 1;
    emit("update:page", 1);
  }
  saveColumnState();
  restoreSelection();
  // 等 props 更新后重新加载远程数据
  if (isRemote.value && props.autoReload) {
    nextTick(() => { void dsReload(); });
  }
}

async function reload(): Promise<void> {
  await dsReload();
}
/**
 * 跳转到指定页/每页条数。
 * 使用 nextTick 确保 page/pageSize props 更新后再 reload。
 */
async function goto(page?: number, size?: number): Promise<void> {
  if (typeof page === "number" && page > 0) {
    internalPage.value = page;
    emit("update:page", page);
  }
  if (typeof size === "number" && size > 0) {
    internalPageSize.value = size;
    emit("update:pageSize", size);
  }
  await nextTick();
  await dsReload();
}

/** 表格尺寸：紧凑模式 → small */
const tableSize = computed<"default" | "small">(() =>
  localSettings.value.compact ? "small" : "default",
);

/** 空数据状态（用于添加 body 最小高度，避免无行时表格塌陷） */
const isEmpty = computed(() => !dataList.value || dataList.value.length === 0);

/** 表格最小高度（空数据时保持此高度，默认 300px） */
const tableMinHeight = computed<string>(() => {
  const mh = props.layoutTable?.minHeight;
  if (mh === undefined || mh === null) return "300px";
  return typeof mh === "number" ? `${mh}px` : mh;
});

defineExpose({
  reload,
  goto,
  resetColumns,
  clearAllSelection,
  toggleBatchSelect,
  getSelectedRows: () => allSelectedRows.value,
  getEditCache: () => editCache.value,
  clearEditCache: () => { editCache.value = {}; },
  get loading(): boolean {
    return dataLoading.value;
  },
  get data(): Array<Record<string, unknown>> | null {
    return dataList.value;
  },
  get batchSelectActive(): boolean {
    return batchSelectActive.value;
  },
  get batchEditing(): boolean {
    return batchEditing.value;
  },
});

/** ========== toolbarConfig 解析 ========== */
function isBatchEnabled(val: unknown): boolean {
  if (!val) return false;
  if (val === true) return true;
  if (typeof val === "object" && val !== null && "enabled" in val) return (val as any).enabled !== false;
  return Boolean(val);
}
const hasToolbarConfig = computed(() => {
  const cfg = props.toolbarConfig;
  if (!cfg) return false;
  return isBatchEnabled(cfg.batchDelete) || isBatchEnabled(cfg.batchSelect) || isBatchEnabled(cfg.batchEdit);
});

const toolbarConfigPosition = computed<"top" | "bottom">(() => props.toolbarConfig?.position ?? "top");

const batchSelectTip = computed(() => {
  const cfg = props.toolbarConfig?.batchSelect;
  if (!cfg || cfg === true) return "批量选择";
  return cfg.tip || "批量选择";
});

const batchDeleteTip = computed(() => {
  const cfg = props.toolbarConfig?.batchDelete;
  if (!cfg || cfg === true) return "批量删除";
  return cfg.tip || "批量删除";
});

const batchEditTip = computed(() => {
  const cfg = props.toolbarConfig?.batchEdit;
  if (!cfg || cfg === true) return "批量修改";
  return cfg.tip || "批量修改";
});

/** 工具栏按钮图标（来自 @element-plus/icons-vue） */
const iconRefresh = Refresh;
const iconColumns = Menu;
const iconSettings = Setting;
const iconDelete = Delete;
const iconEdit = Edit;
const iconCheck = Check;
const iconSelect = Select;
</script>

<template>
  <div
    class="re-table"
    :class="{ 're-table--empty': isEmpty, 're-table--compact': tableSize === 'small', 're-table--separated': searchSeparated }"
    :style="{ '--re-table-min-height': tableMinHeight }"
  >
    <!-- 内置搜索区（search 开启内置 ReSearch；或 showSearch=true 配合 #search 插槽） -->
    <div
      v-if="searchAreaVisible"
      class="re-table__search"
      :style="searchGapStyle"
    >
      <template v-if="searchEnabled">
        <div v-show="searchVisible">
          <ReSearch
            :filters="searchConfig.filters ?? []"
            :model-value="searchModel ?? {}"
            :title="searchConfig.title ?? '搜索'"
            :max="searchConfig.max ?? 0"
            :btn-mode="searchConfig.btnMode ?? 'icon'"
            :filter-visible="searchVisible"
            :show-toggle="false"
            :show-search-btn="searchConfig.showSearchBtn ?? true"
            :show-reset-btn="searchConfig.showResetBtn ?? true"
            :show-refresh-btn="false"
            :show-add-btn="false"
            :show-batch-delete-btn="false"
            :show-batch-select-btn="false"
            @update:model-value="onSearchModelUpdate"
            @update:filter-visible="searchVisible = $event"
            @search="onBuiltinSearch"
            @reset="onBuiltinSearchReset"
            @refresh="onBuiltinSearchRefresh"
          />
        </div>
      </template>
      <template v-else>
        <div v-if="showSearchTitle" class="re-table__search-bar">
          <div class="re-table__search-title">
            <el-icon :size="16"><Search /></el-icon>
            <span>搜索</span>
          </div>
          <div v-if="showSearchToggle" class="re-table__search-toggle" @click="emit('toggle-search')">
            <span>{{ searchVisible ? '收起' : '展开' }}</span>
            <el-icon class="re-table__search-toggle-icon"><ArrowUp v-if="searchVisible" /><ArrowDown v-else /></el-icon>
          </div>
        </div>
        <div v-show="searchVisible" class="re-table__search-body">
          <slot name="search" />
        </div>
      </template>
    </div>

    <!-- 主体区（两卡模式下与搜索区分离，各自成卡） -->
    <div class="re-table__main">
    <!-- 工具栏行：左侧 #toolbar 自定义按钮，右侧搜索开关 + 刷新（search 开启时） -->
    <div v-if="$slots.toolbar || searchEnabled" class="re-table__toolbar-row">
      <div v-if="$slots.toolbar" class="re-table__toolbar-left">
        <slot name="toolbar" />
      </div>
      <div v-if="searchEnabled" class="re-table__toolbar-right">
        <ReButton
          layout="square"
          :icon="searchVisible ? 'Hide' : 'View'"
          :title="searchVisible ? '隐藏搜索' : '显示搜索'"
          @click="searchVisible = !searchVisible"
        />
        <ReButton
          layout="square"
          icon="Refresh"
          title="刷新"
          :loading="dataLoading || loading"
          @click="onBuiltinSearchRefresh"
        />
      </div>
    </div>

    <!-- 顶部工具栏（当 toolbarConfig.position === 'top' 时）：只放批量操作按钮，工具区在分页行 -->
    <div v-if="toolbar && hasToolbarConfig && toolbarConfigPosition === 'top'" class="re-table__toolbar-top">
      <ReTableToolbar
        mode="batch"
        :config="toolbarConfig"
        :selected-count="selectedCount"
        :editing="batchEditing"
        :processing="batchProcessing"
        :loading="dataLoading || loading"
        :size="tableSize"
        @batch-delete="onBatchDelete"
        @batch-edit="onBatchEdit"
        @batch-save="onBatchSave"
        @batch-select-toggle="toggleBatchSelect"
      />
    </div>

    <!-- 默认表格模式 -->
    <ElTable
      v-if="layout === 'table'"
      ref="elTableRef"
      v-bind="$attrs"
      :data="dataList ?? []"
      :loading="loading || dataLoading"
      :highlight-current-row="localSettings.highlightCurrentRow ?? false"
      :stripe="localSettings.stripe ?? false"
      :border="localSettings.border ?? true"
      :size="tableSize"
      :row-key="rowKey"
      :show-header="layoutTable?.showHeader ?? true"
      :height="layoutTable?.height"
      :max-height="layoutTable?.maxHeight"
      :style="!layoutTable?.height && !layoutTable?.maxHeight ? { minHeight: tableMinHeight } : undefined"
      :tree-props="effectiveTreeProps"
      :default-expand-all="defaultExpandAll"
      :row-style="rowDraggable ? { cursor: 'grab' } : undefined"
      @row-click="(row: Record<string, unknown>) => emit('row-click', row)"
      @cell-click="(row: Record<string, unknown>, column: any, cell: any, event: MouseEvent) => onCellClick(row, column, cell, event)"
      @row-contextmenu="(row: Record<string, unknown>, column: any, event: MouseEvent) => onRowContextMenu(row, column, event)"
      @cell-contextmenu="(row: Record<string, unknown>, column: any, cell: any, event: MouseEvent) => onCellContextMenu(row, column, event)"
      @selection-change="onSelectionChange"
      @sort-change="(payload: any) => onSortChange(payload)"
    >
      <!-- 批量选择 checkbox 列 -->
      <ElTableColumn
        v-if="showSelection || batchSelectActive || isBatchEnabled(toolbarConfig.batchSelect)"
        type="selection"
        width="50"
        fixed="left"
      />
      <template v-for="col in visibleColumns" :key="col.prop || col.label">
        <ElTableColumn
          v-if="hasColSlot(col)"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
          :align="col.align"
          :sortable="col.sortable"
          :resizable="col.resizable ?? borderResizable"
          :show-overflow-tooltip="col.showOverflowTooltip"
        >
          <template #default="{ row }">
            <slot :name="resolveColSlotName(col)" :row="row" :value="row[col.prop]" :editing="batchEditing" />
          </template>
        </ElTableColumn>
        <ElTableColumn
          v-else
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
          :align="col.align"
          :sortable="col.sortable"
          :resizable="col.resizable ?? borderResizable"
          :show-overflow-tooltip="col.showOverflowTooltip"
        >
          <template #default="{ row }">
            <!-- 缺陷8: inline edit -->
            <template v-if="isColEditable(col)">
              <ElInput
                v-if="col.editType === 'text' || !col.editType"
                :model-value="String(getEditValue(row, col) ?? '')"
                size="small"
                @input="(v: string) => setEditValue(row, col, v)"
              />
              <ElInput
                v-else-if="col.editType === 'number'"
                type="number"
                :model-value="String(getEditValue(row, col) ?? '')"
                size="small"
                @input="(v: string) => setEditValue(row, col, Number(v))"
              />
              <el-select
                v-else-if="col.editType === 'select'"
                :model-value="getEditValue(row, col)"
                size="small"
                @change="(v: unknown) => setEditValue(row, col, v)"
              >
                <el-option
                  v-for="opt in (col.editOptions ?? [])"
                  :key="String(opt.value)"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <ElInput
                v-else-if="col.editType === 'date'"
                type="date"
                :model-value="String(getEditValue(row, col) ?? '')"
                size="small"
                @input="(v: string) => setEditValue(row, col, v)"
              />
            </template>
            <template v-else>
              {{ formatCell(row, col) }}
            </template>
          </template>
        </ElTableColumn>
      </template>
      <template #empty>
        <div class="re-table__empty">
          <svg viewBox="0 0 64 41" class="re-table__empty-icon">
            <g fill="none" fill-rule="evenodd" stroke="currentColor" stroke-width="2">
              <ellipse cx="32" cy="33" rx="32" ry="7" fill="var(--el-fill-color-light)"/>
              <g fill="var(--el-fill-color)" stroke-linecap="round">
                <path d="M12 14l8-8h16l8 8v14a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z"/>
                <path d="M20 6l-8 8h16l8-8"/>
              </g>
            </g>
          </svg>
          <p>{{ emptyText }}</p>
        </div>
      </template>
      <slot />
    </ElTable>

    <!-- 虚拟表格模式 -->
    <ReTableVirtualView
      v-else-if="layout === 'virtual'"
      :rows="dataList ?? []"
      :columns="visibleColumns"
      :layout="layoutVirtual ?? {}"
      :row-key="rowKey"
      :selectable="batchSelectActive || isBatchEnabled(toolbarConfig.batchSelect)"
      :context-menu="contextMenu"
      :empty-text="emptyText"
      :loading="loading || dataLoading"
      :pagination="pagination"
      :page="page"
      :page-size="pageSize"
      :total="totalToShow"
      :page-sizes="pageSizes"
      @row-click="(row: Record<string, unknown>) => emit('row-click', row)"
      @cell-click="(payload: ReTableCellClickPayload) => emit('cell-click', payload)"
      @selection-change="onSelectionChange"
      @context-menu="(ctx: ReTableContextMenuContext) => { ctxMenuX = ctx.event.clientX; ctxMenuY = ctx.event.clientY; ctxMenuContext = ctx; ctxMenuVisible = true; }"
      @sort-change="(payload: any) => onSortChange(payload)"
      @update:page="(p: number) => onPageChange(p)"
      @update:page-size="(s: number) => onSizeChange(s)"
    />

    <!-- 卡片模式（瀑布流） -->
    <ReTableCardView
      v-else-if="layout === 'card'"
      :rows="dataList ?? []"
      :columns="visibleColumns"
      :layout="layoutCard ?? {}"
      :row-key="rowKey"
      :selectable="batchSelectActive || isBatchEnabled(toolbarConfig.batchSelect)"
      :context-menu="contextMenu"
      :empty-text="emptyText"
      @row-click="(row: Record<string, unknown>) => emit('row-click', row)"
      @selection-change="onSelectionChange"
      @context-menu="(ctx: ReTableContextMenuContext) => { ctxMenuX = ctx.event.clientX; ctxMenuY = ctx.event.clientY; ctxMenuContext = ctx; ctxMenuVisible = true; }"
    />

    <!-- Modern 扁平表格模式（异步加载） -->
    <ReTableModernView
      v-else-if="layout === 'modern'"
      :rows="dataList ?? []"
      :columns="visibleColumns"
      :loading="loading || dataLoading"
      :empty-text="emptyText"
      :row-key="rowKey"
      :selectable="batchSelectActive || isBatchEnabled(toolbarConfig.batchSelect)"
      :pagination="pagination"
      :page="page"
      :page-size="pageSize"
      :total="totalToShow"
      :page-sizes="pageSizes"
      @row-click="(row: Record<string, unknown>) => emit('row-click', row)"
      @cell-click="(payload: ReTableCellClickPayload) => emit('cell-click', payload)"
      @selection-change="onSelectionChange"
      @row-contextmenu="(ctx: ReTableContextMenuContext) => { ctxMenuX = ctx.event.clientX; ctxMenuY = ctx.event.clientY; ctxMenuContext = ctx; ctxMenuVisible = true; }"
      @update:page="(p: number) => onPageChange(p)"
      @update:page-size="(s: number) => onSizeChange(s)"
    />

    <!-- Canvas 表格模式（AG Grid，异步加载） -->
    <ReTableCanvasView
      v-else-if="layout === 'canvas'"
      :rows="dataList ?? []"
      :columns="visibleColumns"
      :layout="layoutCanvas ?? {}"
      :row-key="rowKey"
      :selectable="batchSelectActive || isBatchEnabled(toolbarConfig.batchSelect)"
      :context-menu="contextMenu"
      :empty-text="emptyText"
      :loading="loading || dataLoading"
      :pagination="pagination"
      :page="page"
      :page-size="pageSize"
      :total="totalToShow"
      :page-sizes="pageSizes"
      @row-click="(row: Record<string, unknown>) => emit('row-click', row)"
      @cell-click="(payload: ReTableCellClickPayload) => emit('cell-click', payload)"
      @selection-change="onSelectionChange"
      @context-menu="(ctx: ReTableContextMenuContext) => { ctxMenuX = ctx.event.clientX; ctxMenuY = ctx.event.clientY; ctxMenuContext = ctx; ctxMenuVisible = true; }"
      @sort-change="(payload: any) => onSortChange(payload)"
      @update:page="(p: number) => onPageChange(p)"
      @update:page-size="(s: number) => onSizeChange(s)"
    />

    <!-- 放射菜单模式 -->
    <ReTableRadialView
      v-else-if="layout === 'radial'"
      :rows="dataList ?? []"
      :columns="visibleColumns"
      :layout="layoutRadial ?? {}"
      :row-key="rowKey"
      :selectable="batchSelectActive || isBatchEnabled(toolbarConfig.batchSelect)"
      :context-menu="contextMenu"
      :empty-text="emptyText"
      @row-click="(row: Record<string, unknown>) => emit('row-click', row)"
      @cell-click="(payload: any) => emit('cell-click', payload)"
      @selection-change="onSelectionChange"
      @context-menu="(ctx: ReTableContextMenuContext) => { ctxMenuX = ctx.event.clientX; ctxMenuY = ctx.event.clientY; ctxMenuContext = ctx; ctxMenuVisible = true; }"
      @menu-select="(payload: any) => emit('row-click', payload.row)"
    />

    <div v-if="pagination || toolbar" class="re-table__footer">
      <div class="re-table__toolbar" v-if="toolbar || pagination">
        <!-- 左侧：分页 -->
        <div v-if="pagination" class="re-table__pagination">
          <span class="re-table__pagination-total">共 {{ totalToShow }} 条</span>
          <button class="page-nav-btn" :disabled="internalPage <= 1" @click="onPrevPage">‹</button>
          <button
            v-for="p in paginationPageList"
            :key="p"
            class="page-nav-btn"
            :class="{ 'page-nav-btn--active': p === internalPage }"
            @click="onPageClick(p)"
          >{{ p }}</button>
          <button class="page-nav-btn" :disabled="internalPage >= paginationTotalPages" @click="onNextPage">›</button>
        </div>

        <!-- 使用 ReTableToolbar 统一组件；position=top 时分页行只保留右侧工具区，默认模式保持完整工具栏 -->
        <ReTableToolbar
          :mode="toolbarConfigPosition === 'top' ? 'tools' : 'full'"
          :config="toolbarConfig"
          :selected-count="selectedCount"
          :editing="batchEditing"
          :processing="batchProcessing"
          :loading="dataLoading || loading"
          :size="tableSize"
          :columns-trigger-text="columnsTriggerText"
          :settings-trigger-text="settingsTriggerText"
          :show-search="showSearch"
          :search-visible="searchVisible"
          @batch-delete="onBatchDelete"
          @batch-edit="onBatchEdit"
          @batch-save="onBatchSave"
          @batch-select-toggle="toggleBatchSelect"
          @refresh="reload"
          @toggle-search="searchVisible = !searchVisible"
        >
          <!-- 列设置 Popover slot -->
          <template #column-settings>
            <ElPopover
              v-if="props.columns.length > 0"
              placement="bottom-end"
              :width="280"
              trigger="click"
              popper-class="re-table__popover"
            >
              <template #reference>
                <ReButton layout="square" :size="tableSize" :icon="iconColumns" :title="columnsTriggerText" />
              </template>
              <div class="re-table__columns-panel">
                <div class="re-table__columns-header">
                  <span>列设置</span>
                  <ElButton
                    link
                    type="primary"
                    :size="tableSize"
                    @click="resetColumns"
                  >重置</ElButton>
                </div>
                <!-- 搜索过滤 -->
                <div class="re-table__columns-search">
                  <ElInput
                    v-model="columnSearchKey"
                    placeholder="搜索列..."
                    size="small"
                    clearable
                    :prefix-icon="Search"
                  />
                </div>
                <ElCheckboxGroup
                  :model-value="visiblePropList"
                  @change="(v: (string | number | boolean)[]) => onColumnCheckChange(v as string[])"
                >
                  <ul class="re-table__columns-list">
                    <li
                      v-for="(col, idx) in filteredColumnsForSettings"
                      :key="col.prop"
                      class="re-table__columns-item"
                      draggable="true"
                      @dragstart="(e: DragEvent) => onDragStart(idx, e)"
                      @dragover="onDragOver"
                      @drop="onDrop(idx)"
                      @dragend="onDragEnd"
                    >
                      <span class="re-table__drag-handle">⋮⋮</span>
                      <ElCheckbox :value="col.prop" :label="col.prop">
                        {{ col.label }}
                      </ElCheckbox>
                      <span class="re-table__columns-actions">
                        <ElButton link :size="tableSize" :disabled="idx === 0" @click="moveColumn(idx, -1)">↑</ElButton>
                        <ElButton link :size="tableSize" :disabled="idx === filteredColumnsForSettings.length - 1" @click="moveColumn(idx, 1)">↓</ElButton>
                      </span>
                    </li>
                  </ul>
                </ElCheckboxGroup>
                <div v-if="!tableId" class="re-table__columns-hint">
                  设置 tableId 后列顺序 / 隐藏将自动持久化
                </div>
              </div>
            </ElPopover>
          </template>

          <!-- 表格设置 Popover slot -->
          <template #table-settings>
            <ElPopover
              placement="bottom-end"
              :width="280"
              trigger="click"
              popper-class="re-table__popover"
            >
              <template #reference>
                <ReButton layout="square" :size="tableSize" :icon="iconSettings" :title="settingsTriggerText" />
              </template>
              <div class="re-table__settings-panel">
                <div class="settings-header">
                  <span class="settings-title">表格设置</span>
                </div>
                <div class="settings-group">
                  <div class="settings-item">
                    <div class="settings-item__label">
                      <span class="settings-item__title">斑马纹</span>
                      <span class="settings-item__desc">隔行变色提升可读性</span>
                    </div>
                    <ElSwitch
                      :model-value="localSettings.stripe ?? false"
                      @update:model-value="(v: any) => onSettingChange('stripe', Boolean(v))"
                    />
                  </div>
                  <div class="settings-item">
                    <div class="settings-item__label">
                      <span class="settings-item__title">边框</span>
                      <span class="settings-item__desc">显示表格外边框</span>
                    </div>
                    <ElSwitch
                      :model-value="localSettings.border ?? true"
                      @update:model-value="(v: any) => onSettingChange('border', Boolean(v))"
                    />
                  </div>
                  <div class="settings-item">
                    <div class="settings-item__label">
                      <span class="settings-item__title">紧凑模式</span>
                      <span class="settings-item__desc">减小行高展示更多数据</span>
                    </div>
                    <ElSwitch
                      :model-value="localSettings.compact ?? false"
                      @update:model-value="(v: any) => onSettingChange('compact', Boolean(v))"
                    />
                  </div>
                  <div class="settings-item">
                    <div class="settings-item__label">
                      <span class="settings-item__title">高亮当前行</span>
                      <span class="settings-item__desc">鼠标悬停高亮整行</span>
                    </div>
                    <ElSwitch
                      :model-value="localSettings.highlightCurrentRow ?? false"
                      @update:model-value="(v: any) => onSettingChange('highlightCurrentRow', Boolean(v))"
                    />
                  </div>
                  <div class="settings-item">
                    <div class="settings-item__label">
                      <span class="settings-item__title">可调整列宽</span>
                      <span class="settings-item__desc">拖拽列边缘调整宽度</span>
                    </div>
                    <ElSwitch
                      :model-value="localSettings.resizable ?? true"
                      @update:model-value="(v: any) => onSettingChange('resizable', Boolean(v))"
                    />
                  </div>
                </div>
              </div>
            </ElPopover>
          </template>
        </ReTableToolbar>
      </div>
    </div>

    <!-- 右键菜单 -->
    <ReTableContextMenu
      v-model:visible="ctxMenuVisible"
      :items="contextMenu"
      :context="ctxMenuContext"
      :x="ctxMenuX"
      :y="ctxMenuY"
      @select="onContextMenuSelect"
    />
    </div>
  </div>
</template>

<style>
/* 根容器：圆角 + 内边距（组件与容器边缘的边距，可用 --rt-padding 调整） */
.re-table {
  border-radius: var(--rt-radius);
  padding: var(--rt-padding, 12px);
  background: var(--rt-bg);
  font-size: var(--rt-font);
}
.re-table__search {
  margin-bottom: 12px;
}
/* 两卡模式（searchGap>0）：根容器透明，搜索区与主体区各自成白色圆角卡，间距露出页面底色 */
.re-table--separated {
  background: transparent;
  padding: 0;
}
.re-table--separated > .re-table__search {
  background: var(--rt-bg);
  border-radius: var(--rt-radius);
  padding: var(--rt-padding, 12px);
  border: 1px solid var(--el-border-color);
}
.re-table--separated > .re-table__main {
  background: var(--rt-bg);
  border-radius: var(--rt-radius);
  padding: var(--rt-padding, 12px);
  border: 1px solid var(--el-border-color);
}
/* 工具栏行：左侧业务按钮（#toolbar 插槽），右侧搜索开关/刷新 */
.re-table__toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.re-table__toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.re-table__toolbar-right {
  display: flex;
  align-items: center;
  gap: 2px;
}
.re-table__search-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}
.re-table__search-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.re-table__search-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.re-table__search-toggle:hover {
  color: var(--el-color-primary);
}
/* el-table 在根元素上本地定义 --el-table-* 变量，令牌必须直接挂在 .el-table 上才生效 */
.re-table .el-table {
  --el-table-border-color: var(--rt-border);
  --el-table-header-bg-color: var(--rt-header-bg);
  --el-table-row-hover-bg-color: var(--rt-bg-row-hover);
  --el-table-tr-bg-color: var(--rt-bg);
}
/* 表头字体（element 默认色/字重偏浅，按 rt 令牌覆盖） */
.re-table .el-table__header th.el-table__cell {
  font-weight: var(--rt-header-font-weight);
  font-size: var(--rt-header-font-size);
  color: var(--rt-text-header);
}
/* 斑马纹美化 */
.re-table .el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
  background: var(--rt-bg-strip);
}
.re-table__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--rt-gap);
  gap: var(--rt-gap);
  flex-wrap: wrap;
  /* 抵消根容器内边距，让分页行保持在原来的容器边缘位置 */
  margin-left: calc(var(--rt-padding, 12px) * -1);
  margin-right: calc(var(--rt-padding, 12px) * -1);
  margin-bottom: calc(var(--rt-padding, 12px) * -1);
}
.re-table__toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  order: 2;
  margin-left: auto;
  width: 100%;
}
.re-table__pagination {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 6px;
  flex: none;
  order: 0;
  border-right: none;
  position: relative;
  z-index: 1;
  padding: 12px 0;
}
.re-table__pagination-total {
  margin-right: 8px;
  color: var(--el-text-color-secondary);
}
:deep(.el-popper.is-dark),
:deep(.el-tooltip__popper) {
  z-index: 9999 !important;
}
:deep(.el-table__fixed-right) {
  z-index: 30 !important;
}
:deep(.el-table__fixed-right::before) {
  z-index: 31 !important;
}
.el-table__body td.el-table-fixed-column--right {
  background-color: var(--el-table-bg-color, #fff);
}
.el-table__body tr:hover td.el-table-fixed-column--right,
.el-table__body tr.hover-row td.el-table-fixed-column--right {
  background-color: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-table-bg-color, #fff)) !important;
}
.re-table__pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex: none;
  order: 0;
  border-right: none;
  position: relative;
  z-index: 1;
  padding: 12px 0;
  font-size: 13px;
}
.page-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin: 0 2px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 10px;
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-secondary, #909399);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.page-nav-btn:hover:not(:disabled) {
  border-color: var(--el-color-primary-light-3, #a0cfff);
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}
.page-nav-btn:active:not(:disabled) {
  transform: scale(0.92);
}
.page-nav-btn--active {
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}
.page-nav-btn--active:hover {
  background: var(--el-color-primary, #409eff);
  color: #fff;
}
.page-nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.re-page-btn {
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-bg-color);
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.re-page-btn:hover:not(:disabled):not(.re-page-btn--active) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.re-page-btn--active {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #fff;
}
.re-page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
/* 统一分页行控件大小：「前往」输入框与每页条数下拉框同高，避免视觉大小不一致 */
.re-table__pagination .el-pagination__jump .el-input {
  --el-input-height: 32px;
}
.re-table--compact .re-table__pagination .el-pagination__jump .el-input {
  --el-input-height: 24px;
}
.re-table__pagination .el-select__wrapper {
  min-height: 32px;
}
.re-table--compact .re-table__pagination .el-select__wrapper {
  min-height: 24px;
}
/* 空数据时 body 保持最小高度，避免表格塌陷 */
.re-table--empty .el-table__empty-block {
  min-height: var(--re-table-min-height, var(--rt-empty-height));
}
.re-table--empty .el-table__body-wrapper {
  min-height: var(--re-table-min-height, var(--rt-empty-height));
}
.re-table--empty .el-table__body-wrapper .el-scrollbar {
  height: 100%;
}
.re-table--empty .el-table__body-wrapper .el-scrollbar__wrap {
  height: 100% !important;
  min-height: var(--re-table-min-height, var(--rt-empty-height));
}
/* 空态文本居中修复：
   el-table 默认 .el-table__empty-text 宽 50% 且 empty-block sticky 定位，
   有固定列/横向滚动时文本按内容总宽居中，在可视窗口内偏移；窄容器下 50% 宽也不居中。
   这里改为文本自适应宽度，并强制水平垂直居中于可视区域。 */
.re-table .el-table__empty-block {
  display: flex;
  align-items: center;
  justify-content: center;
}
.re-table .el-table__empty-text {
  width: auto;
  min-width: 50%;
  line-height: inherit;
  padding: 0 16px;
}
.re-table__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--el-text-color-secondary);
  width: 100%;
}
.re-table__empty .re-table__empty-icon {
  width: 80px;
  height: 52px;
  margin-bottom: 8px;
  opacity: 0.5;
}
.re-table__empty p {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
.re-table__icon {
  display: inline-block;
  font-size: var(--rt-font-md);
  line-height: 1;
  margin-right: var(--rt-gap-xs);
  vertical-align: middle;
}
.re-table__columns-panel {
  max-height: 360px;
  overflow-y: auto;
}
.re-table__columns-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--rt-gap-xs) var(--rt-gap-sm);
  font-weight: var(--rt-header-font-weight);
  color: var(--rt-text);
}
.re-table__columns-search {
  padding: 0 var(--rt-gap-xs) var(--rt-gap-sm);
}
.re-table__columns-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.re-table__columns-item {
  display: flex;
  align-items: center;
  gap: var(--rt-gap-xs);
  padding: var(--rt-gap-xs) 6px;
  border-radius: var(--rt-radius-sm);
  cursor: grab;
  user-select: none;
}
.re-table__columns-item:hover {
  background: var(--rt-bg-row-hover);
}
.re-table__columns-item:active {
  cursor: grabbing;
}
.re-table__drag-handle {
  color: var(--rt-text-placeholder);
  font-size: var(--rt-font-sm);
  cursor: grab;
}
.re-table__columns-actions {
  margin-left: auto;
  display: inline-flex;
  gap: 2px;
}
.re-table__columns-hint {
  margin-top: var(--rt-gap-sm);
  font-size: var(--rt-font-sm);
  color: var(--rt-text-secondary);
}
.re-table__settings-panel {
  min-width: 260px;
  padding: 0;
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
}
.settings-header {
  padding: 14px 16px 10px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.settings-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.settings-group {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
}
.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  transition: background 0.2s;
  cursor: pointer;
}
.settings-item:hover {
  background: var(--el-fill-color);
}
.settings-item__label {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.settings-item__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
.settings-item__desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.re-table__toolbar-top {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: var(--rt-gap);
  gap: var(--rt-gap-sm);
}
.re-table__toolbar-batch {
  display: flex;
  align-items: center;
  gap: var(--rt-gap-sm);
}
.re-table__sel-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-left: var(--rt-gap-xs);
  font-size: var(--rt-font-xs);
  font-weight: 600;
  color: var(--rt-text-white);
  background: var(--el-color-primary);
  border-radius: var(--rt-radius-sm);
  line-height: 1;
}
</style>