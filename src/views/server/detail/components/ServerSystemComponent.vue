<template>
  <div class="server-system-component">
    <div class="component-header">
      <div class="component-title">
        <IconifyIconOnline icon="ri:information-line" class="component-icon" />
        <span>系统信息</span>
      </div>
      <div class="component-actions" v-if="editable">
        <el-button type="text" size="small" @click="$emit('edit')">
          <IconifyIconOnline icon="ri:edit-line" />
        </el-button>
      </div>
    </div>
    
    <div class="component-content">
      <div class="system-info-grid">
        <div class="info-item">
          <span class="info-label">操作系统:</span>
          <span class="info-value">{{ getOsName() }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">系统版本:</span>
          <span class="info-value">{{ getOsVersion() }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">主机名:</span>
          <span class="info-value">{{ getHostname() }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">系统架构:</span>
          <span class="info-value">{{ getSystemArch() }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">运行时间:</span>
          <span class="info-value">{{ formatUptime(metrics?.uptime) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">负载平均:</span>
          <span class="info-value">{{ metrics?.loadAverage || 'N/A' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">进程数:</span>
          <span class="info-value">{{ metrics?.processCount || 'N/A' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">CPU核心数:</span>
          <span class="info-value">{{ metrics?.cpu?.cores || metrics?.cpuCores || 'N/A' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { IconifyIconOnline } from '@repo/components/ReIcon';
import { useServerMetrics } from '@/composables/useServerWebSocket';

interface Props {
  serverId: number;
  componentConfig?: any;
  height?: number;
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: 200,
  editable: false
});

const emit = defineEmits(['edit', 'share', 'remove']);

// 使用服务器指标数据
const { metrics, connect, disconnect } = useServerMetrics(props.serverId);

/**
 * 智能获取操作系统名称
 */
const getOsName = () => {
  // 优先使用 osName 字段
  if (metrics.value?.osName) {
    return metrics.value.osName;
  }
  
  // 从 osInfo 中解析
  if (metrics.value?.osInfo) {
    const osInfo = metrics.value.osInfo;
    // 匹配常见的操作系统名称
    if (osInfo.includes('Ubuntu')) return 'Ubuntu';
    if (osInfo.includes('CentOS')) return 'CentOS';
    if (osInfo.includes('Red Hat')) return 'Red Hat';
    if (osInfo.includes('Debian')) return 'Debian';
    if (osInfo.includes('Windows')) return 'Windows';
    if (osInfo.includes('macOS') || osInfo.includes('Darwin')) return 'macOS';
    if (osInfo.includes('Linux')) return 'Linux';
    
    // 如果包含 "OS:" 标记，提取其后的内容
    const osMatch = osInfo.match(/OS:\s*([^;]+)/);
    if (osMatch) {
      return osMatch[1].trim();
    }
    
    // 返回第一部分作为操作系统名称
    return osInfo.split(' ')[0] || osInfo;
  }
  
  return 'N/A';
};

/**
 * 智能获取操作系统版本
 */
const getOsVersion = () => {
  // 优先使用 osVersion 字段
  if (metrics.value?.osVersion) {
    return metrics.value.osVersion;
  }
  
  // 从 osInfo 中解析版本信息
  if (metrics.value?.osInfo) {
    const osInfo = metrics.value.osInfo;
    
    // 匹配版本号模式
    const versionMatch = osInfo.match(/(\d+\.\d+(?:\.\d+)?)/);
    if (versionMatch) {
      return versionMatch[1];
    }
    
    // 匹配 Ubuntu 版本
    const ubuntuMatch = osInfo.match(/Ubuntu\s+(\d+\.\d+)/);
    if (ubuntuMatch) {
      return ubuntuMatch[1];
    }
    
    // 匹配 CentOS 版本
    const centosMatch = osInfo.match(/CentOS\s+(\d+)/);
    if (centosMatch) {
      return centosMatch[1];
    }
  }
  
  return 'N/A';
};

/**
 * 智能获取主机名
 */
const getHostname = () => {
  // 优先使用 hostname 字段
  if (metrics.value?.hostname) {
    return metrics.value.hostname;
  }
  
  // 从 extraInfo 中解析
  if (metrics.value?.extraInfo) {
    const hostnameMatch = metrics.value.extraInfo.match(/hostname:([^,]+)/);
    if (hostnameMatch) {
      return hostnameMatch[1].trim();
    }
  }
  
  return 'N/A';
};

/**
 * 智能获取系统架构
 */
const getSystemArch = () => {
  if (metrics.value?.osInfo) {
    const osInfo = metrics.value.osInfo;
    
    // 匹配架构信息
    if (osInfo.includes('x86_64') || osInfo.includes('amd64')) return 'x86_64';
    if (osInfo.includes('i386') || osInfo.includes('i686')) return 'i386';
    if (osInfo.includes('aarch64') || osInfo.includes('arm64')) return 'ARM64';
    if (osInfo.includes('armv7') || osInfo.includes('armhf')) return 'ARM';
    
    // 匹配 "Arch:" 标记
    const archMatch = osInfo.match(/Arch:\s*([^;]+)/);
    if (archMatch) {
      return archMatch[1].trim();
    }
  }
  
  return 'N/A';
};

/**
 * 格式化运行时间
 */
const formatUptime = (uptime: number | undefined) => {
  if (!uptime) return 'N/A';
  
  const days = Math.floor(uptime / (24 * 3600));
  const hours = Math.floor((uptime % (24 * 3600)) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  
  if (days > 0) {
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
};

// 生命周期
onMounted(() => {
  connect();
});

onUnmounted(() => {
  disconnect();
});
</script>

<style scoped lang="scss">
.server-system-component {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
}

.component-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-fill-color-lighter);

  .component-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .component-icon {
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }

  .component-actions {
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover .component-actions {
    opacity: 1;
  }
}

.component-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.system-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    background-color: var(--el-fill-color-lighter);
    border-radius: 6px;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--el-fill-color);
      border-color: var(--el-border-color);
    }

    .info-label {
      font-size: 12px;
      color: var(--el-text-color-regular);
      font-weight: 500;
    }

    .info-value {
      font-size: 14px;
      color: var(--el-text-color-primary);
      font-weight: 600;
      word-break: break-all;
    }
  }
}

// 响应式布局
@media (max-width: 768px) {
  .system-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
