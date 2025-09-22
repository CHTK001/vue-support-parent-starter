<template>
  <div class="progress-monitor">
    <!-- 进度列表抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="操作进度"
      direction="rtl"
      size="400px"
    >
      <div class="progress-content">
        <!-- 活跃操作 -->
        <div v-if="activeOperations.length > 0" class="progress-section">
          <div class="section-title">
            <IconifyIconOnline icon="ri:refresh-line" class="title-icon" />
            正在进行的操作
          </div>
          <div class="operations-list">
            <div
              v-for="operation in activeOperations"
              :key="operation.id"
              class="operation-item"
              :class="[`operation-${operation.status}`]"
            >
              <div class="operation-header">
                <div class="operation-title">{{ operation.title }}</div>
                <div class="operation-status">
                  <el-tag
                    :type="getStatusType(operation.status)"
                    size="small"
                  >
                    {{ getStatusText(operation.status) }}
                  </el-tag>
                </div>
              </div>
              
              <div class="operation-progress">
                <el-progress
                  :percentage="operation.progress"
                  :status="getProgressStatus(operation.status)"
                  :stroke-width="6"
                />
              </div>
              
              <div class="operation-message">{{ operation.message }}</div>
              
              <div class="operation-time">
                开始时间: {{ formatTime(operation.startTime) }}
                <span v-if="operation.endTime">
                  | 结束时间: {{ formatTime(operation.endTime) }}
                </span>
                <span v-else>
                  | 已用时: {{ getElapsedTime(operation.startTime) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 通知历史 -->
        <div class="progress-section">
          <div class="section-title">
            <IconifyIconOnline icon="ri:notification-line" class="title-icon" />
            通知历史
            <el-button size="small" text @click="clearAllNotifications">
              清空
            </el-button>
          </div>
          <div v-if="notifications.length > 0" class="notifications-list">
            <div
              v-for="notification in notifications.slice(0, 20)"
              :key="notification.id"
              class="notification-item"
              :class="[`notification-${notification.type}`]"
            >
              <div class="notification-header">
                <IconifyIconOnline
                  :icon="getNotificationIcon(notification.type)"
                  class="notification-icon"
                />
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-time">
                  {{ formatRelativeTime(notification.timestamp) }}
                </div>
              </div>
              <div class="notification-message">{{ notification.message }}</div>
            </div>
          </div>
          <div v-else class="no-notifications">
            <IconifyIconOnline icon="ri:notification-off-line" class="empty-icon" />
            <span>暂无通知</span>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 悬浮球 -->
    <div
      class="progress-fab"
      :class="{ 'has-operations': hasActiveOperations }"
      @click="toggleDrawer"
    >
      <div class="fab-content">
        <IconifyIconOnline
          v-if="hasActiveOperations"
          icon="ri:loader-4-line"
          class="fab-icon spinning"
        />
        <IconifyIconOnline
          v-else
          icon="ri:notification-line"
          class="fab-icon"
        />
        <div v-if="hasActiveOperations" class="fab-badge">
          {{ activeOperations.length }}
        </div>
      </div>
    </div>

    <!-- 迷你进度条（当有活跃操作时显示在页面顶部） -->
    <div
      v-if="hasActiveOperations && !drawerVisible"
      class="mini-progress-bar"
    >
      <div
        v-for="operation in activeOperations.slice(0, 3)"
        :key="operation.id"
        class="mini-progress-item"
      >
        <div class="mini-progress-info">
          <span class="mini-title">{{ operation.title }}</span>
          <span class="mini-percentage">{{ operation.progress.toFixed(0) }}%</span>
        </div>
        <el-progress
          :percentage="operation.progress"
          :status="getProgressStatus(operation.status)"
          :stroke-width="3"
          :show-text="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  socketState,
  progressState,
  connectSocket,
  disconnectSocket,
  enableAutoConnect,
  clearNotifications,
  type OperationProgress,
  type ProgressNotification
} from '@/utils/socket'

const drawerVisible = ref(false)

// 计算属性
const activeOperations = computed(() => Array.from(progressState.activeOperations.values()))
const notifications = computed(() => progressState.notifications)
const hasActiveOperations = computed(() => activeOperations.value.length > 0)

// 方法
const toggleDrawer = () => {
  drawerVisible.value = !drawerVisible.value
}

const getStatusType = (status: string) => {
  const map = {
    pending: 'info',
    running: 'primary', 
    success: 'success',
    error: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map = {
    pending: '等待中',
    running: '进行中',
    success: '已完成',
    error: '失败'
  }
  return map[status] || '未知'
}

const getProgressStatus = (status: string) => {
  if (status === 'success') return 'success'
  if (status === 'error') return 'exception'
  return undefined
}

const getNotificationIcon = (type: string) => {
  const map = {
    success: 'ri:check-line',
    error: 'ri:error-warning-line',
    warning: 'ri:alert-line',
    info: 'ri:information-line'
  }
  return map[type] || 'ri:notification-line'
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString()
}

const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

const getElapsedTime = (startTime: Date) => {
  const now = new Date()
  const diff = now.getTime() - startTime.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  if (minutes > 0) return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
  return `${seconds}秒`
}

const clearAllNotifications = () => {
  clearNotifications()
}

// 生命周期
onMounted(async () => {
  // 启用自动连接
  enableAutoConnect()
  
  // 尝试连接Socket.IO
  try {
    await connectSocket()
  } catch (error) {
    console.warn('Socket.IO连接失败，将在后台重试:', error)
  }
})

onUnmounted(() => {
  disconnectSocket()
})
</script>

<style scoped>
.progress-monitor {
  position: relative;
  z-index: 1000;
}

/* 悬浮球样式 */
.progress-fab {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  transition: all 0.3s ease;
  z-index: 1001;
}

.progress-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.6);
}

.progress-fab.has-operations {
  background: #67c23a;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
}

.progress-fab.has-operations:hover {
  box-shadow: 0 6px 16px rgba(103, 194, 58, 0.6);
}

.fab-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-icon {
  color: white;
  font-size: 24px;
}

.fab-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fab-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #f56c6c;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

/* 迷你进度条样式 */
.mini-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #e4e7ed;
  padding: 8px 16px;
  z-index: 999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mini-progress-item {
  margin-bottom: 8px;
}

.mini-progress-item:last-child {
  margin-bottom: 0;
}

.mini-progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.mini-title {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.mini-percentage {
  font-size: 12px;
  color: #409eff;
  font-weight: 600;
}

/* 抽屉内容样式 */
.progress-content {
  height: 100%;
  overflow-y: auto;
}

.progress-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e4e7ed;
}

.title-icon {
  color: #409eff;
}

/* 操作列表样式 */
.operations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.operation-item {
  padding: 16px;
  border-radius: 8px;
  background: #f8f9fa;
  border-left: 4px solid #e4e7ed;
}

.operation-item.operation-running {
  border-left-color: #409eff;
  background: #f0f9ff;
}

.operation-item.operation-success {
  border-left-color: #67c23a;
  background: #f0f9ff;
}

.operation-item.operation-error {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.operation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.operation-title {
  font-weight: 600;
  color: #303133;
}

.operation-progress {
  margin-bottom: 8px;
}

.operation-message {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
}

.operation-time {
  font-size: 11px;
  color: #909399;
}

/* 通知列表样式 */
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  padding: 12px;
  border-radius: 6px;
  background: #f8f9fa;
  border-left: 3px solid #e4e7ed;
}

.notification-item.notification-success {
  border-left-color: #67c23a;
  background: #f0f9ff;
}

.notification-item.notification-error {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.notification-item.notification-warning {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.notification-item.notification-info {
  border-left-color: #409eff;
  background: #f0f9ff;
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.notification-icon {
  font-size: 14px;
}

.notification-title {
  font-weight: 500;
  color: #303133;
  flex: 1;
}

.notification-time {
  font-size: 11px;
  color: #909399;
}

.notification-message {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
}

.no-notifications {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  font-size: 32px;
  color: #c0c4cc;
}
</style>