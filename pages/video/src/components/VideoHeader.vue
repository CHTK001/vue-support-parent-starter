<script setup>
import { IconifyIconOnline } from '@iconify/vue';

defineProps({
  title: {
    type: String,
    default: '视频搜索工具'
  },
  subtitle: {
    type: String,
    default: '一站式搜索各大视频平台内容'
  }
});
</script>

<template>
  <div class="video-header-container">
    <div class="video-header">
      <div class="video-header__inner">
        <div class="video-header__title">{{ title }}</div>
        <div class="video-header__subtitle">{{ subtitle }}</div>
      </div>
      <div class="video-header__decoration">
        <div class="video-header__circle"></div>
        <div class="video-header__circle"></div>
        <div class="video-header__circle"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.video-header-container {
  margin-bottom: 20px;
}

.video-header {
  background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
  border-radius: 12px;
  padding: 30px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(var(--el-color-primary-rgb), 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;

  &__inner {
    position: relative;
    z-index: 2;
  }

  &__title {
    font-size: 28px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &__subtitle {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.9);
  }

  &__decoration {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  &__circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);

    &:nth-child(1) {
      width: 200px;
      height: 200px;
      top: -100px;
      right: -50px;
      animation: float 15s infinite ease-in-out;
    }

    &:nth-child(2) {
      width: 150px;
      height: 150px;
      bottom: -50px;
      left: -30px;
      animation: float 12s infinite ease-in-out reverse;
    }

    &:nth-child(3) {
      width: 100px;
      height: 100px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: pulse 8s infinite ease-in-out;
    }
  }
}

/* 动画效果 */
@keyframes pulse {
  0%,
  100% {
    transform: scale(1) translate(-50%, -50%);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1) translate(-45%, -45%);
    opacity: 1;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}
</style>