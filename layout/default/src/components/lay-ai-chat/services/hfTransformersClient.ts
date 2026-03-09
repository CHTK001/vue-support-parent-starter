import type { ChatMessage } from "../types";

const DEFAULT_BROWSER_MODEL = "Xenova/Qwen2.5-0.5B-Instruct";
const MAX_NEW_TOKENS = 256;
const DEFAULT_TEMPERATURE = 0.7;
const WORKER_TIMEOUT = 300000; // 5 minutes

// Worker singleton
let worker: Worker | null = null;
let messageIdCounter = 0;
const pendingMessages = new Map<
  number,
  {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: number;
  }
>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./transformers.worker.ts", import.meta.url), {
      type: "module",
    });

    // Set up message listener
    worker.onmessage = (event: MessageEvent) => {
      const { type, id, payload } = event.data;

      if (type === "progress") {
        // Log progress updates
        console.log(
          "[AI][浏览器模型] 加载进度",
          payload?.status,
          payload?.progress ?? "",
        );
        return;
      }

      const pending = pendingMessages.get(id);
      if (!pending) return;

      clearTimeout(pending.timeout);
      pendingMessages.delete(id);

      if (type === "error") {
        pending.reject(new Error(payload.error));
      } else {
        pending.resolve(payload);
      }
    };

    // Set up error listener
    worker.onerror = (error: ErrorEvent) => {
      console.error("[AI][Worker] Error:", error.message);
      // Reject all pending messages
      pendingMessages.forEach((pending) => {
        clearTimeout(pending.timeout);
        pending.reject(new Error(`Worker error: ${error.message}`));
      });
      pendingMessages.clear();
    };
  }

  return worker;
}

function sendWorkerMessage<T>(
  type: string,
  payload: unknown,
  timeout = WORKER_TIMEOUT,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = messageIdCounter++;
    const workerInstance = getWorker();

    const timeoutId = window.setTimeout(() => {
      pendingMessages.delete(id);
      reject(new Error(`Worker message timeout after ${timeout}ms`));
    }, timeout);

    pendingMessages.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
      timeout: timeoutId,
    });

    workerInstance.postMessage({ type, id, payload });
  });
}

function buildPrompt(history: ChatMessage[], current: string): string {
  const parts: string[] = [];

  history.forEach((item) => {
    const role = item.role === "user" ? "用户" : "助手";
    parts.push(`${role}: ${item.content}`);
  });

  parts.push(`用户: ${current}`);
  parts.push("助手:");

  return parts.join("\n");
}

function resolveBrowserModel(model?: string): string {
  const trimmed = (model || "").trim();
  if (trimmed.length === 0) {
    return DEFAULT_BROWSER_MODEL;
  }
  return trimmed;
}

let modelLoaded = false;
let loadingPromise: Promise<void> | null = null;

async function ensureModelLoaded(model?: string): Promise<void> {
  if (modelLoaded) {
    return;
  }
  if (loadingPromise) {
    return loadingPromise;
  }

  const modelId = resolveBrowserModel(model);

  loadingPromise = sendWorkerMessage<{ success: boolean }>("load", {
    model: modelId,
  }).then(() => {
    modelLoaded = true;
    loadingPromise = null;
  });

  return loadingPromise;
}

export async function generateByTransformersJs(
  history: ChatMessage[],
  message: string,
  model?: string,
): Promise<string> {
  // Ensure model is loaded
  await ensureModelLoaded(model);

  // Build prompt using original logic
  const prompt = buildPrompt(history, message);

  // Send generate message to worker
  const response = await sendWorkerMessage<{
    result: Array<{
      generated_text?: string;
      text?: string;
    }>;
  }>("generate", {
    prompt,
    maxNewTokens: MAX_NEW_TOKENS,
    temperature: DEFAULT_TEMPERATURE,
  });

  // Post-process result using original logic
  const result = response.result;
  const first = Array.isArray(result) && result.length > 0 ? result[0] : null;
  const fullText = (first?.generated_text || first?.text || "").trim();

  if (!fullText) {
    return "抱歉，我无法生成回复。";
  }

  if (!fullText.startsWith(prompt)) {
    return fullText;
  }

  return fullText.slice(prompt.length).trim() || fullText;
}
