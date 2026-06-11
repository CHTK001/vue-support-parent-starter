<template>
  <div class="collector-page">
    <!-- 统计横幅 -->
    <div class="page-metrics">
      <div v-for="stat in statsCards" :key="stat.label" class="metric-card" :style="{ '--accent': stat.color }">
        <div class="metric-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" :stroke="stat.color" stroke-width="1.5">
            <path :d="stat.icon" />
          </svg>
        </div>
        <div class="metric-body">
          <div class="metric-value">{{ stat.value }}</div>
          <div class="metric-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- 主动采集器 -->
    <div class="page-panel">
      <div class="panel-header">
        <div class="panel-title">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="1.5">
            <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
          </svg>
          <span>主动采集器</span>
          <span class="panel-badge">{{ activeCollectors.length }}</span>
        </div>
        <button class="btn-ghost" :class="{ loading: activeLoading }" @click="loadActiveCollectors" :disabled="activeLoading">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          刷新
        </button>
      </div>

      <div class="active-grid">
        <div v-for="collector in activeCollectors" :key="collector.protocol" class="active-card" :class="{ online: collector.running }">
          <div class="active-top">
            <span class="active-protocol">{{ collector.protocol }}</span>
            <span class="cli-status" :class="collector.running ? 'online' : 'offline'">
              {{ collector.running ? 'RUNNING' : 'STOPPED' }}
            </span>
          </div>
          <div class="cli-meta">
            <div class="cli-meta-item">
              <span class="cli-meta-label">映射数</span>
              <span class="cli-meta-value pipeline">{{ collector.mappings || 0 }}</span>
            </div>
            <div class="cli-meta-item" v-if="collector.host || collector.port">
              <span class="cli-meta-label">地址</span>
              <span class="cli-meta-value">{{ [collector.host, collector.port].filter(Boolean).join(':') }}</span>
            </div>
          </div>
          <div class="cli-tags-block" v-if="normalizeStrings(collector.topics).length">
            <span class="cli-tags-label">Topics</span>
            <div class="cli-tags">
              <span class="tag-chip" v-for="topic in normalizeStrings(collector.topics)" :key="topic">{{ topic }}</span>
            </div>
          </div>
          <div v-else class="cli-topics-empty">暂无 Topic</div>
        </div>
        <div v-if="activeCollectors.length === 0" class="client-empty">暂无主动采集器</div>
      </div>

      <div class="mapping-section">
        <div class="mapping-header">
          <span>Topic 映射</span>
          <span class="panel-badge">{{ activeMappings.length }}</span>
        </div>
        <div class="mapping-list">
          <div v-for="item in activeMappings" :key="`${item.protocol}:${item.topic}`" class="mapping-row">
            <span class="mapping-protocol">{{ item.protocol }}</span>
            <span class="mapping-topic">{{ item.topic }}</span>
            <span class="mapping-pipeline">{{ item.pipelineId }}</span>
            <button class="btn-mini danger" @click="handleRemoveMapping(item)">删除</button>
          </div>
          <div v-if="activeMappings.length === 0" class="client-empty compact">暂无 Topic 映射</div>
        </div>

        <div class="mapping-form">
          <select v-model="mappingDraft.protocol" class="form-input select-input">
            <option value="KAFKA">KAFKA</option>
            <option value="RABBITMQ">RABBITMQ</option>
            <option value="ACTIVEMQ">ACTIVEMQ</option>
          </select>
          <input v-model="mappingDraft.topic" class="form-input" placeholder="Topic" />
          <input v-model="mappingDraft.pipelineId" class="form-input" placeholder="Pipeline ID" />
          <button class="btn-ghost" :disabled="activeLoading" @click="handleAddMapping">注册</button>
        </div>
      </div>
    </div>

    <!-- 采集器客户端 -->
    <div class="page-panel">
      <div class="panel-header">
        <div class="panel-title">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <span>采集器客户端</span>
          <span class="panel-badge">{{ clients.length }}</span>
        </div>
        <button class="btn-ghost" :class="{ loading }" @click="loadClients" :disabled="loading">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          刷新
        </button>
      </div>

      <!-- 客户端卡片：默认显示前5个，固定高度 -->
      <div class="client-grid" :class="{ 'has-overflow': clients.length > 5 }">
        <div v-for="c in displayClients" :key="c.clientId" class="client-card" :class="{ online: c.status === 'ONLINE' }">
          <div class="cli-top">
            <div class="cli-id-row">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <path d="M6 6h.01M6 18h.01" />
              </svg>
              <span class="cli-id">{{ c.clientId }}</span>
              <span class="cli-pulse" :class="{ on: c.status === 'ONLINE' }" />
            </div>
            <span class="cli-status" :class="c.status === 'ONLINE' ? 'online' : 'offline'">
              {{ c.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE' }}
            </span>
          </div>

          <div class="cli-meta">
            <div class="cli-meta-item" v-if="c.pipelineId">
              <span class="cli-meta-label">管线</span>
              <span class="cli-meta-value pipeline">{{ c.pipelineId }}</span>
            </div>
            <div class="cli-meta-item" v-if="c.sourceIp">
              <span class="cli-meta-label">来源 IP</span>
              <span class="cli-meta-value">{{ c.sourceIp }}</span>
            </div>
            <div class="cli-meta-item">
              <span class="cli-meta-label">心跳</span>
              <span class="cli-meta-value">{{ formatTime(c.lastHeartbeat) }}</span>
            </div>
          </div>

          <div class="cli-tags-block" v-if="collectorTags(c).length">
            <span class="cli-tags-label">注册 Tags</span>
            <div class="cli-tags">
              <span class="tag-chip" v-for="tag in collectorTags(c)" :key="tag">{{ tag }}</span>
            </div>
          </div>
          <div v-else class="cli-topics-empty">暂无注册 Tags</div>
        </div>
        <div v-if="clients.length === 0" class="client-empty">暂无注册的采集器客户端</div>
      </div>

      <!-- 查看全部按钮 -->
      <div v-if="clients.length > 5" class="client-expand" @click="showDialog = true">
        <span>查看全部 {{ clients.length }} 个客户端</span>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>

    <!-- 全部客户端弹窗 -->
    <el-dialog v-model="showDialog" title="全部采集器客户端" width="900px" :append-to-body="true">
      <el-table :data="clients" stripe style="width: 100%" max-height="400">
        <el-table-column prop="clientId" label="Client ID" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ONLINE' ? 'success' : 'danger'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sourceIp" label="来源 IP" width="140" />
        <el-table-column prop="pipelineId" label="管线 ID" width="160" />
        <el-table-column prop="lastHeartbeat" label="最后心跳" width="160">
          <template #default="{ row }">{{ formatTime(row.lastHeartbeat) }}</template>
        </el-table-column>
        <el-table-column label="Tags">
          <template #default="{ row }">
            <span class="tag-chip" v-for="tag in collectorTags(row)" :key="tag" style="margin-right: 4px">{{ tag }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { fetchCollectorList, type CollectorClientInfo } from "../../api/collector";
import {
  fetchActiveCollectorStats,
  registerMapping,
  unregisterMapping,
  type ActiveCollectorStats,
  type MappingInfo,
} from "../../api/active-collector";

defineOptions({ name: "DatalakeCollectorPage" });

const clients = ref<CollectorClientInfo[]>([]);
const loading = ref(false);
const showAllClients = ref(false);
const showDialog = ref(false);
const activeCollectors = ref<ActiveCollectorStats[]>([]);
const activeMappings = ref<MappingInfo[]>([]);
const activeLoading = ref(false);
const mappingDraft = ref<MappingInfo>({
  protocol: "KAFKA",
  topic: "",
  pipelineId: "",
});

const displayClients = computed(() => {
  if (showAllClients.value) return clients.value;
  return clients.value.slice(0, 5);
});

const statsCards = computed(() => [
  {
    label: "客户端总数",
    value: clients.value.length,
    icon: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z",
    color: "#38bdf8",
  },
  {
    label: "在线",
    value: clients.value.filter((c) => c.status === "ONLINE").length,
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    color: "#22c55e",
  },
  {
    label: "主动采集器",
    value: activeCollectors.value.length,
    icon: "M13 2L3 14h7l-1 8 10-12h-7l1-8z",
    color: "#f59e0b",
  },
  {
    label: "主动映射",
    value: activeMappings.value.length,
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4-4v2",
    color: "#6366f1",
  },
]);

function formatTime(ts: number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return Math.floor(diff / 60000) + " 分钟前";
  return d.toLocaleString("zh-CN", { hour12: false });
}

const collectorTags = (client: CollectorClientInfo): string[] => {
  return [...new Set([...(client.tags || []), ...(client.topics || [])].filter(Boolean))];
};
const normalizeStrings = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean);
  return [];
};

const loadClients = async () => {
  loading.value = true;
  try {
    const res = await fetchCollectorList();
    clients.value = (res as any)?.data || [];
  } catch {
    ElMessage.error("加载采集器客户端失败");
  } finally {
    loading.value = false;
  }
};

const loadActiveCollectors = async () => {
  activeLoading.value = true;
  try {
    const res = await fetchActiveCollectorStats();
    const payload = (res as any)?.data || res;
    activeCollectors.value = Array.isArray(payload?.activeCollectors) ? payload.activeCollectors : [];
    activeMappings.value = Array.isArray(payload?.mappings) ? payload.mappings : [];
  } catch {
    ElMessage.error("加载主动采集器失败");
  } finally {
    activeLoading.value = false;
  }
};

const handleAddMapping = async () => {
  const data = {
    protocol: mappingDraft.value.protocol.trim(),
    topic: mappingDraft.value.topic.trim(),
    pipelineId: mappingDraft.value.pipelineId.trim(),
  };
  if (!data.protocol || !data.topic || !data.pipelineId) {
    ElMessage.warning("请填写完整映射信息");
    return;
  }
  activeLoading.value = true;
  try {
    await registerMapping(data);
    ElMessage.success("映射注册成功");
    mappingDraft.value.topic = "";
    mappingDraft.value.pipelineId = "";
    await loadActiveCollectors();
  } catch (e: any) {
    ElMessage.error(e?.msg || "映射注册失败");
  } finally {
    activeLoading.value = false;
  }
};

const handleRemoveMapping = async (item: MappingInfo) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${item.protocol}:${item.topic} 映射？`, "确认删除", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
    await unregisterMapping({ protocol: item.protocol, topic: item.topic });
    ElMessage.success("映射已删除");
    await loadActiveCollectors();
  } catch { /* cancel */ }
};

onMounted(() => {
  loadClients();
  loadActiveCollectors();
});
</script>

<style scoped>
.collector-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  animation: fadeIn 0.35s ease;
  font-family: "Space Mono", "Courier New", monospace;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

/* ===== 指标卡片（与 bigscreen 一致） ===== */
.page-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.metric-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: var(--dl-surface, rgba(12, 22, 44, 0.85));
  backdrop-filter: blur(4px);
  border: 1px solid var(--dl-border, rgba(0, 180, 255, 0.08));
  border-radius: 8px;
  border-left: 3px solid var(--accent, #38bdf8);
  transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
}
.metric-card:hover {
  border-color: var(--accent, #38bdf8);
  box-shadow: 0 0 24px color-mix(in srgb, var(--accent, #38bdf8) 15%, transparent);
  transform: translateY(-1px);
}
.metric-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent, #38bdf8) 12%, transparent);
  flex-shrink: 0;
}
.metric-body { flex: 1; min-width: 0; }
.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #e2e8f0;
  line-height: 1.2;
  font-family: "Space Mono", "Courier New", monospace;
}
.metric-label {
  font-size: 10px;
  color: rgba(148, 163, 184, 0.7);
  margin-top: 2px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ===== 面板（与 bigscreen chart-panel 一致） ===== */
.page-panel {
  background: var(--dl-surface, rgba(12, 22, 44, 0.85));
  backdrop-filter: blur(4px);
  border: 1px solid var(--dl-border, rgba(0, 180, 255, 0.08));
  border-radius: 8px;
  overflow: hidden;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.06);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.03em;
}
.panel-badge {
  font-size: 10px;
  color: #5a6478;
  background: rgba(0, 180, 255, 0.06);
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 10px;
  padding: 0 8px;
  font-family: "Space Mono", monospace;
}

/* ===== 幽灵按钮 ===== */
.btn-ghost {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(56, 189, 248, 0.22);
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 11px;
  color: #dbeafe;
  cursor: pointer;
  font-family: "Space Mono", monospace;
  transition: all 0.2s;
}
.btn-ghost:hover {
  border-color: rgba(56, 189, 248, 0.45);
  color: #f8fafc;
  background: rgba(56, 189, 248, 0.1);
}
.btn-ghost:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.btn-ghost.loading svg {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== 客户端网格 ===== */
.client-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 14px 16px;
  min-height: 0;
  max-height: 480px;
  overflow: hidden;
  transition: max-height 0.3s ease;
}
.client-grid:not(.has-overflow) {
  max-height: none;
}
.client-card {
  background: rgba(0, 180, 255, 0.03);
  border: 1px solid rgba(0, 180, 255, 0.06);
  border-radius: 8px;
  padding: 14px;
  min-height: 0;
  transition: all 0.3s;
}
.client-card.online {
  border-color: rgba(34, 197, 94, 0.15);
}
.client-card:hover {
  border-color: rgba(0, 180, 255, 0.2);
  box-shadow: 0 0 20px rgba(0, 180, 255, 0.08);
}

.cli-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.cli-id-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}
.cli-id {
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
  font-family: "Space Mono", monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cli-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
}
.cli-pulse.on {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
}
.cli-status {
  font-size: 9px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  font-family: "Space Mono", monospace;
  flex-shrink: 0;
  margin-left: 8px;
}
.cli-status.online {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
}
.cli-status.offline {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

/* ===== 元数据 ===== */
.cli-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid rgba(0, 180, 255, 0.04);
  margin-bottom: 8px;
}
.cli-meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
}
.cli-meta-label {
  color: #5a6478;
}
.cli-meta-value {
  color: #94a3b8;
  font-family: "Space Mono", monospace;
  font-size: 10px;
}
.cli-meta-value.pipeline {
  color: #6366f1;
}

/* ===== 注册 Tags ===== */
.cli-tags-block {
  border-top: 1px solid rgba(0, 180, 255, 0.04);
  padding-top: 8px;
}
.cli-tags-label {
  display: block;
  margin-bottom: 5px;
  font-size: 10px;
  color: #5a6478;
}
.cli-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.tag-chip {
  font-size: 9px;
  padding: 2px 8px;
  border-radius: 3px;
  white-space: nowrap;
  background: rgba(0, 180, 255, 0.08);
  color: #38bdf8;
}
.cli-topics-empty {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.15);
  border-top: 1px solid rgba(0, 180, 255, 0.04);
  padding-top: 8px;
}
.client-empty {
  text-align: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.15);
  padding: 40px 0;
}
.client-empty.compact {
  padding: 16px 0;
}

/* ===== 查看全部 ===== */
.client-expand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-top: 1px solid rgba(0, 180, 255, 0.06);
  font-size: 12px;
  color: #38bdf8;
  cursor: pointer;
  transition: background 0.2s;
}
.client-expand:hover {
  background: rgba(0, 180, 255, 0.04);
}
.client-expand svg {
  transition: transform 0.25s;
}
.client-expand svg.rotated {
  transform: rotate(180deg);
}

/* ===== 主动采集器 ===== */
.active-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 14px 16px 10px;
}
.active-card {
  min-height: 132px;
  background: rgba(245, 158, 11, 0.03);
  border: 1px solid rgba(245, 158, 11, 0.08);
  border-radius: 8px;
  padding: 14px;
  transition: border-color 0.25s, box-shadow 0.25s;
}
.active-card.online {
  border-color: rgba(34, 197, 94, 0.16);
}
.active-card:hover {
  border-color: rgba(245, 158, 11, 0.24);
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.08);
}
.active-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.active-protocol {
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
  font-family: "Space Mono", monospace;
}

/* ===== 主动映射 ===== */
.mapping-section {
  padding: 0 16px 16px;
}
.mapping-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
}
.mapping-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}
.mapping-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) minmax(0, 1fr) 72px;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 6px 8px;
  border: 1px solid rgba(56, 189, 248, 0.08);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.16);
  font-size: 11px;
}
.mapping-protocol {
  color: #f59e0b;
  font-weight: 700;
}
.mapping-topic,
.mapping-pipeline {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #dbeafe;
}
.mapping-pipeline {
  color: #a5b4fc;
}
.mapping-form {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) minmax(0, 1fr) 76px;
  gap: 8px;
  align-items: center;
}
.form-input {
  width: 100%;
  min-height: 32px;
  box-sizing: border-box;
  border: 1px solid rgba(56, 189, 248, 0.14);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.26);
  color: #e2e8f0;
  padding: 0 10px;
  font-size: 11px;
  font-family: "Space Mono", monospace;
  outline: none;
}
.form-input:focus {
  border-color: rgba(56, 189, 248, 0.36);
}
.select-input {
  appearance: none;
}
.btn-mini {
  min-height: 28px;
  border: 1px solid rgba(56, 189, 248, 0.16);
  border-radius: 5px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 10px;
  font-family: "Space Mono", monospace;
}
.btn-mini.danger {
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.22);
}
.btn-mini.danger:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.4);
}

@media (max-width: 1024px) {
  .page-metrics { grid-template-columns: repeat(2, 1fr); }
  .client-grid { grid-template-columns: repeat(2, 1fr); }
  .active-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .page-metrics { grid-template-columns: repeat(2, 1fr); }
  .client-grid { grid-template-columns: 1fr; }
  .active-grid { grid-template-columns: 1fr; }
  .mapping-row,
  .mapping-form {
    grid-template-columns: 1fr;
  }
}
</style>
