<template>
  <view class="chat-page">
    <!-- 顶部：当前会话 + 操作 -->
    <view class="chat-header">
      <view class="chat-title-wrap">
        <text class="chat-title">{{ currentTitle || "新的对话" }}</text>
        <text class="chat-subtitle">{{ sending ? "对方正在输入…" : "与 PC 端会话互通" }}</text>
      </view>
      <view class="chat-actions">
        <wd-button size="small" plain custom-class="action-btn" @click="sessionPanelVisible = !sessionPanelVisible">
          会话
        </wd-button>
        <wd-button size="small" plain custom-class="action-btn" @click="startNewSession">新建</wd-button>
        <wd-button size="small" plain type="error" custom-class="action-btn" @click="logout">退出</wd-button>
      </view>
    </view>

    <!-- 历史会话面板 -->
    <view v-if="sessionPanelVisible" class="session-panel">
      <view v-if="sessions.length === 0" class="session-empty">暂无历史会话</view>
      <wd-cell
        v-for="item in sessions"
        :key="item.id"
        :title="item.title || '未命名会话'"
        :value="formatTime(item.updatedAt || item.lastActiveAt)"
        clickable
        :custom-class="item.id === currentSessionId ? 'session-cell is-active' : 'session-cell'"
        @click="switchSession(item.id)"
      />
    </view>

    <!-- 消息列表 -->
    <scroll-view
      class="chat-body"
      scroll-y
      :scroll-into-view="scrollAnchor"
      :scroll-with-animation="scrollAnimated"
      :lower-threshold="80"
      @scroll="handleScroll"
      @scrolltolower="handleReachBottom"
    >
      <!-- 切会话时先给骨架，避免"空白等消息" -->
      <view v-if="loadingHistory && messages.length === 0" class="chat-skeleton">
        <view
          v-for="row in 3"
          :key="row"
          class="skeleton-row"
          :class="{ 'skeleton-row--right': row % 2 === 0 }"
        >
          <view class="skeleton-bubble" />
        </view>
      </view>

      <view v-if="messages.length === 0 && !loadingHistory" class="chat-empty">
        <text class="chat-empty-title">开始对话</text>
        <text class="chat-empty-desc">发送第一条消息，自动创建会话</text>
      </view>

      <view
        v-for="(msg, index) in messages"
        :key="msg.id"
        :id="'msg-' + index"
        class="msg-row"
        :class="msg.role"
      >
        <view class="msg-bubble">
          <view v-if="msg.thinking" class="msg-thinking">
            <view class="msg-thinking-head" @tap="toggleThinking(msg)">
              <text class="msg-thinking-label">思考过程{{ msg.thinkingOpen ? "（收起）" : "（展开）" }}</text>
            </view>
            <text v-if="msg.thinkingOpen" class="msg-thinking-text">{{ msg.thinking }}</text>
          </view>
          <text v-if="msg.role === 'user' && msg.text" class="msg-text">{{ msg.text }}</text>
          <markdown-body v-else-if="msg.blocks.length" class="msg-text" :blocks="msg.blocks" />
          <view v-if="msg.statusText" class="msg-status">
            <text>{{ msg.statusText }}</text>
          </view>
          <view v-if="msg.status === 'streaming' && !msg.text && !msg.thinking && !msg.statusText" class="msg-pending">
            <text>正在思考…</text>
          </view>
        </view>
      </view>
      <view id="msg-bottom" class="chat-body-bottom"></view>
    </scroll-view>

    <!-- 输入区：多行自适应（上限 5 行左右，超出内部滚动） -->
    <view class="chat-footer">
      <view class="chat-input-wrap">
        <wd-textarea
          v-model="inputText"
          placeholder="输入消息，回车发送"
          confirm-type="send"
          :auto-height="true"
          :show-confirm-bar="false"
          :adjust-position="true"
          :cursor-spacing="24"
          :disabled="sending"
          no-border
          @confirm="handleSend"
        />
      </view>
      <wd-button
        v-if="!sending"
        type="primary"
        custom-class="send-btn"
        :disabled="!inputText"
        @click="handleSend"
      >
        发送
      </wd-button>
      <wd-button v-else type="error" custom-class="send-btn" @click="handleStop">停止</wd-button>
    </view>

    <!-- 用户上滑看历史时出现，避免被流式输出拽回底部 -->
    <view v-if="!autoFollow && messages.length" class="back-bottom" @tap="backToBottom">
      <text class="back-bottom-text">回到底部</text>
    </view>

    <!-- 框架浮层宿主（useToast / useMessage 需要） -->
    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script lang="ts">
import {
  createSession,
  fetchSessionMessages,
  fetchSessions,
  messageReasoning,
  messageText,
  stopStream,
  type MessageItem,
  type SessionItem,
} from "../../api/session";
import { fetchCharacters, pickDefaultCharacter } from "../../api/character";
import {
  chunkedSupported,
  sendFireAndForget,
  streamChat,
  type StreamEvent,
} from "../../api/chat";
import { clearToken, getToken } from "../../api/http";
import { parseMarkdown, type MarkdownBlock } from "../../utils/markdown";
import { useMessage } from "wot-design-uni/components/wd-message-box";
import { useToast } from "wot-design-uni/components/wd-toast";

interface ViewMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  thinking: string;
  /** 助手消息的 Markdown 解析结果（用户消息为纯文本，不走这里） */
  blocks: MarkdownBlock[];
  /** 思考过程是否展开（流式期间自动展开，可手动收起） */
  thinkingOpen: boolean;
  status: "done" | "streaming" | "error";
  statusText?: string;
}

/** 服务端消息 → 视图消息（历史加载与轮询回填共用一处映射） */
function toViewMessage(item: MessageItem): ViewMessage {
  const text = messageText(item);
  return {
    id: item.id,
    role: item.role,
    text,
    thinking: messageReasoning(item),
    blocks: item.role === "assistant" ? parseMarkdown(text) : [],
    thinkingOpen: false,
    status: item.state?.isStreaming ? "streaming" : "done",
  };
}

/** 当前流式请求句柄（模块级，避免被响应式代理） */
let activeStream: { abort: () => void } | null = null;

/**
 * 流式渲染节流：正文增量不进模板，改为每 80ms 重解析一次 Markdown 再渲染。
 * 一秒钟几十个 chunk 时不至于每块都跑一遍正则 + 触发一次布局。
 */
let renderTimer: ReturnType<typeof setTimeout> | null = null;
let pendingMessage: ViewMessage | null = null;

export default {
  setup() {
    // wot-design-uni 的浮层模块：模板里各挂一个 <wd-toast /> / <wd-message-box />
    return { toast: useToast(), message: useMessage() };
  },
  data() {
    return {
      sessions: [] as SessionItem[],
      currentSessionId: "",
      currentTitle: "",
      messages: [] as ViewMessage[],
      inputText: "",
      sending: false,
      loadingHistory: false,
      sessionPanelVisible: false,
      scrollAnchor: "",
      /** 是否跟随最新消息（用户上滑后关闭，回到底部/发消息后恢复） */
      autoFollow: true,
      /** 上一次滚动位置，用来判断"用户正在往上翻" */
      lastScrollTop: 0,
      /** 流式时关闭滚动动画，避免每个节拍都做一次动画 */
      scrollAnimated: true,
    };
  },
  onShow() {
    if (!getToken()) {
      uni.reLaunch({ url: "/pages/login/index" });
      return;
    }
    this.loadSessions();
  },
  onUnload() {
    this.clearRenderTimer();
    this.abortStream();
  },
  methods: {
    // ---------- 会话 ----------
    async loadSessions() {
      try {
        this.sessions = await fetchSessions(30);
      } catch {
        // 列表失败不阻塞对话
      }
    },

    /** 切会话 / 新建前统一收尾：中断流、复位发送态、收起面板、恢复跟随 */
    resetStreamState() {
      this.clearRenderTimer();
      this.abortStream();
      this.sending = false;
      this.sessionPanelVisible = false;
      this.autoFollow = true;
      this.lastScrollTop = 0;
      this.scrollAnimated = true;
    },

    switchSession(sessionId: string) {
      if (sessionId === this.currentSessionId) {
        this.sessionPanelVisible = false;
        return;
      }
      this.resetStreamState();
      this.currentSessionId = sessionId;
      this.currentTitle = this.sessions.find((s) => s.id === sessionId)?.title || "对话";
      // 先清空再加载：否则会短暂显示上一个会话的消息，骨架屏也不会出现
      this.messages = [];
      this.scrollAnchor = "";
      this.loadMessages();
    },

    startNewSession() {
      this.resetStreamState();
      this.currentSessionId = "";
      this.currentTitle = "";
      this.messages = [];
      this.scrollAnchor = "";
    },

    async ensureSession(firstContent: string) {
      const characters = await fetchCharacters();
      const character = pickDefaultCharacter(characters);
      if (!character) {
        throw new Error("没有可用角色（characters），请先在 PC 端创建默认角色");
      }
      const session = await createSession({
        characterId: character.id,
        title: firstContent.slice(0, 20),
      });
      this.currentSessionId = session.id;
      this.currentTitle = session.title || "新的对话";
      this.loadSessions();
    },

    async logout() {
      try {
        await this.message.confirm({ title: "退出登录", msg: "确定退出当前账号？" });
      } catch {
        // 取消：什么都不做
        return;
      }
      this.clearRenderTimer();
      this.abortStream();
      clearToken();
      uni.reLaunch({ url: "/pages/login/index" });
    },

    // ---------- 消息 ----------
    async loadMessages(silent = false) {
      if (!this.currentSessionId) {
        this.messages = [];
        return;
      }
      if (!silent) this.loadingHistory = true;
      try {
        const items = await fetchSessionMessages(this.currentSessionId, 50);
        this.messages = items.map(toViewMessage);
        this.autoFollow = true;
        this.scrollAnimated = true;
        this.scrollToBottom(true);
      } catch (error: any) {
        if (!silent) {
          this.toast.show({ msg: error?.message || "加载消息失败" });
        }
      } finally {
        this.loadingHistory = false;
      }
    },

    async handleSend() {
      const content = String(this.inputText || "").trim();
      if (!content || this.sending) return;
      this.inputText = "";
      this.sessionPanelVisible = false;

      // 首条消息：先建会话（characterId 必填，与 PC 端一致）
      try {
        if (!this.currentSessionId) {
          await this.ensureSession(content);
        }
      } catch (error: any) {
        this.toast.show({ msg: error?.message || "创建会话失败" });
        return;
      }

      this.messages.push({
        id: `local-u-${Date.now()}`,
        role: "user",
        text: content,
        thinking: "",
        blocks: [],
        thinkingOpen: false,
        status: "done",
      });
      this.messages.push({
        id: `local-a-${Date.now()}`,
        role: "assistant",
        text: "",
        thinking: "",
        blocks: [],
        thinkingOpen: true,
        status: "streaming",
      });
      // 取响应式代理引用，保证后续赋值能触发视图更新
      const placeholder = this.messages[this.messages.length - 1] as ViewMessage;
      this.sending = true;
      this.autoFollow = true;
      this.scrollAnimated = true;
      this.scrollToBottom(true);

      // 环境不支持分块响应 → 直接走降级路径
      if (!chunkedSupported()) {
        await this.fallbackSend(placeholder, content);
        return;
      }

      try {
        const stream = streamChat(
          { sessionId: this.currentSessionId, content },
          {
            onEvent: (event: StreamEvent) => this.applyStreamEvent(placeholder, event),
            onError: (error: Error) => {
              // 用户主动停止时 handleStop 已标记 done，不覆盖为 error
              if (placeholder.status === "streaming") {
                placeholder.status = "error";
                placeholder.statusText = error.message || "连接中断";
              }
              this.sending = false;
              // 仅当仍是当前流时才清句柄，防止旧流的迟到回调清掉新流
              if (activeStream === stream) activeStream = null;
              this.queueMessageUpdate(placeholder, true);
            },
            onDone: () => {
              if (placeholder.status === "streaming") placeholder.status = "done";
              this.sending = false;
              if (activeStream === stream) activeStream = null;
              // 把节流窗口里最后一段正文刷出来，再用服务端权威数据回填
              this.queueMessageUpdate(placeholder, true);
              this.loadSessions();
              this.loadMessages(true);
            },
          },
        );
        activeStream = stream;
      } catch {
        await this.fallbackSend(placeholder, content);
      }
    },

    applyStreamEvent(msg: ViewMessage, event: StreamEvent) {
      switch (event.type) {
        case "think":
          msg.thinking += event.reasoningContent || "";
          break;
        case "text":
          msg.text += event.content || "";
          // 节流重解析：正文不进模板，按 80ms 节拍统一刷新
          this.queueMessageUpdate(msg);
          break;
        case "tool_call":
          msg.statusText = `正在调用工具 ${event.toolCalls?.[0]?.name || ""}…`;
          break;
        case "tool_calls_response":
          msg.statusText = "";
          break;
        case "finish":
          if (event.error) msg.statusText = String(event.error);
          break;
        case "turn_end":
          if (event.content) msg.text = String(event.content);
          if (event.reasoningContent) msg.thinking = String(event.reasoningContent);
          if (event.error) {
            msg.status = "error";
            msg.statusText = String(event.error);
          }
          this.queueMessageUpdate(msg, true);
          break;
        default:
          // create / compression_* / trace 等事件不直接渲染
          break;
      }
    },

    /** 折叠/展开某条消息的思考过程 */
    toggleThinking(msg: ViewMessage) {
      msg.thinkingOpen = !msg.thinkingOpen;
    },

    // ---------- 降级：fire-and-forget + 轮询历史 ----------
    async fallbackSend(placeholder: ViewMessage, content: string) {
      try {
        await sendFireAndForget({ sessionId: this.currentSessionId, content });
        placeholder.statusText = "（非流式模式）";
        await this.pollUntilSettled(placeholder);
      } catch (error: any) {
        placeholder.status = "error";
        placeholder.statusText = error?.message || "发送失败";
        this.sending = false;
      }
    },

    async pollUntilSettled(placeholder: ViewMessage) {
      for (let i = 0; i < 120; i += 1) {
        await this.sleep(2500);
        if (!this.currentSessionId) return;
        try {
          const items = await fetchSessionMessages(this.currentSessionId, 50);
          const last = items[items.length - 1];
          const streaming = items.some(
            (m) => m.role === "assistant" && m.state?.isStreaming,
          );
          if (last && last.role === "assistant") {
            const view = toViewMessage(last);
            if (view.text) placeholder.text = view.text;
            if (view.thinking) placeholder.thinking = view.thinking;
            this.queueMessageUpdate(placeholder, true);
            if (!streaming) {
              placeholder.status = "done";
              placeholder.statusText = "";
              this.sending = false;
              this.loadSessions();
              return;
            }
          }
        } catch {
          // 单次轮询失败忽略，继续重试
        }
      }
      placeholder.status = "error";
      placeholder.statusText = "获取回复超时，请稍后刷新查看";
      this.sending = false;
    },

    async handleStop() {
      this.abortStream();
      this.sending = false;
      const last = this.messages[this.messages.length - 1];
      if (last && last.role === "assistant" && last.status === "streaming") {
        last.status = "done";
        last.statusText = "已停止生成";
      }
      // 把节流窗口里最后一段正文刷出来（停止时不再有 onDone）
      if (last) this.queueMessageUpdate(last, true);
      if (this.currentSessionId) {
        try {
          await stopStream(this.currentSessionId);
        } catch {
          // 停止失败不影响本地收尾
        }
      }
    },

    abortStream() {
      if (activeStream) {
        try {
          activeStream.abort();
        } catch {
          // ignore
        }
        activeStream = null;
      }
    },

    // ---------- 滚动跟随 ----------
    /** 只有"用户往上滑"才关闭跟随：程序滚动只会向下，不会误判 */
    handleScroll(event: any) {
      const top = Number(event?.detail?.scrollTop ?? 0);
      if (top < this.lastScrollTop - 12) this.autoFollow = false;
      this.lastScrollTop = top;
    },

    /** 滑到底（scrolltolower）恢复跟随 */
    handleReachBottom() {
      this.autoFollow = true;
    },

    backToBottom() {
      this.autoFollow = true;
      this.scrollAnimated = true;
      this.forceScroll();
    },

    /** 仅跟随模式下滚动；force 用于发送、切会话、回到底部 */
    scrollToBottom(force = false) {
      if (!force && !this.autoFollow) return;
      this.forceScroll();
    },

    forceScroll() {
      this.scrollAnchor = "";
      this.$nextTick(() => {
        this.scrollAnchor = this.messages.length ? `msg-${this.messages.length - 1}` : "msg-bottom";
      });
    },

    // ---------- 流式渲染节流 ----------
    queueMessageUpdate(msg: ViewMessage, immediate = false) {
      pendingMessage = msg;
      if (immediate) {
        this.clearRenderTimer();
        this.flushRender();
        return;
      }
      if (renderTimer) return;
      renderTimer = setTimeout(() => {
        renderTimer = null;
        this.flushRender();
      }, 80);
    },

    flushRender() {
      const message = pendingMessage;
      pendingMessage = null;
      if (message) {
        message.blocks = message.role === "assistant" ? parseMarkdown(message.text) : [];
      }
      if (this.autoFollow) {
        this.scrollAnimated = false;
        this.forceScroll();
      }
    },

    clearRenderTimer() {
      if (renderTimer) {
        clearTimeout(renderTimer);
        renderTimer = null;
      }
      pendingMessage = null;
    },

    // ---------- 工具 ----------

    formatTime(value?: string): string {
      if (!value) return "";
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "";
      const now = new Date();
      const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      if (d.toDateString() === now.toDateString()) return hm;
      return `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
    },

    sleep(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
  },
};
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f6f8;
}

/* ---------- 顶部 ---------- */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  background: #f5f6f8;
  border-bottom: 1rpx solid #e7e9ec;
}

.chat-title-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  margin-right: 16rpx;
}

.chat-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2329;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-subtitle {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #8a9099;
}

.chat-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.action-btn {
  margin-left: 16rpx;
}

/* ---------- 会话面板 ---------- */
.session-panel {
  max-height: 480rpx;
  overflow-y: auto;
  background: #ffffff;
  border-bottom: 1rpx solid #e7e9ec;
}

.session-empty {
  padding: 40rpx;
  text-align: center;
  font-size: 26rpx;
  color: #8a9099;
}

.session-cell.is-active {
  background: #eef4ff;
}

/* ---------- 消息列表 ---------- */
.chat-body {
  flex: 1;
  min-height: 0;
  padding: 24rpx 32rpx;
  box-sizing: border-box;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 160rpx;
}

.chat-empty-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1f2329;
}

.chat-empty-desc {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #8a9099;
}

.msg-row {
  display: flex;
  margin-bottom: 24rpx;
}

.msg-row.user {
  justify-content: flex-end;
}

.msg-row.assistant {
  justify-content: flex-start;
}

.msg-bubble {
  max-width: 84%;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  box-sizing: border-box;
}

.msg-row.user .msg-bubble {
  background: #2f6fed;
  border-bottom-right-radius: 6rpx;
}

.msg-row.assistant .msg-bubble {
  background: #ffffff;
  border-bottom-left-radius: 6rpx;
  box-shadow: 0 2rpx 12rpx rgba(31, 35, 41, 0.05);
}

.msg-text {
  font-size: 28rpx;
  line-height: 1.6;
  word-break: break-word;
}

.msg-row.user .msg-text {
  color: #ffffff;
}

.msg-row.assistant .msg-text {
  color: #1f2329;
}

.msg-thinking {
  margin-bottom: 12rpx;
  padding: 14rpx 18rpx;
  background: #f5f6f8;
  border-left: 6rpx solid #c9d4e8;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
}

.msg-thinking-label {
  font-size: 22rpx;
  color: #8a9099;
  margin-bottom: 6rpx;
}

.msg-thinking-text {
  font-size: 24rpx;
  color: #6b7280;
  line-height: 1.5;
  word-break: break-word;
}

.msg-status {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #b0812a;
}

.msg-pending {
  font-size: 24rpx;
  color: #a5abb5;
}

.chat-body-bottom {
  height: 24rpx;
}

/* ---------- 输入区 ---------- */
.chat-footer {
  display: flex;
  align-items: flex-end;
  padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #e7e9ec;
}

/* 多行输入：默认单行高度，随内容增高，上限约 5 行后内部滚动 */
.chat-input-wrap {
  flex: 1;
  display: flex;
  align-items: flex-end;
  min-width: 0;
  min-height: 80rpx;
  max-height: 260rpx;
  overflow-y: auto;
  background: #f5f6f8;
  border-radius: 24rpx;
  padding: 10rpx 24rpx;
  box-sizing: border-box;
}

.chat-input-wrap :deep(.wd-textarea) {
  flex: 1;
  width: 100%;
  background: transparent;
}

.chat-input-wrap :deep(.wd-textarea__inner) {
  width: 100%;
  min-height: 60rpx;
  font-size: 28rpx;
  line-height: 1.5;
}

.send-btn {
  margin-left: 20rpx;
  flex-shrink: 0;
}

/* ---------- 骨架屏（切会话首屏） ---------- */
.chat-skeleton {
  padding-top: 8rpx;
}

.skeleton-row {
  display: flex;
  margin-bottom: 24rpx;
}

.skeleton-row--right {
  justify-content: flex-end;
}

.skeleton-bubble {
  width: 62%;
  height: 96rpx;
  border-radius: 20rpx;
  background: #e9ecf1;
  animation: skeleton-pulse 1.2s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}

/* ---------- 思考过程折叠 ---------- */
.msg-thinking-head {
  padding: 2rpx 0;
}

/* ---------- 回到底部 ---------- */
.back-bottom {
  position: fixed;
  right: 32rpx;
  bottom: calc(190rpx + env(safe-area-inset-bottom));
  padding: 12rpx 24rpx;
  border-radius: 32rpx;
  background: rgba(31, 35, 41, 0.78);
  z-index: 10;
}

.back-bottom-text {
  font-size: 24rpx;
  color: #ffffff;
}
</style>
