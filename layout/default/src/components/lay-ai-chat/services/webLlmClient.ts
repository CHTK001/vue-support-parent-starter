/**
 * WebLLM 本地推理客户端
 * @description 使用 @mlc-ai/web-llm 在浏览器端运行大模型，无需服务器
 */

import type { ChatMessage } from "../types";

/** 默认 MLC 模型（轻量，适合浏览器） */
const DEFAULT_WEB_LLM_MODEL = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

/** 推理最大 token 数 */
const MAX_NEW_TOKENS = 512;

/** 模型引擎单例 */
let engine: any = null;
let loadedModelId = "";
let loadingPromise: Promise<void> | null = null;

/**
 * 解析模型 ID，空值时回退到默认模型
 */
function resolveModel(model?: string): string {
  const trimmed = (model || "").trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_WEB_LLM_MODEL;
}

/**
 * 确保 WebLLM 引擎已加载指定模型
 * @param model 模型 ID（可选，默认使用 DEFAULT_WEB_LLM_MODEL）
 */
export async function ensureWebLlmLoaded(model?: string): Promise<void> {
  const modelId = resolveModel(model);

  // 已加载相同模型，直接返回
  if (engine && loadedModelId === modelId) {
    return;
  }

  // 正在加载中，等待完成
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      // 动态导入，避免打包时强制依赖
      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
      engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (progress: any) => {
          console.log(
            `[AI][WebLLM] 模型加载进度: ${progress.text ?? ""}`,
            progress.progress ?? "",
          );
        },
      });
      loadedModelId = modelId;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * 使用 WebLLM 生成回复
 * @param history 历史消息
 * @param message 当前用户消息
 * @param model 模型 ID（可选）
 */
export async function generateByWebLlm(
  history: ChatMessage[],
  message: string,
  model?: string,
): Promise<string> {
  await ensureWebLlmLoaded(model);

  if (!engine) {
    throw new Error("WebLLM 引擎初始化失败");
  }

  // 构建 OpenAI 格式的消息列表
  const messages: Array<{ role: string; content: string }> = [
    {
      role: "system",
      content: "你是内嵌在管理后台中的中文 AI 助手，需要用简体中文回答问题。",
    },
    ...history.map((item) => ({
      role: item.role === "user" ? "user" : "assistant",
      content: item.content,
    })),
    { role: "user", content: message },
  ];

  const reply = await engine.chat.completions.create({
    messages,
    max_tokens: MAX_NEW_TOKENS,
    temperature: 0.7,
  });

  const content = reply.choices?.[0]?.message?.content ?? "";
  return content.trim() || "抱歉，我无法生成回复。";
}
