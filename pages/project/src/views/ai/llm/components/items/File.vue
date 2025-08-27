<template>
  <div class="file-box">
    <!-- <div class="file-name">{{ name }}</div> -->
    <!-- <div class="file-size">{{ size }}</div> -->
    <VueFilesPreview width="140px" height="140px" :file="getFile" />
    <div class="file-delete" @click="file.deleteSelf">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.293 5.293a1 1 0 0 1 1.414 0L12 10.586l5.293-5.293a1 1 0 1 1 1.414 1.414L13.414 12l5.293 5.293a1 1 0 0 1-1.414 1.414L12 13.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L10.586 12 5.293 6.707a1 1 0 0 1 0-1.414z" fill="#eb3d47" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts" name="File">
import { VueFilesPreview } from "vue-files-preview";
import "vue-files-preview/lib/style.css";

import type { llmDialogFile } from "../../llmDialog/llmDialog";
import { computed, toRefs } from "vue";

const props = defineProps<{ file: llmDialogFile }>();

const { file } = toRefs(props);

const getFile = computed(() => {
  return file.value.file;
});
const name = computed(() => {
  return file.value.file.name;
});

// 计算文件大小
const size = computed(() => {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let num = file.value.file.size;
  while (num > 1024) {
    num /= 1024;
    i++;
  }
  return `${num.toFixed(2)} ${sizes[i]}`;
});
</script>

<style scoped>
.file-box {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 10px;
  background-color: var(--ld-color-btn);
  color: var(--ld-color-text);
  font-size: 12px;
}
.file-name {
  max-width: 200px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.file-size {
  overflow: hidden;
  white-space: nowrap;
}
.file-delete {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  cursor: pointer;
}
</style>
