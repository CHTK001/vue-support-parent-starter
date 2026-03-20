<template>
  <div class="dashboard-container">
    <!-- 欢迎卡片 -->
    <ScCard class="welcome-card hover-lift" shadow="never">
      <div class="welcome-content">
        <div class="welcome-text">
          <h2 class="welcome-title">
            {{ getGreeting() }}，{{ userInfo.nickname || userInfo.username }}！
          </h2>
          <p class="welcome-desc">欢迎回来，今天是个美好的一天</p>
        </div>
        <div class="welcome-stats">
          <div class="stat-item">
            <IconifyIconOnline icon="ri:calendar-line" :size="20" />
            <span>{{ currentDate }}</span>
          </div>
          <div class="stat-item">
            <IconifyIconOnline icon="ri:time-line" :size="20" />
            <span>{{ currentTime }}</span>
          </div>
        </div>
      </div>
    </ScCard>

    <!-- 统计卡片 -->
    <ScRow :gutter="16" class="stats-section">
      <ScCol :span="6">
        <div
          class="stat-card hover-lift"
          style="background: var(--gradient-primary)"
        >
          <div class="stat-icon">
            <IconifyIconOnline icon="ri:user-line" :size="32" />
          </div>
          <div class="stat-content">
            <div class="stat-value">
              <ScNumber :value="statistics.totalUsers" :duration="1500" />
            </div>
            <div class="stat-label">用户总数</div>
          </div>
        </div>
      </ScCol>

      <ScCol :span="6">
        <div
          class="stat-card hover-lift"
          style="background: var(--gradient-success)"
        >
          <div class="stat-icon">
            <IconifyIconOnline icon="ri:task-line" :size="32" />
          </div>
          <div class="stat-content">
            <div class="stat-value">
              <ScNumber :value="statistics.totalTasks" :duration="1500" />
            </div>
            <div class="stat-label">任务总数</div>
          </div>
        </div>
      </ScCol>

      <ScCol :span="6">
        <div
          class="stat-card hover-lift"
          style="background: var(--gradient-warning)"
        >
          <div class="stat-icon">
            <IconifyIconOnline icon="ri:mail-line" :size="32" />
          </div>
          <div class="stat-content">
            <div class="stat-value">
              <ScNumber :value="statistics.unreadMessages" :duration="1500" />
            </div>
            <div class="stat-label">未读消息</div>
          </div>
        </div>
      </ScCol>

      <ScCol :span="6">
        <div
          class="stat-card hover-lift"
          style="background: var(--gradient-info)"
        >
          <div class="stat-icon">
            <IconifyIconOnline icon="ri:file-list-line" :size="32" />
          </div>
          <div class="stat-content">
            <div class="stat-value">
              <ScNumber :value="statistics.pendingApprovals" :duration="1500" />
            </div>
            <div class="stat-label">待审批</div>
          </div>
        </div>
      </ScCol>
    </ScRow>

    <ScRow :gutter="16" class="content-section">
      <!-- 快捷操作 -->
      <ScCol :span="8">
        <ScCard class="quick-actions-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">快捷操作</span>
            </div>
          </template>

          <div class="quick-actions">
            <div
              class="action-item hover-scale"
              @click="handleQuickAction('user')"
            >
              <div
                class="action-icon"
                style="background: var(--gradient-primary)"
              >
                <IconifyIconOnline icon="ri:user-add-line" :size="24" />
              </div>
              <span class="action-label">新建用户</span>
            </div>

            <div
              class="action-item hover-scale"
              @click="handleQuickAction('task')"
            >
              <div
                class="action-icon"
                style="background: var(--gradient-success)"
              >
                <IconifyIconOnline icon="ri:add-line" :size="24" />
              </div>
              <span class="action-label">新建任务</span>
            </div>

            <div
              class="action-item hover-scale"
              @click="handleQuickAction('message')"
            >
              <div
                class="action-icon"
                style="background: var(--gradient-warning)"
              >
                <IconifyIconOnline icon="ri:mail-send-line" :size="24" />
              </div>
              <span class="action-label">发送消息</span>
            </div>

            <div
              class="action-item hover-scale"
              @click="handleQuickAction('file')"
            >
              <div class="action-icon" style="background: var(--gradient-info)">
                <IconifyIconOnline icon="ri:file-upload-line" :size="24" />
              </div>
              <span class="action-label">上传文件</span>
            </div>
          </div>
        </ScCard>
      </ScCol>

      <!-- 最近活动 -->
      <ScCol :span="16">
        <ScCard class="recent-activities-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">最近活动</span>
              <ScButton text @click="loadActivities">
                <IconifyIconOnline icon="ri:refresh-line" />
                刷新
              </ScButton>
            </div>
          </template>

          <div v-loading="activitiesLoading" class="activities-list">
            <div
              v-for="activity in activities"
              :key="activity.id"
              class="activity-item"
            >
              <div
                class="activity-icon"
                :style="{ background: activity.color }"
              >
                <IconifyIconOnline :icon="activity.icon" :size="20" />
              </div>
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-desc">{{ activity.description }}</div>
                <div class="activity-time">{{ activity.time }}</div>
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
import {
  ScCard,
  ScRow,
  ScCol,
  ScNumber,
  ScButton,
  ScEmpty,
} from "@repo/components";
import { IconifyIconOnline } from "@repo/components";
import { ScMessage } from "@repo/utils";

// 用户信息
const userInfo = reactive({
  username: "admin",
  nickname: "管理员",
});

// 统计数据
const statistics = reactive({
  totalUsers: 1258,
  totalTasks: 342,
  unreadMessages: 15,
  pendingApprovals: 8,
});

// 当前日期时间
const currentDate = ref("");
const currentTime = ref("");

// 最近活动
const activities = ref([
  {
    id: "1",
    title: "用户登录",
    description: "用户 张三 登录了系统",
    time: "5分钟前",
    icon: "ri:user-line",
    color: "var(--gradient-primary)",
  },
  {
    id: "2",
    title: "任务执行",
    description: '定时任务"数据同步"执行成功',
    time: "10分钟前",
    icon: "ri:task-line",
    color: "var(--gradient-success)",
  },
  {
    id: "3",
    title: "新消息",
    description: "收到系统通知：系统维护通知",
    time: "15分钟前",
    icon: "ri:mail-line",
    color: "var(--gradient-warning)",
  },
  {
    id: "4",
    title: "文件上传",
    description: "用户 李四 上传了文件 report.pdf",
    time: "20分钟前",
    icon: "ri:file-line",
    color: "var(--gradient-info)",
  },
]);

const activitiesLoading = ref(false);

// 获取问候语
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

// 更新时间
const updateTime = () => {
  const now = new Date();
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

// 加载活动记录
const loadActivities = async () => {
  activitiesLoading.value = true;
  try {
    // TODO: 调用后端接口获取活动记录
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (error) {
    console.error("加载活动记录失败:", error);
    ScMessage.error("加载活动记录失败");
  } finally {
    activitiesLoading.value = false;
  }
};

// 快捷操作
const handleQuickAction = (action: string) => {
  ScMessage.info(`执行操作：${action}`);
  // TODO: 实现具体的快捷操作
};

// 定时器
let timer: NodeJS.Timeout;

// 生命周期
onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
  loadActivities();
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped lang="scss">
.dashboard-container {
  padding: 20px;

  .welcome-card {
    margin-bottom: 20px;

    .welcome-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;

      .welcome-text {
        .welcome-title {
          margin: 0 0 8px;
          font-size: 24px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .welcome-desc {
          margin: 0;
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }

      .welcome-stats {
        display: flex;
        gap: 24px;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--el-text-color-regular);
        }
      }
    }
  }

  .stats-section {
    margin-bottom: 20px;

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      border-radius: 12px;
      color: #fff;
      cursor: pointer;

      .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12px;
      }

      .stat-content {
        flex: 1;

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          opacity: 0.9;
        }
      }
    }
  }

  .content-section {
    .quick-actions-card {
      .card-header {
        .card-title {
          font-size: 16px;
          font-weight: 600;
        }
      }

      .quick-actions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;

        .action-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px;
          background: var(--el-fill-color-lighter);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: var(--el-fill-color-light);
          }

          .action-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 56px;
            height: 56px;
            color: #fff;
            border-radius: 12px;
          }

          .action-label {
            font-size: 14px;
            font-weight: 500;
            color: var(--el-text-color-primary);
          }
        }
      }
    }

    .recent-activities-card {
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .card-title {
          font-size: 16px;
          font-weight: 600;
        }
      }

      .activities-list {
        min-height: 400px;

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          margin-bottom: 12px;
          background: var(--el-fill-color-lighter);
          border-radius: 8px;
          transition: all 0.3s ease;

          &:hover {
            background: var(--el-fill-color-light);
          }

          .activity-icon {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            color: #fff;
            border-radius: 8px;
          }

          .activity-content {
            flex: 1;

            .activity-title {
              font-size: 14px;
              font-weight: 500;
              color: var(--el-text-color-primary);
              margin-bottom: 4px;
            }

            .activity-desc {
              font-size: 13px;
              color: var(--el-text-color-regular);
              margin-bottom: 4px;
            }

            .activity-time {
              font-size: 12px;
              color: var(--el-text-color-secondary);
            }
          }
        }
      }
    }
  }
}

// 响应式适配
@media (max-width: 1200px) {
  .dashboard-container {
    .stats-section,
    .content-section {
      :deep(.el-col) {
        margin-bottom: 16px;
      }
    }
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 12px;

    .welcome-card {
      .welcome-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
    }

    .quick-actions-card {
      .quick-actions {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>
