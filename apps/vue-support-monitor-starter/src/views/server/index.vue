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
              'online': server.onlineStatus === 1 || server.onlineStatus === '1',
              'offline': server.onlineStatus === 0 || server.onlineStatus === '0',
              'error': server.status === 3 || server.status === '3'
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
import { message, splitToArray } from "@repo/utils";
import { socket } from "@repo/core";
import { getConfig } from "@repo/config";
import { ElMessageBox } from "element-plus";
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
const stompClient = ref<any>(null);
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
          return server.onlineStatus === 1 || server.onlineStatus === '1';
        case "offline":
          return server.onlineStatus === 0 || server.onlineStatus === '0';
        case "error":
          return server.status === 3 || server.status === '3';
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

    if (res.code == "00000") {
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
    if (res.code == "00000") {
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
    if (res.code == "00000") {
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
const initWebSocket = async () => {
  if (stompClient.value && stompClient.value.connected) {
    return;
  }

  try {
    const config = getConfig();
    stompClient.value = socket(splitToArray(config.SocketUrl), undefined, {});

    // 连接成功
    wsConnected.value = true;
    console.log("服务器管理WebSocket连接成功");

    // 订阅服务器相关主题
    subscribeToServerTopics();
  } catch (error) {
    console.error("WebSocket连接异常:", error);
    wsConnected.value = false;

    // 5秒后重连
    setTimeout(() => {
      if (!wsConnected.value) {
        initWebSocket();
      }
    }, 5000);
  }
};

/**
 * 订阅服务器相关主题
 */
const subscribeToServerTopics = () => {
  if (!stompClient.value) return;

  // 先取消之前的订阅
  unsubscribeFromServerTopics();

  // 订阅服务器主题
  const serverTopic = `/topic/gen/server`;

  stompClient.value.on(serverTopic, (message: any) => {
    try {
      const output = JSON.parse(message.data);
      handleWebSocketMessage(output);
    } catch (error) {
      console.error("解析WebSocket消息失败:", error);
    }
  });

  console.log("已订阅服务器主题:", serverTopic);
};

/**
 * 取消订阅服务器主题
 */
const unsubscribeFromServerTopics = () => {
  if (!stompClient.value) return;

  // 取消服务器主题订阅
  const serverTopic = `/topic/gen/server`;
  stompClient.value.off(serverTopic);
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
  try {
    // 先取消所有订阅
    if (stompClient.value) {
      unsubscribeFromServerTopics();

      // 断开连接并关闭
      if (stompClient.value.connected) {
        stompClient.value.disconnect();
      }

      stompClient.value.close();
      stompClient.value = null;

      console.log("服务器管理WebSocket连接已完全断开");
    }
    wsConnected.value = false;
  } catch (error) {
    console.error("断开WebSocket连接时出错:", error);
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
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--el-bg-color-page) 0%, var(--el-fill-color-extra-light) 100%);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-fill-color-extra-light) 100%);
  border-bottom: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);

  .toolbar-left {
    .page-title {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      color: var(--el-text-color-primary);
      display: flex;
      align-items: center;
      gap: 12px;

      .iconify {
        font-size: 28px;
        color: var(--el-color-primary);
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      }

      .server-count {
        margin-left: 16px;
        font-size: 13px;
        padding: 6px 12px;
        border-radius: 20px;
        background: linear-gradient(135deg, var(--el-color-primary-light-8) 0%, var(--el-color-primary-light-9) 100%);
        border: 1px solid var(--el-color-primary-light-7);
        font-weight: 500;

        .count-num {
          font-weight: 700;
          color: var(--el-color-primary);
        }
      }

      .el-tag {
        border-radius: 16px;
        font-weight: 500;
        padding: 4px 12px;
        border: none;

        &.el-tag--success {
          background: linear-gradient(135deg, var(--el-color-success-light-8) 0%, var(--el-color-success-light-9) 100%);
          color: var(--el-color-success);
        }

        &.el-tag--danger {
          background: linear-gradient(135deg, var(--el-color-danger-light-8) 0%, var(--el-color-danger-light-9) 100%);
          color: var(--el-color-danger);
        }
      }
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .view-toggle {
      margin-right: 8px;

      :deep(.el-button) {
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      }
    }

    .filter-select {
      width: 120px;

      :deep(.el-select .el-input__wrapper) {
        border-radius: 10px;
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
        }
      }
    }

    .search-input {
      width: 240px;

      :deep(.el-input__wrapper) {
        border-radius: 20px;
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
        }

        &.is-focus {
          box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
        }
      }
    }

    .el-button {
      border-radius: 10px;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      &.el-button--primary {
        background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
        border: none;

        &:hover {
          background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
        }
      }
    }
  }
}

/* 主体内容区域 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: 2px;
}

/* 左侧面板 */
.left-panel {
  background: linear-gradient(180deg, var(--el-bg-color) 0%, var(--el-fill-color-extra-light) 100%);
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);

  .group-tabs {
    padding: 20px 20px 0 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);

    :deep(.el-tabs__header) {
      margin: 0;
    }

    :deep(.el-tabs__nav-wrap) {
      padding: 0;
    }

    :deep(.el-tabs__item) {
      font-weight: 500;
      border-radius: 8px 8px 0 0;
      transition: all 0.3s ease;

      &:hover {
        color: var(--el-color-primary);
      }

      &.is-active {
        background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }

    :deep(.el-tabs__active-bar) {
      background: linear-gradient(90deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
      height: 3px;
      border-radius: 2px;
    }
  }

  .server-list {
    flex: 1;
    overflow-y: auto;
    padding: 20px;

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: var(--el-fill-color-extra-light);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color-dark);
      border-radius: 3px;

      &:hover {
        background: var(--el-color-primary-light-5);
      }
    }

    .server-card {
      background: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-fill-color-extra-light) 100%);
      border: 1px solid var(--el-border-color-light);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(10px);

      /* 添加微妙的内阴影 */
      box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);

      /* 状态指示器 */
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: var(--el-border-color-light);
        transition: all 0.3s ease;
      }

      &:hover {
        border-color: var(--el-color-primary-light-5);
        box-shadow:
          0 8px 24px rgba(0, 0, 0, 0.12),
          0 0 0 1px var(--el-color-primary-light-8),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);

        &::before {
          background: var(--el-color-primary);
          width: 6px;
        }
      }

      &.selected {
        border-color: var(--el-color-primary);
        background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);
        box-shadow:
          0 8px 24px rgba(0, 0, 0, 0.12),
          0 0 0 2px var(--el-color-primary-light-7),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);

        &::before {
          background: var(--el-color-primary);
          width: 6px;
        }
      }

      &.online::before {
        background: linear-gradient(180deg, var(--el-color-success) 0%, var(--el-color-success-dark-2) 100%);
        width: 5px;
      }

      &.offline::before {
        background: linear-gradient(180deg, var(--el-color-danger) 0%, var(--el-color-danger-dark-2) 100%);
        width: 5px;
      }

      &.error::before {
        background: linear-gradient(180deg, var(--el-color-warning) 0%, var(--el-color-warning-dark-2) 100%);
        width: 5px;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;

        .server-info {
          flex: 1;

          .server-name {
            font-size: 18px;
            font-weight: 700;
            color: var(--el-text-color-primary);
            margin-bottom: 6px;
            line-height: 1.2;
            background: linear-gradient(135deg, var(--el-text-color-primary) 0%, var(--el-color-primary) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .server-address {
            font-size: 13px;
            color: var(--el-text-color-secondary);
            font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
            background: var(--el-fill-color-light);
            padding: 4px 8px;
            border-radius: 6px;
            display: inline-block;
            font-weight: 500;
          }
        }

        .server-status {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;

          .el-tag {
            border-radius: 12px;
            font-weight: 500;
            font-size: 12px;
            border: none;

            &.el-tag--success {
              background: linear-gradient(135deg, var(--el-color-success-light-8) 0%, var(--el-color-success-light-9) 100%);
              color: var(--el-color-success);
            }

            &.el-tag--danger {
              background: linear-gradient(135deg, var(--el-color-danger-light-8) 0%, var(--el-color-danger-light-9) 100%);
              color: var(--el-color-danger);
            }

            &.el-tag--warning {
              background: linear-gradient(135deg, var(--el-color-warning-light-8) 0%, var(--el-color-warning-light-9) 100%);
              color: var(--el-color-warning);
            }
          }

          .protocol-icon {
            font-size: 20px;
            color: var(--el-color-primary);
            padding: 6px;
            background: var(--el-color-primary-light-9);
            border-radius: 8px;
            transition: all 0.3s ease;

            &:hover {
              background: var(--el-color-primary-light-8);
              transform: scale(1.1);
            }
          }
        }
      }

      .metrics-display {
        margin: 16px 0;
        padding: 16px;
        background: linear-gradient(135deg, var(--el-fill-color-extra-light) 0%, var(--el-fill-color-light) 100%);
        border-radius: 12px;
        border: 1px solid var(--el-border-color-lighter);
        backdrop-filter: blur(5px);

        .metric-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          font-size: 12px;

          &:last-child {
            margin-bottom: 0;
          }

          .metric-label {
            width: 35px;
            color: var(--el-text-color-secondary);
            flex-shrink: 0;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 10px;
          }

          .el-progress {
            flex: 1;

            :deep(.el-progress-bar__outer) {
              border-radius: 6px;
              background-color: var(--el-fill-color-light);
            }

            :deep(.el-progress-bar__inner) {
              border-radius: 6px;
              background: linear-gradient(90deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
            }
          }

          .metric-value {
            width: 40px;
            text-align: right;
            font-weight: 600;
            color: var(--el-text-color-primary);
            flex-shrink: 0;
            font-size: 11px;
          }
        }
      }

      .card-actions {
        margin-top: 16px;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateY(8px);

        .el-button-group {
          width: 100%;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

          .el-button {
            flex: 1;
            font-size: 12px;
            padding: 8px 12px;
            font-weight: 500;
            border: none;
            transition: all 0.3s ease;

            &:hover {
              background-color: var(--el-color-primary);
              color: white;
              transform: translateY(-1px);
            }

            &:not(:last-child) {
              border-right: 1px solid var(--el-border-color-light);
            }
          }
        }
      }

      &:hover .card-actions {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }
}

/* 拖拽分割线 */
.resize-handle {
  width: 6px;
  background: linear-gradient(180deg, var(--el-border-color-light) 0%, var(--el-border-color) 100%);
  cursor: col-resize;
  transition: all 0.3s ease;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 2px;
    height: 20px;
    background: var(--el-border-color-dark);
    border-radius: 1px;
    opacity: 0.5;
    transition: all 0.3s ease;
  }

  &:hover {
    background: linear-gradient(180deg, var(--el-color-primary-light-7) 0%, var(--el-color-primary) 100%);

    &::before {
      background: white;
      opacity: 1;
      height: 30px;
    }
  }
}

/* 右侧面板 */
.right-panel {
  flex: 1;
  background: linear-gradient(180deg, var(--el-bg-color) 0%, var(--el-fill-color-extra-light) 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0 12px 12px 0;

  .welcome-panel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--el-bg-color-page) 0%, var(--el-fill-color-extra-light) 100%);

    :deep(.el-empty) {
      .el-empty__image {
        width: 120px;
        height: 120px;

        svg {
          width: 100%;
          height: 100%;
          opacity: 0.6;
        }
      }

      .el-empty__description {
        font-size: 16px;
        color: var(--el-text-color-secondary);
        margin: 20px 0;
        font-weight: 500;
      }

      .el-button {
        border-radius: 12px;
        padding: 12px 24px;
        font-weight: 600;
        font-size: 14px;
        background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
        border: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
          background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
        }
      }
    }
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.server-container {
  animation: fadeInUp 0.6s ease-out;
}

.server-card {
  animation: slideInLeft 0.4s ease-out;
  animation-fill-mode: both;

  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
  &:nth-child(4) { animation-delay: 0.4s; }
  &:nth-child(5) { animation-delay: 0.5s; }
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .left-panel {
    width: 380px !important;
  }

  .toolbar .toolbar-right {
    .search-input {
      width: 200px;
    }
  }
}

@media (max-width: 1200px) {
  .left-panel {
    width: 350px !important;
  }

  .toolbar .toolbar-right {
    .filter-select {
      width: 100px;
    }

    .search-input {
      width: 180px;
    }
  }

  .server-card {
    .card-header .server-info .server-name {
      font-size: 16px;
    }
  }
}

@media (max-width: 992px) {
  .toolbar {
    padding: 16px 20px;

    .toolbar-left .page-title {
      font-size: 20px;

      .iconify {
        font-size: 24px;
      }
    }

    .toolbar-right {
      gap: 12px;

      .search-input {
        width: 160px;
      }
    }
  }
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
    gap: 0;
  }

  .left-panel {
    width: 100% !important;
    height: 350px;
    border-right: none;
    border-bottom: 2px solid var(--el-border-color-lighter);
    border-radius: 12px 12px 0 0;
  }

  .right-panel {
    border-radius: 0 0 12px 12px;
  }

  .resize-handle {
    display: none;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 16px;

    .toolbar-left .page-title {
      font-size: 18px;
      justify-content: center;

      .iconify {
        font-size: 22px;
      }
    }

    .toolbar-right {
      justify-content: center;
      flex-wrap: wrap;
      gap: 12px;

      .search-input {
        width: 100%;
        max-width: 300px;
      }

      .filter-select {
        width: 120px;
      }
    }
  }

  .server-list {
    padding: 16px;

    .server-card {
      padding: 16px;
      margin-bottom: 12px;

      .card-header {
        margin-bottom: 12px;

        .server-info .server-name {
          font-size: 16px;
        }

        .server-status {
          gap: 8px;

          .protocol-icon {
            font-size: 18px;
            padding: 4px;
          }
        }
      }

      .metrics-display {
        padding: 12px;
        margin: 12px 0;
      }
    }
  }
}

@media (max-width: 480px) {
  .server-container {
    border-radius: 8px;
  }

  .toolbar {
    padding: 12px;

    .toolbar-left .page-title {
      font-size: 16px;

      .server-count {
        margin-left: 8px;
        padding: 4px 8px;
        font-size: 11px;
      }
    }
  }

  .server-list {
    padding: 12px;

    .server-card {
      padding: 12px;
      border-radius: 12px;

      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;

        .server-status {
          align-self: flex-end;
        }
      }
    }
  }
}

/* 加载状态优化 */
.server-list[v-loading] {
  .server-card {
    animation: pulse 1.5s ease-in-out infinite;
  }
}

/* 滚动优化 */
.server-list {
  scroll-behavior: smooth;
}

/* 焦点状态优化 */
.server-card:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}




</style>
