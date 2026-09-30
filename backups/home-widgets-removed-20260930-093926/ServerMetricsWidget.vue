<template>
  <div class="smw">
    <div class="smw__header">
      <div class="smw__title">
        <el-icon><DataLine /></el-icon>
        <span>{{ widget.title }}</span>
      </div>
      <div class="smw__header-right">
        <el-select v-model="selectedServerId" placeholder="选择服务器" @change="fetchData">
          <el-option
            v-for="s in serverList"
            :key="s.id"
            :label="s.name || `#${s.id}`"
            :value="s.id"
          />
        </el-select>
        <button class="smw__refresh" :disabled="loading" @click="fetchData">
          <el-icon :size="14" :class="{ 'is-spinning': loading }"><Refresh /></el-icon>
        </button>
      </div>
    </div>

    <div v-if="!selectedServerId && !loading" class="smw__empty">
      <el-icon :size="32" color="#999"><DataLine /></el-icon>
      <p>请选择一个服务器</p>
    </div>

    <div v-else-if="loading" class="smw__loading">
      <el-icon :size="24" class="is-spinning"><Refresh /></el-icon>
      <p>加载中...</p>
    </div>

    <div v-else class="smw__grid">
      <div class="smw__ring-card">
        <div class="smw__ring-card-title">CPU</div>
        <div class="smw__ring-wrap">
          <el-progress
            type="dashboard"
            :percentage="Math.round(cpuPercent)"
            :stroke-width="10"
            :width="110"
            :color="cpuColor"
          />
          <div class="smw__ring-label">{{ Math.round(cpuPercent) }}%</div>
        </div>
        <div class="smw__ring-detail" v-if="cpuData">
          <div class="smw__ring-row">
            <span>核数</span>
            <span>{{ cpuData.cores || '-' }}</span>
          </div>
          <div class="smw__ring-row">
            <span>负载</span>
            <span>{{ cpuData.loadAverage || '-' }}</span>
          </div>
        </div>
      </div>

      <div class="smw__ring-card">
        <div class="smw__ring-card-title">内存</div>
        <div class="smw__ring-wrap">
          <el-progress
            type="dashboard"
            :percentage="Math.round(memPercent)"
            :stroke-width="10"
            :width="110"
            :color="memColor"
          />
          <div class="smw__ring-label">{{ Math.round(memPercent) }}%</div>
        </div>
        <div class="smw__ring-detail" v-if="memData">
          <div class="smw__ring-row">
            <span>已用</span>
            <span>{{ formatBytes(memData.used) }}</span>
          </div>
          <div class="smw__ring-row">
            <span>总量</span>
            <span>{{ formatBytes(memData.total) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { DataLine, Refresh } from "@element-plus/icons-vue";
import type { WidgetItem } from "../types";
import { getApiHttp } from "@repo/core";

const props = defineProps<{ widget: WidgetItem }>();

interface Server {
  id: number;
  name?: string;
  [key: string]: unknown;
}

interface CpuMetric {
  usage?: number;
  percent?: number;
  cores?: number;
  loadAverage?: number;
  [key: string]: unknown;
}

interface MemMetric {
  used?: number;
  total?: number;
  percent?: number;
  usage?: number;
  [key: string]: unknown;
}

const serverList = ref<Server[]>([]);
const selectedServerId = ref<number | undefined>(undefined);
const cpuData = ref<CpuMetric | null>(null);
const memData = ref<MemMetric | null>(null);
const loading = ref(false);
let scheduler: ReturnType<typeof setInterval> | null = null;

const cpuPercent = computed(() => cpuData.value?.percent ?? cpuData.value?.usage ?? 0);
const memPercent = computed(() => {
  if (memData.value?.percent !== undefined) return memData.value.percent;
  if (memData.value?.usage !== undefined && memData.value?.total) {
    return (memData.value.usage / memData.value.total) * 100;
  }
  return 0;
});

const cpuColor = computed(() => {
  const p = cpuPercent.value;
  if (p < 50) return '#22c55e';
  if (p < 80) return '#f59e0b';
  return '#ef4444';
});

const memColor = computed(() => {
  const p = memPercent.value;
  if (p < 50) return '#3b82f6';
  if (p < 80) return '#f59e0b';
  return '#ef4444';
});

function formatBytes(val?: number): string {
  if (val === undefined || val === null) return '-';
  if (val < 1024) return val + ' B';
  if (val < 1024 * 1024) return (val / 1024).toFixed(1) + ' KB';
  if (val < 1024 * 1024 * 1024) return (val / 1024 / 1024).toFixed(1) + ' MB';
  return (val / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}

async function loadServerList() {
  try {
    const res = await getApiHttp()
      .get("/ms/monitor")
      .then<{ code?: string; data?: Server[] }>((r) => r.data);
    if (Array.isArray(res?.data)) {
      serverList.value = res.data;
      if (!selectedServerId.value && res.data.length) {
        selectedServerId.value = res.data[0].id;
      }
    }
  } catch {
    // 静默
  }
}

async function fetchData() {
  const id = selectedServerId.value;
  if (!id || loading.value) return;
  loading.value = true;
  try {
    const [cpuRes, memRes] = await Promise.all([
      getApiHttp().get(`/ms/monitor/metric/cpu/${id}`).then<{ code?: string; data?: CpuMetric }>((r) => r.data),
      getApiHttp().get(`/ms/monitor/metric/memory/${id}`).then<{ code?: string; data?: MemMetric }>((r) => r.data),
    ]);
    if (cpuRes?.data) cpuData.value = cpuRes.data;
    if (memRes?.data) memData.value = memRes.data;
  } catch {
    // 静默
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadServerList();
  if (selectedServerId.value) await fetchData();
  scheduler = setInterval(() => { if (selectedServerId.value) fetchData(); }, 30000);
});

onBeforeUnmount(() => {
  if (scheduler) clearInterval(scheduler);
});
</script>

<style scoped>
.smw {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 4px;
}

.smw__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px 12px 0;
}

.smw__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.smw__header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.smw__refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.smw__refresh:hover:not(:disabled) {
  background: var(--el-fill-color);
  color: var(--el-color-primary);
}

.smw__refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.is-spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.smw__empty, .smw__loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--el-text-color-disabled);
  font-size: 13px;
}

.smw__grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 0 8px;
}

.smw__ring-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 12px;
  background: var(--el-fill-color-lighter);
  transition: all 0.2s;
}

.smw__ring-card:hover {
  background: var(--el-fill-color-light);
}

.smw__ring-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.smw__ring-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.smw__ring-label {
  position: absolute;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.smw__ring-detail {
  width: 100%;
  margin-top: 8px;
  padding: 0 4px;
}

.smw__ring-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  padding: 2px 0;
  color: var(--el-text-color-secondary);
}

.smw__ring-row span:last-child {
  font-weight: 500;
  color: var(--el-text-color-primary);
}
</style>