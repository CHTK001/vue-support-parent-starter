<template>
  <div class="source-card" :class="{ disabled: !source.videoSourceEnable }">
    <div class="card-header">
      <div class="platform-info">
        <div class="platform-icon">
          <IconifyIconOnline :icon="getPlatformIcon(source)" />
        </div>
        <div class="platform-details">
          <h4 class="platform-name">{{ source.videoSourceName }}</h4>
          <p class="platform-url">{{ formatUrl(source.videoSourceUrl) }}</p>
        </div>
      </div>
      <div class="card-actions">
        <el-dropdown @command="handleCommand" trigger="click">
          <ScButton type="text" class="more-btn">
            <IconifyIconOnline icon="ep:more" />
          </ScButton>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="edit">
                <IconifyIconOnline icon="ep:edit" class="mr-2" />
                编辑
              </el-dropdown-item>
              <el-dropdown-item :command="source.videoSourceEnable ? 'disable' : 'enable'" :class="source.videoSourceEnable ? 'text-warning' : 'text-success'">
                <IconifyIconOnline :icon="source.videoSourceEnable ? 'ep:video-pause' : 'ep:video-play'" class="mr-2" />
                {{ source.videoSourceEnable ? "禁用" : "启用" }}
              </el-dropdown-item>
              <el-dropdown-item command="delete" class="text-danger">
                <IconifyIconOnline icon="ep:delete" class="mr-2" />
                删除
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="card-content">
      <div class="config-grid">
        <div class="config-item">
          <span class="config-label">状态</span>
          <ScTag :type="source.videoSourceEnable ? 'success' : 'danger'" size="small" class="config-value">
            {{ source.videoSourceEnable ? "启用" : "禁用" }}
          </ScTag>
        </div>
        <div class="config-item">
          <span class="config-label">最大查询数</span>
          <span class="config-value">{{ source.videoSourceMaxResource || "无限制" }}</span>
        </div>
        <div class="config-item" v-if="source.videoSourceToken">
          <span class="config-label">Token</span>
          <span class="config-value token-value">{{ maskToken(source.videoSourceToken) }}</span>
        </div>
        <div class="config-item" v-if="source.videoSourceUserAgent">
          <span class="config-label">User Agent</span>
          <span class="config-value ua-value">{{ formatUserAgent(source.videoSourceUserAgent) }}</span>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <div class="footer-actions">
        <ScButton size="small" @click="handleEdit" class="edit-btn">
          <IconifyIconOnline icon="ep:edit" class="mr-1" />
          编辑
        </ScButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 视频源卡片组件
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */
import { ref } from "vue";
import type { VideoSource } from "../../../api/types";

// 组件属性
interface Props {
  source: VideoSource;
}

const props = defineProps<Props>();

// 组件事件
interface Emits {
  action: [command: string, source: VideoSource];
  testConnection: [source: VideoSource];
}

const emit = defineEmits<Emits>();

// 响应式数据
const testing = ref(false);

/**
 * 获取平台图标
 * @param platform 平台名称
 * @returns 图标名称
 */
const getPlatformIcon = (videoSource: any): string => {
  const platform = videoSource.videoSourcePlatform;
  const icon = videoSource.videoSourceIcon;
  if (icon) {
    return icon;
  }
  const iconMap: Record<string, string> = {
    观影AC: "ep:video-camera",
    观影MV: "ep:film",
    观影TV: "ep:monitor",
    PanSou: "ep:folder-opened",
    豆瓣: "ep:star-filled",
    优酷: "ep:video-play",
    YouTube: "ep:video-camera-filled",
    Bilibili: "ep:video-play",
  };
  return iconMap[platform] || "ep:video-camera";
};

/**
 * 格式化URL显示
 * @param url URL地址
 * @returns 格式化后的URL
 */
const formatUrl = (url: string): string => {
  if (!url) return "";
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url.length > 30 ? url.substring(0, 30) + "..." : url;
  }
};

/**
 * 掩码Token显示
 * @param token Token字符串
 * @returns 掩码后的Token
 */
const maskToken = (token: string): string => {
  if (!token) return "";
  if (token.length <= 8) return "****";
  return token.substring(0, 4) + "****" + token.substring(token.length - 4);
};

/**
 * 格式化User Agent显示
 * @param ua User Agent字符串
 * @returns 格式化后的User Agent
 */
const formatUserAgent = (ua: string): string => {
  if (!ua) return "";
  // 提取浏览器信息
  const chromeMatch = ua.match(/Chrome\/(\d+\.\d+)/);
  const firefoxMatch = ua.match(/Firefox\/(\d+\.\d+)/);
  const safariMatch = ua.match(/Safari\/(\d+\.\d+)/);

  if (chromeMatch) return `Chrome ${chromeMatch[1]}`;
  if (firefoxMatch) return `Firefox ${firefoxMatch[1]}`;
  if (safariMatch) return `Safari ${safariMatch[1]}`;

  return ua.length > 20 ? ua.substring(0, 20) + "..." : ua;
};

/**
 * 处理命令
 * @param command 命令类型
 */
const handleCommand = (command: string) => {
  emit("action", command, props.source);
};

/**
 * 处理测试连接
 */
const handleTest = async () => {
  testing.value = true;
  try {
    emit("testConnection", props.source);
  } finally {
    setTimeout(() => {
      testing.value = false;
    }, 2000);
  }
};

/**
 * 处理编辑
 */
const handleEdit = () => {
  emit("action", "edit", props.source);
};
</script>

<style scoped>
.source-card {
  background: var(--el-bg-color-overlay);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

.source-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
  border-color: var(--el-color-primary);
}

.source-card.disabled {
  opacity: 0.65;
  background: var(--el-fill-color-lighter);
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.platform-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.platform-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
}

.platform-details {
  flex: 1;
  min-width: 0;
}

.platform-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.platform-url {
  margin: 0;
  font-size: 13px;
   color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  flex-shrink: 0;
}

.more-btn {
  padding: 8px;
   color: var(--el-text-color-primary);
  font-size: 16px;
}

.more-btn:hover {
  color: #409eff;
  background: #f0f9ff;
}

.card-content {
  padding: 16px 20px;
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-label {
  font-size: 12px;
   color: var(--el-text-color-primary);
  font-weight: 500;
}

.config-value {
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.token-value {
  font-family: "Courier New", monospace;
  background: var(--el-bg-color-overlay);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.ua-value {
  font-size: 12px;
  background: var(--el-bg-color-overlay);
  padding: 2px 6px;
  border-radius: 4px;
}

.card-footer {
  padding: 12px 20px;
  background: #fafbfc;
  border-top: 1px solid #f0f2f5;
}

.footer-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.test-btn {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border: none;
  color: var(--el-text-color-primary);
}

.edit-btn {
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  color: var(--el-text-color-regular);
  transition: all 0.3s ease;
}

.edit-btn:hover {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
  transform: translateY(-2px);
}

/* 下拉菜单样式 */
:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
}

:deep(.el-dropdown-menu__item.text-warning) {
  color: #e6a23c;
}

:deep(.el-dropdown-menu__item.text-success) {
  color: #67c23a;
}

:deep(.el-dropdown-menu__item.text-danger) {
  color: #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .config-grid {
    grid-template-columns: 1fr;
  }

  .platform-info {
    gap: 8px;
  }

  .platform-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .platform-name {
    font-size: 14px;
  }

  .platform-url {
    font-size: 12px;
  }
}
</style>
