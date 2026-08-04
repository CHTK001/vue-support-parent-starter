<template>
  <div class="page-container">
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
</template>

<script setup lang="ts">
import ReChat from '@repo/ui/re-chat';
</script>

<style scoped>
.page-container {
  height: 100%;
}
</style>
