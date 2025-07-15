<template>
  <div class="node-management-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <div class="title-icon">
              <i class="ri-server-line"></i>
            </div>
            <span class="title-text">在线节点管理</span>
          </h1>
          <p class="page-description">实时监控和管理所有在线节点的状态和性能</p>
        </div>
        <div class="header-actions">
          <el-button
            type="primary"
            :loading="loading"
            @click="refreshNodes"
            class="refresh-btn"
          >
            <i class="ri-refresh-line"></i>
            刷新节点
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card total-nodes" @click="filterByStatus('all')">
          <div class="stat-background">
            <div class="stat-pattern"></div>
          </div>
          <div class="stat-content">
            <div class="stat-icon">
              <i class="ri-server-line"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value" :class="{ counting: isCountingUp }">
                {{ animatedStats.totalNodes }}
              </div>
              <div class="stat-label">总节点数</div>
              <div class="stat-trend">
                <i class="ri-arrow-up-line trend-icon"></i>
                <span class="trend-text">实时更新</span>
              </div>
            </div>
          </div>
        </div>

        <div class="stat-card online-nodes" @click="filterByStatus('ONLINE')">
          <div class="stat-background">
            <div class="stat-pattern"></div>
          </div>
          <div class="stat-content">
            <div class="stat-icon">
              <i class="ri-checkbox-circle-line"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value" :class="{ counting: isCountingUp }">
                {{ animatedStats.onlineNodes }}
              </div>
              <div class="stat-label">在线节点</div>
              <div class="stat-trend">
                <i class="ri-pulse-line trend-icon"></i>
                <span class="trend-text">{{ getOnlineRate() }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="stat-card healthy-nodes" @click="filterByStatus('healthy')">
          <div class="stat-background">
            <div class="stat-pattern"></div>
          </div>
          <div class="stat-content">
            <div class="stat-icon">
              <i class="ri-heart-pulse-line"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value" :class="{ counting: isCountingUp }">
                {{ animatedStats.healthyNodes }}
              </div>
              <div class="stat-label">健康节点</div>
              <div class="stat-trend">
                <i class="ri-heart-line trend-icon"></i>
                <span class="trend-text">{{ getHealthRate() }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="stat-card error-nodes" @click="filterByStatus('error')">
          <div class="stat-background">
            <div class="stat-pattern"></div>
          </div>
          <div class="stat-content">
            <div class="stat-icon">
              <i class="ri-error-warning-line"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value" :class="{ counting: isCountingUp }">
                {{ animatedStats.errorNodes }}
              </div>
              <div class="stat-label">异常节点</div>
              <div class="stat-trend">
                <i class="ri-alert-line trend-icon"></i>
                <span class="trend-text">需关注</span>
              </div>
            </div>
          </div>
        </div>
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
                <i class="ri-search-line"></i>
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
                :type="viewMode === 'card' ? 'primary' : 'default'"
                @click="viewMode = 'card'"
              >
                <i class="ri-grid-line"></i>
              </el-button>
              <el-button
                :type="viewMode === 'table' ? 'primary' : 'default'"
                @click="viewMode = 'table'"
              >
                <i class="ri-list-check"></i>
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
            <i class="ri-refresh-line"></i>
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
              :class="getNodeCardClass(node)"
              @click="viewNodeDetail(node)"
            >
              <div class="card-header">
                <div class="node-info">
                  <div class="node-name">
                    <i class="ri-server-line node-icon"></i>
                    <span class="name-text">{{
                      node.nodeName || node.applicationName
                    }}</span>
                  </div>
                  <div class="node-address">
                    <i class="ri-global-line address-icon"></i>
                    <span>{{ node.ipAddress }}:{{ node.port }}</span>
                  </div>
                </div>
                <div class="node-status">
                  <el-tag
                    :type="getStatusType(node.status)"
                    :effect="node.status === 'ONLINE' ? 'dark' : 'plain'"
                    class="status-tag"
                  >
                    <i :class="getStatusIcon(node.status)"></i>
                    {{ getStatusText(node.status) }}
                  </el-tag>
                </div>
              </div>

              <div class="card-body">
                <div class="metrics-grid">
                  <div class="metric-item">
                    <div class="metric-icon cpu">
                      <i class="ri-cpu-line"></i>
                    </div>
                    <div class="metric-info">
                      <div class="metric-label">CPU</div>
                      <div class="metric-value">
                        {{ formatPercentage(node.cpuUsage) }}
                      </div>
                    </div>
                  </div>
                  <div class="metric-item">
                    <div class="metric-icon memory">
                      <i class="ri-database-line"></i>
                    </div>
                    <div class="metric-info">
                      <div class="metric-label">内存</div>
                      <div class="metric-value">
                        {{ formatPercentage(node.memoryUsage) }}
                      </div>
                    </div>
                  </div>
                  <div class="metric-item">
                    <div class="metric-icon disk">
                      <i class="ri-hard-drive-line"></i>
                    </div>
                    <div class="metric-info">
                      <div class="metric-label">磁盘</div>
                      <div class="metric-value">
                        {{ formatPercentage(node.diskUsage) }}
                      </div>
                    </div>
                  </div>
                  <div class="metric-item">
                    <div class="metric-icon network">
                      <i class="ri-wifi-line"></i>
                    </div>
                    <div class="metric-info">
                      <div class="metric-label">延迟</div>
                      <div class="metric-value">
                        {{ formatLatency(node.networkLatency) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <div class="footer-info">
                  <div class="last-heartbeat">
                    <i class="ri-heart-pulse-line heartbeat-icon"></i>
                    <span class="heartbeat-text">
                      {{ formatHeartbeat(node.lastHeartbeatTime) }}
                    </span>
                  </div>
                  <div class="connection-count">
                    <i class="ri-links-line"></i>
                    <span>{{ node.connectionCount || 0 }} 连接</span>
                  </div>
                </div>
                <div class="card-actions">
                  <el-button-group size="small">
                    <el-button
                      @click.stop="checkNodeHealth(node)"
                      :loading="node.checking"
                    >
                      <i class="ri-stethoscope-line"></i>
                    </el-button>
                    <el-button @click.stop="viewNodeDetail(node)">
                      <i class="ri-eye-line"></i>
                    </el-button>
                  </el-button-group>
                </div>
              </div>
            </div>
          </div>
        </transition-group>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  fetchAllOnlineNodes,
  fetchNodeStatistics,
  apiCheckNodeHealth,
  type OnlineNodeInfo,
  type NodeStatistics,
} from "@/api/node-management";
import { parseTime } from "@/utils/const";

// 响应式数据
const loading = ref(false);
const nodeList = ref<OnlineNodeInfo[]>([]);
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
      return "ri-checkbox-circle-line";
    case "OFFLINE":
      return "ri-close-circle-line";
    case "MAINTENANCE":
      return "ri-tools-line";
    default:
      return "ri-question-line";
  }
};

const formatPercentage = (value: number | null | undefined) => {
  if (value == null) return "-";
  return `${Math.round(value)}%`;
};

const formatLatency = (value: number | null | undefined) => {
  if (value == null) return "-";
  return `${value}ms`;
};

const formatHeartbeat = (time: string | null | undefined) => {
  if (!time) return "无心跳";
  return parseTime(time, "{y}-{m}-{d} {h}:{i}:{s}");
};

// 节点操作
const viewNodeDetail = (node: OnlineNodeInfo) => {
  // TODO: 实现节点详情查看
  console.log("查看节点详情:", node);
};

const checkNodeHealth = async (node: OnlineNodeInfo) => {
  node.checking = true;
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
    node.checking = false;
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
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;

  // 页面标题
  .page-header {
    margin-bottom: 24px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 24px 32px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);

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
              color: white;
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
    margin-bottom: 24px;

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;

      .stat-card {
        position: relative;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 24px;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        overflow: hidden;

        &:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .stat-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0.1;
          z-index: 0;

          .stat-pattern {
            width: 100%;
            height: 100%;
            background-image:
              radial-gradient(
                circle at 20% 50%,
                currentColor 2px,
                transparent 2px
              ),
              radial-gradient(
                circle at 80% 50%,
                currentColor 2px,
                transparent 2px
              );
            background-size: 30px 30px;
            animation: patternMove 20s linear infinite;
          }
        }

        .stat-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;

          .stat-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 64px;
            height: 64px;
            border-radius: 16px;
            margin-right: 20px;
            font-size: 28px;
            color: white;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          }

          .stat-info {
            flex: 1;

            .stat-value {
              font-size: 32px;
              font-weight: 700;
              line-height: 1;
              margin-bottom: 4px;
              transition: all 0.3s ease;

              &.counting {
                color: #409eff;
                transform: scale(1.1);
              }
            }

            .stat-label {
              font-size: 14px;
              color: #64748b;
              font-weight: 500;
              margin-bottom: 8px;
            }

            .stat-trend {
              display: flex;
              align-items: center;
              font-size: 12px;
              color: #10b981;

              .trend-icon {
                margin-right: 4px;
                font-size: 14px;
              }

              .trend-text {
                font-weight: 500;
              }
            }
          }
        }

        // 不同类型的卡片样式
        &.total-nodes {
          .stat-icon {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .stat-background {
            color: #667eea;
          }
        }

        &.online-nodes {
          .stat-icon {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          }
          .stat-background {
            color: #10b981;
          }
        }

        &.healthy-nodes {
          .stat-icon {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          }
          .stat-background {
            color: #f59e0b;
          }
        }

        &.error-nodes {
          .stat-icon {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          }
          .stat-background {
            color: #ef4444;
          }
        }
      }
    }
  }

  // 搜索区域
  .search-section {
    margin-bottom: 24px;

    .search-card {
      border-radius: 16px;
      border: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

      :deep(.el-card__body) {
        padding: 20px 24px;
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
            width: 320px;

            :deep(.el-input__wrapper) {
              border-radius: 10px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
          }

          .app-filter,
          .status-filter {
            width: 160px;

            :deep(.el-select__wrapper) {
              border-radius: 10px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 12px;

        .node-card-wrapper {
          animation: cardSlideIn 0.6s ease-out both;

          .node-card {
            background: #ffffff;
            border-radius: 8px;
            padding: 0;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid #f0f0f0;
            overflow: hidden;
            position: relative;
            height: fit-content;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
              border-color: #e6f4ff;
            }

            // 状态指示条
            &::before {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              z-index: 1;
            }

            &.node-online::before {
              background: linear-gradient(90deg, #10b981, #059669);
            }

            &.node-offline::before {
              background: linear-gradient(90deg, #ef4444, #dc2626);
            }

            &.node-maintenance::before {
              background: linear-gradient(90deg, #f59e0b, #d97706);
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
              padding: 12px 14px;
              border-bottom: 1px solid #f5f5f5;

              .node-info {
                flex: 1;
                min-width: 0;

                .node-name {
                  display: flex;
                  align-items: center;
                  font-size: 14px;
                  font-weight: 600;
                  color: #262626;
                  margin-bottom: 4px;

                  .node-icon {
                    margin-right: 5px;
                    color: #1890ff;
                    font-size: 16px;
                  }

                  .name-text {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  }
                }

                .node-address {
                  display: flex;
                  align-items: center;
                  font-size: 12px;
                  color: #8c8c8c;
                  font-family: "SF Mono", "Monaco", "Menlo", monospace;

                  .address-icon {
                    margin-right: 4px;
                    font-size: 12px;
                  }
                }
              }

              .node-status {
                flex-shrink: 0;

                .status-tag {
                  font-weight: 500;
                  border-radius: 4px;
                  padding: 2px 8px;
                  font-size: 11px;
                  line-height: 1.4;

                  i {
                    margin-right: 2px;
                    font-size: 10px;
                  }
                }
              }
            }

            .card-body {
              padding: 12px 18px;

              .metrics-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;

                .metric-item {
                  display: flex;
                  align-items: center;
                  padding: 7px 9px;
                  background: rgba(248, 250, 252, 0.5);
                  border-radius: 7px;
                  transition: all 0.25s ease;
                  border: 1px solid rgba(0, 0, 0, 0.02);

                  &:hover {
                    background: rgba(248, 250, 252, 0.8);
                    transform: translateY(-1px);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
                  }

                  .metric-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    margin-right: 8px;
                    font-size: 14px;
                    color: white;

                    &.cpu {
                      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    }

                    &.memory {
                      background: linear-gradient(135deg, #10b981, #059669);
                    }

                    &.disk {
                      background: linear-gradient(135deg, #f59e0b, #d97706);
                    }

                    &.network {
                      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                    }
                  }

                  .metric-info {
                    flex: 1;
                    min-width: 0;

                    .metric-label {
                      font-size: 11px;
                      color: #64748b;
                      font-weight: 500;
                      margin-bottom: 1px;
                      line-height: 1.2;
                    }

                    .metric-value {
                      font-size: 14px;
                      font-weight: 600;
                      color: #1f2937;
                      font-family: "Monaco", "Menlo", monospace;
                      line-height: 1.2;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    }
                  }
                }
              }
            }

            .card-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 11px 18px 13px;
              background: rgba(248, 250, 252, 0.3);
              border-top: 1px solid rgba(0, 0, 0, 0.03);

              .footer-info {
                display: flex;
                flex-direction: column;
                gap: 4px;

                .last-heartbeat,
                .connection-count {
                  display: flex;
                  align-items: center;
                  font-size: 11px;
                  color: #64748b;

                  i {
                    margin-right: 4px;
                    font-size: 12px;
                  }
                }

                .last-heartbeat {
                  .heartbeat-icon {
                    color: #ef4444;
                    animation: heartbeat 2s ease-in-out infinite;
                  }

                  .heartbeat-text {
                    font-family: "Monaco", "Menlo", monospace;
                  }
                }
              }

              .card-actions {
                :deep(.el-button-group) {
                  .el-button {
                    border-radius: 5px;
                    padding: 4px 6px;
                    font-size: 12px;

                    &:first-child {
                      border-top-right-radius: 0;
                      border-bottom-right-radius: 0;
                    }

                    &:last-child {
                      border-top-left-radius: 0;
                      border-bottom-left-radius: 0;
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
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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
          padding: 12px 16px 10px;

          .node-info .node-name {
            font-size: 15px;

            .name-text {
              max-width: 150px;
            }
          }

          .node-info .node-address {
            font-size: 12px;
          }
        }

        .card-body {
          padding: 10px 16px;

          .metrics-grid {
            gap: 8px;

            .metric-item {
              padding: 6px 8px;

              .metric-icon {
                width: 24px;
                height: 24px;
                font-size: 12px;
                margin-right: 6px;
              }

              .metric-info {
                .metric-label {
                  font-size: 10px;
                }

                .metric-value {
                  font-size: 13px;
                }
              }
            }
          }
        }

        .card-footer {
          padding: 10px 16px 12px;

          .footer-info {
            gap: 3px;

            .last-heartbeat,
            .connection-count {
              font-size: 10px;

              i {
                font-size: 11px;
              }
            }
          }
        }
      }
    }
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
</style>
