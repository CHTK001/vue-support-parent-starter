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

/** 查询条件 */
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

/** 租户统计 */
const stats = ref<SysTenantStats>({});

/** ReTable loader：远程分页加载租户 */
async function loadTenants({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForTenant({
    page,
    pageSize,
    sysTenantName: (params.sysTenantName as string) || undefined,
    sysTenantUsername: (params.sysTenantUsername as string) || undefined,
    sysTenantStatus: (params.sysTenantStatus as number) || undefined,
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const tableRef = ref();

async function refreshStats() {
  const res = await tenantStats();
  stats.value = res?.data ?? {};
}

/** 新增/编辑弹窗状态 */
const formDialogVisible = ref(false);
const formMode = ref<"create" | "edit">("create");
const currentTenant = ref<SysTenant>({});

/** 服务分配弹窗状态 */
const bindDialogVisible = ref(false);

/** 重置密码弹窗状态 */
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

/** 弹窗操作成功后统一刷新 */
function handleDialogSuccess() {
  tableRef.value?.reload();
  refreshStats();
}

/** 列定义 */
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
  { prop: "action", label: "操作", width: 250, slot: "action", fixed: "right", align: "center" },
];

onMounted(() => {
  refreshStats();
});
</script>

<template>
  <div class="flex h-full flex-col gap-4 p-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold">租户管理</h2>
        <p class="mt-1 text-sm text-[--el-text-color-secondary]">平台侧维护租户，向租户端分配服务并推送菜单与账号密码</p>
      </div>
      <div class="flex gap-2">
        <el-button type="primary" plain :icon="Refresh" @click="tableRef?.reload(); refreshStats()">刷新</el-button>
        <el-button v-admin type="primary" :icon="Setting" @click="handleCreate">新增租户</el-button>
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

    <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
      <ReSearch :is-expanded="true">
        <div class="flex flex-wrap items-center gap-3">
          <el-input
            v-model="query.sysTenantName"
            placeholder="租户名称"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
          <el-input
            v-model="query.sysTenantUsername"
            placeholder="租户账号"
            clearable
            class="!w-40"
            @keyup.enter="tableRef?.reload()"
          />
          <el-select v-model="query.sysTenantStatus" placeholder="状态" clearable class="!w-28">
            <el-option label="启用" :value="0" />
            <el-option label="禁用" :value="1" />
          </el-select>
          <el-button type="primary" :icon="Refresh" @click="tableRef?.reload()">查询</el-button>
          <el-button
            @click="query.sysTenantName = undefined; query.sysTenantUsername = undefined; query.sysTenantStatus = undefined; tableRef?.reload()"
          >
            重置
          </el-button>
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
        class="mt-2"
      >
        <template #status="{ row }">
          <el-tag :type="row.sysTenantStatus === 1 ? 'danger' : 'success'" size="small">
            {{ row.sysTenantStatus === 1 ? "禁用" : "启用" }}
          </el-tag>
        </template>
        <template #serviceCount="{ row }">
          <el-tag type="info" size="small">{{ (row.serviceIds as unknown[])?.length ?? 0 }}</el-tag>
        </template>
        <template #action="{ row }">
          <el-button link type="primary" :icon="EditPen" @click="handleEdit(row)">编辑</el-button>
          <el-button v-admin link type="primary" :icon="Setting" @click="handleOpenBind(row)">分配服务</el-button>
          <el-button v-admin link type="warning" :icon="Key" @click="handleOpenResetPwd(row)">重置密码</el-button>
          <el-button v-admin link type="primary" @click="handleResetMenu(row)">重置菜单</el-button>
          <el-button link :type="row.sysTenantStatus === 1 ? 'success' : 'info'" @click="handleToggleStatus(row)">
            {{ row.sysTenantStatus === 1 ? "启用" : "禁用" }}
          </el-button>
          <el-button v-admin link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </ReTable>
    </el-card>

    <!-- 新增/编辑租户 -->
    <TenantFormDialog v-model:visible="formDialogVisible" v-model:model="currentTenant" :mode="formMode" @success="handleDialogSuccess" />

    <!-- 分配服务 -->
    <TenantServiceBindDialog v-model:visible="bindDialogVisible" :tenant="currentTenant" @success="handleDialogSuccess" />

    <!-- 重置密码 -->
    <TenantResetPasswordDialog v-model:visible="pwdDialogVisible" :tenant="currentTenant" @success="handleDialogSuccess" />
  </div>
</template>
