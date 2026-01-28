<template>
  <sc-dialog 
    :model-value="visible" 
    @update:model-value="handleClose"
    title="同步日志" 
    width="800px"
    @close="handleClose"
  >
    <div class="logs-container">
      <div class="logs-header">
        <div class="logs-header-left">
          <IconifyIconOnline icon="ep:document" class="header-icon" />
          <span class="header-title">同步日志</span>
        </div>
        <div class="logs-header-actions">
          <el-button @click="handleRefresh" size="small" type="primary">
            <IconifyIconOnline icon="ep:refresh" />
            刷新
          </el-button>
          <el-button @click="handleClear" size="small" type="danger">
            <IconifyIconOnline icon="ep:delete" />
            清空日志
          </el-button>
        </div>
      </div>

      <div class="logs-content">
        <div 
          v-for="log in logs" 
          :key="log.id" 
          class="log-line"
        >
          <span class="log-time">[{{ formatTime(log.createTime) }}]</span>
          <span :class="['log-level', getLogLevelClass(log.level)]">{{ log.level }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
        <div 
          v-if="logs.length === 0" 
          class="logs-empty"
        >
          <IconifyIconOnline icon="ep:document-delete" class="empty-icon" />
          <p class="empty-text">暂无日志记录</p>
        </div>
      </div>
    </div>
  </sc-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/**
 * 日志查看组件
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

// 日志接口定义
interface LogItem {
  id: string;
  level: string;
  message: string;
  createTime: string;
}

// 定义props
interface Props {
  visible: boolean;
  logs: LogItem[];
}

const props = defineProps<Props>();

// 定义emits
interface Emits {
  'update:visible': [value: boolean];
  'refresh': [];
  'clear': [];
}

const emit = defineEmits<Emits>();

/**
 * 格式化时间
 * @param time 时间字符串
 * @returns 格式化后的时间
 */
const formatTime = (time: string): string => {
  if (!time) return '';
  try {
    const date = new Date(time);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return time;
  }
};

/**
 * 获取日志级别样式类
 * @param level 日志级别
 * @returns CSS类名
 */
const getLogLevelClass = (level: string): string => {
  const levelMap: Record<string, string> = {
    'ERROR': 'level-error',
    'WARN': 'level-warn',
    'INFO': 'level-info',
    'DEBUG': 'level-debug',
    'SUCCESS': 'level-success'
  };
  return levelMap[level?.toUpperCase()] || 'level-info';
};

/**
 * 处理刷新
 */
const handleRefresh = () => {
  emit('refresh');
};

/**
 * 处理清空日志
 */
const handleClear = () => {
  emit('clear');
};

/**
 * 处理关闭
 */
const handleClose = () => {
  emit('update:visible', false);
};
</script>

<style scoped lang="scss">
.logs-container {
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-7) 100%);
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 4px solid var(--el-color-primary);
}

.logs-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 20px;
  color: var(--el-color-primary);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.logs-header-actions {
  display: flex;
  gap: 12px;
}

.logs-header-actions .el-button {
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.logs-header-actions .el-button:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.logs-content {
  flex: 1;
  background: #1e1e1e;
  border-radius: 12px;
  padding: 20px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.8;
  color: #d4d4d4;
  overflow-y: auto;
  max-height: 500px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
}

.log-line {
  display: flex;
  gap: 12px;
  padding: 6px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  word-break: break-all;
}

.log-line:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.log-time {
  color: #858585;
  flex-shrink: 0;
  min-width: 160px;
}

.log-level {
  flex-shrink: 0;
  min-width: 60px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.level-error {
  color: #f48771;
  background: rgba(244, 135, 113, 0.15);
}

.level-warn {
  color: #dcdcaa;
  background: rgba(220, 220, 170, 0.15);
}

.level-info {
  color: #569cd6;
  background: rgba(86, 156, 214, 0.15);
}

.level-debug {
  color: #9cdcfe;
  background: rgba(156, 220, 254, 0.15);
}

.level-success {
  color: #4ec9b0;
  background: rgba(78, 201, 176, 0.15);
}

.log-message {
  flex: 1;
  color: #d4d4d4;
}

.logs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #858585;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  margin: 0;
  font-size: 14px;
}

/* 滚动条样式 */
.logs-content::-webkit-scrollbar {
  width: 10px;
}

.logs-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
}

.logs-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  transition: background 0.3s ease;
}

.logs-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>