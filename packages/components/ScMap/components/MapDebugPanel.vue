/**
 * 地图调试面板组件
 * @author CH
 * @date 2025-05-15
 */
<template>
  <div class="map-debug-panel" v-if="_visible" :class="themeClass">
    <div class="debug-panel-header">
      <div class="title">调试面板</div>
      <div class="controls">
        <button class="clear-btn" @click="clearLogs">清空</button>
      </div>
    </div>
    <div class="debug-panel-content leaflet-control-thin-scrollbar" ref="logContainer">
      <div 
        v-for="(log, index) in logs" 
        :key="index" 
        class="log-item"
        :class="{'log-event': log.type === 'event', 'log-error': log.type === 'error', 'log-warning': log.type === 'warning', 'log-info': log.type === 'info'}"
      >
        <div class="log-time">{{ log.time }}</div>
        <div class="log-type">{{ log.type }}</div>
        <div class="log-message">{{ log.message }}</div>
        <div class="log-data" v-if="log.data">{{ JSON.stringify(log.data, null, 2) }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'MapDebugPanel'
};
</script>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';

interface Props {
  visible: boolean;
  theme?: 'light' | 'dark';
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  theme: 'light'
});

defineEmits(['close']);

interface LogItem {
  time: string;
  type: 'event' | 'error' | 'warning' | 'info';
  message: string;
  data?: any;
}

const logs = ref<LogItem[]>([]);
const _visible = ref(props.visible);
const logContainer = ref<HTMLElement | null>(null);

const themeClass = computed(() => {
  return {
    'light-theme': props.theme === 'light',
    'dark-theme': props.theme === 'dark'
  };
});

// 添加日志的方法
const addLog = (type: 'event' | 'error' | 'warning' | 'info', message: string, data?: any) => {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
  
  logs.value.push({
    time: timeStr,
    type,
    message,
    data
  });
  
  // 限制日志数量，超过500条删除旧的
  if (logs.value.length > 500) {
    logs.value.shift();
  }
  
  // 自动滚动到底部
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

// 记录事件
const logEvent = (eventName: string, eventData?: any) => {
  addLog('event', eventName, eventData);
};

// 记录错误
const logError = (message: string, data?: any) => {
  addLog('error', message, data);
};

// 记录警告
const logWarning = (message: string, data?: any) => {
  addLog('warning', message, data);
};

// 记录信息
const logInfo = (message: string, data?: any) => {
  addLog('info', message, data);
};

// 清空日志
const clearLogs = () => {
  logs.value = [];
};

// 监视可见性变化，当变为可见时添加一条信息
watch(() => props.visible, (newVal) => {
  _visible.value = newVal;
}, { immediate: true , deep: true });

// 暴露方法给父组件
defineExpose({
  logEvent,
  addLog,
  logError,
  logWarning,
  logInfo,
  clearLogs
});
</script>

<style scoped>
.map-debug-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  height: 400px;
  background-color: var(--bg-color, rgba(255, 255, 255, 0.95));
  border: 1px solid var(--border-color, #ccc);
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  z-index: 1000;
}

.debug-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--header-bg, #f0f0f0);
  border-bottom: 1px solid var(--border-color, #ccc);
}

.title {
  font-weight: bold;
  color: var(--title-color, #333);
}

.controls {
  display: flex;
  gap: 8px;
}

.controls button {
  background-color: var(--button-bg, #fff);
  border: 1px solid var(--button-border, #ddd);
  border-radius: 3px;
  padding: 2px 6px;
  cursor: pointer;
  font-size: 12px;
  color: var(--button-color, #333);
}

.controls button:hover {
  background-color: var(--button-hover-bg, #f5f5f5);
}

.clear-btn {
  color: var(--clear-button-color, #1890ff) !important;
}

.close-btn {
  color: var(--close-button-color, #666) !important;
}

.debug-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  font-size: 12px;
  line-height: 1.4;
}

.log-item {
  margin-bottom: 6px;
  padding: 4px 8px;
  border-radius: 3px;
  background-color: var(--log-bg, rgba(255, 255, 255, 0.7));
  display: flex;
  flex-wrap: wrap;
}

.log-time {
  color: var(--log-time-color, #888);
  margin-right: 8px;
  font-family: monospace;
}

.log-type {
  color: var(--log-type-color, #333);
  font-weight: bold;
  margin-right: 8px;
  padding: 0 4px;
  border-radius: 2px;
}

.log-message {
  flex: 1 0 100%;
  margin-top: 4px;
  color: var(--log-message-color, #333);
  word-break: break-all;
}

.log-data {
  flex: 1 0 100%;
  margin-top: 4px;
  padding: 4px;
  background-color: var(--log-data-bg, rgba(240, 240, 240, 0.5));
  border-radius: 2px;
  font-family: monospace;
  white-space: pre-wrap;
  font-size: 11px;
  color: var(--log-data-color, #444);
}

.log-event .log-type {
  color: var(--event-color, #1890ff);
  background-color: var(--event-bg, rgba(24, 144, 255, 0.1));
}

.log-error .log-type {
  color: var(--error-color, #f5222d);
  background-color: var(--error-bg, rgba(245, 34, 45, 0.1));
}

.log-warning .log-type {
  color: var(--warning-color, #faad14);
  background-color: var(--warning-bg, rgba(250, 173, 20, 0.1));
}

.log-info .log-type {
  color: var(--info-color, #52c41a);
  background-color: var(--info-bg, rgba(82, 196, 26, 0.1));
}

/* 明亮主题 */
.light-theme {
  --bg-color: rgba(255, 255, 255, 0.95);
  --header-bg: #f0f0f0;
  --title-color: #333;
  --border-color: #ccc;
  --button-bg: #fff;
  --button-border: #ddd;
  --button-color: #333;
  --button-hover-bg: #f5f5f5;
  --clear-button-color: #1890ff;
  --close-button-color: #666;
  --log-bg: rgba(250, 250, 250, 0.7);
  --log-time-color: #888;
  --log-type-color: #333;
  --log-message-color: #333;
  --log-data-bg: rgba(240, 240, 240, 0.5);
  --log-data-color: #444;
  --event-color: #1890ff;
  --event-bg: rgba(24, 144, 255, 0.1);
  --error-color: #f5222d;
  --error-bg: rgba(245, 34, 45, 0.1);
  --warning-color: #faad14;
  --warning-bg: rgba(250, 173, 20, 0.1);
  --info-color: #52c41a;
  --info-bg: rgba(82, 196, 26, 0.1);
}

/* 暗黑主题 */
.dark-theme {
  --bg-color: rgba(33, 33, 33, 0.95);
  --header-bg: #2a2a2a;
  --title-color: #e0e0e0;
  --border-color: #444;
  --button-bg: #333;
  --button-border: #555;
  --button-color: #e0e0e0;
  --button-hover-bg: #444;
  --clear-button-color: #40a9ff;
  --close-button-color: #ccc;
  --log-bg: rgba(40, 40, 40, 0.7);
  --log-time-color: #aaa;
  --log-type-color: #e0e0e0;
  --log-message-color: #e0e0e0;
  --log-data-bg: rgba(50, 50, 50, 0.5);
  --log-data-color: #ccc;
  --event-color: #40a9ff;
  --event-bg: rgba(24, 144, 255, 0.15);
  --error-color: #ff4d4f;
  --error-bg: rgba(245, 34, 45, 0.15);
  --warning-color: #ffc53d;
  --warning-bg: rgba(250, 173, 20, 0.15);
  --info-color: #73d13d;
  --info-bg: rgba(82, 196, 26, 0.15);
}
</style> 