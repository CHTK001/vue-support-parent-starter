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
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, EditPen, Key, Refresh, Setting } from "@element-plus/icons-vue";
import { deleteTenant, pageForTenant, resetTenantMenu, tenantStats, updateTenantStatus } from "../api/systemApi";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import type { SysTenant, SysTenantStats } from "../api/types";
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
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

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

const columns: ReTableColumn[] = [
  { prop: "sysTenantId", label: "租户编码", width: 150 },
  { prop: "sysTenantName", label: "租户名称", minWidth: 130 },
  { prop: "sysTenantUsername", label: "账号", width: 110 },
  { prop: "sysTenantStatus", label: "状态", width: 80, slot: "status", align: "center" },
  { prop: "sysTenantContact", label: "联系人", width: 100 },
  { prop: "sysTenantPhone", label: "手机号", width: 120 },
  { prop: "sysTenantEmail", label: "邮箱", minWidth: 140 },
  { prop: "serviceIds", label: "订阅服务", width: 90, slot: "serviceCount", align: "center" },
  { prop: "createTime", label: "创建时间", width: 165 },
  { prop: "action", label: "操作", width: 260, slot: "action", fixed: "right", align: "center" },
];

onMounted(() => {
  refreshStats();
});
</script>

<template>
  <div class="system-page">
    <div class="system-page__header">
      <div>
        <h2 class="system-page__title">租户管理</h2>
        <p class="system-page__subtitle">平台侧维护租户，向租户端分配服务并推送菜单与账号密码</p>
      </div>
      <div class="flex gap-2">
        <ReButton layout="modern" type="primary" plain icon="Refresh" @click="tableRef?.reload(); refreshStats()">刷新</ReButton>
        <ReButton layout="modern" type="primary" icon="Setting" v-admin @click="handleCreate">新增租户</ReButton>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-3">
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
    </div>

    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true">
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
          <div class="flex-1" />
          <ReButton layout="modern" type="primary" icon="Refresh" @click="tableRef?.reload()">查询</ReButton>
          <ReButton layout="modern" @click="query.sysTenantName = undefined; query.sysTenantUsername = undefined; query.sysTenantStatus = undefined; tableRef?.reload()">重置</ReButton>
        </div>
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
      >
        <template #status="{ row }">
          <ReTag :type="row.sysTenantStatus === 1 ? 'danger' : 'success'" size="small" effect="plain">
            {{ row.sysTenantStatus === 1 ? "禁用" : "启用" }}
          </ReTag>
        </template>
        <template #serviceCount="{ row }">
          <ReTag type="info" size="small" effect="plain">{{ (row.serviceIds as unknown[])?.length ?? 0 }}</ReTag>
        </template>
        <template #action="{ row }">
          <ReButton layout="modern" link type="primary" :icon="EditPen" @click="handleEdit(row)">编辑</ReButton>
          <ReButton layout="modern" link type="primary" icon="Setting" v-admin @click="handleOpenBind(row)">分配服务</ReButton>
          <ReButton layout="modern" link type="warning" :icon="Key" v-admin @click="handleOpenResetPwd(row)">重置密码</ReButton>
          <ReButton layout="modern" link type="primary" v-admin @click="handleResetMenu(row)">重置菜单</ReButton>
          <ReButton layout="modern" link :type="row.sysTenantStatus === 1 ? 'success' : 'info'" @click="handleToggleStatus(row)">
            {{ row.sysTenantStatus === 1 ? "启用" : "禁用" }}
          </ReButton>
          <ReButton layout="modern" link type="danger" icon="Delete" v-admin @click="handleDelete(row)">删除</ReButton>
        </template>
      </ReTable>
    </el-card>

    <TenantFormDialog v-model:visible="formDialogVisible" v-model:model="currentTenant" :mode="formMode" @success="handleDialogSuccess" />
    <TenantServiceBindDialog v-model:visible="bindDialogVisible" :tenant="currentTenant" @success="handleDialogSuccess" />
    <TenantResetPasswordDialog v-model:visible="pwdDialogVisible" :tenant="currentTenant" @success="handleDialogSuccess" />
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
</style>
