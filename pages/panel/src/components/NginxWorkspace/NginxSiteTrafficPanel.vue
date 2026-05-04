<template>
  <div class="site-traffic-panel">
    <div class="site-traffic-panel__header">
      <div>
        <strong>站点访问分析</strong>
        <span>站点卡片支持按访问数、QPS、TPS 切换，点击站点后查看 IP 与趋势。</span>
      </div>
      <ElRadioGroup v-model="metricTab" size="small">
        <ElRadioButton label="requests">访问数</ElRadioButton>
        <ElRadioButton label="qps">QPS</ElRadioButton>
        <ElRadioButton label="tps">TPS</ElRadioButton>
      </ElRadioGroup>
    </div>

    <div v-loading="siteLoading" class="site-traffic-panel__body">
      <div v-if="!sites.length" class="site-traffic-panel__empty">
        <ElEmpty description="当前未发现可分析的站点 access_log" :image-size="52" />
      </div>

      <template v-else>
        <div class="site-card-grid">
          <button
            v-for="site in sites"
            :key="site.siteKey"
            type="button"
            class="site-card"
            :class="{ 'is-active': selectedSiteKey === site.siteKey }"
            @click="selectSite(site)"
          >
            <div class="site-card__top">
              <strong>{{ site.siteName }}</strong>
              <span>{{ metricTitle }}</span>
            </div>
            <div class="site-card__metric">
              {{ formatMetric(site) }}
            </div>
            <div class="site-card__meta">
              <span>{{ formatInteger(site.requests) }} 次请求</span>
              <span>{{ site.uniqueIps }} 个 IP</span>
            </div>
            <div class="site-card__log">{{ site.logPath }}</div>
          </button>
        </div>

        <div v-if="selectedSite" class="site-detail-grid">
          <div class="site-detail-card">
            <div class="site-detail-card__head">
              <strong>{{ selectedSite.siteName }} Top IP</strong>
              <span>{{ selectedSite.logPath }}</span>
            </div>
            <div v-if="!selectedSite.topIps?.length" class="site-detail-card__empty">
              <ElEmpty description="暂无 IP 数据" :image-size="40" />
            </div>
            <table v-else class="ip-detail-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>IP</th>
                  <th>请求数</th>
                  <th>占比</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in selectedSite.topIps"
                  :key="item.ip"
                  :class="{ 'is-active': selectedIp === item.ip, 'is-top3': index < 3 }"
                  @click="selectIp(item.ip)"
                >
                  <td class="ip-rank">
                    <span class="rank-badge" :class="`rank-${index + 1}`">{{ index + 1 }}</span>
                  </td>
                  <td class="ip-addr">{{ item.ip }}</td>
                  <td class="ip-count">{{ formatInteger(item.requests) }}</td>
                  <td class="ip-bar-cell">
                    <div class="ip-bar">
                      <div
                        class="ip-bar__fill"
                        :class="{ 'ip-bar__fill--hot': index < 3 }"
                        :style="{ width: `${item.percent}%` }"
                      />
                      <span class="ip-bar__label">{{ item.percent.toFixed(1) }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="site-detail-card">
            <div class="site-detail-card__head site-detail-card__head--chart">
              <div>
                <strong>{{ selectedIp || "选择 IP" }} 访问趋势</strong>
                <span>点击左侧 IP，查看分钟 / 小时 / 天维度的访问变化。</span>
              </div>
              <div class="site-detail-card__actions">
                <ElTabs v-model="granularity" class="site-detail-tabs" @tab-change="reloadTrend">
                  <ElTabPane label="分钟" name="minute" />
                  <ElTabPane label="小时" name="hour" />
                  <ElTabPane label="天" name="day" />
                </ElTabs>
                <ElRadioGroup v-model="chartMode" size="small">
                  <ElRadioButton label="line">折线</ElRadioButton>
                  <ElRadioButton label="bar">柱状</ElRadioButton>
                </ElRadioGroup>
              </div>
            </div>
            <div v-loading="trendLoading" class="site-trend-chart">
              <ScEcharts v-if="selectedIp" :option="trendChartOption" height="300px" />
              <ElEmpty v-else description="先选择一个 IP" :image-size="44" />
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  ElEmpty,
  ElRadioButton,
  ElRadioGroup,
  ElTabs,
  ElTabPane,
} from "element-plus";
import ScEcharts from "@repo/components/ScEcharts";
import {
  fetchNginxSiteTraffic,
  fetchNginxTrafficTrend,
  type NginxSiteTraffic,
  type NginxTrafficTrend,
} from "../../api/nginx";

const props = defineProps<{
  connectionId: string;
}>();

type MetricTab = "requests" | "qps" | "tps";
type Granularity = "minute" | "hour" | "day";
type ChartMode = "line" | "bar";

const sites = ref<NginxSiteTraffic[]>([]);
const selectedSiteKey = ref("");
const selectedIp = ref("");
const siteLoading = ref(false);
const trendLoading = ref(false);
const trend = ref<NginxTrafficTrend | null>(null);
const metricTab = ref<MetricTab>("requests");
const granularity = ref<Granularity>("minute");
const chartMode = ref<ChartMode>("line");

const selectedSite = computed(() =>
  sites.value.find(item => item.siteKey === selectedSiteKey.value) || null,
);

const metricTitle = computed(() => {
  if (metricTab.value === "qps") return "QPS";
  if (metricTab.value === "tps") return "TPS";
  return "访问数";
});

const formatInteger = (value?: number) => `${Math.round(Number(value || 0)).toLocaleString("zh-CN")}`;

const formatMetric = (site: NginxSiteTraffic) => {
  if (metricTab.value === "qps") return site.qps.toFixed(2);
  if (metricTab.value === "tps") return site.tps.toFixed(2);
  return formatInteger(site.requests);
};

const trendChartOption = computed(() => {
  const labels = trend.value?.points?.map(item => item.label) || [];
  const values = trend.value?.points?.map(item => item.requests) || [];
  return {
    tooltip: {
      trigger: "axis",
      confine: true,
    },
    grid: {
      left: 18,
      right: 18,
      top: 20,
      bottom: 36,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: {
        color: "#64748b",
        rotate: granularity.value === "minute" ? 0 : 24,
      },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: {
        color: "#64748b",
      },
    },
    series: [
      {
        type: chartMode.value,
        smooth: chartMode.value === "line",
        data: values,
        showSymbol: chartMode.value === "line",
        itemStyle: {
          color: "#3b82f6",
        },
        areaStyle: chartMode.value === "line" ? {
          color: "rgba(59,130,246,0.14)",
        } : undefined,
        barWidth: chartMode.value === "bar" ? 18 : undefined,
      },
    ],
  };
});

const selectSite = (site: NginxSiteTraffic) => {
  selectedSiteKey.value = site.siteKey;
  selectedIp.value = site.topIps?.[0]?.ip || "";
  reloadTrend();
};

const selectIp = (ip: string) => {
  selectedIp.value = ip;
  reloadTrend();
};

const reloadSites = async () => {
  siteLoading.value = true;
  try {
    const res = await fetchNginxSiteTraffic(props.connectionId, 10);
    sites.value = res?.data || [];
    if (!selectedSiteKey.value && sites.value.length > 0) {
      selectSite(sites.value[0]);
    } else if (selectedSite.value && !selectedIp.value) {
      selectedIp.value = selectedSite.value.topIps?.[0]?.ip || "";
    }
  } finally {
    siteLoading.value = false;
  }
};

const reloadTrend = async () => {
  if (!selectedSiteKey.value || !selectedIp.value) {
    trend.value = null;
    return;
  }
  trendLoading.value = true;
  try {
    const res = await fetchNginxTrafficTrend(
      props.connectionId,
      selectedSiteKey.value,
      selectedIp.value,
      granularity.value,
    );
    trend.value = res?.data || null;
  } finally {
    trendLoading.value = false;
  }
};

onMounted(reloadSites);
</script>

<style scoped lang="scss">
.site-traffic-panel {
  display: grid;
  gap: 14px;
}

.site-traffic-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;

  strong {
    display: block;
    color: #0f172a;
    font-size: 17px;
  }

  span {
    display: block;
    margin-top: 4px;
    color: #64748b;
    font-size: 12px;
  }
}

.site-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.site-card {
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  background: linear-gradient(180deg, #fff, #f8fbff);
  text-align: left;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  cursor: pointer;

  &:hover,
  &.is-active {
    transform: translateY(-2px);
    border-color: rgba(59, 130, 246, 0.32);
    box-shadow: 0 16px 30px rgba(59, 130, 246, 0.1);
  }
}

.site-card__top {
  display: flex;
  justify-content: space-between;
  gap: 10px;

  strong {
    color: #0f172a;
    font-size: 14px;
  }

  span {
    color: #64748b;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
}

.site-card__metric {
  font-size: 30px;
  font-weight: 700;
  color: #1d4ed8;
}

.site-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #64748b;
  font-size: 12px;
}

.site-card__log {
  color: #94a3b8;
  font-size: 11px;
  word-break: break-all;
}

.site-detail-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.82fr) minmax(0, 1.18fr);
  gap: 12px;
}

.site-detail-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.site-detail-card__head {
  display: grid;
  gap: 4px;

  strong {
    color: #0f172a;
    font-size: 15px;
  }

  span {
    color: #64748b;
    font-size: 12px;
    word-break: break-all;
  }
}

.site-detail-card__head--chart {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 12px;
}

.site-detail-card__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.site-detail-card__empty {
  min-height: 180px;
  display: grid;
  place-items: center;
}

.ip-detail-table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.07);
    font-size: 12.5px;
    text-align: left;
  }

  th {
    color: #64748b;
    background: rgba(248, 250, 252, 0.9);
    font-weight: 600;
    white-space: nowrap;
  }

  tbody tr {
    cursor: pointer;
  }

  tbody tr:hover td {
    background: rgba(99, 102, 241, 0.04);
  }

  tbody tr.is-top3 td {
    background: rgba(249, 115, 22, 0.03);
  }

  tbody tr.is-active {
    td {
      background: rgba(59, 130, 246, 0.08);
    }
  }
}

.ip-rank {
  width: 42px;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(148, 163, 184, 0.15);
  color: #64748b;
}

.rank-1 {
  background: rgba(245, 158, 11, 0.2);
  color: #d97706;
}

.rank-2 {
  background: rgba(148, 163, 184, 0.25);
  color: #475569;
}

.rank-3 {
  background: rgba(180, 83, 9, 0.15);
  color: #b45309;
}

.ip-addr {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: #1e293b;
  font-weight: 600;
}

.ip-count {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: #6366f1;
  font-weight: 600;
  white-space: nowrap;
}

.ip-bar-cell {
  min-width: 120px;
}

.ip-bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 16px;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.1);
}

.ip-bar__fill {
  height: 100%;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.4);
  transition: width 0.3s ease;
}

.ip-bar__fill--hot {
  background: rgba(249, 115, 22, 0.5);
}

.ip-bar__label {
  position: absolute;
  right: 6px;
  font-size: 10px;
  color: #475569;
  font-weight: 600;
}

.site-trend-chart {
  min-height: 320px;
}

.site-detail-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.site-traffic-panel__empty {
  min-height: 260px;
  display: grid;
  place-items: center;
}

@media (max-width: 1100px) {
  .site-traffic-panel__header,
  .site-detail-card__head--chart,
  .site-detail-grid {
    grid-template-columns: 1fr;
  }

  .site-detail-card__actions {
    flex-wrap: wrap;
  }
}

// ── Dark Mode ──
:global(html.dark) {
  .site-traffic-panel__header {
    strong { color: #e2e8f0; }
    span { color: #64748b; }
  }

  .site-card {
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.7), rgba(20, 30, 48, 0.65));
    border-color: rgba(148, 163, 184, 0.1);
    &:hover, &.is-active {
      border-color: rgba(59, 130, 246, 0.35);
      box-shadow: 0 16px 30px rgba(59, 130, 246, 0.08);
    }
  }
  .site-card__top {
    strong { color: #e2e8f0; }
    span { color: #64748b; }
  }
  .site-card__metric { color: #60a5fa; }
  .site-card__meta { color: #64748b; }
  .site-card__log { color: #475569; }

  .site-detail-card {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(148, 163, 184, 0.1);
  }
  .site-detail-card__head {
    strong { color: #e2e8f0; }
    span { color: #64748b; }
  }

  .ip-detail-table {
    th {
      color: #64748b;
      background: rgba(15, 23, 42, 0.5);
      border-bottom-color: rgba(148, 163, 184, 0.08);
    }
    td { border-bottom-color: rgba(148, 163, 184, 0.06); }
    tbody tr:hover td { background: rgba(99, 102, 241, 0.06); }
    tbody tr.is-top3 td { background: rgba(249, 115, 22, 0.06); }
    tbody tr.is-active td { background: rgba(59, 130, 246, 0.1); }
  }
  .ip-addr { color: #e2e8f0; }
  .ip-count { color: #a5b4fc; }
  .ip-bar { background: rgba(148, 163, 184, 0.08); }
  .ip-bar__fill {
    background: rgba(99, 102, 241, 0.5);
    &--hot { background: rgba(249, 115, 22, 0.6); }
  }
  .ip-bar__label { color: #94a3b8; }

  .rank-badge { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
  .rank-1 { background: rgba(245, 158, 11, 0.25); color: #fbbf24; }
  .rank-2 { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }
  .rank-3 { background: rgba(180, 83, 9, 0.2); color: #f59e0b; }
}
</style>
