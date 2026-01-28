<template>
  <div class="container-dashboard system-container modern-bg">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <IconifyIconOnline icon="ri:dashboard-line" class="title-icon" />
                容器监控概览
              </span>
              <el-button @click="handleRefresh" :loading="loading" size="small">
                <IconifyIconOnline icon="ri:refresh-line" />
              </el-button>
            </div>
          </template>
          
          <div class="dashboard-content">
            <!-- 关键指标 -->
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-icon cpu">
                  <IconifyIconOnline icon="ri:cpu-line" />
                </div>
                <div class="metric-content">
                  <div class="metric-value">{{ formatPercent(avgCpuUsage) }}</div>
                  <div class="metric-label">平均CPU使用率</div>
                </div>
              </div>
              
              <div class="metric-card">
                <div class="metric-icon memory">
                  <IconifyIconOnline icon="ri:database-2-line" />
                </div>
                <div class="metric-content">
                  <div class="metric-value">{{ formatPercent(avgMemoryUsage) }}</div>
                  <div class="metric-label">平均内存使用率</div>
                </div>
              </div>
              
              <div class="metric-card">
                <div class="metric-icon container">
                  <IconifyIconOnline icon="ri:container-line" />
                </div>
                <div class="metric-content">
                  <div class="metric-value">{{ totalContainers }}</div>
                  <div class="metric-label">总容器数</div>
                </div>
              </div>
              
              <div class="metric-card">
                <div class="metric-icon running">
                  <IconifyIconOnline icon="ri:play-circle-line" />
                </div>
                <div class="metric-content">
                  <div class="metric-value">{{ runningContainers }}</div>
                  <div class="metric-label">运行中容器</div>
                </div>
              </div>
            </div>
            
            <!-- 容器状态分布 -->
            <div class="status-distribution">
              <div class="chart-container">
                <div ref="chartContainerRef" class="chart"></div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { containerApi } from '@/api/docker'
import * as echarts from 'echarts'
import { onMounted, onUnmounted, ref } from 'vue'

// 响应式数据
const loading = ref(false)
const chartContainerRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 指标数据
const avgCpuUsage = ref(0)
const avgMemoryUsage = ref(0)
const totalContainers = ref(0)
const runningContainers = ref(0)

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
  
  const option = {
    title: {
      text: '容器状态分布',
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '容器状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: runningContainers.value, name: '运行中', itemStyle: { color: '#67c23a' } },
          { value: totalContainers.value - runningContainers.value, name: '其他状态', itemStyle: { color: '#909399' } }
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
    
    // 获取容器状态统计
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


.container-dashboard {
  margin-bottom: 20px;
}

.dashboard-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.title-icon {
  margin-right: 8px;
  color: #409eff;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  font-size: 24px;
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

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  color: #909399;
}

.status-distribution {
  padding: 20px 0;
}

.chart-container {
  height: 200px;
}

.chart {
  width: 100%;
  height: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>