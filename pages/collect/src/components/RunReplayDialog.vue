<!--
  运行回放：把一次已经结束的执行，按节点日志逐个"重演"一遍。

  明确一点：回放不产生任何业务逻辑——不重跑采集、不重新落库、不发通知，
  只是把 collect_task_log 里已有的节点状态按时间顺序一张张点亮。
  好处是排查线上问题时能直接看到"卡在哪个节点、那个节点报了什么"，
  而不是去翻日志表。

  画布复用 FlowDesigner 的只读模式：节点形状、连线、状态描边与设计时一致，
  回放只需要逐步喂 states，回放完的画面就是当时的真实拓扑。
-->
<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import { msgError } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReSelect from "@repo/ui/re-select";
import ReTag from "@repo/ui/re-tag";
import FlowDesigner from "./FlowDesigner.vue";
import { fetchMetas, fetchTaskLogs, getFlow, getTask } from "../api/collectApi";
import { costText, statusTagType, statusText } from "../constants/taskStatus";
import { errText } from "../composables/useCollectView";
import type { CollectFlow, CollectShapeMeta, CollectTask, CollectTaskLog } from "../types/collect";

const props = defineProps<{
  modelValue: boolean;
  /** 要回放的运行；传 null 表示还没选 */
  task: CollectTask | null;
}>();

const emit = defineEmits<{ (event: "update:modelValue", value: boolean): void }>();

/** 回放步进间隔（毫秒），做成可调是因为节点多的流程按固定节奏看不过来 */
const stepMs = ref(900);

/** 速度档位：只给四档，够用且不会出现「调成 3ms 什么也看不清」这种误操作 */
const SPEED_OPTIONS = [
  { label: "极快 250ms", value: 250 },
  { label: "快 500ms", value: 500 },
  { label: "正常 900ms", value: 900 },
  { label: "慢 1500ms", value: 1500 },
];

const loading = ref(false);
const playing = ref(false);
const flow = ref<CollectFlow | null>(null);
const metas = ref<CollectShapeMeta[]>([]);
const logs = ref<CollectTaskLog[]>([]);
/** 已回放到的位置（含）；states 逐步喂给画布 */
const cursor = ref(0);
const designer = ref<InstanceType<typeof FlowDesigner> | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;

/**
 * 回放出来的节点状态：nodeId → 日志。
 *
 * 只喂给画布做描边，不参与任何业务判断；同一节点多次迭代时取最后一次，
 * 与「最终状态」语义一致。
 */
const states = computed<Record<string, CollectTaskLog>>(() => {
  const map: Record<string, CollectTaskLog> = {};
  logs.value.slice(0, cursor.value).forEach(log => {
    if (log.collectTaskLogNodeId) {
      map[log.collectTaskLogNodeId] = log;
    }
  });
  return map;
});

const current = computed<CollectTaskLog | null>(() => logs.value[cursor.value - 1] ?? null);
const total = computed(() => logs.value.length);
const finished = computed(() => cursor.value >= total.value && total.value > 0);

/** 只回放本流程的节点日志：子流程的日志记在宿主任务下，画布上并没有那些节点 */
const ownLogs = computed(() => {
  const viewing = Number(props.task?.collectTaskFlowId ?? 0);
  return logs.value.filter(log => {
    if (!log.collectTaskLogNodeId) {
      return false;
    }
    const owner = Number(log.collectTaskLogFlowId ?? 0);
    return !viewing || !owner || owner === viewing;
  });
});

function stop(): void {
  playing.value = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function play(): void {
  if (playing.value || !total.value) {
    return;
  }
  if (finished.value) {
    cursor.value = 0;
  }
  playing.value = true;
  timer = setInterval(() => {
    if (cursor.value >= total.value) {
      stop();
      return;
    }
    cursor.value += 1;
  }, Math.max(200, stepMs.value));
}

function step(): void {
  stop();
  if (cursor.value < total.value) {
    cursor.value += 1;
  }
}

function reset(): void {
  stop();
  cursor.value = 0;
}

async function load(): Promise<void> {
  const taskId = props.task?.collectTaskId;
  if (!taskId) {
    return;
  }
  loading.value = true;
  stop();
  cursor.value = 0;
  try {
    const [detail, nodeLogs] = await Promise.all([getTask(taskId), fetchTaskLogs(taskId)]);
    logs.value = nodeLogs ?? [];
    const flowId = detail?.collectTaskFlowId ?? props.task?.collectTaskFlowId;
    if (flowId) {
      const [detailFlow, metaList] = await Promise.all([getFlow(flowId), fetchMetas()]);
      flow.value = detailFlow;
      metas.value = metaList ?? [];
      // 画布随 flow 一起挂上，等它挂完再灌图（initialDsl 负责晚到的另一半）
      await nextTick();
      designer.value?.load(detailFlow.dsl);
    }
  } catch (error) {
    msgError(errText(error));
  } finally {
    loading.value = false;
  }
}

watch(() => [props.modelValue, props.task?.collectTaskId] as const, ([open]) => {
  if (open) {
    void load();
  } else {
    stop();
  }
}, { immediate: true });

onUnmounted(stop);

/** 失败节点单独标出来：排查时先看它，比顺着动画等一遍快 */
const failedLog = computed(() => ownLogs.value.find(log => log.collectTaskLogStatus === "FAILURE") ?? null);
</script>

<template>
  <ReDialog
    :model-value="modelValue"
    width="1150px"
    top="5vh"
    :title="`运行回放 · ${task?.collectTaskNo || ''}`"
    footer-hidden
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-loading="loading" class="replay">
      <div class="replay__bar">
        <ReTag size="small" :type="statusTagType(task?.collectTaskStatus)">
          {{ statusText(task?.collectTaskStatus) }}
        </ReTag>
        <span class="mono">{{ task?.collectTaskNo }}</span>
        <span class="muted">{{ task?.collectTaskFlowName }}</span>
        <span class="muted">耗时 {{ costText(task?.collectTaskCost) }}</span>
        <span class="muted">产出 {{ task?.collectTaskRecordCount ?? 0 }} 条</span>
        <span class="spacer" />
        <ReButton size="small" icon="VideoPause" :disabled="!total" @click="stop">暂停</ReButton>
        <ReButton size="small" type="primary" icon="VideoPlay" :disabled="!total" @click="play">
          {{ playing ? "播放中" : finished ? "重播" : "播放" }}
        </ReButton>
        <ReButton size="small" icon="DArrowRight" :disabled="!total" @click="step">单步</ReButton>
        <ReButton size="small" icon="RefreshLeft" :disabled="!total" @click="reset">重置</ReButton>
        <span class="speed">
          速度
          <ReSelect v-model="stepMs" size="small" style="width: 96px" :options="SPEED_OPTIONS" />
        </span>
      </div>

      <div class="replay__body">
        <div class="replay__canvas">
          <FlowDesigner
            v-if="flow?.dsl"
            ref="designer"
            readonly
            :metas="metas"
            :initial-dsl="flow.dsl"
            :states="states"
          />
          <div v-else-if="!loading" class="replay__empty">该运行没有可回放的流程图</div>
        </div>

        <div class="replay__side">
          <div class="side-head">
            <span>执行过程</span>
            <span class="muted">{{ cursor }} / {{ total }}</span>
          </div>
          <ol class="step-list">
            <li
              v-for="(log, index) in ownLogs"
              :key="log.collectTaskLogId"
              class="step-item"
              :class="{ 'step-item--done': index < cursor, 'step-item--current': index === cursor - 1 }"
            >
              <span class="dot" :class="`dot-${log.collectTaskLogStatus}`" />
              <div class="step-body">
                <div class="step-title">
                  {{ log.collectTaskLogNodeName || log.collectTaskLogNodeId }}
                  <ReTag size="small" :type="statusTagType(log.collectTaskLogStatus)" effect="plain">
                    {{ statusText(log.collectTaskLogStatus) }}
                  </ReTag>
                </div>
                <div class="step-meta">
                  {{ log.collectTaskLogNodeShape }} · {{ costText(log.collectTaskLogCost) }}
                </div>
                <div v-if="log.collectTaskLogMessage" class="step-msg">{{ log.collectTaskLogMessage }}</div>
              </div>
            </li>
          </ol>
          <div v-if="failedLog" class="side-fail">
            失败节点：{{ failedLog.collectTaskLogNodeName || failedLog.collectTaskLogNodeId }}
            <div class="step-msg">{{ failedLog.collectTaskLogMessage }}</div>
          </div>
          <div v-if="current && playing" class="side-now">当前：{{ current.collectTaskLogNodeName || current.collectTaskLogNodeId }}</div>
        </div>
      </div>
    </div>
  </ReDialog>
</template>

<style scoped>
.replay__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 2px 10px;
  font-size: 13px;
}
.speed {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.mono {
  font-family: var(--rm-font-mono, monospace);
}
.muted {
  color: var(--el-text-color-secondary);
}
.replay__body {
  display: flex;
  gap: 12px;
  height: calc(100vh - 230px);
}
.replay__canvas {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
}
.replay__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-placeholder);
}
.replay__side {
  width: 340px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
}
.side-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.step-list {
  flex: 1;
  margin: 0;
  padding: 6px;
  list-style: none;
  overflow: auto;
}
.step-item {
  display: flex;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 5px;
  opacity: 0.45;
  transition: opacity 0.2s;
}
.step-item--done {
  opacity: 1;
}
.step-item--current {
  background: var(--el-fill-color-light);
  font-weight: 600;
}
.dot {
  flex: none;
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--el-color-info);
}
.dot-SUCCESS {
  background: var(--el-color-success);
}
.dot-FAILURE {
  background: var(--el-color-danger);
}
.dot-RUNNING {
  background: var(--el-color-primary);
}
.dot-STOPPED,
.dot-SKIPPED {
  background: var(--el-color-warning);
}
.step-body {
  min-width: 0;
}
.step-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.step-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.step-msg {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-color-danger);
  word-break: break-all;
}
.side-fail {
  padding: 8px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}
.side-now {
  padding: 6px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
