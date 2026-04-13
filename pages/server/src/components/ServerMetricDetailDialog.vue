<template>
  <el-dialog
    v-model="visible"
    destroy-on-close
    :title="metricMeta.title"
    width="92%"
    class="server-metric-detail-dialog"
    @close="emit('update:modelValue', false)"
  >
    <header class="server-metric-detail-dialog__header">
      <div>
        <div class="server-metric-detail-dialog__title-row">
          <h3>{{ metricMeta.title }}</h3>
          <span
            class="server-metric-detail-dialog__badge"
            :class="metricMeta.badgeClass"
          >
            {{ metricMeta.badgeText }}
          </span>
        </div>
        <p>{{ host?.serverName || "服务器" }} · {{ metricMeta.description }}</p>
      </div>
      <div class="server-metric-detail-dialog__filters">
        <el-select
          v-model="historyRange"
          size="small"
          class="server-metric-detail-dialog__control server-metric-detail-dialog__control--select"
        >
          <el-option
            v-for="option in rangeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-select
          v-model="historyStateFilter"
          size="small"
          class="server-metric-detail-dialog__control server-metric-detail-dialog__control--select"
        >
          <el-option label="全部状态" value="all" />
          <el-option label="正常" value="normal" />
          <el-option label="预警" value="warning" />
          <el-option label="危险" value="danger" />
        </el-select>
        <el-date-picker
          v-model="historyDateRange"
          type="datetimerange"
          unlink-panels
          value-format="x"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          class="server-metric-detail-dialog__control server-metric-detail-dialog__control--date"
          @change="handleHistoryDateRangeChange"
        />
        <el-tooltip
          :content="
            aiEnabled
              ? '基于当前筛选历史做 AI 分析'
              : aiUnavailableReason || 'AI 能力未激活'
          "
        >
          <el-button
            circle
            plain
            :loading="currentAiAnalyzing"
            :disabled="!aiEnabled || !filteredHistory.length"
            @click="emitAnalyzeHistory"
          >
            <IconifyIconOnline icon="ri:ai-generate-2" />
          </el-button>
        </el-tooltip>
      </div>
    </header>

    <div class="server-metric-detail-dialog__body">
      <!-- Hero Card -->
      <section class="server-metric-detail-dialog__hero">
        <div class="server-metric-detail-dialog__liquid-container">
          <div
            class="server-metric-detail-dialog__liquid-bg"
            :style="{
              background: `linear-gradient(135deg,
                ${liquidColor}18 0%,
                ${liquidColor}10 48%,
                ${liquidColor}05 100%)`,
            }"
          />
          <div
            class="server-metric-detail-dialog__wave server-metric-detail-dialog__wave--1"
          >
            <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
              <path
                :fill="liquidColor"
                fill-opacity="0.15"
                d="M0,50 C360,100 720,0 1080,50 C1260,75 1350,25 1440,50 L1440,100 L0,100 Z"
              />
            </svg>
          </div>
          <div
            class="server-metric-detail-dialog__wave server-metric-detail-dialog__wave--2"
          >
            <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
              <path
                :fill="liquidColor"
                fill-opacity="0.1"
                d="M0,50 C240,0 480,100 720,50 C960,0 1200,100 1440,50 L1440,100 L0,100 Z"
              />
            </svg>
          </div>
          <div
            class="server-metric-detail-dialog__wave server-metric-detail-dialog__wave--3"
          >
            <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
              <path
                :fill="liquidColor"
                fill-opacity="0.08"
                d="M0,30 C180,80 540,20 720,60 C900,100 1260,40 1440,70 L1440,100 L0,100 Z"
              />
            </svg>
          </div>
          <el-tooltip
            :content="`已使用 ${metricMeta.usedText}`"
            placement="top"
            effect="dark"
          >
            <div
              class="server-metric-detail-dialog__liquid-overlay server-metric-detail-dialog__liquid-overlay--used"
              :style="{ width: `${metricMeta.usagePercent}%` }"
            />
          </el-tooltip>
          <el-tooltip
            :content="`剩余 ${metricMeta.freeText}`"
            placement="top"
            effect="dark"
          >
            <div
              class="server-metric-detail-dialog__liquid-overlay server-metric-detail-dialog__liquid-overlay--free"
              :style="{ left: `${metricMeta.usagePercent}%` }"
            />
          </el-tooltip>
        </div>
        <div class="server-metric-detail-dialog__value-card">
          <small>当前值</small>
          <strong :style="{ color: liquidColor }">{{ metricMeta.value }}</strong>
          <span>{{ metricMeta.total }}</span>
        </div>
        <div class="server-metric-detail-dialog__chips">
          <div class="server-metric-detail-dialog__chip">
            {{ detail?.hostName || host?.host || "未获取主机名" }}
          </div>
          <div class="server-metric-detail-dialog__chip">
            {{ detail?.actualOsName || hostOsFallback }}
          </div>
          <div class="server-metric-detail-dialog__chip">
            {{
              detail?.publicIp ? `公网 ${detail.publicIp}` : "公网地址未获取"
            }}
          </div>
          <div class="server-metric-detail-dialog__chip">
            {{
              snapshot?.collectTimestamp
                ? formatDateTime(snapshot.collectTimestamp)
                : "等待实时采样"
            }}
          </div>
        </div>
      </section>

      <!-- Chart Panel -->
      <section class="server-metric-detail-dialog__chart-panel">
        <header>
          <div>
            <strong>{{ metricMeta.chartTitle }}</strong>
            <p>支持历史过滤与阈值线对照，便于快速看趋势与拐点。</p>
          </div>
          <div class="server-metric-detail-dialog__chart-meta">
            <span class="server-metric-detail-dialog__time-range">{{
              chartTimeRange
            }}</span>
            <span class="server-metric-detail-dialog__time-range">
              样本 {{ filteredHistory.length }}
            </span>
            <div class="server-metric-detail-dialog__thresholds">
              <span class="is-warning">
                预警 {{ metricMeta.warningText }}
              </span>
              <span class="is-danger"> 危险 {{ metricMeta.dangerText }} </span>
            </div>
          </div>
        </header>
        <ScEcharts :option="chartOption" height="220px" />
      </section>

      <section
        v-if="aiEnabled || currentAiAdvice?.aiReason || currentAiAdvice?.aiSolution"
        class="server-metric-detail-dialog__ai-panel"
      >
        <header class="server-metric-detail-dialog__ai-header">
          <div>
            <strong>历史 AI 分析</strong>
            <p>
              {{
                currentAiAdvice?.message ||
                (currentAiAnalyzing
                  ? "AI 正在结合当前筛选样本分析趋势与风险。"
                  : "当前历史筛选结果支持直接发起 AI 分析。")
              }}
            </p>
          </div>
          <div class="server-metric-detail-dialog__chips">
            <div class="server-metric-detail-dialog__chip">
              {{ metricMeta.title }}
            </div>
            <div class="server-metric-detail-dialog__chip">
              样本 {{ filteredHistory.length }}
            </div>
            <div
              v-if="currentAiAdvice?.aiProvider || currentAiAdvice?.aiModel"
              class="server-metric-detail-dialog__chip"
            >
              {{ currentAiAdvice?.aiProvider || "-" }} /
              {{ currentAiAdvice?.aiModel || "-" }}
            </div>
          </div>
        </header>
        <div class="server-metric-detail-dialog__ai-grid">
          <article class="server-metric-detail-dialog__ai-card">
            <small>结论</small>
            <p>{{ currentAiAdvice?.aiReason || "暂无 AI 历史分析结果" }}</p>
          </article>
          <article class="server-metric-detail-dialog__ai-card">
            <small>建议</small>
            <p>
              {{
                currentAiAdvice?.aiSolution ||
                "点击右上角 AI 图标即可分析当前历史趋势。"
              }}
            </p>
          </article>
        </div>
      </section>

      <!-- Grid: Facts + Lists -->
      <div class="server-metric-detail-dialog__grid">
        <!-- Facts Panel -->
        <ScCard class="server-metric-detail-dialog__panel">
          <template #header>
            <div class="server-metric-detail-dialog__panel-header">
              <strong>运行实例</strong>
            </div>
          </template>
          <dl class="server-metric-detail-dialog__facts">
            <div>
              <dt>主机名称</dt>
              <dd>{{ detail?.hostName || "-" }}</dd>
            </div>
            <div>
              <dt>实际系统</dt>
              <dd>{{ detail?.actualOsName || hostOsFallback }}</dd>
            </div>
            <div>
              <dt>内核 / 版本</dt>
              <dd>{{ detail?.actualKernel || "-" }}</dd>
            </div>
            <div>
              <dt>公网地址</dt>
              <dd>{{ detail?.publicIp || "-" }}</dd>
            </div>
          </dl>
        </ScCard>

        <!-- Dynamic Lists -->
        <ScCard
          v-if="metricKey === 'disk'"
          class="server-metric-detail-dialog__panel"
        >
          <template #header>
            <div class="server-metric-detail-dialog__panel-header">
              <strong>磁盘分区</strong>
              <span>{{ diskPartitions.length }} 个</span>
            </div>
          </template>
          <div class="server-metric-detail-dialog__list thin-scroller">
            <div
              v-for="item in diskPartitions"
              :key="item.mountPoint || item.name"
              class="server-metric-detail-dialog__list-item"
              :style="{
                background: `linear-gradient(to right, ${resolveUsageColor(item.usagePercent)}18 ${Number(item.usagePercent || 0)}%, transparent ${Number(item.usagePercent || 0)}%)`,
                boxShadow: `inset 0 0 0 1px ${resolveUsageColor(item.usagePercent)}30`,
              }"
            >
              <div class="server-metric-detail-dialog__list-info">
                <strong>{{ item.mountPoint || item.name || "-" }}</strong>
                <p>
                  {{ item.fileSystem || "未知文件系统" }} ·
                  {{ item.label || "未命名卷" }}
                </p>
              </div>
              <div class="server-metric-detail-dialog__list-meta">
                <span
                  class="server-metric-detail-dialog__usage-percent"
                  :style="{ color: resolveUsageColor(item.usagePercent) }"
                >
                  {{ formatMetricPercent(item.usagePercent) }}
                </span>
                <small
                  >{{ formatByteSize(item.usedBytes) }} /
                  {{ formatByteSize(item.totalBytes) }}</small
                >
              </div>
            </div>
          </div>
        </ScCard>

        <ScCard
          v-else-if="metricKey === 'io'"
          class="server-metric-detail-dialog__panel"
        >
          <template #header>
            <div class="server-metric-detail-dialog__panel-header">
              <strong>网卡明细</strong>
              <span>{{ networkInterfaces.length }} 张</span>
            </div>
          </template>
          <div class="server-metric-detail-dialog__list thin-scroller">
            <div
              v-for="(item, index) in networkInterfaces"
              :key="`${item.name}-${index}`"
              class="server-metric-detail-dialog__list-item"
            >
              <div class="server-metric-detail-dialog__list-info">
                <strong>{{ item.displayName || item.name || "-" }}</strong>
                <p>
                  {{ item.ipv4 || "未分配 IPv4" }} ·
                  {{ item.macAddress || "无 MAC" }}
                </p>
              </div>
              <div class="server-metric-detail-dialog__list-meta">
                <el-tag
                  :type="item.status === 'UP' ? 'success' : 'info'"
                  size="small"
                  effect="plain"
                >
                  {{ item.status === "UP" ? "运行中" : "已停止" }}
                </el-tag>
                <small
                  >累计入 {{ formatByteSize(item.receivedBytes) }} / 累计出
                  {{ formatByteSize(item.transmittedBytes) }}</small
                >
                <small
                  >包数 {{ formatPacketCount(item.receivedPackets) }} / 发
                  {{ formatPacketCount(item.transmittedPackets) }}</small
                >
              </div>
            </div>
          </div>
        </ScCard>

        <ScCard v-else class="server-metric-detail-dialog__panel">
          <template #header>
            <div class="server-metric-detail-dialog__panel-header">
              <strong>最近采样</strong>
              <span>{{ filteredHistory.length }} 条</span>
            </div>
          </template>
          <div class="server-metric-detail-dialog__list thin-scroller">
            <div
              v-for="(item, index) in recentHistory"
              :key="`${item.collectTimestamp}-${index}`"
              class="server-metric-detail-dialog__list-item"
              :style="{
                background: `linear-gradient(to right, ${resolveUsageColor(metricMeta.itemRawValue(item))}15 ${Number(metricMeta.itemRawValue(item) || 0)}%, transparent ${Number(metricMeta.itemRawValue(item) || 0)}%)`,
                boxShadow: `inset 0 0 0 1px ${resolveUsageColor(metricMeta.itemRawValue(item))}30`,
              }"
            >
              <div class="server-metric-detail-dialog__list-info">
                <strong>{{ formatDateTime(item.collectTimestamp) }}</strong>
                <p>{{ metricMeta.itemText(item) }}</p>
              </div>
              <div class="server-metric-detail-dialog__list-meta">
                <span
                  class="server-metric-detail-dialog__usage-percent"
                  :style="{
                    color: resolveUsageColor(metricMeta.itemRawValue(item)),
                  }"
                >
                  {{ metricMeta.itemValue(item) }}
                </span>
                <small>{{ metricMeta.itemExtra(item) }}</small>
              </div>
            </div>
          </div>
        </ScCard>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ScCard from "@repo/components/ScCard/index.vue";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import type {
  ServerAiTaskPayload,
  ServerAlertSettings,
  ServerDiskPartitionView,
  ServerHost,
  ServerMetricsDetail,
  ServerMetricsSnapshot,
  ServerNetworkInterfaceView,
} from "../api";
import { buildMetricHistoryAiFilterKey } from "../utils/historyAi";
import {
  formatByteSize,
  formatLatency,
  formatMetricPercent,
  formatPacketCount,
  formatThroughput,
  osLabel,
  resolveIoTotal,
} from "../utils/serverHost";

type MetricKey = "cpu" | "memory" | "disk" | "io";
type RangeValue = number;
type HistoryStateFilter = "all" | "normal" | "warning" | "danger";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    metricKey?: MetricKey | null;
    host?: ServerHost | null;
    snapshot?: ServerMetricsSnapshot | null;
    history?: ServerMetricsSnapshot[];
    detail?: ServerMetricsDetail | null;
    alertSettings?: ServerAlertSettings | null;
    aiEnabled?: boolean;
    aiAnalyzingKey?: string;
    aiAdviceMap?: Record<string, ServerAiTaskPayload>;
    aiUnavailableReason?: string;
  }>(),
  {
    metricKey: null,
    host: null,
    snapshot: null,
    history: () => [],
    detail: null,
    alertSettings: null,
    aiEnabled: false,
    aiAnalyzingKey: "",
    aiAdviceMap: () => ({}),
    aiUnavailableReason: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "change-history-range": [minutes: RangeValue];
  "analyze-history": [
    payload: {
      metricKey: MetricKey;
      minutes: number;
      startTime?: number;
      endTime?: number;
      stateFilter: HistoryStateFilter;
    },
  ];
}>();

const rangeOptions: Array<{ label: string; value: RangeValue }> = [
  { label: "15 分钟", value: 15 },
  { label: "30 分钟", value: 30 },
  { label: "60 分钟", value: 60 },
  { label: "2 小时", value: 120 },
];

const historyRange = ref<RangeValue>(30);
const historyStateFilter = ref<HistoryStateFilter>("all");
const historyDateRange = ref<[string, string] | []>([]);

watch(historyRange, (value) => {
  emit("change-history-range", value);
});

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const hostOsFallback = computed(() => osLabel(props.host?.osType));

const resolveStateFilter = (value?: number | null): HistoryStateFilter => {
  const numeric = Number(value || 0);
  if (numeric >= Number(thresholds.value.danger || 0)) {
    return "danger";
  }
  if (numeric >= Number(thresholds.value.warning || 0)) {
    return "warning";
  }
  return "normal";
};

const filteredHistory = computed(() => {
  const history = props.history || [];
  if (!history.length) {
    return [];
  }
  const [startText, endText] = historyDateRange.value;
  const hasCustomRange = Boolean(startText && endText);
  const startTime = hasCustomRange ? Number(startText) : undefined;
  const endTime = hasCustomRange ? Number(endText) : undefined;
  const cutoff = Date.now() - historyRange.value * 60 * 1000;
  return history.filter((item) => {
    const collectTimestamp = Number(item.collectTimestamp || 0);
    if (!collectTimestamp) {
      return false;
    }
    if (hasCustomRange) {
      if (
        (startTime && collectTimestamp < startTime) ||
        (endTime && collectTimestamp > endTime)
      ) {
        return false;
      }
    } else if (collectTimestamp < cutoff) {
      return false;
    }
    if (historyStateFilter.value === "all") {
      return true;
    }
    return (
      resolveStateFilter(metricMeta.value.itemRawValue(item)) ===
      historyStateFilter.value
    );
  });
});

const recentHistory = computed(() =>
  filteredHistory.value.slice().reverse().slice(0, 8),
);

const currentAiFilterKey = computed(() =>
  buildMetricHistoryAiFilterKey(props.host?.serverId, {
    metricKey: props.metricKey,
    minutes: historyRange.value,
    startTime: historyDateRange.value[0]
      ? Number(historyDateRange.value[0])
      : undefined,
    endTime: historyDateRange.value[1]
      ? Number(historyDateRange.value[1])
      : undefined,
    stateFilter: historyStateFilter.value,
  }),
);

const currentAiAdvice = computed(
  () => props.aiAdviceMap?.[currentAiFilterKey.value] || null,
);

const currentAiAnalyzing = computed(
  () => props.aiAnalyzingKey === currentAiFilterKey.value,
);

const diskPartitions = computed<ServerDiskPartitionView[]>(
  () => props.detail?.diskPartitions || [],
);

const networkInterfaces = computed<ServerNetworkInterfaceView[]>(
  () => props.detail?.networkInterfaces || [],
);

const handleHistoryDateRangeChange = (value?: [string, string] | []) => {
  if (!value || value.length !== 2) {
    emit("change-history-range", historyRange.value);
    return;
  }
  const startTime = Number(value[0] || 0);
  const minutes = Math.max(
    15,
    Math.ceil((Date.now() - startTime) / (60 * 1000)),
  );
  emit("change-history-range", minutes);
};

const thresholds = computed(() => {
  const settings = props.alertSettings || {};
  switch (props.metricKey) {
    case "memory":
      return {
        warning: Number(settings.memoryWarningPercent || 75),
        danger: Number(settings.memoryDangerPercent || 90),
      };
    case "disk":
      return {
        warning: Number(settings.diskWarningPercent || 80),
        danger: Number(settings.diskDangerPercent || 92),
      };
    case "io":
      return {
        warning: Number(settings.ioWarningBytesPerSecond || 50 * 1024 * 1024),
        danger: Number(settings.ioDangerBytesPerSecond || 120 * 1024 * 1024),
      };
    default:
      return {
        warning: Number(settings.cpuWarningPercent || 75),
        danger: Number(settings.cpuDangerPercent || 90),
      };
  }
});

const resolveUsageColor = (value?: number | null) => {
  const numeric = Number(value || 0);
  if (numeric >= Number(thresholds.value.danger || 90)) {
    return "#c42b1c"; // Windows 任务管理器红色
  }
  if (numeric >= Number(thresholds.value.warning || 75)) {
    return "#ffb900"; // Windows 任务管理器黄色
  }
  return "#0078d4"; // Windows 任务管理器蓝色
};

// 液体效果颜色 - 根据使用率动态变化
const liquidColor = computed(() => {
  const usage = props.snapshot
    ? props.metricKey === "memory"
      ? props.snapshot.memoryUsage
      : props.metricKey === "disk"
        ? props.snapshot.diskUsage
        : props.snapshot.cpuUsage
    : 0;
  return resolveUsageColor(usage);
});

// 计算已使用百分比
const usagePercent = computed(() => {
  if (props.metricKey === "memory") return props.snapshot?.memoryUsage || 0;
  if (props.metricKey === "disk") return props.snapshot?.diskUsage || 0;
  if (props.metricKey === "cpu") return props.snapshot?.cpuUsage || 0;
  return 0;
});

const metricMeta = computed(() => {
  const snapshot = props.snapshot;
  const warning = thresholds.value.warning;
  const danger = thresholds.value.danger;

  if (props.metricKey === "memory") {
    return {
      title: "内存指标详情",
      description: "查看内存占用走势、阈值命中情况与总量基线。",
      chartTitle: "内存历史趋势",
      value: `${formatMetricPercent(snapshot?.memoryUsage)}`,
      total: `总量 ${formatByteSize(snapshot?.memoryTotalBytes)} · 已用 ${formatByteSize(snapshot?.memoryUsedBytes)}`,
      warningText: `${warning}%`,
      dangerText: `${danger}%`,
      badgeText: snapshot?.online ? "实时采样中" : "等待心跳",
      badgeClass: snapshot?.online ? "is-success" : "is-muted",
      itemText: (item: ServerMetricsSnapshot) =>
        `已用 ${formatByteSize(item.memoryUsedBytes)} / ${formatByteSize(item.memoryTotalBytes)}`,
      itemValue: (item: ServerMetricsSnapshot) =>
        `${formatMetricPercent(item.memoryUsage)}`,
      itemExtra: (item: ServerMetricsSnapshot) =>
        `总量 ${formatByteSize(item.memoryTotalBytes)}`,
      itemRawValue: (item: ServerMetricsSnapshot) => item.memoryUsage,
      usagePercent: Number(snapshot?.memoryUsage || 0),
      usedText: formatByteSize(snapshot?.memoryUsedBytes),
      freeText: formatByteSize(
        (snapshot?.memoryTotalBytes || 0) - (snapshot?.memoryUsedBytes || 0),
      ),
    };
  }
  if (props.metricKey === "disk") {
    return {
      title: "磁盘指标详情",
      description: "查看磁盘容量走势与各挂载点占用情况。",
      chartTitle: "磁盘历史趋势",
      value: `${formatMetricPercent(snapshot?.diskUsage)}`,
      total: `总量 ${formatByteSize(snapshot?.diskTotalBytes)} · 已用 ${formatByteSize(snapshot?.diskUsedBytes)}`,
      warningText: `${warning}%`,
      dangerText: `${danger}%`,
      badgeText: diskPartitions.value.length
        ? `${diskPartitions.value.length} 个分区`
        : "等待分区扫描",
      badgeClass: diskPartitions.value.length ? "is-primary" : "is-muted",
      itemText: (item: ServerMetricsSnapshot) =>
        `已用 ${formatByteSize(item.diskUsedBytes)} / ${formatByteSize(item.diskTotalBytes)}`,
      itemValue: (item: ServerMetricsSnapshot) =>
        `${formatMetricPercent(item.diskUsage)}`,
      itemExtra: (item: ServerMetricsSnapshot) =>
        `总量 ${formatByteSize(item.diskTotalBytes)}`,
      itemRawValue: (item: ServerMetricsSnapshot) => item.diskUsage,
      usagePercent: Number(snapshot?.diskUsage || 0),
      usedText: formatByteSize(snapshot?.diskUsedBytes),
      freeText: formatByteSize(
        (snapshot?.diskTotalBytes || 0) - (snapshot?.diskUsedBytes || 0),
      ),
    };
  }
  if (props.metricKey === "io") {
    return {
      title: "网络 IO 指标详情",
      description: "查看网络吞吐趋势，并结合网卡累计数据定位异常。",
      chartTitle: "网络 IO 历史趋势",
      value: formatThroughput(resolveIoTotal(snapshot)),
      total: `入 ${formatThroughput(snapshot?.ioReadBytesPerSecond)} · 出 ${formatThroughput(snapshot?.ioWriteBytesPerSecond)}`,
      warningText: `${formatThroughput(warning)}`,
      dangerText: `${formatThroughput(danger)}`,
      badgeText: networkInterfaces.value.length
        ? `${networkInterfaces.value.length} 张网卡`
        : "等待网卡扫描",
      badgeClass: networkInterfaces.value.length ? "is-primary" : "is-muted",
      itemText: (item: ServerMetricsSnapshot) =>
        `入 ${formatThroughput(item.ioReadBytesPerSecond)} / 出 ${formatThroughput(item.ioWriteBytesPerSecond)}`,
      itemValue: (item: ServerMetricsSnapshot) =>
        formatThroughput(resolveIoTotal(item)),
      itemExtra: (item: ServerMetricsSnapshot) => formatLatency(item.latencyMs),
      itemRawValue: (item: ServerMetricsSnapshot) => resolveIoTotal(item),
      usagePercent: 0,
      usedText: "",
      freeText: "",
    };
  }
  return {
    title: "CPU 指标详情",
    description: "查看 CPU 历史波动、阈值线与核心数基线。",
    chartTitle: "CPU 历史趋势",
    value: `${formatMetricPercent(snapshot?.cpuUsage)}`,
    total: snapshot?.cpuCores
      ? `逻辑核心 ${snapshot.cpuCores}`
      : "逻辑核心未知",
    warningText: `${warning}%`,
    dangerText: `${danger}%`,
    badgeText: snapshot?.cpuCores ? `${snapshot.cpuCores} 核` : "等待采样",
    badgeClass: snapshot?.online ? "is-success" : "is-muted",
    itemText: (item: ServerMetricsSnapshot) =>
      `延迟 ${formatLatency(item.latencyMs)}`,
    itemValue: (item: ServerMetricsSnapshot) =>
      `${formatMetricPercent(item.cpuUsage)}`,
    itemExtra: () =>
      props.snapshot?.cpuCores
        ? `逻辑核心 ${props.snapshot.cpuCores}`
        : "逻辑核心未知",
    itemRawValue: (item: ServerMetricsSnapshot) => item.cpuUsage,
    usagePercent: Number(snapshot?.cpuUsage || 0),
    usedText: `${formatMetricPercent(snapshot?.cpuUsage)}`,
    freeText: `${formatMetricPercent(100 - (snapshot?.cpuUsage || 0))}`,
  };
});

// 图表时间范围文本
const chartTimeRange = computed(() => {
  const data = filteredHistory.value;
  if (data.length === 0) return "范围: 无数据";
  const minTime = formatDateTime(data[0].collectTimestamp, {
    includeDate: true,
    includeMilliseconds: true,
  });
  const maxTime = formatDateTime(data[data.length - 1].collectTimestamp, {
    includeDate: true,
    includeMilliseconds: true,
  });
  return `范围: ${minTime} ~ ${maxTime}`;
});

const chartTimestamps = computed(() =>
  filteredHistory.value.map((item) => Number(item.collectTimestamp || 0)),
);

const chartLabels = computed(() => {
  const timestamps = chartTimestamps.value;
  if (!timestamps.length) {
    return [] as string[];
  }
  const first = new Date(timestamps[0]);
  const sameDay = timestamps.every((timestamp) => {
    const current = new Date(timestamp);
    return (
      current.getFullYear() === first.getFullYear() &&
      current.getMonth() === first.getMonth() &&
      current.getDate() === first.getDate()
    );
  });
  const secondCounter = new Map<string, number>();
  timestamps.forEach((timestamp) => {
    const label = formatDateTime(timestamp, {
      includeDate: false,
      includeMilliseconds: false,
    });
    secondCounter.set(label, (secondCounter.get(label) || 0) + 1);
  });
  return timestamps.map((timestamp) => {
    const secondLabel = formatDateTime(timestamp, {
      includeDate: false,
      includeMilliseconds: false,
    });
    return formatDateTime(timestamp, {
      includeDate: !sameDay,
      includeMilliseconds: (secondCounter.get(secondLabel) || 0) > 1,
    });
  });
});

const chartOption = computed(() => {
  const data = filteredHistory.value;
  const labels = chartLabels.value;
  const totalSeriesData = data.map((item) => {
    if (props.metricKey === "memory")
      return Math.round(Number(item.memoryUsage || 0) * 100) / 100;
    if (props.metricKey === "disk")
      return Math.round(Number(item.diskUsage || 0) * 100) / 100;
    if (props.metricKey === "io") return Math.round(resolveIoTotal(item));
    return Math.round(Number(item.cpuUsage || 0) * 100) / 100;
  });
  const ioReadSeriesData = data.map((item) =>
    Math.round(Number(item.ioReadBytesPerSecond || 0)),
  );
  const ioWriteSeriesData = data.map((item) =>
    Math.round(Number(item.ioWriteBytesPerSecond || 0)),
  );

  const isPercent = props.metricKey !== "io";
  const warningLine = Number(thresholds.value.warning || 0);
  const dangerLine = Number(thresholds.value.danger || 0);
  const maxValue = isPercent
    ? 100
    : Math.max(
        dangerLine,
        ...totalSeriesData.map((item) => Number(item || 0)),
        ...ioReadSeriesData.map((item) => Number(item || 0)),
        ...ioWriteSeriesData.map((item) => Number(item || 0)),
        1,
      );

  return {
    legend:
      props.metricKey === "io"
        ? {
            top: 0,
            right: 0,
            itemWidth: 10,
            itemHeight: 10,
            textStyle: {
              color: "#64748b",
              fontSize: 12,
            },
          }
        : undefined,
    tooltip: {
      trigger: "axis",
      confine: true,
      formatter: (
        params: Array<{
          axisValue?: string;
          data?: number;
          seriesName?: string;
        }>,
      ) => {
        const lines = params.map((point) => {
          const value = Number(point?.data || 0);
          return `${point?.seriesName || "指标"}: ${isPercent ? `${value}%` : formatThroughput(value)}`;
        });
        return [params?.[0]?.axisValue || "", ...lines]
          .filter(Boolean)
          .join("<br/>");
      },
    },
    grid: {
      left: 20,
      right: 20,
      top: 28,
      bottom: 30,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: labels,
      axisLabel: {
        formatter: (value: string) => value,
        rotate: 0,
        interval: Math.max(0, Math.ceil(labels.length / 6) - 1),
      },
      axisLine: {
        lineStyle: {
          color: "#e2e8f0",
        },
      },
      axisTick: {
        lineStyle: {
          color: "#e2e8f0",
        },
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: maxValue,
      axisLabel: {
        formatter: (value: number) =>
          isPercent ? `${Math.round(value)}%` : formatThroughput(value),
      },
      splitLine: {
        lineStyle: {
          color: "#f1f5f9",
        },
      },
    },
    series: [
      ...(props.metricKey === "io"
        ? [
            {
              name: "总吞吐",
              type: "line",
              smooth: true,
              showSymbol: false,
              data: totalSeriesData,
              lineStyle: {
                width: 3,
                color: "#7c3aed",
              },
              areaStyle: {
                color: "rgba(124, 58, 237, 0.12)",
              },
              markLine: {
                symbol: "none",
                label: {
                  formatter: ({ value }: { value?: number }) =>
                    formatThroughput(value),
                },
                data: [
                  {
                    yAxis: warningLine,
                    lineStyle: { color: "#f59e0b", type: "dashed" },
                  },
                  {
                    yAxis: dangerLine,
                    lineStyle: { color: "#ef4444", type: "dashed" },
                  },
                ],
              },
            },
            {
              name: "入站",
              type: "line",
              smooth: true,
              showSymbol: false,
              data: ioReadSeriesData,
              lineStyle: {
                width: 2,
                color: "#0f766e",
              },
            },
            {
              name: "出站",
              type: "line",
              smooth: true,
              showSymbol: false,
              data: ioWriteSeriesData,
              lineStyle: {
                width: 2,
                color: "#2563eb",
              },
            },
          ]
        : [
            {
              name: "指标值",
              type: "line",
              smooth: true,
              showSymbol: false,
              data: totalSeriesData,
              lineStyle: {
                width: 3,
                color: "#2563eb",
              },
              areaStyle: {
                color: "rgba(37, 99, 235, 0.14)",
              },
              markLine: {
                symbol: "none",
                label: {
                  formatter: ({ value }: { value?: number }) =>
                    `${Math.round(Number(value || 0))}%`,
                },
                data: [
                  {
                    yAxis: warningLine,
                    lineStyle: { color: "#f59e0b", type: "dashed" },
                  },
                  {
                    yAxis: dangerLine,
                    lineStyle: { color: "#ef4444", type: "dashed" },
                  },
                ],
              },
            },
          ]),
    ],
  };
});

const emitAnalyzeHistory = () => {
  if (!props.metricKey) {
    return;
  }
  const [startText, endText] = historyDateRange.value;
  emit("analyze-history", {
    metricKey: props.metricKey,
    minutes: historyRange.value,
    startTime: startText ? Number(startText) : undefined,
    endTime: endText ? Number(endText) : undefined,
    stateFilter: historyStateFilter.value,
  });
};

function formatDateTime(
  value?: number | null,
  options: {
    includeDate?: boolean;
    includeMilliseconds?: boolean;
  } = {},
) {
  if (!value) return "--";
  const time = new Date(value);
  const includeDate = options.includeDate ?? true;
  const includeMilliseconds = options.includeMilliseconds ?? false;
  const year = `${time.getFullYear()}`;
  const month = `${time.getMonth() + 1}`.padStart(2, "0");
  const day = `${time.getDate()}`.padStart(2, "0");
  const hour = `${time.getHours()}`.padStart(2, "0");
  const minute = `${time.getMinutes()}`.padStart(2, "0");
  const second = `${time.getSeconds()}`.padStart(2, "0");
  const milliseconds = `${time.getMilliseconds()}`.padStart(3, "0");
  const datePart = includeDate ? `${year}-${month}-${day} ` : "";
  const timePart = `${hour}:${minute}:${second}`;
  return `${datePart}${timePart}${includeMilliseconds ? `.${milliseconds}` : ""}`;
}
</script>

<style scoped>
.server-metric-detail-dialog :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}
.server-metric-detail-dialog :deep(.el-dialog__body) {
  padding-top: 0;
  max-height: calc(98vh - 104px);
  overflow: auto;
}
.server-metric-detail-dialog__header,
.server-metric-detail-dialog__title-row,
.server-metric-detail-dialog__filters,
.server-metric-detail-dialog__hero,
.server-metric-detail-dialog__chips,
.server-metric-detail-dialog__thresholds,
.server-metric-detail-dialog__panel-header,
.server-metric-detail-dialog__ai-header {
  display: flex;
  align-items: center;
}
.server-metric-detail-dialog__header,
.server-metric-detail-dialog__hero,
.server-metric-detail-dialog__panel-header,
.server-metric-detail-dialog__ai-header {
  justify-content: space-between;
}
.server-metric-detail-dialog__header {
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.server-metric-detail-dialog__title-row {
  gap: 10px;
  margin-bottom: 6px;
}
.server-metric-detail-dialog__title-row h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}
.server-metric-detail-dialog__header p {
  margin: 0;
  color: #64748b;
}
.server-metric-detail-dialog__body {
  display: grid;
  gap: 16px;
  padding-bottom: 8px;
}
.server-metric-detail-dialog__filters {
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.server-metric-detail-dialog__control--select {
  width: 112px;
}
.server-metric-detail-dialog__control--date {
  width: 340px;
}
.server-metric-detail-dialog__filters :deep(.el-select__wrapper),
.server-metric-detail-dialog__filters :deep(.el-range-editor.el-input__wrapper) {
  min-height: 34px;
  border-radius: 12px;
}
.server-metric-detail-dialog__hero,
.server-metric-detail-dialog__chart-panel,
.server-metric-detail-dialog__panel,
.server-metric-detail-dialog__ai-panel {
  border: 1px solid color-mix(in srgb, var(--el-border-color) 76%, transparent);
  border-radius: 24px;
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 10%, transparent),
      transparent 58%
    ),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--el-bg-color-overlay) 98%, white) 0%,
      var(--el-bg-color-overlay) 100%
    );
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.07);
}
.server-metric-detail-dialog__hero {
  gap: 16px;
  padding: 16px 18px;
  position: relative;
  overflow: hidden;
}
.server-metric-detail-dialog__value-card {
  display: grid;
  gap: 6px;
  position: relative;
  z-index: 2;
}
.server-metric-detail-dialog__value-card small,
.server-metric-detail-dialog__thresholds span,
.server-metric-detail-dialog__chip,
.server-metric-detail-dialog__facts dt,
.server-metric-detail-dialog__list-item p,
.server-metric-detail-dialog__list-item small {
  color: #64748b;
}
.server-metric-detail-dialog__value-card strong {
  font-size: 32px;
  line-height: 1;
  color: #0f172a;
}
.server-metric-detail-dialog__chips {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  position: relative;
  z-index: 2;
}
.server-metric-detail-dialog__chip,
.server-metric-detail-dialog__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.server-metric-detail-dialog__chip {
  background: rgba(148, 163, 184, 0.14);
}
.server-metric-detail-dialog__badge.is-success {
  color: #166534;
  background: rgba(34, 197, 94, 0.14);
}
.server-metric-detail-dialog__badge.is-primary {
  color: #1d4ed8;
  background: rgba(37, 99, 235, 0.14);
}
.server-metric-detail-dialog__badge.is-muted {
  color: #64748b;
  background: rgba(148, 163, 184, 0.16);
}
.server-metric-detail-dialog__chart-panel {
  padding: 16px 18px 10px;
}
.server-metric-detail-dialog__ai-panel {
  display: grid;
  gap: 14px;
  padding: 16px 18px;
}
.server-metric-detail-dialog__ai-header {
  gap: 14px;
  flex-wrap: wrap;
}
.server-metric-detail-dialog__ai-header p {
  margin: 4px 0 0;
  color: #64748b;
}
.server-metric-detail-dialog__ai-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.server-metric-detail-dialog__ai-card {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.18);
}
.server-metric-detail-dialog__ai-card small {
  color: #64748b;
}
.server-metric-detail-dialog__ai-card p {
  margin: 0;
  color: #0f172a;
  line-height: 1.7;
  white-space: pre-wrap;
}
.server-metric-detail-dialog__chart-panel header,
.server-metric-detail-dialog__thresholds {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.server-metric-detail-dialog__chart-panel strong {
  display: block;
  margin-bottom: 4px;
  font-size: 16px;
  color: #0f172a;
}
.server-metric-detail-dialog__chart-panel p {
  margin: 0 0 14px;
  color: #64748b;
}
.server-metric-detail-dialog__chart-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.server-metric-detail-dialog__time-range {
  font-size: 12px;
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.1);
  padding: 4px 10px;
  border-radius: 999px;
}
.server-metric-detail-dialog__thresholds {
  gap: 8px;
}
.server-metric-detail-dialog__thresholds span {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
}
.server-metric-detail-dialog__thresholds .is-warning {
  color: #b45309;
  background: rgba(245, 158, 11, 0.12);
}
.server-metric-detail-dialog__thresholds .is-danger {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.12);
}
.server-metric-detail-dialog__grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr);
}
.server-metric-detail-dialog__panel :deep(.el-card__body) {
  padding: 16px 18px;
}
.server-metric-detail-dialog__panel-header strong {
  color: #0f172a;
}
.server-metric-detail-dialog__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
  margin: 0;
}
.server-metric-detail-dialog__facts div {
  display: grid;
  gap: 4px;
}
.server-metric-detail-dialog__facts dt {
  font-size: 12px;
}
.server-metric-detail-dialog__facts dd {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  word-break: break-all;
}
.server-metric-detail-dialog__list {
  display: grid;
  gap: 10px;
  max-height: 320px;
  overflow: auto;
  padding-right: 4px;
}
.server-metric-detail-dialog__list-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.18);
  transition: background 0.3s ease;
}
.server-metric-detail-dialog__list-item:hover {
  background: rgba(255, 255, 255, 0.95);
}
.server-metric-detail-dialog__list-info {
  flex: 1;
  min-width: 0;
}
.server-metric-detail-dialog__list-info strong {
  display: block;
  margin-bottom: 4px;
  color: #0f172a;
  font-size: 14px;
}
.server-metric-detail-dialog__list-info p {
  margin: 0;
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.server-metric-detail-dialog__list-meta {
  display: grid;
  gap: 4px;
  text-align: right;
  min-width: 100px;
}
.server-metric-detail-dialog__list-meta span {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}
.server-metric-detail-dialog__list-meta small {
  font-size: 11px;
  color: #64748b;
  white-space: nowrap;
}
.server-metric-detail-dialog__usage-percent {
  font-size: 16px !important;
  font-weight: 700 !important;
}

/* 液体波浪动画容器 */
.server-metric-detail-dialog__liquid-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}

.server-metric-detail-dialog__liquid-bg {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.server-metric-detail-dialog__value-card
  > *:not(.server-metric-detail-dialog__liquid-container) {
  position: relative;
  z-index: 2;
}

/* 波浪基础样式 */
.server-metric-detail-dialog__wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: 100%;
  z-index: 2;
}

.server-metric-detail-dialog__wave svg {
  width: 100%;
  height: 100%;
}

/* 波浪动画 - 层1 - 最慢 */
.server-metric-detail-dialog__wave--1 {
  animation: wave-float-1 8s ease-in-out infinite;
  z-index: 3;
}

/* 波浪动画 - 层2 - 中速 */
.server-metric-detail-dialog__wave--2 {
  animation: wave-float-2 6s ease-in-out infinite;
  z-index: 4;
}

/* 波浪动画 - 层3 - 最快 */
.server-metric-detail-dialog__wave--3 {
  animation: wave-float-3 4s ease-in-out infinite;
  z-index: 5;
}

/* 波浪浮动动画 - 左侧漂移 */
@keyframes wave-float-1 {
  0%,
  100% {
    transform: translateX(0) translateY(0);
  }
  25% {
    transform: translateX(-5%) translateY(-2px);
  }
  50% {
    transform: translateX(-10%) translateY(0);
  }
  75% {
    transform: translateX(-5%) translateY(2px);
  }
}

/* 波浪浮动动画 - 右侧漂移 */
@keyframes wave-float-2 {
  0%,
  100% {
    transform: translateX(0) translateY(0);
  }
  33% {
    transform: translateX(8%) translateY(-3px);
  }
  66% {
    transform: translateX(-4%) translateY(1px);
  }
}

/* 波浪浮动动画 - 快速波动 */
@keyframes wave-float-3 {
  0%,
  100% {
    transform: translateX(0) translateY(0) scaleY(1);
  }
  25% {
    transform: translateX(-12%) translateY(-2px) scaleY(1.05);
  }
  50% {
    transform: translateX(-6%) translateY(2px) scaleY(0.95);
  }
  75% {
    transform: translateX(-18%) translateY(-1px) scaleY(1.02);
  }
}

/* 已使用覆盖层 */
.server-metric-detail-dialog__liquid-overlay--used {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: rgba(37, 99, 235, 0.08);
  border-right: 2px dashed rgba(37, 99, 235, 0.3);
  z-index: 6;
  pointer-events: auto;
  cursor: pointer;
  transition: background 0.3s ease;
}

.server-metric-detail-dialog__liquid-overlay--used:hover {
  background: rgba(37, 99, 235, 0.15);
}

/* 剩余覆盖层 */
.server-metric-detail-dialog__liquid-overlay--free {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  background: transparent;
  z-index: 6;
  pointer-events: auto;
  cursor: pointer;
  transition: background 0.3s ease;
}

.server-metric-detail-dialog__liquid-overlay--free:hover {
  background: rgba(148, 163, 184, 0.08);
}

@media (max-width: 1100px) {
  .server-metric-detail-dialog__grid {
    grid-template-columns: 1fr;
  }
  .server-metric-detail-dialog__ai-grid {
    grid-template-columns: 1fr;
  }
  .server-metric-detail-dialog__hero,
  .server-metric-detail-dialog__header {
    align-items: flex-start;
    flex-direction: column;
  }
  .server-metric-detail-dialog__chips {
    justify-content: flex-start;
  }
}

@media (max-height: 840px) {
  .server-metric-detail-dialog :deep(.el-dialog__body) {
    max-height: calc(98vh - 88px);
  }

  .server-metric-detail-dialog__hero,
  .server-metric-detail-dialog__chart-panel,
  .server-metric-detail-dialog__ai-panel {
    padding: 14px 16px;
  }

  .server-metric-detail-dialog__panel :deep(.el-card__body) {
    padding: 14px 16px;
  }

  .server-metric-detail-dialog__list {
    max-height: 280px;
  }
}
</style>
