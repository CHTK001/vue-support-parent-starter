<template>
  <div class="config-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>网关配置</span>
          <div class="header-actions">
            <el-tag :type="wsConnected ? 'success' : 'danger'" size="small">
              {{ wsConnected ? 'WS 已连接' : 'WS 断开' }}
            </el-tag>
            <el-tag v-if="hasRestartRequired" type="warning" size="small">
              部分配置需重启生效
            </el-tag>
            <el-button type="primary" :loading="saving" @click="saveConfig">
              保存
            </el-button>
          </div>
        </div>
      </template>

      <el-form :model="config" label-width="160px" label-position="left" size="default">
        <!-- TCP 端口 -->
        <el-divider content-position="left">TCP 端口</el-divider>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="控制端口">
              <el-input-number v-model="config.tcpControlPort" :min="1024" :max="65535" disabled />
              <el-tag size="small" type="warning" class="restart-tag">需重启</el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Agent 端口">
              <el-input-number v-model="config.tcpAgentPort" :min="1024" :max="65535" disabled />
              <el-tag size="small" type="warning" class="restart-tag">需重启</el-tag>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- UDP 端口 -->
        <el-divider content-position="left">UDP 端口</el-divider>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="控制端口">
              <el-input-number v-model="config.udpControlPort" :min="1024" :max="65535" disabled />
              <el-tag size="small" type="warning" class="restart-tag">需重启</el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Agent 端口">
              <el-input-number v-model="config.udpAgentPort" :min="1024" :max="65535" disabled />
              <el-tag size="small" type="warning" class="restart-tag">需重启</el-tag>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- HTTP & WS 端口 -->
        <el-divider content-position="left">HTTP &amp; WebSocket 端口</el-divider>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="管理端口">
              <el-input-number v-model="config.httpManagementPort" :min="1024" :max="65535" disabled />
              <el-tag size="small" type="warning" class="restart-tag">需重启</el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="API 端口">
              <el-input-number v-model="config.httpApiPort" :min="1024" :max="65535" disabled />
              <el-tag size="small" type="warning" class="restart-tag">需重启</el-tag>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="WS 网关端口">
              <el-input-number v-model="config.wsApiGatewayPort" :min="1024" :max="65535" disabled />
              <el-tag size="small" type="warning" class="restart-tag">需重启</el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="远程控制端口">
              <el-input-number v-model="config.dwsRemoteControlPort" :min="1024" :max="65535" disabled />
              <el-tag size="small" type="warning" class="restart-tag">需重启</el-tag>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 线程池 -->
        <el-divider content-position="left">线程池</el-divider>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="Boss 线程数">
              <el-input-number v-model="config.bossThreads" :min="1" :max="32" disabled />
              <el-tag size="small" type="warning" class="restart-tag">需重启</el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Worker 线程数">
              <el-input-number v-model="config.workerThreads" :min="1" :max="256" disabled />
              <el-tag size="small" type="warning" class="restart-tag">需重启</el-tag>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Agent -->
        <el-divider content-position="left">Agent</el-divider>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="注册密钥">
              <el-input v-model="config.agentRegisterKey" type="password" show-password disabled />
              <el-tag size="small" type="warning" class="restart-tag">需重启</el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="心跳间隔(ms)">
              <el-input-number v-model="config.agentHeartbeatInterval" :min="1000" :max="300000" :step="1000" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最大心跳缺失">
              <el-input-number v-model="config.maxHeartbeatMisses" :min="1" :max="60" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Session -->
        <el-divider content-position="left">Session</el-divider>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="最大会话数">
              <el-input-number v-model="config.maxSessions" :min="1" :max="100000" :step="100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="会话空闲超时(s)">
              <el-input-number v-model="config.sessionIdleTimeout" :min="10" :max="86400" :step="10" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 限流 -->
        <el-divider content-position="left">限流</el-divider>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="每秒令牌数">
              <el-input-number v-model="config.rateLimitTokensPerSecond" :min="1" :max="100000" :step="100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="突发容量">
              <el-input-number v-model="config.rateLimitBurstCapacity" :min="1" :max="100000" :step="100" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 其他 -->
        <el-divider content-position="left">其他</el-divider>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="Sniff Bytes">
              <el-input-number v-model="config.sniffBytes" :min="64" :max="65535" disabled />
              <el-tag size="small" type="warning" class="restart-tag">需重启</el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Admin Path">
              <el-input v-model="config.adminPath" disabled />
              <el-tag size="small" type="warning" class="restart-tag">需重启</el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="API Path">
              <el-input v-model="config.apiPath" disabled />
              <el-tag size="small" type="warning" class="restart-tag">需重启</el-tag>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from "vue";
import { ElMessage } from "element-plus";

/** Gateway DWS WebSocket 端口 */
const WS_PORT = 8082;

interface GatewayConfig {
  tcpControlPort: number;
  tcpAgentPort: number;
  udpControlPort: number;
  udpAgentPort: number;
  httpManagementPort: number;
  httpApiPort: number;
  wsApiGatewayPort: number;
  dwsRemoteControlPort: number;
  bossThreads: number;
  workerThreads: number;
  agentHeartbeatInterval: number;
  maxHeartbeatMisses: number;
  agentRegisterKey: string;
  sessionIdleTimeout: number;
  maxSessions: number;
  rateLimitTokensPerSecond: number;
  rateLimitBurstCapacity: number;
  sniffBytes: number;
  adminPath: string;
  apiPath: string;
  restartRequiredFields: string[];
}

const config = reactive<GatewayConfig>({
  tcpControlPort: 9000,
  tcpAgentPort: 9001,
  udpControlPort: 9002,
  udpAgentPort: 9003,
  httpManagementPort: 8080,
  httpApiPort: 8083,
  wsApiGatewayPort: 8081,
  dwsRemoteControlPort: 8082,
  bossThreads: 2,
  workerThreads: 0,
  agentHeartbeatInterval: 15000,
  maxHeartbeatMisses: 3,
  agentRegisterKey: "",
  sessionIdleTimeout: 300,
  maxSessions: 1000,
  rateLimitTokensPerSecond: 1000,
  rateLimitBurstCapacity: 2000,
  sniffBytes: 4096,
  adminPath: "/admin",
  apiPath: "/api",
  restartRequiredFields: [],
});

const saving = ref(false);
const wsConnected = ref(false);
let ws: WebSocket | null = null;

const hasRestartRequired = computed(() => {
  return config.restartRequiredFields.length > 0;
});

function connectWs() {
  const host = location.hostname || "127.0.0.1";
  ws = new WebSocket(`ws://${host}:${WS_PORT}`);

  ws.onopen = () => {
    wsConnected.value = true;
    // 连接后立即请求配置
    ws?.send(JSON.stringify({ type: "config_get" }));
  };

  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      if (msg.type === "config_snapshot" && msg.config) {
        Object.assign(config, msg.config);
      } else if (msg.type === "config_result") {
        saving.value = false;
        if (msg.status === "ok") {
          ElMessage.success("配置已保存");
          if (msg.restartRequired?.length > 0) {
            ElMessage.warning(`以下配置需重启生效: ${msg.restartRequired.join(", ")}`);
          }
        } else {
          ElMessage.error("保存失败");
        }
      }
    } catch { /* ignore */ }
  };

  ws.onclose = () => {
    wsConnected.value = false;
    setTimeout(connectWs, 3000);
  };

  ws.onerror = () => {
    wsConnected.value = false;
  };
}

function disconnectWs() {
  if (ws) {
    ws.close();
    ws = null;
  }
}

function saveConfig() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    ElMessage.warning("WebSocket 未连接，无法保存");
    return;
  }
  saving.value = true;
  // 只发送可热更新字段
  const payload: Record<string, unknown> = {};
  const hotFields = [
    "maxSessions", "rateLimitTokensPerSecond", "rateLimitBurstCapacity",
    "agentHeartbeatInterval", "maxHeartbeatMisses", "sessionIdleTimeout",
  ];
  for (const field of hotFields) {
    payload[field] = (config as Record<string, unknown>)[field];
  }
  ws.send(JSON.stringify({ type: "config_update", config: payload }));
}

onMounted(connectWs);
onUnmounted(disconnectWs);
</script>

<style scoped>
.config-page {
  padding: 20px;
}

.config-page .el-divider {
  margin-top: 24px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.restart-tag {
  margin-left: 6px;
}
</style>
