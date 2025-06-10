<template>
  <el-drawer v-model="drawerVisible" title="选择安装设备" size="40%" destroy-on-close>
    <div class="device-selection">
      <div class="selected-software">
        <div class="flex items-center gap-4 mb-6">
          <el-image :src="software.softServiceLogo" fit="contain" style="width: 50px; height: 50px" class="software-logo">
            <template #error>
              <div class="app-logo-fallback" style="width: 50px; height: 50px">
                <IconifyIconOnline icon="ep:picture" />
              </div>
            </template>
          </el-image>
          <div>
            <h3 class="text-lg font-medium mb-1">{{ software.softServiceName }}</h3>
            <div class="flex items-center gap-2">
              <el-tag size="small" type="success">v{{ software.softServiceVersion }}</el-tag>
              <el-tag size="small" type="primary">{{ getCategoryName(software.softServiceCategory) }}</el-tag>
            </div>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="mb-4">
        <h4 class="font-medium mb-4 text-lg flex items-center">
          <IconifyIconOnline icon="ep:monitor" class="mr-2" />
          选择安装目标
        </h4>
        <el-alert v-if="selectedDevices.length === 0" title="请选择要安装软件的设备" type="info" :closable="false" show-icon class="mb-4" />
        <el-alert v-else title="将在指定设备上安装软件" type="success" :closable="false" show-icon class="mb-4" />

        <div class="device-list">
          <el-checkbox-group v-model="selectedDevices">
            <div class="grid grid-cols-1 gap-4">
              <el-card v-for="device in deviceList" :key="device.id" class="device-card" :class="{ selected: selectedDevices.includes(device.id) }">
                <div class="flex items-center">
                  <el-checkbox :label="device.id" />
                  <div class="ml-3">
                    <div class="device-name">{{ device.name }}</div>
                    <div class="device-ip text-gray-500 text-sm">{{ device.host }}</div>
                  </div>
                  <div class="device-status ml-auto">
                    <el-tag size="small" :type="device.status === 1 ? 'success' : 'danger'">{{ device.status === 1 ? '在线' : '离线' }}</el-tag>
                  </div>
                </div>
              </el-card>
            </div>
          </el-checkbox-group>
        </div>
      </div>

      <div class="drawer-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :disabled="!canProceedInstall" @click="handleInstall" class="install-btn">
          <IconifyIconOnline icon="ep:download" class="mr-1" />开始安装
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineProps, defineEmits, watch, onMounted } from 'vue'
import { message } from "@repo/utils"
import { machineSshListData } from "@/api/system/assets-ssh"
import type { PartialSoftService } from '@/api/soft'

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
        status: item.status
      }))
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

// 处理安装
const handleInstall = () => {
  if (!canProceedInstall.value) {
    message.warning('请选择要安装的设备')
    return
  }
  
  emit('install', selectedDevices.value)
}

// 处理取消
const handleCancel = () => {
  emit('cancel')
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
  if (drawerVisible.value) {
    loadDeviceList()
  }
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
    border-radius: 8px;
    padding: 16px;
    
    .software-logo {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
  }
}

.device-list {
  margin-top: 20px;
  flex: 1;
  overflow-y: auto;
}

.device-card {
  transition: all 0.3s;
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid transparent;
  
  &.selected {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    
    .device-name {
      color: var(--el-color-primary);
    }
  }
  
  &:hover {
    border-color: var(--el-color-primary-light-3);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  .device-name {
    font-weight: 500;
    font-size: 15px;
    transition: color 0.3s;
  }
  
  .device-ip {
    margin-top: 4px;
  }
  
  .device-status {
    .el-tag {
      padding: 0 8px;
    }
  }
}

.drawer-footer {
  margin-top: 20px;
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
  border-radius: 8px;
  
  .iconify {
    font-size: 24px;
  }
}
</style> 