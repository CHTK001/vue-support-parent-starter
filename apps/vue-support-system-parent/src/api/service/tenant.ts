import { http, type ReturnResult, type PageResult } from "@repo/utils";

/**
 * 租户信息
 */
export interface SysTenant {
  /** 租户ID */
  sysTenantId?: string;
  /** 租户名称 */
  sysTenantName: string;
  /** 租户账号 */
  sysTenantUsername?: string;
  /** 租户手机 */
  sysTenantPhone?: string;
  /** 租户公司 */
  sysTenantCorporation?: string;
  /** 租户地址 */
  sysTenantAddress?: string;
  /** 租户状态: 0-启用, 1-禁用 */
  sysTenantStatus?: number;
  /** 订阅服务列表 */
  sysTenantService?: TenantService[];
  /** 创建时间 */
  createTime?: string;
}

/**
 * 租户订阅服务
 */
export interface TenantService {
  sysServiceId?: number;
  sysTenantServiceValidTime?: string;
}

/**
 * 租户统计数据
 */
export interface TenantStats {
  total: number;
  enabled: number;
  disabled: number;
  subscribed: number;
}

/**
 * 分页查询租户
 */
export const fetchPageTenant = (params?: any) => {
  return http.request<PageResult<SysTenant>>("get", "/v2/tenant/page", {
    params,
  });
};

/**
 * 获取租户列表
 */
export const fetchListTenant = (params?: any) => {
  return http.request<ReturnResult<SysTenant[]>>("get", "/v2/tenant/list", {
    params,
  });
};

/**
 * 获取租户统计数据
 */
export const fetchTenantStats = () => {
  return http.request<ReturnResult<TenantStats>>("get", "/v2/tenant/stats");
};

/**
 * 同步租户数据
 */
export const fetchSyncTenant = (params: any) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/tenant/sync", {
    data: params,
  });
};

// 别名兼容旧代码
export const feechSyncTenant = fetchSyncTenant;

/**
 * 新增租户
 */
export const fetchSaveTenant = (data: SysTenant) => {
  return http.request<ReturnResult<SysTenant>>("post", "/v2/tenant/save", {
    data,
  });
};

/**
 * 更新租户
 */
export const fetchUpdateTenant = (data: SysTenant) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/tenant/update", {
    data,
  });
};

/**
 * 删除租户
 */
export const fetchDeleteTenant = (params: { sysTenantId: string }) => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/tenant/delete", {
    params,
  });
};

/**
 * 更新租户状态
 */
export const fetchUpdateTenantStatus = (sysTenantId: string, status: number) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/tenant/status", {
    params: { sysTenantId, status },
  });
};

/**
 * 绑定租户服务
 */
export const fetchBindTenantService = (data: any) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/tenant/bind/service", {
    data,
  });
};

// 别名兼容旧代码
export const fetchBindTenant = fetchBindTenantService;
