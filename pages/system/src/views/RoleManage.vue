<script setup lang="ts">
/**
 * 角色管理页面
 *
 * 角色分页查询 + 增删改查 + 分配菜单权限（drawer 树形勾选）。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { computed, defineAsyncComponent, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox, ElTree } from "element-plus";
import { UserFilled, Plus, Edit, Delete, Search, Refresh, Menu as MenuIcon } from "@element-plus/icons-vue";
const ReIcon = defineAsyncComponent(() => import("@repo/ui/re-icon").then((m) => m.default()));
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
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

const roleStatusOptions = [
  { label: "启用", value: 1 },
  { label: "禁用", value: 0 },
];

const query = ref<{
  page: number;
  pageSize: number;
  sysRoleName?: string;
  sysRoleCode?: string;
  sysRoleStatus?: number;
}>({
  page: 1,
  pageSize: 10,
});

async function loadRoles({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForRole({
    page,
    pageSize,
    sysRoleName: (params.sysRoleName as string) || undefined,
    sysRoleCode: (params.sysRoleCode as string) || undefined,
    sysRoleStatus: (params.sysRoleStatus as number) || undefined,
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const tableRef = ref();

const dialogVisible = ref(false);
const saving = ref(false);
const form = ref<SysRole>({});
const isEdit = ref(false);

function handleAdd() {
  isEdit.value = false;
  form.value = { sysRoleStatus: 1, sysRoleSort: 0 };
  dialogVisible.value = true;
}

function handleEdit(row: Record<string, unknown>) {
  isEdit.value = true;
  form.value = { ...(row as unknown as SysRole) };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.sysRoleName || !form.value.sysRoleCode) {
    ElMessage.warning("请输入角色名称和编码");
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateRole(form.value);
      ElMessage.success("修改成功");
    } else {
      await saveRole(form.value);
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
  const role = row as unknown as SysRole;
  await ElMessageBox.confirm(`确认删除角色「${role.sysRoleName}」？`, "提示", { type: "warning" });
  await deleteRole(role.sysRoleId!);
  ElMessage.success("删除成功");
  tableRef.value?.reload();
}

async function handleStatus(row: Record<string, unknown>) {
  const role = row as unknown as SysRole;
  await updateRole({ ...role, sysRoleStatus: role.sysRoleStatus === 1 ? 0 : 1 });
  ElMessage.success(role.sysRoleStatus === 1 ? "已启用" : "已停用");
  tableRef.value?.reload();
}

const permVisible = ref(false);
const permSaving = ref(false);
const menuTree = ref<SysMenu[]>([]);
const checkedMenuIds = ref<number[]>([]);
const currentRole = ref<SysRole | null>(null);
const menuTreeRef = ref<InstanceType<typeof ElTree>>();
const permSearchText = ref("");
const permTreeExpanded = ref<string[]>([]);

const filteredMenuTree = computed(() => {
  const q = permSearchText.value.trim().toLowerCase();
  if (!q) return menuTree.value;
  return filterTreeByText(menuTree.value, q);
});

/** 按标题/路由名/路径过滤树（命中节点保留其祖先） */
function filterTreeByText(nodes: SysMenu[], q: string): SysMenu[] {
  const result: SysMenu[] = [];
  nodes.forEach((n) => {
    const hit =
      (n.sysMenuTitle ?? "").toLowerCase().includes(q) ||
      (n.sysMenuName ?? "").toLowerCase().includes(q) ||
      (n.sysMenuPath ?? "").toLowerCase().includes(q);
    const children = n.children?.length ? filterTreeByText(n.children, q) : [];
    if (hit || children.length) {
      result.push({ ...n, children: children.length ? children : undefined });
    }
  });
  return result;
}

function expandAllPermTree() {
  permTreeExpanded.value = collectKeys(menuTree.value);
}

function collapsePermTree() {
  permTreeExpanded.value = [];
}

function collectKeys(nodes: SysMenu[]): string[] {
  const keys: string[] = [];
  const walk = (arr: SysMenu[]) => {
    arr.forEach((n) => {
      if (n.sysMenuId != null) keys.push(String(n.sysMenuId));
      if (n.children?.length) walk(n.children);
    });
  };
  walk(nodes);
  return keys;
}

async function openPermDialog(row: Record<string, unknown>) {
  const role = row as unknown as SysRole;
  currentRole.value = role;
  permVisible.value = true;
  permSearchText.value = "";
  permTreeExpanded.value = [];
  try {
    const [menuRes, checkedRes] = await Promise.all([listMenuTree(), getRoleMenu(role.sysRoleId!)]);
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
    const checked = menuTreeRef.value?.getCheckedKeys() as number[];
    await updateRoleMenu({ roleId: currentRole.value.sysRoleId, menuId: checked });
    ElMessage.success("权限已更新");
    permVisible.value = false;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    permSaving.value = false;
  }
}

function handleReset() {
  query.value = { page: 1, pageSize: 10 };
  tableRef.value?.reload();
}

const columns: ReTableColumn[] = [
  { prop: "sysRoleName", label: "角色名称", minWidth: 140, slot: "roleName" },
  { prop: "sysRoleCode", label: "角色编码", minWidth: 140 },
  { prop: "sysRoleSort", label: "排序", width: 80, align: "center" },
  { prop: "sysRoleStatus", label: "状态", width: 90, slot: "status", align: "center" },
  { prop: "sysRoleInSystem", label: "系统", width: 80, slot: "system", align: "center" },
  { prop: "sysRoleRemark", label: "备注", minWidth: 160, showOverflowTooltip: true },
  { prop: "createTime", label: "创建时间", width: 170 },
  { prop: "action", label: "操作", width: 260, slot: "action", fixed: "right" },
];

onMounted(() => {
  tableRef.value?.reload();
});
</script>

<template>
  <div class="system-page">
    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true" @add="handleAdd">
        <div class="system-page__search">
          <ReInput
            layout="modern"
            v-model="query.sysRoleName"
            placeholder="角色名称"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
          <ReInput
            layout="modern"
            v-model="query.sysRoleCode"
            placeholder="角色编码"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
          <ReSelect
            v-model="query.sysRoleStatus"
            placeholder="状态"
            clearable
            :data="[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]"
            class="!w-32"
          />
        </div>
        <template #footer>
          <ReButton layout="modern" type="primary" icon="Search" @click="tableRef?.reload()">查询</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="handleReset">重置</ReButton>
        </template>
      </ReSearch>

      <ReTable
        ref="tableRef"
        table-id="system-role"
        :loader="loadRoles"
        :columns="columns"
        :pagination="true"
        :params="query"
        row-key="sysRoleId"
        v-model:page="query.page"
        v-model:page-size="query.pageSize"
      >
        <template #roleName="{ row }">
          <div class="flex items-center gap-2">
            <el-icon :size="16" color="var(--el-color-primary)"><UserFilled /></el-icon>
            <span>{{ row.sysRoleName }}</span>
          </div>
        </template>
        <template #status="{ row }">
          <!-- 内置角色不允许显示切换按钮（连 disabled 状态也不显示，避免误操作） -->
          <ReTag v-if="row.sysRoleInSystem === 1" type="success" effect="plain" size="small">已启用</ReTag>
          <ReSwitch
            v-else
            layout="modern"
            :model-value="row.sysRoleStatus === 1"
            @update:model-value="() => handleStatus(row)"
          />
        </template>
        <template #system="{ row }">
          <ReTag v-if="row.sysRoleInSystem === 1" type="warning" effect="plain" size="small">内置</ReTag>
          <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
        </template>
        <template #action="{ row }">
          <ReButton layout="square" type="primary" :icon="MenuIcon" @click="openPermDialog(row)">分配菜单</ReButton>
          <ReButton layout="square" type="primary" icon="Edit" @click="handleEdit(row)">编辑</ReButton>
          <ReButton layout="square" type="danger" icon="Delete" @click="handleDelete(row)">删除</ReButton>
        </template>
      </ReTable>
    </el-card>

    <!-- 角色编辑弹窗 -->
    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="560"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="saving"
      @ok="handleSubmit"
    >
      <el-form label-width="100px" :model="form">
        <el-form-item label="角色名称" required>
          <ReInput layout="modern" v-model="form.sysRoleName" placeholder="如：内容管理员" />
        </el-form-item>
        <el-form-item label="角色编码" required>
          <ReInput layout="modern" v-model="form.sysRoleCode" placeholder="如：content_admin" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber layout="modern" v-model="form.sysRoleSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="状态">
          <el-segmented v-model="form.sysRoleStatus" :options="roleStatusOptions" />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput layout="modern" v-model="form.sysRoleRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 分配菜单弹窗 -->
    <ReDialog
      v-model="permVisible"
      :title="`分配菜单权限 - ${currentRole?.sysRoleName ?? ''}`"
      width="560"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="permSaving"
      @ok="handleSavePerm"
    >
      <div class="perm-toolbar">
        <ReInput
          layout="modern"
          v-model="permSearchText"
          placeholder="搜索菜单标题 / 路由名 / 路径"
          clearable
          class="flex-1"
        />
        <ReButton layout="square" type="primary" @click="expandAllPermTree">展开</ReButton>
        <ReButton layout="square" type="info" @click="collapsePermTree">收起</ReButton>
      </div>
      <el-scrollbar max-height="360px">
        <el-tree
          ref="menuTreeRef"
          :data="filteredMenuTree"
          :props="{ label: 'sysMenuTitle', children: 'children' }"
          node-key="sysMenuId"
          show-checkbox
          :default-checked-keys="checkedMenuIds"
          :default-expanded-keys="permTreeExpanded"
          :expand-on-click-node="false"
          class="perm-tree"
        >
          <template #default="{ data }">
            <div class="flex items-center gap-2">
              <ReIcon v-if="data.sysMenuIcon" :name="data.sysMenuIcon" :size="14" class="text-[--el-color-primary]" />
              <span>{{ data.sysMenuTitle }}</span>
              <span v-if="data.sysMenuType === 3" class="text-xs text-[--el-text-color-placeholder]">(按钮)</span>
            </div>
          </template>
        </el-tree>
      </el-scrollbar>
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

.perm-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.perm-tree {
  :deep(.el-tree-node__content) {
    height: 32px;
  }
}
</style>
