<script setup lang="ts">
import { IconifyIconOnline } from '@iconify/vue';

defineProps({
  env: Object,
  audioRef: Object,
  progressBarRef: Object,
  togglePlay: Function,
  playNext: Function,
  playPrev: Function,
  toggleRandom: Function,
  toggleLoop: Function,
  toggleMute: Function,
  seekTo: Function,
  progress: Number,
  formattedCurrentTime: String,
  formattedDuration: String
});
</script>

<template>
  <div class="music-player__controls" v-if="env.currentMusic">
    <!-- 左侧：当前播放信息 -->
    <div class="music-player__now-playing">
      <div class="music-player__now-playing-cover">
        <img :src="env.currentMusic.musicCover" :alt="env.currentMusic.musicTitle" />
      </div>
      <div class="music-player__now-playing-info">
        <div class="music-player__now-playing-title">{{ env.currentMusic.musicTitle }}</div>
        <div class="music-player__now-playing-artist">{{ env.currentMusic.musicArtist }}</div>
      </div>
    </div>
    
    <!-- 中间：播放控制 -->
    <div class="music-player__control-center">
      <div class="music-player__control-buttons">
        <el-button circle @click="toggleRandom">
          <IconifyIconOnline :icon="env.isRandom ? 'ri:shuffle-fill' : 'ri:shuffle-line'" :style="{ color: env.isRandom ? 'var(--el-color-primary)' : '' }" />
        </el-button>
        <el-button circle @click="playPrev">
          <IconifyIconOnline icon="ri:skip-back-fill" />
        </el-button>
        <el-button circle size="large" @click="togglePlay">
          <IconifyIconOnline :icon="env.isPlaying ? 'ri:pause-fill' : 'ri:play-fill'" />
        </el-button>
        <el-button circle @click="playNext">
          <IconifyIconOnline icon="ri:skip-forward-fill" />
        </el-button>
        <el-button circle @click="toggleLoop">
          <IconifyIconOnline :icon="env.isLoop ? 'ri:repeat-one-fill' : 'ri:repeat-line'" :style="{ color: env.isLoop ? 'var(--el-color-primary)' : '' }" />
        </el-button>
      </div>
      
      <div class="music-player__progress-container">
        <span class="music-player__time">{{ formattedCurrentTime }}</span>
        <div class="music-player__progress-bar" ref="progressBarRef" @click="seekTo">
          <div class="music-player__progress-current" :style="{ width: `${progress}%` }"></div>
        </div>
        <span class="music-player__time">{{ formattedDuration }}</span>
      </div>
    </div>
    
    <!-- 右侧：音量控制和歌词 -->
    <div class="music-player__control-right">
      <el-button circle @click="toggleMute">
        <IconifyIconOnline :icon="env.isMuted ? 'ri:volume-mute-fill' : env.volume > 50 ? 'ri:volume-up-fill' : 'ri:volume-down-fill'" />
      </el-button>
      <ScSlider v-model="env.volume" :disabled="env.isMuted" @input="adjustVolume" class="music-player__volume-slider" />
      <el-button circle @click="env.showLyrics = !env.showLyrics">
        <IconifyIconOnline icon="ri:file-list-line" :style="{ color: env.showLyrics ? 'var(--el-color-primary)' : '' }" />
      </el-button>
      <el-button circle @click="env.showPlaylistDrawer = !env.showPlaylistDrawer">
        <IconifyIconOnline icon="ri:play-list-2-fill" />
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.music-player__controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: var(--el-bg-color-overlay);
  border-top: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  padding: 0 24px;
  z-index: 1000;
  backdrop-filter: blur(10px);
  
  &__now-playing {
    display: flex;
    align-items: center;
    min-width: 250px;
    margin-right: 24px;
    
    &-cover {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      overflow: hidden;
      margin-right: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      flex-shrink: 0;
      
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
    
    &-info {
      flex: 1;
      min-width: 0;
    }
    
    &-title {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--el-text-color-primary);
    }
    
    &-artist {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  
  &__control-center {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    max-width: 600px;
    margin: 0 auto;
  }
  
  &__control-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
    
    :deep(.el-button) {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
      }
      
      &.is-circle {
        border-radius: 50%;
      }
    }
    
    :deep(.el-button--large) {
      width: 48px;
      height: 48px;
      font-size: 20px;
      background: var(--el-color-primary);
      color: #fff;
      border: none;
      
      &:hover {
        background: var(--el-color-primary-light-3);
        transform: scale(1.15);
      }
    }
  }
  
  &__progress-container {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
  }
  
  &__time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    min-width: 40px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  
  &__progress-bar {
    flex: 1;
    height: 4px;
    background: var(--el-border-color-lighter);
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    transition: height 0.3s ease;
    
    &:hover {
      height: 6px;
    }
  }
  
  &__progress-current {
    height: 100%;
    background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
    border-radius: 2px;
    transition: width 0.1s linear;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      right: -6px;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      background: var(--el-color-primary);
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
  }
  
  &__progress-bar:hover &__progress-current::after {
    opacity: 1;
  }
  
  &__control-right {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 200px;
    justify-content: flex-end;
    
    :deep(.el-button) {
      transition: all 0.3s ease;
      
      &:hover {
        transform: scale(1.1);
      }
    }
  }
  
  &__volume-slider {
    width: 100px;
    
    :deep(.el-slider__runway) {
      background: var(--el-border-color-lighter);
    }
    
    :deep(.el-slider__bar) {
      background: var(--el-color-primary);
    }
    
    :deep(.el-slider__button) {
      border-color: var(--el-color-primary);
    }
  }
}
</style>