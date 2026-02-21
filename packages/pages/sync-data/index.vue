<template>
  <div class="sync-data-container system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <IconifyIconOnline icon="ri:refresh-line" class="title-icon" />
          <div>
            <h2>数据同步管理</h2>
            <p>管理数据同步任务和配置同步策略</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建任务
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon><List /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">任务总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon running">
              <el-icon><VideoPlay /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.running }}</div>
              <div class="stat-label">运行中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon success">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.successRate }}%</div>
              <div class="stat-label">成功率</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon error">
              <el-icon><WarningFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.error }}</div>
              <div class="stat-label">异常任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 查询和列表 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="任务名称">
          <el-input
            v-model="queryParams.taskName"
            placeholder="请输入任务名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.taskStatus" placeholder="全部" clearable style="width: 120px">
            <el-option label="已停止" value="STOPPED" />
            <el-option label="运行中" value="RUNNING" />
            <el-option label="异常" value="ERROR" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshRight /></el-icon>
            重置
          </el-button>
          <el-button :loading="refreshing" @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="taskList"
        border
        class="task-table"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="syncTaskId" label="ID" width="80" />
        <el-table-column prop="syncTaskName" label="任务名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="syncTaskDesc" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="syncTaskStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.syncTaskStatus)">
              {{ getStatusText(row.syncTaskStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="syncTaskBatchSize" label="批次大小" width="100" />
        <el-table-column prop="syncTaskCron" label="CRON表达式" min-width="150" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="350" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="info" @click="handleDesign(row)">设计流程</el-button>
            <el-button
              v-if="row.syncTaskStatus !== 'RUNNING'"
              link
              type="success"
              @click="handleStart(row)"
            >
              启动
            </el-button>
            <el-button v-else link type="warning" @click="handleStop(row)">停止</el-button>
            <el-button link type="info" @click="handleExecuteOnce(row)">执行</el-button>
            <el-button link type="primary" @click="handleLogs(row)">日志</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 新建/编辑任务对话框 -->
    <sc-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="任务名称" prop="syncTaskName">
          <el-input v-model="formData.syncTaskName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务描述" prop="syncTaskDesc">
          <el-input
            v-model="formData.syncTaskDesc"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        <el-form-item label="批次大小" prop="syncTaskBatchSize">
          <el-input-number v-model="formData.syncTaskBatchSize" :min="1" :max="100000" />
        </el-form-item>
        <el-form-item label="重试次数" prop="syncTaskRetryCount">
          <el-input-number v-model="formData.syncTaskRetryCount" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="重试间隔(ms)" prop="syncTaskRetryInterval">
          <el-input-number v-model="formData.syncTaskRetryInterval" :min="0" :step="1000" />
        </el-form-item>
        <el-form-item label="同步间隔(ms)" prop="syncTaskSyncInterval">
          <el-input-number v-model="formData.syncTaskSyncInterval" :min="0" :step="1000" />
        </el-form-item>
        <el-form-item label="CRON表达式" prop="syncTaskCron">
          <el-input v-model="formData.syncTaskCron" placeholder="如: 0 0 * * * ?" />
        </el-form-item>
        <el-form-item label="启用ACK" prop="syncTaskAckEnabled">
          <el-switch
            v-model="formData.syncTaskAckEnabled"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
        <el-form-item label="启用事务" prop="syncTaskTransactionEnabled">
          <el-switch
            v-model="formData.syncTaskTransactionEnabled"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </sc-dialog>

    <!-- 流程设计器对话框 -->
    <sc-dialog
      v-model="designerDialogVisible"
      title="设计同步任务流程"
      width="95vw"
      destroy-on-close
    >
      <SyncTaskDesigner
        v-if="designerDialogVisible"
        :task-id="currentTaskId"
        :design="currentDesign"
        @save="handleDesignSave"
        @cancel="designerDialogVisible = false"
      />
    </sc-dialog>

    <!-- 执行日志对话框 -->
    <sc-dialog
      v-model="logsDialogVisible"
      title="执行日志"
      width="900px"
      destroy-on-close
    >
      <el-table v-loading="logsLoading" :data="logsList" border>
        <el-table-column prop="syncLogId" label="ID" width="80" />
        <el-table-column prop="syncLogStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getLogStatusType(row.syncLogStatus)">
              {{ row.syncLogStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="syncLogTriggerType" label="触发类型" width="100" />
        <el-table-column label="数据统计" width="200">
          <template #default="{ row }">
            <div>读取: {{ row.syncLogReadCount || 0 }}</div>
            <div>写入: {{ row.syncLogWriteCount || 0 }}</div>
            <div>成功: {{ row.syncLogSuccessCount || 0 }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="syncLogCost" label="耗时(ms)" width="100" />
        <el-table-column prop="syncLogStartTime" label="开始时间" width="180" />
        <el-table-column prop="syncLogMessage" label="消息" show-overflow-tooltip />
      </el-table>
      <el-pagination
        v-model:current-page="logsPage"
        v-model:page-size="logsSize"
        :total="logsTotal"
        layout="total, prev, pager, next"
        class="pagination"
        @current-change="handleLogsPageChange"
      />
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type TableInstance } from "element-plus";
import {
  Search,
  RefreshRight,
  Plus,
  Refresh,
  List,
  VideoPlay,
  CircleCheck,
  WarningFilled,
} from "@element-plus/icons-vue";
import { IconifyIconOnline } from "@repo/components";
import ScDialog from "@repo/components/ScDialog/src/index.vue";
import {
  fetchSyncTaskList,
  fetchCreateSyncTask,
  fetchUpdateSyncTask,
  fetchDeleteSyncTask,
  fetchStartSyncTask,
  fetchStopSyncTask,
  fetchExecuteSyncTask,
  fetchSyncTaskLogs,
  fetchGetTaskDesign,
  type SyncTask,
  type SyncTaskLog,
  type SyncTaskQuery,
  type SyncTaskDesign,
} from "./api";
import SyncTaskDesigner from "./components/SyncTaskDesigner.vue";

defineOptions({
  name: "SyncDataManagement",
});

// 查询参数
const queryParams = reactive<SyncTaskQuery>({
  page: 1,
  size: 10,
  taskName: "",
  taskStatus: "",
});

// 列表数据
const loading = ref(false);
const refreshing = ref(false);
const taskList = ref<SyncTask[]>([]);
const total = ref(0);
const tableRef = ref<TableInstance>();
const selectedRows = ref<SyncTask[]>([]);

// 自动刷新
const autoRefresh = ref(false);
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// 统计数据
const stats = computed(() => {
  const total = taskList.value.length;
  const running = taskList.value.filter((t) => t.syncTaskStatus === "RUNNING").length;
  const error = taskList.value.filter((t) => t.syncTaskStatus === "ERROR").length;
  const successRate = total > 0 ? Math.round(((total - error) / total) * 100) : 100;
  return { total, running, error, successRate };
});

// 表单相关
const dialogVisible = ref(false);
const dialogTitle = ref("新建任务");
const formRef = ref<FormInstance>();
const submitLoading = ref(false);
const formData = reactive<SyncTask>({
  syncTaskName: "",
  syncTaskDesc: "",
  syncTaskBatchSize: 1000,
  syncTaskRetryCount: 3,
  syncTaskRetryInterval: 1000,
  syncTaskSyncInterval: 0,
  syncTaskCron: "",
  syncTaskAckEnabled: 1,
  syncTaskTransactionEnabled: 0,
});

const formRules = {
  syncTaskName: [
    { required: true, message: "请输入任务名称", trigger: "blur" },
    { max: 255, message: "最大长度255", trigger: "blur" },
  ],
};

// 日志相关
const logsDialogVisible = ref(false);
const logsLoading = ref(false);
const logsList = ref<SyncTaskLog[]>([]);
const logsTotal = ref(0);
const logsPage = ref(1);
const logsSize = ref(10);
const currentTaskId = ref<number | null>(null);

// 设计器相关
const designerDialogVisible = ref(false);
const currentDesign = ref<SyncTaskDesign | null>(null);

// 加载任务列表
const loadTaskList = async () => {
  loading.value = true;
  try {
    const res = await fetchSyncTaskList(queryParams);
    if (res.data?.success) {
      taskList.value = res.data.data?.records || [];
      total.value = res.data.data?.total || 0;
    } else {
      ElMessage.error(res.data?.msg || "加载失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("加载失败");
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

// 搜索
const handleSearch = () => {
  queryParams.page = 1;
  loadTaskList();
};

// 重置
const handleReset = () => {
  queryParams.taskName = "";
  queryParams.taskStatus = "";
  queryParams.page = 1;
  loadTaskList();
};

// 刷新
const handleRefresh = () => {
  refreshing.value = true;
  loadTaskList();
};

// 分页
const handleSizeChange = () => {
  queryParams.page = 1;
  loadTaskList();
};

const handleCurrentChange = () => {
  loadTaskList();
};

// 选择变化
const handleSelectionChange = (rows: SyncTask[]) => {
  selectedRows.value = rows;
};

// 状态显示
const getStatusType = (status?: string) => {
  const map: Record<string, string> = {
    STOPPED: "info",
    RUNNING: "success",
    ERROR: "danger",
  };
  return map[status || ""] || "info";
};

const getStatusText = (status?: string) => {
  const map: Record<string, string> = {
    STOPPED: "已停止",
    RUNNING: "运行中",
    ERROR: "异常",
  };
  return map[status || ""] || status || "未知";
};

const getLogStatusType = (status?: string) => {
  const map: Record<string, string> = {
    RUNNING: "warning",
    SUCCESS: "success",
    FAIL: "danger",
    TIMEOUT: "danger",
  };
  return map[status || ""] || "info";
};

// 新建任务
const handleCreate = () => {
  dialogTitle.value = "新建任务";
  Object.assign(formData, {
    syncTaskId: undefined,
    syncTaskName: "",
    syncTaskDesc: "",
    syncTaskBatchSize: 1000,
    syncTaskRetryCount: 3,
    syncTaskRetryInterval: 1000,
    syncTaskSyncInterval: 0,
    syncTaskCron: "",
    syncTaskAckEnabled: 1,
    syncTaskTransactionEnabled: 0,
  });
  dialogVisible.value = true;
};

// 编辑任务
const handleEdit = (row: SyncTask) => {
  dialogTitle.value = "编辑任务";
  Object.assign(formData, row);
  dialogVisible.value = true;
};

// 设计流程
const handleDesign = async (row: SyncTask) => {
  if (!row.syncTaskId) {
    ElMessage.warning("任务ID不存在");
    return;
  }

  currentTaskId.value = row.syncTaskId;
  designerDialogVisible.value = true;

  // 加载任务设计数据
  try {
    const res = await fetchGetTaskDesign(row.syncTaskId);
    if (res.data?.success) {
      currentDesign.value = res.data.data || null;
    } else {
      currentDesign.value = null;
    }
  } catch (e) {
    console.error(e);
    currentDesign.value = null;
  }
};

// 设计保存
const handleDesignSave = (design: SyncTaskDesign) => {
  designerDialogVisible.value = false;
  ElMessage.success("流程设计已保存");
  loadTaskList();
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate();

  submitLoading.value = true;
  try {
    const isEdit = !!formData.syncTaskId;
    const res = isEdit
      ? await fetchUpdateSyncTask(formData)
      : await fetchCreateSyncTask(formData);

    if (res.data?.success) {
      ElMessage.success(isEdit ? "更新成功" : "创建成功");
      dialogVisible.value = false;
      loadTaskList();
    } else {
      ElMessage.error(res.data?.msg || "操作失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("操作失败");
  } finally {
    submitLoading.value = false;
  }
};

// 删除任务
const handleDelete = (row: SyncTask) => {
  ElMessageBox.confirm(`确定删除任务「${row.syncTaskName}」吗？`, "提示", {
    type: "warning",
  })
    .then(async () => {
      try {
        const res = await fetchDeleteSyncTask(row.syncTaskId!);
        if (res.data?.success) {
          ElMessage.success("删除成功");
          loadTaskList();
        } else {
          ElMessage.error(res.data?.msg || "删除失败");
        }
      } catch (e) {
        console.error(e);
        ElMessage.error("删除失败");
      }
    })
    .catch(() => {});
};

// 启动任务
const handleStart = async (row: SyncTask) => {
  try {
    const res = await fetchStartSyncTask(row.syncTaskId!);
    if (res.data?.success) {
      ElMessage.success("启动成功");
      loadTaskList();
    } else {
      ElMessage.error(res.data?.msg || "启动失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("启动失败");
  }
};

// 停止任务
const handleStop = async (row: SyncTask) => {
  try {
    const res = await fetchStopSyncTask(row.syncTaskId!);
    if (res.data?.success) {
      ElMessage.success("停止成功");
      loadTaskList();
    } else {
      ElMessage.error(res.data?.msg || "停止失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("停止失败");
  }
};

// 执行一次
const handleExecuteOnce = async (row: SyncTask) => {
  try {
    const res = await fetchExecuteSyncTask(row.syncTaskId!);
    if (res.data?.success) {
      ElMessage.success("执行成功");
      loadTaskList();
    } else {
      ElMessage.error(res.data?.msg || "执行失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("执行失败");
  }
};

// 查看日志
const handleLogs = async (row: SyncTask) => {
  currentTaskId.value = row.syncTaskId!;
  logsDialogVisible.value = true;
  logsPage.value = 1;
  await loadLogs();
};

// 加载日志
const loadLogs = async () => {
  if (!currentTaskId.value) return;
  logsLoading.value = true;
  try {
    const res = await fetchSyncTaskLogs(currentTaskId.value, logsPage.value, logsSize.value);
    if (res.data?.success) {
      logsList.value = res.data.data?.records || [];
      logsTotal.value = res.data.data?.total || 0;
    } else {
      ElMessage.error(res.data?.msg || "加载日志失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("加载日志失败");
  } finally {
    logsLoading.value = false;
  }
};

// 日志分页
const handleLogsPageChange = () => {
  loadLogs();
};

// 自动刷新
const handleAutoRefreshChange = (val: boolean) => {
  if (val) {
    refreshTimer = setInterval(() => {
      loadTaskList();
    }, 5000);
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }
};

onMounted(() => {
  loadTaskList();
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style lang="scss" scoped>
.sync-data-container {
  padding: 20px;
  min-height: 100%;
}

.page-header {
  margin-bottom: 20px;
  padding: 20px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 12px;

    .title-icon {
      font-size: 32px;
      color: var(--el-color-primary);
    }

    h2 {
      margin: 0 0 4px 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    p {
      margin: 0;
      color: var(--el-text-color-regular);
      font-size: 14px;
    }
  }
}

.stats-row {
  margin-bottom: 20px;

  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 28px;
        color: white;

        &.total {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.running {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        &.success {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        &.error {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          line-height: 1.2;
        }

        .stat-label {
          font-size: 14px;
          color: var(--el-text-color-regular);
          margin-top: 4px;
        }
      }
    }
  }
}

.filter-card {
  .filter-form {
    margin-bottom: 16px;
  }

  .task-table {
    margin-bottom: 16px;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 16px;
  }
}
</style>

