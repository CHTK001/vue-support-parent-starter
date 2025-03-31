<script setup lang="ts">

defineProps({
  env: Object,
  playMusic: Function,
  formatTime: Function
});
</script>

<template>
  <div class="music-sidebar">
    <!-- 导航菜单 -->
    <div class="music-sidebar__nav">
      <!-- 导航项... -->
    </div>
    
    <!-- 最近播放 -->
    <div class="music-sidebar__recent" v-if="env.playHistory.length">
      <div class="music-sidebar__section-title">
        <IconifyIconOnline icon="ri:time-line" />
        <span>最近播放</span>
      </div>
      
      <div class="music-sidebar__recent-list">
        <div
          v-for="music in env.playHistory.slice(0, 5)"
          :key="music.musicId"
          class="music-sidebar__recent-item"
          :class="{ 'music-sidebar__recent-item--active': env.currentMusic?.musicId === music.musicId }"
          @click="playMusic(music)"
        >
          <div class="music-sidebar__recent-cover">
            <img :src="music.musicCover" :alt="music.musicTitle" />
            <div class="music-sidebar__recent-play">
              <IconifyIconOnline :icon="env.currentMusic?.musicId === music.musicId && env.isPlaying ? 'ri:pause-mini-fill' : 'ri:play-mini-fill'" />
            </div>
          </div>
          <div class="music-sidebar__recent-info">
            <div class="music-sidebar__playlist-title">{{ music.musicTitle }}</div>
            <div class="music-sidebar__playlist-artist">{{ music.musicArtist }}</div>
          </div>
          <div class="music-sidebar__playlist-duration">{{ formatTime(music.musicDuration) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.music-sidebar {
  width: 250px;
  padding: 20px;
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  
  &__nav {
    margin-bottom: 30px;
  }
  
  &__nav-item {
    display: flex;
    align-items: center;
    padding: 12px 15px;
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 5px;
    transition: all 0.3s;
    
    .iconify {
      margin-right: 10px;
      font-size: 18px;
    }
    
    &:hover {
      background-color: var(--el-color-primary-light-9);
    }
    
    &--active {
      background-color: var(--el-color-primary-light-8);
      color: var(--el-color-primary);
      font-weight: 500;
    }
  }
  
  &__section-title {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    
    .iconify {
      margin-right: 5px;
    }
    
    span {
      flex: 1;
    }
  }
  
  &__playlist-preview {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  &__playlist-item {
    display: flex;
    align-items: center;
    padding: 8px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background-color: var(--el-color-primary-light-9);
    }
    
    &--active {
      background-color: var(--el-color-primary-light-8);
      color: var(--el-color-primary);
    }
  }
  
  &__playlist-index {
    width: 20px;
    text-align: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  
  &__playlist-info {
    flex: 1;
    margin: 0 10px;
    overflow: hidden;
  }
  
  &__playlist-title {
    font-size: 13px;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &__playlist-artist {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &__playlist-duration {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  
  &__playlist-more {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-align: center;
    padding: 5px;
    margin-top: 5px;
    border-top: 1px dashed var(--el-border-color-lighter);
  }
  
  &__current-playlist {
    margin-top: auto;
    padding-top: 20px;
    border-top: 1px solid var(--el-border-color-light);
  }
}