/**
 * AI 应用 HTTP 请求封装
 */
const BASE_URL = "/v2/ai";

const headers: HeadersInit = {
  "Content-Type": "application/json",
};

export async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** AI 对话接口（与 spring-support-ai-starter 对齐） */
export const chatApi = {
  /** 同步对话（演示用，本地 mock，真实接后端请改调用 stream） */
  async send(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(`（本地模拟回复）你说的是：${prompt}`), 400);
    });
  },
};
