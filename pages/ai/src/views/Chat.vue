<template>
  <div class="page-container">
    <ReChat
      api-url="/v1/chat/completions"
      model="gpt-3.5-turbo"
      :temperature="0.7"
    />
  </div>
</template>

<script setup lang="ts">
import { ReChat } from '@repo/ui/re-chat';
</script>

<style scoped>
.page-container {
  height: 100%;
}
</style>
