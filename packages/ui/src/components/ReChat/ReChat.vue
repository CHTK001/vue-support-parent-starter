<template>
  <div class="re-chat-container">
    <advanced-chat
      :messages="messages"
      :room-id="roomId"
      :loading="loading"
      :show-audio="false"
      :show-files="false"
      :show-emoji="false"
      :show-typing="false"
      :show-new-messages-divider="false"
      :show-edit="false"
      :show-delete="false"
      :show-reaction="false"
      :show-time="true"
      :show-date="true"
      :message-actions="[]"
      :text-formatting="false"
      :style-options="{ maxWidth: '100%', borderRadius: '12px' }"
      @send-message="onSendMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
// @ts-ignore
import AdvancedChat from 'vue-advanced-chat';
import { createSseClient, type SseEvent } from '@repo/utils/sse';

defineOptions({ name: 'ReChat' });

const props = defineProps<{
  apiUrl?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  roomId?: string | number;
}>();

const roomId = computed(() => props.roomId || 'default');
const messages = ref<any[]>([]);
const loading = ref(false);

let currentClient: ReturnType<typeof createSseClient> | null = null;

onUnmounted(() => {
  if (currentClient) {
    currentClient.close();
    currentClient = null;
  }
});

function onSendMessage({ content }: { content: string }) {
  if (!content.trim()) return;
  
  // 关闭旧连接
  if (currentClient) {
    currentClient.close();
    currentClient = null;
  }
  
  // 添加用户消息
  const userMsg = {
    _id: `user-${Date.now()}`,
    content: content,
    role: 'user',
    timestamp: new Date(),
  };
  messages.value.push(userMsg);
  
  loading.value = true;
  
  // 创建助手消息占位
  const assistantMsg = {
    _id: `assistant-${Date.now()}`,
    content: '',
    role: 'assistant',
    timestamp: new Date(),
    streaming: true,
  };
  messages.value.push(assistantMsg);
  
  const payload = {
    model: props.model || 'gpt-3.5-turbo',
    messages: messages.value.filter(m => m.role !== 'system').map(m => ({
      role: m.role,
      content: m.content,
    })),
    stream: true,
    temperature: props.temperature ?? 0.7,
    ...(props.systemPrompt ? { system: props.systemPrompt } : {}),
  };
  
  const url = props.apiUrl || '/v1/chat/completions';
  currentClient = createSseClient(url, {
    method: 'POST',
    body: payload,
    onMessage: (event: SseEvent<unknown>) => {
      const data = event.data as any;
      if (data?.choices?.[0]?.delta?.content) {
        const delta = data.choices[0].delta.content;
        assistantMsg.content += delta;
        messages.value = [...messages.value];
      }
    },
    onClose: () => {
      loading.value = false;
      assistantMsg.streaming = false;
      messages.value = [...messages.value];
      currentClient = null;
    },
    onError: (err) => {
      loading.value = false;
      assistantMsg.content = '[错误] ' + (err.message || '未知错误');
      assistantMsg.streaming = false;
      messages.value = [...messages.value];
      currentClient = null;
    },
  });
}
</script>

<style scoped>
.re-chat-container {
  height: 100%;
  width: 100%;
  background: var(--el-bg-color);
}
</style>
