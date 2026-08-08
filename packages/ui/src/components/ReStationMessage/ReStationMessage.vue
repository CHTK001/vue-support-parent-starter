<script setup lang="ts">
/**
 * 站内消息徽标组件（ReStationMessage）
 *
 * 基于 @repo/pinia 的 useMessageStore 管理站内消息（列表 / 未读数 / 已读游标）。
 * 数据来源：
 *   - HTTP：初始化时经 createApp 注入的 stationMessageAdapter 拉取分页历史 / 未读 / 已读
 *   - Socket：bindStationMessageSocket 将实时推送写入 store
 * 不注入 adapter 时（后端接口未就绪）静默降级为仅实时推送。
 */
import { ref, watch, onMounted } from "vue";
import { ElNotification, ElMessage } from "element-plus";
import { Bell, Refresh } from "@element-plus/icons-vue";
import { storeToRefs } from "pinia";
import { useMessageStore } from "@repo/pinia";
import { getStationMessageAdapter } from "@repo/core";

const props = withDefaults(
  defineProps<{
    /** 弹出层标题 */
    title?: string;
    /** 弹出层宽度（px） */
    width?: number;
  }>(),
  {
    title: "站内消息",
    width: 340,
  },
);

const messageStore = useMessageStore();
const { messages, unread, latest } = storeToRefs(messageStore);

const loading = ref(false);
const popoverVisible = ref(false);
/** 标记是否已加载过历史（避免每次打开面板都重新请求） */
const historyLoaded = ref(false);

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

onMounted(() => {
  // 存在 adapter 且未初始化时：拉取历史 + 刷新未读
  if (getStationMessageAdapter() && !messageStore.initialized) {
    void loadMessages();
  }
});

/** 拉取历史 + 刷新未读 */
async function loadMessages(force = false) {
  if (!getStationMessageAdapter()) {
    return;
  }
  // 非强制刷新时：已加载过则跳过，避免每次打开面板都转圈
  if (!force && historyLoaded.value) {
    return;
  }
  loading.value = true;
  try {
    await Promise.all([messageStore.loadHistory(), messageStore.refreshUnread()]);
    historyLoaded.value = true;
  } finally {
    loading.value = false;
  }
}

/** 面板显示时：仅首次加载历史与未读（后续靠手动同步按钮 / Socket） */
async function handleShow() {
  if (!getStationMessageAdapter()) {
    return;
  }
  await loadMessages();
}

/** 手动同步按钮：强制重新拉取历史与未读 */
async function handleSync() {
  await loadMessages(true);
  ElMessage.success("已同步");
}

/** 全部已读 */
async function handleMarkAllRead() {
  await messageStore.markAllRead();
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
    @show="handleShow"
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
        >
          <el-icon :size="18"><Bell /></el-icon>
        </div>
      </el-badge>
    </template>

    <div class="re-station-message-panel">
      <div class="re-station-message-panel__header">
        <span class="re-station-message-panel__title">{{ title }}</span>
        <div class="re-station-message-panel__actions">
          <el-button
            v-if="getStationMessageAdapter()"
            link
            type="primary"
            size="small"
            :loading="loading"
            @click="handleSync"
          >
            <el-icon :size="14"><Refresh /></el-icon>
          </el-button>
          <el-button
            v-if="getStationMessageAdapter() && unread > 0"
            link
            type="primary"
            size="small"
            @click="handleMarkAllRead"
          >
            全部已读
          </el-button>
        </div>
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

  &__actions {
    display: flex;
    align-items: center;
    gap: 4px;
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
