<template>
  <el-drawer 
    v-model="drawerVisible" 
    title="选择安装设备" 
    size="40%" 
    destroy-on-close
    :close-on-click-modal="false"
    :before-close="handleClose"
  >
    <div class="device-selection">
      <div class="selected-software">
        <div class="flex items-center gap-4">
          <el-image :src="software.softServiceLogo" fit="contain" style="width: 60px; height: 60px" class="software-logo">
            <template #error>
              <div class="app-logo-fallback" style="width: 60px; height: 60px">
                <IconifyIconOnline icon="ep:picture" />
              </div>
            </template>
          </el-image>
          <div class="flex-1">
            <h3 class="text-lg font-medium mb-2">{{ software.softServiceName }}</h3>
            <div class="flex items-center gap-2">
              <el-tag size="small" type="success">v{{ software.softServiceVersion }}</el-tag>
              <el-tag size="small" type="primary">{{ getCategoryName(software.softServiceCategory) }}</el-tag>
            </div>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="device-selection-content">
        <h4 class="device-section-title">
          <IconifyIconOnline icon="ep:monitor" class="mr-2" />
          选择安装目标
        </h4>
        
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        
        <template v-else>
          <el-alert 
            v-if="deviceList.length === 0" 
            title="未找到可用设备" 
            type="warning" 
            :closable="false" 
            show-icon 
            class="mb-4" 
          />
          
          <template v-else>
            <el-alert 
              v-if="selectedDevices.length === 0" 
              title="请选择要安装软件的设备" 
              type="info" 
              :closable="false" 
              show-icon 
              class="mb-4" 
            />
            <el-alert 
              v-else 
              :title="`已选择 ${selectedDevices.length} 台设备进行安装`" 
              type="success" 
              :closable="false" 
              show-icon 
              class="mb-4" 
            />

            <div class="device-list">
              <el-checkbox-group v-model="selectedDevices">
                <div class="grid grid-cols-1 gap-4">
                  <ScCard 
                    v-for="device in deviceList" 
                    :key="device.id" 
                    class="device-card" 
                    :class="{ selected: selectedDevices.includes(device.id) }"
                    hoverable
                    shadow="hover"
                    borderPosition="left"
                    padding="16px"
                    @click="handleViewInstallLog(device)"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center">
                        <el-checkbox :label="device.id" class="mr-3" @click.stop />
                        <div class="ml-4">
                          <div class="device-name">{{ device.name }}</div>
                          <div class="device-ip text-gray-500 text-sm">{{ device.host }}</div>
                        </div>
                      </div>
                      <div class="device-status flex items-center">
                        <el-tag size="small" :type="device.status === 1 ? 'success' : 'danger'">
                          {{ device.status === 1 ? '在线' : '离线' }}
                        </el-tag>
                        <el-button 
                          v-if="device.hasInstallRecord" 
                          type="primary" 
                          link 
                          size="small" 
                          class="ml-2"
                          @click.stop="handleViewInstallLog(device)"
                        >
                          <IconifyIconOnline icon="ep:document" class="mr-1" />
                          安装记录
                        </el-button>
                      </div>
                    </div>
                  </ScCard>
                </div>
              </el-checkbox-group>
            </div>
          </template>
        </template>
      </div>

      <div class="drawer-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button 
          type="primary" 
          :disabled="!canProceedInstall" 
          @click="handleInstall" 
          class="install-btn"
          :loading="installing"
        >
          <IconifyIconOnline v-if="!installing" icon="ep:download" class="mr-1" />
          {{ installing ? '安装中...' : '开始安装' }}
        </el-button>
      </div>
    </div>
  </el-drawer>
  
  <!-- 安装记录抽屉 -->
  <el-drawer
    v-model="logDrawerVisible"
    title="安装记录"
    size="40%"
    direction="rtl"
    :destroy-on-close="true"
    :before-close="handleCloseLogDrawer"
  >
    <div v-if="logLoading" class="flex justify-center items-center h-full">
      <el-skeleton :rows="10" animated />
    </div>
    <div v-else-if="!installLogs || installLogs.length === 0" class="flex justify-center items-center h-full">
      <el-empty description="暂无安装记录" />
    </div>
    <div v-else class="install-log-container">
      <div class="install-log-header mb-4">
        <div class="flex items-center justify-between">
          <div class="device-info">
            <h3 class="text-lg font-medium">{{ currentDevice?.name }}</h3>
            <p class="text-gray-500">{{ currentDevice?.host }}</p>
          </div>
          <el-button type="primary" link @click="refreshInstallLog">
            <IconifyIconOnline icon="ep:refresh" class="mr-1" />刷新
          </el-button>
        </div>
      </div>
      
      <el-timeline>
        <el-timeline-item
          v-for="(log, index) in installLogs"
          :key="index"
          :timestamp="formatDate(log.createTime)"
          :type="getLogType(log.status)"
          :hollow="log.status !== 'success'"
        >
          <div class="log-item">
            <h4 class="log-title">
              {{ log.softServiceName }} 
              <el-tag size="small" class="ml-2">v{{ log.softServiceVersion }}</el-tag>
            </h4>
            <p class="log-status">
              状态: 
              <el-tag :type="getLogTagType(log.status)" size="small">
                {{ getStatusText(log.status) }}
              </el-tag>
            </p>
            <p v-if="log.installPath" class="log-path">
              安装路径: <code>{{ log.installPath }}</code>
            </p>
            <p v-if="log.port" class="log-port">
              端口: <code>{{ log.port }}</code>
            </p>
            <div class="log-actions mt-2">
              <el-button 
                v-if="log.status === 'success'" 
                type="success" 
                size="small" 
                link
              >
                <IconifyIconOnline icon="ep:video-play" class="mr-1" />启动
              </el-button>
              <el-button 
                v-if="log.status === 'success'" 
                type="danger" 
                size="small" 
                link
              >
                <IconifyIconOnline icon="ep:delete" class="mr-1" />卸载
              </el-button>
              <el-button 
                type="primary" 
                size="small" 
                link
              >
                <IconifyIconOnline icon="ep:document" class="mr-1" />详情
              </el-button>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, defineExpose, computed, defineProps, defineEmits, watch, onMounted } from 'vue'
import { message } from "@repo/utils"
import { machineSshListData } from "@/api/system/assets-ssh"
import type { PartialSoftService } from '@/api/soft'
import ScCard from '@repo/components/ScCard/index.vue'
import { fetchSoftServiceInstallLog } from '@/api/soft/log'
import dayjs from 'dayjs'

// 接口定义
interface InstallLog {
  id: string;
  softServiceId: number;
  softServiceName: string;
  softServiceVersion: string;
  sshId: string;
  status: string;
  createTime: string;
  updateTime: string;
  installPath?: string;
  port?: string;
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  software: {
    type: Object as () => PartialSoftService,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'install', 'cancel'])

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 设备相关
const selectedDevices = ref<string[]>([])
const deviceList = ref<any[]>([])
const loading = ref(false)
const installing = ref(false)

// 安装记录相关
const logDrawerVisible = ref(false)
const logLoading = ref(false)
const installLogs = ref<InstallLog[]>([])
const currentDevice = ref<any>(null)

// 计算属性
const canProceedInstall = computed(() => {
  return selectedDevices.value.length > 0
})

// 获取分类名称
const getCategoryName = (category: string) => {
  if (!category) return "未分类"
  
  const categories = [
    { label: "全部", value: "all" },
    { label: "数据库", value: "database" },
    { label: "Web服务器", value: "web_server" },
    { label: "开发工具", value: "development" },
    { label: "监控工具", value: "monitoring" },
    { label: "容器", value: "container" },
    { label: "其他", value: "other" }
  ]
  
  const found = categories.find((item) => item.value === category)
  return found ? found.label : "未知"
}

// 加载设备列表
const loadDeviceList = async () => {
  try {
    loading.value = true
    const res = await machineSshListData({
      page: 1,
      limit: 100
    })
    
    if (res.code === 200) {
      deviceList.value = res.data.result.map(item => ({
        id: item.id,
        name: item.name,
        host: item.host,
        status: item.status,
        hasInstallRecord: false // 初始化安装记录状态
      }))
      
      // 加载完设备列表后，批量检查安装记录
      checkInstallRecords()
    } else {
      message.error(res.msg || '加载设备列表失败')
    }
  } catch (error) {
    console.error('加载设备列表失败:', error)
    message.error('加载设备列表失败')
  } finally {
    loading.value = false
  }
}

// 批量检查设备的安装记录
const checkInstallRecords = async () => {
  if (!deviceList.value.length) return
  
  // 为了避免大量请求，这里只检查前5个设备
  const devicesToCheck = deviceList.value.slice(0, 5)
  
  for (const device of devicesToCheck) {
    try {
      const res = await fetchSoftServiceInstallLog({ installId: device.id })
      if (res.code === 200 && res.data) {
        // 确保数据是数组
        const logData = Array.isArray(res.data) ? res.data : [res.data]
        
        // 更新设备安装记录状态
        const deviceIndex = deviceList.value.findIndex(d => d.id === device.id)
        if (deviceIndex > -1) {
          deviceList.value[deviceIndex].hasInstallRecord = logData.length > 0
        }
      }
    } catch (error) {
      console.error(`检查设备 ${device.id} 安装记录失败:`, error)
    }
  }
}

// 处理安装
const handleInstall = () => {
  if (!canProceedInstall.value) {
    message.warning('请选择要安装的设备')
    return
  }
  
  installing.value = true
  emit('install', selectedDevices.value)
}

// 处理取消
const handleCancel = () => {
  emit('cancel')
}

const handleClose = () => {
  handleCancel();
  installing.value = false;
}

// 查看安装记录
const handleViewInstallLog = (device: any) => {
  currentDevice.value = device
  logDrawerVisible.value = true
  fetchInstallLog(device.id)
}

// 获取安装记录
const fetchInstallLog = async (sshId: string) => {
  try {
    logLoading.value = true
    const res = await fetchSoftServiceInstallLog({ installId: sshId })
    if (res.code === 200 && res.data) {
      // 确保数据是数组
      const logData = Array.isArray(res.data) ? res.data : [res.data]
      installLogs.value = logData as InstallLog[]
      
      // 标记设备有安装记录
      const deviceIndex = deviceList.value.findIndex(d => d.id === sshId)
      if (deviceIndex > -1) {
        deviceList.value[deviceIndex].hasInstallRecord = installLogs.value.length > 0
      }
    } else {
      installLogs.value = []
      message.warning(res.msg || '获取安装记录失败')
    }
  } catch (error) {
    console.error('获取安装记录失败:', error)
    message.error('获取安装记录失败')
    installLogs.value = []
  } finally {
    logLoading.value = false
  }
}

// 刷新安装记录
const refreshInstallLog = () => {
  if (currentDevice.value) {
    fetchInstallLog(currentDevice.value.id)
  }
}

// 关闭安装记录抽屉
const handleCloseLogDrawer = () => {
  logDrawerVisible.value = false
  currentDevice.value = null
  installLogs.value = []
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 获取日志类型
const getLogType = (status: string) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'danger'
    case 'running':
      return 'primary'
    default:
      return 'info'
  }
}

// 获取日志标签类型
const getLogTagType = (status: string) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'danger'
    case 'running':
      return 'primary'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'success':
      return '安装成功'
    case 'failed':
      return '安装失败'
    case 'running':
      return '安装中'
    default:
      return '未知状态'
  }
}

// 监听抽屉可见性变化
watch(() => drawerVisible.value, (newValue) => {
  if (newValue) {
    loadDeviceList()
    selectedDevices.value = []
  }
})

// 组件挂载时加载设备列表
onMounted(() => {
  installing.value = false
  if (drawerVisible.value) {
    loadDeviceList()
  }
})


defineExpose({
  handleCancel
})
</script>

<style lang="scss" scoped>
.device-selection {
  padding: 0 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .selected-software {
    background-color: var(--el-fill-color-light);
    border-radius: 12px;
    padding: 20px;
    
    .software-logo {
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      border: 1px solid var(--el-border-color-light);
    }
  }
}

.device-selection-content {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

.device-section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
}

.loading-container {
  padding: 20px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
}

.device-list {
  margin-top: 20px;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}

.device-card {
  transition: all 0.3s;
  cursor: pointer;
  margin-bottom: 12px;
  
  &.selected {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    
    .device-name {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }
  
  .device-name {
    font-weight: 500;
    font-size: 15px;
    transition: color 0.3s;
    margin-bottom: 4px;
  }
  
  .device-ip {
    margin-top: 2px;
  }
  
  .device-status {
    .el-tag {
      padding: 0 8px;
    }
  }
}

.drawer-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  
  .install-btn {
    padding: 10px 20px;
    font-weight: 500;
    border-radius: 6px;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }
}

.app-logo-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  border-radius: 10px;
  
  .iconify {
    font-size: 24px;
  }
}

// 安装记录样式
.install-log-container {
  padding: 0 20px;
  height: 100%;
  overflow-y: auto;
}

.install-log-header {
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  
  .device-info {
    h3 {
      margin: 0 0 8px 0;
      font-weight: 600;
    }
    
    p {
      margin: 0;
      font-size: 14px;
    }
  }
}

.log-item {
  padding: 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  margin-bottom: 8px;
  
  .log-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 12px 0;
    display: flex;
    align-items: center;
  }
  
  .log-status,
  .log-path,
  .log-port {
    margin: 8px 0;
    font-size: 14px;
    
    code {
      background-color: var(--el-bg-color);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      color: var(--el-color-primary);
    }
  }
  
  .log-actions {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }
}
</style> 