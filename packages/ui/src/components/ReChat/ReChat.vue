<template>
  <div class="re-chat">
    <!-- 左侧历史会话面板 -->
    <aside :class="['re-chat__history', { collapsed: historyCollapsed }]">
      <div class="re-chat__history-header">
        <span class="re-chat__history-title">历史会话</span>
        <el-button text circle size="small" @click="historyCollapsed = !historyCollapsed">
          <el-icon>
            <Fold v-if="!historyCollapsed" />
            <Expand v-else />
          </el-icon>
        </el-button>
      </div>

      <div class="re-chat__history-actions">
        <el-button type="primary" plain size="small" class="re-chat__new-btn" @click="startNewChat">
          <el-icon><Plus /></el-icon>
          <span>新建会话</span>
        </el-button>
      </div>

      <div class="re-chat__history-list">
        <el-empty v-if="sessions.length === 0" description="暂无会话" :image-size="60" />
        <div
          v-for="session in sessions"
          :key="session.id"
          :class="['re-chat__session', { active: session.id === currentId }]"
          @click="switchSession(session.id)"
        >
          <el-icon class="re-chat__session-icon"><ChatDotRound /></el-icon>
          <span class="re-chat__session-name">{{ session.title }}</span>
        </div>
      </div>
    </aside>

    <!-- 收缩开关（折叠时显示） -->
    <div v-if="historyCollapsed" class="re-chat__history-toggle" @click="historyCollapsed = false">
      <el-icon><Expand /></el-icon>
    </div>

    <!-- 右侧聊天区（LiaoKit） -->
    <main class="re-chat__main">
      <div class="re-chat__panel">
        <LiaoMessageList
          :messages="currentMessages"
          :loading="false"
          :empty-text="emptyText"
          :show-avatar="showAvatar"
          :show-time="true"
        />
        <LiaoInputArea
          v-model="inputText"
          :placeholder="placeholder"
          :enable-voice-input="false"
          :enable-emoji-input="false"
          :enable-file-upload="false"
          :enable-camera="false"
          :locked="loading"
          :lock-reason="'AI_REPLYING'"
          @send="handleSend"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * ReChat —— 基于 LiaoKit 的 AI 对话组件
 *
 * 支持：
 *  - 多会话历史（左侧可收缩面板）
 *  - OpenAI / Spring AI 双协议 SSE 流式
 *  - 上下文窗口（contextSize）、模型列表、系统提示词
 *
 *   <ReChat
 *     :url="'/v1/chat/completions'"
 *     :models="[{ label: 'GPT-4', value: 'gpt-4' }]"
 *     :context-size="20"
 *     :system-prompt="'你是一个助手'"
 *   />
 */
import { ref, computed, watch, onUnmounted } from 'vue';
import { Plus, Fold, Expand, ChatDotRound } from '@element-plus/icons-vue';
import { LiaoMessageList, LiaoInputArea } from '@yuandezuohua/liaokit';
import '@yuandezuohua/liaokit/dist/liaokit.css';
import { createOpenAiSseClient, createSpringAiSseClient } from '@repo/utils/sse';
import type { SseClient, OpenAiChunk, SpringAiChunk } from '@repo/utils/types';

defineOptions({ name: 'ReChat' });

/** 会话消息（LiaoKit 消息格式） */
interface ChatMessage {
  id: string;
  content: string;
  isSelf: boolean;
  time: Date;
  status: 'sent' | 'streaming';
}

/** 模型选项 */
interface ChatModel {
  label: string;
  value: string;
  description?: string;
}

interface Props {
  /** SSE 接口地址（必填） */
  url: string;
  /** 兼容旧名 api-url */
  apiUrl?: string;
  /** 协议格式 */
  protocol?: 'openai' | 'spring-ai';
  /** 当前模型 value */
  model?: string;
  /** 可用模型列表 */
  models?: ChatModel[];
  /** 系统提示词 */
  systemPrompt?: string;
  /** 采样温度 */
  temperature?: number;
  /** 上下文消息数（发往后端的历史条数） */
  contextSize?: number;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 用户 ID */
  userId?: string;
  /** 会话 ID（单会话模式） */
  conversationId?: string;
  /** 是否显示头像 */
  showAvatar?: boolean;
  /** 输入占位符 */
  placeholder?: string;
  /** 空状态文案 */
  emptyText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  apiUrl: undefined,
  protocol: 'openai',
  model: undefined,
  models: () => [],
  systemPrompt: undefined,
  temperature: 0.7,
  contextSize: 20,
  headers: () => ({}),
  userId: undefined,
  conversationId: undefined,
  showAvatar: true,
  placeholder: '输入消息后按回车发送（Shift+回车换行）',
  emptyText: '开始新的对话吧',
});

const emit = defineEmits<{
  (e: 'send', message: ChatMessage): void;
  (e: 'receive', content: string, fullContent: string): void;
  (e: 'complete', message: ChatMessage): void;
  (e: 'error', error: unknown): void;
}>();

/** 实际请求地址 */
const endpoint = computed(() => props.apiUrl ?? props.url);

/* ==================== 历史会话 ==================== */

interface Session {
  id: number;
  title: string;
}

const historyCollapsed = ref(false);
const sessions = ref<Session[]>([]);
const currentId = ref<number>(0);
const inputText = ref('');
const loading = ref(false);

/** 各会话消息缓存：sessionId -> ChatMessage[] */
const sessionMessages = new Map<number, ChatMessage[]>();
let seed = 0;
let currentClient: SseClient | null = null;

const currentMessages = computed<ChatMessage[]>(() => sessionMessages.get(currentId.value) ?? []);

function startNewChat() {
  const id = ++seed;
  sessions.value.push({ id, title: `新会话 ${id}` });
  currentId.value = id;
  sessionMessages.set(id, []);
  inputText.value = '';
}

function switchSession(id: number) {
  if (currentClient) {
    currentClient.close();
    currentClient = null;
  }
  currentId.value = id;
  loading.value = false;
}

/* ==================== 发送 & 流式 ==================== */

function handleSend(text: string) {
  const content = text.trim();
  if (!content || loading.value) return;

  if (currentClient) {
    currentClient.close();
    currentClient = null;
  }

  const list = sessionMessages.get(currentId.value) ?? [];
  const userMsg: ChatMessage = {
    id: `user-${Date.now()}`,
    content,
    isSelf: true,
    time: new Date(),
    status: 'sent',
  };
  list.push(userMsg);
  emit('send', userMsg);

  const assistantMsg: ChatMessage = {
    id: `assistant-${Date.now()}`,
    content: '',
    isSelf: false,
    time: new Date(),
    status: 'streaming',
  };
  list.push(assistantMsg);
  sessionMessages.set(currentId.value, list);
  loading.value = true;

  // 构造上下文（最近 contextSize 条非系统消息 + 系统提示词）
  const history = list
    .filter(m => m.content && m.id !== assistantMsg.id)
    .slice(-props.contextSize)
    .map(m => ({ role: m.isSelf ? 'user' : 'assistant', content: m.content }));
  if (props.systemPrompt) {
    history.unshift({ role: 'system', content: props.systemPrompt });
  }

  const baseOptions = {
    headers: props.headers,
    body: {
      model: props.model || 'gpt-3.5-turbo',
      messages: history,
      stream: true,
      temperature: props.temperature ?? 0.7,
      ...(props.userId ? { user: props.userId } : {}),
    },
  };

  const handleChunk = (content: string) => {
    if (!content) return;
    assistantMsg.content += content;
    emit('receive', content, assistantMsg.content);
    sessionMessages.set(currentId.value, [...list]);
  };

  const handleEnd = (fullContent: string) => {
    assistantMsg.content = fullContent;
    assistantMsg.status = 'sent';
    emit('complete', assistantMsg);
    sessionMessages.set(currentId.value, [...list]);
    loading.value = false;
    currentClient = null;
  };

  const handleError = (err: unknown) => {
    assistantMsg.content = '[错误] ' + ((err as Error)?.message || '未知错误');
    assistantMsg.status = 'sent';
    emit('error', err);
    sessionMessages.set(currentId.value, [...list]);
    loading.value = false;
    currentClient = null;
  };

  if (props.protocol === 'openai') {
    currentClient = createOpenAiSseClient(endpoint.value, {
      ...baseOptions,
      onChunk: (chunk: OpenAiChunk) => {
        handleChunk(chunk.choices?.[0]?.delta?.content || '');
      },
      onEnd: handleEnd,
      onError: handleError,
    });
  } else {
    currentClient = createSpringAiSseClient(endpoint.value, {
      ...baseOptions,
      onChunk: (chunk: SpringAiChunk) => {
        handleChunk(chunk.content || '');
      },
      onEnd: handleEnd,
      onError: handleError,
    });
  }
}

function stop() {
  if (currentClient) {
    currentClient.close();
    currentClient = null;
  }
  loading.value = false;
}

onUnmounted(() => {
  stop();
});

/* ==================== 单会话模式（conversationId） ==================== */

watch(
  () => props.conversationId,
  (id) => {
    if (id) {
      startNewChat();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.re-chat {
  height: 100%;
  width: 100%;
  display: flex;
  gap: 12px;
  overflow: hidden;
}

/* ===== 历史会话面板 ===== */
.re-chat__history {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  overflow: hidden;
  transition: width 0.25s ease;
}
.re-chat__history.collapsed {
  width: 0;
  border: none;
}
.re-chat__history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}
.re-chat__history-title {
  font-weight: 600;
  font-size: 14px;
}
.re-chat__history-actions {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}
.re-chat__new-btn {
  width: 100%;
}
.re-chat__history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.re-chat__session {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  transition: all 0.2s ease;
}
.re-chat__session:hover {
  background: var(--el-fill-color-light);
}
.re-chat__session.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}
.re-chat__session-icon {
  flex-shrink: 0;
}
.re-chat__session-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 收缩开关 ===== */
.re-chat__history-toggle {
  width: 28px;
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  border-radius: 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: all 0.2s ease;
}
.re-chat__history-toggle:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

/* ===== 聊天区 ===== */
.re-chat__main {
  flex: 1;
  min-width: 0;
}
.re-chat__panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  overflow: hidden;
}
.re-chat__panel :deep(.liao-message-list) {
  flex: 1;
  min-height: 0;
}
.re-chat__panel :deep(.liao-input-area) {
  border-top: 1px solid var(--el-border-color-light);
}
</style>
