<template>
  <div class="container-monitoring">
    <!-- 现代化页面头部 -->
    <div class="modern-header">
      <div class="header-content">
        <div class="header-info">
          <div class="icon-wrapper">
            <IconifyIconOnline icon="ri:dashboard-line" class="header-icon" />
          </div>
          <div class="title-wrapper">
            <h1 class="page-title">容器监控</h1>
            <p class="page-subtitle">实时监控容器资源使用情况</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button @click="handleRefresh" :loading="loading" class="action-btn">
            <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
            刷新
          </el-button>
          <el-button type="success" @click="handleAutoRefresh" class="action-btn">
            <IconifyIconOnline 
              :icon="autoRefresh ? 'ri:pause-line' : 'ri:play-line'" 
              class="mr-1" 
            />
            {{ autoRefresh ? '暂停' : '自动刷新' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar-section">
      <div class="toolbar-left">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索容器名称或镜像"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select
          v-model="searchParams.status"
          placeholder="运行状态"
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="运行中" value="running" />
          <el-option label="已停止" value="stopped" />
          <el-option label="暂停" value="paused" />
          <el-option label="重启中" value="restarting" />
          <el-option label="错误" value="error" />
        </el-select>
        <el-select
          v-model="searchParams.serverId"
          placeholder="服务器"
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option
            v-for="server in serverOptions"
            :key="server.id"
            :label="server.name"
            :value="server.id"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <IconifyIconOnline icon="ri:search-line" class="mr-1" />
          搜索
        </el-button>
      </div>
    </div>

    <!-- 容器状态统计 -->
    <el-card>
      <ContainerStatusStatsComponent :stats="containerStats" />
    </el-card>

    <!-- 监控概览 -->
    <el-card>
      <MonitoringOverview
        :avg-cpu-usage="overviewStats.avgCpuUsage"
        :avg-memory-usage="overviewStats.avgMemoryUsage"
        :total-containers="overviewStats.totalContainers"
        :running-containers="overviewStats.runningContainers"
      />
    </el-card>

    <!-- 容器监控列表 -->
    <el-card class="monitoring-table-card">
      <ContainerMonitoringList
        :url="containerApi.getContainerPageList"
        :params="{ ...searchParams, page: pagination.page, pageSize: pagination.pageSize }"
        :loading="loading"
        :pagination="pagination"
        :show-pagination="true"
        @view-detail="viewContainerDetail"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 容器详情对话框 -->
    <ContainerDetailDialog
      v-model:visible="detailDialogVisible"
      :container-data="currentContainer"
    />
  </div>
</template>

<script setup lang="ts">
import { containerApi, getServerList, type ContainerStatusStatistics, type SystemSoftContainer } from '@/api/docker'
import { message } from "@repo/utils";
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import ContainerDetailDialog from '../containers/components/ContainerDetailDialog.vue'
import ContainerMonitoringList from './components/ContainerMonitoringList.vue'
import ContainerStatusStatsComponent from './components/ContainerStatusStats.vue'
import MonitoringOverview from './components/MonitoringOverview.vue'

// 响应式数据
const loading = ref(false)
const autoRefresh = ref(false)
const monitoringList = ref<SystemSoftContainer[]>([])
const serverOptions = ref<any[]>([])
const detailDialogVisible = ref(false)
const currentContainer = ref<SystemSoftContainer | null>(null)
const containerStats = ref<ContainerStatusStatistics>({ total: 0 })

// 搜索参数
const searchParams = reactive({
  keyword: '',
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

// 基础方法
const loadMonitoringData = async () => {
  try {
    loading.value = true
    const params = { ...searchParams, page: pagination.page, pageSize: pagination.pageSize }
    Object.keys(params).forEach(key => {
      if (params[key] === '') delete params[key]
    })
    
    const response = await containerApi.getContainerPageList(params)
    if (response.code === '00000') {
      monitoringList.value = response.data.records || []
      pagination.total = response.data.total || 0
      calculateOverviewStats()
    }
  } catch (error) {
    message('加载监控数据失败', { type: "error" })
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

const calculateOverviewStats = () => {
  if (monitoringList.value.length === 0) {
    overviewStats.avgCpuUsage = 0
    overviewStats.avgMemoryUsage = 0
    overviewStats.totalContainers = 0
    overviewStats.runningContainers = 0
    return
  }

  // 计算平均CPU和内存使用率
  const cpuSum = monitoringList.value.reduce((sum, container) => 
    sum + (container.systemSoftContainerCpuPercent || container.systemSoftContainerCpuUsage || 0), 0)
  
  const memorySum = monitoringList.value.reduce((sum, container) => 
    sum + (container.systemSoftContainerMemoryPercent || container.systemSoftContainerMemoryUsage || 0), 0)
  
  overviewStats.avgCpuUsage = cpuSum / monitoringList.value.length
  overviewStats.avgMemoryUsage = memorySum / monitoringList.value.length
  
  // 计算容器总数和运行中容器数
  overviewStats.totalContainers = monitoringList.value.length
  overviewStats.runningContainers = monitoringList.value.filter(
    container => container.systemSoftContainerStatus === 'running'
  ).length
}

const handleRefresh = () => {
  loadMonitoringData()
  loadContainerStats()
}

const handleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  
  refreshTimer = setInterval(() => {
    if (autoRefresh.value) {
      loadMonitoringData()
      loadContainerStats()
    }
  }, 5000) // 每5秒刷新一次
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const handleSearch = () => { pagination.page = 1; loadMonitoringData() }

// 容器操作
const viewContainerDetail = (container: SystemSoftContainer) => {
  currentContainer.value = container
  detailDialogVisible.value = true
}

// 分页处理
const handleSizeChange = (size: number) => { pagination.pageSize = size; loadMonitoringData() }
const handleCurrentChange = (page: number) => { pagination.page = page; loadMonitoringData() }

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
  loadMonitoringData()
  loadContainerStats()
  loadServers()
})

// 组件卸载
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped lang="scss">
.container-monitoring {
  padding: 0;
  background: var(--app-bg-secondary);
  min-height: 100vh;
}

// 现代化头部
.modern-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 28px 32px;
  color: #fff;
  margin-bottom: 0;

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1600px;
    margin: 0 auto;
  }

  .header-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .icon-wrapper {
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);

    .header-icon {
      font-size: 28px;
      color: #fff;
    }
  }

  .title-wrapper {
    .page-title {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 4px 0;
      letter-spacing: -0.5px;
    }

    .page-subtitle {
      font-size: 14px;
      opacity: 0.85;
      margin: 0;
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;

    .action-btn {
      border-radius: 10px;
      padding: 10px 18px;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }
    }
  }
}

// 工具栏
.toolbar-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .search-input {
    width: 280px;

    :deep(.el-input__wrapper) {
      border-radius: 10px;
    }
  }

  .filter-select {
    width: 140px;

    :deep(.el-input__wrapper) {
      border-radius: 10px;
    }
  }
}

// 卡片区域
:deep(.el-card) {
  margin: 16px 32px;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

// 监控表格
.monitoring-table-card {
  margin: 16px 32px 32px;
}

// 响应式设计
@media (max-width: 1200px) {
  .toolbar-section .toolbar-left {
    .search-input {
      width: 220px;
    }
    
    .filter-select {
      width: 120px;
    }
  }
}

@media (max-width: 768px) {
  .modern-header {
    padding: 20px;

    .header-content {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
    }

    .header-actions {
      width: 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
    }
  }

  .toolbar-section {
    padding: 16px;

    .toolbar-left {
      flex-direction: column;
      width: 100%;

      .search-input,
      .filter-select {
        width: 100%;
      }
    }
  }

  :deep(.el-card) {
    margin: 12px 16px;
  }

  .monitoring-table-card {
    margin: 12px 16px 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-left {
    flex-direction: column;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
  
  .header-right {
    flex-direction: column;
    width: 100%;
  }
}
</style>