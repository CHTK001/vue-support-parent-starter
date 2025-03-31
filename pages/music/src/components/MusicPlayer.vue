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
      <el-slider v-model="env.volume" :disabled="env.isMuted" @input="adjustVolume" class="music-player__volume-slider" />
      <el-button circle @click="env.showLyrics = !env.showLyrics">
        <IconifyIconOnline icon="ri:file-list-line" :style="{ color: env.showLyrics ? 'var(--el-color-primary)' : '' }" />
      </el-button>
      <el-button circle @click="env.showPlaylistDrawer = !env.showPlaylistDrawer">
        <IconifyIconOnline icon="ri:play-list-2-fill" />
      </el-button>
    </div>
  </div>
</template>