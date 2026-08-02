/**
 * @repo/gateway —— 网关管理共享包
 *
 * 提供网关管理页面、远程控制页面、composable 与 API 封装。
 * 业务应用通过 @repo/gateway 引入页面与路由，无需自写视图代码。
 */
export { default as GatewayManage } from "./views/GatewayManage.vue";
export { default as RemoteControl } from "./views/remote/index.vue";
export { default as ConferenceJoin } from "./views/conference-join/index.vue";
export { useGateway } from "./composables/useGateway";
export { useRemoteControl } from "./composables/useRemoteControl";
export { default as ConnectionSettings } from "./components/ConnectionSettings.vue";
export { default as DesktopViewer } from "./components/DesktopViewer.vue";
export { default as SshTerminal } from "./components/SshTerminal.vue";
export { default as SshFileManager } from "./components/SshFileManager.vue";
export { default as ConferenceRoom } from "./components/ConferenceRoom.vue";
export { gatewayRoutes } from "./routes";
export * from "./api/types";
export * from "./api/gatewayApi";
export type {
  RemoteProtocol,
  RemoteCodec,
  TransportType,
  ConnectionState,
  RemoteSession,
  DesktopFrameEvent,
  DesktopMetrics,
  RemoteControlCallbacks,
  ConferenceConfig,
  RemoteConnectionSettings,
  RemoteControlInstance,
} from "./composables/useRemoteControl";