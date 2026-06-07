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

      <div class="client-grid">
        <div v-for="c in clients" :key="c.clientId" class="client-card" :class="{ online: c.status === 'ONLINE' }">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { fetchCollectorList, type CollectorClientInfo } from "../../api/collector";

defineOptions({ name: "DatalakeCollectorPage" });

const clients = ref<CollectorClientInfo[]>([]);
const loading = ref(false);

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
    label: "离线",
    value: clients.value.filter((c) => c.status !== "ONLINE").length,
    icon: "M6 18L18 6M6 6l12 12",
    color: "#ef4444",
  },
  {
    label: "管线数",
    value: new Set(clients.value.filter((c) => c.pipelineId).map((c) => c.pipelineId)).size,
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

onMounted(loadClients);
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

@media (max-width: 1024px) {
  .page-metrics { grid-template-columns: repeat(2, 1fr); }
  .client-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .page-metrics { grid-template-columns: repeat(2, 1fr); }
  .client-grid { grid-template-columns: 1fr; }
}
</style>
