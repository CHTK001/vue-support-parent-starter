<template>
  <div class="page-card">
    <div class="page-header">
      <h2>{{ t("menu.aiUsage") }}</h2>
      <div class="page-header-actions">
        <el-date-picker v-model="dateRange" type="daterange" range-separator="~" :start-placeholder="t('common.startDate')" :end-placeholder="t('common.endDate')" size="small" style="width: 240px" @change="refreshData" />
        <el-button size="small" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon> {{ t('common.refresh') }}
        </el-button>
      </div>
    </div>

    <!-- Summary Cards -->
    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="summary-item">
            <div class="summary-label">{{ t('usage.totalRequests') }}</div>
            <div class="summary-value">{{ totalRequests }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="summary-item">
            <div class="summary-label">{{ t('usage.totalTokens') }}</div>
            <div class="summary-value">{{ totalTokens }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="summary-item">
            <div class="summary-label">{{ t('usage.totalCost') }}</div>
            <div class="summary-value cost">${{ totalCost }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="summary-item">
            <div class="summary-label">{{ t('usage.activeUsers') }}</div>
            <div class="summary-value">{{ activeUsers }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Usage Table -->
    <el-table :data="usageRecords" style="width: 100%" max-height="calc(100vh - 380px)" v-loading="loading">
      <el-table-column :label="t('usage.time')" width="160">
        <template #default="{ row }">
          <span class="usage-time">{{ formatTime(row.timestamp) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('usage.model')" min-width="150">
        <template #default="{ row }">
          <div class="usage-model">
            <img :src="getProviderLogo(row.providerId)" class="usage-logo" @error="($event.target as HTMLImageElement).style.display='none'" />
            <div>
              <div class="model-name">{{ row.model }}</div>
              <div class="provider-name">{{ row.providerName }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('usage.promptTokens')" width="100" align="right">
        <template #default="{ row }">{{ row.promptTokens }}</template>
      </el-table-column>
      <el-table-column :label="t('usage.completionTokens')" width="110" align="right">
        <template #default="{ row }">{{ row.completionTokens }}</template>
      </el-table-column>
      <el-table-column :label="t('usage.totalTokens')" width="100" align="right">
        <template #default="{ row }">
          <span class="token-total">{{ row.totalTokens }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('usage.cost')" width="90" align="right">
        <template #default="{ row }">${{ row.cost.toFixed(4) }}</template>
      </el-table-column>
      <el-table-column :label="t('usage.source')" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="getSourceType(row.source)">{{ row.source }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { Refresh } from "@element-plus/icons-vue";
import { MCP_CLIENTS } from "@/utils/mcp-config";
import { useProviderStore } from "@/stores/provider";
import { listUsageRecords } from "@/services";

const { t } = useI18n();
const providerStore = useProviderStore();

const loading = ref(false);
const dateRange = ref<[Date, Date]>([new Date(), new Date()]);

interface UsageRecord {
  id: string;
  timestamp: string;
  model: string;
  providerId: string;
  providerName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  source: string;
}

const usageRecords = ref<UsageRecord[]>([]);

const totalRequests = computed(() => usageRecords.value.length);
const totalTokens = computed(() => usageRecords.value.reduce((s, r) => s + r.totalTokens, 0));
const totalCost = computed(() => usageRecords.value.reduce((s, r) => s + r.cost, 0).toFixed(2));
const activeUsers = computed(() => new Set(usageRecords.value.map((r) => r.source)).size);

function getProviderLogo(providerId: string): string {
  const p = providerStore.providers.find((x) => x.id === providerId);
  const clientId = p?.clientId || "opencode";
  return MCP_CLIENTS.find((c) => c.id === clientId)?.logo || MCP_CLIENTS[0].logo;
}

function getSourceType(source: string): "success" | "warning" | "info" | undefined {
  const map: Record<string, "success" | "warning" | "info" | undefined> = { ccswitch: "success", zcode: "warning", "cursor-byok": "info" };
  return map[source];
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString();
}

async function refreshData() {
  loading.value = true;
  try {
    const [start, end] = dateRange.value;
    const startDate = start.toISOString().split("T")[0] + "T00:00:00.000Z";
    const endDate = end.toISOString().split("T")[0] + "T23:59:59.999Z";
    usageRecords.value = await listUsageRecords(startDate, endDate);
  } catch (err) {
    console.error("Failed to load usage records:", err);
    usageRecords.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => refreshData());
</script>

<style scoped>
.summary-item { text-align: center; padding: 8px 0; }
.summary-label { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 8px; }
.summary-value { font-size: 28px; font-weight: 700; color: var(--el-color-primary); }
.summary-value.cost { color: var(--el-color-warning); }
.usage-time { font-size: 12px; font-family: monospace; color: var(--el-text-color-secondary); }
.usage-model { display: flex; align-items: center; gap: 8px; }
.usage-logo { width: 22px; height: 22px; object-fit: contain; }
.model-name { font-size: 13px; font-weight: 500; }
.provider-name { font-size: 11px; color: var(--el-text-color-secondary); }
.token-total { font-weight: 600; color: var(--el-color-primary); }
</style>