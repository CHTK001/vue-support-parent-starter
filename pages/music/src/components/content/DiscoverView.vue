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
    <div class="discover-view__playlists">
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
    font-size: 20px;
    margin-bottom: 20px;
    font-weight: 500;
  }
  
  &__playlist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
  }
  
  &__playlist-card {
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      transform: translateY(-5px);
      
      .discover-view__playlist-play {
        opacity: 1;
      }
    }
  }
  
  &__playlist-cover {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    
    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  &__playlist-play {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.3s;
    
    .iconify {
      font-size: 40px;
      color: var(--el-text-color-primary);
    }
  }
  
  &__playlist-name {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &__playlist-count {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>