<template>
  <div class="fw-page thin-scroller">
    <!-- 头部 -->
    <div class="fw-header">
      <div class="fw-header-left">
        <h3 class="fw-title">防火墙管理</h3>
        <el-tag :type="fwMode === 'WHITELIST' ? 'success' : fwMode === 'BLACKLIST' ? 'danger' : 'info'" size="small" effect="dark">
          模式: {{ fwMode }}
        </el-tag>
        <el-tag :type="fwRateLimit ? 'success' : 'info'" size="small" effect="plain">
          限流: {{ fwRateLimit ? '已启用' : '已禁用' }}
        </el-tag>
      </div>
      <div class="fw-header-right">
        <el-button size="small" @click="showSettings = true">
          <el-icon><Setting /></el-icon> 设置
        </el-button>
        <el-button size="small" type="primary" :loading="refreshing" @click="refreshAll">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </div>

    <!-- QPS 指标卡片 -->
    <div class="fw-metrics-grid">
      <div class="fw-metric-card">
        <div class="fw-metric-label">当前 QPS</div>
        <div class="fw-metric-value" style="color: var(--el-color-primary)">{{ realtimeMetrics?.currentQps ?? 0 }}</div>
      </div>
      <div class="fw-metric-card">
        <div class="fw-metric-label">平均 QPS</div>
        <div class="fw-metric-value" style="color: var(--el-color-success)">{{ realtimeMetrics?.avgQps ?? 0 }}</div>
      </div>
      <div class="fw-metric-card">
        <div class="fw-metric-label">峰值 QPS</div>
        <div class="fw-metric-value" style="color: var(--el-color-warning)">{{ realtimeMetrics?.peakQps ?? 0 }}</div>
      </div>
      <div class="fw-metric-card">
        <div class="fw-metric-label">平均响应时间</div>
        <div class="fw-metric-value" style="color: var(--el-color-info)">{{ realtimeMetrics?.avgResponseTimeMs ?? 0 }}<span class="fw-metric-unit">ms</span></div>
      </div>
    </div>

    <!-- 图表 + 流量分布 -->
    <div class="fw-main-grid">
      <el-card shadow="never" class="fw-chart-card">
        <template #header>
          <span class="fw-card-title">QPS 趋势（最近 60 秒）</span>
        </template>
        <div class="fw-chart-wrapper">
          <div class="fw-chart">
            <div v-for="(h, i) in qpsBarHeights" :key="i" class="fw-bar-wrap">
              <div class="fw-bar" :style="{ height: h + '%', background: h > 70 ? 'var(--el-color-danger)' : h > 40 ? 'var(--el-color-warning)' : 'var(--el-color-primary)' }" />
            </div>
            <div v-if="!qpsBarHeights.length" class="fw-chart-empty">暂无数据</div>
          </div>
          <div class="fw-chart-xaxis">
            <span>-60s</span><span>-45s</span><span>-30s</span><span>-15s</span><span>now</span>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="fw-flow-card">
        <template #header>
          <span class="fw-card-title">实时流量分布</span>
        </template>
        <div class="fw-detail-grid">
          <div class="fw-detail-col">
            <div class="fw-detail-label">状态码分布</div>
            <div v-if="realtimeMetrics?.statusCodeDistribution && Object.keys(realtimeMetrics.statusCodeDistribution).length" class="fw-status-tags">
              <el-tag v-for="(cnt, code) in realtimeMetrics.statusCodeDistribution" :key="code" size="small"
                      :type="String(code).startsWith('2') ? 'success' : String(code).startsWith('3') ? 'info' : String(code).startsWith('4') ? 'warning' : 'danger'"
                      effect="dark" class="fw-status-tag">
                {{ code }}: {{ cnt }}
              </el-tag>
            </div>
            <div v-else class="fw-empty-sm">暂无数据</div>
          </div>
          <div class="fw-detail-col">
            <div class="fw-detail-label">热门 IP（60s）</div>
            <div v-if="realtimeMetrics?.topIpsRecent?.length" class="fw-mini-rank">
              <div v-for="(item, idx) in realtimeMetrics.topIpsRecent.slice(0, 5)" :key="item.ip" class="fw-mini-rank-item">
                <span class="fw-rank-badge">{{ idx + 1 }}</span>
                <code>{{ item.ip }}</code>
                <span class="fw-rank-count">{{ item.count }}</span>
              </div>
            </div>
            <div v-else class="fw-empty-sm">暂无数据</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 访问统计 -->
    <el-card shadow="never" class="fw-section-card">
      <template #header>
        <span class="fw-card-title">访问统计</span>
      </template>
      <div v-if="accessStats" class="fw-stats-grid">
        <div class="fw-stats-col">
          <div class="fw-stats-subtitle">热门 IP</div>
          <div v-if="accessStats.topIps?.length" class="fw-rank-list">
            <div v-for="(item, idx) in accessStats.topIps" :key="item.ip" class="fw-rank-item">
              <span class="fw-rank-badge">{{ idx + 1 }}</span>
              <code class="fw-rank-key">{{ item.ip }}</code>
              <span class="fw-rank-count">{{ item.count }} 次</span>
            </div>
          </div>
          <div v-else class="fw-empty">暂无数据</div>
        </div>
        <div class="fw-stats-col">
          <div class="fw-stats-subtitle">热门路径</div>
          <div v-if="accessStats.topPaths?.length" class="fw-rank-list">
            <div v-for="(item, idx) in accessStats.topPaths" :key="item.path" class="fw-rank-item">
              <span class="fw-rank-badge">{{ idx + 1 }}</span>
              <code class="fw-rank-key">{{ item.path }}</code>
              <span class="fw-rank-count">{{ item.count }} 次</span>
            </div>
          </div>
          <div v-else class="fw-empty">暂无数据</div>
        </div>
      </div>
    </el-card>

    <!-- 访问日志 -->
    <el-card shadow="never" class="fw-section-card">
      <template #header>
        <div class="fw-card-header">
          <span class="fw-card-title">访问日志</span>
          <div class="fw-card-actions">
            <el-input v-model="logFilterIp" placeholder="按 IP 过滤" size="small" style="width:160px" clearable @clear="fetchAccessLogs" @change="fetchAccessLogs" />
            <el-button size="small" @click="fetchAccessLogs">刷新</el-button>
          </div>
        </div>
      </template>
      <div v-if="accessLogs.length === 0" class="fw-empty">暂无访问记录</div>
      <div v-else class="fw-log-list">
        <div v-for="(log, idx) in accessLogs" :key="idx" class="fw-log-item">
          <code class="fw-log-ip">{{ log.ip }}</code>
          <el-tag size="small" :type="log.statusCode < 400 ? 'success' : 'danger'" effect="plain">{{ log.statusCode }}</el-tag>
          <span class="fw-log-method">{{ log.method }}</span>
          <span class="fw-log-path">{{ log.path }}</span>
          <span class="fw-log-time">{{ log.responseTimeMs }}ms</span>
          <span class="fw-log-ts">{{ formatTime(log.timestamp) }}</span>
        </div>
      </div>
    </el-card>

    <!-- 设置弹框 -->
    <el-dialog v-model="showSettings" title="防火墙设置" width="600px" top="5vh" destroy-on-close>
      <div class="fw-settings">
        <div class="fw-settings-group">
          <div class="fw-settings-group-title">过滤模式</div>
          <el-radio-group v-model="fwMode" @change="setFwMode">
            <el-radio-button value="DISABLED">禁用</el-radio-button>
            <el-radio-button value="WHITELIST">白名单</el-radio-button>
            <el-radio-button value="BLACKLIST">黑名单</el-radio-button>
          </el-radio-group>
        </div>

        <div class="fw-settings-group">
          <div class="fw-settings-group-title">限流控制</div>
          <div class="fw-settings-row">
            <span>启用限流</span>
            <el-switch v-model="fwRateLimit" @change="setFwRateLimit" />
          </div>
        </div>

        <div class="fw-settings-group">
          <div class="fw-settings-group-title">IP 封禁管理</div>
          <div class="fw-ip-add">
            <el-input v-model="blockIpInput" placeholder="输入 IP 地址" size="small" style="width:200px" />
            <el-input v-model="blockReason" placeholder="封禁原因" size="small" style="width:180px" />
            <el-button size="small" type="danger" @click="addBlockIp">封禁</el-button>
          </div>
          <div v-if="blockedIps.length === 0" class="fw-empty" style="padding:8px 0">暂无封禁 IP</div>
          <div v-else class="fw-settings-ip-list">
            <div v-for="b in blockedIps" :key="b.ip" class="fw-settings-ip-item">
              <code>{{ b.ip }}</code>
              <span v-if="b.reason" class="fw-ip-reason">{{ b.reason }}</span>
              <span class="fw-ip-time">{{ b.blockedAt ? formatTime(b.blockedAt) : '' }}</span>
              <el-button size="small" text type="primary" @click="unblockIp(b.ip)">解封</el-button>
            </div>
          </div>
        </div>

        <div class="fw-settings-group">
          <div class="fw-settings-group-title">日志管理</div>
          <div class="fw-settings-row">
            <span>当前总请求: {{ fwStatus?.accessLog?.totalRequests ?? 0 }}</span>
            <el-button size="small" type="danger" plain @click="clearAccessLogs">清除日志</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, inject } from "vue";
import { Refresh, Setting } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

import type { Ref } from "vue";

const injectedToken = inject<Ref<string>>("clientToken");
const injectedAccessCode = inject<Ref<string>>("accessCode");

const gatewayHost = ref(localStorage.getItem("socks5-gateway-host") || localStorage.getItem("gateway-manage-host") || window.location.hostname || "127.0.0.1");
const gatewayPort = ref(Number(localStorage.getItem("gateway-api-port") || 8083));
const managementPort = ref(13000);
const refreshing = ref(false);
const showSettings = ref(false);
const realtimeMetrics = ref<any>(null);
let metricsTimer: ReturnType<typeof setInterval> | null = null;

const savedMgmtPort = localStorage.getItem("gateway-manage-mgmt-port");
if (savedMgmtPort) managementPort.value = Number(savedMgmtPort);

const fwStatus = ref<any>(null);
const fwMode = ref("DISABLED");
const fwRateLimit = ref(false);
const blockedIps = ref<any[]>([]);
const accessStats = ref<any>(null);
const accessLogs = ref<any[]>([]);
const blockIpInput = ref("");
const blockReason = ref("");
const logFilterIp = ref("");

function getToken(): string {
  return injectedToken?.value || injectedAccessCode?.value || localStorage.getItem("remote-client-token") || "";
}

async function refreshAll() {
  refreshing.value = true;
  await Promise.all([fetchFirewall(), fetchAccessLogs(), fetchRealtimeMetrics()]);
  refreshing.value = false;
}

function apiBase(): string {
  return `http://${gatewayHost.value}:${gatewayPort.value}/admin/api`;
}

async function fetchRealtimeMetrics() {
  const base = apiBase();
  const token = getToken();
  const qs = token ? `?token=${token}` : "";
  try {
    const resp = await fetch(`${base}/firewall/metrics${qs}`);
    if (resp.ok) realtimeMetrics.value = await resp.json();
  } catch {}
}

const qpsBarHeights = computed(() => {
  const series: number[] = realtimeMetrics.value?.qpsTimeSeries || [];
  if (!series.length) return [];
  const max = Math.max(...series, 1);
  return series.map(v => Math.round((v / max) * 100));
});

async function fetchFirewall() {
  const base = apiBase();
  const token = getToken();
  const qs = token ? `?token=${token}` : "";
  try {
    const [statusResp, blockedResp, statsResp] = await Promise.all([
      fetch(`${base}/firewall/status${qs}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${base}/firewall/blocked${qs}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${base}/firewall/stats${qs}`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    if (statusResp) {
      fwStatus.value = statusResp;
      fwMode.value = statusResp.ipFilter?.mode || 'DISABLED';
      fwRateLimit.value = statusResp.rateLimitEnabled || false;
    }
    blockedIps.value = blockedResp || [];
    accessStats.value = statsResp;
  } catch {}
}

async function fetchAccessLogs() {
  const base = apiBase();
  const token = getToken();
  let qs = token ? `?token=${token}&count=100` : `?count=100`;
  if (logFilterIp.value) qs += `&ip=${encodeURIComponent(logFilterIp.value)}`;
  try {
    const resp = await fetch(`${base}/firewall/logs${qs}`);
    if (resp.ok) accessLogs.value = await resp.json();
  } catch {}
}

async function setFwMode(mode: string) {
  const base = apiBase();
  const token = getToken();
  const qs = token ? `?token=${token}` : "";
  try {
    await fetch(`${base}/firewall/mode${qs}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    ElMessage.success('模式已切换: ' + mode);
    fetchFirewall();
  } catch (e: any) {
    ElMessage.error('切换失败: ' + e.message);
  }
}

async function setFwRateLimit(enabled: boolean) {
  const base = apiBase();
  const token = getToken();
  const qs = token ? `?token=${token}` : "";
  try {
    await fetch(`${base}/firewall/rate-limit${qs}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    ElMessage.success(enabled ? '限流已启用' : '限流已禁用');
  } catch {}
}

async function addBlockIp() {
  if (!blockIpInput.value.trim()) { ElMessage.warning('请输入 IP'); return; }
  const base = apiBase();
  const token = getToken();
  const qs = token ? `?token=${token}` : "";
  try {
    await fetch(`${base}/firewall/block${qs}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: blockIpInput.value.trim(), reason: blockReason.value || '手动封禁' }),
    });
    ElMessage.success('已封禁: ' + blockIpInput.value);
    blockIpInput.value = "";
    blockReason.value = "";
    fetchFirewall();
  } catch (e: any) {
    ElMessage.error('封禁失败: ' + e.message);
  }
}

async function unblockIp(ip: string) {
  const base = apiBase();
  const token = getToken();
  const qs = token ? `?token=${token}` : "";
  try {
    await fetch(`${base}/firewall/block${qs}&ip=${encodeURIComponent(ip)}`, { method: 'DELETE' });
    ElMessage.success('已解封: ' + ip);
    fetchFirewall();
  } catch {}
}

async function clearAccessLogs() {
  const base = apiBase();
  const token = getToken();
  const qs = token ? `?token=${token}` : "";
  try {
    await fetch(`${base}/firewall/logs/clear${qs}`, { method: 'PUT' });
    ElMessage.success('日志已清除');
    accessLogs.value = [];
    fetchFirewall();
  } catch {}
}

function formatTime(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString();
}

onMounted(() => {
  refreshAll();
  metricsTimer = setInterval(() => { fetchRealtimeMetrics(); }, 5000);
});

onUnmounted(() => {
  if (metricsTimer) { clearInterval(metricsTimer); metricsTimer = null; }
});
</script>

<style scoped>
.fw-page {
  height: 100%;
  overflow-y: auto;
  background: var(--el-bg-color-page);
}

.fw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  position: sticky;
  top: 0;
  z-index: 5;
}

html.dark .fw-header {
  background: rgba(30,41,59,0.85);
  border-bottom-color: rgba(255,255,255,0.08);
}
.fw-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.fw-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.fw-header-right {
  display: flex;
  gap: 8px;
}

/* 指标卡片 */
.fw-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  padding: 20px 24px;
}
.fw-metric-card {
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
}
.fw-metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

html.dark .fw-metric-card {
  background: rgba(30,41,59,0.75);
  border-color: rgba(255,255,255,0.08);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}

html.dark .fw-metric-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.fw-metric-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.fw-metric-value {
  font-size: 36px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.fw-metric-unit {
  font-size: 16px;
  font-weight: 600;
  margin-left: 4px;
  opacity: 0.7;
}

/* 主体网格 */
.fw-main-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 16px;
  padding: 0 24px;
  margin-bottom: 16px;
}
.fw-chart-card, .fw-flow-card {
  --el-card-padding: 16px;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transition: all 0.3s;
}
.fw-chart-card:hover, .fw-flow-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

html.dark .fw-chart-card, html.dark .fw-flow-card {
  background: rgba(30,41,59,0.75);
  border-color: rgba(255,255,255,0.08);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
.fw-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.fw-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 图表 */
.fw-chart-wrapper {
  padding: 4px 0;
}
.fw-chart {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 180px;
  position: relative;
}
.fw-bar-wrap {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
  min-width: 0;
}
.fw-bar {
  width: 100%;
  border-radius: 3px 3px 0 0;
  transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 1px;
  opacity: 0.85;
}
.fw-bar:hover { opacity: 1; }
.fw-chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}
.fw-chart-xaxis {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

/* 流量分布 */
.fw-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  height: 100%;
}
.fw-detail-col {
  display: flex;
  flex-direction: column;
}
.fw-detail-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.fw-status-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.fw-status-tag {
  font-weight: 700;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.fw-mini-rank {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fw-mini-rank-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255,255,255,0.45);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  font-size: 12px;
  border: 1px solid rgba(255,255,255,0.2);
  transition: all 0.25s ease;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}
.fw-mini-rank-item:hover {
  border-color: var(--el-color-primary-light-5);
}

html.dark .fw-mini-rank-item {
  background: rgba(30,41,59,0.45);
  border-color: rgba(255,255,255,0.06);
}
.fw-mini-rank-item code {
  font-family: 'SF Mono', monospace;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 访问统计 */
.fw-section-card {
  margin: 0 24px 16px;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transition: all 0.3s;
}

html.dark .fw-section-card {
  background: rgba(30,41,59,0.75);
  border-color: rgba(255,255,255,0.08);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
.fw-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.fw-stats-col { min-width: 0; }
.fw-stats-subtitle {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.fw-rank-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fw-rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.45);
  backdrop-filter: blur(8px);
  border-radius: 10px;
  font-size: 12px;
  border: 1px solid rgba(255,255,255,0.2);
  transition: all 0.25s ease;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}
.fw-rank-item:hover {
  border-color: var(--el-color-primary-light-5);
}

html.dark .fw-rank-item {
  background: rgba(30,41,59,0.45);
  border-color: rgba(255,255,255,0.06);
}
.fw-rank-badge {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}
.fw-rank-key {
  font-family: 'SF Mono', monospace;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fw-rank-count {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* 日志列表 */
.fw-log-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 320px;
  overflow-y: auto;
}
.fw-log-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.45);
  backdrop-filter: blur(8px);
  border-radius: 10px;
  font-size: 12px;
  border: 1px solid rgba(255,255,255,0.2);
  transition: all 0.25s ease;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}
.fw-log-item:hover {
  border-color: var(--el-color-primary-light-5);
}

html.dark .fw-log-item {
  background: rgba(30,41,59,0.45);
  border-color: rgba(255,255,255,0.06);
}
.fw-log-ip {
  font-family: 'SF Mono', monospace;
  font-weight: 700;
  color: var(--el-text-color-primary);
  min-width: 110px;
}
.fw-log-method {
  font-weight: 700;
  font-size: 11px;
  color: var(--el-color-primary);
  min-width: 40px;
  text-transform: uppercase;
}
.fw-log-path {
  font-family: 'SF Mono', monospace;
  font-size: 11px;
  color: var(--el-text-color-regular);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fw-log-time {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  min-width: 50px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.fw-log-ts {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  min-width: 80px;
}
.fw-empty {
  text-align: center;
  color: var(--el-text-color-placeholder);
  padding: 24px;
  font-size: 13px;
}
.fw-empty-sm {
  text-align: center;
  color: var(--el-text-color-placeholder);
  padding: 12px;
  font-size: 12px;
}

.fw-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 设置弹框 */
.fw-settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.fw-settings-group {
  background: rgba(255,255,255,0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

html.dark .fw-settings-group {
  background: rgba(30,41,59,0.5);
  border-color: rgba(255,255,255,0.06);
}
.fw-settings-group-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}
.fw-settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.fw-ip-add {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.fw-settings-ip-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fw-settings-ip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.45);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  font-size: 12px;
  border: 1px solid rgba(255,255,255,0.2);
}

html.dark .fw-settings-ip-item {
  background: rgba(30,41,59,0.45);
  border-color: rgba(255,255,255,0.06);
}
.fw-settings-ip-item code {
  font-family: 'SF Mono', monospace;
  font-weight: 700;
  color: var(--el-color-danger);
  min-width: 120px;
}
.fw-ip-reason {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  flex: 1;
}
.fw-ip-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.thin-scroller::-webkit-scrollbar { width: 5px; height: 5px; }
.thin-scroller::-webkit-scrollbar-track { background: transparent; }
.thin-scroller::-webkit-scrollbar-thumb { background: var(--el-border-color-darker); border-radius: 3px; }
.thin-scroller::-webkit-scrollbar-thumb:hover { background: var(--el-text-color-secondary); }

@media (max-width: 768px) {
  .fw-main-grid { grid-template-columns: 1fr; }
  .fw-stats-grid { grid-template-columns: 1fr; }
  .fw-detail-grid { grid-template-columns: 1fr; }
  .fw-metrics-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
