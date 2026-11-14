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
import { computed, ref, watch, onMounted } from "vue";
import { ElNotification, ElMessageBox } from "element-plus";
import { Bell, Refresh } from "@element-plus/icons-vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useMessageStore } from "@repo/pinia";
import { getConfig } from "@repo/config";
import {getStationMessageAdapter, message} from "@repo/core";
/** 顶栏动画图标（index.ts 默认导出即 defineAsyncComponent 结果，可直接当组件用） */
import ReIcon from "../ReIcon";

const props = withDefaults(
  defineProps<{
    /** 弹出层标题 */
    title?: string;
    /** 弹出层宽度（px） */
    width?: number;
    /**
     * 渲染形态：
     *  - toolbar（默认）：顶栏铃铛，由 Header 条目表挂载
     *  - floating：右下角浮球，由布局层在 `message.position=right-bottom` 时挂载
     */
    mode?: "toolbar" | "floating";
  }>(),
  {
    title: "站内消息",
    width: 340,
    mode: "toolbar",
  },
);

/** 是否右下角浮窗形态（弹出层向上展开、触发器固定在视口右下） */
const isFloating = computed(() => props.mode === "floating");
/** 弹出层展开方向：浮窗向上，顶栏向下 */
const popoverPlacement = computed(() => (isFloating.value ? "top-end" : "bottom-end"));
/** 徽标数量上限（app.yaml `message.maxUnread`，默认 99，超出显示 `99+`） */
const badgeMax = computed(() => {
  const max = getConfig().message?.maxUnread;
  return typeof max === "number" && max > 0 ? max : 99;
});

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
  message.success("已同步");
}

/** 全部已读 */
async function handleMarkAllRead() {
  await messageStore.markAllRead();
  message.success("已全部标记为已读");
}

/** 判断消息是否未读：后端字段 readStatus（0 未读 / 1 已读），兼容 isRead */
function isUnread(message: unknown): boolean {
  const msg = (message ?? {}) as { readStatus?: number; isRead?: boolean };
  if (typeof msg.readStatus === "number") {
    return msg.readStatus !== 1;
  }
  return msg.isRead !== true;
}

const router = useRouter();

/** 点击消息项：标记该消息（及更早）已读；有跳转链接则路由跳转，否则弹出完整详情 */
async function handleItemClick(msg: {
  id?: number | string;
  subject?: string;
  content?: string;
  sendTime?: string;
  url?: string;
}) {
  if (msg.id !== undefined) {
    await messageStore.markAllRead(msg.id);
  }
  if (msg.url && msg.url.trim()) {
    popoverVisible.value = false;
    let target = msg.url.trim();
    // 外部 http(s) 链接：新标签页打开
    if (/^https?:\/\//i.test(target)) {
      window.open(target, "_blank", "noopener");
      return;
    }
    // 兼容把部署前缀 /system 一并写入的情况：路由 base 已含 /system，需去掉，否则 404
    if (target.startsWith("/system/")) {
      target = target.slice("/system".length);
    }
    try {
      await router.push(target);
    } catch {
      // 非法/不可达路由时忽略，保留在当前页
    }
    return;
  }
  popoverVisible.value = false;
  await ElMessageBox.alert(
    msg.content || "暂无内容",
    msg.subject || "站内消息",
    { confirmButtonText: "关闭" },
  );
}
</script>

<template>
  <el-popover
    v-model:visible="popoverVisible"
    ref="popoverRef"
    :placement="popoverPlacement"
    :width="width"
    trigger="click"
    :show-arrow="false"
    :offset="10"
    popper-style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); padding: 0;"
    @show="handleShow"
  >
    <template #reference>
      <div :class="['re-station-message-trigger-wrap', { 'is-floating': isFloating }]">
        <el-badge
          :value="unread"
          :hidden="unread === 0"
          :max="badgeMax"
          class="re-station-message-badge"
        >
          <!-- 顶栏消息入口：icons-animated 动画铃铛（hover/focus 播放）。
               原先为 <el-icon><Bell/> + koi-scale-i 容器缩放；动画图标自带交互动效后
               不再叠加容器动画，避免「缩放 + 摆铃」两层动作互相打架。 -->
          <div
            :class="['re-station-message-trigger', { 're-station-message-trigger--floating': isFloating }]"
            :title="title"
            role="button"
            :aria-label="`${title}${unread > 0 ? `（${unread} 条未读）` : ''}`"
          >
            <ReIcon name="anim:heroicons:bell" :size="isFloating ? 22 : 18" />
          </div>
        </el-badge>
      </div>
    </template>

    <div class="re-station-message-panel">
      <div class="re-station-message-panel__header">
        <span class="re-station-message-panel__title">{{ title }}</span>
        <div class="re-station-message-panel__actions">
          <el-button
            link
            type="primary"

            :loading="loading"
            @click="handleSync"
          >
            <el-icon :size="14"><Refresh /></el-icon>
          </el-button>
          <el-button
            v-if="unread > 0"
            link
            type="primary"

            @click="handleMarkAllRead"
          >
            全部已读
          </el-button>
        </div>
      </div>

      <div v-loading="loading" class="re-station-message-panel__body">
        <div v-if="messages.length === 0" class="re-station-message-panel__empty">
          <div class="empty-icon">
            <el-icon :size="36"><Bell /></el-icon>
          </div>
          <div class="empty-text">暂无站内消息</div>
          <div v-if="!loading" class="empty-hint">点击右上"同步"按钮拉取最新消息</div>
        </div>
        <div v-else class="re-station-message-panel__list">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="re-station-message-item"
            :class="{ 're-station-message-item--unread': isUnread(msg) }"
            role="button"
            tabindex="0"
            @click="handleItemClick(msg)"
            @keydown.enter.prevent="handleItemClick(msg)"
          >
            <div class="re-station-message-item__row">
              <span class="re-station-message-item__subject">
                <span v-if="isUnread(msg)" class="unread-dot"></span>
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

      <div v-if="messages.length > 0" class="re-station-message-panel__footer">
        <el-button link type="primary" @click="handleMarkAllRead">
          {{ unread > 0 ? `${unread}条未读，标记全部已读` : "全部已读" }}
        </el-button>
      </div>
    </div>
  </el-popover>
</template>

<style lang="scss" scoped>
.re-station-message-trigger-wrap {
  display: inline-flex;
  align-items: center;

  /* 右下角浮窗形态：脱离顶栏，固定在视口右下 */
  &.is-floating {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 2000;
  }
}

/* 顶栏触发器：36px 方形，规格与其它顶栏图标按钮一致 */
.re-station-message-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--el-text-color-primary);
  transition: background-color 0.2s, box-shadow 0.2s;
  outline: none;

  &:hover,
  &:focus-visible {
    background: var(--el-header-icon-hover-bg-color, var(--el-fill-color-light));
  }

  /* 右下角浮球：44px 圆形主色按钮 */
  &--floating {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--el-color-primary);
    color: #fff;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);

    &:hover,
    &:focus-visible {
      background: var(--el-color-primary-light-3);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
    }
  }
}

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
    max-height: 360px;
    overflow-y: auto;
  }

  &__empty {
    padding: 40px 16px;
    text-align: center;
    color: var(--el-text-color-secondary);

    .empty-icon {
      display: flex;
      justify-content: center;
      color: var(--el-text-color-placeholder);
      margin-bottom: 10px;
    }

    .empty-text {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }

    .empty-hint {
      margin-top: 6px;
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }

  &__footer {
    padding: 10px 12px;
    border-top: 1px solid var(--el-border-color-lighter);
    text-align: center;
  }

  &__list {
    display: flex;
    flex-direction: column;
  }
}

.re-station-message-item {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  position: relative;
  cursor: pointer;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &--unread {
    background: var(--el-fill-color);

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--el-color-primary);
    }
  }

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
    display: flex;
    align-items: center;
    gap: 6px;
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

.unread-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
  flex-shrink: 0;
}
</style>
