import { http, type ReturnResult } from "@repo/utils";

// 定义安装服务器信息接口
export interface InstalledServer {
  sshId: string;
  installId: number;
  installStatus: number;
  installStatusDesc: string;
  runStatus: number;
  runStatusDesc: string;
  installTime: number;
  installPath: string;
  installVersion: string;
  serverName: string;
  serverHost: string;
  hostName: string;
  osName: string;
}

// 软件版本接口
export interface SoftServiceVersion {
  softServiceId: number;
  version: string;
  downloadUrl: string;
  releaseTime: Date;
  versionDesc: string;
  isCurrent: boolean;
  isInstallable?: boolean; // 是否可安装
}

export interface SoftService {
  createName: string;
  createBy: number;
  createTime: string;
  updateTime: string;
  updateName: string;
  updateBy: number;
  softServiceId: number;
  softServiceName: string;
  softServiceCategory: string;
  softServiceLogo: string;
  softServiceInstallCommand: string;
  softServiceUninstallCommand: string;
  softServiceStartCommand: string;
  softServiceStopCommand: string;
  softServiceRestartCommand: string;
  softServiceInstalledCommand: string;
  softServiceRemark: string;
  softServiceVersion: string;
  softServiceDownloadUrl: string;
  softServiceTags: string;
  softServiceOs: string;
  softServiceLogPath?: string; // 日志文件路径
  sshId: string;
  isInstalled: boolean;
  installedServers?: InstalledServer[]; // 安装这个服务的设备列表
  installCount: number;
  favoriteCount: number;
  versions?: SoftServiceVersion[]; // 软件版本列表
  abstractChannelSession?: string; // 状态命令
  softServiceStatusCheckSuccessFlag?: string; // 服务状态检查成功标识
  // 命令类型：0-单行命令，1-脚本
  softServiceInstallCommandType?: number;
  softServiceUninstallCommandType?: number;
  softServiceStartCommandType?: number;
  softServiceStopCommandType?: number;
  softServiceRestartCommandType?: number;
  softServiceStatusCheckCommandType?: number;

  // 命令执行成功和失败标识
  softServiceStatusCheckFailureFlag?: string; // 服务状态检查失败标识
  softServiceInstallSuccessFlag?: string; // 安装成功标识
  softServiceInstallFailureFlag?: string; // 安装失败标识
  softServiceUninstallSuccessFlag?: string; // 卸载成功标识
  softServiceUninstallFailureFlag?: string; // 卸载失败标识
  softServiceStartSuccessFlag?: string; // 启动成功标识
  softServiceStartFailureFlag?: string; // 启动失败标识
  softServiceStopSuccessFlag?: string; // 停止成功标识
  softServiceStopFailureFlag?: string; // 停止失败标识
  softServiceRestartSuccessFlag?: string; // 重启成功标识
  softServiceRestartFailureFlag?: string; // 重启失败标识

  // 状态检查命令
  softServiceStatusCheckCommand?: string; // 状态检查命令

  // 是否收藏
  isFavorite?: boolean; // 是否收藏
}

// 定义部分软件服务类型，所有字段都是可选的
export interface PartialSoftService {
  softServiceId?: number;
  softServiceName?: string;
  softServiceVersion?: string;
  softServiceCategory?: string;
  softServiceLogo?: string;
  softServiceRemark?: string;
  softServiceOs?: string;
  softServiceDownloadUrl?: string;
  softServiceInstallCommand?: string;
  softServiceUninstallCommand?: string;
  softServiceStartCommand?: string;
  softServiceStopCommand?: string;
  softServiceRestartCommand?: string;
  softServiceInstalledCommand?: string;
  softServiceLogPath?: string; // 日志文件路径
  softServiceTags?: string;
  installCount?: number;
  favoriteCount?: number;
  requirements?: string;
  installPath?: string;
  port?: string | number;
  installedServers?: any[];
  versions?: SoftServiceVersion[];
  abstractChannelSession?: string; // 状态命令
  softServiceStatusCheckSuccessFlag?: string; // 服务状态检查成功标识
  softServiceStatusCheckFailureFlag?: string; // 服务状态检查失败标识
  softServiceInstallSuccessFlag?: string; // 安装成功标识
  softServiceInstallFailureFlag?: string; // 安装失败标识
  softServiceUninstallSuccessFlag?: string; // 卸载成功标识
  softServiceUninstallFailureFlag?: string; // 卸载失败标识
  softServiceStartSuccessFlag?: string; // 启动成功标识
  softServiceStartFailureFlag?: string; // 启动失败标识
  softServiceStopSuccessFlag?: string; // 停止成功标识
  softServiceStopFailureFlag?: string; // 停止失败标识
  softServiceRestartSuccessFlag?: string; // 重启成功标识
  softServiceRestartFailureFlag?: string; // 重启失败标识
}

/**
 * 收藏
 */
export const fetchSoftServiceFavorite = (params: any) => {
  return http.request("post", `v1/soft/service/favorite/${params.softServiceId}`);
};
/**
 * 获取软服务分页数据
 *
 * 该方法用于发起 GET 请求，获取指定查询参数的软服务分页信息。
 * 请求路径为 `/v1/soft/service/page`，参数通过 `params` 对象传递。
 *
 * @param params - 请求参数对象，通常包含分页信息（如 pageNum、pageSize）及其他过滤条件
 * @returns 返回一个 Promise，解析后得到请求结果数据
 */
export const fetchSoftServicePage = (params: any) => {
  return http.request("get", "/v1/soft/service/page", { params });
};

/**
 * 保存软服务
 *
 * 该方法用于发起 POST 请求，保存软服务信息。
 * 请求路径为 `/v1/soft/service/save`，参数通过 `params` 对象传递。
 *
 * @param params - 软服务信息对象，包含保存的软服务数据
 * @returns 返回一个 Promise，解析后得到保存结果数据
 */
export const fetchSoftServiceSave = (params: PartialSoftService) => {
  return http.request("post", "/v1/soft/service/save", { data: params });
};

/**
 * 更新软服务
 *
 * 该方法用于发起 PUT 请求，更新软服务信息。
 * 请求路径为 `/v1/soft/service/update`，参数通过 `params` 对象传递。
 *
 * @param params - 软服务信息对象，包含更新后的软服务数据
 * @returns 返回一个 Promise，解析后得到更新结果数据
 */
export const fetchSoftServiceUpdate = (params: PartialSoftService) => {
  return http.request("put", "/v1/soft/service/update", { data: params });
};
/**
 * 删除软服务
 *
 * 该方法用于发起 DELETE 请求，删除指定软服务。
 * 请求路径为 `/v1/soft/service/delete`，参数通过 `params` 对象传递。
 *
 * @param params - 请求参数对象，通常包含软服务 ID
 * @returns 返回一个 Promise，解析后得到删除结果数据
 */
export const fetchSoftServiceDelete = (params: any) => {
  return http.request("delete", "/v1/soft/service/delete", { params });
};

/**
 * 获取软服务详情
 *
 * 该方法用于发起 GET 请求，获取指定ID的软服务详细信息。
 * 请求路径为 `/v1/soft/service/get`，参数通过 `params` 对象传递。
 *
 * @param params - 请求参数对象，通常包含软服务 ID (softServiceId)
 * @returns 返回一个 Promise，解析后得到软服务详情数据
 */
export const fetchSoftServiceGet = (params: { softServiceId: number }) => {
  return http.request("get", "/v1/soft/service/get", { params });
};
