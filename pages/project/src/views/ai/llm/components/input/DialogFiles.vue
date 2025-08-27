<template>
  <div v-if="instance.files[0]" class="files-box">
    <File v-for="file of instance.files" :key="file.id" :file="file" />
  </div>
</template>

<script setup lang="ts" name="DialogFiles">
import type { LLMDialog } from "../../llmDialog/llmDialog";
import { inject } from "vue";
import File from "../items/File.vue";

const instance = inject<LLMDialog>("instance") as LLMDialog;
</script>

<style scoped>
.files-box {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  max-height: 160px;
  overflow: auto;
}
</style>
