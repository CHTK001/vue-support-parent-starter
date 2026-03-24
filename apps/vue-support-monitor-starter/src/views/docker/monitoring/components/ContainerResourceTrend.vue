<template>
  <div class="container-resource-trend system-container modern-bg">
    <div class="trend-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:line-chart-line" class="header-icon" />
        <span class="header-title">资源使用趋势</span>
      </div>
      <div class="header-right">
        <el-select v-model="timeRange" size="small" @change="handleTimeRangeChange">
          <el-option label="最近1小时" value="1h" />
          <el-option label="最近6小时" value="6h" />
          <el-option label="最近12小时" value="12h" />
          <el-option label="最近24小时" value="24h" />
        </el-select>
      </div>
    </div>
    
    <div class="trend-content">
      <div class="chart-container" ref="chartContainerRef"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  containerId?: number
}

interface ChartData {
  timestamps: string[]
  cpuUsage: number[]
  memoryUsage: number[]
  networkRx: number[]
  networkTx: number[]
}

const props = defineProps<Props>()

const timeRange = ref('1h')
const chartContainerRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

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
  
  // 生成模拟数据
  const data = generateMockData()
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['CPU使用率', '内存使用率', '网络接收', '网络发送']
    },
    xAxis: {
      type: 'category',
      data: data.timestamps
    },
    yAxis: [
      {
        type: 'value',
        name: '使用率(%)',
        position: 'left',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      {
        type: 'value',
        name: '网络(B/s)',
        position: 'right',
        axisLabel: {
          formatter: (value: number) => {
            if (value === 0) return '0 B'
            const k = 1024
            const sizes = ['B', 'KB', 'MB', 'GB']
            const i = Math.floor(Math.log(value) / Math.log(k))
            return parseFloat((value / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
          }
        }
      }
    ],
    series: [
      {
        name: 'CPU使用率',
        type: 'line',
        data: data.cpuUsage,
        smooth: true,
        yAxisIndex: 0
      },
      {
        name: '内存使用率',
        type: 'line',
        data: data.memoryUsage,
        smooth: true,
        yAxisIndex: 0
      },
      {
        name: '网络接收',
        type: 'line',
        data: data.networkRx,
        smooth: true,
        yAxisIndex: 1
      },
      {
        name: '网络发送',
        type: 'line',
        data: data.networkTx,
        smooth: true,
        yAxisIndex: 1
      }
    ],
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '20%'
    }
  }
  
  chartInstance.setOption(option)
}

// 生成模拟数据
const generateMockData = (): ChartData => {
  const data: ChartData = {
    timestamps: [],
    cpuUsage: [],
    memoryUsage: [],
    networkRx: [],
    networkTx: []
  }
  
  const now = new Date()
  const points = timeRange.value === '1h' ? 60 : 
                timeRange.value === '6h' ? 72 : 
                timeRange.value === '12h' ? 72 : 96
  
  const interval = timeRange.value === '1h' ? 1 : 
                  timeRange.value === '6h' ? 5 : 
                  timeRange.value === '12h' ? 10 : 15
  
  for (let i = points - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * interval * 60000)
    data.timestamps.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    
    // 生成模拟数据
    data.cpuUsage.push(20 + Math.random() * 60)
    data.memoryUsage.push(30 + Math.random() * 50)
    data.networkRx.push(Math.random() * 1000000)
    data.networkTx.push(Math.random() * 800000)
  }
  
  return data
}

// 处理时间范围变化
const handleTimeRangeChange = () => {
  updateChart()
}

// 监听数据变化并更新图表
watch(timeRange, () => {
  updateChart()
})

// 组件挂载
onMounted(() => {
  initChart()
  
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

<style scoped lang="scss">

.modern-bg {
  position: relative;
  overflow: hidden;

  /* 渐变背景 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.container-resource-trend {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
  color: #409eff;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.trend-content {
  height: 300px;
}

.chart-container {
  width: 100%;
  height: 100%;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>