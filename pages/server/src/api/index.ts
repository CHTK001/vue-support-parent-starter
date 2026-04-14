import { getConfig } from "@repo/config";
import type { ReturnResult } from "@repo/utils";
import type {
  ServerFileContent,
  ServerFileEntry,
  ServerFileOperationResult,
  ServerFileRenameRequest,
  ServerFileWriteRequest,
  ServerFileWatchTicket,
  ServerAiTaskTicket,
  ServerAlertEvent,
  ServerAlertSettings,
  ServerCapabilityView,
  ServerHost,
  ServerMetricsDetail,
  ServerMetricsSnapshot,
  ServerMetricsTaskSettings,
  ServerMetricsTaskSettingsRequest,
  ServerHostSummary,
  ServerProcessAiAdvice,
  ServerProcessCommandResult,
  ServerProcessView,
  ServerRemoteConsoleConfig,
  ServerRemoteGatewaySettings,
  ServerService,
  ServerServiceCommandResult,
  ServerServiceConfigWriteRequest,
  ServerServiceOperationLog,
  ServerSoftBindingTarget,
  ServerSoftInstallation,
  ServerSoftOperation,
} from "./types";

const hostsBase = "/server/hosts";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const appendQuery = (path: string, query?: Record<string, unknown>) => {
  const search = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    search.set(key, String(value));
  });
  const version = getConfig("apiVersion");
  if (version) {
    search.set("version", String(version));
  }
  const text = search.toString();
  return text ? `${path}?${text}` : path;
};

const resolveBaseUrl = () =>
  String(getConfig("ApiAddress") || getConfig("BaseUrl") || "");

const buildUrl = (path: string, query?: Record<string, unknown>) => {
  const target = appendQuery(path, query);
  const baseUrl = resolveBaseUrl();
  if (!baseUrl) {
    return target;
  }
  return `${baseUrl.replace(/\/$/, "")}${target}`;
};

const buildHeaders = (
  payload?: unknown,
  extraHeaders?: Record<string, string>,
) => {
  const headers: Record<string, string> = {
    ...(payload instanceof FormData
      ? {}
      : { "Content-Type": "application/json;charset=UTF-8" }),
    ...(extraHeaders || {}),
  };
  return headers;
};

const buildResult = <T>(
  payload: unknown,
  fallbackMessage = "",
): ReturnResult<T> => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>)
  ) {
    const envelope = payload as Record<string, unknown>;
    return {
      code: (envelope.code as string | number) ?? "00000",
      msg: String(envelope.msg ?? envelope.message ?? fallbackMessage),
      message: String(envelope.message ?? envelope.msg ?? fallbackMessage),
      success:
        envelope.success === undefined ? true : Boolean(envelope.success),
      data: (envelope.data as T) ?? ({} as T),
    };
  }
  return {
    code: "00000",
    msg: fallbackMessage,
    message: fallbackMessage,
    success: true,
    data: (payload as T) ?? ({} as T),
  };
};

const request = async <T>(
  method: RequestMethod,
  path: string,
  options?: {
    query?: Record<string, unknown>;
    data?: unknown;
    headers?: Record<string, string>;
  },
): Promise<ReturnResult<T>> => {
  const response = await fetch(buildUrl(path, options?.query), {
    method,
    headers: buildHeaders(options?.data, options?.headers),
    body:
      options?.data === undefined
        ? undefined
        : options.data instanceof FormData
          ? options.data
          : JSON.stringify(options.data),
  });
  const payload = await response.json().catch(() => ({}));
  const result = buildResult<T>(payload, response.statusText);
  if (!response.ok || result.success === false) {
    throw result;
  }
  return result;
};

const headRequest = async (path: string) => {
  const response = await fetch(buildUrl(path), {
    method: "HEAD",
    headers: {
      Accept: "application/json",
    },
  });
  return response.ok;
};

const requestBlob = async (
  path: string,
  options?: {
    query?: Record<string, unknown>;
    headers?: Record<string, string>;
  },
) => {
  const response = await fetch(buildUrl(path, options?.query), {
    method: "GET",
    headers: buildHeaders(undefined, options?.headers),
  });
  if (!response.ok) {
    throw new Error(response.statusText || "文件下载失败");
  }
  return response.blob();
};

export const listServerHosts = (params?: {
  keyword?: string;
  serverType?: string;
  enabled?: boolean | "";
}) => request<ServerHost[]>("GET", hostsBase, { query: params });

export const getServerCapabilities = () =>
  request<ServerCapabilityView>("GET", "/server/capabilities");

export const getServerAlertSettings = () =>
  request<ServerAlertSettings>("GET", "/server/alert-settings");

export const updateServerAlertSettings = (data: ServerAlertSettings) =>
  request<ServerAlertSettings>("PUT", "/server/alert-settings", { data });

export const listServerAlerts = (params?: {
  serverId?: number;
  metricType?: string;
  severity?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}) => request<ServerAlertEvent[]>("GET", "/server/alerts", { query: params });

export const getServerHostSummary = () =>
  request<ServerHostSummary>("GET", `${hostsBase}/summary`);

export const getServerHost = (id: number) =>
  request<ServerHost>("GET", `${hostsBase}/${id}`);

export const createServerHost = (data: ServerHost) =>
  request<ServerHost>("POST", hostsBase, { data });

export const updateServerHost = (id: number, data: ServerHost) =>
  request<ServerHost>("PUT", `${hostsBase}/${id}`, { data });

export const refreshServerHostPublicIp = (id: number) =>
  request<ServerHost>("POST", `${hostsBase}/${id}/public-ip/refresh`);

export const updateServerHostEnabled = (id: number, enabled: boolean) =>
  request<ServerHost>("PATCH", `${hostsBase}/${id}/enabled`, {
    query: { enabled },
  });

export const deleteServerHost = (id: number) =>
  request<boolean>("DELETE", `${hostsBase}/${id}`);

export const listServerHostMetrics = () =>
  request<ServerMetricsSnapshot[]>("GET", `${hostsBase}/metrics`);

export const refreshServerHostMetrics = () =>
  request<ServerMetricsSnapshot[]>("POST", `${hostsBase}/metrics/refresh`);

export const getServerMetricsTaskSettings = () =>
  request<ServerMetricsTaskSettings>(
    "GET",
    `${hostsBase}/metrics/task-settings`,
  );

export const updateServerMetricsTaskSettings = (
  data: ServerMetricsTaskSettingsRequest,
) =>
  request<ServerMetricsTaskSettings>(
    "PUT",
    `${hostsBase}/metrics/task-settings`,
    {
      data,
    },
  );

export const getServerHostMetricsTaskSettings = (id: number) =>
  request<ServerMetricsTaskSettings>(
    "GET",
    `${hostsBase}/${id}/metrics/task-settings`,
  );

export const updateServerHostMetricsTaskSettings = (
  id: number,
  data: ServerMetricsTaskSettingsRequest,
) =>
  request<ServerMetricsTaskSettings>(
    "PUT",
    `${hostsBase}/${id}/metrics/task-settings`,
    {
      data,
    },
  );

export const getServerHostMetrics = (id: number) =>
  request<ServerMetricsSnapshot>("GET", `${hostsBase}/${id}/metrics`);

export const getServerHostMetricsDetail = (id: number) =>
  request<ServerMetricsDetail>("GET", `${hostsBase}/${id}/metrics/detail`);

export const getServerHostMetricsHistory = (
  id: number,
  params?: { minutes?: number },
) =>
  request<ServerMetricsSnapshot[]>(
    "GET",
    `${hostsBase}/${id}/metrics/history`,
    { query: params },
  );

export const analyzeServerHostStability = (id: number) =>
  request<ServerAiTaskTicket>("POST", `${hostsBase}/${id}/ai-analyze`);

export const analyzeServerHostMetricHistory = (
  id: number,
  params: {
    metricType: string;
    minutes?: number;
    startTime?: number;
    endTime?: number;
    stateFilter?: string;
  },
) =>
  request<ServerAiTaskTicket>(
    "POST",
    `${hostsBase}/${id}/metrics/history/ai-analyze`,
    { query: params },
  );

export const analyzeServerHostAlertHistory = (
  id: number,
  params?: {
    metricType?: string;
    severity?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  },
) =>
  request<ServerAiTaskTicket>("POST", `${hostsBase}/${id}/alerts/ai-analyze`, {
    query: params,
  });

export const listServerHostProcesses = (
  id: number,
  params?: {
    keyword?: string;
    limit?: number;
  },
) =>
  request<ServerProcessView[]>("GET", `${hostsBase}/${id}/processes`, {
    query: params,
  });

export const getServerHostProcess = (id: number, pid: number) =>
  request<ServerProcessView>("GET", `${hostsBase}/${id}/processes/${pid}`);

export const terminateServerHostProcess = (
  id: number,
  pid: number,
  force = false,
) =>
  request<ServerProcessCommandResult>(
    "POST",
    `${hostsBase}/${id}/processes/${pid}/terminate`,
    {
      query: { force },
    },
  );

export const analyzeServerHostProcess = (id: number, pid: number) =>
  request<ServerProcessAiAdvice>(
    "POST",
    `${hostsBase}/${id}/processes/${pid}/ai-analyze`,
  );

export const getServerHostAlertSettings = (id: number) =>
  request<ServerAlertSettings>("GET", `${hostsBase}/${id}/alert-settings`);

export const updateServerHostAlertSettings = (
  id: number,
  data: ServerAlertSettings,
) =>
  request<ServerAlertSettings>("PUT", `${hostsBase}/${id}/alert-settings`, {
    data,
  });

export const getServerHostGuacamole = (id: number) =>
  request<ServerRemoteConsoleConfig>("GET", `${hostsBase}/${id}/guacamole`);

export const getServerHostRemoteConsoleConfig = (id: number) =>
  request<ServerRemoteConsoleConfig>(
    "GET",
    `${hostsBase}/${id}/remote-console`,
  );

export const detectServerHostServices = (id: number) =>
  request<ServerService[]>("POST", `${hostsBase}/${id}/services/detect`);

export const getServerHostRemoteGateway = (id: number) =>
  request<ServerRemoteGatewaySettings>(
    "GET",
    `${hostsBase}/${id}/remote-gateway`,
  );

export const updateServerHostRemoteGateway = (
  id: number,
  data: ServerRemoteGatewaySettings,
) =>
  request<ServerRemoteGatewaySettings>(
    "PUT",
    `${hostsBase}/${id}/remote-gateway`,
    { data },
  );

const servicesBase = "/server/services";

export const listServerServices = (params?: {
  serverId?: number;
  enabled?: boolean;
}) => request<ServerService[]>("GET", servicesBase, { query: params });

export const getServerService = (id: number) =>
  request<ServerService>("GET", `${servicesBase}/${id}`);

export const getServerServiceOperationLogs = (id: number, limit?: number) =>
  request<ServerServiceOperationLog[]>(
    "GET",
    `${servicesBase}/${id}/operation-logs`,
    {
      query: { limit },
    },
  );

export const generateServerServiceAiDraft = (id: number) =>
  request<ServerAiTaskTicket>("POST", `${servicesBase}/${id}/ai-draft`);

export const writeServerServiceConfig = (
  id: number,
  data?: ServerServiceConfigWriteRequest,
) =>
  request<ServerServiceCommandResult>(
    "POST",
    `${servicesBase}/${id}/config/write`,
    {
      data: data || {},
    },
  );

export const getServerServiceByInstallation = (installationId: number) =>
  request<ServerService>(
    "GET",
    `${servicesBase}/by-installation/${installationId}`,
  );

export const createServerService = (data: ServerService) =>
  request<ServerService>("POST", servicesBase, { data });

export const updateServerService = (id: number, data: ServerService) =>
  request<ServerService>("PUT", `${servicesBase}/${id}`, { data });

export const deleteServerService = (id: number) =>
  request<boolean>("DELETE", `${servicesBase}/${id}`);

const runServerServiceCommand = (path: string) =>
  request<ServerServiceCommandResult>("POST", path);

export const registerServerService = (id: number) =>
  runServerServiceCommand(`${servicesBase}/${id}/register`);

export const unregisterServerService = (id: number) =>
  runServerServiceCommand(`${servicesBase}/${id}/unregister`);

export const startServerService = (id: number) =>
  runServerServiceCommand(`${servicesBase}/${id}/start`);

export const stopServerService = (id: number) =>
  runServerServiceCommand(`${servicesBase}/${id}/stop`);

export const restartServerService = (id: number) =>
  runServerServiceCommand(`${servicesBase}/${id}/restart`);

export const getServerServiceStatus = (id: number) =>
  runServerServiceCommand(`${servicesBase}/${id}/status`);

export const aiFixStartServerService = (id: number) =>
  runServerServiceCommand(`${servicesBase}/${id}/ai-fix-start`);

export const registerInstallationServerService = (installationId: number) =>
  runServerServiceCommand(
    `${servicesBase}/by-installation/${installationId}/register`,
  );

export const unregisterInstallationServerService = (installationId: number) =>
  runServerServiceCommand(
    `${servicesBase}/by-installation/${installationId}/unregister`,
  );

export const startInstallationServerService = (installationId: number) =>
  runServerServiceCommand(
    `${servicesBase}/by-installation/${installationId}/start`,
  );

export const stopInstallationServerService = (installationId: number) =>
  runServerServiceCommand(
    `${servicesBase}/by-installation/${installationId}/stop`,
  );

export const restartInstallationServerService = (installationId: number) =>
  runServerServiceCommand(
    `${servicesBase}/by-installation/${installationId}/restart`,
  );

export const getInstallationServerServiceStatus = (installationId: number) =>
  runServerServiceCommand(
    `${servicesBase}/by-installation/${installationId}/status`,
  );

const settingsBase = "/server/settings";

export const getServerRemoteGatewaySettings = () =>
  request<ServerRemoteGatewaySettings>("GET", `${settingsBase}/remote-gateway`);

export const updateServerRemoteGatewaySettings = (
  data: ServerRemoteGatewaySettings,
) =>
  request<ServerRemoteGatewaySettings>(
    "PUT",
    `${settingsBase}/remote-gateway`,
    { data },
  );

export const listServerFiles = (id: number, path?: string) =>
  request<ServerFileEntry[]>("GET", `${hostsBase}/${id}/files`, {
    query: { path },
  });

export const readServerFileContent = (
  id: number,
  path: string,
  maxBytes?: number,
) =>
  request<ServerFileContent>("GET", `${hostsBase}/${id}/files/content`, {
    query: { path, maxBytes },
  });

export const writeServerFileContent = (
  id: number,
  data: ServerFileWriteRequest,
) =>
  request<ServerFileOperationResult>(
    "PUT",
    `${hostsBase}/${id}/files/content`,
    {
      data,
    },
  );

export const downloadServerFile = (id: number, path: string) =>
  requestBlob(`${hostsBase}/${id}/files/download`, {
    query: { path },
  });

export const uploadServerFile = (
  id: number,
  file: File,
  directory?: string,
) => {
  const formData = new FormData();
  formData.append("file", file);
  return request<ServerFileOperationResult>(
    "POST",
    `${hostsBase}/${id}/files/upload`,
    {
      query: { directory },
      data: formData,
    },
  );
};

export const createServerDirectory = (id: number, path: string) =>
  request<ServerFileOperationResult>(
    "POST",
    `${hostsBase}/${id}/files/directories`,
    {
      query: { path },
    },
  );

export const renameServerFile = (id: number, data: ServerFileRenameRequest) =>
  request<ServerFileOperationResult>("PUT", `${hostsBase}/${id}/files/rename`, {
    data,
  });

export const deleteServerFile = (id: number, path: string, recursive = false) =>
  request<ServerFileOperationResult>("DELETE", `${hostsBase}/${id}/files`, {
    query: { path, recursive },
  });

export const startServerFileWatch = (id: number, path: string) =>
  request<ServerFileWatchTicket>("POST", `${hostsBase}/${id}/files/watch`, {
    data: { path },
  });

export const stopServerFileWatch = (id: number, watchId: number) =>
  request<boolean>("DELETE", `${hostsBase}/${id}/files/watch/${watchId}`);

const softPackagesBase = "/soft/packages";
const softTargetsBase = "/soft/targets";
const softInstallationsBase = "/soft/installations";
const softOperationsBase = "/soft/operations";

export const checkSoftModuleReady = () => headRequest(softPackagesBase);

export const listSoftBindingTargets = () =>
  request<ServerSoftBindingTarget[]>("GET", softTargetsBase);

export const listServerSoftInstallations = () =>
  request<ServerSoftInstallation[]>("GET", softInstallationsBase);

export const listServerSoftOperations = () =>
  request<ServerSoftOperation[]>("GET", softOperationsBase);

export * from "./types";
