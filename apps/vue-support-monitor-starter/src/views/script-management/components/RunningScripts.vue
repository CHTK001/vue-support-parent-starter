<template>
  <div class="running-scripts">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="running-count">
          <IconifyIconOnline icon="ri:play-circle-line" />
          <span>运行中脚本: {{ runningScripts.length }}</span>
        </div>
      </div>
      <div class="toolbar-right">
        <el-button size="small" @click="handleRefresh">
          <IconifyIconOnline icon="ri:refresh-line" />
          刷新
        </el-button>
        <el-button
          size="small"
          type="danger"
          :disabled="runningScripts.length === 0"
          @click="handleStopAll"
        >
          <IconifyIconOnline icon="ri:stop-line" />
          停止全部
        </el-button>
      </div>
    </div>

    <!-- 运行中脚本列表 -->
    <div class="scripts-list" v-loading="loading">
      <div
        v-for="script in runningScripts"
        :key="script.id"
        class="script-item"
      >
        <!-- 脚本信息头部 -->
        <div class="script-header">
          <div class="script-info">
            <div class="script-name">{{ script.scriptName }}</div>
            <div class="script-meta">
              <span class="execution-id">执行ID: {{ script.id }}</span>
              <span class="start-time"
                >开始时间: {{ formatTime(script.startTime) }}</span
              >
            </div>
          </div>
          <div class="script-status">
            <el-tag type="warning" size="small">
              <IconifyIconOnline icon="ri:loader-line" class="rotating" />
              运行中
            </el-tag>
          </div>
        </div>

        <!-- 执行进度 -->
        <div class="execution-progress">
          <div class="progress-info">
            <span class="duration"
              >运行时长: {{ formatRunningDuration(script.startTime) }}</span
            >
            <span class="progress-text">执行中...</span>
          </div>
          <el-progress
            :percentage="getProgressPercentage(script)"
            :status="getProgressStatus(script)"
            :show-text="false"
            :stroke-width="6"
          />
        </div>

        <!-- 实时输出 -->
        <div class="output-section">
          <div class="output-header">
            <span>实时输出</span>
            <el-button size="small" type="text" @click="toggleOutput(script)">
              {{ script.showOutput ? "收起" : "展开" }}
            </el-button>
          </div>
          <div v-if="script.showOutput" class="output-content">
            <div class="output-text">
              {{ script.output || "等待输出..." }}
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="script-actions">
          <el-button size="small" @click="$emit('view-detail', script)">
            <IconifyIconOnline icon="ri:eye-line" />
            查看详情
          </el-button>
          <el-button size="small" type="danger" @click="$emit('stop', script)">
            <IconifyIconOnline icon="ri:stop-line" />
            停止执行
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="runningScripts.length === 0 && !loading" class="empty-state">
        <IconifyIconOnline icon="ri:play-circle-line" class="empty-icon" />
        <p class="empty-text">暂无运行中的脚本</p>
        <p class="empty-desc">执行脚本后将在此处显示</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

// Emits
const emit = defineEmits<{
  stop: [script: any];
  "view-detail": [script: any];
}>();

// 响应式数据
const loading = ref(false);
const runningScripts = ref([
  // 模拟数据
  {
    id: 1,
    scriptName: "日志清理脚本",
    startTime: new Date(Date.now() - 120000), // 2分钟前开始
    output:
      "正在清理日志文件...\n已清理 /var/log/syslog.1\n已清理 /var/log/auth.log.1\n正在处理 /var/log/kern.log...",
    showOutput: false,
  },
  {
    id: 2,
    scriptName: "系统备份脚本",
    startTime: new Date(Date.now() - 300000), // 5分钟前开始
    output:
      "开始系统备份...\n正在备份 /etc 目录\n正在备份 /home 目录\n备份进度: 45%",
    showOutput: false,
  },
]);

let refreshTimer: NodeJS.Timeout | null = null;

// 初始化
onMounted(() => {
  loadRunningScripts();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});

// 方法
const loadRunningScripts = async () => {
  loading.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 模拟更新输出
    runningScripts.value.forEach((script) => {
      if (Math.random() > 0.7) {
        script.output += `\n新的输出行 ${new Date().toLocaleTimeString()}`;
      }
    });
  } catch (error) {
    ElMessage.error("加载运行中脚本失败");
  } finally {
    loading.value = false;
  }
};

const startAutoRefresh = () => {
  refreshTimer = setInterval(() => {
    loadRunningScripts();
  }, 3000); // 每3秒刷新一次
};

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

const handleRefresh = () => {
  loadRunningScripts();
};

const handleStopAll = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要停止所有运行中的脚本吗？共 ${runningScripts.value.length} 个脚本。`,
      "停止确认",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      }
    );

    runningScripts.value = [];
    ElMessage.success("所有脚本已停止");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("停止脚本失败");
    }
  }
};

const toggleOutput = (script: any) => {
  script.showOutput = !script.showOutput;
};

const formatRunningDuration = (startTime: Date) => {
  const now = new Date();
  const duration = now.getTime() - startTime.getTime();

  if (duration < 60000) {
    return `${Math.floor(duration / 1000)}秒`;
  } else if (duration < 3600000) {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  } else {
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    return `${hours}小时${minutes}分`;
  }
};

const getProgressPercentage = (script: any) => {
  // 基于运行时间计算进度（模拟）
  const duration = Date.now() - script.startTime.getTime();
  const maxDuration = 10 * 60 * 1000; // 假设最长10分钟
  return Math.min((duration / maxDuration) * 100, 95);
};

const getProgressStatus = (script: any) => {
  const percentage = getProgressPercentage(script);
  if (percentage < 30) return "success";
  if (percentage < 70) return "warning";
  return "exception";
};

// 临时格式化时间函数
const formatTime = (date: Date) => {
  return date.toLocaleString();
};
</script>

<style scoped lang="scss">
// 样式与之前的设计保持一致
.running-scripts {
  height: 100%;
  display: flex;
  flex-direction: column;
}

// 旋转动画
.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 其他样式省略
</style>
