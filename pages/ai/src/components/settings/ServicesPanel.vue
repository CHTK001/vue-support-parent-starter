<template>
  <div class="panel-container">
    <div class="panel-header">
      <div>
        <span class="panel-title">聚合 ChatClient 服务</span>
        <span class="panel-subtitle">启动/停止聚合服务，按 AppKey 过滤可用模型</span>
      </div>
      <div class="header-actions">
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
      </div>
    </div>

    <!-- 服务状态 -->
    <div class="status-bar" :class="serviceRunning ? 'is-running' : 'is-stopped'">
      <span class="status-dot"></span>
      <span class="status-text">{{ serviceRunning ? '服务运行中' : '服务已停止' }}</span>
      <span v-if="serviceRunning" class="status-uptime">已运行 {{ uptime }}</span>
    </div>

    <!-- AppKey 选择 -->
    <div class="appkey-selector">
      <span class="selector-label">当前 AppKey：</span>
      <el-select
        v-model="selectedKeyId"
        placeholder="选择 AppKey"
        style="width: 260px"
        @change="onKeyChange"
      >
        <el-option
          v-for="k in allKeys"
          :key="k.id"
          :label="`${k.name} (${k.provider})`"
          :value="k.id"
        />
      </el-select>
    </div>

    <div v-loading="loading" class="panel-body">
      <div v-if="!selectedKeyId && selectedKeyId !== 0" class="empty-tip">
        <el-empty description="请先选择 AppKey" />
      </div>
      <template v-else>
        <div class="filter-summary">
          <span class="summary-dot"></span>
          <span>
            当前 AppKey 可用模型：<strong>{{ filteredModels.length }}</strong> 个
          </span>
        </div>
        <el-table :data="filteredModels" stripe class="service-table">
          <el-table-column prop="name" label="模型名称" min-width="160">
            <template #default="{ row }">
              <span class="model-tag">{{ row }}</span>
            </template>
          </el-table-column>
          <el-table-column label="来源" min-width="120">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">{{ providerOf(row) }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 聚合 ChatClient 服务面板
 * 调用 /v2/ai/services、/v2/ai/app-keys、/v2/ai/groups 接口。
 * 服务启停需要 admin 角色。
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { servicesApi, appKeysApi, groupsApi, providersApi, type AppKey, type Group, type Provider } from '../../api';

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

/** 当前 AppKey 关联的分组 */
const currentGroup = computed(() => {
  const key = allKeys.value.find(k => k.id === selectedKeyId.value);
  if (!key) return null;
  // 通过 AppKey 的 model 字段查找匹配的分组
  return key.model ? groups.value.find(g => g.models.includes(key.model!)) || null : null;
});

/** 根据 AppKey 所属分组过滤可用模型 */
const filteredModels = computed(() => {
  const group = currentGroup.value;
  if (!group) return [];
  return group.models;
});

/** 推断模型来自哪个 provider */
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
    } catch (e: any) {
      ElMessage.error('启动失败');
    }
  } else {
    try {
      await servicesApi.stop('chat-client');
      serviceRunning.value = false;
      if (uptimeInterval) clearInterval(uptimeInterval);
      ElMessage.info('聚合服务已停止');
    } catch (e: any) {
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
    // 任意服务运行中则标识为运行
    serviceRunning.value = status.some(s => s.running);
    if (!selectedKeyId.value && allKeys.value.length) {
      selectedKeyId.value = allKeys.value[0].id;
    }
  } catch (e: any) {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
};

const onKeyChange = (val: string) => {
  const k = allKeys.value.find(x => x.id === val);
  if (k) ElMessage.info(`已切换到 ${k.name}`);
};

onMounted(refresh);
onUnmounted(() => {
  if (uptimeInterval) clearInterval(uptimeInterval);
});
</script>

<style scoped>
.panel-container { padding: 4px 0; }
.panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.header-actions { display: flex; gap: 8px; }
.panel-title { display: block; font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); letter-spacing: 0.2px; }
.panel-subtitle { display: block; font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }

.status-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; border-radius: 8px;
  margin-bottom: 14px; font-size: 13px;
}
.status-bar.is-running { background: var(--el-color-success-light-9); color: var(--el-color-success); }
.status-bar.is-stopped { background: var(--el-color-info-light-9); color: var(--el-text-color-secondary); }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.status-uptime { font-family: monospace; font-size: 12px; opacity: 0.7; }

.appkey-selector {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; background: var(--el-fill-color-light);
  border-radius: 8px; margin-bottom: 16px;
}
.selector-label { font-size: 13px; color: var(--el-text-color-secondary); white-space: nowrap; }

.panel-body { min-height: 180px; }
.filter-summary {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px; background: var(--el-fill-color-light);
  border-radius: 8px; margin-bottom: 12px;
  font-size: 13px; color: var(--el-text-color-secondary);
}
.filter-summary strong { color: var(--el-text-color-primary); font-weight: 600; margin: 0 2px; }
.summary-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--el-color-primary); }
.service-table { width: 100%; border-radius: 8px; overflow: hidden; }
.model-tag { font-family: monospace; font-size: 12px; color: var(--el-text-color-primary); }
.empty-tip { padding: 40px 0; }
</style>