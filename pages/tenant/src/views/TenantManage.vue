<script setup lang="ts">
/**
 * 租户管理页面
 *
 * 租户分页查询 + 新增/编辑/删除/启用禁用/重置密码。
 * 全部使用 ReXxx modern 组件渲染，风格对齐 UserManage.vue。
 */
import { getGlobalSocketService, message } from "@repo/core";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { pageForTenant, updateTenant, deleteTenant, dropTenantDatabase, updateTenantStatus, resetTenantPassword, getTenant, listForTenant, tenantProvisionCapabilities, startTenantProvision, cancelTenantProvision, tenantProvisionStatus, getTenantEndpoint, tenantDatasourceOptions } from "@pages/system/api/systemApi";
import type { SysTenant, TenantDatasourceOption, TenantEndpointInfo } from "@pages/system/api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import ReProgressDialog, { type ProgressSnapshot, type ProgressStep } from "@repo/ui/re-progress-dialog";
import ServiceCatalogPanel from "@pages/system/views/components/ServiceCatalogPanel.vue";
import TenantServiceBindDialog from "@pages/system/views/components/TenantServiceBindDialog.vue";

const tenantStatusOptions = [
  { label: "启用", value: 0 },
  { label: "禁用", value: 1 },
] as const;

const query = ref<{
  page: number;
  pageSize: number;
  sysTenantName?: string;
  sysTenantUsername?: string;
  sysTenantPhone?: string;
  sysTenantStatus?: number;
}>({
  page: 1,
  pageSize: 10,
});

async function loadTenants({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForTenant({
    page,
    pageSize,
    sysTenantName: (params.sysTenantName as string) || undefined,
    sysTenantUsername: (params.sysTenantUsername as string) || undefined,
    sysTenantPhone: (params.sysTenantPhone as string) || undefined,
    // 状态下拉「未选择」时 ReTable 回传的是空串，不能直接当 number 比较：
    // 先按原始值判空，再转数字，0（启用）才不会被当成空值丢掉。
    sysTenantStatus:
      params.sysTenantStatus === "" || params.sysTenantStatus === undefined
        ? undefined
        : Number(params.sysTenantStatus),
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const tableRef = ref();
const statusLoading = ref<string>("");
const deleteLoading = ref<string>("");
const dropDbLoading = ref<string>("");
const resetPasswordLoading = ref<string>("");

function handleReset() {
  query.value = { page: 1, pageSize: 10 };
  tableRef.value?.reload();
}

/** 空态「刷新」与表格工具栏共用：回到第一页重新拉取 */
function reload() {
  query.value = { ...query.value, page: 1 };
  tableRef.value?.reload();
}

const searchFilters = computed(() => [
  { key: "sysTenantName", label: "租户名称", type: "input" as const, placeholder: "请输入" },
  { key: "sysTenantUsername", label: "租户账号", type: "input" as const, placeholder: "请输入" },
  { key: "sysTenantPhone", label: "手机号", type: "input" as const, placeholder: "请输入" },
  {
    key: "sysTenantStatus", label: "状态", type: "select" as const, placeholder: "请选择",
    options: [
      { label: "启用", value: 0 },
      { label: "禁用", value: 1 },
    ],
  },
]);

const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = ref<SysTenant>({ sysTenantStatus: 0, sysTenantDelete: 0 });

/* ---------------- 租户库实例来源 ----------------
 * 实例来源有两种：自填（存量行为，每个租户自己填地址/端口/账号/口令）；
 * 引用现成实例（平台自身实例或数据源中心台账里的 jdbc 数据源），此时只需填库名。
 * 下拉项由平台代理数据源台账下发，不含口令。
 */
const datasourceOptions = ref<TenantDatasourceOption[]>([]);
const datasourceLoading = ref(false);

/** 是否引用了现成实例（-1=平台自身，>0=台账）：地址/端口/账号/口令全部来自实例 */
const useSharedInstance = computed(() => {
  const id = form.value.sysTenantDatasourceId;
  return id !== null && id !== undefined && Number(id) !== 0;
});

/** 所选项在实例侧给出的地址与端口（自填时为空） */
const sharedEndpoint = computed(() => {
  const id = form.value.sysTenantDatasourceId;
  if (id === null || id === undefined) return { host: "", port: null as number | null };
  const option = datasourceOptions.value.find((item) => item.id === Number(id));
  return { host: option?.host ?? "", port: option?.port ?? null };
});

/** 加载实例来源下拉项；失败时退化为只有「自填」，表单仍可用 */
async function loadDatasourceOptions() {
  datasourceLoading.value = true;
  try {
    const res = await tenantDatasourceOptions();
    datasourceOptions.value = res?.data ?? [];
  } catch {
    datasourceOptions.value = [{ id: 0, name: "由租户自己填写实例信息", type: "manual" }];
  } finally {
    datasourceLoading.value = false;
  }
}

const pwdForm = ref({ sysTenantId: "", sysTenantPassword: "admin123456" });
const pwdDialogVisible = ref(false);

const listForSelect = ref<SysTenant[]>([]);

/** 页签：租户列表 / 服务目录（服务是租户域的一部分，放同一页避免多一个菜单） */
const activeTab = ref("tenant");

/** 分配服务弹窗 */
const bindVisible = ref(false);
const bindTenant = ref<SysTenant>({});

function handleBindService(row: Record<string, unknown>) {
  bindTenant.value = { ...(row as unknown as SysTenant) };
  bindVisible.value = true;
}

function handleBindSuccess() {
  tableRef.value?.reload();
}

/* ================== 租户服务地址（租户端启动自报 / 人工登记） ================== */

/** 地址弹窗：回答「这个租户的请求该打到哪台服务器」，来源可分同步注册与人工登记 */
const endpointVisible = ref(false);
const endpointLoading = ref(false);
const endpointError = ref("");
const endpointInfo = ref<TenantEndpointInfo | null>(null);
const endpointTenant = ref<SysTenant>({});

async function loadEndpoint() {
  const tenantId = endpointTenant.value.sysTenantId;
  if (!tenantId) return;
  endpointLoading.value = true;
  endpointError.value = "";
  try {
    const res = await getTenantEndpoint(tenantId);
    endpointInfo.value = (res?.data ?? null) as TenantEndpointInfo | null;
  } catch (e) {
    endpointInfo.value = null;
    endpointError.value = (e as Error)?.message ?? "查询失败";
  } finally {
    endpointLoading.value = false;
  }
}

function handleEndpoint(row: Record<string, unknown>) {
  endpointTenant.value = { ...(row as unknown as SysTenant) };
  endpointInfo.value = null;
  endpointError.value = "";
  endpointVisible.value = true;
  void loadEndpoint();
}

/** 地址来源的中文说明：同步注册是租户端启动时自己报上来的，人工登记没有存活证明 */
function endpointSourceText(info: TenantEndpointInfo | null) {
  if (!info) return "未登记";
  return info.source === "sync" ? "同步注册（租户端启动自报）" : "人工登记（sys_tenant_home_url）";
}

function handleAdd() {
  isEdit.value = false;
  // 独立库地址默认与平台同机同端口：租户创建表单里最常填的是库名，
  // 让地址/端口留空会让后端判定「未登记库地址」直接跳过建库建表。
  form.value = {
    sysTenantStatus: 0,
    sysTenantDelete: 0,
    sysTenantHost: "127.0.0.1",
    sysTenantPort: 3306,
    // 0 = 自填，与存量行为一致；要复用平台自身实例或台账实例时在表单里改
    sysTenantDatasourceId: 0,
  };
  dialogVisible.value = true;
  void loadDatasourceOptions();
}

function handleEdit(row: Record<string, unknown>) {
  isEdit.value = true;
  form.value = { ...(row as unknown as SysTenant) };
  dialogVisible.value = true;
  void loadDatasourceOptions();
}

/** 下拉列表（新增/编辑弹窗中分配菜单选择用） */
async function loadSelectOptions() {
  try {
    const res = await listForTenant();
    listForSelect.value = (res?.data ?? []) as SysTenant[];
  } catch (e) {
    message.error((e as Error)?.message ?? "获取租户列表失败");
  }
}

async function handleSubmit() {
  if (!form.value.sysTenantName) {
    message.warning("请输入租户名称");
    return;
  }
  if (!form.value.sysTenantUsername) {
    message.warning("请输入租户账号");
    return;
  }
  // 编码是登录页的输入项，不能留空也不能带空格/大写：这里先归一化，
  // 否则用户填 "Acme " 建完再用 acme 登录会被后端判「编码不存在」
  const tenantCode = String(form.value.sysTenantCode || "").trim().toLowerCase();
  if (!tenantCode) {
    message.warning("请输入租户编码（租户用户登录时输入）");
    return;
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,31}$/.test(tenantCode)) {
    message.warning("租户编码只能包含数字、字母、下划线和中划线，2-32 位");
    return;
  }
  form.value.sysTenantCode = tenantCode;
  if (!isEdit.value && !form.value.sysTenantPassword) {
    message.warning("请输入租户密码");
    return;
  }
  // 独立库要么全空（共用主库），要么库名齐全；引用现成实例时只需库名
  if (useSharedInstance.value) {
    if (!String(form.value.sysTenantDbname || "").trim()) {
      message.warning("已选择共享数据库实例，请填写该租户要用的库名");
      return;
    }
  } else if (
    [
      form.value.sysTenantDbname,
      form.value.sysTenantSqlUsername,
      form.value.sysTenantSqlPassword,
    ].some((v) => String(v ?? "").trim())
  ) {
    if (!form.value.sysTenantDbname || !form.value.sysTenantSqlUsername || !form.value.sysTenantSqlPassword) {
      message.warning("独立库信息不完整：库名、数据库账号、数据库口令需同时填写");
      return;
    }
  }
  if (isEdit.value) {
    saving.value = true;
    try {
      await updateTenant(form.value);
      message.success("修改成功");
      dialogVisible.value = false;
      tableRef.value?.reload();
    } catch (e) {
      message.error((e as Error)?.message ?? "保存失败");
    } finally {
      saving.value = false;
    }
    return;
  }
  // 新增租户改走「带进度的创建」：保存记录 → 建库 → 建账号授权 → 建业务表 →
  // 同步租户库管理员 → 推送菜单，这几步动辄数十秒。原先是同步 save，界面上只有
  // 一个转圈按钮，失败也不知道卡在哪一步；现在每一步都推给进度弹窗。
  // 表单要等拿到 taskId 后再关：启动失败时用户还能直接改参数重试。
  await startProvision({ ...form.value });
}

/* ================== 租户创建进度（socket 实时推送 + 状态轮询兜底） ================== */

/** 轮询间隔：套接字正常时只当兜底，1.5s 足够且不至于打爆后端 */
const PROVISION_POLL_INTERVAL = 1500;
/** 轮询上限：约 10 分钟；实时通道仍活跃时继续兜底，不能把弹窗锁死 */
const PROVISION_POLL_MAX = 400;
/** 认为套接字仍有进度心跳的时间窗：超过这个时间没有帧就不再信任 isConnected */
const PROVISION_SOCKET_ALIVE_MS = 120_000;
/** 任务号返回前最多缓存多少份他人/并发任务的进度帧 */
const PROVISION_PENDING_MAX = 32;

const provisionVisible = ref(false);
const provisionSnapshot = ref<ProgressSnapshot | null>(null);
const provisionSteps = ref<ProgressStep[]>([]);
const provisionCancellable = ref(false);
const provisionCancelling = ref(false);
const provisionError = ref("");
const provisionTaskId = ref("");

/**
 * taskId 返回前的进度帧。
 *
 * <p>后端是广播，同一时刻可能有另一个管理员在创建别的租户。
 * 此时 HTTP 还没回来，不能把任意一帧当成当前任务，否则会显示成别人的租户。</p>
 */
const provisionPendingFrames = new Map<string, Record<string, unknown>>();

let provisionUnsubscribe: (() => void) | null = null;
let provisionPollTimer: number | null = null;
let provisionPollCount = 0;
let provisionPollFailures = 0;
let provisionLastFrameAt = 0;
/** 组件已卸载：在途的启动/轮询回调不能再改状态或重新起定时器 */
let provisionDisposed = false;

/** 停掉状态轮询 */
function stopProvisionPolling() {
  if (provisionPollTimer !== null) {
    window.clearInterval(provisionPollTimer);
    provisionPollTimer = null;
  }
}

/** 退订套接字 */
function stopProvisionSubscription() {
  provisionUnsubscribe?.();
  provisionUnsubscribe = null;
}

/**
 * 应用一份进度快照（来源：套接字推送或状态接口）。
 *
 * <p>忽略「不属于本次任务」和「进度倒退」的快照：两个通道同时到达时，
 * 晚到的旧快照会把进度条往回拉。</p>
 */
function applyProvisionSnapshot(raw: Record<string, unknown> | null | undefined) {
  if (!raw || typeof raw !== "object") {
    return;
  }
  const taskId = raw.taskId === undefined || raw.taskId === null ? "" : String(raw.taskId);
  if (taskId && provisionTaskId.value && taskId !== provisionTaskId.value) {
    return;
  }
  const next = raw as unknown as ProgressSnapshot;
  const prev = provisionSnapshot.value;
  if (prev?.finished) {
    // 已结束就不再回退；重复的终态帧只合并最终文案，不重复触发 finishProvision
    if (next.finished) {
      provisionSnapshot.value = { ...prev, ...next };
      provisionLastFrameAt = Date.now();
    }
    return;
  }
  if (
    prev &&
    !next.finished &&
    typeof prev.percentage === "number" &&
    typeof next.percentage === "number" &&
    next.percentage < prev.percentage
  ) {
    return;
  }
  provisionSnapshot.value = { ...next };
  provisionLastFrameAt = Date.now();
  if (next.finished) {
    finishProvision();
  }
}

/**
 * 通道本身坏了（启动失败 / 连续轮询失败）时，给弹窗补一份终态。
 *
 * <p>ReProgressDialog 只有 finished 才允许关闭；若这里不兜底，
 * 一次网络故障就会把用户永久锁在“正在创建”里。</p>
 */
function failProvisionLocally(
  error: string,
  title = "创建未完成",
  status: "FAILED" | "UNKNOWN" = "FAILED",
) {
  provisionError.value = error;
  stopProvisionPolling();
  stopProvisionSubscription();
  const prev = provisionSnapshot.value;
  provisionSnapshot.value = {
    ...(prev ?? {}),
    taskId: prev?.taskId ?? provisionTaskId.value,
    status,
    finished: true,
    percentage: prev?.percentage ?? 0,
    currentTitle: title,
    currentDescription: prev?.currentDescription ?? error,
    message: error,
    steps: prev?.steps ?? provisionSteps.value,
    details: [...(prev?.details ?? []), error],
  };
  provisionPendingFrames.clear();
}

/** 任务结束：停轮询/退订，并按结果给出可见结论 + 刷新列表 */
function finishProvision() {
  stopProvisionPolling();
  stopProvisionSubscription();
  provisionPendingFrames.clear();
  const snap = provisionSnapshot.value;
  if (!snap) {
    return;
  }
  // 无论成功失败都刷新：失败时租户记录可能已经落库（建库那步才挂），
  // 列表不刷新会让人以为「什么都没发生」，再点一次又说账号已存在
  tableRef.value?.reload();
  loadSelectOptions();
  if (snap.status === "SUCCESS") {
    message.success(snap.message || "租户创建完成");
  } else if (snap.status === "CANCELLED") {
    message.warning(snap.message || "租户创建已取消");
  } else if (snap.status === "UNKNOWN") {
    message.warning(snap.message || "任务状态未知，请刷新列表确认结果");
  } else {
    message.error(snap.message || "租户创建失败");
  }
}

/** 启动轮询兜底 */
function startProvisionPolling() {
  if (!provisionTaskId.value || provisionPollTimer !== null) {
    return;
  }
  provisionPollTimer = window.setInterval(() => {
    void pollProvisionStatus();
  }, PROVISION_POLL_INTERVAL);
}

/** 拉一次状态快照 */
async function pollProvisionStatus() {
  if (provisionDisposed) {
    return;
  }
  const taskId = provisionTaskId.value;
  if (!taskId) {
    stopProvisionPolling();
    return;
  }
  provisionPollCount += 1;
  if (provisionPollCount > PROVISION_POLL_MAX) {
    const socket = getGlobalSocketService();
    const socketAlive =
      socket?.isConnected === true && Date.now() - provisionLastFrameAt < PROVISION_SOCKET_ALIVE_MS;
    if (socketAlive) {
      // 实时通道还在推：轮询继续当兜底，不因为计数到顶就把弹窗判死
      provisionPollCount = 0;
      return;
    }
    failProvisionLocally("进度查询超时，请关闭后刷新列表确认结果", "进度获取超时", "UNKNOWN");
    return;
  }
  try {
    const res = await tenantProvisionStatus(taskId);
    const data = (res?.data ?? null) as Record<string, unknown> | null;
    provisionPollFailures = 0;
    applyProvisionSnapshot(data);
  } catch {
    // 单次失败可能只是抖动：套接字还在就连轮询都不急着停，避免误判任务失败
    provisionPollFailures += 1;
    if (provisionPollFailures < 3) {
      return;
    }
    const socket = getGlobalSocketService();
    if (socket?.isConnected === true) {
      provisionPollFailures = 0;
      return;
    }
    failProvisionLocally(
      "连续获取创建进度失败，且实时通道已断开，请关闭后刷新列表确认结果",
      "进度获取中断",
      "UNKNOWN",
    );
  }
}

/**
 * 开始带进度的创建。
 *
 * @param payload 新增租户表单
 */
async function startProvision(payload: SysTenant) {
  if (provisionDisposed) {
    return;
  }
  provisionSnapshot.value = null;
  provisionSteps.value = [];
  provisionError.value = "";
  provisionCancellable.value = false;
  provisionCancelling.value = false;
  provisionTaskId.value = "";
  provisionPendingFrames.clear();
  provisionPollCount = 0;
  provisionPollFailures = 0;
  provisionLastFrameAt = 0;
  stopProvisionPolling();
  stopProvisionSubscription();
  provisionVisible.value = true;

  // 能力接口：拿步骤清单 + 是否支持套接字/取消。失败不阻塞创建（还有轮询兜底），
  // 但「取消」按钮必须等它明确说支持才出现
  try {
    const capsRes = await tenantProvisionCapabilities();
    const caps = (capsRes?.data ?? {}) as Record<string, unknown>;
    if (Array.isArray(caps.steps)) {
      provisionSteps.value = caps.steps as ProgressStep[];
    }
    provisionCancellable.value = caps.cancellable === true;
    if (caps.socket === true) {
      const module = String(caps.socketModule || "system");
      const topic = String(caps.socketTopic || "tenant:provision:progress");
      const socket = getGlobalSocketService();
      provisionUnsubscribe =
        socket?.subscribe(module, topic, (msg: unknown) => {
          const typed = msg as { data?: Record<string, unknown> } & Record<string, unknown>;
          const frame = (typed?.data ?? typed) as Record<string, unknown>;
          const frameTaskId =
            frame.taskId === undefined || frame.taskId === null ? "" : String(frame.taskId);
          if (!frameTaskId) {
            return;
          }
          if (provisionTaskId.value) {
            if (frameTaskId === provisionTaskId.value) {
              applyProvisionSnapshot(frame);
            }
            return;
          }
          // 任务号还没回来：按 taskId 缓存，等 start 响应到了再挑属于自己的那一份
          if (provisionPendingFrames.size >= PROVISION_PENDING_MAX) {
            const oldest = provisionPendingFrames.keys().next().value;
            if (oldest) {
              provisionPendingFrames.delete(oldest);
            }
          }
          provisionPendingFrames.set(frameTaskId, frame);
        }) ?? null;
    }
  } catch {
    // 能力接口不可用：只保留轮询
  }

  if (provisionDisposed) {
    return;
  }

  try {
    const res = await startTenantProvision(payload);
    if (provisionDisposed) {
      return;
    }
    const data = (res?.data ?? {}) as Record<string, unknown>;
    provisionTaskId.value = data.taskId === undefined || data.taskId === null ? "" : String(data.taskId);
    if (!provisionTaskId.value) {
      throw new Error("后端未返回创建任务标识");
    }
    applyProvisionSnapshot(data);
    const pendingFrame = provisionPendingFrames.get(provisionTaskId.value);
    if (pendingFrame) {
      applyProvisionSnapshot(pendingFrame);
    }
    provisionPendingFrames.clear();
    dialogVisible.value = false;
    if (!provisionSnapshot.value?.finished) {
      startProvisionPolling();
    }
  } catch (e) {
    if (provisionDisposed) {
      return;
    }
    const error = (e as Error)?.message ?? "启动租户创建失败";
    failProvisionLocally(error, "创建启动失败");
  }
}

/** 取消创建（后端在步骤边界生效） */
async function handleProvisionCancel() {
  if (!provisionTaskId.value || provisionCancelling.value) {
    return;
  }
  provisionCancelling.value = true;
  try {
    await cancelTenantProvision(provisionTaskId.value);
    message.info("已提交取消请求，将在当前步骤结束后停止");
  } catch (e) {
    message.error((e as Error)?.message ?? "取消创建失败");
  } finally {
    provisionCancelling.value = false;
  }
}

/** 进度弹窗关闭（仅任务结束后可用） */
function handleProvisionClose() {
  provisionVisible.value = false;
  provisionPendingFrames.clear();
  stopProvisionPolling();
  stopProvisionSubscription();
  // 创建成功后列表必须立刻能看到新租户：弹窗一关就刷新，不用用户手动点刷新
  tableRef.value?.reload();
}

async function handleStatusChange(row: Record<string, unknown>) {
  const tenant = row as unknown as SysTenant;
  if (!tenant.sysTenantId) return;
  const status = tenant.sysTenantStatus === 0 ? 1 : 0;
  const action = status === 1 ? "禁用" : "启用";
  try {
    await ElMessageBox.confirm(`确认${action}租户「${tenant.sysTenantName}」？`, "提示", {
      type: "warning",
      confirmButtonText: `确认${action}`,
    });
  } catch {
    return;
  }
  statusLoading.value = tenant.sysTenantId;
  try {
    await updateTenantStatus(tenant.sysTenantId, status);
    message.success(`${action}成功`);
    tableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? `${action}失败`);
  } finally {
    statusLoading.value = "";
  }
}

async function handleResetPassword(row: Record<string, unknown>) {
  const tenant = row as unknown as SysTenant;
  if (!tenant.sysTenantId) return;
  pwdForm.value = { sysTenantId: tenant.sysTenantId, sysTenantPassword: "admin123456" };
  pwdDialogVisible.value = true;
}

async function handlePasswordSubmit() {
  if (!pwdForm.value.sysTenantPassword) {
    message.warning("请输入新密码");
    return;
  }
  if (!pwdForm.value.sysTenantId) {
    message.warning("缺少租户ID");
    return;
  }
  resetPasswordLoading.value = pwdForm.value.sysTenantId;
  try {
    await resetTenantPassword(pwdForm.value.sysTenantId, pwdForm.value.sysTenantPassword);
    message.success("密码已重置");
    pwdDialogVisible.value = false;
    tableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? "密码重置失败");
  } finally {
    resetPasswordLoading.value = "";
  }
}

async function handleDelete(row: Record<string, unknown>) {
  const tenant = row as unknown as SysTenant;
  if (deleteLoading.value) return;
  try {
    await ElMessageBox.confirm(
      `确认删除租户「${tenant.sysTenantName}」？仅逻辑删除，独立数据库与库账号会保留。`,
      "提示",
      { type: "warning", confirmButtonText: "确定删除" },
    );
  } catch {
    return;
  }
  deleteLoading.value = tenant.sysTenantId!;
  try {
    await deleteTenant(tenant.sysTenantId!);
    message.success("删除成功");
    tableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? "删除失败");
  } finally {
    deleteLoading.value = "";
  }
}

/**
 * 物理删除租户独立数据库。
 *
 * 与「删除租户」分开：删除租户只是逻辑删除，库保留；这里是唯一会 DROP DATABASE 的入口，
 * 因此做三次确认，最后一步要求输入租户编码，避免误点。
 */
async function handleDropDatabase(row: Record<string, unknown>) {
  const tenant = row as unknown as SysTenant;
  if (!tenant.sysTenantDbname) {
    message.warning("该租户未登记独立数据库");
    return;
  }
  if (dropDbLoading.value) return;
  let confirmCode = "";
  try {
    await ElMessageBox.confirm(
      `即将删除租户「${tenant.sysTenantName}」的独立数据库「${tenant.sysTenantDbname}」。此操作不可撤销，是否继续？`,
      "删除数据库（1/3）",
      { type: "warning", confirmButtonText: "继续" },
    );
    await ElMessageBox.confirm(
      "第二步确认：库内所有表与数据都会永久丢失，且无法从平台恢复。",
      "删除数据库（2/3）",
      { type: "warning", confirmButtonText: "继续" },
    );
    const result = await ElMessageBox.prompt(
      `最后一步：请输入租户编码「${tenant.sysTenantCode}」以确认删除。`,
      "删除数据库（3/3）",
      {
        type: "error",
        confirmButtonText: "永久删除",
        inputPlaceholder: tenant.sysTenantCode,
        inputValidator: (value: string) =>
          String(value ?? "").trim().toLowerCase() === String(tenant.sysTenantCode ?? "").toLowerCase()
          || "租户编码不匹配",
      },
    );
    confirmCode = String(result.value ?? "");
  } catch {
    return;
  }
  dropDbLoading.value = tenant.sysTenantId!;
  try {
    await dropTenantDatabase(tenant.sysTenantId!, confirmCode);
    message.success("数据库已删除，租户已回落平台共享库");
    tableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? "删除数据库失败");
  } finally {
    dropDbLoading.value = "";
  }
}

const columns: ReTableColumn[] = [
  { prop: "sysTenantName", label: "租户名称", minWidth: 150 },
  { prop: "sysTenantUsername", label: "租户账号", width: 140 },
  { prop: "sysTenantCode", label: "租户编码", width: 140 },
  { prop: "sysTenantStatus", label: "状态", width: 100, slot: "status", align: "center" },
  { prop: "sysTenantContact", label: "联系人", width: 110 },
  { prop: "sysTenantPhone", label: "手机号", width: 120 },
  { prop: "createTime", label: "创建时间", width: 170 },
  { prop: "action", label: "操作", width: 360, slot: "action", fixed: "right" },
];

onMounted(() => {
  loadSelectOptions();
  tableRef.value?.reload();
});

onUnmounted(() => {
  // 开通中切路由时不能让轮询/订阅继续跑：组件已销毁，回调只会泄漏
  provisionDisposed = true;
  stopProvisionPolling();
  stopProvisionSubscription();
  provisionPendingFrames.clear();
});
</script>

<template>
  <div class="system-page">
    <el-tabs v-model="activeTab" class="tenant-tabs">
      <el-tab-pane label="租户列表" name="tenant">
    <ReTable
      ref="tableRef"
      table-id="system-tenant"
      :loader="loadTenants"
      :columns="columns"
      :pagination="true"
      :params="{}"
      row-key="sysTenantId"
      v-model:page="query.page"
      v-model:page-size="query.pageSize"
      :search="{ filters: searchFilters, title: '搜索', btnMode: 'text' }"
      :search-gap="16"
      v-model:search-model="query"
      @search-reset="handleReset"
    >
      <template #toolbar>
        <ReButton type="primary" icon="Plus" v-admin @click="handleAdd">新增租户</ReButton>
      </template>
      <template #empty>
        <div class="page-empty">
          <span class="page-empty__icon">
            <ReIcon name="OfficeBuilding" size="22" />
          </span>
          <span class="page-empty__title">还没有租户</span>
          <span class="page-empty__desc">租户用于隔离多租户数据，先建一个租户再为它分配角色与菜单。</span>
          <span class="page-empty__actions">
            <ReButton type="primary" icon="Plus" v-admin @click="handleAdd">新增租户</ReButton>
            <ReButton icon="Refresh" @click="reload">刷新</ReButton>
          </span>
        </div>
      </template>
      <template #status="{ row }">
        <ReTag :type="row.sysTenantStatus === 0 ? 'success' : 'danger'" effect="plain" dot>
          {{ row.sysTenantStatus === 0 ? "启用" : "禁用" }}
        </ReTag>
      </template>
      <template #action="{ row }">
        <ReButton layout="square" type="primary" icon="Edit" tip="编辑" v-admin @click="handleEdit(row)" />
        <ReButton
          layout="square"
          :type="row.sysTenantStatus === 0 ? 'warning' : 'success'"
          :icon="row.sysTenantStatus === 0 ? 'Stop' : 'CircleCheck'"
          tip="状态"
          v-admin
          :loading="statusLoading === row.sysTenantId"
          @click="handleStatusChange(row)"
        />
        <ReButton layout="square" type="info" icon="Key" tip="重置密码" v-admin :loading="resetPasswordLoading === row.sysTenantId" @click="handleResetPassword(row)" />
        <ReButton layout="square" type="info" icon="Link" tip="服务地址" @click="handleEndpoint(row)" />
        <ReButton layout="square" type="success" icon="Connection" tip="分配服务" v-admin @click="handleBindService(row)" />
        <ReButton v-if="row.sysTenantDbname" layout="square" type="danger" icon="DeleteFilled" tip="删除数据库" v-admin :loading="dropDbLoading === row.sysTenantId" @click="handleDropDatabase(row)" />
        <ReButton layout="square" type="danger" icon="Delete" tip="删除" v-admin :loading="deleteLoading === row.sysTenantId" @click="handleDelete(row)" />
      </template>
    </ReTable>

    <!-- 新增/编辑租户弹窗 -->
    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑租户' : '新增租户'"
      width="640"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="saving"
      :footer-hidden="false"
      @ok="handleSubmit"
    >
      <el-form label-width="120px" :model="form">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="租户名称" required>
              <ReInput layout="modern" v-model="form.sysTenantName" placeholder="请输入租户名称" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="租户账号" required>
              <ReInput layout="modern" v-model="form.sysTenantUsername" placeholder="请输入租户账号" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="租户密码" :required="!isEdit" :prop="isEdit ? undefined : 'sysTenantPassword'">
              <ReInput layout="modern" v-model="form.sysTenantPassword" type="password" placeholder="请输入租户密码" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="租户编码" required>
              <ReInput layout="modern" v-model="form.sysTenantCode" placeholder="登录时输入，如 acme" maxlength="32" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="tenant-code-hint">
          租户编码是租户登录页要人肉输入的短码（2-32 位字母、数字、下划线、中划线，全平台唯一），
          例如 <code>acme</code>、<code>t-001</code>；它不是内部租户 ID。修改编码后，租户用户必须用新编码登录。
        </div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="公司">
              <ReInput layout="modern" v-model="form.sysTenantCorporation" placeholder="请输入公司名称" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人">
              <ReInput layout="modern" v-model="form.sysTenantContact" placeholder="请输入联系人" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="手机号">
              <ReInput layout="modern" v-model="form.sysTenantPhone" placeholder="请输入手机号" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <ReInput layout="modern" v-model="form.sysTenantEmail" placeholder="请输入邮箱" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="租户首页">
              <ReInput layout="modern" v-model="form.sysTenantHomeUrl" placeholder="如 https://t1.example.com" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-segmented v-model="form.sysTenantStatus" :options="tenantStatusOptions" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="实例来源">
              <el-select
                v-model="form.sysTenantDatasourceId"
                :loading="datasourceLoading"
                placeholder="选择数据库实例"
                class="!w-full"
              >
                <el-option
                  v-for="item in datasourceOptions"
                  :key="item.id"
                  :label="item.name || `数据源#${item.id}`"
                  :value="item.id ?? 0"
                >
                  <span>{{ item.name }}</span>
                  <span v-if="item.host" class="tenant-ds-option-host">
                    {{ item.host }}{{ item.port ? `:${item.port}` : "" }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="useSharedInstance" :gutter="16">
          <el-col :span="16">
            <el-form-item label="数据库地址">
              <div class="tenant-ds-readonly">
                {{ sharedEndpoint.host || "（由所选实例提供）" }}
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="数据库端口">
              <div class="tenant-ds-readonly">
                {{ sharedEndpoint.port ?? "（实例默认）" }}
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-else :gutter="16">
          <el-col :span="12">
            <el-form-item label="数据库地址">
              <ReInput layout="modern" v-model="form.sysTenantHost" placeholder="如 127.0.0.1" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据库端口">
              <ReInputNumber layout="modern" v-model="form.sysTenantPort" :min="1" :max="65535" class="!w-full" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="数据库名">
              <ReInput layout="modern" v-model="form.sysTenantDbname" placeholder="请输入数据库名" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
          <template v-if="!useSharedInstance">
            <el-col :span="12">
              <el-form-item label="数据库账号">
                <ReInput layout="modern" v-model="form.sysTenantSqlUsername" placeholder="请输入数据库账号" maxlength="255" show-word-limit />
              </el-form-item>
            </el-col>
          </template>
        </el-row>
        <el-form-item v-if="!useSharedInstance" label="数据库口令">
          <ReInput layout="modern" v-model="form.sysTenantSqlPassword" type="password" placeholder="明文传入，落库为密文" maxlength="255" show-word-limit />
        </el-form-item>
        <div v-if="useSharedInstance" class="tenant-ds-hint">
          地址与端口取自所选实例；选「平台自身实例」时平台会自动创建 t_&lt;租户编码&gt; 数据库账号并授权。多个租户共用同一实例时，务必各自使用不同的库名。
        </div>
        <el-form-item label="备注">
          <ReInput layout="modern" v-model="form.sysTenantRemark" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 重置租户密码弹窗 -->
    <ReDialog
      v-model="pwdDialogVisible"
      title="重置租户密码"
      width="500"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="resetPasswordLoading === pwdForm.sysTenantId"
      :footer-hidden="false"
      @ok="handlePasswordSubmit"
    >
      <el-form label-width="100px" :model="pwdForm">
        <el-form-item label="租户密码">
          <ReInput layout="modern" v-model="pwdForm.sysTenantPassword" type="password" placeholder="请输入新密码" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 租户创建进度：安装向导式弹窗（不可关闭；取消按钮由后端能力接口决定） -->
    <ReProgressDialog
      v-model="provisionVisible"
      :title="provisionSnapshot?.finished ? '租户创建结果' : '正在创建租户'"
      :snapshot="provisionSnapshot"
      :steps="provisionSteps"
      :cancellable="provisionCancellable"
      :cancel-loading="provisionCancelling"
      :error-message="provisionError"
      @cancel="handleProvisionCancel"
      @close="handleProvisionClose"
    />

    <!-- 分配服务：勾选新增、取消勾选移除、改到期时间即"增删改" -->
    <TenantServiceBindDialog v-model:visible="bindVisible" :tenant="bindTenant" @success="handleBindSuccess" />

    <!-- 服务地址：平台登录后把租户请求转到这台机器；来源分「租户端启动自报」与「人工登记」 -->
    <ReDialog v-model="endpointVisible" title="租户服务地址" width="560" layout="modern" compact destroy-on-close>
      <div class="endpoint-dialog">
        <div class="endpoint-dialog__head">
          <span class="endpoint-dialog__name">{{ endpointTenant.sysTenantName || "未命名租户" }}</span>
          <code class="endpoint-dialog__code">{{ endpointTenant.sysTenantCode || "-" }}</code>
          <ReTag v-if="endpointInfo" :type="endpointInfo.online ? 'success' : 'info'" effect="plain" dot>
            {{ endpointInfo.online ? "在线" : "离线" }}
          </ReTag>
        </div>

        <el-alert v-if="endpointError" :title="endpointError" type="error" :closable="false" show-icon />

        <div v-else-if="endpointLoading" class="endpoint-dialog__loading">正在查询租户端注册信息…</div>

        <template v-else-if="endpointInfo">
          <div class="endpoint-row">
            <span class="endpoint-row__label">可访问地址</span>
            <code class="endpoint-row__value endpoint-row__value--url">{{ endpointInfo.url || "未登记" }}</code>
          </div>
          <div class="endpoint-row">
            <span class="endpoint-row__label">地址来源</span>
            <span class="endpoint-row__value">{{ endpointSourceText(endpointInfo) }}</span>
          </div>
          <div class="endpoint-row">
            <span class="endpoint-row__label">实时在线</span>
            <span class="endpoint-row__value">{{ endpointInfo.online ? "是（租户端正在运行）" : "否（使用最近一次上报或人工登记地址）" }}</span>
          </div>
          <div class="endpoint-row">
            <span class="endpoint-row__label">租户端应用</span>
            <span class="endpoint-row__value">{{ endpointInfo.applicationName || "未上报" }}</span>
          </div>
          <div class="endpoint-row">
            <span class="endpoint-row__label">同步会话</span>
            <span class="endpoint-row__value">{{ endpointInfo.clientId || "-" }}</span>
          </div>
        </template>

        <div v-else class="endpoint-dialog__empty">
          这个租户还没有上报过服务地址。租户端启动后会自动注册；也可以在「编辑租户 - 租户首页」里人工登记。
        </div>
      </div>
      <template #footer>
        <el-button @click="loadEndpoint">刷新</el-button>
        <el-button type="primary" @click="endpointVisible = false">关闭</el-button>
      </template>
    </ReDialog>
      </el-tab-pane>
      <el-tab-pane label="服务目录" name="service" lazy>
        <ServiceCatalogPanel />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
  height: 100%;
  box-sizing: border-box;
}

/* 页签占满剩余高度：ReTable 依赖父级高度撑开，否则表格会塌成一条 */
.tenant-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.tenant-tabs :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
}
.tenant-tabs :deep(.el-tab-pane) {
  height: 100%;
}

/* 表格外壳（描边 / 圆角 / 卡片投影 / focus-within 转主色）已由 ReTable 插件提供 */

/* 行内可点区域（导出链接等）补焦点环，键盘用户才看得见当前焦点 */
:deep(.re-table__cell a),
:deep(.re-table__cell [role="button"]),
:deep(.log-content-link) {
  border-radius: var(--el-radius-xs, 4px);
  transition: color var(--el-transition-duration-fast, 0.2s) ease;
}
:deep(.re-table__cell [role="button"]:focus-visible),
:deep(.log-content-link:focus-visible) {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 尊重系统「减少动态效果」偏好（ReTable 的过渡由插件自带同名媒体查询处理） */
@media (prefers-reduced-motion: reduce) {
  :deep(.re-table__cell [role="button"]),
  :deep(.log-content-link) {
    transition: none;
  }
}

/* ================== 租户编码说明 / 服务地址弹窗 ================== */

/* 编码是登录页要人肉输入的短码，必须让创建者看懂「改码 = 旧码失效」 */
.tenant-code-hint {
  margin: -4px 0 18px;
  padding: 8px 12px;
  border-radius: var(--el-radius-base, 6px);
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
  line-height: 1.7;
}
.tenant-code-hint code {
  padding: 0 4px;
  border-radius: 3px;
  background: var(--el-fill-color, #f0f2f5);
  color: var(--el-color-primary, #409eff);
  font-family: var(--el-font-family-mono, monospace);
}

/* 实例来源下拉项右侧的地址提示 */
.tenant-ds-option-host {
  float: right;
  margin-left: 12px;
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
}

/* 引用现成实例时，地址与端口只读回显 */
.tenant-ds-readonly {
  width: 100%;
  padding: 0 11px;
  height: 32px;
  line-height: 30px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: var(--el-border-radius-base, 4px);
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-text-color-regular, #606266);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tenant-ds-hint {
  margin: -4px 0 18px;
  padding: 8px 12px;
  border-radius: var(--el-radius-base, 6px);
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
  line-height: 1.7;
}

.endpoint-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.endpoint-dialog__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}
.endpoint-dialog__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}
.endpoint-dialog__code {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-text-color-regular, #606266);
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
}
.endpoint-dialog__loading,
.endpoint-dialog__empty {
  padding: 14px 12px;
  border-radius: var(--el-radius-base, 6px);
  background: var(--el-fill-color-lighter, #fafafa);
  color: var(--el-text-color-secondary, #909399);
  font-size: 13px;
  line-height: 1.7;
}
.endpoint-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  font-size: 13px;
  line-height: 1.7;
}
.endpoint-row__label {
  flex: 0 0 84px;
  color: var(--el-text-color-secondary, #909399);
}
.endpoint-row__value {
  flex: 1;
  min-width: 0;
  color: var(--el-text-color-primary, #303133);
  word-break: break-all;
}
.endpoint-row__value--url {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-color-primary, #409eff);
  font-family: var(--el-font-family-mono, monospace);
  user-select: all;
}
</style>
