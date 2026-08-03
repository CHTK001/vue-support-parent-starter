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
import { Bell } from "@element-plus/icons-vue";
import { useStationMessage, type StationMessageAdapter } from "@repo/core";

const props = withDefaults(
  defineProps<{
    /** 站内消息后端适配器（可选，注入后启用历史/未读/已读） */
    adapter?: StationMessageAdapter;
    /** 弹出层标题 */
    title?: string;
  }>(),
  {
    adapter: undefined,
    title: "站内消息",
  },
);

const { messages, unread, latest, loadHistory, refreshUnread, markAllRead } =
  useStationMessage(props.adapter);

const dialogVisible = ref(false);
const loading = ref(false);

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

/** 打开弹窗：加载历史 + 刷新未读（注入 adapter 时） */
async function openDialog() {
  dialogVisible.value = true;
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
  <el-badge
    :value="unread"
    :hidden="unread === 0"
    :max="99"
    class="re-station-message-badge"
  >
    <el-button :icon="Bell" circle @click="openDialog" />
  </el-badge>

  <el-dialog v-model="dialogVisible" :title="title" width="520px">
    <div v-loading="loading" min-h="200px">
      <div v-if="messages.length === 0" class="py-10 text-center text-sm text-[--el-text-color-secondary]">
        暂无站内消息
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="rounded-xl border border-solid border-[--el-border-color-lighter] bg-[--el-bg-color] p-4"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-[--el-text-color-primary]">
              {{ msg.subject || "站内消息" }}
            </span>
            <span class="text-xs text-[--el-text-color-secondary]">{{ msg.sendTime }}</span>
          </div>
          <div class="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[--el-text-color-secondary]">
            {{ msg.content }}
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button v-if="adapter && unread > 0" type="primary" plain @click="handleMarkAllRead">
        全部已读
      </el-button>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>
