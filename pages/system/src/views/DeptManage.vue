<script setup lang="ts">
/**
 * 部门管理页面
 *
 * 树形展示组织机构，支持新增/编辑/删除（含选择父级）。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { OfficeBuilding, Plus, Edit, Delete, Search, Refresh } from "@element-plus/icons-vue";
import { listDept, saveDept, updateDept, deleteDept } from "../api/systemApi";
import type { SysDept } from "../api/types";
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

const filterText = ref("");

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
  displayList.value = filterTree(list.value, filterText.value.trim());
}

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

const columns: ReTableColumn[] = [
  { prop: "sysDeptName", label: "部门名称", minWidth: 220, slot: "deptName" },
  { prop: "sysDeptCode", label: "部门编码", minWidth: 140 },
  { prop: "sysDeptPrincipal", label: "负责人", minWidth: 120 },
  { prop: "sysDeptContact", label: "联系方式", minWidth: 140 },
  { prop: "sysDeptSort", label: "排序", width: 80, align: "center" },
  { prop: "sysDeptStatus", label: "状态", width: 100, slot: "status", align: "center" },
  { prop: "sysDeptRemark", label: "备注", minWidth: 160, showOverflowTooltip: true },
  { prop: "action", label: "操作", width: 240, slot: "action", fixed: "right" },
];

onMounted(loadList);
</script>

<template>
  <div class="system-page">
    <div class="system-page__header">
      <div>
        <h2 class="system-page__title">部门管理</h2>
        <p class="system-page__subtitle">维护组织机构树，支持多级嵌套</p>
      </div>
      <ReButton layout="modern" type="primary" v-admin icon="Plus" @click="handleAdd()">新增顶级部门</ReButton>
    </div>

    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true">
        <div class="system-page__search">
          <ReInput
            layout="modern"
            v-model="filterText"
            placeholder="按部门名称过滤"
            clearable
            class="!w-56"
            :prefix-icon="Search"
            @input="applyFilter"
          />
          <div class="flex-1" />
          <ReButton layout="modern" icon="Refresh" @click="loadList">刷新</ReButton>
        </div>
      </ReSearch>

      <ReTable
        :data="displayList"
        :columns="columns"
        :pagination="false"
        :loading="loading"
        row-key="sysDeptId"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
      >
        <template #deptName="{ row }">
          <div class="flex items-center gap-2">
            <el-icon :size="16" color="var(--el-color-primary)"><OfficeBuilding /></el-icon>
            <span>{{ row.sysDeptName }}</span>
          </div>
        </template>
        <template #status="{ row }">
          <ReTag :type="row.sysDeptStatus === 0 ? 'success' : 'danger'" effect="plain" size="small">
            {{ row.sysDeptStatus === 0 ? "启用" : "禁用" }}
          </ReTag>
        </template>
        <template #action="{ row }">
          <ReButton layout="modern" link type="primary" icon="Plus" v-admin @click="handleAdd(row)">新增下级</ReButton>
          <ReButton layout="modern" link type="primary" icon="Edit" v-admin @click="handleEdit(row)">编辑</ReButton>
          <ReButton layout="modern" link type="danger" icon="Delete" v-admin :loading="deleteLoading === row.sysDeptId" @click="handleDelete(row)">删除</ReButton>
        </template>
      </ReTable>
    </el-card>

    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑部门' : '新增部门'"
      width="600"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
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
          <ReInput layout="modern" v-model="form.sysDeptName" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门编码">
          <ReInput layout="modern" v-model="form.sysDeptCode" placeholder="请输入部门编码" />
        </el-form-item>
        <el-form-item label="负责人">
          <ReInput layout="modern" v-model="form.sysDeptPrincipal" placeholder="请输入负责人姓名" />
        </el-form-item>
        <el-form-item label="联系方式">
          <ReInput layout="modern" v-model="form.sysDeptContact" placeholder="请输入联系方式" />
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
          <ReInput layout="modern" v-model="form.sysDeptRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
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
</style>
