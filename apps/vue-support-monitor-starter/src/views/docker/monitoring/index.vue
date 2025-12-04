<template>
  <div class="container-monitoring">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <IconifyIconOnline icon="ri:dashboard-line" class="title-icon" />
          <span>容器监控</span>
        </div>
        <div class="page-subtitle">实时监控容器资源使用情况</div>
      </div>
      <div class="header-right">
        <el-button @click="handleRefresh" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="success" @click="handleAutoRefresh">
          <IconifyIconOnline 
            :icon="autoRefresh ? 'ri:pause-line' : 'ri:play-line'" 
            class="mr-1" 
          />
          {{ autoRefresh ? '暂停' : '自动刷新' }}
        </el-button>
      </div>
    </div>

    <!-- 搜索�?-->
    <div class="search-bar">
      <div class="search-left">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索容器名称或镜�?
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
          placeholder="运行状�?
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="运行�? value="running" />
          <el-option label="已停�? value="stopped" />
          <el-option label="暂停" value="paused" />
          <el-option label="重启�? value="restarting" />
          <el-option label="错误" value="error" />
        </el-select>
        <el-select
          v-model="searchParams.serverId"
          placeholder="服务�?
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
      </div>
    </div>

    <!-- 容器状态统�?-->
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

    <!-- 容器详情对话�?-->
    <ContainerDetailDialog
      v-model:visible="detailDialogVisible"
      :container-data="currentContainer"
    />
  </div>
</template>

<script setup lang="ts">
import { containerApi, getServerList, type ContainerStatusStatistics, type SystemSoftContainer } from '@/api/docker'
import { ElMessage } from 'element-plus'
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import ContainerDetailDialog from '../containers/components/ContainerDetailDialog.vue'
import ContainerMonitoringList from './components/ContainerMonitoringList.vue'
import ContainerStatusStatsComponent from './components/ContainerStatusStats.vue'
import MonitoringOverview from './components/MonitoringOverview.vue'

// 响应式数�?
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

// 定时�?
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
    ElMessage.error('加载监控数据失败')
  } finally {
    loading.value = false
  }
}

// 加载容器状态统�?
const loadContainerStats = async () => {
  try {
    const response = await containerApi.getContainerStatusStats()
    if (response.code === '00000') {
      containerStats.value = response.data || { total: 0 }
    }
  } catch (error) {
    console.error('加载容器状态统计失�?', error)
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
  
  // 计算容器总数和运行中容器�?
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
  }, 5000) // �?秒刷新一�?
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

// 加载服务器列�?
const loadServers = async () => {
  try {
    const response = await getServerList()
    if (response.code === '00000') {
      serverOptions.value = response.data || []
    }
  } catch (error) {
    console.error('加载服务器列表失�?', error)
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

<style scoped>
.container-monitoring {
  padding: 20px;
  background: var(--app-bg-secondary);
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: var(--app-card-bg);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.title-icon {
  margin-right: 8px;
  color: var(--app-primary);
}

.page-subtitle {
  color: var(--app-text-secondary);
  margin-top: 8px;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--app-card-bg);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
}

.search-left {
  display: flex;
  gap: 12px;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 140px;
}

/* 监控表格 */
.monitoring-table-card {
  background: var(--app-card-bg);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
}

/* 响应式设�?*/
@media (max-width: 1200px) {
  .search-left {
    flex-wrap: wrap;
  }
  
  .search-input {
    width: 240px;
  }
  
  .filter-select {
    width: 120px;
  }
}

@media (max-width: 768px) {
  .container-monitoring {
    padding: 12px;
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