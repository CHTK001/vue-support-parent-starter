<script setup lang="ts">
/**
 * 部门管理页面
 *
 * 树形展示组织机构，支持新增/编辑/删除（含选择父级）。
 * 数据源：/v2/dept/list（已返回树形），/v2/dept/save|update|delete。
 */
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { OfficeBuilding, Plus, Edit, Delete, Search, Refresh } from "@element-plus/icons-vue";
import { listDept, saveDept, updateDept, deleteDept } from "../api/systemApi";
import type { SysDept } from "../api/types";

const list = ref<SysDept[]>([]);
const loading = ref(false);
const deleteLoading = ref<number>(0);
const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive<SysDept>({});
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
  Object.keys(form).forEach((k) => delete (form as Record<string, unknown>)[k]);
  Object.assign(form, {
    sysDeptPid: parent?.sysDeptId ?? 0,
    sysDeptStatus: 0,
    sysDeptSort: 0,
    sysDeptDataPermission: 1,
  });
  dialogVisible.value = true;
}

function handleEdit(row: SysDept) {
  isEdit.value = true;
  Object.assign(form, { ...row });
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.sysDeptName) {
    ElMessage.warning("请输入部门名称");
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateDept(form);
      ElMessage.success("修改成功");
    } else {
      await saveDept(form);
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

async function handleDelete(row: SysDept) {
  if (row.children?.length) {
    ElMessage.warning("存在子部门，请先删除子部门");
    return;
  }
  if (deleteLoading.value) return;
  try {
    await ElMessageBox.confirm(`确认删除部门「${row.sysDeptName}」？`, "提示", {
      type: "warning",
      confirmButtonText: "确定删除",
    });
  } catch {
    return;
  }
  deleteLoading.value = row.sysDeptId;
  try {
    await deleteDept(row.sysDeptId!);
    ElMessage.success("删除成功");
    loadList();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "删除失败");
  } finally {
    deleteLoading.value = 0;
  }
}

onMounted(loadList);
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-[--el-text-color-primary]">
          部门管理
        </h2>
        <p class="mt-1 text-sm text-[--el-text-color-secondary]">
          维护组织机构树，支持多级嵌套
        </p>
      </div>
      <el-button type="primary" v-admin :icon="Plus" @click="handleAdd()">新增顶级部门</el-button>
    </div>

    <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <el-input
          v-model="filterText"
          placeholder="按部门名称过滤"
          clearable
          class="!w-56"
          :prefix-icon="Search"
          @input="applyFilter"
        />
        <div class="flex-1" />
        <el-button :icon="Refresh" @click="loadList">刷新</el-button>
      </div>
      <el-table
        v-loading="loading"
        :data="displayList"
        row-key="sysDeptId"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
        stripe
        class="w-full"
      >
        <el-table-column prop="sysDeptName" label="部门名称" min-width="220">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-icon :size="16" color="var(--el-color-primary)"><OfficeBuilding /></el-icon>
              <span>{{ row.sysDeptName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sysDeptCode" label="部门编码" min-width="140" />
        <el-table-column prop="sysDeptPrincipal" label="负责人" min-width="120" />
        <el-table-column prop="sysDeptContact" label="联系方式" min-width="140" />
        <el-table-column prop="sysDeptSort" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.sysDeptStatus === 0 ? 'success' : 'danger'"
              size="small"
              effect="plain"
            >
              {{ row.sysDeptStatus === 0 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sysDeptRemark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-admin link type="primary" :icon="Plus" @click="handleAdd(row)">新增下级</el-button>
            <el-button v-admin link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button v-admin link type="danger" :icon="Delete" :loading="deleteLoading === row.sysDeptId" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑部门' : '新增部门'"
      width="560"
      :close-on-click-modal="false"
      destroy-on-close
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
          <el-input v-model="form.sysDeptName" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门编码">
          <el-input v-model="form.sysDeptCode" placeholder="请输入部门编码" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="form.sysDeptPrincipal" placeholder="请输入负责人姓名" />
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="form.sysDeptContact" placeholder="请输入联系方式" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sysDeptSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.sysDeptStatus">
            <el-radio :value="0">启用</el-radio>
            <el-radio :value="1">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数据权限">
          <el-select v-model="form.sysDeptDataPermission" placeholder="数据权限类型" class="w-full">
            <el-option :value="1" label="本部门" />
            <el-option :value="2" label="本部门及下级" />
            <el-option :value="3" label="全部" />
            <el-option :value="4" label="自定义" />
            <el-option :value="5" label="仅本人" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.sysDeptRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
