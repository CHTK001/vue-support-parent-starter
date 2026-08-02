<template>
  <el-menu
    :default-active="activeRoute"
    router
    class="side-menu"
    background-color="var(--el-bg-color)"
    text-color="var(--el-text-color-primary)"
    active-text-color="var(--el-color-primary)"
  >
    <el-menu-item index="/chat">
      <el-icon><ChatDotRound /></el-icon>
      <span>对话</span>
    </el-menu-item>
    <el-menu-item index="/image-gen">
      <el-icon><Picture /></el-icon>
      <span>文生图</span>
    </el-menu-item>
    <el-menu-item index="/video-gen">
      <el-icon><VideoCamera /></el-icon>
      <span>文生视频</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ChatDotRound, Picture, VideoCamera } from '@element-plus/icons-vue';

const route = useRoute();
const activeRoute = computed(() => route.path);
</script>

<style scoped>
.side-menu {
  height: 100%;
  border-right: none;
}
</style>
