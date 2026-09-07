<template>
  <div class="overview fade-in" v-loading="loading">
    <div class="stats-grid">
      <div class="stat-card primary">
        <span class="stat-value">{{ data.total }}</span>
        <span class="stat-label">资产总数</span>
      </div>
      <div class="stat-card success">
        <span class="stat-value">{{ data.enabled }}</span>
        <span class="stat-label">运行中</span>
      </div>
      <div class="stat-card danger">
        <span class="stat-value">{{ data.disabled }}</span>
        <span class="stat-label">已停用</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ data.serverCount }}</span>
        <span class="stat-label">服务器</span>
      </div>
      <div class="stat-card warning">
        <span class="stat-value">{{ data.redisCount }}</span>
        <span class="stat-label">Redis</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ data.dbCount }}</span>
        <span class="stat-label">数据库</span>
      </div>
    </div>

    <div class="export-btns" style="margin-bottom: 16px;">
      <ReButton show-text icon="Download" type="primary" @click="downloadAllMetrics" style="margin-right: 8px;">导出全部</ReButton>
      <ReButton show-text icon="Download" @click="downloadMetrics" style="margin-right: 8px;">导出选中</ReButton>
    </div>

    <ReRow :gutter="16">
      <ReCol :span="12">
        <ReCard class="shadow-sm rounded-xl p-4">
          <div class="card-title">服务类型分布</div>
          <div class="dist-chart">
            <div class="dist-item">
              <span class="dist-label">服务器</span>
              <ReProgress :progress="serverPct / 100" color="primary" :height="16" />
            </div>
            <div class="dist-item">
              <span class="dist-label">Redis</span>
              <ReProgress :progress="redisPct / 100" color="warning" :height="16" />
            </div>
            <div class="dist-item">
              <span class="dist-label">数据库</span>
              <ReProgress :progress="dbPct / 100" color="success" :height="16" />
            </div>
          </div>
        </ReCard>
      </ReCol>
      <ReCol :span="12">
        <ReCard class="shadow-sm rounded-xl p-4">
          <div class="card-title">运行状态概览</div>
          <div class="status-chart">
            <div class="dist-item">
              <span class="dist-label">运行中</span>
              <ReProgress :progress="enabledPct / 100" color="success" :height="16" />
            </div>
            <div class="dist-item">
              <span class="dist-label">已停用</span>
              <ReProgress :progress="disabledPct / 100" color="danger" :height="16" />
            </div>
          </div>
        </ReCard>
      </ReCol>
    </ReRow>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineExpose } from 'vue'
import { message } from '@repo/core'
import { getOverview, exportMetricHistory, exportAllMetricHistory } from '../../api'

const data = ref({ total: 0, enabled: 0, disabled: 0, serverCount: 0, redisCount: 0, dbCount: 0 })
const loading = ref(false)
const exportLoading = ref(false)
const exportProgress = ref(0)

const serverPct = computed(() => data.value.total > 0 ? Math.round(data.value.serverCount / data.value.total * 100) : 0)
const redisPct = computed(() => data.value.total > 0 ? Math.round(data.value.redisCount / data.value.total * 100) : 0)
const dbPct = computed(() => data.value.total > 0 ? Math.round(data.value.dbCount / data.value.total * 100) : 0)
const enabledPct = computed(() => data.value.total > 0 ? Math.round(data.value.enabled / data.value.total * 100) : 0)
const disabledPct = computed(() => data.value.total > 0 ? Math.round(data.value.disabled / data.value.total * 100) : 0)

onMounted(async () => {
  loading.value = true
  try {
    data.value = await getOverview() || data.value
  } catch (e) { message.error((e as Error).message) }
  finally { loading.value = false }
})

const downloadAllMetrics = async () => {
  exportLoading.value = true
  exportProgress.value = 0
  try {
    const blob = await exportAllMetricHistory()
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'monitor_metrics_all.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    console.error('导出失败', e)
  } finally {
    exportLoading.value = false
  }
}

const downloadMetrics = async () => {
  exportLoading.value = true
  try {
    // 导出最近24小时的所有指标
    const blob = await exportMetricHistory(undefined, undefined, 24)
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'monitor_metrics.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    console.error('导出失败', e)
  } finally {
    exportLoading.value = false
  }
}
</script>

 <style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  border-radius: var(--border-radius);
  background: var(--bg-container-card);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
  transition: var(--transition-base);
  flex: 1;
}
.stat-card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}
.stat-card.primary { border-left: 3px solid var(--metric-cpu); }
.stat-card.success { border-left: 3px solid var(--status-success); }
.stat-card.danger { border-left: 3px solid var(--status-error); }
.stat-card.warning { border-left: 3px solid var(--metric-disk); }
.stat-value {
  font-size: 30px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}
.stat-label { font-size: 12px; color: var(--text-tertiary); margin-top: 4px; }

.card-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.dist-chart, .status-chart {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dist-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dist-label {
  width: 56px;
  font-size: 13px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.dist-item :deep(.el-progress) { flex: 1; }
</style>