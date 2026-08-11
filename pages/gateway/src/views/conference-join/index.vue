<!--
  Conference Join —— 加入会议（无需登录，从邀请链接进入）
  通过 URL 参数 ?room=xxx 携带会议室 ID，自动建立会议会话
  设计风格：Vercel / Linear · 低饱和度 · 居中卡片 · 极简
-->
<template>
  <ReCard class="conference-join">
    <div
      v-if="joining"
      class="join-loading flex flex-col items-center justify-center gap-3 py-20 text-el-text-secondary"
      role="status"
      aria-live="polite"
    >
      <el-icon :size="32" class="is-loading"><Loading /></el-icon>
      <p class="join-loading__title m-1 mt-1 text-[16px] text-el-text-primary">正在加入会议</p>
      <p class="join-loading__text m-0 text-[13px]">会议室：{{ roomId || "未指定" }}</p>
    </div>
    <div
      v-else-if="error"
      class="join-error flex flex-col items-center justify-center gap-3 py-20 text-el-text-secondary"
      role="alert"
    >
      <el-icon :size="32" class="text-el-danger"><CircleClose /></el-icon>
      <p class="join-error__title m-1 mt-1 text-[16px] text-el-text-primary">加入会议失败</p>
      <p class="join-error__text m-0 text-[13px]">{{ error }}</p>
      <el-button type="primary" @click="retry">重试</el-button>
    </div>
    <ReConferenceRoom
      v-else-if="connected"
      :remote="remote"
      :room-name="roomId || '未命名会议室'"
      local-role="guest"
      layout-mode="official"
    />
  </ReCard>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Loading, CircleClose } from "@element-plus/icons-vue";
import ReConferenceRoom from "../../components/ReConferenceRoom.vue";
import { useRemoteControl } from "../../composables/useRemoteControl";

const props = defineProps<{
  initialRoomId?: string;
}>();

const remote = useRemoteControl();

const roomId = ref(props.initialRoomId || new URLSearchParams(window.location.search).get("room") || "");
const joining = ref(false);
const connected = ref(false);
const error = ref<string | null>(null);

async function join() {
  if (!roomId.value) {
    error.value = "缺少会议室 ID，请通过 ?room=xxx 访问";
    return;
  }
  joining.value = true;
  error.value = null;
  try {
    const res = await remote.connectToTarget({
      gatewayUrl: localStorage.getItem("rc-gateway-url") || "ws://127.0.0.1:8182",
      protocol: "CONFERENCE",
      conference: {
        roomId: roomId.value,
        mode: "guest",
        layoutMode: "official",
      },
    });
    if (res.ok) {
      connected.value = true;
    } else {
      error.value = res.error || "未知错误";
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "网络异常";
  } finally {
    joining.value = false;
  }
}

function retry() {
  error.value = null;
  join();
}

onMounted(join);
</script>

<style scoped>
.conference-join {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
  min-height: 480px;
}

.join-loading__title,
.join-error__title {
  margin: 4px 0 0;
  font-size: 16px;
}

.join-loading__text,
.join-error__text {
  margin: 0;
  font-size: 13px;
}
</style>
