<template>
  <div class="datalake-shell">
    <header class="dl-header">
      <div class="dl-header-inner">
        <div class="dl-brand">
          <svg class="dl-brand-icon" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
          <span class="dl-brand-text">数据中台</span>
        </div>
        <nav class="dl-nav">
          <router-link v-for="t in tabs" :key="t.path" :to="t.path" class="dl-nav-item" :class="{ active: isActive(t.path) }">
            <el-icon :size="18"><component :is="t.icon" /></el-icon>
            <span>{{ t.label }}</span>
          </router-link>
        </nav>
        <div class="dl-status">
          <span class="dl-status-dot" />
          <span class="dl-status-text">系统运行中</span>
          <el-divider direction="vertical" />
          <span class="dl-time">{{ currentTime }}</span>
          <el-tooltip content="刷新当前页面" placement="bottom">
            <el-button :icon="Refresh" circle text @click="handleRefresh" />
          </el-tooltip>
        </div>
      </div>
    </header>
    <main class="dl-content">
      <router-view :key="refreshKey" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { DataAnalysis, Search, Bell, Monitor, DataBoard, Refresh, Connection, MessageBox, Setting } from "@element-plus/icons-vue";

defineOptions({ name: "DatalakeApp" });

const route = useRoute();
const tabs = [
  { path: "/datalake/bigscreen",     label: "全景大屏", icon: DataBoard },
  { path: "/datalake/pipeline",      label: "流水线",   icon: DataAnalysis },
  { path: "/datalake/data",          label: "数据查询", icon: Search },
  { path: "/datalake/collector",     label: "采集端",   icon: Connection },
  { path: "/datalake/subscription",  label: "订阅客户端", icon: Bell },
  { path: "/datalake/dlq",           label: "死信队列", icon: MessageBox },
];

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + "/");
}

// ── 时钟 ──
const currentTime = ref("");
let clockTimer: ReturnType<typeof setInterval> | null = null;

function updateTime() {
  const now = new Date();
  currentTime.value = now.toLocaleString("zh-CN", { hour12: false });
}

onMounted(() => {
  updateTime();
  clockTimer = setInterval(updateTime, 1000);
});

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer);
});

// ── 页面刷新 ──
const refreshKey = ref(0);
function handleRefresh() {
  refreshKey.value++;
}
</script>

<style>
html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #060a14; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
#app { height: 100%; }
:root {
  --el-bg-color: #080c18; --el-bg-color-overlay: #0b1020; --el-fill-color: #0e1628;
  --el-fill-color-light: #121b30; --el-fill-color-lighter: #162038; --el-border-color: #1e2a45;
  --el-text-color-primary: #e2e8f0; --el-text-color-regular: #c8d0dc; --el-text-color-secondary: #8892a8;
  --el-text-color-placeholder: #5a6478; --el-color-primary: #3b82f6; --el-color-primary-light-3: #60a5fa;
  --el-color-success: #22c55e; --el-color-warning: #f59e0b; --el-color-danger: #ef4444;
  --el-bg-color-page: #080c18;
  /* Shared design tokens */
  --dl-bg: #080c18;
  --dl-surface: rgba(12, 22, 44, 0.85);
  --dl-border: rgba(0, 180, 255, 0.08);
  --dl-border-strong: rgba(0, 180, 255, 0.2);
  --dl-text-dim: #94a3b8;
  --dl-text-mute: #5a6478;
  --dl-accent: #38bdf8;
}
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
.datalake-shell { height: 100vh; display: flex; flex-direction: column; overflow: hidden; background: var(--dl-bg); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='0.6' fill='%2338bdf8' opacity='0.05'/%3E%3C/svg%3E"); }
/* 全局扫描线叠加 */
.datalake-shell::after {
  content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 9999;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 180, 255, 0.015) 2px, rgba(0, 180, 255, 0.015) 4px);
}
.dl-header { flex-shrink: 0; background: rgba(11,15,34,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(30,42,69,0.6); z-index: 100; }
.dl-header-inner { display: flex; align-items: center; height: 56px; padding: 0 24px; gap: 32px; }
.dl-brand { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.dl-brand-icon { color: #3b82f6; filter: drop-shadow(0 0 6px rgba(59,130,246,0.5)); }
.dl-brand-text { font-size: 17px; font-weight: 700; color: #e2e8f0; letter-spacing: 0.02em; }
.dl-nav { display: flex; align-items: center; gap: 2px; flex: 1; }
.dl-nav-item { display: flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; color: #8892a8; text-decoration: none; transition: all .2s; cursor: pointer; white-space: nowrap; }
.dl-nav-item:hover { color: #c8d0dc; background: rgba(255,255,255,0.04); }
.dl-nav-item.active { color: #e2e8f0; background: rgba(59,130,246,0.12); }
.dl-nav-item.active .el-icon { color: #3b82f6; }
.dl-status { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.dl-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.6); animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.dl-status-text { font-size: 12px; color: #5a6478; }
.dl-fullscreen-btn { color: #5a6478; transition: color .2s, background .2s; }
.dl-fullscreen-btn:hover { color: #3b82f6; background: rgba(59,130,246,0.1); }
.dl-content { flex: 1; min-height: 0; overflow: auto; padding: 16px 20px; }
.dl-time {
  font-size: 13px;
  font-weight: 500;
  color: #5a6478;
  font-family: "Courier New", monospace;
  letter-spacing: 0.03em;
  margin-right: 4px;
}
.pipeline-graph-page { height: 100% !important; min-height: auto !important; }
</style>
