<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Edit, Delete, Search, Refresh, Trophy } from "@element-plus/icons-vue";
import { pageTiers, saveTier, updateTier, deleteTier, listTypes } from "../api/achievementApi";
import type { AchievementTier } from "../api/types";

const query = reactive<{ page: number; pageSize: number; type?: string }>({
  page: 1,
  pageSize: 10,
  type: undefined,
});
const list = ref<AchievementTier[]>([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = reactive<AchievementTier>({});
const types = ref<string[]>([]);

async function loadData() {
  loading.value = true;
  try {
    const res = await pageTiers(query);
    list.value = (res?.data?.data ?? res?.data?.records ?? []) as AchievementTier[];
    total.value = res?.data?.total ?? 0;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "Failed to load achievement tiers");
  } finally {
    loading.value = false;
  }
}

async function loadTypes() {
  try {
    const res = await listTypes();
    types.value = (res?.data ?? []) as string[];
  } catch {
    // non-critical
  }
}

function handleReset() {
  query.type = undefined;
  query.page = 1;
  loadData();
}

function handleAdd() {
  isEdit.value = false;
  Object.keys(form).forEach((k) => delete (form as Record<string, unknown>)[k]);
  Object.assign(form, { level: 1, sort: 0, status: 1 });
  dialogVisible.value = true;
}

function handleEdit(row: AchievementTier) {
  isEdit.value = true;
  Object.assign(form, { ...row });
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.type || !form.name) {
    ElMessage.warning("Please enter type and name");
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateTier(form);
      ElMessage.success("Updated");
    } else {
      await saveTier(form);
      ElMessage.success("Created");
    }
    dialogVisible.value = false;
    loadData();
    loadTypes();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "Save failed");
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: AchievementTier) {
  await ElMessageBox.confirm(`Delete tier "${row.name}"?`, "Confirm", { type: "warning" });
  await deleteTier(row.id!);
  ElMessage.success("Deleted");
  loadData();
}

function handlePage(p: number) {
  query.page = p;
  loadData();
}

onMounted(() => {
  loadData();
  loadTypes();
});
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-xl font-semibold tracking-tight text-[--el-text-color-primary]">
        Achievement Tier Management
      </h2>
      <p class="mt-1 text-sm text-[--el-text-color-secondary]">
        Define achievement tiers, rules, and badges for the gamification system
      </p>
    </div>

    <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <el-select v-model="query.type" placeholder="Filter by type" clearable class="!w-44" @change="loadData">
          <el-option v-for="t in types" :key="t" :label="t" :value="t" />
        </el-select>
        <div class="flex-1" />
        <el-button type="primary" :icon="Search" @click="loadData">Search</el-button>
        <el-button v-admin type="primary" :icon="Plus" @click="handleAdd">Add Tier</el-button>
        <el-button :icon="Refresh" @click="loadData">Refresh</el-button>
      </div>

      <el-table v-loading="loading" :data="list" stripe class="w-full">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="Badge" width="60">
          <template #default="{ row }">
            <el-icon :size="20" color="var(--el-color-warning)"><Trophy /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="Type" width="100" />
        <el-table-column prop="level" label="Level" width="70" />
        <el-table-column prop="name" label="Name" min-width="140" />
        <el-table-column prop="description" label="Description" min-width="200" show-overflow-tooltip />
        <el-table-column prop="rule" label="Rule" min-width="160" show-overflow-tooltip />
        <el-table-column prop="sort" label="Sort" width="70" />
        <el-table-column label="Status" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small" effect="plain">
              {{ row.status === 1 ? "Active" : "Inactive" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="160" fixed="right">
          <template #default="{ row }">
            <el-button v-admin link type="primary" :icon="Edit" @click="handleEdit(row)">Edit</el-button>
            <el-button v-admin link type="danger" :icon="Delete" @click="handleDelete(row)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          :total="total"
          :current-page="query.page"
          :page-size="query.pageSize"
          layout="total, prev, pager, next"
          @current-change="handlePage"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'Edit Tier' : 'Add Tier'"
      width="560"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="100px" :model="form">
        <el-form-item label="Type" required>
          <el-input v-model="form.type" placeholder="e.g. login, sign, message" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="Level" required>
          <el-input-number v-model="form.level" :min="1" :max="999" class="!w-full" />
        </el-form-item>
        <el-form-item label="Name" required>
          <el-input v-model="form.name" placeholder="e.g. Bronze Logger" />
        </el-form-item>
        <el-form-item label="Badge">
          <el-input v-model="form.badge" placeholder="Badge icon URL or emoji" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="Tier description" />
        </el-form-item>
        <el-form-item label="Rule">
          <el-input v-model="form.rule" placeholder="e.g. loginCount >= 7" />
        </el-form-item>
        <el-form-item label="Sort">
          <el-input-number v-model="form.sort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="Status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">Active</el-radio>
            <el-radio :value="0">Inactive</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">Confirm</el-button>
      </template>
    </el-dialog>
  </div>
</template>