import { http, type ReturnResult, type PageResult } from "@repo/utils";

/**
 * 服务信息
 */
export interface SysService {
  /** 服务ID */
  sysServiceId?: number;
  /** 服务名称 */
  sysServiceName: string;
  /** 服务编码 */
  sysServiceCode: string;
  /** 服务描述 */
  sysServiceDesc?: string;
  /** 服务排序 */
  sysServiceSort?: number;
  /** 服务状态: 0-启用, 1-禁用 */
  sysServiceStatus?: number;
  /** 服务图片 */
  sysServiceImage?: string;
  /** 关联的模块ID列表 */
  sysServiceTags?: number[];
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}

/**
 * 服务查询参数
 */
export interface ServiceQueryParams {
  /** 服务名称 */
  sysServiceName?: string;
  /** 服务编码 */
  sysServiceCode?: string;
  /** 状态 */
  sysServiceStatus?: number;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 分页查询服务
 * @param params 查询参数
 */
export const fetchPageService = (params?: ServiceQueryParams) => {
  return http.request<PageResult<SysService>>("get", "/v2/service/page", {
    params,
  });
};

/**
 * 获取服务列表
 * @param params 查询参数
 */
export const fetchListService = (params?: ServiceQueryParams) => {
  return http.request<ReturnResult<SysService[]>>("get", "/v2/service/list", {
    params,
  });
};

/**
 * 获取服务详情
 * @param sysServiceId 服务ID
 */
export const fetchGetService = (sysServiceId: number) => {
  return http.request<ReturnResult<SysService>>("get", "/v2/service/get", {
    params: { sysServiceId },
  });
};

/**
 * 新增服务
 * @param data 服务数据
 */
export const fetchSaveService = (data: SysService) => {
  return http.request<ReturnResult<SysService>>("post", "/v2/service/save", {
    data,
  });
};

/**
 * 更新服务
 * @param data 服务数据
 */
export const fetchUpdateService = (data: SysService) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/service/update", {
    data,
  });
};

/**
 * 删除服务
 * @param sysServiceId 服务ID
 */
export const fetchDeleteService = (sysServiceId: number) => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/service/delete", {
    params: { sysServiceId },
  });
};

/**
 * 更新服务状态
 * @param sysServiceId 服务ID
 * @param status 状态: 0-启用, 1-禁用
 */
export const fetchUpdateServiceStatus = (sysServiceId: number, status: number) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/service/status", {
    params: { sysServiceId, status },
  });
};

/**
 * 绑定服务与模块
 * @param data 服务数据（包含服务ID和模块ID列表）
 */
export const fetchBindServiceModules = (data: { sysServiceId: number; sysServiceTags: number[] }) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/service/bind", {
    data,
  });
};

/**
 * 服务统计数据
 */
export interface ServiceStats {
  total: number;
  enabled: number;
  disabled: number;
}

/**
 * 获取服务统计数据
 */
export const fetchServiceStats = () => {
  return http.request<ReturnResult<ServiceStats>>("get", "/v2/service/stats");
};
