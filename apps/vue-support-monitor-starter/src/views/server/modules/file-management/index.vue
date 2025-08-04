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
  height: 100vh; /* 撑满整个视口高度 */
  width: 100vw; /* 撑满整个视口宽度 */
  background: #ffffff; /* 设置背景为白色 */
  position: fixed; /* 固定定位确保撑满页面 */
  top: 0;
  left: 0;
  z-index: 1000; /* 确保在最上层 */
  overflow: hidden; /* 防止滚动条 */
}
</style>
