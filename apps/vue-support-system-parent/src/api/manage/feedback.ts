import { http, type ReturnResult } from "@repo/utils";

/**
 * 意见反馈类型定义
 */
export type Feedback = {
  sysFeedbackId: number;
  sysFeedbackType: string;
  sysFeedbackContent: string;
  sysFeedbackImages: string;
  sysFeedbackStatus: number;
  sysFeedbackDealBy: number;
  sysFeedbackDealName: string;
  sysFeedbackRecoverContent: string;
  sysFeedbackRecoverTime: string;
  sysFeedbackRecoverImages: string;
  createTime: string;
  createBy: string;
};

/**
 * 获取反馈分页列表
 * @param params 查询参数
 * @returns 反馈列表
 */
export const fetchPageFeedback = (params: any) => {
  return http.request<ReturnResult<Feedback[]>>("get", "/v2/feedback/page", {
    params
  });
};

/**
 * 处理反馈问题
 * @param data 反馈数据
 * @returns 处理结果
 */
export const fetchIssueFeedback = (data: any) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/feedback/issue", {
    data
  });
};
