<template>
  <div class="system-container modern-bg video-add-page">
    <div class="page-header">
      <div class="header-background"></div>
      <div class="header-content">
        <el-button class="back-button" @click="goBack" circle>
          <IconifyIconOnline icon="ep:arrow-left" />
        </el-button>
        <div class="header-title">
          <h2 class="page-title">
            <IconifyIconOnline icon="ep:video-camera" class="title-icon" />
            新增视频
          </h2>
          <p class="page-description">填写视频信息，创建新的视频记录</p>
        </div>
      </div>
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
  min-height: 100vh;
}

.page-header {
  margin-bottom: 30px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  animation: fadeInDown 0.6s ease-out;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
  backdrop-filter: blur(10px);
}

.header-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 30px;
  z-index: 1;
}

.back-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--el-text-color-primary);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.header-title {
  flex: 1;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 12px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.title-icon {
  font-size: 28px;
}

.page-description {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 