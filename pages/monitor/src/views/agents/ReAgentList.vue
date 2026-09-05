<template>
  <div class="agent-list fade-in">
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-value">{{ agents.length }}</span>
        <span class="stat-label">Agent 总数</span>
      </div>
      <div class="stat-card success">
        <span class="stat-value">{{ onlineCount }}</span>
        <span class="stat-label">在线</span>
      </div>
      <div class="stat-card danger">
        <span class="stat-value">{{ agents.length - onlineCount }}</span>
        <span class="stat-label">离线</span>
      </div>
    </div>

    <ReTable :data="agents" border size="small" :loading="loading" :pagination="false" :toolbar="false">
      <ReTableColumn prop="monitorName" label="名称" min-width="140" />
      <ReTableColumn prop="monitorHost" label="地址" min-width="140" />
      <ReTableColumn prop="monitorAgentKey" label="探针标识" min-width="200" show-overflow-tooltip />
      <ReTableColumn label="在线状态" width="100">
        <template #default="{ row }">
          <ReTag :type="row.online ? 'success' : 'danger'" size="small">
            {{ row.online ? '在线' : '离线' }}
          </ReTag>
        </template>
      </ReTableColumn>
      <ReTableColumn label="最后心跳" width="160">
        <template #default="{ row }">{{ row.lastHeartbeat || '-' }}</template>
      </ReTableColumn>
      <ReTableColumn label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <ReButton link size="small" type="primary" @click="viewConfig(row)">配置</ReButton>
        </template>
      </ReTableColumn>
    </ReTable>

    <ReDialog append-to-body v-model="configVisible" title="Agent 配置" width="500" :height="420" :footer-hidden="true">
      <div v-if="configLoading">加载中...</div>
      <div v-else>
        <h4>采集间隔</h4>
        <ReDescriptions :column="1" border size="small">
          <ReDescriptionsItem v-for="(v, k) in configData.intervals || {}" :key="k" :label="k">
            {{ v }}ms
          </ReDescriptionsItem>
        </ReDescriptions>
        <h4 style="margin-top: 12px">采集任务</h4>
        <ReTable :data="configData.tasks || []" size="small" :pagination="false" :toolbar="false">
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
const onlineCount = computed(() => agents.value.filter(a => a.online).length)

const configVisible = ref(false)
const configLoading = ref(false)
const configData = ref<any>({})

async function load() {
  loading.value = true
  try {
    agents.value = await getAgentList() || []
  } catch {}
  finally { loading.value = false }
}

async function viewConfig(row: AgentRow) {
  configVisible.value = true
  configLoading.value = true
  try {
    configData.value = await getAgentConfig(row.monitorId) || {}
  } catch {}
  finally { configLoading.value = false }
}

onMounted(load)
</script>

<style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
.stats-row { display: flex; gap: 12px; margin-bottom: 12px; }
.stat-card {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 12px; border-radius: 8px;
  background: var(--el-fill-color-light); border: 1px solid var(--el-border-color-light);
}
.stat-card.success { border-left: 3px solid var(--el-color-success); }
.stat-card.danger { border-left: 3px solid var(--el-color-danger); }
.stat-value { font-size: 24px; font-weight: 700; color: var(--el-text-color-primary); }
.stat-label { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 2px; }
</style>