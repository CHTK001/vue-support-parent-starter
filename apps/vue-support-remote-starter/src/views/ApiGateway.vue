<template>
  <div class="gateway-page thin-scroller">
    <div class="gp-header">
      <div class="gp-header-left">
        <h3 class="gp-title">网关管理</h3>
        <el-tag :type="wsConnected ? 'success' : 'danger'" size="small" effect="dark">
          {{ wsConnected ? 'WS 已连接' : 'WS 断开' }}
        </el-tag>
      </div>
      <div class="gp-header-right">
        <el-button size="small" @click="openFirewallPage">防火墙</el-button>
        <el-button size="small" type="primary" :loading="refreshing" @click="refresh">刷新</el-button>
      </div>
    </div>

    <div class="gp-body">
      <!-- 统计卡片 -->
      <div class="metrics-grid">
        <div v-for="m in metrics" :key="m.label" class="metric-card">
          <div class="metric-value" :style="{ color: m.color }">{{ m.value }}</div>
          <div class="metric-label">{{ m.label }}</div>
        </div>
      </div>

      <!-- 端口分配 -->
      <el-card shadow="never" class="gp-card">
        <template #header><span class="gp-card-title">端口分配</span></template>
        <div class="port-list">
          <div v-for="p in ports" :key="p.name" class="port-item">
            <el-tag size="small" :type="p.type" effect="plain">{{ p.proto }}</el-tag>
            <span class="port-name">{{ p.name }}</span>
            <code class="port-num">{{ p.port }}</code>
          </div>
        </div>
      </el-card>

      <!-- SOCKS5 代理 -->
      <el-card shadow="never" class="gp-card">
        <template #header>
          <div class="gp-card-header">
            <span class="gp-card-title">SOCKS5 代理</span>
            <el-button size="small" type="primary" @click="showAddProxy = true">添加代理</el-button>
          </div>
        </template>
        <div v-if="proxies.length === 0" class="gp-empty">暂无代理服务器</div>
        <div v-else class="proxy-list">
          <div v-for="p in proxies" :key="p.id" class="proxy-item">
            <el-tag size="small" :type="p.type.includes('socks') ? 'warning' : 'info'" effect="plain">{{ p.type }}</el-tag>
            <span class="proxy-name">{{ p.name }}</span>
            <code class="proxy-port">{{ p.port }}</code>
            <span v-if="p.targetHost && p.targetPort" class="proxy-target">→ {{ p.targetHost }}:{{ p.targetPort }}</span>
            <span class="proxy-status">
              <el-tag size="small" :type="p.running ? 'success' : 'info'" effect="dark">{{ p.running ? '运行中' : '已停止' }}</el-tag>
            </span>
            <div class="proxy-actions">
              <el-button v-if="!p.running" size="small" type="success" plain @click="proxyStart(p)">启动</el-button>
              <el-button v-else size="small" type="warning" plain @click="proxyStop(p)">停止</el-button>
              <el-button size="small" type="danger" plain @click="proxyDelete(p)">删除</el-button>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 控制端 -->
      <el-card shadow="never" class="gp-card">
        <template #header><span class="gp-card-title">控制端 ({{ controllers.length }} 连接 / {{ sessions.length }} 会话)</span></template>
        <div v-if="controllers.length === 0 && sessions.length === 0" class="gp-empty">暂无在线控制端</div>
        <div v-else class="controller-list">
          <div v-for="group in controllerGroups" :key="group.ip" class="controller-group">
            <div class="controller-row">
              <el-tag size="small" type="primary" effect="dark">{{ group.ip }}</el-tag>
              <el-badge :value="group.items.length" :max="99" />
              <span class="ctrl-type">{{ group.items[0]?.type || 'web' }}</span>
              <span class="ctrl-time">{{ formatTime(group.items[0]?.connectedAt) }}</span>
              <el-button size="small" type="danger" plain @click="kickAllControllers(group.ip)" style="margin-left:auto">踢出</el-button>
            </div>
            <div v-if="groupSessions(group.items).length > 0" class="ctrl-sessions">
              <div v-for="s in groupSessions(group.items)" :key="s.sessionId" class="session-row">
                <el-tag size="small" :type="targetProtocolType(s.protocol)" effect="dark">{{ s.protocol }}</el-tag>
                <code class="sess-id">{{ s.sessionId?.slice(0, 10) }}...</code>
                <span v-if="s.targetId" class="sess-target"><el-icon :size="11"><Aim /></el-icon> {{ s.targetId }}</span>
                <span class="sess-bytes">{{ formatBytes(s.bytesSent) }} / {{ formatBytes(s.bytesReceived) }}</span>
                <span class="sess-duration">{{ formatDuration(s.createdAt) }}</span>
                <el-tag size="small" :type="s.status === 'ACTIVE' ? 'success' : 'info'" effect="plain">{{ s.status || s.mode }}</el-tag>
                <el-button text size="small" type="danger" @click="kickSession(s.sessionId)">关闭</el-button>
              </div>
            </div>
          </div>
          <div v-if="orphanSessions.length > 0" class="controller-group">
            <div class="controller-row">
              <el-tag size="small" type="info" effect="dark">其他会话</el-tag>
              <el-badge :value="orphanSessions.length" :max="99" />
            </div>
            <div class="ctrl-sessions">
              <div v-for="s in orphanSessions" :key="s.sessionId" class="session-row">
                <el-tag size="small" :type="targetProtocolType(s.protocol)" effect="dark">{{ s.protocol }}</el-tag>
                <code class="sess-id">{{ s.sessionId?.slice(0, 10) }}...</code>
                <span v-if="s.targetId" class="sess-target"><el-icon :size="11"><Aim /></el-icon> {{ s.targetId }}</span>
                <span class="sess-bytes">{{ formatBytes(s.bytesSent) }} / {{ formatBytes(s.bytesReceived) }}</span>
                <span class="sess-duration">{{ formatDuration(s.createdAt) }}</span>
                <el-button text size="small" type="danger" @click="kickSession(s.sessionId)">关闭</el-button>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 被控端 -->
      <el-card shadow="never" class="gp-card">
        <template #header><span class="gp-card-title">被控端 ({{ agents.length }})</span></template>
        <div v-if="agents.length === 0" class="gp-empty">暂无在线被控端</div>
        <div v-else class="agent-list">
          <div v-for="a in agents" :key="a.agentId" class="agent-card" :class="{ 'agent-disabled': a.disabled }">
            <div class="agent-header">
              <div class="agent-header-left">
                <el-tag v-if="a.disabled" size="small" type="info" effect="dark">已禁用</el-tag>
                <el-tag v-else size="small" type="success" effect="dark">在线</el-tag>
                <el-tag v-if="a.agentType" size="small" :type="a.agentType === 'java' ? 'primary' : 'warning'" effect="plain">{{ a.agentType }}</el-tag>
                <code class="agent-id">{{ a.agentId }}</code>
                <span v-if="a.ipAddress" class="agent-ip">{{ a.ipAddress }}:{{ a.remotePort }}</span>
                <span v-if="a.osInfo" class="agent-os">{{ a.osInfo }}</span>
                <span class="agent-rtt" :class="rttClass(a.lastRttMs, a.lastHeartbeatAt)">
                  {{ formatRtt(a.lastRttMs, a.lastHeartbeatAt) }}
                </span>
              </div>
              <div class="agent-header-right">
                <el-tag v-if="a.verifyCode" size="small" type="warning" effect="plain" style="cursor:pointer" @click.stop="copyText(a.verifyCode)" title="点击复制">
                  验证码: {{ a.verifyCode }}
                </el-tag>
                <el-button v-if="a.disabled" size="small" type="success" plain @click="toggleAgentDisable(a.agentId, false)">启用</el-button>
                <el-button v-else size="small" type="danger" plain @click="toggleAgentDisable(a.agentId, true)">停用</el-button>
              </div>
            </div>
            <div v-if="a.targets?.length" class="target-section">
              <div v-for="tg in a.targets" :key="tg.targetId" class="target-row">
                <code class="target-id" @click.stop="copyText(tg.targetId)" title="点击复制">{{ tg.targetId }}</code>
                <el-tag size="small" :type="targetProtocolType(tg.protocol)" effect="dark">{{ tg.protocol || 'UNKNOWN' }}</el-tag>
                <code class="target-host">{{ tg.host }}:{{ tg.port }}</code>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 添加代理弹窗 -->
    <el-dialog v-model="showAddProxy" title="添加代理服务器" width="480px" append-to-body>
      <el-form label-position="top" size="default">
        <el-form-item label="代理名称">
          <el-input v-model="proxyForm.name" placeholder="SOCKS5 代理 1" />
        </el-form-item>
        <el-form-item label="代理类型">
          <el-select v-model="proxyForm.type" style="width:100%">
            <el-option label="SOCKS5 代理" value="netty-socks5" />
            <el-option label="TCP 代理" value="netty-tcp-proxy" />
          </el-select>
        </el-form-item>
        <el-form-item label="监听端口">
          <el-input-number v-model="proxyForm.port" :min="1024" :max="65535" style="width:100%" />
        </el-form-item>
        <el-form-item v-if="proxyForm.type === 'netty-tcp-proxy'" label="目标地址">
          <el-input v-model="proxyForm.targetHost" placeholder="127.0.0.1" style="width:60%" />
          <el-input-number v-model="proxyForm.targetPort" :min="1" :max="65535" placeholder="端口" style="width:40%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddProxy = false">取消</el-button>
        <el-button type="primary" :loading="proxyCreating" @click="proxyCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject } from "vue";
import { Aim } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";

import type { Ref } from "vue";

const injectedToken = inject<Ref<string>>("clientToken");
const injectedAccessCode = inject<Ref<string>>("accessCode");

const gatewayHost = ref("127.0.0.1");
const gatewayPort = ref(8083);
const managementPort = ref(3000);
const refreshing = ref(false);
const wsConnected = ref(false);

const health = ref<{ status: string; agents: number; targets: number } | null>(null);
const agents = ref<any[]>([]);
const sessions = ref<any[]>([]);
const controllers = ref<any[]>([]);
const targets = ref<any[]>([]);

const totalBytesSent = ref(0);
const totalBytesReceived = ref(0);
let durationTimer: ReturnType<typeof setInterval> | null = null;
const tick = ref(0);

// SOCKS5 代理状态
const proxies = ref<any[]>([]);
const showAddProxy = ref(false);
const proxyCreating = ref(false);
const proxyForm = ref({ name: "", type: "netty-socks5", port: 1080, targetHost: "", targetPort: 0 });

const metrics = computed(() => [
  { label: '健康状态', value: health.value?.status || '-', color: 'var(--el-color-success)' },
  { label: '在线被控端', value: health.value?.agents ?? '-', color: 'var(--el-color-primary)' },
  { label: '可用 Target', value: health.value?.targets ?? '-', color: 'var(--el-color-warning)' },
  { label: '在线控制端', value: uniqueControllerIps.value, color: 'var(--el-color-info)' },
  { label: '活跃会话', value: sessions.value.length, color: 'var(--el-color-primary)' },
  { label: '上行总量', value: formatBytes(totalBytesSent.value), color: 'var(--el-color-success)' },
  { label: '下行总量', value: formatBytes(totalBytesReceived.value), color: 'var(--el-color-danger)' },
]);

const ports = [
  { name: "TCP 控制端口", port: 9000, proto: "TCP", type: "primary" as const },
  { name: "TCP Agent 注册", port: 9001, proto: "TCP", type: "success" as const },
  { name: "HTTP 管理端口", port: 3000, proto: "HTTP", type: "info" as const },
  { name: "REST API 端口", port: 8083, proto: "HTTP", type: "info" as const },
  { name: "WS 业务端口", port: 8081, proto: "WS", type: "warning" as const },
  { name: "WS 远程控制", port: 8082, proto: "WS", type: "warning" as const },
];

const controllerGroups = computed(() => {
  const map = new Map<string, any[]>();
  for (const c of controllers.value) {
    const ip = c.ipAddress || '未知IP';
    if (!map.has(ip)) map.set(ip, []);
    map.get(ip)!.push(c);
  }
  return Array.from(map.entries()).map(([ip, items]) => ({ ip, items }));
});

const uniqueControllerIps = computed(() => controllerGroups.value.length);

function groupSessions(ctrlItems: any[]): any[] {
  const ids = new Set(ctrlItems.map(c => c.id));
  return sessions.value.filter(s => s.clientId && ids.has(s.clientId));
}

const orphanSessions = computed(() => {
  const allCtrlIds = new Set(controllers.value.map((c: any) => c.id));
  return sessions.value.filter(s => !s.clientId || !allCtrlIds.has(s.clientId));
});

function getToken(): string {
  return injectedToken?.value || injectedAccessCode?.value || localStorage.getItem("remote-client-token") || "";
}

function connectWs() {
  const host = location.hostname || "127.0.0.1";
  const token = getToken();
  const wsUrl = token ? `ws://${host}:8082?token=${token}` : `ws://${host}:8082`;
  const ws = new WebSocket(wsUrl);
  ws.onopen = () => { wsConnected.value = true; };
  ws.onclose = () => { wsConnected.value = false; setTimeout(connectWs, 3000); };
  ws.onerror = () => { wsConnected.value = false; };
}

async function refresh() {
  refreshing.value = true;
  const base = `http://${gatewayHost.value}:${gatewayPort.value}`;
  const mgmtBase = `http://${gatewayHost.value}:${managementPort.value}`;
  const token = getToken();
  const qs = token ? `?token=${token}` : "";
  try {
    const [h, a, s, c, t] = await Promise.all([
      fetch(`${base}/health${qs}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${base}/agents${qs}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${base}/sessions${qs}`).then(r => r.ok ? r.json() : { sessions: [] }).catch(() => ({ sessions: [] })),
      fetch(`${mgmtBase}/admin/api/controllers${qs}`).then(r => r.ok ? r.json() : { controllers: [] }).catch(() => ({ controllers: [] })),
      fetch(`${base}/targets${qs}`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]);
    if (h) health.value = h;
    targets.value = t || [];
    agents.value = (a || []).map((agent: any) => ({
      ...agent, osInfo: buildOsInfo(agent.capabilities),
      targets: (t || []).filter((tg: any) => tg.agentId === agent.agentId),
    }));
    sessions.value = (s?.sessions || []).map((x: any) => ({ ...x, protocol: x.protocol || 'UNKNOWN' }));
    controllers.value = c?.controllers || [];
    let sent = 0, recv = 0;
    for (const sess of sessions.value) { sent += sess.bytesSent || 0; recv += sess.bytesReceived || 0; }
    totalBytesSent.value = sent; totalBytesReceived.value = recv;
  } catch (e: any) {
    ElMessage.error("刷新失败: " + e.message);
  } finally { refreshing.value = false; }
}

function buildOsInfo(cap: Record<string, string> | undefined): string {
  if (!cap) return '';
  return [cap['os.name'], cap['os.version'], cap['os.arch']].filter(Boolean).join(' ');
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + u[i];
}

function formatDuration(createdAt: string | undefined): string {
  if (!createdAt) return '-';
  void tick.value;
  const diff = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatRtt(rtt: number | undefined, hb: string | undefined): string {
  if (rtt !== undefined && rtt >= 0) return rtt + 'ms';
  if (!hb) return '无心跳';
  void tick.value;
  const diff = Date.now() - new Date(hb).getTime();
  if (diff < 1000) return '< 1s';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  return `${Math.floor(diff / 3600000)}h`;
}

function rttClass(rtt: number | undefined, hb: string | undefined): string {
  const v = rtt !== undefined && rtt >= 0 ? rtt : (hb ? Date.now() - new Date(hb).getTime() : Infinity);
  if (v < 100) return 'rtt-green';
  if (v < 500) return 'rtt-yellow';
  return 'rtt-red';
}

function targetProtocolType(proto: string): 'info' | 'success' | 'warning' | 'primary' | 'danger' {
  if (!proto) return 'info';
  const p = proto.toUpperCase();
  if (p === 'SSH') return 'success';
  if (p === 'RDP' || p === 'VNC' || p === 'DESKTOP') return 'primary';
  if (p === 'HTTP' || p === 'HTTPS') return 'warning';
  return 'info';
}

function formatTime(iso: string | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString();
}

async function kickController(id: string) {
  try { await ElMessageBox.confirm(`确定踢出控制端 ${id}？`, '确认', { type: 'warning' }); } catch { return; }
  const qs = `?token=${getToken()}`;
  const resp = await fetch(`http://${gatewayHost.value}:${managementPort.value}/admin/api/controllers/${id}${qs}`, { method: 'DELETE' });
  if (resp.ok) { ElMessage.success('已踢出'); refresh(); } else ElMessage.error('踢出失败');
}

async function kickSession(sessionId: string) {
  try { await ElMessageBox.confirm(`确定关闭会话 ${sessionId.slice(0, 12)}...？`, '确认', { type: 'warning' }); } catch { return; }
  const qs = `?token=${getToken()}`;
  const resp = await fetch(`http://${gatewayHost.value}:${gatewayPort.value}/sessions/${sessionId}${qs}`, { method: 'DELETE' });
  if (resp.ok) { ElMessage.success('会话已关闭'); refresh(); } else ElMessage.error('关闭失败');
}

async function kickAllControllers(ip: string) {
  const group = controllerGroups.value.find(g => g.ip === ip);
  if (!group) return;
  try { await ElMessageBox.confirm(`确定踢出 ${ip} 下的 ${group.items.length} 个控制端？`, '确认', { type: 'warning' }); } catch { return; }
  const qs = `?token=${getToken()}`;
  let kicked = 0;
  for (const c of group.items) {
    const resp = await fetch(`http://${gatewayHost.value}:${managementPort.value}/admin/api/controllers/${c.id}${qs}`, { method: 'DELETE' });
    if (resp.ok) kicked++;
  }
  ElMessage.success(`已踢出 ${kicked} 个控制端`); refresh();
}

async function toggleAgentDisable(agentId: string, disable: boolean) {
  const action = disable ? '停用' : '启用';
  try { await ElMessageBox.confirm(`确定${action}被控端 ${agentId}？`, '确认', { type: 'warning' }); } catch { return; }
  const qs = `?token=${getToken()}`;
  const resp = await fetch(`http://${gatewayHost.value}:${managementPort.value}/admin/api/agents/${agentId}/${disable ? 'disable' : 'enable'}${qs}`, { method: 'PUT' });
  if (resp.ok) { ElMessage.success(`已${action}`); refresh(); } else ElMessage.error(`${action}失败`);
}

async function copyText(text: string) {
  if (!text) return;
  try { await navigator.clipboard.writeText(text); ElMessage.success("已复制"); } catch {}
}

async function fetchProxies() {
  const mgmtBase = `http://${gatewayHost.value}:${managementPort.value}`;
  const token = getToken();
  const qs = token ? `?token=${token}` : "";
  try {
    const resp = await fetch(`${mgmtBase}/admin/api/proxies${qs}`);
    if (resp.ok) proxies.value = await resp.json();
  } catch {}
}

async function proxyCreate() {
  proxyCreating.value = true;
  const mgmtBase = `http://${gatewayHost.value}:${managementPort.value}`;
  const token = getToken();
  const qs = token ? `?token=${token}` : "";
  try {
    const resp = await fetch(`${mgmtBase}/admin/api/proxies${qs}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proxyForm.value),
    });
    if (resp.ok) {
      ElMessage.success("代理已创建");
      showAddProxy.value = false;
      await fetchProxies();
    } else {
      const text = await resp.text();
      ElMessage.error("创建失败: " + text);
    }
  } catch (e: any) {
    ElMessage.error("创建异常: " + e.message);
  } finally {
    proxyCreating.value = false;
  }
}

async function proxyStart(proxy: any) {
  const mgmtBase = `http://${gatewayHost.value}:${managementPort.value}`;
  const token = getToken();
  const qs = token ? `?token=${token}` : "";
  try {
    const resp = await fetch(`${mgmtBase}/admin/api/proxies/${proxy.id}/start${qs}`, { method: "POST" });
    if (resp.ok) { ElMessage.success("代理已启动"); await fetchProxies(); }
    else { const t = await resp.text(); ElMessage.error("启动失败: " + t); }
  } catch (e: any) { ElMessage.error("启动异常: " + e.message); }
}

async function proxyStop(proxy: any) {
  const mgmtBase = `http://${gatewayHost.value}:${managementPort.value}`;
  const token = getToken();
  const qs = token ? `?token=${token}` : "";
  try {
    const resp = await fetch(`${mgmtBase}/admin/api/proxies/${proxy.id}/stop${qs}`, { method: "POST" });
    if (resp.ok) { ElMessage.success("代理已停止"); await fetchProxies(); }
    else { const t = await resp.text(); ElMessage.error("停止失败: " + t); }
  } catch (e: any) { ElMessage.error("停止异常: " + e.message); }
}

async function proxyDelete(proxy: any) {
  try { await ElMessageBox.confirm(`确定删除代理 ${proxy.name}？`, "确认", { type: "warning" }); } catch { return; }
  const mgmtBase = `http://${gatewayHost.value}:${managementPort.value}`;
  const token = getToken();
  const qs = token ? `?token=${token}` : "";
  try {
    const resp = await fetch(`${mgmtBase}/admin/api/proxies${qs}&id=${proxy.id}`, { method: "DELETE" });
    if (resp.ok) { ElMessage.success("代理已删除"); await fetchProxies(); }
    else ElMessage.error("删除失败");
  } catch (e: any) { ElMessage.error("删除异常: " + e.message); }
}

function openFirewallPage() {
  const token = getToken();
  const baseUrl = window.location.origin + window.location.pathname;
  window.open(`${baseUrl}?view=firewall${token ? `&token=${token}` : ''}`, 'firewall', 'width=1200,height=800');
}

onMounted(() => { refresh(); fetchProxies(); connectWs(); durationTimer = setInterval(() => tick.value++, 30000); });
onUnmounted(() => { if (durationTimer) { clearInterval(durationTimer); durationTimer = null; } });
</script>

<style scoped>
.gateway-page { height: 100%; overflow-y: auto; background: var(--el-bg-color-page); }
.gp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px; border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}
.gp-header-left { display: flex; align-items: center; gap: 10px; }
.gp-title { font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); margin: 0; }
.gp-header-right { display: flex; gap: 8px; }
.gp-body { padding: 16px 24px; display: flex; flex-direction: column; gap: 16px; }

.metrics-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px;
}
.metric-card {
  background: var(--el-bg-color); border: 1px solid var(--el-border-color-light);
  border-radius: 10px; padding: 16px; text-align: center;
  transition: box-shadow 0.2s;
}
.metric-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.metric-value { font-size: 24px; font-weight: 700; font-family: 'SF Mono', monospace; line-height: 1; }
.metric-label { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 6px; }

.gp-card { border-radius: 10px; border: 1px solid var(--el-border-color-light); }
.gp-card :deep(.el-card__header) {
  padding: 12px 20px; border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}
.gp-card-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.gp-empty { text-align: center; color: var(--el-text-color-placeholder); padding: 32px 0; font-size: 13px; }

.port-list { display: flex; flex-wrap: wrap; gap: 8px; }
.port-item {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 14px; background: var(--el-fill-color-light); border-radius: 8px;
  font-size: 12px; border: 1px solid var(--el-border-color-lighter);
}
.port-name { color: var(--el-text-color-regular); font-weight: 500; }
.port-num { font-family: 'SF Mono', monospace; font-weight: 700; color: var(--el-color-primary); }

.controller-list { display: flex; flex-direction: column; gap: 8px; }
.controller-group {
  background: var(--el-fill-color-lighter); border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter); overflow: hidden;
}
.controller-row { display: flex; align-items: center; gap: 10px; padding: 10px 16px; }
.ctrl-type { font-size: 11px; color: var(--el-text-color-placeholder); }
.ctrl-time { font-size: 11px; color: var(--el-text-color-placeholder); font-family: 'SF Mono', monospace; }
.ctrl-sessions { border-top: 1px solid var(--el-border-color-lighter); padding: 8px 12px; display: flex; flex-direction: column; gap: 4px; }
.session-row {
  display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 6px;
  font-size: 12px; transition: background 0.15s;
}
.session-row:hover { background: var(--el-fill-color-light); }
.sess-id { font-family: 'SF Mono', monospace; font-size: 11px; color: var(--el-text-color-placeholder); }
.sess-target { font-family: 'SF Mono', monospace; font-size: 11px; color: var(--el-color-primary); font-weight: 600; display: inline-flex; align-items: center; gap: 3px; }
.sess-bytes { font-size: 11px; color: var(--el-text-color-placeholder); }
.sess-duration { font-size: 11px; color: var(--el-text-color-secondary); font-family: 'SF Mono', monospace; }

.agent-list { display: flex; flex-direction: column; gap: 10px; }
.agent-card {
  background: var(--el-bg-color); border-radius: 10px;
  border: 1px solid var(--el-border-color-light); overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.agent-card:hover { border-color: var(--el-color-primary-light-5); box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.agent-disabled { opacity: 0.5; }
.agent-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; flex-wrap: wrap; }
.agent-header-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; flex-wrap: wrap; }
.agent-header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.agent-id { font-family: 'SF Mono', monospace; font-size: 13px; font-weight: 700; color: var(--el-text-color-primary); }
.agent-ip { font-family: 'SF Mono', monospace; font-size: 12px; color: var(--el-text-color-secondary); }
.agent-os { font-size: 12px; color: var(--el-text-color-placeholder); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.agent-rtt { font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 6px; }
.rtt-green { color: var(--el-color-success); background: var(--el-color-success-light-9); }
.rtt-yellow { color: var(--el-color-warning); background: var(--el-color-warning-light-9); }
.rtt-red { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }

.target-section { border-top: 1px solid var(--el-border-color-lighter); padding: 10px 16px; display: flex; flex-direction: column; gap: 4px; }
.target-row { display: flex; align-items: center; gap: 10px; padding: 4px 0; font-size: 12px; }
.target-id { font-family: 'SF Mono', monospace; font-size: 12px; color: var(--el-text-color-regular); font-weight: 600; cursor: pointer; }
.target-id:hover { color: var(--el-color-primary); }
.target-host { font-family: 'SF Mono', monospace; font-size: 12px; color: var(--el-text-color-placeholder); margin-left: auto; }

.gp-card-header { display: flex; align-items: center; justify-content: space-between; }
.proxy-list { display: flex; flex-direction: column; gap: 6px; }
.proxy-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  background: var(--el-fill-color-light); border-radius: 8px; font-size: 12px;
  border: 1px solid var(--el-border-color-lighter); transition: background 0.15s;
}
.proxy-item:hover { background: var(--el-fill-color); }
.proxy-name { font-weight: 600; color: var(--el-text-color-primary); min-width: 100px; }
.proxy-port { font-family: 'SF Mono', monospace; font-weight: 700; color: var(--el-color-primary); min-width: 60px; }
.proxy-target { font-size: 11px; color: var(--el-text-color-secondary); font-family: 'SF Mono', monospace; flex: 1; }
.proxy-status { flex-shrink: 0; }
.proxy-actions { display: flex; gap: 4px; flex-shrink: 0; }

.thin-scroller::-webkit-scrollbar { width: 5px; height: 5px; }
.thin-scroller::-webkit-scrollbar-track { background: transparent; }
.thin-scroller::-webkit-scrollbar-thumb { background: var(--el-border-color-darker); border-radius: 3px; }
</style>