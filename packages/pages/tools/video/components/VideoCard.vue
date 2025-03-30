<script setup>
import { IconifyIconOnline } from "@iconify/vue";

defineProps({
  video: {
    type: Object,
    required: true,
  },
  formatNumber: {
    type: Function,
    required: true,
  },
  openVideoLink: {
    type: Function,
    required: true,
  },
});
</script>

<template>
  <div class="video-card">
    <!-- 缩略图作为整个卡片的背景 -->
    <div class="video-card__thumbnail-wrapper">
      <img :src="video.monitorVideoThumbnail" :alt="video.monitorVideoTitle" class="video-card__thumbnail" />

      <!-- 渐变遮罩层，使文字更易读 -->
      <div class="video-card__overlay"></div>

      <!-- 视频时长和平台标签 -->
      <div class="video-card__duration">{{ video.monitorVideoDuration }}</div>
      <div class="video-card__platform">
        <el-tag size="small" effect="dark" type="primary">{{ video.monitorVideoPlatform }}</el-tag>
      </div>

      <!-- 播放按钮 -->
      <div class="video-card__play-button" @click="openVideoLink(video.monitorVideoUrl)">
        <IconifyIconOnline icon="ri:play-fill" class="video-card__play-icon" />
      </div>
    </div>

    <!-- 视频信息 -->
    <div class="video-card__content">
      <div class="video-card__title" @click="openVideoLink(video.monitorVideoUrl)">
        {{ video.monitorVideoTitle }}
      </div>
      <div class="video-card__author">{{ video.monitorVideoAuthor }}</div>
      <div class="video-card__meta">
        <div class="video-card__meta-item">
          <IconifyIconOnline icon="ri:eye-line" class="video-card__meta-icon" />
          <span>{{ formatNumber(video.monitorVideoViews) }}次观看</span>
        </div>
        <div class="video-card__meta-item">
          <IconifyIconOnline icon="ri:thumb-up-line" class="video-card__meta-icon" />
          <span>{{ formatNumber(video.monitorVideoLikes) }}</span>
        </div>
        <div class="video-card__meta-item">
          <IconifyIconOnline icon="ri:time-line" class="video-card__meta-icon" />
          <span>{{ video.monitorVideoPublishDate }}</span>
        </div>
      </div>
      <div class="video-card__type">
        <el-tag size="small" effect="plain" type="info">{{ video.monitorVideoType }}</el-tag>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.video-card {
  border-radius: 12px;
  overflow: hidden;
  background-color: var(--el-bg-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);

    .video-card__play-button {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }

    .video-card__thumbnail {
      transform: scale(1.05);
    }
  }

  &__thumbnail-wrapper {
    position: relative;
    width: 100%;
    padding-top: 56.25%; /* 16:9 宽高比 */
    overflow: hidden;
  }

  &__thumbnail {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  &__overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50%;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
    z-index: 1;
  }

  &__duration {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 2;
  }

  &__platform {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 2;
  }

  &__play-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.8);
    width: 50px;
    height: 50px;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 3;

    &:hover {
      background-color: var(--el-color-primary);

      .video-card__play-icon {
        color: white;
      }
    }
  }

  &__play-icon {
    font-size: 24px;
    color: var(--el-color-primary);
    transition: color 0.3s ease;
  }

  &__content {
    padding: 15px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  &__author {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 10px;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 10px;
    margin-top: auto;
  }

  &__meta-item {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__meta-icon {
    margin-right: 4px;
    font-size: 14px;
  }

  &__type {
    margin-top: 8px;
  }
}
</style>
