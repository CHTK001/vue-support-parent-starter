<template>
  <div class="container-host-monitor">
    <div class="monitor-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:server-line" class="header-icon" />
        <span class="header-title">主机资源监控</span>
      </div>
      <div class="header-right">
        <el-button @click="handleRefresh" :loading="loading" size="small" circle>
          <IconifyIconOnline icon="ri:refresh-line" />
        </el-button>
      </div>
    </div>
    
    <div class="monitor-content">
      <!-- CPU使用�?-->
      <div class="resource-item">
        <div class="resource-label">CPU使用�?/div>
        <div class="resource-progress">
          <el-progress
            :percentage="cpuUsage"
            :color="getUsageColor(cpuUsage)"
            :stroke-width="10"
            :show-text="false"
          />
        </div>
        <div class="resource-value">{{ cpuUsage.toFixed(1) }}%</div>
      </div>
      
      <!-- 内存使用�?-->
      <div class="resource-item">
        <div class="resource-label">内存使用�?/div>
        <div class="resource-progress">
          <el-progress
            :percentage="memoryUsage"
            :color="getUsageColor(memoryUsage)"
            :stroke-width="10"
            :show-text="false"
          />
        </div>
        <div class="resource-value">{{ memoryUsage.toFixed(1) }}%</div>
      </div>
      
      <!-- 磁盘使用�?-->
      <div class="resource-item">
        <div class="resource-label">磁盘使用�?/div>
        <div class="resource-progress">
          <el-progress
            :percentage="diskUsage"
            :color="getUsageColor(diskUsage)"
            :stroke-width="10"
            :show-text="false"
          />
        </div>
        <div class="resource-value">{{ diskUsage.toFixed(1) }}%</div>
      </div>
      
      <!-- 容器状态统�?-->
      <div class="container-stats">
        <div class="stats-item">
          <div class="stats-count">{{ containerStats.running }}</div>
          <div class="stats-label">运行�?/div>
        </div>
        <div class="stats-item">
          <div class="stats-count">{{ containerStats.stopped }}</div>
          <div class="stats-label">已停�?/div>
        </div>
        <div class="stats-item">
          <div class="stats-count">{{ containerStats.total }}</div>
          <div class="stats-label">总计</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { containerApi, type ContainerStatusStatistics } from '@/api/docker'
import { onMounted, ref } from 'vue'

// 响应式数�?
const loading = ref(false)
const cpuUsage = ref(0)
const memoryUsage = ref(0)
const diskUsage = ref(0)
const containerStats = ref<ContainerStatusStatistics>({ 
  total: 0, 
  running: 0, 
  stopped: 0 
})

// 获取主机资源使用情况
const fetchHostStats = async () => {
  if (loading.value) return
  loading.value = true
  
  try {
    // 这里使用模拟数据，实际应用中应该从API获取主机资源数据
    cpuUsage.value = Math.random() * 100
    memoryUsage.value = Math.random() * 100
    diskUsage.value = Math.random() * 100
    
    // 获取容器状态统�?
    const response = await containerApi.getContainerStatusStats()
    if (response.code === '00000') {
      containerStats.value = response.data || { total: 0, running: 0, stopped: 0 }
    }
  } catch (error) {
    console.error('获取主机资源数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 刷新数据
const handleRefresh = () => {
  fetchHostStats()
}

// 根据使用率获取颜�?
const getUsageColor = (percentage: number) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

// 组件挂载时获取数�?
onMounted(() => {
  fetchHostStats()
})
</script>

<style scoped>
.container-host-monitor {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
  color: #409eff;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.monitor-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resource-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-label {
  font-size: 14px;
  color: #606266;
}

.resource-progress {
  flex: 1;
}

.resource-value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  text-align: right;
}

.container-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
  margin-top: 8px;
}

.stats-item {
  text-align: center;
}

.stats-count {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.stats-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>