<template>
  <div class="prometheus-container h-full">
    <!-- 空状态展示 -->
    <el-empty v-if="!data.genId" class="h-full" description="请选择数据源" />

    <!-- 主内容区域 -->
    <div v-else class="prometheus-content h-full">
      <!-- 顶部信息栏 -->
      <div class="prometheus-header">
        <!-- 数据源信息 -->
        <div class="prometheus-header__info">
          <IconifyIconOnline icon="logos:prometheus" class="prometheus-header__icon" />
          <span class="prometheus-header__name" :title="data.genName">{{ data.genName }}</span>
        </div>

        <!-- 状态信息 -->
        <el-divider direction="vertical" />
        <div class="prometheus-header__metric">
          <IconifyIconOnline icon="ri:time-line" class="prometheus-header__icon" />
          <span class="prometheus-header__value">{{ queryTime }} ms</span>
          <span class="prometheus-header__label">查询时间</span>
        </div>

        <el-divider direction="vertical" />
        <div class="prometheus-header__metric">
          <IconifyIconOnline icon="ri:signal-tower-line" class="prometheus-header__icon" />
          <span class="prometheus-header__value" :class="{ 'text-success': isOnline, 'text-danger': !isOnline }">
            {{ isOnline ? "在线" : "离线" }}
          </span>
          <span class="prometheus-header__label">状态</span>
        </div>

        <!-- 时间范围选择器 -->
        <div class="prometheus-header__actions ml-auto">
          <el-date-picker
            v-model="timeRangeValue"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="X"
            :default-time="defaultTime"
            :shortcuts="dateShortcuts"
            class="!w-[400px]"
          />
          <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
          <el-dropdown trigger="click" @command="handleAutoRefreshChange">
            <el-button class="btn-text" :type="autoRefreshInterval > 0 ? 'success' : 'info'" size="small">
              <IconifyIconOnline icon="ri:time-line" />
              <span v-if="autoRefreshInterval > 0 && autoRefreshCountdown > 0" class="countdown-badge">{{ autoRefreshCountdown }}</span>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="option in autoRefreshOptions" :key="option.value" :command="option.value">
                  <IconifyIconOnline :icon="autoRefreshInterval === option.value ? 'ri:check-line' : ''" class="mr-1" />
                  {{ option.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button class="btn-text" type="primary" size="small" :loading="loading" @click="handleRefresh">
            <IconifyIconOnline icon="ri:refresh-line" />
          </el-button>
          <el-button class="btn-text" type="primary" size="small" @click="toggleFullscreen">
            <IconifyIconOnline :icon="isFullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'" />
          </el-button>
          <el-button class="btn-text" type="success" size="small" @click="toggleEditMode">
            <IconifyIconOnline :icon="editMode ? 'ri:eye-line' : 'ri:settings-line'" />
          </el-button>
        </div>
      </div>

      <!-- 数据内容区域 -->
      <div class="prometheus-body">
        <el-scrollbar class="prometheus-scrollbar">
          <div class="prometheus-content-wrapper">
            <!-- 自定义布局视图 -->
            <PrometheusLayout ref="prometheusLayoutRef" :data="data" :editable="editMode" :time-params="getTimeRangeParams()" class="custom-layout" />
          </div>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, defineProps, defineExpose, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { fetchPrometheusQueryRangeGen } from "@/api/prometheus/index";
import { fetchPrometheusOnline, fetchPrometheusReload } from "@/api/prometheus/system";
import LineChart from "./components/LineChart.vue";
import PrometheusLayout from "./components/PrometheusLayout.vue";

// 组件属性
const props = defineProps({
  data: Object
});

// 状态变量
const loading = ref(false);
const isOnline = ref(true);
const queryTime = ref(0);
const editMode = ref(false);
const isFullscreen = ref(false);
const prometheusLayoutRef = ref(null);
// 定时刷新相关
const autoRefreshInterval = ref(0); // 0表示关闭自动刷新
const autoRefreshCountdown = ref(0); // 倒计时秒数
const autoRefreshOptions = [
  { label: "关闭自动刷新", value: 0 },
  { label: "10秒", value: 10 },
  { label: "30秒", value: 30 },
  { label: "1分钟", value: 60 },
  { label: "5分钟", value: 300 }
];

// 时间范围选择
const timeRangeValue = ref([
  Math.floor(Date.now() / 1000 - 60 * 60), // 默认一小时前
  Math.floor(Date.now() / 1000) // 当前时间
]);
const defaultTime = ref(["00:00:00", "23:59:59"]);
const dateShortcuts = [
  {
    text: "最近30分钟",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 30 * 60 * 1000);
      return [start, end];
    }
  },
  {
    text: "最近1小时",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 60 * 60 * 1000);
      return [start, end];
    }
  },
  {
    text: "最近3小时",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3 * 60 * 60 * 1000);
      return [start, end];
    }
  },
  {
    text: "最近6小时",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 6 * 60 * 60 * 1000);
      return [start, end];
    }
  },
  {
    text: "最近12小时",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 12 * 60 * 60 * 1000);
      return [start, end];
    }
  },
  {
    text: "最近24小时",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 24 * 60 * 60 * 1000);
      return [start, end];
    }
  }
];

// 定时器
let refreshTimer = null;
const refreshTimers = {};

// 切换编辑模式
const toggleEditMode = () => {
  editMode.value = !editMode.value;
};

// 检查Prometheus是否在线
const checkOnlineStatus = async () => {
  try {
    const res = await fetchPrometheusOnline({ monitorSysGenId: props.data.genId });
    isOnline.value = res.data || false;
  } catch (error) {
    console.error("检查Prometheus状态失败:", error);
    isOnline.value = false;
  }
};

// 获取时间范围参数
const getTimeRangeParams = () => {
  // 默认值
  const now = Math.floor(Date.now() / 1000);
  let start = now - 60 * 60; // 默认1小时前
  let end = now;

  // 如果有选择时间范围，则使用选择的时间
  if (timeRangeValue.value && timeRangeValue.value.length === 2) {
    start = parseInt(timeRangeValue.value[0]);
    end = parseInt(timeRangeValue.value[1]);
  }

  // 计算时间间隔（秒）
  const timeSpan = end - start;

  // 根据时间跨度动态计算步长
  let step = 60; // 默认步长60秒

  if (timeSpan <= 30 * 60) {
    // 30分钟内
    step = 15; // 15秒步长
  } else if (timeSpan <= 60 * 60) {
    // 1小时内
    step = 30; // 30秒步长
  } else if (timeSpan <= 3 * 60 * 60) {
    // 3小时内
    step = 60; // 1分钟步长
  } else if (timeSpan <= 6 * 60 * 60) {
    // 6小时内
    step = 2 * 60; // 2分钟步长
  } else if (timeSpan <= 12 * 60 * 60) {
    // 12小时内
    step = 5 * 60; // 5分钟步长
  } else if (timeSpan <= 24 * 60 * 60) {
    // 24小时内
    step = 10 * 60; // 10分钟步长
  } else if (timeSpan <= 7 * 24 * 60 * 60) {
    // 7天内
    step = 1 * 60 * 60; // 1小时步长
  } else {
    step = 6 * 60 * 60; // 6小时步长
  }

  return { start, end, step };
};

// 刷新数据
const handleRefresh = async () => {
  if (!props.data.genId) return;

  loading.value = true;

  try {
    // 检查在线状态
    await checkOnlineStatus();

    if (!isOnline.value) {
      ElMessage.warning("Prometheus服务离线，无法获取监控数据");
      loading.value = false;
      return;
    }

    const startTime = Date.now();

    // 刷新自定义布局组件
    if (prometheusLayoutRef.value) {
      prometheusLayoutRef.value.refresh();
    }

    // 计算查询时间
    queryTime.value = Date.now() - startTime;
  } catch (error) {
    console.error("刷新数据失败:", error);
    ElMessage.error("刷新数据失败");
  } finally {
    loading.value = false;
  }
};

// 处理查询按钮点击
const handleQuery = () => {
  if (!timeRangeValue.value || timeRangeValue.value.length !== 2) {
    ElMessage.warning("请选择有效的时间范围");
    return;
  }

  // 取消自动刷新
  if (autoRefreshInterval.value > 0) {
    autoRefreshInterval.value = 0;
    clearRefreshTimer();
    // 更新本地存储
    localStorage.setItem("prometheus-auto-refresh", "0");
  }

  // 执行刷新
  handleRefresh();
};

// 获取自动刷新标签
const getAutoRefreshLabel = () => {
  if (autoRefreshInterval.value === 0) {
    return "自动刷新";
  }

  const option = autoRefreshOptions.find(opt => opt.value === autoRefreshInterval.value);
  return option ? option.label.replace("关闭自动刷新", "自动刷新") : "自动刷新";
};

// 处理自动刷新选项变更
const handleAutoRefreshChange = interval => {
  autoRefreshInterval.value = interval;

  // 更新定时刷新
  if (interval > 0) {
    setupRefreshTimer(interval);
    // 立即执行一次刷新
    handleRefresh();
  } else {
    clearRefreshTimer();
  }

  // 保存用户偏好到本地存储
  localStorage.setItem("prometheus-auto-refresh", interval.toString());
};

// 设置定时刷新
const setupRefreshTimer = (seconds = 60) => {
  clearRefreshTimer();
  if (seconds > 0) {
    // 设置初始倒计时值
    autoRefreshCountdown.value = seconds;

    // 创建两个定时器：一个用于实际刷新，一个用于倒计时
    refreshTimer = setInterval(() => {
      handleRefresh();
      // 刷新后重置倒计时
      autoRefreshCountdown.value = seconds;
    }, seconds * 1000);

    // 创建倒计时定时器
    const countdownTimer = setInterval(() => {
      if (autoRefreshCountdown.value > 0) {
        autoRefreshCountdown.value--;
      }
    }, 1000);

    // 将倒计时定时器也保存，以便在清除时一起清除
    refreshTimers.countdown = countdownTimer;
  }
};

// 清除定时刷新
const clearRefreshTimer = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  // 清除倒计时定时器
  if (refreshTimers && refreshTimers.countdown) {
    clearInterval(refreshTimers.countdown);
    delete refreshTimers.countdown;
  }

  // 重置倒计时
  autoRefreshCountdown.value = 0;
};

// 组件挂载
onMounted(() => {
  // 设置默认时间范围为最近1小时
  const now = Math.floor(Date.now() / 1000);
  timeRangeValue.value = [now - 60 * 60, now];

  // 从本地存储加载自动刷新设置
  const savedRefreshInterval = localStorage.getItem("prometheus-auto-refresh");
  if (savedRefreshInterval) {
    autoRefreshInterval.value = parseInt(savedRefreshInterval);
  }

  // 确保时间范围有值
  if (!timeRangeValue.value || timeRangeValue.value.length !== 2) {
    timeRangeValue.value = [now - 60 * 60, now];
  }

  // 添加全屏变化事件监听
  document.addEventListener("fullscreenchange", handleFullscreenChange);

  if (props.data.genId) {
    handleRefresh();
    // 如果设置了自动刷新，则启动定时器
    if (autoRefreshInterval.value > 0) {
      setupRefreshTimer(autoRefreshInterval.value);
    }
  }
});

// 组件卸载
onBeforeUnmount(() => {
  clearRefreshTimer();
  // 移除全屏变化事件监听
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
});

// 监听时间范围变化
watch(timeRangeValue, newVal => {
  // 如果时间范围被清空，则重新设置为默认值（最近1小时）
  if (!newVal || newVal.length !== 2) {
    const now = Math.floor(Date.now() / 1000);
    timeRangeValue.value = [now - 60 * 60, now];
  }
});

// 监听数据源变化
watch(
  () => props.data.genId,
  newVal => {
    if (newVal) {
      handleRefresh();
      // 如果设置了自动刷新，则启动定时器
      if (autoRefreshInterval.value > 0) {
        setupRefreshTimer(autoRefreshInterval.value);
      }
    } else {
      clearRefreshTimer();
    }
  }
);

// 暴露方法给父组件
defineExpose({
  refresh: handleRefresh
});
</script>

<style lang="scss" scoped>
.prometheus-container {
  background-color: #1e1e2e;
  border-radius: var(--el-border-radius-base);
}

.prometheus-content {
  display: flex;
  flex-direction: column;
}

.prometheus-header {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  background-color: #1e1e2e;
  border-bottom: 1px solid var(--el-border-color-light);

  &__info {
    display: flex;
    align-items: center;
    min-width: 100px;
    font-size: 14px;
    color: #fff;
  }

  &__icon {
    font-size: 18px;
    margin-right: 6px;
    color: #fff;
  }

  &__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
  }

  &__metric {
    display: flex;
    align-items: center;
    margin: 0 8px;
  }

  &__value {
    font-weight: 500;
    margin: 0 4px;
    color: #fff;
  }

  &__label {
    color: #fff;
    font-size: 12px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.prometheus-body {
  flex: 1;
  overflow: hidden;
}

.prometheus-scrollbar {
  height: 100%;
}

.prometheus-content-wrapper {
  padding: 16px;
  height: 100%;
}

.metric-card {
  margin-bottom: 16px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .metric-value {
    font-size: 24px;
    font-weight: bold;
    margin: 8px 0;
    color: #fff;
  }

  .chart-container {
    height: 100px;
  }
}

.custom-layout {
  height: calc(100% - 16px);
}

.default-view + .custom-layout {
  margin-top: 16px;
}

.ml-auto {
  margin-left: auto;
}

.ml-1 {
  margin-left: 4px;
}

.mr-1 {
  margin-right: 4px;
}

.ml-2 {
  margin-left: 8px;
}

.text-success {
  color: var(--el-color-success);
}

.text-danger {
  color: var(--el-color-danger);
}

.btn-text {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 32px;
  height: 32px;
  padding: 0;

  .iconify {
    font-size: 16px;
  }
}

.countdown-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: var(--el-color-danger);
  color: white;
  border-radius: 10px;
  padding: 0 4px;
  font-size: 12px;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
}
</style>
