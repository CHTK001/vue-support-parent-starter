<template>
  <section class="ds-wrapper">
    <!-- Content -->
    <div class="ds-wrapper__content">
      <!-- Top Bar -->
      <header class="ds-topbar">
        <div class="ds-topbar__left">
          <button type="button" class="ds-topbar__back" title="返回" @click="$router.back()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          </button>
          <span class="ds-topbar__badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            智能监控
          </span>
          <span class="ds-topbar__divider" />
          <span class="ds-topbar__code">{{ spiderCode }}</span>
        </div>
        <div class="ds-topbar__right">
          <!-- 执行编号选择器 -->
          <div class="ds-topbar__exec-select">
            <select v-model="selectedExecutionNo" @change="onExecutionChange">
              <option v-for="exec in executions" :key="exec.spiderExecutionNo" :value="exec.spiderExecutionNo">
                {{ statusLabel(exec.spiderExecutionStatus) }} {{ exec.spiderExecutionNo.slice(0, 16) }} {{ formatTime(exec.spiderStartedAt) }}
              </option>
            </select>
          </div>
          <!-- 查看详情按钮 -->
          <button v-if="selectedExecutionNo" type="button" class="ds-topbar__detail-btn" title="查看执行详情" @click="openDetailPage">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            详情
          </button>
          <span class="ds-topbar__defs">{{ defsCount }} 个定义</span>
          <span class="ds-topbar__time">{{ lastUpdate }}</span>
          <button type="button" class="ds-topbar__refresh" title="刷新" @click="refresh">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
          </button>
        </div>
      </header>

      <!-- Dashboard Panel -->
      <div class="ds-wrapper__panel">
        <SpiderMonitorPanel
          ref="panelRef"
          :spider-code="spiderCode"
          :execution-no="selectedExecutionNo"
          @update:last-update="lastUpdate = $event"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import SpiderMonitorPanel from "./SpiderMonitorPanel.vue";
import { listSpiderExecutionRecords } from "../../../api/spider";

const lastUpdate = ref("");
const hashStr = window.location.hash || "";
const hashQuery = hashStr.includes("?") ? hashStr.substring(hashStr.indexOf("?")) : "";
const searchParams = new URLSearchParams(window.location.search + (hashQuery ? "&" : "") + (hashQuery ? hashQuery.slice(1) : ""));
const spiderCode = ref(searchParams.get("code") || "gitee-explore-agent");
const executionNoFromUrl = ref(searchParams.get("executionNo") || "");
const selectedExecutionNo = ref(executionNoFromUrl.value);
const panelRef = ref<InstanceType<typeof SpiderMonitorPanel>>();
const defsCount = ref(0);
const executions = ref<import("../../../types/orchestration").SpiderExecutionRecordView[]>([]);

// 重试加载执行列表，最多 5 次；加载后自动选中最新执行
async function loadExecutions() {
  for (let i = 0; i < 5; i++) {
    try {
      const list = await listSpiderExecutionRecords(spiderCode.value, undefined, 50);
      if (list && list.length > 0) {
        executions.value = list;
        if (!selectedExecutionNo.value || !list.some(e => e.spiderExecutionNo === selectedExecutionNo.value)) {
          selectedExecutionNo.value = list[0].spiderExecutionNo;
          onExecutionChange();
        }
        return;
      }
    } catch { /* retry */ }
    await new Promise(r => setTimeout(r, 2000));
  }
}

onMounted(loadExecutions);

function statusLabel(status?: string) {
  if (!status) return "未知";
  const map: Record<string, string> = {
    RUNNING: "▶", SUCCESS: "✓", FAILED: "✗",
    WAITING: "○", STOPPED: "⊘",
  };
  return map[status] || status;
}

function formatTime(t?: string) {
  if (!t) return "";
  try {
    const d = new Date(t);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  } catch { return t || ""; }
}

function onExecutionChange() {
  const url = new URL(window.location.href);
  if (selectedExecutionNo.value) {
    url.searchParams.set("executionNo", selectedExecutionNo.value);
  } else {
    url.searchParams.delete("executionNo");
  }
  window.history.replaceState({}, "", url.toString());
  panelRef.value?.loadData();
}

function openDetailPage() {
  if (!selectedExecutionNo.value) return;
  window.open(`/spider/monitor?code=${encodeURIComponent(spiderCode.value)}&executionNo=${encodeURIComponent(selectedExecutionNo.value)}`, "_blank");
}

function refresh() {
  panelRef.value?.loadData();
}
</script>

<style scoped lang="scss">
.ds-wrapper {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--lay-bg, #060a14);
  font-family: "Inter", -apple-system, system-ui, sans-serif;
}

/* ── Content ── */
.ds-wrapper__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 10px 14px 14px;
  gap: 10px;
}

/* ── Top Bar ── */
.ds-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 12px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(0, 180, 255, 0.03);
  border: 1px solid rgba(0, 180, 255, 0.08);
}
.ds-topbar__left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ds-topbar__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(0, 180, 255, 0.12);
  border-radius: 6px;
  background: rgba(0, 180, 255, 0.04);
  color: var(--lay-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: rgba(0, 180, 255, 0.35);
    color: #00b4ff;
  }
}
.ds-topbar__badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(0, 180, 255, 0.08);
  border: 1px solid rgba(0, 180, 255, 0.15);
  color: #00d4ff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  white-space: nowrap;
}
.ds-topbar__divider {
  width: 1px;
  height: 18px;
  background: rgba(0, 180, 255, 0.1);
}
.ds-topbar__code {
  font-size: 13px;
  font-weight: 500;
  color: var(--lay-text-placeholder);
  font-family: monospace;
}
.ds-topbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ds-topbar__exec-select select {
  height: 28px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid rgba(0, 180, 255, 0.12);
  background: rgba(0, 180, 255, 0.04);
  color: var(--lay-text-regular, #c0c4d0);
  font-size: 11px;
  font-family: monospace;
  cursor: pointer;
  outline: none;
  min-width: 200px;
  &:hover { border-color: rgba(0, 180, 255, 0.35); }
  &:focus { border-color: rgba(0, 180, 255, 0.5); }
  option { background: #0a1020; color: #c0c4d0; }
}
.ds-topbar__detail-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid rgba(0, 180, 255, 0.2);
  background: rgba(0, 180, 255, 0.06);
  color: #00d4ff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  &:hover {
    background: rgba(0, 180, 255, 0.12);
    border-color: rgba(0, 180, 255, 0.4);
  }
}
.ds-topbar__defs {
  padding: 2px 10px;
  border-radius: 12px;
  background: rgba(0, 180, 255, 0.06);
  color: #00b4ff;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}
.ds-topbar__time {
  font-size: 11px;
  color: var(--lay-text-placeholder);
  font-variant-numeric: tabular-nums;
}
.ds-topbar__refresh {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(0, 180, 255, 0.12);
  border-radius: 6px;
  background: rgba(0, 180, 255, 0.04);
  color: var(--lay-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: rgba(0, 180, 255, 0.35);
    color: #00b4ff;
  }
}

/* ── Panel container ── */
.ds-wrapper__panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
