<script setup lang="ts">
/**
 * 站内消息徽标组件（ReStationMessage）
 *
 * 订阅全局 Socket 的 message/push 推送，以徽标展示未读站内消息数量，
 * 点击弹出最近消息列表。基于 @repo/core 的 useStationMessage 复用。
 *
 * 支持注入后端适配器（adapter）实现历史消息 / 未读数 / 已读游标：
 *   <ReStationMessage :adapter="stationMessageAdapter" />
 * 未注入时仅实时订阅 socket 推送，后端接口就绪后接入即可。
 */
import { ref, watch } from "vue";
import { ElNotification, ElMessage } from "element-plus";
import ReIcon from "@repo/ui/re-icon";
import { useStationMessage, type StationMessageAdapter } from "@repo/core";

const props = withDefaults(
  defineProps<{
    /** 站内消息后端适配器（可选，注入后启用历史/未读/已读） */
    adapter?: StationMessageAdapter;
    /** 弹出层标题 */
    title?: string;
    /** 弹出层宽度（px） */
    width?: number;
  }>(),
  {
    adapter: undefined,
    title: "站内消息",
    width: 340,
  },
);

const { messages, unread, latest, loadHistory, refreshUnread, markAllRead } =
  useStationMessage(props.adapter);

const loading = ref(false);
const popoverVisible = ref(false);

// 收到新消息时弹出提示（首条不计，避免重复）
let initialized = false;
watch(
  latest,
  (msg) => {
    if (!msg) {
      return;
    }
    if (!initialized) {
      initialized = true;
      return;
    }
    ElNotification({
      title: msg.subject || "站内消息",
      message: msg.content || "",
      type: "info",
      duration: 4000,
    });
  },
  { deep: false },
);

/** 打开面板：加载历史 + 刷新未读（注入 adapter 时） */
async function openPanel() {
  popoverVisible.value = true;
  if (!props.adapter) {
    return;
  }
  loading.value = true;
  try {
    await Promise.all([loadHistory(), refreshUnread()]);
  } finally {
    loading.value = false;
  }
}

/** 全部已读 */
async function handleMarkAllRead() {
  await markAllRead();
  ElMessage.success("已全部标记为已读");
}
</script>

<template>
  <el-popover
    v-model:visible="popoverVisible"
    placement="bottom-end"
    :width="width"
    trigger="click"
    :show-arrow="false"
    :offset="6"
    popper-style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); padding: 0;"
  >
    <template #reference>
      <el-badge
        :value="unread"
        :hidden="unread === 0"
        :max="99"
        class="re-station-message-badge"
      >
        <div
          class="re-station-message-trigger hover:bg-[--el-header-icon-hover-bg-color] koi-icon w-36px h-36px rounded-md flex flex-justify-center flex-items-center koi-scale-i"
          @click="openPanel"
        >
          <ReIcon name="koi-notification-badge-line" size="18" />
        </div>
      </el-badge>
    </template>

    <div class="re-station-message-panel">
      <div class="re-station-message-panel__header">
        <span class="re-station-message-panel__title">{{ title }}</span>
        <el-button
          v-if="adapter && unread > 0"
          link
          type="primary"
          size="small"
          @click="handleMarkAllRead"
        >
          全部已读
        </el-button>
      </div>

      <div v-loading="loading" class="re-station-message-panel__body">
        <div v-if="messages.length === 0" class="re-station-message-panel__empty">
          暂无站内消息
        </div>
        <div v-else class="re-station-message-panel__list">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="re-station-message-item"
          >
            <div class="re-station-message-item__row">
              <span class="re-station-message-item__subject">
                {{ msg.subject || "站内消息" }}
              </span>
              <span class="re-station-message-item__time">{{ msg.sendTime }}</span>
            </div>
            <div class="re-station-message-item__content">
              {{ msg.content }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-popover>
</template>

<style lang="scss" scoped>
.re-station-message-panel {
  padding: 6px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__body {
    max-height: 420px;
    overflow-y: auto;
  }

  &__empty {
    padding: 40px 0;
    text-align: center;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__list {
    display: flex;
    flex-direction: column;
  }
}

.re-station-message-item {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__subject {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__time {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__content {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-regular);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
</style>
