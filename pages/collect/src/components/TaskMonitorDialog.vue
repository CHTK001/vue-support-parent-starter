<!--
  任务实时监控：对运行中任务轮询节点最新状态，展示当前执行到哪个节点、
  成功/失败/跳过数量与累计耗时。任务结束后停止轮询并回读最终日志。
-->
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { msgError } from "@repo/core";
import ReDialog from "@repo/ui/re-dialog";
import ReTag from "@repo/ui/re-tag";
import { fetchLiveTaskNodes } from "../api/collectApi";
import { errText } from "../composables/useCollectView";
import { costMs } from "../constants/taskStatus";
import type { CollectTask, CollectTaskLog } from "../types/collect";

const props = defineProps<{
  modelValue: boolean;
  task: CollectTask | null;
}>();

const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>();

const visible = ref(props.modelValue);
const nodes = ref<CollectTaskLog[]>([]);
const loading = ref(false);
const running = ref(false);
let timer: number | null = null;

const statusCount = (status: string): number =>
  nodes.value.filter(item => item.collectTaskLogStatus === status).length;

watch(
  () => props.modelValue,
  value => {
    visible.value = value;
    if (value && props.task) {
      void start();
    } else {
      stop();
    }
  },
);

watch(visible, value => emit("update:modelValue", value));

onBeforeUnmount(stop);

async function poll(): Promise<void> {
  if (!props.task) return;
  loading.value = true;
  try {
    nodes.value = (await fetchLiveTaskNodes(props.task.collectTaskId)) ?? [];
    running.value = props.task.running ?? false;
  } catch (error) {
    msgError(errText(error));
  } finally {
    loading.value = false;
  }
}

async function start(): Promise<void> {
  stop();
  running.value = props.task?.running ?? false;
  await poll();
  timer = window.setInterval(() => {
    void poll();
  }, 2000);
}

function stop(): void {
  if (timer != null) {
    window.clearInterval(timer);
    timer = null;
  }
}

function statusType(status: string): "success" | "danger" | "warning" | "info" {
  if (status === "SUCCESS") return "success";
  if (status === "FAILURE") return "danger";
  if (status === "SKIPPED") return "warning";
  return "info";
}

function statusText(status: string): string {
  if (status === "SUCCESS") return "成功";
  if (status === "FAILURE") return "失败";
  if (status === "SKIPPED") return "跳过";
  return "待执行";
}

function costText(cost: number | null): string {
  return cost == null ? "—" : `${costMs(cost) ?? cost}`;
}
</script>

<template>
  <ReDialog
    v-model="visible"
    :title="`实时监控 · ${task?.collectTaskNo || ''}`"
    width="820px"
    top="6vh"
    footer-hidden
    :loading="loading"
  >
    <div class="monitor-wrap">
      <div class="status-bar">
        <ReTag :type="running ? 'success' : 'info'" effect="plain">
          {{ running ? "执行中" : "已结束" }}
        </ReTag>
        <div class="status-counters">
          <span class="count success">{{ statusCount("SUCCESS") }} 成功</span>
          <span class="count danger">{{ statusCount("FAILURE") }} 失败</span>
          <span class="count warning">{{ statusCount("SKIPPED") }} 跳过</span>
        </div>
        <div class="refresh-tip">每 2 秒自动刷新</div>
      </div>

      <div class="node-list">
        <div v-if="!nodes.length" class="empty">暂无节点日志，等待任务开始执行…</div>
        <div v-for="node in nodes" :key="`${String(node.collectTaskLogFlowId)}:${node.collectTaskLogNodeId}`" class="node-row">
          <span class="status-dot" :class="node.collectTaskLogStatus.toLowerCase()"></span>
          <div class="node-main">
            <div class="node-name">{{ node.collectTaskLogNodeName || node.collectTaskLogNodeId }}</div>
            <div class="node-id">{{ node.collectTaskLogNodeId }}</div>
          </div>
          <ReTag :type="statusType(node.collectTaskLogStatus)" effect="plain">{{ statusText(node.collectTaskLogStatus) }}</ReTag>
          <div class="node-cost">{{ costText(node.collectTaskLogCost) }}</div>
        </div>
      </div>
    </div>
  </ReDialog>
</template>

<style scoped>
.monitor-wrap { display: flex; flex-direction: column; gap: 12px; }
.status-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--el-fill-color) 45%, transparent);
  border-radius: 8px;
}
.status-counters { display: flex; gap: 12px; font-size: 13px; }
.count.success { color: var(--el-color-success); }
.count.danger { color: var(--el-color-danger); }
.count.warning { color: var(--el-color-warning); }
.refresh-tip { margin-left: auto; font-size: 12px; color: var(--el-text-color-secondary); }
.node-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 420px;
  overflow-y: auto;
}
.node-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 6px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.success { background: var(--el-color-success); }
.status-dot.failure { background: var(--el-color-danger); }
.status-dot.skipped { background: var(--el-color-warning); }
.status-dot.running { background: var(--el-color-primary); animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.node-main { flex: 1; min-width: 0; }
.node-name { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.node-id { font-size: 11px; color: var(--el-text-color-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.node-cost { width: 72px; text-align: right; font-family: var(--el-font-family-mono); font-size: 12px; }
.empty { color: var(--el-text-color-secondary); font-size: 13px; padding: 24px 0; text-align: center; }
</style>
