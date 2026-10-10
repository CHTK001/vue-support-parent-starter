<template>
  <div class="usage-page">
    <div class="page-hero">
      <div class="hero-text">
        <h2 class="page-title">用量管理</h2>
        <p class="page-subtitle">
          <span class="sub-dot"></span>{{ rangeLabel }}
        </p>
      </div>
      <div class="quick-filters">
        <div class="seg-pills" role="tablist">
          <button v-for="f in quickFilters" :key="f.key" type="button" class="pill"
            role="tab" :class="{ active: activeFilter === f.key }"
            :aria-selected="activeFilter === f.key" @click="setQuickFilter(f.key)">{{ f.label }}</button>
        </div>
        <el-date-picker
          v-model="customRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="hero-date"
          value-format="YYYY-MM-DD"
          @change="onCustomRange"
        />
      </div>
    </div>

    <!-- 顶部 KPI 卡片 -->
    <div class="stats-grid">
      <div v-for="s in statCards" :key="s.label" class="kpi-card" :class="`tone-${s.tone}`">
        <div class="kpi-top">
          <span class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="s.icon" /></svg>
          </span>
          <span class="kpi-label">{{ s.label }}</span>
        </div>
        <div class="kpi-value" :class="s.cls">{{ s.value }}<span v-if="s.unit" class="unit">{{ s.unit }}</span></div>
        <div class="kpi-sub"><span v-for="(sub, i) in s.sub" :key="i">{{ sub }}</span></div>
      </div>
    </div>

    <!-- 模型 / 分组 分布 -->
    <div class="dist-grid">
      <ReCard title="模型分布">
        <template #extra>
          <div class="seg-toggle">
            <button class="seg-btn" :class="{ active: modelChartType === 'token' }" @click="modelChartType = 'token'">按 Token</button>
            <button class="seg-btn" :class="{ active: modelChartType === 'cost' }" @click="modelChartType = 'cost'">按费用</button>
          </div>
        </template>
        <ReEcharts :option="modelPieOption" height="260px" not-merge />
        <ReTable :data="modelPaged" :show-index="false" :stripe="false" class="dist-table" :row-style="distRowStyle(modelDist, modelChartType)">
          <el-table-column prop="name" label="模型" show-overflow-tooltip>
            <template #default="{ row }"><span class="model-name">{{ row.name }}</span></template>
          </el-table-column>
          <el-table-column label="请求" align="right" width="90">
            <template #default="{ row }">{{ formatNumber(row.requests) }}</template>
          </el-table-column>
          <el-table-column label="Token" align="right" width="110">
            <template #default="{ row }">{{ fmtToken(row.totalTokens) }}</template>
          </el-table-column>
          <el-table-column :label="`费用(${currencySymbol})`" align="right" width="100">
            <template #default="{ row }">{{ money(row.cost) }}</template>
          </el-table-column>
          <el-table-column label="占比" align="right" width="90">
            <template #default="{ row }">{{ percent(row, modelDist, modelChartType) }}</template>
          </el-table-column>
        </ReTable>
        <div class="pager-row" v-if="modelDist.length > distPageSize">
          <el-pagination background small layout="prev, pager, next" :total="modelDist.length" :page-size="distPageSize" v-model:current-page="modelPage" />
        </div>
      </ReCard>

      <ReCard title="分组分布">
        <template #extra>
          <div class="seg-toggle">
            <button class="seg-btn" :class="{ active: groupChartType === 'token' }" @click="groupChartType = 'token'">按 Token</button>
            <button class="seg-btn" :class="{ active: groupChartType === 'cost' }" @click="groupChartType = 'cost'">按费用</button>
          </div>
        </template>
        <ReEcharts :option="groupPieOption" height="260px" not-merge />
        <ReTable :data="groupPaged" :show-index="false" :stripe="false" class="dist-table" :row-style="distRowStyle(groupDist, groupChartType)">
          <el-table-column prop="name" label="分组" show-overflow-tooltip>
            <template #default="{ row }"><span class="model-name">{{ row.name }}</span></template>
          </el-table-column>
          <el-table-column label="请求" align="right" width="90">
            <template #default="{ row }">{{ formatNumber(row.requests) }}</template>
          </el-table-column>
          <el-table-column label="Token" align="right" width="110">
            <template #default="{ row }">{{ fmtToken(row.totalTokens) }}</template>
          </el-table-column>
          <el-table-column :label="`费用(${currencySymbol})`" align="right" width="100">
            <template #default="{ row }">{{ money(row.cost) }}</template>
          </el-table-column>
          <el-table-column label="占比" align="right" width="90">
            <template #default="{ row }">{{ percent(row, groupDist, groupChartType) }}</template>
          </el-table-column>
        </ReTable>
        <div class="pager-row" v-if="groupDist.length > distPageSize">
          <el-pagination background small layout="prev, pager, next" :total="groupDist.length" :page-size="distPageSize" v-model:current-page="groupPage" />
        </div>
      </ReCard>
    </div>

    <!-- Token 趋势 -->
    <ReCard title="Token 趋势">
      <ReEcharts :option="trendOption" height="320px" not-merge v-if="trendData.length > 0" />
      <div v-else class="chart-empty">暂无趋势数据</div>
    </ReCard>

    <!-- 用量明细 -->
    <ReCard title="用量明细">
      <template #extra>
        <el-input v-model="detailModelFilter" placeholder="按模型筛选" clearable class="filter-input" @keyup.enter="reloadDetails" @clear="reloadDetails" />
      </template>
      <ReTable :data="detailRecords" :loading="detailLoading" :show-index="false" class="detail-table" row-key="sysAiUsageId">
        <el-table-column label="时间" width="160">
          <template #default="{ row }"><span class="time-cell">{{ formatTime(row.sysAiUsageCallTime) }}</span></template>
        </el-table-column>
        <el-table-column label="模型" show-overflow-tooltip>
          <template #default="{ row }">{{ row.sysAiUsageModel || '-' }}</template>
        </el-table-column>
        <el-table-column label="分组" width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.sysAiUsageGroupName }}</template>
        </el-table-column>
        <el-table-column label="账号" width="90">
          <template #default="{ row }">
            <ReTag :type="row.sysAiUsageUserId ? 'primary' : 'info'" >{{ row.sysAiUsageUserId || '三方' }}</ReTag>
          </template>
        </el-table-column>
        <el-table-column label="服务商" width="100">
          <template #default="{ row }">{{ row.sysAiUsageProvider || '-' }}</template>
        </el-table-column>
        <el-table-column label="Token" align="right" width="170">
          <template #default="{ row }">
            <el-popover trigger="hover" placement="top" :show-arrow="true" :width="200">
              <template #reference>
                <div class="token-cell" :class="{ 'token-estimated': row.sysAiUsageEstimatedTokens === 1 }">
                  <span class="token-inline">
                    <span class="tk tk-in">
                      <svg class="tk-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8.2M4.6 7.3 8 10.8l3.4-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ fmtToken(row.sysAiUsagePromptTokens) }}
                    </span>
                    <span class="tk tk-out">
                      <svg class="tk-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.5V5.3M4.6 8.7 8 5.2l3.4 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ fmtToken(row.sysAiUsageCompletionTokens) }}
                    </span>
                  </span>
                </div>
              </template>
              <div class="token-detail-pop">
                <div class="token-detail-title">Token 明细</div>
                <div class="token-detail-row"><span class="td-label">输入 Token</span><span class="td-val tk-in">{{ formatNumber(row.sysAiUsagePromptTokens) }}</span></div>
                <div class="token-detail-row"><span class="td-label">输出 Token</span><span class="td-val tk-out">{{ formatNumber(row.sysAiUsageCompletionTokens) }}</span></div>
                <div class="token-detail-row"><span class="td-label">缓存读取 Token</span><span class="td-val tk-cache">{{ formatNumber(row.sysAiUsageCachedTokens) }}</span></div>
                <div class="token-detail-divider"></div>
                <div class="token-detail-row td-total"><span class="td-label">总 Token</span><span class="td-val">{{ formatNumber(row.sysAiUsageTotalTokens) }}</span></div>
                <div v-if="row.sysAiUsageEstimatedTokens === 1" class="td-est-note">Token 为估算值（Qoder 按积分计费，未上报真实 token）</div>
              </div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column :label="`费用(${currencySymbol})`" align="right" width="90">
          <template #default="{ row }">{{ money(row.sysAiUsageTotalCost) }}</template>
        </el-table-column>
        <el-table-column label="耗时(ms)" width="90">
          <template #default="{ row }">
            <el-popover trigger="hover" placement="top" :show-arrow="true" :width="220">
              <template #reference>
                <div class="latency-indicator">
                  <div class="latency-track">
                    <div class="latency-seg-first" :style="{ height: getFirstSegHeight(row) + '%', backgroundColor: getFirstColor(row) }"></div>
                    <div class="latency-seg-rest" :style="{ height: getRestSegHeight(row) + '%', backgroundColor: getTotalColor(row) }"></div>
                  </div>
                  <div class="latency-times">
                    <span class="latency-time-first" :style="{ color: getFirstColor(row) }">{{ formatLatency(row.sysAiUsageFirstTokenLatency) }}</span>
                    <span class="latency-time-total" :style="{ color: getTotalColor(row) }">{{ formatLatency(row.sysAiUsageTotalLatency) }}</span>
                  </div>
                </div>
              </template>
              <div class="latency-popover-content">
                <div class="latency-popover-row">
                  <span class="latency-popover-dot" :style="{ background: getFirstColor(row) }"></span>
                  <span class="latency-popover-label">首字</span>
                  <span class="latency-popover-value" :style="{ color: getFirstColor(row) }">{{ formatLatency(row.sysAiUsageFirstTokenLatency) }}</span>
                </div>
                <div class="latency-popover-row">
                  <span class="latency-popover-dot" :style="{ background: getTotalColor(row) }"></span>
                  <span class="latency-popover-label">总耗时</span>
                  <span class="latency-popover-value" :style="{ color: getTotalColor(row) }">{{ formatLatency(row.sysAiUsageTotalLatency) }}</span>
                </div>
                <div class="latency-popover-hint">绿/橙/红=快/中/慢</div>
              </div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="130">
          <template #default="{ row }">
            <ReTag :type="typeTagType(row.sysAiUsageType)" >{{ formatTypeLabel(row.sysAiUsageType) }}</ReTag>
          </template>
        </el-table-column>
      </ReTable>
      <div class="pager-row">
        <el-pagination background layout="total, prev, pager, next, jumper" :total="detailTotal" :page-size="detailPageSize" v-model:current-page="detailPage" @current-change="reloadDetails" />
      </div>
    </ReCard>
  </div>
</template>
<script setup lang="ts">
import { message } from "@repo/core";
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';

import ReEcharts from '@repo/ui/re-echarts';
import type { EChartsOption } from 'echarts';
import ReCard from '@/components/re/ReCard.vue';
import ReTable from '@/components/re/ReTable.vue';
import ReTag from '@/components/re/ReTag.vue';
import ReButton from '@/components/re/ReButton.vue';
import { usageApi } from '@/services/javaApi';

type ChartType = 'token' | 'cost';
interface DistRow {
  name: string;
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

const distPageSize = 8;

const stats = reactive({
  totalCalls: 0,
  totalPromptTokens: 0,
  totalCompletionTokens: 0,
  totalTokens: 0,
  totalCost: 0,
  totalCachedTokens: 0,
  standardCost: 0,
  avgLatency: 0,
  avgFirstTokenLatency: 0,
});

const statCards = computed(() => [
  { label: '总请求数', value: formatNumber(stats.totalCalls), unit: '', cls: '', tone: 'primary',
    icon: 'M2 12h3.2l2.4 7.5 4.2-15 3.3 9.2H14M15 12h7',
    sub: ['缓存 ' + fmtToken(stats.totalCachedTokens) + ' tokens'] },
  { label: '总 Token', value: fmtToken(stats.totalTokens), unit: '', cls: '', tone: 'info',
    icon: 'M12 2.8 19 6.4v6.2c0 4.3-2.9 6.7-7 8.6-4.1-1.9-7-4.3-7-8.6V6.4L12 2.8Z M9.2 11.6l2 2 3.8-4',
    sub: ['输入 ' + fmtToken(stats.totalPromptTokens), '输出 ' + fmtToken(stats.totalCompletionTokens)] },
  { label: '总消费', value: currencySymbol.value + money(stats.totalCost), unit: '', cls: 'cost', tone: 'success',
    icon: 'M3 7.5A2.5 2.5 0 0 1 5.5 5H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 14.5v-7ZM3 9.5h18M15 12h3.2',
    sub: ['标准价 ' + currencySymbol.value + money(stats.standardCost)] },
  { label: '平均耗时', value: money(stats.avgLatency), unit: 'ms', cls: '', tone: 'warning',
    icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7.5V12l3 2',
    sub: ['首字 ' + money(stats.avgFirstTokenLatency) + 'ms'] },
]);

// 当前时间范围的人类可读描述（头部副标题）
const rangeLabel = computed(() => {
  const map: Record<string, string> = { today: '今天', '7d': '近 7 天', '30d': '近 30 天', all: '全部时间', custom: '自定义区间' };
  const base = map[activeFilter.value] || '自定义区间';
  const { startTime, endTime } = timeParams.value;
  if (activeFilter.value === 'today' && startTime) return `${base} · ${startTime.slice(0, 10)}`;
  if (startTime && endTime) return `${base} · ${startTime.slice(0, 10)} 至 ${endTime.slice(0, 10)}`;
  return base;
});

const summaryRows = ref<any[]>([]);
const trendData = ref<Array<{ date: string; input: number; output: number; total: number }>>([]);

const modelChartType = ref<ChartType>('token');
const groupChartType = ref<ChartType>('token');
const modelPage = ref(1);
const groupPage = ref(1);

// 明细
const detailRecords = ref<any[]>([]);
const detailLoading = ref(false);
const detailTotal = ref(0);
const detailPage = ref(1);
const detailPageSize = 20;
const detailModelFilter = ref('');
const detailUserFilter = ref('');

// 时间筛选
const activeFilter = ref('today');
const customRange = ref<[string, string] | null>(null);
const timeParams = ref<{ startTime?: string; endTime?: string }>({});

const quickFilters = [
  { key: 'today', label: '今天' },
  { key: '7d', label: '近7天' },
  { key: '30d', label: '近30天' },
  { key: 'all', label: '全部' },
];

function fmtDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function setQuickFilter(key: string) {
  activeFilter.value = key;
  customRange.value = null;
  const now = new Date();
  if (key === 'all') {
    timeParams.value = {};
  } else if (key === 'today') {
    const d = fmtDate(now);
    timeParams.value = { startTime: `${d} 00:00:00`, endTime: `${d} 23:59:59` };
  } else {
    const days = key === '7d' ? 7 : 30;
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    timeParams.value = {
      startTime: `${fmtDate(start)} 00:00:00`,
      endTime: `${fmtDate(now)} 23:59:59`,
    };
  }
  refreshAll();
}

function onCustomRange(val: [string, string] | null) {
  if (!val || !val[0] || !val[1]) {
    return;
  }
  activeFilter.value = 'custom';
  timeParams.value = {
    startTime: `${val[0]} 00:00:00`,
    endTime: `${val[1]} 23:59:59`,
  };
  refreshAll();
}

function refreshAll() {
  loadData();
  detailPage.value = 1;
  reloadDetails();
}

// 按 key 把后端聚合行 roll up
function rollUp(rows: any[], keyOf: (r: any) => string | null): DistRow[] {
  const map = new Map<string, DistRow>();
  for (const r of rows) {
    const k = keyOf(r);
    if (k == null) continue;
    if (!map.has(k)) {
      map.set(k, { name: k, requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 });
    }
    const a = map.get(k)!;
    a.requests += Number(r.requests) || 0;
    a.promptTokens += Number(r.promptTokens) || 0;
    a.completionTokens += Number(r.completionTokens) || 0;
    a.totalTokens += Number(r.totalTokens) || 0;
    a.cost += Number(r.cost) || 0;
  }
  return [...map.values()].sort((a, b) => b.totalTokens - a.totalTokens);
}

const modelDist = computed<DistRow[]>(() =>
  rollUp(summaryRows.value, (r) => r.model || '未知'),
);
const groupDist = computed<DistRow[]>(() =>
  rollUp(summaryRows.value, (r) => r.group || '默认'),
);

const modelPaged = computed(() =>
  modelDist.value.slice((modelPage.value - 1) * distPageSize, modelPage.value * distPageSize),
);
const groupPaged = computed(() =>
  groupDist.value.slice((groupPage.value - 1) * distPageSize, groupPage.value * distPageSize),
);

// 表面色（用于饼图切片间隔，随主题 / 深色变化）
const surfaceBg = ref('#ffffff');
function readSurfaceBg() {
  const host = document.querySelector('.usage-page') || document.documentElement;
  const v = getComputedStyle(host).getPropertyValue('--el-bg-color').trim();
  surfaceBg.value = v || '#ffffff';
}
let themeObserver: MutationObserver | null = null;
onMounted(() => {
  readSurfaceBg();
  themeObserver = new MutationObserver(readSurfaceBg);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme'],
  });
});
onBeforeUnmount(() => themeObserver?.disconnect());

function pieOption(dist: DistRow[], type: ChartType): EChartsOption {
  const sorted = [...dist].sort((a, b) =>
    type === 'token' ? b.totalTokens - a.totalTokens : b.cost - a.cost,
  );
  const top = sorted.slice(0, 9);
  const rest = sorted.slice(9);
  const data = top.map((x) => ({
    name: x.name,
    value: type === 'token' ? x.totalTokens : Number(x.cost.toFixed(4)),
  }));
  if (rest.length) {
    const rv = rest.reduce((s, x) => s + (type === 'token' ? x.totalTokens : x.cost), 0);
    if (rv > 0) data.push({ name: '其他', value: type === 'token' ? rv : Number(rv.toFixed(4)) });
  }
  return {
    tooltip: {
      trigger: 'item',
      confine: true,
      valueFormatter: (v: any) => (type === 'token' ? fmtToken(v) : `${currencySymbol.value}${money(v)}`),
    },
    legend: { type: 'scroll', orient: 'vertical', right: 0, top: 'middle', icon: 'circle' },
    series: [
      {
        type: 'pie',
        radius: ['38%', '58%'],
        center: ['32%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: surfaceBg.value, borderWidth: 2, borderRadius: 6 },
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)' } },
        data,
      },
    ],
  };
}

const modelPieOption = computed(() => pieOption(modelDist.value, modelChartType.value));
const groupPieOption = computed(() => pieOption(groupDist.value, groupChartType.value));

function percentNum(row: { totalTokens?: number; cost?: number }, all: DistRow[], type: ChartType): number {
  const total = all.reduce((s, x) => (type === 'token' ? x.totalTokens : x.cost), 0);
  if (total <= 0) return 0;
  const v = (type === 'token' ? row.totalTokens : row.cost) ?? 0;
  return (v / total) * 100;
}

/** row 来自 el-table 的默认插槽，类型被弱化；这里用结构化类型直接接收，避免断言 */
function percent(row: { totalTokens?: number; cost?: number }, all: DistRow[], type: ChartType): string {
  return percentNum(row, all, type).toFixed(1) + '%';
}

function distRowStyle(all: DistRow[], type: ChartType) {
  return ({ row }: any) => {
    const pct = Math.min(100, Math.max(0, percentNum(row, all, type)));
    return {
      background: 'linear-gradient(to right, var(--el-color-primary-light-9) ' + pct + '%, transparent ' + pct + '%)',
    };
  };
}

const trendOption = computed<EChartsOption>(() => {
  const rows = trendData.value;
  return {
    tooltip: {
      trigger: 'axis',
      confine: true,
      axisPointer: { type: 'line', lineStyle: { type: 'dashed' } },
      valueFormatter: (v: any) => fmtToken(v),
    },
    legend: { data: ['输入 Token', '输出 Token'], top: 0 },
    grid: { left: 56, right: 24, top: 40, bottom: 32 },
    xAxis: { type: 'category', boundaryGap: false, data: rows.map((r) => r.date.length > 10 ? r.date.slice(11, 16) : r.date) },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => fmtToken(v) },
    },
    series: [
      {
        name: '输入 Token',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: rows.map((r) => r.input),
        areaStyle: { opacity: 0.12 },
      },
      {
        name: '输出 Token',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: rows.map((r) => r.output),
        areaStyle: { opacity: 0.12 },
      },
    ],
  };
});

async function loadData() {
  try {
    const [statRes, sumRes, trendRes]: any[] = await Promise.all([
      usageApi.statistics(timeParams.value),
      usageApi.list(timeParams.value),
      usageApi.trend(timeParams.value),
    ]);
    Object.assign(stats, statRes.data || {});
    summaryRows.value = sumRes.data || [];
    const dailyRows: any[] = trendRes.data || [];
    const map = new Map<string, { date: string; input: number; output: number; total: number }>();
    for (const r of dailyRows) {
      const raw = String(r.date || ''); const d = raw.length > 10 && raw.includes(':') ? raw.slice(0, 13) : raw.slice(0, 10);
      if (!d) continue;
      if (!map.has(d)) map.set(d, { date: d, input: 0, output: 0, total: 0 });
      const a = map.get(d)!;
      a.input += Number(r.promptTokens) || 0;
      a.output += Number(r.completionTokens) || 0;
      a.total += Number(r.totalTokens) || 0;
    }
    trendData.value = [...map.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
    modelPage.value = 1;
    groupPage.value = 1;
  } catch (e: any) {
    message.error('加载用量数据失败: ' + (e?.message || e));
  }
}

async function reloadDetails() {
  detailLoading.value = true;
  try {
    const params: any = {
      page: detailPage.value,
      size: detailPageSize,
      ...timeParams.value,
    };
    if (detailModelFilter.value) {
      params.model = detailModelFilter.value;
    }
    const res: any = await usageApi.detailList(params);
    const payload = res.data || {};
    detailRecords.value = payload.records || [];
    detailTotal.value = payload.total || 0;
  } catch (e: any) {
    message.error('加载明细失败: ' + (e?.message || e));
  } finally {
    detailLoading.value = false;
  }
}

// ---------- 数字格式化 ----------
function money(v: number | null | undefined): string {
  return convertCost(v).toFixed(2);
}

function formatNumber(v: number | null | undefined): string {
  const n = Number(v) || 0;
  return n.toLocaleString('en-US');
}

function formatLatency(ms: number | null | undefined): string {
  if (ms == null || ms === 0) return '—';
  if (ms < 1000) return Math.round(ms) + 'ms';
  const s = ms / 1000;
  if (s < 60) return Math.round(s) + 's';
  const m = Math.floor(s / 60);
  const rs = Math.round(s % 60);
  if (m < 60) return m + 'm ' + rs + 's';
  const h = Math.floor(m / 60);
  const rm = Math.round(m % 60);
  return h + 'h ' + rm + 'm';
}

// ---------- 延迟指示器：上下两段 + 阈值变色 ----------
const FIRST_THRESHOLDS = { ok: 1500, warn: 4000 };
const TOTAL_THRESHOLDS = { ok: 8000, warn: 25000 };

function latencyColor(ms: number | null | undefined, t: { ok: number; warn: number }): string {
  if (ms == null || ms <= 0) return 'var(--el-text-color-placeholder)';
  if (ms < t.ok) return 'var(--el-color-success)';
  if (ms < t.warn) return 'var(--el-color-warning)';
  return 'var(--el-color-danger)';
}
function getFirstColor(row: any): string {
  return latencyColor(row?.sysAiUsageFirstTokenLatency, FIRST_THRESHOLDS);
}
function getTotalColor(row: any): string {
  return latencyColor(row?.sysAiUsageTotalLatency, TOTAL_THRESHOLDS);
}
function getFirstSegHeight(row: any): number {
  const total = Number(row?.sysAiUsageTotalLatency) || 0;
  const first = Number(row?.sysAiUsageFirstTokenLatency) || 0;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (Math.min(first, total) / total) * 100));
}
function getRestSegHeight(row: any): number {
  const total = Number(row?.sysAiUsageTotalLatency) || 0;
  const first = Number(row?.sysAiUsageFirstTokenLatency) || 0;
  if (total <= 0) return 0;
  const f = first > 0 ? Math.min(first, total) : 0;
  return Math.max(0, Math.min(100, ((total - f) / total) * 100));
}

// ---------- 来源类型中文标签 ----------
const TYPE_LABEL_MAP: Record<string, string> = {
  chat: '会话',
  bot: '连接器',
  optimize: '优化',
  optimization: '优化',
  external: '三方',
  third_party: '三方',
  service: '服务',
};
function formatTypeLabel(t: string | null | undefined): string {
  if (t == null || t === '') return '—';
  return TYPE_LABEL_MAP[t] || t;
}

function typeTagType(t: string | null | undefined): 'primary' | 'info' | 'warning' | 'success' {
  if (t === 'chat_stream' || t === 'chat') return 'primary';
  if (t === 'external' || t === 'third_party') return 'info';
  if (t === 'memory_extract' || t === 'summary') return 'warning';
  return 'success';
}

function formatCompact(v: number | null | undefined): string {
  const n = Number(v) || 0;
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return String(n);
}

// ---------- 单位设置（来自用量配置，保存后联动）----------
type CurrencyCode = 'CNY' | 'USD' | 'EUR';
const currency = ref<CurrencyCode>('CNY');
const currencySymbol = ref('¥');
const autoConvert = ref(true);
const rateUsd = ref(7.1);
const rateEur = ref(7.8);
const tokenScale = ref<'auto' | 'raw'>('auto');
const fmtToken = (v: number | null | undefined): string =>
  tokenScale.value === 'raw' ? formatNumber(v) : formatCompact(v);

// 费用以人民币（元 CNY）入库；按当前货币与汇率换算显示
function convertCost(v: number | null | undefined): number {
  const n = Number(v) || 0;
  if (!autoConvert.value || currency.value === 'CNY') return n;
  if (currency.value === 'USD') return n / rateUsd.value;
  if (currency.value === 'EUR') return n / rateEur.value;
  return n;
}

async function loadUnits() {
  try {
    const res: any = await usageApi.config();
    const list = res?.data || res;
    if (Array.isArray(list)) {
      const symMap = { CNY: '¥', USD: '$', EUR: '€' } as Record<string, string>;
      for (const row of list) {
        if (row.field === 'usage_currency') {
          const code = (['CNY', 'USD', 'EUR'].includes(row.value) ? row.value : 'CNY') as CurrencyCode;
          currency.value = code;
          currencySymbol.value = symMap[code];
        }
        if (row.field === 'usage_currency_auto_convert') {
          autoConvert.value = String(row.value) === 'true';
        }
        if (row.field === 'usage_rate_usd') {
          const r = Number(row.value);
          if (Number.isFinite(r) && r > 0) rateUsd.value = r;
        }
        if (row.field === 'usage_rate_eur') {
          const r = Number(row.value);
          if (Number.isFinite(r) && r > 0) rateEur.value = r;
        }
        if (row.field === 'usage_token_scale') {
          tokenScale.value = row.value === 'raw' ? 'raw' : 'auto';
        }
      }
    }
  } catch {
    /* 读取失败沿用默认单位 */
  }
}

function formatTime(v: any): string {
  if (v == null) return '-';
  if (Array.isArray(v)) {
    const p = (x: number) => String(x).padStart(2, '0');
    return `${v[0]}-${p(v[1])}-${p(v[2])} ${p(v[3] || 0)}:${p(v[4] || 0)}:${p(v[5] || 0)}`;
  }
  return String(v).replace('T', ' ').slice(0, 19);
}

onMounted(() => {
  loadUnits();
  setQuickFilter('today');
});
</script>

<style scoped>
/* ============================================================================
   令牌口径（与本应用其余组件统一）：
   1. --mp-radius 来自 src/styles/modern-polish.css，而 main.js 从未引入该文件，
      是取不到值的空令牌，实际一直靠兜底的 14px 在渲染 → 收敛到 --el-radius-xl。
   2. rgba(0,0,0,.08) 这类手写投影色改用 color-mix + --el-text-color-primary，
      暗色下不会糊成黑块；投影只出现在「选中指示 / 悬浮浮起」两类允许的场景。
   3. 过渡统一 var(--el-transition-duration-fast, 0.2s)。
   注意：本文件 <script> 里的 ECharts option 颜色是 canvas 语境，var() 不生效，
   属于刻意保留，不得令牌化。
   ============================================================================ */
.usage-page {
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
}

.usage-page > * {
  flex-shrink: 0;
}

/* ===== 英雄区 ===== */
.page-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
}
.hero-text { display: flex; flex-direction: column; gap: 6px; }
.page-title {
  font-size: 22px; font-weight: 700; margin: 0;
  letter-spacing: -0.01em; color: var(--el-text-color-primary);
}
.page-subtitle {
  margin: 0; display: inline-flex; align-items: center; gap: 7px;
  font-size: 12.5px; color: var(--el-text-color-secondary);
}
.sub-dot {
  width: 7px; height: 7px;
  /* 原值 50%（正圆）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
}
.quick-filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.seg-pills {
  display: inline-flex; align-items: center; gap: 2px; padding: 3px;
  background: var(--el-fill-color-light);
  /* 原值 10px（距 8/12 等距，本仓统一取 lg 档） */
  border-radius: var(--el-radius-lg, 12px);
}
.pill {
  appearance: none; border: 0; cursor: pointer;
  /* 原值 8px → md 档 */
  padding: 6px 14px; border-radius: var(--el-radius-md, 8px);
  font-size: 12.5px; font-weight: 500; white-space: nowrap;
  color: var(--el-text-color-secondary); background: transparent;
  transition:
    color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.pill:hover { color: var(--el-text-color-primary); }
.pill.active {
  color: var(--el-color-primary); background: var(--el-bg-color);
  font-weight: 600;
  /* 分段控件的「选中」指示：1px 描边 + 极浅投影，属于允许的选中态标识而非卡片投影 */
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--el-text-color-primary) 8%, transparent),
    0 0 0 1px var(--el-border-color-lighter);
}
.hero-date { width: 268px; }
/* 原值 9px（离 8 更近）→ md 档 */
.hero-date :deep(.el-range-editor.el-input__wrapper) { height: 34px; border-radius: var(--el-radius-md, 8px); }

/* ===== KPI 卡 ===== */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.kpi-card {
  position: relative; overflow: hidden;
  padding: 16px 18px 15px 20px;
  /* 原值 var(--mp-radius, 14px)：--mp-radius 是空令牌，实为 14px → xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
}
.kpi-card::before {
  content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 3px;
  background: var(--kpi-accent, var(--el-color-primary)); opacity: 0.9;
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
  border-color: var(--el-border-color);
}
.kpi-top { display: flex; align-items: center; gap: 9px; margin-bottom: 12px; }
.kpi-icon {
  width: 30px; height: 30px; display: inline-flex;
  align-items: center; justify-content: center;
  /* 原值 9px（离 8 更近）→ md 档 */
  border-radius: var(--el-radius-md, 8px); color: var(--kpi-accent);
  background: var(--kpi-accent-soft, var(--el-color-primary-light-9));
}
.kpi-icon svg { width: 17px; height: 17px; }
.kpi-label { font-size: 12.5px; color: var(--el-text-color-secondary); font-weight: 500; }
.kpi-value {
  font-size: 25px; font-weight: 700; line-height: 1.15;
  color: var(--el-text-color-primary); letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}
.kpi-value.cost { color: var(--el-color-success); }
.kpi-value .unit {
  font-size: 13px; font-weight: 500;
  color: var(--el-text-color-secondary); margin-left: 3px;
}
.kpi-sub {
  margin-top: 10px; display: flex; gap: 12px; flex-wrap: wrap;
  font-size: 11.5px; color: var(--el-text-color-secondary);
}

/* KPI 语义色 */
.tone-primary { --kpi-accent: var(--el-color-primary); --kpi-accent-soft: var(--el-color-primary-light-9); }
.tone-success { --kpi-accent: var(--el-color-success); --kpi-accent-soft: var(--el-color-success-light-9); }
.tone-warning { --kpi-accent: var(--el-color-warning); --kpi-accent-soft: var(--el-color-warning-light-9); }
.tone-info { --kpi-accent: var(--el-color-info); --kpi-accent-soft: var(--el-color-info-light-9); }

.dist-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.page-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  /* 原值 12px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  padding: 18px 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.seg-toggle {
  display: inline-flex;
  background: var(--el-fill-color-light);
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  padding: 2px;
}

.seg-btn {
  border: none;
  background: transparent;
  padding: 4px 12px;
  font-size: 12px;
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all var(--el-transition-duration-fast, 0.2s);
}

.seg-btn.active {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px color-mix(in srgb, var(--el-text-color-primary) 8%, transparent);
}

.dist-table-wrap,
.detail-table-wrap {
  overflow-x: auto;
  margin-top: 12px;
}

.dist-table,
.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

.dist-table th,
.detail-table th {
  text-align: left;
  padding: 8px 10px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
  white-space: nowrap;
}

.dist-table td,
.detail-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.dist-table tbody tr:hover,
.detail-table tbody tr:hover {
  background: var(--el-fill-color-light);
}

.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.model-name {
  font-weight: 500;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-cell {
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
}

.empty-cell,
.chart-empty {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 28px 0;
  font-size: 13px;
}

.pager-row {
  display: flex;
  justify-content: center;
  margin-top: 14px;
}

.filter-input {
  width: 180px;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dist-grid {
    grid-template-columns: 1fr;
  }
}
.latency-cell { position: relative; display: inline-block; cursor: default; }
.latency-inline { display: inline-flex; align-items: center; gap: 6px; }
/* 原值 2px（4px 宽细条的一半，视觉上就是胶囊）→ full 档 */
.latency-bar { width: 4px; height: 14px; border-radius: var(--el-radius-full, 9999px); background: var(--el-color-danger); flex-shrink: 0; }
.latency-value { color: var(--el-text-color-primary); }
.latency-popover {
  display: none;
  position: absolute;
  min-width: 150px;
  padding: 10px 12px;
  border-radius: var(--el-radius-md, 8px);
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  /* 下方又写了一次 6px 并覆盖之，属既有事实，此处只做令牌化保持原生效值 */
  border-radius: var(--el-radius-sm, 6px);
  padding: 8px 12px;
  box-shadow: var(--el-box-shadow);
  white-space: nowrap;
  z-index: 100;
  font-size: 12px;
  line-height: 1.6;
}
.latency-cell:hover .latency-popover { display: block; }
.latency-popover-title { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 6px; }
.latency-popover-row { display: flex; align-items: center; gap: 8px; height: 22px; }
/* 原值 2px（4px 宽色块）→ full 档 */
.latency-popover-row::before { content: ''; width: 4px; height: 16px; border-radius: var(--el-radius-full, 9999px); background: var(--el-color-danger); flex-shrink: 0; }
.latency-popover-label { color: var(--el-text-color-secondary); font-size: 12px; }
.latency-popover-value { margin-left: auto; color: var(--el-color-danger); font-size: 12px; font-weight: 500; font-variant-numeric: tabular-nums; }

/* 固定上下段延迟指示器（flex 两端对齐） */
.latency-indicator {
  display: inline-flex;
  align-items: stretch;
  justify-content: space-between;
  width: 46px;
  height: 26px;
  cursor: default;
}
.latency-track {
  width: 5px;
  height: 26px;
  /* 原值 3px（5px 宽细条，略大于半高即胶囊）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  overflow: hidden;
  background: var(--el-fill-color-light);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.latency-seg-first,
.latency-seg-rest { width: 100%; flex-shrink: 0; }
.latency-times {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 26px;
  text-align: right;
}
.latency-time-first,
.latency-time-total {
  font-size: 11px;
  line-height: 13px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.latency-popover-content { font-size: 12px; }
.latency-popover-content .latency-popover-row { display: flex; align-items: center; gap: 8px; height: 22px; }
/* 原值 50%（正圆）→ full 档 */
.latency-popover-dot { width: 8px; height: 8px; border-radius: var(--el-radius-full, 9999px); flex-shrink: 0; }
.latency-popover-content .latency-popover-label { color: var(--el-text-color-secondary); }
.latency-popover-content .latency-popover-value { margin-left: auto; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; font-weight: 500; }
.latency-popover-hint { margin-top: 6px; font-size: 11px; color: var(--el-text-color-placeholder); }

.token-estimated { border-bottom: 1px dashed var(--el-color-warning); cursor: help; }

/* 合并后的 Token 列 */
.token-cell { position: relative; display: inline-flex; align-items: center; justify-content: flex-end; cursor: default; }
.token-cell.token-estimated { cursor: help; }
.token-inline { display: inline-flex; align-items: center; gap: 10px; }
.token-cell .tk { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-variant-numeric: tabular-nums; }
.tk-ic { width: 13px; height: 13px; flex-shrink: 0; }
.tk-in { color: var(--el-color-success); }
.tk-out { color: var(--el-color-primary); }
.tk-cache { color: var(--el-color-info); }
.token-detail {
  display: none; position: absolute; min-width: 172px; bottom: calc(100% + 6px); right: 0;
  /* 原值 8px → md 档 */
  padding: 10px 12px; border-radius: var(--el-radius-md, 8px); background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light); box-shadow: var(--el-box-shadow);
  z-index: 100; font-size: 12px;
}
.token-cell:hover .token-detail { display: block; }
.token-detail-title { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 6px; }
.token-detail-row { display: flex; align-items: center; justify-content: space-between; gap: 18px; height: 22px; }
.td-label { color: var(--el-text-color-secondary); }
.td-val { font-variant-numeric: tabular-nums; font-weight: 500; }
.td-total .td-label { color: var(--el-text-color-primary); font-weight: 600; }
.td-total .td-val { color: var(--el-text-color-primary); font-weight: 700; }
.token-detail-divider { height: 1px; background: var(--el-border-color-lighter); margin: 4px 0; }
.td-est-note { margin-top: 6px; font-size: 11px; line-height: 1.4; color: var(--el-color-warning); }

/* 尊重系统「减少动态效果」偏好。
   KPI 卡与分段按钮的选中态都靠底色 + 1px 描边表达，关掉过渡后依然可辨。 */
@media (prefers-reduced-motion: reduce) {
  .kpi-card,
  .pill,
  .seg-btn {
    transition: none;
  }
}
</style>
