<template>
  <div class="config-page thin-scroller">
    <div class="cp-header">
      <div class="cp-header-left">
        <h3 class="cp-title">网关配置</h3>
        <el-tag :type="wsConnected ? 'success' : 'danger'" size="small" effect="dark">
          {{ wsConnected ? 'WS 已连接' : 'WS 断开' }}
        </el-tag>
        <el-tag v-if="hasRestartRequired" type="warning" size="small" effect="dark">
          部分配置需重启生效
        </el-tag>
      </div>
      <div class="cp-header-right">
        <el-button size="small" type="primary" :loading="saving" @click="saveConfig">保存</el-button>
      </div>
    </div>

    <div class="cp-body">
      <el-form :model="config" label-width="150px" label-position="left" size="default">
        <!-- 控制端 -->
        <el-card shadow="never" class="cp-card">
          <template #header><span class="cp-card-title">控制端</span></template>
          <el-row :gutter="24" class="cp-row">
            <el-col :span="8">
              <el-form-item label="TCP 控制端口">
                <el-tooltip content="修改后需重启网关生效" placement="top">
                  <el-input-number v-model="config.tcpControlPort" :min="1024" :max="65535" style="width:100%" />
                </el-tooltip>
                <el-tag size="small" type="warning" effect="plain" style="margin-left:6px">需重启</el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="管理 Token">
                <el-input v-model="config.managementToken" type="password" show-password />
                <el-button size="small" type="primary" link @click="copyToken" style="margin-left:6px">复制</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 被控端 -->
        <el-card shadow="never" class="cp-card">
          <template #header><span class="cp-card-title">被控端</span></template>
          <el-row :gutter="24" class="cp-row">
            <el-col :span="8">
              <el-form-item label="TCP 被控端口">
                <el-tooltip content="修改后需重启网关生效" placement="top">
                  <el-input-number v-model="config.tcpAgentPort" :min="1024" :max="65535" style="width:100%" />
                </el-tooltip>
                <el-tag size="small" type="warning" effect="plain" style="margin-left:6px">需重启</el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="注册密钥">
                <el-tooltip content="修改后需重启网关生效" placement="top">
                  <el-input v-model="config.agentRegisterKey" type="password" show-password />
                </el-tooltip>
                <el-tag size="small" type="warning" effect="plain" style="margin-left:6px">需重启</el-tag>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24" class="cp-row">
            <el-col :span="8">
              <el-form-item label="心跳间隔(ms)">
                <el-input-number v-model="config.agentHeartbeatInterval" :min="1000" :max="300000" :step="1000" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="最大心跳缺失">
                <el-input-number v-model="config.maxHeartbeatMisses" :min="1" :max="60" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="会话空闲超时(s)">
                <el-input-number v-model="config.sessionIdleTimeout" :min="10" :max="86400" :step="10" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 网关端 -->
        <el-card shadow="never" class="cp-card">
          <template #header><span class="cp-card-title">网关端</span></template>
          <el-row :gutter="24" class="cp-row">
            <el-col :span="8">
              <el-form-item label="管理端口">
                <el-tooltip content="修改后需重启网关生效" placement="top">
                  <el-input-number v-model="config.httpManagementPort" :min="1024" :max="65535" style="width:100%" />
                </el-tooltip>
                <el-tag size="small" type="warning" effect="plain" style="margin-left:6px">需重启</el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Boss 线程数">
                <el-tooltip content="修改后需重启网关生效" placement="top">
                  <el-input-number v-model="config.bossThreads" :min="1" :max="32" style="width:100%" />
                </el-tooltip>
                <el-tag size="small" type="warning" effect="plain" style="margin-left:6px">需重启</el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Worker 线程数">
                <el-tooltip content="修改后需重启网关生效" placement="top">
                  <el-input-number v-model="config.workerThreads" :min="1" :max="256" style="width:100%" />
                </el-tooltip>
                <el-tag size="small" type="warning" effect="plain" style="margin-left:6px">需重启</el-tag>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24" class="cp-row">
            <el-col :span="8">
              <el-form-item label="最大会话数">
                <el-input-number v-model="config.maxSessions" :min="1" :max="100000" :step="100" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Sniff Bytes">
                <el-tooltip content="修改后需重启网关生效" placement="top">
                  <el-input-number v-model="config.sniffBytes" :min="64" :max="65535" style="width:100%" />
                </el-tooltip>
                <el-tag size="small" type="warning" effect="plain" style="margin-left:6px">需重启</el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Admin Path">
                <el-tooltip content="修改后需重启网关生效" placement="top">
                  <el-input v-model="config.adminPath" />
                </el-tooltip>
                <el-tag size="small" type="warning" effect="plain" style="margin-left:6px">需重启</el-tag>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24" class="cp-row">
            <el-col :span="12">
              <el-form-item label="限流-每秒令牌数">
                <el-input-number v-model="config.rateLimitTokensPerSecond" :min="1" :max="100000" :step="100" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="限流-突发容量">
                <el-input-number v-model="config.rateLimitBurstCapacity" :min="1" :max="100000" :step="100" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- API 网关 -->
        <el-card shadow="never" class="cp-card">
          <template #header><span class="cp-card-title">API 网关</span></template>
          <el-row :gutter="24" class="cp-row">
            <el-col :span="8">
              <el-form-item label="REST API 端口">
                <el-tooltip content="修改后需重启网关生效" placement="top">
                  <el-input-number v-model="config.httpApiPort" :min="1024" :max="65535" style="width:100%" />
                </el-tooltip>
                <el-tag size="small" type="warning" effect="plain" style="margin-left:6px">需重启</el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="WS 业务端口">
                <el-tooltip content="修改后需重启网关生效" placement="top">
                  <el-input-number v-model="config.wsApiGatewayPort" :min="1024" :max="65535" style="width:100%" />
                </el-tooltip>
                <el-tag size="small" type="warning" effect="plain" style="margin-left:6px">需重启</el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="API Path">
                <el-tooltip content="修改后需重启网关生效" placement="top">
                  <el-input v-model="config.apiPath" />
                </el-tooltip>
                <el-tag size="small" type="warning" effect="plain" style="margin-left:6px">需重启</el-tag>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 连接 & 安全 -->
        <el-card shadow="never" class="cp-card">
          <template #header><span class="cp-card-title">连接 & 安全</span></template>
          <el-row :gutter="24" class="cp-row">
            <el-col :span="8">
              <el-form-item label="WS 控制端口">
                <el-tooltip content="修改后需重启网关生效" placement="top">
                  <el-input-number v-model="config.dwsRemoteControlPort" :min="1024" :max="65535" style="width:100%" />
                </el-tooltip>
                <el-tag size="small" type="warning" effect="plain" style="margin-left:6px">需重启</el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="API 令牌验证">
                <el-switch v-model="config.apiTokenEnabled" />
                <div style="font-size:12px;color:var(--el-text-color-placeholder);margin-top:4px;">
                  关闭后 API 端口和 WebSocket 不需要令牌即可访问
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="管理 Token">
                <span class="cp-token-masked">{{ maskedToken }}</span>
                <el-button size="small" type="primary" link @click="copyToken" style="margin-left:6px">复制</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 远端 API 地址 -->
        <el-card shadow="never" class="cp-card">
          <template #header>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="cp-card-title">远端 API 地址</span>
              <el-tag size="small" type="warning" effect="plain">需重启</el-tag>
              <el-tooltip content="配置接入网关的服务端地址和端口，防止接入服务改了 IP 和端口后连接不上" placement="right">
                <el-icon style="color:var(--el-text-color-placeholder);cursor:pointer;"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <el-row :gutter="24" class="cp-row">
            <el-col :span="8">
              <el-form-item label="远端 API 地址">
                <el-tooltip content="修改后需重启网关生效" placement="top">
                  <el-input v-model="config.remoteApiHost" placeholder="127.0.0.1" />
                </el-tooltip>
                <el-tag size="small" type="warning" effect="plain" style="margin-left:6px">需重启</el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="远端 API 端口">
                <el-tooltip content="修改后需重启网关生效" placement="top">
                  <el-input-number v-model="config.remoteApiPort" :min="1" :max="65535" style="width:100%" />
                </el-tooltip>
                <el-tag size="small" type="warning" effect="plain" style="margin-left:6px">需重启</el-tag>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 防火墙设置 -->
        <el-card shadow="never" class="cp-card">
          <template #header>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="cp-card-title">防火墙设置</span>
              <el-tag size="small" type="info" effect="plain">即时生效</el-tag>
            </div>
          </template>
          <el-row :gutter="24" class="cp-row">
            <el-col :span="8">
              <el-form-item label="IP 过滤模式">
                <el-select v-model="fwMode" style="width:100%" @change="setFwMode">
                  <el-option label="禁用" value="DISABLED" />
                  <el-option label="黑名单（仅封禁指定 IP）" value="BLACKLIST" />
                  <el-option label="白名单（仅允许指定 IP）" value="WHITELIST" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="限流">
                <el-switch v-model="fwRateLimit" @change="setFwRateLimit" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="访问统计">
                <span style="font-size:13px;color:var(--el-text-color-secondary)">
                  累计 <strong>{{ fwStatus?.accessLog?.totalRequests ?? 0 }}</strong> 次请求
                </span>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- SPI 提供商 -->
        <el-card shadow="never" class="cp-card">
          <template #header>
            <div class="cp-card-header">
              <span class="cp-card-title">SPI 提供商</span>
              <el-tag size="small" type="info" effect="plain">需重启生效</el-tag>
            </div>
          </template>
          <div v-if="spiProviders.length === 0" class="cp-empty">加载中...</div>
          <div v-else class="cp-spi-list">
            <div v-for="spi in spiProviders" :key="spi.name" class="cp-spi-item">
              <span class="cp-spi-name">{{ spi.name }}</span>
              <el-select v-model="spi.current" size="small" style="width:200px">
                <el-option v-for="impl in spi.implementations" :key="impl" :label="impl" :value="impl" />
              </el-select>
            </div>
          </div>
        </el-card>
      </el-form>
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, inject, watch } from "vue";
import { ElMessage } from "element-plus";
import { InfoFilled } from "@element-plus/icons-vue";

import type { Ref } from "vue";

const injectedToken = inject<Ref<string>>("clientToken");
const injectedAccessCode = inject<Ref<string>>("accessCode");
const injectedGatewayWsConnected = inject<Ref<boolean>>("gatewayWsConnected");
const injectedSendWsMessage = inject<(data: string) => void>("sendWsMessage");
const injectedOnWsMessage = inject<(handler: (data: any) => void) => () => void>("onWsMessage");

interface GatewayConfig {
  tcpControlPort: number; tcpAgentPort: number;
  httpManagementPort: number; httpApiPort: number;
  wsApiGatewayPort: number; dwsRemoteControlPort: number;
  bossThreads: number; workerThreads: number; agentHeartbeatInterval: number;
  maxHeartbeatMisses: number; agentRegisterKey: string; sessionIdleTimeout: number;
  maxSessions: number; rateLimitTokensPerSecond: number; rateLimitBurstCapacity: number;
  sniffBytes: number; adminPath: string; apiPath: string;
  managementToken: string; apiTokenEnabled: boolean; restartRequiredFields: string[];
  remoteApiHost: string; remoteApiPort: number;
}

const config = reactive<GatewayConfig>({
  tcpControlPort: 9000, tcpAgentPort: 9001,
  httpManagementPort: 3000, httpApiPort: 8083,
  wsApiGatewayPort: 8081, dwsRemoteControlPort: 8082, bossThreads: 2,
  workerThreads: 0, agentHeartbeatInterval: 15000, maxHeartbeatMisses: 3,
  agentRegisterKey: "", sessionIdleTimeout: 300, maxSessions: 1000,
  rateLimitTokensPerSecond: 1000, rateLimitBurstCapacity: 2000, sniffBytes: 4096,
  adminPath: "/admin", apiPath: "/", managementToken: "", apiTokenEnabled: true,
  restartRequiredFields: [],
  remoteApiHost: "127.0.0.1", remoteApiPort: 3000,
});

const saving = ref(false);
const wsConnected = computed(() => injectedGatewayWsConnected?.value ?? false);

let unregisterHandler: (() => void) | null = null;

const RESTART_FIELDS = new Set([
  "tcpControlPort", "tcpAgentPort",
  "httpManagementPort", "httpApiPort", "wsApiGatewayPort", "dwsRemoteControlPort",
  "bossThreads", "workerThreads", "agentRegisterKey", "sniffBytes", "adminPath", "apiPath",
  "remoteApiHost", "remoteApiPort",
]);
const HOT_FIELDS = [
  "maxSessions", "rateLimitTokensPerSecond", "rateLimitBurstCapacity",
  "agentHeartbeatInterval", "maxHeartbeatMisses", "sessionIdleTimeout", "apiTokenEnabled",
];

const hasRestartRequired = computed(() => config.restartRequiredFields.length > 0);
const gatewayHost = ref(localStorage.getItem("socks5-gateway-host") || localStorage.getItem("gateway-manage-host") || location.hostname || "127.0.0.1");
const gatewayPort = ref(Number(localStorage.getItem("gateway-api-port") || 3000));

const maskedToken = computed(() => {
  const t = config.managementToken || "";
  if (!t) return "未生成";
  if (t.length <= 8) return t;
  return t.slice(0, 4) + "****" + t.slice(-4);
});

function getToken(): string {
  return injectedToken?.value || injectedAccessCode?.value || localStorage.getItem("remote-client-token") || "";
}

async function copyToken() {
  const t = config.managementToken || "";
  if (!t) { ElMessage.warning("Token 未生成"); return; }
  try {
    await navigator.clipboard.writeText(t);
    ElMessage.success("Token 已复制");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); document.execCommand("copy");
    document.body.removeChild(ta); ElMessage.success("Token 已复制");
  }
}

function setupWsHandler() {
  if (!injectedOnWsMessage || !injectedSendWsMessage) return;
  unregisterHandler = injectedOnWsMessage((msg: any) => {
    if (msg.type === "config_snapshot" && msg.config) Object.assign(config, msg.config);
    else if (msg.type === "config_result") {
      saving.value = false;
      if (msg.status === "ok") {
        ElMessage.success("配置已保存");
        if (msg.restartRequired?.length > 0) ElMessage.warning(`以下配置需重启生效: ${msg.restartRequired.join(", ")}`);
      } else ElMessage.error("保存失败");
    }
  });
}

// 当共享 WebSocket 连接时，请求配置快照
watch(wsConnected, (connected) => {
  if (connected) {
    injectedSendWsMessage?.(JSON.stringify({ type: "config_get" }));
  }
});

function saveConfig() {
  if (!wsConnected.value) { ElMessage.warning("WebSocket 未连接，无法保存"); return; }
  saving.value = true;
  const EXCLUDE_FIELDS = new Set(["managementToken", "restartRequiredFields"]);
  const payload: Record<string, unknown> = {};
  for (const field of RESTART_FIELDS) { if (!EXCLUDE_FIELDS.has(field)) payload[field] = (config as Record<string, unknown>)[field]; }
  for (const field of HOT_FIELDS) { payload[field] = (config as Record<string, unknown>)[field]; }
  injectedSendWsMessage?.(JSON.stringify({ type: "config_update", config: payload }));
}

const fwMode = ref("DISABLED");
const fwRateLimit = ref(false);
const fwStatus = ref<any>(null);

async function fetchFirewall() {
  try {
    const base = `http://${gatewayHost.value}:${gatewayPort.value}`;
    const token = getToken();
    const [statusRes] = await Promise.all([
      fetch(`${base}/admin/api/firewall/status?token=${token}`),
    ]);
    if (statusRes.ok) {
      fwStatus.value = await statusRes.json();
      fwMode.value = fwStatus.value.ipFilter?.mode || "DISABLED";
      fwRateLimit.value = fwStatus.value.rateLimitEnabled || false;
    }
  } catch { /* ignore */ }
}

async function setFwMode(mode: string) {
  try {
    const base = `http://${gatewayHost.value}:${gatewayPort.value}`;
    const token = getToken();
    await fetch(`${base}/admin/api/firewall/mode?token=${token}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode })
    });
    ElMessage.success("IP 过滤模式已更新"); fetchFirewall();
  } catch { ElMessage.error("设置失败"); }
}

async function setFwRateLimit(enabled: boolean) {
  try {
    const base = `http://${gatewayHost.value}:${gatewayPort.value}`;
    const token = getToken();
    await fetch(`${base}/admin/api/firewall/rate-limit?token=${token}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled })
    });
    ElMessage.success(`限流已${enabled ? "启用" : "禁用"}`); fetchFirewall();
  } catch { ElMessage.error("设置失败"); }
}


// ==================== SPI 提供商 ====================
const spiProviders = ref<{ name: string; implementations: string[]; current: string }[]>([]);

async function fetchSpiProviders() {
  try {
    const base = `http://${gatewayHost.value}:${gatewayPort.value}`;
    const token = getToken();
    const resp = await fetch(`${base}/admin/api/spi/providers?token=${token}`);
    if (resp.ok) {
      const data = await resp.json();
      spiProviders.value = (data.interfaces || []).map((iface: any) => ({
        name: iface.name,
        implementations: iface.implementations || [],
        current: iface.implementations?.[0] || "",
      }));
    }
  } catch {}
}

onMounted(() => { setupWsHandler(); fetchFirewall(); fetchSpiProviders(); });
onUnmounted(() => { if (unregisterHandler) unregisterHandler(); });
</script>

<style scoped>
.config-page { height: 100%; overflow-y: auto; background: var(--el-bg-color-page); }
.cp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px; border-bottom: 1px solid var(--el-border-color-lighter);
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  position: sticky; top: 0; z-index: 5;
}

html.dark .cp-header {
  background: rgba(30,41,59,0.85);
  border-bottom-color: rgba(255,255,255,0.08);
}
.cp-header-left { display: flex; align-items: center; gap: 10px; }
.cp-title { font-size: 16px; font-weight: 700; margin: 0; color: var(--el-text-color-primary); }
.cp-header-right { display: flex; gap: 8px; }
.cp-body { padding: 16px 24px; display: flex; flex-direction: column; gap: 16px; }
.cp-card {
  border-radius: 12px;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transition: all 0.3s;
}

html.dark .cp-card {
  background: rgba(30,41,59,0.8);
  border-color: rgba(255,255,255,0.08);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
.cp-card :deep(.el-card__header) {
  padding: 12px 20px; border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}
.cp-card-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.cp-row + .cp-row { margin-top: 16px; }
.cp-token-masked { font-size: 13px; color: var(--el-text-color-secondary); font-family: monospace; }
.cp-card-header { display: flex; align-items: center; justify-content: space-between; }
.cp-empty { text-align: center; color: var(--el-text-color-placeholder); font-size: 13px; padding: 20px 0; }

.cp-spi-list { display: flex; flex-direction: column; gap: 10px; }
.cp-spi-item { display: flex; align-items: center; gap: 16px; }
.cp-spi-name { font-size: 13px; font-weight: 500; color: var(--el-text-color-primary); min-width: 180px; }

.thin-scroller::-webkit-scrollbar { width: 5px; height: 5px; }
.thin-scroller::-webkit-scrollbar-track { background: transparent; }
.thin-scroller::-webkit-scrollbar-thumb { background: var(--el-border-color-darker); border-radius: 3px; }
.thin-scroller::-webkit-scrollbar-thumb:hover { background: var(--el-text-color-secondary); }
</style>
