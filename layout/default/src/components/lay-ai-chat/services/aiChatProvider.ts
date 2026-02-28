/**
 * AI 聊天请求分发
 * @description 统一封装不同厂商（Hugging Face / Chrome）的请求方式
 */

import type { AiChatRequest, ChatMessage } from "../types";

const DEFAULT_HF_MODEL = "Qwen/Qwen2.5-1.5B-Instruct";
const HISTORY_LIMIT = 10;

function buildHistoryText(history: ChatMessage[]): string {
  return history
    .slice(-HISTORY_LIMIT)
    .map((item) => `${item.role === "user" ? "用户" : "助手"}: ${item.content}`)
    .join("\n");
}

function normalizeHfModel(raw?: string): string {
  var model = (raw || "").trim();
  return model.length > 0 ? model : DEFAULT_HF_MODEL;
}

function resolveHfUrl(apiUrl: string | undefined, model: string): string {
  var url = (apiUrl || "").trim();
  if (url.length > 0) {
    return url;
  }
  return `https://api-inference.huggingface.co/models/${model}`;
}

function parseHfResponse(data: unknown): string {
  var d = data as any;
  if (Array.isArray(d) && d.length > 0) {
    return String(d[0].generated_text || d[0].text || "");
  }
  if (d && typeof d === "object") {
    if (typeof d.generated_text === "string") {
      return d.generated_text;
    }
    if (typeof d.text === "string") {
      return d.text;
    }
  }
  if (typeof d === "string") {
    return d;
  }
  return "";
}

async function requestByHuggingFace(req: AiChatRequest): Promise<string> {
  var resolvedModel = normalizeHfModel(req.model);
  var url = resolveHfUrl(req.apiUrl, resolvedModel);

  var headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (req.apiKey && req.apiKey.trim().length > 0) {
    headers.Authorization = `Bearer ${req.apiKey.trim()}`;
  }

  var response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      inputs: req.userMessage,
      parameters: {
        max_new_tokens: 512,
        temperature: 0.7,
        top_p: 0.95,
        return_full_text: false,
      },
    }),
  });

  if (!response.ok) {
    var errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // ignore
    }

    if (response.status === 503) {
      throw new Error("模型正在加载中，请稍后再试（约 20 秒）");
    }
    if (response.status === 429) {
      throw new Error("请求过于频繁，请稍后再试");
    }
    if (response.status === 401) {
      throw new Error("API Key 无效或已过期");
    }

    throw new Error(errorData?.error || `请求失败: ${response.status}`);
  }

  var data = await response.json();
  var message = parseHfResponse(data).trim();
  return message.length > 0 ? message : "抱歉，我无法生成回复。";
}

async function requestByChrome(req: AiChatRequest): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var chromeAi = (window as any).ai;
  if (!chromeAi || !chromeAi.languageModel) {
    throw new Error("当前浏览器不支持 Chrome AI 能力，请切换到 Hugging Face 等厂商。");
  }

  var session = await chromeAi.languageModel.create({
    systemPrompt: "你是内嵌在管理后台中的中文 AI 助手，需要用简体中文回答问题。",
  });

  var historyText = buildHistoryText(req.history);
  var fullPrompt = `${historyText}\n用户: ${req.userMessage}\n助手:`;
  var result = await session.prompt(fullPrompt);
  return String(result).trim();
}

export async function requestAiReply(req: AiChatRequest): Promise<string> {
  if (req.vendor === "chrome") {
    return await requestByChrome(req);
  }

  // other / hf：目前统一走 Hugging Face 请求
  return await requestByHuggingFace(req);
}
