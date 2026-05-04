<template>
  <ScDrawer
    v-model="visible"
    :title="`日志 · ${project?.projectName || ''}`"
    size="1280px"
    append-to-body
    destroy-on-close
    @close="$emit('close')"
    @open="$emit('open')"
  >
    <div v-loading="loading" class="logs-wrap">
      <div class="logs-toolbar">
        <el-tabs v-model="activeTab" class="logs-tabs">
          <el-tab-pane label="运行日志" name="runtime" />
          <el-tab-pane label="升级日志" name="deploy" />
          <el-tab-pane label="操作日志" name="operation" />
        </el-tabs>
        <div v-if="project && !isStaticProject" class="logs-toolbar__lifecycle">
          <el-tooltip content="启动" placement="top">
            <ScButton
              circle
              size="small"
              type="success"
              plain
              :loading="loadingState?.start"
              :disabled="busy || isRunning"
              @click="$emit('start', project)"
            >
              <IconifyIconOnline icon="ep:video-play" />
            </ScButton>
          </el-tooltip>
          <el-tooltip content="停止" placement="top">
            <ScButton
              circle
              size="small"
              type="danger"
              plain
              :loading="loadingState?.stop"
              :disabled="busy || !isRunning"
              @click="$emit('stop', project)"
            >
              <IconifyIconOnline icon="ep:video-pause" />
            </ScButton>
          </el-tooltip>
          <el-tooltip content="重启" placement="top">
            <ScButton
              circle
              size="small"
              type="warning"
              plain
              :loading="loadingState?.restart"
              :disabled="busy"
              @click="$emit('restart', project)"
            >
              <IconifyIconOnline icon="ep:refresh-right" />
            </ScButton>
          </el-tooltip>
        </div>
        <div class="logs-toolbar__actions">
          <ScButton
            circle
            size="small"
            plain
            class="logs-toolbar__icon-btn"
            @click="$emit('clear')"
          >
            <IconifyIconOnline icon="ep:delete" />
          </ScButton>
          <ScButton
            circle
            size="small"
            plain
            class="logs-toolbar__icon-btn"
            :class="{ 'is-active': autoScroll }"
            @click="$emit('update:autoScroll', !autoScroll)"
          >
            <IconifyIconOnline icon="ep:bottom" />
          </ScButton>
          <ScButton
            circle
            size="small"
            plain
            class="logs-toolbar__icon-btn"
            @click="$emit('refresh')"
          >
            <IconifyIconOnline icon="ep:refresh" />
          </ScButton>
        </div>
      </div>

      <div ref="logsPanelRef" class="logs-panel thin-scroller">
        <div
          class="logs-panel__content"
          v-html="renderedContent || emptyContent"
        />
      </div>

      <div class="logs-toolbar logs-toolbar--footer">
        <span class="logs-toolbar__hint">
          {{ autoScroll ? "自动滚动已开启" : "自动滚动已关闭" }}
        </span>
        <span class="logs-toolbar__hint">
          {{ logType === "operation" ? "操作日志来自前端记录" : "ANSI 日志已解析展示" }}
        </span>
      </div>
    </div>
  </ScDrawer>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { AnsiUp } from "ansi_up";
import { IconifyIconOnline } from "@repo/components";
import type { RemoteProject } from "../../api/manage/remote";
import { isStaticProjectType } from "./projectPanelShared";

const props = defineProps<{
  modelValue: boolean;
  project: RemoteProject | null;
  content: string;
  autoScroll: boolean;
  loading?: boolean;
  loadingState?: Partial<Record<"start" | "stop" | "restart", boolean>>;
  logType: "runtime" | "deploy" | "operation";
}>();

const emit = defineEmits<{
  (e: "clear"): void;
  (e: "close"): void;
  (e: "open"): void;
  (e: "refresh"): void;
  (e: "restart", project: RemoteProject): void;
  (e: "start", project: RemoteProject): void;
  (e: "stop", project: RemoteProject): void;
  (e: "update:logType", value: "runtime" | "deploy" | "operation"): void;
  (e: "update:autoScroll", value: boolean): void;
  (e: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value),
});

const activeTab = computed({
  get: () => props.logType,
  set: value =>
    emit(
      "update:logType",
      value as "runtime" | "deploy" | "operation",
    ),
});

const logsPanelRef = ref<HTMLDivElement | null>(null);
const emptyContent = "暂无日志...";
const ansiParser = new AnsiUp();
ansiParser.use_classes = false;
const isStaticProject = computed(() =>
  isStaticProjectType(props.project?.projectType),
);
const isRunning = computed(
  () => String(props.project?.runtimeStatus || "").toLowerCase() === "running",
);
const busy = computed(
  () =>
    Boolean(props.loadingState?.start) ||
    Boolean(props.loadingState?.stop) ||
    Boolean(props.loadingState?.restart),
);

const renderedContent = computed(() => {
  const source = String(props.content || "").trim();
  if (!source) {
    return "";
  }
  return ansiParser.ansi_to_html(source);
});

const scrollToBottom = () => {
  if (!props.autoScroll || !logsPanelRef.value) {
    return;
  }
  logsPanelRef.value.scrollTop = logsPanelRef.value.scrollHeight;
};

watch(
  () => [props.content, props.autoScroll, props.loading, props.logType],
  async () => {
    await nextTick();
    scrollToBottom();
  },
  { deep: true },
);
</script>

<style scoped lang="scss">
.logs-wrap {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 14px;
  height: 100%;
}

.logs-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.96),
    rgba(241, 245, 249, 0.92)
  );

  .logs-tabs {
    min-width: 0;
    flex: 1 1 auto;
  }
}

.logs-toolbar--footer {
  justify-content: space-between;
  flex-wrap: wrap;
}

.logs-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logs-toolbar__lifecycle {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.logs-toolbar__icon-btn {
  border-color: rgba(148, 163, 184, 0.2);
  background: #fff;
  color: #475569;

  &.is-active {
    border-color: rgba(59, 130, 246, 0.25);
    background: rgba(59, 130, 246, 0.12);
    color: #2563eb;
  }
}

.logs-toolbar__hint {
  font-size: 12px;
  color: #64748b;
}

.logs-panel {
  height: 100%;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
  padding: 18px;
  border-radius: 18px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 12px;
  line-height: 1.7;
  font-family: "Consolas", "Courier New", monospace;
}

.logs-panel__content {
  min-height: 100%;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  line-height: inherit;

  :deep(span) {
    font-family: inherit;
    line-height: inherit;
  }
}

:deep(.logs-tabs .el-tabs__header) {
  margin: 0;
}

:deep(.logs-tabs .el-tabs__item) {
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  color: #64748b;
}

:deep(.logs-tabs .el-tabs__item.is-active) {
  color: #2563eb;
  background: rgba(59, 130, 246, 0.1);
}

:deep(.logs-tabs .el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.logs-tabs .el-tabs__active-bar) {
  display: none;
}
</style>
