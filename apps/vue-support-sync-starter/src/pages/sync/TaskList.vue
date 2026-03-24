<template>
  <div class="task-list-container">
    <div class="hero-grid">
      <el-card class="hero-card hero-card--focus" shadow="never">
        <p>同步控制台</p>
        <strong>{{ stats.total }}</strong>
        <span>统一管理任务定义、设计编排、手动执行、监控和配置导入导出。</span>
      </el-card>
      <el-card class="hero-card" shadow="never">
        <p>运行中</p>
        <strong>{{ stats.running }}</strong>
        <span>当前处于 RUNNING 状态的同步任务数量。</span>
      </el-card>
      <el-card class="hero-card" shadow="never">
        <p>成功率</p>
        <strong>{{ stats.successRate }}%</strong>
        <span>基于当前页任务聚合的执行成功率快照。</span>
      </el-card>
      <el-card class="hero-card" shadow="never">
        <p>异常任务</p>
        <strong>{{ stats.error }}</strong>
        <span>最近状态为异常或最近执行失败的任务数量。</span>
      </el-card>
    </div>

    <el-card class="panel" shadow="never">
      <template #header>
        <div class="header-actions">
          <div>
            <p class="panel__eyebrow">Task Center</p>
            <h3>同步任务列表</h3>
          </div>
          <div class="header-toolbar">
            <el-button @click="handleTransformRules">转换规则</el-button>
            <el-button @click="openImportDialog">导入配置</el-button>
            <el-button type="primary" @click="handleCreate">创建任务</el-button>
          </div>
        </div>
      </template>

      <div class="search-bar">
        <el-input
          v-model="query.taskName"
          placeholder="搜索任务名称"
          clearable
          style="width: 280px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="query.taskStatus"
          placeholder="任务状态"
          clearable
          style="width: 150px"
          @change="handleSearch"
        >
          <el-option label="运行中" value="RUNNING" />
          <el-option label="已停止" value="STOPPED" />
          <el-option label="异常" value="ERROR" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-radio-group v-model="viewMode" class="view-mode">
          <el-radio-button label="table">表格视图</el-radio-button>
          <el-radio-button label="card">卡片视图</el-radio-button>
        </el-radio-group>
      </div>

      <el-table
        v-if="viewMode === 'table'"
        :data="taskStore.tasks"
        :loading="taskStore.loading"
        class="table"
      >
        <el-table-column prop="syncTaskId" label="ID" width="80" />
        <el-table-column prop="syncTaskName" label="任务名称" min-width="180" />
        <el-table-column prop="syncTaskDesc" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column prop="syncTaskStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.syncTaskStatus)">
              {{ getStatusText(row.syncTaskStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="syncTaskSyncMode" label="同步模式" width="120">
          <template #default="{ row }">
            {{ getSyncModeText(row.syncTaskSyncMode) }}
          </template>
        </el-table-column>
        <el-table-column prop="syncTaskCron" label="CRON" min-width="180" show-overflow-tooltip />
        <el-table-column prop="syncTaskBatchSize" label="批次大小" width="110" />
        <el-table-column prop="syncTaskLastRunTime" label="最后运行时间" min-width="180" />
        <el-table-column label="操作" width="520" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleDesign(row)">设计</el-button>
            <el-button size="small" @click="handleEdit(row)" :disabled="row.syncTaskStatus === 'RUNNING'">编辑</el-button>
            <el-button size="small" type="success" @click="handleStart(row)" :disabled="row.syncTaskStatus === 'RUNNING'">
              启动
            </el-button>
            <el-button size="small" type="warning" @click="handleStop(row)" :disabled="row.syncTaskStatus !== 'RUNNING'">
              停止
            </el-button>
            <el-button size="small" type="primary" @click="handleExecute(row)">执行一次</el-button>
            <el-button size="small" type="info" @click="handleLogs(row)">日志</el-button>
            <el-button size="small" @click="handleMonitor(row)">监控</el-button>
            <el-dropdown trigger="click" @command="(command) => handleMore(command, row)">
              <el-button size="small">
                更多
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="copy">复制任务</el-dropdown-item>
                  <el-dropdown-item command="export">导出配置</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除任务</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div v-else class="card-view">
        <el-row :gutter="20">
          <el-col
            v-for="task in taskStore.tasks"
            :key="task.syncTaskId"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
          >
            <TaskCard
              :task="task"
              @design="handleDesign"
              @edit="handleEdit"
              @start="handleStart"
              @stop="handleStop"
              @logs="handleLogs"
              @monitor="handleMonitor"
              @execute="handleExecute"
              @copy="handleCopy"
              @export="handleExport"
              @delete="handleDelete"
            />
          </el-col>
        </el-row>
      </div>

      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.size"
        :total="taskStore.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pager"
        @size-change="handleSearch"
        @current-change="handleSearch"
      />
    </el-card>

    <TaskForm v-model="formVisible" :task="editingTask" @submit="handleSubmit" />

    <el-dialog v-model="importVisible" title="导入任务配置" width="760px">
      <el-input
        v-model="importJson"
        type="textarea"
        :rows="18"
        placeholder="粘贴导出的任务 JSON 配置"
      />
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="handleImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import TaskCard from "../../components/TaskCard.vue";
import TaskForm from "../../components/TaskForm.vue";
import { useTaskStore } from "../../stores/task";
import {
  copySyncTask,
  exportSyncTask,
  importSyncTask,
  type SyncTask,
  type SyncTaskQuery,
} from "../../api/sync";

const router = useRouter();
const taskStore = useTaskStore();

const viewMode = ref<"table" | "card">("table");
const formVisible = ref(false);
const importVisible = ref(false);
const importing = ref(false);
const editingTask = ref<SyncTask | null>(null);
const importJson = ref("");

const query = reactive<SyncTaskQuery>({
  page: 1,
  size: 10,
  taskName: "",
  taskStatus: "",
  orderBy: "syncTaskCreateTime",
  desc: true,
});

const stats = computed(() => {
  const total = taskStore.tasks.length;
  const running = taskStore.tasks.filter((item) => item.syncTaskStatus === "RUNNING").length;
  const error = taskStore.tasks.filter((item) =>
    item.syncTaskStatus === "ERROR" || item.syncTaskLastRunStatus === "FAIL",
  ).length;
  const runCount = taskStore.tasks.reduce((sum, item) => sum + Number(item.syncTaskRunCount || 0), 0);
  const successCount = taskStore.tasks.reduce((sum, item) => sum + Number(item.syncTaskSuccessCount || 0), 0);
  const successRate = runCount > 0 ? Math.round((successCount / runCount) * 100) : 0;
  return { total, running, error, successRate };
});

const loadTasks = async () => {
  await taskStore.fetchTasks({ ...query });
};

const handleSearch = async () => {
  await loadTasks();
};

const handleReset = async () => {
  query.taskName = "";
  query.taskStatus = "";
  query.page = 1;
  await loadTasks();
};

const handleCreate = () => {
  editingTask.value = null;
  formVisible.value = true;
};

const handleTransformRules = () => {
  router.push("/sync/transforms");
};

const handleEdit = (task: SyncTask) => {
  editingTask.value = { ...task };
  formVisible.value = true;
};

const handleSubmit = async (payload: SyncTask) => {
  try {
    if (editingTask.value?.syncTaskId) {
      await taskStore.updateTask({
        ...editingTask.value,
        ...payload,
        syncTaskId: editingTask.value.syncTaskId,
      });
      ElMessage.success("任务更新成功");
      formVisible.value = false;
      await loadTasks();
      return;
    }

    const created = await taskStore.createTask(payload);
    ElMessage.success("任务创建成功");
    formVisible.value = false;
    await loadTasks();

    if (created?.syncTaskId) {
      router.push(`/sync/design/${created.syncTaskId}`);
    }
  } catch (error: any) {
    ElMessage.error(error?.message || "操作失败");
  }
};

const handleDesign = (task: SyncTask) => {
  if (!task.syncTaskId) return;
  router.push(`/sync/design/${task.syncTaskId}`);
};

const handleLogs = (task: SyncTask) => {
  if (!task.syncTaskId) return;
  router.push(`/sync/logs/${task.syncTaskId}`);
};

const handleMonitor = (task: SyncTask) => {
  if (!task.syncTaskId) return;
  router.push(`/sync/monitor?taskId=${task.syncTaskId}`);
};

const handleStart = async (task: SyncTask) => {
  if (!task.syncTaskId) return;
  try {
    await taskStore.startTask(task.syncTaskId);
    ElMessage.success("任务启动成功");
    await loadTasks();
  } catch (error: any) {
    ElMessage.error(error?.message || "启动失败");
  }
};

const handleStop = async (task: SyncTask) => {
  if (!task.syncTaskId) return;
  try {
    await taskStore.stopTask(task.syncTaskId);
    ElMessage.success("任务停止成功");
    await loadTasks();
  } catch (error: any) {
    ElMessage.error(error?.message || "停止失败");
  }
};

const handleExecute = async (task: SyncTask) => {
  if (!task.syncTaskId) return;
  try {
    const logId = await taskStore.executeTaskOnce(task.syncTaskId);
    ElMessage.success(logId ? `任务已触发，日志ID: ${logId}` : "任务已触发");
    await loadTasks();
  } catch (error: any) {
    ElMessage.error(error?.message || "执行失败");
  }
};

const handleCopy = async (task: SyncTask) => {
  if (!task.syncTaskId) return;
  try {
    const { value } = await ElMessageBox.prompt("请输入新任务名称", "复制任务", {
      inputValue: `${task.syncTaskName || "任务"}-副本`,
      inputPlaceholder: "请输入复制后的任务名称",
    });
    const res = await copySyncTask(task.syncTaskId, value);
    ElMessage.success("任务复制成功");
    await loadTasks();
    if (res.data?.syncTaskId) {
      router.push(`/sync/design/${res.data.syncTaskId}`);
    }
  } catch (error: any) {
    if (error !== "cancel" && error !== "close") {
      ElMessage.error(error?.message || "复制失败");
    }
  }
};

const handleExport = async (task: SyncTask) => {
  if (!task.syncTaskId) return;
  try {
    const res = await exportSyncTask(task.syncTaskId);
    const blob = new Blob([res.data || ""], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${task.syncTaskName || "sync-task"}-${task.syncTaskId}.json`;
    link.click();
    URL.revokeObjectURL(url);
    ElMessage.success("任务配置已导出");
  } catch (error: any) {
    ElMessage.error(error?.message || "导出失败");
  }
};

const handleDelete = async (task: SyncTask) => {
  if (!task.syncTaskId) return;
  try {
    await ElMessageBox.confirm(`确定要删除任务“${task.syncTaskName}”吗？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await taskStore.deleteTask(task.syncTaskId);
    ElMessage.success("删除成功");
    await loadTasks();
  } catch (error: any) {
    if (error !== "cancel" && error !== "close") {
      ElMessage.error(error?.message || "删除失败");
    }
  }
};

const handleMore = async (command: string, task: SyncTask) => {
  if (command === "copy") {
    await handleCopy(task);
    return;
  }
  if (command === "export") {
    await handleExport(task);
    return;
  }
  if (command === "delete") {
    await handleDelete(task);
  }
};

const openImportDialog = () => {
  importJson.value = "";
  importVisible.value = true;
};

const handleImport = async () => {
  if (!importJson.value.trim()) {
    ElMessage.error("请先粘贴任务配置 JSON");
    return;
  }
  importing.value = true;
  try {
    const res = await importSyncTask(importJson.value);
    ElMessage.success("任务导入成功");
    importVisible.value = false;
    await loadTasks();
    if (res.data?.syncTaskId) {
      router.push(`/sync/design/${res.data.syncTaskId}`);
    }
  } catch (error: any) {
    ElMessage.error(error?.message || "导入失败");
  } finally {
    importing.value = false;
  }
};

const getStatusType = (status?: string) => {
  const map: Record<string, string> = {
    RUNNING: "success",
    STOPPED: "info",
    ERROR: "danger",
  };
  return status ? map[status] || "info" : "info";
};

const getStatusText = (status?: string) => {
  const map: Record<string, string> = {
    RUNNING: "运行中",
    STOPPED: "已停止",
    ERROR: "异常",
  };
  return status ? map[status] || status : "未知";
};

const getSyncModeText = (mode?: string) => {
  const map: Record<string, string> = {
    FULL: "全量同步",
    INCREMENTAL: "增量同步",
    BIDIRECTIONAL: "双向同步",
  };
  return mode ? map[mode] || mode : "-";
};

onMounted(() => {
  loadTasks();
});
</script>

<style scoped lang="scss">
.task-list-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.hero-card,
.panel {
  border: none;
  border-radius: 24px;
  box-shadow: 0 18px 60px rgba(43, 31, 22, 0.08);
}

.hero-card {
  background: linear-gradient(160deg, rgba(252, 248, 242, 0.96) 0%, rgba(255, 255, 255, 0.92) 100%);
}

.hero-card :deep(.el-card__body) {
  padding: 22px;
}

.hero-card--focus {
  background:
    radial-gradient(circle at top right, rgba(92, 148, 255, 0.28), transparent 34%),
    linear-gradient(135deg, #121a2c 0%, #274472 58%, #3e7db8 100%);
}

.hero-card p,
.hero-card span {
  margin: 0;
}

.hero-card p {
  color: #7c6755;
}

.hero-card--focus p,
.hero-card--focus span,
.hero-card--focus strong {
  color: #eff6ff;
}

.hero-card strong {
  display: block;
  margin: 10px 0 12px;
  font-size: 34px;
  color: #1f1d1a;
}

.hero-card span {
  line-height: 1.7;
  color: #6a5a4d;
}

.panel :deep(.el-card__body) {
  padding-top: 14px;
}

.panel__eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #8f6a4b;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;

  h3 {
    margin: 0;
    font-size: 24px;
  }
}

.header-toolbar {
  display: flex;
  gap: 10px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.view-mode {
  margin-left: auto;
}

.table {
  margin-top: 20px;
  border-radius: 18px;
  overflow: hidden;
}

.card-view {
  margin-top: 20px;

  .el-col {
    margin-bottom: 20px;
  }
}

.pager {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1200px) {
  .hero-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .view-mode {
    margin-left: 0;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
