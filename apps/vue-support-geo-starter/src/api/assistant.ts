/**
 * AI 助手 API
 */
import { http } from "./http"

/**
 * 助手状态
 * @author CH
 * @since 4.0.0
 */
export interface AssistantHealth {
  status: string
  mode: 'desktop' | 'web'
  configured: boolean
  model: string
  knowledge: { version: string; articleCount: number }
}

/**
 * 获取 AI 助手运行状态
 * @returns 助手状态信息
 */
export function getAssistantStatus(): Promise<AssistantHealth> {
  return http.get("/v1/geo/assistant/status")
}

/**
 * 流式聊天（SSE）
 * @param messages 对话消息列表
 * @param onDelta 增量内容回调
 * @param signal 中止信号
 */
export async function streamAssistantChat(
  messages: Array<{ role: string; content: string }>,
  onDelta: (content: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const resp = await fetch("/geo/api/v1/geo/assistant/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, diagnosticContext: null }),
    signal,
  })
  if (!resp.ok || !resp.body) throw new Error(`Assistant API error: ${resp.status}`)

  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      try {
        const event = JSON.parse(line.slice(6))
        if (event.type === "delta" && event.content) onDelta(event.content)
      } catch {
        /* 跳过畸形行 */
      }
    }
  }
}
