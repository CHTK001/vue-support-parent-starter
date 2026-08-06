<script setup lang="ts">
/**
 * 用户管理页面
 *
 * 用户分页查询 + 增删改查 + 重置密码 + 分配角色。
 * 数据源：/v2/user/* 与 /v2/role/list。
 */
import { onMounted, reactive, ref } from "vue";
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

const query = reactive<{
  page: number;
  pageSize: number;
  sysUserName?: string;
  sysUserPhone?: string;
  sysUserStatus?: number;
  sysDeptId?: number;
}>({
  page: 1,
  pageSize: 10,
  sysUserName: undefined,
  sysUserPhone: undefined,
  sysUserStatus: undefined,
  sysDeptId: undefined,
});
const list = ref<SysUser[]>([]);
const total = ref(0);
const loading = ref(false);

const roles = ref<SysRole[]>([]);
const depts = ref<SysDept[]>([]);

const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = reactive<SysUserUpdate>({});

const roleDialogVisible = ref(false);
const roleSaving = ref(false);
const currentUser = ref<SysUser | null>(null);
const userRoleIds = ref<number[]>([]);

async function loadList() {
  loading.value = true;
  try {
    const res = await pageForUser(query);
    list.value = (res?.data?.data ?? res?.data?.records ?? []) as SysUser[];
    total.value = res?.data?.total ?? 0;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "用户列表加载失败");
  } finally {
    loading.value = false;
  }
}

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
  query.sysUserName = undefined;
  query.sysUserPhone = undefined;
  query.sysUserStatus = undefined;
  query.sysDeptId = undefined;
  query.page = 1;
  loadList();
}

function handleAdd() {
  isEdit.value = false;
  Object.keys(form).forEach((k) => delete (form as Record<string, unknown>)[k]);
  Object.assign(form, { sysUserStatus: 0, sysUserSex: 0 });
  dialogVisible.value = true;
}

function handleEdit(row: SysUser) {
  isEdit.value = true;
  Object.assign(form, { ...row, roleIds: row.userRoles?.map((r) => r.sysRoleId).filter((v): v is number => !!v) ?? [] });
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.sysUserUsername || (!isEdit.value && !form.sysUserPassword) || !form.sysUserNickname) {
    ElMessage.warning("请填写账号、密码、昵称");
    return;
  }
  saving.value = true;
  try {
    const data: SysUserUpdate = { ...form, updateRole: form.roleIds && form.roleIds.length > 0 };
    if (isEdit.value) {
      await updateUser(data);
      ElMessage.success("修改成功");
    } else {
      await saveUser(data);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    loadList();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: SysUser) {
  await ElMessageBox.confirm(`确认删除用户「${row.sysUserNickname ?? row.sysUserUsername}」？`, "提示", {
    type: "warning",
  });
  await deleteUser(row.sysUserId!);
  ElMessage.success("删除成功");
  loadList();
}

async function handleStatus(row: SysUser) {
  await updateUser({ ...row, sysUserStatus: row.sysUserStatus === 0 ? 1 : 0 });
  ElMessage.success(row.sysUserStatus === 0 ? "已启用" : "已禁用");
  loadList();
}

async function handleResetPwd(row: SysUser) {
  await ElMessageBox.confirm(`确认重置「${row.sysUserNickname ?? row.sysUserUsername}」的密码？`, "提示", {
    type: "warning",
  });
  const res = await resetUserPassword(row.sysUserId!);
  await ElMessageBox.alert(`新密码：${res?.data ?? "(后端未返回)"}，请妥善保存`, "重置成功", {
    type: "success",
  });
}

function openRoleDialog(row: SysUser) {
  currentUser.value = row;
  userRoleIds.value = (row.userRoles ?? [])
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
    loadList();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    roleSaving.value = false;
  }
}

function handlePageChange(p: number) {
  query.page = p;
  loadList();
}

onMounted(() => {
  loadList();
  loadRoles();
  loadDepts();
});
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-[--el-text-color-primary]">
          用户管理
        </h2>
        <p class="mt-1 text-sm text-[--el-text-color-secondary]">
          维护系统用户账号、分配角色与部门
        </p>
      </div>
      <el-button type="primary" v-admin :icon="Plus" @click="handleAdd">新增用户</el-button>
    </div>

    <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <el-input v-model="query.sysUserName" placeholder="用户名称" clearable class="!w-44" @keyup.enter="handleReset" />
        <el-input v-model="query.sysUserPhone" placeholder="手机号" clearable class="!w-44" @keyup.enter="handleReset" />
        <el-tree-select
          v-model="query.sysDeptId"
          :data="depts"
          :props="{ value: 'sysDeptId', label: 'sysDeptName', children: 'children' }"
          check-strictly
          clearable
          placeholder="部门"
          class="!w-44"
        />
        <el-select v-model="query.sysUserStatus" placeholder="状态" clearable class="!w-32">
          <el-option :value="0" label="启用" />
          <el-option :value="1" label="禁用" />
        </el-select>
        <div class="flex-1" />
        <el-button type="primary" :icon="Search" @click="handleReset">查询</el-button>
        <el-button :icon="Refresh" @click="loadList">刷新</el-button>
      </div>
      <el-table v-loading="loading" :data="list" stripe class="w-full">
        <el-table-column prop="sysUserUsername" label="账号" min-width="120">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-avatar :size="28" :src="row.sysUserAvatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span>{{ row.sysUserUsername }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sysUserNickname" label="昵称" min-width="120" />
        <el-table-column prop="sysUserPhone" label="手机号" min-width="130" />
        <el-table-column prop="sysUserEmail" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column label="角色" min-width="160">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.userRoles ?? []"
              :key="role.sysRoleId"
              size="small"
              effect="plain"
              class="mr-1"
            >
              {{ role.sysRoleName }}
            </el-tag>
            <span v-if="!row.userRoles?.length" class="text-xs text-[--el-text-color-secondary]">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sysUserLastAddress" label="最近登录" min-width="160" show-overflow-tooltip />
        <el-table-column prop="sysUserLastIp" label="最近 IP" min-width="120" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-switch :model-value="row.sysUserStatus === 0" @change="handleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button v-admin link type="primary" :icon="UserFilled" @click="openRoleDialog(row)">分配角色</el-button>
            <el-button v-admin link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button v-admin link type="warning" :icon="Key" @click="handleResetPwd(row)">重置密码</el-button>
            <el-button v-admin link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-4 flex justify-end">
        <el-pagination
          :total="total"
          :current-page="query.page"
          :page-size="query.pageSize"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 用户编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="640"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="100px" :model="form">
        <el-form-item label="账号" required>
          <el-input v-model="form.sysUserUsername" placeholder="登录账号" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="密码" v-if="!isEdit" required>
          <el-input v-model="form.sysUserPassword" type="password" show-password placeholder="登录密码" />
        </el-form-item>
        <el-form-item label="昵称" required>
          <el-input v-model="form.sysUserNickname" placeholder="显示名称" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.sysUserPhone" placeholder="11 位手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.sysUserEmail" placeholder="电子邮箱" />
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
        <el-form-item label="角色">
          <el-select v-model="form.roleIds" multiple placeholder="分配角色" class="w-full">
            <el-option v-for="r in roles" :key="r.sysRoleId" :label="r.sysRoleName" :value="r.sysRoleId" />
          </el-select>
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="form.sysUserSex">
            <el-radio :value="0">男</el-radio>
            <el-radio :value="1">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.sysUserStatus">
            <el-radio :value="0">启用</el-radio>
            <el-radio :value="1">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.sysUserRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配角色弹窗 -->
    <el-dialog
      v-model="roleDialogVisible"
      :title="`分配角色 - ${currentUser?.sysUserNickname ?? currentUser?.sysUserUsername ?? ''}`"
      width="480"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-checkbox-group v-model="userRoleIds">
        <div v-for="r in roles" :key="r.sysRoleId" class="py-1">
          <el-checkbox :value="r.sysRoleId">{{ r.sysRoleName }} ({{ r.sysRoleCode }})</el-checkbox>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="roleSaving" @click="handleSaveRoles">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
