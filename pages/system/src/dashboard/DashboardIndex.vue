<template>
  <div class="dashboard-container">
    <!-- 装饰背景光效 -->
    <div class="dashboard-glow" aria-hidden="true">
      <span class="glow-orb glow-orb--primary" />
      <span class="glow-orb glow-orb--success" />
      <span class="glow-orb glow-orb--accent" />
    </div>

    <!-- 欢迎卡片 玻璃拟态 -->
    <ScCard class="welcome-card" shadow="never">
      <div class="welcome-content">
        <div class="welcome-text">
          <h2 class="welcome-title">
            {{ getGreeting() }}，<span class="welcome-name">{{ userInfo.nickname || userInfo.username }}</span>！
          </h2>
          <p class="welcome-desc">欢迎回来，今天是个美好的一天</p>
        </div>
        <div class="welcome-stats">
          <div class="welcome-stat-item">
            <IconifyIconOnline icon="ri:calendar-line" :size="18" />
            <span>{{ currentDate }}</span>
          </div>
          <div class="welcome-stat-divider" />
          <div class="welcome-stat-item">
            <IconifyIconOnline icon="ri:time-line" :size="18" />
            <span>{{ currentTime }}</span>
          </div>
        </div>
      </div>
    </ScCard>

    <!-- 统计卡片 -->
    <ScRow :gutter="16" class="stats-section">
      <ScCol :span="6" v-for="stat in statCards" :key="stat.key">
        <div class="stat-card" @click="stat.onClick">
          <div class="stat-icon" :style="{ background: stat.gradient }">
            <IconifyIconOnline :icon="stat.icon" :size="28" />
          </div>
          <div class="stat-body">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">
              <ScNumber :value="stat.value" :duration="1500" />
            </div>
            <div class="stat-trend" v-if="stat.trend">
              <IconifyIconOnline :icon="stat.trend.up ? 'ri:arrow-up-line' : 'ri:arrow-down-line'" :size="14" />
              <span>{{ stat.trend.text }}</span>
            </div>
          </div>
          <div class="stat-glow" :style="{ background: stat.gradient }" />
        </div>
      </ScCol>
    </ScRow>

    <ScRow :gutter="16" class="content-section">
      <!-- 快捷操作 -->
      <ScCol :span="8">
        <ScCard class="glass-card quick-actions-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="card-header-left">
                <span class="card-header-icon">
                  <IconifyIconOnline icon="ri:flashlight-line" :size="18" />
                </span>
                <span class="card-title">快捷操作</span>
              </div>
            </div>
          </template>

          <div class="quick-actions">
            <button
              v-for="action in quickActions"
              :key="action.key"
              class="action-item"
              @click="handleQuickAction(action.key)"
            >
              <div class="action-icon" :style="{ background: action.gradient }">
                <IconifyIconOnline :icon="action.icon" :size="22" />
              </div>
              <div class="action-info">
                <span class="action-label">{{ action.label }}</span>
                <span class="action-hint">{{ action.hint }}</span>
              </div>
            </button>
          </div>
        </ScCard>
      </ScCol>

      <!-- 最近活动 时间线风格 -->
      <ScCol :span="16">
        <ScCard class="glass-card activities-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="card-header-left">
                <span class="card-header-icon">
                  <IconifyIconOnline icon="ri:history-line" :size="18" />
                </span>
                <span class="card-title">最近活动</span>
              </div>
              <ScButton text class="card-header-action" @click="loadActivities">
                <IconifyIconOnline icon="ri:refresh-line" :size="16" />
                <span>刷新</span>
              </ScButton>
            </div>
          </template>

          <div v-loading="activitiesLoading" class="activities-timeline">
            <div
              v-for="(activity, index) in activities"
              :key="activity.id"
              class="timeline-item"
              :style="{ '--i': index }"
            >
              <div class="timeline-dot" :style="{ background: activity.color }">
                <IconifyIconOnline :icon="activity.icon" :size="14" />
              </div>
              <div class="timeline-line" v-if="index < activities.length - 1" />
              <div class="timeline-content">
                <div class="timeline-title">{{ activity.title }}</div>
                <div class="timeline-desc">{{ activity.description }}</div>
                <div class="timeline-time">
                  <IconifyIconOnline icon="ri:time-line" :size="12" />
                  {{ activity.time }}
                </div>
              </div>
            </div>

            <ScEmpty
              v-if="!activitiesLoading && activities.length === 0"
              description="暂无活动记录"
            />
          </div>
        </ScCard>
      </ScCol>
    </ScRow>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { ScCard } from "@repo/components/ScCard"
import { ScRow } from "@repo/components/ScRow"
import { ScCol } from "@repo/components/ScCol"
import { ScNumber } from "@repo/components/ScNumber"
import { ScEmpty } from "@repo/components/ScEmpty"
import { ScMessage, subscribeClock } from "@repo/utils";

const userInfo = reactive({
  username: "admin",
  nickname: "管理员",
});

const statistics = reactive({
  totalUsers: 1258,
  totalTasks: 342,
  unreadMessages: 15,
  pendingApprovals: 8,
});

const currentDate = ref("");
const currentTime = ref("");

const statCards = [
  {
    key: "users",
    icon: "ri:user-line",
    label: "用户总数",
    value: statistics.totalUsers,
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    trend: { up: true, text: "较上月 +12%" },
    onClick: () => ScMessage.info("查看用户详情"),
  },
  {
    key: "tasks",
    icon: "ri:task-line",
    label: "任务总数",
    value: statistics.totalTasks,
    gradient: "linear-gradient(135deg, #10b981, #34d399)",
    trend: { up: true, text: "完成率 94%" },
    onClick: () => ScMessage.info("查看任务详情"),
  },
  {
    key: "messages",
    icon: "ri:mail-line",
    label: "未读消息",
    value: statistics.unreadMessages,
    gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    trend: { up: false, text: "较昨日 -3" },
    onClick: () => ScMessage.info("查看消息"),
  },
  {
    key: "approvals",
    icon: "ri:file-list-line",
    label: "待审批",
    value: statistics.pendingApprovals,
    gradient: "linear-gradient(135deg, #3b82f6, #60a5fa)",
    trend: { up: true, text: "等待处理" },
    onClick: () => ScMessage.info("查看待审批"),
  },
];

const quickActions = [
  { key: "user", icon: "ri:user-add-line", label: "新建用户", hint: "添加系统用户账号", gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)" },
  { key: "task", icon: "ri:add-line", label: "新建任务", hint: "创建定时或即时任务", gradient: "linear-gradient(135deg, #10b981, #34d399)" },
  { key: "message", icon: "ri:mail-send-line", label: "发送消息", hint: "发送系统通知", gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)" },
  { key: "file", icon: "ri:file-upload-line", label: "上传文件", hint: "上传资源文件", gradient: "linear-gradient(135deg, #3b82f6, #60a5fa)" },
];

const activities = ref([
  {
    id: "1",
    title: "用户登录",
    description: "用户 张三 登录了系统",
    time: "5分钟前",
    icon: "ri:user-line",
    color: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  },
  {
    id: "2",
    title: "任务执行",
    description: '定时任务"数据同步"执行成功',
    time: "10分钟前",
    icon: "ri:task-line",
    color: "linear-gradient(135deg, #10b981, #34d399)",
  },
  {
    id: "3",
    title: "新消息",
    description: "收到系统通知：系统维护通知",
    time: "15分钟前",
    icon: "ri:mail-line",
    color: "linear-gradient(135deg, #f59e0b, #fbbf24)",
  },
  {
    id: "4",
    title: "文件上传",
    description: "用户 李四 上传了文件 report.pdf",
    time: "20分钟前",
    icon: "ri:file-line",
    color: "linear-gradient(135deg, #3b82f6, #60a5fa)",
  },
]);

const activitiesLoading = ref(false);

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return "凌晨好";
  if (hour < 9) return "早上好";
  if (hour < 12) return "上午好";
  if (hour < 14) return "中午好";
  if (hour < 17) return "下午好";
  if (hour < 19) return "傍晚好";
  if (hour < 22) return "晚上好";
  return "夜深了";
};

const updateTime = (nowValue = Date.now()) => {
  const now = new Date(nowValue);
  currentDate.value = now.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  currentTime.value = now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const loadActivities = async () => {
  activitiesLoading.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (error) {
    console.error("加载活动记录失败:", error);
    ScMessage.error("加载活动记录失败");
  } finally {
    activitiesLoading.value = false;
  }
};

const handleQuickAction = (action: string) => {
  ScMessage.info(`执行操作：${action}`);
};

let stopClockSubscription: (() => void) | null = null;

onMounted(() => {
  updateTime();
  stopClockSubscription = subscribeClock(updateTime);
  loadActivities();
});

onUnmounted(() => {
  stopClockSubscription?.();
  stopClockSubscription = null;
});
</script>

<style scoped lang="scss">
.dashboard-container {
  position: relative;
  padding: 20px;
  overflow: hidden;
  animation: dashboard-fade-in 0.6s ease-out;

  @keyframes dashboard-fade-in {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
}

/* ── 背景光效 ── */
.dashboard-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;

  &--primary {
    top: -80px;
    left: 10%;
    width: 360px;
    height: 360px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%);
  }

  &--success {
    bottom: -60px;
    right: 20%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.1), transparent 70%);
  }

  &--accent {
    top: 40%;
    left: 50%;
    width: 250px;
    height: 250px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.08), transparent 70%);
    transform: translate(-50%, -50%);
  }
}

/* ── 欢迎卡片 ── */
.welcome-card {
  position: relative;
  margin-bottom: 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
  background: color-mix(in srgb, var(--el-bg-color-overlay) 70%, transparent);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), transparent 50%);
    pointer-events: none;
  }

  .welcome-content {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 24px;
  }

  .welcome-text {
    .welcome-title {
      margin: 0 0 6px;
      font-size: 24px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      letter-spacing: -0.02em;
    }

    .welcome-name {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .welcome-desc {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  .welcome-stats {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 18px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 14px;
    background: color-mix(in srgb, var(--el-bg-color) 50%, transparent);
    backdrop-filter: blur(8px);
  }

  .welcome-stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);
  }

  .welcome-stat-divider {
    width: 1px;
    height: 20px;
    background: var(--el-border-color-lighter);
  }
}

/* ── 统计卡片 ── */
.stats-section {
  margin-bottom: 20px;

  .stat-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 22px 20px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 18px;
    background: color-mix(in srgb, var(--el-bg-color-overlay) 80%, transparent);
    backdrop-filter: blur(12px);
    cursor: pointer;
    overflow: hidden;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    animation: stat-slide-in 0.5s ease-out backwards;

    @for $i from 1 through 4 {
      &:nth-child(#{$i}) { animation-delay: #{$i * 0.08}s; }
    }

    @keyframes stat-slide-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    &:hover {
      transform: translateY(-4px);
      border-color: color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color));

      .stat-glow {
        opacity: 1;
      }

      .stat-icon {
        transform: scale(1.1) rotate(-5deg);
      }
    }

    &:active {
      transform: translateY(-2px);
    }
  }

  .stat-glow {
    position: absolute;
    top: -50%;
    right: -30%;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    color: #fff;
    flex-shrink: 0;
    transition: transform 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .stat-body {
    flex: 1;
    min-width: 0;
    position: relative;
    z-index: 1;
  }

  .stat-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .stat-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

/* ── 内容区域 ── */
.content-section {
  .glass-card {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 20px;
    background: color-mix(in srgb, var(--el-bg-color-overlay) 70%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.03);
    overflow: hidden;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .card-header-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
      color: var(--el-color-primary);
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .card-header-action {
      font-size: 13px;
      color: var(--el-text-color-secondary);

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }
}

/* ── 快捷操作 ── */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  .action-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 14px;
    background: color-mix(in srgb, var(--el-bg-color) 40%, transparent);
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    font-family: inherit;

    &:hover {
      transform: translateY(-2px);
      border-color: color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color));
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    }

    &:active {
      transform: translateY(0);
    }

    .action-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      color: #fff;
      flex-shrink: 0;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
    }

    .action-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .action-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .action-hint {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

/* ── 最近活动 - 时间线 ── */
.activities-timeline {
  min-height: 400px;

  .timeline-item {
    position: relative;
    display: flex;
    gap: 16px;
    padding: 0 0 24px;
    animation: timeline-fade-in 0.5s ease-out backwards;

    @keyframes timeline-fade-in {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }

    &:nth-child(1) { animation-delay: 0.05s; }
    &:nth-child(2) { animation-delay: 0.1s; }
    &:nth-child(3) { animation-delay: 0.15s; }
    &:nth-child(4) { animation-delay: 0.2s; }
  }

  .timeline-dot {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .timeline-line {
    position: absolute;
    top: 36px;
    left: 17px;
    width: 2px;
    height: calc(100% - 12px);
    background: linear-gradient(180deg, var(--el-border-color-light), transparent);
  }

  .timeline-content {
    flex: 1;
    min-width: 0;
    padding: 4px 0 8px;
  }

  .timeline-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }

  .timeline-desc {
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 1.5;
    margin-bottom: 6px;
  }

  .timeline-time {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

/* ── 响应式 ── */
@media (max-width: 1200px) {
  .dashboard-container {
    .stats-section,
    .content-section {
      :deep(.el-col) {
        margin-bottom: 16px;
      }
    }
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 12px;

    .welcome-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
  }
}
</style>
