<template>
  <div class="container-monitoring-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <IconifyIconOnline icon="ri:dashboard-line" class="title-icon" />
          <span>容器监控</span>
        </div>
        <div class="page-subtitle">实时监控和管理Docker容器</div>
      </div>
    </div>
    
    <!-- 操作工具栏 -->
    <ContainerActionToolbar 
      @create="handleCreateContainer"
      @refresh="handleRefresh"
      @auto-refresh="handleAutoRefresh"
      @export="handleExport"
      @batch-operation="handleBatchOperation"
    />
    
    <!-- 过滤器 -->
    <ContainerFilter 
      :server-options="serverOptions"
      @apply-filter="handleApplyFilter"
      @reset-filter="handleResetFilter"
    />
    
    <!-- 统计概览 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="24">
        <ContainerStatusStats :stats="containerStats" />
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="stats-row">
      <el-col :span="24">
        <MonitoringOverview
          :avg-cpu-usage="overviewStats.avgCpuUsage"
          :avg-memory-usage="overviewStats.avgMemoryUsage"
          :total-containers="overviewStats.totalContainers"
          :running-containers="overviewStats.runningContainers"
        />
      </el-col>
    </el-row>
    
    <!-- 容器列表 -->
    <el-card class="container-list-card">
      <template #header>
        <div class="card-header">
          <span>容器列表</span>
          <div class="card-actions">
            <el-button 
              size="small" 
              @click="handleRefresh"
              :loading="loading"
            >
              <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
              刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <ContainerMonitoringList
        :containers="containerList"
        :loading="loading"
        :pagination="pagination"
        :show-pagination="true"
        @view-detail="handleViewDetail"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>
    
    <!-- 容器详情对话框 -->
    <ContainerDetailDialog
      v-model:visible="detailDialogVisible"
      :container-data="currentContainer"
    />
    
    <!-- 容器日志对话框 -->
    <ContainerLogsDialog
      v-model:visible="logsDialogVisible"
      :container-data="currentContainer"
    />
  </div>
</template>

<script setup lang="ts">
import {
    containerApi,
    getServerList,
    type ContainerStatusStatistics,
    type SystemSoftContainer
} from '@/api/docker'
import { ElMessage } from 'element-plus'
import { onMounted, onUnmounted, reactive, ref } from 'vue'

// 导入组件
import ContainerActionToolbar from './components/ContainerActionToolbar.vue'
import ContainerDetailDialog from './components/ContainerDetailDialog.vue'
import ContainerFilter from './components/ContainerFilter.vue'
import ContainerLogsDialog from './components/ContainerLogsDialog.vue'
import ContainerMonitoringList from './components/ContainerMonitoringList.vue'
import ContainerStatusStats from './components/ContainerStatusStats.vue'
import MonitoringOverview from './components/MonitoringOverview.vue'

// 响应式数据
const loading = ref(false)
const autoRefresh = ref(false)
const containerList = ref<SystemSoftContainer[]>([])
const serverOptions = ref<any[]>([])
const detailDialogVisible = ref(false)
const logsDialogVisible = ref(false)
const currentContainer = ref<SystemSoftContainer | null>(null)
const containerStats = ref<ContainerStatusStatistics>({ total: 0 })

// 搜索参数
const searchParams = reactive({
  name: '',
  image: '',
  status: '',
  serverId: ''
})

// 分页参数
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 概览统计
const overviewStats = reactive({
  avgCpuUsage: 0,
  avgMemoryUsage: 0,
  totalContainers: 0,
  runningContainers: 0
})

// 定时器
let refreshTimer: any = null

// 加载容器列表
const loadContainerList = async () => {
  try {
    loading.value = true
    const params = { 
      ...searchParams, 
      page: pagination.page, 
      pageSize: pagination.pageSize 
    }
    
    // 清理空参数
    Object.keys(params).forEach(key => {
      if (params[key] === '') delete params[key]
    })
    
    const response = await containerApi.getContainerPageList(params)
    if (response.code === '00000') {
      containerList.value = response.data.records || []
      pagination.total = response.data.total || 0
      calculateOverviewStats()
    }
  } catch (error) {
    ElMessage.error('加载容器列表失败')
  } finally {
    loading.value = false
  }
}

// 加载容器状态统计
const loadContainerStats = async () => {
  try {
    const response = await containerApi.getContainerStatusStats()
    if (response.code === '00000') {
      containerStats.value = response.data || { total: 0 }
    }
  } catch (error) {
    console.error('加载容器状态统计失败:', error)
  }
}

// 计算概览统计
const calculateOverviewStats = () => {
  if (containerList.value.length === 0) {
    overviewStats.avgCpuUsage = 0
    overviewStats.avgMemoryUsage = 0
    overviewStats.totalContainers = 0
    overviewStats.runningContainers = 0
    return
  }

  // 计算平均CPU和内存使用率
  const cpuSum = containerList.value.reduce((sum, container) => 
    sum + (container.systemSoftContainerCpuPercent || container.systemSoftContainerCpuUsage || 0), 0)
  
  const memorySum = containerList.value.reduce((sum, container) => 
    sum + (container.systemSoftContainerMemoryPercent || container.systemSoftContainerMemoryUsage || 0), 0)
  
  overviewStats.avgCpuUsage = cpuSum / containerList.value.length
  overviewStats.avgMemoryUsage = memorySum / containerList.value.length
  
  // 计算容器总数和运行中容器数
  overviewStats.totalContainers = containerList.value.length
  overviewStats.runningContainers = containerList.value.filter(
    container => container.systemSoftContainerStatus === 'running'
  ).length
}

// 刷新数据
const handleRefresh = () => {
  loadContainerList()
  loadContainerStats()
}

// 自动刷新
const handleAutoRefresh = (enabled: boolean) => {
  autoRefresh.value = enabled
  if (enabled) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

// 开始自动刷新
const startAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  
  refreshTimer = setInterval(() => {
    if (autoRefresh.value) {
      loadContainerList()
      loadContainerStats()
    }
  }, 5000) // 每5秒刷新一次
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 应用过滤
const handleApplyFilter = (params: any) => {
  Object.assign(searchParams, params)
  pagination.page = 1
  loadContainerList()
}

// 重置过滤
const handleResetFilter = () => {
  Object.assign(searchParams, {
    name: '',
    image: '',
    status: '',
    serverId: ''
  })
  pagination.page = 1
  loadContainerList()
}

// 创建容器
const handleCreateContainer = () => {
  ElMessage.info('创建容器功能待实现')
}

// 导出数据
const handleExport = () => {
  ElMessage.info('导出数据功能待实现')
}

// 批量操作
const handleBatchOperation = (command: string) => {
  switch (command) {
    case 'batchStart':
      ElMessage.info('批量启动功能待实现')
      break
    case 'batchStop':
      ElMessage.info('批量停止功能待实现')
      break
    case 'batchRestart':
      ElMessage.info('批量重启功能待实现')
      break
    case 'batchRemove':
      ElMessage.info('批量删除功能待实现')
      break
    default:
      ElMessage.warning('未知操作')
  }
}

// 查看详情
const handleViewDetail = (container: SystemSoftContainer) => {
  currentContainer.value = container
  detailDialogVisible.value = true
}

// 查看日志
const handleViewLogs = (container: SystemSoftContainer) => {
  currentContainer.value = container
  logsDialogVisible.value = true
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  loadContainerList()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadContainerList()
}

// 加载服务器列表
const loadServers = async () => {
  try {
    const response = await getServerList()
    if (response.code === '00000') {
      serverOptions.value = response.data || []
    }
  } catch (error) {
    console.error('加载服务器列表失败:', error)
  }
}

// 组件挂载
onMounted(() => {
  loadContainerList()
  loadContainerStats()
  loadServers()
})

// 组件卸载
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.container-monitoring-view {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.title-icon {
  margin-right: 8px;
  color: #409eff;
}

.page-subtitle {
  color: #6c757d;
  margin-top: 8px;
  font-size: 14px;
}

.stats-row {
  margin-bottom: 20px;
}

.container-list-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .container-monitoring-view {
    padding: 12px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>