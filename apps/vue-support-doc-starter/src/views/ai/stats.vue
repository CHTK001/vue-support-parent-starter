<template>
  <div class="page-card">
    <div class="page-header">
      <h2>{{ t("ai.usageStats") || "Usage Statistics" }}</h2>
      <div class="page-header-actions">
        <el-button size="small" @click="refresh">{{ t("common.refresh") }}</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="summary-cards">
      <el-col :span="6"><div class="summary-card"><div class="summary-label">Total Requests</div><div class="summary-value">{{ summary.totalRequests }}</div></div></el-col>
      <el-col :span="6"><div class="summary-card"><div class="summary-label">Total Tokens</div><div class="summary-value">{{ formatNumber(summary.totalTokens) }}</div></div></el-col>
      <el-col :span="6"><div class="summary-card"><div class="summary-label">Total Cost</div><div class="summary-value">${{ summary.totalCost.toFixed(4) }}</div></div></el-col>
      <el-col :span="6"><div class="summary-card"><div class="summary-label">Avg Tokens/Request</div><div class="summary-value">{{ summary.totalRequests ? Math.round(summary.totalTokens / summary.totalRequests) : 0 }}</div></div></el-col>
    </el-row>

    <el-table :data="stats" style="width: 100%" max-height="calc(100vh - 320px)" empty-text="No usage data yet">
      <el-table-column prop="timestamp" label="Time" width="160">
        <template #default="{ row }">{{ formatTime(row.timestamp) }}</template>
      </el-table-column>
      <el-table-column prop="provider" label="Provider" width="100" />
      <el-table-column prop="model" label="Model" min-width="120" />
      <el-table-column prop="promptTokens" label="Prompt" width="80" align="right" />
      <el-table-column prop="completionTokens" label="Completion" width="80" align="right" />
      <el-table-column prop="totalTokens" label="Total" width="80" align="right" />
      <el-table-column prop="cost" label="Cost" width="80" align="right">
        <template #default="{ row }">${{ row.cost.toFixed(6) }}</template>
      </el-table-column>
      <el-table-column prop="durationMs" label="Duration" width="80" align="right">
        <template #default="{ row }">{{ row.durationMs }}ms</template>
      </el-table-column>
      <el-table-column width="60" align="center">
        <template #default="{ row }">
          <el-button size="small" text type="danger" @click="handleDelete(row.id)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import { listUsageStats, getUsageSummary, deleteUsageStat, type UsageStat, type UsageSummary } from "@/services";

const { t } = useI18n();
const stats = ref<UsageStat[]>([]);
const summary = ref<UsageSummary>({ totalRequests: 0, totalTokens: 0, totalCost: 0, totalPromptTokens: 0, totalCompletionTokens: 0 });

function formatNumber(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}

function formatTime(ts: string): string {
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}

async function refresh() {
  try {
    stats.value = await listUsageStats(200, 0);
    summary.value = await getUsageSummary();
  } catch (e) { console.error(e); }
}

async function handleDelete(id: string) {
  await deleteUsageStat(id);
  ElMessage.success("Deleted");
  await refresh();
}

onMounted(refresh);
</script>

<style scoped>
.summary-cards { margin-bottom: 16px; }
.summary-card { background: var(--el-fill-color-lighter); border-radius: 8px; padding: 16px; }
.summary-label { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 4px; }
.summary-value { font-size: 22px; font-weight: 700; color: var(--el-text-color-primary); }
</style>
