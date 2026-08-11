<!--
  Remote Control 主页 —— 远程控制中心
  左侧：连接设置面板；右侧：根据 activeSession 的协议渲染 SSH/桌面/会议视图
  设计风格：Vercel / Linear · 低饱和度 · 卡片栅格 · 极简
-->
<template>
  <div class="remote-page">
    <div class="remote-grid">
      <ReCard class="remote-sidebar">
        <div class="sidebar-head">
          <div class="sidebar-title" style="color: var(--el-text-color-primary)">远程控制</div>
          <div class="sidebar-desc" style="color: var(--el-text-color-secondary)">管理 SSH/桌面/会议会话</div>
        </div>
        <ReConnectionSettings :remote="remote" :on-connected="onSessionConnected" />
        <div v-if="sessions.length > 0" class="sessions-list">
          <div class="sessions-list__title" style="color: var(--el-text-color-secondary)">
            活跃会话（{{ sessions.length }}）
          </div>
          <div
            v-for="s in sessions"
            :key="s.sessionId"
            class="sessions-list__item"
            :class="{ active: s.sessionId === remote.activeSessionId.value }"
            @click="setActive(s.sessionId)"
          >
            <el-icon><Monitor /></el-icon>
            <div class="sessions-list__info">
              <div class="sessions-list__id" style="color: var(--el-text-color-primary)">
                {{ s.targetId || s.sessionId.slice(0, 8) }}
              </div>
              <ReTag size="small" :type="stateTagType(s.state)" effect="plain">{{ s.protocol }}</ReTag>
            </div>
          </div>
        </div>
      </ReCard>

      <ReCard class="remote-main">
        <div class="main-head">
          <div class="main-head__left">
            <div class="main-head__title" style="color: var(--el-text-color-primary)">{{ activeTitle }}</div>
            <div class="main-head__desc" style="color: var(--el-text-color-secondary)">{{ activeDesc }}</div>
          </div>
          <div class="main-head__right">
            <ReTag :type="connectionTagType">{{ connectionTagText }}</ReTag>
          </div>
        </div>

        <div class="main-body">
          <!-- SSH：终端 + 文件 -->
          <div v-if="activeProtocol === 'SSH'" class="ssh-workspace">
            <ReSshTerminal
              ref="sshTerminalRef"
              :remote="remote"
              @disconnect="onDisconnect"
            />
          </div>

          <!-- 桌面 -->
          <ReDesktopViewer
            v-else-if="activeProtocol === 'DESKTOP'"
            :remote="remote"
            @disconnect="onDisconnect"
          />

          <!-- 会议 -->
          <ReConferenceRoom
            v-else-if="activeProtocol === 'CONFERENCE'"
            :remote="remote"
            :room-name="conferenceRoomName"
            :local-role="conferenceRole"
            :layout-mode="conferenceLayout"
          />

          <!-- AUTO / 未连接 -->
          <div
            v-else
            class="empty-state flex w-full flex-col items-center justify-center gap-2 px-10 py-10"
            style="color: var(--el-text-color-secondary)"
          >
            <el-icon :size="48"><Connection /></el-icon>
            <p class="m-1 mt-1 text-[14px]" style="color: var(--el-text-color-primary)">请在左侧选择协议并发起连接</p>
            <span class="text-[12px]" style="color: var(--el-text-color-placeholder)">
              支持 SSH 终端 / 桌面远程 / 视频会议
            </span>
          </div>
        </div>
      </ReCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Monitor, Connection } from "@element-plus/icons-vue";
import ReConnectionSettings from "../../components/ReConnectionSettings.vue";
import ReSshTerminal from "../../components/ReSshTerminal.vue";
import ReDesktopViewer from "../../components/ReDesktopViewer.vue";
import ReConferenceRoom from "../../components/ReConferenceRoom.vue";
import { useRemoteControl, type ConnectionState, type RemoteSession } from "../../composables/useRemoteControl";

const remote = useRemoteControl();

const sshTerminalRef = ref<InstanceType<typeof ReSshTerminal> | null>(null);

const sessions = computed<RemoteSession[]>(() => Array.from(remote.sessions.values()));
const activeSession = computed(() => {
  const sid = remote.activeSessionId.value;
  return sid ? remote.sessions.get(sid) : null;
});

const activeProtocol = computed(() => activeSession.value?.protocol || "");
const activeTitle = computed(() => {
  switch (activeProtocol.value) {
    case "SSH":
      return "SSH 终端";
    case "DESKTOP":
      return "桌面远程";
    case "CONFERENCE":
      return "视频会议";
    default:
      return "未连接";
  }
});
const activeDesc = computed(() => activeSession.value?.targetId || "暂无活跃会话");

const conferenceRoomName = ref("");
const conferenceRole = ref<"host" | "guest">("host");
const conferenceLayout = ref<"official" | "fixed-host">("official");

const connectionTagText = computed(() => {
  const state: ConnectionState = remote.connectionState.value;
  return state === "connected" ? "已连接" : state === "connecting" ? "连接中" : state === "error" ? "错误" : "未连接";
});
const connectionTagType = computed<"info" | "warning" | "success" | "danger">(() => {
  const state: ConnectionState = remote.connectionState.value;
  if (state === "connected") return "success";
  if (state === "connecting") return "warning";
  if (state === "error") return "danger";
  return "info";
});

function stateTagType(state: ConnectionState): "info" | "warning" | "success" | "danger" {
  if (state === "connected") return "success";
  if (state === "connecting") return "warning";
  if (state === "error") return "danger";
  return "info";
}

function setActive(sid: string) {
  (remote.activeSessionId as { value: string | null }).value = sid;
}

function onSessionConnected(_sid: string) {
  const session = activeSession.value;
  if (session?.protocol === "CONFERENCE") {
    conferenceRoomName.value = session.targetId || "未命名会议室";
  }
}

function onDisconnect() {
  // useRemoteControl 内部已经清理了 sessions
}
</script>

<style scoped>
.remote-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.remote-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  min-height: calc(100vh - 200px);
}

.remote-sidebar {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
}

.sidebar-desc {
  font-size: 12px;
  margin-top: 2px;
}

.sessions-list {
  border-top: 1px dashed var(--el-border-color-lighter);
  padding-top: 12px;
}

.sessions-list__title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.sessions-list__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--el-border-radius-small);
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 4px;
}

.sessions-list__item:hover {
  background: var(--el-fill-color-light);
}

.sessions-list__item.active {
  background: var(--el-color-primary-light-9);
}

.sessions-list__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sessions-list__id {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--el-font-family-monospace, ui-monospace, SFMono-Regular, Menlo, monospace);
}

.remote-main {
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.main-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.main-head__title {
  font-size: 16px;
  font-weight: 600;
}

.main-head__desc {
  font-size: 12px;
  margin-top: 2px;
}

.main-body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.ssh-workspace {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 360px;
  gap: 12px;
}
</style>
