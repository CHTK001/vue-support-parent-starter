import { formatToken, getConfig, getToken } from "@repo/config";
import type { ReturnResult } from "@repo/utils";
import type {
  SoftConfigResponse,
  SoftConfigSnapshot,
  SoftConfigWriteRequest,
  SoftGuidePreviewRequest,
  SoftGuidePreviewResponse,
  SoftInstallationDetail,
  SoftInstallation,
  SoftInstallRequest,
  SoftLogResponse,
  SoftLogWatchTicket,
  SoftOperationLog,
  SoftOperationTicket,
  SoftPackageAiDraftRequest,
  SoftPackageAiDraftResponse,
  SoftPackageGuide,
  SoftPackage,
  SoftPackageCreateRequest,
  SoftPackageCreateResult,
  SoftPackageDetail,
  SoftPackageVersion,
  SoftPackageVersionUpdateResult,
  SoftRepository,
  SoftRepositorySourceSearchItem,
  SoftRepositorySourceUpdateRequest,
  SoftRepositoryUploadResult,
  SoftRepositorySource,
  SoftRealtimeEnvelope,
  SoftRealtimePayload,
  SoftTarget,
} from "./types";

declare global {
  interface Window {
    __softLastApiResponse__?: unknown;
    __softLastApiNormalized__?: unknown;
  }
}

const repositoriesBase = "/soft/repositories";
const packagesBase = "/soft/packages";
const targetsBase = "/soft/targets";
const installationsBase = "/soft/installations";
const operationsBase = "/soft/operations";

const normalizeResult = <T>(value: unknown): ReturnResult<T> => {
  if (value && typeof value === "object" && "data" in (value as Record<string, unknown>)) {
    const envelope = value as Record<string, unknown>;
    const msg = String(envelope.msg ?? envelope.message ?? "");
    return {
      code: (envelope.code as string | number) ?? "00000",
      msg,
      message: msg,
      data: ((envelope.data as T | undefined) ?? ({} as T)),
      success: envelope.success === undefined ? true : Boolean(envelope.success),
      headers: envelope.headers as any,
    };
  }

  return {
    code: "00000",
    msg: "",
    message: "",
    data: ((value as T | undefined) ?? ({} as T)),
    success: true,
  };
};

const buildRequestUrl = (url: string) => {
  if (/^https?:\/\//.test(url)) {
    return url;
  }
  const baseUrl = String(getConfig().ApiAddress || getConfig().BaseUrl || "");
  return `${baseUrl}${url}`;
};

const requestByFetch = async <T>(
  method: "get" | "post" | "put" | "delete",
  url: string,
  options?: Record<string, unknown>,
) => {
  const token = getToken();
  const accessToken = token?.accessToken;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (accessToken) {
    const authorization = formatToken(accessToken);
    if (authorization) {
      headers.Authorization = authorization;
    }
    headers["x-oauth-token"] = accessToken;
  }

  const payload = options?.data;
  if (payload !== undefined && !(payload instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(buildRequestUrl(url), {
    method: method.toUpperCase(),
    headers,
    credentials: "include",
    body:
      payload === undefined
        ? undefined
        : payload instanceof FormData
          ? payload
          : JSON.stringify(payload),
  });

  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};
  return normalizeResult<T>(parsed);
};

const softRequest = async <T>(
  method: "get" | "post" | "put" | "delete",
  url: string,
  options?: Record<string, unknown>,
) => {
  const normalized = await requestByFetch<T>(method, url, options);
  if (typeof window !== "undefined") {
    window.__softLastApiResponse__ = normalized;
    window.__softLastApiNormalized__ = normalized;
  }
  return normalized;
};

const appendQuery = (path: string, query?: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `${path}?${text}` : path;
};

export const listSoftRepositories = () =>
  softRequest<SoftRepository[]>("get", repositoriesBase);

export const createSoftRepository = (data: SoftRepository) =>
  softRequest<SoftRepository>("post", repositoriesBase, { data });

export const updateSoftRepository = (id: number, data: SoftRepository) =>
  softRequest<SoftRepository>("put", `${repositoriesBase}/${id}`, { data });

export const updateSoftRepositorySources = (
  id: number,
  data: SoftRepositorySourceUpdateRequest,
) =>
  softRequest<SoftRepository>("put", `${repositoriesBase}/${id}/sources`, {
    data,
  });

export const listSoftRepositorySources = (keyword?: string) =>
  softRequest<SoftRepositorySourceSearchItem[]>(
    "get",
    appendQuery(`${repositoriesBase}/sources`, { keyword }),
  );

export const deleteSoftRepository = (id: number) =>
  softRequest<boolean>("delete", `${repositoriesBase}/${id}`);

export const syncSoftRepository = (id: number) =>
  softRequest<SoftRepository>("post", `${repositoriesBase}/${id}/sync`);

export const uploadSoftRepositoryArtifacts = (id: number, files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append("files", file));
  return softRequest<SoftRepositoryUploadResult>(
    "post",
    `${repositoriesBase}/${id}/artifacts/upload`,
    { data: formData },
  );
};

export const listSoftPackages = () =>
  softRequest<SoftPackage[]>("get", packagesBase);

export const createSoftPackage = (data: SoftPackageCreateRequest) =>
  softRequest<SoftPackageCreateResult>("post", packagesBase, { data });

export const generateSoftPackageAiDraft = (data: SoftPackageAiDraftRequest) =>
  softRequest<SoftPackageAiDraftResponse>("post", `${packagesBase}/ai-draft`, {
    data,
  });

export const getSoftPackageDetail = (id: number) =>
  softRequest<SoftPackageDetail>("get", `${packagesBase}/${id}`);

export const updateSoftPackage = (
  id: number,
  data: Partial<SoftPackage>,
) => softRequest<SoftPackage>("put", `${packagesBase}/${id}`, { data });

export const updateSoftPackageVersion = (
  packageId: number,
  versionId: number,
  data: Partial<SoftPackageVersion>,
) =>
  softRequest<SoftPackageVersionUpdateResult>(
    "put",
    `${packagesBase}/${packageId}/versions/${versionId}`,
    { data },
  );

export const getSoftPackageGuide = (
  id: number,
  params?: {
    versionId?: number;
    targetId?: number;
  },
) =>
  softRequest<SoftPackageGuide>(
    "get",
    appendQuery(`${packagesBase}/${id}/guide`, params),
  );

export const getSoftVersionGuide = (
  id: number,
  versionId: number,
  params?: {
    targetId?: number;
  },
) =>
  softRequest<SoftPackageGuide>(
    "get",
    appendQuery(`${packagesBase}/${id}/versions/${versionId}/guide`, params),
  );

export const previewSoftPackageGuide = (
  id: number,
  data: SoftGuidePreviewRequest,
) =>
  softRequest<SoftGuidePreviewResponse>(
    "post",
    `${packagesBase}/${id}/guide/preview`,
    { data },
  );

export const listSoftTargets = () =>
  softRequest<SoftTarget[]>("get", targetsBase);

export const createSoftTarget = (data: SoftTarget) =>
  softRequest<SoftTarget>("post", targetsBase, { data });

export const updateSoftTarget = (id: number, data: SoftTarget) =>
  softRequest<SoftTarget>("put", `${targetsBase}/${id}`, { data });

export const deleteSoftTarget = (id: number) =>
  softRequest<boolean>("delete", `${targetsBase}/${id}`);

export const listSoftInstallations = () =>
  softRequest<SoftInstallation[]>("get", installationsBase);

export const getSoftInstallationDetail = (id: number) =>
  softRequest<SoftInstallationDetail>("get", `${installationsBase}/${id}`);

export const installSoftPackage = (data: SoftInstallRequest) =>
  softRequest<SoftOperationTicket>("post", installationsBase, { data });

export const uninstallSoftPackage = (id: number) =>
  softRequest<SoftOperationTicket>("delete", `${installationsBase}/${id}`);

export const registerSoftService = (id: number) =>
  softRequest<SoftOperationTicket>("post", `${installationsBase}/${id}/service/register`);

export const unregisterSoftService = (id: number) =>
  softRequest<SoftOperationTicket>("post", `${installationsBase}/${id}/service/unregister`);

export const startSoftService = (id: number) =>
  softRequest<SoftOperationTicket>("post", `${installationsBase}/${id}/service/start`);

export const stopSoftService = (id: number) =>
  softRequest<SoftOperationTicket>("post", `${installationsBase}/${id}/service/stop`);

export const restartSoftService = (id: number) =>
  softRequest<SoftOperationTicket>("post", `${installationsBase}/${id}/service/restart`);

export const getSoftServiceStatus = (id: number) =>
  softRequest<SoftOperationTicket>("post", `${installationsBase}/${id}/service/status`);

export const getSoftLogs = (
  id: number,
  params?: {
    logPath?: string;
    lines?: number;
  },
) =>
  softRequest<SoftLogResponse>(
    "get",
    appendQuery(`${installationsBase}/${id}/logs`, params),
  );

export const startSoftLogWatch = (id: number, logPath?: string) =>
  softRequest<SoftLogWatchTicket>(
    "post",
    appendQuery(`${installationsBase}/${id}/logs/watch`, { logPath }),
  );

export const stopSoftLogWatch = (id: number, watchId: number) =>
  softRequest<boolean>(
    "delete",
    `${installationsBase}/${id}/logs/watch/${watchId}`,
  );

export const getSoftConfig = (id: number, configPath?: string) =>
  softRequest<SoftConfigResponse>(
    "get",
    appendQuery(`${installationsBase}/${id}/configs`, { configPath }),
  );

export const updateSoftConfig = (
  id: number,
  data: SoftConfigWriteRequest,
) =>
  softRequest<SoftOperationTicket>(
    "put",
    `${installationsBase}/${id}/configs`,
    { data },
  );

export const listSoftConfigSnapshots = (id: number) =>
  softRequest<SoftConfigSnapshot[]>(
    "get",
    `${installationsBase}/${id}/configs/snapshots`,
  );

export const rollbackSoftConfigSnapshot = (
  installationId: number,
  snapshotId: number,
) =>
  softRequest<SoftOperationTicket>(
    "post",
    `${installationsBase}/${installationId}/configs/snapshots/${snapshotId}/rollback`,
  );

export const listSoftOperationLogs = () =>
  softRequest<SoftOperationLog[]>("get", operationsBase);

export type {
  SoftConfigResponse,
  SoftConfigSnapshot,
  SoftConfigWriteRequest,
  SoftGuideField,
  SoftGuidePreviewRequest,
  SoftGuidePreviewResponse,
  SoftGuideTemplate,
  SoftInstallation,
  SoftInstallationDetail,
  SoftInstallRequest,
  SoftLogResponse,
  SoftLogWatchTicket,
  SoftOperationLog,
  SoftOperationTicket,
  SoftPackageGuide,
  SoftPackage,
  SoftPackageAiDraftRequest,
  SoftPackageAiDraftResponse,
  SoftPackageCreateRequest,
  SoftPackageCreateResult,
  SoftPackageDetail,
  SoftPackageVersionUpdateResult,
  SoftRenderedConfigFile,
  SoftPackageVersion,
  SoftRepository,
  SoftRepositoryUploadFile,
  SoftRepositoryUploadResult,
  SoftRepositorySourceSearchItem,
  SoftRepositorySourceUpdateRequest,
  SoftRepositorySource,
  SoftRealtimeEnvelope,
  SoftRealtimePayload,
  SoftTarget,
} from "./types";
