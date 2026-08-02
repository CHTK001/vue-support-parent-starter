/**
 * useWebLLM composable 的类型定义
 */

/** 单轮对话消息（OpenAI Chat 格式） */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** useWebLLM 配置项 */
export interface UseWebLLMOptions {
  /** 模型 ID，默认 Qwen2.5-1.5B-Instruct-q4f16_1-MLC */
  model?: string;
  /** 最大生成 token 数，默认 512 */
  maxTokens?: number;
  /** 温度，默认 0.7 */
  temperature?: number;
  /** Worker 消息超时（ms），默认 5 分钟 */
  timeoutMs?: number;
  /**
   * 自定义 worker 入口 URL。
   * 默认 `new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })`
   * 如果打包后 worker 路径解析失败，可传完整 URL 覆盖。
   */
  workerUrl?: string | URL;
}

/** 模型加载进度事件 */
export interface UseWebLLMProgress {
  text: string;
  /** 0 ~ 1 */
  progress?: number;
}

/** useWebLLM 返回值 */
export interface UseWebLLMReturn {
  /** 是否正在加载模型 */
  loading: import("vue").Ref<boolean>;
  /** 是否正在推理 */
  generating: import("vue").Ref<boolean>;
  /** 错误信息 */
  error: import("vue").Ref<string | null>;
  /** 模型加载进度（事件回调形式暴露） */
  onProgress: (handler: (p: UseWebLLMProgress) => void) => () => void;
  /** 加载模型（幂等） */
  loadModel: () => Promise<void>;
  /** 卸载模型 */
  unloadModel: () => void;
  /** 生成回复 */
  generate: (messages: ChatMessage[]) => Promise<string>;
}