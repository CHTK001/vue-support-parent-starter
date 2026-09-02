<template>
  <div class="overview fade-in">
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
      <el-button type="primary" @click="downloadAllMetrics" style="margin-right: 8px;">
        <i class="el-icon-download"></i> 导出全部
      </el-button>
      <el-button @click="downloadMetrics" style="margin-right: 8px;">
        <i class="el-icon-download"></i> 导出选中
      </el-button>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card class="shadow-sm rounded-xl p-4">
          <div class="card-title">服务类型分布</div>
          <div class="dist-chart">
            <div class="dist-item">
              <span class="dist-label">服务器</span>
              <el-progress :percentage="serverPct" :stroke-width="16" color="var(--el-color-primary)" />
            </div>
            <div class="dist-item">
              <span class="dist-label">Redis</span>
              <el-progress :percentage="redisPct" :stroke-width="16" color="var(--el-color-warning)" />
            </div>
            <div class="dist-item">
              <span class="dist-label">数据库</span>
              <el-progress :percentage="dbPct" :stroke-width="16" color="var(--el-color-success)" />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="shadow-sm rounded-xl p-4">
          <div class="card-title">运行状态概览</div>
          <div class="status-chart">
            <div class="dist-item">
              <span class="dist-label">运行中</span>
              <el-progress :percentage="enabledPct" :stroke-width="16" color="var(--el-color-success)" />
            </div>
            <div class="dist-item">
              <span class="dist-label">已停用</span>
              <el-progress :percentage="disabledPct" :stroke-width="16" color="var(--el-color-danger)" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineExpose } from 'vue'
import { ElMessage } from 'element-plus'
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
  } catch (e) { ElMessage.error((e as Error).message) }
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
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
}
.stat-card.primary { border-left: 3px solid var(--el-color-primary); }
.stat-card.success { border-left: 3px solid var(--el-color-success); }
.stat-card.danger { border-left: 3px solid var(--el-color-danger); }
.stat-card.warning { border-left: 3px solid var(--el-color-warning); }
.stat-value { font-size: 28px; font-weight: 700; color: var(--el-text-color-primary); }
.stat-label { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }

.card-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; color: var(--el-text-color-primary); }

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
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}
.dist-item :deep(.el-progress) { flex: 1; }
</style>