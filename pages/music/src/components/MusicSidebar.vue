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
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  
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
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    .iconify {
      margin-right: 10px;
      font-size: 18px;
      transition: transform 0.3s ease;
    }
    
    &:hover {
      background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color));
      transform: translateX(4px);
      
      .iconify {
        transform: scale(1.1);
      }
    }
    
    &--active {
      background: color-mix(in srgb, var(--el-color-primary) 15%, var(--el-bg-color));
      color: var(--el-color-primary);
      font-weight: 500;
      box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
    }
  }
  
  &__section-title {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    
    .iconify {
      margin-right: 8px;
      font-size: 16px;
      color: var(--el-color-primary);
    }
    
    span {
      flex: 1;
    }
  }
  
  &__recent {
    margin-top: 20px;
  }
  
  &__recent-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  &__recent-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent;
    
    &:hover {
      background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color));
      border-color: var(--el-border-color-lighter);
      transform: translateX(4px);
    }
    
    &--active {
      background: color-mix(in srgb, var(--el-color-primary) 12%, var(--el-bg-color));
      border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
    }
  }
  
  &__recent-cover {
    position: relative;
    width: 50px;
    height: 50px;
    border-radius: 6px;
    overflow: hidden;
    margin-right: 12px;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    &:hover img {
      transform: scale(1.1);
    }
  }
  
  &__recent-play {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: color-mix(in srgb, var(--el-color-primary) 80%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    
    .iconify {
      font-size: 24px;
      color: #fff;
    }
  }
  
  &__recent-item:hover &__recent-play {
    opacity: 1;
  }
  
  &__playlist-info {
    flex: 1;
    margin: 0 10px;
    overflow: hidden;
    min-width: 0;
  }
  
  &__playlist-title {
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 4px;
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
    flex-shrink: 0;
  }
  
  &__current-playlist {
    margin-top: auto;
    padding-top: 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>