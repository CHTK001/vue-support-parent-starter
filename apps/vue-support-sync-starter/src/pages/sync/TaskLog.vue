<template>
  <div class="log-container">
    <el-card>
      <template #header>
        <div class="header-actions">
          <h3>任务日志</h3>
          <div>
            <el-input
              v-model="searchText"
              placeholder="搜索日志"
              style="width: 200px; margin-right: 10px"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="selectedLevel"
              placeholder="日志级别"
              style="width: 120px; margin-right: 10px"
              clearable
              @change="handleFilter"
            >
              <el-option label="全部" value="" />
              <el-option label="INFO" value="INFO" />
              <el-option label="WARN" value="WARN" />
              <el-option label="ERROR" value="ERROR" />
            </el-select>
            <el-button @click="handleRefresh">刷新</el-button>
            <el-button @click="handleExport">导出</el-button>
            <el-button @click="handleBack">返回</el-button>
          </div>
        </div>
      </template>

      <div class="log-content">
        <div class="log-list" ref="logListRef">
          <div
            v-for="(log, index) in filteredLogs"
            :key="index"
            :class="['log-item', `log-${log.level.toLowerCase()}`]"
          >
            <span class="log-time">{{ log.timestamp }}</span>
            <el-tag :type="getLevelType(log.level)" size="small">{{ log.level }}</el-tag>
            <span class="log-message" v-html="highlightText(log.message)"></span>
          </div>
        </div>
        
        <el-empty v-if="filteredLogs.length === 0" description="暂无日志" />
      </div>

      <div class="log-footer">
        <el-checkbox v-model="autoScroll">自动滚动</el-checkbox>
        <span>共 {{ filteredLogs.length }} 条日志</span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const logListRef = ref<HTMLElement>();

const searchText = ref('');
const selectedLevel = ref('');
const autoScroll = ref(true);
const logs = ref<any[]>([]);

const filteredLogs = computed(() => {
  let result = logs.value;
  
  if (selectedLevel.value) {
    result = result.filter(log => log.level === selectedLevel.value);
  }
  
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase();
    result = result.filter(log => 
      log.message.toLowerCase().includes(keyword)
    );
  }
  
  return result;
});

const getLevelType = (level: string) => {
  const map: Record<string, any> = {
    INFO: 'info',
    WARN: 'warning',
    ERROR: 'danger',
  };
  return map[level] || 'info';
};

const highlightText = (text: string) => {
  if (!searchText.value) return text;
  
  const regex = new RegExp(`(${searchText.value})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

const handleSearch = () => {
  // 搜索逻辑已在computed中处理
};

const handleFilter = () => {
  // 过滤逻辑已在computed中处理
};

const handleRefresh = async () => {
  await loadLogs();
  ElMessage.success('刷新成功');
};

const handleExport = () => {
  const content = filteredLogs.value
    .map(log => `[${log.timestamp}] [${log.level}] ${log.message}`)
    .join('\n');
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `task-log-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  
  ElMessage.success('导出成功');
};

const handleBack = () => {
  router.push('/sync/tasks');
};

const loadLogs = async () => {
  // 这里应该调用真实的API获取日志
  // 暂时返回模拟数据
  const mockLogs = [];
  const levels = ['INFO', 'WARN', 'ERROR'];
  const messages = [
    '开始同步任务',
    '连接数据源成功',
    '读取数据: 1000条',
    '数据转换完成',
    '写入目标数据源',
    '同步完成',
    '连接超时，正在重试',
    '数据格式错误',
  ];
  
  for (let i = 0; i < 50; i++) {
    const date = new Date(Date.now() - i * 60000);
    mockLogs.push({
      timestamp: date.toLocaleString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
    });
  }
  
  logs.value = mockLogs;
  
  if (autoScroll.value) {
    await nextTick();
    scrollToBottom();
  }
};

const scrollToBottom = () => {
  if (logListRef.value) {
    logListRef.value.scrollTop = logListRef.value.scrollHeight;
  }
};

let refreshInterval: any = null;

onMounted(() => {
  loadLogs();
  
  // 自动刷新
  refreshInterval = setInterval(() => {
    if (autoScroll.value) {
      loadLogs();
    }
  }, 5000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped lang="scss">
.log-container {
  padding: 20px;
  height: calc(100vh - 40px);
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-content {
  height: calc(100vh - 240px);
  overflow: hidden;
}

.log-list {
  height: 100%;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  padding: 10px;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 4px;
}

.log-item {
  display: flex;
  gap: 10px;
  padding: 4px 0;
  border-bottom: 1px solid #333;

  &:last-child {
    border-bottom: none;
  }
}

.log-time {
  color: #858585;
  flex-shrink: 0;
}

.log-message {
  flex: 1;
  word-break: break-all;

  :deep(mark) {
    background: #ffd700;
    color: #000;
    padding: 0 2px;
  }
}

.log-info {
  .log-message {
    color: #4ec9b0;
  }
}

.log-warn {
  .log-message {
    color: #dcdcaa;
  }
}

.log-error {
  .log-message {
    color: #f48771;
  }
}

.log-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #dcdfe6;
}
</style>
