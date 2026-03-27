<template>
  <div class="task-list-container">
    <el-card>
      <template #header>
        <div class="header-actions">
          <h3>同步任务列表</h3>
          <el-button type="primary" @click="handleCreate">创建任务</el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input
          v-model="query.taskName"
          placeholder="搜索任务名称"
          clearable
          style="width: 300px; margin-right: 10px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="query.taskStatus"
          placeholder="任务状态"
          clearable
          style="width: 150px; margin-right: 10px"
          @change="handleSearch"
        >
          <el-option label="运行中" value="RUNNING" />
          <el-option label="已停止" value="STOPPED" />
          <el-option label="异常" value="ERROR" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-radio-group v-model="viewMode" style="margin-left: 20px">
          <el-radio-button label="table">表格视图</el-radio-button>
          <el-radio-button label="card">卡片视图</el-radio-button>
        </el-radio-group>
      </div>

      <el-table
        v-if="viewMode === 'table'"
        :data="taskStore.tasks"
        :loading="taskStore.loading"
        style="margin-top: 20px"
      >
        <el-table-column prop="syncTaskId" label="ID" width="80" />
        <el-table-column prop="syncTaskName" label="任务名称" min-width="180" />
        <el-table-column
          prop="syncTaskDesc"
          label="描述"
          min-width="220"
          show-overflow-tooltip
        />
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
        <el-table-column
          prop="syncTaskBatchSize"
          label="批次大小"
          width="110"
        />
        <el-table-column
          prop="syncTaskLastRunTime"
          label="最后运行时间"
          min-width="180"
        />
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleDesign(row)">设计</el-button>
            <el-button
              size="small"
              :disabled="row.syncTaskStatus === 'RUNNING'"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="success"
              :disabled="row.syncTaskStatus === 'RUNNING'"
              @click="handleStart(row)"
            >
              启动
            </el-button>
            <el-button
              size="small"
              type="warning"
              :disabled="row.syncTaskStatus !== 'RUNNING'"
              @click="handleStop(row)"
            >
              停止
            </el-button>
            <el-button size="small" type="info" @click="handleLogs(row)">
              日志
            </el-button>
            <el-button size="small" type="primary" @click="handleMonitor(row)">
              监控
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">
              删除
            </el-button>
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
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="handleSearch"
        @current-change="handleSearch"
      />
    </el-card>

    <TaskForm
      v-model="formVisible"
      :task="editingTask"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import TaskCard from "../../components/TaskCard.vue";
import TaskForm from "../../components/TaskForm.vue";
import { useTaskStore } from "../../stores/task";
import type { SyncTask, SyncTaskQuery } from "../../api/sync";

const router = useRouter();
const taskStore = useTaskStore();

const viewMode = ref<"table" | "card">("table");
const formVisible = ref(false);
const editingTask = ref<SyncTask | null>(null);

const query = reactive<SyncTaskQuery>({
  page: 1,
  size: 20,
  taskName: "",
  taskStatus: "",
  desc: true,
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

const handleDelete = async (task: SyncTask) => {
  if (!task.syncTaskId) return;
  try {
    await ElMessageBox.confirm(
      `确定要删除任务“${task.syncTaskName}”吗？`,
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );
    await taskStore.deleteTask(task.syncTaskId);
    ElMessage.success("删除成功");
    await loadTasks();
  } catch (error: any) {
    if (error !== "cancel" && error !== "close") {
      ElMessage.error(error?.message || "删除失败");
    }
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
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
  }
}

.search-bar {
  display: flex;
  align-items: center;
}

.card-view {
  margin-top: 20px;

  .el-col {
    margin-bottom: 20px;
  }
}
</style>
