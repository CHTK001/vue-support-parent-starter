<template>
  <section class="spider-monitor">
    <div class="spider-monitor__bg">
      <div class="spider-monitor__grid" />
      <div class="spider-monitor__glow spider-monitor__glow--cyan" />
      <div class="spider-monitor__glow spider-monitor__glow--blue" />
    </div>

    <div class="spider-monitor__content">
      <!-- Header -->
      <header class="spider-monitor__header">
        <div class="spider-monitor__header-left">
          <button type="button" class="spider-monitor__back-btn" title="返回" @click="$router.back()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div class="spider-monitor__badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            MONITOR
          </div>
          <h1 class="spider-monitor__title">智能监控</h1>
          <span class="spider-monitor__ts">{{ lastUpdate }}</span>
        </div>
        <div class="spider-monitor__actions">
          <span class="spider-monitor__def-badge">{{ defsCount }} 个定义</span>
          <template v-if="executionNo">
            <span class="spider-monitor__exec-badge" :class="'is-' + (currentStatus || '').toLowerCase()">
              #{{ executionNo.slice(-8) }}
              {{ statusLabel }}
            </span>
            <button type="button" class="spider-monitor__history-btn" @click="showHistory">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              历史记录
            </button>
          </template>
          <button type="button" class="spider-monitor__refresh-btn" @click="refresh">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
        </div>
      </header>

      <!-- Monitor Panel -->
      <SpiderMonitorPanel
        ref="panelRef"
        :spider-code="spiderCode"
        :execution-no="executionNo"
        @update:last-update="lastUpdate = $event"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import SpiderMonitorPanel from "./SpiderMonitorPanel.vue";

const lastUpdate = ref("加载中...");
const spiderCode = ref(new URLSearchParams(window.location.search).get("code") || "gitee-explore-1000-projects");
const executionNo = ref(new URLSearchParams(window.location.search).get("executionNo") || "");
const panelRef = ref<InstanceType<typeof SpiderMonitorPanel>>();
const defsCount = ref(0);
const currentStatus = ref("");

const statusLabel = computed(() =>
  ({RUNNING:"运行中",SUCCESS:"已完成",FAILED:"失败",WAITING:"等待中"})[currentStatus.value] || currentStatus.value
);

// 每次面板数据刷新后同步 header 状态
watch(() => panelRef.value?.defs, (v) => { defsCount.value = v?.length ?? 0; }, { deep: true });
watch(() => panelRef.value?.execs, (v) => {
  if (v && v.length > 0) currentStatus.value = v[0].spiderExecutionStatus;
}, { deep: true });

function showHistory() {
  const params = new URLSearchParams(window.location.search);
  params.delete("executionNo");
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  location.reload();
}

function refresh() {
  panelRef.value?.loadData();
}
</script>

<style scoped lang="scss">
.spider-monitor {
  background: var(--lay-bg);
  font-family: "Inter", -apple-system, system-ui, sans-serif;
  min-height: 100vh;
}
.spider-monitor__bg {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
}
.spider-monitor__grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
  background-size: 44px 44px;
}
.spider-monitor__glow {
  position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.35;
  &--cyan { top: -12%; right: -5%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(6,182,212,0.18), transparent 70%); }
  &--blue { bottom: -10%; left: -3%; width: 450px; height: 450px; background: radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%); }
}
.spider-monitor__content {
  position: relative; z-index: 1; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px;
}
.spider-monitor__header {
  display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;
}
.spider-monitor__header-left {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.spider-monitor__back-btn {
  display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;
  border: 1px solid var(--lay-border-light); border-radius: 8px; background: transparent;
  color: var(--lay-text-secondary); cursor: pointer; transition: all 0.2s;
  &:hover { border-color: color-mix(in srgb, var(--lay-accent) 20%, transparent); color: var(--lay-accent); }
}
.spider-monitor__badge {
  display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 10px;
  border-radius: 999px; background: color-mix(in srgb, var(--lay-accent) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--lay-accent) 15%, transparent);
  color: color-mix(in srgb, var(--lay-accent) 80%, white); font-size: 9px; font-weight: 700; letter-spacing: 0.12em;
  svg { width: 11px; height: 11px; }
}
.spider-monitor__title {
  margin: 0; font-size: 24px; font-weight: 800; color: var(--lay-text-primary); letter-spacing: -0.03em;
}
.spider-monitor__ts {
  font-size: 11px; color: var(--lay-text-placeholder);
}
.spider-monitor__actions {
  display: flex; align-items: center; gap: 10px;
}
.spider-monitor__def-badge {
  padding: 2px 12px; border-radius: 12px; background: rgba(59,130,246,0.1);
  color: #60a5fa; font-size: 11px; font-weight: 600; white-space: nowrap;
}
.spider-monitor__exec-badge {
  padding: 2px 10px; border-radius: 12px;
  font-size: 11px; font-weight: 600; white-space: nowrap;
  background: rgba(255,152,0,0.12); color: #ff9800;
}
.spider-monitor__exec-badge.is-success { background: rgba(76,175,80,0.12); color: #4caf50; }
.spider-monitor__exec-badge.is-failed { background: rgba(244,67,54,0.12); color: #f44336; }
.spider-monitor__exec-badge.is-waiting { background: rgba(158,158,158,0.12); color: #9e9e9e; }
.spider-monitor__history-btn {
  display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 10px;
  border: 1px solid var(--lay-border-light); border-radius: 6px; background: transparent;
  color: var(--lay-text-secondary); font-size: 11px; cursor: pointer; white-space: nowrap;
  transition: all 0.2s;
}
.spider-monitor__history-btn:hover { border-color: var(--lay-accent); color: var(--lay-accent); }
.spider-monitor__refresh-btn {
  display: grid; place-items: center; width: 36px; height: 36px;
  border: 1px solid var(--lay-border-light); border-radius: 10px;
  background: var(--lay-surface-bg); color: var(--lay-text-secondary); cursor: pointer; transition: all 0.2s;
  &:hover { border-color: color-mix(in srgb, var(--lay-accent) 30%, transparent); color: var(--lay-text-regular); }
}
</style>
