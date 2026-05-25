<template>
  <!-- 独立防火墙页面（通过 ?view=firewall 打开） -->
  <div v-if="isFirewallView" class="app-shell" style="background: var(--el-bg-color-page);">
    <FirewallManage />
  </div>

  <!-- 正常主应用 -->
  <div v-else class="app-shell">
    <!-- 头部 -->
    <div v-if="accessCodeVerified" class="app-header">
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
            <button v-if="accessCodeVerified" class="header-tab" :class="{ active: activeView === 'proxy' }" @click="activeView = 'proxy'">
              <el-icon :size="14"><Share /></el-icon> SOCKS5
              <span class="tab-indicator"></span>
            </button>
            <button v-if="accessCodeVerified" class="header-tab" :class="{ active: activeView === 'apigateway' }" @click="activeView = 'apigateway'">
              <el-icon :size="14"><Aim /></el-icon> 网关
              <span class="tab-indicator"></span>
            </button>
            <button v-if="accessCodeVerified" class="header-tab" :class="{ active: activeView === 'spring-api-gateway' }" @click="activeView = 'spring-api-gateway'">
              <el-icon :size="14"><Connection /></el-icon> API 网关
              <span class="tab-indicator"></span>
            </button>
            <button v-if="accessCodeVerified" class="header-tab" :class="{ active: activeView === 'config' }" @click="activeView = 'config'">
              <el-icon :size="14"><Setting /></el-icon> 配置
              <span class="tab-indicator"></span>
            </button>
            <button v-if="accessCodeVerified" class="header-tab" :class="{ active: activeView === 'token' }" @click="activeView = 'token'">
              <el-icon :size="14"><Key /></el-icon> 令牌
              <span class="tab-indicator"></span>
            </button>
          </div>
        </div>
        <div class="header-right">
          <el-tag :type="statusTagType" effect="dark" size="small">{{ statusText }}</el-tag>
          <el-button v-if="activeSession && activeSession.protocol === 'DESKTOP'" size="small" type="primary" plain @click="openFullscreen">
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
      <!-- 侧栏折叠按钮（折叠时显示）- 自动隐藏 -->
      <div class="sidebar-toggle-zone">
        <button v-if="sidebarCollapsed" class="sidebar-toggle collapsed" @click="sidebarCollapsed = false" title="展开配置">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <!-- 左侧连接面板 -->
      <div ref="sidebarRef" class="sidebar" :class="{ collapsed: sidebarCollapsed }" :style="{ width: sidebarCollapsed ? '0px' : sidebarWidth + 'px' }">
        <div class="sidebar-inner thin-scroller">
          <!-- 未连接：连接表单 -->
          <template v-if="connectionState !== 'connected'">
            <div class="sidebar-section">
              <div class="section-title">
                <IconifyIconOnline icon="mdi:connection" />
                <span>连接配置</span>
                <el-icon class="history-icon-btn" title="连接管理" @click="connectionManagerVisible = true"><Clock /></el-icon>
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
                  <el-input-number v-model="settings.gatewayPort" :min="1" :max="65535" style="width: 100%" placeholder="端口" />
                </el-form-item>
                <el-form-item label="目标 ID">
                  <el-input v-model="settings.targetId" placeholder="e.g. a96bf074017f">
                    <template #prefix><el-icon><Monitor /></el-icon></template>
                  </el-input>
                </el-form-item>
                <el-form-item label="验证码">
                  <el-input v-model="verifyCode" placeholder="输入被控端 6 位验证码">
                    <template #prefix><el-icon><Key /></el-icon></template>
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
                <el-form-item label="客户端令牌">
                  <el-input v-model="settings.token" placeholder="客户端 API 令牌" type="password" show-password>
                    <template #prefix><el-icon><Key /></el-icon></template>
                  </el-input>
                </el-form-item>
                <el-form-item label="连接超时（秒）">
                  <el-input-number v-model="settings.connectTimeout" :min="5" :max="120" :step="5" style="width: 100%" />
                </el-form-item>
                <el-button type="primary" size="large" :loading="connectionState === 'connecting'" :disabled="!settings.gatewayHost || !settings.gatewayPort || !settings.targetId || !verifyCode" style="width: 100%; margin-top: 8px" @click="handleConnect">
                  {{ connectionState === "connecting" ? "连接中..." : "连接" }}
                </el-button>
              </el-form>
            </div>
          </template>

          <!-- 已连接：断开按钮 -->
          <template v-else>
            <div class="sidebar-section">
              <el-button type="danger" plain size="large" style="width: 100%; margin-bottom: 12px" @click="handleDisconnect">
                断开连接
              </el-button>
            </div>
          </template>

          <!-- 会话列表 -->
          <div class="sidebar-section">
            <div class="section-title">
              <IconifyIconOnline icon="mdi:view-dashboard-outline" />
              <span>会话列表</span>
              <el-tag v-if="connectedSessions.length" size="small" type="success" effect="dark" style="margin-left:auto">{{ connectedSessions.length }}</el-tag>
            </div>
            <div v-if="connectedSessions.length === 0" class="empty-hint">暂无连接</div>
            <div v-else class="session-list">
              <div v-for="s in connectedSessions" :key="s.sessionId" class="session-item" :class="{ active: s.sessionId === activeSessionId }" @click="activeSessionId = s.sessionId">
                <el-tag type="success" size="small" effect="dark">{{ s.protocol }}</el-tag>
                <span class="session-id">{{ s.sessionId.slice(0, 12) }}...</span>
                <el-button text size="small" type="danger" @click.stop="disconnectSession(s.sessionId)">断开</el-button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- 拖拽手柄 -->
      <div v-if="!sidebarCollapsed" class="drag-handle" @mousedown.prevent="startDrag"></div>

      <!-- 右侧内容区 -->
      <div class="content">
        <!-- SSH 会话：终端 + 文件管理面板 -->
        <template v-if="activeSession && activeSession.protocol === 'SSH'">
          <div class="ssh-workspace" @dragover.prevent="onTerminalDragOver" @dragleave="onTerminalDragLeave" @drop.prevent="onTerminalDrop">
            <div v-if="terminalDragging" class="terminal-drop-overlay">
              <el-icon :size="48"><UploadFilled /></el-icon>
              <p>拖拽文件到此处上传</p>
            </div>
            <SshTerminal ref="sshTerminalRef" :session-id="activeSessionId" :connection-state="activeSession?.state || 'disconnected'" @input="handleTerminalInput" @resize="handleTerminalResize" class="ssh-terminal-area" />
            <div class="file-panel-toggle-zone">
              <button class="file-panel-float-toggle" :class="{ collapsed: filePanelCollapsed }" @click="filePanelCollapsed = !filePanelCollapsed" :title="filePanelCollapsed ? '展开文件管理' : '收起文件管理'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline v-if="filePanelCollapsed" points="9 18 15 12 9 6" />
                  <polyline v-else points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>
            <div v-show="!filePanelCollapsed" class="file-panel-drag-handle" @mousedown.prevent="startFilePanelDrag"></div>
            <SshFileManager v-show="!filePanelCollapsed" ref="sshFileManagerRef" :session-id="activeSessionId" :connection-state="activeSession?.state || 'disconnected'" :send-file-op="sendFileOp" class="ssh-file-panel" :style="{ width: filePanelWidth + 'px' }" />
          </div>
        </template>
        <DesktopViewer v-else-if="activeSession && activeSession.protocol === 'DESKTOP'" ref="desktopViewerRef" :session-id="activeSessionId" :connection-state="activeSession?.state || 'disconnected'" @mouse-event="handleMouseEvent" @key-event="handleKeyEvent" @desktop-control="handleDesktopControl" />
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
    <ProxyManage v-show="activeView === 'proxy'" />

    <!-- API 网关页 -->
    <SpringApiGateway v-show="activeView === 'spring-api-gateway'" />

    <!-- 网关配置页 -->
    <div v-show="activeView === 'config'">
      <GatewayConfig />
    </div>

    <!-- 令牌管理页 -->
    <TokenManage v-show="activeView === 'token'" />

    <!-- API 网关页 -->
    <ApiGateway v-show="activeView === 'apigateway'" />

    <!-- 连接管理抽屉 -->
    <el-drawer v-model="connectionManagerVisible" title="连接管理" size="380px" direction="rtl">
      <div v-if="connectionHistory.length === 0" class="empty-hint" style="margin-top: 40px;">暂无历史连接</div>
      <div v-else class="session-list">
        <div v-for="(h, idx) in connectionHistory" :key="idx" class="session-item" :title="'双击自动连接'" @dblclick="reconnect(h); connectionManagerVisible = false">
          <el-tag size="small" type="info" effect="plain">{{ h.protocol === 'AUTO' ? '自动' : h.protocol }}</el-tag>
          <span class="session-id">{{ h.name || h.targetId }}</span>
          <div class="history-actions">
            <el-button text size="small" @click.stop="reconnect(h); connectionManagerVisible = false">连接</el-button>
            <el-button text size="small" type="danger" @click.stop="removeHistory(idx)">删除</el-button>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, provide, onMounted, watch } from "vue";
import { Link, Monitor, EditPen, CopyDocument, Key, Connection, Aim, Setting, Share, UploadFilled, Warning, Clock, FullScreen } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import SshTerminal from "@pages/remote/components/SshTerminal.vue";
import SshFileManager from "@pages/remote/components/SshFileManager.vue";
import DesktopViewer from "@pages/remote/components/DesktopViewer.vue";
import GatewayConfig from "./GatewayConfig.vue";
import ProxyManage from "./ProxyManage.vue";
import TokenManage from "./TokenManage.vue";
import ApiGateway from "./ApiGateway.vue";
import SpringApiGateway from "./SpringApiGateway.vue";
import FirewallManage from "./FirewallManage.vue";
import { useRemoteControl } from "@pages/remote";
import type {
  ConnectionSettings as RemoteConnectionSettings,
  RemoteProtocol,
  RemoteCodec,
  DesktopFrameEvent,
} from "@pages/remote";

const sshTerminalRef = ref<InstanceType<typeof SshTerminal>>();
const sshFileManagerRef = ref<InstanceType<typeof SshFileManager>>();
const desktopViewerRef = ref<InstanceType<typeof DesktopViewer>>();

const settings = reactive({
  name: "",
  gatewayHost: "127.0.0.1",
  gatewayPort: 8082,
  targetId: "",
  protocol: "DESKTOP" as RemoteProtocol,
  codec: "H264" as RemoteCodec,
  token: "",
  connectTimeout: 15,
});

const verifyCode = ref("");
const connectionManagerVisible = ref(false);

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
const pendingUploadFiles = ref<File[]>([]);

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
  if (!files || files.length === 0) return;
  pendingUploadFiles.value = Array.from(files);
  ElMessage.info(`已接收 ${files.length} 个文件，切换到文件管理面板查看上传进度`);
  if (filePanelCollapsed.value) {
    filePanelCollapsed.value = false;
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
    codec: settings.codec,
    token: settings.token || undefined,
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
const accessCode = ref("");

// 提供令牌给子页面（配置页、令牌页、网关页等）
provide("accessCode", accessCode);
provide("clientToken", computed(() => settings.token));
// 保存客户端令牌到 localStorage，子页面可独立读取
watch(() => settings.token, (val) => {
  if (val) localStorage.setItem("remote-client-token", val);
}, { immediate: true });

// 检测是否为独立防火墙页面
const isFirewallView = computed(() => {
  const params = new URLSearchParams(window.location.search);
  return params.get("view") === "firewall";
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
    const host = location.hostname || "127.0.0.1";
    const mgmtPort = 3000;
    const resp = await fetch(`http://${host}:${mgmtPort}/admin/api/token/verify?token=${code}`);
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
  const sid = activeSessionId.value;
  if (!sid) return;
  const params = new URLSearchParams(window.location.search);
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


onMounted(() => {
  verifyAccessCode();
  restoreSessionState();
});

// 保存视图状态变化
watch(activeView, () => saveSessionState());
watch(sidebarCollapsed, () => saveSessionState());

// 当文件管理器就绪时，处理拖拽上传的文件
watch(pendingUploadFiles, (files) => {
  if (files.length > 0 && sshFileManagerRef.value) {
    sshFileManagerRef.value.startUploadFiles(files);
    pendingUploadFiles.value = [];
  }
});

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
    sidebarCollapsed.value = false;
  },
  onTerminalOutput(sid, data) {
    if (sid === activeSessionId.value && sshTerminalRef.value) {
      sshTerminalRef.value.writeToTerminal(data);
      // pwd 输出检测：自动切换文件管理器目录
      if (pendingPwd) {
        const match = data.match(/^(\/[^\s\n\r\x1b]+)/);
        if (match) {
          const path = match[1].trim();
          sshFileManagerRef.value?.navigateTo(path);
          pendingPwd = false;
          // 自动展开文件面板
          filePanelCollapsed.value = false;
        }
      }
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
  onFileOp(sid, data) {
    if (sid === activeSessionId.value && sshFileManagerRef.value) {
      sshFileManagerRef.value.handleFileOpResult(sid, data);
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

// 向子组件注入控制端信息，同时接收 Target 缓存
const cachedTargets = ref<any[]>([]);
provide("controller-info", {
  connectionState,
  sessionCount: computed(() => connectedSessions.value.length),
  updateTargets: (list: any[]) => { cachedTargets.value = list; },
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
  // 校验必填项
  if (!settings.targetId.trim()) {
    ElMessage.error("请填写目标 ID");
    return;
  }
  if (!verifyCode.value.trim()) {
    ElMessage.error("请填写被控端验证码");
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
    verifyCode: verifyCode.value.trim(),
    token: settings.token || undefined,
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
  // 追踪 pwd 命令
  for (const ch of data) {
    if (ch === '\r' || ch === '\n') {
      if (terminalInputBuffer.trim() === 'pwd') pendingPwd = true;
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

/* 顶部渐变装饰线 */
.header-accent {
  height: 3px;
  background: linear-gradient(90deg,
    var(--app-primary, #006ae6) 0%,
    var(--app-primary-light-3, #4a9eff) 50%,
    var(--app-primary, #006ae6) 100%
  );
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
  background: linear-gradient(135deg, var(--app-primary, #006ae6), var(--app-primary-light-3, #4a9eff));
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 106, 230, 0.3);
}

.header-title {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--app-primary, #006ae6), var(--app-primary-light-3, #4a9eff));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
  background: linear-gradient(90deg, var(--app-primary, #006ae6), var(--app-primary-light-3, #4a9eff));
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s;
  opacity: 0;
}

.header-tab:hover {
  color: var(--el-text-color-primary);
  background: rgba(0, 106, 230, 0.06);
}

.header-tab.active {
  color: var(--app-primary, #006ae6);
  font-weight: 600;
  background: rgba(0, 106, 230, 0.08);
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
  margin-left: auto;
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

/* ── 文件面板切换按钮 ── */
.file-panel-toggle-zone {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 28px;
  z-index: 10;
  opacity: 0.15;
  transition: opacity 0.3s ease;
  pointer-events: auto;
}
.file-panel-toggle-zone:hover { opacity: 1; }

.file-panel-float-toggle {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 11;
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
}
.file-panel-float-toggle:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.file-panel-float-toggle.collapsed { right: 0; }

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
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
}

/* SSH 工作区 */
.ssh-workspace {
  display: flex;
  flex: 1;
  min-height: 0;
  position: relative;
}
.ssh-terminal-area {
  flex: 1;
  min-width: 0;
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
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3), var(--el-color-primary-light-5));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.empty-state p {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  margin: 0;
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
</style>
