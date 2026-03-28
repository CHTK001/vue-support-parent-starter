import type { ReturnResult } from "@repo/utils";
import {
  batchOperateContainers,
  createContainer,
  createSoft as saveSoft,
  deleteContainer,
  deleteSoft,
  getContainerById,
  getContainerLogs,
  getContainerPageList,
  getContainerStats,
  getContainersByServerId,
  getContainersBySoftId,
  getImageById,
  getImagePageList,
  getSoftPageList,
  getSoftRecordPage,
  getWebSocketTopics,
  installSoftware,
  registryApi,
  restartContainer,
  startContainer,
  stopContainer,
  syncContainerStatus,
  syncSoftware as syncSoft,
  type SystemSoft,
} from "../docker/management";

export * from "../docker/management";

export {
  batchOperateContainers,
  createContainer,
  deleteSoft,
  getContainerById,
  getContainerLogs,
  getContainerPageList,
  getContainerStats,
  getContainersByServerId,
  getContainersBySoftId,
  getSoftPageList,
  getWebSocketTopics,
  restartContainer,
  startContainer,
  stopContainer,
  syncContainerStatus,
} from "../docker/management";

export const softRegistryApi = registryApi;
export { saveSoft, syncSoft };

const SUCCESS_CODE = "00000";

const isSuccessCode = (code: unknown) =>
  code === SUCCESS_CODE || code === 0 || code === "0";

const createResult = <T>(
  data: T,
  msg = "",
  code: string | number = SUCCESS_CODE,
) =>
  ({
    code,
    data,
    msg,
    message: msg,
    success: isSuccessCode(code),
  }) as ReturnResult<T>;

const createFailure = <T>(msg: string, data: T) =>
  createResult(data, msg, "50000");

const normalizePageParams = (params?: Record<string, any>) => ({
  page: params?.page ?? params?.current ?? 1,
  size: params?.pageSize ?? params?.size ?? 20,
});

const tryParseObject = (value?: string) => {
  if (!value || typeof value !== "string") {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

const mapVersion = (row: any) => ({
  ...row,
  systemSoftVersionId:
    row?.systemSoftVersionId ?? row?.systemSoftImageId ?? row?.id,
  systemSoftId: row?.systemSoftId,
  version: row?.version ?? row?.imageTag ?? row?.systemSoftImageTag,
  imageTag: row?.imageTag ?? row?.systemSoftImageTag ?? row?.tag,
  description:
    row?.description ?? row?.systemSoftImageDescription ?? row?.name,
  createTime: row?.createTime ?? row?.systemSoftImageCreated ?? row?.created,
});

const mapInstallRecord = (row: any) => ({
  ...row,
  recordId: row?.recordId ?? row?.systemSoftRecordId,
  serverId: row?.serverId ?? row?.systemServerId,
  installMethod:
    row?.installMethod ??
    row?.systemSoftRecordMethod ??
    row?.systemSoftRecordOperationType,
  installParams: row?.installParams ?? row?.systemSoftRecordParams,
  startTime: row?.startTime ?? row?.systemSoftRecordStartTime,
  endTime: row?.endTime ?? row?.systemSoftRecordEndTime,
  errorMessage: row?.errorMessage ?? row?.systemSoftRecordErrorMessage,
  duration: row?.duration ?? row?.systemSoftRecordDuration,
  version:
    row?.version ??
    row?.imageTag ??
    row?.systemSoftImageTag ??
    row?.systemSoftContainerImageTag,
  progress:
    row?.progress ??
    (row?.status === "SUCCESS" ? 100 : row?.status === "FAILED" ? 0 : 0),
});

const mapContainer = (row: any) => ({
  ...row,
  containerId:
    row?.containerId ??
    (row?.systemSoftContainerId !== undefined &&
    row?.systemSoftContainerId !== null
      ? String(row.systemSoftContainerId)
      : undefined),
  serverId: row?.serverId ?? row?.systemServerId,
  status: row?.status ?? row?.systemSoftContainerStatus,
});

const resolveImageTag = async (params: {
  imageTag?: string;
  systemSoftVersionId?: number;
  systemSoftImageId?: number;
}) => {
  if (params?.imageTag) {
    return params.imageTag;
  }

  const imageId = params?.systemSoftImageId ?? params?.systemSoftVersionId;
  if (!imageId) {
    return "latest";
  }

  const imageResult = await getImageById(Number(imageId));
  if (!isSuccessCode(imageResult?.code)) {
    return "latest";
  }

  return (
    imageResult.data?.systemSoftImageTag ||
    (imageResult.data as any)?.imageTag ||
    "latest"
  );
};

export function getSoftVersionPageList(params: any) {
  const paging = normalizePageParams(params);
  return getImagePageList({
    ...paging,
    softId: params?.systemSoftId ?? params?.softId,
    serverId: params?.serverId,
    keyword: params?.keyword,
  }).then((result) => {
    if (!isSuccessCode(result?.code)) {
      return result as ReturnResult<{ records: any[]; total: number }>;
    }

    return {
      ...result,
      data: {
        ...result.data,
        records: (result.data?.records || []).map(mapVersion),
      },
    } as ReturnResult<{ records: any[]; total: number }>;
  });
}

export function saveSoftVersion(data: any) {
  return createFailure("版本管理已切换为镜像管理，请在镜像列表中维护", data);
}

export function updateSoftVersion(data: any) {
  return createFailure("版本管理已切换为镜像管理，请在镜像列表中维护", data);
}

export async function installSoft(params: {
  systemSoftId: number;
  systemSoftVersionId?: number;
  systemSoftImageId?: number;
  serverIds: number[];
  imageTag?: string;
  method?: string;
  params?: string;
}) {
  const imageTag = await resolveImageTag(params);
  const extraConfig = tryParseObject(params?.params);

  return installSoftware({
    softId: params.systemSoftId,
    serverIds: params.serverIds || [],
    imageTag,
    ...extraConfig,
  } as any);
}

export async function uninstallSoft(params: {
  systemSoftId: number;
  systemSoftVersionId?: number;
  serverIds?: number[];
}) {
  const containerResult = await getContainersBySoftId(params.systemSoftId);
  if (!isSuccessCode(containerResult?.code)) {
    return containerResult as ReturnResult<boolean>;
  }

  const serverIds = Array.isArray(params.serverIds) && params.serverIds.length > 0
    ? new Set(params.serverIds.map((item) => Number(item)))
    : null;
  const containers = (containerResult.data || []).filter((item: any) => {
    if (!serverIds) {
      return true;
    }
    return serverIds.has(Number(item?.systemServerId ?? item?.serverId));
  });

  if (containers.length === 0) {
    return createResult(true, "未找到需要卸载的容器");
  }

  const results = await Promise.all(
    containers.map(async (item: any) => {
      const containerId = Number(
        item?.systemSoftContainerId ?? item?.containerId,
      );
      if (!containerId) {
        return null;
      }

      return deleteContainer(containerId, true).catch(() => null);
    }),
  );

  const success = results.every(
    (item) => item && isSuccessCode(item.code),
  );

  return success
    ? createResult(true, "卸载请求已提交")
    : createFailure("部分容器卸载失败，请检查容器状态", false);
}

export function getSoftRecordPageList(params: any) {
  const paging = normalizePageParams(params);
  return getSoftRecordPage({
    current: paging.page,
    size: paging.size,
    softId: params?.systemSoftId ?? params?.softId,
    serverId: params?.serverId,
    operationType: params?.operationType,
    operationStatus: params?.operationStatus,
    operationUser: params?.operationUser,
  }).then((result) => {
    if (!isSuccessCode(result?.code)) {
      return result as ReturnResult<{ records: any[]; total: number }>;
    }

    return {
      ...result,
      data: {
        ...result.data,
        records: (result.data?.records || []).map(mapInstallRecord),
      },
    } as ReturnResult<{ records: any[]; total: number }>;
  });
}

export const getSoftInstallRecords = getSoftRecordPageList;

export async function getAbnormalContainers() {
  const result = await getContainerPageList({ page: 1, size: 200 });
  if (!isSuccessCode(result?.code)) {
    return result as ReturnResult<any[]>;
  }

  const abnormal = (result.data?.records || [])
    .map(mapContainer)
    .filter((item: any) => {
      const status = String(item?.status || "").toLowerCase();
      return Boolean(status) && !["running", "created"].includes(status);
    });

  return createResult(abnormal);
}

export function retryInstallSoft(data: { recordId: string }) {
  return createFailure(
    "当前后端未提供安装记录重试接口",
    data as unknown as boolean,
  );
}

export function cancelInstallSoft(data: { recordId: string }) {
  return createFailure(
    "当前后端未提供安装记录取消接口",
    data as unknown as boolean,
  );
}

export function deleteInstallRecord(data: { recordId: string }) {
  return createFailure(
    "当前后端未提供安装记录删除接口",
    data as unknown as boolean,
  );
}

export function getInstallLogs(params: { recordId: string }) {
  return createFailure("当前后端未提供安装记录日志接口", "");
}

export async function getSoftContainerList(params: any) {
  if (params?.systemSoftId ?? params?.softId) {
    const result = await getContainersBySoftId(
      Number(params.systemSoftId ?? params.softId),
    );
    if (!isSuccessCode(result?.code)) {
      return result as ReturnResult<any[]>;
    }
    return createResult((result.data || []).map(mapContainer));
  }

  if (params?.serverId) {
    const result = await getContainersByServerId(Number(params.serverId));
    if (!isSuccessCode(result?.code)) {
      return result as ReturnResult<any[]>;
    }
    return createResult((result.data || []).map(mapContainer));
  }

  const paging = normalizePageParams(params);
  const result = await getContainerPageList({
    ...paging,
    softId: params?.systemSoftId ?? params?.softId,
    serverId: params?.serverId,
  });
  if (!isSuccessCode(result?.code)) {
    return result as ReturnResult<any[]>;
  }

  return createResult((result.data?.records || []).map(mapContainer));
}

export function startSoftContainer(data: { containerId: string }) {
  return startContainer(Number(data.containerId));
}

export function stopSoftContainer(data: { containerId: string }) {
  return stopContainer(Number(data.containerId));
}

export function removeSoftContainer(data: { containerId: string }) {
  return deleteContainer(Number(data.containerId), true);
}

export function getSoftContainerLogs(params: { containerId: string }) {
  return getContainerLogs(Number(params.containerId));
}
