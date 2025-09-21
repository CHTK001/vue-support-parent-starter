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
          <el-button type="primary" @click="playPlaylist(env.currentPlaylistDetail.songs)">
            <IconifyIconOnline icon="ri:play-fill" />
            播放全部
          </el-button>
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
            <el-button circle size="small" :type="isFavorite(music) ? 'danger' : 'default'" @click="toggleFavorite(music)">
              <IconifyIconOnline :icon="isFavorite(music) ? 'ri:heart-fill' : 'ri:heart-line'" />
            </el-button>
            <el-button
              circle
              size="small"
              @click="
                env.currentPlaylist = [music];
                playMusic(music);
              "
            >
              <IconifyIconOnline icon="ri:play-list-add-line" />
            </el-button>
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
    margin-bottom: 30px;
    background-color: var(--app-bg-primary);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: var(--app-shadow-sm);
    padding: 20px;
  }

  &__playlist-cover-large {
    width: 200px;
    height: 200px;
    border-radius: 8px;
    overflow: hidden;
    margin-right: 20px;
    box-shadow: var(--app-shadow-sm);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__playlist-info-large {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__playlist-title-large {
    font-size: 24px;
    font-weight: 500;
    margin-bottom: 10px;
  }

  &__playlist-creator,
  &__playlist-date {
    font-size: 14px;
    color: var(--app-text-secondary);
    margin-bottom: 5px;
  }

  &__playlist-desc {
    font-size: 14px;
    margin: 15px 0;
    color: var(--app-text-primary);
    line-height: 1.6;
    flex: 1;
  }

  &__playlist-actions {
    margin-top: auto;
  }

  &__playlist-songs {
    background-color: var(--app-bg-primary);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: var(--app-shadow-sm);
    padding: 20px;
  }

  &__playlist-songs-title {
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 15px;
  }

  &__playlist-songs-count {
    font-size: 14px;
    color: var(--app-text-secondary);
    font-weight: normal;
  }

  &__music-list {
    border-top: 1px solid var(--app-border-secondary);
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

    &:hover .playlist-detail-view__music-play-small {
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
