<template>
  <section class="spider-console">
    <!-- Floating gear (overview → manage) -->
    <button
      v-if="activeTab === 'overview'"
      type="button"
      class="spider-console__fab"
      title="爬虫管理"
      @click="toggleManage"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    </button>

    <div class="spider-console__body">
      <component :is="activeComponent" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import SpiderExecutionPage from "./views/spider/execution/index.vue";
import SpiderManagePage from "./views/spider/manage/index.vue";
import SpiderMonitorPage from "./views/spider/monitor/index.vue";
import SpiderOrchestrationPage from "./views/spider/orchestration/index.vue";
import SpiderOverviewPage from "./views/spider/overview/index.vue";

type SpiderConsoleTab = "overview" | "manage" | "orchestration" | "monitor" | "execution";

const activeTab = ref<SpiderConsoleTab>("overview");

const toggleManage = () => {
  activeTab.value = activeTab.value === "manage" ? "overview" : "manage";
};

const navigateToOrchestration = (item: { spiderId?: number | null; spiderCode: string }, extraParams?: Record<string, string>) => {
  const params = new URLSearchParams(window.location.search);
  params.set("spiderTab", "orchestration");
  params.delete("spiderExample");
  params.delete("autorun");
  if (item.spiderId !== undefined && item.spiderId !== null) {
    params.set("spiderId", String(item.spiderId));
  }
  params.set("spiderCode", item.spiderCode);
  if (extraParams) {
    Object.entries(extraParams).forEach(([k, v]) => params.set(k, v));
  }
  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", nextUrl);
  activeTab.value = "orchestration";
};
provide("navigateToOrchestration", navigateToOrchestration);
provide("toggleManage", toggleManage);
const navigateToMonitor = (item: { spiderCode: string }, executionNo?: string) => {
  const params = getUrlSearchParams();
  params.set("spiderTab", "monitor");
  params.set("code", item.spiderCode);
  if (executionNo) params.set("executionNo", executionNo);
  const hash = window.location.hash || "";
  if (hash) {
    const hashPath = hash.includes("?") ? hash.substring(0, hash.indexOf("?")) : hash;
    const nextUrl = `${window.location.pathname}${hashPath}?${params.toString()}`;
    window.history.replaceState({}, "", nextUrl);
  } else {
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", nextUrl);
  }
  activeTab.value = "monitor";
};
provide("navigateToMonitor", navigateToMonitor);

const activeComponent = computed(() => {
  switch (activeTab.value) {
    case "manage":
      return SpiderManagePage;
    case "orchestration":
      return SpiderOrchestrationPage;
    case "monitor":
      return SpiderMonitorPage;
    case "execution":
      return SpiderExecutionPage;
    default:
      return SpiderOverviewPage;
  }
});

const syncQuery = (tab: SpiderConsoleTab) => {
  const search = window.location.search;
  let params = new URLSearchParams(search || "");
  // 如果 search 为空但 hash 中有查询参数，从 hash 读取避免丢失
  if (!search) {
    const hash = window.location.hash || "";
    const idx = hash.indexOf("?");
    if (idx >= 0) {
      const hashParams = new URLSearchParams(hash.substring(idx + 1));
      for (const [k, v] of hashParams) {
        if (!params.has(k)) params.set(k, v);
      }
    }
  }
  params.set("spiderTab", tab);
  if (tab !== "orchestration") {
    params.delete("spiderExample");
    params.delete("autorun");
    params.delete("spiderId");
    params.delete("spiderCode");
  }
  const nextQuery = params.toString();
  // hash 路由：保留 path/hash，替换查询参数
  const hash = window.location.hash || "";
  if (search) {
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  } else if (hash) {
    const hashPath = hash.includes("?") ? hash.substring(0, hash.indexOf("?")) : hash;
    const nextUrl = `${window.location.pathname}${hashPath}${nextQuery ? `?${nextQuery}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }
};

// 兼容 hash 路由和 history 路由两种模式读取查询参数
const getUrlSearchParams = () => {
  const search = window.location.search || "";
  if (search) return new URLSearchParams(search);
  const hash = window.location.hash || "";
  const idx = hash.indexOf("?");
  return idx >= 0 ? new URLSearchParams(hash.substring(idx + 1)) : new URLSearchParams();
};

const handlePopState = () => {
  const params = getUrlSearchParams();
  const tab = params.get("spiderTab") as SpiderConsoleTab | null;
  if (tab && ["overview", "manage", "orchestration", "monitor", "execution"].includes(tab)) {
    activeTab.value = tab;
    return;
  }
  // 从 hash 路径中推断 tab（如 #/spider/monitor → monitor）
  const hash = window.location.hash || "";
  const hashPath = hash.split("?")[0];
  const validTabs: SpiderConsoleTab[] = ["overview", "manage", "orchestration", "monitor", "execution"];
  for (const t of validTabs) {
    if (hashPath.includes(`/${t}`)) {
      activeTab.value = t;
      return;
    }
  }
};

watch(activeTab, tab => {
  syncQuery(tab);
});

onMounted(() => {
  handlePopState();
  window.addEventListener("popstate", handlePopState);
  // Ensure dark theme for scifi / Element Plus components
  document.documentElement.classList.add("dark");
});

onBeforeUnmount(() => {
  window.removeEventListener("popstate", handlePopState);
});
</script>

<style lang="scss">
@import './styles/theme-spider';
</style>

<style scoped lang="scss">
.spider-console {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
}

.spider-console__fab {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1000;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-bg-color) 60%, transparent);
  backdrop-filter: blur(12px);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 20%, transparent);
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-bg-color) 80%, transparent);
    box-shadow: 0 0 24px color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  }
}

.spider-console__body {
  flex: 1;
  min-height: 0;
}
</style>
