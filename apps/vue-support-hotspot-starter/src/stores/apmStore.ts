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
import { getStats, getAlerts } from "../api/apmApi";
import type { ApmStats, ApmAlert } from "../api/apmApi";

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
  const activeAlertCount = computed(
    () => alerts.value.filter((a) => a.status === "OPEN").length,
  );
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
    try {
      const s = await getStats();
      stats.value = s;
      agentActive.value = s.agentActive;
      agentEnabled.value = s.agentEnabled;
    } catch {
      agentActive.value = false;
    }
    try {
      alerts.value = (await getAlerts(100)) || [];
    } catch {
      alerts.value = [];
    }
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
    stats,
    alerts,
    activeAlertCount,
    criticalAlertCount,
    healthType,
    savedFilters,
    notificationChannels,
    // 方法
    pollStatus,
    saveFilter,
    deleteSavedFilter,
    saveNotificationChannel,
    getCached,
    setCached,
  };
});
