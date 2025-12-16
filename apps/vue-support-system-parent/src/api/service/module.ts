import { http, type ReturnResult, type PageResult } from "@repo/utils";

/**
 * 服务模块信息
 */
export interface SysServiceModule {
  /** 服务模块ID */
  sysServiceModuleId?: number;
  /** 服务模块名称 */
  sysServiceModuleName: string;
  /** 服务模块编码 */
  sysServiceModuleCode: string;
  /** 服务模块描述 */
  sysServiceModuleDesc?: string;
  /** 服务模块排序 */
  sysServiceModuleSort?: number;
  /** 服务模块状态: 0-启用, 1-禁用 */
  sysServiceModuleStatus?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}

/**
 * 服务模块查询参数
 */
export interface ServiceModuleQueryParams {
  /** 服务模块名称 */
  sysServiceModuleName?: string;
  /** 服务模块编码 */
  sysServiceModuleCode?: string;
  /** 状态 */
  sysServiceModuleStatus?: number;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 分页查询服务模块
 * @param params 查询参数
 */
export const fetchPageServiceModule = (params?: ServiceModuleQueryParams) => {
  return http.request<PageResult<SysServiceModule>>("get", "/v2/service/module/page", {
    params,
  });
};

/**
 * 获取服务模块列表
 * @param params 查询参数
 */
export const fetchListServiceModule = (params?: ServiceModuleQueryParams) => {
  return http.request<ReturnResult<SysServiceModule[]>>("get", "/v2/service/module/list", {
    params,
  });
};

/**
 * 获取服务模块详情
 * @param sysServiceModuleId 服务模块ID
 */
export const fetchGetServiceModule = (sysServiceModuleId: number) => {
  return http.request<ReturnResult<SysServiceModule>>("get", "/v2/service/module/get", {
    params: { sysServiceModuleId },
  });
};

/**
 * 新增服务模块
 * @param data 服务模块数据
 */
export const fetchSaveServiceModule = (data: SysServiceModule) => {
  return http.request<ReturnResult<SysServiceModule>>("post", "/v2/service/module/save", {
    data,
  });
};

/**
 * 更新服务模块
 * @param data 服务模块数据
 */
export const fetchUpdateServiceModule = (data: SysServiceModule) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/service/module/update", {
    data,
  });
};

/**
 * 删除服务模块
 * @param sysServiceModuleId 服务模块ID
 */
export const fetchDeleteServiceModule = (sysServiceModuleId: number) => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/service/module/delete", {
    params: { sysServiceModuleId },
  });
};

/**
 * 更新服务模块状态
 * @param sysServiceModuleId 服务模块ID
 * @param status 状态: 0-启用, 1-禁用
 */
export const fetchUpdateServiceModuleStatus = (sysServiceModuleId: number, status: number) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/service/module/status", {
    params: { sysServiceModuleId, status },
  });
};

/**
 * 服务模块统计数据
 */
export interface ServiceModuleStats {
  total: number;
  enabled: number;
  disabled: number;
  apiCount: number;
  serviceCount: number;
}

/**
 * 获取服务模块统计数据
 */
export const fetchServiceModuleStats = () => {
  return http.request<ReturnResult<ServiceModuleStats>>("get", "/v2/service/module/stats");
};
