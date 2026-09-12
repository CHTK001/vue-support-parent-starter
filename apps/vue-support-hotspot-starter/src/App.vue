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
          :class="{ active: $route.path === item.path }"
        >
          <el-icon :size="18"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="apm-footer">
        <div class="agent-dot" :class="{ on: agentActive }"></div>
        <span>Agent {{ agentActive ? "已连接" : "未注入" }}</span>
      </div>
    </aside>
    <main class="apm-main">
      <header class="apm-header">
        <h1>{{ currentTitle }}</h1>
        <div class="apm-header-right">
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
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import {
  DataAnalysis,
  Document,
  Share,
  Warning,
  Tickets,
} from "@element-plus/icons-vue";
import { getStats } from "./api/apmApi";

const route = useRoute();
const agentActive = ref(false);
let timer: number | undefined;

const navItems = [
  { path: "/dashboard", label: "总览看板", icon: DataAnalysis },
  { path: "/traces", label: "调用链路", icon: Document },
  { path: "/dependencies", label: "依赖拓扑", icon: Share },
  { path: "/leaks", label: "资源泄漏", icon: Warning },
  { path: "/logs", label: "日志", icon: Tickets },
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
  timer = window.setInterval(checkAgent, 15000);
});

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
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
  background: var(--apm-bg);
}
</style>
