<!--
  ConferenceRoom —— 视频会议容器
  现代化 UI：低饱和度、清晰标题栏、状态徽标、参与者列表
  LiveKit 实际挂载（@livekit/components-react）由 LiveKitOfficialConference 提供，
  此处仅作为承载与状态管理。
-->
<template>
  <ReCard class="conference-room">
    <template #default>
      <div class="conference-head">
        <div class="conference-head__info">
          <div class="conference-head__kicker">LiveKit Conference</div>
          <div class="conference-head__title-row">
            <div class="conference-head__title">{{ roomName }}</div>
            <ReTag size="small" effect="plain">{{ localRole === "host" ? "主持人" : "参与者" }}</ReTag>
            <ReTag size="small" effect="plain" type="info">{{ layoutModeLabel }}</ReTag>
          </div>
          <div class="conference-head__subtitle">{{ layoutModeDescription }}</div>
        </div>
        <div class="conference-head__status">
          <span class="status-dot" :class="{ 'is-connected': connected }" />
          <span>{{ statusText }}</span>
        </div>
      </div>

      <div class="conference-main">
        <div v-if="!connected" class="conference-loading">
          <el-icon :size="32" class="is-loading"><Loading /></el-icon>
          <p class="conference-loading__title">正在进入会议</p>
          <p class="conference-loading__text">{{ loadingMessage }}</p>
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

const props = defineProps<{
  remote: RemoteControlInstance;
  sessionId?: string;
  roomName: string;
  localRole: "host" | "guest";
  layoutMode?: "official" | "fixed-host";
  loadingMessage?: string;
  /** LiveKit token */
  token?: string;
  /** LiveKit server URL (wss://...) */
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
  // 卸载 LiveKit React 树（如已挂载）
  if (surfaceRef.value) surfaceRef.value.innerHTML = "";
});
</script>

<style scoped lang="scss">
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
  color: var(--el-text-color-secondary);
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
  color: var(--el-text-color-primary);
}

.conference-head__subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.conference-head__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--el-fill-color-light);
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);

  &.is-connected {
    background: var(--el-color-success);
    box-shadow: 0 0 0 4px var(--el-color-success-light-9);
  }
}

.conference-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.conference-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 8px;
  color: var(--el-text-color-secondary);

  &__title {
    margin: 4px 0 0;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }

  &__text {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
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