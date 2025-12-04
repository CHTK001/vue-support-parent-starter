<template>
  <div class="stats-card">
    <div class="stats-grid">
      <div 
        v-for="stat in stats" 
        :key="stat.key"
        class="stat-item"
        :class="stat.type"
      >
        <div class="stat-icon">
          <el-icon :size="24">
            <component :is="stat.icon" />
          </el-icon>
        </div>
        
        <div class="stat-content">
          <div class="stat-value">
            {{ formatValue(stat.value, stat.format) }}
            <span v-if="stat.trend" class="stat-trend" :class="stat.trend.type">
              <el-icon :size="12">
                <component :is="stat.trend.type === 'up' ? 'ArrowUp' : 'ArrowDown'" />
              </el-icon>
              {{ stat.trend.value }}
            </span>
          </div>
          
          <div class="stat-label">{{ stat.label }}</div>
          
          <div v-if="stat.description" class="stat-description">
            {{ stat.description }}
          </div>
        </div>
        
        <div v-if="stat.chart" class="stat-chart">
          <div class="mini-chart">
            <!-- 这里可以集成小型图表组件 -->
            <div class="chart-placeholder">📊</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 详细统计信息 -->
    <div v-if="showDetails" class="stats-details">
      <el-collapse v-model="activeCollapse">
        <el-collapse-item title="软件分布" name="software">
          <div class="detail-section">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">系统软件:</span>
                <span class="detail-value">{{ details.systemSoftware || 0 }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">应用软件:</span>
                <span class="detail-value">{{ details.applicationSoftware || 0 }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">开发工�?</span>
                <span class="detail-value">{{ details.developmentTools || 0 }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">数据�?</span>
                <span class="detail-value">{{ details.databases || 0 }}</span>
              </div>
            </div>
          </div>
        </el-collapse-item>
        
        <el-collapse-item title="容器状�? name="containers">
          <div class="detail-section">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">运行�?</span>
                <span class="detail-value running">{{ details.runningContainers || 0 }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">已停�?</span>
                <span class="detail-value stopped">{{ details.stoppedContainers || 0 }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">异常:</span>
                <span class="detail-value error">{{ details.errorContainers || 0 }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">重启�?</span>
                <span class="detail-value warning">{{ details.restartingContainers || 0 }}</span>
              </div>
            </div>
          </div>
        </el-collapse-item>
        
        <el-collapse-item title="资源使用" name="resources">
          <div class="detail-section">
            <div class="resource-item">
              <div class="resource-header">
                <span class="resource-label">CPU 使用�?/span>
                <span class="resource-value">{{ (details.avgCpuUsage || 0).toFixed(1) }}%</span>
              </div>
              <el-progress 
                :percentage="details.avgCpuUsage || 0" 
                :stroke-width="8"
                :show-text="false"
              />
            </div>
            
            <div class="resource-item">
              <div class="resource-header">
                <span class="resource-label">内存使用�?/span>
                <span class="resource-value">{{ (details.avgMemoryUsage || 0).toFixed(1) }}%</span>
              </div>
              <el-progress 
                :percentage="details.avgMemoryUsage || 0" 
                :stroke-width="8"
                :show-text="false"
                color="#67C23A"
              />
            </div>
            
            <div class="resource-item">
              <div class="resource-header">
                <span class="resource-label">磁盘使用�?/span>
                <span class="resource-value">{{ (details.avgDiskUsage || 0).toFixed(1) }}%</span>
              </div>
              <el-progress 
                :percentage="details.avgDiskUsage || 0" 
                :stroke-width="8"
                :show-text="false"
                color="#E6A23C"
              />
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
    
    <div v-if="showToggle" class="stats-footer">
      <el-button size="small" text @click="showDetails = !showDetails">
        {{ showDetails ? '收起详情' : '查看详情' }}
        <el-icon>
          <component :is="showDetails ? 'ArrowUp' : 'ArrowDown'" />
        </el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Box,
  Monitor,
  Files,
  Timer,
  ArrowUp,
  ArrowDown,
  Warning,
  SuccessFilled
} from '@element-plus/icons-vue';

interface StatItem {
  key: string;
  label: string;
  value: number | string;
  icon: any;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  format?: 'number' | 'percentage' | 'bytes' | 'duration';
  description?: string;
  trend?: {
    type: 'up' | 'down';
    value: string;
  };
  chart?: boolean;
}

interface StatsDetails {
  systemSoftware?: number;
  applicationSoftware?: number;
  developmentTools?: number;
  databases?: number;
  runningContainers?: number;
  stoppedContainers?: number;
  errorContainers?: number;
  restartingContainers?: number;
  avgCpuUsage?: number;
  avgMemoryUsage?: number;
  avgDiskUsage?: number;
}

interface Props {
  stats: StatItem[];
  details?: StatsDetails;
  showToggle?: boolean;
  defaultExpanded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  details: () => ({}),
  showToggle: true,
  defaultExpanded: false
});

const showDetails = ref(props.defaultExpanded);
const activeCollapse = ref(['software']);

const formatValue = (value: number | string, format?: string) => {
  if (typeof value === 'string') return value;
  
  switch (format) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'bytes':
      return formatBytes(value);
    case 'duration':
      return formatDuration(value);
    case 'number':
    default:
      return value.toLocaleString();
  }
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
};
</script>

<style scoped>
.stats-card {
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  border-left: 4px solid #e4e7ed;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-item.primary {
  border-left-color: #409eff;
}

.stat-item.success {
  border-left-color: #67c23a;
}

.stat-item.warning {
  border-left-color: #e6a23c;
}

.stat-item.danger {
  border-left-color: #f56c6c;
}

.stat-item.info {
  border-left- color: var(--el-text-color-primary);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  margin-right: 16px;
  color: var(--el-text-color-primary);
}

.stat-item.primary .stat-icon {
  background: var(--el-bg-color-overlay);
}

.stat-item.success .stat-icon {
  background: #67c23a;
}

.stat-item.warning .stat-icon {
  background: #e6a23c;
}

.stat-item.danger .stat-icon {
  background: #f56c6c;
}

.stat-item.info .stat-icon {
  background: #909399;
}

.stat-content {
  flex: 1;
}

.stat-value {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.stat-trend {
  display: flex;
  align-items: center;
  margin-left: 8px;
  font-size: 12px;
  font-weight: 500;
}

.stat-trend.up {
  color: #67c23a;
}

.stat-trend.down {
  color: #f56c6c;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  margin-bottom: 2px;
}

.stat-description {
  font-size: 12px;
   color: var(--el-text-color-primary);
  line-height: 1.4;
}

.stat-chart {
  margin-left: 16px;
}

.mini-chart {
  width: 60px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color-overlay);
  border-radius: 4px;
  font-size: 20px;
}

.chart-placeholder {
  opacity: 0.6;
}

.stats-details {
  margin-top: 20px;
  border-top: 1px solid #e4e7ed;
  padding-top: 20px;
}

.detail-section {
  padding: 16px 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--el-bg-color-overlay);
  border-radius: 6px;
}

.detail-label {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.detail-value.running {
  color: #67c23a;
}

.detail-value.stopped {
   color: var(--el-text-color-primary);
}

.detail-value.error {
  color: #f56c6c;
}

.detail-value.warning {
  color: #e6a23c;
}

.resource-item {
  margin-bottom: 16px;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.resource-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.resource-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.stats-footer {
  text-align: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-item {
    flex-direction: column;
    text-align: center;
  }
  
  .stat-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }
  
  .stat-chart {
    margin-left: 0;
    margin-top: 12px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>