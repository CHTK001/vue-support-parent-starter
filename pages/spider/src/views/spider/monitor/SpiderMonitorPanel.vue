<template>
  <div class="panel">
    <!-- Metrics row -->
    <div class="metrics">
      <div v-for="s in summaryStats" :key="s.label" class="metric-card">
        <div class="metric-top">
          <span class="metric-val" :class="s.numCls">{{ s.value }}</span>
          <span v-if="s.pulse" class="metric-dot" />
        </div>
        <span class="metric-lbl">{{ s.label }}</span>
      </div>
    </div>

    <!-- Progress -->
    <div class="card mb-4">
      <div class="card-hdr">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        <span>采集统计</span>
      </div>
      <div class="card-body">
        <div v-for="c in collectionStats" :key="c.label" class="progress-row">
          <div class="progress-head">
            <span class="progress-num">{{ c.num }}</span>
            <span class="progress-pct">{{ c.pct }}%</span>
          </div>
          <div class="progress-track"><div class="progress-fill" :style="{ width: c.pct + '%' }" /></div>
          <div class="progress-meta">
            <span>{{ c.label }}</span>
            <span>{{ c.detail }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts row -->
    <div class="grid-2 mb-4">
      <div class="card">
        <div class="card-hdr">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span>采集进度</span>
        </div>
        <div class="card-body flex items-center gap-5">
          <div class="ring-wrap">
            <svg viewBox="0 0 120 120" class="ring-svg">
              <circle cx="60" cy="60" r="52" fill="none" class="ring-bg" stroke-width="6" />
              <circle cx="60" cy="60" r="52" fill="none" class="ring-fg" stroke-width="6" stroke-linecap="round"
                :stroke-dasharray="327" :stroke-dashoffset="327 - 327 * snapshot.progressPercent / 100" />
            </svg>
            <div class="ring-label">
              <span class="ring-pct">{{ snapshot.progressPercent }}%</span>
              <span class="ring-sub">{{ formatNum(snapshot.collectedTotal) }}/{{ formatNum(snapshot.targetTotal) }}</span>
            </div>
          </div>
          <div class="ring-meta">
            <div v-for="r in ringStats" :key="r.label" class="ring-meta-it">
              <span class="ring-meta-lbl">{{ r.label }}</span>
              <span class="ring-meta-val" :class="r.valCls">{{ r.value }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-hdr">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span>采集速率</span>
        </div>
        <div class="card-body">
          <div ref="rateChartRef" class="chart-area" />
          <div v-if="!snapshot.perMinuteRates.length" class="chart-empty">等待数据…</div>
        </div>
      </div>
    </div>

    <!-- Node chain -->
    <div class="card mb-4">
      <div class="card-hdr">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
        <span>执行链路</span>
        <span v-if="snapshot.nodeChain.length" class="hdr-badge">{{ snapshot.nodeChain.length }}</span>
      </div>
      <div class="card-body">
        <div v-if="!snapshot.nodeChain.length" class="empty-state">暂无执行记录</div>
        <div v-else class="chain">
          <template v-for="(node, ni) in snapshot.nodeChain" :key="node.nodeCode">
            <div class="chain-node" :class="chainCls(node)">
              <span class="chain-idx">{{ ni + 1 }}</span>
              <span class="chain-mid" />
              <div class="chain-body">
                <div class="chain-row">
                  <span class="chain-name">{{ node.nodeName || node.nodeCode }}</span>
                  <span class="chain-tag">{{ nodeTypeLabel(node.nodeType) }}</span>
                  <span v-if="node.isDerived === 1" class="chain-tag chain-tag--violet">派生</span>
                  <span class="chain-right">
                    <span class="chain-time">{{ node.startedAt ? formatShortTime(node.startedAt) : '' }}</span>
                    <span class="chain-st" :class="'cs-' + (node.stepStatus || '').toLowerCase()">{{ stepLabel(node.stepStatus) }}</span>
                  </span>
                </div>
                <div v-if="node.errorMessage" class="chain-err">{{ node.errorMessage }}</div>
              </div>
            </div>
            <div v-if="ni < snapshot.nodeChain.length - 1" class="chain-arrow">
              <svg width="8" height="12" viewBox="0 0 8 12"><path d="M1 1l6 5-6 5" stroke="currentColor" stroke-width="1.5" fill="none" /></svg>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Feed + Status row -->
    <div class="grid-2 mb-4">
      <div class="card">
        <div class="card-hdr">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
          <span>实时采集</span>
          <span class="hdr-badge">{{ snapshot.collectedItems.length }}</span>
          <span v-if="snapshot.collectedItems.length" class="live-dot" />
        </div>
        <div class="card-body">
          <div v-if="!snapshot.collectedItems.length" class="empty-state">等待采集数据…</div>
          <div v-else class="feed-list">
            <div v-for="(item, idx) in snapshot.collectedItems.slice(0, 20)" :key="idx"
              class="feed-row" @click="feedExpandIdx = feedExpandIdx === idx ? -1 : idx">
              <span class="feed-idx">{{ idx + 1 }}</span>
              <span class="feed-dot" :class="item.status === 'SUCCESS' ? 'fd-ok' : 'fd-pd'" />
              <span class="feed-title">{{ item.title || truncateUrl(item.url, 40) }}</span>
              <span class="feed-time">{{ item.time }}</span>
              <div v-if="feedExpandIdx === idx" class="feed-detail">
                <div><span>来源</span><span>{{ item.url }}</span></div>
                <div><span>Schema</span><span>{{ item.schemaCode }}</span></div>
              </div>
            </div>
          </div>
          <div class="feed-footer">
            <div v-for="q in queueStats" :key="q.label" class="ff-item">
              <span class="ff-lbl">{{ q.label }}</span>
              <span class="ff-val" :class="q.valCls">{{ q.value }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-hdr">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
          <span>执行状态</span>
        </div>
        <div class="card-body">
          <template v-if="isExecutionRunning">
            <div class="status-grid">
              <div v-for="s in runtimeStats" :key="s.label" class="sg-item">
                <span class="sg-lbl">{{ s.label }}</span>
                <span class="sg-val" :class="s.valCls">{{ s.value }}</span>
              </div>
            </div>
            <div v-if="latestScreenshot" class="screenshot-wrap">
              <img :src="latestScreenshot" alt="截图" @click="previewImg = latestScreenshot" />
            </div>
          </template>
          <template v-else>
            <div class="status-grid cols-3">
              <div v-for="s in finishedStats" :key="s.label" class="sg-item">
                <span class="sg-lbl">{{ s.label }}</span>
                <span class="sg-val" :class="s.valCls">{{ s.value }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Flow view -->
    <div v-if="hasFlowData" class="card mb-4">
      <div class="card-hdr">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <span>{{ flowOrchestrationType === 'MANUAL' ? '人工编排' : 'AI 编排' }}</span>
        <span class="hdr-tag" :class="flowOrchestrationType === 'MANUAL' ? 'ht-warn' : 'ht-info'">{{ flowOrchestrationType === 'MANUAL' ? '人工' : 'AI' }}</span>
        <span class="hdr-note">{{ canvasNodes.length }} 节点</span>
      </div>
      <div class="flow-box">
        <FlowEditor mode="preview" :nodes="canvasNodes" :edges="canvasEdges" />
      </div>
    </div>

    <!-- AI decisions -->
    <div v-if="agentDecisions.length" class="card mb-4">
      <div class="card-hdr">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        <span>AI 编排决策</span>
        <span class="hdr-badge">{{ agentDecisions.length }}</span>
      </div>
      <div class="decision-list">
        <div v-for="(d, di) in agentDecisions" :key="di"
          class="decision-row" @click="decisionExpandIdx = decisionExpandIdx === di ? -1 : di">
          <span class="d-step">#{{ d.step }}</span>
          <span class="tag" :class="'t-' + decisionTagType(d.action)">{{ d.action }}</span>
          <span class="d-desc">{{ d.description }}</span>
          <span v-if="d.screenshotUrl" class="d-shot" @click.stop="previewImg = d.screenshotUrl || ''">截图</span>
          <div v-if="decisionExpandIdx === di" class="d-body">
            <div v-if="d.thought" class="d-block"><span class="tag t-info mr-1">AI 思考</span>{{ d.thought }}</div>
            <div class="d-block"><span class="tag t-def mr-1">结果</span>{{ d.result }}</div>
            <div v-if="d.screenshotUrl"><img :src="d.screenshotUrl" class="d-img" alt="截图" @click.stop="previewImg = d.screenshotUrl || ''" /></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview overlay -->
    <Teleport to="body">
      <div v-if="previewImg" class="overlay" @click.self="previewImg = ''">
        <button class="overlay-close" @click="previewImg = ''">&times;</button>
        <img :src="previewImg" class="overlay-img" alt="预览" />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  listSpiderDefinitions,
  listSpiderExecutionRecords,
  listSpiderMonitorProgress,
  listSpiderParseResults,
  getSpiderAgentDecisions,
  getSpiderExecutionDetail,
  getSpiderOrchestrationSchema,
  loadSpiderMonitorSnapshot,
  type SpiderDataRecordView,
  type SpiderDefinition,
  type SpiderExecutionRecordView,
  type SpiderParseResultView,
} from "../../../api/spider";
import type {
  SpiderAgentDecisionView,
  SpiderFlowSchema,
  SpiderExecutionStepView,
  SpiderExecutionDetailView,
  SpiderMonitorSnapshot,
} from "../../../types/orchestration";
import { ScFlowEditor as FlowEditor, getLfNodeType } from "@repo/components/ScFlowEditor";

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

const defs = ref<SpiderDefinition[]>([]);
const execs = ref<SpiderExecutionRecordView[]>([]);
const monitors = ref<SpiderDataRecordView[]>([]);
const parseResults = ref<SpiderParseResultView[]>([]);
const agentDecisions = ref<SpiderAgentDecisionView[]>([]);
const flowSchema = ref<SpiderFlowSchema | null>(null);
const flowSteps = ref<SpiderExecutionStepView[]>([]);
const executionDetail = ref<SpiderExecutionDetailView | null>(null);

const snapshot = ref<SpiderMonitorSnapshot>({
  collectedTotal: 0, targetTotal: props.targetTotal, progressPercent: 0,
  urlTotal: 0, urlCompleted: 0, urlRemaining: 0, resultCount: 0,
  nodeChain: [], perMinuteRates: [], collectedItems: [],
});

const animDefs = ref(0);
const animRunning = ref(0);
const animSuccess = ref(0);
const animFailed = ref(0);
const previewImg = ref("");
const feedExpandIdx = ref(-1);
const decisionExpandIdx = ref(-1);
const rateChartRef = ref<HTMLElement | null>(null);

let timer: ReturnType<typeof setInterval> | null = null;
let sseTimer: ReturnType<typeof setTimeout> | null = null;
let lastMonitorCount = 0;
let eventSource: EventSource | null = null;
let chartInstance: any = null;

const runningExec = computed(() => execs.value.find(e => e.spiderExecutionStatus === "RUNNING") || null);
const selectedExec = computed(() => props.executionNo ? execs.value.find(e => e.spiderExecutionNo === props.executionNo) || null : null);
const isExecutionRunning = computed(() => {
  const exec = runningExec.value;
  return exec && exec.spiderExecutionNo === props.executionNo;
});

const currentPageNum = computed(() => {
  let max = 0;
  for (const m of monitors.value) {
    try { const p = JSON.parse(m.spiderDataPayload); const n = parseInt(p.pageNum) || 0; if (n > max) max = n; } catch {}
  }
  return max;
});

const maxPage = computed(() => currentPageNum.value || snapshot.value.nodeChain.length || 0);

const latestScreenshot = computed(() => {
  for (const m of monitors.value) {
    try { const p = JSON.parse(m.spiderDataPayload); if (p.screenshotUrl) return String(p.screenshotUrl); if (p.imageUrl) return String(p.imageUrl); } catch {}
  }
  return "";
});

const urlCompletedPct = computed(() => snapshot.value.urlTotal ? Math.round((snapshot.value.urlCompleted / snapshot.value.urlTotal) * 100) : 0);
const remainingPct = computed(() => snapshot.value.urlTotal ? Math.round((snapshot.value.urlRemaining / snapshot.value.urlTotal) * 100) : 0);

const summaryStats = computed(() => [
  { label: "定义总数", value: formatNum(animDefs.value), numCls: "", pulse: false },
  { label: "运行中", value: formatNum(animRunning.value), numCls: "cw", pulse: animRunning.value > 0 },
  { label: "已完成", value: formatNum(animSuccess.value), numCls: "cg", pulse: false },
  { label: "失败", value: formatNum(animFailed.value), numCls: "cr", pulse: false },
  { label: "已采集", value: formatNum(snapshot.value.collectedTotal), numCls: "", pulse: false },
  { label: "页数", value: formatNum(maxPage.value), numCls: "cm", pulse: false },
]);

const collectionStats = computed(() => [
  { num: formatNum(snapshot.value.collectedTotal), pct: snapshot.value.progressPercent, label: "采集进度", detail: `${formatNum(snapshot.value.collectedTotal)}/${formatNum(snapshot.value.targetTotal)}` },
  { num: formatNum(snapshot.value.urlTotal), pct: urlCompletedPct.value, label: "URL 完成量", detail: `${formatNum(snapshot.value.urlCompleted)}/${formatNum(snapshot.value.urlTotal)}` },
  { num: formatNum(snapshot.value.resultCount), pct: 100, label: "结果总数", detail: `${formatNum(snapshot.value.resultCount)} 条` },
  { num: formatNum(snapshot.value.urlRemaining), pct: remainingPct.value, label: "剩余 URL", detail: formatNum(snapshot.value.urlRemaining) },
]);

const ringStats = computed(() => [
  { label: "剩余", value: formatNum(Math.max(0, snapshot.value.targetTotal - snapshot.value.collectedTotal)), valCls: "" },
  { label: "目标", value: formatNum(snapshot.value.targetTotal), valCls: "" },
  { label: "完成", value: formatNum(snapshot.value.urlCompleted), valCls: "cg" },
]);

const queueStats = computed(() => [
  { label: "URL 总数", value: formatNum(snapshot.value.urlTotal), valCls: "" },
  { label: "已解析", value: formatNum(snapshot.value.urlCompleted), valCls: "cg" },
  { label: "剩余", value: formatNum(snapshot.value.urlRemaining), valCls: "cw" },
  { label: "结果", value: formatNum(snapshot.value.resultCount), valCls: "" },
]);

const runtimeStats = computed(() => [
  { label: "当前节点", value: runningExec.value?.spiderCurrentNodeCode || "-", valCls: "" },
  { label: "状态", value: statusLabel(runningExec.value?.spiderExecutionStatus), valCls: runningExec.value?.spiderExecutionStatus === "RUNNING" ? "cw" : "" },
  { label: "当前页", value: String(currentPageNum.value), valCls: "" },
  { label: "已采集", value: formatNum(snapshot.value.collectedTotal), valCls: "" },
]);

const finishedStats = computed(() => [
  { label: "状态", value: statusLabel(selectedExec.value?.spiderExecutionStatus), valCls: selectedExec.value?.spiderExecutionStatus === "SUCCESS" ? "cg" : selectedExec.value?.spiderExecutionStatus === "FAILED" ? "cr" : "" },
  { label: "开始", value: formatFullTime(selectedExec.value?.spiderStartedAt), valCls: "" },
  { label: "结束", value: formatFullTime(selectedExec.value?.spiderFinishedAt), valCls: "" },
  { label: "总采集", value: formatNum(snapshot.value.collectedTotal), valCls: "" },
  { label: "已解析", value: formatNum(snapshot.value.urlCompleted), valCls: "" },
  { label: "最终节点", value: selectedExec.value?.spiderCurrentNodeCode || "-", valCls: "" },
]);

const flowOrchestrationType = computed(() => flowSchema.value?.orchestrationType || "");
const hasFlowData = computed(() => flowSchema.value && flowSchema.value.nodes.length > 0);

const nodeRuntimeMap = computed(() => {
  const map: Record<string, { status: string; displayInfo: string; errorMessage: string }> = {};
  for (const s of flowSteps.value) map[s.spiderNodeCode] = { status: s.spiderStepStatus || "", displayInfo: s.spiderDisplayInfo || "", errorMessage: s.spiderErrorMessage || "" };
  return map;
});

const canvasNodes = computed(() => {
  if (!flowSchema.value) return [];
  const schema = flowSchema.value;
  const baseNodes = schema.nodes.map(item => ({ id: item.id, type: getLfNodeType(item.type), label: item.title, icon: item.icon, kind: item.type, position: item.position, runtimeStatus: nodeRuntimeMap.value[item.id]?.status || "", displayInfo: nodeRuntimeMap.value[item.id]?.displayInfo || "", errorMessage: nodeRuntimeMap.value[item.id]?.errorMessage || "" }));
  const derivedSteps = flowSteps.value.filter(s => s.spiderIsDerivedNode === 1);
  const nodeMap = new Map(baseNodes.map(n => [n.id, n]));
  for (const step of derivedSteps) {
    if (nodeMap.has(step.spiderNodeCode)) continue;
    const sourceNode = baseNodes.find(n => n.id === step.spiderSourceNodeCode);
    const sourcePos = sourceNode?.position || null;
    nodeMap.set(step.spiderNodeCode, { id: step.spiderNodeCode, type: getLfNodeType("HUMAN_INTERVENE"), label: step.spiderNodeName || "人工派生节点", icon: "", kind: "HUMAN_INTERVENE", position: sourcePos ? { x: sourcePos.x + 260, y: sourcePos.y + 140 } : { x: 420, y: 240 }, runtimeStatus: nodeRuntimeMap.value[step.spiderNodeCode]?.status || "", displayInfo: "", errorMessage: "" });
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
    let visited = false, runtimeStatus = "";
    if (flowEdge && traversedMap[flowEdge.id]) { visited = traversedMap[flowEdge.id].spiderVisited === 1; runtimeStatus = traversedMap[flowEdge.id].spiderRuntimeStatus || ""; }
    else { const ts = stepMap[targetId]; visited = Boolean(ts?.spiderStartedAt || ts?.spiderFinishedAt || ts?.spiderStepStatus === "WAIT_MANUAL" || ts?.spiderStepStatus === "SUCCESS" || ts?.spiderStepStatus === "FAILED"); runtimeStatus = ts?.spiderStepStatus || ""; }
    const ts = stepMap[targetId]; if (ts?.spiderStepStatus === "RUNNING") runtimeStatus = "RUNNING";
    return { visited, runtimeStatus };
  };
  const derivedSteps = flowSteps.value.filter(s => s.spiderIsDerivedNode === 1 && s.spiderSourceNodeCode && s.spiderSourceNodeCode !== s.spiderNodeCode);
  function traceRoot(code: string): string { const visited = new Set<string>(); let cur = code; while (cur && stepMap[cur]?.spiderIsDerivedNode === 1 && stepMap[cur]?.spiderSourceNodeCode !== cur) { if (visited.has(cur)) break; visited.add(cur); cur = stepMap[cur].spiderSourceNodeCode; } return cur; }
  const chainGroups = new Map<string, SpiderExecutionStepView[]>();
  for (const step of derivedSteps) { const root = traceRoot(step.spiderNodeCode); if (!chainGroups.has(root)) chainGroups.set(root, []); chainGroups.get(root)!.push(step); }
  function getSeq(code: string): number { const m = code.match(/#derived(?:-(\d+))?$/); return m?.[1] ? parseInt(m[1]) : 1; }
  for (const [, chain] of chainGroups) chain.sort((a, b) => getSeq(a.spiderNodeCode) - getSeq(b.spiderNodeCode));
  const allDerivedSources = new Set(derivedSteps.map(s => s.spiderSourceNodeCode));
  const edges = schema.edges.filter(e => !allDerivedSources.has(e.source)).map(e => ({ id: e.id, source: e.source, target: e.target, label: "", ...getRuntime(e.source, e.target) }));
  const edgeIds = new Set(edges.map(e => e.id));
  for (const [, chain] of chainGroups) {
    for (let i = 0; i < chain.length; i++) {
      const step = chain[i];
      const fromCode = i === 0 ? step.spiderSourceNodeCode : chain[i - 1].spiderNodeCode;
      const inEdgeId = `derived-${fromCode}-${step.spiderNodeCode}`;
      if (!edgeIds.has(inEdgeId)) { edges.push({ id: inEdgeId, source: fromCode, target: step.spiderNodeCode, label: "", ...getRuntime(fromCode, step.spiderNodeCode) }); edgeIds.add(inEdgeId); }
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

function formatTime(t?: string) { if (!t) return "-"; try { return new Date(t).toLocaleTimeString(); } catch { return t; } }
function formatShortTime(t: string) { try { const d = new Date(t); return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return t; } }
function formatFullTime(t?: string) { if (!t) return "-"; try { const d = new Date(t); const pad = (n: number) => n.toString().padStart(2, "0"); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; } catch { return t || "-"; } }
function truncateUrl(url: string, max = 80) { return (!url || url.length <= max) ? (url || "-") : url.slice(0, max) + "..."; }
function statusLabel(status?: string) { if (!status) return "未知"; const map: Record<string, string> = { RUNNING: "运行中", SUCCESS: "已完成", FAILED: "失败", WAITING: "等待中", PAUSED: "已暂停" }; return map[status] || status; }
function stepLabel(status?: string) { if (!status) return "待执行"; const map: Record<string, string> = { PENDING: "待执行", RUNNING: "运行中", SUCCESS: "成功", FAILED: "失败", WAIT_MANUAL: "待人工" }; return map[status] || status; }
function nodeTypeLabel(type?: string) { if (!type) return ""; const map: Record<string, string> = { START: "开始", END: "结束", PAGE_ACCESS: "页面访问", AI_PAGE_ACCESS: "智能访问", DATA_PARSE: "数据解析", URL_PARSE: "URL解析", CONDITION: "条件", SAVE_RESULT: "结果保存", HUMAN_INTERVENE: "人工介入", DOWNLOADER: "下载", SUB_FLOW: "子流程" }; return map[type] || type; }
function formatNum(n: number) { return n.toLocaleString(); }
function decisionTagType(action?: string) { if (!action) return "info"; const a = action.toUpperCase(); if (a === "COMPLETE" || a === "GOAL_ACHIEVED") return "success"; if (a === "FAILED" || a === "ERROR") return "danger"; if (a === "MANUAL_REQUIRED") return "warning"; return "info"; }

function chainCls(node: { stepStatus?: string; isDerived?: number }) {
  const s = (node.stepStatus || "").toLowerCase();
  if (s === "success") return "cn-ok";
  if (s === "failed") return "cn-err";
  if (s === "running") return "cn-run";
  if (s === "wait_manual") return "cn-man";
  if (node.isDerived === 1) return "cn-dev";
  return "";
}

function animate(el: { value: number }, target: number) {
  const from = el.value;
  if (from === target) return;
  const dur = 600, start = performance.now();
  function tick(now: number) {
    const t = Math.min((now - start) / dur, 1);
    el.value = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

async function renderRateChart() {
  if (!rateChartRef.value) return;
  const rates = snapshot.value.perMinuteRates;
  if (rates.length === 0) return;
  try {
    const echarts = (await import("echarts")).default;
    if (!chartInstance) chartInstance = echarts.init(rateChartRef.value, "T");
    chartInstance.setOption({
      tooltip: { trigger: "axis", formatter: (params: any) => { const p = params[0]; return `${p.axisValue}<br/>采集: ${p.value} 条/分`; } },
      grid: { left: 30, right: 8, top: 8, bottom: 16 },
      xAxis: { type: "category", data: rates.map(r => r.timeLabel), axisLine: { lineStyle: { color: "var(--el-border-color-light, #e5e7eb)" } }, axisLabel: { color: "var(--el-text-color-placeholder, #9ca3af)", fontSize: 10 }, axisTick: { show: false } },
      yAxis: { type: "value", splitLine: { lineStyle: { color: "var(--el-border-color-lighter, #f3f4f6)", type: "dashed" } }, axisLabel: { color: "var(--el-text-color-placeholder, #9ca3af)", fontSize: 10 }, minInterval: 1 },
      series: [{ type: "bar", data: rates.map(r => r.count), barMaxWidth: 18, itemStyle: { borderRadius: [2, 2, 0, 0], color: "var(--el-color-primary, #3b82f6)" }, emphasis: { itemStyle: { color: "var(--el-color-primary-dark-2, #2563eb)" } } }],
    }, true);
  } catch {}
}

function initRateChart() { if (snapshot.value.perMinuteRates.length > 0) renderRateChart(); }

function connectSSE() {
  if (eventSource) return;
  try {
    const es = new EventSource("/spider-api/spider/executions/stream?spiderExecutionNo=latest");
    eventSource = es;
    es.addEventListener("spider-execution-event", () => loadData());
    es.onerror = () => { es.close(); eventSource = null; sseTimer = setTimeout(() => connectSSE(), 5000); };
  } catch {}
}

async function loadFlowSchema(execNo?: string) {
  const eno = execNo || props.executionNo;
  if (!eno) return;
  try {
    const detail = await getSpiderExecutionDetail(eno).catch(() => null);
    if (!detail) { flowSchema.value = null; flowSteps.value = []; executionDetail.value = null; return; }
    executionDetail.value = detail;
    flowSteps.value = detail.spiderSteps || [];
    let flowVersion: number | null = null;
    if (detail.spiderTraceSnapshot) { try { const s = JSON.parse(detail.spiderTraceSnapshot); if (s.spiderFlowVersion != null) flowVersion = Number(s.spiderFlowVersion); } catch {} }
    if (flowVersion && detail.spiderDefinitionCode) { const schema = await getSpiderOrchestrationSchema(detail.spiderDefinitionCode, flowVersion).catch(() => null); flowSchema.value = schema; }
    else { flowSchema.value = null; }
  } catch { flowSchema.value = null; executionDetail.value = null; }
}

async function loadData() {
  try {
    const code = props.spiderCode;
    const execNo = props.executionNo;
    if (!execNo) { emit("update:lastUpdate", "未选择运行记录"); return; }
    const [definitions, records, sn, progress, results] = await Promise.all([
      listSpiderDefinitions().catch(() => [] as SpiderDefinition[]),
      listSpiderExecutionRecords(code, execNo, 50).catch(() => [] as SpiderExecutionRecordView[]),
      loadSpiderMonitorSnapshot(code, execNo, props.targetTotal).catch(() => ({ collectedTotal: 0, targetTotal: props.targetTotal, progressPercent: 0, urlTotal: 0, urlCompleted: 0, urlRemaining: 0, resultCount: 0, nodeChain: [], perMinuteRates: [], collectedItems: [] })),
      listSpiderMonitorProgress(code, execNo, 100).catch(() => [] as SpiderDataRecordView[]),
      listSpiderParseResults(code, execNo, 100).catch(() => [] as SpiderParseResultView[]),
    ]);
    defs.value = definitions || [];
    execs.value = records || [];
    monitors.value = progress || [];
    parseResults.value = results || [];
    snapshot.value = sn;
    lastMonitorCount = monitors.value.length;
    animate(animDefs, defs.value.length);
    animate(animRunning, execs.value.filter(e => e.spiderExecutionStatus === "RUNNING").length);
    animate(animSuccess, execs.value.filter(e => e.spiderExecutionStatus === "SUCCESS").length);
    animate(animFailed, execs.value.filter(e => e.spiderExecutionStatus === "FAILED").length);
    getSpiderAgentDecisions(execNo).then(d => agentDecisions.value = d || []).catch(() => {});
    loadFlowSchema(execNo);
    initRateChart();
    emit("update:lastUpdate", new Date().toLocaleTimeString());
  } catch (e) { emit("update:lastUpdate", "⚠️ " + String(e)); }
}

onMounted(() => { loadData(); connectSSE(); if (props.autoRefresh) timer = setInterval(loadData, 10000); });
onBeforeUnmount(() => { if (eventSource) { eventSource.close(); eventSource = null; } if (sseTimer) { clearTimeout(sseTimer); sseTimer = null; } if (timer) { clearInterval(timer); timer = null; } if (chartInstance) { chartInstance.dispose(); chartInstance = null; } });

defineExpose({ loadData, defs, execs, monitors, snapshot });
</script>

<style scoped>
/* ── Layout ── */
.panel {
  height: 100%; overflow-y: auto; padding-right: 4px;
  scroll-behavior: smooth;
}
.panel::-webkit-scrollbar { width: 4px; }
.panel::-webkit-scrollbar-track { background: transparent; }
.panel::-webkit-scrollbar-thumb { background: var(--el-border-color-darker, #d1d5db); border-radius: 2px; }
.panel::-webkit-scrollbar-thumb:hover { background: var(--el-text-color-placeholder, #9ca3af); }

.mb-4 { margin-bottom: 20px; }
.mr-1 { margin-right: 4px; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* ── Metrics row ── */
.metrics {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.metric-card {
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  padding: 16px 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  cursor: default;
}
.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.07);
  border-color: var(--el-border-color);
  background: var(--el-bg-color);
}
.metric-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.metric-val { font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1.1; color: var(--el-text-color-primary); transition: color 0.15s; }
.metric-card:hover .metric-val { color: var(--el-color-primary); }
.metric-lbl { font-size: 11px; color: var(--el-text-color-secondary); letter-spacing: 0.02em; transition: color 0.15s; }
.metric-card:hover .metric-lbl { color: var(--el-text-color-primary); }
.metric-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--el-color-warning);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 color-mix(in srgb, var(--el-color-warning) 50%, transparent); }
  50% { opacity: 0.5; transform: scale(1.3); box-shadow: 0 0 0 6px color-mix(in srgb, var(--el-color-warning) 0%, transparent); }
}

/* ── Cards ── */
.card {
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  transition: box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
  border-color: var(--el-border-color);
}
.card-hdr {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 16px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  svg { color: var(--el-text-color-placeholder); flex-shrink: 0; transition: color 0.15s; }
}
.card:hover .card-hdr svg { color: var(--el-color-primary); }
.card-body { padding: 12px 16px 16px; }

.hdr-badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 500;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color);
  padding: 0 7px;
  border-radius: 4px;
  line-height: 18px;
}
.hdr-tag {
  font-size: 10px;
  font-weight: 500;
  padding: 0 7px;
  border-radius: 4px;
  line-height: 18px;
}
.ht-info { background: color-mix(in srgb, var(--el-color-primary) 12%, transparent); color: var(--el-color-primary); }
.ht-warn { background: color-mix(in srgb, var(--el-color-warning) 15%, transparent); color: var(--el-color-warning); }
.hdr-note { font-size: 10px; color: var(--el-text-color-placeholder); font-weight: 400; }
.live-dot {
  display: inline-block; width: 5px; height: 5px; border-radius: 50%;
  background: var(--el-color-success); margin-left: 2px;
  animation: live-pulse 1.2s ease-in-out infinite;
}
@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* ── Progress items ── */
.progress-row { margin-bottom: 14px; transition: padding 0.15s; }
.progress-row:last-child { margin-bottom: 0; }
.progress-row:hover { padding-left: 4px; }
.progress-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px; }
.progress-num { font-size: 16px; font-weight: 650; font-variant-numeric: tabular-nums; color: var(--el-text-color-primary); }
.progress-pct { font-size: 10px; color: var(--el-text-color-placeholder); font-variant-numeric: tabular-nums; }
.progress-track { height: 4px; background: var(--el-fill-color); border-radius: 2px; overflow: hidden; margin-bottom: 4px; }
.progress-fill { height: 100%; border-radius: 2px; background: var(--el-color-primary); transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
.progress-meta { display: flex; justify-content: space-between; font-size: 10px; color: var(--el-text-color-placeholder); }

/* ── Ring ── */
.ring-wrap { position: relative; width: 84px; height: 84px; flex-shrink: 0; }
.ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); filter: drop-shadow(0 1px 2px rgba(0,0,0,0.04)); }
.ring-bg { stroke: var(--el-fill-color); }
.ring-fg { stroke: var(--el-color-primary); transition: stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1); }
.ring-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ring-pct { font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--el-color-primary); line-height: 1; }
.ring-sub { font-size: 9px; color: var(--el-text-color-placeholder); font-variant-numeric: tabular-nums; }
.ring-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; flex: 1; }
.ring-meta-it { display: flex; flex-direction: column; gap: 2px; }
.ring-meta-lbl { font-size: 9px; color: var(--el-text-color-placeholder); text-transform: uppercase; letter-spacing: 0.05em; }
.ring-meta-val { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--el-text-color-primary); }

/* ── Chart ── */
.chart-area { height: 120px; width: 100%; }
.chart-empty { display: flex; align-items: center; justify-content: center; height: 120px; font-size: 12px; color: var(--el-text-color-placeholder); }

/* ── Chain ── */
.empty-state { text-align: center; padding: 32px 0; font-size: 12px; color: var(--el-text-color-placeholder); }
.chain-node {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 8px 12px; border-radius: 6px; background: var(--el-fill-color-lighter);
  border-left: 3px solid var(--el-border-color);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}
.chain-node:hover {
  background: var(--el-fill-color);
  transform: translateX(2px);
}
.cn-ok { border-left-color: var(--el-color-success); }
.cn-err { border-left-color: var(--el-color-danger); }
.cn-run { border-left-color: var(--el-color-warning); animation: cn-run 1.5s ease-in-out infinite; }
.cn-man { border-left-color: var(--el-color-warning); }
.cn-dev { border-left-color: #a78bfa; }
@keyframes cn-run { 0%, 100% { background: var(--el-fill-color-lighter); } 50% { background: color-mix(in srgb, var(--el-color-warning) 8%, transparent); } }
.chain-idx { font-size: 9px; color: var(--el-text-color-placeholder); font-variant-numeric: tabular-nums; min-width: 14px; text-align: right; margin-top: 3px; flex-shrink: 0; }
.chain-mid { width: 2px; min-height: 100%; flex-shrink: 0; background: var(--el-border-color); border-radius: 1px; }
.chain-body { flex: 1; min-width: 0; }
.chain-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.chain-name { font-size: 11px; font-weight: 600; color: var(--el-text-color-primary); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chain-tag { font-size: 9px; font-weight: 500; color: var(--el-text-color-placeholder); padding: 0 6px; border-radius: 3px; background: var(--el-border-color); flex-shrink: 0; }
.chain-tag--violet { background: #f5f3ff; color: #8b5cf6; }
.chain-right { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; }
.chain-time { font-size: 9px; color: var(--el-text-color-placeholder); font-variant-numeric: tabular-nums; }
.chain-st { font-size: 9px; font-weight: 600; }
.chain-arrow { display: flex; justify-content: center; padding: 2px 0; color: var(--el-border-color); transition: color 0.15s; }
.chain-arrow:hover { color: var(--el-text-color-placeholder); }
.chain-err { font-size: 10px; color: var(--el-color-danger); margin-top: 3px; line-height: 1.4; }
.cs-success { color: var(--el-color-success); }
.cs-failed { color: var(--el-color-danger); }
.cs-running { color: var(--el-color-warning); }
.cs-wait_manual { color: var(--el-color-warning); }

/* ── Feed ── */
.feed-list { max-height: 260px; overflow-y: auto; }
.feed-list::-webkit-scrollbar { width: 3px; }
.feed-list::-webkit-scrollbar-track { background: transparent; }
.feed-list::-webkit-scrollbar-thumb { background: var(--el-border-color); border-radius: 2px; }
.feed-row {
  display: flex; align-items: center; gap: 6px; padding: 5px 6px;
  font-size: 11px; cursor: pointer; border-radius: 4px; transition: all 0.12s cubic-bezier(0.4, 0, 0.2, 1);
  flex-wrap: wrap;
}
.feed-row:hover { background: var(--el-fill-color-lighter); }
.feed-idx { font-size: 9px; color: var(--el-text-color-placeholder); font-variant-numeric: tabular-nums; min-width: 14px; text-align: right; flex-shrink: 0; }
.feed-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; background: var(--el-color-warning); }
.fd-ok { background: var(--el-color-success); }
.fd-pd { background: var(--el-border-color); }
.feed-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--el-text-color-primary); font-weight: 500; min-width: 0; }
.feed-time { font-size: 9px; color: var(--el-text-color-placeholder); font-variant-numeric: tabular-nums; flex-shrink: 0; }
.feed-detail { width: 100%; margin-top: 6px; padding: 8px; border-radius: 4px; background: var(--el-fill-color-lighter); font-size: 10px; transition: all 0.15s; }
.feed-detail div { display: flex; gap: 8px; margin-bottom: 4px; }
.feed-detail div:last-child { margin-bottom: 0; }
.feed-detail div span:first-child { color: var(--el-text-color-placeholder); flex-shrink: 0; width: 40px; }
.feed-detail div span:last-child { color: var(--el-text-color-secondary); word-break: break-all; }
.feed-footer { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding-top: 10px; margin-top: 10px; border-top: 1px solid var(--el-border-color-lighter); }
.ff-item { display: flex; flex-direction: column; align-items: center; gap: 2px; transition: transform 0.15s; }
.ff-item:hover { transform: translateY(-1px); }
.ff-lbl { font-size: 9px; color: var(--el-text-color-placeholder); text-transform: uppercase; letter-spacing: 0.05em; }
.ff-val { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--el-text-color-primary); }

/* ── Status ── */
.status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
.sg-item { display: flex; flex-direction: column; gap: 2px; padding: 6px 8px; border-radius: 6px; transition: background 0.12s; }
.sg-item:hover { background: var(--el-fill-color-lighter); }
.sg-lbl { font-size: 9px; color: var(--el-text-color-placeholder); text-transform: uppercase; letter-spacing: 0.05em; }
.sg-val { font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--el-text-color-primary); word-break: break-all; }
.screenshot-wrap { margin-top: 10px; }
.screenshot-wrap img { width: 100%; max-height: 110px; object-fit: contain; border-radius: 6px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.screenshot-wrap img:hover { opacity: 0.85; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: scale(1.01); }

/* ── Flow ── */
.flow-box { height: 340px; border-radius: 0 0 10px 10px; overflow: hidden; background: var(--el-fill-color-lighter); border-top: 1px solid var(--el-border-color-lighter); }

/* ── Decisions ── */
.decision-list { max-height: 220px; overflow-y: auto; padding: 0 16px 12px; }
.decision-list::-webkit-scrollbar { width: 3px; }
.decision-list::-webkit-scrollbar-track { background: transparent; }
.decision-list::-webkit-scrollbar-thumb { background: var(--el-border-color); border-radius: 2px; }
.decision-row {
  display: flex; align-items: center; gap: 8px; padding: 6px 8px;
  font-size: 11px; cursor: pointer; border-radius: 4px; transition: all 0.12s cubic-bezier(0.4, 0, 0.2, 1); flex-wrap: wrap;
}
.decision-row:hover { background: var(--el-fill-color-lighter); }
.d-step { font-size: 10px; font-weight: 600; color: var(--el-text-color-placeholder); font-variant-numeric: tabular-nums; min-width: 22px; flex-shrink: 0; }
.d-desc { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--el-text-color-secondary); }
.d-shot { font-size: 10px; color: var(--el-color-primary); cursor: pointer; flex-shrink: 0; transition: opacity 0.12s; }
.d-shot:hover { text-decoration: underline; opacity: 0.8; }
.d-body { width: 100%; margin-top: 6px; padding: 8px; border-radius: 4px; background: var(--el-fill-color-lighter); font-size: 10px; }
.d-block { margin-bottom: 6px; line-height: 1.5; white-space: pre-wrap; color: var(--el-text-color-placeholder); }
.d-block:last-child { margin-bottom: 0; }
.d-img { max-height: 100px; border-radius: 4px; cursor: pointer; transition: opacity 0.15s; }
.d-img:hover { opacity: 0.85; }

/* ── Tags ── */
.tag { display: inline-flex; align-items: center; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 500; flex-shrink: 0; }
.t-info { background: color-mix(in srgb, var(--el-color-primary) 12%, transparent); color: var(--el-color-primary); }
.t-success { background: color-mix(in srgb, var(--el-color-success) 12%, transparent); color: var(--el-color-success); }
.t-danger { background: color-mix(in srgb, var(--el-color-danger) 12%, transparent); color: var(--el-color-danger); }
.t-warning { background: color-mix(in srgb, var(--el-color-warning) 15%, transparent); color: var(--el-color-warning); }
.t-def { background: var(--el-fill-color); color: var(--el-text-color-placeholder); }

/* ── Color utilities ── */
.cw { color: var(--el-color-warning) !important; }
.cg { color: var(--el-color-success) !important; }
.cr { color: var(--el-color-danger) !important; }
.cm { color: var(--el-text-color-placeholder) !important; }

/* ── Overlay ── */
.overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.65);
  animation: overlay-in 0.15s ease;
}
@keyframes overlay-in { from { opacity: 0; } to { opacity: 1; } }
.overlay-close {
  position: absolute; top: 16px; right: 16px;
  width: 36px; height: 36px; border-radius: 50%; border: none;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 22px; cursor: pointer;
  background: rgba(255,255,255,0.1);
  transition: background 0.15s;
}
.overlay-close:hover { background: rgba(255,255,255,0.18); }
.overlay-img {
  max-width: 85vw; max-height: 85vh; border-radius: 10px;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
  animation: overlay-img-in 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes overlay-img-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* ── Empty states ── */
.empty-state { text-align: center; padding: 32px 0; font-size: 12px; color: var(--el-text-color-placeholder); }

/* ── Responsive ── */
@media (max-width: 1024px) {
  .metrics { grid-template-columns: repeat(3, 1fr); }
  .grid-2 { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .metrics { grid-template-columns: repeat(2, 1fr); }
}
</style>