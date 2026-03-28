/**
 * ScWebLLM Worker
 * @description 在 Web Worker 中运行 @mlc-ai/web-llm 推理，避免阻塞主线程
 */

import { CreateMLCEngine } from "@mlc-ai/web-llm";
import type { MLCEngine } from "@mlc-ai/web-llm";

/** 当前加载的引擎实例 */
let engine: MLCEngine | null = null;
/** 当前已加载的模型 ID */
let loadedModelId = "";

/**
 * 向主线程发送进度消息
 */
function postProgress(text: string, progress?: number) {
  self.postMessage({ type: "progress", payload: { text, progress } });
}

/**
 * 处理主线程消息
 */
self.onmessage = async (event: MessageEvent) => {
  const { type, id, payload } = event.data;

  try {
    if (type === "load") {
      const modelId: string = payload.model;

      // 已加载相同模型，直接返回成功
      if (engine && loadedModelId === modelId) {
        self.postMessage({ type: "loaded", id, payload: { success: true } });
        return;
      }

      // 加载新模型
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

      const { messages, maxTokens, temperature } = payload;
      const reply = await engine.chat.completions.create({
        messages,
        max_tokens: maxTokens ?? 512,
        temperature: temperature ?? 0.7,
      });

      const content = reply.choices?.[0]?.message?.content ?? "";
      self.postMessage({ type: "result", id, payload: { content } });
      return;
    }

    // 未知消息类型
    self.postMessage({
      type: "error",
      id,
      payload: { error: `未知消息类型: ${type}` },
    });
  } catch (err: any) {
    self.postMessage({
      type: "error",
      id,
      payload: { error: err?.message ?? String(err) },
    });
  }
};
