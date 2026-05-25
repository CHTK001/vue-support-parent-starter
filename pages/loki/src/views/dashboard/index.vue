<template>
  <section class="loki-dashboard-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="header-title">
        <ElIcon><Odometer /></ElIcon>
        Loki 仪表盘
      </h2>
      <p class="header-desc">连接状态监控、日志量趋势、标签分布</p>
    </div>

    <!-- 未连接提示 -->
    <div v-if="!connectionId" class="no-connection">
      <div class="no-connection-card">
        <ElIcon :size="48"><WarningFilled /></ElIcon>
        <h3>未连接 Loki</h3>
        <p>请先在日志查询页面连接 Loki 服务，再查看仪表盘</p>
        <ElButton type="primary" round @click="$router.push('/loki/log-query')">
          前往连接
        </ElButton>
      </div>
    </div>

    <template v-else>
      <!-- 统计卡片行 -->
      <div class="stats-row">
        <div class="stat-card stat-card--status">
          <div class="stat-icon">
            <ElIcon :size="24"><Connection /></ElIcon>
          </div>
          <div class="stat-body">
            <span class="stat-label">连接状态</span>
            <span class="stat-value" :class="{ 'is-ok': ready, 'is-fail': !ready && ready !== null }">
              <span class="status-dot" :class="{ active: ready }"></span>
              {{ ready === null ? '检测中' : ready ? '健康' : '异常' }}
            </span>
          </div>
        </div>
        <div class="stat-card stat-card--labels">
          <div class="stat-icon">
            <ElIcon :size="24"><PriceTag /></ElIcon>
          </div>
          <div class="stat-body">
            <span class="stat-label">标签数量</span>
            <span class="stat-value">{{ labelCount }}</span>
          </div>
        </div>
        <div class="stat-card stat-card--volume">
          <div class="stat-icon">
            <ElIcon :size="24"><Document /></ElIcon>
          </div>
          <div class="stat-body">
            <span class="stat-label">最近日志流</span>
            <span class="stat-value">{{ streamCount }}</span>
          </div>
        </div>
        <div class="stat-card stat-card--errors">
          <div class="stat-icon">
            <ElIcon :size="24"><WarningFilled /></ElIcon>
          </div>
          <div class="stat-body">
            <span class="stat-label">错误日志</span>
            <span class="stat-value">{{ errorCount }}</span>
          </div>
        </div>
      </div>

      <!-- 图表行 -->
      <div class="charts-row">
        <!-- 日志量趋势 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>日志量趋势 (最近6小时)</h3>
            <ElButton text size="small" :icon="RefreshRight" @click="loadTrend">刷新</ElButton>
          </div>
          <div ref="trendChartRef" class="chart-body"></div>
        </div>

        <!-- 标签分布 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>标签分布 (Top 10)</h3>
            <ElButton text size="small" :icon="RefreshRight" @click="loadLabelDistribution">刷新</ElButton>
          </div>
          <div ref="labelChartRef" class="chart-body"></div>
        </div>
      </div>

      <!-- 最近错误日志 -->
      <div class="error-section">
        <div class="section-header">
          <h3><ElIcon><WarningFilled /></ElIcon> 最近错误日志</h3>
          <ElButton text size="small" :icon="RefreshRight" @click="loadErrors">刷新</ElButton>
        </div>
        <div class="error-table-wrap">
          <table class="error-table">
            <thead>
              <tr>
                <th style="width: 190px;">时间</th>
                <th style="width: 120px;">来源</th>
                <th>内容</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in errorRows" :key="i">
                <td class="ts-cell">{{ row.timestamp }}</td>
                <td>
                  <ElTag size="small" type="info">{{ row.source }}</ElTag>
                </td>
                <td class="content-cell">{{ row.line }}</td>
              </tr>
              <tr v-if="!errorRows.length">
                <td colspan="3" style="text-align: center; padding: 40px; color: var(--el-text-color-disabled);">
                  {{ errorsLoading ? '加载中…' : '暂无错误日志' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import {
  Odometer,
  Connection,
  PriceTag,
  Document,
  WarningFilled,
  RefreshRight,
} from "@element-plus/icons-vue";
import * as echarts from "echarts";
import {
  fetchLokiReady,
  fetchLokiLabels,
  fetchLokiQueryRange,
} from "../../api/loki";

/** 读取 Element Plus CSS 变量 */
function epVar(name, fallback = "") {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

const connectionId = ref(localStorage.getItem("loki_connection_id") || "");
const ready = ref(null);
const labelCount = ref(0);
const streamCount = ref(0);
const errorCount = ref(0);
const errorRows = ref([]);
const errorsLoading = ref(false);

const trendChartRef = ref(null);
const labelChartRef = ref(null);
let trendChart = null;
let labelChart = null;

onMounted(async () => {
  if (!connectionId.value) return;
  await Promise.all([
    checkReady(),
    loadLabels(),
    loadTrend(),
    loadErrors(),
    loadLabelDistribution(),
  ]);
});

onUnmounted(() => {
  trendChart?.dispose();
  labelChart?.dispose();
});

async function checkReady() {
  try {
    const res = await fetchLokiReady(connectionId.value);
    ready.value = (res.code === "00000" || res.code === 200) && res.data === true;
  } catch {
    ready.value = false;
  }
}

async function loadLabels() {
  try {
    const res = await fetchLokiLabels(connectionId.value);
    if (res.code === "00000" || res.code === 200) {
      labelCount.value = (res.data || []).length;
    }
  } catch { /* ignore */ }
}

async function loadTrend() {
  if (!trendChartRef.value) return;
  const end = String(Date.now() * 1000000);
  const start = String((Date.now() - 6 * 3600 * 1000) * 1000000);

  try {
    const res = await fetchLokiQueryRange(
      connectionId.value, "{job=~\".+\"}", start, end, 5000, "1800"
    );
    if ((res.code === "00000" || res.code === 200) && res.data?.data?.result) {
      const result = res.data.data.result;
      let totalStreams = 0;
      const buckets = {};
      for (const stream of result) {
        totalStreams++;
        for (const [ts] of stream.values) {
          const bucketMs = Math.floor(Number(ts) / 1000000 / 1800000) * 1800000;
          buckets[bucketMs] = (buckets[bucketMs] || 0) + 1;
        }
      }
      streamCount.value = totalStreams;

      const times = Object.keys(buckets).sort();
      const data = times.map((t) => [Number(t), buckets[t]]);

      renderTrendChart(data);
    }
  } catch { /* ignore */ }
}

function renderTrendChart(data) {
  if (!trendChartRef.value) return;
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value, "dark");
  }
  const primary = epVar("--el-color-primary", "#409eff");
  trendChart.setOption({
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: epVar("--el-bg-color-overlay", "#1d1e1c"),
      borderColor: epVar("--el-border-color", "#4c4d4f"),
      textStyle: { color: epVar("--el-text-color-primary", "#cfd3dc") },
    },
    grid: { top: 20, right: 20, bottom: 40, left: 50 },
    xAxis: {
      type: "time",
      axisLine: { lineStyle: { color: epVar("--el-border-color-darker", "#636464") } },
      axisLabel: { color: epVar("--el-text-color-placeholder", "#8d9095"), fontSize: 11 },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: epVar("--el-border-color-lighter", "#414243") } },
      axisLabel: { color: epVar("--el-text-color-placeholder", "#8d9095") },
    },
    series: [
      {
        type: "line",
        data,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: primary, width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: primary + "59" },
            { offset: 1, color: primary + "05" },
          ]),
        },
      },
    ],
  });
}

async function loadErrors() {
  errorsLoading.value = true;
  const end = String(Date.now() * 1000000);
  const start = String((Date.now() - 3600 * 1000) * 1000000);
  try {
    const res = await fetchLokiQueryRange(
      connectionId.value,
      '{job=~".+"} |~ "(?i)(error|exception|fatal)"',
      start, end, 20, undefined, "backward"
    );
    if ((res.code === "00000" || res.code === 200) && res.data?.data?.result) {
      const rows = [];
      for (const stream of res.data.data.result) {
        for (const [ts, line] of stream.values) {
          const source = stream.stream?.job || stream.stream?.app || Object.values(stream.stream || {})[0] || "-";
          rows.push({ timestamp: formatTs(ts), source, line });
        }
      }
      errorRows.value = rows.slice(0, 20);
      errorCount.value = rows.length;
    }
  } catch { /* ignore */ }
  finally { errorsLoading.value = false; }
}

async function loadLabelDistribution() {
  if (!labelChartRef.value) return;
  try {
    const res = await fetchLokiLabels(connectionId.value);
    if ((res.code === "00000" || res.code === 200) && res.data) {
      const labels = res.data.slice(0, 10);
      renderLabelChart(labels);
    }
  } catch { /* ignore */ }
}

function renderLabelChart(labels) {
  if (!labelChartRef.value) return;
  if (!labelChart) {
    labelChart = echarts.init(labelChartRef.value, "dark");
  }
  const colors = [
    epVar("--el-color-primary", "#409eff"),
    epVar("--el-color-primary-light-3", "#79bbff"),
    epVar("--el-color-primary-light-5", "#a6c9ff"),
    epVar("--el-color-success", "#67c23a"),
    epVar("--el-color-success-light-3", "#95d475"),
    epVar("--el-color-warning", "#e6a23c"),
    epVar("--el-color-warning-light-3", "#eebe77"),
    epVar("--el-color-danger", "#f56c6c"),
    epVar("--el-color-danger-light-3", "#f89898"),
    epVar("--el-color-info", "#909399"),
  ];
  labelChart.setOption({
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: epVar("--el-bg-color-overlay", "#1d1e1c"),
      borderColor: epVar("--el-border-color", "#4c4d4f"),
      textStyle: { color: epVar("--el-text-color-primary", "#cfd3dc") },
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "55%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: epVar("--el-bg-color-page", "#0a0a0a"), borderWidth: 2 },
        label: { color: epVar("--el-text-color-secondary", "#a3a6ad"), fontSize: 12 },
        data: labels.map((l, i) => ({
          name: l,
          value: 1,
          itemStyle: { color: colors[i % colors.length] },
        })),
      },
    ],
  });
}

function formatTs(ns) {
  const ms = Math.floor(Number(ns) / 1000000);
  const d = new Date(ms);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}
</script>

<style scoped>
.loki-dashboard-page {
  padding: 20px;
  min-height: 100%;
  background: var(--el-bg-color-page);
}

.page-header {
  margin-bottom: 24px;
  padding: 24px;
  background: var(--el-fill-color-darker);
  border-radius: 16px;
  border: 1px solid var(--el-color-primary-light-8);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3), var(--el-color-primary-light-5));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-desc {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

.no-connection {
  display: flex;
  justify-content: center;
  padding: 80px 20px;
}

.no-connection-card {
  text-align: center;
  padding: 48px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 16px;
  backdrop-filter: blur(12px);
  color: var(--el-text-color-placeholder);
}

.no-connection-card h3 {
  margin: 16px 0 8px;
  color: var(--el-text-color-primary);
}

.no-connection-card p {
  margin: 0 0 24px;
  font-size: 13px;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  backdrop-filter: blur(12px);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary-light-3);
  flex-shrink: 0;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-value.is-ok { color: var(--el-color-success); }
.stat-value.is-fail { color: var(--el-color-danger); }

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--el-color-danger);
}

.status-dot.active {
  background: var(--el-color-success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 图表 */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.chart-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.chart-body {
  height: 280px;
  padding: 8px;
}

/* 错误日志 */
.error-section {
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.error-table-wrap {
  overflow-x: auto;
}

.error-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.error-table th {
  padding: 10px 16px;
  text-align: left;
  font-weight: 500;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.error-table td {
  padding: 10px 16px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  color: var(--el-text-color-regular);
}

.error-table tr:hover td {
  background: var(--el-color-danger-light-9);
}

.ts-cell {
  font-family: "SF Mono", monospace;
  font-size: 12px;
  color: var(--el-text-color-placeholder) !important;
  white-space: nowrap;
}

.content-cell {
  font-family: "SF Mono", monospace;
  font-size: 12px;
  max-width: 600px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-color-danger) !important;
}

@media (max-width: 960px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>
