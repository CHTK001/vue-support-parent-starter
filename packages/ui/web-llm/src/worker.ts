/**
 * Web LLM Worker
 *
 * 在 Web Worker 中运行 @mlc-ai/web-llm 推理，避免阻塞主线程。
 * 主线程通过 postMessage 发送 "load" / "generate" 消息，worker 处理后回执。
 *
 * 消息协议：
 *   请求：{ type: "load" | "generate" | ..., id: number, payload: ... }
 *   响应：{ type: "loaded" | "result" | "error" | "progress", id?: number, payload: ... }
 *
 * "progress" 消息不含 id，由 useWebLLM 在主线程单独订阅以展示加载进度。
 */

import { CreateMLCEngine } from "@mlc-ai/web-llm";
import type { MLCEngine } from "@mlc-ai/web-llm";

/** 当前加载的引擎实例（worker 内单例） */
let engine: MLCEngine | null = null;
/** 当前已加载的模型 ID */
let loadedModelId = "";

/**
 * 向主线程发送进度消息（无 id，由主线程独立监听）
 */
function postProgress(text: string, progress?: number): void {
  self.postMessage({ type: "progress", payload: { text, progress } });
}

self.onmessage = async (event: MessageEvent) => {
  const { type, id, payload } = event.data ?? {};

  try {
    if (type === "load") {
      const modelId: string = payload?.model;

      // 幂等：已加载相同模型则直接返回成功
      if (engine && loadedModelId === modelId) {
        self.postMessage({ type: "loaded", id, payload: { success: true } });
        return;
      }

      engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (progress) => {
          postProgress(progress.text ?? "", progress.progress);
        },
      });
      loadedModelId = modelId;
      self.postMessage({ type: "loaded", id, payload: { success: true } });
      return;
    }

    if (type === "generate") {
      if (!engine) {
        throw new Error("模型尚未加载，请先发送 load 消息");
      }

      const { messages, maxTokens, temperature } = payload ?? {};
      const reply = await engine.chat.completions.create({
        messages,
        max_tokens: maxTokens ?? 512,
        temperature: temperature ?? 0.7,
      });

      const content = reply.choices?.[0]?.message?.content ?? "";
      self.postMessage({ type: "result", id, payload: { content } });
      return;
    }

    self.postMessage({
      type: "error",
      id,
      payload: { error: `未知消息类型: ${type}` },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: "error", id, payload: { error: message } });
  }
};