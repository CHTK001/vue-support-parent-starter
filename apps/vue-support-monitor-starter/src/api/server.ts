import { http } from "@repo/utils";

/**
 * 被监控服务器主机
 */
export interface MonitorServer {
  serverId?: number;
  serverName?: string;
  serverIp?: string;
  serverHost?: string;
  serverPort?: number;
  serverOs?: string;
  serverGroup?: string;
  serverAccount?: string;
  serverStatus?: number;
  serverRemark?: string;
  createTime?: string;
  updateTime?: string;
}

/**
 * 服务器下拉选项
 */
export interface ServerOption {
  serverId: number;
  serverName: string;
}

/**
 * 服务器布局配置
 */
export interface ServerLayout {
  monitorSysGenServerLayoutId?: number;
  monitorSysGenServerId?: number;
  monitorSysGenServerLayoutName?: string;
  monitorSysGenServerLayoutConfig?: string;
  monitorSysGenServerLayoutType?: string;
  monitorSysGenServerLayoutDefault?: number;
  monitorSysGenServerLayoutStatus?: number;
  monitorSysGenServerLayoutDescription?: string;
  monitorSysGenServerLayoutVersion?: number;
  monitorSysGenServerLayoutSort?: number;
}

/* ===================== 服务器主机接口 ===================== */

export function getServerPage(params: Record<string, unknown>) {
  return http.get("/v1/gen/server/page", { params });
}

export function getServerList() {
  return http.get("/v1/gen/server/list");
}

export function getServerOptions() {
  return http.get("/v1/gen/server/options");
}

export function getServerDetail(serverId: number) {
  return http.get(`/v1/gen/server/detail/${serverId}`);
}

export function saveServer(data: MonitorServer) {
  return http.post("/v1/gen/server/save", data);
}

export function updateServer(data: MonitorServer) {
  return http.put("/v1/gen/server/update", data);
}

export function deleteServer(serverId: number) {
  return http.delete(`/v1/gen/server/remove/${serverId}`);
}

/* ===================== 服务器布局接口 ===================== */

export function getLayoutList(serverId: number) {
  return http.get(`/v1/gen/server/layout/list/${serverId}`);
}

export function getDefaultLayout(serverId: number) {
  return http.get(`/v1/gen/server/layout/default/${serverId}`);
}

export function createDefaultLayout(serverId: number) {
  return http.post(`/v1/gen/server/layout/create-default/${serverId}`);
}

export function generateLayout(serverId: number, layoutName?: string) {
  return http.post(
    `/v1/gen/server/layout/generate/${serverId}`,
    {},
    { params: { layoutName } },
  );
}

export function saveLayout(data: ServerLayout) {
  return http.post("/v1/gen/server/layout/save", data);
}

export function updateLayout(data: ServerLayout) {
  return http.put("/v1/gen/server/layout/update", data);
}

export function deleteLayout(layoutId: number) {
  return http.delete(`/v1/gen/server/layout/delete/${layoutId}`);
}

export function setDefaultLayout(serverId: number, layoutId: number) {
  return http.put(`/v1/gen/server/layout/default/${serverId}/${layoutId}`);
}

export function applyLayout(serverId: number, layoutId: number) {
  return http.post(`/v1/gen/server/layout/apply/${serverId}/${layoutId}`);
}

export function copyLayout(
  sourceLayoutId: number,
  targetServerId: number,
  layoutName?: string,
) {
  return http.post(
    `/v1/gen/server/layout/copy/${sourceLayoutId}/${targetServerId}`,
    {},
    { params: { layoutName } },
  );
}

export function getLayoutDetail(layoutId: number) {
  return http.get(`/v1/gen/server/layout/detail/${layoutId}`);
}

/**
 * 服务器状态选项
 */
export const SERVER_STATUS = [
  { label: "启用", value: 1, type: "success" },
  { label: "禁用", value: 0, type: "info" },
];

/**
 * 操作系统选项
 */
export const SERVER_OS_OPTIONS = [
  { label: "Linux", value: "Linux" },
  { label: "Windows", value: "Windows" },
  { label: "macOS", value: "macOS" },
  { label: "Unix", value: "Unix" },
  { label: "其他", value: "Other" },
];
