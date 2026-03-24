import { http, type ReturnResult } from "@repo/utils";

/**
 * 限流配置数据接口
 * @author CH
 * @since 2025/9/28
 * @version 1.0.0
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
 * @author CH
 * @since 2025/9/28
 * @version 1.0.0
 */
export interface LimitConfigurationQueryParams {
  /** 接口路径，可选参数 */
  sysLimitPath?: string;
  /** 限流规则名称，可选参数 */
  sysLimitName?: string;
  /** 是否启用，可选参数 */
  sysLimitStatus?: number;
}

/**
 * 获取限流配置列表
 * @param params 查询参数
 * @returns 限流配置列表
 * @author CH
 * @since 2025/9/28
 * @version 1.0.0
 */
export const fetchLimitConfigurationList = (params?: LimitConfigurationQueryParams): Promise<ReturnResult<SysLimitConfiguration[]>> => {
  return http.request<SysLimitConfiguration[]>("get", "/v2/limit/list", { params });
};

/**
 * 获取限流配置分页列表
 * @param params 查询参数
 * @returns 限流配置分页列表
 * @author CH
 * @since 2025/9/28
 * @version 1.0.0
 */
export const fetchLimitConfigurationPage = (params?: LimitConfigurationQueryParams): Promise<ReturnResult<SysLimitConfiguration[]>> => {
  return http.request<SysLimitConfiguration[]>("get", "/v2/limit/page", { params });
};

/**
 * 保存限流配置
 * @param data 限流配置数据
 * @returns 保存结果
 * @author CH
 * @since 2025/9/28
 * @version 1.0.0
 */
export const saveLimitConfiguration = (data: SysLimitConfiguration): Promise<ReturnResult<SysLimitConfiguration>> => {
  return http.request<SysLimitConfiguration>("post", "/v2/limit/save", { data });
};

/**
 * 更新限流配置
 * @param data 限流配置数据
 * @returns 更新结果
 * @author CH
 * @since 2025/9/28
 * @version 1.0.0
 */
export const updateLimitConfiguration = (data: SysLimitConfiguration): Promise<ReturnResult<boolean>> => {
  return http.request<boolean>("put", "/v2/limit/update", { data });
};

/**
 * 批量更新限流配置
 * @param data 限流配置数据列表
 * @returns 更新结果
 * @author CH
 * @since 2025/9/28
 * @version 1.0.0
 */
export const updateBatchLimitConfiguration = (data: SysLimitConfiguration[]): Promise<ReturnResult<boolean>> => {
  return http.request<boolean>("put", "/v2/limit/updateBatch", { data });
};

/**
 * 删除限流配置
 * @param sysLimitConfigurationId 限流配置ID
 * @returns 删除结果
 * @author CH
 * @since 2025/9/28
 * @version 1.0.0
 */
export const deleteLimitConfiguration = (sysLimitConfigurationId: number): Promise<ReturnResult<boolean>> => {
  const params = { sysLimitConfigurationId };
  return http.request<boolean>("delete", "/v2/limit/delete", { params });
};