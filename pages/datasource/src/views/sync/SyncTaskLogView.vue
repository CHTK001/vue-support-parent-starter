<template>
  <div class="flow-page">
    <!-- 健康度总览：有执行记录才展示（ReStatCard 四卡 + 失败原因归类）——没有数据时整块隐藏，避免一片 0 值卡片占位 -->
    <section v-if="statsLoaded && !noRunData" class="flow-health">
      <div class="flow-health-stats">
        <div v-for="k in kpiCards" :key="k.key" class="flow-health-cell">
          <ReStatCard
            size="compact" :title="k.title" :value="k.value" :desc="k.desc"
            :icon="k.icon" :icon-color="k.color"
          />
          <svg
            v-if="k.spark.length > 1" class="flow-spark"
            viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true"
          >
            <polyline
              class="flow-spark-line" :style="{ stroke: k.color }"
              :points="sparkPoints(k.spark)"
            />
          </svg>
        </div>
      </div>

    </section>

    <!-- 筛选卡片：任务 / 状态 / 触发 / 关键词 一行 -->
    <section class="flow-filters">
      <ReSelect
        v-model="filters.taskId"
        class="flow-filter-task"
        placeholder="任务：全部"
        clearable
        filterable
        :options="taskOptions"
        @change="applyFilters"
      />
      <el-segmented v-model="filters.status" :options="STATUS_SEGMENTS" class="flow-seg" @change="applyFilters" />
      <ReSelect
        v-model="filters.trigger"
        class="flow-filter-trigger"
        placeholder="触发方式：全部"
        clearable
        :options="TRIGGER_OPTIONS"
        @change="applyFilters"
      />
      <el-input
        v-model="keywordInput"
        class="flow-filter-keyword"
        placeholder="搜过程日志：SQL / 任务名 / 错误文本…"
        clearable
        :prefix-icon="SearchIcon"
        @keyup.enter="applyKeyword"
        @clear="applyKeyword"
      >
        <template #append>
          <ReButton :loading="loading" class="flow-filter-search-btn" @click="applyKeyword">搜索</ReButton>
        </template>
      </el-input>
      <span class="flow-filters-hint">保留 30 天 · 每天 03:30 自动清理过期记录</span>
    </section>

    <!-- 记录列表：ReTable 远程分页 -->
    <ReTable
      ref="tableRef"
      table-id="sync-task-run-logs"
      class="flow-table"
      :loader="loadLogs"
      :columns="columns"
      :pagination="true"
      :params="pageQuery"
      row-key="id"
      v-model:page="pageQuery.page"
      v-model:page-size="pageQuery.pageSize"
    >
      <template #empty>
        <div class="flow-empty">
          <span class="flow-empty-icon"><ReIcon name="Document" :size="22" /></span>
          <span class="flow-empty-title">还没有执行日志</span>
          <span class="flow-empty-desc">从「数据同步」页手动执行一次，或等定时任务触发，这里会记录每次执行的旅程与过程日志。</span>
          <ReButton icon="Refresh" @click="reload">刷新</ReButton>
        </div>
      </template>
      <template #runTime="{ row }">
        <span class="flow-mono">{{ row.runTime }}</span>
      </template>
      <template #taskName="{ row }">
        <span class="flow-task" :class="{ 'is-deleted': /已删除/.test(row.taskName) }">{{ row.taskName }}</span>
      </template>
      <template #trigger="{ row }">
        <span class="flow-trigger" :class="`is-${row.trigger.toLowerCase()}`">{{ triggerLabel(row.trigger) }}</span>
      </template>
      <template #status="{ row }">
        <span class="flow-status" :class="row.status === 'SUCCESS' ? 'ok' : 'bad'">
          {{ row.status === "SUCCESS" ? "成功" : "失败" }}
        </span>
      </template>
      <template #journey="{ row }">
        <div
          class="flow-mini"
          :class="row.status === 'SUCCESS' ? 'ok' : 'bad'"
          :title="`读源 → 映射 → 写入：${row.status === 'SUCCESS' ? '顺利走完' : '以失败告终'}`"
        >
          <span class="flow-mini-node">1</span>
          <span class="flow-mini-line" />
          <span class="flow-mini-node">2</span>
          <span class="flow-mini-line" />
          <span class="flow-mini-node">3</span>
        </div>
      </template>
      <template #rw="{ row }">
        <span v-if="row.readCount != null || row.writeCount != null" class="flow-rw">
          读 <b class="flow-mono">{{ row.readCount ?? "—" }}</b> / 写 <b class="flow-mono">{{ row.writeCount ?? "—" }}</b> 行
        </span>
        <span v-else class="flow-rw flow-rw--empty">—</span>
      </template>
      <template #costMs="{ row }">
        <span class="flow-mono">{{ row.costMs ?? "—" }} ms</span>
      </template>
      <template #lineCount="{ row }">
        <span class="flow-mono">{{ row.lineCount }} 行</span>
      </template>
      <template #action="{ row }">
        <ReButton layout="square" type="primary" icon="View" tip="查看过程日志" @click="openDetail(row)" />
      </template>
    </ReTable>

    <!-- 详情弹窗：旅程瀑布 + 摘要（读/写）+ 过程日志 + 耗时趋势 + 失败重跑 -->
    <ReDialog
      v-model="detailVisible"
      class="flow-detail-dlg"
      width="860px"
      title="执行日志详情"
      :subtitle="detail?.taskName || ''"
      :icon="DocumentIcon"
      :close-on-click-modal="false"
    >
      <div v-if="detail" class="flow-detail">
        <!-- 旅程走线（详情版） -->
        <div class="flow-journey flow-journey--detail">
          <template v-for="(step, i) in JOURNEY_STEPS" :key="step">
            <div class="flow-step">
              <span class="flow-node" :class="detail.status === 'SUCCESS' ? 'ok' : 'bad'">{{ i + 1 }}</span>
              <span class="flow-node-label">{{ step }}</span>
            </div>
            <span
              v-if="i < JOURNEY_STEPS.length - 1"
              class="flow-line"
              :class="detail.status === 'SUCCESS' ? 'ok' : 'bad'"
            />
          </template>
        </div>

        <!-- 摘要条：状态 + 时间 + 触发 + 耗时 + 行数 + 读/写 -->
        <div class="flow-detail-summary">
          <span class="flow-status" :class="detail.status === 'SUCCESS' ? 'ok' : 'bad'">
            {{ detail.status === "SUCCESS" ? "成功" : "失败" }}
          </span>
          <span class="flow-detail-meta"><span class="flow-mono">{{ detail.runTime }}</span></span>
          <span class="flow-detail-meta">{{ triggerLabel(detail.trigger) }}</span>
          <span class="flow-detail-meta">{{ detail.costMs ?? "—" }} ms</span>
          <span class="flow-detail-meta">{{ detail.lineCount }} 行</span>
          <span v-if="detail.readCount != null || detail.writeCount != null" class="flow-detail-meta flow-rw">
            读 <b class="flow-mono">{{ detail.readCount ?? "—" }}</b> / 写 <b class="flow-mono">{{ detail.writeCount ?? "—" }}</b> 行
          </span>
        </div>

        <!-- 阶段瀑布：按真实时间比例定位的过程分段 -->
        <div v-if="phases.length" class="flow-waterfall">
          <div class="flow-detail-block-head">
            <span class="flow-detail-block-title">执行阶段瀑布</span>
            <span class="flow-detail-block-hint">每段按真实时间比例定位，悬停看起止</span>
          </div>
          <div class="flow-waterfall-rows">
            <button
              v-for="(p, i) in phases"
              :key="p.key"
              type="button"
              class="flow-waterfall-row"
              :class="`is-${p.tone}`"
              :style="{ left: p.leftPct + '%', width: p.widthPct + '%' }"
              :title="`${p.name} · 起点 ${p.fromMs} ms · 跨度 ${p.spanMs} ms · ${p.count} 行`"
            >
              <span class="flow-waterfall-name">{{ p.name }}</span>
              <span class="flow-waterfall-meta">{{ p.spanMs }} ms</span>
            </button>
          </div>
        </div>

        <!-- 该任务耗时趋势（最近 30 次，失败标红） -->
        <div v-if="trendPoints.length > 1" class="flow-trend">
          <div class="flow-detail-block-head">
            <span class="flow-detail-block-title">该任务耗时趋势</span>
            <span class="flow-detail-block-hint">最近 {{ trendPoints.length }} 次执行 · 红点=失败</span>
          </div>
          <div class="flow-trend-chart">
            <svg :viewBox="`0 0 ${trendW} ${trendH}`" preserveAspectRatio="none" class="flow-trend-svg">
              <polyline
                class="flow-trend-line"
                :points="trendPolyline"
                fill="none"
              />
              <circle
                v-for="(pt, i) in trendDots"
                :key="i"
                :cx="pt.x" :cy="pt.y" r="2.6"
                :class="pt.status === 'FAILED' ? 'flow-trend-dot is-fail' : 'flow-trend-dot is-ok'"
              />
            </svg>
          </div>
        </div>

        <!-- 过程日志 -->
        <div class="flow-detail-block">
          <div class="flow-detail-block-head">
            <span class="flow-detail-block-title">过程日志</span>
            <span class="flow-detail-block-hint">连源、SQL、列解析、映射、逐文件读写、错误堆栈</span>
          </div>
          <div v-if="detail.lines.length" class="flow-lines">
            <div
              v-for="(li, i) in detail.lines"
              :key="i"
              class="flow-line-row"
              :class="`is-${li.level.toLowerCase()}`"
            >
              <span class="flow-line-time">{{ li.time }}</span>
              <span class="flow-line-level">{{ li.level }}</span>
              <span class="flow-line-msg">{{ li.message }}</span>
            </div>
          </div>
          <div v-else class="flow-lines-empty">该次执行没有过程日志行</div>
        </div>
      </div>
      <div v-else-if="detailLoading" class="flow-detail-loading">加载中…</div>

      <!-- footer：失败一键重跑 -->
      <template #footer>
        <div v-if="detail && detail.status === 'FAILED' && detail.taskId != null" class="flow-detail-actions">
          <ReButton type="primary" :loading="rerunning" :icon="RefreshIcon" @click="rerun(detail)">
            <template #icon><ReIcon name="Refresh" /></template>重新执行该任务
          </ReButton>
          <span class="flow-detail-actions-hint">重跑会生成一次新的执行记录</span>
        </div>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 同步日志页 —— 跨任务汇总每次数据同步执行的旅程与过程详情。
 *
 * <p>数据来自 {@code ms_sync_task_run_log}（执行结束时落库，保留 30 天、每天
 * 03:30 由调度器清理）。任务删除后日志仍保留，任务名位置显示回退文案。</p>
 *
 * <p>本页在基础列表之外聚合了几层排障能力：</p>
 * <ul>
 *   <li><b>健康度总览</b>：成功率 / 失败数 / 平均耗时统计卡 + 失败原因归类（无执行记录时整块隐藏）；</li>
 *   <li><b>失败原因归类</b>：按 ERROR 行稳定关键段分组，点某类即以该关键词搜索；</li>
 *   <li><b>过程日志检索</b>：关键词 LIKE 匹配正文（SQL / 任务名 / 错误文本）；</li>
 *   <li><b>读 / 写行数</b>：执行结束解析入库，列表与详情直接展示；</li>
 *   <li><b>阶段瀑布</b>：详情按真实时间比例定位各执行阶段（读源 / 映射 / 写入 / 收尾 / 其他）；</li>
 *   <li><b>耗时趋势</b>：详情内展示该任务最近 N 次执行耗时（失败标红）；</li>
 *   <li><b>失败一键重跑</b>：失败详情底部可直接重跑该任务，生成新执行记录。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { computed, onMounted, reactive, ref } from "vue";
import {
  CircleCheck,
  Document as DocumentIcon,
  Files,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Timer,
  Warning,
} from "@element-plus/icons-vue";
import type { Component } from "vue";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import ReTable from "@repo/ui/re-table";
import ReSelect from "@repo/ui/re-select";
import ReButton from "@repo/ui/re-button";
import ReIcon from "@repo/ui/re-icon";
import ReDialog from "@repo/ui/re-dialog";
import ReStatCard from "@repo/ui/re-stat-card";
import { message } from "@repo/core";
import {
  fetchSyncTasks,
  fetchSyncRunLogs,
  fetchSyncRunLogDetail,
  fetchSyncRunLogStats,
  fetchSyncRunLogTrend,
  rerunSyncRunLog,
  type SyncTask,
  type SyncTaskRunLogItem,
  type SyncTaskRunLogDetail,
  type SyncTaskRunLogLine,
  type SyncRunLogStats,
  type SyncRunLogHourly,
  type SyncRunLogTrend,
} from "../../api/syncTaskApi";

/** 旅程三阶段（数据同步的真实流程：读源 → 字段映射 → 写入目标） */
const JOURNEY_STEPS = ["读源", "映射", "写入"] as const;

/** 每页条数 */
const PAGE_SIZE = 12;

/** 状态分段 */
const STATUS_SEGMENTS = [
  { label: "全部", value: "" },
  { label: "成功", value: "SUCCESS" },
  { label: "失败", value: "FAILED" },
];

/** 触发方式选项 */
const TRIGGER_OPTIONS = [
  { label: "手动", value: "MANUAL" },
  { label: "定时", value: "SCHEDULED" },
  { label: "实时", value: "REALTIME" },
];

/** 查询参数（ReTable 远程 loader 传参） */
const pageQuery = reactive<{
  page: number;
  pageSize: number;
  taskId?: number | null;
  status?: string;
  trigger?: string;
  keyword?: string;
}>({ page: 1, pageSize: PAGE_SIZE, taskId: null, status: "", trigger: "", keyword: "" });

/** 筛选面板状态 */
const filters = reactive<{ taskId?: number | null; status: string; trigger?: string }>({
  taskId: null,
  status: "",
  trigger: "",
});

/** 关键词输入框（独立于 pageQuery.keyword：回车/搜索/清空时才应用） */
const keywordInput = ref("");
const keyword = ref("");

const tableRef = ref();
const loading = ref(false);

/** 健康度总览：初始即 24h 零占位（接口挂起/失败时区块也不空白，始终渲染默认占位） */
const stats = ref<SyncRunLogStats>({ total: 0, success: 0, failed: 0, successRate: 0, avgCostMs: 0, hourly: emptyHourly(), failureGroups: [] });
/** 健康度区块默认直接展示（占位数据兜底），不再等 stats 接口成功才出现 */
const statsLoaded = ref(true);

/** 任务下拉 */
const tasks = ref<SyncTask[]>([]);
const taskOptions = computed(() => tasks.value.map(t => ({ label: t.syncTaskName, value: t.id })));

/** 表格列定义 */
const columns: ReTableColumn[] = [
  { prop: "runTime", label: "执行时间", width: 165, slot: "runTime" },
  { prop: "taskName", label: "任务", minWidth: 160, slot: "taskName" },
  { prop: "trigger", label: "触发", width: 84, slot: "trigger", align: "center" },
  { prop: "status", label: "状态", width: 84, slot: "status", align: "center" },
  { prop: "journey", label: "旅程", width: 130, slot: "journey", align: "center" },
  { prop: "rw", label: "读/写", width: 120, slot: "rw", align: "center" },
  { prop: "costMs", label: "耗时", width: 86, slot: "costMs", align: "center" },
  { prop: "lineCount", label: "行数", width: 76, slot: "lineCount", align: "center" },
  { prop: "action", label: "操作", width: 80, slot: "action", fixed: "right", align: "center" },
];

/** 远程分页 loader */
async function loadLogs({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  loading.value = true;
  try {
    const res = await fetchSyncRunLogs({
      page,
      pageSize,
      taskId: (params.taskId as number) ?? null,
      status: (params.status as string) || null,
      trigger: (params.trigger as string) || null,
      keyword: (params.keyword as string) || null,
    });
    return { total: res?.total ?? 0, data: (res?.records ?? []) as unknown as Record<string, unknown>[] };
  } finally {
    loading.value = false;
  }
}

/** 应用筛选：写回 pageQuery 并回到第一页 */
function applyFilters() {
  pageQuery.taskId = filters.taskId ?? null;
  pageQuery.status = filters.status || "";
  pageQuery.trigger = filters.trigger || "";
  pageQuery.page = 1;
  void tableRef.value?.reload();
}

/** 应用关键词（搜索 / 回车 / 清空） */
function applyKeyword() {
  keyword.value = keywordInput.value.trim();
  pageQuery.keyword = keyword.value || "";
  pageQuery.page = 1;
  void tableRef.value?.reload();
}

/** 失败归类点击 → 以该标签为关键词搜索 */
function applyFailureFilter(label: string) {
  keywordInput.value = label;
  keyword.value = label;
  pageQuery.keyword = label;
  pageQuery.page = 1;
  void tableRef.value?.reload();
}

/** 刷新（保留筛选与当前页） */
function reload() {
  void tableRef.value?.reload();
  void loadStats();
}

/**
 * 24 小时的零计数占位序列（整点时刻 yyyy-MM-dd HH:00）。
 *
 * <p>KPI 四卡的 sparkline 以 stats.hourly 为数据源：后端 stats 接口失败、
 * 或 30 天内尚无执行记录时，hourly 会是空数组，迷你趋势线无数据可画——
 * 用 24 个全 0 的整点占位，让趋势线始终有基线而不是一片空白。</p>
 *
 * @returns 从 23 小时前整点开始的 24 个零计数窗口
 */
function emptyHourly(): SyncRunLogHourly[] {
  const hours: SyncRunLogHourly[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(d.getHours() - i, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    hours.push({
      hour: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:00`,
      total: 0,
      success: 0,
      failed: 0,
    });
  }
  return hours;
}

/** 加载健康度总览（带超时兜底：stats 接口挂起时最多 8s 收起占位，不永远白屏） */
async function loadStats() {
  try {
    const s = await withTimeout(fetchSyncRunLogStats(), 8000);
    if (s) {
      stats.value = {
        ...s,
        // KPI sparkline 需要 hourly 数据：后端没给小时窗口时用 24 零占位
        hourly: s.hourly.length ? s.hourly : emptyHourly(),
      };
    } else {
      stats.value = { total: 0, success: 0, failed: 0, successRate: 0, avgCostMs: 0, hourly: emptyHourly(), failureGroups: [] };
    }
  } catch {
    stats.value = { total: 0, success: 0, failed: 0, successRate: 0, avgCostMs: 0, hourly: emptyHourly(), failureGroups: [] };
  } finally {
    statsLoaded.value = true;
  }
}

/**
 * 带超时的 Promise：stats / trend 这类健康度接口挂了会一直 pending，
 * 不给超时的话组件卸载都收不掉，页面健康度区块就永远停在占位态。
 *
 * @param p 原始 Promise
 * @param ms 超时毫秒数，超时按失败处理
 */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`请求超过 ${ms}ms 未返回`)), ms);
    p.then(
      v => { clearTimeout(timer); resolve(v); },
      e => { clearTimeout(timer); reject(e); },
    );
  });
}

/** 完全没有执行记录：整块健康度总览都不渲染（用户明确不要 0 值占位卡片） */
const noRunData = computed(() => stats.value.total === 0);

/** 24h 柱状：最大计数（归一化用） */
const maxHour = computed(() => Math.max(1, ...stats.value.hourly.map(h => h.total)));
const barHeight = (n: number, max: number) => `${Math.max(2, Math.round((n / max) * 100))}%`;

/* ==================== 顶部 KPI 四卡（与数据同步页 ReStatCard 同款） ==================== */

/** sparkline 折点：把序列归一化到 120×32 视框 */
function sparkPoints(data: number[]): string {
  if (data.length < 2) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  return data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 120;
      const y = 30 - ((v - min) / range) * 26;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

interface KpiCard {
  key: string;
  title: string;
  value: string;
  desc: string;
  icon: Component;
  color: string;
  spark: number[];
}

/** 四张顶部 KPI 卡：执行总数 / 成功率 / 失败 / 平均耗时（全部由 stats 聚合得出） */
const kpiCards = computed<KpiCard[]>(() => {
  const s = stats.value;
  const hourlyTotals = s.hourly.map(h => h.total);
  const hourlySuccess = s.hourly.map(h => h.success);
  const hourlyFailed = s.hourly.map(h => h.failed);
  return [
    {
      key: "total",
      title: "执行总数",
      value: String(s.total),
      desc: `成功 ${s.success} · 失败 ${s.failed}`,
      icon: Files,
      color: "var(--el-color-primary)",
      spark: hourlyTotals,
    },
    {
      key: "rate",
      title: "成功率",
      value: s.total ? `${s.successRate.toFixed(1)}%` : "—",
      desc: s.total ? `近 30 天落盘执行` : "暂无执行记录",
      icon: CircleCheck,
      color: "var(--el-color-success)",
      spark: hourlySuccess.map((n, i) => (hourlyTotals[i] ? Math.round((n / hourlyTotals[i]) * 100) : 0)),
    },
    {
      key: "failed",
      title: "失败",
      value: String(s.failed),
      desc: s.failed ? "需人工介入" : "暂无失败任务",
      icon: Warning,
      color: "var(--el-color-danger)",
      spark: hourlyFailed,
    },
    {
      key: "avgCost",
      title: "平均耗时",
      value: String(s.avgCostMs),
      desc: "近 30 天落盘执行",
      icon: Timer,
      color: "var(--el-color-warning)",
      spark: hourlyTotals,
    },
  ];
});

/** ===== 阶段瀑布（详情内，从过程日志解析） ===== */
interface Phase {
  key: string;
  name: string;
  tone: "read" | "map" | "write" | "final" | "other";
  fromMs: number;
  spanMs: number;
  count: number;
  leftPct: number;
  widthPct: number;
}

/** 阶段关键词：命中即归属该阶段（顺序即优先级） */
const PHASE_RULES: Array<{ name: string; tone: Phase["tone"]; keys: string[] }> = [
  { name: "读源 / 连接", tone: "read", keys: ["连接", "读取", "读源", "源 SQL", "解析", "字段"] },
  { name: "映射", tone: "map", keys: ["映射", "配对", "自动配对", "显式字段"] },
  { name: "写入", tone: "write", keys: ["写入", "写 ", "写N", "INSERT", "UPSERT", "REPLACE", "OVERWRITE", "目标", "批量"] },
  { name: "收尾 / 完成", tone: "final", keys: ["完成", "结束", "执行完成", "留档"] },
];

function phaseOf(message: string): Phase["tone"] {
  for (const rule of PHASE_RULES) {
    if (rule.keys.some(k => message.includes(k))) return rule.tone;
  }
  return "other";
}

const PHASE_NAMES: Record<Phase["tone"], string> = {
  read: "读源 / 连接",
  map: "映射",
  write: "写入",
  final: "收尾 / 完成",
  other: "其它",
};

/** 详情弹窗里解析出的阶段瀑布 */
const phases = ref<Phase[]>([]);

/** 把 HH:mm:ss.SSS 转成当日毫秒 */
function timeToMs(t: string): number {
  const parts = t.split(":");
  if (parts.length !== 3) return 0;
  const secs = parts[2].split(".");
  return (+parts[0] * 3600 + +parts[1] * 60 + +secs[0]) * 1000 + +(secs[1] ?? "0");
}

/** 从过程日志行构建阶段瀑布（按真实时间比例） */
function buildPhases(lines: SyncTaskRunLogLine[]): Phase[] {
  if (!lines.length) return [];
  const stamps = lines.map(l => timeToMs(l.time)).filter(n => Number.isFinite(n));
  if (!stamps.length) return [];
  const start = Math.min(...stamps);
  const end = Math.max(...stamps);
  const total = Math.max(end - start, 1);

  const groups: Record<Phase["tone"], { from: number; to: number; count: number }> = {
    read: { from: Number.POSITIVE_INFINITY, to: Number.NEGATIVE_INFINITY, count: 0 },
    map: { from: Number.POSITIVE_INFINITY, to: Number.NEGATIVE_INFINITY, count: 0 },
    write: { from: Number.POSITIVE_INFINITY, to: Number.NEGATIVE_INFINITY, count: 0 },
    final: { from: Number.POSITIVE_INFINITY, to: Number.NEGATIVE_INFINITY, count: 0 },
    other: { from: Number.POSITIVE_INFINITY, to: Number.NEGATIVE_INFINITY, count: 0 },
  };
  lines.forEach((line, idx) => {
    const ms = timeToMs(line.time);
    const tone = phaseOf(line.message);
    const g = groups[tone];
    g.from = Math.min(g.from, ms);
    g.to = Math.max(g.to, ms);
    g.count++;
    void idx;
  });

  const order: Phase["tone"][] = ["read", "map", "write", "final", "other"];
  const result: Phase[] = [];
  for (const tone of order) {
    const g = groups[tone];
    if (g.count === 0) continue;
    const from = Math.max(g.from, start);
    const to = Math.min(g.to, end);
    result.push({
      key: tone,
      name: PHASE_NAMES[tone],
      tone,
      fromMs: from - start,
      spanMs: Math.max(to - from, 0),
      count: g.count,
      leftPct: ((from - start) / total) * 100,
      widthPct: Math.max((Math.max(to - from, 1) / total) * 100, 2.5),
    });
  }
  return result;
}

/** ===== 耗时趋势（详情内） ===== */
const trendPoints = ref<Array<{ runTime: string; costMs: number | null; status: string }>>([]);
const trendW = 480;
const trendH = 64;

const trendDots = computed(() => {
  const pts = trendPoints.value;
  if (pts.length < 2) return [];
  const costs = pts.map(p => p.costMs ?? 0);
  const max = Math.max(...costs, 1);
  const min = Math.min(...costs, 0);
  const range = Math.max(max - min, 1);
  return pts.map((p, i) => ({
    x: 4 + (i * (trendW - 8)) / (pts.length - 1),
    y: trendH - 6 - ((p.costMs ?? 0) - min) * ((trendH - 12) / range),
    status: p.status,
  }));
});

const trendPolyline = computed(() =>
  trendDots.value.map(d => `${d.x.toFixed(1)},${d.y.toFixed(1)}`).join(" ")
);

/** ===== 详情 ===== */
const detailVisible = ref(false);
const detail = ref<SyncTaskRunLogDetail | null>(null);
const detailLoading = ref(false);
const rerunning = ref(false);

async function openDetail(row: SyncTaskRunLogItem) {
  detailVisible.value = true;
  detailLoading.value = true;
  detail.value = null;
  phases.value = [];
  trendPoints.value = [];
  try {
    const d = await fetchSyncRunLogDetail(row.id);
    detail.value = d;
    phases.value = d ? buildPhases(d.lines) : [];
    if (d?.taskId != null) {
      try {
        const t: SyncRunLogTrend = await fetchSyncRunLogTrend(d.taskId, 30);
        trendPoints.value = t?.points ?? [];
      } catch {
        trendPoints.value = [];
      }
    }
  } finally {
    detailLoading.value = false;
  }
}

/** 失败一键重跑 */
async function rerun(row: SyncTaskRunLogDetail) {
  rerunning.value = true;
  try {
    const result = await rerunSyncRunLog(row.id);
    const ok = result?.status !== "FAILED";
    if (ok) {
      message.success(`已重新执行：读 ${result.readCount ?? 0} 行，写 ${result.writeCount ?? 0} 行，${result.costMs}ms`);
    } else {
      message.error(`重跑失败：${result.message || "执行失败"}`);
    }
  } catch (e) {
    message.error((e as Error)?.message ?? "重跑失败");
  } finally {
    rerunning.value = false;
    void reload();
  }
}

/** 触发方式中文 */
function triggerLabel(trigger: string): string {
  if (trigger === "MANUAL") return "手动";
  if (trigger === "REALTIME") return "实时";
  return "定时";
}

onMounted(async () => {
  void loadStats();
  try {
    tasks.value = (await fetchSyncTasks()) ?? [];
  } catch {
    tasks.value = [];
  }
});
</script>

<style scoped>
/* 透明型根容器（与 .tel-page 卡片型二选一）：外层 .main-content 已给 8px 留白，
   这里不再叠 padding —— 否则透明根自带一圈边距会与外壳留白重复堆积（历史罪案）。 */
.flow-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ---------- 健康度总览（ReStatCard 四卡，与数据同步 KPI 同款） ---------- */
.flow-health {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0px;
}
/* 四卡一行（窄屏折行）。每格 = ReStatCard + 叠在卡内右下角的迷你趋势线 */
.flow-health-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.flow-health-cell { position: relative; min-width: 0; }
.flow-spark {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 120px;
  height: 32px;
  opacity: 0.85;
  pointer-events: none;
}
.flow-spark-line {
  fill: none;
  stroke-width: 1.6;
  stroke-linejoin: round;
  stroke-linecap: round;
}
@media (max-width: 1100px) {
  .flow-health-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 620px) {
  .flow-health-stats { grid-template-columns: 1fr; }
}

.flow-health-chart-head, .flow-detail-block-head { display: flex; align-items: baseline; gap: 10px; }
.flow-health-chart-title { font-size: 12.5px; font-weight: 700; color: var(--text-primary); }
.flow-health-chart-hint { font-size: 11px; color: var(--text-tertiary); }

.flow-bars { display: flex; align-items: flex-end; gap: 3px; height: 58px; margin-top: 6px; }
.flow-bar-col { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; }
.flow-bar-stack { display: flex; flex-direction: column-reverse; width: 100%; }
.flow-bar-seg { width: 100%; border-radius: 2px 2px 0 0; }
.flow-bar-seg.is-ok { background: var(--status-success); }
.flow-bar-seg.is-fail { background: var(--status-error); }
/* 窗口内有数据时的空小时基线：画一条 2% 高浅色柱，柱子不悬空 */
.flow-bar-seg.is-zero { height: 2px; background: var(--status-muted, rgba(128, 128, 128, 0.35)); }

.flow-health-fail { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; border-top: 1px dashed var(--border-subtle); padding-top: 10px; }
.flow-fail-chip {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid var(--border-default);
  background: var(--bg-fill);
  color: var(--text-secondary);
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all .15s var(--ease-out);
}
.flow-fail-chip:hover { border-color: var(--brand-500); color: var(--brand-600); }
.flow-fail-chip.is-active { border-color: var(--brand-500); background: var(--brand-50); color: var(--brand-600); }
.flow-fail-chip-count {
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
  background: var(--bg-container);
  border-radius: 999px;
  padding: 0 6px;
  line-height: 1.6;
}

/* ---------- 筛选卡片 ---------- */
.flow-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
  padding: 10px 14px;
  background: var(--bg-container);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}
.flow-filter-task { width: 200px; flex: none; }
.flow-filter-trigger { width: 160px; flex: none; }
.flow-filter-keyword { width: 260px; flex: none; }
.flow-filter-search-btn { height: 100%; }
.flow-seg { flex: none; }
.flow-filters-hint { margin-left: auto; flex: none; font-size: 11.5px; color: var(--text-tertiary); white-space: nowrap; }

/* ---------- 表格 ---------- */
.flow-table { width: 100%; }
.flow-mono { font-family: var(--el-font-family-mono, "JetBrains Mono", "Consolas", monospace); font-variant-numeric: tabular-nums; }
.flow-task { font-weight: 600; color: var(--text-primary); }
.flow-task.is-deleted { color: var(--text-tertiary); font-style: italic; font-weight: 500; }
.flow-rw { font-size: 12px; color: var(--text-secondary); }
.flow-rw b { color: var(--text-primary); }
.flow-rw--empty { color: var(--text-tertiary); }

.flow-trigger {
  display: inline-block;
  font-size: 11px; font-weight: 600; border-radius: 999px; padding: 1px 8px; line-height: 1.7;
  color: var(--text-secondary); background: var(--bg-fill); border: 1px solid var(--border-default);
}
.flow-trigger.is-manual { color: var(--brand-600); background: var(--brand-50); border-color: color-mix(in srgb, var(--brand-500) 30%, transparent); }
.flow-trigger.is-realtime { color: var(--status-warning); background: color-mix(in srgb, var(--status-warning) 12%, transparent); border-color: color-mix(in srgb, var(--status-warning) 34%, transparent); }

.flow-status { display: inline-block; font-size: 11px; font-weight: 700; border-radius: 999px; padding: 1px 9px; line-height: 1.7; color: #fff; }
.flow-status.ok { background: var(--status-success); }
.flow-status.bad { background: var(--status-error); }

.flow-mini { display: inline-flex; align-items: center; }
.flow-mini-node { width: 18px; height: 18px; border-radius: 50%; flex: none; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; }
.flow-mini-line { width: 16px; height: 2px; flex: none; border-radius: 2px; }
.flow-mini.ok .flow-mini-node { background: var(--status-success); }
.flow-mini.ok .flow-mini-line { background: var(--status-success); }
.flow-mini.bad .flow-mini-node { background: var(--status-error); }
.flow-mini.bad .flow-mini-line { background: var(--status-error); }

.flow-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 30px 0; }
.flow-empty-icon { color: var(--brand-500); opacity: .7; }
.flow-empty-title { font-weight: 600; color: var(--text-primary); }
.flow-empty-desc { font-size: 12px; color: var(--text-secondary); max-width: 420px; text-align: center; }
.flow-empty > :last-child { margin-top: 6px; }

/* ---------- 详情弹窗 ---------- */
.flow-detail { display: flex; flex-direction: column; gap: 12px; }
.flow-journey { display: flex; align-items: flex-start; }
.flow-journey--detail { margin: 2px 0 4px; padding: 12px; background: var(--bg-fill); border-radius: 10px; }
.flow-step { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: none; }
.flow-node { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; }
.flow-node.ok { background: var(--status-success); box-shadow: 0 0 0 3px color-mix(in srgb, var(--status-success) 16%, transparent); }
.flow-node.bad { background: var(--status-error); box-shadow: 0 0 0 3px color-mix(in srgb, var(--status-error) 16%, transparent); }
.flow-node-label { font-size: 10.5px; color: var(--text-tertiary); }
.flow-line { flex: 1; height: 2px; margin: 12px 6px 0; border-radius: 2px; }
.flow-line.ok { background: var(--status-success); }
.flow-line.bad { background: var(--status-error); }

.flow-detail-summary { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.flow-detail-meta { font-size: 12px; color: var(--text-secondary); }

.flow-detail-block { display: flex; flex-direction: column; gap: 8px; }
.flow-detail-block-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.flow-detail-block-hint { font-size: 11.5px; color: var(--text-tertiary); }
.flow-detail-loading { padding: 30px 0; text-align: center; font-size: 12.5px; color: var(--text-tertiary); }

/* 阶段瀑布 */
.flow-waterfall { display: flex; flex-direction: column; gap: 6px; }
.flow-waterfall-rows { position: relative; height: 30px; background: var(--bg-fill); border-radius: 8px; overflow: hidden; }
.flow-waterfall-row {
  position: absolute;
  top: 5px;
  bottom: 5px;
  border: 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 0 8px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  cursor: default;
  white-space: nowrap;
  overflow: hidden;
  color: #fff;
}
.flow-waterfall-row.is-read { background: color-mix(in srgb, var(--brand-500) 78%, #fff); }
.flow-waterfall-row.is-map { background: color-mix(in srgb, var(--info, #0ea5e9) 80%, #fff); }
.flow-waterfall-row.is-write { background: color-mix(in srgb, var(--status-success) 82%, #fff); }
.flow-waterfall-row.is-final { background: color-mix(in srgb, var(--status-warning) 80%, #fff); }
.flow-waterfall-row.is-other { background: color-mix(in srgb, var(--text-tertiary) 70%, #fff); }
.flow-waterfall-name { overflow: hidden; text-overflow: ellipsis; }
.flow-waterfall-meta { font-variant-numeric: tabular-nums; opacity: .85; }

/* 耗时趋势 */
.flow-trend { display: flex; flex-direction: column; gap: 6px; }
.flow-trend-chart { border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-fill); padding: 4px; }
.flow-trend-svg { width: 100%; height: 64px; display: block; }
.flow-trend-line { stroke: var(--brand-400); stroke-width: 1.4; }
.flow-trend-dot.is-ok { fill: var(--status-success); }
.flow-trend-dot.is-fail { fill: var(--status-error); }

.flow-lines {
  max-height: 55vh; overflow: auto;
  border: 1px solid var(--border-default); border-radius: 8px;
  padding: 8px 10px; background: var(--bg-fill);
  font-family: var(--el-font-family-mono, "JetBrains Mono", "Consolas", monospace);
  font-size: 12px; line-height: 1.6;
}
.flow-line-row { display: flex; gap: 10px; align-items: flex-start; white-space: pre-wrap; word-break: break-all; }
.flow-line-time { flex: none; color: var(--text-tertiary); font-variant-numeric: tabular-nums; }
.flow-line-level { flex: none; width: 46px; font-weight: 700; }
.flow-line-msg { flex: 1; min-width: 0; color: var(--text-primary); }
.flow-line-row.is-info .flow-line-level { color: var(--brand-500); }
.flow-line-row.is-warn .flow-line-level { color: var(--status-warning); }
.flow-line-row.is-error .flow-line-level { color: var(--status-error); }
.flow-line-row.is-error .flow-line-msg { color: var(--status-error); }
.flow-lines-empty { padding: 16px 4px; font-size: 12px; color: var(--text-tertiary); }

/* footer 重跑 */
.flow-detail-actions { display: flex; align-items: center; gap: 10px; }
.flow-detail-actions-hint { font-size: 11.5px; color: var(--text-tertiary); }

/* ---------- 响应式 ---------- */
@media (max-width: 720px) {
  .flow-filters { flex-wrap: wrap; overflow-x: visible; }
  .flow-filter-task, .flow-filter-trigger, .flow-filter-keyword { width: 100%; }
  .flow-filters-hint { margin-left: 0; }
  .flow-health-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .flow-line-row { flex-wrap: wrap; row-gap: 1px; }
  .flow-line-msg { flex: 1 0 100%; }
  .flow-waterfall-row { font-size: 10px; padding: 0 5px; }
}
</style>