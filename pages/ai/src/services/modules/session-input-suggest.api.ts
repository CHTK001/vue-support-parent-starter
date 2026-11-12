import type { ApiContext } from "./api-context";

/**
 * 输入框预测结果。
 *
 * 字段名与后端 `InputSuggestResponse` 一一对应。
 *
 * `suggestion` 为空表示本次没有可用预测（未开启 / 会话没消息 / 模型不可用 /
 * 调用失败 / 模型没给出内容），原因在 `message` 里。预测是辅助能力，
 * 失败时前端静默不展示，不弹错误、不打断输入。
 */
export interface InputSuggestion {
  /** 预测出的下一条消息（可空） */
  suggestion: string;
  /** 实际使用的预测模型 */
  model: string;
  /** 预测耗时（毫秒） */
  elapsedMillis: number;
  /** 不可用时的原因文案（可用时为 null） */
  message: string | null;
}

/**
 * 输入框预测接口。
 *
 * <p>预测结果只作为输入框里的灰字提示：用户按 Tab 才填入，填入后仍是
 * 可编辑草稿，是否发送完全由用户决定。</p>
 */
export interface SessionInputSuggestApi {
  /**
   * 预测该会话输入框里用户下一条最可能发送的消息。
   *
   * @param sessionId 会话标识
   * @param model     当前会话选中的模型（可空；后端按配置与生效模型链解析）
   * @returns 预测结果
   */
  suggestSessionInput(sessionId: string, model?: string | null): Promise<InputSuggestion>;
}

export const sessionInputSuggestApi: SessionInputSuggestApi = {
  async suggestSessionInput(this: ApiContext, sessionId, model) {
    return await this._request<InputSuggestion>(
      `/sessions/${encodeURIComponent(sessionId)}/suggest-input`,
      { method: "POST", data: { model: model || "" } },
    );
  },
};
