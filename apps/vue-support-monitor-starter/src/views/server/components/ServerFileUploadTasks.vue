<template>
  <div class="server-file-upload-tasks">
    <!-- 工具�?-->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleCreateTask">
          <IconifyIconOnline icon="ep:plus" />
          新建上传任务
        </el-button>
        <el-button @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" />
          刷新
        </el-button>
      </div>

      <div class="toolbar-right">
        <el-input v-model="searchForm.taskName" placeholder="搜索任务名称" style="width: 200px" clearable @clear="handleSearch" @keyup.enter="handleSearch">
          <template #append>
            <el-button @click="handleSearch">
              <IconifyIconOnline icon="ep:search" />
            </el-button>
          </template>
        </el-input>

        <el-select v-model="searchForm.status" placeholder="任务状�? style="width: 120px; margin-left: 8px" clearable @change="handleSearch">
          <el-option v-for="status in statusOptions" :key="status.value" :label="status.label" :value="status.value" />
        </el-select>

        <el-select v-model="searchForm.serverId" placeholder="选择服务�? style="width: 200px; margin-left: 8px" clearable @change="handleSearch">
          <el-option
            v-for="server in sshServers"
            :key="server.monitorSysGenServerId"
            :label="`${server.monitorSysGenServerName} (${server.monitorSysGenServerHost})`"
            :value="server.monitorSysGenServerId"
          />
        </el-select>
      </div>
    </div>

    <!-- 任务列表 -->
    <el-table v-loading="loading" :data="taskList" stripe border style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />

      <el-table-column prop="monitorSysGenServerFileUploadTaskId" label="任务ID" width="80" />

      <el-table-column prop="monitorSysGenServerFileUploadTaskName" label="任务名称" min-width="150" />

      <el-table-column label="服务�? width="200">
        <template #default="{ row }">
          <div>
            <div class="font-medium">{{ getServerName(row.monitorSysGenServerId) }}</div>
            <div class="text-[var(--el-text-color-regular)] text-sm">{{ getServerHost(row.monitorSysGenServerId) }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="monitorSysGenServerFileUploadFileName" label="文件�? min-width="150" />

      <el-table-column label="文件大小" width="100">
        <template #default="{ row }">
          {{ formatFileSize(row.monitorSysGenServerFileUploadFileSize) }}
        </template>
      </el-table-column>

      <el-table-column prop="monitorSysGenServerFileUploadTargetPath" label="目标路径" min-width="200" />

      <el-table-column label="上传模式" width="100">
        <template #default="{ row }">
          <el-tag :type="row.monitorSysGenServerFileUploadMode === 'REALTIME' ? 'success' : 'warning'">
            {{ getModeText(row.monitorSysGenServerFileUploadMode) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="任务状�? width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.monitorSysGenServerFileUploadStatus)">
            {{ getStatusText(row.monitorSysGenServerFileUploadStatus) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="优先�? width="80">
        <template #default="{ row }">
          <el-tag :type="getPriorityType(row.monitorSysGenServerFileUploadPriority)" size="small">
            {{ row.monitorSysGenServerFileUploadPriority }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="重试次数" width="80">
        <template #default="{ row }">{{ row.monitorSysGenServerFileUploadRetryCount }}/{{ row.monitorSysGenServerFileUploadMaxRetry }}</template>
      </el-table-column>

      <el-table-column label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.monitorSysGenServerFileUploadCreateTime) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button v-if="row.monitorSysGenServerFileUploadStatus === 'PENDING'" type="primary" size="small" @click="handleStartTask(row)">启动</el-button>

            <el-button v-if="['PENDING', 'PROCESSING'].includes(row.monitorSysGenServerFileUploadStatus)" type="warning" size="small" @click="handleCancelTask(row)">取消</el-button>

            <el-button v-if="row.monitorSysGenServerFileUploadStatus === 'FAILED'" type="success" size="small" @click="handleRetryTask(row)">重试</el-button>

            <el-button type="info" size="small" @click="handleViewTask(row)">详情</el-button>

            <el-button v-if="['COMPLETED', 'FAILED', 'CANCELLED'].includes(row.monitorSysGenServerFileUploadStatus)" type="danger" size="small" @click="handleDeleteTask(row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 批量操作 -->
    <div v-if="selectedTasks.length > 0" class="batch-actions">
      <el-card>
        <div class="batch-actions-content">
          <span>已选择 {{ selectedTasks.length }} 个任�?/span>
          <div class="batch-buttons">
            <el-button type="warning" @click="handleBatchCancel">批量取消</el-button>
            <el-button type="success" @click="handleBatchRetry">批量重试</el-button>
            <el-button type="danger" @click="handleBatchDelete">批量删除</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 上传对话�?-->
    <ServerFileUploadDialog ref="uploadDialogRef" :ssh-servers="sshServers" @success="handleUploadSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getServerFileUploadTaskPage,
  startServerFileUploadTask,
  cancelServerFileUploadTask,
  retryServerFileUploadTask,
  deleteServerFileUploadTask,
  batchCancelTasks,
  batchRetryTasks,
  type ServerFileUploadTask,
  type ServerFileUploadTaskPageParams,
  TASK_STATUS
} from "@/api/server-file-upload";
import ServerFileUploadDialog from "./dialogs/ServerFileUploadDialog.vue";

// Props
interface Props {
  sshServers?: Array<{
    monitorSysGenServerId: number;
    monitorSysGenServerName: string;
    monitorSysGenServerHost: string;
    monitorSysGenServerType: string;
  }>;
}

const props = withDefaults(defineProps<Props>(), {
  sshServers: () => []
});

// Emits
const emit = defineEmits<{
  taskUpdated: [];
}>();

// 响应式数�?
const loading = ref(false);
const taskList = ref<ServerFileUploadTask[]>([]);
const selectedTasks = ref<ServerFileUploadTask[]>([]);
const uploadDialogRef = ref();

// 搜索表单
const searchForm = reactive({
  taskName: "",
  status: "",
  serverId: undefined as number | undefined
});

// 分页
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
});

// 状态选项
const statusOptions = [
  { label: "待处�?, value: "PENDING" },
  { label: "处理�?, value: "PROCESSING" },
  { label: "已完�?, value: "COMPLETED" },
  { label: "失败", value: "FAILED" },
  { label: "已取�?, value: "CANCELLED" }
];

// 计算属�?
const serverMap = computed(() => {
  const map = new Map();
  props.sshServers.forEach(server => {
    map.set(server.monitorSysGenServerId, server);
  });
  return map;
});

// 生命周期
onMounted(() => {
  loadTaskList();
});

// 方法
const loadTaskList = async () => {
  try {
    loading.value = true;

    const params: ServerFileUploadTaskPageParams = {
      current: pagination.current,
      size: pagination.size,
      ...searchForm
    };

    const { data } = await getServerFileUploadTaskPage(params);

    taskList.value = data.records;
    pagination.total = data.total;
  } catch (error: any) {
    console.error("加载任务列表失败:", error);
    ElMessage.error(error.message || "加载任务列表失败");
  } finally {
    loading.value = false;
  }
};

const handleRefresh = () => {
  loadTaskList();
};

const handleSearch = () => {
  pagination.current = 1;
  loadTaskList();
};

const handleSizeChange = (size: number) => {
  pagination.size = size;
  pagination.current = 1;
  loadTaskList();
};

const handleCurrentChange = (current: number) => {
  pagination.current = current;
  loadTaskList();
};

const handleSelectionChange = (selection: ServerFileUploadTask[]) => {
  selectedTasks.value = selection;
};

const handleCreateTask = () => {
  uploadDialogRef.value?.open();
};

const handleUploadSuccess = (task: ServerFileUploadTask) => {
  ElMessage.success("上传任务创建成功");
  loadTaskList();
  emit("taskUpdated");
};

const handleStartTask = async (task: ServerFileUploadTask) => {
  try {
    await startServerFileUploadTask(task.monitorSysGenServerFileUploadTaskId);
    ElMessage.success("任务启动成功");
    loadTaskList();
    emit("taskUpdated");
  } catch (error: any) {
    ElMessage.error(error.message || "启动任务失败");
  }
};

const handleCancelTask = async (task: ServerFileUploadTask) => {
  try {
    await ElMessageBox.confirm("确定要取消该任务吗？", "提示", {
      type: "warning"
    });

    await cancelServerFileUploadTask(task.monitorSysGenServerFileUploadTaskId);
    ElMessage.success("任务取消成功");
    loadTaskList();
    emit("taskUpdated");
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "取消任务失败");
    }
  }
};

const handleRetryTask = async (task: ServerFileUploadTask) => {
  try {
    await retryServerFileUploadTask(task.monitorSysGenServerFileUploadTaskId);
    ElMessage.success("任务重试成功");
    loadTaskList();
    emit("taskUpdated");
  } catch (error: any) {
    ElMessage.error(error.message || "重试任务失败");
  }
};

const handleDeleteTask = async (task: ServerFileUploadTask) => {
  try {
    await ElMessageBox.confirm("确定要删除该任务吗？删除后无法恢复�?, "提示", {
      type: "warning"
    });

    await deleteServerFileUploadTask(task.monitorSysGenServerFileUploadTaskId);
    ElMessage.success("任务删除成功");
    loadTaskList();
    emit("taskUpdated");
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "删除任务失败");
    }
  }
};

const handleViewTask = (task: ServerFileUploadTask) => {
  // 这里可以打开任务详情对话�?
  console.log("查看任务详情:", task);
};

const handleBatchCancel = async () => {
  try {
    await ElMessageBox.confirm(`确定要取消选中�?${selectedTasks.value.length} 个任务吗？`, "提示", {
      type: "warning"
    });

    const taskIds = selectedTasks.value.map(task => task.monitorSysGenServerFileUploadTaskId);
    await batchCancelTasks(taskIds);

    ElMessage.success("批量取消成功");
    loadTaskList();
    emit("taskUpdated");
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "批量取消失败");
    }
  }
};

const handleBatchRetry = async () => {
  try {
    await ElMessageBox.confirm(`确定要重试选中�?${selectedTasks.value.length} 个任务吗？`, "提示", {
      type: "warning"
    });

    const taskIds = selectedTasks.value.map(task => task.monitorSysGenServerFileUploadTaskId);
    await batchRetryTasks(taskIds);

    ElMessage.success("批量重试成功");
    loadTaskList();
    emit("taskUpdated");
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "批量重试失败");
    }
  }
};

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中�?${selectedTasks.value.length} 个任务吗？删除后无法恢复。`, "提示", {
      type: "warning"
    });

    // 批量删除需要逐个调用删除接口
    const promises = selectedTasks.value.map(task => deleteServerFileUploadTask(task.monitorSysGenServerFileUploadTaskId));

    await Promise.all(promises);

    ElMessage.success("批量删除成功");
    loadTaskList();
    emit("taskUpdated");
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "批量删除失败");
    }
  }
};

// 设置状态过滤器（供父组件调用）
const setStatusFilter = (status: string) => {
  searchForm.status = status;
  handleSearch();
};

// 工具方法
const getServerName = (serverId: number) => {
  const server = serverMap.value.get(serverId);
  return server?.monitorSysGenServerName || `服务�?{serverId}`;
};

const getServerHost = (serverId: number) => {
  const server = serverMap.value.get(serverId);
  return server?.monitorSysGenServerHost || "-";
};

const formatFileSize = (bytes: number) => {
  if (!bytes) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
};

const formatDateTime = (dateTime: string) => {
  if (!dateTime) return "-";
  return new Date(dateTime).toLocaleString("zh-CN");
};

const getModeText = (mode: string) => {
  const modeMap = {
    REALTIME: "实时",
    SCHEDULED: "定时"
  };
  return modeMap[mode] || mode;
};

const getStatusText = (status: string) => {
  const statusMap = {
    [TASK_STATUS.PENDING]: "待处�?,
    [TASK_STATUS.PROCESSING]: "处理�?,
    [TASK_STATUS.COMPLETED]: "已完�?,
    [TASK_STATUS.FAILED]: "失败",
    [TASK_STATUS.CANCELLED]: "已取�?
  };
  return statusMap[status] || status;
};

const getStatusType = (status: string) => {
  const typeMap = {
    [TASK_STATUS.PENDING]: "info",
    [TASK_STATUS.PROCESSING]: "warning",
    [TASK_STATUS.COMPLETED]: "success",
    [TASK_STATUS.FAILED]: "danger",
    [TASK_STATUS.CANCELLED]: "info"
  };
  return typeMap[status] || "info";
};

const getPriorityType = (priority: number) => {
  if (priority <= 3) return "danger";
  if (priority <= 7) return "warning";
  return "info";
};

// 暴露方法给父组件
defineExpose({
  handleRefresh,
  setStatusFilter
});
</script>

<style scoped>
.server-file-upload-tasks {
  padding: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.pagination {
  margin-top: 16px;
  text-align: right;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.batch-actions-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

.font-medium {
  font-weight: 500;
}

.text-gray-500 {
  color: #6b7280;
}

.text-sm {
  font-size: 0.875rem;
}
</style>
