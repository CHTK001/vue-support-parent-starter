/**
 * 统一 Socket 模块
 *
 * 多协议（Socket.IO / WebSocket / SSE）统一管理入口。
 * 全局实例由 createApp 装配（读 config.socket），命名实例可自建。
 */
export * from "./socketTemplate";
export * from "./socketUtils";
export * from "./socketTopics";
export * from "./socketService";
