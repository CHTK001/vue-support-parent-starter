<template>
  <el-card class="container-card" :class="{ 'running': isRunning, 'stopped': isStopped }">
    <!-- 卡片头部 -->
    <template #header>
      <div class="card-header">
        <div class="header-left">
          <IconifyIconOnline 
            :icon="isRunning ? 'ri:checkbox-circle-line' : 'ri:stop-circle-line'" 
            :class="['status-icon', isRunning ? 'running' : 'stopped']"
          />
          <div class="container-name">
            <div class="name-text">{{ container.systemSoftContainerName }}</div>
            <div class="container-id">{{ dockerId }}</div>
          </div>
        </div>
        <el-tag :type="getStatusType(container.systemSoftContainerStatus)" size="small">
          {{ getStatusText(container.systemSoftContainerStatus) }}
        </el-tag>
      </div>
    </template>

    <!-- 卡片内容 -->
    <div class="card-content">
      <!-- 镜像信息 -->
      <div class="info-row">
        <div class="info-label">
          <IconifyIconOnline icon="ri:image-line" class="info-icon" />
          <span>镜像</span>
        </div>
        <div class="info-value">{{ container.systemSoftContainerImage }}:{{ container.systemSoftContainerImageTag || 'latest' }}</div>
      </div>

      <!-- 服务器信�?-->
      <div class="info-row">
        <div class="info-label">
          <IconifyIconOnline icon="ri:server-line" class="info-icon" />
          <span>服务�?/span>
        </div>
        <div class="info-value">服务�?#{{ container.systemServerId }}</div>
      </div>

      <!-- 端口映射 -->
      <div v-if="ports.length > 0" class="info-row">
        <div class="info-label">
          <IconifyIconOnline icon="ri:share-box-line" class="info-icon" />
          <span>端口</span>
        </div>
        <div class="ports-list">
          <el-tag v-for="port in ports.slice(0, 3)" :key="port" size="small" class="port-tag">
            {{ port }}
          </el-tag>
          <el-tag v-if="ports.length > 3" size="small" type="info">
            +{{ ports.length - 3 }}
          </el-tag>
        </div>
      </div>

      <!-- 资源使用 -->
      <div class="resource-section">
        <div class="resource-item">
          <div class="resource-label">CPU</div>
          <el-progress 
            :percentage="cpuUsage" 
            :color="getUsageColor(cpuUsage)"
            :stroke-width="6"
            :show-text="false"
          />
          <span class="resource-value">{{ cpuUsage.toFixed(1) }}%</span>
        </div>
        <div class="resource-item">
          <div class="resource-label">内存</div>
          <el-progress 
            :percentage="memoryUsage" 
            :color="getUsageColor(memoryUsage)"
            :stroke-width="6"
            :show-text="false"
          />
          <span class="resource-value">{{ memoryUsage.toFixed(1) }}%</span>
        </div>
      </div>

      <!-- 创建时间 -->
      <div class="info-row time-row">
        <div class="info-label">
          <IconifyIconOnline icon="ri:time-line" class="info-icon" />
          <span>创建时间</span>
        </div>
        <div class="info-value">{{ formatTime(container.systemSoftContainerCreatedTime) }}</div>
      </div>
    </div>

    <!-- 卡片底部操作�?-->
    <template #footer>
      <div class="card-footer">
        <el-button-group class="action-group">
          <el-button 
            size="small" 
            type="success" 
            :disabled="isRunning"
            @click="$emit('start', container)"
          >
            <IconifyIconOnline icon="ri:play-line" />
          </el-button>
          <el-button 
            size="small" 
            type="warning" 
            :disabled="!isRunning"
            @click="$emit('stop', container)"
          >
            <IconifyIconOnline icon="ri:stop-line" />
          </el-button>
          <el-button 
            size="small" 
            type="primary" 
            @click="$emit('restart', container)"
          >
            <IconifyIconOnline icon="ri:restart-line" />
          </el-button>
        </el-button-group>

        <el-dropdown trigger="click" @command="handleCommand">
          <el-button size="small">
            <IconifyIconOnline icon="ri:more-2-fill" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="exec" :disabled="!isRunning">
                <IconifyIconOnline icon="ri:terminal-box-line" class="mr-1" />
                进入容器
              </el-dropdown-item>
              <el-dropdown-item command="logs">
                <IconifyIconOnline icon="ri:file-text-line" class="mr-1" />
                查看日志
              </el-dropdown-item>
              <el-dropdown-item command="detail">
                <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
                详细信息
              </el-dropdown-item>
              <el-dropdown-item command="delete" divided>
                <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
                删除容器
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SystemSoftContainer } from '@/api/docker'

interface Props {
  container: SystemSoftContainer
}

interface Emits {
  (e: 'start', container: SystemSoftContainer): void
  (e: 'stop', container: SystemSoftContainer): void
  (e: 'restart', container: SystemSoftContainer): void
  (e: 'delete', container: SystemSoftContainer): void
  (e: 'detail', container: SystemSoftContainer): void
  (e: 'logs', container: SystemSoftContainer): void
  (e: 'exec', container: SystemSoftContainer): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 计算属�?
const isRunning = computed(() => props.container.systemSoftContainerStatus === 'running')
const isStopped = computed(() => 
  props.container.systemSoftContainerStatus === 'stopped' || 
  props.container.systemSoftContainerStatus === 'exited'
)

const dockerId = computed(() => {
  const id = props.container.systemSoftContainerDockerId
  return id ? id.substring(0, 12) : 'N/A'
})

const ports = computed(() => {
  if (!props.container.systemSoftContainerPorts) return []
  try {
    const mappings = JSON.parse(props.container.systemSoftContainerPorts)
    if (Array.isArray(mappings)) {
      return mappings.map(p => `${p.hostPort}:${p.containerPort}`)
    }
    return []
  } catch {
    return props.container.systemSoftContainerPorts.split(',').filter(Boolean)
  }
})

const cpuUsage = computed(() => {
  return props.container.systemSoftContainerCpuPercent || 
         props.container.systemSoftContainerCpuUsage || 
         0
})

const memoryUsage = computed(() => {
  return props.container.systemSoftContainerMemoryPercent || 
         props.container.systemSoftContainerMemoryUsage || 
         0
})

// 工具函数
const getStatusType = (status?: string) => {
  const map: Record<string, any> = {
    running: 'success',
    stopped: 'info',
    exited: 'info',
    paused: 'warning',
    restarting: 'warning',
    error: 'danger'
  }
  return map[status || ''] || 'info'
}

const getStatusText = (status?: string) => {
  const map: Record<string, string> = {
    running: '运行�?,
    stopped: '已停�?,
    exited: '已退�?,
    paused: '暂停',
    restarting: '重启�?,
    error: '错误'
  }
  return map[status || ''] || '未知'
}

const getUsageColor = (percentage: number) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

const formatTime = (time?: string) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 事件处理
const handleCommand = (command: string) => {
  switch (command) {
    case 'exec':
      emit('exec', props.container)
      break
    case 'logs':
      emit('logs', props.container)
      break
    case 'detail':
      emit('detail', props.container)
      break
    case 'delete':
      emit('delete', props.container)
      break
  }
}
</script>

<style scoped>
.container-card {
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.container-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.container-card.running {
  border-color: rgba(103, 194, 58, 0.3);
}

.container-card.stopped {
  border-color: rgba(144, 147, 153, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.status-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.status-icon.running {
  color: #67c23a;
}

.status-icon.stopped {
  color: #909399;
}

.container-name {
  flex: 1;
  min-width: 0;
}

.name-text {
  font-weight: 600;
  font-size: 14px;
  color: var(--app-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.container-id {
  font-size: 11px;
  color: var(--app-text-secondary);
  font-family: 'Consolas', monospace;
  margin-top: 2px;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--app-text-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.info-icon {
  font-size: 14px;
}

.info-value {
  color: var(--app-text-primary);
  font-size: 12px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.ports-list {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.port-tag {
  font-family: 'Consolas', monospace;
  font-size: 10px;
}

.resource-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.resource-label {
  font-size: 12px;
  color: var(--app-text-secondary);
  width: 40px;
  flex-shrink: 0;
}

.resource-value {
  font-size: 11px;
  color: var(--app-text-primary);
  width: 40px;
  text-align: right;
  flex-shrink: 0;
}

.time-row .info-value {
  font-size: 11px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 0;
}

.action-group {
  flex: 1;
}

:deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.el-card__body) {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.el-card__footer) {
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

:deep(.el-progress) {
  flex: 1;
}

:deep(.el-button-group .el-button) {
  padding: 5px 8px;
}

@media (max-width: 768px) {
  .container-card {
    margin-bottom: 12px;
  }

  .name-text {
    font-size: 13px;
  }

  .info-label,
  .info-value {
    font-size: 11px;
  }
}
</style>

