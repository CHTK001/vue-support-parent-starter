<script setup lang="ts">
import { IconifyIconOnline } from '@iconify/vue';

defineProps({
  env: Object,
  playMusic: Function,
  formatTime: Function,
  isFavorite: Function,
  toggleFavorite: Function
});
</script>

<template>
  <div class="music-playlist-drawer">
    <div class="music-playlist-drawer__header">
      <div class="music-playlist-drawer__title">
        <span>当前播放列表</span>
        <ScButton 
          link 
          type="danger" 
          size="small" 
          @click="env.currentPlaylist = []"
          v-if="env.currentPlaylist.length"
        >
          清空
        </ScButton>
      </div>
      <ScButton 
        circle 
        size="small" 
        @click="env.showPlaylistDrawer = false"
      >
        <IconifyIconOnline icon="ri:close-line" />
      </ScButton>
    </div>
    
    <div class="music-playlist-drawer__empty" v-if="!env.currentPlaylist.length">
      <IconifyIconOnline icon="ri:music-2-line" class="music-playlist-drawer__empty-icon" />
      <div class="music-playlist-drawer__empty-text">播放列表为空</div>
    </div>
    
    <div class="music-playlist-drawer__list" v-else>
      <div
        v-for="(music, index) in env.currentPlaylist"
        :key="music.musicId"
        class="music-playlist-drawer__item"
        :class="{ 'music-playlist-drawer__item--active': env.currentMusic?.musicId === music.musicId }"
        @click="playMusic(music)"
      >
        <div class="music-playlist-drawer__item-index">{{ index + 1 }}</div>
        <div class="music-playlist-drawer__item-info">
          <div class="music-playlist-drawer__item-title">{{ music.musicTitle }}</div>
          <div class="music-playlist-drawer__item-artist">{{ music.musicArtist }}</div>
        </div>
        <div class="music-playlist-drawer__item-duration">{{ formatTime(music.musicDuration) }}</div>
        <div class="music-playlist-drawer__item-actions">
          <ScButton 
            circle
            size="small"
            :type="isFavorite(music) ? 'danger' : 'default'"
            @click.stop="toggleFavorite(music)"
          >
            <IconifyIconOnline :icon="isFavorite(music) ? 'ri:heart-fill' : 'ri:heart-line'" />
          </ScButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.music-playlist-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 80px;
  width: 380px;
  background: var(--el-bg-color-overlay);
  border-left: 1px solid var(--el-border-color-lighter);
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
  z-index: 999;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  animation: slideInRight 0.3s ease-out;
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  &__header {
    padding: 16px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    flex-shrink: 0;
  }
  
  &__title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  
  &__list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    
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
    padding: 40px;
    
    &-icon {
      font-size: 64px;
      opacity: 0.4;
    }
    
    &-text {
      font-size: 14px;
    }
  }
  
  &__item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 6px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent;
    
    &:hover {
      background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color));
      border-color: var(--el-border-color-lighter);
      transform: translateX(-4px);
    }
    
    &--active {
      background: color-mix(in srgb, var(--el-color-primary) 12%, var(--el-bg-color));
      border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
      color: var(--el-color-primary);
      box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
    }
  }
  
  &__item-index {
    width: 32px;
    text-align: center;
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }
  
  &__item-info {
    flex: 1;
    margin: 0 12px;
    min-width: 0;
  }
  
  &__item-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &__item-artist {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &__item-duration {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-right: 8px;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }
  
  &__item-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
    
    :deep(.el-button) {
      transition: all 0.3s ease;
      
      &:hover {
        transform: scale(1.1);
      }
    }
  }
}
</style>