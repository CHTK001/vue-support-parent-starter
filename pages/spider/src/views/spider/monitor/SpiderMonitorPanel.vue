<template>
  <div class="ds-monitor">
    <!-- ===== TOP SUMMARY ROW ===== -->
    <ScifiPanelB1 class="ds-section">
      <template #header>
        <ScifiPanelTitleA1>监控概览</ScifiPanelTitleA1>
      </template>
      <div class="ds-summary">
        <div class="ds-summary__item ds-summary__item--cyan">
          <div class="ds-summary__num">{{ animDefs }}</div>
          <div class="ds-summary__lbl">定义总数</div>
          <div class="ds-summary__icon">
            <i class="tui-icon ti-file-doc"></i>
          </div>
        </div>
        <div class="ds-summary__item ds-summary__item--orange">
          <div class="ds-summary__num">{{ animRunning }}</div>
          <div class="ds-summary__lbl">运行中</div>
          <div class="ds-summary__icon">
            <i class="tui-icon ti-button-play"></i>
          </div>
          <span v-if="animRunning > 0" class="ds-summary__pulse" />
        </div>
        <div class="ds-summary__item ds-summary__item--green">
          <div class="ds-summary__num">{{ animSuccess }}</div>
          <div class="ds-summary__lbl">已完成</div>
          <div class="ds-summary__icon">
            <i class="tui-icon ti-check-circle"></i>
          </div>
        </div>
        <div class="ds-summary__item ds-summary__item--red">
          <div class="ds-summary__num">{{ animFailed }}</div>
          <div class="ds-summary__lbl">失败</div>
          <div class="ds-summary__icon">
            <i class="tui-icon ti-ban"></i>
          </div>
        </div>
        <div class="ds-summary__item ds-summary__item--accent">
          <div class="ds-summary__num">{{ formatNum(collectedTotal) }}</div>
          <div class="ds-summary__lbl">已采集</div>
          <div class="ds-summary__icon">
            <i class="tui-icon ti-download"></i>
          </div>
        </div>
        <div class="ds-summary__item ds-summary__item--dim">
          <div class="ds-summary__num">{{ maxPage }}</div>
          <div class="ds-summary__lbl">页数</div>
          <div class="ds-summary__icon">
            <i class="tui-icon ti-browser-grid"></i>
          </div>
        </div>
      </div>
    </ScifiPanelB1>

    <!-- ===== MIDDLE ROW: 3 CARDS ===== -->
    <div class="ds-middle">
      <!-- Card 1: Progress -->
      <ScifiPanelA1 v-if="targetTotal > 0">
        <template #header>
          <ScifiPanelTitleA2>采集进度</ScifiPanelTitleA2>
        </template>
        <div class="ds-progress">
          <div class="ds-progress__ring-wrap">
            <svg class="ds-progress__ring" viewBox="0 0 120 120">
              <circle class="ds-progress__ring-bg" cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.06)" stroke-width="8" fill="none" />
              <circle class="ds-progress__ring-fill" cx="60" cy="60" r="52" stroke="url(#progressGrad-scifi)" stroke-width="8" fill="none"
                stroke-linecap="round"
                :stroke-dasharray="327"
                :stroke-dashoffset="327 - 327 * progressPercent / 100"
                transform="rotate(-90, 60, 60)"
              />
              <defs><linearGradient id="progressGrad-scifi" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#00d4ff"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs>
            </svg>
            <div class="ds-progress__ring-val">
              <span class="ds-progress__pct">{{ progressPercent }}%</span>
              <span class="ds-progress__ratio">{{ formatNum(collectedTotal) }}/{{ formatNum(targetTotal) }}</span>
            </div>
          </div>
          <div class="ds-progress__info">
            <div class="ds-progress__stat">
              <span class="ds-progress__stat-lbl">剩余</span>
              <span class="ds-progress__stat-val">{{ formatNum(remaining) }}</span>
            </div>
            <div class="ds-progress__stat">
              <span class="ds-progress__stat-lbl">平均</span>
              <span class="ds-progress__stat-val">{{ avgPerPage }}/页</span>
            </div>
            <div class="ds-progress__stat">
              <span class="ds-progress__stat-lbl">目标</span>
              <span class="ds-progress__stat-val">{{ formatNum(targetTotal) }}</span>
            </div>
          </div>
        </div>
      </ScifiPanelA1>

      <!-- Card 2: 实时采集数据 -->
      <ScifiPanelA2>
        <template #header>
          <ScifiPanelTitleA3>实时采集数据</ScifiPanelTitleA3>
        </template>
        <div class="ds-panel__content-header">
          <span class="ds-card__badge">{{ parseResults.length }} 条</span>
          <div class="ds-feed__live" v-if="parseResults.length > 0">
            <span class="ds-feed__live-dot" />
            LIVE
          </div>
        </div>
        <div class="ds-feed" ref="feedBodyRef">
          <div v-if="parseResults.length === 0" class="ds-card__empty">等待采集数据…</div>
          <div
            v-for="(item, idx) in parseResults.slice(0, 15)"
            :key="item.spiderId ?? idx"
            class="ds-feed__row"
            :class="{ 'ds-feed__row--new': idx < 3 }"
            @click="feedExpandIdx = feedExpandIdx === idx ? -1 : idx"
          >
            <span class="ds-feed__idx">{{ idx + 1 }}</span>
            <span class="ds-feed__dot" :class="item.spiderResultStatus === 'SUCCESS' ? 'dot-ok' : 'dot-pending'" />
            <span class="ds-feed__title" :title="item.resultTitle || '(无标题)'">
              {{ item.resultTitle || truncateUrl(item.spiderTargetUrl, 50) }}
            </span>
            <span class="ds-feed__time">{{ formatTime(item.createTime) }}</span>
            <!-- expanded detail -->
            <div v-if="feedExpandIdx === idx" class="ds-feed__detail">
              <div class="ds-feed__detail-row">
                <span class="ds-feed__detail-lbl">来源</span>
                <span class="ds-feed__detail-val">{{ item.spiderTargetUrl }}</span>
              </div>
              <div class="ds-feed__detail-row" v-if="item.resultFields && Object.keys(item.resultFields).length > 0">
                <span class="ds-feed__detail-lbl">字段</span>
                <span class="ds-feed__detail-val">{{ JSON.stringify(item.resultFields).slice(0, 200) }}</span>
              </div>
              <div class="ds-feed__detail-row">
                <span class="ds-feed__detail-lbl">Schema</span>
                <span class="ds-feed__detail-val">{{ item.spiderResultSchemaCode }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- URL queue mini-bar -->
        <div class="ds-feed__queue">
          <div class="ds-feed__queue-item">
            <span class="ds-feed__queue-lbl">URL 总数</span>
            <span class="ds-feed__queue-val">{{ formatNum(urlStats.total) }}</span>
          </div>
          <div class="ds-feed__queue-item">
            <span class="ds-feed__queue-lbl">已解析</span>
            <span class="ds-feed__queue-val ds-feed__queue-val--ok">{{ formatNum(urlStats.parsed) }}</span>
          </div>
          <div class="ds-feed__queue-item">
            <span class="ds-feed__queue-lbl">剩余</span>
            <span class="ds-feed__queue-val ds-feed__queue-val--warn">{{ formatNum(urlStats.remaining) }}</span>
          </div>
          <div class="ds-feed__queue-item">
            <span class="ds-feed__queue-lbl">结果</span>
            <span class="ds-feed__queue-val ds-feed__queue-val--accent">{{ formatNum(urlStats.results) }}</span>
          </div>
        </div>
      </ScifiPanelA2>

      <!-- Card 3: Execution Status -->
      <ScifiPanelA3>
        <template #header>
          <ScifiPanelTitleA1>执行状态</ScifiPanelTitleA1>
        </template>
        <div v-if="isExecutionRunning" class="ds-runtime">
          <div class="ds-runtime__grid">
            <div class="ds-runtime__item">
              <span class="ds-runtime__lbl">当前节点</span>
              <span class="ds-runtime__val">{{ runningExec?.spiderCurrentNodeCode || '-' }}</span>
            </div>
            <div class="ds-runtime__item">
              <span class="ds-runtime__lbl">状态</span>
              <span class="ds-runtime__val ds-runtime__status" :class="'s-' + (runningExec?.spiderExecutionStatus || '').toLowerCase()">
                {{ statusLabel(runningExec?.spiderExecutionStatus) }}
              </span>
            </div>
            <div class="ds-runtime__item">
              <span class="ds-runtime__lbl">当前页</span>
              <span class="ds-runtime__val">{{ currentPageNum }}</span>
            </div>
            <div class="ds-runtime__item">
              <span class="ds-runtime__lbl">已采集</span>
              <span class="ds-runtime__val ds-runtime__val--accent">{{ formatNum(collectedTotal) }}</span>
            </div>
          </div>
          <div v-if="latestScreenshot" class="ds-runtime__shot">
            <img :src="latestScreenshot" alt="截图" @click="previewImg = latestScreenshot" />
          </div>
        </div>
        <div v-else class="ds-runtime">
          <div class="ds-runtime__summary">
            <div class="ds-runtime__summary-item">
              <span class="ds-runtime__summary-lbl">状态</span>
              <span class="ds-runtime__summary-val ds-runtime__status" :class="'s-' + (selectedExec?.spiderExecutionStatus || '').toLowerCase()">
                {{ statusLabel(selectedExec?.spiderExecutionStatus) }}
              </span>
            </div>
            <div class="ds-runtime__summary-item">
              <span class="ds-runtime__summary-lbl">开始</span>
              <span class="ds-runtime__summary-val">{{ formatFullTime(selectedExec?.spiderStartedAt) }}</span>
            </div>
            <div class="ds-runtime__summary-item">
              <span class="ds-runtime__summary-lbl">结束</span>
              <span class="ds-runtime__summary-val">{{ formatFullTime(selectedExec?.spiderFinishedAt) }}</span>
            </div>
            <div class="ds-runtime__summary-item">
              <span class="ds-runtime__summary-lbl">总采集</span>
              <span class="ds-runtime__summary-val ds-runtime__val--accent">{{ formatNum(collectedTotal) }}</span>
            </div>
            <div class="ds-runtime__summary-item">
              <span class="ds-runtime__summary-lbl">已解析</span>
              <span class="ds-runtime__summary-val">{{ formatNum(urlStats.parsed) }}</span>
            </div>
            <div class="ds-runtime__summary-item">
              <span class="ds-runtime__summary-lbl">最终节点</span>
              <span class="ds-runtime__summary-val">{{ selectedExec?.spiderCurrentNodeCode || '-' }}</span>
            </div>
          </div>
        </div>
      </ScifiPanelA3>
    </div>

    <!-- ===== BOTTOM: REAL-TIME TICKER ===== -->
    <ScifiPanelB2 class="ds-ticker-panel">
      <template #header>
        <ScifiPanelTitleA2>实时动态</ScifiPanelTitleA2>
      </template>
      <div class="ds-ticker__count-bar">
        <span class="ds-ticker__count">{{ timeline.length }} 条记录</span>
      </div>
      <div class="ds-ticker__body" ref="tickerBodyRef">
        <div v-if="timeline.length === 0" class="ds-ticker__empty">等待采集数据…</div>
        <div
          v-for="(item, idx) in timeline"
          :key="item.id"
          class="ds-ticker__row"
          :class="{ 'ds-ticker__row--new': item.isNew }"
          @click="tickerExpandIdx = tickerExpandIdx === idx ? -1 : idx"
        >
          <span class="ds-ticker__dot" :class="'dot-' + item.statusClass" />
          <span class="ds-ticker__time">{{ item.time }}</span>
          <span class="ds-ticker__badge" :class="'b-' + item.statusClass">{{ item.statusLabel }}</span>
          <span class="ds-ticker__page">第{{ item.pageNum }}页</span>
          <span class="ds-ticker__url" :title="item.url">{{ truncateUrl(item.url, 60) }}</span>
          <span class="ds-ticker__count-val" v-if="item.urlCount !== undefined">+{{ item.urlCount }}</span>
          <span class="ds-ticker__node" v-if="item.nodeName">{{ item.nodeName }}</span>
          <!-- expanded detail -->
          <div v-if="tickerExpandIdx === idx" class="ds-ticker__detail">
            <div v-if="item.message" class="ds-ticker__detail-row">📝 {{ item.message }}</div>
            <div v-if="item.screenshotUrl" class="ds-ticker__detail-row">
              <img :src="item.screenshotUrl" class="ds-ticker__detail-img" @click.stop="previewImg = item.screenshotUrl" alt="截图" />
            </div>
          </div>
        </div>
      </div>
    </ScifiPanelB2>

    <!-- ===== ORCHESTRATION FLOW VIEW (G6) ===== -->
    <ScifiPanelB3 class="ds-flow-panel" v-if="hasFlowData">
      <template #header>
        <ScifiPanelTitleA3>{{ flowOrchestrationType === 'MANUAL' ? '人工编排' : 'AI 编排' }}</ScifiPanelTitleA3>
      </template>
      <div class="ds-flow__meta">
        <span class="ds-flow__type" :class="'t-' + (flowOrchestrationType || '').toLowerCase()">
          {{ flowOrchestrationType === 'MANUAL' ? '人工' : 'AI' }}
        </span>
        <span class="ds-flow__count">{{ canvasNodes.length }} 节点</span>
      </div>
      <div class="ds-flow-canvas-wrap">
        <FlowEditor mode="preview" :nodes="canvasNodes" :edges="canvasEdges" />
      </div>
    </ScifiPanelB3>

    <!-- ===== AI DECISIONS PANEL ===== -->
    <ScifiPanelB4 v-if="agentDecisions.length > 0" class="ds-decisions-panel">
      <template #header>
        <ScifiPanelTitleA1>AI 编排决策</ScifiPanelTitleA1>
      </template>
      <div class="ds-decisions__count-bar">
        <span class="ds-decisions__count">{{ agentDecisions.length }} 步</span>
      </div>
      <div class="ds-decisions__body" ref="decisionsBodyRef">
        <div
          v-for="(d, di) in agentDecisions"
          :key="di"
          class="ds-decisions__item"
          @click="decisionExpandIdx = decisionExpandIdx === di ? -1 : di"
        >
          <span class="ds-decisions__step">#{{ d.step }}</span>
          <span class="ds-decisions__action" :class="'a-' + (d.action || '').toLowerCase()">
            {{ d.action }}
          </span>
          <span class="ds-decisions__desc">{{ d.description }}</span>
          <span v-if="d.screenshotUrl" class="ds-decisions__shot-icon" @click.stop="previewImg = d.screenshotUrl || ''">📷</span>
          <!-- expanded detail -->
          <div v-if="decisionExpandIdx === di" class="ds-decisions__detail">
            <div v-if="d.thought" class="ds-decisions__thought">
              <span class="ds-decisions__thought-label">AI 思考</span>
              {{ d.thought }}
            </div>
            <div class="ds-decisions__result">
              <span class="ds-decisions__result-label">结果</span>
              {{ d.result }}
            </div>
            <div v-if="d.screenshotUrl" class="ds-decisions__shot">
              <img :src="d.screenshotUrl" alt="截图" @click.stop="previewImg = d.screenshotUrl || ''" />
            </div>
          </div>
        </div>
      </div>
    </ScifiPanelB4>

    <!-- Image Preview -->
    <Teleport to="body">
      <div v-if="previewImg" class="ds-preview" @click.self="previewImg = ''">
        <button class="ds-preview__close" @click="previewImg = ''">&times;</button>
        <img :src="previewImg" class="ds-preview__img" alt="预览" />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, type Ref } from "vue";
import {
  listSpiderDefinitions,
  listSpiderExecutionRecords,
  listSpiderMonitorProgress,
  listSpiderParseResults,
  getSpiderAgentDecisions,
  getSpiderExecutionDetail,
  getSpiderOrchestrationSchema,
  type SpiderDataRecordView,
  type SpiderDefinition,
  type SpiderExecutionRecordView,
  type SpiderParseResultView,
} from "../../../api/spider";
import type { SpiderAgentDecisionView, SpiderFlowSchema, SpiderExecutionStepView, SpiderExecutionDetailView } from "../../../types/orchestration";
import FlowEditor from "../../../components/FlowEditor.vue";

const props = withDefaults(defineProps<{
  spiderCode: string;
  executionNo: string;
  autoRefresh?: boolean;
  targetTotal?: number;
}>(), {
  autoRefresh: true,
  targetTotal: 500,
});

const emit = defineEmits<{
  (e: "update:lastUpdate", val: string): void;
}>();

// ── Data ──
const defs = ref<SpiderDefinition[]>([]);
const execs = ref<SpiderExecutionRecordView[]>([]);
const monitors = ref<SpiderDataRecordView[]>([]);
const parseResults = ref<SpiderParseResultView[]>([]);
const agentDecisions = ref<SpiderAgentDecisionView[]>([]);
const flowSchema = ref<SpiderFlowSchema | null>(null);
const flowSteps = ref<SpiderExecutionStepView[]>([]);
const executionDetail = ref<SpiderExecutionDetailView | null>(null);
const flowLoading = ref(false);

const animDefs = ref(0);
const animRunning = ref(0);
const animSuccess = ref(0);
const animFailed = ref(0);
const previewImg = ref("");
const tickerExpandIdx = ref(-1);
const tickerBodyRef = ref<HTMLElement | null>(null);
const feedExpandIdx = ref(-1);
const feedBodyRef = ref<HTMLElement | null>(null);
const decisionsBodyRef = ref<HTMLElement | null>(null);
const decisionExpandIdx = ref(-1);

let timer: ReturnType<typeof setInterval> | null = null;
let sseTimer: ReturnType<typeof setTimeout> | null = null;
let lastMonitorCount = 0;
let eventSource: EventSource | null = null;
let scrollTimer: ReturnType<typeof setInterval> | null = null;

// ── Computed ──
const runningExec = computed(() => {
  return execs.value.find((e) => e.spiderExecutionStatus === "RUNNING") || null;
});

const selectedExec = computed(() => {
  if (!props.executionNo) return null;
  return execs.value.find((e) => e.spiderExecutionNo === props.executionNo) || null;
});

const isExecutionRunning = computed(() => {
  const exec = runningExec.value;
  return exec && exec.spiderExecutionNo === props.executionNo;
});

const urlStats = computed(() => {
  const total = monitors.value.length;
  const parsed = parseResults.value.filter(pr => pr.spiderResultStatus === 'SUCCESS').length;
  const resultCount = parseResults.value.length;
  return {
    total,
    parsed,
    remaining: Math.max(0, total - parsed),
    results: resultCount,
  };
});

const currentPageNum = computed(() => {
  const mons = monitors.value;
  if (mons.length === 0) return 0;
  let max = 0;
  for (const m of mons) {
    try {
      const p = JSON.parse(m.spiderDataPayload);
      const n = parseInt(p.pageNum) || 0;
      if (n > max) max = n;
    } catch { /* ignore */ }
  }
  return max;
});

const collectedTotal = computed(() => {
  let fromMonitors = 0;
  for (const m of monitors.value) {
    try {
      const p = JSON.parse(m.spiderDataPayload);
      fromMonitors += p.urlCount || 0;
    } catch { /* ignore */ }
  }
  let fromParseResults = 0;
  for (const pr of parseResults.value) {
    fromParseResults += pr.extractedCount || 0;
  }
  if (fromParseResults === 0) fromParseResults = parseResults.value.length;
  return Math.max(fromMonitors, fromParseResults);
});

const maxPage = computed(() => {
  const fromMonitors = currentPageNum.value;
  if (fromMonitors > 0) return fromMonitors;
  if (parseResults.value.length > 0) return parseResults.value.length;
  return 0;
});

const progressPercent = computed(() => {
  if (props.targetTotal <= 0) return 0;
  return Math.min(100, Math.round((collectedTotal.value / props.targetTotal) * 100));
});

const remaining = computed(() => Math.max(0, props.targetTotal - collectedTotal.value));

const avgPerPage = computed(() => {
  if (monitors.value.length > 0) {
    return Math.round(collectedTotal.value / monitors.value.length);
  }
  if (parseResults.value.length > 0) {
    return Math.round(collectedTotal.value / parseResults.value.length);
  }
  return 0;
});

const pageStats = computed(() => {
  const stats: { page: number; count: number; pct: number; color: string }[] = [];
  let maxCount = 0;
  const pageMap = new Map<number, number>();
  const data = [...monitors.value].reverse();
  for (const m of data) {
    try {
      const p = JSON.parse(m.spiderDataPayload);
      const pageNum = parseInt(p.pageNum) || 0;
      const urlCount = p.urlCount || 0;
      if (pageNum > 0) {
        pageMap.set(pageNum, (pageMap.get(pageNum) || 0) + urlCount);
        if (urlCount > maxCount) maxCount = urlCount;
      }
    } catch { /* ignore */ }
  }
  const sortedPages = [...pageMap.entries()].sort((a, b) => a[0] - b[0]);
  const colors = ["bar-cyan", "bar-blue", "bar-teal", "bar-indigo", "bar-sky"];
  for (const [page, count] of sortedPages) {
    stats.push({
      page, count,
      pct: maxCount > 0 ? Math.round((count / maxCount) * 100) : 0,
      color: colors[(page - 1) % colors.length],
    });
  }
  return stats;
});

const latestScreenshot = computed(() => {
  const mons = monitors.value;
  if (mons.length === 0) return "";
  for (const m of mons) {
    try {
      const p = JSON.parse(m.spiderDataPayload);
      if (p.screenshotUrl) return String(p.screenshotUrl);
      if (p.imageUrl) return String(p.imageUrl);
    } catch { /* ignore */ }
  }
  return "";
});

interface TimelineItem {
  id: number | string;
  time: string;
  url: string;
  pageNum: number;
  urlCount?: number;
  nodeName: string;
  message: string;
  raw: string;
  payload: Record<string, unknown>;
  accumulated: number;
  statusClass: string;
  statusLabel: string;
  screenshotUrl: string;
  context: string;
  isNew: boolean;
  expanded: boolean;
}

const timeline = computed<TimelineItem[]>(() => {
  const items: TimelineItem[] = [];
  let accumulated = 0;

  const data = [...monitors.value].reverse();
  for (let i = 0; i < data.length; i++) {
    const m = data[i];
    let payload: Record<string, unknown> = {};
    try { payload = JSON.parse(m.spiderDataPayload); } catch { /* ignore */ }
    const urlCount = (payload.urlCount as number) || 0;
    accumulated += urlCount;
    const pageNum = parseInt(String(payload.pageNum || "0")) || 0;
    const execStatus = String(payload.executionStatus || m.spiderDataStatus || "RUNNING");

    let statusClass = "running";
    let statusLabel = "运行中";
    if (execStatus === "SUCCESS" || execStatus === "COMPLETED") {
      statusClass = "success"; statusLabel = "完成";
    } else if (execStatus === "FAILED") {
      statusClass = "failed"; statusLabel = "失败";
    } else if (execStatus === "WAITING") {
      statusClass = "waiting"; statusLabel = "等待";
    }

    let screenshotUrl = "";
    if (payload.screenshotUrl) screenshotUrl = String(payload.screenshotUrl);
    else if (payload.imageUrl) screenshotUrl = String(payload.imageUrl);

    let context = "";
    if (payload.executionContext) context = String(payload.executionContext);
    else if (payload.message) context = String(payload.message);
    else if (payload.nodeName) context = `节点: ${payload.nodeName}`;

    items.push({
      id: m.spiderId ?? i,
      time: formatTime(m.createTime),
      url: m.spiderTargetUrl || "-",
      pageNum,
      urlCount,
      nodeName: String(payload.nodeName || m.spiderDataNodeCode || ""),
      message: String(payload.message || payload.executionContext || ""),
      raw: String(payload.rawMessage || ""),
      payload,
      accumulated,
      statusClass, statusLabel,
      screenshotUrl, context,
      isNew: i >= data.length - (monitors.value.length - lastMonitorCount),
      expanded: false,
    });
  }

  if (items.length === 0) {
    const prData = [...parseResults.value].reverse();
    for (let i = 0; i < prData.length; i++) {
      const pr = prData[i];
      const recCount = pr.extractedCount || 1;
      accumulated += recCount;
      const fields: Record<string, unknown> = pr.resultFields
        ? { ...pr.resultFields }
        : (() => { try { return JSON.parse(pr.spiderResultPayload || "{}"); } catch { return {}; } })();

      items.push({
        id: pr.spiderId ?? i,
        time: formatTime(pr.createTime),
        url: pr.spiderTargetUrl || "-",
        pageNum: i + 1,
        urlCount: recCount,
        nodeName: pr.spiderResultSchemaCode || "",
        message: pr.resultTitle || "(无标题)",
        raw: "",
        payload: fields,
        accumulated,
        statusClass: pr.spiderResultStatus === "SUCCESS" ? "success" : "running",
        statusLabel: pr.spiderResultStatus === "SUCCESS" ? "完成" : "运行中",
        screenshotUrl: "",
        context: "",
        isNew: false,
        expanded: false,
      });
    }
  }

  return items.reverse();
});

// ── Helpers ──
function formatTime(t?: string) {
  if (!t) return "-";
  try { return new Date(t).toLocaleTimeString(); } catch { return t; }
}

function formatFullTime(t?: string) {
  if (!t) return "-";
  try {
    const d = new Date(t);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch { return t || "-"; }
}

function truncateUrl(url: string, max = 80) {
  if (!url || url.length <= max) return url || "-";
  return url.slice(0, max) + "...";
}

function statusLabel(status?: string) {
  if (!status) return "未知";
  const map: Record<string, string> = {
    RUNNING: "运行中", SUCCESS: "已完成", FAILED: "失败",
    WAITING: "等待中", PAUSED: "已暂停",
  };
  return map[status] || status;
}

function formatNum(n: number) {
  return n.toLocaleString();
}

function animate(el: Ref<number>, target: number) {
  const from = el.value;
  if (from === target) return;
  const dur = 600;
  const start = performance.now();
  function tick(now: number) {
    const t = Math.min((now - start) / dur, 1);
    el.value = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── Auto-scroll ticker ──
function startTickerScroll() {
  stopTickerScroll();
  scrollTimer = setInterval(() => {
    const el = tickerBodyRef.value;
    if (!el) return;
    if (el.scrollTop >= el.scrollHeight - el.clientHeight - 10) {
      el.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      el.scrollBy({ top: 42, behavior: "smooth" });
    }
  }, 4000);
}

function stopTickerScroll() {
  if (scrollTimer) {
    clearInterval(scrollTimer);
    scrollTimer = null;
  }
}

// ── SSE ──
function connectSSE() {
  if (eventSource) return;
  try {
    const es = new EventSource("/spider-api/spider/executions/stream?spiderExecutionNo=latest");
    eventSource = es;
    es.addEventListener("spider-execution-event", () => loadData());
    es.onerror = () => {
      es.close();
      eventSource = null;
      sseTimer = setTimeout(() => connectSSE(), 5000);
    };
  } catch { /* ignore */ }
}

// ── 编排视图：G6 画布节点/边 ──
const flowOrchestrationType = computed(() => flowSchema.value?.orchestrationType || "");
const hasFlowData = computed(() => flowSchema.value && flowSchema.value.nodes.length > 0);

const nodeRuntimeMap = computed(() => {
  const map: Record<string, { status: string; displayInfo: string; errorMessage: string }> = {};
  for (const s of flowSteps.value) {
    map[s.spiderNodeCode] = {
      status: s.spiderStepStatus || "",
      displayInfo: s.spiderDisplayInfo || "",
      errorMessage: s.spiderErrorMessage || "",
    };
  }
  return map;
});

const canvasNodes = computed(() => {
  if (!flowSchema.value) return [];
  const schema = flowSchema.value;
  const baseNodes = schema.nodes.map(item => ({
    id: item.id,
    type: item.type,
    label: item.title,
    icon: item.icon,
    typeLabel: item.type,
    position: item.position,
    runtimeStatus: nodeRuntimeMap.value[item.id]?.status || "",
    displayInfo: nodeRuntimeMap.value[item.id]?.displayInfo || "",
    errorMessage: nodeRuntimeMap.value[item.id]?.errorMessage || "",
  }));
  // 添加派生步骤（人工介入节点）
  const derivedSteps = flowSteps.value.filter(s => s.spiderIsDerivedNode === 1);
  const nodeMap = new Map(baseNodes.map(n => [n.id, n]));
  for (const step of derivedSteps) {
    if (nodeMap.has(step.spiderNodeCode)) continue;
    const sourceNode = baseNodes.find(n => n.id === step.spiderSourceNodeCode);
    const sourcePos = sourceNode?.position || null;
    nodeMap.set(step.spiderNodeCode, {
      id: step.spiderNodeCode,
      type: "HUMAN_INTERVENE",
      label: step.spiderNodeName || "人工派生节点",
      icon: "",
      typeLabel: "人工处理",
      position: sourcePos ? { x: sourcePos.x + 260, y: sourcePos.y + 140 } : { x: 420, y: 240 },
      runtimeStatus: nodeRuntimeMap.value[step.spiderNodeCode]?.status || "",
      displayInfo: "",
      errorMessage: "",
    });
  }
  return Array.from(nodeMap.values());
});

const canvasEdges = computed(() => {
  if (!flowSchema.value) return [];
  const schema = flowSchema.value;
  const stepMap = Object.fromEntries(flowSteps.value.map(s => [s.spiderNodeCode, s]));
  const traversedMap = Object.fromEntries((executionDetail.value?.spiderTraversedEdges || []).map(e => [e.edgeId, e]));
  const getRuntime = (sourceId: string, targetId: string) => {
    const flowEdge = schema.edges.find(e => e.source === sourceId && e.target === targetId);
    let visited = false;
    let runtimeStatus = "";
    if (flowEdge && traversedMap[flowEdge.id]) {
      visited = traversedMap[flowEdge.id].spiderVisited === 1;
      runtimeStatus = traversedMap[flowEdge.id].spiderRuntimeStatus || "";
    } else {
      const targetStep = stepMap[targetId];
      visited = Boolean(targetStep?.spiderStartedAt || targetStep?.spiderFinishedAt || targetStep?.spiderStepStatus === "WAIT_MANUAL" || targetStep?.spiderStepStatus === "SUCCESS" || targetStep?.spiderStepStatus === "FAILED");
      runtimeStatus = targetStep?.spiderStepStatus || "";
    }
    const targetStep = stepMap[targetId];
    if (targetStep?.spiderStepStatus === "RUNNING") runtimeStatus = "RUNNING";
    return { visited, runtimeStatus };
  };
  // 派生链
  const derivedSteps = flowSteps.value.filter(s => s.spiderIsDerivedNode === 1 && s.spiderSourceNodeCode && s.spiderSourceNodeCode !== s.spiderNodeCode);
  function traceRoot(code: string): string {
    const visited = new Set<string>();
    let cur = code;
    while (cur && stepMap[cur]?.spiderIsDerivedNode === 1 && stepMap[cur]?.spiderSourceNodeCode !== cur) {
      if (visited.has(cur)) break;
      visited.add(cur);
      cur = stepMap[cur].spiderSourceNodeCode;
    }
    return cur;
  }
  const chainGroups = new Map<string, SpiderExecutionStepView[]>();
  for (const step of derivedSteps) {
    const root = traceRoot(step.spiderNodeCode);
    if (!chainGroups.has(root)) chainGroups.set(root, []);
    chainGroups.get(root)!.push(step);
  }
  function getSeq(code: string): number {
    const m = code.match(/#derived(?:-(\d+))?$/);
    return m?.[1] ? parseInt(m[1]) : 1;
  }
  for (const [, chain] of chainGroups) chain.sort((a, b) => getSeq(a.spiderNodeCode) - getSeq(b.spiderNodeCode));
  const allDerivedSources = new Set(derivedSteps.map(s => s.spiderSourceNodeCode));
  const edges = schema.edges.filter(e => !allDerivedSources.has(e.source)).map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: "",
    ...getRuntime(e.source, e.target),
  }));
  const edgeIds = new Set(edges.map(e => e.id));
  for (const [, chain] of chainGroups) {
    for (let i = 0; i < chain.length; i++) {
      const step = chain[i];
      const fromCode = i === 0 ? step.spiderSourceNodeCode : chain[i - 1].spiderNodeCode;
      const inEdgeId = `derived-${fromCode}-${step.spiderNodeCode}`;
      if (!edgeIds.has(inEdgeId)) {
        edges.push({ id: inEdgeId, source: fromCode, target: step.spiderNodeCode, label: "", ...getRuntime(fromCode, step.spiderNodeCode) });
        edgeIds.add(inEdgeId);
      }
      if (i === chain.length - 1) {
        const root = traceRoot(step.spiderNodeCode);
        for (const orig of schema.edges.filter(e => e.source === root)) {
          if (orig.target.includes("#derived")) continue;
          const outId = `derived-continue-${step.spiderNodeCode}-${orig.target}`;
          if (edgeIds.has(outId)) continue;
          edges.push({ id: outId, source: step.spiderNodeCode, target: orig.target, label: "", ...getRuntime(step.spiderNodeCode, orig.target) });
          edgeIds.add(outId);
        }
      }
    }
  }
  return edges;
});

async function loadFlowSchema(execNo?: string) {
  const eno = execNo || props.executionNo;
  if (!eno) return;
  flowLoading.value = true;
  try {
    const detail = await getSpiderExecutionDetail(eno).catch(() => null);
    if (!detail) { flowSchema.value = null; flowSteps.value = []; executionDetail.value = null; return; }
    executionDetail.value = detail;
    flowSteps.value = detail.spiderSteps || [];
    let flowVersion: number | null = null;
    if (detail.spiderTraceSnapshot) {
      try {
        const snapshot = JSON.parse(detail.spiderTraceSnapshot);
        if (snapshot.spiderFlowVersion != null) flowVersion = Number(snapshot.spiderFlowVersion);
      } catch { /* ignore */ }
    }
    if (flowVersion && detail.spiderDefinitionCode) {
      const schema = await getSpiderOrchestrationSchema(detail.spiderDefinitionCode, flowVersion).catch(() => null);
      flowSchema.value = schema;
    } else {
      flowSchema.value = null;
    }
  } catch {
    flowSchema.value = null;
    executionDetail.value = null;
  } finally {
    flowLoading.value = false;
  }
}

// ── Load Data ──
async function loadData() {
  try {
    const code = props.spiderCode;
    const execNo = props.executionNo;
    if (!execNo) {
      emit("update:lastUpdate", "未选择运行记录");
      return;
    }
    const [definitions, records, progress, results] = await Promise.all([
      listSpiderDefinitions().catch(() => [] as SpiderDefinition[]),
      listSpiderExecutionRecords(code, execNo, 50).catch(() => [] as SpiderExecutionRecordView[]),
      listSpiderMonitorProgress(code, execNo, 100).catch(() => [] as SpiderDataRecordView[]),
      listSpiderParseResults(code, execNo, 100).catch(() => [] as SpiderParseResultView[]),
    ]);
    defs.value = definitions || [];
    execs.value = records || [];
    monitors.value = progress || [];
    parseResults.value = results || [];
    lastMonitorCount = monitors.value.length;
    animate(animDefs, defs.value.length);
    animate(animRunning, execs.value.filter((e) => e.spiderExecutionStatus === "RUNNING").length);
    animate(animSuccess, execs.value.filter((e) => e.spiderExecutionStatus === "SUCCESS").length);
    animate(animFailed, execs.value.filter((e) => e.spiderExecutionStatus === "FAILED").length);

    getSpiderAgentDecisions(execNo)
      .then((d) => (agentDecisions.value = d || []))
      .catch(() => {});

    loadFlowSchema(execNo);

    emit("update:lastUpdate", new Date().toLocaleTimeString());
  } catch (e) {
    emit("update:lastUpdate", "⚠️ " + String(e));
  }
}

onMounted(() => {
  loadData();
  connectSSE();
  if (props.autoRefresh) {
    timer = setInterval(loadData, 10000);
  }
  startTickerScroll();
});

onBeforeUnmount(() => {
  stopTickerScroll();
  if (eventSource) { eventSource.close(); eventSource = null; }
  if (sseTimer) { clearTimeout(sseTimer); sseTimer = null; }
  if (timer) { clearInterval(timer); timer = null; }
});

defineExpose({ loadData, defs, execs, monitors });
</script>

<style scoped lang="scss">
/* ── Container ── */
.ds-monitor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 180, 255, 0.15); border-radius: 2px; }
}

/* ── Section wrapper for panels ── */
.ds-section {
  flex-shrink: 0;
}

/* ── Shared layout helpers inside scifi panels ── */
.ds-panel__content-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.ds-ticker__count-bar,
.ds-decisions__count-bar {
  margin-bottom: 4px;
}
.ds-flow__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

/* ── Summary Row ── */
.ds-summary {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  padding-top: 8px;
}
.ds-summary__item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(0, 180, 255, 0.06);
  overflow: hidden;
  transition: border-color 0.2s, background 0.2s;
  &:hover {
    border-color: rgba(0, 180, 255, 0.15);
    background: rgba(0, 0, 0, 0.35);
  }
}
.ds-summary__num {
  font-size: 24px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.ds-summary__lbl {
  font-size: 10px;
  color: var(--lay-text-placeholder);
  letter-spacing: 0.5px;
}
.ds-summary__icon {
  position: absolute;
  right: 10px;
  top: 10px;
  opacity: 0.25;
  .tui-icon {
    font-size: 20px;
  }
}
.ds-summary__pulse {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff9800;
  animation: ds-pulse 1.5s ease-in-out infinite;
}
@keyframes ds-pulse {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(255,152,0,0.5); }
  50% { opacity: 0.6; transform: scale(1.2); box-shadow: 0 0 0 6px rgba(255,152,0,0); }
}
.ds-summary__item--cyan .ds-summary__num,
.ds-summary__item--cyan .ds-summary__icon { color: #00d4ff; }
.ds-summary__item--cyan { border-left: 2px solid #00d4ff; }
.ds-summary__item--orange .ds-summary__num,
.ds-summary__item--orange .ds-summary__icon { color: #ff9800; }
.ds-summary__item--orange { border-left: 2px solid #ff9800; }
.ds-summary__item--green .ds-summary__num,
.ds-summary__item--green .ds-summary__icon { color: #4caf50; }
.ds-summary__item--green { border-left: 2px solid #4caf50; }
.ds-summary__item--red .ds-summary__num,
.ds-summary__item--red .ds-summary__icon { color: #f44336; }
.ds-summary__item--red { border-left: 2px solid #f44336; }
.ds-summary__item--accent .ds-summary__num,
.ds-summary__item--accent .ds-summary__icon { color: #22d3ee; }
.ds-summary__item--accent { border-left: 2px solid #22d3ee; }
.ds-summary__item--dim .ds-summary__num,
.ds-summary__item--dim .ds-summary__icon { color: var(--lay-text-secondary); }
.ds-summary__item--dim { border-left: 2px solid var(--lay-text-secondary); }

/* ── Middle Row ── */
.ds-middle {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  flex: 1;
  min-height: 0;
}

/* ── Card elements ── */
.ds-card__badge {
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 600;
  background: rgba(0, 180, 255, 0.08);
  color: #00b4ff;
  white-space: nowrap;
}
.ds-card__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lay-text-placeholder);
  font-size: 12px;
  padding: 16px 0;
}

/* ── Progress (ring) ── */
.ds-progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 8px;
}
.ds-progress__ring-wrap {
  position: relative;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}
.ds-progress__ring {
  width: 100%;
  height: 100%;
}
.ds-progress__ring-fill {
  transition: stroke-dashoffset 0.6s ease-out;
}
.ds-progress__ring-val {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.ds-progress__pct {
  font-size: 20px;
  font-weight: 800;
  color: #00d4ff;
  font-variant-numeric: tabular-nums;
}
.ds-progress__ratio {
  font-size: 9px;
  color: var(--lay-text-placeholder);
}
.ds-progress__info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ds-progress__stat {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.ds-progress__stat-lbl {
  font-size: 9px;
  color: var(--lay-text-placeholder);
  text-transform: uppercase;
}
.ds-progress__stat-val {
  font-size: 15px;
  font-weight: 700;
  color: var(--lay-text-primary);
  font-variant-numeric: tabular-nums;
}

/* ── Chart ── */
.ds-chart {
  flex: 1;
  display: flex;
  gap: 6px;
  align-items: flex-end;
  overflow-x: auto;
  padding-bottom: 4px;
}
.ds-chart__bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 32px;
}
.ds-chart__bar-track {
  width: 18px;
  height: 70px;
  background: rgba(255,255,255,0.04);
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
}
.ds-chart__bar-fill {
  width: 100%;
  border-radius: 4px;
  transition: height 0.5s ease-out;
  min-height: 2px;
}
.bar-cyan { background: linear-gradient(to top, #00d4ff, #22d3ee); }
.bar-blue { background: linear-gradient(to top, #3b82f6, #60a5fa); }
.bar-teal { background: linear-gradient(to top, #0d9488, #14b8a6); }
.bar-indigo { background: linear-gradient(to top, #6366f1, #818cf8); }
.bar-sky { background: linear-gradient(to top, #0284c7, #38bdf8); }
.ds-chart__bar-lbl {
  font-size: 8px;
  color: var(--lay-text-placeholder);
}
.ds-chart__bar-val {
  font-size: 9px;
  color: var(--lay-text-secondary);
  font-variant-numeric: tabular-nums;
}

/* ── Live Badge ── */
.ds-feed__live {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  background: rgba(0, 180, 255, 0.1);
  color: #00d4ff;
}
.ds-feed__live-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #00d4ff;
  animation: ds-pulse 1s ease-in-out infinite;
}

/* ── Feed ── */
.ds-feed {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-height: 0;
  padding-top: 6px;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 180, 255, 0.1); border-radius: 2px; }
}
.ds-feed__row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  font-size: 11px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
  flex-wrap: wrap;
  &:hover { background: rgba(0, 180, 255, 0.04); }
  &--new { animation: ds-fade-in 0.4s ease-out; }
}
.ds-feed__idx {
  font-size: 9px;
  color: var(--lay-text-placeholder);
  font-variant-numeric: tabular-nums;
  min-width: 16px;
  text-align: right;
  flex-shrink: 0;
}
.ds-feed__dot {
  width: 5px; height: 5px; border-radius: 50%;
  flex-shrink: 0;
  background: #ff9800;
  &.dot-ok { background: #4caf50; }
  &.dot-pending { background: #888; }
}
.ds-feed__title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--lay-text-primary);
  font-weight: 500;
  min-width: 0;
}
.ds-feed__time {
  font-size: 9px;
  color: var(--lay-text-placeholder);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.ds-feed__detail {
  width: 100%;
  padding: 6px 8px;
  margin-top: 2px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  font-size: 10px;
}
.ds-feed__detail-row {
  display: flex;
  gap: 6px;
  margin-bottom: 3px;
  &:last-child { margin-bottom: 0; }
}
.ds-feed__detail-lbl {
  flex-shrink: 0;
  color: var(--lay-text-placeholder);
  min-width: 32px;
}
.ds-feed__detail-val {
  color: var(--lay-text-secondary);
  word-break: break-all;
  line-height: 1.4;
}
.ds-feed__queue {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 180, 255, 0.06);
  margin-top: auto;
}
.ds-feed__queue-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.ds-feed__queue-lbl {
  font-size: 8px;
  color: var(--lay-text-placeholder);
  text-transform: uppercase;
}
.ds-feed__queue-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--lay-text-primary);
  font-variant-numeric: tabular-nums;
  &--ok { color: #4caf50; }
  &--warn { color: #ff9800; }
  &--accent { color: #00d4ff; }
}

/* ── Runtime ── */
.ds-runtime-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ff9800;
  animation: ds-pulse 1.5s ease-in-out infinite;
  &.is-idle {
    background: #666;
    animation: none;
  }
}
.ds-runtime {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 6px;
}
.ds-runtime__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.ds-runtime__item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.ds-runtime__lbl {
  font-size: 9px;
  color: var(--lay-text-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.ds-runtime__val {
  font-size: 13px;
  font-weight: 700;
  color: var(--lay-text-primary);
  font-variant-numeric: tabular-nums;
  &--accent { color: #00d4ff; }
}
.ds-runtime__status {
  &.s-running { color: #ff9800; }
  &.s-success { color: #4caf50; }
  &.s-failed { color: #f44336; }
}
.ds-runtime__summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.ds-runtime__summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ds-runtime__summary-lbl {
  font-size: 9px;
  color: var(--lay-text-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.ds-runtime__summary-val {
  font-size: 12px;
  font-weight: 700;
  color: var(--lay-text-primary);
  font-variant-numeric: tabular-nums;
}
.ds-runtime__shot {
  flex: 1;
  min-height: 0;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 8px;
    cursor: pointer;
    transition: opacity 0.2s;
    max-height: 100px;
    &:hover { opacity: 0.85; }
  }
}

/* ── Ticker ── */
.ds-ticker-panel {
  max-height: 220px;
}
.ds-ticker__count {
  font-size: 10px;
  color: var(--lay-text-placeholder);
  white-space: nowrap;
}
.ds-ticker__body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 180, 255, 0.1); border-radius: 2px; }
}
.ds-ticker__empty {
  padding: 24px;
  text-align: center;
  color: var(--lay-text-placeholder);
  font-size: 12px;
}
.ds-ticker__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid rgba(0, 180, 255, 0.03);
  flex-wrap: wrap;
  &:hover { background: rgba(0, 180, 255, 0.03); }
  &--new { animation: ds-fade-in 0.5s ease-out; }
}
@keyframes ds-fade-in {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}
.ds-ticker__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #ff9800;
  &.dot-success { background: #4caf50; }
  &.dot-failed { background: #f44336; }
  &.dot-waiting { background: #888; }
}
.ds-ticker__time {
  font-variant-numeric: tabular-nums;
  color: var(--lay-text-placeholder);
  flex-shrink: 0;
  min-width: 60px;
}
.ds-ticker__badge {
  padding: 0 6px;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 600;
  flex-shrink: 0;
  &.b-running { background: rgba(255,152,0,0.12); color: #ff9800; }
  &.b-success { background: rgba(76,175,80,0.12); color: #4caf50; }
  &.b-failed { background: rgba(244,67,54,0.12); color: #f44336; }
  &.b-waiting { background: rgba(136,136,136,0.1); color: #888; }
}
.ds-ticker__page {
  color: var(--lay-text-secondary);
  font-weight: 600;
  flex-shrink: 0;
}
.ds-ticker__url {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #00b4ff;
  min-width: 0;
}
.ds-ticker__count-val {
  padding: 0 6px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  background: rgba(0, 180, 255, 0.08);
  color: #00d4ff;
  flex-shrink: 0;
}
.ds-ticker__node {
  font-size: 9px;
  color: var(--lay-text-placeholder);
  flex-shrink: 0;
}
.ds-ticker__detail {
  width: 100%;
  padding: 6px 8px;
  margin-top: 2px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 6px;
  font-size: 10px;
}
.ds-ticker__detail-row {
  color: var(--lay-text-placeholder);
  margin-bottom: 4px;
  &:last-child { margin-bottom: 0; }
}
.ds-ticker__detail-img {
  max-height: 100px;
  border-radius: 6px;
  cursor: pointer;
}

/* ── AI Decisions Panel ── */
.ds-decisions-panel {
  max-height: 220px;
}
.ds-decisions__count {
  font-size: 10px;
  color: var(--lay-text-placeholder);
  white-space: nowrap;
}
.ds-decisions__body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 180, 255, 0.1); border-radius: 2px; }
}
.ds-decisions__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid rgba(0, 180, 255, 0.03);
  flex-wrap: wrap;
  &:hover { background: rgba(0, 180, 255, 0.04); }
}
.ds-decisions__step {
  font-variant-numeric: tabular-nums;
  color: var(--lay-text-placeholder);
  flex-shrink: 0;
  min-width: 30px;
  font-weight: 600;
}
.ds-decisions__action {
  padding: 0 6px;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 600;
  flex-shrink: 0;
  text-transform: uppercase;
  &.a-extract { background: rgba(0, 180, 255, 0.1); color: #00d4ff; }
  &.a-navigate { background: rgba(139,92,246,0.12); color: #a78bfa; }
  &.a-click { background: rgba(251,191,36,0.12); color: #fbbf24; }
  &.a-scroll { background: rgba(34,211,238,0.12); color: #22d3ee; }
  &.a-fill { background: rgba(251,191,36,0.12); color: #fbbf24; }
  &.a-select { background: rgba(59,130,246,0.12); color: #60a5fa; }
  &.a-wait { background: rgba(136,136,136,0.1); color: #888; }
  &.a-plan { background: rgba(76,175,80,0.12); color: #4caf50; }
  &.a-complete { background: rgba(76,175,80,0.2); color: #4caf50; }
  &.a-goal_achieved { background: rgba(76,175,80,0.2); color: #4caf50; }
  &.a-manual_required { background: rgba(249,115,22,0.12); color: #f97316; }
}
.ds-decisions__desc {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--lay-text-secondary);
  min-width: 0;
}
.ds-decisions__shot-icon {
  cursor: pointer;
  flex-shrink: 0;
  font-size: 12px;
}
.ds-decisions__detail {
  width: 100%;
  padding: 8px;
  margin-top: 4px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 6px;
  font-size: 10px;
}
.ds-decisions__thought {
  color: var(--lay-text-placeholder);
  margin-bottom: 6px;
  line-height: 1.5;
  white-space: pre-wrap;
}
.ds-decisions__thought-label,
.ds-decisions__result-label {
  display: inline-block;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
  margin-right: 6px;
  background: rgba(139,92,246,0.1);
  color: #a78bfa;
}
.ds-decisions__result-label {
  background: rgba(0, 180, 255, 0.1);
  color: #00d4ff;
}
.ds-decisions__result {
  color: var(--lay-text-placeholder);
  line-height: 1.5;
  white-space: pre-wrap;
}
.ds-decisions__shot {
  margin-top: 6px;
  img {
    max-height: 120px;
    border-radius: 6px;
    cursor: pointer;
  }
}

/* ── Orchestration Flow View (G6) ── */
.ds-flow-panel {
  flex-shrink: 0;
}
.ds-flow__type {
  padding: 0 8px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 600;
  &.t-manual { background: rgba(251,191,36,0.12); color: #fbbf24; }
  &.t-ai { background: rgba(139,92,246,0.12); color: #a78bfa; }
}
.ds-flow__count {
  font-size: 10px;
  color: var(--lay-text-placeholder);
  white-space: nowrap;
}
.ds-flow-canvas-wrap {
  width: 100%;
  height: 380px;
  margin-top: 6px;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 180, 255, 0.06);
}

/* ── Image Preview ── */
.ds-preview {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.75);
  display: flex; align-items: center; justify-content: center;
}
.ds-preview__close {
  position: absolute; top: 16px; right: 16px;
  width: 36px; height: 36px; border-radius: 50%; border: none;
  background: rgba(0, 180, 255, 0.1); color: #fff; font-size: 24px; cursor: pointer;
}
.ds-preview__img {
  max-width: 90vw; max-height: 90vh;
  border-radius: 8px; box-shadow: 0 8px 40px rgba(0,0,0,0.4);
}
</style>
