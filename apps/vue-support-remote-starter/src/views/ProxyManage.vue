<template>
  <div class="socks5-page thin-scroller">
    <div class="page-header">
      <div class="page-header-left">
        <h3 class="page-title">SOCKS5 网关</h3>
        <el-tag size="small" type="info" effect="plain">{{ onlineCount }}/{{ agents.length }} 在线</el-tag>
      </div>
      <div class="page-header-right">
        <el-button size="small" :loading="loading" :icon="Refresh" @click="fetchAgents">刷新</el-button>
        <el-button size="small" :icon="Setting" @click="settingsVisible = true">网关设置</el-button>
      </div>
    </div>

    <div class="socks5-body">
      <el-alert
        v-if="loadError"
        :title="loadError"
        type="warning"
        show-icon
        :closable="false"
      />

      <section class="hero-grid">
        <el-card shadow="never" class="hero-card primary-card">
          <div class="section-label">SOCKS5 入口</div>
          <div class="endpoint-row">
            <div class="endpoint-text">{{ proxyEndpoint }}</div>
            <el-button size="small" :icon="CopyDocument" @click="copyText(proxyEndpoint)">复制</el-button>
          </div>
          <div class="hero-hint">客户端代理地址。账号使用 Agent 验证码，密码使用当前令牌。</div>
        </el-card>

        <el-card shadow="never" class="hero-card">
          <div class="section-label">可用 Agent</div>
          <div class="stat-row">
            <div>
              <div class="stat-value">{{ agents.length }}</div>
              <div class="stat-label">当前令牌可访问</div>
            </div>
            <div>
              <div class="stat-value">{{ enabledCount }}</div>
              <div class="stat-label">SOCKS5 已启用</div>
            </div>
          </div>
        </el-card>
      </section>

      <el-card shadow="never" class="guide-card">
        <div class="quick-guide">
          <div class="quick-item">
            <span class="quick-label">代理地址</span>
            <code @click="copyText(gatewayHost)">{{ gatewayHost }}</code>
          </div>
          <div class="quick-item">
            <span class="quick-label">端口</span>
            <code @click="copyText(String(socks5GatewayPort))">{{ socks5GatewayPort }}</code>
          </div>
          <div class="quick-item">
            <span class="quick-label">账号</span>
            <span>Agent 验证码</span>
          </div>
          <div class="quick-item">
            <span class="quick-label">密码</span>
            <span>{{ maskedToken }}</span>
          </div>
        </div>
      </el-card>

      <el-empty v-if="!loading && agents.length === 0 && clients.length === 0" description="暂无 SOCKS5 Agent 或连接" />

      <section v-else class="agent-section">
        <div class="section-head">
          <div>
            <div class="section-title">可用的</div>
            <div class="section-desc">当前令牌或访问码可访问的在线 SOCKS5 Agent。</div>
          </div>
        </div>

        <div class="agent-list">
          <el-card v-for="agent in agents" :key="agent.agentId" shadow="never" class="agent-card">
            <div class="agent-top">
              <div class="agent-identity">
                <div class="agent-name-row">
                  <span class="agent-name">{{ agent.agentId }}</span>
                  <el-tag size="small" :type="agent.online ? 'success' : 'info'" effect="plain">{{ agent.online ? '在线' : '离线' }}</el-tag>
                  <el-tag size="small" :type="agent.socks5Enabled ? 'primary' : 'warning'" effect="plain">
                    {{ agent.socks5Enabled ? '可接入' : '已停止' }}
                  </el-tag>
                </div>
                <div class="agent-subtitle">
                  {{ agent.ipAddress || 'unknown' }}<template v-if="agent.remotePort">:{{ agent.remotePort }}</template>
                  <span>·</span>
                  <span>{{ formatRtt(agent.lastRttMs) }}</span>
                  <template v-if="agent.agentType"><span>·</span><span>{{ agent.agentType }}</span></template>
                </div>
              </div>
              <div class="agent-actions">
                <el-button size="small" text :icon="CopyDocument" @click="copyAgentProfile(agent)">复制连接信息</el-button>
                <el-button
                  v-if="agent.socks5Enabled"
                  size="small"
                  type="warning"
                  plain
                  :loading="switchingAgentId === agent.agentId"
                  @click="setSocks5Enabled(agent, false)"
                >停止</el-button>
                <el-button
                  v-else
                  size="small"
                  type="success"
                  plain
                  :loading="switchingAgentId === agent.agentId"
                  @click="setSocks5Enabled(agent, true)"
                >启动</el-button>
              </div>
            </div>

            <div class="credential-grid">
              <div class="credential-item">
                <span class="credential-label"><el-icon><Connection /></el-icon> 入口</span>
                <code @click="copyText(proxyEndpoint)">{{ proxyEndpoint }}</code>
              </div>
              <div class="credential-item">
                <span class="credential-label"><el-icon><User /></el-icon> 目标 ID</span>
                <code @click="copyText(agent.agentId)">{{ agent.agentId }}</code>
              </div>
              <div class="credential-item">
                <span class="credential-label"><el-icon><Key /></el-icon> 验证码</span>
                <code @click="copyText(agent.verifyCode)">{{ agent.verifyCode }}</code>
              </div>
              <div class="credential-item">
                <span class="credential-label"><el-icon><Link /></el-icon> IP</span>
                <code @click="copyText(agent.ipAddress || '')">{{ agent.ipAddress || 'unknown' }}</code>
              </div>
            </div>
          </el-card>
        </div>
      </section>

      <section class="agent-section">
        <div class="section-head">
          <div>
            <div class="section-title">已连接的</div>
            <div class="section-desc">当前已建立的 SOCKS5 客户端连接，支持手动断开。</div>
          </div>
          <el-button size="small" :loading="refreshingClients" :icon="Refresh" @click="fetchClients">刷新已连接</el-button>
        </div>

        <el-empty v-if="!loading && clients.length === 0" description="暂无已连接客户端" />
        <div v-else class="agent-list">
          <el-card v-for="client in clients" :key="client.streamId" shadow="never" class="agent-card">
            <div class="agent-top">
              <div class="agent-identity">
                <div class="agent-name-row">
                  <span class="agent-name">{{ client.targetId }}</span>
                  <el-tag size="small" :type="client.connected ? 'success' : 'info'" effect="plain">{{ client.connected ? '已连接' : '断开' }}</el-tag>
                  <el-tag size="small" :type="client.tunnelEnabled ? 'success' : 'info'" effect="plain">{{ client.tunnelEnabled ? '隧道' : '直连' }}</el-tag>
                </div>
                <div class="agent-subtitle">
                  {{ client.verifyCode }} · {{ client.agentIpAddress || 'unknown' }}<template v-if="client.agentRemoteAddress"> · {{ client.agentRemoteAddress }}</template>
                </div>
              </div>
              <div class="agent-actions">
                <el-button size="small" text :icon="CopyDocument" @click="copyText(client.streamId)">复制流 ID</el-button>
                <el-popconfirm title="确定断开这个 SOCKS5 客户端吗？" confirm-button-text="断开" cancel-button-text="取消" @confirm="disconnectClient(client)">
                  <template #reference>
                    <el-button size="small" type="danger" plain>断开</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>

            <div class="credential-grid">
              <div class="credential-item">
                <span class="credential-label"><el-icon><Connection /></el-icon> 目标</span>
                <code @click="copyText(`${client.targetHost}:${client.targetPort}`)">{{ client.targetHost }}:{{ client.targetPort }}</code>
              </div>
              <div class="credential-item">
                <span class="credential-label"><el-icon><User /></el-icon> 客户端地址</span>
                <code @click="copyText(client.clientAddress)">{{ client.clientAddress || 'unknown' }}</code>
              </div>
              <div class="credential-item">
                <span class="credential-label"><el-icon><Key /></el-icon> 创建时间</span>
                <span class="muted">{{ formatTime(client.createdAt) }}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label"><el-icon><Link /></el-icon> 流 ID</span>
                <code @click="copyText(client.streamId)">{{ client.streamId }}</code>
              </div>
            </div>
          </el-card>
        </div>
      </section>
    </div>

    <el-dialog v-model="settingsVisible" title="网关设置" width="420px" append-to-body>
      <el-form label-position="top" size="default" class="settings-form">
        <el-form-item label="网关地址">
          <el-input v-model="gatewayHost" placeholder="127.0.0.1" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="管理端口">
              <el-input-number v-model="managementPort" :min="1" :max="65535" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="SOCKS5 端口">
              <el-input-number v-model="socks5GatewayPort" :min="1" :max="65535" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="settingsVisible = false">取消</el-button>
        <el-button type="primary" @click="saveGatewaySettings">保存并刷新</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref } from "vue";
import { Connection, CopyDocument, Key, Link, Refresh, Setting, User } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { Ref } from "vue";

interface Socks5Agent {
  agentId: string;
  agentType?: string;
  online: boolean;
  socks5Enabled: boolean;
  ipAddress?: string;
  remotePort?: number;
  verifyCode: string;
  lastHeartbeatAt?: string;
  lastRttMs?: number;
  protocols?: string[];
  capabilities?: Record<string, string>;
}

interface ClientInfo {
  streamId: string;
  agentId: string;
  targetId: string;
  verifyCode: string;
  agentIpAddress: string;
  agentRemoteAddress: string;
  clientAddress: string;
  targetHost: string;
  targetPort: number;
  createdAt: string;
  connected: boolean;
  tunnelEnabled: boolean;
}

const injectedToken = inject<Ref<string>>("clientToken");
const injectedAccessCode = inject<Ref<string>>("accessCode");

const gatewayHost = ref(localStorage.getItem("socks5-gateway-host") || localStorage.getItem("gateway-manage-host") || window.location.hostname || "127.0.0.1");
const managementPort = ref(Number(localStorage.getItem("socks5-management-port") || localStorage.getItem("gateway-manage-mgmt-port") || 3000));
const savedSocks5Port = localStorage.getItem("socks5-gateway-port");
const unifiedGatewayPort = localStorage.getItem("remote-gateway-port") || "8082";
const socks5GatewayPort = ref(Number(savedSocks5Port && savedSocks5Port !== "1080" ? savedSocks5Port : unifiedGatewayPort));
const agents = ref<Socks5Agent[]>([]);
const clients = ref<ClientInfo[]>([]);
const refreshingClients = ref(false);
const loading = ref(false);
const settingsVisible = ref(false);
const loadError = ref("");
const switchingAgentId = ref("");

const currentToken = computed(() => injectedToken?.value || injectedAccessCode?.value || localStorage.getItem("remote-client-token") || "");
const proxyEndpoint = computed(() => `${gatewayHost.value}:${socks5GatewayPort.value}`);
const onlineCount = computed(() => agents.value.filter(agent => agent.online).length);
const enabledCount = computed(() => agents.value.filter(agent => agent.socks5Enabled).length);
const maskedToken = computed(() => maskToken(currentToken.value));

function managementBase(): string {
  return `${window.location.protocol}//${gatewayHost.value}:${managementPort.value}/admin/api/socks5`;
}

function agentsUrl(): string {
  return `${managementBase()}/agents`;
}

function clientsUrl(): string {
  return `${window.location.protocol}//${gatewayHost.value}:${managementPort.value}/api/socks5/clients`;
}

function tokenQuery(): string {
  return currentToken.value ? `?token=${encodeURIComponent(currentToken.value)}` : "";
}

async function fetchAgents() {
  loading.value = true;
  loadError.value = "";
  try {
    const response = await fetch(`${agentsUrl()}${tokenQuery()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    agents.value = Array.isArray(data.agents) ? data.agents : [];
  } catch (error: any) {
    agents.value = [];
    loadError.value = `加载 SOCKS5 Agent 失败：${error?.message || error}`;
    ElMessage.error(loadError.value);
  } finally {
    loading.value = false;
  }
}

async function fetchClients() {
  refreshingClients.value = true;
  try {
    const response = await fetch(`${clientsUrl()}${tokenQuery()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    clients.value = Array.isArray(data.clients) ? data.clients : [];
  } catch (error: any) {
    clients.value = [];
    if (!loadError.value) {
      loadError.value = `加载已连接客户端失败：${error?.message || error}`;
    }
  } finally {
    refreshingClients.value = false;
  }
}

async function refreshAll() {
  await Promise.all([fetchAgents(), fetchClients()]);
}

async function setSocks5Enabled(agent: Socks5Agent, enabled: boolean) {
  switchingAgentId.value = agent.agentId;
  try {
    const action = enabled ? "start" : "stop";
    const response = await fetch(`${agentsUrl()}/${encodeURIComponent(agent.agentId)}/${action}${tokenQuery()}`, { method: "POST" });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }
    ElMessage.success(enabled ? "SOCKS5 已启动" : "SOCKS5 已停止");
    await refreshAll();
  } catch (error: any) {
    ElMessage.error(`${enabled ? "启动" : "停止"}失败: ${error?.message || error}`);
  } finally {
    switchingAgentId.value = "";
  }
}

async function disconnectClient(client: ClientInfo) {
  try {
    const response = await fetch(`${clientsUrl()}/${encodeURIComponent(client.streamId)}${tokenQuery()}`, { method: "DELETE" });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }
    ElMessage.success("已断开客户端");
    await fetchClients();
  } catch (error: any) {
    ElMessage.error(`断开失败: ${error?.message || error}`);
  }
}

function saveGatewaySettings() {
  persistGatewaySettings();
  settingsVisible.value = false;
  refreshAll();
}

async function copyText(text: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("已复制");
  } catch {
    ElMessage.warning("复制失败，请手动复制");
  }
}

function copyAgentProfile(agent: Socks5Agent) {
  copyText(`SOCKS5: ${proxyEndpoint.value}\n目标 ID: ${agent.agentId}\n验证码: ${agent.verifyCode}\n密码: ${currentToken.value}`);
}

function maskToken(token: string): string {
  if (!token) return "未提供令牌";
  if (token.length <= 10) return "••••••";
  return `${token.slice(0, 6)}••••${token.slice(-4)}`;
}

function formatRtt(rtt?: number): string {
  if (rtt == null || rtt < 0) return "RTT -";
  return `RTT ${rtt}ms`;
}

function formatTime(value: string): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function persistGatewaySettings() {
  localStorage.setItem("socks5-gateway-host", gatewayHost.value);
  localStorage.setItem("socks5-management-port", String(managementPort.value));
  localStorage.setItem("socks5-gateway-port", String(socks5GatewayPort.value));
}

onMounted(() => {
  refreshAll();
});
</script>

<style scoped>
.socks5-page {
  height: 100%;
  overflow-y: auto;
  background: var(--el-bg-color-page);
}

.socks5-body {
  padding: 20px 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1.4fr) minmax(220px, 0.8fr) minmax(260px, 1fr);
  gap: 14px;
}

.hero-card,
.guide-card,
.tunnel-editor-card,
.agent-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color);
}

.hero-card :deep(.el-card__body) {
  min-height: 138px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
}

.primary-card {
  border-color: var(--el-color-primary-light-7);
}

.section-label,
.stat-label,
.quick-label,
.credential-label,
.section-desc,
.hero-hint,
.tunnel-meta,
.tunnel-edit-desc,
.agent-subtitle,
.guide-note,
.muted {
  color: var(--el-text-color-secondary);
}

.section-label,
.quick-label,
.credential-label {
  font-size: 12px;
}

.endpoint-row,
.card-topline,
.card-header,
.tunnel-edit-head,
.agent-top,
.agent-name-row,
.agent-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.endpoint-text {
  color: var(--el-text-color-primary);
  font-size: 30px;
  font-weight: 700;
  line-height: 1.15;
  word-break: break-all;
}

.hero-hint,
.guide-note,
.tunnel-meta,
.tunnel-edit-desc,
.section-desc,
.agent-subtitle {
  font-size: 13px;
  line-height: 1.6;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-value {
  color: var(--el-text-color-primary);
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.tunnel-title {
  margin-top: 4px;
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
}

.tunnel-meta {
  min-height: 42px;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tunnel-editor-card :deep(.el-card__body) {
  padding-top: 14px;
}

.tunnel-edit-head {
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-fill-color-lighter);
}

.tunnel-edit-title,
.section-title,
.agent-name {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.quick-guide,
.credential-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.quick-item,
.credential-item {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-fill-color-lighter);
}

.quick-item,
.credential-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-item code,
.credential-item code {
  color: var(--el-text-color-primary);
  font-size: 13px;
  cursor: pointer;
  word-break: break-all;
}

.guide-note {
  margin-top: 12px;
}

.agent-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.agent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.agent-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.agent-identity {
  min-width: 0;
}

.agent-name-row {
  justify-content: flex-start;
  flex-wrap: wrap;
}

.agent-name {
  word-break: break-all;
}

.agent-subtitle {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.credential-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 1180px) {
  .hero-grid {
    grid-template-columns: 1fr 1fr;
  }

  .tunnel-summary-card {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .socks5-body {
    padding: 16px;
  }

  .hero-grid {
    grid-template-columns: 1fr;
  }

  .endpoint-row,
  .card-topline,
  .tunnel-edit-head,
  .agent-top,
  .agent-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .endpoint-text {
    font-size: 24px;
  }
}
</style>
