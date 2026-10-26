/**
 * i18n.ts —— Hotsport APM 国际化（中英文切换）
 *
 * 使用简单方案：localStorage 存语言偏好，t() 函数翻译。
 * 无需完整 vue-i18n 迁移，不改现有 14 个视图的中文硬编码。
 *
 * 用法：
 *   import { t, currentLang, setLang } from "./i18n";
 *   {{ t("dashboard") }}  →  "总览看板" / "Dashboard"
 *
 * @since 4.1.0
 */
import { ref } from "vue";

export type Lang = "zh" | "en";

const STORAGE_KEY = "apm-lang";

/** 当前语言（默认中文） */
export const currentLang = ref<Lang>(
  (localStorage.getItem(STORAGE_KEY) as Lang) || "zh",
);

export function setLang(lang: Lang) {
  currentLang.value = lang;
  localStorage.setItem(STORAGE_KEY, lang);
}

// ===== 中文 =====

const zh: Record<string, string> = {
  // 导航
  nav_dashboard: "总览看板",
  nav_topology: "系统拓扑",
  nav_dependencies: "依赖拓扑",
  nav_traces: "调用链路",
  nav_endpoints: "端点分析",
  nav_services: "服务列表",
  nav_errors: "错误排行",
  nav_leaks: "资源泄漏",
  nav_jvm: "JVM 指标",
  nav_logs: "日志",
  nav_realtime_log: "实时日志",
  nav_alerts: "告警中心",
  // 通用
  action_refresh: "刷新",
  action_search: "查询",
  action_reset: "重置",
  action_export: "导出",
  action_save: "保存",
  action_delete: "删除",
  action_cancel: "取消",
  action_confirm: "确认",
  status_loading: "加载中…",
  status_noData: "暂无数据",
  status_success: "成功",
  status_fail: "失败",
  // 健康
  health_healthy: "系统健康",
  health_degraded: "性能降级",
  health_saturated: "资源饱和",
  health_unknown: "未知",
  agent_online: "Agent 已注入",
  agent_offline: "降级模式",
  // 统计
  stat_transmissions: "传输记录",
  stat_traces: "调用链路",
  stat_dependencies: "依赖关系",
  stat_leaks: "资源泄漏",
  stat_qps: "QPS",
  stat_errorRate: "错误率",
  stat_activeLeaks: "活跃泄漏",
  stat_availability: "可用率",
  // 状态等级
  level_ok: "正常",
  level_slow: "偏慢",
  level_warning: "警告",
  level_danger: "危险",
};

// ===== 英文 =====

const en: Record<string, string> = {
  // 导航
  nav_dashboard: "Dashboard",
  nav_topology: "System Topology",
  nav_dependencies: "Dependency Topology",
  nav_traces: "Traces",
  nav_endpoints: "Endpoint Analysis",
  nav_services: "Services",
  nav_errors: "Error Ranking",
  nav_leaks: "Resource Leaks",
  nav_jvm: "JVM Metrics",
  nav_logs: "Logs",
  nav_realtime_log: "Realtime Logs",
  nav_alerts: "Alerts",
  // 通用
  action_refresh: "Refresh",
  action_search: "Search",
  action_reset: "Reset",
  action_export: "Export",
  action_save: "Save",
  action_delete: "Delete",
  action_cancel: "Cancel",
  action_confirm: "Confirm",
  status_loading: "Loading…",
  status_noData: "No Data",
  status_success: "Success",
  status_fail: "Failed",
  // 健康
  health_healthy: "Healthy",
  health_degraded: "Degraded",
  health_saturated: "Saturated",
  health_unknown: "Unknown",
  agent_online: "Agent Online",
  agent_offline: "Degraded Mode",
  // 统计
  stat_transmissions: "Transmissions",
  stat_traces: "Traces",
  stat_dependencies: "Dependencies",
  stat_leaks: "Resource Leaks",
  stat_qps: "QPS",
  stat_errorRate: "Error Rate",
  stat_activeLeaks: "Active Leaks",
  stat_availability: "Availability",
  // 状态等级
  level_ok: "OK",
  level_slow: "Slow",
  level_warning: "Warning",
  level_danger: "Critical",
};

const dict: Record<Lang, Record<string, string>> = { zh, en };

/** 翻译函数 */
export function t(key: string): string {
  return dict[currentLang.value][key] ?? key;
}

/** 全量翻译对象（模板可一次解构） */
export function useI18n() {
  return { t, currentLang, setLang };
}
