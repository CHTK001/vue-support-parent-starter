<template>
  <el-drawer 
    v-model="drawerVisible" 
    title="选择安装设备" 
    size="60%" 
    destroy-on-close
    :close-on-click-modal="false"
    :before-close="handleClose"
  >
    <div class="device-selection">
      <div class="selected-software">
        <ScCard 
          shadow="always" 
          borderPosition="left" 
          padding="16px"
          class="mb-4"
        >
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

          <!-- 版本选择 -->
          <div class="version-select mt-4" v-if="software.versions && software.versions.length > 0">
            <h4 class="text-sm font-medium mb-2">选择版本</h4>
            <el-select v-model="selectedVersionId" class="w-full" placeholder="请选择版本">
              <el-option
                v-for="version in software.versions"
                :key="version.softServiceId"
                :label="`${version.version}${version.isCurrent ? ' (当前)' : ''}${version.isInstallable === false ? ' (不可安装)' : ''}`"
                :value="version.softServiceId"
                :disabled="version.isInstallable === false"
              >
                <div class="flex justify-between items-center">
                  <span>{{ version.version }}</span>
                  <div class="flex items-center">
                    <el-tag v-if="version.isInstallable === false" size="small" type="danger" class="mr-1">不可安装</el-tag>
                    <el-tag v-if="version.isCurrent" size="small" type="success">当前</el-tag>
                  </div>
                </div>
              </el-option>
            </el-select>
            <div class="version-info mt-2" v-if="selectedVersion">
              <p v-if="selectedVersion.releaseTime">发布时间: {{ formatDateDate(selectedVersion.releaseTime) }}</p>
              <p v-if="selectedVersion.isInstallable === false" class="text-red-500">此版本不支持安装</p>
              <p v-if="selectedVersion.versionDesc">{{ selectedVersion.versionDesc }}</p>
            </div>
          </div>
        </ScCard>
      </div>

      <div class="device-selection-content">
        <ScCard 
          shadow="always" 
          borderPosition="top" 
          padding="16px"
          class="mb-4"
        >
          <template #header>
            <div class="flex items-center">
              <IconifyIconOnline icon="ep:monitor" class="mr-2" />
              <h4 class="device-section-title">选择安装目标</h4>
            </div>
          </template>
          
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
                      shadow="always"
                      borderPosition="left"
                      padding="16px"
                      @click="handleViewInstallLog(device)"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center">
                          <el-checkbox :label="device.id" class="mr-3" @click.stop />
                          <div class="ml-4">
                            <div class="device-ip text-gray-500 text-sm">{{ device.host }}(<span class="device-name">{{ device.name }}</span>)</div>
                            <div v-if="device.isInstalled" class="device-install-info text-xs text-gray-500 mt-1">
                              <span v-if="device.installPath">安装路径: {{ device.installPath }}</span>
                              <span v-if="device.installVersion" class="ml-2">版本: {{ device.installVersion }}</span>
                            </div>
                          </div>
                        </div>
                        <div class="device-status flex items-center">
                          <el-tag size="small" :type="device.status === 1 ? 'success' : 'danger'">
                            {{ device.status === 1 ? '在线' : '离线' }}
                          </el-tag>
                          <el-tag 
                            v-if="device.installStatus == 2" 
                            type="success" 
                            effect="dark"
                            size="small" 
                            class="ml-2"
                          >
                            已安装
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
        </ScCard>
      </div>

      <div class="drawer-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button 
          type="primary" 
          :disabled="!canProceedInstall" 
          v-if="isCurrentVersionInstallable"
          @click="handleInstall" 
          :loading="installing"
          class="install-btn"
        >
          <IconifyIconOnline v-if="!installing" icon="ep:download" class="mr-1" />
          {{ installing ? '安装中...' : '开始安装' }}
        </el-button>
        <el-tooltip v-else content="当前版本不支持安装" placement="top">
          <el-button type="info" disabled>
            <IconifyIconOnline icon="ep:info-filled" class="mr-1" />不可安装
          </el-button>
        </el-tooltip>
      </div>
    </div>
  </el-drawer>
  
  <!-- 安装记录抽屉 -->
  <el-drawer
    v-model="logDrawerVisible"
    title="安装记录"
    size="60%"
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
      <ScCard 
        hoverable 
        shadow="always" 
        borderPosition="left" 
        padding="16px"
        class="mb-4"
      >
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
      </ScCard>
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
import { fetchSoftServiceInstallByServiceId } from '@/api/soft/install'
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

// 设备安装状态接口
interface DeviceInstallStatus {
  installId: string;
  sshId: string;
  softServiceId: number;
  installStatus: number;
  installPath?: string;
  installVersion?: string;
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

// 设备安装状态
const deviceInstallStatus = ref<Record<string, DeviceInstallStatus>>({})

// 安装记录相关
const logDrawerVisible = ref(false)
const logLoading = ref(false)
const installLogs = ref<InstallLog[]>([])
const currentDevice = ref<any>(null)

// 版本相关
const selectedVersionId = ref<number | null>(null)

// 计算属性
const canProceedInstall = computed(() => {
  return selectedDevices.value.length > 0
})

// 判断当前版本是否可安装
const isCurrentVersionInstallable = computed(() => {
  // 如果没有版本信息，默认可安装
  if (!props.software.versions || props.software.versions.length === 0) {
    return true;
  }
  
  // 查找当前版本
  const currentVersion = props.software.versions.find(v => v.isCurrent);
  
  // 如果找不到当前版本，或者当前版本没有明确设置isInstallable为false，则认为可安装
  return !currentVersion || currentVersion.isInstallable !== false;
})

// 获取当前选中的版本信息
const selectedVersion = computed(() => {
  if (!props.software.versions || !selectedVersionId.value) return null
  return props.software.versions.find(v => v.softServiceId === selectedVersionId.value)
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
        hasInstallRecord: false, // 初始化安装记录状态
        isInstalled: false, // 初始化是否已安装标志
        installStatus: null, // 安装状态
        installPath: null, // 安装路径
        installVersion: null, // 安装版本
        installId: null // 安装ID
      }))
      
      // 加载完设备列表后，批量检查安装记录
      checkInstallRecords()
      
      // 如果只有一个设备，默认勾选
      if (deviceList.value.length === 1) {
        selectedDevices.value = [deviceList.value[0].id]
      }
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
      if (res.code === "00000" && res.data) {
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
  
  // 检查软件的安装状态
  await checkSoftwareInstallStatus()
}

// 检查哪些设备已安装当前软件
const checkSoftwareInstallStatus = async () => {
  try {
    if (!props.software.softServiceId) {
      console.warn('软件ID不存在，无法检查安装状态')
      return
    }
    
    const res = await fetchSoftServiceInstallByServiceId({ 
      softServiceId: props.software.softServiceId 
    })
    
    if (res.code === "00000" && res.data) {
      // 清空现有状态
      deviceInstallStatus.value = {}
      
      // 确保数据是数组
      const installRecords = Array.isArray(res.data) ? res.data : [res.data]
      
      // 更新设备安装状态
      installRecords.forEach((record: DeviceInstallStatus) => {
        if (record.sshId) {
          // 保存安装状态
          deviceInstallStatus.value[record.sshId] = record
          
          // 更新设备列表中的安装状态
          const deviceIndex = deviceList.value.findIndex(d => d.id === record.sshId)
          if (deviceIndex > -1) {
            // 添加已安装标记和安装信息
            deviceList.value[deviceIndex].isInstalled = true
            deviceList.value[deviceIndex].installStatus = record.installStatus
            deviceList.value[deviceIndex].installPath = record.installPath
            deviceList.value[deviceIndex].installVersion = record.installVersion
            deviceList.value[deviceIndex].installId = record.installId
          }
        }
      })
    }
  } catch (error) {
    console.error('检查软件安装状态失败:', error)
  }
}

// 处理安装
const handleInstall = () => {
  if (selectedDevices.value.length === 0) {
    message.warning('请至少选择一个设备')
    return
  }
  
  // 使用选中的版本ID
  const actualSoftServiceId = selectedVersionId.value || props.software.softServiceId
  
  if (!actualSoftServiceId) {
    message.error('未找到有效的软件ID')
    return
  }
  
  installing.value = true
  
  // 发送安装请求，确保ID是字符串类型
  emit('install', selectedDevices.value)
}

// 处理取消
const handleCancel = () => {
  installing.value = false;
  emit('cancel')
}

const handleClose = () => {
  installing.value = false;
  handleCancel();
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
    if (res.code === "00000" && res.data) {
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

// 格式化日期
const formatDateDate = (date: Date) => {
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
watch(
  () => drawerVisible.value,
  (visible) => {
    if (visible) {
      // 当抽屉打开时，立即加载设备列表
      loadDeviceList();
      
      // 如果软件有版本信息，默认选择当前版本
      if (props.software.versions && props.software.versions.length > 0) {
        const currentVersion = props.software.versions.find(v => v.isCurrent);
        if (currentVersion) {
          selectedVersionId.value = currentVersion.softServiceId;
        } else {
          selectedVersionId.value = props.software.versions[0].softServiceId;
        }
      } else {
        selectedVersionId.value = props.software.softServiceId || null;
      }
    } else {
      // 当抽屉关闭时，清空选择
      selectedDevices.value = [];
    }
  }
);

// 监听软件信息变化，初始化版本选择
watch(() => props.software, (newSoftware) => {
  if (newSoftware.versions && newSoftware.versions.length > 0) {
    // 查找当前版本
    const currentVersion = newSoftware.versions.find(v => v.isCurrent);
    
    if (currentVersion && currentVersion.isInstallable !== false) {
      // 如果有当前版本且可安装，默认选择当前版本
      selectedVersionId.value = currentVersion.softServiceId;
    } else {
      // 如果当前版本不可安装或不存在，查找第一个可安装的版本
      const installableVersion = newSoftware.versions.find(v => v.isInstallable !== false);
      if (installableVersion) {
        selectedVersionId.value = installableVersion.softServiceId;
      } else {
        // 如果没有可安装的版本，选择第一个版本（即使不可安装）
        selectedVersionId.value = newSoftware.versions[0].softServiceId;
      }
    }
  } else {
    // 如果没有版本信息，使用软件本身的ID
    selectedVersionId.value = newSoftware.softServiceId || null;
  }
}, { immediate: true });

// 组件挂载时初始化
onMounted(() => {
  // 重置安装状态
  installing.value = false;
  
  // 如果抽屉已经是打开状态，立即加载设备列表
  if (drawerVisible.value) {
    loadDeviceList();
  }
});


defineExpose({
  handleCancel,
  deviceList
})
</script>

<style lang="scss" scoped>
.device-selection {
  padding: 0 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.device-selection-content {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

.device-section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--el-text-color-primary);
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
  
  &:hover {
    transform: none; /* 移除可能导致向上偏移的transform效果 */
    border-color: var(--el-color-primary-light-5);
  }
  
  .device-name {
    font-weight: 500;
    font-size: 15px;
    transition: color 0.3s;
  }
  
  .device-ip {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .device-install-info {
    margin-top: 4px;
    line-height: 1.4;
    
    span {
      display: inline-block;
      
      &:not(:last-child) {
        margin-right: 10px;
      }
    }
  }
  
  .device-status {
    .el-tag {
      padding: 0 8px;
    }
  }
}

.drawer-footer {
  margin-top: auto;
  padding: 16px 0;
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

.version-select {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--el-border-color-light);
}

.version-info {
  padding: 8px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
</style> 