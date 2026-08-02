<script setup lang="ts">
/**
 * 站内消息徽标组件（ReStationMessage）
 *
 * 订阅全局 Socket 的 message/push 推送，以徽标展示未读站内消息数量，
 * 点击弹出最近消息列表。基于 @repo/core 的 useStationMessage 复用。
 */
import { ref, watch } from "vue";
import { ElMessage, ElNotification } from "element-plus";
import { Bell } from "@element-plus/icons-vue";
import { useStationMessage } from "@repo/core";

const { messages, latest } = useStationMessage();

const dialogVisible = ref(false);

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
</script>

<template>
  <el-badge :value="messages.length" :hidden="messages.length === 0" :max="99">
    <el-button :icon="Bell" circle @click="dialogVisible = true" />
  </el-badge>

  <el-dialog v-model="dialogVisible" title="站内消息" width="520px">
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
    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>
