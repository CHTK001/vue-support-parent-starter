<template>
  <div class="view">
    <!-- 工具栏：Agent 状态总览 -->
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">Agent 管理中心</span>
        <ReTag :type="agentStatusTagType" round>{{ agentStatusLabel }}</ReTag>
        <span class="match-hint">Agent 配置、健康状态与采样能力总览</span>
      </div>

      <div class="toolbar-right">
        <ReButton
          :icon="store.agentEnabled ? CircleClose : CircleCheck"
          show-text
          :type="store.agentEnabled ? 'danger' : 'success'"
          :loading="statusLoading"
          @click="toggleAgentEnabled(!store.agentEnabled)"
        >
          {{ store.agentEnabled ? "停用 Agent" : "启用 Agent" }}
        </ReButton>
        <ReButton :icon="Refresh" show-text :loading="statusLoading" @click="refreshAll">刷新</ReButton>
      </div>
    </div>

    <!-- 实时状态卡：健康 / 采样 / Agent 心跳 -->
    <div class="stat-grid">
      <ReStatCard
        size="compact"
        title="健康状态"
        :value="healthLabel"
        :desc="healthDesc"
        :icon="DataAnalysis"
        icon-color="var(--apm-accent)"
      />
      <ReStatCard
        size="compact"
        title="Agent"
        :value="agentActive ? '在线' : '离线'"
        desc="字节码注入 / 数据采集"
        :icon="Connection"
        :icon-color="agentActive ? 'var(--apm-success)' : 'var(--apm-danger)'"
      />
      <ReStatCard
        size="compact"
        title="采样率"
        :value="agentConfig ? agentConfig.samplingRate + '%' : '—'"
        desc="调用链采样比例"
        :icon="Histogram"
        icon-color="var(--apm-warning)"
      />
      <ReStatCard
        size="compact"
        title="延迟"
        :value="lastLatencyMs >= 0 ? (lastLatencyMs >= 1000 ? (lastLatencyMs / 1000).toFixed(1) + 's' : lastLatencyMs + 'ms') : '—'"
        desc="最近一次状态探测"
        :icon="Timer"
        icon-color="var(--apm-muted)"
      />
    </div>

    <!-- Agent 配置面板 -->
    <div class="panel">
      <div class="panel-head">
        <span>Agent 配置</span>
        <span class="panel-sub">采样率、慢调用阈值、日志级别</span>
        <el-button
          v-if="agentConfig"
          text
          size="small"
          class="config-reset-btn"
          @click="resetConfigForm"
        >恢复默认</el-button>
      </div>

      <div v-if="agentConfigLoading" class="panel-empty">正在读取 Agent 配置…</div>
      <div v-else-if="!agentConfig" class="panel-empty">
        未能读取 Agent 配置，后端可能未实现 /agent/config 接口。以下为本地演示配置。
      </div>

      <div v-if="agentConfig || configDraft" class="config-grid">
        <div class="filter-field">
          <label class="filter-label">采样率</label>
          <div class="range-wrap">
            <el-slider
              v-model="configDraft.samplingRate"
              :min="0"
              :max="100"
              :step="5"
              :disabled="configSaving"
            />
            <span class="range-value mono">{{ configDraft.samplingRate }}%</span>
          </div>
        </div>

        <div class="filter-field">
          <label class="filter-label">慢调用阈值（ms）</label>
          <el-input-number
            v-model="configDraft.slowThresholdMs"
            :min="10"
            :max="60000"
            :step="10"
            :disabled="configSaving"
          />
        </div>

        <div class="filter-field">
          <label class="filter-label">日志级别</label>
          <ReSelect v-model="configDraft.logLevel" :data="logLevelOptions" :disabled="configSaving" />
        </div>

        <div class="filter-field">
          <label class="filter-label">注入模式</label>
          <ReSelect v-model="configDraft.injectMode" :data="injectModeOptions" :disabled="configSaving" />
        </div>

        <div class="filter-field">
          <label class="filter-label">Agent 启用</label>
          <ReSwitch v-model="configDraft.enabled" active-text="启用" inactive-text="停用" />
        </div>

        <div class="config-actions">
          <ReButton
            type="primary"
            :icon="Check"
            show-text
            :loading="configSaving"
            :disabled="!configChanged"
            @click="saveConfig"
          >保存配置</ReButton>
          <ReButton
            text
            :icon="Refresh"
            show-text
            :loading="statusLoading"
            @click="loadAgentConfig"
          >重新读取</ReButton>
        </div>
      </div>
    </div>

    <!-- 健康详情 + 数据源 -->
    <div class="chart-grid">
      <div class="panel">
        <div class="panel-head">
          <span>健康详情</span>
          <span class="panel-sub">最近 60s 窗口</span>
        </div>
        <div v-if="health" class="health-detail">
          <div class="health-line">
            <span class="health-key">QPS</span>
            <b class="health-value mono">{{ health.qps.toFixed(1) }}</b>
          </div>
          <div class="health-line">
            <span class="health-key">错误率</span>
            <b class="health-value mono">{{ health.errorRate.toFixed(2) }}%</b>
          </div>
          <div class="health-line">
            <span class="health-key">活跃泄漏</span>
            <b class="health-value mono">{{ health.activeLeaks }}</b>
          </div>
          <div class="health-line">
            <span class="health-key">窗口</span>
            <b class="health-value mono">{{ health.windowSeconds }}s</b>
          </div>
        </div>
        <div v-else class="panel-empty">尚未获取到健康数据，请刷新。</div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <span>数据通道</span>
          <span class="panel-sub">WebSocket / SSE 实时状态</span>
        </div>
        <div class="channel-status">
          <div class="channel-line">
            <span class="channel-dot" :class="realtimeConnected ? 'ok' : 'off'" />
            <span>WebSocket</span>
            <span class="mono muted">{{ rt.wsConnected.value ? "已连接" : "未连接" }}</span>
          </div>
          <div class="channel-line">
            <span class="channel-dot" :class="realtimeConnected ? 'ok' : 'off'" />
            <span>SSE</span>
            <span class="mono muted">{{ rt.connected.value ? "已连接" : "未连接" }}</span>
          </div>
          <div class="channel-line">
            <span class="channel-dot" :class="agentActive ? 'ok' : 'off'" />
            <span>Agent 数据源</span>
            <span class="mono muted">{{ agentActive ? "采集正常" : "降级模式" }}</span>
          </div>
          <div class="channel-line">
            <span class="channel-dot" :class="lastLatencyMs >= 0 && lastLatencyMs < 1000 ? 'ok' : 'warn'" />
            <span>状态探测</span>
            <span class="mono muted">{{ lastLatencyMs >= 0 ? formatLatency(lastLatencyMs) : "未探测" }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import {
  DataAnalysis,
  Connection,
  Histogram,
  Timer,
  Refresh,
  Check,
  CircleClose,
  CircleCheck,
} from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReTag from "@repo/ui/re-tag";
import ReStatCard from "@repo/ui/re-stat-card";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import type { ReOption } from "@repo/ui/re-select";
import { message } from "@repo/core";
import { useApmStore } from "../stores/apmStore";
import { updateAgentConfig, setAgentEnabled } from "../api/apmApi";
import type { AgentConfig } from "../api/apmApi";
import { useRealtimeStatus } from "../composables/useRealtime";

const store = useApmStore();
const rt = useRealtimeStatus();

/** 从 store 暴露给模板的响应式状态 */
const agentConfig = computed(() => store.agentConfig);
const agentConfigLoading = computed(() => store.agentConfigLoading);
const health = computed(() => store.health);

const statusLoading = ref(false);
const configSaving = ref(false);

const logLevelOptions: ReOption[] = [
  { label: "TRACE", value: "TRACE" },
  { label: "DEBUG", value: "DEBUG" },
  { label: "INFO", value: "INFO" },
  { label: "WARN", value: "WARN" },
  { label: "ERROR", value: "ERROR" },
];

const injectModeOptions: ReOption[] = [
  { label: "禁止注入", value: "DISABLED" },
  { label: "仅监控", value: "MONITOR" },
  { label: "模拟注入", value: "SIMULATE" },
];

/** 本地演示配置草稿（后端无接口时也可操作） */
const configDraft = reactive<AgentConfig>({
  samplingRate: 100,
  slowThresholdMs: 500,
  logLevel: "INFO",
  enabled: true,
  injectMode: "SIMULATE",
});

/** 后端读取到配置后同步到草稿 */
function syncConfigFromStore() {
  if (store.agentConfig) {
    Object.assign(configDraft, store.agentConfig);
  }
}

function restoreDefaults() {
  const cfg: AgentConfig = {
    samplingRate: 100,
    slowThresholdMs: 500,
    logLevel: "INFO",
    enabled: true,
    injectMode: "SIMULATE",
  };
  Object.assign(configDraft, cfg);
}

watch(
  () => store.agentConfig,
  (cfg) => {
    if (cfg) Object.assign(configDraft, cfg);
  },
);

const configChanged = computed(
  () =>
    !!store.agentConfig &&
    (configDraft.samplingRate !== store.agentConfig.samplingRate ||
      configDraft.slowThresholdMs !== store.agentConfig.slowThresholdMs ||
      configDraft.logLevel !== store.agentConfig.logLevel ||
      configDraft.injectMode !== store.agentConfig.injectMode ||
      configDraft.enabled !== store.agentConfig.enabled),
);

const agentStatusLabel = computed(() => {
  if (!store.agentEnabled) return "Agent 已停用";
  if (store.agentActive) return "Agent 在线";
  return "Agent 离线";
});
const agentStatusTagType = computed<"success" | "warning" | "danger" | "info">(() => {
  if (!store.agentEnabled) return "info";
  if (store.agentActive) return "success";
  return "danger";
});

const agentActive = computed(() => store.agentActive);
const lastLatencyMs = computed(() => store.lastLatencyMs);

const healthLabel = computed(() => {
  if (!store.health) return "—";
  return { HEALTHY: "健康", DEGRADED: "降级", SATURATED: "饱和" }[store.health.health] ?? "—";
});
const healthDesc = computed(() => {
  if (!store.health) return "暂无健康数据";
  return `错误率 ${store.health.errorRate.toFixed(2)}% · QPS ${store.health.qps.toFixed(1)}`;
});

const realtimeConnected = computed(() => rt.wsConnected.value || rt.connected.value);

async function loadAgentConfig() {
  const cfg = await store.loadAgentConfig();
  if (cfg) {
    Object.assign(configDraft, cfg);
  }
}

async function refreshAll() {
  statusLoading.value = true;
  try {
    await Promise.all([store.pollStatus(), store.loadHealth(), loadAgentConfig()]);
  } finally {
    statusLoading.value = false;
  }
}

async function saveConfig() {
  configSaving.value = true;
  try {
    const saved = await updateAgentConfig({
      samplingRate: configDraft.samplingRate,
      slowThresholdMs: configDraft.slowThresholdMs,
      logLevel: configDraft.logLevel,
      injectMode: configDraft.injectMode,
      enabled: configDraft.enabled,
    });
    store.agentConfig = saved;
    syncConfigFromStore();
    message.success("Agent 配置已保存");
  } catch {
    // 后端未实现时保留本地草稿，仅提示保存失败
    message.warning("配置保存失败，后端 /agent/config 可能未开放");
  } finally {
    configSaving.value = false;
  }
}

async function toggleAgentEnabled(enabled: boolean) {
  try {
    await setAgentEnabled(enabled);
    store.$patch({ agentEnabled: enabled, agentActive: enabled ? store.agentActive : false });
    message.success(enabled ? "Agent 已启用" : "Agent 已停用");
  } catch {
    message.error("启停 Agent 失败");
  }
}

function formatLatency(ms: number): string {
  if (ms < 0) return "失败";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function resetConfigForm() {
  restoreDefaults();
}

let pollTimer: number | undefined;

onMounted(async () => {
  await refreshAll();
  pollTimer = window.setInterval(() => {
    store.pollStatus();
  }, 15000);
});

onBeforeUnmount(() => {
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = undefined;
  }
});
</script>

<style scoped>
/* .view / .view-toolbar / .stat-grid / .panel / .panel-head / .panel-sub /
   .panel-empty / .filter-field / .filter-label / .mono / .muted / .live-dot
   由 styles/layout.css 提供 */

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--apm-space-4);
  padding-top: var(--apm-space-2);
}

.range-wrap {
  display: flex;
  align-items: center;
  gap: var(--apm-space-3);
}

.range-wrap .el-slider {
  flex: 1 1 auto;
}

.range-value {
  min-width: 48px;
  text-align: right;
  font-size: 12px;
  color: var(--apm-fg);
}

.config-actions {
  display: flex;
  align-items: flex-end;
  gap: var(--apm-space-2);
}

.config-reset-btn {
  margin-left: auto;
  font-size: 12px;
}

.panel-empty {
  padding: var(--apm-space-5) 0;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--apm-space-4);
}

.health-detail {
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-2);
  padding: var(--apm-space-2) 0;
}

.health-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  padding: 6px 0;
  border-bottom: 1px dashed var(--apm-border-soft);
}

.health-line:last-child {
  border-bottom: none;
}

.health-key {
  color: var(--apm-muted);
}

.health-value {
  color: var(--apm-fg);
  font-variant-numeric: tabular-nums;
}

.channel-status {
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-3);
  padding: var(--apm-space-2) 0;
}

.channel-line {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
  font-size: 13px;
}

.channel-line .mono {
  margin-left: auto;
}

.channel-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.channel-dot.ok {
  background: var(--apm-success);
}

.channel-dot.warn {
  background: var(--apm-warning);
}

.channel-dot.off {
  background: var(--apm-danger);
}

@media (prefers-reduced-motion: reduce) {
  .channel-dot {
    animation: none;
  }
}
</style>