<template>
  <div class="config-card">
    <!-- 状态指示器 -->
    <div class="status-indicator" :class="getStatusClass(config.videoSyncConfigStatus)"></div>

    <!-- 卡片头部 -->
    <div class="config-card-header">
      <div class="config-info">
        <div class="config-icon">
          <IconifyIconOnline icon="ep:setting" />
        </div>
        <div class="config-details mt-2">
          <h3 class="config-name">{{ config.videoSyncConfigName }}</h3>
        </div>
      </div>

      <!-- 快速操作 -->
      <div class="quick-actions">
        <el-button v-if="config.videoSyncConfigStatus !== 'START' && config.videoSyncConfigStatus !== 'PROGRESS'" type="success" size="small" circle @click="handleAction('enable')" title="启用配置">
          <IconifyIconOnline icon="ep:video-play" />
        </el-button>
        <el-button v-else-if="config.videoSyncConfigStatus !== 'START' && config.videoSyncConfigStatus !== 'PROGRESS'" type="warning" size="small" circle @click="handleAction('disable')" title="禁用配置">
          <IconifyIconOnline icon="ep:video-pause" />
        </el-button>

        <el-button v-if="config.videoSyncConfigStatus !== 'START' && config.videoSyncConfigStatus !== 'PROGRESS'" type="primary" size="small" circle :loading="(config as any).syncing" @click="handleAction('sync')" title="执行同步">
          <IconifyIconOnline icon="ep:refresh" />
        </el-button>

        <el-button v-else type="danger" size="small" circle @click="handleAction('stop')" title="停止同步">
          <IconifyIconOnline icon="ep:close" />
        </el-button>
      </div>
    </div>

    <!-- 卡片主体 -->
    <div class="config-card-body">
      <!-- 统计信息 -->
      <div class="config-stats">
        <div class="stat-item">
          <div class="stat-label">同步次数</div>
          <div class="stat-value">{{ config.syncCount || 0 }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">同步视频数</div>
          <div class="stat-value">{{ config.syncVideoCount || 0 }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">最后同步</div>
          <div class="stat-value">{{ formatTime(config.videoSyncConfigLastSyncTime) || "未同步" }}</div>
        </div>
      </div>
    </div>

    <!-- 卡片底部操作 -->
    <div class="config-card-actions">
      <div class="primary-actions">
        <el-button type="primary" size="small" @click="handleAction('edit')">
          <IconifyIconOnline icon="ep:edit" class="mr-1" />
          编辑
        </el-button>
      </div>
      <div class="secondary-actions">
        <el-button type="danger" size="small" text @click="handleAction('delete')">
          <IconifyIconOnline icon="ep:delete" class="mr-1" />
          删除
        </el-button>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="card-decoration"></div>
  </div>
</template>

<script setup lang="ts">
import type { VideoSyncConfig } from "../../../api/types";

/**
 * 配置卡片组件
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

// 定义props
interface Props {
  config: VideoSyncConfig;
}

const props = defineProps<Props>();

// 定义emits
interface Emits {
  action: [action: string, config: VideoSyncConfig];
  "copy-url": [url: string];
}

const emit = defineEmits<Emits>();

/**
 * 获取状态样式类
 * @param status 状态值
 * @returns CSS类名
 */
const getStatusClass = (status: string): string => {
  const statusMap: Record<string, string> = {
    START: "status-disabled",
    FINISH: "status-enabled",
    PROGRESS: "status-syncing",
    ERROR: "status-error",
  };
  return statusMap[status] || "status-disabled";
};

/**
 * 获取来源名称
 * @param source 来源类型
 * @returns 来源名称
 */
const getSourceName = (source: string): string => {
  const nameMap: Record<string, string> = {
    pansou: "PanSou",
    guanying: "在线视频",
    local: "本地文件",
    rss: "RSS订阅",
    api: "API接口",
  };
  return nameMap[source] || source;
};

/**
 * 获取来源标签类型
 * @param source 来源类型
 * @returns 标签类型
 */
const getSourceType = (source: string): string => {
  const typeMap: Record<string, string> = {
    pansou: "primary",
    guanying: "success",
    local: "info",
    rss: "warning",
    api: "danger",
  };
  return typeMap[source] || "info";
};

/**
 * 获取状态名称
 * @param status 状态值
 * @returns 状态名称
 */
const getStatusName = (status: number): string => {
  const nameMap: Record<number, string> = {
    0: "禁用",
    1: "启用",
    2: "同步中",
    3: "异常",
  };
  return nameMap[status] || "未知";
};

/**
 * 获取状态标签类型
 * @param status 状态值
 * @returns 标签类型
 */
const getStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    START: "info",
    FINISH: "success",
    PROGRESS: "warning",
    ERROR: "danger",
  };
  return typeMap[status] || "info";
};

/**
 * 格式化时间
 * @param time 时间字符串
 * @returns 格式化后的时间
 */
const formatTime = (time: string): string => {
  if (!time) return "";
  try {
    const date = new Date(time);
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return time;
  }
};

/**
 * 处理操作
 * @param action 操作类型
 */
const handleAction = (action: string) => {
  emit("action", action, props.config);
};

/**
 * 处理复制URL
 * @param url URL地址
 */
const handleCopyUrl = (url: string) => {
  emit("copy-url", url);
};
</script>

<style scoped>
.config-card {
  position: relative;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
}

.config-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.status-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

.status-disabled {
  background: #909399;
}

.status-enabled {
  background: #67c23a;
}

.status-syncing {
  background: #e6a23c;
}

.status-error {
  background: #f56c6c;
}

.config-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.config-info {
  display: flex;
  align-items: flex-start;
  flex: 1;
}

.config-icon {
  width: 40px;
  height: 40px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 20px;
  color: #409eff;
}

.config-details {
  flex: 1;
}

.config-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;
}

.config-meta {
  display: flex;
  gap: 8px;
}

.quick-actions {
  display: flex;
  gap: 8px;
}

.config-card-body {
  margin-bottom: 16px;
}

.config-url {
  margin-bottom: 12px;
}

.url-label {
  font-size: 12px;
   color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.url-value {
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  padding: 4px 8px;
  background: var(--el-bg-color-overlay);
  border-radius: 4px;
  transition: all 0.3s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.url-value:hover {
  background: #e4e7ed;
  color: #409eff;
}

.config-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 12px;
   color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.config-card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.primary-actions {
  display: flex;
  gap: 8px;
}

.secondary-actions {
  display: flex;
}

.card-decoration {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 100px;
  height: 100px;
  background: linear-gradient(45deg, rgba(64, 158, 255, 0.1), rgba(64, 158, 255, 0.05));
  border-radius: 50%;
  pointer-events: none;
}
</style>
