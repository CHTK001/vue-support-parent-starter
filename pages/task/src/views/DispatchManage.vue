<script setup lang="ts">
/**
 * 任务派发页
 *
 * 派发任务列表 + 详情/取消/暂停/恢复/删除 + 节点列表/删除
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { CircleClose, Delete, Monitor, VideoPause, VideoPlay } from "@element-plus/icons-vue";
import {
  cancelDispatchTask,
  deleteDispatchTask,
  listDispatchNodes,
  listDispatchTasks,
  pauseDispatchTask,
  removeDispatchNode,
  resumeDispatchTask,
} from "../api/taskApi";
import type { DispatchNode, DispatchTask } from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

const taskTableRef = ref();
const nodeTableRef = ref();
const tasks = ref<DispatchTask[]>([]);
const nodes = ref<DispatchNode[]>([]);
const loading = ref(false);
const nodeLoading = ref(false);

const taskStatusMap: Record<string, { label: string; type: "success" | "warning" | "info" | "danger" | "primary" }> = {
  PENDING: { label: "待处理", type: "info" },
  RUNNING: { label: "执行中", type: "primary" },
  SUCCESS: { label: "成功", type: "success" },
  FAILED: { label: "失败", type: "danger" },
  CANCELLED: { label: "已取消", type: "warning" },
  PAUSED: { label: "已暂停", type: "warning" },
};

function statusMeta(status?: string) {
  return taskStatusMap[String(status ?? "").toUpperCase()] ?? { label: status || "未知", type: "info" as const };
}

async function loadTasks() {
  loading.value = true;
  try {
    const res = await listDispatchTasks();
    tasks.value = (res?.data ?? []) as DispatchTask[];
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "加载任务失败");
  } finally {
    loading.value = false;
  }
}

async function loadNodes() {
  nodeLoading.value = true;
  try {
    const res = await listDispatchNodes();
    nodes.value = (res?.data ?? []) as DispatchNode[];
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "加载节点失败");
  } finally {
    nodeLoading.value = false;
  }
}

/* ================== 任务操作 ================== */

const opTaskId = ref("");
const opNodeId = ref("");

async function handleTaskAction(action: "cancel" | "pause" | "resume" | "delete", task: DispatchTask) {
  if (opTaskId.value) return;
  const name = task.taskId ?? task.taskType ?? "任务";
  if (action === "delete") {
    try {
      await ElMessageBox.confirm(`确认删除任务「${name}」？`, "提示", { type: "warning", confirmButtonText: "确认删除" });
    } catch {
      return;
    }
  }
  opTaskId.value = task.taskId!;
  try {
    const fn = {
      cancel: cancelDispatchTask,
      pause: pauseDispatchTask,
      resume: resumeDispatchTask,
      delete: deleteDispatchTask,
    }[action];
    await fn(task.taskId!);
    ElMessage.success({ cancel: "已取消", pause: "已暂停", resume: "已恢复", delete: "已删除" }[action]);
    await loadTasks();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "操作失败");
  } finally {
    opTaskId.value = "";
  }
}

async function handleRemoveNode(node: DispatchNode) {
  if (opNodeId.value) return;
  try {
    await ElMessageBox.confirm(`确认移除节点「${node.nodeId}」？`, "提示", { type: "warning", confirmButtonText: "确认移除" });
  } catch {
    return;
  }
  opNodeId.value = node.nodeId!;
  try {
    await removeDispatchNode(node.nodeId!);
    ElMessage.success("节点已移除");
    await loadNodes();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "移除失败");
  } finally {
    opNodeId.value = "";
  }
}

const taskColumns: ReTableColumn[] = [
  { prop: "taskId", label: "任务ID", minWidth: 160, showOverflowTooltip: true },
  { prop: "taskType", label: "任务类型", minWidth: 120, slot: "taskType" },
  { prop: "taskStatus", label: "状态", width: 100, slot: "taskStatus", align: "center" },
  { prop: "retryCount", label: "重试次数", width: 90, align: "center" },
  { prop: "createdAt", label: "创建时间", width: 170, align: "center" },
  { prop: "completedAt", label: "完成时间", width: 170, align: "center" },
  { prop: "action", label: "操作", width: 220, slot: "action", fixed: "right" },
];

const nodeColumns: ReTableColumn[] = [
  { prop: "nodeId", label: "节点ID", minWidth: 160, showOverflowTooltip: true },
  { prop: "host", label: "主机", minWidth: 130, slot: "host" },
  { prop: "port", label: "端口", width: 80, align: "center" },
  { prop: "tags", label: "标签", minWidth: 120, slot: "tags" },
  { prop: "weight", label: "权重", width: 80, align: "center" },
  { prop: "online", label: "在线", width: 80, slot: "online", align: "center" },
  { prop: "lastHeartbeat", label: "最后心跳", minWidth: 160 },
  { prop: "action", label: "操作", width: 100, slot: "action", fixed: "right" },
];

onMounted(() => {
  loadTasks();
  loadNodes();
});
</script>

<template>
  <div class="task-page">
    <div class="task-page__header">
      <div>
        <h2 class="task-page__title">任务派发</h2>
        <p class="task-page__subtitle">分布式任务派发、取消、暂停与节点管理</p>
      </div>
      <ReButton layout="modern" icon="Refresh" @click="loadTasks">刷新</ReButton>
    </div>

    <el-card shadow="never" class="task-page__card">
      <ReTable
        ref="taskTableRef"
        table-id="task-dispatch"
        :columns="taskColumns"
        :data="tasks"
        :pagination="false"
        row-key="taskId"
        v-loading="loading"
      >
        <template #taskType="{ row }">
          <ReTag type="primary" effect="plain" >{{ row.taskType || "-" }}</ReTag>
        </template>
        <template #taskStatus="{ row }">
          <ReTag :type="statusMeta(row.taskStatus).type" effect="plain" >
            {{ statusMeta(row.taskStatus).label }}
          </ReTag>
        </template>
        <template #action="{ row }">
          <ReButton v-if="String(row.taskStatus).toUpperCase() !== 'CANCELLED'" layout="square" link type="warning" :icon="CircleClose" :loading="opTaskId === row.taskId" tip="取消" @click="handleTaskAction('cancel', row)"/>
          <ReButton v-if="String(row.taskStatus).toUpperCase() === 'PAUSED'" layout="square" link type="success" :icon="VideoPlay" :loading="opTaskId === row.taskId" tip="恢复" @click="handleTaskAction('resume', row)"/>
          <ReButton v-else-if="String(row.taskStatus).toUpperCase() !== 'CANCELLED'" layout="square" link type="warning" :icon="VideoPause" :loading="opTaskId === row.taskId" tip="暂停" @click="handleTaskAction('pause', row)"/>
          <ReButton layout="square" link type="danger" :icon="Delete" :loading="opTaskId === row.taskId" tip="删除" @click="handleTaskAction('delete', row)"/>
        </template>
      </ReTable>
    </el-card>

    <el-card shadow="never" class="task-page__card">
      <template #header>
        <div class="task-page__card-head">
          <span class="task-page__card-title">
            <el-icon class="task-page__card-icon"><Monitor /></el-icon>
            执行节点
          </span>
          <span class="task-page__card-count">共 {{ nodes.length }} 个节点</span>
        </div>
      </template>
      <ReTable
        ref="nodeTableRef"
        table-id="task-node"
        :columns="nodeColumns"
        :data="nodes"
        :pagination="false"
        row-key="nodeId"
        v-loading="nodeLoading"
      >
        <template #host="{ row }">
          <span v-if="row.host">{{ row.host }}</span>
          <span v-else class="task-dim">-</span>
        </template>
        <template #tags="{ row }">
          <ReTag v-for="t in row.tags ?? []" :key="t" type="info" effect="plain" class="task-tag-mr">
            {{ t }}
          </ReTag>
          <span v-if="!row.tags?.length" class="task-dim">-</span>
        </template>
        <template #online="{ row }">
          <span :class="['task-status-pill', row.online ? 'on' : 'off']">
            {{ row.online ? "在线" : "离线" }}
          </span>
        </template>
        <template #action="{ row }">
          <ReButton layout="square" link type="danger" :icon="Delete" :loading="opNodeId === row.nodeId" tip="移除" @click="handleRemoveNode(row)"/>
        </template>
      </ReTable>
    </el-card>
  </div>
</template>

<style scoped>
.task-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.task-page__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.task-page__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}

.task-page__subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.task-page__card {
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.task-page__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-page__card-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.task-page__card-icon {
  color: var(--el-color-primary);
}

.task-page__card-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.task-dim {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.task-tag-mr {
  margin-right: 4px;
}

.task-status-pill {
  display: inline-block;
  padding: 2px 8px;
  /* 原为 999px 胶囊；改用 EP 的 full 档（9999px），视觉等价 */
  border-radius: var(--el-radius-full, 9999px);
  font-size: 11px;
  font-weight: 600;
}

.task-status-pill.on {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 8%, transparent);
}

.task-status-pill.off {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
}

@media screen and (max-width: 768px) {
  .task-page {
    padding: 16px;
    gap: 12px;
  }
}
</style>