import type { ApiContext } from "./api-context";

/** 优化场景：决定后端选用哪一套内置默认提示词（显式传 systemPrompt 时该字段被忽略） */
export type OptimizeScene = "image" | "video";

/** 优化状态：后端告知「这次到底发生了什么」，避免只凭文本是否变化去猜 */
export type OptimizeStatus =
  /** 模型给出了新文本 */
  | "OK"
  /** 输入为空，未调用模型 */
  | "BLANK"
  /** 管理端关闭了输入优化 */
  | "DISABLED"
  /** 没有可用的优化模型，优化没有真正执行 */
  | "UNAVAILABLE"
  /** 模型返回空内容 */
  | "EMPTY"
  /** 调用异常，已回退原文 */
  | "FAILED"
  /** 模型返回的文本与原文相同 */
  | "UNCHANGED";

/** 提示词优化结果 */
export interface OptimizeResult {
  /** 原始输入 */
  input: string;
  /** 优化后的文本（未成功时为原文） */
  optimized: string;
  /** 实际使用的优化模型 */
  model: string;
  /** 优化耗时（毫秒） */
  elapsedMillis: number;
  /** 优化状态；旧版后端不返回该字段 */
  status?: OptimizeStatus;
}

export interface InputApi {
  /**
   * 用大模型把用户输入改写成更完整的提示词。
   *
   * @param input 待优化的原始输入
   * @param scene 使用场景（图像 / 视频），为空则用后端通用默认提示词
   * @returns 优化结果
   */
  optimizeInput(input: string, scene?: OptimizeScene): Promise<OptimizeResult>;
}

export const inputApi: InputApi = {
  async optimizeInput(this: ApiContext, input, scene) {
    return await this._request<OptimizeResult>("/input/optimize", {
      method: "POST",
      data: { input, scene },
    });
  },
};
