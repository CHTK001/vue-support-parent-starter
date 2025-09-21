<template>
  <div class="webrtc-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>首页</el-breadcrumb-item>
        <el-breadcrumb-item>WebRTC管理</el-breadcrumb-item>
      </el-breadcrumb>
      <h1 class="page-title">WebRTC管理中心</h1>
      <p class="page-description">管理WebRTC房间、用户和系统配置</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon room-icon">
            <el-icon><VideoCamera /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ systemStats.activeRooms }}</div>
            <div class="stat-label">活跃房间</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon user-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ systemStats.onlineUsers }}</div>
            <div class="stat-label">在线用户</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon total-icon">
            <el-icon><DataBoard /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ systemStats.totalRooms }}</div>
            <div class="stat-label">总房间数</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon performance-icon">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ systemStats.serverResources.cpuUsage }}%</div>
            <div class="stat-label">CPU使用率</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 功能导航 -->
    <div class="feature-grid">
      <el-card 
        v-for="feature in features" 
        :key="feature.key"
        class="feature-card" 
        shadow="hover"
        @click="navigateToFeature(feature.route)"
      >
        <div class="feature-content">
          <div class="feature-icon" :class="feature.iconClass">
            <el-icon><component :is="feature.icon" /></el-icon>
          </div>
          <div class="feature-info">
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
          <div class="feature-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 实时监控 -->
    <el-card class="monitoring-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>实时监控</span>
          <el-button type="primary" size="small" @click="refreshMonitoring">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      
      <div class="monitoring-content">
        <div class="monitoring-item">
          <span class="monitoring-label">并发连接数:</span>
          <span class="monitoring-value">{{ realtimeData.systemResources.concurrentConnections }}</span>
        </div>
        <div class="monitoring-item">
          <span class="monitoring-label">网络使用:</span>
          <span class="monitoring-value">{{ realtimeData.systemResources.networkUsage }} Mbps</span>
        </div>
        <div class="monitoring-item">
          <span class="monitoring-label">内存使用率:</span>
          <span class="monitoring-value">{{ realtimeData.systemResources.memoryUsage }}%</span>
        </div>
        <div class="monitoring-item">
          <span class="monitoring-label">最后更新:</span>
          <span class="monitoring-value">{{ formatTime(realtimeData.timestamp) }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * WebRTC管理中心主页
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  VideoCamera,
  User,
  DataBoard,
  Monitor,
  ArrowRight,
  Refresh,
  Setting,
  PieChart,
  Share,
  ChatDotRound
} from '@element-plus/icons-vue';
import { getSystemStatistics, getRealtimeMonitoring } from '@/api/webrtc';
import type { SystemStatistics } from '@/api/webrtc';

const router = useRouter();

// 系统统计数据
const systemStats = ref<SystemStatistics>({
  totalRooms: 0,
  activeRooms: 0,
  totalUsers: 0,
  onlineUsers: 0,
  todayNewRooms: 0,
  todayActiveUsers: 0,
  totalSystemDuration: 0,
  averageRoomDuration: 0,
  serverResources: {
    cpuUsage: 0,
    memoryUsage: 0,
    networkUsage: 0,
    concurrentConnections: 0
  }
});

// 实时监控数据
const realtimeData = ref({
  timestamp: '',
  activeRooms: 0,
  onlineUsers: 0,
  systemResources: {
    cpuUsage: 0,
    memoryUsage: 0,
    networkUsage: 0,
    concurrentConnections: 0
  },
  recentEvents: []
});

// 功能列表
const features = ref([
  {
    key: 'room-management',
    title: '房间管理',
    description: '创建、管理和监控WebRTC房间',
    icon: VideoCamera,
    iconClass: 'room-feature',
    route: '/webrtc/rooms'
  },
  {
    key: 'video-call',
    title: '视频通话',
    description: '一对一视频通话功能',
    icon: ChatDotRound,
    iconClass: 'call-feature',
    route: '/webrtc/video-call'
  },
  {
    key: 'video-conference',
    title: '视频会议',
    description: '多人视频会议功能',
    icon: Share,
    iconClass: 'conference-feature',
    route: '/webrtc/video-conference'
  },
  {
    key: 'statistics',
    title: '统计分析',
    description: '查看使用统计和分析报告',
    icon: PieChart,
    iconClass: 'stats-feature',
    route: '/webrtc/statistics'
  },
  {
    key: 'config',
    title: '系统配置',
    description: '配置WebRTC系统参数',
    icon: Setting,
    iconClass: 'config-feature',
    route: '/webrtc/config'
  }
]);

// 定时器
let monitoringTimer: NodeJS.Timeout | null = null;

/**
 * 加载系统统计数据
 */
const loadSystemStats = async () => {
  try {
    const { data } = await getSystemStatistics();
    systemStats.value = data;
  } catch (error) {
    console.error('加载系统统计数据失败:', error);
    ElMessage.error('加载系统统计数据失败');
  }
};

/**
 * 加载实时监控数据
 */
const loadRealtimeData = async () => {
  try {
    const { data } = await getRealtimeMonitoring();
    realtimeData.value = data;
  } catch (error) {
    console.error('加载实时监控数据失败:', error);
  }
};

/**
 * 刷新监控数据
 */
const refreshMonitoring = async () => {
  await Promise.all([
    loadSystemStats(),
    loadRealtimeData()
  ]);
  ElMessage.success('数据已刷新');
};

/**
 * 导航到功能页面
 */
const navigateToFeature = (route: string) => {
  router.push(route);
};

/**
 * 格式化时间
 */
const formatTime = (timestamp: string) => {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleString();
};

/**
 * 启动实时监控
 */
const startMonitoring = () => {
  // 每30秒更新一次实时数据
  monitoringTimer = setInterval(() => {
    loadRealtimeData();
  }, 30000);
};

/**
 * 停止实时监控
 */
const stopMonitoring = () => {
  if (monitoringTimer) {
    clearInterval(monitoringTimer);
    monitoringTimer = null;
  }
};

// 组件挂载时加载数据
onMounted(async () => {
  await Promise.all([
    loadSystemStats(),
    loadRealtimeData()
  ]);
  startMonitoring();
});

// 组件卸载时清理定时器
onUnmounted(() => {
  stopMonitoring();
});
</script>

<style scoped lang="scss">
.webrtc-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
  
  .page-title {
    font-size: 28px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 8px 0 4px 0;
  }
  
  .page-description {
     color: var(--el-text-color-primary);
    margin: 0;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  .stat-content {
    display: flex;
    align-items: center;
    
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      
      .el-icon {
        font-size: 28px;
        color: var(--el-text-color-primary);
      }
      
      &.room-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      &.user-icon {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }
      
      &.total-icon {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }
      
      &.performance-icon {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      }
    }
    
    .stat-info {
      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        line-height: 1;
      }
      
      .stat-label {
        font-size: 14px;
         color: var(--el-text-color-primary);
        margin-top: 4px;
      }
    }
  }
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.feature-card {
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
  
  .feature-content {
    display: flex;
    align-items: center;
    
    .feature-icon {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      
      .el-icon {
        font-size: 24px;
        color: var(--el-text-color-primary);
      }
      
      &.room-feature {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      &.call-feature {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }
      
      &.conference-feature {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }
      
      &.stats-feature {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      }
      
      &.config-feature {
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      }
    }
    
    .feature-info {
      flex: 1;
      
      .feature-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0 0 4px 0;
      }
      
      .feature-description {
        font-size: 14px;
         color: var(--el-text-color-primary);
        margin: 0;
      }
    }
    
    .feature-arrow {
      .el-icon {
        font-size: 20px;
        color: #c0c4cc;
      }
    }
  }
}

.monitoring-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .monitoring-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    
    .monitoring-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: var(--el-bg-color-overlay);
      border-radius: 8px;
      
      .monitoring-label {
        font-weight: 500;
        color: #606266;
      }
      
      .monitoring-value {
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }
  }
}
</style>