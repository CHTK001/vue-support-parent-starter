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
        </div>
      </el-card>
    </div>

    <!-- 节点列表 -->
    <div class="nodes-section">
      <ScTable
        ref="tableRef"
        :url="getNodePageList"
        :params="searchParams"
        row-key="nodeId"
        layout="card"
        :col-size="4"
        :row-size="3"
        :page-size="12"
        table-name="node-management-list"
      >
        <template #default="{ row }">
          <div
            class="node-card"
            :class="[getNodeCardClass(row)]"
            @click="viewNodeDetail(row)"
          >
            <div class="card-header">
              <div class="node-info">
                <div class="node-name">
                  <IconifyIconOnline
                    icon="ri:server-line"
                    class="node-icon"
                  />
                  <span class="name-text">{{
                    row.nodeName || row.applicationName
                  }}</span>
                </div>
                <div class="node-address">
                  <IconifyIconOnline
                    :icon="getOsIcon(row)"
                    class="os-icon"
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
                        :class="getEnvironmentClass(row.version)"
                        >java {{ row.version || "N/A" }}</span
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
                        row.contextPath || "/"
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
                <div class="connect-time" title="连接时间">
                  <IconifyIconOnline icon="ri:time-line" />
                  <span>{{ formatConnectTime(row.connectTime) }}</span>
                </div>
                <div class="last-heartbeat" title="最后心跳时间">
                  <IconifyIconOnline
                    icon="ri:heart-pulse-line"
                    class="heartbeat-icon"
                  />
                  <span class="heartbeat-text">
                    {{ formatHeartbeat(row.lastHeartbeatTime) }}
                  </span>
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
                    @click.stop="handleCheckNodeHealth(row)"
                    :loading="nodeCheckingStatus[row.nodeId]"
                    title="健康检查"
                  >
                    <IconifyIconOnline icon="ri:stethoscope-line" />
                  </el-button>
                  <el-button
                    @click.stop="viewNodeDetail(row)"
                    title="查看详情"
                  >
                    <IconifyIconOnline icon="ri:eye-line" />
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </div>
        </template>
      </ScTable>
    </div>

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

    <!-- 节点详情组件 -->
    <NodeDetail
      v-model="showNodeDetailDialog"
      :node-info="selectedNodeForDetail"
      @open-logger-config="openLoggerConfig"
      @open-log-viewer="openNodeLogs"
      @open-config-viewer="openNodeSettings"
      @open-restart-manager="restartNode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { message } from "@repo/utils";
import { useRouter } from "vue-router";
import {
  fetchAllOnlineNodes,
  fetchNodeStatistics,
  apiCheckNodeHealth,
  type OnlineNodeInfo,
  type NodeStatistics,
} from "@/api/server/node-management";
import LoggerConfig from "./module/logger-config/index.vue";
import LogViewer from "./module/log-viewer/index.vue";
import ConfigViewer from "./module/config-viewer/index.vue";
import RestartManager from "./module/restart-manager/index.vue";
import NodeDetail from "./module/node-detail/index.vue";
// 路由
const router = useRouter();

// ScTable 引用
const tableRef = ref();

// 响应式数据
const nodeList = ref<OnlineNodeInfo[]>([]);

// 搜索参数
const searchParams = reactive({
  keyword: "",
  applicationName: "",
  status: "",
  page: 1,
  size: 12,
});

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

// 搜索和筛选（兼容旧搜索框双向绑定）
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

// 节点详情组件相关
const showNodeDetailDialog = ref(false);
const selectedNodeForDetail = ref<OnlineNodeInfo | null>(null);

const selectedApplication = ref("");
const selectedStatus = ref("");

/**
 * 获取节点分页列表（用于 ScTable）
 * @param params 搜索参数
 * @returns 分页数据
 */
const getNodePageList = async (params: any) => {
  try {
    const response = await fetchAllOnlineNodes();
    if (response.code === "00000") {
      let data = response.data || [];

      // 应用关键词筛选
      if (params.keyword) {
        const keyword = params.keyword.toLowerCase();
        data = data.filter(
          (node) =>
            (node.nodeName && node.nodeName.toLowerCase().includes(keyword)) ||
            (node.applicationName &&
              node.applicationName.toLowerCase().includes(keyword)) ||
            (node.ipAddress && node.ipAddress.toLowerCase().includes(keyword))
        );
      }

      // 应用名称筛选
      if (params.applicationName) {
        data = data.filter(
          (node) => node.applicationName === params.applicationName
        );
      }

      // 状态筛选
      if (params.status) {
        data = data.filter((node) => node.status === params.status);
      }

      // 更新统计数据
      nodeList.value = response.data || [];
      updateNodeStats();

      // 返回分页格式
      return {
        code: "00000",
        data: {
          records: data,
          total: data.length,
          size: params.size || 12,
          current: params.page || 1,
        },
      };
    }
    return response;
  } catch (error) {
    console.error("获取节点列表失败:", error);
    message.error("获取节点列表失败");
    return {
      code: "99999",
      data: { records: [], total: 0, size: 12, current: 1 },
    };
  }
};

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

// 方法
const refreshNodes = () => {
  getNodeStats();
  tableRef.value?.reload?.(searchParams, 1);
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
  searchParams.keyword = searchKeyword.value;
  tableRef.value?.reload?.(searchParams, 1);
};

const handleApplicationFilter = () => {
  searchParams.applicationName = selectedApplication.value;
  tableRef.value?.reload?.(searchParams, 1);
};

const handleStatusFilter = () => {
  searchParams.status = selectedStatus.value;
  tableRef.value?.reload?.(searchParams, 1);
};

const filterByStatus = (status: string) => {
  if (status === "all") {
    selectedStatus.value = "";
    searchParams.status = "";
  } else if (status === "healthy") {
    selectedStatus.value = "";
    searchParams.status = "";
  } else if (status === "error") {
    selectedStatus.value = "";
    searchParams.status = "";
  } else {
    selectedStatus.value = status;
    searchParams.status = status;
  }
  tableRef.value?.reload?.(searchParams, 1);
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

/**
 * 格式化连接时间（简短格式）
 * @param time 时间字符串
 */
const formatConnectTime = (time: string) => {
  if (!time) return "-";
  const date = new Date(time);
  if (isNaN(date.getTime())) return time;
  const now = new Date();
  // 今天的显示 HH:mm
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }
  // 非今天显示 MM-DD HH:mm
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

/**
 * 格式化心跳时间（相对时间）
 * @param time 时间字符串
 */
const formatHeartbeat = (time: string) => {
  if (!time) return "-";
  const date = new Date(time);
  if (isNaN(date.getTime())) return time;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}秒前`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
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

/**
 * 根据操作系统名称获取图标
 * @param node 节点信息
 */
const getOsIcon = (node: OnlineNodeInfo) => {
  const osName = (node.metadata?.osName || node.metadata?.os || "").toLowerCase();
  if (osName.includes("windows")) return "ri:windows-fill";
  if (osName.includes("mac") || osName.includes("darwin")) return "ri:apple-fill";
  if (osName.includes("linux")) return "ri:ubuntu-fill";
  if (osName.includes("ubuntu")) return "ri:ubuntu-fill";
  if (osName.includes("centos") || osName.includes("redhat") || osName.includes("fedora")) return "ri:centos-fill";
  if (osName.includes("debian")) return "simple-icons:debian";
  if (osName.includes("unix") || osName.includes("bsd")) return "ri:terminal-box-line";
  return "ri:computer-line";
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

// 节点功能方法
const openNodeDocumentation = (node: OnlineNodeInfo) => {
  if (!node) return;

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

const openNodeLogs = (node: OnlineNodeInfo) => {
  if (!node) return;

  // 打开日志查看组件
  showLogViewerDialog.value = true;
  selectedNodeForLogViewer.value = node;
};

const openLoggerConfig = (node: OnlineNodeInfo) => {
  if (!node) return;

  // 打开日志配置组件
  showLoggerConfigDialog.value = true;
  selectedNodeForLogger.value = node;
};

const openNodeSettings = (node: OnlineNodeInfo) => {
  if (!node) return;

  // 打开配置查看组件
  showConfigViewerDialog.value = true;
  selectedNodeForConfigViewer.value = node;
};

const restartNode = (node: OnlineNodeInfo) => {
  if (!node) return;

  // 打开重启管理组件
  showRestartManagerDialog.value = true;
  selectedNodeForRestartManager.value = node;
};

// 节点操作
/**
 * 查看节点详情
 * @param node 节点信息
 */
const viewNodeDetail = (node: OnlineNodeInfo) => {
  selectedNodeForDetail.value = node;
  showNodeDetailDialog.value = true;
};

const handleCheckNodeHealth = async (node: OnlineNodeInfo) => {
  nodeCheckingStatus.value[node.nodeId] = true;
  try {
    const response = await apiCheckNodeHealth(node.ipAddress, node.port);
    if (response.code === "00000") {
      message.success(
        `节点 ${node.nodeName || node.applicationName} 健康检查通过`
      );
    } else {
      message.warning(`节点健康检查失败: ${response.msg}`);
    }
  } catch (error) {
    console.error("节点健康检查失败:", error);
    message.error("节点健康检查失败");
  } finally {
    nodeCheckingStatus.value[node.nodeId] = false;
  }
};

// 生命周期
onMounted(() => {
  getNodeStats();
});
</script>

<style scoped lang="scss">
.node-management-container {
  padding: 24px;
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
          display: flex;
          align-items: center;
        }
      }
    }
  }

  // 节点列表区域
  .nodes-section {
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

    // 节点卡片样式
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

      &.node-online::before {
        background: linear-gradient(90deg, #10b981, #34d399);
      }

      &.node-offline::before {
        background: linear-gradient(90deg, #ef4444, #f87171);
      }

      &.node-maintenance::before {
        background: linear-gradient(90deg, #6b7280, #9ca3af);
      }

      &.node-connecting::before {
        background: linear-gradient(90deg, #f59e0b, #fbbf24);
        animation: connecting-pulse 1.5s ease-in-out infinite;
      }

      &.node-error::before {
        background: linear-gradient(90deg, #dc2626, #ef4444);
        animation: error-flash 1s ease-in-out infinite;
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

            .os-icon {
              margin-right: 6px;
              font-size: 14px;
              color: #64748b;
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
  }
}

@media (max-width: 768px) {
  .node-management-container {
    padding: 16px;

    .stats-section .stats-grid {
      grid-template-columns: 1fr !important;
      gap: 12px;
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

    .nodes-section .node-card {
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

        .node-details .detail-row {
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

</style>
