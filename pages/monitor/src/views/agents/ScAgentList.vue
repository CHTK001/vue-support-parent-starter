<template>
  <div class="agent-list fade-in">
    <div class="stats-row">
      <ReStatCard size="compact" title="Agent 总数" :value="agents.length" icon-color="var(--metric-cpu)">
        <template #value><ReCountup :value="agents.length" :duration="800" /></template>
      </ReStatCard>
      <ReStatCard size="compact" title="在线" :value="onlineCount" icon-color="var(--status-success)">
        <template #value><ReCountup :value="onlineCount" :duration="800" /></template>
      </ReStatCard>
      <ReStatCard size="compact" title="离线" :value="agents.length - onlineCount" icon-color="var(--status-error)">
        <template #value><ReCountup :value="agents.length - onlineCount" :duration="800" /></template>
      </ReStatCard>
    </div>

    <!-- 加载失败：显式错误态 + 重试，不与「暂无数据」空态混淆 -->
    <div v-if="loadError" class="agent-load-error">
      <span>Agent 列表加载失败，可能是网络或服务暂时不可用。</span>
      <ReButton text type="primary" @click="load">重试</ReButton>
    </div>

    <ReTable :data="agents" border :loading="loading" :config="{ pagination: { enable: false }, toolbar: { enable: false } }" table-id="agent-list">
      <ReTableColumn prop="monitorName" label="名称" min-width="140" />
      <ReTableColumn prop="monitorHost" label="地址" min-width="140" />
      <ReTableColumn prop="monitorAgentKey" label="探针标识" min-width="200" show-overflow-tooltip />
      <ReTableColumn label="在线状态" width="100">
        <template #default="{ row }">
          <ReTag :type="row.online ? 'success' : 'danger'" >
            {{ row.online ? '在线' : '离线' }}
          </ReTag>
        </template>
      </ReTableColumn>
      <ReTableColumn label="最后心跳" width="160">
        <template #default="{ row }">{{ row.lastHeartbeat || '-' }}</template>
      </ReTableColumn>
      <ReTableColumn label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <ReButton text type="primary" @click="viewConfig(row)">配置</ReButton>
        </template>
      </ReTableColumn>
    </ReTable>

    <ReDialog append-to-body v-model="configVisible" title="Agent 配置" width="500" :height="420" :footer-hidden="true" compact>
      <ReSkeleton v-if="configLoading" :loading="true" :rows="4" :count="1" animated />
      <div v-else>
        <ReDescriptions :column="1" border >
          <ReDescriptionsItem label="采集间隔">
            {{ configData.collectIntervalMs ?? '-' }}ms
          </ReDescriptionsItem>
        </ReDescriptions>
        <h4 style="margin-top: 12px">采集任务</h4>
        <ReTable :data="configData.tasks || []" :config="{ pagination: { enable: false }, toolbar: { enable: false } }" table-id="agent-config-tasks">
          <ReTableColumn prop="taskName" label="任务名" />
          <ReTableColumn prop="taskType" label="类型" width="90" />
          <ReTableColumn prop="taskCron" label="Cron" width="120" />
        </ReTable>
      </div>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from '@repo/core'
import { getAgentList, getAgentConfig } from '../../api'

interface AgentRow {
  monitorId: number
  monitorName: string
  monitorHost: string
  monitorAgentKey: string
  online: boolean
  lastHeartbeat: string
}

const loading = ref(false)
const agents = ref<AgentRow[]>([])
// 列表加载失败标记：失败时给出错误态与重试入口，不与「暂无数据」空态混淆
const loadError = ref(false)
const onlineCount = computed(() => agents.value.filter(a => a.online).length)

const configVisible = ref(false)
const configLoading = ref(false)
const configData = ref<any>({})

async function load() {
  loading.value = true
  try {
    agents.value = await getAgentList() || []
    loadError.value = false
  } catch (e) {
    loadError.value = true
    message.error('加载 Agent 列表失败：' + ((e as Error)?.message || '未知错误'))
  } finally { loading.value = false }
}

async function viewConfig(row: AgentRow) {
  configVisible.value = true
  configLoading.value = true
  try {
    configData.value = await getAgentConfig(row.monitorId) || {}
  } catch (e) {
    configData.value = {}
    message.error('加载 Agent 配置失败：' + ((e as Error)?.message || '未知错误'))
  } finally { configLoading.value = false }
}

onMounted(load)
</script>

 <style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}
/* 统计卡视觉与悬停由 ReStatCard 的 re-surface 基线提供，此处不再覆写 */

/* 入场动画需要 opacity 过渡，保留（只针对动画本身，不覆盖卡片阴影/位移） */
.stats-row :deep(.re-stat-card) {
  transition-property: transform, box-shadow, opacity;
  transition-duration: 200ms;
  transition-timing-function: ease;
}

.agent-load-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px 12px;
  border: 1px solid var(--status-error, #f56c6c);
  border-radius: var(--radius-sm, 4px);
  background: color-mix(in srgb, var(--status-error, #f56c6c) 8%, transparent);
  color: var(--status-error, #f56c6c);
  font-size: 13px;
}

.agent-list :deep(:focus-visible) {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm, 4px);
}

@media (max-width: 640px) {
  .stats-row { grid-template-columns: 1fr 1fr; gap: 8px; }
}
</style>