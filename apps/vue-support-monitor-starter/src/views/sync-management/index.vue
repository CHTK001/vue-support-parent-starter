<template>
  <div class="sync-management system-container modern-bg">
    <!-- 页面切换 -->
    <ScTabs v-model="activeTab" class="main-tabs">
      <ScTabPane label="任务列表" name="list">
        <!-- 统计卡片 -->
        <ScRow :gutter="16" class="stats-row">
          <ScCol :span="6">
            <ScCard class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon total">
                  <ScIcon><List /></ScIcon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.total }}</div>
                  <div class="stat-label">任务总数</div>
                </div>
              </div>
            </ScCard>
          </ScCol>
          <ScCol :span="6">
            <ScCard class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon running">
                  <ScIcon><VideoPlay /></ScIcon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.running }}</div>
                  <div class="stat-label">运行中</div>
                </div>
              </div>
            </ScCard>
          </ScCol>
          <ScCol :span="6">
            <ScCard class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon success">
                  <ScIcon><CircleCheck /></ScIcon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.successRate }}%</div>
                  <div class="stat-label">成功率</div>
                </div>
              </div>
            </ScCard>
          </ScCol>
          <ScCol :span="6">
            <ScCard class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon error">
                  <ScIcon><WarningFilled /></ScIcon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.error }}</div>
                  <div class="stat-label">异常任务</div>
                </div>
              </div>
            </ScCard>
          </ScCol>
        </ScRow>

        <ScCard class="filter-card">
          <ScForm :inline="true" :model="queryParams" class="filter-form">
            <ScFormItem label="任务名称">
              <ScInput
                v-model="queryParams.taskName"
                placeholder="请输入任务名称"
                clearable
                style="width: 200px"
                @keyup.enter="handleSearch"
              />
            </ScFormItem>
            <ScFormItem label="状态">
              <ScSelect
                v-model="queryParams.taskStatus"
                placeholder="全部"
                clearable
                style="width: 120px"
              >
                <ScOption label="已停止" value="STOPPED" />
                <ScOption label="运行中" value="RUNNING" />
                <ScOption label="异常" value="ERROR" />
              </ScSelect>
            </ScFormItem>
            <ScFormItem>
              <ScButton type="primary" @click="handleSearch">
                <ScIcon><Search /></ScIcon>
                查询
              </ScButton>
              <ScButton @click="handleReset">
                <ScIcon><RefreshRight /></ScIcon>
                重置
              </ScButton>
              <ScButton :loading="refreshing" @click="handleRefresh">
                <ScIcon><Refresh /></ScIcon>
                刷新
              </ScButton>
            </ScFormItem>
            <ScFormItem style="margin-left: auto">
              <ScSwitch
                v-model="autoRefresh"
                active-text="自动刷新"
                inactive-text=""
                @change="handleAutoRefreshChange"
              />
            </ScFormItem>
          </ScForm>
        </ScCard>

        <ScCard class="table-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span>同步任务列表</span>
                <ScTag
                  v-if="selectedRows.length > 0"
                  type="info"
                  class="selection-tag"
                >
                  已选择 {{ selectedRows.length }} 项
                </ScTag>
              </div>
              <div class="header-right">
                <el-button-group
                  v-if="selectedRows.length > 0"
                  class="batch-actions"
                >
                  <ScButton size="small" @click="handleBatchStart">
                    <ScIcon><VideoPlay /></ScIcon>
                    批量启动
                  </ScButton>
                  <ScButton size="small" @click="handleBatchStop">
                    <ScIcon><VideoPause /></ScIcon>
                    批量停止
                  </ScButton>
                  <ScButton
                    size="small"
                    type="danger"
                    @click="handleBatchDelete"
                  >
                    <ScIcon><Delete /></ScIcon>
                    批量删除
                  </ScButton>
                </ScButton-group>
                <ScDropdown trigger="click" @command="handleExportCommand">
                  <ScButton>
                    <ScIcon><Download /></ScIcon>
                    导出
                    <ScIcon class="el-icon--right"><ArrowDown /></ScIcon>
                  </ScButton>
                  <template #dropdown>
                    <ScDropdownMenu>
                      <ScDropdownItem command="json"
                        >导出 JSON</ScDropdownItem
                      >
                      <ScDropdownItem command="excel"
                        >导出 Excel</ScDropdownItem
                      >
                    </ScDropdownMenu>
                  </template>
                </ScDropdown>
                <ScUpload
                  :show-file-list="false"
                  accept=".json"
                  :before-upload="handleImport"
                >
                  <ScButton>
                    <ScIcon><Upload /></ScIcon>
                    导入
                  </ScButton>
                </ScUpload>
                <ScButton type="primary" @click="handleCreate">
                  <ScIcon><Plus /></ScIcon>
                  新建任务
                </ScButton>
              </div>
            </div>
          </template>

          <ScTable
            ref="tableRef"
            v-loading="loading"
            :data="taskList"
            border
            stripe
            @selection-change="handleSelectionChange"
          >
            <ScTableColumn type="selection" width="55" />
            <ScTableColumn prop="syncTaskId" label="ID" width="80" sortable />
            <ScTableColumn
              prop="syncTaskName"
              label="任务名称"
              min-width="150"
            />
            <ScTableColumn
              prop="syncTaskDesc"
              label="描述"
              min-width="200"
              show-overflow-tooltip
            />
            <ScTableColumn prop="syncTaskStatus" label="状态" width="100">
              <template #default="{ row }">
                <ScTag :type="getStatusType(row.syncTaskStatus)">
                  {{ getStatusText(row.syncTaskStatus) }}
                </ScTag>
              </template>
            </ScTableColumn>
            <ScTableColumn label="执行统计" width="180">
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
            </ScTableColumn>
            <ScTableColumn
              prop="syncTaskLastRunTime"
              label="最后执行时间"
              width="180"
            />
            <ScTableColumn
              prop="syncTaskCreateTime"
              label="创建时间"
              width="180"
            />
            <ScTableColumn label="操作" width="280" fixed="right">
              <template #default="{ row }">
                <ScButton link type="primary" @click="handleDesign(row)">
                  设计
                </ScButton>
                <ScButton link type="primary" @click="handleEdit(row)">
                  编辑
                </ScButton>
                <ScButton
                  v-if="row.syncTaskStatus !== 'RUNNING'"
                  link
                  type="success"
                  @click="handleStart(row)"
                >
                  启动
                </ScButton>
                <ScButton v-else link type="warning" @click="handleStop(row)">
                  停止
                </ScButton>
                <ScButton link type="info" @click="handleExecuteOnce(row)">
                  执行
                </ScButton>
                <ScButton link type="primary" @click="handleLogs(row)">
                  日志
                </ScButton>
                <ScButton link type="danger" @click="handleDelete(row)">
                  删除
                </ScButton>
              </template>
            </ScTableColumn>
          </ScTable>

          <ScPagination
            v-model:current-page="queryParams.page"
            v-model:page-size="queryParams.size"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            class="pagination"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </ScCard>

        <!-- 新建/编辑任务对话框 -->
        <sc-dialog
          v-model="dialogVisible"
          :title="dialogTitle"
          width="600px"
          destroy-on-close
        >
          <ScForm
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="120px"
          >
            <ScFormItem label="任务名称" prop="syncTaskName">
              <ScInput
                v-model="formData.syncTaskName"
                placeholder="请输入任务名称"
              />
            </ScFormItem>
            <ScFormItem label="任务描述" prop="syncTaskDesc">
              <ScInput
                v-model="formData.syncTaskDesc"
                type="textarea"
                :rows="3"
                placeholder="请输入任务描述"
              />
            </ScFormItem>
            <ScFormItem label="批次大小" prop="syncTaskBatchSize">
              <ScInputNumber
                v-model="formData.syncTaskBatchSize"
                :min="1"
                :max="100000"
              />
            </ScFormItem>
            <ScFormItem label="重试次数" prop="syncTaskRetryCount">
              <ScInputNumber
                v-model="formData.syncTaskRetryCount"
                :min="0"
                :max="100"
              />
            </ScFormItem>
            <ScFormItem label="重试间隔(ms)" prop="syncTaskRetryInterval">
              <ScInputNumber
                v-model="formData.syncTaskRetryInterval"
                :min="0"
                :step="1000"
              />
            </ScFormItem>
            <ScFormItem label="同步间隔(ms)" prop="syncTaskSyncInterval">
              <ScInputNumber
                v-model="formData.syncTaskSyncInterval"
                :min="0"
                :step="1000"
              />
            </ScFormItem>
            <ScFormItem label="CRON表达式" prop="syncTaskCron">
              <ScInput
                v-model="formData.syncTaskCron"
                placeholder="如: 0 0 * * * ?"
              />
            </ScFormItem>
            <ScFormItem label="启用ACK" prop="syncTaskAckEnabled">
              <ScSwitch
                v-model="formData.syncTaskAckEnabled"
                :active-value="1"
                :inactive-value="0"
              />
            </ScFormItem>
            <ScFormItem label="启用事务" prop="syncTaskTransactionEnabled">
              <ScSwitch
                v-model="formData.syncTaskTransactionEnabled"
                :active-value="1"
                :inactive-value="0"
              />
            </ScFormItem>
          </ScForm>
          <template #footer>
            <ScButton @click="dialogVisible = false">取消</ScButton>
            <ScButton
              type="primary"
              :loading="submitLoading"
              @click="handleSubmit"
            >
              确定
            </ScButton>
          </template>
        </sc-dialog>
      </ScTabPane>

      <ScTabPane label="执行统计" name="statistics">
        <StatisticsCharts v-if="activeTab === 'statistics'" />
      </ScTabPane>
    </ScTabs>

    <!-- 执行监控对话框 -->
    <ExecutionMonitor
      v-model="monitorDialogVisible"
      :task="currentMonitorTask"
      @status-change="handleMonitorStatusChange"
    />

    <!-- 执行日志对话框 -->
    <sc-dialog
      v-model="logsDialogVisible"
      title="执行日志"
      width="900px"
      destroy-on-close
    >
      <ScTable v-loading="logsLoading" :data="logsList" border>
        <ScTableColumn prop="syncLogId" label="ID" width="80" />
        <ScTableColumn prop="syncLogStatus" label="状态" width="100">
          <template #default="{ row }">
            <ScTag :type="getLogStatusType(row.syncLogStatus)">
              {{ row.syncLogStatus }}
            </ScTag>
          </template>
        </ScTableColumn>
        <ScTableColumn
          prop="syncLogTriggerType"
          label="触发类型"
          width="100"
        />
        <ScTableColumn label="数据统计" width="200">
          <template #default="{ row }">
            <div>读取: {{ row.syncLogReadCount || 0 }}</div>
            <div>写入: {{ row.syncLogWriteCount || 0 }}</div>
            <div>成功: {{ row.syncLogSuccessCount || 0 }}</div>
          </template>
        </ScTableColumn>
        <ScTableColumn prop="syncLogCost" label="耗时(ms)" width="100" />
        <ScTableColumn prop="syncLogStartTime" label="开始时间" width="180" />
        <ScTableColumn
          prop="syncLogMessage"
          label="消息"
          show-overflow-tooltip
        />
      </ScTable>
      <ScPagination
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
import { useRouter } from "vue-router";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type TableInstance,
} from "element-plus";
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
import ExecutionMonitor from "./components/ExecutionMonitor.vue";

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
  const running = taskList.value.filter(
    (t) => t.syncTaskStatus === "RUNNING",
  ).length;
  const error = taskList.value.filter(
    (t) => t.syncTaskStatus === "ERROR",
  ).length;
  const totalRuns = taskList.value.reduce(
    (sum, t) => sum + (t.syncTaskRunCount || 0),
    0,
  );
  const successRuns = taskList.value.reduce(
    (sum, t) => sum + (t.syncTaskSuccessCount || 0),
    0,
  );
  const successRate =
    totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 100;
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

// 执行监控相关
const monitorDialogVisible = ref(false);
const currentMonitorTask = ref<SyncTask | null>(null);

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
  })
    .then(async () => {
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
    })
    .catch(() => {});
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

// 执行一次(打开监控对话框)
const handleExecuteOnce = async (row: SyncTask) => {
  currentMonitorTask.value = row;
  monitorDialogVisible.value = true;
};

// 监控状态变化
const handleMonitorStatusChange = (status: string) => {
  // 刷新任务列表以获取最新状态
  loadTaskList();
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
    const res = await getSyncTaskLogs(
      currentTaskId.value,
      logsPage.value,
      logsSize.value,
    );
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
  const stoppedTasks = selectedRows.value.filter(
    (t) => t.syncTaskStatus !== "RUNNING",
  );
  if (stoppedTasks.length === 0) {
    ElMessage.warning("没有可启动的任务");
    return;
  }

  ElMessageBox.confirm(
    `确定启动选中的 ${stoppedTasks.length} 个任务吗？`,
    "提示",
    {
      type: "warning",
    },
  )
    .then(async () => {
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
    })
    .catch(() => {});
};

// 批量停止
const handleBatchStop = async () => {
  const runningTasks = selectedRows.value.filter(
    (t) => t.syncTaskStatus === "RUNNING",
  );
  if (runningTasks.length === 0) {
    ElMessage.warning("没有运行中的任务");
    return;
  }

  ElMessageBox.confirm(
    `确定停止选中的 ${runningTasks.length} 个任务吗？`,
    "提示",
    {
      type: "warning",
    },
  )
    .then(async () => {
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
    })
    .catch(() => {});
};

// 批量删除
const handleBatchDelete = async () => {
  const deletableTasks = selectedRows.value.filter(
    (t) => t.syncTaskStatus !== "RUNNING",
  );
  if (deletableTasks.length === 0) {
    ElMessage.warning("运行中的任务不能删除");
    return;
  }

  ElMessageBox.confirm(
    `确定删除选中的 ${deletableTasks.length} 个任务吗？此操作不可恢复！`,
    "警告",
    {
      type: "warning",
    },
  )
    .then(async () => {
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
    })
    .catch(() => {});
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
  const data =
    selectedRows.value.length > 0 ? selectedRows.value : taskList.value;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
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

      ElMessageBox.confirm(
        `检测到 ${tasks.length} 个任务，确定导入吗？`,
        "导入确认",
        {
          type: "info",
        },
      )
        .then(async () => {
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
        })
        .catch(() => {});
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
.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

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

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}
</style>
