<template>
  <div class="apm-root" :class="{ 'sider-collapsed': collapsed }">
    <!-- ============ 侧栏 ============ -->
    <aside class="apm-sider">
      <div class="brand" @click="collapsed = !collapsed" :title="collapsed ? '展开导航' : '收起导航'">
        <div class="brand-logo">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
            <path
              d="M3 13.5h3.2l2.1-6.4 3.4 12 2.6-8.1 1.6 2.5H21"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <transition name="apm-fade">
          <div v-if="!collapsed" class="brand-text">
            <div class="brand-title">Hotsport</div>
            <div class="brand-sub">APM 热点观测台</div>
          </div>
        </transition>
      </div>

      <nav class="apm-nav">
        <template v-for="group in navGroups" :key="group.title">
          <!-- 分组标题：收起时隐藏，靠分隔线保留层级感 -->
          <div class="nav-group-title" v-if="!collapsed">{{ group.title }}</div>
          <div v-else class="nav-group-divider" />
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="apm-nav-item"
            :class="{ active: isActive(item.path) }"
            :title="collapsed ? item.label : undefined"
          >
            <el-icon :size="17"><component :is="item.icon" /></el-icon>
            <transition name="apm-fade">
              <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
            </transition>
            <!-- 该页有活跃告警时在导航上挂红点 -->
            <span
              v-if="!collapsed && item.path === '/alerts' && activeAlerts > 0"
              class="nav-badge"
            >
              {{ activeAlerts > 99 ? "99+" : activeAlerts }}
            </span>
          </router-link>
        </template>
      </nav>

      <div class="apm-footer">
        <div class="agent-status" :class="agentActive ? 'on' : 'off'">
          <span class="agent-dot" />
          <transition name="apm-fade">
            <span v-if="!collapsed" class="agent-text">
              {{ agentActive ? "Agent 已注入" : "降级模式" }}
            </span>
          </transition>
        </div>
        <transition name="apm-fade">
          <span v-if="!collapsed" class="footer-version mono">v4.0.0.42</span>
        </transition>
      </div>
    </aside>

    <!-- ============ 主区 ============ -->
    <main class="apm-main">
      <header class="apm-header">
        <!-- 面包屑：概览 / 当前页 -->
        <div class="header-title">
          <span class="crumb-root">观测台</span>
          <span class="crumb-sep">/</span>
          <h1>{{ currentTitle }}</h1>
        </div>

        <div class="apm-header-right">
          <div class="global-search" :class="{ focused: searchFocused }">
            <el-icon :size="15" class="search-icon"><Search /></el-icon>
            <input
              ref="searchInput"
              v-model="globalSearch"
              placeholder="搜索 traceId / 日志 / 端点"
              aria-label="全局搜索"
              @focus="searchFocused = true"
              @blur="searchFocused = false"
              @keyup.enter="applyGlobalSearch"
            />
            <kbd v-if="!globalSearch" class="search-kbd">/</kbd>
            <el-icon
              v-else
              class="search-clear"
              :size="14"
              @click="globalSearch = ''"
            ><CircleCloseFilled /></el-icon>
          </div>

          <span class="header-clock mono">{{ clockText }}</span>

          <div class="ws-indicator" :class="realtimeService.wsConnected.value ? 'connected' : 'disconnected'" :title="realtimeService.wsConnected.value ? '实时通道已连接' : '实时通道未连接'">
            <span class="ws-dot" />
            <span class="ws-label">{{ realtimeService.wsConnected.value ? "WS" : "—" }}</span>
          </div>

          <el-button
            text
            class="help-btn"
            title="快捷键 (?)"
            @click="shortcutsRef?.open()"
          >
            <el-icon :size="16"><QuestionFilled /></el-icon>
          </el-button>

          <el-button
            text
            size="small"
            class="lang-btn"
            :title="currentLang === 'zh' ? 'Switch to English' : '切换到中文'"
            @click="toggleLang"
          >
            {{ currentLang === "zh" ? "EN" : "中" }}
          </el-button>

          <div class="agent-pill" :class="agentActive ? 'on' : 'off'">
            <span class="agent-pill-dot" />
            {{ agentActive ? "实时" : "降级" }}
          </div>
        </div>
      </header>

      <section class="apm-content">
        <router-view v-slot="{ Component }">
          <transition name="apm-page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </section>

      <!-- 快捷键面板 -->
      <ShortcutsPanel ref="shortcutsRef" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  DataAnalysis,
  DataBoard,
  Document,
  Share,
  Warning,
  Tickets,
  Odometer,
  Connection,
  Histogram,
  Bell,
  Search,
  CircleCloseFilled,
  DataLine,
  QuestionFilled,
  Monitor,
} from "@element-plus/icons-vue";
import type { Component } from "vue";
import { useApmStore } from "./stores/apmStore";
import ShortcutsPanel from "./components/ShortcutsPanel.vue";
import { currentLang, setLang } from "./i18n";
import { realtimeService } from "./services/realtimeService";
import { ROUTE_PREFIX } from "@pages/hotsport";

const route = useRoute();
const router = useRouter();

const apmStore = useApmStore();

/** Agent 是否已注入（统一从 apmStore 读取，Agent 中心操作后侧栏即时同步） */
const agentActive = computed(() => apmStore.agentActive);

/** 未处置的告警数（导航红点，统一从 apmStore 读取） */
const activeAlerts = computed(() => apmStore.activeAlertCount);

/** 侧栏折叠 */
const collapsed = ref(false);

/** 全局搜索 */
const globalSearch = ref("");
const searchFocused = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);

const clockText = ref("");
let clockTimer: number | undefined;

/* ------------------------------------------------------------------
 * 导航：按「看什么 / 查什么 / 管什么」三组组织。
 * 原先是 12 项平铺，用户要从头扫到尾才能找到目标；
 * 分组后按心智模型归位：先看健康度，再查链路细节，最后是运维动作。
 * ------------------------------------------------------------------ */
interface NavItem {
  path: string;
  label: string;
  icon: Component;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "概览",
    items: [
      { path: `${ROUTE_PREFIX}/dashboard`, label: "总览看板", icon: DataAnalysis },
      { path: `${ROUTE_PREFIX}/topology`, label: "系统拓扑", icon: Share },
      { path: `${ROUTE_PREFIX}/dependencies`, label: "依赖拓扑", icon: DataBoard },
    ],
  },
  {
    title: "链路分析",
    items: [
      { path: `${ROUTE_PREFIX}/traces`, label: "调用链路", icon: Document },
      { path: `${ROUTE_PREFIX}/endpoints`, label: "端点分析", icon: Histogram },
      { path: `${ROUTE_PREFIX}/services`, label: "服务列表", icon: Connection },
      { path: `${ROUTE_PREFIX}/errors`, label: "错误排行", icon: Warning },
    ],
  },
  {
    title: "资源与日志",
    items: [
      { path: `${ROUTE_PREFIX}/leaks`, label: "资源泄漏", icon: DataLine },
      { path: `${ROUTE_PREFIX}/jvm`, label: "JVM 指标", icon: Odometer },
      { path: `${ROUTE_PREFIX}/logs`, label: "日志", icon: Tickets },
      { path: `${ROUTE_PREFIX}/realtime-log`, label: "实时日志", icon: Monitor },
    ],
  },
  {
    title: "运维",
    items: [
      { path: `${ROUTE_PREFIX}/alerts`, label: "告警中心", icon: Bell },
      { path: `${ROUTE_PREFIX}/agent`, label: "Agent 中心", icon: Monitor },
    ],
  },
];

/** 当前路由是否命中（含 /traces/detail 归到 /traces 组） */
function isActive(path: string): boolean {
  if (path === `${ROUTE_PREFIX}/traces`) {
    return route.path.startsWith(`${ROUTE_PREFIX}/traces`);
  }
  if (path === `${ROUTE_PREFIX}/services`) {
    return route.path.startsWith(`${ROUTE_PREFIX}/services`);
  }
  return route.path === path;
}

/**
 * 当前页标题。
 *
 * 以路由 meta.title 为唯一真源，不再遍历 navGroups：
 *   - 遍历法依赖 navGroups 覆盖所有路由，漏配一项（如 /dependencies）就会
 *     静默回落到错误标题，且侧栏也点不到该页；
 *   - isActive 对 /services 用 startsWith 判定，会把 /services/detail 也命中，
 *     导致循环提前返回「服务列表」，后面的 detail 分支成了执行不到的死代码。
 *
 * meta.title 在 router.ts 里逐条声明，与路由一一对应，不存在覆盖缺口。
 */
const currentTitle = computed(() => {
  const t = route.meta.title;
  return typeof t === "string" && t.length > 0 ? t : "观测台";
});

/** 快捷键 / 聚焦搜索框（输入态时不劫持） */
function handleKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = document.activeElement?.tagName;
  const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

  // "?" → 快捷键面板（排除输入区）
  if (e.key === "?" && !inInput) {
    e.preventDefault();
    shortcutsRef.value?.open();
    return;
  }

  // "/" → 搜索框（排除输入区）
  if (e.key === "/" && !inInput) {
    e.preventDefault();
    searchInput.value?.focus();
    return;
  }

  // "t" → 折叠/展开侧栏（排除输入区）
  if (e.key === "t" && !inInput) {
    collapsed.value = !collapsed.value;
    return;
  }

  // 全局 "r" 由 window 事件 apm:global-refresh 统一处理，这里不再单独处理
}

/** 全局搜索：像 traceId 就跳链路，否则当日志关键词搜 */
function applyGlobalSearch() {
  const kw = globalSearch.value.trim();
  if (!kw) {
    return;
  }
  if (/^[0-9a-f-]{12,}$/i.test(kw)) {
    router.push({ path: `${ROUTE_PREFIX}/traces`, query: { traceId: kw } });
  } else {
    router.push({ path: `${ROUTE_PREFIX}/logs`, query: { keyword: kw } });
  }
  globalSearch.value = "";
}

const shortcutsRef = ref<InstanceType<typeof ShortcutsPanel> | null>(null);

function tickClock() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  clockText.value = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** 切换中英文 */
function toggleLang() {
  setLang(currentLang.value === "zh" ? "en" : "zh");
}

/** 统一拉 Agent 状态 + 未处置告警数（复用 apmStore.pollStatus） */
async function pollStatus() {
  await apmStore.pollStatus();
}

/**
 * 实时通道驱动的状态同步。
 *
 * <p>整站只有一条 WS/SSE 通道，壳层不再用 15s 定时器轮询：
 * 收到 stats 事件即静默同步一次 Agent 状态与未处置告警数。</p>
 */
function onRealtimeStats() {
  void apmStore.pollStatus();
}
realtimeService.on("stats", onRealtimeStats);

onMounted(async () => {
  await nextTick();
  await pollStatus();
  tickClock();
  clockTimer = window.setInterval(tickClock, 1000);
  window.addEventListener("keydown", handleKeyDown);
});

onBeforeUnmount(() => {
  if (clockTimer) {
    window.clearInterval(clockTimer);
  }
  realtimeService.off("stats", onRealtimeStats);
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
/* ============ 根布局 ============ */
.apm-root {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--apm-canvas);
  color: var(--apm-fg);
  font-family: var(--apm-font-sans);
}

/* ============ 侧栏 ============ */
.apm-sider {
  width: 232px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-4);
  padding: var(--apm-space-4) var(--apm-space-3);
  /* 侧栏比主区亮一档，靠亮度而非描边分层 */
  background: var(--apm-panel);
  border-right: 1px solid var(--apm-border-soft);
  transition: width var(--apm-t-base);
}

.sider-collapsed .apm-sider {
  width: 64px;
  padding-left: var(--apm-space-2);
  padding-right: var(--apm-space-2);
}

/* 品牌区 */
.brand {
  display: flex;
  align-items: center;
  gap: var(--apm-space-3);
  padding: var(--apm-space-1) var(--apm-space-2);
  cursor: pointer;
  user-select: none;
  border-radius: var(--apm-radius-md);
  transition: background var(--apm-t-fast);
}

.brand:hover {
  background: var(--apm-panel-active);
}

.brand-logo {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: var(--apm-radius-md);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--apm-accent) 88%, #fff),
    var(--apm-accent)
  );
  color: #fff;
  box-shadow: 0 6px 16px -6px color-mix(in srgb, var(--apm-accent) 70%, transparent);
}

.brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.brand-title {
  font-size: 15px;
  font-weight: 650;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.brand-sub {
  font-size: 11px;
  color: var(--apm-muted);
  letter-spacing: 0.02em;
}

/* 导航 */
.apm-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
}

.nav-group-title {
  padding: var(--apm-space-3) var(--apm-space-2) var(--apm-space-1);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--apm-fg-faint);
  text-transform: uppercase;
  white-space: nowrap;
}

.nav-group-divider {
  height: 1px;
  margin: var(--apm-space-2) var(--apm-space-2);
  background: var(--apm-border-soft);
}

/* router-link 渲染成 <a>，是可点元素：补手型光标与键盘焦点环 */
.apm-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--apm-space-3);
  padding: 9px var(--apm-space-3);
  border-radius: var(--apm-radius-md);
  font-size: 13.5px;
  color: var(--apm-fg-regular);
  cursor: pointer;
  outline: none;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background var(--apm-t-fast),
    color var(--apm-t-fast);
}

.sider-collapsed .apm-nav-item {
  justify-content: center;
  padding-left: 0;
  padding-right: 0;
}

.apm-nav-item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--apm-accent) 30%, transparent);
}

.apm-nav-item:hover {
  background: var(--apm-panel-active);
  color: var(--apm-fg);
}

/* 激活态：左侧竖条 + 稍亮底色 + 主色文字。
   竖条用纯色块而非渐变，保证在收起态（窄宽度）下依然清晰可辨 */
.apm-nav-item.active {
  background: var(--apm-accent-subtle);
  color: var(--apm-accent-hover);
  font-weight: 600;
}

.apm-nav-item.active::before {
  content: "";
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  border-radius: 0 3px 3px 0;
  background: var(--apm-accent);
}

.sider-collapsed .apm-nav-item.active::before {
  left: -8px;
}

.nav-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 告警数徽标 */
.nav-badge {
  flex-shrink: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--apm-danger);
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  font-family: var(--apm-font-mono);
  font-variant-numeric: tabular-nums;
}

/* 侧栏底部 */
.apm-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--apm-space-2);
  padding: var(--apm-space-2) var(--apm-space-3);
  border-top: 1px solid var(--apm-border-soft);
}

.agent-status {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
  min-width: 0;
}

.agent-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 999px;
  transition: background var(--apm-t-base);
}

.agent-status.on .agent-dot {
  background: var(--apm-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--apm-success) 22%, transparent);
}

.agent-status.off .agent-dot {
  background: var(--apm-neutral);
}

.agent-text {
  font-size: 12px;
  color: var(--apm-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.footer-version {
  font-size: 10px;
  color: var(--apm-fg-faint);
}

/* ============ 主区 ============ */
.apm-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* 顶栏：半透明 + 模糊，内容滚动时有层次而不割裂 */
.apm-header {
  flex-shrink: 0;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--apm-space-4);
  padding: 0 var(--apm-space-6);
  border-bottom: 1px solid var(--apm-border-soft);
  background: color-mix(in srgb, var(--apm-canvas) 82%, transparent);
  backdrop-filter: blur(12px);
}

.header-title {
  display: flex;
  align-items: baseline;
  gap: var(--apm-space-2);
  min-width: 0;
}

.crumb-root {
  font-size: 13px;
  color: var(--apm-fg-faint);
}

.crumb-sep {
  font-size: 13px;
  color: var(--apm-fg-faint);
}

.apm-header h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.apm-header-right {
  display: flex;
  align-items: center;
  gap: var(--apm-space-3);
  flex-shrink: 0;
}

/* 搜索框：自绘而非 el-input，
   为的是聚焦时外发光、以及右侧自定义的 "/" 快捷键提示 */
.global-search {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
  width: 280px;
  height: 34px;
  padding: 0 var(--apm-space-3);
  border: 1px solid var(--apm-border);
  border-radius: var(--apm-radius-md);
  background: var(--apm-panel);
  transition:
    border-color var(--apm-t-fast),
    box-shadow var(--apm-t-fast),
    width var(--apm-t-base);
}

.global-search.focused {
  border-color: var(--apm-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--apm-accent) 18%, transparent);
}

.global-search input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--apm-fg);
  font-size: 13px;
  font-family: inherit;
}

.global-search input::placeholder {
  color: var(--apm-fg-faint);
}

.search-icon {
  flex-shrink: 0;
  color: var(--apm-muted);
}

.search-kbd {
  flex-shrink: 0;
  min-width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  padding: 0 5px;
  border: 1px solid var(--apm-border);
  border-radius: 4px;
  background: var(--apm-panel-raised);
  color: var(--apm-muted);
  font-family: var(--apm-font-mono);
  font-size: 11px;
  line-height: 1;
}

.search-clear {
  flex-shrink: 0;
  color: var(--apm-muted);
  cursor: pointer;
}

.search-clear:hover {
  color: var(--apm-fg);
}

.header-clock {
  font-size: 12.5px;
  color: var(--apm-muted);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.help-btn {
  color: var(--apm-muted);
  transition: color var(--apm-t-fast);
}

.help-btn:hover {
  color: var(--apm-accent);
}

.lang-btn {
  min-width: 32px;
  font-size: 11px;
  font-weight: 700;
  color: var(--apm-muted);
  border: 1px solid var(--apm-border-soft);
  border-radius: var(--apm-radius-sm);
  transition: color var(--apm-t-fast), border-color var(--apm-t-fast);
}

.lang-btn:hover {
  color: var(--apm-accent);
  border-color: var(--apm-accent);
}

/* WebSocket 连接状态指示 */
.ws-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  padding: 0 8px;
  border-radius: 999px;
  height: 22px;
}

.ws-indicator.connected {
  background: var(--apm-success-bg);
  color: var(--apm-success);
}

.ws-indicator.disconnected {
  background: var(--apm-neutral-bg);
  color: var(--apm-muted);
}

.ws-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
}

.ws-indicator.connected .ws-dot {
  animation: ws-pulse 2s ease infinite;
}

@keyframes ws-pulse {
  0%, 100% { opacity: 1; }
 50% { opacity: 0.3; }
}

/* Agent 状态药丸 */
.agent-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.agent-pill.on {
  background: var(--apm-success-bg);
  color: var(--apm-success);
}

.agent-pill.off {
  background: var(--apm-neutral-bg);
  color: var(--apm-neutral);
}

.agent-pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
}

/* 实时态的点持续呼吸，提示数据在流动 */
.agent-pill.on .agent-pill-dot {
  animation: apm-pill-pulse 2s var(--apm-ease) infinite;
}

@keyframes apm-pill-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* 内容区 */
.apm-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--apm-space-6);
  scrollbar-width: thin;
}

/* ============ 过渡 ============ */
.apm-fade-enter-active,
.apm-fade-leave-active {
  transition: opacity var(--apm-t-fast);
}

.apm-fade-enter-from,
.apm-fade-leave-to {
  opacity: 0;
}

.apm-page-enter-active,
.apm-page-leave-active {
  transition:
    opacity var(--apm-t-base),
    transform var(--apm-t-base);
}

.apm-page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.apm-page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 尊重系统「减少动态效果」偏好：位移过渡全部关掉，只留不透明度 */
@media (prefers-reduced-motion: reduce) {
  .apm-page-enter-from,
  .apm-page-leave-to {
    transform: none;
  }

  .apm-page-enter-active,
  .apm-page-leave-active,
  .apm-fade-enter-active,
  .apm-fade-leave-active,
  .apm-sider,
  .global-search,
  .agent-pill.on .agent-pill-dot {
    transition: none;
    animation: none;
  }
}

/* ============ 响应式 ============ */
@media (max-width: 900px) {
  .global-search {
    width: 180px;
  }

  .header-clock,
  .crumb-root,
  .crumb-sep {
    display: none;
  }

  .apm-content {
    padding: var(--apm-space-4);
  }
}

@media (max-width: 640px) {
  .apm-sider {
    width: 64px;
    padding-left: var(--apm-space-2);
    padding-right: var(--apm-space-2);
  }

  .brand-text,
  .nav-label,
  .nav-group-title,
  .agent-text,
  .footer-version {
    display: none;
  }

  .apm-nav-item {
    justify-content: center;
    padding-left: 0;
    padding-right: 0;
  }
}
</style>
