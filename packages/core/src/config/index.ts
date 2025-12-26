/**
 * 配置模块导出
 *
 * @author CH
 * @version 2.0.0
 * @since 2024-12-25
 */

// Socket 服务统一入口（推荐使用）
export * from "./socketService";

// Socket 模板接口 (排除重复导出的 ProtocolType)
export {
  SocketTemplateKey,
  socketTemplateKeyMap,
  createSocketTemplateKey,
  type SocketTemplateListenOptions,
  type SocketMessage,
  type SocketTemplate,
} from "./socketTemplate";

// Socket 工具函数
export * from "./socketUtils";

// Socket 主题常量
export * from "./socketTopics";

// 各协议单独导出（可选使用）
export * from "./socket.io";
export * from "./rsocket";
export * from "./websocket";
export * from "./sse";

// 废弃的旧接口（向后兼容）
export {
  GlobalSocketKey,
  createGlobalSocketService,
  provideGlobalSocket,
  useGlobalSocket,
  createSocketKey,
  provideSocket,
  useSocket,
  socket,
  type GlobalSocketService,
  type SocketListenOptions,
} from "./socket";
