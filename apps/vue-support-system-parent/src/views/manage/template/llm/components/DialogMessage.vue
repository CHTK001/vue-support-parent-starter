<template>
  <div class="messages">
    <div class="messages-box">
      <Message v-for="message of messages" :key="message.id" :message="message" @reedit="handleReEdit" />
    </div>
  </div>
</template>

<script setup lang="ts" name="DialogMessage">
import { inject } from "vue";
import Message from "./items/Message.vue";
import type { LLMDialog } from "../llmDialog/llmDialog";

const instance = inject<LLMDialog>("instance") as LLMDialog;
const messages = instance.messages;
const handleReEdit = (content: string) => {
  instance.updateEditContent(content);
};
</script>

<style scoped>
.messages {
  width: 100%;
  box-sizing: border-box;
  flex-grow: 1;
}
.messages-box {
  display: flex;
  flex-direction: column;
  gap: var(--ld-message-gap);
  width: 100%;
  margin: 0 auto;
  padding: var(--ld-message-gap) 0 var(--ld-message-gap);
}
</style>
