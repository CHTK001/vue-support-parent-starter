<template>
  <div class="task-progress-bar">
    <div class="progress-header">
      <div class="progress-title">
        <IconifyIconOnline :icon="getTaskIcon()" class="mr-1" />
        <span>{{ title }}</span>
        <el-tag v-if="percentage < 100" type="warning" size="small" class="ml-2">进行中</el-tag>
        <el-tag v-else type="success" size="small" class="ml-2">已完成</el-tag>
      </div>
      <div class="progress-status">
        {{ formattedTimeElapsed }}
      </div>
    </div>
    <div class="progress-body">
      <el-progress :percentage="percentage" :format="percentageFormat" :status="percentage < 100 ? 'primary' : 'success'" :stroke-width="20" />
      <div class="progress-detail">
        <div class="detail-item" v-if="taskType === 'upload'">
          <div class="detail-label">{{ uploadedSize }} / {{ totalSize }}</div>
          <div class="detail-value">{{ uploadSpeed }}</div>
        </div>
        <div class="detail-item" v-else>
          <div class="detail-label">{{ processedHosts }} / {{ totalHosts }}</div>
          <div class="detail-value">{{ remainTime }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

// 定义props
const props = defineProps({
  title: {
    type: String,
    required: false,
    default: "任务进度"
  },
  percentage: {
    type: Number,
    required: true,
    default: 0
  },
  taskType: {
    type: String,
    required: false,
    default: "upload", // 'upload' 或 'execute'
    validator: value => ["upload", "execute"].includes(value)
  },
  // 上传文件相关
  uploadedSize: {
    type: String,
    required: false,
    default: "0 KB"
  },
  totalSize: {
    type: String,
    required: false,
    default: "0 KB"
  },
  uploadSpeed: {
    type: String,
    required: false,
    default: "0 KB/s"
  },
  // 执行脚本相关
  processedHosts: {
    type: Number,
    required: false,
    default: 0
  },
  totalHosts: {
    type: Number,
    required: false,
    default: 0
  },
  remainTime: {
    type: String,
    required: false,
    default: "计算中..."
  }
});

// 计时器相关
const startTime = ref(Date.now());
const currentTime = ref(Date.now());
const timerInterval = ref(null);

// 格式化百分比
const percentageFormat = percentage => {
  return percentage < 100 ? `${percentage}%` : "已完成";
};

// 获取任务图标
const getTaskIcon = () => {
  if (props.taskType === "upload") {
    return "ri:upload-cloud-2-line";
  } else {
    return "ri:terminal-box-line";
  }
};

// 计算已经过时间
const formattedTimeElapsed = computed(() => {
  const elapsedMs = currentTime.value - startTime.value;

  // 将毫秒转换为更友好的格式
  const seconds = Math.floor(elapsedMs / 1000) % 60;
  const minutes = Math.floor(elapsedMs / (1000 * 60)) % 60;
  const hours = Math.floor(elapsedMs / (1000 * 60 * 60));

  if (hours > 0) {
    return `已用时间: ${hours}小时${minutes}分${seconds}秒`;
  } else if (minutes > 0) {
    return `已用时间: ${minutes}分${seconds}秒`;
  } else {
    return `已用时间: ${seconds}秒`;
  }
});

// 启动计时器
const startTimer = () => {
  timerInterval.value = setInterval(() => {
    currentTime.value = Date.now();

    // 如果进度达到100%，停止计时
    if (props.percentage >= 100 && timerInterval.value) {
      clearInterval(timerInterval.value);
    }
  }, 1000);
};

// 停止计时器
const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }
};

// 重置计时器
const resetTimer = () => {
  stopTimer();
  startTime.value = Date.now();
  currentTime.value = Date.now();
  startTimer();
};

// 组件挂载时启动计时器
onMounted(() => {
  startTimer();
});

// 组件卸载前停止计时器
onBeforeUnmount(() => {
  stopTimer();
});

// 导出公开方法
defineExpose({
  resetTimer
});
</script>

<style lang="scss" scoped>
.task-progress-bar {
  width: 100%;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background-color: var(--el-fill-color-light);

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .progress-title {
      display: flex;
      align-items: center;
      font-weight: 500;
      font-size: 16px;
    }

    .progress-status {
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }
  }

  .progress-body {
    .progress-detail {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;

      .detail-item {
        display: flex;
        justify-content: space-between;
        width: 100%;

        .detail-label {
          color: var(--el-text-color-secondary);
        }

        .detail-value {
          font-weight: 500;
        }
      }
    }
  }
}

.mr-1 {
  margin-right: 4px;
}

.ml-2 {
  margin-left: 8px;
}
</style>
