<template>
  <div class="device-list-container">
    <div class="section-title">
      <IconifyIconOnline icon="ep:monitor" class="icon" />
      <span>安装设备</span>
      <el-tag type="info" effect="plain" size="small" class="ml-2">{{ deviceList.length }}</el-tag>
    </div>
    
    <div class="device-list-wrapper">
      <el-scrollbar height="300px" class="device-scrollbar">
        <div v-if="deviceList.length === 0" class="empty-device-list">
          <el-empty description="暂无设备" />
        </div>
        <div v-else class="device-items">
          <div 
            v-for="device in deviceList" 
            :key="device.id"
            class="device-item"
            :class="{ 'active': activeDevice === device.id }"
            @click="handleSelect(device.id, device.installId)"
          >
            <div class="device-info">
              <div class="device-name">
                <IconifyIconOnline icon="ep:monitor" class="device-icon" />
                <span>{{ device.sshName }}</span>
              </div>
              <div class="device-meta">
                <el-tag 
                  size="small" 
                  :type="getStatusType(device.installStatus)"
                  effect="light"
                >
                  {{ getStatusText(device.installStatus) }}
                </el-tag>
              </div>
            </div>
            <div class="device-details">
              <div class="detail-item" v-if="device.port">
                <IconifyIconOnline icon="ep:connection" class="detail-icon" />
                <span>端口: {{ device.port }}</span>
              </div>
              <div class="detail-item" v-if="device.softServiceVersion">
                <IconifyIconOnline icon="ep:version" class="detail-icon" />
                <span>版本: {{ device.softServiceVersion }}</span>
              </div>
              <div class="detail-item" v-if="device.installPath">
                <IconifyIconOnline icon="ep:folder" class="detail-icon" />
                <span class="detail-path">{{ device.installPath }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  deviceList: {
    type: Array as PropType<any[]>,
    default: () => []
  },
  activeDevice: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select-device'])

// 处理设备选择，添加installId参数
const handleSelect = (deviceId: string, installId: string) => {
  // 发送select-device事件，并传递设备ID和installId
  emit('select-device', deviceId, installId)
}

// 获取状态类型
const getStatusType = (status: number) => {
  switch (status) {
    case 0: return 'info'
    case 1: return 'warning'
    case 2: return 'success'
    case 3: return 'danger'
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: number) => {
  switch (status) {
    case 0: return '待安装'
    case 1: return '安装中'
    case 2: return '已安装'
    case 3: return '安装失败'
    default: return '未知'
  }
}

// 获取状态图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return 'ep:time'
    case 'running': return 'ep:loading'
    case 'success': return 'ep:check'
    case 'error': return 'ep:close'
    default: return 'ep:info'
  }
}

// 获取空设备文本
const getEmptyText = () => {
  if (props.deviceList.length === 0) {
    return '暂无安装设备';
  }
  
  const device = props.deviceList[0];
  if (device.id === 'loading') {
    return '正在加载设备...';
  } else if (device.id === 'no-records') {
    return '暂无安装记录';
  } else if (device.id === 'error') {
    return '加载设备失败';
  }
  
  return '暂无安装设备';
}
</script>

<style lang="scss" scoped>
.device-list-container {
  padding: 8px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; // 重要：允许子元素正确伸缩
  background-color: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  
  .icon {
    margin-right: 8px;
    color: var(--el-color-primary);
    font-size: 18px;
  }
}

.device-list-wrapper {
  flex: 1;
  min-height: 0; // 重要：允许滚动条正确工作
  position: relative;
}

.empty-device-list {
  padding: 20px 0;
}

.device-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-item {
  padding: 12px;
  border-radius: 8px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: var(--el-border-color);
  }
  
  &.active {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.1);
  }
}

.device-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.device-name {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: var(--el-text-color-primary);
  
  .device-icon {
    margin-right: 8px;
    color: var(--el-color-primary);
    font-size: 16px;
  }
}

.device-meta {
  display: flex;
  align-items: center;
}

.device-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.detail-item {
  display: flex;
  align-items: center;
  
  .detail-icon {
    margin-right: 6px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
  
  .detail-path {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
}

:deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

:deep(.el-scrollbar__bar.is-horizontal) {
  display: none;
}
</style> 