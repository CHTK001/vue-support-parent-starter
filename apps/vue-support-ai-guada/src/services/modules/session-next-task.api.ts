import type { ApiContext } from "./api-context";

/**
 * 一条「AI 建议的下一步任务」。
 *
 * 字段名与后端 `SessionNextTaskService.NextTask` 一一对应。
 */
export interface SessionNextTaskItem {
  /** 任务标题（可点击执行的那句话） */
  title: string;
  /** 一句话说明 */
  detail: string;
  /** 展示顺序，从 1 开始 */
  order: number;
}

/**
 * 会话「AI 联想下一个任务」的状态。
 *
 * 语义要点：`enabled` 是**该会话生效值**（会话保留自己的原值，
 * 管理员后续改默认值不回溯改写已有会话）；`defaultValue` 只用于展示
 * 「跟随默认：开/关」，不代表本会话当前生效值。
 */
export interface SessionNextTaskState {
  /** 该会话是否开启联想 */
  enabled: boolean;
  /** 该值是否已钉在会话上 */
  pinned: boolean;
  /** 当前默认值 */
  defaultValue: boolean;
  /** 已联想出的任务列表 */
  tasks: SessionNextTaskItem[];
  /** 联想生成时间（毫秒；未生成过为 null） */
  generatedAt: number | null;
  /** 生成时依据的最后一条消息 id（未生成过为 null） */
  basedOnMessageId: number | null;
  /** 不可用时的原因文案（正常时为 null） */
  message: string | null;
}

/**
 * 会话「AI 联想下一个任务」接口。
 *
 * 三个方法都是「宁可报空态也不假装成功」：后端未上线时抛 404，
 * 由面板自行降级为不渲染，而不是显示一个假的联想结果。
 */
export interface SessionNextTaskApi {
  /**
   * 读取会话的联想状态（服务端会在会话无取值时钉住当前默认值）。
   *
   * @param sessionId 会话标识
   * @returns 联想状态
   */
  fetchSessionNextTaskState(sessionId: string): Promise<SessionNextTaskState>;

  /**
   * 设置该会话的联想开关。
   *
   * @param sessionId 会话标识
   * @param enabled   true/false 写入会话；null 表示解除钉住、回到跟随默认值
   * @returns 设置后的状态
   */
  saveSessionNextTaskEnabled(
    sessionId: string,
    enabled: boolean | null,
  ): Promise<SessionNextTaskState>;

  /**
   * 重新联想下一步任务（服务端同步调用一次模型）。
   *
   * @param sessionId 会话标识
   * @returns 联想后的状态
   */
  refreshSessionNextTask(sessionId: string): Promise<SessionNextTaskState>;
}

export const sessionNextTaskApi: SessionNextTaskApi = {
  async fetchSessionNextTaskState(this: ApiContext, sessionId) {
    return await this._request<SessionNextTaskState>(
      `/sessions/${encodeURIComponent(sessionId)}/ai-next-task`,
    );
  },

  async saveSessionNextTaskEnabled(this: ApiContext, sessionId, enabled) {
    return await this._request<SessionNextTaskState>(
      `/sessions/${encodeURIComponent(sessionId)}/ai-next-task`,
      { method: "PUT", data: { enabled } },
    );
  },

  async refreshSessionNextTask(this: ApiContext, sessionId) {
    return await this._request<SessionNextTaskState>(
      `/sessions/${encodeURIComponent(sessionId)}/ai-next-task/refresh`,
      { method: "POST" },
    );
  },
};