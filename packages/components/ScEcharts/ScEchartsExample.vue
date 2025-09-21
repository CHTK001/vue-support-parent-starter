<template>
  <div class="sc-echarts-example">
    <div class="example-header">
      <h2>ScEcharts 图表组件示例</h2>
      <p>基于 ECharts 的 Vue 图表组件，支持响应式布局和主题定制</p>
    </div>

    <!-- 基础柱状图 -->
    <div class="example-section">
      <h3>基础柱状图</h3>
      <p>最基本的柱状图示例</p>
      <div class="example-demo">
        <div class="chart-container">
          <ScEcharts :option="barOption" height="400px" />
        </div>
        <div class="chart-controls">
          <el-button @click="updateBarData">更新数据</el-button>
          <el-button @click="toggleBarAnimation">{{ barOption.animation ? '关闭' : '开启' }}动画</el-button>
        </div>
      </div>
    </div>

    <!-- 折线图 -->
    <div class="example-section">
      <h3>折线图</h3>
      <p>多系列折线图示例</p>
      <div class="example-demo">
        <div class="chart-container">
          <ScEcharts :option="lineOption" height="400px" />
        </div>
        <div class="chart-controls">
          <el-button @click="addLineSeries">添加系列</el-button>
          <el-button @click="removeLineSeries">移除系列</el-button>
          <el-button @click="toggleLineSmooth">{{ lineOption.series[0].smooth ? '关闭' : '开启' }}平滑</el-button>
        </div>
      </div>
    </div>

    <!-- 饼图 -->
    <div class="example-section">
      <h3>饼图</h3>
      <p>带标签的饼图示例</p>
      <div class="example-demo">
        <div class="chart-container">
          <ScEcharts :option="pieOption" height="400px" />
        </div>
        <div class="chart-controls">
          <el-button @click="updatePieData">更新数据</el-button>
          <el-button @click="togglePieRose">{{ pieOption.series[0].roseType ? '关闭' : '开启' }}玫瑰图</el-button>
        </div>
      </div>
    </div>

    <!-- 散点图 -->
    <div class="example-section">
      <h3>散点图</h3>
      <p>气泡散点图示例</p>
      <div class="example-demo">
        <div class="chart-container">
          <ScEcharts :option="scatterOption" height="400px" />
        </div>
        <div class="chart-controls">
          <el-button @click="generateScatterData">生成新数据</el-button>
          <el-button @click="toggleScatterSymbol">切换符号</el-button>
        </div>
      </div>
    </div>

    <!-- 雷达图 -->
    <div class="example-section">
      <h3>雷达图</h3>
      <p>多维数据雷达图示例</p>
      <div class="example-demo">
        <div class="chart-container">
          <ScEcharts :option="radarOption" height="400px" />
        </div>
        <div class="chart-controls">
          <el-button @click="updateRadarData">更新数据</el-button>
          <el-button @click="toggleRadarArea">{{ radarOption.series[0].areaStyle ? '关闭' : '开启' }}区域填充</el-button>
        </div>
      </div>
    </div>

    <!-- 仪表盘 -->
    <div class="example-section">
      <h3>仪表盘</h3>
      <p>动态仪表盘示例</p>
      <div class="example-demo">
        <div class="chart-container">
          <ScEcharts :option="gaugeOption" height="400px" />
        </div>
        <div class="chart-controls">
          <el-button @click="startGaugeAnimation">{{ gaugeAnimating ? '停止' : '开始' }}动画</el-button>
          <el-button @click="setGaugeValue">设置随机值</el-button>
        </div>
      </div>
    </div>

    <!-- 热力图 -->
    <div class="example-section">
      <h3>热力图</h3>
      <p>日历热力图示例</p>
      <div class="example-demo">
        <div class="chart-container">
          <ScEcharts :option="heatmapOption" height="400px" />
        </div>
        <div class="chart-controls">
          <el-button @click="generateHeatmapData">生成新数据</el-button>
          <el-button @click="changeHeatmapYear">切换年份</el-button>
        </div>
      </div>
    </div>

    <!-- 组合图表 -->
    <div class="example-section">
      <h3>组合图表</h3>
      <p>柱状图与折线图组合</p>
      <div class="example-demo">
        <div class="chart-container">
          <ScEcharts :option="mixedOption" height="400px" />
        </div>
        <div class="chart-controls">
          <el-button @click="updateMixedData">更新数据</el-button>
          <el-button @click="toggleMixedDataZoom">{{ mixedOption.dataZoom ? '关闭' : '开启' }}数据缩放</el-button>
        </div>
      </div>
    </div>

    <!-- 响应式示例 -->
    <div class="example-section">
      <h3>响应式图表</h3>
      <p>自适应容器大小的图表</p>
      <div class="example-demo">
        <div class="responsive-container" :style="{ width: containerWidth + 'px', height: containerHeight + 'px' }">
          <ScEcharts :option="responsiveOption" width="100%" height="100%" />
        </div>
        <div class="chart-controls">
          <el-slider v-model="containerWidth" :min="300" :max="800" show-input style="margin-bottom: 20px;">
            <template #prepend>宽度:</template>
          </el-slider>
          <el-slider v-model="containerHeight" :min="200" :max="500" show-input>
            <template #prepend>高度:</template>
          </el-slider>
        </div>
      </div>
    </div>

    <!-- 事件日志 -->
    <div class="example-section">
      <h3>事件日志</h3>
      <div class="event-log">
        <div v-for="(log, index) in eventLogs" :key="index" class="log-item">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-event">{{ log.event }}</span>
          <span class="log-detail">{{ log.detail }}</span>
        </div>
      </div>
    </div>

    <!-- API 文档 -->
    <div class="example-section">
      <h3>API 文档</h3>
      <div class="api-table">
        <h4>Props</h4>
        <table>
          <thead>
            <tr>
              <th>参数</th>
              <th>说明</th>
              <th>类型</th>
              <th>可选值</th>
              <th>默认值</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>option</td>
              <td>ECharts 配置项</td>
              <td>object</td>
              <td>—</td>
              <td>{}</td>
            </tr>
            <tr>
              <td>width</td>
              <td>图表宽度</td>
              <td>string</td>
              <td>—</td>
              <td>100%</td>
            </tr>
            <tr>
              <td>height</td>
              <td>图表高度</td>
              <td>string</td>
              <td>—</td>
              <td>100%</td>
            </tr>
            <tr>
              <td>nodata</td>
              <td>是否显示无数据状态</td>
              <td>boolean</td>
              <td>—</td>
              <td>false</td>
            </tr>
          </tbody>
        </table>

        <h4>Methods</h4>
        <table>
          <thead>
            <tr>
              <th>方法名</th>
              <th>说明</th>
              <th>参数</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>draw</td>
              <td>重新绘制图表</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>

        <h4>特性</h4>
        <ul>
          <li>自动响应窗口大小变化</li>
          <li>支持 ECharts 所有配置项</li>
          <li>内置主题支持</li>
          <li>Vue 3 组合式 API 兼容</li>
          <li>支持 keep-alive 缓存</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import ScEcharts from './index.vue'

// 响应式数据
const containerWidth = ref(600)
const containerHeight = ref(300)
const gaugeAnimating = ref(false)
const gaugeTimer = ref(null)

// 事件日志
const eventLogs = ref([])

// 添加日志
const addLog = (event, detail = '') => {
  const time = new Date().toLocaleTimeString()
  eventLogs.value.unshift({ time, event, detail })
  if (eventLogs.value.length > 10) {
    eventLogs.value.pop()
  }
}

// 柱状图配置
const barOption = reactive({
  title: {
    text: '销售数据统计',
    left: 'center'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['销量'],
    top: 30
  },
  xAxis: {
    type: 'category',
    data: ['一月', '二月', '三月', '四月', '五月', '六月']
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    name: '销量',
    type: 'bar',
    data: [120, 200, 150, 80, 70, 110],
    itemStyle: {
      color: '#409EFF'
    }
  }],
  animation: true
})

// 折线图配置
const lineOption = reactive({
  title: {
    text: '温度变化趋势',
    left: 'center'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['北京', '上海'],
    top: 30
  },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '{value} °C'
    }
  },
  series: [
    {
      name: '北京',
      type: 'line',
      data: [-2, 2, 6, 10, 16, 21, 25, 24, 19, 12, 5, -1],
      smooth: false,
      itemStyle: {
        color: '#67C23A'
      }
    },
    {
      name: '上海',
      type: 'line',
      data: [3, 5, 9, 14, 19, 24, 28, 28, 24, 18, 12, 6],
      smooth: false,
      itemStyle: {
        color: '#E6A23C'
      }
    }
  ]
})

// 饼图配置
const pieOption = reactive({
  title: {
    text: '访问来源',
    left: 'center'
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    top: 50
  },
  series: [{
    name: '访问来源',
    type: 'pie',
    radius: '50%',
    center: ['50%', '60%'],
    data: [
      { value: 335, name: '直接访问' },
      { value: 310, name: '邮件营销' },
      { value: 234, name: '联盟广告' },
      { value: 135, name: '视频广告' },
      { value: 1548, name: '搜索引擎' }
    ],
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    },
    roseType: false
  }]
})

// 散点图配置
const scatterOption = reactive({
  title: {
    text: '身高体重分布',
    left: 'center'
  },
  tooltip: {
    trigger: 'item',
    formatter: '身高: {c}[0]cm<br/>体重: {c}[1]kg'
  },
  xAxis: {
    name: '身高(cm)',
    type: 'value',
    scale: true
  },
  yAxis: {
    name: '体重(kg)',
    type: 'value',
    scale: true
  },
  series: [{
    type: 'scatter',
    symbolSize: 8,
    data: [
      [161.2, 51.6], [167.5, 59.0], [159.5, 49.2], [157.0, 63.0], [155.8, 53.6],
      [170.0, 59.0], [159.1, 47.6], [166.0, 69.8], [176.2, 66.8], [160.2, 75.2],
      [172.5, 55.2], [170.9, 54.2], [172.9, 62.5], [153.4, 42.0], [160.0, 50.0]
    ],
    itemStyle: {
      color: '#F56C6C'
    }
  }]
})

// 雷达图配置
const radarOption = reactive({
  title: {
    text: '能力评估',
    left: 'center'
  },
  tooltip: {},
  legend: {
    data: ['张三', '李四'],
    top: 30
  },
  radar: {
    indicator: [
      { name: '编程', max: 100 },
      { name: '设计', max: 100 },
      { name: '沟通', max: 100 },
      { name: '管理', max: 100 },
      { name: '学习', max: 100 },
      { name: '创新', max: 100 }
    ]
  },
  series: [{
    name: '能力评估',
    type: 'radar',
    data: [
      {
        value: [80, 60, 70, 50, 90, 85],
        name: '张三'
      },
      {
        value: [70, 85, 80, 75, 70, 60],
        name: '李四'
      }
    ],
    areaStyle: null
  }]
})

// 仪表盘配置
const gaugeOption = reactive({
  title: {
    text: 'CPU使用率',
    left: 'center'
  },
  series: [{
    name: 'CPU',
    type: 'gauge',
    detail: {
      formatter: '{value}%'
    },
    data: [{
      value: 50,
      name: 'CPU使用率'
    }]
  }]
})

// 热力图配置
const heatmapOption = reactive({
  title: {
    text: '2023年提交记录',
    left: 'center'
  },
  tooltip: {
    position: 'top'
  },
  visualMap: {
    min: 0,
    max: 10,
    calculable: true,
    orient: 'horizontal',
    left: 'center',
    top: 'top'
  },
  calendar: {
    top: 120,
    left: 30,
    right: 30,
    cellSize: ['auto', 13],
    range: '2023',
    itemStyle: {
      borderWidth: 0.5
    },
    yearLabel: { show: false }
  },
  series: {
    type: 'heatmap',
    coordinateSystem: 'calendar',
    data: generateHeatmapData(2023)
  }
})

// 组合图表配置
const mixedOption = reactive({
  title: {
    text: '销售额与增长率',
    left: 'center'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['销售额', '增长率'],
    top: 30
  },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月']
  },
  yAxis: [
    {
      type: 'value',
      name: '销售额',
      position: 'left',
      axisLabel: {
        formatter: '{value} 万'
      }
    },
    {
      type: 'value',
      name: '增长率',
      position: 'right',
      axisLabel: {
        formatter: '{value} %'
      }
    }
  ],
  series: [
    {
      name: '销售额',
      type: 'bar',
      data: [120, 132, 101, 134, 90, 230],
      itemStyle: {
        color: '#409EFF'
      }
    },
    {
      name: '增长率',
      type: 'line',
      yAxisIndex: 1,
      data: [10, 12, -5, 15, -8, 25],
      itemStyle: {
        color: '#67C23A'
      }
    }
  ],
  dataZoom: null
})

// 响应式图表配置
const responsiveOption = reactive({
  title: {
    text: '响应式图表',
    left: 'center'
  },
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: ['A', 'B', 'C', 'D', 'E']
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    type: 'bar',
    data: [10, 20, 30, 40, 50],
    itemStyle: {
      color: '#909399'
    }
  }]
})

// 生成热力图数据
function generateHeatmapData(year) {
  const data = []
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)
  
  for (let time = startDate; time <= endDate; time.setDate(time.getDate() + 1)) {
    const dateStr = time.getFullYear() + '-' + 
                   String(time.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(time.getDate()).padStart(2, '0')
    data.push([dateStr, Math.floor(Math.random() * 10)])
  }
  return data
}

// 更新柱状图数据
const updateBarData = () => {
  barOption.series[0].data = barOption.series[0].data.map(() => Math.floor(Math.random() * 300))
  addLog('updateBarData', '柱状图数据已更新')
}

// 切换柱状图动画
const toggleBarAnimation = () => {
  barOption.animation = !barOption.animation
  addLog('toggleBarAnimation', `动画${barOption.animation ? '开启' : '关闭'}`)
}

// 添加折线图系列
const addLineSeries = () => {
  const cities = ['广州', '深圳', '杭州', '成都', '西安']
  const colors = ['#F56C6C', '#909399', '#E6A23C', '#67C23A', '#409EFF']
  
  if (lineOption.series.length < 5) {
    const newSeries = {
      name: cities[lineOption.series.length],
      type: 'line',
      data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 30) - 5),
      smooth: false,
      itemStyle: {
        color: colors[lineOption.series.length]
      }
    }
    lineOption.series.push(newSeries)
    lineOption.legend.data.push(newSeries.name)
    addLog('addLineSeries', `添加了${newSeries.name}系列`)
  }
}

// 移除折线图系列
const removeLineSeries = () => {
  if (lineOption.series.length > 1) {
    const removed = lineOption.series.pop()
    lineOption.legend.data.pop()
    addLog('removeLineSeries', `移除了${removed.name}系列`)
  }
}

// 切换折线图平滑
const toggleLineSmooth = () => {
  lineOption.series.forEach(series => {
    series.smooth = !series.smooth
  })
  addLog('toggleLineSmooth', `平滑模式${lineOption.series[0].smooth ? '开启' : '关闭'}`)
}

// 更新饼图数据
const updatePieData = () => {
  pieOption.series[0].data = pieOption.series[0].data.map(item => ({
    ...item,
    value: Math.floor(Math.random() * 1000) + 100
  }))
  addLog('updatePieData', '饼图数据已更新')
}

// 切换玫瑰图
const togglePieRose = () => {
  pieOption.series[0].roseType = pieOption.series[0].roseType ? false : 'area'
  addLog('togglePieRose', `玫瑰图${pieOption.series[0].roseType ? '开启' : '关闭'}`)
}

// 生成散点图数据
const generateScatterData = () => {
  scatterOption.series[0].data = Array.from({ length: 20 }, () => [
    Math.floor(Math.random() * 40) + 150,
    Math.floor(Math.random() * 40) + 40
  ])
  addLog('generateScatterData', '散点图数据已重新生成')
}

// 切换散点图符号
const toggleScatterSymbol = () => {
  const symbols = ['circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow']
  const currentIndex = symbols.indexOf(scatterOption.series[0].symbol || 'circle')
  const nextIndex = (currentIndex + 1) % symbols.length
  scatterOption.series[0].symbol = symbols[nextIndex]
  addLog('toggleScatterSymbol', `符号切换为${symbols[nextIndex]}`)
}

// 更新雷达图数据
const updateRadarData = () => {
  radarOption.series[0].data = radarOption.series[0].data.map(item => ({
    ...item,
    value: item.value.map(() => Math.floor(Math.random() * 100))
  }))
  addLog('updateRadarData', '雷达图数据已更新')
}

// 切换雷达图区域填充
const toggleRadarArea = () => {
  radarOption.series[0].areaStyle = radarOption.series[0].areaStyle ? null : {}
  addLog('toggleRadarArea', `区域填充${radarOption.series[0].areaStyle ? '开启' : '关闭'}`)
}

// 开始仪表盘动画
const startGaugeAnimation = () => {
  if (gaugeAnimating.value) {
    clearInterval(gaugeTimer.value)
    gaugeAnimating.value = false
    addLog('startGaugeAnimation', '仪表盘动画已停止')
  } else {
    gaugeTimer.value = setInterval(() => {
      gaugeOption.series[0].data[0].value = Math.floor(Math.random() * 100)
    }, 1000)
    gaugeAnimating.value = true
    addLog('startGaugeAnimation', '仪表盘动画已开始')
  }
}

// 设置仪表盘值
const setGaugeValue = () => {
  const value = Math.floor(Math.random() * 100)
  gaugeOption.series[0].data[0].value = value
  addLog('setGaugeValue', `设置值为${value}%`)
}

// 生成热力图数据
const generateHeatmapData = () => {
  heatmapOption.series.data = generateHeatmapData(2023)
  addLog('generateHeatmapData', '热力图数据已重新生成')
}

// 切换热力图年份
const changeHeatmapYear = () => {
  const years = [2021, 2022, 2023, 2024]
  const currentYear = heatmapOption.calendar.range
  const currentIndex = years.indexOf(currentYear)
  const nextYear = years[(currentIndex + 1) % years.length]
  
  heatmapOption.calendar.range = nextYear
  heatmapOption.series.data = generateHeatmapData(nextYear)
  heatmapOption.title.text = `${nextYear}年提交记录`
  addLog('changeHeatmapYear', `切换到${nextYear}年`)
}

// 更新组合图表数据
const updateMixedData = () => {
  mixedOption.series[0].data = mixedOption.series[0].data.map(() => Math.floor(Math.random() * 200) + 50)
  mixedOption.series[1].data = mixedOption.series[1].data.map(() => Math.floor(Math.random() * 40) - 20)
  addLog('updateMixedData', '组合图表数据已更新')
}

// 切换数据缩放
const toggleMixedDataZoom = () => {
  if (mixedOption.dataZoom) {
    mixedOption.dataZoom = null
  } else {
    mixedOption.dataZoom = [{
      type: 'slider',
      start: 0,
      end: 100
    }]
  }
  addLog('toggleMixedDataZoom', `数据缩放${mixedOption.dataZoom ? '开启' : '关闭'}`)
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (gaugeTimer.value) {
    clearInterval(gaugeTimer.value)
  }
})
</script>

<style scoped>
.sc-echarts-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.example-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--el-text-color-primary);
  border-radius: 10px;
}

.example-header h2 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: bold;
}

.example-header p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.example-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.example-section h3 {
  margin: 0 0 10px 0;
  color: var(--el-text-color-primary);
  font-size: 20px;
  border-bottom: 2px solid #409eff;
  padding-bottom: 5px;
}

.example-section p {
  margin: 0 0 15px 0;
  color: var(--el-text-color-primary);
  line-height: 1.6;
}

.example-demo {
  padding: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.chart-container {
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.chart-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.responsive-container {
  border: 2px dashed #409eff;
  border-radius: 4px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.event-log {
  max-height: 300px;
  overflow-y: auto;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 10px;
}

.log-item {
  display: flex;
  padding: 5px 0;
  border-bottom: 1px solid #e9ecef;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-time {
  color: #6c757d;
  margin-right: 10px;
  min-width: 80px;
}

.log-event {
  color: #007bff;
  margin-right: 10px;
  min-width: 120px;
  font-weight: bold;
}

.log-detail {
  color: #28a745;
}

.api-table {
  margin-top: 20px;
}

.api-table h4 {
  margin: 20px 0 10px 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.api-table table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.api-table th,
.api-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.api-table th {
  background: var(--el-bg-color-overlay);
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.api-table td {
  color: var(--el-text-color-primary);
}

.api-table tr:hover {
  background: var(--el-bg-color-overlay);
}

.api-table ul {
  margin: 0;
  padding-left: 20px;
}

.api-table li {
  margin-bottom: 5px;
  color: var(--el-text-color-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sc-echarts-example {
    padding: 10px;
  }
  
  .example-header {
    padding: 15px;
  }
  
  .example-header h2 {
    font-size: 24px;
  }
  
  .example-section {
    padding: 15px;
  }
  
  .chart-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .chart-controls .el-button {
    margin-bottom: 10px;
  }
  
  .api-table {
    overflow-x: auto;
  }
  
  .api-table table {
    min-width: 600px;
  }
}
</style>