<script setup lang="ts">
/**
 * 策略任务 —— 运行时策略控制台
 *
 * 三个工作区：
 *   1. 热更新配置：运行时 setting 的独立维护入口；
 *   2. 限流配置：全局参数 + 接口/IP/账号三维规则；
 *   3. 黑白名单：IP 网段与账号访问名单。
 *
 * 页面采用“主导航 + 当前工作区 + 单一操作区”的控制台结构，避免卡片嵌套。
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { InfoFilled } from "@element-plus/icons-vue";
import {
  applyRateLimitGlobal,
  countPolicyConfig,
  deleteAccountBw,
  deleteIp,
  deletePolicyConfig,
  deleteRateLimit,
  getRateLimitGlobal,
  listFeatureStates,
  listHotReload,
  listRateLimit,
  listRegisteredFeatures,
  listApiRouteTargets,
  pageForAccountBw,
  pageForIp,
  pagePolicyConfig,
  refreshApiRoute,
  reloadHotReload,
  saveAccountBw,
  saveHotReload,
  saveIp,
  savePolicyConfig,
  saveRateLimit,
  togglePolicyConfig,
  updateAccountBw,
  updateIp,
  updatePolicyConfig,
  updateRateLimit,
} from "../../api/systemApi";
import type {
  AccountBlackwhite,
  ApiRouteAction,
  ApiRouteRuleConfig,
  HotReloadConfig,
  PolicyConfig,
  RateLimitGlobal,
  RateLimitRule,
  RegisteredRoute,
  SysIpBlackwhite,
} from "../../api/types";
import type {
  RePageResult,
  ReTableColumn,
  ReTableLoadParams,
  ReTableToolbarConfig,
  ReViewField,
  ReViewLayoutProps,
} from "@repo/ui/re-table";
import ReTab from "@repo/ui/re-tab";

type MainTabName = "overview" | "hotreload" | "ratelimit" | "blackwhite" | "gray" | "feature" | "route";
type RateDimension = NonNullable<RateLimitRule["dimension"]>;
type BlackWhiteTabName = "ip" | "account";
type AccountType = NonNullable<AccountBlackwhite["type"]>;
type AccountStatus = NonNullable<AccountBlackwhite["status"]>;

interface TableReloadRef {
  reload: () => Promise<void> | void;
}

/**
 * 取一行的业务标识，供操作按钮的 aria-label / tooltip 用
 *
 * <p>七个表格的行类型各不相同（热更新 SysSetting、限流 RateLimitRule、IP SysIpBlackwhite、
 * 账号 AccountBlackwhite、灰度/功能开关/接口管控 PolicyConfig），标识字段也不一样。
 * 逐个插槽硬写字段名既啰嗦又容易漏，所以这里按优先级兜一次。</p>
 *
 * <p><b>为什么必须有它</b>：{@code ReButton} 的 {@code aria-label} 取自插槽文字。
 * 只写「编辑」「删除」时，同一列所有行的 aria-label 完全一致，屏幕阅读器
 * 只能报「编辑按钮」，用户无法知道要编辑哪一行。</p>
 */
function rowKeyOf(row: unknown): string {
  const r = (row ?? {}) as Record<string, unknown>;
  const candidates = [
    r.bizKey,
    r.target,
    r.sysIpIp,
    r.account,
    r.sysSettingCode,
    r.sysSettingName,
  ];
  for (const v of candidates) {
    if (null != v && "" !== v) {
      return String(v);
    }
  }
  return "";
}

interface IpQuery {
  page: number;
  pageSize: number;
  sysIpIp?: string;
  sysIpType?: number;
  sysIpStatus?: number;
}

interface IpSearchModel {
  sysIpIp?: string;
  sysIpType?: number;
  sysIpStatus?: number;
}

interface AccountQuery {
  page: number;
  pageSize: number;
  account?: string;
  type?: AccountType;
  status?: AccountStatus;
}

interface AccountSearchModel {
  account?: string;
  type?: AccountType;
  status?: AccountStatus;
}

const TABLE_TOOLBAR: ReTableToolbarConfig = {
  refresh: false,
  columnSettings: true,
  tableSettings: true,
  position: "bottom",
};

const activeMainTab = ref<MainTabName>("overview");
const rateTab = ref<RateDimension>("interface");
const bwTab = ref<BlackWhiteTabName>("ip");
const loadedMainTabs = ref<Record<MainTabName, boolean>>({
  overview: true,
  hotreload: false,
  ratelimit: false,
  blackwhite: false,
  gray: false,
  feature: false,
  route: false,
});

const mainTabs = [
  { name: "overview", label: "策略总览", caption: "运行链路与容量", icon: "DataBoard" },
  { name: "hotreload", label: "热更新配置", caption: "运行时参数", icon: "Setting" },
  { name: "ratelimit", label: "限流策略", caption: "QPS 与规则", icon: "Stopwatch" },
  { name: "blackwhite", label: "访问名单", caption: "IP 与账号", icon: "User" },
  { name: "gray", label: "灰度配置", caption: "流量切分", icon: "DataAnalysis" },
  { name: "feature", label: "功能开关", caption: "在线开关", icon: "SwitchButton" },
  { name: "route", label: "接口管控", caption: "停用与转发", icon: "Link" },
];
const rateTabs = [
  { name: "interface", label: "接口维度" },
  { name: "ip", label: "IP 维度" },
  { name: "account", label: "账号维度" },
];
const bwTabs = [
  { name: "ip", label: "IP 名单" },
  { name: "account", label: "账号名单" },
];

const activeMainMeta = computed(() => mainTabs.find((item) => item.name === activeMainTab.value) ?? mainTabs[0]);

const currentSectionLoading = computed(() => {
  if (activeMainTab.value === "overview") return overviewLoading.value;
  if (activeMainTab.value === "hotreload") return hotReloadLoading.value;
  if (activeMainTab.value === "ratelimit") return globalLoading.value || rateLoading.value;
  return false;
});

const currentRateMeta = computed(() => {
  const map: Record<RateDimension, { title: string; description: string; target: string }> = {
    interface: {
      title: "接口规则",
      description: "按 context-path 去除后的请求路径匹配，例如 /v2/user/page",
      target: "请输入接口路径，如 /v2/user/page",
    },
    ip: {
      title: "IP 规则",
      description: "对精确 IP 单独设置访问频率",
      target: "请输入精确 IP，如 192.168.1.10",
    },
    account: {
      title: "账号规则",
      description: "对精确登录账号单独设置访问频率",
      target: "请输入登录账号",
    },
  };
  return map[rateTab.value];
});

/* ==================== 热更新配置 ==================== */
const hotReloadList = ref<HotReloadConfig[]>([]);
const hotReloadLoading = ref(false);
const hotReloading = ref(false);
const globalDialogVisible = ref(false);
const hotReloadInfo = ref<{ enabledCount: number; reloadTime: string } | null>(null);

async function handleApplyGlobalAndClose(): Promise<void> {
  if (await handleApplyGlobal()) {
    globalDialogVisible.value = false;
  }
}

async function handleHotReload(): Promise<void> {
  if (hotReloading.value) return;
  hotReloading.value = true;
  try {
    const res = await reloadHotReload();
    hotReloadInfo.value = {
      enabledCount: res.data?.enabledCount ?? 0,
      reloadTime: res.data?.reloadTime ?? new Date().toLocaleTimeString(),
    };
    ElMessage.success(`热重载完成，已加载 ${hotReloadInfo.value.enabledCount} 项启用配置`);
    await loadHotReload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "热重载失败");
  } finally {
    hotReloading.value = false;
  }
}

const hrDialogVisible = ref(false);
const hrSaving = ref(false);
const hrIsEdit = ref(false);
const hrForm = ref<HotReloadConfig>({});

async function loadHotReload(): Promise<void> {
  hotReloadLoading.value = true;
  try {
    const res = await listHotReload();
    hotReloadList.value = res.data ?? [];
    loadedMainTabs.value.hotreload = true;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "热更新配置加载失败");
  } finally {
    hotReloadLoading.value = false;
  }
}

function handleHrAdd(): void {
  hrIsEdit.value = false;
  hrForm.value = {
    sysSettingValueType: "string",
    sysSettingStatus: 1,
  };
  hrDialogVisible.value = true;
}

function handleHrEdit(row: HotReloadConfig): void {
  hrIsEdit.value = true;
  hrForm.value = { ...row };
  hrDialogVisible.value = true;
}

function validateHotReloadValue(value: string | undefined, type: string | undefined): string | null {
  const raw = value ?? "";
  if (type === "number" && !Number.isFinite(Number(raw))) return "配置值必须是有效数字";
  if (type === "boolean" && !["true", "false"].includes(raw)) return "配置值必须是 true 或 false";
  if (type === "json") {
    try {
      JSON.parse(raw);
    } catch {
      return "配置值必须是有效 JSON";
    }
  }
  return null;
}

async function handleHrSubmit(): Promise<void> {
  const name = hrForm.value.sysSettingName?.trim() ?? "";
  const code = hrForm.value.sysSettingCode?.trim() ?? "";
  if (!name || !code) {
    ElMessage.warning("请填写配置名称和编码");
    return;
  }
  if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(code)) {
    ElMessage.warning("配置编码仅支持字母、数字、点、横线与下划线，且必须以字母开头");
    return;
  }
  const valueError = validateHotReloadValue(hrForm.value.sysSettingValue, hrForm.value.sysSettingValueType);
  if (valueError) {
    ElMessage.warning(valueError);
    return;
  }

  hrSaving.value = true;
  try {
    const res = await saveHotReload({
      ...hrForm.value,
      sysSettingName: name,
      sysSettingCode: code,
    });
    if (res.data === false) throw new Error("配置未保存，请检查配置编码是否重复");
    ElMessage.success(hrIsEdit.value ? "热更新配置已更新" : "热更新配置已创建");
    hrDialogVisible.value = false;
    await loadHotReload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  } finally {
    hrSaving.value = false;
  }
}

const hrColumns: ReTableColumn[] = [
  { prop: "sysSettingName", label: "配置名称", minWidth: 150 },
  { prop: "sysSettingCode", label: "配置编码", minWidth: 180, showOverflowTooltip: true },
  { prop: "sysSettingValue", label: "配置值", minWidth: 180, slot: "value", showOverflowTooltip: true },
  { prop: "sysSettingValueType", label: "类型", width: 100, slot: "type", align: "center" },
  { prop: "sysSettingRemark", label: "备注", minWidth: 160, showOverflowTooltip: true },
  { prop: "action", label: "操作", width: 110, slot: "action", fixed: "right", align: "center" },
];

/* ==================== 灰度配置 ==================== */
const grayTableRef = ref<TableReloadRef>();
const grayList = ref<PolicyConfig[]>([]);
const grayLoading = ref(false);
const grayTotal = ref(0);
const grayToggleLoadingId = ref<number | null>(null);
const grayDeleteLoadingId = ref<number | null>(null);
const grayDialogVisible = ref(false);
const graySaving = ref(false);
const grayIsEdit = ref(false);
const grayForm = ref<PolicyConfig>({});
const grayQuery = ref({ page: 1, pageSize: 10, bizKey: "" });

/** 灰度配置列 */
const grayColumns: ReTableColumn[] = [
  { prop: "bizKey", label: "灰度键", minWidth: 200, showOverflowTooltip: true },
  { prop: "weight", label: "权重%", width: 100, align: "center" },
  { prop: "config", label: "命中策略(JSON)", minWidth: 240, showOverflowTooltip: true },
  { prop: "status", label: "状态", width: 100, slot: "status", align: "center" },
  { prop: "remark", label: "备注", minWidth: 160, showOverflowTooltip: true },
  { prop: "action", label: "操作", width: 190, slot: "action", fixed: "right", align: "center" },
];

/**
 * 加载灰度配置分页
 *
 * <p>同 {@link loadFeature}：必须是 {@link ReTable} loader 契约，返回分页结果并使用传入的
 * page/pageSize，否则表格空白。</p>
 */
async function loadGray(params?: ReTableLoadParams): Promise<RePageResult> {
  grayLoading.value = true;
  try {
    const res = await pagePolicyConfig({
      type: "GRAY",
      page: params?.page ?? grayQuery.value.page,
      pageSize: params?.pageSize ?? grayQuery.value.pageSize,
      bizKey: grayQuery.value.bizKey || undefined,
    });
    const records = (res.data?.records ?? []) as PolicyConfig[];
    grayList.value = records;
    grayTotal.value = res.data?.total ?? 0;
    return { total: res.data?.total ?? 0, data: records as Record<string, unknown>[] };
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "灰度配置加载失败");
    throw error;
  } finally {
    grayLoading.value = false;
  }
}

/** 打开新增灰度弹窗 */
function handleGrayAdd(): void {
  grayIsEdit.value = false;
  grayForm.value = { type: "GRAY", dimension: "", listType: 0, status: 1, weight: 10, config: "{}", sort: 0 };
  grayDialogVisible.value = true;
}

/** 打开编辑灰度弹窗 */
function handleGrayEdit(row: PolicyConfig): void {
  grayIsEdit.value = true;
  grayForm.value = { ...row };
  grayDialogVisible.value = true;
}

/** 保存灰度配置 */
async function handleGraySubmit(): Promise<void> {
  if (!grayForm.value.bizKey) {
    ElMessage.warning("请填写灰度键");
    return;
  }
  if (grayForm.value.config) {
    try {
      JSON.parse(grayForm.value.config);
    } catch {
      ElMessage.warning("命中策略必须是合法 JSON");
      return;
    }
  }
  graySaving.value = true;
  try {
    if (grayIsEdit.value) {
      await updatePolicyConfig(grayForm.value);
      ElMessage.success("灰度配置已更新");
    } else {
      await savePolicyConfig(grayForm.value);
      ElMessage.success("灰度配置已创建");
    }
    grayDialogVisible.value = false;
    // 走 ReTable 实例 reload()，与 IP 名单表一致；直接调 loadGray() 不会让表格重绘
    await grayTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  } finally {
    graySaving.value = false;
  }
}

/** 切换灰度启停 */
async function handleGrayToggle(row: PolicyConfig, value: boolean | string | number): Promise<void> {
  if (row.sysPolicyConfigId == null) return;
  grayToggleLoadingId.value = row.sysPolicyConfigId;
  try {
    await togglePolicyConfig(row.sysPolicyConfigId, value ? 1 : 0);
    ElMessage.success(value ? "已启用" : "已停用");
    await grayTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "切换失败");
  } finally {
    grayToggleLoadingId.value = null;
  }
}

/** 删除灰度配置 */
async function handleGrayDelete(row: PolicyConfig): Promise<void> {
  if (row.sysPolicyConfigId == null) return;
  try {
    await ElMessageBox.confirm(`确认删除灰度配置「${row.bizKey}」？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  grayDeleteLoadingId.value = row.sysPolicyConfigId;
  try {
    await deletePolicyConfig(row.sysPolicyConfigId);
    ElMessage.success("已删除");
    await loadGray();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "删除失败");
  } finally {
    grayDeleteLoadingId.value = null;
  }
}

/* ==================== 功能开关 ==================== */
const featureTableRef = ref<TableReloadRef>();
const featureList = ref<PolicyConfig[]>([]);
const featureLoading = ref(false);
const featureTotal = ref(0);
const featureToggleLoadingId = ref<number | null>(null);
const featureDeleteLoadingId = ref<number | null>(null);
const registeredFeatures = ref<string[]>([]);
const featureDialogVisible = ref(false);
const featureSaving = ref(false);
const featureIsEdit = ref(false);
const featureForm = ref<PolicyConfig>({});
const featureQuery = ref({ page: 1, pageSize: 10, bizKey: "" });

/** 功能开关列 */
const featureColumns: ReTableColumn[] = [
  { prop: "bizKey", label: "功能键", minWidth: 220, showOverflowTooltip: true },
  { prop: "registered", label: "注解是否注册", width: 140, slot: "registered", align: "center" },
  { prop: "status", label: "开关", width: 110, slot: "status", align: "center" },
  { prop: "remark", label: "备注", minWidth: 180, showOverflowTooltip: true },
  { prop: "action", label: "操作", width: 150, slot: "action", fixed: "right", align: "center" },
];

/**
 * 加载功能开关分页 + 框架侧已注册功能点
 *
 * <p>必须是 {@link ReTable} 的 loader 契约：接收 `ReTableLoadParams`、用<b>传入的</b>
 * page/pageSize（不是本地 ref，否则 ReTable 内部翻页不生效）、<b>返回</b>分页结果。
 * 写成 `Promise&lt;void&gt;` + 往本地 ref 塞数据，表格会永远空白 ——
 * ReTable 只认 loader 的返回值，不读外部 ref。</p>
 */
async function loadFeature(params?: ReTableLoadParams): Promise<RePageResult> {
  featureLoading.value = true;
  try {
    const [pageRes, reg] = await Promise.all([
      pagePolicyConfig({
        type: "FEATURE",
        page: params?.page ?? featureQuery.value.page,
        pageSize: params?.pageSize ?? featureQuery.value.pageSize,
        bizKey: featureQuery.value.bizKey || undefined,
      }),
      listRegisteredFeatures(),
    ]);
    registeredFeatures.value = reg.data ?? [];
    featureTotal.value = pageRes.data?.total ?? 0;
    featureList.value = pageRes.data?.records ?? [];
    return {
      total: pageRes.data?.total ?? 0,
      data: (pageRes.data?.records ?? []) as Record<string, unknown>[],
    };
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "功能开关加载失败");
    throw error;
  } finally {
    featureLoading.value = false;
  }
}

/** 打开新增功能开关弹窗 */
function handleFeatureAdd(): void {
  featureIsEdit.value = false;
  featureForm.value = { type: "FEATURE", dimension: "", listType: 0, status: 1, sort: 0 };
  featureDialogVisible.value = true;
}

/** 打开编辑功能开关弹窗 */
function handleFeatureEdit(row: PolicyConfig): void {
  featureIsEdit.value = true;
  featureForm.value = { ...row };
  featureDialogVisible.value = true;
}

/** 保存功能开关 */
async function handleFeatureSubmit(): Promise<void> {
  if (!featureForm.value.bizKey) {
    ElMessage.warning("请填写功能键");
    return;
  }
  featureSaving.value = true;
  try {
    if (featureIsEdit.value) {
      await updatePolicyConfig(featureForm.value);
      ElMessage.success("功能开关已更新");
    } else {
      await savePolicyConfig(featureForm.value);
      ElMessage.success("功能开关已创建");
    }
    featureDialogVisible.value = false;
    await loadFeature();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  } finally {
    featureSaving.value = false;
  }
}

/** 切换功能开关 */
async function handleFeatureToggle(row: PolicyConfig, value: boolean | string | number): Promise<void> {
  if (row.sysPolicyConfigId == null) return;
  featureToggleLoadingId.value = row.sysPolicyConfigId;
  try {
    await togglePolicyConfig(row.sysPolicyConfigId, value ? 1 : 0);
    ElMessage.success(value ? "已开启" : "已关闭");
    await loadFeature();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "切换失败");
  } finally {
    featureToggleLoadingId.value = null;
  }
}

/** 删除功能开关 */
async function handleFeatureDelete(row: PolicyConfig): Promise<void> {
  if (row.sysPolicyConfigId == null) return;
  try {
    await ElMessageBox.confirm(`确认删除功能开关「${row.bizKey}」？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  featureDeleteLoadingId.value = row.sysPolicyConfigId;
  try {
    await deletePolicyConfig(row.sysPolicyConfigId);
    ElMessage.success("已删除");
    await loadFeature();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "删除失败");
  } finally {
    featureDeleteLoadingId.value = null;
  }
}

/** 功能键是否已在注解侧注册（未注册时在线开关不会生效，需给管理员提示） */
function isFeatureRegistered(bizKey?: string): boolean {
  return !!bizKey && registeredFeatures.value.includes(bizKey);
}

/* ==================== 接口停用 / 转发 ==================== */

/**
 * 路由管控视图的一行
 *
 * <p>这张表的<b>主语是路由</b>而不是策略：系统里每一条已注册路由都占一行，
 * 没配过策略的显示「放行」，配过的显示停用/转发及其详情。所以行 = 已注册路由
 * ∪ 仅有策略但路径不在注册表里的自定义行（见 {@link mergeApiRouteRows}）。</p>
 */
interface ApiRouteRow {
  /** 业务主键，等于策略的 bizKey，即应用内路径（不含 context-path） */
  path: string;
  /** HTTP 方法；自定义路径取不到，固定 "-" */
  method: string;
  /** 处理方法，形如 SysPolicyController#listFeatureStates */
  handler: string;
  /** 注册 key（`GET /v2/x`）；自定义路径为空 */
  key: string;
  /** 是否命中已注册路由表 */
  registered: boolean;
  /** 已配置策略时的主键；未配置为 undefined */
  policyId?: number;
  /** 生效中的动作；未配置视为 PASS */
  action: ApiRouteAction;
  /** 策略启用状态 0/1；未配置为 0 */
  status: number;
  /** 停用响应码 */
  statusCode?: number;
  /** 停用提示文案 */
  message?: string;
  /** 转发目标注册 key */
  targetKey?: string;
  /** 转发目标可读文本（含 handler） */
  targetText: string;
  /** 备注 */
  remark: string;
}

const routeTableRef = ref<TableReloadRef>();
const routeLoading = ref(false);
const routeTotal = ref(0);
const routeToggleLoadingId = ref<number | null>(null);
const routeDeleteLoadingId = ref<number | null>(null);
/** 已注册路由（转发目标候选，同时也是表格的行来源） */
const routeTargets = ref<RegisteredRoute[]>([]);
const routeTargetLoading = ref(false);
/** 全部 API_ROUTE 策略行（不分页，一次取完用于与路由表求并集） */
const routePolicies = ref<PolicyConfig[]>([]);
const routeIndexCount = ref(0);
const routeRefreshLoading = ref(false);
const routeDialogVisible = ref(false);
const routeSaving = ref(false);
const routeIsEdit = ref(false);
const routeForm = ref<PolicyConfig>({});
const routeRule = ref<ApiRouteRuleConfig>({ action: "DISABLE", status: 503 });
const routeQuery = ref({ page: 1, pageSize: 20, keyword: "" });

const routeActions: Array<{ label: string; value: ApiRouteAction }> = [
  { label: "停用（直接拒绝）", value: "DISABLE" },
  { label: "转发（换到另一个接口）", value: "FORWARD" },
];

/**
 * 停用响应码候选
 *
 * <p>给成下拉而不是自由输入：一是这类值只有寥寥几个语义档位，手打容易写出
 * 客户端无法处理的码；二是下拉能顺带把含义讲清楚（见 subtitle）。</p>
 */
const ROUTE_STATUS_OPTIONS: Array<{ value: number; label: string; hint: string }> = [
  { value: 503, label: "503 Service Unavailable", hint: "服务不可用。最常用的「临时停用」语义，客户端通常会重试或降级。" },
  { value: 502, label: "502 Bad Gateway", hint: "网关错误。适合表达「这个接口被摘掉了，上游拿不到」。" },
  { value: 500, label: "500 Internal Server Error", hint: "服务端错误。语义偏「内部异常」，停用接口用 500 容易和真实故障混淆。" },
  { value: 429, label: "429 Too Many Requests", hint: "限流。适合「不是停用，而是要压流量」的场景。" },
  { value: 403, label: "403 Forbidden", hint: "无权限。适合「接口还在，但当前调用方不许用」。" },
  { value: 404, label: "404 Not Found", hint: "不存在。适合对外隐藏某接口，不暴露它存在过。" },
  { value: 401, label: "401 Unauthorized", hint: "未认证。慎用：会与真实鉴权失败的排查混淆。" },
];

/** 当前响应码的说明文案（subtitle） */
const routeStatusHint = computed(
  () => ROUTE_STATUS_OPTIONS.find((o) => o.value === routeRule.value.status)?.hint ?? "自定义响应码，未在候选列表中。",
);

/** 接口管控列（表格布局用） */
const routeColumns: ReTableColumn[] = [
  { prop: "path", label: "接口路径", minWidth: 260, showOverflowTooltip: true },
  { prop: "method", label: "方法", width: 90, align: "center" },
  { prop: "handler", label: "处理方法", minWidth: 200, showOverflowTooltip: true },
  { prop: "actionText", label: "动作", width: 110, slot: "actionText", align: "center" },
  { prop: "targetText", label: "转发目标", minWidth: 220, showOverflowTooltip: true },
  { prop: "status", label: "生效", width: 100, slot: "status", align: "center" },
  { prop: "action", label: "操作", width: 190, slot: "action", fixed: "right", align: "center" },
];

/** 视图模式字段（默认布局是 view，所以这套是主要呈现） */
const routeViewFields: ReViewField[] = [
  { prop: "method", tag: true },
  { prop: "path", title: true },
  { prop: "handler", desc: true },
  { prop: "actionText", tag: true },
  { prop: "statusCodeText", label: "响应码" },
  { prop: "targetText", label: "转发目标" },
  { prop: "remark", label: "备注" },
];

const routeViewLayout: ReViewLayoutProps = {
  fields: routeViewFields,
  showIndex: true,
  minHeight: 76,
};

/** 解析一行规则，解析失败按放行展示，不让坏数据把页面白屏 */
function parseRouteRule(config?: string): ApiRouteRuleConfig {
  if (!config) return { action: "PASS" };
  try {
    // 不用 `{ action: "PASS", ...parsed }`：展开在后面会把前面的默认值整个盖掉，
    // TS 也会判成 TS2783（action 被指定两次）。默认值改成对解析结果兜底，语义一致且不报歧义。
    const parsed = JSON.parse(config) as ApiRouteRuleConfig;
    return { ...parsed, action: parsed.action ?? "PASS" };
  } catch {
    return { action: "PASS" };
  }
}

/** 动作中文 */
function actionTextOf(action: ApiRouteAction): string {
  if (action === "DISABLE") return "停用";
  if (action === "FORWARD") return "转发";
  return "放行";
}

/** 转发目标可读文本 */
function resolveTargetText(targetKey?: string): string {
  if (!targetKey) return "-";
  const hit = routeTargets.value.find((item) => item.key === targetKey);
  return hit ? `${hit.key}  (${hit.handler})` : targetKey;
}

/**
 * 求并集：已注册路由 ∪ 仅有策略的自定义路径
 *
 * <p>两个来源都要：只取注册路由会漏掉自定义路径写的策略（配了却看不见，
 * 管理员以为没生效）；只取策略又回到「只有配过的才显示」的老问题。
 * 以 {@code path} 为键合并，自定义行标记 {@code registered=false} 并在
 * handler 位置写明来源，避免「列表里这一行为什么没有处理方法」的疑问。</p>
 */
function mergeApiRouteRows(): ApiRouteRow[] {
  const byPath = new Map<string, ApiRouteRow>();
  for (const r of routeTargets.value) {
    byPath.set(r.path, {
      path: r.path,
      method: r.method,
      handler: r.handler,
      key: r.key,
      registered: true,
      action: "PASS",
      status: 0,
      targetText: "-",
      remark: "",
    });
  }
  for (const p of routePolicies.value) {
    const path = p.bizKey ?? "";
    if (!path) {
      continue;
    }
    const rule = parseRouteRule(p.config);
    const row: ApiRouteRow = byPath.get(path) ?? {
      path,
      method: "-",
      handler: "自定义路径（不在已注册路由中）",
      key: "",
      registered: false,
      action: "PASS",
      status: 0,
      targetText: "-",
      remark: "",
    };
    row.policyId = p.sysPolicyConfigId;
    row.action = rule.action;
    row.status = p.status ?? 0;
    row.statusCode = rule.status;
    row.message = rule.message;
    row.targetKey = rule.targetKey;
    row.targetText = rule.action === "FORWARD" ? resolveTargetText(rule.targetKey) : "-";
    row.remark = p.remark ?? "";
    byPath.set(path, row);
  }
  return [...byPath.values()];
}

/** 给表格/视图补上展示用的派生字段 */
function decorateApiRouteRow(row: ApiRouteRow): Record<string, unknown> {
  const configured = row.action !== "PASS";
  return {
    ...row,
    actionText: actionTextOf(row.action),
    statusCodeText: row.action === "DISABLE" && row.statusCode ? String(row.statusCode) : "-",
    configured,
    /** 视图/表格统一用的操作文案：没配过就是「配置」 */
    actionLabel: configured ? "编辑" : "配置",
  };
}

/**
 * 加载接口停用/转发分页 + 可选目标路由
 *
 * <p>同 {@link loadFeature}：必须返回 {@link RePageResult}，且用传入的 page/pageSize。</p>
 */
async function loadRoute(params?: ReTableLoadParams): Promise<RePageResult> {
  routeLoading.value = true;
  try {
    await Promise.all([loadRouteTargets(), loadRoutePolicies()]);
    const kw = routeQuery.value.keyword.trim().toLowerCase();
    let rows = mergeApiRouteRows();
    if (kw) {
      rows = rows.filter((r) =>
        [r.path, r.method, r.handler, r.key, r.remark].some((v) => String(v ?? "").toLowerCase().includes(kw)),
      );
    }
    const page = params?.page ?? routeQuery.value.page;
    const pageSize = params?.pageSize ?? routeQuery.value.pageSize;
    const total = rows.length;
    const slice = rows.slice((page - 1) * pageSize, page * pageSize).map(decorateApiRouteRow);
    routeTotal.value = total;
    return { total, data: slice as Record<string, unknown>[] };
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "接口管控加载失败");
    throw error;
  } finally {
    routeLoading.value = false;
  }
}

/**
 * 加载全部 API_ROUTE 策略行（不分页，用于与路由表求并集）
 */
async function loadRoutePolicies(): Promise<void> {
  const res = await pagePolicyConfig({ type: "API_ROUTE", page: 1, pageSize: 1000 });
  routePolicies.value = (res.data?.records ?? []) as PolicyConfig[];
}

/**
 * 加载已注册路由（一次取全量，不过滤）
 *
 * <p>keyword 过滤挪到 {@link loadRoute} 本地做：搜索框要和分页在<b>同一份</b>数据上联动，
 * 多打一次接口会出现「搜出来的条数」和「翻页翻到的内容」对不上的问题。</p>
 */
async function loadRouteTargets(): Promise<void> {
  routeTargetLoading.value = true;
  try {
    const res = await listApiRouteTargets();
    routeTargets.value = res.data ?? [];
    routeIndexCount.value = routeTargets.value.length;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "已注册路由加载失败");
  } finally {
    routeTargetLoading.value = false;
  }
}

/** 重新采集已注册路由并重载规则 */
async function handleRouteRefresh(): Promise<void> {
  routeRefreshLoading.value = true;
  try {
    const res = await refreshApiRoute();
    routeIndexCount.value = res.data?.routeCount ?? 0;
    // 同步进表：后端重采了路由索引，前端这张表必须重新取一次并重排
    await routeTableRef.value?.reload();
    ElMessage.success(`已同步到表：路由 ${res.data?.routeCount ?? 0} 条，规则 ${res.data?.policyCount ?? 0} 条`);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "重载失败");
  } finally {
    routeRefreshLoading.value = false;
  }
}

/** 关键词搜索（本地过滤，统一交给 loader） */
function handleRouteSearch(): void {
  routeQuery.value.page = 1;
  void routeTableRef.value?.reload();
}

/** 新增规则：路径留空，由用户自定义填写 */
function handleRouteAdd(): void {
  routeIsEdit.value = false;
  routeForm.value = { type: "API_ROUTE", dimension: "", listType: 0, status: 1, sort: 0 };
  routeRule.value = { action: "DISABLE", status: 503, message: "接口已停用，请稍后再试" };
  routeDialogVisible.value = true;
}

/**
 * 从行进入配置
 *
 * <p>未配过策略的路由也走这里：此时 {@code policyId} 为空，提交时按新增处理。
 * 所以「操作」列对「已配置」和「未配置」两类行是同一个入口，未配置时按钮文案是「配置」。</p>
 */
function handleRouteEdit(row: ApiRouteRow): void {
  const policy = row.policyId == null
    ? undefined
    : routePolicies.value.find((p) => p.sysPolicyConfigId === row.policyId);
  routeIsEdit.value = !!policy;
  routeForm.value = policy
    ? { ...policy }
    : { type: "API_ROUTE", dimension: "", listType: 0, status: 1, sort: 0, bizKey: row.path };
  routeRule.value = policy
    ? parseRouteRule(policy.config)
    : { action: "DISABLE", status: 503, message: "接口已停用，请稍后再试" };
  routeDialogVisible.value = true;
}

/**
 * 动作切换时补齐默认值
 *
 * <p>必须在这里把 {@code action} 本身写回去：单选组是 {@code :model-value} 单向绑定
 * （不是 v-model），emit 出来的 {@code update:model-value} 不会自动回写。
 * 只改 status/message/targetKey 而漏掉 action 的话，值永远停在 DISABLE，
 * v-if 不切换、单选框还会弹回停用 —— 编译和纯接口测试都发现不了。</p>
 */
function handleRouteActionChange(action: ApiRouteAction): void {
  routeRule.value.action = action;
  if (action === "FORWARD") {
    routeRule.value.status = undefined;
    routeRule.value.message = undefined;
    routeRule.value.targetKey = routeRule.value.targetKey || routeTargets.value[0]?.key;
  } else {
    routeRule.value.targetKey = undefined;
    routeRule.value.status = routeRule.value.status ?? 503;
    routeRule.value.message = routeRule.value.message ?? "接口已停用，请稍后再试";
  }
}

async function handleRouteSubmit(): Promise<void> {
  if (!routeForm.value.bizKey) {
    ElMessage.warning("请填写接口路径");
    return;
  }
  if (!routeForm.value.bizKey.startsWith("/")) {
    ElMessage.warning("接口路径必须以 / 开头");
    return;
  }
  if (routeRule.value.action === "FORWARD" && !routeRule.value.targetKey) {
    ElMessage.warning("请选择转发目标");
    return;
  }
  // 自定义路径是允许的（未注册的路径也能写规则），但要如实提示它的代价：
  // 停用/放行对未注册路径没有运行时意义，只有转发到别处才可能被人访问到。
  const known = routeTargets.value.some((r) => r.path === routeForm.value.bizKey);
  if (!known) {
    ElMessage.warning("该路径不在已注册路由中，规则会保存但不会对任何请求生效");
  }
  const payload: PolicyConfig = {
    ...routeForm.value,
    type: "API_ROUTE",
    listType: 0,
    config: JSON.stringify(routeRule.value),
  };
  routeSaving.value = true;
  try {
    if (routeIsEdit.value) {
      await updatePolicyConfig(payload);
      ElMessage.success("规则已更新");
    } else {
      await savePolicyConfig(payload);
      ElMessage.success("规则已创建");
    }
    routeDialogVisible.value = false;
    // 必须走 ReTable 实例的 reload()，不能直接调 loadRoute()：
    // 直接调只是重取数据并写回本地 ref，ReTable 不会因此重绘，
    // 表现为「保存成功但列表不刷新 / 切页后行消失」。与 IP 名单表保持同一机制。
    await routeTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  } finally {
    routeSaving.value = false;
  }
}

async function handleRouteToggle(row: ApiRouteRow, value: boolean | string | number): Promise<void> {
  if (row.policyId == null) {
    ElMessage.warning("该路由尚未配置策略，请先点「配置」");
    return;
  }
  routeToggleLoadingId.value = row.policyId;
  try {
    await togglePolicyConfig(row.policyId, value ? 1 : 0);
    ElMessage.success(value ? "已生效" : "已停用");
    await routeTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "切换失败");
  } finally {
    routeToggleLoadingId.value = null;
  }
}

async function handleRouteDelete(row: ApiRouteRow): Promise<void> {
  if (row.policyId == null) {
    ElMessage.warning("该路由没有配置过策略，无需删除");
    return;
  }
  try {
    await ElMessageBox.confirm(`确认删除「${row.path}」的停用/转发规则？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  routeDeleteLoadingId.value = row.policyId;
  try {
    await deletePolicyConfig(row.policyId);
    ElMessage.success("已删除");
    await routeTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "删除失败");
  } finally {
    routeDeleteLoadingId.value = null;
  }
}

/* ==================== 限流配置 ==================== */
const globalConfig = ref<RateLimitGlobal>({
  enabled: false,
  qps: 100,
  burstSize: 200,
  dimension: "global",
});
const globalLoading = ref(false);
const globalApplying = ref(false);
const rateList = ref<RateLimitRule[]>([]);
const rateLoading = ref(false);
const rateToggleLoadingId = ref<number | null>(null);
const rateDeleteLoadingId = ref<number | null>(null);

async function loadGlobal(): Promise<void> {
  globalLoading.value = true;
  try {
    const res = await getRateLimitGlobal();
    globalConfig.value = res.data ?? { enabled: false, qps: 100, burstSize: 200, dimension: "global" };
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "全局配置加载失败");
  } finally {
    globalLoading.value = false;
  }
}

async function loadRateList(): Promise<void> {
  rateLoading.value = true;
  try {
    const res = await listRateLimit(rateTab.value);
    rateList.value = res.data ?? [];
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "限流规则加载失败");
  } finally {
    rateLoading.value = false;
  }
}

async function loadRateWorkspace(): Promise<void> {
  loadedMainTabs.value.ratelimit = true;
  await Promise.all([loadGlobal(), loadRateList()]);
}

function validateRateValues(qps: number | undefined, burstSize: number | undefined): boolean {
  if (!Number.isInteger(qps) || (qps ?? 0) <= 0) {
    ElMessage.warning("QPS 必须是大于 0 的整数");
    return false;
  }
  if (!Number.isInteger(burstSize) || (burstSize ?? -1) < 0) {
    ElMessage.warning("突发参数必须是非负整数");
    return false;
  }
  return true;
}

async function handleApplyGlobal(): Promise<boolean> {
  if (globalApplying.value) return false;
  if (!validateRateValues(globalConfig.value.qps, globalConfig.value.burstSize)) return false;

  globalApplying.value = true;
  try {
    const res = await applyRateLimitGlobal({
      ...globalConfig.value,
      qps: Number(globalConfig.value.qps),
      burstSize: Number(globalConfig.value.burstSize),
      dimension: globalConfig.value.dimension || "global",
    });
    ElMessage.success(res.data || "全局配置已应用");
    await loadGlobal();
    return true;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "全局配置应用失败");
    return false;
  } finally {
    globalApplying.value = false;
  }
}

const rateDialogVisible = ref(false);
const rateSaving = ref(false);
const rateIsEdit = ref(false);
const rateForm = ref<RateLimitRule>({});

function handleRateAdd(): void {
  rateIsEdit.value = false;
  rateForm.value = {
    dimension: rateTab.value,
    enabled: 1,
    qps: 100,
    burstSize: 200,
  };
  rateDialogVisible.value = true;
}

function handleRateEdit(row: RateLimitRule): void {
  rateIsEdit.value = true;
  rateForm.value = { ...row, dimension: row.dimension ?? rateTab.value, enabled: row.enabled === 1 ? 1 : 0 };
  rateDialogVisible.value = true;
}

async function handleRateSubmit(): Promise<void> {
  const target = rateForm.value.target?.trim() ?? "";
  if (!target) {
    ElMessage.warning(currentRateMeta.value.target);
    return;
  }
  if (target.length > 500) {
    ElMessage.warning("规则目标不能超过 500 个字符");
    return;
  }
  if (!validateRateValues(rateForm.value.qps, rateForm.value.burstSize)) return;

  rateSaving.value = true;
  try {
    const payload: RateLimitRule = {
      ...rateForm.value,
      target,
      qps: Number(rateForm.value.qps),
      burstSize: Number(rateForm.value.burstSize),
      enabled: rateForm.value.enabled === 1 ? 1 : 0,
    };
    const res = rateIsEdit.value ? await updateRateLimit(payload) : await saveRateLimit(payload);
    if (!rateIsEdit.value && res.data === false) throw new Error("规则未创建");
    if (rateIsEdit.value && res.data === false) throw new Error("规则未更新，记录可能已被删除");
    ElMessage.success(rateIsEdit.value ? "限流规则已更新" : "限流规则已创建");
    rateDialogVisible.value = false;
    await loadRateList();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  } finally {
    rateSaving.value = false;
  }
}

async function handleRateToggle(row: RateLimitRule, value: unknown): Promise<void> {
  const id = row.sysRateLimitRuleId;
  if (id == null || rateToggleLoadingId.value != null) return;
  const enabled: 0 | 1 = value ? 1 : 0;
  rateToggleLoadingId.value = id;
  try {
    const res = await updateRateLimit({ ...row, enabled });
    if (res.data === false) throw new Error("规则状态未更新");
    ElMessage.success(enabled === 1 ? "规则已启用" : "规则已停用");
    await loadRateList();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "状态更新失败");
  } finally {
    rateToggleLoadingId.value = null;
  }
}

async function handleRateDelete(row: RateLimitRule): Promise<void> {
  const id = row.sysRateLimitRuleId;
  if (id == null || rateDeleteLoadingId.value != null) return;
  try {
    await ElMessageBox.confirm(`确认删除规则「${row.target ?? "-"}」？`, "删除限流规则", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  rateDeleteLoadingId.value = id;
  try {
    const res = await deleteRateLimit(id);
    if (res.data === false) throw new Error("规则未删除，记录可能已被删除");
    ElMessage.success("限流规则已删除");
    await loadRateList();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "删除失败");
  } finally {
    rateDeleteLoadingId.value = null;
  }
}

const rateColumns: ReTableColumn[] = [
  { prop: "target", label: "匹配目标", minWidth: 220, showOverflowTooltip: true },
  { prop: "qps", label: "QPS", width: 100, align: "center" },
  { prop: "burstSize", label: "突发参数", width: 110, align: "center" },
  { prop: "enabled", label: "运行状态", width: 110, slot: "status", align: "center" },
  { prop: "remark", label: "备注", minWidth: 160, showOverflowTooltip: true },
  { prop: "createTime", label: "创建时间", width: 170 },
  { prop: "action", label: "操作", width: 150, slot: "action", fixed: "right", align: "center" },
];

/* ==================== 黑白名单 ==================== */
const ipTableRef = ref<TableReloadRef | null>(null);
const accTableRef = ref<TableReloadRef | null>(null);
const ipQuery = ref<IpQuery>({ page: 1, pageSize: 10 });
const ipSearchModel = ref<IpSearchModel>({});
const accQuery = ref<AccountQuery>({ page: 1, pageSize: 10 });
const accSearchModel = ref<AccountSearchModel>({});

async function loadIps(params?: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForIp({
    page: params?.page ?? ipQuery.value.page,
    pageSize: params?.pageSize ?? ipQuery.value.pageSize,
    sysIpIp: ipQuery.value.sysIpIp,
    sysIpType: ipQuery.value.sysIpType,
    sysIpStatus: ipQuery.value.sysIpStatus,
  });
  // 注意：这里读 res.data.total / res.data.data 就是对的。
  // /v2/ip/page 原始响应确实多一层 {code:0,msg,data:{...}}，但 http 响应拦截器
  // （packages/core/src/httpCrypto.ts checkApiResponse）已把内层展平，
  // 业务侧拿到的是 {code:"00000", data:{total, data:[...]}}。
  // 别再手工多剥一层——那会把本来正确的读法改坏。
  return { total: res.data?.total ?? 0, data: (res.data?.data ?? []) as Record<string, unknown>[] };
}

async function loadAccounts(params?: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForAccountBw({
    page: params?.page ?? accQuery.value.page,
    pageSize: params?.pageSize ?? accQuery.value.pageSize,
    account: accQuery.value.account,
    type: accQuery.value.type,
    status: accQuery.value.status,
  });
  return { total: res.data?.total ?? 0, data: (res.data?.list ?? []) as Record<string, unknown>[] };
}

function handleIpSearch(): void {
  ipQuery.value = {
    page: 1,
    pageSize: ipQuery.value.pageSize,
    sysIpIp: ipSearchModel.value.sysIpIp?.trim() || undefined,
    sysIpType: ipSearchModel.value.sysIpType,
    sysIpStatus: ipSearchModel.value.sysIpStatus,
  };
}

function handleIpReset(): void {
  ipSearchModel.value = {};
  ipQuery.value = { page: 1, pageSize: 10 };
}

function handleAccSearch(): void {
  accQuery.value = {
    page: 1,
    pageSize: accQuery.value.pageSize,
    account: accSearchModel.value.account?.trim() || undefined,
    type: accSearchModel.value.type,
    status: accSearchModel.value.status,
  };
}

function handleAccReset(): void {
  accSearchModel.value = {};
  accQuery.value = { page: 1, pageSize: 10 };
}

const ipSearchFilters = [
  { key: "sysIpIp", label: "IP / CIDR", type: "input" as const, placeholder: "如 192.168.1.0/24" },
  {
    key: "sysIpType",
    label: "名单类型",
    type: "select" as const,
    placeholder: "全部",
    options: [
      { label: "白名单", value: 0 },
      { label: "黑名单", value: 1 },
    ],
  },
  {
    key: "sysIpStatus",
    label: "状态",
    type: "select" as const,
    placeholder: "全部",
    options: [
      { label: "启用", value: 0 },
      { label: "禁用", value: 1 },
    ],
  },
];

const accSearchFilters = [
  { key: "account", label: "账号", type: "input" as const, placeholder: "请输入账号" },
  {
    key: "type",
    label: "名单类型",
    type: "select" as const,
    placeholder: "全部",
    options: [
      { label: "黑名单", value: 1 },
      { label: "白名单", value: 2 },
    ],
  },
  {
    key: "status",
    label: "状态",
    type: "select" as const,
    placeholder: "全部",
    options: [
      { label: "启用", value: 1 },
      { label: "禁用", value: 0 },
    ],
  },
];

const ipDialogVisible = ref(false);
const ipSaving = ref(false);
const ipIsEdit = ref(false);
const ipDeleteLoadingId = ref<number | null>(null);
const ipForm = ref<SysIpBlackwhite>({});

function handleIpAdd(): void {
  ipIsEdit.value = false;
  ipForm.value = {
    sysIpType: ipQuery.value.sysIpType ?? 1,
    sysIpStatus: ipQuery.value.sysIpStatus ?? 0,
  };
  ipDialogVisible.value = true;
}

function handleIpEdit(row: Record<string, unknown>): void {
  ipIsEdit.value = true;
  ipForm.value = { ...(row as SysIpBlackwhite) };
  ipDialogVisible.value = true;
}

function validIpv4(value: string): boolean {
  return value.split(".").length === 4 && value.split(".").every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const number = Number(part);
    return number >= 0 && number <= 255;
  });
}

function validIpRule(value: string): boolean {
  const [address, prefix = "32"] = value.split("/");
  if (!validIpv4(address)) return false;
  return /^\d{1,2}$/.test(prefix) && Number(prefix) >= 0 && Number(prefix) <= 32;
}

async function handleIpSubmit(): Promise<void> {
  const address = ipForm.value.sysIpIp?.trim() ?? "";
  if (!address) {
    ElMessage.warning("请输入 IP 地址或 CIDR");
    return;
  }
  if (!validIpRule(address)) {
    ElMessage.warning("请输入有效 IPv4 或 IPv4 CIDR，例如 192.168.1.0/24");
    return;
  }

  ipSaving.value = true;
  try {
    const payload: SysIpBlackwhite = { ...ipForm.value, sysIpIp: address };
    const res = ipIsEdit.value ? await updateIp(payload) : await saveIp(payload);
    if (ipIsEdit.value && res.data === false) throw new Error("IP 规则未更新，记录可能已被删除");
    ElMessage.success(ipIsEdit.value ? "IP 规则已更新" : "IP 规则已创建");
    ipDialogVisible.value = false;
    await ipTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  } finally {
    ipSaving.value = false;
  }
}

async function handleIpDelete(row: Record<string, unknown>): Promise<void> {
  const ip = row as SysIpBlackwhite;
  if (ip.sysIpId == null || ipDeleteLoadingId.value != null) return;
  try {
    await ElMessageBox.confirm(`确认删除 IP 规则「${ip.sysIpIp ?? "-"}」？`, "删除 IP 规则", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  ipDeleteLoadingId.value = ip.sysIpId;
  try {
    const res = await deleteIp(ip.sysIpId);
    if (res.data === false) throw new Error("IP 规则未删除，记录可能已被删除");
    ElMessage.success("IP 规则已删除");
    await ipTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "删除失败");
  } finally {
    ipDeleteLoadingId.value = null;
  }
}

const ipColumns: ReTableColumn[] = [
  { prop: "sysIpIp", label: "IP / CIDR", minWidth: 220 },
  { prop: "sysIpType", label: "名单类型", width: 110, slot: "type", align: "center" },
  { prop: "sysIpStatus", label: "状态", width: 100, slot: "status", align: "center" },
  { prop: "sysIpRemark", label: "备注", minWidth: 320, showOverflowTooltip: true },
  { prop: "createTime", label: "创建时间", minWidth: 180 },
  { prop: "action", label: "操作", width: 150, slot: "action", fixed: "right", align: "center" },
];

const accDialogVisible = ref(false);
const accSaving = ref(false);
const accIsEdit = ref(false);
const accDeleteLoadingId = ref<number | null>(null);
const accForm = ref<AccountBlackwhite>({});

function handleAccAdd(): void {
  accIsEdit.value = false;
  accForm.value = { type: accQuery.value.type ?? 1, status: accQuery.value.status ?? 1 };
  accDialogVisible.value = true;
}

function handleAccEdit(row: Record<string, unknown>): void {
  accIsEdit.value = true;
  accForm.value = { ...(row as AccountBlackwhite) };
  accDialogVisible.value = true;
}

async function handleAccSubmit(): Promise<void> {
  const account = accForm.value.account?.trim() ?? "";
  if (!account) {
    ElMessage.warning("请输入账号");
    return;
  }
  if (account.length > 100) {
    ElMessage.warning("账号不能超过 100 个字符");
    return;
  }
  if (accForm.value.type !== 1 && accForm.value.type !== 2) {
    ElMessage.warning("请选择名单类型");
    return;
  }
  if (accForm.value.status !== 0 && accForm.value.status !== 1) {
    ElMessage.warning("请选择状态");
    return;
  }

  accSaving.value = true;
  try {
    const payload: AccountBlackwhite = { ...accForm.value, account };
    const res = accIsEdit.value ? await updateAccountBw(payload) : await saveAccountBw(payload);
    if (accIsEdit.value && res.data === false) throw new Error("账号规则未更新，记录可能已被删除");
    ElMessage.success(accIsEdit.value ? "账号规则已更新" : "账号规则已创建");
    accDialogVisible.value = false;
    await accTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  } finally {
    accSaving.value = false;
  }
}

async function handleAccDelete(row: Record<string, unknown>): Promise<void> {
  const account = row as AccountBlackwhite;
  if (account.sysAccountBwId == null || accDeleteLoadingId.value != null) return;
  try {
    await ElMessageBox.confirm(`确认删除账号规则「${account.account ?? "-"}」？`, "删除账号规则", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  accDeleteLoadingId.value = account.sysAccountBwId;
  try {
    const res = await deleteAccountBw(account.sysAccountBwId);
    if (res.data === false) throw new Error("账号规则未删除，记录可能已被删除");
    ElMessage.success("账号规则已删除");
    await accTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "删除失败");
  } finally {
    accDeleteLoadingId.value = null;
  }
}

const accColumns: ReTableColumn[] = [
  { prop: "account", label: "账号", minWidth: 240 },
  { prop: "type", label: "名单类型", width: 110, slot: "type", align: "center" },
  { prop: "status", label: "状态", width: 100, slot: "status", align: "center" },
  { prop: "remark", label: "备注", minWidth: 320, showOverflowTooltip: true },
  { prop: "createTime", label: "创建时间", minWidth: 180 },
  { prop: "action", label: "操作", width: 150, slot: "action", fixed: "right", align: "center" },
];

const overviewLoading = ref(false);
const overview = ref({
  hotReloadTotal: 0,
  rateTotal: 0,
  rateEnabled: 0,
  ipTotal: 0,
  accountTotal: 0,
});

/** 总览只读统计：不改变当前工作区数据，加载失败按 0 展示。 */
async function loadOverview(): Promise<void> {
  overviewLoading.value = true;
  const [hot, interfaceRules, ipRules, accountRules, ipPage, accountPage] = await Promise.allSettled([
    listHotReload(),
    listRateLimit("interface"),
    listRateLimit("ip"),
    listRateLimit("account"),
    pageForIp({ page: 1, pageSize: 1 }),
    pageForAccountBw({ page: 1, pageSize: 1 }),
  ]);
  const rules = [interfaceRules, ipRules, accountRules]
    .filter((item) => item.status === "fulfilled")
    .flatMap((item) => (item.status === "fulfilled" ? item.value.data ?? [] : []));
  overview.value = {
    hotReloadTotal: hot.status === "fulfilled" ? hot.value.data?.length ?? 0 : 0,
    rateTotal: rules.length,
    rateEnabled: rules.filter((rule) => rule.enabled === 1).length,
    // 读 data.total 即可：http 响应拦截器已展平 ReturnPageResult 的内层
    ipTotal: ipPage.status === "fulfilled" ? ipPage.value.data?.total ?? 0 : 0,
    accountTotal: accountPage.status === "fulfilled" ? accountPage.value.data?.total ?? 0 : 0,
  };
  overviewLoading.value = false;
}

const overviewMetrics = computed(() => [
  { key: "hotreload", label: "热更新配置", value: overview.value.hotReloadTotal, unit: "项", tone: "primary" },
  { key: "ratelimit", label: "限流规则", value: overview.value.rateTotal, unit: "条", tone: "warning" },
  { key: "blackwhite", label: "访问名单", value: overview.value.ipTotal + overview.value.accountTotal, unit: "条", tone: "success" },
  { key: "overview", label: "运行链路", value: 4, unit: "级", tone: "info" },
]);

function isBlackWhiteLoaded(): void {
  loadedMainTabs.value.blackwhite = true;
}

async function refreshCurrentSection(): Promise<void> {
  if (activeMainTab.value === "overview") {
    await loadOverview();
    return;
  }
  if (activeMainTab.value === "hotreload") {
    await loadHotReload();
    return;
  }
  if (activeMainTab.value === "ratelimit") {
    await loadRateWorkspace();
    return;
  }
  if (bwTab.value === "ip") await ipTableRef.value?.reload();
  else await accTableRef.value?.reload();
}

async function handleMainTabChange(name: string): Promise<void> {
  const tab = name as MainTabName;
  activeMainTab.value = tab;
  if (tab === "overview") {
    await loadOverview();
    return;
  }
  if (tab === "ratelimit" && !loadedMainTabs.value.ratelimit) {
    await loadRateWorkspace();
  }
  if (tab === "gray" && !loadedMainTabs.value.gray) {
    loadedMainTabs.value.gray = true;
    await loadGray();
  }
  if (tab === "feature" && !loadedMainTabs.value.feature) {
    loadedMainTabs.value.feature = true;
    await loadFeature();
  }
  if (tab === "route" && !loadedMainTabs.value.route) {
    loadedMainTabs.value.route = true;
    await loadRoute();
  }
}

function handleRateTabChange(): void {
  void loadRateList();
}

onMounted(() => {
  void Promise.allSettled([loadHotReload(), loadOverview()]);
});
</script>

<template>
  <div class="system-page policy-console koi-flex">
    <section class="policy-hero">
      <div class="policy-hero__copy">
        <div class="policy-hero__title">策略任务</div>
        <div class="policy-hero__subtitle">从配置发布、流量保护到访问名单，统一管理应用运行时策略</div>
      </div>
      <div class="policy-hero__actions">
        <span class="policy-hero__sync"><i />运行链路正常</span>
        <ReButton
          layout="square"
          icon="Refresh"
          :loading="currentSectionLoading"
          @click="refreshCurrentSection"
        >
          刷新
        </ReButton>
      </div>
    </section>

    <div class="policy-metrics">
      <button
        v-for="metric in overviewMetrics"
        :key="metric.key"
        type="button"
        class="policy-metric"
        :class="`is-${metric.tone}`"
        @click="handleMainTabChange(metric.key)"
      >
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}<small>{{ metric.unit }}</small></strong>
        <em>进入配置 →</em>
      </button>
    </div>

    <div class="policy-shell">
      <nav class="policy-nav" aria-label="策略任务导航">
        <span class="policy-nav__label">策略工作区</span>
        <button
          v-for="(item, index) in mainTabs"
          :key="item.name"
          type="button"
          class="policy-nav__item"
          :class="{ 'is-active': activeMainTab === item.name }"
          @click="handleMainTabChange(item.name)"
        >
          <span class="policy-nav__index">0{{ index + 1 }}</span>
          <span class="policy-nav__body">
            <b>{{ item.label }}</b>
            <small>{{ item.caption }}</small>
          </span>
          <ReIcon :name="item.icon" size="18" class="policy-nav__icon" />
        </button>
        <div class="policy-nav__foot">
          <span>当前</span>
          <b>{{ activeMainMeta.label }}</b>
        </div>
      </nav>

      <main class="policy-content">
        <!-- 总览 -->
        <section v-if="activeMainTab === 'overview'" class="policy-view">
          <div class="policy-view__head">
            <div>
              <span class="policy-section__eyebrow">POLICY PIPELINE</span>
              <h2>运行链路</h2>
              <p>策略按“配置 → 限流 → 名单”顺序生效，黑名单始终优先于白名单豁免。</p>
            </div>
            <ReButton layout="modern" icon="Refresh" :loading="overviewLoading" @click="loadOverview">
              刷新统计
            </ReButton>
          </div>

          <div class="policy-pipeline">
            <button type="button" class="policy-node is-primary" @click="handleMainTabChange('hotreload')">
              <span class="policy-node__step">01</span>
              <ReIcon name="Setting" size="20" />
              <b>热更新发布</b>
              <small>{{ overview.hotReloadTotal }} 项运行配置</small>
            </button>
            <span class="policy-pipeline__link" />
            <button type="button" class="policy-node is-warning" @click="handleMainTabChange('ratelimit')">
              <span class="policy-node__step">02</span>
              <ReIcon name="Stopwatch" size="20" />
              <b>流量限流</b>
              <small>{{ overview.rateEnabled }}/{{ overview.rateTotal }} 条已启用</small>
            </button>
            <span class="policy-pipeline__link" />
            <button type="button" class="policy-node is-success" @click="handleMainTabChange('blackwhite')">
              <span class="policy-node__step">03</span>
              <ReIcon name="User" size="20" />
              <b>访问名单</b>
              <small>{{ overview.ipTotal + overview.accountTotal }} 条黑白名单</small>
            </button>
            <span class="policy-pipeline__link" />
            <div class="policy-node is-terminal">
              <span class="policy-node__step">04</span>
              <ReIcon name="CircleCheck" size="20" />
              <b>请求放行 / 拦截</b>
              <small>白名单绕过限流</small>
            </div>
          </div>

          <div class="policy-overview-grid">
            <article class="policy-overview-card">
              <span class="policy-overview-card__icon is-warning"><el-icon :size="18"><Stopwatch /></el-icon></span>
              <div>
                <b>限流执行口径</b>
                <p>规则命中后使用 QPS 令牌桶；突发参数当前仅保存配置，不参与令牌桶容量计算。</p>
              </div>
              <ReButton layout="modern" @click="handleMainTabChange('ratelimit')">管理规则</ReButton>
            </article>
            <article class="policy-overview-card">
              <span class="policy-overview-card__icon is-primary"><el-icon :size="18"><Setting /></el-icon></span>
              <div>
                <b>热更新发布边界</b>
                <p>保存后定向清理设置缓存并发布变更事件，只有显式声明的运行时消费者才会执行。</p>
              </div>
              <ReButton layout="modern" @click="handleMainTabChange('hotreload')">管理配置</ReButton>
            </article>
            <article class="policy-overview-card">
              <span class="policy-overview-card__icon is-success"><el-icon :size="18"><User /></el-icon></span>
              <div>
                <b>名单优先级</b>
                <p>IP 或账号命中黑名单立即拒绝，白名单不能覆盖黑名单。白名单是「放行豁免」不是准入名单：该 IP 跳过限流，未列入任何名单的 IP 仍默认放行。</p>
              </div>
              <ReButton layout="modern" @click="handleMainTabChange('blackwhite')">管理名单</ReButton>
            </article>
          </div>
        </section>

        <!-- 热更新 -->
        <section v-else-if="activeMainTab === 'hotreload'" class="policy-view">
          <div class="policy-view__head">
            <div>
              <span class="policy-section__eyebrow">HOT RELOAD</span>
              <h2>热更新配置</h2>
              <p>维护 <code>hot_reload</code> 分组的运行时设置，带 ID 保存为更新，无 ID 保存为新增。</p>
            </div>
            <div class="policy-head-actions">
              <ReButton
                layout="modern"
                icon="Refresh"
                :loading="hotReloading"
                @click="handleHotReload"
              >
                立即热重载
              </ReButton>
              <ReButton layout="modern" type="primary" icon="Plus" @click="handleHrAdd">新增配置</ReButton>
            </div>
          </div>

          <div class="policy-contract">
            <div class="policy-contract__icon"><el-icon :size="18"><InfoFilled /></el-icon></div>
            <div>
              <b>发布契约</b>
              <span>
                支持 string / number / boolean / json；事务提交后清理 hot_reload 缓存并通过 AOP 读取最新值。
                <template v-if="hotReloadInfo">
                  最近重载 {{ hotReloadInfo.reloadTime }} · 启用 {{ hotReloadInfo.enabledCount }} 项
                </template>
              </span>
            </div>
            <ReTag effect="plain" round size="small">POST /v2/policy/hotreload/reload</ReTag>
          </div>

          <ReTable
            :data="hotReloadList"
            :columns="hrColumns"
            :loading="hotReloadLoading"
            :pagination="false"
            :toolbar-config="TABLE_TOOLBAR"
            row-key="sysSettingId"
            empty-text="暂无热更新配置"
          >
            <template #value="{ row }">
              <code class="policy-value">{{ (row as HotReloadConfig).sysSettingValue || "-" }}</code>
            </template>
            <template #type="{ row }">
              <ReTag effect="light" round size="small">{{ (row as HotReloadConfig).sysSettingValueType || "string" }}</ReTag>
            </template>
            <template #action="{ row }">
              <ReButton layout="square" type="primary" icon="Edit" @click="handleHrEdit(row as HotReloadConfig)">编辑 {{ rowKeyOf(row) }}</ReButton>
            </template>
          </ReTable>
        </section>

        <!-- 限流 -->
        <section v-else-if="activeMainTab === 'ratelimit'" class="policy-view">
          <div class="policy-view__head">
            <div>
              <span class="policy-section__eyebrow">TRAFFIC CONTROL</span>
              <h2>限流策略</h2>
              <p>按接口、IP、账号维护精确规则；全局参数通过右上角入口单独配置。</p>
            </div>
            <div class="policy-head-actions">
              <button
                type="button"
                class="policy-global-trigger"
                :class="{ 'is-on': globalConfig.enabled }"
                :aria-label="`全局限流配置，当前${globalConfig.enabled ? '已开启' : '已关闭'}`"
                @click="globalDialogVisible = true"
              >
                <el-icon :size="18"><Setting /></el-icon>
                <span class="policy-global-trigger__body">
                  <small>全局限流</small>
                  <b>{{ globalConfig.enabled ? '已开启' : '已关闭' }}</b>
                </span>
                <span class="policy-global-trigger__meta">QPS {{ globalConfig.qps ?? '—' }}</span>
              </button>
            </div>
          </div>

          <ReTab
            v-model="rateTab"
            :tabs="rateTabs"
            variant="capsule"
            nav-only
            class="policy-subnav"
            @tab-change="handleRateTabChange"
          />

          <div class="policy-list-head">
            <div>
              <h3>{{ currentRateMeta.title }}</h3>
              <p>{{ currentRateMeta.description }}</p>
            </div>
            <ReButton layout="modern" type="primary" icon="Plus" @click="handleRateAdd">新增规则</ReButton>
          </div>

          <ReTable
            :data="rateList"
            :columns="rateColumns"
            :loading="rateLoading"
            :pagination="false"
            :toolbar-config="TABLE_TOOLBAR"
            row-key="sysRateLimitRuleId"
            :empty-text="`暂无${currentRateMeta.title}`"
          >
            <template #status="{ row }">
              <ReSwitch
                layout="square"
                :model-value="(row as RateLimitRule).enabled === 1"
                :disabled="rateToggleLoadingId === (row as RateLimitRule).sysRateLimitRuleId"
                :aria-label="`启用规则 ${(row as RateLimitRule).target ?? ''}`"
                @update:model-value="(value: boolean | string | number) => handleRateToggle(row as RateLimitRule, value)"
              />
            </template>
            <template #action="{ row }">
              <ReButton layout="square" type="primary" icon="Edit" @click="handleRateEdit(row as RateLimitRule)">编辑 {{ rowKeyOf(row) }}</ReButton>
              <ReButton
                layout="square"
                type="danger"
                icon="Delete"
                :loading="rateDeleteLoadingId === (row as RateLimitRule).sysRateLimitRuleId"
                @click="handleRateDelete(row as RateLimitRule)"
              >
                删除 {{ rowKeyOf(row) }}
              </ReButton>
            </template>
          </ReTable>
        </section>

        <!-- 黑白名单。用显式 v-else-if 而非 v-else：v-else 后面不能再挂 v-else-if，
             留出位置给后面的灰度/功能开关分支 -->
        <section v-else-if="activeMainTab === 'blackwhite'" class="policy-view">
          <div class="policy-view__head">
            <div>
              <span class="policy-section__eyebrow">ACCESS CONTROL</span>
              <h2>访问名单</h2>
              <p>管理 IP 网段与登录账号；黑名单优先，白名单用于绕过限流。</p>
            </div>
            <ReButton
              layout="modern"
              type="primary"
              icon="Plus"
              @click="bwTab === 'ip' ? handleIpAdd() : handleAccAdd()"
            >
              新增{{ bwTab === "ip" ? " IP " : "账号" }}规则
            </ReButton>
          </div>

          <ReTab v-model="bwTab" :tabs="bwTabs" variant="capsule" nav-only class="policy-subnav" @tab-change="isBlackWhiteLoaded" />

          <template v-if="bwTab === 'ip'">
            <ReTable
              ref="ipTableRef"
              table-id="policy-ip"
              :loader="loadIps"
              :columns="ipColumns"
              :pagination="true"
              :params="ipQuery"
              :toolbar-config="TABLE_TOOLBAR"
              row-key="sysIpId"
              v-model:page="ipQuery.page"
              v-model:page-size="ipQuery.pageSize"
              empty-text="暂无 IP 规则"
            >
              <template #type="{ row }">
                <ReTag :type="(row as SysIpBlackwhite).sysIpType === 0 ? 'success' : 'danger'" effect="light" round size="small">
                  {{ (row as SysIpBlackwhite).sysIpType === 0 ? "白名单" : "黑名单" }}
                </ReTag>
              </template>
              <template #status="{ row }">
                <ReTag :type="(row as SysIpBlackwhite).sysIpStatus === 0 ? 'success' : 'info'" effect="light" round size="small">
                  {{ (row as SysIpBlackwhite).sysIpStatus === 0 ? "启用" : "禁用" }}
                </ReTag>
              </template>
              <template #action="{ row }">
                <ReButton layout="square" type="primary" icon="Edit" @click="handleIpEdit(row)">编辑 {{ rowKeyOf(row) }}</ReButton>
                <ReButton
                  layout="square"
                  type="danger"
                  icon="Delete"
                  :loading="ipDeleteLoadingId === (row as SysIpBlackwhite).sysIpId"
                  @click="handleIpDelete(row)"
                >
                  删除 {{ rowKeyOf(row) }}
                </ReButton>
              </template>
            </ReTable>
          </template>

          <template v-else>
            <ReTable
              ref="accTableRef"
              table-id="policy-account"
              :loader="loadAccounts"
              :columns="accColumns"
              :pagination="true"
              :params="accQuery"
              :toolbar-config="TABLE_TOOLBAR"
              row-key="sysAccountBwId"
              v-model:page="accQuery.page"
              v-model:page-size="accQuery.pageSize"
              empty-text="暂无账号规则"
            >
              <template #type="{ row }">
                <ReTag :type="(row as AccountBlackwhite).type === 2 ? 'success' : 'danger'" effect="light" round size="small">
                  {{ (row as AccountBlackwhite).type === 2 ? "白名单" : "黑名单" }}
                </ReTag>
              </template>
              <template #status="{ row }">
                <ReTag :type="(row as AccountBlackwhite).status === 1 ? 'success' : 'info'" effect="light" round size="small">
                  {{ (row as AccountBlackwhite).status === 1 ? "启用" : "禁用" }}
                </ReTag>
              </template>
              <template #action="{ row }">
                <ReButton layout="square" type="primary" icon="Edit" @click="handleAccEdit(row)">编辑 {{ rowKeyOf(row) }}</ReButton>
                <ReButton
                  layout="square"
                  type="danger"
                  icon="Delete"
                  :loading="accDeleteLoadingId === (row as AccountBlackwhite).sysAccountBwId"
                  @click="handleAccDelete(row)"
                >
                  删除 {{ rowKeyOf(row) }}
                </ReButton>
              </template>
            </ReTable>
          </template>
        </section>

        <!-- 灰度配置 -->
        <section v-else-if="activeMainTab === 'gray'" class="policy-view">
          <div class="policy-view__head">
            <div>
              <span class="policy-section__eyebrow">GRAY RELEASE</span>
              <h2>灰度配置</h2>
              <p>按业务键维护灰度规则：权重决定放量比例，命中策略以 JSON 描述用户/角色/IP 等条件。</p>
            </div>
            <ReButton layout="modern" type="primary" icon="Plus" @click="handleGrayAdd">新增灰度</ReButton>
          </div>

          <div class="policy-contract">
            <div class="policy-contract__icon"><el-icon :size="18"><InfoFilled /></el-icon></div>
            <div>
              <b>配置落点</b>
              <span>
                一行为一条配置，存于统一策略表 <code>type=GRAY</code>；顺序按 sort 升序、创建时间降序。
              </span>
            </div>
            <ReTag effect="plain" round size="small">/v2/policy/config/page?type=GRAY</ReTag>
          </div>

          <ReTable
            ref="grayTableRef"
            :loader="loadGray"
            :columns="grayColumns"
            :pagination="true"
            :params="grayQuery"
            row-key="sysPolicyConfigId"
            :total="grayTotal"
            v-model:page="grayQuery.page"
            v-model:page-size="grayQuery.pageSize"
            :toolbar-config="TABLE_TOOLBAR"
            empty-text="暂无灰度配置"
          >
            <template #status="{ row }">
              <ReSwitch
                layout="square"
                :model-value="(row as PolicyConfig).status === 1"
                :disabled="grayToggleLoadingId === (row as PolicyConfig).sysPolicyConfigId"
                :aria-label="`启用灰度 ${(row as PolicyConfig).bizKey ?? ''}`"
                @update:model-value="(v: boolean | string | number) => handleGrayToggle(row as PolicyConfig, v)"
              />
            </template>
            <template #action="{ row }">
              <ReButton layout="square" type="primary" icon="Edit" @click="handleGrayEdit(row as PolicyConfig)">编辑 {{ rowKeyOf(row) }}</ReButton>
              <ReButton
                layout="square"
                type="danger"
                icon="Delete"
                :loading="grayDeleteLoadingId === (row as PolicyConfig).sysPolicyConfigId"
                @click="handleGrayDelete(row as PolicyConfig)"
              >
                删除 {{ rowKeyOf(row) }}
              </ReButton>
            </template>
          </ReTable>
        </section>

        <!-- 功能开关 -->
        <section v-else-if="activeMainTab === 'feature'" class="policy-view">
          <div class="policy-view__head">
            <div>
              <span class="policy-section__eyebrow">FEATURE FLAG</span>
              <h2>功能开关</h2>
              <p>在线控制 <code>@ApiFeature</code> 声明的功能点；启动时会按本表状态覆盖注解默认值。</p>
            </div>
            <ReButton layout="modern" type="primary" icon="Plus" @click="handleFeatureAdd">新增开关</ReButton>
          </div>

          <div class="policy-contract">
            <div class="policy-contract__icon"><el-icon :size="18"><InfoFilled /></el-icon></div>
            <div>
              <b>生效前提</b>
              <span>
                只有「注解是否注册」为已注册的功能键，在线开关才会被运行时采纳；未注册的键会被忽略并记一条 warn。
              </span>
              <template v-if="registeredFeatures.length">
                当前已注册 {{ registeredFeatures.length }} 个功能点。
              </template>
            </div>
            <ReTag effect="plain" round size="small">/v2/policy/feature/list</ReTag>
          </div>

          <ReTable
            ref="featureTableRef"
            :loader="loadFeature"
            :columns="featureColumns"
            :pagination="true"
            :params="featureQuery"
            row-key="sysPolicyConfigId"
            :total="featureTotal"
            v-model:page="featureQuery.page"
            v-model:page-size="featureQuery.pageSize"
            :toolbar-config="TABLE_TOOLBAR"
            empty-text="暂无功能开关"
          >
            <template #registered="{ row }">
              <ReTag
                :type="isFeatureRegistered((row as PolicyConfig).bizKey) ? 'success' : 'info'"
                effect="light"
                round
                size="small"
              >
                {{ isFeatureRegistered((row as PolicyConfig).bizKey) ? "已注册" : "未注册" }}
              </ReTag>
            </template>
            <template #status="{ row }">
              <ReSwitch
                layout="square"
                :model-value="(row as PolicyConfig).status === 1"
                :disabled="featureToggleLoadingId === (row as PolicyConfig).sysPolicyConfigId"
                :aria-label="`开关 ${(row as PolicyConfig).bizKey ?? ''}`"
                @update:model-value="(v: boolean | string | number) => handleFeatureToggle(row as PolicyConfig, v)"
              />
            </template>
            <template #action="{ row }">
              <ReButton layout="square" type="primary" icon="Edit" @click="handleFeatureEdit(row as PolicyConfig)">编辑 {{ rowKeyOf(row) }}</ReButton>
              <ReButton
                layout="square"
                type="danger"
                icon="Delete"
                :loading="featureDeleteLoadingId === (row as PolicyConfig).sysPolicyConfigId"
                @click="handleFeatureDelete(row as PolicyConfig)"
              >
                删除 {{ rowKeyOf(row) }}
              </ReButton>
            </template>
          </ReTable>
        </section>

        <section v-else-if="activeMainTab === 'route'" class="policy-view">
          <div class="policy-view__head">
            <div>
              <span class="policy-section__eyebrow">API ROUTE</span>
              <h2>接口管控</h2>
              <p>在线停用接口，或把一个接口的流量转发到另一个已注册接口。规则改动立即对全节点生效。</p>
            </div>
            <div class="policy-view__actions">
              <ReButton
                layout="modern"
                :loading="routeRefreshLoading"
                icon="Refresh"
                @click="handleRouteRefresh"
              >
                重载路由索引
              </ReButton>
              <ReButton layout="modern" type="primary" icon="Plus" @click="handleRouteAdd">新增规则</ReButton>
            </div>
          </div>

          <div class="policy-contract">
            <div class="policy-contract__icon"><el-icon :size="18"><InfoFilled /></el-icon></div>
            <div>
              <b>转发目标只能来自应用内已注册路由</b>
              <span>
                目标不是手填的地址，而是由服务端从 Spring 已注册的
                <code>@RequestMapping</code> 反查得到，因此无法把本服务变成跳板去访问外部地址。目标解析不到时按「停用」处理，不会放行。
              </span>
              <template v-if="routeIndexCount">
                当前索引 {{ routeIndexCount }} 条已注册路由。
              </template>
            </div>
            <ReTag effect="plain" round size="small">/v2/policy/api-route/targets</ReTag>
          </div>

          <ReTable
            ref="routeTableRef"
            :loader="loadRoute"
            :columns="routeColumns"
            :pagination="true"
            :params="routeQuery"
            row-key="sysPolicyConfigId"
            :total="routeTotal"
            v-model:page="routeQuery.page"
            v-model:page-size="routeQuery.pageSize"
            :toolbar-config="TABLE_TOOLBAR"
            empty-text="暂无接口管控规则"
          >
            <template #actionText="{ row }">
              <ReTag
                :type="routeActionText(row as PolicyConfig) === '停用' ? 'danger' : 'warning'"
                effect="light"
                round
                size="small"
              >
                {{ routeActionText(row as PolicyConfig) }}
              </ReTag>
            </template>
            <template #status="{ row }">
              <ReSwitch
                layout="square"
                :model-value="(row as PolicyConfig).status === 1"
                :disabled="routeToggleLoadingId === (row as PolicyConfig).sysPolicyConfigId"
                :aria-label="`生效 ${(row as PolicyConfig).bizKey ?? ''}`"
                @update:model-value="(v: boolean | string | number) => handleRouteToggle(row as PolicyConfig, v)"
              />
            </template>
            <template #action="{ row }">
              <ReButton layout="square" type="primary" icon="Edit" @click="handleRouteEdit(row as PolicyConfig)">编辑 {{ rowKeyOf(row) }}</ReButton>
              <ReButton
                layout="square"
                type="danger"
                icon="Delete"
                :loading="routeDeleteLoadingId === (row as PolicyConfig).sysPolicyConfigId"
                @click="handleRouteDelete(row as PolicyConfig)"
              >
                删除 {{ rowKeyOf(row) }}
              </ReButton>
            </template>
          </ReTable>
        </section>
      </main>
    </div>

    <!-- 全局限流配置弹窗 -->
    <ReDialog
      v-model="globalDialogVisible"
      title="全局限流配置"
      width="560px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
    >
      <div class="policy-global-form">
        <div class="policy-global-form__row policy-global-form__row--switch">
          <div>
            <b>启用全局限流</b>
            <span>关闭时所有请求直接放行，开启后按全局 QPS 统一限流</span>
          </div>
          <ReSwitch v-model="globalConfig.enabled" layout="square" aria-label="启用全局限流" />
        </div>
        <label class="policy-global-form__row">
          <b>全局 QPS</b>
          <ReInputNumber
            v-model="globalConfig.qps"
            :min="1"
            :precision="0"
            controls-position="right"
            aria-label="全局 QPS"
          />
        </label>
        <label class="policy-global-form__row">
          <b>突发参数</b>
          <ReInputNumber
            v-model="globalConfig.burstSize"
            :min="0"
            :precision="0"
            controls-position="right"
            aria-label="全局突发参数"
          />
        </label>
        <div class="policy-global-form__row">
          <b>配置域</b>
          <ReTag effect="plain" round>global</ReTag>
        </div>
        <p class="policy-global-form__tip">
          规则限流运行时以 QPS 为核心，突发参数当前仅保存配置，不参与令牌桶容量计算。
        </p>
      </div>
      <template #footer>
        <ReButton @click="globalDialogVisible = false">取消</ReButton>
        <ReButton
          type="primary"
          :loading="globalApplying"
          :disabled="globalApplying"
          @click="handleApplyGlobalAndClose"
        >
          应用参数
        </ReButton>
      </template>
    </ReDialog>

    <!-- 热更新弹窗 -->
    <ReDialog
      v-model="hrDialogVisible"
      :title="hrIsEdit ? '编辑热更新配置' : '新增热更新配置'"
      width="620px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="hrSaving"
      @ok="handleHrSubmit"
    >
      <el-form label-width="100px" :model="hrForm">
        <el-form-item label="配置名称" required>
          <ReInput v-model="hrForm.sysSettingName" layout="modern" maxlength="100" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="配置编码" required>
          <ReInput v-model="hrForm.sysSettingCode" layout="modern" maxlength="100" placeholder="feature.flag" />
        </el-form-item>
        <el-form-item label="配置值">
          <ReInput v-model="hrForm.sysSettingValue" layout="modern" type="textarea" :rows="3" placeholder="请输入配置值" />
        </el-form-item>
        <el-form-item label="值类型">
          <el-select v-model="hrForm.sysSettingValueType" style="width: 100%">
            <el-option label="字符串" value="string" />
            <el-option label="数字" value="number" />
            <el-option label="布尔" value="boolean" />
            <el-option label="JSON" value="json" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <ReInput v-model="hrForm.sysSettingRemark" layout="modern" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 限流规则弹窗 -->
    <ReDialog
      v-model="rateDialogVisible"
      :title="rateIsEdit ? '编辑限流规则' : '新增限流规则'"
      width="580px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="rateSaving"
      @ok="handleRateSubmit"
    >
      <el-form label-width="100px" :model="rateForm">
        <el-form-item label="限流维度">
          <el-select v-model="rateForm.dimension" style="width: 100%" :disabled="rateIsEdit">
            <el-option label="接口" value="interface" />
            <el-option label="IP" value="ip" />
            <el-option label="账号" value="account" />
          </el-select>
        </el-form-item>
        <el-form-item label="匹配目标" required>
          <ReInput v-model="rateForm.target" layout="modern" maxlength="500" :placeholder="currentRateMeta.target" />
        </el-form-item>
        <el-form-item label="QPS">
          <ReInputNumber v-model="rateForm.qps" :min="1" :precision="0" controls-position="right" style="width: 100%" aria-label="规则 QPS" />
        </el-form-item>
        <el-form-item label="突发参数">
          <ReInputNumber v-model="rateForm.burstSize" :min="0" :precision="0" controls-position="right" style="width: 100%" aria-label="规则突发参数" />
        </el-form-item>
        <el-form-item label="启用规则">
          <div class="policy-switch-field">
            <ReSwitch
              layout="square"
              :model-value="rateForm.enabled === 1"
              aria-label="启用限流规则"
              @update:model-value="(value: boolean | string | number) => (rateForm.enabled = value ? 1 : 0)"
            />
            <span>{{ rateForm.enabled === 1 ? "规则将写入运行时缓存" : "规则保持停用" }}</span>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <ReInput v-model="rateForm.remark" layout="modern" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- IP 规则弹窗 -->
    <ReDialog
      v-model="ipDialogVisible"
      :title="ipIsEdit ? '编辑 IP 规则' : '新增 IP 规则'"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="ipSaving"
      @ok="handleIpSubmit"
    >
      <el-form label-width="100px" :model="ipForm">
        <el-form-item label="IP / CIDR" required>
          <ReInput v-model="ipForm.sysIpIp" layout="modern" maxlength="64" placeholder="192.168.1.0/24" />
        </el-form-item>
        <el-form-item label="名单类型">
          <el-segmented
            v-model="ipForm.sysIpType"
            :options="[
              { label: '白名单', value: 0 },
              { label: '黑名单', value: 1 },
            ]"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-segmented
            v-model="ipForm.sysIpStatus"
            :options="[
              { label: '启用', value: 0 },
              { label: '禁用', value: 1 },
            ]"
          />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput v-model="ipForm.sysIpRemark" layout="modern" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 账号规则弹窗 -->
    <ReDialog
      v-model="accDialogVisible"
      :title="accIsEdit ? '编辑账号规则' : '新增账号规则'"
      width="580px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="accSaving"
      @ok="handleAccSubmit"
    >
      <el-form label-width="100px" :model="accForm">
        <el-form-item label="账号" required>
          <ReInput v-model="accForm.account" layout="modern" maxlength="100" placeholder="请输入登录账号" />
        </el-form-item>
        <el-form-item label="名单类型">
          <el-segmented
            v-model="accForm.type"
            :options="[
              { label: '黑名单', value: 1 },
              { label: '白名单', value: 2 },
            ]"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-segmented
            v-model="accForm.status"
            :options="[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]"
          />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput v-model="accForm.remark" layout="modern" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 灰度配置弹窗 -->
    <ReDialog
      v-model="grayDialogVisible"
      :title="grayIsEdit ? '编辑灰度配置' : '新增灰度配置'"
      width="620px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
    >
      <el-form label-width="110px" label-position="right">
        <el-form-item label="灰度键" required>
          <ReInput
            v-model="grayForm.bizKey"
            layout="modern"
            maxlength="255"
            :disabled="grayIsEdit"
            placeholder="如 order.submit.v2"
          />
        </el-form-item>
        <el-form-item label="权重(%)">
          <ReInputNumber v-model="grayForm.weight" :min="0" :max="100" :precision="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber v-model="grayForm.sort" :min="0" :precision="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="命中策略">
          <ReInput
            v-model="grayForm.config"
            layout="modern"
            type="textarea"
            :rows="4"
            placeholder='JSON 形式，如 {"users":["sa"],"ips":["10.0.0.0/8"],"rule":"1==1"}'
          />
        </el-form-item>
        <el-form-item label="启用">
          <ReSwitch v-model="grayForm.status" layout="square" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput v-model="grayForm.remark" layout="modern" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <ReButton @click="grayDialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="graySaving" :disabled="graySaving" @click="handleGraySubmit">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 功能开关弹窗 -->
    <ReDialog
      v-model="featureDialogVisible"
      :title="featureIsEdit ? '编辑功能开关' : '新增功能开关'"
      width="560px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
    >
      <el-form label-width="110px" label-position="right">
        <el-form-item label="功能键" required>
          <ReInput
            v-model="featureForm.bizKey"
            layout="modern"
            maxlength="255"
            :disabled="featureIsEdit"
            placeholder="与 @ApiFeature('xxx') 的 value 一致"
          />
        </el-form-item>
        <el-form-item label="开关">
          <ReSwitch v-model="featureForm.status" layout="square" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber v-model="featureForm.sort" :min="0" :precision="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput v-model="featureForm.remark" layout="modern" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
        <p class="policy-global-form__tip">
          功能键需与代码里 <code>@ApiFeature</code> 的 value 完全一致；未注册的键保存成功但运行时不生效。
        </p>
      </el-form>
      <template #footer>
        <ReButton @click="featureDialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="featureSaving" :disabled="featureSaving" @click="handleFeatureSubmit">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 接口停用 / 转发弹窗 -->
    <ReDialog
      v-model="routeDialogVisible"
      :title="routeIsEdit ? '编辑接口管控规则' : '新增接口管控规则'"
      width="620px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
    >
      <el-form label-width="110px" label-position="right">
        <el-form-item label="接口路径" required>
          <ReInput
            v-model="routeForm.bizKey"
            layout="modern"
            maxlength="255"
            :disabled="routeIsEdit"
            placeholder="应用内路径，不含 context-path，如 /v2/user/me"
          />
        </el-form-item>
        <el-form-item label="动作" required>
          <el-radio-group
            :model-value="routeRule.action"
            @update:model-value="(v: ApiRouteAction) => handleRouteActionChange(v)"
          >
            <el-radio v-for="item in routeActions" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="routeRule.action === 'DISABLE'">
          <el-form-item label="响应码">
            <ReInputNumber v-model="routeRule.status" :min="400" :max="599" :precision="0" controls-position="right" />
          </el-form-item>
          <el-form-item label="提示文案">
            <ReInput
              v-model="routeRule.message"
              layout="modern"
              maxlength="200"
              placeholder="返回给调用方的 msg"
              show-word-limit
            />
          </el-form-item>
        </template>
        <el-form-item v-else label="转发目标" required>
          <el-select
            v-model="routeRule.targetKey"
            filterable
            :loading="routeTargetLoading"
            placeholder="从已注册路由中选择"
            style="width: 100%"
          >
            <el-option
              v-for="item in routeTargets"
              :key="item.key"
              :label="`${item.key}   (${item.handler})`"
              :value="item.key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="生效">
          <ReSwitch v-model="routeForm.status" layout="square" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput v-model="routeForm.remark" layout="modern" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
        <p class="policy-global-form__tip">
          路径请写应用内路径（不含 <code>/system/api</code> 这类 context-path）。转发目标只能从下拉里选，
          服务端会用 Spring 已注册的路由反查真实路径，<b>无法</b>指向外部地址。
        </p>
      </el-form>
      <template #footer>
        <ReButton @click="routeDialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="routeSaving" :disabled="routeSaving" @click="handleRouteSubmit">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.policy-console {
  --policy-surface: var(--theme-color-bg-container, var(--el-bg-color));
  --policy-line: var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
  padding: 4px 2px 16px;
  overflow: auto;
  box-sizing: border-box;
}

.policy-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  flex: none;
  padding: 16px 20px;
  border: 1px solid var(--policy-line);
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.policy-hero__copy { min-width: 0; }

.policy-hero__title {
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}

.policy-hero__subtitle {
  margin-top: 2px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.policy-hero__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.policy-hero__sync {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.policy-hero__sync i {
  width: 7px;
  height: 7px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-success);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-success) 16%, transparent);
}

.policy-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  flex: none;
}

.policy-metric {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 2px 12px;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--policy-line);
  border-radius: 8px;
  background: var(--el-bg-color);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.policy-metric:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: 0 2px 8px var(--el-box-shadow-light);
}

.policy-metric span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.policy-metric strong {
  grid-row: 1 / 3;
  grid-column: 2;
  align-self: center;
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.policy-metric strong small {
  margin-left: 3px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 500;
}

.policy-metric em {
  color: var(--el-text-color-placeholder);
  font-size: 10px;
  font-style: normal;
}

.policy-metric.is-primary strong { color: var(--el-color-primary); }
.policy-metric.is-warning strong { color: var(--el-color-warning); }
.policy-metric.is-success strong { color: var(--el-color-success); }
.policy-metric.is-info strong { color: var(--el-color-info); }

.policy-shell {
  display: grid;
  grid-template-columns: 208px minmax(0, 1fr);
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--policy-line);
  border-radius: 14px;
  background: var(--policy-surface);
}

.policy-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 12px 10px;
  border-right: 1px solid var(--policy-line);
  background: var(--el-fill-color-extra-light);
}

.policy-nav__label {
  padding: 0 8px 6px;
  color: var(--el-text-color-placeholder);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.policy-nav__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 50px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--el-text-color-regular);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.policy-nav__item:hover {
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.policy-nav__item.is-active {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.policy-nav__index {
  color: var(--el-text-color-placeholder);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.policy-nav__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.policy-nav__body b {
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.policy-nav__body small {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.policy-nav__icon { color: inherit; }

.policy-nav__foot {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: auto;
  padding: 12px 10px 4px;
  border-top: 1px solid var(--policy-line);
}

.policy-nav__foot span {
  color: var(--el-text-color-placeholder);
  font-size: 10px;
}

.policy-nav__foot b {
  color: var(--el-text-color-primary);
  font-size: 13px;
}

.policy-content {
  min-width: 0;
  min-height: 0;
  padding: 14px;
  overflow: auto;
}

.policy-view {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  min-height: 100%;
  padding: 16px 18px;
  border: 1px solid var(--policy-line);
  border-radius: 14px;
  background: var(--el-bg-color);
  box-sizing: border-box;
}

.policy-view__head,
.policy-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.policy-section__eyebrow {
  color: var(--el-color-primary);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.policy-view__head h2,
.policy-list-head h3 {
  margin: 3px 0 0;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
}

.policy-head-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: none;
  flex-wrap: wrap;
}

.policy-view__head p,
.policy-list-head p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.policy-view__head code {
  color: var(--el-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.policy-pipeline {
  display: flex;
  align-items: stretch;
  gap: 8px;
  min-width: 0;
}

.policy-node {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 108px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 4px;
  padding: 14px;
  border: 1px solid var(--policy-line);
  border-radius: 10px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  text-align: left;
}

button.policy-node { cursor: pointer; transition: border-color 0.2s ease, background-color 0.2s ease; }
button.policy-node:hover { border-color: var(--el-color-primary-light-7); background: var(--el-color-primary-light-9); }

.policy-node__step {
  position: absolute;
  top: 12px;
  right: 14px;
  color: var(--el-text-color-placeholder);
  font-size: 10px;
  font-weight: 700;
}

.policy-node b { font-size: 14px; font-weight: 600; }
.policy-node small { color: var(--el-text-color-secondary); font-size: 11px; }
.policy-node.is-primary { border-top: 3px solid var(--el-color-primary); }
.policy-node.is-warning { border-top: 3px solid var(--el-color-warning); }
.policy-node.is-success { border-top: 3px solid var(--el-color-success); }
.policy-node.is-terminal { border-top: 3px solid var(--el-color-info); }

.policy-pipeline__link {
  width: 22px;
  flex: none;
  align-self: center;
  height: 1px;
  background: linear-gradient(90deg, var(--el-color-primary-light-5), var(--el-border-color));
}

.policy-overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.policy-overview-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px 12px;
  padding: 14px;
  border: 1px solid var(--policy-line);
  border-radius: 10px;
  background: var(--el-bg-color);
}

.policy-overview-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--el-radius-sm, 6px);
}

.policy-overview-card__icon.is-primary { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.policy-overview-card__icon.is-warning { background: var(--el-color-warning-light-9); color: var(--el-color-warning); }
.policy-overview-card__icon.is-success { background: var(--el-color-success-light-9); color: var(--el-color-success); }

.policy-overview-card b { color: var(--el-text-color-primary); font-size: 13px; }
.policy-overview-card p { margin: 4px 0 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.6; }
.policy-overview-card :deep(.rm-btn) { grid-column: 2; justify-self: start; }

.policy-contract {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-color-primary-light-8);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-color-primary-light-9);
}

.policy-contract__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.policy-contract b,
.policy-contract span { display: block; }
.policy-contract b { color: var(--el-text-color-primary); font-size: 13px; }
.policy-contract span { margin-top: 2px; color: var(--el-text-color-secondary); font-size: 11px; }

.policy-global-trigger {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.policy-global-trigger:hover {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
}
.policy-global-trigger.is-on {
  border-color: var(--el-color-success-light-7);
  background: var(--el-color-success-light-9);
}
.policy-global-trigger__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
}
.policy-global-trigger__body small { color: var(--el-text-color-secondary); font-size: 11px; }
.policy-global-trigger__body b { color: var(--el-text-color-primary); font-size: 13px; font-weight: 600; }
.policy-global-trigger__meta {
  padding: 2px 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.policy-global-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.policy-global-form__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 2px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.policy-global-form__row:last-of-type { border-bottom: none; }
.policy-global-form__row b { color: var(--el-text-color-primary); font-size: 13px; font-weight: 600; }
.policy-global-form__row span { display: block; margin-top: 2px; color: var(--el-text-color-secondary); font-size: 11px; }
.policy-global-form__row :deep(.rm-input-number) { width: 180px; }
.policy-global-form__tip {
  margin: 10px 0 0;
  padding: 10px 12px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.policy-subnav { width: fit-content; max-width: 100%; }

.policy-search {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--policy-line);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-extra-light);
}

.policy-search :deep(.re-search) { flex: 1; min-width: 0; border: 0; background: transparent; box-shadow: none; }
.policy-search > span { flex: none; color: var(--el-text-color-secondary); font-size: 11px; }

/* 访问名单表格吃满工作区宽度 */
.policy-view :deep(.re-table) { width: 100%; }
.policy-view :deep(.re-table__toolbar-row),
.policy-view :deep(.re-table__body),
.policy-view :deep(.el-table) { width: 100%; }

.policy-value {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.policy-switch-field { display: flex; align-items: center; gap: 10px; }
.policy-switch-field span { color: var(--el-text-color-secondary); font-size: 12px; }

.policy-console :deep(.el-table th.el-table__cell) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-weight: 600;
}

.policy-console :deep(.el-table td.el-table__cell) { padding: 11px 0; }
.policy-console :deep(.el-table .el-tag) { border-radius: var(--el-radius-full, 9999px); }

@media screen and (max-width: 1280px) {
  .policy-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .policy-shell { grid-template-columns: 188px minmax(0, 1fr); }
  .policy-pipeline { flex-wrap: wrap; }
  .policy-node { flex: 1 1 44%; }
  .policy-pipeline__link { display: none; }
  .policy-overview-grid { grid-template-columns: 1fr; }
  .policy-subnav { width: 100%; }
}

@media screen and (max-width: 768px) {
  .policy-console { overflow: auto; }
  .policy-hero { flex-direction: column; align-items: stretch; }
  .policy-hero__actions { width: 100%; justify-content: space-between; }
  .policy-metrics { grid-template-columns: 1fr; }
  .policy-shell { grid-template-columns: 1fr; overflow: visible; }
  .policy-nav { flex-direction: row; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--policy-line); }
  .policy-nav__label,
  .policy-nav__foot,
  .policy-nav__body small { display: none; }
  .policy-nav__item { min-width: 138px; }
  .policy-content { padding: 14px; }
  .policy-view__head,
  .policy-list-head,
  .policy-search { align-items: stretch; flex-direction: column; }
  .policy-global-form__row { flex-direction: column; align-items: flex-start; }
  .policy-global-form__row :deep(.rm-input-number) { width: 100%; }
  .policy-node { flex: 1 1 100%; }
  .policy-contract { grid-template-columns: auto minmax(0, 1fr); }
  .policy-contract > :last-child { grid-column: 1 / -1; justify-self: start; }
}

@media (prefers-reduced-motion: reduce) {
  .policy-metric,
  button.policy-node { transition: none; }
}
</style>
