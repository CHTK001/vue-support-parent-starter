<template>
  <div class="cpu-monitor">
    <!-- CPU 详情弹窗 -->
    <el-dialog v-model="dialogOpen" title="CPU 使用率监控" :width="800" :destroy-on-close="true"
      :close-on-click-modal="false" class="cpu-dialog">
      <div class="chart-container">
        <scEcharts key="cpu-detail" height="500px" :option="cpuOptions" :loading="loading" class="cpu-chart" />
      </div>
    </el-dialog>

    <!-- 主视图区域 -->
    <div v-if="!dialogOpen" class="main-view">
      <!-- 图表区域 -->
      <div class="chart-wrapper">
        <scEcharts key="cpu-main" height="100%" :option="cpuOptions" :loading="loading" class="cpu-chart" />
      </div>

      <!-- 操作按钮区 -->
      <div class="action-bar">
        <el-tooltip content="查看详情" placement="top" :show-after="300">
          <div class="action-btn" @click="onDetail">
            <IconifyIconOnline icon="ep:search" />
          </div>
        </el-tooltip>
      </div>
    </div>

    <!-- CPU 详情抽屉 -->
    <detail v-if="detailVisible" ref="detailRef" :form="form" @close="detailVisible = false" />
  </div>
</template>

<script setup>
import scEcharts from "@repo/components/ScEcharts/index.vue";
import { computed, onBeforeMount, reactive, ref } from "vue";
import { fetchIndicatorQuery } from "@/api/monitor/service";
import { dateFormat } from "@repo/utils";
import * as echarts from "echarts";
import { Md5 } from "ts-md5";
import detail from "./cpudetail.vue";

// 状态变量
const dialogOpen = ref(false);
const detailVisible = ref(false);
const detailRef = ref();
const loading = ref(false);
const currentForm = ref(null);

// Props 定义
const props = defineProps({
  history: Boolean,
  form: Object,
  condition: Object
});

// 打开详情面板
const onDetail = async () => {
  detailVisible.value = true;
  await nextTick();
  detailRef.value?.open();
};

// 图表配置
const cpuOptions = reactive({
  legend: {
    show: true,
    top: 5,
    right: 15,
    textStyle: {
      fontSize: 12,
      color: 'var(--el-text-color-primary)'
    }
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow"
    },
    formatter: params => {
      return `CPU使用率: ${params[0].value}%`;
    },
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'var(--el-border-color-lighter)',
    textStyle: {
      color: 'var(--el-text-color-primary)'
    }
  },
  xAxis: {
    type: "category",
    boundaryGap: false
  },
  yAxis: {
    type: "value",
    boundaryGap: [0, "30%"],
    max: 100
  },
  type: "line",
  barWidth: 15,
  label: {
    show: false,
    position: "insideRight"
  },
  itemStyle: {
    color: "rgb(15,78,142)",
    borderRadius: 5
  },
  visualMap: [
    {
      show: false,
      type: "continuous",
      seriesIndex: 0,
      min: 0,
      max: 100
    }
  ],
  smooth: false,
  areaStyle: {
    color: new echarts.graphic.LinearGradient(
      0,
      0,
      0,
      1,
      [
        {
          offset: 0,
          color: "rgba(102, 204, 204, .9)"
        },
        {
          offset: 0.8,
          color: "rgba(102, 204, 204,.1)"
        }
      ],
      false
    ),
    shadowcolor: "rgba(102, 204, 204,.3)",
    shadowBlur: 10
  },
  series: [
    {
      type: "line",
      smooth: true,
      symbol: "none",
      markPoint: {
        data: [
          { type: "max", name: "Max" },
          { type: "min", name: "Min" }
        ],
        rich: {
          a: {
            color: "red" // 最大值颜色
          },
          b: {
            color: "rgb(44,198,210)" // 最小值颜色
          }
        }
      },
      label: {
        show: false,
        position: "insideRight"
      },
      markLine: {
        data: [{ type: "average", name: "Avg" }]
      },
      markLine: {
        symbol: ["none", "none"],
        label: { show: false },
        data: [{ xAxis: 1 }, { xAxis: 3 }, { xAxis: 5 }, { xAxis: 7 }]
      },
      areaStyle: {},
      data: []
    }
  ]
});

// 打开弹窗
const open = (item) => {
  loading.value = true;
  dialogOpen.value = true;
  currentForm.value = item;
  search(currentForm.value);
};

// 查询数据
const search = async (form) => {
  if (!props.history) return;

  try {
    const newForm = form || props.form;
    if (!newForm) return;

    const query = {
      ...props.condition,
      name: `cpu:${Md5.hashStr(`CPU:${newForm.host}${newForm.port}`)}`
    };

    fetchIndicatorQuery(query).then(({ data }) => {
      data.forEach(it => {
        try {
          update({ timestamp: it.timestamp, free: it.value });
        } catch (error) {
          console.error('数据更新失败:', error);
        }
      });
    })
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    loading.value = false;
  }
};

// 更新图表数据
const update = async data => {
  const series = cpuOptions.series[0];
  if (series.data.length > 100) {
    series.data.shift();
  }
  series.data.push([
    dateFormat(data.timestamp),
    (100 - data?.free).toFixed(2)
  ]);
};

// 初始化
onBeforeMount(async () => {
  search();
});

// 导出方法
defineExpose({
  update,
  open
});
</script>
