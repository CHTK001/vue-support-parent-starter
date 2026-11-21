/**
 * @pages/logger 包出口：宿主应用壳可复用日志控制台的 App、路由与 API 封装。
 */
export { default as LoggerApp } from "./App.vue";
export { router } from "./router";
export { fetchApps, fetchEvents, fetchStats, clearEvents, openLogStream, normLevel, LOG_LEVELS } from "./api/logger";
export type { LoggerEvent, LoggerAppInfo, LoggerStats, LoggerEventsPage, FetchEventsParams } from "./api/logger";
