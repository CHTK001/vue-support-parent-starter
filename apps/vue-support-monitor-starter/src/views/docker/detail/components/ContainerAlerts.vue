<template>
  <div class="container-alerts">
    <div class="alerts-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:alarm-warning-line" class="header-icon" />
        <span class="header-title">容器告警</span>
      </div>
      <div class="header-right">
        <el-button @click="handleRefresh" :loading="loading" size="small" circle>
          <IconifyIconOnline icon="ri:refresh-line" />
        </el-button>
      </div>
    </div>
    
    <div class="alerts-content">
      <el-empty v-if="alerts.length === 0" description="暂无告警信息" />
      
      <div v-else class="alerts-list">
        <div 
          v-for="alert in alerts" 
          :key="alert.id"
          class="alert-item"
          :class="`alert-${alert.level}`"
        >
          <div class="alert-header">
            <div class="alert-icon">
              <IconifyIconOnline :icon="getAlertIcon(alert.level)" />
            </div>
            <div class="alert-title">{{ alert.title }}</div>
            <div class="alert-time">{{ formatTime(alert.time) }}</div>
          </div>
          <div class="alert-content">
            <div class="alert-message">{{ alert.message }}</div>
            <div class="alert-container">
              <el-tag size="small">{{ alert.containerName }}</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface ContainerAlert {
  id: string
  title: string
  message: string
  level: 'info' | 'warning' | 'error' | 'critical'
  time: string
  containerName: string
  containerId: number
}

// 响应式数�?
const loading = ref(false)
const alerts = ref<ContainerAlert[]>([])

// 获取告警信息
const fetchAlerts = async () => {
  if (loading.value) return
  loading.value = true
  
  try {
    // 这里使用模拟数据，实际应用中应该从API获取告警数据
    alerts.value = [
      {
        id: '1',
        title: 'CPU使用率过�?,
        message: '容器 nginx-proxy 的CPU使用率超�?0%',
        level: 'warning',
        time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        containerName: 'nginx-proxy',
        containerId: 1001
      },
      {
        id: '2',
        title: '内存不足',
        message: '容器 mysql-db 的内存使用接近限�?,
        level: 'error',
        time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        containerName: 'mysql-db',
        containerId: 1002
      }
    ]
  } catch (error) {
    console.error('获取告警信息失败:', error)
  } finally {
    loading.value = false
  }
}

// 刷新数据
const handleRefresh = () => {
  fetchAlerts()
}

// 根据告警级别获取图标
const getAlertIcon = (level: string) => {
  const icons = {
    info: 'ri:information-line',
    warning: 'ri:alarm-warning-line',
    error: 'ri:error-warning-line',
    critical: 'ri:alert-line'
  }
  return icons[level] || 'ri:information-line'
}

// 格式化时�?
const formatTime = (time: string) => {
  return new Date(time).toLocaleString()
}

// 组件挂载时获取数�?
onMounted(() => {
  fetchAlerts()
})
</script>

<style scoped>
.container-alerts {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.alerts-header {
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
  color: #f56c6c;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #409eff;
  background: #f5f7fa;
}

.alert-item.alert-info {
  border-left-color: #409eff;
}

.alert-item.alert-warning {
  border-left-color: #e6a23c;
}

.alert-item.alert-error {
  border-left-color: #f56c6c;
}

.alert-item.alert-critical {
  border-left-color: #d42b2b;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.alert-icon {
  font-size: 16px;
  color: #f56c6c;
}

.alert-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  flex: 1;
}

.alert-time {
  font-size: 12px;
  color: #909399;
}

.alert-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-message {
  font-size: 13px;
  color: #606266;
  flex: 1;
}

.alert-container {
  margin-left: 12px;
}
</style>