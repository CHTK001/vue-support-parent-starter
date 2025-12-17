<template>
  <div class="page-container">
    <!-- 容器 QPS 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="container in containerStats" :key="container.type">
        <el-card class="stat-card" :class="{ 'current-container': container.type === currentContainer }" shadow="hover">
          <div class="stat-header">
            <IconifyIconOnline :icon="container.icon" class="stat-icon" />
            <span class="stat-label">{{ container.label }}</span>
            <el-tag v-if="container.type === currentContainer" type="success" size="small" effect="dark" class="current-tag">当前容器</el-tag>
          </div>
          <div class="stat-content">
            <div class="stat-item">
              <span class="stat-value">{{ container.qps }}</span>
              <span class="stat-unit">QPS</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ formatNumber(container.totalRequests) }}</span>
              <span class="stat-unit">总请求</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ container.activeConnections }}</span>
              <span class="stat-unit">活跃连接</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据卡片 -->
    <el-card class="modern-card table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <IconifyIconOnline icon="ri:git-branch-line" class="card-icon" />
            映射列表
            <el-tag type="info" effect="plain" size="small" class="ml-2">{{ data.length }} 个路由</el-tag>
          </span>
          <div class="header-actions">
            <el-input v-model="searchKeyword" placeholder="搜索路由或类名..." clearable class="search-input">
              <template #prefix>
                <IconifyIconOnline icon="ep:search" />
              </template>
            </el-input>
            <el-button type="info" @click="refreshData" :loading="loading">
              <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredData" style="width: 100%" row-key="id" stripe highlight-current-row class="modern-table" height="calc(100vh - 450px)">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="路由路径" min-width="220">
          <template #default="{ row }">
            <el-tooltip placement="top">
              <template #content>
                <div style="max-width: 400px">
                  <div><strong>路由路径:</strong> {{ row.name }}</div>
                  <div><strong>处理类:</strong> {{ row.className }}</div>
                  <div v-if="row.method"><strong>处理方法:</strong> {{ row.method }}</div>
                </div>
              </template>
              <div class="route-path">
                <IconifyIconOnline icon="ri:link" class="route-icon" />
                <span class="path-text">{{ row.name }}</span>
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="className" label="处理类" min-width="300">
          <template #default="{ row }">
            <el-tooltip placement="top" :show-after="300">
              <template #content>
                <div style="max-width: 500px; word-break: break-all">
                  <div><strong>完整类名:</strong> {{ row.className }}</div>
                  <div v-if="row.method"><strong>方法名:</strong> {{ row.method }}</div>
                </div>
              </template>
              <span class="class-name">{{ row.className }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="qps" label="QPS" width="100">
          <template #default="{ row }">
            <el-tag :type="row.qps > 0 ? 'success' : 'info'" effect="plain" size="small">
              {{ row.qps || 0 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalRequests" label="总请求" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.totalRequests || 0) }}
          </template>
        </el-table-column>
        <el-table-column prop="avgDuration" label="平均耗时(ms)" width="120">
          <template #default="{ row }">
            {{ row.avgDuration ? row.avgDuration.toFixed(2) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="resource" label="资源" min-width="120">
          <template #default="{ row }">
            <el-tag v-if="row.resource" type="info" effect="plain" size="small">
              {{ row.resource }}
            </el-tag>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleInfo(row)">
              <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="infoVisible" title="映射详情" width="60%" destroy-on-close class="modern-dialog">
      <div class="detail-content">
        <pre class="code-block"><code>{{ info }}</code></pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { http } from "@repo/utils";
import { computed, onBeforeMount, onUnmounted, ref } from "vue";
import { wsService } from "@/utils/websocket";

const data = ref([]);
const loading = ref(false);
let qpsRefreshTimer = null;
const infoVisible = ref(false);
const info = ref("");
const searchKeyword = ref("");
let wsUnsubscribeMappings = null;
let wsUnsubscribeQps = null;
let wsUnsubscribeMappingQps = null;

// WebSocket 连接状态
const wsConnected = computed(() => wsService.connected.value);

// 处理 WebSocket 消息 - 路由映射数据推送
const handleMappingMessage = (message) => {
  if (message.event === "SPRING_MAPPING_UPDATE") {
    try {
      const newData = message.data;
      if (Array.isArray(newData)) {
        data.value = newData;
      }
    } catch (error) {
      console.error("解析路由映射数据失败:", error);
    }
  }
};

// 处理 WebSocket 消息 - 容器 QPS 统计推送
const handleQpsMessage = (message) => {
  if (message.event === "CONTAINER_QPS_UPDATE") {
    try {
      const res = message.data;
      if (res && res.status === 'ok') {
        const statsData = res.data;
        // 获取当前容器类型
        if (res.currentContainer) {
          currentContainer.value = res.currentContainer;
        }
        containerStats.value.forEach(container => {
          const stat = statsData[container.type];
          if (stat) {
            container.qps = stat.qps || 0;
            container.totalRequests = stat.totalRequests || 0;
            container.activeConnections = stat.activeConnections || 0;
          }
        });
      }
    } catch (error) {
      console.error("解析容器 QPS 数据失败:", error);
    }
  }
};

// 处理 WebSocket 消息 - 单个路由 QPS 推送
const handleMappingQpsMessage = (message) => {
  if (message.event === "MAPPING_QPS_UPDATE") {
    try {
      const qpsData = message.data;
      if (qpsData && qpsData.mappingId) {
        // 查找并更新对应路由的 QPS 数据
        const item = data.value.find(d => {
          const mappingId = d.method ? `${d.method}#${d.name}` : d.name;
          return mappingId === qpsData.mappingId || d.name === qpsData.url;
        });
        if (item) {
          item.qps = qpsData.qps || 0;
          item.totalRequests = qpsData.totalRequests || 0;
          item.avgDuration = qpsData.avgDuration || 0;
        }
      }
    } catch (error) {
      console.error("解析路由 QPS 数据失败:", error);
    }
  }
};

// 当前容器类型
const currentContainer = ref(null);

const containerStats = ref([
  { type: 'TOMCAT', label: 'Tomcat', icon: 'logos:tomcat', qps: 0, totalRequests: 0, activeConnections: 0 },
  { type: 'UNDERTOW', label: 'Undertow', icon: 'simple-icons:undertow', qps: 0, totalRequests: 0, activeConnections: 0 },
  { type: 'JETTY', label: 'Jetty', icon: 'simple-icons:eclipsejetty', qps: 0, totalRequests: 0, activeConnections: 0 },
  { type: 'NETTY', label: 'Netty', icon: 'simple-icons:netty', qps: 0, totalRequests: 0, activeConnections: 0 }
]);

// 过滤后的数据
const filteredData = computed(() => {
  if (!searchKeyword.value) return data.value;
  const keyword = searchKeyword.value.toLowerCase();
  return data.value.filter(item => item.name?.toLowerCase().includes(keyword) || item.className?.toLowerCase().includes(keyword));
});

const handleInfo = row => {
  info.value = JSON.stringify(row, null, 2);
  infoVisible.value = true;
};

// 格式化数字
const formatNumber = num => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num;
};

// 刷新数据
const refreshData = async () => {
  loading.value = true;
  try {
    const res = await http.get((window.agentPath || "/agent") + "/spring-mapping-data");
    if (res && typeof res === 'object' && Array.isArray(res.data.data)) {
      data.value = res.data.data;
    } else if (Array.isArray(res)) {
      data.value = res;
    } else {
      data.value = [];
    }
  } catch (error) {
    console.error("刷新数据失败:", error);
  } finally {
    loading.value = false;
  }
};

// 轮询QPS数据（作为WebSocket备份）
const fetchQpsData = async () => {
  try {
    const res = await http.get((window.agentPath || "/agent") + "/container-qps");
    if (res && res.data && res.data.status === 'ok') {
      const statsData = res.data.data;
      if (res.data.currentContainer) {
        currentContainer.value = res.data.currentContainer;
      }
      containerStats.value.forEach(container => {
        const stat = statsData[container.type];
        if (stat) {
          container.qps = stat.qps || 0;
          container.totalRequests = stat.totalRequests || 0;
          container.activeConnections = stat.activeConnections || 0;
        }
      });
    }
  } catch (error) {
    // 静默失败，不影响WebSocket推送
  }
};

onBeforeMount(async () => {
  // 连接 WebSocket
  wsService.connect();
  // 订阅路由映射数据推送
  wsUnsubscribeMappings = wsService.subscribe("SPRING", "SPRING_MAPPING_UPDATE", handleMappingMessage);
  // 订阅容器 QPS 统计推送
  wsUnsubscribeQps = wsService.subscribe("SERVER", "CONTAINER_QPS_UPDATE", handleQpsMessage);
  // 订阅单个路由 QPS 推送
  wsUnsubscribeMappingQps = wsService.subscribe("SERVER", "MAPPING_QPS_UPDATE", handleMappingQpsMessage);
  
  // 初始加载数据
  refreshData();
  // 初始加载QPS数据
  fetchQpsData();
  // 设置QPS轮询定时器（每5秒，作为WebSocket备份）
  qpsRefreshTimer = setInterval(fetchQpsData, 5000);
});

onUnmounted(() => {
  if (wsUnsubscribeMappings) {
    wsUnsubscribeMappings();
  }
  if (wsUnsubscribeQps) {
    wsUnsubscribeQps();
  }
  if (wsUnsubscribeMappingQps) {
    wsUnsubscribeMappingQps();
  }
  if (qpsRefreshTimer) {
    clearInterval(qpsRefreshTimer);
  }
});
</script>
<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
  background: var(--el-bg-color-page);
  overflow: hidden;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  &.current-container {
    border: 2px solid var(--el-color-success);
    box-shadow: 0 4px 16px rgba(var(--el-color-success-rgb), 0.2);
    
    .stat-header .stat-label {
      color: var(--el-color-success);
    }
  }
  
  :deep(.el-card__body) {
    padding: 16px;
  }
  
  .stat-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
    
    .stat-icon {
      font-size: 24px;
    }
    
    .stat-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
    
    .current-tag {
      margin-left: auto;
    }
  }
  
  .stat-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .stat-item {
      flex: 1;
      text-align: center;
      
      .stat-value {
        display: block;
        font-size: 20px;
        font-weight: 700;
        color: var(--el-color-primary);
        margin-bottom: 4px;
      }
      
      .stat-unit {
        display: block;
        font-size: 11px;
        color: var(--el-text-color-secondary);
      }
    }
    
    .stat-divider {
      width: 1px;
      height: 32px;
      background: var(--el-border-color-lighter);
    }
  }
}

.modern-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  :deep(.el-card__body) {
    flex: 1;
    overflow: hidden;
    padding: 0;
  }

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .card-icon {
        font-size: 18px;
        color: var(--el-color-primary);
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .search-input {
      width: 280px;
    }
  }
}

.modern-table {
  :deep(th.el-table__cell) {
    background: var(--el-fill-color-lighter);
    font-weight: 600;
  }

  .route-path {
    display: flex;
    align-items: center;
    gap: 8px;

    .route-icon {
      color: var(--el-color-primary);
      font-size: 16px;
    }

    .path-text {
      font-family: "Monaco", "Menlo", monospace;
      font-size: 13px;
      color: var(--el-color-primary);
    }
  }

  .class-name {
    font-family: "Monaco", "Menlo", monospace;
    font-size: 12px;
    color: var(--el-text-color-regular);
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
  }

  .text-placeholder {
    color: var(--el-text-color-placeholder);
  }
}

.modern-dialog {
  :deep(.el-dialog__header) {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .detail-content {
    .code-block {
      margin: 0;
      padding: 16px;
      background: var(--el-fill-color-lighter);
      border-radius: 8px;
      overflow-x: auto;
      font-family: "Monaco", "Menlo", monospace;
      font-size: 13px;
      line-height: 1.6;
      color: var(--el-text-color-primary);
    }
  }
}

// 深色主题适配
html.dark {
  .page-container {
    background: var(--el-bg-color-page);
  }

  .modern-card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
  
  .stat-card.current-container {
    box-shadow: 0 4px 16px rgba(var(--el-color-success-rgb), 0.3);
  }
}
</style>
