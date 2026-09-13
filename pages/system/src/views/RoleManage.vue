<script setup lang="ts">
/**
 * 角色管理页面
 *
 * 角色分页查询 + 增删改查 + 分配菜单权限（drawer 树形勾选）。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { computed, defineAsyncComponent, nextTick, onMounted, ref } from "vue";
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
  listDept,
  pageForUser,
} from "../api/systemApi";
import type { SysDept, SysMenu, SysRole, SysUser } from "../api/types";
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
/** sysRoleReadonly 暂未在 types.ts 中声明，本地扩展 */
type RoleForm = SysRole & { sysRoleReadonly?: number };
const form = ref<RoleForm>({});
const isEdit = ref(false);
/** 复制来源角色 ID（用于复制菜单授权） */
const copyFromRoleId = ref<number | null>(null);

function handleAdd() {
  isEdit.value = false;
  copyFromRoleId.value = null;
  form.value = { sysRoleStatus: 1, sysRoleSort: 0, sysRoleReadonly: 0 };
  dialogVisible.value = true;
}

function handleEdit(row: Record<string, unknown>) {
  isEdit.value = true;
  copyFromRoleId.value = null;
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
      const saved = await saveRole(form.value);
      ElMessage.success("新增成功");
      // 复制场景：新角色创建后，把原角色的菜单授权一并复制过来
      if (copyFromRoleId.value != null && saved?.data?.sysRoleId) {
        const srcMenus = await getRoleMenu(copyFromRoleId.value);
        await updateRoleMenu({ roleId: saved.data.sysRoleId, menuId: (srcMenus?.data ?? []) as number[] });
      }
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
/** 当前已选菜单/按钮数量（含半选父级时以实际勾选叶子计） */
const checkedCount = ref(0);
const currentRole = ref<SysRole | null>(null);
const menuTreeRef = ref<InstanceType<typeof ElTree>>();
const permSearchText = ref("");
const permTreeExpanded = ref<string[]>([]);
const activePermTab = ref("menu");

/** 树勾选变化时刷新已选数量 */
function onMenuCheck() {
  const checked = (menuTreeRef.value?.getCheckedKeys() ?? []) as number[];
  checkedCount.value = checked.length;
}

/** 清空已选菜单（二次确认） */
async function handleClearMenu() {
  try {
    await ElMessageBox.confirm("确认清空已选的菜单与按钮？", "提示", { type: "warning" });
  } catch {
    return;
  }
  menuTreeRef.value?.setCheckedKeys([]);
  checkedCount.value = 0;
}

/* ================== 数据权限 ================== */
const dataScopeOptions = [
  { label: "全部数据", value: 1, desc: "可查看所有部门的用户数据" },
  { label: "本部门数据", value: 2, desc: "仅可查看本部门的用户数据" },
  { label: "本部门及以下", value: 3, desc: "可查看本部门及子部门的用户数据" },
  { label: "仅本人数据", value: 4, desc: "仅可查看自己创建的数据" },
  { label: "自定义部门", value: 5, desc: "可查看指定部门及其子部门的数据" },
];
const dataScope = ref(1);
const deptTree = ref<SysDept[]>([]);
const checkedDeptIds = ref<number[]>([]);
const deptTreeRef = ref<InstanceType<typeof ElTree>>();

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
  activePermTab.value = "menu";
  // 初始化数据权限
  dataScope.value = role.sysRoleDataScope ?? 1;
  checkedDeptIds.value = role.sysRoleDataScopeDeptIds
    ? role.sysRoleDataScopeDeptIds.split(",").map(Number).filter(Boolean)
    : [];
  try {
    const [menuRes, checkedRes, deptRes] = await Promise.all([
      listMenuTree(),
      getRoleMenu(role.sysRoleId!),
      listDept(),
    ]);
    menuTree.value = (menuRes?.data ?? []) as SysMenu[];
    checkedMenuIds.value = (checkedRes?.data ?? []) as number[];
    deptTree.value = (deptRes?.data ?? []) as SysDept[];
    await nextTick();
    onMenuCheck();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "权限加载失败");
  }
}

async function handleSavePerm() {
  if (!currentRole.value) return;
  permSaving.value = true;
  try {
    const checked = menuTreeRef.value?.getCheckedKeys() as number[];
    // 保存菜单权限
    await updateRoleMenu({ roleId: currentRole.value.sysRoleId, menuId: checked });
    // 保存数据权限
    const customDeptIds = dataScope.value === 5
      ? (deptTreeRef.value?.getCheckedKeys() as number[] ?? []).join(",")
      : "";
    await updateRole({
      sysRoleId: currentRole.value.sysRoleId,
      sysRoleDataScope: dataScope.value,
      sysRoleDataScopeDeptIds: customDeptIds,
    });
    ElMessage.success("权限已更新");
    permVisible.value = false;
    tableRef.value?.reload();
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

/* ================== 角色复制 ================== */
function handleCopy(row: Record<string, unknown>) {
  const role = row as unknown as SysRole;
  isEdit.value = false;
  copyFromRoleId.value = role.sysRoleId ?? null;
  // 复制原角色信息，但不带 ID，名称追加 _副本，编码清空由用户填写
  const { sysRoleId, ...rest } = role;
  form.value = {
    ...rest,
    sysRoleName: `${role.sysRoleName ?? ""}_副本`,
    sysRoleCode: "",
  };
  dialogVisible.value = true;
}

/* ================== 角色用户列表 ================== */
const usersDrawerVisible = ref(false);
const usersLoading = ref(false);
const roleUsers = ref<SysUser[]>([]);
const currentRoleName = ref("");

async function openRoleUsers(row: Record<string, unknown>) {
  const role = row as unknown as SysRole;
  currentRoleName.value = role.sysRoleName ?? "";
  usersDrawerVisible.value = true;
  usersLoading.value = true;
  try {
    const res = await pageForUser({ page: 1, pageSize: 200, sysRoleId: role.sysRoleId });
    roleUsers.value = (res?.data?.data ?? []) as SysUser[];
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "角色用户加载失败");
    roleUsers.value = [];
  } finally {
    usersLoading.value = false;
  }
}

const columns: ReTableColumn[] = [
  { prop: "sysRoleName", label: "角色名称", minWidth: 140, slot: "roleName" },
  { prop: "sysRoleCode", label: "角色编码", minWidth: 140 },
  { prop: "sysRoleSort", label: "排序", width: 80, align: "center" },
  { prop: "sysRoleStatus", label: "状态", width: 90, slot: "status", align: "center" },
  { prop: "sysRoleInSystem", label: "系统", width: 80, slot: "system", align: "center" },
  { prop: "sysRoleRemark", label: "备注", minWidth: 160, showOverflowTooltip: true },
  { prop: "createTime", label: "创建时间", width: 170 },
  { prop: "action", label: "操作", width: 340, slot: "action", fixed: "right" },
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
            <ReTag v-if="row.sysRoleInSystem === 1" type="warning" effect="plain" size="small">内置</ReTag>
            <ReTag v-if="row.sysRoleReadonly === 1" type="info" effect="plain" size="small">只读</ReTag>
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
          <ReButton layout="square" type="success" @click="handleCopy(row)">复制</ReButton>
          <ReButton layout="square" type="info" @click="openRoleUsers(row)">用户</ReButton>
          <ReButton v-if="row.sysRoleInSystem !== 1" layout="square" type="danger" icon="Delete" @click="handleDelete(row)">删除</ReButton>
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
          <ReInput layout="modern" v-model="form.sysRoleName" placeholder="如：内容管理员" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="角色编码" required>
          <ReInput layout="modern" v-model="form.sysRoleCode" placeholder="如：content_admin" :disabled="isEdit" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber layout="modern" v-model="form.sysRoleSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="状态">
          <el-segmented v-model="form.sysRoleStatus" :options="roleStatusOptions" />
        </el-form-item>
        <el-form-item label="只读角色">
          <div class="readonly-switch">
            <el-switch v-model="form.sysRoleReadonly" :active-value="1" :inactive-value="0" />
            <span v-if="form.sysRoleReadonly === 1" class="readonly-switch__tip">只读角色无法执行任何新增/修改/删除操作</span>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <ReInput layout="modern" v-model="form.sysRoleRemark" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 分配权限弹窗（菜单权限 + 数据权限） -->
    <ReDialog
      v-model="permVisible"
      :title="`分配权限 - ${currentRole?.sysRoleName ?? ''}`"
      width="600"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="permSaving"
      @ok="handleSavePerm"
    >
      <el-tabs v-model="activePermTab" class="perm-tabs">
        <!-- 菜单权限 Tab -->
        <el-tab-pane label="菜单权限" name="menu">
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
            <span class="checked-count">已选 {{ checkedCount }} 个菜单/按钮</span>
            <ReButton layout="square" type="danger" @click="handleClearMenu">清空</ReButton>
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
              @check="onMenuCheck"
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
        </el-tab-pane>

        <!-- 数据权限 Tab -->
        <el-tab-pane label="数据权限" name="data">
          <div class="data-scope-desc">
            <el-alert type="info" :closable="false" show-icon>
              数据权限控制该角色用户可查看哪些部门的用户数据，取该用户所有角色中最宽松的配置。超级管理员不受限制。
            </el-alert>
          </div>
          <el-radio-group v-model="dataScope" class="data-scope-group">
            <el-radio
              v-for="opt in dataScopeOptions"
              :key="opt.value"
              :value="opt.value"
              class="data-scope-item"
            >
              <div class="data-scope-item__label">{{ opt.label }}</div>
              <div class="data-scope-item__desc">{{ opt.desc }}</div>
            </el-radio>
          </el-radio-group>

          <!-- 自定义部门选择 -->
          <div v-if="dataScope === 5" class="custom-dept">
            <div class="custom-dept__title">选择可访问的部门（含子部门）</div>
            <el-scrollbar max-height="280px" class="custom-dept__tree">
              <el-tree
                ref="deptTreeRef"
                :data="deptTree"
                :props="{ label: 'sysDeptName', children: 'children' }"
                node-key="sysDeptId"
                show-checkbox
                :default-checked-keys="checkedDeptIds"
                :expand-on-click-node="false"
              />
            </el-scrollbar>
          </div>
        </el-tab-pane>
      </el-tabs>
    </ReDialog>

    <!-- 角色用户列表抽屉 -->
    <ReDrawer
      v-model="usersDrawerVisible"
      :title="`拥有该角色的用户 - ${currentRoleName}`"
      size="520"
      :show-window-shell="false"
      :close-on-click-modal="true"
      :footer-hidden="true"
    >
      <template #content>
        <el-table v-loading="usersLoading" :data="roleUsers" border stripe size="small" style="width: 100%">
          <el-table-column type="index" label="#" width="60" align="center" />
          <el-table-column prop="sysUserUsername" label="账号" min-width="130" show-overflow-tooltip />
          <el-table-column prop="sysUserNickname" label="昵称" min-width="120" show-overflow-tooltip />
          <el-table-column prop="sysUserPhone" label="手机号" min-width="130" />
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.sysUserStatus === 0 ? 'success' : 'danger'" size="small" effect="plain">
                {{ row.sysUserStatus === 0 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <p class="mt-3 text-sm text-[--el-text-color-secondary]">共 {{ roleUsers.length }} 个用户</p>
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

.perm-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.checked-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: auto;
}

.readonly-switch {
  display: flex;
  align-items: center;
  gap: 10px;

  &__tip {
    font-size: 12px;
    color: var(--el-color-warning);
  }
}

.perm-tree {
  :deep(.el-tree-node__content) {
    height: 32px;
  }
}

.perm-tabs {
  :deep(.el-tabs__content) {
    min-height: 400px;
  }
}

.data-scope-desc {
  margin-bottom: 16px;
}

.data-scope-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.data-scope-item {
  margin-right: 0;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition: border-color 0.2s;
  height: auto;

  &:hover {
    border-color: var(--el-color-primary-light-5);
  }

  &__label {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  &__desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 2px;
  }
}

.custom-dept {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);

  &__title {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 10px;
  }

  &__tree {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 8px;
  }
}
</style>
