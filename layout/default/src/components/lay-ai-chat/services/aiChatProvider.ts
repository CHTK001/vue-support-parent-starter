/**
 * AI 聊天请求分发
 * @description 统一封装不同厂商（Hugging Face / Chrome）的请求方式
 */

import type { AiChatRequest, ChatMessage } from "../types";
import { generateByWebLlm } from "./webLlmClient";

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
      inputs: req.systemPrompt
        ? `[系统提示]\n${req.systemPrompt}\n\n${req.userMessage}`
        : req.userMessage,
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

/**
 * 各厂商默认模型映射
 */
const VENDOR_DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-3.5-turbo",
  deepseek: "deepseek-chat",
  qwen: "qwen-turbo",
  siliconflow: "Qwen/Qwen2.5-7B-Instruct",
  zhipu: "glm-4-flash",
  moonshot: "moonshot-v1-8k",
  custom: "gpt-3.5-turbo",
  other: "gpt-3.5-turbo",
};

/**
 * 调用 OpenAI 兼容接口（适用于 openai/deepseek/qwen/siliconflow/zhipu/moonshot 等厂商）
 * @param onChunk 流式回调，每次收到 delta 内容时触发；不传则退化为非流式
 */
async function requestByOpenAICompat(
  req: AiChatRequest,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  var url = (req.apiUrl || "").trim();
  if (!url) {
    throw new Error("未配置 API URL，请在设置中填写厂商 API 地址");
  }

  // 如果 model 是 WebLLM 格式（含 -MLC），替换为厂商默认模型
  var rawModel = (req.model || "").trim();
  var resolvedModel = rawModel.includes("-MLC") || rawModel.length === 0
    ? (VENDOR_DEFAULT_MODELS[req.vendor] ?? "gpt-3.5-turbo")
    : rawModel;

  var headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (req.apiKey && req.apiKey.trim().length > 0) {
    headers.Authorization = `Bearer ${req.apiKey.trim()}`;
  }

  // 构建 messages 数组
  var messages: Array<{ role: string; content: string }> = [];

  if (req.systemPrompt?.trim()) {
    messages.push({ role: "system", content: req.systemPrompt.trim() });
  }

  // 注入历史消息
  for (var item of req.history.slice(-HISTORY_LIMIT)) {
    messages.push({ role: item.role, content: item.content });
  }

  messages.push({ role: "user", content: req.userMessage });

  // 有 onChunk 回调时启用流式模式
  var useStream = typeof onChunk === "function";

  var response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: resolvedModel,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
      stream: useStream,
    }),
  });

  if (!response.ok) {
    var errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // ignore
    }

    if (response.status === 401) {
      throw new Error("API Key 无效或已过期");
    }
    if (response.status === 429) {
      throw new Error("请求过于频繁，请稍后再试");
    }
    if (response.status === 402) {
      throw new Error("账户余额不足，请充值后重试");
    }

    throw new Error(errorData?.error?.message || errorData?.message || errorData?.error || `请求失败: ${response.status}`);
  }

  // 流式模式：逐行解析 SSE
  if (useStream && response.body) {
    var reader = response.body.getReader();
    var decoder = new TextDecoder("utf-8");
    var fullContent = "";
    var buffer = "";

    while (true) {
      var { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      var lines = buffer.split("\n");
      // 最后一行可能不完整，留到下次拼接
      buffer = lines.pop() ?? "";

      for (var line of lines) {
        var trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data:")) continue;

        try {
          var json = JSON.parse(trimmed.slice(5).trim());
          var delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            fullContent += delta;
            onChunk!(delta);
          }
        } catch {
          // 忽略解析失败的行
        }
      }
    }

    return fullContent.trim() || "抱歉，我无法生成回复。";
  }

  // 非流式模式
  var data = await response.json() as any;
  var content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim().length > 0) {
    return content.trim();
  }
  return "抱歉，我无法生成回复。";
}

async function requestByChrome(req: AiChatRequest): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var chromeAi = (window as any).ai;
  if (!chromeAi || !chromeAi.languageModel) {
    throw new Error(
      "当前浏览器不支持 Chrome AI 能力，请切换到 Hugging Face 等厂商。",
    );
  }

  var resolvedSystemPrompt =
    req.systemPrompt?.trim() ||
    "你是内嵌在管理后台中的中文 AI 助手，需要用简体中文回答问题。";

  var session = await chromeAi.languageModel.create({
    systemPrompt: resolvedSystemPrompt,
  });

  var historyText = buildHistoryText(req.history);
  var fullPrompt = `${historyText}\n用户: ${req.userMessage}\n助手:`;
  var result = await session.prompt(fullPrompt);
  return String(result).trim();
}

export async function requestAiReply(
  req: AiChatRequest,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  if (req.vendor === "chrome") {
    return await requestByChrome(req);
  }

  if (req.vendor === "hf") {
    try {
      return await generateByWebLlm(
        req.history,
        req.userMessage,
        req.model,
        req.systemPrompt,
      );
    } catch (error) {
      console.error(
        "[AI][WebLLM] 本地推理失败，回退到 HTTP 接口",
        error,
      );
      return await requestByHuggingFace(req);
    }
  }

  // vendor 模式：使用 OpenAI 兼容接口（支持流式）
  return await requestByOpenAICompat(req, onChunk);
}
