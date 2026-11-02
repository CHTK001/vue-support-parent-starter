<script setup lang="ts">
/**
 * 接口管控（停用 / 转发）页签
 *
 * <p>这张表的<b>主语是路由</b>而不是策略：系统里每一条已注册路由都占一行，
 * 没配过策略的显示「放行」，配过的显示停用/转发及其详情。所以行 = 已注册路由
 * ∪ 仅有策略但路径不在注册表里的自定义行（见 {@link mergeApiRouteRows}）。</p>
 *
 * <p>状态、并集、过滤分页、弹窗都在本组件内闭环；命中次数走
 * {@link usePolicyHitContext} 注入的整页共享数据。</p>
 */
import { message } from "@repo/core";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessageBox } from "element-plus";
import { InfoFilled } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReDialog from "@repo/ui/re-dialog";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { RePageResult, ReTableColumn, ReTableLoadParams } from "@repo/ui/re-table";
import {
  deletePolicyConfig,
  listApiRouteTargets,
  pagePolicyConfig,
  refreshApiRoute,
  savePolicyConfig,
  togglePolicyConfig,
  updatePolicyConfig,
} from "../../../../api/systemApi";
import type { ApiRouteAction, ApiRouteRuleConfig, PolicyConfig, RegisteredRoute } from "../../../../api/types";
import { TABLE_TOOLBAR, useFirstLoadGuard } from "../shared/policyTable";
import { usePolicyHitContext } from "../composables/policyHitContext";
import PolicyHitCell from "../components/PolicyHitCell.vue";

const { t } = useI18n();
const { loadHitCounts } = usePolicyHitContext();
/** 首次 loader 返回前不展示空态，避免切进页签时闪一下「暂无接口管控规则」 */
const { ready, markReady } = useFirstLoadGuard();

interface TableReloadRef {
  reload: () => Promise<void> | void;
}

/** 路由管控视图的一行 */
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
  /**
   * 以下四个是 {@link decorateRow} 补上的展示派生字段，不是接口返回的。
   *
   * <p>必须写进接口类型：ReTable 的插槽行是 {@code Record<string, unknown>}，
   * 模板里 {@code (row as unknown as ApiRouteRow).effectiveText} 会按 ApiRouteRow
   * 查属性，类型里没有就报 TS2339。dev 不做类型检查，只有 build 的第一步
   * vue-tsc 才暴露。</p>
   */
  /** 是否已配置过规则（action !== "PASS"） */
  configured: boolean;
  /** 有效状态文案：放行 / 已拦截 / 已转发 / 未生效 / 未配置 */
  effectiveText: string;
  /** 有效状态标签色 */
  effectiveTagType: "danger" | "warning" | "info";
  /** 白话说明：有没有规则、规则在不在跑、命中会怎样 */
  stateNote: string;
  /** 操作文案：没配过是「配置」，配过是「编辑」 */
  actionLabel: string;
}

const tableRef = ref<TableReloadRef>();
const loading = ref(false);
const total = ref(0);
const toggleLoadingId = ref<number | null>(null);
const deleteLoadingId = ref<number | null>(null);
/** 已注册路由（转发目标候选，同时也是表格的行来源） */
const targets = ref<RegisteredRoute[]>([]);
const targetLoading = ref(false);
/** 全部 API_ROUTE 策略行（不分页，一次取完用于与路由表求并集） */
const policies = ref<PolicyConfig[]>([]);
const indexCount = ref(0);
const refreshLoading = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = ref<PolicyConfig>({});
const rule = ref<ApiRouteRuleConfig>({ action: "DISABLE", status: 503 });
const query = ref({ page: 1, pageSize: 20, keyword: "" });

const actions = computed<Array<{ label: string; value: ApiRouteAction }>>(() => [
  { label: t("policy.route.actionDisableLabel"), value: "DISABLE" },
  { label: t("policy.route.actionForwardLabel"), value: "FORWARD" },
]);

/**
 * 停用响应码候选
 *
 * <p>给成下拉而不是自由输入：一是这类值只有寥寥几个语义档位，手打容易写出
 * 客户端无法处理的码；二是下拉能顺带把含义讲清楚（见 subtitle）。</p>
 */
const statusOptions = computed<Array<{ value: number; label: string; hint: string }>>(() => [
  { value: 503, label: "503 Service Unavailable", hint: t("policy.status.503") },
  { value: 502, label: "502 Bad Gateway", hint: t("policy.status.502") },
  { value: 500, label: "500 Internal Server Error", hint: t("policy.status.500") },
  { value: 429, label: "429 Too Many Requests", hint: t("policy.status.429") },
  { value: 403, label: "403 Forbidden", hint: t("policy.status.403") },
  { value: 404, label: "404 Not Found", hint: t("policy.status.404") },
  { value: 401, label: "401 Unauthorized", hint: t("policy.status.401") },
]);

/** 当前响应码的说明文案（subtitle） */
const statusHint = computed(
  () => statusOptions.value.find((o) => o.value === rule.value.status)?.hint ?? t("policy.route.customStatusHint"),
);

/**
 * 接口管控列（表格布局）
 *
 * <p>「生效」列渲染的是 {@code effectiveText}（接口此刻的处境，action × status），
 * 不是 {@code actionText}（规则想做什么）—— 两者不是一回事，只显示后者会误导。
 * 该列同时带一句白话说明，单独一个说明列太宽，而说明脱离标签也没有意义。</p>
 */
const columns = computed<ReTableColumn[]>(() => [
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
function parseRule(config?: string): ApiRouteRuleConfig {
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
function actionTagType(action: ApiRouteAction): "danger" | "warning" | "info" {
  if (action === "DISABLE") {
    return "danger";
  }
  if (action === "FORWARD") {
    return "warning";
  }
  return "info";
}

/** HTTP 方法对应的标签色（只用于消歧，不表达严重程度） */
function methodTagType(row: ApiRouteRow): "primary" | "success" | "warning" | "danger" | "info" {
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
  const hit = targets.value.find((item) => item.key === targetKey);
  return hit ? `${hit.key}  (${hit.handler})` : targetKey;
}

/**
 * 求并集：已注册路由 ∪ 仅有策略的自定义路径
 *
 * <p>两个来源都要：只取注册路由会漏掉自定义路径写的策略（配了却看不见，
 * 管理员以为没生效）；只取策略又回到「只有配过的才显示」的老问题。
 * 以 {@code path} 为键合并，自定义行标记 {@code registered=false} 并在
 * handler 位置写明来源，避免「列表里这一行为什么没有处理方法」的疑问。</p>
 *
 * @returns 合并后的行集合
 */
function mergeApiRouteRows(): ApiRouteRow[] {
  const byPath = new Map<string, ApiRouteRow>();
  // 同一路径可能注册了多个方法（如 GET+POST），而停用/转发规则是<b>按路径</b>生效的
  // （执行器只用 path 查规则表），所以这里按 path 归并，方法合并成 GET/POST 一起显示；
  // 只显示其中一个方法会让人以为只封了那一个，实际两个都会被拦。
  const methodsOf = new Map<string, string[]>();
  for (const r of targets.value) {
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
        // 下面四个是展示派生字段，merge 阶段先占位，真正赋值在 decorateRow
        configured: false,
        effectiveText: "",
        effectiveTagType: "info",
        stateNote: "",
        actionLabel: "",
      });
    }
  }
  for (const [path, list] of methodsOf) {
    const row = byPath.get(path);
    if (row) {
      row.method = list.join("/");
    }
  }
  for (const p of policies.value) {
    const path = p.bizKey ?? "";
    if (!path) {
      continue;
    }
    const parsed = parseRule(p.config);
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
      // 同上：展示派生字段的占位，decorateRow 会覆盖
      configured: false,
      effectiveText: "",
      effectiveTagType: "info",
      stateNote: "",
      actionLabel: "",
    };
    row.policyId = p.sysPolicyConfigId;
    row.action = parsed.action;
    row.status = p.status ?? 0;
    row.statusCode = parsed.status;
    row.message = parsed.message;
    row.targetKey = parsed.targetKey;
    row.targetText = parsed.action === "FORWARD" ? resolveTargetText(parsed.targetKey) : "-";
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
function stateNoteOf(row: ApiRouteRow): string {
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

/** 给表格补上展示用的派生字段 */
function decorateRow(row: ApiRouteRow): Record<string, unknown> {
  const configured = row.action !== "PASS";
  const effective = effectiveStateOf(row);
  return {
    ...row,
    configured,
    /** 有效状态：接口此刻是放行 / 被拦 / 被转发（action × status） */
    effectiveText: effective.text,
    effectiveTagType: effective.type,
    /** 白话说明：有没有规则、规则在不在跑、命中会怎样 */
    stateNote: stateNoteOf(row),
    /** 表格统一用的操作文案：没配过就是「配置」 */
    actionLabel: configured ? t("policy.route.actionLabelEdit") : t("policy.route.actionLabelConfig"),
  };
}

/** 加载全部 API_ROUTE 策略行（不分页，用于与路由表求并集） */
async function loadPolicies(): Promise<void> {
  const res = await pagePolicyConfig({ type: "API_ROUTE", page: 1, pageSize: 1000 });
  policies.value = (res.data?.records ?? []) as PolicyConfig[];
}

/**
 * 加载已注册路由（一次取全量，不过滤）
 *
 * <p>keyword 过滤挪到 {@link load} 本地做：搜索框要和分页在<b>同一份</b>数据上联动，
 * 多打一次接口会出现「搜出来的条数」和「翻页翻到的内容」对不上的问题。</p>
 */
async function loadTargets(): Promise<void> {
  targetLoading.value = true;
  try {
    const res = await listApiRouteTargets();
    targets.value = res.data ?? [];
    indexCount.value = targets.value.length;
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.route.routesLoadFailed"));
  } finally {
    targetLoading.value = false;
  }
}

/**
 * 表格 loader：取全量 → 求并集 → 本地过滤/分页
 *
 * <p>过滤与分页都在前端做，因为数据源是「注册路由 ∪ 策略行」的并集，
 * 后端分页任一侧都会漏（只分页策略会漏掉未配置路由，只分页路由会漏掉自定义策略）。</p>
 *
 * @param params ReTable 传入的分页参数
 * @returns 分页结果
 */
async function load(params?: ReTableLoadParams): Promise<RePageResult> {
  loading.value = true;
  try {
    await Promise.all([loadTargets(), loadPolicies()]);
    const kw = query.value.keyword.trim().toLowerCase();
    let rows = mergeApiRouteRows();
    if (kw) {
      rows = rows.filter((r) =>
        [r.path, r.method, r.handler, r.key, r.remark].some((v) => String(v ?? "").toLowerCase().includes(kw)),
      );
    }
    const curPage = params?.page ?? query.value.page;
    const curSize = params?.pageSize ?? query.value.pageSize;
    const count = rows.length;
    const slice = rows.slice((curPage - 1) * curSize, curPage * curSize).map(decorateRow);
    total.value = count;
    return { total: count, data: slice as Record<string, unknown>[] };
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.route.loadFailed"));
    throw error;
  } finally {
    loading.value = false;
    markReady();
  }
}

/** 重新采集已注册路由并重载规则 */
async function handleRefresh(): Promise<void> {
  refreshLoading.value = true;
  try {
    const res = await refreshApiRoute();
    indexCount.value = res.data?.routeCount ?? 0;
    // 同步进表：后端重采了路由索引，前端这张表必须重新取一次并重排
    await tableRef.value?.reload();
    void loadHitCounts();
    message.success(t("policy.route.synced", { routes: res.data?.routeCount ?? 0, policies: res.data?.policyCount ?? 0 }));
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.common.reloadFailed"));
  } finally {
    refreshLoading.value = false;
  }
}

/** 关键词搜索（本地过滤，统一交给 loader） */
function handleSearch(): void {
  query.value.page = 1;
  void tableRef.value?.reload();
}

/** 新增规则：路径留空，由用户自定义填写 */
function handleAdd(): void {
  isEdit.value = false;
  form.value = { type: "API_ROUTE", dimension: "", listType: 0, status: 1, sort: 0 };
  rule.value = { action: "DISABLE", status: 503, message: t("policy.route.defaultMessage") };
  dialogVisible.value = true;
}

/**
 * 从行进入配置
 *
 * <p>未配过策略的路由也走这里：此时 {@code policyId} 为空，提交时按新增处理。
 * 所以「操作」列对「已配置」和「未配置」两类行是同一个入口，未配置时按钮文案是「配置」。</p>
 *
 * @param row 接口管控行
 */
function handleEdit(row: ApiRouteRow): void {
  const policy = row.policyId == null
    ? undefined
    : policies.value.find((p) => p.sysPolicyConfigId === row.policyId);
  isEdit.value = !!policy;
  form.value = policy
    ? { ...policy }
    : { type: "API_ROUTE", dimension: "", listType: 0, status: 1, sort: 0, bizKey: row.path };
  rule.value = policy
    ? parseRule(policy.config)
    : { action: "DISABLE", status: 503, message: t("policy.route.defaultMessage") };
  dialogVisible.value = true;
}

/**
 * 动作切换时补齐默认值
 *
 * <p>必须在这里把 {@code action} 本身写回去：单选组是 {@code :model-value} 单向绑定
 * （不是 v-model），emit 出来的 {@code update:model-value} 不会自动回写。
 * 只改 status/message/targetKey 而漏掉 action 的话，值永远停在 DISABLE，
 * v-if 不切换、单选框还会弹回停用 —— 编译和纯接口测试都发现不了。</p>
 *
 * @param action 新的动作
 */
function handleActionChange(action: ApiRouteAction): void {
  rule.value.action = action;
  if (action === "FORWARD") {
    rule.value.status = undefined;
    rule.value.message = undefined;
    rule.value.targetKey = rule.value.targetKey || targets.value[0]?.key;
  } else {
    rule.value.targetKey = undefined;
    rule.value.status = rule.value.status ?? 503;
    rule.value.message = rule.value.message ?? t("policy.route.defaultMessage");
  }
}

/** 保存规则（新增或更新） */
async function handleSubmit(): Promise<void> {
  if (!form.value.bizKey) {
    message.warning(t("policy.route.errPathBlank"));
    return;
  }
  if (!form.value.bizKey.startsWith("/")) {
    message.warning(t("policy.route.errPathSlash"));
    return;
  }
  if (rule.value.action === "FORWARD" && !rule.value.targetKey) {
    message.warning(t("policy.route.errTargetBlank"));
    return;
  }
  // 自定义路径是允许的（未注册的路径也能写规则），但要如实提示它的代价：
  // 停用/放行对未注册路径没有运行时意义，只有转发到别处才可能被人访问到。
  const known = targets.value.some((r) => r.path === form.value.bizKey);
  if (!known) {
    message.warning(t("policy.route.errPathUnknown"));
  }
  const payload: PolicyConfig = {
    ...form.value,
    type: "API_ROUTE",
    listType: 0,
    config: JSON.stringify(rule.value),
  };
  saving.value = true;
  try {
    if (isEdit.value) {
      await updatePolicyConfig(payload);
      message.success(t("policy.route.saved"));
    } else {
      await savePolicyConfig(payload);
      message.success(t("policy.route.created"));
    }
    dialogVisible.value = false;
    // 必须走 ReTable 实例的 reload()，不能直接调 load()：
    // 直接调只是重取数据并写回本地 ref，ReTable 不会因此重绘，
    // 表现为「保存成功但列表不刷新 / 切页后行消失」。与 IP 名单表保持同一机制。
    await tableRef.value?.reload();
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.common.saveFailed"));
  } finally {
    saving.value = false;
  }
}

/**
 * 切换接口管控规则的启停
 *
 * @param row 当前行
 * @param value 开关新值
 */
async function handleToggle(row: ApiRouteRow, value: boolean | string | number): Promise<void> {
  if (row.policyId == null) {
    message.warning(t("policy.route.errNotConfigured"));
    return;
  }
  toggleLoadingId.value = row.policyId;
  try {
    await togglePolicyConfig(row.policyId, value ? 1 : 0);
    // toast 必须说「接口」而不是「规则开关」：用户点这个开关是想改接口的处境。
    // 以前这里报「已停用」，而关掉一条 DISABLE 规则恰恰是让接口恢复，
    // 用户读到的是自己想要的反面结果，于是又点一次把接口重新拦了回去。
    // 关掉一律是「放行」；打开时按动作分「拦截」还是「转发」。
    const onText = row.action === "FORWARD" ? t("policy.route.toastForwardOn") : t("policy.route.toastBlocked");
    message.success(value ? onText : t("policy.route.toastAllowed"));
    await tableRef.value?.reload();
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.common.toggleFailed"));
  } finally {
    toggleLoadingId.value = null;
  }
}

/**
 * 删除一条接口管控规则（弹窗内调用）
 *
 * <p>删除后必须同时刷新 {@code policies}：表格行是由它合并出来的
 * （见 {@link mergeApiRouteRows}），只 reload 表格的话，合并用的还是内存里那份旧策略，
 * 已删除的规则会继续显示成「已配置」。</p>
 *
 * @param policyId 规则主键，未配置过时为空
 * @param path 路由路径，用于确认文案
 * @return 是否删除成功（取消或失败均为 false）
 */
async function deleteRule(policyId: number | null, path: string): Promise<boolean> {
  if (policyId == null) {
    message.warning(t("policy.route.errNothingToDelete"));
    return false;
  }
  try {
    await ElMessageBox.confirm(t("policy.route.deleteBody", { path }), t("policy.common.deleteConfirm"), { type: "warning" });
  } catch {
    return false;
  }
  deleteLoadingId.value = policyId;
  try {
    await deletePolicyConfig(policyId);
    message.success(t("policy.route.ruleDeleted"));
    await loadPolicies();
    await tableRef.value?.reload();
    return true;
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.common.deleteFailed"));
    return false;
  } finally {
    deleteLoadingId.value = null;
  }
}

/**
 * 弹窗内删除
 *
 * <p>破坏性操作从行内收进弹窗：一行原本有命中数、开关、配置、删除四个控件，
 * 其中删除几乎不用、点错又只能靠确认框兜底。放进弹窗后既能看清删的是哪条规则，
 * 行内也只剩「看数据 + 切开关 + 去配置」三件事。</p>
 */
async function handleDeleteInDialog(): Promise<void> {
  const id = form.value.sysPolicyConfigId ?? null;
  if (await deleteRule(id, form.value.bizKey ?? "")) {
    dialogVisible.value = false;
  }
}

defineExpose({ reload: () => tableRef.value?.reload() });
</script>

<template>
  <section class="policy-view">
    <div class="policy-view__head">
      <div>
        <span class="policy-section__eyebrow">API ROUTE</span>
        <h2>{{ t("policy.nav.route.label") }}</h2>
        <p>{{ t("policy.route.desc") }}</p>
      </div>
      <div class="policy-head-actions">
        <ReButton
          layout="modern"
          :loading="refreshLoading"
          icon="Refresh"
          @click="handleRefresh"
        >
          {{ t("policy.route.reloadIndex") }}
        </ReButton>
        <ReButton layout="modern" type="primary" icon="Plus" @click="handleAdd">{{ t("policy.route.add") }}</ReButton>
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
        <template v-if="indexCount">
          {{ t("policy.route.indexCount", { indexed: indexCount, total: total }) }}
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
        v-model="query.keyword"
        layout="modern"
        clearable
        :placeholder="t('policy.route.phFilter')"
        :aria-label="t('policy.route.filterAria')"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <ReButton layout="modern" icon="Search" @click="handleSearch">{{ t("policy.route.query") }}</ReButton>
    </div>

    <ReTable
      :layout-switch="false"
      ref="tableRef"
      table-id="policy-api-route"
      :loader="load"
      :columns="columns"
      :pagination="true"
      :params="query"
      row-key="path"
      :total="total"
      v-model:page="query.page"
      v-model:page-size="query.pageSize"
      :toolbar-config="TABLE_TOOLBAR"
      :empty-text="t('policy.route.empty')"
    >
      <template #method="{ row }">
        <ReTag effect="plain" round :type="methodTagType(row as unknown as ApiRouteRow)">
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
            :disabled="toggleLoadingId === (row as unknown as ApiRouteRow).policyId"
            :aria-label="t('policy.common.activeOf', { name: (row as unknown as ApiRouteRow).path })"
            @update:model-value="(v: boolean | string | number) => handleToggle(row as unknown as ApiRouteRow, v)"
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
        <ReButton layout="square" type="primary" icon="Setting" :tip="`${(row as unknown as ApiRouteRow).actionLabel} ${(row as unknown as ApiRouteRow).path}`" @click="handleEdit(row as unknown as ApiRouteRow)" />
      </template>
      <!-- 首次 loader 返回前不渲染空态：否则切进页签会先闪一下「暂无接口管控规则」，
           而 el-table 的 loading 遮罩是半透明的，遮不住它 -->
      <template #empty>
        <p v-if="ready" class="policy-table-empty">{{ t("policy.route.empty") }}</p>
      </template>
    </ReTable>

    <!-- 接口停用 / 转发弹窗 -->
    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? t('policy.route.form.dialogEdit') : t('policy.route.form.dialogAdd')"
      width="620px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
    >
      <el-form label-width="110px" label-position="right">
        <el-form-item :label="t('policy.route.form.path')" required>
          <ReInput
            v-model="form.bizKey"
            layout="modern"
            maxlength="255"
            :disabled="isEdit"
            :placeholder="t('policy.route.form.pathPh')"
            :aria-label="t('policy.route.form.path')"
          />
        </el-form-item>
        <el-form-item :label="t('policy.route.form.action')" required>
          <el-radio-group
            :model-value="rule.action"
            @update:model-value="(v: string | number | boolean | undefined) => handleActionChange(v as ApiRouteAction)"
          >
            <el-radio v-for="item in actions" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="rule.action === 'DISABLE'">
          <el-form-item :label="t('policy.route.form.statusCode')">
            <div class="policy-route-status">
              <el-select
                v-model="rule.status"
                class="policy-route-status__select"
                :placeholder="t('policy.route.form.statusCodePh')"
                :aria-label="t('policy.route.form.statusCodeAria')"
              >
                <el-option
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <p class="policy-route-status__hint">{{ statusHint }}</p>
            </div>
          </el-form-item>
          <el-form-item :label="t('policy.route.form.message')">
            <ReInput
              v-model="rule.message"
              layout="modern"
              maxlength="200"
              :placeholder="t('policy.route.form.messagePh')"
              show-word-limit
              :aria-label="t('policy.route.form.message')"
            />
          </el-form-item>
        </template>
        <el-form-item v-else :label="t('policy.route.form.target')" required>
          <el-select
            v-model="rule.targetKey"
            filterable
            :loading="targetLoading"
            :placeholder="t('policy.route.form.targetPh')"
            style="width: 100%"
            :aria-label="t('policy.route.form.target')"
          >
            <el-option
              v-for="item in targets"
              :key="item.key"
              :label="`${item.key}   (${item.handler})`"
              :value="item.key"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('policy.common.active')">
          <ReSwitch v-model="form.status" layout="square" :active-value="1" :inactive-value="0" :aria-label="t('policy.common.active')" />
        </el-form-item>
        <el-form-item :label="t('policy.common.remark')">
          <ReInput v-model="form.remark" layout="modern" type="textarea" :rows="2" maxlength="500" show-word-limit :aria-label="t('policy.common.remark')" />
        </el-form-item>
        <i18n-t keypath="policy.route.pathDesc" tag="p" class="policy-global-form__tip">
          <template #ctx><code>/system/api</code></template>
          <template #cannot><b>{{ t("policy.route.termCannot") }}</b></template>
        </i18n-t>
      </el-form>
      <template #footer>
        <div class="policy-dialog-footer">
          <ReButton
            v-if="isEdit"
            type="danger"
            icon="Delete"
            :loading="deleteLoadingId === form.sysPolicyConfigId"
            :tip="t('policy.route.deleteRuleTip')"
            @click="handleDeleteInDialog"
          >
            {{ t("policy.route.deleteRule") }}
          </ReButton>
          <div class="policy-dialog-footer__right">
            <ReButton @click="dialogVisible = false">{{ t("policy.common.cancel") }}</ReButton>
            <ReButton type="primary" :loading="saving" :disabled="saving" @click="handleSubmit">
              {{ t("policy.common.save") }}
            </ReButton>
          </div>
        </div>
      </template>
    </ReDialog>
  </section>
</template>

<style lang="scss">
/* 非 scoped：页签骨架由各页签共用，规则必须一致，放在共享表里一起引。 */
@use "../policyShared.scss";
</style>

<style scoped>
/* 以下都是接口管控独有的版式。原先写在 PolicyTask.vue 的 scoped 块里，
   组件拆出来之后父级的 scoped 选择器一条都匹配不上，必须跟着组件走。 */

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
  color: var(--text-secondary, var(--el-text-color-secondary));
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
  color: var(--text-primary, var(--el-text-color-regular));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.policy-route-unset {
  font-size: 12px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
/* 「生效」列：开关 + 规则状态文字。   开关只表达规则的 status，文字说明规则本身处于什么状态；
   接口的实际处境由「动作」列的有效状态标签表达，两者不混用。 */
.policy-route-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.policy-route-status__text {
  font-size: 12px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  white-space: nowrap;
}
</style>
