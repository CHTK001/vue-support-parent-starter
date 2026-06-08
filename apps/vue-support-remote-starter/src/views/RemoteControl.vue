<template>
  <!-- 独立防火墙页面（通过 ?view=firewall 打开） -->
  <div v-if="isFirewallView" class="app-shell" style="background: var(--el-bg-color-page);">
    <FirewallManage />
  </div>

  <!-- 全屏大屏视图（通过 ?view=fullscreen&session=SID 打开） -->
  <div v-else-if="isFullscreenView" class="fullscreen-view" @keydown.escape="exitFullscreenWindow">
    <DesktopViewer
      ref="desktopViewerRef"
      :session-id="activeSessionId"
      :connection-state="activeSession?.state || 'disconnected'"
      :transport="activeSession?.transport"
      @mouse-event="handleMouseEvent"
      @key-event="handleKeyEvent"
      @desktop-control="handleDesktopControl"
      @disconnect-request="handleFullscreenDisconnect"
    />
    <!-- 全屏浮动工具栏 -->
    <div class="fs-toolbar">
      <span class="fs-session-id" title="会话 ID">{{ activeSessionId?.slice(0, 12) }}</span>
      <button class="fs-btn" title="全屏" @click="toggleFullscreenView">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      </button>
      <button class="fs-btn fs-btn-danger" title="断开并关闭" @click="handleFullscreenDisconnect()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>断开</span>
      </button>
    </div>
  </div>

  <!-- 正常主应用 -->
  <div v-else class="app-shell app-page-bg">
    <!-- 头部 -->
    <div class="app-header">
      <div class="header-accent"></div>
      <div class="header-content">
        <div class="header-left">
          <div class="header-brand">
            <div class="brand-icon">
              <IconifyIconOnline icon="mdi:remote-desktop" :size="18" />
            </div>
            <span class="header-title">远控中心</span>
          </div>
          <div class="header-tabs">
            <button class="header-tab" :class="{ active: activeView === 'remote' }" @click="activeView = 'remote'">
              <el-icon :size="14"><Monitor /></el-icon> 远程控制
              <span class="tab-indicator"></span>
            </button>
            <button v-if="accessCodeVerified" class="header-tab" :class="{ active: activeView === 'apigateway' }" @click="activeView = 'apigateway'">
              <el-icon :size="14"><Aim /></el-icon> 网关
              <span class="tab-indicator"></span>
            </button>
            <button class="header-tab" :class="{ active: activeView === 'proxy' }" @click="activeView = 'proxy'">
              <el-icon :size="14"><Share /></el-icon> SOCK 代理
              <span class="tab-indicator"></span>
            </button>
            <button v-if="accessCodeVerified" class="header-tab" :class="{ active: activeView === 'spring-api-gateway' }" @click="activeView = 'spring-api-gateway'">
              <el-icon :size="14"><Connection /></el-icon> API 网关
              <span class="tab-indicator"></span>
            </button>
            <button v-if="accessCodeVerified" class="header-tab" :class="{ active: activeView === 'token' }" @click="activeView = 'token'">
              <el-icon :size="14"><Key /></el-icon> 令牌
              <span class="tab-indicator"></span>
            </button>
            <button v-if="accessCodeVerified" class="header-tab" :class="{ active: activeView === 'config' }" @click="activeView = 'config'">
              <el-icon :size="14"><Setting /></el-icon> 配置
              <span class="tab-indicator"></span>
            </button>
          </div>
        </div>
        <div class="header-right">
          <el-tag :type="gatewayWsConnected ? 'success' : 'danger'" effect="dark" size="small">
            {{ gatewayWsConnected ? '网关已连接' : '网关未连接' }}
          </el-tag>
          <el-button v-if="activeSession" size="small" type="primary" plain @click="openFullscreen">
            <el-icon :size="14"><FullScreen /></el-icon> 大屏
          </el-button>
          <div v-if="accessCodeVerified" class="token-display" title="点击复制访问码">
            <el-tag size="small" effect="plain" style="cursor:pointer;font-family:monospace;font-size:11px;" @click="copyAccessCode">
              访问码: {{ accessCode.slice(0, 6) }}...{{ accessCode.slice(-4) }}
              <el-icon style="margin-left:4px"><CopyDocument /></el-icon>
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 远程控制页 -->
    <div v-show="activeView === 'remote'" class="remote-control-page">
      <!-- 侧栏折叠按钮（折叠时显示）- 连接成功后自动隐藏不占空间 -->
      <div v-show="sidebarCollapsed" class="sidebar-toggle-zone">
        <button class="sidebar-toggle collapsed" @click="sidebarCollapsed = false" title="展开配置">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <!-- 左侧连接面板 -->
      <div ref="sidebarRef" class="sidebar" :class="{ collapsed: sidebarCollapsed }" :style="{ width: sidebarCollapsed ? '0px' : sidebarWidth + 'px' }">
        <div class="sidebar-inner thin-scroller">
          <!-- 始终显示连接表单（侧栏展开时） -->
            <div class="sidebar-section">
              <div class="section-title">
                <IconifyIconOnline icon="mdi:connection" />
                <span>连接配置</span>
                <div class="section-title-actions">
                <el-popover placement="bottom-end" :width="320" trigger="click">
                  <template #reference>
                    <el-icon class="history-icon-btn" title="连接管理"><Clock /></el-icon>
                  </template>
                  <div class="popover-title">连接管理</div>
                  <div v-if="connectionHistory.length === 0" class="empty-hint">暂无历史连接</div>
                  <div v-else class="popover-list">
                    <div v-for="(h, idx) in connectionHistory" :key="idx" class="popover-item" :title="'双击自动连接'" @dblclick="reconnect(h)">
                      <el-tag size="small" type="info" effect="plain">{{ h.protocol === 'AUTO' ? '自动' : h.protocol }}</el-tag>
                      <span class="popover-item-name">{{ h.name || h.targetId }}</span>
                      <div class="popover-item-actions">
                        <el-button text size="small" @click.stop="reconnect(h)">连接</el-button>
                        <el-button text size="small" type="danger" @click.stop="removeHistory(idx)">删除</el-button>
                      </div>
                    </div>
                  </div>
                </el-popover>
                <el-popover placement="bottom-end" :width="320" trigger="click">
                  <template #reference>
                    <el-icon class="history-icon-btn" title="会话与设置"><Setting /></el-icon>
                  </template>
                  <!-- 已连接会话 -->
                  <div class="popover-title">会话列表 <el-tag v-if="connectedSessions.length" size="small" type="success" effect="dark" style="margin-left:6px">{{ connectedSessions.length }}</el-tag></div>
                  <div v-if="connectedSessions.length === 0" class="empty-hint">暂无连接</div>
                  <div v-else class="popover-list" style="margin-bottom:12px">
                    <div v-for="s in connectedSessions" :key="s.sessionId" class="popover-item" :class="{ active: s.sessionId === activeSessionId }" @click="activeSessionId = s.sessionId">
                      <el-tag type="success" size="small" effect="dark">{{ s.protocol }}</el-tag>
                      <span class="popover-item-name">{{ s.sessionId.slice(0, 12) }}...</span>
                      <el-button text size="small" type="danger" @click.stop="disconnectSession(s.sessionId)">断开</el-button>
                    </div>
                  </div>
                  <!-- 高级设置 -->
                  <div class="popover-divider"></div>
                  <div class="popover-title" style="margin-bottom:8px">高级设置</div>
                  <div style="display:flex;flex-direction:column;gap:10px">
                    <div style="display:flex;align-items:center;justify-content:space-between">
                      <span style="font-size:12px;color:var(--el-text-color-regular)">心跳间隔（秒）</span>
                      <el-input-number v-model="settings.heartbeatInterval" :min="10" :max="600" :step="10" size="small" style="width:110px" controls-position="right" />
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between">
                      <span style="font-size:12px;color:var(--el-text-color-regular)">心跳超时（秒）</span>
                      <el-input-number v-model="settings.heartbeatTimeout" :min="30" :max="1800" :step="30" size="small" style="width:110px" controls-position="right" />
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between">
                      <span style="font-size:12px;color:var(--el-text-color-regular)">连接超时（秒）</span>
                      <el-input-number v-model="settings.connectTimeout" :min="5" :max="120" :step="5" size="small" style="width:110px" controls-position="right" />
                    </div>
                  </div>
                </el-popover>
                </div>
              </div>
              <el-form label-position="top" size="default" class="settings-form">
                <el-form-item label="连接名称">
                  <el-input v-model="settings.name" placeholder="给连接起个名称">
                    <template #prefix><el-icon><Link /></el-icon></template>
                  </el-input>
                </el-form-item>
                <el-form-item label="Gateway IP">
                  <el-input v-model="settings.gatewayHost" placeholder="127.0.0.1">
                    <template #prefix><el-icon><Link /></el-icon></template>
                  </el-input>
                </el-form-item>
                <el-form-item label="Gateway 端口">
                  <el-input-number v-model="settings.gatewayPort" :min="1" :max="65535" style="width: 100%" placeholder="8082" />
                </el-form-item>
                <el-form-item label="协议">
                  <el-select v-model="settings.protocol" style="width: 100%">
                    <el-option label="自动检测" value="AUTO" />
                    <el-option label="SSH 终端" value="SSH" />
                    <el-option label="桌面远程" value="DESKTOP" />
                    <el-option label="代理 / SOCKS5" value="SOCKS5" />
                    <el-option label="会议" value="CONFERENCE" />
                  </el-select>
                </el-form-item>
                <el-form-item v-if="settings.protocol === 'DESKTOP' || settings.protocol === 'AUTO'" label="解码器">
                  <el-select v-model="settings.codec" style="width: 100%">
                    <el-option label="H.264（默认）" value="H264" />
                    <el-option label="H.265 / HEVC" value="H265" />
                    <el-option label="JPEG" value="JPEG" />
                  </el-select>
                </el-form-item>
                <el-form-item label="目标 ID">
                  <el-input v-model="settings.targetId" placeholder="e.g. a96bf074017f">
                    <template #prefix><el-icon><Monitor /></el-icon></template>
                    <template #suffix>
                      <el-tag v-if="matchedTargetProtocol" size="small" :type="protocolTagType(matchedTargetProtocol)" effect="dark" style="margin-right:4px">{{ protocolLabel(matchedTargetProtocol) }}</el-tag>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item label="验证码">
                  <el-input v-model="verifyCode" placeholder="输入被控端 6 位验证码">
                    <template #prefix><el-icon><Key /></el-icon></template>
                  </el-input>
                </el-form-item>
                <template v-if="settings.protocol === 'CONFERENCE'">
                  <el-form-item label="会议室 ID">
                    <el-input v-model="localConference.roomId" placeholder="e.g. test-room">
                      <template #prefix><el-icon><Monitor /></el-icon></template>
                    </el-input>
                  </el-form-item>
                  <el-form-item label="角色">
                    <el-select v-model="localConference.mode" style="width: 100%">
                      <el-option label="主持人" value="host" />
                      <el-option label="参与者" value="guest" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="会议模式">
                    <el-select v-model="localConference.layoutMode" style="width: 100%">
                      <el-option label="自由会议（LiveKit 官方）" value="official" />
                      <el-option label="固定主持人" value="fixed-host" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="最大参与人数">
                    <el-input-number v-model="localConference.maxParticipants" :min="1" :max="10" style="width: 100%" />
                  </el-form-item>
                  <el-button
                    type="default"
                    size="large"
                    :disabled="!localConference.roomId"
                    class="connect-btn secondary"
                    @click="openConferenceWindows(localConference.roomId.trim())"
                  >
                    打开主持人/参与者窗口
                  </el-button>
                </template>
                <el-form-item v-if="settings.protocol === 'SOCKS5'" label="SOCKS5 反向隧道">
                  <div class="space-y-3 rounded-xl border border-[var(--el-border-color-light)] bg-[var(--el-bg-color-overlay)] p-4">
                    <div class="flex items-center justify-between gap-3">
                      <div>
                        <div class="text-sm font-medium text-[var(--el-text-color-primary)]">SSH 反向隧道</div>
                        <div class="text-xs text-[var(--el-text-color-secondary)]">仅在代理 / SOCKS5 连接时显示，保存后不会保留密码。</div>
                      </div>
                      <el-switch v-model="socksTunnelForm.sshReverseTunnelEnabled" />
                    </div>

                    <el-row :gutter="12">
                      <el-col :span="14">
                        <el-form-item label="SSH 主机" class="mb-0">
                          <el-input v-model="socksTunnelForm.sshRemoteHost" placeholder="127.0.0.1" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="10">
                        <el-form-item label="SSH 端口" class="mb-0">
                          <el-input-number v-model="socksTunnelForm.sshRemotePort" :min="1" :max="65535" style="width: 100%" />
                        </el-form-item>
                      </el-col>
                    </el-row>

                    <el-row :gutter="12">
                      <el-col :span="12">
                        <el-form-item label="本地端口" class="mb-0">
                          <el-input-number v-model="socksTunnelForm.sshReverseLocalPort" :min="0" :max="65535" style="width: 100%" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="远端端口" class="mb-0">
                          <el-input-number v-model="socksTunnelForm.sshReverseRemotePort" :min="0" :max="65535" style="width: 100%" />
                        </el-form-item>
                      </el-col>
                    </el-row>

                    <el-row :gutter="12">
                      <el-col :span="12">
                        <el-form-item label="用户名" class="mb-0">
                          <el-input v-model="socksTunnelForm.sshUsername" placeholder="root" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="私钥路径" class="mb-0">
                          <el-input v-model="socksTunnelForm.sshKeyFile" placeholder="~/.ssh/id_rsa" />
                        </el-form-item>
                      </el-col>
                    </el-row>

                    <el-form-item label="密码（仅本次保存）" class="mb-0">
                      <el-input v-model="socksTunnelForm.sshPassword" type="password" show-password placeholder="仅在保存时发送，不会持久化" />
                    </el-form-item>

                    <div class="flex justify-end">
                      <el-button size="small" type="primary" plain :loading="savingSocksTunnel" @click="saveSocksTunnelConfig">保存隧道配置</el-button>
                    </div>
                  </div>
                </el-form-item>
                  <el-button type="primary" size="large" :loading="connectionState === 'connecting'" :disabled="!canConnect" class="connect-btn" @click="handleConnect">
                  <span v-if="connectionState === 'connecting'" class="connect-btn-text">
                    <el-icon class="is-loading" style="margin-right:4px"><Loading /></el-icon>连接中...
                  </span>
                  <span v-else>连接</span>
                </el-button>
              </el-form>
            </div>

        </div>
      </div>

      <!-- 拖拽手柄 -->
      <div v-if="!sidebarCollapsed" class="drag-handle" @mousedown.prevent="startDrag"></div>

      <!-- 右侧内容区 -->
      <div class="content">
        <!-- 浮动会话工具栏（仅 SSH 需要，桌面端有自己的设置面板） -->
        <div v-if="activeSession && activeSession.protocol === 'SSH'" class="session-toolbar">
        </div>

        <!-- SSH 会话：终端 + 文件管理面板 -->
        <template v-if="activeSession && activeSession.protocol === 'SSH'">
          <div class="ssh-workspace">
            <div class="ssh-terminal-zone" @dragover.prevent="onTerminalDragOver" @dragleave="onTerminalDragLeave" @drop.prevent="onTerminalDrop">
              <div v-if="terminalDragging" class="terminal-drop-overlay">
                <el-icon :size="48"><UploadFilled /></el-icon>
                <p>拖拽到此处上传到终端 pwd 目录</p>
              </div>
              <SshTerminal ref="sshTerminalRef" :session-id="activeSessionId" :connection-state="activeSession?.state || 'disconnected'" @input="handleTerminalInput" @resize="handleTerminalResize" @disconnect-request="handleSessionDisconnect" class="ssh-terminal-area" />
            </div>
            <!-- 文件面板折叠时显示展开按钮 -->
            <div v-if="filePanelCollapsed" class="file-panel-expand-zone" @click="filePanelCollapsed = false" title="展开文件管理">
              <button class="file-panel-expand-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
            <!-- 文件面板包装器：包含收缩按钮 + 拖拽手柄 + 文件管理器 -->
            <div v-show="!filePanelCollapsed" class="file-panel-wrapper">
              <div class="file-panel-toggle-zone" @click="filePanelCollapsed = true" title="收起文件管理">
                <button class="file-panel-float-toggle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              </div>
              <div class="file-panel-drag-handle" @mousedown.prevent="startFilePanelDrag"></div>
              <SshFileManager ref="sshFileManagerRef" :session-id="activeSessionId" :connection-state="activeSession?.state || 'disconnected'" :send-file-op="sendFileOp" class="ssh-file-panel" :style="{ width: filePanelWidth + 'px' }" />
            </div>
          </div>
        </template>
        <DesktopViewer v-else-if="activeSession && activeSession.protocol === 'DESKTOP'" ref="desktopViewerRef" :session-id="activeSessionId" :connection-state="activeSession?.state || 'disconnected'" :transport="activeSession?.transport" @mouse-event="handleMouseEvent" @key-event="handleKeyEvent" @desktop-control="handleDesktopControl" @disconnect-request="handleDisconnect" />
        <ConferenceRoom v-else-if="activeSession && activeSession.protocol === 'CONFERENCE'" ref="conferenceRoomRef" :session-id="activeSessionId" :connection-state="activeSession?.state || 'disconnected'" :invite-mode="localConference.mode" :layout-mode="localConference.layoutMode" @disconnect-request="handleSessionDisconnect" />
        <div v-else class="empty-state">
          <div class="empty-state-icon">
            <IconifyIconOnline icon="mdi:remote-desktop" :size="72" />
          </div>
          <h2>远程控制中心</h2>
          <p>在左侧选择协议、填写连接信息，点击"连接"发起远程控制</p>
        </div>
      </div>
    </div>

    <!-- SOCKS5 代理页 -->
    <ProxyManage v-if="activeView === 'proxy'" />

    <!-- 被控端管理（在"网关"tab内） -->
    <GatewayManage v-if="accessCodeVerified" v-show="activeView === 'apigateway'" />

    <!-- API 网关页 -->
    <SpringApiGateway v-if="accessCodeVerified" v-show="activeView === 'spring-api-gateway'" />

    <!-- 网关配置页 -->
    <div v-if="accessCodeVerified" v-show="activeView === 'config'">
      <GatewayConfig />
    </div>

    <!-- 令牌管理页 -->
    <TokenManage v-if="accessCodeVerified" v-show="activeView === 'token'" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, provide, onMounted, onUnmounted, watch } from "vue";
import { Link, Monitor, EditPen, CopyDocument, Key, Connection, Aim, Setting, Share, UploadFilled, Warning, Clock, FullScreen, Loading } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import SshTerminal from "@pages/remote/components/SshTerminal.vue";
import SshFileManager from "@pages/remote/components/SshFileManager.vue";
import DesktopViewer from "@pages/remote/components/DesktopViewer.vue";
import ConferenceRoom from "@pages/remote/components/ConferenceRoom.vue";
import GatewayConfig from "./GatewayConfig.vue";
import GatewayManage from "./GatewayManage.vue";
import ProxyManage from "./ProxyManage.vue";
import TokenManage from "./TokenManage.vue";
import SpringApiGateway from "./SpringApiGateway.vue";
import FirewallManage from "./FirewallManage.vue";
import { useRemoteControl, encodeConferencePayload } from "@pages/remote";
import type {
  ConnectionSettings as RemoteConnectionSettings,
  RemoteProtocol,
  RemoteCodec,
  TransportType,
  DesktopFrameEvent,
} from "@pages/remote";

const sshTerminalRef = ref<InstanceType<typeof SshTerminal>>();
const sshFileManagerRef = ref<InstanceType<typeof SshFileManager>>();
const desktopViewerRef = ref<InstanceType<typeof DesktopViewer>>();
const conferenceRoomRef = ref<InstanceType<typeof ConferenceRoom>>();

const localConference = reactive({
  roomId: "",
  mode: "host" as "host" | "guest",
  layoutMode: "official" as "official" | "fixed-host",
  maxParticipants: 3,
});

const verifyCode = ref("");

const settings = reactive({
  name: "",
  gatewayHost: "127.0.0.1",
  gatewayPort: 8082,
  targetId: "",
  protocol: "DESKTOP" as RemoteProtocol,
  transport: undefined as TransportType | undefined,
  codec: "H264" as RemoteCodec,
  token: "",
  connectTimeout: 15,
  heartbeatInterval: 60,
  heartbeatTimeout: 180,
});

const socksTunnelForm = reactive({
  sshReverseTunnelEnabled: false,
  sshRemoteHost: "",
  sshRemotePort: 22,
  sshReverseLocalPort: 0,
  sshReverseRemotePort: 0,
  sshUsername: "",
  sshPassword: "",
  sshKeyFile: "",
});
const savingSocksTunnel = ref(false);

function socksTunnelUrl() {
  return `${window.location.protocol}//${settings.gatewayHost}:${settings.gatewayPort}/admin/api/socks5/tunnel`;
}

async function fetchSocksTunnelConfig() {
  try {
    const response = await fetch(`${socksTunnelUrl()}${getToken() ? `?token=${encodeURIComponent(getToken())}` : ""}`);
    if (!response.ok) return;
    const data = await response.json();
    socksTunnelForm.sshReverseTunnelEnabled = Boolean(data.sshReverseTunnelEnabled);
    socksTunnelForm.sshRemoteHost = data.sshRemoteHost || "";
    socksTunnelForm.sshRemotePort = Number(data.sshRemotePort || 22);
    socksTunnelForm.sshReverseLocalPort = Number(data.sshReverseLocalPort || 0);
    socksTunnelForm.sshReverseRemotePort = Number(data.sshReverseRemotePort || 0);
    socksTunnelForm.sshUsername = data.sshUsername || "";
    socksTunnelForm.sshPassword = "";
    socksTunnelForm.sshKeyFile = data.sshKeyFile || "";
  } catch {}
}

async function saveSocksTunnelConfig() {
  savingSocksTunnel.value = true;
  try {
    const payload: Record<string, unknown> = {
      sshReverseTunnelEnabled: socksTunnelForm.sshReverseTunnelEnabled,
      sshRemoteHost: socksTunnelForm.sshRemoteHost,
      sshRemotePort: socksTunnelForm.sshRemotePort,
      sshReverseLocalPort: socksTunnelForm.sshReverseLocalPort,
      sshReverseRemotePort: socksTunnelForm.sshReverseRemotePort,
      sshUsername: socksTunnelForm.sshUsername,
      sshKeyFile: socksTunnelForm.sshKeyFile,
    };
    if (socksTunnelForm.sshPassword) payload.sshPassword = socksTunnelForm.sshPassword;
    const response = await fetch(`${socksTunnelUrl()}${getToken() ? `?token=${encodeURIComponent(getToken())}` : ""}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await response.text() || `HTTP ${response.status}`);
    socksTunnelForm.sshPassword = "";
    ElMessage.success("隧道配置已保存");
  } catch (error: any) {
    ElMessage.error(`保存失败: ${error?.message || error}`);
  } finally {
    savingSocksTunnel.value = false;
  }
}

function buildConferenceJoinUrl(roomId: string, mode: "host" | "guest") {
  const payload = {
    roomId,
    mode,
    layoutMode: localConference.layoutMode,
    gateway: `${settings.gatewayHost}:${settings.gatewayPort}`,
    targetId: roomId,
    verifyCode: verifyCode.value.trim() || undefined,
    maxParticipants: localConference.maxParticipants,
    token: settings.token || accessCode.value || undefined,
  };
  const url = new URL("/conference/join", window.location.origin);
  url.searchParams.set("p", encodeConferencePayload(payload));
  return url.toString();
}

function openConferenceWindows(roomId: string) {
  const hostUrl = buildConferenceJoinUrl(roomId, "host");
  const guestUrl = buildConferenceJoinUrl(roomId, "guest");
  window.open(hostUrl, `conference_host_${roomId}`, "width=1280,height=820");
  window.open(guestUrl, `conference_guest_${roomId}`, "width=1280,height=820");
}

async function copyConferenceInviteLink() {
  if (!localConference.roomId.trim()) {
    ElMessage.warning("请先填写会议室 ID");
    return;
  }
  const url = buildConferenceJoinUrl(localConference.roomId.trim(), "guest");
  try {
    await navigator.clipboard.writeText(url);
    ElMessage.success("参与链接已复制");
  } catch {
    const input = document.createElement("textarea");
    input.value = url;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    ElMessage.success("参与链接已复制");
  }
}

// 文件面板折叠状态
const filePanelCollapsed = ref(true);
const filePanelWidth = ref(380);
let filePanelDragging = false;

// pwd 命令追踪
let terminalInputBuffer = "";
let pendingPwd = false;

// 终端拖拽上传
const terminalDragging = ref(false);
let terminalDragCounter = 0;
let pendingTerminalUploadFiles: File[] = [];

function onTerminalDragOver() {
  terminalDragCounter++;
  terminalDragging.value = true;
}

function onTerminalDragLeave() {
  terminalDragCounter--;
  if (terminalDragCounter <= 0) {
    terminalDragging.value = false;
    terminalDragCounter = 0;
  }
}

function onTerminalDrop(e: DragEvent) {
  terminalDragging.value = false;
  terminalDragCounter = 0;
  const files = e.dataTransfer?.files;
  if (!files || files.length === 0 || !activeSessionId.value) return;
  // 先发 pwd 获取终端当前目录，然后上传
  if (sshFileManagerRef.value) {
    // 触发文件管理器 pwd，在回调中上传
    pendingTerminalUploadFiles = Array.from(files);
    sendFileOp(activeSessionId.value, "pwd");
  }
}

// 会话持久化（localStorage）
function saveSessionState() {
  try {
    localStorage.setItem("remote-active-view", activeView.value);
    localStorage.setItem("remote-sidebar-collapsed", String(sidebarCollapsed.value));
  } catch {}
}

function restoreSessionState() {
  try {
    const savedView = localStorage.getItem("remote-active-view");
    if (savedView && ["remote", "apigateway", "proxy", "spring-api-gateway", "config", "token"].includes(savedView)) {
      activeView.value = savedView as any;
    }
    const savedCollapsed = localStorage.getItem("remote-sidebar-collapsed");
    if (savedCollapsed === "true") sidebarCollapsed.value = true;
  } catch {}
}

// 连接历史
interface HistoryEntry {
  name: string;
  gatewayHost: string;
  gatewayPort: number;
  targetId?: string;
  verifyCode?: string;
  protocol: RemoteProtocol;
  transport?: TransportType;
  codec: RemoteCodec;
  token?: string;
  connectTimeout?: number;
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
  // 只有填写了名称才保存到连接管理
  if (!settings.name.trim()) return;
  const entry: HistoryEntry = {
    name: settings.name.trim(),
    gatewayHost: settings.gatewayHost,
    gatewayPort: settings.gatewayPort,
    targetId: settings.targetId || undefined,
    verifyCode: verifyCode.value || undefined,
    protocol: settings.protocol,
    transport: settings.transport,
    codec: settings.codec,
    token: settings.token || accessCode.value || undefined,
  };
  // 去重：相同名称或相同 verifyCode+协议不重复添加
  const idx = connectionHistory.value.findIndex(h => h.name === entry.name || (h.verifyCode === entry.verifyCode && h.protocol === entry.protocol));
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
  settings.name = h.name || "";
  settings.gatewayHost = h.gatewayHost;
  settings.gatewayPort = h.gatewayPort;
  settings.targetId = h.targetId || "";
  verifyCode.value = h.verifyCode || "";
  settings.protocol = h.protocol;
  settings.transport = h.transport;
  settings.codec = h.codec;
  settings.token = h.token || "";
  // 自动连接
  handleConnect();
}

// 侧栏状态
const sidebarWidth = ref(320);
const sidebarCollapsed = ref(false);
const sidebarRef = ref<HTMLElement>();
let dragging = false;

const activeView = ref<"remote" | "apigateway" | "proxy" | "spring-api-gateway" | "config" | "token">("remote");
const accessCodeVerified = ref(false);

// 供子页面（如 GatewayManage）跳转到远程控制并预填参数
function navigateToRemote(params: {
  targetId?: string;
  verifyCode?: string;
  protocol?: string;
  name?: string;
  token?: string;
  codec?: string;
  transport?: string;
}) {
  if (params.targetId !== undefined) settings.targetId = params.targetId;
  if (params.verifyCode !== undefined) verifyCode.value = params.verifyCode;
  if (params.protocol) settings.protocol = normalizeRemoteProtocol(params.protocol);
  if (params.codec) settings.codec = normalizeRemoteCodec(params.codec);
  if (params.transport) settings.transport = params.transport as TransportType;
  if (params.token) settings.token = params.token;
  if (params.name) settings.name = params.name;
  syncConnectionFields(findCachedTarget(settings.targetId, verifyCode.value));
  activeView.value = "remote";
}
provide("navigateToRemote", navigateToRemote);
const accessCode = ref("");
const canShowSocksProxy = computed(() => accessCodeVerified.value || Boolean(getToken()));
const canConnect = computed(() => {
  if (!settings.gatewayHost || !settings.gatewayPort) return false;
  if (settings.protocol === "SOCKS5") return canShowSocksProxy.value;
  if (settings.protocol === "CONFERENCE") return Boolean(localConference.roomId.trim());
  return Boolean(settings.targetId.trim() || verifyCode.value.trim());
});

// 提供令牌给子页面（配置页、令牌页、网关页等）
provide("accessCode", accessCode);
provide("clientToken", computed(() => settings.token));
// 保存客户端令牌到 localStorage，子页面可独立读取
watch(() => settings.token, (val) => {
  if (val) localStorage.setItem("remote-client-token", val);
}, { immediate: true });

// ==================== 共享 WebSocket（端口 8082，网关状态 + 配置消息） ====================
const gatewayWsConnected = ref(false);
let gatewayWs: WebSocket | null = null;
const wsMessageHandlers = new Set<(data: any) => void>();

function getToken(): string {
  return settings.token || accessCode.value || localStorage.getItem("remote-client-token") || "";
}

provide("gatewayWsConnected", gatewayWsConnected);
provide("sendWsMessage", (data: string) => {
  if (gatewayWs?.readyState === WebSocket.OPEN) gatewayWs.send(data);
});
provide("onWsMessage", (handler: (data: any) => void) => {
  wsMessageHandlers.add(handler);
  return () => wsMessageHandlers.delete(handler);
});

function connectGatewayWs() {
  const host = location.hostname || "127.0.0.1";
  const token = getToken();
  const wsUrl = token ? `ws://${host}:8082?token=${token}` : `ws://${host}:8082`;
  if (gatewayWs) { gatewayWs.close(); gatewayWs = null; }
  gatewayWs = new WebSocket(wsUrl);
  gatewayWs.onopen = () => { gatewayWsConnected.value = true; };
  gatewayWs.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      for (const handler of wsMessageHandlers) handler(data);
    } catch { /* ignore */ }
  };
  gatewayWs.onclose = () => { gatewayWsConnected.value = false; setTimeout(connectGatewayWs, 3000); };
  gatewayWs.onerror = () => { gatewayWsConnected.value = false; };
}

function disconnectGatewayWs() {
  if (gatewayWs) { gatewayWs.close(); gatewayWs = null; }
  gatewayWsConnected.value = false;
}

// 检测是否为独立防火墙页面
const isFirewallView = computed(() => {
  const params = new URLSearchParams(window.location.search);
  return params.get("view") === "firewall";
});

/** 是否为全屏大屏视图（独立弹窗） */
const isFullscreenView = computed(() => {
  const params = new URLSearchParams(window.location.search);
  return params.get("view") === "fullscreen";
});

// 访问码验证 — ?accessCode= 启动时生成的随机编号
async function verifyAccessCode() {
  const params = new URLSearchParams(location.search);
  const code = params.get("accessCode") || localStorage.getItem("remote-access-code") || "";
  if (!code) {
    accessCodeVerified.value = false;
    return;
  }
  accessCode.value = code;
  try {
    const resp = await fetch(`/admin/api/token/verify?token=${code}`);
    if (resp.ok) {
      const data = await resp.json();
      accessCodeVerified.value = data.valid === true;
      if (data.valid) localStorage.setItem("remote-access-code", code);
    } else {
      console.warn("[accessCode] 验证请求失败, HTTP", resp.status);
      accessCodeVerified.value = false;
    }
  } catch (e) {
    console.warn("[accessCode] 验证请求异常:", e);
    accessCodeVerified.value = false;
  }
}

function openFullscreen() {
  // 优先使用 DesktopViewer 内置的浏览器全屏 API（保留设置面板可见）
  if (desktopViewerRef.value?.viewerContainer) {
    const container = desktopViewerRef.value.viewerContainer as HTMLElement;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
    return;
  }
  // 降级：打开新窗口（当 DesktopViewer 不可用时的备用方案）
  const sid = activeSessionId.value;
  if (!sid) return;
  const url = new URL(window.location.href);
  url.searchParams.set("view", "fullscreen");
  url.searchParams.set("session", sid);
  window.open(url.toString(), `fullscreen_${sid}`, "width=1920,height=1080");
}

async function copyAccessCode() {
  if (!accessCode.value) { ElMessage.warning("访问码未获取"); return; }
  try {
    await navigator.clipboard.writeText(accessCode.value);
    ElMessage.success("访问码已复制");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = accessCode.value;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select(); document.execCommand("copy");
    document.body.removeChild(ta);
    ElMessage.success("访问码已复制");
  }
}

/** 全屏视图：处理断开连接，断开后自动关闭弹窗 */
function handleFullscreenDisconnect(sessionId?: string) {
  if (sessionId) {
    disconnectSession(sessionId);
  } else if (activeSessionId.value) {
    disconnectSession(activeSessionId.value);
  } else {
    disconnectGateway();
  }
  ElMessage.info("已断开连接");
  // 全屏弹窗关闭后自动关窗
  if (isFullscreenView.value) {
    setTimeout(() => window.close(), 500);
  }
}

/** 全屏视图：切换浏览器全屏 */
function toggleFullscreenView() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
}

/** 全屏视图：ESC 退出弹窗 */
function exitFullscreenWindow() {
  handleFullscreenDisconnect();
}


onMounted(() => {
  verifyAccessCode();
  restoreSessionState();
  // 从 URL 参数读取 token 并注入 settings.token，使 WebSocket 连接携带认证令牌
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get("token");
  if (urlToken && !settings.token) settings.token = urlToken;
  connectGatewayWs();

  // 全屏视图：从 URL 读取 session 参数，等会话就绪后自动激活
  if (isFullscreenView.value) {
    const sessionFromUrl = urlParams.get("session");
    if (sessionFromUrl) {
      const unwatch = watch(() => [...sessions.keys()], (keys) => {
        if (keys.includes(sessionFromUrl)) {
          activeSessionId.value = sessionFromUrl;
          unwatch();
        }
      }, { immediate: true });
    }
  }
});

onUnmounted(() => {
  disconnectGatewayWs();
});

// 保存视图状态变化
watch(activeView, () => saveSessionState());
watch(sidebarCollapsed, () => saveSessionState());

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
  sendFileOp,
} = useRemoteControl({
  onConnected(sid) {
    ElMessage.success("连接成功: " + sid.slice(0, 8));
    addHistory();
    // 连接成功后自动隐藏左侧面板，给主体画面更多空间
    sidebarCollapsed.value = true;
  },
  onTerminalOutput(sid, data) {
    if (sid === activeSessionId.value) {
      const session = sessions.get(sid);
      if (session?.protocol === 'CONFERENCE') {
        if (conferenceRoomRef.value) {
          try {
            const msg = JSON.parse(data);
            conferenceRoomRef.value.handleWebRTCSignal(sid, msg);
          } catch (e) {
            console.warn('[RemoteControl] onTerminalOutput error:', e, 'data:', data.substring(0, 200));
          }
        } else {
          console.warn('[RemoteControl] CONFERENCE session but conferenceRoomRef is null, sid:', sid, 'data:', data.substring(0, 100));
        }
      } else if (sshTerminalRef.value) {
        sshTerminalRef.value.writeToTerminal(data);
      }
    }
  },
  onDesktopFrame(event: DesktopFrameEvent) {
    if (event.sessionId === activeSessionId.value && desktopViewerRef.value) {
      desktopViewerRef.value.renderVideoFrame(event.data, event.width, event.height, event.keyFrame, event.codec as any);
    }
  },
  onError(_sid, msg) {
    // 错误通过 connectToTarget() 的返回值统一展示，此处避免重复弹窗
    // 仅保留日志
    console.warn("[RemoteControl] 连接错误:", msg);
  },
  onDisconnected(_sid) {
    ElMessage.warning("连接已断开");
  },
  onDesktopMetrics(_sid, data) {
    if (desktopViewerRef.value) {
      desktopViewerRef.value.updateMetrics(data);
    }
  },
  onFileOp(sid, data) {
    if (sid === activeSessionId.value && sshFileManagerRef.value) {
      // 处理终端拖拽上传：pwd 返回后设置目标目录并上传
      if (data.action === 'pwd' && data.path && pendingTerminalUploadFiles.length > 0) {
        sshFileManagerRef.value.navigateTo(data.path);
        filePanelCollapsed.value = false;
        pendingPwd = false;
        sshFileManagerRef.value.startUploadFiles(pendingTerminalUploadFiles);
        pendingTerminalUploadFiles = [];
      }
      // 处理 pwd 目录同步（终端输入 pwd 触发的 file_op）
      if (data.action === 'pwd' && data.path && pendingPwd) {
        sshFileManagerRef.value.navigateTo(data.path);
        filePanelCollapsed.value = false;
        pendingPwd = false;
      }
      // 处理 cd 目录同步（终端输入 cd 后同步 SFTP 并刷新文件管理）
      if (data.action === 'cd' && data.path) {
        sshFileManagerRef.value.navigateTo(data.path);
        filePanelCollapsed.value = false;
      }
      sshFileManagerRef.value.handleFileOpResult(sid, data);
    }
  },
});

// 侧栏折叠按钮 — 始终在折叠时显示，允许手动展开/折叠
// 连接成功时自动收起，出错不自动展开（用户手动控制）

type CachedRemoteTarget = {
  entryType?: "target" | "agent";
  targetId?: string;
  verifyCode?: string;
  protocol?: string;
  protocols?: string[];
  transport?: string;
  codec?: string;
  codecs?: string[];
  token?: string;
};

const cachedTargets = ref<CachedRemoteTarget[]>([]);

function normalizeRemoteProtocol(protocol?: string): RemoteProtocol {
  const upper = String(protocol || "").toUpperCase();
  if (["SOCKS", "SOCKS5", "PROXY"].includes(upper)) return "SOCKS5";
  if (["SSH", "DESKTOP", "AUTO", "CONFERENCE"].includes(upper)) return upper as RemoteProtocol;
  return "AUTO";
}

function normalizeRemoteCodec(codec?: string): RemoteCodec {
  const upper = String(codec || "").toUpperCase();
  if (["H265", "HEVC"].includes(upper)) return "H265";
  if (["JPEG", "JPG"].includes(upper)) return "JPEG";
  return "H264";
}

function protocolLabel(protocol?: string) {
  const value = normalizeRemoteProtocol(protocol);
  if (value === "SSH") return "SSH";
  if (value === "DESKTOP") return "桌面";
  if (value === "SOCKS5") return "代理";
  if (value === "CONFERENCE") return "会议";
  return "自动";
}

function protocolTagType(protocol?: string) {
  const value = normalizeRemoteProtocol(protocol);
  if (value === "DESKTOP") return "primary";
  if (value === "SSH") return "success";
  if (value === "SOCKS5") return "warning";
  if (value === "CONFERENCE") return "info";
  return "info";
}

function preferredProtocol(source: CachedRemoteTarget): RemoteProtocol {
  if (source.protocol) return normalizeRemoteProtocol(source.protocol);
  const protocols = (source.protocols || []).map(normalizeRemoteProtocol);
  if (settings.protocol !== "AUTO" && protocols.includes(settings.protocol)) return settings.protocol;
  if (protocols.includes("DESKTOP")) return "DESKTOP";
  if (protocols.includes("SSH")) return "SSH";
  if (protocols.includes("SOCKS5")) return "SOCKS5";
  if (protocols.includes("CONFERENCE")) return "CONFERENCE";
  return "AUTO";
}

function findCachedTarget(targetId?: string, code?: string) {
  const tid = targetId?.trim();
  const vcode = code?.trim();
  return cachedTargets.value.find((item) => tid && item.targetId === tid)
    || cachedTargets.value.find((item) => vcode && item.verifyCode === vcode)
    || null;
}

function syncConnectionFields(source?: CachedRemoteTarget | null, overwriteToken = false) {
  if (!source) return;
  if (source.entryType === "target" && source.targetId && !settings.targetId.trim()) settings.targetId = source.targetId;
  if (source.verifyCode && (overwriteToken || !verifyCode.value.trim())) verifyCode.value = source.verifyCode;
  const nextProtocol = preferredProtocol(source);
  if (nextProtocol !== "AUTO") settings.protocol = nextProtocol;
  const codec = source.codec || source.codecs?.[0];
  if (codec) settings.codec = normalizeRemoteCodec(codec);
  if (source.transport) settings.transport = source.transport as TransportType;
  if (source.token && (overwriteToken || !settings.token || settings.token === accessCode.value)) settings.token = source.token;
}

const matchedTargetProtocol = computed(() => {
  const cached = findCachedTarget(settings.targetId, undefined);
  return cached ? preferredProtocol(cached) : null;
});

const connectedSessions = computed(() => {
  const list: Array<{ sessionId: string; protocol: string; transport?: string; state: string }> = [];
  sessions.forEach((s) => {
    if (s.state === "connected") list.push({ sessionId: s.sessionId, protocol: s.protocol, transport: s.transport, state: s.state });
  });
  return list;
});

provide("controller-info", {
  connectionState,
  sessionCount: computed(() => connectedSessions.value.length),
  updateTargets: (list: CachedRemoteTarget[]) => { cachedTargets.value = list; },
});

watch(() => settings.targetId, (value) => syncConnectionFields(findCachedTarget(value, undefined)));
watch(verifyCode, (value) => syncConnectionFields(findCachedTarget(undefined, value)));
watch(() => settings.protocol, (value) => {
  if (value === "DESKTOP" && !settings.codec) settings.codec = "H264";
  if (value === "SOCKS5") settings.transport = "TCP";
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

// 文件面板拖拽
function startFilePanelDrag(e: MouseEvent) {
  filePanelDragging = true;
  const startX = e.clientX;
  const startWidth = filePanelWidth.value;
  const onMove = (ev: MouseEvent) => {
    if (!filePanelDragging) return;
    filePanelWidth.value = Math.max(260, Math.min(800, startWidth - (ev.clientX - startX)));
  };
  const onUp = () => {
    filePanelDragging = false;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
}

/** 解析 AUTO 协议：从 targetId 后缀或 Target 列表推断 */
function resolveProtocol(targetId: string, protocol: string): RemoteProtocol {
  if (protocol !== "AUTO") return protocol as RemoteProtocol;
  // 尝试从缓存的 target 列表查询（GatewayManage 的 fetchInfo 会刷新）
  const cached = cachedTargets.value.find((t: any) => t.targetId === targetId);
  if (cached?.protocol) return cached.protocol as RemoteProtocol;
  // fallback: 后缀检测（兼容旧格式）
  const upper = targetId.toUpperCase();
  if (upper.endsWith("-DESKTOP") || upper.includes("_DESKTOP")) return "DESKTOP";
  if (upper.endsWith("-SSH") || upper.includes("_SSH")) return "SSH";
  return "DESKTOP";
}

async function handleConnect() {
  if (settings.protocol === "SOCKS5") {
    activeView.value = "proxy";
    ElMessage.info("已切换到 SOCK 代理管理页");
    return;
  }

  // 校验
  if (settings.protocol === 'CONFERENCE') {
    if (!localConference.roomId.trim()) {
      ElMessage.error("请填写会议室 ID");
      return;
    }
  } else if (!settings.targetId.trim() && !verifyCode.value.trim()) {
    ElMessage.error("请填写目标 ID 或验证码");
    return;
  }

  if (settings.protocol === 'CONFERENCE') {
    const url = buildConferenceJoinUrl(localConference.roomId.trim(), localConference.mode);
    window.open(url, `conference_${localConference.roomId.trim()}`, "width=1280,height=820");
    return;
  }

  // 解析 AUTO 协议
  const resolvedProtocol = settings.targetId.trim() ? resolveProtocol(settings.targetId, settings.protocol) : settings.protocol;
  const effectiveProtocol = resolvedProtocol;

  // 如果已有活跃会话且协议匹配，直接复用（不重复创建临时会话）
  if (activeSession.value && activeSession.value.protocol === effectiveProtocol) {
    // 已存在相同协议的会话，connectToTarget 会复用 Gateway 连接
  }

  const cfg: RemoteConnectionSettings = {
    gatewayUrl: `ws://${settings.gatewayHost}:${settings.gatewayPort}`,
    targetId: settings.targetId.trim() || undefined,
    protocol: effectiveProtocol,
    transport: settings.transport,
    codec: settings.codec,
    verifyCode: verifyCode.value.trim() || undefined,
    token: settings.token || accessCode.value || undefined,
    heartbeatInterval: settings.heartbeatInterval * 1000,
    heartbeatTimeout: settings.heartbeatTimeout * 1000,
    conference: effectiveProtocol === 'CONFERENCE' ? {
      roomId: localConference.roomId,
      mode: localConference.mode,
    } : undefined,
  };
  const result = await connectToTarget(cfg);
  if (!result.ok) ElMessage.error(result.error || "连接失败，请检查配置");
}

function handleDisconnect() {
  disconnectGateway();
  ElMessage.info("已断开所有连接");
}

function handleSessionDisconnect(sessionId: string) {
  disconnectSession(sessionId);
  ElMessage.info("已断开会话");
}

function handleTerminalInput(sid: string, data: string) {
  sendInput(sid, data);
  // 追踪 pwd 和 cd 命令 — 同步文件管理面板目录
  for (const ch of data) {
    if (ch === '\r' || ch === '\n') {
      const line = terminalInputBuffer.trim();
      if (line === 'pwd') {
        pendingPwd = true;
        sendFileOp(sid, 'pwd');
      } else if (line.startsWith('cd ')) {
        const path = line.substring(3).trim().replace(/^["']|["']$/g, '');
        if (path) {
          sendFileOp(sid, 'cd', { path });
        }
      }
      terminalInputBuffer = '';
    } else if (ch === '\x7f') {
      terminalInputBuffer = terminalInputBuffer.slice(0, -1);
    } else {
      terminalInputBuffer += ch;
    }
  }
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
/* ── App Shell ── */
.app-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}
/* ── 头部 ── */
.app-header {
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}

/* 顶部装饰线 */
.header-accent {
  height: 3px;
  background: var(--app-primary);
}

/* 毛玻璃容器 */
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 56px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

html.dark .header-content {
  background: rgba(30, 30, 35, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  height: 100%;
}

/* 品牌区域 */
.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 20px;
  border-right: 1px solid var(--el-border-color-light);
}

.brand-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--app-primary);
  color: var(--el-color-white);
  box-shadow: 0 2px 8px rgba(var(--app-primary-rgb), 0.3);
}

.header-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--app-primary);
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.header-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
}

.header-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  height: 40px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  border-radius: 8px;
  white-space: nowrap;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-tab .tab-indicator {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 60%;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: var(--app-primary);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s;
  opacity: 0;
}

.header-tab:hover {
  color: var(--el-text-color-primary);
  background: rgba(var(--app-primary-rgb), 0.06);
}

.header-tab.active {
  color: var(--app-primary);
  font-weight: 600;
  background: rgba(var(--app-primary-rgb), 0.08);
}

.header-tab.active .tab-indicator {
  transform: translateX(-50%) scaleX(1);
  opacity: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.token-display .el-tag {
  cursor: pointer;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  background: var(--el-fill-color-light) !important;
  border-color: var(--el-border-color) !important;
  color: var(--el-text-color-secondary) !important;
  border-radius: 6px !important;
  padding: 0 10px !important;
  height: 24px;
  transition: all 0.2s;
}
.token-display .el-tag:hover {
  background: var(--el-fill-color) !important;
  color: var(--el-text-color-primary) !important;
}

/* ── 连接管理图标 ── */
.history-icon-btn {
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: color 0.2s;
}
.history-icon-btn:hover {
  color: var(--el-color-primary);
}

.history-actions {
  display: flex;
  gap: 2px;
  margin-left: auto;
}

.remote-control-page {
  display: flex;
  flex: 1;
  min-height: 0;
  background: var(--el-bg-color);
  position: relative;
}

/* ── 侧栏折叠按钮 ── */
.sidebar-toggle-zone {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 32px;
  z-index: 10;
  opacity: 0.15;
  transition: opacity 0.3s ease;
  pointer-events: auto;
}
.sidebar-toggle-zone:hover { opacity: 1; }

.sidebar-toggle.collapsed {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 11;
  width: 24px;
  height: 60px;
  border: 1px solid var(--el-border-color);
  border-left: none;
  border-radius: 0 6px 6px 0;
  background: var(--el-bg-color-overlay);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  transition: all 0.2s;
}
.sidebar-toggle.collapsed:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

/* ── 文件面板包装器 ── */
.file-panel-wrapper {
  display: flex;
  position: relative;
  flex-shrink: 0;
}

/* ── 文件面板切换按钮（吸附在面板左侧边框） ── */
.file-panel-toggle-zone {
  position: absolute;
  left: -28px;
  top: 0;
  bottom: 0;
  width: 28px;
  z-index: 20;
  opacity: 0.15;
  transition: opacity 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.file-panel-toggle-zone:hover { opacity: 1; }

.file-panel-float-toggle {
  width: 20px;
  height: 48px;
  border: 1px solid var(--el-border-color);
  border-right: none;
  border-radius: 6px 0 0 6px;
  background: var(--el-bg-color-overlay);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  transition: all 0.2s;
  border: none;
  background: transparent;
  padding: 0;
}
.file-panel-toggle-zone:hover .file-panel-float-toggle {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-border-color);
  border-right: none;
}

/* ── 文件面板折叠时的展开按钮 ── */
.file-panel-expand-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  flex-shrink: 0;
  cursor: pointer;
  opacity: 0.25;
  transition: opacity 0.3s ease;
  z-index: 20;
  border-left: 1px solid var(--el-border-color-lighter);
}
.file-panel-expand-zone:hover {
  opacity: 1;
}
.file-panel-expand-btn {
  width: 20px;
  height: 48px;
  border: 1px solid var(--el-border-color);
  border-left: none;
  border-radius: 0 6px 6px 0;
  background: var(--el-bg-color-overlay);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  transition: all 0.2s;
}
.file-panel-expand-zone:hover .file-panel-expand-btn {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
}

.sidebar {
  min-width: 0;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay);
  backdrop-filter: blur(8px);
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
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-section {
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 14px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}
.section-title :deep(svg) {
  color: var(--el-color-primary);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.sidebar-title {
  font-size: 16px;
  font-weight: 800;
  margin: 0;
  color: var(--el-color-primary);
  letter-spacing: -0.3px;
}

.settings-form :deep(.el-form-item__label) {
  color: var(--el-text-color-regular);
  font-size: 12px;
}
.settings-form :deep(.el-input__wrapper) {
  background: var(--el-fill-color-light);
  border-color: var(--el-border-color);
  box-shadow: none;
}
.settings-form :deep(.el-input__wrapper:hover) {
  border-color: var(--el-color-primary-light-5);
}
.settings-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}
.settings-form :deep(.el-input__inner) {
  color: var(--el-text-color-primary);
}
.settings-form :deep(.el-input__prefix .el-icon) {
  color: var(--el-text-color-secondary);
}
.settings-form :deep(.el-select .el-input__wrapper) {
  background: var(--el-fill-color-light);
}
.settings-form :deep(.el-input-number) {
  --el-input-number-bg-color: var(--el-fill-color-light);
}

.status-bar { margin-top: 8px; text-align: center; }

.form-item-hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
  line-height: 1.4;
}
.empty-hint {
  text-align: center;
  color: var(--el-text-color-placeholder);
  padding: 16px 0;
  font-size: 12px;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.2s;
}
.session-item:hover {
  background: var(--el-fill-color-light);
  border-color: var(--el-color-primary-light-7);
}
.session-item.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
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
  background: var(--el-bg-color);
  position: relative;
}

/* ── 浮动会话工具栏 ── */
.session-toolbar {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 50;
  display: flex;
  gap: 6px;
  pointer-events: none;
}
.session-toolbar > * { pointer-events: auto; }

.tb-btn {
  background: rgba(0, 0, 0, 0.55) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: rgba(255, 255, 255, 0.85) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}
.tb-btn:hover {
  background: rgba(0, 0, 0, 0.7) !important;
  color: var(--el-color-white) !important;
  transform: scale(1.05);
}

/* SSH 工作区 */
.ssh-workspace {
  display: flex;
  flex: 1;
  min-height: 0;
  position: relative;
}
.ssh-terminal-zone {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}
.ssh-terminal-area {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.ssh-file-panel {
  border-left: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.file-panel-drag-handle {
  width: 4px;
  cursor: col-resize;
  background: transparent;
  flex-shrink: 0;
  position: relative;
  z-index: 5;
  transition: background 0.15s;
}
.file-panel-drag-handle:hover { background: var(--el-color-primary-light-5); }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: var(--el-text-color-placeholder);
}
.empty-state-icon {
  opacity: 0.4;
  margin-bottom: 8px;
}
.empty-state h2 {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  color: var(--el-color-primary);
}
/* 连接中动画 */
.is-loading {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── 终端拖拽上传覆盖层 ── */
.terminal-drop-overlay {
  position: absolute;
  inset: 0;
  background: var(--el-color-primary-light-9);
  border: 2px dashed var(--el-color-primary);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 30;
  color: var(--el-color-primary);
  pointer-events: none;
}
.terminal-drop-overlay p {
  font-size: 14px;
  margin: 0;
}

/* ── 细滚动条 ── */
.thin-scroller::-webkit-scrollbar { width: 5px; height: 5px; }
.thin-scroller::-webkit-scrollbar-track { background: transparent; }
.thin-scroller::-webkit-scrollbar-thumb { background: var(--el-fill-color-dark); border-radius: 3px; }
.thin-scroller::-webkit-scrollbar-thumb:hover { background: var(--el-text-color-disabled); }

.section-title-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ── 全屏大屏视图 ── */
.fullscreen-view {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--el-color-black);
  display: flex;
  flex-direction: column;
}

.fullscreen-view .desktop-viewer {
  flex: 1;
  min-height: 0;
}

/* 全屏工具栏（悬浮右上角，鼠标移入显示） */
.fs-toolbar {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(8px);
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}
.fullscreen-view:hover .fs-toolbar,
.fs-toolbar:hover {
  opacity: 1;
  pointer-events: auto;
}

.fs-session-id {
  font-size: 11px;
  font-family: 'SF Mono', monospace;
  color: rgba(255, 255, 255, 0.6);
  margin-right: 4px;
}

.fs-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}
.fs-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--el-color-white);
}
.fs-btn-danger:hover {
  background: rgba(var(--el-color-danger-rgb), 0.3);
  border-color: rgba(var(--el-color-danger-rgb), 0.5);
  color: var(--el-color-danger);
}
</style>

<style>
/* el-popover 全局样式（teleport 到 body，scoped 无法覆盖） */
.popover-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}
.popover-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}
.popover-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  transition: background 0.15s;
  cursor: pointer;
}
.popover-item:hover {
  background: var(--el-fill-color-light);
}
.popover-item.active {
  background: var(--el-color-primary-light-9);
}
.popover-item-name {
  font-size: 12px;
  font-family: 'SF Mono', monospace;
  color: var(--el-text-color-regular);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.popover-item-actions {
  display: flex;
  gap: 2px;
  margin-left: auto;
  flex-shrink: 0;
}
.popover-divider {
  height: 1px;
  background: var(--el-border-color-lighter);
  margin: 6px 0 10px;
}
</style>
