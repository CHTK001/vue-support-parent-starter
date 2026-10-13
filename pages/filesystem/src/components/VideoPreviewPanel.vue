<!--
  临时占位组件：FileStorageManage.vue 引用的视频预览面板在当前工作区缺失，
  导致 Vite 无法解析 import，整个应用加载失败。先放一个最小占位以解除阻塞，
  待用户补齐真实 VideoPreviewPanel 后删除本文件。
-->
<script setup lang="ts">
defineProps<{
  bucket?: string
  objectKey?: string
  fileName?: string
  inner?: string
  size?: number
}>()
</script>

<template>
  <div class="video-preview-panel">视频预览暂不可用</div>
</template>

<style scoped>
.video-preview-panel {
  padding: 24px;
  color: #909399;
  text-align: center;
}
</style>
