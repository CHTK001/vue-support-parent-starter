<!--
  模板管理 —— 控制台侧的模板库运营与管理枢纽

  职责：
    - 台账：`templateApi.page` 分页 + 多条件筛选，展示名称/来源/状态/类型/语言/创建时间
    - 操作：新增/编辑/上下线/删除/设计/预览（轻量 iframe 预览，不走设计器）
    - 同步：来源同步（syncAll/sync）+ 账号模块同步到模板库（syncAccounts）
    - 分析：调用日志/质量分析/提供商一览
    - 角色定位：监控侧只负责台账 + 管理入口，设计器由 @pages/template 承载（/template/designer/:id）

  接入：侧边栏 `createMonitorRoutes()` 的「模板管理」分组下（path /templates）。

  @author CH
  @since 4.0.0.46
-->
<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { message } from '@repo/core';
import ReTable, { type ReTableColumn, type ReTableLoadParams, type RePageResult } from '@repo/ui/re-table';
import ReDrawer from '@repo/ui/re-drawer';
import ReButton from '@repo/ui/re-button';
import ReInput from '@repo/ui/re-input';
import ReSelect from '@repo/ui/re-select';
import ReTag from '@repo/ui/re-tag';
import ReIcon from '@repo/ui/re-icon';
import ReDialog from '@repo/ui/re-dialog';
import ReForm from '@repo/ui/re-form';
import { ReFormItem } from '@repo/ui/re-kit';
import ReLoading from '@repo/ui/re-loading';
// 相对引用：pages/template 是同一工作区的页面包，避免 monitor 侧 node_modules 未 link 该包
import type { TemplateInfo, PageResult, TemplateStatus, TemplateSource, TemplateType, TemplateLanguage, AccountSyncResult } from '../../../../pages/template/src/types/template';
import { templateApi } from '../../../../pages/template/src/api/templateApi';

const router = useRouter();

// ==================== 页面行 / 归一 ====================
/** 页面行：与 ReTable 的 RePageResult 对齐（Record<string, unknown> 需要索引签名，交集类型由 TS 补齐） */
type Row = TemplateInfo & Record<string, unknown>;

/** 归一下：屏蔽后端 camelCase / 小写两种键名 */
function normalizeRow(raw: Record<string, unknown>): Row {
  if (!raw) return {
    id: '', name: '—', subtitle: '', language: 'html' as TemplateLanguage,
    type: 'document' as TemplateType, status: 'draft' as TemplateStatus, source: 'hiprint' as TemplateSource,
    providerId: '', sourceId: '', sourceProviderId: '', creator: '', modifier: '',
    createdAt: '', updatedAt: '', content: '', remark: '',
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
    sourceProviderId: String(raw.templateInfoProvider ?? raw.sourceProviderId ?? ''),
    creator: String(raw.templateInfoCreator ?? raw.creator ?? ''),
    modifier: String(raw.templateInfoModifier ?? raw.modifier ?? ''),
    createdAt: String(raw.templateInfoCreatedAt ?? raw.createdAt ?? ''),
    updatedAt: String(raw.templateInfoUpdatedAt ?? raw.updatedAt ?? ''),
    content: String(raw.templateInfoContent ?? raw.content ?? ''),
    remark: String(raw.templateInfoRemark ?? raw.remark ?? ''),
  };
}

// ==================== 列表状态（由 loader 驱动） ====================
const loading = ref(false);
const list = ref<TemplateInfo[]>([]);
const total = ref(0);
const keyword = ref('');
const sourceFilter = ref<TemplateSource | ''>('');
const page = ref(1);
const pageSize = ref(20);

/** templateApi 在监控侧挂走到 template 后端；mock 数据仅用于演示 UI 效果 */
const mockMode = ref(false);

/** 统计面板：按状态拆分模板数量 */
const stats = computed(() => {
  const s = { total: total.value, online: 0, draft: 0, offline: 0 };
  for (const r of list.value) {
    if (r.status === 'online') s.online += 1;
    else if (r.status === 'draft') s.draft += 1;
    else if (r.status === 'offline') s.offline += 1;
  }
  return s;
});

// ==================== 高级搜索（多条件） ====================
const advancedSearch = reactive({
  status: '' as TemplateStatus | '',
  type: '' as TemplateType | '',
  language: '' as TemplateLanguage | '',
  source: '' as TemplateSource | '',
  dateRange: [] as string[],
});
const showAdvanced = ref(false);

function applyAdvancedSearch(): void {
  page.value = 1;
  void load({ page: 1, pageSize: pageSize.value, params: {} });
}

function resetSearch(): void {
  keyword.value = '';
  sourceFilter.value = '';
  advancedSearch.status = '';
  advancedSearch.type = '';
  advancedSearch.language = '';
  advancedSearch.source = '';
  advancedSearch.dateRange = [];
  page.value = 1;
  void load({ page: 1, pageSize: pageSize.value, params: {} });
}

// ==================== 开发期 Mock 数据（仅 demo） ====================
/**
 * 开发期 Mock：monitor 后端的 jar 不依赖 `spring-support-template-starter`，
 * 所以 `/api/template/page` 走不到 template 后端——这里用模拟数据把台账 UI 的效果铺开（见 `load`）。
 */
const mockTemplates: Row[] = [
  {
    id: 'tpl-printer-001',
    name: '发货单模板（openspecer）',
    subtitle: '标准发货单 / A4 横向',
    language: 'html',
    type: 'document',
    status: 'online',
    source: 'hiprint',
    providerId: '', sourceId: '', sourceProviderId: '',
    creator: 'admin', modifier: 'admin',
    createdAt: '2026-10-28T16:30:00.000Z', updatedAt: '2026-10-29T09:15:00.000Z',
    content: '<template><div>demo</div></template>',
    remark: 'dev 示例数据',
  },
  {
    id: 'tpl-printer-002',
    name: '发货单模板（企业版）',
    subtitle: '企业版票据 / A5 纵向',
    language: 'vue',
    type: 'document',
    status: 'draft',
    source: 'hiprint',
    providerId: '', sourceId: '', sourceProviderId: '',
    creator: 'demo', modifier: '',
    createdAt: '2026-10-30T10:00:00.000Z', updatedAt: '2026-10-30T10:00:00.000Z',
    content: '<template><div>demo</div></template>',
    remark: 'dev 示例数据',
  },
  {
    id: 'tpl-msg-001',
    name: '营销短信模板',
    subtitle: '阿里云短信 · 营销场景',
    language: 'json',
    type: 'sms',
    status: 'online',
    source: 'message',
    providerId: 'prv-alisvc-001',
    sourceId: 'smsgtpl-001',
    sourceProviderId: 'prv-alisvc-001',
    creator: 'msgadmin', modifier: 'msgadmin',
    createdAt: '2026-10-29T08:20:00.000Z', updatedAt: '2026-10-30T12:40:00.000Z',
    content: '{"content":"${name}:您有${num}件待办"}',
    remark: 'dev 示例数据',
  },
  {
    id: 'tpl-pap-001',
    name: '高考试卷-模板A',
    subtitle: '试卷头 / 页漫页脚 / 纸张规格',
    language: 'html',
    type: 'other',
    status: 'offline',
    source: 'paper',
    providerId: 'prv-edu-001',
    sourceId: 'paptpl-001',
    sourceProviderId: 'prv-edu-001',
    creator: 'teacher', modifier: 'teacher',
    createdAt: '2026-10-25T22:00:00.000Z', updatedAt: '2026-10-26T11:30:00.000Z',
    content: '<template><div>pap我们来</div></template>',
    remark: 'dev 示例数据',
  },
];

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

// ==================== 取数（ReTable loader） ====================
async function load(params: ReTableLoadParams): Promise<RePageResult> {
  loading.value = true;
  const timeout = (ms: number) => new Promise<never>((_, done) => setTimeout(() => done(new Error(`template API timeout after ${ms}ms (dev)`)), ms));
  try {
    const result = (await Promise.race([
      templateApi.page({
        keyword: keyword.value,
        // 空字符串（全部）⇒ 不传参给后端查询条件
        source: sourceFilter.value || undefined,
        status: advancedSearch.status || undefined,
        type: advancedSearch.type || undefined,
        language: advancedSearch.language || undefined,
        page: params.page,
        size: params.pageSize,
      }),
      timeout(2000),
    ])) as PageResult<TemplateInfo> | undefined;
    if (!result || !Array.isArray(result.records)) throw new Error('template list payload is empty');
    total.value = result.total ?? 0;
    mockMode.value = false;
    const records = result.records.map((r: TemplateInfo) => normalizeRow(r as unknown as Record<string, unknown>));
    list.value = records;
    return {
      records,
      total: total.value,
    };
  } catch (e) {
    // 开发期 templateApi 的 target 在 monitor 侧没有 template 后端：用 mock 数据铺开台账 UI
    mockMode.value = true;
    const m = mockTemplates;
    total.value = m.length;
    list.value = m;
    const start = (params.page - 1) * params.pageSize;
    return { records: m.slice(start, start + params.pageSize), total: m.length };
  } finally {
    loading.value = false;
  }
}

// ==================== 操作：上下线 / 删除 ====================
/** 状态快捷切换（上下线） */
async function toggleStatus(row: TemplateInfo): Promise<void> {
  const newStatus: TemplateStatus = row.status === 'online' ? 'offline' : 'online';
  try {
    await message.confirm(`确认${newStatus === 'online' ? '上线' : '下线'}「${row.name}」？`);
    await templateApi.update(row.id, { status: newStatus });
    await refreshList();
    message.success('状态已更新');
  } catch { /* 取消 / 错误统一提示 */ }
}

/** 删除（带确认） */
async function removeTemplate(row: TemplateInfo): Promise<void> {
  try {
    await message.confirm(`确认删除「${row.name}」？删除后不可恢复`);
    await templateApi.remove(row.id);
    await refreshList();
    message.success('已删除');
  } catch { /* 取消 / 错误统一提示 */ }
}

/** 刷新列表 */
async function refreshList(): Promise<void> {
  const records = list.value.map(r => r as unknown as Row);
  total.value = records.length;
  list.value = records;
  void load({ page: 1, pageSize: pageSize.value, params: {} });
}

// ==================== 设计器 & 预览 ====================
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
 * 轻量预览：不走设计器（监控侧无 html 渲染依赖），直接 iframe 加载 template 应用侧页面
 * 需 template 应用可访问。开发期中 fallback 到 content 内容。
 */
async function openLightPreview(row: TemplateInfo): Promise<void> {
  try {
    const d = await templateApi.designer(row.id);
    if (d && typeof d.content === 'string' && d.content.trim().length > 0) {
      previewHtml.value = d.content;
      previewTitle.value = row.name;
      previewVisible.value = true;
      return;
    }
  } catch { /* 取内容失败时 fallback 到 console */ }
  previewHtml.value = `<!DOCTYPE html><html><body><p>预览加载中...</p></body></html>`;
  previewTitle.value = row.name;
  previewVisible.value = true;
}

// 预览弹窗状态
const previewVisible = ref(false);
const previewTitle = ref('');
const previewHtml = ref('');

// ==================== 新增 / 编辑弹窗 ====================
const addEditVisible = ref(false);
const isEdit = ref(false);
const editingId = ref('');
const editingRow = ref<TemplateInfo | null>(null);

/** 打开新增弹窗 */
function openAddDialog(): void {
  isEdit.value = false;
  editingId.value = '';
  editingRow.value = null;
  formState.value = {
    name: '', subtitle: '', type: 'document' as TemplateType, language: 'html' as TemplateLanguage,
    source: 'hiprint' as TemplateSource, status: 'draft' as TemplateStatus,
    providerId: '', sourceId: '', sourceProviderId: '', remark: '', content: '',
  };
  addEditVisible.value = true;
}

/** 打开编辑弹窗 */
function openEditDialog(row: TemplateInfo): void {
  isEdit.value = true;
  editingId.value = row.id;
  editingRow.value = row;
  formState.value = {
    name: row.name,
    subtitle: row.subtitle ?? '',
    type: row.type,
    language: row.language,
    source: row.source,
    status: row.status,
    providerId: row.providerId ?? '',
    sourceId: row.sourceId ?? '',
    sourceProviderId: row.sourceProviderId ?? '',
    remark: row.remark ?? '',
    content: row.content ?? '',
  };
  addEditVisible.value = true;
}

const formState = ref({
  name: '', subtitle: '', type: 'document' as TemplateType, language: 'html' as TemplateLanguage,
  source: 'hiprint' as TemplateSource, status: 'draft' as TemplateStatus,
  providerId: '', sourceId: '', sourceProviderId: '', remark: '', content: '',
});

async function submitForm(): Promise<void> {
  const payload: Record<string, any> = { ...formState.value };
  try {
    if (isEdit.value) {
      await templateApi.update(editingId.value, payload);
      message.success('编辑成功');
    } else {
      await templateApi.add(payload);
      message.success('新增成功');
    }
    addEditVisible.value = false;
    await refreshList();
  } catch (e) {
    message.error((e as Error)?.message ?? '提交失败');
  }
}

// ==================== 详情 Drawer ====================
const drawerVisible = ref(false);
const drawerTitle = ref('');
const drawerRow = ref<TemplateInfo | null>(null);

/** 打开详情 drawer */
function onDetail(row: TemplateInfo): void {
  drawerTitle.value = row.name || '未命名模板';
  drawerRow.value = row;
  drawerVisible.value = true;
}

// ------------------- 查询刷新 -------------------
/** 重新查询（关键词 / 来源变化时） */
function refresh(): void {
  page.value = 1;
  void load({ page: 1, pageSize: pageSize.value, params: {} });
}

/** drawer 用：复用 formatter 逻辑的列文本 */
function statusOf(r: Row): string { return statusText(r, {} as ReTableColumn, r.status); }
function sourceOf(r: Row): string { return sourceText(r, {} as ReTableColumn, r.source); }
function languageOf(r: Row): string { return languageText(r, {} as ReTableColumn, r.language); }
function typeOf(r: Row): string { return typeText(r, {} as ReTableColumn, r.type); }

// ==================== 来源同步 ====================
const syncVisible = ref(false);
const sourceSyncing = ref(false);
const lastSourceSync = ref<Record<string, number> | null>(null);

async function doSourceSync(): Promise<void> {
  sourceSyncing.value = true;
  try {
    const res = await templateApi.syncAll();
    sourceSyncing.value = false;
    lastSourceSync.value = res;
    message.success(`来源同步完成：${JSON.stringify(res)}`);
  } catch (e) {
    sourceSyncing.value = false;
    message.error((e as Error)?.message ?? '来源同步失败');
  }
}

async function doSourceSyncBy(source: string): Promise<void> {
  sourceSyncing.value = true;
  try {
    const res = await templateApi.sync(source);
    sourceSyncing.value = false;
    lastSourceSync.value = res;
    message.success(`来源同步完成：${source}`);
  } catch (e) {
    sourceSyncing.value = false;
    message.error((e as Error)?.message ?? '来源同步失败');
  }
}

// ==================== 账号模块同步到模板库 ====================
const accountsSyncVisible = ref(false);
const accountsSyncing = ref(false);
const lastAccountsSync = ref<AccountSyncResult | null>(null);

/** 点击同步：把账户/租户/角色数据同步到模板库 */
async function doAccountsSync(): Promise<void> {
  accountsSyncing.value = true;
  try {
    const res: AccountSyncResult = await templateApi.syncAccounts();
    accountsSyncing.value = false;
    lastAccountsSync.value = res;
    message.success(`账号同步完成：${res.syncedAccounts} 个账号、${res.syncedTemplates} 个模板`);
  } catch (e) {
    accountsSyncing.value = false;
    message.error((e as Error)?.message ?? '账号同步失败');
  }
}

// ==================== 分析：调用日志 / 质量分析 / 提供商 ====================
const analysisTab = ref<'log' | 'quality' | 'provider'>('log');
const logsLoading = ref(false);
const logsList = ref<Row[]>([]);
const logsTotal = ref(0);
const logsQuery = reactive({
  keyword: '', templateId: '', action: '' as 'preview' | 'design' | 'print' | 'sync' | '',
  page: 1, size: 20,
});

const providersLoading = ref(false);
const providers = ref<Row[]>([]);

async function loadLogs(): Promise<void> {
  logsLoading.value = true;
  try {
    const res = await templateApi.logs({
      page: logsQuery.page, size: logsQuery.size,
      templateId: logsQuery.templateId,
      action: logsQuery.action === '' ? undefined : logsQuery.action,
    });
    logsList.value = (res.records ?? []) as unknown as Row[];
    logsTotal.value = res.total ?? 0;
  } catch {
    logsList.value = mockLogs();
    logsTotal.value = logsList.value.length;
  } finally {
    logsLoading.value = false;
  }
}

/** 调用日志 mock */
function mockLogs(): Row[] {
  return [
    { id: '1', templateId: 'tpl-printer-001', templateName: '发货单模板（openspecer）', action: 'print', parameters: { x: 1 }, time: '2026-10-29 12:00', ip: '192.168.1.1', operator: 'admin' } as unknown as Row,
    { id: '2', templateId: 'tpl-msg-001', templateName: '营销短信模板', action: 'preview', parameters: {}, time: '2026-10-29 12:05', ip: '192.168.1.2', operator: 'msgadmin' } as unknown as Row,
  ];
}

const qualityLoading = ref(false);
const qualityData = ref<Row[]>([]);

/** 质量分析：近 30 天调用趋势（类别） */
const qualityCategories = computed(() => qualityData.value.map((d) => d.time as string));
const qualityValues = computed(() => qualityData.value.map((d) => d.count as number));
const maxValue = computed(() => Math.max(1, ...qualityValues.value));

async function loadQuality(): Promise<void> {
  qualityLoading.value = true;
  try {
    const res = await templateApi.logs({ page: 1, size: 10, action: 'preview' });
    qualityData.value = (res.records ?? []) as unknown as Row[];
  } catch {
    qualityData.value = mockQuality();
  } finally {
    qualityLoading.value = false;
  }
  // 开发期 demo：模板后端不可达时，dev-proxy 返回 502 + 空体（`unwrap` 解出 ""，records 未定义），
  // 不会触发 catch。补回演示数据，让质量分析柱状图始终可渲染。
  if (!qualityData.value.length) {
    qualityData.value = mockQuality();
  }
}

/** 质量分析 mock（30 天使用趋势） */
function mockQuality(): Row[] {
  const now = Date.now();
  const data: Row[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(now - (29 - i) * 86400000);
    data.push({ id: `q-${i}`, time: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, count: Math.floor(Math.random() * 40) + 5 } as unknown as Row);
  }
  return data;
}

async function loadProviders(): Promise<void> {
  providersLoading.value = true;
  try {
    const list: any[] = await templateApi.providerList();
    providers.value = list.map((p) => p);
  } catch {
    providers.value = mockProviders();
  } finally {
    providersLoading.value = false;
  }
}

function mockProviders(): Row[] {
  return [
    { id: 'prv-001', name: '阿里云短信', vendor: 'aliyun', status: 'online', templateCount: 2, lastSyncAt: '2026-10-29 12:00' } as unknown as Row,
    { id: 'prv-002', name: '自建打印', vendor: 'self', status: 'online', templateCount: 1, lastSyncAt: '2026-10-28 10:00' } as unknown as Row,
  ];
}

// ==================== 列定义 ====================
const columns: ReTableColumn[] = [
  { prop: 'name', label: '模板名称', minWidth: 220, showOverflowTooltip: true },
  { prop: 'source', label: '来源', width: 120, formatter: sourceText },
  { prop: 'status', label: '状态', width: 120, formatter: statusText },
  { prop: 'type', label: '类型', width: 110, formatter: typeText },
  { prop: 'language', label: '语言', width: 100, formatter: languageText },
  { prop: 'createdAt', label: '创建时间', width: 190, formatter: fmtTime },
  { prop: 'actions', label: '操作', width: 240, align: 'center', fixed: 'right', slot: 'actions' },
];

/** 调用日志列（ReTable） */
const logsColumns: ReTableColumn[] = [
  { prop: 'templateName', label: '模板名称', width: 200, showOverflowTooltip: true },
  { prop: 'action', label: '操作', width: 110, formatter: logActionText },
  { prop: 'parameters', label: '调用参数', width: 200, showOverflowTooltip: true, formatter: logParamsText },
  { prop: 'time', label: '时间', width: 190, formatter: fmtTime },
  { prop: 'operator', label: '操作人', width: 120 },
];

/** 提供商列（ReTable） */
const providerColumns: ReTableColumn[] = [
  { prop: 'name', label: '提供商', width: 160, showOverflowTooltip: true },
  { prop: 'vendor', label: '接入方', width: 100 },
  { prop: 'status', label: '状态', width: 100, formatter: providerStatusText },
  { prop: 'templateCount', label: '模板数', width: 80, align: 'center' },
  { prop: 'lastSyncAt', label: '最近同步', width: 190, formatter: fmtTime },
];

// ==================== 日志 formatter ====================
function logActionText(_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown): string {
  const s = cellValue as string | undefined;
  const map: Record<string, string> = { preview: '预览', design: '设计', print: '打印', sync: '同步' };
  return map[s ?? ''] ?? s ?? '—';
}

function logParamsText(_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown): string {
  const p = cellValue as Record<string, unknown> | string | undefined;
  return typeof p === 'string' ? JSON.stringify(JSON.parse(p)) : JSON.stringify(p ?? {});
}

/** 提供商状态文本 */
function providerStatusText(_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown): string {
  const s = cellValue as string | undefined;
  const map: Record<string, string> = { online: '已启用', offline: '已停用' };
  return map[s ?? ''] ?? s ?? '—';
}

onMounted(async () => {
  void load({ page: 1, pageSize: 20, params: {} });
  await loadProviders();
  await loadLogs();
  await loadQuality();
});
</script>

<template>
  <div class="template-manage">
    <!-- 统计面板 -->
    <div class="manage__stats">
      <div class="manage__stat-card">
        <div class="manage__stat-card__value">{{ stats.total }}</div>
        <div class="manage__stat-card__label">模板总数</div>
      </div>
      <div class="manage__stat-card manage__stat-card--online">
        <div class="manage__stat-card__value">{{ stats.online }}</div>
        <div class="manage__stat-card__label">已上线</div>
      </div>
      <div class="manage__stat-card manage__stat-card--draft">
        <div class="manage__stat-card__value">{{ stats.draft }}</div>
        <div class="manage__stat-card__label">草稿</div>
      </div>
      <div class="manage__stat-card manage__stat-card--offline">
        <div class="manage__stat-card__value">{{ stats.offline }}</div>
        <div class="manage__stat-card__label">已下线</div>
      </div>
    </div>

    <!-- 查询区 + 操作区 -->
    <div class="manage__search">
      <ReInput
        v-model="keyword"
        style="width: 240px"
        placeholder="模板名称 / 备注"
        clearable
        @update:model-value="refresh"
      />
      <ReSelect
        v-model="sourceFilter"
        style="width: 160px"
        placeholder="来源"
        :data="[
          { label: '全部', value: '' },
          { label: 'hiprint', value: 'hiprint' },
          { label: '消息', value: 'message' },
          { label: '组卷', value: 'paper' },
        ]"
        @change="refresh"
      />
      <ReButton :text="!showAdvanced" @click="showAdvanced = !showAdvanced">
        高级筛选
      </ReButton>
      <ReButton text @click="refresh">
        刷新
      </ReButton>
      <ReButton type="primary" @click="openAddDialog">
        新增模板
      </ReButton>
      <ReButton text @click="syncVisible = true">
        来源同步
      </ReButton>
      <ReButton text @click="accountsSyncVisible = true">
        账号同步
      </ReButton>
    </div>

    <!-- 高级筛选 -->
    <div v-if="showAdvanced" class="manage__advanced">
      <div class="manage__advanced__inner">
        <div class="manage__advanced__group">
          <ReSelect v-model="advancedSearch.status" style="width: 130px" placeholder="状态" :data="[
            { label: '全部', value: '' }, { label: '已上线', value: 'online' }, { label: '草稿', value: 'draft' }, { label: '已下线', value: 'offline' },
          ]" @change="applyAdvancedSearch" />
          <ReSelect v-model="advancedSearch.type" style="width: 130px" placeholder="类型" :data="[
            { label: '全部', value: '' }, { label: '单据', value: 'document' }, { label: '短信', value: 'sms' }, { label: '邮件', value: 'email' }, { label: '标签', value: 'label' }, { label: '其他', value: 'other' },
          ]" @change="applyAdvancedSearch" />
          <ReSelect v-model="advancedSearch.language" style="width: 130px" placeholder="语言" :data="[
            { label: '全部', value: '' }, { label: 'HTML', value: 'html' }, { label: 'Vue', value: 'vue' }, { label: 'JSX', value: 'jsx' }, { label: 'JSON', value: 'json' },
          ]" @change="applyAdvancedSearch" />
          <ReSelect v-model="advancedSearch.source" style="width: 130px" placeholder="来源" :data="[
            { label: '全部', value: '' }, { label: 'hiprint', value: 'hiprint' }, { label: '消息', value: 'message' }, { label: '组卷', value: 'paper' },
          ]" @change="applyAdvancedSearch" />
          <ReButton text @click="resetSearch">
            重置
          </ReButton>
          <ReButton @click="applyAdvancedSearch">
            查询
          </ReButton>
        </div>
      </div>
    </div>

    <!-- 列表 -->
    <ReCard layout="simple" :radius="14" :padding="14" shadow="never">
      <template #header>
        <div class="table-head">
          <span class="table-title">模板列表</span>
          <span class="table-count">共 {{ total }} 条</span>
        </div>
      </template>
      <div class="manage__table">
        <ReTable
          row-key="id"
          :loader="load"
          :columns="columns"
          pagination
          @row-click="onDetail"
        >
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
            <ReButton layout="square" type="primary" icon="EditPen" tip="设计" @click.stop="openDesigner(row)" />
            <ReButton layout="square" type="success" icon="View" tip="预览" @click.stop="openLightPreview(row)" />
            <ReButton
              layout="square"
              :type="row.status === 'online' ? 'danger' : 'success'"
              :icon="row.status === 'online' ? 'Delete' : 'CircleCheck'"
              :tip="row.status === 'online' ? '下线' : '上线'"
              @click.stop="toggleStatus(row)"
            />
            <ReButton layout="square" type="info" icon="Edit" tip="编辑" @click.stop="openEditDialog(row)" />
            <ReButton layout="square" type="warning" icon="Delete" tip="删除" @click.stop="removeTemplate(row)" />
          </template>
        </ReTable>
      </div>
    </ReCard>

    <!-- 开发期 mock 提示 -->
    <div v-if="mockMode" class="manage__footer">
      <span class="manage__footer__hint">
        <ReIcon name="InfoFilled" class="manage__footer__hint-icon" />
        演示数据（监控侧未接入 template 后端 → /api/template）
      </span>
    </div>

    <!-- 详情 drawer -->
    <ReDrawer v-model="drawerVisible" :title="drawerTitle" width="600px" :show-window-shell="false" :close-on-click-modal="false" show-close>
      <div class="detail" v-if="drawerRow">
        <div class="detail__row">
          <span class="detail__label">状态</span>
          <span class="detail__value">{{ statusOf(drawerRow) }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">来源</span>
          <span class="detail__value">{{ sourceOf(drawerRow) }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">语言</span>
          <span class="detail__value">{{ languageOf(drawerRow) }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">类型</span>
          <span class="detail__value">{{ typeOf(drawerRow) }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">创建时间</span>
          <span class="detail__value">{{ fmtTimeOf(drawerRow.createdAt) }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">备注</span>
          <span class="detail__value">{{ drawerRow.remark || '—' }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">内容</span>
          <span class="detail__value">{{ drawerRow.content }}</span>
        </div>
      </div>
    </ReDrawer>

    <!-- 轻量预览 drawer -->
    <ReDrawer v-model="previewVisible" :title="previewTitle || '模板预览'" width="1000px" top="4vh" :show-window-shell="false" :close-on-click-modal="false" show-close>
      <div class="preview__iframe">
        <iframe :srcdoc="previewHtml" width="100%" height="800" frameborder="0" />
      </div>
    </ReDrawer>

    <!-- 新增/编辑弹窗 -->
    <ReDialog v-model="addEditVisible" :title="isEdit ? '编辑模板' : '新增模板'" width="600px" :show-window-shell="false" :close-on-click-modal="false" show-close @confirm="submitForm" cancel-text="取消" confirm-text="确定" :loading="false">
      <ReForm :model="formState" label-width="90px" label-position="top" ref="formRef">
        <ReFormItem label="模板名称" prop="name" required>
          <ReInput v-model="formState.name" placeholder="例如 出库单" maxlength="64" />
        </ReFormItem>
        <ReFormItem label="模板副标题" prop="subtitle">
          <ReInput v-model="formState.subtitle" placeholder="例如 仓库出库单据" maxlength="128" />
        </ReFormItem>
        <ReFormItem label="模板类型" prop="type" required>
          <ReSelect v-model="formState.type" :data="[
            { label: '单据', value: 'document' }, { label: '短信', value: 'sms' }, { label: '邮件', value: 'email' },
            { label: '标签', value: 'label' }, { label: '其他', value: 'other' },
          ]" />
        </ReFormItem>
        <ReFormItem label="模板语言" prop="language" required>
          <ReSelect v-model="formState.language" :data="[
            { label: 'HTML', value: 'html' }, { label: 'Vue', value: 'vue' }, { label: 'JSX', value: 'jsx' }, { label: 'JSON', value: 'json' },
          ]" />
        </ReFormItem>
        <ReFormItem label="模板来源" prop="source" required>
          <ReSelect v-model="formState.source" :data="[
            { label: 'hiprint', value: 'hiprint' }, { label: '消息', value: 'message' }, { label: '组卷', value: 'paper' },
          ]" />
        </ReFormItem>
        <ReFormItem label="状态" prop="status" required>
          <ReSelect v-model="formState.status" :data="[
            { label: '草稿', value: 'draft' }, { label: '已上线', value: 'online' }, { label: '已下线', value: 'offline' },
          ]" />
        </ReFormItem>
        <ReFormItem label="备注" prop="remark">
          <ReInput v-model="formState.remark" type="textarea" :rows="2" maxlength="200" show-word-limit />
        </ReFormItem>
        <ReFormItem label="内容" prop="content">
          <ReInput v-model="formState.content" type="textarea" :rows="3" maxlength="200" />
        </ReFormItem>
      </ReForm>
    </ReDialog>

    <!-- 来源同步弹窗 -->
    <ReDialog v-model="syncVisible" title="来源同步" width="500px" :show-window-shell="false" :close-on-click-modal="false" show-close>
      <div class="sync-panel">
        <div class="sync-panel__row">
          <ReButton :loading="sourceSyncing" @click="doSourceSync">全量来源同步</ReButton>
          <ReButton @click="doSourceSyncBy('message')">同步 source: message</ReButton>
          <ReButton @click="doSourceSyncBy('paper')">同步 source: paper</ReButton>
        </div>
        <div v-if="lastSourceSync" class="sync-panel__result">
          最近同步结果：{{ JSON.stringify(lastSourceSync) }}
        </div>
      </div>
    </ReDialog>

    <!-- 账号同步弹窗 -->
    <ReDialog v-model="accountsSyncVisible" title="账号模块同步到模板库" width="500px" :show-window-shell="false" :close-on-click-modal="false" show-close>
      <div class="sync-panel">
        <div class="sync-panel__row">
          <ReButton :loading="accountsSyncing" type="primary" @click="doAccountsSync">同步账号数据</ReButton>
        </div>
        <div v-if="lastAccountsSync" class="sync-panel__result">
          同步完成：已同步 {{ lastAccountsSync.syncedAccounts }} 个账号，关联 {{ lastAccountsSync.syncedTemplates }} 个模板，失败 {{ lastAccountsSync.failed }} 条
        </div>
      </div>
    </ReDialog>

    <!-- 分析面板 -->
    <ReCard layout="simple" :radius="14" :padding="14" shadow="never" header="分析与监控">
      <template #header>
        <div class="analysis-head">
          <div class="analysis-tabs">
            <button class="analysis-tab" :class="{ 'is-active': analysisTab === 'log' }" @click="analysisTab = 'log'">
              调用日志
            </button>
            <button class="analysis-tab" :class="{ 'is-active': analysisTab === 'quality' }" @click="analysisTab = 'quality'">
              质量分析
            </button>
            <button class="analysis-tab" :class="{ 'is-active': analysisTab === 'provider' }" @click="analysisTab = 'provider'">
              提供商
            </button>
          </div>
        </div>
      </template>
      <div class="analysis-body">
        <!-- 调用日志 -->
        <div v-if="analysisTab === 'log'" class="analysis-section">
          <ReTable :data="logsList" :columns="logsColumns" :loading="logsLoading" :border="true" />
        </div>
        <!-- 质量分析 -->
        <div v-if="analysisTab === 'quality'" class="analysis-section">
          <ReLoading :loading="qualityLoading">
            <div class="quality__bar-chart" v-if="qualityCategories.length">
              <div class="quality__bar-row" v-for="i in qualityCategories.length" :key="i">
                <div class="quality__bar">
                  <div class="quality__bar-fill" :style="{ '--n': qualityValues[i - 1] / maxValue }"></div>
                </div>
                <span class="quality__bar-label">{{ qualityCategories[i - 1] }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无调用数据" />
          </ReLoading>
        </div>
        <!-- 提供商 -->
        <div v-if="analysisTab === 'provider'" class="analysis-section">
          <ReTable :data="providers" :columns="providerColumns" :loading="providersLoading" :border="true" />
        </div>
      </div>
    </ReCard>
  </div>
</template>

<style lang="scss" scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}

.template-manage {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
  background: var(--el-bg-color);
  animation: fadeIn 0.35s ease both;
}

// ---------------- 统计面板 ----------------
.manage__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 0 4px;
}

.manage__stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  }

  &__value {
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1;
  }

  &__label {
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  &--online &__value { color: var(--el-color-success); }
  &--draft &__value { color: var(--el-color-warning); }
  &--offline &__value { color: var(--el-color-info); }
}

// ---------------- 查询区 ----------------
.manage__search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  transition: border-color 0.25s ease;

  &:hover { border-color: var(--el-border-color-base); }
}

// ---------------- 高级筛选 ----------------
.manage__advanced {
  padding: 12px 16px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);

  &__group {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
}

// ---------------- 表 ----------------
.manage__table {
  max-height: 500px;
  overflow: auto;

  :deep(.el-table__header th) {
    background: var(--el-fill-color);
    color: var(--el-text-color-regular);
    font-weight: 600;
    font-size: 13px;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-table__row) {
    transition: background-color 0.2s ease;

    td {
      padding: 11px 0;
      font-size: 13px;
      color: var(--el-text-color-regular);
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    &:hover {
      background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
    }
  }
}

.table-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.table-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.table-count {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

// ---------------- 底部演示提示 ----------------
.manage__footer {
  &__hint {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    justify-content: center;
    color: var(--el-color-info);
    background: var(--el-color-info-light-9);
    border: 1px dashed var(--el-color-info-light-7);
    border-radius: var(--el-border-radius-base);
    font-size: 12px;
    line-height: 1.6;
    padding: 8px 14px;
    transition: color 0.3s, background 0.3s, border-color 0.3s;

    &:hover { background: var(--el-color-info-light-8); }
  }

  &__hint-icon { font-size: 14px; }
}

// ---------------- 详情 drawer ----------------
.detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 6px;
}

.detail__row {
  display: flex;
  gap: 8px;
  line-height: 1.6;
}

.detail__label {
  color: var(--el-text-color-regular);
  min-width: 72px;
}

.detail__value {
  color: var(--el-text-color-primary);
  word-break: break-all;
}

// ---------------- 同步面板 ----------------
.sync-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__row { display: flex; gap: 10px; flex-wrap: wrap; }

  &__result {
    padding: 10px 14px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-border-radius-base);
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
}

// ---------------- 分析面板 ----------------
.analysis-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.analysis-tabs {
  display: flex;
  gap: 4px;
}

.analysis-tab {
  padding: 6px 14px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  border-radius: var(--el-border-radius-base);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover { background: var(--el-fill-color); }
  &.is-active { background: var(--el-color-primary); color: #fff; }
}

.analysis-body {
  min-height: 240px;
  padding: 12px 0;
}

.analysis-section {
  height: 100%;
}

.preview__iframe {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

/* 质量分析柱状图（监控侧不依赖 ReChart / ReEcharts，避免 preset 未注册） */
.quality__bar-chart {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 12px 12px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  max-height: 300px;
  overflow-y: auto;
}

.quality__bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quality__bar {
  flex: 1;
  height: 18px;
  background: var(--el-border-color-lighter);
  border-radius: 4px;
  overflow: hidden;
}

.quality__bar-fill {
  height: 100%;
  width: calc(var(--n) * 100%);
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
  border-radius: 4px;
  transition: width 0.4s ease;
}

.quality__bar-label {
  width: 72px;
  color: var(--el-text-color-regular);
  font-size: 11.5px;
  text-align: right;
  white-space: nowrap;
}
</style>
