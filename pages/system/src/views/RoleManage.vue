<script setup lang="ts">
/**
 * 角色管理页面
 *
 * 角色分页查询 + 增删改查 + 分配菜单权限（drawer 树形勾选）。
 */
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { UserFilled, Plus, Edit, Delete, Search, Refresh, Menu as MenuIcon } from "@element-plus/icons-vue";
import {
  pageForRole,
  saveRole,
  updateRole,
  deleteRole,
  getRoleMenu,
  updateRoleMenu,
  listMenuTree,
} from "../api/systemApi";
import type { SysMenu, SysRole } from "../api/types";

const query = reactive<{
  page: number;
  pageSize: number;
  sysRoleName?: string;
  sysRoleCode?: string;
  sysRoleStatus?: number;
}>({
  page: 1,
  pageSize: 10,
  sysRoleName: undefined,
  sysRoleCode: undefined,
  sysRoleStatus: undefined,
});
const list = ref<SysRole[]>([]);
const total = ref(0);
const loading = ref(false);

const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive<SysRole>({});
const isEdit = ref(false);

const permVisible = ref(false);
const permSaving = ref(false);
const menuTree = ref<SysMenu[]>([]);
const checkedMenuIds = ref<number[]>([]);
const currentRole = ref<SysRole | null>(null);

async function loadList() {
  loading.value = true;
  try {
    const res = await pageForRole(query);
    list.value = (res?.data?.data ?? res?.data?.records ?? []) as SysRole[];
    total.value = res?.data?.total ?? 0;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "角色列表加载失败");
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  query.sysRoleName = undefined;
  query.sysRoleCode = undefined;
  query.sysRoleStatus = undefined;
  query.page = 1;
  loadList();
}

function handleAdd() {
  isEdit.value = false;
  Object.keys(form).forEach((k) => delete (form as Record<string, unknown>)[k]);
  Object.assign(form, { sysRoleStatus: 1, sysRoleSort: 0 });
  dialogVisible.value = true;
}

function handleEdit(row: SysRole) {
  isEdit.value = true;
  Object.assign(form, { ...row });
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.sysRoleName || !form.sysRoleCode) {
    ElMessage.warning("请输入角色名称和编码");
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateRole(form);
      ElMessage.success("修改成功");
    } else {
      await saveRole(form);
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

async function handleDelete(row: SysRole) {
  await ElMessageBox.confirm(`确认删除角色「${row.sysRoleName}」？`, "提示", { type: "warning" });
  await deleteRole(row.sysRoleId!);
  ElMessage.success("删除成功");
  loadList();
}

async function handleStatus(row: SysRole) {
  await updateRole({
    ...row,
    sysRoleStatus: row.sysRoleStatus === 1 ? 0 : 1,
  });
  ElMessage.success(row.sysRoleStatus === 1 ? "已启用" : "已停用");
  loadList();
}

async function openPermDialog(row: SysRole) {
  currentRole.value = row;
  permVisible.value = true;
  try {
    const [menuRes, checkedRes] = await Promise.all([listMenuTree(), getRoleMenu(row.sysRoleId!)]);
    menuTree.value = (menuRes?.data ?? []) as SysMenu[];
    checkedMenuIds.value = (checkedRes?.data ?? []) as number[];
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "权限加载失败");
  }
}

async function handleSavePerm() {
  if (!currentRole.value) return;
  permSaving.value = true;
  try {
    // element-plus el-tree 仅返回半选+全选节点，需合并所有父节点；这里后端一般接 menuId 数组
    const checked = checkedMenuIds.value;
    await updateRoleMenu({ roleId: currentRole.value.sysRoleId, menuId: checked });
    ElMessage.success("权限已更新");
    permVisible.value = false;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    permSaving.value = false;
  }
}

function handlePageChange(p: number) {
  query.page = p;
  loadList();
}

onMounted(loadList);
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-[--el-text-color-primary]">
          角色管理
        </h2>
        <p class="mt-1 text-sm text-[--el-text-color-secondary]">
          维护系统角色并配置菜单权限
        </p>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增角色</el-button>
    </div>

    <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <el-input v-model="query.sysRoleName" placeholder="角色名称" clearable class="!w-44" @keyup.enter="handleReset" />
        <el-input v-model="query.sysRoleCode" placeholder="角色编码" clearable class="!w-44" @keyup.enter="handleReset" />
        <el-select v-model="query.sysRoleStatus" placeholder="状态" clearable class="!w-32">
          <el-option :value="1" label="启用" />
          <el-option :value="0" label="禁用" />
        </el-select>
        <div class="flex-1" />
        <el-button type="primary" :icon="Search" @click="handleReset">查询</el-button>
        <el-button :icon="Refresh" @click="loadList">刷新</el-button>
      </div>
      <el-table v-loading="loading" :data="list" stripe class="w-full">
        <el-table-column prop="sysRoleName" label="角色名称" min-width="140">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-icon :size="16" color="var(--el-color-primary)"><UserFilled /></el-icon>
              <span>{{ row.sysRoleName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sysRoleCode" label="角色编码" min-width="140" />
        <el-table-column prop="sysRoleSort" label="排序" width="80" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-switch :model-value="row.sysRoleStatus === 1" @change="handleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="系统" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.sysRoleInSystem === 1" type="warning" size="small" effect="plain">内置</el-tag>
            <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sysRoleRemark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="MenuIcon" @click="openPermDialog(row)">分配菜单</el-button>
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
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

    <!-- 角色编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="520"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="100px" :model="form">
        <el-form-item label="角色名称" required>
          <el-input v-model="form.sysRoleName" placeholder="如：内容管理员" />
        </el-form-item>
        <el-form-item label="角色编码" required>
          <el-input v-model="form.sysRoleCode" placeholder="如：content_admin" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sysRoleSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.sysRoleStatus">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.sysRoleRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配菜单弹窗 -->
    <el-dialog
      v-model="permVisible"
      :title="`分配菜单权限 - ${currentRole?.sysRoleName ?? ''}`"
      width="560"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-tree
        ref="menuTreeRef"
        :data="menuTree"
        :props="{ label: 'sysMenuTitle', children: 'children' }"
        node-key="sysMenuId"
        show-checkbox
        :default-checked-keys="checkedMenuIds"
        :default-expand-all="false"
      />
      <template #footer>
        <el-button @click="permVisible = false">取消</el-button>
        <el-button type="primary" :loading="permSaving" @click="handleSavePerm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
