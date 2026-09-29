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
  pageForAccountBw,
  pageForIp,
  pagePolicyConfig,
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
  HotReloadConfig,
  PolicyConfig,
  RateLimitGlobal,
  RateLimitRule,
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
import PolicyHeaderTab from "./policy/tabs/PolicyHeaderTab.vue";
import PolicyRouteTab from "./policy/tabs/PolicyRouteTab.vue";
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
 *
 * <p>hitCountOf 曾经也在这份解构里，是消息头表格行内求 {@code headerHitCount}
 * 用的；那个页签拆成 {@code policy/tabs/PolicyHeaderTab.vue} 之后改由它自己
 * 注入，所以这里不再需要。留着会让人误以为父模板还要用。</p>
 *
 * <p><b>教训</b>：当时漏了它，渲染消息头表格的行时抛 ReferenceError ——
 * 而 Vue 的 patch 是同步的，nav 在 {@code <main>} 之前已经打好高亮，
 * {@code <main>} 的 patch 一旦抛错就被放弃，结果是「侧栏切了、内容没换」，
 * 浏览器里看不到任何报错。解构出来的名字用 {@code rg} 查得到、编译器也不报，
 * 只能靠单测（必须喂真实数据行）和浏览器双保险。</p>
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

/**
 * 已拆成独立组件的三个页签，表格都在各自组件内部。
 *
 * <p>这里只拿它们的 {@code reload}（组件已 defineExpose），供顶部「刷新」按钮
 * 统一调度 —— 刷新必须打到组件自己的 loader 上，直接调父组件的函数已经不存在了。</p>
 */
const grayTabRef = ref<TableReloadRef>();
const headerTabRef = ref<TableReloadRef>();
const routeTabRef = ref<TableReloadRef>();


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
    await headerTabRef.value?.reload();
    void loadHitCounts();
    return;
  }
  if (activeMainTab.value === "route") {
    await routeTabRef.value?.reload();
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
  // gray / header / route 三个页签的表格由 ReTable 自己挂载时调 loader，这里只标记已加载；
  // 再显式调一次 loadX() 会多打一遍接口（日志里每个动作出现两条同秒请求就是这个原因）。
  if (tab === "gray") {
    loadedMainTabs.value.gray = true;
  }
  if (tab === "header") {
    loadedMainTabs.value.header = true;
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

        <!-- 灰度配置 -->
        <PolicyGrayTab v-else-if="activeMainTab === 'gray'" ref="grayTabRef" />

        <!-- 消息头拦截 -->
        <PolicyHeaderTab v-else-if="activeMainTab === 'header'" ref="headerTabRef" />

        <!-- 接口管控 -->
        <PolicyRouteTab v-else-if="activeMainTab === 'route'" ref="routeTabRef" />
      </main>
    </div>


    <!-- 命中明细弹窗：五个页签共用，状态由 usePolicyHit provide -->
    <PolicyHitDialog />


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
        <div class="policy-global-form__row">
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
/* .policy-global-form__tip 已挪进 policyShared.scss：限流与消息头两个弹窗都用，
   两个页签各自独立之后没法再靠某一个组件的 scoped 块提供。 */

@media screen and (max-width: 1280px) {
  .policy-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .policy-shell { grid-template-columns: 188px minmax(0, 1fr); }
  .policy-pipeline { flex-wrap: wrap; }
  .policy-node { flex: 1 1 44%; }
  .policy-pipeline__link { display: none; }
  .policy-overview-grid { grid-template-columns: 1fr; }
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
  .policy-global-form__row { flex-direction: column; align-items: flex-start; }
  .policy-global-form__row :deep(.rm-input-number) { width: 100%; }
  .policy-node { flex: 1 1 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .policy-metric,
  button.policy-node { transition: none; }
}
</style>

<!--
  非 scoped：引入页签骨架的共享规则。

  上面的 <style scoped> 只对 PolicyTask.vue 自己模板里渲染的元素生效，拆到
  policy/tabs/*.vue、policy/components/*.vue 里的页签模板一条都匹配不上。
  共用规则因此放在 policy/policyShared.scss（全局），由各组件用非 scoped 的
  style 块引进来；本文件自己也要引，因为它自己也在渲染 .policy-view 等。
  归属与边界见 policyShared.scss 头部说明。
-->
<style lang="scss">
@use "./policy/policyShared.scss";
</style>
