<template>
  <div class="node-management-container">
    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <ScCard
          layout="stats"
          theme="primary"
          icon="ri:server-line"
          :value="animatedStats.totalNodes"
          label="总节点数"
          trend-icon="ri:arrow-up-line"
          trend-text="实时更新"
          :counting="isCountingUp"
          @click="filterByStatus('all')"
        />

        <ScCard
          layout="stats"
          theme="success"
          icon="ri:checkbox-circle-line"
          :value="animatedStats.onlineNodes"
          label="在线节点"
          trend-icon="ri:pulse-line"
          :trend-text="`${getOnlineRate()}%`"
          :counting="isCountingUp"
          @click="filterByStatus('ONLINE')"
        />

        <ScCard
          layout="stats"
          theme="info"
          icon="ri:heart-pulse-line"
          :value="animatedStats.healthyNodes"
          label="健康节点"
          trend-icon="ri:heart-line"
          :trend-text="`${getHealthRate()}%`"
          :counting="isCountingUp"
          @click="filterByStatus('healthy')"
        />

        <ScCard
          layout="stats"
          theme="danger"
          icon="ri:error-warning-line"
          :value="animatedStats.errorNodes"
          label="异常节点"
          trend-icon="ri:alert-line"
          trend-text="需关注"
          :counting="isCountingUp"
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
      <ScTable
        ref="scTableRef"
        :data="{ data: filteredNodeList, total: filteredNodeList.length }"
        :layout="viewMode"
        :loading="loading"
        :col-size="4"
        :row-size="3"
        :height="tableHeight"
        row-key="nodeId"
        hide-pagination
        hide-do
        :search="false"
        empty-text="暂无节点数据"
      >
        <!-- 卡片视图模板 -->
        <template #default="{ row }">
          <div
            class="node-card"
            :class="[
              getNodeCardClass(row),
              { 'menu-active': showMenu && hoveredNode?.nodeId === row.nodeId },
            ]"
            @click="viewNodeDetail(row)"
            @mouseenter="showActionMenu(row, $event)"
            @mouseleave="hideActionMenu"
          >
            <div class="card-header">
              <div class="node-info">
                <div class="node-name">
                  <IconifyIconOnline icon="ri:server-line" class="node-icon" />
                  <span class="name-text">{{
                    row.nodeName || row.applicationName
                  }}</span>
                </div>
                <div class="node-address">
                  <IconifyIconOnline
                    icon="ri:global-line"
                    class="address-icon"
                  />
                  <span>{{ row.ipAddress }}:{{ row.port }}</span>
                </div>
              </div>
              <div class="node-status">
                <el-tag
                  :type="getStatusType(row.status)"
                  :effect="row.status === 'ONLINE' ? 'dark' : 'plain'"
                  class="status-tag"
                >
                  <IconifyIconOnline :icon="getStatusIcon(row.status)" />
                  {{ getStatusText(row.status) }}
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
                        row.applicationName || "N/A"
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
                        row.connectionCount || 0
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
                          getEnvironmentClass(row.metadata?.applicationActive)
                        "
                      >
                        {{ row.metadata?.applicationActive || "N/A" }}
                      </span>
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
                        row.metadata?.contextPath || "/"
                      }}</span>
                    </div>
                  </div>
                </div>
                <div
                  v-if="row.metadata?.applicationActiveInclude"
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
                        row.metadata.applicationActiveInclude
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
                  <span>{{ formatConnectTime(row.connectTime) }}</span>
                </div>
                <div class="last-heartbeat">
                  <IconifyIconOnline
                    icon="ri:heart-pulse-line"
                    class="heartbeat-icon"
                  />
                  <span class="heartbeat-text">{{
                    formatHeartbeat(row.lastHeartbeatTime)
                  }}</span>
                </div>
              </div>
              <div class="card-actions">
                <el-button-group size="small">
                  <el-button
                    @click.stop="openNodeDocumentation(row)"
                    title="API文档"
                  >
                    <IconifyIconOnline icon="ri:file-text-line" />
                  </el-button>
                  <el-button
                    @click.stop="checkNodeHealth(row)"
                    :loading="nodeCheckingStatus[row.nodeId]"
                    title="健康检查"
                  >
                    <IconifyIconOnline icon="ri:stethoscope-line" />
                  </el-button>
                  <el-button @click.stop="viewNodeDetail(row)" title="查看详情">
                    <IconifyIconOnline icon="ri:eye-line" />
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </div>
        </template>

        <!-- 表格视图列定义 -->
        <el-table-column prop="nodeName" label="节点名称" min-width="150">
          <template #default="{ row }">
            <div class="node-name-cell">
              <IconifyIconOnline icon="ri:server-line" class="node-icon" />
              <span>{{ row.nodeName || row.applicationName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="ipAddress" label="IP地址" min-width="140">
          <template #default="{ row }">
            {{ row.ipAddress }}:{{ row.port }}
          </template>
        </el-table-column>
        <el-table-column
          prop="applicationName"
          label="应用名称"
          min-width="120"
        />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="connectionCount"
          label="连接数"
          width="80"
          align="center"
        />
        <el-table-column
          prop="lastHeartbeatTime"
          label="最后心跳"
          min-width="120"
        >
          <template #default="{ row }">
            {{ formatHeartbeat(row.lastHeartbeatTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button-group size="small">
              <el-button @click="openNodeDocumentation(row)" title="API文档">
                <IconifyIconOnline icon="ri:file-text-line" />
              </el-button>
              <el-button
                @click="checkNodeHealth(row)"
                :loading="nodeCheckingStatus[row.nodeId]"
                title="健康检查"
              >
                <IconifyIconOnline icon="ri:stethoscope-line" />
              </el-button>
              <el-button @click="viewNodeDetail(row)" title="查看详情">
                <IconifyIconOnline icon="ri:eye-line" />
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </ScTable>
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
} from "@/api/node-management";
import { parseTime } from "@/utils/const";
import LoggerConfig from "./module/logger-config/index.vue";
import ScCard from "@repo/components/ScCard/index.vue";
import ScTable from "@repo/components/ScTable/index.vue";

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
const selectedApplication = ref("");
const selectedStatus = ref("");
const viewMode = ref<"card" | "table">("card");
const scTableRef = ref();
const tableHeight = ref("calc(100vh - 280px)");

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

  if (node.status === "ONLINE") {
    classes.push("node-online");
  } else if (node.status === "OFFLINE") {
    classes.push("node-offline");
  } else {
    classes.push("node-maintenance");
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
    case "MAINTENANCE":
      return "warning";
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
  console.log("打开监控面板:", node);
  // TODO: 实现监控面板功能
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
  console.log("打开日志查看:", node);
  // TODO: 实现日志查看功能
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
  console.log("打开节点配置:", node);
  // TODO: 实现节点配置功能
};

const restartNode = (node: OnlineNodeInfo) => {
  if (!node) return;
  showMenu.value = false;
  console.log("重启节点:", node);
  // TODO: 实现节点重启功能
  ElMessage.warning("节点重启功能开发中...");
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
  padding: 0;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 50%, #f8fafc 100%);
  display: flex;
  flex-direction: column;

  // 统计卡片
  .stats-section {
    padding: 20px 32px;
    margin-bottom: 0;

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
    }
  }

  // 搜索区域
  .search-section {
    padding: 0 32px 20px;

    .search-card {
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      background: white;

      :deep(.el-card__body) {
        padding: 16px 20px;
      }

      .search-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;

        .search-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;

          .search-input {
            width: 300px;

            :deep(.el-input__wrapper) {
              border-radius: 10px;
            }
          }

          .app-filter,
          .status-filter {
            width: 140px;

            :deep(.el-select__wrapper) {
              border-radius: 10px;
            }
          }
        }

        .search-right {
          .view-toggle {
            :deep(.el-button) {
              border-radius: 8px;

              &:first-child {
                border-top-right-radius: 0;
                border-bottom-right-radius: 0;
              }

              &:last-child {
                border-top-left-radius: 0;
                border-bottom-left-radius: 0;
              }
            }
          }
        }
      }
    }
  }

  // 节点列表区域
  .nodes-section {
    padding: 0 32px 32px;
    flex: 1;
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
          animation: cardSlideIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) both;

          .node-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 0;
            cursor: pointer;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            overflow: hidden;
            position: relative;
            height: 320px;
            display: flex;
            flex-direction: column;
            box-shadow:
              0 8px 32px rgba(0, 0, 0, 0.12),
              0 2px 8px rgba(0, 0, 0, 0.08);

            // 移动端适配
            @media (max-width: 768px) {
              height: auto;
              min-height: 280px;
              border-radius: 20px;
            }

            &:hover {
              transform: translateY(-12px) scale(1.02);
              box-shadow:
                0 32px 64px rgba(0, 0, 0, 0.15),
                0 16px 32px rgba(0, 0, 0, 0.1);
              border-color: rgba(59, 130, 246, 0.4);
            }

            &.menu-active {
              transform: translateY(-8px) scale(1.01);
              box-shadow:
                0 40px 80px rgba(0, 0, 0, 0.2),
                0 20px 40px rgba(0, 0, 0, 0.15);
              border-color: rgba(59, 130, 246, 0.6);
              background: rgba(255, 255, 255, 0.98);

              &::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(59, 130, 246, 0.05);
                border-radius: 24px;
                pointer-events: none;
              }
            }

            // 状态指示条 - 更现代的设计
            &::before {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 6px;
              z-index: 1;
              border-radius: 24px 24px 0 0;
              opacity: 0.9;
            }

            // 状态光晕效果
            &::after {
              content: "";
              position: absolute;
              top: -2px;
              left: -2px;
              right: -2px;
              bottom: -2px;
              border-radius: 26px;
              opacity: 0;
              transition: opacity 0.3s ease;
              z-index: -1;
            }

            &.node-online {
              &::before {
                background: linear-gradient(135deg, #10b981, #34d399, #6ee7b7);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
              }

              &:hover::after {
                background: linear-gradient(
                  135deg,
                  rgba(16, 185, 129, 0.1),
                  rgba(52, 211, 153, 0.1)
                );
                opacity: 1;
              }
            }

            &.node-offline {
              &::before {
                background: linear-gradient(135deg, #ef4444, #f87171, #fca5a5);
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
              }

              &:hover::after {
                background: linear-gradient(
                  135deg,
                  rgba(239, 68, 68, 0.1),
                  rgba(248, 113, 113, 0.1)
                );
                opacity: 1;
              }
            }

            &.node-maintenance {
              &::before {
                background: linear-gradient(135deg, #f59e0b, #fbbf24, #fcd34d);
                box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
              }

              &:hover::after {
                background: linear-gradient(
                  135deg,
                  rgba(245, 158, 11, 0.1),
                  rgba(251, 191, 36, 0.1)
                );
                opacity: 1;
              }
            }

            &.node-unhealthy {
              border-color: rgba(239, 68, 68, 0.3);

              &:hover {
                border-color: rgba(239, 68, 68, 0.5);
              }
            }

            .card-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 28px 28px 20px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.2);
              background: linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.9),
                rgba(248, 250, 252, 0.8)
              );
              backdrop-filter: blur(10px);

              .node-info {
                flex: 1;
                min-width: 0;

                .node-name {
                  display: flex;
                  align-items: center;
                  font-size: 18px;
                  font-weight: 800;
                  color: #1e293b;
                  margin-bottom: 8px;
                  transition: all 0.3s ease;

                  .node-icon {
                    width: 32px;
                    height: 32px;
                    margin-right: 12px;
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: #ffffff;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                  }

                  .name-text {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    background: linear-gradient(135deg, #1e293b, #475569);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                  }

                  &:hover {
                    .node-icon {
                      transform: scale(1.1) rotate(10deg);
                      background: linear-gradient(135deg, #2563eb, #1e40af);
                      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
                    }
                  }
                }

                .node-address {
                  display: flex;
                  align-items: center;
                  font-size: 14px;
                  color: #64748b;
                  font-family:
                    "JetBrains Mono", "SF Mono", "Monaco", "Menlo", monospace;
                  transition: all 0.3s ease;
                  background: rgba(255, 255, 255, 0.8);
                  padding: 8px 12px;
                  border-radius: 12px;
                  border: 1px solid rgba(226, 232, 240, 0.6);
                  backdrop-filter: blur(10px);
                  font-weight: 600;

                  .address-icon {
                    margin-right: 8px;
                    font-size: 14px;
                    color: #94a3b8;
                    transition: all 0.3s ease;
                  }

                  &:hover {
                    color: #3b82f6;
                    background: rgba(59, 130, 246, 0.1);
                    border-color: rgba(59, 130, 246, 0.3);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);

                    .address-icon {
                      color: #3b82f6;
                      transform: scale(1.1);
                    }
                  }
                }
              }

              .node-status {
                flex-shrink: 0;

                .status-tag {
                  font-weight: 700;
                  border-radius: 12px;
                  padding: 8px 16px;
                  font-size: 13px;
                  line-height: 1.2;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                  border: 1px solid rgba(255, 255, 255, 0.3);
                  backdrop-filter: blur(10px);
                  position: relative;
                  overflow: hidden;

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
                      rgba(255, 255, 255, 0.3),
                      transparent
                    );
                    transition: left 0.5s ease;
                  }

                  &:hover {
                    transform: translateY(-3px) scale(1.05);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);

                    &::before {
                      left: 100%;
                    }
                  }

                  i {
                    margin-right: 6px;
                    font-size: 12px;
                  }
                }
              }
            }

            .card-body {
              padding: 24px 28px;
              flex: 1;
              display: flex;
              flex-direction: column;
              background: rgba(255, 255, 255, 0.6);
              backdrop-filter: blur(5px);

              .node-details {
                .detail-row {
                  display: flex;
                  gap: 16px;
                  margin-bottom: 16px;

                  &:last-child {
                    margin-bottom: 0;
                  }

                  &.single {
                    .detail-item.full-width {
                      flex: none;
                      width: 100%;
                    }
                  }

                  .detail-item {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    padding: 16px 18px;
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 16px;
                    border: 1px solid rgba(226, 232, 240, 0.6);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(10px);

                    &::before {
                      content: "";
                      position: absolute;
                      top: 0;
                      left: 0;
                      width: 4px;
                      height: 100%;
                      background: linear-gradient(
                        180deg,
                        #3b82f6,
                        #1d4ed8,
                        #1e40af
                      );
                      opacity: 0;
                      transition: all 0.3s ease;
                      border-radius: 0 4px 4px 0;
                    }

                    &:hover {
                      background: rgba(59, 130, 246, 0.1);
                      border-color: rgba(59, 130, 246, 0.3);
                      transform: translateY(-4px) scale(1.02);
                      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);

                      &::before {
                        opacity: 1;
                      }
                    }

                    .detail-icon {
                      width: 28px;
                      height: 28px;
                      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                      color: #ffffff;
                      border-radius: 8px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 14px;
                      margin-right: 12px;
                      flex-shrink: 0;
                      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                    }

                    &:hover .detail-icon {
                      transform: scale(1.1) rotate(10deg);
                      background: linear-gradient(135deg, #2563eb, #1e40af);
                      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                    }

                    .detail-info {
                      flex: 1;
                      min-width: 0;

                      .detail-label {
                        display: block;
                        font-size: 11px;
                        color: #64748b;
                        line-height: 1.3;
                        margin-bottom: 4px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        opacity: 0.8;
                      }

                      .detail-value {
                        display: block;
                        font-size: 15px;
                        font-weight: 800;
                        color: #1e293b;
                        line-height: 1.3;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        background: linear-gradient(135deg, #1e293b, #475569);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;

                        &.env-up {
                          color: #52c41a;
                        }

                        &.env-down {
                          color: #ff4d4f;
                        }

                        &.env-prod {
                          color: #fa541c;
                        }

                        &.env-dev {
                          color: #1890ff;
                        }

                        &.env-test {
                          color: #722ed1;
                        }

                        &.config-value {
                          font-family: "SF Mono", "Monaco", "Menlo", monospace;
                          font-size: 11px;
                          background: rgba(0, 0, 0, 0.02);
                          padding: 2px 6px;
                          border-radius: 4px;
                          color: #595959;
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
              padding: 20px 28px 24px;
              background: linear-gradient(
                135deg,
                rgba(248, 250, 252, 0.9),
                rgba(241, 245, 249, 0.8)
              );
              border-top: 1px solid rgba(255, 255, 255, 0.2);
              margin-top: auto;
              backdrop-filter: blur(10px);

              .footer-info {
                display: flex;
                gap: 24px;
                flex: 1;

                .connect-time,
                .last-heartbeat {
                  display: flex;
                  align-items: center;
                  font-size: 13px;
                  color: #64748b;
                  transition: all 0.3s ease;
                  font-weight: 600;
                  background: rgba(255, 255, 255, 0.6);
                  padding: 6px 10px;
                  border-radius: 10px;
                  border: 1px solid rgba(226, 232, 240, 0.6);
                  backdrop-filter: blur(5px);

                  &:hover {
                    color: #3b82f6;
                    background: rgba(59, 130, 246, 0.1);
                    border-color: rgba(59, 130, 246, 0.3);
                    transform: translateY(-1px);
                  }

                  i {
                    margin-right: 8px;
                    font-size: 14px;
                    transition: all 0.3s ease;
                  }

                  &:hover i {
                    transform: scale(1.1);
                  }
                }

                .last-heartbeat {
                  .heartbeat-icon {
                    color: #ff4d4f;
                    animation: heartbeat 2s ease-in-out infinite;
                  }

                  .heartbeat-text {
                    font-family: "SF Mono", "Monaco", "Menlo", monospace;
                  }
                }
              }

              .card-actions {
                flex-shrink: 0;

                :deep(.el-button-group) {
                  border-radius: 6px;
                  overflow: hidden;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

                  .el-button {
                    border-radius: 0;
                    padding: 4px 8px;
                    font-size: 12px;
                    min-width: 28px;
                    height: 28px;
                    transition: all 0.2s ease;

                    &:first-child {
                      border-top-left-radius: 6px;
                      border-bottom-left-radius: 6px;
                    }

                    &:last-child {
                      border-top-right-radius: 6px;
                      border-bottom-right-radius: 6px;
                    }

                    &:hover {
                      transform: translateY(-1px);
                      z-index: 1;
                    }

                    i {
                      font-size: 12px;
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
      grid-template-columns: repeat(2, 1fr);
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
      grid-template-columns: 1fr;
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

// 悬停菜单样式
.node-action-menu {
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  overflow: hidden;
  animation: menuSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid rgba(59, 130, 246, 0.3);

  .menu-overlay {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    position: relative;
  }

  // 分页指示器
  .menu-pagination {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 6px;
    z-index: 10;

    .page-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      transition: all 0.3s ease;

      &.active {
        background: rgba(59, 130, 246, 0.8);
        transform: scale(1.2);
      }

      &:hover {
        background: rgba(255, 255, 255, 0.6);
      }
    }
  }

  .menu-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 12px;
    width: 100%;
    height: 100%;
    max-width: 300px;
    max-height: 280px;
  }

  // 分页导航按钮
  .menu-navigation {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;
    z-index: 10;

    .nav-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.8);
      color: var(--el-text-color-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      font-size: 14px;

      &:hover:not(:disabled) {
        background: rgba(59, 130, 246, 1);
        transform: scale(1.1);
      }

      &:disabled {
        background: rgba(255, 255, 255, 0.2);
        cursor: not-allowed;
        opacity: 0.5;
      }
    }
  }

  .action-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);

    &:hover {
      background: rgba(59, 130, 246, 0.2);
      border-color: rgba(59, 130, 246, 0.4);
      transform: translateY(-2px) scale(1.05);
      box-shadow:
        0 8px 25px rgba(59, 130, 246, 0.3),
        0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &:active {
      transform: translateY(0) scale(0.98);
    }

    i {
      font-size: 28px;
      color: rgba(255, 255, 255, 0.9);
      transition: all 0.3s ease;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    &:hover i {
      color: var(--el-text-color-primary);
      transform: scale(1.15);
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    }

    .tooltip {
      position: absolute;
      bottom: -35px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      color: var(--el-text-color-primary);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      pointer-events: none;
      z-index: 10000;

      &::before {
        content: "";
        position: absolute;
        top: -4px;
        left: 50%;
        transform: translateX(-50%);
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-bottom: 4px solid rgba(0, 0, 0, 0.9);
      }
    }

    &:hover .tooltip {
      opacity: 1;
      visibility: visible;
      bottom: -40px;
    }

    // 不同功能的特定颜色主题
    &.api-docs:hover {
      background: rgba(34, 197, 94, 0.2);
      border-color: rgba(34, 197, 94, 0.4);
      box-shadow:
        0 8px 25px rgba(34, 197, 94, 0.3),
        0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &.monitoring:hover {
      background: rgba(59, 130, 246, 0.2);
      border-color: rgba(59, 130, 246, 0.4);
      box-shadow:
        0 8px 25px rgba(59, 130, 246, 0.3),
        0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &.terminal:hover {
      background: rgba(15, 23, 42, 0.3);
      border-color: rgba(148, 163, 184, 0.4);
      box-shadow:
        0 8px 25px rgba(15, 23, 42, 0.4),
        0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &.files:hover {
      background: rgba(245, 158, 11, 0.2);
      border-color: rgba(245, 158, 11, 0.4);
      box-shadow:
        0 8px 25px rgba(245, 158, 11, 0.3),
        0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &.health:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.4);
      box-shadow:
        0 8px 25px rgba(239, 68, 68, 0.3),
        0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &.details:hover {
      background: rgba(168, 85, 247, 0.2);
      border-color: rgba(168, 85, 247, 0.4);
      box-shadow:
        0 8px 25px rgba(168, 85, 247, 0.3),
        0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &.logs:hover {
      background: rgba(6, 182, 212, 0.2);
      border-color: rgba(6, 182, 212, 0.4);
      box-shadow:
        0 8px 25px rgba(6, 182, 212, 0.3),
        0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &.settings:hover {
      background: rgba(107, 114, 128, 0.2);
      border-color: rgba(107, 114, 128, 0.4);
      box-shadow:
        0 8px 25px rgba(107, 114, 128, 0.3),
        0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &.restart:hover {
      background: rgba(220, 38, 38, 0.2);
      border-color: rgba(220, 38, 38, 0.4);
      box-shadow:
        0 8px 25px rgba(220, 38, 38, 0.3),
        0 4px 12px rgba(0, 0, 0, 0.2);
    }
  }
}

@keyframes menuSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9);
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    transform: scale(1);
    backdrop-filter: blur(20px);
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
