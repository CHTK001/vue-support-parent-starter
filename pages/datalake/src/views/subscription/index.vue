<template>
  <div class="subscription-page">
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

    <DatalakePanel
      class="client-panel"
      title="注册客户端"
      tech-theme="A2"
      icon-path="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
    >
      <template #badge>
        <span class="panel-badge">{{ clientGroups.length }}</span>
      </template>
      <template #actions>
        <button class="btn-ghost" :class="{ loading }" type="button" :disabled="loading" @click="loadAll">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          刷新
        </button>
      </template>

      <div v-if="clientGroups.length" class="group-grid">
        <button
          v-for="group in clientGroups"
          :key="group.protocol"
          class="client-group-card"
          type="button"
          :style="{ '--accent': protocolColor(group.protocol) }"
          @click="openGroup(group)"
        >
          <div class="group-top">
            <div class="group-title">
              <span class="protocol-dot" />
              <span>{{ protocolName(group.protocol) }}</span>
            </div>
            <span class="group-count">{{ group.clients.length }}</span>
          </div>
          <div class="group-desc">{{ protocolDesc(group.protocol) }}</div>
          <div class="group-preview">
            <div v-for="client in group.clients.slice(0, 5)" :key="client.key" class="client-preview-row">
              <span class="client-id">{{ client.id }}</span>
              <span class="client-ip">{{ client.info.clientIp || client.info.sourceIp || '-' }}</span>
            </div>
            <div v-if="group.clients.length > 5" class="client-more">+{{ group.clients.length - 5 }} more</div>
          </div>
          <div class="group-foot">
            <span>{{ group.callbackCount }} webhook</span>
            <span>{{ group.pendingTotal }} pending</span>
          </div>
        </button>
      </div>

      <div v-else class="empty-state">
        <div class="empty-title">暂无注册客户端</div>
        <div class="empty-sub">下游订阅器通过 SDK/API 注册后会显示在这里</div>
      </div>
    </DatalakePanel>

    <el-dialog v-model="detailVisible" class="subscriber-dialog" width="880px" append-to-body>
      <template #header>
        <div class="dialog-title">
          <span class="protocol-dot" :style="{ '--accent': selectedGroup ? protocolColor(selectedGroup.protocol) : '#38bdf8' }" />
          <span>{{ selectedGroup ? protocolName(selectedGroup.protocol) : '' }} 注册客户端</span>
        </div>
      </template>

      <div v-if="selectedGroup" class="detail-list">
        <div v-for="client in selectedGroup.clients" :key="client.key" class="detail-row">
          <div class="detail-main">
            <div class="detail-id">{{ client.id }}</div>
            <div class="detail-tags">
              <span v-for="tag in clientTags(client)" :key="tag" class="topic-tag-sm">{{ tag }}</span>
              <span v-if="!clientTags(client).length" class="topic-tag-sm muted">全部主题</span>
            </div>
          </div>
          <div class="detail-grid">
            <div><span>clientIp</span><strong>{{ client.info.clientIp || client.info.sourceIp || '-' }}</strong></div>
            <div><span>pipelineId</span><strong>{{ client.info.pipelineId || '全部管线' }}</strong></div>
            <div><span>pending</span><strong>{{ client.info.pending }}</strong></div>
            <div><span>endpoint</span><strong>{{ client.info.endpoint || '-' }}</strong></div>
            <div class="wide"><span>callbackUrl</span><strong>{{ client.info.callbackUrl || '-' }}</strong></div>
            <div class="wide"><span>userAgent</span><strong>{{ client.info.userAgent || '-' }}</strong></div>
            <div><span>registeredAt</span><strong>{{ formatTime(client.info.registeredAt) }}</strong></div>
            <div><span>lastSeenAt</span><strong>{{ formatTime(client.info.lastSeenAt) }}</strong></div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import DatalakePanel from "../../components/DatalakePanel.vue";
import {
  fetchSubscriberClients,
  type SubscriberClientMap,
} from "../../api/subscriber";

defineOptions({ name: "DatalakeSubscriptionPage" });

type ClientEntry = {
  key: string;
  id: string;
  protocol: string;
  info: {
    pipelineId: string;
    topics: string[];
    tags: string[];
    pending: number;
    callbackUrl: string;
    filter: Record<string, any>;
    clientIp: string;
    sourceIp: string;
    userAgent: string;
    endpoint: string;
    registeredAt: number;
    lastSeenAt: number;
  };
};

type ClientGroup = {
  protocol: string;
  clients: ClientEntry[];
  callbackCount: number;
  pendingTotal: number;
};

const clientData = ref<SubscriberClientMap>({});
const loading = ref(false);
const detailVisible = ref(false);
const selectedGroup = ref<ClientGroup | null>(null);

const allClients = computed(() =>
  Object.entries(clientData.value)
    .flatMap(([protocol, data]) => clientEntriesFrom(protocol, data))
    .filter((client) => !isHiddenTestClient(client.id)),
);

const clientGroups = computed<ClientGroup[]>(() => {
  const groups = new Map<string, ClientEntry[]>();
  for (const client of allClients.value) {
    const protocol = normalizeProtocol(client.protocol);
    groups.set(protocol, [...(groups.get(protocol) || []), client]);
  }
  return Array.from(groups.entries())
    .map(([protocol, clients]) => ({
      protocol,
      clients: clients.sort((a, b) => (b.info.lastSeenAt || 0) - (a.info.lastSeenAt || 0)),
      callbackCount: clients.filter((client) => hasText(client.info.callbackUrl)).length,
      pendingTotal: clients.reduce((sum, client) => sum + client.info.pending, 0),
    }))
    .sort((a, b) => a.protocol.localeCompare(b.protocol));
});

const statsCards = computed(() => [
  {
    label: "注册客户端",
    value: allClients.value.length,
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4-4v2",
    color: "#38bdf8",
  },
  {
    label: "接入协议",
    value: clientGroups.value.length,
    icon: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z",
    color: "#22c55e",
  },
  {
    label: "Webhook 下发",
    value: allClients.value.filter((client) => hasText(client.info.callbackUrl) || client.protocol === "WEBHOOK").length,
    icon: "M22 12h-4l-3 9L9 3l-3 9H2",
    color: "#f59e0b",
  },
  {
    label: "待消费",
    value: allClients.value.reduce((sum, client) => sum + client.info.pending, 0),
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    color: "#6366f1",
  },
]);

function hasText(value: string | null | undefined): boolean {
  return !!value && value.trim().length > 0;
}

function normalizeProtocol(value: string): string {
  return String(value || "UNKNOWN").trim().toUpperCase();
}

function isHiddenTestClient(id: string): boolean {
  const normalized = id.trim().toLowerCase();
  return normalized === "web-console" || normalized.startsWith("callback-");
}

function normalizeStrings(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizeFilter(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return { ...(value as Record<string, any>) };
}

function normalizeClientInfo(raw: any): ClientEntry["info"] {
  const info = raw && typeof raw === "object" ? raw : {};
  const filter = normalizeFilter(info.filter);
  const callbackUrl = String(info.callbackUrl || info.callback || filter.callbackUrl || "").trim();
  if (callbackUrl) {
    delete filter.callbackUrl;
    delete filter.callback;
    delete filter.callback_url;
  }
  return {
    pipelineId: String(info.pipelineId || "").trim(),
    topics: normalizeStrings(info.topics),
    tags: normalizeStrings(info.tags),
    pending: Number(info.pending || 0),
    callbackUrl,
    filter,
    clientIp: String(info.clientIp || "").trim(),
    sourceIp: String(info.sourceIp || "").trim(),
    userAgent: String(info.userAgent || "").trim(),
    endpoint: String(info.endpoint || "").trim(),
    registeredAt: Number(info.registeredAt || 0),
    lastSeenAt: Number(info.lastSeenAt || 0),
  };
}

function clientEntriesFrom(protocol: string, data: unknown): ClientEntry[] {
  if (!data) {
    return [];
  }
  if (Array.isArray(data)) {
    return data.map((item, index) => normalizeClientEntry(protocol, String((item as any)?.clientId || (item as any)?.id || index), item));
  }
  if (typeof data === "object") {
    return Object.entries(data as Record<string, any>).map(([id, info]) => normalizeClientEntry(protocol, id, info));
  }
  return [];
}

function normalizeClientEntry(protocol: string, id: string, raw: any): ClientEntry {
  const info = normalizeClientInfo(raw);
  const actualProtocol = normalizeProtocol(raw?.protocol || protocol);
  return {
    key: `${actualProtocol}:${id}`,
    id: String(raw?.clientId || id),
    protocol: actualProtocol,
    info,
  };
}

function filterEntries(filter: Record<string, any>): string[] {
  return Object.entries(filter || {})
    .filter(([key, value]) => hasText(key) && value !== null && value !== undefined && value !== "")
    .map(([key, value]) => `${key}:${String(value)}`);
}

function clientTags(client: ClientEntry): string[] {
  return [...new Set([...client.info.topics, ...client.info.tags, ...filterEntries(client.info.filter)].filter(Boolean))];
}

function protocolColor(proto: string): string {
  const map: Record<string, string> = {
    HTTP: "#38bdf8",
    MQ: "#22c55e",
    TCP: "#06b6d4",
    KAFKA: "#f59e0b",
    MQTT: "#8b5cf6",
    ACTIVEMQ: "#10b981",
    WEBHOOK: "#ec4899",
  };
  return map[normalizeProtocol(proto)] || "#94a3b8";
}

function protocolName(proto: string): string {
  return `${normalizeProtocol(proto)} 客户端`;
}

function protocolDesc(proto: string): string {
  const map: Record<string, string> = {
    HTTP: "HTTP 长轮询注册客户端",
    MQ: "简易 MQ 订阅客户端",
    TCP: "TCP 长连接订阅客户端",
    KAFKA: "Kafka 下游订阅客户端",
    MQTT: "MQTT 下游订阅客户端",
    ACTIVEMQ: "ActiveMQ 下游订阅客户端",
    WEBHOOK: "Webhook 回调下发客户端",
  };
  return map[normalizeProtocol(proto)] || "下游订阅客户端";
}

function normalizeClientMap(response: any): SubscriberClientMap {
  const data = response?.data ?? response;
  return data && typeof data === "object" ? data : {};
}

function openGroup(group: ClientGroup): void {
  selectedGroup.value = group;
  detailVisible.value = true;
}

function formatTime(value: number): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

async function loadAll(): Promise<void> {
  loading.value = true;
  try {
    clientData.value = normalizeClientMap(await fetchSubscriberClients());
  } catch {
    clientData.value = {};
    ElMessage.error("加载订阅客户端失败");
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadAll();
});
</script>

<style scoped>
.subscription-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeIn 0.35s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 70px;
  padding: 14px;
  background: rgba(5, 10, 22, 0.72);
  border: 1px solid rgba(0, 246, 255, 0.12);
  border-left: 3px solid var(--accent, #38bdf8);
  border-radius: 8px;
}

.metric-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent, #38bdf8) 14%, transparent);
  flex-shrink: 0;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #e2e8f0;
  line-height: 1.2;
}

.metric-label {
  font-size: 10px;
  color: rgba(148, 163, 184, 0.72);
  margin-top: 2px;
}

.client-panel {
  min-height: 0;
}

.panel-badge {
  font-size: 10px;
  color: #93f4ff;
  background: rgba(0, 246, 255, 0.08);
  border: 1px solid rgba(0, 246, 255, 0.18);
  border-radius: 10px;
  padding: 0 8px;
  white-space: nowrap;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 11px;
  cursor: pointer;
  background: transparent;
  border: 1px solid rgba(0, 246, 255, 0.16);
  color: #94a3b8;
  transition: all 0.2s;
}

.btn-ghost:hover:not(:disabled) {
  border-color: rgba(0, 246, 255, 0.34);
  color: #38bdf8;
}

.btn-ghost:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-ghost.loading svg {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 14px 16px;
}

.client-group-card {
  height: 260px;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 10px;
  padding: 14px;
  text-align: left;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--accent, #38bdf8) 26%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent, #38bdf8) 8%, transparent), rgba(0, 0, 0, 0.18)),
    rgba(5, 10, 22, 0.58);
  color: inherit;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}

.client-group-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--accent, #38bdf8) 58%, transparent);
  box-shadow: 0 0 24px color-mix(in srgb, var(--accent, #38bdf8) 16%, transparent);
}

.group-top,
.group-foot,
.client-preview-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 15px;
  font-weight: 700;
  color: #e2e8f0;
}

.protocol-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent, #38bdf8);
  box-shadow: 0 0 10px var(--accent, #38bdf8);
  flex-shrink: 0;
}

.group-count {
  min-width: 34px;
  text-align: center;
  color: var(--accent, #38bdf8);
  border: 1px solid color-mix(in srgb, var(--accent, #38bdf8) 24%, transparent);
  border-radius: 999px;
  padding: 2px 8px;
  font-family: "JetBrains Mono", "Consolas", monospace;
}

.group-desc {
  color: #64748b;
  font-size: 11px;
}

.group-preview {
  min-height: 0;
  display: grid;
  grid-auto-rows: 28px;
  gap: 6px;
}

.client-preview-row {
  min-width: 0;
  padding: 0 9px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(0, 246, 255, 0.06);
}

.client-id,
.client-ip {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: "JetBrains Mono", "Consolas", monospace;
  font-size: 10px;
}

.client-id {
  color: #e2e8f0;
}

.client-ip {
  color: #38bdf8;
  flex-shrink: 0;
  max-width: 120px;
}

.client-more {
  color: #94a3b8;
  font-size: 10px;
  padding-left: 9px;
}

.group-foot {
  padding-top: 10px;
  border-top: 1px solid rgba(0, 246, 255, 0.08);
  color: #94a3b8;
  font-size: 10px;
  font-family: "JetBrains Mono", "Consolas", monospace;
}

.empty-state {
  height: 260px;
  display: grid;
  place-content: center;
  text-align: center;
  color: #64748b;
}

.empty-title {
  color: #cbd5e1;
  font-size: 15px;
  margin-bottom: 6px;
}

.empty-sub {
  font-size: 12px;
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e2e8f0;
  font-weight: 700;
}

.detail-list {
  display: grid;
  gap: 10px;
  max-height: 64vh;
  overflow: auto;
  padding-right: 4px;
}

.detail-row {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(5, 10, 22, 0.72);
  border: 1px solid rgba(0, 246, 255, 0.12);
}

.detail-main {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.detail-id {
  color: #e2e8f0;
  font-family: "JetBrains Mono", "Consolas", monospace;
  font-weight: 700;
  word-break: break-all;
}

.detail-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.detail-grid > div {
  min-width: 0;
  display: grid;
  gap: 3px;
  padding: 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.18);
}

.detail-grid .wide {
  grid-column: span 2;
}

.detail-grid span {
  color: #64748b;
  font-size: 10px;
}

.detail-grid strong {
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 500;
  word-break: break-all;
}

.topic-tag-sm {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(0, 180, 255, 0.08);
  color: #38bdf8;
  white-space: nowrap;
}

.topic-tag-sm.muted {
  background: rgba(148, 163, 184, 0.08);
  color: #94a3b8;
}

@media (max-width: 1120px) {
  .group-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .page-metrics,
  .group-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .detail-grid .wide {
    grid-column: span 1;
  }
  .detail-main {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
