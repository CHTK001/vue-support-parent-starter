<template>
  <PanelPage title="聚合 ChatClient 服务" subtitle="启动/停止聚合服务，按 AppKey 过滤可用模型" :loading="loading">
    <template #actions>
      <el-button
        v-role="'admin'"
        :type="serviceRunning ? 'danger' : 'success'"
        size="small"
        plain
        @click="toggleService"
      >
        {{ serviceRunning ? '停止服务' : '启动服务' }}
      </el-button>
      <el-button type="primary" size="small" plain @click="refresh">刷新</el-button>
    </template>

    <!-- 服务状态 -->
    <div :class="['status-bar', serviceRunning ? 'status-bar--running' : 'status-bar--stopped']">
      <span class="status-bar__dot" />
      <span>{{ serviceRunning ? '服务运行中' : '服务已停止' }}</span>
      <span v-if="serviceRunning" class="status-bar__uptime">已运行 {{ uptime }}</span>
    </div>

    <!-- AppKey 选择 -->
    <div class="key-selector">
      <span class="key-selector__label">当前 AppKey：</span>
      <el-select v-model="selectedKeyId" placeholder="选择 AppKey" style="width: 260px" @change="onKeyChange">
        <el-option v-for="k in allKeys" :key="k.id" :label="`${k.name} (${k.provider})`" :value="k.id" />
      </el-select>
    </div>

    <div v-if="!selectedKeyId && selectedKeyId !== 0" class="empty-wrap">
      <el-empty description="请先选择 AppKey" />
    </div>
    <template v-else>
      <div class="filter-summary">
        <span class="filter-summary__dot" />
        <span>当前 AppKey 可用模型：<strong>{{ filteredModels.length }}</strong> 个</span>
      </div>
      <el-table :data="filteredModels" stripe>
        <el-table-column prop="name" label="模型名称" min-width="160">
          <template #default="{ row }">
            <span class="mono-text">{{ row }}</span>
          </template>
        </el-table-column>
        <el-table-column label="来源" min-width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ providerOf(row) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </template>
  </PanelPage>
</template>

<script setup lang="ts">
/**
 * 聚合 ChatClient 服务面板
 * 调用 /v2/ai/services、/v2/ai/app-keys、/v2/ai/groups 接口。
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { servicesApi, appKeysApi, groupsApi, providersApi, type AppKey, type Group, type Provider } from '../../api';
import PanelPage from '../PanelPage.vue';

defineProps<{ id?: string }>();

const loading = ref(false);
const serviceRunning = ref(false);
const uptime = ref('00:00:00');
let uptimeInterval: ReturnType<typeof setInterval> | null = null;
let startTime = 0;

const allKeys = ref<AppKey[]>([]);
const groups = ref<Group[]>([]);
const providers = ref<Provider[]>([]);
const selectedKeyId = ref<number>(0);

const currentGroup = computed(() => {
  const key = allKeys.value.find((k) => k.id === selectedKeyId.value);
  if (!key) return null;
  return key.model ? groups.value.find((g) => g.models.includes(key.model!)) || null : null;
});

const filteredModels = computed(() => currentGroup.value?.models ?? []);

const providerOf = (modelName: string): string => {
  for (const p of providers.value) {
    if ((p.models || []).includes(modelName)) return p.name;
  }
  return '-';
};

const toggleService = async () => {
  if (!serviceRunning.value) {
    try {
      await servicesApi.start('chat-client');
      serviceRunning.value = true;
      startTime = Date.now();
      updateUptime();
      uptimeInterval = setInterval(updateUptime, 1000);
      ElMessage.success('聚合服务已启动');
    } catch {
      ElMessage.error('启动失败');
    }
  } else {
    try {
      await servicesApi.stop('chat-client');
      serviceRunning.value = false;
      if (uptimeInterval) clearInterval(uptimeInterval);
      ElMessage.info('聚合服务已停止');
    } catch {
      ElMessage.error('停止失败');
    }
  }
};

const updateUptime = () => {
  const diff = Math.floor((Date.now() - startTime) / 1000);
  const h = String(Math.floor(diff / 3600)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
  const s = String(diff % 60).padStart(2, '0');
  uptime.value = `${h}:${m}:${s}`;
};

const refresh = async () => {
  loading.value = true;
  try {
    const [status, keys, gs, ps] = await Promise.all([
      servicesApi.list(),
      appKeysApi.list(),
      groupsApi.list(),
      providersApi.list(),
    ]);
    providers.value = ps;
    groups.value = gs;
    allKeys.value = keys;
    serviceRunning.value = status.some((s) => s.running);
    if (!selectedKeyId.value && allKeys.value.length) {
      selectedKeyId.value = allKeys.value[0].id;
    }
  } catch {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
};

const onKeyChange = (val: string | number) => {
  const k = allKeys.value.find((x) => x.id === Number(val));
  if (k) ElMessage.info(`已切换到 ${k.name}`);
};

onMounted(refresh);
onUnmounted(() => {
  if (uptimeInterval) clearInterval(uptimeInterval);
});
</script>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: var(--ai-radius-sm);
  margin-bottom: 14px;
  font-size: 13px;
  border: 1px solid;
}
.status-bar--running { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
.status-bar--stopped { background: #fafafa; color: var(--ai-text-muted); border-color: var(--ai-card-border); }
.status-bar__dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.status-bar__uptime { font-family: monospace; font-size: 12px; opacity: 0.7; }

.key-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fafafa;
  border: 1px solid var(--ai-card-border);
  border-radius: var(--ai-radius-sm);
  margin-bottom: 16px;
}
.key-selector__label { font-size: 13px; color: var(--ai-text-muted); white-space: nowrap; }

.filter-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #fafafa;
  border: 1px solid var(--ai-card-border);
  border-radius: var(--ai-radius-sm);
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--ai-text-muted);
}
.filter-summary strong { color: var(--ai-text-primary); font-weight: 600; margin: 0 2px; }
.filter-summary__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--el-color-primary); }

.mono-text { font-family: monospace; font-size: 12px; color: var(--ai-text-primary); }
.empty-wrap { padding: 40px 0; }
</style>
