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
  &__title {
    font-size: 20px;
    margin-bottom: 20px;
    font-weight: 500;
  }
  
  &__music-list {
    background-color: var(--app-bg-primary);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: var(--app-shadow-sm);
  }
  
  &__music-item {
    display: flex;
    align-items: center;
    padding: 12px 15px;
    border-bottom: 1px solid var(--app-border-secondary);
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background-color: var(--app-primary-lightest);
    }
    
    &--active {
      background-color: var(--app-primary-lighter);
      color: var(--app-primary);
    }
  }
  
  &__music-index {
    width: 30px;
    text-align: center;
    font-size: 14px;
    color: var(--app-text-secondary);
  }
  
  &__music-cover-small {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    margin-right: 15px;
    cursor: pointer;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    &:hover .favorites-view__music-play-small {
      opacity: 1;
    }
  }
  
  &__music-play-small {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--app-shadow);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.3s;
    
    .iconify {
      font-size: 20px;
      color: var(--app-text-primary);
    }
  }
  
  &__music-info {
    flex: 1;
    min-width: 0;
    cursor: pointer;
  }
  
  &__music-title {
    font-size: 14px;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &__music-artist {
    font-size: 12px;
    color: var(--app-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &__music-album {
    width: 150px;
    font-size: 12px;
    color: var(--app-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0 15px;
  }
  
  &__music-duration {
    width: 50px;
    font-size: 12px;
    color: var(--app-text-secondary);
    text-align: center;
  }
  
  &__music-actions {
    display: flex;
    gap: 5px;
    margin-left: 15px;
  }
}
</style>