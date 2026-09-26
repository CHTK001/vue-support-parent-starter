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
 *   - 自动刷新（传 autoRefresh 才出现）：工具栏一个纯图标入口，浮层里用 ReSelect 方块档选间隔（含「关」= 不刷新），定时器随组件卸载 / keep-alive 失活停止
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
import { computed, defineAsyncComponent, inject, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, useSlots, watch, nextTick } from "vue";
import { ElTable, ElTableColumn, ElPagination, ElButton, ElPopover, ElInput, ElCheckbox, ElCheckboxGroup, ElTooltip, ElIcon, ElSelect, ElOption } from "element-plus";
import { Refresh, Setting, Menu, Delete, Edit, Check, Select, Search, ArrowUp, ArrowDown, View, Grid } from "@element-plus/icons-vue";
import { http, useDataSource, type ReDataSource } from "@repo/core";
import ReTableCardView from "./ReTableCardView.vue";
// 视图模式：默认模板已就绪，随主包加载，切换时零延迟（与卡片模式同一套选择/右键/空态能力）
import ReTableView from "./ReTableView.vue";
import ReTableToolbar from "./ReTableToolbar.vue";
import ReTableContextMenu from "./ReTableContextMenu.vue";
import ReButton from "../ReButton/ReButton.vue";
import ReSelect from "../ReSelect/ReSelect.vue";
import ReSearch from "../ReSearch/index";
import type { ReOption } from "../ReSelect/types";

import ReSwitch from "../ReSwitch/ReSwitch.vue";
import RePagination from "../RePagination/RePagination.vue";
import "./shared/table-vars.css";
import Sortable from "sortablejs";
import { VxeTable, VxeColumn } from "vxe-table";
import "vxe-table/lib/style.css";
import type {
  ReCardLayoutProps,
  ReViewLayoutProps,
  EditOptionValue,
  RePageResult,
  ReTableColumn,
  ReTableColumnState,
  ReTableFullState,
  ReTableLayout,
  ReTableSwitchLayout,
  ReTableLoader,
  ReTableSettings,
  ReTableToolbarConfig,
  ReTableSearchConfig,
  ReTableAutoRefresh,
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
    /** 斑马纹外观默认值；无默认值以便区分「未传」与「传 false」，被 settings / 表格设置覆盖 */
    stripe?: boolean;
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
    /** 布局模式：默认表格 / 视图 / 卡片（栅格）/ 现代化扁平 */
    layout?: ReTableLayout;
    /**
     * 是否显示布局切换器（表格 / 视图 / 卡片）。
     *
     * <p>默认 true；传 false 关闭。切换器属于系统级工具，渲染在工具栏右侧
     * （与刷新、列设置、表格设置同组）。只在"有东西可切"时出现：候选布局 ≥ 2，
     * 否则不渲染——空表格上不该出现切了也没区别的按钮。</p>
     */
    layoutSwitch?: boolean;
    /** 布局切换器候选布局（默认 table + view + card，页面可裁剪） */
    layouts?: ReTableSwitchLayout[];
    /** 布局切换器文案覆盖（键：table / view / card） */
    layoutLabels?: Partial<Record<ReTableSwitchLayout, string>>;
    /** 卡片模式专属属性（layout-card-*） */
    layoutCard?: ReCardLayoutProps;
    /** 视图模式专属属性（layout-view-*） */
    layoutView?: ReViewLayoutProps;
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
    /** 拖拽排序字段名，默认sort */
    sortField?: string;
    /** 是否启用内置「批量删除」工具按钮（点击进入选择模式，与拖拽排序互斥） */
    batchDelete?: boolean;
    /** 批量删除实际执行函数；确认时调用，成功才退出选择模式，失败保留勾选 */
    batchDeleteHandler?: (rows: Record<string, unknown>[]) => Promise<void> | void;
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
    /** 内置自动刷新：工具栏纯图标入口 + 浮层选间隔，轮询定时器由表格持有（不传则无该能力） */
    autoRefresh?: ReTableAutoRefresh;
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
    pageSize: 50,
    pageSizes: () => [20, 50, 100],
    autoReload: true,
    tableId: "",
    storage: undefined,
    toolbar: true,
    toolbarConfig: () => ({}),
    contextMenu: () => [],
    columnsTriggerText: "列设置",
    settingsTriggerText: "表格设置",
    layout: "table",
    layoutSwitch: true,
    layouts: () => ["table", "view", "card"],
    layoutLabels: () => ({}),
    layoutCard: () => ({}),
    layoutView: () => ({}),
    layoutTable: () => ({}),
    treeProps: undefined,
    rowDraggable: false,
    sortField: "sort",
    batchDelete: false,
    batchDeleteHandler: undefined,
    resizable: true,
    defaultExpandAll: false,
    showSearch: false,
    searchVisible: undefined,
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

/** 默认每页条数（props.pageSize 未传时的兜底，与 props 默认值保持一致） */
const DEFAULT_PAGE_SIZE = 50;

/**
 * 判断每页条数是否在允许档位内。
 *
 * <p>用于恢复 localStorage 持久化状态时校验：默认档位调整后，历史存档里
 * 可能存着已不在 pageSizes 中的旧值（如 10），照搬会让分页器显示的档位
 * 与实际每页条数不一致。</p>
 *
 * @param size 待校验的每页条数
 * @returns 在允许档位内返回 true
 */
function isAllowedPageSize(size: number): boolean {
  const sizes = Array.isArray(props.pageSizes) ? props.pageSizes : [];
  return sizes.length === 0 || sizes.includes(size);
}

/**
 * 分页器上「每页条数」下拉的档位。
 *
 * <p>props.pageSizes 未传时用组件默认档（20/50/100）；做了去重与过滤，
 * 避免调用方给出重复值或非正数时下拉里出现两个一样的项或 0 条/页。</p>
 */
const pageSizeOptions = computed<number[]>(() => {
  const raw = Array.isArray(props.pageSizes) ? props.pageSizes : [];
  const seen = new Set<number>();
  for (const size of raw) {
    const value = Number(size);
    if (Number.isFinite(value) && value > 0) {
      seen.add(Math.floor(value));
    }
  }
  return [...seen];
});

/** 内部分页状态（与 props 同步，确保 reload 时读到最新值） */
const internalPage = ref(props.page ?? 1);
const internalPageSize = ref(props.pageSize ?? DEFAULT_PAGE_SIZE);
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

/** 批量删除模式是否激活（与拖拽模式互斥） */
const batchDeleteMode = ref(false);

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

/** 退出拖拽模式（互斥复用）：执行与 toggleDragMode 退出分支相同的清理 */
function exitDragMode(): void {
  if (!dragMode.value) return;
  dragMode.value = false;
  stopVxeTbodyObserver();
  vxeSortableInstance.value?.destroy();
  vxeSortableInstance.value = null;
  destroySortable();
  vxeDragData.value = [];
  dragChanged.value = false;
}

/** 切换批量删除模式（与拖拽排序互斥） */
function toggleBatchDeleteMode(): void {
  if (batchProcessing.value) return;
  if (batchDeleteMode.value) {
    cancelBatchDelete();
    return;
  }
  // 互斥：进入批量删除前先退出拖拽
  exitDragMode();
  batchDeleteMode.value = true;
}

/** 取消批量删除：清空勾选并退出模式 */
function cancelBatchDelete(): void {
  batchDeleteMode.value = false;
  clearAllSelection();
}

/** 确认批量删除：有 handler 则 await（失败保留勾选），否则 emit 事件 */
async function confirmBatchDelete(): Promise<void> {
  const rows = allSelectedRows.value;
  if (!rows.length) return;
  batchProcessing.value = true;
  try {
    if (typeof props.batchDeleteHandler === "function") {
      await props.batchDeleteHandler(rows);
    } else {
      emit("batch-delete", rows);
    }
    batchDeleteMode.value = false;
    clearAllSelection();
    await reload();
  } catch {
    // 删除失败：保留模式与勾选，错误提示由 handler / 父组件负责
  } finally {
    batchProcessing.value = false;
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

/** ========== Sortable 行拖拽排序 ========== */
const dragMode = ref(false);
const dragChanged = ref(false);
const sortableInstance = ref<ReturnType<typeof Sortable.create> | null>(null);
const sortedRows = ref<Array<Record<string, unknown>>>([]);
const originalRows = ref<Array<Record<string, unknown>>>([]);
const dragToggleLoading = ref(false);
const sortableInitLock = ref(false);
const vxeTableRef = ref<InstanceType<typeof VxeTable> | null>(null);
const vxeDragData = ref<Array<Record<string, unknown>>>([]);

const vxeSortableInstance = ref<ReturnType<typeof Sortable.create> | null>(null);
let vxeTbodyObserver: MutationObserver | null = null;
const vxeRenderKey = ref(0);

/** 查找VXE主tbody（排除fixed区域） */
function findVxeMainTbody(): HTMLElement | null {
  const mainWrapper = document.querySelector(
    ".vxe-table--body-wrapper.body--wrapper"
  ) as HTMLElement | null;
  if (!mainWrapper) return null;
  const tbody = mainWrapper.querySelector("tbody") as HTMLElement | null;
  if (!tbody || tbody.children.length === 0) return null;
  const rect = tbody.getBoundingClientRect();
  if (rect.width === 0) return null;
  return tbody;
}

/** 初始化VXE表格Sortable拖拽 */
function initVxeSortable(): boolean {
  const vxeTbody = findVxeMainTbody();
  if (!vxeTbody) {
    return false;
  }
  // 已绑定在同一个tbody上则跳过，避免重复创建导致document事件残留冲突
  const inst = vxeSortableInstance.value as unknown as { el?: HTMLElement } | null;
  if (inst && inst.el === vxeTbody) return true;
  vxeSortableInstance.value?.destroy();
  vxeSortableInstance.value = null;
  vxeSortableInstance.value = Sortable.create(vxeTbody, {
    handle: ".vxe-drag-handle",
    draggable: "tr",
    animation: 180,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    ghostClass: "vxe-drag-ghost",
    chosenClass: "vxe-drag-chosen",
    fallbackClass: "drag-sort-fallback",
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 3,
    scroll: true,
    onChoose: () => {
      document.body.style.userSelect = "none";
    },
    onUnchoose: () => {
      document.body.style.userSelect = "";
    },
    onEnd: (evt) => {
      document.body.style.userSelect = "";
      const { oldIndex, newIndex, item } = evt;
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;
      // Sortable(forceFallback) 移动后的真实 DOM 即目标顺序，无需手动还原；
      // 纯数据驱动：先按目标顺序重排，再交换这两行原有的排序字段值（仅两条记录变更）
      const oldList = vxeDragData.value;
      const movedRow = oldList[oldIndex];
      const targetRow = oldList[newIndex];
      const movedSort = movedRow[props.sortField];
      const targetSort = targetRow[props.sortField];
      const list = [...oldList];
      const [moved] = list.splice(oldIndex, 1);
      list.splice(newIndex, 0, moved);
      // 交换发生在 list 内同一批行对象上，保证 VXE 渲染读取到的就是交换后的值
      movedRow[props.sortField] = targetSort;
      targetRow[props.sortField] = movedSort;
      vxeDragData.value = list;
      sortedRows.value = list;
      dragChanged.value = true;
      // 拖拽过程中 Sortable 移动过真实 tr，会破坏 VXE 内部 tr-行映射；
      // 更新数据后递增 key，让 VXE 销毁并按新数据全新渲染，保证顺序与字段正确
      vxeRenderKey.value++;
    },
  });

  // VXE 重挂载后重新绑定 Sortable
  watch(vxeRenderKey, async () => {
    if (!dragMode.value) return;
    for (let i = 0; i < 10; i++) {
      await nextTick();
      await waitFrame();
      if (initVxeSortable()) break;
    }
    // 重挂载后 VXE $el 是全新节点，重新监听并确保 Sortable 绑定
    startVxeTbodyObserver();
  });
  return true;
}

/** 启动 VXE tbody 监听：表格重渲染替换 tbody 后自动重绑 Sortable */
function startVxeTbodyObserver() {
  stopVxeTbodyObserver();
  const rootEl = (vxeTableRef.value as unknown as { $el?: HTMLElement } | null)?.$el
    || (document.querySelector(".vxe-table") as HTMLElement | null);
  if (!rootEl || typeof MutationObserver === "undefined") return;
  let scheduled = false;
  vxeTbodyObserver = new MutationObserver(() => {
    if (scheduled || !dragMode.value) return;
    scheduled = true;
    nextTick(() => {
      scheduled = false;
      if (dragMode.value) initVxeSortable();
    });
  });
  vxeTbodyObserver.observe(rootEl, { childList: true, subtree: true });
}

function stopVxeTbodyObserver() {
  if (vxeTbodyObserver) {
    vxeTbodyObserver.disconnect();
    vxeTbodyObserver = null;
  }
}

/** VXE内置拖拽结束回调 */
function onVxeDragEnd() {
  const list = [...vxeDragData.value];
  list.forEach((row, idx) => {
    row[props.sortField] = idx + 1;
  });
  vxeDragData.value = list;
  sortedRows.value = list;
  // 仅当顺序与原始数据不同时才显示确认按钮
  const changed = list.some((row, idx) => {
    const orig = originalRows.value[idx];
    return !orig || row[props.rowKey as string] !== orig[props.rowKey as string];
  });
  dragChanged.value = changed;
}

function waitFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function findDragTbody(): HTMLElement | null {
  const tableEl = elTableRef.value?.$el as HTMLElement | undefined;
  if (!tableEl) return null;
  const tbodies = Array.from(tableEl.querySelectorAll("tbody"));
  // 仅找可见、有数据行的tbody，不要求手柄已渲染（Sortable事件委托自动处理后续插入的手柄）
  const target = tbodies.find((tb) => {
    const rect = tb.getBoundingClientRect();
    return rect.width > 0 && tb.children.length > 0;
  });
  return target ?? null;
}

async function toggleDragMode() {
  if (dragToggleLoading.value) return;
  dragToggleLoading.value = true;
  const willEnable = !dragMode.value;
  dragChanged.value = false;
  try {
    if (willEnable) {
      // 互斥：进入拖拽前先退出批量删除
      if (batchDeleteMode.value) cancelBatchDelete();
      // 先从ElTable取数据，再切换模式，避免ElTable销毁后拿不到数据
      const tableRows: Array<Record<string, unknown>> = elTableRef.value?.store?.states?.data?.value || [];
      const snapshot = tableRows.map((r) => ({ ...r }));
      sortedRows.value = snapshot;
      originalRows.value = snapshot.map((r) => ({ ...r }));
      vxeDragData.value = snapshot;
      vxeRenderKey.value = 0;
      await nextTick();
      dragMode.value = true;
      // 等待VXE表格渲染完成，多轮重试初始化Sortable
      for (let i = 0; i < 10; i++) {
        await nextTick();
        await waitFrame();
        if (initVxeSortable()) break;
      }
      // 延迟做一次最终重绑，规避VXE列宽计算后重渲染替换tbody
      window.setTimeout(() => {
        if (dragMode.value) initVxeSortable();
      }, 350);
      // 监听 tbody 替换，自动重绑
      nextTick(() => startVxeTbodyObserver());
    } else {
      dragMode.value = false;
      stopVxeTbodyObserver();
      vxeSortableInstance.value?.destroy();
      vxeSortableInstance.value = null;
      destroySortable();
      vxeDragData.value = [];
    }
  } finally {
    dragToggleLoading.value = false;
  }
}

async function initSortable(retryCount = 0): Promise<boolean> {
  if (sortableInitLock.value) return false;
  sortableInitLock.value = true;
  try {
  destroySortable();
  await nextTick();
  await waitFrame();

  const tableInstance = elTableRef.value;
  const tbody = findDragTbody();
  if (!tbody || !tableInstance) {
    if (retryCount < 5) {
      await waitFrame();
      return initSortable(retryCount + 1);
    }
    return false;
  }

  const tableRows: Array<Record<string, unknown>> = tableInstance.store?.states?.data?.value || [];
  const snapshot = tableRows.map((r) => ({ ...r }));
  sortedRows.value = snapshot;
  originalRows.value = snapshot.map((r) => ({ ...r }));

  sortableInstance.value = Sortable.create(tbody, {
    handle: ".drag-handle",
    draggable: "tr",
    animation: 160,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    ghostClass: "drag-sort-ghost",
    chosenClass: "drag-sort-chosen",
    dragClass: "drag-sort-drag",
    fallbackClass: "drag-sort-fallback",
    preventOnFilter: false,
    // 核心：强制JS模拟拖拽，GPU硬件加速，彻底解决原生HTML5拖拽卡顿/延迟/不跟手
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 3,
    scroll: true,
    scrollSensitivity: 70,
    scrollSpeed: 12,
    onChoose: () => {
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";
    },
    onUnchoose: () => {
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    },
    onEnd: ({ oldIndex, newIndex }) => {
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;
      const list = [...sortedRows.value];
      const [moved] = list.splice(oldIndex, 1);
      list.splice(newIndex, 0, moved);
      list.forEach((row, idx) => {
        row[props.sortField] = idx + 1;
      });
      sortedRows.value = list;
      dragChanged.value = true;
    },
  });
  return true;
  } finally {
    sortableInitLock.value = false;
  }
}

function destroySortable() {
  sortableInstance.value?.destroy();
  sortableInstance.value = null;
  // 主动清理页面残留的拖拽元素，避免DOM堆积导致卡顿
  document.querySelectorAll('.drag-sort-fallback, .drag-sort-ghost, .drag-sort-chosen, .drag-sort-drag').forEach((el) => el.remove());
  document.body.style.userSelect = "";
  document.body.style.webkitUserSelect = "";
}

watch(
  () => elTableRef.value?.store?.states?.data?.value,
  async () => {
    if (!dragMode.value || dragChanged.value || sortableInitLock.value) return;
    await nextTick();
    await waitFrame();
    // 数据行数变化说明是分页/外部刷新，重新初始化；仅拖拽换位不重绑
    const newRows = elTableRef.value?.store?.states?.data?.value || [];
    if (newRows.length !== originalRows.value.length) {
      await initSortable();
    }
  },
  { flush: "post" },
);

function confirmDragSort() {
  stopVxeTbodyObserver();
  emit("row-sort", {
    row: null,
    fromIndex: -1,
    toIndex: -1,
    newData: vxeDragData.value,
  });
  destroySortable();
  dragMode.value = false;
  dragChanged.value = false;
  originalRows.value = [];
  vxeDragData.value = [];
}

/** 取消拖拽排序，放弃修改恢复原始顺序 */
function cancelDragSort() {
  stopVxeTbodyObserver();
  destroySortable();
  vxeDragData.value = originalRows.value.map((r) => ({ ...r }));
  dragMode.value = false;
  dragChanged.value = false;
  originalRows.value = [];
  // 刷新表格恢复原始顺序
  setTimeout(()=>onBuiltinSearchRefresh(), 50);
}
/** ========== 缺陷6: 列宽调整 ========== */
/** resizable 设置 → 列宽拖拽 */
const borderResizable = computed(() => (localSettings.value.resizable ?? true));

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

/**
 * 取 select 绑定用值：行数据本身是 {@code Record<string, unknown>}，
 * 而 el-select 的 model-value 期望具体类型，这里按 Element Plus 接受的取值范围收窄。
 */
function getSelectValue(row: Record<string, unknown>, col: ReTableColumn): EditOptionValue {
  const v = getEditValue(row, col);
  return v === null || v === undefined
    ? undefined
    : (v as EditOptionValue);
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
const totalToShow = computed<number>(() => {
  if (isRemote.value) return remoteTotal.value;
  if (props.total > 0) return props.total;
  return dataList.value?.length ?? 0;
});

/** 表格外观设置：受控（v-model:settings），并写入 props.settings 响应 */
// props.settings 是局部覆盖语义，重建时必须带上属性推导出的默认值，否则 immediate 回调会把它们冲掉
function resolveSettings(v?: ReTableSettings): ReTableSettings {
  return { border: true, stripe: props.stripe, ...v };
}

const localSettings = ref<ReTableSettings>(resolveSettings(props.settings));
watch(
  () => props.settings,
  (v) => {
    localSettings.value = resolveSettings(v);
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
        // pageSize 需校验档位：默认档位调整后，老用户 localStorage 里存的旧值（如 10）
        // 不在 pageSizes 中，若照搬会渲染出「分页器档位」与「实际每页条数」不一致的界面
        if (typeof full.pageSize === "number" && isAllowedPageSize(full.pageSize)) {
          emit("update:pageSize", full.pageSize);
        }
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
    /** params 是页面显式声明的查询对象（提交快照），优先级高于搜索区的实时草稿值 */
    const paramObj = { ...(props.searchModel ?? {}), ...(props.params ?? {}) };
    const curPage = internalPage.value || props.page || 1;
    const curSize = internalPageSize.value || props.pageSize || DEFAULT_PAGE_SIZE;
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

/** 页码点击：RePagination 只在合法页码时 emit，这里仍做一次越界钳制作为兜底 */
function onPageClick(p: number) {
  const maxPage = Math.max(1, Math.ceil(totalToShow.value / (internalPageSize.value || DEFAULT_PAGE_SIZE)));
  if (p < 1 || p > maxPage || p === internalPage.value) return;
  internalPage.value = p;
  // watch internalPage 会自动 emit update:page 和 dsReload
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

/** ========== 内置自动刷新 ========== */
/** 传 true 用默认档位，传对象可换档位 / 设默认间隔 */
const autoRefreshCfg = computed(() => (typeof props.autoRefresh === "object" ? props.autoRefresh : null));
/** 间隔下限 1s，避免误配把接口打穿；0 是「不刷新」这一档 */
function normalizeInterval(ms?: number): number {
  return Math.max(1000, Math.round(ms ?? 5000));
}
/** 轮询间隔（ms），0 = 关闭；初始档位按 defaultOn 决定 */
const autoRefreshMs = ref<number>(autoRefreshCfg.value?.defaultOn ? normalizeInterval(autoRefreshCfg.value?.interval) : 0);
/** 浮层里的候选档位 */
const autoRefreshSteps = computed<number[]>(() => {
  const list = autoRefreshCfg.value?.intervals;
  return Array.isArray(list) && list.length ? list.map((ms) => (ms > 0 ? normalizeInterval(ms) : 0)) : [0, 5000, 15000, 30000, 60000];
});
/** 选档浮层：工具栏只留一个纯图标入口，档位铺开在浮层里选 */
const autoRefreshPop = ref(false);
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null;

/** 浮层是竖向档位菜单：一行一档，0 档写成「不自动刷新」 */
const autoRefreshOptions = computed<ReOption[]>(() =>
  autoRefreshSteps.value.map((ms) => ({
    value: String(ms),
    label: ms > 0 ? `每 ${ms / 1000} 秒` : "不自动刷新",
  })),
);

/** 选档即起停表，并收起浮层 */
const autoRefreshValue = computed<string>({
  get: () => String(autoRefreshMs.value),
  set: (val: string) => {
    const ms = Number(val);
    autoRefreshMs.value = ms > 0 ? normalizeInterval(ms) : 0;
    autoRefreshPop.value = false;
    startAutoRefresh();
  },
});

function stopAutoRefresh(): void {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

function startAutoRefresh(): void {
  stopAutoRefresh();
  if (autoRefreshMs.value <= 0) return;
  autoRefreshTimer = setInterval(() => {
    // 上一拍还在飞就跳过这一拍，慢接口下不堆请求
    if (!dataLoading.value) void dsReload();
  }, autoRefreshMs.value);
}

onMounted(startAutoRefresh);
onBeforeUnmount(stopAutoRefresh);
/* keep-alive 缓存页离开时钩子不会卸载，必须停表，否则后台页面持续打接口 */
onActivated(startAutoRefresh);
onDeactivated(stopAutoRefresh);
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

/**
 * 调用方是否指定了固定高度（layout-table height / max-height）。
 *
 * <p>固定高度时表格高度由 element-plus 决定：body 区域 = 表格高 − 表头高，
 * 空态必须填满这块可用区域而不是强撑 440px，否则空块会溢出表格底部。
 * 供根节点 re-table--fixed-height 类切换空态样式。</p>
 */
const hasFixedHeight = computed(() => {
  const table = props.layoutTable;
  if (!table) return false;
  return (table.height !== undefined && table.height !== null) || (table.maxHeight !== undefined && table.maxHeight !== null);
});

// ==================== 布局切换（表格 / 视图 / 卡片） ====================

/** 布局偏好 localStorage key 前缀（按 tableId 区分，缺省 default） */
const LAYOUT_STORAGE_PREFIX = "re-table-layout";

/** 读取上次选择的布局 */
function readStoredLayout(): ReTableSwitchLayout | null {
  try {
    const raw = window.localStorage.getItem(`${LAYOUT_STORAGE_PREFIX}:${props.tableId || "default"}`);
    return raw === "table" || raw === "view" || raw === "card" ? raw : null;
  } catch {
    // 隐私模式等场景忽略
    return null;
  }
}

/** 记忆布局选择（同一表格下次进入保持） */
function persistLayout(value: ReTableSwitchLayout): void {
  try {
    window.localStorage.setItem(`${LAYOUT_STORAGE_PREFIX}:${props.tableId || "default"}`, value);
  } catch {
    // 忽略写入失败
  }
}

/**
 * 当前生效布局。
 *
 * <p>layoutSwitch=false 时完全听 props.layout；否则 localStorage 记忆优先于 props.layout，
 * 用户切换只改这里，主体分支统一读 activeLayout。</p>
 */
const activeLayout = ref<ReTableLayout>(props.layoutSwitch === false ? props.layout : (readStoredLayout() ?? props.layout));

/** props.layout 变化时跟随（受控场景） */
watch(
  () => props.layout,
  (val) => {
    activeLayout.value = val;
  },
);

/** 候选布局：props.layouts 白名单 ∩ 当前可渲染（视图/卡片需要有行数据才有 DOM） */
const switchLayoutOptions = computed<ReTableSwitchLayout[]>(() => {
  const allow = (props.layouts ?? ["table", "view", "card"]).filter(Boolean);
  const hasRows = !isEmpty.value;
  return allow.filter((key) => (key === "table" ? true : hasRows));
});

/** 默认文案 / 图标（图标用 element-plus 图标组件，纯图标按钮与刷新等同级） */
const LAYOUT_TEXT: Record<ReTableSwitchLayout, string> = { table: "表格", view: "视图", card: "卡片" };
const LAYOUT_ICON: Record<ReTableSwitchLayout, unknown> = { table: Menu, view: View, card: Grid };
function layoutText(key: ReTableSwitchLayout): string {
  return props.layoutLabels?.[key] ?? LAYOUT_TEXT[key];
}

/** 是否显示布局切换器：开关打开 + 候选 ≥ 2（有可切换的 DOM） */
const showLayoutSwitch = computed<boolean>(() => props.layoutSwitch !== false && switchLayoutOptions.value.length > 1);

/** 当前布局不可用（数据清空 / 白名单变化）时回落到表格；可用则记忆 */
watch(
  [() => activeLayout.value, () => switchLayoutOptions.value.join(",")],
  ([val]) => {
    if (val !== "table" && val !== "view" && val !== "card") return;
    if (!(switchLayoutOptions.value as string[]).includes(val)) {
      // 数据清空后视图/卡片没有可渲染的行，回到表格（表格空态已处理）
      activeLayout.value = "table";
      return;
    }
    if (props.layoutSwitch !== false) persistLayout(val);
  },
);

/** 切换布局 */
function switchLayout(key: ReTableSwitchLayout): void {
  if (key === activeLayout.value) return;
  activeLayout.value = key;
  // 切回表格后需重排列宽（表头与 body 对齐）
  nextTick(() => {
    try {
      elTableRef.value?.doLayout?.();
    } catch {
      // noop
    }
  });
}

/** 视图模式序号跨页连续 */
const layoutIndexOffset = computed<number>(() =>
  props.pagination ? Math.max(0, (internalPage.value - 1) * internalPageSize.value) : 0,
);

/** 数据加载/翻页后重新布局，确保表头与表体列宽始终对齐（异步数据、横向滚动、窗口缩放场景） */
watch(dataList, () => {
  nextTick(() => {
    try { elTableRef.value?.doLayout?.(); } catch { /* noop */ }
  });
});

/** 表格最小高度（空数据时保持此高度，默认 440px） */
const tableMinHeight = computed<string>(() => {
  const mh = props.layoutTable?.minHeight;
  if (mh === undefined || mh === null) return "440px";
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
    :class="{
      're-table--empty': isEmpty,
      're-table--compact': tableSize === 'small',
      're-table--separated': searchSeparated,
      're-table--fixed-height': hasFixedHeight,
      [`re-table--layout-${activeLayout}`]: true,
    }"
    :style="{ '--re-table-min-height': tableMinHeight }"
  >
    <!-- 内置搜索区（search 开启内置 ReSearch；或 showSearch=true 配合 #search 插槽） -->
    <div
      v-if="searchAreaVisible"
      v-show="!searchEnabled || searchVisible"
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
            :show-search-btn="searchConfig.showSearchBtn ?? true"
            :show-reset-btn="searchConfig.showResetBtn ?? true"
            :show-batch-delete-btn="false"
            :show-batch-select-btn="false"
            @update:model-value="onSearchModelUpdate"
            @update:filter-visible="searchVisible = $event"
            @search="onBuiltinSearch"
            @reset="onBuiltinSearchReset"
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
    <!-- 工具栏行：左侧 #toolbar 自定义按钮；右侧系统工具组（批量/拖拽/搜索/布局切换/自动刷新/刷新） -->
    <div
      v-if="$slots.toolbar || searchEnabled || rowDraggable || batchDelete || autoRefresh || showLayoutSwitch"
      class="re-table__toolbar-row"
    >
      <div v-if="$slots.toolbar" class="re-table__toolbar-left">
        <slot name="toolbar" />
      </div>
      <div
        v-if="searchEnabled || rowDraggable || batchDelete || autoRefresh || showLayoutSwitch"
        class="re-table__toolbar-right"
      >
        <!-- 批量删除模式：右侧工具栏最左侧出现 取消 / 确认删除（与拖拽的取消/确认同位置，二者互斥） -->
        <template v-if="batchDeleteMode">
          <el-button size="small" :disabled="batchProcessing" @click="cancelBatchDelete">取消</el-button>
          <el-button
            size="small"
            type="danger"
            :disabled="!hasSelected"
            :loading="batchProcessing"
            @click="confirmBatchDelete"
          >
            删除<span v-if="selectedCount" class="re-table__sel-badge">{{ selectedCount }}</span>
          </el-button>
        </template>
        <!-- 拖拽模式：取消排序 / 确认排序 -->
        <el-button
          v-if="dragMode && dragChanged"
          type="primary"
          text
          size="small"
          @click="cancelDragSort"
        >取消排序</el-button>
        <el-button
          v-if="dragMode && dragChanged"
          type="primary"
          text
          size="small"
          @click="confirmDragSort"
        >确认排序</el-button>
        <ReButton
          v-if="batchDelete"
          layout="square"
          icon="Delete"
          :title="batchDeleteMode ? '退出批量删除' : '批量删除'"
          :type="batchDeleteMode ? 'primary' : ''"
          @click="toggleBatchDeleteMode"
        />
        <ReButton
          v-if="rowDraggable"
          layout="square"
          icon="Rank"
          :title="dragMode ? '退出拖拽' : '拖拽排序'"
          :type="dragMode ? 'primary' : ''"
          @click="toggleDragMode"
        />
        <ReButton
          v-if="searchEnabled && (searchConfig.showToggle ?? true)"
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
        <!-- 自动刷新：工具栏只留一个纯图标入口，间隔在浮层里选（含「关」= 不刷新） -->
        <ElPopover
          v-if="autoRefresh"
          v-model:visible="autoRefreshPop"
          placement="bottom-end"
          :width="196"
          trigger="click"
          :persistent="false"
          popper-class="re-table__popover"
        >
          <template #reference>
            <ReButton
              layout="square"
              icon="Timer"
              :title="autoRefreshMs > 0 ? `自动刷新中：每 ${Math.round(autoRefreshMs / 1000)} 秒` : '自动刷新：已关闭'"
              :type="autoRefreshMs > 0 ? 'primary' : ''"
            />
          </template>
          <div class="re-table__auto-refresh-panel">
            <div class="re-table__auto-refresh-head">
              <span class="re-table__auto-refresh-title">自动刷新</span>
              <span
                class="re-table__auto-refresh-state"
                :class="{ 'is-off': autoRefreshMs <= 0 }"
              >{{ autoRefreshMs > 0 ? `每 ${Math.round(autoRefreshMs / 1000)} 秒` : "已关闭" }}</span>
            </div>
            <ReSelect v-model="autoRefreshValue" layout="square" vertical :data="autoRefreshOptions" />
            <div class="re-table__auto-refresh-hint">选中即生效，表格按该间隔自动重取当前页</div>
          </div>
        </ElPopover>
        <!-- 布局切换（系统级按钮组，位于自动刷新右侧）：表格 / 视图 / 卡片
             候选 <2 或无数据时不渲染（没有可切换的 DOM 就不出现） -->
        <div
          v-if="showLayoutSwitch"
          class="re-table__layout-switch"
          role="group"
          aria-label="布局切换"
        >
          <button
            v-for="key in switchLayoutOptions"
            :key="key"
            type="button"
            class="re-table__layout-switch-item"
            :class="{ 'is-active': activeLayout === key }"
            :aria-pressed="activeLayout === key"
            :title="`${layoutText(key)}视图`"
            @click="switchLayout(key)"
          >
            <component :is="LAYOUT_ICON[key]" :size="16" />
          </button>
        </div>
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

    <!-- VXE高性能表格：拖拽模式使用，内置原生流畅行拖拽 -->
    <VxeTable
      v-if="dragMode && activeLayout === 'table'"
      :key="'vxe-drag-' + vxeRenderKey"
      ref="vxeTableRef"
      :data="vxeDragData"
      :border="localSettings.border ?? true"
      :stripe="localSettings.stripe ?? false"
      :height="layoutTable?.height"
      :max-height="layoutTable?.maxHeight"
      :row-config="{ keyField: rowKey, isHover: true, height: 48 }"
      :column-config="{ resizable: borderResizable }"
    >
      <VxeColumn
        v-if="showSelection || batchSelectActive"
        type="checkbox"
        width="50"
        fixed="left"
      />
      <VxeColumn width="48" align="center">
        <template #default>
          <ElIcon class="vxe-drag-handle" style="cursor: grab; font-size: 18px; color: var(--el-text-color-secondary); user-select: none">
            <Rank />
          </ElIcon>
        </template>
      </VxeColumn>

      <VxeColumn
        v-for="col in visibleColumns"
        :key="col.prop || col.label"
          :field="col.prop"
          :title="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :max-width="col.maxWidth"
        :fixed="col.fixed === true ? 'left' : col.fixed || ''"
        :align="col.align"
        :sortable="Boolean(col.sortable)"
      >
        <template v-if="hasColSlot(col)" #default="{ row }">
          <slot
            :name="resolveColSlotName(col)"
            :row="row"
            :value="row[col.prop]"
            :editing="batchEditing"
          />
        </template>
        <template v-else #default="{ row }">
          {{ formatCell(row, col) }}
        </template>
      </VxeColumn>
      <template #empty>
        <el-empty description="暂无数据" />
      </template>
    </VxeTable>

    <!-- 默认ElTable：非拖拽模式 -->
    <ElTable
      v-if="!dragMode && activeLayout === 'table'"
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
      <!-- 批量选择 checkbox 列（批量选择 / 批量删除模式 / 常驻选择） -->
      <ElTableColumn
        v-if="showSelection || batchSelectActive || batchDeleteMode || isBatchEnabled(toolbarConfig.batchSelect)"
        type="selection"
        width="50"
        fixed="left"
      />
      <!-- 拖拽排序列 -->
      <ElTableColumn
        v-if="dragMode"
        width="55"
        fixed="left"
        align="center"
      >
        <template #header>
          <ElIcon><Rank /></ElIcon>
        </template>
        <template #default>
          <ElIcon
            class="drag-handle"
            style="cursor: grab; font-size: 18px; color: var(--el-text-color-secondary); user-select: none"
          ><Rank /></ElIcon>
        </template>
      </ElTableColumn>
      <template v-for="col in visibleColumns" :key="col.prop || col.label">
        <ElTableColumn
          v-if="hasColSlot(col)"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :max-width="col.maxWidth"
          :fixed="col.fixed"
          :align="col.align"
          :sortable="col.sortable"
          :resizable="col.resizable ?? borderResizable"
          :show-overflow-tooltip="col.showOverflowTooltip"
        >
          <template #default="scope">
            <!-- el-table 会用 {row:{}, $index:-1} 空跑一次默认插槽做列发现，此时不挂载单元格控件，避免脏值回写 -->
            <slot
              v-if="Number(scope.$index) > -1"
              :name="resolveColSlotName(col)"
              :row="scope.row"
              :value="scope.row[col.prop]"
              :editing="batchEditing"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn
          v-else
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :max-width="col.maxWidth"
          :fixed="col.fixed"
          :align="col.align"
          :sortable="col.sortable"
          :resizable="col.resizable ?? borderResizable"
          :show-overflow-tooltip="col.showOverflowTooltip"
        >
          <template #default="{ row, $index }">
            <!-- el-table 会用 {row:{}, $index:-1} 空跑一次默认插槽做列发现，此时不挂载单元格控件 -->
            <template v-if="Number($index) > -1">
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
                  :model-value="getEditValue(row, col) as string | number"
                  size="small"
                  @change="(v: unknown) => setEditValue(row, col, v)"
                >
                  <el-option
                    v-for="opt in (col.editOptions ?? [])"
                    :key="String(opt.value)"
                    :label="opt.label"
                    :value="opt.value as string | number"
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
                <span :class="{ 're-table__cell-ellipsis': col.showOverflowTooltip }"
                  :title="String(row[col.prop] ?? '')">
                  {{ formatCell(row, col) }}
                </span>
              </template>
            </template>
          </template>
        </ElTableColumn>
      </template>
      <template #empty>
        <el-empty :description="emptyText" :image-size="96" />
      </template>
      <slot />
    </ElTable>

    <!-- 视图模式（一行一块；默认模板可被 #view 插槽整体替换） -->
    <ReTableView
      v-else-if="activeLayout === 'view'"
      :rows="dataList ?? []"
      :columns="visibleColumns"
      :layout="layoutView ?? {}"
      :row-key="rowKey"
      :selectable="batchSelectActive || isBatchEnabled(toolbarConfig.batchSelect)"
      :context-menu="contextMenu"
      :empty-text="emptyText"
      :index-offset="layoutIndexOffset"
      @row-click="(row: Record<string, unknown>) => emit('row-click', row)"
      @selection-change="onSelectionChange"
      @context-menu="(ctx: ReTableContextMenuContext) => { ctxMenuX = ctx.event.clientX; ctxMenuY = ctx.event.clientY; ctxMenuContext = ctx; ctxMenuVisible = true; }"
    >
      <template v-if="$slots.view" #view="slotProps">
        <slot name="view" v-bind="slotProps" />
      </template>
    </ReTableView>

    <!-- 卡片模式（栅格） -->
    <ReTableCardView
      v-else-if="activeLayout === 'card'"
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
    >
      <template v-if="$slots.card" #card="slotProps">
        <slot name="card" v-bind="slotProps" />
      </template>
    </ReTableCardView>

    <div v-if="pagination || toolbar" class="re-table__footer">
      <div class="re-table__toolbar" v-if="toolbar || pagination">
        <!--
          左侧分页：复用设计体系的 RePagination（layout=modern 即胶囊分页），
          不再在本组件内重写「总数 / 每页条数 / 省略号页码 / 上下页」——那套逻辑
          （页码数组、越界钳制、切换页长回第 1 页）与 RePagination 的 modern 布局逐行等价，
          重复实现会导致两处样式/边界行为漂移。
          size 变更走 onSizeChange 而不是直接 v-model：它顺带 emit 回父级、把页码收回第 1 页、
          并在远程模式下重新取数，直接 v-model 会漏掉这些副作用。
        -->
        <div v-if="pagination" class="re-table__pagination">
          <RePagination
            layout="modern"
            :total="totalToShow"
            :current-page="internalPage"
            :page-size="internalPageSize"
            :page-sizes="pageSizeOptions"
            :small="tableSize === 'small'"
            @current-change="onPageClick"
            @size-change="onSizeChange"
          />
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
/* 纯展示列的省略号：show-overflow-tooltip 未透传给 el-table-column，长值需自带单行截断 */
.re-table__cell-ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
.re-table__search {
  margin-bottom: 12px;
}
/* ============ 默认表格视觉增强 ============
   只作用于 .re-table 内的 el-table，全部走 element-plus / koi 令牌，亮暗自适应：
     · 外框圆角 + 细描边 + 柔和投影，把表格从"裸网格"变成一块面板
     · 表头渐变底 + 600 字重 + 横向滚动时的投影，避免头行与内容糊在一起
     · 行高 44px（紧凑模式 36px）、斑马纹更淡、hover 混主色
     · hover / 选中行首列左侧主色条，弱化但可定位
   ⚠ 分页条同步这套语言（见文件末尾分页样式），否则表格与分页会像两个组件。 */
.re-table .el-table {
  --el-table-border-color: var(--el-border-color-lighter);
  --el-table-header-bg-color: var(--el-fill-color-lighter);
  --el-table-header-text-color: var(--el-text-color-primary);
  --el-table-row-hover-bg-color: color-mix(in srgb, var(--el-color-primary) 7%, var(--el-bg-color));
  font-size: 13.5px;
  border-radius: calc(var(--rt-radius) + 2px);

}
/* 表头：渐变底 + 600 字重 + 底部描边
   ⚠ 两个外部约束（都是"应用层全局样式晚于组件样式加载"的既有现实）：
     1) 行高由内容决定（ReTag / 按钮等），不用 height 硬压；
     2) 部分应用层样式用 `.el-table th.el-table__cell { padding: 12px !important }`
        全局锁死表头内边距，这里用 !important 提权，保证组件内表头样式可控。 */
.re-table .el-table__header-wrapper th.el-table__cell {
  padding-top: 9px !important;
  padding-bottom: 9px !important;
  background: linear-gradient(180deg, var(--el-fill-color-lighter), var(--el-fill-color-extra-light));
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 13px;
  /* 应用层常给表头加 uppercase / 大字距（对中文表头是视觉噪声），组件内归一 */
  text-transform: none;
  letter-spacing: 0.2px;
  border-bottom: 1px solid var(--el-border-color);
}
.re-table--compact .el-table__header-wrapper th.el-table__cell {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}
/* 横向滚动时表头投影，提示"右边还有列" */
.re-table .el-table__header-wrapper.is-scrolling-middle,
.re-table .el-table__header-wrapper.is-scrolling-left,
.re-table .el-table__header-wrapper.is-scrolling-right {
  box-shadow: 0 8px 14px -12px rgb(0 0 0 / 45%);
}
/* 表体：内边距 + 更淡的分割线（行高由内容决定，不硬压 height）
   !important 原因同表头：应用层 pages.css 用 `.el-table td.el-table__cell
   { padding: 10px 12px !important }` 全局锁死。 */
.re-table .el-table__body td.el-table__cell {
  padding-top: 10px !important;
  padding-bottom: 10px !important;
  border-bottom-color: var(--el-border-color-lighter);
  transition: background-color var(--rt-duration, 200ms) var(--rt-ease, ease);
}
.re-table--compact .el-table__body td.el-table__cell {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}
/* 斑马纹（开启时更淡，不喧宾夺主） */
.re-table .el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
  background: var(--el-fill-color-extra-light);
}
/* hover / 选中行首列主色条 */
.re-table .el-table__body tr.el-table__row:hover > td.el-table__cell:first-child,
.re-table .el-table__body tr.current-row > td.el-table__cell:first-child,
.re-table .el-table__body tr.el-table__row--striped.current-row > td.el-table__cell:first-child {
  box-shadow: inset 2px 0 0 var(--el-color-primary);
}
.re-table .el-table__body tr.current-row > td.el-table__cell {
  background: color-mix(in srgb, var(--el-color-primary) 9%, var(--el-bg-color));
}
/* 单元格内容：横向内边距与行高节奏（element-plus 默认 line-height:23px 会把
   44px 行高顶到 49/56，这里统一为 20px，配合 10px 上下内边距 ≈ 41px） */
.re-table .el-table__cell .cell {
  padding: 0 12px;
  line-height: 20px;
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
/* 工具栏行：左侧业务按钮（#toolbar 插槽）；右侧系统工具组 */
.re-table__toolbar-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.re-table__toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-right: auto;
}
.re-table__toolbar-right {
  display: flex;
  align-items: center;
  gap: 2px;
}
/* 布局切换：系统级「按钮组」（joined group），位于自动刷新右侧。
   单个按钮与相邻的刷新 / 自动刷新 / 列设置同规格
   （rs-btn：30×30、圆角 10px、白底 1px 边框、16px 图标），
   三个布局按钮合并成一组：共享边框、中间项去掉左边框、两端保留圆角，
   既与系统工具一致，又在视觉上表达"这几个是一组互斥选项"。 */
.re-table__layout-switch {
  display: inline-flex;
  align-items: center;
  margin-left: 2px;
}
.re-table__layout-switch-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--el-border-color);
  border-radius: 0;
  /* 按钮组：相邻项边框重叠 1px，视觉上只有一条分隔线 */
  margin-left: -1px;
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition:
    background-color var(--rt-duration, 200ms) var(--rt-ease, ease),
    border-color var(--rt-duration, 200ms) var(--rt-ease, ease),
    color var(--rt-duration, 200ms) var(--rt-ease, ease);
}
.re-table__layout-switch-item:first-child {
  margin-left: 0;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}
.re-table__layout-switch-item:last-child {
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
}
.re-table--compact .re-table__layout-switch-item {
  width: 26px;
  height: 26px;
}
.re-table--compact .re-table__layout-switch-item:first-child {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}
.re-table--compact .re-table__layout-switch-item:last-child {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}
/* element-plus 图标 svg 是 1em + 内联 width/height，需提权才能压到 16px */
.re-table__layout-switch-item svg,
.re-table__layout-switch-item .el-icon svg,
.re-table--compact .re-table__layout-switch-item svg {
  width: 16px !important;
  height: 16px !important;
}
.re-table__layout-switch-item:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9, var(--el-bg-color));
  z-index: 1;
}
/* 选中态：主色实心 + 白图标（与 rs-btn--primary 一致） */
.re-table__layout-switch-item.is-active,
.re-table__layout-switch-item.is-active:hover {
  color: #fff;
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  z-index: 2;
}
/* 自动刷新浮层：状态行 + 竖向档位菜单 + 一行说明 */
.re-table__auto-refresh-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.re-table__auto-refresh-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}
.re-table__auto-refresh-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}
.re-table__auto-refresh-state {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--el-color-primary, #409eff);
}
.re-table__auto-refresh-state.is-off {
  color: var(--el-text-color-secondary, #909399);
}
.re-table__auto-refresh-hint {
  padding-top: 6px;
  border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary, #909399);
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
  margin-left: calc(var(--rt-padding, 12px) * 1);
  margin-right: calc(var(--rt-padding, 12px) * 1);
  margin-bottom: calc(var(--rt-padding, 12px) * 1);
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
/* ============ 分页条（与表格同一套视觉语言） ============
   旧样式问题：总数在左、页码在右但都是 30px 方块 + 4px 小圆角，
   和 12px 圆角 + 44px 行高 + 柔和投影的新表格明显不搭。
   现在：左侧「共 N 条」次要文字，右侧 32px 胶囊页码（选中为主色实心），
   尺寸跟随 default/compact（34/30），全部走令牌，暗色自动适配。 */
.re-table__pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex: none;
  order: 0;
  position: relative;
  z-index: 1;
  padding: 12px 0;
  font-size: 13px;
}
/*
 * 分页本体样式全部来自 RePagination（layout=modern），此处只做两件事：
 *  1) 把它的 --rm-* 令牌映射到 Element/koi 令牌 —— RePagination 默认的 --rm-primary
 *     是硬编码靛蓝 #6366f1，不跟主题走；不映射会让分页配色脱离当前主题；
 *  2) 尺寸/圆角/字重对齐本组件既有的胶囊分页视觉（32 高、9px 圆角、选中 600 字重）。
 */
.re-table__pagination {
  --rm-primary: var(--el-color-primary);
  --rm-primary-hover: var(--el-color-primary-light-3);
  --rm-text: var(--el-text-color-primary);
  --rm-text-regular: var(--el-text-color-regular);
  --rm-text-secondary: var(--el-text-color-secondary);
  --rm-text-disabled: var(--el-text-color-placeholder);
  --rm-border: var(--el-border-color-lighter);
  --rm-border-light: var(--el-border-color-extra-light, var(--el-border-color-lighter));
  --rm-bg: var(--el-bg-color);
  --rm-bg-hover: var(--el-fill-color-light);
  --rm-bg-overlay: var(--el-bg-color-overlay, var(--el-bg-color));
  --rm-radius: 9px;
  --rm-font-md: 13px;
  --rm-font-sm: 12px;
}
/*
 * 权重说明：RePagination 的 Modern 布局是 <style scoped>，选择器编译为
 * `.rm-pager__btn[data-v-xxx]`，权重 (0,2,0)；本文件是**非 scoped** 的 <style>。
 * 若只写 `.re-table__pagination .rm-pager__btn--active`，双方同为 (0,2,0)，
 * 而 Modern 是 defineAsyncComponent 动态注入的，样式后于本表插入 → 后者胜，
 * 覆盖会被静默吃掉（实测 font-weight 覆盖不生效）。因此统一加 `.re-table`
 * 祖选择器提到 (0,3,0)，不依赖样式注入顺序。
 */
.re-table .re-table__pagination .rm-pager {
  margin-right: auto;
}
.re-table .re-table__pagination .rm-pager__btn--active {
  font-weight: 600;
}
.re-table--compact .re-table__pagination .rm-pager__btn {
  min-width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 12px;
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
/* 空数据：撑满最小高度并居中。
   ⚠ 权重陷阱：koi 主题 element.scss 里有同为一处 `.el-table .el-table__empty-block`
   { position: absolute; top/left: 50%; transform: translate(-50%,-50%) }，
   与本组件旧的 `.re-table .el-table__empty-block { position: static }` 权重完全相同
   （都是 0,2,0），胜负只取决于样式表加载顺序。一旦主题样式晚于组件样式加载
   （另一应用、懒加载主题 chunk），空块脱离文档流，整条链会塌成：
     .el-table__body-wrapper 高度正常 → 其下 .el-scrollbar 只剩 20px
     → table.el-table__body 高度 0 → 空块整体飘到 body-wrapper 之外
     → .el-empty 只有一小截落在 body-wrapper 内。
   因此空块相关规则统一挂 `.re-table .el-table__body-wrapper .el-xxx`（0,3,0），
   无论加载顺序都压得住主题规则。 */
.re-table--empty .el-table__body-wrapper {
  min-height: var(--re-table-min-height, var(--rt-empty-height));
}
.re-table--empty .el-table__body-wrapper .el-scrollbar {
  height: 100%;
}
.re-table--empty .el-table__body-wrapper .el-scrollbar__wrap {
  height: 100% !important;
}
/* 视口兜底高度：element-plus 给空块写的是内联 height:100%，需要父级有确定高度，
   否则视口与空块一起塌成一条线 */
.re-table--empty .el-table__body-wrapper .el-scrollbar__view {
  min-height: var(--re-table-min-height, var(--rt-empty-height));
}
.re-table .el-table__body-wrapper .el-table__empty-block {
  position: static;
  top: auto;
  left: auto;
  right: auto;
  bottom: auto;
  transform: none;
  width: 100%;
  min-height: var(--re-table-min-height, var(--rt-empty-height));
  display: flex;
  align-items: center;
  justify-content: center;
}
/* 调用方给了固定高度（layout-table height/max-height）：表格高已确定，
   空态填满 body 剩余区域即可，取消 440px 强撑，避免空块溢出表格底部 */
.re-table--empty.re-table--fixed-height .el-table__body-wrapper,
.re-table--empty.re-table--fixed-height .el-table__body-wrapper .el-scrollbar__view,
.re-table--empty.re-table--fixed-height .el-table__body-wrapper .el-table__empty-block {
  min-height: 0;
}
.re-table .el-table__body-wrapper .el-table__empty-text {
  width: 100%;
  min-width: 0;
  line-height: inherit;
  padding: 0 16px;
}
.re-table .el-table__body-wrapper .el-empty {
  padding: 28px 0 36px;
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
.drag-sort-fallback {
  position: fixed !important;
  z-index: 3000 !important;
  pointer-events: none !important;
  margin: 0 !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
  background: var(--el-bg-color, #fff) !important;
  will-change: transform;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  cursor: grabbing !important;
}
.drag-sort-fallback td {
  background: var(--el-bg-color, #fff) !important;
}
.drag-sort-ghost {
  opacity: 0.4;
  background: var(--el-color-primary-light-9) !important;
}
/* 拖拽模式下全局禁止表格文字选中 */
.re-table:has(.drag-handle) .el-table__body,
.re-table:has(.drag-handle) .el-table__body td .cell {
  user-select: none !important;
  -webkit-user-select: none !important;
}
.drag-handle:active {
  cursor: grabbing;
}
</style>
