<template>
  <PanelPage title="用量统计" subtitle="按模型、AppKey 维度查询调用量与费用" :loading="loading">
    <template #actions>
      <el-button type="primary" size="small" plain @click="refresh">刷新</el-button>
      <el-switch v-model="autoRefresh" active-text="自动" inactive-text="手动" @change="toggleAutoRefresh" />
    </template>

    <!-- 筛选 -->
    <div class="filters-bar">
      <el-select v-model="filterModel" placeholder="按模型筛选" style="width: 160px" clearable @change="applyFilter">
        <el-option v-for="m in allModels" :key="m" :label="m" :value="m" />
      </el-select>
      <el-select v-model="filterKey" placeholder="按 AppKey 筛选" style="width: 160px" clearable @change="applyFilter">
        <el-option v-for="k in allKeys" :key="k.id" :label="k.name" :value="k.id" />
      </el-select>
      <span class="filters-bar__hint">最后更新：{{ lastUpdate }}</span>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card__label">总调用次数</div>
        <div class="stat-card__value">{{ totalCalls }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">总 Token 用量</div>
        <div class="stat-card__value">{{ totalTokens }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">提示 Tokens</div>
        <div class="stat-card__value">{{ totalPromptTokens }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">生成 Tokens</div>
        <div class="stat-card__value">{{ totalCompletionTokens }}</div>
      </div>
    </div>

    <el-table :data="filteredStats" stripe>
      <el-table-column prop="model" label="模型" min-width="160">
        <template #default="{ row }"><span class="mono-text">{{ row.model }}</span></template>
      </el-table-column>
      <el-table-column label="调用次数" min-width="100" align="center">
        <template #default="{ row }"><span class="mono-text">{{ row.requests }}</span></template>
      </el-table-column>
      <el-table-column label="总 Tokens" min-width="120" align="center">
        <template #default="{ row }"><span class="mono-text">{{ row.totalTokens }}</span></template>
      </el-table-column>
      <el-table-column label="提示 Tokens" min-width="120" align="center">
        <template #default="{ row }"><span class="mono-text">{{ row.promptTokens }}</span></template>
      </el-table-column>
      <el-table-column label="生成 Tokens" min-width="120" align="center">
        <template #default="{ row }"><span class="mono-text">{{ row.completionTokens }}</span></template>
      </el-table-column>
    </el-table>
  </PanelPage>
</template>

<script setup lang="ts">
/**
 * 用量统计面板
 * 调用 /v2/ai/usage 与 /v2/ai/app-keys 接口。
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { usageApi, appKeysApi, type Usage, type AppKey } from '../../api';
import PanelPage from '../PanelPage.vue';

defineProps<{ id?: string }>();

const loading = ref(false);
const autoRefresh = ref(true);
const lastUpdate = ref('--');
let refreshInterval: ReturnType<typeof setInterval> | null = null;

const allKeys = ref<AppKey[]>([]);
const allStats = ref<Usage[]>([]);
const filterModel = ref('');
const filterKey = ref<number>(0);

const allModels = computed(() => [...new Set(allStats.value.map((s) => s.model))]);

const filteredStats = computed(() => {
  let data = allStats.value;
  if (filterModel.value) data = data.filter((s) => s.model === filterModel.value);
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
  } catch {
    ElMessage.error('加载用量失败');
  } finally {
    loading.value = false;
  }
};

const applyFilter = () => { /* computed auto-responds */ };

const toggleAutoRefresh = () => {
  if (autoRefresh.value) {
    refreshInterval = setInterval(refresh, 30000);
  } else {
    if (refreshInterval) { clearInterval(refreshInterval); refreshInterval = null; }
  }
};

onMounted(async () => {
  await refresh();
  if (autoRefresh.value) refreshInterval = setInterval(refresh, 30000);
});
onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<style scoped>
.filters-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 10px 14px;
  background: #fafafa;
  border-radius: var(--ai-radius-sm);
  border: 1px solid var(--ai-card-border);
}
.filters-bar__hint { font-size: 12px; color: var(--ai-text-muted); margin-left: auto; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card {
  padding: 16px 18px;
  border: 1px solid var(--ai-card-border);
  border-radius: var(--ai-radius-md);
  background: var(--ai-card-bg);
}
.stat-card__label { font-size: 12px; color: var(--ai-text-muted); margin-bottom: 4px; }
.stat-card__value { font-size: 22px; font-weight: 600; color: var(--ai-text-primary); letter-spacing: -0.5px; }

.mono-text { font-family: monospace; font-size: 12px; color: var(--ai-text-primary); }

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .filters-bar { flex-wrap: wrap; }
}
</style>
