<template>
  <div class="service-section">
    <!-- 服务区域切换器 -->
    <div class="services-toggle" v-if="activeDevice && deviceServices.length > 0" @click="$emit('toggle-services')">
      <div class="toggle-content">
        <span>设备服务</span>
        <IconifyIconOnline :icon="servicesVisible ? 'ep:arrow-down' : 'ep:arrow-up'" />
      </div>
    </div>
    
    <!-- 服务列表区域 -->
    <el-footer v-if="servicesVisible" height="auto" class="device-services p-4 border-t">
      <div class="section-title mb-4 flex justify-between items-center">
        <div class="flex items-center">
          <IconifyIconOnline icon="ep:service" class="mr-2" />
          设备服务
        </div>
        <el-button type="primary" size="small" @click="$emit('add-service')" :disabled="!activeDevice">
          <IconifyIconOnline icon="ep:plus" class="mr-1" />
          添加服务
        </el-button>
      </div>
      
      <div class="services-table-container">
        <div v-if="deviceServices.length === 0" class="empty-services">
          <el-empty description="暂无服务" :image-size="80">
            <template #description>
              <p>该设备暂无安装服务</p>
            </template>
          </el-empty>
        </div>
        <el-table v-else :data="deviceServices" size="small" style="width: 100%">
          <el-table-column prop="softServiceName" label="软件名称" min-width="120" show-overflow-tooltip />
          <el-table-column prop="sshHost" label="地址"/>
          <el-table-column prop="sshPort" label="端口" width="80" />
          <el-table-column prop="installStatus" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="getServiceStatusType(row.installStatus)" size="small">
                {{ getServiceStatusText(row.installStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <div class="flex gap-1">
                <el-button type="primary" link size="small" @click="$emit('edit-service', row)">
                  <IconifyIconOnline icon="ep:edit" />
                </el-button>
                <el-button type="danger" link size="small" @click="$emit('delete-service', row)">
                  <IconifyIconOnline icon="ep:delete" />
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-footer>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  deviceServices: {
    type: Array,
    default: () => []
  },
  activeDevice: {
    type: String,
    default: ''
  },
  servicesVisible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-services', 'add-service', 'edit-service', 'delete-service'])

// 获取服务状态类型
const getServiceStatusType = (status: number) => {
  switch (status) {
    case 0: return 'info'    // 未运行
    case 1: return 'success' // 运行中
    case 2: return 'danger'  // 已停止
    default: return 'info'
  }
}

// 获取服务状态文本
const getServiceStatusText = (status: number) => {
  switch (status) {
    case 0: return '未运行'
    case 1: return '运行中'
    case 2: return '已停止'
    default: return '未知'
  }
}
</script>

<style lang="scss" scoped>
.services-toggle {
  cursor: pointer;
  text-align: center;
  padding: 6px 0;
  border-top: 1px solid var(--el-border-color-light);
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--el-fill-color-light);
  }
  
  .toggle-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: var(--el-text-color-regular);
    font-size: 12px;
  }
}

.device-services {
  padding: 16px;
  height: auto;
  max-height: 200px;
}

.empty-services {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: var(--el-text-color-secondary);
}
</style> 