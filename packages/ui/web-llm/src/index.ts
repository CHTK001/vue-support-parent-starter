/**
 * useWebLLM —— 浏览器端本地大模型推理 composable
 *
 * 封装 @mlc-ai/web-llm，通过 Web Worker 在后台运行推理，不阻塞主线程。
 * Worker 内 singleton：多个 useWebLLM 调用复用同一个引擎实例。
 *
 * @example
 * ```ts
 * const { loading, generate, loadModel, onProgress } = useWebLLM({
 *   model: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC"
 * });
 *
 * const off = onProgress(({ text, progress }) => {
 *   console.log("loading:", text, progress);
 * });
 *
 * await loadModel();
 * const reply = await generate([{ role: "user", content: "你好" }]);
 * ```
 */

import { onScopeDispose, ref, shallowRef, type Ref } from "vue";
import type {
  ChatMessage,
  UseWebLLMOptions,
  UseWebLLMProgress,
  UseWebLLMReturn,
} from "./types";

/** 默认 MLC 模型 ID */
const DEFAULT_MODEL = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

/** 默认 Worker 消息超时（5 分钟） */
const DEFAULT_TIMEOUT_MS = 300_000;

/* ------------------------------------------------------------------ */
/* 模块级单例：Worker + 消息队列 + 进度订阅                            */
/* ------------------------------------------------------------------ */

/** Worker 消息 ID 计数器（模块级） */
let messageIdCounter = 0;

/** 待处理消息 Map：id → resolve / reject / timeoutId */
type Pending = {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};
const pendingMessages = new Map<number, Pending>();

/** Worker 单例 */
let worker: Worker | null = null;

/** Worker 是否已绑定 message handler */
let workerInitialized = false;

/** 进度订阅者列表 */
const progressHandlers = new Set<(p: UseWebLLMProgress) => void>();

/**
 * 默认 worker 的打包产物地址（由各宿主/打包器按 ?worker 约定生成）
 * 未注入时无法内联启动 worker，需调用方显式传入 workerUrl。
 */
let defaultWorkerUrl: string | URL | null = null;

/**
 * 注入默认 worker 地址（宿主在打包阶段把 new URL("./worker.ts", import.meta.url) 解析后注入）
 *
 * @param url worker 脚本地址
 */
export function setWebLLMWorkerUrl(url: string | URL): void {
  defaultWorkerUrl = url;
}

/**
 * 获取或创建 Worker 实例（模块级单例）
 */
function getWorker(workerUrl?: string | URL): Worker {
  if (worker) return worker;

  const url = workerUrl ?? defaultWorkerUrl;
  if (url) {
    worker = new Worker(url, { type: "module" });
  } else {
    throw new Error(
      "WebLLM worker 地址未注入：请调用 setWebLLMWorkerUrl() 或显式传入 workerUrl",
    );
  }

  worker.onmessage = (event: MessageEvent) => {
    const { type, id, payload } = event.data ?? {};

    // 进度消息：广播给订阅者，无 id
    if (type === "progress") {
      progressHandlers.forEach((h) => {
        try {
          h(payload as UseWebLLMProgress);
        } catch {
          /* ignore handler errors */
        }
      });
      return;
    }

    const pending = pendingMessages.get(id);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    pendingMessages.delete(id);

    if (type === "error") {
      pending.reject(new Error(payload?.error ?? "unknown error"));
    } else {
      pending.resolve(payload);
    }
  };

  worker.onerror = (err: ErrorEvent) => {
    const message = `Worker 错误: ${err.message ?? "unknown"}`;
    pendingMessages.forEach((p) => {
      clearTimeout(p.timeoutId);
      p.reject(new Error(message));
    });
    pendingMessages.clear();
  };

  workerInitialized = true;
  return worker;
}

/**
 * 终止 Worker（unloadModel 调用）
 */
function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    workerInitialized = false;
  }
  pendingMessages.forEach((p) => {
    clearTimeout(p.timeoutId);
    p.reject(new Error("Worker 已终止"));
  });
  pendingMessages.clear();
}

/**
 * 向 Worker 发送消息并等待响应（带超时）
 */
function sendMessage<T>(
  type: string,
  payload: unknown,
  timeoutMs: number,
  workerUrl?: string | URL,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = messageIdCounter++;
    const timeoutId = setTimeout(() => {
      pendingMessages.delete(id);
      reject(new Error(`Worker 消息超时 (${timeoutMs}ms)`));
    }, timeoutMs);

    pendingMessages.set(id, { resolve: resolve as (v: unknown) => void, reject, timeoutId });
    getWorker(workerUrl).postMessage({ type, id, payload });
  });
}

/* ------------------------------------------------------------------ */
/* composable 主入口                                                   */
/* ------------------------------------------------------------------ */

/**
 * @param options - 配置项
 */
export function useWebLLM(options: UseWebLLMOptions = {}): UseWebLLMReturn {
  const {
    model = DEFAULT_MODEL,
    maxTokens = 512,
    temperature = 0.7,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    workerUrl,
  } = options;

  /** 是否正在加载模型 */
  const loading = ref(false);
  /** 是否正在推理 */
  const generating = ref(false);
  /** 错误信息 */
  const error: Ref<string | null> = ref(null);

  /**
   * 订阅模型加载进度
   * @returns unsubscribe
   */
  function onProgress(handler: (p: UseWebLLMProgress) => void): () => void {
    progressHandlers.add(handler);
    // 触发 worker 创建（提前加载，不阻塞后续 loadModel）
    if (!workerInitialized) getWorker(workerUrl);
    return () => progressHandlers.delete(handler);
  }

  /**
   * 加载模型（幂等，重复调用同一 model 不会重复加载）
   */
  async function loadModel(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await sendMessage("load", { model }, timeoutMs, workerUrl);
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 卸载模型（终止 worker）
   */
  function unloadModel(): void {
    terminateWorker();
    loading.value = false;
    generating.value = false;
  }

  /**
   * 生成回复
   * @param messages 消息列表（OpenAI 格式）
   */
  async function generate(messages: ChatMessage[]): Promise<string> {
    generating.value = true;
    error.value = null;
    try {
      const result = await sendMessage<{ content: string }>(
        "generate",
        { messages, maxTokens, temperature },
        timeoutMs,
        workerUrl,
      );
      return result.content ?? "";
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      generating.value = false;
    }
  }

  // composable 销毁时（Vue effect scope 内）清理进度订阅
  onScopeDispose(() => {
    // 注意：worker 是模块级单例，不在 effect 销毁时终止，
    // 但需要取消订阅避免内存泄漏
    progressHandlers.clear();
  });

  return { loading, generating, error, onProgress, loadModel, unloadModel, generate };
}

export default useWebLLM;