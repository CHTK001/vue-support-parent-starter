<template>
  <div class="gateway-manage">
    <div class="gm-header">
      <h3>网关管理</h3>
      <div class="gm-toolbar">
        <el-button size="small" :icon="Refresh" :loading="loading" @click="fetchInfo">刷新</el-button>
        <el-button size="small" circle @click="settingsVisible = true">
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

    <div v-if="error" class="gm-error">{{ error }}</div>

    <template v-if="health">
      <!-- 控制端列表 -->
      <el-divider content-position="left">控制端 ({{ controllers.length }})</el-divider>
      <div v-if="controllers.length === 0" class="gm-empty">无在线控制端</div>
      <div v-else class="gm-summary" style="flex-wrap:wrap;">
        <div v-for="c in controllers" :key="c.id" class="gm-stat" style="gap:12px;">
          <el-tag size="small" type="success" effect="dark">在线</el-tag>
          <el-tag size="small" type="info" effect="plain">{{ c.type || 'web' }}</el-tag>
          <code style="font-size:12px;">{{ c.ipAddress }}</code>
          <span style="font-size:11px;color:var(--el-text-color-placeholder);">{{ formatTime(c.connectedAt) }}</span>
        </div>
      </div>

      <!-- 概览 -->
      <el-divider content-position="left">网关概览</el-divider>
      <div class="gm-summary">
        <div class="gm-stat">
          <span class="gm-stat-label">健康</span>
          <el-tag :type="health.status === 'UP' ? 'success' : 'danger'" size="small" effect="dark">{{ health.status }}</el-tag>
        </div>
        <div class="gm-stat">
          <span class="gm-stat-label">被控端点</span>
          <span class="gm-stat-value">{{ health.agents }}</span>
        </div>
        <div class="gm-stat">
          <span class="gm-stat-label">可用 Target</span>
          <span class="gm-stat-value">{{ health.targets }}</span>
        </div>
      </div>

      <!-- 被控端点（合并 Agent + Target） -->
      <el-divider content-position="left">被控端点</el-divider>
      <div v-if="agents.length === 0" class="gm-empty">无在线被控端点</div>
      <div v-else class="gm-list">
        <div v-for="a in agents" :key="a.agentId" class="gm-item agent-item">
          <el-tooltip placement="right" :width="300" trigger="click">
            <template #content>
              <div class="tooltip-info">
                <div class="tooltip-row"><span class="tooltip-label">端点 ID</span><code>{{ a.agentId }}</code></div>
                <div class="tooltip-row"><span class="tooltip-label">类型</span><el-tag size="small" :type="a.agentType === 'java' ? 'primary' : a.agentType === 'rust' ? 'warning' : 'info'" effect="plain">{{ a.agentType || 'unknown' }}</el-tag></div>
                <div class="tooltip-row"><span class="tooltip-label">验证码</span><code style="color:var(--el-color-warning);font-weight:700;font-size:14px;">{{ a.verifyCode || '-' }}</code></div>
                <div class="tooltip-row"><span class="tooltip-label">IP 地址</span><code>{{ a.ipAddress || '-' }}</code></div>
                <div class="tooltip-row"><span class="tooltip-label">远程端口</span><code>{{ a.remotePort || '-' }}</code></div>
                <div class="tooltip-row"><span class="tooltip-label">协议</span><span>{{ a.protocols?.join(", ") }}</span></div>
                <div class="tooltip-row"><span class="tooltip-label">编码器</span><span>{{ a.codecs?.join(", ") }}</span></div>
                <div class="tooltip-row"><span class="tooltip-label">操作系统</span><span>{{ a.capabilities?.['os.name'] || '-' }}</span></div>
                <div class="tooltip-row"><span class="tooltip-label">系统架构</span><span>{{ a.capabilities?.['os.arch'] || '-' }}</span></div>
                <div class="tooltip-row"><span class="tooltip-label">系统版本</span><span>{{ a.capabilities?.['os.version'] || '-' }}</span></div>
                <div class="tooltip-row"><span class="tooltip-label">绑定令牌</span>
                  <span v-if="getBoundTokens(a.agentId).length > 0">
                    <el-tag v-for="tk in getBoundTokens(a.agentId)" :key="tk.token" size="small" type="warning" effect="plain" style="font-family:monospace;font-size:11px;cursor:pointer;margin:1px;" @click.stop="copyText(tk.token)" :title="'点击复制: ' + maskToken(tk.token)">{{ maskToken(tk.token) }}</el-tag>
                  </span>
                  <span v-else style="color:var(--el-text-color-placeholder);font-size:12px;">无</span>
                </div>
              </div>
            </template>
            <span class="gm-agent-trigger">
              <el-tag size="small" type="success" effect="dark" class="gm-badge">在线</el-tag>
              <el-tag v-if="a.agentType" size="small" :type="a.agentType === 'java' ? 'primary' : a.agentType === 'rust' ? 'warning' : 'info'" effect="plain" class="gm-badge">{{ a.agentType }}</el-tag>
              <code class="gm-id">{{ a.agentId }}</code>
              <span class="gm-agent-meta">
                <span v-if="a.ipAddress" class="meta-item" title="IP 地址">{{ a.ipAddress }}</span>
                <span v-if="a.remotePort" class="meta-item" title="远程端口">:{{ a.remotePort }}</span>
                <span v-if="a.capabilities?.['os.name']" class="meta-item" title="操作系统">{{ a.capabilities['os.name'] }}</span>
              </span>
              <el-tag v-if="a.verifyCode" size="small" type="warning" effect="plain" style="font-family:monospace;font-size:12px;cursor:pointer;" @click.stop="copyVerifyCode(a.verifyCode)" title="点击复制验证码">{{ a.verifyCode }}</el-tag>
              <el-icon class="gm-info-icon" :size="14"><InfoFilled /></el-icon>
            </span>
          </el-tooltip>
          <div class="agent-targets">
            <div v-for="t in getTargetsForAgent(a.agentId)" :key="t.targetId" class="target-chip" @click="handleTargetClick(t)" :title="'点击复制: ' + t.targetId">
              <el-tag size="small" :type="t.online ? 'success' : 'info'" effect="plain">{{ t.protocol }}</el-tag>
              <code class="target-id">{{ t.targetId }}</code>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="!loading && !error" class="gm-empty">点击"刷新"查询网关状态</div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from "vue";
import { Refresh, Setting, InfoFilled } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { Ref } from "vue";

const injectedToken = inject<Ref<string>>("clientToken");
const injectedAccessCode = inject<Ref<string>>("accessCode");

// 从父组件注入控制端信息（用于 updateTargets）
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

// 从 localStorage 恢复配置
const savedHost = localStorage.getItem("gateway-manage-host");
const savedPort = localStorage.getItem("gateway-manage-port");
const savedMgmtPort = localStorage.getItem("gateway-manage-mgmt-port");
if (savedHost) gatewayHost.value = savedHost;
if (savedPort) gatewayPort.value = Number(savedPort);
if (savedMgmtPort) managementPort.value = Number(savedMgmtPort);

async function fetchInfo() {
  loading.value = true;
  error.value = "";
  health.value = null;
  agents.value = [];
  targets.value = [];
  controllers.value = [];
  try {
    const base = `http://${gatewayHost.value}:${gatewayPort.value}`;
    const mgmtBase = `http://${gatewayHost.value}:${managementPort.value}`;
    const token = getToken();
    const qs = token ? `?token=${token}` : "";
    const [h, a, t, c, tk] = await Promise.all([
      fetch(`${base}/health${qs}`),
      fetch(`${base}/agents${qs}`),
      fetch(`${base}/targets/detail${qs}`),
      fetch(`${mgmtBase}${adminPath}/api/controllers${qs}`).catch(() => null),
      fetch(`${base}/tokens${qs}`).catch(() => null),
    ]);
    if (!h.ok) throw new Error(`HTTP ${h.status}`);
    health.value = await h.json();
    agents.value = await a.json();
    const raw: any[] = await t.json();
    targets.value = raw.map((x: any) => ({
      targetId: x.targetId,
      protocol: x.protocol,
      agentId: x.agentId,
      host: x.host,
      port: x.port,
      online: x.agentOnline,
    }));
    // 同步 targets 给父组件的远程控制页（用于 AUTO 协议解析）
    controllerInfo.updateTargets?.(targets.value);
    // 获取控制端列表
    if (c && c.ok) {
      const cData = await c.json();
      controllers.value = cData.controllers || [];
    }
    // 获取令牌列表
    if (tk && tk.ok) {
      tokens.value = await tk.json();
    }
  } catch (e: any) {
    error.value = "请求失败: " + (e.message || "未知");
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
    // 降级方案
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

function handleTargetClick(t: any) {
  copyTargetId(t.targetId);
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
  padding: 24px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  background: var(--el-bg-color);
}
.gm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}
.gm-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--el-text-color-primary);
}
.gm-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
}
.gm-error {
  color: var(--el-color-danger);
  font-size: 13px;
  padding: 8px 12px;
  background: var(--el-color-danger-light-9);
  border-radius: 6px;
  margin-bottom: 12px;
}
.gm-summary {
  display: flex;
  gap: 24px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  margin-bottom: 8px;
}
.gm-stat {
  display: flex;
  align-items: center;
  gap: 6px;
}
.gm-stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.gm-stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.gm-empty {
  text-align: center;
  color: var(--el-text-color-placeholder);
  padding: 24px 0;
  font-size: 13px;
}
.gm-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.gm-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  background: var(--el-fill-color-light);
  cursor: pointer;
  transition: background 0.15s;
}
.gm-item:hover {
  background: var(--el-fill-color);
}
.gm-badge {
  flex-shrink: 0;
}
.gm-agent-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
}
.gm-agent-meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta-item {
  font-family: monospace;
}
.gm-info-icon {
  color: var(--el-text-color-placeholder);
  opacity: 0.6;
  transition: opacity 0.2s;
}
.gm-agent-trigger:hover .gm-info-icon {
  opacity: 1;
  color: var(--el-color-primary);
}
.gm-id {
  font-family: monospace;
  color: var(--el-text-color-primary);
  font-size: 13px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gm-right {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.gm-tag-right {
  margin-left: auto;
  flex-shrink: 0;
}

/* 被控端点 + Target 合并列表 */
.agent-item {
  flex-wrap: wrap;
  align-items: center;
}
.agent-targets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  margin-left: 42px;
  margin-top: 4px;
}
.target-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--el-fill-color);
  cursor: pointer;
  transition: background 0.15s;
  font-size: 12px;
}
.target-chip:hover {
  background: var(--el-fill-color-dark);
}
.target-id {
  font-family: monospace;
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
}
.tooltip-label {
  color: var(--el-text-color-secondary);
  min-width: 60px;
  flex-shrink: 0;
}
.tooltip-row code {
  font-family: monospace;
  background: var(--el-fill-color-light);
  padding: 0 4px;
  border-radius: 3px;
  font-size: 11px;
}
</style>
