<template>
  <div class="app-shell">
    <!-- Tab 导航 -->
    <div class="app-tabs">
      <button class="app-tab" :class="{ active: activeView === 'remote' }" @click="activeView = 'remote'">远程控制</button>
      <button class="app-tab" :class="{ active: activeView === 'gateway' }" @click="activeView = 'gateway'">网关管理</button>
    </div>

    <!-- 远程控制页 -->
    <div v-show="activeView === 'remote'" class="remote-control-page">
      <!-- 侧栏折叠按钮（折叠时显示） -->
      <button v-if="sidebarCollapsed" class="sidebar-toggle collapsed" @click="sidebarCollapsed = false" title="展开配置">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      <!-- 左侧连接面板 -->
      <div ref="sidebarRef" class="sidebar" :class="{ collapsed: sidebarCollapsed }" :style="{ width: sidebarCollapsed ? '0px' : sidebarWidth + 'px' }">
        <div class="sidebar-inner">
          <div class="sidebar-header">
            <h3 class="sidebar-title">远程控制中心</h3>
            <el-button text size="small" @click="sidebarCollapsed = true" title="折叠">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </el-button>
          </div>

          <!-- 连接表单：仅在未连接时显示 -->
          <el-form v-if="connectionState !== 'connected'" label-position="top" size="default" class="settings-form">
            <el-form-item label="Gateway 地址">
              <el-row :gutter="8">
                <el-col :span="16">
                  <el-input v-model="settings.gatewayHost" placeholder="127.0.0.1">
                    <template #prefix><el-icon><Link /></el-icon></template>
                  </el-input>
                </el-col>
                <el-col :span="8">
                  <el-input-number v-model="settings.gatewayPort" :min="1" :max="65535" style="width: 100%" placeholder="端口" />
                </el-col>
              </el-row>
            </el-form-item>

            <el-form-item label="认证信息（Gateway 可选）">
              <el-row :gutter="8">
                <el-col :span="12"><el-input v-model="auth.username" placeholder="用户名" /></el-col>
                <el-col :span="12"><el-input v-model="auth.password" type="password" show-password placeholder="密码" /></el-col>
              </el-row>
            </el-form-item>

            <el-form-item label="目标 ID">
              <el-input v-model="settings.targetId" placeholder="e.g. desktop-target">
                <template #prefix><el-icon><Monitor /></el-icon></template>
              </el-input>
            </el-form-item>

            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="协议">
                  <el-select v-model="settings.protocol" style="width: 100%">
                    <el-option label="自动检测" value="AUTO" />
                    <el-option label="SSH 终端" value="SSH" />
                    <el-option label="桌面远程" value="DESKTOP" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item v-if="settings.protocol === 'DESKTOP'" label="解码器">
                  <el-select v-model="settings.codec" style="width: 100%">
                    <el-option label="H.264" value="H264" />
                    <el-option label="JPEG" value="JPEG" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="center">连接选项</el-divider>

            <el-button type="primary" size="large" :loading="connectionState === 'connecting'" :disabled="!settings.gatewayHost || !settings.gatewayPort || !settings.targetId" style="width: 100%; margin-top: 8px" @click="handleConnect">
              {{ connectionState === "connecting" ? "连接中..." : "连接" }}
            </el-button>
          </el-form>

          <el-button v-else type="danger" size="large" plain style="width: 100%; margin: 12px 0 8px 0" @click="handleDisconnect">断开连接</el-button>

          <!-- 连接状态 -->
          <div class="status-bar">
            <el-tag :type="statusTagType" effect="dark" size="small">{{ statusText }}</el-tag>
          </div>

          <!-- 会话列表（仅显示已连接会话） -->
          <el-divider content-position="center">会话列表</el-divider>
          <div v-if="connectedSessions.length === 0" class="empty-hint">暂无连接</div>
          <div v-else class="session-list">
            <div v-for="s in connectedSessions" :key="s.sessionId" class="session-item" :class="{ active: s.sessionId === activeSessionId }" @click="activeSessionId = s.sessionId">
              <el-tag type="success" size="small" effect="dark">{{ s.protocol }}</el-tag>
              <span class="session-id">{{ s.sessionId.slice(0, 12) }}...</span>
              <el-button text size="small" type="danger" @click.stop="disconnectSession(s.sessionId)">断开</el-button>
            </div>
          </div>

          <!-- 连接管理 -->
          <el-divider content-position="center">连接管理</el-divider>
          <div v-if="connectionHistory.length === 0" class="empty-hint">暂无历史连接</div>
          <div v-else class="session-list">
            <div v-for="(h, idx) in connectionHistory" :key="idx" class="session-item" :title="'双击自动连接'" @dblclick="reconnect(h)">
              <el-tag size="small" type="info" effect="plain">{{ h.protocol === 'AUTO' ? '自动' : h.protocol }}</el-tag>
              <span class="session-id">{{ h.targetId }}</span>
              <el-button text size="small" type="danger" @click.stop="removeHistory(idx)">删除</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 拖拽手柄 -->
      <div v-if="!sidebarCollapsed" class="drag-handle" @mousedown.prevent="startDrag"></div>

      <!-- 右侧内容区 -->
      <div class="content">
        <SshTerminal v-if="activeSession && activeSession.protocol === 'SSH'" ref="sshTerminalRef" :session-id="activeSessionId" :connection-state="activeSession?.state || 'disconnected'" @input="handleTerminalInput" @resize="handleTerminalResize" />
        <DesktopViewer v-else-if="activeSession && activeSession.protocol === 'DESKTOP'" ref="desktopViewerRef" :session-id="activeSessionId" :connection-state="activeSession?.state || 'disconnected'" @mouse-event="handleMouseEvent" @key-event="handleKeyEvent" @desktop-control="handleDesktopControl" />
        <div v-else class="empty-state">
          <el-icon :size="64"><Monitor /></el-icon>
          <h2>远程控制中心</h2>
          <p>在左侧选择协议、填写连接信息，点击"连接"发起远程控制</p>
        </div>
      </div>
    </div>

    <!-- 网关管理页 -->
    <GatewayManage v-show="activeView === 'gateway'" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { Link, Monitor } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import SshTerminal from "@pages/remote/components/SshTerminal.vue";
import DesktopViewer from "@pages/remote/components/DesktopViewer.vue";
import GatewayManage from "./GatewayManage.vue";
import { useRemoteControl } from "@pages/remote";
import type {
  ConnectionSettings as RemoteConnectionSettings,
  RemoteProtocol,
  RemoteCodec,
  DesktopFrameEvent,
} from "@pages/remote";

const sshTerminalRef = ref<InstanceType<typeof SshTerminal>>();
const desktopViewerRef = ref<InstanceType<typeof DesktopViewer>>();

const settings = reactive({
  gatewayHost: "127.0.0.1",
  gatewayPort: 8082,
  targetId: "desktop-agent-1-DESKTOP",
  protocol: "DESKTOP" as RemoteProtocol,
  codec: "H264" as RemoteCodec,
});

const auth = reactive({
  username: "",
  password: "",
});

// 连接历史
interface HistoryEntry {
  gatewayHost: string;
  gatewayPort: number;
  targetId: string;
  protocol: RemoteProtocol;
  codec: RemoteCodec;
  username?: string;
  password?: string;
}

const connectionHistory = ref<HistoryEntry[]>(loadHistory());

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem("remote-connection-history");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory() {
  localStorage.setItem("remote-connection-history", JSON.stringify(connectionHistory.value));
}

function addHistory() {
  const entry: HistoryEntry = {
    gatewayHost: settings.gatewayHost,
    gatewayPort: settings.gatewayPort,
    targetId: settings.targetId,
    protocol: settings.protocol,
    codec: settings.codec,
    username: auth.username,
  };
  // 去重：相同 targetId+协议不重复添加
  const idx = connectionHistory.value.findIndex(h => h.targetId === entry.targetId && h.protocol === entry.protocol);
  if (idx >= 0) connectionHistory.value.splice(idx, 1);
  connectionHistory.value.unshift(entry);
  if (connectionHistory.value.length > 20) connectionHistory.value = connectionHistory.value.slice(0, 20);
  saveHistory();
}

function removeHistory(idx: number) {
  connectionHistory.value.splice(idx, 1);
  saveHistory();
}

function reconnect(h: HistoryEntry) {
  settings.gatewayHost = h.gatewayHost;
  settings.gatewayPort = h.gatewayPort;
  settings.targetId = h.targetId;
  settings.protocol = h.protocol;
  settings.codec = h.codec;
  auth.username = h.username || "";
  auth.password = h.password || "";
  // 自动连接
  handleConnect();
}

// 侧栏状态
const sidebarWidth = ref(320);
const sidebarCollapsed = ref(false);
const sidebarRef = ref<HTMLElement>();
let dragging = false;

const activeView = ref<"remote" | "gateway">("remote");

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
} = useRemoteControl({
  onConnected(sid) {
    ElMessage.success("连接成功: " + sid.slice(0, 8));
    addHistory();
    sidebarCollapsed.value = false;
  },
  onTerminalOutput(sid, data) {
    if (sid === activeSessionId.value && sshTerminalRef.value) {
      sshTerminalRef.value.writeToTerminal(data);
    }
  },
  onDesktopFrame(event: DesktopFrameEvent) {
    if (event.sessionId === activeSessionId.value && desktopViewerRef.value) {
      desktopViewerRef.value.renderH264Frame(event.data, event.width, event.height, event.keyFrame);
    }
  },
  onError(_sid, msg) {
    ElMessage.error("连接错误: " + msg);
  },
  onDisconnected(_sid) {
    ElMessage.warning("连接已断开");
  },
  onDesktopMetrics(_sid, data) {
    if (desktopViewerRef.value) {
      desktopViewerRef.value.updateMetrics(data);
    }
  },
});

// 仅显示已连接的会话
const connectedSessions = computed(() => {
  const list: Array<{ sessionId: string; protocol: string; state: string }> = [];
  sessions.forEach((s) => {
    if (s.state === "connected") list.push({ sessionId: s.sessionId, protocol: s.protocol, state: s.state });
  });
  return list;
});

const activeSession = computed(() => {
  if (!activeSessionId.value) return null;
  return sessions.get(activeSessionId.value) || null;
});

const statusTagType = computed(() => {
  switch (connectionState.value) {
    case "connected": return "success";
    case "connecting": return "warning";
    case "error": return "danger";
    default: return "info";
  }
});

const statusText = computed(() => {
  switch (connectionState.value) {
    case "connected": return "已连接";
    case "connecting": return "连接中";
    case "error": return "连接错误";
    default: return "未连接";
  }
});

function startDrag(e: MouseEvent) {
  dragging = true;
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
}

function onDrag(e: MouseEvent) {
  if (!dragging) return;
  const newWidth = Math.max(240, Math.min(600, e.clientX));
  sidebarWidth.value = newWidth;
}

function stopDrag() {
  dragging = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
}

/** 解析 AUTO 协议：根据 targetId 后缀自动选择 */
function resolveProtocol(targetId: string, protocol: string): RemoteProtocol {
  if (protocol !== "AUTO") return protocol as RemoteProtocol;
  const upper = targetId.toUpperCase();
  if (upper.endsWith("-DESKTOP") || upper.includes("_DESKTOP")) return "DESKTOP";
  if (upper.endsWith("-SSH") || upper.includes("_SSH")) return "SSH";
  // 默认 DESKTOP
  return "DESKTOP";
}

async function handleConnect() {
  // 先校验目标 ID 格式
  if (!settings.targetId.trim()) {
    ElMessage.error("请填写目标 ID");
    return;
  }

  // 解析 AUTO 协议
  const resolvedProtocol = resolveProtocol(settings.targetId, settings.protocol);
  const effectiveProtocol = resolvedProtocol;

  const cfg: RemoteConnectionSettings = {
    gatewayUrl: `ws://${settings.gatewayHost}:${settings.gatewayPort}`,
    targetId: settings.targetId,
    protocol: effectiveProtocol,
    codec: settings.codec,
    auth: {
      username: auth.username || undefined,
      password: auth.password || undefined,
    },
  };
  const ok = await connectToTarget(cfg);
  if (!ok) ElMessage.error("连接失败，请检查配置");
}

function handleDisconnect() {
  disconnectGateway();
  ElMessage.info("已断开所有连接");
}

function handleTerminalInput(sid: string, data: string) {
  sendInput(sid, data);
}

function handleTerminalResize(sid: string, cols: number, rows: number) {
  sendResize(sid, cols, rows);
}

function handleMouseEvent(sid: string, event: { x: number; y: number; button?: number; action?: string }) {
  sendMouseEvent(sid, event);
}

function handleKeyEvent(sid: string, event: { keyCode: number; action: string }) {
  sendKeyEvent(sid, event);
}

function handleDesktopControl(sid: string, action: string, value?: string | number) {
  sendDesktopControl(sid, action, value);
}
</script>

<style scoped>
/* ── App Shell (双层 Tab 容器) ── */
.app-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
}
.app-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-blank);
  flex-shrink: 0;
  padding: 0 16px;
}
.app-tab {
  padding: 10px 20px;
  font-size: 14px;
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}
.app-tab:hover { color: var(--el-color-primary); }
.app-tab.active { color: var(--el-color-primary); font-weight: 600; }
.app-tab.active::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--el-color-primary);
}

.remote-control-page {
  display: flex;
  flex: 1;
  min-height: 0;
  background: var(--el-bg-color);
  position: relative;
}

.sidebar-toggle.collapsed {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 24px;
  height: 60px;
  border: 1px solid var(--el-border-color-lighter);
  border-left: none;
  border-radius: 0 6px 6px 0;
  background: var(--el-bg-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  transition: color 0.2s;
}
.sidebar-toggle.collapsed:hover { color: var(--el-color-primary); }

.sidebar {
  min-width: 0;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  overflow: hidden;
  transition: width 0.2s ease;
  flex-shrink: 0;
}
.sidebar.collapsed { width: 0 !important; border-right: none; }

.sidebar-inner {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--el-text-color-primary);
}

.settings-form { padding: 0; }

.status-bar { margin-top: 12px; text-align: center; }

.empty-hint {
  text-align: center;
  color: var(--el-text-color-placeholder);
  padding: 16px 0;
  font-size: 13px;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  cursor: pointer;
  transition: background 0.2s;
}
.session-item:hover { background: var(--el-fill-color); }
.session-item.active {
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-5);
}

.session-id {
  flex: 1;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drag-handle {
  width: 4px;
  cursor: col-resize;
  background: transparent;
  flex-shrink: 0;
  position: relative;
  z-index: 5;
  transition: background 0.15s;
}
.drag-handle:hover { background: var(--el-color-primary-light-5); }

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-placeholder);
  gap: 16px;
}

.empty-state h2 {
  font-size: 22px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin: 0;
}
</style>
