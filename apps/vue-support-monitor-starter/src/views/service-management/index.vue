<template>
  <div class="service-management-container">
    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <ScCard
        layout="stats"
        label="总服务器数"
        :value="statistics.total || 0"
        icon="ri:server-line"
        theme="primary"
        trendText="全部服务器"
        hoverable
        class="stat-card-item"
      />
      <ScCard
        layout="stats"
        label="运行中"
        :value="statistics.running || 0"
        icon="ri:play-circle-line"
        theme="success"
        :trendText="`${getRunningRate()}%`"
        hoverable
        class="stat-card-item"
      />
      <ScCard
        layout="stats"
        label="已停止"
        :value="statistics.stopped || 0"
        icon="ri:stop-circle-line"
        theme="warning"
        :trendText="statistics.stopped > 0 ? '待启动' : '正常'"
        hoverable
        class="stat-card-item"
      />
      <ScCard
        layout="stats"
        label="异常"
        :value="statistics.error || 0"
        icon="ri:error-warning-line"
        theme="danger"
        :trendText="statistics.error > 0 ? '需要处理' : '无异常'"
        hoverable
        class="stat-card-item"
      />
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <div class="filter-content">
        <el-form :model="queryParams" inline>
          <el-form-item label="服务器名称">
            <el-input
              v-model="queryParams.serverName"
              placeholder="请输入服务器名称"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="服务器类型">
            <el-select
              v-model="queryParams.serverType"
              placeholder="请选择服务器类型"
              clearable
              style="width: 200px"
            >
              <el-option
                v-for="type in serverTypes"
                :key="getTypeValue(type)"
                :label="getTypeLabel(type)"
                :value="getTypeValue(type)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="运行状态">
            <el-select
              v-model="queryParams.status"
              placeholder="请选择运行状态"
              clearable
              style="width: 200px"
            >
              <el-option label="运行中" value="RUNNING" />
              <el-option label="已停止" value="STOPPED" />
              <el-option label="启动中" value="STARTING" />
              <el-option label="停止中" value="STOPPING" />
              <el-option label="异常" value="ERROR" />
            </el-select>
          </el-form-item>

          <!-- 操作按钮组 -->
          <el-form-item class="action-buttons">
            <el-button type="primary" @click="handleQuery">
              <IconifyIconOnline icon="ri:search-line" />
              查询
            </el-button>
            <el-button @click="resetQuery">
              <IconifyIconOnline icon="ri:refresh-line" />
              重置
            </el-button>
            <el-button @click="refreshData">
              <IconifyIconOnline icon="ri:refresh-line" />
              刷新
            </el-button>
            <el-button type="primary" @click="showAddDialog = true">
              <IconifyIconOnline icon="ri:add-line" />
              新增服务器
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 服务器列表 -->
    <div class="server-list">
      <ScTable
        ref="serverTable"
        :loading="loading"
        :url="getSystemServerPage"
        :params="queryParams"
        layout="card"
      >
        <template #empty>
          <el-empty description="暂无服务器数据">
            <el-button type="primary" @click="showAddDialog = true"
              >新增服务器</el-button
            >
          </el-empty>
        </template>

        <template #default="{ row: server }">
          <div
            class="server-card"
            :class="getServerCardClass(server.systemServerStatus)"
          >
            <!-- 顶部状态条 -->
            <div class="status-bar"></div>

            <!-- 卡片主体 -->
            <div class="card-content">
              <!-- 头部：图标 + 名称 + 状态 -->
              <div class="card-header">
                <div class="server-icon">
                  <component :is="getProtocolIcon(server.systemServerType)" />
                </div>
                <div class="server-meta">
                  <h3 class="server-name">{{ server.systemServerName }}</h3>
                  <div class="server-type">{{ server.systemServerType }}</div>
                </div>
                <el-tag
                  :type="getStatusTagType(server.systemServerStatus)"
                  size="small"
                  class="status-tag"
                  effect="dark"
                >
                  <IconifyIconOnline
                    :icon="
                      server.systemServerStatus === 'RUNNING'
                        ? 'ri:checkbox-circle-fill'
                        : 'ri:close-circle-fill'
                    "
                    class="status-icon"
                  />
                  {{ getStatusText(server.systemServerStatus) }}
                </el-tag>
              </div>

              <!-- 核心信息区 -->
              <div class="server-stats">
                <div class="stat-item primary" @click="handleOpen(server)">
                  <div class="stat-icon">
                    <IconifyIconOnline icon="ri:global-line" />
                  </div>
                  <div class="stat-info">
                    <span class="stat-value">{{
                      server.systemServerPort
                    }}</span>
                    <span class="stat-label">端口</span>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon">
                    <IconifyIconOnline icon="ri:filter-3-line" />
                  </div>
                  <div class="stat-info">
                    <span class="stat-value">{{
                      server.filterCount || 0
                    }}</span>
                    <span class="stat-label">过滤器</span>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon">
                    <IconifyIconOnline icon="ri:link" />
                  </div>
                  <div class="stat-info">
                    <span class="stat-value">{{
                      server.systemServerMaxConnections || "∞"
                    }}</span>
                    <span class="stat-label">连接数</span>
                  </div>
                </div>
              </div>

              <!-- 详细信息 -->
              <div class="server-details">
                <div class="detail-item">
                  <IconifyIconOnline icon="ri:folder-line" />
                  <span>{{ server.systemServerContextPath || "/" }}</span>
                </div>
                <div class="detail-item" v-if="server.systemServerTimeout">
                  <IconifyIconOnline icon="ri:time-line" />
                  <span>{{ server.systemServerTimeout }}ms</span>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="card-actions">
                <el-button
                  v-if="
                    server.systemServerStatus === 'STOPPED' ||
                    server.systemServerStatus === 'ERROR'
                  "
                  type="success"
                  @click="startServer(server.systemServerId)"
                  :loading="actionLoading[server.systemServerId]"
                  class="action-btn"
                >
                  <IconifyIconOnline icon="ri:play-fill" />
                  启动
                </el-button>
                <el-button
                  v-else-if="server.systemServerStatus === 'RUNNING'"
                  type="danger"
                  @click="stopServer(server.systemServerId)"
                  :loading="actionLoading[server.systemServerId]"
                  class="action-btn"
                >
                  <IconifyIconOnline icon="ri:stop-fill" />
                  停止
                </el-button>
                <el-button v-else type="warning" disabled class="action-btn">
                  {{ getStatusText(server.systemServerStatus) }}
                </el-button>

                <div class="action-group">
                  <el-tooltip content="设置" placement="top">
                    <el-button
                      circle
                      @click="openServerConfig(server.systemServerId, server)"
                    >
                      <IconifyIconOnline icon="ri:settings-4-line" />
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="日志" placement="top">
                    <el-button
                      circle
                      @click="openServerLog(server.systemServerId, server)"
                      :disabled="server.systemServerStatus !== 'RUNNING'"
                    >
                      <IconifyIconOnline icon="ri:file-list-3-line" />
                    </el-button>
                  </el-tooltip>
                  <el-dropdown @command="handleServerAction" trigger="click">
                    <el-button circle>
                      <IconifyIconOnline icon="ri:more-2-fill" />
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item :command="{ type: 'edit', server }">
                          <IconifyIconOnline icon="ri:edit-line" /> 编辑
                        </el-dropdown-item>
                        <el-dropdown-item :command="{ type: 'clone', server }">
                          <IconifyIconOnline icon="ri:file-copy-line" /> 克隆
                        </el-dropdown-item>
                        <el-dropdown-item
                          :command="`restart-${server.systemServerId}`"
                          :disabled="server.systemServerStatus !== 'RUNNING'"
                        >
                          <IconifyIconOnline icon="ri:restart-line" /> 重启
                        </el-dropdown-item>
                        <el-dropdown-item
                          :command="`delete-${server.systemServerId}`"
                          divided
                        >
                          <IconifyIconOnline
                            icon="ri:delete-bin-line"
                            style="color: #ef4444"
                          />
                          <span style="color: #ef4444">删除</span>
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </div>
          </div>
        </template>
      </ScTable>
    </div>
    <!-- 新增/编辑对话框 -->
    <ServerFormDialog
      v-model:visible="showAddDialog"
      :server-data="currentServer"
      :server-types="serverTypes"
      @success="handleFormSuccess"
    />

    <!-- 克隆对话框 -->
    <ServerCloneDialog
      v-model:visible="showCloneDialog"
      :source-server="currentServer"
      @success="handleCloneSuccess"
    />

    <!-- 服务器配置对话框 -->
    <ServerConfigDialog
      v-model:visible="showConfigDialog"
      :server="currentServer"
      :server-id="currentServerId"
      @success="handleConfigSuccess"
    />

    <!-- 服务器日志对话框 -->
    <ServerLogDialog
      v-model:visible="showLogDialog"
      :server="currentServer"
      :server-id="currentServerId"
    />
  </div>
</template>

<script setup lang="ts">
import {
  deleteSystemServer,
  getAvailableServerTypes,
  getSystemServerPage,
  getSystemServerStatistics,
  restartSystemServer,
  startSystemServer,
  stopSystemServer,
  type SystemServer,
  type SystemServerStatistics,
} from "@/api/system-server";
import { getProtocolIcon } from "@/components/protocol-icons";
import { ElMessage, ElMessageBox } from "element-plus";
import { onMounted, reactive, ref } from "vue";
import ServerCloneDialog from "./components/ServerCloneDialog.vue";
import ServerConfigDialog from "./components/ServerConfigDialog.vue";
import ServerFormDialog from "./components/ServerFormDialog.vue";
import ServerLogDialog from "./components/ServerLogDialog.vue";

// 页面标题
defineOptions({
  name: "ServiceManagement",
});

// 服务器类型接口
interface ServerType {
  name?: string;
  value?: string;
  label?: string;
}

// 响应式数据
const loading = ref(false);
const serverTable = ref<any>(null);
const serverTypes = ref<Array<string | ServerType>>([]);
const statistics = ref<SystemServerStatistics>({
  total: 0,
  running: 0,
  stopped: 0,
  error: 0,
});
const actionLoading = ref<Record<number, boolean>>({});

/**
 * 获取运行中服务器占比
 */
const getRunningRate = () => {
  if (statistics.value.total === 0) return 0;
  return Math.round((statistics.value.running / statistics.value.total) * 100);
};

/**
 * 获取服务器类型的值
 * 兼容字符串和对象格式
 */
const getTypeValue = (type: string | ServerType): string => {
  if (typeof type === "string") {
    return type;
  }
  return type.value || type.name || "";
};

/**
 * 获取服务器类型的标签
 * 兼容字符串和对象格式
 */
const getTypeLabel = (type: string | ServerType): string => {
  if (typeof type === "string") {
    return type;
  }
  return type.label || type.name || type.value || "";
};

// 表格列配置
const columns = [
  {
    label: "服务器名称",
    prop: "systemServerName",
  },
  {
    label: "服务器类型",
    prop: "systemServerType",
  },
  {
    label: "运行状态",
    prop: "systemServerStatus",
  },
];

// 处理分页变化
const handlePaginationChange = (pagination: any) => {
  queryParams.current = pagination.currentPage;
  queryParams.size = pagination.pageSize;
};

// 查询参数
const queryParams = reactive({
  current: 1,
  size: 20,
  serverName: "",
  serverType: "",
  status: "",
});

// 对话框状态
const showAddDialog = ref(false);
const showCloneDialog = ref(false);
const showConfigDialog = ref(false);
const showLogDialog = ref(false);
const currentServer = ref<SystemServer | null>(null);
const currentServerId = ref<number | null>(null);

// 获取服务器状态样式类
const getServerCardClass = (status: string) => {
  switch (status) {
    case "RUNNING":
      return "server-running";
    case "STOPPED":
      return "server-stopped";
    case "STARTING":
    case "STOPPING":
      return "server-transitioning";
    case "ERROR":
      return "server-error";
    default:
      return "";
  }
};

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case "RUNNING":
      return "success";
    case "STOPPED":
      return "info";
    case "STARTING":
    case "STOPPING":
      return "warning";
    case "ERROR":
      return "danger";
    default:
      return "info";
  }
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case "RUNNING":
      return "运行中";
    case "STOPPED":
      return "已停止";
    case "STARTING":
      return "启动中";
    case "STOPPING":
      return "停止中";
    case "ERROR":
      return "异常";
    default:
      return "未知";
  }
};

// 打开服务
const handleOpen = async (server) => {
  window.open(
    `http://${server.systemServerHost || "127.0.0.1"}:${server.systemServerPort}${server.systemServerContextPath}`
  );
};

// 加载服务器类型
const loadServerTypes = async () => {
  try {
    const response = await getAvailableServerTypes();
    const { code, data, msg } = response;
    if (code === "00000") {
      serverTypes.value = data;
    }
  } catch (error) {
    console.error("加载服务器类型失败:", error);
  }
};

// 加载统计信息
const loadStatistics = async () => {
  try {
    const response = await getSystemServerStatistics();
    const { code, data, msg } = response;
    if (code === "00000") {
      statistics.value = data;
    }
  } catch (error) {
    console.error("加载统计信息失败:", error);
  }
};

// 查询
const handleQuery = () => {
  queryParams.current = 1;
  serverTable.value?.reload(queryParams);
};

// 重置查询
const resetQuery = () => {
  queryParams.serverName = "";
  queryParams.serverType = "";
  queryParams.status = "";
  handleQuery();
};

// 刷新数据
const refreshData = () => {
  loadStatistics();
  serverTable.value?.reload(); // 调用 ScTable 的重新加载数据方法
};

// 启动服务器
const startServer = async (serverId: number) => {
  actionLoading.value[serverId] = true;
  try {
    const response = await startSystemServer(serverId);
    const { code, data, msg } = response;
    if (code === "00000") {
      ElMessage.success("服务器启动成功");
      refreshData();
    } else {
      ElMessage.error(msg || "启动失败");
    }
  } catch (error) {
    console.error("启动服务器失败:", error);
    ElMessage.error("启动失败");
  } finally {
    actionLoading.value[serverId] = false;
  }
};

// 停止服务器
const stopServer = async (serverId: number) => {
  actionLoading.value[serverId] = true;
  try {
    const response = await stopSystemServer(serverId);
    const { code, data, msg } = response;
    if (code === "00000") {
      ElMessage.success("服务器停止成功");
      refreshData();
    } else {
      ElMessage.error(msg || "停止失败");
    }
  } catch (error) {
    console.error("停止服务器失败:", error);
    ElMessage.error("停止失败");
  } finally {
    actionLoading.value[serverId] = false;
  }
};

// 重启服务器
const restartServer = async (serverId: number) => {
  actionLoading.value[serverId] = true;
  try {
    const response = await restartSystemServer(serverId);
    if (response.code === "00000") {
      ElMessage.success("服务器重启成功");
      refreshData();
    } else {
      ElMessage.error(response.msg || "重启失败");
    }
  } catch (error) {
    console.error("重启服务器失败:", error);
    ElMessage.error("重启失败");
  } finally {
    actionLoading.value[serverId] = false;
  }
};

// 处理服务器操作
const handleServerAction = (command: any) => {
  // 处理对象形式的命令（编辑和克隆操作）
  if (typeof command === "object" && command !== null) {
    const { type, server } = command;
    switch (type) {
      case "edit":
        currentServer.value = { ...server };
        showAddDialog.value = true;
        break;
      case "clone":
        currentServer.value = { ...server };
        showCloneDialog.value = true;
        break;
    }
    return;
  }

  // 处理字符串形式的命令（重启和删除操作）
  const [action, serverIdStr] = command.split("-");
  const serverId = parseInt(serverIdStr);
  switch (action) {
    case "restart":
      restartServer(serverId);
      break;
    case "delete":
      handleDeleteServer(serverId);
      break;
  }
};

// 删除服务器
const handleDeleteServer = async (serverId: number) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这个服务器配置吗？删除后无法恢复。",
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const response = await deleteSystemServer(serverId);
    if (response.code === "00000") {
      ElMessage.success("删除成功");
      refreshData();
    } else {
      ElMessage.error(response.msg || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除服务器失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

// 打开服务器配置
const openServerConfig = (serverId: number, server: SystemServer) => {
  currentServerId.value = serverId;
  currentServer.value = server;
  showConfigDialog.value = true;
};

// 打开服务器日志
const openServerLog = (serverId: number, server: SystemServer) => {
  currentServerId.value = serverId;
  currentServer.value = server;
  showLogDialog.value = true;
};

// 表单成功回调
const handleFormSuccess = () => {
  showAddDialog.value = false;
  currentServer.value = null;
  refreshData();
};

// 克隆成功回调
const handleCloneSuccess = () => {
  showCloneDialog.value = false;
  currentServer.value = null;
  refreshData();
};

// 配置成功回调
const handleConfigSuccess = () => {
  showConfigDialog.value = false;
  currentServerId.value = null;
  currentServer.value = null;
  refreshData();
};

// 初始化
onMounted(() => {
  loadServerTypes();
  loadStatistics();
});
</script>

<style lang="scss" scoped>
.service-management-container {
  padding: 24px;
  height: 100%;
  background: var(--el-bg-color-overlay);
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .header-left {
    h2 {
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
      font-size: 24px;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: #606266;
      font-size: 14px;
    }
  }

  .header-right {
    display: flex;
    gap: 12px;
  }
}

// 统计卡片
.statistics-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
  flex-shrink: 0;

  :deep(.stat-card-item) {
    cursor: pointer;
    transition: all 0.3s ease;
    min-height: 100px;

    &:hover {
      transform: translateY(-4px);
    }
  }

  :deep(.sc-card-stats) {
    height: 100%;
  }
}

@media (max-width: 1200px) {
  .statistics-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .statistics-cards {
    grid-template-columns: 1fr;
  }
}

// 筛选卡片
.filter-card {
  margin-bottom: 24px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  .filter-content {
    padding: 8px 0;

    .el-form {
      .action-buttons {
        margin-left: 16px;
        padding-left: 16px;
        border-left: 1px solid #e4e7ed;

        .el-button {
          margin-left: 8px;
          border-radius: 8px;
          font-weight: 500;

          &:first-child {
            margin-left: 0;
          }
        }
      }
    }
  }
}

// 服务器列表
.server-list {
  flex: 1;

  .server-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.08),
      0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    position: relative;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    // 顶部状态条
    .status-bar {
      height: 4px;
      background: linear-gradient(90deg, #e5e7eb, #f1f5f9);
      transition: all 0.3s ease;
    }

    &.server-running .status-bar {
      background: linear-gradient(90deg, #10b981, #34d399);
    }

    &.server-stopped .status-bar {
      background: linear-gradient(90deg, #94a3b8, #cbd5e1);
    }

    &.server-transitioning .status-bar {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
      animation: pulse 2s infinite;
    }

    &.server-error .status-bar {
      background: linear-gradient(90deg, #ef4444, #f87171);
    }

    // 卡片主体
    .card-content {
      padding: 20px;
    }

    // 头部
    .card-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 20px;

      .server-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: #fff;
        font-size: 22px;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      .server-meta {
        flex: 1;
        min-width: 0;

        .server-name {
          margin: 0 0 4px;
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .server-type {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }
      }

      .status-tag {
        flex-shrink: 0;
        border-radius: 20px;
        padding: 4px 12px;
        font-size: 11px;
        font-weight: 600;

        .status-icon {
          margin-right: 4px;
          font-size: 12px;
        }
      }
    }

    // 统计信息区
    .server-stats {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;

      .stat-item {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        background: #f8fafc;
        border-radius: 12px;
        transition: all 0.25s ease;
        cursor: default;

        &:hover {
          background: #f1f5f9;
        }

        &.primary {
          cursor: pointer;

          &:hover {
            background: #eff6ff;

            .stat-icon {
              background: #2563eb;
            }

            .stat-value {
              color: #2563eb;
            }
          }
        }

        .stat-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #3b82f6;
          color: #fff;
          border-radius: 10px;
          font-size: 16px;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }

        .stat-info {
          display: flex;
          flex-direction: column;

          .stat-value {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            line-height: 1.2;
            transition: color 0.25s ease;
          }

          .stat-label {
            font-size: 11px;
            color: #94a3b8;
            font-weight: 500;
          }
        }
      }
    }

    // 详细信息
    .server-details {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px dashed #e5e7eb;

      .detail-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #64748b;
        background: #f8fafc;
        padding: 6px 10px;
        border-radius: 6px;

        .iconify-icon {
          font-size: 14px;
          color: #94a3b8;
        }
      }
    }

    // 操作按钮
    .card-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .action-btn {
        flex: 1;
        height: 36px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 13px;

        .iconify-icon {
          margin-right: 6px;
          font-size: 16px;
        }
      }

      .action-group {
        display: flex;
        gap: 8px;

        .el-button.is-circle {
          width: 36px;
          height: 36px;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #64748b;

          &:hover:not(:disabled) {
            border-color: #3b82f6;
            color: #3b82f6;
            background: #eff6ff;
          }

          &:disabled {
            opacity: 0.5;
          }

          .iconify-icon {
            font-size: 16px;
          }
        }
      }
    }
  }
}

// 分页
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

// 动画
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 响应式
@media (max-width: 1200px) {
  .server-list {
    .server-card {
      .server-stats {
        flex-wrap: wrap;

        .stat-item {
          min-width: calc(50% - 6px);
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .service-management-container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .statistics-cards {
    grid-template-columns: 1fr;
  }

  .filter-card {
    .filter-content {
      .el-form {
        .el-form-item {
          margin-bottom: 16px;

          &.action-buttons {
            margin-left: 0;
            padding-left: 0;
            border-left: none;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;

            .el-button {
              margin: 0;
              width: 100%;
            }
          }
        }
      }
    }
  }

  .server-list {
    .server-card {
      .card-content {
        padding: 16px;
      }

      .card-header {
        flex-wrap: wrap;

        .status-tag {
          margin-top: 8px;
          width: 100%;
          text-align: center;
          justify-content: center;
        }
      }

      .server-stats {
        flex-direction: column;

        .stat-item {
          min-width: 100%;
        }
      }

      .card-actions {
        flex-wrap: wrap;

        .action-btn {
          flex: 1 1 100%;
          margin-bottom: 8px;
        }

        .action-group {
          flex: 1 1 100%;
          justify-content: center;
        }
      }
    }
  }
}
</style>
