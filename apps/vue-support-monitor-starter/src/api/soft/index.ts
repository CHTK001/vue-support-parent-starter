import { http, type ReturnResult } from "@repo/utils";

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
  sshId: string;
  isInstalled: boolean;
}

// 定义部分软件服务类型，所有字段都是可选的
export type PartialSoftService = Partial<SoftService> & {
  installPath?: string;
  port?: string;
  requirements?: string;
};
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
