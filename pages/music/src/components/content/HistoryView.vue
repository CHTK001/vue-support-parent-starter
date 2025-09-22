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
  <div class="history-view">
    <div class="history-view__header">
      <h2 class="history-view__title">播放历史</h2>
      <div class="history-view__count">共 {{ env.playHistory.length }} 首歌曲</div>
    </div>
    
    <div class="history-view__empty" v-if="!env.playHistory.length">
      <IconifyIconOnline icon="ri:history-line" class="history-view__empty-icon" />
      <div class="history-view__empty-text">您还没有播放过任何歌曲</div>
      <div class="history-view__empty-tips">
        播放歌曲后，这里会记录您的播放历史
      </div>
    </div>
    
    <div class="history-view__music-list" v-else>
      <div
        v-for="(music, index) in env.playHistory"
        :key="music.musicId"
        class="history-view__music-item"
        :class="{ 'history-view__music-item--active': env.currentMusic?.musicId === music.musicId }"
      >
        <div class="history-view__music-index">{{ index + 1 }}</div>
        <div class="history-view__music-cover-small" @click="playMusic(music)">
          <img :src="music.musicCover" :alt="music.musicTitle" />
          <div class="history-view__music-play-small">
            <IconifyIconOnline :icon="env.currentMusic?.musicId === music.musicId && env.isPlaying ? 'ri:pause-fill' : 'ri:play-fill'" />
          </div>
        </div>
        <div class="history-view__music-info" @click="playMusic(music)">
          <div class="history-view__music-title">{{ music.musicTitle }}</div>
          <div class="history-view__music-artist">{{ music.musicArtist }}</div>
        </div>
        <div class="history-view__music-album">{{ music.musicAlbum }}</div>
        <div class="history-view__music-duration">{{ formatTime(music.musicDuration) }}</div>
        <div class="history-view__music-actions">
          <el-button
            circle
            size="small"
            :type="isFavorite(music) ? 'danger' : 'default'"
            @click="toggleFavorite(music)"
          >
            <IconifyIconOnline :icon="isFavorite(music) ? 'ri:heart-fill' : 'ri:heart-line'" />
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
.history-view {
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
    
    &:hover .history-view__music-play-small {
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