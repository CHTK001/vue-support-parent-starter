<template>
  <div class="remote-control-page">
    <!-- 左侧连接面板 -->
    <div class="sidebar">
      <ConnectionSettings
        :connection-state="connectionState"
        :sessions-list="sessionsList"
        :active-session-id="activeSessionId"
        @connect="handleConnect"
        @disconnect="handleDisconnect"
        @select-session="handleSelectSession"
        @disconnect-session="handleDisconnectSession"
      />
    </div>

    <!-- 右侧内容区 -->
    <div class="content">
      <!-- 标签栏 -->
      <div v-if="activeSessionId" class="tab-bar">
        <el-tag
          v-for="s in sessionsList"
          :key="s.sessionId"
          :type="s.sessionId === activeSessionId ? '' : 'info'"
          closable
          effect="dark"
          size="large"
          class="session-tab"
          @click="handleSelectSession(s.sessionId)"
          @close="handleDisconnectSession(s.sessionId)"
        >
          {{ s.protocol === 'SSH' ? 'SSH终端' : '桌面远程' }} — {{ s.sessionId.slice(0, 8) }}
        </el-tag>
      </div>

      <!-- SSH 终端 -->
      <SshTerminal
        v-if="activeSession && activeSession.protocol === 'SSH'"
        ref="sshTerminalRef"
        :session-id="activeSessionId"
        :connection-state="activeSession?.state || 'disconnected'"
        @input="handleTerminalInput"
        @resize="handleTerminalResize"
      />

      <!-- 桌面查看器 -->
      <DesktopViewer
        v-else-if="activeSession && activeSession.protocol === 'DESKTOP'"
        ref="desktopViewerRef"
        :session-id="activeSessionId"
        :connection-state="activeSession?.state || 'disconnected'"
        @mouse-event="handleMouseEvent"
        @key-event="handleKeyEvent"
        @desktop-control="handleDesktopControl"
      />

      <!-- 无会话 -->
      <div v-else class="empty-state">
        <el-icon :size="64"><Link /></el-icon>
        <h2>远程控制中心</h2>
        <p>在左侧选择协议、填写连接信息，点击"连接"发起远程控制</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, type Ref } from "vue";
import { Link } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import ConnectionSettings from "../../components/ConnectionSettings.vue";
import SshTerminal from "../../components/SshTerminal.vue";
import DesktopViewer from "../../components/DesktopViewer.vue";
import useRemoteControl from "../../composables/useRemoteControl";
import type { ConnectionSettings as ConnectionSettingsType, DesktopFrameEvent } from "../../composables/useRemoteControl";

// Refs
const sshTerminalRef = ref<InstanceType<typeof SshTerminal>>();
const desktopViewerRef = ref<InstanceType<typeof DesktopViewer>>();

// 远程控制 composable
const {
  connectionState,
  sessions,
  activeSessionId,
  connectToTarget,
  disconnectSession,
  disconnectGateway,
  sendInput,
  sendResize,
  sendMouseEvent,
  sendKeyEvent,
  sendDesktopControl,
  sendCapabilities,
} = useRemoteControl({
  onConnected(sid: string) {
    ElMessage.success("连接成功");
    console.log("[index] onConnected fired, sid:", sid);
    // 桌面远程协议：发送客户端能力声明
    const session = sessions.get(sid);
    console.log("[index] onConnected session:", session);
    if (session && session.protocol === "DESKTOP") {
      nextTick(() => {
        const viewer = desktopViewerRef.value;
        console.log("[index] nextTick viewer:", viewer, "container:", viewer?.viewerContainer);
        if (viewer?.viewerContainer) {
          const el = viewer.viewerContainer as HTMLElement;
          console.log("[index] sending capabilities", el.clientWidth, el.clientHeight);
          sendCapabilities(sid, el.clientWidth, el.clientHeight);
        } else {
          // 没有拿到 container 就用默认值
          console.log("[index] container not ready, sending defaults");
          sendCapabilities(sid, 1920, 1080);
        }
      });
    }
  },
  onTerminalOutput(sid: string, data: string) {
    // 转发到终端组件
    if (sid === activeSessionId.value && sshTerminalRef.value) {
      sshTerminalRef.value.writeToTerminal(data);
    }
  },
  onDesktopFrame(event: DesktopFrameEvent) {
    if (event.sessionId === activeSessionId.value && desktopViewerRef.value) {
      desktopViewerRef.value.renderH264Frame(event.data, event.width, event.height, event.keyFrame);
    }
  },
  onError(_sid: string, _msg: string) {
    // 连接错误由 handleConnect 统一展示，此处不重复弹窗
  },
  onDisconnected(sid: string) {
    ElMessage.warning("连接已断开");
  },
  onDesktopMetrics(sid: string, data: { fps?: number; memUsed?: number; memTotal?: number }) {
    if (sid === activeSessionId.value && desktopViewerRef.value) {
      desktopViewerRef.value.updateMetrics(data);
    }
  },
});

// 会话列表
const sessionsList = computed(() => {
  const list: Array<{ sessionId: string; protocol: string; state: string }> = [];
  sessions.forEach((s) => {
    list.push({ sessionId: s.sessionId, protocol: s.protocol, state: s.state });
  });
  return list;
});

// 当前活跃会话
const activeSession = computed(() => {
  if (!activeSessionId.value) return null;
  return sessions.get(activeSessionId.value) || null;
});

// 连接
async function handleConnect(settings: ConnectionSettingsType) {
  const result = await connectToTarget(settings);
  if (!result.ok) {
    ElMessage.error(result.error || "连接失败");
  }
}

// 断开全部
function handleDisconnect() {
  disconnectGateway();
  ElMessage.info("已断开所有连接");
}

// 选择会话
function handleSelectSession(sid: string) {
  activeSessionId.value = sid;
}

// 断开指定会话
function handleDisconnectSession(sid: string) {
  disconnectSession(sid);
}

// SSH 输入
function handleTerminalInput(sid: string, data: string) {
  sendInput(sid, data);
}

// SSH 终端尺寸变化
function handleTerminalResize(sid: string, cols: number, rows: number) {
  sendResize(sid, cols, rows);
}

// 鼠标事件
function handleMouseEvent(sid: string, event: { x: number; y: number; button?: number; action?: string; wheel?: number }) {
  sendMouseEvent(sid, event);
}

// 键盘事件
function handleKeyEvent(sid: string, event: { keyCode: number; action: string; shift?: boolean; ctrl?: boolean; alt?: boolean }) {
  sendKeyEvent(sid, event);
}

// 桌面控制
function handleDesktopControl(sid: string, action: string, value?: number) {
  sendDesktopControl(sid, action, value);
}
</script>

<style scoped>
.remote-control-page {
  display: flex;
  height: 100vh;
  background: var(--el-bg-color);
}

.sidebar {
  width: 300px;
  min-width: 280px;
  border-right: 1px solid var(--el-border-color-lighter);
  overflow-y: auto;
  background: var(--el-bg-color);
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tab-bar {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  flex-wrap: wrap;
}

.session-tab {
  cursor: pointer;
  user-select: none;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-placeholder);
  gap: 16px;
  padding: 32px;
}

.empty-state h2 {
  font-size: 22px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin: 0;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
  text-align: center;
}
</style>
