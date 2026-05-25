<template>
  <section class="loki-streaming-page">
    <!-- 控制栏 -->
    <div class="stream-header">
      <div class="header-left">
        <h2 class="header-title">
          <ElIcon><VideoPlay /></ElIcon>
          实时日志
        </h2>
      </div>
      <div class="header-controls">
        <ElInput
          v-model="logql"
          placeholder="输入 LogQL 查询…"
          clearable
          size="default"
          class="logql-input"
        >
          <template #prefix><ElIcon><Search /></ElIcon></template>
        </ElInput>
        <ElSelect v-model="timeWindow" size="default" style="width: 120px;">
          <ElOption label="最近 1 分钟" :value="60" />
          <ElOption label="最近 5 分钟" :value="300" />
          <ElOption label="最近 15 分钟" :value="900" />
          <ElOption label="最近 1 小时" :value="3600" />
          <ElOption label="最近 6 小时" :value="21600" />
        </ElSelect>
        <ElButton
          :type="isPolling ? 'danger' : 'primary'"
          @click="togglePolling"
          round
        >
          <ElIcon><VideoPlay v-if="!isPolling" /><VideoPause v-else /></ElIcon>
          {{ isPolling ? "停止" : "开始" }}
        </ElButton>
        <ElButton
          :type="autoScroll ? 'primary' : 'default'"
          @click="autoScroll = !autoScroll"
          round
          plain
        >
          <ElIcon><Bottom v-if="autoScroll" /></ElIcon>
          {{ autoScroll ? "自动滚动" : "手动滚动" }}
        </ElButton>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="status-bar">
      <span class="status-item">
        <span class="status-dot" :class="{ 'is-active': connectionId }"></span>
        {{ connectionId ? '已连接' : '未连接' }}
      </span>
      <span class="status-item">日志行: {{ logLines.length }}</span>
      <span v-if="lastPollTime" class="status-item">上次刷新: {{ lastPollTime }}</span>
      <span v-if="filterText" class="status-item">
        过滤: {{ filterText }}
        <ElButton text size="small" @click="filterText = ''">清除</ElButton>
      </span>
      <ElInput
        v-model="filterText"
        placeholder="过滤已接收日志…"
        size="small"
        style="width: 200px; margin-left: auto;"
        clearable
      >
        <template #prefix><ElIcon><Filter /></ElIcon></template>
      </ElInput>
    </div>

    <!-- 日志输出 -->
    <div ref="logContainer" class="log-container" @scroll="onScroll">
      <div v-if="!connectionId" class="log-empty">
        <ElIcon :size="40"><WarningFilled /></ElIcon>
        <p>未连接 Loki，请先在日志查询页面连接</p>
      </div>
      <div v-else-if="!logLines.length && isPolling" class="log-empty">
        <ElIcon class="is-loading" :size="32"><Loading /></ElIcon>
        <p>等待日志…</p>
      </div>
      <div v-else-if="!logLines.length" class="log-empty">
        <ElIcon :size="40"><Document /></ElIcon>
        <p>点击「开始」启动实时日志查看</p>
      </div>
      <div v-else>
        <div
          v-for="(line, idx) in filteredLines"
          :key="idx"
          class="log-line"
          :class="getLineClass(line)"
        >
          <span class="line-timestamp">{{ line.timestamp }}</span>
          <span class="line-level" :class="getLevelClass(line.line)">{{ getLevel(line.line) }}</span>
          <span class="line-stream">{{ formatStream(line.stream) }}</span>
          <span class="line-content">{{ line.line }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onUnmounted, nextTick, watch } from "vue";
import {
  Search,
  VideoPlay,
  VideoPause,
  Bottom,
  Filter,
  WarningFilled,
  Loading,
  Document,
} from "@element-plus/icons-vue";
import { fetchLokiQueryRange } from "../../api/loki";

const connectionId = ref(localStorage.getItem("loki_connection_id") || "");
const logql = ref(localStorage.getItem("loki_logql") || "{job=~\".+\"}");
const timeWindow = ref(300);
const autoScroll = ref(true);
const filterText = ref("");
const isPolling = ref(false);
const logLines = ref([]);
const lastPollTime = ref("");
const logContainer = ref(null);
let pollTimer = null;
let lastTimestamp = "";

const filteredLines = computed(() => {
  if (!filterText.value) return logLines.value;
  const f = filterText.value.toLowerCase();
  return logLines.value.filter((l) => l.line.toLowerCase().includes(f));
});

watch(logql, (v) => {
  localStorage.setItem("loki_logql", v);
});

function togglePolling() {
  if (isPolling.value) {
    stopPolling();
  } else {
    startPolling();
  }
}

function startPolling() {
  if (!connectionId.value || !logql.value) return;
  isPolling.value = true;
  logLines.value = [];
  lastTimestamp = "";
  poll();
  pollTimer = setInterval(poll, 3000);
}

function stopPolling() {
  isPolling.value = false;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function poll() {
  if (!connectionId.value) {
    stopPolling();
    return;
  }
  const now = Date.now();
  let start;
  if (lastTimestamp) {
    start = lastTimestamp;
  } else {
    start = String((now - timeWindow.value * 1000) * 1000000); // ns
  }
  const end = String(now * 1000000);

  try {
    const res = await fetchLokiQueryRange(
      connectionId.value,
      logql.value,
      start,
      end,
      1000,
      undefined,
      "forward"
    );
    if ((res.code === "00000" || res.code === 200) && res.data?.data?.result) {
      const streams = res.data.data.result;
      const newLines = [];
      let maxTs = lastTimestamp;
      for (const stream of streams) {
        for (const [ts, line] of stream.values) {
          if (ts > lastTimestamp || !lastTimestamp) {
            newLines.push({
              timestamp: formatTimestamp(ts),
              rawTs: ts,
              stream: stream.stream,
              line,
            });
            if (!maxTs || ts > maxTs) maxTs = ts;
          }
        }
      }
      if (maxTs) lastTimestamp = maxTs;
      if (newLines.length) {
        logLines.value.push(...newLines);
        // 保留最近 5000 行
        if (logLines.value.length > 5000) {
          logLines.value = logLines.value.slice(-5000);
        }
        lastPollTime.value = formatTimestamp(String(now * 1000000));
        if (autoScroll.value) {
          nextTick(scrollToBottom);
        }
      }
    }
  } catch {
    // 轮询失败不停止，继续尝试
  }
}

function onScroll(e) {
  const el = e.target;
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  if (!atBottom) {
    autoScroll.value = false;
  }
}

function scrollToBottom() {
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight;
  }
}

function formatTimestamp(ns) {
  const ms = Math.floor(Number(ns) / 1000000);
  const d = new Date(ms);
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

function getLevel(line) {
  if (/\b(error|ERROR|ERR)\b/.test(line)) return "ERROR";
  if (/\b(warn|WARN|WARNING)\b/.test(line)) return "WARN";
  if (/\b(info|INFO)\b/.test(line)) return "INFO";
  if (/\b(debug|DEBUG)\b/.test(line)) return "DEBUG";
  if (/\b(trace|TRACE)\b/.test(line)) return "TRACE";
  return "";
}

function getLevelClass(line) {
  const level = getLevel(line);
  return `level-${level.toLowerCase() || "default"}`;
}

function getLineClass(line) {
  return {
    "line-error": /\b(error|ERROR|ERR)\b/.test(line.line),
    "line-warn": /\b(warn|WARN|WARNING)\b/.test(line.line),
  };
}

function formatStream(stream) {
  if (!stream) return "";
  return Object.entries(stream)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
}

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.loki-streaming-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--el-bg-color);
}

.stream-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--el-fill-color-darker);
  border-bottom: 1px solid var(--el-color-primary-light-9);
  gap: 16px;
  flex-wrap: wrap;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.logql-input {
  width: 360px;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 24px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-danger);
}

.status-dot.is-active {
  background: var(--el-color-success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.log-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  font-family: "SF Mono", "Fira Code", "JetBrains Mono", "Cascadia Code", monospace;
  font-size: 12.5px;
  line-height: 1.65;
}

.log-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-disabled);
  gap: 12px;
}

.log-empty p {
  margin: 0;
  font-size: 14px;
}

.log-line {
  display: flex;
  align-items: flex-start;
  padding: 2px 24px 2px 0;
  border-left: 3px solid transparent;
  transition: background 0.15s;
}

.log-line:hover {
  background: var(--el-fill-color-lighter);
}

.log-line.line-error {
  border-left-color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.log-line.line-warn {
  border-left-color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

.line-timestamp {
  flex-shrink: 0;
  width: 190px;
  padding: 0 12px;
  color: var(--el-text-color-disabled);
  text-align: right;
  user-select: none;
}

.line-level {
  flex-shrink: 0;
  width: 56px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}

.level-error { color: var(--el-color-danger); }
.level-warn { color: var(--el-color-warning); }
.level-info { color: var(--el-color-success); }
.level-debug { color: var(--el-text-color-placeholder); }
.level-trace { color: var(--el-text-color-disabled); }
.level-default { color: var(--el-text-color-secondary); }

.line-stream {
  flex-shrink: 0;
  width: 200px;
  padding: 0 12px;
  color: var(--el-color-primary-light-3);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-content {
  flex: 1;
  color: var(--el-text-color-regular);
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
