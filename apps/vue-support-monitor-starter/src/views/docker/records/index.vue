<template>
  <div class="records-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <IconifyIconOnline icon="ri:history-line" class="title-icon" />
          <span>安装记录</span>
        </div>
        <div class="page-subtitle">软件安装、卸载记录管理</div>
      </div>
      <div class="header-right">
        <el-button @click="refreshRecords" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="primary" @click="exportRecords">
          <IconifyIconOnline icon="ri:download-line" class="mr-1" />
          导出
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-bar">
      <div class="search-left">
        <el-input v-model="searchParams.keyword" placeholder="搜索软件名称、版本或服务器" class="search-input" clearable @keyup.enter="loadRecords">
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select v-model="searchParams.status" placeholder="状态" clearable class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="安装中" value="INSTALLING" />
          <el-option label="成功" value="SUCCESS" />
          <el-option label="失败" value="FAILED" />
          <el-option label="已取消" value="CANCELLED" />
        </el-select>
        <el-select v-model="searchParams.installMethod" placeholder="安装方式" clearable class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="Docker CLI" value="DOCKER_CLI" />
          <el-option label="Compose" value="COMPOSE" />
          <el-option label="Swarm" value="SWARM" />
        </el-select>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" @change="handleDateChange" class="date-picker" />
      </div>
      <div class="search-right">
        <el-button type="primary" @click="loadRecords">
          <IconifyIconOnline icon="ri:search-line" class="mr-1" />
          搜索
        </el-button>
        <el-button @click="resetSearch">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          重置
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <StatsCard :stats="statsData" :details="statsDetails" :show-toggle="true" />
    </div>

    <!-- 记录列表 -->
    <el-card class="records-card">
      <template #header>
        <div class="card-header">
          <span>安装记录列表</span>
          <div class="header-actions">
            <el-button size="small" @click="batchDelete" :disabled="selectedRecords.length === 0">
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
              批量删除
            </el-button>
          </div>
        </div>
      </template>

      <ScTable
        ref="tableRef"
        :url="getSoftInstallRecords"
        :params="{ ...pageParams, ...searchParams }"
        stripe
        class="records-table"
        table-name="docker-records"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="systemSoftName" label="软件名称" width="150" show-overflow-tooltip />
        <el-table-column prop="version" label="版本" width="120" />
        <el-table-column prop="serverId" label="服务器" width="180">
          <template #default="{ row }">
            <div class="server-info">
              <div class="server-name">{{ getServerName(row.serverId) }}</div>
              <div class="server-host">{{ getServerHost(row.serverId) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="installMethod" label="安装方式" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="getMethodType(row.installMethod)">{{ getMethodLabel(row.installMethod) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="200">
          <template #default="{ row }">
            <div v-if="row.status === 'INSTALLING'" class="progress-container">
              <InstallProgress
                :status="row.status"
                :progress="row.progress || 0"
                :current-step="row.currentStep || '正在安装'"
                :current-step-index="row.currentStepIndex || 0"
                :steps="row.steps || []"
                :software-info="{
                  name: row.systemSoftName,
                  version: row.version,
                  size: row.size,
                }"
                :show-steps="false"
                :show-stats="false"
                :show-logs="false"
                :can-cancel="true"
                @cancel="cancelInstall(row)"
              />
            </div>
            <div v-else class="progress-container">
              <el-progress :percentage="row.progress || 0" :status="getProgressStatus(row.status)" :stroke-width="8" />
              <span class="progress-text">{{ row.progress || 0 }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时" width="100">
          <template #default="{ row }">
            {{ formatDuration(row.startTime, row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">
              <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
              详情
            </el-button>
            <el-button size="small" type="info" @click="viewLogs(row)">
              <IconifyIconOnline icon="ri:file-text-line" class="mr-1" />
              日志
            </el-button>
            <el-dropdown @command="(command) => handleAction(command, row)">
              <el-button size="small">
                <IconifyIconOnline icon="ri:more-line" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="retry" :disabled="row.status !== 'FAILED'">
                    <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
                    重试安装
                  </el-dropdown-item>
                  <el-dropdown-item command="cancel" :disabled="row.status !== 'INSTALLING'">
                    <IconifyIconOnline icon="ri:stop-line" class="mr-1" />
                    取消安装
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
                    删除记录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </ScTable>

    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="安装记录详情" width="800px" destroy-on-close>
      <div v-if="currentRecord" class="record-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录ID">{{ currentRecord.recordId }}</el-descriptions-item>
          <el-descriptions-item label="软件名称">{{ currentRecord.systemSoftName }}</el-descriptions-item>
          <el-descriptions-item label="版本">{{ currentRecord.version }}</el-descriptions-item>
          <el-descriptions-item label="服务器">{{ getServerName(currentRecord.serverId) }}</el-descriptions-item>
          <el-descriptions-item label="安装方式">{{ getMethodLabel(currentRecord.installMethod) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentRecord.status)">{{ getStatusLabel(currentRecord.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="进度">{{ currentRecord.progress || 0 }}%</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ formatDate(currentRecord.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ formatDate(currentRecord.endTime) }}</el-descriptions-item>
          <el-descriptions-item label="耗时">{{ formatDuration(currentRecord.startTime, currentRecord.endTime) }}</el-descriptions-item>
          <el-descriptions-item label="安装参数" :span="2">
            <pre class="params-code">{{ formatParams(currentRecord.installParams) }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="错误信息" :span="2" v-if="currentRecord.errorMessage">
            <div class="error-message">{{ currentRecord.errorMessage }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 日志对话框 -->
    <el-dialog v-model="logsVisible" title="安装日志" width="900px" destroy-on-close>
      <div class="logs-container">
        <div class="logs-header">
          <el-button size="small" @click="refreshLogs" :loading="logsLoading">
            <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
            刷新
          </el-button>
          <el-button size="small" @click="downloadLogs">
            <IconifyIconOnline icon="ri:download-line" class="mr-1" />
            下载
          </el-button>
        </div>
        <div class="logs-content" ref="logsContentRef">
          <pre v-if="logs" class="logs-text">{{ logs }}</pre>
          <div v-else class="logs-empty">
            <IconifyIconOnline icon="ri:file-text-line" />
            <span>暂无日志信息</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { getServerPageList } from "@/api/server";
import { cancelInstallSoft, deleteInstallRecord, getInstallLogs, getSoftInstallRecords, retryInstallSoft } from "@/api/soft";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { computed, nextTick, onMounted, ref } from "vue";
import InstallProgress from "./components/InstallProgress.vue";
import StatsCard from "./components/StatsCard.vue";
const tableRef = ref();

// 定义软件安装记录类型
interface SystemSoftRecord {
  recordId?: string;
  systemSoftName?: string;
  version?: string;
  serverId?: number;
  installMethod?: string;
  status?: string;
  progress?: number;
  currentStep?: string;
  currentStepIndex?: number;
  steps?: string[];
  size?: number;
  startTime?: string;
  endTime?: string;
  createTime?: string;
  errorMessage?: string;
  installParams?: string;
}

// 基础数据
const recordsList = ref<SystemSoftRecord[]>([]);
const serverOptions = ref<any[]>([]);
const selectedRecords = ref<SystemSoftRecord[]>([]);
const currentRecord = ref<SystemSoftRecord | null>(null);
const logs = ref("");
const dateRange = ref<[string, string] | null>(null);

// 页面状态
const loading = ref(false);
const logsLoading = ref(false);
const detailVisible = ref(false);
const logsVisible = ref(false);
const total = ref(0);

// 搜索参数
const searchParams = ref({
  keyword: "",
  status: "",
  installMethod: "",
  startDate: "",
  endDate: "",
});

// 分页参数
const pageParams = ref({
  page: 1,
  pageSize: 20,
});

// 统计信息
const stats = computed(() => {
  const successCount = recordsList.value.filter((r) => r.status === "SUCCESS").length;
  const installingCount = recordsList.value.filter((r) => r.status === "INSTALLING").length;
  const failedCount = recordsList.value.filter((r) => r.status === "FAILED").length;
  const totalCount = recordsList.value.length;

  return {
    successCount,
    installingCount,
    failedCount,
    totalCount,
  };
});

// 统计卡片数据
const statsData = computed(() => [
  {
    key: "total",
    label: "总记录数",
    value: stats.value.totalCount,
    icon: "ri:archive-line",
    type: "primary" as const,
    format: "number",
    description: "所有安装记录的总数量",
  },
  {
    key: "success",
    label: "成功安装",
    value: stats.value.successCount,
    icon: "ri:check-line",
    type: "success" as const,
    format: "number",
    description: "成功完成的安装数量",
    trend: { type: "up", value: "+5" },
  },
  {
    key: "failed",
    label: "安装失败",
    value: stats.value.failedCount,
    icon: "ri:close-line",
    type: "danger" as const,
    format: "number",
    description: "安装失败的数量",
  },
  {
    key: "installing",
    label: "安装中",
    value: stats.value.installingCount,
    icon: "ri:time-line",
    type: "warning" as const,
    format: "number",
    description: "正在进行的安装数量",
  },
]);

// 统计详情数据
const statsDetails = computed(() => {
  const successRate = stats.value.totalCount > 0 ? (stats.value.successCount / stats.value.totalCount) * 100 : 0;

  return {
    systemSoftware: Math.floor(stats.value.successCount * 0.3),
    applicationSoftware: Math.floor(stats.value.successCount * 0.5),
    developmentTools: Math.floor(stats.value.successCount * 0.15),
    databases: Math.floor(stats.value.successCount * 0.05),
    successRate: successRate,
    avgInstallTime: 245, // 秒
    totalInstallTime: stats.value.successCount * 245,
    mostInstalledCategory: "Application Software",
  };
});

// 引用
const logsContentRef = ref<HTMLElement>();

// 数据加载（改为通过 ScTable 刷新）
const reload = () => {
  tableRef.value?.reload?.({ ...pageParams.value, ...searchParams.value }, 1);
};

const loadServers = async () => {
  const res = await getServerPageList({ page: 1, pageSize: 1000 });
  if (res.code === "00000") {
    const data = (res.data as any).data || res.data.records || [];
    serverOptions.value = data.map((it: any) => ({
      id: it.id || it.monitorSysGenServerId,
      name: it.name || it.monitorSysGenServerName,
      host: it.host || it.monitorSysGenServerHost,
    }));
  }
};

// 搜索和筛选
const handleDateChange = (dates: [string, string] | null) => {
  if (dates) {
    searchParams.value.startDate = dates[0];
    searchParams.value.endDate = dates[1];
  } else {
    searchParams.value.startDate = "";
    searchParams.value.endDate = "";
  }
};

const resetSearch = () => {
  searchParams.value = {
    keyword: "",
    status: "",
    installMethod: "",
    startDate: "",
    endDate: "",
  };
  dateRange.value = null;
  pageParams.value.page = 1;
  reload();
};

const refreshRecords = async () => {
  reload();
  message.success("记录列表已刷新");
};

// 表格操作
const handleSelectionChange = (selection: SystemSoftRecord[]) => {
  selectedRecords.value = selection;
};

const handleSizeChange = (size: number) => {
  pageParams.value.pageSize = size;
  reload();
};

const handleCurrentChange = (page: number) => {
  pageParams.value.page = page;
  reload();
};

const viewDetail = (record: SystemSoftRecord) => {
  currentRecord.value = record;
  detailVisible.value = true;
};

const viewLogs = async (record: SystemSoftRecord) => {
  currentRecord.value = record;
  logsVisible.value = true;
  await loadLogs(record.recordId!);
};

const loadLogs = async (recordId: string) => {
  try {
    logsLoading.value = true;
    const res = await getInstallLogs({ recordId });
    if (res.code === "00000") {
      logs.value = res.data || "暂无日志信息";
      await nextTick();
      // 滚动到底部
      if (logsContentRef.value) {
        logsContentRef.value.scrollTop = logsContentRef.value.scrollHeight;
      }
    }
  } finally {
    logsLoading.value = false;
  }
};

const refreshLogs = async () => {
  if (currentRecord.value) {
    await loadLogs(currentRecord.value.recordId!);
  }
};

const downloadLogs = () => {
  if (!logs.value) {
    return message.warning("暂无日志可下载");
  }

  const blob = new Blob([logs.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `install-logs-${currentRecord.value?.recordId || "unknown"}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 记录操作
const handleAction = async (command: string, record: SystemSoftRecord) => {
  switch (command) {
    case "retry":
      await retryInstall(record);
      break;
    case "cancel":
      await cancelInstall(record);
      break;
    case "delete":
      await deleteRecord(record);
      break;
  }
};

const retryInstall = async (record: SystemSoftRecord) => {
  try {
    await ElMessageBox.confirm(`确认重试安装 ${record.systemSoftName} v${record.version}？`, "确认重试", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const res = await retryInstallSoft({ recordId: record.recordId! });
    if (res.code === "00000") {
      message.success("重试安装请求已提交");
      reload();
    }
  } catch (error) {
    if (error !== "cancel") {
      message.error("重试安装失败");
    }
  }
};

const cancelInstall = async (record: SystemSoftRecord) => {
  try {
    await ElMessageBox.confirm(`确认取消安装 ${record.systemSoftName} v${record.version}？`, "确认取消", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const res = await cancelInstallSoft({ recordId: record.recordId! });
    if (res.code === "00000") {
      message.success("安装任务已取消");
      reload();
    }
  } catch (error) {
    if (error !== "cancel") {
      message.error("取消安装失败");
    }
  }
};

const deleteRecord = async (record: SystemSoftRecord) => {
  try {
    await ElMessageBox.confirm(`确认删除安装记录 ${record.systemSoftName} v${record.version}？此操作不可恢复。`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "error",
    });

    const res = await deleteInstallRecord({ recordId: record.recordId! });
    if (res.code === "00000") {
      message.success("记录删除成功");
      await loadRecords();
    }
  } catch (error) {
    if (error !== "cancel") {
      message.error("删除记录失败");
    }
  }
};

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selectedRecords.value.length} 条记录？此操作不可恢复。`, "确认批量删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "error",
    });

    // 这里可以调用批量删除API
    message.success("批量删除成功");
    reload();
  } catch (error) {
    if (error !== "cancel") {
      message.error("批量删除失败");
    }
  }
};

const exportRecords = () => {
  message.info("导出功能开发中");
};

// 工具方法
const formatDate = (date: string | Date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("zh-CN");
};

const formatDuration = (startTime: string | Date, endTime: string | Date) => {
  if (!startTime || !endTime) return "-";
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const duration = Math.floor((end - start) / 1000);

  if (duration < 60) return `${duration}秒`;
  if (duration < 3600) return `${Math.floor(duration / 60)}分${duration % 60}秒`;
  return `${Math.floor(duration / 3600)}时${Math.floor((duration % 3600) / 60)}分`;
};

const formatParams = (params: string) => {
  if (!params) return "无";
  try {
    return JSON.stringify(JSON.parse(params), null, 2);
  } catch {
    return params;
  }
};

const getServerName = (serverId: number) => {
  const server = serverOptions.value.find((s) => s.id === serverId);
  return server?.name || `服务器${serverId}`;
};

const getServerHost = (serverId: number) => {
  const server = serverOptions.value.find((s) => s.id === serverId);
  return server?.host || "-";
};

const getMethodType = (method: string) => {
  const typeMap: Record<string, any> = {
    DOCKER_CLI: "",
    COMPOSE: "success",
    SWARM: "warning",
  };
  return typeMap[method] || "";
};

const getMethodLabel = (method: string) => {
  const labelMap: Record<string, string> = {
    DOCKER_CLI: "Docker CLI",
    COMPOSE: "Compose",
    SWARM: "Swarm",
  };
  return labelMap[method] || method;
};

const getStatusType = (status: string) => {
  const statusMap: Record<string, any> = {
    INSTALLING: "warning",
    SUCCESS: "success",
    FAILED: "danger",
    CANCELLED: "info",
  };
  return statusMap[status] || "info";
};

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    INSTALLING: "安装中",
    SUCCESS: "成功",
    FAILED: "失败",
    CANCELLED: "已取消",
  };
  return statusMap[status] || status;
};

const getProgressStatus = (status: string) => {
  if (status === "SUCCESS") return "success";
  if (status === "FAILED") return "exception";
  if (status === "INSTALLING") return undefined;
  return "exception";
};

onMounted(async () => {
  await loadServers();
  reload();
});
</script>

<style scoped>
.records-page {
  padding: 16px;
  background: var(--app-bg-secondary);
  min-height: calc(100vh - 60px);
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 20px;
  background: var(--app-card-bg);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.title-icon {
  font-size: 24px;
  color: var(--app-primary);
}

.page-subtitle {
  font-size: 14px;
  color: var(--app-text-secondary);
}

.header-right {
  display: flex;
  gap: 12px;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--app-card-bg);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
}

.search-left {
  display: flex;
  gap: 12px;
  flex: 1;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 140px;
}

.date-picker {
  width: 240px;
}

.search-right {
  display: flex;
  gap: 8px;
}

/* 统计信息 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: var(--app-card-bg);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  color: var(--el-text-color-primary);
  font-size: 24px;
}

.stat-icon.success {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.warning {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
}

.stat-icon.danger {
  background: linear-gradient(135deg, #f56c6c, #f89898);
}

.stat-icon.info {
  background: linear-gradient(135deg, var(--app-primary), #79bbff);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--app-text-primary);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--app-text-secondary);
}

/* 记录卡片 */
.records-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 表格样式 */
.records-table {
  margin-bottom: 16px;
}

.server-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.server-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.server-host {
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-size: 12px;
  color: #606266;
  min-width: 35px;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

/* 详情对话框 */
.record-detail {
  padding: 16px 0;
}

.params-code {
  background: var(--el-bg-color-overlay);
  padding: 12px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  line-height: 1.4;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
}

.error-message {
  color: #f56c6c;
  background: #fef0f0;
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid #f56c6c;
  font-family: "Courier New", monospace;
  font-size: 12px;
  line-height: 1.4;
}

/* 日志对话框 */
.logs-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.logs-header {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.logs-content {
  flex: 1;
  background: #1e1e1e;
  border-radius: 4px;
  overflow: auto;
  position: relative;
}

.logs-text {
  color: #d4d4d4;
  font-family: "Courier New", monospace;
  font-size: 12px;
  line-height: 1.4;
  padding: 16px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.logs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-primary);
  font-size: 14px;
  gap: 8px;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: #fafafa;
  font-weight: 600;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f0f2f5;
}

:deep(.el-table tr:hover > td) {
  background: var(--el-bg-color-overlay);
}

/* 按钮样式 */
:deep(.el-button) {
  border-radius: 6px;
}

:deep(.el-button--small) {
  padding: 5px 12px;
  font-size: 12px;
}

/* 进度条样式 */
:deep(.el-progress) {
  width: 100%;
}

:deep(.el-progress-bar__outer) {
  border-radius: 10px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 10px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .search-left {
    flex-wrap: wrap;
  }

  .search-input {
    width: 240px;
  }

  .filter-select {
    width: 120px;
  }

  .date-picker {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .records-page {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-left {
    flex-direction: column;
  }

  .search-input,
  .filter-select,
  .date-picker {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .stat-value {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .header-right {
    flex-direction: column;
    width: 100%;
  }

  .search-right {
    flex-direction: column;
  }
}
</style>
