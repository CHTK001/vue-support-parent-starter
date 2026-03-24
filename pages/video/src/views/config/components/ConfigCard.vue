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
        <ScButton v-if="config.videoSyncConfigStatus !== 'START' && config.videoSyncConfigStatus !== 'PROGRESS'" type="success" size="small" circle @click="handleAction('enable')" title="启用配置">
          <IconifyIconOnline icon="ep:video-play" />
        </ScButton>
        <ScButton v-else-if="config.videoSyncConfigStatus !== 'START' && config.videoSyncConfigStatus !== 'PROGRESS'" type="warning" size="small" circle @click="handleAction('disable')" title="禁用配置">
          <IconifyIconOnline icon="ep:video-pause" />
        </ScButton>

        <ScButton v-if="config.videoSyncConfigStatus !== 'START' && config.videoSyncConfigStatus !== 'PROGRESS'" type="primary" size="small" circle :loading="(config as any).syncing" @click="handleAction('sync')" title="执行同步">
          <IconifyIconOnline icon="ep:refresh" />
        </ScButton>

        <ScButton v-else type="danger" size="small" circle @click="handleAction('stop')" title="停止同步">
          <IconifyIconOnline icon="ep:close" />
        </ScButton>
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
        <ScButton type="primary" size="small" @click="handleAction('edit')">
          <IconifyIconOnline icon="ep:edit" class="mr-1" />
          编辑
        </ScButton>
      </div>
      <div class="secondary-actions">
        <ScButton type="danger" size="small" text @click="handleAction('delete')">
          <IconifyIconOnline icon="ep:delete" class="mr-1" />
          删除
        </ScButton>
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
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

.config-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: var(--el-color-primary);
}

.status-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  border-radius: 0 4px 4px 0;
  transition: all 0.3s ease;
}

.status-disabled {
  background: linear-gradient(180deg, #909399 0%, #a6a9ad 100%);
}

.status-enabled {
  background: linear-gradient(180deg, #67c23a 0%, #85ce61 100%);
  box-shadow: 0 0 8px rgba(103, 194, 58, 0.4);
}

.status-syncing {
  background: linear-gradient(180deg, #e6a23c 0%, #ebb563 100%);
  box-shadow: 0 0 8px rgba(230, 162, 60, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.status-error {
  background: linear-gradient(180deg, #f56c6c 0%, #f78989 100%);
  box-shadow: 0 0 8px rgba(245, 108, 108, 0.4);
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
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-7) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
  transition: all 0.3s ease;
}

.config-card:hover .config-icon {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
}

.config-details {
  flex: 1;
}

.config-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 12px 0;
  transition: color 0.3s ease;
}

.config-card:hover .config-name {
  color: var(--el-color-primary);
}

.config-meta {
  display: flex;
  gap: 8px;
}

.quick-actions {
  display: flex;
  gap: 10px;
}

.quick-actions .el-button {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.quick-actions .el-button:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
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
  gap: 32px;
  padding: 20px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-7) 100%);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-color-primary);
  font-family: 'Courier New', monospace;
}

.config-card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.primary-actions {
  display: flex;
  gap: 12px;
}

.primary-actions .el-button {
  box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
  transition: all 0.3s ease;
}

.primary-actions .el-button:hover {
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
  transform: translateY(-2px);
}

.secondary-actions {
  display: flex;
}

.secondary-actions .el-button {
  transition: all 0.3s ease;
}

.secondary-actions .el-button:hover {
  transform: translateY(-2px);
}

.card-decoration {
  position: absolute;
  top: -60px;
  right: -60px;
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.08) 0%, rgba(var(--el-color-primary-rgb), 0.03) 100%);
  border-radius: 50%;
  pointer-events: none;
  transition: all 0.3s ease;
}

.config-card:hover .card-decoration {
  transform: scale(1.1);
  opacity: 0.6;
}
</style>
