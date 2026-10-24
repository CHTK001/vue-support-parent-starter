<template>
  <div class="view injector-page">
    <!-- 页头：标题 + Agent 状态 + 全局动作 -->
    <ReSectionHead
      class="injector-head"
      title="数据注入器"
      description="注入操作产生真实 APM 数据，统计经 SSE 实时刷新"
    >
      <template #actions>
        <ReTag :type="stats.agentActive ? 'success' : 'info'" round>
          {{ stats.agentActive ? "Agent 在线" : "Agent 离线" }}
        </ReTag>
        <ReButton :icon="Refresh" show-text :loading="statsLoading" @click="loadStats">刷新统计</ReButton>
      </template>
    </ReSectionHead>

    <!-- 统计卡：4 列网格，有统计数值时展示，加载期展示骨架 -->
    <ReSkeleton :loading="statsLoading" animated>
      <div
        class="stat-grid"
        v-if="!statsLoading && (stats.transmissionCount || stats.dependencyCount || stats.leakCount || stats.errorCount)"
      >
        <ReStatCard
          class="stat-card stat-accent--brand"
          size="compact"
          title="transmissionCount"
          :value="stats.transmissionCount ?? 0"
          desc="传输调用总数"
          :icon="Connection"
          icon-color="var(--brand-500, var(--apm-accent))"
        />
        <ReStatCard
          class="stat-card stat-accent--success"
          size="compact"
          title="dependencyCount"
          :value="stats.dependencyCount ?? 0"
          desc="依赖边总数"
          :icon="Share"
          icon-color="var(--status-success, var(--apm-success))"
        />
        <ReStatCard
          class="stat-card stat-accent--warning"
          size="compact"
          title="leakCount"
          :value="stats.leakCount ?? 0"
          desc="资源泄漏总数"
          :icon="Warning"
          icon-color="var(--status-warning, var(--apm-warning))"
        />
        <ReStatCard
          class="stat-card stat-accent--error"
          size="compact"
          title="errorCount"
          :value="stats.errorCount ?? 0"
          desc="错误记录总数"
          :icon="Close"
          icon-color="var(--status-error, var(--apm-danger))"
        />
      </div>
    </ReSkeleton>

    <!-- 注入参数：源端 / 目标端 / 协议 / 结果标记 / 批量条数 / 快速预设 -->
    <div class="filter-bar injector-filter">
      <div class="filter-field endpoint-field">
        <label class="filter-label" for="inj-source">源端 <span class="req">*</span></label>
        <ReInput
          id="inj-source"
          v-model="source"
          placeholder="10.0.0.1:8080"
          clearable
          :status="showSourceError ? 'error' : ''"
          @change="sourceTouched = true"
        />
        <span class="field-hint" :class="{ 'field-error': showSourceError }">
          {{ showSourceError ? sourceError : "必填 · 格式 host:port" }}
        </span>
      </div>

      <div class="filter-field endpoint-field">
        <label class="filter-label" for="inj-target">目标端 <span class="req">*</span></label>
        <ReInput
          id="inj-target"
          v-model="target"
          placeholder="db.lvhzhou:3306"
          clearable
          :status="showTargetError ? 'error' : ''"
          @change="targetTouched = true"
        />
        <span class="field-hint" :class="{ 'field-error': showTargetError }">
          {{ showTargetError ? targetError : "必填 · 格式 host:port" }}
        </span>
      </div>

      <div class="filter-field protocol-field">
        <label class="filter-label" for="inj-protocol">协议</label>
        <ReSelect id="inj-protocol" v-model="protocol" :data="protocolOptions" />
      </div>

      <div class="filter-field switch-field">
        <label class="filter-label">结果标记</label>
        <ReSwitch v-model="injectedError" active-text="标记为错误调用" />
      </div>

      <div class="filter-field count-field">
        <label class="filter-label" for="inj-count">批量条数</label>
        <el-input-number
          id="inj-count"
          v-model="batchCount"
          :min="1"
          :max="1000"
          :step="1"
          :controls="false"
          class="count-input"
        />
        <span class="field-hint" :class="{ 'field-error': !!countError }">
          {{ countError || "1–1000 的整数" }}
        </span>
      </div>

      <div class="filter-field preset-field">
        <label class="filter-label">快速预设</label>
        <div class="preset-row">
          <ReButton
            v-for="p in batchPresets"
            :key="p.value"
            size="small"
            :type="batchCount === p.value ? 'primary' : ''"
            :plain="batchCount !== p.value"
            @click="applyPreset(p.value)"
          >
            {{ p.label }}
          </ReButton>
        </div>
      </div>

      <div class="filter-actions">
        <span class="match-hint" v-if="actionHint">{{ actionHint }}</span>
        <ReButton
          type="primary"
          :icon="Plus"
          show-text
          :disabled="!canInjectTransmission"
          :loading="injectingTransmission"
          @click="doInjectTransmission"
        >
          注入 1 条
        </ReButton>
        <ReButton
          type="primary"
          plain
          :icon="Histogram"
          show-text
          :disabled="!canInjectBatch"
          :loading="injectingBatch"
          @click="doInjectBatch"
        >
          批量注入
        </ReButton>
      </div>
    </div>

    <!-- 提交进度 / 结果摘要：进行中是不确定进度条，完成后按成功占比着色 -->
    <div class="inject-feedback" v-if="injectingAny || lastResult" role="status" aria-live="polite">
      <div class="feedback-line" v-if="injectingAny">
        <span class="live-dot">{{ injectingLabel }}…</span>
        <span class="muted">等待后端返回</span>
      </div>
      <div class="feedback-line" v-else-if="lastResult">
        <ReTag :type="resultTagType" round>{{ resultTitle }}</ReTag>
        <span class="feedback-label">{{ lastResult.label }}</span>
        <span class="feedback-counts mono">
          <span class="ok-text">成功 {{ lastResult.ok }}</span>
          <span v-if="lastResult.failed" class="err-text">失败 {{ lastResult.failed }}</span>
        </span>
        <ReButton text size="small" @click="lastResult = null">清除</ReButton>
      </div>
      <div class="feedback-bar">
        <i v-if="injectingAny" class="is-indeterminate" />
        <i v-else :class="'is-' + feedbackTone" :style="{ width: feedbackPercent + '%' }" />
      </div>
    </div>

    <!-- 资源泄漏 / 日志：两个独立写操作，互不阻塞 -->
    <div class="panel-row">
      <div class="panel">
        <div class="panel-head">
          <span>制造资源泄漏</span>
          <span class="panel-sub">POST /inject/leak · 生成真实泄漏记录</span>
        </div>
        <div class="field-grid">
          <div class="filter-field">
            <label class="filter-label" for="inj-leak-type">资源类型</label>
            <ReSelect id="inj-leak-type" v-model="leakType" :data="leakTypeOptions" />
          </div>
          <div class="filter-field">
            <label class="filter-label" for="inj-leak-name">资源名（可选）</label>
            <ReInput id="inj-leak-name" v-model="leakName" placeholder="不填则自动生成" clearable />
          </div>
        </div>
        <div class="panel-actions">
          <ReButton type="danger" :icon="Warning" show-text :loading="injectingLeak" @click="doInjectLeak">
            制造 1 条
          </ReButton>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <span>写入日志</span>
          <span class="panel-sub">POST /inject/log · 写入后可到日志页检索</span>
        </div>
        <div class="field-grid">
          <div class="filter-field">
            <label class="filter-label" for="inj-log-level">级别</label>
            <ReSelect id="inj-log-level" v-model="logLevel" :data="logLevelOptions" />
          </div>
          <div class="filter-field">
            <label class="filter-label" for="inj-log-msg">日志消息（可选）</label>
            <ReInput id="inj-log-msg" v-model="logMessage" placeholder="不填则自动生成" clearable />
          </div>
        </div>
        <div class="panel-actions">
          <ReButton type="warning" :icon="DocumentAdd" show-text :loading="injectingLog" @click="doInjectLog">
            写入 1 条
          </ReButton>
        </div>
      </div>
    </div>

    <!-- 压测增强：慢调用 / Span 树 / JVM 压力 -->
    <div class="panel-row">
      <div class="panel">
        <div class="panel-head">
          <span>注入慢调用</span>
          <span class="panel-sub">POST /inject/slow · 验证慢调用排行</span>
        </div>
        <div class="field-grid">
          <div class="filter-field">
            <label class="filter-label" for="inj-slow-duration">耗时（ms）</label>
            <el-input-number
              id="inj-slow-duration"
              v-model="slowDurationMs"
              :min="100"
              :max="30000"
              :step="100"
              :controls="false"
              class="full-input"
            />
          </div>
          <div class="filter-field">
            <label class="filter-label" for="inj-slow-target">目标端（可选）</label>
            <ReInput id="inj-slow-target" v-model="slowTarget" placeholder="order-service:8080" clearable />
          </div>
        </div>
        <div class="panel-actions">
          <ReButton type="warning" :icon="Timer" show-text :loading="injectingSlow" @click="doInjectSlow">
            注入慢调用
          </ReButton>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <span>注入 Span 树</span>
          <span class="panel-sub">POST /inject/span-tree · 验证链路瀑布</span>
        </div>
        <div class="field-grid">
          <div class="filter-field">
            <label class="filter-label" for="inj-span-count">Span 数量</label>
            <el-input-number
              id="inj-span-count"
              v-model="spanCount"
              :min="2"
              :max="100"
              :step="1"
              :controls="false"
              class="full-input"
            />
          </div>
          <div class="filter-field">
            <label class="filter-label" for="inj-span-depth">深度</label>
            <el-input-number
              id="inj-span-depth"
              v-model="spanDepth"
              :min="1"
              :max="10"
              :step="1"
              :controls="false"
              class="full-input"
            />
          </div>
        </div>
        <div class="panel-actions">
          <ReButton type="primary" plain :icon="DataLine" show-text :loading="injectingSpanTree" @click="doInjectSpanTree">
            生成 1 棵
          </ReButton>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <span>注入 JVM 压力</span>
          <span class="panel-sub">POST /inject/jvm-pressure · 造线程/CPU 变化</span>
        </div>
        <div class="field-grid">
          <div class="filter-field">
            <label class="filter-label" for="inj-jvm-threads">线程数</label>
            <el-input-number
              id="inj-jvm-threads"
              v-model="jvmThreads"
              :min="1"
              :max="200"
              :step="1"
              :controls="false"
              class="full-input"
            />
          </div>
          <div class="filter-field">
            <label class="filter-label" for="inj-jvm-cpu">CPU 目标（%）</label>
            <el-input-number
              id="inj-jvm-cpu"
              v-model="jvmCpuPercent"
              :min="5"
              :max="90"
              :step="5"
              :controls="false"
              class="full-input"
            />
          </div>
        </div>
        <div class="panel-actions">
          <ReButton type="danger" plain :icon="Loading" show-text :loading="injectingJvm" @click="doInjectJvm">
            制造压力
          </ReButton>
        </div>
      </div>
    </div>

    <!-- 注入历史（本会话内操作记录） -->
    <div class="panel history-panel">
      <div class="panel-head">
        <span>
          注入历史（本会话）
          <ReButton v-if="history.length" text size="small" class="history-toggle" @click="historyExpanded = !historyExpanded">
            {{ historyExpanded ? "收起" : "展开" }}
          </ReButton>
        </span>
        <span class="panel-sub">仅保存在当前页面会话，刷新即清空</span>
      </div>
      <div v-if="!history.length" class="panel-empty">
        <ReEmpty description="还没有注入操作，在上方填写参数后提交" />
      </div>
      <div v-else-if="historyExpanded" class="history-list">
        <div v-for="(h, i) in history" :key="i" class="history-item">
          <ReTag :type="h.ok ? 'success' : 'danger'" round>{{ h.ok ? "成功" : "失败" }}</ReTag>
          <span class="history-msg" :title="h.msg">{{ h.msg }}</span>
          <span class="history-time mono">{{ h.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import { Connection, Close, Histogram, DocumentAdd, Plus, Refresh, Share, Warning, Timer, Loading, DataLine } from "@element-plus/icons-vue";
import ReEmpty from "@repo/ui/re-empty";
import ReInput from "@repo/ui/re-input";
import ReSectionHead from "@repo/ui/re-section-head";
import ReSelect from "@repo/ui/re-select";
import ReButton from "@repo/ui/re-button";
import ReStatCard from "@repo/ui/re-stat-card";
import ReTag from "@repo/ui/re-tag";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReSwitch from "@repo/ui/re-switch";
import type { ReOption } from "@repo/ui/re-select";
import { getStats, injectTransmission, injectBatch, injectLeak, injectLog, injectSlowCall, injectSpanTree, injectJvmPressure, watchStats } from "../api/apmApi";
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

/** 最近一次提交的结果摘要（成功 / 失败条数，纯前端统计） */
interface InjectResult { label: string; ok: number; failed: number; }
const lastResult = ref<InjectResult | null>(null);

const feedbackPercent = computed(() => {
  const r = lastResult.value;
  if (!r) return 0;
  const total = r.ok + r.failed;
  if (!total) return 0;
  return Math.max(2, Math.round((r.ok / total) * 100));
});

const feedbackTone = computed<"ok" | "warn" | "err">(() => {
  const r = lastResult.value;
  if (!r || r.failed === 0) return "ok";
  return r.ok > 0 ? "warn" : "err";
});

const resultTitle = computed(() => {
  const r = lastResult.value;
  if (!r || r.failed === 0) return "完成";
  return r.ok > 0 ? "部分失败" : "失败";
});

const resultTagType = computed<"success" | "warning" | "danger">(() => {
  const r = lastResult.value;
  if (!r || r.failed === 0) return "success";
  return r.ok > 0 ? "warning" : "danger";
});

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
    message.error("加载统计失败");
  } finally {
    statsLoading.value = false;
  }
}

function refreshAfterInject() {
  loadStats();
}

// ---- 传输调用参数 + 前端校验 ----
const source = ref("");
const target = ref("");
const protocol = ref("HTTP");
const batchCount = ref<number | null | undefined>(10);
const injectingTransmission = ref(false);
const injectingBatch = ref(false);
const injectedError = ref(false);
const sourceTouched = ref(false);
const targetTouched = ref(false);

const protocolOptions: ReOption[] = [
  { label: "HTTP", value: "HTTP" },
  { label: "REDIS", value: "REDIS" },
  { label: "MYSQL", value: "MYSQL" },
  { label: "GRPC", value: "GRPC" },
  { label: "KAFKA", value: "KAFKA" },
];

/** 批量预设：点击只回填条数，不触发提交 */
const batchPresets = [
  { label: "单条", value: 1 },
  { label: "小批量 10", value: 10 },
  { label: "中批量 100", value: 100 },
  { label: "大批量 1000", value: 1000 },
];

function applyPreset(value: number) {
  batchCount.value = value;
}

/** host / host:port（允许 IPv4、域名、方括号 IPv6；端口 1–65535） */
const ENDPOINT_RE = /^(?:[a-zA-Z0-9][\w.-]*|\[[0-9a-fA-F:]+\])(?::(\d{1,5}))?$/;

function endpointError(raw: string): string {
  const value = raw.trim();
  if (!value) return "必填项：如 10.0.0.1:8080";
  if (/\s/.test(value)) return "不能包含空格";
  const match = value.match(ENDPOINT_RE);
  if (!match) return "格式应为 host:port";
  const port = match[1];
  if (port !== undefined) {
    const n = Number(port);
    if (n < 1 || n > 65535) return "端口需在 1–65535 之间";
  }
  return "";
}

const sourceError = computed(() => endpointError(source.value));
const targetError = computed(() => endpointError(target.value));

/** 输入后即时提示；未触碰的空字段只显示中性格式说明，避免开局一片红 */
const showSourceError = computed(() => (sourceTouched.value || source.value.trim().length > 0) && !!sourceError.value);
const showTargetError = computed(() => (targetTouched.value || target.value.trim().length > 0) && !!targetError.value);

const countError = computed(() => {
  const n = batchCount.value;
  if (n === null || n === undefined || Number.isNaN(n)) return "请填写批量条数";
  if (!Number.isInteger(n)) return "条数需为整数";
  if (n < 1 || n > 1000) return "条数需在 1–1000 之间";
  return "";
});

const canInjectTransmission = computed(() => !sourceError.value && !targetError.value && !injectingTransmission.value);
const canInjectBatch = computed(() => !countError.value && !injectingBatch.value);

/** 动作区提示：覆盖「按钮灰着但不知道为什么」的情况 */
const actionHint = computed(() => {
  if (countError.value) return "请修正批量条数";
  if (showSourceError.value) return "请修正源端";
  if (showTargetError.value) return "请修正目标端";
  if (!source.value.trim() || !target.value.trim()) return "源端 / 目标端为必填";
  return "";
});

const injectingAny = computed(
  () =>
    injectingTransmission.value ||
    injectingBatch.value ||
    injectingLeak.value ||
    injectingLog.value ||
    injectingSlow.value ||
    injectingSpanTree.value ||
    injectingJvm.value,
);

const injectingLabel = computed(() => {
  if (injectingTransmission.value) return "正在注入传输调用";
  if (injectingBatch.value) return "正在批量注入";
  if (injectingLeak.value) return "正在制造资源泄漏";
  if (injectingLog.value) return "正在写入日志";
  if (injectingSlow.value) return "正在注入慢调用";
  if (injectingSpanTree.value) return "正在生成 Span 树";
  if (injectingJvm.value) return "正在制造 JVM 压力";
  return "";
});

async function doInjectTransmission() {
  if (!canInjectTransmission.value) {
    message.warning("请先补全源端与目标端");
    return;
  }
  injectingTransmission.value = true;
  try {
    await injectTransmission({
      source: source.value.trim(),
      target: target.value.trim(),
      protocol: protocol.value || undefined,
      error: injectedError.value || undefined,
    });
    message.success("已注入 1 条传输调用");
    recordHistory(true, `注入传输 ${protocol.value}${injectedError.value ? "（错误）" : ""} ${source.value.trim()} → ${target.value.trim()}`);
    lastResult.value = { label: `注入传输调用 ${protocol.value}`, ok: 1, failed: 0 };
    refreshAfterInject();
  } catch {
    recordHistory(false, "注入传输调用失败");
    lastResult.value = { label: `注入传输调用 ${protocol.value}`, ok: 0, failed: 1 };
    message.error("注入传输调用失败");
  } finally {
    injectingTransmission.value = false;
  }
}

async function doInjectBatch() {
  if (!canInjectBatch.value || batchCount.value === null || batchCount.value === undefined) {
    message.warning(countError.value || "请先填写批量条数");
    return;
  }
  const count = batchCount.value ?? 0;
  injectingBatch.value = true;
  try {
    const r = await injectBatch(count);
    // 后端返回实际写入条数（injectBatch 的 count 字段）；缺失时按请求条数计
    const reported = Number(r?.count ?? count);
    const okCount = Number.isFinite(reported)
      ? Math.min(count, Math.max(0, Math.round(reported)))
      : count;
    const failedCount = Math.max(0, count - okCount);
    if (okCount === 0) {
      message.error(`批量注入失败：0 / ${count}`);
    } else if (failedCount > 0) {
      message.warning(`批量注入完成：成功 ${okCount} / 失败 ${failedCount}`);
    } else {
      message.success(`已批量注入 ${okCount} 条传输调用`);
    }
    recordHistory(
      failedCount === 0,
      `批量注入 ${count} 条 · 成功 ${okCount}${failedCount ? ` / 失败 ${failedCount}` : ""}`,
    );
    lastResult.value = { label: `批量注入 ${count} 条`, ok: okCount, failed: failedCount };
    refreshAfterInject();
  } catch {
    recordHistory(false, `批量注入 ${count} 条失败`);
    lastResult.value = { label: `批量注入 ${count} 条`, ok: 0, failed: count };
    message.error("批量注入失败");
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
    message.success(`已制造 1 条 ${leakType.value} 资源泄漏`);
    recordHistory(true, `制造泄漏 ${leakType.value}${leakName.value ? ` · ${leakName.value}` : ""}`);
    lastResult.value = { label: `制造泄漏 ${leakType.value}`, ok: 1, failed: 0 };
    refreshAfterInject();
  } catch {
    recordHistory(false, "制造资源泄漏失败");
    lastResult.value = { label: `制造泄漏 ${leakType.value}`, ok: 0, failed: 1 };
    message.error("制造资源泄漏失败");
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
    message.success(`已写入 1 条 ${logLevel.value} 日志`);
    recordHistory(true, `写入日志 ${logLevel.value}${logMessage.value ? ` · ${logMessage.value.slice(0, 20)}` : ""}`);
    lastResult.value = { label: `写入日志 ${logLevel.value}`, ok: 1, failed: 0 };
    refreshAfterInject();
  } catch {
    recordHistory(false, "写入日志失败");
    lastResult.value = { label: `写入日志 ${logLevel.value}`, ok: 0, failed: 1 };
    message.error("写入日志失败");
  } finally {
    injectingLog.value = false;
  }
}

// ---- 卡片3：慢调用注入 ----
const slowDurationMs = ref(1000);
const slowTarget = ref("");
const injectingSlow = ref(false);

async function doInjectSlow() {
  injectingSlow.value = true;
  try {
    await injectSlowCall({
      source: source.value.trim() || undefined,
      target: slowTarget.value.trim() || target.value.trim() || undefined,
      protocol: protocol.value || undefined,
      durationMs: slowDurationMs.value,
    });
    message.success(`已注入慢调用 ${slowDurationMs.value}ms`);
    recordHistory(true, `慢调用 ${slowDurationMs.value}ms → ${slowTarget.value || target.value || "auto"}`);
    lastResult.value = { label: `慢调用 ${slowDurationMs.value}ms`, ok: 1, failed: 0 };
    refreshAfterInject();
  } catch {
    recordHistory(false, "注入慢调用失败");
    lastResult.value = { label: `慢调用 ${slowDurationMs.value}ms`, ok: 0, failed: 1 };
    message.error("注入慢调用失败");
  } finally {
    injectingSlow.value = false;
  }
}

// ---- 卡片4：Span 树注入 ----
const spanCount = ref(8);
const spanDepth = ref(3);
const injectingSpanTree = ref(false);

async function doInjectSpanTree() {
  injectingSpanTree.value = true;
  try {
    await injectSpanTree({
      spans: spanCount.value,
      depth: spanDepth.value,
      errorSpan: injectedError.value || undefined,
    });
    message.success(`已生成 ${spanCount.value} span 链路`);
    recordHistory(true, `Span 树 ${spanCount.value} spans · 深度 ${spanDepth.value}`);
    lastResult.value = { label: `Span 树 ${spanCount.value} spans`, ok: 1, failed: 0 };
    refreshAfterInject();
  } catch {
    recordHistory(false, "生成 Span 树失败");
    lastResult.value = { label: `Span 树 ${spanCount.value} spans`, ok: 0, failed: 1 };
    message.error("生成 Span 树失败");
  } finally {
    injectingSpanTree.value = false;
  }
}

// ---- 卡片5：JVM 压力注入 ----
const jvmThreads = ref(20);
const jvmCpuPercent = ref(30);
const injectingJvm = ref(false);

async function doInjectJvm() {
  injectingJvm.value = true;
  try {
    await injectJvmPressure({
      threads: jvmThreads.value,
      cpuPercent: jvmCpuPercent.value,
      durationMs: 15000,
    });
    message.success(`已制造 JVM 压力（${jvmThreads.value} 线程 / ${jvmCpuPercent.value}% CPU）`);
    recordHistory(true, `JVM 压力 ${jvmThreads.value} 线程 · ${jvmCpuPercent.value}% CPU`);
    lastResult.value = { label: `JVM 压力 ${jvmThreads.value} 线程`, ok: 1, failed: 0 };
    refreshAfterInject();
  } catch {
    recordHistory(false, "制造 JVM 压力失败");
    lastResult.value = { label: `JVM 压力 ${jvmThreads.value} 线程`, ok: 0, failed: 1 };
    message.error("制造 JVM 压力失败");
  } finally {
    injectingJvm.value = false;
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
/* ========================================================
   Injector · koi 令牌
   颜色 / 圆角 / 阴影 / 过渡一律优先取 koi 令牌，未加载 koi
   时以 hotsport 自身的 --apm-* 语义令牌兜底：
   var(--koi-token, var(--apm-*)). hotsport 独立运行时不加载 koi，
   var(...fallback) 会落到 tokens.css / layout.css 里语义相同的一档，视觉不崩。

   处理方式：模板 + 样式一并重写（本页无表格 / 对话框 / 终端 / 画布 /
   echarts 与脚本绑定，重写模板不会破坏 ref 或插槽绑定）。
   <script> 仅追加 2 个 import（ReEmpty / ReSectionHead），其余字节与原文一致。
   ======================================================== */

.injector-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ---- 页头 ---- */
.injector-head {
  flex-wrap: wrap;
  padding: 14px 18px;
  background: var(--bg-container, var(--apm-panel));
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--radius-lg, var(--apm-radius-lg));
  box-shadow: var(--shadow-sm, var(--apm-shadow-card));
}

.injector-head :deep(.re-section-head__title) {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: var(--text-primary, var(--apm-fg));
}

.injector-head :deep(.re-section-head__desc) {
  color: var(--text-tertiary, var(--apm-muted));
  line-height: 1.5;
}

.injector-head :deep(.re-section-head__actions) {
  flex-wrap: wrap;
  align-items: center;
}

/* ---- 统计卡：4 列网格 + 顶部 3px 色条 ---- */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  --card-accent: var(--brand-500, var(--apm-accent));
  transition:
    transform var(--transition-base, var(--apm-t-base)),
    box-shadow var(--transition-base, var(--apm-t-base));
}

.stat-accent--brand { --card-accent: var(--brand-500, var(--apm-accent)); }
.stat-accent--success { --card-accent: var(--status-success, var(--apm-success)); }
.stat-accent--warning { --card-accent: var(--status-warning, var(--apm-warning)); }
.stat-accent--error { --card-accent: var(--status-error, var(--apm-danger)); }

.stat-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: var(--card-accent);
  border-radius: var(--radius-lg, var(--apm-radius-lg)) var(--radius-lg, var(--apm-radius-lg)) 0 0;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md, var(--apm-shadow-card-hover));
}

/* ---- 注入参数筛选栏 ---- */
.injector-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--apm-space-3);
  padding: var(--apm-space-3) var(--apm-space-4);
  background: var(--bg-container, var(--apm-panel));
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--radius-lg, var(--apm-radius-lg));
  box-shadow: var(--shadow-sm, var(--apm-shadow-card));
}

.injector-filter .filter-label {
  color: var(--text-tertiary, var(--apm-muted));
  letter-spacing: 0.04em;
}

.injector-filter .filter-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.endpoint-field { flex: 1 1 220px; }
.protocol-field { flex: 0 0 130px; }
.switch-field { flex: 0 0 auto; }
.count-field { flex: 0 0 150px; }
.preset-field { flex: 1 1 320px; }

.count-input { width: 100px; }

.field-grid {
  display: grid;
  gap: var(--apm-space-3);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.field-hint {
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-secondary, var(--apm-fg-regular));
}

.field-hint.field-error { color: var(--status-error, var(--apm-danger)); }

.req {
  color: var(--status-error, var(--apm-danger));
  font-weight: 600;
}

.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--apm-space-1);
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--apm-space-2);
}

/* ---- 提交反馈 ---- */
.inject-feedback {
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-2);
  padding: var(--apm-space-3) var(--apm-space-4);
  background: var(--bg-elevated, var(--apm-panel-raised));
  border-radius: var(--radius-lg, var(--apm-radius-lg));
  box-shadow: var(--shadow-sm, var(--apm-shadow-card));
}

.feedback-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--apm-space-2);
  min-width: 0;
  font-size: 12px;
}

.live-dot {
  color: var(--status-success, var(--apm-success));
  font-weight: 500;
}

.feedback-label {
  color: var(--text-primary, var(--apm-fg));
  font-weight: 500;
}

.feedback-counts {
  display: flex;
  align-items: center;
  gap: var(--apm-space-3);
  margin-left: auto;
}

.ok-text { color: var(--status-success, var(--apm-success)); }
.err-text { color: var(--status-error, var(--apm-danger)); }

.feedback-bar {
  height: 4px;
  border-radius: 999px;
  background: var(--border-subtle, var(--apm-border-soft));
  overflow: hidden;
}

.feedback-bar > i {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width var(--transition-base, var(--apm-t-base));
}

.feedback-bar > i.is-ok { background: var(--status-success, var(--apm-success)); }
.feedback-bar > i.is-warn { background: var(--status-warning, var(--apm-warning)); }
.feedback-bar > i.is-err { background: var(--status-error, var(--apm-danger)); }

.feedback-bar > i.is-indeterminate {
  width: 40%;
  background: var(--brand-500, var(--apm-accent));
  animation: inject-sweep 1.1s var(--ease-out, var(--apm-ease)) infinite;
}

@keyframes inject-sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}

/* ---- 历史记录 ---- */
.history-toggle {
  margin-left: var(--apm-space-2);
  font-weight: 400;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-2);
  max-height: 260px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
  padding: var(--apm-space-2) var(--apm-space-3);
  background: var(--bg-elevated, var(--apm-panel-raised));
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--radius-md, var(--apm-radius-md));
}

.history-msg {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--text-secondary, var(--apm-fg-regular));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: 11px;
  color: var(--text-tertiary, var(--apm-muted));
}

/* ---- 面板（通用卡片壳，koi 令牌）---- */
.panel-row {
  display: grid;
  gap: var(--apm-space-3);
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.panel {
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-3);
  min-width: 0;
  padding: var(--apm-space-4) var(--apm-space-5);
  background: var(--bg-container, var(--apm-panel));
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--radius-lg, var(--apm-radius-lg));
  box-shadow: var(--shadow-sm, var(--apm-shadow-card));
}

.panel-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.panel-head > span:first-child {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, var(--apm-fg));
}

.panel-sub {
  font-size: 12px;
  color: var(--text-tertiary, var(--apm-muted));
  line-height: 1.5;
}

.panel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--apm-space-2);
  min-height: 140px;
  color: var(--text-tertiary, var(--apm-muted));
  font-size: 12px;
  text-align: center;
}

/* ---- 响应式：≤768px 2 列统计 + 筛选栏字段全宽 ---- */
@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .injector-head {
    padding: 12px 14px;
  }

  .injector-head :deep(.re-section-head__actions) {
    width: 100%;
    justify-content: flex-start;
  }

  .injector-filter {
    padding: 10px 12px;
  }

  .endpoint-field,
  .protocol-field,
  .preset-field {
    width: 100%;
  }

  .switch-field,
  .count-field {
    flex: 1 1 150px;
  }

  .filter-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .panel-row {
    grid-template-columns: 1fr;
  }
}

/* ---- 尊重「减少动态效果」偏好 ---- */
@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .stat-card:hover,
  .injector-filter,
  .injector-feedback,
  .panel,
  .history-item,
  .feedback-bar > i {
    transition: none;
    transform: none;
  }

  .feedback-bar > i.is-indeterminate {
    animation: none;
    width: 100%;
    opacity: 0.5;
  }
}
</style>
