<template>
  <div class="service-management-container">
    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon total">
            <IconifyIconOnline icon="ri:server-line" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.total || 0 }}</div>
            <div class="stat-label">总服务器数</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon running">
            <IconifyIconOnline icon="ri:play-circle-line" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.running || 0 }}</div>
            <div class="stat-label">运行中</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon stopped">
            <IconifyIconOnline icon="ri:stop-circle-line" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.stopped || 0 }}</div>
            <div class="stat-label">已停止</div>
          </div>
        </div>
      </el-card>
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
            <el-button type="primary" @click="showAddDialog = true">
              新增服务器
            </el-button>
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
                <span class="info-value">{{ server.systemServerPort }}</span>
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
                  v-if="server.systemServerStatus === 'STOPPED'"
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
                  @click="openServerConfig(server.systemServerId)"
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
      :server-id="currentServerId"
      @success="handleConfigSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { IResponse } from "@/interface/request";
import {
  getAvailableServerTypes,
  getSystemServerPage,
  getSystemServerStatistics,
  startSystemServer,
  stopSystemServer,
  restartSystemServer,
  deleteSystemServer,
  type SystemServer,
  type SystemServerStatistics,
} from "@/api/system-server";
import ServerFormDialog from "./components/ServerFormDialog.vue";
import ServerCloneDialog from "./components/ServerCloneDialog.vue";
import ServerConfigDialog from "./components/ServerConfigDialog.vue";
import { getProtocolIcon } from "@/components/protocol-icons";

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
const openServerConfig = (serverId: number) => {
  currentServerId.value = serverId;
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
  background: #f5f7fa;
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
      color: #303133;
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;

  .stat-card {
    border-radius: 12px;
    border: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: white;

        &.total {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.running {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        &.stopped {
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        }
      }

      .stat-info {
        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: #303133;
          line-height: 1;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 4px;
        }
      }
    }
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
  .server-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }

  .server-card {
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    background: #ffffff;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    padding: 10px;
    &:hover {
      transform: translateY(-2px);
      box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    &.server-running {
      border-left: 3px solid #67c23a;
    }

    &.server-stopped {
      border-left: 3px solid #909399;
    }

    &.server-transitioning {
      border-left: 3px solid #e6a23c;
      animation: pulse 2s infinite;
    }

    &.server-error {
      border-left: 3px solid #f56c6c;
    }

    .server-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);

      .server-title {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;

        .server-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #f1f5f9;
          color: #64748b;
          transition: all 0.2s ease;

          &:hover {
            background: #e2e8f0;
            color: #475569;
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
            font-size: 16px;
            font-weight: 600;
            color: #2c3e50;
            letter-spacing: -0.3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .el-tag {
            margin-top: 4px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 4px 8px;
            border-radius: 6px;
          }
        }
      }

      .server-actions {
        margin-left: 16px;
        opacity: 0;
        transition: opacity 0.3s ease;

        .el-button {
          padding: 8px;
          border-radius: 8px;

          &:hover {
            background: rgba(0, 0, 0, 0.05);
          }
        }
      }
    }

    &:hover {
      .server-actions {
        opacity: 1;
      }
    }

    .server-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 12px;

      .info-item {
        padding: 6px;
        background: #f8fafc;
        border-radius: 4px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: help;

        &:hover {
          background: #f1f5f9;
        }

        .iconify-icon {
          font-size: 16px;
          color: #64748b;
          flex-shrink: 0;
        }

        .info-value {
          font-size: 12px;
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
        gap: 16px;

        .el-button {
          flex: 1;
          border-radius: 4px;
          font-weight: 500;
          height: 28px;
          font-size: 12px;
          padding: 0 12px;
          transition: all 0.3s ease;

          &.el-button--success {
            background: #10b981;
            border: none;
            color: white;

            &:hover {
              background: #059669;
            }
          }

          &.el-button--danger {
            background: #ef4444;
            border: none;
            color: white;

            &:hover {
              background: #dc2626;
            }
          }

          &.el-button--warning {
            background: #f59e0b;
            border: none;
            color: white;

            &:hover {
              background: #d97706;
            }
          }

          &.el-button--primary {
            background: #3b82f6;
            border: none;
            color: white;

            &:hover {
              background: #2563eb;
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
</style>
