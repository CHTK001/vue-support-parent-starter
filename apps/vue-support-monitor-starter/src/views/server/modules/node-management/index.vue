<template>
  <div class="node-management">
    <div class="page-header">
      <h2>在线节点管理</h2>
      <p class="page-description">管理和监控发现服务中的在线节点</p>
    </div>

    <!-- 统计信息 -->
    <div class="stats-container">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon online">
                <i class="ri-checkbox-circle-line"></i>
              </div>
              <div class="stats-info">
                <div class="stats-value" :class="{ updating: loading }">
                  {{ nodeStats.onlineCount }}
                </div>
                <div class="stats-label">在线节点</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon offline">
                <i class="ri-close-circle-line"></i>
              </div>
              <div class="stats-info">
                <div class="stats-value" :class="{ updating: loading }">
                  {{ nodeStats.offlineCount }}
                </div>
                <div class="stats-label">离线节点</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon total">
                <i class="ri-server-line"></i>
              </div>
              <div class="stats-info">
                <div class="stats-value" :class="{ updating: loading }">
                  {{ nodeStats.totalCount }}
                </div>
                <div class="stats-label">总节点数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon apps">
                <i class="ri-apps-line"></i>
              </div>
              <div class="stats-info">
                <div class="stats-value" :class="{ updating: loading }">
                  {{ nodeStats.applicationCount }}
                </div>
                <div class="stats-label">应用数量</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和操作栏 -->
    <el-card class="search-card" shadow="never">
      <div class="search-container">
        <div class="search-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索节点名称、IP地址或应用名称"
            style="width: 300px"
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
            style="width: 200px; margin-left: 12px"
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
        </div>
        <div class="search-right">
          <el-button type="primary" @click="refreshNodes" :loading="loading">
            <i class="ri-refresh-line mr-1"></i>
            刷新节点
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 节点卡片列表 -->
    <div class="nodes-container" v-loading="loading">
      <div v-if="filteredNodeList.length === 0" class="empty-container">
        <el-empty description="暂无节点数据" :image-size="100" />
      </div>
      <transition-group v-else name="node-list" tag="div" class="node-grid">
        <el-card
          v-for="(node, index) in filteredNodeList"
          :key="node.nodeId"
          class="node-card"
          :class="getNodeCardClass(node)"
          :style="{ animationDelay: `${index * 0.1}s` }"
          shadow="hover"
          @click="viewNodeDetail(node)"
        >
          <div class="node-card-header">
            <div class="node-info">
              <div class="node-name">
                <i class="ri-server-line mr-2"></i>
                {{ node.nodeName || node.applicationName }}
              </div>
              <div class="node-address">
                {{ node.ipAddress }}:{{ node.port }}
              </div>
            </div>
            <div class="node-status">
              <el-tag
                :type="getStatusType(node.status)"
                effect="dark"
                size="small"
              >
                {{ getStatusText(node.status) }}
              </el-tag>
            </div>
          </div>

          <div class="node-card-content">
            <!-- 性能指标 -->
            <div class="performance-metrics" v-if="hasPerformanceData(node)">
              <div
                class="metric-item"
                v-if="node.cpuUsage !== null && node.cpuUsage !== undefined"
              >
                <div class="metric-label">CPU</div>
                <div class="metric-progress">
                  <el-progress
                    :percentage="Math.round(node.cpuUsage)"
                    :color="getUsageColor(node.cpuUsage)"
                    :stroke-width="6"
                    :show-text="false"
                  />
                  <span class="metric-value"
                    >{{ Math.round(node.cpuUsage) }}%</span
                  >
                </div>
              </div>
              <div
                class="metric-item"
                v-if="
                  node.memoryUsage !== null && node.memoryUsage !== undefined
                "
              >
                <div class="metric-label">内存</div>
                <div class="metric-progress">
                  <el-progress
                    :percentage="Math.round(node.memoryUsage)"
                    :color="getUsageColor(node.memoryUsage)"
                    :stroke-width="6"
                    :show-text="false"
                  />
                  <span class="metric-value"
                    >{{ Math.round(node.memoryUsage) }}%</span
                  >
                </div>
              </div>
              <div
                class="metric-item"
                v-if="node.diskUsage !== null && node.diskUsage !== undefined"
              >
                <div class="metric-label">磁盘</div>
                <div class="metric-progress">
                  <el-progress
                    :percentage="Math.round(node.diskUsage)"
                    :color="getUsageColor(node.diskUsage)"
                    :stroke-width="6"
                    :show-text="false"
                  />
                  <span class="metric-value"
                    >{{ Math.round(node.diskUsage) }}%</span
                  >
                </div>
              </div>
            </div>

            <!-- 基本信息 -->
            <div class="node-details">
              <div class="detail-item">
                <span class="detail-label">应用名称:</span>
                <span class="detail-value">{{
                  node.applicationName || "-"
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">版本:</span>
                <span class="detail-value">{{ node.version || "-" }}</span>
              </div>
              <div class="detail-item" v-if="node.responseTime">
                <span class="detail-label">响应时间:</span>
                <span class="detail-value">{{ node.responseTime }}ms</span>
              </div>
              <div class="detail-item" v-if="node.connectionCount">
                <span class="detail-label">连接数:</span>
                <span class="detail-value">{{ node.connectionCount }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">健康状态:</span>
                <span class="detail-value">
                  <el-tag
                    :type="node.healthy ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ node.healthy ? "健康" : "异常" }}
                  </el-tag>
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">最后心跳:</span>
                <span class="detail-value">
                  {{
                    node.lastHeartbeatTime
                      ? parseTime(node.lastHeartbeatTime)
                      : "-"
                  }}
                </span>
              </div>
            </div>
          </div>

          <div class="node-card-footer">
            <el-button
              type="primary"
              size="small"
              @click.stop="viewNodeDetail(node)"
            >
              查看详情
            </el-button>
            <el-button
              v-if="node.status === 'ONLINE'"
              type="success"
              size="small"
              @click.stop="checkNodeHealth(node)"
            >
              健康检查
            </el-button>
          </div>
        </el-card>
      </transition-group>
    </div>

    <!-- 节点详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="节点详情"
      width="600px"
      :before-close="closeDetailDialog"
    >
      <div v-if="selectedNode" class="node-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="节点名称">
            {{ selectedNode.nodeName }}
          </el-descriptions-item>
          <el-descriptions-item label="节点地址">
            {{ selectedNode.ipAddress }}
          </el-descriptions-item>
          <el-descriptions-item label="端口">
            {{ selectedNode.port }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedNode.status)" effect="dark">
              {{ getStatusText(selectedNode.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最后心跳">
            {{
              selectedNode.lastHeartbeatTime
                ? parseTime(selectedNode.lastHeartbeatTime)
                : "-"
            }}
          </el-descriptions-item>
          <el-descriptions-item label="连接时间">
            {{
              selectedNode.connectTime
                ? parseTime(selectedNode.connectTime)
                : "-"
            }}
          </el-descriptions-item>
          <el-descriptions-item label="服务版本" v-if="selectedNode.version">
            {{ selectedNode.version }}
          </el-descriptions-item>
          <el-descriptions-item label="节点类型" v-if="selectedNode.nodeType">
            {{ selectedNode.nodeType }}
          </el-descriptions-item>
          <el-descriptions-item label="健康状态">
            <el-tag :type="selectedNode.healthy ? 'success' : 'danger'">
              {{ selectedNode.healthy ? "健康" : "异常" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item
            label="连接数"
            v-if="selectedNode.connectionCount"
          >
            {{ selectedNode.connectionCount }}
          </el-descriptions-item>
          <el-descriptions-item
            label="响应时间"
            v-if="selectedNode.responseTime"
          >
            {{ selectedNode.responseTime }}ms
          </el-descriptions-item>
          <el-descriptions-item
            label="网络延迟"
            v-if="selectedNode.networkLatency"
          >
            {{ selectedNode.networkLatency }}ms
          </el-descriptions-item>
        </el-descriptions>

        <!-- 性能指标详情 -->
        <div
          v-if="hasPerformanceData(selectedNode)"
          class="performance-details"
        >
          <h4>性能指标</h4>
          <el-row :gutter="16">
            <el-col
              :span="8"
              v-if="
                selectedNode.cpuUsage !== null &&
                selectedNode.cpuUsage !== undefined
              "
            >
              <div class="metric-detail-card">
                <div class="metric-detail-header">
                  <i class="ri-cpu-line"></i>
                  <span>CPU使用率</span>
                </div>
                <div class="metric-detail-content">
                  <div class="metric-detail-value">
                    {{ Math.round(selectedNode.cpuUsage) }}%
                  </div>
                  <el-progress
                    :percentage="Math.round(selectedNode.cpuUsage)"
                    :color="getUsageColor(selectedNode.cpuUsage)"
                    :stroke-width="6"
                  />
                </div>
              </div>
            </el-col>
            <el-col
              :span="8"
              v-if="
                selectedNode.memoryUsage !== null &&
                selectedNode.memoryUsage !== undefined
              "
            >
              <div class="metric-detail-card">
                <div class="metric-detail-header">
                  <i class="ri-database-line"></i>
                  <span>内存使用率</span>
                </div>
                <div class="metric-detail-content">
                  <div class="metric-detail-value">
                    {{ Math.round(selectedNode.memoryUsage) }}%
                  </div>
                  <el-progress
                    :percentage="Math.round(selectedNode.memoryUsage)"
                    :color="getUsageColor(selectedNode.memoryUsage)"
                    :stroke-width="6"
                  />
                </div>
              </div>
            </el-col>
            <el-col
              :span="8"
              v-if="
                selectedNode.diskUsage !== null &&
                selectedNode.diskUsage !== undefined
              "
            >
              <div class="metric-detail-card">
                <div class="metric-detail-header">
                  <i class="ri-hard-drive-line"></i>
                  <span>磁盘使用率</span>
                </div>
                <div class="metric-detail-content">
                  <div class="metric-detail-value">
                    {{ Math.round(selectedNode.diskUsage) }}%
                  </div>
                  <el-progress
                    :percentage="Math.round(selectedNode.diskUsage)"
                    :color="getUsageColor(selectedNode.diskUsage)"
                    :stroke-width="6"
                  />
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div v-if="selectedNode.metadata" class="metadata-section">
          <h4>节点元数据</h4>
          <el-table :data="metadataList" border size="small">
            <el-table-column prop="key" label="键" width="150" />
            <el-table-column prop="value" label="值" show-overflow-tooltip />
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeDetailDialog">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { ElMessage } from "element-plus";
import { parseTime } from "@/utils/const";
import {
  fetchAllOnlineNodes,
  fetchNodeStatistics,
  checkNodeHealth as apiCheckNodeHealth,
  type OnlineNodeInfo,
  type NodeStatistics as BackendNodeStatistics,
} from "@/api/node-management";

// 前端使用的节点统计接口
interface NodeStatistics {
  onlineCount: number;
  offlineCount: number;
  totalCount: number;
  applicationCount: number;
}

// 响应式数据
const loading = ref(false);
const nodeList = ref<OnlineNodeInfo[]>([]);
const detailDialogVisible = ref(false);
const selectedNode = ref<OnlineNodeInfo | null>(null);
const searchKeyword = ref("");
const selectedApplication = ref("");
const nodeStats = ref<NodeStatistics>({
  onlineCount: 0,
  offlineCount: 0,
  totalCount: 0,
  applicationCount: 0,
});

// 性能统计数据
const performanceStats = ref<BackendNodeStatistics | null>(null);

// 轮询定时器
let pollingTimer: NodeJS.Timeout | null = null;
const POLLING_INTERVAL = 30000; // 30秒轮询间隔

// 计算属性
const metadataList = computed(() => {
  if (!selectedNode.value?.metadata) return [];
  return Object.entries(selectedNode.value.metadata).map(([key, value]) => ({
    key,
    value: typeof value === "object" ? JSON.stringify(value) : String(value),
  }));
});

// 应用列表
const applicationList = computed(() => {
  const apps = new Set(
    nodeList.value.map((node) => node.applicationName).filter(Boolean)
  );
  return Array.from(apps);
});

// 过滤后的节点列表
const filteredNodeList = computed(() => {
  let filtered = nodeList.value;

  // 按搜索关键词过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    filtered = filtered.filter(
      (node) =>
        (node.nodeName && node.nodeName.toLowerCase().includes(keyword)) ||
        node.applicationName.toLowerCase().includes(keyword) ||
        node.ipAddress.toLowerCase().includes(keyword)
    );
  }

  // 按应用过滤
  if (selectedApplication.value) {
    filtered = filtered.filter(
      (node) => node.applicationName === selectedApplication.value
    );
  }

  return filtered;
});

// 获取状态类型
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
      return "warning";
  }
};

// 获取状态文本
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

// 获取节点卡片样式类
const getNodeCardClass = (node: OnlineNodeInfo) => {
  return {
    "node-online": node.status === "ONLINE",
    "node-offline": node.status === "OFFLINE",
    "node-error": node.status === "ERROR",
    "node-maintenance": node.status === "MAINTENANCE",
  };
};

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

// 应用过滤处理
const handleApplicationFilter = () => {
  // 过滤逻辑已在计算属性中处理
};

// 检查节点是否有性能数据
const hasPerformanceData = (node: OnlineNodeInfo) => {
  return (
    (node.cpuUsage !== null && node.cpuUsage !== undefined) ||
    (node.memoryUsage !== null && node.memoryUsage !== undefined) ||
    (node.diskUsage !== null && node.diskUsage !== undefined)
  );
};

// 根据使用率获取颜色
const getUsageColor = (usage: number) => {
  if (usage >= 90) return "#f56c6c"; // 红色 - 危险
  if (usage >= 80) return "#e6a23c"; // 橙色 - 警告
  if (usage >= 60) return "#409eff"; // 蓝色 - 正常
  return "#67c23a"; // 绿色 - 良好
};

// 获取响应时间描述
const getResponseTimeDescription = (responseTime: number) => {
  if (responseTime <= 100) return "极快";
  if (responseTime <= 300) return "快速";
  if (responseTime <= 1000) return "正常";
  if (responseTime <= 3000) return "较慢";
  return "缓慢";
};

// 获取节点列表
const getNodeList = async () => {
  try {
    const response = await fetchAllOnlineNodes();
    if (response.code === "00000") {
      // 保留之前的数据，只在新数据不为空时更新
      // 这样可以避免在配置保存后短暂的数据为空期间清空显示
      const newData = response.data || [];
      if (newData.length > 0 || nodeList.value.length === 0) {
        nodeList.value = newData;
        // 只有在更新了节点列表时才更新本地统计，确保数据一致性
        updateNodeStats();
      }
      // 如果没有更新节点列表，不调用updateNodeStats，避免统计数据与列表数据不一致
    } else {
      ElMessage.error(response.msg || "获取节点列表失败");
    }
  } catch (error) {
    console.error("获取节点列表失败:", error);
    ElMessage.error("获取节点列表失败");
  }
};

// 获取节点统计信息
const getNodeStats = async () => {
  try {
    const response = await fetchNodeStatistics();
    if (response.code === "00000" && response.data) {
      const data = response.data;
      // 只有在后端返回有效数据时才更新统计，避免在配置保存后短暂的数据为空期间
      // 将统计数据重置为0，这样可以保持与节点列表的数据一致性
      if (data.totalNodes > 0 || nodeStats.value.totalCount === 0) {
        // 更新基础统计
        nodeStats.value = {
          onlineCount: data?.onlineNodes || 0,
          offlineCount: data?.offlineNodes || 0,
          totalCount: data?.totalNodes || 0,
          applicationCount: Object.keys(data?.nodesByApplication || {}).length,
        };
      }
      // 更新性能统计（性能统计可以为空，不影响基础统计的一致性）
      performanceStats.value = data;
    }
  } catch (error) {
    console.error("获取节点统计失败:", error);
  }
};

// 更新节点统计（本地计算）
const updateNodeStats = () => {
  const stats = {
    onlineCount: nodeList.value.filter((node) => node.status === "ONLINE")
      .length,
    offlineCount: nodeList.value.filter((node) => node.status === "OFFLINE")
      .length,
    totalCount: nodeList.value.length,
    applicationCount: new Set(
      nodeList.value.map((node) => node.applicationName)
    ).size,
  };
  nodeStats.value = stats;
};

// 刷新节点列表
const refreshNodes = async () => {
  loading.value = true;
  try {
    // 先获取节点列表，再获取统计信息
    await getNodeList();
    await getNodeStats();
    ElMessage.success("节点列表刷新成功");
  } catch (error) {
    console.error("刷新节点列表失败:", error);
    ElMessage.error("刷新节点列表失败");
  } finally {
    loading.value = false;
  }
};

// 查看节点详情
const viewNodeDetail = (node: OnlineNodeInfo) => {
  selectedNode.value = node;
  detailDialogVisible.value = true;
};

// 检查节点健康状态
const checkNodeHealth = async (node: OnlineNodeInfo) => {
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
  }
};

// 关闭详情对话框
const closeDetailDialog = () => {
  detailDialogVisible.value = false;
  selectedNode.value = null;
};

// 启动轮询
const startPolling = () => {
  // 清除现有定时器
  if (pollingTimer) {
    clearInterval(pollingTimer);
  }

  // 设置新的定时器
  pollingTimer = setInterval(async () => {
    try {
      // 静默刷新，不显示loading状态
      // 先获取节点列表，再获取统计信息，确保数据一致性
      await getNodeList();
      await getNodeStats();
    } catch (error) {
      console.error("轮询刷新节点数据失败:", error);
    }
  }, POLLING_INTERVAL);
};

// 停止轮询
const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};

// 组件挂载时加载数据并启动轮询
onMounted(() => {
  refreshNodes();
  startPolling();
});

// 组件卸载时停止轮询
onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped lang="scss">
.node-management {
  padding: 20px;

  .page-header {
    margin-bottom: 20px;

    h2 {
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
      font-size: 24px;
      font-weight: 600;
    }

    .page-description {
      margin: 0;
      color: var(--el-text-color-regular);
      font-size: 14px;
    }
  }

  // 统计卡片样式
  .stats-container {
    margin-bottom: 20px;

    .stats-card {
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .stats-content {
        display: flex;
        align-items: center;
        padding: 8px;

        .stats-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          font-size: 24px;

          &.online {
            background: rgba(103, 194, 58, 0.1);
            color: #67c23a;
          }

          &.offline {
            background: rgba(245, 108, 108, 0.1);
            color: #f56c6c;
          }

          &.total {
            background: rgba(64, 158, 255, 0.1);
            color: #409eff;
          }

          &.apps {
            background: rgba(230, 162, 60, 0.1);
            color: #e6a23c;
          }
        }

        .stats-info {
          .stats-value {
            font-size: 24px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            line-height: 1;
            margin-bottom: 4px;
            transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);

            // 数字变化时的动画效果
            &.updating {
              transform: scale(1.1);
              color: var(--el-color-primary);
            }
          }

          .stats-label {
            font-size: 14px;
            color: var(--el-text-color-regular);
            transition: color 0.3s ease;
          }
        }
      }
    }
  }

  // 性能统计面板样式
  .performance-stats-container {
    margin-bottom: 20px;

    .performance-card {
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .card-header {
        display: flex;
        align-items: center;

        .card-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          display: flex;
          align-items: center;
        }
      }

      .performance-content {
        padding: 16px 0;

        .performance-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--el-text-color-primary);
          margin-bottom: 12px;
          text-align: center;
        }

        .performance-description {
          text-align: center;
          font-size: 12px;
          color: var(--el-text-color-regular);
          margin-top: 8px;
        }
      }
    }
  }

  // 搜索卡片样式
  .search-card {
    margin-bottom: 20px;
    border: 1px solid var(--el-border-color-light);

    .search-container {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .search-left {
        display: flex;
        align-items: center;
      }
    }
  }

  // 节点容器样式
  .nodes-container {
    .empty-container {
      padding: 40px 0;
      text-align: center;
    }

    .node-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
    }
  }

  // 节点列表动画
  .node-list-enter-active {
    animation: nodeSlideIn 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .node-list-leave-active {
    animation: nodeSlideOut 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .node-list-move {
    transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  @keyframes nodeSlideIn {
    0% {
      opacity: 0;
      transform: translateY(30px) scale(0.9);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes nodeSlideOut {
    0% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-30px) scale(0.9);
    }
  }

  @keyframes cardFadeIn {
    0% {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  // 节点卡片样式
  .node-card {
    border-radius: 12px;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    cursor: pointer;
    border: 2px solid transparent;
    position: relative;
    overflow: hidden;
    animation: cardFadeIn 0.8s cubic-bezier(0.25, 0.8, 0.25, 1) both;

    // 添加微妙的背景渐变
    background: linear-gradient(
      135deg,
      var(--el-bg-color) 0%,
      var(--el-fill-color-lighter) 100%
    );

    &:hover {
      transform: translateY(-6px) scale(1.02);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
      border-color: var(--el-color-primary-light-7);
    }

    &.node-online {
      border-left: 4px solid #67c23a;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, #67c23a, #85ce61);
        opacity: 0.8;
      }
    }

    &.node-offline {
      border-left: 4px solid #f56c6c;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, #f56c6c, #f78989);
        opacity: 0.8;
      }
    }

    &.node-error {
      border-left: 4px solid #f56c6c;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, #f56c6c, #f78989);
        opacity: 0.8;
      }
    }

    &.node-maintenance {
      border-left: 4px solid #e6a23c;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, #e6a23c, #ebb563);
        opacity: 0.8;
      }
    }

    .node-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;

      .node-info {
        flex: 1;

        .node-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin-bottom: 4px;
          display: flex;
          align-items: center;
        }

        .node-address {
          font-size: 14px;
          color: var(--el-text-color-regular);
          font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
        }
      }

      .node-status {
        flex-shrink: 0;
      }
    }

    .node-card-content {
      margin-bottom: 16px;

      // 性能指标样式
      .performance-metrics {
        margin-bottom: 16px;
        padding: 16px;
        background: linear-gradient(
          135deg,
          var(--el-fill-color-lighter) 0%,
          var(--el-fill-color-light) 100%
        );
        border-radius: 8px;
        border: 1px solid var(--el-border-color-lighter);
        transition: all 0.3s ease;

        &:hover {
          background: linear-gradient(
            135deg,
            var(--el-fill-color-light) 0%,
            var(--el-fill-color) 100%
          );
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .metric-item {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          transition: all 0.3s ease;

          &:last-child {
            margin-bottom: 0;
          }

          &:hover {
            transform: translateX(2px);
          }

          .metric-label {
            font-size: 13px;
            color: var(--el-text-color-regular);
            width: 45px;
            flex-shrink: 0;
            font-weight: 500;
          }

          .metric-progress {
            flex: 1;
            display: flex;
            align-items: center;
            margin-left: 12px;

            .el-progress {
              flex: 1;
              margin-right: 12px;

              :deep(.el-progress-bar__outer) {
                transition: all 0.6s ease;
              }

              :deep(.el-progress-bar__inner) {
                transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
              }
            }

            .metric-value {
              font-size: 13px;
              font-weight: 700;
              color: var(--el-text-color-primary);
              width: 40px;
              text-align: right;
              transition: all 0.3s ease;
            }
          }
        }
      }

      .node-details {
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid var(--el-border-color-lighter);

          &:last-child {
            border-bottom: none;
          }

          .detail-label {
            font-size: 14px;
            color: var(--el-text-color-regular);
            font-weight: 500;
          }

          .detail-value {
            font-size: 14px;
            color: var(--el-text-color-primary);
            text-align: right;
            max-width: 60%;
            word-break: break-all;
          }
        }
      }
    }

    .node-card-footer {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  }

  // 详情对话框样式
  .node-detail {
    .performance-details {
      margin-top: 20px;

      h4 {
        margin: 0 0 16px 0;
        color: var(--el-text-color-primary);
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;

        &:before {
          content: "";
          width: 4px;
          height: 16px;
          background: var(--el-color-primary);
          margin-right: 8px;
          border-radius: 2px;
        }
      }

      .metric-detail-card {
        background: var(--el-fill-color-lighter);
        border-radius: 8px;
        padding: 16px;
        text-align: center;

        .metric-detail-header {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;

          i {
            font-size: 18px;
            margin-right: 6px;
            color: var(--el-color-primary);
          }

          span {
            font-size: 14px;
            font-weight: 500;
            color: var(--el-text-color-primary);
          }
        }

        .metric-detail-content {
          .metric-detail-value {
            font-size: 24px;
            font-weight: 700;
            color: var(--el-text-color-primary);
            margin-bottom: 8px;
          }
        }
      }
    }

    .metadata-section {
      margin-top: 20px;

      h4 {
        margin: 0 0 12px 0;
        color: var(--el-text-color-primary);
        font-size: 14px;
        font-weight: 600;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .node-management {
    padding: 12px;

    .stats-container {
      .el-col {
        margin-bottom: 12px;
      }
    }

    .search-container {
      flex-direction: column;
      gap: 12px;

      .search-left {
        width: 100%;
        flex-direction: column;
        gap: 12px;

        .el-input,
        .el-select {
          width: 100% !important;
        }
      }
    }

    .node-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
