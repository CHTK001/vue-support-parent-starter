import type { ApiContext } from "./api-context";

/**
 * 决策模型 API（后端 DecisionProviderController，/v2/decision-providers）。
 *
 * 决策模型是「System one / decisions」协议的独立供应商，与对话模型分属两套接口；
 * 会话选择结果写入 settings.decisionProviderId，由后端在流式准备阶段挂到 Agent 上。
 */

/** 决策供应商条目（后端 DecisionClientRegistry.candidates() 行结构） */
export interface DecisionProvider {
  /** 供应商标识（sys_account_channel.provider_id），写入 settings.decisionProviderId 的值 */
  provider_id?: string;
  name?: string;
  platform?: string;
  /** 决策模型名（渠道 extra.decision_model），可能未配置 */
  model?: string | null;
}

export interface DecisionApi {
  listDecisionProviders(): Promise<DecisionProvider[]>;
}

export const decisionApi: DecisionApi = {
  async listDecisionProviders(this: ApiContext): Promise<DecisionProvider[]> {
    const res = await this._request<any>(`/decision-providers`);
    // 兼容两种形态：拦截器已解包的数组 / 仍带 ReturnResult 外壳的 { data: [...] }
    if (Array.isArray(res)) {
      return res as DecisionProvider[];
    }
    const data = res?.data ?? res?.items;
    return Array.isArray(data) ? (data as DecisionProvider[]) : [];
  },
};
