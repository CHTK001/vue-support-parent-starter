<template>
  <section class="server-aggregate-page">
    <header class="server-aggregate-page__hero">
      <div>
        <small>TECHUI / AGGREGATE</small>
        <h1>服务器聚合驾驶舱</h1>
        <p>
          聚合多台服务器的核心指标、服务状态和最新告警，作为跨服务器值班大盘使用。
        </p>
      </div>
      <div class="server-aggregate-page__hero-side">
        <span class="server-aggregate-page__badge">
          已选 {{ selectedHosts.length }} 台
        </span>
        <span class="server-aggregate-page__badge">
          告警 {{ aggregateAlerts.length }} / 服务
          {{ aggregateServices.length }}
        </span>
      </div>
    </header>

    <div class="server-aggregate-page__stats">
      <article
        class="server-aggregate-page__stat-card"
        role="button"
        tabindex="0"
        @click="openSummaryDetail('online')"
        @keydown.enter.prevent="openSummaryDetail('online')"
      >
        <small>在线主机</small>
        <strong>{{ onlineCount }}</strong>
        <span>离线 {{ selectedHosts.length - onlineCount }}</span>
      </article>
      <article
        class="server-aggregate-page__stat-card"
        role="button"
        tabindex="0"
        @click="openSummaryDetail('resource')"
        @keydown.enter.prevent="openSummaryDetail('resource')"
      >
        <small>平均 CPU</small>
        <strong>{{ averageCpu }}</strong>
        <span>平均内存 {{ averageMemory }}</span>
      </article>
      <article
        class="server-aggregate-page__stat-card"
        role="button"
        tabindex="0"
        @click="openSummaryDetail('network')"
        @keydown.enter.prevent="openSummaryDetail('network')"
      >
        <small>聚合吞吐</small>
        <strong>{{ totalThroughput }}</strong>
        <span>平均延迟 {{ averageLatency }}</span>
      </article>
      <article
        class="server-aggregate-page__stat-card"
        role="button"
        tabindex="0"
        @click="openSummaryDetail('service')"
        @keydown.enter.prevent="openSummaryDetail('service')"
      >
        <small>异常服务</small>
        <strong>{{ issueServiceCount }}</strong>
        <span>运行中 {{ runningServiceCount }}</span>
      </article>
    </div>

    <div v-loading="loading" class="server-aggregate-page__layout">
      <article
        class="server-aggregate-page__panel server-aggregate-page__panel--wide"
      >
        <div class="server-aggregate-page__panel-head">
          <div>
            <strong>服务器资源横向对比</strong>
            <span>CPU / 内存 / 磁盘 / 吞吐</span>
          </div>
        </div>
        <ScEcharts :option="hostCompareOption" height="360px" />
      </article>

      <article class="server-aggregate-page__panel">
        <div class="server-aggregate-page__panel-head">
          <div>
            <strong>最新告警</strong>
            <span>跨服务器最新事件</span>
          </div>
          <span class="server-aggregate-page__badge is-muted">
            {{ aggregateAlerts.length }} 条
          </span>
        </div>
        <div
          v-if="aggregateAlerts.length"
          class="server-aggregate-page__alert-list"
        >
          <div
            v-for="item in aggregateAlerts"
            :key="
              item.serverAlertEventId ||
              `${item.serverId}-${item.metricType}-${item.createTime}`
            "
            class="server-aggregate-page__alert-item"
            :class="severityClass(item.severity)"
            role="button"
            tabindex="0"
            @click="openAlertDetail(item)"
            @keydown.enter.prevent="openAlertDetail(item)"
          >
            <div class="server-aggregate-page__alert-top">
              <strong>{{
                item.serverCode || `#${item.serverId || "-"}`
              }}</strong>
              <span
                class="server-aggregate-page__badge"
                :class="severityClass(item.severity)"
              >
                {{ severityLabel(item.severity) }}
              </span>
            </div>
            <p>
              {{ metricLabel(item.metricType) }} ·
              {{ item.alertMessage || "已触发告警" }}
            </p>
            <small>{{ item.createTime || "-" }}</small>
          </div>
        </div>
        <el-empty v-else description="当前没有聚合告警" />
      </article>

      <article class="server-aggregate-page__panel">
        <div class="server-aggregate-page__panel-head">
          <div>
            <strong>服务分布</strong>
            <span>运行 / 异常 / 停止</span>
          </div>
          <span class="server-aggregate-page__badge is-muted">
            {{ aggregateServices.length }} 项
          </span>
        </div>
        <ScEcharts :option="serviceDistributionOption" height="240px" />
        <div
          v-if="selectedHosts.length"
          class="server-aggregate-page__host-list"
        >
          <div
            v-for="host in selectedHosts"
            :key="host.serverId"
            class="server-aggregate-page__host-item"
            role="button"
            tabindex="0"
            @click="openHostDetail(host)"
            @keydown.enter.prevent="openHostDetail(host)"
          >
            <div>
              <strong>{{ host.serverName }}</strong>
              <p>{{ host.host || "127.0.0.1" }}</p>
            </div>
            <span
              class="server-aggregate-page__badge"
              :class="hostToneClass(host.serverId)"
            >
              {{
                snapshotByHostId(host.serverId)?.online
                  ? formatMetricPercent(
                      snapshotByHostId(host.serverId)?.cpuUsage,
                    )
                  : "离线"
              }}
            </span>
          </div>
        </div>
      </article>
    </div>

    <el-dialog
      v-model="detailVisible"
      width="760px"
      destroy-on-close
      :title="detailState.title || '聚合卡片详情'"
    >
      <div v-if="detailState.title" class="server-aggregate-page__detail">
        <p class="server-aggregate-page__detail-message">
          {{ detailState.message || "暂无补充信息" }}
        </p>
        <div class="server-aggregate-page__detail-grid">
          <article
            v-for="item in detailState.items"
            :key="item.label"
            class="server-aggregate-page__detail-card"
          >
            <small>{{ item.label }}</small>
            <strong>{{ item.value }}</strong>
          </article>
        </div>
      </div>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import {
  listServerAlerts,
  listServerHostMetrics,
  listServerHosts,
  listServerServices,
  type ServerAlertEvent,
  type ServerHost,
  type ServerMetricsSnapshot,
  type ServerService,
} from "../api";
import {
  formatLatency,
  formatMetricPercent,
  formatThroughput,
  resolveIoTotal,
} from "../utils/serverHost";

const route = useRoute();
const loading = ref(false);
const hosts = ref<ServerHost[]>([]);
const metrics = ref<ServerMetricsSnapshot[]>([]);
const alerts = ref<ServerAlertEvent[]>([]);
const services = ref<ServerService[]>([]);
const detailVisible = ref(false);
const detailState = ref<{
  title: string;
  message: string;
  items: Array<{ label: string; value: string }>;
}>({
  title: "",
  message: "",
  items: [],
});

const selectedIds = computed(() =>
  String(route.query.ids || "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0),
);

const selectedHosts = computed(() =>
  hosts.value.filter((item) =>
    selectedIds.value.includes(Number(item.serverId || 0)),
  ),
);

const selectedMetrics = computed(() =>
  metrics.value.filter((item) =>
    selectedIds.value.includes(Number(item.serverId || 0)),
  ),
);

const aggregateAlerts = computed(() =>
  alerts.value
    .filter((item) => selectedIds.value.includes(Number(item.serverId || 0)))
    .sort((left, right) => {
      const leftTime = new Date(left.createTime || 0).getTime() || 0;
      const rightTime = new Date(right.createTime || 0).getTime() || 0;
      return rightTime - leftTime;
    })
    .slice(0, 8),
);

const aggregateServices = computed(() =>
  services.value.filter((item) =>
    selectedIds.value.includes(Number(item.serverId || 0)),
  ),
);

const onlineCount = computed(
  () => selectedMetrics.value.filter((item) => item.online).length,
);

const averageCpu = computed(() =>
  selectedMetrics.value.length
    ? formatMetricPercent(
        selectedMetrics.value.reduce(
          (sum, item) => sum + Number(item.cpuUsage || 0),
          0,
        ) / selectedMetrics.value.length,
      )
    : "--",
);

const averageMemory = computed(() =>
  selectedMetrics.value.length
    ? formatMetricPercent(
        selectedMetrics.value.reduce(
          (sum, item) => sum + Number(item.memoryUsage || 0),
          0,
        ) / selectedMetrics.value.length,
      )
    : "--",
);

const totalThroughput = computed(() =>
  formatThroughput(
    selectedMetrics.value.reduce((sum, item) => sum + resolveIoTotal(item), 0),
  ),
);

const averageLatency = computed(() =>
  selectedMetrics.value.length
    ? formatLatency(
        selectedMetrics.value.reduce(
          (sum, item) => sum + Number(item.latencyMs || 0),
          0,
        ) / selectedMetrics.value.length,
      )
    : "--",
);

const runningServiceCount = computed(
  () =>
    aggregateServices.value.filter((item) =>
      ["RUNNING", "ACTIVE"].includes(
        String(item.runtimeStatus || "").toUpperCase(),
      ),
    ).length,
);

const issueServiceCount = computed(
  () =>
    aggregateServices.value.filter((item) =>
      ["ERROR", "FAILED", "ISSUE"].includes(
        String(item.runtimeStatus || "").toUpperCase(),
      ),
    ).length,
);

const snapshotByHostId = (serverId?: number) =>
  selectedMetrics.value.find(
    (item) => Number(item.serverId || 0) === Number(serverId || 0),
  ) || null;

const openDetail = (
  title: string,
  message: string,
  items: Array<{ label: string; value: string }>,
) => {
  detailState.value = { title, message, items };
  detailVisible.value = true;
};

const openSummaryDetail = (
  type: "online" | "resource" | "network" | "service",
) => {
  if (type === "online") {
    openDetail("在线主机详情", "聚合维度的在线与离线主机统计。", [
      { label: "已选主机", value: `${selectedHosts.value.length}` },
      { label: "在线", value: `${onlineCount.value}` },
      {
        label: "离线",
        value: `${selectedHosts.value.length - onlineCount.value}`,
      },
    ]);
    return;
  }
  if (type === "resource") {
    openDetail("资源均值详情", "聚合主机的资源平均值。", [
      { label: "平均 CPU", value: averageCpu.value },
      { label: "平均内存", value: averageMemory.value },
      { label: "主机数", value: `${selectedHosts.value.length}` },
    ]);
    return;
  }
  if (type === "network") {
    openDetail("网络聚合详情", "聚合吞吐与平均延迟。", [
      { label: "聚合吞吐", value: totalThroughput.value },
      { label: "平均延迟", value: averageLatency.value },
      { label: "在线主机", value: `${onlineCount.value}` },
    ]);
    return;
  }
  openDetail("服务聚合详情", "跨主机服务运行状态统计。", [
    { label: "异常服务", value: `${issueServiceCount.value}` },
    { label: "运行中", value: `${runningServiceCount.value}` },
    {
      label: "停止",
      value: `${Math.max(aggregateServices.value.length - runningServiceCount.value - issueServiceCount.value, 0)}`,
    },
  ]);
};

const openAlertDetail = (item: ServerAlertEvent) => {
  openDetail(
    `${item.serverCode || `#${item.serverId || "-"}`} · 告警详情`,
    item.alertMessage || "已触发聚合告警",
    [
      { label: "服务器", value: item.serverCode || `#${item.serverId || "-"}` },
      { label: "级别", value: severityLabel(item.severity) },
      { label: "指标", value: metricLabel(item.metricType) },
      { label: "时间", value: item.createTime || "-" },
    ],
  );
};

const openHostDetail = (host: ServerHost) => {
  const snapshot = snapshotByHostId(host.serverId);
  openDetail(
    `${host.serverName} · 主机详情`,
    "聚合视图中的单台主机运行摘要。",
    [
      { label: "地址", value: host.host || "127.0.0.1" },
      { label: "在线状态", value: snapshot?.online ? "在线" : "离线" },
      { label: "CPU", value: formatMetricPercent(snapshot?.cpuUsage) },
      { label: "内存", value: formatMetricPercent(snapshot?.memoryUsage) },
      { label: "磁盘", value: formatMetricPercent(snapshot?.diskUsage) },
      { label: "吞吐", value: formatThroughput(resolveIoTotal(snapshot)) },
    ],
  );
};

const hostCompareOption = computed(() => ({
  tooltip: { trigger: "axis", confine: true },
  legend: {
    top: 0,
    textStyle: { color: "rgba(207, 250, 254, 0.82)" },
  },
  grid: {
    left: 20,
    right: 20,
    top: 40,
    bottom: 24,
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: selectedHosts.value.map(
      (item) => item.serverName || `#${item.serverId || "-"}`,
    ),
    axisLabel: { color: "rgba(207, 250, 254, 0.72)" },
    axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.22)" } },
  },
  yAxis: [
    {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: {
        color: "rgba(207, 250, 254, 0.72)",
        formatter: (value: number) => `${Math.round(value)}%`,
      },
      splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.12)" } },
    },
    {
      type: "value",
      min: 0,
      axisLabel: {
        color: "rgba(207, 250, 254, 0.72)",
        formatter: (value: number) => formatThroughput(value),
      },
      splitLine: { show: false },
    },
  ],
  series: [
    {
      name: "CPU",
      type: "bar",
      data: selectedHosts.value.map((item) =>
        Number(snapshotByHostId(item.serverId)?.cpuUsage || 0),
      ),
      itemStyle: { color: "#38bdf8" },
    },
    {
      name: "内存",
      type: "bar",
      data: selectedHosts.value.map((item) =>
        Number(snapshotByHostId(item.serverId)?.memoryUsage || 0),
      ),
      itemStyle: { color: "#22c55e" },
    },
    {
      name: "磁盘",
      type: "bar",
      data: selectedHosts.value.map((item) =>
        Number(snapshotByHostId(item.serverId)?.diskUsage || 0),
      ),
      itemStyle: { color: "#f59e0b" },
    },
    {
      name: "吞吐",
      type: "line",
      smooth: true,
      yAxisIndex: 1,
      data: selectedHosts.value.map((item) =>
        resolveIoTotal(snapshotByHostId(item.serverId)),
      ),
      lineStyle: { width: 3, color: "#c084fc" },
    },
  ],
}));

const serviceDistributionOption = computed(() => ({
  tooltip: { trigger: "item", confine: true },
  series: [
    {
      type: "pie",
      radius: ["44%", "72%"],
      label: { color: "rgba(207, 250, 254, 0.82)" },
      itemStyle: {
        borderColor: "rgba(8, 47, 73, 0.9)",
        borderWidth: 4,
      },
      data: [
        {
          value: runningServiceCount.value,
          name: "运行中",
          itemStyle: { color: "#22c55e" },
        },
        {
          value: issueServiceCount.value,
          name: "异常",
          itemStyle: { color: "#ef4444" },
        },
        {
          value: Math.max(
            aggregateServices.value.length -
              runningServiceCount.value -
              issueServiceCount.value,
            0,
          ),
          name: "停止",
          itemStyle: { color: "#64748b" },
        },
      ],
    },
  ],
}));

const loadPage = async () => {
  loading.value = true;
  try {
    const [hostResult, metricResult, alertResult, serviceResult] =
      await Promise.all([
        listServerHosts().catch(() => null),
        listServerHostMetrics().catch(() => null),
        listServerAlerts({ limit: 32 }).catch(() => null),
        listServerServices().catch(() => null),
      ]);
    hosts.value = hostResult?.data || [];
    metrics.value = metricResult?.data || [];
    alerts.value = alertResult?.data || [];
    services.value = serviceResult?.data || [];
  } finally {
    loading.value = false;
  }
};

const metricLabel = (value?: string | null) =>
  value === "CPU"
    ? "CPU"
    : value === "MEMORY"
      ? "内存"
      : value === "DISK"
        ? "磁盘"
        : value === "IO"
          ? "网络"
          : value === "LATENCY"
            ? "延迟"
            : value || "指标";

const severityLabel = (value?: string | null) =>
  value === "DANGER" ? "危险" : value === "WARNING" ? "预警" : value || "告警";

const severityClass = (value?: string | null) =>
  value === "DANGER"
    ? "is-danger"
    : value === "WARNING"
      ? "is-warning"
      : "is-muted";

const hostToneClass = (serverId?: number) => {
  const snapshot = snapshotByHostId(serverId);
  if (!snapshot?.online) {
    return "is-muted";
  }
  if (
    Number(snapshot.cpuUsage || 0) >= 85 ||
    Number(snapshot.memoryUsage || 0) >= 90 ||
    Number(snapshot.diskUsage || 0) >= 90
  ) {
    return "is-warning";
  }
  return "is-success";
};

watch(
  () => route.query.ids,
  () => {
    void loadPage();
  },
);

onMounted(() => {
  void loadPage();
});
</script>

<style scoped lang="scss">
.server-aggregate-page {
  display: grid;
  gap: 20px;
  min-height: calc(100vh - 140px);
  padding: 20px;
  color: #ecfeff;
  background:
    radial-gradient(
      circle at top left,
      rgba(14, 165, 233, 0.2),
      transparent 28%
    ),
    radial-gradient(
      circle at top right,
      rgba(245, 158, 11, 0.12),
      transparent 20%
    ),
    linear-gradient(150deg, #040b16 0%, #0c2134 55%, #10263d 100%);
}

.server-aggregate-page__hero,
.server-aggregate-page__stat-card,
.server-aggregate-page__panel {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(34, 211, 238, 0.14);
  background:
    linear-gradient(180deg, rgba(6, 24, 36, 0.82), rgba(5, 17, 29, 0.88)),
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.08), transparent 36%);
  box-shadow:
    0 24px 48px rgba(2, 6, 23, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(18px);
}

.server-aggregate-page__hero::after,
.server-aggregate-page__stat-card::after,
.server-aggregate-page__panel::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), transparent 28%);
}

.server-aggregate-page__hero,
.server-aggregate-page__panel-head,
.server-aggregate-page__alert-top,
.server-aggregate-page__host-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.server-aggregate-page__hero {
  padding: 26px 28px;
}

.server-aggregate-page__hero small,
.server-aggregate-page__hero p,
.server-aggregate-page__badge,
.server-aggregate-page__stat-card span,
.server-aggregate-page__stat-card small,
.server-aggregate-page__alert-item small,
.server-aggregate-page__host-item p {
  color: rgba(165, 243, 252, 0.84);
}

.server-aggregate-page__hero h1 {
  margin: 8px 0 10px;
  font-size: 36px;
  color: #f0fdff;
}

.server-aggregate-page__hero-side,
.server-aggregate-page__stats,
.server-aggregate-page__layout,
.server-aggregate-page__alert-list,
.server-aggregate-page__host-list {
  display: grid;
  gap: 16px;
}

.server-aggregate-page__hero-side {
  align-content: start;
}

.server-aggregate-page__stats {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.server-aggregate-page__stat-card,
.server-aggregate-page__panel {
  display: grid;
  gap: 12px;
  padding: 22px;
}

.server-aggregate-page__stat-card strong,
.server-aggregate-page__panel strong,
.server-aggregate-page__alert-item strong,
.server-aggregate-page__host-item strong {
  color: #f0fdff;
}

.server-aggregate-page__stat-card,
.server-aggregate-page__alert-item,
.server-aggregate-page__host-item {
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.server-aggregate-page__stat-card:hover,
.server-aggregate-page__alert-item:hover,
.server-aggregate-page__host-item:hover {
  transform: translateY(-3px);
  border-color: rgba(56, 189, 248, 0.26);
  box-shadow: 0 22px 34px rgba(2, 6, 23, 0.28);
}

.server-aggregate-page__stat-card strong {
  font-size: 30px;
  line-height: 1;
}

.server-aggregate-page__badge {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(8, 47, 73, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.server-aggregate-page__badge.is-muted {
  background: rgba(8, 47, 73, 0.54);
}

.server-aggregate-page__badge.is-warning {
  background: rgba(245, 158, 11, 0.18);
  color: #fde68a;
}

.server-aggregate-page__badge.is-danger {
  background: rgba(239, 68, 68, 0.18);
  color: #fecaca;
}

.server-aggregate-page__badge.is-success {
  background: rgba(34, 197, 94, 0.18);
  color: #bbf7d0;
}

.server-aggregate-page__layout {
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
  align-items: start;
}

.server-aggregate-page__panel--wide {
  grid-row: span 2;
}

.server-aggregate-page__alert-list,
.server-aggregate-page__host-list {
  gap: 10px;
}

.server-aggregate-page__alert-item,
.server-aggregate-page__host-item {
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid rgba(34, 211, 238, 0.14);
  background:
    linear-gradient(180deg, rgba(6, 24, 36, 0.5), rgba(4, 16, 26, 0.44));
}

.server-aggregate-page__alert-item.is-warning {
  border-color: rgba(245, 158, 11, 0.28);
}

.server-aggregate-page__alert-item.is-danger {
  border-color: rgba(239, 68, 68, 0.28);
}

.server-aggregate-page__alert-item p {
  margin: 0;
  line-height: 1.6;
}

.server-aggregate-page__detail {
  display: grid;
  gap: 14px;
}

.server-aggregate-page__detail-message {
  margin: 0;
  line-height: 1.7;
  color: #475569;
}

.server-aggregate-page__detail-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.server-aggregate-page__detail-card {
  display: grid;
  gap: 6px;
  padding: 18px;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(148, 163, 184, 0.12), rgba(148, 163, 184, 0.08));
}

.server-aggregate-page__detail-card small {
  color: #64748b;
}

.server-aggregate-page__detail-card strong {
  color: #0f172a;
}

@media (max-width: 1100px) {
  .server-aggregate-page__stats,
  .server-aggregate-page__layout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .server-aggregate-page__panel--wide {
    grid-row: auto;
    grid-column: span 2;
  }
}

@media (max-width: 900px) {
  .server-aggregate-page__hero,
  .server-aggregate-page__stats,
  .server-aggregate-page__layout,
  .server-aggregate-page__detail-grid {
    display: grid;
    grid-template-columns: 1fr;
  }

  .server-aggregate-page__panel--wide {
    grid-column: auto;
  }

  .server-aggregate-page__hero h1 {
    font-size: 28px;
  }
}
</style>
