<template>
  <section class="spider-overview">
    <div class="spider-overview__stats">
      <article v-for="item in stats" :key="item.label" class="stat-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.tip }}</small>
      </article>
    </div>

    <div class="spider-overview__main">
      <article class="panel-card panel-card--trend">
        <div class="panel-card__head">
          <div class="panel-card__title">
            <strong>时间趋势区</strong>
            <span>最近 7 天解析与结果</span>
          </div>
          <div class="panel-card__tabs">
            <button
              v-for="item in trendTabs"
              :key="item.value"
              type="button"
              :class="{ 'is-active': trendTab === item.value }"
              @click="trendTab = item.value"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <div v-if="trendPoints.length" class="trend-panel">
          <ScEcharts
            v-if="trendTab !== 'table'"
            :option="trendChartOption"
            height="248px"
          />

          <div v-else class="trend-table">
            <table>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>解析</th>
                  <th>结果</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="point in trendPoints" :key="point.spiderDateLabel">
                  <td>{{ point.spiderDateLabel }}</td>
                  <td>{{ point.spiderParseCount }}</td>
                  <td>{{ point.spiderResultCount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="panel-card__empty">
          <span>{{ loading ? "加载中..." : "暂无趋势数据" }}</span>
        </div>
      </article>

      <article class="panel-card panel-card--portrait">
        <div class="panel-card__head">
          <div class="panel-card__title">
            <strong>站点画像</strong>
            <span>{{ sitePortraits.length }} 个站点</span>
          </div>
        </div>
        <ul v-if="sitePortraits.length" class="site-list">
          <li v-for="item in sitePortraits" :key="item.siteHost">
            <div class="site-list__main">
              <strong>{{ item.siteHost }}</strong>
              <small>运行 {{ item.spiderRunningCount }} / 告警 {{ item.spiderWarningCount }}</small>
            </div>
            <div class="site-list__metrics">
              <span>{{ item.spiderUrlCount }} 地址</span>
              <span>{{ item.spiderResultCount }} 结果</span>
            </div>
          </li>
        </ul>
        <div v-else class="panel-card__empty">
          <span>{{ loading ? "加载中..." : "暂无站点数据" }}</span>
        </div>
      </article>
    </div>

    <article class="panel-card panel-card--status">
      <div class="panel-card__head">
        <div class="panel-card__title">
          <strong>运行状态</strong>
          <span>{{ loading ? "同步中" : "已同步" }}</span>
        </div>
      </div>
      <ul class="status-list">
        <li>
          <span>运行中爬虫</span>
          <strong>{{ summary.spiderRunningCount }}</strong>
        </li>
        <li>
          <span>待处理地址</span>
          <strong>{{ summary.spiderRemainingUrlCount }}</strong>
        </li>
        <li>
          <span>已解析地址</span>
          <strong>{{ summary.spiderParsedUrlCount }}</strong>
        </li>
        <li>
          <span>解析结果</span>
          <strong>{{ summary.spiderResultCount }}</strong>
        </li>
      </ul>
      <p v-if="errorMessage" class="panel-card__error">{{ errorMessage }}</p>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import * as echarts from "echarts";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import { loadSpiderDashboardSummary } from "../../../api/spider";
import type { SpiderDashboardSummary } from "../../../types/orchestration";

type TrendTab = "line" | "bar" | "table";

const trendTabs: Array<{ value: TrendTab; label: string }> = [
  { value: "line", label: "折线图" },
  { value: "bar", label: "柱状图" },
  { value: "table", label: "表格" },
];

const loading = ref(false);
const errorMessage = ref("");
const trendTab = ref<TrendTab>("line");
const summary = ref<SpiderDashboardSummary>({
  spiderTotalCount: 0,
  spiderRunningCount: 0,
  spiderUrlCount: 0,
  spiderParsedUrlCount: 0,
  spiderResultCount: 0,
  spiderRemainingUrlCount: 0,
  spiderSitePortraits: [],
  spiderTimeTrends: [],
});

const stats = computed(() => [
  {
    label: "爬虫数量",
    value: `${summary.value.spiderTotalCount} / ${summary.value.spiderRunningCount}`,
    tip: "总数 / 运行中",
  },
  {
    label: "地址数量",
    value: String(summary.value.spiderUrlCount),
    tip: "队列累计地址",
  },
  {
    label: "地址解析数量",
    value: String(summary.value.spiderParsedUrlCount),
    tip: "已完成 URL 解析",
  },
  {
    label: "解析结果数量",
    value: String(summary.value.spiderResultCount),
    tip: "中间结果表累计",
  },
  {
    label: "剩余地址数量",
    value: String(summary.value.spiderRemainingUrlCount),
    tip: "当前待处理",
  },
]);

const sitePortraits = computed(() => summary.value.spiderSitePortraits || []);
const trendPoints = computed(() => summary.value.spiderTimeTrends || []);

const trendChartOption = computed(() => {
  const xAxis = trendPoints.value.map(item => item.spiderDateLabel);
  const parseSeries = trendPoints.value.map(item => item.spiderParseCount || 0);
  const resultSeries = trendPoints.value.map(item => item.spiderResultCount || 0);
  const commonSeries = {
    smooth: true,
    symbol: "circle",
    symbolSize: 6,
  };

  return {
    animationDuration: 300,
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(15, 23, 42, 0.92)",
      borderWidth: 0,
      textStyle: { color: "#f8fafc" },
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: "#64748b",
        fontSize: 12,
      },
    },
    grid: {
      top: 36,
      left: 12,
      right: 12,
      bottom: 12,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: xAxis,
      boundaryGap: trendTab.value === "bar",
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#e2e8f0" } },
      axisLabel: { color: "#94a3b8", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      splitNumber: 4,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#eef2f7" } },
      axisLabel: { color: "#94a3b8", fontSize: 11 },
    },
    color: ["#0f766e", "#2563eb"],
    series: trendTab.value === "bar"
      ? [
          {
            name: "解析",
            type: "bar",
            barMaxWidth: 18,
            data: parseSeries,
            itemStyle: {
              borderRadius: [6, 6, 0, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#34d399" },
                { offset: 1, color: "#0f766e" },
              ]),
            },
          },
          {
            name: "结果",
            type: "bar",
            barMaxWidth: 18,
            data: resultSeries,
            itemStyle: {
              borderRadius: [6, 6, 0, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#60a5fa" },
                { offset: 1, color: "#2563eb" },
              ]),
            },
          },
        ]
      : [
          {
            ...commonSeries,
            name: "解析",
            type: "line",
            data: parseSeries,
            lineStyle: { width: 2, color: "#0f766e" },
            itemStyle: { color: "#0f766e" },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(15, 118, 110, 0.18)" },
                { offset: 1, color: "rgba(15, 118, 110, 0.02)" },
              ]),
            },
          },
          {
            ...commonSeries,
            name: "结果",
            type: "line",
            data: resultSeries,
            lineStyle: { width: 2, color: "#2563eb" },
            itemStyle: { color: "#2563eb" },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(37, 99, 235, 0.14)" },
                { offset: 1, color: "rgba(37, 99, 235, 0.02)" },
              ]),
            },
          },
        ],
  };
});

const loadSummary = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    summary.value = await loadSpiderDashboardSummary();
  } catch (error) {
    errorMessage.value = `总览接口失败：${String(error)}`;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadSummary();
});
</script>

<style scoped lang="scss">
.spider-overview {
  min-height: 100%;
  padding: 10px;
  display: grid;
  gap: 10px;
  background: #f3f5f7;
}

.spider-overview__stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.stat-card,
.panel-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
}

.stat-card {
  display: grid;
  gap: 2px;
  padding: 10px 12px;

  span {
    color: #64748b;
    font-size: 11px;
    line-height: 1.2;
  }

  strong {
    color: #0f172a;
    font-size: 20px;
    line-height: 1.15;
    font-weight: 700;
  }

  small {
    color: #94a3b8;
    font-size: 10px;
    line-height: 1.2;
  }
}

.spider-overview__main {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.75fr);
  gap: 10px;
}

.panel-card {
  padding: 12px;
}

.panel-card--trend {
  min-height: 0;
}

.panel-card__head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.panel-card__title {
  display: grid;
  gap: 2px;

  strong {
    color: #0f172a;
    font-size: 13px;
    line-height: 1.2;
  }

  span {
    color: #94a3b8;
    font-size: 11px;
    line-height: 1.2;
  }
}

.panel-card__tabs {
  display: flex;
  gap: 6px;

  button {
    height: 26px;
    padding: 0 8px;
    border: 1px solid #dbe3ee;
    border-radius: 7px;
    background: #f8fafc;
    color: #475569;
    cursor: pointer;
    font-size: 11px;
    line-height: 1;
  }

  .is-active {
    background: #e0f2fe;
    border-color: #bae6fd;
    color: #0369a1;
  }
}

.panel-card__empty,
.panel-card__error {
  min-height: 96px;
  display: grid;
  place-items: center;
  color: #64748b;
  font-size: 12px;
}

.panel-card__error {
  min-height: auto;
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fff7ed;
  color: #c2410c;
}

.trend-table table {
  width: 100%;
  border-collapse: collapse;
}

.trend-table th,
.trend-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #eef2f7;
  text-align: left;
  font-size: 12px;
}

.trend-table th {
  color: #64748b;
  font-weight: 600;
}

.trend-table td {
  color: #0f172a;
}

.site-list,
.status-list {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.site-list li,
.status-list li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  padding: 9px 10px;
  border-radius: 8px;
  background: #f8fafc;
}

.site-list__main {
  display: grid;
  gap: 2px;

  strong {
    color: #0f172a;
    font-size: 12px;
    line-height: 1.2;
  }

  small {
    color: #64748b;
    font-size: 10px;
    line-height: 1.2;
  }
}

.site-list__metrics {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  span {
    color: #0f766e;
    font-weight: 600;
    font-size: 11px;
    white-space: nowrap;
  }
}

.status-list {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.status-list li {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.status-list span {
  color: #64748b;
  font-size: 11px;
}

.status-list strong {
  color: #0f172a;
  font-size: 18px;
  line-height: 1.1;
}

@media (max-width: 1180px) {
  .spider-overview__stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .spider-overview__main {
    grid-template-columns: 1fr;
  }

  .status-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .spider-overview {
    padding: 8px;
  }

  .spider-overview__stats,
  .status-list {
    grid-template-columns: 1fr;
  }

  .panel-card__head,
  .site-list li {
    align-items: flex-start;
    flex-direction: column;
  }

  .panel-card__tabs {
    flex-wrap: wrap;
  }
}
</style>
