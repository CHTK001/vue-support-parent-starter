import { STORAGE_KEY_CLIENT_ID, STREAM_TIMEOUT } from "../config";
import { getMpAppContext } from "@repo/app";
import { getToken, http } from "./http";

/** 流式事件（与 PC 端 StreamEvent 对齐的常用子集，其余字段原样透传） */
export interface StreamEvent {
  type: string;
  [key: string]: any;
}

export interface StreamHandlers {
  /** 收到一条业务事件（create/think/text/tool_call/finish/turn_end…） */
  onEvent: (event: StreamEvent) => void;
  onError: (error: Error) => void;
  /** 流结束（收到 [DONE] 或连接关闭） */
  onDone: () => void;
}

export interface ChatStreamParams {
  sessionId: string;
  /** 用户消息正文 */
  content: string;
  think?: boolean;
  search?: boolean;
}

function getClientId(): string {
  try {
    let id = uni.getStorageSync(STORAGE_KEY_CLIENT_ID) as string;
    if (!id) {
      id = `mp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      uni.setStorageSync(STORAGE_KEY_CLIENT_ID, id);
    }
    return id;
  } catch {
    return "mp-client";
  }
}

/**
 * 当前运行环境是否支持分块响应（SSE 的载体）。
 * 微信基础库 2.20.1+ 才有 request.onChunkReceived / enableChunked。
 */
export function chunkedSupported(): boolean {
  try {
    const can = (uni as any).canIUse?.("request.onChunkReceived");
    if (typeof can === "boolean") return can;
  } catch {
    // 探测失败时按支持处理，真正调用失败再走降级
  }
  return true;
}

/**
 * 增量 UTF-8 解码器：onChunkReceived 给的是 ArrayBuffer（字节流），
 * 多字节中文可能被切在两个 chunk 之间，必须按字节累积解码，否则会乱码。
 */
class Utf8StreamDecoder {
  private pending: number[] = [];

  decode(bytes: Uint8Array): string {
    const all = this.pending.concat(Array.from(bytes));
    this.pending = [];
    let out = "";
    let i = 0;
    while (i < all.length) {
      const b = all[i];
      if (b < 0x80) {
        out += String.fromCharCode(b);
        i += 1;
        continue;
      }
      let need = 0;
      if ((b & 0xe0) === 0xc0) need = 1;
      else if ((b & 0xf0) === 0xe0) need = 2;
      else if ((b & 0xf8) === 0xf0) need = 3;
      if (need === 0) {
        // 非法起始字节，丢弃
        i += 1;
        continue;
      }
      if (i + need >= all.length) {
        // 长度不足：剩余字节留到下一个 chunk
        this.pending = all.slice(i);
        break;
      }
      let cp = b & (need === 1 ? 0x1f : need === 2 ? 0x0f : 0x07);
      let ok = true;
      for (let k = 1; k <= need; k += 1) {
        const cb = all[i + k];
        if ((cb & 0xc0) !== 0x80) {
          ok = false;
          break;
        }
        cp = (cp << 6) | (cb & 0x3f);
      }
      if (!ok) {
        i += 1;
        continue;
      }
      out += String.fromCodePoint(cp);
      i += need + 1;
    }
    return out;
  }
}

/** 解析一个 SSE 块：块内取 data: 行（多行按 SSE 规范以换行合并） */
function parseSseBlock(block: string): { event?: string; data?: string } {
  let event: string | undefined;
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    } else if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    }
  }
  return { event, data: dataLines.length ? dataLines.join("\n") : undefined };
}

/**
 * 发起流式对话：POST /v2/chat/stream（SSE over chunked response）。
 *
 * 小程序没有 EventSource/fetch，用 uni.request 的 enableChunked 分块接收，
 * 请求体与 PC 端 ChatStreamService 完全同构（sessionId + userMessage + stream:true）。
 * 返回 abort 句柄用于中断本地流。
 */
export function streamChat(params: ChatStreamParams, handlers: StreamHandlers): { abort: () => void } {
  const token = getToken();
  const requestBody = {
    sessionId: params.sessionId,
    assistantMessageId: null,
    regenerationMode: null,
    stream: true,
    chatRequestId: `${params.sessionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userMessage: { content: params.content },
    think: params.think ?? false,
    search: params.search ?? false,
  };

  const decoder = new Utf8StreamDecoder();
  let buffer = "";
  let finished = false;
  const finish = (fn: () => void) => {
    if (finished) return;
    finished = true;
    fn();
  };

  const handleData = (data: string) => {
    if (data === "[DONE]") {
      finish(handlers.onDone);
      return;
    }
    if (data === "") {
      // 空数据帧（心跳保活）：忽略；流结束以 [DONE] 或连接关闭为准
      return;
    }
    try {
      const event = JSON.parse(data) as StreamEvent;
      if (event && typeof event === "object" && event.type) {
        handlers.onEvent(event);
      }
    } catch {
      // 心跳等非 JSON 帧，忽略
    }
  };

  const consume = (raw: ArrayBuffer | string) => {
    if (typeof raw === "string") {
      buffer += raw;
    } else {
      buffer += decoder.decode(new Uint8Array(raw));
    }
    buffer = buffer.replace(/\r\n/g, "\n");
    let idx = buffer.indexOf("\n\n");
    while (idx >= 0) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const { data } = parseSseBlock(block);
      if (data !== undefined) handleData(data);
      idx = buffer.indexOf("\n\n");
    }
  };

  const task = uni.request({
    url: `${getMpAppContext().baseUrl}/v2/chat/stream`,
    method: "POST",
    data: requestBody,
    header: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
      "X-Client-Id": getClientId(),
    },
    enableChunked: true,
    timeout: STREAM_TIMEOUT,
    success: (res) => {
      // 连接正常关闭；业务结束以 [DONE] 为准，这里兜底收尾
      if (res.statusCode >= 400) {
        finish(() => handlers.onError(new Error(`请求失败（HTTP ${res.statusCode}）`)));
      } else {
        finish(handlers.onDone);
      }
    },
    fail: (error) => finish(() => handlers.onError(new Error(error?.errMsg || "连接中断"))),
  } as any);

  const chunkedTask = task as any;
  if (typeof chunkedTask.onChunkReceived !== "function") {
    // 环境不支持：立即中断，避免后端白跑一次 Agent
    try {
      chunkedTask.abort();
    } catch {
      // ignore
    }
    throw new Error("当前环境不支持流式响应（enableChunked），已降级为普通发送");
  }
  chunkedTask.onChunkReceived((res: { chunk: ArrayBuffer }) => {
    try {
      consume(res.chunk);
    } catch {
      // 单块解析失败不影响后续块
    }
  });

  return {
    abort: () => {
      try {
        chunkedTask.abort();
      } catch {
        // ignore
      }
    },
  };
}

/**
 * 非流式发送（POST /v2/chat/send，fire-and-forget）：
 * 只投递用户消息并启动 Agent 循环，回复结果由调用方轮询历史消息获取。
 * 作为不支持分块响应环境的降级路径。
 */
export function sendFireAndForget(params: {
  sessionId: string;
  content: string;
}): Promise<{ success?: boolean }> {
  return http.post<{ success?: boolean }>("/chat/send", params);
}
