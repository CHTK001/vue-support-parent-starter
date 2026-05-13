<template>
  <div class="service-management-container system-container">
    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <ScCard
        layout="stats-simple"
        label="总服务器数"
        :value="statistics.total || 0"
        icon="ri:server-line"
        theme="primary"
      />
      <ScCard
        layout="stats-simple"
        label="运行中"
        :value="statistics.running || 0"
        icon="ri:play-circle-line"
        theme="success"
      />
      <ScCard
        layout="stats-simple"
        label="已停止"
        :value="statistics.stopped || 0"
        icon="ri:stop-circle-line"
        theme="warning"
      />
      <ScCard
        layout="stats-simple"
        label="异常"
        :value="statistics.error || 0"
        icon="ri:error-warning-line"
        theme="danger"
      />
    </div>

    <!-- 筛选条件 -->
    <div class="filter-wrapper">
      <div class="filter-card">
        <el-form :model="queryParams" inline class="filter-form">
          <el-form-item label="服务器名称">
            <el-input
              v-model="queryParams.serverName"
              placeholder="请输入服务器名称"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="服务器类型">
            <ScSelect
              v-model="queryParams.serverType"
              placeholder="请选择服务器类型"
              clearable
              style="width: 200px"
            >
              <ScOption
                v-for="type in serverTypes"
                :key="getTypeValue(type)"
                :label="getTypeLabel(type)"
                :value="getTypeValue(type)"
              />
            </ScSelect>
          </el-form-item>
          <el-form-item label="运行状态">
            <ScSelect
              v-model="queryParams.status"
              placeholder="请选择运行状态"
              clearable
              style="width: 200px"
            >
              <ScOption label="运行中" value="RUNNING" />
              <ScOption label="已停止" value="STOPPED" />
              <ScOption label="启动中" value="STARTING" />
              <ScOption label="停止中" value="STOPPING" />
              <ScOption label="异常" value="ERROR" />
            </ScSelect>
          </el-form-item>

          <el-form-item class="action-buttons">
            <ScButton circle type="primary" @click="handleQuery">
              <IconifyIconOnline icon="ri:search-line" />
            </ScButton>
            <ScButton circle @click="resetQuery">
              <IconifyIconOnline icon="ri:refresh-line" />
            </ScButton>
            <ScButton circle type="primary" @click="showAddDialog = true">
              <IconifyIconOnline icon="ri:add-line" />
            </ScButton>
            <ScButton type="primary" plain @click="refreshData">
              <IconifyIconOnline icon="ri:refresh-line" />
              刷新数据
            </ScButton>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 服务器列表 -->
    <div class="server-list">
      <ScTable
        ref="serverTable"
        :loading="loading"
        :url="getSystemServerPage"
        :params="queryParams"
        layout="card"
        :colSize="5"
      >
        <template #empty>
          <el-empty description="暂无服务器数据">
            <ScButton type="primary" @click="showAddDialog = true">新增服务器</ScButton>
          </el-empty>
        </template>

        <template #default="{ row: server }">
          <div
            class="server-card"
            :class="getServerCardClass(server.systemServerStatus)"
          >
            <div class="status-bar" />
            <div class="card-content">
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
                  effect="light"
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

              <div class="server-stats">
                <div class="stat-item primary" @click="handleOpen(server)">
                  <div class="stat-icon">
                    <IconifyIconOnline icon="ri:global-line" />
                  </div>
                  <div class="stat-info">
                    <span class="stat-value">{{ server.systemServerPort }}</span>
                    <span class="stat-label">端口</span>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon">
                    <IconifyIconOnline icon="ri:filter-3-line" />
                  </div>
                  <div class="stat-info">
                    <span class="stat-value">{{ server.filterCount || 0 }}</span>
                    <span class="stat-label">过滤器</span>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon">
                    <IconifyIconOnline icon="ri:link" />
                  </div>
                  <div class="stat-info">
                    <span class="stat-value">{{ server.systemServerMaxConnections || "∞" }}</span>
                    <span class="stat-label">连接数</span>
                  </div>
                </div>
              </div>

              <div class="server-details">
                <div class="detail-item">
                  <IconifyIconOnline icon="ri:folder-line" />
                  <span>{{ server.systemServerContextPath || "/" }}</span>
                </div>
                <div v-if="server.systemServerTimeout" class="detail-item">
                  <IconifyIconOnline icon="ri:time-line" />
                  <span>{{ server.systemServerTimeout }}ms</span>
                </div>
              </div>

              <div class="card-actions">
                <ScButton
                  v-if="server.systemServerStatus === 'STOPPED' || server.systemServerStatus === 'ERROR'"
                  type="success"
                  :loading="actionLoading[server.systemServerId]"
                  class="action-btn"
                  @click="startServer(server.systemServerId)"
                >
                  <IconifyIconOnline icon="ri:play-fill" />
                  启动
                </ScButton>
                <ScButton
                  v-else-if="server.systemServerStatus === 'RUNNING'"
                  type="danger"
                  :loading="actionLoading[server.systemServerId]"
                  class="action-btn"
                  @click="stopServer(server.systemServerId)"
                >
                  <IconifyIconOnline icon="ri:stop-fill" />
                  停止
                </ScButton>
                <ScButton v-else type="warning" disabled class="action-btn">
                  {{ getStatusText(server.systemServerStatus) }}
                </ScButton>

                <div class="action-group">
                  <el-tooltip content="防火墙" placement="top">
                    <ScButton circle @click="openFirewallConfig(server)">
                      <IconifyIconOnline icon="ri:shield-line" />
                    </ScButton>
                  </el-tooltip>
                  <el-tooltip content="设置" placement="top">
                    <ScButton circle @click="openServerConfig(server.systemServerId, server)">
                      <IconifyIconOnline icon="ri:settings-4-line" />
                    </ScButton>
                  </el-tooltip>
                  <el-tooltip content="日志" placement="top">
                    <ScButton circle @click="openServerLog(server.systemServerId, server)">
                      <IconifyIconOnline icon="ri:file-list-3-line" />
                    </ScButton>
                  </el-tooltip>
                  <el-dropdown trigger="click" @command="handleServerAction">
                    <ScButton circle>
                      <IconifyIconOnline icon="ri:more-2-fill" />
                    </ScButton>
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
                        <el-dropdown-item :command="`terminate-${server.systemServerId}`">
                          <IconifyIconOnline icon="ri:close-circle-line" style="color: #f59e0b" />
                          <span style="color: #f59e0b">关闭进程</span>
                        </el-dropdown-item>
                        <el-dropdown-item :command="`delete-${server.systemServerId}`" divided>
                          <IconifyIconOnline icon="ri:delete-bin-line" style="color: #ef4444" />
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

    <ServerFormDialog
      v-model:visible="showAddDialog"
      :server-data="currentServer"
      :server-types="serverTypes"
      @success="handleFormSuccess"
    />
    <ServerCloneDialog
      v-model:visible="showCloneDialog"
      :source-server="currentServer"
      @success="handleCloneSuccess"
    />
    <ServerConfigDialog
      v-model:visible="showConfigDialog"
      :server="currentServer"
      :server-id="currentServerId"
      @success="handleConfigSuccess"
    />
    <ServerLogDialog
      v-model:visible="showLogDialog"
      :server="currentServer"
      :server-id="currentServerId"
    />
    <FirewallManagementDialog
      v-model:visible="showFirewallDialog"
      :server-id="currentFirewallServerId"
      :filter-setting-id="currentFirewallSettingId"
      @success="handleFirewallSuccess"
    />
  </div>
</template>

<script setup lang="ts">
// 原脚本完全不变，直接保留
import {
  deleteSystemServer,
  getAvailableServerTypes,
  getSystemServerPage,
  getSystemServerStatistics,
  restartSystemServer,
  startSystemServer,
  stopSystemServer,
  terminateSystemServer,
  type SystemServer,
  type SystemServerStatistics,
} from "@/api/system-server";
import { getProtocolIcon } from "@/components/protocol-icons";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { onMounted, reactive, ref } from "vue";
import {
  getSystemServerSettingByServerId,
  installServletFilter,
  type SystemServerSetting,
} from "@/api/system-server-setting";
import ServerCloneDialog from "./components/ServerCloneDialog.vue";
import FirewallManagementDialog from "./components/FirewallManagementDialog.vue";
import ServerConfigDialog from "./components/ServerConfigDialog.vue";
import ServerFormDialog from "./components/ServerFormDialog.vue";
import ServerLogDialog from "./components/ServerLogDialog.vue";
import { ScButton } from "@repo/components/ScButton";
import { ScCard } from "@repo/components/ScCard";
import { ScOption } from "@repo/components/ScOption";
import { ScSelect } from "@repo/components/ScSelect";
import ScTable from "@repo/components/ScTable";

defineOptions({ name: "ServiceManagement" });

interface ServerType {
  name?: string;
  value?: string;
  label?: string;
}

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

const getRunningRate = () => {
  if (statistics.value.total === 0) return 0;
  return Math.round((statistics.value.running / statistics.value.total) * 100);
};

const getTypeValue = (type: string | ServerType): string => {
  if (typeof type === "string") return type;
  return type.value || type.name || "";
};

const getTypeLabel = (type: string | ServerType): string => {
  if (typeof type === "string") return type;
  return type.label || type.name || type.value || "";
};

const columns = [
  { label: "服务器名称", prop: "systemServerName" },
  { label: "服务器类型", prop: "systemServerType" },
  { label: "运行状态", prop: "systemServerStatus" },
];

const handlePaginationChange = (pagination: any) => {
  queryParams.current = pagination.currentPage;
  queryParams.size = pagination.pageSize;
};

const queryParams = reactive({
  current: 1,
  size: 20,
  serverName: "",
  serverType: "",
  status: "",
});

const showAddDialog = ref(false);
const showCloneDialog = ref(false);
const showConfigDialog = ref(false);
const showLogDialog = ref(false);
const showFirewallDialog = ref(false);
const currentServer = ref<SystemServer | null>(null);
const currentServerId = ref<number | null>(null);
const currentFirewallServerId = ref<number>(0);
const currentFirewallSettingId = ref<number>(0);

const getServerCardClass = (status: string) => {
  switch (status) {
    case "RUNNING": return "server-running";
    case "STOPPED": return "server-stopped";
    case "STARTING": case "STOPPING": return "server-transitioning";
    case "ERROR": return "server-error";
    default: return "";
  }
};

const getStatusTagType = (status: string) => {
  switch (status) {
    case "RUNNING": return "success";
    case "STOPPED": return "info";
    case "STARTING": case "STOPPING": return "warning";
    case "ERROR": return "danger";
    default: return "info";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "RUNNING": return "运行中";
    case "STOPPED": return "已停止";
    case "STARTING": return "启动中";
    case "STOPPING": return "停止中";
    case "ERROR": return "异常";
    default: return "未知";
  }
};

const handleOpen = async (server) => {
  const host = server.systemServerHost === "0.0.0.0" ? "localhost" : server.systemServerHost || "localhost";
  window.open(`http://${host}:${server.systemServerPort}${server.systemServerContextPath || ""}`);
};

const loadServerTypes = async () => {
  try {
    const res = await getAvailableServerTypes();
    if (res.code === "00000") serverTypes.value = res.data;
  } catch (e) { console.error(e); }
};

const loadStatistics = async () => {
  try {
    const res = await getSystemServerStatistics();
    if (res.code === "00000") statistics.value = res.data;
  } catch (e) { console.error(e); }
};

const handleQuery = () => {
  queryParams.current = 1;
  serverTable.value?.reload(queryParams);
};

const resetQuery = () => {
  queryParams.serverName = "";
  queryParams.serverType = "";
  queryParams.status = "";
  handleQuery();
};

const refreshData = () => {
  loadStatistics();
  serverTable.value?.reload();
};

const startServer = async (serverId: number) => {
  actionLoading.value[serverId] = true;
  try {
    const res = await startSystemServer(serverId);
    if (res.code === "00000") message("启动成功", { type: "success" });
    else message(res.msg || "启动失败", { type: "error" });
    refreshData();
  } catch (e) { message("启动失败", { type: "error" });
  } finally { actionLoading.value[serverId] = false; }
};

const stopServer = async (serverId: number) => {
  actionLoading.value[serverId] = true;
  try {
    const res = await stopSystemServer(serverId);
    if (res.code === "00000") message("停止成功", { type: "success" });
    else message(res.msg || "停止失败", { type: "error" });
    refreshData();
  } catch (e) { message("停止失败", { type: "error" });
  } finally { actionLoading.value[serverId] = false; }
};

const restartServer = async (serverId: number) => {
  actionLoading.value[serverId] = true;
  try {
    const res = await restartSystemServer(serverId);
    if (res.code === "00000") message("重启成功", { type: "success" });
    else message(res.msg || "重启失败", { type: "error" });
    refreshData();
  } catch (e) { message("重启失败", { type: "error" });
  } finally { actionLoading.value[serverId] = false; }
};

const terminateServer = async (serverId: number) => {
  actionLoading.value[serverId] = true;
  try {
    await ElMessageBox.confirm(
      "关闭进程会按端口查找对应进程并终止；如果端口属于当前协议管理进程，会自动回退为停止当前服务实例。是否继续？",
      "确认关闭进程",
      { type: "warning" },
    );
    const res = await terminateSystemServer(serverId, true);
    if (res.code === "00000") message(res.data?.message || "关闭进程成功", { type: "success" });
    else message(res.msg || res.data?.message || "关闭进程失败", { type: "error" });
    refreshData();
  } catch (e) {
    if (e !== "cancel") message("关闭进程失败", { type: "error" });
  } finally { actionLoading.value[serverId] = false; }
};

const handleServerAction = (command: any) => {
  if (typeof command === "object" && command) {
    const { type, server } = command;
    if (type === "edit") { currentServer.value = { ...server }; showAddDialog.value = true; }
    if (type === "clone") { currentServer.value = { ...server }; showCloneDialog.value = true; }
    return;
  }
  const [action, id] = command.split("-");
  const serverId = parseInt(id);
  if (action === "restart") restartServer(serverId);
  if (action === "terminate") terminateServer(serverId);
  if (action === "delete") handleDeleteServer(serverId);
};

const handleDeleteServer = async (serverId: number) => {
  try {
    await ElMessageBox.confirm("确定删除？删除后无法恢复", "确认删除", { type: "warning" });
    const res = await deleteSystemServer(serverId);
    if (res.code === "00000") message("删除成功", { type: "success" });
    else message(res.msg || "删除失败", { type: "error" });
    refreshData();
  } catch (e) { if (e !== "cancel") message("删除失败", { type: "error" }); }
};

const openServerConfig = (id: number, server: SystemServer) => {
  currentServerId.value = id;
  currentServer.value = server;
  showConfigDialog.value = true;
};

const openServerLog = (id: number, server: SystemServer) => {
  currentServerId.value = id;
  currentServer.value = server;
  showLogDialog.value = true;
};

const resolveFirewallSetting = (settings: SystemServerSetting[]) => {
  return settings.find(i => (i.systemServerSettingType || "").toUpperCase().includes("FIREWALL"));
};

const openFirewallConfig = async (server: SystemServer) => {
  const serverId = Number(server?.systemServerId);
  if (!serverId) return message("无效服务器", { type: "error" });
  try {
    let res = await getSystemServerSettingByServerId(serverId);
    let settings = res.data?.records || res.data || [];
    let fw = resolveFirewallSetting(settings);
    if (!fw) {
      await installServletFilter(serverId, "firewall");
      res = await getSystemServerSettingByServerId(serverId);
      settings = res.data?.records || res.data || [];
      fw = resolveFirewallSetting(settings);
    }
    if (!fw?.systemServerSettingId) return message("未找到防火墙配置", { type: "error" });
    currentFirewallServerId.value = serverId;
    currentFirewallSettingId.value = Number(fw.systemServerSettingId);
    showFirewallDialog.value = true;
  } catch (e) { message("打开防火墙失败", { type: "error" }); }
};

const handleFormSuccess = () => { showAddDialog.value = false; currentServer.value = null; refreshData(); };
const handleCloneSuccess = () => { showCloneDialog.value = false; currentServer.value = null; refreshData(); };
const handleConfigSuccess = () => { showConfigDialog.value = false; currentServerId.value = null; currentServer.value = null; refreshData(); };
const handleFirewallSuccess = () => { showFirewallDialog.value = false; currentFirewallServerId.value = 0; currentFirewallSettingId.value = 0; refreshData(); };

onMounted(() => { loadServerTypes(); loadStatistics(); });
</script>

<style lang="scss" scoped>
.service-management-container {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #f5f7fa;
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  flex-shrink: 0;

  :deep(.sc-card) {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: transform 0.25s ease, box-shadow 0.25s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }
  }
}

.filter-wrapper {
  width: 100%;
}

.filter-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .filter-form {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-left: auto;
  }
}

.server-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.server-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.25s ease;
  position: relative;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }

  .status-bar {
    height: 3px;
    background: #e5e7eb;
  }

  &.server-running .status-bar {
    background: linear-gradient(90deg, #00b42a, #00d772);
  }

  &.server-stopped .status-bar {
    background: #909399;
  }

  &.server-transitioning .status-bar {
    background: #ff7d00;
    animation: pulse 1.5s infinite ease-in-out;
  }

  &.server-error .status-bar {
    background: #f53f3f;
  }

  .card-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .server-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #409eff;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .server-meta {
      flex: 1;
      min-width: 0;

      .server-name {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .server-type {
        font-size: 12px;
        color: #909399;
      }
    }

    .status-tag {
      border-radius: 20px;
      padding: 2px 10px;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  }

  .server-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px;
      background: #fafafa;
      border-radius: 8px;
      cursor: default;

      &.primary {
        cursor: pointer;

        &:hover {
          background: #ecf5ff;
        }
      }

      .stat-icon {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: #409eff;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 6px;
      }

      .stat-value {
        font-size: 16px;
        font-weight: 700;
        color: #303133;
      }

      .stat-label {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .server-details {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .detail-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #606266;
      background: #f5f7fa;
      padding: 4px 10px;
      border-radius: 6px;
    }
  }

  .card-actions {
    display: flex;
    align-items: center;
    gap: 10px;

    .action-btn {
      flex: 1;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .action-group {
      display: flex;
      gap: 6px;
    }
  }
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

@media (max-width: 1200px) {
  .statistics-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .service-management-container {
    padding: 16px;
  }

  .statistics-cards {
    grid-template-columns: 1fr;
  }

  .filter-card {
    .filter-form {
      flex-direction: column;
      align-items: stretch;
    }

    .action-buttons {
      margin-left: 0;
      justify-content: center;
    }
  }

  .server-card {
    .server-stats {
      grid-template-columns: 1fr;
    }

    .card-actions {
      flex-direction: column;
      align-items: stretch;
    }
  }
}
</style>
