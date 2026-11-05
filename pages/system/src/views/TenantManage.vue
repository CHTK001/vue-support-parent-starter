<script setup lang="ts">
/**
 * 租户管理页面
 *
 * 租户分页查询 + 新增/编辑/删除/启用禁用/重置密码。
 * 全部使用 ReXxx modern 组件渲染，风格对齐 UserManage.vue。
 */
import { getGlobalSocketService, message } from "@repo/core";
import { computed, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { pageForTenant, updateTenant, deleteTenant, updateTenantStatus, resetTenantPassword, getTenant, listForTenant, tenantProvisionCapabilities, startTenantProvision, cancelTenantProvision, tenantProvisionStatus } from "../api/systemApi";
import type { SysTenant } from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import type { ProgressSnapshot, ProgressStep } from "@repo/ui/re-progress-dialog";

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

const pwdForm = ref({ sysTenantId: "", sysTenantPassword: "admin123456" });
const pwdDialogVisible = ref(false);

const listForSelect = ref<SysTenant[]>([]);

function handleAdd() {
  isEdit.value = false;
  form.value = { sysTenantStatus: 0, sysTenantDelete: 0 };
  dialogVisible.value = true;
}

function handleEdit(row: Record<string, unknown>) {
  isEdit.value = true;
  form.value = { ...(row as unknown as SysTenant) };
  dialogVisible.value = true;
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
  if (!isEdit.value && !form.value.sysTenantPassword) {
    message.warning("请输入租户密码");
    return;
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
  dialogVisible.value = false;
  await startProvision({ ...form.value });
}

/* ================== 租户创建进度（socket 实时推送 + 状态轮询兜底） ================== */

/** 轮询间隔：套接字正常时只当兜底，1.5s 足够且不至于打爆后端 */
const PROVISION_POLL_INTERVAL = 1500;
/** 轮询上限：约 10 分钟，超过就停（避免页面开着无限请求） */
const PROVISION_POLL_MAX = 400;

const provisionVisible = ref(false);
const provisionSnapshot = ref<ProgressSnapshot | null>(null);
const provisionSteps = ref<ProgressStep[]>([]);
const provisionCancellable = ref(false);
const provisionCancelling = ref(false);
const provisionError = ref("");
const provisionTaskId = ref("");

let provisionUnsubscribe: (() => void) | null = null;
let provisionPollTimer: number | null = null;
let provisionPollCount = 0;

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
  if (next.finished) {
    finishProvision();
  }
}

/** 任务结束：停轮询/退订，并按结果给出可见结论 + 刷新列表 */
function finishProvision() {
  stopProvisionPolling();
  stopProvisionSubscription();
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
  const taskId = provisionTaskId.value;
  if (!taskId) {
    stopProvisionPolling();
    return;
  }
  provisionPollCount += 1;
  if (provisionPollCount > PROVISION_POLL_MAX) {
    stopProvisionPolling();
    return;
  }
  try {
    const res = await tenantProvisionStatus(taskId);
    const data = (res?.data ?? null) as Record<string, unknown> | null;
    applyProvisionSnapshot(data);
  } catch {
    // 任务过期/接口异常：停止轮询，弹窗保留最后一份快照
    stopProvisionPolling();
  }
}

/**
 * 开始带进度的创建。
 *
 * @param payload 新增租户表单
 */
async function startProvision(payload: SysTenant) {
  provisionSnapshot.value = null;
  provisionSteps.value = [];
  provisionError.value = "";
  provisionCancellable.value = false;
  provisionCancelling.value = false;
  provisionTaskId.value = "";
  provisionPollCount = 0;
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
          applyProvisionSnapshot(typed?.data ?? typed);
        }) ?? null;
    }
  } catch {
    // 能力接口不可用：只保留轮询
  }

  try {
    const res = await startTenantProvision(payload);
    const data = (res?.data ?? {}) as Record<string, unknown>;
    provisionTaskId.value = data.taskId === undefined || data.taskId === null ? "" : String(data.taskId);
    if (!provisionTaskId.value) {
      throw new Error("后端未返回创建任务标识");
    }
    applyProvisionSnapshot(data);
    startProvisionPolling();
  } catch (e) {
    provisionError.value = (e as Error)?.message ?? "启动租户创建失败";
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
  stopProvisionPolling();
  stopProvisionSubscription();
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
    await ElMessageBox.confirm(`确认删除租户「${tenant.sysTenantName}」？`, "提示", {
      type: "warning",
      confirmButtonText: "确定删除",
    });
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

const columns: ReTableColumn[] = [
  { prop: "sysTenantName", label: "租户名称", minWidth: 150 },
  { prop: "sysTenantUsername", label: "租户账号", width: 140 },
  { prop: "sysTenantCode", label: "租户编码", width: 140 },
  { prop: "sysTenantStatus", label: "状态", width: 100, slot: "status", align: "center" },
  { prop: "sysTenantContact", label: "联系人", width: 110 },
  { prop: "sysTenantPhone", label: "手机号", width: 120 },
  { prop: "createTime", label: "创建时间", width: 170 },
  { prop: "action", label: "操作", width: 200, slot: "action", fixed: "right" },
];

onMounted(() => {
  loadSelectOptions();
  tableRef.value?.reload();
});
</script>

<template>
  <div class="system-page">
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
        <ReButton
          layout="square"
          type="info"
          icon="Key"
          tip="重置密码"
          v-admin
          :loading="resetPasswordLoading === row.sysTenantId"
          @click="handleResetPassword(row)"
        />
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
            <el-form-item label="租户编码">
              <ReInput layout="modern" v-model="form.sysTenantCode" placeholder="请输入租户编码" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
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
          <el-col :span="12">
            <el-form-item label="数据库账号">
              <ReInput layout="modern" v-model="form.sysTenantSqlUsername" placeholder="请输入数据库账号" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="数据库口令">
          <ReInput layout="modern" v-model="form.sysTenantSqlPassword" type="password" placeholder="明文传入，落库为密文" maxlength="255" show-word-limit />
        </el-form-item>
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
</style>
