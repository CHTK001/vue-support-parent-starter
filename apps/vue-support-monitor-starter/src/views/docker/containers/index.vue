<template>
  <div class="container-management">
    <ProgressMonitor />

    <!-- 统计卡片 -->
    <div class="stats-row">
      <ScCard
        layout="stats-simple"
        theme="success"
        icon="ri:play-circle-fill"
        :value="runningCount"
        label="运行中"
      />
      <ScCard
        layout="stats-simple"
        theme="default"
        icon="ri:stop-circle-fill"
        :value="stoppedCount"
        label="已停止"
      />
      <ScCard
        layout="stats-simple"
        theme="warning"
        icon="ri:pause-circle-fill"
        :value="pausedCount"
        label="暂停"
      />
      <ScCard
        layout="stats-simple"
        theme="purple"
        icon="ri:stack-fill"
        :value="totalCount"
        label="总容器"
      />
    </div>

    <!-- 工具栏 -->
    <div class="toolbar-section">
      <div class="toolbar-left">
        <el-button @click="handleRefresh" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="primary" @click="handleSyncStatus" :loading="syncLoading">
          <IconifyIconOnline icon="ri:loop-left-line" class="mr-1" />
          同步状态
        </el-button>
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索容器名称或镜像"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select
          v-model="searchParams.status"
          placeholder="运行状态"
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option label="全部状态" value="" />
          <el-option label="运行中" value="running">
            <span class="status-option"
              ><span class="status-dot running" />运行中</span
            >
          </el-option>
          <el-option label="已停止" value="stopped">
            <span class="status-option"
              ><span class="status-dot stopped" />已停止</span
            >
          </el-option>
          <el-option label="暂停" value="paused">
            <span class="status-option"
              ><span class="status-dot paused" />暂停</span
            >
          </el-option>
          <el-option label="重启中" value="restarting">
            <span class="status-option"
              ><span class="status-dot restarting" />重启中</span
            >
          </el-option>
          <el-option label="错误" value="error">
            <span class="status-option"
              ><span class="status-dot error" />错误</span
            >
          </el-option>
        </el-select>
        <el-select
          v-model="searchParams.serverId"
          placeholder="选择服务器"
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option label="全部服务器" value="" />
          <el-option
            v-for="server in serverOptions"
            :key="server.id"
            :label="server.name"
            :value="server.id"
          />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button-group class="batch-btn-group" v-if="selectedIds.length > 0">
          <el-button type="success" @click="handleBatchStart">
            <IconifyIconOnline icon="ri:play-fill" class="mr-1" />
            启动 ({{ selectedIds.length }})
          </el-button>
          <el-button type="warning" @click="handleBatchStop">
            <IconifyIconOnline icon="ri:stop-fill" class="mr-1" />
            停止
          </el-button>
          <el-button type="danger" @click="handleBatchDelete">
            <IconifyIconOnline icon="ri:delete-bin-fill" class="mr-1" />
            删除
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 容器表格 -->
    <el-card class="container-table-card">
      <ScTable
        ref="tableRef"
        :url="containerApi.getContainerPageList"
        :params="searchParams"
        stripe
        :loading="loading"
        class="container-table"
        table-name="soft-containers"
        height="100%"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column label="容器信息" min-width="250">
          <template #default="{ row }">
            <div class="container-info">
              <div class="container-details">
                <div class="container-name">
                  {{ row.systemSoftContainerName }}
                </div>
                <div class="container-id">
                  {{ row.systemSoftContainerDockerId?.substring(0, 12) }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="镜像信息" min-width="200">
          <template #default="{ row }">
            <div class="image-info">
              <div class="image-name">{{ row.systemSoftContainerImage }}</div>
              <div class="image-tag">{{ row.systemSoftContainerImageTag }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="运行状态" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.systemSoftContainerStatus)"
              size="small"
            >
              {{ getStatusText(row.systemSoftContainerStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="服务器" width="180">
          <template #default="{ row }">
            <div class="server-info">
              <div class="server-name">{{ row.systemServerId }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="端口映射" min-width="150">
          <template #default="{ row }">
            <div class="ports-container">
              <el-tag
                v-for="port in parsePortMappings(row.systemSoftContainerPorts)"
                :key="port"
                size="small"
                class="port-tag"
              >
                {{ port }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="资源使用" width="180">
          <template #default="{ row }">
            <div class="resource-usage">
              <div class="usage-item">
                <span class="usage-label">CPU:</span>
                <el-progress
                  :percentage="
                    row.systemSoftContainerCpuPercent ||
                    row.systemSoftContainerCpuUsage ||
                    0
                  "
                  :show-text="false"
                  :stroke-width="4"
                  style="width: 60px"
                />
                <span class="usage-value"
                  >{{
                    (
                      row.systemSoftContainerCpuPercent ||
                      row.systemSoftContainerCpuUsage ||
                      0
                    ).toFixed(1)
                  }}%</span
                >
              </div>
              <div class="usage-item">
                <span class="usage-label">内存:</span>
                <el-progress
                  :percentage="
                    row.systemSoftContainerMemoryPercent ||
                    row.systemSoftContainerMemoryUsage ||
                    0
                  "
                  :show-text="false"
                  :stroke-width="4"
                  style="width: 60px"
                />
                <span class="usage-value"
                  >{{
                    (
                      row.systemSoftContainerMemoryPercent ||
                      row.systemSoftContainerMemoryUsage ||
                      0
                    ).toFixed(1)
                  }}%</span
                >
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.systemSoftContainerCreatedTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                size="small"
                type="success"
                @click="handleStart(row)"
                :disabled="row.systemSoftContainerStatus === 'running'"
              >
                <IconifyIconOnline icon="ri:play-line" class="mr-1" />
                启动
              </el-button>
              <el-button
                size="small"
                type="warning"
                @click="handleStop(row)"
                :disabled="row.systemSoftContainerStatus !== 'running'"
              >
                <IconifyIconOnline icon="ri:stop-line" class="mr-1" />
                停止
              </el-button>
              <el-button size="small" @click="openExec(row)">
                <IconifyIconOnline icon="ri:terminal-box-line" class="mr-1" />
                进入容器
              </el-button>
              <el-dropdown
                @command="(command) => handleMoreAction(command, row)"
              >
                <el-button size="small">
                  <IconifyIconOnline icon="ri:more-line" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="restart">
                      <IconifyIconOnline icon="ri:restart-line" class="mr-1" />
                      重启
                    </el-dropdown-item>
                    <el-dropdown-item command="logs">
                      <IconifyIconOnline
                        icon="ri:file-text-line"
                        class="mr-1"
                      />
                      查看日志
                    </el-dropdown-item>
                    <el-dropdown-item command="detail">
                      <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
                      详细信息
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <IconifyIconOnline
                        icon="ri:delete-bin-line"
                        class="mr-1"
                      />
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

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

    <ServerTerminalDialog ref="terminalRef" />
  </div>
</template>

<script setup lang="ts">
import ProgressMonitor from "@/components/ProgressMonitor.vue";
import ServerTerminalDialog from "@/views/server/modules/server-management/components/ServerTerminalDialog.vue";
import { getServerInfo, sendServerData } from "@/api/server";
import {
  containerApi,
  getServerList,
  type SystemSoftContainer,
} from "@/api/docker";
import ScTable from "@repo/components/ScTable/index.vue";
import { ScCard } from "@repo/components";
import { message, messageBox } from "@repo/utils";
import { useGlobalSocket, MonitorTopics } from "@repo/core";
import { ElNotification } from "element-plus";
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import ContainerDetailDialog from "./components/ContainerDetailDialog.vue";
import ContainerLogsDialog from "./components/ContainerLogsDialog.vue";

// 响应式数据
const loading = ref(false);
const syncLoading = ref(false);
const selectedIds = ref<number[]>([]);
const containerList = ref<SystemSoftContainer[]>([]);
const serverOptions = ref<any[]>([]);
const detailDialogVisible = ref(false);
const logsDialogVisible = ref(false);
const currentContainer = ref<SystemSoftContainer | null>(null);

// 统计数据计算
const runningCount = computed(
  () =>
    containerList.value.filter((c) => c.systemSoftContainerStatus === "running")
      .length
);
const stoppedCount = computed(
  () =>
    containerList.value.filter((c) => c.systemSoftContainerStatus === "stopped")
      .length
);
const pausedCount = computed(
  () =>
    containerList.value.filter((c) => c.systemSoftContainerStatus === "paused")
      .length
);
const totalCount = computed(() => containerList.value.length);

// 搜索参数
const searchParams = reactive({
  keyword: "",
  status: "",
  serverId: "",
  size: 10,
  page: 1,
});

// 分页参数
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

// 基础方法
// ScTable会自动处理数据加载，此方法不再需要
const loadContainers = () => {
  // 空实现，保持向后兼容性
};

const handleRefresh = () => loadContainers();
const handleSearch = () => {
  pagination.page = 1;
  loadContainers();
};
const clearSelection = () => {
  selectedIds.value = [];
};

// 工具函数
const getStatusType = (status?: string) => {
  const map = {
    running: "success",
    stopped: "warning",
    paused: "info",
    restarting: "warning",
    error: "danger",
  };
  return map[status] || "info";
};

const getStatusText = (status?: string) => {
  const map = {
    running: "运行中",
    stopped: "已停止",
    paused: "暂停",
    restarting: "重启中",
    error: "错误",
  };
  return map[status] || "未知";
};

const parsePortMappings = (ports?: string) => {
  if (!ports) return [];
  try {
    const mappings = JSON.parse(ports);
    return Array.isArray(mappings)
      ? mappings.map((p) => `${p.hostPort}:${p.containerPort}`)
      : [];
  } catch {
    return ports.split(",").filter(Boolean);
  }
};

const formatTime = (time?: string) =>
  time ? new Date(time).toLocaleString() : "-";

// 容器操作
const handleStart = async (container: SystemSoftContainer) => {
  try {
    const response = await containerApi.startContainer(
      container.systemSoftContainerId!
    );
    if (response.code === "00000") {
      message.success("容器启动成功");
      loadContainers();
    } else {
      message.error(response.msg || "容器启动失败");
    }
  } catch (error) {
    message.error("容器启动失败");
  }
};

const handleStop = async (container: SystemSoftContainer) => {
  try {
    await messageBox.confirm("确定要停止这个容器吗？", "停止确认", {
      type: "warning",
    });

    const response = await containerApi.stopContainer(
      container.systemSoftContainerId!
    );
    if (response.code === "00000") {
      message.success("容器停止成功");
      loadContainers();
    } else {
      message.error(response.msg || "容器停止失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      message.error("容器停止失败");
    }
  }
};

const handleMoreAction = async (
  command: string,
  container: SystemSoftContainer
) => {
  currentContainer.value = container;

  switch (command) {
    case "restart":
      await handleRestart(container);
      break;
    case "logs":
      logsDialogVisible.value = true;
      break;
    case "detail":
      detailDialogVisible.value = true;
      break;
    case "delete":
      await handleDelete(container);
      break;
  }
};

const handleRestart = async (container: SystemSoftContainer) => {
  try {
    const response = await containerApi.restartContainer(
      container.systemSoftContainerId!
    );
    if (response.code === "00000") {
      message.success("容器重启成功");
      loadContainers();
    } else {
      message.error(response.msg || "容器重启失败");
    }
  } catch (error) {
    message.error("容器重启失败");
  }
};

const handleDelete = async (container: SystemSoftContainer) => {
  try {
    await messageBox.confirm(
      "确定要删除这个容器吗？此操作不可恢复！",
      "删除确认",
      {
        type: "error",
      }
    );

    const response = await containerApi.deleteContainer(
      container.systemSoftContainerId!
    );
    if (response.code === "00000") {
      message.success("容器删除成功");
      loadContainers();
    } else {
      message.error(response.msg || "容器删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      message.error("容器删除失败");
    }
  }
};

const handleSyncStatus = async () => {
  try {
    syncLoading.value = true;
    const response = await containerApi.syncContainerStatus();
    if (response.code === "00000") {
      message.success("容器状态同步成功");
      loadContainers();
    } else {
      message.error(response.msg || "同步失败");
    }
  } catch (error) {
    message.error("同步容器状态失败");
  } finally {
    syncLoading.value = false;
  }
};

// 批量操作
const handleBatchStart = async () => {
  if (selectedIds.value.length === 0) {
    message.warning("请选择要启动的容器");
    return;
  }

  try {
    // 使用现有的批量操作API
    const response = await containerApi.batchOperateContainers({
      containerIds: selectedIds.value,
      operation: "start",
    });
    if (response.code === "00000") {
      message.success("批量启动成功");
      selectedIds.value = [];
      loadContainers();
    } else {
      message.error(response.msg || "批量启动失败");
    }
  } catch (error) {
    message.error("批量启动容器失败");
  }
};

const handleBatchStop = async () => {
  if (selectedIds.value.length === 0) {
    message.warning("请选择要停止的容器");
    return;
  }

  try {
    await messageBox.confirm(
      `确定要停止选中的 ${selectedIds.value.length} 个容器吗？`,
      "批量停止确认",
      {
        type: "warning",
      }
    );

    // 使用现有的批量操作API
    const response = await containerApi.batchOperateContainers({
      containerIds: selectedIds.value,
      operation: "stop",
    });
    if (response.code === "00000") {
      message.success("批量停止成功");
      selectedIds.value = [];
      loadContainers();
    } else {
      message.error(response.msg || "批量停止失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      message.error("批量停止容器失败");
    }
  }
};

const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) {
    message.warning("请选择要删除的容器");
    return;
  }

  try {
    await messageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 个容器吗？此操作不可恢复！`,
      "批量删除确认",
      {
        type: "error",
      }
    );

    // 使用现有的批量操作API
    const response = await containerApi.batchOperateContainers({
      containerIds: selectedIds.value,
      operation: "remove",
    });
    if (response.code === "00000") {
      message.success("批量删除成功");
      selectedIds.value = [];
      loadContainers();
    } else {
      message.error(response.msg || "批量删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      message.error("批量删除容器失败");
    }
  }
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

// 获取全局Socket服务
const globalSocket = useGlobalSocket();
const tableRef = ref();

// 设置Socket事件监听
function setupSocketListeners() {
  if (!globalSocket) {
    console.warn("Global Socket服务未初始化");
    return;
  }

  // 监听容器状态变化
  globalSocket.on(MonitorTopics.DOCKER.CONTAINER_STATUS, (data: any) => {
    console.log("🐳 容器状态变化:", data);
    // 刷新表格数据
    tableRef.value?.reload?.();
    // 显示通知
    ElNotification.info({
      title: "容器状态变化",
      message: `容器 ${data.containerName} 状态变更为: ${data.status}`,
      duration: 3000,
      position: "bottom-right",
    });
  });

  // 监听容器事件
  globalSocket.on(MonitorTopics.DOCKER.CONTAINER_EVENTS, (data: any) => {
    console.log("📢 容器事件:", data);
    const eventTypeMap: Record<string, string> = {
      create: "创建",
      start: "启动",
      stop: "停止",
      restart: "重启",
      delete: "删除",
    };
    const eventText = eventTypeMap[data.eventType] || data.eventType;
    if (data.success) {
      ElNotification.success({
        title: `容器${eventText}成功`,
        message: data.eventMessage || `容器 ${data.containerName} ${eventText}成功`,
        duration: 3000,
        position: "bottom-right",
      });
    } else {
      ElNotification.error({
        title: `容器${eventText}失败`,
        message: data.eventMessage || `容器 ${data.containerName} ${eventText}失败`,
        duration: 5000,
        position: "bottom-right",
      });
    }
    // 刷新表格数据
    tableRef.value?.reload?.();
  });

  // 监听Docker操作进度
  globalSocket.on(MonitorTopics.DOCKER.PROGRESS, (data: any) => {
    console.log("⚙️ Docker操作进度:", data);
  });

  // 监听Docker操作开始
  globalSocket.on(MonitorTopics.DOCKER.START, (data: any) => {
    console.log("🚀 Docker操作开始:", data);
    ElNotification.info({
      title: "操作开始",
      message: `${data.operation} - ${data.containerName || data.imageName}`,
      duration: 2000,
      position: "bottom-right",
    });
  });

  // 监听Docker操作完成
  globalSocket.on(MonitorTopics.DOCKER.COMPLETE, (data: any) => {
    console.log("✅ Docker操作完成:", data);
    if (data.success) {
      ElNotification.success({
        title: "操作完成",
        message: `${data.operation} - ${data.containerName || data.imageName} 完成`,
        duration: 3000,
        position: "bottom-right",
      });
    }
    // 刷新表格数据
    tableRef.value?.reload?.();
  });

  // 监听Docker操作错误
  globalSocket.on(MonitorTopics.DOCKER.ERROR, (data: any) => {
    console.error("❌ Docker操作错误:", data);
    ElNotification.error({
      title: "操作失败",
      message: data.error || data.errorMessage || "操作执行失败",
      duration: 5000,
      position: "bottom-right",
    });
  });

  // 监听通用操作完成
  globalSocket.on(MonitorTopics.OPERATION.COMPLETE, (data: any) => {
    if (data.type?.includes("container")) {
      console.log("✅ 容器操作完成:", data);
      tableRef.value?.reload?.();
    }
  });

  // 监听通用操作错误
  globalSocket.on(MonitorTopics.OPERATION.ERROR, (data: any) => {
    if (data.type?.includes("container")) {
      console.error("❌ 容器操作错误:", data);
      ElNotification.error({
        title: "操作失败",
        message: data.error || "操作执行失败",
        duration: 5000,
        position: "bottom-right",
      });
    }
  });
}

// 清理Socket事件监听
function cleanupSocketListeners() {
  if (!globalSocket) return;

  globalSocket.off(MonitorTopics.DOCKER.CONTAINER_STATUS);
  globalSocket.off(MonitorTopics.DOCKER.CONTAINER_EVENTS);
  globalSocket.off(MonitorTopics.DOCKER.PROGRESS);
  globalSocket.off(MonitorTopics.DOCKER.START);
  globalSocket.off(MonitorTopics.DOCKER.COMPLETE);
  globalSocket.off(MonitorTopics.DOCKER.ERROR);
  globalSocket.off(MonitorTopics.OPERATION.COMPLETE);
  globalSocket.off(MonitorTopics.OPERATION.ERROR);
}

onMounted(() => {
  // 设置Socket事件监听
  setupSocketListeners();
  loadContainers();
  loadServers();
});

onUnmounted(() => {
  cleanupSocketListeners();
});

const terminalRef = ref();

async function openExec(row: any) {
  try {
    // 获取服务器信息
    const serverId = String(
      row.systemServerId || row.systemSoftContainerServerId || row.serverId
    );
    if (!serverId) return message.warning("缺少服务器ID");
    const { data, code, msg } = await getServerInfo(serverId);
    if (code !== 0 || !data)
      return message.error(msg || "获取服务器信息失败");

    // 打开终端并设置数据
    // ServerTerminalDialog 暴露 setData/open 方法
    // 其数据结构为 monitorSysGenServer* 字段，getServerInfo 返回已兼容
    (terminalRef.value as any)?.setData?.(data);
    (terminalRef.value as any)?.open?.();

    // 尝试发送 docker exec 命令
    const name = row.systemSoftContainerName || row.containerName || row.name;
    const shell = "/bin/sh";
    setTimeout(() => {
      sendServerData(serverId, `docker exec -it ${name} ${shell}\n`).catch(
        () => {}
      );
    }, 800);
  } catch (e) {
    console.error(e);
    message.error("进入容器失败");
  }
}
</script>

<style scoped>
.container-management {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100vh - 120px);
  height: calc(100vh - 120px);
  overflow: hidden;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* 工具栏样式 */
.toolbar-section {
  background: var(--app-card-bg);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 140px;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.running {
  background: #10b981;
}
.status-dot.stopped {
  background: #6b7280;
}
.status-dot.paused {
  background: #f59e0b;
}
.status-dot.restarting {
  background: #3b82f6;
}
.status-dot.error {
  background: #ef4444;
}

.batch-btn-group {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.container-table-card {
  background: var(--app-card-bg);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.container-table-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 16px;
  box-sizing: border-box;
}

.container-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.container-details {
  flex: 1;
  min-width: 0;
}

.container-name {
  font-weight: 500;
  color: var(--app-text-primary);
  margin-bottom: 4px;
}

.container-id {
  font-size: 12px;
  color: var(--app-text-secondary);
  font-family: monospace;
}

.image-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-name {
  font-weight: 500;
  color: var(--app-text-primary);
}

.image-tag {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.server-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.server-name {
  font-weight: 500;
  color: var(--app-text-primary);
}

.ports-container {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.port-tag {
  margin: 0;
  font-family: monospace;
  font-size: 11px;
}

.resource-usage {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.usage-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.usage-label {
  font-size: 12px;
  color: var(--app-text-secondary);
  width: 30px;
}

.usage-value {
  font-size: 12px;
  color: var(--app-text-primary);
  width: 35px;
  text-align: right;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: var(--app-card-bg);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
  z-index: 1000;
}

.batch-info {
  color: var(--app-link);
  font-weight: 500;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 140px;
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

.stat-icon.running {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.stopped {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.stat-icon.warning {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
}

.stat-icon.info {
  background: linear-gradient(135deg, #409eff, #79bbff);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

/* 容器表格特有样式 */
.container-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name-text {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.container-id {
  font-size: 12px;
  color: var(--el-text-color-primary);
  font-family: "Courier New", monospace;
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

.ports-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.port-tag {
  font-size: 11px;
  font-family: "Courier New", monospace;
}

.resource-usage {
  display: flex;
  align-items: center;
  gap: 8px;
}

.usage-text {
  font-size: 12px;
  color: #606266;
  min-width: 40px;
  text-align: right;
}

/* 容器详情对话框 */
.container-detail {
  padding: 16px 0;
}

.ports-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.env-vars {
  max-height: 200px;
  overflow-y: auto;
}

.env-code {
  background: var(--el-bg-color-overlay);
  padding: 12px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  line-height: 1.4;
}

/* 配置部分 */
.config-section {
  margin-bottom: 20px;
}

.config-section h4 {
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.config-code {
  background: var(--el-bg-color-overlay);
  padding: 16px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  line-height: 1.4;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
}

/* 监控网格 */
.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 16px 0;
}

.monitor-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.monitor-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 16px;
  font-weight: 500;
}

.monitor-chart {
  margin-bottom: 12px;
}

.monitor-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.monitor-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--el-bg-color-overlay);
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-primary);
  font-weight: 500;
  font-family: "Courier New", monospace;
}

/* 日志对话框 */
.logs-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.logs-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.log-lines-label {
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.logs-actions {
  display: flex;
  gap: 8px;
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

/* 创建容器对话框 */
.port-mappings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.port-mapping {
  display: flex;
  align-items: center;
  gap: 8px;
}

.port-separator {
  font-weight: bold;
  color: #606266;
}

.env-variables {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.env-variable {
  display: flex;
  align-items: center;
  gap: 8px;
}

.env-separator {
  font-weight: bold;
  color: #606266;
}

/* 终端对话框 */
.terminal-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.terminal-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.terminal-content {
  flex: 1;
  background: #1e1e1e;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.terminal-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-primary);
  font-size: 14px;
  gap: 8px;
}

/* 卡片和表格样式 */
.containers-card {
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
.containers-table {
  margin-bottom: 16px;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 16px 0;
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

/* 标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .toolbar-left {
    flex-wrap: wrap;
  }

  .search-input {
    width: 220px;
  }

  .filter-select {
    width: 130px;
  }
}

@media (max-width: 768px) {
  .container-management {
    padding: 16px;
  }

  .modern-header {
    padding: 20px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .action-btn {
    flex: 1;
  }

  .stats-section {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 22px;
  }

  .toolbar-section {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .toolbar-left {
    flex-direction: column;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .toolbar-right {
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .stats-section {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .stat-card {
    padding: 12px;
    gap: 10px;
  }

  .stat-icon-bg {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-label {
    font-size: 12px;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-icon-wrapper {
    width: 48px;
    height: 48px;
  }

  .header-main-icon {
    font-size: 24px;
  }

  .header-title {
    font-size: 20px;
  }
}
</style>
