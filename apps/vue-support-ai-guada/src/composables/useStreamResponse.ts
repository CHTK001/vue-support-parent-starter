/**
 * 流式响应处理 Composable
 * 负责处理 SSE 流式响应的所有逻辑
 */

import { reactive, shallowReactive } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { usePopup } from "@/composables/usePopup";
import { t } from "@/locales";
import { updateTokenStatsFromSSE } from "@/composables/useSessionTokenStats";

// 类型定义
interface StreamingState {
  isStreaming: boolean;
  sessionId: string | null;
  currentMessageId: string | null;
}

interface ContentState {
  isStreaming: boolean;
  isThinking: boolean;
  isSearching?: boolean;
}

interface MessageContent {
  id: string;
  role: string;
  content: string | null;
  reasoningContent: string | null;
  additionalKwargs: any;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  thinkingStartedAt: number | null;
  thinkingDurationMs: number | null;
  searchResults?: Array<{ title: string; url: string }>;
  searchQuery?: string;
  state: ContentState;
  _thinkingTimer?: ReturnType<typeof setInterval> | null;
  traceLog?: any[];
}

interface Message {
  id: string;
  role: string;
  contents: MessageContent[];
  parentId: string;
  currentVersionId?: string;
  state: ContentState;
  createdAt: string;
  [key: string]: any;
}

interface StreamResponse {
  type: string;
  messageId?: string;
  turnsId?: string;
  contentId?: string;
  modelName?: string;
  content?: string;
  reasoningContent?: string;
  toolCalls?: any[];
  toolCallsResponse?: any[];
  status?: string;
  results?: Array<{ title: string; url: string }>;
  query?: string;
  usage?: any;
  finishReason?: string;
  error?: string;
  parentId?: string;
  contextStats?: {
    usedTokens: number;
    effectiveContextWindow: number;
  };
  retryReason?: "timeout" | "rate_limited" | "network_error";
  retryAttempt?: number;
  retryMaxAttempts?: number;
  retryDelayMs?: number;
  message?: string;
  trace?: any;
  // 人工确认（plan_exit）
  replyId?: string;
  confirmations?: Array<{
    toolCallId: string;
    toolName?: string;
    title?: string;
    description?: string;
  }>;
}

export function useStreamResponse(sessionStore: any, apiService: any) {
  const { toast } = usePopup();

  // ============================================
  // 内容缓冲与防抖 flush 机制
  // 将消抖从 MarkdownContent 组件迁移到数据层
  // 注意：content 是顺序出现的，一个完整结束后才会开始下一个，
  // 因此全局只需一个缓冲区和防抖函数即可
  // ============================================
  interface ContentBuffer {
    content: string;
    reasoningContent: string;
  }

  // 当前内容缓冲区（全局只有一个，因为 content 不会交错）
  let contentBuffer: ContentBuffer | null = null;
  let currentBufferContentId: string | null = null;

  // 总耗时计时器
  let streamStartTime: number | null = null;
  let baseTotalDurationMs: number = 0;
  let durationTimer: ReturnType<typeof setInterval> | null = null;

  function startDurationTimer(message: Message) {
    if (streamStartTime !== null) return;
    streamStartTime = Date.now();
    baseTotalDurationMs = message.totalDurationMs || 0;
    durationTimer = setInterval(() => {
      if (streamStartTime !== null) {
        message.totalDurationMs =
          baseTotalDurationMs + (Date.now() - streamStartTime);
      }
    }, 100);
  }

  function stopDurationTimer(message: Message | null) {
    if (durationTimer) {
      clearInterval(durationTimer);
      durationTimer = null;
    }
    if (message && streamStartTime !== null) {
      message.totalDurationMs =
        baseTotalDurationMs + (Date.now() - streamStartTime);
    }
    streamStartTime = null;
    baseTotalDurationMs = 0;
  }

  // 全局防抖 flush 函数
  const debouncedFlush = useDebounceFn(
    (message: Message, contentIndex: number) => {
      flushContent(message, contentIndex);
    },
    50,
  );

  /**
   * 将缓冲区的内容 flush 到响应式数据中
   */
  function flushContent(message: Message, contentIndex: number) {
    if (!contentBuffer || !message) return;

    const content = message.contents[contentIndex];
    if (!content) return;

    content.content = contentBuffer.content;
    content.reasoningContent = contentBuffer.reasoningContent;
  }

  /**
   * 强制 flush 并清理缓冲区（流结束时调用）
   */
  function forceFlushContent(message: Message, contentIndex: number) {
    flushContent(message, contentIndex);
    clearContentBuffer();
  }

  /**
   * 清理缓冲区
   */
  function clearContentBuffer() {
    contentBuffer = null;
    currentBufferContentId = null;
  }

  /**
   * 处理新消息创建
   */
  function handleNewMessage(
    response: StreamResponse,
    sessionId: string,
  ): { message: Message; contentIndex: number } {
    const { messageId, contentId, modelName } = response;
    const time = new Date().toISOString();

    // 创建新内容块
    const newContent = reactive<MessageContent>({
      id: contentId!,
      role: "assistant",
      content: null,
      reasoningContent: null,
      additionalKwargs: [],
      metadata: { modelName },
      createdAt: time,
      updatedAt: time,
      thinkingStartedAt: null,
      thinkingDurationMs: null,
      state: {
        isStreaming: true,
        isThinking: false,
      },
    });

    // 查找是否已存在该消息
    let existingMessage = sessionStore
      .getMessages(sessionId)
      .find((msg: Message) => msg.id === messageId);

    if (!existingMessage) {
      // 创建新消息 (使用 shallowReactive 减少响应式深度)
      existingMessage = reactive<Message>({
        id: messageId!,
        role: "assistant",
        contents: [newContent],
        parentId: response.parentId || "",
        sessionId,
        state: {
          isStreaming: true,
          isThinking: false,
        },
        createdAt: time,
      });
      sessionStore.getMessages(sessionId).push(existingMessage);

      // 新版本：更新用户消息的 currentVersionId 指向新创建的 assistant 消息
      const parentMessage = sessionStore
        .getMessages(sessionId)
        .find((msg: Message) => msg.id === response.parentId);
      if (parentMessage && parentMessage.role === "user") {
        parentMessage.currentVersionId = messageId!;
      }
    } else {
      console.log("Message already exists, pushing new content");
      existingMessage.contents.push(newContent);
      existingMessage.state = {
        isStreaming: true,
        isThinking: false,
      };
    }
    return {
      message: existingMessage,
      contentIndex: existingMessage.contents.length - 1,
    };
  }

  /**
   * 处理 update 事件（断点恢复模式）
   * 复用已有消息和内容块，更新流式状态
   */
  function handleUpdateMessage(
    response: StreamResponse,
    streamingSessionId: string,
  ): { message: Message; contentIndex: number } | null {
    const existingMessage = sessionStore
      .getMessages(streamingSessionId)
      .find((msg: Message) => msg.id === response.messageId);

    if (!existingMessage) {
      // subscribe 模式下可能因缓冲区溢出丢失 create 事件，此处容错而非中断整个流
      console.warn(
        "[subscribe] Message not found, skipping:",
        response.messageId,
      );
      return null;
    }

    // 查找对应的内容块
    const existingContentIndex = existingMessage.contents.findIndex(
      (c: MessageContent) => c.id === response.contentId,
    );

    if (existingContentIndex < 0) {
      console.warn(
        "[subscribe] Content not found, skipping:",
        response.contentId,
      );
      return null;
    }

    // 更新消息状态为流式中
    existingMessage.state = {
      isStreaming: true,
      isThinking: false,
    };

    return {
      message: existingMessage,
      contentIndex: existingContentIndex,
    };
  }

  /**
   * 处理思考事件
   */
  function handleThink(
    content: MessageContent,
    thinkingContent: string,
    message: Message,
    contentIndex: number,
  ): void {
    // 重试成功后收到新内容，清除重试提示
    if (content.metadata?.retryInfo) {
      delete content.metadata.retryInfo;
    }
    // 首次收到 think 事件，记录开始时间并启动计时器
    if (!content.state.isThinking) {
      content.state.isThinking = true;
      content.thinkingStartedAt = Date.now();

      // 启动实时计时器，每 100ms 更新一次
      content._thinkingTimer = setInterval(() => {
        if (content.thinkingStartedAt) {
          content.thinkingDurationMs = Date.now() - content.thinkingStartedAt;
        }
      }, 100);
    }

    // 流式期间：写入缓冲区，通过防抖 flush 更新
    if (!contentBuffer || currentBufferContentId !== content.id) {
      contentBuffer = {
        content: content.content || "",
        reasoningContent: "",
      };
      currentBufferContentId = content.id;
    }
    contentBuffer.reasoningContent = thinkingContent;
    debouncedFlush(message, contentIndex);
  }

  /**
   * 处理思考结束
   */
  function handleThinkEnd(content: MessageContent): void {
    if (content.state.isThinking) {
      content.state.isThinking = false;

      // 停止计时器并计算最终时长
      if (content._thinkingTimer) {
        clearInterval(content._thinkingTimer);
        content._thinkingTimer = null;
      }

      if (content.thinkingStartedAt) {
        content.thinkingDurationMs = Date.now() - content.thinkingStartedAt;
      }
    }
  }

  /**
   * 处理在线检索事件（searching / done）
   */
  function handleSearch(
    content: MessageContent,
    status: string,
    query: string | undefined,
    results: Array<{ title: string; url: string }> | undefined,
  ): void {
    if (status === "searching") {
      content.state.isSearching = true;
      content.searchQuery = query;
      return;
    }
    if (status === "done") {
      content.state.isSearching = false;
      content.searchQuery = query ?? content.searchQuery;
      content.searchResults = results ?? [];
    }
  }

  /**
   * 处理工具调用（增量更新）
   */
  function handleToolCall(content: MessageContent, toolCalls: any[]): void {
    // 初始化 metadata
    if (!content.metadata) {
      content.metadata = {};
    }
    if (!content.metadata.toolCalls) {
      content.metadata.toolCalls = [];
    }

    // 累加增量的 toolCalls
    for (const toolCall of toolCalls) {
      const index = toolCall.index;

      // 查找是否已存在该索引的工具调用
      let existingToolCall = content.metadata.toolCalls.find(
        (tc: any) => tc.index === index,
      );

      if (!existingToolCall) {
        // 如果是新的工具调用，添加到列表
        content.metadata.toolCalls.push({
          id: toolCall.id,
          index: toolCall.index,
          type: toolCall.type,
          name: toolCall.name,
          arguments: toolCall.arguments || "",
          metadata: {},
        });
      } else {
        // 如果已存在，累加参数字符串
        if (toolCall.arguments !== null && toolCall.arguments !== undefined) {
          existingToolCall.arguments += toolCall.arguments;
        }
      }
    }
  }

  /**
   * 处理工具调用响应
   * 从 tool_calls_response 事件接收执行结果，更新到 toolCalls metadata 中
   */
  function handleToolCallsResponse(
    content: MessageContent,
    toolCallsResponse: any[],
  ): void {
    if (!content.metadata) {
      content.metadata = {};
    }
    content.metadata.toolCallsResponse = toolCallsResponse;

    // 同步工具执行结果状态到 toolCalls（流式期间即时显示 outcome 图标）
    if (
      toolCallsResponse &&
      toolCallsResponse.length > 0 &&
      content.metadata.toolCalls
    ) {
      for (let i = 0; i < toolCallsResponse.length; i++) {
        const outcome = toolCallsResponse[i]?.outcome;
        if (outcome && content.metadata.toolCalls[i]) {
          content.metadata.toolCalls[i].outcome = outcome;
        }
      }
    }
  }

  /**
   * 处理文本内容
   */
  function handleText(
    content: MessageContent,
    responseContent: string,
    message: Message,
    contentIndex: number,
  ): void {
    // 重试成功后收到新内容，清除重试提示
    if (content.metadata?.retryInfo) {
      delete content.metadata.retryInfo;
    }
    // 流式期间：写入缓冲区，通过防抖 flush 更新
    if (!contentBuffer || currentBufferContentId !== content.id) {
      contentBuffer = {
        content: "",
        reasoningContent: content.reasoningContent || "",
      };
      currentBufferContentId = content.id;
    }
    contentBuffer.content = responseContent;
    debouncedFlush(message, contentIndex);
  }

  /**
   * 处理流式完成事件
   */
  function handleStreamFinish(
    response: StreamResponse,
    message: Message | null,
    contentIndex: number | undefined,
  ): void {
    if (!message || contentIndex === undefined) {
      return;
    }

    const content = message.contents[contentIndex];

    // finish 携带完整内容时，直接覆盖（天然聚合）
    if (response.content !== undefined) {
      content.content = response.content;
    }
    if (response.reasoningContent !== undefined) {
      content.reasoningContent = response.reasoningContent;
    }

    const metadata = content.metadata || {};

    if (response.toolCalls && response.toolCalls.length > 0) {
      metadata.toolCalls = response.toolCalls.map((tc: any) => ({
        id: tc.id,
        index: tc.index,
        type: tc.type,
        name: tc.name,
        arguments: tc.arguments || "",
        metadata: tc.metadata || {},
      }));
    }

    // 保存 usage 信息到 metadata.usage
    if (response.usage) {
      metadata.usage = response.usage;
    }

    // 上游 finishReason（end_turn/stop 等）留在 content 供审计
    if (response.finishReason) {
      metadata.finishReason = response.finishReason;
    }

    content.metadata = metadata;

    // 正常结束，强制 flush 缓冲区内容并清理
    forceFlushContent(message, contentIndex);

    // SSE finish 携带的上下文统计，直接更新环形指示器
    if (response.contextStats) {
      updateTokenStatsFromSSE(response.contextStats);
    }

    // 更新状态
    content.state.isStreaming = false;
    content.state.isThinking = false;
    content.state.isSearching = false;
  }

  /**
   * 处理 turn_end 事件：整个 ReAct 循环结束
   * 更新 Message 级别 metadata（finishReason/errorDetail/usage），不触碰 content
   */
  function handleTurnEnd(
    response: StreamResponse,
    message: Message | null,
  ): void {
    if (!message) return;

    // 写入 Message 级别 metadata
    const msgMeta = message.metadata || {};
    if (response.finishReason) {
      msgMeta.finishReason = response.finishReason;
    }
    if (response.error) {
      msgMeta.errorDetail = response.error;
    }
    if (response.usage) {
      msgMeta.usage = response.usage;
    }
    message.metadata = msgMeta;

    // 停止总耗时计时器
    stopDurationTimer(message);

    // 更新会话流状态
    if (response.contextStats) {
      updateTokenStatsFromSSE(response.contextStats);
    }
  }

  /**
   * 处理流式响应错误
   */
  function handleStreamCatchError(
    error: Error,
    message: Message | null,
    contentIndex: number | undefined,
  ): void {
    if (error.name !== "AbortError") {
      console.error("Error during streaming:", error);
      if (message && contentIndex !== undefined) {
        message.contents[contentIndex].content = error.message;
      }

      throw error;
    }
  }

  /**
   * 清理流式响应状态
   */
  function cleanupStreaming(
    sessionId: string,
    message: Message | null,
    contentIndex: number,
  ): void {
    if (message) {
      const msgState = message.state;
      msgState.isStreaming = false;
      msgState.isThinking = false;
      msgState.isSearching = false;

      // 清理计时器，防止内存泄漏
      const content = message.contents[contentIndex];
      if (content?._thinkingTimer) {
        clearInterval(content._thinkingTimer);
        content._thinkingTimer = null;
      }

      // 强制 flush 并清理缓冲区
      if (content) {
        forceFlushContent(message, contentIndex);
        if (content.state) {
          content.state.isStreaming = false;
          content.state.isThinking = false;
          content.state.isSearching = false;
        }
        content.updatedAt = new Date().toISOString();
      }
    }

    // 停止总耗时计时器（中止/异常时确保写入部分时长）
    stopDurationTimer(message);

    sessionStore.setSessionIsStreaming(sessionId, false);
  }

  /**
   * 处理流式事件循环（所有流式场景共用）
   */
  async function processStreamLoop(
    streamingSessionId: string,
    regenerationMode: "regenerate" | "resume" | "subscribe" | null,
    assistantMessageId: string | null,
    userMessage?: {
      id?: string;
      content?: string;
      files?: string[];
      replaceMessageId?: string;
      knowledgeBaseIds?: string[];
    },
    lastContentId?: string | null,
    think?: boolean,
    search?: boolean,
    model?: string,
    skillNames?: string[],
    characterId?: string | null,
    mcpServerIds?: string,
    mode?: string | null,
  ): Promise<void> {
    sessionStore.setSessionIsStreaming(streamingSessionId, true);

    let message: Message | null = null;
    let contentIndex = 0;
    // 修复：添加标志位，确保一次流式会话只更新一次时间戳
    let hasUpdatedActiveTime = false;

    try {
      let responseContent = "";
      let thinkingContent = "";

      const chatParams: any = {
        sessionId: streamingSessionId,
        regenerationMode,
        assistantMessageId,
        lastContentId,
        think,
        search,
        model,
        skillNames,
        characterId,
        mcpServerIds,
        mode,
      };
      if (userMessage) {
        chatParams.userMessage = userMessage;
      }

      for await (const response of apiService.chat(chatParams)) {
        // 修复：实时检测并保存 usage，不等待 finish 事件
        // 这样即使被取消或发生异常，已接收到的 usage 也不会丢失
        if (response.usage && message && contentIndex !== undefined) {
          const content = message.contents[contentIndex];
          content.metadata = {
            ...content.metadata,
            usage: response.usage,
          };
        }

        if (response.type === "retry") {
          if (message && contentIndex !== undefined) {
            const content = message.contents[contentIndex];
            if (content) {
              content.metadata = {
                ...content.metadata,
                retryInfo: {
                  reason: response.retryReason,
                  attempt: response.retryAttempt,
                  maxRetries: response.retryMaxAttempts,
                  message: response.message,
                },
              };
              // 重置 thinking 状态（重试 = 重新开始）
              content.state.isThinking = false;
              if (content._thinkingTimer) {
                clearInterval(content._thinkingTimer);
                content._thinkingTimer = null;
              }
            }
          }
          continue;
        }

        if (response.type === "finish") {
          handleStreamFinish(response, message, contentIndex);
          responseContent = "";
          thinkingContent = "";
          continue;
        }

        if (response.type === "turn_end") {
          handleTurnEnd(response, message);
          responseContent = "";
          thinkingContent = "";
          continue;
        }

        if (response.type === "user_message") {
          // 后端广播的用户消息，添加到消息列表
          const userMsg = response.userMessage;
          if (userMsg) {
            sessionStore.addMessage(streamingSessionId, userMsg);
          }
          continue;
        }

        if (response.type === "create") {
          const result = handleNewMessage(response, streamingSessionId);
          message = result.message;
          contentIndex = result.contentIndex;

          startDurationTimer(message);

          // 修复：仅在第一个 create 事件时更新时间戳，避免工具调用多轮次导致重复更新
          if (!hasUpdatedActiveTime) {
            sessionStore.updateSessionLastActiveTime(
              streamingSessionId,
              new Date().toISOString(),
            );
            hasUpdatedActiveTime = true;
          }

          continue;
        }

        // 【断点恢复】处理 update 事件（resume 模式下更新已有消息）
        if (response.type === "update") {
          const result = handleUpdateMessage(response, streamingSessionId);
          if (result) {
            message = result.message;
            contentIndex = result.contentIndex;

            startDurationTimer(message);

            if (!hasUpdatedActiveTime) {
              sessionStore.updateSessionLastActiveTime(
                streamingSessionId,
                new Date().toISOString(),
              );
              hasUpdatedActiveTime = true;
            }
          }
          continue;
        }

        if (response.type === "think") {
          thinkingContent += response.reasoningContent;
          if (message)
            handleThink(
              message.contents[contentIndex],
              thinkingContent,
              message,
              contentIndex,
            );
          continue;
        }

        // 思考结束后重置状态
        if (
          message?.contents[contentIndex]?.state?.isThinking &&
          response.type !== "think"
        ) {
          handleThinkEnd(message.contents[contentIndex]);
        }

        // 处理在线检索
        if (response.type === "search") {
          if (message)
            handleSearch(
              message.contents[contentIndex],
              response.status || "done",
              response.query,
              response.results,
            );
          continue;
        }

        // 处理工具调用（增量更新）
        if (response.type === "tool_call") {
          handleToolCall(message!.contents[contentIndex], response.toolCalls);
          continue;
        }

        // 处理工具调用结果（一次性接收）
        if (response.type === "tool_calls_response") {
          handleToolCallsResponse(
            message!.contents[contentIndex],
            response.toolCallsResponse,
          );
          continue;
        }

        // 人工确认（plan_exit）：挂到当前助手内容，渲染批准/拒绝卡片
        if (response.type === "confirmation") {
          if (message && contentIndex !== undefined) {
            const content = message.contents[contentIndex];
            if (content) {
              content.metadata = {
                ...content.metadata,
                confirmationRequest: {
                  replyId: response.replyId,
                  items: response.confirmations || [],
                },
              };
            }
          }
          continue;
        }

        // 处理执行轨迹（agentscope 全量日志）
        if (response.type === "trace") {
          if (message && contentIndex !== undefined) {
            const content = message.contents[contentIndex];
            if (content) {
              if (!Array.isArray(content.traceLog)) {
                content.traceLog = [];
              }
              content.traceLog.push(response.trace);
            }
          }
          continue;
        }

        // 处理文本内容
        if (response.type === "text") {
          responseContent = responseContent + response.content;
          handleText(
            message!.contents[contentIndex],
            responseContent,
            message!,
            contentIndex,
          );
          continue;
        }

        // 处理压缩开始事件
        if (response.type === "compression_start") {
          sessionStore.setSessionIsCompressing(streamingSessionId, true);
          toast.info(response.content || t("chat.stream.compressing"));
          continue;
        }

        // 处理压缩错误事件
        if (response.type === "compression_error") {
          sessionStore.setSessionIsCompressing(streamingSessionId, false);
          toast.error(response.content || t("common.error.operationFailed"));
          continue;
        }

        // 注意：sub_agent_start / sub_agent_finish 事件通过 SessionEventsService
        // 全局广播（SSE 用户级事件流），不经过消息流，因此此处无需处理。
      }
    } catch (error) {
      handleStreamCatchError(error as Error, message, contentIndex);
      // 如果是会话忙碌错误，不抛出异常，由调用者处理通知
      if ((error as Error).message.includes("SessionBusyError")) {
        return;
      }
      console.error("stream error:", error);
      throw error; // 重新抛出错误，由调用者处理
    } finally {
      cleanupStreaming(streamingSessionId, message, contentIndex);
    }
  }

  /**
   * 处理完整的流式响应（用于 regenerate / continue / subscribe 等场景）
   *
   * 与 processStreamWithCreate 的区别：
   * - 不创建新消息，只接收已有流的广播事件
   * - subscribe 模式下如果无活跃流，后端返回 NO_ACTIVE_STREAM 错误
   */
  async function processStream(
    streamingSessionId: string,
    regenerationMode: "regenerate" | "resume" | "subscribe" | null = null,
    assistantMessageId: string | null = null,
    userMessageId?: string | null,
    lastContentId?: string | null,
  ): Promise<void> {
    const userMessage = userMessageId ? { id: userMessageId } : undefined;
    await processStreamLoop(
      streamingSessionId,
      regenerationMode,
      assistantMessageId,
      userMessage,
      lastContentId,
    );
  }

  /**
   * 处理完整的流式响应（合并消息创建和流式启动）
   *
   * 后端会在启动流时自动创建消息，实现原子性。
   */
  async function processStreamWithCreate(
    streamingSessionId: string,
    content: string,
    fileIds: string[],
    replaceMessageId: string | null = null,
    knowledgeBaseIds?: string[],
    think?: boolean,
    search?: boolean,
    model?: string,
    skillNames?: string[],
    characterId?: string | null,
    mcpServerIds?: string,
    mode?: string | null,
  ): Promise<void> {
    await processStreamLoop(streamingSessionId, null, null, {
      content,
      files: fileIds,
      replaceMessageId: replaceMessageId || undefined,
      knowledgeBaseIds,
    }, null, think, search, model, skillNames, characterId, mcpServerIds, mode);
  }

  /**
   * 人工确认恢复：批准/拒绝后用决策再次驱动 Agent，并处理恢复后的流。
   *
   * 恢复流以 create 帧开始（新的助手消息承载 BUILD 执行），批准卡片保留在
   * 规划轮的（空）气泡中。
   */
  async function processResume(
    streamingSessionId: string,
    req: {
      replyId: string;
      decisions: Array<{ toolCallId: string; confirmed: boolean }>;
      model?: string;
      characterId?: string | null;
      think?: boolean;
      feedback?: string;
    },
  ): Promise<void> {
    sessionStore.setSessionIsStreaming(streamingSessionId, true);

    let message: Message | null = null;
    let contentIndex = 0;

    // 决策结果：用于把旧卡片标记为终态
    const isApproved = req.decisions.some((d) => d.confirmed);

    // 找到当前已渲染、携带该 replyId 的待批助手消息，
    // 取其 parentId（当前渲染的用户消息 id）作为恢复新消息的挂载点
    let liveParentId = "";
    let pendingAssistant: Message | null = null;
    for (const m of sessionStore.getMessages(streamingSessionId)) {
      if (
        m.role === "assistant" &&
        (m.contents || []).some(
          (c: MessageContent) =>
            c.metadata?.confirmationRequest?.replyId === req.replyId,
        )
      ) {
        pendingAssistant = m;
        break;
      }
    }
    if (pendingAssistant) {
      liveParentId = pendingAssistant.parentId || "";
      // 旧卡片立即进入终态（隐藏操作按钮）
      for (const c of pendingAssistant.contents) {
        const cr = c.metadata?.confirmationRequest;
        if (cr && cr.replyId === req.replyId) {
          c.metadata = {
            ...c.metadata,
            confirmationRequest: {
              ...cr,
              status: isApproved ? "approved" : "rejected",
            },
          };
        }
      }
    }

    try {
      let responseContent = "";
      let thinkingContent = "";

      for await (const response of apiService.resume({
        sessionId: streamingSessionId,
        replyId: req.replyId,
        decisions: req.decisions,
        model: req.model,
        characterId: req.characterId ?? null,
        think: req.think,
        feedback: req.feedback,
      })) {
        if (response.type === "create") {
          const result = handleNewMessage(response, streamingSessionId);
          message = result.message;
          contentIndex = result.contentIndex;
          // 覆盖为当前渲染的用户消息 id，保证恢复消息在同一轮次内渲染
          if (liveParentId && message.parentId !== liveParentId) {
            message.parentId = liveParentId;
          }
          // 回写 live 父用户消息的 currentVersionId：create 帧携带的 parentId 是
          // DB 主键，未刷新页面渲染的用户消息是前端 UUID，handleNewMessage 可能匹配不到，
          // 导致新助手不成为 active 版本、后续 confirmation 卡片不渲染。
          if (liveParentId) {
            const liveParent = sessionStore
              .getMessages(streamingSessionId)
              .find(
                (pm: Message) => pm.id === liveParentId && pm.role === "user",
              );
            if (liveParent) {
              liveParent.currentVersionId = message.id;
            }
          }
          startDurationTimer(message);
          continue;
        }

        if (response.type === "confirmation") {
          if (message && contentIndex !== undefined) {
            const content = message.contents[contentIndex];
            if (content) {
              content.metadata = {
                ...content.metadata,
                confirmationRequest: {
                  replyId: response.replyId,
                  items: response.confirmations || [],
                },
              };
            }
          }
          continue;
        }

        if (response.type === "think") {
          thinkingContent += response.reasoningContent;
          if (message)
            handleThink(
              message.contents[contentIndex],
              thinkingContent,
              message,
              contentIndex,
            );
          continue;
        }

        if (
          message?.contents[contentIndex]?.state?.isThinking &&
          response.type !== "think"
        ) {
          handleThinkEnd(message.contents[contentIndex]);
        }

        if (response.type === "search") {
          if (message)
            handleSearch(
              message.contents[contentIndex],
              response.status || "done",
              response.query,
              response.results,
            );
          continue;
        }

        if (response.type === "tool_call") {
          handleToolCall(message!.contents[contentIndex], response.toolCalls);
          continue;
        }

        if (response.type === "tool_calls_response") {
          handleToolCallsResponse(
            message!.contents[contentIndex],
            response.toolCallsResponse,
          );
          continue;
        }

        if (response.type === "trace") {
          if (message && contentIndex !== undefined) {
            const content = message.contents[contentIndex];
            if (content) {
              if (!Array.isArray(content.traceLog)) {
                content.traceLog = [];
              }
              content.traceLog.push(response.trace);
            }
          }
          continue;
        }

        if (response.type === "text") {
          responseContent = responseContent + response.content;
          handleText(
            message!.contents[contentIndex],
            responseContent,
            message!,
            contentIndex,
          );
          continue;
        }

        if (response.type === "finish") {
          handleStreamFinish(response, message, contentIndex);
          responseContent = "";
          thinkingContent = "";
          continue;
        }

        if (response.type === "turn_end") {
          handleTurnEnd(response, message);
          responseContent = "";
          thinkingContent = "";
          continue;
        }
      }
    } catch (error) {
      handleStreamCatchError(error as Error, message, contentIndex);
      if ((error as Error).message.includes("SessionBusyError")) {
        return;
      }
      console.error("resume stream error:", error);
      throw error;
    } finally {
      cleanupStreaming(streamingSessionId, message, contentIndex);
    }
  }

  return {
    processStream,
    processStreamWithCreate,
    processResume,
  };
}
