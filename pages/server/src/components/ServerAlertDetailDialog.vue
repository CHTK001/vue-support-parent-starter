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
      </div>
    </template>
    <el-empty v-else description="当前没有可展示的告警详情" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import type { ServerAlertEvent } from "../api";
import {
  formatLatency,
  formatMetricPercent,
  formatThroughput,
} from "../utils/serverHost";

const props = defineProps<{
  modelValue: boolean;
  alert?: ServerAlertEvent | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

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
.server-alert-detail-dialog__json {
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
.server-alert-detail-dialog__json {
  display: grid;
  gap: 14px;
  padding: 16px;
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
}
</style>
