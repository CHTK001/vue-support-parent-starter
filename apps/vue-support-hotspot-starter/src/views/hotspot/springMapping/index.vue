<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:route-line" class="header-icon" />
        <div class="header-info">
          <h2 class="header-title">Spring 路由映射</h2>
          <p class="header-desc">查看 Spring MVC 控制器映射信息</p>
        </div>
      </div>
      <div class="header-right">
        <el-tag type="success" effect="light" size="large" round>
          <IconifyIconOnline icon="ri:links-line" class="mr-1" />
          共 {{ data.length }} 个映射
        </el-tag>
      </div>
    </div>

    <!-- 容器 QPS 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="container in containerStats" :key="container.type">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-header">
            <IconifyIconOnline :icon="container.icon" class="stat-icon" />
            <span class="stat-label">{{ container.label }}</span>
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
    <el-card class="modern-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <IconifyIconOnline icon="ri:git-branch-line" class="card-icon" />
            映射列表
          </span>
          <el-input v-model="searchKeyword" placeholder="搜索路由或类名..." clearable class="search-input">
            <template #prefix>
              <IconifyIconOnline icon="ep:search" />
            </template>
          </el-input>
        </div>
      </template>

      <el-table :data="filteredData" style="width: 100%" row-key="id" stripe highlight-current-row class="modern-table" max-height="600">
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
        <el-table-column prop="resource" label="资源" min-width="180">
          <template #default="{ row }">
            <el-tag v-if="row.resource" type="info" effect="plain" size="small">
              {{ row.resource }}
            </el-tag>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
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

const data = ref([]);
const infoVisible = ref(false);
const info = ref("");
const searchKeyword = ref("");
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

// 加载容器 QPS 统计
const loadContainerStats = async () => {
  try {
    const res = await http.get((window.agentPath || "/agent") + "/api/qps?action=current");
    if (res && res.data && res.data.status === 'ok') {
      const statsData = res.data.data;
      containerStats.value.forEach(container => {
        const stat = statsData[container.type];
        if (stat) {
          container.qps = stat.qps || 0;
          container.totalRequests = stat.totalRequests || 0;
          container.activeConnections = stat.activeConnections || 0;
        }
      });
    }
  } catch (err) {
    console.error('加载容器统计失败:', err);
  }
};

// 定时刷新统计数据
let statsTimer = null;
const startStatsPolling = () => {
  loadContainerStats();
  statsTimer = setInterval(loadContainerStats, 3000); // 每 3 秒刷新一次
};

// 清理定时器
const stopStatsPolling = () => {
  if (statsTimer) {
    clearInterval(statsTimer);
    statsTimer = null;
  }
};

onBeforeMount(async () => {
  http.get((window.agentPath || "/agent") + "/spring-mapping-data").then(res => {
    // 后端返回的是 { data: [...], total: 10 }
    // 需要提取 data 字段中的数组
    if (res && typeof res === 'object' && Array.isArray(res.data.data)) {
      data.value = res.data.data;
    } else if (Array.isArray(res)) {
      data.value = res;
    } else {
      data.value = [];
    }
  });
  
  // 启动统计数据轮询
  startStatsPolling();
});

onUnmounted(() => {
  stopStatsPolling();
});
</script>
<style lang="scss" scoped>
.page-container {
  padding: 20px;
  min-height: 100%;
  background: var(--el-bg-color-page);
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  :deep(.el-card__body) {
    padding: 16px;
  }
  
  .stat-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    
    .stat-icon {
      font-size: 24px;
    }
    
    .stat-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px 24px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .header-icon {
      font-size: 40px;
      color: var(--el-color-success);
      padding: 12px;
      background: linear-gradient(135deg, rgba(var(--el-color-success-rgb), 0.1), rgba(var(--el-color-success-rgb), 0.05));
      border-radius: 12px;
    }

    .header-info {
      .header-title {
        margin: 0 0 4px 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .header-desc {
        margin: 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.modern-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

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
        color: var(--el-color-success);
      }
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

  .page-header {
    background: var(--el-bg-color);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }

  .modern-card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
}
</style>
