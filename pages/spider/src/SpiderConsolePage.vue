<template>
  <section class="spider-console">
    <nav
      v-if="activeTab !== 'orchestration'"
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
        {{ item.label }}
      </button>
    </nav>

    <div class="spider-console__body">
      <component :is="activeComponent" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import SpiderManagePage from "./views/spider/manage/index.vue";
import SpiderOrchestrationPage from "./views/spider/orchestration/index.vue";
import SpiderOverviewPage from "./views/spider/overview/index.vue";

type SpiderConsoleTab = "overview" | "manage" | "orchestration";

const tabs: Array<{ key: SpiderConsoleTab; label: string }> = [
  { key: "overview", label: "总览" },
  { key: "manage", label: "爬虫管理" },
];

const activeTab = ref<SpiderConsoleTab>("overview");

const activeComponent = computed(() => {
  switch (activeTab.value) {
    case "manage":
      return SpiderManagePage;
    case "orchestration":
      return SpiderOrchestrationPage;
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
  }
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
  window.history.replaceState({}, "", nextUrl);
};

const handlePopState = () => {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("spiderTab") as SpiderConsoleTab | null;
  if (tab && ["overview", "manage", "orchestration"].includes(tab)) {
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

<style scoped lang="scss">
.spider-console {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  background: #f3f5f7;
}

.spider-console__tabs {
  display: flex;
  gap: 8px;
  padding: 12px 12px 0;
}

.spider-console__tabs button {
  height: 34px;
  padding: 0 14px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 10px;
  background: #fff;
  color: #0f172a;
  cursor: pointer;
}

.spider-console__tabs button.is-active {
  border-color: rgba(30, 64, 175, 0.2);
  background: #dbeafe;
  color: #1e3a8a;
}

.spider-console__body {
  min-height: 0;
}
</style>
