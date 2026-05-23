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
      </el-form>
      <template #footer>
        <el-button @click="settingsVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存并查询</el-button>
      </template>
    </el-dialog>

    <div v-if="error" class="gm-error">{{ error }}</div>

    <template v-if="health">
      <div class="gm-summary">
        <div class="gm-stat">
          <span class="gm-stat-label">健康</span>
          <el-tag :type="health.status === 'UP' ? 'success' : 'danger'" size="small" effect="dark">{{ health.status }}</el-tag>
        </div>
        <div class="gm-stat">
          <span class="gm-stat-label">Agent</span>
          <span class="gm-stat-value">{{ health.agents }}</span>
        </div>
        <div class="gm-stat">
          <span class="gm-stat-label">Target</span>
          <span class="gm-stat-value">{{ health.targets }}</span>
        </div>
      </div>

      <el-divider content-position="left">在线 Agent</el-divider>
      <div v-if="agents.length === 0" class="gm-empty">无在线 Agent</div>
      <div v-else class="gm-list">
        <div v-for="a in agents" :key="a.agentId" class="gm-item" @click="showAgentDetail(a)">
          <el-tag size="small" type="success" effect="dark" class="gm-badge">在线</el-tag>
          <code class="gm-id">{{ a.agentId }}</code>
          <span class="gm-right">{{ a.protocols?.join(", ") }}</span>
        </div>
      </div>

      <el-divider content-position="left">注册 Target</el-divider>
      <div v-if="targets.length === 0" class="gm-empty">无注册 Target</div>
      <div v-else class="gm-list">
        <div v-for="t in targets" :key="t.targetId" class="gm-item" @click="showTargetDetail(t)">
          <code class="gm-id">{{ t.targetId }}</code>
          <el-tag size="small" :type="t.online ? 'success' : 'info'" effect="plain" class="gm-tag-right">{{ t.protocol }}</el-tag>
        </div>
      </div>
    </template>

    <div v-else-if="!loading && !error" class="gm-empty">点击"刷新"查询网关状态</div>

    <!-- Target 详情弹框 -->
    <el-dialog v-model="detailVisible" :title="detailTitle" width="400px" append-to-body>
      <template v-if="detailTarget">
        <div class="detail-row"><span class="dl">Target ID</span><code class="dv">{{ detailTarget.targetId }}</code></div>
        <div class="detail-row"><span class="dl">协议</span><span class="dv">{{ detailTarget.protocol }}</span></div>
        <div class="detail-row"><span class="dl">主机</span><span class="dv">{{ detailTarget.host || '-' }}</span></div>
        <div class="detail-row"><span class="dl">端口</span><span class="dv">{{ detailTarget.port || '-' }}</span></div>
        <div class="detail-row"><span class="dl">Agent ID</span><code class="dv">{{ detailTarget.agentId }}</code></div>
        <div class="detail-row"><span class="dl">状态</span>
          <el-tag size="small" :type="detailTarget.online ? 'success' : 'info'">{{ detailTarget.online ? '在线' : '离线' }}</el-tag>
        </div>
      </template>
      <template v-if="detailAgent">
        <el-divider content-position="left">Agent 信息</el-divider>
        <div class="detail-row"><span class="dl">Agent ID</span><code class="dv">{{ detailAgent.agentId }}</code></div>
        <div class="detail-row"><span class="dl">协议</span><span class="dv">{{ detailAgent.protocols?.join(", ") }}</span></div>
        <div class="detail-row"><span class="dl">编码器</span><span class="dv">{{ detailAgent.codecs?.join(", ") }}</span></div>
        <div class="detail-row"><span class="dl">操作系统</span><span class="dv">{{ detailAgent.capabilities?.['os.name'] || '-' }}</span></div>
        <div class="detail-row"><span class="dl">系统架构</span><span class="dv">{{ detailAgent.capabilities?.['os.arch'] || '-' }}</span></div>
        <div class="detail-row"><span class="dl">系统版本</span><span class="dv">{{ detailAgent.capabilities?.['os.version'] || '-' }}</span></div>
        <div v-if="otherCaps.length > 0" class="detail-row"><span class="dl">其他能力</span><span class="dv">{{ otherCaps.join(", ") }}</span></div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { Refresh, Setting } from "@element-plus/icons-vue";

const gatewayHost = ref("127.0.0.1");
const gatewayPort = ref(8083);
const settingsVisible = ref(false);
const loading = ref(false);
const error = ref("");
const health = ref<{ status: string; agents: number; targets: number } | null>(null);
const agents = ref<any[]>([]);
const targets = ref<any[]>([]);

// 详情弹框
const detailVisible = ref(false);
const detailTitle = ref("");
const detailTarget = ref<any>(null);
const detailAgent = ref<any>(null);

const otherCaps = computed(() => {
  if (!detailAgent.value?.capabilities) return [];
  const keys = Object.keys(detailAgent.value.capabilities).filter(k => !['os.name','os.arch','os.version'].includes(k));
  return keys.map(k => `${k}=${detailAgent.value.capabilities[k]}`);
});

// 从 localStorage 恢复配置
const savedHost = localStorage.getItem("gateway-manage-host");
const savedPort = localStorage.getItem("gateway-manage-port");
if (savedHost) gatewayHost.value = savedHost;
if (savedPort) gatewayPort.value = Number(savedPort);

async function fetchInfo() {
  loading.value = true;
  error.value = "";
  health.value = null;
  agents.value = [];
  targets.value = [];
  try {
    const base = `http://${gatewayHost.value}:${gatewayPort.value}`;
    const [h, a, t] = await Promise.all([
      fetch(`${base}/api/health`),
      fetch(`${base}/api/agents`),
      fetch(`${base}/api/targets/detail`),
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
  } catch (e: any) {
    error.value = "请求失败: " + (e.message || "未知");
  } finally {
    loading.value = false;
  }
}

function saveSettings() {
  localStorage.setItem("gateway-manage-host", gatewayHost.value);
  localStorage.setItem("gateway-manage-port", String(gatewayPort.value));
  settingsVisible.value = false;
  fetchInfo();
}

function showTargetDetail(t: any) {
  detailTitle.value = "Target 详情";
  detailTarget.value = t;
  // 查找关联 Agent
  const agent = agents.value.find((a: any) => a.agentId === t.agentId);
  detailAgent.value = agent || null;
  detailVisible.value = true;
}

function showAgentDetail(a: any) {
  detailTitle.value = "Agent 详情";
  detailTarget.value = null;
  detailAgent.value = a;
  detailVisible.value = true;
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

/* 详情弹框 */
.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
}
.detail-row .dl {
  color: var(--el-text-color-secondary);
  min-width: 80px;
  flex-shrink: 0;
}
.detail-row .dv {
  color: var(--el-text-color-primary);
}
.detail-row code {
  font-family: monospace;
  background: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
