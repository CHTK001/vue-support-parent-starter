import { http, type ReturnResult } from "@repo/utils";

/**
 * AI 令牌
 */
export interface AiToken {
  sysAiTokenId?: number;
  sysAiTokenName: string;
  sysAiTokenKey?: string;
  sysAiTokenKeyPrefix?: string;
  sysAiTokenStatus?: number;
  sysAiTokenExpireTime?: string;
  sysAiTokenInputFee?: number;
  sysAiTokenOutputFee?: number;
  sysAiTokenTotalInputFee?: number;
  sysAiTokenTotalOutputFee?: number;
  sysAiTokenTotalFee?: number;
  sysAiTokenUseCount?: number;
  sysAiTokenTotalTokens?: number;
  sysAiTokenTodayFee?: number;
  sysAiTokenLastUsedTime?: string;
  sysAiTokenRemark?: string;
  sysAiAppKeyId?: number;
  sysAiTokenAllowedModels?: string;
  sysAiTokenRateLimit?: number;
}

/**
 * AI 余额
 */
export interface AiBalance {
  sysAiBalanceId?: number;
  sysUserId?: number;
  sysAiBalanceAmount?: number;
  sysAiBalanceTotalRecharge?: number;
  sysAiBalanceTotalConsume?: number;
  sysAiBalanceGift?: number;
  sysAiBalanceWarningThreshold?: number;
  sysAiBalanceExpireTime?: string;
  sysAiBalanceStatus?: number;
  sysAiBalanceCurrency?: string;
  sysAiBalanceLastConsumeTime?: string;
}

/**
 * AI 访问日志
 */
export interface AiAccessLog {
  sysAiAccessLogId?: number;
  sysAiTokenId?: number;
  sysAiTokenKeyPrefix?: string;
  sysAiAppKeyId?: number;
  sysAiAppKeyPrefix?: string;
  sysUserId?: number;
  requestId?: string;
  requestTime?: string;
  requestMethod?: string;
  requestPath?: string;
  requestModel?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  inputFee?: number;
  outputFee?: number;
  totalFee?: number;
  cacheSavingFee?: number;
  latencyMs?: number;
  cacheHit?: number;
  status?: string;
  errorCode?: string;
  errorMessage?: string;
  userAgent?: string;
  ipAddress?: string;
  region?: string;
}

/**
 * 令牌统计
 */
export interface AiTokenStatistics {
  totalCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalInputFee: number;
  totalOutputFee: number;
  totalFee: number;
  avgLatencyMs: number;
  cacheHitRate: number;
}

/**
 * 创建令牌请求
 */
export interface CreateTokenRequest {
  name: string;
  inputFee?: number;
  outputFee?: number;
  expireTime?: string;
  appKeyId?: number;
  allowedModels?: string;
  rateLimit?: number;
  remark?: string;
}

/**
 * 充值请求
 */
export interface RechargeRequest {
  amount: number;
  isGift?: boolean;
}

/**
 * 获取令牌列表
 */
export const listAiTokens = async () => {
  return http.request<ReturnResult<AiToken[]>>("get", "/ai/token/list");
};

/**
 * 创建令牌
 */
export const createAiToken = async (data: CreateTokenRequest) => {
  return http.request<ReturnResult<{ token: AiToken; rawKey: string }>>(
    "post",
    "/ai/token/create",
    { data }
  );
};

/**
 * 更新令牌
 */
export const updateAiToken = async (data: AiToken) => {
  return http.request<ReturnResult<AiToken>>("post", "/ai/token/update", { data });
};

/**
 * 删除令牌
 */
export const deleteAiToken = async (tokenId: number) => {
  return http.request<ReturnResult<boolean>>("delete", "/ai/token/delete", {
    params: { tokenId },
  });
};

/**
 * 获取令牌详情
 */
export const getAiTokenDetail = async (tokenId: number) => {
  return http.request<ReturnResult<AiToken>>("get", "/ai/token/detail", {
    params: { tokenId },
  });
};

/**
 * 获取用户余额
 */
export const getAiBalance = async () => {
  return http.request<ReturnResult<AiBalance>>("get", "/ai/token/balance");
};

/**
 * 充值余额
 */
export const rechargeAiBalance = async (data: RechargeRequest) => {
  return http.request<ReturnResult<AiBalance>>("post", "/ai/token/recharge", {
    data,
  });
};

/**
 * 获取令牌统计
 */
export const getAiTokenStatistics = async (
  tokenId?: number,
  startTime?: string,
  endTime?: string
) => {
  return http.request<ReturnResult<AiTokenStatistics>>(
    "get",
    "/ai/token/statistics",
    { params: { tokenId, startTime, endTime } }
  );
};

/**
 * 获取访问日志
 */
export const getAiAccessLogs = async (
  page: number = 1,
  size: number = 20
) => {
  return http.request<ReturnResult<AiAccessLog[]>>(
    "get",
    "/ai/token/access-logs",
    { params: { page, size } }
  );
};

/**
 * 获取今日费用
 */
export const getAiTodayFee = async () => {
  return http.request<ReturnResult<{ todayFee: number }>>(
    "get",
    "/ai/token/today-fee"
  );
};
