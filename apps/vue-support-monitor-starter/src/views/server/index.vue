<template>
  <div class="server-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">
          <IconifyIconOnline icon="ri:server-line" class="mr-2" />
          服务器管理
          <el-tooltip :content="`当前共有 ${totalCount} 台服务器`" placement="bottom" :show-after="500">
            <el-tag type="info" effect="plain" class="server-count">
              共 <span class="count-num">{{ totalCount }}</span> 台
            </el-tag>
          </el-tooltip>
          <el-tooltip :content="`WebSocket连接状态: ${wsConnected ? '已连接' : '未连接'}`" placement="bottom" :show-after="500">
            <el-tag
              :type="wsConnected ? 'success' : 'danger'"
              effect="light"
              size="small"
              class="ml-2"
            >
              {{ wsConnected ? '已连接' : '未连接' }}
            </el-tag>
          </el-tooltip>
        </h2>
      </div>

      <div class="toolbar-right">
        <!-- 视图切换 -->
        <el-tooltip content="切换显示模式" placement="bottom" :show-after="500">
          <el-radio-group v-model="viewMode" size="small" class="view-toggle">
            <el-radio-button label="card">卡片视图</el-radio-button>
            <el-radio-button label="list">列表视图</el-radio-button>
            <el-radio-button label="topology">拓扑视图</el-radio-button>
          </el-radio-group>
        </el-tooltip>

        <!-- 筛选器 -->
        <el-tooltip content="按分组筛选" placement="bottom" :show-after="500">
          <el-select v-model="filterGroup" placeholder="分组" clearable size="small" class="filter-select">
            <el-option label="全部" value="" />
            <el-option v-for="group in serverGroups" :key="group" :label="group" :value="group" />
          </el-select>
        </el-tooltip>

        <el-tooltip content="按协议筛选" placement="bottom" :show-after="500">
          <el-select v-model="filterProtocol" placeholder="协议" clearable size="small" class="filter-select">
            <el-option label="SSH" value="SSH" />
            <el-option label="RDP" value="RDP" />
            <el-option label="VNC" value="VNC" />
          </el-select>
        </el-tooltip>

        <el-tooltip content="按状态筛选" placement="bottom" :show-after="500">
          <el-select v-model="filterStatus" placeholder="状态" clearable size="small" class="filter-select">
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="异常" value="error" />
          </el-select>
        </el-tooltip>

        <!-- 搜索 -->
        <el-tooltip content="搜索服务器名称、地址或描述" placement="bottom" :show-after="500">
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
        </el-tooltip>

        <!-- 操作按钮 -->
        <el-tooltip content="新增服务器" placement="bottom" :show-after="500">
          <el-button type="primary" size="small" @click="showAddDialog">
            <IconifyIconOnline icon="ep:plus" class="mr-1" />
            新增
          </el-button>
        </el-tooltip>

        <el-tooltip content="更多操作" placement="bottom" :show-after="500">
          <el-dropdown @command="handleToolbarAction">
            <el-button size="small">
              更多
              <IconifyIconOnline icon="ep:arrow-down" class="ml-1" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="import" title="从文件导入服务器配置">
                  <IconifyIconOnline icon="ri:upload-line" class="mr-2" />
                  导入配置
                </el-dropdown-item>
                <el-dropdown-item command="export" title="导出服务器配置到文件">
                  <IconifyIconOnline icon="ri:download-line" class="mr-2" />
                  导出配置
                </el-dropdown-item>
                <el-dropdown-item command="batch" title="批量管理多台服务器">
                  <IconifyIconOnline icon="ri:checkbox-multiple-line" class="mr-2" />
                  批量操作
                </el-dropdown-item>
                <el-dropdown-item command="script" title="批量执行脚本">
                  <IconifyIconOnline icon="ri:code-line" class="mr-2" />
                  脚本执行
                </el-dropdown-item>
                <el-dropdown-item command="alert" title="配置监控告警规则">
                  <IconifyIconOnline icon="ri:alarm-line" class="mr-2" />
                  告警配置
                </el-dropdown-item>
                <el-dropdown-item command="log" title="查看系统操作日志">
                  <IconifyIconOnline icon="ri:history-line" class="mr-2" />
                  操作日志
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-tooltip>
      </div>
    </div>

    <!-- 主体内容区域 -->
    <div class="main-content">
      <!-- 左侧服务器列表 -->
      <div class="left-panel" :class="{ 'minimized': leftPanelMinimized }" :style="{ width: leftPanelMinimized ? '60px' : leftPanelWidth + 'px' }">
        <!-- 面板头部控制栏 -->
        <div class="panel-header">
          <div class="panel-title" v-if="!leftPanelMinimized">
            <IconifyIconOnline icon="ri:server-line" class="mr-2" />
            <span>服务器列表</span>
            <el-badge :value="filteredServers.length" class="ml-2" type="primary" />
          </div>
          <div class="panel-controls">
            <el-tooltip :content="leftPanelMinimized ? '展开面板' : '最小化面板'" placement="right" :show-after="300">
              <el-button
                size="small"
                text
                @click="toggleLeftPanel"
                class="minimize-btn"
              >
                <IconifyIconOnline :icon="leftPanelMinimized ? 'ri:arrow-right-s-line' : 'ri:arrow-left-s-line'" />
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <!-- 服务器分组标签 -->
        <div class="group-tabs" v-if="serverGroups.length > 0 && !leftPanelMinimized">
          <el-tooltip content="按分组查看服务器" placement="bottom" :show-after="500">
            <el-tabs v-model="activeGroup" @tab-click="handleGroupChange">
              <el-tab-pane label="全部" name="all" />
              <el-tab-pane
                v-for="group in serverGroups"
                :key="group"
                :label="group"
                :name="group"
              />
            </el-tabs>
          </el-tooltip>
        </div>

        <!-- 服务器卡片列表 -->
        <div class="server-list" v-loading="loading">
          <!-- 最小化状态下的简化服务器列表 -->
          <template v-if="leftPanelMinimized">
            <!-- 最小化状态下的空状态 -->
            <div v-if="filteredServers.length === 0" class="server-mini-empty">
              <el-tooltip content="暂无服务器，点击展开面板查看详情" placement="right" :show-after="300">
                <div class="mini-empty-icon">
                  <IconifyIconOnline icon="ri:server-line" />
                </div>
              </el-tooltip>
            </div>
            <!-- 最小化状态下的服务器列表 -->
            <el-tooltip
              v-for="server in filteredServers"
              :key="server.id + '-mini'"
              :content="`${server.name} (${server.host}:${server.port}) - ${getOnlineStatusTextSafe(server.onlineStatus)}`"
              placement="right"
              :show-after="300"
            >
              <div
                class="server-mini-card"
                :class="{
                  'selected': selectedServerId === server.id,
                  'online': server.onlineStatus === ONLINE_STATUS.ONLINE,
                  'offline': server.onlineStatus === ONLINE_STATUS.OFFLINE,
                  'error': server.status === SERVER_STATUS.ERROR
                }"
                @click="selectServer(server)"
              >
                <IconifyIconOnline
                  :icon="getProtocolIcon(server.protocol)"
                  class="server-mini-icon"
                />
                <div class="server-mini-status" :class="getOnlineStatusType(server.onlineStatus)"></div>
              </div>
            </el-tooltip>
          </template>

          <!-- 正常状态下的完整服务器列表 -->
          <template v-else>
            <!-- 正常状态下的空状态 -->
            <el-empty v-if="filteredServers.length === 0" description="暂无服务器">
              <el-tooltip content="点击新增第一台服务器" placement="top" :show-after="500">
                <el-button type="primary" @click="showAddDialog">新增服务器</el-button>
              </el-tooltip>
            </el-empty>

            <!-- 正常状态下的服务器列表 -->
            <template v-if="filteredServers.length > 0">
              <el-tooltip
                v-for="server in filteredServers"
                :key="server.id"
                :content="`${server.name} (${server.host}:${server.port}) - ${getOnlineStatusTextSafe(server.onlineStatus)}`"
                placement="right"
                :show-after="800"
                :disabled="selectedServerId === server.id"
              >
            <div
              class="server-card"
              :class="{
                'selected': selectedServerId === server.id,
                'online': server.onlineStatus === ONLINE_STATUS.ONLINE,
                'offline': server.onlineStatus === ONLINE_STATUS.OFFLINE,
                'error': server.status === SERVER_STATUS.ERROR
              }"
              @click="selectServer(server)"
            >
            <!-- 服务器卡片头部 -->
            <div class="card-header">
              <div class="server-info">
                <el-tooltip :content="`服务器名称: ${server.name}`" placement="top" :show-after="300">
                  <div class="server-name">{{ server.name }}</div>
                </el-tooltip>
                <el-tooltip :content="`服务器地址: ${server.host}:${server.port}`" placement="top" :show-after="300">
                  <div class="server-address">{{ server.host }}:{{ server.port }}</div>
                </el-tooltip>
              </div>
              <div class="server-status">
                <el-tooltip :content="`服务器状态: ${getOnlineStatusTextSafe(server.onlineStatus)}`" placement="top" :show-after="300">
                  <el-tag
                    :type="getOnlineStatusType(server.onlineStatus)"
                    size="small"
                    effect="light"
                  >
                    {{ getOnlineStatusTextSafe(server.onlineStatus) }}
                  </el-tag> 
                </el-tooltip>
                <el-tooltip :content="`连接协议: ${server.protocol}`" placement="top" :show-after="300">
                  <IconifyIconOnline
                    :icon="getProtocolIcon(server.protocol)"
                    class="protocol-icon"
                  />
                </el-tooltip>
              </div>
            </div>

            <!-- 实时指标显示 -->
            <div v-if="server.metricsSupport && getServerMetrics(server.id)" class="metrics-display">
              <el-tooltip :content="`CPU使用率: ${Math.round(getServerMetrics(server.id)?.cpuUsage || 0)}%`" placement="top" :show-after="300">
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
              </el-tooltip>
              <el-tooltip :content="`内存使用率: ${Math.round(getServerMetrics(server.id)?.memoryUsage || 0)}%`" placement="top" :show-after="300">
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
              </el-tooltip>
              <el-tooltip :content="`磁盘使用率: ${Math.round(getServerMetrics(server.id)?.diskUsage || 0)}%`" placement="top" :show-after="300">
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
              </el-tooltip>
            </div>

            <!-- 操作按钮 -->
            <div class="card-actions" @click.stop>
              <el-button-group>
                <el-tooltip content="连接服务器" placement="top" :show-after="500">
                  <el-button size="small" type="primary" @click.stop.prevent="connectServer(server)">
                    <IconifyIconOnline icon="ri:play-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="查看详情" placement="top" :show-after="500">
                  <el-button size="small" @click.stop.prevent="showServerInfo(server)">
                    <IconifyIconOnline icon="ri:information-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="编辑配置" placement="top" :show-after="500">
                  <el-button size="small" @click.stop.prevent="editServer(server)">
                    <IconifyIconOnline icon="ri:edit-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="更多操作" placement="top" :show-after="500">
                  <el-dropdown @command="(cmd) => handleServerAction(cmd, server)" @click.stop.prevent>
                    <el-button size="small">
                      <IconifyIconOnline icon="ri:more-line" />
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="test" title="测试服务器连接状态">
                          <IconifyIconOnline icon="ri:wifi-line" class="mr-2" />
                          测试连接
                        </el-dropdown-item>
                        <el-dropdown-item command="files" title="打开文件管理器">
                          <IconifyIconOnline icon="ri:folder-line" class="mr-2" />
                          文件管理
                        </el-dropdown-item>
                        <el-dropdown-item command="monitor" title="查看性能监控详情">
                          <IconifyIconOnline icon="ri:dashboard-line" class="mr-2" />
                          性能监控
                        </el-dropdown-item>
                        <el-dropdown-item
                          command="detail"
                          title="查看服务器详情页面"
                          v-if="server.monitorSysGenServerReportEnabled === 1"
                        >
                          <IconifyIconOnline icon="ri:dashboard-3-line" class="mr-2" />
                          详情页面
                        </el-dropdown-item>
                        <el-dropdown-item command="script" title="在服务器上执行脚本">
                          <IconifyIconOnline icon="ri:terminal-line" class="mr-2" />
                          执行脚本
                        </el-dropdown-item>
                        <el-dropdown-item command="log" title="查看服务器操作日志">
                          <IconifyIconOnline icon="ri:file-list-line" class="mr-2" />
                          操作日志
                        </el-dropdown-item>
                        <el-dropdown-item command="delete" divided title="删除此服务器配置" class="delete-item">
                          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-2" />
                          删除服务器
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </el-tooltip>
              </el-button-group>
            </div>
            </div>
          </el-tooltip>
            </template>
          </template>
        </div>
      </div>

      <!-- 拖拽分割线 -->
      <el-tooltip content="拖拽调整面板宽度" placement="right" :show-after="500" v-if="!leftPanelMinimized">
        <div
          class="resize-handle"
          @mousedown="startResize"
        ></div>
      </el-tooltip>

      <!-- 右侧内容区域 -->
      <div class="right-panel">
        <div v-if="!selectedServerId" class="welcome-panel">
          <el-empty description="请选择一个服务器">
            <el-tooltip content="点击新增第一台服务器" placement="top" :show-after="500">
              <el-button type="primary" @click="showAddDialog">新增服务器</el-button>
            </el-tooltip>
          </el-empty>
        </div>

        <!-- 动态组件区域 -->
        <div v-else class="dynamic-component-container">
          <!-- 使用 Suspense 包装异步组件 -->
          <Suspense>
            <template #default>
              <!-- SSH终端组件 -->
              <SSHTerminal
                v-if="currentComponent === 'SSHTerminal'"
                :server="selectedServer"
                :key="`ssh-${selectedServerId}-${componentKey}`"
                @close="closeRightPanel"
              />
              <!-- 远程桌面组件 (统一处理RDP和VNC) -->
              <RemoteDesktop
                v-else-if="currentComponent === 'RemoteDesktop'"
                :server="selectedServer"
                :key="`remote-${selectedServerId}-${componentKey}`"
                @close="closeRightPanel"
              />
              <!-- 服务器监控组件 -->
              <ServerMonitor
                v-else-if="currentComponent === 'ServerMonitor'"
                :server="selectedServer"
                :key="`monitor-${selectedServerId}-${componentKey}`"
                @close="closeRightPanel"
              />
              <!-- 文件管理组件 -->
              <FileManager
                v-else-if="currentComponent === 'FileManager'"
                :server="selectedServer"
                :key="selectedServerId + '-files'"
                @close="closeRightPanel"
              />
              <!-- 默认显示监控组件 -->
              <ServerMonitor
                v-else
                :server="selectedServer"
                :key="selectedServerId + '-default'"
                @close="closeRightPanel"
              />
            </template>
            <template #fallback>
              <div class="component-loading">
                <el-skeleton :rows="8" animated />
                <div class="loading-text">正在加载组件...</div>
              </div>
            </template>
          </Suspense>
        </div>
      </div>
    </div>

    <!-- 对话框组件 -->
    <ServerEditDialog ref="editDialogRef" @success="handleSuccess" />
    <ServerInfoDialog ref="serverInfoDialogRef" />
    <ServerMonitorDialog ref="serverMonitorDialogRef" />
    <ServerTerminalDialog ref="serverTerminalDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, defineAsyncComponent, Suspense } from "vue";
import { message, splitToArray } from "@repo/utils";
import { socket } from "@repo/core";
import { getConfig } from "@repo/config";
import { ElMessageBox, ElMessage } from "element-plus";
import { useServerWebSocket } from "@/composables/useServerWebSocket";
import { useServerMetricsStore } from "@/stores/serverMetrics";
import {
  getServerPageList,
  deleteServer,
  testServerConnection,
  connectServer as connectServerApi,
  disconnectServer as disconnectServerApi,
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
  SERVER_WS_MESSAGE_TYPE,
  type ServerRealtimeData,
  type ServerMetrics,
  type ServerWebSocketMessage,
  type ServerDisplayData,
  type ServerInfo,
  type ServerMetricsDisplay,
  mapServerListToDisplayData,
  mapRealtimeDataToDisplayData,
  mapServerMetricsToDisplay,
} from "@/api/server";

// 异步组件
const ServerEditDialog = defineAsyncComponent(() => import("./modules/server-management/components/ServerEditDialog.vue"));
const ServerInfoDialog = defineAsyncComponent(() => import("./modules/server-management/components/ServerInfoDialog.vue"));
const ServerMonitorDialog = defineAsyncComponent(() => import("./modules/server-management/components/ServerMonitorDialog.vue"));
const ServerTerminalDialog = defineAsyncComponent(() => import("./modules/server-management/components/ServerTerminalDialog.vue"));

// 远程连接组件
const SSHTerminal = defineAsyncComponent(() => import("./modules/server-management/components/remote/SSHTerminal.vue"));
const RemoteDesktop = defineAsyncComponent(() => import("./modules/server-management/components/remote/RemoteDesktop.vue"));
const ServerMonitor = defineAsyncComponent(() => import("./modules/server-management/components/ServerMonitor.vue"));
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
const leftPanelMinimized = ref(false);
const leftPanelOriginalWidth = ref(400);
const selectedServerId = ref("");
const currentComponent = ref("");
const componentKey = ref(0); // 用于强制重新渲染组件

// 服务器数据
const servers = ref<ServerDisplayData[]>([]);
const serverGroups = ref<string[]>([]);
const selectedServer = computed(() =>
  servers.value.find(s => s.id === selectedServerId.value)
) as any;

// WebSocket相关状态
const { state: wsState, onMessage, MESSAGE_TYPE, connect, disconnect } = useServerWebSocket();
const wsConnected = computed(() => wsState.value?.connected || false);
const serverMetrics = ref<Map<string, ServerMetricsDisplay>>(new Map());

// ServerMetrics Store
const serverMetricsStore = useServerMetricsStore();

/**
 * 获取指定服务器的指标数据
 */
const getServerMetricsData = (serverId: string | number) => {
  return serverMetricsStore.getServerMetrics(Number(serverId));
};

// 对话框引用
const editDialogRef = ref();
const serverInfoDialogRef = ref();
const serverMonitorDialogRef = ref();
const serverTerminalDialogRef = ref();

// 本地状态映射（作为备用方案）
const localOnlineStatusMap = {
  0: { color: "danger", text: "离线" },
  1: { color: "success", text: "在线" },
  2: { color: "warning", text: "未知" },
} as const;

const localProtocolIconMap = {
  SSH: "ri:terminal-line",
  RDP: "ri:computer-line",
  VNC: "ri:remote-control-line",
} as const;



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
          return server.onlineStatus === ONLINE_STATUS.ONLINE;
        case "offline":
          return server.onlineStatus === ONLINE_STATUS.OFFLINE;
        case "error":
          return server.status === SERVER_STATUS.ERROR;
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
}) as any;

/**
 * 获取在线状态类型
 */
const getOnlineStatusType = (status: number) => {
  // 添加类型检查和错误处理
  if (typeof status !== 'number') {
    console.warn('getOnlineStatusType: status is not a number:', status);
    return "info";
  }

  // 优先使用导入的映射，如果不可用则使用本地映射
  try {
    const statusMap = onlineStatusMap || localOnlineStatusMap;
    return statusMap[status]?.color || "info";
  } catch (error) {
    console.warn('Error accessing onlineStatusMap:', error);
    return localOnlineStatusMap[status]?.color || "info";
  }
};

/**
 * 安全获取在线状态文本（用于模板）
 */
const getOnlineStatusTextSafe = (status: any) => {
  try {
    // 如果状态未定义或为null，返回未知状态
    if (status === undefined || status === null) {
      return "未知状态";
    }

    // 转换为数字
    const numStatus = Number(status);
    if (isNaN(numStatus)) {
      return "未知状态";
    }

    // 使用本地映射确保安全
    return localOnlineStatusMap[numStatus]?.text || "未知状态";
  } catch (error) {
    console.warn('Error in getOnlineStatusTextSafe:', error);
    return "未知状态";
  }
};

/**
 * 获取协议图标
 */
const getProtocolIcon = (protocol: string) => {
  // 添加类型检查和错误处理
  if (typeof protocol !== 'string') {
    console.warn('getProtocolIcon: protocol is not a string:', protocol);
    return "ri:server-line";
  }

  // 优先使用导入的映射，如果不可用则使用本地映射
  try {
    const iconMap = protocolIconMap || localProtocolIconMap;
    return iconMap[protocol as keyof typeof iconMap] || "ri:server-line";
  } catch (error) {
    console.warn('Error accessing protocolIconMap:', error);
    return localProtocolIconMap[protocol as keyof typeof localProtocolIconMap] || "ri:server-line";
  }
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
    }) as any;

    if (res.code == "00000") {
      // 使用字段映射转换后台数据为前端显示数据
      const serverList = res.data?.data || [];
      servers.value = mapServerListToDisplayData(serverList);
      totalCount.value = res.data?.total || 0;

      // 调试信息：检查服务器数据
      console.log('Loaded servers:', servers.value);
      if (servers.value.length > 0) {
        console.log('First server onlineStatus:', servers.value[0].onlineStatus, typeof servers.value[0].onlineStatus);
        console.log('onlineStatusMap:', onlineStatusMap);
      }

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
  // 如果选择的是同一个服务器，不做任何操作
  if (selectedServerId.value === server.id) {
    return;
  }

  selectedServerId.value = server.id;
  currentComponent.value = "ServerMonitor"; // 默认显示监控组件
  componentKey.value++; // 强制重新渲染组件
};

/**
 * 连接服务器
 */
const connectServer = async (server: any) => {
  try {
    console.log("开始连接服务器:", server);

    // 显示加载状态
    message.info("正在连接服务器...");

    // 如果当前已选中同一个服务器且组件类型匹配，不重复连接
    const targetComponent = getTargetComponent(server.protocol);
    if (selectedServerId.value === server.id && currentComponent.value === targetComponent) {
      message.info("服务器已连接");
      return;
    }

    // 先选择服务器，但不设置组件（避免触发ServerMonitor）
    selectedServerId.value = server.id;
    componentKey.value++; // 强制重新渲染

    // 调用后台API建立连接
    const connectResult = await connectServerApi(server.id);
    console.log("连接API响应:", connectResult);

    if (connectResult.code === "00000") {
      // 连接成功后再设置对应的远程组件
      currentComponent.value = targetComponent;
      message.success("服务器连接成功");
      console.log("设置组件为:", currentComponent.value);

    } else {
      message.error(connectResult.msg || "连接失败");
      console.error("连接失败:", connectResult);
      // 连接失败时清除选中状态
      selectedServerId.value = "";
      currentComponent.value = "";
    }

  } catch (error) {
    message.error("连接异常，请稍后重试");
    console.error("连接服务器出错:", error);
    // 异常时清除选中状态
    selectedServerId.value = "";
    currentComponent.value = "";
  }
};

/**
 * 根据协议获取目标组件
 */
const getTargetComponent = (protocol: string) => {
  switch (protocol) {
    case "SSH":
      return "SSHTerminal";
    case "RDP":
    case "VNC":
      return "RemoteDesktop";
    default:
      return "SSHTerminal";
  }
};

/**
 * 断开服务器连接
 */
const disconnectServer = async (server: any) => {
  try {
    console.log("断开服务器连接:", server);

    // 显示加载状态
    message.info("正在断开连接...");

    // 调用后台API断开连接
    const disconnectResult = await disconnectServerApi(server.id);
    console.log("断开连接API响应:", disconnectResult);

    if (disconnectResult.code === "00000") {
      message.success("服务器连接已断开");

      // 清除选中状态和组件
      selectedServerId.value = "";
      currentComponent.value = "";

    } else {
      message.error(disconnectResult.msg || "断开连接失败");
      console.error("断开连接失败:", disconnectResult);
    }

  } catch (error) {
    message.error("断开连接异常，请稍后重试");
    console.error("断开服务器连接出错:", error);
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
    case "detail":
      // 跳转到服务器详情页
      window.open(`/server/detail/${server.id}`, '_blank');
      break;
    case "script":
      // TODO: 实现脚本执行功能
      console.log("执行脚本:", server);
      break;
    case "log":
      // TODO: 实现日志查看功能
      console.log("查看日志:", server);
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
      // TODO: 实现批量操作功能
      console.log("批量操作");
      break;
    case "script":
      // TODO: 实现脚本管理功能
      console.log("脚本管理");
      break;
    case "alert":
      // TODO: 实现告警配置功能
      console.log("告警配置");
      break;
    case "log":
      // TODO: 实现日志管理功能
      console.log("日志管理");
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
  componentKey.value++; // 强制重新渲染
};

/**
 * 切换左侧面板最小化状态
 */
const toggleLeftPanel = () => {
  if (leftPanelMinimized.value) {
    // 还原面板
    leftPanelMinimized.value = false;
    leftPanelWidth.value = leftPanelOriginalWidth.value;
  } else {
    // 最小化面板
    leftPanelOriginalWidth.value = leftPanelWidth.value;
    leftPanelMinimized.value = true;
  }
};

/**
 * 开始拖拽调整大小
 */
const startResize = (e: MouseEvent) => {
  // 如果面板已最小化，不允许拖拽
  if (leftPanelMinimized.value) return;

  const startX = e.clientX;
  const startWidth = leftPanelWidth.value;

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startX;
    const newWidth = startWidth + deltaX;

    // 限制最小和最大宽度
    if (newWidth >= 300 && newWidth <= 800) {
      leftPanelWidth.value = newWidth;
      leftPanelOriginalWidth.value = newWidth; // 同时更新原始宽度
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
 * 初始化WebSocket消息处理
 */
const initWebSocketHandlers = () => {
  // 注册服务器状态变化处理器
  onMessage(MESSAGE_TYPE.CONNECTION_STATUS_CHANGE, handleConnectionStatusChange);
  onMessage(MESSAGE_TYPE.SERVER_ONLINE, handleServerOnline);
  onMessage(MESSAGE_TYPE.SERVER_OFFLINE, handleServerOffline);
  onMessage(MESSAGE_TYPE.SERVER_UPDATE, handleServerUpdate);
  onMessage(MESSAGE_TYPE.SERVER_DELETE, handleServerDelete);
  onMessage(MESSAGE_TYPE.SERVER_ADD, handleServerAdd);
  onMessage(MESSAGE_TYPE.SERVER_METRICS, handleServerMetrics);
  onMessage(MESSAGE_TYPE.CONNECTION_TEST_RESULT, handleConnectionTestResult);

  // 注册serverMetrics相关消息处理器
  onMessage('server_metrics', handleServerMetricsData);
  onMessage('server_status_summary', handleServerStatusSummary);
  onMessage('performance_trends', handlePerformanceTrends);
  onMessage('server_alerts', handleServerAlerts);
};

/**
 * 处理连接状态变化
 */
const handleConnectionStatusChange = (message: ServerWebSocketMessage) => {
  if (!message.serverId) return;

  const index = servers.value.findIndex(s => s.id === String(message.serverId));
  if (index !== -1) {
    servers.value[index].connectionStatus = (message.connectionStatus || 0) as any;
    console.log(`服务器 ${servers.value[index].name} 连接状态变化: ${message.connectionStatus}`);

    // 显示状态变化消息
    if (message.statusDesc) {
      if (message.connectionStatus === 1) { // 连接成功
        ElMessage.success(`${servers.value[index].name}: ${message.statusDesc}`);
      } else if (message.connectionStatus === 3) { // 连接失败
        ElMessage.error(`${servers.value[index].name}: ${message.statusDesc}`);
      }
    }
  }
};

/**
 * 处理服务器上线
 */
const handleServerOnline = (message: ServerWebSocketMessage) => {
  if (!message.serverId) return;

  const index = servers.value.findIndex(s => s.id === String(message.serverId));
  if (index !== -1) {
    servers.value[index].onlineStatus = ONLINE_STATUS.ONLINE;
    servers.value[index].lastOnlineTime = message.connectTime || new Date().toISOString();
  }
};

/**
 * 处理服务器离线
 */
const handleServerOffline = (message: ServerWebSocketMessage) => {
  if (!message.serverId) return;

  const index = servers.value.findIndex(s => s.id === String(message.serverId));
  if (index !== -1) {
    servers.value[index].onlineStatus = ONLINE_STATUS.OFFLINE;
    servers.value[index].lastOfflineTime = new Date().toISOString();
  }
};

/**
 * 处理服务器更新
 */
const handleServerUpdate = (message: ServerWebSocketMessage) => {
  if (!message.serverId) return;

  const index = servers.value.findIndex(s => s.id === String(message.serverId));
  if (index !== -1) {
    // 更新服务器基本信息
    if (message.serverName) servers.value[index].name = message.serverName;
    if (message.serverHost) servers.value[index].host = message.serverHost;
    if (message.serverPort) servers.value[index].port = message.serverPort;
    if (message.serverProtocol) servers.value[index].protocol = message.serverProtocol as any;
  }
};

/**
 * 处理服务器删除
 */
const handleServerDelete = (message: ServerWebSocketMessage) => {
  if (!message.serverId) return;

  const index = servers.value.findIndex(s => s.id === String(message.serverId));
  if (index !== -1) {
    servers.value.splice(index, 1);
  }
  serverMetrics.value.delete(String(message.serverId));

  // 如果删除的是当前选中的服务器，清空选择
  if (selectedServerId.value === String(message.serverId)) {
    selectedServerId.value = "";
    currentComponent.value = "";
  }
};

/**
 * 处理服务器添加
 */
const handleServerAdd = (message: ServerWebSocketMessage) => {
  if (!message.serverId || !message.serverName) return;

  // 检查是否已存在
  const exists = servers.value.some(s => s.id === String(message.serverId));
  if (!exists) {
    const newServer = {
      id: String(message.serverId),
      name: message.serverName,
      host: message.serverHost || '',
      port: message.serverPort || 22,
      protocol: (message.serverProtocol || 'SSH') as any,
      status: SERVER_STATUS.NORMAL,
      onlineStatus: ONLINE_STATUS.OFFLINE,
      connectionStatus: (message.connectionStatus || 0) as any,
      description: '',
      group: '',
      username: '',
      password: '',
      privateKey: '',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      lastOnlineTime: '',
      lastOfflineTime: '',
      metricsSupport: false,
      tags: [],
      environment: '',
      region: '',
      datacenter: '',
      osType: '',
      osVersion: '',
      cpuCores: 0,
      memorySize: 0,
      diskSize: 0
    } as any;
    servers.value.push(newServer);
  }
};

/**
 * 处理服务器指标
 */
const handleServerMetrics = (message: ServerWebSocketMessage) => {
  if (!message.serverId || !message.data) return;

  try {
    const metrics = message.data;
    const displayMetrics = mapServerMetricsToDisplay(metrics);
    serverMetrics.value.set(String(message.serverId), displayMetrics);
  } catch (error) {
    console.error('处理服务器指标数据失败:', error);
  }
};

/**
 * 处理连接测试结果
 */
const handleConnectionTestResult = (message: ServerWebSocketMessage) => {
  if (!message.serverId) return;

  const index = servers.value.findIndex(s => s.id === String(message.serverId));
  if (index !== -1) {
    servers.value[index].connectionStatus = (message.connectionStatus || 0) as any;

    // 显示测试结果消息
    if (message.statusDesc) {
      if (message.connectionStatus === 1) {
        ElMessage.success(`连接测试成功: ${message.statusDesc}`);
      } else {
        ElMessage.error(`连接测试失败: ${message.errorMessage || message.statusDesc}`);
      }
    }
  }
};

/**
 * 处理服务器指标数据 - 更新到store
 */
const handleServerMetricsData = (message: any) => {
  if (!message.serverId || !message.data) return;

  try {
    // 更新到serverMetrics store
    serverMetricsStore.updateServerMetrics(message.serverId, message.data);

    // 同时保持原有的本地缓存逻辑
    const metrics = message.data;
    const displayMetrics = mapServerMetricsToDisplay(metrics);
    serverMetrics.value.set(String(message.serverId), displayMetrics);

    console.log(`已更新服务器 ${message.serverId} 的指标数据到store`);
  } catch (error) {
    console.error('处理服务器指标数据失败:', error);
  }
};

/**
 * 处理服务器状态汇总
 */
const handleServerStatusSummary = (message: any) => {
  if (!message.data) return;

  try {
    serverMetricsStore.updateStatusSummary(message.data);
    console.log('已更新服务器状态汇总到store');
  } catch (error) {
    console.error('处理服务器状态汇总失败:', error);
  }
};

/**
 * 处理性能趋势数据
 */
const handlePerformanceTrends = (message: any) => {
  if (!message.serverId || !message.data) return;

  try {
    serverMetricsStore.updatePerformanceTrends(message.serverId, message.data);
    console.log(`已更新服务器 ${message.serverId} 的性能趋势数据到store`);
  } catch (error) {
    console.error('处理性能趋势数据失败:', error);
  }
};

/**
 * 处理服务器告警信息
 */
const handleServerAlerts = (message: any) => {
  if (!message.serverId || !message.data) return;

  try {
    serverMetricsStore.updateServerAlerts(message.serverId, message.data);
    console.log(`已更新服务器 ${message.serverId} 的告警信息到store`);
  } catch (error) {
    console.error('处理服务器告警信息失败:', error);
  }
};

// 生命周期钩子
onMounted(async () => {
  // 确保映射对象已正确导入
  console.log('onlineStatusMap in onMounted:', onlineStatusMap);
  console.log('ONLINE_STATUS in onMounted:', ONLINE_STATUS);

  loadServers();
  initWebSocketHandlers();

  // 手动连接 WebSocket
  try {
    await connect();
    console.log('WebSocket 连接成功');
  } catch (error) {
    console.error('WebSocket 连接失败:', error);
  }
});

// 组件卸载时断开连接
onUnmounted(() => {
  disconnect();
  console.log('WebSocket 连接已断开');
});
</script>

<style lang="scss" scoped>
.server-container {
  height: 100vh;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
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
  transition: all 0.3s ease;

  &.minimized {
    .server-list {
      padding: 8px 4px;
    }

    .server-mini-empty {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px 0;

      .mini-empty-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--el-fill-color-light);
        border-radius: 8px;
        color: var(--el-text-color-placeholder);
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: var(--el-fill-color);
          color: var(--el-text-color-secondary);
          transform: scale(1.05);
        }

        svg {
          font-size: 20px;
        }
      }
    }
  }
}

/* 面板头部控制栏 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  min-height: 48px;

  .panel-title {
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .panel-controls {
    display: flex;
    align-items: center;

    .minimize-btn {
      padding: 4px;
      min-height: 24px;
      width: 24px;
      border-radius: 4px;

      &:hover {
        background-color: var(--el-fill-color-light);
      }
    }
  }
}

/* 最小化状态下的服务器卡片 */
.server-mini-card {
  width: 44px;
  height: 44px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    transform: scale(1.05);
  }

  &.selected {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-8);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .server-mini-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }

  .server-mini-status {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 2px solid var(--el-bg-color);

    &.success {
      background-color: var(--el-color-success);
    }

    &.danger {
      background-color: var(--el-color-danger);
    }

    &.warning {
      background-color: var(--el-color-warning);
    }

    &.info {
      background-color: var(--el-color-info);
    }
  }
}

.left-panel {
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

  .dynamic-component-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .component-loading {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 40px;
      background: var(--el-bg-color-page);

      .loading-text {
        margin-top: 20px;
        font-size: 14px;
        color: var(--el-text-color-secondary);
        font-weight: 500;
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

/* 下拉菜单项图标和文字居中对齐 */
:deep(.el-dropdown-menu) {
  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    padding: 8px 16px;

    .iconify {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: 8px;
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
  }
}

/* 工具栏下拉菜单样式优化 */
.toolbar {
  :deep(.el-dropdown-menu) {
    .el-dropdown-menu__item {
      transition: all 0.3s ease;
      border-radius: 6px;
      margin: 2px 4px;

      &:hover {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        transform: translateX(2px);
      }

      .iconify {
        color: var(--el-text-color-secondary);
        transition: color 0.3s ease;
      }

      &:hover .iconify {
        color: var(--el-color-primary);
      }
    }
  }
}

/* 服务器卡片下拉菜单样式优化 */
.server-card {
  :deep(.el-dropdown-menu) {
    .el-dropdown-menu__item {
      transition: all 0.3s ease;
      border-radius: 6px;
      margin: 2px 4px;

      &:hover {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        transform: translateX(2px);
      }

      &.is-divided {
        border-top: 1px solid var(--el-border-color-lighter);
        margin-top: 6px;
        padding-top: 6px;
      }

      .iconify {
        color: var(--el-text-color-secondary);
        transition: color 0.3s ease;
      }

      &:hover .iconify {
        color: var(--el-color-primary);
      }

      /* 删除按钮特殊样式 */
      &.delete-item {
        &:hover {
          background: var(--el-color-danger-light-9);
          color: var(--el-color-danger);

          .iconify {
            color: var(--el-color-danger);
          }
        }
      }
    }
  }
}
</style>
