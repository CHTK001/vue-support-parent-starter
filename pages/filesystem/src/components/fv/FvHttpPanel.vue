<!--
  临时占位组件：FileStorageManage.vue 引用的 FvHttpPanel.vue（HTTP/抓包类预览）
  在当前工作区缺失，导致 Vite 无法解析 import（Pre-transform error / error overlay），
  整个应用加载失败。按本工作区既有做法（见 components/VideoPreviewPanel.vue、
  components/SketchPreviewPanel.vue）先放最小占位以解除阻塞，
  待补齐真实的 HTTP 预览组件后删除本文件。
-->
<script setup lang="ts">
defineProps<{
  bucket?: string
  objectKey?: string
  fileName?: string
  src?: string
  inner?: string
  size?: number
}>()

defineEmits<{
  fallback: []
  error: [msg: string]
  rendered: []
}>()
</script>

<template>
  <div class="fv-http-panel">HTTP 预览暂不可用</div>
</template>

<style scoped>
.fv-http-panel {
  padding: 24px;
  color: var(--el-text-color-secondary, #909399);
  text-align: center;
}
</style>
