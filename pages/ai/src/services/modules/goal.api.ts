import type { ApiContext } from "./api-context";

/**
 * 会话目标（Issue）状态，与后端 GoalState 枚举一一对应。
 */
export type GoalState =
  | "PENDING"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELED";

/**
 * 会话目标的数据传输对象。
 */
export interface GoalDto {
  id: string;
  sessionId: string;
  title: string;
  detail: string;
  state: GoalState;
  /** 累计消耗令牌 */
  tokensUsed: number;
  /** 已执行轮次 */
  rounds: number;
  /**
   * 令牌预算（目标模式的消耗上限）。
   *
   * 后端尚未返回该字段时按前端默认值（5000）显示，见 stores/goal 的 DEFAULT_GOAL_TOKEN_BUDGET。
   */
  tokenBudget?: number;
  /**
   * 目标创建时的会话令牌基线。
   *
   * 后端没有这个概念（后端只存 tokensUsed），由前端在目标创建后第一次拿到
   * 会话累计令牌时写入：`tokensUsed = 会话累计 - tokensBase`，
   * 这样「目标添加在会话中途」时，计数器不会把目标之前的花费也算进来。
   * null / 缺省表示基线还没采到。
   */
  tokensBase?: number | null;
  updatedAt: number;
}

/**
 * 目标接口。
 *
 * <p>后端端点尚未上线时各方法会抛 404；调用方（goal store）据此降级为本地态，
 * 因此这里只声明契约，不做吞错——把「后端没有」与「后端报错」都交给 store 统一处理。</p>
 *
 * <p>所有请求都带 `silent + noToast`：端点未上线是**已知、可降级**的状态，
 * 不该每次打开会话都在控制台刷 404、也不该给用户弹「资源不存在」。
 * 真正的后端故障仍会抛给 store，只是不再以噪点形式出现。</p>
 */
export interface GoalApi {
  /**
   * 读取会话目标。
   *
   * @param sessionId 会话标识
   * @returns 目标；不存在时后端返回 null / 空
   */
  fetchGoal(sessionId: string): Promise<GoalDto | null>;

  /**
   * 新建或覆盖会话目标。
   *
   * @param sessionId 会话标识
   * @param payload   标题与说明
   * @returns 落库后的目标
   */
  saveGoal(
    sessionId: string,
    payload: { title: string; detail?: string },
  ): Promise<GoalDto>;

  /**
   * 暂停目标。
   *
   * @param sessionId 会话标识
   * @returns 暂停后的目标
   */
  pauseGoal(sessionId: string): Promise<GoalDto>;

  /**
   * 恢复目标。
   *
   * @param sessionId 会话标识
   * @returns 恢复后的目标
   */
  resumeGoal(sessionId: string): Promise<GoalDto>;

  /**
   * 取消目标。
   *
   * @param sessionId 会话标识
   * @param reason    取消原因
   * @returns 取消后的目标
   */
  cancelGoal(sessionId: string, reason?: string): Promise<GoalDto>;
}

export const goalApi: GoalApi = {
  async fetchGoal(this: ApiContext, sessionId) {
    return await this._request<GoalDto | null>(
      `/sessions/${encodeURIComponent(sessionId)}/goal`,
      { silent: true, noToast: true },
    );
  },

  async saveGoal(this: ApiContext, sessionId, payload) {
    return await this._request<GoalDto>(
      `/sessions/${encodeURIComponent(sessionId)}/goal`,
      { method: "PUT", data: payload, silent: true, noToast: true },
    );
  },

  async pauseGoal(this: ApiContext, sessionId) {
    return await this._request<GoalDto>(
      `/sessions/${encodeURIComponent(sessionId)}/goal/pause`,
      { method: "POST", silent: true, noToast: true },
    );
  },

  async resumeGoal(this: ApiContext, sessionId) {
    return await this._request<GoalDto>(
      `/sessions/${encodeURIComponent(sessionId)}/goal/resume`,
      { method: "POST", silent: true, noToast: true },
    );
  },

  async cancelGoal(this: ApiContext, sessionId, reason) {
    return await this._request<GoalDto>(
      `/sessions/${encodeURIComponent(sessionId)}/goal/cancel`,
      { method: "POST", data: { reason }, silent: true, noToast: true },
    );
  },
};
