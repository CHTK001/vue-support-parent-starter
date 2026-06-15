<template>
  <div class="console-page">
    <!-- 状态卡片 -->
    <div class="stats-banner">
      <div class="stat-card">
        <div class="stat-icon" style="border-color:rgba(0,246,255,.3);background:rgba(0,246,255,.06)">📡</div>
        <div class="stat-body">
          <span class="stat-value" style="color:#00ffff">{{ collectorCount }}</span>
          <span class="stat-label">采集器</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.06)">⚡</div>
        <div class="stat-body">
          <span class="stat-value" style="color:#f59e0b">{{ activeCount }}</span>
          <span class="stat-label">主动采集器</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="border-color:rgba(236,72,153,.3);background:rgba(236,72,153,.06)">🔔</div>
        <div class="stat-body">
          <span class="stat-value" style="color:#ec4899">{{ subscriberCount }}</span>
          <span class="stat-label">订阅客户端</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="border-color:rgba(34,197,94,.3);background:rgba(34,197,94,.06)">🟢</div>
        <div class="stat-body">
          <span class="stat-value" style="color:#22c55e">{{ token ? '已授权' : '未授权' }}</span>
          <span class="stat-label">Token</span>
        </div>
      </div>
    </div>

    <div class="console-grid">
      <!-- 数据采集 -->
      <div class="page-panel">
        <div class="panel-header">
          <div class="panel-title">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#00ffff" stroke-width="1.5">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
            </svg>
            <span>数据采集</span>
          </div>
        </div>
        <div class="panel-body">
          <div class="form-row">
            <div class="form-field">
              <label>Topic</label>
              <el-input v-model="collectTopic" placeholder="datalake.test" size="small" />
            </div>
            <div class="form-field">
              <label>Pipeline</label>
              <el-input v-model="collectPipeline" placeholder="datalake-test-pipeline" size="small" />
            </div>
            <div class="form-field">
              <label>载荷值</label>
              <el-input v-model="collectPayload" placeholder='{"value":123}' size="small" />
            </div>
            <div class="form-field form-field--btn">
              <el-button type="primary" :loading="collecting" @click="doCollect" size="small">采集</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 订阅管理 -->
      <div class="page-panel">
        <div class="panel-header">
          <div class="panel-title">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#f59e0b" stroke-width="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>订阅管理</span>
          </div>
        </div>
        <div class="panel-body">
          <div class="form-row">
            <div class="form-field">
              <label>协议</label>
              <el-select v-model="subProtocol" size="small" style="width:100%">
                <el-option value="ALL" label="ALL" />
                <el-option value="HTTP" label="HTTP" />
                <el-option value="MQ" label="MQ" />
                <el-option value="TCP" label="TCP" />
                <el-option value="KAFKA" label="KAFKA" />
              </el-select>
            </div>
            <div class="form-field">
              <label>Client ID</label>
              <el-input v-model="subClientId" placeholder="console-client" size="small" />
            </div>
            <div class="form-field">
              <label>Callback URL</label>
              <el-input v-model="subCallbackUrl" placeholder="http://..." size="small" />
            </div>
          </div>
          <div class="btn-row">
            <el-button type="primary" :loading="subscribing" @click="doSubscribe" size="small">订阅</el-button>
            <el-button :loading="polling" @click="doPoll" size="small">拉取</el-button>
            <el-button :loading="acking" @click="doAck" size="small">确认</el-button>
          </div>
        </div>
      </div>

      <!-- 操作日志 -->
      <div class="page-panel console-log-panel">
        <div class="panel-header">
          <div class="panel-title">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#94a3b8" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            <span>操作日志</span>
            <button class="btn-ghost btn-xs" @click="logs = []">清空</button>
          </div>
        </div>
        <div class="log-body">
          <div v-if="logs.length === 0" class="log-empty">点击按钮开始调试</div>
          <div v-for="(entry, i) in logs" :key="i" class="log-entry">
            <span class="log-time">{{ entry.time }}</span>
            <span class="log-tag" :style="{ color: entry.color }">{{ entry.label }}</span>
            <pre class="log-json">{{ entry.data }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getDatalakeToken, datalakeRequest } from "@pages/datalake/api/request";
import { ElMessage } from "element-plus";

defineOptions({ name: "DatalakeConsolePage" });

const token = ref("");
const collectorCount = ref(0);
const activeCount = ref(0);
const subscriberCount = ref(0);

// 采集
const collectTopic = ref("datalake.test");
const collectPipeline = ref("datalake-test-pipeline");
const collectPayload = ref('{"value":' + Math.floor(Math.random() * 1000) + ',"source":"vue-console"}');
const collecting = ref(false);

// 订阅
const subProtocol = ref("ALL");
const subClientId = ref("vue-console");
const subCallbackUrl = ref(`http://127.0.0.1:58087/datalake/subscriber/callback`);
const subscribing = ref(false);
const polling = ref(false);
const acking = ref(false);

interface LogEntry { time: string; label: string; data: string; color: string; }
const logs = ref<LogEntry[]>([]);

function addLog(label: string, data: any, color = "#00ffff") {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    label,
    data: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    color,
  });
}

async function loadStatus() {
  try {
    const [collectors, active, subscribers] = await Promise.all([
      datalakeRequest("get", "/v2/datalake/collector/list"),
      datalakeRequest("get", "/v2/datalake/active-collector/stats"),
      datalakeRequest("get", "/v2/datalake/subscriber/clients"),
    ]);
    collectorCount.value = Array.isArray(collectors) ? collectors.length : (collectors as any)?.data?.length ?? 0;
    activeCount.value = (active as any)?.count ?? (active as any)?.data?.count ?? 0;
    subscriberCount.value = countSubscriberClients(subscribers);
    addLog("状态", { collectors: collectorCount.value, active: activeCount.value, subscribers: subscriberCount.value }, "#22c55e");
  } catch (e: any) {
    addLog("状态加载失败", e?.message || String(e), "#ef4444");
  }
}

function countSubscriberClients(payload: any): number {
  const data = payload?.data ?? payload;
  if (!data || typeof data !== "object") return 0;
  let count = 0;
  Object.values(data).forEach((clients: any) => {
    if (Array.isArray(clients)) {
      clients.forEach((c: any) => {
        const id = String((c?.clientId || c?.id || "")).toLowerCase();
        if (id !== "web-console" && !id.startsWith("callback-")) count++;
      });
    } else if (clients && typeof clients === "object") {
      Object.keys(clients).forEach((id) => {
        const nid = id.toLowerCase();
        if (nid !== "web-console" && !nid.startsWith("callback-")) count++;
      });
    }
  });
  return count;
}

async function doCollect() {
  collecting.value = true;
  try {
    let payload: any;
    try { payload = JSON.parse(collectPayload.value); } catch { payload = { value: collectPayload.value }; }
    const result = await datalakeRequest("post", "/v2/datalake/collect", {
      data: { topic: collectTopic.value, pipelineId: collectPipeline.value, protocol: "HTTP", payload },
    });
    addLog("采集", result, "#00ffff");
    ElMessage.success("采集成功");
  } catch (e: any) {
    addLog("采集失败", e?.message || String(e), "#ef4444");
    ElMessage.error("采集失败");
  } finally {
    collecting.value = false;
  }
}

async function doSubscribe() {
  subscribing.value = true;
  try {
    const result = await datalakeRequest("post", "/v2/datalake/subscribe/register", {
      data: {
        clientId: subClientId.value,
        pipelineId: collectPipeline.value,
        topics: [collectTopic.value],
        protocol: subProtocol.value,
        callbackUrl: subCallbackUrl.value || undefined,
      },
    });
    addLog("订阅", result, "#f59e0b");
    ElMessage.success("订阅成功");
    await loadStatus();
  } catch (e: any) {
    addLog("订阅失败", e?.message || String(e), "#ef4444");
    ElMessage.error("订阅失败");
  } finally {
    subscribing.value = false;
  }
}

async function doPoll() {
  polling.value = true;
  try {
    const result = await datalakeRequest("get", "/v2/datalake/subscribe/poll", {
      params: { clientId: subClientId.value, protocol: subProtocol.value },
    });
    addLog("拉取", result, "#06b6d4");
  } catch (e: any) {
    addLog("拉取失败", e?.message || String(e), "#ef4444");
  } finally {
    polling.value = false;
  }
}

async function doAck() {
  acking.value = true;
  try {
    const result = await datalakeRequest("post", "/v2/datalake/subscription/ack", {
      data: { clientId: subClientId.value, topic: collectTopic.value, protocol: subProtocol.value, offset: Date.now() },
    });
    addLog("确认", result, "#10b981");
  } catch (e: any) {
    addLog("确认失败", e?.message || String(e), "#ef4444");
  } finally {
    acking.value = false;
  }
}

onMounted(async () => {
  try {
    token.value = await getDatalakeToken();
    addLog("Token", { token: token.value.slice(0, 8) + "..." }, "#22c55e");
    await loadStatus();
  } catch (e: any) {
    addLog("初始化失败", e?.message || String(e), "#ef4444");
  }
});
</script>

<style scoped>
.console-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  overflow-y: auto;
}

.stats-banner {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--dl-surface);
  border: 1px solid var(--dl-border);
  border-radius: 8px;
  padding: 12px 14px;
  backdrop-filter: blur(8px);
}

.stat-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 1px solid; flex-shrink: 0; }

.stat-body { display: flex; flex-direction: column; gap: 1px; }

.stat-value { font-size: 16px; font-weight: 700; font-family: "JetBrains Mono", monospace; }

.stat-label { font-size: 10px; color: var(--dl-text-mute); }

.console-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 10px;
  flex: 1;
  min-height: 0;
}

.page-panel {
  background: var(--dl-surface);
  border: 1px solid var(--dl-border);
  border-radius: 8px;
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--dl-border);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
}

.panel-body { padding: 12px 14px; }

.form-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }

.form-field { display: flex; flex-direction: column; gap: 4px; }

.form-field label { font-size: 10px; color: var(--dl-text-mute); font-weight: 600; text-transform: uppercase; }

.form-field--btn { justify-content: flex-end; padding-top: 14px; }

.btn-row { display: flex; gap: 8px; margin-top: 10px; }

.console-log-panel { grid-column: 1 / -1; min-height: 200px; }

.log-body { flex: 1; overflow-y: auto; padding: 8px 14px; min-height: 0; }

.log-empty { color: var(--dl-text-mute); font-size: 12px; text-align: center; padding: 30px 0; }

.log-entry { padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,.03); }

.log-time { color: var(--dl-text-mute); font-size: 10px; margin-right: 8px; font-family: "JetBrains Mono", monospace; }

.log-tag { font-size: 10px; font-weight: 700; margin-right: 8px; text-transform: uppercase; }

.log-json { margin: 4px 0 0; padding: 6px 10px; background: rgba(0,0,0,.2); border-radius: 4px; color: #94a3b8; font-size: 11px; font-family: "JetBrains Mono", monospace; white-space: pre-wrap; overflow-x: auto; max-height: 120px; }

.btn-xs { font-size: 10px; padding: 2px 8px; }
.btn-ghost { background: transparent; border: 1px solid var(--dl-border); border-radius: 4px; color: var(--dl-text-dim); cursor: pointer; font-family: inherit; }
.btn-ghost:hover { border-color: var(--dl-border-strong); color: #e2e8f0; }

.panel-badge { font-size: 10px; color: var(--dl-text-mute); background: rgba(0,0,0,.2); padding: 1px 6px; border-radius: 10px; }
</style>
