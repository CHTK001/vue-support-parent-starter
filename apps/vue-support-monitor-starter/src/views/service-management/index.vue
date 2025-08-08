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
    <div class="server-list" v-loading="loading">
      <div class="server-grid">
        <el-card
          v-for="server in serverList"
          :key="server.systemServerId"
          class="server-card"
          :class="getServerCardClass(server.systemServerStatus)"
        >
          <div class="server-header">
            <div class="server-title">
              <h3>{{ server.systemServerName }}</h3>
              <el-tag
                :type="getStatusTagType(server.systemServerStatus)"
                size="small"
              >
                {{ getStatusText(server.systemServerStatus) }}
              </el-tag>
            </div>
            <div class="server-actions">
              <el-dropdown @command="handleServerAction">
                <el-button type="text" size="small">
                  <IconifyIconOnline icon="ri:more-line" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      :command="`edit-${server.systemServerId}`"
                    >
                      <IconifyIconOnline icon="ri:edit-line" />
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item
                      :command="`clone-${server.systemServerId}`"
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
            <div class="info-item">
              <span class="info-label">类型:</span>
              <span class="info-value">{{ server.systemServerType }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">端口:</span>
              <span class="info-value">{{ server.systemServerPort }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">最大连接:</span>
              <span class="info-value">{{
                server.systemServerMaxConnections || "无限制"
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">超时时间:</span>
              <span class="info-value"
                >{{ server.systemServerTimeout || "默认" }}s</span
              >
            </div>
            <div class="info-item" v-if="server.systemServerDescription">
              <span class="info-label">描述:</span>
              <span class="info-value">{{
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
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && serverList.length === 0"
        description="暂无服务器数据"
      >
        <el-button type="primary" @click="showAddDialog = true"
          >新增服务器</el-button
        >
      </el-empty>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="total > 0">
      <el-pagination
        v-model:current-page="queryParams.current"
        v-model:page-size="queryParams.size"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleQuery"
        @current-change="handleQuery"
      />
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
import {
  getSystemServerPage,
  getAvailableServerTypes,
  getSystemServerStatistics,
  startSystemServer,
  stopSystemServer,
  restartSystemServer,
  deleteSystemServer,
  cloneSystemServer,
  type SystemServer,
  type SystemServerStatistics,
  type CloneServerParams,
} from "@/api/system-server";
import ServerFormDialog from "./components/ServerFormDialog.vue";
import ServerCloneDialog from "./components/ServerCloneDialog.vue";
import ServerConfigDialog from "./components/ServerConfigDialog.vue";

// 页面标题
defineOptions({
  name: "ServiceManagement",
});

// 响应式数据
const loading = ref(false);
const serverList = ref<SystemServer[]>([]);
const serverTypes = ref<string[]>([]);
const statistics = ref<SystemServerStatistics>({
  total: 0,
  running: 0,
  stopped: 0,
  error: 0,
});
const total = ref(0);
const actionLoading = ref<Record<number, boolean>>({});

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

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const response = await getSystemServerPage(queryParams);
    if (response.success) {
      serverList.value = response.data.records;
      total.value = response.data.total;
    } else {
      ElMessage.error(response.msg || "加载数据失败");
    }
  } catch (error) {
    console.error("加载数据失败:", error);
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

// 加载服务器类型
const loadServerTypes = async () => {
  try {
    const response = await getAvailableServerTypes();
    if (response.success) {
      serverTypes.value = response.data;
    }
  } catch (error) {
    console.error("加载服务器类型失败:", error);
  }
};

// 加载统计信息
const loadStatistics = async () => {
  try {
    const response = await getSystemServerStatistics();
    if (response.success) {
      statistics.value = response.data;
    }
  } catch (error) {
    console.error("加载统计信息失败:", error);
  }
};

// 查询
const handleQuery = () => {
  queryParams.current = 1;
  loadData();
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
  loadData();
  loadStatistics();
};

// 启动服务器
const startServer = async (serverId: number) => {
  actionLoading.value[serverId] = true;
  try {
    const response = await startSystemServer(serverId);
    if (response.success) {
      ElMessage.success("服务器启动成功");
      refreshData();
    } else {
      ElMessage.error(response.msg || "启动失败");
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
    if (response.success) {
      ElMessage.success("服务器停止成功");
      refreshData();
    } else {
      ElMessage.error(response.msg || "停止失败");
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
    if (response.success) {
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
const handleServerAction = (command: string) => {
  const [action, serverIdStr] = command.split("-");
  const serverId = parseInt(serverIdStr);
  const server = serverList.value.find((s) => s.systemServerId === serverId);

  switch (action) {
    case "edit":
      currentServer.value = server || null;
      showAddDialog.value = true;
      break;
    case "clone":
      currentServer.value = server || null;
      showCloneDialog.value = true;
      break;
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
    if (response.success) {
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
  loadData();
  loadServerTypes();
  loadStatistics();
});
</script>

<style lang="scss" scoped>
.service-management-container {
  padding: 24px;
  height: 100%;
  background: #f5f7fa;
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
  .server-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .server-card {
    border-radius: 16px;
    border: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    // 状态指示条
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: #e4e7ed;
    }

    &.server-running::before {
      background: linear-gradient(90deg, #67c23a, #85ce61);
    }

    &.server-stopped::before {
      background: linear-gradient(90deg, #909399, #b1b3b8);
    }

    &.server-transitioning::before {
      background: linear-gradient(90deg, #e6a23c, #f0c78a);
      animation: pulse 2s infinite;
    }

    &.server-error::before {
      background: linear-gradient(90deg, #f56c6c, #f78989);
    }

    .server-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;

      .server-title {
        flex: 1;

        h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #303133;
        }
      }

      .server-actions {
        margin-left: 12px;
      }
    }

    .server-info {
      margin-bottom: 20px;

      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f5f7fa;

        &:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: 14px;
          color: #909399;
          font-weight: 500;
        }

        .info-value {
          font-size: 14px;
          color: #303133;
          font-weight: 500;
        }
      }
    }

    .server-footer {
      .server-controls {
        display: flex;
        gap: 12px;

        .el-button {
          flex: 1;
          border-radius: 8px;
          font-weight: 500;
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

            .el-button {
              margin-bottom: 8px;
              margin-right: 8px;
            }
          }
        }
      }
    }
  }

  .server-list .server-grid {
    grid-template-columns: 1fr;
  }
}
</style>
