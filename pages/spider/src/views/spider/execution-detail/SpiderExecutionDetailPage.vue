<template>
  <section class="exec-detail">
    <div class="exec-detail__bg">
      <div class="exec-detail__grid" />
      <div class="exec-detail__glow exec-detail__glow--cyan" />
      <div class="exec-detail__glow exec-detail__glow--blue" />
    </div>

    <div class="exec-detail__content">
      <!-- Header -->
      <ExecutionHeaderBar
        v-model="debugMode"
        :definition-name="detail?.spiderDefinitionCode"
        :execution-no="detail?.spiderExecutionNo"
        :status="detail?.spiderExecutionStatus"
        :start-time="startTime"
        :duration="duration"
        :step-done="stepDone"
        :step-total="stepTotal"
        @refresh="loadAll"
      />

      <!-- Tab Bar -->
      <div class="exec-detail__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="exec-detail__tab"
          :class="{ 'is-active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <span class="exec-detail__tab-icon">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="exec-detail__tab-content">
        <!-- Flow -->
        <ExecutionFlowPanel
          v-show="activeTab === 'flow'"
          :schema="schema"
          :steps="detail?.spiderSteps || []"
          :selected-node-id="selectedNodeId"
          @select-node="onSelectNode"
        />

        <!-- Steps Timeline -->
        <ExecutionStepPanel
          v-show="activeTab === 'steps'"
          :events="events"
        />

        <!-- Data Records -->
        <ExecutionDataPanel
          v-show="activeTab === 'data'"
          :records="parseResults"
        />

        <!-- Raw Log -->
        <div v-show="activeTab === 'log'" class="exec-detail__log">
          <div class="exec-detail__log-header">
            <span class="exec-detail__log-title">原始日志</span>
            <span class="exec-detail__log-count">{{ events.length }} 条事件</span>
          </div>
          <div class="exec-detail__log-body">
            <div v-if="events.length === 0" class="exec-detail__empty">暂无日志</div>
            <div v-else v-for="(evt, idx) in sortedEvents" :key="idx" class="exec-detail__log-entry">
              <span class="exec-detail__log-time">{{ formatTime(evt.spiderEventTime) }}</span>
              <span class="exec-detail__log-type">{{ evt.spiderEventType }}</span>
              <span class="exec-detail__log-node">{{ evt.spiderNodeName }}</span>
              <span class="exec-detail__log-msg">{{ evt.spiderMessage }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step Detail Drawer -->
    <StepDetailDrawer
      :visible="drawerVisible"
      :step="selectedStep"
      :decisions="agentDecisions"
      @close="drawerVisible = false"
    />

    <!-- Error Toast -->
    <Teleport to="body">
      <div v-if="error" class="exec-detail__toast" @click="error = ''">
        ⚠ {{ error }}
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, provide } from "vue";
import type {
  SpiderExecutionDetailView,
  SpiderExecutionEventView,
  SpiderExecutionStepView,
  SpiderFlowSchema,
  SpiderAgentDecisionView,
} from "../../../../types/orchestration";
import type { SpiderParseResultView } from "../../../api/spider";

import {
  getSpiderExecutionDetail,
  getSpiderExecutionEvents,
  listSpiderParseResults,
  getSpiderOrchestrationSchema,
  getSpiderAgentDecisions,
  getSpiderExecutionScreenshots,
} from "../../../api/spider";

import ExecutionHeaderBar from "./components/ExecutionHeaderBar.vue";
import ExecutionFlowPanel from "./components/ExecutionFlowPanel.vue";
import ExecutionStepPanel from "./components/ExecutionStepPanel.vue";
import ExecutionDataPanel from "./components/ExecutionDataPanel.vue";
import StepDetailDrawer from "./components/StepDetailDrawer.vue";

const props = defineProps<{
  executionNo: string;
  spiderCode: string;
}>();

// ── State ──
const debugMode = ref(false);
provide("debugMode", debugMode);

const activeTab = ref("flow");
const detail = ref<SpiderExecutionDetailView | null>(null);
const events = ref<SpiderExecutionEventView[]>([]);
const parseResults = ref<SpiderParseResultView[]>([]);
const schema = ref<SpiderFlowSchema | null>(null);
const screenshots = ref<any[]>([]);
const agentDecisions = ref<SpiderAgentDecisionView[]>([]);
const selectedNodeId = ref<string | null>(null);
const drawerVisible = ref(false);
const error = ref("");
const eventSource = ref<EventSource | null>(null);

let refreshTimer: ReturnType<typeof setInterval> | null = null;

const tabs = [
  { key: "flow", label: "流程图", icon: "◈" },
  { key: "steps", label: "事件", icon: "≡" },
  { key: "data", label: "数据", icon: "⊞" },
  { key: "log", label: "日志", icon: "⎔" },
];

// ── Computed ──
const selectedStep = computed<SpiderExecutionStepView | null>(() => {
  if (!selectedNodeId.value || !detail.value?.spiderSteps) return null;
  return detail.value.spiderSteps.find((s) => s.spiderNodeCode === selectedNodeId.value) || null;
});

const stepTotal = computed(() => detail.value?.spiderSteps?.length || 0);
const stepDone = computed(() => {
  if (!detail.value?.spiderSteps) return 0;
  return detail.value.spiderSteps.filter(
    (s) => s.spiderStepStatus === "SUCCESS" || s.spiderStepStatus === "FAILED",
  ).length;
});

const startTime = computed(() => {
  if (!detail.value?.spiderSteps?.length) return undefined;
  const first = detail.value.spiderSteps[0];
  return first.spiderStartedAt || undefined;
});

const duration = computed(() => {
  if (!detail.value?.spiderSteps?.length) return undefined;
  const starts = detail.value.spiderSteps
    .map((s) => s.spiderStartedAt)
    .filter(Boolean)
    .map((t) => new Date(t!).getTime());
  const finishes = detail.value.spiderSteps
    .filter((s) => s.spiderStepStatus === "SUCCESS" || s.spiderStepStatus === "FAILED")
    .map((s) => s.spiderFinishedAt)
    .filter(Boolean)
    .map((t) => new Date(t!).getTime());

  if (starts.length === 0) return undefined;
  const minStart = Math.min(...starts);
  const maxFinish = finishes.length > 0 ? Math.max(...finishes) : Date.now();
  const ms = maxFinish - minStart;
  if (ms < 1000) return ms + "ms";
  if (ms < 60000) return (ms / 1000).toFixed(1) + "s";
  return Math.floor(ms / 60000) + "m " + Math.floor((ms % 60000) / 1000) + "s";
});

const sortedEvents = computed(() => {
  return [...events.value].sort((a, b) => {
    const ta = a.spiderEventTime || "";
    const tb = b.spiderEventTime || "";
    return ta.localeCompare(tb);
  });
});

// ── Methods ──
async function loadAll() {
  try {
    const [execDetail, execEvents, execParseResults, execSchema, execDecisions, execScreenshots] =
      await Promise.all([
        getSpiderExecutionDetail(props.executionNo).catch(() => null),
        getSpiderExecutionEvents(props.executionNo).catch(() => [] as SpiderExecutionEventView[]),
        listSpiderParseResults(props.spiderCode, props.executionNo).catch(() => [] as SpiderParseResultView[]),
        getSpiderOrchestrationSchema(props.spiderCode, 1).catch(() => null),
        getSpiderAgentDecisions(props.executionNo).catch(() => [] as SpiderAgentDecisionView[]),
        getSpiderExecutionScreenshots(props.executionNo).catch(() => []),
      ]);

    if (execDetail) detail.value = execDetail;
    events.value = execEvents || [];
    parseResults.value = execParseResults || [];
    if (execSchema) schema.value = execSchema;
    agentDecisions.value = execDecisions || [];
    screenshots.value = execScreenshots || [];
    error.value = "";
  } catch (e: any) {
    error.value = String(e?.message || e);
  }
}

function onSelectNode(nodeId: string) {
  selectedNodeId.value = nodeId;
  if (detail.value?.spiderSteps?.some((s) => s.spiderNodeCode === nodeId)) {
    drawerVisible.value = true;
  }
}

function formatTime(t?: string): string {
  if (!t) return "-";
  try {
    return new Date(t).toLocaleTimeString();
  } catch {
    return t;
  }
}

// ── SSE ──
function connectSSE() {
  const baseUrl = "/spider-api";
  const url = `${baseUrl}/spider/executions/stream`;
  const es = new EventSource(url);
  eventSource.value = es;

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data?.spiderExecutionNo === props.executionNo) {
        loadAll();
      }
    } catch { /* ignore */ }
  };

  es.onerror = () => {
    es.close();
    eventSource.value = null;
  };
}

// ── Lifecycle ──
onMounted(() => {
  loadAll();
  connectSSE();
  refreshTimer = setInterval(loadAll, 10000);
});

onBeforeUnmount(() => {
  if (eventSource.value) {
    eventSource.value.close();
    eventSource.value = null;
  }
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
});
</script>

<style scoped>
.exec-detail {
  background: var(--lay-bg);
  font-family: "Inter", -apple-system, system-ui, sans-serif;
  min-height: 100vh;
}
.exec-detail__bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.exec-detail__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
  background-size: 44px 44px;
}
.exec-detail__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.35;
}
.exec-detail__glow--cyan {
  top: -12%;
  right: -5%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(6,182,212,0.18), transparent 70%);
}
.exec-detail__glow--blue {
  bottom: -10%;
  left: -3%;
  width: 450px;
  height: 450px;
  background: radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%);
}
.exec-detail__content {
  position: relative;
  z-index: 1;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Tabs */
.exec-detail__tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
  width: fit-content;
}
.exec-detail__tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--lay-text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.exec-detail__tab:hover {
  color: var(--lay-text-primary);
  background: rgba(255,255,255,0.04);
}
.exec-detail__tab.is-active {
  background: rgba(34,211,238,0.08);
  color: #22d3ee;
  box-shadow: 0 0 12px rgba(34,211,238,0.08);
}
.exec-detail__tab-icon {
  font-size: 14px;
}
.exec-detail__tab-content {
  min-height: 300px;
}

/* Log Tab */
.exec-detail__log {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.exec-detail__log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.exec-detail__log-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--lay-text-primary);
}
.exec-detail__log-count {
  font-size: 10px;
  color: var(--lay-text-placeholder);
}
.exec-detail__log-body {
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
  padding: 12px;
  max-height: 500px;
  overflow-y: auto;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 11px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.exec-detail__empty {
  text-align: center;
  padding: 24px;
  color: var(--lay-text-placeholder);
}
.exec-detail__log-entry {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 3px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}
.exec-detail__log-entry:hover {
  background: rgba(255,255,255,0.03);
}
.exec-detail__log-time {
  color: var(--lay-text-placeholder);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.exec-detail__log-type {
  padding: 0 6px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
  background: rgba(99,102,241,0.1);
  color: #818cf8;
  flex-shrink: 0;
  text-transform: uppercase;
}
.exec-detail__log-node {
  color: #22d3ee;
  font-weight: 500;
  flex-shrink: 0;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.exec-detail__log-msg {
  color: var(--lay-text-secondary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Toast */
.exec-detail__toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 10px;
  background: rgba(244,67,54,0.12);
  border: 1px solid rgba(244,67,54,0.2);
  color: #f44336;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  z-index: 9999;
  backdrop-filter: blur(8px);
  animation: toast-in 0.3s ease-out;
}
@keyframes toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
