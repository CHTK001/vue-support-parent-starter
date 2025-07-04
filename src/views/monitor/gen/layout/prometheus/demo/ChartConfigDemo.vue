<template>
  <div class="chart-config-demo">
    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <span>图表配置演示</span>
          <el-button type="primary" @click="openChartConfig">
            <IconifyIconOnline icon="ri:settings-line" class="mr-1" />
            配置图表
          </el-button>
        </div>
      </template>

      <div class="demo-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>
                <span>折线图演示</span>
              </template>
              <LineChart 
                :chart-data="lineChartData" 
                :chart-config="chartConfig"
                :height="300"
              />
            </el-card>
          </el-col>
          
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>
                <span>柱状图演示</span>
              </template>
              <BarChart 
                :chart-data="barChartData" 
                :chart-config="chartConfig"
                :height="300"
              />
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mt-4">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>
                <span>仪表盘演示</span>
              </template>
              <GaugeChart 
                :chart-data="gaugeChartData" 
                :chart-config="chartConfig"
                :height="300"
              />
            </el-card>
          </el-col>
          
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>
                <span>当前配置</span>
              </template>
              <div class="config-display">
                <pre>{{ JSON.stringify(chartConfig, null, 2) }}</pre>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 图表配置对话框 -->
    <ChartConfigDialog 
      ref="chartConfigDialogRef" 
      @confirm="handleChartConfigConfirm"
      @cancel="handleChartConfigCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { ElMessage } from "element-plus";
import LineChart from "../components/LineChart.vue";
import BarChart from "../components/BarChart.vue";
import GaugeChart from "../components/GaugeChart.vue";
import ChartConfigDialog from "../components/ChartConfigDialog.vue";

// 图表配置对话框引用
const chartConfigDialogRef = ref();

// 图表配置
const chartConfig = reactive({
  title: "演示图表",
  type: "line",
  unit: "%",
  mainColor: "#409EFF",
  bgColor: "rgba(64, 158, 255, 0.1)",
  showLegend: true,
  smooth: false,
  fill: false,
  stacked: false,
  yAxisMin: null,
  yAxisMax: null,
  showGrid: true,
  showLabel: false,
  thresholds: [
    { value: 0, color: "#67C23A", label: "正常" },
    { value: 60, color: "#E6A23C", label: "警告" },
    { value: 80, color: "#F56C6C", label: "危险" },
  ],
  animation: true,
  animationDuration: 1000,
  animationDelay: 0,
});

// 生成模拟数据
const generateTimeSeriesData = (points = 20) => {
  const data = [];
  const now = Date.now();
  for (let i = 0; i < points; i++) {
    data.push({
      time: new Date(now - (points - i) * 60000).toISOString(),
      value: Math.random() * 100
    });
  }
  return data;
};

// 折线图数据
const lineChartData = reactive({
  title: "CPU使用率",
  labels: [],
  datasets: [
    {
      label: "CPU使用率",
      data: generateTimeSeriesData(),
      borderColor: "#409EFF",
      backgroundColor: "rgba(64, 158, 255, 0.1)"
    }
  ]
});

// 柱状图数据
const barChartData = reactive({
  title: "内存使用情况",
  labels: ["已用", "缓存", "缓冲", "空闲"],
  datasets: [
    {
      label: "内存(GB)",
      data: [4.2, 1.8, 0.5, 1.5],
      borderColor: "#67C23A",
      backgroundColor: "rgba(103, 194, 58, 0.8)"
    }
  ]
});

// 仪表盘数据
const gaugeChartData = reactive({
  title: "磁盘使用率",
  datasets: [
    {
      label: "磁盘使用率",
      data: [75],
      borderColor: "#E6A23C"
    }
  ]
});

// 打开图表配置
const openChartConfig = () => {
  chartConfigDialogRef.value?.open(chartConfig);
};

// 处理图表配置确认
const handleChartConfigConfirm = (config) => {
  Object.assign(chartConfig, config);
  ElMessage.success("图表配置已更新");
};

// 处理图表配置取消
const handleChartConfigCancel = () => {
  // 取消操作，不做任何处理
};
</script>

<style scoped lang="scss">
.chart-config-demo {
  padding: 20px;
  
  .demo-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
  
  .demo-content {
    .config-display {
      max-height: 250px;
      overflow-y: auto;
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      
      pre {
        margin: 0;
        font-size: 12px;
        line-height: 1.4;
      }
    }
  }
}

.mt-4 {
  margin-top: 20px;
}
</style>
