<template>
  <div class="video-add-page">
    <div class="page-header">
      <div class="back-button" @click="goBack">
        <IconifyIconOnline icon="ep:arrow-left" />
        <span>返回视频列表</span>
      </div>
      <h2>新增视频</h2>
    </div>
    
    <VideoForm />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import VideoForm from './components/VideoForm.vue';

const router = useRouter();

const goBack = () => {
  router.push('/video/manage');
};
</script>

<style scoped>
.video-add-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
  position: relative;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  margin-bottom: 12px;
  color: var(--el-color-primary);
  font-size: 14px;
}

h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
</style> 