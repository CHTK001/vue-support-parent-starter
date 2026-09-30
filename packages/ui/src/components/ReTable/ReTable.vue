<script setup lang="ts">
/**
 * ReTable —— 表格组件
 *
 * 两种数据源（只用这两个，url 形态已移除）：
 *   1) 静态数组：:data="[...]" —— 前端分页，组件按 page / pageSize 切片，total 取数组长度
 *   2) 远程加载：:loader="fetchUsers"（等价 :data="fetchUsers"）—— 后端分页，
 *      组件只发 page / pageSize + :params，条数与 total 由接口给
 *
 * params：两种模式都支持，自定义键值随便加，但 page / pageSize 必定由组件注入且以组件为准
 *   （页面自己往 params 里塞 page/pageSize 无效，见 internalParamsKey 的说明）。
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
 *   - 自动刷新（传 autoRefresh 才出现）：ReSwitch(popover) 布局，工具栏一枚纯 ReButton(square) 入口，
 *     点开是无边框浮层，用 ReSelect 竖向档位菜单选间隔（含「不自动刷新」一档 = 关闭），
 *     档位即状态（选中即生效并收起浮层），定时器随组件卸载 / keep-alive 失活停止
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
// TableColumnCtx 是 element-plus 对 el-table 列对象的正式导出类型。
// 模板上 @row-contextmenu / @cell-contextmenu / @cell-click 的形参必须与它一致，
// 否则 vue-tsc 报 TS2322（此前这里写的是 any）。
import { ElTable, ElTableColumn, ElPagination, ElButton, ElPopover, ElInput, ElCheckbox, ElCheckboxGroup, ElTooltip, ElIcon, ElSelect, ElOption, type TableColumnCtx } from "element-plus";
import { Refresh, Setting, Menu, Delete, Edit, Check, Select, Search, ArrowUp, ArrowDown, View, Grid, Rank } from "@element-plus/icons-vue";
import { useDataSource, type ReDataSource } from "@repo/core";
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
import { useRoute } from "vue-router";
/**
 * vxe 的两个组件用具名导入。
 *
 * <p><b>这里踩过一个坑，务必别改回默认导入。</b>vxe-table@4.22.2 的
 * {@code es/index.esm.js} 是
 * {@code import * as VxeUITableExport from './components'; export default VxeUITableExport;}
 * —— 默认导出是<b>整个模块的命名空间对象</b>，不是表格组件。
 * 写 {@code import VxeTable from "vxe-table"} 运行时拿到 {@code [object Module]}，
 * Vue 报 "Component is missing template or render function"，表格直接渲染不出来。
 * 4.6.25 的默认导出才是组件本体，升到 4.22.2 后这条路就断了。</p>
 *
 * <p>{@code VxeColumn} 同理必须具名导入：vxe 虽提供 {@code install(app)} 会把组件
 * 注册成全局，但<b>全仓没有任何地方调用 {@code app.use(vxe-table)}</b>，
 * 依赖全局注册会在运行时报 "Failed to resolve component: VxeColumn"。</p>
 *
 * <p>类型层同样是具名导出可用的：{@code types/all.d.ts} 里有
 * {@code export * from 'vxe-pc-ui/types/components/table'}，而那个文件里
 * {@code export declare const VxeTable: DefineVxeComponentApp<...>} 明明白白。
 * （此前误判为"具名导入会报 TS2724"，真实原因是当时 {@code vxe-pc-ui} 根本没装，
 * 类型链断在根上；补装 vxe-pc-ui@4.18.19 后该误判自动消失。）</p>
 *
 * <p>实例方法不靠 {@code InstanceType} 推断，改为下方 {@link TableInstanceHandle}
 * 的结构声明，避免 vue-tsc 推不出运行期挂上去的方法（TS2339/TS2344）。</p>
 */
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
  ReTableLoadParams,
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
    /**
     * 行数据。两种形态，自动分派：
     * - 数组 → **前端分页**（组件按 page / pageSize 切片，total 取数组长度）
     * - 函数 → **后端分页**（签名见 ReTableLoader，收到 page / pageSize / params，
     *   需返回 { total, data|records|rows|... }）
     *
     * <p>与 {@link loader} 二选一；两者都传时以本项（函数形态）优先。</p>
     */
    data?: Array<Record<string, unknown>> | ReTableLoader;
    /**
     * 远程加载器（后端分页），签名见 types.ts 的 {@link ReTableLoader}。
     *
     * <p>与 {@link data} 传函数等价，写哪个都行；{@link data} 传数组时本项不参与。</p>
     */
    loader?: ReTableLoader;
    /**
     * 查询参数。**两种数据源都支持**。
     *
     * <p>自定义键值随意加（如 `{ status: 1, keyword: 'x' }`），会与内置搜索区的提交值合并
     * 后交给 {@link loader}（后者收到 `params.page` / `params.pageSize`）。</p>
     *
     * <p><b>page / pageSize 必定存在且以组件为准</b>：组件在合并之后写回这两个键，
     * 页面自己塞进 params 的同名字段会被覆盖 —— 分页真值只能来自组件的内部状态，
     * 否则翻页会出现「页码变了但查询没变」或反之。</p>
     *
     * <p>数组形态下没有加载器可消费它，此时本项只影响「params 变化是否回到第 1 页」这一行为
     * （见 internalParamsKey），不影响切片结果 —— 数组就是唯一数据源。</p>
     */
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
     * <p><b>默认 false</b>（2026-09-29 调整）：视图 / 卡片布局要页面自己提供
     * {@code #view} / {@code #card} 插槽才有合适的呈现，否则切过去是组件的兜底样式，
     * 信息密度与视觉都比表格差很多，看着像坏了。确实写了插槽的页面传
     * {@code :layout-switch="true"} 打开。</p>
     */
    layoutSwitch?: boolean;
    /**
     * 布局选择是否跨会话持久化（写 localStorage）。
     *
     * <p>默认 true，保持既有行为：用户在切换器里选过的布局会被记住，
     * 下次进入时 localStorage 优先于 {@code layout}，尊重用户偏好。</p>
     *
     * <p>传 false 时 {@code layout} 永远优先——适合「业务上本来就该以某种布局呈现」
     * 的页面（例如古诗库要求视图模式优先显示），避免被历史选择覆盖；
     * 本次会话内仍可自由切换，只是不再记住。</p>
     */
    layoutPersist?: boolean;
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
      /**
       * 「吃满父容器 + 表头固定、body 内滚」的自适应模式。
       *
       * <p><b>缺省（不传）= 完全关闭</b>，表格保持原来的「撑开 + 页面滚动」，
       * 既有页面行为一个字都不变。不能默认自动：全仓多数页面的父容器（ReCard body、
       * flex 布局块）都有确定高度，一开自动就集体变成固定表头，属于大面积行为变更
       * （实测会连带把空态的 440px 撑开顶掉，retable-empty 的用例就是这么塌的）。</p>
       *
       * <p>可选值：</p>
       * <ul>
       *   <li>{@code true} —— 强制开启，跳过父容器高度判定。适用于父容器高度由 JS / 内联
       *     决定、computed 会解析成 auto 的场景。</li>
       *   <li>{@code "auto"} —— 自动判定：父容器高度落在可用区间（见 FILL_MIN_HEIGHT 注释）
       *     才开启，否则退回撑开。</li>
       * </ul>
       */
      fill?: boolean | "auto";
    };
    /** 树形数据配置（透传 el-table tree-props） */
    treeProps?: ReTableTreeProps;
    /**
     * 表格渲染引擎。
     *
     * <p>{@code "element"}（默认）= element-plus 的 el-table；{@code "vxe"} = vxe-table。
     * 两者对外能力（列、插槽、事件、批量操作、行拖拽）完全一致，切换只换渲染引擎，
     * 业务页面不需要改代码。</p>
     *
     * <p>默认必须是 element：vxe-table 的 DOM 结构与 el-table 不同，页面里
     * {@code :deep(.el-table …)} 这类内部覆盖、以及依赖 el-table 内部结构的脚本
     * （读 {@code store.states.data}）都只在 element 引擎下成立。vxe 作为可选引擎，
     * 用于需要固定表头 / 大数据量虚拟滚动的场景。</p>
     */
    engine?: "element" | "vxe";
    /**
     * 调试模式：在工具栏暴露开发 / 验收用的辅助控件。
     *
     * <p>与 {@code ReGraph} / {@code ReGraph3D} 的 {@code debug} 同一口径（默认 false），
     * 不是业务功能开关，不进产品界面。目前它显示的是「引擎切换器」
     * （Element / VXE 分段控件），用来对照两套引擎的渲染差异。</p>
     *
     * <p>切换引擎会换掉整棵表格 DOM（列宽、行高、边框都按各自实现走），
     * 属调试 / 选型向能力。切换通过 {@code update:engine} 抛出，
     * 页面用 {@code v-model:engine} 接住；不接也能切，只是无法持久化。</p>
     */
    debug?: boolean;
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
    loader: undefined,
    params: () => ({}),
    columns: () => [],
    loading: false,
    settings: () => ({}),
    rowKey: "id",
  engine: "element",
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
    layoutSwitch: false,
    debug: false,
    layoutPersist: true,
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
  (e: "update:engine", engine: "element" | "vxe"): void;
  (e: "toggle-search"): void;
  (e: "update:searchModel", value: Record<string, unknown>): void;
  (e: "search"): void;
  (e: "search-reset"): void;
  (e: "refresh"): void;
}>();

/**
 * 当前路由 path（无路由环境为 null）。
 *
 * <p>用 {@code useRoute} 但不假设一定有 router：ReTable 也可能被用在无路由的独立页 /
 * 组件预览里，vue-router 未注册时 useRoute 返回 undefined，这里统一兜成 null。
 * 放在靠前位置是因为下面的 batchSelectionKey 就要用。</p>
 */
const routePath = (() => {
  try {
    const r = useRoute() as { path?: string } | undefined;
    return typeof r?.path === "string" ? r.path : null;
  } catch {
    return null;
  }
})();

/**
 * 实际生效的 tableId：显式 prop 优先，缺省回落到当前路由 path。
 *
 * <p>这是「同一张表 = 同一个 tableId」的约定：页面不必为每个表格手写 table-id，
 * 地址栏路径天然唯一。列配置 / 分页 / 表格设置 / 布局都按它持久化。
 * 同一路由要放多张表时（各自独立的列与分页），仍需显式传 tableId 区分，
 * 否则它们会共用一份状态。</p>
 */
const activeTableId = computed<string>(() => props.tableId || routePath || "");

/** ========== 批量选择状态（sessionStorage 记住跨页选择） ========== */
/** 选中行缓存：使用 sessionStorage 持久化跨页选择 */
const batchSelectionKey = computed(() => (props.tableId || routePath ? `re-table-sel:${activeTableId.value}` : ""));

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
 * 每页条数硬上限。
 *
 * <p>为什么需要：pageSize 同时决定「远程请求拉多少条」和「本地切片渲染多少行 DOM」。
 * el-table 没有虚拟滚动，渲染行数 = 喂进来的行数，一旦有人传 {@code pageSize: 1000}
 * 就是 1000 行真实 DOM（cell 里的组件还会各自出 vnode），直接卡死。</p>
 *
 * <p>取值 200 的依据：常见业务表格一屏最多几十行；200 行 DOM 已经偏重，
 * 但仍在可接受区间；超过这个量级的场景正确做法是**服务端分页 + 收窄查询条件**，
 * 而不是把整页塞进 DOM。</p>
 *
 * <p>超出时钳制到上限并在 dev 下警告 —— 不静默吞掉：调用方多半是配置写错了，
 * 静默改掉只会让「我明明传了 1000」的困惑留在原地。</p>
 */
const MAX_PAGE_SIZE = 200;

/**
 * 把任意输入钳制成合法的每页条数。
 *
 * @param size 原始值（可能来自 props、分页器、goto、或 localStorage 恢复）
 * @param source 出处，仅用于警告文案定位问题来源
 * @returns [1, MAX_PAGE_SIZE] 区间内的整数
 */
function clampPageSize(size: unknown, source: string): number {
  const n = Math.floor(Number(size));
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PAGE_SIZE;
  if (n <= MAX_PAGE_SIZE) return n;
  if (import.meta.env.DEV) {
    console.warn(
      `[ReTable] ${source} 的每页条数 ${n} 超过上限 ${MAX_PAGE_SIZE}，已钳制为 ${MAX_PAGE_SIZE}。` +
        `大数据量请用服务端分页收窄查询，不要把整页塞进 DOM。`,
    );
  }
  return MAX_PAGE_SIZE;
}

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
 * 避免调用方给出重复值或非正数时下拉里出现两个一样的项或 0 条/页。
 * 超过 {@link MAX_PAGE_SIZE} 的档位直接剔除 —— 下拉里摆一个必然被钳制的选项，
 * 用户选了却没生效，是比不提供更糟的体验。</p>
 */
const pageSizeOptions = computed<number[]>(() => {
  const raw = Array.isArray(props.pageSizes) ? props.pageSizes : [];
  const seen = new Set<number>();
  for (const size of raw) {
    const value = Math.floor(Number(size));
    if (Number.isFinite(value) && value > 0 && value <= MAX_PAGE_SIZE) {
      seen.add(value);
    }
  }
  return [...seen];
});

/** 内部分页状态（与 props 同步，确保 reload 时读到最新值） */
const internalPage = ref(props.page ?? 1);
const internalPageSize = ref(clampPageSize(props.pageSize ?? DEFAULT_PAGE_SIZE, "props.page-size"));
// 强制响应式：用 shallowRef 或 triggerRef
import { triggerRef } from "vue";
watch(() => props.page, (v) => { if (typeof v === "number") internalPage.value = v; });
watch(
  () => props.pageSize,
  (v) => {
    if (typeof v === "number") internalPageSize.value = clampPageSize(v, "props.page-size");
  },
);

/**
 * 本次生效的每页条数（读取统一入口，已钳制）。
 *
 * <p>原本「internalPageSize → props.pageSize → DEFAULT」这串兜底在
 * {@link pagedRows} 和 {@link buildRemoteSource} 里各写了一遍。两处都漏了上限：
 * 兜底分支会直接把未经钳制的 {@code props.pageSize} 交给远程请求和本地切片 ——
 * 也就是「上限看起来在，内部状态也确实被钳了，但真正决定渲染行数/请求条数的那次读取
 * 绕过了它」，属于看起来有防护其实没有。</p>
 *
 * <p>收敛成这一个 computed 后：钳制只有一处、两个读取点不可能再分叉。
 * 正常路径下 {@code internalPageSize} 已被钳过，这里直接原样返回不会重复告警；
 * 只有兜底分支真的取到超限值时才会再警告一次，那正是需要看到的信号。</p>
 */
const currentPageSize = computed<number>(() =>
  clampPageSize(
    internalPageSize.value || props.pageSize || DEFAULT_PAGE_SIZE,
    "生效值",
  ),
);

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
  // 两套引擎的清空勾选入口不同：element 是 clearSelection()，vxe 是 clearCheckboxRow()
  if (useVxe.value) {
    vxeTableRef.value?.clearCheckboxRow();
  } else {
    elTableRef.value?.clearSelection();
  }
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
/**
 * 重新加载远程数据，但**避开与 watch(internalParamsKey) 的重复**。
 *
 * <p>为什么需要这个：搜索按钮的流程是「emit('search') → 页面同步改 params →
 * 组件重新加载」。页面改完 params 会让 {@code watch(internalParamsKey)} 自己
 * 排一次 dsReload，如果这里再排一次，<strong>一次搜索就打两遍接口</strong>。
 * 早先这里是直接同步 reload()，于是变成「先用旧条件打一遍（props 还没更新），
 * 再由 watch 用新条件打一遍」—— 既重复又有一遍是脏数据。</p>
 *
 * <p>为什么不能干脆删掉这里的 reload：watch 有两道闸门
 * （{@code isRemote} 与 {@code props.autoReload}），而
 * {@code UserManage.vue} 就是 {@code :auto-reload="false"} + 内置搜索 ——
 * 对它来说 watch 永不触发，这里是搜索唯一的驱动。</p>
 *
 * <p>所以判据是「watch 这次会不会自己加载」，会就交给它，不会才补一次。
 * 比较的是 {@code internalParamsKey} 而不是 params 本身：key 与 watch 同源，
 * 才能和 watch 的触发条件对齐。</p>
 */
function reloadUnlessWatchWill(): void {
  const keyBefore = internalParamsKey.value;
  nextTick(() => {
    const watchWillReload = isRemote.value && props.autoReload && internalParamsKey.value !== keyBefore;
    if (!watchWillReload) {
      void reload();
    }
  });
}

function onBuiltinSearch(): void {
  emit("search");
  reloadUnlessWatchWill();
}
function onBuiltinSearchReset(): void {
  // 重置同样只 emit，靠页面改 params 触发 watch 重新加载。
  // 这里刻意不补 reload：params 没变时那一次是白发。
  emit("search-reset");
}
function onBuiltinSearchRefresh(): void {
  emit("refresh");
  reloadUnlessWatchWill();
}
const ctxMenuX = ref(0);
const ctxMenuY = ref(0);
const ctxMenuContext = ref<ReTableContextMenuContext | undefined>(undefined);

/**
 * 行右键事件（el-table）
 *
 * <p>形参类型对齐 element-plus 的事件声明：{@code onRow-contextmenu} 传的是
 * {@code (row, column: TableColumnCtx<T> | null, event: PointerEvent)}。
 * 写成 {@code any} 会被 TS2322 拒（形参与声明不兼容），故直接用库导出的
 * {@link TableColumnCtx}；事件类型用 PointerEvent —— 它是 MouseEvent 的子类，
 * 形参声明为更宽的 PointerEvent 才能接住库传进来的值。</p>
 */
function onRowContextMenu(
  row: Record<string, unknown>,
  _column: TableColumnCtx<Record<string, unknown>> | null,
  event: PointerEvent,
): void {
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

/**
 * 单元格右键事件
 *
 * <p>element-plus 的 {@code onCell-contextmenu} 传四个参数
 * {@code (row, column, cell, event)}，本函数只用到前三个里的 row/column，
 * 形参按声明写全（cell 不用但不能省，省了位置就错位）。类型理由同
 * {@link onRowContextMenu}。</p>
 */
function onCellContextMenu(
  row: Record<string, unknown>,
  column: TableColumnCtx<Record<string, unknown>>,
  _cell: HTMLTableCellElement,
  event: PointerEvent,
): void {
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
/**
 * vxe-table 的 cell-click / cell-menu 事件载荷（按结构声明）。
 *
 * <p>不能用库的 {@code CellClickEventParams}：它不在 "vxe-table" 根的导出面上
 * （见 import 处注释）。本函数只读取 row / column 的四个字段，故只声明这些。</p>
 *
 * <p>注意 {@code $event} 用 {@code Event} 而不是 {@code MouseEvent}：库声明的
 * {@code CellClick<D>} / {@code CellMenu<D>} 把载荷类型定在 {@code VxeEvent} 上，
 * 形参若窄于它（写 MouseEvent），在 TS 的函数参数逆变检查下不兼容，模板绑定处报 TS2322。
 * 用更宽的 {@code Event} 才能接住 —— 函数体内只用 {@code clientX/clientY}，
 * 那两个字段 Event 上也有（DOM 规范）。</p>
 */
interface VxeCellEvent {
  row: Record<string, unknown>;
  rowIndex: number;
  /**
   * 列对象。
   *
   * <p>{@code title} 必须放宽成 {@code string | number}：vxe 自己的
   * {@code Title} 类型允许 number，而本接口早先写死 string，模板绑定处
   * TS2322 报「Title 不能赋给 string」。同理 field/label 也放宽到
   * {@code unknown} 之外的实际用到的类型即可 —— 函数体内对它们都做了
   * {@code String()} 之外的直接读取，故保持 string | number。</p>
   */
  column?: {
    field?: string;
    property?: string;
    title?: string | number;
    label?: string;
  };
  $event: Event;
}

/**
 * 两个表格实例的 ref 都**按结构声明**，不用 {@code InstanceType<typeof VxeTable>} /
 * {@code InstanceType<typeof ElTable>}：
 *
 * <ul>
 *   <li>vue-tsc 对 SFC 组件推出的实例类型只含 {@code $props / $slots}，
 *       拿不到运行期挂上去的实例方法（{@code clearCheckboxRow} / {@code setCheckboxRow}
 *       / {@code clearSelection} / {@code toggleRowSelection}），调用处报 TS2339；
 *       而 ElTable 那个还额外报 TS2344（不满足 {@code abstract new} 约束）。</li>
 *   <li>方法声明为**必选**而非可选：调用点已用 {@code ref.value?.} 判空，
 *       标成可选反而在「判空后调用」处报 TS2722（可能是 undefined）。</li>
 * </ul>
 */
interface TableInstanceHandle {
  // vxe 引擎
  clearCheckboxRow: () => unknown;
  setCheckboxRow: (row: unknown, checked: boolean) => unknown;
  // element 引擎
  clearSelection: () => unknown;
  toggleRowSelection: (row: unknown, selected?: boolean) => unknown;
  getSelectionRows: () => unknown[];
}
const vxeTableRef = ref<TableInstanceHandle | null>(null);
const vxeDragData = ref<Array<Record<string, unknown>>>([]);
/** element 引擎的表格实例（默认引擎）。只用到它的公开实例方法，不依赖内部结构。 */
const elTableRef = ref<TableInstanceHandle | null>(null);

/** 当前是否走 vxe 引擎 */
const useVxe = computed<boolean>(() => props.engine === "vxe");

/**
 * 让表格按当前容器宽度重新计算列宽。
 *
 * <p>两套引擎方法名不同，这里统一收口：element 走 {@code doLayout()}，
 * vxe 走 {@code recalculate()}。列宽拖拽、窗口缩放、搜索区折叠这类
 * 「容器宽度变了但表格不知道」的场景要调它，否则固定列与合计列宽会错位。</p>
 *
 * <p>用可选调用且吞异常：实例尚未挂载、或某个引擎版本改名，表现为「不再自动重算」
 * 而不是整页渲染中断——这类排版兜底不值得让表格挂掉。</p>
 */
function recalcTable(): void {
  try {
    if (useVxe.value) {
      (vxeTableRef.value as unknown as { recalculate?: (refull?: boolean) => unknown } | null)?.recalculate?.();
    } else {
      (elTableRef.value as unknown as { doLayout?: () => void } | null)?.doLayout?.();
    }
  } catch {
    // noop：实例尚未挂载或已销毁时忽略
  }
}

/**
 * vxe 内置行拖拽结束回调（绑定 {@code @row-dragend}）。
 *
 * <p>vxe 4.8+ 自带行拖拽，开关是 {@code rowConfig.drag}，事件 {@code row-dragend}。
 * <b>关键</b>：vxe 在派发该事件<b>之前</b>已经把自己的 {@code tableFullData} 重排好了
 * —— 源码里对 {@code tableFullData} 做 splice 后调 {@code handleTableData} +
 * {@code updateAfterDataIndex}。所以这里绝不能按载荷里的 oldRow/newRow 再推算一遍顺序，
 * 那样会把行移动两次。统一从实例 {@code getTableData().fullData} 读回权威顺序。</p>
 *
 * <p>原实现的 Sortable + MutationObserver + 递增 key 强制重挂载三件套在此整体删除：
 * Sortable 直接搬 DOM 会破坏 vxe 内部的 tr↔行映射（原注释自承要用销毁重建来绕），
 * 而 tbody 又会被虚拟滚动重渲染掉，还得再叠一层 observer 反复重绑 —— 四层补丁互相打架。</p>
 */
function onVxeRowDragEnd(): void {
  const inst = vxeTableRef.value as unknown as
    | { getTableData?: () => { fullData?: Array<Record<string, unknown>> } }
    | null;
  const full = inst?.getTableData?.()?.fullData;
  // fullData 为空（理论上不该发生）时退回拖拽期快照，不让顺序凭空丢失
  const list = full && full.length > 0 ? full.map((r) => ({ ...r })) : [...vxeDragData.value];
  list.forEach((row, idx) => {
    row[props.sortField] = idx + 1;
  });
  vxeDragData.value = list;
  sortedRows.value = list;
  // 仅当顺序与原始数据不同时才显示确认按钮
  dragChanged.value = list.some((row, idx) => {
    const orig = originalRows.value[idx];
    return !orig || row[props.rowKey as string] !== orig[props.rowKey as string];
  });
}

function waitFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/** 取当前引擎表格的根元素（el-table 与 vxe-table 都把 DOM 挂在实例的 $el 上） */
function currentTableEl(): HTMLElement | null {
  const inst = (useVxe.value ? vxeTableRef.value : elTableRef.value) as unknown as
    | { $el?: HTMLElement }
    | null;
  return inst?.$el ?? null;
}

function findDragTbody(): HTMLElement | null {
  const tableEl = currentTableEl();
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
      // 数据快照直接取组件自己的分页结果：vxe-table 没有 el-table 的
      // store.states.data 内部结构可读，而 pagedRows 就是喂给表格的同一份数据
      const rows: Array<Record<string, unknown>> = pagedRows.value;
      const snapshot = rows.map((r) => ({ ...r }));
      sortedRows.value = snapshot;
      originalRows.value = snapshot.map((r) => ({ ...r }));
      await nextTick();
      dragMode.value = true;
      if (useVxe.value) {
        // vxe 引擎：拖动过程中必须喂快照，否则翻页/外部刷新会覆盖正在拖的顺序。
        // 拖拽能力由 vxe 内置的 rowConfig.drag 提供（见 vxeRowConfig），
        // 无需再手工探测 tbody、绑 Sortable、监听重渲染重绑。
        vxeDragData.value = snapshot;
      } else {
        // element 引擎：Sortable 直接作用在 el-table 的 tbody 上，
        // 拖完从 DOM 回读顺序（见 initSortable 的 onEnd），不做数据快照回填
        for (let i = 0; i < 10; i++) {
          await nextTick();
          await waitFrame();
          if (await initSortable()) break;
        }
      }
    } else {
      dragMode.value = false;
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

  // 只看 tbody 有没有渲染出来，不依赖表格实例的内部数据结构：
  // 快照直接从 pagedRows 取，拖完按 Sortable 给的 oldIndex/newIndex 改 sortedRows。
  const tbody = findDragTbody();
  if (!tbody) {
    if (retryCount < 5) {
      await waitFrame();
      return initSortable(retryCount + 1);
    }
    return false;
  }

  const tableRows: Array<Record<string, unknown>> = pagedRows.value;
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


function confirmDragSort() {
  // element 引擎的顺序由 Sortable 在 onEnd 里从 DOM 回读并放进 sortedRows；
  // vxe 引擎则是内置拖拽结束后从实例读回顺序并写进 vxeDragData。两边各取各自的当前顺序。
  emit("row-sort", {
    row: null,
    fromIndex: -1,
    toIndex: -1,
    newData: useVxe.value ? vxeDragData.value : sortedRows.value,
  });
  destroySortable();
  dragMode.value = false;
  dragChanged.value = false;
  originalRows.value = [];
  vxeDragData.value = [];
}

/** 取消拖拽排序，放弃修改恢复原始顺序 */
function cancelDragSort() {
  destroySortable();
  if (useVxe.value) {
    vxeDragData.value = originalRows.value.map((r) => ({ ...r }));
  }
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

/** ========== 缺陷10: 树形数据 ==========
 *  element 引擎直接用 el-table 的 tree-props；vxe 引擎的翻译见下方 vxeTreeConfig。 */
const effectiveTreeProps = computed(() => props.treeProps ?? undefined);

// ==================== vxe-table 适配层 ====================
/*
 * 以下计算属性与事件适配把 ReTable 原有的语义翻译成 vxe-table 的入参。
 * 集中放在一处而不是散在模板里：vxe 与 element-plus 的属性名/事件载荷差异集中在
 * 这里，改表格引擎时只需动这一段，模板与业务页面不受影响。
 */

/** vxe 引擎的表格数据源：拖拽态用快照（拖动过程中不能被重新分页覆盖），常态用分页结果。
 *  element 引擎不用它——el-table 的拖拽由 Sortable 直改 tbody，再从 DOM 回读顺序。 */
const tableRows = computed<Array<Record<string, unknown>>>(() =>
  dragMode.value ? vxeDragData.value : pagedRows.value,
);

/**
 * vxe-table 的 size 取值是 medium / small / mini，没有 element-plus 的 default。
 *
 * <p>ReTable 对外仍用 default / small（localSettings.compact 决定），这里单向翻译。
 * 认不出的一律按 medium（vxe 默认）走，不要透传原始值——vxe 拿到非法值会静默
 * 落回默认档，行为上没错，但会让「为什么我传了 small 却没生效」变成查不到的原因。</p>
 */
const vxeTableSize = computed<"medium" | "small">(() =>
  tableSize.value === "small" ? "small" : "medium",
);

/** 行配置：主键字段 / hover 高亮 / 当前行高亮，统一在这里给定。
 *
 * <p>⚠ 刻意不设 {@code height}：vxe 的 {@code rowConfig.height} 会在 JS 侧把行高定死
 * （实测设 44px 时行实际渲染 58.94px，且 CSS 与 --vxe-table-row-height-* 都覆盖不动），
 * 与 element 引擎由内容决定的行高（51px）分叉。行高统一交给下方 CSS 的
 * {@code .re-table .vxe-body--row} 控制，两套引擎才对得上。</p>
 */
const vxeRowConfig = computed(() => ({
  keyField: props.rowKey,
  isHover: true,
  isCurrent: localSettings.value.highlightCurrentRow ?? false,
  // 行拖拽排序：vxe 4.8+ 内置能力，开关就是 rowOpts.drag（源码读的是 drag，不是同名的
  // isDrag —— 那是列宽 resize 的变量）。只在拖拽排序模式打开，平时保持关闭，避免误拖。
  drag: dragMode.value ? true : undefined,
}));

/**
 * 勾选配置：reserve 开启跨页保留勾选。
 *
 * <p>跨页勾选由组件自己的 selectedRowsMap + sessionStorage 兜底（见
 * restoreSelection），vxe 的 reserve 负责让已勾选行在翻页回来时保持勾选态。</p>
 */
const vxeCheckboxConfig = computed(() => ({ reserve: true }));

/**
 * 树形配置：把 element-plus 的 tree-props 语义翻译成 vxe 的 tree-config。
 *
 * <p>字段名两边不一样，照抄会静默失效：EP 的 {@code children} 在 vxe 里叫
 * {@code childrenField}、{@code hasChildren} 叫 {@code hasChildField}。
 * vxe 的 TreeConfig 不接受 EP 那两个名字，传了等于没传，树形退化成平铺。</p>
 */
const vxeTreeConfig = computed(() => {
  const tp = props.treeProps;
  if (!tp && !props.defaultExpandAll) return undefined;
  return {
    childrenField: tp?.children || "children",
    hasChildField: tp?.hasChildren || "hasChildren",
    transform: true,
    expandAll: props.defaultExpandAll,
    lazy: tp?.lazy ?? false,
  };
});

/**
 * 列固定方式：element-plus 允许 fixed="left"，vxe 要求 "left" | "right" | true。
 *
 * <p>true 落到左侧，与 element-plus 的行为一致（EP 的 true 等价 left）。</p>
 */
function vxeFixed(col: ReTableColumn): "left" | "right" | "" {
  if (col.fixed === true) return "left";
  if (col.fixed === "left" || col.fixed === "right") return col.fixed;
  return "";
}

/** 单元格溢出：vxe 用 show-overflow='tooltip'，element-plus 用 show-overflow-tooltip */
function vxeShowOverflow(col: ReTableColumn): "tooltip" | false {
  return col.showOverflowTooltip ? "tooltip" : false;
}

/**
 * 单元格点击 → 同时派发 cell-click 与 row-click。
 *
 * <p>vxe-table 没有 row-click 事件（只有 cell-click），而调用方有 3 处依赖
 * 「点任意单元格即选中该行」（@row-click="selectRow" 一类）。这里从 cell-click
 * 合成 row-click，保持与 element-plus 一致的对外行为，调用方无需改动。</p>
 */
function onVxeCellClick(payload: VxeCellEvent): void {
  const row = payload.row;
  // vxe 的 column 用 field/title，element 用 property/label，两边字段名不同，
  // 这里是唯一做字段名翻译的地方，转成 TableColumnCtx 再交给 onCellClick。
  const src = payload.column ?? {};
  const column = {
    property: src.field ?? src.property,
    // title 可能是 number（vxe 的 Title 类型），而 TableColumnCtx.label 是 string，
    // 这里显式 String() 收口，不依赖 as 断言隐式转换
    label: src.title != null ? String(src.title) : src.label,
  } as TableColumnCtx<Record<string, unknown>>;
  const event = payload.$event as PointerEvent;
  const cellValue = column.property ? row?.[column.property] : undefined;
  onCellClick(row, column, cellValue as unknown as HTMLTableCellElement, event);
  emit("row-click", row);
}

/**
 * 单元格右键：vxe 用 cell-menu 承接（载荷里的 $event 就是原生 contextmenu 事件）。
 *
 * <p>element-plus 分成 row-contextmenu 与 cell-contextmenu 两个事件，vxe 只有
 * cell-menu。两者都转成「行 + 列 + 事件」交给原有的 onRowContextMenu /
 * onCellContextMenu，右键菜单的能力与调用方签名保持不变。</p>
 */
function onVxeCellMenu(payload: VxeCellEvent): void {
  const row = payload.row;
  const column = (payload.column ?? {}) as unknown as TableColumnCtx<Record<string, unknown>>;
  const event = payload.$event as PointerEvent;
  const columnProp = column.property || column.prop || "";
  onRowContextMenu(row, column, event);
  // onCellContextMenu 的第三参是 cell（element-plus 会传 HTMLTableCellElement），
  // vxe 的 cell-menu 载荷里没有 DOM 元素；该形参在函数体内未被读取，
  // 这里传单元格的值只为把位置对齐，省掉会让 event 落到 cell 的位置。
  onCellContextMenu(row, column, (row?.[columnProp] ?? null) as unknown as HTMLTableCellElement, event);
}

/** 勾选变化：vxe 的 checkbox-change / checkbox-all 都给出 records，统一转成行数组 */
function onVxeCheckboxChange(payload: { records?: Array<Record<string, unknown>> }): void {
  onSelectionChange(payload.records ?? []);
}

function onVxeCheckboxAll(payload: { records?: Array<Record<string, unknown>> }): void {
  onSelectionChange(payload.records ?? []);
}

/**
 * 排序变化：翻译 vxe 的排序方向取值。
 *
 * <p>vxe 用 'asc' | 'desc'，element-plus 用 'ascending' | 'descending'。对外
 * 契约（含 sort-change 事件载荷与远程排序入参）保持 element-plus 的写法不变，
 * 只在边界做一次转换，调用方与后端接口都不需要跟着改。</p>
 */
function onVxeSortChange(payload: { property?: string; field?: string; order?: string | null }): void {
  const prop = payload.property || payload.field || "";
  const order =
    payload.order === "asc" ? "ascending" : payload.order === "desc" ? "descending" : null;
  onSortChange({ prop, order });
}

/**
 * 单元格点击事件
 *
 * <p>element-plus 的 {@code onCell-click} 传
 * {@code (row, column, cell, event)}；vxe 分支经 {@link onVxeCellClick} 转进来，
 * 两边的 column 类型不同（见各自函数注释），故这里用库导出的
 * {@link TableColumnCtx} 收口。payload 显式标注
 * {@link ReTableCellClickPayload}，否则对象字面量会被推成更宽的类型，
 * emit 处报 TS2322。</p>
 */
function onCellClick(
  row: Record<string, unknown>,
  column: TableColumnCtx<Record<string, unknown>>,
  _cell: HTMLTableCellElement,
  event: PointerEvent,
): void {
  const columnProp = column?.property || column?.prop || "";
  const payload: ReTableCellClickPayload = {
    row,
    rowIndex: (dataList.value ?? []).indexOf(row),
    columnProp,
    columnLabel: column?.label || "",
    cellValue: row[columnProp],
    event,
  };
  emit("cell-click", payload);
}

/** 恢复当前页选中状态（分页切换后调用） */
function restoreSelection(): void {
  if (!batchSelectActive.value) return;
  nextTick(() => {
    const data = dataList.value ?? [];
    for (const row of data) {
      const key = String(row[props.rowKey] ?? "");
      if (!key || !selectedRowsMap.value[key]) continue;
      if (useVxe.value) {
        // vxe 用 setCheckboxRow() 勾选行；toggleCheckboxRow 是「反转」语义、不接受第二参
        vxeTableRef.value?.setCheckboxRow(row, true);
      } else {
        elTableRef.value?.toggleRowSelection(row, true);
      }
    }
  });
}

/**
 * 是否使用远程（后端分页）模式。
 *
 * <p>两个入口：{@link loader}，以及 {@code data} 传函数（与 loader 等价）。
 * {@code data} 传数组 = 前端分页，total 由数组长度决定，不请求后端。</p>
 */
const isRemote = computed<boolean>(
  () => typeof props.loader === "function" || typeof props.data === "function",
);

/** data 传数组 → 本地；传函数 → 远程 */
const localRows = computed<Array<Record<string, unknown>>>(() =>
  Array.isArray(props.data) ? props.data : [],
);

/**
 * 表格实际渲染的行。
 *
 * <p>远程模式：loader 每次只返回当前页，直接给。</p>
 * <p>本地模式：这是需求「data 传数组走前端分页」的落地点 —— 之前
 * {@code ElTable :data="dataList"} 直连全量，pagination 只把总数算对了却从不切片，
 * 传 60 条会一次渲染 60 行、翻页无反应。现按 page / pageSize 切片。
 * pagination 为 false 时不分页，返回全量。</p>
 */
const pagedRows = computed<Array<Record<string, unknown>>>(() => {
  if (isRemote.value || !props.pagination) return dataList.value ?? [];
  const all = dataList.value ?? [];
  const size = currentPageSize.value;
  const maxPage = Math.max(1, Math.ceil(all.length / size));
  const page = Math.min(Math.max(1, internalPage.value || props.page || 1), maxPage);
  const start = (page - 1) * size;
  return all.slice(start, start + size);
});

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
  if (!activeTableId.value) {
    columnState.value = { order: defaultOrderFromColumns(), hidden: [] };
    return;
  }
  const saved = effectiveStorage.value.get(activeTableId.value);
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
          // 还要过一次上限钳制：存档是历史数据，可能存着上限提高前写下的超大值，
          // 只靠上面的档位校验挡不住（pageSizes 为空时 isAllowedPageSize 恒真）
          emit("update:pageSize", clampPageSize(full.pageSize, "localStorage 存档"));
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
    // 布局不在这里恢复：它由 readStoredLayout() 在 activeLayout 初始化时读同一份状态，
    // 两处都恢复会互相覆盖（且 activeLayout 声明更晚，拿不到这里的局部变量）。
    return;
  }
  columnState.value = { order: defaultOrderFromColumns(), hidden: [] };
}

function saveColumnState(): void {
  if (!activeTableId.value) return;
  // 保存列配置 + 分页 + 设置 + 布局（完整状态，统一落一份）
  const fullState: ReTableFullState = {
    ...columnState.value,
    page: props.page,
    pageSize: props.pageSize,
    settings: localSettings.value,
    layout: activeLayout.value,
  };
  effectiveStorage.value.set(activeTableId.value, fullState);
}

/** 监听 tableId / columns 变化时重载列配置 */
watch(
  () => [activeTableId.value, props.columns] as const,
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
  if (activeTableId.value) effectiveStorage.value.remove(activeTableId.value);
  loadColumnState();
}

/**
 * vxe 引擎：列顺序变化后必须让 VxeTable 重新挂载，否则顺序改动不会生效。
 *
 * 原因（已读 vxe 源码确认）：vxe 的槽位式子列（`<VxeColumn v-for>`）在**挂载时按注册
 * 顺序**给每一列写一次 `renderSortNumber`，真正决定渲染顺序的是它 ——
 * `table.js` 里 `XEUtils.orderBy(internalData.collectColumn, 'renderSortNumber')`。
 * 列设置里的「上移 / 下移 / 拖拽」只是把 vnode 换了位置，并不会改这个序号，
 * 于是设置面板的顺序已经变了、表头却纹丝不动。
 * 「取消勾选隐藏列」之所以看起来是好的，是因为组件卸载会把它从收集器里摘掉，
 * 不依赖序号 —— 所以这个 bug 只在**换位置**时暴露。
 *
 * 试过 vxe 的 `refreshColumn(true)`（源码注释写「传 true 会检查列顺序并排序」），
 * 实测**运行时调用不生效**：它内部只是按**旧的** renderSortNumber 再排一次，
 * 而 `parseColumns` 并不会从当前 vnode 顺序重写这个序号。
 * （首次挂载时看起来是对的，那是因为挂载本身就是按新顺序收集的，与 refreshColumn 无关。）
 *
 * 因此这里用 `:key` 触发重新挂载 —— 挂载即按新顺序收集，这是唯一确定有效的手段。
 * 代价：换列顺序会重建一次表格（丢失内部滚动位置/选中态）。列设置是用户主动操作，
 * 这个代价可接受；且 key 只跟**顺序**走，可见性切换不会触发重建（那一路本来就正常）。
 */
const vxeColumnKey = computed<string>(() => columnState.value.order.join("|"));

/** 远程（后端分页）数据加载 */
function buildRemoteSource(): ReDataSource<Array<Record<string, unknown>>> {
  const run = async (): Promise<Array<Record<string, unknown>>> => {
    /** params 是页面显式声明的查询对象（提交快照），优先级高于搜索区的实时草稿值 */
    const paramObj = { ...(props.searchModel ?? {}), ...(props.params ?? {}) };
    const curPage = internalPage.value || props.page || 1;
    const curSize = currentPageSize.value;
    /**
     * page / pageSize 在合并 **之后** 写回：调用方在 params 里塞的同名字段一律作废。
     * 分页真值只能来自组件内部状态 —— 否则会出现「页码跳了但查询条件没跟上」这类
     * 难查的错位（接口按旧条件返回，看起来就是翻页没反应或数据重复）。
     */
    const loadParams: ReTableLoadParams = {
      page: curPage,
      pageSize: curSize,
      params: { ...paramObj, page: curPage, pageSize: curSize },
    };
    let result: RePageResult | undefined;
    try {
      // 两个远程入口等价，data 传函数时优先用它
      const fn = typeof props.data === "function" ? props.data : props.loader;
      if (typeof fn !== "function") throw new Error("未提供 loader（或 data 传函数）");
      result = await fn(loadParams);
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

function extractRecords(result: RePageResult): Array<Record<string, unknown>> {
  for (const key of ["records", "rows", "list", "items", "content", "data"] as const) {
    if (Array.isArray(result[key])) return result[key] as Array<Record<string, unknown>>;
  }
  return [];
}

const sourceRef = computed<ReDataSource<Array<Record<string, unknown>>>>(() => {
  if (isRemote.value) return buildRemoteSource();
  return localRows.value;
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
  const maxPage = Math.max(1, Math.ceil(totalToShow.value / currentPageSize.value));
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
  const size = clampPageSize(s, "分页器切换每页条数");
  internalPageSize.value = size;
  // emit 的也是钳制后的值：否则父级 v-model 拿到 1000、回流进 props 又被 watch 钳一次，
  // 出现「内部是 200、父级以为是 1000」的不一致
  emit("update:pageSize", size);
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
/** 浮层里的候选档位；页面没传 intervals 时的默认档：关 / 5s / 10s / 30s */
const autoRefreshSteps = computed<number[]>(() => {
  const list = autoRefreshCfg.value?.intervals;
  return Array.isArray(list) && list.length ? list.map((ms) => (ms > 0 ? normalizeInterval(ms) : 0)) : [0, 5000, 10000, 30000];
});
/** 轮询定时器句柄；换档 / keep-alive 激活态变化时统一经 startAutoRefresh 起停 */
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null;

/** 浮层是无边框档位菜单：一行一档，0 档写成「不自动刷新」 */
const autoRefreshOptions = computed<ReOption[]>(() =>
  autoRefreshSteps.value.map((ms) => ({
    value: ms,
    label: ms > 0 ? `每 ${ms / 1000} 秒` : "不自动刷新",
  })),
);

/**
 * 触发器的状态文案，同时是 ReSwitch(popover) 的 tooltip 与可访问名。
 *
 * 关闭态写「自动刷新：已关闭」而不是留空，是为了让读屏用户也能知道当前档位；
 * 开启态把间隔一并报出来，光看图标打勾说不出到底是几秒。
 */
const autoRefreshStateText = computed<string>(() =>
  autoRefreshMs.value > 0
    ? `自动刷新中：每 ${Math.round(autoRefreshMs.value / 1000)} 秒`
    : "自动刷新：已关闭",
);

/** 选档即换间隔；起停表交给 watch(autoRefreshMs) 统一处理，浮层收起由 ReSwitch 布局负责 */
const autoRefreshValue = computed<number>({
  get: () => autoRefreshMs.value,
  set: (val: number) => {
    const ms = Number(val);
    autoRefreshMs.value = ms > 0 ? normalizeInterval(ms) : 0;
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

/* 换档即换表：ReSwitch 布局与档位菜单都写同一个 ref，这里统一起停，避免两条入口各起一次定时器 */
watch(autoRefreshMs, startAutoRefresh);

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
    const clamped = clampPageSize(size, "goto()");
    internalPageSize.value = clamped;
    emit("update:pageSize", clamped);
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

// ==================== 吃满父容器（表头固定 + body 内滚） ====================

/**
 * 页面是否用 minHeight「撑开」表格 —— 这类页面走原来的撑开 + 页面滚动，不进自适应。
 *
 * <p>minHeight 与自适应互斥：minHeight 的语义是「至少这么高、内容可以更高」，
 * 而自适应是「正好等于父容器剩余高度、body 内部滚」。两者同时生效会互相打架
 * （表格高会被 minHeight 顶出容器）。</p>
 */
const hasMinHeight = computed(() => {
  const mh = props.layoutTable?.minHeight;
  return mh !== undefined && mh !== null;
});

/** 根节点 / 主体区 DOM 引用：量高度用 */
const rootRef = ref<HTMLElement | null>(null);
const mainRef = ref<HTMLElement | null>(null);

/** 父容器高度是否可用于 fill（单一结论 ref，时序理由见 detectParentHeight） */
const parentHeightUsable = ref(false);

/**
 * 父链没有确定高度时，用「本组件上沿到最近滚动容器下沿」量出的可用高度（px）。
 *
 * <p>背景：fill 的 CSS 是 {@code .re-table--fill { height: 100% }} + 内层
 * {@code flex: 1 1 0}，它要求父链里至少有一环是**确定高度**。但本仓的页面根普遍是
 * 内容尺寸（实测反馈页 {@code .feedback-page} 高 1242、溢出在 470 的
 * {@code .el-main} 里；消息管理页的 {@code .re-tab} 也不参与拉伸），
 * 于是 {@code height: 100%} 解析不出基准，flex 分配不到空间，表格塌成 0 高。
 * 这种页面靠 CSS 绕不过去（百分比高度遇到 auto 父级就是不成立）。</p>
 *
 * <p>所以这里改用 JS 量出真实可用高度，直接给根节点一个像素高度，把「确定基准」
 * 补上。量的是可见区域：搜索区收起后这一步会重测，表格随之长高——这正是调用方
 * 期待的「隐藏 ReSearch 后高度盛满」。</p>
 *
 * <p>为 null 表示走原来的 CSS 百分比路径（父链确定时的正常情况）。</p>
 */
const viewportFillHeight = ref<number | null>(null);

/** 表格可用高度（px）。自适应模式下由 ResizeObserver 量出并传给 el-table / vxe-table */
const fillTableHeight = ref(0);

/**
 * 自适应是否生效。
 *
 * <p>判定顺序：页面是否已自管高度 &gt; 显式 fill 开关。
 * 「已自管高度」指传了 height / maxHeight（fixed）或 minHeight（撑开）——
 * 这两种页面传什么都维持原样。</p>
 *
 * <p><b>缺省开启</b>（2026-09-28 决策）：表格默认吃满父容器剩余高度、表体内部滚动、
 * 表头固定，不再要求每个页面显式写 {@code fill: true}。原先缺省关闭是为了规避一次
 * 空态塌陷（见下），现已由 {@link FILL_MIN_HEIGHT} 与空态样式兜住；让 40+ 个页面
 * 各自记得写一遍开关，是把组件的默认行为推给调用方承担。</p>
 *
 * <p>需要退回「整页滚动」的页面传 {@code fill: false} 显式关闭即可。</p>
 *
 * <p>历史坑（保留记录，避免再次踩）：缺省自动开启后，若父容器是个 520px 的
 * ReCard body，fill 会激活并带上 {@code .re-table--fixed-height}，命中那组
 * {@code min-height: 0} 把空态原本的 440px 撑开顶成 0 高、空块整体不可见。
 * 现在空态在 fill 下不再被压到 min-height:0，而是跟着 body 剩余区域走，
 * 因此该塌陷路径已断开。</p>
 *
 * <p>{@code "auto"} 分支只认 {@link parentHeightUsable} 这一个结论，不在这里现算：
 * 首次求值时 fill 的 CSS 还没落到 DOM，父容器仍是撑开状态，量到的是内容自然高度
 * （几百 px，落在可用区间内）→ 会误判成可用；等 CSS 生效、父容器被压到 80px 就来不及了。
 * 而且它必须是 ref 存结论，才能在 nextTick / rAF 重测后触发本 computed 重算
 * （拆成两个 ref 时第二次检测值没变、Vue 不重算，错误的 true 会被永久固化）。</p>
 */
const fillActive = computed<boolean>(() => {
  if (hasFixedHeight.value || hasMinHeight.value) return false;
  // 显式关闭优先：fill: false 是「我要整页滚动」的唯一声明方式
  if (props.layoutTable?.fill === false) return false;
  // 显式开启：调用方确认父链有确定高度，强制走 fill
  if (props.layoutTable?.fill === true) return true;
  // 缺省与 "auto" 同语义：父容器量得出可用高度才开 fill。
  // ⚠ 不能像早先那样缺省无条件 return true —— fill 的 flex 链是
  //   `.re-table--fill > .re-table__main > .el-table { flex: 1 1 0; min-height: 0 }`，
  //   父链一旦没有确定高度，这个 0 基准 + min-height:0 会把表格压成 0 高：
  //   实测反馈管理页 .re-table 高 322、.re-table__main 高 156，而 .el-table 高 0，
  //   表头和空态全被裁掉、页面看着像没渲染。交给 parentHeightUsable 判定可避免。
  return parentHeightUsable.value;
});

/**
 * fill 三条渲染路径的根节点 —— 必须与下方 `.re-table--fill` 的 flex 目标选择器一致。
 *
 * <p>量谁，就该由同一份选择器指认谁：否则「被量的」和「被 flex 分配高度的」一旦不是同一个
 * 元素，写回给表格的 height 就是另一个元素的高度。</p>
 *
 * <p>两套引擎的根节点类名不同（el-table / vxe-table），两条都列上：同一时刻只会命中
 * 其中一个（另一个引擎根本没渲染），因此不必按引擎切换选择器。</p>
 */
const FILL_TABLE_SELECTOR =
  ":scope > .el-table, :scope > .vxe-table, :scope > .re-table__view-layout, :scope > .re-table__card-layout";

/** 取主体区里承载表格的元素（找不到返回 null） */
function fillTableEl(main: HTMLElement | null): HTMLElement | null {
  if (!main) return null;
  return main.querySelector<HTMLElement>(FILL_TABLE_SELECTOR);
}

/**
 * 量一次可用高度并写回 fillTableHeight。
 *
 * <p>量的是**表格元素本身**（见 {@link FILL_TABLE_SELECTOR}），不是
 * 「主体区高 − 工具栏行高」。后者会算错：工具栏行的 margin-bottom 不在
 * getBoundingClientRect 里、v-if 切换前后量到的值也不同，早先实测就因此把
 * 382px 传给 el-table、被 flex 二次收缩到 292px，EP 内联高度和实际布局打架。
 * fill 模式下表格是 flex 项（flex:1 1 0），高度由容器精确分配，直接量它最准。</p>
 *
 * <p><b>不能用 {@code lastElementChild} 找表格</b>：主体区里表格<b>后面</b>还有
 * {@code .re-table__footer}（{@code v-if="pagination || toolbar"}，而 toolbar 默认 true，
 * 所以它几乎总在）。实测在采集器管理页上 {@code lastElementChild} 取到的就是 footer，
 * {@code fillTableHeight} 一直等于 footer 的 30px，传给 el-table 的 height 也是 30px。
 * 可见效果当时没露馅（盒子由 flex 拉伸、表头由 EP 的 CSS 固定在 body-wrapper 之外），
 * 但写回去的 height 属于另一个元素 —— EP 的 JS 侧布局（滚动条 thumb、scrollTop 夹取、
 * doLayout）都在拿这个错值算，属于「看起来对、实际是错的」，比直接不填更危险。</p>
 *
 * <p>不会自激：表格盒高只由 flex 决定，与内部内容无关，EP 拿到 height 后只改内部
 * 表头/ body 的布局，不改外层盒子高度。变化源（搜索区折叠、窗口缩放、分页条出现/消失）
 * 全部体现为「表格元素盒高变化」，由 RO 直接观察该元素兜住。</p>
 */
function measureFillHeight(): void {
  if (!fillActive.value) {
    // fill 关掉时清零：否则父容器从「假高/假低」恢复成真高度的那一帧，
    // resolvedHeight 会先给出一个属于上一段布局的陈旧值
    if (fillTableHeight.value !== 0) fillTableHeight.value = 0;
    return;
  }
  const slot = fillTableEl(mainRef.value);
  if (!slot) return;
  const next = Math.floor(slot.getBoundingClientRect().height);
  if (next > 0 && next !== fillTableHeight.value) fillTableHeight.value = next;
}

/**
 * fill 可用的最小父容器高度（px）。
 *
 * <p>下限不是拍脑袋：表头约 59px，再留 2 行数据的空间。低于此值说明父容器的 flex 链
 * 本身被压扁了（实测 koi-card__body 在告警页被挤成 80px），此时 fill 会把表格算成
 * 几十 px、连表头都放不下，空块更被压成 0 高而整体不可见 —— 反而比撑开更糟。
 * 这种页面该由它自己的布局去修，ReTable 不该在这里硬吃。</p>
 */
const FILL_MIN_HEIGHT = 120;

/** 重新判定父容器高度（挂载 / 布局切换 / keep-alive 激活后重测） */
function detectParentHeight(): void {
  const p = rootRef.value?.parentElement;
  if (!p) {
    parentHeightUsable.value = false;
    return;
  }
  const raw = getComputedStyle(p).height;
  const h = parseFloat(raw);
  if (raw === "auto" || raw === "" || !Number.isFinite(h) || h <= 0) {
    parentHeightUsable.value = false;
    return;
  }
  const viewport = typeof window === "undefined" ? 0 : window.innerHeight;
  // 假高：被内容撑开（实测可达上万 px），进 fill 等于把内容高度锁死、永远不滚
  if (viewport > 0 && h > viewport * 1.5) {
    parentHeightUsable.value = false;
    return;
  }
  // 假低：flex 链被压扁（实测 koi-card__body 被挤成 80px），进 fill 会把表格压到比表头还矮
  if (h < FILL_MIN_HEIGHT) {
    parentHeightUsable.value = false;
    return;
  }
  if (ancestorHasSpareRoom(p)) {
    // 父链本身有分配余量：走原来的 CSS 百分比路径即可，不需要像素补偿
    parentHeightUsable.value = true;
    viewportFillHeight.value = null;
    return;
  }
  // 父链是内容尺寸（页面根没撑满滚动容器）——CSS 百分比高度解析不出基准，
  // 改用实测的「到滚动容器下沿」距离补上确定高度，让表格能吃满可见区域。
  const measured = measureViewportFillHeight();
  if (measured !== null && measured >= FILL_MIN_HEIGHT) {
    parentHeightUsable.value = true;
    viewportFillHeight.value = measured;
  } else {
    parentHeightUsable.value = false;
    viewportFillHeight.value = null;
  }
}

/**
 * 祖先链里是否存在「高度不由内容决定」的容器。
 *
 * <p>为什么必须查：{@code getComputedStyle(parent).height} 对**内容撑开**的父容器
 * 同样返回一个具体像素值，光看它 ≥ 120px 会把「auto 高度」误判成「确定高度」。
 * 实测消息管理页整条链就是这样：{@code .re-tab-icon__panel} 340、{@code .system-page}
 * 454、{@code .el-main} 470，每一层 computedH 都恰好等于自己的 scrollH、
 * 且没有一层设过 height——全是内容决定的。这种链上一旦开 fill，
 * {@code flex: 1 1 0 + min-height: 0} 会把表格压成 0 高（实测 .el-table 高 0，
 * 表头与空态全被裁掉），页面看着像没渲染。</p>
 *
 * <p>判据：向上走到滚动容器为止，只要有一层「实际高度明显大于自身内容高度」，
 * 说明这一层的高度来自 flex 分配或显式 height、还有余量，fill 才有意义。
 * 全部相等就说明整条链都是内容尺寸，一律判不可用。</p>
 */
/**
 * 找到最近的「纵向可滚动」祖先容器（没有则返回 null）。
 *
 * <p>判断依据是 computedStyle 的 overflowY，不看 scrollHeight 是否已超出：
 * 搜索区收起前后容器可能都还装得下，但收起后仍应作为可用高度的边界。</p>
 */
function nearestScrollContainer(el: HTMLElement | null): HTMLElement | null {
  let cur = el?.parentElement ?? null;
  let depth = 0;
  while (cur && depth < 10) {
    const cs = getComputedStyle(cur);
    if (/(auto|scroll)/.test(cs.overflowY)) return cur;
    cur = cur.parentElement;
    depth++;
  }
  return null;
}

/**
 * 量「本组件上沿 → 最近滚动容器可视下沿」之间的距离，作为 fill 的像素高度。
 *
 * <p>减去组件上沿与容器上沿的差，再加上容器自身的 scrollTop：
 * 页面已经向下滚过一段时，可用高度要按当前可见范围算，否则表格会高出一屏。</p>
 *
 * <p>拿不到滚动容器时退回视口底部，保证「至少填到看得见的地方」。</p>
 */
function measureViewportFillHeight(): number | null {
  const root = rootRef.value;
  if (!root) return null;
  const top = root.getBoundingClientRect().top;
  const scroller = nearestScrollContainer(root);
  let bottom: number;
  if (scroller) {
    bottom = scroller.getBoundingClientRect().bottom;
  } else if (typeof window !== "undefined") {
    bottom = window.innerHeight;
  } else {
    return null;
  }
  const h = Math.floor(bottom - top);
  return Number.isFinite(h) ? h : null;
}

function ancestorHasSpareRoom(start: HTMLElement): boolean {
  let el: HTMLElement | null = start;
  let depth = 0;
  while (el && depth < 8) {
    const used = el.clientHeight;
    const content = el.scrollHeight;
    // 余量 ≥ 24px：低于此值通常是边框/滚动条造成的 1~2px 差，不是真的留白
    if (used > 0 && content > 0 && used - content >= 24) return true;
    // 走到可滚动容器就停，再往上没有分配关系了
    const cs = getComputedStyle(el);
    if (/(auto|scroll)/.test(cs.overflowY) && used <= content) return false;
    el = el.parentElement;
    depth++;
  }
  return false;
}
/** 高度观察器句柄 */
let fillObserver: ResizeObserver | null = null;

function stopFillObserver(): void {
  fillObserver?.disconnect();
  fillObserver = null;
}

function startFillObserver(): void {
  stopFillObserver();
  detectParentHeight();
  if (typeof ResizeObserver === "undefined") return;
  /**
   * 同时观察两个节点，缺一不可：
   *
   * <p><b>rootRef</b> —— 父容器高度变化的信号，供 {@link detectParentHeight} 重判
   * 「auto」模式下父容器是否可用。fill 开启时 root 是 `height:100%`，被 flex 钉死，
   * 它自己不会变，但父级布局变化仍会传导过来。</p>
   *
   * <p><b>表格元素</b> —— 这才是被量的对象，也是所有高度变化的真正落点。root 被钉死意味着
   * 单看它会漏掉：分页条出现/消失、搜索区折叠、工具栏行增减、布局切换 —— 这些都只改变
   * 「表格元素盒高」，不改变 root 盒高。原来只观察 root，等于这些场景永远不再重测。</p>
   */
  fillObserver = new ResizeObserver(() => {
    detectParentHeight();
    measureFillHeight();
    // 布局切换（v-if）会换掉表格元素，旧引用已失效：重新 observe 才能继续跟随。
    // 对已观察的元素重复 observe 是空操作，代价可忽略。
    const el = fillTableEl(mainRef.value);
    if (el) fillObserver?.observe(el);
  });
  if (rootRef.value) fillObserver.observe(rootRef.value);
  const tableEl = fillTableEl(mainRef.value);
  if (tableEl) fillObserver.observe(tableEl);
}

onMounted(() => {
  startFillObserver();
  // fill 判定要等布局稳定（keep-alive 首次进入、父级异步渲染），
  // nextTick 还不够时用 rAF 兜一次，避免首帧量到 0 高度
  nextTick(() => {
    detectParentHeight();
    measureFillHeight();
    requestAnimationFrame(() => {
      detectParentHeight();
      measureFillHeight();
    });
  });
});

onBeforeUnmount(stopFillObserver);
/* keep-alive 页面重新激活时父容器高度可能变了，重新判定并重测 */
onActivated(() => {
  nextTick(() => {
    detectParentHeight();
    measureFillHeight();
  });
});

/* 开关变化（fill / height / maxHeight / minHeight）后需要重新判定 */
watch(
  () => [props.layoutTable?.fill, props.layoutTable?.height, props.layoutTable?.maxHeight, props.layoutTable?.minHeight] as const,
  () => {
    nextTick(() => {
      detectParentHeight();
      measureFillHeight();
    });
  },
);

/* 行数变化不改高度（fill 下高度由容器定），但空态切换要重排一次 */
watch(isEmpty, () => nextTick(measureFillHeight));

/** el-table / vxe-table 的最终高度：fill 模式用实测值，否则用页面传的值 */
const resolvedHeight = computed<string | number | undefined>(() =>
  fillActive.value ? fillTableHeight.value || undefined : props.layoutTable?.height,
);
/** el-table / vxe-table 的最终最大高度：fill 模式不设（高度已确定），否则用页面传的值 */
const resolvedMaxHeight = computed<string | number | undefined>(() =>
  fillActive.value ? undefined : props.layoutTable?.maxHeight,
);
/** 撑开模式的 minHeight 内联样式：fill 模式不需要（高度已确定） */
const heightMinStyle = computed<Record<string, string> | undefined>(() => {
  if (fillActive.value) return undefined;
  if (props.layoutTable?.height || props.layoutTable?.maxHeight) return undefined;
  return { minHeight: tableMinHeight.value };
});

// ==================== 布局切换（表格 / 视图 / 卡片） ====================

/**
 * 读取上次选择的布局。
 *
 * <p>与列配置 / 分页读同一份 {@link ReTableFullState}（effectiveStorage + tableId），
 * 不再单独写 {@code re-table-layout:<tableId>}。仍读一次旧的独立 key 做兼容：
 * 早期版本把布局存在那里，老用户 localStorage 里已有值，直接切走会让他们的选择丢失。</p>
 */
function readStoredLayout(): ReTableSwitchLayout | null {
  try {
    if (activeTableId.value) {
      const saved = effectiveStorage.value.get(activeTableId.value) as ReTableFullState | null;
      if (saved?.layout === "table" || saved?.layout === "view" || saved?.layout === "card") {
        return saved.layout;
      }
    }
    // 旧版独立 key（仅当调用方显式传了 tableId 时才可能命中）
    if (props.tableId) {
      const raw = window.localStorage.getItem(`re-table-layout:${props.tableId}`);
      if (raw === "table" || raw === "view" || raw === "card") return raw;
    }
  } catch {
    // 隐私模式等场景忽略
  }
  return null;
}

/**
 * 记忆布局选择（同一表格下次进入保持）。
 *
 * <p>写回统一状态而非独立 key：{@code saveColumnState} 里已带 layout，
 * 这里只需触发一次保存即可，避免两处状态各写一半、互相覆盖。</p>
 */
function persistLayout(value: ReTableSwitchLayout): void {
  saveColumnState();
  // 旧 key 清掉：否则下次 readStoredLayout 仍会命中它，新选择写不进去
  try {
    if (props.tableId) window.localStorage.removeItem(`re-table-layout:${props.tableId}`);
  } catch {
    // 忽略写入失败
  }
}

/**
 * 当前生效布局。
 *
 * <p>两种情况下完全听 props.layout：{@code layoutSwitch=false}（不提供切换器）、
 * 或 {@code layoutPersist=false}（切换不跨会话记忆，业务指定的初始布局优先）。
 * 其余情况持久化记忆优先于 props.layout，尊重用户上次的选择；
 * 用户切换只改这里，主体分支统一读 activeLayout。</p>
 */
const activeLayout = ref<ReTableLayout>(
  props.layoutSwitch === false || props.layoutPersist === false
    ? props.layout
    : (readStoredLayout() ?? props.layout),
);

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
/**
 * 是否在工具条显示「行拖拽」开关。
 *
 * <p><b>默认关闭</b>：开关跟随 {@code rowDraggable} 属性，页面不传就没有拖拽入口。</p>
 *
 * <p>2026-09-29 先改成了常显，随后按要求回退。常显的理由（让所有页面都能试拖拽）
 * 不成立 —— 拖拽是**有序语义**，页面得先有排序字段、还得实现拖拽后的持久化
 * （见 {@code sortField} / {@code @row-sort}），乱开一个入口只会让用户点了发现
 * 排序存不下来。所以入口应由页面显式声明，不是组件替它决定。</p>
 */
const showDragToggle = computed<boolean>(() => props.rowDraggable === true);
/** 引擎切换器候选与文案（仅 debug 打开时渲染） */
const ENGINE_OPTIONS: Array<"element" | "vxe"> = ["element", "vxe"];
const ENGINE_TEXT: Record<"element" | "vxe", string> = { element: "Element", vxe: "VXE" };
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
      if (props.layoutSwitch !== false && props.layoutPersist !== false) persistLayout(val);
  },
);

/* 布局切换（表格 / 视图 / 卡片）会换掉 DOM，需重新量高度并把 RO 重新挂到新元素上。
   只 measure 不重新 observe 是不够的：旧表格元素已被 v-if 销毁，新元素不在观察列表里，
   之后它的盒高再变也没人重测。
   放在这里而不是上面的 fill 段：activeLayout 在此处才声明，提前 watch 会撞 TDZ。 */
watch(activeLayout, () =>
  nextTick(() => {
    measureFillHeight();
    startFillObserver();
  }),
);

/** 切换布局 */
function switchLayout(key: ReTableSwitchLayout): void {
  if (key === activeLayout.value) return;
  activeLayout.value = key;
  // 切回表格后需重排列宽（表头与 body 对齐）
  nextTick(() => {
    try {
      recalcTable();
    } catch {
      // noop
    }
  });
}

/** 当前生效的引擎：优先跟 props.engine 走（v-model:engine 时由外部驱动） */
const currentEngine = computed<"element" | "vxe">(() => props.engine ?? "element");

/**
 * 切换表格引擎。
 *
 * <p>两套引擎渲染的是各自独立的表格 DOM，所以切引擎等于整棵表格重建：选中行、
 * 滚动位置、列宽都不保留。这是预期行为 —— 切换器是验收 / 选型用的调试能力，
 * 默认不暴露给业务用户。</p>
 */
function switchEngine(key: "element" | "vxe"): void {
  if (key === currentEngine.value) {
    return;
  }
  emit("update:engine", key);
  // 旧引擎的选中态与高度测量都随 DOM 一起没了，新引擎要重新量一次
  nextTick(() => {
    measureFillHeight();
    startFillObserver();
  });
}

/** 视图模式序号跨页连续 */
const layoutIndexOffset = computed<number>(() =>
  props.pagination ? Math.max(0, (internalPage.value - 1) * currentPageSize.value) : 0,
);

/** 数据加载/翻页后重新布局，确保表头与表体列宽始终对齐（异步数据、横向滚动、窗口缩放场景） */
watch(dataList, () => {
  nextTick(() => {
    try { recalcTable(); } catch { /* noop */ }
  });
});

/** 表格最小高度（空数据时保持此高度，默认 440px） */
const tableMinHeight = computed<string>(() => {
  const mh = props.layoutTable?.minHeight;
  if (mh === undefined || mh === null) return "440px";
  return typeof mh === "number" ? `${mh}px` : mh;
});

/**
 * 根节点内联样式。
 *
 * <p>{@code --re-table-min-height} 供空态用；{@code height} 只在
 * {@link viewportFillHeight} 有值（父链没有确定高度、改用实测可用高度补偿）时给出。
 * 内联 height 优先级高于样式表里的 {@code .re-table--fill { height: 100% }}，
 * 正好用来给 flex 链补上它缺的那个确定基准。</p>
 *
 * <p>fill 未生效时不给 height，页面该多高就多高。</p>
 */
const rootStyle = computed<Record<string, string>>(() => {
  const style: Record<string, string> = { "--re-table-min-height": tableMinHeight.value };
  if (fillActive.value && viewportFillHeight.value !== null) {
    style.height = `${viewportFillHeight.value}px`;
  }
  return style;
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
    ref="rootRef"
    class="re-table"
    :class="{
      're-table--empty': isEmpty,
      're-table--compact': tableSize === 'small',
      're-table--separated': searchSeparated,
      're-table--fixed-height': hasFixedHeight || fillActive,
      're-table--fill': fillActive,
      're-table--engine-element': !useVxe,
      're-table--engine-vxe': useVxe,
      [`re-table--layout-${activeLayout}`]: true,
    }"
    :style="rootStyle"
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
    <div ref="mainRef" class="re-table__main">
    <!-- 工具栏行：左侧 #toolbar 自定义按钮；右侧系统工具组（批量/拖拽/搜索/布局切换/自动刷新/刷新） -->
    <div
      v-if="$slots.toolbar || searchEnabled || showDragToggle || batchDelete || autoRefresh || showLayoutSwitch || debug"
      class="re-table__toolbar-row"
    >
      <div v-if="$slots.toolbar" class="re-table__toolbar-left">
        <slot name="toolbar" />
      </div>
      <div
        v-if="searchEnabled || showDragToggle || batchDelete || autoRefresh || showLayoutSwitch || debug"
        class="re-table__toolbar-right"
      >
        <!-- 批量删除模式：右侧工具栏最左侧出现 取消 / 确认删除（与拖拽的取消/确认同位置，二者互斥） -->
        <template v-if="batchDeleteMode">
          <el-button  :disabled="batchProcessing" @click="cancelBatchDelete">取消</el-button>
          <el-button
            
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
          
          @click="cancelDragSort"
        >取消排序</el-button>
        <el-button
          v-if="dragMode && dragChanged"
          type="primary"
          text
          
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
          v-if="showDragToggle"
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
        <!-- 自动刷新：ReSwitch(popover) —— 纯 ReButton(square) 作入口，点开是无边框的档位菜单。
             档位即状态：选中哪档就是哪个间隔，浮层内不另设开关；点亮态走方块按钮主色 + 右上角打勾，
             title 承担状态文案（「自动刷新：已关闭」/「自动刷新中：每 N 秒」）。 -->
        <ReSwitch
          v-if="autoRefresh"
          v-model="autoRefreshMs"
          layout="popover"
          icon="Timer"
          :title="autoRefreshStateText"
        >
          <span class="re-table__auto-refresh-title">自动刷新</span>
          <ReSelect v-model="autoRefreshValue" layout="square" vertical :data="autoRefreshOptions" />
          <span class="re-table__auto-refresh-hint">选中即生效，表格按该间隔自动重取当前页</span>
        </ReSwitch>
        <!-- 布局切换（系统级分段控件，位于自动刷新右侧）：表格 / 视图 / 卡片
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
        <!-- 引擎切换（Element / VXE）：只在 debug 模式下出现，属验收 / 选型向控件，
             不是业务功能。与布局切换一样是分段控件，但用文字不用图标 ——
             element / vxe 这两个词本身没有公认图形，图标化反而要靠 tooltip 才能读懂。 -->
        <div v-if="debug" class="re-table__layout-switch" role="group" aria-label="表格引擎切换">
          <button
            v-for="key in ENGINE_OPTIONS"
            :key="key"
            type="button"
            class="re-table__layout-switch-item re-table__layout-switch-item--text"
            :class="{ 'is-active': currentEngine === key }"
            :aria-pressed="currentEngine === key"
            :title="`切换到 ${ENGINE_TEXT[key]} 引擎`"
            @click="switchEngine(key)"
          >
            {{ ENGINE_TEXT[key] }}
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

    <!-- 表格模式 · element 引擎（默认）：el-table，行拖拽走 Sortable 直改 tbody -->
    <ElTable
      v-if="!useVxe && activeLayout === 'table'"
      ref="elTableRef"
      v-bind="$attrs"
      :data="pagedRows"
      :loading="loading || dataLoading"
      :highlight-current-row="localSettings.highlightCurrentRow ?? false"
      :stripe="localSettings.stripe ?? false"
      :border="localSettings.border ?? true"
      :size="tableSize"
      :row-key="rowKey"
      :show-header="layoutTable?.showHeader ?? true"
      :height="resolvedHeight"
      :max-height="resolvedMaxHeight"
      :style="heightMinStyle"
      :tree-props="effectiveTreeProps"
      :default-expand-all="defaultExpandAll"
      :row-style="rowDraggable || dragMode ? { cursor: 'grab' } : undefined"
      @row-click="(row: Record<string, unknown>) => emit('row-click', row)"
      @cell-click="(row: Record<string, unknown>, column: TableColumnCtx<Record<string, unknown>>, cell: HTMLTableCellElement, event: PointerEvent) => onCellClick(row, column, cell, event)"
      @row-contextmenu="(row: Record<string, unknown>, column: TableColumnCtx<Record<string, unknown>> | null, event: PointerEvent) => onRowContextMenu(row, column, event)"
      @cell-contextmenu="(row: Record<string, unknown>, column: TableColumnCtx<Record<string, unknown>>, cell: HTMLTableCellElement, event: PointerEvent) => onCellContextMenu(row, column, cell, event)"
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
      <!-- 拖拽手柄列：仅拖拽排序模式 -->
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
              <!-- 内联编辑：isColEditable 自带 batchEditing 判断（编辑态开关只在这里判一次） -->
              <template v-if="isColEditable(col)">
                <ElInput
                  v-if="col.editType === 'text' || !col.editType"
                  :model-value="String(getEditValue(row, col) ?? '')"
                  @input="(v: string) => setEditValue(row, col, v)"
                />
                <ElInput
                  v-else-if="col.editType === 'number'"
                  type="number"
                  :model-value="String(getEditValue(row, col) ?? '')"
                  @input="(v: string) => setEditValue(row, col, Number(v))"
                />
                <el-select
                  v-else-if="col.editType === 'select'"
                  :model-value="getEditValue(row, col) as string | number"
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
      <!-- 空态：未提供 #empty 插槽时回落到 el-empty（保持既有行为） -->
      <template #empty>
        <slot name="empty" :description="emptyText">
          <el-empty :description="emptyText" :image-size="96" />
        </slot>
      </template>
      <slot />
    </ElTable>

    <!-- 表格模式 · vxe 引擎（engine="vxe"）：固定表头 / 虚拟滚动场景 -->
    <VxeTable
      v-else-if="activeLayout === 'table'"
      :key="vxeColumnKey"
      ref="vxeTableRef"
      v-bind="$attrs"
      :data="tableRows"
      :loading="loading || dataLoading"
      :border="localSettings.border ?? true"
      :stripe="localSettings.stripe ?? false"
      :size="vxeTableSize"
      :height="resolvedHeight"
      :max-height="resolvedMaxHeight"
      :show-header="layoutTable?.showHeader ?? true"
      :empty-text="emptyText"
      :style="heightMinStyle"
      :row-config="vxeRowConfig"
      :column-config="{ resizable: borderResizable }"
      :checkbox-config="vxeCheckboxConfig"
      :tree-config="vxeTreeConfig"
      :row-style="rowDraggable || dragMode ? { cursor: 'grab' } : undefined"
      @cell-click="onVxeCellClick"
      @cell-menu="onVxeCellMenu"
      @checkbox-change="onVxeCheckboxChange"
      @checkbox-all="onVxeCheckboxAll"
      @sort-change="onVxeSortChange"
      @row-dragend="onVxeRowDragEnd"
    >
      <!-- 勾选列：常驻选择 / 批量选择 / 批量删除三种场景共用一列 -->
      <VxeColumn
        v-if="showSelection || batchSelectActive || batchDeleteMode || isBatchEnabled(toolbarConfig.batchSelect)"
        type="checkbox"
        width="50"
        fixed="left"
      />
      <!-- 拖拽手柄列：仅拖拽排序模式。
           drag-sort 把本列标记为 vxe 内置行拖拽的手柄列。
           ⚠ 必须保持 row-drag-config.showIcon 为默认的 true：vxe 源码 renderCellBaseVNs 里，
           发起拖拽用的 onMousedown 是随 renderCellDragIcon 一起挂的（trigger 无默认值即
           undefined，不等于 'cell'，故 mousedown 必挂）。一旦 showIcon=false，vxe 根本不
           渲染手柄壳，onMousedown 也就无处可挂 —— 拖拽直接失效。
           所以不能自己用 #default 画图标（那样一行出两个图标，且自己画的不带 mousedown），
           要换图标只能走 row-drag-icon 插槽，让 vxe 的手柄壳包住我们的图标。 -->
      <VxeColumn v-if="dragMode" width="55" fixed="left" align="center" drag-sort>
        <template #header>
          <ElIcon><Rank /></ElIcon>
        </template>
        <template #row-drag-icon>
          <ElIcon
            class="vxe-drag-handle"
            style="cursor: grab; font-size: 18px; color: var(--el-text-color-secondary); user-select: none"
          ><Rank /></ElIcon>
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
        :fixed="vxeFixed(col)"
        :align="col.align"
        :sortable="Boolean(col.sortable)"
        :show-overflow="vxeShowOverflow(col)"
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
          <!-- isColEditable 自带 batchEditing 判断（编辑态开关在这里只判一次） -->
          <template v-if="isColEditable(col)">
            <ElInput
              v-if="col.editType === 'text' || !col.editType"
              :model-value="String(getEditValue(row, col) ?? '')"
              @input="(v: string) => setEditValue(row, col, v)"
            />
            <ElInput
              v-else-if="col.editType === 'number'"
              type="number"
              :model-value="String(getEditValue(row, col) ?? '')"
              @input="(v: string) => setEditValue(row, col, Number(v))"
            />
            <el-select
              v-else-if="col.editType === 'select'"
              :model-value="getEditValue(row, col) as string | number"
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
              @input="(v: string) => setEditValue(row, col, v)"
            />
          </template>
          <span
            v-else
            :class="{ 're-table__cell-ellipsis': col.showOverflowTooltip }"
            :title="String(row[col.prop] ?? '')"
          >
            {{ formatCell(row, col) }}
          </span>
        </template>
      </VxeColumn>
      <!-- 空态：未提供 #empty 插槽时回落到 el-empty（保持既有行为） -->
      <template #empty>
        <slot name="empty" :description="emptyText">
          <el-empty :description="emptyText" :image-size="96" />
        </slot>
      </template>
      <slot />
    </VxeTable>

    <!-- 视图模式（一行一块；默认模板可被 #view 插槽整体替换） -->
    <ReTableView
      v-else-if="activeLayout === 'view'"
      :rows="pagedRows"
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
      :rows="pagedRows"
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
            :page-size="currentPageSize"
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
                <!-- ⚠ 必须外包一层单根元素：ElPopover 的 #reference 走 ElOnlyChild，
                     它要求引用内容是**唯一根节点**。ReButton 的模板是 v-if/v-else-if
                     多分支（fragment），直接当引用时 ElOnlyChild 会报
                     "[ElOnlyChild] no valid child node found" 并**完全不挂触发器监听** ——
                     表现就是点「列设置」只弹出按钮自带的 tooltip、面板永远不开（实测控制台
                     正好两条该告警，对应列设置 + 表格设置）。外面这层 span 只是给
                     ElOnlyChild 一个可挂载的单根节点，点击从内层按钮冒泡上来即可。 -->
                <span class="re-table__settings-trigger">
                  <ReButton layout="square" :size="tableSize" :icon="iconColumns" :title="columnsTriggerText" />
                </span>
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
                <div v-if="!activeTableId" class="re-table__columns-hint">
                  当前不在路由下、也未设置 tableId，列顺序 / 隐藏 / 分页 / 布局不会持久化
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
                <!-- ⚠ 同上：必须外包单根元素，否则 ElOnlyChild 挂不上触发器、面板点不开。 -->
                <span class="re-table__settings-trigger">
                  <ReButton layout="square" :size="tableSize" :icon="iconSettings" :title="settingsTriggerText" />
                </span>
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
/* 根容器：圆角 + 内边距（组件与容器边缘的边距，可用 --rt-padding 调整）
   1px 描边是卡片边界的兜底表达：暗色下投影几乎不可见，靠这条线维持边界。
   overflow: hidden 收口表格内部的浮层（vxe 固定列、空态）溢出；
   它只裁剪后代、不裁剪自身投影，所以不影响卡片的 box-shadow。
   两卡模式（.re-table--separated）下根容器透明且不收口，见下方该条。 */
.re-table {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--rt-radius);
  padding: var(--rt-padding, 12px);
  background: var(--rt-bg);
  font-size: var(--rt-font);
  overflow: hidden;
}
/* ============ 吃满父容器（fill 模式，2026-09-28 起缺省开启） ============
   传了 height / maxHeight / minHeight 的页面走原路径，不进这里；显式 fill:false 可退出。

   链路：根节点 height:100% 继承父容器 → flex 列 → 主体区 flex:1 吃掉搜索区与分页条之外的
   全部剩余高度 → 实测高度回填给 vxe-table 的 height，vxe 据此把 body 变成内部
   滚动容器（表头固定）。回填 height 是必须的：vxe-table 只有拿到 height 才内部滚动。

   ⚠ min-height: 0 是关键：flex 子项默认 min-height:auto，长内容会把主体区顶高、
   撑破容器，flex:1 随之失效。 */
.re-table--fill {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}
.re-table--fill > .re-table__main {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
/* 主体区里承载表格的元素吃满剩余高度（工具栏行在前、表格在后）。
   四条渲染路径的根节点：.el-table（element 引擎，默认）/ .vxe-table（vxe 引擎）/
   .re-table__view-layout / .re-table__card-layout。后两路自带 overflow，
   内部滚动由各自根节点负责；两个表格引擎同一时刻只渲染一个。

   flex-basis 用 0 而不是 auto：auto 会拿表格的内联 height（引擎依据我们回填的
   实测值写入）当基准再叠加 flex 分配，出现过内联值与实际渲染打架的情况。
   basis:0 让 flex 纯粹按剩余空间分配，内联 height 只负责开启内部滚动机制。 */
.re-table--fill > .re-table__main > .el-table,
.re-table--fill > .re-table__main > .vxe-table,
.re-table--fill > .re-table__main > .re-table__view-layout,
.re-table--fill > .re-table__main > .re-table__card-layout {
  flex: 1 1 0;
  min-height: 0;
}
/* ⚠ fill 模式的地板：无论父链判定多准，表格都不允许被压到看不见。
   flex:1 1 0 的 0 基准 + min-height:0 在「父容器高度由内容决定」时会算出 0 高，
   表头与空态一起消失（实测 .el-table 高 0，而同页 .page-empty 有 206px 被裁掉）。
   120px 是表头(约 59px) + 两行数据的下限；宁可让页面多滚一段，
   也不能出现「表格整块看不见、像没渲染」的状态。 */
.re-table--fill > .re-table__main > .el-table,
.re-table--fill > .re-table__main > .vxe-table {
  min-height: 120px;
}
/* fill 模式高度已确定：空态填满 body 剩余区域，不再用 440px 强撑。
   vxe 没有 element-plus 那层 el-scrollbar，链路短一环：
     .vxe-table--body-wrapper（滚动容器）→ .vxe-table--empty-block → el-empty
   少给一环，空块就退回内容高度。⚠ 这里必须给 height:100% 而不是 min-height:0：
   min-height:0 会让空块被压成 0 高、整体不可见（缺省开启 fill 之前踩过这个坑）。 */
.re-table--fill.re-table--empty .vxe-table--body-wrapper,
.re-table--fill.re-table--empty .vxe-table--empty-block {
  min-height: 100%;
  height: 100%;
}
.re-table--fill.re-table--empty .vxe-table--body-wrapper .el-empty {
  padding: 0;
  height: 100%;
}
/* element 引擎的空态高度链比 vxe 长一层（多了 el-scrollbar）：
   body-wrapper → el-scrollbar__wrap → el-scrollbar__view → empty-block → el-empty。
   少给一环空块就退回内容高度（实测只剩 143px，而不是 body 的 281px）。 */
.re-table--fill.re-table--empty .el-table__body-wrapper .el-scrollbar__view,
.re-table--fill.re-table--empty .el-table__body-wrapper .el-table__empty-block {
  min-height: 100%;
  height: 100%;
}
.re-table--fill.re-table--empty .el-table__body-wrapper .el-empty {
  padding: 0;
  height: 100%;
}
/* 纯展示列的省略号：长值需自带单行截断 */
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
   只作用于 .re-table 内的 vxe-table，全部走 koi / element-plus 令牌，亮暗自适应：
     · 外框圆角 + 细描边 + 柔和投影，把表格从"裸网格"变成一块面板
     · 表头渐变底 + 600 字重，避免头行与内容糊在一起
     · 行高 44px（紧凑模式 36px）、斑马纹更淡、hover 混主色
     · hover / 选中行首列左侧主色条，弱化但可定位
   ⚠ 表格引擎已由 element-plus 换成 vxe-table，这里改的是 vxe 的
      --vxe-table-* 变量（vxe 不读 --el-table-*，照抄旧变量名不会生效）。
   ⚠ 分页条同步这套语言（见文件末尾分页样式），否则表格与分页会像两个组件。 */
.re-table .vxe-table {
  --vxe-table-border-color: var(--el-border-color-lighter);
  /* ⚠ vxe 画单元格线读的是带 ui- 前缀的变量：--vxe-ui-table-border-color。
     上面那条 --vxe-table-border-color（无 ui-）不是它读的那个，写了等于没写，
     vxe 一直用自己的默认 #e8eaec —— 比本组件的 #ebeef5 深，
     于是同一张表里「自己画的线」和「vxe 画的线」两种颜色。 */
  --vxe-ui-table-border-color: var(--el-border-color-lighter);
  /* ⚠ vxe 默认线宽是 1.05px，落在非整数像素上被浏览器抗锯齿，
     渲染成一条发糊的灰线；压成整数 1px 才和 el-table 的实线一样锐利。 */
  --vxe-ui-table-border-width: 1px;
  /* 表头底：置为透明，让下方 .re-table .vxe-header--column 的渐变生效。
     不置透明时 vxe 会用这个变量在表头上再铺一层纯色，
     结果渐变被盖成 #ebeeF5 平色 —— 与 element 引擎的 #fafafa→#fafcff 明显不同。 */
  --vxe-table-header-background-color: transparent;
  --vxe-table-header-font-color: var(--el-text-color-primary);
  --vxe-table-row-hover-background-color: color-mix(in srgb, var(--el-color-primary) 7%, var(--el-bg-color));
  --vxe-table-body-background-color: var(--el-table-bg-color, var(--el-bg-color));
  --vxe-table-border-radius: calc(var(--rt-radius) + 2px);
  /* 行高说明见下方 .re-table .vxe-body--row —— vxe 对它自己的 JS 内联高度
     并不读这个变量（实测改成 24px 后单元格内联值仍是 44px），所以只为对齐
     vxe 的样式表计算保留一个合理值，真正生效的是下面那条 !important。 */
  /* ⚠ 行高请看下方 .re-table .vxe-body--row 那条注释：
     vxe 的行高由它自己 JS 写内联值控制，CSS 覆盖不动；两套引擎实测渲染
     出来的行高是一致的（都是 59px），不需要额外对齐。 */
  --vxe-table-row-height-medium: 44px;
  --vxe-table-row-height-small: 36px;
  font-size: 13.5px;
  border-radius: calc(var(--rt-radius) + 2px);
  /* ⚠ 必须裁剪：vxe 的 .vxe-table--header-wrapper / --body-wrapper 自身是
     border-radius:0 的直角容器，本组件给 .vxe-table 加了圆角但 vxe 默认
     overflow:visible，方角会直接戳到圆角外面 —— 视觉上就是「表格没有圆角」。
     element 的 el-table 自带 overflow:hidden，所以那边看不出问题。 */
  overflow: hidden;
}
/* 行高：两套引擎本来就一致（同一页并排实测 element 59 / vxe 59），
   所以这里不需要"把 vxe 压到 element 的值"——那个"vxe 比 element 高 8px"的说法
   是跨页面比较造成的假阳性（拿消息管理页的 vxe 行高去比另一个页面的 element 行高），
   已作废，不要再据此"修"。
   ⚠ 这条 !important 目前并不生效：vxe 用 JS 在行/单元格上写内联 height，
     优先级高于样式表，实测 computed 仍是 59px。保留它是给 vxe 行为变化留的
     正确目标值（51px = 上下 10px 内边距 + 20px line-height + 1px 分隔线）。
   ⚠ 要压 vxe 的行高只能改 rowConfig.height（Vue 侧属性），而它会写死行高、
     同时让 --vxe-table-row-height-* 与本组件的 CSS 都覆盖不动 —— 两套引擎下
     视觉必须一致，所以刻意不设。 */
.re-table .vxe-body--row,
.re-table .vxe-body--row > .vxe-body--column {
  height: 51px !important;
}
.re-table--compact .vxe-body--row,
.re-table--compact .vxe-body--row > .vxe-body--column {
  height: 36px !important;
}
/* 表头：渐变底 + 600 字重 + 底部描边
   ⚠ 行高由内容决定（ReTag / 按钮等），不用 height 硬压；用 !important 提权，
     压过应用层可能存在的全局表头内边距。
   ⚠ background 也要 !important：vxe 自身会在表头单元格上铺两层
     linear-gradient(#ebeeF5, #ebeeF5)（实测 computed backgroundImage 前两层），
     把本条的渐变盖成平色，视觉上与 element 引擎的 #fafafa→#fafcff 分叉。
     只改 --vxe-table-header-background-color 不够——那两层不来自该变量。 */
.re-table .vxe-header--column {
  padding-top: 9px !important;
  padding-bottom: 9px !important;
  background: linear-gradient(180deg, var(--el-fill-color-lighter), var(--el-fill-color-extra-light)) !important;
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 13px;
  /* 应用层常给表头加 uppercase / 大字距（对中文表头是视觉噪声），组件内归一 */
  text-transform: none;
  letter-spacing: 0.2px;
  /* 表头边框：列间竖线只在「边框」开关打开时出现，横向分隔线始终保留。
     · element 的语义就是这样：关掉边框只去掉 .el-table--border 带来的列间竖线，
       单元格的 border-bottom 缺省一直在（表头/表体、行与行之间的横线不会消失）。
     · vxe 用 .border--full / .border--default 表示边框开关，**且它是用
       background-image 渐变画线、不写 border-* 属性**，所以我们加的 border-right
       不会被它覆盖 —— 必须自己挂条件。实测：关掉边框后表头仍有 1px 竖线，
       就是因为这条 border-right 原来没有限定（border--default 对表头没有任何 vxe 规则，
       那条线唯一来源就是我们）。
     · border-bottom 用 lighter（#ebeeF5）而不是 el-border-color（#dcdfe6）：
       与下方数据行的分隔线同色，表头与第一行才是"一条线"而不是"两条深浅不同的线"。
     ⚠ 必须写全 border-right 简写。只写 border-right-color 时，vxe 自带样式的
       border-right-width 仍是 0，量出来还是 0px —— 这个坑踩过一次。 */
  border-bottom: 1px solid var(--el-border-color-lighter);
}
/* 列间竖线：只在 border--full（边框开关＝开）时绘制 */
.re-table .vxe-table--render-default.border--full .vxe-header--column {
  border-right: 1px solid var(--el-border-color-lighter);
}
.re-table--compact .vxe-header--column {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}
/* 表体：内边距 + 更淡的分割线（行高由内容决定，不硬压 height）
   !important 原因同表头：应用层 pages.css 存在全局锁死单元格内边距的写法。
   ⚠ border-bottom 必须写全简写：只给 border-bottom-color 时，vxe 默认的
     border-bottom-width 是 0，行与行之间没有分隔线（element 引擎是 1px），
     实测两边差一条线。 */
.re-table .vxe-body--column {
  padding-top: 10px !important;
  padding-bottom: 10px !important;
  /* ⚠ 这里刻意**不写** border-bottom：
     表体单元格的下边线交给 vxe 自己的 background-image 渐变画
     （见上方 --vxe-ui-table-border-color / --vxe-ui-table-border-width 两条说明）。
     以前这里写了一条 1px border，与 vxe 那条渐变线叠在同一位置 ——
     形成「1px 实线 + 1.05px 渐变线」的重影，颜色还不同，
     渲染出来比 el-table 更粗更脏，这就是「vxe 边框不如 el-table 舒服」的来源。
     表头不受此影响：表头的 background 被本组件的渐变 !important 覆盖，
     vxe 的渐变线在表头上根本画不出来，所以表头必须自己写 border。 */
  transition: background-color var(--rt-duration, 200ms) var(--rt-ease, ease);
}
.re-table--compact .vxe-body--column {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}
/* 斑马纹（仅在 stripe 开启时生效，且比 element 更淡、不喧宾夺主）
   ⚠ vxe 4.6 的 stripe 不打 row--striped 行类（实测产物里无此串），
     只能靠 :nth-child(even) 兜住 —— 所以选择器必须带 .vxe-table--striped 限定。
     早先漏了这个限定：第二条选择器不带 --striped，对所有 vxe 表无条件生效，
     于是 stripe 关闭的表也被打上偶数行底色 #fafcff，整张表隔行变色，
     看着像"有的行有底色有的没有"。 */
.re-table .vxe-table--striped tr.vxe-body--row:nth-child(even) > .vxe-body--column {
  /* ⚠ 必须写 background-color 而不是 background 简写：
     简写会把 vxe 用 background-image 画的单元格线一并重置成 none，
     隔行底色的那些行就会丢掉右边线/下边线。 */
  background-color: var(--el-fill-color-extra-light);
}
/* hover / 选中行首列主色条 */
.re-table tr.vxe-body--row.row--hover > .vxe-body--column:first-child,
.re-table tr.vxe-body--row.row--current > .vxe-body--column:first-child {
  box-shadow: inset 2px 0 0 var(--el-color-primary);
}
.re-table tr.vxe-body--row.row--current > .vxe-body--column {
  /* 同上：只改底色，不动 background-image */
  background-color: color-mix(in srgb, var(--el-color-primary) 9%, var(--el-bg-color));
}
/* 单元格内容：横向内边距与行高节奏（统一为 20px，与 element 侧的 .cell 同口径） */
.re-table .vxe-body--column .vxe-cell,
.re-table .vxe-header--column .vxe-cell {
  padding: 0 12px;
  line-height: 20px;
}
/* 行高对齐 element（两处覆盖，都在这里集中说明）
   ⚠ vxe 用 --vxe-ui-table-row-height-medium（medium 档 44px）给单元格内部定高，
     而且是写成**内联样式**、表头与表体用的属性还不同（实测）：
       · 表头 .vxe-cell：内联 min-height: 44px → 表头行被撑到 63px（element 39px）
       · 表体 .vxe-cell：首列内联 height: 44px、其余列内联 min-height: 44px
                          → 任取一行都被其中最高的那个单元格顶到 64px（element 59px）
   两侧的 height 与 min-height 都要清掉，高度才回到「内边距 + 行高」的内容驱动口径：
     表头 9+9+20+1 = 39；表体视内容（发送时间两行）自然撑开。
   都必须带 !important —— 内联样式只有 !important 压得过。 */
.re-table .vxe-header--column .vxe-cell {
  min-height: 0 !important;
}
.re-table .vxe-body--column .vxe-cell {
  height: auto !important;
  min-height: 0 !important;
}

/* ============ element 引擎（默认）的表格视觉 ============
   与上面 vxe 那套是同一套设计语言的两种落地：同样的圆角细描边、渐变表头、
   44/36 行高、更淡的斑马纹、hover 混主色、首列主色条。
   两套选择器的 class 名完全不相交（.el-table* vs .vxe-*），同时挂在样式表里也不会
   互相干扰——同一时刻只有一个引擎渲染出 DOM，另一套自然全部落空。
   ⚠ 页面里 :deep(.el-table …) 这类内部覆盖只在 element 引擎下成立，
     这也是 engine 默认为 "element" 的原因。 */
.re-table .el-table {
  --el-table-border-color: var(--el-border-color-lighter);
  --el-table-header-bg-color: var(--el-fill-color-lighter);
  --el-table-header-text-color: var(--el-text-color-primary);
  --el-table-row-hover-bg-color: color-mix(in srgb, var(--el-color-primary) 7%, var(--el-bg-color));
  font-size: 13.5px;
  border-radius: calc(var(--rt-radius) + 2px);
}
.re-table .el-table__header-wrapper th.el-table__cell {
  padding-top: 9px !important;
  padding-bottom: 9px !important;
  background: linear-gradient(180deg, var(--el-fill-color-lighter), var(--el-fill-color-extra-light));
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 13px;
  text-transform: none;
  letter-spacing: 0.2px;
  border-bottom: 1px solid var(--el-border-color);
}
.re-table--compact .el-table__header-wrapper th.el-table__cell {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}
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
.re-table .el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
  background: var(--el-fill-color-extra-light);
}
.re-table .el-table__body tr.el-table__row:hover > td.el-table__cell:first-child,
.re-table .el-table__body tr.current-row > td.el-table__cell:first-child,
.re-table .el-table__body tr.el-table__row--striped.current-row > td.el-table__cell:first-child {
  box-shadow: inset 2px 0 0 var(--el-color-primary);
}
.re-table .el-table__body tr.current-row > td.el-table__cell {
  background: color-mix(in srgb, var(--el-color-primary) 9%, var(--el-bg-color));
}
.re-table .el-table__cell .cell {
  padding: 0 12px;
  line-height: 20px;
}
/* 横向滚动时表头投影，提示"右边还有列" */
.re-table .el-table__header-wrapper.is-scrolling-middle,
.re-table .el-table__header-wrapper.is-scrolling-left,
.re-table .el-table__header-wrapper.is-scrolling-right {
  box-shadow: 0 8px 14px -12px rgb(0 0 0 / 45%);
}
/* 固定右侧列：el-table 用 fixed-column 类标在单元格上，需补不透明底色 */
.re-table .el-table__body td.el-table-fixed-column--right {
  background-color: var(--el-table-bg-color, #fff);
}
.re-table .el-table__body tr:hover td.el-table-fixed-column--right,
.re-table .el-table__body tr.hover-row td.el-table-fixed-column--right {
  background-color: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-table-bg-color, #fff)) !important;
}
:deep(.el-table__fixed-right) {
  z-index: 30 !important;
}
:deep(.el-table__fixed-right::before) {
  z-index: 31 !important;
}
/* 拖拽模式下全局禁止表格文字选中 */
.re-table:has(.drag-handle) .el-table__body,
.re-table:has(.drag-handle) .el-table__body td .cell {
  user-select: none !important;
  -webkit-user-select: none !important;
}
/* 两卡模式（searchGap>0）：根容器透明，搜索区与主体区各自成白色圆角卡，间距露出页面底色。
   根容器必须 border:none + overflow:visible：两张卡与根容器左右等宽（实测 inset=0），
   根级 overflow:hidden 会把卡片的左右投影裁掉，只剩上下一截，投影看起来是"半截的"。
   表格浮层的收口因此下移到 .re-table__main。 */
.re-table--separated {
  background: transparent;
  border: none;
  padding: 0;
  overflow: visible;
}
.re-table--separated > .re-table__search {
  background: var(--rt-bg);
  border-radius: var(--rt-radius);
  padding: var(--rt-padding, 12px);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--rt-shadow-card);
  transition: box-shadow var(--rt-duration, 200ms) var(--rt-ease, ease);
}
.re-table--separated > .re-table__main {
  background: var(--rt-bg);
  border-radius: var(--rt-radius);
  padding: var(--rt-padding, 12px);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--rt-shadow-card);
  /* 表格浮层（vxe 固定列、空态）在主体卡上收口（根容器已改为 visible） */
  overflow: hidden;
  /* ⚠ 主体卡刻意不写 transition，也不挂 :hover 换投影。
     这张卡实测 1374×721，box-shadow 动画需要逐帧重绘整块大区域
     （Chrome 不做合成层加速），是页面上唯一可能造成大面积重绘的样式。
     搜索卡面积小，保留 hover 过渡；主体卡只保留静态投影。 */
}
/* 悬停抬一档投影：只给搜索卡（面积小、重绘代价低）。
   主体卡面积大，hover 换投影会把"划过表格"变成持续重绘，故不参与。 */
.re-table--separated > .re-table__search:hover {
  box-shadow: var(--rt-shadow-card-hover);
}
/* 键盘聚焦到卡内控件时描边转主色，让"焦点落在哪一块"可感知 */
.re-table--separated > .re-table__search:focus-within,
.re-table--separated > .re-table__main:focus-within {
  border-color: var(--el-color-primary-light-5);
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
/* 工具条左侧的页面主按钮（「发送消息」这类）与搜索区主按钮统一为胶囊形：
   搜索按钮已是胶囊，同一行出现两种主按钮形状会显得没有规范。
   只收主按钮，次要/文字按钮保持原有方角，避免整排都是胶囊而失去主次。 */
.re-table__toolbar-left .el-button--primary {
  border-radius: var(--rt-radius-full, 9999px);
}
/* 表内标签统一胶囊形：表格单元格里 el-tag 默认 4px 方角，与胶囊分页/胶囊按钮
   不属于同一套形状语言。 */
.re-table .el-table .el-tag,
.re-table .vxe-table .vxe-cell .el-tag {
  border-radius: var(--rt-radius-full, 9999px);
}
/* 布局切换：分段控件（segmented），位于自动刷新右侧。
   外层灰底圆角轨道 + 内层浮起白底滑块：选中项主色图标、未选中项常规文字色，
   暗色/反转由 --el-* 令牌自动跟随，不写死浅色底。 */
.re-table__layout-switch {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  margin-left: 2px;
  background: var(--el-fill-color-light);
  border-radius: 10px;
}
.re-table__layout-switch-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition:
    background-color var(--rt-duration, 200ms) var(--rt-ease, ease),
    color var(--rt-duration, 200ms) var(--rt-ease, ease),
    box-shadow var(--rt-duration, 200ms) var(--rt-ease, ease);
}
.re-table--compact .re-table__layout-switch-item {
  width: 26px;
  height: 26px;
}
/* 文字型分段项（引擎切换 Element / VXE）：父级给的是 30px 固定方块，
   文字塞不下会被裁成竖条，所以这里放开宽度改成左右留白。 */
.re-table__layout-switch-item--text {
  width: auto;
  min-width: 52px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
}
.re-table--compact .re-table__layout-switch-item--text {
  width: auto;
  min-width: 46px;
  padding: 0 8px;
}
/* element-plus 图标 svg 是 1em + 内联 width/height，需提权才能压到 16px */
.re-table__layout-switch-item svg,
.re-table__layout-switch-item .el-icon svg,
.re-table--compact .re-table__layout-switch-item svg {
  width: 16px !important;
  height: 16px !important;
}
/* 键盘可达性：仅键盘聚焦时给焦点环，鼠标点击不显示 */
.re-table__layout-switch-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.re-table__layout-switch-item:hover {
  color: var(--el-color-primary);
}
/* 选中态：浮起白底 + 主色图标（对比靠 overlay / light 令牌分层，不硬编码品牌色） */
.re-table__layout-switch-item.is-active,
.re-table__layout-switch-item.is-active:hover {
  color: var(--el-color-primary);
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
}
/* 自动刷新浮层内容：纯无边框（标题 / 档位菜单 / 说明都不画分隔线）。
   状态不靠额外的「状态行」表达 —— 档位菜单里选中哪档就是哪个间隔，选中态是底色 + 右侧对勾。 */
.re-table__auto-refresh-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}
.re-table__auto-refresh-hint {
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
/* vxe-table 在根元素上本地定义 --vxe-table-* 变量，令牌必须直接挂在 .vxe-table 上才生效。
   这组与上面「默认表格视觉增强」同权重、位置更靠后，等于在基础视觉之上再叠一层 rt 令牌。 */
.re-table .vxe-table {
  --vxe-table-border-color: var(--rt-border);
  /* ⚠ 表头底必须留空。vxe 把这个变量当成**第一层 background-image**
     （linear-gradient(值, 值)）铺在表头上，会盖住 .re-table .vxe-header--column
     里的渐变，视觉上与 element 引擎（渐变 #fafafa→#fafcff）分叉成 #ebeeF5 平色。
     element 那边同样赋了 --el-table-header-bg-color，但它的 th 走 background 简写，
     渐变优先级更高，所以看不出问题——vxe 这边必须显式透明。 */
  --vxe-table-header-background-color: transparent;
  --vxe-table-row-hover-background-color: var(--rt-bg-row-hover);
  --vxe-table-body-background-color: var(--rt-bg);
}
/* 表头字体（vxe 默认色/字重偏浅，按 rt 令牌覆盖） */
.re-table .vxe-header--column {
  font-weight: var(--rt-header-font-weight);
  font-size: var(--rt-header-font-size);
  color: var(--rt-text-header);
}
/* 斑马纹美化（vxe 4.6 不打 striped 行类，用 nth-child 兜住）
   ⚠ background-color 而非 background 简写：见上方同名规则处的说明。 */
.re-table .vxe-table--striped tr.vxe-body--row:nth-child(even) > .vxe-body--column {
  background-color: var(--rt-bg-strip);
}
/* element 引擎的同一组 rt 令牌覆盖：位置更靠后、权重相同，等于在基础视觉之上再叠一层 */
.re-table .el-table {
  --el-table-border-color: var(--rt-border);
  --el-table-header-bg-color: var(--rt-header-bg);
  --el-table-row-hover-bg-color: var(--rt-bg-row-hover);
  --el-table-tr-bg-color: var(--rt-bg);
}
.re-table .el-table__header th.el-table__cell {
  font-weight: var(--rt-header-font-weight);
  font-size: var(--rt-header-font-size);
  color: var(--rt-text-header);
}
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
  /* ⚠ 抬成高于表格固定列浮层的一层。
     ReTable 给固定列浮层写了 z-index:30（element 的 .el-table__fixed-right /
     vxe 的 .vxe-table--fixed-right-wrapper），而页脚里的「每页条数」菜单是
     向上弹的（bottom: calc(100% + 6px)）、z-index 只有 20 —— 且它纵向必然落在
     表格高度范围内，只要横向与固定列浮层相交，菜单就会被压在表格下面：
     看着像"分页跑到表格后面"、点了没反应。菜单锚在按钮上、随窗口宽度左右移动，
     所以这是随宽度触发的，不是必现。
     页脚自己抬到 31（比 30 高一层）即可让整个页脚（含其内所有浮层）盖住表格，
     不改布局：页脚与表格本来就不重叠，抬高只影响层叠顺序。 */
  position: relative;
  z-index: 31;
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
/* 固定右侧列：vxe 用独立 fixed 容器渲染，需补不透明底色，
   否则横向滚动时右侧列会透出下方内容 */
.re-table .vxe-table--fixed-right-wrapper {
  z-index: 30 !important;
}
.re-table .vxe-body--column.col--fixed {
  background-color: var(--el-table-bg-color, #fff);
}
.re-table tr.vxe-body--row.row--hover > .vxe-body--column.col--fixed,
.re-table tr.vxe-body--row.row--current > .vxe-body--column.col--fixed {
  background-color: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-table-bg-color, #fff)) !important;
}
/* 空数据：撑满最小高度并居中（vxe-table）。
   ⚠ vxe 侧没有 element-plus 的 el-scrollbar 层，高度链短一环：.vxe-table--body-wrapper
     → .vxe-table--empty-block → el-empty，少给一环空块就退回内容高度。
   ⚠ 权重：空块相关规则一律挂 `.re-table .vxe-table--body-wrapper .vxe-table--empty-block`
     （0,3,0），压得住主题里可能存在的同级空块定位规则。
   ⚠ fill 缺省开启后最关键的一条在下方 --fixed-height 那组：min-height:0 会把空块
     压成 0 高、整体不可见，必须叠 height:100% 让它跟着 body 走。 */
.re-table--empty .vxe-table--body-wrapper {
  min-height: var(--re-table-min-height, var(--rt-empty-height));
}
/* 视口兜底高度：vxe 给空块写的是内联 height:100%，需要父级有确定高度，
   否则视口与空块一起塌成一条线 */
.re-table--empty .vxe-table--body-wrapper .vxe-table--empty-block {
  min-height: var(--re-table-min-height, var(--rt-empty-height));
}
.re-table .vxe-table--body-wrapper .vxe-table--empty-block {
  /* ⚠ vxe 用 JS 在内联样式里把空块宽度写成「整表内容宽」（实测 1160px），
     而 .vxe-table--body-wrapper 的可视宽只有 780（横向可滚）。内联样式优先于
     普通声明，所以这里的 width 必须带 !important 才压得住。
     不压的后果（2026-09-29 实测）：空块按 1160 居中 → 内容中心落在 658，
     而右侧固定列占 638..858，空态的下半截被固定列盖住、它的左竖线从空态
     中间穿过去。这正是"没有消息的组件跑到固定列下面"的成因。
     width: 100% 解析成父级内容盒 = 可视宽 780，中心 468，与表格可见中心一致。 */
  width: 100% !important;
  /* 横向可滚时必须吸左，否则往右滚一下空态就滑出可视区。
     原来写 position: static 是为了压主题里可能的空块定位规则，sticky + left:0
     同样是确定值，不会漏出主题的定位。 */
  position: sticky;
  left: 0;
  top: auto;
  right: auto;
  bottom: auto;
  transform: none;
  min-height: var(--re-table-min-height, var(--rt-empty-height));
  display: flex;
  align-items: center;
  justify-content: center;
}
/* ⚠⚠ 有数据时，空块必须彻底不占高 —— 否则右侧固定列会"滚不动"、与行错位。
   vxe 有数据时藏空块用的是 **visibility: hidden**，不是 display: none，
   所以空块照旧留在文档流里，按上面的 min-height 吃掉 440px。
   实测（消息管理，4 行数据）：
     mainBody.scrollHeight  = 676 = 236(4 行) + 440(幽灵空块)
     fixedBody.scrollHeight = 310            ← 固定列的克隆体没有这个空块
   两个表体滚动高度差 440px，而 vxe 的纵向同步是"主表体滚 → 克隆体跟随"，
   克隆体只有 310 可滚、主表体有 676 → 主表体滚到 183 时克隆体仍停在 0，
   操作列的按钮与行错位 183px。用户看到的就是"滚动时固定列不滚"。
   判据用 :has(.vxe-body--row) 而不是 dataList：vxe 是按**实际渲染出的行**决定
   显不显示空态，本地分页时 dataList 可能非空而当前页没有行，那时空态该照常显示。
   height + overflow 一起给：只给 height:0 时子元素仍会把 scrollHeight 撑开。 */
.re-table:has(.vxe-body--row) .vxe-table--body-wrapper .vxe-table--empty-block {
  min-height: 0;
  height: 0;
  padding: 0;
  overflow: hidden;
}
/* vxe 自己的 .vxe-table--empty-content 是 width:50%（相对空块），
   空块被改回可视宽后内容只剩一半、字会多折几行。改回 100% 让它与
   element 引擎的空态同宽（实测两边都铺满可见宽），两个引擎观感才一致。 */
.re-table .vxe-table--body-wrapper .vxe-table--empty-block > .vxe-table--empty-content {
  width: 100%;
}
/* 空态下右侧固定列浮层要"让位"。
   vxe 的 .vxe-table--fixed-right-wrapper 是 position:absolute + z-index:5 +
   background-color:inherit（不透明），覆盖在 body 右侧。有数据时它显示固定列的行，
   是对的；**无数据时它没有内容可显示，却仍把空态右半截盖住，左沿形成一条硬边**
   —— 这才是"没有消息的组件跑到固定列下面"的第二个成因（第一个是空块宽度，见上）。
   空态时把浮层底色与表体摘掉即可：表头在独立的 header-wrapper 里，列名照样可见；
   被盖住的只是没有内容的表格体。element 引擎空态下干脆不生成固定列浮层，
   这里等于把两个引擎的行为对齐。 */
.re-table--empty .vxe-table--fixed-right-wrapper {
  background-color: transparent;
  /* ⚠ 还得摘掉 vxe 给固定列加的左侧投影：
     `.vxe-table--render-default .vxe-table--fixed-right-wrapper.scrolling--middle`
     带 box-shadow -8px 0 10px -5px（权重 0,3,0，比本选择器高），这条投影正是
     空态右侧那条"竖线"—— 背景置透明只去掉了底，线还留着。必须 !important。 */
  box-shadow: none !important;
  /* ⚠ 同时要放行点击：浮层是 position:absolute + z-index:30（见上方既有规则），
     即使不绘制也仍盖在空态之上，会吞掉落在该区域的点击 —— 空态里的按钮
     一旦被列宽推到浮层范围内就会点不动。空态下浮层没有可交互内容，直接放行。 */
  pointer-events: none;
}
.re-table--empty .vxe-table--fixed-right-wrapper .vxe-table--body-wrapper {
  display: none;
}
/* 左固定列同理（如序号 / 勾选列固定时）。同一类缺陷，一并处理，
   否则空态左侧会被左浮层盖住、并留下一条硬边。 */
.re-table--empty .vxe-table--fixed-left-wrapper {
  background-color: transparent;
  box-shadow: none !important;
  pointer-events: none;
}
.re-table--empty .vxe-table--fixed-left-wrapper .vxe-table--body-wrapper {
  display: none;
}
/* 表格高度已确定（调用方给了 height/max-height，或 fill 生效）：
   空态改为填满 body 剩余区域，取消 440px 强撑。
   ⚠ 缺省开启 fill 之后这条最关键：min-height:0 会把空块压成 0 高、整体不可见
     （原先 fill 缺省关闭所以踩不到，现在每个页面都会命中）。
   min-height:0 保留（允许收缩），再叠 height:100% 让它跟着 body 走。 */
.re-table--empty.re-table--fixed-height .vxe-table--body-wrapper,
.re-table--empty.re-table--fixed-height .vxe-table--body-wrapper .vxe-table--empty-block {
  min-height: 0;
  height: 100%;
}
.re-table .vxe-table--body-wrapper .vxe-table--empty-placeholder {
  width: 100%;
  min-width: 0;
  line-height: inherit;
  padding: 0 16px;
}
.re-table .vxe-table--body-wrapper .el-empty {
  padding: 28px 0 36px;
}
/* element 引擎的空态（非 fill 分支）：高度链多一层 el-scrollbar，逐环给 100%。
   ⚠ 权重：统一挂 `.re-table .el-table__body-wrapper .el-table__empty-block`（0,3,0），
     压得住 koi 主题里可能存在的同级空块定位规则（该规则与本条权重相同，
     胜负只取决于样式表加载顺序，主题晚加载时空块会脱离文档流）。 */
.re-table--empty .el-table__body-wrapper {
  min-height: var(--re-table-min-height, var(--rt-empty-height));
}
.re-table--empty .el-table__body-wrapper .el-scrollbar {
  height: 100%;
}
.re-table--empty .el-table__body-wrapper .el-scrollbar__wrap {
  height: 100% !important;
}
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
.re-table--empty.re-table--fixed-height .el-table__body-wrapper,
.re-table--empty.re-table--fixed-height .el-table__body-wrapper .el-scrollbar__view,
.re-table--empty.re-table--fixed-height .el-table__body-wrapper .el-table__empty-block {
  min-height: 0;
  height: 100%;
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
/* 拖拽兜底 / 拖影 / 选中态样式。
   ⚠ 这里只服务 element 引擎。element 引擎仍走 Sortable：
       handle .drag-handle  / ghost .drag-sort-ghost   / chosen .drag-sort-chosen
       fallback .drag-sort-fallback
   vxe 引擎已改用 vxe 4.8+ 内置行拖拽（rowConfig.drag），它自己渲染拖动引导线与提示，
   并在行上打 row--drag-move / row--drag-origin 两个类，**不再产生** Sortable 那套
   vxe-drag-ghost / vxe-drag-chosen / vxe-drag-fallback 类，故这些选择器已删除。 */
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
.drag-sort-chosen {
  background: var(--el-color-primary-light-9) !important;
}
/* 拖拽模式下禁止表格文字被选中。
   :has() 的参数分引擎：element 手柄是 .drag-handle，vxe 手柄是 .vxe-drag-handle。 */
.re-table:has(.drag-handle) .el-table__body,
.re-table:has(.drag-handle) .el-table__body td .cell,
.re-table:has(.vxe-drag-handle) .vxe-table--body,
.re-table:has(.vxe-drag-handle) .vxe-body--column .vxe-cell {
  user-select: none !important;
  -webkit-user-select: none !important;
}
.drag-handle:active,
.vxe-drag-handle:active {
  cursor: grabbing;
}
/* ============ 滚动条：对齐 element 引擎的「悬停才显形」 ============
   element 引擎的表格走 el-scrollbar（自绘浮层条），鼠标离开表格就把滚动条藏掉、
   重新移入再淡回来。vxe 4.6 **没有自绘滚动条组件** —— 它的样式表里
   ::-webkit-scrollbar 规则为 0 条，用的是浏览器原生滚动条，而原生条是常驻的，
   两个引擎手感不一致。这里把原生条改造成同款：默认 thumb / track 全透明
   （只占位、不显形），鼠标进入 .re-table 才把 thumb 显出来。
   尺寸与颜色对齐 element 的 .el-scrollbar__thumb：6px 粗、radius 4px、
   颜色取 --el-text-color-secondary、常态 30% 透明度、thumb 自身 hover 时 50%。
   ⚠ 仅 Chromium 生效：::-webkit-scrollbar 是 Blink / WebKit 私有属性；
     Firefox 只有 scrollbar-width / scrollbar-color，没有「悬停态」可用。
     本项目跑在 Chromium（Electron / Chrome），可接受。
   ⚠ 不用 opacity 控制显隐：部分 Chromium 版本对滚动条伪元素上的 opacity
     不生效（会导致"永远是 0、滚动条彻底看不见"），一律用带 alpha 的
     background-color，这是各版本都稳的写法。 */
.re-table .vxe-table--body-wrapper::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.re-table .vxe-table--body-wrapper::-webkit-scrollbar-track,
.re-table .vxe-table--body-wrapper::-webkit-scrollbar-corner {
  background: transparent;
}
.re-table .vxe-table--body-wrapper::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 4px;
}
.re-table:hover .vxe-table--body-wrapper::-webkit-scrollbar-thumb {
  background-color: color-mix(in srgb, var(--el-text-color-secondary) 30%, transparent);
}
.re-table .vxe-table--body-wrapper::-webkit-scrollbar-thumb:hover {
  background-color: color-mix(in srgb, var(--el-text-color-secondary) 50%, transparent);
}

/* 尊重系统「减少动态效果」偏好：本组件的过渡统一降级为瞬时切换。
   仓库内各 Re 组件都各自内联这一块（组件可独立分发，不依赖页面集中代管）；
   悬停反馈本身保留 —— 只是不再有过渡动画。 */
@media (prefers-reduced-motion: reduce) {
  .re-table,
  .re-table--separated > .re-table__search,
  .re-table__layout-switch-item {
    transition: none;
  }
}
</style>
