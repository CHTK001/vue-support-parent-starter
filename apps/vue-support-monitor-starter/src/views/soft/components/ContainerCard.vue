<template>
  <div class="container-card">
    <div class="card-header">
      <div class="container-info">
        <h3 class="container-name">{{ container.containerName }}</h3>
        <div class="container-meta">
          <el-tag :type="getStatusType(container.status)" size="small">
            {{ getStatusText(container.status) }}
          </el-tag>
          <span class="container-id">{{ container.containerId }}</span>
        </div>
      </div>
      <div class="container-actions">
        <slot name="actions" :container="container"></slot>
      </div>
    </div>
    
    <div class="card-content">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">CPU使用率</div>
          <div class="stat-value">
            <el-progress 
              :percentage="container.cpuUsage || 0" 
              :stroke-width="6"
              :show-text="false"
            />
            <span class="percentage">{{ (container.cpuUsage || 0).toFixed(1) }}%</span>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">内存使用率</div>
          <div class="stat-value">
            <el-progress 
              :percentage="container.memoryUsage || 0" 
              :stroke-width="6"
              :show-text="false"
              color="#67C23A"
            />
            <span class="percentage">{{ (container.memoryUsage || 0).toFixed(1) }}%</span>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">网络I/O</div>
          <div class="stat-value network">
            <div class="network-item">
              <span class="label">↓</span>
              <span class="value">{{ formatBytes(container.networkRx || 0) }}</span>
            </div>
            <div class="network-item">
              <span class="label">↑</span>
              <span class="value">{{ formatBytes(container.networkTx || 0) }}</span>
            </div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">磁盘I/O</div>
          <div class="stat-value disk">
            <div class="disk-item">
              <span class="label">读</span>
              <span class="value">{{ formatBytes(container.diskRead || 0) }}</span>
            </div>
            <div class="disk-item">
              <span class="label">写</span>
              <span class="value">{{ formatBytes(container.diskWrite || 0) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="container-details" v-if="showDetails">
        <div class="detail-row">
          <span class="label">镜像:</span>
          <span class="value">{{ container.image }}</span>
        </div>
        <div class="detail-row">
          <span class="label">端口映射:</span>
          <span class="value">{{ container.ports || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">创建时间:</span>
          <span class="value">{{ formatTime(container.createTime) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">运行时间:</span>
          <span class="value">{{ getUptime(container.startTime) }}</span>
        </div>
      </div>
    </div>
    
    <div class="card-footer" v-if="showDetails">
      <el-button size="small" @click="$emit('view-logs', container)">
        <el-icon><Document /></el-icon>
        查看日志
      </el-button>
      <el-button size="small" @click="$emit('view-stats', container)">
        <el-icon><TrendCharts /></el-icon>
        性能监控
      </el-button>
      <el-button size="small" @click="toggleDetails">
        <el-icon><More /></el-icon>
        {{ showDetails ? '收起' : '详情' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Document, TrendCharts, More } from '@element-plus/icons-vue';
import type { SystemSoftContainer } from '@/api/soft';

interface Props {
  container: SystemSoftContainer;
  showDetails?: boolean;
}

interface Emits {
  (e: 'view-logs', container: SystemSoftContainer): void;
  (e: 'view-stats', container: SystemSoftContainer): void;
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false
});

const emit = defineEmits<Emits>();

const showDetails = ref(props.showDetails);

const toggleDetails = () => {
  showDetails.value = !showDetails.value;
};

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'running': 'success',
    'stopped': 'danger',
    'paused': 'warning',
    'restarting': 'warning',
    'exited': 'info'
  };
  return statusMap[status] || 'info';
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'running': '运行中',
    'stopped': '已停止',
    'paused': '已暂停',
    'restarting': '重启中',
    'exited': '已退出'
  };
  return statusMap[status] || status;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (time: string | Date) => {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
};

const getUptime = (startTime: string | Date) => {
  if (!startTime) return '-';
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diff = now - start;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}天${hours}小时`;
  } else if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
};
</script>

<style scoped>
.container-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.container-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.container-info {
  flex: 1;
}

.container-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.container-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.container-id {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.container-actions {
  display: flex;
  gap: 8px;
}

.card-content {
  padding: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
}

.stat-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.percentage {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  min-width: 45px;
}

.network, .disk {
  flex-direction: column;
  gap: 4px;
}

.network-item, .disk-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.network-item .label, .disk-item .label {
  font-size: 12px;
  color: #909399;
  min-width: 20px;
}

.network-item .value, .disk-item .value {
  font-size: 12px;
  font-weight: 500;
  color: #303133;
}

.container-details {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  margin-top: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.detail-row:not(:last-child) {
  border-bottom: 1px solid #e4e7ed;
}

.detail-row .label {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.detail-row .value {
  font-size: 12px;
  color: #303133;
  font-family: monospace;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .container-actions {
    align-self: stretch;
  }
}
</style>