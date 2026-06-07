<template>
  <el-container class="conference-room">
    <el-header class="conference-header">
      <div class="conference-title-block">
        <div class="conference-kicker">LiveKit Conference</div>
        <div class="conference-title-row">
          <div class="conference-title">{{ roomName }}</div>
          <el-tag size="small" effect="plain">{{ localRole === 'host' ? '主持人' : '参与者' }}</el-tag>
        </div>
        <div class="conference-subtitle">官方 SFU 会议室 · 屏幕共享 / 多人协作</div>
      </div>
      <div class="conference-status-card">
        <span class="status-dot" :class="{ 'is-connected': connected }" />
        <span>{{ statusText }}</span>
      </div>
    </el-header>

    <el-main class="conference-main">
      <div class="conference-surface">
        <div v-if="!conferenceConfig" class="conference-loading">
          <el-card class="loading-card shadow-sm rounded-xl">
            <div class="loading-spinner" />
            <p class="loading-title">正在进入会议</p>
            <p class="loading-text">{{ loadingMessage }}</p>
          </el-card>
        </div>
        <div v-show="conferenceConfig" ref="officialRootRef" class="official-conference-root" />
      </div>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  mountLiveKitOfficialConference,
  type LiveKitOfficialConferenceHandle,
} from "./LiveKitOfficialConference";

const props = defineProps<{
  sessionId: string;
  connectionState: string;
  inviteMode?: "host" | "guest";
}>();

const emit = defineEmits<{
  disconnectRequest: [sessionId: string];
}>();

type ConferenceConfig = {
  serverUrl: string;
  token: string;
};

const officialRootRef = ref<HTMLElement | null>(null);
const officialHandle = ref<LiveKitOfficialConferenceHandle | null>(null);
const conferenceConfig = ref<ConferenceConfig | null>(null);
const roomName = ref("会议室");
const localRole = ref<"host" | "guest">(props.inviteMode || "guest");
const loadingMessage = ref("正在等待会议信令...");
const connected = ref(false);
const disconnectedByComponent = ref(false);

const statusText = computed(() => {
  if (connected.value) return "已连接";
  if (conferenceConfig.value) return "连接中";
  return props.connectionState === "connected" ? "等待 LiveKit" : "等待网关";
});

function handleWebRTCSignal(sid: string, msg: any) {
  if (sid !== props.sessionId || msg.type !== "livekit_info") return;
  conferenceConfig.value = {
    serverUrl: resolveLiveKitServer(msg.server),
    token: msg.token,
  };
  roomName.value = msg.room || "会议室";
  localRole.value = props.inviteMode || (msg.mode === "host" ? "host" : "guest");
  loadingMessage.value = "正在连接 LiveKit 官方会议组件...";
  void mountOfficialConference();
}

function resolveLiveKitServer(server: string) {
  try {
    const url = new URL(server);
    if (url.pathname === "/livekit") return url.toString();
  } catch {}

  const params = new URLSearchParams(window.location.search);
  const gateway = params.get("gateway") || params.get("gw");
  if (gateway) return `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${gateway}/livekit`;
  return `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/livekit`;
}

async function mountOfficialConference() {
  await nextTick();
  if (!officialRootRef.value || !conferenceConfig.value || officialHandle.value) return;

  officialHandle.value = mountLiveKitOfficialConference(officialRootRef.value, {
    serverUrl: conferenceConfig.value.serverUrl,
    token: conferenceConfig.value.token,
    role: localRole.value,
    onConnected() {
      connected.value = true;
    },
    onDisconnected() {
      connected.value = false;
      if (disconnectedByComponent.value) return;
      disconnectedByComponent.value = true;
      emit("disconnectRequest", props.sessionId);
    },
    onError(error) {
      ElMessage.error(`LiveKit 会议连接失败: ${error.message}`);
    },
  });
}

function cleanupConference() {
  disconnectedByComponent.value = true;
  officialHandle.value?.unmount();
  officialHandle.value = null;
  connected.value = false;
}

defineExpose({ handleWebRTCSignal });

onUnmounted(cleanupConference);
</script>

<style scoped>
.conference-room {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 640px;
  background: var(--el-bg-color-page);
}

.conference-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 72px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.conference-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.conference-kicker {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.conference-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.conference-title {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 650;
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conference-subtitle {
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conference-status-card {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-round);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  font-size: 13px;
  box-shadow: var(--el-box-shadow-lighter);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--el-border-radius-circle);
  background: var(--el-color-warning);
}

.status-dot.is-connected {
  background: var(--el-color-success);
}

.conference-main {
  flex: 1;
  min-height: 0;
  padding: 16px;
  background: var(--el-bg-color-page);
}

.conference-surface {
  overflow: hidden;
  height: 100%;
  min-height: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.conference-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 16px;
}

.loading-card {
  width: 320px;
  border-color: var(--el-border-color-lighter);
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 3px solid var(--el-border-color-lighter);
  border-top-color: var(--el-color-primary);
  border-radius: var(--el-border-radius-circle);
  animation: spin 0.8s linear infinite;
}

.loading-title {
  margin: 0 0 8px;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.loading-text {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.official-conference-root {
  height: 100%;
  min-height: 0;
  background: var(--el-bg-color);
}

.official-conference-root :deep(.conference-livekit-room),
.official-conference-root :deep(.conference-livekit-video-conference),
.official-conference-root :deep(.lk-room-container) {
  height: 100%;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.official-conference-root :deep(.lk-video-conference) {
  gap: 12px;
  padding: 14px;
  background: var(--el-bg-color);
}

.official-conference-root :deep(.lk-video-conference-inner) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.official-conference-root :deep(.lk-grid-layout-wrapper),
.official-conference-root :deep(.lk-focus-layout-wrapper) {
  flex: 1 1 auto;
  min-height: 0;
}

.official-conference-root :deep(.lk-grid-layout),
.official-conference-root :deep(.lk-focus-layout) {
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.official-conference-root :deep(.lk-participant-tile) {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-fill-color-light);
  box-shadow: var(--el-box-shadow-lighter);
}

.official-conference-root :deep(.lk-participant-tile::after) {
  background: transparent;
}

.official-conference-root :deep(.lk-participant-placeholder) {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
}

.official-conference-root :deep(.lk-participant-placeholder svg) {
  width: min(28%, 180px);
  height: auto;
  opacity: 0.38;
}

.official-conference-root :deep(.lk-participant-metadata) {
  right: 14px;
  bottom: 14px;
  left: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.official-conference-root :deep(.lk-participant-metadata-item) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: min(280px, calc(100% - 48px));
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-round);
  background: var(--el-bg-color-overlay);
  color: var(--el-text-color-primary);
  box-shadow: var(--el-box-shadow-lighter);
}

.official-conference-root :deep(.lk-participant-name) {
  overflow: hidden;
  max-width: 210px;
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.official-conference-root :deep(.lk-track-muted-indicator-microphone) {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

.official-conference-root :deep(.lk-connection-quality) {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  min-width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-round);
  background: var(--el-bg-color-overlay);
  color: var(--el-text-color-secondary);
  box-shadow: var(--el-box-shadow-lighter);
}

.official-conference-root :deep(.lk-control-bar) {
  gap: 8px;
  margin: 0 auto;
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
}

.official-conference-root :deep(.lk-button),
.official-conference-root :deep(.lk-device-menu button) {
  min-height: 36px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-primary);
  box-shadow: none;
  transition: border-color 0.16s ease, background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

.official-conference-root :deep(.lk-button:hover),
.official-conference-root :deep(.lk-device-menu button:hover) {
  border-color: var(--el-border-color);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  box-shadow: var(--el-box-shadow-lighter);
}

.official-conference-root :deep(.lk-button[aria-pressed='true']),
.official-conference-root :deep(.lk-button.lk-active) {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.official-conference-root :deep(.lk-disconnect-button) {
  border-color: var(--el-color-danger-light-7);
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.official-conference-root :deep(.lk-disconnect-button:hover) {
  border-color: var(--el-color-danger-light-5);
  background: var(--el-color-danger-light-8);
  color: var(--el-color-danger);
}

.official-conference-root :deep(.lk-button-group) {
  gap: 6px;
}

.official-conference-root :deep(.lk-device-menu) {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
}

.official-conference-root :deep(.lk-chat) {
  overflow: hidden;
  border-left: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.official-conference-root :deep(.lk-chat-header),
.official-conference-root :deep(.lk-chat-form) {
  border-color: var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay);
}

.official-conference-root :deep(.lk-chat-entry) {
  border-radius: 12px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.official-conference-root :deep(.lk-chat-form-input) {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-primary);
}

.official-conference-root :deep(.lk-pagination-control) {
  gap: 8px;
}

.official-conference-root :deep(.lk-pagination-control button) {
  border-radius: 10px;
}

.official-conference-root :deep(.conference-custom-layout) {
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: 14px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.official-conference-root :deep(.conference-custom-main) {
  display: grid;
  grid-template-columns: minmax(260px, 34%) minmax(0, 1fr);
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
}

.official-conference-root :deep(.conference-custom-layout.is-left-collapsed .conference-custom-main) {
  grid-template-columns: 52px minmax(0, 1fr);
}

.official-conference-root :deep(.conference-share-panel),
.official-conference-root :deep(.conference-host-panel) {
  overflow: hidden;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-lighter);
}

.official-conference-root :deep(.conference-share-panel) {
  display: flex;
  flex-direction: column;
}

.official-conference-root :deep(.conference-panel-header),
.official-conference-root :deep(.conference-host-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 58px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.official-conference-root :deep(.conference-custom-layout.is-left-collapsed .conference-panel-header) {
  justify-content: center;
  padding: 12px 8px;
}

.official-conference-root :deep(.conference-panel-title-block) {
  min-width: 0;
}

.official-conference-root :deep(.conference-panel-title),
.official-conference-root :deep(.conference-host-name) {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.official-conference-root :deep(.conference-panel-subtitle),
.official-conference-root :deep(.conference-host-kicker),
.official-conference-root :deep(.conference-name-label) {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.official-conference-root :deep(.conference-share-body),
.official-conference-root :deep(.conference-host-stage) {
  min-height: 0;
  padding: 12px;
}

.official-conference-root :deep(.conference-share-body) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
}

.official-conference-root :deep(.conference-host-panel) {
  display: flex;
  flex-direction: column;
}

.official-conference-root :deep(.conference-host-header > div:first-child) {
  min-width: 0;
}

.official-conference-root :deep(.conference-host-stage) {
  display: flex;
  flex: 1 1 auto;
}

.official-conference-root :deep(.conference-host-tile),
.official-conference-root :deep(.conference-share-tile) {
  overflow: hidden;
  width: 100%;
  min-height: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-fill-color-light);
  box-shadow: none;
}

.official-conference-root :deep(.conference-host-tile) {
  flex: 1 1 auto;
}

.official-conference-root :deep(.conference-share-tile) {
  flex: 0 0 220px;
}

.official-conference-root :deep(.conference-empty-panel) {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
  min-height: 160px;
  border: 1px dashed var(--el-border-color);
  border-radius: 14px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
}

.official-conference-root :deep(.conference-empty-icon) {
  width: 42px;
  height: 42px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-circle);
  background: var(--el-bg-color-overlay);
}

.official-conference-root :deep(.conference-empty-title) {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.official-conference-root :deep(.conference-name-editor) {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
}

.official-conference-root :deep(.conference-name-input) {
  width: 150px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  outline: none;
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-primary);
  font-size: 13px;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.official-conference-root :deep(.conference-name-input:focus) {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.official-conference-root :deep(.conference-custom-controls) {
  display: inline-flex;
  align-items: center;
  align-self: center;
  gap: 8px;
  min-height: 52px;
  padding: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
}

.official-conference-root :deep(.conference-control-group) {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-fill-color-blank);
}

.official-conference-root :deep(.conference-icon-button),
.official-conference-root :deep(.conference-device-button),
.official-conference-root :deep(.conference-collapse-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  min-width: 38px;
  height: 38px;
  min-height: 38px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: var(--el-text-color-primary);
  cursor: pointer;
  box-shadow: none;
  transition: border-color 0.16s ease, background-color 0.16s ease, color 0.16s ease;
}

.official-conference-root :deep(.conference-icon-button:hover),
.official-conference-root :deep(.conference-device-button:hover),
.official-conference-root :deep(.conference-collapse-button:hover) {
  border-color: var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.official-conference-root :deep(.conference-icon-button[aria-pressed='true']),
.official-conference-root :deep(.conference-icon-button.lk-active) {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.official-conference-root :deep(.conference-leave-button) {
  border-color: var(--el-color-danger-light-7);
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.official-conference-root :deep(.conference-leave-button:hover) {
  border-color: var(--el-color-danger-light-5);
  background: var(--el-color-danger-light-8);
  color: var(--el-color-danger);
}

.official-conference-root :deep(.conference-icon-button svg),
.official-conference-root :deep(.conference-device-button svg),
.official-conference-root :deep(.conference-collapse-button svg) {
  width: 18px;
  height: 18px;
}

.official-conference-root :deep(.conference-device-button) {
  width: 24px;
  min-width: 24px;
  margin-left: -4px;
  border-radius: 10px;
}

.official-conference-root :deep(.conference-device-chevron) {
  width: 13px;
  height: 13px;
}

.official-conference-root :deep(.conference-collapse-icon) {
  transform: rotate(180deg);
  transition: transform 0.16s ease;
}

.official-conference-root :deep(.conference-custom-layout.is-left-collapsed .conference-collapse-icon) {
  transform: rotate(0deg);
}

.official-conference-root :deep(.conference-icon-button .lk-button-text),
.official-conference-root :deep(.conference-icon-button span:not(.lk-icon)),
.official-conference-root :deep(.conference-device-button .lk-button-text),
.official-conference-root :deep(.conference-device-button span:not(.lk-icon)) {
  display: none;
}

@media (max-width: 768px) {
  .conference-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .conference-status-card {
    align-self: stretch;
    justify-content: center;
  }

  .conference-main {
    padding: 10px;
  }

  .conference-surface {
    border-radius: 14px;
  }

  .official-conference-root :deep(.lk-video-conference) {
    padding: 10px;
  }

  .official-conference-root :deep(.lk-control-bar) {
    width: 100%;
    justify-content: center;
    overflow-x: auto;
  }

  .official-conference-root :deep(.conference-custom-layout) {
    padding: 10px;
  }

  .official-conference-root :deep(.conference-custom-main),
  .official-conference-root :deep(.conference-custom-layout.is-left-collapsed .conference-custom-main) {
    grid-template-columns: 1fr;
  }

  .official-conference-root :deep(.conference-custom-layout.is-left-collapsed .conference-share-panel) {
    min-height: 58px;
  }

  .official-conference-root :deep(.conference-host-header) {
    align-items: flex-start;
    flex-direction: column;
  }

  .official-conference-root :deep(.conference-name-editor) {
    width: 100%;
  }

  .official-conference-root :deep(.conference-name-input) {
    flex: 1;
    width: auto;
  }

  .official-conference-root :deep(.conference-custom-controls) {
    width: 100%;
    justify-content: center;
    overflow-x: auto;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
