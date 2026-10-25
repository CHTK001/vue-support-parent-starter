<script setup lang="ts">
/**
 * 成就段位管理页面
 *
 * 使用 ReTable + ReSearch 组件化架构，管理员 CRUD 段位定义。
 * @author CH
 * @since 4.0.0
 */
import { message } from "@repo/core";
import { onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { Edit, Delete } from "@element-plus/icons-vue";
import ReCard from "@repo/ui/re-card";
import ReTable from "@repo/ui/re-table";
import ReButton from "@repo/ui/re-button";
import ReEmpty from "@repo/ui/re-empty";
import ReSectionHead from "@repo/ui/re-section-head";
import ReTag from "@repo/ui/re-tag";
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
  message.success("Deleted");
  tableRef.value?.reload();
}

onMounted(loadTypes);
</script>

<!--
  现代化视图：ReSectionHead 页头 + 紧凑筛选卡 + ReTable 卡片外壳 + ReEmpty 空态。

  ReTable 的列定义（含 badge / type / status / action 四个 slot）、:loader 懒加载协议、
  v-model 的 query 筛选与 ReAchievementTierDialog 的 props / events 全部原样保留，
  只重排外壳与样式；新建 / 刷新按钮移入页头操作区，筛选下拉独立成卡。

  刻意保留表格而不用卡片网格：段位是 10 列宽表（描述 / 规则列最长），一行一条才能横向对齐比较；
  且本页走服务端分页加载（:loader），客户端没有整表行数据，故不安排「总览数字条」以免造假数字。
-->
<template>
  <div class="achievement-page">
    <ReSectionHead
      class="achievement-head"
      title="成就段位管理"
      description="定义成就段位、规则与徽章，管理员可维护段位定义"
    >
      <template #actions>
        <ReButton
          v-admin
          show-text
          icon="Plus"
          type="primary"
          size="small"
          tip="新建段位"
          @click="handleAdd"
        >Add Tier</ReButton>
        <ReButton show-text icon="Refresh" size="small" tip="刷新列表" @click="tableRef?.reload()">Refresh</ReButton>
      </template>
    </ReSectionHead>

    <!-- 筛选卡：类型下拉 + 类型总数提示 -->
    <div class="filter-card">
      <el-select
        v-model="query.type"
        placeholder="Filter by type"
        clearable
        class="filter-field"
        @change="tableRef?.reload()"
      >
        <el-option v-for="t in types" :key="t" :label="t" :value="t" />
      </el-select>
      <span class="filter-hint">共 {{ types.length }} 种类型</span>
    </div>

    <!-- 表格：保留 ReTable 全部插槽与懒加载协议，仅换成 koi 卡片外壳 -->
    <div class="table-card">
      <ReTable
        ref="tableRef"
        table-id="achievement-tiers"
        :loader="loadTiers"
        :columns="columns"
        :pagination="true"
        :params="query"
        row-key="id"
        :loading="loading"
        stripe
      >
        <template #badge="{ row }">
          <span class="tier-badge">{{ row.badge || '🏅' }}</span>
        </template>
        <template #type="{ row }">
          <ReTag class="tier-type" type="info" effect="plain">{{ row.type }}</ReTag>
        </template>
        <template #status="{ row }">
          <ReTag :type="row.status === 1 ? 'success' : 'info'" effect="plain">
            {{ row.status === 1 ? "Active" : "Inactive" }}
          </ReTag>
        </template>
        <template #action="{ row }">
          <ReButton v-admin show-text icon="Edit" layout="square" @click="handleEdit(row)">Edit</ReButton>
          <ReButton v-admin show-text icon="Delete" type="danger" layout="square" @click="handleDelete(row)">Delete</ReButton>
        </template>
        <!-- 空态走 ReEmpty：表格内的 el-empty 换成扁平空态，提示语仍由 empty-text 语义（无数据时）驱动 -->
        <template #empty="{ description }">
          <ReEmpty v-if="!loading" layout="modern" :description="description">
            <ReButton
              show-text
              icon="Plus"
              type="primary"
              size="small"
              @click="handleAdd"
            >新建第一个段位</ReButton>
          </ReEmpty>
        </template>
      </ReTable>
    </div>

    <ReAchievementTierDialog
      :visible="dialogVisible"
      :is-edit="isEdit"
      :form="form"
      @update:visible="dialogVisible = $event"
      @saved="tableRef?.reload()"
    />
  </div>
</template>

<style scoped lang="scss">
.achievement-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ===== 筛选卡 ===== */
.filter-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.filter-field {
  width: 200px;
}
.filter-hint {
  margin-left: auto;
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary);
}

/* ===== 表格壳 ===== */
.table-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 12px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.table-card > :deep(.re-table) {
  flex: 1 1 auto;
  min-height: 0;
}

/* 表格内的扁平空态不需要 el-table 默认的居中大留白 */
.table-card :deep(.rm-empty) {
  box-sizing: border-box;
  width: 100%;
  padding: 8px 0;
}

/* ===== 单元格 ===== */
.tier-badge {
  font-size: 18px;
  line-height: 1;
}
.tier-type {
  color: var(--brand-600);
  font-weight: 500;
}

/* ===== 响应式：移动端筛选占满 ===== */
@media (max-width: 768px) {
  .filter-field {
    width: 100%;
  }
  .filter-hint {
    margin-left: 0;
  }
}

/* ===== 减少动态效果 ===== */
@media (prefers-reduced-motion: reduce) {
  .filter-card,
  .table-card {
    transition: none;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
</style>