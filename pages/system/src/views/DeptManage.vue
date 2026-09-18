<script setup lang="ts">
/**
 * 部门管理页面
 *
 * 树形展示组织机构，支持新增/编辑/删除（含选择父级）。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { computed, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { OfficeBuilding, Plus, Edit, Delete, Search, Refresh } from "@element-plus/icons-vue";
import { listDept, saveDept, updateDept, deleteDept, pageForUser } from "../api/systemApi";
import type { SysDept, SysUser } from "../api/types";
import type { ReTableColumn } from "@repo/ui/re-table";

const deptStatusOptions = [
  { label: "启用", value: 0 },
  { label: "禁用", value: 1 },
] as const;

const list = ref<SysDept[]>([]);
const loading = ref(false);
const deleteLoading = ref<number>(0);
const dialogVisible = ref(false);
const saving = ref(false);
const form = ref<SysDept>({});
const isEdit = ref(false);

const query = ref<{ filterText?: string }>({});

const searchFilters = computed(() => [
  { key: 'filterText', label: '部门名称', type: 'input' as const, placeholder: '按部门名称过滤' },
]);

/** 递归过滤部门树（按名称） */
function filterTree(data: SysDept[], keyword: string): SysDept[] {
  if (!keyword) return data;
  const result: SysDept[] = [];
  for (const item of data) {
    if (item.sysDeptName?.includes(keyword)) {
      result.push({ ...item });
    } else if (item.children?.length) {
      const sub = filterTree(item.children, keyword);
      if (sub.length > 0) {
        result.push({ ...item, children: sub });
      }
    }
  }
  return result;
}

const displayList = ref<SysDept[]>([]);

function applyFilter() {
  displayList.value = filterTree(list.value, (query.value.filterText ?? "").trim());
}

function handleReset() {
  query.value = {};
  applyFilter();
}

/** 表格使用静态 :data 渲染，内置搜索条件变化时重新应用过滤 */
watch(query, () => applyFilter(), { deep: true });

async function loadList() {
  loading.value = true;
  try {
    const res = await listDept();
    list.value = (res?.data ?? []) as SysDept[];
    applyFilter();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "部门列表加载失败");
  } finally {
    loading.value = false;
  }
}

function handleAdd(parent?: SysDept) {
  isEdit.value = false;
  form.value = {
    sysDeptPid: parent?.sysDeptId ?? 0,
    sysDeptStatus: 0,
    sysDeptSort: 0,
    sysDeptDataPermission: 1,
  };
  dialogVisible.value = true;
}

function handleEdit(row: Record<string, unknown>) {
  isEdit.value = true;
  form.value = { ...(row as unknown as SysDept) };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.sysDeptName) {
    ElMessage.warning("请输入部门名称");
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateDept(form.value);
      ElMessage.success("修改成功");
    } else {
      await saveDept(form.value);
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

async function handleDelete(row: Record<string, unknown>) {
  const dept = row as unknown as SysDept;
  if (dept.children?.length) {
    ElMessage.warning("存在子部门，请先删除子部门");
    return;
  }
  if (deleteLoading.value) return;
  try {
    await ElMessageBox.confirm(`确认删除部门「${dept.sysDeptName}」？`, "提示", {
      type: "warning",
      confirmButtonText: "确定删除",
    });
  } catch {
    return;
  }
  deleteLoading.value = dept.sysDeptId!;
  try {
    await deleteDept(dept.sysDeptId!);
    ElMessage.success("删除成功");
    loadList();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "删除失败");
  } finally {
    deleteLoading.value = 0;
  }
}

/* ================== 负责人远程用户选择 ================== */
const principalOptions = ref<{ label: string; value: string }[]>([]);
const principalLoading = ref(false);
const principalSelected = ref("");

/** 远程搜索用户（按账号/昵称），结果作为负责人下拉选项 */
async function searchPrincipal(queryStr: string) {
  if (!queryStr) {
    principalOptions.value = [];
    return;
  }
  principalLoading.value = true;
  try {
    const res = await pageForUser({ page: 1, pageSize: 20, sysUserName: queryStr });
    const rows = (res?.data?.data ?? []) as SysUser[];
    principalOptions.value = rows.map((u) => ({
      label: `${u.sysUserNickname ?? u.sysUserUsername}（${u.sysUserUsername}）`,
      value: u.sysUserUsername ?? "",
    }));
  } catch (e) {
    console.warn("[dept] 负责人搜索失败", e);
    principalOptions.value = [];
  } finally {
    principalLoading.value = false;
  }
}

/* ================== 部门用户列表抽屉 ================== */
const usersDrawerVisible = ref(false);
const deptUsersLoading = ref(false);
const deptUsers = ref<SysUser[]>([]);
const currentDeptName = ref("");

async function openDeptUsers(row: Record<string, unknown>) {
  const dept = row as unknown as SysDept;
  currentDeptName.value = dept.sysDeptName ?? "";
  usersDrawerVisible.value = true;
  deptUsersLoading.value = true;
  try {
    const res = await pageForUser({ page: 1, pageSize: 200, sysDeptId: dept.sysDeptId });
    deptUsers.value = (res?.data?.data ?? []) as SysUser[];
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "部门用户加载失败");
    deptUsers.value = [];
  } finally {
    deptUsersLoading.value = false;
  }
}

const columns: ReTableColumn[] = [
  { prop: "sysDeptName", label: "部门名称", minWidth: 220, slot: "deptName" },
  { prop: "sysDeptCode", label: "部门编码", minWidth: 140 },
  { prop: "sysDeptPrincipal", label: "负责人", minWidth: 120 },
  { prop: "sysDeptContact", label: "联系方式", minWidth: 140 },
  { prop: "sysDeptSort", label: "排序", width: 80, align: "center" },
  { prop: "sysDeptStatus", label: "状态", width: 100, slot: "status", align: "center" },
  { prop: "sysDeptRemark", label: "备注", minWidth: 160, showOverflowTooltip: true },
  { prop: "action", label: "操作", width: 300, slot: "action", fixed: "right" },
];

onMounted(loadList);
</script>

<template>
  <div class="system-page">
      <ReTable
        :data="displayList"
        :columns="columns"
        :pagination="false"
        :loading="loading"
        row-key="sysDeptId"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
        :search="{ filters: searchFilters, title: '搜索', btnMode: 'text' }"
        :search-gap="16"
        v-model:search-model="query"
        @search-reset="handleReset"
      >
        <template #toolbar>
          <ReButton layout="modern" type="primary" icon="Plus" v-admin @click="handleAdd()">新增顶级部门</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="loadList">刷新</ReButton>
        </template>
        <template #deptName="{ row }">
          <div class="flex items-center gap-2">
            <el-icon :size="16" color="var(--el-color-primary)"><OfficeBuilding /></el-icon>
            <span>{{ row.sysDeptName }}</span>
            <ReTag v-if="row.memberCount != null" size="small" effect="plain" type="info">{{ row.memberCount }}人</ReTag>
          </div>
        </template>
        <template #status="{ row }">
          <ReTag :type="row.sysDeptStatus === 0 ? 'success' : 'danger'" effect="plain" size="small">
            {{ row.sysDeptStatus === 0 ? "启用" : "禁用" }}
          </ReTag>
        </template>
        <template #action="{ row }">
          <ReButton layout="square" type="primary" icon="Plus" v-admin @click="handleAdd(row)">新增下级</ReButton>
          <ReButton layout="square" type="primary" icon="Edit" v-admin @click="handleEdit(row)">编辑</ReButton>
          <ReButton layout="square" type="info" v-admin @click="openDeptUsers(row)">用户列表</ReButton>
          <ReButton layout="square" type="danger" icon="Delete" v-admin :loading="deleteLoading === row.sysDeptId" @click="handleDelete(row)">删除</ReButton>
        </template>
      </ReTable>

    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑部门' : '新增部门'"
      width="600"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="saving"
      @ok="handleSubmit"
    >
      <el-form label-width="100px" :model="form">
        <el-form-item label="上级部门">
          <el-tree-select
            v-model="form.sysDeptPid"
            :data="list"
            :props="{ value: 'sysDeptId', label: 'sysDeptName', children: 'children' }"
            check-strictly
            clearable
            placeholder="不选则为顶级"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="部门名称" required>
          <ReInput layout="modern" v-model="form.sysDeptName" placeholder="请输入部门名称" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="部门编码">
          <ReInput layout="modern" v-model="form.sysDeptCode" placeholder="请输入部门编码" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="负责人">
          <el-select
            v-model="form.sysDeptPrincipal"
            filterable
            remote
            clearable
            reserve-keyword
            placeholder="输入账号/昵称搜索用户"
            :remote-method="searchPrincipal"
            :loading="principalLoading"
            class="w-full"
          >
            <el-option
              v-for="opt in principalOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="联系方式">
          <ReInput layout="modern" v-model="form.sysDeptContact" placeholder="请输入联系方式" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber layout="modern" v-model="form.sysDeptSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="状态">
          <el-segmented v-model="form.sysDeptStatus" :options="deptStatusOptions" />
        </el-form-item>
        <el-form-item label="数据权限">
          <ReSelect
            v-model="form.sysDeptDataPermission"
            placeholder="数据权限类型"
            class="w-full"
            :data="[
              { label: '本部门', value: 1 },
              { label: '本部门及下级', value: 2 },
              { label: '全部', value: 3 },
              { label: '自定义', value: 4 },
              { label: '仅本人', value: 5 },
            ]"
          />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput layout="modern" v-model="form.sysDeptRemark" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 部门用户列表抽屉 -->
    <ReDrawer
      v-model="usersDrawerVisible"
      :title="`部门用户 - ${currentDeptName}`"
      size="520"
      :show-window-shell="false"
      :close-on-click-modal="true"
      :footer-hidden="true"
    >
      <template #content>
        <el-table v-loading="deptUsersLoading" :data="deptUsers" border stripe size="small" style="width: 100%">
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
        <p class="mt-3 text-sm text-[--el-text-color-secondary]">共 {{ deptUsers.length }} 个用户</p>
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
</style>
