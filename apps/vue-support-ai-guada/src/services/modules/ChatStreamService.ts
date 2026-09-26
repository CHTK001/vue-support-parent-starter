/**
 * 流式对话服务
 * 封装 chat 流式生成器及相关取消/中止逻辑
 *
 * 支持多客户端订阅和断线重连：
 * - 刷新页面后可自动重新订阅到同一会话的活跃流
 * - 同一会话的多个窗口可以实时同步流式输出
 *
 * 流式与普通请求都通过 @/framework/context 的请求模块客户端发出（底层 @repo/utils Http，
 * 复用框架鉴权拦截器），不再手写 fetch 与 Authorization 头。
 */

import type { StreamEvent } from "@/types/service";
import { getClientId } from "@/utils/clientId";
import { t } from "@/locales";
import { createClient, httpAt } from "@/framework/context";
import type { HttpClient } from "@/framework/context";
import { chatSocketManager } from "./ChatSocketManager";

/**
 * 流式对话参数
 */
export interface ChatStreamParams {
  sessionId: string;
  regenerationMode?: string | null;
  assistantMessageId?: string | null;
  resumeData?: any;
  lastContentId?: string | null;
  // 用户消息参数
  // overwrite 模式：按需设置 content/files/replaceMessageId/knowledgeBaseIds，不设置 id
  // multi_version/resume/subscribe 模式：只需设置 id
  userMessage?: {
    id?: string;
    content?: string;
    files?: string[];
    replaceMessageId?: string;
    knowledgeBaseIds?: string[];
  };
  think?: boolean;
  search?: boolean;
  model?: string;
  skillNames?: string[];
  // 当前会话绑定的角色（助手）id，后端据此加载角色人设 systemPrompt
  characterId?: string | null;
  // 运行模式：build（默认，允许执行工具/动作）或 plan（只读规划，首轮不产生副作用）；仅管理员经 Agent 生效
  mode?: string | null;
  // 传输方式：auto（优先 WS，失败降级 SSE，默认）/ ws / sse
  transport?: "auto" | "ws" | "sse";
}

/**
 * 人工确认恢复参数
 */
export interface ResumeStreamParams {
  sessionId: string;
  replyId: string;
  // 决策列表：每项对应一个待确认工具
  decisions: Array<{ toolCallId: string; confirmed: boolean }>;
  model?: string;
  characterId?: string | null;
  think?: boolean;
  // 用户修改意见（规划模式「需要修改」），可空
  feedback?: string;
}

export class ChatStreamService {
  /** 每个会话一个活跃 SSE 客户端，close() 即中止本地流 */
  private clientMap: Map<string, { close: () => void }>;
  private client: HttpClient;

  constructor(private getBaseURL: () => string) {
    this.clientMap = new Map();
    // 不解包：调用方沿用「拿后端响应体」的既有契约
    this.client = createClient(
      () => httpAt(this.getBaseURL(), { "X-Client-Id": getClientId() }),
      { unwrap: false },
    );
  }

  /**
   * 流式对话生成器
   *
   * 支持两种模式：
   * - 发起模式（默认）：regenerationMode 不为 'subscribe'，如果会话已有活跃流则报错
   * - 订阅模式：regenerationMode === 'subscribe'，订阅已有流（用于刷新重连/多窗口观察）
   *
   * 通过 regenerationMode 参数区分，避免竞态条件（不先 check 再请求，而是直接带 regenerationMode 请求）。
   */
  async *chat(params: ChatStreamParams): AsyncGenerator<StreamEvent, void, unknown> {
    const {
      sessionId,
      regenerationMode = null,
      assistantMessageId = null,
      resumeData,
      lastContentId,
      userMessage,
      think,
      search,
      model,
      skillNames,
      characterId = null,
      mode = null,
      transport = "auto",
    } = params;

    const isSubscribeMode = regenerationMode === "subscribe";

    // 发起模式时先关闭同一会话的本地流，避免重复连接
    if (!isSubscribeMode) {
      this.cancelLocalFetch(sessionId);
    }

    const queue: StreamEvent[] = [];
    let failure: unknown = null;
    let ended = false;
    let wake: (() => void) | null = null;
    const notify = () => {
      const pending = wake;
      wake = null;
      pending?.();
    };

    const chatRequestId = `${sessionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const requestBody = {
      sessionId,
      assistantMessageId,
      regenerationMode,
      stream: true,
      resumeData,
      lastContentId,
      userMessage,
      think,
      search,
      model,
      skillNames,
      characterId,
      mode,
      chatRequestId,
    };

    let cleanup: () => void = () => {};

    const startSse = () => {
      const streamClient = this.client.sse<StreamEvent>("/chat/stream", {
        method: "POST",
        body: requestBody,
        // 后端一次请求对应一次 Agent 运行，不做自动重连（重连会重复触发）
        reconnect: false,
        credentials: "same-origin",
        onMessage: (event) => {
          const data = event.data as unknown;
          // 执行轨迹（agentscope 全量日志）：以独立事件类型透传给 UI
          if (event.event === "trace") {
            if (typeof data === "object" && data !== null) {
              queue.push({ type: "trace", trace: data } as StreamEvent);
              notify();
            }
            return;
          }
          if (data === "[DONE]" || data === "") {
            ended = true;
            notify();
            return;
          }
          if (typeof data !== "object" || data === null) {
            console.error("[ChatStream] 事件数据解析失败:", data);
            return;
          }
          queue.push(data as StreamEvent);
          notify();
        },
        onError: (err) => {
          failure = toStreamError(err);
          ended = true;
          notify();
        },
        onClose: () => {
          ended = true;
          notify();
        },
      });
      this.clientMap.set(sessionId, streamClient);
      cleanup = () => {
        streamClient.close();
        if (this.clientMap.get(sessionId) === streamClient) {
          this.clientMap.delete(sessionId);
        }
      };
    };

    const startWs = () => {
      chatSocketManager.register(chatRequestId, {
        frame: (d) => {
          if (d.type === "done") {
            ended = true;
            notify();
            return;
          }
          if (d.type === "trace") {
            if (d.payload && typeof d.payload === "object") {
              queue.push({ type: "trace", trace: d.payload } as StreamEvent);
              notify();
            }
            return;
          }
          if (d.payload && typeof d.payload === "object") {
            queue.push(d.payload as StreamEvent);
            notify();
          }
        },
        error: (d) => {
          failure = new Error(d.message || t("session.api.responseFailed", { status: 0 }));
          ended = true;
          notify();
        },
      });
      chatSocketManager.emitStart(requestBody);
      cleanup = () => chatSocketManager.unregister(chatRequestId);
    };

    if (transport !== "sse") {
      // auto / ws：先只做 WS 握手探测（不发 chat，避免重复落用户消息）；auto 失败降级 SSE
      await chatSocketManager
        .ensureConnected()
        .then(() => startWs())
        .catch((err) => {
          if (transport === "ws") {
            failure = toStreamError(err);
            ended = true;
          } else {
            startSse();
          }
        });
    } else {
      startSse();
    }

    try {
      for (;;) {
        while (queue.length) {
          yield queue.shift() as StreamEvent;
        }
        if (failure) throw failure;
        if (ended) break;
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
      }
      // 收尾：断流前已推送但尚未消费的事件仍要交给调用方
      while (queue.length) {
        yield queue.shift() as StreamEvent;
      }
      if (failure) throw failure;
    } finally {
      cleanup();
    }
  }

  /**
   * 人工确认恢复生成器：POST /chat/resume，订阅恢复后的 SSE 流。
   *
   * 与一次新的 Agent 运行对应，不做自动重连；帧解析与 chat 的 SSE 分支一致。
   */
  async *resume(params: ResumeStreamParams): AsyncGenerator<StreamEvent, void, unknown> {
    const requestBody = {
      sessionId: params.sessionId,
      replyId: params.replyId,
      decisions: params.decisions,
      model: params.model,
      characterId: params.characterId ?? null,
      think: params.think,
      feedback: params.feedback,
    };
    // 关闭规划轮遗留的本地 SSE 客户端，避免连接堆积
    this.cancelLocalFetch(params.sessionId);
    yield* this.runSseStream("/chat/resume", requestBody, params.sessionId);
  }

  /**
   * 通用 SSE 流生成器：连接、队列化事件、收尾关闭。
   */
  private async *runSseStream(
    url: string,
    requestBody: unknown,
    sessionKey: string,
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const queue: StreamEvent[] = [];
    let failure: unknown = null;
    let ended = false;
    let wake: (() => void) | null = null;
    const notify = () => {
      const pending = wake;
      wake = null;
      pending?.();
    };

    const streamClient = this.client.sse<StreamEvent>(url, {
      method: "POST",
      body: requestBody,
      reconnect: false,
      credentials: "same-origin",
      onMessage: (event) => {
        const data = event.data as unknown;
        if (event.event === "trace") {
          if (typeof data === "object" && data !== null) {
            queue.push({ type: "trace", trace: data } as StreamEvent);
            notify();
          }
          return;
        }
        if (data === "[DONE]" || data === "") {
          ended = true;
          notify();
          return;
        }
        if (typeof data !== "object" || data === null) {
          console.error("[ChatStream] 事件数据解析失败:", data);
          return;
        }
        queue.push(data as StreamEvent);
        notify();
      },
      onError: (err) => {
        failure = toStreamError(err);
        ended = true;
        notify();
      },
      onClose: () => {
        ended = true;
        notify();
      },
    });
    this.clientMap.set(sessionKey, streamClient);
    try {
      for (;;) {
        while (queue.length) {
          yield queue.shift() as StreamEvent;
        }
        if (failure) throw failure;
        if (ended) break;
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
      }
      while (queue.length) {
        yield queue.shift() as StreamEvent;
      }
      if (failure) throw failure;
    } finally {
      streamClient.close();
      if (this.clientMap.get(sessionKey) === streamClient) {
        this.clientMap.delete(sessionKey);
      }
    }
  }

  /**
   * 取消本地流（不通知后端停止）
   */
  private cancelLocalFetch(sessionId: string): void {
    const streamClient = this.clientMap.get(sessionId);
    if (streamClient) {
      streamClient.close();
      this.clientMap.delete(sessionId);
    }
  }

  /**
   * 取消指定会话的响应
   *
   * 只通知后端停止 Agent 循环，不中断本地流。
   * 后端会发送 finish 事件后自然关闭 SSE 流，前端能正确收到最终状态。
   */
  async cancelResponse(sessionId: string): Promise<void> {
    try {
      await this.client.post(`/chat/stream/${sessionId}/stop`);
    } catch (error) {
      console.error("Failed to stop stream:", error);
      // 后端 stop 请求失败时，降级为本地中止
      this.cancelLocalFetch(sessionId);
    }
  }

  /**
   * 发送消息（不接收 SSE 流）
   *
   * 用于非活动会话的队列消息发送：只创建用户消息并启动 Agent 循环。
   * 前端通过全局 stream_started/stream_finished 事件感知状态。
   */
  async sendMessage(params: {
    sessionId: string;
    content: string;
    fileIds?: string[];
    knowledgeBaseIds?: string[];
    replaceMessageId?: string;
  }): Promise<{ success: boolean }> {
    try {
      return await this.client.post("/chat/send", params);
    } catch (error: any) {
      const status = error?.response?.status;
      const detail = error?.response?.data?.error ?? error?.msg ?? error?.message;
      if (status === 409) {
        throw new Error("SessionBusyError: " + (detail || "Session is busy"));
      }
      throw new Error(detail || t("session.api.sendFailed", { status }));
    }
  }
}

/** SSE 客户端错误 → 生成器抛出的错误（保留 SessionBusyError 约定） */
function toStreamError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err ?? "");
  if (message.includes("409")) {
    return new Error("SessionBusyError: Session is busy");
  }
  return new Error(message || t("session.api.responseFailed", { status: 0 }));
}
