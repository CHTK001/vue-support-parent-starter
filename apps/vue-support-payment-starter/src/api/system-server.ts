// Comprehensive stub for protocol module: system-server
import request from "@/api/config";

export interface SystemServer { id: number; [key: string]: any; }
export interface SystemServerStatistics { total: number; running: number; stopped: number; error: number; }
export interface SystemServerFilterLogRecord { id: number; [key: string]: any; }
export interface FirewallEventRecord { id: number; [key: string]: any; }
export interface FirewallMetricsRecord { id: number; [key: string]: any; }
export interface ServerProcessDescriptor { [key: string]: any; }
export interface ServerProcessTerminateResult { [key: string]: any; }
export interface ServerBoardInfo { [key: string]: any; }
export interface ServerCpuInfo { [key: string]: any; }
export interface ServerMemoryInfo { [key: string]: any; }
export interface ServerSystemInfo { [key: string]: any; }
export interface ServerServiceDescriptor { [key: string]: any; }
export interface ServerPackageInstallRequest { [key: string]: any; }
export interface ServerPackageInstallResult { [key: string]: any; }
export interface CloneServerParams { sourceServerId: number; newServerName: string; newPort: number; }
export interface LogEntry { [key: string]: any; }
export interface SystemServerPageParams { current?: number; size?: number; serverName?: string; serverType?: string; status?: string; }

// CRUD
export const getSystemServerPage = (params: any) => request({ url: "/system/server/page", method: "get", params });
export const getSystemServerById = (id: number) => request({ url: `/system/server/${id}`, method: "get" });
export const addSystemServer = (data: any) => request({ url: "/system/server", method: "post", data });
export const updateSystemServer = (data: any) => request({ url: "/system/server", method: "put", data });
export const deleteSystemServer = (id: number) => request({ url: `/system/server/${id}`, method: "delete" });

// Lifecycle
export const startSystemServer = (id: number) => request({ url: `/system/server/${id}/start`, method: "post" });
export const stopSystemServer = (id: number) => request({ url: `/system/server/${id}/stop`, method: "post" });
export const restartSystemServer = (id: number) => request({ url: `/system/server/${id}/restart`, method: "post" });
export const terminateSystemServer = (id: number, force = true) => request({ url: `/system/server/${id}/terminate`, method: "post", params: { force } });
export const getSystemServerStatus = (id: number) => request({ url: `/system/server/${id}/status`, method: "get" });

// Server types / statistics
export const getAvailableServerTypes = () => request({ url: "/system/server/types", method: "get" });
export const getSystemServerStatistics = () => request({ url: "/system/server/statistics", method: "get" });
export const checkPortAvailable = (port: number, serverId?: number) => request({ url: "/system/server/check-port", method: "get", params: { port, serverId } });

// Clone
export const cloneSystemServer = (params: any) => request({ url: `/system/server/${params.sourceServerId}/clone`, method: "post", params: { newServerName: params.newServerName, newPort: params.newPort } });
export const cloneSystemServerV2 = (id: number, newName: string, newPort: number) => request({ url: `/system/server/${id}/clone`, method: "post", params: { newName, newPort } });
export const applySystemServerConfigChanges = (id: number) => request({ url: `/system/server/${id}/apply-config`, method: "post" });

// Batch
export const batchOperationSystemServer = (serverIds: number[], operation: string) => request({ url: "/system/server/batch", method: "post", params: { serverIds: serverIds.join(","), operation } });
export const autoStartSystemServers = () => request({ url: "/system/server/auto-start", method: "post" });
export const stopAllSystemServers = () => request({ url: "/system/server/stop-all", method: "post" });

// Local system info
export const getLocalSystemInfo = () => request({ url: "/system/server/system-info", method: "get" });
export const getLocalServices = (params?: any) => request({ url: "/system/server/services", method: "get", params });
export const getLocalProcesses = (params?: any) => request({ url: "/system/server/processes", method: "get", params });
export const findLocalProcessByPort = (port: number) => request({ url: "/system/server/processes/by-port", method: "get", params: { port } });
export const terminateLocalProcessByPid = (pid: number, force = true) => request({ url: `/system/server/processes/${pid}/terminate`, method: "post", params: { force } });
export const installLocalPackage = (data: any) => request({ url: "/system/server/software/install", method: "post", data });

// Logs
export const getServerLogSseUrl = (serverId: number): string => `/system/server/${serverId}/logs/stream`;
export const getServerLogs = (serverId: number, params?: any) => request({ url: `/system/server/${serverId}/logs`, method: "get", params });
export const clearServerLogs = (serverId: number) => request({ url: `/system/server/${serverId}/logs`, method: "delete" });
export const getSystemServerFilterLogs = (params: any) => request({ url: "/service/systemserver-log/page", method: "get", params });
export const getFirewallEvents = (params: any) => request({ url: "/service/systemserver-log/firewall/events", method: "get", params });
export const getFirewallMetrics = (params: any) => request({ url: "/service/systemserver-log/firewall/metrics", method: "get", params });
