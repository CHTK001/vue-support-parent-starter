<script setup lang="ts">
/**
 * 成就段位管理页面
 *
 * 使用 ReTable + ReSearch 组件化架构，管理员 CRUD 段位定义。
 * @author CH
 * @since 4.0.0
 */
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Edit, Delete } from "@element-plus/icons-vue";
import ReCard from "@repo/ui/re-card";
import ReTable from "@repo/ui/re-table";
import ReButton from "@repo/ui/re-button";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import { pageTiers, deleteTier, listTypes } from "../api/achievementApi";
import ReAchievementTierDialog from "../components/ReAchievementTierDialog.vue";
import type { AchievementTier } from "../api/types";

const types = ref<string[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive<AchievementTier>({});
const tableRef = ref();
const query = reactive<{ type?: string }>({});

const columns: ReTableColumn[] = [
  { prop: "id", label: "ID", width: 70 },
  { prop: "badge", label: "Badge", width: 70, slot: "badge" },
  { prop: "type", label: "Type", width: 100, slot: "type" },
  { prop: "level", label: "Level", width: 70 },
  { prop: "name", label: "Name", minWidth: 140 },
  { prop: "description", label: "Description", minWidth: 200 },
  { prop: "rule", label: "Rule", minWidth: 160 },
  { prop: "sort", label: "Sort", width: 70 },
  { prop: "status", label: "Status", width: 90, slot: "status" },
  { prop: "action", label: "Actions", width: 160, fixed: "right", align: "center", slot: "action" },
];

async function loadTiers({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  loading.value = true;
  try {
    const res = await pageTiers({ page, pageSize, type: params?.type as string || undefined });
    const data = res?.data;
    return { total: data?.total ?? 0, data: data?.data ?? data?.records ?? [] };
  } finally {
    loading.value = false;
  }
}

async function loadTypes() {
  try {
    const res = await listTypes();
    types.value = (res?.data ?? []) as string[];
  } catch { /* non-critical */ }
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

async function handleDelete(row: AchievementTier) {
  await ElMessageBox.confirm(`Delete tier "${row.name}"?`, "Confirm", { type: "warning" });
  await deleteTier(row.id!);
  ElMessage.success("Deleted");
  tableRef.value?.reload();
}

onMounted(loadTypes);
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-6xl">
      <div class="mb-8">
        <h1 class="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent dark:from-violet-400 dark:to-indigo-400">
          Achievement Tier Management
        </h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Define achievement tiers, rules, and badges</p>
      </div>

      <ReCard :radius="16" :padding="0" class="overflow-hidden border border-slate-200/60 bg-white/90 backdrop-blur-lg shadow-xl dark:border-slate-700/60 dark:bg-slate-800/90">
        <ReTable
          ref="tableRef"
          table-id="achievement-tiers"
          :loader="loadTiers"
          :columns="columns"
          :pagination="true"
          :params="query"
          row-key="id"
          class="p-6"
          :loading="loading"
        >
          <template #toolbar>
            <div class="mb-4 flex flex-wrap items-center gap-3">
              <el-select v-model="query.type" placeholder="Filter by type" clearable class="!w-44" @change="tableRef?.reload()">
                <el-option v-for="t in types" :key="t" :label="t" :value="t" />
              </el-select>
              <div class="flex-1" />
              <ReButton
                v-admin
                type="success"

                icon="Plus"
                @click="handleAdd"
              >
                Add Tier
              </ReButton>
              <ReButton

                icon="Refresh"
                @click="tableRef?.reload()"
              >
                Refresh
              </ReButton>
            </div>
          </template>

          <template #badge="{ row }">
            <span class="text-xl">{{ row.badge || '🏅' }}</span>
          </template>
          <template #type="{ row }">
            <el-tag class="!rounded-full !border-0 !bg-gradient-to-r from-violet-100 to-indigo-100 !text-violet-600 dark:from-violet-900/40 dark:to-indigo-900/40 dark:!text-violet-300">{{ row.type }}</el-tag>
          </template>
          <template #status="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" class="!rounded-full !border-0" effect="plain">
              {{ row.status === 1 ? "Active" : "Inactive" }}
            </el-tag>
          </template>
          <template #action="{ row }">
            <el-button v-admin link type="primary" :icon="Edit" @click="handleEdit(row)">Edit</el-button>
            <el-button v-admin link type="danger" :icon="Delete" @click="handleDelete(row)">Delete</el-button>
          </template>
        </ReTable>
      </ReCard>

      <ReAchievementTierDialog
        :visible="dialogVisible"
        :is-edit="isEdit"
        :form="form"
        @update:visible="dialogVisible = $event"
        @saved="tableRef?.reload()"
      />
    </div>
  </div>
</template>