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
          <el-tooltip content="全景大屏" placement="bottom">
            <el-button class="dl-fullscreen-btn" :icon="FullScreen" circle text @click="bigscreenVisible = true" />
          </el-tooltip>
        </div>
      </div>
    </header>
    <main class="dl-content">
      <router-view />
    </main>

    <!-- 全屏大屏弹窗 -->
    <el-dialog v-model="bigscreenVisible" fullscreen :show-close="false" class="bigscreen-dialog">
      <template #header>
        <div class="bigscreen-dialog-header">
          <span />
          <el-button :icon="Close" circle text @click="bigscreenVisible = false" />
        </div>
      </template>
      <DatalakeBigscreenPage />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref } from "vue";
import { DataAnalysis, Search, Bell, Monitor, MessageBox, DataBoard, FullScreen, Close } from "@element-plus/icons-vue";
import DatalakeBigscreenPage from "./views/bigscreen/index.vue";

defineOptions({ name: "DatalakeApp" });

const route = useRoute();
const bigscreenVisible = ref(false);
const tabs = [
  { path: "/datalake/bigscreen", label: "全景大屏",   icon: DataBoard },
  { path: "/datalake/pipeline", label: "流水线管理", icon: DataAnalysis },
  { path: "/datalake/data",      label: "数据查询",   icon: Search },
  { path: "/datalake/subscription", label: "订阅管理", icon: Bell },
  { path: "/datalake/monitor",   label: "监控面板",   icon: Monitor },
  { path: "/datalake/dlq",       label: "死信队列",   icon: MessageBox },
];

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + "/");
}
</script>

<style>
html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #060a14; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
#app { height: 100%; }
:root {
  --el-bg-color: #060a14; --el-bg-color-overlay: #0b1020; --el-fill-color: #0e1628;
  --el-fill-color-light: #121b30; --el-fill-color-lighter: #162038; --el-border-color: #1e2a45;
  --el-text-color-primary: #e2e8f0; --el-text-color-regular: #c8d0dc; --el-text-color-secondary: #8892a8;
  --el-text-color-placeholder: #5a6478; --el-color-primary: #3b82f6; --el-color-primary-light-3: #60a5fa;
  --el-color-success: #22c55e; --el-color-warning: #f59e0b; --el-color-danger: #ef4444;
  --el-bg-color-page: #060a14;
}
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
.datalake-shell { height: 100vh; display: flex; flex-direction: column; overflow: hidden; background: #060a14; }
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
.dl-content { flex: 1; min-height: 0; overflow: auto; padding: 16px 20px; background: #060a14; }
.pipeline-graph-page { height: 100% !important; min-height: auto !important; }

/* ── 全屏大屏弹窗 ── */
.bigscreen-dialog {
  background: #060a14 !important;
}
.bigscreen-dialog .el-dialog__header {
  position: fixed; top: 0; right: 0; z-index: 999; padding: 12px; margin: 0;
}
.bigscreen-dialog .el-dialog__body {
  height: 100vh; padding: 0; overflow: hidden; background: #060a14;
}
.bigscreen-dialog-header {
  display: flex; align-items: center; justify-content: space-between; width: 100%;
}
</style>
