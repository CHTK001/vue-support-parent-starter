<template>
  <ScCard class="job-statistics">
    <template #header>
      <div class="card-header">
        <span class="card-title">任务执行统计</span>
        <ScRadio v-model="period" size="small" @change="loadStatistics">
          <ScRadioButton value="today">今日</ScRadioButton>
          <ScRadioButton value="week">本周</ScRadioButton>
          <ScRadioButton value="month">本月</ScRadioButton>
        </ScRadio>
      </div>
    </template>

    <!-- 统计卡片 -->
    <ScRow :gutter="16" class="stats-row">
      <ScCol :span="6">
        <div class="stat-card success">
          <div class="stat-icon">
            <IconifyIconOnline icon="ri:checkbox-circle-line" :size="32" />
          </div>
          <div class="stat-content">
            <div class="stat-value">
              <ScNumber :value="statistics.successCount" :duration="1500" />
            </div>
            <div class="stat-label">成功次数</div>
          </div>
        </div>
      </ScCol>

      <ScCol :span="6">
        <div class="stat-card error">
          <div class="stat-icon">
            <IconifyIconOnline icon="ri:close-circle-line" :size="32" />
          </div>
          <div class="stat-content">
            <div class="stat-value">
              <ScNumber :value="statistics.failCount" :duration="1500" />
            </div>
            <div class="stat-label">失败次数</div>
          </div>
        </div>
      </ScCol>

      <ScCol :span="6">
        <div class="stat-card warning">
          <div class="stat-icon">
            <IconifyIconOnline icon="ri:time-line" :size="32" />
          </div>
          <div class="stat-content">
            <div class="stat-value">
              <ScNumber :value="statistics.avgDuration" :duration="1500" />ms
            </div>
            <div class="stat-label">平均耗时</div>
          </div>
        </div>
      </ScCol>

      <ScCol :span="6">
        <div class="stat-card info">
          <div class="stat-icon">
            <IconifyIconOnline icon="ri:percent-line" :size="32" />
          </div>
          <div class="stat-content">
            <div class="stat-value">
              <ScNumber :value="statistics.successRate" :duration="1500" />%
            </div>
            <div class="stat-label">成功率</div>
          </div>
        </div>
      </ScCol>
    </ScRow>

    <!-- 图表区域 -->
    <ScRow :gutter="16" class="charts-row">
      <ScCol :span="16">
        <div class="chart-container">
          <div class="chart-title">执行趋势</div>
          <ScEcharts :option="trendOption" height="320px" />
        </div>
      </ScCol>

      <ScCol :span="8">
        <div class="chart-container">
          <div class="chart-title">状态分布</div>
          <ScEcharts :option="statusOption" height="320px" />
        </div>
      </ScCol>
    </ScRow>
  </ScCard>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import {
  ScCard,
  ScRow,
  ScCol,
  ScRadio,
  ScRadioButton,
  ScNumber,
  ScEcharts,
} from "@repo/components";
import { IconifyIconOnline } from "@repo/components";

const period = ref("today");

// 统计数据
const statistics = reactive({
  successCount: 0,
  failCount: 0,
  avgDuration: 0,
  successRate: 0,
});

// 趋势数据
const trendData = ref({
  dates: [],
  success: [],
  fail: [],
});

// 加载统计数据
const loadStatistics = async () => {
  // TODO: 调用后端接口获取统计数据
  // 模拟数据
  statistics.successCount = 1258;
  statistics.failCount = 42;
  statistics.avgDuration = 156;
  statistics.successRate = 96.8;

  // 模拟趋势数据
  if (period.value === "today") {
    trendData.value = {
      dates: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
      success: [45, 52, 68, 95, 102, 88, 76],
      fail: [2, 1, 3, 5, 2, 1, 0],
    };
  } else if (period.value === "week") {
    trendData.value = {
      dates: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
      success: [320, 302, 301, 334, 390, 330, 320],
      fail: [12, 8, 15, 10, 6, 9, 11],
    };
  } else {
    trendData.value = {
      dates: ["1日", "5日", "10日", "15日", "20日", "25日", "30日"],
      success: [820, 932, 901, 934, 1290, 1330, 1320],
      fail: [32, 28, 45, 30, 26, 39, 41],
    };
  }
};

// 执行趋势图表配置
const trendOption = computed(() => ({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
  legend: {
    data: ["成功", "失败"],
    bottom: 0,
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "12%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: trendData.value.dates,
    axisLine: {
      lineStyle: {
        color: "#E4E7ED",
      },
    },
    axisLabel: {
      color: "#606266",
    },
  },
  yAxis: {
    type: "value",
    axisLine: {
      lineStyle: {
        color: "#E4E7ED",
      },
    },
    axisLabel: {
      color: "#606266",
    },
    splitLine: {
      lineStyle: {
        color: "#F2F6FC",
      },
    },
  },
  series: [
    {
      name: "成功",
      type: "line",
      data: trendData.value.success,
      smooth: true,
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(103, 194, 58, 0.3)" },
            { offset: 1, color: "rgba(103, 194, 58, 0.05)" },
          ],
        },
      },
      itemStyle: {
        color: "#67C23A",
      },
      lineStyle: {
        width: 3,
      },
    },
    {
      name: "失败",
      type: "line",
      data: trendData.value.fail,
      smooth: true,
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(245, 108, 108, 0.3)" },
            { offset: 1, color: "rgba(245, 108, 108, 0.05)" },
          ],
        },
      },
      itemStyle: {
        color: "#F56C6C",
      },
      lineStyle: {
        width: 3,
      },
    },
  ],
}));

// 状态分布饼图配置
const statusOption = computed(() => ({
  tooltip: {
    trigger: "item",
    formatter: "{b}: {c} ({d}%)",
  },
  legend: {
    orient: "vertical",
    right: 10,
    top: "center",
    textStyle: {
      color: "#606266",
    },
  },
  series: [
    {
      type: "pie",
      radius: ["45%", "70%"],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: "#fff",
        borderWidth: 2,
      },
      label: {
        show: false,
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: "bold",
        },
      },
      data: [
        {
          value: statistics.successCount,
          name: "成功",
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#67C23A" },
                { offset: 1, color: "#85CE61" },
              ],
            },
          },
        },
        {
          value: statistics.failCount,
          name: "失败",
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#F56C6C" },
                { offset: 1, color: "#F78989" },
              ],
            },
          },
        },
      ],
    },
  ],
}));

onMounted(() => {
  loadStatistics();
});
</script>

<style scoped lang="scss">
.job-statistics {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}

.stats-row {
  margin-bottom: 20px;

  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: var(--el-fill-color-lighter);
    border-radius: 12px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      transform: translateY(-4px);
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      color: #fff;
      border-radius: 12px;
    }

    .stat-content {
      flex: 1;

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        line-height: 1.2;
        color: var(--el-text-color-primary);
      }

      .stat-label {
        margin-top: 4px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }

    &.success .stat-icon {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }

    &.error .stat-icon {
      background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
    }

    &.warning .stat-icon {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    &.info .stat-icon {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
  }
}

.charts-row {
  .chart-container {
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 12px;

    .chart-title {
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}

// 响应式适配
@media (max-width: 1200px) {
  .stats-row {
    :deep(.el-col) {
      margin-bottom: 16px;
    }
  }

  .charts-row {
    :deep(.el-col) {
      margin-bottom: 16px;
    }
  }
}
</style>
