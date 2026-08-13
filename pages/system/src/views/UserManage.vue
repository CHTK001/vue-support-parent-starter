<script setup lang="ts">
/**
 * 用户管理页面
 *
 * 用户分页查询 + 增删改查 + 重置密码 + 分配角色。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { User, Plus, Edit, Delete, Search, Refresh, Key, UserFilled } from "@element-plus/icons-vue";
import {
  pageForUser,
  saveUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  listForRole,
  listDept,
} from "../api/systemApi";
import type { SysDept, SysRole, SysUser, SysUserUpdate } from "../api/types";
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
  const res = await pageForUser({
    page,
    pageSize,
    sysUserName: (params.sysUserName as string) || undefined,
    sysUserPhone: (params.sysUserPhone as string) || undefined,
    sysUserStatus: params.sysUserStatus === "" ? undefined : (params.sysUserStatus as number),
    sysDeptId: params.sysDeptId === "" ? undefined : (params.sysDeptId as number),
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const tableRef = ref();

const roles = ref<SysRole[]>([]);
const depts = ref<SysDept[]>([]);

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

function handleReset() {
  query.value = { page: 1, pageSize: 10 };
  tableRef.value?.reload();
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
  ];
  const clean: SysUserUpdate = {
    ...editableFields.reduce((acc, k) => {
      if (user[k] !== undefined) acc[k] = user[k];
      return acc;
    }, {} as Record<string, unknown>),
    roleIds: user.userRoles?.map((r) => r.sysRoleId).filter((v): v is number => !!v) ?? [],
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

const columns: ReTableColumn[] = [
  { prop: "sysUserUsername", label: "账号", minWidth: 130, slot: "username" },
  { prop: "sysUserNickname", label: "昵称", minWidth: 120 },
  { prop: "sysUserPhone", label: "手机号", minWidth: 130 },
  { prop: "sysUserEmail", label: "邮箱", minWidth: 180, showOverflowTooltip: true },
  { prop: "roles", label: "角色", minWidth: 160, slot: "roles" },
  { prop: "sysUserLastAddress", label: "最近登录", minWidth: 160, showOverflowTooltip: true },
  { prop: "sysUserLastIp", label: "最近 IP", minWidth: 120 },
  { prop: "sysUserStatus", label: "状态", width: 100, slot: "status", align: "center" },
  { prop: "createTime", label: "创建时间", width: 170 },
  { prop: "action", label: "操作", width: 320, slot: "action", fixed: "right" },
];

onMounted(() => {
  tableRef.value?.reload();
  loadRoles();
  loadDepts();
});
</script>

<template>
  <div class="system-page">
    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true" @add="handleAdd">
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
        </template>
      </ReSearch>

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
      >
        <template #username="{ row }">
          <div class="flex items-center gap-2">
            <el-avatar :size="28" :src="row.sysUserAvatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span>{{ row.sysUserUsername }}</span>
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
          <ReSwitch
            layout="modern"
            :model-value="row.sysUserStatus === 0"
            :disabled="statusLoading === row.sysUserId"
            @update:model-value="() => handleStatus(row)"
          />
        </template>
        <template #action="{ row }">
          <ReButton layout="modern" link type="primary" :icon="UserFilled" v-admin @click="openRoleDialog(row)">分配角色</ReButton>
          <ReButton layout="modern" link type="primary" icon="Edit" v-admin @click="handleEdit(row)">编辑</ReButton>
          <ReButton layout="modern" link type="warning" :icon="Key" v-admin :loading="resettingPwd === row.sysUserId" @click="handleResetPwd(row)">重置密码</ReButton>
          <ReButton layout="modern" link type="danger" icon="Delete" v-admin :loading="deleteLoading === row.sysUserId" @click="handleDelete(row)">删除</ReButton>
        </template>
      </ReTable>
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
              <ReInput layout="modern" v-model="form.sysUserUsername" placeholder="登录账号" :disabled="isEdit" />
            </el-form-item>
            <el-form-item label="密码" v-if="!isEdit" required>
              <ReInput layout="modern" v-model="form.sysUserPassword" type="password" show-password placeholder="登录密码" />
            </el-form-item>
            <el-form-item label="昵称" required>
              <ReInput layout="modern" v-model="form.sysUserNickname" placeholder="显示名称" />
            </el-form-item>
            <el-form-item label="手机号">
              <ReInput layout="modern" v-model="form.sysUserPhone" placeholder="11 位手机号" />
            </el-form-item>
            <el-form-item label="邮箱">
              <ReInput layout="modern" v-model="form.sysUserEmail" placeholder="电子邮箱" />
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
            <el-form-item label="备注" class="user-dialog__full">
              <ReInput layout="modern" v-model="form.sysUserRemark" type="textarea" :rows="2" />
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
</style>
