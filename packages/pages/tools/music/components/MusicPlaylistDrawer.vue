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
        <el-button 
          link 
          type="danger" 
          size="small" 
          @click="env.currentPlaylist = []"
          v-if="env.currentPlaylist.length"
        >
          清空
        </el-button>
      </div>
      <el-button 
        circle 
        size="small" 
        @click="env.showPlaylistDrawer = false"
      >
        <IconifyIconOnline icon="ri:close-line" />
      </el-button>
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
          <el-button
            circle
            size="small"
            :type="isFavorite(music) ? 'danger' : 'default'"
            @click.stop="toggleFavorite(music)"
          >
            <IconifyIconOnline :icon="isFavorite(music) ? 'ri:heart-fill' : 'ri:heart-line'" />
          </el-button>
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
  width: 350px;
  background-color: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-light);
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
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
  
  &__count {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  
  &__content {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
  }
  
  &__empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
  }
  
  &__item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 5px;
    
    &:hover {
      background-color: var(--el-color-primary-light-9);
    }
    
    &--active {
      background-color: var(--el-color-primary-light-8);
      color: var(--el-color-primary);
    }
  }
  
  &__item-index {
    width: 30px;
    text-align: center;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
  
  &__item-info {
    flex: 1;
    margin: 0 10px;
    cursor: pointer;
  }
  
  &__item-title {
    font-size: 14px;
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
    margin-right: 10px;
  }
}
</style>