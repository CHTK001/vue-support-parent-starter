<template>
  <div class="server-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">
          <IconifyIconOnline icon="ri:server-line" class="mr-2" />
          服务器管理
          <el-tag type="info" effect="plain" class="server-count">
            共 <span class="count-num">{{ totalCount }}</span> 台
          </el-tag>
          <el-tag
            :type="wsConnected ? 'success' : 'danger'"
            effect="light"
            size="small"
            class="ml-2"
          >
            {{ wsConnected ? '已连接' : '未连接' }}
          </el-tag>
        </h2>
      </div>

      <div class="toolbar-right">
        <!-- 视图切换 -->
        <el-radio-group v-model="viewMode" size="small" class="view-toggle">
          <el-radio-button label="card">卡片视图</el-radio-button>
          <el-radio-button label="list">列表视图</el-radio-button>
          <el-radio-button label="topology">拓扑视图</el-radio-button>
        </el-radio-group>

        <!-- 筛选器 -->
        <el-select v-model="filterGroup" placeholder="分组" clearable size="small" class="filter-select">
          <el-option label="全部" value="" />
          <el-option v-for="group in serverGroups" :key="group" :label="group" :value="group" />
        </el-select>

        <el-select v-model="filterProtocol" placeholder="协议" clearable size="small" class="filter-select">
          <el-option label="SSH" value="SSH" />
          <el-option label="RDP" value="RDP" />
          <el-option label="VNC" value="VNC" />
        </el-select>

        <el-select v-model="filterStatus" placeholder="状态" clearable size="small" class="filter-select">
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
          <el-option label="异常" value="error" />
        </el-select>

        <!-- 搜索 -->
        <el-input
          v-model="searchKeyword"
          placeholder="搜索服务器..."
          size="small"
          class="search-input"
          clearable
        >
          <template #prefix>
            <IconifyIconOnline icon="ep:search" />
          </template>
        </el-input>

        <!-- 操作按钮 -->
        <el-button type="primary" size="small" @click="showAddDialog">
          <IconifyIconOnline icon="ep:plus" class="mr-1" />
          新增
        </el-button>

        <el-dropdown @command="handleToolbarAction">
          <el-button size="small">
            更多
            <IconifyIconOnline icon="ep:arrow-down" class="ml-1" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="import">导入配置</el-dropdown-item>
              <el-dropdown-item command="export">导出配置</el-dropdown-item>
              <el-dropdown-item command="batch">批量操作</el-dropdown-item>
              <el-dropdown-item command="script">脚本执行</el-dropdown-item>
              <el-dropdown-item command="alert">告警配置</el-dropdown-item>
              <el-dropdown-item command="log">操作日志</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    </div>

    <!-- 主体内容区域 -->
    <div class="main-content">
      <!-- 左侧服务器列表 -->
      <div class="left-panel" :style="{ width: leftPanelWidth + 'px' }">
        <!-- 服务器分组标签 -->
        <div class="group-tabs" v-if="serverGroups.length > 0">
          <el-tabs v-model="activeGroup" @tab-click="handleGroupChange">
            <el-tab-pane label="全部" name="all" />
            <el-tab-pane
              v-for="group in serverGroups"
              :key="group"
              :label="group"
              :name="group"
            />
          </el-tabs>
        </div>

        <!-- 服务器卡片列表 -->
        <div class="server-list" v-loading="loading">
          <div
            v-for="server in filteredServers"
            :key="server.id"
            class="server-card"
            :class="{
              'selected': selectedServerId === server.id,
              'online': server.onlineStatus === 1,
              'offline': server.onlineStatus === 0,
              'error': server.status === 3
            }"
            @click="selectServer(server)"
          >
            <!-- 服务器卡片头部 -->
            <div class="card-header">
              <div class="server-info">
                <div class="server-name">{{ server.name }}</div>
                <div class="server-address">{{ server.host }}:{{ server.port }}</div>
              </div>
              <div class="server-status">
                <el-tag
                  :type="getOnlineStatusType(server.onlineStatus)"
                  size="small"
                  effect="light"
                >
                  {{ getOnlineStatusText(server.onlineStatus) }}
                </el-tag>
                <IconifyIconOnline
                  :icon="getProtocolIcon(server.protocol)"
                  class="protocol-icon"
                />
              </div>
            </div>

            <!-- 实时指标显示 -->
            <div v-if="server.metricsSupport && getServerMetrics(server.id)" class="metrics-display">
              <div class="metric-item">
                <span class="metric-label">CPU</span>
                <el-progress
                  :percentage="Math.round(getServerMetrics(server.id)?.cpuUsage || 0)"
                  :color="getProgressColor(getServerMetrics(server.id)?.cpuUsage || 0)"
                  :show-text="false"
                  :stroke-width="4"
                />
                <span class="metric-value">{{ Math.round(getServerMetrics(server.id)?.cpuUsage || 0) }}%</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">内存</span>
                <el-progress
                  :percentage="Math.round(getServerMetrics(server.id)?.memoryUsage || 0)"
                  :color="getProgressColor(getServerMetrics(server.id)?.memoryUsage || 0)"
                  :show-text="false"
                  :stroke-width="4"
                />
                <span class="metric-value">{{ Math.round(getServerMetrics(server.id)?.memoryUsage || 0) }}%</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">磁盘</span>
                <el-progress
                  :percentage="Math.round(getServerMetrics(server.id)?.diskUsage || 0)"
                  :color="getProgressColor(getServerMetrics(server.id)?.diskUsage || 0)"
                  :show-text="false"
                  :stroke-width="4"
                />
                <span class="metric-value">{{ Math.round(getServerMetrics(server.id)?.diskUsage || 0) }}%</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="card-actions">
              <el-button-group>
                <el-button size="small" type="primary" @click.stop="connectServer(server)">
                  <IconifyIconOnline icon="ri:play-line" />
                </el-button>
                <el-button size="small" @click.stop="showServerInfo(server)">
                  <IconifyIconOnline icon="ri:information-line" />
                </el-button>
                <el-button size="small" @click.stop="editServer(server)">
                  <IconifyIconOnline icon="ri:edit-line" />
                </el-button>
                <el-dropdown @command="(cmd) => handleServerAction(cmd, server)" @click.stop>
                  <el-button size="small">
                    <IconifyIconOnline icon="ri:more-line" />
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="test">测试连接</el-dropdown-item>
                      <el-dropdown-item command="files">文件管理</el-dropdown-item>
                      <el-dropdown-item command="monitor">性能监控</el-dropdown-item>
                      <el-dropdown-item command="script">执行脚本</el-dropdown-item>
                      <el-dropdown-item command="log">操作日志</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </el-button-group>
            </div>
          </div>

          <!-- 空状态 -->
          <el-empty v-if="filteredServers.length === 0" description="暂无服务器" />
        </div>
      </div>

      <!-- 拖拽分割线 -->
      <div
        class="resize-handle"
        @mousedown="startResize"
      ></div>

      <!-- 右侧内容区域 -->
      <div class="right-panel">
        <div v-if="!selectedServerId" class="welcome-panel">
          <el-empty description="请选择一个服务器">
            <el-button type="primary" @click="showAddDialog">新增服务器</el-button>
          </el-empty>
        </div>

        <!-- 动态组件区域 -->
        <component
          v-else
          :is="currentComponent"
          :server="selectedServer"
          :key="selectedServerId + '-' + currentComponent"
          @close="closeRightPanel"
        />
      </div>
    </div>

    <!-- 对话框组件 -->
    <ServerEditDialog ref="editDialogRef" @success="handleSuccess" />
    <BatchOperationDialog ref="batchDialogRef" @success="handleSuccess" />
    <ScriptExecutorDialog ref="scriptDialogRef" />
    <AlertConfigDialog ref="alertDialogRef" />
    <OperationLogDialog ref="logDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, defineAsyncComponent } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { getWebSocketUrl } from "@/api/config";
import {
  getServerPageList,
  deleteServer,
  testServerConnection,
  connectServer as connectServerApi,
  disconnectServer,
  getServerStatistics,
  batchOperateServers,
  exportServerConfig,
  importServerConfig,
  collectServerMetrics,
  statusMap,
  connectionStatusMap,
  onlineStatusMap,
  protocolIconMap,
  PROTOCOL_TYPES,
  SERVER_STATUS,
  ONLINE_STATUS,
  WS_MESSAGE_TYPE,
  type ServerRealtimeData,
  type ServerMetrics,
  type WebSocketMessage,
} from "@/api/monitor/gen/server";

// 异步组件
const ServerEditDialog = defineAsyncComponent(() => import("./components/ServerEditDialog.vue"));
const BatchOperationDialog = defineAsyncComponent(() => import("./components/BatchOperationDialog.vue"));
const ScriptExecutorDialog = defineAsyncComponent(() => import("./components/ScriptExecutorDialog.vue"));
const AlertConfigDialog = defineAsyncComponent(() => import("./components/AlertConfigDialog.vue"));
const OperationLogDialog = defineAsyncComponent(() => import("./components/OperationLogDialog.vue"));

// 远程连接组件
const SSHTerminal = defineAsyncComponent(() => import("./components/remote/SSHTerminal.vue"));
const RDPDesktop = defineAsyncComponent(() => import("./components/remote/RDPDesktop.vue"));
const VNCDesktop = defineAsyncComponent(() => import("./components/remote/VNCDesktop.vue"));
const ServerMonitor = defineAsyncComponent(() => import("./components/ServerMonitor.vue"));
const FileManager = defineAsyncComponent(() => import("./components/FileManager.vue"));

// 响应式状态
const loading = ref(false);
const totalCount = ref(0);
const viewMode = ref("card");

// 筛选和搜索
const searchKeyword = ref("");
const filterGroup = ref("");
const filterProtocol = ref("");
const filterStatus = ref("");
const activeGroup = ref("all");

// 左右面板
const leftPanelWidth = ref(400);
const selectedServerId = ref("");
const currentComponent = ref("");

// 服务器数据
const servers = ref<any[]>([]);
const serverGroups = ref<string[]>([]);
const selectedServer = computed(() =>
  servers.value.find(s => s.id === selectedServerId.value)
);

// WebSocket相关状态
const websocket = ref<WebSocket | null>(null);
const wsConnected = ref(false);
const serverMetrics = ref<Map<string, any>>(new Map());

// 对话框引用
const editDialogRef = ref();
const batchDialogRef = ref();
const scriptDialogRef = ref();
const alertDialogRef = ref();
const logDialogRef = ref();



// 计算属性
const filteredServers = computed(() => {
  let result = servers.value;

  // 按分组筛选
  if (activeGroup.value !== "all") {
    result = result.filter(server =>
      server.group === activeGroup.value
    );
  }

  // 按协议筛选
  if (filterProtocol.value) {
    result = result.filter(server =>
      server.protocol === filterProtocol.value
    );
  }

  // 按状态筛选
  if (filterStatus.value) {
    result = result.filter(server => {
      switch (filterStatus.value) {
        case "online":
          return server.onlineStatus === 1;
        case "offline":
          return server.onlineStatus === 0;
        case "error":
          return server.status === 3;
        default:
          return true;
      }
    });
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(server =>
      server.name.toLowerCase().includes(keyword) ||
      server.host.toLowerCase().includes(keyword) ||
      (server.description && server.description.toLowerCase().includes(keyword))
    );
  }

  return result;
});

/**
 * 获取在线状态类型
 */
const getOnlineStatusType = (status: number) => {
  return onlineStatusMap[status]?.color || "info";
};

/**
 * 获取在线状态文本
 */
const getOnlineStatusText = (status: number) => {
  return onlineStatusMap[status]?.text || "未知状态";
};

/**
 * 获取协议图标
 */
const getProtocolIcon = (protocol: string) => {
  return protocolIconMap[protocol as keyof typeof protocolIconMap] || "ri:server-line";
};

/**
 * 获取服务器指标数据
 */
const getServerMetrics = (serverId: string) => {
  return serverMetrics.value.get(serverId);
};

/**
 * 获取进度条颜色
 */
const getProgressColor = (percentage: number) => {
  if (percentage < 50) return "#67c23a";
  if (percentage < 80) return "#e6a23c";
  return "#f56c6c";
};

/**
 * 加载服务器列表
 */
const loadServers = async () => {
  try {
    loading.value = true;
    const res = await getServerPageList({
      page: 1,
      pageSize: 1000, // 加载所有服务器
    });

    if (res.code === "00000") {
      servers.value = res.data?.records || [];
      totalCount.value = res.data?.total || 0;

      // 提取分组信息
      const groups = new Set<string>();
      servers.value.forEach(server => {
        if (server.group) {
          groups.add(server.group);
        }
      });
      serverGroups.value = Array.from(groups);
    }
  } catch (error) {
    console.error("加载服务器列表失败:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 选择服务器
 */
const selectServer = (server: any) => {
  selectedServerId.value = server.id;
  currentComponent.value = "ServerMonitor"; // 默认显示监控组件
};

/**
 * 连接服务器
 */
const connectServer = (server: any) => {
  selectedServerId.value = server.id;

  // 根据协议选择对应的远程组件
  switch (server.protocol) {
    case "SSH":
      currentComponent.value = "SSHTerminal";
      break;
    case "RDP":
      currentComponent.value = "RDPDesktop";
      break;
    case "VNC":
      currentComponent.value = "VNCDesktop";
      break;
    default:
      currentComponent.value = "SSHTerminal";
  }
};

/**
 * 显示服务器信息
 */
const showServerInfo = (server: any) => {
  selectedServerId.value = server.id;
  currentComponent.value = "ServerMonitor";
};

/**
 * 编辑服务器
 */
const editServer = (server: any) => {
  editDialogRef.value?.open("edit");
  editDialogRef.value?.setData(server);
};

/**
 * 处理服务器操作
 */
const handleServerAction = async (command: string, server: any) => {
  switch (command) {
    case "test":
      await testConnection(server);
      break;
    case "files":
      selectedServerId.value = server.id;
      currentComponent.value = "FileManager";
      break;
    case "monitor":
      selectedServerId.value = server.id;
      currentComponent.value = "ServerMonitor";
      break;
    case "script":
      scriptDialogRef.value?.open(server);
      break;
    case "log":
      logDialogRef.value?.open(server);
      break;
    case "delete":
      await deleteServerConfirm(server);
      break;
  }
};

/**
 * 测试连接
 */
const testConnection = async (server: any) => {
  try {
    const res = await testServerConnection(server.id);
    if (res.code === "00000") {
      message.success("连接测试成功");
    } else {
      message.error(res.msg || "连接测试失败");
    }
  } catch (error) {
    message.error("连接测试异常");
    console.error("测试连接失败:", error);
  }
};

/**
 * 删除服务器确认
 */
const deleteServerConfirm = async (server: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除服务器 "${server.name}" 吗？`,
      "删除确认",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      }
    );

    const res = await deleteServer(server.id);
    if (res.code === "00000") {
      message.success("删除成功");
      await loadServers();
      if (selectedServerId.value === server.id) {
        selectedServerId.value = "";
        currentComponent.value = "";
      }
    } else {
      message.error(res.msg || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      message.error("删除异常");
      console.error("删除服务器失败:", error);
    }
  }
};

/**
 * 显示新增对话框
 */
const showAddDialog = () => {
  editDialogRef.value?.open("add");
  editDialogRef.value?.setData({});
};

/**
 * 处理工具栏操作
 */
const handleToolbarAction = (command: string) => {
  switch (command) {
    case "import":
      // TODO: 实现导入功能
      break;
    case "export":
      // TODO: 实现导出功能
      break;
    case "batch":
      batchDialogRef.value?.open();
      break;
    case "script":
      scriptDialogRef.value?.open();
      break;
    case "alert":
      alertDialogRef.value?.open();
      break;
    case "log":
      logDialogRef.value?.open();
      break;
  }
};

/**
 * 处理分组变化
 */
const handleGroupChange = () => {
  // 分组变化时的处理逻辑
};

/**
 * 关闭右侧面板
 */
const closeRightPanel = () => {
  selectedServerId.value = "";
  currentComponent.value = "";
};

/**
 * 开始拖拽调整大小
 */
const startResize = (e: MouseEvent) => {
  const startX = e.clientX;
  const startWidth = leftPanelWidth.value;

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startX;
    const newWidth = startWidth + deltaX;

    // 限制最小和最大宽度
    if (newWidth >= 300 && newWidth <= 800) {
      leftPanelWidth.value = newWidth;
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

/**
 * 处理保存成功后的回调
 */
const handleSuccess = () => {
  loadServers();
};









/**
 * 初始化WebSocket连接
 */
const initWebSocket = () => {
  try {
    const wsUrl = getWebSocketUrl("/gen/server", "");
    websocket.value = new WebSocket(wsUrl);

    websocket.value.onopen = () => {
      wsConnected.value = true;
      console.log("服务器管理WebSocket连接成功");
    };

    websocket.value.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error("解析WebSocket消息失败:", error);
      }
    };

    websocket.value.onclose = () => {
      wsConnected.value = false;
      console.log("服务器管理WebSocket连接关闭");
      // 5秒后重连
      setTimeout(() => {
        if (!wsConnected.value) {
          initWebSocket();
        }
      }, 5000);
    };

    websocket.value.onerror = (error) => {
      console.error("服务器管理WebSocket连接错误:", error);
      wsConnected.value = false;
    };
  } catch (error) {
    console.error("初始化WebSocket失败:", error);
  }
};

/**
 * 处理WebSocket消息
 */
const handleWebSocketMessage = (message: WebSocketMessage) => {
  switch (message.type) {
    case WS_MESSAGE_TYPE.SERVER_STATUS:
      handleServerStatusUpdate(message.data);
      break;
    case WS_MESSAGE_TYPE.SERVER_METRICS:
      handleServerMetricsUpdate(message.data);
      break;
    case WS_MESSAGE_TYPE.SERVER_ONLINE:
      handleServerOnlineUpdate(message.data);
      break;
    case WS_MESSAGE_TYPE.SERVER_OFFLINE:
      handleServerOfflineUpdate(message.data);
      break;
    case WS_MESSAGE_TYPE.SERVER_UPDATE:
      handleServerDataUpdate(message.data);
      break;
    case WS_MESSAGE_TYPE.SERVER_DELETE:
      handleServerDelete(message.data);
      break;
    case WS_MESSAGE_TYPE.SERVER_ADD:
      handleServerAdd(message.data);
      break;
    default:
      console.log("未知的WebSocket消息类型:", message.type);
  }
};

/**
 * 处理服务器状态更新
 */
const handleServerStatusUpdate = (data: ServerRealtimeData) => {
  // 更新本地服务器数据
  const index = servers.value.findIndex(s => s.id === data.id);
  if (index !== -1) {
    servers.value[index] = { ...servers.value[index], ...data };
  }
};

/**
 * 处理服务器指标更新
 */
const handleServerMetricsUpdate = (data: { serverId: string; metrics: ServerMetrics }) => {
  serverMetrics.value.set(data.serverId, data.metrics);
};

/**
 * 处理服务器上线
 */
const handleServerOnlineUpdate = (data: { serverId: string; onlineTime: string }) => {
  const index = servers.value.findIndex(s => s.id === data.serverId);
  if (index !== -1) {
    servers.value[index].onlineStatus = ONLINE_STATUS.ONLINE;
    servers.value[index].lastOnlineTime = data.onlineTime;
  }
};

/**
 * 处理服务器离线
 */
const handleServerOfflineUpdate = (data: { serverId: string; offlineTime: string }) => {
  const index = servers.value.findIndex(s => s.id === data.serverId);
  if (index !== -1) {
    servers.value[index].onlineStatus = ONLINE_STATUS.OFFLINE;
    servers.value[index].lastOfflineTime = data.offlineTime;
  }
};

/**
 * 处理服务器数据更新
 */
const handleServerDataUpdate = (data: ServerRealtimeData) => {
  const index = servers.value.findIndex(s => s.id === data.id);
  if (index !== -1) {
    servers.value[index] = { ...servers.value[index], ...data };
  } else {
    servers.value.push(data);
  }
};

/**
 * 处理服务器删除
 */
const handleServerDelete = (data: { serverId: string }) => {
  const index = servers.value.findIndex(s => s.id === data.serverId);
  if (index !== -1) {
    servers.value.splice(index, 1);
  }
  serverMetrics.value.delete(data.serverId);

  // 如果删除的是当前选中的服务器，清空选择
  if (selectedServerId.value === data.serverId) {
    selectedServerId.value = "";
    currentComponent.value = "";
  }
};

/**
 * 处理服务器添加
 */
const handleServerAdd = (data: ServerRealtimeData) => {
  servers.value.push(data);
};

/**
 * 关闭WebSocket连接
 */
const closeWebSocket = () => {
  if (websocket.value) {
    websocket.value.close();
    websocket.value = null;
    wsConnected.value = false;
  }
};

// 生命周期钩子
onMounted(() => {
  loadServers();
  initWebSocket();
});

onUnmounted(() => {
  closeWebSocket();
});
</script>

<style lang="scss" scoped>
.server-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .toolbar-left {
    .page-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      color: var(--el-text-color-primary);
      display: flex;
      align-items: center;

      .server-count {
        margin-left: 12px;
        font-size: 12px;
        padding: 4px 8px;

        .count-num {
          font-weight: bold;
          color: var(--el-color-primary);
        }
      }
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .view-toggle {
      margin-right: 8px;
    }

    .filter-select {
      width: 100px;
    }

    .search-input {
      width: 200px;
    }
  }
}

/* 主体内容区域 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧面板 */
.left-panel {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .group-tabs {
    padding: 16px 16px 0 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    :deep(.el-tabs__header) {
      margin: 0;
    }

    :deep(.el-tabs__nav-wrap) {
      padding: 0;
    }
  }

  .server-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px;

    .server-card {
      background-color: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;

      &:hover {
        border-color: var(--el-color-primary);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &.selected {
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
      }

      &.online {
        border-left: 4px solid var(--el-color-success);
      }

      &.offline {
        border-left: 4px solid var(--el-color-danger);
      }

      &.error {
        border-left: 4px solid var(--el-color-warning);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;

        .server-info {
          flex: 1;

          .server-name {
            font-size: 16px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin-bottom: 4px;
          }

          .server-address {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            font-family: monospace;
          }
        }

        .server-status {
          display: flex;
          align-items: center;
          gap: 8px;

          .protocol-icon {
            font-size: 18px;
            color: var(--el-color-primary);
          }
        }
      }

      .metrics-display {
        margin: 12px 0;
        padding: 8px;
        background-color: var(--el-fill-color-extra-light);
        border-radius: 6px;

        .metric-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          font-size: 11px;

          &:last-child {
            margin-bottom: 0;
          }

          .metric-label {
            width: 30px;
            color: var(--el-text-color-secondary);
            flex-shrink: 0;
          }

          .el-progress {
            flex: 1;
          }

          .metric-value {
            width: 35px;
            text-align: right;
            font-weight: 500;
            color: var(--el-text-color-primary);
            flex-shrink: 0;
          }
        }
      }

      .card-actions {
        margin-top: 12px;
        opacity: 0;
        transition: opacity 0.3s ease;

        .el-button-group {
          width: 100%;

          .el-button {
            flex: 1;
            font-size: 12px;
            padding: 4px 8px;
          }
        }
      }

      &:hover .card-actions {
        opacity: 1;
      }
    }
  }
}

/* 拖拽分割线 */
.resize-handle {
  width: 4px;
  background-color: var(--el-border-color-light);
  cursor: col-resize;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: var(--el-color-primary);
  }
}

/* 右侧面板 */
.right-panel {
  flex: 1;
  background-color: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .welcome-panel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--el-bg-color-page);
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .left-panel {
    width: 350px !important;
  }

  .toolbar .toolbar-right {
    .filter-select {
      width: 80px;
    }

    .search-input {
      width: 150px;
    }
  }
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }

  .left-panel {
    width: 100% !important;
    height: 300px;
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .resize-handle {
    display: none;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;

    .toolbar-right {
      justify-content: flex-start;
      flex-wrap: wrap;

      .search-input {
        width: 100%;
        max-width: 300px;
      }
    }
  }
}




</style>
