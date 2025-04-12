<template>
  <div class="sc-socket-event-process" v-if="showProgress">
    <!-- Process 布局：上方进度条，下方文字 -->
    <template v-if="layout === 'process'">
      <div class="process-header">
        <span class="process-title">{{ title }}</span>
        <el-tag :type="statusType" size="small">{{ statusText }}</el-tag>
      </div>
      
      <el-progress 
        :percentage="percentage" 
        :status="progressStatus" 
        :stroke-width="10"
        :format="percentageFormat"
      />
      
      <div class="process-message" v-if="message">
        <IconifyIconOnline :icon="messageIcon" class="message-icon" />
        <span>{{ message }}</span>
        <span v-if="currentStep" class="process-step">{{ currentStep }}</span>
      </div>
    </template>
    
    <!-- Log 布局：上方日志，下方进度条 -->
    <template v-else-if="layout === 'log'">
      <div class="log-container thin-scrollbar" :style="{ height: `${height}px` }">
        <div v-for="(log, index) in logs" :key="index" class="log-item" :style="{ paddingLeft: `${log.indent * 20}px` }">
          <span class="log-time">{{ formatTime(log.time) }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
      
      <div class="log-progress">
        <el-progress 
          :percentage="percentage" 
          :status="progressStatus" 
          :stroke-width="8"
          :format="percentageFormat"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted, watch } from 'vue';
import { IconifyIconOnline } from '@repo/components/ReIcon';

interface LogItem {
  time: Date;
  message: string;
  indent: number;
}

interface ProgressData {
  name?: string;
  eventId?: string | number;
  message?: string;
  step?: number;
  total?: number;
  status?: string;
  percentage?: number;
}

const props = defineProps({
  eventId: {
    type: [String, Number],
    required: true
  },
  title: {
    type: String,
    default: '同步进度'
  },
  eventName: {
    type: String,
    default: 'progress-event'
  },
  dataType: {
    type: String,
    default: 'socket', // socket 或 default
    validator: (value: string) => ['socket', 'default'].includes(value)
  },
  layout: {
    type: String,
    default: 'process', // process 或 log
    validator: (value: string) => ['process', 'log'].includes(value)
  },
  height: {
    type: Number,
    default: 200 // 日志容器高度，单位px
  }
});

// 尝试获取socket实例
const socket = inject('socket', null);

// 进度状态
const percentage = ref(0);
const status = ref('waiting'); // waiting, processing, success, error
const message = ref('');
const currentStep = ref('');
const showProgress = ref(false);
const logs = ref<LogItem[]>([]);

// 计算属性
const progressStatus = computed(() => {
  if (status.value === 'success') return 'success';
  if (status.value === 'error') return 'exception';
  return '';
});

const statusType = computed(() => {
  switch (status.value) {
    case 'waiting': return 'info';
    case 'processing': return 'warning';
    case 'success': return 'success';
    case 'error': return 'danger';
    default: return 'info';
  }
});

const statusText = computed(() => {
  switch (status.value) {
    case 'waiting': return '等待中';
    case 'processing': return '处理中';
    case 'success': return '已完成';
    case 'error': return '失败';
    default: return '等待中';
  }
});

const messageIcon = computed(() => {
  if (status.value === 'error') return 'ri:error-warning-line';
  if (status.value === 'success') return 'ri:check-line';
  return 'ri:information-line';
});

// 格式化百分比显示
const percentageFormat = (percentage: number) => {
  return percentage === 100 && status.value === 'success' 
    ? '完成' 
    : `${percentage}%`;
};

// 格式化时间
const formatTime = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// 处理接收到的数据
const handleProgressData = (data: ProgressData) => {
  if (!data || data.eventId !== props.eventId) return;
  
  showProgress.value = true;
  
  // 处理消息
  if (data.message) {
    message.value = data.message;
    
    // 如果是日志布局，添加到日志列表
    if (props.layout === 'log') {
      const indent = data.step && data.step <= 0 ? Math.abs(data.step) : 0;
      logs.value.push({
        time: new Date(),
        message: data.message,
        indent
      });
      
      // 限制日志数量，防止过多
      if (logs.value.length > 100) {
        logs.value = logs.value.slice(-100);
      }
      
      // 滚动到底部
      scrollToBottom();
    }
  }
  
  // 处理进度
  if (data.total && data.total > 0) {
    // 如果有总进度，计算百分比
    percentage.value = Math.min(100, Math.round((data.step || 0) / data.total * 100));
  } else if (data.percentage !== undefined) {
    // 如果直接提供了百分比
    percentage.value = Math.min(100, Math.round(data.percentage));
  }
  
  // 处理步骤
  if (data.step !== undefined) {
    if (data.step > 0 && data.total) {
      // 主进度
      currentStep.value = `${data.step}/${data.total}`;
    } else if (data.step <= 0) {
      // 子进度项
      currentStep.value = data.message || '';
    }
  }
  
  // 处理状态
  if (data.status) {
    status.value = data.status;
    
    // 如果完成或失败，5秒后自动隐藏
    if (data.status === 'success' || data.status === 'error') {
      setTimeout(() => {
        if (status.value === data.status) { // 确保状态没有被新的更新覆盖
          showProgress.value = false;
        }
      }, 5000);
    }
  } else {
    // 如果没有提供状态，但有进度，则设为处理中
    if (percentage.value > 0 && percentage.value < 100) {
      status.value = 'processing';
    } else if (percentage.value >= 100) {
      status.value = 'success';
    }
  }
};

// 滚动日志到底部
const scrollToBottom = () => {
  setTimeout(() => {
    const logContainer = document.querySelector('.log-container');
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }, 50);
};

// 监听socket事件
const setupSocketListener = () => {
  if (props.dataType !== 'socket' || !socket) return;
  
  const eventName = `${props.eventName}`;
  //@ts-ignore
  socket.on(eventName, (data: ProgressData) => {
    handleProgressData(data);
  });
};

// 移除socket监听
const removeSocketListener = () => {
  if (props.dataType !== 'socket' || !socket) return;
  
  const eventName = `${props.eventName}`;
  //@ts-ignore
  socket.off(eventName);
};

// 组件挂载时设置监听
onMounted(() => {
  setupSocketListener();
});

// 组件卸载时移除监听
onUnmounted(() => {
  removeSocketListener();
});

// 当eventId或dataType变化时，重新设置监听
watch([() => props.eventId, () => props.dataType], () => {
  removeSocketListener();
  setupSocketListener();
});

// 暴露方法给父组件
defineExpose({
  // 手动更新进度
  updateProgress(data: ProgressData) {
    if (props.dataType === 'default') {
      handleProgressData({
        ...data,
        eventId: props.eventId
      });
    }
  },
  // 重置进度
  resetProgress() {
    percentage.value = 0;
    status.value = 'waiting';
    message.value = '';
    currentStep.value = '';
    logs.value = [];
    showProgress.value = false;
  },
  // 显示进度条
  show() {
    showProgress.value = true;
  },
  // 隐藏进度条
  hide() {
    showProgress.value = false;
  },
  // 添加日志
  addLog(message: string, indent: number = 0) {
    if (props.layout === 'log') {
      logs.value.push({
        time: new Date(),
        message,
        indent
      });
      
      // 添加日志后滚动到底部
      scrollToBottom();
    }
  },
  // 清空日志
  clearLogs() {
    logs.value = [];
  }
});
</script>

<style scoped>
.sc-socket-event-process {
  margin: 12px 0;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}

.process-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.process-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.process-message {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
}

.message-icon {
  margin-right: 5px;
  font-size: 14px;
}

.process-step {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

/* 日志布局样式 */
.log-container {
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
  padding: 8px;
  margin-bottom: 10px;
  font-family: monospace;
  font-size: 12px;
}

.log-item {
  padding: 3px 0;
  line-height: 1.5;
  border-bottom: 1px dashed #f0f0f0;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-time {
  color: #909399;
  margin-right: 8px;
}

.log-message {
  color: #606266;
}

.log-progress {
  margin-top: 10px;
}

:deep(.el-progress-bar__inner) {
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

:deep(.el-progress-bar__outer) {
  background-color: #e9ecef;
}

:deep(.el-progress--success .el-progress-bar__inner) {
  background-color: #67c23a;
}

:deep(.el-progress--exception .el-progress-bar__inner) {
  background-color: #f56c6c;
}
</style>