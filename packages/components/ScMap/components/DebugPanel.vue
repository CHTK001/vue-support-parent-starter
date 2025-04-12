<template>
  <div class="debug-panel" v-show="show" :class="positionClass">
    <div class="debug-header">
      <div class="debug-title">调试面板</div>
      <div class="debug-actions">
        <button class="debug-btn clear-btn" @click="clearLogs" title="清除日志">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6,6 L18,18 M6,18 L18,6" stroke="currentColor" stroke-width="2"/></svg>
        </button>
        <button class="debug-btn close-btn" @click="$emit('close')" title="关闭">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6,6 L18,18 M6,18 L18,6" stroke="currentColor" stroke-width="2"/></svg>
        </button>
      </div>
    </div>
    <div class="debug-content thin-scrollbar" ref="logContainer">
      <div v-for="(log, index) in logs" :key="index" class="log-item" :class="log.type">
        <div class="log-time">{{ formatTime(log.time) }}</div>
        <div class="log-type">{{ log.type }}</div>
        <div class="log-message">{{ log.message }}</div>
        <pre v-if="log.data" class="log-data">{{ formatLogData(log.data) }}</pre>
      </div>
      <div v-if="logs.length === 0" class="empty-logs">
        暂无日志记录
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, watch, nextTick } from 'vue';

interface LogItem {
  type: 'info' | 'event' | 'error' | 'warning';
  message: string;
  data?: any;
  time: Date;
}

interface DebugPanelProps {
  show?: boolean;
  position?: string;
  mapPosition?: string; // 工具栏位置
  mapType?: string;
  maxLogs?: number;
}

const props = withDefaults(defineProps<DebugPanelProps>(), {
  show: false,
  position: 'opposite', // 'opposite' 表示与工具栏相反的位置
  mapPosition: 'top-left', // 默认工具栏位置
  mapType: 'unknown',
  maxLogs: 100
});

const emit = defineEmits(['close', 'clear']);

// 日志数据
const logs = ref<LogItem[]>([]);
const logContainer = ref<HTMLElement | null>(null);

// 根据工具栏位置计算调试面板位置
const positionClass = computed(() => {
  if (props.position === 'opposite') {
    // 根据工具栏位置的相反位置放置调试面板
    switch (props.mapPosition) {
      case 'top-left':
        return 'bottom-right';
      case 'top-right':
        return 'bottom-left';
      case 'bottom-left':
        return 'top-right';
      case 'bottom-right':
        return 'top-left';
      default:
        return 'top-right';
    }
  }
  return props.position;
});

// 添加日志
const addLog = (type: 'info' | 'event' | 'error' | 'warning', message: string, data?: any) => {
  logs.value.push({
    type,
    message,
    data,
    time: new Date()
  });
  
  // 限制日志数量
  if (logs.value.length > props.maxLogs) {
    logs.value = logs.value.slice(-props.maxLogs);
  }
  
  // 滚动到底部
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

// 清除日志
const clearLogs = () => {
  logs.value = [];
  emit('clear');
};

// 格式化时间
const formatTime = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

// 格式化日志数据
const formatLogData = (data: any) => {
  if (data === null) return 'null';
  if (data === undefined) return 'undefined';
  
  try {
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  } catch (e) {
    return '[数据格式化错误]';
  }
};

// 组件显示时添加初始化日志
watch(() => props.show, (visible) => {
  if (visible) {
    addLog('info', `调试面板初始化`, { mapType: props.mapType, time: new Date() });
  }
});

// 暴露方法
defineExpose({
  addLog,
  clearLogs
});
</script>

<style scoped>
.debug-panel {
  position: absolute;
  z-index: 99;
  width: 360px;
  max-width: calc(100% - 20px);
  height: 240px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  backdrop-filter: blur(5px);
}

.debug-header {
  padding: 8px;
  background-color: #f8f8f8;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.debug-title {
  font-weight: bold;
  color: #333;
  font-size: 13px;
}

.debug-actions {
  display: flex;
  gap: 6px;
}

.debug-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  padding: 0;
  color: #666;
}

.debug-btn:hover {
  background-color: #eee;
  color: #333;
}

.close-btn {
  color: #f56c6c;
}

.close-btn:hover {
  background-color: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.clear-btn {
  color: #909399;
}

.clear-btn:hover {
  background-color: rgba(144, 147, 153, 0.1);
  color: #606266;
}

.debug-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  background-color: #fafafa;
}

.log-item {
  margin-bottom: 4px;
  padding: 4px 6px;
  border-radius: 4px;
  border-left: 3px solid #ddd;
  background-color: rgba(255, 255, 255, 0.8);
}

.log-item.info {
  border-left-color: #409eff;
}

.log-item.event {
  border-left-color: #67c23a;
}

.log-item.warning {
  border-left-color: #e6a23c;
}

.log-item.error {
  border-left-color: #f56c6c;
}

.log-time {
  font-size: 11px;
  color: #909399;
  margin-bottom: 2px;
}

.log-type {
  display: inline-block;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 10px;
  margin-right: 4px;
  color: white;
  text-transform: uppercase;
}

.info .log-type {
  background-color: #409eff;
}

.event .log-type {
  background-color: #67c23a;
}

.warning .log-type {
  background-color: #e6a23c;
}

.error .log-type {
  background-color: #f56c6c;
}

.log-message {
  margin-top: 2px;
  color: #333;
  word-break: break-word;
}

.log-data {
  margin-top: 4px;
  padding: 4px;
  background-color: #f5f7fa;
  border-radius: 3px;
  font-size: 11px;
  color: #606266;
  overflow-x: auto;
  max-height: 150px;
}

.empty-logs {
  text-align: center;
  color: #909399;
  padding: 20px 0;
  font-style: italic;
}

/* 位置控制 */
.debug-panel.top-left {
  top: 10px;
  left: 10px;
}

.debug-panel.top-right {
  top: 10px;
  right: 10px;
}

.debug-panel.bottom-left {
  bottom: 10px;
  left: 10px;
}

.debug-panel.bottom-right {
  bottom: 10px;
  right: 10px;
}

@media (max-width: 768px) {
  .debug-panel {
    width: calc(100% - 20px);
    height: 180px;
    left: 10px;
    right: 10px;
  }
}
</style> 