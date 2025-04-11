<template>
  <div class="echarts-example">
    <div class="example-container">
      <div class="config-panel">
        <h3>配置面板</h3>
        <el-form :model="chartConfig" label-width="120px" size="small">
          <el-form-item label="图表标题">
            <el-input v-model="chartConfig.title" />
          </el-form-item>
          <el-form-item label="图表高度">
            <el-input-number v-model="chartConfig.height" :min="200" :max="600" :step="50" />
          </el-form-item>
          <el-form-item label="展示图例">
            <el-switch v-model="chartConfig.showLegend" />
          </el-form-item>
          <el-form-item label="工具箱">
            <el-switch v-model="chartConfig.showToolbox" />
          </el-form-item>
          <el-form-item label="数据标签">
            <el-switch v-model="chartConfig.showLabel" />
          </el-form-item>
          <el-form-item label="网格线">
            <el-switch v-model="chartConfig.showGrid" />
          </el-form-item>
          <el-form-item label="颜色主题">
            <el-select v-model="chartConfig.theme">
              <el-option label="默认主题" value="default" />
              <el-option label="暗黑主题" value="dark" />
              <el-option label="蓝色主题" value="blue" />
              <el-option label="绿色主题" value="green" />
            </el-select>
          </el-form-item>
          <el-divider />
          <h4>数据调整</h4>
          <div class="data-sliders">
            <div v-for="(value, index) in chartConfig.data" :key="index" class="data-slider">
              <span class="data-label">{{ chartConfig.categories[index] }}</span>
              <el-slider v-model="chartConfig.data[index]" :min="0" :max="100" show-input />
            </div>
          </div>
          <el-form-item>
            <el-button type="primary" @click="randomizeData">随机数据</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="preview-panel">
        <h3>柱状图预览</h3>
        <p class="example-desc">通过左侧配置面板调整图表属性，实时查看效果</p>

        <div class="chart-container" :class="{ 'dark-background': chartConfig.theme === 'dark' }">
          <ScEcharts :option="chartOption" :theme="chartConfig.theme === 'default' ? undefined : chartConfig.theme" :height="`${chartConfig.height}px`" :width="'100%'" />
        </div>
      </div>
    </div>

    <el-divider></el-divider>
    <div class="code-panel">
      <h4>代码示例：</h4>
      <el-alert title="此代码示例会根据您在配置面板中的选择实时更新" type="info" :closable="false" show-icon style="margin-bottom: 15px" />
      <pre><code class="language-html">{{ generatedCode }}</code></pre>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";

// 图表配置
const chartConfig = reactive({
  title: "销量统计",
  height: 300,
  showLegend: true,
  showToolbox: true,
  showLabel: false,
  showGrid: true,
  theme: "default",
  categories: ["衬衫", "羊毛衫", "雪纺衫", "裤子", "高跟鞋", "袜子"],
  data: [18, 36, 65, 30, 78, 40],
});

// 随机生成数据
const randomizeData = () => {
  chartConfig.data = chartConfig.data.map(() => Math.floor(Math.random() * 100));
};

// 计算图表选项
const chartOption = computed(() => {
  return {
    title: {
      text: chartConfig.title,
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {
      show: chartConfig.showLegend,
      top: "bottom",
    },
    toolbox: {
      show: chartConfig.showToolbox,
      feature: {
        dataView: { show: true, readOnly: false },
        magicType: { show: true, type: ["line", "bar"] },
        restore: { show: true },
        saveAsImage: { show: true },
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: chartConfig.showLegend ? "10%" : "3%",
      top: "15%",
      containLabel: true,
      show: chartConfig.showGrid,
      borderColor: chartConfig.theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
      backgroundColor: chartConfig.theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
    },
    xAxis: {
      type: "category",
      data: chartConfig.categories,
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "销量",
        type: "bar",
        barWidth: "60%",
        data: chartConfig.data,
        label: {
          show: chartConfig.showLabel,
          position: "top",
        },
        itemStyle: {
          // 根据主题动态设置颜色
          color: (params) => {
            const colors = {
              default: ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de", "#3ba272"],
              dark: ["#fc97af", "#87f7cf", "#f7f494", "#72ccff", "#f7c5a0", "#d4a4eb"],
              blue: ["#1890ff", "#36cbcb", "#4ecb73", "#fbd437", "#f2637b", "#975fe4"],
              green: ["#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#FF5722"],
            };

            return colors[chartConfig.theme] ? colors[chartConfig.theme][params.dataIndex % colors[chartConfig.theme].length] : colors.default[params.dataIndex % colors.default.length];
          },
        },
      },
    ],
  };
});

// 生成代码示例
const generatedCode = computed(() => {
  const themeParam = chartConfig.theme !== "default" ? `\n  theme="${chartConfig.theme}"` : "";

  return `<template>
  <ScEcharts 
    :option="chartOption"${themeParam}
    height="${chartConfig.height}px" 
  />
</template>

<script setup>
import { computed } from 'vue';

const chartOption = computed(() => {
  return {
    title: {
      text: '${chartConfig.title}',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },${
      chartConfig.showLegend
        ? `
    legend: {
      show: true,
      top: 'bottom'
    },`
        : ""
    }${
      chartConfig.showToolbox
        ? `
    toolbox: {
      show: true,
      feature: {
        dataView: { show: true, readOnly: false },
        magicType: { show: true, type: ['line', 'bar'] },
        restore: { show: true },
        saveAsImage: { show: true }
      }
    },`
        : ""
    }
    grid: {
      left: '3%',
      right: '4%',
      bottom: ${chartConfig.showLegend ? "'10%'" : "'3%'"},
      top: '15%',
      containLabel: true,${
        chartConfig.showGrid
          ? `
      show: true`
          : ""
      }
    },
    xAxis: {
      type: 'category',
      data: ${JSON.stringify(chartConfig.categories)}
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '销量',
        type: 'bar',
        barWidth: '60%',
        data: ${JSON.stringify(chartConfig.data)}${
          chartConfig.showLabel
            ? `,
        label: {
          show: true,
          position: 'top'
        }`
            : ""
        }
      }
    ]
  };
});
<\/script>`;
});
</script>

<style lang="scss" scoped>
.example-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.config-panel {
  width: 300px;
  flex-shrink: 0;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  background-color: #f8f9fa;
  max-height: 600px;
  overflow-y: auto;
}

.preview-panel {
  flex-grow: 1;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
}

.code-panel {
  margin-top: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  background-color: #f8f9fa;
}

.example-desc {
  color: #666;
  margin-bottom: 15px;
}

.chart-container {
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;

  &.dark-background {
    background-color: #333;
  }
}

.data-sliders {
  margin-bottom: 15px;
}

.data-slider {
  margin-bottom: 10px;
}

.data-label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #606266;
}

pre {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
}

code {
  font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
  white-space: pre;
}
</style>
