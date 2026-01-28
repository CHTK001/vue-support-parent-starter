<template>
  <div class="latency-statistics-panel system-container modern-bg">
    <el-card class="statistics-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <IconifyIconOnline icon="ri:speed-line" class="header-icon" />
            <span class="header-title">延迟统计</span>
          </div>
          <div class="header-right">
            <el-tooltip content="刷新统计数据" placement="top">
              <el-button
                size="small"
                circle
                @click="refreshStatistics"
                :loading="loading"
              >
                <IconifyIconOnline icon="ep:refresh" />
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </template>

      <div class="statistics-content">
        <!-- 总体统计 -->
        <div class="overview-stats">
          <div class="stat-item">
            <div class="stat-value">{{ totalServers }}</div>
            <div class="stat-label">总服务器</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ onlineServers }}</div>
            <div class="stat-label">在线服务器</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ Math.round(onlineRate) }}%</div>
            <div class="stat-label">在线率</div>
          </div>
        </div>

        <!-- 延迟分布 -->
        <div class="latency-distribution">
          <h4 class="section-title">延迟分布</h4>
          <div class="distribution-items">
            <div class="distribution-item normal">
              <div class="item-header">
                <div class="status-dot normal"></div>
                <span class="status-text">正常 (&lt;100ms)</span>
              </div>
              <div class="item-stats">
                <span class="count">{{ normalServers }}</span>
                <span class="percentage">({{ normalPercentage }}%)</span>
              </div>
            </div>
            
            <div class="distribution-item high">
              <div class="item-header">
                <div class="status-dot high"></div>
                <span class="status-text">较高 (100-500ms)</span>
              </div>
              <div class="item-stats">
                <span class="count">{{ highLatencyServers }}</span>
                <span class="percentage">({{ highPercentage }}%)</span>
              </div>
            </div>
            
            <div class="distribution-item abnormal">
              <div class="item-header">
                <div class="status-dot abnormal"></div>
                <span class="status-text">异常 (&gt;500ms)</span>
              </div>
              <div class="item-stats">
                <span class="count">{{ abnormalServers }}</span>
                <span class="percentage">({{ abnormalPercentage }}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 告警信息 -->
        <div class="alerts-section" v-if="alerts.length > 0">
          <h4 class="section-title">
            <IconifyIconOnline icon="ri:alarm-warning-line" class="warning-icon" />
            延迟告警
          </h4>
          <div class="alerts-list">
            <div 
              v-for="alert in alerts.slice(0, 3)" 
              :key="alert.serverId"
              class="alert-item"
            >
              <div class="alert-content">
                <span class="server-name">{{ alert.serverName }}</span>
                <span class="latency-value">{{ alert.latency }}ms</span>
              </div>
              <el-tag type="danger" size="small">异常</el-tag>
            </div>
            <div v-if="alerts.length > 3" class="more-alerts">
              还有 {{ alerts.length - 3 }} 个服务器延迟异常
            </div>
          </div>
        </div>

        <!-- 最后更新时间 -->
        <div class="update-time">
          <span class="update-label">最后更新:</span>
          <span class="update-value">{{ formatUpdateTime }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
// 移除 @element-plus/icons-vue 导入，使用全局 IconifyIconOnline 组件
import { useGlobalServerLatency } from '@/composables/useServerLatency';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 延迟管理
const latencyManager = useGlobalServerLatency();

// 计算属性
const totalServers = computed(() => latencyManager.totalServers.value);
const onlineServers = computed(() => latencyManager.onlineServers.value);
const normalServers = computed(() => latencyManager.normalServers.value);
const highLatencyServers = computed(() => latencyManager.highLatencyServers.value);
const abnormalServers = computed(() => latencyManager.abnormalServers.value);
const loading = computed(() => latencyManager.loading.value);
const alerts = computed(() => latencyManager.alerts.value);

// 计算百分比
const onlineRate = computed(() => {
  return totalServers.value > 0 ? (onlineServers.value / totalServers.value) * 100 : 0;
});

const normalPercentage = computed(() => {
  return onlineServers.value > 0 ? Math.round((normalServers.value / onlineServers.value) * 100) : 0;
});

const highPercentage = computed(() => {
  return onlineServers.value > 0 ? Math.round((highLatencyServers.value / onlineServers.value) * 100) : 0;
});

const abnormalPercentage = computed(() => {
  return onlineServers.value > 0 ? Math.round((abnormalServers.value / onlineServers.value) * 100) : 0;
});

// 格式化更新时间
const formatUpdateTime = computed(() => {
  if (!latencyManager.lastUpdateTime.value) {
    return '未更新';
  }
  
  try {
    return formatDistanceToNow(new Date(latencyManager.lastUpdateTime.value), {
      addSuffix: true,
      locale: zhCN
    });
  } catch {
    return '刚刚';
  }
});

// 刷新统计数据
const refreshStatistics = async () => {
  try {
    await Promise.all([
      latencyManager.fetchLatencyStatistics(),
      latencyManager.fetchStatusDistribution(),
      latencyManager.fetchLatencyAlerts()
    ]);
  } catch (error) {
    console.error('刷新延迟统计失败:', error);
  }
};

// 定期刷新
let refreshTimer: NodeJS.Timeout;

onMounted(() => {
  // 初始加载
  refreshStatistics();
  
  // 每分钟刷新一次统计数据
  refreshTimer = setInterval(refreshStatistics, 60000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: $gradient-bg-1, $gradient-bg-2;
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.latency-statistics-panel {
  .statistics-card {
    border-radius: $radius-lg;
    border: 1px solid $border-light;
    @include glass-effect(0.95, 18px);
    box-shadow: $shadow-md;
    transition: all $duration-normal $ease-standard;

    &:hover {
      box-shadow: $shadow-hover-md;
      transform: translateY(-1px);
    }
    
    :deep(.el-card__header) {
      padding: $spacing-lg $spacing-xl;
      border-bottom: 1px solid $border-light;
      background: $gradient-bg-1;
    }
    
    :deep(.el-card__body) {
      padding: $spacing-xl;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .header-icon {
      font-size: 18px;
      color: var(--el-color-primary);
    }
    
    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}

.statistics-content {
  .overview-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-lg;
    margin-bottom: $spacing-2xl;
    
    .stat-item {
      text-align: center;
      padding: $spacing-lg;
      border-radius: $radius-md;
      border: 1px solid $border-light;
      @include glass-effect(0.9, 14px);
      
      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--el-color-primary);
        margin-bottom: $spacing-xs;
      }
      
      .stat-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
  
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 $spacing-md 0;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    
    .warning-icon {
      color: var(--el-color-warning);
    }
  }
  
  .latency-distribution {
    margin-bottom: $spacing-2xl;
    
    .distribution-items {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;
    }
    
    .distribution-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-md;
      border-radius: $radius-sm;
      border: 1px solid $border-light;
      @include glass-effect(0.88, 12px);
      transition: all $duration-fast $ease-standard;

      &:hover {
        transform: translateY(-1px);
        box-shadow: $shadow-sm;
      }
      
      .item-header {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          
          &.normal {
            background-color: var(--el-color-success);
          }
          
          &.high {
            background-color: var(--el-color-warning);
          }
          
          &.abnormal {
            background-color: var(--el-color-danger);
          }
        }
        
        .status-text {
          font-size: 13px;
          color: var(--el-text-color-regular);
        }
      }
      
      .item-stats {
        display: flex;
        align-items: center;
        gap: 4px;
        
        .count {
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
        
        .percentage {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }
  
  .alerts-section {
    margin-bottom: $spacing-lg;
    
    .alerts-list {
      .alert-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $spacing-sm $spacing-md;
        margin-bottom: $spacing-sm;
        border-radius: $radius-sm;
        background: rgba(245, 108, 108, 0.08);
        border: 1px solid rgba(245, 108, 108, 0.18);
        transition: all $duration-fast $ease-standard;

        &:hover {
          transform: translateY(-1px);
          box-shadow: $shadow-sm;
        }
        
        .alert-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          
          .server-name {
            font-size: 13px;
            font-weight: 500;
            color: var(--el-text-color-primary);
          }
          
          .latency-value {
            font-size: 12px;
            color: var(--el-color-danger);
            font-weight: 600;
          }
        }
      }
      
      .more-alerts {
        text-align: center;
        padding: $spacing-sm;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        font-style: italic;
      }
    }
  }
  
  .update-time {
    text-align: center;
    padding-top: $spacing-md;
    border-top: 1px solid $border-light;
    
    .update-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-right: 4px;
    }
    
    .update-value {
      font-size: 12px;
      color: var(--el-text-color-regular);
    }
  }
}

@include respond-to(md) {
  .overview-stats {
    grid-template-columns: 1fr !important;
    gap: $spacing-md !important;
  }
}
</style>
