<template>
  <div class="ai-view">
    <div class="ai-view__container">
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
