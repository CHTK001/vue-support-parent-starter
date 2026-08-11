<!--
  ReConferenceRoom —— 视频会议容器
  设计风格：Vercel / Linear · 低饱和度 · 清晰标题栏 · 状态徽标
  样式约定：UnoCSS 主题别名 → Element Plus CSS 变量
-->
<template>
  <ReCard class="conference-room">
    <template #default>
      <div class="conference-head">
        <div class="conference-head__info">
          <div class="conference-head__kicker text-el-text-secondary">LiveKit Conference</div>
          <div class="conference-head__title-row">
            <div class="conference-head__title text-el-text-primary">{{ roomName }}</div>
            <ReTag size="small" effect="plain">{{ localRole === "host" ? "主持人" : "参与者" }}</ReTag>
            <ReTag size="small" effect="plain" type="info">{{ layoutModeLabel }}</ReTag>
          </div>
          <div class="conference-head__subtitle text-el-text-secondary">{{ layoutModeDescription }}</div>
        </div>
        <div
          class="conference-head__status"
          style="background: var(--el-fill-color-light); color: var(--el-text-color-secondary)"
        >
          <ReStateDot :state="connected ? 'connected' : 'disconnected'" />
          <span>{{ statusText }}</span>
        </div>
      </div>

      <div class="conference-main">
        <div
          v-if="!connected"
          class="conference-loading flex flex-1 flex-col items-center justify-center gap-2 text-el-text-secondary"
          aria-live="polite"
        >
          <el-icon :size="32" class="is-loading"><Loading /></el-icon>
          <p class="conference-loading__title m-0 mt-1 text-[14px] text-el-text-primary">正在进入会议</p>
          <p class="conference-loading__text m-0 text-[12px]">{{ loadingMessage }}</p>
        </div>
        <div v-else class="conference-surface">
          <div ref="surfaceRef" class="conference-mount"></div>
        </div>
      </div>
    </template>
  </ReCard>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { Loading } from "@element-plus/icons-vue";
import type { RemoteControlInstance } from "../composables/useRemoteControl";
import ReStateDot from "@repo/ui/re-state-dot";

const props = defineProps<{
  remote: RemoteControlInstance;
  sessionId?: string;
  roomName: string;
  localRole: "host" | "guest";
  layoutMode?: "official" | "fixed-host";
  loadingMessage?: string;
  token?: string;
  serverUrl?: string;
}>();

const surfaceRef = ref<HTMLDivElement | null>(null);
const connected = ref(false);
const layoutModeLabel = computed(() => (props.layoutMode === "fixed-host" ? "固定主持人" : "自由会议"));
const layoutModeDescription = computed(() =>
  props.layoutMode === "fixed-host"
    ? "固定主持人会议室 · 右侧主持人 / 左侧参与人画面"
    : "官方 SFU 会议室 · 屏幕共享 / 多人协作",
);
const statusText = computed(() => (connected.value ? "已连接" : "未连接"));

onUnmounted(() => {
  if (surfaceRef.value) surfaceRef.value.innerHTML = "";
});
</script>

<style scoped>
.conference-room {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.conference-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.conference-head__kicker {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}

.conference-head__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.conference-head__title {
  font-size: 18px;
  font-weight: 600;
}

.conference-head__subtitle {
  font-size: 12px;
  margin-top: 4px;
}

.conference-head__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
}

.conference-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.conference-surface {
  flex: 1;
  background: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}

.conference-mount {
  width: 100%;
  height: 100%;
}
</style>
