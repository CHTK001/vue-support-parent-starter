<script setup lang="ts">
/**
 * 用户管理页面
 *
 * 用户分页查询 + 增删改查 + 重置密码 + 分配角色。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { computed, nextTick, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { User, Plus, Edit, Delete, Search, Refresh, Key, UserFilled, Upload, Download, More, Lock, Unlock, View, CopyDocument } from "@element-plus/icons-vue";
import {
  pageForUser,
  saveUser,
  updateUser,
  deleteUser,
  deleteUsers,
  updateUsersStatus,
  resetUserPassword,
  listForRole,
  listForPost,
  listDept,
  exportUsers,
  importUsers,
  downloadUserTemplate,
  lockUser,
  unbindTotp,
} from "../api/systemApi";
import type { SysDept, SysPost, SysRole, SysUser, SysUserUpdate } from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import useUserStore from "@repo/pinia/modules/user";

const userStore = useUserStore();
const statusLoading = ref<number>(0);
const deleteLoading = ref<number>(0);
const resettingPwd = ref<number>(0);

const userSexOptions = [
  { label: "男", value: 0 },
  { label: "女", value: 1 },
];

const userStatusOptions = [
  { label: "启用", value: 0 },
  { label: "禁用", value: 1 },
];

const query = ref<{
  page: number;
  pageSize: number;
  sysUserName?: string;
  sysUserPhone?: string;
  sysUserStatus?: number;
  sysDeptId?: number;
}>({
  page: 1,
  pageSize: 10,
});

async function loadUsers({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  (window).__loadUsersPage = query.value.page;
  (window).__debugPage = { queryPage: query.value.page, paramPage: page };
  const res = await pageForUser({
    page: query.value.page || page,
    pageSize: query.value.pageSize || pageSize,
    sysUserName: (params.sysUserName as string) || undefined,
    sysUserPhone: (params.sysUserPhone as string) || undefined,
    sysUserStatus: params.sysUserStatus === "" ? undefined : (params.sysUserStatus as number),
    sysDeptId: params.sysDeptId === "" ? undefined : (params.sysDeptId as number),
  });
  total.value = res?.data?.total ?? 0;
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const tableRef = ref();
const total = ref(0);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / (query.value.pageSize || 10))));
function goPage(p: number) {
  query.value.page = p;
  // 直接调用 ReTable 的 goto，它会同步 internalPage 并 reload
  tableRef.value?.goto(p);
}

const roles = ref<SysRole[]>([]);
const depts = ref<SysDept[]>([]);
const posts = ref<SysPost[]>([]);

async function loadRoles() {
  try {
    const res = await listForRole();
    roles.value = (res?.data ?? []) as SysRole[];
  } catch (e) {
    console.warn("[user] 角色列表加载失败", e);
  }
}

async function loadDepts() {
  try {
    const res = await listDept();
    depts.value = (res?.data ?? []) as SysDept[];
  } catch (e) {
    console.warn("[user] 部门列表加载失败", e);
  }
}

async function loadPosts() {
  try {
    const res = await listForPost();
    posts.value = (res?.data ?? []) as SysPost[];
  } catch (e) {
    console.warn("[user] 岗位列表加载失败", e);
  }
}

/* ================== 多选与批量操作 ================== */
const selectedRows = ref<SysUser[]>([]);
const batchLoading = ref(false);

function handleSelectionChange(rows: SysUser[]) {
  selectedRows.value = rows;
}

/** 选中的用户ID（过滤掉当前登录用户） */
function selectedUserIds(): number[] {
  return selectedRows.value
    .map((u) => u.sysUserId)
    .filter((v): v is number => !!v);
}

function isSelf(user: SysUser): boolean {
  return user.sysUserUsername === userStore.loginName || user.sysUserUsername === userStore.username;
}

/* ================== 只读 / 锁定 / 2FA 辅助 ================== */

/** 任意角色编码命中 readonly（忽略大小写）即视为只读用户 */
function isReadonlyUser(user: SysUser): boolean {
  const codes = (user.userRoles ?? []).map((r) => (r.sysRoleCode ?? "").toLowerCase());
  return codes.some((c) => c.includes("readonly") || c === "read_only" || c === "ro");
}

/** 是否已绑定 2FA（列表返回 sysUserTotpCode 非空即视为已绑定） */
function hasTotp(user: SysUser): boolean {
  return !!(user as unknown as Record<string, unknown>).sysUserTotpCode;
}

/** 是否已锁定（sysUserLock=1） */
function isLocked(user: SysUser): boolean {
  return Number((user as unknown as Record<string, unknown>).sysUserLock) === 1;
}

/** 锁定用户行浅红背景 */
function rowClassName({ row }: { row: Record<string, unknown> }): string {
  return Number((row as Record<string, unknown>).sysUserLock) === 1 ? "user-locked-row" : "";
}

const lockLoading = ref<number>(0);

/** 锁定 / 解锁切换 */
async function handleToggleLock(row: Record<string, unknown>) {
  const user = row as unknown as SysUser;
  if (!user.sysUserId) return;
  const locking = !isLocked(user);
  try {
    await ElMessageBox.confirm(
      `确认${locking ? "锁定" : "解锁"}用户「${user.sysUserNickname ?? user.sysUserUsername}」？`,
      locking ? "锁定确认" : "解锁确认",
      { type: "warning" },
    );
  } catch {
    return;
  }
  lockLoading.value = user.sysUserId;
  try {
    await lockUser(user.sysUserId, locking ? 1 : 0);
    ElMessage.success(locking ? "已锁定" : "已解锁");
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "操作失败");
  } finally {
    lockLoading.value = 0;
  }
}

/** 管理员强制解绑 2FA */
async function handleUnbindTotp(row: Record<string, unknown>) {
  const user = row as unknown as SysUser;
  if (!user.sysUserId) return;
  try {
    await ElMessageBox.confirm(
      `确认强制解绑「${user.sysUserNickname ?? user.sysUserUsername}」的二次验证（2FA）？`,
      "解绑确认",
      { type: "warning" },
    );
  } catch {
    return;
  }
  try {
    await unbindTotp();
    ElMessage.success("已解绑 2FA");
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "解绑失败");
  }
}

async function handleBatchStatus(status: number) {
  const ids = selectedUserIds();
  if (!ids.length) {
    ElMessage.warning("请先选择用户");
    return;
  }
  const actionText = status === 0 ? "启用" : "禁用";
  try {
    await ElMessageBox.confirm(`确认批量${actionText}选中的 ${ids.length} 个用户？`, "批量操作确认", { type: "warning" });
  } catch {
    return;
  }
  batchLoading.value = true;
  try {
    await updateUsersStatus(ids, status);
    ElMessage.success(`已批量${actionText}`);
    selectedRows.value = [];
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "批量操作失败");
  } finally {
    batchLoading.value = false;
  }
}

async function handleBatchDelete() {
  const ids = selectedUserIds();
  if (!ids.length) {
    ElMessage.warning("请先选择用户");
    return;
  }
  try {
    await ElMessageBox.confirm(`确认批量删除选中的 ${ids.length} 个用户？此操作不可恢复`, "批量删除确认", { type: "warning" });
  } catch {
    return;
  }
  batchLoading.value = true;
  try {
    await deleteUsers(ids);
    ElMessage.success("批量删除成功");
    selectedRows.value = [];
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "批量删除失败");
  } finally {
    batchLoading.value = false;
  }
}

/* ================== 用户详情抽屉 ================== */
const detailDrawerVisible = ref(false);
const detailUser = ref<SysUser | null>(null);

function openDetail(row: Record<string, unknown>) {
  detailUser.value = row as unknown as SysUser;
  detailDrawerVisible.value = true;
}

/** 按部门ID查找部门名称 */
function deptNameOf(deptId?: number): string {
  if (!deptId) return "-";
  const walk = (nodes: SysDept[]): string | null => {
    for (const n of nodes) {
      if (n.sysDeptId === deptId) return n.sysDeptName ?? "";
      if (n.children?.length) {
        const hit = walk(n.children);
        if (hit) return hit;
      }
    }
    return null;
  };
  return walk(depts.value) ?? "-";
}

function handleReset() {
  query.value = { page: 1, pageSize: 10 };
  tableRef.value?.reload();
}

/* ================== 导入导出 ================== */

const importInput = ref<HTMLInputElement>();
const importing = ref(false);
const exporting = ref(false);

/** 触发文件选择 */
function triggerImport() {
  importInput.value?.click();
}

/** 下载导入模板 */
async function handleDownloadTemplate() {
  try {
    const blob = await downloadUserTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "用户导入模板.xlsx";
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success("模板下载成功");
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "模板下载失败");
  }
}

/** 导出当前筛选结果 */
async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportUsers({
      sysUserName: query.value.sysUserName,
      sysUserPhone: query.value.sysUserPhone,
      sysUserStatus: query.value.sysUserStatus,
      sysDeptId: query.value.sysDeptId,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `用户列表_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success("导出成功");
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "导出失败");
  } finally {
    exporting.value = false;
  }
}

/** 处理文件选择并导入 */
async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  importing.value = true;
  try {
    const res = await importUsers(file);
    if (res?.code === 200 || res?.status === 200) {
      ElMessage.success(res?.data ?? "导入成功");
      tableRef.value?.reload();
    } else {
      ElMessage.error(res?.msg ?? "导入失败");
    }
  } catch (err) {
    ElMessage.error((err as Error)?.message ?? "导入失败");
  } finally {
    importing.value = false;
    input.value = "";
  }
}

const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = ref<SysUserUpdate>({});

function handleAdd() {
  isEdit.value = false;
  form.value = { sysUserStatus: 0, sysUserSex: 0 };
  dialogVisible.value = true;
}

function handleEdit(row: Record<string, unknown>) {
  const user = row as unknown as SysUser;
  isEdit.value = true;
  const editableFields: (keyof SysUser)[] = [
    "sysUserId",
    "sysUserUsername",
    "sysUserNickname",
    "sysUserAvatar",
    "sysDeptId",
    "sysUserStatus",
    "sysUserPhone",
    "sysUserEmail",
    "sysUserSex",
    "sysUserRemark",
    "roleIds",
    "postIds",
  ];
  const clean: SysUserUpdate = {
    ...editableFields.reduce((acc, k) => {
      if (user[k] !== undefined) acc[k] = user[k];
      return acc;
    }, {} as Record<string, unknown>),
    roleIds: user.userRoles?.map((r) => r.sysRoleId).filter((v): v is number => !!v) ?? [],
    postIds: user.userPosts?.map((p) => p.sysPostId).filter((v): v is number => !!v) ?? [],
  };
  form.value = clean;
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.sysUserUsername || (!isEdit.value && !form.value.sysUserPassword) || !form.value.sysUserNickname) {
    ElMessage.warning("请填写账号、密码、昵称");
    return;
  }
  saving.value = true;
  try {
    const data: SysUserUpdate = { ...form.value, updateRole: form.value.roleIds && form.value.roleIds.length > 0 };
    if (isEdit.value) {
      await updateUser(data);
      ElMessage.success("修改成功");
    } else {
      await saveUser(data);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: Record<string, unknown>) {
  const user = row as unknown as SysUser;
  if (deleteLoading.value) return;
  try {
    await ElMessageBox.confirm(`确认删除用户「${user.sysUserNickname ?? user.sysUserUsername}」？`, "提示", {
      type: "warning",
      confirmButtonText: "确定删除",
    });
  } catch {
    return;
  }
  deleteLoading.value = user.sysUserId!;
  try {
    await deleteUser(user.sysUserId!);
    ElMessage.success("删除成功");
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "删除失败");
  } finally {
    deleteLoading.value = 0;
  }
}

async function handleStatus(row: Record<string, unknown>) {
  const user = row as unknown as SysUser;
  if (statusLoading.value) return;
  if (user.sysUserUsername === userStore.loginName || user.sysUserUsername === userStore.username) {
    ElMessage.warning("不允许禁用自己");
    return;
  }
  statusLoading.value = user.sysUserId!;
  try {
    await updateUser({ ...user, sysUserStatus: user.sysUserStatus === 0 ? 1 : 0 });
    ElMessage.success(user.sysUserStatus === 0 ? "已禁用" : "已启用");
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "操作失败");
  } finally {
    statusLoading.value = 0;
  }
}

async function handleResetPwd(row: Record<string, unknown>) {
  const user = row as unknown as SysUser;
  if (resettingPwd.value) return;
  try {
    await ElMessageBox.confirm(`确认重置「${user.sysUserNickname ?? user.sysUserUsername}」的密码？`, "提示", {
      type: "warning",
      confirmButtonText: "确定重置",
    });
  } catch {
    return;
  }
  resettingPwd.value = user.sysUserId!;
  try {
    const res = await resetUserPassword(user.sysUserId!);
    const newPwd = res?.data ?? "";
    await ElMessageBox.prompt("新密码（请妥善保管）", "重置成功", {
      confirmButtonText: "复制密码",
      cancelButtonText: "已记住",
      inputType: "password",
      inputPattern: /.+/,
      inputErrorMessage: "密码不能为空",
    }).then((confirmRes) => {
      if (confirmRes.action === "confirm" && newPwd) {
        navigator.clipboard.writeText(newPwd);
        ElMessage.success("密码已复制到剪贴板");
      }
    }).catch(() => {
      ElMessage.warning("请截图保存新密码，关闭后将无法再次查看");
      ElMessageBox.alert(`新密码：${newPwd}，请妥善保管`, "密码确认", {
        confirmButtonText: "确定",
        distinguishCancelAndClose: false,
      });
    });
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "重置失败");
  } finally {
    resettingPwd.value = 0;
  }
}

const roleDialogVisible = ref(false);
const roleSaving = ref(false);
const currentUser = ref<SysUser | null>(null);
const userRoleIds = ref<number[]>([]);

function openRoleDialog(row: Record<string, unknown>) {
  const user = row as unknown as SysUser;
  currentUser.value = user;
  userRoleIds.value = (user.userRoles ?? [])
    .map((r) => r.sysRoleId)
    .filter((v): v is number => !!v);
  roleDialogVisible.value = true;
}

async function handleSaveRoles() {
  if (!currentUser.value) return;
  roleSaving.value = true;
  try {
    await updateUser({
      ...currentUser.value,
      roleIds: userRoleIds.value,
      updateRole: true,
    });
    ElMessage.success("角色已更新");
    roleDialogVisible.value = false;
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    roleSaving.value = false;
  }
}

/** 「更多」下拉命令分发 */
function handleActionCommand(cmd: string, row: Record<string, unknown>) {
  if (cmd === "detail") openDetail(row);
  else if (cmd === "edit") handleEdit(row);
  else if (cmd === "role") openRoleDialog(row);
  else if (cmd === "resetPwd") handleResetPwd(row);
  else if (cmd === "delete") handleDelete(row);
  else if (cmd === "lock" || cmd === "unlock") handleToggleLock(row);
  else if (cmd === "unbindTotp") handleUnbindTotp(row);
}

const columns: ReTableColumn[] = [
  { type: "selection", width: 50, align: "center" },
  { prop: "sysUserUsername", label: "账号", minWidth: 150, slot: "username" },
  { prop: "sysUserNickname", label: "昵称", minWidth: 110 },
  { prop: "sysUserPhone", label: "手机号", minWidth: 130 },
  { prop: "sysUserEmail", label: "邮箱", minWidth: 180, showOverflowTooltip: true },
  { prop: "roles", label: "角色", minWidth: 160, slot: "roles" },
  { prop: "sysUserTotpCode", label: "2FA", width: 90, slot: "totp", align: "center" },
  { prop: "sysUserLastAddress", label: "最近登录", minWidth: 150, showOverflowTooltip: true },
  { prop: "sysUserLastIp", label: "最近 IP", minWidth: 120 },
  { prop: "sysUserStatus", label: "状态", width: 120, slot: "status", align: "center" },
  { prop: "createTime", label: "创建时间", width: 170 },
  { prop: "action", label: "操作", width: 110, slot: "action", fixed: "right", align: "center" },
];

onMounted(() => {
  tableRef.value?.reload();
  loadRoles();
  loadDepts();
  loadPosts();
});
</script>

<template>
  <div class="system-page">
    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true" filter-mode="data" @add="handleAdd">
        <div class="system-page__search">
          <ReInput
            layout="modern"
            v-model="query.sysUserName"
            placeholder="用户名称"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
          <ReInput
            layout="modern"
            v-model="query.sysUserPhone"
            placeholder="手机号"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
          <el-tree-select
            v-model="query.sysDeptId"
            :data="depts"
            :props="{ value: 'sysDeptId', label: 'sysDeptName', children: 'children' }"
            check-strictly
            clearable
            placeholder="部门"
            class="!w-44"
          />
          <ReSelect
            v-model="query.sysUserStatus"
            placeholder="状态"
            clearable
            class="!w-32"
            :data="[
              { label: '启用', value: 0 },
              { label: '禁用', value: 1 },
            ]"
          />
        </div>
        <template #footer>
          <ReButton layout="modern" type="primary" icon="Search" @click="tableRef?.reload()">查询</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="handleReset">重置</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="tableRef?.reload()">刷新</ReButton>
          <span class="system-page__divider" />
          <ReButton layout="modern" icon="Download" @click="handleDownloadTemplate">下载模板</ReButton>
          <ReButton layout="modern" icon="Upload" :loading="importing" @click="triggerImport">导入用户</ReButton>
          <ReButton layout="modern" icon="Download" type="success" :loading="exporting" @click="handleExport">导出</ReButton>
          <span class="system-page__divider" />
          <ReButton layout="modern" type="success" :disabled="!selectedRows.length" :loading="batchLoading" @click="handleBatchStatus(0)">批量启用</ReButton>
          <ReButton layout="modern" type="warning" :disabled="!selectedRows.length" :loading="batchLoading" @click="handleBatchStatus(1)">批量禁用</ReButton>
          <ReButton layout="modern" type="danger" :disabled="!selectedRows.length" :loading="batchLoading" @click="handleBatchDelete">批量删除</ReButton>
        </template>
      </ReSearch>

      <!-- 隐藏文件输入 -->
      <input
        ref="importInput"
        type="file"
        accept=".xlsx,.xls,.csv"
        style="display: none"
        @change="handleFileChange"
      />

      <ReTable
        ref="tableRef"
        table-id="system-user"
        :loader="loadUsers"
        :columns="columns"
        :pagination="true"
        :params="query"
        row-key="sysUserId"
        v-model:page="query.page"
        v-model:page-size="query.pageSize"
        :row-class-name="rowClassName"
        @selection-change="handleSelectionChange"
        @update:page="(p) => { window.__updatePageCalled = p; query.value.page = p; tableRef?.reload(); }"
      >
        <template #username="{ row }">
          <div class="flex items-center gap-2">
            <el-avatar :size="28" :src="row.sysUserAvatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span class="cursor-pointer text-[--el-color-primary]" @click="openDetail(row)">{{ row.sysUserUsername }}</span>
            <ReTag v-if="isReadonlyUser(row)" type="info" effect="plain" size="small">只读</ReTag>
          </div>
        </template>
        <template #roles="{ row }">
          <ReTag
            v-for="role in row.userRoles ?? []"
            :key="role.sysRoleId"
            type="primary"
            effect="plain"
            size="small"
            class="mr-1"
          >
            {{ role.sysRoleName }}
          </ReTag>
          <span v-if="!row.userRoles?.length" class="text-xs text-[--el-text-color-secondary]">-</span>
        </template>
        <template #status="{ row }">
          <div class="flex flex-col items-center gap-1">
            <ReSwitch
              layout="modern"
              :model-value="row.sysUserStatus === 0"
              :disabled="statusLoading === row.sysUserId"
              @update:model-value="() => handleStatus(row)"
            />
            <ReTag v-if="isLocked(row)" type="danger" effect="dark" size="small">已锁定</ReTag>
          </div>
        </template>
        <template #totp="{ row }">
          <ReTag v-if="hasTotp(row)" type="success" effect="plain" size="small">已启用</ReTag>
          <ReTag v-else type="info" effect="plain" size="small">未启用</ReTag>
        </template>
        <template #action="{ row }">
          <div class="row-actions">
            <el-tooltip content="编辑">
              <el-button link type="primary" :icon="Edit" :disabled="isSelf(row)" @click="handleEdit(row)" />
            </el-tooltip>
            <el-tooltip content="重置密码">
              <el-button link type="warning" :icon="Key" :loading="resettingPwd === row.sysUserId" @click="handleResetPwd(row)" />
            </el-tooltip>
            <el-tooltip content="删除">
              <el-button link type="danger" :icon="Delete" :disabled="isSelf(row)" @click="handleDelete(row)" />
            </el-tooltip>
          </div>
        </template>
      </ReTable>
      <!-- 自定义分页 -->
      <div class="custom-pagination">
        <span>total={{ total }} totalPages={{ totalPages }}</span>
        <button class="page-btn" :disabled="query.page <= 1" @click="goPage(query.page - 1)">‹</button>
        <button
          v-for="p in totalPages"
          :key="p"
          class="page-btn"
          :class="{ active: p === query.page }"
          @click="goPage(p)"
        >{{ p }}</button>
        <button class="page-btn" :disabled="query.page >= totalPages" @click="goPage(query.page + 1)">›</button>
      </div>
    </el-card>

    <!-- 用户编辑弹窗 -->
    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="720"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="saving"
      @ok="handleSubmit"
    >
      <div class="user-dialog__body">
        <el-form label-width="92px" :model="form" label-position="right">
          <div class="user-dialog__grid">
            <el-form-item label="账号" required>
              <ReInput layout="modern" v-model="form.sysUserUsername" placeholder="登录账号" :disabled="isEdit" maxlength="255" show-word-limit />
            </el-form-item>
            <el-form-item label="密码" v-if="!isEdit" required>
              <ReInput layout="modern" v-model="form.sysUserPassword" type="password" show-password placeholder="登录密码" maxlength="255" show-word-limit />
            </el-form-item>
            <el-form-item label="昵称" required>
              <ReInput layout="modern" v-model="form.sysUserNickname" placeholder="显示名称" maxlength="255" show-word-limit />
            </el-form-item>
            <el-form-item label="手机号">
              <ReInput layout="modern" v-model="form.sysUserPhone" placeholder="11 位手机号" maxlength="255" show-word-limit />
            </el-form-item>
            <el-form-item label="邮箱">
              <ReInput layout="modern" v-model="form.sysUserEmail" placeholder="电子邮箱" maxlength="255" show-word-limit />
            </el-form-item>
            <el-form-item label="性别">
              <el-segmented v-model="form.sysUserSex" :options="userSexOptions" />
            </el-form-item>
            <el-form-item label="状态">
              <el-segmented v-model="form.sysUserStatus" :options="userStatusOptions" />
            </el-form-item>
            <el-form-item label="部门">
              <el-tree-select
                v-model="form.sysDeptId"
                :data="depts"
                :props="{ value: 'sysDeptId', label: 'sysDeptName', children: 'children' }"
                check-strictly
                clearable
                placeholder="选择部门"
                class="w-full"
              />
            </el-form-item>
            <el-form-item label="角色" class="user-dialog__full">
              <ReSelect
                v-model="form.roleIds"
                multiple
                placeholder="分配角色"
                class="w-full"
                :data="roles.map((r) => ({ label: r.sysRoleName, value: r.sysRoleId }))"
              />
            </el-form-item>
            <el-form-item label="岗位" class="user-dialog__full">
              <ReSelect
                v-model="form.postIds"
                multiple
                placeholder="分配岗位（可多选）"
                class="w-full"
                :data="posts.map((p) => ({ label: p.sysPostName, value: p.sysPostId }))"
              />
            </el-form-item>
            <el-form-item label="备注" class="user-dialog__full">
              <ReInput layout="modern" v-model="form.sysUserRemark" type="textarea" :rows="2" maxlength="255" show-word-limit />
            </el-form-item>
          </div>
        </el-form>
      </div>
    </ReDialog>

    <!-- 分配角色弹窗 -->
    <ReDialog
      v-model="roleDialogVisible"
      :title="`分配角色 - ${currentUser?.sysUserNickname ?? currentUser?.sysUserUsername ?? ''}`"
      width="480"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="roleSaving"
      @ok="handleSaveRoles"
    >
      <el-checkbox-group v-model="userRoleIds">
        <div v-for="r in roles" :key="r.sysRoleId" class="py-1">
          <el-checkbox :value="r.sysRoleId">{{ r.sysRoleName }} ({{ r.sysRoleCode }})</el-checkbox>
        </div>
      </el-checkbox-group>
    </ReDialog>

    <!-- 用户详情抽屉 -->
    <ReDrawer
      v-model="detailDrawerVisible"
      title="用户详情"
      size="500"
      :show-window-shell="false"
      :close-on-click-modal="true"
      :footer-hidden="true"
    >
      <template #content v-if="detailUser">
        <div class="detail-section-title">基本信息</div>
        <el-descriptions :column="1" border :label-style="{ width: '110px', fontWeight: 600 }">
          <el-descriptions-item label="账号">{{ detailUser.sysUserUsername }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ detailUser.sysUserNickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detailUser.sysUserPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ detailUser.sysUserEmail || '-' }}</el-descriptions-item>
          <el-descriptions-item label="性别">
            {{ detailUser.sysUserSex === 1 ? '女' : detailUser.sysUserSex === 2 ? '保密' : '男' }}
          </el-descriptions-item>
          <el-descriptions-item label="部门">
            {{ deptNameOf(detailUser.sysDeptId) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <ReTag :type="detailUser.sysUserStatus === 0 ? 'success' : 'danger'" effect="plain" size="small">
              {{ detailUser.sysUserStatus === 0 ? '启用' : '禁用' }}
            </ReTag>
          </el-descriptions-item>
          <el-descriptions-item label="角色">
            <div v-if="detailUser.userRoles?.length" class="flex flex-wrap gap-1">
              <ReTag v-for="r in detailUser.userRoles" :key="r.sysRoleId" type="primary" effect="plain" size="small">
                {{ r.sysRoleName }}
              </ReTag>
            </div>
            <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="岗位">
            <div v-if="detailUser.userPosts?.length" class="flex flex-wrap gap-1">
              <ReTag v-for="p in detailUser.userPosts" :key="p.sysPostId" type="success" effect="plain" size="small">
                {{ p.sysPostName }}
              </ReTag>
            </div>
            <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="最后登录IP">{{ detailUser.sysUserLastIp || '-' }}</el-descriptions-item>
          <el-descriptions-item label="最后登录地点">{{ detailUser.sysUserLastAddress || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detailUser.createTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ detailUser.sysUserRemark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section-title">安全信息</div>
        <el-descriptions :column="1" border :label-style="{ width: '110px', fontWeight: 600 }">
          <el-descriptions-item label="锁定状态">
            <ReTag v-if="isLocked(detailUser)" type="danger" effect="plain" size="small">已锁定</ReTag>
            <ReTag v-else type="success" effect="plain" size="small">正常</ReTag>
          </el-descriptions-item>
          <el-descriptions-item label="2FA 状态">
            <ReTag v-if="hasTotp(detailUser)" type="success" effect="plain" size="small">已启用</ReTag>
            <ReTag v-else type="info" effect="plain" size="small">未启用</ReTag>
          </el-descriptions-item>
          <el-descriptions-item label="登录次数">
            {{ (detailUser as unknown as Record<string, unknown>).sysUserLoginCount ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="最后登录时间">
            {{ (detailUser as unknown as Record<string, unknown>).sysUserLastLoginTime ?? detailUser.sysUserLastAddress ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="密码最后修改">
            {{ (detailUser as unknown as Record<string, unknown>).sysUserPwdUpdateTime ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="强制改密">
            <ReTag
              v-if="Number((detailUser as unknown as Record<string, unknown>).sysUserForcePwd) === 1"
              type="warning"
              effect="plain"
              size="small"
            >
              是
            </ReTag>
            <span v-else class="text-xs text-[--el-text-color-secondary]">否</span>
          </el-descriptions-item>
        </el-descriptions>
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
.system-page__divider {
  display: inline-block;
  width: 1px;
  height: 16px;
  background: var(--el-border-color);
  margin: 0 4px;
}
.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.custom-pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
  padding: 12px 0;
}
.page-btn {
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-bg-color);
  cursor: pointer;
  font-size: 13px;
}
.page-btn:hover:not(:disabled):not(.active) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.page-btn.active {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #fff;
}
.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.user-dialog__body {
  padding: 4px 8px 0;
}
.user-dialog__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 18px;
}
.user-dialog__full {
  grid-column: 1 / -1;
}
.detail-section-title {
  margin: 16px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
:deep(.user-locked-row) {
  background: var(--el-color-danger-light-9);
}
</style>
