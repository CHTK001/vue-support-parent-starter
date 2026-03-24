import { http, type ReturnResult, type PageResult } from "@repo/utils";

/**
 * 限流记录数据接口
 * @author CH
 * @since 2025/9/28
 * @version 1.0.0
 */
export interface SysLimitRecord {
  /** 限流记录ID */
  sysLimitRecordId?: number;
  /** 限流配置ID */
  sysLimitConfigurationId?: number;
  /** 接口路径 */
  sysLimitPath?: string;
  /** 限流规则名称 */
  sysLimitName?: string;
  /** 限流维度（GLOBAL, IP, USER, API） */
  sysLimitDimension?: string;
  /** 限流键值（如IP地址、用户ID等） */
  sysLimitKey?: string;
  /** 限流时间 */
  sysLimitTime?: string;
  /** 用户ID */
  sysUserId?: number;
  /** 用户名 */
  sysUserName?: string;
  /** 客户端IP */
  clientIp?: string;
  /** 请求URL */
  requestUrl?: string;
  /** 请求方法 */
  requestMethod?: string;
  /** 用户代理 */
  userAgent?: string;
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
 * 限流记录查询参数接口
 * @author CH
 * @since 2025/9/28
 * @version 1.0.0
 */
export interface LimitRecordQueryParams {
  /** 接口路径，可选参数 */
  sysLimitPath?: string;
  /** 限流规则名称，可选参数 */
  sysLimitName?: string;
  /** 用户ID，可选参数 */
  sysUserId?: number;
  /** 客户端IP，可选参数 */
  clientIp?: string;
  /** 限流时间起始，可选参数 */
  sysLimitTime?: string;
  /** 当前页码 */
  current?: number;
  /** 每页大小 */
  size?: number;
}

/**
 * 获取限流记录分页列表
 * @param params 查询参数
 * @returns 限流记录分页列表
 * @author CH
 * @since 2025/9/28
 * @version 1.0.0
 */
export const fetchLimitRecordPage = (params?: LimitRecordQueryParams): Promise<ReturnResult<PageResult<SysLimitRecord>>> => {
  return http.request<PageResult<SysLimitRecord>>("get", "/v2/limit/record/page", { params });
};

/**
 * 删除限流记录
 * @param sysLimitRecordId 限流记录ID
 * @returns 删除结果
 * @author CH
 * @since 2025/9/28
 * @version 1.0.0
 */
export const deleteLimitRecord = (sysLimitRecordId: number): Promise<ReturnResult<boolean>> => {
  const params = { sysLimitRecordId };
  return http.request<boolean>("delete", "/v2/limit/record/delete", { params });
};

/**
 * 批量删除限流记录
 * @param ids 限流记录ID列表
 * @returns 删除结果
 * @author CH
 * @since 2025/9/28
 * @version 1.0.0
 */
export const deleteBatchLimitRecord = (ids: number[]): Promise<ReturnResult<boolean>> => {
  return http.request<boolean>("delete", "/v2/limit/record/deleteBatch", { data: ids });
};