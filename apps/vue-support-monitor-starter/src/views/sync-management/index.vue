<template>
  <div class="sync-management">
    <!-- 页面切换 -->
    <el-tabs v-model="activeTab" class="main-tabs">
      <el-tab-pane label="任务列表" name="list">
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
        <el-form-item style="margin-left: auto">
          <el-switch
            v-model="autoRefresh"
            active-text="自动刷新"
            inactive-text=""
            @change="handleAutoRefreshChange"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>同步任务列表</span>
            <el-tag v-if="selectedRows.length > 0" type="info" class="selection-tag">
              已选择 {{ selectedRows.length }} 项
            </el-tag>
          </div>
          <div class="header-right">
            <el-button-group v-if="selectedRows.length > 0" class="batch-actions">
              <el-button size="small" @click="handleBatchStart">
                <el-icon><VideoPlay /></el-icon>
                批量启动
              </el-button>
              <el-button size="small" @click="handleBatchStop">
                <el-icon><VideoPause /></el-icon>
                批量停止
              </el-button>
              <el-button size="small" type="danger" @click="handleBatchDelete">
                <el-icon><Delete /></el-icon>
                批量删除
              </el-button>
            </el-button-group>
            <el-dropdown trigger="click" @command="handleExportCommand">
              <el-button>
                <el-icon><Download /></el-icon>
                导出
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="json">导出 JSON</el-dropdown-item>
                  <el-dropdown-item command="excel">导出 Excel</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-upload
              :show-file-list="false"
              accept=".json"
              :before-upload="handleImport"
            >
              <el-button>
                <el-icon><Upload /></el-icon>
                导入
              </el-button>
            </el-upload>
            <el-button type="primary" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              新建任务
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="taskList"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="syncTaskId" label="ID" width="80" sortable />
        <el-table-column prop="syncTaskName" label="任务名称" min-width="150" />
        <el-table-column prop="syncTaskDesc" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="syncTaskStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.syncTaskStatus)">
              {{ getStatusText(row.syncTaskStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="执行统计" width="180">
          <template #default="{ row }">
            <span class="stat-item">
              总: {{ row.syncTaskRunCount || 0 }}
            </span>
            <span class="stat-item success">
              成功: {{ row.syncTaskSuccessCount || 0 }}
            </span>
            <span class="stat-item fail">
              失败: {{ row.syncTaskFailCount || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="syncTaskLastRunTime" label="最后执行时间" width="180" />
        <el-table-column prop="syncTaskCreateTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDesign(row)">
              设计
            </el-button>
            <el-button link type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
              v-if="row.syncTaskStatus !== 'RUNNING'"
              link
              type="success"
              @click="handleStart(row)"
            >
              启动
            </el-button>
            <el-button
              v-else
              link
              type="warning"
              @click="handleStop(row)"
            >
              停止
            </el-button>
            <el-button link type="info" @click="handleExecuteOnce(row)">
              执行
            </el-button>
            <el-button link type="primary" @click="handleLogs(row)">
              日志
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">
              删除
            </el-button>
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
    <el-dialog
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
    </el-dialog>

      </el-tab-pane>

      <el-tab-pane label="执行统计" name="statistics">
        <StatisticsCharts v-if="activeTab === 'statistics'" />
      </el-tab-pane>
    </el-tabs>

    <!-- 执行日志对话框 -->
    <el-dialog
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
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, type FormInstance, type TableInstance } from "element-plus";
import {
  Search,
  RefreshRight,
  Plus,
  Refresh,
  List,
  VideoPlay,
  VideoPause,
  CircleCheck,
  WarningFilled,
  Delete,
  Download,
  Upload,
  ArrowDown,
} from "@element-plus/icons-vue";
import {
  listSyncTasks,
  createSyncTask,
  updateSyncTask,
  deleteSyncTask,
  startSyncTask,
  stopSyncTask,
  executeSyncTaskOnce,
  getSyncTaskLogs,
  copySyncTask,
  type SyncTask,
  type SyncTaskLog,
} from "@/api/sync";
import StatisticsCharts from "./components/StatisticsCharts.vue";

const router = useRouter();

// Tab 切换
const activeTab = ref("list");

// 查询参数
const queryParams = reactive({
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
  const totalRuns = taskList.value.reduce((sum, t) => sum + (t.syncTaskRunCount || 0), 0);
  const successRuns = taskList.value.reduce((sum, t) => sum + (t.syncTaskSuccessCount || 0), 0);
  const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 100;
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

// 加载任务列表
const loadTaskList = async () => {
  loading.value = true;
  try {
    const res = await listSyncTasks(queryParams);
    if (res.data?.success) {
      taskList.value = res.data.data?.records || [];
      total.value = res.data.data?.total || 0;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
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

// 分页
const handleSizeChange = () => {
  queryParams.page = 1;
  loadTaskList();
};

const handleCurrentChange = () => {
  loadTaskList();
};

// 状态显示
const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    STOPPED: "info",
    RUNNING: "success",
    ERROR: "danger",
  };
  return map[status] || "info";
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    STOPPED: "已停止",
    RUNNING: "运行中",
    ERROR: "异常",
  };
  return map[status] || status;
};

const getLogStatusType = (status: string) => {
  const map: Record<string, string> = {
    RUNNING: "warning",
    SUCCESS: "success",
    FAIL: "danger",
    TIMEOUT: "danger",
  };
  return map[status] || "info";
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

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate();

  submitLoading.value = true;
  try {
    const isEdit = !!formData.syncTaskId;
    const res = isEdit
      ? await updateSyncTask(formData)
      : await createSyncTask(formData);

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
  }).then(async () => {
    try {
      const res = await deleteSyncTask(row.syncTaskId!);
      if (res.data?.success) {
        ElMessage.success("删除成功");
        loadTaskList();
      } else {
        ElMessage.error(res.data?.msg || "删除失败");
      }
    } catch (e) {
      console.error(e);
    }
  }).catch(() => {});
};

// 设计任务
const handleDesign = (row: SyncTask) => {
  router.push({ name: "SyncTaskDesign", params: { taskId: row.syncTaskId } });
};

// 启动任务
const handleStart = async (row: SyncTask) => {
  try {
    const res = await startSyncTask(row.syncTaskId!);
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
    const res = await stopSyncTask(row.syncTaskId!);
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
    const res = await executeSyncTaskOnce(row.syncTaskId!);
    if (res.data?.success) {
      ElMessage.success("执行中...");
      setTimeout(loadTaskList, 1000);
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
  logsPage.value = 1;
  logsDialogVisible.value = true;
  await loadLogs();
};

const loadLogs = async () => {
  if (!currentTaskId.value) return;
  logsLoading.value = true;
  try {
    const res = await getSyncTaskLogs(currentTaskId.value, logsPage.value, logsSize.value);
    if (res.data?.success) {
      logsList.value = res.data.data?.records || [];
      logsTotal.value = res.data.data?.total || 0;
    }
  } catch (e) {
    console.error(e);
  } finally {
    logsLoading.value = false;
  }
};

const handleLogsPageChange = () => {
  loadLogs();
};

// 刷新
const handleRefresh = async () => {
  refreshing.value = true;
  await loadTaskList();
  refreshing.value = false;
};

// 自动刷新开关
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

// 表格选择
const handleSelectionChange = (rows: SyncTask[]) => {
  selectedRows.value = rows;
};

// 批量启动
const handleBatchStart = async () => {
  const stoppedTasks = selectedRows.value.filter((t) => t.syncTaskStatus !== "RUNNING");
  if (stoppedTasks.length === 0) {
    ElMessage.warning("没有可启动的任务");
    return;
  }
  
  ElMessageBox.confirm(`确定启动选中的 ${stoppedTasks.length} 个任务吗？`, "提示", {
    type: "warning",
  }).then(async () => {
    let successCount = 0;
    for (const task of stoppedTasks) {
      try {
        const res = await startSyncTask(task.syncTaskId!);
        if (res.data?.success) successCount++;
      } catch (e) {
        console.error(e);
      }
    }
    ElMessage.success(`成功启动 ${successCount} 个任务`);
    loadTaskList();
    tableRef.value?.clearSelection();
  }).catch(() => {});
};

// 批量停止
const handleBatchStop = async () => {
  const runningTasks = selectedRows.value.filter((t) => t.syncTaskStatus === "RUNNING");
  if (runningTasks.length === 0) {
    ElMessage.warning("没有运行中的任务");
    return;
  }
  
  ElMessageBox.confirm(`确定停止选中的 ${runningTasks.length} 个任务吗？`, "提示", {
    type: "warning",
  }).then(async () => {
    let successCount = 0;
    for (const task of runningTasks) {
      try {
        const res = await stopSyncTask(task.syncTaskId!);
        if (res.data?.success) successCount++;
      } catch (e) {
        console.error(e);
      }
    }
    ElMessage.success(`成功停止 ${successCount} 个任务`);
    loadTaskList();
    tableRef.value?.clearSelection();
  }).catch(() => {});
};

// 批量删除
const handleBatchDelete = async () => {
  const deletableTasks = selectedRows.value.filter((t) => t.syncTaskStatus !== "RUNNING");
  if (deletableTasks.length === 0) {
    ElMessage.warning("运行中的任务不能删除");
    return;
  }
  
  ElMessageBox.confirm(`确定删除选中的 ${deletableTasks.length} 个任务吗？此操作不可恢复！`, "警告", {
    type: "warning",
  }).then(async () => {
    let successCount = 0;
    for (const task of deletableTasks) {
      try {
        const res = await deleteSyncTask(task.syncTaskId!);
        if (res.data?.success) successCount++;
      } catch (e) {
        console.error(e);
      }
    }
    ElMessage.success(`成功删除 ${successCount} 个任务`);
    loadTaskList();
    tableRef.value?.clearSelection();
  }).catch(() => {});
};

// 导出
const handleExportCommand = (command: string) => {
  if (command === "json") {
    exportAsJson();
  } else if (command === "excel") {
    ElMessage.info("Excel导出功能开发中...");
  }
};

const exportAsJson = () => {
  const data = selectedRows.value.length > 0 ? selectedRows.value : taskList.value;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sync-tasks-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  ElMessage.success("导出成功");
};

// 导入
const handleImport = (file: File) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string;
      const tasks = JSON.parse(content) as SyncTask[];
      
      if (!Array.isArray(tasks)) {
        ElMessage.error("文件格式错误");
        return;
      }
      
      ElMessageBox.confirm(`检测到 ${tasks.length} 个任务，确定导入吗？`, "导入确认", {
        type: "info",
      }).then(async () => {
        let successCount = 0;
        for (const task of tasks) {
          try {
            // 移除ID，作为新任务创建
            const newTask = { ...task };
            delete newTask.syncTaskId;
            newTask.syncTaskName = `${task.syncTaskName}_imported`;
            const res = await createSyncTask(newTask);
            if (res.data?.success) successCount++;
          } catch (err) {
            console.error(err);
          }
        }
        ElMessage.success(`成功导入 ${successCount} 个任务`);
        loadTaskList();
      }).catch(() => {});
    } catch (err) {
      ElMessage.error("解析文件失败");
    }
  };
  reader.readAsText(file);
  return false;
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

<style scoped lang="scss">
.sync-management {
  padding: 16px;

  .main-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 16px;
    }
  }

  .stats-row {
    margin-bottom: 16px;
  }

  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #fff;

      &.total {
        background: linear-gradient(135deg, #667eea, #764ba2);
      }
      &.running {
        background: linear-gradient(135deg, #11998e, #38ef7d);
      }
      &.success {
        background: linear-gradient(135deg, #56ab2f, #a8e6cf);
      }
      &.error {
        background: linear-gradient(135deg, #eb3349, #f45c43);
      }
    }

    .stat-info {
      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }
      .stat-label {
        font-size: 14px;
        color: #909399;
      }
    }
  }

  .filter-card {
    margin-bottom: 16px;

    .filter-form {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
    }
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .selection-tag {
          margin-left: 8px;
        }
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 8px;

        .batch-actions {
          margin-right: 8px;
        }
      }
    }

    .pagination {
      margin-top: 16px;
      justify-content: flex-end;
    }
  }

  .stat-item {
    margin-right: 8px;
    font-size: 12px;

    &.success {
      color: #67c23a;
    }

    &.fail {
      color: #f56c6c;
    }
  }
}
</style>
