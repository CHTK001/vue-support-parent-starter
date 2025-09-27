<template>
  <div class="container-realtime-chart">
    <div class="chart-header">
      <div class="chart-title">{{ title }}</div>
      <div class="chart-controls">
        <el-button 
          size="small" 
          @click="toggleAutoRefresh"
          :type="autoRefresh ? 'success' : 'default'"
        >
          <IconifyIconOnline 
            :icon="autoRefresh ? 'ri:pause-line' : 'ri:play-line'" 
            class="mr-1" 
          />
          {{ autoRefresh ? '暂停' : '开始' }}
        </el-button>
        <el-button size="small" @click="clearData">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清空数据
        </el-button>
      </div>
    </div>
    
    <div class="chart-container" ref="chartContainerRef"></div>
    
    <div class="chart-stats" v-if="latestStats">
      <div class="stat-item">
        <span class="stat-label">当前值:</span>
        <span class="stat-value">{{ formatValue(latestStats.current) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">平均值:</span>
        <span class="stat-value">{{ formatValue(latestStats.average) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">最大值:</span>
        <span class="stat-value">{{ formatValue(latestStats.max) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { containerApi, type ContainerStats } from '@/api/docker-management'
import * as echarts from 'echarts'
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  containerId: number
  title: string
  dataType: 'cpu' | 'memory' | 'diskRead' | 'diskWrite' | 'networkRx' | 'networkTx'
  interval?: number // 刷新间隔（毫秒）
}

interface Emits {
  (e: 'error', error: any): void
}

interface ChartDataPoint {
  timestamp: string
  value: number
}

interface StatsSummary {
  current: number
  average: number
  max: number
}

const props = withDefaults(defineProps<Props>(), {
  interval: 5000 // 默认5秒刷新一次
})

const emit = defineEmits<Emits>()

const chartContainerRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null
const chartData = ref<ChartDataPoint[]>([])
const latestStats = ref<StatsSummary | null>(null)
const autoRefresh = ref(true)
const loading = ref(false)
let refreshTimer: number | null = null

// 初始化图表
const initChart = () => {
  if (chartContainerRef.value) {
    chartInstance = echarts.init(chartContainerRef.value)
    updateChart()
  }
}

// 更新图表
const updateChart = () => {
  if (!chartInstance) return
  
  const timestamps = chartData.value.map(item => item.timestamp)
  const values = chartData.value.map(item => item.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0]
        return `${param.name}<br/>${param.seriesName}: ${formatValue(param.value)}`
      }
    },
    xAxis: {
      type: 'category',
      data: timestamps
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => formatValue(value)
      }
    },
    series: [{
      name: props.title,
      type: 'line',
      data: values,
      smooth: true,
      areaStyle: {
        opacity: 0.1
      },
      lineStyle: {
        width: 2
      },
      showSymbol: false
    }],
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '15%'
    },
    animation: false
  }
  
  chartInstance.setOption(option)
}

// 格式化值显示
const formatValue = (value: number) => {
  switch (props.dataType) {
    case 'cpu':
      return `${value.toFixed(2)}%`
    case 'memory':
      return formatBytes(value)
    case 'diskRead':
    case 'diskWrite':
    case 'networkRx':
    case 'networkTx':
      return formatBytes(value) + '/s'
    default:
      return value.toFixed(2)
  }
}

// 格式化字节显示
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取实时统计数据
const fetchRealtimeStats = async () => {
  if (loading.value || !autoRefresh.value) return
  loading.value = true
  
  try {
    // 调用API获取实时统计数据
    const response = await containerApi.getContainerStats(props.containerId)
    if (response.code === '00000') {
      const stats = response.data
      if (stats) {
        // 根据数据类型提取相应的数据
        const value = extractValueByType(stats)
        const timestamp = new Date().toLocaleTimeString()
        
        // 添加新数据点
        chartData.value.push({
          timestamp,
          value
        })
        
        // 限制数据点数量，最多保留100个点
        if (chartData.value.length > 100) {
          chartData.value.shift()
        }
        
        calculateStatsSummary()
        updateChart()
      }
    } else {
      emit('error', new Error(response.message || '获取统计数据失败'))
    }
  } catch (error) {
    console.error('获取实时统计数据失败:', error)
    emit('error', error)
  } finally {
    loading.value = false
  }
}

// 根据数据类型提取数据
const extractValueByType = (stats: ContainerStats): number => {
  switch (props.dataType) {
    case 'cpu':
      return stats.cpuPercent || stats.cpuUsage || 0
    case 'memory':
      return stats.memoryUsage || 0
    case 'diskRead':
      return stats.diskRead || 0
    case 'diskWrite':
      return stats.diskWrite || 0
    case 'networkRx':
      return stats.networkRx || stats.networkRxBytes || 0
    case 'networkTx':
      return stats.networkTx || stats.networkTxBytes || 0
    default:
      return 0
  }
}

// 计算统计数据摘要
const calculateStatsSummary = () => {
  if (chartData.value.length === 0) {
    latestStats.value = null
    return
  }
  
  const values = chartData.value.map(item => item.value)
  const current = values[values.length - 1]
  const sum = values.reduce((a, b) => a + b, 0)
  const average = sum / values.length
  const max = Math.max(...values)
  
  latestStats.value = { current, average, max }
}

// 开始/暂停自动刷新
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
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
  
  refreshTimer = window.setInterval(() => {
    if (autoRefresh.value) {
      fetchRealtimeStats()
    }
  }, props.interval)
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 清空数据
const clearData = () => {
  chartData.value = []
  latestStats.value = null
  updateChart()
}

// 监听容器ID变化
watch(() => props.containerId, () => {
  clearData()
  fetchRealtimeStats()
})

// 监听数据变化并更新图表
watch(chartData, () => {
  updateChart()
})

// 组件挂载
onMounted(() => {
  initChart()
  fetchRealtimeStats()
  startAutoRefresh()
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  })
})

// 组件卸载
onUnmounted(() => {
  stopAutoRefresh()
  
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.container-realtime-chart {
  display: flex;
  flex-direction: column;
  height: 100%;
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

.chart-controls {
  display: flex;
  gap: 8px;
}

.chart-container {
  flex: 1;
  min-height: 200px;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.chart-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}
</style>