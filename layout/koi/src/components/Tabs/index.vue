<template>
  <div class="tabs-container" v-if="tabsStore.tabList.length">
    <el-tabs v-model="activeTab" type="border-card" closable @tab-remove="removeTab" @tab-click="handleTabClick">
      <el-tab-pane v-for="tab in tabsStore.tabList" :key="tab.path" :label="tab.title" :name="tab.path" :closable="tab.isAffix !== '1'">
        <template #label>
          <span class="tab-label">{{ tab.title }}</span>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useKoiTabsStore } from "../../stores/tabs";

const tabsStore = useKoiTabsStore();
const router = useRouter();
const route = useRoute();

const activeTab = computed({
  get: () => route.path,
  set: (val: string) => router.push(val),
});

function removeTab(targetName: string) {
  tabsStore.removeTab(targetName);
  if (route.path === targetName) {
    const remaining = tabsStore.tabList;
    if (remaining.length) router.push(remaining[remaining.length - 1].path);
  }
}

function handleTabClick(tab: any) {
  router.push(tab.props.name);
}
</script>

<style scoped>
.tabs-container { border-bottom: 1px solid var(--el-border-color-light); }
.tab-label { font-size: 13px; padding: 0 4px; }
</style>