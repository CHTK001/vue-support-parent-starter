<template>
  <div class="file-manager">
    <!-- 使用新的文件管理页面组件 -->
    <FileManagerPage
      :server-id="server?.monitorSysGenServerId || 0"
      :server-info="server"
      @close="$emit('close')"
    />
  </div>
</template>

<script setup lang="ts">
import FileManagerPage from "./FileManagerPage.vue";

// Props
defineProps<{
  server?: any;
}>();

// Emits
defineEmits<{
  close: [];
}>();
</script>

<style scoped>
.file-manager {
  height: 100%;
  width: 100%;
}
</style>
