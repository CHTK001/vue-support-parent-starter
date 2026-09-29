<template>
  <div class="overview fade-in">
    <ReSkeleton :loading="loading" :rows="4" :count="1" animated>
      <div class="stats-grid">
        <ReStatCard size="compact" title="资产总数" :value="data.total" icon-color="var(--metric-cpu)">
          <template #icon><DataAnalysis /></template>
          <template #value><ReCountup :value="data.total" /></template>
        </ReStatCard>
        <ReStatCard size="compact" title="运行中" :value="data.enabled" icon-color="var(--status-success)">
          <template #icon><VideoPlay /></template>
          <template #value><ReCountup :value="data.enabled" /></template>
        </ReStatCard>
        <ReStatCard size="compact" title="已停用" :value="data.disabled" icon-color="var(--status-error)">
          <template #icon><VideoPause /></template>
          <template #value><ReCountup :value="data.disabled" /></template>
        </ReStatCard>
        <ReStatCard size="compact" title="服务器" :value="data.serverCount" icon-color="var(--metric-net)">
          <template #icon><Monitor /></template>
          <template #value><ReCountup :value="data.serverCount" /></template>
        </ReStatCard>
        <ReStatCard size="compact" title="Redis" :value="data.redisCount" icon-color="var(--metric-redis)">
          <template #icon><Coin /></template>
          <template #value><ReCountup :value="data.redisCount" /></template>
        </ReStatCard>
        <ReStatCard size="compact" title="数据库" :value="data.dbCount" icon-color="var(--metric-db)">
          <template #icon><Collection /></template>
          <template #value><ReCountup :value="data.dbCount" /></template>
        </ReStatCard>
      </div>
    </ReSkeleton>

    <ReSectionHead class="export-head" title="指标导出" description="按当前筛选导出采集指标历史数据">
      <template #actions>
        <ReButton show-text icon="Download" type="primary" @click="downloadAllMetrics">导出全部</ReButton>
        <ReButton show-text icon="Download" @click="downloadMetrics">导出选中</ReButton>
      </template>
    </ReSectionHead>

    <ReRow :gutter="16">
      <ReCol :xs="24" :md="12">
        <ReCard class="chart-card" layout="simple" hoverable>
          <template #header>
            <ReSectionHead title="服务类型分布" />
          </template>
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
      <ReCol :xs="24" :md="12">
        <ReCard class="chart-card" layout="simple" hoverable>
          <template #header>
            <ReSectionHead title="运行状态概览" />
          </template>
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
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
/* 统计卡视觉（圆角/无边框/双层柔光/悬停上浮）由 ReStatCard 自身的
   re-surface 基线提供（packages/ui/src/components/shared/re-surface.css），
   此处不再覆写一遍，避免与基线重复且互相打架。 */

.export-head {
  margin-bottom: 16px;
}
.export-head :deep(.re-section-head__actions) {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 圆角沿用本页令牌；悬停视觉由 ReCard 自身 hoverable / re-surface 基线提供，不再重复写 */
.chart-card {
  border-radius: var(--radius-lg, var(--border-radius));
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

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }
  .dist-item { flex-direction: column; align-items: stretch; gap: 6px; }
  .dist-label { width: auto; }
}
</style>