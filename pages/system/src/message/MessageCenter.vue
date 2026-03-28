<template>
  <div class="message-center-container">
    <!-- 统计卡片 -->
    <ScRow :gutter="16" class="stats-section">
      <ScCol :span="6">
        <div class="stat-card hover-lift" @click="filterByType('all')">
          <div class="stat-icon" style="background: var(--gradient-primary)">
            <IconifyIconOnline icon="ri:mail-line" :size="28" />
          </div>
          <div class="stat-content">
            <div class="stat-value">
              <ScNumber :value="statistics.total" :duration="1000" />
            </div>
            <div class="stat-label">全部消息</div>
          </div>
        </div>
      </ScCol>

      <ScCol :span="6">
        <div class="stat-card hover-lift" @click="filterByType('unread')">
          <div class="stat-icon" style="background: var(--gradient-warning)">
            <IconifyIconOnline icon="ri:mail-unread-line" :size="28" />
          </div>
          <div class="stat-content">
            <div class="stat-value">
              <ScNumber :value="statistics.unread" :duration="1000" />
            </div>
            <div class="stat-label">未读消息</div>
          </div>
        </div>
      </ScCol>

      <ScCol :span="6">
        <div class="stat-card hover-lift" @click="filterByType('system')">
          <div class="stat-icon" style="background: var(--gradient-info)">
            <IconifyIconOnline icon="ri:notification-line" :size="28" />
          </div>
          <div class="stat-content">
            <div class="stat-value">
              <ScNumber :value="statistics.system" :duration="1000" />
            </div>
            <div class="stat-label">系统通知</div>
          </div>
        </div>
      </ScCol>

      <ScCol :span="6">
        <div class="stat-card hover-lift" @click="filterByType('task')">
          <div class="stat-icon" style="background: var(--gradient-success)">
            <IconifyIconOnline icon="ri:task-line" :size="28" />
          </div>
          <div class="stat-content">
            <div class="stat-value">
              <ScNumber :value="statistics.task" :duration="1000" />
            </div>
            <div class="stat-label">任务通知</div>
          </div>
        </div>
      </ScCol>
    </ScRow>

    <!-- 消息列表 -->
    <ScCard class="message-list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">消息列表</span>
          <div class="header-actions">
            <ScSelect
              v-model="filterType"
              placeholder="消息类型"
              style="width: 150px; margin-right: 12px"
              @change="handleFilter"
            >
              <ScOption label="全部消息" value="all" />
              <ScOption label="系统通知" value="system" />
              <ScOption label="任务通知" value="task" />
              <ScOption label="审批通知" value="approval" />
            </ScSelect>

            <ScSelect
              v-model="filterStatus"
              placeholder="消息状态"
              style="width: 120px; margin-right: 12px"
              @change="handleFilter"
            >
              <ScOption label="全部" value="all" />
              <ScOption label="未读" value="unread" />
              <ScOption label="已读" value="read" />
            </ScSelect>

            <ScButton type="primary" @click="markAllAsRead">
              <IconifyIconOnline icon="ri:check-double-line" />
              全部已读
            </ScButton>

            <ScButton @click="handleRefresh">
              <IconifyIconOnline icon="ri:refresh-line" />
              刷新
            </ScButton>
          </div>
        </div>
      </template>

      <div v-loading="loading" class="message-list">
        <div
          v-for="message in messageList"
          :key="message.id"
          class="message-item"
          :class="{ unread: !message.isRead, 'hover-lift': true }"
          @click="handleMessageClick(message)"
        >
          <div class="message-icon">
            <IconifyIconOnline
              :icon="getMessageIcon(message.type)"
              :size="24"
              :style="{ color: getMessageColor(message.type) }"
            />
          </div>

          <div class="message-content">
            <div class="message-header">
              <span class="message-title">{{ message.title }}</span>
              <ScTag
                :type="getMessageTagType(message.type)"
                size="small"
                class="message-type-tag"
              >
                {{ getMessageTypeName(message.type) }}
              </ScTag>
            </div>

            <div class="message-body">{{ message.content }}</div>

            <div class="message-footer">
              <span class="message-time">
                <IconifyIconOnline icon="ri:time-line" :size="14" />
                {{ formatTime(message.createTime) }}
              </span>
              <span v-if="message.sender" class="message-sender">
                <IconifyIconOnline icon="ri:user-line" :size="14" />
                {{ message.sender }}
              </span>
            </div>
          </div>

          <div class="message-actions">
            <ScButton
              v-if="!message.isRead"
              type="primary"
              size="small"
              text
              @click.stop="markAsRead(message)"
            >
              标记已读
            </ScButton>
            <ScButton
              type="danger"
              size="small"
              text
              @click.stop="deleteMessage(message)"
            >
              删除
            </ScButton>
          </div>
        </div>

        <!-- 空状态 -->
        <ScEmpty
          v-if="!loading && messageList.length === 0"
          description="暂无消息"
        />
      </div>

      <!-- 分页 -->
      <div v-if="messageList.length > 0" class="pagination-container">
        <ScPagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadMessages"
          @current-change="loadMessages"
        />
      </div>
    </ScCard>

    <!-- 消息详情对话框 -->
    <ScDialog
      v-model="detailDialogVisible"
      :title="currentMessage?.title"
      width="600px"
    >
      <div v-if="currentMessage" class="message-detail">
        <div class="detail-header">
          <ScTag :type="getMessageTagType(currentMessage.type)">
            {{ getMessageTypeName(currentMessage.type) }}
          </ScTag>
          <span class="detail-time">{{
            formatTime(currentMessage.createTime)
          }}</span>
        </div>

        <div class="detail-content">{{ currentMessage.content }}</div>

        <div v-if="currentMessage.sender" class="detail-footer">
          <span>发送人：{{ currentMessage.sender }}</span>
        </div>
      </div>

      <template #footer>
        <ScButton @click="detailDialogVisible = false">关闭</ScButton>
        <ScButton
          v-if="currentMessage && !currentMessage.isRead"
          type="primary"
          @click="markAsReadAndClose"
        >
          标记已读
        </ScButton>
      </template>
    </ScDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { ScCard } from "@repo/components/ScCard"
import { ScRow } from "@repo/components/ScRow"
import { ScCol } from "@repo/components/ScCol"
import { ScNumber } from "@repo/components/ScNumber"
import { ScSelect } from "@repo/components/ScSelect"
import { ScOption } from "@repo/components/ScOption"
import { ScButton } from "@repo/components/ScButton"
import { ScTag } from "@repo/components/ScTag"
import { ScEmpty } from "@repo/components/ScEmpty"
import { ScPagination } from "@repo/components/ScPagination"
import { ScDialog } from "@repo/components/ScDialog"
import {  } from "@repo/components/";
import { ScMessage, ScMessageBox } from "@repo/utils";
import { useWebSocket } from "./composables/useWebSocket";

// 消息类型定义
interface Message {
  id: string;
  title: string;
  content: string;
  type: "system" | "task" | "approval";
  isRead: boolean;
  createTime: string;
  sender?: string;
}

// 状态
const loading = ref(false);
const detailDialogVisible = ref(false);
const currentMessage = ref<Message | null>(null);
const filterType = ref("all");
const filterStatus = ref("all");

// 统计数据
const statistics = reactive({
  total: 0,
  unread: 0,
  system: 0,
  task: 0,
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 消息列表
const messageList = ref<Message[]>([]);

// WebSocket 连接
const { connect, disconnect, onMessage } = useWebSocket();

// 加载消息列表
const loadMessages = async () => {
  loading.value = true;
  try {
    // TODO: 调用后端接口获取消息列表
    // 模拟数据
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockMessages: Message[] = [
      {
        id: "1",
        title: "系统维护通知",
        content: "系统将于今晚 22:00-24:00 进行维护升级，期间可能无法访问，请提前做好准备。",
        type: "system",
        isRead: false,
        createTime: "2026-03-18 10:30:00",
        sender: "系统管理员",
      },
      {
        id: "2",
        title: "定时任务执行成功",
        content: "定时任务"数据同步任务"已成功执行，共处理 1,234 条数据。",
        type: "task",
        isRead: false,
        createTime: "2026-03-18 09:15:00",
      },
      {
        id: "3",
        title: "审批通知",
        content: "您有一条待审批的请假申请，请及时处理。",
        type: "approval",
        isRead: true,
        createTime: "2026-03-17 16:45:00",
        sender: "张三",
      },
      {
        id: "4",
        title: "定时任务执行失败",
        content: "定时任务"邮件发送任务"执行失败，错误信息：连接超时。",
        type: "task",
        isRead: true,
        createTime: "2026-03-17 14:20:00",
      },
      {
        id: "5",
        title: "系统更新通知",
        content: "系统已更新到 v2.1.0 版本，新增了多项功能，请查看更新日志。",
        type: "system",
        isRead: true,
        createTime: "2026-03-16 11:00:00",
        sender: "系统管理员",
      },
    ];

    // 应用筛选
    let filteredMessages = mockMessages;
    if (filterType.value !== "all") {
      filteredMessages = filteredMessages.filter((m) => m.type === filterType.value);
    }
    if (filterStatus.value === "unread") {
      filteredMessages = filteredMessages.filter((m) => !m.isRead);
    } else if (filterStatus.value === "read") {
      filteredMessages = filteredMessages.filter((m) => m.isRead);
    }

    messageList.value = filteredMessages;
    pagination.total = filteredMessages.length;

    // 更新统计数据
    statistics.total = mockMessages.length;
    statistics.unread = mockMessages.filter((m) => !m.isRead).length;
    statistics.system = mockMessages.filter((m) => m.type === "system").length;
    statistics.task = mockMessages.filter((m) => m.type === "task").length;
  } catch (error) {
    console.error("加载消息列表失败:", error);
    ScMessage.error("加载消息列表失败");
  } finally {
    loading.value = false;
  }
};

// 筛选
const handleFilter = () => {
  pagination.page = 1;
  loadMessages();
};

// 按类型筛选
const filterByType = (type: string) => {
  if (type === "all") {
    filterType.value = "all";
    filterStatus.value = "all";
  } else if (type === "unread") {
    filterStatus.value = "unread";
  } else {
    filterType.value = type;
    filterStatus.value = "all";
  }
  handleFilter();
};

// 刷新
const handleRefresh = () => {
  loadMessages();
};

// 点击消息
const handleMessageClick = (message: Message) => {
  currentMessage.value = message;
  detailDialogVisible.value = true;
  if (!message.isRead) {
    markAsRead(message);
  }
};

// 标记已读
const markAsRead = async (message: Message) => {
  try {
    // TODO: 调用后端接口标记已读
    message.isRead = true;
    statistics.unread = Math.max(0, statistics.unread - 1);
    ScMessage.success("已标记为已读");
  } catch (error) {
    console.error("标记已读失败:", error);
    ScMessage.error("标记已读失败");
  }
};

// 标记已读并关闭
const markAsReadAndClose = () => {
  if (currentMessage.value) {
    markAsRead(currentMessage.value);
  }
  detailDialogVisible.value = false;
};

// 全部已读
const markAllAsRead = async () => {
  try {
    await ScMessageBox.confirm("确定要将所有消息标记为已读吗？", "确认操作", {
      type: "warning",
    });

    // TODO: 调用后端接口全部标记已读
    messageList.value.forEach((m) => (m.isRead = true));
    statistics.unread = 0;
    ScMessage.success("已全部标记为已读");
  } catch (error) {
    if (error !== "cancel") {
      console.error("标记已读失败:", error);
      ScMessage.error("标记已读失败");
    }
  }
};

// 删除消息
const deleteMessage = async (message: Message) => {
  try {
    await ScMessageBox.confirm(`确定要删除消息"${message.title}"吗？`, "删除确认", {
      type: "warning",
    });

    // TODO: 调用后端接口删除消息
    const index = messageList.value.findIndex((m) => m.id === message.id);
    if (index > -1) {
      messageList.value.splice(index, 1);
      statistics.total--;
      if (!message.isRead) {
        statistics.unread--;
      }
      if (message.type === "system") {
        statistics.system--;
      } else if (message.type === "task") {
        statistics.task--;
      }
    }

    ScMessage.success("删除成功");
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ScMessage.error("删除失败");
    }
  }
};

// 获取消息图标
const getMessageIcon = (type: string) => {
  const icons = {
    system: "ri:notification-line",
    task: "ri:task-line",
    approval: "ri:file-list-line",
  };
  return icons[type] || "ri:mail-line";
};

// 获取消息颜色
const getMessageColor = (type: string) => {
  const colors = {
    system: "#409eff",
    task: "#67c23a",
    approval: "#e6a23c",
  };
  return colors[type] || "#909399";
};

// 获取消息标签类型
const getMessageTagType = (type: string) => {
  const types = {
    system: "primary",
    task: "success",
    approval: "warning",
  };
  return types[type] || "info";
};

// 获取消息类型名称
const getMessageTypeName = (type: string) => {
  const names = {
    system: "系统通知",
    task: "任务通知",
    approval: "审批通知",
  };
  return names[type] || "其他";
};

// 格式化时间
const formatTime = (time: string) => {
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "刚刚";
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)} 分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)} 小时前`;
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)} 天前`;
  } else {
    return time;
  }
};

// WebSocket 消息处理
onMessage((data) => {
  console.log("收到新消息:", data);
  // 添加新消息到列表
  messageList.value.unshift(data);
  statistics.total++;
  statistics.unread++;
  if (data.type === "system") {
    statistics.system++;
  } else if (data.type === "task") {
    statistics.task++;
  }

  // 显示通知
  ScMessage.info(`收到新消息：${data.title}`);
});

// 生命周期
onMounted(() => {
  loadMessages();
  connect();
});

onUnmounted(() => {
  disconnect();
});
</script>

<style scoped lang="scss">
.message-center-container {
  padding: 20px;

  .stats-section {
    margin-bottom: 20px;

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: var(--el-fill-color-lighter);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;

      .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        color: #fff;
        border-radius: 12px;
      }

      .stat-content {
        flex: 1;

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          line-height: 1.2;
          color: var(--el-text-color-primary);
        }

        .stat-label {
          margin-top: 4px;
          font-size: 13px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .message-list-card {
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .card-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .message-list {
      min-height: 400px;

      .message-item {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 16px;
        margin-bottom: 12px;
        background: var(--el-fill-color-lighter);
        border-radius: 8px;
        border-left: 3px solid transparent;
        cursor: pointer;
        transition: all 0.3s ease;

        &.unread {
          background: var(--el-color-primary-light-9);
          border-left-color: var(--el-color-primary);

          .message-title {
            font-weight: 600;
          }
        }

        &:hover {
          box-shadow: var(--shadow-base);
        }

        .message-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: var(--el-fill-color);
          border-radius: 8px;
        }

        .message-content {
          flex: 1;
          min-width: 0;

          .message-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;

            .message-title {
              flex: 1;
              font-size: 15px;
              color: var(--el-text-color-primary);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .message-type-tag {
              flex-shrink: 0;
            }
          }

          .message-body {
            margin-bottom: 8px;
            font-size: 13px;
            line-height: 1.6;
            color: var(--el-text-color-regular);
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .message-footer {
            display: flex;
            align-items: center;
            gap: 16px;
            font-size: 12px;
            color: var(--el-text-color-secondary);

            .message-time,
            .message-sender {
              display: flex;
              align-items: center;
              gap: 4px;
            }
          }
        }

        .message-actions {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        &:hover .message-actions {
          opacity: 1;
        }
      }
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }

  .message-detail {
    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .detail-time {
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }

    .detail-content {
      padding: 16px 0;
      font-size: 14px;
      line-height: 1.8;
      color: var(--el-text-color-regular);
      white-space: pre-wrap;
    }

    .detail-footer {
      padding-top: 16px;
      margin-top: 16px;
      border-top: 1px solid var(--el-border-color-lighter);
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }
}

// 响应式适配
@media (max-width: 1200px) {
  .message-center-container {
    .stats-section {
      :deep(.el-col) {
        margin-bottom: 16px;
      }
    }
  }
}

@media (max-width: 768px) {
  .message-center-container {
    padding: 12px;

    .message-list-card {
      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;

        .header-actions {
          width: 100%;
          flex-wrap: wrap;
        }
      }

      .message-list {
        .message-item {
          .message-actions {
            opacity: 1;
          }
        }
      }
    }
  }
}
</style>
