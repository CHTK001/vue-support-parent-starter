<template>
  <div class="sc-chart-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础图表">
        <h3>基础图表</h3>
        <p class="example-desc">ScChart 组件基于 ECharts 封装，提供了简便的图表配置方式</p>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <div class="card-header">
                  <span>柱状图</span>
                </div>
              </template>
              <ScChart :options="barOptions" height="300px" />
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <div class="card-header">
                  <span>折线图</span>
                </div>
              </template>
              <ScChart :options="lineOptions" height="300px" />
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mt-4">
          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <div class="card-header">
                  <span>饼图</span>
                </div>
              </template>
              <ScChart :options="pieOptions" height="300px" />
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <div class="card-header">
                  <span>散点图</span>
                </div>
              </template>
              <ScChart :options="scatterOptions" height="300px" />
            </el-card>
          </el-col>
        </el-row>

        <el-divider content-position="left">代码示例</el-divider>

        <pre><code>
&lt;ScChart :options="chartOptions" height="300px" /&gt;

// script setup 部分
const chartOptions = {
  title: {
    text: '销售数据统计'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['销售量', '利润']
  },
  xAxis: {
    type: 'category',
    data: ['一月', '二月', '三月', '四月', '五月', '六月']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '销售量',
      type: 'bar',
      data: [320, 332, 301, 334, 390, 330]
    },
    {
      name: '利润',
      type: 'line',
      data: [120, 132, 101, 134, 90, 230]
    }
  ]
}
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="交互图表">
        <h3>交互图表</h3>
        <p class="example-desc">支持数据更新、图表交互和主题切换等功能</p>

        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>动态数据更新</span>
              <div class="header-controls">
                <el-button type="primary" size="small" @click="updateChartData">更新数据</el-button>
                <el-select v-model="chartTheme" size="small" placeholder="选择主题" @change="changeTheme">
                  <el-option label="默认" value="default" />
                  <el-option label="暗色" value="dark" />
                  <el-option label="蓝色" value="blue" />
                </el-select>
              </div>
            </div>
          </template>

          <ScChart ref="dynamicChartRef" :options="dynamicChartOptions" :theme="chartTheme" height="350px" :loading="chartLoading" />
        </el-card>

        <el-card class="chart-card mt-4">
          <template #header>
            <div class="card-header">
              <span>图表联动</span>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="18">
              <ScChart ref="mainChartRef" :options="mainChartOptions" height="300px" @highlight="handleHighlight" />
            </el-col>
            <el-col :span="6">
              <div class="detail-panel">
                <template v-if="selectedCategory">
                  <h4>{{ selectedCategory }} 详细数据</h4>
                  <el-descriptions :column="1" border>
                    <el-descriptions-item label="销售额">{{ selectedData.sales }}</el-descriptions-item>
                    <el-descriptions-item label="同比增长">{{ selectedData.growth }}%</el-descriptions-item>
                    <el-descriptions-item label="订单数">{{ selectedData.orders }}</el-descriptions-item>
                  </el-descriptions>
                </template>
                <el-empty v-else description="点击左侧图表查看详情"></el-empty>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="高级图表">
        <h3>高级图表</h3>
        <p class="example-desc">展示更复杂的图表类型和数据可视化效果</p>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <div class="card-header">
                  <span>雷达图</span>
                </div>
              </template>
              <ScChart :options="radarOptions" height="350px" />
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <div class="card-header">
                  <span>漏斗图</span>
                </div>
              </template>
              <ScChart :options="funnelOptions" height="350px" />
            </el-card>
          </el-col>
        </el-row>

        <el-card class="chart-card mt-4">
          <template #header>
            <div class="card-header">
              <span>地图可视化</span>
              <el-radio-group v-model="mapType" size="small" @change="changeMapType">
                <el-radio-button label="china">中国地图</el-radio-button>
                <el-radio-button label="world">世界地图</el-radio-button>
              </el-radio-group>
            </div>
          </template>

          <ScChart ref="mapChartRef" :options="mapChartOptions" height="500px" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="API说明">
        <h3>ScChart 组件 API</h3>

        <el-descriptions title="属性" :column="1" border>
          <el-descriptions-item label="options">图表配置选项，类型: Object，必填</el-descriptions-item>
          <el-descriptions-item label="theme">图表主题，类型: String，可选值：内置主题名称或自定义主题</el-descriptions-item>
          <el-descriptions-item label="width">图表宽度，类型: String，默认: 100%</el-descriptions-item>
          <el-descriptions-item label="height">图表高度，类型: String，默认: 300px</el-descriptions-item>
          <el-descriptions-item label="loading">显示加载状态，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="auto-resize">自动调整大小，类型: Boolean，默认: true</el-descriptions-item>
          <el-descriptions-item label="init-options">ECharts 初始化选项，类型: Object</el-descriptions-item>
          <el-descriptions-item label="update-options">更新图表数据时的附加配置项，类型: Object</el-descriptions-item>
          <el-descriptions-item label="group">图表所属组，用于联动，类型: String</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">方法</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="setOption(options, notMerge, lazyUpdate)">设置图表实例的配置项和数据</el-descriptions-item>
          <el-descriptions-item label="getWidth()">获取图表实例容器的宽度</el-descriptions-item>
          <el-descriptions-item label="getHeight()">获取图表实例容器的高度</el-descriptions-item>
          <el-descriptions-item label="getDom()">获取图表实例的 DOM 元素</el-descriptions-item>
          <el-descriptions-item label="getOption()">获取图表实例的配置项</el-descriptions-item>
          <el-descriptions-item label="resize(options)">改变图表尺寸</el-descriptions-item>
          <el-descriptions-item label="dispatchAction(payload)">触发图表行为</el-descriptions-item>
          <el-descriptions-item label="convertToPixel(finder, value)">转换逻辑坐标到像素坐标</el-descriptions-item>
          <el-descriptions-item label="convertFromPixel(finder, value)">转换像素坐标到逻辑坐标</el-descriptions-item>
          <el-descriptions-item label="clear()">清空当前实例</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">事件</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="initialized">图表初始化完成</el-descriptions-item>
          <el-descriptions-item label="update">图表更新完成</el-descriptions-item>
          <el-descriptions-item label="click">点击事件</el-descriptions-item>
          <el-descriptions-item label="dblclick">双击事件</el-descriptions-item>
          <el-descriptions-item label="mouseover">鼠标移入事件</el-descriptions-item>
          <el-descriptions-item label="mouseout">鼠标移出事件</el-descriptions-item>
          <el-descriptions-item label="datazoom">数据区域缩放事件</el-descriptions-item>
          <el-descriptions-item label="legendselectchanged">图例选中状态改变事件</el-descriptions-item>
          <el-descriptions-item label="highlight">高亮事件</el-descriptions-item>
          <el-descriptions-item label="downplay">取消高亮事件</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import * as echarts from "echarts";
import { MapChart } from "echarts/charts";
import { GeoComponent } from "echarts/components";

// 注册地图组件
echarts.use([MapChart, GeoComponent]);

// 将ScEcharts组件重命名为ScChart
const ScChart = ScEcharts;

// 基础柱状图配置
const barOptions = {
  title: {
    text: "月度销售数据",
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
  legend: {
    data: ["销售额", "利润"],
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: ["一月", "二月", "三月", "四月", "五月", "六月"],
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      name: "销售额",
      type: "bar",
      data: [320, 332, 301, 334, 390, 330],
    },
    {
      name: "利润",
      type: "line",
      data: [120, 132, 101, 134, 90, 230],
    },
  ],
};

// 基础折线图配置
const lineOptions = {
  title: {
    text: "用户增长趋势",
  },
  tooltip: {
    trigger: "axis",
  },
  legend: {
    data: ["新用户", "活跃用户"],
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      name: "新用户",
      type: "line",
      stack: "总量",
      data: [120, 132, 101, 134, 90, 230, 210],
      areaStyle: {},
    },
    {
      name: "活跃用户",
      type: "line",
      stack: "总量",
      data: [220, 182, 191, 234, 290, 330, 310],
      areaStyle: {},
    },
  ],
};

// 基础饼图配置
const pieOptions = {
  title: {
    text: "访问来源",
    left: "center",
  },
  tooltip: {
    trigger: "item",
    formatter: "{a} <br/>{b} : {c} ({d}%)",
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
      radius: "55%",
      center: ["50%", "60%"],
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

// 基础散点图配置
const scatterOptions = {
  title: {
    text: "身高体重分布",
  },
  tooltip: {
    trigger: "item",
    formatter: function (params) {
      return "身高: " + params.value[0] + "cm<br/>体重: " + params.value[1] + "kg";
    },
  },
  xAxis: {
    name: "身高(cm)",
    min: 150,
    max: 190,
  },
  yAxis: {
    name: "体重(kg)",
    min: 40,
    max: 90,
  },
  series: [
    {
      type: "scatter",
      data: [
        [161, 51],
        [167, 59],
        [159, 49],
        [157, 63],
        [155, 53],
        [170, 59],
        [176, 73],
        [180, 75],
        [158, 54],
        [172, 62],
        [175, 65],
        [178, 71],
        [168, 61],
        [165, 56],
        [162, 60],
        [173, 68],
        [175, 70],
        [180, 80],
        [184, 78],
        [177, 72],
      ],
      symbolSize: 10,
    },
  ],
};

// 动态图表相关
const dynamicChartRef = ref(null);
const chartLoading = ref(false);
const chartTheme = ref("default");

const months = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const salesData = ref([320, 332, 301, 334, 390, 330, 320, 330, 350, 370, 390, 410]);
const profitData = ref([120, 132, 101, 134, 90, 230, 210, 220, 230, 240, 250, 270]);

const dynamicChartOptions = computed(() => {
  return {
    title: {
      text: "年度销售数据",
    },
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: ["销售额", "利润"],
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: months,
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "销售额",
        type: "bar",
        data: salesData.value,
      },
      {
        name: "利润",
        type: "line",
        data: profitData.value,
      },
    ],
  };
});

// 更新图表数据
const updateChartData = () => {
  chartLoading.value = true;

  setTimeout(() => {
    salesData.value = salesData.value.map(() => Math.floor(Math.random() * 500 + 100));
    profitData.value = profitData.value.map(() => Math.floor(Math.random() * 300 + 50));

    chartLoading.value = false;
    ElMessage.success("数据已更新");
  }, 1000);
};

// 切换图表主题
const changeTheme = () => {
  ElMessage.success(`已切换至${chartTheme.value === "default" ? "默认" : chartTheme.value === "dark" ? "暗色" : "蓝色"}主题`);
};

// 联动图表相关
const mainChartRef = ref(null);
const selectedCategory = ref("");
const selectedData = reactive({
  sales: 0,
  growth: 0,
  orders: 0,
});

const detailsData = {
  服装: { sales: 23500, growth: 12.5, orders: 1234 },
  食品: { sales: 18700, growth: 8.3, orders: 984 },
  电子: { sales: 35200, growth: 15.7, orders: 2543 },
  家居: { sales: 15800, growth: 5.2, orders: 876 },
  美妆: { sales: 12400, growth: 9.8, orders: 653 },
};

const mainChartOptions = {
  title: {
    text: "各品类销售占比",
  },
  tooltip: {
    trigger: "item",
    formatter: "{a} <br/>{b}: {c} ({d}%)",
  },
  legend: {
    orient: "vertical",
    left: "left",
    data: Object.keys(detailsData),
  },
  series: [
    {
      name: "销售额",
      type: "pie",
      radius: ["40%", "70%"],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: "#fff",
        borderWidth: 2,
      },
      label: {
        show: false,
        position: "center",
      },
      emphasis: {
        label: {
          show: true,
          fontSize: "18",
          fontWeight: "bold",
        },
      },
      labelLine: {
        show: false,
      },
      data: Object.entries(detailsData).map(([name, data]) => ({
        name,
        value: data.sales,
      })),
    },
  ],
};

// 处理高亮事件
const handleHighlight = (params) => {
  if (params.data && params.data.name) {
    selectedCategory.value = params.data.name;
    Object.assign(selectedData, detailsData[params.data.name]);
  }
};

// 雷达图配置
const radarOptions = {
  title: {
    text: "产品性能评估",
  },
  tooltip: {},
  legend: {
    data: ["产品A", "产品B"],
  },
  radar: {
    indicator: [
      { name: "功能", max: 100 },
      { name: "性能", max: 100 },
      { name: "可用性", max: 100 },
      { name: "外观", max: 100 },
      { name: "价格", max: 100 },
    ],
  },
  series: [
    {
      name: "产品对比",
      type: "radar",
      data: [
        {
          value: [85, 90, 75, 95, 70],
          name: "产品A",
        },
        {
          value: [70, 80, 95, 80, 90],
          name: "产品B",
        },
      ],
    },
  ],
};

// 漏斗图配置
const funnelOptions = {
  title: {
    text: "销售漏斗",
  },
  tooltip: {
    trigger: "item",
    formatter: "{a} <br/>{b} : {c}%",
  },
  legend: {
    data: ["展示", "点击", "访问", "咨询", "订单"],
  },
  series: [
    {
      name: "转化率",
      type: "funnel",
      left: "10%",
      top: 60,
      bottom: 60,
      width: "80%",
      min: 0,
      max: 100,
      minSize: "0%",
      maxSize: "100%",
      sort: "descending",
      gap: 2,
      label: {
        show: true,
        position: "inside",
      },
      labelLine: {
        length: 10,
        lineStyle: {
          width: 1,
          type: "solid",
        },
      },
      itemStyle: {
        borderColor: "#fff",
        borderWidth: 1,
      },
      emphasis: {
        label: {
          fontSize: 16,
        },
      },
      data: [
        { value: 100, name: "展示" },
        { value: 80, name: "点击" },
        { value: 60, name: "访问" },
        { value: 40, name: "咨询" },
        { value: 20, name: "订单" },
      ],
    },
  ],
};

// 地图相关
const mapChartRef = ref(null);
const mapType = ref("china");

// 地图数据
const chinaData = [
  { name: "北京", value: 50 },
  { name: "上海", value: 45 },
  { name: "广州", value: 38 },
  { name: "深圳", value: 36 },
  { name: "杭州", value: 31 },
  { name: "成都", value: 29 },
  { name: "西安", value: 25 },
  { name: "南京", value: 23 },
  { name: "武汉", value: 20 },
  { name: "重庆", value: 18 },
];

const worldData = [
  { name: "中国", value: 100 },
  { name: "美国", value: 85 },
  { name: "日本", value: 65 },
  { name: "德国", value: 70 },
  { name: "英国", value: 60 },
  { name: "法国", value: 55 },
  { name: "加拿大", value: 50 },
  { name: "巴西", value: 40 },
  { name: "澳大利亚", value: 35 },
  { name: "印度", value: 45 },
];

const mapChartOptions = computed(() => {
  return {
    title: {
      text: mapType.value === "china" ? "中国市场分布" : "全球市场分布",
      left: "center",
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c}",
    },
    visualMap: {
      min: 0,
      max: 100,
      left: "left",
      top: "bottom",
      text: ["高", "低"],
      calculable: true,
    },
    series: [
      {
        name: "市场占有率",
        type: "map",
        map: mapType.value,
        roam: true,
        emphasis: {
          label: {
            show: true,
          },
        },
        data: mapType.value === "china" ? chinaData : worldData,
      },
    ],
  };
});

// 切换地图类型
const changeMapType = () => {
  ElMessage.success(`已切换至${mapType.value === "china" ? "中国" : "世界"}地图`);
};

// 组件挂载后
onMounted(() => {
  // 初始化地图数据
  fetch("/maps/china.json")
    .then((response) => response.json())
    .then((data) => {
      echarts.registerMap("china", data);
    })
    .catch((error) => {
      console.error("加载中国地图数据失败:", error);
    });

  fetch("/maps/world.json")
    .then((response) => response.json())
    .then((data) => {
      echarts.registerMap("world", data);
    })
    .catch((error) => {
      console.error("加载世界地图数据失败:", error);
    });
});
</script>

<style lang="scss" scoped>
.sc-chart-example {
  padding: 16px;

  .example-desc {
    color: #666;
    margin-bottom: 16px;
  }

  .chart-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-controls {
        display: flex;
        align-items: center;
        gap: 10px;
      }
    }
  }

  .detail-panel {
    height: 300px;
    padding: 10px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    justify-content: center;

    h4 {
      margin-top: 0;
      margin-bottom: 20px;
      text-align: center;
    }
  }

  .mt-4 {
    margin-top: 16px;
  }

  pre {
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 16px;
    overflow-x: auto;

    code {
      font-family: Consolas, Monaco, "Andale Mono", monospace;
      font-size: 14px;
      color: #333;
    }
  }
}
</style>
