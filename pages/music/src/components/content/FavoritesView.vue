<script setup lang="ts">
import { IconifyIconOnline } from '@iconify/vue';

defineProps({
  env: Object,
  playMusic: Function,
  toggleFavorite: Function,
  isFavorite: Function,
  formatTime: Function
});
</script>

<template>
  <div class="favorites-view">
    <div class="favorites-view__header">
      <h2 class="favorites-view__title">我的收藏</h2>
      <div class="favorites-view__count">共 {{ env.favorites.length }} 首歌曲</div>
    </div>
    
    <div class="favorites-view__empty" v-if="!env.favorites.length">
      <IconifyIconOnline icon="ri:heart-add-line" class="favorites-view__empty-icon" />
      <div class="favorites-view__empty-text">您还没有收藏任何歌曲</div>
      <div class="favorites-view__empty-tips">
        在搜索结果或播放列表中点击心形图标即可收藏歌曲
      </div>
    </div>
    
    <div class="favorites-view__music-list" v-else>
      <div
        v-for="(music, index) in env.favorites"
        :key="music.musicId"
        class="favorites-view__music-item"
        :class="{ 'favorites-view__music-item--active': env.currentMusic?.musicId === music.musicId }"
      >
        <div class="favorites-view__music-index">{{ index + 1 }}</div>
        <div class="favorites-view__music-cover-small" @click="playMusic(music)">
          <img :src="music.musicCover" :alt="music.musicTitle" />
          <div class="favorites-view__music-play-small">
            <IconifyIconOnline :icon="env.currentMusic?.musicId === music.musicId && env.isPlaying ? 'ri:pause-fill' : 'ri:play-fill'" />
          </div>
        </div>
        <div class="favorites-view__music-info" @click="playMusic(music)">
          <div class="favorites-view__music-title">{{ music.musicTitle }}</div>
          <div class="favorites-view__music-artist">{{ music.musicArtist }}</div>
        </div>
        <div class="favorites-view__music-album">{{ music.musicAlbum }}</div>
        <div class="favorites-view__music-duration">{{ formatTime(music.musicDuration) }}</div>
        <div class="favorites-view__music-actions">
          <el-button
            circle
            size="small"
            type="danger"
            @click="toggleFavorite(music)"
          >
            <IconifyIconOnline icon="ri:heart-fill" />
          </el-button>
          <el-button
            circle
            size="small"
            @click="env.currentPlaylist = [music]; playMusic(music)"
          >
            <IconifyIconOnline icon="ri:play-list-add-line" />
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.favorites-view {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid var(--el-border-color-lighter);
  }
  
  &__title {
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    gap: 12px;
    
    &::before {
      content: '';
      width: 4px;
      height: 20px;
      background: linear-gradient(180deg, var(--el-color-primary), var(--el-color-primary-light-3));
      border-radius: 2px;
    }
  }
  
  &__count {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
  
  &__music-list {
    background: var(--el-bg-color-overlay);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid var(--el-border-color-lighter);
  }
  
  &__music-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color));
      transform: translateX(4px);
    }
    
    &--active {
      background: color-mix(in srgb, var(--el-color-primary) 12%, var(--el-bg-color));
      color: var(--el-color-primary);
      border-left: 3px solid var(--el-color-primary);
    }
  }
  
  &__music-index {
    width: 36px;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }
  
  &__music-cover-small {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    margin-right: 16px;
    cursor: pointer;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    &:hover {
      img {
        transform: scale(1.1);
      }
      
      .favorites-view__music-play-small {
        opacity: 1;
      }
    }
  }
  
  &__music-play-small {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: color-mix(in srgb, var(--el-color-primary) 80%, transparent);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.3s ease;
    
    .iconify {
      font-size: 24px;
      color: #fff;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
  }
  
  &__music-info {
    flex: 1;
    min-width: 0;
    cursor: pointer;
  }
  
  &__music-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--el-text-color-primary);
    transition: color 0.3s ease;
  }
  
  &__music-item:hover &__music-title {
    color: var(--el-color-primary);
  }
  
  &__music-artist {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &__music-album {
    width: 180px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0 16px;
    flex-shrink: 0;
  }
  
  &__music-duration {
    width: 60px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-align: center;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }
  
  &__music-actions {
    display: flex;
    gap: 6px;
    margin-left: 12px;
    flex-shrink: 0;
    
    :deep(.el-button) {
      transition: all 0.3s ease;
      
      &:hover {
        transform: scale(1.1);
      }
    }
  }
  
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
    
    &-icon {
      font-size: 80px;
      color: var(--el-text-color-placeholder);
      opacity: 0.4;
      margin-bottom: 20px;
    }
    
    &-text {
      font-size: 16px;
      color: var(--el-text-color-regular);
      margin-bottom: 12px;
      font-weight: 500;
    }
    
    &-tips {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      max-width: 400px;
    }
  }
}
</style>