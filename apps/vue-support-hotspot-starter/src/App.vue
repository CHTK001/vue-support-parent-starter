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

            class="global-search"
            @keyup.enter="applyGlobalSearch"
          >
            <template #append>
              <el-button :icon="SearchIcon" @click="applyGlobalSearch" />
            </template>
          </el-input>
          <span class="header-clock mono">{{ clockText }}</span>
          <el-tag v-if="agentActive" type="success" round>Agent 运行中</el-tag>
          <el-tag v-else type="info" round>降级模式</el-tag>
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
  background: var(--apm-bg);
  color: var(--apm-fg);
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
}

/* ---- 侧栏 ---- */
.apm-sider {
  width: 232px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  /* 侧栏用面板色与主区拉开一档，边界交给右边框承载（koi 规约：卡片不投影） */
  background: var(--apm-panel);
  border-right: 1px solid var(--apm-border);
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
  border-radius: var(--el-radius-lg, 12px); /* 原 10px，取最近档 lg */
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-5));
  color: var(--el-color-white);
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
  color: var(--el-text-color-placeholder);
  letter-spacing: 0.5px;
}

.apm-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

/* router-link 渲染成 <a>，是可点元素：补手型光标与键盘焦点环 */
.apm-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--el-radius-md, 8px);
  font-size: 14px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  outline: none;
  /* 只过渡 background-color：background 简写会连带触发 background-image 重绘 */
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
  text-decoration: none;
}

.apm-nav-item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.apm-nav-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 20%;
  height: 60%;
  width: 3px;
  border-radius: var(--el-radius-xs, 4px); /* 原 2px，取最近档 xs */
  background: linear-gradient(180deg, var(--el-color-primary), var(--el-color-primary-light-5));
  opacity: 0;
  transition: opacity var(--el-transition-duration-fast, 0.2s) ease;
}

.apm-nav-item.active::before {
  opacity: 1;
}

.apm-nav-item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-white);
}

.apm-nav-item.active {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--el-color-primary) 20%, transparent),
    color-mix(in srgb, var(--el-color-primary-light-5) 12%, transparent)
  );
  color: var(--el-color-white);
  font-weight: 500;
}

.apm-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding: 0 6px;
}

.footer-version {
  margin-left: auto;
  font-size: 10px;
  color: var(--el-text-color-placeholder);
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
  /* 输入框底色保留“内凹半透明”观感，但改成令牌派生才能跟随明暗主题 */
  --el-input-bg-color: color-mix(in srgb, var(--el-fill-color) 60%, transparent);
  --el-input-border-color: var(--el-border-color-lighter);
  --el-input-text-color: var(--el-text-color-primary);
  --el-input-placeholder-color: var(--el-text-color-placeholder);
}

.global-search :deep(.el-input-group__append) {
  background: var(--el-fill-color-light);
  box-shadow: none;
  border-color: var(--el-border-color-lighter);
}

.agent-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-info);
}

/* 连接状态：灰 → 绿本身就是唯一信号，不再叠发光投影
   （koi 规约只允许焦点环与悬浮反馈两类 box-shadow） */
.agent-dot.on {
  background: var(--el-color-success);
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
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-bg-color) 60%, transparent);
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
  transition: opacity var(--el-transition-duration-fast, 0.2s) ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 尊重系统「减少动态效果」偏好：关掉过渡后导航项仍靠 active 类 + ::before 强调条表达状态 */
@media (prefers-reduced-motion: reduce) {
  .apm-nav-item,
  .apm-nav-item::before,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>

<style>
/* 全局变量与基础样式（非 scoped） */
/* APM 语义色全部由 Element Plus / koi 令牌派生：
   这样整套 APM 皮肤跟随系统明暗主题，页面里不再出现写死 hex。
   语义命名保留（本层等同 --rm-* 的库内语义层），便于一处调参。 */
:root {
  --apm-bg: var(--el-bg-color);
  --apm-panel: var(--el-bg-color-overlay);
  --apm-fg: var(--el-text-color-primary);
  --apm-muted: var(--el-text-color-secondary);
  --apm-border: var(--el-border-color-lighter);
  --apm-accent: var(--el-color-primary);
  --apm-danger: var(--el-color-danger);
  --apm-warning: var(--el-color-warning);
  --apm-success: var(--el-color-success);
}

body {
  margin: 0;
  /* 两团极淡的环境光晕，只做氛围不承载信息，故用极低比例 color-mix 派生 */
  background:
    radial-gradient(
      1200px 600px at 85% -10%,
      color-mix(in srgb, var(--el-color-primary-light-5) 8%, transparent),
      transparent 60%
    ),
    radial-gradient(
      900px 500px at -10% 110%,
      color-mix(in srgb, var(--el-color-primary) 7%, transparent),
      transparent 60%
    ),
    var(--apm-bg);
}

.mono {
  font-family: "JetBrains Mono", Consolas, monospace;
}
</style>
