<template>
  <div class="gateway-manage">
    <div class="page-header">
      <div class="page-header-left">
        <h3 class="page-title">网关管理</h3>
      </div>
      <div class="page-header-right">
        <el-button size="small" :icon="Refresh" :loading="loading" @click="fetchInfo">刷新</el-button>
        <el-button size="small" circle @click="settingsVisible = true" title="设置">
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 设置弹框 -->
    <el-dialog v-model="settingsVisible" title="网关设置" width="360px" append-to-body>
      <el-form label-position="top" size="default">
        <el-form-item label="API 地址">
          <el-input v-model="gatewayHost" placeholder="127.0.0.1">
            <template #prefix>IP</template>
          </el-input>
        </el-form-item>
        <el-form-item label="API 端口">
          <el-input-number v-model="gatewayPort" :min="1" :max="65535" style="width:100%" />
        </el-form-item>
        <el-form-item label="管理端口">
          <el-input-number v-model="managementPort" :min="1" :max="65535" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settingsVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存并查询</el-button>
      </template>
    </el-dialog>

    <div class="gm-body">
      <div v-if="error" class="gm-error">
        <el-icon><Warning /></el-icon>
        <span>{{ error }}</span>
      </div>

      <template v-if="health">
        <!-- 控制端列表 -->
        <section class="gm-section">
          <div class="section-head">
            <div>
              <div class="section-title">控制端</div>
              <div class="section-desc">当前在线的控制端连接（{{ controllers.length }}）</div>
            </div>
          </div>
          <el-empty v-if="controllers.length === 0" description="无在线控制端" :image-size="60" />
          <div v-else class="controller-grid">
            <div v-for="c in controllers" :key="c.id" class="controller-card">
              <div class="controller-info">
                <span class="status-dot status-success"></span>
                <el-tag size="small" type="info" effect="plain">{{ c.type || 'web' }}</el-tag>
                <code class="controller-ip">{{ c.ipAddress }}</code>
              </div>
              <div class="controller-meta">
                <span class="meta-text">{{ formatTime(c.connectedAt) }}</span>
                <el-button size="small" type="danger" text @click="kickController(c.id)">踢出</el-button>
              </div>
            </div>
          </div>
        </section>

        <!-- 概览 -->
        <section class="gm-section">
          <div class="section-head">
            <div>
              <div class="section-title">网关概览</div>
            </div>
          </div>
          <div class="overview-grid">
            <div class="overview-item">
              <div class="overview-label">健康状态</div>
              <div class="overview-value">
                <el-tag :type="health.status === 'UP' ? 'success' : 'danger'" size="small" effect="dark">{{ health.status }}</el-tag>
              </div>
            </div>
            <div class="overview-item">
              <div class="overview-label">被控端点</div>
              <div class="overview-value">{{ health.agents }}</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">可用 Target</div>
              <div class="overview-value">{{ health.targets }}</div>
            </div>
          </div>
        </section>

        <!-- 被控端点列表 -->
        <section class="gm-section">
          <div class="section-head">
            <div>
              <div class="section-title">被控端点</div>
              <div class="section-desc">点击查看详情，双击 Target 跳转远程控制</div>
            </div>
          </div>
          <el-empty v-if="agents.length === 0" description="无在线被控端点" :image-size="60" />
          <div v-else class="agent-grid">
            <div v-for="a in agents" :key="a.agentId" class="agent-card-modern">
              <el-tooltip placement="right" :width="320" trigger="click">
                <template #content>
                  <div class="tooltip-info">
                    <div class="tooltip-row"><span class="tooltip-label">端点 ID</span><code>{{ a.agentId }}</code></div>
                    <div class="tooltip-row"><span class="tooltip-label">类型</span><el-tag size="small" :type="a.agentType === 'java' ? 'primary' : a.agentType === 'rust' ? 'warning' : 'info'" effect="plain">{{ a.agentType || 'unknown' }}</el-tag></div>
                    <div v-if="isTemporaryAgent(a)" class="tooltip-row"><span class="tooltip-label">标识</span><el-tag size="small" type="info" effect="plain">临时</el-tag></div>
                    <div class="tooltip-row"><span class="tooltip-label">验证码</span><code class="tooltip-highlight">{{ a.verifyCode || '-' }}</code></div>
                    <div class="tooltip-row"><span class="tooltip-label">IP 地址</span><code>{{ displayAgentIp(a) || '-' }}</code></div>
                    <div class="tooltip-row"><span class="tooltip-label">{{ displayPortLabel(a) }}</span><code>{{ displayDetailPort(a) || '-' }}</code></div>
                    <div class="tooltip-row"><span class="tooltip-label">协议</span><span>{{ a.protocols?.join(", ") }}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">编码器</span><span>{{ a.codecs?.join(", ") }}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">操作系统</span><span>{{ a.capabilities?.['os.name'] || '-' }}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">系统架构</span><span>{{ a.capabilities?.['os.arch'] || '-' }}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">系统版本</span><span>{{ a.capabilities?.['os.version'] || '-' }}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">绑定令牌</span>
                      <span v-if="getBoundTokens(a.agentId).length > 0" class="tooltip-tokens">
                        <el-tag v-for="tk in getBoundTokens(a.agentId)" :key="tk.token" size="small" type="warning" effect="plain" class="token-tag" @click.stop="copyText(tk.token)" :title="'点击复制: ' + maskToken(tk.token)">{{ maskToken(tk.token) }}</el-tag>
                      </span>
                      <span v-else class="tooltip-empty">无</span>
                    </div>
                  </div>
                </template>
                <div class="agent-card-top">
                  <div class="agent-status">
                    <span class="status-dot status-success"></span>
                    <el-tag v-if="a.agentType" size="small" :type="a.agentType === 'java' ? 'primary' : a.agentType === 'rust' ? 'warning' : 'info'" effect="plain">{{ a.agentType }}</el-tag>
                    <el-tag v-if="isTemporaryAgent(a)" size="small" type="info" effect="plain">临时</el-tag>
                  </div>
                  <code class="agent-id">{{ a.agentId }}</code>
                  <el-icon class="info-icon" :size="14"><InfoFilled /></el-icon>
                </div>
              </el-tooltip>
              <div class="agent-card-meta">
                <span v-if="displayAgentIp(a)" class="meta-item" title="IP 地址">{{ displayAgentIp(a) }}</span>
                <span v-if="displayAgentPort(a)" class="meta-item" title="远程端口">:{{ displayAgentPort(a) }}</span>
                <span v-if="sshPort(a)" class="meta-item" title="SSH 端口">SSH {{ sshPort(a) }}</span>
                <span v-if="a.capabilities?.['os.name']" class="meta-item" title="操作系统">{{ a.capabilities['os.name'] }}</span>
              </div>
              <div class="agent-card-footer">
                <el-tag v-if="a.verifyCode" size="small" type="warning" effect="plain" class="verify-code" @click.stop="copyVerifyCode(a.verifyCode)" title="点击复制验证码">{{ a.verifyCode }}</el-tag>
                <div class="agent-targets">
                  <div v-for="t in getTargetsForAgent(a.agentId)" :key="t.targetId" class="target-chip"
                       @click="handleTargetClick(t)"
                       @dblclick="handleTargetDblClick(t, a)"
                       :title="'单击复制 targetId，双击跳转远程控制'">
                    <el-tag size="small" :type="t.online ? 'success' : 'info'" effect="plain">{{ t.protocol }}</el-tag>
                    <el-tag v-if="t.transport" size="small" type="warning" effect="plain">{{ t.transport }}</el-tag>
                    <code class="target-id">{{ t.targetId }}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>

      <div v-else-if="!loading && !error" class="gm-empty">
        <el-icon :size="48"><Connection /></el-icon>
        <p>点击"刷新"查询网关状态</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from "vue";
import { Refresh, Setting, InfoFilled, Connection, Warning } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { Ref } from "vue";

const injectedToken = inject<Ref<string>>("clientToken");
const injectedAccessCode = inject<Ref<string>>("accessCode");
const navigateToRemote = inject<(params: {
  targetId?: string;
  verifyCode?: string;
  protocol?: string;
  name?: string;
  token?: string;
  codec?: string;
  transport?: string;
}) => void>("navigateToRemote");

const controllerInfo = inject<{
  connectionState: Ref<string>;
  sessionCount: Ref<number>;
  updateTargets?: (list: any[]) => void;
}>("controller-info", {
  connectionState: ref("disconnected"),
  sessionCount: ref(0),
});

const gatewayHost = ref("127.0.0.1");
const gatewayPort = ref(8083);
const managementPort = ref(3000);
const adminPath = "/admin";
const remoteApiHost = ref(localStorage.getItem("remote-api-host") || "127.0.0.1");
const remoteApiPort = ref(Number(localStorage.getItem("remote-api-port") || 3000));
const settingsVisible = ref(false);
const loading = ref(false);
const error = ref("");
const health = ref<{ status: string; agents: number; targets: number } | null>(null);
const agents = ref<any[]>([]);
const targets = ref<any[]>([]);
const controllers = ref<any[]>([]);
const tokens = ref<any[]>([]);

function getToken(): string {
  return injectedToken?.value || injectedAccessCode?.value || localStorage.getItem("remote-client-token") || "";
}

function formatTime(iso: string): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch { return iso; }
}

const savedHost = localStorage.getItem("gateway-manage-host");
const savedPort = localStorage.getItem("gateway-manage-port");
const savedMgmtPort = localStorage.getItem("gateway-manage-mgmt-port");
const savedRemoteApiHost = localStorage.getItem("remote-api-host");
const savedRemoteApiPort = localStorage.getItem("remote-api-port");
if (savedHost) gatewayHost.value = savedHost;
if (savedPort) gatewayPort.value = Number(savedPort);
if (savedMgmtPort) managementPort.value = Number(savedMgmtPort);
if (savedRemoteApiHost) remoteApiHost.value = savedRemoteApiHost;
if (savedRemoteApiPort) remoteApiPort.value = Number(savedRemoteApiPort);

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} HTTP ${response.status}`);
  return await response.json();
}

function apiBase(port = gatewayPort.value): string {
  return `http://${gatewayHost.value}:${port}/admin/api`;
}

function managementBase(): string {
  return `http://${gatewayHost.value}:${gatewayPort.value}/admin/api`;
}

async function fetchInfo() {
  loading.value = true;
  error.value = "";
  health.value = null;
  agents.value = [];
  targets.value = [];
  controllers.value = [];
  try {
    const token = getToken();
    const qs = token ? `?token=${token}` : "";
    const ports = Array.from(new Set([gatewayPort.value, 8083]));
    let apiError: unknown = null;
    let h: any = null;
    let a: any[] = [];
    let raw: any[] = [];
    let tk: any[] = [];

    for (const port of ports) {
      const base = apiBase(port);
      try {
        [h, a, raw] = await Promise.all([
          fetchJson(`${base}/health${qs}`, null),
          fetchJson<any[]>(`${base}/agents${qs}`, []),
          fetchJson<any[]>(`${base}/targets/detail${qs}`, []),
        ]);
        const tokenResp = await fetch(`${base}/tokens${qs}`).catch(() => null);
        tk = tokenResp && tokenResp.ok ? await tokenResp.json() : [];
        if (port !== gatewayPort.value) {
          gatewayPort.value = port;
          localStorage.setItem("gateway-manage-port", String(port));
        }
        apiError = null;
        break;
      } catch (e) {
        apiError = e;
      }
    }

    if (apiError) throw apiError;
    health.value = h;
    agents.value = a;
    targets.value = raw.map((x: any) => ({
      targetId: x.targetId,
      protocol: x.protocol,
      transport: x.transport,
      agentId: x.agentId,
      host: x.host,
      port: x.port,
      online: x.agentOnline,
    }));
    tokens.value = Array.isArray(tk) ? tk : [];
    syncRemoteTargetCache();
    const c = await fetch(`${managementBase()}${adminPath}/api/controllers${qs}`).catch(() => null);
    if (c && c.ok) {
      const cData = await c.json();
      controllers.value = cData.controllers || [];
    }
  } catch (e: any) {
    error.value = "请求失败: " + (e.message || "未知") + "。请检查 API 端口是否为 8083、管理端口是否为 3000。";
  } finally {
    loading.value = false;
  }
}

function saveSettings() {
  localStorage.setItem("gateway-manage-host", gatewayHost.value);
  localStorage.setItem("gateway-manage-port", String(gatewayPort.value));
  localStorage.setItem("gateway-manage-mgmt-port", String(managementPort.value));
  settingsVisible.value = false;
  fetchInfo();
}

async function copyTargetId(targetId: string) {
  try {
    await navigator.clipboard.writeText(targetId);
    ElMessage.success("已复制: " + targetId);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = targetId;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    ElMessage.success("已复制: " + targetId);
  }
}

async function copyVerifyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    ElMessage.success("验证码已复制: " + code);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = code;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    ElMessage.success("验证码已复制: " + code);
  }
}

function firstBoundToken(agentId?: string) {
  if (!agentId) return "";
  return getBoundTokens(agentId)[0]?.token || "";
}

function firstCodec(agent: any) {
  const codecs = Array.isArray(agent?.codecs) ? agent.codecs : [];
  return codecs[0] || "H264";
}

function syncRemoteTargetCache() {
  const agentEntries = agents.value.map((agent: any) => ({
    entryType: "agent",
    targetId: agent.agentId,
    verifyCode: agent.verifyCode,
    protocols: agent.protocols || [],
    codecs: agent.codecs || [],
    token: firstBoundToken(agent.agentId),
  }));
  const targetEntries = targets.value.map((target: any) => {
    const agent = agents.value.find((item: any) => item.agentId === target.agentId);
    return {
      entryType: "target",
      targetId: target.targetId,
      verifyCode: agent?.verifyCode,
      protocol: target.protocol,
      protocols: agent?.protocols || [],
      transport: target.transport,
      codec: firstCodec(agent),
      codecs: agent?.codecs || [],
      token: firstBoundToken(target.agentId),
    };
  });
  controllerInfo.updateTargets?.([...targetEntries, ...agentEntries]);
}

function handleTargetClick(t: any) {
  copyTargetId(t.targetId);
}

function handleTargetDblClick(t: any, agent: any) {
  if (!navigateToRemote) {
    ElMessage.warning("无法跳转到远程控制页");
    return;
  }
  navigateToRemote({
    targetId: t.targetId,
    verifyCode: agent?.verifyCode,
    protocol: t.protocol,
    name: agent?.agentId,
    token: firstBoundToken(agent?.agentId),
    codec: firstCodec(agent),
    transport: t.transport,
  });
  ElMessage.success("已跳转到远程控制，参数已填入");
}

async function kickController(controllerId: string) {
  try {
    const token = getToken();
    const qs = token ? `?token=${token}` : "";
    const resp = await fetch(`${managementBase()}${adminPath}/api/controllers/${controllerId}${qs}`, { method: "DELETE" });
    if (resp.ok) {
      const data = await resp.json();
      if (data.kicked) {
        ElMessage.success("已踢出控制端");
        controllers.value = controllers.value.filter((c: any) => c.id !== controllerId);
      }
    } else {
      ElMessage.error("踢出失败: HTTP " + resp.status);
    }
  } catch (e: any) {
    ElMessage.error("踢出失败: " + (e.message || "未知"));
  }
}

function getTargetsForAgent(agentId: string) {
  return targets.value.filter((t: any) => t.agentId === agentId);
}

function maskToken(token: string): string {
  if (!token) return "-";
  if (token.length <= 12) return token;
  return token.slice(0, 6) + "..." + token.slice(-4);
}

function getBoundTokens(agentId: string) {
  return tokens.value.filter((t: any) => {
    const ids = t.accessibleAgentIds;
    return ids && Array.isArray(ids) && ids.includes(agentId);
  });
}

function isTemporaryAgent(agent: any): boolean {
  const capabilities = agent?.capabilities || {};
  return capabilities["agent.trustedTemporary"] === "true";
}

function displayAgentIp(agent: any): string {
  return agent?.capabilities?.["agent.remoteHost"] || agent?.ipAddress || "";
}

function displayAgentPort(agent: any): string | number {
  if (isTemporaryAgent(agent)) {
    return "";
  }
  return agent?.remotePort && agent.remotePort > 0 ? agent.remotePort : "";
}

function displayDetailPort(agent: any): string | number {
  if (isTemporaryAgent(agent)) {
    return sshPort(agent);
  }
  return displayAgentPort(agent);
}

function displayPortLabel(agent: any): string {
  return isTemporaryAgent(agent) ? "SSH端口" : "远程端口";
}

function sshPort(agent: any): string {
  return isTemporaryAgent(agent) ? agent?.capabilities?.["agent.remotePort"] || "" : "";
}

async function copyText(text: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("已复制: " + maskToken(text));
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select(); document.execCommand("copy");
    document.body.removeChild(ta);
    ElMessage.success("已复制: " + maskToken(text));
  }
}

onMounted(() => {
  fetchInfo();
});
</script>

<style scoped>
.gateway-manage {
  height: 100%;
  overflow-y: auto;
  background: var(--el-bg-color-page);
}

.gm-body {
  padding: 20px 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.gm-error {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  padding: 10px 14px;
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: var(--el-border-radius-base);
  color: var(--el-color-danger);
}

/* 区块 */
.gm-section {
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

/* 控制端卡片 */
.controller-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
}

.controller-card {
  padding: 12px 14px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: all 0.2s ease;
}

.controller-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow);
}

.controller-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.controller-ip {
  font-family: 'SF Mono', monospace;
  font-size: 12px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.controller-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.meta-text {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: 'SF Mono', monospace;
}

/* 概览网格 */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.overview-item {
  padding: 16px 18px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s ease;
}

.overview-item:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow);
}

.overview-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.overview-value {
  font-size: 22px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: -0.5px;
}

/* Agent 卡片 */
.agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

.agent-card-modern {
  padding: 14px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.2s ease;
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
  font-family: 'SF Mono', monospace;
  font-size: 12px;
  color: var(--el-text-color-primary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 2px 6px;
  border-radius: var(--el-border-radius-small);
  background: var(--el-fill-color-light);
  user-select: all;
}

.info-icon {
  color: var(--el-text-color-placeholder);
  opacity: 0.6;
  transition: all 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.agent-card-top:hover .info-icon {
  opacity: 1;
  color: var(--el-color-primary);
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
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-light);
}

.verify-code {
  font-family: 'SF Mono', monospace;
  cursor: pointer;
  font-weight: 600;
}

.agent-targets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.target-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: var(--el-border-radius-small);
  background: var(--el-fill-color);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 12px;
}

.target-chip:hover {
  background: var(--el-fill-color-dark);
  border-color: var(--el-color-primary-light-5);
}

.target-id {
  font-family: 'SF Mono', monospace;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

/* 详情弹框 */
.tooltip-info {
  font-size: 12px;
  line-height: 1.8;
}

.tooltip-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 2px 0;
}

.tooltip-label {
  color: var(--el-text-color-secondary);
  min-width: 60px;
  flex-shrink: 0;
  font-weight: 500;
}

.tooltip-row code {
  font-family: 'SF Mono', monospace;
  background: var(--el-fill-color-light);
  padding: 0 6px;
  border-radius: 3px;
  font-size: 11px;
  color: var(--el-text-color-primary);
}

.tooltip-highlight {
  color: var(--el-color-warning);
  font-weight: 700;
  font-size: 13px;
}

.tooltip-tokens {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 2px;
}

.token-tag {
  font-family: 'SF Mono', monospace;
  font-size: 11px;
  cursor: pointer;
}

.tooltip-empty {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

/* 空状态 */
.gm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: var(--el-text-color-placeholder);
  gap: 12px;
}

.gm-empty p {
  font-size: 13px;
  margin: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .gm-body {
    padding: 16px;
  }

  .agent-grid {
    grid-template-columns: 1fr;
  }

  .controller-grid {
    grid-template-columns: 1fr;
  }
}
</style>
