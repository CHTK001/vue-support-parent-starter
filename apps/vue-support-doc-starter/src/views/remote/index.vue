<template>
  <div class="remote-page">
    <!-- Top bar with back button -->
    <div class="remote-topbar">
      <el-button text @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        {{ t('remote.backToDashboard') }}
      </el-button>
      <h3 class="topbar-title">{{ t('menu.remote') }}</h3>
      <el-button text @click="showConfig = true" class="config-btn">
        <el-icon><Setting /></el-icon>
      </el-button>
    </div>

    <div class="remote-body">
      <!-- Left: Agent List -->
    <div class="remote-sidebar">
      <div class="sidebar-header">
        <h3>{{ t('remote.agents') }}</h3>
        <el-tooltip :content="t('common.refresh')" placement="top">
          <el-button circle size="small" @click="refreshData" :loading="store.loading">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
      </div>

      <!-- Gateway Connection -->
      <div class="gateway-status">
        <span :class="['ws-dot', store.wsState]" />
        <span class="ws-label">{{ wsLabel }}</span>
        <el-button v-if="store.wsState === 'disconnected'" size="small" text @click="store.connectWs()">
          {{ t('remote.connect') }}
        </el-button>
        <el-button v-else size="small" text @click="store.disconnectWs()">
          {{ t('remote.disconnect') }}
        </el-button>
      </div>

      <!-- Agent Cards -->
      <div class="agent-list">
        <div v-if="store.error" class="agent-error">
          <el-icon><WarningFilled /></el-icon>
          <span>{{ store.error }}</span>
        </div>

        <div v-if="store.onlineAgents.length === 0 && !store.loading && !store.error" class="agent-empty">
          <el-icon :size="32"><Monitor /></el-icon>
          <p>{{ t('remote.noAgents') }}</p>
        </div>

        <div
          v-for="agent in store.onlineAgents"
          :key="agent.agentId"
          :class="['agent-card', { active: selectedAgent?.agentId === agent.agentId }]"
          @click="selectAgent(agent)"
        >
          <div class="agent-card-header">
            <span class="agent-dot online" />
            <span class="agent-name">{{ agent.agentId.slice(0, 12) }}</span>
            <span class="agent-type">{{ agent.agentType }}</span>
          </div>
          <div class="agent-card-meta">
            <span>{{ agent.ipAddress }}</span>
            <span class="agent-rtt">{{ agent.lastRttMs }}ms</span>
          </div>
          <div class="agent-card-caps">
            <el-tag v-if="agent.capabilities?.rustdesk_id" size="small" type="success">RustDesk</el-tag>
            <el-tag v-for="p in agent.protocols?.slice(0, 3)" :key="p" size="small" effect="plain">{{ p }}</el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: Session View -->
    <div class="remote-main">
      <!-- No agent selected -->
      <div v-if="!selectedAgent" class="remote-empty">
        <el-icon :size="64" color="var(--nexus-accent)"><Link /></el-icon>
        <h2>{{ t('remote.selectAgent') }}</h2>
        <p>{{ t('remote.selectAgentDesc') }}</p>
      </div>

      <!-- Agent selected, no active session -->
      <div v-else-if="!activeSession" class="remote-connect">
        <div class="connect-card">
          <div class="connect-header">
            <el-icon :size="24"><Monitor /></el-icon>
            <h3>{{ selectedAgent.agentId.slice(0, 16) }}</h3>
          </div>
          <div class="connect-info">
            <div class="info-row">
              <span class="info-label">IP</span>
              <span class="info-value">{{ selectedAgent.ipAddress }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Type</span>
              <span class="info-value">{{ selectedAgent.agentType }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Verify Code</span>
              <span class="info-value mono">{{ selectedAgent.verifyCode || '—' }}</span>
            </div>
            <div v-if="selectedAgent.capabilities?.rustdesk_id" class="info-row">
              <span class="info-label">RustDesk ID</span>
              <span class="info-value mono">{{ selectedAgent.capabilities.rustdesk_id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Protocols</span>
              <span class="info-value">{{ selectedAgent.protocols?.join(', ') }}</span>
            </div>
          </div>

          <!-- SSH Auth (optional) -->
          <div v-if="showSshAuth" class="ssh-auth">
            <el-input v-model="sshHost" placeholder="Host" size="small" />
            <el-input v-model="sshPort" placeholder="Port" size="small" style="width: 80px" />
            <el-input v-model="sshUser" placeholder="User" size="small" />
            <el-input v-model="sshPass" placeholder="Password" type="password" size="small" show-password />
          </div>

          <!-- Connect buttons -->
          <div class="connect-actions">
            <el-button type="primary" @click="handleConnect('DESKTOP')" :disabled="store.wsState === 'disconnected'">
              <el-icon><Monitor /></el-icon> {{ t('remote.desktop') }}
            </el-button>
            <el-button @click="handleConnect('SSH')" :disabled="store.wsState === 'disconnected'">
              <el-icon><VideoCamera /></el-icon> {{ t('remote.terminal') }}
            </el-button>
            <el-button @click="handleConnect('AUTO')" :disabled="store.wsState === 'disconnected'">
              <el-icon><Link /></el-icon> Auto
            </el-button>
          </div>

          <div v-if="store.wsState === 'disconnected'" class="connect-warn">
            <el-icon><WarningFilled /></el-icon>
            {{ t('remote.wsDisconnected') }}
          </div>
        </div>
      </div>

      <!-- Active session view -->
      <div v-else class="remote-session">
        <!-- Session tabs -->
        <div class="session-tabs">
          <div
            v-for="s in store.sessions"
            :key="s.sessionId"
            :class="['session-tab', { active: s.sessionId === store.activeSessionId }]"
            @click="store.activeSessionId = s.sessionId"
          >
            <span :class="['tab-dot', s.state]" />
            <span class="tab-label">{{ s.protocol }} · {{ s.agentId.slice(0, 8) }}</span>
            <el-icon class="tab-close" @click.stop="closeSession(s.sessionId)"><Close /></el-icon>
          </div>
        </div>

        <!-- Session content -->
        <div class="session-content">
          <DesktopView
            v-if="isDesktopProtocol(activeSession.protocol)"
            :session-id="activeSession.sessionId"
            :session-state="activeSession.state"
            :error="activeSession.error"
          />
          <TerminalView
            v-else
            :session-id="activeSession.sessionId"
            :session-state="activeSession.state"
            :error="activeSession.error"
          />
        </div>
      </div>
    </div>
    </div>

    <!-- Gateway Config Dialog -->
    <el-dialog v-model="showConfig" :title="t('remote.gatewayConfig')" width="420px">
      <el-form label-width="80px" size="small">
        <el-form-item label="HTTP Host">
          <el-input v-model="gatewayForm.httpHost" />
        </el-form-item>
        <el-form-item label="HTTP Port">
          <el-input-number v-model="gatewayForm.httpPort" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item label="WS Host">
          <el-input v-model="gatewayForm.wsHost" />
        </el-form-item>
        <el-form-item label="WS Port">
          <el-input-number v-model="gatewayForm.wsPort" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item label="Token">
          <el-input v-model="gatewayForm.token" type="password" show-password placeholder="Optional" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showConfig = false">Cancel</el-button>
        <el-button type="primary" @click="saveGatewayConfig">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, reactive } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import {
  Refresh, Monitor, WarningFilled, Link, Close, VideoCamera, Setting, ArrowLeft
} from "@element-plus/icons-vue";
import { useRemoteStore, type SessionProtocol } from "@/stores/remote";
import type { AgentInfo } from "@/api/remote";
import { remoteWs } from "@/api/remote";
import DesktopView from "./desktop.vue";
import TerminalView from "./terminal.vue";

const { t } = useI18n();
const store = useRemoteStore();
const router = useRouter();

const selectedAgent = ref<AgentInfo | null>(null);
const showSshAuth = ref(false);
const sshHost = ref("");
const sshPort = ref("22");
const sshUser = ref("");
const sshPass = ref("");
const showConfig = ref(false);
const gatewayForm = reactive({
  httpHost: store.gatewayCfg.httpHost,
  httpPort: store.gatewayCfg.httpPort,
  wsHost: store.gatewayCfg.wsHost,
  wsPort: store.gatewayCfg.wsPort,
  token: store.gatewayCfg.token || "",
});

const activeSession = computed(() => store.activeSession);

const wsLabel = computed(() => {
  if (store.wsState === "connected") return t('remote.wsConnected');
  if (store.wsState === "connecting") return t('remote.wsConnecting');
  return t('remote.wsDisconnected');
});

function selectAgent(agent: AgentInfo) {
  selectedAgent.value = agent;
  showSshAuth.value = false;
}

/** Check if protocol should show DesktopView (includes AUTO fallback) */
function isDesktopProtocol(protocol: string): boolean {
  if (protocol === "DESKTOP" || protocol === "VNC" || protocol === "RUSTDESK") return true;
  // AUTO: check selected agent's protocols — if DESKTOP is listed, show DesktopView
  if (protocol === "AUTO" && selectedAgent.value?.protocols?.some(p => p === "DESKTOP")) return true;
  return false;
}

function goBack() {
  router.push("/dashboard");
}

function refreshData() {
  store.refreshAgents();
}

function handleConnect(protocol: SessionProtocol) {
  if (!selectedAgent.value) return;

  // Show SSH auth for SSH protocol
  if (protocol === "SSH" && !showSshAuth.value) {
    showSshAuth.value = true;
    return;
  }

  const auth = protocol === "SSH" ? {
    host: sshHost.value || undefined,
    port: Number(sshPort.value) || 22,
    username: sshUser.value || undefined,
    password: sshPass.value || undefined,
  } : undefined;

  store.connectToTarget(selectedAgent.value, protocol, auth);
}

function closeSession(sessionId: string) {
  remoteWs.disconnectSession(sessionId);
  store.removeSession(sessionId);
}

function saveGatewayConfig() {
  store.updateGateway({
    httpHost: gatewayForm.httpHost,
    httpPort: gatewayForm.httpPort,
    wsHost: gatewayForm.wsHost,
    wsPort: gatewayForm.wsPort,
    token: gatewayForm.token || undefined,
  });
  showConfig.value = false;
}

// ─── WS message → session creation ─────────────────────────

let sessionMsgHandler: ((msg: Record<string, unknown>) => void) | null = null;

onMounted(() => {
  store.refreshAgents();

  // Listen for "connected" messages to create sessions
  sessionMsgHandler = (msg) => {
    const type = msg.type as string;
    if (type === "connected" && selectedAgent.value) {
      store.addSession({
        sessionId: msg.sessionId as string,
        agentId: selectedAgent.value.agentId,
        targetId: (msg.targetId as string) || selectedAgent.value.agentId,
        protocol: (msg.protocol as SessionProtocol) || "AUTO",
        state: "connected",
        createdAt: Date.now(),
      });
    }
  };
  remoteWs.onMessage(sessionMsgHandler);
});

onBeforeUnmount(() => {
  // Don't disconnect WS on unmount — sessions persist
});
</script>

<style scoped>
.remote-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--el-bg-color-page, #f8f7f4);
}

/* ─── Top Bar ──────────────────────────────────── */
.remote-topbar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-bg-color, #fff);
  border-bottom: 1px solid var(--el-border-color, #e7e5e4);
  min-height: 44px;
  gap: 12px;
}

.back-btn {
  color: var(--el-text-color-secondary, #78716c) !important;
  font-size: 13px;
}

.topbar-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1c1917);
  flex: 1;
}

.config-btn {
  color: var(--el-text-color-secondary, #78716c) !important;
}

.remote-body {
  display: flex;
  flex: 1;
  gap: 0;
  overflow: hidden;
}

/* ─── Left Sidebar ─────────────────────────────── */
.remote-sidebar {
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid var(--el-border-color, #e7e5e4);
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 8px;
}
.sidebar-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1c1917);
  margin: 0;
}

.gateway-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 16px 12px;
  border-bottom: 1px solid var(--el-border-color, #e7e5e4);
}

.ws-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.ws-dot.connected { background: #22c55e; }
.ws-dot.connecting { background: #f59e0b; animation: blink 1s infinite; }
.ws-dot.disconnected { background: #6b7280; }

@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

.ws-label {
  font-size: 12px;
  color: var(--el-text-color-secondary, #78716c);
  flex: 1;
}

.agent-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.agent-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fef2f2;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
  margin-bottom: 8px;
}

.agent-empty {
  text-align: center;
  padding: 40px 16px;
  color: var(--el-text-color-secondary, #78716c);
}
.agent-empty p {
  margin-top: 8px;
  font-size: 13px;
}

.agent-card {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 6px;
}
.agent-card:hover {
  background: rgba(13,148,136,0.04);
  border-color: rgba(13,148,136,0.15);
}
.agent-card.active {
  background: rgba(13,148,136,0.08);
  border-color: var(--nexus-accent, #0d9488);
}

.agent-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.agent-dot.online { background: #22c55e; }

.agent-name {
  font-family: var(--nexus-data-font, monospace);
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1c1917);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-type {
  font-size: 11px;
  color: var(--el-text-color-secondary, #78716c);
  background: rgba(0,0,0,0.04);
  padding: 1px 6px;
  border-radius: 4px;
}

.agent-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: var(--el-text-color-secondary, #78716c);
  font-family: var(--nexus-data-font, monospace);
}

.agent-rtt {
  color: var(--nexus-accent, #0d9488);
}

.agent-card-caps {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  flex-wrap: wrap;
}

/* ─── Right Main ───────────────────────────────── */
.remote-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.remote-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--el-text-color-secondary, #78716c);
}
.remote-empty h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1c1917);
  margin: 0;
}
.remote-empty p {
  font-size: 14px;
  margin: 0;
}

.remote-connect {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.connect-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--el-border-color, #e7e5e4);
  padding: 24px;
  width: 100%;
  max-width: 480px;
}

.connect-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.connect-header h3 {
  margin: 0;
  font-size: 16px;
  font-family: var(--nexus-data-font, monospace);
}

.connect-info {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(0,0,0,0.04);
  font-size: 13px;
}
.info-label {
  color: var(--el-text-color-secondary, #78716c);
}
.info-value {
  color: var(--el-text-color-primary, #1c1917);
  font-family: var(--nexus-data-font, monospace);
}

.ssh-auth {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.connect-actions {
  display: flex;
  gap: 8px;
}

.connect-warn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  color: #f59e0b;
  font-size: 12px;
}

/* ─── Session View ─────────────────────────────── */
.remote-session {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.session-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  background: rgba(0,0,0,0.02);
  border-bottom: 1px solid var(--el-border-color, #e7e5e4);
  min-height: 36px;
}

.session-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: var(--el-text-color-secondary, #78716c);
  transition: all 0.15s;
}
.session-tab:hover {
  background: rgba(0,0,0,0.04);
}
.session-tab.active {
  background: var(--nexus-accent, #0d9488);
  color: #fff;
}
.session-tab.active .tab-dot { background: #fff; }

.tab-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6b7280;
}
.tab-dot.connected { background: #22c55e; }
.tab-dot.connecting { background: #f59e0b; }
.tab-dot.error { background: #ef4444; }

.tab-label {
  font-family: var(--nexus-data-font, monospace);
}

.tab-close {
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.15s;
}
.session-tab:hover .tab-close { opacity: 1; }

.session-content {
  flex: 1;
  overflow: hidden;
}
</style>