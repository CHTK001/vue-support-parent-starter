<template>
  <div class="container-resource-overview">
    <div class="overview-header">
      <div class="header-title">资源使用概览</div>
      <div class="header-actions">
        <el-button size="small" @click="refreshData" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
      </div>
    </div>
    
    <div class="overview-content">
      <div class="resource-grid">
        <!-- CPU使用�?-->
        <div class="resource-card cpu">
          <div class="card-header">
            <IconifyIconOnline icon="ri:cpu-line" class="card-icon" />
            <div class="card-title">CPU使用�?/div>
          </div>
          <div class="card-content">
            <el-progress
              type="circle"
              :percentage="cpuUsage"
              :color="getUsageColor(cpuUsage)"
              :width="100"
            />
            <div class="usage-text">{{ cpuUsage.toFixed(2) }}%</div>
          </div>
        </div>
        
        <!-- 内存使用�?-->
        <div class="resource-card memory">
          <div class="card-header">
            <IconifyIconOnline icon="ri:database-2-line" class="card-icon" />
            <div class="card-title">内存使用�?/div>
          </div>
          <div class="card-content">
            <el-progress
              type="circle"
              :percentage="memoryUsage"
              :color="getUsageColor(memoryUsage)"
              :width="100"
            />
            <div class="usage-text">{{ memoryUsage.toFixed(2) }}%</div>
          </div>
        </div>
        
        <!-- 磁盘IO -->
        <div class="resource-card disk">
          <div class="card-header">
            <IconifyIconOnline icon="ri:hard-drive-line" class="card-icon" />
            <div class="card-title">磁盘IO</div>
          </div>
          <div class="card-content">
            <div class="io-stats">
              <div class="io-item">
                <div class="io-label">读取</div>
                <div class="io-value">{{ formatBytes(diskRead) }}/s</div>
              </div>
              <div class="io-item">
                <div class="io-label">写入</div>
                <div class="io-value">{{ formatBytes(diskWrite) }}/s</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 网络IO -->
        <div class="resource-card network">
          <div class="card-header">
            <IconifyIconOnline icon="ri:network-line" class="card-icon" />
            <div class="card-title">网络IO</div>
          </div>
          <div class="card-content">
            <div class="io-stats">
              <div class="io-item">
                <div class="io-label">接收</div>
                <div class="io-value">{{ formatBytes(networkRx) }}/s</div>
              </div>
              <div class="io-item">
                <div class="io-label">发�?/div>
                <div class="io-value">{{ formatBytes(networkTx) }}/s</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 资源使用趋势�?-->
      <div class="trend-chart">
        <div class="chart-header">
          <div class="chart-title">资源使用趋势</div>
          <div class="time-selector">
            <el-select 
              v-model="timeRange" 
              size="small" 
              @change="onTimeRangeChange"
              style="width: 120px"
            >
              <el-option label="最�?小时" value="1h" />
              <el-option label="最�?小时" value="6h" />
              <el-option label="最�?2小时" value="12h" />
              <el-option label="最�?4小时" value="24h" />
            </el-select>
          </div>
        </div>
        <div class="chart-container" ref="trendChartContainerRef"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { containerApi } from '@/api/docker'
import * as echarts from 'echarts'
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  containerId: number
}

interface ChartData {
  timestamps: string[]
  cpuUsage: number[]
  memoryUsage: number[]
}

const props = defineProps<Props>()

const loading = ref(false)
const timeRange = ref('1h')
const cpuUsage = ref(0)
const memoryUsage = ref(0)
const diskRead = ref(0)
const diskWrite = ref(0)
const networkRx = ref(0)
const networkTx = ref(0)

const trendChartContainerRef = ref<HTMLElement>()
let trendChartInstance: echarts.ECharts | null = null

// 初始化趋势图
const initTrendChart = () => {
  if (trendChartContainerRef.value) {
    trendChartInstance = echarts.init(trendChartContainerRef.value)
    updateTrendChart()
  }
}

// 更新趋势�?
const updateTrendChart = () => {
  if (!trendChartInstance) return
  
  // 这里使用模拟数据，实际应用中应该从API获取历史数据
  const timestamps = []
  const cpuData = []
  const memoryData = []
  
  const now = new Date()
  for (let i = 59; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000)
    timestamps.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    cpuData.push(Math.random() * 100)
    memoryData.push(Math.random() * 100)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['CPU使用�?, '内存使用�?]
    },
    xAxis: {
      type: 'category',
      data: timestamps
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: 'CPU使用�?,
        type: 'line',
        data: cpuData,
        smooth: true,
        lineStyle: {
          color: '#409eff'
        }
      },
      {
        name: '内存使用�?,
        type: 'line',
        data: memoryData,
        smooth: true,
        lineStyle: {
          color: '#67c23a'
        }
      }
    ],
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '20%'
    }
  }
  
  trendChartInstance.setOption(option)
}

// 获取容器资源使用数据
const fetchResourceData = async () => {
  if (loading.value) return
  loading.value = true
  
  try {
    // 获取实时统计数据
    const response = await containerApi.getContainerStats(props.containerId)
    if (response.code === '00000') {
      const stats = response.data
      if (stats) {
        cpuUsage.value = stats.cpuPercent || stats.cpuUsage || 0
        memoryUsage.value = stats.memoryPercent || stats.memoryUsage || 0
        diskRead.value = stats.diskRead || 0
        diskWrite.value = stats.diskWrite || 0
        networkRx.value = stats.networkRx || stats.networkRxBytes || 0
        networkTx.value = stats.networkTx || stats.networkTxBytes || 0
      }
    }
  } catch (error) {
    console.error('获取容器资源数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  fetchResourceData()
}

// 根据使用率获取颜�?
const getUsageColor = (percentage: number) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

// 格式化字节显�?
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 时间范围变化处理
const onTimeRangeChange = (value: string) => {
  timeRange.value = value
  // 这里可以重新获取历史数据并更新图�?
  updateTrendChart()
}

// 监听容器ID变化
watch(() => props.containerId, () => {
  fetchResourceData()
})

// 组件挂载
onMounted(() => {
  initTrendChart()
  fetchResourceData()
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', () => {
    if (trendChartInstance) {
      trendChartInstance.resize()
    }
  })
})

// 组件卸载
onUnmounted(() => {
  if (trendChartInstance) {
    trendChartInstance.dispose()
    trendChartInstance = null
  }
})
</script>

<style scoped>
.container-resource-overview {
  padding: 20px;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.resource-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.card-icon {
  font-size: 20px;
  margin-right: 8px;
}

.cpu .card-icon {
  color: #409eff;
}

.memory .card-icon {
  color: #67c23a;
}

.disk .card-icon {
  color: #e6a23c;
}

.network .card-icon {
  color: #f56c6c;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.card-content {
  text-align: center;
}

.usage-text {
  margin-top: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.io-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.io-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.io-label {
  font-size: 14px;
  color: #606266;
}

.io-value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.trend-chart {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  height: 300px;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

@media (max-width: 768px) {
  .resource-grid {
    grid-template-columns: 1fr;
  }
  
  .container-resource-overview {
    padding: 12px;
  }
}
</style>