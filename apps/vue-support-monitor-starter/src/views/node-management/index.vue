<template>
  <div class="node-management-container">
    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <ScCard
          layout="stats"
          label="总节点数"
          :value="animatedStats.totalNodes"
          icon="ri:server-line"
          theme="primary"
          trendText="实时更新"
          hoverable
          class="stat-card-item"
          @click="filterByStatus('all')"
        />

        <ScCard
          layout="stats"
          label="在线节点"
          :value="animatedStats.onlineNodes"
          icon="ri:checkbox-circle-line"
          theme="success"
          :trendText="`${getOnlineRate()}%`"
          hoverable
          class="stat-card-item"
          @click="filterByStatus('ONLINE')"
        />

        <ScCard
          layout="stats"
          label="健康节点"
          :value="animatedStats.healthyNodes"
          icon="ri:heart-pulse-line"
          theme="purple"
          :trendText="`${getHealthRate()}%`"
          hoverable
          class="stat-card-item"
          @click="filterByStatus('healthy')"
        />

        <ScCard
          layout="stats"
          label="异常节点"
          :value="animatedStats.errorNodes"
          icon="ri:error-warning-line"
          theme="danger"
          :trendText="animatedStats.errorNodes > 0 ? '需要关注' : '正常'"
          hoverable
          class="stat-card-item"
          @click="filterByStatus('error')"
        />
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-card class="search-card" shadow="never">
        <div class="search-container">
          <div class="search-left">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索节点名称、IP地址或应用名称"
              class="search-input"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <IconifyIconOnline icon="ri:search-line" />
              </template>
            </el-input>
            <el-select
              v-model="selectedApplication"
              placeholder="选择应用"
              class="app-filter"
              clearable
              @change="handleApplicationFilter"
            >
              <el-option
                v-for="app in applicationList"
                :key="app"
                :label="app"
                :value="app"
              />
            </el-select>
            <el-select
              v-model="selectedStatus"
              placeholder="节点状态"
              class="status-filter"
              clearable
              @change="handleStatusFilter"
            >
              <el-option label="在线" value="ONLINE" />
              <el-option label="离线" value="OFFLINE" />
              <el-option label="连接中" value="CONNECTING" />
              <el-option label="异常" value="ERROR" />
              <el-option label="维护中" value="MAINTENANCE" />
            </el-select>
          </div>
          <div class="search-right">
            <el-button-group class="view-toggle">
              <el-button
                type="primary"
                :loading="loading"
                @click="refreshNodes"
                class="refresh-btn"
              >
                <IconifyIconOnline icon="ri:refresh-line" />
                刷新节点
              </el-button>
              <el-button
                :type="viewMode === 'card' ? 'primary' : 'default'"
                @click="viewMode = 'card'"
              >
                <IconifyIconOnline icon="ri:grid-line" />
              </el-button>
              <el-button
                :type="viewMode === 'table' ? 'primary' : 'default'"
                @click="viewMode = 'table'"
              >
                <IconifyIconOnline icon="ri:list-check" />
              </el-button>
            </el-button-group>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 节点列表 -->
    <div class="nodes-section">
      <div v-if="loading && nodeList.length === 0" class="loading-container">
        <div class="loading-content">
          <el-skeleton :rows="3" animated />
          <p class="loading-text">正在加载节点数据...</p>
        </div>
      </div>

      <div v-else-if="filteredNodeList.length === 0" class="empty-container">
        <el-empty description="暂无节点数据" :image-size="120">
          <template #description>
            <p class="empty-text">{{ getEmptyText() }}</p>
          </template>
          <el-button type="primary" @click="refreshNodes">
            <IconifyIconOnline icon="ri:refresh-line" />
            刷新数据
          </el-button>
        </el-empty>
      </div>

      <!-- 卡片视图 -->
      <div v-else-if="viewMode === 'card'" class="nodes-grid">
        <transition-group name="node-card" tag="div" class="grid-container">
          <div
            v-for="(node, index) in filteredNodeList"
            :key="node.nodeId"
            class="node-card-wrapper"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
            <div
              class="node-card"
              :class="[
                getNodeCardClass(node),
                {
                  'menu-active':
                    showMenu && hoveredNode?.nodeId === node.nodeId,
                },
              ]"
              @click="viewNodeDetail(node)"
              @mouseenter="showActionMenu(node, $event)"
              @mouseleave="hideActionMenu"
            >
              <div class="card-header">
                <div class="node-info">
                  <div class="node-name">
                    <IconifyIconOnline
                      icon="ri:server-line"
                      class="node-icon"
                    />
                    <span class="name-text">{{
                      node.nodeName || node.applicationName
                    }}</span>
                  </div>
                  <div class="node-address">
                    <IconifyIconOnline
                      icon="ri:global-line"
                      class="address-icon"
                    />
                    <span>{{ node.ipAddress }}:{{ node.port }}</span>
                  </div>
                </div>
                <div class="node-status">
                  <el-tag
                    :type="getStatusType(node.status)"
                    :effect="node.status === 'ONLINE' ? 'dark' : 'plain'"
                    class="status-tag"
                  >
                    <IconifyIconOnline :icon="getStatusIcon(node.status)" />
                    {{ getStatusText(node.status) }}
                  </el-tag>
                </div>
              </div>

              <div class="card-body">
                <div class="node-details">
                  <div class="detail-row">
                    <div class="detail-item">
                      <IconifyIconOnline
                        icon="ri:apps-line"
                        class="detail-icon"
                      />
                      <div class="detail-info">
                        <span class="detail-label">应用名称</span>
                        <span class="detail-value">{{
                          node.applicationName || "N/A"
                        }}</span>
                      </div>
                    </div>
                    <div class="detail-item">
                      <IconifyIconOnline
                        icon="ri:links-line"
                        class="detail-icon"
                      />
                      <div class="detail-info">
                        <span class="detail-label">连接数</span>
                        <span class="detail-value">{{
                          node.connectionCount || 0
                        }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-item">
                      <IconifyIconOnline
                        icon="ri:settings-3-line"
                        class="detail-icon"
                      />
                      <div class="detail-info">
                        <span class="detail-label">运行环境</span>
                        <span
                          class="detail-value"
                          :class="
                            getEnvironmentClass(
                              node.metadata?.applicationActive
                            )
                          "
                          >{{ node.metadata?.applicationActive || "N/A" }}</span
                        >
                      </div>
                    </div>
                    <div class="detail-item">
                      <IconifyIconOnline
                        icon="ri:global-line"
                        class="detail-icon"
                      />
                      <div class="detail-info">
                        <span class="detail-label">请求地址</span>
                        <span class="detail-value">{{
                          node.metadata?.contextPath || "/"
                        }}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="node.metadata?.applicationActiveInclude"
                    class="detail-row single"
                  >
                    <div class="detail-item full-width">
                      <IconifyIconOnline
                        icon="ri:file-settings-line"
                        class="detail-icon"
                      />
                      <div class="detail-info">
                        <span class="detail-label">配置项</span>
                        <span class="detail-value config-value">{{
                          node.metadata.applicationActiveInclude
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <div class="footer-info">
                  <div class="connect-time">
                    <IconifyIconOnline icon="ri:time-line" />
                    <span>{{ formatConnectTime(node.connectTime) }}</span>
                  </div>
                  <div class="last-heartbeat">
                    <IconifyIconOnline
                      icon="ri:heart-pulse-line"
                      class="heartbeat-icon"
                    />
                    <span class="heartbeat-text">
                      {{ formatHeartbeat(node.lastHeartbeatTime) }}
                    </span>
                  </div>
                </div>
                <div class="card-actions">
                  <el-button-group size="small">
                    <el-button
                      @click.stop="openNodeDocumentation(node)"
                      title="API文档"
                    >
                      <IconifyIconOnline icon="ri:file-text-line" />
                    </el-button>
                    <el-button
                      @click.stop="checkNodeHealth(node)"
                      :loading="nodeCheckingStatus[node.nodeId]"
                      title="健康检查"
                    >
                      <IconifyIconOnline icon="ri:stethoscope-line" />
                    </el-button>
                    <el-button
                      @click.stop="viewNodeDetail(node)"
                      title="查看详情"
                    >
                      <IconifyIconOnline icon="ri:eye-line" />
                    </el-button>
                  </el-button-group>
                </div>
              </div>
            </div>
          </div>
        </transition-group>
      </div>
    </div>

    <!-- 悬停功能菜单 -->
    <teleport to="body">
      <div
        v-if="showMenu"
        ref="actionMenuRef"
        class="node-action-menu"
        :style="menuStyle"
        @mouseenter="keepMenuVisible"
        @mouseleave="hideActionMenu"
      >
        <div class="menu-overlay">
          <!-- 分页指示器 -->
          <div class="menu-pagination" v-if="totalMenuPages > 1">
            <div
              v-for="page in totalMenuPages"
              :key="page"
              class="page-dot"
              :class="{ active: currentMenuPage === page }"
              @click="switchMenuPage(page)"
            ></div>
          </div>

          <!-- 菜单网格 -->
          <div class="menu-grid">
            <div
              v-for="action in currentPageActions"
              :key="action.key"
              class="action-icon"
              :class="action.key"
              @click="action.handler(hoveredNode)"
              :title="action.title"
            >
              <IconifyIconOnline
                :icon="action.icon"
                width="38px"
                height="38px"
                class="text-white"
              />
              <span class="tooltip">{{ action.title }}</span>
            </div>
          </div>

          <!-- 分页导航按钮 -->
          <div class="menu-navigation" v-if="totalMenuPages > 1">
            <button
              class="nav-btn prev"
              :disabled="currentMenuPage === 1"
              @click="prevMenuPage"
            >
              <IconifyIconOnline icon="ri:arrow-left-line" />
            </button>
            <button
              class="nav-btn next"
              :disabled="currentMenuPage === totalMenuPages"
              @click="nextMenuPage"
            >
              <IconifyIconOnline icon="ri:arrow-right-line" />
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 日志配置组件 -->
    <LoggerConfig
      v-model="showLoggerConfigDialog"
      :node-info="selectedNodeForLogger"
    />

    <!-- 日志查看组件 -->
    <LogViewer
      v-model="showLogViewerDialog"
      :node-info="selectedNodeForLogViewer"
    />

    <!-- 配置查看组件 -->
    <ConfigViewer
      v-model="showConfigViewerDialog"
      :node-info="selectedNodeForConfigViewer"
    />

    <!-- 重启管理组件 -->
    <RestartManager
      v-model="showRestartManagerDialog"
      :node-info="selectedNodeForRestartManager"
      @success="refreshNodes"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import {
  fetchAllOnlineNodes,
  fetchNodeStatistics,
  apiCheckNodeHealth,
  type OnlineNodeInfo,
  type NodeStatistics,
} from "@/api/server/node-management";
import { parseTime } from "@/utils/const";
import LoggerConfig from "./module/logger-config/index.vue";
import LogViewer from "./module/log-viewer/index.vue";
import ConfigViewer from "./module/config-viewer/index.vue";
import RestartManager from "./module/restart-manager/index.vue";

// 路由
const router = useRouter();

// 响应式数据
const loading = ref(false);
const nodeList = ref<OnlineNodeInfo[]>([]);

// 悬停菜单相关
const showMenu = ref(false);
const hoveredNode = ref<OnlineNodeInfo | null>(null);
const actionMenuRef = ref<HTMLElement>();
const menuStyle = ref({});
let hideMenuTimer: NodeJS.Timeout | null = null;

// 菜单分页相关
const currentMenuPage = ref(1);
const itemsPerPage = 9; // 每页最多9个功能

// 节点检查状态
const nodeCheckingStatus = ref<Record<string, boolean>>({});
const nodeStats = ref<NodeStatistics>({
  totalNodes: 0,
  onlineNodes: 0,
  offlineNodes: 0,
  healthyNodes: 0,
  errorNodes: 0,
  maintenanceNodes: 0,
  totalConnections: 0,
  averageResponseTime: 0,
  averageCpuUsage: 0,
  averageMemoryUsage: 0,
  averageDiskUsage: 0,
  nodesByStatus: {},
  nodesByApplication: {},
  nodesByType: {},
  recentActiveNodes: [],
  fastestNodes: [],
  highestLoadNodes: [],
});

// 动画统计数据
const animatedStats = reactive({
  totalNodes: 0,
  onlineNodes: 0,
  healthyNodes: 0,
  errorNodes: 0,
});

const isCountingUp = ref(false);

// 搜索和筛选
const searchKeyword = ref("");

// 日志配置组件相关
const showLoggerConfigDialog = ref(false);
const selectedNodeForLogger = ref<OnlineNodeInfo | null>(null);

// 日志查看组件相关
const showLogViewerDialog = ref(false);
const selectedNodeForLogViewer = ref<OnlineNodeInfo | null>(null);

// 配置查看组件相关
const showConfigViewerDialog = ref(false);
const selectedNodeForConfigViewer = ref<OnlineNodeInfo | null>(null);

// 重启管理组件相关
const showRestartManagerDialog = ref(false);
const selectedNodeForRestartManager = ref<OnlineNodeInfo | null>(null);
const selectedApplication = ref("");
const selectedStatus = ref("");
const viewMode = ref<"card" | "table">("card");

// 轮询相关
let pollingTimer: NodeJS.Timeout | null = null;
const POLLING_INTERVAL = 30000; // 30秒

// 计算属性
const applicationList = computed(() => {
  const apps = new Set<string>();
  nodeList.value.forEach((node) => {
    if (node.applicationName) {
      apps.add(node.applicationName);
    }
  });
  return Array.from(apps).sort();
});

const filteredNodeList = computed(() => {
  let filtered = nodeList.value;

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    filtered = filtered.filter(
      (node) =>
        (node.nodeName && node.nodeName.toLowerCase().includes(keyword)) ||
        (node.applicationName &&
          node.applicationName.toLowerCase().includes(keyword)) ||
        (node.ipAddress && node.ipAddress.toLowerCase().includes(keyword))
    );
  }

  // 应用筛选
  if (selectedApplication.value) {
    filtered = filtered.filter(
      (node) => node.applicationName === selectedApplication.value
    );
  }

  // 状态筛选
  if (selectedStatus.value) {
    filtered = filtered.filter((node) => node.status === selectedStatus.value);
  }

  return filtered;
});

// 方法
const refreshNodes = async () => {
  loading.value = true;
  try {
    await Promise.all([getNodeList(), getNodeStats()]);
  } finally {
    loading.value = false;
  }
};

const getNodeList = async () => {
  try {
    const response = await fetchAllOnlineNodes();
    if (response.code === "00000") {
      const newData = response.data || [];
      if (newData.length > 0 || nodeList.value.length === 0) {
        nodeList.value = newData;
        updateNodeStats();
      }
    } else {
      ElMessage.error(response.msg || "获取节点列表失败");
    }
  } catch (error) {
    console.error("获取节点列表失败:", error);
    ElMessage.error("获取节点列表失败");
  }
};

const getNodeStats = async () => {
  try {
    const response = await fetchNodeStatistics();
    if (response.code === "00000") {
      const newStats = response.data;
      if (newStats) {
        // 触发数字动画
        animateStatsUpdate(newStats);
        nodeStats.value = newStats;
      }
    }
  } catch (error) {
    console.error("获取节点统计失败:", error);
  }
};

const updateNodeStats = () => {
  const stats = {
    totalNodes: nodeList.value.length,
    onlineNodes: nodeList.value.filter((n) => n.status === "ONLINE").length,
    healthyNodes: nodeList.value.filter((n) => n.healthy).length,
    errorNodes: nodeList.value.filter((n) => !n.healthy || n.status === "ERROR")
      .length,
  };

  animateStatsUpdate(stats);
};

const animateStatsUpdate = (newStats: any) => {
  isCountingUp.value = true;

  const duration = 1000;
  const steps = 30;
  const stepDuration = duration / steps;

  const startStats = { ...animatedStats };
  const targetStats = {
    totalNodes: newStats.totalNodes || 0,
    onlineNodes: newStats.onlineNodes || 0,
    healthyNodes: newStats.healthyNodes || 0,
    errorNodes: newStats.errorNodes || 0,
  };

  let currentStep = 0;

  const animate = () => {
    currentStep++;
    const progress = currentStep / steps;

    Object.keys(targetStats).forEach((key) => {
      const start = startStats[key] || 0;
      const target = targetStats[key];
      const current = Math.round(start + (target - start) * progress);
      animatedStats[key] = current;
    });

    if (currentStep < steps) {
      setTimeout(animate, stepDuration);
    } else {
      isCountingUp.value = false;
    }
  };

  animate();
};

// 筛选和搜索
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

const handleApplicationFilter = () => {
  // 筛选逻辑已在计算属性中处理
};

const handleStatusFilter = () => {
  // 筛选逻辑已在计算属性中处理
};

const filterByStatus = (status: string) => {
  if (status === "all") {
    selectedStatus.value = "";
  } else if (status === "healthy") {
    selectedStatus.value = "";
    // 这里可以添加健康状态的特殊筛选逻辑
  } else if (status === "error") {
    selectedStatus.value = "";
    // 这里可以添加错误状态的特殊筛选逻辑
  } else {
    selectedStatus.value = status;
  }
};

// 工具方法
const getOnlineRate = () => {
  if (nodeStats.value.totalNodes === 0) return 0;
  return Math.round(
    (nodeStats.value.onlineNodes / nodeStats.value.totalNodes) * 100
  );
};

const getHealthRate = () => {
  if (nodeStats.value.totalNodes === 0) return 0;
  return Math.round(
    (nodeStats.value.healthyNodes / nodeStats.value.totalNodes) * 100
  );
};

const getEmptyText = () => {
  if (
    searchKeyword.value ||
    selectedApplication.value ||
    selectedStatus.value
  ) {
    return "没有找到符合条件的节点";
  }
  return "暂无节点数据，请检查节点服务是否正常";
};

const getNodeCardClass = (node: OnlineNodeInfo) => {
  const classes = [];

  switch (node.status) {
    case "ONLINE":
      classes.push("node-online");
      break;
    case "OFFLINE":
      classes.push("node-offline");
      break;
    case "CONNECTING":
      classes.push("node-connecting");
      break;
    case "ERROR":
      classes.push("node-error");
      break;
    case "MAINTENANCE":
      classes.push("node-maintenance");
      break;
    default:
      classes.push("node-unknown");
  }

  if (!node.healthy) {
    classes.push("node-unhealthy");
  }

  return classes;
};

const getStatusType = (status: string) => {
  switch (status) {
    case "ONLINE":
      return "success";
    case "OFFLINE":
      return "danger";
    case "CONNECTING":
      return "warning";
    case "ERROR":
      return "danger";
    case "MAINTENANCE":
      return "info";
    default:
      return "info";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "ONLINE":
      return "在线";
    case "OFFLINE":
      return "离线";
    case "CONNECTING":
      return "连接中";
    case "ERROR":
      return "异常";
    case "MAINTENANCE":
      return "维护中";
    default:
      return "未知";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "ONLINE":
      return "ri:checkbox-circle-line";
    case "OFFLINE":
      return "ri:close-circle-line";
    case "CONNECTING":
      return "ri:loader-4-line";
    case "ERROR":
      return "ri:error-warning-line";
    case "MAINTENANCE":
      return "ri:tools-line";
    default:
      return "ri:question-line";
  }
};

const formatConnectTime = (time: string | null | undefined) => {
  if (!time) return "未连接";
  return parseTime(time, "{m}-{d} {h}:{i}");
};

const formatHeartbeat = (time: string | null | undefined) => {
  if (!time) return "无心跳";
  return parseTime(time, "{m}-{d} {h}:{i}");
};

const getEnvironmentClass = (env: string | null | undefined) => {
  if (!env) return "";
  switch (env.toUpperCase()) {
    case "UP":
      return "env-up";
    case "DOWN":
      return "env-down";
    case "PROD":
    case "PRODUCTION":
      return "env-prod";
    case "DEV":
    case "DEVELOPMENT":
      return "env-dev";
    case "TEST":
      return "env-test";
    default:
      return "env-default";
  }
};

// 悬停菜单方法
const showActionMenu = (node: OnlineNodeInfo, event: MouseEvent) => {
  if (hideMenuTimer) {
    clearTimeout(hideMenuTimer);
    hideMenuTimer = null;
  }

  hoveredNode.value = node;
  showMenu.value = true;
  currentMenuPage.value = 1; // 重置到第一页

  nextTick(() => {
    const cardElement = event.currentTarget as HTMLElement;
    const rect = cardElement.getBoundingClientRect();

    // 菜单完全覆盖卡片
    menuStyle.value = {
      position: "fixed",
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: 9999,
    };
  });
};

const hideActionMenu = () => {
  hideMenuTimer = setTimeout(() => {
    showMenu.value = false;
    hoveredNode.value = null;
  }, 200);
};

const keepMenuVisible = () => {
  if (hideMenuTimer) {
    clearTimeout(hideMenuTimer);
    hideMenuTimer = null;
  }
};

// 菜单分页方法
const switchMenuPage = (page: number) => {
  currentMenuPage.value = page;
};

const nextMenuPage = () => {
  if (currentMenuPage.value < totalMenuPages.value) {
    currentMenuPage.value++;
  }
};

const prevMenuPage = () => {
  if (currentMenuPage.value > 1) {
    currentMenuPage.value--;
  }
};

// 节点功能方法
const openNodeDocumentation = (node: OnlineNodeInfo) => {
  if (!node) return;

  // 隐藏菜单
  showMenu.value = false;

  // 打开新页面显示API文档
  // 从metadata中获取contextPath
  const contextPath = node.metadata?.contextPath || "";

  const routeData = router.resolve({
    name: "nodeDocumentation",
    params: { nodeId: node.nodeId },
    query: {
      nodeName: node.nodeName || node.applicationName,
      nodeAddress: `${node.ipAddress}:${node.port}`,
      contextPath: contextPath,
    },
  });

  window.open(routeData.href, "_blank");
};

const openNodeMonitoring = (node: OnlineNodeInfo) => {
  if (!node) return;
  showMenu.value = false;

  // 打开新tab显示监控大屏
  const routeData = router.resolve({
    name: "nodeMonitorDashboard",
    params: { nodeId: node.nodeId },
    query: {
      nodeName: node.nodeName || node.applicationName,
      nodeAddress: `${node.ipAddress}:${node.port}`,
    },
  });

  window.open(routeData.href, "_blank");
};

const openNodeTerminal = (node: OnlineNodeInfo) => {
  if (!node) return;
  showMenu.value = false;
  console.log("打开终端连接:", node);
  // TODO: 实现终端连接功能
};

const openNodeFiles = (node: OnlineNodeInfo) => {
  if (!node) return;
  showMenu.value = false;
  console.log("打开文件管理:", node);
  // TODO: 实现文件管理功能
};

const openNodeLogs = (node: OnlineNodeInfo) => {
  if (!node) return;
  showMenu.value = false;

  // 打开日志查看组件
  showLogViewerDialog.value = true;
  selectedNodeForLogViewer.value = node;
};

const openLoggerConfig = (node: OnlineNodeInfo) => {
  if (!node) return;
  showMenu.value = false;

  // 打开日志配置组件
  showLoggerConfigDialog.value = true;
  selectedNodeForLogger.value = node;
};

const openNodeSettings = (node: OnlineNodeInfo) => {
  if (!node) return;
  showMenu.value = false;

  // 打开配置查看组件
  showConfigViewerDialog.value = true;
  selectedNodeForConfigViewer.value = node;
};

const restartNode = (node: OnlineNodeInfo) => {
  if (!node) return;
  showMenu.value = false;

  // 打开重启管理组件
  showRestartManagerDialog.value = true;
  selectedNodeForRestartManager.value = node;
};

// 节点操作
const viewNodeDetail = (node: OnlineNodeInfo) => {
  // TODO: 实现节点详情查看
  console.log("查看节点详情:", node);
};

const checkNodeHealth = async (node: OnlineNodeInfo) => {
  nodeCheckingStatus.value[node.nodeId] = true;
  try {
    const response = await apiCheckNodeHealth(node.ipAddress, node.port);
    if (response.code === "00000") {
      ElMessage.success(
        `节点 ${node.nodeName || node.applicationName} 健康检查通过`
      );
    } else {
      ElMessage.warning(`节点健康检查失败: ${response.msg}`);
    }
  } catch (error) {
    console.error("节点健康检查失败:", error);
    ElMessage.error("节点健康检查失败");
  } finally {
    nodeCheckingStatus.value[node.nodeId] = false;
  }
};

// 轮询
const startPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
  }

  pollingTimer = setInterval(async () => {
    try {
      await getNodeList();
      await getNodeStats();
    } catch (error) {
      console.error("轮询刷新节点数据失败:", error);
    }
  }, POLLING_INTERVAL);
};

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};

// 定义所有功能项
const allMenuActions = [
  {
    key: "api-docs",
    title: "API文档",
    icon: "ri:book-open-line",
    handler: openNodeDocumentation,
  },
  {
    key: "monitoring",
    title: "监控面板",
    icon: "ri:bar-chart-box-line",
    handler: openNodeMonitoring,
  },
  {
    key: "terminal",
    title: "终端连接",
    icon: "ri:terminal-box-line",
    handler: openNodeTerminal,
  },
  {
    key: "files",
    title: "文件管理",
    icon: "ri:folder-open-line",
    handler: openNodeFiles,
  },
  {
    key: "health",
    title: "健康检查",
    icon: "ri:heart-pulse-line",
    handler: checkNodeHealth,
  },
  {
    key: "details",
    title: "查看详情",
    icon: "ri:information-line",
    handler: viewNodeDetail,
  },
  {
    key: "logs",
    title: "日志查看",
    icon: "ri:file-list-3-line",
    handler: openNodeLogs,
  },
  {
    key: "logger-config",
    title: "日志配置",
    icon: "ri:settings-4-line",
    handler: openLoggerConfig,
  },
  {
    key: "settings",
    title: "节点配置",
    icon: "ri:settings-3-line",
    handler: openNodeSettings,
  },
  {
    key: "restart",
    title: "重启节点",
    icon: "ri:restart-line",
    handler: restartNode,
  },
  {
    key: "metrics",
    title: "性能指标",
    icon: "ri:dashboard-line",
    handler: (node: OnlineNodeInfo) => {
      showMenu.value = false;
      console.log("查看性能指标:", node);
      ElMessage.info("性能指标功能开发中...");
    },
  },
  {
    key: "backup",
    title: "数据备份",
    icon: "ri:database-2-line",
    handler: (node: OnlineNodeInfo) => {
      showMenu.value = false;
      console.log("数据备份:", node);
      ElMessage.info("数据备份功能开发中...");
    },
  },
];

// 计算总页数
const totalMenuPages = computed(() => {
  return Math.ceil(allMenuActions.length / itemsPerPage);
});

// 计算当前页的功能项
const currentPageActions = computed(() => {
  const startIndex = (currentMenuPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return allMenuActions.slice(startIndex, endIndex);
});

// 生命周期
onMounted(() => {
  refreshNodes();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped lang="scss">
.node-management-container {
  padding: 24px;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(
      ellipse at 0% 0%,
      rgba(99, 102, 241, 0.15) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 100% 0%,
      rgba(168, 85, 247, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 100% 100%,
      rgba(236, 72, 153, 0.08) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 0% 100%,
      rgba(34, 197, 94, 0.08) 0%,
      transparent 50%
    ),
    linear-gradient(
      180deg,
      var(--el-bg-color) 0%,
      var(--el-fill-color-lighter) 100%
    );

  // 动态网格背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    z-index: 0;
    animation: gridMove 20s linear infinite;
  }

  // 浮动光点效果
  &::after {
    content: "";
    position: absolute;
    top: 10%;
    right: 10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(
      circle,
      rgba(99, 102, 241, 0.15) 0%,
      transparent 70%
    );
    border-radius: 50%;
    filter: blur(60px);
    animation: floatGlow 8s ease-in-out infinite;
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 2;
  }

  // 页面标题
  .page-header {
    margin-bottom: 32px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 32px 40px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);

      .title-section {
        .page-title {
          display: flex;
          align-items: center;
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
          color: #2c3e50;

          .title-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            margin-right: 16px;
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);

            i {
              font-size: 24px;
              color: var(--el-text-color-primary);
            }
          }

          .title-text {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
        }

        .page-description {
          margin: 0;
          color: #64748b;
          font-size: 16px;
          line-height: 1.5;
        }
      }

      .header-actions {
        .refresh-btn {
          height: 40px;
          padding: 0 20px;
          border-radius: 10px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
          }

          i {
            margin-right: 6px;
          }
        }
      }
    }
  }

  // 统计卡片
  .stats-section {
    margin-bottom: 28px;
    flex-shrink: 0;

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;

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
  }

  // 搜索区域
  .search-section {
    margin-bottom: 28px;

    .search-card {
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.6);
      background: linear-gradient(
        145deg,
        rgba(255, 255, 255, 0.95) 0%,
        rgba(248, 250, 252, 0.9) 100%
      );
      backdrop-filter: blur(20px) saturate(180%);
      box-shadow:
        0 4px 24px rgba(0, 0, 0, 0.06),
        0 1px 2px rgba(0, 0, 0, 0.04),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
      transition: all 0.3s ease;

      &:hover {
        box-shadow:
          0 8px 32px rgba(0, 0, 0, 0.1),
          0 2px 4px rgba(0, 0, 0, 0.06),
          inset 0 1px 0 rgba(255, 255, 255, 0.9);
      }

      :deep(.el-card__body) {
        padding: 20px 28px;
      }

      .search-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;

        .search-left {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;

          .search-input {
            width: 340px;

            :deep(.el-input__wrapper) {
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
              border: 1px solid rgba(0, 0, 0, 0.06);
              transition: all 0.3s ease;

              &:hover,
              &:focus-within {
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
                border-color: rgba(99, 102, 241, 0.3);
              }
            }
          }

          .app-filter,
          .status-filter {
            width: 160px;

            :deep(.el-select__wrapper) {
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
              border: 1px solid rgba(0, 0, 0, 0.06);
              transition: all 0.3s ease;

              &:hover {
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
                border-color: rgba(99, 102, 241, 0.3);
              }
            }
          }
        }

        .search-right {
          .view-toggle {
            :deep(.el-button) {
              border-radius: 10px;
              transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

              &:first-child {
                border-top-right-radius: 0;
                border-bottom-right-radius: 0;
              }

              &:last-child {
                border-top-left-radius: 0;
                border-bottom-left-radius: 0;
              }

              &:hover {
                transform: translateY(-2px);
              }
            }

            .refresh-btn {
              background: linear-gradient(135deg, #6366f1, #a855f7);
              border: none;
              box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);

              &:hover {
                box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
                transform: translateY(-2px);
              }
            }
          }
        }
      }
    }
  }

  // 节点列表区域
  .nodes-section {
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

      .loading-content {
        text-align: center;
        max-width: 400px;

        .loading-text {
          margin-top: 16px;
          color: #64748b;
          font-size: 16px;
        }
      }
    }

    .empty-container {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 60px 20px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

      .empty-text {
        color: #64748b;
        font-size: 16px;
        margin: 16px 0;
      }
    }

    // 卡片视图
    .nodes-grid {
      .grid-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 32px;
        padding: 8px;

        // 响应式设计
        @media (max-width: 1400px) {
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 28px;
        }

        @media (max-width: 1200px) {
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
          gap: 20px;
          padding: 4px;
        }

        .node-card-wrapper {
          animation: cardSlideIn 0.5s ease-out both;

          .node-card {
            background: #fff;
            border-radius: 16px;
            padding: 0;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid #e5e7eb;
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

            &:hover {
              transform: translateY(-6px);
              box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
              border-color: rgba(59, 130, 246, 0.3);
            }

            &.menu-active {
              transform: translateY(-4px);
              box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);
              border-color: rgba(59, 130, 246, 0.5);
            }

            // 状态指示条
            &::before {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              z-index: 1;
            }

            &.node-online {
              &::before {
                background: linear-gradient(90deg, #10b981, #34d399);
              }
            }

            &.node-offline {
              &::before {
                background: linear-gradient(90deg, #ef4444, #f87171);
              }
            }

            &.node-maintenance {
              &::before {
                background: linear-gradient(90deg, #6b7280, #9ca3af);
              }
            }

            &.node-connecting {
              &::before {
                background: linear-gradient(90deg, #f59e0b, #fbbf24);
                animation: connecting-pulse 1.5s ease-in-out infinite;
              }
            }

            &.node-error {
              &::before {
                background: linear-gradient(90deg, #dc2626, #ef4444);
                animation: error-flash 1s ease-in-out infinite;
              }
            }

            &.node-unhealthy {
              border-color: rgba(239, 68, 68, 0.3);
            }

            .card-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 20px 20px 16px;
              border-bottom: 1px solid rgba(0, 0, 0, 0.05);
              background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);

              .node-info {
                flex: 1;
                min-width: 0;

                .node-name {
                  display: flex;
                  align-items: center;
                  font-size: 16px;
                  font-weight: 700;
                  color: #1e293b;
                  margin-bottom: 8px;

                  .node-icon {
                    width: 36px;
                    height: 36px;
                    margin-right: 10px;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: #fff;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    flex-shrink: 0;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
                  }

                  .name-text {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  }
                }

                .node-address {
                  display: inline-flex;
                  align-items: center;
                  font-size: 13px;
                  color: #64748b;
                  font-family: "JetBrains Mono", "Consolas", monospace;
                  background: #f1f5f9;
                  padding: 6px 10px;
                  border-radius: 8px;
                  font-weight: 500;

                  .address-icon {
                    margin-right: 6px;
                    font-size: 13px;
                    color: #94a3b8;
                  }
                }
              }

              .node-status {
                flex-shrink: 0;
                margin-left: 12px;

                .status-tag {
                  font-weight: 600;
                  border-radius: 8px;
                  padding: 6px 12px;
                  font-size: 12px;

                  i {
                    margin-right: 4px;
                    font-size: 12px;
                  }
                }
              }
            }

            .card-body {
              padding: 16px 20px;
              flex: 1;
              display: flex;
              flex-direction: column;
              background: #fff;

              .node-details {
                .detail-row {
                  display: grid;
                  grid-template-columns: repeat(2, 1fr);
                  gap: 10px;
                  margin-bottom: 10px;

                  &:last-child {
                    margin-bottom: 0;
                  }

                  &.single {
                    grid-template-columns: 1fr;
                  }

                  .detail-item {
                    display: flex;
                    align-items: center;
                    padding: 10px 12px;
                    background: #f8fafc;
                    border-radius: 10px;
                    transition: all 0.25s ease;

                    &:hover {
                      background: #f1f5f9;
                      transform: translateX(2px);
                    }

                    &.full-width {
                      grid-column: 1 / -1;
                    }

                    .detail-icon {
                      width: 28px;
                      height: 28px;
                      background: linear-gradient(135deg, #3b82f6, #2563eb);
                      color: #fff;
                      border-radius: 8px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 14px;
                      margin-right: 10px;
                      flex-shrink: 0;
                    }

                    .detail-info {
                      flex: 1;
                      min-width: 0;

                      .detail-label {
                        display: block;
                        font-size: 11px;
                        color: #94a3b8;
                        line-height: 1.3;
                        font-weight: 500;
                      }

                      .detail-value {
                        display: block;
                        font-size: 13px;
                        font-weight: 600;
                        color: #1e293b;
                        line-height: 1.4;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;

                        &.env-prod {
                          color: #dc2626;
                        }

                        &.env-dev {
                          color: #2563eb;
                        }

                        &.env-test {
                          color: #7c3aed;
                        }

                        &.config-value {
                          font-family: "Consolas", monospace;
                          font-size: 11px;
                          color: #64748b;
                        }
                      }
                    }
                  }
                }
              }
            }

            .card-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 20px 16px;
              background: #f8fafc;
              border-top: 1px solid #e2e8f0;
              margin-top: auto;

              .footer-info {
                display: flex;
                gap: 16px;
                flex: 1;

                .connect-time,
                .last-heartbeat {
                  display: flex;
                  align-items: center;
                  font-size: 12px;
                  color: #64748b;
                  font-weight: 500;

                  i {
                    margin-right: 6px;
                    font-size: 14px;
                  }
                }

                .last-heartbeat {
                  .heartbeat-icon {
                    color: #ef4444;
                    animation: heartbeat 2s ease-in-out infinite;
                  }

                  .heartbeat-text {
                    font-family: "Consolas", monospace;
                  }
                }
              }

              .card-actions {
                flex-shrink: 0;

                :deep(.el-button-group) {
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

                  .el-button {
                    border-radius: 0;
                    padding: 6px 10px;
                    font-size: 12px;
                    height: 30px;

                    &:first-child {
                      border-top-left-radius: 8px;
                      border-bottom-left-radius: 8px;
                    }

                    &:last-child {
                      border-top-right-radius: 8px;
                      border-bottom-right-radius: 8px;
                    }

                    i {
                      font-size: 14px;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

// 页面背景动画
@keyframes gridMove {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 60px 60px;
  }
}

@keyframes floatGlow {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-30px, 20px) scale(1.1);
    opacity: 0.7;
  }
}

@keyframes error-pulse {
  0%,
  100% {
    box-shadow: 0 8px 24px rgba(239, 68, 68, 0.35);
  }
  50% {
    box-shadow: 0 8px 32px rgba(239, 68, 68, 0.5);
  }
}

// 动画定义
@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes connecting-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.02);
  }
}

@keyframes error-flash {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes patternMove {
  0% {
    background-position:
      0 0,
      15px 15px;
  }
  100% {
    background-position:
      30px 30px,
      45px 45px;
  }
}

@keyframes heartbeat {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

// 过渡动画
.node-card-enter-active,
.node-card-leave-active {
  transition: all 0.5s ease;
}

.node-card-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}

.node-card-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.9);
}

.node-card-move {
  transition: transform 0.5s ease;
}

// 响应式设计
@media (max-width: 1200px) {
  .node-management-container {
    .stats-section .stats-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }

    .nodes-section .nodes-grid .grid-container {
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
    }
  }
}

@media (max-width: 768px) {
  .node-management-container {
    .stats-section .stats-grid {
      grid-template-columns: 1fr !important;
      gap: 12px;
    }

    .nodes-section .nodes-grid .grid-container {
      grid-template-columns: 1fr;
      gap: 10px;

      .node-card-wrapper .node-card {
        .card-header {
          padding: 10px 12px;

          .node-info .node-name {
            font-size: 13px;
            margin-bottom: 3px;
          }

          .node-info .node-address {
            font-size: 11px;
          }

          .node-status .status-tag {
            font-size: 10px;
            padding: 1px 6px;
          }
        }

        .card-body {
          padding: 8px 12px;

          .node-details {
            .detail-row {
              gap: 6px;
              margin-bottom: 6px;

              .detail-item {
                padding: 4px 6px;

                .detail-icon {
                  font-size: 12px;
                  margin-right: 4px;
                }

                .detail-info {
                  .detail-label {
                    font-size: 9px;
                  }

                  .detail-value {
                    font-size: 11px;
                  }
                }
              }
            }
          }
        }

        .card-footer {
          padding: 6px 12px 8px;

          .footer-info {
            gap: 8px;

            .connect-time,
            .last-heartbeat {
              font-size: 9px;

              i {
                font-size: 10px;
              }
            }
          }

          .card-actions :deep(.el-button-group) .el-button {
            padding: 2px 4px;
            min-width: 20px;
            height: 20px;

            i {
              font-size: 10px;
            }
          }
        }
      }
    }
  }
}

// 悬停菜单样式 - 美化版
.node-action-menu {
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.95) 0%,
    rgba(30, 41, 59, 0.95) 50%,
    rgba(15, 23, 42, 0.95) 100%
  );
  backdrop-filter: blur(24px) saturate(180%);
  border-radius: 28px;
  overflow: visible;
  animation: menuSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid rgba(99, 102, 241, 0.4);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 80px -20px rgba(99, 102, 241, 0.4);
  position: relative;

  // 外发光效果
  &::before {
    content: "";
    position: absolute;
    inset: -2px;
    border-radius: 30px;
    background: linear-gradient(
      135deg,
      rgba(99, 102, 241, 0.5),
      rgba(168, 85, 247, 0.5),
      rgba(236, 72, 153, 0.5),
      rgba(99, 102, 241, 0.5)
    );
    background-size: 300% 300%;
    animation: borderGlow 4s ease infinite;
    z-index: -1;
    opacity: 0.6;
    filter: blur(8px);
  }

  // 扫描线效果
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(99, 102, 241, 0.03) 50%,
      transparent 100%
    );
    animation: scanLine 3s linear infinite;
    pointer-events: none;
    border-radius: 28px;
  }

  .menu-overlay {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    position: relative;
    z-index: 1;
  }

  // 分页指示器
  .menu-pagination {
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    z-index: 10;

    .page-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      border: 1px solid rgba(255, 255, 255, 0.1);

      &.active {
        background: linear-gradient(135deg, #6366f1, #a855f7);
        transform: scale(1.3);
        box-shadow: 0 0 12px rgba(99, 102, 241, 0.6);
      }

      &:hover:not(.active) {
        background: rgba(255, 255, 255, 0.5);
        transform: scale(1.1);
      }
    }
  }

  .menu-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 14px;
    width: 100%;
    height: 100%;
    max-width: 320px;
    max-height: 300px;
  }

  // 分页导航按钮
  .menu-navigation {
    position: absolute;
    bottom: 14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 16px;
    z-index: 10;

    .nav-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(
        135deg,
        rgba(99, 102, 241, 0.8),
        rgba(168, 85, 247, 0.8)
      );
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);

      &:hover:not(:disabled) {
        transform: scale(1.15) translateY(-2px);
        box-shadow: 0 8px 20px rgba(99, 102, 241, 0.5);
      }

      &:disabled {
        background: rgba(255, 255, 255, 0.1);
        cursor: not-allowed;
        opacity: 0.4;
        box-shadow: none;
      }
    }
  }

  .action-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.08) 0%,
      rgba(255, 255, 255, 0.03) 100%
    );
    border-radius: 18px;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    overflow: hidden;
    padding: 8px;

    // 光泽效果
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
      );
      transition: left 0.5s ease;
    }

    &:hover::before {
      left: 100%;
    }

    &:hover {
      background: linear-gradient(
        145deg,
        rgba(99, 102, 241, 0.3) 0%,
        rgba(168, 85, 247, 0.2) 100%
      );
      border-color: rgba(99, 102, 241, 0.5);
      transform: translateY(-4px) scale(1.08);
      box-shadow:
        0 12px 30px rgba(99, 102, 241, 0.4),
        0 0 20px rgba(99, 102, 241, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    &:active {
      transform: translateY(-2px) scale(1.02);
    }

    i,
    svg {
      font-size: 32px;
      color: rgba(255, 255, 255, 0.9);
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }

    &:hover i,
    &:hover svg {
      color: #fff;
      transform: scale(1.15);
      filter: drop-shadow(0 4px 12px rgba(99, 102, 241, 0.5));
    }

    .tooltip {
      position: absolute;
      bottom: -42px;
      left: 50%;
      transform: translateX(-50%) translateY(-8px);
      background: linear-gradient(
        135deg,
        rgba(15, 23, 42, 0.98),
        rgba(30, 41, 59, 0.98)
      );
      color: #fff;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: none;
      z-index: 10000;
      border: 1px solid rgba(99, 102, 241, 0.3);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
      letter-spacing: 0.5px;

      &::before {
        content: "";
        position: absolute;
        top: -6px;
        left: 50%;
        transform: translateX(-50%);
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-bottom: 6px solid rgba(15, 23, 42, 0.98);
      }
    }

    &:hover .tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }

    // 不同功能的特定颜色主题 - 渐变版
    &.api-docs {
      &:hover {
        background: linear-gradient(
          145deg,
          rgba(34, 197, 94, 0.3),
          rgba(16, 185, 129, 0.2)
        );
        border-color: rgba(34, 197, 94, 0.5);
        box-shadow:
          0 12px 30px rgba(34, 197, 94, 0.4),
          0 0 20px rgba(34, 197, 94, 0.2);
      }
      &:hover i,
      &:hover svg {
        filter: drop-shadow(0 4px 12px rgba(34, 197, 94, 0.6));
      }
    }

    &.monitoring {
      &:hover {
        background: linear-gradient(
          145deg,
          rgba(59, 130, 246, 0.3),
          rgba(37, 99, 235, 0.2)
        );
        border-color: rgba(59, 130, 246, 0.5);
        box-shadow:
          0 12px 30px rgba(59, 130, 246, 0.4),
          0 0 20px rgba(59, 130, 246, 0.2);
      }
      &:hover i,
      &:hover svg {
        filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.6));
      }
    }

    &.terminal {
      &:hover {
        background: linear-gradient(
          145deg,
          rgba(30, 41, 59, 0.5),
          rgba(15, 23, 42, 0.4)
        );
        border-color: rgba(148, 163, 184, 0.5);
        box-shadow:
          0 12px 30px rgba(15, 23, 42, 0.5),
          0 0 20px rgba(148, 163, 184, 0.2);
      }
      &:hover i,
      &:hover svg {
        filter: drop-shadow(0 4px 12px rgba(148, 163, 184, 0.6));
      }
    }

    &.files {
      &:hover {
        background: linear-gradient(
          145deg,
          rgba(245, 158, 11, 0.3),
          rgba(217, 119, 6, 0.2)
        );
        border-color: rgba(245, 158, 11, 0.5);
        box-shadow:
          0 12px 30px rgba(245, 158, 11, 0.4),
          0 0 20px rgba(245, 158, 11, 0.2);
      }
      &:hover i,
      &:hover svg {
        filter: drop-shadow(0 4px 12px rgba(245, 158, 11, 0.6));
      }
    }

    &.health {
      &:hover {
        background: linear-gradient(
          145deg,
          rgba(239, 68, 68, 0.3),
          rgba(220, 38, 38, 0.2)
        );
        border-color: rgba(239, 68, 68, 0.5);
        box-shadow:
          0 12px 30px rgba(239, 68, 68, 0.4),
          0 0 20px rgba(239, 68, 68, 0.2);
      }
      &:hover i,
      &:hover svg {
        filter: drop-shadow(0 4px 12px rgba(239, 68, 68, 0.6));
        animation: heartbeat 1s ease-in-out infinite;
      }
    }

    &.details {
      &:hover {
        background: linear-gradient(
          145deg,
          rgba(168, 85, 247, 0.3),
          rgba(139, 92, 246, 0.2)
        );
        border-color: rgba(168, 85, 247, 0.5);
        box-shadow:
          0 12px 30px rgba(168, 85, 247, 0.4),
          0 0 20px rgba(168, 85, 247, 0.2);
      }
      &:hover i,
      &:hover svg {
        filter: drop-shadow(0 4px 12px rgba(168, 85, 247, 0.6));
      }
    }

    &.logs {
      &:hover {
        background: linear-gradient(
          145deg,
          rgba(6, 182, 212, 0.3),
          rgba(8, 145, 178, 0.2)
        );
        border-color: rgba(6, 182, 212, 0.5);
        box-shadow:
          0 12px 30px rgba(6, 182, 212, 0.4),
          0 0 20px rgba(6, 182, 212, 0.2);
      }
      &:hover i,
      &:hover svg {
        filter: drop-shadow(0 4px 12px rgba(6, 182, 212, 0.6));
      }
    }

    &.settings {
      &:hover {
        background: linear-gradient(
          145deg,
          rgba(107, 114, 128, 0.3),
          rgba(75, 85, 99, 0.2)
        );
        border-color: rgba(107, 114, 128, 0.5);
        box-shadow:
          0 12px 30px rgba(107, 114, 128, 0.4),
          0 0 20px rgba(107, 114, 128, 0.2);
      }
      &:hover i,
      &:hover svg {
        filter: drop-shadow(0 4px 12px rgba(107, 114, 128, 0.6));
        animation: spin 2s linear infinite;
      }
    }

    &.restart {
      &:hover {
        background: linear-gradient(
          145deg,
          rgba(220, 38, 38, 0.3),
          rgba(185, 28, 28, 0.2)
        );
        border-color: rgba(220, 38, 38, 0.5);
        box-shadow:
          0 12px 30px rgba(220, 38, 38, 0.4),
          0 0 20px rgba(220, 38, 38, 0.2);
      }
      &:hover i,
      &:hover svg {
        filter: drop-shadow(0 4px 12px rgba(220, 38, 38, 0.6));
        animation: spin 1s linear infinite;
      }
    }

    &.logger-config {
      &:hover {
        background: linear-gradient(
          145deg,
          rgba(99, 102, 241, 0.3),
          rgba(168, 85, 247, 0.2)
        );
        border-color: rgba(99, 102, 241, 0.5);
        box-shadow:
          0 12px 30px rgba(99, 102, 241, 0.4),
          0 0 20px rgba(168, 85, 247, 0.2);
      }
      &:hover i,
      &:hover svg {
        filter: drop-shadow(0 4px 12px rgba(99, 102, 241, 0.6));
      }
    }
  }
}

@keyframes menuSlideIn {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(10px);
    backdrop-filter: blur(0px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
    backdrop-filter: blur(24px);
  }
}

@keyframes borderGlow {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes scanLine {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

@keyframes heartbeat {
  0%,
  100% {
    transform: scale(1.15);
  }
  50% {
    transform: scale(1.25);
  }
}

@keyframes spin {
  from {
    transform: scale(1.15) rotate(0deg);
  }
  to {
    transform: scale(1.15) rotate(360deg);
  }
}

@media (max-width: 768px) {
  .node-management-container {
    padding: 16px;

    .page-header .header-content {
      flex-direction: column;
      gap: 16px;
      text-align: center;
    }

    .stats-section .stats-grid {
      grid-template-columns: 1fr;
    }

    .search-section .search-card .search-container {
      flex-direction: column;
      gap: 12px;

      .search-left {
        width: 100%;
        flex-direction: column;

        .search-input,
        .app-filter,
        .status-filter {
          width: 100%;
        }
      }
    }

    .nodes-section .nodes-grid .grid-container {
      grid-template-columns: 1fr;
    }
  }
}

// 现代化的动画效果
@keyframes cardSlideIn {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

// 现代化的悬浮效果增强
.node-card:hover {
  .detail-item {
    &:nth-child(1) {
      transition-delay: 0ms;
    }
    &:nth-child(2) {
      transition-delay: 50ms;
    }
    &:nth-child(3) {
      transition-delay: 100ms;
    }
    &:nth-child(4) {
      transition-delay: 150ms;
    }
  }
}

// 日志配置弹框样式
.dialog-header {
  .header-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon {
      font-size: 24px;
      color: #409eff;
    }

    .header-text {
      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: var(--el-text-color-primary);
      }
    }
  }
}

.logger-config-content {
  .search-section {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }

  .logger-name {
    display: flex;
    align-items: center;
    gap: 8px;

    .logger-icon {
      color: #409eff;
      font-size: 16px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 日志配置菜单项样式
.action-icon.logger-config {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  &:hover {
    background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
    transform: translateY(-2px) scale(1.05);
  }
}
</style>
