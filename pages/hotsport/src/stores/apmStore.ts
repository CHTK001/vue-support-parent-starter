/**
 * apmStore.ts —— Hotsport APM 全局状态（Pinia）
 *
 * 共享状态层：Agent 状态、告警计数、筛选条件缓存、请求去重。
 * 各视图不再各自拉数据，统一从 store 取。
 *
 * @since 4.1.0
 */
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getStats, getAlerts, getHealth, getAgentConfig } from "../api/apmApi";
import type { ApmStats, ApmAlert, ApmHealth, AgentConfig } from "../api/apmApi";

/** 全局筛选条件缓存 */
export interface SavedFilter {
  id: string;
  name: string;
  view: string;
  filters: Record<string, unknown>;
  createdAt: number;
}

/** 通知渠道 */
export interface NotificationChannel {
  id: string;
  type: "email" | "dingtalk" | "feishu" | "webhook";
  name: string;
  enabled: boolean;
  config: Record<string, string>;
}

export const useApmStore = defineStore("apm", () => {
  /* ---- Agent 状态 ---- */
  const agentActive = ref(false);
  const agentEnabled = ref(false);

  /* ---- Agent 配置（后端不可用时保持 null，页面降级展示） ---- */
  const agentConfig = ref<AgentConfig | null>(null);
  const agentConfigLoading = ref(false);

  /* ---- 健康状态详情 ---- */
  const health = ref<ApmHealth | null>(null);

  /** 最近一次 stats 轮询延迟（ms），用于 Agent 状态监控 */
  const lastLatencyMs = ref(0);

  /* ---- 实时统计快照 ---- */
  const stats = ref<ApmStats>({
    agentActive: false,
    agentEnabled: false,
    transmissionCount: 0,
    leakCount: 0,
    errorCount: 0,
    traceCount: 0,
    dependencyCount: 0,
  });

  /* ---- 告警 ---- */
  const alerts = ref<ApmAlert[]>([]);
  /**
   * 侧栏红点：未处置告警数。
   *
   * <p>优先用 SSE 帧里的 {@code openAlertCount}——那是后端的全量计数。
   * {@code alerts} 本身只装最近几条，用它 filter 会少算，仅作为推送里没有该字段时的兜底。</p>
   */
  const activeAlertCount = computed(() => {
    const exact = stats.value.openAlertCount;
    if (typeof exact === "number") {
      return exact;
    }
    return alerts.value.filter((a) => a.status === "OPEN").length;
  });
  const criticalAlertCount = computed(
    () => alerts.value.filter((a) => a.severity === "CRITICAL" && a.status === "OPEN").length,
  );

  /* ---- 健康状态 ---- */
  const healthType = computed<"" | "success" | "warning" | "danger">(() => {
    switch (stats.value.health) {
      case "HEALTHY": return "success";
      case "DEGRADED": return "warning";
      case "SATURATED": return "danger";
      default: return "";
    }
  });

  /* ---- 筛选条件缓存 ---- */
  const savedFilters = ref<SavedFilter[]>([]);

  function saveFilter(filter: SavedFilter) {
    const idx = savedFilters.value.findIndex((f) => f.id === filter.id);
    if (idx >= 0) {
      savedFilters.value[idx] = filter;
    } else {
      savedFilters.value.push(filter);
    }
    try {
      localStorage.setItem("apm-saved-filters", JSON.stringify(savedFilters.value));
    } catch { /* 忽略存储异常 */ }
  }

  function loadSavedFilters() {
    try {
      const raw = localStorage.getItem("apm-saved-filters");
      if (raw) savedFilters.value = JSON.parse(raw);
    } catch { /* 忽略解析异常 */ }
  }

  function deleteSavedFilter(id: string) {
    savedFilters.value = savedFilters.value.filter((f) => f.id !== id);
    try {
      localStorage.setItem("apm-saved-filters", JSON.stringify(savedFilters.value));
    } catch { /* 忽略存储异常 */ }
  }

  /* ---- 通知渠道 ---- */
  const notificationChannels = ref<NotificationChannel[]>([]);

  function saveNotificationChannel(ch: NotificationChannel) {
    const idx = notificationChannels.value.findIndex((c) => c.id === ch.id);
    if (idx >= 0) {
      notificationChannels.value[idx] = ch;
    } else {
      notificationChannels.value.push(ch);
    }
    try {
      localStorage.setItem("apm-notification-channels", JSON.stringify(notificationChannels.value));
    } catch { /* 忽略存储异常 */ }
  }

  function loadNotificationChannels() {
    try {
      const raw = localStorage.getItem("apm-notification-channels");
      if (raw) notificationChannels.value = JSON.parse(raw);
    } catch { /* 忽略解析异常 */ }
  }

  /* ---- 请求去重缓存（5s TTL） ---- */
  const requestCache = new Map<string, { promise: Promise<unknown>; expire: number }>();

  function getCached<T>(key: string): Promise<T> | null {
    const entry = requestCache.get(key);
    if (!entry || entry.expire < Date.now()) return null;
    return entry.promise as Promise<T>;
  }

  function setCached<T>(key: string, promise: Promise<T>, ttlMs = 5000) {
    requestCache.set(key, { promise: promise as Promise<unknown>, expire: Date.now() + ttlMs });
  }

  /** 缓存清理（定时清理过期条目） */
  function cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of requestCache.entries()) {
      if (entry.expire < now) requestCache.delete(key);
    }
  }

  /* ---- 数据拉取 ---- */
  async function pollStatus() {
    const startedAt = Date.now();
    try {
      const s = await getStats();
      stats.value = s;
      agentActive.value = s.agentActive;
      agentEnabled.value = s.agentEnabled;
      lastLatencyMs.value = Date.now() - startedAt;
    } catch {
      agentActive.value = false;
      lastLatencyMs.value = -1;
    }
    try {
      alerts.value = (await getAlerts(100)) || [];
    } catch {
      alerts.value = [];
    }
  }

  /**
   * 应用实时通道推送的 stats 快照 —— 不发任何 HTTP 请求。
   *
   * <p>整站只有一条 WS/SSE 通道，帧里已带齐 stats + health + recentAlerts +
   * openAlertCount。壳层收到帧只需赋值；若在回调里再调 {@link pollStatus}，
   * 就等于把推送退化成了每帧一次的轮询（/stats + /alerts 各一发）。</p>
   *
   * <p>WebSocket 建连成功时总线会发一条 {@code { connected: true }}，那不是快照，
   * 这里按「必须含 stats 字段」识别并忽略。</p>
   *
   * @param snapshot 帧内 data
   */
  function applySnapshot(snapshot: Partial<ApmStats> | null | undefined) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }
    if (typeof snapshot.agentActive !== "boolean" && typeof snapshot.transmissionCount !== "number") {
      return;
    }
    stats.value = snapshot as ApmStats;
    agentActive.value = !!snapshot.agentActive;
    agentEnabled.value = !!snapshot.agentEnabled;
    if (Array.isArray(snapshot.recentAlerts)) {
      alerts.value = snapshot.recentAlerts;
    }
  }

  /** 拉取健康状态（不参与主轮询，页面进入时手动调用） */
  async function loadHealth() {
    try {
      health.value = await getHealth();
    } catch {
      health.value = null;
    }
    return health.value;
  }

  /** 拉取 Agent 配置；后端 404 时返回 null 并保持前端无错误提示（契约就绪） */
  async function loadAgentConfig() {
    agentConfigLoading.value = true;
    try {
      agentConfig.value = await getAgentConfig();
    } catch {
      agentConfig.value = null;
    } finally {
      agentConfigLoading.value = false;
    }
    return agentConfig.value;
  }

  /* ---- 初始化 ---- */
  loadSavedFilters();
  loadNotificationChannels();
  // 每 60s 清理一次过期缓存条目
  setInterval(cleanupCache, 60000);

  return {
    // 状态
    agentActive,
    agentEnabled,
    agentConfig,
    agentConfigLoading,
    health,
    lastLatencyMs,
    stats,
    alerts,
    activeAlertCount,
    criticalAlertCount,
    healthType,
    savedFilters,
    notificationChannels,
    // 方法
    pollStatus,
    applySnapshot,
    loadHealth,
    loadAgentConfig,
    saveFilter,
    deleteSavedFilter,
    saveNotificationChannel,
    getCached,
    setCached,
  };
});
