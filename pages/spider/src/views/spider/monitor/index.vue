<template>
  <!-- 有 executionNo 时渲染执行详情页 -->
  <SpiderExecutionDetailPage
    v-if="executionNo"
    :execution-no="executionNo"
    :spider-code="spiderCode"
  />

  <!-- 无 executionNo 时渲染大屏监控 -->
  <section v-else class="ds-wrapper">
    <!-- Background -->
    <div class="ds-wrapper__bg">
      <div class="ds-wrapper__grid" />
      <div class="ds-wrapper__glow ds-wrapper__glow--cyan" />
      <div class="ds-wrapper__glow ds-wrapper__glow--blue" />
      <div class="ds-wrapper__glow ds-wrapper__glow--purple" />
    </div>

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
          @update:last-update="lastUpdate = $event"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import SpiderMonitorPanel from "./SpiderMonitorPanel.vue";
import SpiderExecutionDetailPage from "../execution-detail/SpiderExecutionDetailPage.vue";

const lastUpdate = ref("");
const hashStr = window.location.hash || "";
const hashQuery = hashStr.includes("?") ? hashStr.substring(hashStr.indexOf("?")) : "";
const searchParams = new URLSearchParams(window.location.search + (hashQuery ? "&" + hashQuery : ""));
const spiderCode = ref(searchParams.get("code") || "gitee-explore-500-projects");
const executionNo = ref(searchParams.get("executionNo") || "");
const panelRef = ref<InstanceType<typeof SpiderMonitorPanel>>();
const defsCount = ref(0);

watch(() => panelRef.value?.defs, (v) => { defsCount.value = v?.length ?? 0; }, { deep: true });

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
  background: var(--lay-bg, #0a0e17);
  font-family: "Inter", -apple-system, system-ui, sans-serif;
}

/* ── Background ── */
.ds-wrapper__bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.ds-wrapper__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
}
.ds-wrapper__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(140px);
  opacity: 0.3;
  &--cyan {
    top: -15%;
    right: -5%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(6, 182, 212, 0.15), transparent 70%);
  }
  &--blue {
    bottom: -12%;
    left: -3%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.12), transparent 70%);
  }
  &--purple {
    top: 40%;
    left: 50%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(124, 58, 237, 0.08), transparent 70%);
  }
}

/* ── Content ── */
.ds-wrapper__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 14px 20px 16px;
  gap: 12px;
}

/* ── Top Bar ── */
.ds-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 12px;
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
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--lay-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    color: var(--lay-accent);
  }
}
.ds-topbar__badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.15);
  color: #22d3ee;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  white-space: nowrap;
}
.ds-topbar__divider {
  width: 1px;
  height: 18px;
  background: rgba(255, 255, 255, 0.08);
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
.ds-topbar__defs {
  padding: 2px 10px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.08);
  color: #60a5fa;
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
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--lay-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    color: var(--lay-text-regular);
  }
}

/* ── Panel container: fills remaining space ── */
.ds-wrapper__panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
