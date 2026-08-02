<template>
  <div class="socks5-page thin-scroller">
    <div class="page-header">
      <div class="page-header-left">
        <h3 class="page-title">SOCKS5 代理</h3>
        <el-tag size="small" type="info" effect="plain">{{ onlineCount }}/{{ agents.length }} 在线</el-tag>
      </div>
      <div class="page-header-right">
        <el-button size="small" @click="settingsVisible = true">设置</el-button>
        <el-button size="small" :loading="loading" :icon="Refresh" @click="fetchAgents">刷新</el-button>
      </div>

      <!-- 设置弹框 -->
      <el-dialog v-model="settingsVisible" title="SOCKS5 API 设置" width="360px" append-to-body>
        <el-form label-position="top" size="default">
          <el-form-item label="API 主机">
            <el-input v-model="gatewayHost" placeholder="127.0.0.1" />
          </el-form-item>
          <el-form-item label="API 端口">
            <el-input-number v-model="apiPort" :min="1" :max="65535" style="width:100%" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="settingsVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存</el-button>
        </template>
      </el-dialog>
    </div>

    <div class="socks5-body">
      <el-alert
        v-if="loadError"
        :title="loadError"
        type="warning"
        show-icon
        :closable="false"
      />

      <section class="agent-section">
        <div class="section-head">
          <div>
            <div class="section-title">可用服务器</div>
            <div class="section-desc">当前访问码可用的 SOCKS5 Agent。客户端密码使用当前访问码或令牌。</div>
          </div>
        </div>

        <el-empty v-if="!loading && availableAgents.length === 0" description="暂无可接入的 SOCKS5 服务器" />
        <div v-else class="agent-grid">
          <div v-for="agent in availableAgents" :key="agent.agentId" class="agent-card-modern">
            <div class="agent-card-top">
              <div class="agent-status">
                <span class="status-dot status-success"></span>
                <el-tag size="small" type="warning" effect="plain">SOCKS5</el-tag>
                <el-tag v-if="isTemporaryAgent(agent)" size="small" type="info" effect="plain">临时</el-tag>
              </div>
              <code class="agent-id" @click.stop="copyText(agent.agentId)">{{ agent.agentId }}</code>
            </div>
            <div class="agent-card-meta">
              <span v-if="displayAgentIp(agent)" class="meta-item" title="IP 地址">{{ displayAgentIp(agent) }}</span>
              <span v-if="displayAgentPort(agent)" class="meta-item" title="远程端口">:{{ displayAgentPort(agent) }}</span>
              <span v-if="sshPort(agent)" class="meta-item" title="SSH 端口">SSH {{ sshPort(agent) }}</span>
              <span v-if="agent.capabilities?.['os.name']" class="meta-item" title="操作系统">{{ agent.capabilities['os.name'] }}</span>
            </div>
            <div class="agent-card-footer">
              <el-tag v-if="agent.verifyCode" size="small" type="warning" effect="plain" class="verify-code" @click.stop="copyText(agent.verifyCode)" title="点击复制验证码">{{ agent.verifyCode }}</el-tag>
              <div class="action-buttons">
                <el-button size="small" text @click.stop="copyText(agent.agentId)">复制 ID</el-button>
                <el-button size="small" text @click.stop="copyText(agentServer(agent))">复制地址</el-button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="agent-section">
        <div class="section-head">
          <div>
            <div class="section-title">活跃连接</div>
            <div class="section-desc">仅显示当前仍保持的 SOCKS5 客户端连接，连接关闭后刷新会消失。</div>
          </div>
          <el-button size="small" :loading="refreshingClients" :icon="Refresh" @click="fetchClients">刷新活跃连接</el-button>
        </div>

        <el-empty v-if="!loading && clients.length === 0" description="暂无活跃 SOCKS5 客户端连接" />
        <div v-else class="client-grid">
          <div v-for="client in clients" :key="client.streamId" class="client-card">
            <div class="client-header">
              <div class="client-identity">
                <span class="client-name">{{ client.targetId }}</span>
                <div class="client-tags">
                  <el-tag size="small" :type="client.connected ? 'success' : 'info'" effect="plain">
                    <span class="status-dot" :class="client.connected ? 'status-success' : 'status-info'"></span>
                    {{ client.connected ? '已连接' : '断开' }}
                  </el-tag>
                  <el-tag size="small" :type="client.tunnelEnabled ? 'success' : 'info'" effect="plain">
                    {{ client.tunnelEnabled ? '隧道' : '直连' }}
                  </el-tag>
                </div>
              </div>
              <div class="client-actions">
                <el-button size="small" text :icon="CopyDocument" @click="copyText(client.streamId)">复制流 ID</el-button>
                <el-popconfirm title="确定断开这个 SOCKS5 客户端吗？" confirm-button-text="断开" cancel-button-text="取消" @confirm="disconnectClient(client)">
                  <template #reference>
                    <el-button size="small" type="danger" plain>断开</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
            <div class="client-subtitle">
              {{ client.verifyCode }} · {{ client.agentIpAddress || 'unknown' }}<template v-if="client.agentRemoteAddress"> · {{ client.agentRemoteAddress }}</template>
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
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from "vue";
import { Connection, CopyDocument, Key, Link, Refresh, User } from "@element-plus/icons-vue";
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
const apiPort = ref(Number(localStorage.getItem("socks5-api-port") || localStorage.getItem("gateway-api-port") || 8083));
const settingsVisible = ref(false);
const agents = ref<Socks5Agent[]>([]);
const clients = ref<ClientInfo[]>([]);
const refreshingClients = ref(false);
const loading = ref(false);
const loadError = ref("");

const currentToken = computed(() => injectedToken?.value || injectedAccessCode?.value || localStorage.getItem("remote-client-token") || "");
const onlineCount = computed(() => agents.value.filter(agent => agent.online).length);
const availableAgents = computed(() => agents.value.filter(agent => agent.online && agent.socks5Enabled));

function managementBase(): string {
  return `http://${gatewayHost.value}:${managementPort.value}/admin/api/socks5`;
}

function agentsUrl(): string {
  return `${managementBase()}/agents`;
}

function clientsUrl(): string {
  return `${managementBase()}/clients`;
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

async function copyText(text: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("已复制");
  } catch {
    ElMessage.warning("复制失败，请手动复制");
  }
}

function agentServer(agent: Socks5Agent): string {
  const ip = displayAgentIp(agent);
  if (!ip) return "unknown";
  return ip;
}

function isTemporaryAgent(agent: Socks5Agent): boolean {
  const capabilities = agent.capabilities || {};
  return capabilities["agent.trustedTemporary"] === "true";
}

function displayAgentIp(agent: Socks5Agent): string {
  return agent.capabilities?.["agent.remoteHost"] || agent.ipAddress || "";
}

function displayAgentPort(agent: Socks5Agent): string | number {
  if (isTemporaryAgent(agent)) {
    return "";
  }
  return agent.remotePort && agent.remotePort > 0 ? agent.remotePort : "";
}

function sshPort(agent: Socks5Agent): string {
  return isTemporaryAgent(agent) ? agent.capabilities?.["agent.remotePort"] || "" : "";
}

function formatTime(value: string): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function saveSettings() {
  localStorage.setItem("socks5-gateway-host", gatewayHost.value);
  localStorage.setItem("socks5-api-port", String(apiPort.value));
  settingsVisible.value = false;
  refreshAll();
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
  gap: 20px;
}

/* 通用区块 */
.agent-section {
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-large);
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: -0.2px;
}

.section-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.55;
}

/* Agent 卡片网格 */
.agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.agent-card-modern {
  padding: 14px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.agent-card-modern:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow);
  transform: translateY(-1px);
}

.agent-card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.agent-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.agent-id {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: var(--el-text-color-primary);
  cursor: pointer;
  user-select: all;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 2px 6px;
  border-radius: var(--el-border-radius-small);
  background: var(--el-fill-color-light);
  transition: background 0.15s ease;
}

.agent-id:hover {
  background: var(--el-fill-color);
}

.agent-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: 'SF Mono', monospace;
}

.meta-item {
  letter-spacing: 0.2px;
}

.agent-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-light);
}

.verify-code {
  font-family: 'SF Mono', monospace;
  cursor: pointer;
  font-weight: 600;
}

.action-buttons {
  display: inline-flex;
  gap: 2px;
}

/* 客户端连接卡片 */
.client-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.client-card {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.client-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow);
}

.client-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.client-identity {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.client-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  word-break: break-all;
  font-family: 'SF Mono', monospace;
}

.client-tags {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
}

.client-tags .el-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.client-actions {
  display: inline-flex;
  gap: 6px;
  flex-shrink: 0;
}

.client-subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: 'SF Mono', monospace;
  word-break: break-all;
  line-height: 1.5;
}

.credential-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-light);
}

.credential-item {
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-small);
  background: var(--el-fill-color-light);
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: background 0.15s ease;
}

.credential-item:hover {
  background: var(--el-fill-color);
}

.credential-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.credential-item code {
  color: var(--el-text-color-primary);
  font-size: 12px;
  cursor: pointer;
  word-break: break-all;
  font-family: 'SF Mono', monospace;
  user-select: all;
}

.muted {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

/* 响应式 */
@media (max-width: 768px) {
  .socks5-body {
    padding: 16px;
  }

  .client-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .client-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .agent-grid {
    grid-template-columns: 1fr;
  }
}
</style>