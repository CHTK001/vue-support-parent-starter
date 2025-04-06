<template>
  <div class="echarts-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础用法">
        <h3>基础图表</h3>
        <p class="example-desc">基础的柱状图示例</p>

        <div class="example-row">
          <div class="chart-container">
            <ScEcharts :option="basicOption" height="300px" />
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScEcharts :option="basicOption" height="300px" /&gt;

&lt;script setup&gt;
import { ref } from 'vue';

const basicOption = {
  title: {
    text: '基础柱状图'
  },
  tooltip: {},
  xAxis: {
    data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']
  },
  yAxis: {},
  series: [{
    name: '销量',
    type: 'bar',
    data: [5, 20, 36, 10, 10, 20]
  }]
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="多种图表">
        <h3>多种图表类型</h3>
        <p class="example-desc">支持多种图表类型，如折线图、饼图等</p>

        <div class="example-row chart-grid">
          <div class="chart-item">
            <h4>折线图</h4>
            <ScEcharts :option="lineOption" height="250px" />
          </div>

          <div class="chart-item">
            <h4>饼图</h4>
            <ScEcharts :option="pieOption" height="250px" />
          </div>

          <div class="chart-item">
            <h4>散点图</h4>
            <ScEcharts :option="scatterOption" height="250px" />
          </div>

          <div class="chart-item">
            <h4>雷达图</h4>
            <ScEcharts :option="radarOption" height="250px" />
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScEcharts :option="lineOption" height="250px" /&gt;

&lt;script setup&gt;
const lineOption = {
  title: {
    text: '折线图示例'
  },
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    data: [820, 932, 901, 934, 1290, 1330, 1320],
    type: 'line',
    smooth: true
  }]
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="动态数据">
        <h3>动态数据更新</h3>
        <p class="example-desc">支持动态更新图表数据</p>

        <div class="example-row">
          <div class="chart-container">
            <ScEcharts :option="dynamicOption" height="300px" />
          </div>

          <div class="chart-controls">
            <el-button type="primary" @click="updateDynamicData">更新数据</el-button>
            <el-switch v-model="autoUpdate" active-text="自动更新" inactive-text="手动更新" />
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScEcharts :option="dynamicOption" height="300px" /&gt;
&lt;el-button type="primary" @click="updateDynamicData"&gt;更新数据&lt;/el-button&gt;
&lt;el-switch v-model="autoUpdate" active-text="自动更新" inactive-text="手动更新" /&gt;

&lt;script setup&gt;
import { ref, onMounted, onUnmounted } from 'vue';

const dynamicOption = ref({
  title: {
    text: '动态数据示例'
  },
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: Array.from({ length: 10 }, (_, i) => i)
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    type: 'line',
    data: Array.from({ length: 10 }, () => Math.floor(Math.random() * 100))
  }]
});

const autoUpdate = ref(false);
let timer = null;

const updateDynamicData = () => {
  dynamicOption.value = {
    ...dynamicOption.value,
    series: [{
      type: 'line',
      data: Array.from({ length: 10 }, () => Math.floor(Math.random() * 100))
    }]
  };
};

// 监听自动更新开关
watch(autoUpdate, (val) => {
  if (val) {
    timer = setInterval(updateDynamicData, 2000);
  } else {
    clearInterval(timer);
  }
});

onMounted(() => {
  if (autoUpdate.value) {
    timer = setInterval(updateDynamicData, 2000);
  }
});

onUnmounted(() => {
  clearInterval(timer);
});
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="主题设置">
        <h3>主题设置</h3>
        <p class="example-desc">支持切换不同的主题样式</p>

        <div class="example-row">
          <div class="theme-controls">
            <span class="control-label">选择主题：</span>
            <el-radio-group v-model="currentTheme" size="small">
              <el-radio-button label="default">默认主题</el-radio-button>
              <el-radio-button label="dark">暗黑主题</el-radio-button>
              <el-radio-button label="custom">自定义主题</el-radio-button>
            </el-radio-group>
          </div>

          <div class="chart-container" :class="{ 'dark-theme': currentTheme === 'dark' }">
            <ScEcharts :option="themeOption" :theme="chartTheme" height="300px" />
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;el-radio-group v-model="currentTheme" size="small"&gt;
  &lt;el-radio-button label="default"&gt;默认主题&lt;/el-radio-button&gt;
  &lt;el-radio-button label="dark"&gt;暗黑主题&lt;/el-radio-button&gt;
  &lt;el-radio-button label="custom"&gt;自定义主题&lt;/el-radio-button&gt;
&lt;/el-radio-group&gt;

&lt;ScEcharts :option="themeOption" :theme="chartTheme" height="300px" /&gt;

&lt;script setup&gt;
import { ref, computed } from 'vue';

const currentTheme = ref('default');

// 根据选择的主题返回对应的主题配置
const chartTheme = computed(() => {
  if (currentTheme.value === 'default') {
    return undefined; // 使用默认主题
  } else if (currentTheme.value === 'dark') {
    return 'dark'; // 使用内置的暗黑主题
  } else if (currentTheme.value === 'custom') {
    // 自定义主题
    return {
      color: ['#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
      backgroundColor: '#f5f7fa',
      textStyle: {},
      title: {
        textStyle: {
          color: '#516b91'
        },
        subtextStyle: {
          color: '#93b7e3'
        }
      },
      // 更多自定义主题配置...
    };
  }
});

const themeOption = {
  title: {
    text: '主题示例'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['销量', '利润']
  },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月']
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    name: '销量',
    type: 'bar',
    data: [10, 15, 25, 20, 30, 40]
  }, {
    name: '利润',
    type: 'line',
    data: [5, 10, 15, 12, 20, 30]
  }]
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { message } from "@repo/utils";
import ScEcharts from "@repo/components/ScEcharts/index.vue";

// 基础柱状图
const basicOption = {
  title: {
    text: "基础柱状图",
  },
  tooltip: {},
  xAxis: {
    data: ["衬衫", "羊毛衫", "雪纺衫", "裤子", "高跟鞋", "袜子"],
  },
  yAxis: {},
  series: [
    {
      name: "销量",
      type: "bar",
      data: [5, 20, 36, 10, 10, 20],
      itemStyle: {
        color: function (params) {
          const colorList = ["#c23531", "#2f4554", "#61a0a8", "#d48265", "#91c7ae", "#749f83"];
          return colorList[params.dataIndex];
        },
      },
    },
  ],
};

// 折线图
const lineOption = {
  title: {
    text: "折线图示例",
  },
  tooltip: {
    trigger: "axis",
  },
  xAxis: {
    type: "category",
    data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      data: [820, 932, 901, 934, 1290, 1330, 1320],
      type: "line",
      smooth: true,
    },
  ],
};

// 饼图
const pieOption = {
  title: {
    text: "饼图示例",
    left: "center",
  },
  tooltip: {
    trigger: "item",
    formatter: "{a} <br/>{b}: {c} ({d}%)",
  },
  legend: {
    orient: "vertical",
    left: "left",
    data: ["直接访问", "邮件营销", "联盟广告", "视频广告", "搜索引擎"],
  },
  series: [
    {
      name: "访问来源",
      type: "pie",
      radius: "50%",
      data: [
        { value: 335, name: "直接访问" },
        { value: 310, name: "邮件营销" },
        { value: 234, name: "联盟广告" },
        { value: 135, name: "视频广告" },
        { value: 1548, name: "搜索引擎" },
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
      },
    },
  ],
};

// 散点图
const scatterOption = {
  title: {
    text: "散点图示例",
  },
  xAxis: {},
  yAxis: {},
  tooltip: {},
  series: [
    {
      symbolSize: 20,
      data: [
        [10.0, 8.04],
        [8.0, 6.95],
        [13.0, 7.58],
        [9.0, 8.81],
        [11.0, 8.33],
        [14.0, 9.96],
        [6.0, 7.24],
        [4.0, 4.26],
        [12.0, 10.84],
        [7.0, 4.82],
        [5.0, 5.68],
      ],
      type: "scatter",
    },
  ],
};

// 雷达图
const radarOption = {
  title: {
    text: "雷达图示例",
  },
  tooltip: {},
  legend: {
    data: ["预算分配", "实际开销"],
  },
  radar: {
    indicator: [
      { name: "销售", max: 6500 },
      { name: "管理", max: 16000 },
      { name: "信息技术", max: 30000 },
      { name: "客服", max: 38000 },
      { name: "研发", max: 52000 },
      { name: "市场", max: 25000 },
    ],
  },
  series: [
    {
      name: "预算 vs 开销",
      type: "radar",
      data: [
        {
          value: [4300, 10000, 28000, 35000, 50000, 19000],
          name: "预算分配",
        },
        {
          value: [5000, 14000, 28000, 31000, 42000, 21000],
          name: "实际开销",
        },
      ],
    },
  ],
};

// 动态数据图表
const dynamicOption = ref({
  title: {
    text: "动态数据示例",
  },
  tooltip: {
    trigger: "axis",
  },
  xAxis: {
    type: "category",
    data: Array.from({ length: 10 }, (_, i) => i),
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      type: "line",
      data: Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)),
    },
  ],
});

const autoUpdate = ref(false);
let timer = null;

const updateDynamicData = () => {
  dynamicOption.value = {
    ...dynamicOption.value,
    series: [
      {
        type: "line",
        data: Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)),
      },
    ],
  };
  message("数据已更新", { type: "success" });
};

// 监听自动更新开关
watch(autoUpdate, (val) => {
  if (val) {
    timer = setInterval(updateDynamicData, 2000);
    message("已开启自动更新", { type: "info" });
  } else {
    clearInterval(timer);
    message("已关闭自动更新", { type: "info" });
  }
});

onMounted(() => {
  if (autoUpdate.value) {
    timer = setInterval(updateDynamicData, 2000);
  }
});

onUnmounted(() => {
  clearInterval(timer);
});

// 主题设置
const currentTheme = ref("default");

// 根据选择的主题返回对应的主题配置
const chartTheme = computed(() => {
  if (currentTheme.value === "default") {
    return undefined; // 使用默认主题
  } else if (currentTheme.value === "dark") {
    return "dark"; // 使用内置的暗黑主题
  } else if (currentTheme.value === "custom") {
    // 自定义主题
    return {
      color: ["#91cc75", "#fac858", "#ee6666", "#73c0de", "#3ba272", "#fc8452", "#9a60b4", "#ea7ccc"],
      backgroundColor: "#f5f7fa",
      textStyle: {},
      title: {
        textStyle: {
          color: "#516b91",
        },
        subtextStyle: {
          color: "#93b7e3",
        },
      },
      // 更多自定义主题配置...
    };
  }
});

const themeOption = {
  title: {
    text: "主题示例",
  },
  tooltip: {
    trigger: "axis",
  },
  legend: {
    data: ["销量", "利润"],
  },
  xAxis: {
    type: "category",
    data: ["1月", "2月", "3月", "4月", "5月", "6月"],
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      name: "销量",
      type: "bar",
      data: [10, 15, 25, 20, 30, 40],
    },
    {
      name: "利润",
      type: "line",
      data: [5, 10, 15, 12, 20, 30],
    },
  ],
};

// 监听主题变化
watch(currentTheme, (val) => {
  message(`已切换到${val === "default" ? "默认" : val === "dark" ? "暗黑" : "自定义"}主题`, { type: "info" });
});
</script>

<style lang="scss" scoped>
.echarts-example {
  padding: 20px;

  .example-desc {
    color: #666;
    margin-bottom: 20px;
  }

  .example-row {
    margin-bottom: 20px;
  }

  .chart-container {
    height: 300px;
    background-color: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    transition: all 0.3s ease;

    &.dark-theme {
      background-color: #333;
      color: #fff;
    }
  }

  .chart-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;

    .chart-item {
      background-color: #fff;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

      h4 {
        margin-top: 0;
        margin-bottom: 15px;
        font-weight: 500;
        color: #606266;
        text-align: center;
      }
    }
  }

  .chart-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
  }

  .theme-controls {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    .control-label {
      margin-right: 10px;
      font-size: 14px;
      color: #606266;
    }
  }

  pre {
    background-color: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
  }
}

@media (max-width: 768px) {
  .chart-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
