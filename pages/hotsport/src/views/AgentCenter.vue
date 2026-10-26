<template>
  <div class="view">
    <!-- 操作条：无标题大卡 -->
    <div class="view-bar">
      <span class="match-hint">
        <ReTag :type="agentStatusTagType" round>{{ agentStatusLabel }}</ReTag>
      </span>

      <div class="view-bar__actions">
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
      <div class="panel-head-row">
        <div class="panel-head">
          <span>Agent 配置</span>
          <span class="panel-sub">采样率、慢调用阈值、日志级别</span>
        </div>
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

    <!-- 句柄检测：当前进程全量句柄 + 分配堆栈 + FD + 线程 -->
    <div class="panel">
      <div class="panel-head-row">
        <div class="panel-head">
          <span>句柄检测</span>
          <span class="panel-sub">文件 / Socket / 线程 / JDBC 连接全量清单</span>
        </div>
        <ReButton text size="small" :loading="handleLoading" @click="loadHandles">刷新</ReButton>
      </div>
      <div v-if="handleLoading" class="panel-empty">正在扫描句柄…</div>
      <div v-else-if="!handleSnapshot" class="panel-empty">尚未获取句柄数据，请刷新。</div>
      <div v-else class="handle-grid">
        <div v-for="(count, kind) in handleSnapshot.summary" :key="kind" class="handle-stat">
          <b class="handle-count mono">{{ count }}</b>
          <span class="handle-kind">{{ kind }}</span>
        </div>
      </div>
      <div v-if="handleSnapshot" class="handle-table-wrap">
        <ReTable
          :data="handleRows"
          :columns="handleColumns"
          engine="element"
          :settings="{ border: false }"
          :layout-table="{ minHeight: 0 }"
          class="apm-table"
          empty-text="暂无句柄记录"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <template #col-kind="{ row }">
            <ReTag size="small" round>{{ row.kind }}</ReTag>
          </template>
          <template #col-name="{ row }">
            <span class="mono" :title="String(row.name ?? '')">{{ shortText(String(row.name ?? ""), 30) }}</span>
          </template>
          <template #col-ownerThread="{ row }">
            <span class="muted">{{ row.ownerThread || "—" }}</span>
          </template>
          <template #col-createdAt="{ row }">
            <span class="mono muted">{{ formatTime(Number(row.createdAt ?? 0)) }}</span>
          </template>
          <template #col-closed="{ row }">
            <span class="mono">{{ row.closed ? "已关闭" : formatAge(Date.now() - Number(row.createdAt ?? 0)) }}</span>
          </template>
        </ReTable>
      </div>
      <div v-if="handleSnapshot?.fileDescriptors.length" class="fd-list">
        <span class="fd-title muted">FD 近览（{{ handleSnapshot.fileDescriptors.length }}）</span>
        <span v-for="fd in handleSnapshot.fileDescriptors.slice(0, 8)" :key="fd.fd" class="fd-chip mono">
          {{ fd.fd }} → {{ shortText(fd.target, 24) }}
        </span>
      </div>
    </div>

    <!-- System.out / System.err 实时捕获 -->
    <div class="panel">
      <div class="panel-head-row">
        <div class="panel-head">
          <span>系统输出捕获</span>
          <span class="panel-sub">System.out / System.err 实时流</span>
        </div>
        <ReButton text size="small" :loading="sysOutLoading" @click="loadSysOut">刷新</ReButton>
      </div>
      <div v-if="sysOutLoading" class="panel-empty">正在读取系统输出…</div>
      <div v-else-if="!sysOutEntries.length" class="panel-empty">暂无 System.out / System.err 输出。</div>
      <div v-else class="sysout-list">
        <div v-for="(e, i) in sysOutEntries" :key="i" class="sysout-row">
          <ReTag size="small" :type="e.level === 'ERROR' ? 'danger' : 'info'" round>{{ e.source }}</ReTag>
          <span class="mono muted">{{ e.timestamp }}</span>
          <span class="sysout-line mono">{{ e.line }}</span>
        </div>
      </div>
    </div>

    <!-- JVM 内存诊断：对象内存池 + 手动 GC + 类加载 -->
    <div class="panel">
      <div class="panel-head-row">
        <div class="panel-head">
          <span>JVM 内存诊断</span>
          <span class="panel-sub">对象内存池 / 手动 GC / 类加载统计</span>
        </div>
        <ReButton text size="small" :loading="memoryLoading" @click="loadMemoryDiagnostics">刷新</ReButton>
      </div>
      <div v-if="memoryLoading" class="panel-empty">正在读取内存诊断…</div>
      <div v-else-if="!memorySnapshot" class="panel-empty">尚未获取内存数据，请刷新。</div>
      <div v-else class="memory-actions">
        <div class="memory-summary">
          <span class="memory-summary-label muted">堆使用率</span>
          <b class="memory-summary-value mono">{{ memorySnapshot.heap.usedPercent }}%</b>
          <span class="memory-summary-desc muted">
            {{ formatBytes(memorySnapshot.heap.used) }} / {{ formatBytes(memorySnapshot.heap.max) }}
          </span>
        </div>
        <ReButton
          type="danger"
          :icon="Delete"
          show-text
          :loading="gcRunning"
          @click="runGc"
        >手动 GC</ReButton>
      </div>
      <div v-if="lastGcResult" class="gc-result">
        <span class="muted">上次 GC 释放</span>
        <b class="mono gc-freed">{{ formatBytes(lastGcResult.freedBytes) }}</b>
        <span class="muted">耗时 {{ lastGcResult.elapsedMs }}ms</span>
      </div>
      <div v-if="memorySnapshot?.pools.length" class="memory-pool-list">
        <div v-for="pool in memorySnapshot.pools" :key="pool.name" class="memory-pool-row">
          <div class="memory-pool-head">
            <span class="mono">{{ pool.name }}</span>
            <ReTag size="small" :type="pool.type === 'HEAP' ? 'warning' : 'info'" round>{{ pool.type }}</ReTag>
            <span class="mono muted memory-pool-used">{{ formatBytes(pool.used) }}</span>
          </div>
          <div class="memory-pool-bar">
            <i :style="{ width: Math.min(100, pool.usedPercent) + '%' }" />
          </div>
        </div>
      </div>
      <div v-if="classLoadingInfo" class="class-loading">
        <span class="muted">已加载类</span>
        <b class="mono">{{ classLoadingInfo.loadedClassCount }}</b>
        <span class="muted">累计加载</span>
        <b class="mono">{{ classLoadingInfo.totalLoadedClassCount }}</b>
        <span class="muted">卸载</span>
        <b class="mono">{{ classLoadingInfo.unloadedClassCount }}</b>
      </div>
    </div>

    <!-- 线程 Dump：全量线程栈定位死锁 / 阻塞 -->
    <div class="panel">
      <div class="panel-head-row">
        <div class="panel-head">
          <span>线程 Dump</span>
          <span class="panel-sub">全量线程栈 / 锁状态 / 死锁排查</span>
        </div>
        <ReButton text size="small" :loading="threadDumpLoading" @click="loadThreadDump">刷新</ReButton>
      </div>
      <div v-if="threadDumpLoading" class="panel-empty">正在抓取线程 Dump…</div>
      <div v-else-if="!threadDumpEntries.length" class="panel-empty">暂无线程信息。</div>
      <div v-else class="thread-dump-summary">
        <span class="muted">线程总数</span>
        <b class="mono">{{ threadDumpEntries.length }}</b>
        <span class="muted">DAEMON</span>
        <b class="mono">{{ daemonCount }}</b>
        <span class="muted">BLOCKED</span>
        <b class="mono">{{ blockedCount }}</b>
      </div>
      <div class="thread-dump-list">
        <details v-for="t in threadDumpEntries" :key="t.threadId" class="thread-dump-item">
          <summary>
            <span class="mono thread-dump-name">{{ t.name }}</span>
            <ReTag size="small" :type="threadStateTagType(t.state)" round>{{ t.state }}</ReTag>
            <span class="mono muted">#{{ t.threadId }}</span>
          </summary>
          <div class="thread-dump-body">
            <div v-if="t.lockName" class="thread-dump-lock muted">锁: {{ t.lockName }} / owner: {{ t.lockOwnerName || "—" }}</div>
            <pre class="thread-dump-stack mono">{{ t.stackTrace.slice(0, 20).join("\n") }}</pre>
          </div>
        </details>
      </div>
    </div>

    <!-- 链路分析：方法热点 / 阶段耗时 / SkyWalking 兼容导出 -->
    <div class="panel">
      <div class="panel-head-row">
        <div class="panel-head">
          <span>链路分析</span>
          <span class="panel-sub">方法热点 / 阶段耗时 / SkyWalking Segment</span>
        </div>
        <ReButton text size="small" :loading="traceLoading" @click="loadTraceAnalysis">刷新</ReButton>
      </div>
      <div v-if="traceLoading" class="panel-empty">正在聚合链路数据…</div>
      <div v-else-if="!traceHotspots.length && !tracePhases.length && !skywalkingSegments.length" class="panel-empty">
        暂无链路数据：本进程还没有产生任何真实请求记录。
      </div>
      <div v-else class="trace-analysis">
        <div v-if="tracePhases.length" class="phase-grid">
          <div v-for="p in tracePhases" :key="p.phase" class="phase-stat" :class="'phase-' + p.phase">
            <span class="phase-label">{{ p.phase }}</span>
            <b class="phase-value mono">{{ p.avgMs.toFixed(1) }}ms</b>
            <span class="phase-count muted">×{{ p.count }} · max {{ p.maxMs }}ms</span>
          </div>
        </div>
        <div v-if="traceHotspots.length" class="hotspot-list">
          <div v-for="h in traceHotspots.slice(0, 10)" :key="hotspotName(h) + h.phase" class="hotspot-row">
            <span class="hotspot-name mono" :title="hotspotName(h)">{{ shortText(hotspotName(h), 42) }}</span>
            <ReTag size="small" round>{{ h.phase }}</ReTag>
            <span class="hotspot-bar-wrap"><i class="hotspot-bar" :style="{ width: hotspotWidth(h) + '%' }" /></span>
            <span class="hotspot-avg mono">{{ h.avgMs.toFixed(1) }}ms</span>
            <span class="hotspot-count muted mono">×{{ h.count }}</span>
          </div>
        </div>
        <div v-if="skywalkingSegments.length" class="sw-section">
          <div class="sw-head muted">SkyWalking 兼容 Segment（{{ skywalkingSegments.length }}）</div>
          <div class="sw-list">
            <div v-for="seg in skywalkingSegments.slice(0, 6)" :key="seg.traceId" class="sw-row">
              <span class="sw-trace mono">{{ shortText(seg.traceId, 18) }}</span>
              <span class="sw-count mono">{{ seg.spanCount }} spans</span>
              <ReTag v-if="seg.spans.some((s) => s.isError)" size="small" type="danger" round>异常</ReTag>
              <ReTag v-else size="small" type="success" round>正常</ReTag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import {
  DataAnalysis,
  Connection,
  Histogram,
  Timer,
  Refresh,
  Check,
  CircleClose,
  CircleCheck,
  Delete,
} from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReTag from "@repo/ui/re-tag";
import ReStatCard from "@repo/ui/re-stat-card";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import type { ReOption } from "@repo/ui/re-select";
import { message } from "@repo/core";
import { useApmStore } from "../stores/apmStore";
import {
  updateAgentConfig,
  setAgentEnabled,
  getHandleInventory,
  getSystemOut,
  getMemoryPools,
  triggerGc,
  getClassLoading,
  getThreadDump,
  getTraceHotspots,
  getTracePhases,
  getSkywalkingExport,
} from "../api/apmApi";
import type {
  AgentConfig,
  HandleInventorySnapshot,
  SystemOutEntry,
  MemoryPoolsSnapshot,
  GcResult,
  ClassLoadingInfo,
  ThreadDumpInfo,
  TraceHotspot,
  TracePhaseStat,
  SkywalkingSegment,
} from "../api/apmApi";
import { useRealtimeStatus, useRealtimeEvent } from "../composables/useRealtime";

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

/** 本地演示配置草稿（后端无接口时也可操作） */
const configDraft = reactive<AgentConfig>({
  samplingRate: 100,
  slowThresholdMs: 500,
  logLevel: "INFO",
  enabled: true,
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

/* ---- 句柄检测 ---- */
const handleLoading = ref(false);
const handleSnapshot = ref<HandleInventorySnapshot | null>(null);

/** 句柄表格行（截取前 12 条，与原有原生表格一致） */
const handleRows = computed(
  () => (handleSnapshot.value?.trackedHandles.slice(0, 12) ?? []) as unknown as Record<string, unknown>[],
);

const handleColumns: ReTableColumn[] = [
  { prop: "kind", label: "类型", width: 110, slot: "kind" },
  { prop: "name", label: "名称", minWidth: 240, slot: "name" },
  { prop: "ownerThread", label: "持有线程", minWidth: 150, slot: "ownerThread" },
  { prop: "createdAt", label: "创建时间", width: 160, slot: "createdAt" },
  { prop: "closed", label: "存活", width: 110, slot: "closed" },
];

async function loadHandles() {
  handleLoading.value = true;
  try {
    handleSnapshot.value = await getHandleInventory(200);
  } catch {
    handleSnapshot.value = null;
  } finally {
    handleLoading.value = false;
  }
}

/* ---- System.out / System.err 捕获 ---- */
const sysOutLoading = ref(false);
const sysOutEntries = ref<SystemOutEntry[]>([]);

async function loadSysOut() {
  sysOutLoading.value = true;
  try {
    sysOutEntries.value = await getSystemOut(200);
  } catch {
    sysOutEntries.value = [];
  } finally {
    sysOutLoading.value = false;
  }
}

/* ---- JVM 内存诊断 ---- */
const memoryLoading = ref(false);
const memorySnapshot = ref<MemoryPoolsSnapshot | null>(null);
const gcRunning = ref(false);
const lastGcResult = ref<GcResult | null>(null);
const classLoadingInfo = ref<ClassLoadingInfo | null>(null);

async function loadMemoryDiagnostics() {
  memoryLoading.value = true;
  try {
    const [pools, cl] = await Promise.all([getMemoryPools(), getClassLoading()]);
    memorySnapshot.value = pools;
    classLoadingInfo.value = cl;
  } catch {
    memorySnapshot.value = null;
    classLoadingInfo.value = null;
  } finally {
    memoryLoading.value = false;
  }
}

async function runGc() {
  gcRunning.value = true;
  try {
    lastGcResult.value = await triggerGc();
    await loadMemoryDiagnostics();
    message.success(`手动 GC 完成，释放 ${formatBytes(lastGcResult.value.freedBytes)}`);
  } catch {
    message.error("手动 GC 失败");
  } finally {
    gcRunning.value = false;
  }
}

/* ---- 线程 Dump ---- */
const threadDumpLoading = ref(false);
const threadDumpEntries = ref<ThreadDumpInfo[]>([]);

const daemonCount = computed(() => threadDumpEntries.value.filter((t) => t.isDaemon).length);
const blockedCount = computed(() => threadDumpEntries.value.filter((t) => t.state === "BLOCKED").length);

function threadStateTagType(state: string): "success" | "warning" | "danger" | "info" {
  if (state === "RUNNABLE") return "success";
  if (state === "BLOCKED" || state === "WAITING" || state === "TIMED_WAITING") return "danger";
  return "info";
}

async function loadThreadDump() {
  threadDumpLoading.value = true;
  try {
    threadDumpEntries.value = await getThreadDump();
  } catch {
    threadDumpEntries.value = [];
  } finally {
    threadDumpLoading.value = false;
  }
}

/* ---- 链路分析：方法热点 / 阶段耗时 / SkyWalking 导出 ---- */
const traceLoading = ref(false);
const traceHotspots = ref<TraceHotspot[]>([]);
const tracePhases = ref<TracePhaseStat[]>([]);
const skywalkingSegments = ref<SkywalkingSegment[]>([]);

async function loadTraceAnalysis() {
  traceLoading.value = true;
  try {
    const [hot, phases, sw] = await Promise.all([
      getTraceHotspots(20),
      getTracePhases(),
      getSkywalkingExport(),
    ]);
    traceHotspots.value = hot;
    tracePhases.value = phases;
    skywalkingSegments.value = sw;
  } catch {
    traceHotspots.value = [];
    tracePhases.value = [];
    skywalkingSegments.value = [];
  } finally {
    traceLoading.value = false;
  }
}

/* ---- 工具 ---- */
function formatBytes(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
function formatTime(ts: number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function formatAge(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function shortText(s: string, max: number): string {
  if (!s) return "";
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

/** 热点展示名：优先用后端给的真实展示名，回落「类.方法」 */
function hotspotName(h: TraceHotspot): string {
  if (h.displayName) return h.displayName;
  const cls = h.className || "";
  const mtd = h.methodName || "";
  return cls && mtd ? cls + "." + mtd : cls || mtd;
}

function hotspotWidth(h: TraceHotspot): number {
  if (!traceHotspots.value.length) return 0;
  const maxTotal = Math.max(...traceHotspots.value.map((x) => x.totalMs), 1);
  return Math.max(4, Math.round((h.totalMs / maxTotal) * 100));
}

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

onMounted(async () => {
  await refreshAll();
  await Promise.all([loadHandles(), loadSysOut(), loadMemoryDiagnostics(), loadThreadDump(), loadTraceAnalysis()]);
});

// Agent 状态随整站实时通道更新，不再单独 setInterval 轮询
useRealtimeEvent("stats", () => {
  if (!statusLoading.value) store.pollStatus();
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
  color: var(--text-primary, var(--apm-fg));
}

.config-actions {
  display: flex;
  align-items: flex-end;
  gap: var(--apm-space-2);
}

.config-reset-btn {
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
  color: var(--text-tertiary, var(--apm-muted));
}

.health-value {
  color: var(--text-primary, var(--apm-fg));
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
  background: var(--status-success, var(--apm-success));
}

.channel-dot.warn {
  background: var(--status-warning, var(--apm-warning));
}

.channel-dot.off {
  background: var(--status-error, var(--apm-danger));
}

/* ---- 句柄检测 ---- */
.handle-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--apm-space-3);
  padding: var(--apm-space-2) 0 var(--apm-space-4);
}

.handle-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--apm-space-2) var(--apm-space-4);
  background: var(--bg-elevated, var(--apm-panel-raised));
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--apm-radius-md);
}

.handle-count {
  font-size: 20px;
  color: var(--text-primary, var(--apm-fg));
}

.handle-kind {
  font-size: 11px;
  color: var(--text-tertiary, var(--apm-muted));
}

.handle-table-wrap {
  margin-bottom: var(--apm-space-3);
}

.fd-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.fd-title {
  font-size: 12px;
  margin-right: 4px;
}

.fd-chip {
  padding: 2px 8px;
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: 999px;
  font-size: 11px;
  color: var(--text-secondary, var(--apm-fg-regular));
}

/* ---- System.out / System.err ---- */
.sysout-list {
  display: flex;
  flex-direction: column;
  max-height: 320px;
  overflow-y: auto;
}

.sysout-row {
  display: flex;
  align-items: flex-start;
  gap: var(--apm-space-2);
  padding: 5px 0;
  border-bottom: 1px solid var(--border-subtle, var(--apm-border-soft));
  font-size: 12px;
}

.sysout-line {
  flex: 1;
  word-break: break-all;
  color: var(--text-secondary, var(--apm-fg-regular));
}

/* ---- JVM 内存诊断 ---- */
.memory-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--apm-space-4);
  padding-bottom: var(--apm-space-3);
  border-bottom: 1px solid var(--border-subtle, var(--apm-border-soft));
  margin-bottom: var(--apm-space-3);
}

.memory-summary {
  display: flex;
  align-items: baseline;
  gap: var(--apm-space-2);
}

.memory-summary-value {
  font-size: 20px;
  color: var(--text-primary, var(--apm-fg));
}

.memory-summary-desc {
  font-size: 12px;
}

.gc-result {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
  padding: var(--apm-space-2) 0;
  font-size: 12px;
}

.gc-freed {
  color: var(--status-success, var(--apm-success));
}

.memory-pool-list {
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-3);
}

.memory-pool-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.memory-pool-head {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
  font-size: 12px;
}

.memory-pool-used {
  margin-left: auto;
}

.memory-pool-bar {
  height: 6px;
  border-radius: 999px;
  background: var(--bg-elevated, var(--apm-panel-raised));
  overflow: hidden;
}

.memory-pool-bar > i {
  display: block;
  height: 100%;
  background: var(--brand-500, var(--apm-accent));
  border-radius: 999px;
  transition: width var(--apm-t-fast);
}

.class-loading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--apm-space-2);
  padding-top: var(--apm-space-3);
  border-top: 1px solid var(--border-subtle, var(--apm-border-soft));
  font-size: 12px;
  margin-top: var(--apm-space-3);
}

/* ---- 线程 Dump ---- */
.thread-dump-summary {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
  padding: var(--apm-space-2) 0 var(--apm-space-3);
  font-size: 12px;
}

.thread-dump-list {
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-2);
}

.thread-dump-item {
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--apm-radius-md);
  background: var(--bg-elevated, var(--apm-panel-raised));
}

.thread-dump-item summary {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
  padding: 8px 12px;
  cursor: pointer;
  list-style: none;
}

.thread-dump-item summary::-webkit-details-marker {
  display: none;
}

.thread-dump-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary, var(--apm-fg));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread-dump-body {
  padding: 0 12px 10px;
}

.thread-dump-lock {
  font-size: 12px;
  padding-bottom: 6px;
}

.thread-dump-stack {
  margin: 0;
  max-height: 220px;
  overflow-y: auto;
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-secondary, var(--apm-fg-regular));
  white-space: pre-wrap;
  word-break: break-all;
}

/* ---- 链路分析 ---- */
.phase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: var(--apm-space-2);
  margin-bottom: var(--apm-space-4);
}

.phase-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--apm-space-3);
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--apm-radius-md);
  background: var(--bg-elevated, var(--apm-panel-raised));
}

.phase-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary, var(--apm-muted));
}

.phase-value {
  font-size: 18px;
  color: var(--text-primary, var(--apm-fg));
}

.phase-count {
  font-size: 11px;
}

.hotspot-list {
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-2);
}

.hotspot-row {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
  font-size: 12px;
}

.hotspot-name {
  width: 240px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary, var(--apm-fg));
}

.hotspot-bar-wrap {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: var(--bg-elevated, var(--apm-panel-raised));
  overflow: hidden;
}

.hotspot-bar {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--status-error, var(--apm-danger));
  transition: width var(--apm-t-fast);
}

.hotspot-avg {
  min-width: 64px;
  text-align: right;
  color: var(--text-primary, var(--apm-fg));
}

.hotspot-count {
  min-width: 44px;
  text-align: right;
}

.sw-section {
  margin-top: var(--apm-space-4);
  border-top: 1px solid var(--border-subtle, var(--apm-border-soft));
  padding-top: var(--apm-space-3);
}

.sw-head {
  font-size: 12px;
  margin-bottom: var(--apm-space-2);
}

.sw-list {
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-2);
}

.sw-row {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
  font-size: 12px;
}

.sw-trace {
  min-width: 120px;
  color: var(--text-primary, var(--apm-fg));
}

.sw-count {
  color: var(--text-tertiary, var(--apm-muted));
}

@media (prefers-reduced-motion: reduce) {
  .channel-dot {
    animation: none;
  }
}
</style>
