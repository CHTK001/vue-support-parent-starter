<script setup lang="ts">
/**
 * 任务中心页
 *
 * 展示进行中的下载任务列表，支持刷新、取消、暂停/继续、部分导出、删除，
 * 并每 4 秒轮询任务状态。
 * @author CH
 * @since 4.0.0
 */
import { ref, onMounted, onBeforeUnmount } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getActiveTasks, cancelTask, togglePauseTask, removeTask, exportPartialTask } from "@/api/tile";
import { useRouter } from "vue-router";
import type { TaskInfo } from "@/types";

const router = useRouter();

const tasks = ref<TaskInfo[]>([]);
const loading = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: "排队中", type: "info" },
  downloading: { label: "下载中", type: "primary" },
  merging: { label: "拼接中", type: "warning" },
  processing: { label: "处理中", type: "warning" },
  exporting: { label: "导出中", type: "warning" },
  building_pyramid: { label: "建金字塔", type: "warning" },
  completed: { label: "已完成", type: "success" },
  completed_with_gaps: { label: "完成(有缺失)", type: "warning" },
  failed: { label: "失败", type: "danger" },
  cancelled: { label: "已取消", type: "info" },
  paused: { label: "已暂停", type: "info" },
  pending_decision: { label: "待处理", type: "danger" },
};

/** 刷新任务列表 */
async function refresh() {
  loading.value = true;
  try {
    tasks.value = await getActiveTasks();
  } catch (e: any) {
    /* 后端未启动时静默 */
  } finally {
    loading.value = false;
  }
}

/**
 * 取消任务
 * @param id 任务 ID
 */
async function onCancel(id: string) {
  try {
    await cancelTask(id);
    ElMessage.success("已取消任务");
    refresh();
  } catch (e: any) {
    ElMessage.error(`取消失败：${e?.message ?? e}`);
  }
}

/**
 * 切换任务暂停/继续
 * @param id 任务 ID
 */
async function onPause(id: string) {
  try {
    const res = await togglePauseTask(id);
    ElMessage.success(res.message || "已切换暂停状态");
    refresh();
  } catch (e: any) {
    ElMessage.error(`操作失败：${e?.message ?? e}`);
  }
}

/**
 * 请求导出任务的已完成部分
 * @param id 任务 ID
 */
async function onExportPartial(id: string) {
  try {
    const res = await exportPartialTask(id);
    ElMessage.success(res.message || "已请求导出");
  } catch (e: any) {
    ElMessage.error(`导出失败：${e?.message ?? e}`);
  }
}

/**
 * 删除任务记录
 * @param id 任务 ID
 */
async function onRemove(id: string) {
  try {
    await ElMessageBox.confirm("确定删除该任务记录？", "删除任务", { type: "warning" });
    await removeTask(id);
    ElMessage.success("已删除");
    refresh();
  } catch (e: any) {
    if (e !== "cancel") ElMessage.error(`删除失败：${e?.message ?? e}`);
  }
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 可读的文件大小字符串
 */
function formatSize(bytes?: number) {
  if (!bytes) return "-";
  if (bytes > 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes > 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

/** 跳转至工作台新建任务 */
function goWorkspace() {
  router.push("/workspace");
}

/** 轮询任务状态 */
function poll() {
  refresh();
}

onMounted(() => {
  refresh();
  timer = setInterval(poll, 4000);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="tasks-page">
    <div class="tasks-head">
      <div class="tasks-title">
        <el-icon><List /></el-icon>
        <span>任务中心</span>
        <el-tag size="small" type="info" effect="plain">{{ tasks.length }} 个任务</el-tag>
      </div>
      <div class="tasks-actions">
        <el-button :icon="'Refresh'" :loading="loading" @click="refresh">刷新</el-button>
        <el-button type="primary" :icon="'Plus'" @click="goWorkspace" text>新建任务</el-button>
      </div>
    </div>

    <el-table :data="tasks" v-loading="loading" border stripe empty-text="暂无任务" class="tasks-table">
      <el-table-column prop="id" label="任务 ID" width="180" show-overflow-tooltip />
      <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
      <el-table-column prop="sourceName" label="图源" width="120" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.sourceName || row.source || "-" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="级别" width="70" align="center">
        <template #default="{ row }">{{ row.zoom ?? "-" }}</template>
      </el-table-column>
      <el-table-column label="格式" width="100">
        <template #default="{ row }">{{ row.format || "-" }}</template>
      </el-table-column>
      <el-table-column label="进度" width="220">
        <template #default="{ row }">
          <div class="prog-cell">
            <el-progress
              :percentage="Math.min(100, Math.round(row.progress ?? (row.completed && row.total ? (row.completed / row.total) * 100 : 0)))"
              :status="row.status === 'failed' ? 'exception' : undefined"
            />
            <span class="prog-num">{{ row.completed ?? 0 }}/{{ row.total ?? 0 }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="(statusMap[row.status]?.type as any) ?? 'info'" size="small">
            {{ statusMap[row.status]?.label ?? row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="大小" width="100" align="right">
        <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="warning"
            size="small"
            v-if="['downloading', 'pending', 'merging', 'exporting', 'processing'].includes(row.status)"
            @click="onPause(row.id)"
          >
            暂停
          </el-button>
          <el-button link type="success" size="small" v-if="row.status === 'paused'" @click="onPause(row.id)">
            继续
          </el-button>
          <el-button link type="danger" size="small" @click="onCancel(row.id)">取消</el-button>
          <el-button link type="primary" size="small" v-if="row.status === 'failed'" @click="onExportPartial(row.id)">
            部分导出
          </el-button>
          <el-button link type="danger" size="small" @click="onRemove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.tasks-page {
  height: calc(100vh - 128px);
  padding: 8px;
  overflow: auto;
}
.tasks-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 12px;
}
.tasks-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.tasks-actions {
  display: flex;
  gap: 8px;
}
.tasks-table {
  width: 100%;
}
.prog-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.prog-cell .el-progress {
  flex: 1;
}
.prog-num {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
</style>