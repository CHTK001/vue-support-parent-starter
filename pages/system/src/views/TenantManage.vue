<script setup lang="ts">
/**
 * 租户管理页面 —— 平台侧维护租户，向租户端分配服务并推送菜单/账号密码
 *
 * 业务组件化拆分：
 * - TenantFormDialog：新增/编辑租户表单
 * - TenantServiceBindDialog：分配服务（触发菜单重置推送）
 * - TenantResetPasswordDialog：重置租户密码（推送租户端）
 *
 * 复用 ReTable（loader 模式）、ReSearch 外壳，管理按钮用 v-admin 指令。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, EditPen, Key, Refresh, Setting } from "@element-plus/icons-vue";
import { deleteTenant, getTenant, pageForTenant, resetTenantMenu, tenantStats, updateTenantStatus } from "../api/systemApi";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import type { SysTenant, SysTenantService, SysTenantStats } from "../api/types";
import TenantFormDialog from "./components/TenantFormDialog.vue";
import TenantServiceBindDialog from "./components/TenantServiceBindDialog.vue";
import TenantResetPasswordDialog from "./components/TenantResetPasswordDialog.vue";

const query = ref<{
  page: number;
  pageSize: number;
  sysTenantName?: string;
  sysTenantUsername?: string;
  sysTenantStatus?: number;
}>({
  page: 1,
  pageSize: 20,
});

const stats = ref<SysTenantStats>({});

async function loadTenants({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForTenant({
    page,
    pageSize,
    sysTenantName: (params.sysTenantName as string) || undefined,
    sysTenantUsername: (params.sysTenantUsername as string) || undefined,
    sysTenantStatus: params.sysTenantStatus === "" ? undefined : (params.sysTenantStatus as number),
  });
  const rows = (res?.data?.data ?? []) as Record<string, unknown>[];
  tenantRows.value = rows as unknown as SysTenant[];
  return { total: res?.data?.total ?? 0, data: rows };
}

/** 当前页租户行（用于前端统计即将到期/已过期数量） */
const tenantRows = ref<SysTenant[]>([]);

/** 已过期的服务数（任一服务已过期即视为该租户已过期） */
function hasExpired(tenant: unknown): boolean {
  const t = tenant as Partial<SysTenant>;
  return (t.sysTenantService ?? []).some((s) => daysUntil(s.sysTenantServiceValidTime) === -1);
}

/** 即将到期数量（7天内且未过期） */
const expiringCount = computed(() => tenantRows.value.filter((t) => {
  const d = expiringDays(t);
  return d !== null && d <= 7;
}).length);

/** 已过期数量 */
const expiredCount = computed(() => tenantRows.value.filter((t) => hasExpired(t)).length);

const tableRef = ref();

async function refreshStats() {
  const res = await tenantStats();
  stats.value = res?.data ?? {};
}

const formDialogVisible = ref(false);
const formMode = ref<"create" | "edit">("create");
const currentTenant = ref<SysTenant>({});

const bindDialogVisible = ref(false);
const pwdDialogVisible = ref(false);

function handleCreate() {
  formMode.value = "create";
  currentTenant.value = {};
  formDialogVisible.value = true;
}

function handleEdit(row: Record<string, unknown>) {
  formMode.value = "edit";
  currentTenant.value = { ...(row as unknown as SysTenant) };
  formDialogVisible.value = true;
}

function handleOpenBind(row: Record<string, unknown>) {
  currentTenant.value = row as unknown as SysTenant;
  bindDialogVisible.value = true;
}

function handleOpenResetPwd(row: Record<string, unknown>) {
  currentTenant.value = row as unknown as SysTenant;
  pwdDialogVisible.value = true;
}

async function handleDelete(row: Record<string, unknown>) {
  await ElMessageBox.confirm(`确认删除租户「${row.sysTenantName ?? row.sysTenantId}」？删除后将清除租户端菜单数据。`, "提示", {
    type: "warning",
  });
  await deleteTenant(row.sysTenantId as string);
  ElMessage.success("删除成功，已推送租户端清理");
  tableRef.value?.reload();
  refreshStats();
}

async function handleToggleStatus(row: Record<string, unknown>) {
  const next = row.sysTenantStatus === 1 ? 0 : 1;
  await updateTenantStatus(row.sysTenantId as string, next);
  ElMessage.success(next === 0 ? "租户已启用" : "租户已禁用");
  tableRef.value?.reload();
}

async function handleResetMenu(row: Record<string, unknown>) {
  await ElMessageBox.confirm(`确认按当前订阅重新计算并推送菜单给租户「${row.sysTenantName ?? row.sysTenantId}」？`, "提示", {
    type: "warning",
  });
  await resetTenantMenu(row.sysTenantId as string);
  ElMessage.success("菜单已重置并推送租户端");
}

function handleDialogSuccess() {
  tableRef.value?.reload();
  refreshStats();
}

/* ================== 服务到期判断与租户详情 ================== */
/** 判断租户是否有服务将在 N 天内到期（默认7天） */
function expiringDays(tenant: unknown): number | null {
  const t = tenant as Partial<SysTenant>;
  const services = t.sysTenantService ?? [];
  if (!services.length) return null;
  const now = Date.now();
  let minDays: number | null = null;
  for (const s of services) {
    if (!s.sysTenantServiceValidTime) continue;
    const t = new Date(s.sysTenantServiceValidTime.replace(/-/g, "/")).getTime();
    if (Number.isNaN(t)) continue;
    const diff = t - now;
    if (diff < 0) continue; // 已过期的不计入"即将到期"高亮
    const days = Math.ceil(diff / 86400000);
    if (minDays === null || days < minDays) minDays = days;
  }
  return minDays;
}

/** 行高亮：7天内到期 */
function rowClassName({ row }: { row: Record<string, unknown> }): string {
  const d = expiringDays(row as unknown as SysTenant);
  return d !== null && d <= 7 ? "tenant-expiring-row" : "";
}

/* 详情抽屉 */
const detailDrawerVisible = ref(false);
const detailLoading = ref(false);
const detailTenant = ref<SysTenant | null>(null);

async function openDetail(row: Record<string, unknown>) {
  const t = row as unknown as SysTenant;
  detailDrawerVisible.value = true;
  detailLoading.value = true;
  try {
    // 拉取完整详情（含绑定服务及到期时间）
    const res = await getTenant(t.sysTenantId!);
    detailTenant.value = res?.data ?? t;
  } catch {
    detailTenant.value = t;
  } finally {
    detailLoading.value = false;
  }
}

/** 服务到期时间的友好显示 */
function validTimeText(s: SysTenantService): string {
  return s.sysTenantServiceValidTime || "长期有效";
}

/** 单个服务距离到期的天数（已过期返回 -1，无时间返回 null） */
function daysUntil(validTime?: string): number | null {
  if (!validTime) return null;
  const t = new Date(validTime.replace(/-/g, "/")).getTime();
  if (Number.isNaN(t)) return null;
  const diff = t - Date.now();
  if (diff < 0) return -1;
  return Math.ceil(diff / 86400000);
}

const columns: ReTableColumn[] = [
  { prop: "sysTenantId", label: "租户编码", width: 150 },
  { prop: "sysTenantName", label: "租户名称", minWidth: 130 },
  { prop: "sysTenantUsername", label: "账号", width: 110 },
  { prop: "sysTenantStatus", label: "状态", width: 80, slot: "status", align: "center" },
  { prop: "sysTenantContact", label: "联系人", width: 100 },
  { prop: "sysTenantPhone", label: "手机号", width: 120 },
  { prop: "sysTenantEmail", label: "邮箱", minWidth: 140 },
  { prop: "serviceIds", label: "订阅服务", width: 90, slot: "serviceCount", align: "center" },
  { prop: "expiry", label: "服务到期", width: 120, slot: "expiry", align: "center" },
  { prop: "createTime", label: "创建时间", width: 165 },
  { prop: "action", label: "操作", width: 320, slot: "action", fixed: "right", align: "center" },
];

onMounted(() => {
  refreshStats();
});
</script>

<template>
  <div class="system-page">
    <div class="grid grid-cols-6 gap-3">
      <el-card shadow="never" class="rounded-xl">
        <p class="text-sm text-[--el-text-color-secondary]">租户总数</p>
        <p class="mt-1 text-2xl font-semibold">{{ stats.total ?? 0 }}</p>
      </el-card>
      <el-card shadow="never" class="rounded-xl">
        <p class="text-sm text-[--el-text-color-secondary]">启用</p>
        <p class="mt-1 text-2xl font-semibold text-green-600">{{ stats.enabled ?? 0 }}</p>
      </el-card>
      <el-card shadow="never" class="rounded-xl">
        <p class="text-sm text-[--el-text-color-secondary]">禁用</p>
        <p class="mt-1 text-2xl font-semibold text-red-500">{{ stats.disabled ?? 0 }}</p>
      </el-card>
      <el-card shadow="never" class="rounded-xl">
        <p class="text-sm text-[--el-text-color-secondary]">订阅服务租户</p>
        <p class="mt-1 text-2xl font-semibold text-blue-600">{{ stats.subscribed ?? 0 }}</p>
      </el-card>
      <el-card shadow="never" class="rounded-xl">
        <p class="text-sm text-[--el-text-color-secondary]">即将到期(7天内)</p>
        <p class="mt-1 text-2xl font-semibold text-orange-500">{{ expiringCount }}</p>
      </el-card>
      <el-card shadow="never" class="rounded-xl">
        <p class="text-sm text-[--el-text-color-secondary]">已过期</p>
        <p class="mt-1 text-2xl font-semibold text-red-600">{{ expiredCount }}</p>
      </el-card>
    </div>

    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true" add-text="新增租户" @add="handleCreate">
        <div class="system-page__search">
          <ReInput
            layout="modern"
            v-model="query.sysTenantName"
            placeholder="租户名称"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
          <ReInput
            layout="modern"
            v-model="query.sysTenantUsername"
            placeholder="租户账号"
            clearable
            class="!w-40"
            @keyup.enter="tableRef?.reload()"
          />
          <ReSelect
            v-model="query.sysTenantStatus"
            placeholder="状态"
            clearable
            class="!w-28"
            :data="[
              { label: '启用', value: 0 },
              { label: '禁用', value: 1 },
            ]"
          />
        </div>
        <template #footer>
          <ReButton layout="modern" type="primary" icon="Search" @click="tableRef?.reload()">查询</ReButton>
          <ReButton layout="modern" @click="query.sysTenantName = undefined; query.sysTenantUsername = undefined; query.sysTenantStatus = undefined; tableRef?.reload()">重置</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="tableRef?.reload()">刷新</ReButton>
        </template>
      </ReSearch>

      <ReTable
        ref="tableRef"
        table-id="system-tenant"
        :loader="loadTenants"
        :columns="columns"
        :pagination="true"
        :params="query"
        row-key="sysTenantId"
        v-model:page="query.page"
        v-model:page-size="query.pageSize"
        :row-class-name="rowClassName"
      >
        <template #status="{ row }">
          <div class="flex flex-col items-center gap-1">
            <ReTag :type="row.sysTenantStatus === 1 ? 'danger' : 'success'" size="small" effect="plain">
              {{ row.sysTenantStatus === 1 ? "禁用" : "启用" }}
            </ReTag>
            <ReTag v-if="(expiringDays(row) !== null && expiringDays(row)! <= 7)" type="danger" size="small" effect="dark">
              即将到期
            </ReTag>
          </div>
        </template>
        <template #serviceCount="{ row }">
          <ReTag type="info" size="small" effect="plain">{{ (row.serviceIds as unknown[])?.length ?? 0 }}</ReTag>
        </template>
        <template #expiry="{ row }">
          <template v-if="hasExpired(row)">
            <ReTag type="danger" size="small" effect="dark">已过期</ReTag>
          </template>
          <ReTag v-else-if="expiringDays(row) !== null && expiringDays(row)! <= 7" type="warning" size="small" effect="dark">即将到期</ReTag>
          <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
        </template>
        <template #action="{ row }">
          <ReButton layout="square" type="info" @click="openDetail(row)">详情</ReButton>
          <ReButton layout="square" type="primary" :icon="EditPen" @click="handleEdit(row)">编辑</ReButton>
          <ReButton layout="square" type="primary" icon="Setting" v-admin @click="handleOpenBind(row)">分配服务</ReButton>
          <ReButton layout="square" type="warning" :icon="Key" v-admin @click="handleOpenResetPwd(row)">重置密码</ReButton>
          <ReButton layout="square" type="primary" v-admin @click="handleResetMenu(row)">重置菜单</ReButton>
          <ReButton layout="square" :type="row.sysTenantStatus === 1 ? 'success' : 'info'" @click="handleToggleStatus(row)">
            {{ row.sysTenantStatus === 1 ? "启用" : "禁用" }}
          </ReButton>
          <ReButton layout="square" type="danger" icon="Delete" v-admin @click="handleDelete(row)">删除</ReButton>
        </template>
      </ReTable>
    </el-card>

    <TenantFormDialog v-model:visible="formDialogVisible" v-model:model="currentTenant" :mode="formMode" @success="handleDialogSuccess" />
    <TenantServiceBindDialog v-model:visible="bindDialogVisible" :tenant="currentTenant" @success="handleDialogSuccess" />
    <TenantResetPasswordDialog v-model:visible="pwdDialogVisible" :tenant="currentTenant" @success="handleDialogSuccess" />

    <!-- 租户详情抽屉 -->
    <ReDrawer
      v-model="detailDrawerVisible"
      title="租户详情"
      size="600"
      :show-window-shell="false"
      :close-on-click-modal="true"
      :footer-hidden="true"
    >
      <template #content>
        <div v-loading="detailLoading">
          <el-descriptions v-if="detailTenant" :column="1" border :label-style="{ width: '120px', fontWeight: 600 }">
            <el-descriptions-item label="租户名称">{{ detailTenant.sysTenantName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="租户编码">{{ detailTenant.sysTenantId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="租户账号">{{ detailTenant.sysTenantUsername || '-' }}</el-descriptions-item>
            <el-descriptions-item label="公司">{{ detailTenant.sysTenantCorporation || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ detailTenant.sysTenantContact || '-' }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ detailTenant.sysTenantPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ detailTenant.sysTenantEmail || '-' }}</el-descriptions-item>
            <el-descriptions-item label="访问地址">{{ detailTenant.sysTenantHomeUrl || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <ReTag :type="detailTenant.sysTenantStatus === 1 ? 'danger' : 'success'" size="small" effect="plain">
                {{ detailTenant.sysTenantStatus === 1 ? "禁用" : "启用" }}
              </ReTag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ detailTenant.createTime || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div class="mt-4 text-sm font-semibold text-[--el-text-color-primary]">绑定服务列表</div>
          <el-table
            v-if="detailTenant?.sysTenantService?.length"
            :data="detailTenant.sysTenantService"
            border
            size="small"
            class="mt-2"
          >
            <el-table-column type="index" label="#" width="60" align="center" />
            <el-table-column label="服务ID" prop="sysServiceId" min-width="100" />
            <el-table-column label="到期时间">
              <template #default="{ row }">
                <span :class="(daysUntil(row.sysTenantServiceValidTime) !== null && daysUntil(row.sysTenantServiceValidTime)! >= 0 && daysUntil(row.sysTenantServiceValidTime)! <= 7) ? 'text-red-500 font-medium' : ''">
                  {{ validTimeText(row) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="未绑定服务" :image-size="80" />
        </div>
      </template>
    </ReDrawer>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
}
.system-page__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.system-page__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.system-page__subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.system-page__card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}
.system-page__search {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
}

:deep(.tenant-expiring-row) {
  td {
    background: var(--el-color-warning-light-9) !important;
  }
}
</style>
