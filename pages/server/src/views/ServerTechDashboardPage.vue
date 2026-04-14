<template>
  <section class="server-tech-page">
    <header class="server-tech-page__hero">
      <div>
        <small>TECHUI / SERVER</small>
        <h1>
          {{
            currentHost?.serverName || route.query.serverName || "服务器大屏"
          }}
        </h1>
        <p>实时聚合指标、告警和服务状态，作为单机运行态驾驶舱使用。</p>
      </div>
      <div class="server-tech-page__meta">
        <span class="server-tech-page__chip">
          serverId {{ currentHost?.serverId || route.query.serverId || "-" }}
        </span>
        <span class="server-tech-page__chip">
          {{
            currentSnapshot?.online
              ? `在线 · ${formatLatency(currentSnapshot?.latencyMs)}`
              : "离线或等待心跳"
          }}
        </span>
        <span class="server-tech-page__chip">
          服务 {{ services.length }} / 告警 {{ alerts.length }}
        </span>
      </div>
    </header>

    <div class="server-tech-page__stats">
      <article
        class="server-tech-page__stat-card is-cpu"
        role="button"
        tabindex="0"
        @click="openMetricDetail('CPU')"
        @keydown.enter.prevent="openMetricDetail('CPU')"
      >
        <small>CPU</small>
        <strong>{{ formatMetricPercent(currentSnapshot?.cpuUsage) }}</strong>
        <span>{{ currentSnapshot?.cpuCores || "--" }} 核</span>
      </article>
      <article
        class="server-tech-page__stat-card is-memory"
        role="button"
        tabindex="0"
        @click="openMetricDetail('MEMORY')"
        @keydown.enter.prevent="openMetricDetail('MEMORY')"
      >
        <small>内存</small>
        <strong>{{ formatMetricPercent(currentSnapshot?.memoryUsage) }}</strong>
        <span>
          {{ formatByteSize(currentSnapshot?.memoryUsedBytes) }} /
          {{ formatByteSize(currentSnapshot?.memoryTotalBytes) }}
        </span>
      </article>
      <article
        class="server-tech-page__stat-card is-disk"
        role="button"
        tabindex="0"
        @click="openMetricDetail('DISK')"
        @keydown.enter.prevent="openMetricDetail('DISK')"
      >
        <small>磁盘</small>
        <strong>{{ formatMetricPercent(currentSnapshot?.diskUsage) }}</strong>
        <span>
          {{ formatByteSize(currentSnapshot?.diskUsedBytes) }} /
          {{ formatByteSize(currentSnapshot?.diskTotalBytes) }}
        </span>
      </article>
      <article
        class="server-tech-page__stat-card is-io"
        role="button"
        tabindex="0"
        @click="openMetricDetail('IO')"
        @keydown.enter.prevent="openMetricDetail('IO')"
      >
        <small>网络</small>
        <strong>{{ formatThroughput(ioTotal) }}</strong>
        <span>
          入 {{ formatThroughput(currentSnapshot?.ioReadBytesPerSecond) }} · 出
          {{ formatThroughput(currentSnapshot?.ioWriteBytesPerSecond) }}
        </span>
      </article>
    </div>

    <div v-loading="loading" class="server-tech-page__layout">
      <article class="server-tech-page__panel server-tech-page__panel--chart">
        <div class="server-tech-page__panel-head">
          <div>
            <strong>120 分钟综合趋势</strong>
            <span>CPU / 内存 / 磁盘 / 吞吐</span>
          </div>
          <span class="server-tech-page__chip is-muted">
            样本 {{ history.length }}
          </span>
        </div>
        <ScEcharts :option="historyChartOption" height="320px" />
      </article>

      <article class="server-tech-page__panel">
        <div class="server-tech-page__panel-head">
          <div>
            <strong>最新告警</strong>
            <span>按触发时间倒序</span>
          </div>
          <span class="server-tech-page__chip is-muted">
            {{ alerts.length }} 条
          </span>
        </div>
        <div v-if="alerts.length" class="server-tech-page__alert-list">
          <div
            v-for="item in alerts"
            :key="
              item.serverAlertEventId || `${item.metricType}-${item.createTime}`
            "
            class="server-tech-page__alert-item"
            :class="severityClass(item.severity)"
            role="button"
            tabindex="0"
            @click="openAlertDetail(item)"
            @keydown.enter.prevent="openAlertDetail(item)"
          >
            <div class="server-tech-page__alert-top">
              <strong>{{ metricLabel(item.metricType) }}</strong>
              <span
                class="server-tech-page__chip"
                :class="severityClass(item.severity)"
              >
                {{ severityLabel(item.severity) }}
              </span>
            </div>
            <p>{{ item.alertMessage || "已触发实时预警" }}</p>
            <small>{{ item.createTime || "-" }}</small>
          </div>
        </div>
        <el-empty v-else description="当前没有最新预警" />
      </article>

      <article class="server-tech-page__panel">
        <div class="server-tech-page__panel-head">
          <div>
            <strong>服务态势</strong>
            <span>运行 / 异常 / 停止</span>
          </div>
          <span class="server-tech-page__chip is-muted">
            {{ services.length }} 项
          </span>
        </div>
        <ScEcharts :option="serviceChartOption" height="260px" />
        <div v-if="services.length" class="server-tech-page__service-list">
          <div
            v-for="item in services.slice(0, 6)"
            :key="item.serverServiceId || item.serviceCode || item.serviceName"
            class="server-tech-page__service-item"
            role="button"
            tabindex="0"
            @click="openServiceDetail(item)"
            @keydown.enter.prevent="openServiceDetail(item)"
          >
            <div>
              <strong>{{ item.serviceName }}</strong>
              <p>{{ item.installPath || "未配置安装目录" }}</p>
            </div>
            <span
              class="server-tech-page__chip"
              :class="serviceToneClass(item.runtimeStatus)"
            >
              {{ item.runtimeStatus || "UNKNOWN" }}
            </span>
          </div>
        </div>
        <el-empty v-else description="当前服务器还没有服务档案" />
      </article>
    </div>

    <el-dialog
      v-model="detailVisible"
      width="760px"
      destroy-on-close
      :title="detailState.title || '卡片详情'"
    >
      <div v-if="detailState.title" class="server-tech-page__detail">
        <p class="server-tech-page__detail-message">
          {{ detailState.message || "暂无补充信息" }}
        </p>
        <div class="server-tech-page__detail-grid">
          <article
            v-for="item in detailState.items"
            :key="item.label"
            class="server-tech-page__detail-card"
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
  getServerHostMetricsHistory,
  type ServerAlertEvent,
  type ServerHost,
  type ServerMetricsSnapshot,
  type ServerService,
} from "../api";
import {
  formatByteSize,
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
const history = ref<ServerMetricsSnapshot[]>([]);
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

const serverId = computed(() => {
  const numeric = Number(route.query.serverId || 0);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
});

const currentHost = computed(() => {
  if (serverId.value) {
    return (
      hosts.value.find(
        (item) => Number(item.serverId || 0) === serverId.value,
      ) || null
    );
  }
  if (route.query.serverName) {
    return (
      hosts.value.find(
        (item) =>
          String(item.serverName || "") ===
          String(route.query.serverName || ""),
      ) || null
    );
  }
  return hosts.value[0] || null;
});

const currentSnapshot = computed(
  () =>
    metrics.value.find(
      (item) =>
        Number(item.serverId || 0) === Number(currentHost.value?.serverId || 0),
    ) || null,
);

const ioTotal = computed(() => resolveIoTotal(currentSnapshot.value));

const openDetail = (
  title: string,
  message: string,
  items: Array<{ label: string; value: string }>,
) => {
  detailState.value = { title, message, items };
  detailVisible.value = true;
};

const openMetricDetail = (metric: "CPU" | "MEMORY" | "DISK" | "IO") => {
  if (!currentSnapshot.value) {
    return;
  }
  if (metric === "CPU") {
    openDetail("CPU 卡片详情", "当前主机 CPU 实时占用与核心信息。", [
      { label: "主机", value: currentHost.value?.serverName || "-" },
      {
        label: "CPU 占用",
        value: formatMetricPercent(currentSnapshot.value.cpuUsage),
      },
      {
        label: "核心数",
        value: String(currentSnapshot.value.cpuCores || "--"),
      },
      { label: "延迟", value: formatLatency(currentSnapshot.value.latencyMs) },
    ]);
    return;
  }
  if (metric === "MEMORY") {
    openDetail("内存卡片详情", "展示当前内存占用与总量。", [
      { label: "主机", value: currentHost.value?.serverName || "-" },
      {
        label: "内存占用",
        value: formatMetricPercent(currentSnapshot.value.memoryUsage),
      },
      {
        label: "已用",
        value: formatByteSize(currentSnapshot.value.memoryUsedBytes),
      },
      {
        label: "总量",
        value: formatByteSize(currentSnapshot.value.memoryTotalBytes),
      },
    ]);
    return;
  }
  if (metric === "DISK") {
    openDetail("磁盘卡片详情", "展示当前磁盘占用与总量。", [
      { label: "主机", value: currentHost.value?.serverName || "-" },
      {
        label: "磁盘占用",
        value: formatMetricPercent(currentSnapshot.value.diskUsage),
      },
      {
        label: "已用",
        value: formatByteSize(currentSnapshot.value.diskUsedBytes),
      },
      {
        label: "总量",
        value: formatByteSize(currentSnapshot.value.diskTotalBytes),
      },
    ]);
    return;
  }
  openDetail("网络卡片详情", "展示当前网络吞吐详情。", [
    { label: "主机", value: currentHost.value?.serverName || "-" },
    { label: "总吞吐", value: formatThroughput(ioTotal.value) },
    {
      label: "入站",
      value: formatThroughput(currentSnapshot.value.ioReadBytesPerSecond),
    },
    {
      label: "出站",
      value: formatThroughput(currentSnapshot.value.ioWriteBytesPerSecond),
    },
  ]);
};

const openAlertDetail = (item: ServerAlertEvent) => {
  openDetail(
    `${metricLabel(item.metricType)} 告警详情`,
    item.alertMessage || "已触发实时预警",
    [
      { label: "主机", value: currentHost.value?.serverName || "-" },
      { label: "级别", value: severityLabel(item.severity) },
      { label: "触发时间", value: item.createTime || "-" },
      { label: "指标", value: metricLabel(item.metricType) },
    ],
  );
};

const openServiceDetail = (item: ServerService) => {
  openDetail(
    `${item.serviceName} · 服务详情`,
    item.lastOperationMessage || item.description || "当前服务暂无额外说明",
    [
      { label: "状态", value: item.runtimeStatus || "UNKNOWN" },
      { label: "类型", value: item.serviceType || "SERVER_SERVICE" },
      { label: "安装目录", value: item.installPath || "-" },
      { label: "AI 诊断", value: item.latestAiReason || "暂无" },
    ],
  );
};

const loadPage = async () => {
  loading.value = true;
  try {
    const [hostResult, metricResult] = await Promise.all([
      listServerHosts().catch(() => null),
      listServerHostMetrics().catch(() => null),
    ]);
    hosts.value = hostResult?.data || [];
    metrics.value = metricResult?.data || [];

    const resolvedServerId = Number(
      currentHost.value?.serverId || serverId.value || 0,
    );
    if (!resolvedServerId) {
      alerts.value = [];
      services.value = [];
      history.value = [];
      return;
    }
    const [alertResult, serviceResult, historyResult] = await Promise.all([
      listServerAlerts({ serverId: resolvedServerId, limit: 8 }).catch(
        () => null,
      ),
      listServerServices({ serverId: resolvedServerId }).catch(() => null),
      getServerHostMetricsHistory(resolvedServerId, { minutes: 120 }).catch(
        () => null,
      ),
    ]);
    alerts.value = (alertResult?.data || []).slice(0, 8);
    services.value = serviceResult?.data || [];
    history.value = [...(historyResult?.data || [])].sort(
      (left, right) =>
        Number(left.collectTimestamp || 0) -
        Number(right.collectTimestamp || 0),
    );
  } finally {
    loading.value = false;
  }
};

const historyChartOption = computed(() => {
  const labels = history.value.map((item) => formatTime(item.collectTimestamp));
  return {
    tooltip: {
      trigger: "axis",
      confine: true,
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: "rgba(191, 219, 254, 0.82)" },
    },
    grid: {
      left: 20,
      right: 20,
      top: 42,
      bottom: 24,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.26)" } },
      axisLabel: {
        color: "rgba(191, 219, 254, 0.72)",
        interval: Math.max(0, Math.ceil(labels.length / 6) - 1),
      },
    },
    yAxis: [
      {
        type: "value",
        min: 0,
        max: 100,
        axisLabel: {
          color: "rgba(191, 219, 254, 0.72)",
          formatter: (value: number) => `${Math.round(value)}%`,
        },
        splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.12)" } },
      },
      {
        type: "value",
        min: 0,
        axisLabel: {
          color: "rgba(191, 219, 254, 0.72)",
          formatter: (value: number) => formatByteSize(value),
        },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "CPU",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: history.value.map((item) => Number(item.cpuUsage || 0)),
        lineStyle: { width: 3, color: "#38bdf8" },
      },
      {
        name: "内存",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: history.value.map((item) => Number(item.memoryUsage || 0)),
        lineStyle: { width: 3, color: "#22c55e" },
      },
      {
        name: "磁盘",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: history.value.map((item) => Number(item.diskUsage || 0)),
        lineStyle: { width: 3, color: "#f59e0b" },
      },
      {
        name: "吞吐",
        type: "bar",
        yAxisIndex: 1,
        data: history.value.map((item) => resolveIoTotal(item)),
        itemStyle: { color: "rgba(96, 165, 250, 0.34)" },
      },
    ],
  };
});

const serviceChartOption = computed(() => {
  const statusCount = {
    running: 0,
    stopped: 0,
    issue: 0,
  };
  services.value.forEach((item) => {
    const status = String(item.runtimeStatus || "").toUpperCase();
    if (["RUNNING", "ACTIVE"].includes(status)) {
      statusCount.running += 1;
    } else if (["ERROR", "FAILED", "ISSUE"].includes(status)) {
      statusCount.issue += 1;
    } else {
      statusCount.stopped += 1;
    }
  });
  return {
    tooltip: { trigger: "item", confine: true },
    series: [
      {
        type: "pie",
        radius: ["48%", "72%"],
        avoidLabelOverlap: true,
        label: { color: "rgba(191, 219, 254, 0.82)" },
        itemStyle: {
          borderColor: "rgba(2, 6, 23, 0.7)",
          borderWidth: 4,
        },
        data: [
          {
            value: statusCount.running,
            name: "运行中",
            itemStyle: { color: "#22c55e" },
          },
          {
            value: statusCount.issue,
            name: "异常",
            itemStyle: { color: "#ef4444" },
          },
          {
            value: statusCount.stopped,
            name: "停止",
            itemStyle: { color: "#64748b" },
          },
        ],
      },
    ],
  };
});

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

const serviceToneClass = (value?: string | null) => {
  const status = String(value || "").toUpperCase();
  if (["RUNNING", "ACTIVE"].includes(status)) {
    return "is-success";
  }
  if (["ERROR", "FAILED", "ISSUE"].includes(status)) {
    return "is-danger";
  }
  return "is-muted";
};

const formatTime = (value?: number | null) => {
  if (!value) {
    return "--";
  }
  const time = new Date(value);
  return `${`${time.getHours()}`.padStart(2, "0")}:${`${time.getMinutes()}`.padStart(2, "0")}`;
};

watch(
  () => [route.query.serverId, route.query.serverName],
  () => {
    void loadPage();
  },
);

onMounted(() => {
  void loadPage();
});
</script>

<style scoped lang="scss">
.server-tech-page {
  display: grid;
  gap: 20px;
  min-height: calc(100vh - 140px);
  padding: 20px;
  color: #dbeafe;
  background:
    radial-gradient(
      circle at top left,
      rgba(56, 189, 248, 0.18),
      transparent 34%
    ),
    radial-gradient(
      circle at top right,
      rgba(59, 130, 246, 0.16),
      transparent 28%
    ),
    radial-gradient(
      circle at top right,
      rgba(245, 158, 11, 0.12),
      transparent 22%
    ),
    linear-gradient(160deg, #040b16 0%, #09162e 48%, #0b1d3b 100%);
}

.server-tech-page__hero,
.server-tech-page__stat-card,
.server-tech-page__panel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(96, 165, 250, 0.16);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(8, 18, 38, 0.82), rgba(6, 14, 30, 0.88)),
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.08), transparent 36%);
  box-shadow:
    0 24px 48px rgba(2, 6, 23, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(18px);
}

.server-tech-page__hero::after,
.server-tech-page__stat-card::after,
.server-tech-page__panel::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), transparent 28%);
}

.server-tech-page__hero,
.server-tech-page__panel-head,
.server-tech-page__alert-top,
.server-tech-page__service-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.server-tech-page__hero {
  padding: 26px 28px;
}

.server-tech-page__hero small,
.server-tech-page__hero p,
.server-tech-page__chip,
.server-tech-page__panel-head span,
.server-tech-page__alert-item small,
.server-tech-page__service-item p,
.server-tech-page__stat-card span,
.server-tech-page__stat-card small {
  color: rgba(191, 219, 254, 0.84);
}

.server-tech-page__hero h1 {
  margin: 8px 0 10px;
  font-size: 36px;
  line-height: 1.05;
  color: #f8fbff;
}

.server-tech-page__meta,
.server-tech-page__stats,
.server-tech-page__layout,
.server-tech-page__alert-list,
.server-tech-page__service-list {
  display: grid;
  gap: 16px;
}

.server-tech-page__meta {
  align-content: start;
}

.server-tech-page__stats {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.server-tech-page__stat-card {
  display: grid;
  gap: 10px;
  padding: 20px 22px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.server-tech-page__stat-card:hover,
.server-tech-page__alert-item:hover,
.server-tech-page__service-item:hover {
  transform: translateY(-3px);
  border-color: rgba(56, 189, 248, 0.26);
  box-shadow: 0 22px 34px rgba(2, 6, 23, 0.28);
}

.server-tech-page__stat-card strong {
  font-size: 30px;
  color: #f8fbff;
  line-height: 1;
}

.server-tech-page__stat-card.is-cpu {
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.18);
}

.server-tech-page__stat-card.is-memory {
  box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.18);
}

.server-tech-page__stat-card.is-disk {
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.18);
}

.server-tech-page__stat-card.is-io {
  box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.18);
}

.server-tech-page__chip {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.62);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.server-tech-page__chip.is-muted {
  background: rgba(15, 23, 42, 0.52);
}

.server-tech-page__chip.is-warning {
  background: rgba(245, 158, 11, 0.18);
  color: #fde68a;
}

.server-tech-page__chip.is-danger {
  background: rgba(239, 68, 68, 0.18);
  color: #fecaca;
}

.server-tech-page__chip.is-success {
  background: rgba(34, 197, 94, 0.18);
  color: #bbf7d0;
}

.server-tech-page__layout {
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
  align-items: start;
}

.server-tech-page__panel {
  display: grid;
  gap: 14px;
  padding: 22px;
}

.server-tech-page__panel--chart {
  grid-row: span 2;
}

.server-tech-page__panel-head strong,
.server-tech-page__service-item strong,
.server-tech-page__alert-item strong {
  color: #f8fbff;
}

.server-tech-page__alert-list,
.server-tech-page__service-list {
  gap: 10px;
}

.server-tech-page__alert-item,
.server-tech-page__service-item {
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background:
    linear-gradient(180deg, rgba(2, 6, 23, 0.4), rgba(3, 10, 24, 0.34));
}

.server-tech-page__alert-item.is-warning {
  border-color: rgba(245, 158, 11, 0.28);
}

.server-tech-page__alert-item.is-danger {
  border-color: rgba(239, 68, 68, 0.28);
}

.server-tech-page__alert-item p {
  margin: 0;
  line-height: 1.6;
}

.server-tech-page__detail {
  display: grid;
  gap: 14px;
}

.server-tech-page__detail-message {
  margin: 0;
  line-height: 1.7;
  color: #475569;
}

.server-tech-page__detail-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.server-tech-page__detail-card {
  display: grid;
  gap: 6px;
  padding: 18px;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(148, 163, 184, 0.12), rgba(148, 163, 184, 0.08));
}

.server-tech-page__detail-card small {
  color: #64748b;
}

.server-tech-page__detail-card strong {
  color: #0f172a;
}

@media (max-width: 1100px) {
  .server-tech-page__stats,
  .server-tech-page__layout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .server-tech-page__panel--chart {
    grid-row: auto;
    grid-column: span 2;
  }
}

@media (max-width: 900px) {
  .server-tech-page__hero,
  .server-tech-page__stats,
  .server-tech-page__layout,
  .server-tech-page__detail-grid {
    grid-template-columns: 1fr;
    display: grid;
  }

  .server-tech-page__panel--chart {
    grid-column: auto;
  }

  .server-tech-page__hero h1 {
    font-size: 28px;
  }
}
</style>
