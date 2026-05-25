<template>
  <div class="loki-query-workspace">
    <!-- Header -->
    <header class="loki-header">
      <div class="loki-header-title">
        <div class="loki-header-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a10 10 0 1 0 10 10h-10V2z" />
            <path d="M12 12 2 2" />
            <path d="M12 12 4 20" />
            <path d="M12 12h10" />
          </svg>
          <span>Loki 日志查询</span>
        </div>
      </div>
      <div class="loki-header-connection">
        <ElInput
          v-model="host"
          placeholder="主机地址"
          class="loki-input-conn"
          :disabled="connecting"
          size="small"
        />
        <ElInput
          v-model="port"
          placeholder="端口"
          class="loki-input-port"
          :disabled="connecting"
          size="small"
        />
        <ElButton
          v-if="!connectionId"
          type="primary"
          size="small"
          :loading="connecting"
          @click="handleConnect"
        >
          连接
        </ElButton>
        <ElButton
          v-else
          size="small"
          :loading="connecting"
          @click="handleDisconnect"
        >
          断开
        </ElButton>
        <ElTag v-if="healthStatus === 'ready'" type="success" size="small">已连接</ElTag>
        <ElTag v-else-if="healthStatus === 'error'" type="danger" size="small">异常</ElTag>
        <span v-if="connectionId" class="loki-conn-info">
          {{ host }}:{{ port }}
        </span>
      </div>
    </header>

    <!-- Main Body -->
    <div class="loki-body">
      <!-- Left Sidebar: Labels -->
      <aside class="loki-sidebar">
        <div class="loki-card">
          <div class="loki-label-header">
            <span class="loki-label-title">标签列表</span>
            <ElTag size="small" type="info">{{ labels.length }}</ElTag>
          </div>
          <ElInput
            v-model="labelSearch"
            placeholder="搜索标签..."
            size="small"
            clearable
            class="loki-label-search"
          />
          <div class="loki-label-list">
            <div
              v-for="label in filteredLabels"
              :key="label"
              class="loki-label-item"
              :class="{ active: selectedLabel === label }"
              @click="handleLabelClick(label)"
            >
              <span class="loki-label-name">{{ label }}</span>
              <svg
                v-if="selectedLabel === label"
                class="loki-label-arrow"
                width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <div v-if="!filteredLabels.length" class="loki-label-empty">
              {{ labels.length ? '无匹配标签' : '暂无标签，请先连接' }}
            </div>
          </div>
          <!-- Label Values -->
          <template v-if="labelValues.length > 0">
            <div class="loki-label-divider" />
            <div class="loki-label-header">
              <span class="loki-label-title">{{ selectedLabel }}</span>
              <ElTag size="small" type="info">{{ labelValues.length }}</ElTag>
            </div>
            <div class="loki-label-list loki-label-values">
              <div
                v-for="val in labelValues"
                :key="val"
                class="loki-label-item loki-label-value-item"
                @click="handleLabelValueClick(selectedLabel, val)"
              >
                <span class="loki-label-val">{{ val }}</span>
              </div>
            </div>
          </template>
        </div>
      </aside>

      <!-- Center: LogQL + Results -->
      <main class="loki-main">
        <div class="loki-card loki-query-card">
          <div class="loki-query-header">
            <span class="loki-query-title">LogQL 查询</span>
            <div class="loki-query-actions">
              <ElButton size="small" @click="clearLogql">清空</ElButton>
              <ElButton
                type="primary"
                size="small"
                :loading="querying"
                :disabled="!connectionId"
                @click="handleQuery"
              >
                查询
              </ElButton>
            </div>
          </div>
          <textarea
            v-model="logql"
            class="loki-logql-input"
            placeholder="输入 LogQL 查询语句，如: {job=&#34;default&#34;} |= &#34;error&#34;"
            rows="3"
            spellcheck="false"
          />
          <div class="loki-query-footer">
            <el-date-picker
              v-model="timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="loki-time-picker"
              size="small"
            />
            <div class="loki-limit-group">
              <span class="loki-limit-label">条数</span>
              <ElInput
                v-model.number="limit"
                type="number"
                size="small"
                class="loki-limit-input"
                min="1"
                :max="10000"
              />
            </div>
          </div>
        </div>

        <div class="loki-card loki-result-card">
          <div class="loki-result-header">
            <span class="loki-result-title">查询结果</span>
            <span v-if="rows.length" class="loki-result-count">{{ rows.length }} 条</span>
          </div>
          <el-table
            v-if="rows.length > 0"
            :data="rows"
            class="loki-table"
            @row-click="handleRowClick"
          >
            <el-table-column label="时间戳" width="190" prop="timestamp">
              <template #default="{ row }">
                <span class="loki-cell-timestamp">{{ row.timestamp }}</span>
              </template>
            </el-table-column>
            <el-table-column label="标签" width="240">
              <template #default="{ row }">
                <div class="loki-cell-tags">
                  <ElTag
                    v-for="(v, k) in row.labels"
                    :key="k"
                    size="small"
                    type="info"
                    class="loki-tag"
                  >
                    {{ k }}={{ v }}
                  </ElTag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="日志内容" min-width="300">
              <template #default="{ row }">
                <span
                  class="loki-cell-line"
                  :class="logLevelClass(row.line)"
                >{{ row.line }}</span>
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="loki-result-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" :stroke="'var(--el-text-color-disabled)'" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <p>{{ querying ? '正在查询...' : rowsError || '输入 LogQL 并点击查询' }}</p>
          </div>
        </div>
      </main>

      <!-- Right Panel: Detail -->
      <transition name="slide-right">
        <aside v-if="detailVisible" class="loki-detail-panel">
          <div class="loki-card loki-detail-card">
            <div class="loki-detail-header">
              <span class="loki-detail-title">日志详情</span>
              <ElButton size="small" @click="detailVisible = false">关闭</ElButton>
            </div>
            <div class="loki-detail-content">
              <div class="loki-detail-section">
                <div class="loki-detail-section-title">流标签</div>
                <div class="loki-detail-json">
                  <pre>{{ formatJson(selectedRow?.labels) }}</pre>
                </div>
              </div>
              <div class="loki-detail-section">
                <div class="loki-detail-section-title">时间戳</div>
                <div class="loki-detail-value">{{ selectedRow?.timestamp }}</div>
              </div>
              <div class="loki-detail-section">
                <div class="loki-detail-section-title">日志内容</div>
                <div
                  class="loki-detail-line"
                  :class="logLevelClass(selectedRow?.line)"
                >{{ selectedRow?.line }}</div>
              </div>
              <div class="loki-detail-section">
                <div class="loki-detail-section-title">原始 JSON</div>
                <div class="loki-detail-json">
                  <pre>{{ formatJson(selectedRowRaw) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  fetchLokiOpen,
  fetchLokiClose,
  fetchLokiReady,
  fetchLokiLabels,
  fetchLokiLabelValues,
  fetchLokiQueryRange,
} from "../../api/loki";

// ─── 连接状态 ──────────────────────────────────────────────────────────────
const host = ref(localStorage.getItem("loki_host") || "127.0.0.1");
const port = ref(localStorage.getItem("loki_port") || "3100");
const connectionId = ref(localStorage.getItem("loki_connection_id") || "");
const connecting = ref(false);
const healthStatus = ref("");

// ─── 标签 ───────────────────────────────────────────────────────────────────
const labels = ref([]);
const labelSearch = ref("");
const selectedLabel = ref("");
const labelValues = ref([]);
const loadingLabels = ref(false);

// ─── 查询 ────────────────────────────────────────────────────────────────────
const logql = ref(localStorage.getItem("loki_logql") || '{job="default"}');
const timeRange = ref([]);
const limit = ref(1000);
const querying = ref(false);
const rows = ref([]);
const rowsError = ref("");

// ─── 详情 ────────────────────────────────────────────────────────────────────
const detailVisible = ref(false);
const selectedRow = ref(null);
const selectedRowRaw = ref(null);

// ─── 计算属性 ────────────────────────────────────────────────────────────────
const filteredLabels = computed(() => {
  const q = labelSearch.value.toLowerCase().trim();
  if (!q) return labels.value;
  return labels.value.filter((l) => l.toLowerCase().includes(q));
});

// ─── 连接管理 ────────────────────────────────────────────────────────────────
const saveConnection = () => {
  localStorage.setItem("loki_host", host.value);
  localStorage.setItem("loki_port", port.value);
};

const handleConnect = async () => {
  if (!host.value || !port.value) {
    ElMessage.warning("请输入主机地址和端口");
    return;
  }
  connecting.value = true;
  try {
    const res = await fetchLokiOpen(host.value, Number(port.value));
    if (res.success && res.data) {
      connectionId.value = res.data;
      localStorage.setItem("loki_connection_id", res.data);
      saveConnection();
      ElMessage.success("连接成功");
      await checkHealth();
      await loadLabels();
    } else {
      ElMessage.error(res.message || "连接失败");
    }
  } catch (e) {
    ElMessage.error("连接失败: " + (e.message || e));
  } finally {
    connecting.value = false;
  }
};

const handleDisconnect = async () => {
  if (!connectionId.value) return;
  connecting.value = true;
  try {
    await fetchLokiClose(connectionId.value);
  } catch {
    // ignore
  } finally {
    connectionId.value = "";
    localStorage.removeItem("loki_connection_id");
    healthStatus.value = "";
    labels.value = [];
    labelValues.value = [];
    selectedLabel.value = "";
    rows.value = [];
    selectedRow.value = null;
    detailVisible.value = false;
    connecting.value = false;
    ElMessage.info("已断开连接");
  }
};

const checkHealth = async () => {
  if (!connectionId.value) return;
  try {
    const res = await fetchLokiReady(connectionId.value);
    healthStatus.value = res.data ? "ready" : "error";
  } catch {
    healthStatus.value = "error";
  }
};

// ─── 标签 ────────────────────────────────────────────────────────────────────
const loadLabels = async () => {
  if (!connectionId.value) return;
  loadingLabels.value = true;
  try {
    const res = await fetchLokiLabels(connectionId.value);
    if (res.success) {
      labels.value = Array.isArray(res.data) ? res.data.sort() : [];
    }
  } catch {
    ElMessage.error("加载标签失败");
  } finally {
    loadingLabels.value = false;
  }
};

const handleLabelClick = async (label) => {
  selectedLabel.value = label;
  labelValues.value = [];
  if (!connectionId.value) return;
  try {
    const res = await fetchLokiLabelValues(connectionId.value, label);
    if (res.success) {
      labelValues.value = Array.isArray(res.data) ? res.data : [];
    }
  } catch {
    // ignore
  }
};

const handleLabelValueClick = (label, value) => {
  const insertion = `{${label}="${value}"}`;
  if (logql.value.trim()) {
    logql.value = logql.value.trimEnd() + " " + insertion;
  } else {
    logql.value = insertion;
  }
};

// ─── 查询 ────────────────────────────────────────────────────────────────────
const clearLogql = () => {
  logql.value = "";
};

const formatNanoTimestamp = (ns) => {
  const ms = Math.floor(Number(ns) / 1000000);
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  const pad3 = (n) => String(n).padStart(3, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    " " +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes()) +
    ":" +
    pad(d.getSeconds()) +
    "." +
    pad3(d.getMilliseconds())
  );
};

const flattenStreams = (result) => {
  const list = [];
  if (!Array.isArray(result)) return list;
  for (const stream of result) {
    const labels = stream.stream || {};
    const values = stream.values || [];
    for (const [ts, line] of values) {
      list.push({
        timestamp: formatNanoTimestamp(ts),
        labels,
        line,
        _rawStream: stream,
      });
    }
  }
  list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return list;
};

const handleQuery = async () => {
  if (!connectionId.value) {
    ElMessage.warning("请先连接 Loki");
    return;
  }
  if (!logql.value.trim()) {
    ElMessage.warning("请输入 LogQL 查询语句");
    return;
  }
  querying.value = true;
  rowsError.value = "";
  rows.value = [];
  selectedRow.value = null;
  detailVisible.value = false;

  let start = "";
  let end = "";
  if (timeRange.value && timeRange.value.length === 2) {
    start = new Date(timeRange.value[0]).toISOString();
    end = new Date(timeRange.value[1]).toISOString();
  }

  try {
    const res = await fetchLokiQueryRange(
      connectionId.value,
      logql.value.trim(),
      start,
      end,
      Math.min(Math.max(limit.value || 1000, 1), 10000)
    );
    if (res.success) {
      const data = res.data;
      const result =
        data?.data?.result || (Array.isArray(data) ? data : []);
      rows.value = flattenStreams(result);
      localStorage.setItem("loki_logql", logql.value.trim());
      if (!rows.value.length) {
        rowsError.value = "查询结果为空";
      }
    } else {
      rowsError.value = res.message || "查询失败";
    }
  } catch (e) {
    rowsError.value = "查询异常: " + (e.message || e);
  } finally {
    querying.value = false;
  }
};

// ─── 行点击 → 详情 ──────────────────────────────────────────────────────────
const handleRowClick = (row) => {
  selectedRow.value = row;
  selectedRowRaw.value = row?._rawStream || null;
  detailVisible.value = true;
};

// ─── 日志级别高亮 ────────────────────────────────────────────────────────────
const logLevelClass = (line) => {
  if (!line) return "";
  const upper = line.toUpperCase();
  if (upper.includes("ERROR") || upper.includes("FATAL")) return "loki-level-error";
  if (upper.includes("WARN") || upper.includes("WARNING")) return "loki-level-warn";
  return "";
};

// ─── 工具函数 ────────────────────────────────────────────────────────────────
const formatJson = (obj) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj || "");
  }
};

// ─── 初始化 ───────────────────────────────────────────────────────────────────
watch(connectionId, (id) => {
  if (id) {
    checkHealth();
  }
});
</script>

<style scoped>
/* ─── 页面容器 ────────────────────────────────────────────────────────────── */
.loki-query-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
}

/* ─── Header ───────────────────────────────────────────────────────────────── */
.loki-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: var(--el-fill-color-darker);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
  gap: 16px;
  flex-wrap: wrap;
}

.loki-header-title {
  display: flex;
  align-items: center;
}

.loki-header-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.loki-header-logo svg {
  color: var(--el-color-primary);
}

.loki-header-connection {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.loki-input-conn {
  width: 140px;
}

.loki-input-port {
  width: 90px;
}

.loki-conn-info {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-left: 4px;
}

/* ─── Body ─────────────────────────────────────────────────────────────────── */
.loki-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 1px;
  background: var(--el-fill-color-lighter);
}

/* ─── Sidebar ──────────────────────────────────────────────────────────────── */
.loki-sidebar {
  width: 260px;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 8px;
}

.loki-sidebar .loki-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.loki-label-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.loki-label-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary-light-5);
}

.loki-label-search {
  margin-bottom: 8px;
}

.loki-label-list {
  flex: 1;
  overflow-y: auto;
  margin: 0 -4px;
  padding: 0 4px;
}

.loki-label-list::-webkit-scrollbar {
  width: 4px;
}
.loki-label-list::-webkit-scrollbar-thumb {
  background: var(--el-border-color-darker);
  border-radius: 4px;
}

.loki-label-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  margin: 2px 0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
  transition: all 0.15s;
  color: var(--el-text-color-secondary);
}

.loki-label-item:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-text-color-primary);
}

.loki-label-item.active {
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary-light-3);
}

.loki-label-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loki-label-arrow {
  flex-shrink: 0;
  color: var(--el-color-primary-light-3);
}

.loki-label-empty {
  padding: 20px 10px;
  text-align: center;
  color: var(--el-text-color-disabled);
  font-size: 12px;
}

.loki-label-divider {
  height: 1px;
  background: var(--el-border-color-light);
  margin: 8px 0;
}

.loki-label-values {
  max-height: 200px;
}

.loki-label-value-item {
  padding-left: 16px;
}

.loki-label-val {
  color: var(--el-color-success-light-5);
}

/* ─── Main Center ──────────────────────────────────────────────────────────── */
.loki-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 8px;
  gap: 8px;
  min-width: 0;
}

/* ─── Cards ────────────────────────────────────────────────────────────────── */
.loki-card {
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 14px;
}

/* ─── Query Card ───────────────────────────────────────────────────────────── */
.loki-query-card {
  flex-shrink: 0;
}

.loki-query-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.loki-query-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary-light-5);
}

.loki-query-actions {
  display: flex;
  gap: 6px;
}

.loki-logql-input {
  width: 100%;
  background: var(--el-fill-color-dark);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  color: var(--el-text-color-primary);
  font-family: "SF Mono", "Fira Code", "Cascadia Code", "JetBrains Mono", monospace;
  font-size: 13px;
  padding: 10px 12px;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
  line-height: 1.5;
}

.loki-logql-input:focus {
  border-color: var(--el-color-primary);
}

.loki-logql-input::placeholder {
  color: var(--el-text-color-disabled);
}

.loki-query-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  gap: 12px;
  flex-wrap: wrap;
}

.loki-time-picker {
  flex: 1;
  min-width: 200px;
}

.loki-time-picker :deep(.el-range-input),
.loki-time-picker :deep(.el-range-separator) {
  background: transparent !important;
  color: var(--el-text-color-primary) !important;
}

.loki-limit-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.loki-limit-label {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

.loki-limit-input {
  width: 80px;
}

/* ─── Result Card ──────────────────────────────────────────────────────────── */
.loki-result-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.loki-result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.loki-result-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary-light-5);
}

.loki-result-count {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.loki-table {
  flex: 1;
  overflow: auto;
}

.loki-table {
  background: transparent !important;
  color: var(--el-text-color-primary);
  --el-table-border-color: var(--el-border-color-light);
  --el-table-header-bg-color: var(--el-fill-color-lighter);
  --el-table-tr-bg-color: transparent;
  --el-table-current-row-bg-color: var(--el-color-primary-light-9);
  --el-table-row-hover-bg-color: var(--el-fill-color);
}

.loki-table :deep(th.el-table__cell) {
  background: var(--el-fill-color-lighter) !important;
  color: var(--el-text-color-placeholder);
  font-weight: 500;
  font-size: 12px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.loki-table :deep(td.el-table__cell) {
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.loki-table :deep(.el-table__body tr:hover td) {
  background-color: var(--el-color-primary-light-9) !important;
}

.loki-table :deep(.el-table__body tr.current-row td) {
  background-color: var(--el-color-primary-light-9) !important;
}

.loki-cell-timestamp {
  font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.loki-cell-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.loki-tag {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: "SF Mono", "Fira Code", monospace;
  font-size: 11px !important;
}

.loki-cell-line {
  font-family: "SF Mono", "Fira Code", "Cascadia Code", "JetBrains Mono", monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.loki-level-error {
  color: var(--el-color-danger) !important;
}

.loki-level-warn {
  color: var(--el-color-warning) !important;
}

.loki-result-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  color: var(--el-text-color-disabled);
  text-align: center;
  gap: 12px;
}

.loki-result-empty p {
  font-size: 13px;
  margin: 0;
}

/* ─── Right Detail Panel ───────────────────────────────────────────────────── */
.loki-detail-panel {
  width: 320px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 8px;
  border-left: 1px solid var(--el-border-color-light);
}

.loki-detail-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.loki-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.loki-detail-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary-light-5);
}

.loki-detail-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loki-detail-content::-webkit-scrollbar {
  width: 4px;
}
.loki-detail-content::-webkit-scrollbar-thumb {
  background: var(--el-border-color-darker);
  border-radius: 4px;
}

.loki-detail-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.loki-detail-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--el-text-color-disabled);
}

.loki-detail-value {
  font-size: 12px;
  font-family: "SF Mono", "Fira Code", monospace;
  color: var(--el-text-color-secondary);
}

.loki-detail-line {
  font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  word-break: break-all;
  white-space: pre-wrap;
}

.loki-detail-json {
  background: var(--el-fill-color-dark);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 10px;
  overflow-x: auto;
}

.loki-detail-json pre {
  margin: 0;
  font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: pre;
  word-break: normal;
  line-height: 1.5;
}

/* ─── Slide Transition ─────────────────────────────────────────────────────── */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: width 0.25s ease, opacity 0.2s ease;
  overflow: hidden;
}

.slide-right-enter-from,
.slide-right-leave-to {
  width: 0 !important;
  opacity: 0;
  padding: 0;
  border: none;
}

/* ─── El overrides (dark theme) ────────────────────────────────────────────── */
.loki-query-workspace :deep(.el-date-editor) {
  background: var(--el-fill-color-dark) !important;
  border: 1px solid var(--el-border-color) !important;
  border-radius: 8px;
}

.loki-query-workspace :deep(.el-date-editor .el-range-input) {
  background: transparent !important;
  color: var(--el-text-color-primary) !important;
  font-size: 12px;
}

.loki-query-workspace :deep(.el-date-editor .el-range-separator) {
  color: var(--el-text-color-disabled) !important;
}

.loki-query-workspace :deep(.el-range-editor.is-active) {
  border-color: var(--el-color-primary) !important;
}

</style>
