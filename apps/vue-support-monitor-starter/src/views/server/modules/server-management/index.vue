<template>
  <div class="server-container">
    <!-- 顶部工具�?-->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">
          <IconifyIconOnline icon="ri:server-line" class="mr-2" />
          服务器管�?
          <el-tooltip
            :content="`当前共有 ${totalCount} 台服务器`"
            placement="bottom"
            :show-after="500"
          >
            <el-tag type="info" effect="plain" class="server-count">
              �?
              <span class="count-num">{{ totalCount }}</span>
              �?
            </el-tag>
          </el-tooltip>
          <el-tooltip
            :content="`实时监控状�? ${getSocketStatusText}`"
            placement="bottom"
            :show-after="500"
          >
            <el-tag
              :type="getSocketStatusType"
              effect="light"
              size="small"
              class="ml-2 tag-container"
            >
              <span class="!mt-[-20px]">
                <IconifyIconOnline :icon="getSocketStatusIcon()" class="mr-1" />
                <span> {{ getSocketStatusText }}</span>
              </span>
            </el-tag>
          </el-tooltip>

          <!-- 调试信息 -->
          <!-- 调试信息已移除，避免响应式更新导致的无限递归 -->
        </h2>

        <!-- 组管理按�?-->
        <div class="group-management">
          <el-button
            type="primary"
            plain
            @click="openGroupManagement"
            class="group-btn"
          >
            <IconifyIconOnline icon="ri:folder-open-line" class="mr-1" />
            组管�?
          </el-button>
        </div>
      </div>

      <div class="toolbar-right">
        <!-- 筛选器 -->
        <el-tooltip content="按分组筛�? placement="bottom" :show-after="500">
          <el-select
            v-model="filterGroup"
            placeholder="分组"
            clearable
            size="small"
            class="filter-select"
          >
            <el-option label="全部" value="" />
            <el-option
              v-for="group in serverGroups"
              :key="group"
              :label="group"
              :value="group"
            />
          </el-select>
        </el-tooltip>

        <el-tooltip content="按协议筛�? placement="bottom" :show-after="500">
          <el-select
            v-model="filterProtocol"
            placeholder="协议"
            clearable
            size="small"
            class="filter-select"
          >
            <el-option label="SSH" value="SSH" />
            <el-option label="RDP" value="RDP" />
            <el-option label="VNC" value="VNC" />
          </el-select>
        </el-tooltip>

        <el-tooltip content="按状态筛�? placement="bottom" :show-after="500">
          <el-select
            v-model="filterStatus"
            placeholder="状�?
            clearable
            size="small"
            class="filter-select"
          >
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="异常" value="error" />
          </el-select>
        </el-tooltip>

        <!-- 搜索 -->
        <el-tooltip
          content="搜索服务器名称、地址或描�?
          placement="bottom"
          :show-after="500"
        >
          <el-input
            v-model="searchKeyword"
            placeholder="搜索服务�?.."
            size="small"
            class="search-input"
            clearable
          >
            <template #prefix>
              <IconifyIconOnline icon="ep:search" />
            </template>
          </el-input>
        </el-tooltip>

        <!-- 操作按钮�?-->
        <div class="action-buttons">
          <el-tooltip
            content="重置筛选条�?
            placement="bottom"
            :show-after="500"
          >
            <el-button size="small" @click="handleResetFilters">
              <IconifyIconOnline icon="ep:refresh-left" class="mr-1" />
              重置
            </el-button>
          </el-tooltip>

          <el-tooltip
            content="刷新服务器列�?
            placement="bottom"
            :show-after="500"
          >
            <el-button size="small" @click="handleRefreshServerList">
              <IconifyIconOnline icon="ep:refresh" class="mr-1" />
              刷新
            </el-button>
          </el-tooltip>

          <el-tooltip content="新增服务�? placement="bottom" :show-after="500">
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
                  <!-- <el-dropdown-item command="import" title="从文件导入服务器配置">
                    <IconifyIconOnline icon="ri:upload-line" class="mr-2" />
                    导入配置
                  </el-dropdown-item>
                  <el-dropdown-item command="export" title="导出服务器配置到文件">
                    <IconifyIconOnline icon="ri:download-line" class="mr-2" />
                    导出配置
                  </el-dropdown-item>
                  <el-dropdown-item command="batch" title="批量管理多台服务�?>
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
                  </el-dropdown-item> -->
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- 主体内容区域 -->
    <div class="main-content">
      <!-- 左侧服务器列�?-->
      <div
        class="left-panel"
        :class="{ minimized: leftPanelMinimized }"
        :style="{ width: leftPanelMinimized ? '60px' : leftPanelWidth + 'px' }"
      >
        <!-- 面板头部控制�?-->
        <div class="panel-header">
          <div class="panel-title" v-if="!leftPanelMinimized">
            <IconifyIconOnline icon="ri:server-line" class="mr-2" />
            <span>服务器列�?/span>
            <el-badge
              :value="filteredServers.length"
              class="ml-2"
              type="primary"
            />
          </div>
          <div class="panel-controls">
            <el-tooltip
              :content="leftPanelMinimized ? '展开面板' : '最小化面板'"
              placement="right"
              :show-after="300"
            >
              <el-button
                size="small"
                text
                @click="toggleLeftPanel"
                class="minimize-btn"
              >
                <IconifyIconOnline
                  :icon="
                    leftPanelMinimized
                      ? 'ri:arrow-right-s-line'
                      : 'ri:arrow-left-s-line'
                  "
                />
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <!-- 服务器分组标�?-->
        <div
          class="group-tabs"
          v-if="serverGroups.length > 0 && !leftPanelMinimized"
        >
          <el-tooltip
            content="按分组查看服务器"
            placement="bottom"
            :show-after="500"
          >
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

        <!-- 服务器卡片列�?-->
        <div class="server-list modern-scrollbar" v-loading="loading">
          <!-- 最小化状态下的简化服务器列表 -->
          <template v-if="leftPanelMinimized">
            <!-- 最小化状态下的空状�?-->
            <div v-if="filteredServers.length === 0" class="server-mini-empty">
              <el-tooltip
                content="暂无服务器，点击展开面板查看详情"
                placement="right"
                :show-after="300"
              >
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
                  selected: selectedServerId === server.id,
                  online: server.onlineStatus === ONLINE_STATUS.ONLINE,
                  offline: server.onlineStatus === ONLINE_STATUS.OFFLINE,
                  error: server.status === SERVER_STATUS.ERROR,
                }"
                @click="selectServer(server)"
              >
                <IconifyIconOnline
                  icon="ri:server-line"
                  class="server-mini-icon"
                />
                <div
                  class="server-mini-status"
                  :class="
                    server.onlineStatus === ONLINE_STATUS.ONLINE
                      ? 'online'
                      : 'offline'
                  "
                />
              </div>
            </el-tooltip>
          </template>

          <!-- 正常状态下的完整服务器列表 -->
          <template v-else>
            <!-- 正常状态下的空状�?-->
            <el-empty
              v-if="filteredServers.length === 0"
              description="暂无服务�?
            >
              <el-tooltip
                content="点击新增第一台服务器"
                placement="top"
                :show-after="500"
              >
                <el-button type="primary" @click="showAddDialog"
                  >新增服务�?/el-button
                >
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
                    selected: selectedServerId === server.id,
                    online: server.onlineStatus === ONLINE_STATUS.ONLINE,
                    offline: server.onlineStatus === ONLINE_STATUS.OFFLINE,
                    error: server.status === SERVER_STATUS.ERROR,
                  }"
                  @click="selectServer(server)"
                >
                  <!-- 服务器卡片头�?-->
                  <div class="card-header">
                    <div class="server-info">
                      <el-tooltip
                        :content="`服务器名�? ${server.name}`"
                        placement="top"
                        :show-after="300"
                      >
                        <div class="server-name">{{ server.name }}</div>
                      </el-tooltip>
                      <el-tooltip
                        :content="`服务器地址: ${server.host}:${server.port} ${server.isLocal ? '(本机服务�?' : '(远程服务�?'}`"
                        placement="top"
                        :show-after="300"
                      >
                        <div
                          class="server-address !flex !flex-col justify-center !items-start"
                        >
                          <el-tooltip
                            :content="`连接协议: ${server.protocol}`"
                            placement="top"
                            :show-after="300"
                          >
                            <IconifyIconOnline
                              :icon="getProtocolIcon(server.protocol)"
                              class="protocol-icon"
                            />
                          </el-tooltip>
                          <span>{{ server.host }}:{{ server.port }}</span>
                          <el-tag
                            v-if="server.isLocal"
                            type="success"
                            size="small"
                            effect="light"
                            class="ml-1"
                            >本机</el-tag
                          >
                          <el-tag
                            v-else
                            type="primary"
                            size="small"
                            effect="light"
                            class="ml-1"
                            >远程</el-tag
                          >
                        </div>
                      </el-tooltip>
                    </div>
                    <div class="server-status">
                      <el-tooltip
                        :content="`服务器状�? ${getOnlineStatusText(server.onlineStatus, server.isLocal)}`"
                        placement="top"
                        :show-after="300"
                      >
                        <el-tag
                          :type="
                            getOnlineStatusType(
                              server.onlineStatus,
                              server.isLocal
                            )
                          "
                          size="small"
                          effect="light"
                        >
                          {{
                            getOnlineStatusText(
                              server.onlineStatus,
                              server.isLocal
                            )
                          }}
                        </el-tag>
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
                        v-if="
                          realTimeMetricsEnabled &&
                          getServerHealthStatus(server.id) !== 'unknown'
                        "
                        :content="`健康状�? ${getHealthStatusText(getServerHealthStatus(server.id))}`"
                        placement="top"
                        :show-after="300"
                      >
                        <el-tag
                          :type="
                            getHealthStatusType(
                              getServerHealthStatus(server.id)
                            )
                          "
                          size="small"
                          effect="light"
                          class="health-status"
                        >
                          <IconifyIconOnline
                            :icon="
                              getHealthStatusIcon(
                                getServerHealthStatus(server.id)
                              )
                            "
                            class="mr-1"
                          />
                          {{
                            getHealthStatusText(
                              getServerHealthStatus(server.id)
                            )
                          }}
                        </el-tag>
                      </el-tooltip>
                    </div>
                  </div>

                  <!-- 实时指标显示（美化版�?-->
                  <div
                    v-if="server.metricsSupport && getServerMetrics(server.id)"
                    class="metrics-cards"
                  >
                    <!-- CPU 使用�?-->
                    <div class="metric-card-new cpu-card">
                      <div class="metric-icon">
                        <IconifyIconOnline icon="ri:cpu-line" />
                      </div>
                      <div class="metric-info">
                        <div class="metric-label">CPU</div>
                        <div
                          class="metric-value"
                          :class="
                            getMetricClass(
                              getServerMetrics(server.id)?.cpuUsage || 0
                            )
                          "
                        >
                          {{
                            Math.round(
                              getServerMetrics(server.id)?.cpuUsage || 0
                            )
                          }}%
                        </div>
                      </div>
                      <div class="metric-progress">
                        <div
                          class="progress-bar"
                          :class="
                            getMetricClass(
                              getServerMetrics(server.id)?.cpuUsage || 0
                            )
                          "
                          :style="{
                            width: `${Math.min(100, getServerMetrics(server.id)?.cpuUsage || 0)}%`,
                          }"
                        />
                      </div>
                    </div>

                    <!-- 内存使用�?-->
                    <div class="metric-card-new memory-card">
                      <div class="metric-icon">
                        <IconifyIconOnline icon="ri:database-2-line" />
                      </div>
                      <div class="metric-info">
                        <div class="metric-label">内存</div>
                        <div
                          class="metric-value"
                          :class="
                            getMetricClass(
                              getServerMetrics(server.id)?.memoryUsage || 0
                            )
                          "
                        >
                          {{
                            Math.round(
                              getServerMetrics(server.id)?.memoryUsage || 0
                            )
                          }}%
                        </div>
                      </div>
                      <div class="metric-progress">
                        <div
                          class="progress-bar"
                          :class="
                            getMetricClass(
                              getServerMetrics(server.id)?.memoryUsage || 0
                            )
                          "
                          :style="{
                            width: `${Math.min(100, getServerMetrics(server.id)?.memoryUsage || 0)}%`,
                          }"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="card-actions" @click.stop>
                    <el-button-group>
                      <el-tooltip
                        content="连接服务�?
                        placement="top"
                        :show-after="500"
                      >
                        <el-button
                          size="small"
                          type="primary"
                          @click.stop.prevent="connectServer(server)"
                        >
                          <IconifyIconOnline icon="ri:play-line" />
                        </el-button>
                      </el-tooltip>
                      <el-tooltip
                        content="查看监控"
                        placement="top"
                        :show-after="500"
                      >
                        <el-button
                          size="small"
                          @click.stop.prevent="showServerInfo(server)"
                        >
                          <IconifyIconOnline icon="ri:information-line" />
                        </el-button>
                      </el-tooltip>
                      <el-tooltip
                        content="编辑服务�?
                        placement="top"
                        :show-after="500"
                      >
                        <el-button
                          size="small"
                          @click.stop.prevent="editServer(server)"
                        >
                          <IconifyIconOnline icon="ri:edit-line" />
                        </el-button>
                      </el-tooltip>
                      <el-tooltip
                        content="配置管理"
                        placement="top"
                        :show-after="500"
                      >
                        <el-button
                          size="small"
                          type="primary"
                          plain
                          @click.stop.prevent="openServerConfig(server)"
                        >
                          <IconifyIconOnline icon="ri:settings-3-line" />
                        </el-button>
                      </el-tooltip>
                      <el-tooltip
                        content="更多操作"
                        placement="top"
                        :show-after="500"
                      >
                        <el-dropdown
                          @command="(cmd) => handleServerAction(cmd, server)"
                          @click.stop.prevent
                        >
                          <el-button size="small">
                            <IconifyIconOnline icon="ri:more-line" />
                          </el-button>
                          <template #dropdown>
                            <el-dropdown-menu>
                              <el-dropdown-item
                                command="test"
                                title="测试服务器连接状�?
                              >
                                <IconifyIconOnline
                                  icon="ri:wifi-line"
                                  class="mr-2"
                                />
                                测试连接
                              </el-dropdown-item>
                              <el-dropdown-item
                                command="files"
                                title="打开文件管理�?
                              >
                                <IconifyIconOnline
                                  icon="ri:folder-line"
                                  class="mr-2"
                                />
                                文件管理
                              </el-dropdown-item>
                              <el-dropdown-item
                                command="script"
                                title="在服务器上执行脚�?
                              >
                                <IconifyIconOnline
                                  icon="ri:terminal-line"
                                  class="mr-2"
                                />
                                执行脚本
                              </el-dropdown-item>
                              <el-dropdown-item
                                command="log"
                                title="查看服务器操作日�?
                              >
                                <IconifyIconOnline
                                  icon="ri:file-list-line"
                                  class="mr-2"
                                />
                                操作日志
                              </el-dropdown-item>
                              <el-dropdown-item
                                command="delete"
                                divided
                                title="删除此服务器配置"
                              >
                                <IconifyIconOnline
                                  icon="ri:delete-bin-line"
                                  class="mr-2"
                                />
                                删除服务�?
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

      <!-- 拖拽分割�?-->
      <el-tooltip
        content="拖拽调整面板宽度"
        placement="right"
        :show-after="500"
        v-if="!leftPanelMinimized"
      >
        <div class="resize-handle" @mousedown="startResize" />
      </el-tooltip>

      <!-- 右侧内容区域 -->
      <div class="right-panel">
        <div v-if="!selectedServerId" class="welcome-panel">
          <el-empty description="请选择一个服务器">
            <el-tooltip
              content="点击新增第一台服务器"
              placement="top"
              :show-after="500"
            >
              <el-button type="primary" @click="showAddDialog"
                >新增服务�?/el-button
              >
            </el-tooltip>
          </el-empty>
        </div>

        <!-- 动态组件区�?-->
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
                :server="convertServerForRemoteDesktop(selectedServer)"
                :key="selectedServerId + '-remote'"
                @close="closeRightPanel"
              />
              <!-- 服务器监控组�?-->
              <ServerMonitor
                v-else-if="currentComponent === 'ServerMonitor'"
                :server="selectedServer"
                :metrics-data="getServerMonitorMetrics(selectedServerId)"
                :metrics-loading="loading"
                :key="selectedServerId + '-monitor'"
                @close="closeRightPanel"
                @refresh-metrics="handleRefreshMetrics"
              />
              <!-- 文件管理组件 -->
              <FileManager
                v-else-if="currentComponent === 'FileManager'"
                :server="selectedServer"
                :key="selectedServerId + '-files'"
                @close="closeRightPanel"
              />
              <!-- 脚本管理组件 -->
              <ScriptManagement
                v-else-if="currentComponent === 'ScriptManagement'"
                :server="selectedServer"
                :key="selectedServerId + '-script'"
                @close="closeRightPanel"
              />
              <!-- 服务器详情组�?-->
              <ServerDetailComponents
                v-else-if="currentComponent === 'ServerDetailComponents'"
                :server-id="Number(selectedServerId)"
                :data="selectedServer"
                :key="selectedServerId + '-detail'"
              />
              <!-- 默认显示监控组件 -->
              <ServerMonitor
                v-else
                :server="selectedServer"
                :metrics-data="getServerMonitorMetrics(selectedServerId)"
                :metrics-loading="loading"
                :key="selectedServerId + '-default'"
                @close="closeRightPanel"
                @refresh-metrics="handleRefreshMetrics"
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

    <!-- 对话框组�?-->
    <ServerEditDialog
      ref="editDialogRef"
      @success="handleSuccess"
      @openConfig="handleOpenConfig"
    />
    <ServerConfigDialog ref="configDialogRef" @success="handleSuccess" />
    <BatchOperationDialog ref="batchDialogRef" @success="handleSuccess" />
    <ScriptExecutorDialog ref="scriptDialogRef" />
    <AlertConfigDialog ref="alertDialogRef" />
    <OperationLogDialog ref="logDialogRef" />
    <ServerGroupManageDialog
      ref="groupManageDialogRef"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ONLINE_STATUS,
  SERVER_STATUS,
  type ServerDisplayData,
} from "@/api/server";
import { useGlobalServerLatency } from "@/composables/useServerLatency";
import { useServerMetricsStore } from "@/stores/serverMetrics";
import ScProgress from "@repo/components/ScProgress/index.vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import {
  Suspense,
  computed,
  defineAsyncComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import { useRouter } from "vue-router";

// 定义 props 接收来自父组件的数据
interface Props {
  servers?: any[];
  serverMetrics?: Map<string, any>;
  wsConnected?: boolean;
  totalCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  servers: () => [],
  serverMetrics: () => new Map(),
  wsConnected: false,
  totalCount: 0,
});

// 定义 emits 向父组件发送事�?
const emit = defineEmits<{
  "refresh-servers": [];
  "server-action": [action: string, server: any];
  "select-server": [server: any];
}>();
// 移除 WebSocket 导入，改为通过 props 接收数据

// 异步组件
const ServerEditDialog = defineAsyncComponent(
  () => import("./components/ServerEditDialog.vue")
);
const ServerConfigDialog = defineAsyncComponent(
  () => import("./components/ServerConfigDialog.vue")
);
const BatchOperationDialog = defineAsyncComponent(
  () => import("../../components/dialogs/BatchOperationDialog.vue")
);
const ScriptExecutorDialog = defineAsyncComponent(
  () => import("../../components/dialogs/ScriptExecutorDialog.vue")
);
const AlertConfigDialog = defineAsyncComponent(
  () => import("../../components/dialogs/AlertConfigDialog.vue")
);
const OperationLogDialog = defineAsyncComponent(
  () => import("../../components/dialogs/OperationLogDialog.vue")
);
const ServerGroupManageDialog = defineAsyncComponent(
  () => import("./components/ServerGroupManageDialog.vue")
);

// 远程连接组件
const SSHTerminal = defineAsyncComponent(
  () => import("./components/remote/SSHTerminal.vue")
);
const RemoteDesktop = defineAsyncComponent(
  () => import("./components/remote/RemoteDesktop.vue")
);
const ServerMonitor = defineAsyncComponent(
  () => import("./components/ServerMonitor.vue")
);
const FileManager = defineAsyncComponent(
  () => import("../file-management/index.vue")
);
const ServerLatencyDisplay = defineAsyncComponent(
  () => import("../../components/ServerLatencyDisplay.vue")
);
const ServerDetailComponents = defineAsyncComponent(
  () => import("../server-detail-components/layout/index.vue")
);
const ScriptManagement = defineAsyncComponent(
  () => import("../../../script-management/index.vue")
);

// 路由实例
const router = useRouter();

// 响应式状�?
const loading = ref(false);
const viewMode = ref("card");

// 筛选和搜索
const searchKeyword = ref("");
const filterGroup = ref("");
const filterProtocol = ref("");
const filterStatus = ref("");
const activeGroup = ref("all");
// totalCount 现在�?props 获取

// 左右面板
const leftPanelWidth = ref(400);
const leftPanelMinimized = ref(false);
const leftPanelOriginalWidth = ref(400);
const selectedServerId = ref("");
const currentComponent = ref("");

// 服务器数�?- �?props 获取
const servers = computed(() => props.servers || []);
const serverGroups = computed(() => {
  const groups = new Set<string>();
  servers.value.forEach((server) => {
    if (server.group) {
      groups.add(server.group);
    }
  });
  return Array.from(groups);
});
const selectedServer = computed(() =>
  servers.value.find((s) => s.id === selectedServerId.value)
);

// 服务器指标数�?- �?props 获取
const serverMetrics = computed(() => props.serverMetrics || new Map());

// WebSocket连接状�?- �?props 获取
const wsConnected = computed(() => props.wsConnected || false);

// 消息统计已移至非响应式对象，避免无限递归

// 服务器指标监�?
const metricsStore = useServerMetricsStore();
const realTimeMetricsEnabled = ref(true);
const metricsUpdateInterval = ref(30); // �?

// 延迟管理
const latencyManager = useGlobalServerLatency();

// 对话框引�?
const editDialogRef = ref();
const configDialogRef = ref();
const batchDialogRef = ref();
const scriptDialogRef = ref();
const alertDialogRef = ref();
const logDialogRef = ref();
const groupManageDialogRef = ref();

// 本地调试
const localDebugVisible = ref(false);

// 本地状态映射（作为备用方案�?
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

// 计算属�?
const filteredServers = computed(() => {
  let result = servers.value;

  // 按分组筛�?
  if (activeGroup.value !== "all") {
    result = result.filter((server) => server.group === activeGroup.value);
  }

  // 按协议筛�?
  if (filterProtocol.value) {
    result = result.filter(
      (server) => server.protocol === filterProtocol.value
    );
  }

  // 按状态筛�?
  if (filterStatus.value) {
    result = result.filter((server) => {
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
    result = result.filter(
      (server) =>
        server.name.toLowerCase().includes(keyword) ||
        server.host.toLowerCase().includes(keyword) ||
        (server.description &&
          server.description.toLowerCase().includes(keyword))
    );
  }

  return result;
});

/**
 * 获取服务器指标数�?
 */
const getServerMetrics = (serverId: string) => {
  // 优先使用store中的实时指标数据
  const metrics = metricsStore.getServerMetrics(parseInt(serverId));
  if (metrics) {
    return {
      cpuUsage: metrics.cpuUsage,
      memoryUsage: metrics.memoryUsage,
      diskUsage: metrics.diskUsage,
      networkIn: metrics.networkIn,
      networkOut: metrics.networkOut,
      status: metrics.status,
      uptime: metrics.uptime,
      processCount: metrics.processCount,
      loadAverage: metrics.loadAverage,
      temperature: metrics.temperature,
    };
  }

  // 回退到缓存的指标数据
  return serverMetrics.value.get(serverId);
};

/**
 * 获取服务器监控组件所需的指标数�?
 */
const getServerMonitorMetrics = (serverId: string | null) => {
  if (!serverId) return null;

  const metrics = metricsStore.getServerMetrics(parseInt(serverId));
  if (!metrics) return null;

  // 转换为ServerMonitor组件期望的数据格�?
  // 注意：metricsStore中的数据结构比较简单，需要适配到ServerMonitor期望的复杂结�?
  return {
    serverId: parseInt(serverId),
    collectTime: metrics.collectTime || new Date().toISOString(),
    status: metrics.status === "online" ? 1 : 0,
    responseTime: 0, // metricsStore中没有这个字�?
    cpu: {
      usage: metrics.cpuUsage || 0,
      cores: 1, // metricsStore中没有这个字段，使用默认�?
      load1m: 0, // metricsStore中没有这个字段，使用默认�?
      load5m: 0, // metricsStore中没有这个字段，使用默认�?
      load15m: 0, // metricsStore中没有这个字段，使用默认�?
    },
    memory: {
      total: 0, // metricsStore中没有这个字段，使用默认�?
      used: 0, // metricsStore中没有这个字段，使用默认�?
      free: 0, // metricsStore中没有这个字段，使用默认�?
      usage: metrics.memoryUsage || 0,
    },
    disk: {
      total: 0, // metricsStore中没有这个字段，使用默认�?
      used: 0, // metricsStore中没有这个字段，使用默认�?
      free: 0, // metricsStore中没有这个字段，使用默认�?
      usage: metrics.diskUsage || 0,
      partitions: metrics.diskPartitions || [], // 添加磁盘分区信息
    },
    network: {
      in: metrics.networkIn || 0,
      out: metrics.networkOut || 0,
    },
    osInfo: metrics.osInfo,
    osName: metrics.osName,
    osVersion: metrics.osVersion,
    hostname: metrics.hostname,
    uptime: metrics.uptime || 0,
    processCount: metrics.processCount || 0,
    loadAverage: metrics.loadAverage,
    temperature: metrics.temperature,
    networkInPackets: undefined, // metricsStore中没有这个字�?
    networkOutPackets: undefined, // metricsStore中没有这个字�?
    extraInfo: undefined, // metricsStore中没有这个字�?
  };
};

/**
 * 处理刷新指标数据请求
 */
const handleRefreshMetrics = async (serverId: string) => {
  try {
    console.log("收到刷新指标数据请求:", serverId);

    // 这里可以触发指标数据的刷�?
    // 由于数据是通过WebSocket实时推送的，这里主要是记录日志
    // 如果需要主动拉取数据，可以调用相关API

    // 可以触发一次数据更新检�?
    await nextTick();

    console.log("指标数据刷新完成");
  } catch (error) {
    console.error("刷新指标数据失败:", error);
  }
};

/**
 * 转换服务器数据为远程桌面组件所需的格�?
 */
const convertServerForRemoteDesktop = (server: ServerDisplayData | null) => {
  if (!server) return undefined;

  return {
    monitorSysGenServerId: parseInt(server.id),
    monitorSysGenServerName: server.name,
    monitorSysGenServerHost: server.host,
    monitorSysGenServerPort: server.port,
    monitorSysGenServerProtocol: server.protocol,
    monitorSysGenServerUsername: server.username,
    monitorSysGenServerPassword: undefined, // ServerDisplayData中没有password字段
  };
};

/**
 * 获取在线状态类�?
 */
const getOnlineStatusType = (status: number, isLocal: boolean) => {
  if (isLocal) {
    return "success";
  }
  // 添加类型检查和错误处理
  if (typeof status !== "number") {
    console.warn("getOnlineStatusType: status is not a number:", status);
    return "info";
  }

  // 使用本地映射确保安全
  return localOnlineStatusMap[status]?.color || "info";
};

/**
 * 获取在线状态文�?
 */
const getOnlineStatusText = (status: number, isLocal: boolean) => {
  if (isLocal) {
    return "在线";
  }
  // 添加类型检查和错误处理
  if (typeof status !== "number") {
    console.warn("getOnlineStatusText: status is not a number:", status);
    return "未知状�?;
  }

  // 使用本地映射确保安全
  return localOnlineStatusMap[status]?.text || "未知状�?;
};

/**
 * 获取协议图标
 */
const getProtocolIcon = (protocol: string) => {
  // 添加类型检查和错误处理
  if (typeof protocol !== "string") {
    console.warn("getProtocolIcon: protocol is not a string:", protocol);
    return "ri:server-line";
  }

  // 使用本地映射确保安全
  return (
    localProtocolIconMap[protocol as keyof typeof localProtocolIconMap] ||
    "ri:server-line"
  );
};

/**
 * 获取进度条颜色（支持渐变和不同指标类型）
 */
const getProgressColor = (percentage: number, metricType: string = "cpu") => {
  // 定义不同指标的阈�?
  const thresholds = {
    cpu: { normal: 50, warning: 80, critical: 90 },
    memory: { normal: 60, warning: 80, critical: 90 },
    disk: { normal: 70, warning: 85, critical: 95 },
    network: { normal: 60, warning: 80, critical: 90 },
  };

  const threshold =
    thresholds[metricType as keyof typeof thresholds] || thresholds.cpu;

  // 返回渐变色配�?
  return [
    { color: "#67c23a", percentage: threshold.normal },
    { color: "#e6a23c", percentage: threshold.warning },
    { color: "#f56c6c", percentage: 100 },
  ];
};

/**
 * ScProgress 阶段颜色
 */
const getProgressStages = (metricType: string) => {
  const thresholds = {
    cpu: { normal: 50, warning: 80, critical: 100 },
    memory: { normal: 60, warning: 85, critical: 100 },
    disk: { normal: 70, warning: 85, critical: 100 },
    network: { normal: 60, warning: 80, critical: 100 },
  } as const;
  const t = (thresholds as any)[metricType] || thresholds.cpu;
  return [
    { threshold: t.normal, color: "#67c23a" },
    { threshold: t.warning, color: "#e6a23c" },
    { threshold: t.critical, color: "#f56c6c" },
  ];
};

/**
 * 获取指标状态类（normal | warning | critical�?
 */
const getMetricStatusClass = (
  percentage: number,
  metricType: string = "cpu"
) => {
  const thresholds = {
    cpu: { normal: 50, warning: 80, critical: 90 },
    memory: { normal: 60, warning: 80, critical: 90 },
    disk: { normal: 70, warning: 85, critical: 95 },
    network: { normal: 60, warning: 80, critical: 90 },
  } as const;

  const t = thresholds[metricType as keyof typeof thresholds] || thresholds.cpu;
  if (percentage < t.normal) return "normal";
  if (percentage < t.warning) return "warning";
  return "critical";
};

/**
 * 获取指标样式类（用于美化卡片�?
 */
const getMetricClass = (percentage: number) => {
  if (percentage < 50) return "metric-normal";
  if (percentage < 80) return "metric-warning";
  return "metric-critical";
};

/**
 * 格式化网络速度
 */
const formatNetworkSpeed = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

/**
 * 刷新服务器列�?- 通知父组�?
 */
const loadServers = async () => {
  console.log("server-management: 通知父组件刷新服务器列表");
  emit("refresh-servers");
};

/**
 * 加载服务器延迟数�?
 */
const loadServerLatency = async () => {
  try {
    if (servers.value.length === 0) return;

    // 获取所有服务器ID
    const serverIds = servers.value.map((server) => Number(server.id));

    // 批量获取延迟数据
    await latencyManager.fetchBatchLatency(serverIds);

    // 更新服务器列表的延迟信息
    latencyManager.updateServerListLatency(servers.value);
  } catch (error) {
    console.error("加载服务器延迟数据失�?", error);
  }
};

/**
 * 选择服务�?- 显示详情组件
 */
const selectServer = (server: any) => {
  selectedServerId.value = server.id;
  currentComponent.value = "ServerDetailComponents";
  emit("select-server", server);
  console.log(`选择服务�?${server.name}，显示详情组件`);
};

/**
 * 连接服务�?- 通知父组�?
 */
const connectServer = async (server: any) => {
  console.log("server-management: 通知父组件连接服务器", server);
  selectedServerId.value = server.id;

  // 根据协议选择对应的远程组�?
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

  emit("server-action", "connect", server);
};

/**
 * 断开服务器连�?- 通知父组�?
 */
const disconnectServer = async (server: any) => {
  console.log("server-management: 通知父组件断开服务器连�?, server);

  // 清除选中状态和组件
  selectedServerId.value = "";
  currentComponent.value = "";

  emit("server-action", "disconnect", server);
};

/**
 * 显示服务器监控信�?
 */
const showServerInfo = (server: any) => {
  selectedServerId.value = server.id;
  currentComponent.value = "ServerMonitor";
};

/**
 * 编辑服务�?
 */
const editServer = (server: any) => {
  editDialogRef.value?.open("edit");
  editDialogRef.value?.setData(server);
};

/**
 * 打开服务器配置管�?
 */
const openServerConfig = (server: any) => {
  configDialogRef.value?.open(parseInt(server.id));
};

/**
 * 处理服务器操�?
 */
const handleServerAction = async (command: string, server: any) => {
  switch (command) {
    case "test":
      await testConnection(server);
      break;
    case "files":
      // 在新标签页中打开文件管理�?
      const routeData = router.resolve({
        name: "fileManager",
        params: {
          serverId: String(server.monitorSysGenServerId || server.id),
        },
      });
      window.open(routeData.href, "_blank");
      break;
    case "monitor":
      selectedServerId.value = server.id;
      currentComponent.value = "ServerMonitor";
      break;
    case "detail":
      // 跳转到服务器详情�?
      window.open(`/server/detail/${server.id}`, "_blank");
      break;
    case "script":
      selectedServerId.value = server.id;
      currentComponent.value = "ScriptManagement";
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
 * 测试连接 - 通知父组�?
 */
const testConnection = async (server: any) => {
  console.log("server-management: 通知父组件测试连�?, server);
  emit("server-action", "test", server);
};

/**
 * 删除服务器确�?- 通知父组�?
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

    console.log("server-management: 通知父组件删除服务器", server);

    if (selectedServerId.value === server.id) {
      selectedServerId.value = "";
      currentComponent.value = "";
    }

    emit("server-action", "delete", server);
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除服务器确认失�?", error);
    }
  }
};

/**
 * 显示新增对话�?
 */
const showAddDialog = () => {
  editDialogRef.value?.open("add");
  editDialogRef.value?.setData({});
};

/**
 * 处理工具栏操�?
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
 * 切换左侧面板最小化状�?
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
 * 开始拖拽调整大�?
 */
const startResize = (e: MouseEvent) => {
  // 如果面板已最小化，不允许拖拽
  if (leftPanelMinimized.value) return;

  const startX = e.clientX;
  const startWidth = leftPanelWidth.value;

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startX;
    const newWidth = startWidth + deltaX;

    // 限制最小和最大宽�?
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
 * 打开组管�?
 */
const openGroupManagement = () => {
  // 打开组管理弹�?
  groupManageDialogRef.value?.open();
};

/**
 * 处理刷新服务器列�?
 */
const handleRefreshServerList = async () => {
  try {
    message.info("正在刷新服务器列�?..");
    await loadServers();
    message.success("服务器列表刷新完�?);
  } catch (error) {
    console.error("刷新服务器列表失�?", error);
    message.error("刷新服务器列表失�?);
  }
};

/**
 * 处理重置筛选条�?
 */
const handleResetFilters = () => {
  searchKeyword.value = "";
  filterGroup.value = "";
  filterProtocol.value = "";
  filterStatus.value = "";
  activeGroup.value = "all";
  message.success("筛选条件已重置");
};

/**
 * 更新特定服务器的连接状�?
 */
const updateServerConnectionStatus = async (
  serverId: string,
  statusData: any
) => {
  try {
    // 使用nextTick避免立即的响应式更新导致无限递归
    await nextTick();

    const serverIndex = servers.value.findIndex(
      (server) => server.id === serverId
    );
    if (serverIndex !== -1) {
      // 创建新的服务器对象，避免直接修改原对�?
      const updatedServer = { ...servers.value[serverIndex] };

      // 更新服务器的连接状�?
      if (statusData && typeof statusData.connectionStatus !== "undefined") {
        updatedServer.connectionStatus = statusData.connectionStatus;
      }
      if (statusData && typeof statusData.onlineStatus !== "undefined") {
        updatedServer.onlineStatus = statusData.onlineStatus;
      }

      // 替换整个服务器对�?
      servers.value[serverIndex] = updatedServer;
      console.log(`已更新服务器 ${serverId} 的连接状�?`, statusData);
    }
  } catch (error) {
    console.error("更新服务器连接状态失�?", error);
  }
};

// 防抖更新服务器状态的Map，用于存储待更新的状�?
const pendingStatusUpdates = new Map<string, any>();
let statusUpdateTimer: NodeJS.Timeout | null = null;

/**
 * 防抖更新服务器状�?
 */
const debounceUpdateServerStatus = (serverId: string, statusData: any) => {
  // 存储待更新的状�?
  pendingStatusUpdates.set(serverId, statusData);

  // 清除之前的定时器
  if (statusUpdateTimer) {
    clearTimeout(statusUpdateTimer);
  }

  // 设置新的定时器，300ms后批量更�?
  statusUpdateTimer = setTimeout(async () => {
    try {
      // 批量更新所有待更新的服务器状�?
      for (const [id, data] of pendingStatusUpdates.entries()) {
        await updateServerConnectionStatus(id, data);
      }
      // 清空待更新列�?
      pendingStatusUpdates.clear();
    } catch (error) {
      console.error("批量更新服务器状态失�?", error);
    }
  }, 300);
};

/**
 * 处理打开服务器配置页�?
 */
const handleOpenConfig = (serverId: number) => {
  // 打开服务器配置对话框
  console.log("打开服务器配置页面，服务器ID:", serverId);
  configDialogRef.value?.open(serverId);
};

/**
 * 获取Socket连接状态文�?
 */
const getSocketStatusText = computed(() => {
  // 基于�?props 传入的连接状�?
  if (wsConnected.value) {
    // 连接成功后，再检查数据更新时�?
    const lastUpdate = metricsStore.getLastUpdateTime;
    const now = Date.now();
    const timeDiff = now - lastUpdate;

    console.info("数据更新时间�?", timeDiff);
    if (timeDiff < 60000) {
      // 1分钟内有更新
      return "已连�?;
    } else if (timeDiff < 300000) {
      // 5分钟内有更新
      return "连接延迟";
    } else {
      return "数据延迟";
    }
  } else {
    return "未连�?;
  }
});

/**
 * 获取Socket连接状态类�?
 */
const getSocketStatusType = computed(() => {
  // 基于�?props 传入的连接状�?
  if (wsConnected.value) {
    // 连接成功后，再检查数据更新时�?
    const lastUpdate = metricsStore.getLastUpdateTime;
    const now = Date.now();
    const timeDiff = now - lastUpdate;

    if (timeDiff < 60000) {
      // 1分钟内有更新
      return "success";
    } else if (timeDiff < 300000) {
      // 5分钟内有更新
      return "warning";
    } else {
      return "warning";
    }
  } else {
    return "danger";
  }
});

/**
 * 获取Socket连接状态图�?
 */
const getSocketStatusIcon = () => {
  // 基于�?props 传入的连接状�?
  if (wsConnected.value) {
    // 连接成功后，再检查数据更新时�?
    const lastUpdate = metricsStore.getLastUpdateTime;
    const now = Date.now();
    const timeDiff = now - lastUpdate;

    if (timeDiff < 60000) {
      // 1分钟内有更新
      return "ri:wifi-line";
    } else if (timeDiff < 300000) {
      // 5分钟内有更新
      return "ri:signal-wifi-1-line";
    } else {
      return "ri:signal-wifi-error-line";
    }
  } else {
    return "ri:wifi-off-line";
  }
};

/**
 * 获取服务器健康状�?
 */
const getServerHealthStatus = (serverId: string) => {
  if (!realTimeMetricsEnabled.value) {
    return "unknown";
  }

  // 使用store中的isServerInWarning方法判断健康状�?
  const isWarning = metricsStore.isServerInWarning(parseInt(serverId));
  return isWarning ? "warning" : "healthy";
};

/**
 * 获取健康状态文�?
 */
const getHealthStatusText = (status: string) => {
  switch (status) {
    case "healthy":
      return "健康";
    case "warning":
      return "警告";
    case "critical":
      return "严重";
    case "offline":
      return "离线";
    default:
      return "未知";
  }
};

/**
 * 获取健康状态类�?
 */
const getHealthStatusType = (status: string) => {
  switch (status) {
    case "healthy":
      return "success";
    case "warning":
      return "warning";
    case "critical":
      return "danger";
    case "offline":
      return "info";
    default:
      return "info";
  }
};

/**
 * 获取健康状态图�?
 */
const getHealthStatusIcon = (status: string) => {
  switch (status) {
    case "healthy":
      return "ri:heart-pulse-line";
    case "warning":
      return "ri:error-warning-line";
    case "critical":
      return "ri:alarm-warning-line";
    case "offline":
      return "ri:heart-line";
    default:
      return "ri:question-line";
  }
};

// 消息统计已禁用，避免无限递归问题

// WebSocket 消息监听已移除，所有数据通过 props 从父组件获取

// 生命周期钩子
onMounted(async () => {
  // 不再直接加载服务器列表，数据由父组件提供
  console.log("server-management 组件已挂载，等待父组件数�?);
});

onUnmounted(() => {
  // 不再管理 WebSocket 连接，由父组件统一管理
  console.log("server-management 组件已卸�?);
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

/* 工具栏样�?*/
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  border-bottom: none;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;

  // 装饰性波�?
  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%
    );
    animation: toolbarShimmer 4s ease-in-out infinite;
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 20px;
    position: relative;
    z-index: 1;

    .page-title {
      font-size: 26px;
      font-weight: 700;
      margin: 0;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 12px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      .iconify {
        font-size: 32px;
        color: #fff;
        padding: 8px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        backdrop-filter: blur(5px);
      }

      .server-count {
        margin-left: 16px;
        font-size: 13px;
        padding: 6px 14px;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        font-weight: 500;
        color: #fff;
        backdrop-filter: blur(5px);

        .count-num {
          font-weight: 700;
          color: #fff;
        }
      }

      .el-tag {
        border-radius: 16px;
        font-weight: 500;
        padding: 4px 12px;
        border: none;
        background: rgba(255, 255, 255, 0.2) !important;
        color: #fff !important;
        backdrop-filter: blur(5px);
      }
    }

    .group-management {
      .group-btn {
        border: none;
        font-weight: 600;
        padding: 10px 20px;
        border-radius: 10px;
        transition: all 0.3s ease;
        background: rgba(255, 255, 255, 0.2) !important;
        color: #fff !important;
        backdrop-filter: blur(5px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

        &:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.3) !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        &:active {
          transform: translateY(0);
        }

        .iconify {
          font-size: 16px;
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

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: 16px;
      padding-left: 16px;
      border-left: 1px solid var(--el-border-color-lighter);
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
        background: linear-gradient(
          135deg,
          var(--el-color-primary) 0%,
          var(--el-color-primary-dark-2) 100%
        );
        border: none;

        &:hover {
          background: linear-gradient(
            135deg,
            var(--el-color-primary-light-3) 0%,
            var(--el-color-primary) 100%
          );
        }
      }
    }
  }
}

/* 主体内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  gap: 2px;
}

/* 左侧面板 */
.left-panel {
  background: linear-gradient(
    180deg,
    var(--el-bg-color) 0%,
    var(--el-fill-color-extra-light) 100%
  );
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

/* 面板头部控制�?*/
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-bg-color-overlay);
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
  background: var(--el-bg-color-overlay);
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
    background: var(--el-bg-color-overlay);

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
        background: linear-gradient(
          135deg,
          var(--el-color-primary-light-9) 0%,
          var(--el-color-primary-light-8) 100%
        );
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }

    :deep(.el-tabs__active-bar) {
      background: linear-gradient(
        90deg,
        var(--el-color-primary) 0%,
        var(--el-color-primary-light-3) 100%
      );
      height: 3px;
      border-radius: 2px;
    }
  }

  .server-list {
    flex: 1;
    overflow-y: auto;
    padding: 20px;

    /* 统一的细滚动条样�?*/
    &::-webkit-scrollbar {
      width: 4px;
      height: 4px;
      border-radius: 2px;
      background-color: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(140, 140, 140, 0.3);
      border-radius: 2px;
      box-shadow: inset 0 0 6px rgba(140, 140, 140, 0.3);

      &:hover {
        background: rgba(140, 140, 140, 0.5);
      }
    }

    &::-webkit-scrollbar-track {
      background-color: rgba(140, 140, 140, 0);
      border-radius: 2px;
      box-shadow: inset 0 0 6px rgba(140, 140, 140, 0);
    }

    .server-card {
      background: linear-gradient(
        135deg,
        var(--el-bg-color) 0%,
        var(--el-fill-color-extra-light) 100%
      );
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
        content: "";
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
        background: linear-gradient(
          135deg,
          var(--el-color-primary-light-9) 0%,
          var(--el-bg-color) 100%
        );
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
        background: linear-gradient(
          180deg,
          var(--el-color-success) 0%,
          var(--el-color-success-dark-2) 100%
        );
        width: 5px;
      }

      &.offline::before {
        background: linear-gradient(
          180deg,
          var(--el-color-danger) 0%,
          var(--el-color-danger-dark-2) 100%
        );
        width: 5px;
      }

      &.error::before {
        background: linear-gradient(
          180deg,
          var(--el-color-warning) 0%,
          var(--el-color-warning-dark-2) 100%
        );
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
            background: linear-gradient(
              135deg,
              var(--el-text-color-primary) 0%,
              var(--el-color-primary) 100%
            );
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .server-address {
            display: flex;
            font-size: 13px;
            color: var(--el-text-color-secondary);
            font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;
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

      /* 新的指标卡片样式 */
      .metrics-cards {
        margin: 12px 0;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      /* 美化版指标卡�?*/
      .metric-card-new {
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.9) 0%,
          rgba(248, 250, 252, 0.95) 100%
        );
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 12px;
        padding: 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
          border-color: rgba(102, 126, 234, 0.3);
        }

        .metric-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        &.cpu-card .metric-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        &.memory-card .metric-icon {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: #fff;
          box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);
        }

        .metric-info {
          flex: 1;
          min-width: 0;

          .metric-label {
            font-size: 11px;
            font-weight: 500;
            color: var(--el-text-color-secondary);
            margin-bottom: 2px;
          }

          .metric-value {
            font-size: 18px;
            font-weight: 700;
            font-family: "JetBrains Mono", monospace;

            &.metric-normal {
              color: #10b981;
            }

            &.metric-warning {
              color: #f59e0b;
            }

            &.metric-critical {
              color: #ef4444;
              animation: pulse-critical 1.5s ease-in-out infinite;
            }
          }
        }

        .metric-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(226, 232, 240, 0.5);
          border-radius: 0 0 12px 12px;
          overflow: hidden;

          .progress-bar {
            height: 100%;
            border-radius: 0 0 12px 12px;
            transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);

            &.metric-normal {
              background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
            }

            &.metric-warning {
              background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
            }

            &.metric-critical {
              background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
              animation: progress-glow 1.5s ease-in-out infinite;
            }
          }
        }
      }

      @keyframes pulse-critical {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }

      @keyframes progress-glow {
        0%,
        100% {
          box-shadow: 0 0 5px rgba(239, 68, 68, 0.5);
        }
        50% {
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.8);
        }
      }

      .metric-card {
        background: linear-gradient(
          135deg,
          var(--el-fill-color-extra-light) 0%,
          var(--el-fill-color-light) 100%
        );
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 8px;
        padding: 0;
        height: 48px;
        display: flex;
        backdrop-filter: blur(5px);
        transition: box-shadow 0.3s ease;

        &:hover {
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
        }
      }

      .metric-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }

      .metric-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        color: var(--el-text-color-secondary);
      }

      .metric-card-value {
        font-size: 12px;
        font-weight: 700;
        color: var(--el-text-color-primary);
      }

      .wave-track {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 6px;
        overflow: hidden;
        --track-bg: var(--el-fill-color-light);
        background: var(--track-bg);
        border: 1px solid var(--el-border-color-lighter);
      }

      .wave-fill {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 0%;
        transition: width 0.6s ease;
        border-radius: 6px;
      }

      /* 颜色分级 */
      .wave-track.normal .wave-fill {
        background: linear-gradient(90deg, #67c23a 0%, #5daf34 100%);
      }
      .wave-track.warning .wave-fill {
        background: linear-gradient(90deg, #e6a23c 0%, #cf8a24 100%);
      }
      .wave-track.critical .wave-fill {
        background: linear-gradient(90deg, #f56c6c 0%, #dd4b4b 100%);
      }

      /* 右侧为波浪形边缘（动态海浪动画） */
      .wave-fill::after {
        content: "";
        position: absolute;
        right: -8px;
        top: 0;
        bottom: 0;
        width: 16px;
        background:
          radial-gradient(
              8px 8px at 8px 6px,
              transparent 7.6px,
              var(--track-bg) 7.7px
            )
            0 0/100% 16px repeat-y,
          radial-gradient(
              8px 8px at 8px 14px,
              var(--track-bg) 7.6px,
              transparent 7.7px
            )
            0 8px/100% 16px repeat-y;
        animation: wave-edge-move 4.8s linear infinite;
        pointer-events: none;
      }

      .wave-label {
        position: absolute;
        right: 28px; /* 与右侧波浪边保持间距 */
        top: 50%;
        transform: translateY(-50%);
        font-size: 14px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
        pointer-events: none;
        z-index: 1;
      }

      .wave-label-left {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        pointer-events: none;
        z-index: 1;
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

/* 拖拽分割�?*/
.resize-handle {
  width: 6px;
  background: linear-gradient(
    180deg,
    var(--el-border-color-light) 0%,
    var(--el-border-color) 100%
  );
  cursor: col-resize;
  transition: all 0.3s ease;
  position: relative;

  &::before {
    content: "";
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
    background: linear-gradient(
      180deg,
      var(--el-color-primary-light-7) 0%,
      var(--el-color-primary) 100%
    );

    &::before {
      background: var(--el-bg-color-overlay);
      opacity: 1;
      height: 30px;
    }
  }
}

/* 右侧面板 */
.right-panel {
  flex: 1;
  background: linear-gradient(
    180deg,
    var(--el-bg-color) 0%,
    var(--el-fill-color-extra-light) 100%
  );
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0 12px 12px 0;

  .welcome-panel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      135deg,
      var(--el-bg-color-page) 0%,
      var(--el-fill-color-extra-light) 100%
    );

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
        background: linear-gradient(
          135deg,
          var(--el-color-primary) 0%,
          var(--el-color-primary-dark-2) 100%
        );
        border: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
          background: linear-gradient(
            135deg,
            var(--el-color-primary-light-3) 0%,
            var(--el-color-primary) 100%
          );
        }
      }
    }
  }

  .dynamic-component-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--el-bg-color-overlay);
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
@keyframes toolbarShimmer {
  0%,
  100% {
    transform: translateX(-30%) translateY(-30%) rotate(0deg);
  }
  50% {
    transform: translateX(30%) translateY(30%) rotate(180deg);
  }
}

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
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 波纹动画：水平向右移�?*/
@keyframes wave-move {
  from {
    background-position-x: 0;
  }
  to {
    background-position-x: 300px;
  }
}

@keyframes wave-move-2 {
  from {
    background-position-x: 0;
  }
  to {
    background-position-x: 300px;
  }
}

/* 右侧波浪边框的上下漂移动�?*/
@keyframes wave-edge-move {
  from {
    background-position:
      0 0,
      0 8px;
  }
  to {
    background-position:
      0 16px,
      0 24px;
  }
}

.server-container {
  animation: fadeInUp 0.6s ease-out;
}

.server-card {
  animation: slideInLeft 0.4s ease-out;
  animation-fill-mode: both;

  &:nth-child(1) {
    animation-delay: 0.1s;
  }
  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  &:nth-child(3) {
    animation-delay: 0.3s;
  }
  &:nth-child(4) {
    animation-delay: 0.4s;
  }
  &:nth-child(5) {
    animation-delay: 0.5s;
  }
}

/* 响应式设�?*/
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

/* 加载状态优�?*/
.server-list[v-loading] {
  .server-card {
    animation: pulse 1.5s ease-in-out infinite;
  }
}

/* 滚动优化 */
.server-list {
  scroll-behavior: smooth;
}

/* 焦点状态优�?*/
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
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s infinite;
}

/* WebSocket连接状态样�?*/
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

/* 响应式优�?*/
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 16px;
    padding: 16px;

    .toolbar-left,
    .toolbar-right {
      width: 100%;
      justify-content: center;
    }

    .toolbar-right {
      flex-wrap: wrap;
      gap: 8px;

      .action-buttons {
        margin-left: 0;
        padding-left: 0;
        border-left: none;
        gap: 6px;
      }

      .search-input {
        width: 200px;
      }

      .filter-select {
        width: 100px;
      }
    }
  }

  .metrics-switch {
    margin-left: 0;
    margin-top: 8px;
  }

  .health-status {
    margin-left: 0;
    margin-top: 4px;
  }
}
:deep(.tag-container > span) {
  display: flex;
  align-items: center;
  flex-direction: column;
}

/* 空状态组件样�?*/
.empty-component-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  border: 1px dashed var(--el-border-color-light);

  .empty-content {
    text-align: center;
    padding: 40px;

    .empty-icon {
      font-size: 64px;
      color: var(--el-text-color-placeholder);
      margin-bottom: 16px;
    }

    h3 {
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
      font-size: 18px;
      font-weight: 500;
    }

    p {
      margin: 0 0 24px 0;
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
  }
}
</style>
