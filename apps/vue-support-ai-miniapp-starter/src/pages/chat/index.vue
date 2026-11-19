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
      :scroll-with-animation="true"
    >
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
            <text class="msg-thinking-label">思考过程</text>
            <text class="msg-thinking-text">{{ msg.thinking }}</text>
          </view>
          <text v-if="msg.text" class="msg-text">{{ msg.text }}</text>
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

    <!-- 输入区 -->
    <view class="chat-footer">
      <view class="chat-input-wrap">
        <wd-input
          v-model="inputText"
          placeholder="输入消息…"
          confirm-type="send"
          :confirm-hold="true"
          :adjust-position="true"
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
import { STORAGE_KEY_USER } from "../../config";
import { useMessage } from "wot-design-uni/components/wd-message-box";
import { useToast } from "wot-design-uni/components/wd-toast";

interface ViewMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  thinking: string;
  status: "done" | "streaming" | "error";
  statusText?: string;
}

/** 当前流式请求句柄（模块级，避免被响应式代理） */
let activeStream: { abort: () => void } | null = null;

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

    switchSession(sessionId: string) {
      if (sessionId === this.currentSessionId) {
        this.sessionPanelVisible = false;
        return;
      }
      this.abortStream();
      this.sending = false;
      this.sessionPanelVisible = false;
      this.currentSessionId = sessionId;
      const found = this.sessions.find((s) => s.id === sessionId);
      this.currentTitle = found?.title || "对话";
      this.loadMessages();
    },

    startNewSession() {
      this.abortStream();
      this.sending = false;
      this.sessionPanelVisible = false;
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
      this.abortStream();
      clearToken();
      try {
        uni.removeStorageSync(STORAGE_KEY_USER);
      } catch {
        // ignore
      }
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
        const items: MessageItem[] = await fetchSessionMessages(this.currentSessionId, 50);
        this.messages = items.map((m) => ({
          id: m.id,
          role: m.role,
          text: messageText(m),
          thinking: messageReasoning(m),
          status: m.state?.isStreaming ? "streaming" : "done",
        }));
        this.scrollToBottom();
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
        status: "done",
      });
      this.messages.push({
        id: `local-a-${Date.now()}`,
        role: "assistant",
        text: "",
        thinking: "",
        status: "streaming",
      });
      // 取响应式代理引用，保证后续赋值能触发视图更新
      const placeholder = this.messages[this.messages.length - 1] as ViewMessage;
      this.sending = true;
      this.scrollToBottom();

      // 环境不支持分块响应 → 直接走降级路径
      if (!chunkedSupported()) {
        await this.fallbackSend(placeholder, content);
        return;
      }

      this.abortStream();
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
            },
            onDone: () => {
              if (placeholder.status === "streaming") placeholder.status = "done";
              this.sending = false;
              if (activeStream === stream) activeStream = null;
              this.loadSessions();
              // 用服务端权威数据回填（拿到真实消息 id / 用量等）
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
          this.scrollToBottom();
          break;
        case "text":
          msg.text += event.content || "";
          this.scrollToBottom();
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
          break;
        default:
          // create / compression_* / trace 等事件不直接渲染
          break;
      }
    },

    // ---------- 降级：fire-and-forget + 轮询历史 ----------
    async fallbackSend(placeholder: ViewMessage, content: string) {
      this.abortStream();
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
          if (last && last.role === "assistant" && !streaming) {
            const text = messageText(last);
            if (text) placeholder.text = text;
            const reasoning = messageReasoning(last);
            if (reasoning) placeholder.thinking = reasoning;
            placeholder.status = "done";
            placeholder.statusText = "";
            this.sending = false;
            this.loadSessions();
            return;
          }
          if (last && last.role === "assistant") {
            const text = messageText(last);
            if (text) placeholder.text = text; // 展示中间产出
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

    // ---------- 工具 ----------
    scrollToBottom() {
      this.scrollAnchor = "";
      this.$nextTick(() => {
        this.scrollAnchor = this.messages.length
          ? `msg-${this.messages.length - 1}`
          : "msg-bottom";
      });
    },

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
  align-items: center;
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #e7e9ec;
}

.chat-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
  height: 80rpx;
  background: #f5f6f8;
  border-radius: 40rpx;
  padding: 0 28rpx;
  box-sizing: border-box;
}

.chat-input-wrap :deep(.wd-input) {
  flex: 1;
  padding: 0;
  background: transparent;
}

.chat-input-wrap :deep(.wd-input__inner) {
  font-size: 28rpx;
}

.send-btn {
  margin-left: 20rpx;
  flex-shrink: 0;
}
</style>
