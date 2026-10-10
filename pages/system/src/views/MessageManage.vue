<script setup lang="ts">
/**
 * 消息管理页面（管理端）
 *
 * 顶部 ReTab 胶囊导航：消息记录 / 消息模板 / 发送日志。
 * - 消息记录：渠道过滤 + 分页 + 发送 + 撤回 + 删除 + 详情（送达/已读回执）。
 * - 消息模板：CRUD + 渠道(EMAIL/SMS) + TEXT/HTML/RICHTEXT + 预览(左右布局动态表单) + 按角色编码发送 + 同步运营商。
 * - 发送日志：推送记录 + 详情 + 按日期清理。
 */
import { message } from "@repo/core";
import { computed, onMounted, ref, watch, nextTick, defineAsyncComponent } from "vue";
import { ElMessageBox } from "element-plus";
import ReTab from "@repo/ui/re-tab";
/** 耗时着色文本：绿 / 黄 / 红标识推送快慢（同系统日志页） */
const ReCostText = defineAsyncComponent(() =>
  import("@repo/ui/re-cost-text").then((m) => m.default),
);
/** 时间展示：格式化 + 相对时间（同系统日志页） */
const ReTime = defineAsyncComponent(() =>
  import("@repo/ui/re-time").then((m) => m.default),
);
import {
  pageForMessageAdmin,
  sendMessage,
  recallMessage,
  deleteMessage,
  pageForMessageTemplate,
  listForMessageTemplate,
  saveMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
  previewMessageTemplate,
  sendMessageByCode,
  pageForMessageLog,
  cleanMessageLog,
  listForRole,
} from "../api/systemApi";
import type {
  SysMessageAdmin,
  SysMessageTemplate,
  SysMessageSendRequest,
  SysMessageLog,
  SysRole,
  TemplatePreviewResponse,
} from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult, ReTableRowSortPayload } from "@repo/ui/re-table";
import type { ReTabItem } from "@repo/ui/re-tab";

/* ================== 字典 ================== */
const typeOptions = [
  { value: "system", label: "系统" },
  { value: "notice", label: "公告" },
  { value: "message", label: "消息" },
  { value: "warning", label: "警告" },
  { value: "info", label: "通知" },
];

const levelOptions = [
  { value: "low", label: "低" },
  { value: "normal", label: "普通" },
  { value: "high", label: "高" },
  { value: "urgent", label: "紧急" },
];

const msgStatusOptions = [
  { value: 0, label: "草稿" },
  { value: 1, label: "已发送" },
  { value: 2, label: "已撤回" },
];

const channelOptions = [
  { value: "EMAIL", label: "邮件" },
  { value: "SMS", label: "短信" },
];

const msgChannelFilterOptions = [
  { value: "", label: "全部" },
  { value: "PLATFORM", label: "平台消息" },
  { value: "EMAIL", label: "邮件消息" },
  { value: "SMS", label: "短信消息" },
];

const templateTypeOptions = [
  { value: "TEXT", label: "纯文本" },
  { value: "HTML", label: "HTML" },
  { value: "RICHTEXT", label: "富文本" },
];

const logStatusOptions = [
  { value: "SUCCESS", label: "成功" },
  { value: "FAILURE", label: "失败" },
];

/** 内置变量（后端自动注入，无需前端传入） */
const builtInVars = [
  { key: "date", label: "日期" },
  { key: "time", label: "时间" },
];

/* ================== 工具函数 ================== */
function typeLabel(v?: string) {
  return typeOptions.find((o) => o.value === v)?.label ?? v ?? "-";
}
function levelTagType(v?: string): "info" | "warning" | "danger" {
  if (v === "urgent" || v === "high") return "danger";
  if (v === "low") return "info";
  return "warning";
}
function levelLabel(v?: string) {
  return levelOptions.find((o) => o.value === v)?.label ?? v ?? "-";
}
function msgStatusLabel(v?: number) {
  return msgStatusOptions.find((o) => o.value === v)?.label ?? "-";
}
function msgStatusTagType(v?: number): "info" | "success" | "warning" | "danger" {
  if (v === 2) return "info";
  if (v === 1) return "success";
  return "warning";
}
function channelLabel(v?: string): string {
  return channelOptions.find((o) => o.value === v)?.label ?? v ?? "-";
}
function msgChannelLabel(v?: string): string {
  if (!v) return "平台";
  const map: Record<string, string> = { PLATFORM: "平台", EMAIL: "邮件", SMS: "短信" };
  return map[v] ?? v;
}
function msgChannelTagType(v?: string): "primary" | "success" | "warning" {
  if (v === "EMAIL") return "success";
  if (v === "SMS") return "warning";
  return "primary";
}
function templateTypeLabel(t?: string): string {
  return templateTypeOptions.find((o) => o.value === t)?.label ?? t ?? "--";
}
function logStatusTagType(code?: string): "success" | "danger" | "info" {
  if (code === "SUCCESS") return "success";
  if (code === "FAILURE") return "danger";
  return "info";
}
function logStatusLabel(code?: string): string {
  return logStatusOptions.find((o) => o.value === code)?.label ?? code ?? "--";
}

/** 解析变量说明 schema（逗号分隔） */
function parseParamSchema(schema?: string): string[] {
  if (!schema) return [];
  return schema
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 内置变量集合 */
const builtInVarSet = new Set(builtInVars.map((v) => v.key));

/** 根据变量名推断输入控件类型 */
function inferFieldType(varName: string): "text" | "number" | "date" {
  const n = varName.toLowerCase();
  if (/(count|num|amount|age|price|total|quantity)/.test(n)) return "number";
  if (/(date|time|expire|deadline)/.test(n)) return "date";
  return "text";
}

interface DynamicField {
  key: string;
  label: string;
  type: "text" | "number" | "date";
  isBuiltIn: boolean;
}

function buildDynamicFields(schema?: string): DynamicField[] {
  const vars = parseParamSchema(schema);
  return vars.map((v) => ({
    key: v,
    label: v,
    type: inferFieldType(v),
    isBuiltIn: builtInVarSet.has(v),
  }));
}

/* ================== ReTab 主导航 ================== */
const activeTab = ref("message");
/** 图标页签是否收起（收起后仅显示当前激活项） */
const tabsCollapsed = ref(false);
const mainTabs: ReTabItem[] = [
    { name: "message", label: "消息记录", icon: "ChatDotRound" },
    { name: "template", label: "消息模板", icon: "Document" },
    { name: "log", label: "发送日志", icon: "Tickets" },
  ];

/* ================== 角色列表 ================== */
const roleOptions = ref<SysRole[]>([]);
async function loadRoles() {
  try {
    const res = await listForRole();
    roleOptions.value = (res?.data ?? []).filter((r) => r.sysRoleStatus === 1);
  } catch (e) {
    console.warn("[message] 角色列表加载失败", e);
  }
}

/* ================== Tab1: 消息记录 ================== */
const msgQuery = ref<{
  page: number;
  pageSize: number;
  sysMessageTitle?: string;
  sysMessageType?: string;
  sysMessageStatus?: number;
  sysMessageReceiverId?: number;
  sysMessageChannel?: string;
}>({
  page: 1,
  pageSize: 10,
});

const msgTableRef = ref();
const msgActionLoading = ref<number>(0);

/**
 * 消息记录的表格引擎。
 *
 * <p>用 vxe-table；本页给 ReTable 开了 {@code debug}，工具栏会多出「引擎切换器」
 * （Element / VXE 分段控件），切换通过 {@code v-model:engine} 写回这里，
 * 便于在同一份数据上对照两个引擎的渲染差异。</p>
 *
 * <p>{@code debug} 只在验收 / 排查期开，定稿后应移除。</p>
 */
const msgEngine = ref<"element" | "vxe">("vxe");

/**
 * 行拖拽排序的落点（仅用于验收拖拽交互）。
 *
 * <p>消息记录后端没有排序字段可写回，这里只把新顺序记到本地并提示，
 * <b>不做持久化</b> —— 刷新后仍按接口返回的顺序。真要落地需要后端补一个
 * 排序字段 + 保存接口。</p>
 */
function onMsgRowSort(payload: ReTableRowSortPayload): void {
  message.success(`拖拽排序已确认，本次共 ${payload.newData.length} 行（未持久化，仅供验收）`);
}

async function loadMessages({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForMessageAdmin({
    page,
    pageSize,
    sysMessageTitle: (params.sysMessageTitle as string) || undefined,
    sysMessageType: (params.sysMessageType as string) || undefined,
    sysMessageStatus:
      params.sysMessageStatus === "" || params.sysMessageStatus === undefined
        ? undefined
        : (params.sysMessageStatus as number),
    sysMessageReceiverId:
      params.sysMessageReceiverId === "" || params.sysMessageReceiverId === undefined
        ? undefined
        : (params.sysMessageReceiverId as number),
    sysMessageChannel: (params.sysMessageChannel as string) || undefined,
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

function handleMsgReset() {
  msgQuery.value = { page: 1, pageSize: 10 };
  msgTableRef.value?.reload();
}

const msgSearchFilters = computed(() => [
  { key: 'sysMessageTitle', label: '消息标题', type: 'input' as const, placeholder: '请输入' },
  { key: 'sysMessageType', label: '消息类型', type: 'select' as const, placeholder: '请选择', options: typeOptions },
  { key: 'sysMessageStatus', label: '状态', type: 'select' as const, placeholder: '请选择', options: msgStatusOptions },
  { key: 'sysMessageReceiverId', label: '接收者ID', type: 'input' as const, placeholder: '请输入' },
  { key: 'sysMessageChannel', label: '消息渠道', type: 'select' as const, placeholder: '全部', options: msgChannelFilterOptions },
]);

async function handleRecall(row: Record<string, unknown>) {
  const msg = row as unknown as SysMessageAdmin;
  if (msgActionLoading.value) return;
  try {
    await ElMessageBox.confirm(`确认撤回消息「${msg.sysMessageTitle}」？`, "撤回确认", {
      type: "warning",
      confirmButtonText: "确定撤回",
    });
  } catch {
    return;
  }
  msgActionLoading.value = msg.sysMessageId!;
  try {
    await recallMessage(msg.sysMessageId!);
    message.success("已撤回");
    msgTableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? "撤回失败");
  } finally {
    msgActionLoading.value = 0;
  }
}

async function handleDeleteMsg(row: Record<string, unknown>) {
  const msg = row as unknown as SysMessageAdmin;
  if (msgActionLoading.value) return;
  try {
    await ElMessageBox.confirm(`确认删除消息「${msg.sysMessageTitle}」？`, "提示", {
      type: "warning",
      confirmButtonText: "确定删除",
    });
  } catch {
    return;
  }
  msgActionLoading.value = msg.sysMessageId!;
  try {
    await deleteMessage(msg.sysMessageId!);
    message.success("删除成功");
    msgTableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? "删除失败");
  } finally {
    msgActionLoading.value = 0;
  }
}

/* --- 消息详情弹窗 --- */
const msgDetailVisible = ref(false);
const msgDetailRow = ref<SysMessageAdmin | null>(null);
const msgDetailLoading = ref(false);

function handleMsgDetail(row: Record<string, unknown>) {
  msgDetailRow.value = row as unknown as SysMessageAdmin;
  msgDetailVisible.value = true;
  msgDetailLoading.value = false;
}

/* ================== 发送消息弹窗（站内消息） ================== */
const sendVisible = ref(false);
const sendSaving = ref(false);
const templates = ref<SysMessageTemplate[]>([]);
const sendForm = ref<SysMessageSendRequest>({ sysMessageTitle: "" });

async function loadTemplates() {
  try {
    const res = await listForMessageTemplate();
    templates.value = (res?.data ?? []) as SysMessageTemplate[];
  } catch (e) {
    console.warn("[message] 模板列表加载失败", e);
  }
}

function handleAdd() {
  sendForm.value = { sysMessageTitle: "", sysMessageType: "notice", sysMessageLevel: "normal" };
  sendVisible.value = true;
}

function onTemplateChange(code?: string) {
  if (!code) return;
  const tpl = templates.value.find((t) => t.sysMessageTemplateCode === code);
  if (!tpl) return;
  sendForm.value = {
    ...sendForm.value,
    sysMessageTitle: tpl.sysMessageTemplateTitle || sendForm.value.sysMessageTitle,
    sysMessageContent: tpl.sysMessageTemplateContent || sendForm.value.sysMessageContent,
    templateCode: code,
  };
}

async function handleSend() {
  if (!sendForm.value.sysMessageTitle) {
    message.warning("请输入消息标题");
    return;
  }
  sendSaving.value = true;
  try {
    await sendMessage(sendForm.value);
    message.success("发送成功");
    sendVisible.value = false;
    msgTableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? "发送失败");
  } finally {
    sendSaving.value = false;
  }
}

/* ================== Tab2: 消息模板 ================== */
const tplQuery = ref<{
  page: number;
  pageSize: number;
  sysMessageTemplateName?: string;
  sysMessageTemplateCode?: string;
  sysMessageTemplateType?: string;
  sysMessageTemplateStatus?: number;
}>({
  page: 1,
  pageSize: 10,
});

const tplTableRef = ref();
const tplActionLoading = ref<number>(0);

async function loadTemplatesPage({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  // 状态未选择时传空串（后端实体默认值为 1，不传会把禁用模板过滤掉）
  const tplStatus = params.sysMessageTemplateStatus;
  const res = await pageForMessageTemplate({
    page,
    pageSize,
    sysMessageTemplateName: (params.sysMessageTemplateName as string) || undefined,
    sysMessageTemplateCode: (params.sysMessageTemplateCode as string) || undefined,
    sysMessageTemplateType: (params.sysMessageTemplateType as string) || undefined,
    sysMessageTemplateStatus:
      tplStatus === undefined || tplStatus === null || tplStatus === "" ? "" : Number(tplStatus),
  });
  const rows: Record<string, unknown>[] = (res?.data?.data ?? []).map((row) => ({ ...row }));
  return { total: res?.data?.total ?? 0, data: rows };
}

function handleTplReset() {
  tplQuery.value = { page: 1, pageSize: 10 };
  tplTableRef.value?.reload();
}

const tplSearchFilters = computed(() => [
  { key: 'sysMessageTemplateName', label: '模板名称', type: 'input' as const, placeholder: '请输入' },
  { key: 'sysMessageTemplateCode', label: '模板编码', type: 'input' as const, placeholder: '请输入' },
  {
    key: 'sysMessageTemplateType',
    label: '模板类型',
    type: 'select' as const,
    placeholder: '全部',
    options: templateTypeOptions,
  },
  {
    key: 'sysMessageTemplateStatus',
    label: '状态',
    type: 'select' as const,
    placeholder: '全部',
    options: [
      { label: '启用', value: 1 },
      { label: '禁用', value: 0 },
    ],
  },
]);

/* --- 模板新增/编辑弹窗 --- */
const tplDialogVisible = ref(false);
const tplSaving = ref(false);
const tplIsEdit = ref(false);
const tplForm = ref<SysMessageTemplate>({} as SysMessageTemplate);
const richEditorRef = ref<HTMLDivElement | null>(null);

function handleTplAdd() {
  tplIsEdit.value = false;
  tplForm.value = {
    sysMessageTemplateCode: "",
    sysMessageTemplateName: "",
    sysMessageChannel: "EMAIL",
    sysMessageTemplateType: "TEXT",
    sysMessageTemplateStatus: 1,
    sysMessageTemplateSort: 0,
  };
  tplDialogVisible.value = true;
}

function handleTplEdit(row: Record<string, unknown>) {
  tplIsEdit.value = true;
  tplForm.value = { ...(row as unknown as SysMessageTemplate) };
  tplDialogVisible.value = true;
  initRichEditor();
}

function initRichEditor() {
  nextTick(() => {
    if (richEditorRef.value && tplForm.value.sysMessageTemplateContent !== undefined) {
      richEditorRef.value.innerHTML = tplForm.value.sysMessageTemplateContent || "";
    }
  });
}

function syncRichEditorContent() {
  if (richEditorRef.value && tplForm.value.sysMessageTemplateType === "RICHTEXT") {
    tplForm.value.sysMessageTemplateContent = richEditorRef.value.innerHTML;
  }
}

function execRichCommand(cmd: string, value?: string) {
  richEditorRef.value?.focus();
  document.execCommand(cmd, false, value);
  syncRichEditorContent();
}

async function handleTplSubmit() {
  if (!tplForm.value.sysMessageTemplateCode?.trim()) {
    message.warning("请输入模板编码");
    return;
  }
  if (!tplForm.value.sysMessageChannel) {
    message.warning("请选择消息渠道");
    return;
  }
  syncRichEditorContent();
  tplSaving.value = true;
  try {
    if (tplIsEdit.value) {
      await updateMessageTemplate(tplForm.value);
      message.success("修改成功");
    } else {
      await saveMessageTemplate(tplForm.value);
      message.success("新增成功");
    }
    tplDialogVisible.value = false;
    tplTableRef.value?.reload();
    loadTemplates();
  } catch (e) {
    message.error((e as Error)?.message ?? "保存失败");
  } finally {
    tplSaving.value = false;
  }
}

async function handleTplStatus(row: SysMessageTemplate) {
  if (!row.sysMessageTemplateId) return;
  const newStatus = row.sysMessageTemplateStatus === 1 ? 0 : 1;
  try {
    await updateMessageTemplate({ ...row, sysMessageTemplateStatus: newStatus });
    message.success(newStatus === 1 ? "已启用" : "已禁用");
    tplTableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? "状态切换失败");
  }
}

async function handleTplDelete(row: Record<string, unknown>) {
  const tpl = row as unknown as SysMessageTemplate;
  if (tplActionLoading.value) return;
  try {
    await ElMessageBox.confirm(`确认删除模板「${tpl.sysMessageTemplateName}」？`, "提示", {
      type: "warning",
      confirmButtonText: "确定删除",
    });
  } catch {
    return;
  }
  tplActionLoading.value = tpl.sysMessageTemplateId!;
  try {
    await deleteMessageTemplate(tpl.sysMessageTemplateId!);
    message.success("删除成功");
    tplTableRef.value?.reload();
    loadTemplates();
  } catch (e) {
    message.error((e as Error)?.message ?? "删除失败");
  } finally {
    tplActionLoading.value = 0;
  }
}

/* --- 模板预览弹窗（左右布局 + 动态表单） --- */
const previewVisible = ref(false);
const previewLoading = ref(false);
const previewResult = ref<TemplatePreviewResponse | null>(null);
const previewRow = ref<SysMessageTemplate | null>(null);
const previewFields = ref<DynamicField[]>([]);
const previewParams = ref<Record<string, string>>({});
let previewTimer: ReturnType<typeof setTimeout> | null = null;

async function handleTplPreview(row: Record<string, unknown>) {
  const tpl = row as unknown as SysMessageTemplate;
  previewRow.value = tpl;
  previewResult.value = null;
  previewFields.value = buildDynamicFields(tpl.sysMessageParamSchema);
  const params: Record<string, string> = {};
  previewFields.value.forEach((f) => {
    if (!f.isBuiltIn) params[f.key] = "";
  });
  previewParams.value = params;
  previewVisible.value = true;
  await doPreview();
}

async function doPreview() {
  if (!previewRow.value?.sysMessageTemplateId) return;
  previewLoading.value = true;
  try {
    const res = await previewMessageTemplate({
      sysMessageTemplateId: previewRow.value.sysMessageTemplateId,
      params: { ...previewParams.value },
    });
    previewResult.value = res?.data ?? null;
  } catch (e) {
    message.error((e as Error)?.message ?? "预览失败");
  } finally {
    previewLoading.value = false;
  }
}

watch(previewParams, () => {
  if (!previewVisible.value || !previewRow.value) return;
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(() => doPreview(), 500);
}, { deep: true });

/* --- 按模板发送弹窗（角色选择 + 手工地址） --- */
const tplSendVisible = ref(false);
const tplSendLoading = ref(false);
const tplSendForm = ref<{
  roleKeys: string[];
  targetText: string;
  subject: string;
  params: Record<string, string>;
}>({
  roleKeys: [],
  targetText: "",
  subject: "",
  params: {},
});
const tplSendRow = ref<SysMessageTemplate | null>(null);
const sendFields = ref<DynamicField[]>([]);

async function handleTplSend(row: Record<string, unknown>) {
  const tpl = row as unknown as SysMessageTemplate;
  tplSendRow.value = tpl;
  sendFields.value = buildDynamicFields(tpl.sysMessageParamSchema);
  tplSendForm.value = {
    roleKeys: [],
    targetText: "",
    subject: tpl.sysMessageTemplateTitle ?? "",
    params: {},
  };
  const params: Record<string, string> = {};
  sendFields.value.forEach((f) => {
    if (!f.isBuiltIn) params[f.key] = "";
  });
  tplSendForm.value.params = params;
  tplSendVisible.value = true;
}

async function doTplSend() {
  if (!tplSendRow.value?.sysMessageTemplateCode) {
    message.warning("模板缺少编码，无法发送");
    return;
  }
  const hasRoles = tplSendForm.value.roleKeys.length > 0;
  const targets = tplSendForm.value.targetText
    .split(/[,，\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!hasRoles && !targets.length) {
    message.warning("请选择接收角色或输入接收人地址");
    return;
  }
  tplSendLoading.value = true;
  try {
    const sendData: Record<string, unknown> = {
      templateCode: tplSendRow.value.sysMessageTemplateCode,
      subject: tplSendForm.value.subject || undefined,
      params: tplSendForm.value.params,
    };
    if (hasRoles) sendData.roleKeys = tplSendForm.value.roleKeys;
    if (targets.length) sendData.target = targets;
    const res = await sendMessageByCode(sendData as never);
    const list = res?.data ?? [];
    const okCount = list.filter((r) => r.success).length;
    const failCount = list.length - okCount;
    if (failCount === 0) {
      message.success(`发送成功（${okCount} 条）`);
    } else {
      message.warning(`完成：成功 ${okCount} 条，失败 ${failCount} 条`);
    }
    tplSendVisible.value = false;
  } catch (e) {
    message.error((e as Error)?.message ?? "发送失败");
  } finally {
    tplSendLoading.value = false;
  }
}

/* ================== Tab3: 发送日志 ================== */
const logQuery = ref<{
  page: number;
  pageSize: number;
  sysMessageLogTarget?: string;
  sysMessageCode?: string;
}>({
  page: 1,
  pageSize: 10,
});

const logTableRef = ref();

async function loadLogs({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForMessageLog({
    page,
    pageSize,
    sysMessageLogTarget: (params.sysMessageLogTarget as string) || undefined,
    sysMessageCode: (params.sysMessageCode as string) || undefined,
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

function handleLogReset() {
  logQuery.value = { page: 1, pageSize: 10 };
  logTableRef.value?.reload();
}

const logSearchFilters = computed(() => [
  { key: "sysMessageLogTarget", label: "接收人", type: "input" as const, placeholder: "邮箱/手机号" },
  {
    key: "sysMessageCode",
    label: "状态",
    type: "select" as const,
    placeholder: "全部",
    options: logStatusOptions,
  },
]);

/* --- 日志详情弹窗 --- */
const logDetailVisible = ref(false);
const logDetailRow = ref<SysMessageLog | null>(null);

function handleLogDetail(row: Record<string, unknown>) {
  logDetailRow.value = row as unknown as SysMessageLog;
  logDetailVisible.value = true;
}

/* --- 日志清理弹窗 --- */
const logCleanVisible = ref(false);
const logCleanLoading = ref(false);
const logCleanBeforeTime = ref<string>("");

function handleLogOpenClean() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  logCleanBeforeTime.value = d.toISOString().slice(0, 10);
  logCleanVisible.value = true;
}

async function doLogClean() {
  if (!logCleanBeforeTime.value) {
    message.warning("请选择截止日期");
    return;
  }
  try {
    await ElMessageBox.confirm(`确认清理 ${logCleanBeforeTime.value} 之前的日志？此操作不可恢复。`, "危险操作", {
      type: "warning",
    });
  } catch {
    return;
  }
  logCleanLoading.value = true;
  try {
    const res = await cleanMessageLog(logCleanBeforeTime.value);
    message.success(`清理完成，共删除 ${res?.data ?? 0} 条`);
    logCleanVisible.value = false;
    logTableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? "清理失败");
  } finally {
    logCleanLoading.value = false;
  }
}

/* ================== 列定义 ================== */
const msgColumns: ReTableColumn[] = [
  { prop: "sysMessageTitle", label: "标题", minWidth: 200, showOverflowTooltip: true },
  { prop: "sysMessageType", label: "类型", width: 90, slot: "type", align: "center" },
  { prop: "sysMessageChannel", label: "渠道", width: 90, slot: "mchannel", align: "center" },
  { prop: "sysMessageLevel", label: "级别", width: 80, slot: "level", align: "center" },
  { prop: "sysMessageSenderName", label: "发送者", width: 110 },
  { prop: "sysMessageReceiverName", label: "接收者", width: 110, slot: "receiver" },
  { prop: "sysMessageSendTime", label: "发送时间", width: 170, slot: "sendTime" },
  { prop: "sysMessageStatus", label: "状态", width: 90, slot: "mstatus", align: "center" },
  { prop: "action", label: "操作", width: 220, slot: "action", fixed: "right" },
];

const tplColumns: ReTableColumn[] = [
  { prop: "sysMessageTemplateCode", label: "编码", width: 160 },
  { prop: "sysMessageTemplateName", label: "名称", minWidth: 140 },
  { prop: "sysMessageTemplateTitle", label: "标题", minWidth: 160, showOverflowTooltip: true },
  {
    prop: "sysMessageChannel",
    label: "渠道",
    width: 90,
    align: "center",
    formatter: (_r: Record<string, unknown>, _c: ReTableColumn, v: unknown) => channelLabel(v as string),
  },
  {
    prop: "sysMessageTemplateType",
    label: "类型",
    width: 90,
    align: "center",
    formatter: (_r: Record<string, unknown>, _c: ReTableColumn, v: unknown) => templateTypeLabel(v as string),
  },
  { prop: "sysMessageExternalCode", label: "外部模板码", width: 140, showOverflowTooltip: true },
  { prop: "status", label: "状态", slot: "tstatus", width: 80, align: "center" },
  { prop: "action", label: "操作", slot: "taction", fixed: "right", width: 240, align: "center" },
];

const logColumns: ReTableColumn[] = [
  { prop: "sysMessageLogTarget", label: "接收人", minWidth: 160, showOverflowTooltip: true },
  {
    prop: "sysMessageLogChannel",
    label: "渠道",
    width: 90,
    align: "center",
    formatter: (_r: Record<string, unknown>, _c: ReTableColumn, v: unknown) => channelLabel(v as string),
  },
  { prop: "sysMessageLogSubject", label: "主题", minWidth: 160, showOverflowTooltip: true },
  { prop: "sysMessageLogContent", label: "内容摘要", minWidth: 200, showOverflowTooltip: true },
  { prop: "status", label: "状态", slot: "logstatus", width: 80, align: "center" },
  { prop: "sysMessageCost", label: "耗时(ms)", width: 100, slot: "cost", align: "center" },
  { prop: "sysMessageLogMessageId", label: "消息ID", width: 160, showOverflowTooltip: true },
  { prop: "createTime", label: "发送时间", width: 170, slot: "logTime" },
  { prop: "action", label: "操作", slot: "logaction", fixed: "right", width: 90, align: "center" },
];

onMounted(() => {
  loadTemplates();
  loadRoles();
});
</script>

<template>
  <div class="system-page">
    <ReTab
      v-model="activeTab"
      v-model:collapsed="tabsCollapsed"
      :tabs="mainTabs"
      variant="icon"
      tab-position="right"
      collapsible
    >
        <!-- ============ Tab1: 消息记录 ============ -->
        <template #message>
          <ReTable
            ref="msgTableRef"
            table-id="system-message-admin"
            v-model:engine="msgEngine"
            debug
            :search="{ filters: msgSearchFilters, title: '搜索', btnMode: 'text' }"
            :search-gap="16"
            v-model:search-model="msgQuery"
            @search-reset="handleMsgReset"
            :loader="loadMessages"
            :columns="msgColumns"
            :pagination="true"
            :params="msgQuery"
            row-key="sysMessageId"
            v-model:page="msgQuery.page"
            v-model:page-size="msgQuery.pageSize"
            row-draggable
            @row-sort="onMsgRowSort"
            class="mt-2"
          >
            <template #toolbar>
              <!-- C：去掉 text 改为实心主色按钮；handleAdd 打开的是「发送消息」弹窗，
                   文案写「发送消息」而不是「新增消息」——它不做草稿暂存，点了就是发出去 -->
              <ReButton type="primary" icon="Plus" v-admin @click="handleAdd">发送消息</ReButton>
            </template>
            <template #empty>
              <div class="page-empty">
                <span class="page-empty__icon">
                  <ReIcon name="ChatDotRound" size="22" />
                </span>
                <span class="page-empty__title">还没有消息</span>
                <span class="page-empty__desc">消息是系统投递给用户的通知记录，发布后可查送达与已读回执。</span>
                <span class="page-empty__actions">
                  <ReButton type="primary" icon="Plus" v-admin @click="handleAdd">发送消息</ReButton>
                  <!-- 复用已有 handleMsgReset（清空筛选 + 回到第一页重新拉取），不新增函数 -->
                  <ReButton icon="Refresh" @click="handleMsgReset">重置筛选</ReButton>
                </span>
              </div>
            </template>
            <template #type="{ row }">
              <ReTag type="primary" effect="light" round >{{ typeLabel(row.sysMessageType) }}</ReTag>
            </template>
            <template #mchannel="{ row }">
              <ReTag :type="msgChannelTagType(row.sysMessageChannel)" effect="light" round >
                {{ msgChannelLabel(row.sysMessageChannel) }}
              </ReTag>
            </template>
            <template #level="{ row }">
              <!-- B：级别是紧急度状态（high/urgent=danger、low=info），统一 plain + dot；
                   round 保留原有胶囊外形，不改 type 逻辑 -->
              <ReTag :type="levelTagType(row.sysMessageLevel)" effect="plain" round dot>
                {{ levelLabel(row.sysMessageLevel) }}
              </ReTag>
            </template>
            <template #receiver="{ row }">
              <span v-if="!row.sysMessageReceiverId || row.sysMessageReceiverId === 0" class="text-xs text-[--el-text-color-secondary]">
                全体用户
              </span>
              <span v-else>{{ row.sysMessageReceiverName || row.sysMessageReceiverId }}</span>
            </template>
            <template #sendTime="{ row }">
              <ReTime :value="row.sysMessageSendTime" format="YYYY-MM-DD HH:mm:ss" relative />
            </template>
            <template #mstatus="{ row }">
              <!-- B：发送状态（已发送=success / 已撤回=info / 草稿=warning）统一 plain + dot -->
              <ReTag :type="msgStatusTagType(row.sysMessageStatus)" effect="plain" round dot>
                {{ msgStatusLabel(row.sysMessageStatus) }}
              </ReTag>
            </template>
            <template #action="{ row }">
              <ReButton layout="square" icon="View" type="primary" tip="详情" @click="handleMsgDetail(row)" />
              <ReButton
                layout="square"
                type="warning"
                icon="RefreshLeft"
                v-admin
                tip="撤回"
                :disabled="row.sysMessageStatus === 2"
                :loading="msgActionLoading === row.sysMessageId"
                @click="handleRecall(row)"
              />
              <ReButton
                layout="square"
                type="danger"
                icon="Delete"
                v-admin
                tip="删除"
                :loading="msgActionLoading === row.sysMessageId"
                @click="handleDeleteMsg(row)"
              />
            </template>
          </ReTable>
        </template>

        <!-- ============ Tab2: 消息模板 ============ -->
        <template #template>
          <ReTable
            ref="tplTableRef"
            table-id="system-message-template"
            engine="vxe"
            :search="{ filters: tplSearchFilters, title: '搜索', btnMode: 'text' }"
            :search-gap="16"
            v-model:search-model="tplQuery"
            @search-reset="handleTplReset"
            :loader="loadTemplatesPage"
            :columns="tplColumns"
            :pagination="true"
            :params="tplQuery"
            row-key="sysMessageTemplateId"
            v-model:page="tplQuery.page"
            v-model:page-size="tplQuery.pageSize"
            class="mt-2"
          >
            <template #toolbar>
              <!-- C：原来是「只有图标的 text 按钮 + el-tooltip」，改为带文案的实心主色按钮；
                   按钮已有文字标签，原 tooltip 与之重复，故不再包裹 -->
              <ReButton type="primary" icon="Plus" v-admin @click="handleTplAdd">新增模板</ReButton>
            </template>
            <template #empty>
              <div class="page-empty">
                <span class="page-empty__icon">
                  <ReIcon name="Document" size="22" />
                </span>
                <span class="page-empty__title">还没有消息模板</span>
                <span class="page-empty__desc">模板是邮件 / 短信的统一文案来源，变量用 ${变量} 占位，业务方按编码调用。</span>
                <span class="page-empty__actions">
                  <ReButton type="primary" icon="Plus" v-admin @click="handleTplAdd">新增模板</ReButton>
                  <!-- 复用已有 handleTplReset（清空筛选 + 回到第一页重新拉取），不新增函数 -->
                  <ReButton icon="Refresh" @click="handleTplReset">重置筛选</ReButton>
                </span>
              </div>
            </template>
            <template #tstatus="{ row }">
              <ReSwitch
                layout="square"
                :model-value="row.sysMessageTemplateStatus === 1"
                @update:model-value="() => handleTplStatus(row as SysMessageTemplate)"
              />
            </template>
            <template #taction="{ row }">
              <ReButton layout="square" icon="View" type="primary" tip="预览" @click="handleTplPreview(row)" />
              <ReButton layout="square" icon="Promotion" type="success" tip="发送" v-admin @click="handleTplSend(row)" />
              <ReButton layout="square" icon="Edit" type="primary" tip="编辑" v-admin @click="handleTplEdit(row)" />
              <ReButton
                layout="square"
                icon="Delete"
                type="danger"
                tip="删除"
                v-admin
                :loading="tplActionLoading === row.sysMessageTemplateId"
                @click="handleTplDelete(row)"
              />
            </template>
          </ReTable>
        </template>

        <!-- ============ Tab3: 发送日志 ============ -->
        <template #log>
          <ReTable
            ref="logTableRef"
            table-id="system-message-log"
            engine="vxe"
            :search="{ filters: logSearchFilters, title: '搜索', btnMode: 'text' }"
            :search-gap="16"
            v-model:search-model="logQuery"
            @search-reset="handleLogReset"
            :loader="loadLogs"
            :columns="logColumns"
            :pagination="true"
            :params="logQuery"
            row-key="sysMessageLogId"
            v-model:page="logQuery.page"
            v-model:page-size="logQuery.pageSize"
            class="mt-2"
          >
            <template #toolbar>
              <!-- C：清理是破坏性操作，保留 danger 语义（不套 primary），但补上明确文案 -->
              <ReButton type="danger" icon="Delete" v-admin @click="handleLogOpenClean">清理历史日志</ReButton>
            </template>
            <template #empty>
              <div class="page-empty">
                <span class="page-empty__icon">
                  <ReIcon name="Tickets" size="22" />
                </span>
                <span class="page-empty__title">还没有发送日志</span>
                <span class="page-empty__desc">每次按模板推送都会在这里留一条记录，含渠道、耗时与回执，便于排查送达问题。</span>
                <span class="page-empty__actions">
                  <ReButton type="danger" icon="Delete" v-admin @click="handleLogOpenClean">清理历史日志</ReButton>
                  <!-- 复用已有 handleLogReset（清空筛选 + 回到第一页重新拉取），不新增函数 -->
                  <ReButton icon="Refresh" @click="handleLogReset">重置筛选</ReButton>
                </span>
              </div>
            </template>
            <template #logstatus="{ row }">
              <!-- B：推送结果状态（成功=success / 失败=danger / 其他=info）统一 plain + dot -->
              <ReTag :type="logStatusTagType(row.sysMessageCode)" effect="plain" dot>
                {{ logStatusLabel(row.sysMessageCode) }}
              </ReTag>
            </template>
            <template #cost="{ row }">
              <ReCostText :cost="row.sysMessageCost == null ? null : Number(row.sysMessageCost)" />
            </template>
            <template #logTime="{ row }">
              <ReTime :value="row.createTime" format="YYYY-MM-DD HH:mm:ss" relative />
            </template>
            <template #logaction="{ row }">
              <ReButton layout="square" icon="View" type="primary" tip="详情" @click="handleLogDetail(row)" />
            </template>
          </ReTable>
        </template>
    </ReTab>

    <!-- ========== 发送消息弹窗（站内消息） ========== -->
    <ReDialog
      v-model="sendVisible"
      title="发送消息"
      width="640"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="sendSaving"
      :footer-hidden="false" @ok="handleSend"
    >
      <el-form label-width="90px" :model="sendForm">
        <el-form-item label="模板选择">
          <ReSelect
            v-model="sendForm.templateCode"
            placeholder="选择模板自动填充"
            clearable
            class="!w-full"
            :data="templates.map((t) => ({ label: t.sysMessageTemplateName, value: t.sysMessageTemplateCode }))"
            @change="onTemplateChange"
          />
        </el-form-item>
        <el-form-item label="消息标题" required>
          <ReInput layout="modern" v-model="sendForm.sysMessageTitle" placeholder="请输入消息标题" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="消息内容">
          <ReInput layout="modern" v-model="sendForm.sysMessageContent" type="textarea" :rows="4" placeholder="请输入消息内容" maxlength="2000" show-word-limit />
        </el-form-item>
        <el-form-item label="消息类型">
          <ReSelect v-model="sendForm.sysMessageType" placeholder="消息类型" class="!w-full" :data="typeOptions" />
        </el-form-item>
        <el-form-item label="消息级别">
          <ReSelect v-model="sendForm.sysMessageLevel" placeholder="消息级别" class="!w-full" :data="levelOptions" />
        </el-form-item>
        <el-form-item label="接收者ID">
          <ReInputNumber layout="modern" v-model="sendForm.sysMessageReceiverId" :min="0" class="!w-full" placeholder="留空或填 0 表示广播给全体用户" />
        </el-form-item>
        <el-form-item label="跳转链接">
          <ReInput layout="modern" v-model="sendForm.sysMessageUrl" placeholder="选填，应用内路径如 /manage/post，或 https:// 外链" maxlength="255" />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- ========== 消息详情弹窗（送达/已读回执） ========== -->
    <ReDialog v-model="msgDetailVisible" title="消息详情" width="760px" :footer-hidden="true">
      <div v-if="msgDetailRow" v-loading="msgDetailLoading">
        <el-descriptions :column="2" border  class="mb-4">
          <el-descriptions-item label="标题">{{ msgDetailRow.sysMessageTitle || '--' }}</el-descriptions-item>
          <el-descriptions-item label="渠道">{{ msgChannelLabel(msgDetailRow.sysMessageChannel) }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ typeLabel(msgDetailRow.sysMessageType) }}</el-descriptions-item>
          <el-descriptions-item label="级别">{{ levelLabel(msgDetailRow.sysMessageLevel) }}</el-descriptions-item>
          <el-descriptions-item label="发送者">{{ msgDetailRow.sysMessageSenderName || '--' }}</el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ msgDetailRow.sysMessageSendTime || '--' }}</el-descriptions-item>
        </el-descriptions>

        <div class="receipt-section">
          <h4 class="receipt-section__title">送达统计</h4>
          <el-alert
            v-if="msgDetailRow.sysMessageChannel && msgDetailRow.sysMessageChannel !== 'PLATFORM'"
            type="info"
            :closable="false"
            style="margin-bottom: 12px"
          >
            <span style="font-size: 12px">邮件/短信消息已读回执受限，仅展示送达状态</span>
          </el-alert>
          <div class="receipt-stats">
            <div class="receipt-stat-card">
              <div class="receipt-stat-card__num">{{ msgDetailRow.readCount ?? '-' }}</div>
              <div class="receipt-stat-card__label">已读</div>
            </div>
            <div class="receipt-stat-card">
              <div class="receipt-stat-card__num">{{ msgDetailRow.unreadCount ?? '-' }}</div>
              <div class="receipt-stat-card__label">未读</div>
            </div>
          </div>
          <div class="receipt-empty">送达名单与已读名单待后端详情端点对接后展示</div>
        </div>

        <div class="receipt-section">
          <h4 class="receipt-section__title">消息内容</h4>
          <div class="receipt-content">{{ msgDetailRow.sysMessageContent || '--' }}</div>
        </div>
      </div>
    </ReDialog>

    <!-- ========== 模板新增/编辑弹窗 ========== -->
    <ReDialog
      v-model="tplDialogVisible"
      :title="tplIsEdit ? '编辑模板' : '新增模板'"
      width="760"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="tplSaving"
      :footer-hidden="false" @ok="handleTplSubmit"
    >
      <el-form :model="tplForm" label-position="top">
        <el-alert
          v-if="!tplIsEdit"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        >
          <template #title>
            <span style="font-size: 12px">短信模板建议通过「同步模板」从运营商拉取；手工新增仅用于无模板列表 API 的提供商或自定义场景。</span>
          </template>
        </el-alert>

        <section class="tpl-section">
          <h4 class="tpl-section__title">基本信息</h4>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="模板编码" required>
                <el-input v-model="tplForm.sysMessageTemplateCode" placeholder="如 order_created" :disabled="tplIsEdit" maxlength="100" />
                <div class="form-tip">编码全局唯一，新增后不可修改</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="模板名称">
                <el-input v-model="tplForm.sysMessageTemplateName" placeholder="如 订单创建通知" maxlength="100" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="消息渠道" required>
                <el-select v-model="tplForm.sysMessageChannel" style="width: 100%" placeholder="选择渠道">
                  <el-option v-for="o in channelOptions" :key="o.value" :label="o.label" :value="o.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item v-if="tplForm.sysMessageChannel !== 'SMS'" label="内容类型">
                <el-select v-model="tplForm.sysMessageTemplateType" style="width: 100%">
                  <el-option v-for="o in templateTypeOptions" :key="o.value" :label="o.label" :value="o.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <!-- EMAIL 渠道：标题 + 内容 -->
        <section v-if="tplForm.sysMessageChannel !== 'SMS'" class="tpl-section">
          <h4 class="tpl-section__title">邮件内容</h4>
          <el-form-item label="标题（支持 ${变量}）">
            <el-input v-model="tplForm.sysMessageTemplateTitle" placeholder="如 您的订单 ${orderNo} 已创建" maxlength="200" />
          </el-form-item>
          <el-form-item v-if="tplForm.sysMessageTemplateType !== 'RICHTEXT'" label="内容（支持 ${变量}）">
            <el-input v-model="tplForm.sysMessageTemplateContent" type="textarea" :rows="6" placeholder="请输入模板内容，变量用 ${varName} 占位" />
          </el-form-item>
          <el-form-item v-else label="内容（富文本编辑器）">
            <div class="rich-editor">
              <div class="rich-editor__toolbar">
                <el-button-group >
                  <el-button @click="execRichCommand('bold')" title="加粗"><b>B</b></el-button>
                  <el-button @click="execRichCommand('italic')" title="斜体"><i>I</i></el-button>
                  <el-button @click="execRichCommand('underline')" title="下划线"><u>U</u></el-button>
                  <el-button @click="execRichCommand('strikeThrough')" title="删除线"><s>S</s></el-button>
                </el-button-group>
                <el-button-group  style="margin-left: 8px">
                  <el-button @click="execRichCommand('formatBlock', 'h3')" title="标题">H3</el-button>
                  <el-button @click="execRichCommand('insertUnorderedList')" title="列表">•</el-button>
                  <el-button @click="execRichCommand('insertOrderedList')" title="编号">1.</el-button>
                </el-button-group>
                <el-button-group  style="margin-left: 8px">
                  <el-button @click="execRichCommand('justifyLeft')" title="左对齐">左</el-button>
                  <el-button @click="execRichCommand('justifyCenter')" title="居中">中</el-button>
                  <el-button @click="execRichCommand('justifyRight')" title="右对齐">右</el-button>
                </el-button-group>
                <el-button  style="margin-left: 8px" @click="execRichCommand('removeFormat')" title="清除格式">清除</el-button>
              </div>
              <div
                ref="richEditorRef"
                class="rich-editor__body"
                contenteditable="true"
                @input="syncRichEditorContent"
              ></div>
            </div>
          </el-form-item>
        </section>

        <!-- SMS 渠道：外部模板码 + 变量说明 -->
        <section v-if="tplForm.sysMessageChannel === 'SMS'" class="tpl-section">
          <h4 class="tpl-section__title">短信配置</h4>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="外部运营商模板码" required>
                <el-input v-model="tplForm.sysMessageExternalCode" placeholder="如 SMS_123456789" maxlength="100" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="变量说明（逗号分隔）">
                <el-input v-model="tplForm.sysMessageParamSchema" placeholder="如 name,orderNo,amount" maxlength="200" />
                <div class="form-tip">内置变量 ${date}、${time} 由后端自动注入，无需填写</div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="短信标题（可选）">
            <el-input v-model="tplForm.sysMessageTemplateTitle" placeholder="如 订单通知" maxlength="200" />
          </el-form-item>
          <el-form-item label="短信内容（可选）">
            <el-input v-model="tplForm.sysMessageTemplateContent" type="textarea" :rows="3" placeholder="短信正文示例" />
          </el-form-item>
        </section>

        <!-- EMAIL 渠道：业务变量说明 -->
        <section v-if="tplForm.sysMessageChannel !== 'SMS'" class="tpl-section">
          <h4 class="tpl-section__title">变量说明</h4>
          <el-form-item label="业务变量（逗号分隔）">
            <el-input v-model="tplForm.sysMessageParamSchema" placeholder="如 name,orderNo,amount" maxlength="200" />
            <div class="form-tip">内置变量 ${date}、${time} 由后端自动注入，无需在发送时传入</div>
          </el-form-item>
        </section>

        <section class="tpl-section">
          <h4 class="tpl-section__title">其他设置</h4>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="回调 URL">
                <el-input v-model="tplForm.sysMessageTemplateCallbackUrl" placeholder="发送后回调地址（可选）" maxlength="500" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="排序">
                <el-input-number v-model="tplForm.sysMessageTemplateSort" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="状态">
                <ReSwitch layout="square" :model-value="tplForm.sysMessageTemplateStatus === 1" @update:model-value="(v: boolean) => tplForm.sysMessageTemplateStatus = v ? 1 : 0" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="备注">
            <el-input v-model="tplForm.sysMessageTemplateRemark" type="textarea" :rows="2" maxlength="500" />
          </el-form-item>
        </section>
      </el-form>
    </ReDialog>

    <!-- ========== 模板预览弹窗（左右布局） ========== -->
    <ReDialog v-model="previewVisible" title="模板预览" width="880px" :footer-hidden="true">
      <div class="preview-layout">
        <div class="preview-layout__left">
          <h4 class="preview-layout__heading">参数填写</h4>
          <template v-if="previewFields.filter((f) => !f.isBuiltIn).length">
            <el-form-item v-for="f in previewFields.filter((f) => !f.isBuiltIn)" :key="f.key" :label="f.key" label-position="top">
              <el-input-number
                v-if="f.type === 'number'"
                v-model="previewParams[f.key]"
                :controls="false"
                style="width: 100%"
                :placeholder="`请输入 ${f.key}`"
              />
              <el-date-picker
                v-else-if="f.type === 'date'"
                v-model="previewParams[f.key]"
                type="date"
                style="width: 100%"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
              />
              <el-input v-else v-model="previewParams[f.key]" :placeholder="`请输入 ${f.key}`" />
            </el-form-item>
          </template>
          <el-empty v-if="!previewFields.filter((f) => !f.isBuiltIn).length" description="无业务变量" :image-size="40" />

          <div v-if="previewFields.filter((f) => f.isBuiltIn).length" class="built-in-section">
            <div class="built-in-section__title">内置变量（系统自动生成）</div>
            <div v-for="f in previewFields.filter((f) => f.isBuiltIn)" :key="f.key" class="built-in-section__item">
              <span class="built-in-section__key">{{ f.key }}</span>
              <span class="built-in-section__desc">{{ builtInVars.find((v) => v.key === f.key)?.label || '' }}</span>
            </div>
          </div>
        </div>

        <div class="preview-layout__right" v-loading="previewLoading">
          <h4 class="preview-layout__heading">渲染结果</h4>
          <div v-if="previewResult" class="preview-result">
            <div class="preview-result__tags">
              <!-- B：变量是否全部解析是结果状态，换成 ReTag 并统一 plain + dot -->
              <ReTag v-if="!previewResult.complete" type="warning" effect="plain" dot>存在未解析变量</ReTag>
              <ReTag v-else type="success" effect="plain" dot>全部解析</ReTag>
            </div>
            <div v-if="previewResult.unresolvedParams?.length" class="preview-result__unresolved">
              未解析变量：{{ previewResult.unresolvedParams.join(', ') }}
            </div>
            <div class="preview-result__title">{{ previewResult.title || "（无标题）" }}</div>
            <div
              class="preview-result__content"
              :class="{ 'preview-result__content--text': previewRow?.sysMessageTemplateType === 'TEXT' }"
              v-html="previewResult.content || '（无内容）'"
            ></div>
          </div>
          <el-empty v-else description="填写参数后自动渲染" :image-size="60" />
        </div>
      </div>
    </ReDialog>

    <!-- ========== 按模板发送弹窗（角色选择） ========== -->
    <ReDialog
      v-model="tplSendVisible"
      title="发送测试消息"
      width="680px"
      :close-on-click-modal="false"
      destroy-on-close
      :confirm-loading="tplSendLoading"
      :footer-hidden="false" @ok="doTplSend"
    >
      <el-form :model="tplSendForm" label-position="top">
        <el-form-item label="接收角色（多选）">
          <el-select
            v-model="tplSendForm.roleKeys"
            multiple
            filterable
            clearable
            placeholder="选择角色，将发送给该角色下所有用户"
            style="width: 100%"
          >
            <el-option v-for="r in roleOptions" :key="r.sysRoleCode" :label="r.sysRoleName" :value="r.sysRoleCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="手工接收人（兜底）">
          <el-input
            v-model="tplSendForm.targetText"
            type="textarea"
            :rows="3"
            placeholder="邮箱地址或手机号，多个用逗号或换行分隔"
          />
        </el-form-item>
        <el-form-item label="标题（可选，覆盖模板标题）">
          <el-input v-model="tplSendForm.subject" maxlength="200" />
        </el-form-item>

        <template v-if="sendFields.filter((f) => !f.isBuiltIn).length">
          <el-divider content-position="left" style="font-size: 12px">业务变量</el-divider>
          <el-form-item v-for="f in sendFields.filter((f) => !f.isBuiltIn)" :key="f.key" :label="f.key">
            <el-input-number
              v-if="f.type === 'number'"
              v-model="tplSendForm.params[f.key]"
              :controls="false"
              style="width: 100%"
              :placeholder="`请输入 ${f.key}`"
            />
            <el-date-picker
              v-else-if="f.type === 'date'"
              v-model="tplSendForm.params[f.key]"
              type="date"
              style="width: 100%"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
            />
            <el-input v-else v-model="tplSendForm.params[f.key]" :placeholder="`请输入 ${f.key}`" />
          </el-form-item>
        </template>

        <div v-if="sendFields.filter((f) => f.isBuiltIn).length" class="built-in-tip">
          内置变量（{{ sendFields.filter((f) => f.isBuiltIn).map((f) => '${' + f.key + '}').join('、') }}）由系统自动填充，无需填写
        </div>
      </el-form>
    </ReDialog>

    <!-- ========== 日志详情弹窗 ========== -->
    <ReDialog v-model="logDetailVisible" title="日志详情" width="680px" :footer-hidden="true">
      <div v-if="logDetailRow" class="log-detail">
        <el-descriptions :column="2" border >
          <el-descriptions-item label="接收人">{{ logDetailRow.sysMessageLogTarget || '--' }}</el-descriptions-item>
          <el-descriptions-item label="渠道">{{ channelLabel(logDetailRow.sysMessageLogChannel) }}</el-descriptions-item>
          <el-descriptions-item label="模板ID">{{ logDetailRow.sysMessageTemplateId ?? '--' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <!-- B：日志详情里的推送结果同样统一 plain + dot -->
            <ReTag :type="logStatusTagType(logDetailRow.sysMessageCode)" effect="plain" dot>
              {{ logStatusLabel(logDetailRow.sysMessageCode) }}
            </ReTag>
          </el-descriptions-item>
          <el-descriptions-item label="耗时">{{ logDetailRow.sysMessageCost != null ? logDetailRow.sysMessageCost + ' ms' : '--' }}</el-descriptions-item>
          <el-descriptions-item label="消息ID" :span="2">{{ logDetailRow.sysMessageLogMessageId || '--' }}</el-descriptions-item>
          <el-descriptions-item label="批次号" :span="2">{{ logDetailRow.sysMessageBatchId || '--' }}</el-descriptions-item>
          <el-descriptions-item label="发送时间" :span="2">{{ logDetailRow.createTime || '--' }}</el-descriptions-item>
          <el-descriptions-item label="返回消息" :span="2">{{ logDetailRow.sysMessageMessage || '--' }}</el-descriptions-item>
        </el-descriptions>
        <div class="log-detail__section">
          <h4 class="log-detail__label">主题</h4>
          <div class="log-detail__value">{{ logDetailRow.sysMessageLogSubject || '--' }}</div>
        </div>
        <div class="log-detail__section">
          <h4 class="log-detail__label">内容</h4>
          <div class="log-detail__value log-detail__value--content">{{ logDetailRow.sysMessageLogContent || '--' }}</div>
        </div>
        <div class="log-detail__section">
          <h4 class="log-detail__label">参数</h4>
          <pre class="log-detail__value log-detail__value--pre">{{ logDetailRow.sysMessageLogParam || '--' }}</pre>
        </div>
      </div>
    </ReDialog>

    <!-- ========== 日志清理弹窗 ========== -->
    <ReDialog
      v-model="logCleanVisible"
      title="清理历史日志"
      width="480px"
      :close-on-click-modal="false"
      :confirm-loading="logCleanLoading"
      :footer-hidden="false" @ok="doLogClean"
    >
      <el-form label-position="top">
        <el-form-item label="清理截止日期之前的日志" required>
          <el-date-picker
            v-model="logCleanBeforeTime"
            type="date"
            placeholder="选择截止日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <p class="clean-tip">将物理删除该日期之前的所有推送日志，操作不可恢复。</p>
      </el-form>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
  height: 100%;
}

/* 本页不再覆盖 ReTable 的卡片外观：1px 描边、卡片圆角与投影、hover / focus-within
   反馈全部由 ReTable 与 ReTableToolbar 自身提供（见 packages/ui ReTable/shared/table-vars.css
   与 ReTable.vue 的 .re-table--separated 规则），换模块无需重写。 */
/* 搜索区与工具条主按钮的形状（胶囊输入框 / 胶囊按钮 / 主按钮渐变）
   已收进插件：胶囊见 ReSearch 的 koi 主题，工具条主按钮见 ReTable 的
   .re-table__toolbar-left 规则。本页不再重复声明。 */

/* vxe 表头（底色 / 一级文字色 / 字重 / 行线）由 ReTable 自身提供，
   见 ReTable.vue 的 `.re-table .vxe-header--column` 规则，本页不再覆盖。

   工具条与表格的分隔线一并删除：原写法 `.re-table-toolbar` 命中的是
   ReTableToolbar 组件根节点，而它在 `toolbarConfigPosition === 'top'` 时会以
   mode="tools" 渲染进底部「分页 + 工具组」那一栏 —— 于是这条 border-bottom
   和 padding-bottom 落在了分页栏里，造成多一条线、并把右侧三个按钮撑高错位。
   顶层工具栏行是 `.re-table__toolbar-row`，与分页栏不是同一个元素。 */

/* 表格本体（表头底色与字重、单元格内边距与字色、行分隔线、悬停底色）
   由 ReTable 自身提供 —— 见 ReTable.vue 的
   `.re-table .el-table` / `.re-table .el-table__header-wrapper th.el-table__cell` /
   `.re-table .el-table__body td.el-table__cell` 等规则，两套引擎统一由那里收口。 */

.tpl-section {
  & + & {
    margin-top: 6px;
    padding-top: 18px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
  &__title {
    display: flex;
    align-items: center;
    margin: 0 0 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-regular);
    /* 3px 宽的竖条：圆角走 full 令牌，视觉上被自身宽度夹住仍是小圆头 */
    &::before {
      content: "";
      display: inline-block;
      width: 3px;
      height: 13px;
      margin-right: 8px;
      border-radius: var(--el-radius-full, 9999px);
      background: var(--el-color-primary);
    }
  }
}

.rich-editor {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-sm, 6px);
  overflow: hidden;
  &__toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    padding: 6px 8px;
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
  &__body {
    min-height: 180px;
    max-height: 360px;
    overflow-y: auto;
    padding: 12px;
    font-size: 14px;
    line-height: 1.7;
    color: var(--el-text-color-primary);
    outline: none;
    background: var(--el-bg-color);
    h3 { margin: 8px 0; font-size: 16px; font-weight: 700; }
  }
}

.preview-layout {
  display: flex;
  gap: 0;
  min-height: 400px;
  &__left {
    width: 40%;
    padding: 0 20px 0 0;
    border-right: 1px solid var(--el-border-color);
    overflow-y: auto;
  }
  &__right {
    flex: 1;
    padding: 0 0 0 20px;
    overflow-y: auto;
  }
  &__heading {
    margin: 0 0 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-regular);
  }
}

.preview-result {
  &__tags { display: flex; gap: 8px; margin-bottom: 8px; }
  &__unresolved { margin-bottom: 8px; font-size: 12px; color: var(--el-color-warning); }
  &__title { margin: 0 0 12px; font-size: 16px; font-weight: 700; color: var(--el-text-color-primary); }
  &__content {
    padding: 16px;
    max-height: 400px;
    overflow-y: auto;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-radius-sm, 6px);
    font-size: 14px;
    line-height: 1.7;
    color: var(--el-text-color-primary);
    word-break: break-word;
    &--text { white-space: pre-wrap; }
  }
}

.built-in-section {
  margin-top: 16px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-sm, 6px);
  &__title { margin: 0 0 8px; font-size: 12px; font-weight: 600; color: var(--el-text-color-secondary); }
  &__item { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 12px; }
  &__key { font-family: monospace; color: var(--el-color-primary); }
  &__desc { color: var(--el-text-color-secondary); }
}

.built-in-tip {
  margin-top: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-sm, 6px);
}

.receipt-section {
  margin-top: 20px;
  &__title { margin: 0 0 12px; font-size: 13px; font-weight: 600; color: var(--el-text-color-regular); }
}
.receipt-stats { display: flex; gap: 12px; margin-bottom: 12px; }
.receipt-stat-card {
  flex: 1;
  padding: 16px;
  text-align: center;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  &__num { font-size: 24px; font-weight: 700; color: var(--el-text-color-primary); }
  &__label { margin-top: 4px; font-size: 12px; color: var(--el-text-color-secondary); }
}
.receipt-empty {
  padding: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-sm, 6px);
}
.receipt-content {
  padding: 12px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-sm, 6px);
}

.log-detail {
  &__section { margin-top: 16px; }
  &__label { margin: 0 0 6px; font-size: 13px; font-weight: 600; color: var(--el-text-color-secondary); }
  &__value {
    font-size: 14px; color: var(--el-text-color-primary); word-break: break-word;
    &--content { white-space: pre-wrap; line-height: 1.7; }
    &--pre {
      margin: 0; padding: 12px; background: var(--el-fill-color-light);
      border-radius: var(--el-radius-sm, 6px); font-size: 12px; line-height: 1.6;
      white-space: pre-wrap; word-break: break-word;
    }
  }
}

.clean-tip { margin: 0; font-size: 12px; color: var(--el-color-danger); }
.form-tip { font-size: 12px; line-height: 1.5; color: var(--el-text-color-secondary); margin-top: 4px; }

:deep(.el-form-item) { margin-bottom: 18px; }
:deep(.el-form-item:last-child) { margin-bottom: 0; }

@media (max-width: 768px) {
  .preview-layout {
    flex-direction: column;
    &__left { width: 100%; padding: 0 0 16px; border-right: none; border-bottom: 1px solid var(--el-border-color); }
    &__right { padding: 16px 0 0; }
  }
}

/* 减少动态效果的降级由组件自带：ReTable / ReSearch(koi) 各自内联
   `@media (prefers-reduced-motion: reduce)` 关掉自己的过渡（仓库内各 Re 组件统一这么做），
   页面不再集中代管。 */
</style>
