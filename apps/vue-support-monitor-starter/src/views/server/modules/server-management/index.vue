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
          <el-tooltip
            :content="`实时监控状态: ${getSocketStatusText()}`"
            placement="bottom"
            :show-after="500"
          >
            <el-tag
              :type="getSocketStatusType()"
              effect="light"
              size="small"
              class="ml-2"
            >
              <IconifyIconOnline
                :icon="getSocketStatusIcon()"
                class="mr-1"
                :class="{ 'animate-spin': metricsStore.socketState.connecting }"
              />
              {{ getSocketStatusText() }}
            </el-tag>
          </el-tooltip>
        </h2>
      </div>
      <div class="toolbar-right">

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

        <!-- 实时监控开关 -->
        <el-tooltip
          :content="realTimeMetricsEnabled ? '关闭实时监控' : '开启实时监控'"
          placement="bottom"
          :show-after="500"
        >
          <el-switch
            v-model="realTimeMetricsEnabled"
            size="small"
            inline-prompt
            active-text="实时"
            inactive-text="静态"
            @change="toggleRealTimeMetrics"
            class="metrics-switch"
          />
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
              :content="`${server.name} (${server.host}:${server.port}) - ${server.onlineStatus === ONLINE_STATUS.ONLINE ? '在线' : '离线'}`"
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
                  icon="ri:server-line"
                  class="server-mini-icon"
                />
                <div class="server-mini-status" :class="server.onlineStatus === ONLINE_STATUS.ONLINE ? 'online' : 'offline'"></div>
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
                :content="`${server.name} (${server.host}:${server.port}) - ${getOnlineStatusText(server.onlineStatus, server.isLocal)}`"
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
                <el-tooltip :content="`服务器地址: ${server.host}:${server.port} ${server.isLocal ? '(本机服务器)' : '(远程服务器)'}`" placement="top" :show-after="300">
                  <div class="server-address">
                    <span>{{ server.host }}:{{ server.port }}</span>
                    <el-tag v-if="server.isLocal" type="success" size="small" effect="light" class="ml-1">本机</el-tag>
                    <el-tag v-else type="info" size="small" effect="light" class="ml-1">远程</el-tag>
                  </div>
                </el-tooltip>
              </div>
              <div class="server-status">
                <!-- 本地服务器标识 -->
                <el-tooltip
                  v-if="server.isLocal"
                  content="本地服务器 (自动检测)"
                  placement="top"
                  :show-after="300"
                >
                  <el-tag
                    type="success"
                    size="small"
                    effect="light"
                  >
                    <IconifyIconOnline icon="ri:home-line" class="mr-1" />
                    本地
                  </el-tag>
                </el-tooltip>
                <el-tooltip :content="`服务器状态: ${getOnlineStatusText(server.onlineStatus, server.isLocal)}`" placement="top" :show-after="300">
                  <el-tag
                    :type="getOnlineStatusType(server.onlineStatus, server.isLocal)"
                    size="small"
                    effect="light"
                  >
                    {{ getOnlineStatusText(server.onlineStatus, server.isLocal) }}
                  </el-tag>
                </el-tooltip>
                <el-tooltip :content="`连接协议: ${server.protocol}`" placement="top" :show-after="300">
                  <IconifyIconOnline
                    :icon="getProtocolIcon(server.protocol)"
                    class="protocol-icon"
                  />
                </el-tooltip>
                <!-- 延迟显示 -->
                <ServerLatencyDisplay
                  :latency="server.latency"
                  size="small"
                  mode="full"
                  class="server-latency"
                />
                <!-- 健康状态指示器 -->
                <el-tooltip
                  v-if="realTimeMetricsEnabled && getServerHealthStatus(server.id) !== 'unknown'"
                  :content="`健康状态: ${getHealthStatusText(getServerHealthStatus(server.id))}`"
                  placement="top"
                  :show-after="300"
                >
                  <el-tag
                    :type="getHealthStatusType(getServerHealthStatus(server.id))"
                    size="small"
                    effect="light"
                    class="health-status"
                  >
                    <IconifyIconOnline
                      :icon="getHealthStatusIcon(getServerHealthStatus(server.id))"
                      class="mr-1"
                    />
                    {{ getHealthStatusText(getServerHealthStatus(server.id)) }}
                  </el-tag>
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
                        <el-dropdown-item command="delete" divided title="删除此服务器配置">
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
                :key="selectedServerId + '-ssh'"
                @close="closeRightPanel"
              />
              <!-- 远程桌面组件 (统一处理RDP和VNC) -->
              <RemoteDesktop
                v-else-if="currentComponent === 'RemoteDesktop'"
                :server="selectedServer"
                :key="selectedServerId + '-remote'"
                @close="closeRightPanel"
              />
              <!-- 服务器监控组件 -->
              <ServerMonitor
                v-else-if="currentComponent === 'ServerMonitor'"
                :server="selectedServer"
                :key="selectedServerId + '-monitor'"
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
    <ServerEditDialog ref="editDialogRef" @success="handleSuccess" @openConfig="handleOpenConfig" />
    <ServerConfigDialog ref="configDialogRef" @success="handleSuccess" />
    <BatchOperationDialog ref="batchDialogRef" @success="handleSuccess" />
    <ScriptExecutorDialog ref="scriptDialogRef" />
    <AlertConfigDialog ref="alertDialogRef" />
    <OperationLogDialog ref="logDialogRef" />

    <!-- 本地调试对话框 -->
    <el-dialog v-model="localDebugVisible" title="本地服务器调试" width="80%" :close-on-click-modal="false">
      <LocalServerDebug />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, defineAsyncComponent, Suspense } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import {
  getServerPageList,
  deleteServer,
  testServerConnection,
  connectServer as connectServerApi,
  disconnectServer as disconnectServerApi,
  testLocalIpDetection,
  SERVER_STATUS,
  ONLINE_STATUS,
  type ServerDisplayData,
  type ServerInfo,
  type ServerMetricsDisplay,
  mapServerListToDisplayData,
} from "@/api/server";
import { useServerMetricsStore } from "@/stores/serverMetrics";
import { useGlobalServerLatency } from "@/composables/useServerLatency";

// 异步组件
const ServerEditDialog = defineAsyncComponent(() => import("./components/ServerEditDialog.vue"));
const ServerConfigDialog = defineAsyncComponent(() => import("./components/ServerConfigDialog.vue"));
const BatchOperationDialog = defineAsyncComponent(() => import("../../components/dialogs/BatchOperationDialog.vue"));
const ScriptExecutorDialog = defineAsyncComponent(() => import("../../components/dialogs/ScriptExecutorDialog.vue"));
const AlertConfigDialog = defineAsyncComponent(() => import("../../components/dialogs/AlertConfigDialog.vue"));
const OperationLogDialog = defineAsyncComponent(() => import("../../components/dialogs/OperationLogDialog.vue"));
const LocalServerDebug = defineAsyncComponent(() => import("./components/LocalServerDebug.vue"));

// 远程连接组件
const SSHTerminal = defineAsyncComponent(() => import("./components/remote/SSHTerminal.vue"));
const RemoteDesktop = defineAsyncComponent(() => import("./components/remote/RemoteDesktop.vue"));
const ServerMonitor = defineAsyncComponent(() => import("./components/ServerMonitor.vue"));
const FileManager = defineAsyncComponent(() => import("../../components/dialogs/FileManagerDialog.vue"));
const ServerLatencyDisplay = defineAsyncComponent(() => import("../../components/ServerLatencyDisplay.vue"));

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

// 服务器数据
const servers = ref<ServerDisplayData[]>([]);
const serverGroups = ref<string[]>([]);
const selectedServer = computed(() =>
  servers.value.find(s => s.id === selectedServerId.value)
);

// 服务器指标数据
const serverMetrics = ref<Map<string, ServerMetricsDisplay>>(new Map());

// 服务器指标监听
const metricsStore = useServerMetricsStore();
const realTimeMetricsEnabled = ref(true);
const metricsUpdateInterval = ref(30); // 秒

// 延迟管理
const latencyManager = useGlobalServerLatency();

// 对话框引用
const editDialogRef = ref();
const configDialogRef = ref();
const batchDialogRef = ref();
const scriptDialogRef = ref();
const alertDialogRef = ref();
const logDialogRef = ref();

// 本地调试
const localDebugVisible = ref(false);

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
});



/**
 * 获取服务器指标数据
 */
const getServerMetrics = (serverId: string) => {
  // 优先使用实时指标数据
  if (realTimeMetricsEnabled.value && metricsStore.initialized) {
    const metrics = metricsStore.getServerMetrics(parseInt(serverId));
    if (metrics) {
      return {
        cpuUsage: metrics.cpu.usage,
        memoryUsage: metrics.memory.usage,
        diskUsage: metrics.disk.usage,
        networkIn: metrics.network.in,
        networkOut: metrics.network.out,
        status: metrics.status,
        responseTime: metrics.responseTime,
        uptime: metrics.uptime,
        processCount: metrics.processCount
      };
    }
  }

  // 回退到缓存的指标数据
  return serverMetrics.value.get(serverId);
};

/**
 * 获取在线状态类型
 */
const getOnlineStatusType = (status: number, isLocal: boolean) => {
  if(isLocal) {
    return "success";
  }
  // 添加类型检查和错误处理
  if (typeof status !== 'number') {
    console.warn('getOnlineStatusType: status is not a number:', status);
    return "info";
  }

  // 使用本地映射确保安全
  return localOnlineStatusMap[status]?.color || "info";
};

/**
 * 获取在线状态文本
 */
const getOnlineStatusText = (status: number, isLocal: boolean) => {
  if(isLocal) {
    return "在线";
  }
  // 添加类型检查和错误处理
  if (typeof status !== 'number') {
    console.warn('getOnlineStatusText: status is not a number:', status);
    return "未知状态";
  }

  // 使用本地映射确保安全
  return localOnlineStatusMap[status]?.text || "未知状态";
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

  // 使用本地映射确保安全
  return localProtocolIconMap[protocol as keyof typeof localProtocolIconMap] || "ri:server-line";
};

/**
 * 获取进度条颜色
 */
const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return '#f56c6c';
  if (percentage >= 70) return '#e6a23c';
  if (percentage >= 50) return '#409eff';
  return '#67c23a';
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

      // 提取分组信息
      const groups = new Set<string>();
      servers.value.forEach(server => {
        if (server.group) {
          groups.add(server.group);
        }
      });
      serverGroups.value = Array.from(groups);

      // 加载服务器延迟数据
      await loadServerLatency();
    }
  } catch (error) {
    console.error("加载服务器列表失败:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 加载服务器延迟数据
 */
const loadServerLatency = async () => {
  try {
    if (servers.value.length === 0) return;

    // 获取所有服务器ID
    const serverIds = servers.value.map(server => Number(server.id));
    
    // 批量获取延迟数据
    await latencyManager.fetchBatchLatency(serverIds);

    // 更新服务器列表的延迟信息
    latencyManager.updateServerListLatency(servers.value);

  } catch (error) {
    console.error("加载服务器延迟数据失败:", error);
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
const connectServer = async (server: any) => {
  try {
    console.log("开始连接服务器:", server);

    // 显示加载状态
    message.info("正在连接服务器...");

    // 选择服务器
    selectedServerId.value = server.id;

    // 调用后台API建立连接
    const connectResult = await connectServerApi(server.id);
    console.log("连接API响应:", connectResult);

    if (connectResult.code === "00000") {
      // 注意：不在这里显示连接成功消息，等待SSH组件的确认消息
      // message.success("服务器连接成功");

      // 根据协议选择对应的远程组件
      switch (server.protocol) {
        case "SSH":
          currentComponent.value = "SSHTerminal";
          break;
        case "RDP":
        case "VNC":
          currentComponent.value = "RemoteDesktop";
          break;
        default:
          currentComponent.value = "SSHTerminal";
      }

      // WebSocket 连接由 composable 自动管理

    } else {
      message.error(connectResult.msg || "连接失败");
      console.error("连接失败:", connectResult);
    }

  } catch (error) {
    message.error("连接异常，请稍后重试");
    console.error("连接服务器出错:", error);
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
 * 处理打开服务器配置页面
 */
const handleOpenConfig = (serverId: number) => {
  // 打开服务器配置对话框
  console.log('打开服务器配置页面，服务器ID:', serverId);
  configDialogRef.value?.open(serverId);
};

/**
 * 获取Socket连接状态文本
 */
const getSocketStatusText = () => {
  if (metricsStore.socketState.connecting) {
    return '连接中...';
  }
  if (metricsStore.socketState.connected) {
    return '已连接';
  }
  if (metricsStore.socketState.error) {
    return '连接失败';
  }
  return '未连接';
};

/**
 * 获取Socket连接状态类型
 */
const getSocketStatusType = () => {
  if (metricsStore.socketState.connecting) {
    return 'warning';
  }
  if (metricsStore.socketState.connected) {
    return 'success';
  }
  if (metricsStore.socketState.error) {
    return 'danger';
  }
  return 'info';
};

/**
 * 获取Socket连接状态图标
 */
const getSocketStatusIcon = () => {
  if (metricsStore.socketState.connecting) {
    return 'ri:loader-4-line';
  }
  if (metricsStore.socketState.connected) {
    return 'ri:wifi-line';
  }
  if (metricsStore.socketState.error) {
    return 'ri:wifi-off-line';
  }
  return 'ri:signal-wifi-off-line';
};

/**
 * 切换实时监控
 */
const toggleRealTimeMetrics = async () => {
  realTimeMetricsEnabled.value = !realTimeMetricsEnabled.value;

  if (realTimeMetricsEnabled.value) {
    try {
      await metricsStore.initialize();
      message.success('实时监控已启用');
    } catch (error) {
      console.error('启用实时监控失败:', error);
      message.error('启用实时监控失败');
      realTimeMetricsEnabled.value = false;
    }
  } else {
    metricsStore.destroy();
    message.info('实时监控已禁用');
  }
};



/**
 * 获取服务器健康状态
 */
const getServerHealthStatus = (serverId: string) => {
  if (!realTimeMetricsEnabled.value || !metricsStore.initialized) {
    return 'unknown';
  }

  return metricsStore.getServerHealthStatus(parseInt(serverId));
};

/**
 * 获取健康状态文本
 */
const getHealthStatusText = (status: string) => {
  switch (status) {
    case 'healthy':
      return '健康';
    case 'warning':
      return '警告';
    case 'critical':
      return '严重';
    case 'offline':
      return '离线';
    default:
      return '未知';
  }
};

/**
 * 获取健康状态类型
 */
const getHealthStatusType = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'success';
    case 'warning':
      return 'warning';
    case 'critical':
      return 'danger';
    case 'offline':
      return 'info';
    default:
      return 'info';
  }
};

/**
 * 获取健康状态图标
 */
const getHealthStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'ri:heart-pulse-line';
    case 'warning':
      return 'ri:error-warning-line';
    case 'critical':
      return 'ri:alarm-warning-line';
    case 'offline':
      return 'ri:heart-line';
    default:
      return 'ri:question-line';
  }
};























// 生命周期钩子
onMounted(async () => {
  // 加载服务器列表
  await loadServers();

  // 初始化服务器指标监听
  if (realTimeMetricsEnabled.value) {
    try {
      await metricsStore.initialize();
      console.log('服务器指标监听初始化成功');
    } catch (error) {
      console.error('服务器指标监听初始化失败:', error);
      message.error('实时监控连接失败，请检查网络连接');
    }
  }
});

onUnmounted(() => {
  // 销毁服务器指标监听
  if (metricsStore.initialized) {
    metricsStore.destroy();
    console.log('服务器指标监听已销毁');
  }

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
            display: flex;
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

          .server-latency {
            margin-left: 8px;
            flex-shrink: 0;
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

/* 实时监控相关样式 */
.metrics-switch {
  margin-left: 12px;
}

.health-status {
  margin-left: 8px;

  .iconify {
    font-size: 12px;
  }
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s infinite;
}

/* WebSocket连接状态样式 */
.el-tag .iconify.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 实时指标显示优化 */
.metrics-display {
  .el-progress {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .el-progress__text {
    font-size: 12px !important;
    font-weight: 500;
  }
}

/* 响应式优化 */
@media (max-width: 768px) {
  .metrics-switch {
    margin-left: 0;
    margin-top: 8px;
  }

  .health-status {
    margin-left: 0;
    margin-top: 4px;
  }
}

</style>
