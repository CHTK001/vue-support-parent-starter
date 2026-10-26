<script setup lang="ts">
/**
 * ReTable —— 表格组件
 *
 * 配置入口有两种形态，**并存且分组优先**：
 *   - 旧：一堆平行 props（pageSize / toolbarConfig / search / showSelection …）
 *   - 新：`config` 分组（pagination / toolbar / search / selection）
 *   说明与迁移对照见 `docs/frontend/re-table.md`；活示例见验收台
 *   `pages/monitor/src/views/ReTableLab.vue`（路由 /re-table-lab，新旧写法各一张表）。
 *
 * 两种数据源（只用这两个，url 形态已移除），语义已原子化：
 *   1) 本地数组：:data="[...]" —— 前端分页，组件按 page / pageSize 切片，total 取数组长度。
 *      data 只收数组，传函数是类型错误（远程请用 loader）。
 *   2) 远程加载：:loader="fetchUsers" —— 后端分页，组件只发 page / pageSize + :params，
 *      条数与 total 由接口给。是否远程只取决于「loader 是否为函数」。
 *
 * params：两种模式都支持，自定义键值随便加，但 page / pageSize 必定由组件注入且以组件为准
 *   （页面自己往 params 里塞 page/pageSize 无效，见 internalParamsKey 的说明）。
 *
 * 暴露方法：
 *   - reload()  重新加载（带 resetPage 选项）
 *   - goto(p?, s?)  跳转页 / 每页条数（参数缺省保持原值）
 *   - resetColumns()  重置列配置（清除持久化）
 *   - clearCache()  清空本表全部列表结果缓存条目
 *   - clearAllSelection()  清空所有选中行
 *   - toggleBatchSelect()  切换批量选择模式
 *   - getSelectedRows()  获取所有选中行
 *
 * 工具栏（分页上方右侧）：
 *   - 刷新：触发 reload()
 *   - 自动刷新（传 autoRefresh 才出现）：ReSwitch(popover) 布局，工具栏一枚纯 ReButton(square) 入口，
 *     点开是按参考图排版的浮层：标题「自动刷新频率」+ 状态徽标，ReSelect 竖向档位菜单
 *     （主标题 + 副说明两行，含「不自动刷新」一档 = 关闭），底部分隔线 + 下次刷新倒计时
 *     （showCountdown 属性可关，默认开）；档位即状态（选中即生效并收起浮层），
 *     定时器随组件卸载 / keep-alive 失活停止
 *   - 列设置：popover 中可搜索 / 排序 / 隐藏 / 显示
 *   - 表格设置：popover 中切换斑马纹 / 边框 / 紧凑 / 高亮当前行 / 十字高亮 / 可调整列宽
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
 * 表格增强（两套引擎语义一致，序号 / 表尾 / 展开列均不属于 columns，不参与列设置与持久化）：
 *   - showIndex：最左侧序号列，indexLabel / indexWidth / indexAlign / indexFixed 可配；
 *     indexContinuous（默认 true）控制是否跨页连续编号
 *   - showSummary + summaryMethod：表尾合计行；summaryMethod 缺省时按数值列求和
 *   - spanMethod：单元格行 / 列合并，回调拿到 ReTableColumn 与 visibleColumns 下标
 *   - expandable + #expand 插槽：展开行（vxe 走 #content，element 走 type=expand 默认插槽）
 *   - editable + v-model:edit-cache：单元格编辑（列 editable:true 即渲染输入控件）。
 *     保存可选：传 editSaveHandler 走回调，否则 saveEdits() 只 emit edit-save 把改动行交给页面
 *     —— 批量保存函数不是必填项
 *   - columnDraggable：表头拖拽调整列顺序（与列设置面板共用同一份持久化 order）
 *
 * 引擎专属能力（element 无等价物，element 下忽略并在 dev 提示）：
 *   - virtualScroll：vxe 纵向虚拟滚动，需配合 layout-table 的 height / maxHeight
 *   - areaSelect / areaClip：vxe 单元格区域选择与复制 / 粘贴 / 剪切
 *   - paginationMode="scroll"：滚动分页（基于 vxe 内置 scroll-boundary 触底事件，
 *     触底自动追加下一批；本地数据按 pageSize 逐步放出、远程 loader 按页追加）。
 *     paginationModeSwitch 打开后工具条出现「分页 / 滚动」切换器，选择随 tableId 持久化；
 *     前提是表格有内部纵向滚动（fill / height / maxHeight），状态条保留点击兜底
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
import { Menu, Delete, Edit, Check, Select, Search, ArrowUp, ArrowDown, View, Grid, Rank } from "@element-plus/icons-vue";
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
// 列表结果缓存：TTL 走 @repo/utils 的 StorageWrapper（set 第三参即过期毫秒数），
// key 前缀走 @repo/config 的 getStorageKey —— 与 columnStorage 同一套应用前缀约定
import { getStorageKey } from "@repo/config";
import { createStorage, browserLocalStorage, browserSessionStorage, yieldToMain, type StorageWrapper } from "@repo/utils";
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
/**
 * vxe-table 的表头/单元格 tooltip 在 setup 时通过
 * {@code VxeUI.getComponent("VxeTooltip")} 从全局注册表取组件，
 * 取不到则静默不渲染（tooltip 功能整体失效，控制台仅 errLog）。
 * vxe-pc-ui 的 tooltip 模块（{@code es/tooltip/index.js}）在
 * import 时自注册进该注册表；但纯具名导入的绑定若未被使用，
 * 会被 esbuild 的 TS 未用导入消除规则整条剥掉（注册副作用
 * 随之消失——实测 tooltip 依旧不渲染），故这里显式调用注册，
 * 两个绑定均被使用，导入稳定存活。
 */
import { VxeUI } from "@vxe-ui/core";
import { VxeTooltip } from "vxe-pc-ui";

VxeUI.component(VxeTooltip);
import type {
  ReCardLayoutProps,
  ReViewLayoutProps,
  EditOptionValue,
  RePageResult,
  RePaginationMode,
  ReTableColumn,
  ReTableColumnState,
  ReTableCacheStorage,
  ReTableFullState,
  ReTableLayout,
  ReTableSwitchLayout,
  ReTableLoader,
  ReTableLoadParams,
  ReTableSettings,
  ReTableToolbarConfig,
  ReTableToolbarButton,
  ReTableSearchConfig,
  ReTableAutoRefresh,
  ReTableContextMenuItem,
  ReTableContextMenuContext,
  ReTableContextMenuProvider,
  ReTableCellClickPayload,
  ReTableSortChangePayload,
  ReTableRowSortPayload,
  ReTableTreeProps,
  ReTableGroupedConfig,
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

/**
 * 每页条数默认上限。
 *
 * <p>放在 props 之前定义：props 的默认值里要引用它（{@code maxPageSize}），
 * 声明在使用之后会触发 TDZ（访问未初始化的 const）。</p>
 *
 * <p>取 500 而不是 200：默认档位里就有 500，若上限还是 200，{@link pageSizeOptions}
 * 会把这个档位过滤掉 —— 表现为「文档说支持 500，界面上却选不到」。
 * 上限的作用是防止有人传一个荒唐的值（比如一整页几万行），不是去砍默认档位。</p>
 */
const DEFAULT_MAX_PAGE_SIZE = 500;

const props = withDefaults(
  defineProps<{
    /**
     * 行数据（**只收数组** = 前端分页）。
     *
     * <p>组件按 page / pageSize 切片，total 取数组长度（或被 {@link total} 覆盖）。</p>
     *
     * <p><b>不接收函数</b>：远程加载请用 {@link loader}。给本项传函数是类型错误 ——
     * 运行时若检测到会 dev 警告并忽略，表格按空数组渲染（不会偷偷变成远程请求）。</p>
     */
    data?: Array<Record<string, unknown>>;
    /**
     * 远程加载器（后端分页），签名见 types.ts 的 {@link ReTableLoader}。
     *
     * <p><b>是否远程模式只取决于本项</b>：传了函数即远程，data 忽略；
     * 不传即本地（走 {@link data} 数组 + 前端分页）。两者职责互斥、不再互相探测。</p>
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
     * <p><b>本地数组（前端分页）下本项完全无效</b>：没有加载器可消费它，
     * 消费 {@link internalParamsKey} 的那个 watch 在非远程（{@code !loader}）时第一行就返回，
     * 所以改 params 既不触发重载、也不会回到第 1 页 —— 数组就是唯一数据源，
     * 筛选 / 排序需要页面在传给 {@code data} 之前自己做完。</p>
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
    /**
     * 每页条数上限（默认 500）。
     *
     * <p>超出上限的档位会被剔除、传入的值会被钳制 —— 目的是防止有人把「一整页」
     * 设成几万行把 DOM 撑爆。默认档位本身含 500，所以上限也用 500：
     * 若上限写 200，500 这一档会被过滤掉，界面上就选不到它了。</p>
     */
    maxPageSize?: number;
    /**
     * 分页方式："pager"（默认）= 页码 + 每页条数菜单；"scroll" = 滚动分页：
     * 隐藏分页菜单，表格滚到底部自动追加下一批（本地数据按 pageSize 逐步放出，
     * 远程 loader 按页取数追加）。
     *
     * <p><b>vxe 引擎专属</b>：element 引擎没有等价的触底事件，传 "scroll" 时
     * 回落为页码分页并在 dev 下提示。</p>
     *
     * <p><b>前提</b>：表格要有内部纵向滚动（fill 模式 / layout-table 的 height /
     * maxHeight），页面滚动条触底不会触发；分页行保留「点击加载更多」兜底。</p>
     */
    paginationMode?: RePaginationMode;
    /**
     * 是否在工具条渲染「分页 / 滚动」切换器（默认 false，页面显式开启）。
     *
     * <p>与 {@link layoutSwitch} 同一档设计：不是所有页面都适合滚动分页
     * （数据量小、需要页码跳转的场景），入口由页面决定，不由组件替它决定。</p>
     */
    paginationModeSwitch?: boolean;
    /**
     * 用户切换的分页方式是否跨会话持久化（写 localStorage，默认 true）。
     *
     * <p>与 {@link layoutPersist} 同一语义：false 时 {@code paginationMode} 永远优先，
     * 适合业务上固定要某种分页方式的页面。</p>
     */
    paginationModePersist?: boolean;
    /** 远程模式：自动随 params / page / pageSize 重新加载 */
    autoReload?: boolean;
    /**
     * 分组配置（新 API）。
     *
     * <p>把 40+ 个平行 props 按功能收成对象。**分组值优先于同名顶层 prop**，
     * 没写的字段继续读旧 props —— 于是可以逐页迁移，旧页面零改动。</p>
     *
     * <p>目前已接管：{@code pagination}（页码 / 每页条数 / 分页方式 / 自动重载 / 记住页码）。</p>
     */
    config?: ReTableGroupedConfig;
    /** 表格唯一标识；传入后列配置（顺序 / 隐藏）会持久化 */
    tableId?: string;
    /** 自定义 storage（默认 localStorage），可通过 app.provide 注入全局 */
    storage?: ReTableColumnStorage;
    /** 是否显示工具栏（刷新 / 列设置 / 表格设置） */
    toolbar?: boolean;
    /** toolbar 配置（批量删除/选择/修改等），toolbar=true 时生效 */
    toolbarConfig?: ReTableToolbarConfig;
    /** 右键菜单（数组或按右键上下文动态生成的函数）；行/单元格右键自动弹菜单 */
    contextMenu?: ReTableContextMenuProvider;
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
     * <p>{@code "vxe"}（默认）= vxe-table；{@code "element"} = element-plus 的 el-table。
     * 两者对外能力（列、插槽、事件、批量操作、行拖拽）完全一致，切换只换渲染引擎，
     * 业务页面不需要改代码。</p>
     *
     * <p>2026-10-07 起默认改为 vxe（需求：ReTable 默认 vxe）：vxe 自带固定表头 /
     * 大数据量虚拟滚动，DOM 稳定且两套选择器 class 完全不相交。注意 element 引擎是
     * 兼容回退：页面里 {@code :deep(.el-table …)} 这类内部覆盖、以及依赖 el-table
     * 内部结构的脚本（读 {@code store.states.data}）只在 {@code engine="element"}
     * 下成立；vxe 下这些选择器自然落空（vxe 自带完整样式）。</p>
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
    /**
     * 表格布局是否显示序号列（默认 false）。
     *
     * <p>只在表格布局生效；视图 / 卡片布局各自的序号由对应布局的属性控制。
     * 序号列不属于 {@code columns}，不参与列设置的显隐 / 排序 / 持久化。</p>
     */
    showIndex?: boolean;
    /** 序号列表头文案（默认 "#"） */
    indexLabel?: string;
    /** 序号列宽度（默认 60） */
    indexWidth?: string | number;
    /** 序号列对齐（默认 center） */
    indexAlign?: "left" | "center" | "right";
    /** 序号列固定（true 等价 left；默认 false） */
    indexFixed?: boolean | "left" | "right";
    /**
     * 序号是否跨页连续（默认 true）。
     *
     * <p>true 时第 N 页从 {@code (N-1) * pageSize + 1} 起编号，两套引擎一致；
     * false 时每页都从 1 开始。</p>
     */
    indexContinuous?: boolean;
    /**
     * 是否显示表尾合计行（默认 false）。
     *
     * <p>两套引擎共用同一套语义：单元格取值由 {@link summaryMethod} 给出；
     * 未传时按数值列求和（无法解析为数字的列留空）。刻意不走 element-plus 的
     * 默认实现，避免两引擎表现分叉。</p>
     */
    showSummary?: boolean;
    /**
     * 表尾合计取值方法。返回数组按 {@code visibleColumns} 顺序逐列给值。
     *
     * @param params.columns 当前可见列（已应用显隐 / 顺序）
     * @param params.data 当前页数据
     * @returns 每个可见列一格的值；缺省项按空串处理
     */
    summaryMethod?: (params: {
      columns: ReTableColumn[];
      data: Array<Record<string, unknown>>;
    }) => Array<string | number>;
    /**
     * 单元格合并规则（行 / 列合并，两套引擎共用）。
     *
     * @param params.row 当前行数据
     * @param params.rowIndex 当前行在当前页数据中的下标（从 0 起）
     * @param params.column 匹配到的列定义（前置的选择 / 序号 / 展开列不回调）
     * @param params.columnIndex 该列在 {@code visibleColumns} 中的下标（从 0 起）
     * @param params.cellValue 单元格原始值
     * @returns {@code [rowspan, colspan]} 或 {@code {rowspan, colspan}}；返回空表示不合并
     */
    spanMethod?: (params: {
      row: Record<string, unknown>;
      rowIndex: number;
      column: ReTableColumn;
      columnIndex: number;
      cellValue: unknown;
    }) => [number, number] | { rowspan: number; colspan: number } | undefined | void;
    /**
     * 是否启用展开行（默认 false），配合 {@code #expand} 插槽渲染展开内容。
     *
     * <p>两套引擎都在最左侧渲染一个展开图标列：element 用 {@code type="expand"} 列，
     * vxe 用 {@code type="expand"} + {@code #content} 插槽。展开列不属于
     * {@code columns}，不参与列设置与持久化。</p>
     */
    expandable?: boolean;
    /** 展开列宽度（默认 48） */
    expandWidth?: string | number;
    /**
     * 是否开启纵向虚拟滚动（**仅 vxe 引擎生效**）。
     *
     * <p>虚拟滚动必须有确定高度：配合 {@code layout-table} 的 {@code height} / {@code maxHeight}
     * 使用。适合 {@code :pagination="false"} 的大数据静态列表（此时组件渲染全量行），
     * 或较大的 {@code pageSize}。开启后行高由 vxe 统一固定，不再支持动态行高。</p>
     *
     * <p>element 引擎没有等价能力：开启后忽略，并在 dev 下提示。</p>
     */
    virtualScroll?: boolean;
    /** 虚拟滚动阈值：数据量超过该值才启用（默认 0 = 总是启用） */
    virtualScrollGt?: number;
    /**
     * 是否开启单元格区域选择（**仅 vxe 引擎生效**）：鼠标拖拽框选区域，按住 Ctrl 多选。
     * element 引擎没有等价能力：开启后忽略，并在 dev 下提示。
     */
    areaSelect?: boolean;
    /** 区域选择时是否允许复制 / 粘贴 / 剪切（仅 vxe，默认 true） */
    areaClip?: boolean;
    /**
     * 是否允许拖拽表头调整列顺序（两套引擎）。
     *
     * <p>顺序变更会写入本组件既有的列持久化状态（与列设置面板共用同一份 order），
     * 因此隐藏列 / 列显隐配置不会被破坏。</p>
     */
    columnDraggable?: boolean;
    /**
     * 是否可编辑单元格（默认 false）。
     *
     * <p>开启后，列定义里 {@code editable: true} 的列直接渲染输入控件（文本 / 数字 / 下拉 / 日期），
     * 无需再通过工具栏的「批量修改」按钮进入编辑态。编辑值默认缓存在组件内部，
     * 可用 {@code v-model:edit-cache} 取出，或监听 {@code edit-change} / {@code edit-save}。</p>
     */
    editable?: boolean;
    /**
     * 表头单元格是否显示溢出提示（默认 false）。
     *
     * <p>element 引擎走 `#header` 插槽 + CSS 省略（`.re-table__header-ellipsis`），
     * 提示由自定义渲染的 `title` 属性承载；vxe 引擎走全局 `show-header-overflow="tooltip"`，
     * 子列不再逐个挂 `show-overflow`（否则子列设置会覆盖全局档）。
     * 打开后列名被截断也悬停可见全称 —— 长列名不再只能靠拖宽猜。</p>
     */
    headerShowOverflowTooltip?: boolean;
    /**
     * 编辑值缓存（{@code v-model:edit-cache}）。
     *
     * <p>结构为 {@code { [rowKey]: { [prop]: value } }}。不传时组件内部维护；
     * 传入时由父组件持有，组件只发 {@code update:edit-cache} 不改父值。</p>
     */
    editCache?: Record<string, Record<string, unknown>>;
    /**
     * 编辑保存处理器（可选）。
     *
     * <p>不传也能用：点击内置的保存入口 / 调用暴露的 {@code saveEdits()} 时，
     * 组件只 emit {@code edit-save} 把改动行交给页面，由页面自行提交。
     * 也就是说**批量保存函数不是必填项**。</p>
     *
     * @param rows 有编辑改动的行（已合并缓存值，按当前可见列过滤）
     */
    editSaveHandler?: (rows: Array<Record<string, unknown>>) => Promise<void> | void;
    /** 是否显示搜索开关按钮（切换内置搜索区显示） */
    showSearch?: boolean;
    /** 搜索区是否显示（v-model 支持） */
    searchVisible?: boolean;
    /** 是否显示搜索区右上角的展开/收起切换按钮 */
    showSearchToggle?: boolean;
    showSearchTitle?: boolean;
    showSelection?: boolean;
    /**
     * 常驻勾选列（{@link showSelection} 的别名）。
     *
     * <p>页面上一直有人写 `:selection="true"`，但组件此前没声明这个 prop：
     * 因为 {@code inheritAttrs: true} 且没有 `$attrs` 透传，它会变成一个落在根 div 上的
     * 无效 HTML 属性 —— 看起来在用、实际什么都没发生。这里显式支持，避免继续踩。</p>
     */
    selection?: boolean;
    /**
     * 表格尺寸：{@code "small"} 等价于「紧凑模式」，其余按默认。
     *
     * <p>同样是被静默忽略的历史属性：全仓 15 处 {@code size="small"} 此前全无效。
     * 只有 default / small 两档（与 el-table 一致）。</p>
     *
     * <p>mini 是本组件新增的第三档（比 small 更紧凑）：element 引擎下 el-table 本身
     * 只有 large/default/small，mini 通过 {@code .re-table--mini} 的 CSS 把表头/行
     * 内边距进一步压薄实现；vxe 引擎原生的 medium/small/mini 直接透传。<p>
     */
    size?: "large" | "default" | "small" | "mini";
    /**
     * 紧凑模式（等价于 {@code size="small"}：行高 51px → 33~36px）。
     *
     * <p>与上面的 {@code size} / 下面的 {@code border} 同属「被静默忽略的历史属性」：
     * 裸写 {@code compact} 此前只落成一个普通 HTML 属性，密度实际只由设置面板的
     * {@code settings.compact} 决定，页面以为压过行高、实际一直是默认 51px。
     * 这里显式接收，写法与设置面板开关保持一致；两者同时给出时 {@code settings.compact} 优先。</p>
     */
    compact?: boolean;
    /**
     * 是否显示表格外边框（默认 true）。
     *
     * <p>页面上有 60 处裸写 {@code border}，此前同样无效（边框实际由
     * settings.border 默认值决定）。现在显式接收：`:border="false"` 能真正关掉边框。</p>
     */
    border?: boolean;
    /** 内置 ReSearch 搜索区（true=默认配置；传对象可配 filters/title/btnMode 等） */
    search?: boolean | ReTableSearchConfig;
    /** 搜索区与表格的间距（px），0 时搜索与表格连为一体 */
    searchGap?: number;
    /** 搜索值（v-model:search-model，内置 ReSearch filters 模式下双向绑定） */
    searchModel?: Record<string, unknown>;
    /** 内置自动刷新：工具栏纯图标入口 + 浮层选间隔，轮询定时器由表格持有（不传则无该能力） */
    autoRefresh?: ReTableAutoRefresh;
    /**
     * 列表结果缓存（默认 false，仅远程模式生效）。
     *
     * <p>开启后，同一「查询条件 + 页码 + 每页条数」在 {@link cacheTtl} 内再次出现时
     * 直接命中存档、不再请求 {@link loader}。典型场景是「列表页 → 详情页 → 返回」：
     * 返回时同一页的数据还在，省掉一次请求与一次 loading 闪烁。</p>
     *
     * <p><b>命中与正常取数行为完全一致</b>：{@code load} / {@code update:total} 照常触发，
     * 行数据与 total 都来自存档 —— 监听 {@code @load} 做汇总的页面无需任何改动。</p>
     *
     * <p><b>显式刷新必定绕过缓存</b>：{@code reload()}（工具栏刷新、批量删除后）、
     * {@code goto()} 与自动刷新轮询都强制走网络，拿到响应后<b>顺手写回存档</b> ——
     * 一次刷新同时完成「取新数据 + 更新缓存」。翻页 / 改查询条件 / 滚动追加则正常命中。</p>
     *
     * <p><b>前提</b>：能定位到命名空间 —— 即传了 {@link tableId}，或当前处于路由环境
     * （缺省用路由 path）。两者都没有时缓存不生效，dev 下告警一次。</p>
     *
     * <p><b>注意</b>：存档是 loader 原始返回的 JSON 快照，Date 等非 JSON 类型会
     * 退化成字符串；需要强新鲜度时用 {@link cacheTtl} 收紧有效期，
     * 或在增删改后调 {@code clearCache()}。</p>
     */
    cache?: boolean;
    /**
     * 缓存有效期（毫秒），默认 300000（5 分钟）。
     *
     * <p>从写入时刻起算，到期条目在下次读取时自动清除。传 0 表示不过期 ——
     * 只适合「这份数据几乎不变」的表。</p>
     */
    cacheTtl?: number;
    /**
     * 缓存命名空间；缺省用 {@link tableId}，再无则用当前路由 path。
     *
     * <p>同一路由上放多张表（各自独立的数据源）时必须用它区分，否则两份缓存
     * 会共用同一批条目、互相覆盖成对方的数据。切换 loader 实现（换接口 /
     * 改返回结构）时也建议同步换一个值，避免命中上一个接口留下的存档。</p>
     */
    cacheKey?: string;
    /**
     * 缓存载体：session（默认，关标签页即失效）/ local（跨会话保留）。
     *
     * <p>列表数据通常不需要跨会话，故默认 session —— 至少不会在第二天打开时
     * 先闪一屏昨天的旧数据。传 local 适合「希望刷新页面后仍能秒开」的页面，
     * 此时务必配一个不太长的 {@link cacheTtl}。</p>
     */
    cacheStorage?: ReTableCacheStorage;
  }>(),
  {
    data: () => [],
    loader: undefined,
    params: () => ({}),
    columns: () => [],
    loading: false,
    settings: () => ({}),
    rowKey: "id",
    engine: "vxe",
    emptyText: "暂无数据",
    pagination: true,
    total: 0,
    page: 1,
    pageSize: 50,
    pageSizes: () => [10, 20, 50, 100, 200, 500],
    maxPageSize: DEFAULT_MAX_PAGE_SIZE,
    paginationMode: "pager",
    paginationModeSwitch: false,
    paginationModePersist: true,
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
    showIndex: false,
    indexLabel: "#",
    indexWidth: 60,
    indexAlign: "center",
    indexFixed: false,
    indexContinuous: true,
    showSummary: false,
    expandable: false,
    expandWidth: 48,
    virtualScroll: false,
    virtualScrollGt: 0,
    areaSelect: false,
    areaClip: true,
    columnDraggable: false,
    editable: false,
    headerShowOverflowTooltip: false,
    showSearch: false,
    searchVisible: undefined,
    showSearchToggle: true,
    showSearchTitle: true,
    showSelection: false,
    // 别名与尺寸 / 边框：默认 undefined，便于区分「没传」与「显式传 false」
    selection: undefined,
    size: undefined,
    border: undefined,
    search: false,
    searchGap: 16,
    searchModel: undefined,
    cache: false,
    cacheTtl: 300000,
    cacheKey: "",
    cacheStorage: "session",
  },
);

const emit = defineEmits<{
  (e: "update:page", page: number): void;
  (e: "update:pageSize", size: number): void;
  (e: "update:total", total: number): void;
  (e: "update:paginationMode", mode: RePaginationMode): void;
  /**
   * 滚动分页每追加一批后触发（首批走 load 事件，不在这里重复）。
   * records 是本批新增行，total 是接口最新总数。
   */
  (e: "load-more", payload: { page: number; records: Array<Record<string, unknown>>; total: number }): void;
  (e: "update:settings", settings: ReTableSettings): void;
  (e: "row-click", row: Record<string, unknown>): void;
  (e: "cell-click", payload: ReTableCellClickPayload): void;
  (e: "header-contextmenu", payload: { columnProp?: string; columnLabel?: string; column: unknown; event: PointerEvent }): void;
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
  (e: "update:editCache", value: Record<string, Record<string, unknown>>): void;
  (e: "edit-change", payload: { row: Record<string, unknown>; prop: string; value: unknown }): void;
  (e: "edit-save", rows: Array<Record<string, unknown>>): void;
  (e: "column-order-change", order: string[]): void;
}>();

/**
 * 分页组的解析结果（新 API `config.pagination` 与旧顶层 props 的合并视图）。
 *
 * <p>优先级：分组值 > 同名顶层 prop > 内置默认值。内部所有分页相关读取统一走这里，
 * 所以「分组 API」不需要改任何页面就能生效，也给后续把更多组收进来留了位置。</p>
 *
 * <p>{@code remember} 是分组独有的字段，最终落到表格设置里的 settings.pageCache，
 * 与设置面板里的「记住页码」是同一个开关。</p>
 */
const paginationCfg = computed(() => {
  const g = props.config?.pagination;
  return {
    enable: g?.enable ?? props.pagination,
    page: g?.page ?? props.page,
    pageSize: g?.pageSize ?? props.pageSize,
    pageSizes: g?.pageSizes ?? props.pageSizes,
    mode: g?.mode ?? props.paginationMode,
    modeSwitch: g?.modeSwitch ?? props.paginationModeSwitch,
    modePersist: g?.modePersist ?? props.paginationModePersist,
    autoReload: g?.autoReload ?? props.autoReload,
    remember: g?.remember,
  };
});


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

/** 默认每页条数（paginationCfg.value.pageSize 未传时的兜底，与 props 默认值保持一致） */
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
/**
 * 每页条数上限。
 *
 * <p>取值 200 的依据：常见业务表格一屏最多几十行；200 行 DOM 已经偏重，
 * 但仍在可接受区间；超过这个量级的场景正确做法是**服务端分页 + 收窄查询条件**，
 * 而不是把整页塞进 DOM。</p>
 *
 * <p>超出时钳制到上限并在 dev 下警告 —— 不静默吞掉：调用方多半是配置写错了，
 * 静默改掉只会让「我明明传了 1000」的困惑留在原地。</p>
 *
 * <p><b>可被 props.maxPageSize 覆盖</b>：用量的明细表需要 10/200/500 三档，
 * 500 行在 vxe 的虚拟滚动下依然流畅（只渲染可视区），所以硬编码 200 会把
 * 「500 条/页」这个档位悄悄钳掉 —— 用户选了却没生效，比不提供更糟。</p>
 */
const MAX_PAGE_SIZE = computed<number>(() => {
  const n = Math.floor(Number(props.maxPageSize));
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_PAGE_SIZE;
});

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
  if (n <= MAX_PAGE_SIZE.value) return n;
  if (import.meta.env.DEV) {
    console.warn(
      `[ReTable] ${source} 的每页条数 ${n} 超过上限 ${MAX_PAGE_SIZE.value}，已钳制为 ${MAX_PAGE_SIZE.value}。` +
        `大数据量请用服务端分页收窄查询，不要把整页塞进 DOM。`,
    );
  }
  return MAX_PAGE_SIZE.value;
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
  const sizes = Array.isArray(paginationCfg.value.pageSizes) ? paginationCfg.value.pageSizes : [];
  return sizes.length === 0 || sizes.includes(size);
}

/**
 * 分页器上「每页条数」下拉的档位。
 *
 * <p>paginationCfg.value.pageSizes 未传时用组件默认档（20/50/100）；做了去重与过滤，
 * 避免调用方给出重复值或非正数时下拉里出现两个一样的项或 0 条/页。
 * 超过 {@link MAX_PAGE_SIZE} 的档位直接剔除 —— 下拉里摆一个必然被钳制的选项，
 * 用户选了却没生效，是比不提供更糟的体验。</p>
 */
const pageSizeOptions = computed<number[]>(() => {
  const raw = Array.isArray(paginationCfg.value.pageSizes) ? paginationCfg.value.pageSizes : [];
  const seen = new Set<number>();
  for (const size of raw) {
    const value = Math.floor(Number(size));
    if (Number.isFinite(value) && value > 0 && value <= MAX_PAGE_SIZE.value) {
      seen.add(value);
    }
  }
  return [...seen];
});

/** 内部分页状态（与 props 同步，确保 reload 时读到最新值） */
const internalPage = ref(paginationCfg.value.page ?? 1);
const internalPageSize = ref(clampPageSize(paginationCfg.value.pageSize ?? DEFAULT_PAGE_SIZE, "paginationCfg.value.page-size"));
// 强制响应式：用 shallowRef 或 triggerRef
import { triggerRef } from "vue";
watch(() => paginationCfg.value.page, (v) => { if (typeof v === "number") internalPage.value = v; });
watch(
  () => paginationCfg.value.pageSize,
  (v) => {
    if (typeof v === "number") internalPageSize.value = clampPageSize(v, "paginationCfg.value.page-size");
  },
);

/**
 * 当前生效的分页方式（"pager" 页码菜单 / "scroll" 滚动加载）。
 *
 * <p>声明在 pagedRows / buildRemoteSource / loadColumnState 之前：这三处在
 * setup 期间就可能读到它（useDataSource 的 immediate 首取会跑 buildRemoteSource、
 * loadColumnState 在 immediate watch 里恢复存档），放后面会撞 TDZ。</p>
 *
 * <p>取值来源两条：paginationCfg.value.mode（受控，缺省 pager）；存档恢复——
 * 仅当 {@code paginationModeSwitch} 开着（页面给了用户切换入口）且
 * {@code paginationModePersist !== false} 时，localStorage 里的历史选择优先于
 * props，尊重用户偏好（与 activeLayout 同一套语义）。</p>
 */
const activePaginationMode = ref<RePaginationMode>(
  paginationCfg.value.mode === "scroll" ? "scroll" : "pager",
);
/** paginationCfg.value.mode 变化时跟随（受控场景） */
watch(
  () => paginationCfg.value.mode,
  (val) => {
    activePaginationMode.value = val === "scroll" ? "scroll" : "pager";
  },
);

/**
 * 本次生效的每页条数（读取统一入口，已钳制）。
 *
 * <p>原本「internalPageSize → paginationCfg.value.pageSize → DEFAULT」这串兜底在
 * {@link pagedRows} 和 {@link buildRemoteSource} 里各写了一遍。两处都漏了上限：
 * 兜底分支会直接把未经钳制的 {@code paginationCfg.value.pageSize} 交给远程请求和本地切片 ——
 * 也就是「上限看起来在，内部状态也确实被钳了，但真正决定渲染行数/请求条数的那次读取
 * 绕过了它」，属于看起来有防护其实没有。</p>
 *
 * <p>收敛成这一个 computed 后：钳制只有一处、两个读取点不可能再分叉。
 * 正常路径下 {@code internalPageSize} 已被钳过，这里直接原样返回不会重复告警；
 * 只有兜底分支真的取到超限值时才会再警告一次，那正是需要看到的信号。</p>
 */
const currentPageSize = computed<number>(() =>
  clampPageSize(
    internalPageSize.value || paginationCfg.value.pageSize || DEFAULT_PAGE_SIZE,
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
  const cfg = mergedToolbarConfig.value?.batchDelete;
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
    // 保存成功即编辑会话结束：清草稿缓存（vxe 显示态是草稿优先，不清会一直显示已保存的旧草稿），
    // 并关掉可能仍激活的单元格（不清激活态的话编辑器里会显示回退后的行原值）
    clearEditCache();
    await closeVxeEdit();
  } finally {
    batchProcessing.value = false;
  }
}

/** 获取批量修改 handler */
function getBatchEditHandler() {
  const cfg = mergedToolbarConfig.value?.batchEdit;
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
/**
 * 搜索配置的来源：分组 {@code config.search} 优先于旧的 {@code search} prop。
 *
 * <p>对象形态里的 {@code enable: false} 归一成 {@code false}，这样「配置留着、开关关掉」
 * 不必把整个对象删掉。</p>
 */
const searchSource = computed<boolean | ReTableSearchConfig | undefined>(() => {
  const g = props.config?.search;
  if (g === undefined) return props.search;
  if (g === true || g === false) return g;
  return g.enable === false ? false : g;
});

/** 内置搜索区配置对象（布尔形态时为空对象） */
const searchConfig = computed<ReTableSearchConfig>(() => {
  const s = searchSource.value;
  return s && typeof s === "object" ? s : {};
});

/** 是否常驻勾选列：分组 config.selection.enable 优先于旧 showSelection prop */
const selectionEnabled = computed<boolean>(
  () => props.config?.selection?.enable ?? (props.showSelection || props.selection === true),
);
/**
 * 内置搜索是否真正可用。
 *
 * <p>判据不能只看 {@code search} 是否为真值：{@code :search="{}"}、{@code :search="true"}
 * 或 {@code filters} 为空的配置都会让 ReSearch 渲染出一个「只有标题、没有过滤项」的空壳 ——
 * 页面上凭空多出一条无意义的「搜索」卡片，工具栏还挂着一个点了什么也收不起来的搜索开关。
 * 因此这里以「有没有过滤项」为准：没有过滤项就等于没有搜索，与 ReSearch 自身
 * 「无过滤内容时不显示面板」的口径保持一致。</p>
 *
 * <p>{@code #search} 插槽形态不受本判断约束，由 {@link searchAreaVisible} 单独放行。</p>
 */
const searchEnabled = computed(() => {
  const s = searchSource.value;
  if (s !== true && (typeof s !== "object" || s === null)) {
    return false;
  }
  return (searchConfig.value.filters?.length ?? 0) > 0;
});
/** 搜索区是否渲染：内置搜索可用 或（showSearch 且有 #search 插槽） */
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
 * （{@code isRemote} 与 {@code paginationCfg.value.autoReload}），而
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
    const watchWillReload = isRemote.value && paginationCfg.value.autoReload && internalParamsKey.value !== keyBefore;
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
 * 解析后的右键菜单项。
 *
 * <p>{@code contextMenu} 传函数时按当前右键上下文动态生成；传数组时原样返回。
 * 行/单元格右键弹菜单与否、菜单内容都以它为准 —— 使用方传一个生成函数
 * 即可让不同行/列弹出不同菜单，无需自己维护弹窗状态。</p>
 */
const resolvedCtxMenuItems = computed<ReTableContextMenuItem[]>(() => {
  const provider = props.contextMenu;
  if (!provider) return [];
  const ctx = ctxMenuContext.value;
  return typeof provider === "function" ? (ctx ? provider(ctx) : []) : provider;
});

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
  const items = resolvedCtxMenuItems.value;
  if (!items || items.length === 0) return;
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
  const items = resolvedCtxMenuItems.value;
  if (!items || items.length === 0) return;
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

/**
 * 表头右键事件（element 引擎的 {@code onHeader-contextmenu}）。
 *
 * <p>把列信息与原生事件原样抛给宿主：要不要弹菜单、菜单里放什么由宿主决定
 * （表头右键一般是「排序 / 筛选 / 列设置」这类与行无关的动作，不塞进行级
 * contextMenu 配置）。不在这里 preventDefault，宿主要拦截自己拦。</p>
 */
function onHeaderContextMenu(
  column: TableColumnCtx<Record<string, unknown>>,
  event: PointerEvent,
): void {
  emit("header-contextmenu", {
    columnProp: column?.property || column?.prop,
    columnLabel: column?.label,
    column,
    event,
  });
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

/** ========== 行拖拽排序（两引擎共用状态 + element 专属实现） ==========
 * 删除 element 引擎支持时，本区块里这些**只服务 element**，可一并删除：
 *   · sortableInstance / sortableInitLock / sortedRows（Sortable 专用）
 *   · findDragTbody()（只给 Sortable 找 tbody）
 *   · initSortable() / destroySortable()（Sortable 建绑/解绑，含 onEnd 回读 DOM 顺序）
 * 保留（两引擎共用）：dragMode / dragChanged / originalRows / dragToggleLoading /
 *   toggleDragMode（内部按 useVxe 分叉）/ confirmDragSort / cancelDragSort。
 * element 侧的 Sortable 依赖 import { Sortable } from "sortablejs"，同删。 */
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
/** element 引擎的表格实例（兼容回退引擎；默认是 vxe）。只用到它的公开实例方法，不依赖内部结构。 */
const elTableRef = ref<TableInstanceHandle | null>(null);

/** 当前是否走 vxe 引擎 */
/**
 * 是否走 vxe 引擎。
 *
 * <p>vxe 的列只能来自 columns 属性（单元格走命名插槽）；仅用 &lt;ReTableColumn&gt; 插槽声明列的页面在
 * vxe 下拿不到任何列（表体渲染出行、行内没有单元格），因此 columns 为空时自动回退 element 引擎兜底，
 * 保证插槽式用法（采集/阅卷/数据配置等存量页面）不因默认引擎切换而白屏。</p>
 */
const useVxe = computed<boolean>(() => props.engine === "vxe" && !!props.columns?.length);

/* ==================== 滚动分页（paginationMode="scroll"） ==================== */
/*
 * 设计要点（为什么这样切状态）：
 *  - useDataSource 是**整页替换**语义（每次 resolve 都 data.value = next），
 *    追加的批次不能进 dataList，否则一次失败/刷新就把已加载的行全清掉；
 *    所以独立放 scrollAppendedRows，首批仍走 dataList，两条互不干扰。
 *  - reset 的锚点是「首批数据重新落地」（watch dataList）：翻页、换查询条件、
 *    刷新、切回页码模式，最终都会让 useDataSource 换一批新数据，一个 watch 全覆盖，
 *    不用在每个重载入口各写一遍清空（漏一处就是「新条件 + 旧行混排」）。
 *  - 竞态用代际号（scrollGeneration）：追加请求在飞时用户改了条件/切了模式，
 *    迟到的响应按代际丢弃，不污染新一轮的首批。useDataSource 内部的 seq
 *    守卫不了这条路径——追加根本不经过它。
 */

/** 滚动模式已加载到第几批（首批 = 1，即 dataList 那批） */
const scrollPage = ref(1);
/** 远程模式：第 2 批起追加的行（本地模式不用它，直接按 scrollPage * pageSize 放出） */
const scrollAppendedRows = ref<Array<Record<string, unknown>>>([]);
/** 远程模式：最近一批拉到的行数（total 缺失时用它判断「可能还有」） */
const scrollLastBatchCount = ref(0);
/** 服务端 total 不可信 / 不返回时的「到底」标记（拉到空批即置位） */
const scrollExhausted = ref(false);
/** 追加中标志：与 dataLoading 分开——追加不该闪全表 loading 遮罩 */
const scrollLoadingMore = ref(false);
/** 代际号：reset 时 +1，让在飞追加的响应作废 */
let scrollGeneration = 0;

/**
 * 触底提前量（px）：传给 vxe virtual-y-config.threshold。
 * vxe 源码用它算 isBottomBoundary（scrollTop + bodyHeight >= scrollHeight - threshold），
 * 提前 120px 触发，用户不用滚到像素级最底才等加载，体感更接近原生无限列表。
 * 只传 threshold 不传 enabled 不会启用虚拟滚动（源码 table.ts:4421 单独判断 enabled）。
 */
const SCROLL_BOUNDARY_THRESHOLD = 120;

/**
 * 批量勾选的分片大小：每勾这么多行就把主线程让回浏览器一帧。
 *
 * <p>见 {@link restoreSelection} 的说明：一页几百行时同步勾完会形成长任务，
 * 把刷新时的动画冻住。50 行一片是「每片够快、又不至于让用户等」的折中。</p>
 */
const SELECTION_CHUNK_SIZE = 50;

/**
 * 滚动分页是否生效。
 *
 * <p>三个条件都满足才生效：pagination 开着（它是「分页方式」的一种，不分页的表格
 * 本来就全量直出）、模式选了 scroll、vxe 引擎（element 没有触底事件，回落页码分页）。
 * useVxe 为 false 时 activePaginationMode 可能仍是 "scroll"，但本计算属性为 false，
 * 分页菜单照常渲染——这是刻意的优雅降级，不是状态不一致。</p>
 */
const isScrollPaging = computed<boolean>(
  () => paginationCfg.value.enable === true && activePaginationMode.value === "scroll" && useVxe.value,
);

/** 滚动模式下已加载的行数（本地 = 已放出的行数；远程 = 首批 + 追加） */
const scrollLoadedCount = computed<number>(() => {
  if (isRemote.value) {
    return (dataList.value?.length ?? 0) + scrollAppendedRows.value.length;
  }
  const size = currentPageSize.value;
  return Math.min(Math.max(1, scrollPage.value) * size, dataList.value?.length ?? 0);
});

/**
 * 还有没有下一批可加载。
 *
 * <p>远程模式优先信接口 total；total 没给（<=0）时退化为「上一批拉满了就认为可能还有」，
 * 拉到空批立即置 scrollExhausted 收口，不死循环。</p>
 */
const hasMoreInScroll = computed<boolean>(() => {
  if (!isScrollPaging.value || scrollExhausted.value) return false;
  if (isRemote.value) {
    if (remoteTotal.value > 0) return scrollLoadedCount.value < remoteTotal.value;
    const lastCount = scrollAppendedRows.value.length
      ? scrollLastBatchCount.value
      : (dataList.value?.length ?? 0);
    return lastCount >= currentPageSize.value;
  }
  return scrollLoadedCount.value < (dataList.value?.length ?? 0);
});

/** 滚动分页回到起点（重置 = 清追加 + 回第 1 批 + 作废在飞请求） */
function resetScrollPaging(): void {
  scrollGeneration++;
  scrollPage.value = 1;
  scrollAppendedRows.value = [];
  scrollLastBatchCount.value = 0;
  scrollExhausted.value = false;
  scrollLoadingMore.value = false;
}

/**
 * 分页方式切换的副作用收口（用户点切换器 / 受控改 props / 存档恢复，都走这里）。
 *
 * <p>进滚动模式固定从第 1 批开始：页码归 1（翻页 watcher 顺带 emit + 重新取数），
 * 否则「在页码模式翻到第 3 页再切滚动」会把第 3 页当首批、后续批次全错位。
 * 出滚动模式同样 reset——已追加的行属于滚动会话，页码模式不认。</p>
 *
 * <p>isRestoringState 时跳过：存档恢复本来就是要到的那个状态，重取一遍纯属浪费
 * （首批在 setup 期的 immediate 取数里已经按目标模式拉好了）。</p>
 */
watch(activePaginationMode, (val, old) => {
  if (val === old || isRestoringState) return;
  resetScrollPaging();
  if (val === "scroll" && internalPage.value !== 1) {
    internalPage.value = 1;
    emit("update:page", 1);
  } else if (isRemote.value && paginationCfg.value.autoReload) {
    nextTick(() => { void dsReload(); });
  }
  if (paginationCfg.value.modeSwitch === true && paginationCfg.value.modePersist !== false) {
    saveColumnState();
  }
});

/** element 引擎不支持滚动分页：开启只提示，不假装生效（与 virtualScroll 同一策略） */
watch(
  [() => paginationCfg.value.mode, useVxe],
  ([mode, vxe]) => {
    if (mode === "scroll" && !vxe && import.meta.env.DEV) {
      console.warn("[ReTable] 滚动分页仅 vxe 引擎支持（columns 属性声明列），当前为 element 引擎，已回落为页码分页。");
    }
  },
  { immediate: true },
);

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
/**
 * 清掉拖拽在行上留下的 {@code draggable}。
 *
 * <p>由 {@code onVxeDragHandleMousedown} 置位的 {@code <tr>} draggable，
 * 随后的复位走 vxe 的 {@code clearRowDropOrigin()} —— 但它<b>只对带
 * {@code row--drag-origin} 类的行生效</b>，拖拽被取消/中断时那行未必带该类，
 * 就会残留 {@code draggable=true}。残留的行体因此变成可拖，出现「能拖但不动」的
 * 幽灵拖影，每拖一行还多留一个。因此在拖拽结束与退出拖拽模式时都要自己收尾。</p>
 *
 * <p>只清 {@code <tr>}：vxe 自己推断出的那个「trEl」在本组件的 DOM 里其实是
 * {@code <td>}，已在 mousedown 里就地复位，不留残留（见 onVxeDragHandleMousedown
 * 的说明）。</p>
 */
function clearVxeRowDraggable(): void {
  const tableEl = currentTableEl();
  if (!tableEl) {
    return;
  }
  const rows = tableEl.querySelectorAll<HTMLElement>('tbody tr[draggable="true"]');
  rows.forEach((tr) => {
    tr.draggable = false;
  });
}

function onVxeRowDragEnd(): void {
  // 先复位行 draggable，再读顺序（见 clearVxeRowDraggable 的说明）
  clearVxeRowDraggable();
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

/**
 * vxe 引擎 · 自研拖拽手柄的 mousedown。
 *
 * <p>为什么不用 vxe 内置的 drag-sort 列：那列必须随 dragMode 增删，而 vxe 在列集合
 * 变化时会重建列集合并重算**全部**列宽 + 一次全量布局 —— 实测点一次开关冻结
 * 465~784ms（最大帧 482~807ms）；列数 10→7 时代价从 1138ms 降到 366ms，说明成正比。
 * 改把手柄内嵌进第一列单元格后，列集合恒定，开关只改单元格内容。</p>
 *
 * <p>但「发起拖拽」这件事必须交给 vxe 自己做，不能只复刻它的两步
 * （{@code reactData.dragRow = 行} + {@code tr.draggable = true}）。完整行为还包括：
 * {@code updateRowDropOrigin}（源行加 {@code row--drag-origin} 并变淡）、
 * {@code updateRowDropTipContent}（拖拽提示文案）、以及派发 {@code row-dragstart} 事件。
 * 只做两步的实测后果：拖拽时**源行没有变淡反馈**、{@code row-dragstart} 从不触发
 * （实测 DOM 上 {@code drag--origin} 类为空）。</p>
 *
 * <p>所以这里**直接委托 vxe 实例上的 {@code handleCellDragMousedownEvent}**。
 * 该方法是内部 API、不在公开文档里，但实测 {@code VxeTable} 组件的 {@code proxy} 与
 * {@code setupState} 都能取到；它对 {@code evnt.currentTarget} 的用法恰好与我们的手柄一致
 * （{@code trigger} 非 'cell'/'row' 时取 {@code currentTarget.parentElement.parentElement}
 * 作为 td，再上一级即 tr —— 我们的手柄是 span → cell 包裹 span → td，正好命中）。</p>
 *
 * <p>取不到时回退到最小实现（只保证能拖，牺牲变淡与 row-dragstart），
 * 这样 vxe 将来若改内部结构也不会直接失效。</p>
 *
 * <p><b>但委托之后必须自己把 {@code draggable} 补到真正的 {@code <tr>} 上。</b>
 * vxe 是靠 DOM 关系反推的：{@code rowDragConfig.trigger} 既不是 {@code 'cell'} 也不是
 * {@code 'row'}（用全局默认）时走 {@code tdEl = currentTarget.parentElement.parentElement}
 * 再 {@code trEl = tdEl.parentElement}。而我们的手柄是 {@code span}，外面还包着
 * {@code .vxe-cell--wrapper} 与 {@code .vxe-cell} 两层 div，实测反推结果是：</p>
 *
 * <pre>
 *   i=0 SPAN  re-table__row-drag-handle
 *   i=1 DIV   vxe-cell--wrapper
 *   i=2 DIV   vxe-cell          ← vxe 认作 tdEl
 *   i=3 TD    vxe-table--column ← vxe 的 trEl，draggable 被设到了这里
 *   i=4 TR    vxe-body--row     ← 真正挂 dragstart/dragover 的元素，从未 draggable
 * </pre>
 *
 * <p>后果是<b>只有合成事件才拖得动</b>：手工派发 {@code DragEvent} 不受「拖拽源必须
 * draggable」约束，所以看起来一切正常；而真实鼠标（Playwright {@code mouse.move/down/up}
 * 走浏览器真实输入管线）根本不会发起拖拽 —— 实测行序完全不变。所以这里按 DOM 关系自己
 * 取 {@code <tr>} 置位，让拖拽能力不再依赖 vxe 那套层数假设；同时把 vxe 误设到包装层
 * 与 {@code <td>} 上的 {@code draggable} 复位，否则 {@code <td draggable>} 会抢走单元格
 * 内选中文本时的浏览器原生拖拽。</p>
 */
function onVxeDragHandleMousedown(evt: MouseEvent, row: Record<string, unknown>): void {
  const inst = vxeTableRef.value as unknown as
    | {
        handleCellDragMousedownEvent?: (
          e: MouseEvent,
          params: { row: Record<string, unknown> },
        ) => void;
        reactData?: {
          dragRow?: unknown;
          isCrossDragRow?: boolean;
          dragCol?: unknown;
        };
      }
    | null;
  const delegate = inst?.handleCellDragMousedownEvent;
  if (inst && typeof delegate === "function") {
    const trEl = (evt.target as HTMLElement | null)?.closest?.("tr") ?? null;
    if (trEl) {
      trEl.draggable = true;
    }
    delegate.call(inst, evt, { row });
    let node = evt.currentTarget as HTMLElement | null;
    while (node && node !== trEl) {
      node.draggable = false;
      node = node.parentElement;
    }
    return;
  }
  // 回退路径：vxe 内部方法不可用时，手工完成最小必要两步
  const reactData = inst?.reactData;
  if (!reactData) {
    return;
  }
  evt.stopPropagation();
  const handleEl = evt.currentTarget as HTMLElement | null;
  const trEl = handleEl?.closest("tr") ?? null;
  if (trEl) {
    trEl.draggable = true;
  }
  reactData.dragRow = row;
  reactData.isCrossDragRow = false;
  reactData.dragCol = null;
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
      // 退出拖拽模式时复位自研手柄留下的行 draggable（见 clearVxeRowDraggable）
      clearVxeRowDraggable();
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
  // 复位自研手柄留下的行 draggable（见 clearVxeRowDraggable）
  clearVxeRowDraggable();
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
  clearVxeRowDraggable();
  dragChanged.value = false;
  originalRows.value = [];
  // 刷新表格恢复原始顺序
  setTimeout(()=>onBuiltinSearchRefresh(), 50);
}
/** ========== 缺陷6: 列宽调整 ========== */
/** resizable 设置 → 列宽拖拽 */
const borderResizable = computed(() => (localSettings.value.resizable ?? true));

/** ========== inline edit 编辑值缓存 ========== */
/** 内部编辑缓存（父组件未传 v-model:edit-cache 时生效） */
const localEditCache = ref<Record<string, Record<string, unknown>>>({});
/**
 * 编辑缓存：优先父组件受控值（v-model:edit-cache），否则内部维护。
 *
 * <p>写入走 setter emit {@code update:editCache}；受控时**不直接改父值**，
 * 由父组件决定是否接住，避免单向数据流被就地修改。</p>
 */
const editCache = computed<Record<string, Record<string, unknown>>>({
  get: () => props.editCache ?? localEditCache.value,
  set: (value) => {
    localEditCache.value = value;
    emit("update:editCache", value);
  },
});

/**
 * 是否处于编辑态。
 *
 * <p>两个入口：显式 {@code editable} 属性，或工具栏「批量修改」按钮进入的
 * {@code batchEditing}。两者共用同一套单元格输入控件。</p>
 */
const editing = computed<boolean>(() => props.editable || batchEditing.value);

/** 获取编辑值（缓存优先，其次行原值） */
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

/**
 * 设置编辑值。
 *
 * @param row 行数据
 * @param col 列定义
 * @param value 新值
 */
function setEditValue(row: Record<string, unknown>, col: ReTableColumn, value: unknown): void {
  const key = String(row[props.rowKey] ?? "");
  if (props.editCache) {
    // 受控：不可变更新后 emit，交由父组件持有
    emit("update:editCache", {
      ...props.editCache,
      [key]: { ...(props.editCache[key] ?? {}), [col.prop]: value },
    });
  } else {
    if (!localEditCache.value[key]) {
      localEditCache.value[key] = {};
    }
    localEditCache.value[key][col.prop] = value;
    emit("update:editCache", localEditCache.value);
  }
  emit("edit-change", { row, prop: col.prop, value });
}

/** 判断列是否可编辑（编辑态 + 列自身 editable） */
function isColEditable(col: ReTableColumn): boolean {
  return editing.value && (col.editable ?? false);
}

/** 清空编辑缓存 */
function clearEditCache(): void {
  localEditCache.value = {};
  emit("update:editCache", {});
}

/**
 * 关闭 vxe 原生编辑的激活态（saveEdits / onBatchSave 收尾用）。
 *
 * <p>{@code clearEdit} 是 vxe 编辑模块的实例方法（源码 tableEditMethodKeys 里有），
 * 但不在公开类型 {@code TableInstanceHandle} 上 —— 与本文件其它 vxe 内部方法
 * （{@code recalculate} / {@code handleCellDragMousedownEvent}）同样按断言调用。</p>
 *
 * <p>为何要关：保存后 edit-cache 已清，若某格仍处于 vxe 激活态，#edit 插槽的受控
 * 输入框会显示 {@code getEditValue} 的回退值（行原值），用户看到"刚保存的值被
 * 改回去了"。关掉激活态后 #default 渲染 displayCellText，值与行数据一致。</p>
 */
async function closeVxeEdit(): Promise<void> {
  const inst = vxeTableRef.value as unknown as { clearEdit?: () => Promise<void> } | null;
  if (inst?.clearEdit) {
    await inst.clearEdit();
  }
}

/**
 * 有编辑改动的行：以行原值为底，套上缓存里**当前可见列**的改动。
 *
 * <p>列被隐藏后其缓存值不再进入结果，避免把已隐藏列的中间态提交给后端。</p>
 */
const editedRows = computed<Array<Record<string, unknown>>>(() => {
  const cache = editCache.value ?? {};
  const cols = visibleColumns.value;
  const result: Array<Record<string, unknown>> = [];
  for (const key of Object.keys(cache)) {
    const changes = cache[key];
    if (!changes || Object.keys(changes).length === 0) {
      continue;
    }
    const base = (dataList.value ?? []).find((r) => String(r[props.rowKey] ?? "") === key);
    const merged: Record<string, unknown> = { ...(base ?? {}) };
    for (const col of cols) {
      if (Object.prototype.hasOwnProperty.call(changes, col.prop)) {
        merged[col.prop] = changes[col.prop];
      }
    }
    result.push(merged);
  }
  return result;
});

/** 是否有编辑改动 */
const hasEdits = computed<boolean>(() => editedRows.value.length > 0);

/**
 * 保存编辑：优先 {@code editSaveHandler}，否则只 emit {@code edit-save}。
 *
 * <p>未配置 handler 时**不是失败**——把改动行交给页面自行提交即可，
 * 因此批量保存函数不是必填项。</p>
 */
async function saveEdits(): Promise<void> {
  const rows = editedRows.value;
  if (!rows.length) {
    return;
  }
  batchProcessing.value = true;
  try {
    if (typeof props.editSaveHandler === "function") {
      await props.editSaveHandler(rows);
      clearEditCache();
    } else {
      emit("edit-save", rows);
    }
    // 关闭可能仍激活的编辑单元格：清缓存后若编辑器还开着，里面显示的是回退后的行原值
    await closeVxeEdit();
  } finally {
    batchProcessing.value = false;
  }
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
 * <p>ReTable 对外仍用 default / small / mini（localSettings.compact 决定 small，
 * size="mini" 直通 mini），这里单向翻译。认不出的一律按 medium（vxe 默认）走，
 * 不要透传原始值——vxe 拿到非法值会静默落回默认档，行为上没错，
 * 但会让「为什么我传了 small 却没生效」变成查不到的原因。</p>
 */
const vxeTableSize = computed<"medium" | "small" | "mini">(() => {
  if (tableSize.value === "small") return "small";
  if (tableSize.value === "mini") return "mini";
  return "medium";
});

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
  // isDrag —— 那是列宽 resize 的变量）。
  // ⚠ 这里刻意**常开**，不跟随 dragMode：
  //   · rowConfig.drag 只决定「要不要给每个 <tr> 挂 dragstart/dragover/dragend」；
  //     没有 drag-sort 列时它不产生手柄，也不给单元格加 is--drag-cell；
  //   · 真正的拖拽能力由手柄的 mousedown 赋予（置 reactData.dragRow + 该 tr 的 draggable），
  //     行体本身 draggable=false，平时拖不动行，不会误触发；
  //   · 若随 dragMode 开关，vxe 每次都要给 10 行重挂/摘事件并重渲染表体 ——
  //     实测那是开关卡顿里的主要残项，常开后可再省约 150~250ms。
  drag: true,
}));

/**
 * 勾选配置：reserve 开启跨页保留勾选。
 *
 * <p>跨页勾选由组件自己的 selectedRowsMap + sessionStorage 兜底（见
 * restoreSelection），vxe 的 reserve 负责让已勾选行在翻页回来时保持勾选态。</p>
 */
const vxeCheckboxConfig = computed(() => ({ reserve: true }));

/**
 * 排序配置：与 element-plus 的「点表头即排序」语义对齐。
 *
 * <p>vxe 的 {@code sortConfig.trigger} 默认**不是** {@code 'cell'}，点表头单元格不排序，
 * 只有点标题后的asc/desc小图标才排 —— 与 element 引擎点表头即排序的行为分叉，
 * 依赖 {@code sort-change} 的调用方（如 DBM 的服务端排序）点表头会毫无反应。
 * 这里统一置为 {@code 'cell'}。</p>
 *
 * <p>{@code remote}：全部可排序列都是 {@code 'custom'}（服务端排序）时置 true，
 * 让 vxe 不本地排序、只派发 sort-change 交给调用方重查（与 element 的
 * {@code sortable="custom"} 完全一致 —— 否则 vxe 会用 JS 排序覆盖掉服务端
 * 已经排好的当前页，两套排序规则不一致时顺序就错了）。混用或本地排序列时
 * 保持 false，与 element 的 {@code sortable: true} 本地排序行为一致。</p>
 */
const vxeSortConfig = computed(() => {
  const sortableCols = props.columns.filter((c) => c.sortable);
  const allRemote =
    sortableCols.length > 0 && sortableCols.every((c) => c.sortable === "custom");
  return {
    trigger: "cell" as const,
    remote: allRemote,
  };
});

/**
 * 右键菜单：vxe 只有在启用 menu-config 时才派发 cell-menu 事件。
 *
 * <p>vxe 源码里 {@code handleGlobalContextmenuEvent} 整段被
 * {@code if (isEnableConf(menuConfig))} 包着：不传 menu-config 时 cell-menu
 * 事件根本不会派发，外层的 {@code @cell-menu} 永远收不到，ReTable 的右键菜单
 * 就打不开。这里只在有菜单项时启用 —— 只传 {@code enabled} 不传 options，
 * vxe 便只派发事件、不渲染它自己的菜单，外观仍由 ReTable 的 .re-ctx-menu 决定。</p>
 */
/** 是否配置了右键菜单（数组非空或传了动态生成函数） */
function ctxMenuConfigured(): boolean {
  const p = props.contextMenu;
  return !!p && (Array.isArray(p) ? p.length > 0 : true);
}

const vxeMenuConfig = computed(() => (ctxMenuConfigured() ? { enabled: true } : undefined));

/**
 * 编辑配置：vxe 原生单元格编辑（APITable 式「点哪格编辑哪格」）。
 *
 * <p><b>与 element 引擎的自研编辑分属两套实现</b>：element 侧是 {@code editing}
 * 态整列渲染输入框；vxe 侧由 vxe 的 {@code editStore.actived} 驱动——点击可编辑列
 * 的单元格即激活该格，渲染列上的 {@code #edit} 插槽内容，点击别处自动关闭。</p>
 *
 * <p>列级开关仍是 {@link ReTableColumn.editable}（经 {@code beforeEditMethod}
 * 翻译成 vxe 的列判定）；批量修改（{@code toolbarConfig.batchEdit}）进入
 * {@code batchEditing} 后整列输入框改由 ReTable 自己的 #default 插槽渲染，
 * 并临时关掉 vxe 的激活（{@code beforeEditMethod} 返 false），退出时复位。</p>
 *
 * <p>受控语义不变：#edit 插槽里的输入控件仍是 {@code getEditValue} /
 * {@code setEditValue} 读写 edit-cache，不动行数据（vxe 的 keep-source 脏跟踪
 * 不参与，关闭编辑不触发任何写行）。</p>
 */
const vxeEditConfig = computed(() => {
  if (!props.editable && !batchEditing.value) return undefined;
  return {
    trigger: "click" as const,
    mode: "cell" as const,
    showIcon: false,
    autoFocus: true,
    // 只有 editable 列可进 vxe 编辑态；批量模式整列输入框由 #default 渲染，不占 vxe 激活
    beforeEditMethod: ({ column }: { column: { field?: string } }) => {
      if (batchEditing.value || !props.editable) return false;
      const col = props.columns.find((c) => c.prop === column.field);
      return col?.editable ?? false;
    },
  };
});

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

/**
 * 表头右键（vxe 的 {@code header-cell-context-menu}）：
 * 载荷里没有行数据，只有列与事件，转成与 element 引擎一致的
 * {@code header-contextmenu} 载荷抛给宿主。
 */
function onVxeHeaderCellContextMenu(payload: { column?: { property?: string; title?: string }; $event?: PointerEvent }): void {
  const column = (payload.column ?? {}) as unknown as TableColumnCtx<Record<string, unknown>>;
  const event = payload.$event ?? ({} as PointerEvent);
  onHeaderContextMenu(column, event);
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

/**
 * 恢复当前页选中状态（分页切换后调用）
 *
 * <p><b>异步分片</b>：勾选动作逐行调 vxe / element 的 API，每调一次都会触发一次
 * 表格内部重算（行样式、复选框态、选中计数）。一页几百行时，一口气同步勾完
 * 就是一个几百毫秒的 Long Task —— 期间浏览器不出帧，刷新按钮的 loading 动画
 * 看起来像冻住，用户感知就是「刷新卡死」。</p>
 *
 * <p>这里每勾 {@link SELECTION_CHUNK_SIZE} 行就让出一帧：勾选照常全部完成，
 * 但每片之间的空档浏览器能出帧、能响应输入，动画不再被冻住。</p>
 */
async function restoreSelection(): Promise<void> {
  // 勾选列存在才需要恢复：showSelection（常驻复选框列）或批量选择模式开着才有这回事。
  // 之前只看 batchSelectActive，导致「常驻选择列 + 跨页记住勾选」的表格翻页后不恢复。
  if (!batchSelectActive.value && !selectionEnabled.value) return;
  await nextTick();
  const data = dataList.value ?? [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const key = String(row[props.rowKey] ?? "");
    if (!key || !selectedRowsMap.value[key]) continue;
    if (useVxe.value) {
      // vxe 用 setCheckboxRow() 勾选行；toggleCheckboxRow 是「反转」语义、不接受第二参
      vxeTableRef.value?.setCheckboxRow(row, true);
    } else {
      elTableRef.value?.toggleRowSelection(row, true);
    }
    // 每片末尾让一帧（最后一片不用让）
    if ((i + 1) % SELECTION_CHUNK_SIZE === 0 && i + 1 < data.length) {
      await yieldToMain();
    }
  }
}

/**
 * 是否使用远程（后端分页）模式。
 *
 * <p>原子语义后只取决于 {@link loader} 是否为函数 —— 不再探测 {@code data}（它恒为数组）。
 * {@code loader} 传函数 = 远程，total 由接口返回；否则 = 本地，走 data 数组 + 前端分页。</p>
 */
const isRemote = computed<boolean>(() => typeof props.loader === "function");

/** data 恒为数组（类型已收窄）；非数组时兜底成空表，绝不当加载器误用 */
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
  // 滚动分页：本地按 scrollPage * pageSize 逐步放出；远程 = 首批(dataList) + 追加批次。
  // 序号/选中/拖拽快照都消费本计算属性，切换分页方式对它们零感知。
  if (isScrollPaging.value) {
    const all = dataList.value ?? [];
    if (isRemote.value) {
      return scrollAppendedRows.value.length ? [...all, ...scrollAppendedRows.value] : all;
    }
    const size = currentPageSize.value;
    return all.slice(0, Math.max(1, scrollPage.value) * size);
  }
  if (isRemote.value || !paginationCfg.value.enable) return dataList.value ?? [];
  const all = dataList.value ?? [];
  const size = currentPageSize.value;
  const maxPage = Math.max(1, Math.ceil(all.length / size));
  const page = Math.min(Math.max(1, internalPage.value || paginationCfg.value.page || 1), maxPage);
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
  // pageCache / shortcuts 缺省开启：不做任何配置的表格也该有「记住页码」和「方向键翻页」。
  // pageCache 也接受分组配置里的 config.pagination.remember（同一开关的两个入口）；
  // 显式写在 settings 里的值优先（...v 在后面）。
  return {
    // 顶层 border prop 作为缺省值：页面里裸写 border / :border="false" 以前是无效属性
    border: props.border ?? true,
    stripe: props.stripe,
    // 顶层 compact prop 同理：页面里裸写 compact 以前也是无效属性，密度只认设置面板的开关
    compact: props.compact,
    pageCache: paginationCfg.value.remember ?? true,
    shortcuts: true,
    ...v,
  };
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

/* ==================== 十字高亮（表格设置开关） ==================== */

/** 十字高亮是否生效：悬停表体单元格时，所在行 / 所在列（含表头）一起着色 */
const crosshairOn = computed<boolean>(() => localSettings.value.crosshairHighlight ?? false);

/** 当前命中的格子：用于跳过同格重算，关掉开关时一并复位 */
let crosshairCell: HTMLElement | null = null;

/** 已打上十字类的元素（行格 + 列格 + 表头列格 + 命中格），清理时统一摘掉 */
let crosshairEls: HTMLElement[] = [];

/** 摘掉全部十字类；集合为空时是空操作，可在 mouseover 高频路径上无条件调用 */
function clearCrosshair(): void {
  for (const el of crosshairEls) {
    el.classList.remove("is-crosshair-row", "is-crosshair-col", "is-crosshair-cell");
  }
  crosshairEls = [];
  crosshairCell = null;
}

/** 关闭开关时立刻收掉屏幕上残留的十字（否则要等下次 hover 才会消失） */
watch(crosshairOn, (on) => {
  if (!on) clearCrosshair();
});

/**
 * 十字高亮主入口：根节点上的 mouseover 事件委托。
 *
 * <p>刻意不绑 el-table / vxe-table 的事件：两套引擎都渲染成
 * {@code table > tbody > tr > td}，按 DOM 归属算行列即可同时覆盖
 * （列位置用 {@code cellIndex}，与同一 table 的表头天然对齐）。
 * 指针落在非表格区（工具栏 / 空态 / 滚动条）时顺手清理。</p>
 */
function onCrosshairOver(e: MouseEvent): void {
  if (!crosshairOn.value) return;
  const target = e.target as Element | null;
  // 只认表体 td：表头 th 悬停不当作十字起点（列头单独着色由下面的表头补色负责）
  const cell = (target?.closest?.("td") ?? null) as HTMLTableCellElement | null;
  if (!cell) {
    if (crosshairCell) clearCrosshair();
    return;
  }
  if (cell === crosshairCell) return; // 还在同一格里，别重算
  applyCrosshair(cell);
}

/** 给命中格打行 / 列十字类：行取整行 td，列按 cellIndex 取同 table 各行与表头 */
function applyCrosshair(cell: HTMLTableCellElement): void {
  clearCrosshair();
  const row = cell.parentElement; // 命中格所在的 tr
  const tbody = row?.parentElement as HTMLTableSectionElement | null;
  // 不在 tbody 里（结构异常 / 模板行）直接放弃，不当作十字
  if (!row || !tbody || tbody.tagName !== "TBODY") return;
  crosshairCell = cell;
  const idx = cell.cellIndex;
  const els: HTMLElement[] = [];

  // 行：命中格所在 tr 的所有 td（tr class 会被 el-table 的行样式盖掉，所以直接落 td）
  for (const td of Array.from(row.children) as HTMLElement[]) {
    if (td.tagName !== "TD") continue;
    td.classList.add("is-crosshair-row");
    els.push(td);
  }

  // 列：同 tbody 各行的第 idx 格。colSpan>1 的格（展开行 / 合并格）跳过，
  // 否则 idx=0 时会把整行展开区整条染色
  for (const tr of Array.from(tbody.rows) as HTMLTableRowElement[]) {
    const c = tr.cells[idx];
    if (!c || c.colSpan > 1) continue;
    c.classList.add("is-crosshair-col");
    els.push(c);
  }

  // 列：表头。el-table 的表头是独立 table，所以向最近的引擎容器要 thead；
  // 分组表头有多行时按「每行第 idx 格」近似对齐（单行表头——绝大多数场景——是精确的）
  const container = cell.closest(".el-table, .vxe-table");
  if (container) {
    const theads = Array.from(container.querySelectorAll<HTMLTableSectionElement>("thead"));
    for (const thead of theads) {
      const hc = (thead.rows[0] as HTMLTableRowElement | undefined)?.cells[idx];
      if (!hc || hc.colSpan > 1) continue;
      hc.classList.add("is-crosshair-col");
      els.push(hc);
    }
  }

  // 命中格最深一档：三条规则权重相同，放最后靠源码顺序胜出（交叉点）
  cell.classList.add("is-crosshair-cell");
  els.push(cell);
  crosshairEls = els;
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
      // 列宽恢复：只保留仍存在的列，且值必须是正数（存档是历史数据，做一次过滤）
      widths: saved.widths && typeof saved.widths === "object"
        ? Object.fromEntries(
            Object.entries(saved.widths).filter(
              ([p, w]) => propsList.includes(p) && typeof w === "number" && w > 0,
            ),
          )
        : undefined,
    };
    // 恢复分页与设置（完整状态扩展字段）
    // 标记 isRestoringState，避免 emit page/pageSize 时触发多余 reload
    isRestoringState = true;
    // 页码恢复不单独记标志：首批取数已用恢复后的页码，不需要补取（见 finally 的说明）
    let restoredSearch = false;
    try {
      const full = saved as ReTableFullState;
      // 分页方式存档：仅 switch 开启（页面给了用户切换入口）且持久化未关闭时恢复。
      // 与 layout 同语义——开关关闭意味着「业务上固定」，存档的脏历史不干扰；
      // 但开关开着、用户曾经选过，下次应回到上次习惯。
      if (
        paginationCfg.value.modeSwitch === true &&
        paginationCfg.value.modePersist !== false &&
        (full.paginationMode === "pager" || full.paginationMode === "scroll")
      ) {
        activePaginationMode.value = full.paginationMode;
      }
      if (typeof full.page === "number") {
        // 「记住页码」关闭：忽略存档页码，始终从第 1 页开始
        if (localSettings.value.pageCache === false) {
          internalPage.value = 1;
          emit("update:page", 1);
        } else if (activePaginationMode.value === "scroll") {
          // 滚动模式固定从第 1 批开始：不恢复历史页码（那批数据已在首批里），只归位
          // 内部状态，让翻页 watcher 顺带把页面状态也对齐一下。首批已在 setup 期立即取数阶段按
          // buildRemoteSource 的 isScrollPaging 分支拿到第 1 批了，这里不用再来一次。
          internalPage.value = 1;
          emit("update:page", 1);
        } else {
          // 必须同时写内部状态：非受控用法（页面没绑 v-model:page）时 emit 出去没人接，
          // 只 emit 等于"恢复了却看不见"——这正是刷新后仍回到第 1 页的原因。
          internalPage.value = full.page;
          emit("update:page", full.page);
        }
        // pageSize 需校验档位：默认档位调整后，老用户 localStorage 里存的旧值（如 10）
        // 不在 pageSizes 中，若照搬会渲染出「分页器档位」与「实际每页条数」不一致的界面
        if (typeof full.pageSize === "number" && isAllowedPageSize(full.pageSize)) {
          // 还要过一次上限钳制：存档是历史数据，可能存着上限提高前写下的超大值，
          // 只靠上面的档位校验挡不住（pageSizes 为空时 isAllowedPageSize 恒真）
          emit("update:pageSize", clampPageSize(full.pageSize, "localStorage 存档"));
        }
      }
      if (full.settings) {
        localSettings.value = { ...localSettings.value, ...full.settings };
        emitSettings();
      }
      // 筛选条件恢复：仅内置搜索可用、页面没给受控初始值时回填，避免覆盖页面的受控状态
      if (
        searchEnabled.value &&
        full.searchModel &&
        typeof full.searchModel === "object" &&
        Object.keys(full.searchModel).length > 0 &&
        (!props.searchModel || Object.keys(props.searchModel).length === 0)
      ) {
        emit("update:searchModel", full.searchModel);
        restoredSearch = true;
      }
    } finally {
      // nextTick 后重置标记
      nextTick(() => {
        isRestoringState = false;
        // 只在「筛选条件」被恢复时补一次取数：条件是通过 emit 回给页面的，
        // 页面 v-model 回写晚于首批取数，所以必须补。
        //
        // 页码**不补**：loadColumnState 的 watch 是 immediate，跑在 useDataSource 之前，
        // 首批取数读到的 internalPage 已是恢复后的页码（buildRemoteSource 读的就是它）。
        // 以前这里按 restoredPage 也补一次，于是"进第 2 页要打两次接口"。
        if (restoredSearch && isRemote.value && paginationCfg.value.autoReload) {
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
  const pageCacheOn = localSettings.value.pageCache !== false;
  // 保存列配置 + 分页 + 设置 + 布局（完整状态，统一落一份）
  const fullState: ReTableFullState = {
    ...columnState.value,
    // 页码/每页条数存**内部实际值**：paginationCfg.value.page 在非受控用法下恒为初始值（通常是 1），
    // 存它等于永远记不住第 2 页 —— 这正是"刷新回到第 1 页"的根因。
    // 关闭「记住页码」时干脆不写页字段，下次也就无从恢复。
    ...(pageCacheOn ? { page: internalPage.value, pageSize: currentPageSize.value } : {}),
    ...(paginationCfg.value.modeSwitch === true && paginationCfg.value.modePersist !== false
      ? { paginationMode: activePaginationMode.value }
      : {}),
    settings: localSettings.value,
    layout: activeLayout.value,
    // 筛选条件快照：仅内置搜索（配置了 filters）时写入，页面受控值原样存档
    ...(searchEnabled.value && props.searchModel && Object.keys(props.searchModel).length > 0
      ? { searchModel: props.searchModel }
      : {}),
  };
  effectiveStorage.value.set(activeTableId.value, fullState);
}

/** ========== 列宽持久化 ========== */

/**
 * 列的实际渲染宽度：用户拖拽后的持久化值优先，未改过的列沿用列定义的 width。
 * 模板里两套引擎的 :width 都走这里，恢复与实时更新共用同一入口。
 */
function colWidth(col: ReTableColumn): string | number | undefined {
  const w = columnState.value.widths?.[col.prop];
  return typeof w === "number" ? w : col.width;
}

/** 落盘一列的拖拽后宽度（写回 columnState 并触发统一保存） */
function persistColumnWidth(prop: string, width: number): void {
  if (!prop) return;
  const w = Math.round(width);
  if (!Number.isFinite(w) || w <= 0) return;
  columnState.value = {
    ...columnState.value,
    widths: { ...(columnState.value.widths ?? {}), [prop]: w },
  };
  saveColumnState();
}

/**
 * element 引擎：表头拖宽结束（header-dragend）。
 * newWidth 为最终宽度；column.property 即列 prop（选择/序号等内置列 property 为空，被入口挡掉）。
 */
function onElementHeaderDragend(
  newWidth: number,
  _oldWidth: number,
  column: TableColumnCtx<Record<string, unknown>>,
): void {
  persistColumnWidth((column as { property?: string })?.property ?? "", newWidth);
}

/** vxe 引擎：列宽调整结束（resizable-change）。新宽度在 column.resizeWidth，缺省退回 column.width。 */
function onVxeResizableChange(params: {
  column?: { field?: string; resizeWidth?: number; width?: number | string };
}): void {
  const col = params?.column;
  if (!col?.field) return;
  const w = typeof col.resizeWidth === "number" ? col.resizeWidth : Number(col.width);
  if (Number.isFinite(w)) persistColumnWidth(col.field, w);
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

/* ========== 列表结果缓存（仅远程模式） ========== */

/** loader 返回里可能承载数据数组的字段名（按优先级）。extractRecords 与缓存校验共用一份，避免两处列表漂移 */
const RECORD_KEYS = ["records", "rows", "list", "items", "content", "data"] as const;

/**
 * 缓存命名空间：显式 {@code cacheKey} 优先，缺省回落到 {@link activeTableId}
 * （tableId / 路由 path）—— 与列配置、批量选择同一套「同一张表 = 同一个 id」的约定。
 *
 * <p>空串 = 不缓存：既没传 tableId 又不在路由环境时无法定位这份缓存属于谁，
 * 硬存只会让不同表格互相覆盖。此时 dev 下由下面的 onMounted 告警一次。</p>
 */
const cacheNamespace = computed<string>(() => {
  if (!props.cache) return "";
  return props.cacheKey || activeTableId.value;
});

/**
 * 缓存载体：按 {@code cacheStorage} 选 session / local，并以命名空间为前缀建独立实例。
 *
 * <p>用带前缀的独立实例而不是裸的 localStore / sessionStore，是为了
 * {@link clearCache} 的 {@code clear()} 只清本表这一份 —— 裸实例前缀为空，
 * clear 会把同 storage 里的列配置、token 一起端掉。</p>
 */
const cacheStore = computed<StorageWrapper | null>(() => {
  const ns = cacheNamespace.value;
  if (!ns) return null;
  return createStorage(props.cacheStorage === "local" ? browserLocalStorage : browserSessionStorage, {
    prefix: getStorageKey(`re-table-cache:${ns}`),
  });
});

/**
 * 下一次取数强制走网络（reload / goto / 自动刷新用）。
 *
 * <p>「显式刷新」的语义就是「我要最新的」：绕过读缓存，拿到响应后照常写回，
 * 这一次刷新同时完成了缓存更新。标志在 {@link callLoader} 里读一次即清零 ——
 * 只影响紧接着的这一次取数，不会连带把后面的滚动追加也变成强制刷新。</p>
 */
let bypassCacheOnce = false;

/** 条目 key = 页码 + 每页条数 + 查询指纹（三者任一不同都是不同的一页） */
function buildCacheEntryKey(paramObj: Record<string, unknown>, page: number, size: number): string {
  const query = { ...paramObj };
  delete query.page;
  delete query.pageSize;
  return `${page}:${size}:${JSON.stringify(query)}`;
}

/**
 * 校验存档形状，不合格一律当作未命中。
 *
 * <p>存的是 loader 的原始返回，理论上只有我们自己写过；但手改 storage、跨版本改字段、
 * 前缀撞车都可能塞进别的东西。此时若照单全收，{@link extractRecords} 会解出空数组、
 * total 算成 0 —— 表现为「表格莫名空了」，比重新请求一次难查得多。</p>
 */
function isCachedResult(value: unknown): value is RePageResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  if (obj.total !== undefined) return true;
  return RECORD_KEYS.some((key) => Array.isArray(obj[key]));
}

/** 读缓存：命中返回与 {@link callLoader} 同构的结果，未命中 / 形状不对返回 null */
function readCachedResult(
  entryKey: string,
): { result: RePageResult; records: Array<Record<string, unknown>>; total: number } | null {
  const store = cacheStore.value;
  if (!store) return null;
  const cached = store.get<unknown>(entryKey);
  if (!isCachedResult(cached)) return null;
  return {
    result: cached,
    records: extractRecords(cached),
    total: Number(cached.total ?? 0),
  };
}

/** 写缓存；失败（隐私模式 / 配额满）由 StorageWrapper 内部吞掉，不影响本次取数 */
function writeCachedResult(entryKey: string, result: RePageResult): void {
  const store = cacheStore.value;
  if (!store) return;
  // 0 / 负数 / NaN 一律按不过期处理（StorageWrapper 对 falsy 的 expires 即不写过期元数据）
  const ttl = Number(props.cacheTtl);
  store.set(entryKey, result, Number.isFinite(ttl) && ttl > 0 ? Math.round(ttl) : 0);
}

/** 清空本表全部缓存条目（所有页码 / 所有查询条件），供页面在增删改后主动失效 */
function clearCache(): void {
  cacheStore.value?.clear();
}

/**
 * 缓存是否生效：开关打开 + 命名空间定位得到。
 *
 * <p>作为 {@link callLoader} 的闸门：不生效时连 key 都不组装 ——
 * 指纹要对 params 做 JSON.stringify，默认（关缓存）路径上没必要付这个成本。</p>
 */
const cacheEnabled = computed<boolean>(() => cacheStore.value !== null);

onMounted(() => {
  if (props.cache && !cacheNamespace.value && import.meta.env.DEV) {
    console.warn("[ReTable] cache 已开启但既未传 tableId 也不在路由环境，无法定位缓存，本次不生效。");
  }
});

/**
 * 远程 loader 的最小调用封装：合并 params + page/pageSize → 调 fn → 解出记录与 total。
 *
 * <p>抽出来是因为「首批」（buildRemoteSource）与「滚动追加」（loadMoreForScroll）
 * 两处都走同样的合并/解包逻辑——复制一份就会出现「翻页合并规则改了改一处、滚动又漏了」
 * 这类难查的分叉。emits 放在外面做：首发走 load/update:total，追加走 load-more，
 * 二者共享纯数据逻辑。</p>
 *
 * <p><b>列表结果缓存也挂在这一层</b>：首批与滚动追加都过这里，一份实现两处受益。
 * 指纹取自<b>实际发给 loader 的那份参数</b>（{@code searchModel} + {@code params}），
 * 而不是 {@link internalParamsKey} —— 后者只看 props.params，内置搜索改了搜索词而
 * params 没动时会算出同一个 key，命中就把上一个搜索词的结果当成本次的，属于静默错数据。</p>
 */
async function callLoader(
  page: number,
  size: number,
): Promise<{ result: RePageResult; records: Array<Record<string, unknown>>; total: number }> {
  /** params 是页面显式声明的查询对象（提交快照），优先级高于搜索区的实时草稿值 */
  const paramObj = { ...(props.searchModel ?? {}), ...(props.params ?? {}) };
  const loadParams: ReTableLoadParams = {
    page,
    pageSize: size,
    params: { ...paramObj, page, pageSize: size },
  };
  // data 传函数与 loader 等价，且 data 的函数形态优先 —— 与 ReSelect / ReTree 同一口径：
  // 三者都是「data（数组｜函数）+ loader」，data 传函数即后端加载器。
  const dataFn = typeof props.data === "function" ? (props.data as unknown as ReTableLoader) : undefined;
  const loader = dataFn ?? props.loader;
  if (typeof loader !== "function") throw new Error("未提供 loader（或 data 传函数）");

  /* 先取标志再清零 —— 顺序反了会在命中提前 return 时把标志漏给下一次取数 */
  const bypass = bypassCacheOnce;
  bypassCacheOnce = false;
  const entryKey = cacheEnabled.value ? buildCacheEntryKey(paramObj, page, size) : "";
  if (entryKey && !bypass) {
    const cached = readCachedResult(entryKey);
    if (cached) return cached;
  }

  const result = await loader(loadParams);
  if (!result) throw new Error("未获取到分页数据");
  // 写回存档：reload / goto / 自动刷新是绕过读缓存走过来的，照常写回，
  // 于是「显式刷新」既拿到新数据也顺手把缓存更新了
  if (entryKey) writeCachedResult(entryKey, result);
  return {
    result,
    records: extractRecords(result),
    total: Number(result.total ?? 0),
  };
}

function extractRecords(result: RePageResult): Array<Record<string, unknown>> {
  for (const key of RECORD_KEYS) {
    if (Array.isArray(result[key])) return result[key] as Array<Record<string, unknown>>;
  }
  return [];
}

/** 远程（后端分页）数据加载 —— 走 useDataSource 的首批。page 来自 internalPage。 */
function buildRemoteSource(): ReDataSource<Array<Record<string, unknown>>> {
  const run = async (): Promise<Array<Record<string, unknown>>> => {
    // 滚动分页固定从第 1 批开始：追加由 loadMoreForScroll 驱动，这里只能拿首批；
    // 否则「页码模式翻到第 3 页再切滚动」会把第 3 页当首批、后续批次全错位。
    const curPage = isScrollPaging.value ? 1 : (internalPage.value || paginationCfg.value.page || 1);
    const curSize = currentPageSize.value;
    try {
      const { result, records, total } = await callLoader(curPage, curSize);
      remoteTotal.value = total;
      emit("update:total", total);
      emit("load", result);
      return records;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      emit("load-error", err);
      throw err;
    }
  };
  return run;
}

/**
 * 滚动分页：触发下一批的加载。
 *
 * <p>远程 = 调 loader 拉第 N+1 页、把记录追加进 scrollAppendedRows（首批留在 dataList
 * 里，不替换）；本地 = 直接推进 scrollPage，pagedRows 的 slice 会放出更多行。</p>
 *
 * <p>竞态守卫：用 scrollGeneration（reset 时 +1）丢弃取数期间被重置的响应，
 * 不能复用 useDataSource 里的 seq——追加绕过了它。</p>
 */
async function loadMoreForScroll(): Promise<void> {
  if (
    !isScrollPaging.value ||
    scrollLoadingMore.value ||
    dataLoading.value ||
    !hasMoreInScroll.value
  ) {
    return;
  }

  // 本地模式：不用取数，直接放出下一批切片
  if (!isRemote.value) {
    scrollPage.value += 1;
    return;
  }

  const gen = scrollGeneration;
  const nextPage = scrollPage.value + 1;
  scrollLoadingMore.value = true;
  try {
    const { records, total } = await callLoader(nextPage, currentPageSize.value);
    // reset / 切模式 / 清空已发生 → 迟到的响应直接丢弃
    if (gen !== scrollGeneration) return;
    scrollLastBatchCount.value = records.length;
    if (records.length === 0) {
      scrollExhausted.value = true; // 空批 = 到底（即使 total 不准）
      return;
    }
    scrollAppendedRows.value = [...scrollAppendedRows.value, ...records];
    scrollPage.value = nextPage;
    if (Number.isFinite(total) && total !== remoteTotal.value) {
      remoteTotal.value = total;
      emit("update:total", total);
    }
    emit("load-more", { page: nextPage, records, total });
  } catch (e) {
    if (gen !== scrollGeneration) return;
    const err = e instanceof Error ? e : new Error(String(e));
    // 追加失败不销毁已加载行、不向上抛 —— 用户可以再滚动一遍重试
    emit("load-error", err);
  } finally {
    if (gen === scrollGeneration) scrollLoadingMore.value = false;
  }
}

/** vxe 触底事件(@scroll-boundary) → 仅滚动分页模式消费 isBottom */
function onVxeScrollBoundary(params: { isBottom?: boolean; isTop?: boolean }): void {
  if (!isScrollPaging.value || !params?.isBottom) return;
  void loadMoreForScroll();
}

const sourceRef = computed<ReDataSource<Array<Record<string, unknown>>>>(() => {
  if (isRemote.value) return buildRemoteSource();
  return localRows.value;
});

const { loading: dataLoading, data: dataList, reload: dsReload } = useDataSource<Array<Record<string, unknown>>>(
  sourceRef,
);

/**
 * 首批数据（重新）落地 = 滚动分页回到起点：清空此前追加的批次与重置追加状态。
 *
 * <p>为什么 watch dataList 而不是每个 reload 口：远程模式下所有「带条件的刷新」
 * 本质都是 useDataSource 换 data（换数组）—— 包括 params 变化、页码归 1、search、
 * 刷新、切回页码模式——唯一次 source resolve 落地就覆盖 dataList。一条 watch 就把
 * 它们全部收拢，遗漏一处就会出现「新条件下滚到底，旧批次悄悄补上去」的脏数据。</p>
 */
watch(dataList, () => {
  if (isScrollPaging.value) resetScrollPaging();
  // 新一批数据落地后恢复勾选：跨页记住的勾选状态要落到新行上。
  // 放在这里而不是各个 reload 入口，是为了让「刷新 / 翻页 / 改查询条件」共用一条路径。
  void restoreSelection();
});

/** params 变化 → 重置回第 1 页并重新加载 */
const internalParamsKey = computed<string>(() => {
  const p = { ...(props.params ?? {}) } as Record<string, unknown>;
  delete p.page;
  delete p.pageSize;
  return JSON.stringify(p);
});
const lastParamsKey = ref<string>(internalParamsKey.value);

watch(internalParamsKey, (key) => {
  if (!isRemote.value || !paginationCfg.value.autoReload) return;
  if (key === lastParamsKey.value) return;
  lastParamsKey.value = key;
  if (paginationCfg.value.page !== 1) {
    emit("update:page", 1);
  }
  // params 变化后等 props 更新再重新加载
  nextTick(() => { void dsReload(); });
});

/** page 变化 → 重新加载远程数据 */
watch(() => paginationCfg.value.page, (p, oldP) => {
  if (!isRemote.value || !paginationCfg.value.autoReload) return;
  if (p === oldP) return;
  nextTick(() => { void dsReload(); });
});

/** internalPage 变化（用户点击分页 / 方向键）→ 落盘 + 同步并 reload */
watch(internalPage, (p, oldP) => {
  if (p === oldP) return;
  // 页码一变化就落盘：分页器点击与 ←/→ 翻页都经过这里。
  // 之前只有 onPageChange 里保存，而它实际已无调用方 —— 于是「记住页码」永远存不到。
  saveColumnState();
  // 存档恢复期间不触发取数：恢复逻辑自己会 emit，首批取数也已经在 setup 期按
  // 恢复后的页码完成，这里再打一次就是"先取第 1 页再取第 2 页"的重复请求。
  if (isRestoringState) return;
  if (!isRemote.value || !paginationCfg.value.autoReload) return;
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

/** ========== 键盘快捷键（←/→ 上一页/下一页） ========== */

/** 快捷键是否开启（表格设置里可关，默认开） */
const shortcutsEnabled = computed<boolean>(() => localSettings.value.shortcuts !== false);

/**
 * 键盘归属：focus 优先、其次 hover。
 *
 * <p>一页里可能有多张表，而 keydown 是 document 级的 —— 不加归属判定，一次按键会同时
 * 翻动所有表格。规则：焦点在表内（focusin）时归它；否则鼠标悬停的那张表归它；
 * 都没有则不响应。</p>
 */
const keyboardHovered = ref(false);
const keyboardFocused = ref(false);
const ownsKeyboard = computed<boolean>(() => keyboardFocused.value || keyboardHovered.value);

/** 焦点是否仍在表格内（用于 focusout：移到兄弟元素时不应释放归属） */
function onRootFocusout(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null;
  if (next && rootRef.value?.contains(next)) return;
  keyboardFocused.value = false;
}

/** 鼠标进入：取得键盘归属（focus 优先，见 ownsKeyboard） */
function onRootMouseenter(): void {
  keyboardHovered.value = true;
}

/** 鼠标离开：释放 hover 归属，同时清掉十字高亮（原 @mouseleave 的职责） */
function onRootMouseleave(): void {
  keyboardHovered.value = false;
  clearCrosshair();
}

/**
 * 事件目标是否是可编辑控件。
 *
 * <p>输入框里按 ←/→ 是移动光标，翻页会让人抓狂 —— 这是方向键方案最容易踩的坑，
 * 必须优先放行，且不能 preventDefault。</p>
 *
 * @param target 事件目标
 * @returns 是否属于可编辑区域
 */
function isEditableTarget(target: EventTarget | null): boolean {
  const node = target as HTMLElement | null;
  if (!node || typeof node.closest !== "function") return false;
  if (node.isContentEditable) return true;
  return !!node.closest("input, textarea, select, [contenteditable='true']");
}

/**
 * 全局方向键处理。
 *
 * <p>只有「归属本表 + 快捷键开启 + 分页模式（非滚动分页）+ 有下一页」时才动作；
 * 首尾页不动作也不循环 —— 循环翻页极易误操作。</p>
 *
 * @param event 键盘事件
 */
function onShortcutKeydown(event: KeyboardEvent): void {
  if (!shortcutsEnabled.value || !ownsKeyboard.value) return;
  if (!paginationCfg.value.enable || isScrollPaging.value) return;
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  if (isEditableTarget(event.target)) return;
  // 组合键（Ctrl/⌘/Alt/Shift + ←）留给浏览器与系统快捷键
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
  const maxPage = Math.max(1, Math.ceil(totalToShow.value / currentPageSize.value));
  if (maxPage <= 1) return;
  const next = event.key === "ArrowLeft" ? internalPage.value - 1 : internalPage.value + 1;
  if (next < 1 || next > maxPage) return;
  event.preventDefault();
  onPageClick(next);
}

onMounted(() => document.addEventListener("keydown", onShortcutKeydown));
onBeforeUnmount(() => document.removeEventListener("keydown", onShortcutKeydown));

function formatCell(row: Record<string, unknown>, column: ReTableColumn): string {
  const value = row[column.prop];
  if (column.formatter) {
    return column.formatter(row, column, value);
  }
  if (value == null) return "-";
  return String(value);
}

/**
 * 单元格显示文本（vxe 引擎显示态用）：**编辑草稿优先**，其余与 {@link formatCell} 一致。
 *
 * <p>vxe 单格编辑关闭后，#default 插槽渲染的就是本函数的结果。若仍按行原值渲染，
 * 用户刚敲进 edit-cache 的值会随输入框卸载而“消失”（数据还在缓存里、只是看不见），
 * 观感像编辑丢失。草稿优先后：编辑即所见，保存生效（edit-save/handler 拿合并行），
 * 刷新丢弃（reload 清缓存）。element 引擎不走这条路（编辑态整列常显输入框），
 * 仍用 {@link formatCell}。</p>
 */
function displayCellText(row: Record<string, unknown>, column: ReTableColumn): string {
  const value = getEditValue(row, column);
  if (column.formatter) {
    return column.formatter(row, column, value);
  }
  if (value == null) return "-";
  return String(value);
}

function onSizeChange(s: number): void {
  const size = clampPageSize(s, "分页器切换每页条数");
  internalPageSize.value = size;
  // emit 的也是钳制后的值：否则父级 v-model 拿到 1000、回流进 props 又被 watch 钳一次，
  // 出现「内部是 200、父级以为是 1000」的不一致
  emit("update:pageSize", size);
  if (paginationCfg.value.page !== 1) {
    internalPage.value = 1;
    emit("update:page", 1);
  }
  saveColumnState();
  void restoreSelection();
  // 等 props 更新后重新加载远程数据
  if (isRemote.value && paginationCfg.value.autoReload) {
    nextTick(() => { void dsReload(); });
  }
}

async function reload(): Promise<void> {
  // 显式刷新 = 强制走网络（拿到响应后照常写回存档），缓存只在条件/页码自然变化时命中
  bypassCacheOnce = true;
  // 滚动分页的刷新 = 回第 1 批重新来（追加的批次随旧条件作废）。
  // 本地模式 dsReload 可能不换数组引用（watch dataList 不触发），这里显式重置兜底。
  resetScrollPaging();
  // 先让一帧：让按钮的 loading 态（spinner）与表格遮罩**先画出来**，再开始取数。
  // 否则点击刷新后，浏览器要等到接口回来才开始处理后续任务，用户看到的是
  // 「按下去什么都没发生，过一会儿整页冻住」—— 正是「刷新卡死」的观感来源。
  // 让完这一帧后，loading 动画已经在屏幕上转，取数期间界面依然流畅。
  await yieldToMain();
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
/** 浮层里的候选档位；页面没传 intervals 时的默认档：关 / 5s / 10s / 30s / 1min */
const autoRefreshSteps = computed<number[]>(() => {
  const list = autoRefreshCfg.value?.intervals;
  return Array.isArray(list) && list.length ? list.map((ms) => (ms > 0 ? normalizeInterval(ms) : 0)) : [0, 5000, 10000, 30000, 60000];
});
/** 轮询定时器句柄；换档 / keep-alive 激活态变化时统一经 startAutoRefresh 起停 */
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null;
/** 倒计时拍子：开启态每秒减 1，供浮层底部「下次刷新 N 秒后」展示；轮询本身仍走 autoRefreshTimer */
let autoRefreshTickTimer: ReturnType<typeof setInterval> | null = null;
/** 距下次刷新的秒数（开启态才有意义，关闭态无展示） */
const autoRefreshCountdown = ref<number>(0);
/** 浮层底部是否显示倒计时：默认 true（关闭态无下一次，不显示；设 false 则只留静态说明） */
const autoRefreshShowCountdown = computed<boolean>(() => autoRefreshCfg.value?.showCountdown ?? true);

/**
 * 档位文案：主标题 + 副说明（参考图：每档一行主标题、一行灰色副说明）。
 *
 * 0 档是「不自动刷新 / 仅在点击刷新时更新」；>0 档按秒数取内置副说明，
 * 页面自定义的非常规档位回落到「每 N 秒自动重取当前页」。
 */
function autoRefreshStepText(ms: number): { title: string; desc: string } {
  if (ms <= 0) return { title: "不自动刷新", desc: "仅在点击刷新时更新" };
  const s = Math.round(ms / 1000);
  if (s === 5) return { title: "每 5 秒", desc: "高实时，适合监控运行中任务" };
  if (s === 10) return { title: "每 10 秒", desc: "平衡实时性与查询负载" };
  if (s === 30) return { title: "每 30 秒", desc: "常规巡检，推荐默认" };
  if (s === 60) return { title: "每 1 分钟", desc: "降低数据源压力" };
  return { title: `每 ${s} 秒`, desc: `每 ${s} 秒自动重取当前页` };
}

/** 浮层是无边框档位菜单：一行一档（主标题 + 副说明），0 档写成「不自动刷新」 */
const autoRefreshOptions = computed<ReOption[]>(() =>
  autoRefreshSteps.value.map((ms) => {
    const text = autoRefreshStepText(ms);
    return {
      value: ms,
      label: text.title,
      description: text.desc,
      // 参考图每档左侧的圆形图标：关闭=暂停、开启=计时
      icon: ms > 0 ? "Timer" : "VideoPause",
    };
  }),
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
  if (autoRefreshTickTimer) {
    clearInterval(autoRefreshTickTimer);
    autoRefreshTickTimer = null;
  }
}

function startAutoRefresh(): void {
  stopAutoRefresh();
  if (autoRefreshMs.value <= 0) return;
  autoRefreshCountdown.value = Math.max(1, Math.round(autoRefreshMs.value / 1000));
  autoRefreshTimer = setInterval(() => {
    // 上一拍还在飞就跳过这一拍，慢接口下不堆请求；跳过不重置倒计时，下一拍继续
    if (!dataLoading.value) {
      autoRefreshCountdown.value = Math.max(1, Math.round(autoRefreshMs.value / 1000));
      // 轮询的目的就是拿最新数据：绕过缓存，否则整个 TTL 内都只是在读同一份存档
      bypassCacheOnce = true;
      void dsReload();
    }
  }, autoRefreshMs.value);
  autoRefreshTickTimer = setInterval(() => {
    if (autoRefreshCountdown.value > 1) autoRefreshCountdown.value -= 1;
  }, 1000);
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
  // 与 reload 同属「显式定位」：绕过缓存强制取数，避免增删改后跳到旧档
  bypassCacheOnce = true;
  // 滚动模式不提供页码跳转：程序化 goto 统一回到第 1 批（size 仍可调整批大小）。
  const targetPage = isScrollPaging.value ? 1 : page;
  if (typeof targetPage === "number" && targetPage > 0) {
    internalPage.value = targetPage;
    emit("update:page", targetPage);
  }
  if (typeof size === "number" && size > 0) {
    const clamped = clampPageSize(size, "goto()");
    internalPageSize.value = clamped;
    emit("update:pageSize", clamped);
  }
  resetScrollPaging();
  await nextTick();
  await dsReload();
}

/** 表格尺寸：紧凑模式 → small；mini 是比 small 更紧凑的第三档 */
const tableSize = computed<"default" | "small" | "mini">(() => {
  // size="small" 是页面里的历史写法（此前未被声明、静默失效），优先级高于设置面板的紧凑开关
  if (props.size === "small") return "small";
  if (props.size === "mini") return "mini";
  return localSettings.value.compact ? "small" : "default";
});

/** element 引擎能识别的档位：el-table 只有 large/default/small，mini 降格为 small + CSS 压薄 */
const elementTableSize = computed<"default" | "small">(() =>
  tableSize.value === "mini" ? "small" : tableSize.value,
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
  /**
   * 固定容器：调用方给表格外面套了一个「确定高度」的盒子，并用
   * {@code contain: layout size} 声明它「尺寸与内容无关」。此标记稳定地表示
   * 父容器高度不应从表格内容反向测量。
   *
   * <p>这种盒子必须走 CSS {@code height:100%} 把表格钉进去，<b>不能</b>退回下面的
   * 「量到最近滚动容器下沿」像素补偿：那个值取决于测量当刻的页面滚动位置，
   * RO 任意一次触发（数据渲染、窗口缩放、滚动引发的懒渲染……）都会把它改写成另一个高度，
   * 表格与外层滚动条随之反复重排 —— 正是「一页数据多、滚动时滚动条高度不停变」的抖动。</p>
   *
   * <p>判据用 {@code contain} 里的 {@code size}，而不是「内容是否溢出父容器」：
   * 溢出与否会随表格高度在「撑满 / 溢出」之间来回翻转（高度一旦等于容器就不再溢出），
   * 判据本身不稳定，会让 {@code 100%} 与像素补偿两条路径反复互切，抖动照旧。
   * {@code contain: size} 是调用方写死的声明，与当前高度无关，天然稳定。</p>
   */
  if (getComputedStyle(p).contain.includes("size")) {
    parentHeightUsable.value = true;
    viewportFillHeight.value = null;
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
 * 判断容器是否为「内容驱动型滚动盒」——即容易引发高度正反馈循环。
 *
 * <p>特征：
 *   1. {@code overflowY === 'auto'}且{@code height === ''}(未显式设定)
 *   2. {@code scrollHeight ≈ clientHeight + scrollTop}(内容刚好撑满可视区)
 *   3. 类名含"card"、"panel"等典型包装器特征
 * </p>
 *
 * <p>这类容器的高度完全取决于内部内容，一旦被 fill 回填就触发 ResizeObserver →
 * 高度涨高 → 再次触发 ResizeObserver 的死锁。</p>
 */
function isContentDrivenScrollContainer(el: HTMLElement): boolean {
  const cs = getComputedStyle(el);
  
  // 规则 1: 必须是 auto/scroll 滚动模式
  if (!/(auto|scroll)/.test(cs.overflowY)) return false;
  
  // 规则 2: 未显式设定 height (computed 值等于自动计算结果)
  if (el.style.height !== '' && el.style.height !== 'auto') return false;
  
  // 规则 3: 内容与可视区高度基本一致 (允许 5px 误差，边框/滚动条导致)
  const used = el.clientHeight;
  const content = el.scrollHeight;
  const diff = Math.abs(used - content);
  
  // 如果差值很小 (<8px)，说明是内容驱动的 → 排除
  return diff < 8;
}

/**
 * 量「本组件上沿 → 最近滚动容器可视下沿」之间的距离，作为 fill 的像素高度。
 *
 * <p>结果必须与「当前滚动位置」无关：用
 * {@code 容器可视下沿 - 组件上沿 - 容器 scrollTop}，
 * 把组件在容器内容坐标里的偏移量算成固定值。</p>
 *
 * <p>反面教材（修复前的写法）：直接 {@code 容器可视下沿 - 组件上沿}。
 * 它等于 {@code clientHeight + scrollTop - 组件在内容里的偏移}，会随滚动持续变大；
 * ResizeObserver 每次触发都把它当成新高度写回去，表格与外层滚动条就反复重排 ——
 * 「一页数据过多、滚动时滚动条高度一直变」的抖动即源于此。
 * 组件在内容中的偏移是不变的，减去 scrollTop 后测量值恒定，反馈回路自然断开。</p>
 *
 * <p>拿不到滚动容器时退回视口底部，保证「至少填到看得见的地方」。</p>
 */
function measureViewportFillHeight(): number | null {
  const root = rootRef.value;
  if (!root) return null;
  const top = root.getBoundingClientRect().top;
  const scroller = nearestScrollContainer(root);
  let bottom: number;
  let scrollTop = 0;
  if (scroller) {
    bottom = scroller.getBoundingClientRect().bottom;
    scrollTop = scroller.scrollTop;
  } else if (typeof window !== "undefined") {
    bottom = window.innerHeight;
    scrollTop = window.scrollY || document.documentElement?.scrollTop || 0;
  } else {
    return null;
  }
  // 减去已滚过的距离：无论页面滚到哪里，量出的都是「组件上沿到容器可视下沿」
  // 在内容坐标里的固定距离，避免高度随滚动位置漂移造成抖动。
  const h = Math.floor(bottom - top - scrollTop);
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

/* ==================== 加载遮罩定位（vxe 引擎） ==================== */

/**
 * 加载遮罩要盖的「表体可视区」矩形。
 *
 * <p>vxe 把加载层（路径 1 时是 {@code .vxe-loading}）渲染在**表格末尾**（表头之后、
 * 表体之前的那层的最后），没有绝对定位就跟着文档流排到了表格下方。
 * 这里给它补上 absolute 定位（相对 .vxe-table，它 position:relative），
 * 再用本函数量出的表体矩形把上边界/高度钉准 —— 遮罩只盖表体区域，
 * 表头保持可见（表头是列名，遮住反而让人失去上下文），转圈也稳定落在 body 正中。</p>
 *
 * <p>量的是<b>相对 .vxe-table</b> 的偏移（absolute 的 inset 用的是 containing block
 * 的坐标，不是视口坐标）—— 实测踩过：直接用视口坐标会让遮罩整体下移一个表头高度。</p>
 */
const loadingMaskStyle = ref<Record<string, string>>({});

/** 量一次表体可视区（相对表格根），写进 CSS 变量 */
function measureLoadingMask(): void {
  if (!useVxe.value) {
    if (Object.keys(loadingMaskStyle.value).length) loadingMaskStyle.value = {};
    return;
  }
  const table = rootRef.value?.querySelector(".vxe-table") as HTMLElement | null;
  const body = table?.querySelector(".vxe-table--body-wrapper") as HTMLElement | null;
  if (!table || !body) return;
  const tableRect = table.getBoundingClientRect();
  const bodyRect = body.getBoundingClientRect();
  // 表体在表格内的可视区（可能被父容器裁掉，取交集）
  const top = Math.max(bodyRect.top, tableRect.top);
  const bottom = Math.min(bodyRect.bottom, tableRect.bottom);
  const height = Math.max(0, bottom - top);
  if (height <= 0) return;
  const next = {
    // 相对表格根的上偏移（absolute 的 inset 参照 containing block = .vxe-table）
    "--rt-loading-top": `${Math.round(top - tableRect.top)}px`,
    "--rt-loading-height": `${Math.round(height)}px`,
  };
  const cur = loadingMaskStyle.value;
  if (cur["--rt-loading-top"] !== next["--rt-loading-top"] || cur["--rt-loading-height"] !== next["--rt-loading-height"]) {
    loadingMaskStyle.value = next;
  }
}

/** 加载态变化 → 重测（遮罩只有显示时才有意义） */
watch(
  () => [dataLoading.value, props.loading, useVxe.value] as const,
  () => {
    if (dataLoading.value || props.loading) {
      nextTick(() => requestAnimationFrame(measureLoadingMask));
    }
  },
  { immediate: true },
);

/** 窗口尺寸变化 → 遮罩矩形要跟着重算 */
function onLoadingMaskResize(): void {
  if (dataLoading.value || props.loading) measureLoadingMask();
}

onMounted(() => {
  window.addEventListener("resize", onLoadingMaskResize, { passive: true });
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", onLoadingMaskResize);
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

/**
 * vxe 引擎的表格内联样式：高度样式 + 加载遮罩的定位变量。
 *
 * <p>遮罩变量必须挂在**表格根元素**上：加载层（.vxe-loading）渲染在 .vxe-table 内，
 * CSS 变量沿 DOM 树向下继承，挂在根上它就能取到；而 absolute 的 containing block
 * 也正是 .vxe-table（position:relative），所以变量里的偏移是相对表格根的。</p>
 */
const vxeTableStyle = computed<Record<string, string> | undefined>(() => {
  const base = heightMinStyle.value;
  const mask = loadingMaskStyle.value;
  if (!base && !Object.keys(mask).length) return undefined;
  return { ...(base ?? {}), ...mask };
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

/* ========== 分页方式切换（页码菜单 / 滚动加载） ========== */

/** 候选分页方式（固定两档：切换意义只在「有页码」与「无页码」之间） */
const PAGINATION_MODE_OPTIONS: RePaginationMode[] = ["pager", "scroll"];
/** 档位文案（与引擎切换同为文字型分段控件：两档两个汉字，图形化反而难读） */
const PAGINATION_MODE_TEXT: Record<RePaginationMode, string> = { pager: "分页", scroll: "滚动" };
/** 悬浮提示：解释两档的差异，光看「分页/滚动」两个字不够 */
const PAGINATION_MODE_TIP: Record<RePaginationMode, string> = {
  pager: "页码分页：页码 + 每页条数菜单",
  scroll: "滚动分页：滚到底部自动加载下一批",
};

/**
 * 是否显示分页方式切换器。
 *
 * <p>三个条件：页面显式开了 {@code paginationModeSwitch}（与 layoutSwitch 同档设计——
 * 滚动分页不适合所有页面，入口由页面决定）；{@code pagination} 开着（不分页的表格
 * 全量直出，没有「分页方式」可言）；vxe 引擎（element 没有触底事件，切了也不生效，
 * 干脆不渲染这个控件，不留一个点了没反应的按钮）。</p>
 */
const showPaginationModeSwitch = computed<boolean>(
  () => paginationCfg.value.modeSwitch === true && paginationCfg.value.enable === true && useVxe.value,
);

/**
 * 用户点切换器。副作用（重置滚动状态 / 回第 1 批 / 持久化 / 重新取数）
 * 不在这里做，统一收在 watch(activePaginationMode)——存档恢复、受控改 props
 * 也要走同一套副作用，写在点击处就会漏掉那两条入口。
 */
function switchPaginationMode(key: RePaginationMode): void {
  if (key === activePaginationMode.value) return;
  activePaginationMode.value = key;
  emit("update:paginationMode", key);
}

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

/** 当前生效的引擎：优先跟 props.engine 走（v-model:engine 时由外部驱动），默认 vxe */
const currentEngine = computed<"element" | "vxe">(() => props.engine ?? "vxe");

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
const layoutIndexOffset = computed<number>(() => {
  // 滚动分页：视图模式下列表由第一页起累计，无需页码偏移
  if (isScrollPaging.value) return 0;
  return paginationCfg.value.enable ? Math.max(0, (internalPage.value - 1) * currentPageSize.value) : 0;
});

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

/** ========== 序号列 / 表尾合计 / 单元格合并 / 展开行（两引擎共用） ========== */

/** 序号列宽度（缺省 60） */
const indexWidthResolved = computed<string | number>(() => props.indexWidth ?? 60);
/** 展开列宽度（缺省 48） */
const expandWidthResolved = computed<string | number>(() => props.expandWidth ?? 48);
/** 序号列固定方式（element 认 boolean | 'left' | 'right'） */
const indexFixedResolved = computed<boolean | "left" | "right">(() => props.indexFixed ?? false);
/** 序号列固定方式（vxe 只认 'left' | 'right' | ''，不认 boolean） */
const vxeIndexFixed = computed<"left" | "right" | "">(() => {
  if (props.indexFixed === true) {
    return "left";
  }
  if (props.indexFixed === "left" || props.indexFixed === "right") {
    return props.indexFixed;
  }
  return "";
});

/**
 * 序号起始值：跨页连续时按 {@code (page-1) * pageSize} 偏移。
 *
 * <p>element 引擎走 {@code type="index"} 列的 {@code :index} 函数；
 * vxe 引擎走 {@code seqConfig.startIndex}（源码渲染为
 * {@code (startIndex || 0) + seq}，seq 从 1 起）。两边同源，
 * 保证连续编号在切换引擎时一致。</p>
 */
const indexStart = computed<number>(() => {
  // 滚动分页：累计列表本身从第 1 条开始（第一页就从 1 开始，不需要按页码偏移）
  if (isScrollPaging.value) return 0;
  if (!props.indexContinuous) {
    return 0;
  }
  const page = internalPage.value || paginationCfg.value.page || 1;
  return Math.max(0, (page - 1) * currentPageSize.value);
});

/**
 * element 序号列取号：全局序号 = 起始值 + 行下标 + 1。
 *
 * @param rowIndex element 传入的行下标（从 0 起）
 * @returns 展示用序号
 */
function elementIndexMethod(rowIndex: number): number {
  return indexStart.value + rowIndex + 1;
}

/** vxe 序号配置：startIndex 即全局序号起点 */
const vxeSeqConfig = computed(() => ({ startIndex: indexStart.value }));

/**
 * 默认表尾取值：对可见列里的数值列求和，其余留空。
 *
 * @param data 当前页数据
 * @returns 每个可见列一格的值
 */
function defaultSummaryValues(data: Array<Record<string, unknown>>): Array<string | number> {
  return visibleColumns.value.map((col) => {
    let sum = 0;
    let has = false;
    for (const row of data) {
      const raw = row[col.prop];
      if (raw === null || raw === undefined || raw === "") {
        continue;
      }
      const n = typeof raw === "number" ? raw : Number(raw);
      if (Number.isFinite(n)) {
        sum += n;
        has = true;
      }
    }
    return has ? sum : "";
  });
}

/**
 * 计算表尾一行：优先用户 summaryMethod，否则用默认数值求和。
 *
 * @param data 当前页数据
 * @returns 每个可见列一格的值
 */
function summaryValues(data: Array<Record<string, unknown>>): Array<string | number> {
  if (typeof props.summaryMethod === "function") {
    return props.summaryMethod({ columns: visibleColumns.value, data });
  }
  return defaultSummaryValues(data);
}

/**
 * element 的 summary-method：入参 columns 含选择 / 序号 / 展开等前置列，
 * 需把它们映射成空串，数据列按 visibleColumns 顺序取合计值。
 *
 * @param params element 传入的 { columns, data }
 * @returns 与 element 列一一对应的表尾单元格值
 */
function elementSummaryMethod(params: {
  columns: Array<{ property?: string }>;
  data: Array<Record<string, unknown>>;
}): Array<string> {
  const values = summaryValues(params.data);
  return params.columns.map((col) => {
    const prop = col.property;
    if (!prop) {
      return "";
    }
    const idx = visibleColumns.value.findIndex((c) => c.prop === prop);
    if (idx < 0) {
      return "";
    }
    const v = values[idx];
    // element 的 summary-method 只接受 string | VNode，数值需转成字符串
    return v === undefined || v === null ? "" : String(v);
  });
}

/**
 * vxe 的 footer-method：返回二维数组（一行表尾），同样跳过非数据列。
 *
 * @param params vxe 传入的 { columns, data }
 * @returns 仅含一行的表尾二维数组
 */
function vxeFooterMethod(params: {
  columns: Array<{ field?: string }>;
  data: Array<Record<string, unknown>>;
}): Array<Array<string | number>> {
  const values = summaryValues(params.data);
  const row = params.columns.map((col) => {
    const field = col.field;
    if (!field) {
      return "";
    }
    const idx = visibleColumns.value.findIndex((c) => c.prop === field);
    return idx >= 0 ? values[idx] ?? "" : "";
  });
  return [row];
}

/**
 * 把用户的合并结果收口成 {@code { rowspan, colspan }}（两引擎都接受对象形态）。
 *
 * @param result 用户返回值（数组 / 对象 / 空）
 * @returns 规范化后的合并信息，空表示不合并
 */
function normalizeSpan(
  result: [number, number] | { rowspan: number; colspan: number } | undefined | void,
): { rowspan: number; colspan: number } | undefined {
  if (!result) {
    return undefined;
  }
  if (Array.isArray(result)) {
    return { rowspan: result[0], colspan: result[1] };
  }
  return { rowspan: result.rowspan, colspan: result.colspan };
}

/**
 * 按列 prop 定位 ReTableColumn 并回调用户合并规则。
 *
 * @param row 当前行
 * @param rowIndex 当前行下标
 * @param prop 引擎传入的列字段名
 * @param cellValue 单元格原始值
 * @returns 规范化后的合并信息
 */
function resolveSpan(
  row: Record<string, unknown>,
  rowIndex: number,
  prop: string | undefined,
  cellValue: unknown,
): { rowspan: number; colspan: number } | undefined {
  if (!props.spanMethod || !prop) {
    return undefined;
  }
  const colIndex = visibleColumns.value.findIndex((c) => c.prop === prop);
  if (colIndex < 0) {
    return undefined;
  }
  const column = visibleColumns.value[colIndex];
  return normalizeSpan(
    props.spanMethod({ row, rowIndex, column, columnIndex: colIndex, cellValue }),
  );
}

/**
 * element 的 span-method 适配。
 *
 * @param params element 传入的 { row, rowIndex, column }
 * @returns 合并信息
 */
function elementSpanMethod(params: {
  row: Record<string, unknown>;
  rowIndex: number;
  column?: { property?: string };
}): { rowspan: number; colspan: number } | undefined {
  const prop = params.column?.property;
  return resolveSpan(params.row, params.rowIndex, prop, prop ? params.row[prop] : undefined);
}

/**
 * vxe 的 span-method 适配。
 *
 * @param params vxe 传入的 { row, rowIndex, column }
 * @returns 合并信息
 */
function vxeSpanMethod(params: {
  row: Record<string, unknown>;
  rowIndex: number;
  column?: { field?: string };
}): { rowspan: number; colspan: number } | undefined {
  const field = params.column?.field;
  return resolveSpan(params.row, params.rowIndex, field, field ? params.row[field] : undefined);
}

/** ========== vxe 虚拟滚动 / 区域选择 · 列拖拽排序（两引擎） ========== */

/** vxe 列配置：resizable + 可选列拖拽 */
const vxeColumnConfig = computed(() => ({
  resizable: borderResizable.value,
  drag: props.columnDraggable,
}));

/**
 * vxe 纵向虚拟滚动配置。
 *
 * <p>virtualScroll 开启时沿用现有 enabled/gt；滚动分页则只补 threshold 提前量，
 * 依赖 vxe 原生 scroll-boundary 判断（threshold 单独设置不会打开虚拟滚动）。
 * 两者可并存，scroll 模式不会擅自把用户没开的虚拟滚动打开。</p>
 *
 * <p><b>行数阈值自动启用</b>：页面没显式传 {@code virtualScroll} 且当前渲染行数
 * 超过 {@link AUTO_VIRTUAL_SCROLL_GT} 时自动打开（仅 vxe），避免大数据量表
 * 全量铺 DOM 卡死 —— 虚拟滚动下 vxe 只渲染可视区行，对半透明效果与行高无副作用。
 * 自动启用会在 dev 下提示一次，便于定位「行数没那么多怎么也开了」的疑问。</p>
 */
const AUTO_VIRTUAL_SCROLL_GT = 500;
const autoVirtualHinted = { value: false };
const autoVirtualScroll = computed(() => {
  if (props.virtualScroll || !useVxe.value) return false;
  // 虚拟滚动的收益只与「实际渲染的行数」有关，看 pagedRows（本地切片 / 远程当前批）
  return (pagedRows.value?.length ?? 0) > AUTO_VIRTUAL_SCROLL_GT;
});

const vxeVirtualYConfig = computed(() => {
  let base: { enabled?: boolean; gt?: number } = {};
  if (props.virtualScroll) {
    base = { enabled: true, gt: Math.max(0, props.virtualScrollGt) };
  } else if (autoVirtualScroll.value) {
    base = { enabled: true, gt: AUTO_VIRTUAL_SCROLL_GT };
    if (import.meta.env.DEV && !autoVirtualHinted.value) {
      autoVirtualHinted.value = true;
      console.info(
        `[ReTable] 当前渲染行数超过 ${AUTO_VIRTUAL_SCROLL_GT}，已自动启用 vxe 虚拟滚动（virtualScroll 未显式配置）。` +
          `如需固定行为请显式传 :virtual-scroll="true" 或 "false"。`,
      );
    }
  }
  if (isScrollPaging.value) {
    return { ...base, threshold: SCROLL_BOUNDARY_THRESHOLD };
  }
  return Object.keys(base).length > 0 ? base : undefined;
});

/** vxe 区域选择 · 鼠标配置（area 打开框选） */
const vxeMouseConfig = { area: true };
/** vxe 区域选择 · 区域配置（多区域 + 点击表格外自动清除） */
const vxeAreaConfig = { multiple: true, showActionMsg: true, autoClear: true };
/** vxe 区域选择 · 键盘配置（复制 / 粘贴 / 剪切依赖 isClip） */
const vxeKeyboardConfig = { isClip: true };
/** vxe 列拖拽配置（同级列拖拽 + 辅助状态） */
const vxeColumnDragConfig = { isPeerDrag: true, showGuidesStatus: true, animation: false };

/** element 引擎不支持虚拟滚动 / 区域选择：开启只提示，不假装生效 */
watch(
  [() => props.virtualScroll, () => props.areaSelect, useVxe],
  ([virtual, area, vxe]) => {
    if (!vxe && (virtual || area) && import.meta.env.DEV) {
      console.warn("[ReTable] virtualScroll / areaSelect 仅 vxe 引擎支持，当前为 element 引擎，已忽略。");
    }
  },
  { immediate: true },
);

/**
 * 应用新的可见列顺序：可见列按新顺序排列，隐藏 / 未出现的列保持原相对顺序追加在后。
 *
 * @param newVisibleOrder 新的可见列 prop 顺序
 */
function applyColumnOrder(newVisibleOrder: string[]): void {
  if (!newVisibleOrder.length) {
    return;
  }
  const rest = columnState.value.order.filter((p) => !newVisibleOrder.includes(p));
  const next = [...newVisibleOrder, ...rest];
  if (next.join("|") === columnState.value.order.join("|")) {
    return;
  }
  columnState.value = { ...columnState.value, order: next };
  saveColumnState();
  emit("column-order-change", next);
}

/**
 * vxe 列拖拽结束：vxe 已先行重排内部列，这里从实例读回权威顺序再落状态。
 *
 * <p>时序坑：vxe 在 dragend 处理器里<b>同步</b>分发 column-dragend，
 * 此刻内部 collectColumn 虽已 splice，但 {@code getColumns()} 的数据源
 * {@code internalData.visibleColumn} 要等随后的 nextTick 链
 * （handleColDragSwapColumn → 渲染）才更新——事件回调里直接读拿到的
 * 是旧序，applyColumnOrder 的守卫会 early-return，等于永远不落盘
 * （实测：拖拽后 DOM 已换位、localStorage 却无记录）。故延后到宏任务，
 * 等 vxe 的重排与渲染全部落地再读权威顺序。</p>
 */
function onVxeColumnDragEnd(): void {
  setTimeout(() => {
    void nextTick().then(() => {
      const inst = vxeTableRef.value as unknown as
        | { getColumns?: () => Array<{ field?: string }> }
        | null;
      const cols = inst?.getColumns?.();
      if (!cols || !cols.length) {
        return;
      }
      const newVisible = cols
        .map((c) => c.field)
        .filter((f): f is string => typeof f === "string" && f.length > 0);
      applyColumnOrder(newVisible);
    });
  }, 0);
}

/** element 表头排序实例 */
const headerSortableInstance = ref<ReturnType<typeof Sortable.create> | null>(null);

/** 销毁 element 表头拖拽 */
function destroyHeaderSortable(): void {
  headerSortableInstance.value?.destroy();
  headerSortableInstance.value = null;
}

/**
 * element 引擎：在表头行上启用列拖拽排序。
 *
 * <p>只允许拖数据列：前置的选择 / 序号 / 展开列保持原顺序固定在左侧，
 * 用「表头单元格总数 − 可见数据列数」算出前置偏移量，索引小于偏移量的一律不可拖、
 * 也不接受落点。最终顺序写入组件自己的 columnState（与列设置面板同源）。</p>
 */
async function initHeaderSortable(): Promise<void> {
  destroyHeaderSortable();
  if (!props.columnDraggable || useVxe.value || activeLayout.value !== "table") {
    return;
  }
  await nextTick();
  const tableEl = currentTableEl();
  const tr = tableEl?.querySelector<HTMLElement>(".el-table__header-wrapper thead tr") ?? null;
  if (!tr) {
    return;
  }
  // 表头单元格由 element-plus 异步注册列后渲染，初挂载时 tr 可能是空的。
  // Sortable 对子节点是事件委托，先绑上即可；前置偏移量在回调里**实时**计算，
  // 因此列稍后才出现也不影响判断（若在绑定时算死偏移量，空表头会得到 0，
  // 之后所有列都会被误判成「数据列」，前置列也能被拖动）。
  const ths = (): HTMLElement[] => Array.from(tr.children) as HTMLElement[];
  const leadOffset = (): number => Math.max(0, ths().length - visibleColumns.value.length);
  const isLead = (el: HTMLElement | null): boolean => {
    const index = el ? ths().indexOf(el) : -1;
    return index >= 0 && index < leadOffset();
  };
  headerSortableInstance.value = Sortable.create(tr, {
    animation: 150,
    draggable: "th",
    filter: (_evt, target) => isLead(target as HTMLElement),
    onMove: (evt) => !isLead(evt.related as HTMLElement),
    onEnd: ({ oldIndex, newIndex }) => {
      if (oldIndex === undefined || newIndex === undefined) {
        return;
      }
      const offset = leadOffset();
      const from = oldIndex - offset;
      const to = newIndex - offset;
      const visibleOrder = visibleColumns.value.map((c) => c.prop);
      if (from < 0 || to < 0 || from >= visibleOrder.length || to >= visibleOrder.length || from === to) {
        return;
      }
      const [moved] = visibleOrder.splice(from, 1);
      visibleOrder.splice(to, 0, moved);
      applyColumnOrder(visibleOrder);
    },
  });
}

/** 列拖拽条件 / 引擎 / 布局 / 可见列变化时重挂表头排序 */
watch(
  () =>
    [
      props.columnDraggable,
      useVxe.value,
      activeLayout.value,
      visibleColumns.value.map((c) => c.prop).join("|"),
    ] as const,
  () => {
    if (useVxe.value) {
      destroyHeaderSortable();
    } else {
      void initHeaderSortable();
    }
  },
  { flush: "post" },
);
onMounted(() => {
  if (!useVxe.value) {
    void initHeaderSortable();
  }
});
onBeforeUnmount(destroyHeaderSortable);

defineExpose({
  reload,
  goto,
  resetColumns,
  clearCache,
  clearAllSelection,
  toggleBatchSelect,
  getSelectedRows: () => allSelectedRows.value,
  getEditCache: () => editCache.value,
  getEditedRows: () => editedRows.value,
  saveEdits,
  clearEditCache,
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

/**
 * 分组配置与旧 toolbarConfig 的合并视图。
 *
 * <p>优先级：{@code config.toolbar} > 旧 {@code toolbarConfig} prop。**只覆盖显式写了值的字段**，
 * 分组对象里没出现的键不会把旧配置冲成 undefined —— 否则「只写 config.toolbar.refresh」
 * 会顺手把 batchDelete 等全部抹掉。</p>
 */
const mergedToolbarConfig = computed<ReTableToolbarConfig>(() => {
  const base: ReTableToolbarConfig = { ...(props.toolbarConfig ?? {}) };
  const group = props.config?.toolbar;
  if (!group) return base;
  for (const [key, value] of Object.entries(group)) {
    if (value !== undefined) (base as Record<string, unknown>)[key] = value;
  }
  return base;
});

/** 工具栏是否启用：分组里的 enable 优先于旧的顶层 toolbar prop */
const toolbarEnabled = computed<boolean>(() => props.config?.toolbar?.enable ?? props.toolbar);

/**
 * 把「布尔 | 按钮配置对象」归一成按钮配置。
 *
 * @param value 配置值
 * @returns enabled + 可选覆盖项
 */
function normalizeButton(value: boolean | ReTableToolbarButton | undefined): {
  enabled: boolean;
  tip?: string;
  icon?: any;
  handler?: () => void | Promise<void>;
} {
  if (value === false) return { enabled: false };
  if (value === true || value === undefined) return { enabled: true };
  return {
    enabled: value.enable !== false,
    tip: value.tip,
    icon: value.icon,
    handler: value.handler,
  };
}

function isBatchEnabled(val: unknown): boolean {
  if (!val) return false;
  if (val === true) return true;
  if (typeof val === "object" && val !== null && "enabled" in val) return (val as any).enabled !== false;
  return Boolean(val);
}
const hasToolbarConfig = computed(() => {
  const cfg = mergedToolbarConfig.value;
  if (!cfg) return false;
  return isBatchEnabled(cfg.batchDelete) || isBatchEnabled(cfg.batchSelect) || isBatchEnabled(cfg.batchEdit);
});

/**
 * 是否配置了任一批量动作。
 *
 * <p>勾选列与行可选性都以此为准：只要配了 batchDelete / batchSelect / batchEdit 之一，
 * 复选框就应该出现 —— 否则「配了批量删除函数，却要点一次按钮才长出勾选框」，
 * 而且行还不可选（`selectable` 原先只认 batchSelect），功能等于不可用。</p>
 */
const batchActionEnabled = computed<boolean>(() => {
  const cfg = mergedToolbarConfig.value;
  if (!cfg) return false;
  return isBatchEnabled(cfg.batchDelete) || isBatchEnabled(cfg.batchSelect) || isBatchEnabled(cfg.batchEdit);
});

const toolbarConfigPosition = computed<"top" | "bottom">(() => mergedToolbarConfig.value?.position ?? "top");

/**
 * 合并后的 toolbar 配置（传给 ReTableToolbar）。
 * 列设置面板只在传入 `:columns` prop 时才渲染（ReTable 的 #column-settings 槽内
 * ElPopover 有 `v-if="props.columns.length > 0"`）。若列由 `<ReTableColumn>` 子节点
 * 声明（props.columns 为空），该槽为空内容，ReTableToolbar 会回退渲染一个没有
 * @click 的裸 ReButton —— 点击只出 tooltip、面板永不打开，即死按钮。
 * 因此在没有 columns prop 时显式关闭列设置入口，让按钮整体不渲染，
 * 而不是渲染一个不可用的按钮。
 */
const effectiveToolbarConfig = computed<ReTableToolbarConfig>(() => {
  const cfg = mergedToolbarConfig.value;
  const canConfigureColumns = props.columns.length > 0;

  /**
   * `toolbar=false` ⇒ 三个工具按钮全部不渲染。
   *
   * <p>prop 注释写的是「是否显示工具栏（刷新 / 列设置 / 表格设置）」，
   * 但此前这里根本没接 `toolbar`：页面传 `:toolbar="false"` 后刷新/列设置/表格设置
   * 照旧渲染，**与文档相反**。顶部批量条（`re-table__toolbar-top`）当时却已经用
   * `toolbar &&` 门控了，同一个 prop 对两处工具栏给出相反结果。</p>
   *
   * <p>实测踩坑三处（均为「要分页、不要工具栏」的意图）：
   * `ScSessionTab.vue`、`MarkingView.vue`、`CollectTaskView.vue` 日志表。</p>
   *
   * <p>批量按钮一并关掉：本 prop 的 toolbarConfig 注释已写明「toolbar=true 时生效」，
   * 且 `isBatchEnabled` 对 `false` 返回 false，语义一致。</p>
   */
  if (!toolbarEnabled.value) {
    return {
      ...cfg,
      refresh: false,
      columnSettings: false,
      tableSettings: false,
      batchDelete: false,
      batchSelect: false,
      batchEdit: false,
    };
  }

  return {
    ...cfg,
    // 本地模式（data 传数组）没有可重新拉取的东西：useDataSource 的 reload
    // 只是把同一个数组再赋值一次，不发请求、不改 DOM —— 按钮点下去
    // 「什么都不发生」，是一个可见、可点、永远无效的控件。
    // 实测 2026-10-12 在 etcd 管理页被抓到：ReTable 工具栏的「刷新」
    // 就是这样一个死按钮（全模块按钮扫描逐个点击时暴露）。
    //
    // 远程模式（loader / data 传函数）下 reload 才有意义，保持页面显式配置优先，
    // 因此只在本地模式下强制关掉，不覆盖页面主动打开的意图。
    //
    // 用 normalizeButton 判断而不是 `!== false`：按钮配置现在可以是对象，
    // 传了 `{ enable: false }` 同样要关掉，否则按钮会显示成可点却什么都不做。
    refresh: isRemote.value && normalizeButton(cfg.refresh).enabled ? cfg.refresh : false,
    columnSettings:
      canConfigureColumns && normalizeButton(cfg.columnSettings).enabled ? cfg.columnSettings : false,
  };
});

const batchSelectTip = computed(() => {
  const cfg = mergedToolbarConfig.value?.batchSelect;
  if (!cfg || cfg === true) return "批量选择";
  return cfg.tip || "批量选择";
});

/**
 * 分页行（footer）使用的工具栏配置。
 *
 * <p><b>保留刷新</b>：ReTable 的布局里，`position='top'` 时顶部那一条只渲染批量区
 * （`mode="batch"`），刷新/列设置/表格设置都在分页行 —— 也就是分页行这枚刷新是
 * **唯一入口**，从它身上移走会直接让表格失去刷新能力。</p>
 *
 * <p>确实不需要它的页面（自带页面级刷新）可以显式关：
 * {@code :config="{ toolbar: { refresh: false } }"} 或旧的
 * {@code :toolbar-config="{ refresh: false }"}。分页行右侧另外还有「快捷键帮助」入口。</p>
 */
const footerToolbarConfig = computed<ReTableToolbarConfig>(() => ({
  ...effectiveToolbarConfig.value,
}));

const batchDeleteTip = computed(() => {
  const cfg = mergedToolbarConfig.value?.batchDelete;
  if (!cfg || cfg === true) return "批量删除";
  return cfg.tip || "批量删除";
});

const batchEditTip = computed(() => {
  const cfg = mergedToolbarConfig.value?.batchEdit;
  if (!cfg || cfg === true) return "批量修改";
  return cfg.tip || "批量修改";
});

/** 工具栏按钮图标（来自 @element-plus/icons-vue）
 *  列设置 / 表格设置 / 刷新已改用 anim: 动画图标（见模板），这里只留还在用的。 */
const iconDelete = Delete;
const iconEdit = Edit;
const iconCheck = Check;
const iconSelect = Select;
</script>

<template>
  <div
    ref="rootRef"
    class="re-table"
    @mouseover="onCrosshairOver"
    @mouseenter="onRootMouseenter"
    @mouseleave="onRootMouseleave"
    @focusin="keyboardFocused = true"
    @focusout="onRootFocusout"
    :class="{
      're-table--empty': isEmpty,
      're-table--compact': tableSize === 'small',
      're-table--mini': tableSize === 'mini',
      're-table--separated': searchSeparated,
      're-table--fixed-height': hasFixedHeight || fillActive,
      're-table--fill': fillActive,
      're-table--engine-element': !useVxe,
      're-table--engine-vxe': useVxe,
      're-table--crosshair': crosshairOn,
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
          >
            <!-- 搜索条左侧导航插槽：把顶部页签 / 切换菜单合并进来 -->
            <template v-if="$slots['search-nav']" #nav>
              <slot name="search-nav" />
            </template>
          </ReSearch>
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
      v-if="$slots.toolbar || searchEnabled || showDragToggle || batchDelete || editable || autoRefresh || showPaginationModeSwitch || showLayoutSwitch || debug"
      class="re-table__toolbar-row"
    >
      <div v-if="$slots.toolbar" class="re-table__toolbar-left">
        <slot name="toolbar" />
      </div>
      <div
        v-if="searchEnabled || showDragToggle || batchDelete || editable || autoRefresh || showLayoutSwitch || debug"
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
        <!-- 可编辑模式：有改动时出现保存入口（值走 v-model:edit-cache / edit-save 交给页面） -->
        <el-button
          v-if="editable && hasEdits"
          type="primary"
          :loading="batchProcessing"
          @click="saveEdits"
        >
          保存编辑<span v-if="editedRows.length" class="re-table__sel-badge">{{ editedRows.length }}</span>
        </el-button>
        <ReButton
          v-if="batchDelete"
          layout="square"
          icon="Delete"
          :tip="batchDeleteMode ? '退出批量删除' : '批量删除'"
          :type="batchDeleteMode ? 'primary' : ''"
          @click="toggleBatchDeleteMode"
        />
        <ReButton
          v-if="showDragToggle"
          layout="square"
          icon="Rank"
          :tip="dragMode ? '退出拖拽' : '拖拽排序'"
          :type="dragMode ? 'primary' : ''"
          @click="toggleDragMode"
        />
        <ReButton
          v-if="searchEnabled && (searchConfig.showToggle ?? true)"
          layout="square"
          :icon="searchVisible ? 'Hide' : 'View'"
          :tip="searchVisible ? '隐藏搜索' : '显示搜索'"
          @click="searchVisible = !searchVisible"
        />
        <!-- 刷新：动画刷新图标（hover 播上游动效，loading 态整体旋转） -->
        <ReButton
          layout="square"
          icon="anim:tabler:refresh"
          :anim-icon-size="16"
          tip="刷新"
          :loading="dataLoading || loading"
          @click="onBuiltinSearchRefresh"
        />
        <!-- 自动刷新：ReSwitch(popover) —— 纯 ReButton(square) 作入口，点开是按参考图排版的档位浮层。
             标题行「自动刷新频率 + 状态徽标」→ 档位菜单（主标题 + 副说明两行）→ 底部倒计时说明。
             档位即状态：选中哪档就是哪个间隔；title 承担无障碍名（「自动刷新：已关闭」/「自动刷新中：每 N 秒」）。 -->
        <ReSwitch
          v-if="autoRefresh"
          v-model="autoRefreshMs"
          layout="popover"
          icon="Timer"
          :title="autoRefreshStateText"
          :popover-width="268"
          :popover-padding="8"
        >
          <div class="re-table__auto-refresh-head">
            <span class="re-table__auto-refresh-title">自动刷新频率</span>
            <span
              class="re-table__auto-refresh-badge"
              :class="autoRefreshMs > 0 ? 'is-on' : 'is-off'"
            >{{ autoRefreshMs > 0 ? "已开启" : "已关闭" }}</span>
          </div>
          <ReSelect v-model="autoRefreshValue" layout="square" vertical :data="autoRefreshOptions" />
          <div class="re-table__auto-refresh-hint">
            <template v-if="autoRefreshShowCountdown && autoRefreshMs > 0">
              选中即生效，表格将按间隔自动重取当前页；<strong class="re-table__auto-refresh-next">下次刷新 {{ autoRefreshCountdown }} 秒后</strong>。切到其他标签页时自动暂停。
            </template>
            <template v-else>选中即生效，表格按该间隔自动重取当前页</template>
          </div>
        </ReSwitch>
        <!-- 分页方式切换：仅 vxe + pagination + 页面显式开启时展示。
             放布局切换左侧，保留既有「布局切换是工具区最后一个控件」的结构约定。 -->
        <div
          v-if="showPaginationModeSwitch"
          class="re-table__layout-switch re-table__pagination-mode-switch"
          role="group"
          aria-label="分页方式切换"
        >
          <button
            v-for="key in PAGINATION_MODE_OPTIONS"
            :key="key"
            type="button"
            class="re-table__layout-switch-item re-table__layout-switch-item--text"
            :class="{ 'is-active': activePaginationMode === key }"
            :aria-pressed="activePaginationMode === key"
            :title="PAGINATION_MODE_TIP[key]"
            @click="switchPaginationMode(key)"
          >
            {{ PAGINATION_MODE_TEXT[key] }}
          </button>
        </div>
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

    <!-- 顶部工具栏（当 toolbarConfig.position === 'top' 时）：只放批量操作按钮，工具区在分页行。
         config 必须用合并视图：直接写 toolbarConfig 会落到旧 prop 上，分组配置里的
         config.toolbar.batchDelete 就传不进来，表现为「配了批量删除却没有按钮」。 -->
    <div v-if="toolbarEnabled && hasToolbarConfig && toolbarConfigPosition === 'top'" class="re-table__toolbar-top">
      <ReTableToolbar
        mode="batch"
        :config="effectiveToolbarConfig"
        :selected-count="selectedCount"
        :editing="editing"
        :processing="batchProcessing"
        :loading="dataLoading || loading"
        :size="tableSize"
        @batch-delete="onBatchDelete"
        @batch-edit="onBatchEdit"
        @batch-save="onBatchSave"
        @batch-select-toggle="toggleBatchSelect"
      />
    </div>

    <!-- ==================== ENGINE: element (BEGIN) ====================
         删除 element 引擎支持时，需要一起清掉：
           1. 本块（<ElTable> … </ElTable>，含上方注释）
           2. 下一支 VxeTable 的 `v-else-if="activeLayout === 'table'"` → 改成 `v-if`
           3. <style src="./engines/element/element-table.css"> 那一整行，以及 engines/element/ 目录
           4. 脚本里 `useVxe.value ? … : …` 的 element 侧分支（共 7 处，均已标注）
           5. Sortable 行拖拽（initSortable / destroySortable / onEnd 一段，已标注）
           6. import 里的 ElTable / ElTableColumn / type TableColumnCtx
         ================================================================== -->
    <!-- 表格模式 · element 引擎（engine="element" 兼容回退；默认是 vxe）：el-table，行拖拽走 Sortable 直改 tbody -->
    <ElTable
      v-if="!useVxe && activeLayout === 'table'"
      ref="elTableRef"
      v-bind="$attrs"
      v-loading="loading || dataLoading"
      :data="pagedRows"
      :highlight-current-row="localSettings.highlightCurrentRow ?? false"
      :stripe="localSettings.stripe ?? false"
      :border="localSettings.border ?? true"
      :size="elementTableSize"
      :row-key="rowKey"
      :show-header="layoutTable?.showHeader ?? true"
      :height="resolvedHeight"
      :max-height="resolvedMaxHeight"
      :style="heightMinStyle"
      :tree-props="effectiveTreeProps"
      :default-expand-all="defaultExpandAll"
      :show-summary="showSummary"
      :summary-method="showSummary ? elementSummaryMethod : undefined"
      :span-method="spanMethod ? elementSpanMethod : undefined"
      :row-style="rowDraggable || dragMode ? { cursor: 'grab' } : undefined"
      @row-click="(row: Record<string, unknown>) => emit('row-click', row)"
      @cell-click="(row: Record<string, unknown>, column: TableColumnCtx<Record<string, unknown>>, cell: HTMLTableCellElement, event: PointerEvent) => onCellClick(row, column, cell, event)"
      @row-contextmenu="(row: Record<string, unknown>, column: TableColumnCtx<Record<string, unknown>> | null, event: PointerEvent) => onRowContextMenu(row, column, event)"
      @cell-contextmenu="(row: Record<string, unknown>, column: TableColumnCtx<Record<string, unknown>>, cell: HTMLTableCellElement, event: PointerEvent) => onCellContextMenu(row, column, cell, event)"
      @header-contextmenu="(column: TableColumnCtx<Record<string, unknown>>, event: PointerEvent) => onHeaderContextMenu(column, event)"
      @selection-change="onSelectionChange"
      @header-dragend="onElementHeaderDragend"
      @sort-change="(payload: any) => onSortChange(payload)"
    >
      <!-- 批量选择 checkbox 列（配置了任一批量动作 / 批量选择模式 / 常驻选择） -->
      <ElTableColumn
        v-if="selectionEnabled || batchActionEnabled || batchSelectActive || batchDeleteMode"
        type="selection"
        width="50"
        fixed="left"
      />
      <!-- 展开行：展开内容由 #expand 插槽提供（不传插槽时行不可展开，仅显示图标列） -->
      <ElTableColumn v-if="expandable" type="expand" :width="expandWidthResolved">
        <template #default="{ row: expandRow }">
          <slot name="expand" :row="expandRow" />
        </template>
      </ElTableColumn>
      <!-- 序号列：type=index + 自定义取号，实现跨页连续编号 -->
      <ElTableColumn
        v-if="showIndex"
        type="index"
        :label="indexLabel"
        :width="indexWidthResolved"
        :align="indexAlign"
        :fixed="indexFixedResolved"
        :index="elementIndexMethod"
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
          :width="colWidth(col)"
          :min-width="col.minWidth"
          :max-width="col.maxWidth"
          :fixed="col.fixed"
          :align="col.align"
          :sortable="col.sortable"
          :resizable="col.resizable ?? borderResizable"
          :show-overflow-tooltip="col.showOverflowTooltip"
          :class-name="col.className"
        >
          <template #default="scope">
            <!-- el-table 会用 {row:{}, $index:-1} 空跑一次默认插槽做列发现，此时不挂载单元格控件，避免脏值回写 -->
            <slot
              v-if="Number(scope.$index) > -1"
              :name="resolveColSlotName(col)"
              :row="scope.row"
              :value="scope.row[col.prop]"
              :editing="editing"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn
          v-else
          :prop="col.prop"
          :label="col.label"
          :width="colWidth(col)"
          :min-width="col.minWidth"
          :max-width="col.maxWidth"
          :fixed="col.fixed"
          :align="col.align"
          :sortable="col.sortable"
          :resizable="col.resizable ?? borderResizable"
          :show-overflow-tooltip="col.showOverflowTooltip"
          :class-name="col.className"
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
      <!-- 空态：未提供 #empty 插槽时回落到 el-empty（保持既有行为）
           加载窗口内不渲染：loading 期间数据还没到，先画空态会在遮罩下闪「暂无数据」 -->
      <template #empty>
        <slot name="empty" :description="emptyText">
          <el-empty v-if="!loading && !dataLoading" :description="emptyText" :image-size="96" />
        </slot>
      </template>
      <slot />
    </ElTable>
    <!-- ==================== ENGINE: element (END) ==================== -->

    <!-- ==================== ENGINE: vxe (BEGIN) ==================== -->
    <!-- 表格模式 · vxe 引擎（默认，2026-10-07 起）：固定表头 / 虚拟滚动场景 -->
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
      :style="vxeTableStyle"
      :row-config="vxeRowConfig"
      :column-config="vxeColumnConfig"
      :checkbox-config="vxeCheckboxConfig"
      :sort-config="vxeSortConfig"
      :menu-config="vxeMenuConfig"
      :edit-config="vxeEditConfig"
      :tree-config="vxeTreeConfig"
      :seq-config="vxeSeqConfig"
      :virtual-y-config="vxeVirtualYConfig"
      :mouse-config="areaSelect ? vxeMouseConfig : undefined"
      :area-config="areaSelect ? vxeAreaConfig : undefined"
      :keyboard-config="areaSelect && areaClip ? vxeKeyboardConfig : undefined"
      :column-drag-config="columnDraggable ? vxeColumnDragConfig : undefined"
      :show-footer="showSummary"
      :footer-method="showSummary ? vxeFooterMethod : undefined"
      :span-method="spanMethod ? vxeSpanMethod : undefined"
      :row-style="rowDraggable || dragMode ? { cursor: 'grab' } : undefined"
      @cell-click="onVxeCellClick"
      @cell-menu="onVxeCellMenu"
      @header-cell-context-menu="onVxeHeaderCellContextMenu"
      @checkbox-change="onVxeCheckboxChange"
      @checkbox-all="onVxeCheckboxAll"
      @sort-change="onVxeSortChange"
      @row-dragend="onVxeRowDragEnd"
      @column-dragend="onVxeColumnDragEnd"
      @resizable-change="onVxeResizableChange"
      @scroll-boundary="onVxeScrollBoundary"
    >
      <!-- 勾选列：常驻选择 / 批量选择 / 任一批量动作配置 共用一列 -->
      <VxeColumn
        v-if="selectionEnabled || batchActionEnabled || batchSelectActive || batchDeleteMode"
        type="checkbox"
        width="50"
        fixed="left"
      />
      <!-- 展开行：vxe 用 type=expand 列，展开内容走 #content 插槽 -->
      <VxeColumn v-if="expandable" type="expand" :width="expandWidthResolved">
        <template #content="{ row: expandRow }">
          <slot name="expand" :row="expandRow" />
        </template>
      </VxeColumn>
      <!-- 序号列：type=seq + seqConfig.startIndex，实现跨页连续编号 -->
      <VxeColumn
        v-if="showIndex"
        type="seq"
        :title="indexLabel"
        :width="indexWidthResolved"
        :align="indexAlign"
        :fixed="vxeIndexFixed"
      />
      <!-- vxe 引擎不再使用专门的 drag-sort 列。原因：那列一旦随 dragMode 增删，
           vxe 就会重建列集合并重算**全部**列宽 + 一次全量布局 —— 实测点一次开关冻结
           465~784ms（最大帧 482~807ms），列数 10→7 时代价从 1138ms 降到 366ms，成正比。
           改为「手柄内嵌进第一列单元格」：列集合恒定，开关只改单元格内容。
           手柄的 mousedown 由 onVxeDragHandleMousedown 手工完成 vxe 需要的那两步
           （reactData.dragRow = 行、该 tr 的 draggable = true）。
           行级 dragstart/dragover/dragend 仍由 vxe 提供（只依赖 rowConfig.drag，不依赖列）。 -->
      <!-- 表头溢出提示：DBM 的「字段/注释/字段+注释/类型」四档切的是 col.label 文本，
           长列名被截断时悬停要能看全称。开关 headerShowOverflowTooltip 打开后，
           每个数据列都挂 show-header-overflow="tooltip" —— vxe 只在真实溢出
           时才弹，不吵。 -->
      <VxeColumn
        v-for="(col, colIdx) in visibleColumns"
        :key="col.prop || col.label"
        :field="col.prop"
        :title="col.label"
        :width="colWidth(col)"
        :min-width="col.minWidth"
        :max-width="col.maxWidth"
        :fixed="vxeFixed(col)"
        :align="col.align"
        :sortable="Boolean(col.sortable)"
        :show-overflow="vxeShowOverflow(col)"
        :edit-render="col.editable ? { enabled: true } : undefined"
        :show-header-overflow="headerShowOverflowTooltip ? 'tooltip' : undefined"
      >
        <template v-if="hasColSlot(col)" #default="{ row }">
          <span
            v-if="dragMode && colIdx === 0"
            class="re-table__row-drag-handle"
            @mousedown="onVxeDragHandleMousedown($event, row)"
          ><ElIcon><Rank /></ElIcon></span>
          <slot
            :name="resolveColSlotName(col)"
            :row="row"
            :value="row[col.prop]"
            :editing="editing"
          />
        </template>
        <template v-else #default="{ row }">
          <span
            v-if="dragMode && colIdx === 0"
            class="re-table__row-drag-handle"
            @mousedown="onVxeDragHandleMousedown($event, row)"
          ><ElIcon><Rank /></ElIcon></span>
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
            :title="displayCellText(row, col)"
          >
            {{ displayCellText(row, col) }}
          </span>
        </template>
        <!-- 单格编辑（vxe 原生激活）：点击可编辑列的单元格，vxe 把该格切进编辑态，
             渲染本插槽（受控组件 + edit-cache，与批量模式的输入框同源）。
             编辑态单元格挂 vxe 的 .col--active 类，整格视觉见样式区 col--active 段。 -->
        <template #edit="{ row }">
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
      </VxeColumn>
      <!-- 加载态：vxe 的 table.js 里有这段判断 ——
           `if (props.loading && !VxeUILoadingComponent && !slots.loading) { errLog(缺少 vxe-loading); errLog(不支持的参数 loading=true) }`
           即：只要传了 loading，就必须存在「全局注册的 vxe-loading 组件」或「本插槽」，
           否则每次 nextTick 刷两条 error。本仓库刻意没有 app.use(vxe-table)（全局注册会带来
           其它副作用），所以在这里提供插槽，顺带把加载态收进设计体系。

           ⚠ 但本仓**确实注册了 vxe-pc-ui**（为了 VxeTooltip），它连带把 VxeLoading
           注册进了 VxeUI 的全局表 → vxe 走的是「VxeLoading 组件」那条路径，
           插槽内容被塞进它的默认 slot 里，外层是 .vxe-loading.vxe-table--loading，
           **不是** .vxe-loading--custom-wrapper。
           （实测：DOM 是 .vxe-loading > .vxe-loading--wrapper > .re-table__loading）
           所以定位样式加在 .vxe-loading 上，详见文件末尾的加载态 CSS 块。 -->
      <template #loading>
        <div class="re-table__loading">
          <span class="re-table__loading-spinner" aria-hidden="true"></span>
        </div>
      </template>
      <!-- 空态：未提供 #empty 插槽时回落到 el-empty（保持既有行为）；加载窗口内不渲染 -->
      <template #empty>
        <slot name="empty" :description="emptyText">
          <el-empty v-if="!loading && !dataLoading" :description="emptyText" :image-size="96" />
        </slot>
      </template>
      <slot />
    </VxeTable>
    <!-- ==================== ENGINE: vxe (END) ==================== -->

    <!-- 视图模式（一行一块；默认模板可被 #view 插槽整体替换） -->
    <ReTableView
      v-else-if="activeLayout === 'view'"
      :rows="pagedRows"
      :columns="visibleColumns"
      :layout="layoutView ?? {}"
      :row-key="rowKey"
      :selectable="batchSelectActive || batchActionEnabled"
      :context-menu="resolvedCtxMenuItems"
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
      :selectable="batchSelectActive || batchActionEnabled"
      :context-menu="resolvedCtxMenuItems"
      :empty-text="emptyText"
      @row-click="(row: Record<string, unknown>) => emit('row-click', row)"
      @selection-change="onSelectionChange"
      @context-menu="(ctx: ReTableContextMenuContext) => { ctxMenuX = ctx.event.clientX; ctxMenuY = ctx.event.clientY; ctxMenuContext = ctx; ctxMenuVisible = true; }"
    >
      <template v-if="$slots.card" #card="slotProps">
        <slot name="card" v-bind="slotProps" />
      </template>
    </ReTableCardView>

    <div v-if="paginationCfg.enable || toolbarEnabled" class="re-table__footer">
      <div class="re-table__toolbar" v-if="toolbarEnabled || paginationCfg.enable">
        <!--
          左侧分页：复用设计体系的 RePagination（layout=modern 即胶囊分页），
          不再在本组件内重写「总数 / 每页条数 / 省略号页码 / 上下页」——那套逻辑
          （页码数组、越界钳制、切换页长回第 1 页）与 RePagination 的 modern 布局逐行等价，
          重复实现会导致两处样式/边界行为漂移。
          size 变更走 onSizeChange 而不是直接 v-model：它顺带 emit 回父级、把页码收回第 1 页、
          并在远程模式下重新取数，直接 v-model 会漏掉这些副作用。

          注意这里必须读 paginationCfg / toolbarEnabled，不能写裸 prop 名：
          模板里的 `pagination` 会直接解析成 props.pagination，绕过分组配置，
          表现为「配了 config.pagination.enable=false 但分页照旧渲染」。
        -->
        <div v-if="paginationCfg.enable && !isScrollPaging" class="re-table__pagination">
          <RePagination
            layout="modern"
            :total="totalToShow"
            :current-page="internalPage"
            :page-size="currentPageSize"
            :page-sizes="pageSizeOptions"
            :small="tableSize !== 'default'"
            @current-change="onPageClick"
            @size-change="onSizeChange"
          />
        </div>
        <!-- 滚动分页状态条替代页码菜单；除触底自动加载外，点击可兜底加载（页面滚动 / 卡片布局等）。 -->
        <div v-else-if="isScrollPaging" class="re-table__scroll-pagination">
          <button
            type="button"
            class="re-table__scroll-status"
            :disabled="!hasMoreInScroll || scrollLoadingMore || dataLoading"
            :aria-label="scrollLoadingMore ? '正在加载更多数据' : hasMoreInScroll ? '加载更多数据' : `已加载全部 ${scrollLoadedCount} 条数据`"
            @click="loadMoreForScroll"
          >
            <template v-if="scrollLoadingMore || dataLoading">正在加载更多…</template>
            <template v-else-if="hasMoreInScroll">
              已加载 {{ scrollLoadedCount }} 条<template v-if="totalToShow > 0"> / {{ totalToShow }} 条</template>
              · 滚动到底部或点击加载更多
            </template>
            <template v-else>已加载全部 {{ scrollLoadedCount }} 条</template>
          </button>
        </div>

        <!-- 使用 ReTableToolbar 统一组件；position=top 时分页行只保留右侧工具区，默认模式保持完整工具栏 -->
        <ReTableToolbar
          :mode="toolbarConfigPosition === 'top' ? 'tools' : 'full'"
          :config="footerToolbarConfig"
          :selected-count="selectedCount"
          :editing="editing"
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
                  <ReButton layout="square" :size="elementTableSize" icon="anim:tabler:layout-grid" :anim-icon-size="16" :tip="columnsTriggerText" />
                </span>
              </template>
              <div class="re-table__columns-panel">
                <div class="re-table__columns-header">
                  <span>列设置</span>
                  <ElButton
                    link
                    type="primary"
                    :size="elementTableSize"
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
                        <ElButton link :size="elementTableSize" :disabled="idx === 0" @click="moveColumn(idx, -1)">↑</ElButton>
                        <ElButton link :size="elementTableSize" :disabled="idx === filteredColumnsForSettings.length - 1" @click="moveColumn(idx, 1)">↓</ElButton>
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
                  <ReButton layout="square" :size="elementTableSize" icon="anim:tabler:settings" :anim-icon-size="16" :tip="settingsTriggerText" />
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
                      <span class="settings-item__title">十字高亮</span>
                      <span class="settings-item__desc">悬停单元格高亮所在行列</span>
                    </div>
                    <ElSwitch
                      :model-value="localSettings.crosshairHighlight ?? false"
                      @update:model-value="(v: any) => onSettingChange('crosshairHighlight', Boolean(v))"
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
                  <div class="settings-item">
                    <div class="settings-item__label">
                      <span class="settings-item__title">记住页码</span>
                      <span class="settings-item__desc">刷新后回到上次所在页（按表格独立）</span>
                    </div>
                    <ElSwitch
                      :model-value="localSettings.pageCache ?? true"
                      @update:model-value="(v: any) => onSettingChange('pageCache', Boolean(v))"
                    />
                  </div>
                  <div class="settings-item">
                    <div class="settings-item__label">
                      <span class="settings-item__title">键盘快捷键</span>
                      <span class="settings-item__desc">← / → 切换上一页 / 下一页</span>
                    </div>
                    <ElSwitch
                      :model-value="localSettings.shortcuts ?? true"
                      @update:model-value="(v: any) => onSettingChange('shortcuts', Boolean(v))"
                    />
                  </div>
                </div>
              </div>
            </ElPopover>
          </template>
        </ReTableToolbar>

        <!--
          快捷键帮助：替代原来分页行里的「刷新」（刷新在顶部工具栏已有，重复入口）。
          快捷键关闭时仍显示入口，但文案明确告知"已关闭"，避免用户按了方向键没反应又找不到原因。
        -->
        <ElPopover
          placement="top-end"
          :width="276"
          trigger="click"
          popper-class="re-table__popover"
        >
          <template #reference>
            <span class="re-table__help-trigger">
              <ReButton
                layout="square"
                :size="elementTableSize"
                icon="QuestionFilled"
                tip="快捷键帮助"
              />
            </span>
          </template>
          <div class="re-table__help-panel">
            <div class="settings-header">
              <span class="settings-title">快捷键</span>
            </div>
            <ul class="re-table__help-list">
              <li>
                <span class="re-table__help-keys"><kbd>←</kbd><kbd>→</kbd></span>
                <span class="re-table__help-desc">上一页 / 下一页</span>
              </li>
            </ul>
            <p class="re-table__help-hint">
              鼠标悬停或点击表格后，方向键才作用于本表；一页多张表时互不干扰。
              <template v-if="shortcutsEnabled">可在「表格设置 → 键盘快捷键」关闭。</template>
              <template v-else><b>当前已在「表格设置」中关闭。</b></template>
            </p>
          </div>
        </ElPopover>
      </div>
    </div>

    <!-- 右键菜单 -->
    <ReTableContextMenu
      v-model:visible="ctxMenuVisible"
      :items="resolvedCtxMenuItems"
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
   四条渲染路径的根节点：.el-table（element 引擎，兼容回退）/ .vxe-table（vxe 引擎，默认）/
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
/* element 引擎 · 空态高度链（fill 分支）已移入 engines/element/element-table.css */
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
  /* ⚠ vxe 4.22 的样式表只读 --vxe-ui-* 这一族变量。实测把 style.css 全文
     grep 下来：header-background / header-font-color / row-hover-background /
     border-color / border-radius / row-height-* 这些名字，
     var(--vxe-ui-*) 的引用数分别是 6/1/5/44/59/4，
     而 var(--vxe-table-*)（无 ui- 前缀）是 0 —— 一个消费者都没有。
     所以本文件此前所有 --vxe-table-* 声明都是死写：写进去不报错、
     不生效、也没有任何症状提示，最容易让人以为「已经设过了」。
     下面只保留带 ui- 前缀的（这两条是真的在生效）。 */
  --vxe-ui-table-border-color: var(--el-border-color-lighter);
  /* ⚠ vxe 默认线宽是 1.05px，落在非整数像素上被浏览器抗锯齿，
     渲染成一条发糊的灰线；压成整数 1px 才和 el-table 的实线一样锐利。 */
  --vxe-ui-table-border-width: 1px;
  /* 表头 / 行 hover / 圆角 / 行高这四项此前写的是 --vxe-table-*（无 ui- 前缀），
     已删除：它们是死写（见上方实测计数）。不要靠"补上前缀"来恢复——
     表头底与行 hover 现在由 data-vxe-ui-theme 提供 vxe 自带的明暗两套值
     （见 packages/theme/src/useTheme.ts），那才是 vxe 认可的配色来源；
     圆角由下面那条 border-radius 声明负责（实测 tableRadius=18px）；
     行高由 vxe 的 JS 内联值负责，CSS 覆盖不动（见下方 .vxe-body--row 注释）。 */
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
/* mini 档（size="mini"）：比 compact 再压一档 —— 表头 5px、单元格上下 4px、
   行内 line-height 18px，纯文本行 ≈ 27px（compact ≈ 33px / 默认 51px）。
   ⚠ 这套规则以前**根本不存在**：size="mini" 只挂了个 .re-table--mini 空 class，
     而 vxe 原生的 size--mini 行高（--vxe-ui-table-row-height-mini: 36px）又被
     上面两条「写死 padding + min-height:0 !important」抹平，实测 mini/small/medium
     三档行高全是 51px —— mini 等于没效果。真正的密度只能由这里给。
   ⚠ 不硬压 height：含输入控件的表格（列设计网格、行内编辑）要按内容自然撑高，
     写死 height 会把控件裁掉；所以这里显式 height:auto!important 顶掉上面那条 51px。 */
.re-table--mini .vxe-body--row,
.re-table--mini .vxe-body--row > .vxe-body--column {
  height: auto !important;
}
.re-table--mini .vxe-header--column {
  padding-top: 5px !important;
  padding-bottom: 5px !important;
  font-size: 12.5px;
}
.re-table--mini .vxe-body--column {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}
.re-table--mini .vxe-body--column .vxe-cell,
.re-table--mini .vxe-header--column .vxe-cell {
  padding: 0 8px;
  line-height: 18px;
  /* vxe 会给表头/表体单元格写内联 height/min-height 来做行对齐
     （开了 header-show-overflow-tooltip 的表头是 height:36px），
     内联样式只有 !important 压得过；不压的话表头还是 47px，压不动。 */
  height: auto !important;
  min-height: 0 !important;
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
/* vxe 原生单格编辑（APITable 式整格编辑）：编辑态单元格自身即编辑面。
   ⚠ 锚点是 .col--active（当前激活的编辑格）而不是 .col--edit ——
     后者 vxe 挂在「列带 edit-render」的**所有**单元格上（body.ts 的 isEdit 判定），
     挂 .col--edit 会把整列都改成无内边距。.col--active 才是 actived 命中的那一格。
   三层「边距」来源：.vxe-cell 的 12px 横向 padding + el-input__wrapper 自身的
   内边距/边框/固定高度。这里把前两层抹平：cell 无 padding，输入控件透明无边框
   撑满（文字边距下沉进 wrapper），焦点高亮改由单元格整体描边给出——
   输入控件自己的框整条不出现，视觉即「整个单元格就是输入框」。 */
.re-table .vxe-body--column.col--active > .vxe-cell {
  padding: 0;
}
.re-table .vxe-body--column.col--active .el-input,
.re-table .vxe-body--column.col--active .el-select {
  width: 100%;
  display: block;
}
.re-table .vxe-body--column.col--active .el-input__wrapper,
.re-table .vxe-body--column.col--active .el-select__wrapper {
  border: none;
  box-shadow: none;
  background: transparent;
  border-radius: 0;
  padding: 0 12px;
  height: 100%;
}
.re-table .vxe-body--column.col--active .el-input__inner,
.re-table .vxe-body--column.col--active .el-select__placeholder {
  color: var(--rt-text);
}
/* 焦点：整格 2px 主色描边（内描边，不撑开布局） */
.re-table .vxe-body--column.col--active:has(.el-input__wrapper.is-focus) {
  box-shadow: inset 0 0 0 2px var(--el-color-primary);
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
/* 表头文字一律不折行：表头一折行就与 39px 的行高口径打架（折成两行把行撑高），
   而且列宽不足时「横向被截断」比「换行占两行」更可读——列宽本来就能拖。
   overflow/ellipsis 是配套的：不写这两条，nowrap 只会让文字盖到右边列的表头上。
   只管表头；表体单元格仍按各自列的 showOverflow/ellipsis 配置走。 */
.re-table .vxe-header--column .vxe-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.re-table__main {
  padding: 16px;
}

/* ============ element 引擎（兼容回退）的表格视觉 ============
   与上面 vxe 那套是同一套设计语言的两种落地：同样的圆角细描边、渐变表头、
   44/36 行高、更淡的斑马纹、hover 混主色、首列主色条。
   两套选择器的 class 名完全不相交（.el-table* vs .vxe-*），同时挂在样式表里也不会
   互相干扰——同一时刻只有一个引擎渲染出 DOM，另一套自然全部落空。
   ⚠ 页面里 :deep(.el-table …) 这类内部覆盖只在 engine="element" 下成立，
     默认引擎是 vxe（2026-10-07），这类覆盖需自行改成引擎无关或显式传 element。 */
/* element 引擎表格视觉（表头 / 表体 / 斑马纹 / 选中行 / 单元格）已移入
   engines/element/element-table.css */
/* element 引擎 · 横向滚动表头投影 / 固定右列底色 / 拖拽禁选 已移入
   engines/element/element-table.css */
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
  transition: box-shadow var(--rt-duration, 200ms) var(--rt-ease, ease);
}
.re-table--separated > .re-table__main {
  background: var(--rt-bg);
  border-radius: var(--rt-radius);
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
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
/* 选中态：浮起白底 + 主色图标（对比靠 overlay / light 令牌分层，不硬编码品牌色）。
   底色带极淡主色渐变 + 顶部高光，让滑块在灰轨道上有一点点「浮起来」的体积感。 */
.re-table__layout-switch-item.is-active,
.re-table__layout-switch-item.is-active:hover {
  color: var(--el-color-primary);
  background: linear-gradient(
    180deg,
    var(--el-bg-color-overlay),
    color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color-overlay))
  );
  box-shadow:
    var(--el-box-shadow-light),
    inset 0 1px 0 color-mix(in srgb, var(--el-bg-color-overlay) 55%, transparent);
}
/* 自动刷新浮层（参考图排版）：标题行 + 状态徽标 → 档位菜单 → 分隔线 + 倒计时说明。
   浮层外壳宽度/内距由 ReSwitch 的 popoverWidth(268)/popoverPadding(8) 锚定；
   颜色一律走 koi/Element 的 --el-* 令牌，不手写色值。 */
.re-table__auto-refresh-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 4px 8px;
}
.re-table__auto-refresh-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
  white-space: nowrap;
}
/* 状态徽标：开启=主色浅底 + 主色字 + 左侧小圆点；关闭=填充浅底 + 次要文字 */
.re-table__auto-refresh-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  font-size: 12px;
  line-height: 18px;
  border-radius: var(--el-radius-round, 9999px);
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-text-color-secondary, #909399);
  white-space: nowrap;
}
.re-table__auto-refresh-badge::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentcolor;
}
.re-table__auto-refresh-badge.is-on {
  background: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary, #409eff);
}
/* 底部说明：上方一条分隔线（令牌色，暗色自动适配），倒计时数字用主色强调 */
.re-table__auto-refresh-hint {
  margin-top: 6px;
  padding: 8px 4px 2px;
  border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary, #909399);
}
.re-table__auto-refresh-next {
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
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
/* vxe 的配色令牌必须带 ui- 前缀（--vxe-ui-table-*），这一点上方已实测。
   原来这里还叠了一层 --vxe-table-*（无前缀）到「rt 令牌再叠一层」的写法，
   同样是死写，已删除；不要再按「令牌要挂在 .vxe-table 上」这条旧注释去补前缀。 */
.re-table .vxe-table {
  /* 本块目前刻意为空：表头底 / 行 hover / 表体底改由 data-vxe-ui-theme 决定
     （vxe 自带 light/dark 两套），保留位置是为了让「rt 令牌叠 vxe 令牌」这件事
     在文件里仍然可见，将来确需覆盖时按 --vxe-ui-table-* 写。 */
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
/* element 引擎 · rt 令牌再叠一层已移入 engines/element/element-table.css */
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
/* 分页行右侧工具按钮（列设置 / 表格设置 / 刷新）是 ReButton square：默认 30，
   而分页的页码按钮与「每页条数」触发器是 32/30 的 Modern 族。截图对照（运行记录页）：
   右侧三颗方块按钮比页码矮 2px 同一行看着错位。这里把分页行里的 square 统一抬到 32，
   与页码按钮同高。图标仍 14 不变。
   权重 (0,4,0)+类名双保：ReButton Square 是 scoped（.rs-btn--size-default[data-v] 为 (0,2,0)），
   按注入顺序后插入者胜并不可靠，故用 .re-table 祖选择器 + 双类提到 (0,4,0)。
   紧凑模式（small）下分页 28、方块 28，天然对齐不动。 */
.re-table .re-table__pagination .re-table-toolbar .rs-btn.rs-btn--size-default {
  width: 32px;
  height: 32px;
}
/* 表格右上工具条（隐藏搜索 / 刷新 / 自动刷新入口）同理：同样是 square 30，
   与下方分页行的 32 同处一屏时看着小一号。只抬默认档（主视觉），small 档 28 不动。 */
.re-table .re-table__toolbar .rs-btn.rs-btn--size-default {
  width: 32px;
  height: 32px;
}
.re-table--compact .re-table__pagination .rm-pager__btn {
  min-width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 12px;
}
/* ============ 滚动分页状态条（替代页码菜单的位置） ============
   可点击（触底事件的兜底：页面滚动 / 视图卡片布局没有 vxe 内滚，触底永远不会来），
   但视觉上是次要信息文字，不做大按钮——主交互是滚动本身，按钮只是保底通道。
   加载中 / 到底用 disabled 态表达；字号与分页行一致（13px），走同一套文字令牌。 */
.re-table__scroll-pagination {
  display: flex;
  align-items: center;
  flex: none;
  order: 0;
  position: relative;
  z-index: 1;
  padding: 12px 0;
}
.re-table__scroll-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition:
    color var(--rt-duration, 200ms) var(--rt-ease, ease),
    background-color var(--rt-duration, 200ms) var(--rt-ease, ease);
}
.re-table__scroll-status:disabled {
  cursor: default;
}
.re-table__scroll-status:not(:disabled):hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}
.re-table__scroll-status:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
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
/* ⚠ 兜底值不能写死 #fff。--el-table-bg-color 只在 element-plus 的 .el-table
   作用域里有定义，vxe 引擎没有这个作用域，var() 解析为空后会落到兜底值上；
   兜底若是 #fff，暗色模式里固定列就变成白底。
   实测（2026-10-04，vxe 4.22.2）：body 单元格上根本没有 col--fixed 这个类
   （vxe 用 fixed--visible / fixed--hidden 标记），所以下面两条当前匹配为空、
   是防御性保留；但兜底已改成 var(--el-bg-color)，一旦 vxe 改了标记也不会白底。 */
.re-table .vxe-body--column.col--fixed {
  background-color: var(--el-table-bg-color, var(--el-bg-color, #ffffff));
}
.re-table tr.vxe-body--row.row--hover > .vxe-body--column.col--fixed,
.re-table tr.vxe-body--row.row--current > .vxe-body--column.col--fixed {
  background-color: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-table-bg-color, var(--el-bg-color, #ffffff))) !important;
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
  /* ⚠⚠ vxe 4.22.2 自身缺陷：空块基础规则是 `display:none; visibility:hidden`，
     is--empty 分支只把 display 恢复成 flex、**从不恢复 visibility**（已 grep
     vxe 全部 css/scss/js：无任何 visibility:visible，JS 也只动滚动条节点）。
     visibility 是可继承属性 → 块内 el-empty 一并隐藏，空态对用户完全不可见
     （实测 computed visibility=hidden，e2e retable-layout:04 就是被这条卡住的）。
     这里显式恢复。有数据时幽灵空块仍被下方 :has(.vxe-body--row) 规则压成 0 高
     （overflow:hidden），未进入 is--empty 时更是 display:none —— 两个分支
     都不受这条影响，不会把空态"显形"到有数据的表里。 */
  visibility: visible;
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
  /* 有数据行时**彻底隐藏**空态块。
     此前只压高度（min-height:0; height:0; overflow:hidden），但空块本身
     display:flex —— 内容（"暂无数据"文字）仍会溢出渲染，且空块占位把
     数据行整体往下推（实测行 top 被推到 2287px）。
     判据仍用 :has(.vxe-body--row)：vxe 按**实际渲染出的行**决定显不显示空态，
     本地分页时 dataList 可能非空而当前页没有行，那时空态该照常显示。 */
  display: none;
}
/* vxe 自己的 .vxe-table--empty-content 是 width:50%（相对空块），
   空块被改回可视宽后内容只剩一半、字会多折几行。改回 100% 让它与
   element 引擎的空态同宽（实测两边都铺满可见宽），两个引擎观感才一致。 */
.re-table .vxe-table--body-wrapper .vxe-table--empty-block > .vxe-table--empty-content {
  width: 100%;
}
/* 空态下右侧固定列浮层要"让位"。
   vxe 的 .vxe-table--fixed-right-wrapper 是 position:absolute + z-index:5 +
   background-color:var(--vxe-ui-layout-background-color)（不透明），覆盖在 body 右侧。
   有数据时它显示固定列的行，是对的；**无数据时它没有行可显示，却仍把空态右半截盖住，
   左沿形成一条硬边** —— 这是"没有消息的组件跑到固定列下面"的第二个成因
   （第一个是空块宽度，见上）。

   ⚠⚠ 但**不能只摘 body-wrapper**：固定列浮层里还嵌着一份独立的 header-wrapper，
     它渲染的是「操作」列表头，而主 wrapper 的 header-wrapper 同样渲染了一遍
     「操作」——空态下两份表头叠在同一位置，于是字**重叠**成一片（实测函数库页
     表头右侧「操作」与「最近结果」糊在一起）。
     只隐藏 body 的话，浮层里那份 header 仍然可见，重叠依旧。
     所以这里把浮层整体收起：表头由主 wrapper 那份负责，浮层在空态下不该存在。
     element 引擎空态下干脆不生成固定列浮层，这里等于把两个引擎的行为对齐。 */
.re-table--empty .vxe-table--fixed-right-wrapper {
  display: none;
}
/* 左固定列同理（序号 / 勾选列固定时）。同一类缺陷，一并处理。 */
.re-table--empty .vxe-table--fixed-left-wrapper {
  display: none;
}
/* ⚠⚠ vxe 空态的「双容器」缺陷（题库管理实测：空态文字重影、DOM 却只有一份）：
   同一份空内容被渲染进两个容器，is--empty 时两者都 display:flex → 画两遍重叠。
     - .vxe-table--empty-block：在 body-wrapper 内，就是上面一直在美化/居中/撑高的那份，
       fill / fixed-height 的空态高度也全挂在它上面 → ReTable 以它为准；
     - .vxe-table--empty-place-wrapper：table.js renderEmptyBody 生成的绝对定位覆盖层
       （top=表头高、height=表体高、z-index:5、pointer-events:none），里面放的也是 #empty 插槽。
   插图两者都居中故看似一份；文字因两容器宽度/定位不同（empty-block 撑满可视宽且 sticky 吸左，
   place-wrapper 是覆盖层）而错位，于是「文字重影」。
   这里把覆盖层整份隐藏，空态只留 empty-block —— 与上方隐藏固定列浮层同一思路。
   !important：vxe 自带 `.vxe-table--render-default.is--empty .vxe-table--empty-place-wrapper{display:flex}`
   权重 (0,3,0) 高于 `.re-table .vxe-table--empty-place-wrapper`(0,2,0)，不加强会被压回去。 */
.re-table .vxe-table--empty-place-wrapper {
  display: none !important;
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
/* element 引擎 · 空态（非 fill 分支）已移入 engines/element/element-table.css */
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

/* ---- 快捷键帮助浮层（分页行右侧，替代原刷新入口） ---- */
.re-table__help-trigger {
  display: inline-flex;
  align-items: center;
}
.re-table__help-panel {
  padding: 0;
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
}
.re-table__help-list {
  padding: 12px 16px;
  margin: 0;
  list-style: none;
}
.re-table__help-list li {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.re-table__help-keys {
  display: inline-flex;
  flex-shrink: 0;
  gap: 4px;
}
.re-table__help-keys kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 5px;
  font-family: inherit;
  font-size: 11px;
  line-height: 1;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}
.re-table__help-hint {
  padding: 0 16px 14px;
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
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

/* ==================== 十字高亮（表格设置开关） ====================
   类由根节点的 mouseover 委托（onCrosshairOver / applyCrosshair）打在 td/th 上，
   根上的 re-table--crosshair 只做状态门闩，开关关闭时类已被清空。
   !important 是必须的：el-table 的斑马纹 / 行 hover 背景选择器权重更高
   （形如 .el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell），
   不加压不过去，交叉点会闪回斑马底色。
   三条规则权重一致，靠源码顺序决胜：行 < 列 < 命中格（交叉点最深）。 */
.re-table--crosshair tbody td.is-crosshair-row {
  background-color: var(--el-fill-color-light) !important;
}
.re-table--crosshair tbody td.is-crosshair-col,
.re-table--crosshair thead th.is-crosshair-col {
  background-color: var(--el-color-primary-light-9) !important;
}
.re-table--crosshair tbody td.is-crosshair-cell {
  background-color: var(--el-color-primary-light-8) !important;
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
/* 自研拖拽手柄（vxe 引擎，内嵌在第一列单元格里）。
   与 vxe 内置手柄 .vxe-drag-handle 的区别：这个是普通 DOM，不含 vxe 的手柄壳，
   按下事件由 onVxeDragHandleMousedown 处理。
   留出与内容之间的间距；手柄自身不可选中、光标 grab。 */
.re-table__row-drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 8px;
  color: var(--el-text-color-secondary);
  font-size: 18px;
  cursor: grab;
  user-select: none;
}
.re-table__row-drag-handle:active {
  cursor: grabbing;
}
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
/* vxe 加载态（#loading 插槽内容）。

   ⚠️ vxe 4.22 的加载态有**两条互斥的渲染路径**（table.js 源码）：
      1. VxeUI 里注册了 VxeLoading（本仓注册了 vxe-pc-ui，走这条）
         → h(VxeUILoadingComponent, { class: 'vxe-table--loading' })
      2. 没注册、但有 #loading 插槽
         → h('div', { class: ['vxe-loading--custom-wrapper', {is--visible}] })

   本仓注册了 vxe-pc-ui（为了 VxeTooltip），它连带把 VxeLoading 也注册进了
   VxeUI 的全局表，于是 vxe 走**路径 1**。

   而路径 1 有两个坑：
     ① vxe-ui 的 .vxe-loading 样式在 vxe-pc-ui 的 style.css 里，而本仓只 import 了
        "vxe-table/lib/style.css"，**没 import vxe-pc-ui 的样式** → .vxe-loading 拿不到
        position:absolute / width:100% / height:100%，退回浏览器默认的 position:static；
     ② position:static 的元素跟着文档流排，vxe 又把它放在表格的**末尾**
        （表头之后、表体之前那层的最后），于是它被排到**表格下方**，
        高度还是 vxe-ui 组件自己的 22px（showIcon 默认 false → 空条）。

   实测（修复前）：遮罩 top=855（表格 242~855 的正下方），而表体在 281~855 ——
   正是「加载动画跑到表格底部、不在 body 中间」。

   修法：直接给路径 1 的 .vxe-loading 补齐定位与尺寸（absolute + 100%×100%），
   让它相对 .vxe-table（position:relative）铺满整表；再用 JS 量出的表体矩形
   把上边界钉到表体顶部（--rt-loading-top/height），使遮罩只盖表体、
   转圈落在 body 正中。 */
.re-table .vxe-loading.vxe-table--loading {
  position: absolute;
  inset: 0;
  z-index: 99;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 遮罩只覆盖「表体可视区」：vxe 把这层挂在表格末尾，靠 absolute 铺满整表；
   这里用 JS 量出的表体矩形（相对 .vxe-table 的偏移）把上边界钉准 ——
   表头保持可见（表头是列名，遮住反而让人失去上下文），转圈也稳定落在 body 中间。

   ⚠️ 高度**不再**用 JS 量出来的快照，改成 `calc(100% - top)` 现算：
   量测发生在 loading 刚变 true 的那一帧，此时表体常常还是空的（远程模式下
   新参数一提交 dataList 就被清空、等 loader 返回），量到的高度是「空表体」的
   几十像素；等数据回来表体长高，写死的快照高度就短了一截 —— 实测遮挡
   40px / 表体 54px，下半截裸露。
   钉住上边界、高度贴着表格底现算，无论表体怎么长，遮罩永远盖满表体。 */
.re-table .vxe-loading.vxe-table--loading.is--visible {
  top: var(--rt-loading-top, 0);
  height: calc(100% - var(--rt-loading-top, 0px));
}

.re-table__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: color-mix(in srgb, var(--el-bg-color) 72%, transparent);
}
.re-table__loading-spinner {
  width: 22px;
  height: 22px;
  border: 2px solid color-mix(in srgb, var(--el-color-primary) 25%, transparent);
  border-top-color: var(--el-color-primary);
  border-radius: var(--rt-radius-full, 9999px);
  animation: re-table-loading-spin 0.8s linear infinite;
}
@keyframes re-table-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .re-table__loading-spinner {
    animation: none;
  }
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

<!-- ==================== element 引擎专属样式（独立文件） ====================
     抽到 engines/element/element-table.css，与 vxe 引擎彻底解耦：
     将来删除 element 支持时，删掉本 <style src> 行 + engines/element/ 目录即可。
     ⚠ 必须放在主 <style> 之后：引擎规则原本就排在共用规则之后，
       顺序一换会让同权重的共用规则反压引擎规则。 -->
<style src="./engines/element/element-table.css"></style>

