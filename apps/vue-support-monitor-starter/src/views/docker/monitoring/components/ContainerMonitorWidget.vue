<template>
  <div class="container-monitor-widget">
    <div class="widget-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:dashboard-line" class="header-icon" />
        <span class="header-title">容器监控</span>
      </div>
      <div class="header-right">
        <el-button @click="handleRefresh" :loading="loading" size="small" circle>
          <IconifyIconOnline icon="ri:refresh-line" />
        </el-button>
      </div>
    </div>
    
    <div class="widget-content">
      <!-- 关键指标 -->
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-icon cpu">
            <IconifyIconOnline icon="ri:cpu-line" />
          </div>
          <div class="metric-info">
            <div class="metric-value">{{ formatPercent(avgCpuUsage) }}</div>
            <div class="metric-label">CPU使用�?/div>
          </div>
        </div>
        
        <div class="metric-item">
          <div class="metric-icon memory">
            <IconifyIconOnline icon="ri:database-2-line" />
          </div>
          <div class="metric-info">
            <div class="metric-value">{{ formatPercent(avgMemoryUsage) }}</div>
            <div class="metric-label">内存使用�?/div>
          </div>
        </div>
        
        <div class="metric-item">
          <div class="metric-icon container">
            <IconifyIconOnline icon="ri:container-line" />
          </div>
          <div class="metric-info">
            <div class="metric-value">{{ totalContainers }}</div>
            <div class="metric-label">总容器数</div>
          </div>
        </div>
        
        <div class="metric-item">
          <div class="metric-icon running">
            <IconifyIconOnline icon="ri:play-circle-line" />
          </div>
          <div class="metric-info">
            <div class="metric-value">{{ runningContainers }}</div>
            <div class="metric-label">运行�?/div>
          </div>
        </div>
      </div>
      
      <!-- 容器状态分�?-->
      <div class="status-chart">
        <div ref="chartContainerRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { containerApi } from '@/api/docker'
import * as echarts from 'echarts'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

// 响应式数�?
const loading = ref(false)
const chartContainerRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 指标数据
const avgCpuUsage = ref(0)
const avgMemoryUsage = ref(0)
const totalContainers = ref(0)
const runningContainers = ref(0)

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
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [
      {
        name: '容器状�?,
        type: 'pie',
        radius: ['60%', '90%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 5,
          borderColor: '#fff',
          borderWidth: 1
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '12',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: runningContainers.value, name: '运行�?, itemStyle: { color: '#67c23a' } },
          { value: totalContainers.value - runningContainers.value, name: '其他状�?, itemStyle: { color: '#909399' } }
        ]
      }
    ]
  }
  
  chartInstance.setOption(option)
}

// 加载数据
const loadData = async () => {
  try {
    loading.value = true
    
    // 获取容器状态统�?
    const statsResponse = await containerApi.getContainerStatusStats()
    if (statsResponse.code === '00000') {
      const stats = statsResponse.data || { total: 0, running: 0 }
      totalContainers.value = stats.total || 0
      runningContainers.value = stats.running || 0
    }
    
    // 获取容器列表以计算平均资源使用率
    const listResponse = await containerApi.getContainerPageList({ page: 1, pageSize: 1000 })
    if (listResponse.code === '00000') {
      const containers = listResponse.data.records || []
      
      // 计算平均CPU和内存使用率
      if (containers.length > 0) {
        const cpuSum = containers.reduce((sum, container) => 
          sum + (container.systemSoftContainerCpuPercent || container.systemSoftContainerCpuUsage || 0), 0)
        
        const memorySum = containers.reduce((sum, container) => 
          sum + (container.systemSoftContainerMemoryPercent || container.systemSoftContainerMemoryUsage || 0), 0)
        
        avgCpuUsage.value = cpuSum / containers.length
        avgMemoryUsage.value = memorySum / containers.length
      } else {
        avgCpuUsage.value = 0
        avgMemoryUsage.value = 0
      }
    }
    
    // 更新图表
    await nextTick()
    updateChart()
  } catch (error) {
    console.error('加载容器监控数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 刷新数据
const handleRefresh = () => {
  loadData()
}

// 格式化百分比
const formatPercent = (value: number) => `${value.toFixed(1)}%`

// 组件挂载
onMounted(() => {
  initChart()
  loadData()
  
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
.container-monitor-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
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
  color: var(--el-text-color-primary);
}

.widget-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
}

.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: 20px;
  color: white;
}

.metric-icon.cpu {
  background: linear-gradient(135deg, #409eff, #79bbff);
}

.metric-icon.memory {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.metric-icon.container {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
}

.metric-icon.running {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 2px;
}

.metric-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.status-chart {
  flex: 1;
  min-height: 150px;
}

.chart-container {
  width: 100%;
  height: 100%;
}
</style>