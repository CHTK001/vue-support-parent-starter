<script setup lang="ts">
import { IconifyIconOnline } from '@iconify/vue';

defineProps({
  env: Object,
  lyricsContainerRef: Object
});
</script>

<template>
  <div class="music-lyrics">
    <div class="music-lyrics__header">
      <div class="music-lyrics__title">
        <span>歌词</span>
        <el-button 
          circle 
          size="small" 
          @click="env.showLyrics = false"
        >
          <IconifyIconOnline icon="ri:close-line" />
        </el-button>
      </div>
      <div class="music-lyrics__music-info" v-if="env.currentMusic">
        <div class="music-lyrics__music-title">{{ env.currentMusic.title }}</div>
        <div class="music-lyrics__music-artist">{{ env.currentMusic.artist }}</div>
      </div>
    </div>
    
    <div class="music-lyrics__content" ref="lyricsContainerRef">
      <div v-if="env.parsedLyrics.length === 0" class="music-lyrics__empty">
        暂无歌词
      </div>
      <div 
        v-for="(lyric, index) in env.parsedLyrics" 
        :key="index"
        class="music-lyrics__lyric"
        :class="{ 'music-lyrics__lyric--active': index === env.currentLyricIndex }"
      >
        {{ lyric.text }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.music-lyrics {
  position: fixed;
  bottom: 80px;
  left: 0;
  right: 0;
  height: 300px;
  background: var(--el-bg-color-overlay);
  border-top: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.12);
  z-index: 999;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  animation: slideUp 0.3s ease-out;
  
  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  &__header {
    padding: 16px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
  }
  
  &__title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  
  &__music-info {
    display: flex;
    flex-direction: column;
  }
  
  &__music-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
    color: var(--el-text-color-primary);
  }
  
  &__music-artist {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  
  &__content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    text-align: center;
    
    // 自定义滚动条
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color);
      border-radius: 3px;
      
      &:hover {
        background: var(--el-border-color-darker);
      }
    }
  }
  
  &__empty {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-placeholder);
    gap: 12px;
    
    &-icon {
      font-size: 48px;
      opacity: 0.5;
    }
  }
  
  &__lyric {
    padding: 12px 0;
    font-size: 14px;
    line-height: 1.8;
    color: var(--el-text-color-regular);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0.6;
    
    &--active {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-color-primary);
      opacity: 1;
      transform: scale(1.05);
      text-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
    }
  }
}
</style>