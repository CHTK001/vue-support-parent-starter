<template>
  <el-container class="spider-monitor">
    <el-header class="spider-monitor__topbar" height="48px">
      <div class="spider-monitor__topbar-left">
        <el-button text size="small" class="spider-monitor__btn" @click="$router.back()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </el-button>
        <div class="spider-monitor__brand">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span class="spider-monitor__brand-text">智能监控</span>
        </div>
        <code class="spider-monitor__code">{{ spiderCode }}</code>
      </div>
      <div class="spider-monitor__topbar-right">
        <el-select v-model="selectedExecutionNo" size="small" class="spider-monitor__select" @change="onExecutionChange">
          <el-option v-for="exec in executions" :key="exec.spiderExecutionNo"
            :label="`${statusLabel(exec.spiderExecutionStatus)} ${exec.spiderExecutionNo.slice(0, 12)} ${formatTime(exec.spiderStartedAt)}`"
            :value="exec.spiderExecutionNo" />
        </el-select>
        <el-button v-if="selectedExecutionNo" size="small" text class="spider-monitor__btn" @click="openDetailPage">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          详情
        </el-button>
        <span class="spider-monitor__chip">{{ defsCount }} 个定义</span>
        <span class="spider-monitor__time">{{ lastUpdate }}</span>
        <el-button size="small" text class="spider-monitor__btn" @click="refresh">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </el-button>
      </div>
    </el-header>
    <el-main class="spider-monitor__main">
      <SpiderMonitorPanel ref="panelRef" :spider-code="spiderCode" :execution-no="selectedExecutionNo"
        @update:last-update="lastUpdate = $event" />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import SpiderMonitorPanel from "./SpiderMonitorPanel.vue";
import { listSpiderExecutionRecords, listSpiderDefinitions } from "../../../api/spider";

const lastUpdate = ref("");
const hashStr = window.location.hash || "";
const hashQuery = hashStr.includes("?") ? hashStr.substring(hashStr.indexOf("?")) : "";
const searchParams = new URLSearchParams(
  window.location.search + (hashQuery ? "&" : "") + (hashQuery ? hashQuery.slice(1) : "")
);
const spiderCode = ref(searchParams.get("code") || "gitee-explore-agent");
const executionNoFromUrl = ref(searchParams.get("executionNo") || "");
const selectedExecutionNo = ref(executionNoFromUrl.value);
const panelRef = ref<InstanceType<typeof SpiderMonitorPanel>>();
const defsCount = ref(0);
const executions = ref<import("../../../types/orchestration").SpiderExecutionRecordView[]>([]);

async function loadExecutions() {
  try {
    const [list, defs] = await Promise.all([
      listSpiderExecutionRecords(spiderCode.value, undefined, 50).catch(
        () => [] as import("../../../types/orchestration").SpiderExecutionRecordView[]
      ),
      listSpiderDefinitions().catch(() => []),
    ]);
    executions.value = list || [];
    defsCount.value = Array.isArray(defs) ? defs.length : 0;
    if (
      executions.value.length &&
      (!selectedExecutionNo.value ||
        !executions.value.some(e => e.spiderExecutionNo === selectedExecutionNo.value))
    ) {
      selectedExecutionNo.value = executions.value[0].spiderExecutionNo;
    }
  } catch {
    executions.value = [];
  }
}
onMounted(() => {
  loadExecutions();
});

function statusLabel(status?: string) {
  if (!status) return "未知";
  const map: Record<string, string> = {
    RUNNING: "▶",
    SUCCESS: "✓",
    FAILED: "✗",
    WAITING: "○",
    STOPPED: "⊘",
    PAUSED: "Ⅱ",
    WAIT_MANUAL: "!",
  };
  return map[status] || status;
}

function formatTime(t?: string) {
  if (!t) return "";
  try {
    const d = new Date(t);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return t || "";
  }
}

function onExecutionChange() {
  const url = new URL(window.location.href);
  if (selectedExecutionNo.value) url.searchParams.set("executionNo", selectedExecutionNo.value);
  else url.searchParams.delete("executionNo");
  window.history.replaceState({}, "", url.toString());
  panelRef.value?.loadData();
}

function openDetailPage() {
  if (!selectedExecutionNo.value) return;
  window.open(
    `/spider/monitor?code=${encodeURIComponent(spiderCode.value)}&executionNo=${encodeURIComponent(selectedExecutionNo.value)}`,
    "_blank"
  );
}

function refresh() {
  panelRef.value?.loadData();
  loadExecutions();
}
</script>

<style scoped>
/* ── Layout ────────────────────────── */
.spider-monitor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
}

.spider-monitor__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px !important;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.spider-monitor__topbar-left,
.spider-monitor__topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Buttons ───────────────────────── */
.spider-monitor__btn {
  --el-button-size: 28px;
  color: var(--el-text-color-secondary);
}
.spider-monitor__btn:hover {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
}

/* ── Brand ─────────────────────────── */
.spider-monitor__brand {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.spider-monitor__brand svg {
  color: var(--el-text-color-primary);
}

.spider-monitor__code {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  font-family: "SF Mono", "Fira Code", "Consolas", monospace;
  background: var(--el-fill-color-light);
  padding: 1px 6px;
  border-radius: 4px;
}

/* ── Select ────────────────────────── */
.spider-monitor__select {
  width: 180px;
}
.spider-monitor__select :deep(.el-select__wrapper) {
  min-height: 28px;
  padding: 0 8px;
}
.spider-monitor__select :deep(.el-select__placeholder) {
  font-size: 11px;
}

/* ── Meta ──────────────────────────── */
.spider-monitor__chip {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 1px 6px;
  border-radius: 4px;
}

.spider-monitor__time {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* ── Main ──────────────────────────── */
.spider-monitor__main {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow: hidden;
}
</style>