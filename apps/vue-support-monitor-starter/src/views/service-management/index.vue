<template>
  <div class="service-management-container">
    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <ScCard
          layout="stats"
          theme="primary"
          icon="ri:server-line"
          :value="statistics.total || 0"
          label="总服务器数"
          trend-icon="ri:stack-line"
          trend-text="全部服务"
        />
        <ScCard
          layout="stats"
          theme="success"
          icon="ri:play-circle-line"
          :value="statistics.running || 0"
          label="运行中"
          trend-icon="ri:checkbox-circle-line"
          trend-text="正常运行"
        />
        <ScCard
          layout="stats"
          theme="warning"
          icon="ri:stop-circle-line"
          :value="statistics.stopped || 0"
          label="已停止"
          trend-icon="ri:pause-circle-line"
          trend-text="已暂停"
        />
      </div>
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
                :key="type"
                :label="type"
                :value="type"
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
          <el-card
            class="server-card"
            :class="getServerCardClass(server.systemServerStatus)"
          >
            <div class="server-header">
              <div class="server-title">
                <div class="server-icon">
                  <component :is="getProtocolIcon(server.systemServerType)" />
                </div>
                <div class="server-title-content">
                  <h3>{{ server.systemServerName }}</h3>
                  <el-tag
                    :type="getStatusTagType(server.systemServerStatus)"
                    size="small"
                  >
                    {{ getStatusText(server.systemServerStatus) }}
                  </el-tag>
                </div>
              </div>
              <div class="server-actions">
                <el-dropdown @command="handleServerAction">
                  <el-button type="text" size="small">
                    <IconifyIconOnline icon="ri:more-line" />
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        :command="{
                          type: 'edit',
                          server: server,
                        }"
                      >
                        <IconifyIconOnline icon="ri:edit-line" />
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item
                        :command="{
                          type: 'clone',
                          server: server,
                        }"
                      >
                        <IconifyIconOnline icon="ri:file-copy-line" />
                        克隆
                      </el-dropdown-item>
                      <el-dropdown-item
                        :command="`restart-${server.systemServerId}`"
                        :disabled="server.systemServerStatus !== 'RUNNING'"
                      >
                        <IconifyIconOnline icon="ri:restart-line" />
                        重启
                      </el-dropdown-item>
                      <el-dropdown-item
                        :command="`delete-${server.systemServerId}`"
                        divided
                      >
                        <IconifyIconOnline icon="ri:delete-bin-line" />
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <div class="server-info">
              <div
                class="info-item"
                :title="'类型: ' + server.systemServerType"
              >
                <IconifyIconOnline icon="ri:equalizer-line" />
                <span class="info-value">{{ server.systemServerType }}</span>
              </div>
              <div
                class="info-item"
                :title="'端口: ' + server.systemServerPort"
              >
                <IconifyIconOnline icon="ri:door-lock-line" />
                <span class="info-value" @click="handleOpen(server)">{{
                  server.systemServerPort
                }}</span>
              </div>
              <div
                class="info-item"
                :title="
                  '最大连接数: ' +
                  (server.systemServerMaxConnections || '无限制')
                "
              >
                <IconifyIconOnline icon="ri:group-line" />
                <span class="info-value">{{
                  server.systemServerMaxConnections || "∞"
                }}</span>
              </div>
              <div
                class="info-item"
                :title="'超时时间: ' + (server.systemServerTimeout || '默认')"
              >
                <IconifyIconOnline icon="ri:time-line" />
                <span class="info-value">{{
                  server.systemServerTimeout || "-"
                }}</span>
              </div>
              <div
                class="info-item"
                :title="'上下文: ' + (server.systemServerContextPath || '无')"
              >
                <IconifyIconOnline icon="ri:parentheses-fill" />
                <span class="info-value">{{
                  server.systemServerContextPath || "无"
                }}</span>
              </div>
              <div
                class="info-item"
                v-if="server.systemServerDescription"
                :title="'描述: ' + server.systemServerDescription"
              >
                <IconifyIconOnline icon="ri:file-text-line" />
                <span class="info-value text-ellipsis">{{
                  server.systemServerDescription
                }}</span>
              </div>
            </div>

            <div class="server-footer">
              <div class="server-controls">
                <el-button
                  v-if="
                    server.systemServerStatus === 'STOPPED' ||
                    server.systemServerStatus === 'ERROR'
                  "
                  type="success"
                  size="small"
                  @click="startServer(server.systemServerId)"
                  :loading="actionLoading[server.systemServerId]"
                >
                  <IconifyIconOnline icon="ri:play-line" />
                  启动
                </el-button>
                <el-button
                  v-else-if="server.systemServerStatus === 'RUNNING'"
                  type="danger"
                  size="small"
                  @click="stopServer(server.systemServerId)"
                  :loading="actionLoading[server.systemServerId]"
                >
                  <IconifyIconOnline icon="ri:stop-line" />
                  停止
                </el-button>
                <el-button v-else type="warning" size="small" disabled>
                  {{ getStatusText(server.systemServerStatus) }}
                </el-button>

                <el-button
                  type="primary"
                  size="small"
                  @click="openServerConfig(server.systemServerId, server)"
                >
                  <IconifyIconOnline icon="ri:settings-3-line" />
                  设置
                </el-button>
              </div>
            </div>
          </el-card>
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
import ScCard from "@repo/components/ScCard/index.vue";

// 页面标题
defineOptions({
  name: "ServiceManagement",
});

// 响应式数据
const loading = ref(false);
const serverTable = ref<any>(null);
const serverTypes = ref<string[]>([]);
const statistics = ref<SystemServerStatistics>({
  total: 0,
  running: 0,
  stopped: 0,
  error: 0,
});
const actionLoading = ref<Record<number, boolean>>({});

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
  min-height: 100%;
  background: linear-gradient(
    135deg,
    rgba(248, 250, 252, 0.98) 0%,
    rgba(241, 245, 249, 0.95) 100%
  );
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

// 统计卡片区域
.stats-section {
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

// 筛选卡片
.filter-card {
  margin-bottom: 24px;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  backdrop-filter: blur(10px);

  .filter-content {
    padding: 12px 0;

    .el-form {
      .action-buttons {
        margin-left: 20px;
        padding-left: 20px;
        border-left: 2px solid rgba(102, 126, 234, 0.2);

        .el-button {
          margin-left: 10px;
          border-radius: 10px;
          font-weight: 500;
          transition: all 0.3s ease;

          &:first-child {
            margin-left: 0;
          }

          &:hover {
            transform: translateY(-2px);
          }

          &.el-button--primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

            &:hover {
              box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
            }
          }
        }
      }
    }
  }

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(226, 232, 240, 0.8);
    transition: all 0.3s ease;

    &:hover {
      border-color: #667eea;
    }

    &.is-focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
    }
  }

  :deep(.el-select .el-input__wrapper) {
    border-radius: 10px;
  }
}

// 服务器列表
.server-list {
  flex: 1;
  .server-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .server-card {
    border-radius: 18px;
    border: 1px solid rgba(226, 232, 240, 0.8);
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.98) 0%,
      rgba(248, 250, 252, 0.95) 100%
    );
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    padding: 18px;
    backdrop-filter: blur(10px);

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--card-accent, #e5e7eb);
      transition: height 0.3s ease;
    }

    &:hover {
      transform: translateY(-6px) scale(1.01);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);

      &::before {
        height: 5px;
      }
    }

    &.server-running {
      --card-accent: linear-gradient(90deg, #10b981 0%, #34d399 100%);
    }

    &.server-stopped {
      --card-accent: linear-gradient(90deg, #94a3b8 0%, #cbd5e1 100%);
    }

    &.server-transitioning {
      --card-accent: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
      animation: pulse 2s infinite;
    }

    &.server-error {
      --card-accent: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
    }

    .server-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(226, 232, 240, 0.6);

      .server-title {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 14px;

        .server-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: linear-gradient(
            135deg,
            rgba(102, 126, 234, 0.1) 0%,
            rgba(118, 75, 162, 0.08) 100%
          );
          color: #667eea;
          transition: all 0.3s ease;

          &:hover {
            background: linear-gradient(
              135deg,
              rgba(102, 126, 234, 0.15) 0%,
              rgba(118, 75, 162, 0.12) 100%
            );
            transform: scale(1.05);
          }

          .protocol-icon {
            width: 24px;
            height: 24px;
          }
        }

        .server-title-content {
          flex: 1;
          min-width: 0;

          h3 {
            margin: 0;
            font-size: 17px;
            font-weight: 600;
            color: #1e293b;
            letter-spacing: -0.3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .el-tag {
            margin-top: 6px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 11px;
          }
        }
      }

      .server-actions {
        margin-left: 16px;
        opacity: 0;
        transform: translateY(-4px);
        transition: all 0.3s ease;

        .el-button {
          padding: 8px;
          border-radius: 10px;

          &:hover {
            background: rgba(102, 126, 234, 0.1);
          }
        }
      }
    }

    &:hover {
      .server-actions {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .server-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 16px;

      .info-item {
        padding: 10px 12px;
        background: linear-gradient(
          135deg,
          rgba(248, 250, 252, 0.9) 0%,
          rgba(241, 245, 249, 0.8) 100%
        );
        border: 1px solid rgba(226, 232, 240, 0.6);
        border-radius: 10px;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: help;

        &:hover {
          background: linear-gradient(
            135deg,
            rgba(241, 245, 249, 0.95) 0%,
            rgba(226, 232, 240, 0.9) 100%
          );
          border-color: rgba(102, 126, 234, 0.3);
          transform: translateY(-2px);
        }

        .iconify-icon {
          font-size: 18px;
          color: #667eea;
          flex-shrink: 0;
        }

        .info-value {
          font-size: 13px;
          color: #334155;
          font-weight: 500;
          flex: 1;
          min-width: 0;

          &.text-ellipsis {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }

    .server-footer {
      .server-controls {
        display: flex;
        gap: 12px;

        .el-button {
          flex: 1;
          border-radius: 10px;
          font-weight: 600;
          height: 36px;
          font-size: 13px;
          padding: 0 16px;
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
          }

          &.el-button--success {
            background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
            border: none;
            color: white;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

            &:hover {
              box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
            }
          }

          &.el-button--danger {
            background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
            border: none;
            color: white;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);

            &:hover {
              box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
            }
          }

          &.el-button--warning {
            background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
            border: none;
            color: white;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);

            &:hover {
              box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
            }
          }

          &.el-button--primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            color: white;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

            &:hover {
              box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
            }
          }

          .iconify-icon {
            margin-right: 6px;
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
    .server-info {
      grid-template-columns: 1fr;
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
      padding: 1rem;

      .server-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;

        .server-title {
          flex-direction: column;
          align-items: flex-start;
        }

        .server-actions {
          opacity: 1;
          align-self: flex-end;
        }
      }

      .server-footer {
        .server-controls {
          flex-direction: column;
          gap: 8px;

          .el-button {
            width: 100%;
          }
        }
      }
    }
  }
}

/* 标签样式增强 */
:deep(.el-tag--success) {
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.15) 0%,
    rgba(52, 211, 153, 0.1) 100%
  );
  border-color: rgba(16, 185, 129, 0.3);
  color: #059669;
}

:deep(.el-tag--warning) {
  background: linear-gradient(
    135deg,
    rgba(245, 158, 11, 0.15) 0%,
    rgba(251, 191, 36, 0.1) 100%
  );
  border-color: rgba(245, 158, 11, 0.3);
  color: #d97706;
}

:deep(.el-tag--danger) {
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.15) 0%,
    rgba(248, 113, 113, 0.1) 100%
  );
  border-color: rgba(239, 68, 68, 0.3);
  color: #dc2626;
}

:deep(.el-tag--info) {
  background: linear-gradient(
    135deg,
    rgba(100, 116, 139, 0.15) 0%,
    rgba(148, 163, 184, 0.1) 100%
  );
  border-color: rgba(100, 116, 139, 0.3);
  color: #475569;
}
</style>
