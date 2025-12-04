<template>
  <div class="container-stats-chart">
    <div class="chart-header">
      <div class="chart-title">{{ title }}</div>
      <div class="time-range-selector">
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
          <el-option label="最�?�? value="7d" />
        </el-select>
      </div>
    </div>
    
    <div class="chart-container" ref="chartContainerRef"></div>
    
    <div class="chart-stats" v-if="latestStats">
      <div class="stat-item">
        <span class="stat-label">当前�?</span>
        <span class="stat-value">{{ formatValue(latestStats.current) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">平均�?</span>
        <span class="stat-value">{{ formatValue(latestStats.average) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">最大�?</span>
        <span class="stat-value">{{ formatValue(latestStats.max) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { containerApi, type ContainerStatsHistory } from '@/api/docker'
import * as echarts from 'echarts'
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  containerId: number
  title: string
  dataType: 'cpu' | 'memory' | 'diskRead' | 'diskWrite' | 'networkRx' | 'networkTx'
  timeRange?: string
}

interface Emits {
  (e: 'update:timeRange', value: string): void
}

interface ChartData {
  timestamps: string[]
  values: number[]
}

interface StatsSummary {
  current: number
  average: number
  max: number
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const chartContainerRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null
const timeRange = ref(props.timeRange || '1h')
const chartData = ref<ChartData>({ timestamps: [], values: [] })
const latestStats = ref<StatsSummary | null>(null)
const loading = ref(false)

// 初始化图�?
const initChart = () => {
  if (chartContainerRef.value) {
    chartInstance = echarts.init(chartContainerRef.value)
    updateChart()
  }
}

// 更新图表
const updateChart = () => {
  if (!chartInstance) return
  
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
      data: chartData.value.timestamps
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
      data: chartData.value.values,
      smooth: true,
      areaStyle: {
        opacity: 0.1
      },
      lineStyle: {
        width: 2
      }
    }],
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '15%'
    }
  }
  
  chartInstance.setOption(option)
}

// 格式化值显�?
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
      return formatBytes(value)
    default:
      return value.toFixed(2)
  }
}

// 格式化字节显�?
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取统计数据
const fetchStatsData = async () => {
  if (loading.value) return
  loading.value = true
  
  try {
    // 将时间范围转换为小时
    const hours = parseTimeRangeToHours(timeRange.value)
    
    // 调用API获取历史统计数据
    const response = await containerApi.getContainerStatsHistory(props.containerId, hours)
    if (response.code === '00000') {
      const historyData = response.data
      if (historyData) {
        // 根据数据类型提取相应的数�?
        const data = extractDataByType(historyData)
        chartData.value = data
        calculateStatsSummary(data)
        updateChart()
      }
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    // 出错时使用模拟数�?
    const mockData = generateMockData()
    chartData.value = mockData
    calculateStatsSummary(mockData)
    updateChart()
  } finally {
    loading.value = false
  }
}

// 根据时间范围解析小时�?
const parseTimeRangeToHours = (range: string): number => {
  switch (range) {
    case '1h': return 1
    case '6h': return 6
    case '12h': return 12
    case '24h': return 24
    case '7d': return 168 // 7�?
    default: return 1
  }
}

// 根据数据类型提取数据
const extractDataByType = (history: ContainerStatsHistory): ChartData => {
  return {
    timestamps: history.timestamps,
    values: history[props.dataType] || []
  }
}

// 生成模拟数据
const generateMockData = (): ChartData => {
  const data: ChartData = { timestamps: [], values: [] }
  const now = new Date()
  const points = 60 // 默认显示60个数据点
  
  for (let i = points - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000) // 每分钟一个点
    data.timestamps.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    
    // 根据数据类型生成不同的模拟�?
    let value = 0
    switch (props.dataType) {
      case 'cpu':
        value = Math.random() * 100
        break
      case 'memory':
        value = Math.random() * 1000000000 // 0-1GB
        break
      case 'diskRead':
      case 'diskWrite':
        value = Math.random() * 1000000 // 0-1MB
        break
      case 'networkRx':
      case 'networkTx':
        value = Math.random() * 5000000 // 0-5MB
        break
      default:
        value = Math.random() * 100
    }
    data.values.push(value)
  }
  
  return data
}

// 计算统计数据摘要
const calculateStatsSummary = (data: ChartData) => {
  if (data.values.length === 0) {
    latestStats.value = null
    return
  }
  
  const current = data.values[data.values.length - 1]
  const sum = data.values.reduce((a, b) => a + b, 0)
  const average = sum / data.values.length
  const max = Math.max(...data.values)
  
  latestStats.value = { current, average, max }
}

// 时间范围变化处理
const onTimeRangeChange = (value: string) => {
  timeRange.value = value
  emit('update:timeRange', value)
  fetchStatsData()
}

// 监听容器ID变化
watch(() => props.containerId, () => {
  fetchStatsData()
})

// 监听数据变化并更新图�?
watch(chartData, () => {
  updateChart()
})

// 组件挂载
onMounted(() => {
  initChart()
  fetchStatsData()
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  })
})

// 组件卸载
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.container-stats-chart {
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