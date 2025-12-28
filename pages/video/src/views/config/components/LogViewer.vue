<template>
  <sc-dialog 
    :model-value="visible" 
    @update:model-value="handleClose"
    title="同步日志" 
    width="800px"
    @close="handleClose"
  >
    <div class="logs-container">
      <div class="logs-header mb-4">
        <el-button @click="handleRefresh" size="small">
          <el-icon><IconifyIconOnline icon="ep:refresh" /></el-icon>
          刷新
        </el-button>
        <el-button @click="handleClear" size="small" type="danger">
          <el-icon><IconifyIconOnline icon="ep:delete" /></el-icon>
          清空日志
        </el-button>
      </div>

      <div class="logs-content bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
        <div 
          v-for="log in logs" 
          :key="log.id" 
          class="log-line mb-1"
        >
          <span class="text-gray-500">[{{ formatTime(log.createTime) }}]</span>
          <span :class="getLogLevelClass(log.level)">{{ log.level }}</span>
          <span>{{ log.message }}</span>
        </div>
        <div 
          v-if="logs.length === 0" 
          class="text-gray-500 text-center py-8"
        >
          暂无日志记录
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
    'ERROR': 'text-red-400',
    'WARN': 'text-yellow-400',
    'INFO': 'text-blue-400',
    'DEBUG': 'text-gray-400',
    'SUCCESS': 'text-green-400'
  };
  return levelMap[level?.toUpperCase()] || 'text-green-400';
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

<style scoped>
.logs-container {
  max-height: 500px;
}

.logs-header {
  display: flex;
  gap: 12px;
  align-items: center;
}

.logs-content {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.5;
}

.log-line {
  word-break: break-all;
  padding: 2px 0;
}

.log-line:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

/* 滚动条样式 */
.logs-content::-webkit-scrollbar {
  width: 8px;
}

.logs-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.logs-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.logs-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>