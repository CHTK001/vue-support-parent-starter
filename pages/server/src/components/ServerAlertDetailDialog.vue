<template>
  <el-dialog
    :model-value="modelValue"
    width="760px"
    destroy-on-close
    :title="dialogTitle"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="alert">
      <div class="server-alert-detail-dialog">
        <section class="server-alert-detail-dialog__hero">
          <div>
            <div class="server-alert-detail-dialog__title-row">
              <strong>{{ metricLabel(alert.metricType) }}</strong>
              <span
                class="server-alert-detail-dialog__badge"
                :class="severityClass(alert.severity)"
              >
                {{ severityLabel(alert.severity) }}
              </span>
            </div>
            <p>{{ alert.alertMessage || "已触发服务器预警" }}</p>
          </div>
          <div class="server-alert-detail-dialog__chips">
            <span class="server-alert-detail-dialog__chip">
              {{ alert.createTime || "未知时间" }}
            </span>
            <span class="server-alert-detail-dialog__chip">
              {{ alert.serverCode || `服务器 #${alert.serverId || "-"}` }}
            </span>
          </div>
        </section>

        <section class="server-alert-detail-dialog__facts">
          <article class="server-alert-detail-dialog__fact-card">
            <small>当前值</small>
            <strong>{{ formatAlertMetricValue(alert.metricType, alert.metricValue) }}</strong>
            <span>{{ metricLabel(alert.metricType) }}</span>
          </article>
          <article class="server-alert-detail-dialog__fact-card">
            <small>预警阈值</small>
            <strong>{{ formatAlertMetricValue(alert.metricType, alert.warningThreshold) }}</strong>
            <span>warning</span>
          </article>
          <article class="server-alert-detail-dialog__fact-card">
            <small>危险阈值</small>
            <strong>{{ formatAlertMetricValue(alert.metricType, alert.dangerThreshold) }}</strong>
            <span>danger</span>
          </article>
        </section>

        <section class="server-alert-detail-dialog__payload">
          <header>
            <strong>触发快照</strong>
            <span>{{ payload.collectTimestampText || "无采样时间" }}</span>
          </header>
          <div class="server-alert-detail-dialog__payload-grid">
            <div>
              <dt>服务器编码</dt>
              <dd>{{ payload.serverCode || alert.serverCode || "-" }}</dd>
            </div>
            <div>
              <dt>采样状态</dt>
              <dd>{{ payload.status || "-" }}</dd>
            </div>
            <div>
              <dt>CPU</dt>
              <dd>{{ formatAlertMetricValue("CPU", payload.cpuUsage) }}</dd>
            </div>
            <div>
              <dt>内存</dt>
              <dd>{{ formatAlertMetricValue("MEMORY", payload.memoryUsage) }}</dd>
            </div>
            <div>
              <dt>磁盘</dt>
              <dd>{{ formatAlertMetricValue("DISK", payload.diskUsage) }}</dd>
            </div>
            <div>
              <dt>网络</dt>
              <dd>{{ formatAlertMetricValue("IO", payload.ioTotal) }}</dd>
            </div>
            <div>
              <dt>延迟</dt>
              <dd>{{ formatAlertMetricValue("LATENCY", payload.latencyMs) }}</dd>
            </div>
            <div>
              <dt>采样时间</dt>
              <dd>{{ payload.collectTimestampText || "-" }}</dd>
            </div>
          </div>
        </section>

        <section class="server-alert-detail-dialog__json">
          <header>
            <strong>原始事件</strong>
            <span>供排障与历史核对</span>
          </header>
          <ScCodeEditor
            :model-value="rawPayload"
            :read-only="true"
            height="220px"
            mode="json"
          />
        </section>

        <section class="server-alert-detail-dialog__history">
          <header class="server-alert-detail-dialog__history-header">
            <div>
              <strong>历史告警</strong>
              <span>支持按指标、级别和时间过滤</span>
            </div>
            <div class="server-alert-detail-dialog__history-filters">
              <el-select v-model="historyMetricType" size="small" style="width: 120px">
                <el-option label="全部指标" value="" />
                <el-option
                  v-for="item in historyMetricOptions"
                  :key="item"
                  :label="metricLabel(item)"
                  :value="item"
                />
              </el-select>
              <el-select v-model="historySeverity" size="small" style="width: 100px">
                <el-option label="全部级别" value="" />
                <el-option label="预警" value="WARNING" />
                <el-option label="危险" value="DANGER" />
              </el-select>
              <el-date-picker
                v-model="historyDateRange"
                type="datetimerange"
                unlink-panels
                value-format="x"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
              />
              <el-tooltip
                :content="
                  aiEnabled
                    ? '基于当前筛选历史告警做 AI 分析'
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
                  <IconifyIconOnline icon='ri:ai-generate-2' />
                </el-button>
              </el-tooltip>
            </div>
          </header>
          <section
            v-if="aiEnabled || currentAiAdvice?.aiReason || currentAiAdvice?.aiSolution"
            class="server-alert-detail-dialog__ai"
          >
            <article class="server-alert-detail-dialog__ai-card">
              <small>结论</small>
              <p>{{ currentAiAdvice?.aiReason || "暂无 AI 告警历史分析结果" }}</p>
            </article>
            <article class="server-alert-detail-dialog__ai-card">
              <small>建议</small>
              <p>
                {{
                  currentAiAdvice?.aiSolution ||
                  "当前筛选后的历史告警支持直接发起 AI 分析。"
                }}
              </p>
            </article>
          </section>
          <div
            v-if="filteredHistory.length"
            class="server-alert-detail-dialog__history-list"
          >
            <article
              v-for="item in filteredHistory"
              :key="item.serverAlertEventId || `${item.createTime}-${item.metricType}`"
              class="server-alert-detail-dialog__history-item"
              :class="{ 'is-active': item.serverAlertEventId === alert?.serverAlertEventId }"
              role="button"
              tabindex="0"
              @click="emit('select-alert', item)"
              @keydown.enter.prevent="emit('select-alert', item)"
            >
              <div class="server-alert-detail-dialog__history-main">
                <strong>{{ metricLabel(item.metricType) }}</strong>
                <p>{{ item.alertMessage || "已触发服务器预警" }}</p>
              </div>
              <div class="server-alert-detail-dialog__history-meta">
                <span
                  class="server-alert-detail-dialog__badge"
                  :class="severityClass(item.severity)"
                >
                  {{ severityLabel(item.severity) }}
                </span>
                <small>{{ formatAlertMetricValue(item.metricType, item.metricValue) }}</small>
                <small>{{ item.createTime || "-" }}</small>
              </div>
            </article>
          </div>
          <el-empty v-else description="当前筛选条件下没有历史告警" />
        </section>
      </div>
    </template>
    <el-empty v-else description="当前没有可展示的告警详情" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import type { ServerAiTaskPayload, ServerAlertEvent } from "../api";
import { buildAlertHistoryAiFilterKey } from "../utils/historyAi";
import {
  formatLatency,
  formatMetricPercent,
  formatThroughput,
} from "../utils/serverHost";

const props = defineProps<{
  modelValue: boolean;
  alert?: ServerAlertEvent | null;
  history?: ServerAlertEvent[];
  aiEnabled?: boolean;
  aiAnalyzingKey?: string;
  aiAdviceMap?: Record<string, ServerAiTaskPayload>;
  aiUnavailableReason?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "select-alert": [value: ServerAlertEvent];
  "analyze-history": [
    payload: {
      metricType?: string;
      severity?: string;
      startTime?: number;
      endTime?: number;
      limit: number;
    },
  ];
}>();

const historyMetricType = ref("");
const historySeverity = ref("");
const historyDateRange = ref<[string, string] | []>([]);
const alertAnalyzeLimit = computed(
  () => Math.min(filteredHistory.value.length || 0, 80) || 20,
);

const currentAiFilterKey = computed(() =>
  buildAlertHistoryAiFilterKey(props.alert?.serverId, {
    metricType: historyMetricType.value,
    severity: historySeverity.value,
    startTime: historyDateRange.value[0]
      ? Number(historyDateRange.value[0])
      : undefined,
    endTime: historyDateRange.value[1]
      ? Number(historyDateRange.value[1])
      : undefined,
    limit: alertAnalyzeLimit.value,
  }),
);

const currentAiAdvice = computed(
  () => props.aiAdviceMap?.[currentAiFilterKey.value] || null,
);

const currentAiAnalyzing = computed(
  () => props.aiAnalyzingKey === currentAiFilterKey.value,
);

watch(
  () => props.alert?.metricType,
  (value) => {
    historyMetricType.value = String(value || "");
  },
  { immediate: true },
);

const metricLabel = (value?: string | null) =>
  value === "CPU"
    ? "CPU"
    : value === "MEMORY"
      ? "内存"
      : value === "DISK"
        ? "磁盘"
        : value === "DISK_IO"
          ? "磁盘IO"
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

const formatDateTime = (value?: number | string | null) => {
  if (!value) {
    return "";
  }
  const source =
    typeof value === "number" ? new Date(value) : new Date(String(value));
  if (Number.isNaN(source.getTime())) {
    return String(value);
  }
  const year = source.getFullYear();
  const month = `${source.getMonth() + 1}`.padStart(2, "0");
  const day = `${source.getDate()}`.padStart(2, "0");
  const hour = `${source.getHours()}`.padStart(2, "0");
  const minute = `${source.getMinutes()}`.padStart(2, "0");
  const second = `${source.getSeconds()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const formatAlertMetricValue = (
  metricType?: string | null,
  value?: number | null,
) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "--";
  }
  if (metricType === "IO") {
    return formatThroughput(numeric);
  }
  if (metricType === "DISK_IO") {
    return formatThroughput(numeric);
  }
  if (metricType === "LATENCY") {
    return formatLatency(numeric);
  }
  return `${formatMetricPercent(numeric)}%`;
};

const payload = computed(() => {
  const fallback = {
    serverCode: props.alert?.serverCode || "",
    status: "",
    latencyMs: undefined,
    cpuUsage: undefined,
    memoryUsage: undefined,
    diskUsage: undefined,
    ioReadBytesPerSecond: undefined,
    ioWriteBytesPerSecond: undefined,
    ioTotal: undefined,
    collectTimestampText: "",
  };
  const snapshotJson = props.alert?.snapshotJson;
  if (!snapshotJson?.trim()) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(snapshotJson) as Record<string, unknown>;
    const ioRead = Number(parsed.ioReadBytesPerSecond || 0);
    const ioWrite = Number(parsed.ioWriteBytesPerSecond || 0);
    return {
      serverCode: String(parsed.serverCode || fallback.serverCode || ""),
      status: String(parsed.status || ""),
      latencyMs: Number(parsed.latencyMs || 0) || undefined,
      cpuUsage: Number(parsed.cpuUsage || 0) || undefined,
      memoryUsage: Number(parsed.memoryUsage || 0) || undefined,
      diskUsage: Number(parsed.diskUsage || 0) || undefined,
      diskReadBytesPerSecond:
        Number(parsed.diskReadBytesPerSecond || 0) || undefined,
      diskWriteBytesPerSecond:
        Number(parsed.diskWriteBytesPerSecond || 0) || undefined,
      ioReadBytesPerSecond: ioRead || undefined,
      ioWriteBytesPerSecond: ioWrite || undefined,
      ioTotal: ioRead + ioWrite || undefined,
      collectTimestampText: formatDateTime(
        parsed.collectTimestamp as number | string | null | undefined,
      ),
    };
  } catch {
    return fallback;
  }
});

const dialogTitle = computed(() =>
  props.alert ? `${metricLabel(props.alert.metricType)} 告警详情` : "告警详情",
);

const historyMetricOptions = computed(() =>
  Array.from(
    new Set(
      (props.history || [])
        .map((item) => String(item.metricType || "").trim())
        .filter(Boolean),
    ),
  ),
);

const filteredHistory = computed(() => {
  const [startText, endText] = historyDateRange.value;
  const startTime = startText ? Number(startText) : 0;
  const endTime = endText ? Number(endText) : 0;
  return (props.history || []).filter((item) => {
    if (historyMetricType.value && item.metricType !== historyMetricType.value) {
      return false;
    }
    if (historySeverity.value && item.severity !== historySeverity.value) {
      return false;
    }
    if (startTime || endTime) {
      const createTime = new Date(String(item.createTime || "")).getTime() || 0;
      if ((startTime && createTime < startTime) || (endTime && createTime > endTime)) {
        return false;
      }
    }
    return true;
  });
});

const emitAnalyzeHistory = () => {
  const [startText, endText] = historyDateRange.value;
  emit("analyze-history", {
    metricType: historyMetricType.value || undefined,
    severity: historySeverity.value || undefined,
    startTime: startText ? Number(startText) : undefined,
    endTime: endText ? Number(endText) : undefined,
    limit: alertAnalyzeLimit.value,
  });
};

const rawPayload = computed(() =>
  JSON.stringify(
    {
      ...props.alert,
      parsedSnapshot: payload.value,
    },
    null,
    2,
  ),
);
</script>

<style scoped lang="scss">
.server-alert-detail-dialog {
  display: grid;
  gap: 16px;
}

.server-alert-detail-dialog__hero,
.server-alert-detail-dialog__facts,
.server-alert-detail-dialog__payload,
.server-alert-detail-dialog__json,
.server-alert-detail-dialog__history {
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  border-radius: 22px;
  background: color-mix(in srgb, var(--el-bg-color-page) 88%, white);
}

.server-alert-detail-dialog__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 10%, transparent),
      transparent 58%
    ),
    color-mix(in srgb, var(--el-bg-color-page) 88%, white);
}

.server-alert-detail-dialog__title-row,
.server-alert-detail-dialog__chips,
.server-alert-detail-dialog__payload header,
.server-alert-detail-dialog__json header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.server-alert-detail-dialog__title-row strong {
  font-size: 18px;
}

.server-alert-detail-dialog__hero p,
.server-alert-detail-dialog__payload header span,
.server-alert-detail-dialog__json header span {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
}

.server-alert-detail-dialog__badge,
.server-alert-detail-dialog__chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.server-alert-detail-dialog__badge.is-warning {
  color: #b45309;
  background: rgba(251, 191, 36, 0.16);
}

.server-alert-detail-dialog__badge.is-danger {
  color: #b91c1c;
  background: rgba(248, 113, 113, 0.14);
}

.server-alert-detail-dialog__badge.is-muted,
.server-alert-detail-dialog__chip {
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-fill-color-light) 90%, white);
}

.server-alert-detail-dialog__facts {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 16px;
}

.server-alert-detail-dialog__fact-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--el-bg-color) 72%, white);
}

.server-alert-detail-dialog__fact-card small,
.server-alert-detail-dialog__fact-card span,
.server-alert-detail-dialog__payload-grid dt {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-alert-detail-dialog__fact-card strong {
  font-size: 20px;
  line-height: 1.1;
}

.server-alert-detail-dialog__payload,
.server-alert-detail-dialog__json,
.server-alert-detail-dialog__history {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.server-alert-detail-dialog__history-header,
.server-alert-detail-dialog__history-filters,
.server-alert-detail-dialog__history-item {
  display: flex;
  align-items: center;
}

.server-alert-detail-dialog__history-header,
.server-alert-detail-dialog__history-item {
  justify-content: space-between;
  gap: 14px;
}

.server-alert-detail-dialog__history-header span {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}

.server-alert-detail-dialog__history-filters {
  gap: 10px;
  flex-wrap: wrap;
}

.server-alert-detail-dialog__history-list {
  display: grid;
  gap: 10px;
  max-height: 320px;
  overflow: auto;
}

.server-alert-detail-dialog__ai {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.server-alert-detail-dialog__ai-card {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--el-bg-color) 72%, white);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 80%, transparent);
}

.server-alert-detail-dialog__ai-card small {
  color: var(--el-text-color-secondary);
}

.server-alert-detail-dialog__ai-card p {
  margin: 0;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
}

.server-alert-detail-dialog__history-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--el-bg-color) 72%, white);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 80%, transparent);
  cursor: pointer;
}

.server-alert-detail-dialog__history-item.is-active {
  border-color: color-mix(in srgb, var(--el-color-primary) 48%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
}

.server-alert-detail-dialog__history-main {
  min-width: 0;
}

.server-alert-detail-dialog__history-main strong {
  display: block;
  margin-bottom: 4px;
}

.server-alert-detail-dialog__history-main p,
.server-alert-detail-dialog__history-meta small {
  color: var(--el-text-color-secondary);
}

.server-alert-detail-dialog__history-main p {
  margin: 0;
}

.server-alert-detail-dialog__history-meta {
  display: grid;
  gap: 4px;
  justify-items: end;
}

.server-alert-detail-dialog__payload-grid {
  display: grid;
  gap: 12px 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.server-alert-detail-dialog__payload-grid div {
  display: grid;
  gap: 4px;
}

.server-alert-detail-dialog__payload-grid dd {
  margin: 0;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

@media (max-width: 900px) {
  .server-alert-detail-dialog__hero,
  .server-alert-detail-dialog__facts,
  .server-alert-detail-dialog__payload-grid {
    grid-template-columns: 1fr;
  }

  .server-alert-detail-dialog__hero {
    display: grid;
  }

  .server-alert-detail-dialog__facts {
    display: grid;
  }

  .server-alert-detail-dialog__history-header,
  .server-alert-detail-dialog__history-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .server-alert-detail-dialog__ai {
    grid-template-columns: 1fr;
  }
}
</style>
