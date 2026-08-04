<template>
  <div class="page-container">
    <div class="chat-wrapper">
      <ReChat
        url="/v1/chat/completions"
        model="gpt-3.5-turbo"
        :temperature="0.7"
        :models="[
          { label: 'GPT-3.5', value: 'gpt-3.5-turbo' },
          { label: 'GPT-4', value: 'gpt-4' },
        ]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ReChat from '@repo/ui/re-chat';
</script>

<style scoped>
.page-container {
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f8 50%, #e8ecf6 100%);
  padding: 12px;
  box-sizing: border-box;
}

.chat-wrapper {
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 8px 32px rgba(99, 102, 241, 0.06);
  animation: chat-enter 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes chat-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
