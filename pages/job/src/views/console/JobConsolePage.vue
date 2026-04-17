<template>
  <div class="spring-page-shell job-console-shell">
    <header class="spring-hero job-console-hero">
      <div>
        <span class="spring-eyebrow">{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
        <div class="job-console-hero__chips">
          <span class="job-console-chip">{{ state.namespaceLabel }}</span>
          <span class="job-console-chip">{{ state.filteredTasks.length }} 个任务</span>
          <span class="job-console-chip">{{ state.runningCount }} 个运行中</span>
        </div>
      </div>
      <div class="spring-hero-actions">
        <button type="button" class="spring-ghost-button" @click="state.activeRailTab = 'settings'">
          接口设置
        </button>
        <button type="button" class="spring-ghost-button" @click="state.refreshTasks">
          刷新任务
        </button>
        <button type="button" class="spring-primary-button" @click="state.openEditor('create')">
          新建任务
        </button>
      </div>
    </header>

    <section class="job-console-stage spring-card">
      <ScLayout
        v-model="state.activeRailTab"
        class="job-console-layout"
        left-enabled
        :left-width="320"
        :left-min-width="260"
        :left-max-width="420"
        rail-enabled
        rail-round
        :rail-width="58"
        :rail-tabs="railTabs"
      >
        <template #left>
          <JobConsoleSidebar
            :failure-count="state.failureCount"
            :filters="state.filters"
            :loading-namespaces="state.loadingNamespaces"
            :loading-tasks="state.loadingTasks"
            :namespace="state.namespace"
            :namespaces="state.namespaces"
            :remote-count="state.remoteCount"
            :selected-task="state.selectedTask"
            :tasks="state.filteredTasks"
            @refresh="state.refreshTasks"
            @reset-filters="state.resetFilters"
            @select-task="state.handleSelectTask"
            @update:namespace="state.namespace = $event"
          />
        </template>

        <template #default>
          <JobConsoleWorkspace
            :active-rail-tab="state.activeRailTab"
            :detail-items="state.detailItems"
            :failure-count="state.failureCount"
            :filtered-task-count="state.filteredTasks.length"
            :focus-meta="state.focusMeta"
            :loading-logs="state.loadingLogs"
            :logs="state.logs"
            :overview-items="state.overviewItems"
            :preview-logs="state.previewLogs"
            :remote-count="state.remoteCount"
            :running-count="state.runningCount"
            :selected-status-class="state.selectedStatusClass"
            :selected-status-text="state.selectedStatusText"
            :selected-task="state.selectedTask"
            :selected-task-description="state.selectedTaskDescription"
            :selected-task-title="state.selectedTaskTitle"
            :setting-summary-items="state.settingSummaryItems"
            :settings="state.settings"
            @edit-task="state.openEditor('edit')"
            @refresh-logs="state.loadLogs"
            @restore-settings="state.restoreSettings"
            @run-action="state.runAction"
            @save-settings="state.saveSettings"
            @switch-tab="state.activeRailTab = $event"
          />
        </template>
      </ScLayout>
    </section>

    <JobConsoleEditorDialog
      :form="state.form"
      :mode="state.editorMode"
      :saving="state.savingJob"
      :selected-job-no="state.selectedJob?.jobNo"
      :visible="state.editorVisible"
      @close="state.editorVisible = false"
      @submit="state.saveJob"
    />

    <div class="spring-toast-stack">
      <div
        v-for="toast in state.toasts"
        :key="toast.id"
        class="spring-toast"
        :class="`spring-${toast.type}`"
      >
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import ScLayout from "@repo/components/ScLayout";
import JobConsoleEditorDialog from "./components/JobConsoleEditorDialog.vue";
import JobConsoleSidebar from "./components/JobConsoleSidebar.vue";
import JobConsoleWorkspace from "./components/JobConsoleWorkspace.vue";
import { useJobConsole } from "./composables/useJobConsole";

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    eyebrow?: string;
    defaultApiRoot?: string;
    storageKey?: string;
  }>(),
  {
    title: "Job Control Console",
    description:
      "在 Spring 模块内直接管理命名空间任务、调度表达式、远程分发和执行日志。",
    eyebrow: "Scheduler Starter",
    defaultApiRoot: "../job-console/api/",
    storageKey: "spring.pages.job-console.settings",
  },
);

const railTabs = [
  { name: "overview", label: "总览", title: "工作台总览" },
  { name: "detail", label: "详情", title: "任务详情" },
  { name: "logs", label: "日志", title: "执行日志" },
  { name: "settings", label: "设置", title: "接口设置" },
];

const state = useJobConsole({
  defaultApiRoot: props.defaultApiRoot,
  storageKey: props.storageKey,
});

onMounted(state.loadNamespaces);
</script>

<style scoped lang="scss">
.job-console-shell {
  width: min(1480px, calc(100vw - 32px));
}

.job-console-hero {
  overflow: hidden;
  position: relative;
  background:
    radial-gradient(circle at top right, rgba(22, 102, 216, 0.18), transparent 30%),
    radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.12), transparent 35%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(245, 249, 255, 0.88));
}

.job-console-hero__chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.job-console-chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid rgba(17, 32, 56, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--spring-text);
  font-size: 12px;
  font-weight: 700;
}

.job-console-stage {
  height: calc(100vh - 248px);
  min-height: 760px;
  margin-top: 22px;
  padding: 14px;
  border-radius: var(--spring-radius-xl);
}

.job-console-layout {
  height: 100%;
}

:deep(.job-console-layout .sc-layout__left) {
  padding-right: 6px;
}

:deep(.job-console-layout .sc-layout__main) {
  padding-right: 8px;
}

:deep(.job-console-layout .sc-layout__rail) {
  border-radius: 20px;
}

@media (max-width: 1100px) {
  .job-console-stage {
    height: auto;
    min-height: 0;
  }

  :deep(.job-console-layout.sc-layout) {
    grid-template-columns: 1fr !important;
    grid-template-rows: auto minmax(480px, auto) auto;
    height: auto;
  }

  :deep(.job-console-layout .sc-layout__left) {
    grid-column: 1;
    grid-row: 1;
  }

  :deep(.job-console-layout .sc-layout__resizer) {
    display: none;
  }

  :deep(.job-console-layout .sc-layout__main) {
    grid-column: 1;
    grid-row: 2;
  }

  :deep(.job-console-layout .sc-layout__rail) {
    grid-column: 1;
    grid-row: 3;
    min-height: 58px;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
    border-left: 0;
  }

  :deep(.job-console-layout .sc-layout__rail-tabs) {
    flex-direction: row;
    justify-content: flex-start;
    padding: 8px;
  }
}

@media (max-width: 760px) {
  .job-console-shell {
    width: min(100vw - 20px, 100%);
  }

  .job-console-hero,
  .job-console-stage {
    padding: 18px;
  }
}
</style>
