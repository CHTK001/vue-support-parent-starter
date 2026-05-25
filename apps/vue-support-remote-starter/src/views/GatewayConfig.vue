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
              <el-form-item label="UDP 控制端口">
                <el-tooltip content="修改后需重启网关生效" placement="top">
                  <el-input-number v-model="config.udpControlPort" :min="1024" :max="65535" style="width:100%" />
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
              <el-form-item label="UDP 被控端口">
                <el-tooltip content="修改后需重启网关生效" placement="top">
                  <el-input-number v-model="config.udpAgentPort" :min="1024" :max="65535" style="width:100%" />
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

        <!-- 代理服务器配置 -->
        <el-card shadow="never" class="cp-card">
          <template #header>
            <div class="cp-card-header">
              <span class="cp-card-title">代理服务器</span>
              <el-button size="small" type="primary" @click="showAddProxy = true">添加代理</el-button>
            </div>
          </template>
          <div v-if="proxies.length === 0" class="cp-empty">暂无代理服务器，点击"添加代理"创建</div>
          <div v-else class="cp-proxy-list">
            <div v-for="p in proxies" :key="p.id" class="cp-proxy-item">
              <el-tag size="small" :type="p.type.includes('socks') ? 'warning' : 'info'" effect="plain">{{ p.type }}</el-tag>
              <span class="cp-proxy-name">{{ p.name }}</span>
              <code class="cp-proxy-port">{{ p.port }}</code>
              <span v-if="p.targetHost && p.targetPort" class="cp-proxy-target">→ {{ p.targetHost }}:{{ p.targetPort }}</span>
              <el-tag size="small" :type="p.running ? 'success' : 'info'" effect="dark">{{ p.running ? '运行中' : '已停止' }}</el-tag>
              <div class="cp-proxy-actions">
                <el-button v-if="!p.running" size="small" type="success" plain @click="proxyStart(p)">启动</el-button>
                <el-button v-else size="small" type="warning" plain @click="proxyStop(p)">停止</el-button>
                <el-button size="small" type="danger" plain @click="proxyDelete(p)">删除</el-button>
              </div>
            </div>
          </div>
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
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, inject } from "vue";
import { ElMessage } from "element-plus";
import { InfoFilled } from "@element-plus/icons-vue";

import type { Ref } from "vue";

const injectedToken = inject<Ref<string>>("clientToken");
const injectedAccessCode = inject<Ref<string>>("accessCode");

const WS_PORT = 8082;

interface GatewayConfig {
  tcpControlPort: number; tcpAgentPort: number; udpControlPort: number;
  udpAgentPort: number; httpManagementPort: number; httpApiPort: number;
  wsApiGatewayPort: number; dwsRemoteControlPort: number;
  bossThreads: number; workerThreads: number; agentHeartbeatInterval: number;
  maxHeartbeatMisses: number; agentRegisterKey: string; sessionIdleTimeout: number;
  maxSessions: number; rateLimitTokensPerSecond: number; rateLimitBurstCapacity: number;
  sniffBytes: number; adminPath: string; apiPath: string;
  managementToken: string; apiTokenEnabled: boolean; restartRequiredFields: string[];
}

const config = reactive<GatewayConfig>({
  tcpControlPort: 9000, tcpAgentPort: 9001, udpControlPort: 19000,
  udpAgentPort: 19001, httpManagementPort: 3000, httpApiPort: 8083,
  wsApiGatewayPort: 8081, dwsRemoteControlPort: 8082, bossThreads: 2,
  workerThreads: 0, agentHeartbeatInterval: 15000, maxHeartbeatMisses: 3,
  agentRegisterKey: "", sessionIdleTimeout: 300, maxSessions: 1000,
  rateLimitTokensPerSecond: 1000, rateLimitBurstCapacity: 2000, sniffBytes: 4096,
  adminPath: "/admin", apiPath: "/", managementToken: "", apiTokenEnabled: true,
  restartRequiredFields: [],
});

const saving = ref(false);
const wsConnected = ref(false);
let ws: WebSocket | null = null;

const RESTART_FIELDS = new Set([
  "tcpControlPort", "tcpAgentPort", "udpControlPort", "udpAgentPort",
  "httpManagementPort", "httpApiPort", "wsApiGatewayPort", "dwsRemoteControlPort",
  "bossThreads", "workerThreads", "agentRegisterKey", "sniffBytes", "adminPath", "apiPath",
]);
const HOT_FIELDS = [
  "maxSessions", "rateLimitTokensPerSecond", "rateLimitBurstCapacity",
  "agentHeartbeatInterval", "maxHeartbeatMisses", "sessionIdleTimeout", "apiTokenEnabled",
];

const hasRestartRequired = computed(() => config.restartRequiredFields.length > 0);
const gatewayHost = computed(() => location.hostname || "127.0.0.1");

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

function connectWs() {
  const host = location.hostname || "127.0.0.1";
  const token = getToken();
  const wsUrl = token ? `ws://${host}:${WS_PORT}?token=${token}` : `ws://${host}:${WS_PORT}`;
  ws = new WebSocket(wsUrl);
  ws.onopen = () => { wsConnected.value = true; ws?.send(JSON.stringify({ type: "config_get" })); };
  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      if (msg.type === "config_snapshot" && msg.config) Object.assign(config, msg.config);
      else if (msg.type === "config_result") {
        saving.value = false;
        if (msg.status === "ok") {
          ElMessage.success("配置已保存");
          if (msg.restartRequired?.length > 0) ElMessage.warning(`以下配置需重启生效: ${msg.restartRequired.join(", ")}`);
        } else ElMessage.error("保存失败");
      }
    } catch { /* ignore */ }
  };
  ws.onclose = () => { wsConnected.value = false; setTimeout(connectWs, 3000); };
  ws.onerror = () => { wsConnected.value = false; };
}

function disconnectWs() { if (ws) { ws.close(); ws = null; } }

function saveConfig() {
  if (!ws || ws.readyState !== WebSocket.OPEN) { ElMessage.warning("WebSocket 未连接，无法保存"); return; }
  saving.value = true;
  const EXCLUDE_FIELDS = new Set(["managementToken", "restartRequiredFields"]);
  const payload: Record<string, unknown> = {};
  for (const field of RESTART_FIELDS) { if (!EXCLUDE_FIELDS.has(field)) payload[field] = (config as Record<string, unknown>)[field]; }
  for (const field of HOT_FIELDS) { payload[field] = (config as Record<string, unknown>)[field]; }
  ws.send(JSON.stringify({ type: "config_update", config: payload }));
}

const fwMode = ref("DISABLED");
const fwRateLimit = ref(false);
const fwStatus = ref<any>(null);

async function fetchFirewall() {
  try {
    const base = `${window.location.protocol}//${window.location.hostname}:3000`;
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
    const base = `${window.location.protocol}//${window.location.hostname}:3000`;
    const token = getToken();
    await fetch(`${base}/admin/api/firewall/mode?token=${token}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode })
    });
    ElMessage.success("IP 过滤模式已更新"); fetchFirewall();
  } catch { ElMessage.error("设置失败"); }
}

async function setFwRateLimit(enabled: boolean) {
  try {
    const base = `${window.location.protocol}//${window.location.hostname}:3000`;
    const token = getToken();
    await fetch(`${base}/admin/api/firewall/rate-limit?token=${token}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled })
    });
    ElMessage.success(`限流已${enabled ? "启用" : "禁用"}`); fetchFirewall();
  } catch { ElMessage.error("设置失败"); }
}

// ==================== 代理服务器管理 ====================
const proxies = ref<any[]>([]);
const showAddProxy = ref(false);
const proxyCreating = ref(false);
const proxyForm = ref({ name: "", type: "netty-socks5", port: 1080, targetHost: "", targetPort: 0 });

async function fetchProxies() {
  try {
    const base = `${window.location.protocol}//${window.location.hostname}:3000`;
    const token = getToken();
    const resp = await fetch(`${base}/admin/api/proxies?token=${token}`);
    if (resp.ok) proxies.value = await resp.json();
  } catch {}
}

async function proxyCreate() {
  proxyCreating.value = true;
  try {
    const base = `${window.location.protocol}//${window.location.hostname}:3000`;
    const token = getToken();
    const resp = await fetch(`${base}/admin/api/proxies?token=${token}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(proxyForm.value)
    });
    if (resp.ok) { ElMessage.success("代理已创建"); showAddProxy.value = false; await fetchProxies(); }
    else { const t = await resp.text(); ElMessage.error("创建失败: " + t); }
  } catch (e: any) { ElMessage.error("创建异常: " + e.message); }
  finally { proxyCreating.value = false; }
}

async function proxyStart(p: any) {
  try {
    const base = `${window.location.protocol}//${window.location.hostname}:3000`;
    const token = getToken();
    const resp = await fetch(`${base}/admin/api/proxies/${p.id}/start?token=${token}`, { method: "POST" });
    if (resp.ok) { ElMessage.success("代理已启动"); await fetchProxies(); }
    else { const t = await resp.text(); ElMessage.error("启动失败: " + t); }
  } catch (e: any) { ElMessage.error("启动异常: " + e.message); }
}

async function proxyStop(p: any) {
  try {
    const base = `${window.location.protocol}//${window.location.hostname}:3000`;
    const token = getToken();
    const resp = await fetch(`${base}/admin/api/proxies/${p.id}/stop?token=${token}`, { method: "POST" });
    if (resp.ok) { ElMessage.success("代理已停止"); await fetchProxies(); }
    else { const t = await resp.text(); ElMessage.error("停止失败: " + t); }
  } catch (e: any) { ElMessage.error("停止异常: " + e.message); }
}

async function proxyDelete(p: any) {
  try {
    const base = `${window.location.protocol}//${window.location.hostname}:3000`;
    const token = getToken();
    const resp = await fetch(`${base}/admin/api/proxies?token=${token}&id=${p.id}`, { method: "DELETE" });
    if (resp.ok) { ElMessage.success("代理已删除"); await fetchProxies(); }
    else ElMessage.error("删除失败");
  } catch (e: any) { ElMessage.error("删除异常: " + e.message); }
}

// ==================== SPI 提供商 ====================
const spiProviders = ref<{ name: string; implementations: string[]; current: string }[]>([]);

async function fetchSpiProviders() {
  try {
    const base = `${window.location.protocol}//${window.location.hostname}:3000`;
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

onMounted(() => { connectWs(); fetchFirewall(); fetchProxies(); fetchSpiProviders(); });
onUnmounted(disconnectWs);
</script>

<style scoped>
.config-page { height: 100%; overflow-y: auto; background: var(--el-bg-color-page); }
.cp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px; border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}
.cp-header-left { display: flex; align-items: center; gap: 10px; }
.cp-title { font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); margin: 0; }
.cp-header-right { display: flex; gap: 8px; }
.cp-body { padding: 16px 24px; display: flex; flex-direction: column; gap: 16px; }
.cp-card { border-radius: 10px; border: 1px solid var(--el-border-color-light); }
.cp-card :deep(.el-card__header) {
  padding: 12px 20px; border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}
.cp-card-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.cp-row + .cp-row { margin-top: 16px; }
.cp-token-masked { font-size: 13px; color: var(--el-text-color-secondary); font-family: monospace; }
.cp-card-header { display: flex; align-items: center; justify-content: space-between; }
.cp-empty { text-align: center; color: var(--el-text-color-placeholder); font-size: 13px; padding: 20px 0; }

.cp-proxy-list { display: flex; flex-direction: column; gap: 8px; }
.cp-proxy-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 12px;
  border-radius: 6px; background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-extra-light);
}
.cp-proxy-name { font-size: 13px; font-weight: 500; color: var(--el-text-color-primary); }
.cp-proxy-port { font-size: 12px; background: var(--el-fill-color); padding: 1px 6px; border-radius: 3px; }
.cp-proxy-target { font-size: 12px; color: var(--el-text-color-secondary); }
.cp-proxy-actions { margin-left: auto; display: flex; gap: 6px; }

.cp-spi-list { display: flex; flex-direction: column; gap: 10px; }
.cp-spi-item { display: flex; align-items: center; gap: 16px; }
.cp-spi-name { font-size: 13px; font-weight: 500; color: var(--el-text-color-primary); min-width: 180px; }

.thin-scroller::-webkit-scrollbar { width: 5px; height: 5px; }
.thin-scroller::-webkit-scrollbar-track { background: transparent; }
.thin-scroller::-webkit-scrollbar-thumb { background: var(--el-border-color-darker); border-radius: 3px; }
.thin-scroller::-webkit-scrollbar-thumb:hover { background: var(--el-text-color-secondary); }
</style>