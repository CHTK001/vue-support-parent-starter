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
import { computed, onMounted, provide, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { InfoFilled } from "@element-plus/icons-vue";
import {
  applyRateLimitGlobal,
  deleteAccountBw,
  deleteIp,
  deletePolicyConfig,
  deleteRateLimit,
  getRateLimitGlobal,
  listHotReload,
  listRateLimit,
  listApiRouteTargets,
  listHeaderRules,
  listHeaderPresets,
  refreshHeaderRules,
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
  HeaderMatchType,
  HeaderPresets,
  HeaderRuleRow,
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
} from "@repo/ui/re-table";
import ReTab from "@repo/ui/re-tab";
import PolicyHitDialog from "./policy/components/PolicyHitDialog.vue";
import PolicyHitCell from "./policy/components/PolicyHitCell.vue";
import PolicyGrayTab from "./policy/tabs/PolicyGrayTab.vue";
import { usePolicyHit } from "./policy/composables/usePolicyHit";
import { POLICY_HIT_KEY } from "./policy/composables/policyHitContext";
import { TABLE_TOOLBAR, rowKeyOf } from "./policy/shared/policyTable";

/**
 * 页面文案全部走 i18n，key 命名空间 policy.*
 *
 * <p>列定义、页签这类「构造时求值一次」的文案要包 {@link computed}，否则切换语言
 * 后不会重算；模板与事件处理函数里的 {@code t()} 本身在渲染期/调用期求值，
 * 无需额外处理。</p>
 */
const { t } = useI18n();

/**
 * 命中统计由 5 个页签共用，通过 provide/inject 共享同一个实例，
 * 避免把 hitCountOf / openHitDetail 等逐个透传。
 *
 * <p><b>本组件自己不能走 inject</b>：Vue 的 {@code inject} 只沿父链向上查找，
 * 找不到同一个组件里 provide 出去的值。所以这里直接持有返回值再 provide，
 * 子组件（命中弹窗、各页签）才用 {@code usePolicyHitContext} 注入。</p>
 */
const policyHit = usePolicyHit();
provide(POLICY_HIT_KEY, policyHit);
/**
 * 父模板仍在用这几个：ipHitType / accHitType / rateHitKey 要先算出策略键
 * 才能传给 {@link PolicyHitCell} 的 hitKey，不能省。
 *
 * <p>openHitDetail 同样保留：命中弹窗虽然已抽成组件，但父模板里
 * 「刷新命中次数」等路径仍直接调用它。</p>
 */
const { ipHitType, accHitType, rateHitKey, openHitDetail, loadHitCounts } = policyHit;

type MainTabName = "overview" | "hotreload" | "ratelimit" | "blackwhite" | "header" | "gray" | "route";
type RateDimension = NonNullable<RateLimitRule["dimension"]>;
type BlackWhiteTabName = "ip" | "account";
type AccountType = NonNullable<AccountBlackwhite["type"]>;
type AccountStatus = NonNullable<AccountBlackwhite["status"]>;

interface TableReloadRef {
  reload: () => Promise<void> | void;
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


const activeMainTab = ref<MainTabName>("overview");
const rateTab = ref<RateDimension>("interface");
const bwTab = ref<BlackWhiteTabName>("ip");
const loadedMainTabs = ref<Record<MainTabName, boolean>>({
  overview: true,
  hotreload: false,
  ratelimit: false,
  blackwhite: false,
  gray: false,
  header: false,
  route: false,
});

const mainTabs = computed(() => [
  { name: "overview", label: t("policy.nav.overview.label"), caption: t("policy.nav.overview.caption"), icon: "DataBoard" },
  { name: "hotreload", label: t("policy.nav.hotreload.label"), caption: t("policy.nav.hotreload.caption"), icon: "Setting" },
  { name: "ratelimit", label: t("policy.nav.ratelimit.label"), caption: t("policy.nav.ratelimit.caption"), icon: "Stopwatch" },
  { name: "blackwhite", label: t("policy.nav.blackwhite.label"), caption: t("policy.nav.blackwhite.caption"), icon: "User" },
  { name: "gray", label: t("policy.nav.gray.label"), caption: t("policy.nav.gray.caption"), icon: "DataAnalysis" },
  { name: "header", label: t("policy.nav.header.label"), caption: t("policy.nav.header.caption"), icon: "Filter" },
  { name: "route", label: t("policy.nav.route.label"), caption: t("policy.nav.route.caption"), icon: "Link" },
]);
const rateTabs = computed(() => [
  { name: "interface", label: t("policy.nav.rate.interface") },
  { name: "ip", label: t("policy.nav.rate.ip") },
  { name: "account", label: t("policy.nav.rate.account") },
]);
const bwTabs = computed(() => [
  { name: "ip", label: t("policy.nav.bw.ip") },
  { name: "account", label: t("policy.nav.bw.account") },
]);

const activeMainMeta = computed(() => mainTabs.value.find((item) => item.name === activeMainTab.value) ?? mainTabs.value[0]);

const currentSectionLoading = computed(() => {
  if (activeMainTab.value === "overview") return overviewLoading.value;
  if (activeMainTab.value === "hotreload") return hotReloadLoading.value;
  if (activeMainTab.value === "ratelimit") return globalLoading.value || rateLoading.value;
  return false;
});

const currentRateMeta = computed(() => {
  const map: Record<RateDimension, { title: string; description: string; target: string }> = {
    interface: {
      title: t("policy.rate.meta.interface.title"),
      description: t("policy.rate.meta.interface.description"),
      target: t("policy.rate.meta.interface.target"),
    },
    ip: {
      title: t("policy.rate.meta.ip.title"),
      description: t("policy.rate.meta.ip.description"),
      target: t("policy.rate.meta.ip.target"),
    },
    account: {
      title: t("policy.rate.meta.account.title"),
      description: t("policy.rate.meta.account.description"),
      target: t("policy.rate.meta.account.target"),
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
    ElMessage.success(t("policy.hotreload.reloaded", { count: hotReloadInfo.value.enabledCount }));
    await loadHotReload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.hotreload.reloadFailed"));
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
    ElMessage.error(error instanceof Error ? error.message : t("policy.hotreload.loadFailed"));
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
  if (type === "number" && !Number.isFinite(Number(raw))) return t("policy.hotreload.errNotNumber");
  if (type === "boolean" && !["true", "false"].includes(raw)) return t("policy.hotreload.errNotBoolean");
  if (type === "json") {
    try {
      JSON.parse(raw);
    } catch {
      return t("policy.hotreload.errNotJson");
    }
  }
  return null;
}

async function handleHrSubmit(): Promise<void> {
  const name = hrForm.value.sysSettingName?.trim() ?? "";
  const code = hrForm.value.sysSettingCode?.trim() ?? "";
  if (!name || !code) {
    ElMessage.warning(t("policy.hotreload.errValue"));
    return;
  }
  if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(code)) {
    ElMessage.warning(t("policy.hotreload.errCode"));
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
    if (res.data === false) throw new Error(t("policy.hotreload.errDuplicate"));
    ElMessage.success(hrIsEdit.value ? t("policy.hotreload.saved") : t("policy.hotreload.created"));
    hrDialogVisible.value = false;
    await loadHotReload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.saveFailed"));
  } finally {
    hrSaving.value = false;
  }
}

const hrColumns = computed<ReTableColumn[]>(() => [
  { prop: "sysSettingName", label: t("policy.hotreload.col.name"), minWidth: 150 },
  { prop: "sysSettingCode", label: t("policy.hotreload.col.code"), minWidth: 180, showOverflowTooltip: true },
  { prop: "sysSettingValue", label: t("policy.hotreload.col.value"), minWidth: 180, slot: "value", showOverflowTooltip: true },
  { prop: "sysSettingValueType", label: t("policy.hotreload.col.type"), width: 100, slot: "type", align: "center" },
  { prop: "sysSettingRemark", label: t("policy.common.remark"), minWidth: 160, showOverflowTooltip: true },
  { prop: "action", label: t("policy.common.action"), width: 110, slot: "action", fixed: "right", align: "center" },
]);



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

/**
 * 灰度页签是独立组件，表格在它自己内部。
 * 这里只拿它的 `reload`（组件已 defineExpose），供顶部「刷新」按钮统一调度。
 */
const grayTabRef = ref<TableReloadRef>();
const routeTableRef = ref<TableReloadRef>();
const routeLoading = ref(false);const routeTotal = ref(0);
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

const routeActions = computed<Array<{ label: string; value: ApiRouteAction }>>(() => [
  { label: t("policy.route.actionDisableLabel"), value: "DISABLE" },
  { label: t("policy.route.actionForwardLabel"), value: "FORWARD" },
]);

/**
 * 停用响应码候选
 *
 * <p>给成下拉而不是自由输入：一是这类值只有寥寥几个语义档位，手打容易写出
 * 客户端无法处理的码；二是下拉能顺带把含义讲清楚（见 subtitle）。</p>
 */
const ROUTE_STATUS_OPTIONS = computed<Array<{ value: number; label: string; hint: string }>>(() => [
  { value: 503, label: "503 Service Unavailable", hint: t("policy.status.503") },
  { value: 502, label: "502 Bad Gateway", hint: t("policy.status.502") },
  { value: 500, label: "500 Internal Server Error", hint: t("policy.status.500") },
  { value: 429, label: "429 Too Many Requests", hint: t("policy.status.429") },
  { value: 403, label: "403 Forbidden", hint: t("policy.status.403") },
  { value: 404, label: "404 Not Found", hint: t("policy.status.404") },
  { value: 401, label: "401 Unauthorized", hint: t("policy.status.401") },
]);

/** 当前响应码的说明文案（subtitle） */
const routeStatusHint = computed(
  () => ROUTE_STATUS_OPTIONS.value.find((o) => o.value === routeRule.value.status)?.hint ?? t("policy.route.customStatusHint"),
);

/**
 * 接口管控列（表格布局）
 *
 * <p>「生效」列渲染的是 {@code effectiveText}（接口此刻的处境，action × status），
 * 不是 {@code actionText}（规则想做什么）—— 两者不是一回事，只显示后者会误导。
 * 该列同时带一句白话说明，单独一个说明列太宽，而说明脱离标签也没有意义。</p>
 */
const routeColumns = computed<ReTableColumn[]>(() => [
  { prop: "path", label: t("policy.route.form.path"), minWidth: 240, showOverflowTooltip: true },
  { prop: "method", label: t("policy.route.col.method"), width: 100, slot: "method", align: "center" },
  { prop: "handler", label: t("policy.route.col.handler"), minWidth: 180, showOverflowTooltip: true },
  { prop: "effectiveText", label: t("policy.route.col.action"), minWidth: 280, slot: "actionText" },
  { prop: "targetText", label: t("policy.route.col.target"), minWidth: 180, showOverflowTooltip: true },
  { prop: "status", label: t("policy.route.col.status"), width: 130, slot: "status" },
  { prop: "hit", label: t("policy.common.hits"), width: 100, slot: "hit", align: "center" },
  { prop: "action", label: t("policy.common.action"), width: 90, slot: "action", fixed: "right", align: "center" },
]);

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

/** 动作对应的标签色：停用红、转发橙、放行灰 */
function routeActionTagType(action: ApiRouteAction): "danger" | "warning" | "info" {
  if (action === "DISABLE") {
    return "danger";
  }
  if (action === "FORWARD") {
    return "warning";
  }
  return "info";
}

/** HTTP 方法对应的标签色（只用于消歧，不表达严重程度） */
function routeMethodTagType(row: ApiRouteRow): "primary" | "success" | "warning" | "danger" | "info" {
  // 同一路径注册了多个方法时用中性色，避免让人误读成单一方法
  if (row.method.includes("/")) {
    return "info";
  }
  switch (row.method) {
    case "GET":
      return "success";
    case "POST":
      return "primary";
    case "PUT":
      return "warning";
    case "DELETE":
      return "danger";
    default:
      return "info";
  }
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
  // 同一路径可能注册了多个方法（如 GET+POST），而停用/转发规则是<b>按路径</b>生效的
  // （执行器只用 path 查规则表），所以这里按 path 归并，方法合并成 GET/POST 一起显示；
  // 只显示其中一个方法会让人以为只封了那一个，实际两个都会被拦。
  const methodsOf = new Map<string, string[]>();
  for (const r of routeTargets.value) {
    const list = methodsOf.get(r.path) ?? [];
    if (r.method && !list.includes(r.method)) {
      list.push(r.method);
    }
    methodsOf.set(r.path, list);
    if (!byPath.has(r.path)) {
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
  }
  for (const [path, list] of methodsOf) {
    const row = byPath.get(path);
    if (row) {
      row.method = list.join("/");
    }
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
      handler: t("policy.route.customPathHint"),
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

/**
 * 取一行的**有效状态**（接口此刻的真实处境）
 *
 * <p>为什么不能只看 action：{@code action} 是「这条规则想做什么」，
 * {@code status} 是「这条规则有没有在跑」，两者是独立的轴，相乘才是接口的实际处境。
 * 以前只渲染 action，于是把 status 关掉（接口其实已经放行）之后，行上仍写着「停用」，
 * 用户以为没生效又点一次开关，反而把接口重新拦了回去 —— 表现为「停用了却恢复不了」。</p>
 *
 * <p>状态与标签色一起返回：拦截红、转发橙、未生效与未配置灰。</p>
 *
 * @param row 接口管控行
 * @return 状态文案与标签色
 */
function effectiveStateOf(row: ApiRouteRow): { text: string; type: "danger" | "warning" | "info" } {
  if (row.action === "PASS") {
    return { text: t("policy.common.notConfigured"), type: "info" };
  }
  if (row.status !== 1) {
    return { text: t("policy.route.stateInactive"), type: "info" };
  }
  if (row.action === "FORWARD") {
    return { text: t("policy.route.stateForwarded"), type: "warning" };
  }
  return { text: t("policy.route.stateBlocked"), type: "danger" };
}

/**
 * 一行状态的<b>白话说明</b>：这条规则到底生不生效、命中后会怎样
 *
 * <p>状态标签只有「未配置 / 未生效 / 已拦截 / 已转发」四个短词，光看标签仍要靠猜：
 * 标签说的是<b>此刻的处境</b>，而不是「我改的东西有没有在跑」。所以每行再补一句
 * 把三件事讲明白 —— 有没有规则、规则在不在跑、命中之后会怎样。</p>
 *
 * @param row 接口管控行
 * @return 说明文案
 */
function routeStateNoteOf(row: ApiRouteRow): string {
  if (row.action === "PASS") {
    return t("policy.route.stateNoteUnconfigured");
  }
  if (row.status !== 1) {
    return t("policy.route.stateNoteInactive");
  }
  if (row.action === "FORWARD") {
    return t("policy.route.stateNoteForwarded", { target: row.targetText || "-" });
  }
  return t("policy.route.stateNoteBlocked", { code: row.statusCode ? String(row.statusCode) : "-" });
}

/** 给表格/视图补上展示用的派生字段 */
function decorateApiRouteRow(row: ApiRouteRow): Record<string, unknown> {
  const configured = row.action !== "PASS";
  const effective = effectiveStateOf(row);
  return {
    ...row,
    configured,
    /** 有效状态：接口此刻是放行 / 被拦 / 被转发（action × status） */
    effectiveText: effective.text,
    effectiveTagType: effective.type,
    /** 白话说明：有没有规则、规则在不在跑、命中会怎样 */
    stateNote: routeStateNoteOf(row),
    /** 视图/表格统一用的操作文案：没配过就是「配置」 */
    actionLabel: configured ? t("policy.route.actionLabelEdit") : t("policy.route.actionLabelConfig"),
  };
}

/**
 * 表格 loader：取全量 → 求并集 → 本地过滤/分页
 *
 * <p>过滤与分页都在前端做，因为数据源是「注册路由 ∪ 策略行」的并集，
 * 后端分页任一侧都会漏（只分页策略会漏掉未配置路由，只分页路由会漏掉自定义策略）。</p>
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
    ElMessage.error(error instanceof Error ? error.message : t("policy.route.loadFailed"));
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
    ElMessage.error(error instanceof Error ? error.message : t("policy.route.routesLoadFailed"));
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
    ElMessage.success(t("policy.route.synced", { routes: res.data?.routeCount ?? 0, policies: res.data?.policyCount ?? 0 }));
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.reloadFailed"));
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
  routeRule.value = { action: "DISABLE", status: 503, message: t("policy.route.defaultMessage") };
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
    : { action: "DISABLE", status: 503, message: t("policy.route.defaultMessage") };
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
    routeRule.value.message = routeRule.value.message ?? t("policy.route.defaultMessage");
  }
}

async function handleRouteSubmit(): Promise<void> {
  if (!routeForm.value.bizKey) {
    ElMessage.warning(t("policy.route.errPathBlank"));
    return;
  }
  if (!routeForm.value.bizKey.startsWith("/")) {
    ElMessage.warning(t("policy.route.errPathSlash"));
    return;
  }
  if (routeRule.value.action === "FORWARD" && !routeRule.value.targetKey) {
    ElMessage.warning(t("policy.route.errTargetBlank"));
    return;
  }
  // 自定义路径是允许的（未注册的路径也能写规则），但要如实提示它的代价：
  // 停用/放行对未注册路径没有运行时意义，只有转发到别处才可能被人访问到。
  const known = routeTargets.value.some((r) => r.path === routeForm.value.bizKey);
  if (!known) {
    ElMessage.warning(t("policy.route.errPathUnknown"));
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
      ElMessage.success(t("policy.route.saved"));
    } else {
      await savePolicyConfig(payload);
      ElMessage.success(t("policy.route.created"));
    }
    routeDialogVisible.value = false;
    // 必须走 ReTable 实例的 reload()，不能直接调 loadRoute()：
    // 直接调只是重取数据并写回本地 ref，ReTable 不会因此重绘，
    // 表现为「保存成功但列表不刷新 / 切页后行消失」。与 IP 名单表保持同一机制。
    await routeTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.saveFailed"));
  } finally {
    routeSaving.value = false;
  }
}

async function handleRouteToggle(row: ApiRouteRow, value: boolean | string | number): Promise<void> {
  if (row.policyId == null) {
    ElMessage.warning(t("policy.route.errNotConfigured"));
    return;
  }
  routeToggleLoadingId.value = row.policyId;
  try {
    await togglePolicyConfig(row.policyId, value ? 1 : 0);
    // toast 必须说「接口」而不是「规则开关」：用户点这个开关是想改接口的处境。
    // 以前这里报「已停用」，而关掉一条 DISABLE 规则恰恰是让接口恢复，
    // 用户读到的是自己想要的反面结果，于是又点一次把接口重新拦了回去。
    // 关掉一律是「放行」；打开时按动作分「拦截」还是「转发」。
    const onText =
      row.action === "FORWARD" ? t("policy.route.toastForwardOn") : t("policy.route.toastBlocked");
    ElMessage.success(value ? onText : t("policy.route.toastAllowed"));
    await routeTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.toggleFailed"));
  } finally {
    routeToggleLoadingId.value = null;
  }
}

/**
 * 删除一条接口管控规则（行内与弹窗共用一份逻辑）
 *
 * <p>删除后必须同时刷新 {@code routePolicies}：表格行是由它合并出来的
 * （见 {@link mergeApiRouteRows}），只 reload 表格的话，合并用的还是内存里那份旧策略，
 * 已删除的规则会继续显示成「已配置」。</p>
 *
 * @param policyId 规则主键，未配置过时为空
 * @param path 路由路径，用于确认文案
 * @return 是否删除成功（取消或失败均为 false）
 */
async function deleteRouteRule(policyId: number | null, path: string): Promise<boolean> {
  if (policyId == null) {
    ElMessage.warning(t("policy.route.errNothingToDelete"));
    return false;
  }
  try {
    await ElMessageBox.confirm(t("policy.route.deleteBody", { path }), t("policy.common.deleteConfirm"), { type: "warning" });
  } catch {
    return false;
  }
  routeDeleteLoadingId.value = policyId;
  try {
    await deletePolicyConfig(policyId);
    ElMessage.success(t("policy.route.ruleDeleted"));
    await loadRoutePolicies();
    await routeTableRef.value?.reload();
    return true;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.deleteFailed"));
    return false;
  } finally {
    routeDeleteLoadingId.value = null;
  }
}

/**
 * 弹窗内删除
 *
 * <p>破坏性操作从行内收进弹窗：一行原本有命中数、开关、配置、删除四个控件，
 * 其中删除几乎不用、点错又只能靠确认框兜底。放进弹窗后既能看清删的是哪条规则，
 * 行内也只剩「看数据 + 切开关 + 去配置」三件事。</p>
 */
async function handleRouteDeleteInDialog(): Promise<void> {
  const id = routeForm.value.sysPolicyConfigId ?? null;
  if (await deleteRouteRule(id, routeForm.value.bizKey ?? "")) {
    routeDialogVisible.value = false;
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
    ElMessage.error(error instanceof Error ? error.message : t("policy.rate.loadGlobalFailed"));
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
    ElMessage.error(error instanceof Error ? error.message : t("policy.rate.loadRulesFailed"));
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
    ElMessage.warning(t("policy.rate.errQps"));
    return false;
  }
  if (!Number.isInteger(burstSize) || (burstSize ?? -1) < 0) {
    ElMessage.warning(t("policy.rate.errBurst"));
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
    ElMessage.success(res.data || t("policy.rate.globalApplied"));
    await loadGlobal();
    return true;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.rate.globalApplyFailed"));
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
    ElMessage.warning(t("policy.rate.errTargetTooLong"));
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
    if (!rateIsEdit.value && res.data === false) throw new Error(t("policy.rate.errNotCreated"));
    if (rateIsEdit.value && res.data === false) throw new Error(t("policy.rate.errNotUpdated"));
    ElMessage.success(rateIsEdit.value ? t("policy.rate.saved") : t("policy.rate.created"));
    rateDialogVisible.value = false;
    await loadRateList();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.saveFailed"));
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
    if (res.data === false) throw new Error(t("policy.rate.errStatusNotUpdated"));
    ElMessage.success(enabled === 1 ? t("policy.rate.ruleEnabled") : t("policy.rate.ruleStopped"));
    await loadRateList();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.rate.statusFailed"));
  } finally {
    rateToggleLoadingId.value = null;
  }
}

async function handleRateDelete(row: RateLimitRule): Promise<void> {
  const id = row.sysRateLimitRuleId;
  if (id == null || rateDeleteLoadingId.value != null) return;
  try {
    await ElMessageBox.confirm(t("policy.rate.deleteBody", { target: row.target ?? "-" }), t("policy.rate.deleteTitle"), {
      type: "warning",
      confirmButtonText: t("policy.common.remove"),
      cancelButtonText: t("policy.common.cancel"),
    });
  } catch {
    return;
  }
  rateDeleteLoadingId.value = id;
  try {
    const res = await deleteRateLimit(id);
    if (res.data === false) throw new Error(t("policy.rate.errNotDeleted"));
    ElMessage.success(t("policy.rate.deleted"));
    await loadRateList();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.deleteFailed"));
  } finally {
    rateDeleteLoadingId.value = null;
  }
}

const rateColumns = computed<ReTableColumn[]>(() => [
  { prop: "target", label: t("policy.common.matchTarget"), minWidth: 220, showOverflowTooltip: true },
  { prop: "qps", label: "QPS", width: 100, align: "center" },
  { prop: "burstSize", label: t("policy.common.burst"), width: 110, align: "center" },
  { prop: "enabled", label: t("policy.rate.col.runStatus"), width: 110, slot: "status", align: "center" },
  { prop: "hit", label: t("policy.common.hits"), width: 120, slot: "hit", align: "center" },
  { prop: "remark", label: t("policy.common.remark"), minWidth: 160, showOverflowTooltip: true },
  { prop: "createTime", label: t("policy.common.createTime"), width: 170 },
  { prop: "action", label: t("policy.common.action"), width: 150, slot: "action", fixed: "right", align: "center" },
]);

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

const ipSearchFilters = computed(() => [
  { key: "sysIpIp", label: "IP / CIDR", type: "input" as const, placeholder: t("policy.bw.phIp") },
  {
    key: "sysIpType",
    label: t("policy.common.listType"),
    type: "select" as const,
    placeholder: t("policy.common.all"),
    options: [
      { label: t("policy.common.whitelist"), value: 0 },
      { label: t("policy.common.blacklist"), value: 1 },
    ],
  },
  {
    key: "sysIpStatus",
    label: t("policy.common.status"),
    type: "select" as const,
    placeholder: t("policy.common.all"),
    options: [
      { label: t("policy.common.enable"), value: 0 },
      { label: t("policy.common.disabled"), value: 1 },
    ],
  },
]);

const accSearchFilters = computed(() => [
  { key: "account", label: t("policy.common.account"), type: "input" as const, placeholder: t("policy.bw.phAccount") },
  {
    key: "type",
    label: t("policy.common.listType"),
    type: "select" as const,
    placeholder: t("policy.common.all"),
    options: [
      { label: t("policy.common.blacklist"), value: 1 },
      { label: t("policy.common.whitelist"), value: 2 },
    ],
  },
  {
    key: "status",
    label: t("policy.common.status"),
    type: "select" as const,
    placeholder: t("policy.common.all"),
    options: [
      { label: t("policy.common.enable"), value: 1 },
      { label: t("policy.common.disabled"), value: 0 },
    ],
  },
]);

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
    ElMessage.warning(t("policy.bw.errIpBlank"));
    return;
  }
  if (!validIpRule(address)) {
    ElMessage.warning(t("policy.bw.errIpInvalid"));
    return;
  }

  ipSaving.value = true;
  try {
    const payload: SysIpBlackwhite = { ...ipForm.value, sysIpIp: address };
    const res = ipIsEdit.value ? await updateIp(payload) : await saveIp(payload);
    if (ipIsEdit.value && res.data === false) throw new Error(t("policy.bw.errIpNotUpdated"));
    ElMessage.success(ipIsEdit.value ? t("policy.bw.ipSaved") : t("policy.bw.ipCreated"));
    ipDialogVisible.value = false;
    await ipTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.saveFailed"));
  } finally {
    ipSaving.value = false;
  }
}

async function handleIpDelete(row: Record<string, unknown>): Promise<void> {
  const ip = row as SysIpBlackwhite;
  if (ip.sysIpId == null || ipDeleteLoadingId.value != null) return;
  try {
    await ElMessageBox.confirm(t("policy.bw.deleteIpBody", { ip: ip.sysIpIp ?? "-" }), t("policy.bw.deleteIpTitle"), {
      type: "warning",
      confirmButtonText: t("policy.common.remove"),
      cancelButtonText: t("policy.common.cancel"),
    });
  } catch {
    return;
  }
  ipDeleteLoadingId.value = ip.sysIpId;
  try {
    const res = await deleteIp(ip.sysIpId);
    if (res.data === false) throw new Error(t("policy.bw.errIpNotDeleted"));
    ElMessage.success(t("policy.bw.ipDeleted"));
    await ipTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.deleteFailed"));
  } finally {
    ipDeleteLoadingId.value = null;
  }
}

const ipColumns = computed<ReTableColumn[]>(() => [
  { prop: "sysIpIp", label: "IP / CIDR", minWidth: 220 },
  { prop: "sysIpType", label: t("policy.common.listType"), width: 110, slot: "type", align: "center" },
  { prop: "sysIpStatus", label: t("policy.common.status"), width: 100, slot: "status", align: "center" },
  { prop: "hit", label: t("policy.common.hits"), width: 120, slot: "hit", align: "center" },
  { prop: "sysIpRemark", label: t("policy.common.remark"), minWidth: 320, showOverflowTooltip: true },
  { prop: "createTime", label: t("policy.common.createTime"), minWidth: 180 },
  { prop: "action", label: t("policy.common.action"), width: 150, slot: "action", fixed: "right", align: "center" },
]);

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
    ElMessage.warning(t("policy.bw.phAccount"));
    return;
  }
  if (account.length > 100) {
    ElMessage.warning(t("policy.bw.errAccTooLong"));
    return;
  }
  if (accForm.value.type !== 1 && accForm.value.type !== 2) {
    ElMessage.warning(t("policy.bw.errPickType"));
    return;
  }
  if (accForm.value.status !== 0 && accForm.value.status !== 1) {
    ElMessage.warning(t("policy.bw.errPickStatus"));
    return;
  }

  accSaving.value = true;
  try {
    const payload: AccountBlackwhite = { ...accForm.value, account };
    const res = accIsEdit.value ? await updateAccountBw(payload) : await saveAccountBw(payload);
    if (accIsEdit.value && res.data === false) throw new Error(t("policy.bw.errAccNotUpdated"));
    ElMessage.success(accIsEdit.value ? t("policy.bw.accSaved") : t("policy.bw.accCreated"));
    accDialogVisible.value = false;
    await accTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.saveFailed"));
  } finally {
    accSaving.value = false;
  }
}

async function handleAccDelete(row: Record<string, unknown>): Promise<void> {
  const account = row as AccountBlackwhite;
  if (account.sysAccountBwId == null || accDeleteLoadingId.value != null) return;
  try {
    await ElMessageBox.confirm(t("policy.bw.deleteAccBody", { account: account.account ?? "-" }), t("policy.bw.deleteAccTitle"), {
      type: "warning",
      confirmButtonText: t("policy.common.remove"),
      cancelButtonText: t("policy.common.cancel"),
    });
  } catch {
    return;
  }
  accDeleteLoadingId.value = account.sysAccountBwId;
  try {
    const res = await deleteAccountBw(account.sysAccountBwId);
    if (res.data === false) throw new Error(t("policy.bw.errAccNotDeleted"));
    ElMessage.success(t("policy.bw.accDeleted"));
    await accTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.deleteFailed"));
  } finally {
    accDeleteLoadingId.value = null;
  }
}

const accColumns = computed<ReTableColumn[]>(() => [
  { prop: "account", label: t("policy.common.account"), minWidth: 240 },
  { prop: "type", label: t("policy.common.listType"), width: 110, slot: "type", align: "center" },
  { prop: "status", label: t("policy.common.status"), width: 100, slot: "status", align: "center" },
  { prop: "hit", label: t("policy.common.hits"), width: 120, slot: "hit", align: "center" },
  { prop: "remark", label: t("policy.common.remark"), minWidth: 320, showOverflowTooltip: true },
  { prop: "createTime", label: t("policy.common.createTime"), minWidth: 180 },
  { prop: "action", label: t("policy.common.action"), width: 150, slot: "action", fixed: "right", align: "center" },
]);

/* ==================== 消息头拦截（UA / 爬虫 / 自动化） ==================== */

const headerTableRef = ref<TableReloadRef | null>(null);
const headerTotal = ref(0);
const headerPageSize = ref(10);
const headerPage = ref(1);
const headerToggleLoadingId = ref<number | null>(null);
const headerDeleteLoadingId = ref<number | null>(null);
const headerDialogVisible = ref(false);
const headerSaving = ref(false);
const headerIsEdit = ref(false);
const headerPresets = ref<HeaderPresets>({ groups: {}, flat: [] });

/** 表单里的 patterns 用「每行一条」的文本框承载，比标签输入更好用 */
const headerForm = ref({
  sysPolicyConfigId: null as number | null,
  headerName: "User-Agent",
  matchType: "CONTAINS" as HeaderMatchType,
  patternsText: "",
  blockStatus: 403,
  message: t("policy.header.defaultMessage"),
  status: 1 as 0 | 1,
  remark: "",
});

const headerMatchOptions = computed<Array<{ value: HeaderMatchType; label: string; hint: string }>>(() => [
  { value: "CONTAINS", label: t("policy.header.match.CONTAINS.label"), hint: t("policy.header.match.CONTAINS.hint") },
  { value: "EQUALS", label: t("policy.header.match.EQUALS.label"), hint: t("policy.header.match.EQUALS.hint") },
  { value: "PREFIX", label: t("policy.header.match.PREFIX.label"), hint: t("policy.header.match.PREFIX.hint") },
  { value: "REGEX", label: t("policy.header.match.REGEX.label"), hint: t("policy.header.match.REGEX.hint") },
]);

/** 当前匹配方式的说明，供表单里提示 */
const headerMatchHint = computed(
  () => headerMatchOptions.value.find((o) => o.value === headerForm.value.matchType)?.hint ?? "",
);

/** 把文本框里的多行拆成模式列表 */
function headerPatternsOf(text: string): string[] {
  return text
    .split(/[\r\n]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

/**
 * 消息头规则的命中归因键
 *
 * <p><b>头名必须转小写</b>：后端 {@code PolicyCacheService.projectHeaderRule} 投影时
 * 把消息头名统一转小写（HTTP 头名本身大小写不敏感），所以这里必须用同样的规则归一化。
 * 否则查的是 `User-Agent|Googlebot`，而库里存的是 `user-agent|Googlebot`，永远查不到。</p>
 *
 * @param row     规则行
 * @param pattern 指定特征；不给时用第一个（明细弹窗一次只展示一条特征的归因）
 * @returns 归因键
 */
function headerHitKeyOf(row: HeaderRuleRow, pattern?: string): string {
  const name = (row.headerName ?? "").toLowerCase();
  const p = pattern ?? (row.patterns ?? [])[0] ?? "";
  return `${name}|${p}`;
}

/**
 * 一条规则的命中次数 = 它各个特征的命中数之和
 *
 * <p>后端按「头名|命中的那个特征」归因，所以行级总数要自己加；
 * 这样既能看规则整体拦了多少，也能点进去看是哪条特征在拦。</p>
 */
function headerHitCount(row: HeaderRuleRow): number {
  const list = row.patterns ?? [];
  if (!list.length) {
    return hitCountOf("HEADER", (row.headerName ?? "").toLowerCase());
  }
  const name = (row.headerName ?? "").toLowerCase();
  return list.reduce((sum, p) => sum + hitCountOf("HEADER", `${name}|${p}`), 0);
}

const headerColumns = computed<ReTableColumn[]>(() => [
  { prop: "headerName", label: t("policy.header.col.headerName"), minWidth: 150 },
  { prop: "matchType", label: t("policy.header.col.matchType"), width: 120, slot: "matchType", align: "center" },
  { prop: "patterns", label: t("policy.header.col.patterns"), minWidth: 320, showOverflowTooltip: true },
  { prop: "blockStatus", label: t("policy.header.col.blockStatus"), width: 100, align: "center" },
  { prop: "hit", label: t("policy.common.hits"), width: 120, slot: "hit", align: "center" },
  { prop: "status", label: t("policy.header.col.active"), width: 100, slot: "status", align: "center" },
  { prop: "remark", label: t("policy.common.remark"), minWidth: 180, showOverflowTooltip: true },
  { prop: "action", label: t("policy.common.action"), width: 150, slot: "action", fixed: "right", align: "center" },
]);

async function loadHeaders(params?: ReTableLoadParams): Promise<RePageResult> {
  const res = await listHeaderRules();
  const rows = res.data ?? [];
  headerTotal.value = rows.length;
  // 数据量极小（通常个位数），本地分页即可，也不值得再打一次接口
  const page = params?.page ?? headerPage.value;
  const pageSize = params?.pageSize ?? headerPageSize.value;
  const start = (page - 1) * pageSize;
  return {
    total: rows.length,
    data: rows.slice(start, start + pageSize) as unknown as Record<string, unknown>[],
  };
}

async function loadHeaderPresets(): Promise<void> {
  try {
    const res = await listHeaderPresets();
    headerPresets.value = res.data ?? { groups: {}, flat: [] };
  } catch {
    headerPresets.value = { groups: {}, flat: [] };
  }
}

/** 一键填入全部预置特征 */
function handleHeaderFillPresets(): void {
  const flat = headerPresets.value.flat ?? [];
  if (!flat.length) {
    ElMessage.warning(t("policy.header.errPresets"));
    return;
  }
  headerForm.value.patternsText = flat.join("\n");
  ElMessage.success(t("policy.header.presetFilled", { count: flat.length }));
}

function handleHeaderAdd(): void {
  headerIsEdit.value = false;
  headerForm.value = {
    sysPolicyConfigId: null,
    headerName: "User-Agent",
    matchType: "CONTAINS",
    patternsText: "",
    blockStatus: 403,
    message: t("policy.header.defaultMessage"),
    status: 1,
    remark: "",
  };
  headerDialogVisible.value = true;
}

function handleHeaderEdit(row: Record<string, unknown>): void {
  const r = row as HeaderRuleRow;
  headerIsEdit.value = true;
  headerForm.value = {
    sysPolicyConfigId: r.sysPolicyConfigId ?? null,
    headerName: r.headerName ?? "User-Agent",
    matchType: r.matchType ?? "CONTAINS",
    patternsText: (r.patterns ?? []).join("\n"),
    blockStatus: r.blockStatus ?? 403,
    message: r.message ?? "",
    status: r.status ?? 1,
    remark: r.remark ?? "",
  };
  headerDialogVisible.value = true;
}

/** 规则体（config 字段） */
function headerRuleConfig(): string {
  return JSON.stringify({
    matchType: headerForm.value.matchType,
    patterns: headerPatternsOf(headerForm.value.patternsText),
    action: "BLOCK",
    status: headerForm.value.blockStatus,
    message: headerForm.value.message,
  });
}

async function handleHeaderSubmit(): Promise<void> {
  const headerName = headerForm.value.headerName.trim();
  if (!headerName) {
    ElMessage.warning(t("policy.header.errNameBlank"));
    return;
  }
  const patterns = headerPatternsOf(headerForm.value.patternsText);
  if (!patterns.length) {
    ElMessage.warning(t("policy.header.errPatternsEmpty"));
    return;
  }
  const payload: PolicyConfig = {
    type: "HEADER",
    bizKey: headerName,
    dimension: "",
    listType: 0,
    status: headerForm.value.status,
    config: headerRuleConfig(),
    remark: headerForm.value.remark,
  };
  if (headerIsEdit.value && headerForm.value.sysPolicyConfigId != null) {
    payload.sysPolicyConfigId = headerForm.value.sysPolicyConfigId;
  }
  headerSaving.value = true;
  try {
    if (headerIsEdit.value && payload.sysPolicyConfigId != null) {
      await updatePolicyConfig(payload);
      ElMessage.success(t("policy.header.saved"));
    } else {
      await savePolicyConfig(payload);
      ElMessage.success(t("policy.header.created"));
    }
    headerDialogVisible.value = false;
    await headerTableRef.value?.reload();
    void loadHitCounts();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.saveFailed"));
  } finally {
    headerSaving.value = false;
  }
}

async function handleHeaderToggle(row: Record<string, unknown>, value: boolean | string | number): Promise<void> {
  const r = row as HeaderRuleRow;
  if (r.sysPolicyConfigId == null) {
    return;
  }
  headerToggleLoadingId.value = r.sysPolicyConfigId;
  try {
    await togglePolicyConfig(r.sysPolicyConfigId, value ? 1 : 0);
    ElMessage.success(value ? t("policy.header.enabledNow") : t("policy.header.stoppedNow"));
    await headerTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.toggleFailed"));
  } finally {
    headerToggleLoadingId.value = null;
  }
}

async function handleHeaderDelete(row: Record<string, unknown>): Promise<void> {
  const r = row as HeaderRuleRow;
  if (r.sysPolicyConfigId == null) {
    return;
  }
  try {
    await ElMessageBox.confirm(t("policy.header.deleteBody", { name: r.headerName }), t("policy.common.deleteConfirm"), { type: "warning" });
  } catch {
    return;
  }
  headerDeleteLoadingId.value = r.sysPolicyConfigId;
  try {
    await deletePolicyConfig(r.sysPolicyConfigId);
    ElMessage.success(t("policy.header.deletedNow"));
    await headerTableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.deleteFailed"));
  } finally {
    headerDeleteLoadingId.value = null;
  }
}

/** 重新从库装载全部规则（手工改过库之后用） */
async function handleHeaderRefresh(): Promise<void> {
  try {
    const res = await refreshHeaderRules();
    ElMessage.success(t("policy.header.reloaded", { count: res.data?.policyCount ?? 0 }));
    await headerTableRef.value?.reload();
    void loadHitCounts();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.reloadFailed"));
  }
}

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
  { key: "hotreload", label: t("policy.overview.cards.hotreload.label"), value: overview.value.hotReloadTotal, unit: t("policy.overview.cards.hotreload.unit"), tone: "primary" },
  { key: "ratelimit", label: t("policy.overview.cards.ratelimit.label"), value: overview.value.rateTotal, unit: t("policy.overview.cards.ratelimit.unit"), tone: "warning" },
  { key: "blackwhite", label: t("policy.overview.cards.blackwhite.label"), value: overview.value.ipTotal + overview.value.accountTotal, unit: t("policy.overview.cards.blackwhite.unit"), tone: "success" },
  { key: "overview", label: t("policy.overview.cards.overview.label"), value: 4, unit: t("policy.overview.cards.overview.unit"), tone: "info" },
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
  if (activeMainTab.value === "gray") {
    await grayTabRef.value?.reload();
    return;
  }
  if (activeMainTab.value === "header") {
    await headerTableRef.value?.reload();
    void loadHitCounts();
    return;
  }
  if (activeMainTab.value === "route") {
    await routeTableRef.value?.reload();
    void loadHitCounts();
    return;
  }
  // 剩下只有「访问名单」，它内部还有 ip / account 两个子表
  if (bwTab.value === "ip") await ipTableRef.value?.reload();
  else await accTableRef.value?.reload();
  // 开关/增删会改变「是否生效」，统计要跟着变
  void loadHitCounts();
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
  // 四个带「命中次数」列的页签都要取一次统计映射
  if (tab === "ratelimit" || tab === "blackwhite" || tab === "header" || tab === "route") {
    void loadHitCounts();
  }
  // gray / route 两个页签的表格由 ReTable 自己挂载时调 loader，这里只标记已加载；
  // 再显式调一次 loadX() 会多打一遍接口（日志里每个动作出现两条同秒请求就是这个原因）。
  if (tab === "gray") {
    loadedMainTabs.value.gray = true;
  }
  if (tab === "header") {
    loadedMainTabs.value.header = true;
    void loadHeaderPresets();
  }
  if (tab === "route") {
    loadedMainTabs.value.route = true;
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
        <div class="policy-hero__title">{{ t("policy.hero.title") }}</div>
        <div class="policy-hero__subtitle">{{ t("policy.hero.subtitle") }}</div>
      </div>
      <div class="policy-hero__actions">
        <span class="policy-hero__sync"><i />{{ t("policy.hero.chainOk") }}</span>
        <ReButton
          layout="square"
          icon="Refresh"
          :loading="currentSectionLoading"
          @click="refreshCurrentSection"
        >
          {{ t("policy.hero.refresh") }}
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
        <em>{{ t("policy.hero.enterConfig") }}</em>
      </button>
    </div>

    <div class="policy-shell">
      <nav class="policy-nav" :aria-label="t('policy.nav.aria')">
        <span class="policy-nav__label">{{ t("policy.nav.workspace") }}</span>
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
          <span>{{ t("policy.common.current") }}</span>
          <b>{{ activeMainMeta.label }}</b>
        </div>
      </nav>

      <main class="policy-content">
        <!-- 总览 -->
        <section v-if="activeMainTab === 'overview'" class="policy-view">
          <div class="policy-view__head">
            <div>
              <span class="policy-section__eyebrow">POLICY PIPELINE</span>
              <h2>{{ t("policy.overview.chain") }}</h2>
              <p>{{ t("policy.overview.chainDesc") }}</p>
            </div>
            <ReButton layout="modern" icon="Refresh" :loading="overviewLoading" @click="loadOverview">
              {{ t("policy.overview.refreshStats") }}
            </ReButton>
          </div>

          <div class="policy-pipeline">
            <button type="button" class="policy-node is-primary" @click="handleMainTabChange('hotreload')">
              <span class="policy-node__step">01</span>
              <ReIcon name="Setting" size="20" />
              <b>{{ t("policy.overview.hotReload") }}</b>
              <small>{{ t("policy.overview.hotReloadCount", { count: overview.hotReloadTotal }) }}</small>
            </button>
            <span class="policy-pipeline__link" />
            <button type="button" class="policy-node is-warning" @click="handleMainTabChange('ratelimit')">
              <span class="policy-node__step">02</span>
              <ReIcon name="Stopwatch" size="20" />
              <b>{{ t("policy.overview.rateLimit") }}</b>
              <small>{{ t("policy.overview.rateCount", { enabled: overview.rateEnabled, total: overview.rateTotal }) }}</small>
            </button>
            <span class="policy-pipeline__link" />
            <button type="button" class="policy-node is-success" @click="handleMainTabChange('blackwhite')">
              <span class="policy-node__step">03</span>
              <ReIcon name="User" size="20" />
              <b>{{ t("policy.overview.blackwhite") }}</b>
              <small>{{ t("policy.overview.blackwhiteCount", { count: overview.ipTotal + overview.accountTotal }) }}</small>
            </button>
            <span class="policy-pipeline__link" />
            <div class="policy-node is-terminal">
              <span class="policy-node__step">04</span>
              <ReIcon name="CircleCheck" size="20" />
              <b>{{ t("policy.overview.passBlock") }}</b>
              <small>{{ t("policy.overview.passBlockDesc") }}</small>
            </div>
          </div>

          <div class="policy-overview-grid">
            <article class="policy-overview-card">
              <span class="policy-overview-card__icon is-warning"><el-icon :size="18"><Stopwatch /></el-icon></span>
              <div>
                <b>{{ t("policy.overview.rateRule") }}</b>
                <p>{{ t("policy.overview.rateRuleDesc") }}</p>
              </div>
              <ReButton layout="modern" @click="handleMainTabChange('ratelimit')">{{ t("policy.overview.manageRules") }}</ReButton>
            </article>
            <article class="policy-overview-card">
              <span class="policy-overview-card__icon is-primary"><el-icon :size="18"><Setting /></el-icon></span>
              <div>
                <b>{{ t("policy.overview.hotReloadBoundary") }}</b>
                <p>{{ t("policy.overview.hotReloadBoundaryDesc") }}</p>
              </div>
              <ReButton layout="modern" @click="handleMainTabChange('hotreload')">{{ t("policy.overview.manageConfig") }}</ReButton>
            </article>
            <article class="policy-overview-card">
              <span class="policy-overview-card__icon is-success"><el-icon :size="18"><User /></el-icon></span>
              <div>
                <b>{{ t("policy.overview.listPriority") }}</b>
                <p>{{ t("policy.overview.listPriorityDesc") }}</p>
              </div>
              <ReButton layout="modern" @click="handleMainTabChange('blackwhite')">{{ t("policy.overview.manageList") }}</ReButton>
            </article>
          </div>
        </section>

        <!-- 热更新 -->
        <section v-else-if="activeMainTab === 'hotreload'" class="policy-view">
          <div class="policy-view__head">
            <div>
              <span class="policy-section__eyebrow">HOT RELOAD</span>
              <h2>{{ t("policy.hotreload.title") }}</h2>
              <i18n-t keypath="policy.hotreload.desc" tag="p">
                <template #hotReload><code>hot_reload</code></template>
              </i18n-t>
            </div>
            <div class="policy-head-actions">
              <ReButton
                layout="modern"
                icon="Refresh"
                :loading="hotReloading"
                @click="handleHotReload"
              >
                {{ t("policy.hotreload.reloadNow") }}
              </ReButton>
              <ReButton layout="modern" type="primary" icon="Plus" @click="handleHrAdd">{{ t("policy.hotreload.add") }}</ReButton>
            </div>
          </div>

          <div class="policy-contract">
            <div class="policy-contract__icon"><el-icon :size="18"><InfoFilled /></el-icon></div>
            <div>
              <b>{{ t("policy.hotreload.contract") }}</b>
              <span>
                {{ t("policy.hotreload.contractDesc") }}
                <template v-if="hotReloadInfo">
                  {{ t("policy.hotreload.lastReload", { time: hotReloadInfo.reloadTime, count: hotReloadInfo.enabledCount }) }}
                </template>
              </span>
            </div>
            <ReTag effect="plain" round >POST /v2/policy/hotreload/reload</ReTag>
          </div>

          <ReTable
            :layout-switch="false"
            :data="hotReloadList"
            :columns="hrColumns"
            :loading="hotReloadLoading"
            :pagination="false"
            :toolbar-config="TABLE_TOOLBAR"
            row-key="sysSettingId"
            :empty-text="t('policy.hotreload.empty')"
          >
            <template #value="{ row }">
              <code class="policy-value">{{ (row as HotReloadConfig).sysSettingValue || "-" }}</code>
            </template>
            <template #type="{ row }">
              <ReTag effect="light" round >{{ (row as HotReloadConfig).sysSettingValueType || "string" }}</ReTag>
            </template>
            <template #action="{ row }">
              <ReButton layout="square" type="primary" icon="Edit" :tip="t('policy.common.editOf', { name: rowKeyOf(row) })" @click="handleHrEdit(row as HotReloadConfig)" />
            </template>
          </ReTable>
        </section>

        <!-- 限流 -->
        <section v-else-if="activeMainTab === 'ratelimit'" class="policy-view">
          <div class="policy-view__head">
            <div>
              <span class="policy-section__eyebrow">TRAFFIC CONTROL</span>
              <h2>{{ t("policy.nav.ratelimit.label") }}</h2>
              <p>{{ t("policy.rate.desc") }}</p>
            </div>
            <div class="policy-head-actions">
              <button
                type="button"
                class="policy-global-trigger"
                :class="{ 'is-on': globalConfig.enabled }"
                :aria-label="t('policy.rate.globalAria', { state: globalConfig.enabled ? t('policy.rate.on') : t('policy.rate.off') })"
                @click="globalDialogVisible = true"
              >
                <el-icon :size="18"><Setting /></el-icon>
                <span class="policy-global-trigger__body">
                  <small>{{ t("policy.rate.global") }}</small>
                  <b>{{ globalConfig.enabled ? t("policy.rate.on") : t("policy.rate.off") }}</b>
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
            <ReButton layout="modern" type="primary" icon="Plus" @click="handleRateAdd">{{ t("policy.rate.add") }}</ReButton>
          </div>

          <ReTable
            :layout-switch="false"
            :data="rateList"
            :columns="rateColumns"
            :loading="rateLoading"
            :pagination="false"
            :toolbar-config="TABLE_TOOLBAR"
            row-key="sysRateLimitRuleId"
            :empty-text="t('policy.rate.empty', { name: currentRateMeta.title })"
          >
            <template #status="{ row }">
              <ReSwitch
                layout="square"
                :model-value="(row as RateLimitRule).enabled === 1"
                :disabled="rateToggleLoadingId === (row as RateLimitRule).sysRateLimitRuleId"
                :aria-label="t('policy.common.enableOf', { name: (row as RateLimitRule).target ?? '' })"
                @update:model-value="(value: boolean | string | number) => handleRateToggle(row as RateLimitRule, value)"
              />
            </template>
            <template #hit="{ row }">
              <PolicyHitCell
                type="RATE_LIMIT"
                :hit-key="rateHitKey(row as RateLimitRule)"
                :label="t('policy.rate.hitTitle', { target: (row as RateLimitRule).target ?? '' })"
              />
            </template>
            <template #action="{ row }">
              <ReButton layout="square" type="primary" icon="Edit" :tip="t('policy.common.editOf', { name: rowKeyOf(row) })" @click="handleRateEdit(row as RateLimitRule)" />
              <ReButton
                layout="square"
                type="danger"
                icon="Delete"
                :tip="t('policy.common.deleteOf', { name: rowKeyOf(row) })"
                :loading="rateDeleteLoadingId === (row as RateLimitRule).sysRateLimitRuleId"
                @click="handleRateDelete(row as RateLimitRule)"
              />
            </template>
          </ReTable>
        </section>

        <!-- 黑白名单。用显式 v-else-if 而非 v-else：v-else 后面不能再挂 v-else-if，
             留出位置给后面的灰度/功能开关分支 -->
        <section v-else-if="activeMainTab === 'blackwhite'" class="policy-view">
          <div class="policy-view__head">
            <div>
              <span class="policy-section__eyebrow">ACCESS CONTROL</span>
              <h2>{{ t("policy.nav.blackwhite.label") }}</h2>
              <p>{{ t("policy.bw.desc") }}</p>
            </div>
            <ReButton
              layout="modern"
              type="primary"
              icon="Plus"
              @click="bwTab === 'ip' ? handleIpAdd() : handleAccAdd()"
            >
              {{ t("policy.bw.addRule", { kind: bwTab === "ip" ? " IP" : t("policy.nav.bw.account") }) }}
            </ReButton>
          </div>

          <ReTab v-model="bwTab" :tabs="bwTabs" variant="capsule" nav-only class="policy-subnav" @tab-change="isBlackWhiteLoaded" />

          <template v-if="bwTab === 'ip'">
            <ReTable
              :layout-switch="false"
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
              :empty-text="t('policy.bw.emptyIp')"
            >
              <template #type="{ row }">
                <ReTag :type="(row as SysIpBlackwhite).sysIpType === 0 ? 'success' : 'danger'" effect="light" round >
                  {{ (row as SysIpBlackwhite).sysIpType === 0 ? t("policy.common.whitelist") : t("policy.common.blacklist") }}
                </ReTag>
              </template>
              <template #status="{ row }">
                <ReTag :type="(row as SysIpBlackwhite).sysIpStatus === 0 ? 'success' : 'info'" effect="light" round >
                  {{ (row as SysIpBlackwhite).sysIpStatus === 0 ? t("policy.common.enable") : t("policy.common.disabled") }}
                </ReTag>
              </template>
              <template #hit="{ row }">
                <PolicyHitCell
                  :type="ipHitType((row as SysIpBlackwhite).sysIpType)"
                  :hit-key="(row as SysIpBlackwhite).sysIpIp ?? ''"
                  :label="t('policy.bw.hitTitleIp', { ip: (row as SysIpBlackwhite).sysIpIp ?? '' })"
                />
              </template>
              <template #action="{ row }">
                <ReButton layout="square" type="primary" icon="Edit" :tip="t('policy.common.editOf', { name: rowKeyOf(row) })" @click="handleIpEdit(row)" />
                <ReButton
                  layout="square"
                  type="danger"
                  icon="Delete"
                :tip="t('policy.common.deleteOf', { name: rowKeyOf(row) })"
                  :loading="ipDeleteLoadingId === (row as SysIpBlackwhite).sysIpId"
                  @click="handleIpDelete(row)"
                />
              </template>
            </ReTable>
          </template>

          <template v-else>
            <ReTable
              :layout-switch="false"
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
              :empty-text="t('policy.bw.emptyAccount')"
            >
              <template #type="{ row }">
                <ReTag :type="(row as AccountBlackwhite).type === 2 ? 'success' : 'danger'" effect="light" round >
                  {{ (row as AccountBlackwhite).type === 2 ? t("policy.common.whitelist") : t("policy.common.blacklist") }}
                </ReTag>
              </template>
              <template #status="{ row }">
                <ReTag :type="(row as AccountBlackwhite).status === 1 ? 'success' : 'info'" effect="light" round >
                  {{ (row as AccountBlackwhite).status === 1 ? t("policy.common.enable") : t("policy.common.disabled") }}
                </ReTag>
              </template>
              <template #hit="{ row }">
                <PolicyHitCell
                  :type="accHitType((row as AccountBlackwhite).type)"
                  :hit-key="(row as AccountBlackwhite).account ?? ''"
                  :label="t('policy.bw.hitTitleAccount', { account: (row as AccountBlackwhite).account ?? '' })"
                />
              </template>
              <template #action="{ row }">
                <ReButton layout="square" type="primary" icon="Edit" :tip="t('policy.common.editOf', { name: rowKeyOf(row) })" @click="handleAccEdit(row)" />
                <ReButton
                  layout="square"
                  type="danger"
                  icon="Delete"
                :tip="t('policy.common.deleteOf', { name: rowKeyOf(row) })"
                  :loading="accDeleteLoadingId === (row as AccountBlackwhite).sysAccountBwId"
                  @click="handleAccDelete(row)"
                />
              </template>
            </ReTable>
          </template>
        </section>

        <!-- 消息头拦截（UA / 爬虫 / 自动化） -->
        <section v-else-if="activeMainTab === 'header'" class="policy-view">
          <div class="policy-view__head">
            <div>
              <span class="policy-section__eyebrow">HEADER POLICY</span>
              <h2>{{ t("policy.nav.header.label") }}</h2>
              <i18n-t keypath="policy.header.desc" tag="p">
                <template #ua><code>User-Agent</code></template>
                <template #immediate><b>{{ t("policy.header.termImmediate") }}</b></template>
              </i18n-t>
            </div>
            <div class="policy-view__actions">
              <ReButton layout="modern" icon="Refresh" @click="handleHeaderRefresh">{{ t("policy.header.reload") }}</ReButton>
              <ReButton layout="modern" type="primary" icon="Plus" @click="handleHeaderAdd">{{ t("policy.header.add") }}</ReButton>
            </div>
          </div>

          <div class="policy-contract">
            <div class="policy-contract__icon"><el-icon :size="18"><InfoFilled /></el-icon></div>
            <div>
              <b>{{ t("policy.header.ruleTitle") }}</b>
              <span>
                <i18n-t keypath="policy.header.ruleDesc" tag="span">
                  <template #bot><code>Googlebot</code></template>
                  <template #headless><code>HeadlessChrome</code></template>
                  <template #python><code>python-requests</code></template>
                  <template #before><b>{{ t("policy.header.termBefore") }}</b></template>
                  <template #pass><b>{{ t("policy.header.termPass") }}</b></template>
                </i18n-t>
              </span>
            </div>
            <ReTag effect="plain" round size="small">/v2/policy/header/list</ReTag>
          </div>

          <ReTable
            :layout-switch="false"
            ref="headerTableRef"
            table-id="policy-header"
            :loader="loadHeaders"
            :columns="headerColumns"
            :pagination="true"
            :total="headerTotal"
            v-model:page="headerPage"
            v-model:page-size="headerPageSize"
            :toolbar-config="TABLE_TOOLBAR"
            row-key="sysPolicyConfigId"
            :empty-text="t('policy.header.empty')"
          >
            <template #matchType="{ row }">
              <ReTag effect="light" round size="small" :type="(row as HeaderRuleRow).parsed === false ? 'danger' : 'info'">
                {{ headerMatchOptions.find((o) => o.value === (row as HeaderRuleRow).matchType)?.label ?? t("policy.header.match.CONTAINS.label") }}
              </ReTag>
            </template>
            <template #patterns="{ row }">
              <span class="policy-header-patterns">
                {{ ((row as HeaderRuleRow).patterns ?? []).join("、") || "-" }}
              </span>
            </template>
            <template #hit="{ row }">
              <PolicyHitCell
                type="HEADER"
                :hit-key="headerHitKeyOf(row as HeaderRuleRow)"
                :count="headerHitCount(row as HeaderRuleRow)"
                :label="t('policy.header.hitTitle', { name: (row as HeaderRuleRow).headerName ?? '' })"
              />
            </template>
            <template #status="{ row }">
              <ReSwitch
                layout="square"
                :model-value="(row as HeaderRuleRow).status === 1"
                :disabled="headerToggleLoadingId === (row as HeaderRuleRow).sysPolicyConfigId"
                :aria-label="t('policy.common.activeOf', { name: (row as HeaderRuleRow).headerName ?? '' })"
                @update:model-value="(v: boolean | string | number) => handleHeaderToggle(row, v)"
              />
            </template>
            <template #action="{ row }">
              <ReButton layout="square" type="primary" icon="Edit" :tip="t('policy.common.editOf', { name: (row as HeaderRuleRow).headerName ?? '' })" @click="handleHeaderEdit(row)" />
              <ReButton
                layout="square"
                type="danger"
                icon="Delete"
                :tip="t('policy.common.deleteOf', { name: (row as HeaderRuleRow).headerName ?? '' })"
                :loading="headerDeleteLoadingId === (row as HeaderRuleRow).sysPolicyConfigId"
                @click="handleHeaderDelete(row)"
              />
            </template>
          </ReTable>
        </section>

        <!-- 灰度配置 -->
        <PolicyGrayTab v-else-if="activeMainTab === 'gray'" ref="grayTabRef" />

        <section v-else-if="activeMainTab === 'route'" class="policy-view">
          <div class="policy-view__head">
            <div>
              <span class="policy-section__eyebrow">API ROUTE</span>
              <h2>{{ t("policy.nav.route.label") }}</h2>
              <p>{{ t("policy.route.desc") }}</p>
            </div>
            <div class="policy-view__actions">
              <ReButton
                layout="modern"
                :loading="routeRefreshLoading"
                icon="Refresh"
                @click="handleRouteRefresh"
              >
                {{ t("policy.route.reloadIndex") }}
              </ReButton>
              <ReButton layout="modern" type="primary" icon="Plus" @click="handleRouteAdd">{{ t("policy.route.add") }}</ReButton>
            </div>
          </div>

          <div class="policy-contract">
            <div class="policy-contract__icon"><el-icon :size="18"><InfoFilled /></el-icon></div>
            <div>
              <b>{{ t("policy.route.forwardTitle") }}</b>
              <span>
                <i18n-t keypath="policy.route.forwardDesc" tag="span">
                  <template #requestMapping><code>@RequestMapping</code></template>
                  <template #byPath><b>{{ t("policy.route.termByPath") }}</b></template>
                  <template #getPost><code>GET/POST</code></template>
                </i18n-t>
              </span>
              <template v-if="routeIndexCount">
                {{ t("policy.route.indexCount", { indexed: routeIndexCount, total: routeTotal }) }}
              </template>
            </div>
            <ReTag effect="plain" round >/v2/policy/api-route/targets</ReTag>
          </div>

          <div class="policy-contract">
            <div class="policy-contract__icon"><el-icon :size="18"><InfoFilled /></el-icon></div>
            <div>
              <b>{{ t("policy.route.stateLegendTitle") }}</b>
              <span>{{ t("policy.route.stateLegend") }}</span>
            </div>
          </div>

          <div class="policy-route-search">
            <ReInput
              v-model="routeQuery.keyword"
              layout="modern"
              clearable
              :placeholder="t('policy.route.phFilter')"
              :aria-label="t('policy.route.filterAria')"
              @keyup.enter="handleRouteSearch"
              @clear="handleRouteSearch"
            />
            <ReButton layout="modern" icon="Search" @click="handleRouteSearch">{{ t("policy.route.query") }}</ReButton>
          </div>

          <ReTable
            :layout-switch="false"
            ref="routeTableRef"
            table-id="policy-api-route"
            :loader="loadRoute"
            :columns="routeColumns"
            :pagination="true"
            :params="routeQuery"
            row-key="path"
            :total="routeTotal"
            v-model:page="routeQuery.page"
            v-model:page-size="routeQuery.pageSize"
            :toolbar-config="TABLE_TOOLBAR"
            :empty-text="t('policy.route.empty')"
          >

            <template #method="{ row }">
              <ReTag effect="plain" round :type="routeMethodTagType(row as unknown as ApiRouteRow)">
                {{ (row as unknown as ApiRouteRow).method }}
              </ReTag>
            </template>
            <template #actionText="{ row }">
              <div class="policy-route-state">
                <ReTag :type="(row as unknown as ApiRouteRow).effectiveTagType" effect="light" round>
                  {{ (row as unknown as ApiRouteRow).effectiveText }}
                </ReTag>
                <span class="policy-route-state__note" :title="(row as unknown as Record<string, unknown>).stateNote as string">
                  {{ (row as unknown as Record<string, unknown>).stateNote }}
                </span>
              </div>
            </template>
            <template #hit="{ row }">
              <PolicyHitCell
                type="API_ROUTE"
                :hit-key="(row as unknown as ApiRouteRow).path"
                :label="t('policy.route.hitTitle', { path: (row as unknown as ApiRouteRow).path })"
              />
            </template>
            <template #status="{ row }">
              <div
                v-if="(row as unknown as ApiRouteRow).policyId != null"
                class="policy-route-status"
              >
                <ReSwitch
                  layout="square"
                  :model-value="(row as unknown as ApiRouteRow).status === 1"
                  :disabled="routeToggleLoadingId === (row as unknown as ApiRouteRow).policyId"
                  :aria-label="t('policy.common.activeOf', { name: (row as unknown as ApiRouteRow).path })"
                  @update:model-value="(v: boolean | string | number) => handleRouteToggle(row as unknown as ApiRouteRow, v)"
                />
                <span class="policy-route-status__text">
                  {{ (row as unknown as ApiRouteRow).status === 1
                    ? t("policy.route.stateRuleOn")
                    : t("policy.route.stateRuleOff") }}
                </span>
              </div>
              <span v-else class="policy-route-unset">{{ t("policy.common.notConfigured") }}</span>
            </template>
            <template #action="{ row }">
              <ReButton layout="square" type="primary" icon="Setting" :tip="`${(row as unknown as ApiRouteRow).actionLabel} ${(row as unknown as ApiRouteRow).path}`" @click="handleRouteEdit(row as unknown as ApiRouteRow)" />
            </template>
          </ReTable>
        </section>
      </main>
    </div>


    <!-- 命中明细弹窗：五个页签共用，状态由 usePolicyHit provide -->
    <PolicyHitDialog />

    <!-- 消息头拦截规则弹窗 -->
    <ReDialog
      v-model="headerDialogVisible"
      :title="headerIsEdit ? t('policy.header.form.dialogEdit') : t('policy.header.form.dialogAdd')"
      width="720px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
    >
      <el-form label-width="110px" label-position="right">
        <el-form-item :label="t('policy.header.form.name')" required>
          <ReInput
            v-model="headerForm.headerName"
            layout="modern"
            maxlength="128"
            :disabled="headerIsEdit"
            placeholder="User-Agent"
          />
          <i18n-t keypath="policy.header.form.nameDesc" tag="p" class="policy-form-tip">
            <template #ua><code>User-Agent</code></template>
          </i18n-t>
        </el-form-item>
        <el-form-item :label="t('policy.header.form.matchType')">
          <el-radio-group v-model="headerForm.matchType">
            <el-radio v-for="opt in headerMatchOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</el-radio>
          </el-radio-group>
          <p class="policy-form-tip">{{ headerMatchHint }}</p>
        </el-form-item>
        <el-form-item :label="t('policy.header.form.patterns')" required>
          <ReInput
            v-model="headerForm.patternsText"
            layout="modern"
            type="textarea"
            :rows="8"
            :placeholder="t('policy.header.phPatterns')"
          />
          <div class="policy-header-preset">
            <ReButton layout="text" type="primary" icon="MagicStick" @click="handleHeaderFillPresets">
              {{ t("policy.header.presetFill", { count: headerPresets.flat.length }) }}
            </ReButton>
            <div v-if="Object.keys(headerPresets.groups).length" class="policy-header-preset__groups">
              <span v-for="(items, group) in headerPresets.groups" :key="group" class="policy-header-preset__group">
                <b>{{ group }}</b>
                <span>{{ items.join("、") }}</span>
              </span>
            </div>
          </div>
        </el-form-item>
        <el-form-item :label="t('policy.header.form.blockStatus')">
          <el-select
            v-model="headerForm.blockStatus"
            class="policy-header-status-select"
            :aria-label="t('policy.header.form.blockStatus')"
          >
            <el-option :value="403" :label="t('policy.header.form.blockDefault')" />
            <el-option :value="406" label="406 Not Acceptable" />
            <el-option :value="429" label="429 Too Many Requests" />
            <el-option :value="503" label="503 Service Unavailable" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('policy.header.form.message')">
          <ReInput
            v-model="headerForm.message"
            layout="modern"
            maxlength="200"
            :placeholder="t('policy.header.form.messagePh')"
            show-word-limit
          />
        </el-form-item>
        <el-form-item :label="t('policy.header.form.active')">
          <ReSwitch v-model="headerForm.status" layout="square" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item :label="t('policy.common.remark')">
          <ReInput v-model="headerForm.remark" layout="modern" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
        <i18n-t keypath="policy.header.form.desc" tag="p" class="policy-global-form__tip">
          <template #immediate><b>{{ t("policy.header.termImmediateAll") }}</b></template>
        </i18n-t>
      </el-form>
      <template #footer>
        <ReButton @click="headerDialogVisible = false">{{ t("policy.common.cancel") }}</ReButton>
        <ReButton
          type="primary"
          :loading="headerSaving"
          :disabled="headerSaving"
          @click="handleHeaderSubmit"
        >
          {{ t("policy.common.save") }}
        </ReButton>
      </template>
    </ReDialog>


    <!-- 全局限流配置弹窗 -->
    <ReDialog
      v-model="globalDialogVisible"
      :title="t('policy.rate.globalDialog.title')"
      width="560px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
    >
      <div class="policy-global-form">
        <div class="policy-global-form__row policy-global-form__row--switch">
          <div>
            <b>{{ t("policy.rate.globalDialog.enable") }}</b>
            <span>{{ t("policy.rate.globalDialog.enableDesc") }}</span>
          </div>
          <ReSwitch v-model="globalConfig.enabled" layout="square" :aria-label="t('policy.rate.globalDialog.enableAria')" />
        </div>
        <label class="policy-global-form__row">
          <b>{{ t("policy.rate.globalDialog.qps") }}</b>
          <ReInputNumber
            v-model="globalConfig.qps"
            :min="1"
            :precision="0"
            controls-position="right"
            :aria-label="t('policy.rate.globalDialog.qps')"
          />
        </label>
        <label class="policy-global-form__row">
          <b>{{ t("policy.rate.globalDialog.burst") }}</b>
          <ReInputNumber
            v-model="globalConfig.burstSize"
            :min="0"
            :precision="0"
            controls-position="right"
            :aria-label="t('policy.rate.globalDialog.burstAria')"
          />
        </label>
        <div class="policy-global-form__row">
          <b>{{ t("policy.rate.globalDialog.domain") }}</b>
          <ReTag effect="plain" round>global</ReTag>
        </div>
        <p class="policy-global-form__tip">
          {{ t("policy.rate.globalDialog.domainDesc") }}
        </p>
      </div>
      <template #footer>
        <ReButton @click="globalDialogVisible = false">{{ t("policy.common.cancel") }}</ReButton>
        <ReButton
          type="primary"
          :loading="globalApplying"
          :disabled="globalApplying"
          @click="handleApplyGlobalAndClose"
        >
          {{ t("policy.rate.globalDialog.apply") }}
        </ReButton>
      </template>
    </ReDialog>

    <!-- 热更新弹窗 -->
    <ReDialog
      v-model="hrDialogVisible"
      :title="hrIsEdit ? t('policy.hotreload.dialogEdit') : t('policy.hotreload.dialogAdd')"
      width="620px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="hrSaving"
      @ok="handleHrSubmit"
    >
      <el-form label-width="100px" :model="hrForm">
        <el-form-item :label="t('policy.hotreload.col.name')" required>
          <ReInput v-model="hrForm.sysSettingName" layout="modern" maxlength="100" :placeholder="t('policy.hotreload.phName')" />
        </el-form-item>
        <el-form-item :label="t('policy.hotreload.col.code')" required>
          <ReInput v-model="hrForm.sysSettingCode" layout="modern" maxlength="100" placeholder="feature.flag" />
        </el-form-item>
        <el-form-item :label="t('policy.hotreload.col.value')">
          <ReInput v-model="hrForm.sysSettingValue" layout="modern" type="textarea" :rows="3" :placeholder="t('policy.hotreload.phValue')" />
        </el-form-item>
        <el-form-item :label="t('policy.hotreload.formValueType')">
          <el-select v-model="hrForm.sysSettingValueType" style="width: 100%">
            <el-option :label="t('policy.hotreload.typeString')" value="string" />
            <el-option :label="t('policy.hotreload.typeNumber')" value="number" />
            <el-option :label="t('policy.hotreload.typeBoolean')" value="boolean" />
            <el-option label="JSON" value="json" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('policy.common.remark')">
          <ReInput v-model="hrForm.sysSettingRemark" layout="modern" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 限流规则弹窗 -->
    <ReDialog
      v-model="rateDialogVisible"
      :title="rateIsEdit ? t('policy.rate.dialogEdit') : t('policy.rate.dialogAdd')"
      width="580px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="rateSaving"
      @ok="handleRateSubmit"
    >
      <el-form label-width="100px" :model="rateForm">
        <el-form-item :label="t('policy.rate.dimLabel')">
          <el-select v-model="rateForm.dimension" style="width: 100%" :disabled="rateIsEdit">
            <el-option :label="t('policy.rate.dimInterface')" value="interface" />
            <el-option label="IP" value="ip" />
            <el-option :label="t('policy.rate.dimAccount')" value="account" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('policy.common.matchTarget')" required>
          <ReInput v-model="rateForm.target" layout="modern" maxlength="500" :placeholder="currentRateMeta.target" />
        </el-form-item>
        <el-form-item label="QPS">
          <ReInputNumber v-model="rateForm.qps" :min="1" :precision="0" controls-position="right" style="width: 100%" :aria-label="t('policy.rate.ruleQps')" />
        </el-form-item>
        <el-form-item :label="t('policy.common.burst')">
          <ReInputNumber v-model="rateForm.burstSize" :min="0" :precision="0" controls-position="right" style="width: 100%" :aria-label="t('policy.rate.ruleBurst')" />
        </el-form-item>
        <el-form-item :label="t('policy.rate.enableRule')">
          <div class="policy-switch-field">
            <ReSwitch
              layout="square"
              :model-value="rateForm.enabled === 1"
              :aria-label="t('policy.rate.enableRuleAria')"
              @update:model-value="(value: boolean | string | number) => (rateForm.enabled = value ? 1 : 0)"
            />
            <span>{{ rateForm.enabled === 1 ? t("policy.rate.keepEnabled") : t("policy.rate.keepDisabled") }}</span>
          </div>
        </el-form-item>
        <el-form-item :label="t('policy.common.remark')">
          <ReInput v-model="rateForm.remark" layout="modern" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- IP 规则弹窗 -->
    <ReDialog
      v-model="ipDialogVisible"
      :title="ipIsEdit ? t('policy.bw.dialogIpEdit') : t('policy.bw.dialogIpAdd')"
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
        <el-form-item :label="t('policy.common.listType')">
          <el-segmented
            v-model="ipForm.sysIpType"
            :options="[
              { label: t('policy.common.whitelist'), value: 0 },
              { label: t('policy.common.blacklist'), value: 1 },
            ]"
          />
        </el-form-item>
        <el-form-item :label="t('policy.common.status')">
          <el-segmented
            v-model="ipForm.sysIpStatus"
            :options="[
              { label: t('policy.common.enable'), value: 0 },
              { label: t('policy.common.disabled'), value: 1 },
            ]"
          />
        </el-form-item>
        <el-form-item :label="t('policy.common.remark')">
          <ReInput v-model="ipForm.sysIpRemark" layout="modern" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 账号规则弹窗 -->
    <ReDialog
      v-model="accDialogVisible"
      :title="accIsEdit ? t('policy.bw.dialogAccEdit') : t('policy.bw.dialogAccAdd')"
      width="580px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="accSaving"
      @ok="handleAccSubmit"
    >
      <el-form label-width="100px" :model="accForm">
        <el-form-item :label="t('policy.common.account')" required>
          <ReInput v-model="accForm.account" layout="modern" maxlength="100" :placeholder="t('policy.rate.meta.account.target')" />
        </el-form-item>
        <el-form-item :label="t('policy.common.listType')">
          <el-segmented
            v-model="accForm.type"
            :options="[
              { label: t('policy.common.blacklist'), value: 1 },
              { label: t('policy.common.whitelist'), value: 2 },
            ]"
          />
        </el-form-item>
        <el-form-item :label="t('policy.common.status')">
          <el-segmented
            v-model="accForm.status"
            :options="[
              { label: t('policy.common.enable'), value: 1 },
              { label: t('policy.common.disabled'), value: 0 },
            ]"
          />
        </el-form-item>
        <el-form-item :label="t('policy.common.remark')">
          <ReInput v-model="accForm.remark" layout="modern" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>


    <!-- 接口停用 / 转发弹窗 -->
    <ReDialog
      v-model="routeDialogVisible"
      :title="routeIsEdit ? t('policy.route.form.dialogEdit') : t('policy.route.form.dialogAdd')"
      width="620px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
    >
      <el-form label-width="110px" label-position="right">
        <el-form-item :label="t('policy.route.form.path')" required>
          <ReInput
            v-model="routeForm.bizKey"
            layout="modern"
            maxlength="255"
            :disabled="routeIsEdit"
            :placeholder="t('policy.route.form.pathPh')"
          />
        </el-form-item>
        <el-form-item :label="t('policy.route.form.action')" required>
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
          <el-form-item :label="t('policy.route.form.statusCode')">
            <div class="policy-route-status">
              <el-select
                v-model="routeRule.status"
                class="policy-route-status__select"
                :placeholder="t('policy.route.form.statusCodePh')"
                :aria-label="t('policy.route.form.statusCodeAria')"
              >
                <el-option
                  v-for="opt in ROUTE_STATUS_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <p class="policy-route-status__hint">{{ routeStatusHint }}</p>
            </div>
          </el-form-item>
          <el-form-item :label="t('policy.route.form.message')">
            <ReInput
              v-model="routeRule.message"
              layout="modern"
              maxlength="200"
              :placeholder="t('policy.route.form.messagePh')"
              show-word-limit
            />
          </el-form-item>
        </template>
        <el-form-item v-else :label="t('policy.route.form.target')" required>
          <el-select
            v-model="routeRule.targetKey"
            filterable
            :loading="routeTargetLoading"
            :placeholder="t('policy.route.form.targetPh')"
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
        <el-form-item :label="t('policy.common.active')">
          <ReSwitch v-model="routeForm.status" layout="square" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item :label="t('policy.common.remark')">
          <ReInput v-model="routeForm.remark" layout="modern" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
        <i18n-t keypath="policy.route.pathDesc" tag="p" class="policy-global-form__tip">
          <template #ctx><code>/system/api</code></template>
          <template #cannot><b>{{ t("policy.route.termCannot") }}</b></template>
        </i18n-t>
      </el-form>
      <template #footer>
        <div class="policy-dialog-footer">
          <ReButton
            v-if="routeIsEdit"
            type="danger"
            icon="Delete"
            :loading="routeDeleteLoadingId === routeForm.sysPolicyConfigId"
            :tip="t('policy.route.deleteRuleTip')"
            @click="handleRouteDeleteInDialog"
          >
            {{ t("policy.route.deleteRule") }}
          </ReButton>
          <div class="policy-dialog-footer__right">
            <ReButton @click="routeDialogVisible = false">{{ t("policy.common.cancel") }}</ReButton>
            <ReButton type="primary" :loading="routeSaving" :disabled="routeSaving" @click="handleRouteSubmit">
              {{ t("policy.common.save") }}
            </ReButton>
          </div>
        </div>
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

/* ==================== 接口管控：搜索行 + 视图卡片 ==================== */

/* 搜索行：输入框占满，按钮固定宽度 */
.policy-route-search {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.policy-route-search :deep(.rm-input),
.policy-route-search > :first-child {
  flex: 1;
  min-width: 0;
}

/* ==================== 消息头拦截 ==================== */

/* 特征可能有几十条，表格里只给一行，鼠标悬停看全文 */
.policy-header-patterns {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.policy-form-tip {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.policy-header-preset {
  margin-top: 6px;
}
.policy-header-preset__groups {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
  padding: 6px 8px;
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 4px);
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  max-height: 150px;
  overflow: auto;
}
.policy-header-preset__group b {
  color: var(--el-text-color-regular);
  margin-right: 4px;
}

.policy-header-status-select {
  width: 100%;
}

/* ==================== 命中统计 ==================== */

/* 表格里的命中次数做成可点文本：0 也可点（点开才知道是「没生效过」还是没数据） */
.policy-hit-cell {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.policy-hit {
  min-height: 120px;
}

.policy-hit__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}
.policy-hit__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-blank);
}
.policy-hit__stat b {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  /* 时间戳比数字长得多，不加会撑破卡片 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}
.policy-hit__stat span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.policy-hit__charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.policy-hit__chart {
  min-width: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  padding: 8px 10px 4px;
}
.policy-hit__chart h4 {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.policy-hit__sub {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.policy-hit__empty {
  margin: 0;
  padding: 16px;
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

@media (width <= 900px) {
  .policy-hit__charts { grid-template-columns: minmax(0, 1fr); }
}

/* 停用响应码：下拉 + 含义说明。说明文字比下拉更重要 —— 选错码会让客户端
   按错误语义重试或直接告警，所以必须让人一眼看到这个码代表什么 */
.policy-route-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}
.policy-route-status__select {
  width: 100%;
}
.policy-route-status__hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

/* 弹窗底部：删除靠左，保存/取消靠右，中间留空 */
.policy-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}
.policy-dialog-footer__right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

/* 「生效」列：状态标签 + 一句白话说明。
   标签只有四个短词（「未配置 / 未生效 / 已拦截 / 已转发」），光看标签仍要猜
   「我改的东西有没有在跑」；说明把三件事讲清 —— 有没有规则、规则在不在跑、命中会怎样。
   说明用普通灰而不是警示色：它是解释，不是又一层状态，避免和标签抢注意力。 */
.policy-route-state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
  text-align: left;
}
.policy-route-state__note {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.policy-route-unset {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
/* 「生效」列：开关 + 规则状态文字。
   开关只表达规则的 status，文字说明规则本身处于什么状态；
   接口的实际处境由「动作」列的有效状态标签表达，两者不混用。 */
.policy-route-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.policy-route-status__text {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

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
                                  