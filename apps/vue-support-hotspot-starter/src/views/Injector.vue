<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">数据注入器</span>
        <ReTag :type="stats.agentActive ? 'success' : 'info'" round>
          {{ stats.agentActive ? "Agent 在线" : "Agent 离线" }}
        </ReTag>
        <span class="match-hint">注入操作产生真实 APM 数据，统计经 SSE 实时刷新</span>
      </div>
      <div class="toolbar-right">
        <ReButton size="small" :icon="Refresh" show-text :loading="statsLoading" @click="loadStats">刷新统计</ReButton>
      </div>
    </div>

    <div class="grid">
      <!-- 卡片1：注入传输调用 -->
      <div class="panel">
        <div class="panel-title">注入传输调用</div>
        <div class="form-row">
          <ReInput v-model="source" placeholder="源端 host:port，如 10.0.0.1:8080" clearable class="grow" />
          <ReInput v-model="target" placeholder="目标 host:port，如 db.lvhzhou:3306" clearable class="grow" />
        </div>
        <div class="form-row">
          <ReSelect v-model="protocol" :data="protocolOptions" class="grow" />
          <ReButton type="primary" :icon="Plus" show-text :loading="injectingTransmission" @click="doInjectTransmission">
            注入 1 条
          </ReButton>
        </div>
        <div class="form-row">
          <ReSwitch v-model="injectedError" active-text="标记为错误调用" />
          <ReButton size="small" text type="primary" @click="historyExpanded = !historyExpanded">
            注入历史（{{ history.length }}）
          </ReButton>
        </div>
        <div class="form-row">
          <ReSelect v-model="batchCount" :data="batchOptions" placeholder="批量条数" class="grow" />
          <ReButton type="primary" :icon="Histogram" show-text :loading="injectingBatch" @click="doInjectBatch">
            批量注入
          </ReButton>
        </div>
      </div>

      <!-- 卡片2：制造资源泄漏 -->
      <div class="panel">
        <div class="panel-title">制造资源泄漏</div>
        <div class="form-row">
          <ReSelect v-model="leakType" :data="leakTypeOptions" placeholder="资源类型" class="grow" />
          <ReInput v-model="leakName" placeholder="资源名（可选）" clearable class="grow" />
        </div>
        <div class="form-row">
          <ReButton type="danger" :icon="Warning" show-text :loading="injectingLeak" @click="doInjectLeak">
            制造 1 条
          </ReButton>
        </div>
      </div>

      <!-- 卡片3：写入日志 -->
      <div class="panel">
        <div class="panel-title">写入日志</div>
        <div class="form-row">
          <ReSelect v-model="logLevel" :data="logLevelOptions" placeholder="级别" class="grow" />
          <ReInput v-model="logMessage" placeholder="日志消息内容" clearable class="grow" />
        </div>
        <div class="form-row">
          <ReButton type="warning" :icon="DocumentAdd" show-text :loading="injectingLog" @click="doInjectLog">
            写入 1 条
          </ReButton>
        </div>
      </div>

      <!-- 卡片4：统计变化（直观效果，SSE 实时） -->
      <div class="panel">
        <div class="panel-title">统计变化（直观效果）</div>
        <ReSkeleton :loading="statsLoading" :rows="2" :animated="true">
          <div class="stat-grid">
            <ReStatCard title="transmissionCount" :value="stats.transmissionCount ?? 0" desc="传输调用总数" :icon="Connection" icon-color="var(--apm-accent)" />
            <ReStatCard title="dependencyCount" :value="stats.dependencyCount ?? 0" desc="依赖边总数" :icon="Share" icon-color="var(--apm-success)" />
            <ReStatCard title="leakCount" :value="stats.leakCount ?? 0" desc="资源泄漏总数" :icon="Warning" icon-color="var(--apm-danger)" />
            <ReStatCard title="errorCount" :value="stats.errorCount ?? 0" desc="错误记录总数" :icon="Close" icon-color="var(--apm-danger)" />
          </div>
        </ReSkeleton>
      </div>

      <!-- 卡片5：注入历史（本会话内操作记录） -->
      <div class="panel history-panel">
        <div class="panel-title">注入历史（本会话）</div>
        <ReEmpty v-if="!history.length" description="尚无注入操作" />
        <div v-else class="history-list">
          <div v-for="(h, i) in history" :key="i" class="history-item">
            <ReTag :type="h.ok ? 'success' : 'danger'" size="small" round>{{ h.ok ? "成功" : "失败" }}</ReTag>
            <span class="history-msg">{{ h.msg }}</span>
            <span class="history-time mono">{{ h.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { Connection, Close, Histogram, DocumentAdd, Plus, Refresh, Share, Warning } from "@element-plus/icons-vue";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReButton from "@repo/ui/re-button";
import ReStatCard from "@repo/ui/re-stat-card";
import ReTag from "@repo/ui/re-tag";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReSwitch from "@repo/ui/re-switch";
import ReEmpty from "@repo/ui/re-empty";
import type { ReOption } from "@repo/ui/re-select";
import { getStats, injectTransmission, injectBatch, injectLeak, injectLog, watchStats } from "../api/apmApi";
import type { ApmStats } from "../api/apmApi";

const stats = ref<ApmStats>({
  agentActive: false,
  agentEnabled: false,
  transmissionCount: 0,
  leakCount: 0,
  errorCount: 0,
  traceCount: 0,
  dependencyCount: 0,
});
const statsLoading = ref(false);
const sseWatch = ref<{ close: () => void } | null>(null);

/** 注入历史（本会话内） */
interface InjectHistoryItem { ok: boolean; msg: string; time: string; }
const history = ref<InjectHistoryItem[]>([]);
const historyExpanded = ref(true);

function recordHistory(ok: boolean, msg: string) {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  history.value.unshift({ ok, msg, time: `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` });
  if (history.value.length > 50) history.value.pop();
}

/** SSE 实时刷新统计（替代手动） */
function startSse() {
  sseWatch.value = watchStats((snapshot) => {
    Object.assign(stats.value, snapshot);
  });
}

async function loadStats() {
  statsLoading.value = true;
  try {
    stats.value = await getStats();
  } catch {
    ElMessage.error("加载统计失败");
  } finally {
    statsLoading.value = false;
  }
}

function refreshAfterInject() {
  loadStats();
}

// ---- 卡片1：注入传输调用 ----
const source = ref("");
const target = ref("");
const protocol = ref("HTTP");
const batchCount = ref(10);
const injectingTransmission = ref(false);
const injectingBatch = ref(false);
const injectedError = ref(false);

const protocolOptions: ReOption[] = [
  { label: "HTTP", value: "HTTP" },
  { label: "REDIS", value: "REDIS" },
  { label: "MYSQL", value: "MYSQL" },
  { label: "GRPC", value: "GRPC" },
  { label: "KAFKA", value: "KAFKA" },
];
const batchOptions: ReOption[] = [
  { label: "10 条", value: 10 },
  { label: "20 条", value: 20 },
  { label: "50 条", value: 50 },
  { label: "100 条", value: 100 },
];

async function doInjectTransmission() {
  injectingTransmission.value = true;
  try {
    await injectTransmission({
      source: source.value.trim() || undefined,
      target: target.value.trim() || undefined,
      protocol: protocol.value || undefined,
      error: injectedError.value || undefined,
    });
    ElMessage.success("已注入 1 条传输调用");
    recordHistory(true, `注入传输 ${protocol.value}${injectedError.value ? "（错误）" : ""} ${source.value || "auto"} → ${target.value || "auto"}`);
    refreshAfterInject();
  } catch {
    recordHistory(false, "注入传输调用失败");
    ElMessage.error("注入传输调用失败");
  } finally {
    injectingTransmission.value = false;
  }
}

async function doInjectBatch() {
  injectingBatch.value = true;
  try {
    await injectBatch(batchCount.value);
    ElMessage.success(`已批量注入 ${batchCount.value} 条传输调用`);
    recordHistory(true, `批量注入 ${batchCount.value} 条传输调用`);
    refreshAfterInject();
  } catch {
    recordHistory(false, `批量注入 ${batchCount.value} 条失败`);
    ElMessage.error("批量注入失败");
  } finally {
    injectingBatch.value = false;
  }
}

// ---- 卡片2：制造资源泄漏 ----
const leakType = ref("File");
const leakName = ref("");
const injectingLeak = ref(false);

const leakTypeOptions: ReOption[] = [
  { label: "File", value: "File" },
  { label: "Socket", value: "Socket" },
  { label: "Connection", value: "Connection" },
  { label: "Thread", value: "Thread" },
];

async function doInjectLeak() {
  injectingLeak.value = true;
  try {
    await injectLeak(leakType.value || undefined, leakName.value.trim() || undefined);
    ElMessage.success(`已制造 1 条 ${leakType.value} 资源泄漏`);
    recordHistory(true, `制造泄漏 ${leakType.value}${leakName.value ? ` · ${leakName.value}` : ""}`);
    refreshAfterInject();
  } catch {
    recordHistory(false, "制造资源泄漏失败");
    ElMessage.error("制造资源泄漏失败");
  } finally {
    injectingLeak.value = false;
  }
}

// ---- 卡片3：写入日志 ----
const logLevel = ref("INFO");
const logMessage = ref("");
const injectingLog = ref(false);

const logLevelOptions: ReOption[] = [
  { label: "INFO", value: "INFO" },
  { label: "WARN", value: "WARN" },
  { label: "ERROR", value: "ERROR" },
  { label: "DEBUG", value: "DEBUG" },
];

async function doInjectLog() {
  injectingLog.value = true;
  try {
    await injectLog(logLevel.value || undefined, logMessage.value.trim() || undefined);
    ElMessage.success(`已写入 1 条 ${logLevel.value} 日志`);
    recordHistory(true, `写入日志 ${logLevel.value}${logMessage.value ? ` · ${logMessage.value.slice(0, 20)}` : ""}`);
    refreshAfterInject();
  } catch {
    recordHistory(false, "写入日志失败");
    ElMessage.error("写入日志失败");
  } finally {
    injectingLog.value = false;
  }
}

onMounted(() => {
  loadStats();
  startSse();
});

onBeforeUnmount(() => {
  sseWatch.value?.close();
});
</script>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--apm-fg);
}

.match-hint {
  font-size: 12px;
  color: var(--apm-muted);
  white-space: nowrap;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.panel {
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--apm-fg);
}

.form-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-row .grow {
  flex: 1;
  min-width: 0;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 480px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
.history-panel {
  grid-column: 1 / -1;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 260px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--apm-border);
  border-radius: 8px;
}

.history-msg {
  flex: 1;
  font-size: 12px;
  color: var(--apm-fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: 11px;
  color: var(--apm-muted);
  font-family: "JetBrains Mono", Consolas, monospace;
}
</style>
