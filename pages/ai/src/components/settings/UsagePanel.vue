<template>
  <div class="panel-container">
    <div class="panel-header">
      <div>
        <span class="panel-title">用量统计</span>
        <span class="panel-subtitle">按模型、AppKey 维度查询调用量与费用</span>
      </div>
      <div class="header-actions">
        <el-button type="primary" size="small" plain @click="refresh">刷新</el-button>
        <el-switch v-model="autoRefresh" active-text="自动" inactive-text="手动" @change="toggleAutoRefresh" />
      </div>
    </div>

    <!-- 筛选 -->
    <div class="filters">
      <el-select v-model="filterModel" placeholder="按模型筛选" style="width: 160px" clearable @change="applyFilter">
        <el-option v-for="m in allModels" :key="m" :label="m" :value="m" />
      </el-select>
      <el-select v-model="filterKey" placeholder="按 AppKey 筛选" style="width: 160px" clearable @change="applyFilter">
        <el-option v-for="k in allKeys" :key="k.id" :label="k.name" :value="k.id" />
      </el-select>
      <span class="filter-hint">最后更新：{{ lastUpdate }}</span>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card shadow-sm">
        <div class="stat-label">总调用次数</div>
        <div class="stat-value">{{ totalCalls }}</div>
      </el-card>
      <el-card class="stat-card shadow-sm">
        <div class="stat-label">总 Token 用量</div>
        <div class="stat-value">{{ totalTokens }}</div>
      </el-card>
      <el-card class="stat-card shadow-sm">
        <div class="stat-label">提示 Tokens</div>
        <div class="stat-value">{{ totalPromptTokens }}</div>
      </el-card>
      <el-card class="stat-card shadow-sm">
        <div class="stat-label">生成 Tokens</div>
        <div class="stat-value">{{ totalCompletionTokens }}</div>
      </el-card>
    </div>

    <div v-loading="loading" class="panel-body">
      <el-table :data="filteredStats" stripe class="usage-table">
        <el-table-column prop="model" label="模型" min-width="160">
          <template #default="{ row }"><span class="model-name">{{ row.model }}</span></template>
        </el-table-column>
        <el-table-column label="调用次数" min-width="100" align="center">
          <template #default="{ row }"><span class="mono">{{ row.requests }}</span></template>
        </el-table-column>
        <el-table-column label="总 Tokens" min-width="120" align="center">
          <template #default="{ row }"><span class="mono">{{ row.totalTokens }}</span></template>
        </el-table-column>
        <el-table-column label="提示 Tokens" min-width="120" align="center">
          <template #default="{ row }"><span class="mono">{{ row.promptTokens }}</span></template>
        </el-table-column>
        <el-table-column label="生成 Tokens" min-width="120" align="center">
          <template #default="{ row }"><span class="mono">{{ row.completionTokens }}</span></template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 用量统计面板
 * 调用 /v2/ai/usage 与 /v2/ai/app-keys 接口。
 * 数据由后端定时汇总，前端按需拉取。
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { usageApi, appKeysApi, type Usage, type AppKey } from '../../api';

defineProps<{ id?: string }>();

const loading = ref(false);
const autoRefresh = ref(true);
const lastUpdate = ref('--');
let refreshInterval: ReturnType<typeof setInterval> | null = null;

const allKeys = ref<AppKey[]>([]);
const allStats = ref<Usage[]>([]);
const filterModel = ref('');
const filterKey = ref<number>(0);

const allModels = computed(() => [...new Set(allStats.value.map(s => s.model))]);

const filteredStats = computed(() => {
  let data = allStats.value;
  if (filterModel.value) data = data.filter(s => s.model === filterModel.value);
  return data;
});

const totalCalls = computed(() => filteredStats.value.reduce((sum, s) => sum + s.requests, 0));
const totalTokens = computed(() => filteredStats.value.reduce((sum, s) => sum + s.totalTokens, 0));
const totalPromptTokens = computed(() => filteredStats.value.reduce((sum, s) => sum + s.promptTokens, 0));
const totalCompletionTokens = computed(() => filteredStats.value.reduce((sum, s) => sum + s.completionTokens, 0));

const refresh = async () => {
  loading.value = true;
  try {
    const [stats, keys] = await Promise.all([usageApi.get(), appKeysApi.list()]);
    allStats.value = Array.isArray(stats) ? stats : [];
    allKeys.value = keys;
    lastUpdate.value = new Date().toLocaleTimeString('zh-CN');
  } catch (e: any) {
    ElMessage.error('加载用量失败');
  } finally {
    loading.value = false;
  }
};

const applyFilter = () => { /* 由 computed 自动响应 */ };

const toggleAutoRefresh = () => {
  if (autoRefresh.value) {
    refreshInterval = setInterval(refresh, 30000);
  } else {
    if (refreshInterval) { clearInterval(refreshInterval); refreshInterval = null; }
  }
};

onMounted(async () => {
  await refresh();
  if (autoRefresh.value) {
    refreshInterval = setInterval(refresh, 30000);
  }
});
onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<style scoped>
.panel-container { padding: 4px 0; }
.panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.panel-title { display: block; font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); letter-spacing: 0.2px; }
.panel-subtitle { display: block; font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }

.filters {
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
  padding: 10px 14px; background: var(--el-fill-color-light); border-radius: 8px;
}
.filter-hint { font-size: 12px; color: var(--el-text-color-secondary); margin-left: auto; }

.stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px;
}
.stat-card { border-radius: 10px; padding: 16px 18px; }
.stat-card :deep(.el-card__body) { padding: 0; }
.stat-label { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 4px; }
.stat-value { font-size: 22px; font-weight: 600; color: var(--el-text-color-primary); letter-spacing: -0.5px; }

.panel-body { min-height: 200px; }
.usage-table { width: 100%; border-radius: 8px; overflow: hidden; }
.model-name { font-family: monospace; font-size: 13px; color: var(--el-text-color-primary); }
.mono { font-family: monospace; font-size: 12px; color: var(--el-text-color-primary); }

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .filters { flex-wrap: wrap; }
}
</style>