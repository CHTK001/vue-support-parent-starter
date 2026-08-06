<template>
  <div class="api-gw thin-scroller">
    <!-- 头部 -->
    <div class="gw-header">
      <div class="gw-header-left">
        <h3 class="gw-title">API 网关</h3>
        <el-tag :type="wsConnected ? 'success' : 'danger'" size="small" effect="dark">
          {{ wsConnected ? 'WS 已连接' : 'WS 断开' }}
        </el-tag>
      </div>
      <div class="gw-header-right">
        <el-button size="small" @click="openFirewallPage">
          <el-icon><Warning /></el-icon> 防火墙
        </el-button>
        <el-button size="small" type="primary" :loading="refreshing" @click="refresh">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="gw-metrics-grid">
      <div class="gw-metric-card">
        <div class="gw-metric-label">已注册应用</div>
        <div class="gw-metric-value" style="color: var(--el-color-primary)">{{ httpAgents.length }}</div>
      </div>
      <div class="gw-metric-card">
        <div class="gw-metric-label">在线运行</div>
        <div class="gw-metric-value" style="color: var(--el-color-success)">{{ httpAgents.filter(a => a.online && !a.disabled).length }}</div>
      </div>
      <div class="gw-metric-card">
        <div class="gw-metric-label">已禁用</div>
        <div class="gw-metric-value" style="color: var(--el-color-danger)">{{ httpAgents.filter(a => a.disabled).length }}</div>
      </div>
      <div class="gw-metric-card">
        <div class="gw-metric-label">API 路径数</div>
        <div class="gw-metric-value" style="color: var(--el-color-warning)">{{ pathGroups.length }}</div>
      </div>
    </div>

    <!-- API 路由列表 -->
    <el-card shadow="never" class="gw-section-card">
      <template #header>
        <div class="gw-card-header">
          <span class="gw-card-title">API 路由列表 ({{ pathGroups.length }} 路径)</span>
        </div>
      </template>
      <div v-if="httpAgents.length === 0" class="gw-empty">暂无已注册的 HTTP 应用</div>
      <div v-else class="gw-path-list">
        <div v-for="group in pathGroups" :key="group.path || '__unmatched__'" class="gw-path-group">
          <div class="gw-path-header">
            <div class="gw-path-title">
              <el-tag size="small" type="primary" effect="dark" class="gw-path-badge">
                <el-icon :size="12"><Promotion /></el-icon>
                {{ group.path || '(未设置路径)' }}
              </el-tag>
              <span class="gw-path-count">{{ group.agents.length }} 个实例</span>
              <span class="gw-path-label">策略:</span>
              <el-select v-model="group.strategy" size="small" style="width:140px" @change="updatePathStrategy(group)">
                <el-option label="轮询 (Round Robin)" value="round_robin" />
                <el-option label="最少连接 (Least Connections)" value="least_connections" />
                <el-option label="IP Hash" value="ip_hash" />
                <el-option label="最低 QPS" value="qps" />
              </el-select>
            </div>
          </div>
          <div class="gw-instance-list">
            <div v-for="a in group.agents" :key="a.agentId" class="gw-instance-card" :class="{ 'gw-app-disabled': a.disabled }">
              <div class="gw-instance-left">
                <el-tag v-if="a.disabled" size="small" type="info" effect="dark">禁用</el-tag>
                <el-tag v-else size="small" type="success" effect="dark">在线</el-tag>
                <el-tag v-if="a.agentType" size="small" :type="a.agentType === 'java' ? 'primary' : 'warning'" effect="plain">{{ a.agentType }}</el-tag>
                <code class="gw-instance-id">{{ a.agentId }}</code>
                <span class="gw-instance-ip">{{ a.ipAddress }}:{{ a.remotePort }}</span>
              </div>
              <div class="gw-instance-right">
                <span class="gw-instance-os">{{ a.osInfo }}</span>
                <span class="gw-app-latency" :class="rttClass(a.lastRttMs, a.lastHeartbeatAt)">
                  {{ formatRtt(a.lastRttMs, a.lastHeartbeatAt) }}
                </span>
                <div class="gw-instance-weight">
                  <span class="gw-ops-label">权重</span>
                  <el-input-number v-model="a.weight" :min="1" :max="100" size="small" controls-position="right" style="width:70px" @change="updateAgentWeight(a)" />
                </div>
                <el-button v-if="a.disabled" size="small" type="success" plain @click="toggleDisable(a, false)">启用</el-button>
                <el-button v-else size="small" type="danger" plain @click="toggleDisable(a, true)">禁用</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject } from "vue";
import { Refresh, Promotion, Warning } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

import type { Ref } from "vue";

const injectedToken = inject<Ref<string>>("clientToken");
const injectedAccessCode = inject<Ref<string>>("accessCode");
const injectedGatewayWsConnected = inject<Ref<boolean>>("gatewayWsConnected");

const managementPort = ref(3000);
const initialApiPort = Number(localStorage.getItem("gateway-manage-port") || 8083);
const apiPort = ref(initialApiPort);
const remoteApiHost = ref(localStorage.getItem("remote-api-host") || "127.0.0.1");
const remoteApiPort = ref(Number(localStorage.getItem("remote-api-port") || 8083));
const refreshing = ref(false);
const wsConnected = computed(() => injectedGatewayWsConnected?.value ?? false);

const agents = ref<any[]>([]);
const pathStrategies = ref<Record<string, string>>({});

const tick = ref(0);

const isHttpAgent = (a: any): boolean => {
  const protos = (a.protocols || []).map((p: string) => p.toUpperCase());
  return protos.includes('HTTP') || protos.includes('HTTPS');
};

const httpAgents = computed(() => agents.value.filter(isHttpAgent));

interface PathGroup {
  path: string;
  strategy: string;
  agents: any[];
}

const pathGroups = computed<PathGroup[]>(() => {
  const map = new Map<string, any[]>();
  for (const a of httpAgents.value) {
    const p = a.apiPath || '';
    if (!map.has(p)) map.set(p, []);
    map.get(p)!.push(a);
  }
  const groups: PathGroup[] = [];
  for (const [path, ags] of map) {
    groups.push({
      path,
      strategy: pathStrategies.value[path] || 'round_robin',
      agents: ags,
    });
  }
  groups.sort((a, b) => {
    if (a.path && !b.path) return -1;
    if (!a.path && b.path) return 1;
    return a.path.localeCompare(b.path);
  });
  return groups;
});

function getToken(): string {
  return injectedToken?.value || injectedAccessCode?.value || localStorage.getItem("remote-client-token") || "";
}

const savedMgmtPort = localStorage.getItem("gateway-manage-mgmt-port");
const savedApiPort = localStorage.getItem("gateway-manage-port");
if (savedMgmtPort) managementPort.value = Number(savedMgmtPort);
if (savedApiPort) apiPort.value = Number(savedApiPort);

async function fetchPathStrategies() {
  const base = `http://${remoteApiHost.value}:${remoteApiPort.value}/admin/api`;
  const token = getToken();
  const qs = token ? `?token=${token}` : "";
  try {
    const resp = await fetch(`${base}/path-strategies${qs}`);
    if (resp.ok) {
      pathStrategies.value = await resp.json();
    }
  } catch {}
}

async function refresh() {
  refreshing.value = true;
  const base = `http://${remoteApiHost.value}:${remoteApiPort.value}/admin/api`;
  const token = getToken();
  const qs = token ? `?token=${token}` : "";
  try {
    const [data, strategies] = await Promise.all([
      fetch(`${base}/agents${qs}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${base}/path-strategies${qs}`).then(r => r.ok ? r.json() : {}).catch(() => ({})),
    ]);
    agents.value = (data || []).map((a: any) => ({
      ...a,
      osInfo: buildOsInfo(a.capabilities),
    }));
    pathStrategies.value = strategies || {};
  } catch (e: any) {
    ElMessage.error("刷新失败: " + e.message);
  } finally {
    refreshing.value = false;
  }
}

function buildOsInfo(capabilities: Record<string, string> | undefined): string {
  if (!capabilities) return '';
  const name = capabilities['os.name'] || '';
  const arch = capabilities['os.arch'] || '';
  const version = capabilities['os.version'] || '';
  if (!name && !arch) return '';
  return [name, version, arch].filter(Boolean).join(' ');
}

function formatRtt(rttMs: number | undefined, lastHeartbeatAt: string | undefined): string {
  if (rttMs !== undefined && rttMs >= 0) return rttMs + 'ms';
  return formatLatency(lastHeartbeatAt);
}

function rttClass(rttMs: number | undefined, lastHeartbeatAt: string | undefined): string {
  if (rttMs !== undefined && rttMs >= 0) {
    if (rttMs < 100) return 'rtt-green';
    if (rttMs < 500) return 'rtt-yellow';
    return 'rtt-red';
  }
  return latencyClass(lastHeartbeatAt);
}

function formatLatency(lastHeartbeatAt: string | undefined): string {
  if (!lastHeartbeatAt) return '无心跳';
  void tick.value;
  const diff = Date.now() - new Date(lastHeartbeatAt).getTime();
  if (diff < 1000) return '< 1s';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  return `${Math.floor(diff / 3600000)}h`;
}

function latencyClass(lastHeartbeatAt: string | undefined): string {
  if (!lastHeartbeatAt) return 'rtt-red';
  const diff = Date.now() - new Date(lastHeartbeatAt).getTime();
  if (diff < 5000) return 'rtt-green';
  if (diff < 300000) return 'rtt-yellow';
  return 'rtt-red';
}

async function mgmtFetch(path: string, opts?: RequestInit) {
  const token = getToken();
  const qs = token ? `?token=${token}` : "";
  const base = `http://${remoteApiHost.value}:${remoteApiPort.value}/admin/api`;
  const resp = await fetch(`${base}${path}${qs}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

async function updateAgentWeight(a: any) {
  try {
    await mgmtFetch(`/agents/${a.agentId}/weight`, {
      method: 'PUT',
      body: JSON.stringify({ weight: a.weight }),
    });
    ElMessage.success('权重已更新');
  } catch (e: any) {
    ElMessage.error('更新失败: ' + e.message);
  }
}

async function updatePathStrategy(group: PathGroup) {
  try {
    await mgmtFetch(`/path-strategies`, {
      method: 'PUT',
      body: JSON.stringify({ path: group.path, strategy: group.strategy }),
    });
    ElMessage.success('策略已更新: ' + group.strategy);
  } catch (e: any) {
    ElMessage.error('更新失败: ' + e.message);
  }
}

async function toggleDisable(a: any, disable: boolean) {
  const action = disable ? '禁用' : '启用';
  try {
    await mgmtFetch(`/agents/${a.agentId}/${disable ? 'disable' : 'enable'}`, { method: 'PUT' });
    ElMessage.success(`已${action}`);
    refresh();
  } catch (e: any) {
    ElMessage.error(`${action}失败: ` + e.message);
  }
}

let durationTimer: ReturnType<typeof setInterval> | null = null;

function openFirewallPage() {
  const token = getToken();
  const baseUrl = window.location.origin + window.location.pathname;
  window.open(`${baseUrl}?view=firewall${token ? `&token=${token}` : ''}`, 'firewall', 'width=1200,height=800');
}

onMounted(() => {
  refresh();
  durationTimer = setInterval(() => { tick.value++; }, 30000);
});

onUnmounted(() => {
  if (durationTimer) { clearInterval(durationTimer); durationTimer = null; }
});
</script>

<style scoped>
.api-gw {
  height: 100%;
  overflow-y: auto;
  background: var(--el-bg-color-page);
}

.gw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 5;
}

html.dark .gw-header {
  background: rgba(30,30,35,0.85);
  border-bottom-color: rgba(255,255,255,0.08);
}

.gw-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.gw-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.gw-header-right {
  display: flex;
  gap: 8px;
}

/* 统计卡片 */
.gw-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  padding: 20px 24px;
}
.gw-metric-card {
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 16px;
  padding: 20px 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
}
.gw-metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

html.dark .gw-metric-card {
  background: rgba(30,41,59,0.75);
  border-color: rgba(255,255,255,0.08);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}

html.dark .gw-metric-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.gw-metric-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}
.gw-metric-value {
  font-size: 28px;
  font-weight: 700;
  font-family: 'SF Mono', monospace;
  line-height: 1;
}

/* 路径分组 */
.gw-section-card {
  margin: 0 24px 16px;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transition: all 0.3s;
}

html.dark .gw-section-card {
  background: rgba(30,41,59,0.8);
  border-color: rgba(255,255,255,0.08);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
.gw-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.gw-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.gw-path-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.gw-path-group {
  background: rgba(255,255,255,0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 10px;
  padding: 16px;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.gw-path-group:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

html.dark .gw-path-group {
  background: rgba(30,41,59,0.6);
  border-color: rgba(255,255,255,0.06);
}
.gw-path-header {
  margin-bottom: 12px;
}
.gw-path-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.gw-path-badge {
  font-size: 12px;
  font-weight: 700;
  font-family: 'SF Mono', monospace;
}
.gw-path-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.gw-path-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 实例列表 */
.gw-instance-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.gw-instance-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(255,255,255,0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 10px;
  transition: all 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}
.gw-instance-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

html.dark .gw-instance-card {
  background: rgba(30,41,59,0.5);
  border-color: rgba(255,255,255,0.06);
}
.gw-app-disabled {
  opacity: 0.45;
}
.gw-instance-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.gw-instance-id {
  font-family: 'SF Mono', monospace;
  font-size: 12px;
  color: var(--el-text-color-regular);
}
.gw-instance-ip {
  font-family: 'SF Mono', monospace;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.gw-instance-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.gw-instance-os {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gw-app-latency {
  font-weight: 700;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
}
.rtt-green { color: var(--el-color-success); background: var(--el-color-success-light-9); }
.rtt-yellow { color: var(--el-color-warning); background: var(--el-color-warning-light-9); }
.rtt-red { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }
.gw-instance-weight {
  display: flex;
  align-items: center;
  gap: 6px;
}
.gw-ops-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.gw-empty {
  text-align: center;
  color: var(--el-text-color-placeholder);
  padding: 32px 0;
  font-size: 13px;
}

/* 细滚动条 */
.thin-scroller::-webkit-scrollbar { width: 5px; height: 5px; }
.thin-scroller::-webkit-scrollbar-track { background: transparent; }
.thin-scroller::-webkit-scrollbar-thumb { background: var(--el-border-color-darker); border-radius: 3px; }
.thin-scroller::-webkit-scrollbar-thumb:hover { background: var(--el-text-color-secondary); }

@media (max-width: 768px) {
  .gw-metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .gw-instance-card { flex-direction: column; align-items: flex-start; gap: 8px; }
  .gw-instance-right { flex-wrap: wrap; }
}
</style>
