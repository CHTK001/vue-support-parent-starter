<template>
  <div class="ai-view">
    <div class="ai-view__container">
      <ReChat
        url="/v2/v1/chat/completions"
        model="gpt-3.5-turbo"
        :temperature="0.7"
        :api-key="appKey"
        :models="[
          { label: 'GPT-3.5', value: 'gpt-3.5-turbo' },
          { label: 'GPT-4', value: 'gpt-4' },
        ]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ReChat from '@repo/ui/re-chat';
import { getConfig } from '@repo/config';

// 对话走 OpenAI 兼容协议（/v2/v1/chat/completions），需用 AI AppKey 鉴权。
// 优先取 app.yaml other.aiChat.aiChatApiKey；为空时不注入（由后端开关决定是否放行）。
const appKey = computed(() => getConfig()?.other?.aiChat?.aiChatApiKey ?? '');
</script>

<style scoped>
.ai-view {
  height: 100%;
  padding: var(--ai-spacing-md);
  box-sizing: border-box;
  overflow: hidden;
}
.ai-view__container {
  height: 100%;
  border-radius: var(--ai-card-radius);
  overflow: hidden;
  background: var(--ai-card-bg);
  border: 1px solid var(--ai-card-border);
}
</style>
