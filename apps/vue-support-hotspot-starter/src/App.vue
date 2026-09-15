<template>
  <div class="apm-root">
    <aside class="apm-sider">
      <div class="brand">
        <div class="brand-logo">
          <el-icon :size="22"><DataAnalysis /></el-icon>
        </div>
        <div class="brand-text">
          <div class="brand-title">APM 热点观测</div>
          <div class="brand-sub">Hotsport Console</div>
        </div>
      </div>
      <nav class="apm-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="apm-nav-item"
          :class="{ active: $route.path === item.path || (item.path === '/traces' && $route.path.startsWith('/traces')) }"
        >
          <el-icon :size="18"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="apm-footer">
        <div class="agent-dot" :class="{ on: agentActive }"></div>
        <span>Agent {{ agentActive ? "已连接" : "未注入" }}</span>
        <span class="footer-version">v4.0.0.42</span>
      </div>
    </aside>
    <main class="apm-main">
      <header class="apm-header">
        <h1>{{ currentTitle }}</h1>
        <div class="apm-header-right">
          <el-input
            ref="searchInput"
            v-model="globalSearch"
            placeholder="全局搜索 traceId / 日志关键词 / 端点（按 / 聚焦）"
            clearable
            size="small"
            class="global-search"
            @keyup.enter="applyGlobalSearch"
          >
            <template #append>
              <el-button :icon="SearchIcon" @click="applyGlobalSearch" />
            </template>
          </el-input>
          <span class="header-clock mono">{{ clockText }}</span>
          <el-tag v-if="agentActive" type="success" size="small" round>Agent 运行中</el-tag>
          <el-tag v-else type="info" size="small" round>降级模式</el-tag>
        </div>
      </header>
      <section class="apm-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  DataAnalysis,
  Document,
  Share,
  Warning,
  Tickets,
  Download,
  Odometer,
  Connection,
  Histogram,
  Bell,
  Search as SearchIcon,
} from "@element-plus/icons-vue";
import { getStats } from "./api/apmApi";

const route = useRoute();
const router = useRouter();
const agentActive = ref(false);
let timer: number | undefined;
let clockTimer: number | undefined;
const clockText = ref("");

/** 全局搜索 */
const globalSearch = ref("");
const searchInput = ref<InstanceType<typeof import("element-plus")["ElInput"]> | null>(null);

/** 快捷键 / 聚焦搜索框 */
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const active = document.activeElement;
    const tag = active?.tagName;
    if (tag !== "INPUT" && tag !== "TEXTAREA" && !e.repeat) {
      e.preventDefault();
      searchInput.value?.focus?.();
    }
  }
}

/** 全局搜索执行：按内容智能跳转 */
function applyGlobalSearch() {
  const kw = globalSearch.value.trim();
  if (!kw) return;
  const looksLikeTraceId = /^[0-9a-f\-]{12,}$/i.test(kw);
  if (looksLikeTraceId) {
    router.push({ path: "/traces", query: { traceId: kw } });
  } else {
    router.push({ path: "/logs", query: { keyword: kw } });
  }
  globalSearch.value = "";
}

function tickClock() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  clockText.value = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const navItems = [
  { path: "/dashboard", label: "总览看板", icon: DataAnalysis },
  { path: "/traces", label: "调用链路", icon: Document },
  { path: "/dependencies", label: "依赖拓扑", icon: Share },
  { path: "/leaks", label: "资源泄漏", icon: Warning },
  { path: "/endpoints", label: "端点分析", icon: Histogram },
  { path: "/services", label: "服务列表", icon: Connection },
  { path: "/errors", label: "错误排行", icon: Warning },
  { path: "/jvm", label: "JVM 指标", icon: Odometer },
  { path: "/topology", label: "系统拓扑", icon: Connection },
  { path: "/logs", label: "日志", icon: Tickets },
  { path: "/injector", label: "数据注入器", icon: Download },
  { path: "/alerts", label: "告警中心", icon: Bell },
];

const currentTitle = computed(
  () => navItems.find((i) => i.path === route.path)?.label ?? "总览看板",
);

async function checkAgent() {
  try {
    const s = await getStats();
    agentActive.value = s.agentActive;
  } catch {
    agentActive.value = false;
  }
}

onMounted(() => {
  checkAgent();
  tickClock();
  timer = window.setInterval(checkAgent, 15000);
  clockTimer = window.setInterval(tickClock, 1000);
  window.addEventListener("keydown", handleKeyDown);
});

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
  if (clockTimer) window.clearInterval(clockTimer);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
.apm-root {
  display: flex;
  height: 100vh;
  background: var(--apm-bg, #0b0f1a);
  color: var(--apm-fg, #e6edf7);
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
}

/* ---- 侧栏 ---- */
.apm-sider {
  width: 232px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: rgba(17, 24, 41, 0.9);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  padding: 20px 14px;
  gap: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 6px;
}

.brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #fff;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.brand-sub {
  font-size: 11px;
  color: rgba(230, 237, 247, 0.45);
  letter-spacing: 0.5px;
}

.apm-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.apm-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: rgba(230, 237, 247, 0.7);
  transition: background 0.15s, color 0.15s;
  text-decoration: none;
}

.apm-nav-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 20%;
  height: 60%;
  width: 3px;
  border-radius: 2px;
  background: linear-gradient(180deg, #3b82f6, #8b5cf6);
  opacity: 0;
  transition: opacity 0.15s;
}

.apm-nav-item.active::before {
  opacity: 1;
}

.apm-nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.apm-nav-item.active {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.12));
  color: #fff;
  font-weight: 500;
}

.apm-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(230, 237, 247, 0.5);
  padding: 0 6px;
}

.footer-version {
  margin-left: auto;
  font-size: 10px;
  color: rgba(230, 237, 247, 0.3);
  font-family: "JetBrains Mono", Consolas, monospace;
}

.header-clock {
  font-size: 13px;
  color: var(--apm-muted);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
}

.global-search {
  width: 320px;
  --el-input-bg-color: rgba(255, 255, 255, 0.04);
  --el-input-border-color: var(--apm-border, rgba(255, 255, 255, 0.08));
  --el-input-text-color: var(--apm-fg, #e6edf7);
  --el-input-placeholder-color: var(--apm-muted, rgba(230, 237, 247, 0.4));
}

.global-search :deep(.el-input-group__append) {
  background: rgba(255, 255, 255, 0.03);
  box-shadow: none;
  border-color: var(--apm-border, rgba(255, 255, 255, 0.08));
}

.agent-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6b7280;
}

.agent-dot.on {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
}

/* ---- 主区 ---- */
.apm-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.apm-header {
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(11, 15, 26, 0.6);
}

.apm-header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.apm-header-right {
  display: flex;
  gap: 8px;
}

.apm-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* ---- 过渡 ---- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style>
/* 全局变量与基础样式（非 scoped） */
:root {
  --apm-bg: #0b0f1a;
  --apm-panel: #131a2b;
  --apm-fg: #e6edf7;
  --apm-muted: rgba(230, 237, 247, 0.55);
  --apm-border: rgba(255, 255, 255, 0.08);
  --apm-accent: #3b82f6;
  --apm-danger: #ef4444;
  --apm-warning: #f59e0b;
  --apm-success: #22c55e;
}

body {
  margin: 0;
  background:
    radial-gradient(1200px 600px at 85% -10%, rgba(139, 92, 246, 0.08), transparent 60%),
    radial-gradient(900px 500px at -10% 110%, rgba(59, 130, 246, 0.07), transparent 60%),
    var(--apm-bg);
}

.mono {
  font-family: "JetBrains Mono", Consolas, monospace;
}
</style>
