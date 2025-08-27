<template>
  <div class="chat-input">
    <div class="chat-input-box">
      <DialogEditor />
      <DialogAction :form="props.form" />
      <DialogFiles v-if="props.form.sysAiModuleVlm == 1" />
    </div>
  </div>
</template>

<script setup lang="ts" name="DialogInput">
import { defineProps } from "vue";
import DialogEditor from "./input/DialogEditor.vue";
import DialogAction from "./input/DialogAction.vue";
import DialogFiles from "./input/DialogFiles.vue";

const props = defineProps<{
  form: any;
}>();
</script>

<style scoped>
.chat-input {
  display: flex;
  justify-content: center;
  position: sticky;
  bottom: 0;
  width: 100%;
}
.chat-input-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: var(--ld-color-primary);
  box-shadow: 0px 7px 30px 0px rgba(100, 100, 111, 0.2);
  border-radius: 16px;
  padding: 10px;
  margin-bottom: 10px;
  width: 100%;
  max-width: 800px;
  box-sizing: border-box;
}
</style>
