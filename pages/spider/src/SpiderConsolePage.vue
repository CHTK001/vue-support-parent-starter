<template>
  <section class="spider-console">
    <nav
      class="spider-console__tabs"
      aria-label="spider-console-tabs"
    >
      <button
        v-for="item in tabs"
        :key="item.key"
        type="button"
        :class="{ 'is-active': activeTab === item.key }"
        @click="activeTab = item.key"
      >
        <svg v-if="item.key==='overview'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        <svg v-if="item.key==='manage'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <svg v-if="item.key==='execution'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        {{ item.label }}
      </button>
    </nav>

    <div class="spider-console__body">
      <component :is="activeComponent" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import SpiderManagePage from "./views/spider/manage/index.vue";
import SpiderOrchestrationPage from "./views/spider/orchestration/index.vue";
import SpiderOverviewPage from "./views/spider/overview/index.vue";
import SpiderExecutionPage from "./views/spider/execution/index.vue";

type SpiderConsoleTab = "overview" | "manage" | "orchestration" | "execution";

const tabs: Array<{ key: SpiderConsoleTab; label: string }> = [
  { key: "overview", label: "总览" },
  { key: "manage", label: "爬虫管理" },
  { key: "execution", label: "执行日志" },
];

const activeTab = ref<SpiderConsoleTab>("overview");

const navigateToOrchestration = (item: { spiderId?: number | null; spiderCode: string }) => {
  const params = new URLSearchParams(window.location.search);
  params.set("spiderTab", "orchestration");
  params.delete("spiderExample");
  params.delete("autorun");
  if (item.spiderId !== undefined && item.spiderId !== null) {
    params.set("spiderId", String(item.spiderId));
  }
  params.set("spiderCode", item.spiderCode);
  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", nextUrl);
  activeTab.value = "orchestration";
};
provide("navigateToOrchestration", navigateToOrchestration);

const activeComponent = computed(() => {
  switch (activeTab.value) {
    case "manage":
      return SpiderManagePage;
    case "orchestration":
      return SpiderOrchestrationPage;
    case "execution":
      return SpiderExecutionPage;
    default:
      return SpiderOverviewPage;
  }
});

const syncQuery = (tab: SpiderConsoleTab) => {
  const params = new URLSearchParams(window.location.search);
  params.set("spiderTab", tab);
  if (tab !== "orchestration") {
    params.delete("spiderExample");
    params.delete("autorun");
    params.delete("spiderId");
    params.delete("spiderCode");
  }
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
  window.history.replaceState({}, "", nextUrl);
};

const handlePopState = () => {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("spiderTab") as SpiderConsoleTab | null;
  if (tab && ["overview", "manage", "orchestration", "execution"].includes(tab)) {
    activeTab.value = tab;
  }
};

watch(activeTab, tab => {
  syncQuery(tab);
});

onMounted(() => {
  handlePopState();
  window.addEventListener("popstate", handlePopState);
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
  background: var(--lay-bg);
}

.spider-console__tabs {
  display: flex;
  gap: 8px;
  padding: 0;
  background: var(--lay-bg);
  position: relative;
  z-index: 1;
}

.spider-console__tabs button {
  position: relative;
  height: 36px;
  padding: 0 20px;
  border: 1px solid var(--lay-border-light);
  border-radius: 10px;
  background: color-mix(in srgb, var(--lay-bg) 60%, transparent);
  backdrop-filter: blur(12px);
  color: var(--lay-text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.02em;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 10px;
    background: color-mix(in srgb, var(--lay-accent) 12%, transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    border-color: color-mix(in srgb, var(--lay-accent) 20%, transparent);
    color: var(--lay-text-primary);
    background: color-mix(in srgb, var(--lay-bg) 80%, transparent);
    &::before { opacity: 1; }
  }

  &.is-active {
    border-color: color-mix(in srgb, var(--lay-accent) 25%, transparent);
    color: var(--lay-accent);
    background: color-mix(in srgb, var(--lay-accent) 8%, transparent);
    box-shadow: 0 0 24px color-mix(in srgb, var(--lay-accent) 8%, transparent), inset 0 1px 0 color-mix(in srgb, var(--lay-accent) 15%, transparent);

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 2px;
      border-radius: 1px;
      background: var(--lay-accent);
      box-shadow: 0 0 8px color-mix(in srgb, var(--lay-accent) 50%, transparent);
    }
  }
}

.spider-console__body {
  flex: 1;
  min-height: 0;
}
</style>
