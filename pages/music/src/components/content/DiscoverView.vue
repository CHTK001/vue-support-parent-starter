<script setup lang="ts">
import { IconifyIconOnline } from '@iconify/vue';

defineProps({
  env: Object,
  loadPlaylistDetail: Function
});
</script>

<template>
  <div class="discover-view">
    <h2 class="discover-view__title">推荐歌单</h2>
    <div class="discover-view__playlist-grid">
      <div
        v-for="playlist in env.recommendPlaylists"
        :key="playlist.musicId"
        class="discover-view__playlist-card"
        @click="loadPlaylistDetail(playlist.musicId)"
      >
        <div class="discover-view__playlist-cover">
          <img :src="playlist.musicCover" :alt="playlist.musicName" />
          <div class="discover-view__playlist-play">
            <IconifyIconOnline icon="ri:play-fill" />
          </div>
        </div>
        <div class="discover-view__playlist-info">
          <div class="discover-view__playlist-name">{{ playlist.musicName }}</div>
          <div class="discover-view__playlist-count">{{ playlist.musicCount }}首歌曲</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.discover-view {
  &__title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 24px;
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
  
  &__playlist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 24px;
  }
  
  &__playlist-card {
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      transform: translateY(-8px);
      
      .discover-view__playlist-cover {
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
      }
      
      .discover-view__playlist-play {
        opacity: 1;
      }
    }
  }
  
  &__playlist-cover {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--el-bg-color-page);
    
    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    
    &:hover img {
      transform: scale(1.1);
    }
  }
  
  &__playlist-play {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: color-mix(in srgb, var(--el-color-primary) 85%, transparent);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    
    .iconify {
      font-size: 48px;
      color: #fff;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
      transition: transform 0.3s ease;
    }
    
    &:hover .iconify {
      transform: scale(1.1);
    }
  }
  
  &__playlist-info {
    padding: 0 4px;
  }
  
  &__playlist-name {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--el-text-color-primary);
    transition: color 0.3s ease;
  }
  
  &__playlist-card:hover &__playlist-name {
    color: var(--el-color-primary);
  }
  
  &__playlist-count {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>