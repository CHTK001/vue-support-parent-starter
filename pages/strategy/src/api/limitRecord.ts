import { http, type ReturnResult } from "@repo/utils";

/**
 * 限流记录数据接口
 *
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */
export interface SysLimitRecord {
  /** 限流记录ID */
  sysLimitRecordId?: number;
  /** 限流配置ID */
  sysLimitConfigurationId?: number;
  /** 限流规则名称 */
  sysLimitName?: string;
  /** 接口路径 */
  sysLimitPath?: string;
  /** 限流维度 */
  sysLimitDimension?: string;
  /** 限流键值 */
  sysLimitKey?: string;
  /** 用户ID */
  sysUserId?: number;
  /** 用户名 */
  sysUserName?: string;
  /** 客户端IP */
  clientIp?: string;
  /** 请求方法 */
  requestMethod?: string;
  /** 请求参数 */
  requestParams?: string;
  /** 用户代理 */
  userAgent?: string;
  /** 限流时间 */
  sysLimitTime?: string;
  /** 创建时间 */
  createTime?: string;
}

/**
 * 限流记录查询参数接口
 *
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */
export interface LimitRecordQueryParams {
  /** 接口路径 */
  sysLimitPath?: string;
  /** 限流规则名称 */
  sysLimitName?: string;
  /** 用户ID */
  sysUserId?: number;
  /** 客户端IP */
  clientIp?: string;
  /** 限流时间 */
  sysLimitTime?: string;
  /** 当前页 */
  current?: number;
  /** 每页大小 */
  size?: number;
}

/**
 * 获取限流记录分页列表
 *
 * @param params 查询参数
 * @returns 限流记录分页列表
 */
export const fetchLimitRecordPageForStrategy = (
  params?: LimitRecordQueryParams
): Promise<ReturnResult<{ records: SysLimitRecord[]; total: number }>> => {
  return http.request("get", "/v2/strategy/limit-record/page", { params });
};

/**
 * 保存限流记录
 *
 * @param data 限流记录数据
 * @returns 保存结果
 */
export const saveLimitRecordForStrategy = (
  data: SysLimitRecord
): Promise<ReturnResult<SysLimitRecord>> => {
  return http.request<SysLimitRecord>("post", "/v2/strategy/limit-record/save", {
    data,
  });
};

/**
 * 删除限流记录
 *
 * @param id 限流记录ID
 * @returns 删除结果
 */
export const deleteLimitRecordForStrategy = (
  id: number
): Promise<ReturnResult<boolean>> => {
  return http.request<boolean>("delete", "/v2/strategy/limit-record/delete", {
    params: { id },
  });
};

/**
 * 批量删除限流记录
 *
 * @param ids 限流记录ID列表
 * @returns 删除结果
 */
export const deleteBatchLimitRecordForStrategy = (
  ids: number[]
): Promise<ReturnResult<boolean>> => {
  return http.request<boolean>(
    "delete",
    "/v2/strategy/limit-record/deleteBatch",
    { data: ids }
  );
};
