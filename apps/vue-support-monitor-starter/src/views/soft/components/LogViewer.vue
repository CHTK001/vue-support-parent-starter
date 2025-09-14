<template>
  <div class="log-viewer">
    <div class="log-header">
      <div class="log-info">
        <h4>{{ title }}</h4>
        <div class="log-meta">
          <el-tag size="small" type="info">{{ logCount }} 条日志</el-tag>
          <el-tag size="small" :type="isConnected ? 'success' : 'danger'">
            {{ isConnected ? '已连接' : '已断开' }}
          </el-tag>
        </div>
      </div>
      
      <div class="log-controls">
        <el-button-group size="small">
          <el-button 
            :type="autoScroll ? 'primary' : 'default'"
            @click="toggleAutoScroll"
          >
            <el-icon><Bottom /></el-icon>
            自动滚动
          </el-button>
          
          <el-button 
            :type="followLogs ? 'primary' : 'default'"
            @click="toggleFollow"
          >
            <el-icon><View /></el-icon>
            实时跟踪
          </el-button>
          
          <el-button @click="clearLogs">
            <el-icon><Delete /></el-icon>
            清空
          </el-button>
          
          <el-button @click="downloadLogs">
            <el-icon><Download /></el-icon>
            下载
          </el-button>
        </el-button-group>
        
        <el-select
          v-model="logLevel"
          size="small"
          style="width: 100px; margin-left: 8px;"
          @change="filterLogs"
        >
          <el-option label="全部" value="all" />
          <el-option label="错误" value="error" />
          <el-option label="警告" value="warn" />
          <el-option label="信息" value="info" />
          <el-option label="调试" value="debug" />
        </el-select>
        
        <el-input
          v-model="searchText"
          size="small"
          placeholder="搜索日志..."
          style="width: 200px; margin-left: 8px;"
          clearable
          @input="filterLogs"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>
    
    <div 
      ref="logContainer"
      class="log-content"
      :class="{ 'auto-scroll': autoScroll }"
      @scroll="handleScroll"
    >
      <div class="log-lines">
        <div
          v-for="(log, index) in filteredLogs"
          :key="index"
          class="log-line"
          :class="`log-${log.level}`"
        >
          <span class="log-timestamp">{{ formatTimestamp(log.timestamp) }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message" v-html="formatLogMessage(log.message)"></span>
        </div>
        
        <div v-if="filteredLogs.length === 0" class="no-logs">
          <el-empty description="暂无日志数据" />
        </div>
      </div>
    </div>
    
    <div class="log-footer">
      <div class="log-stats">
        <span>显示 {{ filteredLogs.length }} / {{ logs.length }} 条日志</span>
        <span v-if="searchText">搜索: "{{ searchText }}"</span>
      </div>
      
      <div class="log-actions">
        <el-button size="small" @click="scrollToTop">
          <el-icon><Top /></el-icon>
          顶部
        </el-button>
        <el-button size="small" @click="scrollToBottom">
          <el-icon><Bottom /></el-icon>
          底部
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue';
import {
  Bottom,
  Top,
  View,
  Delete,
  Download,
  Search
} from '@element-plus/icons-vue';
import { message } from '@repo/utils';

interface LogEntry {
  timestamp: string | Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
}

interface Props {
  title?: string;
  logs?: LogEntry[];
  isConnected?: boolean;
  maxLines?: number;
}

interface Emits {
  (e: 'toggle-follow', follow: boolean): void;
  (e: 'clear-logs'): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: '日志查看器',
  logs: () => [],
  isConnected: false,
  maxLines: 1000
});

const emit = defineEmits<Emits>();

const logContainer = ref<HTMLElement>();
const autoScroll = ref(true);
const followLogs = ref(false);
const logLevel = ref('all');
const searchText = ref('');
const logs = ref<LogEntry[]>([]);

// 计算属性
const logCount = computed(() => logs.value.length);

const filteredLogs = computed(() => {
  let filtered = logs.value;
  
  // 按日志级别过滤
  if (logLevel.value !== 'all') {
    filtered = filtered.filter(log => log.level === logLevel.value);
  }
  
  // 按搜索文本过滤
  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    filtered = filtered.filter(log => 
      log.message.toLowerCase().includes(search)
    );
  }
  
  return filtered;
});

// 监听props.logs变化
watch(() => props.logs, (newLogs) => {
  logs.value = [...newLogs];
  
  // 限制日志行数
  if (logs.value.length > props.maxLines) {
    logs.value = logs.value.slice(-props.maxLines);
  }
  
  // 自动滚动到底部
  if (autoScroll.value) {
    nextTick(() => {
      scrollToBottom();
    });
  }
}, { immediate: true, deep: true });

// 方法
const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value;
  if (autoScroll.value) {
    scrollToBottom();
  }
};

const toggleFollow = () => {
  followLogs.value = !followLogs.value;
  emit('toggle-follow', followLogs.value);
};

const clearLogs = () => {
  logs.value = [];
  emit('clear-logs');
  message.success('日志已清空');
};

const downloadLogs = () => {
  const logText = filteredLogs.value
    .map(log => `[${formatTimestamp(log.timestamp)}] ${log.level.toUpperCase()}: ${log.message}`)
    .join('\n');
  
  const blob = new Blob([logText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  message.success('日志下载成功');
};

const filterLogs = () => {
  // 过滤逻辑在computed中处理
};

const handleScroll = () => {
  if (!logContainer.value) return;
  
  const { scrollTop, scrollHeight, clientHeight } = logContainer.value;
  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
  
  // 如果用户手动滚动到非底部位置，关闭自动滚动
  if (!isAtBottom && autoScroll.value) {
    autoScroll.value = false;
  }
};

const scrollToTop = () => {
  if (logContainer.value) {
    logContainer.value.scrollTop = 0;
    autoScroll.value = false;
  }
};

const scrollToBottom = () => {
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight;
  }
};

const formatTimestamp = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
};

const formatLogMessage = (message: string) => {
  // 高亮搜索文本
  if (searchText.value) {
    const regex = new RegExp(`(${searchText.value})`, 'gi');
    return message.replace(regex, '<mark>$1</mark>');
  }
  return message;
};

// 添加日志方法（供外部调用）
const addLog = (log: LogEntry) => {
  logs.value.push(log);
  
  // 限制日志行数
  if (logs.value.length > props.maxLines) {
    logs.value.shift();
  }
  
  // 自动滚动
  if (autoScroll.value) {
    nextTick(() => {
      scrollToBottom();
    });
  }
};

// 暴露方法给父组件
defineExpose({
  addLog,
  clearLogs,
  scrollToBottom,
  scrollToTop
});
</script>

<style scoped>
.log-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;
  border-radius: 6px;
  overflow: hidden;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #404040;
}

.log-info h4 {
  margin: 0 0 4px 0;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.log-meta {
  display: flex;
  gap: 8px;
}

.log-controls {
  display: flex;
  align-items: center;
}

.log-content {
  flex: 1;
  overflow-y: auto;
  background: #1e1e1e;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.log-content.auto-scroll {
  scroll-behavior: smooth;
}

.log-lines {
  padding: 8px;
}

.log-line {
  display: flex;
  align-items: flex-start;
  padding: 2px 0;
  border-bottom: 1px solid transparent;
  word-wrap: break-word;
}

.log-line:hover {
  background: #2d2d2d;
}

.log-timestamp {
  color: #888888;
  margin-right: 8px;
  min-width: 80px;
  font-size: 11px;
}

.log-level {
  margin-right: 8px;
  min-width: 50px;
  font-weight: 600;
  font-size: 11px;
}

.log-message {
  flex: 1;
  color: #ffffff;
  white-space: pre-wrap;
}

/* 日志级别颜色 */
.log-error .log-level {
  color: #ff6b6b;
}

.log-error .log-message {
  color: #ff9999;
}

.log-warn .log-level {
  color: #ffa726;
}

.log-warn .log-message {
  color: #ffcc80;
}

.log-info .log-level {
  color: #42a5f5;
}

.log-info .log-message {
  color: #90caf9;
}

.log-debug .log-level {
  color: #66bb6a;
}

.log-debug .log-message {
  color: #a5d6a7;
}

.no-logs {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #888888;
}

.log-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #2d2d2d;
  border-top: 1px solid #404040;
  font-size: 12px;
}

.log-stats {
  display: flex;
  gap: 16px;
  color: #888888;
}

.log-actions {
  display: flex;
  gap: 4px;
}

/* 搜索高亮 */
:deep(mark) {
  background: #ffa726;
  color: #000000;
  padding: 0 2px;
  border-radius: 2px;
}

/* 滚动条样式 */
.log-content::-webkit-scrollbar {
  width: 8px;
}

.log-content::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.log-content::-webkit-scrollbar-thumb {
  background: #555555;
  border-radius: 4px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: #777777;
}

@media (max-width: 768px) {
  .log-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .log-controls {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .log-footer {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .log-stats {
    justify-content: center;
  }
  
  .log-actions {
    justify-content: center;
  }
}
</style>