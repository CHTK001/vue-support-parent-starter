<!--
  模板管理 —— 控制台侧的模板库台账（形态对齐设备页：左栏筛选 + 工作区页签 + 右键菜单）

  职责：
    - 调用 `@pages/template` 的 templateApi 获取模板库分页数据；
    - 左栏按「来源 / 状态」做快筛树，右栏工作区用页签承载「模板台账 / 详情 / 内容」；
    - 左栏节点、台账行、工作区页签三处都接右键菜单，功能入口集中在菜单里，
      不再有抽屉与页签两套并存（与 DeviceView 的口径一致）。

  结构来源：`pages/device/src/views/DeviceView.vue`
    - 268px 可折叠 rail（折叠态只留计数与竖条）+ ReTabs 工作区；
    - 左树 `@contextmenu` + `ReContextMenu`，表格 `:context-menu` + `@context-menu-select`；
    - 固定页签（台账）不可关闭，功能页签按 `${模板id}:${功能}` 唯一，重复点击是切过去。

  数据口径：只认真实接口 `GET /api/template/page`（spring-support-template-starter）。
  取不到就把失败原因摊在页面上，**不回落任何演示数据**——与 pages/datasource 下
  各 ManageView、utils/middlewareSource.ts 的口径一致。

  注意：监控侧不承载 template 路由（由 @pages/template 提供 /template/* 页），
  设计器 / 预览页的跳转本侧只做入口，未在 monitor 路由注册时向用户说明原因。

  @author CH
  @since 4.0.0.46
-->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from '@repo/core';
import ReTable, {
  type ReTableColumn,
  type ReTableContextMenuContext,
  type ReTableContextMenuItem,
  type ReTableLoadParams,
  type RePageResult,
} from '@repo/ui/re-table';
import ReTabs, { type ReTabsContextItem, type ReTabsItem } from '@repo/ui/re-tabs';
import ReContextMenu, { type ReContextMenuItem } from '@repo/ui/re-context-menu';
import ReDialog from '@repo/ui/re-dialog';
import ReButton from '@repo/ui/re-button';
import ReIcon from '@repo/ui/re-icon';
import ReInput from '@repo/ui/re-input';
import ReSelect from '@repo/ui/re-select';
import ReTag from '@repo/ui/re-tag';
// 相对引用：pages/template 是同一工作区的页面包，避免 monitor 侧 node_modules 未 link 该包
import type { TemplateInfo, TemplateSourceDetail, PageResult, TemplateStatus, TemplateSource, TemplateType, TemplateLanguage } from '../../../../pages/template/src/types/template';
import { templateApi } from '../../../../pages/template/src/api/templateApi';

const router = useRouter();

// ==================== 台账状态（由 loader 驱动） ====================
/** 最近一次取到的行：统计面板与左栏计数据此统计；取数失败时保留上一屏，不归零 */
const list = ref<TemplateInfo[]>([]);
/** 服务端 total */
const total = ref(0);
/** 输入框里的关键字（未提交） */
const keywordInput = ref('');
/** 已提交的关键字：进 ReTable 的 params，变化即由表格自己回第 1 页重查 */
const keyword = ref('');
/** 已提交的来源筛选（左栏「按来源」节点） */
const sourceFilter = ref<'' | TemplateSource>('');
/** 已提交的状态筛选（左栏「按状态」节点） */
const statusFilter = ref<'' | TemplateStatus>('');
/** 最近一次取数的失败原因；空串 = 正常 */
const loadError = ref('');
/** 左栏折叠态 */
const railCollapsed = ref(false);

/** 交给 ReTable 的查询条件：空值用 undefined，让查询串里干脆不出现该键 */
const queryParams = computed<Record<string, unknown>>(() => ({
  keyword: keyword.value || undefined,
  source: sourceFilter.value || undefined,
  status: statusFilter.value || undefined,
}));
/** 查询条件指纹：用来判断「条件没变 → params 的 watch 不会重查」 */
const queryKey = computed<string>(() => JSON.stringify(queryParams.value));

/** ReTable 实例（只用到 reload：条件没变时手动补一次重查） */
const tableRef = ref<{ reload: () => Promise<void> } | null>(null);

/** 统计面板：按状态拆分模板数量（口径：当前页分布，total 取服务端） */
const stats = computed(() => {
  const s = { total: total.value, online: 0, draft: 0, offline: 0 };
  for (const r of list.value) {
    if (r.status === 'online') s.online += 1;
    else if (r.status === 'draft') s.draft += 1;
    else if (r.status === 'offline') s.offline += 1;
  }
  return s;
});

/** 页面行：与 ReTable 的 RePageResult 对齐（Record<string, unknown> 需要索引签名，交集类型由 TS 补齐） */
type Row = TemplateInfo & Record<string, unknown>;

// ------------------- 字段归一：屏蔽后端 camelCase / 小写两种键名 -------------------
/** 把后端返回的原始行对象对齐到页面的 TS 类型（小写字段） */
function normalizeRow(raw: Record<string, unknown>): TemplateInfo {
  if (!raw) return {
    id: '',
    name: '—',
    subtitle: '',
    language: 'html' as TemplateLanguage,
    type: 'document' as TemplateType,
    status: 'draft' as TemplateStatus,
    source: 'hiprint' as TemplateSource,
    providerId: '',
    sourceId: '',
    sourceCode: '',
    sourceProviderId: '',
    creator: '',
    modifier: '',
    createdAt: '',
    updatedAt: '',
    content: '',
    remark: '',
  };
  return {
    id: String(raw.templateInfoId ?? raw.id ?? ''),
    name: String(raw.templateInfoName ?? raw.name ?? '—'),
    subtitle: String(raw.templateInfoSubtitle ?? raw.subtitle ?? ''),
    language: String(raw.templateInfoLanguage ?? raw.language ?? 'html') as TemplateLanguage,
    type: String(raw.templateInfoType ?? raw.type ?? 'document') as TemplateType,
    status: String(raw.templateInfoStatus ?? raw.status ?? 'draft') as TemplateStatus,
    source: String(raw.templateInfoSource ?? raw.source ?? 'hiprint') as TemplateSource,
    providerId: String(raw.templateInfoProvider ?? raw.providerId ?? ''),
    sourceId: String(raw.templateInfoSourceId ?? raw.sourceId ?? ''),
    sourceCode: String(raw.templateInfoSourceCode ?? raw.sourceCode ?? ''),
    sourceProviderId: String(raw.templateInfoProvider ?? raw.sourceProviderId ?? ''),
    creator: String(raw.templateInfoCreator ?? raw.creator ?? ''),
    modifier: String(raw.templateInfoModifier ?? raw.modifier ?? ''),
    createdAt: String(raw.templateInfoCreatedAt ?? raw.createdAt ?? ''),
    updatedAt: String(raw.templateInfoUpdatedAt ?? raw.updatedAt ?? ''),
    content: String(raw.templateInfoContent ?? raw.content ?? ''),
    remark: String(raw.templateInfoRemark ?? raw.remark ?? ''),
  };
}

/** 空模板：页签按 id 回查不到行时兜底（例如翻页后该行已不在本页），避免模板里到处判空 */
const EMPTY_TEMPLATE: TemplateInfo = normalizeRow({});

/** 时间格式化（展示用） */
function fmtTimeOf(v?: string): string {
  if (!v) return '—';
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return v;
  }
}

/** 时间展示（ReTable formatter） */
function fmtTime(_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown): string {
  return fmtTimeOf(cellValue as string | undefined);
}

/** 状态标签配置（含圆点 + 颜色） */
const statusMap: Record<TemplateStatus, { label: string; type: 'success' | 'warning' | 'info'; dot: boolean; dotColor: string }> = {
  online: { label: '已上线', type: 'success', dot: true, dotColor: '#41CE65' },
  draft: { label: '草稿', type: 'warning', dot: true, dotColor: '#FF9B36' },
  offline: { label: '已下线', type: 'info', dot: true, dotColor: '#8C8C8C' },
};

/** 当前行对应的状态配置（于 #col-status 插槽用，屏蔽驼峰/小写两种键名） */
function statusConfigForRow(row: Record<string, unknown>) {
  const s = String(row.templateInfoStatus ?? (row as unknown as TemplateInfo).status ?? '');
  return statusMap[s as TemplateStatus] ?? statusMap.draft;
}

/** 恢复 formatter 文本（状态列最终由 #col-status 插槽出 ReTag） */
function statusText(_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown): string {
  const s = cellValue as string | undefined;
  return { online: '已上线', draft: '草稿', offline: '已下线' }[s ?? ''] ?? s ?? '—';
}
function sourceText(_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown): string {
  const s = cellValue as string | undefined;
  return { hiprint: 'hiprint', message: '消息', paper: '组卷' }[s ?? ''] ?? s ?? '—';
}

/** 语言文本（formatter） */
function languageText(_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown): string {
  const s = cellValue as string | undefined;
  return { html: 'HTML', vue: 'Vue', jsx: 'JSX', json: 'JSON' }[s ?? ''] ?? s ?? '—';
}

/** 类型文本（formatter） */
function typeText(_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown): string {
  const s = cellValue as string | undefined;
  return { document: '单据', sms: '短信', email: '邮件', label: '标签', other: '其他' }[s ?? ''] ?? s ?? '—';
}

/** 详情页签 / 台账列共用：把 formatter 收敛成「取文本」 */
function asRow(r: TemplateInfo): Record<string, unknown> {
  return r as unknown as Record<string, unknown>;
}
function statusOf(r: TemplateInfo): string { return statusText(asRow(r), {} as ReTableColumn, r.status); }
function sourceOf(r: TemplateInfo): string { return sourceText(asRow(r), {} as ReTableColumn, r.source); }
function languageOf(r: TemplateInfo): string { return languageText(asRow(r), {} as ReTableColumn, r.language); }
function typeOf(r: TemplateInfo): string { return typeText(asRow(r), {} as ReTableColumn, r.type); }

// ------------------- 取数（ReTable loader） -------------------
/**
 * 取模板库分页数据。
 *
 * <p>只发真实请求；失败时把原因写进 `loadError` 并把异常继续抛给 ReTable
 * （ReTable 会 emit `load-error`）：页面显示失败原因，不生成也不回落任何假数据。</p>
 *
 * <p>失败不清空 `list` / `total`：沿用框架口径——「数据归零」的错觉比失败提示更
 * 误导人，页面同时给出失败原因，用户知道看到的是上一屏。</p>
 */
async function load(params: ReTableLoadParams): Promise<RePageResult> {
  const kw = String(params.params?.keyword ?? '').trim();
  const source = String(params.params?.source ?? '').trim();
  const status = String(params.params?.status ?? '').trim();
  try {
    const result = (await templateApi.page({
      keyword: kw || undefined,
      // 空串表示「全部」，接口约定用 undefined 表达不筛选
      source: (source || undefined) as TemplateSource | undefined,
      status: (status || undefined) as TemplateStatus | undefined,
      page: params.page,
      size: params.pageSize,
    })) as PageResult<TemplateInfo> | undefined;
    if (!result || !Array.isArray(result.records)) {
      throw new Error('分页返回结构不匹配：缺少 records 数组');
    }
    const records = result.records.map((r: TemplateInfo) => normalizeRow(r as unknown as Record<string, unknown>));
    list.value = records;
    total.value = Number(result.total ?? records.length);
    loadError.value = '';
    return {
      records: records as unknown as Record<string, unknown>[],
      total: total.value,
    };
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e);
    throw new Error(loadError.value);
  }
}

/** 重试当前条件（失败提示上的按钮 / 左栏刷新） */
function reloadLedger(): void {
  void tableRef.value?.reload();
}

// ------------------- 查询 -------------------
/**
 * 提交查询条件。
 *
 * <p>ReTable 远端模式靠 `params` 指纹的 watch 自动回第 1 页重查；条件与上一轮
 * 完全相同时 watch 不触发，这里补一次 reload，避免「点了没反应」。</p>
 */
function submitQuery(apply: () => void): void {
  const before = queryKey.value;
  apply();
  void nextTick(() => {
    if (queryKey.value === before) void tableRef.value?.reload();
  });
}

/** 关键字查询（回车 / 清空 / 点查询） */
function search(): void {
  submitQuery(() => {
    keyword.value = keywordInput.value.trim();
  });
}

/** 重置查询条件（关键字 + 左栏两个维度一起清） */
function reset(): void {
  submitQuery(() => {
    keywordInput.value = '';
    keyword.value = '';
    sourceFilter.value = '';
    statusFilter.value = '';
  });
}

/** 左栏筛选维度 */
type FilterKind = 'source' | 'status';

/** 显式设置某个维度的筛选（空串 = 清掉该维度） */
function setFilter(kind: FilterKind, value: string): void {
  submitQuery(() => {
    if (kind === 'source') sourceFilter.value = value as '' | TemplateSource;
    else statusFilter.value = value as '' | TemplateStatus;
  });
}

/** 左栏点选：同一个节点再点一次即取消该维度筛选 */
function toggleFilter(kind: FilterKind, value: string): void {
  const current = kind === 'source' ? sourceFilter.value : statusFilter.value;
  setFilter(kind, current === value ? '' : value);
}

/** 清掉左栏全部筛选（不动关键字） */
function clearFilters(): void {
  submitQuery(() => {
    sourceFilter.value = '';
    statusFilter.value = '';
  });
}

/** 当前筛选描述（台账工具条上显示） */
const filterLabel = computed<string>(() => {
  const parts: string[] = [];
  if (sourceFilter.value) parts.push(`来源 ${sourceOf({ ...EMPTY_TEMPLATE, source: sourceFilter.value })}`);
  if (statusFilter.value) parts.push(`状态 ${statusOf({ ...EMPTY_TEMPLATE, status: statusFilter.value })}`);
  return parts.join(' · ') || '全部';
});

// ------------------- 左栏树 -------------------
/** 来源节点 */
const SOURCE_NODES: { value: TemplateSource; label: string; icon: string }[] = [
  { value: 'hiprint', label: 'hiprint 打印', icon: 'Printer' },
  { value: 'message', label: '消息模板', icon: 'ChatDotRound' },
  { value: 'paper', label: '组卷模板', icon: 'Tickets' },
];

/** 状态节点 */
const STATUS_NODES: { value: TemplateStatus; label: string; icon: string }[] = [
  { value: 'online', label: '已上线', icon: 'CircleCheck' },
  { value: 'draft', label: '草稿', icon: 'EditPen' },
  { value: 'offline', label: '已下线', icon: 'CircleClose' },
];

/**
 * 左栏节点计数。
 *
 * <p>取的是「当前页」分布而不是全库：接口只回 total 与当前页 records，
 * 按来源/状态的全局计数需要后端额外字段。这里如实标注「本页」，
 * 不拿本页数字冒充全库（与设备页数据全量在手的场景不同）。</p>
 */
const sourceNodes = computed(() =>
  SOURCE_NODES.map((n) => ({ ...n, count: list.value.filter((r) => r.source === n.value).length })),
);
const statusNodes = computed(() =>
  STATUS_NODES.map((n) => ({ ...n, count: list.value.filter((r) => r.status === n.value).length })),
);

/** 折叠 / 展开左栏 */
function toggleRail(): void {
  railCollapsed.value = !railCollapsed.value;
}

// ------------------- 左栏右键菜单（ReContextMenu） -------------------
const railMenuRef = ref<{ open: (x: number, y: number) => void; close: () => void } | null>(null);
/** 右键落点节点 */
const railMenuTarget = ref<{ kind: 'root' | 'source' | 'status'; value: string; label: string } | null>(null);

/** 打开左栏右键菜单 */
function openRailMenu(event: MouseEvent, target: { kind: 'root' | 'source' | 'status'; value: string; label: string }): void {
  event.preventDefault();
  event.stopPropagation();
  railMenuTarget.value = target;
  railMenuRef.value?.open(event.clientX, event.clientY);
}

/** 左栏右键菜单项：按节点类别给出不同能力 */
const railMenuItems = computed<ReContextMenuItem[]>(() => {
  const t = railMenuTarget.value;
  if (!t) return [];
  if (t.kind === 'root') {
    return [
      { label: '查看全部模板', icon: 'Files', command: 'all' },
      { separator: true },
      { label: '新建模板', icon: 'Plus', command: 'create' },
      { label: '刷新台账', icon: 'RefreshRight', command: 'refresh' },
    ];
  }
  if (t.kind === 'source') {
    return [
      { label: `筛选来源：${t.label}`, icon: 'Filter', command: 'filter' },
      { label: '仅看已上线', icon: 'CircleCheck', command: 'only-online' },
      { label: '仅看草稿', icon: 'EditPen', command: 'only-draft' },
      { separator: true },
      { label: '复制来源标识', icon: 'CopyDocument', command: 'copy-source' },
      { label: '清除该筛选', icon: 'Close', command: 'clear' },
    ];
  }
  return [
    { label: `筛选状态：${t.label}`, icon: 'Filter', command: 'filter' },
    { separator: true },
    { label: '清除该筛选', icon: 'Close', command: 'clear' },
  ];
});

/** 左栏右键命令分发 */
function onRailMenuSelect(command: string): void {
  const t = railMenuTarget.value;
  if (!t) return;
  const kind: FilterKind | null = t.kind === 'root' ? null : t.kind;
  switch (command) {
    case 'all':
      clearFilters();
      break;
    case 'filter':
      if (kind) setFilter(kind, t.value);
      break;
    case 'only-online':
      setFilter('status', 'online');
      break;
    case 'only-draft':
      setFilter('status', 'draft');
      break;
    case 'copy-source':
      void copyText(t.value, '来源标识');
      break;
    case 'clear':
      if (kind) setFilter(kind, '');
      break;
    case 'create':
      openCreateForm();
      break;
    case 'refresh':
      reloadLedger();
      break;
  }
}

// ------------------- 工作区页签（ReTabs） -------------------
/** 「模板台账」固定页签名：列表常驻，不可关闭 */
const LEDGER_TAB = 'ledger';

/** 页签类别 */
type WorkTabKind = 'ledger' | 'detail' | 'content';

/**
 * 工作区页签：比 ReTabsItem 多带业务上下文。
 *
 * <p>ReTabs 只回传页签 name，内容区分支一律按 name 回查本数组，
 * 不往 ReTabsItem 上强转业务字段。行数据按 templateId 从 `list` 现查，
 * 台账刷新后详情页签自动跟着变新。</p>
 */
interface WorkTab extends ReTabsItem {
  kind: WorkTabKind;
  templateId?: string;
}

const workTabs = ref<WorkTab[]>([
  { name: LEDGER_TAB, kind: 'ledger', label: '模板台账', hint: '台账', icon: 'Files', closable: false },
]);
const activeTab = ref(LEDGER_TAB);

/** 按 name 回查页签 */
function tabOf(name: string): WorkTab | undefined {
  return workTabs.value.find((tab) => tab.name === name);
}

/** 按 name 取页签类别（模板里做内容分支用） */
function tabKindOf(name: string): WorkTabKind | undefined {
  return tabOf(name)?.kind;
}

/** 页签绑定的模板：始终取刷新后的最新对象；不在当前页时给空模板兜底 */
function tabTemplate(name: string): TemplateInfo {
  const id = tabOf(name)?.templateId;
  if (!id) return EMPTY_TEMPLATE;
  return list.value.find((row) => row.id === id) ?? EMPTY_TEMPLATE;
}

/** 打开（或切到）一个功能页签：同「模板 + 功能」只开一次 */
function openWorkTab(tab: WorkTab): void {
  const exist = tabOf(tab.name);
  if (exist) {
    // 名称随台账刷新可能变，重开时用最新文案覆盖
    exist.label = tab.label;
    exist.hint = tab.hint;
    activeTab.value = tab.name;
    return;
  }
  workTabs.value = [...workTabs.value, tab];
  activeTab.value = tab.name;
}

/** 打开模板详情页签 */
function openDetailTab(row: TemplateInfo): void {
  openWorkTab({
    name: `detail:${row.id}`,
    kind: 'detail',
    label: row.name || '未命名模板',
    hint: '详情',
    icon: 'Document',
    status: row.status === 'online' ? 'online' : row.status === 'offline' ? 'offline' : 'unknown',
    templateId: row.id,
  });
  // 来源模块信息（三方模板 ID / 账号 / 渠道 / 占位符）按模板 ID 现取
  void loadSourceDetail(row.id);
}

/** 打开模板内容页签（只读查看 content 原文，不渲染） */
function openContentTab(row: TemplateInfo): void {
  openWorkTab({
    name: `content:${row.id}`,
    kind: 'content',
    label: row.name || '未命名模板',
    hint: '内容',
    icon: 'Tickets',
    templateId: row.id,
  });
}

/** 关闭一个页签：台账页签不参与 */
function closeWorkTab(name: string): void {
  if (name === LEDGER_TAB) return;
  const idx = workTabs.value.findIndex((tab) => tab.name === name);
  if (idx < 0) return;
  const rest = workTabs.value.filter((tab) => tab.name !== name);
  workTabs.value = rest;
  if (activeTab.value !== name) return;
  activeTab.value = rest[idx]?.name ?? rest[idx - 1]?.name ?? LEDGER_TAB;
}

/** 关闭其它页签（保留台账与当前） */
function closeOtherTabs(name: string): void {
  workTabs.value = workTabs.value.filter((tab) => tab.name === name || tab.name === LEDGER_TAB);
  activeTab.value = name;
}

/** 关闭右侧页签 */
function closeRightTabs(name: string): void {
  const idx = workTabs.value.findIndex((tab) => tab.name === name);
  if (idx < 0) return;
  workTabs.value = workTabs.value.slice(0, idx + 1);
  if (!workTabs.value.some((tab) => tab.name === activeTab.value)) activeTab.value = name;
}

/** 关闭全部页签：回到「模板台账」 */
function closeAllWorkTabs(): void {
  workTabs.value = workTabs.value.filter((tab) => tab.name === LEDGER_TAB);
  activeTab.value = LEDGER_TAB;
}

/** 页签右键菜单 */
const tabContextMenu = computed<ReTabsContextItem[]>(() => {
  const idx = workTabs.value.findIndex((tab) => tab.name === activeTab.value);
  const isLedger = activeTab.value === LEDGER_TAB;
  const hasRight = idx >= 0 && idx < workTabs.value.length - 1;
  return [
    { key: 'refresh', label: '刷新台账数据', icon: 'RefreshRight' },
    { key: 'close', label: '关闭当前页签', icon: 'Close', divided: true, disabled: isLedger },
    { key: 'close-others', label: '关闭其它页签', icon: 'CircleClose', disabled: workTabs.value.length <= 2 },
    { key: 'close-right', label: '关闭右侧页签', icon: 'DArrowRight', disabled: !hasRight },
    { key: 'close-all', label: '关闭全部页签', icon: 'Delete', danger: true, divided: true, disabled: workTabs.value.length <= 1 },
  ];
});

/** 页签右键命令分发 */
function onTabCommand(payload: { key: string; tab: ReTabsItem }): void {
  switch (payload.key) {
    case 'refresh':
      reloadLedger();
      break;
    case 'close':
      closeWorkTab(payload.tab.name);
      break;
    case 'close-others':
      closeOtherTabs(payload.tab.name);
      break;
    case 'close-right':
      closeRightTabs(payload.tab.name);
      break;
    case 'close-all':
      closeAllWorkTabs();
      break;
  }
}

// ------------------- 操作 -------------------
/** 打开设计器（由 @pages/template 页面承载：/template/designer/:id） */
function openDesigner(row: TemplateInfo): void {
  navigateTemplate('designer', row.id);
}

/** 打开预览（由 @pages/template 页面承载：/template/preview/:id） */
function openPreview(row: TemplateInfo): void {
  navigateTemplate('preview', row.id);
}

/** 导航到 @pages/template 路由（未注册时只向前说明原因，避免用户进 404 页） */
function navigateTemplate(path: string, id: string): void {
  const prefix = `/template/${path}`;
  const found = router.getRoutes().some((r) => r.path === prefix || r.path.startsWith(`${prefix}/`));
  if (!found) {
    message.warning(`「${prefix}」页由 @pages/template 提供，监控侧未注册该路由（请前往模板应用查看）`);
    return;
  }
  void router.push(`${prefix}/${id}`);
}

/**
 * 打开「账号管理」（短信 / 邮箱账号在那边维护，阿里云短信等模板要先在那边配好账号再同步）。
 *
 * <p>固定模板的来源就是这些账号：消息类模板由来源模块同步进统一模板库，
 * 所以模板库需要一条直达入口，不能让用户自己猜在哪个菜单下。</p>
 */
function goAccounts(): void {
  const target = '/account-assets';
  const found = router.getRoutes().some((r) => r.path === target);
  if (!found) {
    message.warning('监控侧未注册「账号资产」路由（请前往账号管理查看）');
    return;
  }
  void router.push(target);
}

/** 复制到剪贴板（失败只提示，不影响交互） */
async function copyText(text: string, what: string): Promise<void> {
  if (!text) {
    message.warning(`没有可复制的${what}`);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    message.success(`${what}已复制`);
  } catch {
    message.warning('浏览器不允许访问剪贴板，请手动复制');
  }
}

/** 台账行点击：打开详情页签（原抽屉收敛进工作区，避免两套并存） */
function onRowClick(row: TemplateInfo): void {
  openDetailTab(normalizeRow(row as unknown as Record<string, unknown>));
}

// ------------------- 自定义 / 固定模板 -------------------
/**
 * 固定模板（三方同步，内容不可改）还是自定义模板（本系统设计）。
 *
 * <p>判据只看来源：{@code hiprint} 是本系统绘制/设计的产物，算自定义；
 * {@code message}（消息）/ {@code paper}（组卷）都是从三方同步进来的，
 * 内容由三方维护，本系统只能查看，改内容要回来源模块。</p>
 */
function isFixedTemplate(row: TemplateInfo): boolean {
  return row.source === 'message' || row.source === 'paper';
}

/** 模板形态文案 */
function modeOf(row: TemplateInfo): string {
  return isFixedTemplate(row) ? '固定（三方同步）' : '自定义';
}

/**
 * 三方模板 ID。
 *
 * <p>固定模板（三方同步）才有：优先取后端 {@code templateInfoSourceCode}
 * （v2.4 起单列的字段），取不到再回落到副标题——旧数据里它曾被写在副标题上，
 * 前后端不同步上线的窗口里也不会显示空。</p>
 */
function thirdPartyIdOf(row: TemplateInfo): string {
  if (!isFixedTemplate(row)) return '—';
  return (row.sourceCode ?? '').trim() || row.subtitle || '—';
}

/** 自定义模板的副标题（固定模板的 subtitle 位被三方 ID 占用，不再当副标题展示） */
function subtitleOf(row: TemplateInfo): string {
  return isFixedTemplate(row) ? '' : row.subtitle;
}

// ------------------- 模板详情（按模板 ID 取信息） -------------------
/**
 * 详情页签里「来源模块信息」的数据。
 *
 * <p>走真实接口 {@code GET /api/template/{id}/detail}：固定模板会带回三方模板 ID、
 * 归属账号、推送渠道与占位符参数；自定义模板这些项为空。取不到就把原因显示在该区块里，
 * 不影响页签里本来就有、来自台账行的基础信息。</p>
 */
const sourceDetails = ref<Record<string, TemplateSourceDetail | null>>({});
const sourceDetailErrors = ref<Record<string, string>>({});
const sourceDetailLoading = ref<Record<string, boolean>>({});

/** 取某个模板的来源详情（同一个模板只取一次，失败可点重试） */
async function loadSourceDetail(id: string): Promise<void> {
  if (!id || sourceDetailLoading.value[id]) return;
  sourceDetailLoading.value = { ...sourceDetailLoading.value, [id]: true };
  sourceDetailErrors.value = { ...sourceDetailErrors.value, [id]: '' };
  try {
    const detail = await templateApi.detail(id);
    sourceDetails.value = { ...sourceDetails.value, [id]: detail ?? null };
  } catch (e) {
    sourceDetailErrors.value = {
      ...sourceDetailErrors.value,
      [id]: e instanceof Error ? e.message : String(e),
    };
  } finally {
    sourceDetailLoading.value = { ...sourceDetailLoading.value, [id]: false };
  }
}

/** 页签里的来源详情（未取到时为空） */
function sourceDetailOf(name: string): TemplateSourceDetail | null {
  const id = tabOf(name)?.templateId;
  return id ? sourceDetails.value[id] ?? null : null;
}

/** 页签里的来源详情失败原因 */
function sourceDetailErrorOf(name: string): string {
  const id = tabOf(name)?.templateId;
  return id ? sourceDetailErrors.value[id] ?? '' : '';
}

// ------------------- 新建 / 编辑模板 -------------------
/**
 * 新建 / 编辑模板弹窗。
 *
 * <p>照搬模板应用（pages/template TemplateView）的新建入口：名称 / 副标题 / 语言 /
 * 类型 / 备注，提交走真实接口 `POST /api/template/add` 或 `PUT /api/template/{id}`，
 * 失败只弹原因，不静默、不造假数据。</p>
 *
 * <p>来源与状态不在表单里给用户改：新建固定走「绘制」（hiprint）+ 草稿，
 * 编辑时原样带回原行的 source / status，避免改个名字顺手把来源覆盖掉。</p>
 */
const formVisible = ref(false);
const formTitle = ref('');
const editingId = ref('');
const saving = ref(false);
const form = ref<{
  name: string;
  subtitle: string;
  language: TemplateLanguage;
  type: TemplateType;
  remark: string;
  source: TemplateSource;
  status: TemplateStatus;
}>({
  name: '',
  subtitle: '',
  language: 'html',
  type: 'document',
  remark: '',
  source: 'hiprint',
  status: 'draft',
});

/** 语言下拉（与台账列文案同一套） */
const languageOptions = [
  { label: 'HTML', value: 'html' },
  { label: 'Vue', value: 'vue' },
  { label: 'JSX', value: 'jsx' },
  { label: 'JSON', value: 'json' },
];
/** 类型下拉（与台账列文案同一套） */
const typeOptions = [
  { label: '单据', value: 'document' },
  { label: '短信', value: 'sms' },
  { label: '邮件', value: 'email' },
  { label: '标签', value: 'label' },
  { label: '其他', value: 'other' },
];

/** 打开「新建模板」 */
function openCreateForm(): void {
  editingId.value = '';
  formTitle.value = '新建模板';
  form.value = {
    name: '',
    subtitle: '',
    language: 'html',
    type: 'document',
    remark: '',
    source: 'hiprint',
    status: 'draft',
  };
  formVisible.value = true;
}

/** 打开「编辑模板信息」 */
function openEditForm(row: TemplateInfo): void {
  editingId.value = row.id;
  formTitle.value = `编辑模板 · ${row.name || '未命名'}`;
  form.value = {
    name: row.name,
    subtitle: row.subtitle,
    language: row.language,
    type: row.type,
    remark: row.remark ?? '',
    source: row.source,
    status: row.status,
  };
  formVisible.value = true;
}

/** 提交新建 / 编辑 */
async function submitForm(): Promise<void> {
  if (!form.value.name.trim()) {
    message.warning('请输入模板名称');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: form.value.name.trim(),
      subtitle: form.value.subtitle,
      language: form.value.language,
      type: form.value.type,
      status: form.value.status,
      remark: form.value.remark,
      source: form.value.source,
    };
    if (editingId.value) {
      await templateApi.update(editingId.value, payload);
      message.success('更新成功');
    } else {
      await templateApi.add(payload);
      message.success('新增成功');
    }
    formVisible.value = false;
    reloadLedger();
  } catch (e) {
    // 后端不可达 / 校验失败时把原话摊出来，不静默吞掉
    message.error(e instanceof Error ? e.message : String(e));
  } finally {
    saving.value = false;
  }
}

// ------------------- 台账列 -------------------
const columns: ReTableColumn[] = [
  { prop: 'name', label: '模板名称', minWidth: 220, showOverflowTooltip: true },
  { prop: 'mode', label: '形态', width: 108, slot: 'mode' },
  { prop: 'source', label: '来源', width: 100, formatter: sourceText },
  { prop: 'sourceCode', label: '三方模板 ID', minWidth: 150, slot: 'sourceCode' },
  { prop: 'status', label: '状态', width: 120, formatter: statusText },
  { prop: 'type', label: '类型', width: 100, formatter: typeText },
  { prop: 'language', label: '语言', width: 90, formatter: languageText },
  { prop: 'createdAt', label: '创建时间', width: 170, formatter: fmtTime },
  { prop: 'actions', label: '操作', width: 150, align: 'center', fixed: 'right', slot: 'actions' },
];

// ------------------- 台账行右键菜单（ReTable context-menu） -------------------
/**
 * 行右键菜单。
 *
 * <p>用函数形式而不是静态数组：固定模板（三方同步）不允许设计 / 编辑信息，
 * 这两项要在右键那一刻按行灰掉，静态数组做不到「按行禁用」。</p>
 */
function tableMenu(ctx: ReTableContextMenuContext): ReTableContextMenuItem[] {
  const row = normalizeRow(ctx.row);
  const fixed = isFixedTemplate(row);
  return [
    { key: 'detail', label: '模板详情', icon: 'Document' },
    { key: 'content', label: '查看模板内容', icon: 'Tickets' },
    {
      key: 'designer',
      label: fixed ? '打开设计器（固定模板不可设计）' : '打开设计器',
      icon: 'EditPen',
      divided: true,
      disabled: fixed,
    },
    { key: 'preview', label: '打开预览页', icon: 'View' },
    {
      key: 'edit',
      label: '编辑模板信息',
      icon: 'Edit',
      divided: true,
      disabled: fixed,
    },
    { key: 'copy-id', label: '复制模板 ID', icon: 'CopyDocument', divided: true },
    { key: 'copy-source-code', label: '复制三方模板 ID', icon: 'CopyDocument', disabled: !fixed },
    { key: 'filter-source', label: '按该来源筛选', icon: 'Filter', divided: true },
    { key: 'filter-status', label: '按该状态筛选', icon: 'Filter' },
  ];
}

/** 行右键命令分发：ctx.row 就是被右键的行 */
function onTableMenuSelect(item: ReTableContextMenuItem, ctx: ReTableContextMenuContext): void {
  const row = normalizeRow(ctx.row);
  switch (item.key) {
    case 'detail':
      openDetailTab(row);
      break;
    case 'content':
      openContentTab(row);
      break;
    case 'designer':
      openDesigner(row);
      break;
    case 'preview':
      openPreview(row);
      break;
    case 'edit':
      openEditForm(row);
      break;
    case 'copy-id':
      void copyText(row.id, '模板 ID');
      break;
    case 'copy-source-code':
      void copyText(thirdPartyIdOf(row), '三方模板 ID');
      break;
    case 'filter-source':
      setFilter('source', row.source);
      break;
    case 'filter-status':
      setFilter('status', row.status);
      break;
  }
}
</script>

<template>
  <div class="tm">
    <div class="tm-body">
      <!-- ==================== 左：来源 / 状态快筛树 ==================== -->
      <aside class="tm-rail" :class="{ 'is-collapsed': railCollapsed }">
        <!-- 折叠态：只留计数与展开按钮 -->
        <div v-if="railCollapsed" class="tm-strip">
          <button type="button" class="tm-strip__count" title="展开筛选栏" @click="toggleRail">
            <b>{{ list.length }}</b>
            <span>/{{ total }}</span>
          </button>
          <span class="tm-strip__dots">
            <i class="is-on" :title="`已上线 ${stats.online}`" />
            <i class="is-draft" :title="`草稿 ${stats.draft}`" />
            <i class="is-off" :title="`已下线 ${stats.offline}`" />
          </span>
          <span class="tm-strip__gap" />
          <button type="button" class="tm-strip__toggle" title="展开筛选栏" @click="toggleRail">
            <ReIcon name="ArrowRight" :size="13" />
          </button>
        </div>

        <div v-show="!railCollapsed" class="tm-rail__head">
          <div class="tm-rail__row">
            <span class="tm-rail__title">模板库</span>
            <span class="tm-rail__count">{{ list.length }}<i>/{{ total }}</i></span>
            <span class="tm-rail__gap" />
            <button type="button" class="tm-tool" title="打开账号管理（短信 / 邮箱账号，阿里云短信等模板在这边同步）" @click="goAccounts()">
              <ReIcon name="Key" :size="12" />
            </button>
            <button type="button" class="tm-tool" title="刷新台账" @click="reloadLedger">
              <ReIcon name="RefreshRight" :size="12" />
            </button>
            <button type="button" class="tm-tool is-primary" title="新建模板" @click="openCreateForm()">
              <ReIcon name="Plus" :size="12" />
            </button>
            <button type="button" class="tm-tool" title="收起筛选栏" @click="toggleRail">
              <ReIcon name="ArrowLeft" :size="12" />
            </button>
          </div>
        </div>

        <!-- 树：全部 / 按来源 / 按状态；左键筛选，右键交给 ReContextMenu -->
        <div v-show="!railCollapsed" class="tm-tree">
          <div
            class="tm-node tm-node--root"
            :class="{ 'is-active': !sourceFilter && !statusFilter }"
            title="全部模板"
            @click="clearFilters()"
            @contextmenu="openRailMenu($event, { kind: 'root', value: '', label: '全部模板' })"
          >
            <span class="tm-node__dot is-all" />
            <span class="tm-node__name">全部模板</span>
            <span class="tm-node__count" :title="`共 ${total} 条`">{{ total }}</span>
          </div>

          <div class="tm-group">
            <div class="tm-group__title">按来源</div>
            <div
              v-for="node in sourceNodes"
              :key="node.value"
              class="tm-node"
              :class="{ 'is-active': sourceFilter === node.value }"
              :title="`${node.label}（本页 ${node.count} 条）`"
              @click="toggleFilter('source', node.value)"
              @contextmenu="openRailMenu($event, { kind: 'source', value: node.value, label: node.label })"
            >
              <ReIcon :name="node.icon" :size="13" class="tm-node__icon" />
              <span class="tm-node__name">{{ node.label }}</span>
              <span class="tm-node__count" title="本页条数">{{ node.count }}</span>
            </div>
          </div>

          <div class="tm-group">
            <div class="tm-group__title">按状态</div>
            <div
              v-for="node in statusNodes"
              :key="node.value"
              class="tm-node"
              :class="{ 'is-active': statusFilter === node.value }"
              :title="`${node.label}（本页 ${node.count} 条）`"
              @click="toggleFilter('status', node.value)"
              @contextmenu="openRailMenu($event, { kind: 'status', value: node.value, label: node.label })"
            >
              <ReIcon :name="node.icon" :size="13" class="tm-node__icon" :class="`is-${node.value}`" />
              <span class="tm-node__name">{{ node.label }}</span>
              <span class="tm-node__count" title="本页条数">{{ node.count }}</span>
            </div>
          </div>
        </div>

        <div v-show="!railCollapsed" class="tm-rail__foot">
          <span class="tm-foot__hint">本页 {{ list.length }} 条 · 共 {{ total }} 条</span>
        </div>

        <!-- 左栏右键菜单：根 / 来源 / 状态共用，命令按上下文分发 -->
        <ReContextMenu
          ref="railMenuRef"
          :items="railMenuItems"
          :title="railMenuTarget?.label || ''"
          subtitle="筛选项"
          @select="onRailMenuSelect"
        />
      </aside>

      <!-- ==================== 右：工作区页签 ==================== -->
      <section class="tm-work">
        <ReTabs
          v-model="activeTab"
          :tabs="workTabs"
          closable
          show-close-all
          :context-menu="tabContextMenu"
          empty-text="从左侧选择模板来源，或右键台账行打开功能"
          @close="closeWorkTab"
          @close-all="closeAllWorkTabs"
          @context-command="onTabCommand"
        >
          <template #default="{ tab }">
            <!-- ============ 模板台账：统计 + 工具条 + 表格 ============ -->
            <div v-if="tab.name === LEDGER_TAB" class="tm-ledger">
              <div class="tm-stats">
                <div class="tm-stat">
                  <b>{{ stats.total }}</b>
                  <span>模板总数</span>
                </div>
                <div class="tm-stat is-online">
                  <b>{{ stats.online }}</b>
                  <span>已上线</span>
                </div>
                <div class="tm-stat is-draft">
                  <b>{{ stats.draft }}</b>
                  <span>草稿</span>
                </div>
                <div class="tm-stat is-offline">
                  <b>{{ stats.offline }}</b>
                  <span>已下线</span>
                </div>
              </div>

              <div class="tm-toolbar">
                <ReInput
                  v-model="keywordInput"
                  style="width: 240px"
                  placeholder="模板名称 / 备注，回车查询"
                  clearable
                  @keyup.enter="search"
                  @clear="search"
                />
                <ReButton type="primary" icon="Search" show-text @click="search">
                  查询
                </ReButton>
                <ReButton text @click="reset">
                  重置
                </ReButton>
                <ReButton icon="Plus" show-text @click="openCreateForm()">
                  新建模板
                </ReButton>
                <ReButton icon="Key" show-text @click="goAccounts()">
                  账号管理
                </ReButton>
                <span class="tm-toolbar__gap" />
                <span class="tm-toolbar__filter">
                  当前筛选：<b>{{ filterLabel }}</b>
                  <button
                    v-if="sourceFilter || statusFilter"
                    type="button"
                    class="tm-toolbar__clear"
                    @click="clearFilters()"
                  >
                    清除
                  </button>
                </span>
                <span class="tm-toolbar__count">右键行可打开详情 / 内容 / 设计</span>
              </div>

              <!-- 取数失败：把原因摊开，不给假数据 -->
              <div v-if="loadError" class="tm-error">
                <span class="tm-error__text">
                  <ReIcon name="WarningFilled" class="tm-error__icon" />
                  模板数据加载失败（GET /api/template/page）：{{ loadError }}
                </span>
                <ReButton text type="primary" icon="Refresh" @click="reloadLedger">
                  重试
                </ReButton>
              </div>

              <div class="tm-ledger__table">
                <ReTable
                  ref="tableRef"
                  table-id="template-ledger"
                  row-key="id"
                  :loader="load"
                  :params="queryParams"
                  :columns="columns"
                  :empty-text="loadError ? `加载失败：${loadError}` : '暂无模板数据'"
                  :context-menu="tableMenu"
                  pagination
                  @row-click="onRowClick"
                  @context-menu-select="onTableMenuSelect"
                >
                  <template #empty>
                    <div class="tm-empty">
                      <ReIcon name="Files" :size="22" />
                      <b>{{ loadError ? '模板数据加载失败' : '暂无模板数据' }}</b>
                      <span v-if="loadError">{{ loadError }}</span>
                      <span v-else>
                        自建模板点上方「新建模板」；短信 / 邮件这类固定模板要先在
                        <button type="button" class="tm-empty__link" @click="goAccounts()">账号管理</button>
                        配好账号并同步（例如阿里云短信）。
                      </span>
                    </div>
                  </template>
                  <!-- 形态列 | 自定义可设计；固定是三方同步来的，内容不可改 -->
                  <template #col-mode="{ row }: { row: TemplateInfo }">
                    <ReTag :type="isFixedTemplate(row) ? 'info' : 'primary'" effect="plain" round size="small">
                      {{ isFixedTemplate(row) ? '固定' : '自定义' }}
                    </ReTag>
                  </template>
                  <!-- 三方模板 ID：固定模板才有，来自来源模块的模板编码 -->
                  <template #col-sourceCode="{ row }: { row: TemplateInfo }">
                    <span v-if="isFixedTemplate(row)" class="mono tm-code-id" :title="thirdPartyIdOf(row)">
                      {{ thirdPartyIdOf(row) }}
                    </span>
                    <span v-else class="tm-muted">本系统自建</span>
                  </template>
                  <!-- 状态列 | ReTag 带圆点 -->
                  <template #col-status="{ row }: { row: Record<string, unknown> }">
                    <ReTag
                      :type="statusConfigForRow(row).type"
                      :effect="statusConfigForRow(row).type === 'success' ? 'dark' : 'light'"
                      :dot="true"
                      :dot-color="statusConfigForRow(row).dotColor"
                      round
                      size="small"
                    >
                      {{ statusConfigForRow(row).label }}
                    </ReTag>
                  </template>
                  <!-- 操作列 | ReTable 把 `slot: 'actions'` 转给父组件的插槽 -->
                  <template #actions="{ row }: { row: TemplateInfo }">
                    <ReButton
                      layout="square"
                      type="primary"
                      icon="EditPen"
                      :tip="isFixedTemplate(row) ? '固定模板由三方维护，不可设计' : '设计'"
                      :disabled="isFixedTemplate(row)"
                      @click.stop="openDesigner(row)"
                    />
                    <ReButton layout="square" type="success" icon="View" tip="预览" @click.stop="openPreview(row)" />
                    <ReButton layout="square" icon="Document" tip="详情" @click.stop="openDetailTab(normalizeRow(row as unknown as Record<string, unknown>))" />
                  </template>
                </ReTable>
              </div>
            </div>

            <!-- ============ 模板详情 ============ -->
            <div v-else-if="tabKindOf(tab.name) === 'detail'" class="tm-panel">
              <header class="tm-panel__head">
                <div class="tm-panel__title">{{ tabTemplate(tab.name).name }}</div>
                <div class="tm-panel__sub">
                  {{ subtitleOf(tabTemplate(tab.name)) || (isFixedTemplate(tabTemplate(tab.name)) ? '固定模板 · 内容由三方维护' : '自定义模板') }}
                </div>
              </header>

              <div v-if="tabTemplate(tab.name).id" class="tm-kv">
                <div class="tm-kv__row">
                  <span class="tm-kv__label">形态</span>
                  <span class="tm-kv__value">
                    <ReTag :type="isFixedTemplate(tabTemplate(tab.name)) ? 'info' : 'primary'" effect="plain" round size="small">
                      {{ isFixedTemplate(tabTemplate(tab.name)) ? '固定（三方同步）' : '自定义' }}
                    </ReTag>
                  </span>
                </div>
                <div v-if="isFixedTemplate(tabTemplate(tab.name))" class="tm-kv__row">
                  <span class="tm-kv__label">三方模板 ID</span>
                  <span class="tm-kv__value mono">
                    {{ thirdPartyIdOf(tabTemplate(tab.name)) }}
                    <button
                      type="button"
                      class="tm-kv__copy"
                      title="复制三方模板 ID"
                      @click="copyText(thirdPartyIdOf(tabTemplate(tab.name)), '三方模板 ID')"
                    >
                      <ReIcon name="CopyDocument" :size="12" />
                    </button>
                  </span>
                </div>
                <div class="tm-kv__row">
                  <span class="tm-kv__label">状态</span>
                  <span class="tm-kv__value">
                    <ReTag
                      :type="statusMap[tabTemplate(tab.name).status]?.type ?? 'info'"
                      :dot="true"
                      :dot-color="statusMap[tabTemplate(tab.name).status]?.dotColor ?? '#8C8C8C'"
                      round
                      size="small"
                    >
                      {{ statusOf(tabTemplate(tab.name)) }}
                    </ReTag>
                  </span>
                </div>
                <div class="tm-kv__row">
                  <span class="tm-kv__label">来源</span>
                  <span class="tm-kv__value">{{ sourceOf(tabTemplate(tab.name)) }}</span>
                </div>
                <div class="tm-kv__row">
                  <span class="tm-kv__label">语言 / 类型</span>
                  <span class="tm-kv__value">{{ languageOf(tabTemplate(tab.name)) }} · {{ typeOf(tabTemplate(tab.name)) }}</span>
                </div>
                <div class="tm-kv__row">
                  <span class="tm-kv__label">模板 ID</span>
                  <span class="tm-kv__value mono">{{ tabTemplate(tab.name).id }}</span>
                </div>
                <div class="tm-kv__row">
                  <span class="tm-kv__label">创建时间</span>
                  <span class="tm-kv__value">{{ fmtTimeOf(tabTemplate(tab.name).createdAt) }}</span>
                </div>
                <div class="tm-kv__row">
                  <span class="tm-kv__label">更新时间</span>
                  <span class="tm-kv__value">{{ fmtTimeOf(tabTemplate(tab.name).updatedAt) }}</span>
                </div>
                <div class="tm-kv__row">
                  <span class="tm-kv__label">备注</span>
                  <span class="tm-kv__value">{{ tabTemplate(tab.name).remark || '—' }}</span>
                </div>
              </div>
              <div v-else class="tm-panel__empty">
                该模板已不在当前页数据里（可能被删除，或翻页 / 改了筛选条件），请回到「模板台账」重新查询。
              </div>

              <!-- 来源模块信息：按模板 ID 从 /api/template/{id}/detail 取（固定模板才有账号 / 渠道 / 占位符） -->
              <div v-if="tabTemplate(tab.name).id" class="tm-source">
                <div class="tm-source__head">
                  <span class="tm-source__title">来源模块信息</span>
                  <span class="tm-source__hint">GET /api/template/{id}/detail</span>
                  <span class="tm-source__gap" />
                  <button
                    type="button"
                    class="tm-source__retry"
                    :disabled="sourceDetailLoading[tabTemplate(tab.name).id]"
                    @click="loadSourceDetail(tabTemplate(tab.name).id)"
                  >
                    <ReIcon :name="sourceDetailLoading[tabTemplate(tab.name).id] ? 'Loading' : 'Refresh'" :size="12" />
                    重新获取
                  </button>
                </div>

                <div v-if="sourceDetailErrorOf(tab.name)" class="tm-source__error">
                  <ReIcon name="WarningFilled" :size="13" />
                  取来源详情失败：{{ sourceDetailErrorOf(tab.name) }}
                </div>

                <div v-else-if="sourceDetailOf(tab.name)" class="tm-kv">
                  <div class="tm-kv__row">
                    <span class="tm-kv__label">形态</span>
                    <span class="tm-kv__value">
                      {{ sourceDetailOf(tab.name)?.fixed ? '固定（三方同步，内容不可改）' : '自定义（本系统设计）' }}
                    </span>
                  </div>
                  <div class="tm-kv__row">
                    <span class="tm-kv__label">三方模板 ID</span>
                    <span class="tm-kv__value mono">{{ sourceDetailOf(tab.name)?.sourceCode || '—' }}</span>
                  </div>
                  <div class="tm-kv__row">
                    <span class="tm-kv__label">归属账号</span>
                    <span class="tm-kv__value">
                      {{ sourceDetailOf(tab.name)?.providerName || '—' }}
                      <span v-if="sourceDetailOf(tab.name)?.providerId" class="tm-muted">
                        （ID {{ sourceDetailOf(tab.name)?.providerId }}）
                      </span>
                    </span>
                  </div>
                  <div class="tm-kv__row">
                    <span class="tm-kv__label">推送渠道</span>
                    <span class="tm-kv__value mono">{{ sourceDetailOf(tab.name)?.channel || '—' }}</span>
                  </div>
                  <div class="tm-kv__row">
                    <span class="tm-kv__label">内容类型</span>
                    <span class="tm-kv__value">{{ sourceDetailOf(tab.name)?.contentType || '—' }}</span>
                  </div>
                  <div class="tm-kv__row">
                    <span class="tm-kv__label">模板参数</span>
                    <span class="tm-kv__value">
                      <template v-if="sourceDetailOf(tab.name)?.params?.length">
                        <ReTag
                          v-for="p in sourceDetailOf(tab.name)?.params"
                          :key="p"
                          type="info"
                          effect="plain"
                          size="small"
                          round
                          class="tm-source__param"
                        >
                          {{ p }}
                        </ReTag>
                      </template>
                      <span v-else class="tm-muted">内容里没有 {{ '{{' }}参数{{ '}}' }} 占位符</span>
                    </span>
                  </div>
                </div>

                <div v-else class="tm-source__loading">正在获取来源模块信息…</div>
              </div>

              <div v-if="tabTemplate(tab.name).id" class="tm-panel__ops">
                <ReButton
                  type="primary"
                  icon="EditPen"
                  show-text
                  size="small"
                  :disabled="isFixedTemplate(tabTemplate(tab.name))"
                  :tip="isFixedTemplate(tabTemplate(tab.name)) ? '固定模板由三方维护，改内容请回来源模块' : ''"
                  @click="openDesigner(tabTemplate(tab.name))"
                >
                  打开设计器
                </ReButton>
                <ReButton icon="View" show-text size="small" @click="openPreview(tabTemplate(tab.name))">
                  打开预览页
                </ReButton>
                <ReButton icon="Tickets" show-text size="small" @click="openContentTab(tabTemplate(tab.name))">
                  查看内容
                </ReButton>
                <ReButton
                  v-if="!isFixedTemplate(tabTemplate(tab.name))"
                  icon="Edit"
                  show-text
                  size="small"
                  text
                  @click="openEditForm(tabTemplate(tab.name))"
                >
                  编辑信息
                </ReButton>
                <ReButton icon="CopyDocument" show-text size="small" text @click="copyText(tabTemplate(tab.name).id, '模板 ID')">
                  复制 ID
                </ReButton>
              </div>
            </div>

            <!-- ============ 模板内容（只读） ============ -->
            <div v-else-if="tabKindOf(tab.name) === 'content'" class="tm-panel">
              <header class="tm-panel__head">
                <div class="tm-panel__title">{{ tabTemplate(tab.name).name }}</div>
                <div class="tm-panel__sub">
                  模板内容原文（{{ languageOf(tabTemplate(tab.name)) }}）·
                  {{ isFixedTemplate(tabTemplate(tab.name)) ? '固定模板，内容由三方维护，本系统只读' : '只读，编辑请进设计器' }}
                </div>
              </header>

              <pre v-if="tabTemplate(tab.name).content" class="tm-code">{{ tabTemplate(tab.name).content }}</pre>
              <div v-else-if="tabTemplate(tab.name).id" class="tm-panel__empty">
                {{ isFixedTemplate(tabTemplate(tab.name))
                  ? '该固定模板没有内容字段——内容在三方那边，本系统只保存模板 ID 与基础信息。'
                  : '该模板没有内容字段（content 为空）——hiprint 模板的设计产物可能只存在于设计器中，请打开设计器查看。' }}
              </div>
              <div v-else class="tm-panel__empty">
                该模板已不在当前页数据里，请回到「模板台账」重新查询。
              </div>

              <div v-if="tabTemplate(tab.name).id" class="tm-panel__ops">
                <ReButton
                  type="primary"
                  icon="EditPen"
                  show-text
                  size="small"
                  :disabled="isFixedTemplate(tabTemplate(tab.name))"
                  :tip="isFixedTemplate(tabTemplate(tab.name)) ? '固定模板由三方维护，改内容请回来源模块' : ''"
                  @click="openDesigner(tabTemplate(tab.name))"
                >
                  打开设计器
                </ReButton>
                <ReButton icon="CopyDocument" show-text size="small" text @click="copyText(tabTemplate(tab.name).content || '', '模板内容')">
                  复制内容
                </ReButton>
              </div>
            </div>
          </template>
        </ReTabs>
      </section>
    </div>

    <!-- 新建 / 编辑模板弹窗：固定模板不进这里（内容归三方） -->
    <ReDialog v-model="formVisible" :title="formTitle" width="520px" @confirm="submitForm">
      <div class="tm-form">
        <div class="tm-form__row">
          <span class="tm-form__label is-required">模板名称</span>
          <ReInput v-model="form.name" placeholder="例如 出库单" />
        </div>
        <div class="tm-form__row">
          <span class="tm-form__label">模板副标题</span>
          <ReInput v-model="form.subtitle" placeholder="例如 仓库出库单据" />
        </div>
        <div class="tm-form__row">
          <span class="tm-form__label is-required">模板语言</span>
          <ReSelect v-model="form.language" :options="languageOptions" placeholder="选择语言" />
        </div>
        <div class="tm-form__row">
          <span class="tm-form__label is-required">模板类型</span>
          <ReSelect v-model="form.type" :options="typeOptions" placeholder="选择类型" />
        </div>
        <div class="tm-form__row">
          <span class="tm-form__label">备注</span>
          <ReInput v-model="form.remark" placeholder="不超过 200 字" />
        </div>
        <p class="tm-form__hint">
          这里只新建<strong>自定义模板</strong>（本系统设计，来源 hiprint）。短信 / 邮件这类
          <strong>固定模板</strong>由三方维护，要在
          <button type="button" class="tm-empty__link" @click="goAccounts()">账号管理</button>
          配好账号后同步进来，内容不可改。
        </p>
      </div>
      <template #footer>
        <ReButton @click="formVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="submitForm">确定</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style lang="scss" scoped>
.tm {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

/* ============ 双列主体 ============ */
.tm-body {
  display: flex;
  flex: 1 1 auto;
  gap: 12px;
  min-height: 0;
}

/* ============ 左栏 ============ */
.tm-rail {
  display: flex;
  flex: none;
  flex-direction: column;
  width: 268px;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  box-shadow: var(--el-box-shadow-light, 0 1px 4px rgba(0, 0, 0, 0.04));
  transition: width 0.18s ease;

  &.is-collapsed {
    width: 44px;
  }
}

.tm-strip {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px 0 10px;

  &__count {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    padding: 2px 0;
    font-size: 11px;
    color: var(--el-text-color-secondary);
    background: none;
    border: 0;
    cursor: pointer;

    b {
      font-size: 14px;
      color: var(--el-color-primary);
    }
  }

  &__dots {
    display: flex;
    flex-direction: column;
    gap: 4px;

    i {
      width: 6px;
      height: 6px;
      border-radius: 50%;

      &.is-on { background: var(--el-color-success); }
      &.is-draft { background: var(--el-color-warning); }
      &.is-off { background: var(--el-color-info); }
    }
  }

  &__gap {
    flex: 1;
  }

  &__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    color: var(--el-text-color-secondary);
    background: none;
    border: 0;
    border-radius: 8px;
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
      background: var(--el-fill-color-light);
    }
  }
}

.tm-rail__head {
  padding: 12px 12px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.tm-rail__row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tm-rail__title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tm-rail__count {
  font-size: 11.5px;
  color: var(--el-color-primary);

  i {
    font-style: normal;
    color: var(--el-text-color-placeholder);
  }
}

.tm-rail__gap {
  flex: 1;
}

.tm-tool {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--el-text-color-secondary);
  background: none;
  border: 0;
  border-radius: 7px;
  cursor: pointer;

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-fill-color-light);
  }

  &.is-primary {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);

    &:hover {
      color: #fff;
      background: var(--el-color-primary);
    }
  }
}

/* ============ 左栏树 ============ */
.tm-tree {
  flex: 1 1 auto;
  min-height: 0;
  padding: 8px 8px 4px;
  overflow-y: auto;
}

.tm-group {
  margin-top: 10px;

  &__title {
    padding: 0 8px 4px;
    font-size: 11.5px;
    color: var(--el-text-color-placeholder);
    letter-spacing: 0.4px;
  }
}

.tm-node {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 8px;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
  border-radius: 8px;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.is-active {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
    font-weight: 600;
  }

  &__icon {
    flex: none;
    color: var(--el-text-color-secondary);

    &.is-online { color: var(--el-color-success); }
    &.is-draft { color: var(--el-color-warning); }
    &.is-offline { color: var(--el-color-info); }
  }

  &.is-active &__icon {
    color: inherit;
  }

  &__dot {
    flex: none;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--el-color-primary);
  }

  &__name {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__count {
    flex: none;
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }
}

.tm-rail__foot {
  padding: 8px 12px 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.tm-foot__hint {
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
}

/* ============ 右栏工作区 ============ */
.tm-work {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

/* ============ 台账页签内容 ============ */
.tm-ledger {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  padding-top: 10px;
}

.tm-stats {
  display: grid;
  flex: none;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.tm-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;

  b {
    font-size: 19px;
    font-weight: 600;
    line-height: 1;
    color: var(--el-text-color-primary);
  }

  span {
    font-size: 12px;
    color: var(--el-text-color-regular);
  }

  &.is-online b { color: var(--el-color-success); }
  &.is-draft b { color: var(--el-color-warning); }
  &.is-offline b { color: var(--el-color-info); }
}

.tm-toolbar {
  display: flex;
  flex: none;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;

  &__gap {
    flex: 1;
  }

  &__filter {
    font-size: 12.5px;
    color: var(--el-text-color-regular);

    b {
      color: var(--el-color-primary);
    }
  }

  &__clear {
    margin-left: 4px;
    font-size: 12px;
    color: var(--el-color-primary);
    background: none;
    border: 0;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  &__count {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

.tm-ledger__table {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  :deep(.el-table__header th) {
    background: var(--el-fill-color);
    color: var(--el-text-color-regular);
    font-weight: 600;
    font-size: 13px;
  }

  :deep(.el-table__row td) {
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
}

/* ============ 取数失败提示 ============ */
.tm-error {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border: 1px dashed var(--el-color-danger-light-7);
  border-radius: 10px;

  &__text {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    word-break: break-all;
  }

  &__icon {
    flex: none;
    font-size: 14px;
  }
}

/* ============ 详情 / 内容页签内容 ============ */
.tm-panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding: 14px 4px 4px;
  overflow-y: auto;

  &__head {
    display: flex;
    flex: none;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__sub {
    font-size: 12.5px;
    color: var(--el-text-color-secondary);
  }

  &__ops {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 4px;
    border-top: 1px dashed var(--el-border-color-lighter);
  }

  &__empty {
    padding: 18px 16px;
    font-size: 13px;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-lighter);
    border-radius: 10px;
  }
}

.tm-kv {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__row {
    display: flex;
    gap: 10px;
    font-size: 13px;
    line-height: 1.6;
  }

  &__label {
    flex: none;
    width: 96px;
    color: var(--el-text-color-secondary);
  }

  &__value {
    flex: 1;
    color: var(--el-text-color-primary);
    word-break: break-all;
  }
}

.tm-code {
  margin: 0;
  padding: 12px 14px;
  overflow: auto;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 12px;
  line-height: 1.65;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-all;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

.mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
}

/* ============ 台账空态 ============ */
.tm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 26px 16px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
  text-align: center;

  b {
    font-size: 13.5px;
    color: var(--el-text-color-primary);
  }

  &__link {
    padding: 0;
    font-size: inherit;
    color: var(--el-color-primary);
    background: none;
    border: 0;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}

/* 三方模板 ID 列：等宽 + 略弱化的颜色，避免和模板名抢视线 */
.tm-code-id {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.tm-muted {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* 详情里三方模板 ID 的复制按钮 */
.tm-kv__copy {
  margin-left: 6px;
  padding: 0 2px;
  color: var(--el-text-color-secondary);
  background: none;
  border: 0;
  cursor: pointer;

  &:hover {
    color: var(--el-color-primary);
  }
}

/* ============ 详情里的来源模块信息 ============ */
.tm-source {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__hint {
    font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
    font-size: 11.5px;
    color: var(--el-text-color-placeholder);
  }

  &__gap {
    flex: 1;
  }

  &__retry {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    font-size: 12px;
    color: var(--el-color-primary);
    background: none;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: var(--el-fill-color);
    }

    &:disabled {
      color: var(--el-text-color-placeholder);
      cursor: not-allowed;
    }
  }

  &__error {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    line-height: 1.7;
    color: var(--el-color-danger);
    word-break: break-all;
  }

  &__loading {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  &__param {
    margin: 0 4px 4px 0;
  }

  .tm-kv__label {
    width: 88px;
  }
}

/* ============ 新建 / 编辑弹窗表单 ============ */
.tm-form {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__label {
    flex: none;
    width: 84px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    text-align: right;

    &.is-required::before {
      content: '*';
      margin-right: 2px;
      color: var(--el-color-danger);
    }
  }

  &__hint {
    margin: 0;
    padding: 10px 12px;
    font-size: 12px;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    border-radius: 8px;
  }
}
</style>
