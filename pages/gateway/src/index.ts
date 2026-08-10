/**
 * @repo/gateway —— 网关管理共享包
 *
 * 提供网关管理页面、远程控制页面、composable 与 API 封装。
 * 业务应用通过 @repo/gateway 引入页面与路由，无需自写视图代码。
 *
 * 导出清单：
 *   - 主页面：RemoteControl（3 步流程：表单 → authenticate → 挂载 wsUrl）
 *   - 表单与 Viewer：ReConnectionForm、ReVncViewer、ReSshViewer、ReRdpViewer、ReRustDeskViewer
 *   - 旧版本：GatewayManage、ConferenceJoin（保留兼容）
 *   - composable：useGateway、useRemoteControl
 *   - API：authenticate、listKeys、listProtocols、reportMetrics
 *   - 类型：AuthResponse、ProtocolInfo 等
 *
 * @author CH
 * @since 4.0.0.42
 */
export { default as RemoteControl } from "./views/RemoteControl.vue";
export { default as GatewayManage } from "./views/GatewayManage.vue";
export { default as ConferenceJoin } from "./views/conference-join/index.vue";

// 表单与 Viewer 组件（新 3 步流程）
export { default as ReConnectionForm } from "./components/ReConnectionForm.vue";
export { default as ReVncViewer } from "./components/ReVncViewer.vue";
export { default as ReSshViewer } from "./components/ReSshViewer.vue";
export { default as ReRdpViewer } from "./components/ReRdpViewer.vue";
export { default as ReRustDeskViewer } from "./components/ReRustDeskViewer.vue";

// 旧版本组件（保留兼容）
export { default as ReConnectionSettings } from "./components/ReConnectionSettings.vue";
export { default as ReDesktopViewer } from "./components/ReDesktopViewer.vue";
export { default as ReSshTerminal } from "./components/ReSshTerminal.vue";
export { default as ReSshFileManager } from "./components/ReSshFileManager.vue";
export { default as ReConferenceRoom } from "./components/ReConferenceRoom.vue";

// composable
export { useGateway } from "./composables/useGateway";
export { useRemoteControl } from "./composables/useRemoteControl";

// 路由
export { gatewayRoutes } from "./routes";

// API 与类型
export * from "./api/types";
export * from "./api/gatewayApi";

// composable 内部类型
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
  RemoteReConnectionSettings,
  RemoteControlInstance,
} from "./composables/useRemoteControl";