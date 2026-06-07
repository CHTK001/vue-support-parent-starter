<template>
  <div class="subscription-page">
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

    <!-- 订阅器实例 -->
    <div class="page-panel">
      <div class="panel-header">
        <div class="panel-title">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="1.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <span>订阅器实例</span>
          <span class="panel-badge">{{ subscribers.length }}</span>
        </div>
        <button class="btn-ghost" :class="{ loading }" @click="loadAll" :disabled="loading">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          刷新
        </button>
      </div>

      <div class="subscriber-grid">
        <div v-for="s in subscribers" :key="s.protocol" class="subscriber-card" :class="{ running: s.running }">
          <!-- 卡片头部 -->
          <div class="sub-top">
            <div class="sub-protocol-row">
              <span class="sub-protocol" :style="{ color: protocolColor(s.protocol) }">{{ subscriberName(s) }}</span>
              <span class="sub-port">{{ s.protocol }} :{{ s.port }}</span>
              <span class="sub-pulse" :class="{ on: s.running }" />
            </div>
            <span class="sub-status" :class="s.running ? 'running' : 'stopped'">{{ s.running ? 'RUNNING' : 'STOPPED' }}</span>
          </div>
          <div class="sub-desc">{{ protocolDesc(s.protocol) }}</div>
          <div class="sub-tags-block" v-if="subscriberTags(s).length">
            <span class="sub-tags-label">注册 Tags</span>
            <div class="sub-tags">
              <span v-for="tag in subscriberTags(s)" :key="tag" class="topic-tag-sm">{{ tag }}</span>
            </div>
          </div>
          <div v-else class="sub-tags-empty">暂无注册 Tags</div>

          <!-- 客户端区域 -->
          <div class="sub-clients">
            <!-- HTTP 客户端 -->
            <template v-if="s.protocol === 'HTTP' && clientData[s.protocol]">
              <div v-for="(info, cid) in clientData[s.protocol]" :key="cid" class="client-row">
                <div class="client-id">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>{{ cid }}</span>
                </div>
                <div class="client-meta">
                  <span class="client-pipeline">{{ (info as any).pipelineId || '全部管线' }}</span>
                  <span v-if="(info as any).topics?.length" class="client-topics">
                    <span v-for="t in (info as any).topics" :key="t" class="topic-tag-sm">{{ t }}</span>
                  </span>
                </div>
                <div class="client-pending">
                  <span class="pending-dot" />{{ (info as any).pending }}
                </div>
              </div>
              <div v-if="Object.keys(clientData[s.protocol]).length === 0" class="client-empty">暂无客户端连接</div>
            </template>

            <!-- 非 HTTP 客户端 -->
            <template v-else-if="clientData[s.protocol]">
              <div class="client-tags">
                <span v-for="cid in clientData[s.protocol]" :key="cid" class="cid-tag">{{ cid }}</span>
              </div>
              <div v-if="(clientData[s.protocol] as any[]).length === 0" class="client-empty">暂无连接</div>
            </template>

            <div v-else class="client-empty">暂无连接数据</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { fetchSubscriberList, fetchSubscriberClients, type SubscriberInfo } from "../../api/subscriber";

defineOptions({ name: "DatalakeSubscriptionPage" });

const subscribers = ref<SubscriberInfo[]>([]);
const clientData = ref<Record<string, any>>({});
const loading = ref(false);

const statsCards = computed(() => [
  {
    label: "订阅器总数",
    value: subscribers.value.length,
    icon: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z",
    color: "#38bdf8",
  },
  {
    label: "运行中",
    value: subscribers.value.filter((s) => s.running).length,
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    color: "#22c55e",
  },
  {
    label: "活跃客户端",
    value: totalClients.value,
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4-4v2",
    color: "#6366f1",
  },
  {
    label: "待消费消息",
    value: totalPending.value,
    icon: "M22 12h-4l-3 9L9 3l-3 9H2",
    color: "#f59e0b",
  },
]);

const totalClients = computed(() => {
  let count = 0;
  for (const key of Object.keys(clientData.value)) {
    const val = clientData.value[key];
    if (Array.isArray(val)) count += val.length;
    else if (typeof val === "object") count += Object.keys(val).length;
  }
  return count;
});

const totalPending = computed(() => {
  let pending = 0;
  const d = clientData.value["HTTP"];
  if (d && typeof d === "object" && !Array.isArray(d)) {
    for (const v of Object.values(d)) pending += (v as any).pending || 0;
  }
  return pending;
});

function protocolColor(proto: string): string {
  const map: Record<string, string> = { HTTP: "#6366f1", MQ: "#22c55e", TCP: "#38bdf8" };
  return map[proto] || "#94a3b8";
}

function protocolDesc(proto: string): string {
  const map: Record<string, string> = {
    HTTP: "REST 长轮询 — 注册订阅并通过 HTTP API 轮询拉取数据",
    MQ: "MQ 消息队列 — 基于 TCP 的 PUB/SUB/POLL 简易消息队列",
    TCP: "TCP 长连接 — 服务端主动推送数据到已连接客户端",
  };
  return map[proto] || "";
}

const subscriberName = (subscriber: SubscriberInfo): string => {
  return (subscriber as any).name || (subscriber as any).label || `${subscriber.protocol} 订阅器`;
};

const subscriberTags = (subscriber: SubscriberInfo): string[] => {
  const fromSubscriber = [...(subscriber.tags || []), ...(subscriber.topics || [])];
  const protocolClients = clientData.value[subscriber.protocol];
  const fromClients: string[] = [];
  if (protocolClients && typeof protocolClients === "object") {
    const values = Array.isArray(protocolClients) ? protocolClients : Object.values(protocolClients);
    values.forEach((info: any) => {
      fromClients.push(...(info?.tags || []), ...(info?.topics || []));
    });
  }
  return [...new Set([...fromSubscriber, ...fromClients].filter(Boolean))];
};

const loadAll = async () => {
  loading.value = true;
  try {
    const [subRes, cliRes] = await Promise.all([fetchSubscriberList(), fetchSubscriberClients()]);
    const subscriberPayload = subRes?.data as any;
    const clientPayload = cliRes?.data as any;
    subscribers.value = Array.isArray(subscriberPayload) ? subscriberPayload : subscriberPayload?.data || [];
    clientData.value = clientPayload?.data || clientPayload || {};
  } catch {
    ElMessage.error("加载订阅器数据失败");
  } finally {
    loading.value = false;
  }
};

onMounted(loadAll);
</script>

<style scoped>
.subscription-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeIn 0.35s ease;
  font-family: "Space Mono", "Courier New", monospace;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

/* ===== 指标卡片 ===== */
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

/* ===== 面板 ===== */
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
  background: transparent;
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 11px;
  color: #94a3b8;
  cursor: pointer;
  font-family: "Space Mono", monospace;
  transition: all 0.2s;
}
.btn-ghost:hover {
  border-color: rgba(0, 180, 255, 0.25);
  color: #38bdf8;
}
.btn-ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-ghost.loading svg {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== 订阅器网格 ===== */
.subscriber-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 14px 16px;
}
.subscriber-card {
  background: rgba(0, 180, 255, 0.03);
  border: 1px solid rgba(0, 180, 255, 0.06);
  border-radius: 8px;
  padding: 14px;
  transition: all 0.3s;
}
.subscriber-card.running {
  border-color: rgba(34, 197, 94, 0.15);
}
.subscriber-card:hover {
  border-color: rgba(0, 180, 255, 0.2);
  box-shadow: 0 0 20px rgba(0, 180, 255, 0.08);
}

.sub-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.sub-protocol-row {
  display: flex;
  align-items: baseline;
  gap: 0;
}
.sub-protocol {
  font-size: 15px;
  font-weight: 700;
  font-family: "Space Mono", monospace;
}
.sub-port {
  font-size: 12px;
  color: #5a6478;
  font-family: "Space Mono", monospace;
}
.sub-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-left: 8px;
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
}
.sub-pulse.on {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
}
.sub-status {
  font-size: 9px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  font-family: "Space Mono", monospace;
  flex-shrink: 0;
  margin-left: 8px;
}
.sub-status.running {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
}
.sub-status.stopped {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}
.sub-desc {
  font-size: 11px;
  color: #5a6478;
  line-height: 1.5;
  margin-bottom: 10px;
}
.sub-tags-block {
  margin-bottom: 10px;
}
.sub-tags-label {
  display: block;
  margin-bottom: 5px;
  font-size: 10px;
  color: #5a6478;
}
.sub-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.sub-tags-empty {
  margin-bottom: 10px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.15);
}

/* ===== 客户端区域 ===== */
.sub-clients {
  border-top: 1px solid rgba(0, 180, 255, 0.04);
  padding-top: 10px;
}

.client-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
  margin-bottom: 5px;
  font-size: 11px;
}
.client-id {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #e2e8f0;
  font-family: "Space Mono", monospace;
  font-size: 10px;
  min-width: 80px;
}
.client-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.client-pipeline {
  color: #6366f1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}
.client-topics {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}
.topic-tag-sm {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(0, 180, 255, 0.08);
  color: #38bdf8;
  white-space: nowrap;
}
.client-pending {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #f59e0b;
  font-family: "Space Mono", monospace;
  font-size: 11px;
  font-weight: 600;
}
.pending-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #f59e0b;
}

.cid-tag {
  display: inline-block;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(0, 180, 255, 0.06);
  color: #94a3b8;
  margin: 0 4px 4px 0;
  font-family: "Space Mono", monospace;
}
.client-tags { padding: 4px 0; }
.client-empty {
  text-align: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.15);
  padding: 14px 0;
}

@media (max-width: 1024px) {
  .page-metrics { grid-template-columns: repeat(2, 1fr); }
  .subscriber-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .page-metrics { grid-template-columns: repeat(2, 1fr); }
  .subscriber-grid { grid-template-columns: 1fr; }
}
</style>
