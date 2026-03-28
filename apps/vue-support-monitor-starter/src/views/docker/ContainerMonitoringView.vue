<template>
  <div class="container-monitoring-view system-container modern-bg">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <IconifyIconOnline icon="ri:dashboard-line" class="title-icon" />
          <span>容器监控</span>
        </div>
        <div class="page-subtitle">实时监控和管理Docker容器</div>
      </div>
    </div>

    <!-- 操作工具栏 -->
    <ContainerActionToolbar
      @create="handleCreateContainer"
      @refresh="handleRefresh"
      @auto-refresh="handleAutoRefresh"
      @export="handleExport"
      @batch-operation="handleBatchOperation"
    />

    <!-- 过滤器 -->
    <ContainerFilter
      :server-options="serverOptions"
      @apply-filter="handleApplyFilter"
      @reset-filter="handleResetFilter"
    />

    <!-- 统计概览 -->
    <ScRow :gutter="20" class="stats-row">
      <ScCol :span="24">
        <ContainerStatusStats :stats="containerStats" />
      </ScCol>
    </ScRow>

    <ScRow :gutter="20" class="stats-row">
      <ScCol :span="24">
        <MonitoringOverview
          :avg-cpu-usage="overviewStats.avgCpuUsage"
          :avg-memory-usage="overviewStats.avgMemoryUsage"
          :total-containers="overviewStats.totalContainers"
          :running-containers="overviewStats.runningContainers"
        />
      </ScCol>
    </ScRow>

    <!-- 容器列表 -->
    <ScCard class="container-list-card">
      <template #header>
        <div class="card-header">
          <span>容器列表</span>
          <div class="card-actions">
            <ScButton size="small" :loading="loading" @click="handleRefresh">
              <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
              刷新
            </ScButton>
          </div>
        </div>
      </template>

      <ContainerMonitoringList
        :containers="containerList"
        :loading="loading"
        :pagination="pagination"
        :show-pagination="true"
        :show-selection="true"
        @view-detail="handleViewDetail"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        @selection-change="handleSelectionChange"
      />
    </ScCard>

    <!-- 容器详情对话框 -->
    <ContainerDetailDialog
      v-model:visible="detailDialogVisible"
      :container-data="currentContainer"
    />

    <!-- 容器日志对话框 -->
    <ContainerLogsDialog
      v-model:visible="logsDialogVisible"
      :container-data="currentContainer"
    />
  </div>
</template>

<script setup lang="ts">
import {
  containerApi,
  getServerList,
  type ContainerStatusStatistics,
  type SystemSoftContainer,
} from "@/api/docker";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

// 导入组件
import ContainerActionToolbar from "@/views/docker/detail/components/ContainerActionToolbar.vue";
import ContainerDetailDialog from "@/views/docker/containers/components/ContainerDetailDialog.vue";
import ContainerFilter from "@/views/docker/detail/components/ContainerFilter.vue";
import ContainerLogsDialog from "@/views/docker/containers/components/ContainerLogsDialog.vue";
import ContainerMonitoringList from "@/views/docker/monitoring/components/ContainerMonitoringList.vue";
import ContainerStatusStats from "@/views/docker/monitoring/components/ContainerStatusStats.vue";
import MonitoringOverview from "@/views/docker/monitoring/components/MonitoringOverview.vue";

// 响应式数据
const loading = ref(false);
const autoRefresh = ref(false);
const containerList = ref<SystemSoftContainer[]>([]);
const serverOptions = ref<any[]>([]);
const detailDialogVisible = ref(false);
const logsDialogVisible = ref(false);
const currentContainer = ref<SystemSoftContainer | null>(null);
const containerStats = ref<ContainerStatusStatistics>({ total: 0 });
const selectedContainers = ref<SystemSoftContainer[]>([]);
const router = useRouter();

// 搜索参数
const searchParams = reactive({
  name: "",
  image: "",
  status: "",
  serverId: "",
});

// 分页参数
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 概览统计
const overviewStats = reactive({
  avgCpuUsage: 0,
  avgMemoryUsage: 0,
  totalContainers: 0,
  runningContainers: 0,
});

// 定时器
let refreshTimer: any = null;

// 加载容器列表
const loadContainerList = async () => {
  try {
    loading.value = true;
    const params = {
      ...searchParams,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };

    // 清理空参数
    Object.keys(params).forEach((key) => {
      if (params[key] === "") delete params[key];
    });

    const response = await containerApi.getContainerPageList(params);
    if (response.code === "00000") {
      containerList.value = response.data.records || [];
      pagination.total = response.data.total || 0;
      calculateOverviewStats();
    }
  } catch (error) {
    message("加载容器列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 加载容器状态统计
const loadContainerStats = async () => {
  try {
    const response = await containerApi.getContainerStatusStats();
    if (response.code === "00000") {
      containerStats.value = response.data || { total: 0 };
    }
  } catch (error) {
    console.error("加载容器状态统计失败:", error);
  }
};

// 计算概览统计
const calculateOverviewStats = () => {
  if (containerList.value.length === 0) {
    overviewStats.avgCpuUsage = 0;
    overviewStats.avgMemoryUsage = 0;
    overviewStats.totalContainers = 0;
    overviewStats.runningContainers = 0;
    return;
  }

  // 计算平均CPU和内存使用率
  const cpuSum = containerList.value.reduce(
    (sum, container) =>
      sum +
      (container.systemSoftContainerCpuPercent ||
        container.systemSoftContainerCpuUsage ||
        0),
    0,
  );

  const memorySum = containerList.value.reduce(
    (sum, container) =>
      sum +
      (container.systemSoftContainerMemoryPercent ||
        container.systemSoftContainerMemoryUsage ||
        0),
    0,
  );

  overviewStats.avgCpuUsage = cpuSum / containerList.value.length;
  overviewStats.avgMemoryUsage = memorySum / containerList.value.length;

  // 计算容器总数和运行中容器数
  overviewStats.totalContainers = containerList.value.length;
  overviewStats.runningContainers = containerList.value.filter(
    (container) => container.systemSoftContainerStatus === "running",
  ).length;
};

// 刷新数据
const handleRefresh = () => {
  loadContainerList();
  loadContainerStats();
};

// 自动刷新
const handleAutoRefresh = (enabled: boolean) => {
  autoRefresh.value = enabled;
  if (enabled) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

// 开始自动刷新
const startAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  refreshTimer = setInterval(() => {
    if (autoRefresh.value) {
      loadContainerList();
      loadContainerStats();
    }
  }, 5000); // 每5秒刷新一次
};

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

// 应用过滤
const handleApplyFilter = (params: any) => {
  Object.assign(searchParams, params);
  pagination.page = 1;
  loadContainerList();
};

// 重置过滤
const handleResetFilter = () => {
  Object.assign(searchParams, {
    name: "",
    image: "",
    status: "",
    serverId: "",
  });
  pagination.page = 1;
  loadContainerList();
};

// 创建容器
const handleCreateContainer = () => {
  router.push({ path: "/docker/images" });
  message("请在镜像管理中选择镜像并创建容器", { type: "info" });
};

// 导出数据
const handleExport = () => {
  const data =
    selectedContainers.value.length > 0
      ? selectedContainers.value
      : containerList.value;
  if (!data.length) {
    return message("没有可导出的容器数据", { type: "warning" });
  }

  const headers = [
    "容器ID",
    "DockerID",
    "容器名称",
    "镜像",
    "状态",
    "服务器ID",
    "CPU(%)",
    "内存(%)",
    "创建时间",
  ];

  const rows = data.map((item) => [
    item.systemSoftContainerId ?? "",
    item.systemSoftContainerDockerId ?? "",
    item.systemSoftContainerName ?? "",
    item.systemSoftContainerImage
      ? `${item.systemSoftContainerImage}:${item.systemSoftContainerImageTag || "latest"}`
      : "",
    item.systemSoftContainerStatus ?? "",
    item.systemServerId ?? "",
    item.systemSoftContainerCpuPercent ??
      item.systemSoftContainerCpuUsage ??
      "",
    item.systemSoftContainerMemoryPercent ??
      item.systemSoftContainerMemoryUsage ??
      "",
    item.systemSoftContainerCreatedTime ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell ?? "");
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `docker-containers-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// 批量操作
const handleBatchOperation = (command: string) => {
  switch (command) {
    case "batchStart":
      performBatchOperation("start", "启动");
      break;
    case "batchStop":
      performBatchOperation("stop", "停止");
      break;
    case "batchRestart":
      performBatchOperation("restart", "重启");
      break;
    case "batchRemove":
      performBatchOperation("remove", "删除");
      break;
    default:
      message("未知操作", { type: "warning" });
  }
};

const performBatchOperation = async (operation: string, label: string) => {
  const ids = selectedContainers.value
    .map((item) => item.systemSoftContainerId)
    .filter((id) => id != null) as number[];

  if (!ids.length) {
    return message("请先选择容器", { type: "warning" });
  }

  try {
    await ElMessageBox.confirm(
      `确认批量${label}选中的 ${ids.length} 个容器？`,
      "提示",
      { type: "warning" },
    );

    const res = await containerApi.batchOperateContainers({
      containerIds: ids,
      operation,
    });
    if (res.code === "00000") {
      message(`批量${label}完成`, { type: "success" });
      loadContainerList();
      loadContainerStats();
    } else {
      message(res.msg || `批量${label}失败`, { type: "error" });
    }
  } catch (error) {
    if (String(error) !== "cancel") {
      message(`批量${label}失败`, { type: "error" });
    }
  }
};

// 查看详情
const handleViewDetail = (container: SystemSoftContainer) => {
  currentContainer.value = container;
  detailDialogVisible.value = true;
};

// 查看日志
const handleViewLogs = (container: SystemSoftContainer) => {
  currentContainer.value = container;
  logsDialogVisible.value = true;
};

const handleSelectionChange = (selection: SystemSoftContainer[]) => {
  selectedContainers.value = selection;
};

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  loadContainerList();
};

const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadContainerList();
};

// 加载服务器列表
const loadServers = async () => {
  try {
    const response = await getServerList();
    if (response.code === "00000") {
      serverOptions.value = response.data || [];
    }
  } catch (error) {
    console.error("加载服务器列表失败:", error);
  }
};

// 组件挂载
onMounted(() => {
  loadContainerList();
  loadContainerStats();
  loadServers();
});

// 组件卸载
onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }
}

.modern-bg {
  position: relative;
  overflow: hidden;

  /* 渐变背景 */
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

.container-monitoring-view {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.title-icon {
  margin-right: 8px;
  color: #409eff;
}

.page-subtitle {
  color: #6c757d;
  margin-top: 8px;
  font-size: 14px;
}

.stats-row {
  margin-bottom: 20px;
}

.container-list-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .container-monitoring-view {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
