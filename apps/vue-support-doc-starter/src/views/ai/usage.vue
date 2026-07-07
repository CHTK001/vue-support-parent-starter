<template>
  <div class="usage-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h2>{{ t("menu.aiUsage") }}</h2>
        <span class="header-sub">{{ usageRecords.length }} 条记录</span>
      </div>
      <div class="header-actions">
        <el-date-picker v-model="dateRange" type="daterange" range-separator="~"
          :start-placeholder="t('common.startDate')" :end-placeholder="t('common.endDate')"
          size="small" style="width: 220px" @change="refreshData" />
        <!-- 趋势按钮 -->
        <el-popover placement="bottom-end" :width="600" trigger="click" popper-class="chart-popover">
          <template #reference>
            <el-button size="small" circle>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l4-4 4 4 7-7"/><path d="M18 10h3v3"/></svg>
            </el-button>
          </template>
          <div style="height:260px">
            <v-chart :option="chartOption" style="height:100%" autoresize />
          </div>
        </el-popover>
        <!-- 排行按钮 -->
        <el-popover placement="bottom-end" :width="620" trigger="click" popper-class="rank-popover">
          <template #reference>
            <el-button size="small" circle>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 20V10M12 20V4M18 20v-6"/></svg>
            </el-button>
          </template>
          <div class="rank-popover-inner">
            <div class="rank-popover-header">
              <strong>模型排行</strong>
              <el-radio-group v-model="modelSortBy" size="small">
                <el-radio-button value="tokens">Tokens</el-radio-button>
                <el-radio-button value="requests">请求</el-radio-button>
                <el-radio-button value="cost">成本</el-radio-button>
              </el-radio-group>
            </div>
            <el-table :data="modelSummary" stripe size="small" style="width:100%" max-height="360px">
              <el-table-column type="index" label="#" width="45" />
              <el-table-column label="模型" width="120">
                <template #default="{ row }">
                  <div class="model-cell"><span class="model-name">{{ row.model }}</span></div>
                </template>
              </el-table-column>
              <el-table-column label="请求" width="65" align="right" sortable prop="requests" />
              <el-table-column label="Tokens" width="100" align="right" sortable prop="tokens">
                <template #default="{ row }">{{ fmtTokens(row.tokens) }}</template>
              </el-table-column>
              <el-table-column label="成本" width="85" align="right" sortable prop="cost">
                <template #default="{ row }">${{ row.cost.toFixed(2) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </el-popover>
        <el-button size="small" type="primary" @click="syncUsage" :loading="syncing">同步</el-button>
        <el-button size="small" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-row">
      <div class="stat-card">
        <div class="stat-icon tokens-icon">T</div>
        <div class="stat-body">
          <div class="stat-value">{{ fmtTokens(totalTokens) }}</div>
          <div class="stat-label">总 Tokens</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon cost-icon">$</div>
        <div class="stat-body">
          <div class="stat-value">${{ totalCost }}</div>
          <div class="stat-label">总成本</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon req-icon">#</div>
        <div class="stat-body">
          <div class="stat-value">{{ totalRequests.toLocaleString() }}</div>
          <div class="stat-label">总请求数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon src-icon">S</div>
        <div class="stat-body">
          <div class="stat-value">{{ activeSources }}</div>
          <div class="stat-label">数据来源</div>
        </div>
      </div>
    </div>

    <!-- Detail table (main area) -->
    <div class="table-wrap" v-loading="loading">
      <el-table :data="pagedRows" stripe size="small" style="width:100%" height="calc(100vh - 260px)"
        :default-sort="{ prop: 'timestamp', order: 'descending' }">
        <el-table-column prop="timestamp" label="时间" width="150" sortable>
          <template #default="{ row }">
            <span class="usage-time">{{ formatTime(row.timestamp) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="模型" min-width="auto" width="auto">
          <template #default="{ row }">
            <span class="model-name">{{ extractModel(row.model) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="供应商" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="sourceTag(row.source)">{{ row.source }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="输入" width="85" align="right" sortable prop="promptTokens">
          <template #default="{ row }">
            <el-popover placement="top" :width="220" trigger="hover">
              <template #reference><span class="token-link">{{ fmtTokens(row.promptTokens) }}</span></template>
              <div class="pop-detail">
                <div class="pop-row"><span>输入</span><strong>{{ (row.promptTokens||0).toLocaleString() }}</strong></div>
                <div class="pop-row"><span>推理</span><strong>{{ (row.reasoningTokens||0).toLocaleString() }}</strong></div>
                <div class="pop-row"><span>缓存读取</span><strong>{{ (row.cacheReadTokens||0).toLocaleString() }}</strong></div>
                <div class="pop-row"><span>缓存写入</span><strong>{{ (row.cacheWriteTokens||0).toLocaleString() }}</strong></div>
              </div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="输出" width="85" align="right" sortable prop="completionTokens">
          <template #default="{ row }">{{ fmtTokens(row.completionTokens) }}</template>
        </el-table-column>
        <el-table-column label="总计" width="85" align="right" sortable prop="totalTokens">
          <template #default="{ row }"><strong class="total-tokens">{{ fmtTokens(row.totalTokens) }}</strong></template>
        </el-table-column>
        <el-table-column label="耗时" width="80" align="right" sortable prop="latencyMs">
          <template #default="{ row }">
            <span class="latency-cell">{{ fmtLatency(row.latencyMs || 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="成本" width="95" align="right" sortable prop="cost">
          <template #default="{ row }">
            <el-popover placement="top" :width="240" trigger="hover">
              <template #reference>
                <span :class="['cost-cell', row.costType === 'calculated' ? 'cost-calc' : '']">${{ Number(row.cost).toFixed(6) }}</span>
              </template>
              <div class="pop-detail">
                <div class="pop-row"><span>计费方式</span>
                  <el-tag size="small" :type="row.costType==='calculated'?'warning':'success'">
                    {{ row.costType === 'calculated' ? '标准价估算' : '实际成本' }}
                  </el-tag>
                </div>
                <div class="pop-row"><span>输入成本</span><strong>${{ ((row.promptTokens||0)/1e6*0.14).toFixed(4) }}</strong></div>
                <div class="pop-row"><span>输出成本</span><strong>${{ ((row.completionTokens||0)/1e6*1.1).toFixed(4) }}</strong></div>
                <div class="pop-row"><span>缓存成本</span><strong>${{ (((row.cacheReadTokens||0)+(row.cacheWriteTokens||0))/1e6*0.014).toFixed(4) }}</strong></div>
              </div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="65" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'success' ? 'success' : 'danger'" effect="plain">{{ row.status || '—' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap" v-if="usageRecords.length > pageSize">
        <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="usageRecords.length" layout="total, prev, pager, next" small />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { use } from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import VChart from "vue-echarts";
import { CanvasRenderer } from "echarts/renderers";
import { Refresh } from "@element-plus/icons-vue";
import { listUsageDaily, listUsageRecords } from "@/services";
import { ElMessage } from "element-plus";

use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const { t } = useI18n();

const loading = ref(false);
const syncing = ref(false);
const dateRange = ref<[Date, Date]>([new Date(Date.now() - 30*86400000), new Date()]);
const currentPage = ref(1);
const pageSize = ref(30);
const modelSortBy = ref("tokens");

interface DailyRow { date: string; model: string; source: string; provider: string; requestCount: number; promptTokens: number; completionTokens: number; reasoningTokens: number; cacheReadTokens: number; cacheWriteTokens: number; totalTokens: number; cost: number; costType: string; }
interface DetailRow { id: string; timestamp: string; model: string; providerId: string; providerName: string; promptTokens: number; completionTokens: number; reasoningTokens: number; cacheReadTokens: number; cacheWriteTokens: number; totalTokens: number; cost: number; cacheCost: number; latencyMs: number; status: string; source: string; costType: string; }

const dailyRows = ref<DailyRow[]>([]);
const usageRecords = ref<DetailRow[]>([]);

const totalTokens = computed(() => usageRecords.value.reduce((s, r) => s + r.totalTokens, 0));
const totalCost = computed(() => usageRecords.value.reduce((s, r) => s + r.cost, 0).toFixed(2));
const totalRequests = computed(() => usageRecords.value.length);
const activeSources = computed(() => new Set(usageRecords.value.map(r => r.source)).size);

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return usageRecords.value.slice(start, start + pageSize.value);
});

const modelSummary = computed(() => {
  const map = new Map<string, { model: string; requests: number; tokens: number; cost: number }>();
  for (const r of dailyRows.value) {
    const m = extractModel(r.model);
    const ex = map.get(m) || { model: m, requests: 0, tokens: 0, cost: 0 };
    ex.requests += r.requestCount; ex.tokens += r.totalTokens; ex.cost += r.cost;
    map.set(m, ex);
  }
  const arr = Array.from(map.values());
  const key = modelSortBy.value;
  arr.sort((a, b) => (b as any)[key] - (a as any)[key]);
  return arr.slice(0, 30);
});

const chartOption = computed(() => {
  const sorted = [...dailyRows.value].sort((a, b) => a.date.localeCompare(b.date));
  const days = new Map<string, { tokens: number; cost: number }>();
  for (const r of sorted) { const d = r.date; const ex = days.get(d) || { tokens: 0, cost: 0 }; ex.tokens += r.totalTokens; ex.cost += r.cost; days.set(d, ex); }
  const dates = Array.from(days.keys());
  return {
    tooltip: { trigger: "axis" },
    grid: { left: 50, right: 20, bottom: 25, top: 10 },
    xAxis: { type: "category", data: dates, axisLabel: { fontSize: 10 } },
    yAxis: [
      { type: "value", name: "Tokens (M)", nameTextStyle: { fontSize: 10 } },
      { type: "value", name: "成本 ($)", nameTextStyle: { fontSize: 10 } },
    ],
    series: [
      { name: "Tokens (M)", type: "bar", data: dates.map(d => Math.round((days.get(d)?.tokens||0)/1e6)), itemStyle: { color: "#667eea" }, barMaxWidth: 24 },
      { name: "成本 ($)", type: "line", yAxisIndex: 1, data: dates.map(d => Math.round((days.get(d)?.cost||0)*100)/100), lineStyle: { color: "#f5576c", width: 2 }, itemStyle: { color: "#f5576c" }, smooth: true },
    ],
  };
});

function fmtTokens(n: number): string {
  if (!n) return "0";
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toLocaleString();
}

function fmtLatency(ms: number): string {
  if (!ms) return "—";
  if (ms >= 60000) return (ms / 60000).toFixed(1) + "m";
  if (ms >= 1000) return (ms / 1000).toFixed(1) + "s";
  return ms + "ms";
}

function extractModel(raw: string): string {
  if (!raw) return "unknown";
  if (raw.startsWith("{")) { try { return JSON.parse(raw).id || raw; } catch { return raw; } }
  return raw;
}

function sourceTag(s: string): "success" | "warning" | "info" | "" {
  return ({ ccswitch: "success", opencode: "", zcode: "warning" } as any)[s] || "";
}

function formatTime(ts: string): string {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function refreshData() {
  loading.value = true;
  try {
    const [start, end] = dateRange.value;
    const sd = start.toISOString().split("T")[0] + "T00:00:00.000Z";
    const ed = end.toISOString().split("T")[0] + "T23:59:59.999Z";
    const [daily, detail] = await Promise.all([listUsageDaily(sd, ed), listUsageRecords(sd, ed)]);
    dailyRows.value = daily; usageRecords.value = detail; currentPage.value = 1;
  } catch { dailyRows.value = []; usageRecords.value = []; }
  finally { loading.value = false; }
}

async function syncUsage() {
  syncing.value = true;
  try {
    const res = await fetch("/api/usage/sync", { method: "POST" });
    const data = await res.json();
    ElMessage.success(`同步完成，导入 ${data.imported} 条`);
    refreshData();
  } catch { ElMessage.error("同步失败"); }
  finally { syncing.value = false; }
}

onMounted(() => refreshData());
</script>

<style scoped>
.usage-page { padding: 0; height: 100%; display: flex; flex-direction: column; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-shrink: 0; }
.header-left { display: flex; align-items: baseline; gap: 12px; }
.header-left h2 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
.header-sub { font-size: 11px; color: var(--el-text-color-secondary); font-weight: 450; }
.header-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

/* ── Summary Row: Nexus metric blocks ── */
.summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; flex-shrink: 0; }
.stat-card {
  position: relative; display: flex; align-items: center; gap: 14px;
  padding: 16px 16px 16px 20px;
  background: var(--el-bg-color); border-radius: var(--card-radius);
  border: 1px solid var(--el-border-color); overflow: hidden;
  transition: box-shadow 0.2s, transform 0.15s;
}
.stat-card:hover { box-shadow: var(--shadow-sm); transform: translateY(-1px); }
.stat-card::before {
  content: ""; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; border-radius: 0 3px 3px 0;
}
.stat-card:nth-child(1)::before { background: var(--nexus-stripe-violet); }
.stat-card:nth-child(2)::before { background: var(--nexus-stripe-rose); }
.stat-card:nth-child(3)::before { background: var(--nexus-stripe-teal); }
.stat-card:nth-child(4)::before { background: var(--nexus-stripe-emerald); }

.stat-icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700; flex-shrink: 0;
}
.tokens-icon { background: rgba(124,58,237,0.08); color: #7c3aed; }
.cost-icon { background: rgba(225,29,72,0.08); color: #e11d48; }
.req-icon { background: rgba(13,148,136,0.08); color: #0d9488; }
.src-icon { background: rgba(16,185,129,0.08); color: #10b981; }

.stat-value { font-size: 20px; font-weight: 800; line-height: 1.2; font-family: var(--nexus-data-font); letter-spacing: -0.02em; }
.stat-label { font-size: 11px; color: var(--el-text-color-secondary); margin-top: 3px; font-weight: 450; text-transform: uppercase; letter-spacing: 0.04em; }

/* ── Table ── */
.table-wrap {
  flex: 1; background: var(--el-bg-color); border-radius: var(--card-radius);
  border: 1px solid var(--el-border-color); padding: 0; overflow: hidden;
  display: flex; flex-direction: column;
}
.model-cell { display: flex; flex-direction: column; }
.model-name { font-size: 13px; font-weight: 500; }
.total-tokens { color: var(--el-color-primary); font-family: var(--nexus-data-font); }
.token-link { cursor: pointer; color: var(--el-color-primary); font-size: 12px; }
.cost-cell { font-family: var(--nexus-data-font); font-size: 12px; }
.cost-calc { color: var(--el-color-warning); }
.latency-cell { font-family: var(--nexus-data-font); font-size: 12px; color: var(--el-text-color-secondary); }
.usage-time { font-size: 12px; font-family: var(--nexus-data-font); color: var(--el-text-color-secondary); }
.pagination-wrap { display: flex; justify-content: flex-end; padding: 8px 12px; flex-shrink: 0; }

/* ── Popover inner ── */
.rank-popover-inner { }
.rank-popover-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.rank-popover-header strong { font-size: 14px; }
.pop-detail { display: flex; flex-direction: column; gap: 6px; }
.pop-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
.pop-row span { color: var(--el-text-color-secondary); }
</style>
