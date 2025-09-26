<template>
  <div class="container-overview">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <IconifyIconOnline icon="ri:dashboard-line" class="title-icon" />
          <span>容器监控总览</span>
        </div>
        <div class="page-subtitle">全面监控和管理Docker容器资源</div>
      </div>
      <div class="header-right">
        <el-button @click="handleRefresh" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
      </div>
    </div>
    
    <!-- 统计概览 -->
    <el-row :gutter="20" class="overview-row">
      <el-col :span="24">
        <ContainerStatusStats :stats="containerStats" />
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="overview-row">
      <el-col :span="24">
        <MonitoringOverview
          :avg-cpu-usage="overviewStats.avgCpuUsage"
          :avg-memory-usage="overviewStats.avgMemoryUsage"
          :total-containers="overviewStats.totalContainers"
          :running-containers="overviewStats.runningContainers"
        />
      </el-col>
    </el-row>
    
    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="content-row">
      <!-- 左侧：容器列表和性能排行榜 -->
      <el-col :span="16">
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span>容器列表</span>
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
        
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span>性能排行榜</span>
            </div>
          </template>
          
          <ContainerPerformanceRanking />
        </el-card>
      </el-col>
      
      <!-- 右侧：告警、主机监控和资源趋势 -->
      <el-col :span="8">
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span>容器告警</span>
            </div>
          </template>
          
          <ContainerAlerts />
        </el-card>
        
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span>主机资源监控</span>
            </div>
          </template>
          
          <ContainerHostMonitor />
        </el-card>
        
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span>资源使用趋势</span>
            </div>
          </template>
          
          <ContainerResourceTrend />
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 容器详情对话框 -->
    <ContainerDetailDialog
      v-model:visible="detailDialogVisible"
      :container-data="currentContainer"
    />
  </div>
</template>

<script setup lang="ts">
import {
    containerApi,
    type ContainerStatusStatistics,
    type SystemSoftContainer
} from '@/api/docker-management'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

// 导入组件
import ContainerAlerts from './components/ContainerAlerts.vue'
import ContainerDetailDialog from './components/ContainerDetailDialog.vue'
import ContainerHostMonitor from './components/ContainerHostMonitor.vue'
import ContainerMonitoringList from './components/ContainerMonitoringList.vue'
import ContainerPerformanceRanking from './components/ContainerPerformanceRanking.vue'
import ContainerResourceTrend from './components/ContainerResourceTrend.vue'
import ContainerStatusStats from './components/ContainerStatusStats.vue'
import MonitoringOverview from './components/MonitoringOverview.vue'

// 响应式数据
const loading = ref(false)
const containerList = ref<SystemSoftContainer[]>([])
const detailDialogVisible = ref(false)
const currentContainer = ref<SystemSoftContainer | null>(null)
const containerStats = ref<ContainerStatusStatistics>({ total: 0 })

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

// 加载容器列表
const loadContainerList = async () => {
  try {
    loading.value = true
    const params = { 
      page: pagination.page, 
      pageSize: pagination.pageSize 
    }
    
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

// 查看详情
const handleViewDetail = (container: SystemSoftContainer) => {
  currentContainer.value = container
  detailDialogVisible.value = true
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

// 组件挂载
onMounted(() => {
  loadContainerList()
  loadContainerStats()
})
</script>

<style scoped>
.container-overview {
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

.overview-row {
  margin-bottom: 20px;
}

.content-row {
  margin-bottom: 20px;
}

.content-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 1200px) {
  .content-row {
    flex-direction: column;
  }
  
  .el-col {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .container-overview {
    padding: 12px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>