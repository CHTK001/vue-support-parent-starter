import type { ApiContext } from "./api-context";

/** 优化场景：决定后端选用哪一套内置默认提示词（显式传 systemPrompt 时该字段被忽略） */
export type OptimizeScene = "image" | "video";

/** 提示词优化结果 */
export interface OptimizeResult {
  /** 原始输入 */
  input: string;
  /** 优化后的文本 */
  optimized: string;
  /** 实际使用的优化模型 */
  model: string;
  /** 优化耗时（毫秒） */
  elapsedMillis: number;
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
