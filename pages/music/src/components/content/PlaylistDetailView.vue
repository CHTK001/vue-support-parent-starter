<script setup lang="ts">
import { IconifyIconOnline } from "@iconify/vue";

defineProps({
  env: Object,
  playMusic: Function,
  toggleFavorite: Function,
  isFavorite: Function,
  playPlaylist: Function,
  formatTime: Function,
});
</script>

<template>
  <div class="playlist-detail-view" v-if="env.currentPlaylistDetail">
    <div class="playlist-detail-view__header">
      <div class="playlist-detail-view__playlist-cover-large">
        <img :src="env.currentPlaylistDetail.playlist.musicCover" :alt="env.currentPlaylistDetail.playlist.musicName" />
      </div>
      <div class="playlist-detail-view__playlist-info-large">
        <h2 class="playlist-detail-view__playlist-title-large">{{ env.currentPlaylistDetail.playlist.musicName }}</h2>
        <div class="playlist-detail-view__playlist-creator">创建者: {{ env.currentPlaylistDetail.playlist.musicCreator }}</div>
        <div class="playlist-detail-view__playlist-date">创建时间: {{ env.currentPlaylistDetail.playlist.createTime }}</div>
        <div class="playlist-detail-view__playlist-desc">
          {{ env.currentPlaylistDetail.playlist.musicDescription }}
        </div>
        <div class="playlist-detail-view__playlist-actions">
          <ScButton type="primary" @click="playPlaylist(env.currentPlaylistDetail.songs)">
            <IconifyIconOnline icon="ri:play-fill" />
            播放全部
          </ScButton>
        </div>
      </div>
    </div>

    <div class="playlist-detail-view__playlist-songs">
      <h3 class="playlist-detail-view__playlist-songs-title">
        歌曲列表 <span class="playlist-detail-view__playlist-songs-count">({{ env.currentPlaylistDetail.songs.length }}首)</span>
      </h3>

      <div class="playlist-detail-view__music-list">
        <div v-for="(music, index) in env.currentPlaylistDetail.songs" :key="music.musicId" class="playlist-detail-view__music-item" :class="{ 'playlist-detail-view__music-item--active': env.currentMusic?.musicId === music.musicId }">
          <div class="playlist-detail-view__music-index">{{ index + 1 }}</div>
          <div class="playlist-detail-view__music-cover-small" @click="playMusic(music)">
            <img :src="music.musicCover" :alt="music.musicTitle" />
            <div class="playlist-detail-view__music-play-small">
              <IconifyIconOnline :icon="env.currentMusic?.musicId === music.musicId && env.isPlaying ? 'ri:pause-fill' : 'ri:play-fill'" />
            </div>
          </div>
          <div class="playlist-detail-view__music-info" @click="playMusic(music)">
            <div class="playlist-detail-view__music-title">{{ music.musicTitle }}</div>
            <div class="playlist-detail-view__music-artist">{{ music.musicArtist }}</div>
          </div>
          <div class="playlist-detail-view__music-album">{{ music.musicAlbum }}</div>
          <div class="playlist-detail-view__music-duration">{{ formatTime(music.musicDuration) }}</div>
          <div class="playlist-detail-view__music-actions">
            <ScButton circle size="small" :type="isFavorite(music) ? 'danger' : 'default'" @click="toggleFavorite(music)">
              <IconifyIconOnline :icon="isFavorite(music) ? 'ri:heart-fill' : 'ri:heart-line'" />
            </ScButton>
            <ScButton 
              circle
              size="small"
              @click="
                env.currentPlaylist = [music];
                playMusic(music);
              "
            >
              <IconifyIconOnline icon="ri:play-list-add-line" />
            </ScButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.playlist-detail-view {
  &__header {
    display: flex;
    margin-bottom: 32px;
    background: var(--el-bg-color-overlay);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--el-border-color-lighter);
    padding: 24px;
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    }
  }

  &__playlist-cover-large {
    width: 220px;
    height: 220px;
    border-radius: 12px;
    overflow: hidden;
    margin-right: 24px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    flex-shrink: 0;
    transition: transform 0.3s ease;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    &:hover {
      transform: scale(1.02);
      
      img {
        transform: scale(1.1);
      }
    }
  }

  &__playlist-info-large {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__playlist-title-large {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__playlist-creator,
  &__playlist-date {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__playlist-desc {
    font-size: 14px;
    margin: 16px 0;
    color: var(--el-text-color-regular);
    line-height: 1.8;
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  &__playlist-actions {
    margin-top: auto;
    padding-top: 16px;
    
    :deep(.el-button) {
      border-radius: 24px;
      padding: 12px 24px;
      font-weight: 500;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
      }
    }
  }

  &__playlist-songs {
    background: var(--el-bg-color-overlay);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid var(--el-border-color-lighter);
    padding: 24px;
  }

  &__playlist-songs-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 20px;
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

  &__playlist-songs-count {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    font-weight: normal;
  }

  &__music-list {
    border-top: 1px solid var(--el-border-color-lighter);
    margin-top: 16px;
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
      
      .playlist-detail-view__music-play-small {
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
}
</style>
