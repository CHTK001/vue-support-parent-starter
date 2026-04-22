<template>
  <div class="fo">
    <section class="fo__summary-grid">
      <article v-for="card in summaryCards" :key="card.key" class="fo__summary-card">
        <div class="fo__summary-label">
          <span>{{ card.label }}</span>
          <span v-if="card.tag" class="fo__summary-tag">{{ card.tag }}</span>
        </div>
        <div class="fo__summary-value">{{ card.value }}</div>
        <div v-if="card.hint" class="fo__summary-hint">{{ card.hint }}</div>
      </article>

      <article class="fo__summary-card fo__summary-card--qps">
        <div class="fo__summary-label">
          <span>实时 QPS</span>
          <span class="fo__summary-chip">{{ currentQps }}</span>
        </div>
        <svg class="fo__sparkline" viewBox="0 0 260 100" preserveAspectRatio="none">
          <polyline class="fo__sparkline-grid" :points="gridPoints" />
          <polyline class="fo__sparkline-line" :points="qpsLinePoints" />
        </svg>
      </article>
    </section>

    <section class="fo__hero-grid">
      <article class="fo__panel fo__panel--geo">
        <header class="fo__panel-head">
          <h3>地理位置</h3>
          <div class="fo__segmented">
            <button type="button" class="is-active">世界</button>
            <button type="button">中国</button>
            <button type="button" class="is-active">访问</button>
            <button type="button">仅拦截</button>
          </div>
        </header>

        <div class="fo__geo-stage">
          <div class="fo__orb">
            <div class="fo__orb-core" />
            <div class="fo__orb-ring fo__orb-ring--outer" />
            <div class="fo__orb-ring fo__orb-ring--inner" />
          </div>

          <div class="fo__geo-bars">
            <div v-for="item in geoTop" :key="item.name" class="fo__geo-row">
              <div class="fo__geo-name">{{ item.name }}</div>
              <div class="fo__geo-track">
                <div class="fo__geo-fill" :style="{ width: `${item.percent}%` }" />
              </div>
              <div class="fo__geo-count">{{ item.value }}</div>
            </div>
          </div>
        </div>
      </article>

      <div class="fo__trend-column">
        <article class="fo__panel">
          <header class="fo__panel-head">
            <h3>访问情况</h3>
            <span class="fo__panel-stat">峰值 {{ accessPeak }}</span>
          </header>
          <svg class="fo__line-chart" viewBox="0 0 280 170" preserveAspectRatio="none">
            <polyline class="fo__line-chart-grid" :points="gridPointsTall" />
            <polyline class="fo__line-chart-line fo__line-chart-line--visit" :points="accessLinePoints" />
          </svg>
        </article>

        <article class="fo__panel">
          <header class="fo__panel-head">
            <h3>拦截情况</h3>
            <span class="fo__panel-stat">峰值 {{ blockedPeak }}</span>
          </header>
          <svg class="fo__line-chart" viewBox="0 0 280 170" preserveAspectRatio="none">
            <polyline class="fo__line-chart-grid" :points="gridPointsTall" />
            <polyline class="fo__line-chart-line fo__line-chart-line--block" :points="blockedLinePoints" />
          </svg>
        </article>
      </div>
    </section>

    <section class="fo__detail-grid">
      <article class="fo__panel">
        <header class="fo__panel-head">
          <h3>客户端</h3>
          <button type="button" class="fo__link" @click="emit('refresh')">查看更多</button>
        </header>
        <div class="fo__donut-wrap">
          <div class="fo__donut fo__donut--client" :style="{ '--donut': clientDonut }" />
          <div class="fo__legend-grid">
            <div v-for="item in clientRows" :key="item.name" class="fo__legend-item">
              <span class="fo__legend-name">{{ item.name }}</span>
              <span class="fo__legend-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </article>

      <article class="fo__panel">
        <header class="fo__panel-head">
          <h3>响应状态</h3>
          <button type="button" class="fo__link" @click="emit('refresh')">查看更多</button>
        </header>
        <div class="fo__donut-wrap">
          <div class="fo__donut fo__donut--status" :style="{ '--donut': statusDonut }" />
          <div class="fo__legend-grid">
            <div v-for="item in statusRows" :key="item.name" class="fo__legend-item">
              <span class="fo__legend-name">{{ item.name }}</span>
              <span class="fo__legend-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </article>

      <article class="fo__panel">
        <header class="fo__panel-head">
          <h3>外部来源域名</h3>
          <button type="button" class="fo__link" @click="emit('refresh')">查看更多</button>
        </header>
        <div class="fo__rank-list">
          <div v-for="item in refererDomainRows" :key="item.name" class="fo__rank-row">
            <span class="fo__rank-label">{{ item.name }}</span>
            <div class="fo__rank-track">
              <div class="fo__rank-fill fo__rank-fill--blue" :style="{ width: `${item.percent}%` }" />
            </div>
            <span class="fo__rank-value">{{ item.value }}</span>
          </div>
        </div>
      </article>

      <article class="fo__panel">
        <header class="fo__panel-head">
          <h3>外部来源页面</h3>
          <button type="button" class="fo__link" @click="emit('refresh')">查看更多</button>
        </header>
        <div class="fo__rank-list">
          <div v-for="item in refererPageRows" :key="item.name" class="fo__rank-row">
            <span class="fo__rank-label">{{ item.name }}</span>
            <div class="fo__rank-track">
              <div class="fo__rank-fill fo__rank-fill--pink" :style="{ width: `${item.percent}%` }" />
            </div>
            <span class="fo__rank-value">{{ item.value }}</span>
          </div>
        </div>
      </article>

      <article class="fo__panel">
        <header class="fo__panel-head">
          <h3>受访域名</h3>
          <button type="button" class="fo__link" @click="emit('refresh')">查看更多</button>
        </header>
        <div class="fo__rank-list">
          <div v-for="item in hostRows" :key="item.name" class="fo__rank-row">
            <span class="fo__rank-label">{{ item.name }}</span>
            <div class="fo__rank-track">
              <div class="fo__rank-fill fo__rank-fill--blue" :style="{ width: `${item.percent}%` }" />
            </div>
            <span class="fo__rank-value">{{ item.value }}</span>
          </div>
        </div>
      </article>

      <article class="fo__panel">
        <header class="fo__panel-head">
          <h3>受访页面</h3>
          <button type="button" class="fo__link" @click="emit('refresh')">查看更多</button>
        </header>
        <div class="fo__rank-list">
          <div v-for="item in pathRows" :key="item.name" class="fo__rank-row">
            <span class="fo__rank-label">{{ item.name }}</span>
            <div class="fo__rank-track">
              <div class="fo__rank-fill fo__rank-fill--pink" :style="{ width: `${item.percent}%` }" />
            </div>
            <span class="fo__rank-value">{{ item.value }}</span>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { getFirewallMetrics, type FirewallMetricsRecord, type SystemServerFilterLogRecord } from "@/api/system-server";

const props = defineProps<{
  serverId: number;
  rows: SystemServerFilterLogRecord[];
}>();
const emit = defineEmits<{
  (e: "refresh"): void;
}>();

type SummaryCard = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  tag?: string;
};

type RankRow = {
  name: string;
  count: number;
  value: string;
  percent: number;
};

const metrics = ref<FirewallMetricsRecord | null>(null);

function parseTime(row: SystemServerFilterLogRecord): number | null {
  const text = row.storeTime || row.accessTime;
  if (!text) return null;
  const d = new Date(text.replace(/-/g, "/"));
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function formatCompact(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function buildHost(row: SystemServerFilterLogRecord): string {
  return (row.host || "").trim() || "未上报域名";
}

function buildPath(row: SystemServerFilterLogRecord): string {
  const path = (row.path || "").trim();
  if (path) return path;
  const referer = (row.referer || "").trim();
  if (referer) return referer;
  return "未上报页面";
}

function buildUrl(row: SystemServerFilterLogRecord): string {
  const path = (row.path || "").trim();
  if (/^https?:\/\//i.test(path)) return path;
  const host = (row.host || "").trim();
  if (host && path) return `https://${host}${path.startsWith("/") ? path : `/${path}`}`;
  if (host) return `https://${host}`;
  return path || "未知";
}

function parseDomain(urlLike?: string): string {
  const source = (urlLike || "").trim();
  if (!source) return "未知";
  try {
    const normalized = /^https?:\/\//i.test(source) ? source : `https://${source}`;
    return new URL(normalized).host || source;
  } catch {
    return source.split("/")[0] || "未知";
  }
}

function parseBrowser(ua: string): string {
  const s = (ua || "").toLowerCase();
  if (!s) return "Unknown";
  if (s.includes("edg/")) return "Edge";
  if (s.includes("chrome/") && !s.includes("edg/") && !s.includes("opr/")) return "Chrome";
  if (s.includes("firefox/")) return "Firefox";
  if (s.includes("safari/") && s.includes("version/")) return "Safari";
  if (s.includes("headlesschrome")) return "HeadlessChrome";
  return "Unknown";
}

function parseOs(ua: string): string {
  const s = (ua || "").toLowerCase();
  if (!s) return "Unknown";
  if (s.includes("windows")) return "Windows";
  if (s.includes("mac")) return "MacOS";
  if (s.includes("android")) return "Android";
  if (s.includes("iphone") || s.includes("ipad") || s.includes("ios")) return "iOS";
  if (s.includes("linux")) return "Linux";
  return "Unknown";
}

function topRows(map: Map<string, number>, limit = 6): RankRow[] {
  const rows = [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  const max = Math.max(1, ...rows.map(([, count]) => count));
  return rows.map(([name, count]) => ({
    name,
    count,
    value: formatCompact(count),
    percent: Math.max(4, Math.round((count / max) * 100)),
  }));
}

function buildDonut(rows: RankRow[], colors: string[]): string {
  if (!rows.length) return "conic-gradient(#404040 0deg 360deg)";
  const total = rows.reduce((sum, row) => sum + row.count, 0) || 1;
  let start = 0;
  const stops: string[] = [];
  rows.slice(0, colors.length).forEach((row, index) => {
    const end = start + (row.count / total) * 360;
    stops.push(`${colors[index]} ${start}deg ${end}deg`);
    start = end;
  });
  if (start < 360) {
    stops.push(`#3b3b3b ${start}deg 360deg`);
  }
  return `conic-gradient(${stops.join(", ")})`;
}

const rows = computed(() => props.rows || []);
const requestCount = computed(() => metrics.value?.total ?? rows.value.length);
const requestIds = computed(() => new Set(rows.value.map((row) => row.requestId).filter(Boolean)).size || requestCount.value);
const uniqueIpCount = computed(() => new Set(rows.value.map((row) => row.clientIp).filter(Boolean)).size);
const blockedRows = computed(() => rows.value.filter((row) => (row.actionStatus || "").toUpperCase() === "DENY"));
const blockedCount = computed(() => metrics.value?.denied ?? blockedRows.value.length);
const blockedIps = computed(() => new Set(blockedRows.value.map((row) => row.clientIp).filter(Boolean)).size);

const statusCounts = computed(() => {
  const result = new Map<string, number>();
  for (const row of rows.value) {
    const code = row.statusCode ? String(row.statusCode) : (row.actionStatus || "未知").toUpperCase();
    result.set(code, (result.get(code) || 0) + 1);
  }
  return result;
});

const http4xxCount = computed(() =>
  [...statusCounts.value.entries()]
    .filter(([name]) => /^4\d\d$/.test(name))
    .reduce((sum, [, count]) => sum + count, 0),
);
const http5xxCount = computed(() =>
  [...statusCounts.value.entries()]
    .filter(([name]) => /^5\d\d$/.test(name))
    .reduce((sum, [, count]) => sum + count, 0),
);

const summaryCards = computed<SummaryCard[]>(() => {
  const total = requestCount.value || 1;
  return [
    { key: "req", label: "请求次数", value: formatCompact(requestCount.value) },
    { key: "pv", label: "访问次数（PV）", value: formatCompact(requestIds.value || requestCount.value) },
    { key: "uv", label: "独立访客（UV）", value: formatCompact(uniqueIpCount.value), tag: "人" },
    { key: "ip", label: "独立 IP", value: formatCompact(uniqueIpCount.value), tag: "IP" },
    { key: "block", label: "拦截次数", value: formatCompact(blockedCount.value), tag: "@" },
    { key: "block-ip", label: "攻击 IP", value: formatCompact(blockedIps.value), tag: "IP" },
    {
      key: "4xx",
      label: "4xx 错误数",
      value: formatCompact(http4xxCount.value),
      tag: "⚠",
      hint: `${((http4xxCount.value / total) * 100).toFixed(2)}%`,
    },
    {
      key: "5xx",
      label: "5xx 错误数",
      value: formatCompact(http5xxCount.value),
      tag: "⚠",
      hint: `${((http5xxCount.value / total) * 100).toFixed(2)}%`,
    },
  ];
});

const timelineBuckets = computed(() => {
  const bucketSize = 10 * 60 * 1000;
  const sorted = rows.value
    .map((row) => ({ row, time: parseTime(row) }))
    .filter((item) => item.time != null)
    .sort((a, b) => (a.time! - b.time!));
  if (!sorted.length) {
    return Array.from({ length: 24 }, (_, index) => ({ label: String(index + 1), total: 0, blocked: 0, qps: 0 }));
  }
  const start = sorted[0]!.time!;
  const end = sorted[sorted.length - 1]!.time!;
  const count = Math.max(24, Math.min(36, Math.ceil((end - start) / bucketSize) + 1));
  return Array.from({ length: count }, (_, index) => {
    const min = start + index * bucketSize;
    const max = min + bucketSize;
    const items = sorted.filter((entry) => entry.time! >= min && entry.time! < max);
    const blocked = items.filter((entry) => (entry.row.actionStatus || "").toUpperCase() === "DENY").length;
    return {
      label: String(index + 1),
      total: items.length,
      blocked,
      qps: Number((items.length / 600).toFixed(1)),
    };
  });
});

function toPolyline(values: number[], width: number, height: number, padding = 8): string {
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const x = padding + index * step;
      const y = height - padding - (value / max) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

const qpsLinePoints = computed(() => toPolyline(timelineBuckets.value.map((bucket) => bucket.qps), 260, 100));
const accessLinePoints = computed(() => toPolyline(timelineBuckets.value.map((bucket) => bucket.total), 280, 170));
const blockedLinePoints = computed(() => toPolyline(timelineBuckets.value.map((bucket) => bucket.blocked), 280, 170));
const gridPoints = "8,82 252,82";
const gridPointsTall = "8,146 272,146";

const currentQps = computed(() => {
  const bucket = timelineBuckets.value[timelineBuckets.value.length - 1];
  return bucket ? String(bucket.qps) : "0";
});
const accessPeak = computed(() => formatCompact(Math.max(0, ...timelineBuckets.value.map((bucket) => bucket.total))));
const blockedPeak = computed(() => formatCompact(Math.max(0, ...timelineBuckets.value.map((bucket) => bucket.blocked))));

const geoTop = computed(() => {
  const counts = new Map<string, number>();
  for (const row of rows.value) {
    const raw = (row.clientGeo || "").trim();
    const name = raw ? raw.split(/\s+/).slice(0, 1).join(" ") : "未知";
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return topRows(counts, 6);
});

const clientRows = computed(() => {
  const counts = new Map<string, number>();
  for (const row of rows.value) {
    counts.set(parseOs(row.userAgent || ""), (counts.get(parseOs(row.userAgent || "")) || 0) + 1);
  }
  const browserCounts = new Map<string, number>();
  for (const row of rows.value) {
    browserCounts.set(parseBrowser(row.userAgent || ""), (browserCounts.get(parseBrowser(row.userAgent || "")) || 0) + 1);
  }
  return [...topRows(counts, 5), ...topRows(browserCounts, 5)].slice(0, 10);
});

const statusRows = computed(() => topRows(statusCounts.value, 8));

const refererDomainRows = computed(() => {
  const counts = new Map<string, number>();
  for (const row of rows.value) {
    const referer = (row.referer || "").trim();
    if (!referer) continue;
    const name = parseDomain(referer);
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return topRows(counts, 5);
});

const refererPageRows = computed(() => {
  const counts = new Map<string, number>();
  for (const row of rows.value) {
    const referer = (row.referer || "").trim();
    if (!referer) continue;
    counts.set(referer, (counts.get(referer) || 0) + 1);
  }
  return topRows(counts, 5);
});

const hostRows = computed(() => {
  const counts = new Map<string, number>();
  for (const row of rows.value) {
    const host = buildHost(row);
    counts.set(host, (counts.get(host) || 0) + 1);
  }
  return topRows(counts, 5);
});

const pathRows = computed(() => {
  const counts = new Map<string, number>();
  for (const row of rows.value) {
    const value = buildUrl(row);
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return topRows(counts, 5);
});

const clientDonut = computed(() =>
  buildDonut(clientRows.value.slice(0, 6), ["#ff8c5a", "#f3c890", "#f26d8f", "#63a4ff", "#f8e0c8", "#6bd0ff"]),
);
const statusDonut = computed(() =>
  buildDonut(statusRows.value.slice(0, 6), ["#f8d5b7", "#ffb15c", "#f8708e", "#63a4ff", "#ff8c5a", "#ffd9b5"]),
);

const loadMetrics = async () => {
  if (!props.serverId) {
    metrics.value = null;
    return;
  }
  try {
    const response = await getFirewallMetrics({ serverId: props.serverId });
    metrics.value = response?.data || null;
  } catch (error) {
    console.error("加载防火墙指标失败:", error);
    metrics.value = null;
  }
};

watch(
  () => props.serverId,
  () => {
    void loadMetrics();
  },
  { immediate: true },
);

onMounted(() => {
  void loadMetrics();
});
</script>

<style scoped lang="scss">
.fo {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  color: #1f466d;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f8ff 100%);
  overflow: auto;
}

.fo__summary-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 14px;
}

.fo__summary-card {
  min-height: 104px;
  padding: 18px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(25, 64, 108, 0.08);
}

.fo__summary-card--qps {
  grid-column: span 2;
}

.fo__summary-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #7388a1;
  font-size: 14px;
}

.fo__summary-tag,
.fo__summary-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(90, 130, 192, 0.12);
  color: #4f78b6;
  font-size: 12px;
}

.fo__summary-value {
  margin-top: 12px;
  font-size: 20px;
  font-weight: 800;
  color: #1f466d;
}

.fo__summary-hint {
  margin-top: 8px;
  color: #e86f57;
  font-size: 13px;
  font-weight: 700;
}

.fo__sparkline,
.fo__line-chart {
  width: 100%;
  height: 110px;
  margin-top: 8px;
}

.fo__sparkline-grid,
.fo__line-chart-grid {
  fill: none;
  stroke: rgba(90, 130, 192, 0.12);
  stroke-width: 1;
}

.fo__sparkline-line,
.fo__line-chart-line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.fo__sparkline-line {
  stroke: #e5a366;
}

.fo__line-chart-line--visit {
  stroke: #7ec0ff;
}

.fo__line-chart-line--block {
  stroke: #ff9860;
}

.fo__hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.4fr);
  gap: 16px;
}

.fo__trend-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fo__panel {
  padding: 18px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(25, 64, 108, 0.08);
}

.fo__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.fo__panel-head h3 {
  margin: 0;
  color: #1f466d;
  font-size: 16px;
}

.fo__panel-stat {
  color: #4f78b6;
  font-weight: 700;
}

.fo__segmented {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
}

.fo__segmented button {
  padding: 6px 12px;
  border: 1px solid rgba(127, 158, 193, 0.24);
  border-radius: 8px;
  background: transparent;
  color: #7a90aa;
  cursor: pointer;
}

.fo__segmented button.is-active {
  background: rgba(90, 130, 192, 0.12);
  color: #1457a8;
  border-color: rgba(90, 130, 192, 0.38);
}

.fo__geo-stage {
  display: grid;
  grid-template-columns: minmax(360px, 1fr) minmax(260px, 320px);
  gap: 24px;
  align-items: center;
  min-height: 430px;
}

.fo__orb {
  position: relative;
  width: min(420px, 100%);
  aspect-ratio: 1;
  margin: 0 auto;
}

.fo__orb-core,
.fo__orb-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.fo__orb-core {
  background:
    radial-gradient(circle at 55% 42%, rgba(255, 255, 255, 0.94) 0%, rgba(246, 249, 255, 0.8) 20%, rgba(103, 157, 228, 0.42) 32%, rgba(70, 118, 188, 0.68) 44%, rgba(220, 230, 245, 0.94) 72%, rgba(193, 208, 232, 0.98) 100%);
  box-shadow:
    0 0 0 36px rgba(90, 130, 192, 0.06),
    0 0 48px rgba(90, 130, 192, 0.16),
    inset -36px -36px 72px rgba(44, 74, 122, 0.14);
}

.fo__orb-ring--outer {
  inset: -26px;
  border: 12px solid rgba(90, 130, 192, 0.08);
}

.fo__orb-ring--inner {
  inset: 22px;
  border: 1px solid rgba(90, 130, 192, 0.12);
}

.fo__geo-bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 10px;
  background: #f7fbff;
}

.fo__geo-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px 16px;
  align-items: center;
}

.fo__geo-name,
.fo__geo-count {
  color: #1f466d;
  font-weight: 700;
}

.fo__geo-track {
  grid-column: 1 / 3;
  height: 4px;
  border-radius: 999px;
  background: rgba(90, 130, 192, 0.1);
  overflow: hidden;
}

.fo__geo-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #8cb6f3, #4f78b6);
}

.fo__detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.fo__donut-wrap {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 18px;
  align-items: center;
}

.fo__donut {
  width: 140px;
  height: 140px;
  margin: 0 auto;
  border-radius: 50%;
  background: var(--donut);
  position: relative;
}

.fo__donut::after {
  content: "";
  position: absolute;
  inset: 26px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(127, 158, 193, 0.08);
}

.fo__legend-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
}

.fo__legend-item {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #24496f;
}

.fo__legend-name {
  color: #7287a1;
}

.fo__legend-value {
  font-weight: 700;
}

.fo__rank-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.fo__rank-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px 14px;
  align-items: center;
}

.fo__rank-label {
  color: #5f7894;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fo__rank-track {
  grid-column: 1 / 3;
  height: 6px;
  border-radius: 999px;
  background: rgba(90, 130, 192, 0.1);
  overflow: hidden;
}

.fo__rank-fill {
  height: 100%;
  border-radius: 999px;
}

.fo__rank-fill--blue {
  background: linear-gradient(90deg, #8cb6f3, #4f78b6);
}

.fo__rank-fill--pink {
  background: linear-gradient(90deg, #ff8ca0, #e86f57);
}

.fo__rank-value {
  color: #1f466d;
  font-weight: 700;
}

.fo__link {
  border: 0;
  padding: 0;
  background: transparent;
  color: #4f78b6;
  cursor: pointer;
  font-weight: 700;
}

@media (max-width: 1440px) {
  .fo__summary-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .fo__summary-card--qps {
    grid-column: span 2;
  }

  .fo__hero-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 1100px) {
  .fo__detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .fo__donut-wrap {
    grid-template-columns: minmax(0, 1fr);
  }

  .fo__geo-stage {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .fo {
    padding: 14px;
  }

  .fo__summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fo__summary-card--qps {
    grid-column: span 2;
  }

  .fo__legend-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
