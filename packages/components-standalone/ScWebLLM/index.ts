/**
 * ScWebLLM - useWebLLM composable
 * @description 封装 @mlc-ai/web-llm 的 Vue composable，通过 Web Worker 在后台运行推理
 */

import { ref } from "vue";

/** 默认 MLC 模型 */
const DEFAULT_MODEL = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

/** Worker 消息 ID 计数器 */
let messageIdCounter = 0;

/** 待处理消息 Map */
const pendingMessages = new Map<
  number,
  {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeoutId: number;
  }
>();

/** Worker 单例 */
let worker: Worker | null = null;

/**
 * 获取或创建 Worker 实例
 */
function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (event: MessageEvent) => {
      const { type, id, payload } = event.data;

      // 进度消息不需要 resolve
      if (type === "progress") return;

      const pending = pendingMessages.get(id);
      if (!pending) return;

      clearTimeout(pending.timeoutId);
      pendingMessages.delete(id);

      type === "error"
        ? pending.reject(new Error(payload.error))
        : pending.resolve(payload);
    };

    worker.onerror = (err: ErrorEvent) => {
      pendingMessages.forEach((p) => {
        clearTimeout(p.timeoutId);
        p.reject(new Error(`Worker 错误: ${err.message}`));
      });
      pendingMessages.clear();
    };
  }
  return worker;
}

/**
 * 向 Worker 发送消息并等待响应
 */
function sendMessage<T>(
  type: string,
  payload: unknown,
  timeoutMs = 300_000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = messageIdCounter++;
    const timeoutId = window.setTimeout(() => {
      pendingMessages.delete(id);
      reject(new Error(`Worker 消息超时 (${timeoutMs}ms)`));
    }, timeoutMs);

    pendingMessages.set(id, { resolve, reject, timeoutId });
    getWorker().postMessage({ type, id, payload });
  });
}

export interface UseWebLLMOptions {
  /** 模型 ID，默认 Qwen2.5-1.5B-Instruct-q4f16_1-MLC */
  model?: string;
  /** 最大生成 token 数，默认 512 */
  maxTokens?: number;
  /** 温度，默认 0.7 */
  temperature?: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * useWebLLM - 浏览器端本地大模型推理 composable
 *
 * @example
 * ```ts
 * const { loading, generate, loadModel } = useWebLLM({ model: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC' })
 * await loadModel()
 * const reply = await generate([{ role: 'user', content: '你好' }])
 * ```
 */
export function useWebLLM(options: UseWebLLMOptions = {}) {
  const {
    model = DEFAULT_MODEL,
    maxTokens = 512,
    temperature = 0.7,
  } = options;

  /** 是否正在加载模型 */
  const loading = ref(false);
  /** 是否正在推理 */
  const generating = ref(false);
  /** 错误信息 */
  const error = ref<string | null>(null);

  /**
   * 加载模型（幂等，重复调用不会重复加载）
   */
  async function loadModel(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await sendMessage("load", { model });
    } catch (err: any) {
      error.value = err?.message ?? String(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 生成回复
   * @param messages 消息列表（OpenAI 格式）
   */
  async function generate(messages: ChatMessage[]): Promise<string> {
    generating.value = true;
    error.value = null;
    try {
      const result = await sendMessage<{ content: string }>("generate", {
        messages,
        maxTokens,
        temperature,
      });
      return result.content;
    } catch (err: any) {
      error.value = err?.message ?? String(err);
      throw err;
    } finally {
      generating.value = false;
    }
  }

  return { loading, generating, error, loadModel, generate };
}

export default useWebLLM;
