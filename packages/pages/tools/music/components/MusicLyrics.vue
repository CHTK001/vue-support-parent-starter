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
  background-color: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
  box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  flex-direction: column;
  
  &__header {
    padding: 15px 20px;
    border-bottom: 1px solid var(--el-border-color-light);
  }
  
  &__title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-size: 16px;
    font-weight: 500;
  }
  
  &__music-info {
    display: flex;
    flex-direction: column;
  }
  
  &__music-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  &__music-artist {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  
  &__content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    text-align: center;
  }
  
  &__empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
  }
  
  &__lyric {
    padding: 8px 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    transition: all 0.3s;
    
    &--active {
      font-size: 16px;
      color: var(--el-color-primary);
      font-weight: 500;
    }
  }
}
</style>