import { http, type ReturnResult } from "@repo/utils";

/**
 * 限流配置数据接口
 *
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */
export interface SysLimitConfiguration {
  /** 限流配置ID */
  sysLimitConfigurationId?: number;
  /** 接口路径 */
  sysLimitPath?: string;
  /** 限流规则名称 */
  sysLimitName?: string;
  /** 每个周期的许可数量 */
  sysLimitForPeriod?: number;
  /** 限制刷新周期（秒） */
  sysLimitRefreshPeriodSeconds?: number;
  /** 获取许可的超时时间（毫秒） */
  sysLimitTimeoutDurationMillis?: number;
  /** 限流维度（GLOBAL, IP, USER, API） */
  sysLimitDimension?: string;
  /** 自定义键表达式（SpEL） */
  sysLimitKeyExpression?: string;
  /** 降级方法名称 */
  sysLimitFallbackMethod?: string;
  /** 错误消息 */
  sysLimitMessage?: string;
  /** 是否启用; 0: 禁用, 1: 启用 */
  sysLimitStatus?: number;
  /** 描述信息 */
  sysLimitDescription?: string;
  /** 排序 */
  sysLimitSort?: number;
  /** 创建人姓名 */
  createName?: string;
  /** 创建人 */
  createBy?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 更新人姓名 */
  updateName?: string;
  /** 更新人 */
  updateBy?: number;
}

/**
 * 限流配置查询参数接口
 *
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */
export interface LimitConfigurationQueryParams {
  /** 接口路径 */
  sysLimitPath?: string;
  /** 限流规则名称 */
  sysLimitName?: string;
  /** 是否启用 */
  sysLimitStatus?: number;
  /** 当前页 */
  current?: number;
  /** 每页大小 */
  size?: number;
}

/**
 * 获取限流配置列表
 *
 * @param params 查询参数
 * @returns 限流配置列表
 */
export const fetchLimitConfigurationListForStrategy = (
  params?: LimitConfigurationQueryParams
): Promise<ReturnResult<SysLimitConfiguration[]>> => {
  return http.request<SysLimitConfiguration[]>(
    "get",
    "/v2/strategy/limit/list",
    { params }
  );
};

/**
 * 获取限流配置分页列表
 *
 * @param params 查询参数
 * @returns 限流配置分页列表
 */
export const fetchLimitConfigurationPageForStrategy = (
  params?: LimitConfigurationQueryParams
): Promise<
  ReturnResult<{ records: SysLimitConfiguration[]; total: number }>
> => {
  return http.request("get", "/v2/strategy/limit/page", { params });
};

/**
 * 获取启用的限流配置
 *
 * @returns 启用的限流配置列表
 */
export const fetchEnabledLimitConfigurationsForStrategy = (): Promise<
  ReturnResult<SysLimitConfiguration[]>
> => {
  return http.request<SysLimitConfiguration[]>(
    "get",
    "/v2/strategy/limit/enabled"
  );
};

/**
 * 保存限流配置
 *
 * @param data 限流配置数据
 * @returns 保存结果
 */
export const saveLimitConfigurationForStrategy = (
  data: SysLimitConfiguration
): Promise<ReturnResult<SysLimitConfiguration>> => {
  return http.request<SysLimitConfiguration>(
    "post",
    "/v2/strategy/limit/save",
    { data }
  );
};

/**
 * 更新限流配置
 *
 * @param data 限流配置数据
 * @returns 更新结果
 */
export const updateLimitConfigurationForStrategy = (
  data: SysLimitConfiguration
): Promise<ReturnResult<boolean>> => {
  return http.request<boolean>("put", "/v2/strategy/limit/update", { data });
};

/**
 * 删除限流配置
 *
 * @param id 限流配置ID
 * @returns 删除结果
 */
export const deleteLimitConfigurationForStrategy = (
  id: number
): Promise<ReturnResult<boolean>> => {
  return http.request<boolean>("delete", "/v2/strategy/limit/delete", {
    params: { id },
  });
};

/**
 * 刷新限流配置
 *
 * @returns 刷新结果
 */
export const refreshLimitConfigurationForStrategy = (): Promise<
  ReturnResult<void>
> => {
  return http.request<void>("post", "/v2/strategy/limit/refresh");
};
