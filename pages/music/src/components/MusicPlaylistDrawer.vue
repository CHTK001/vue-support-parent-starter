<template>
  <ScOverlayPage
    :model-value="visible"
    title="歌单详情"
    :subtitle="playlist ? `${playlist.author} · ${playlist.trackCount} 首` : ''"
    eyebrow="Playlist"
    theme="music"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-if="playlist" class="playlist-drawer">
      <div class="playlist-head">
        <img :src="playlist.coverUrl" :alt="playlist.title" />
        <div class="playlist-copy">
          <p class="playlist-kicker">Playlist</p>
          <h3>{{ playlist.title }}</h3>
          <span>
            {{ playlist.author }} · {{ playlist.trackCount }} 首
            <template v-if="playlist.playCount">
              · {{ formatCount(playlist.playCount) }} 播放
            </template>
          </span>
          <small>{{ playlist.description }}</small>
          <div class="playlist-actions">
            <button class="playlist-btn playlist-btn--accent" type="button" @click="emit('play-all', playlist.tracks)">
              播放全部
            </button>
          </div>
        </div>
      </div>

      <MusicTrackTable
        kicker="歌曲列表"
        title="歌单歌曲"
        :tracks="playlist.tracks"
        :current-track-key="currentTrackKey"
        :favorite-keys="favoriteKeys"
        empty-text="歌单暂无歌曲。"
        show-play-all
        @play-track="handlePlayTrack"
        @play-all="handlePlayAll"
        @download-track="handleDownloadTrack"
        @toggle-favorite="handleToggleFavorite"
      />
    </div>
  </ScOverlayPage>
</template>

<script setup lang="ts">
import ScOverlayPage from "@repo/components/ScOverlayPage";
import MusicTrackTable from "./MusicTrackTable.vue";
import type { MusicPlaylistDetail, MusicTrackSummary } from "../types";

defineProps<{
  visible: boolean;
  playlist: MusicPlaylistDetail | null;
  currentTrackKey: string;
  favoriteKeys: string[];
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "play-track", track: MusicTrackSummary, queue: MusicTrackSummary[]): void;
  (e: "toggle-favorite", track: MusicTrackSummary): void;
  (e: "play-all", queue: MusicTrackSummary[]): void;
  (e: "download-track", track: MusicTrackSummary): void;
}>();

function handlePlayTrack(track: MusicTrackSummary, queue: MusicTrackSummary[]) {
  emit("play-track", track, queue);
}

function handleToggleFavorite(track: MusicTrackSummary) {
  emit("toggle-favorite", track);
}

function handlePlayAll(queue: MusicTrackSummary[]) {
  emit("play-all", queue);
}

function handleDownloadTrack(track: MusicTrackSummary) {
  emit("download-track", track);
}

function formatCount(value?: number) {
  if (!value) return "0";
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}亿`;
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return `${value}`;
}
</script>

<style scoped lang="scss">
.playlist-drawer {
  --music-stroke: rgba(255, 255, 255, 0.08);
  --music-shadow: 0 30px 80px rgba(24, 8, 7, 0.34);
  --music-text: #fff7ee;
  --music-muted: rgba(246, 225, 212, 0.72);
  --music-subtle: rgba(236, 203, 182, 0.56);
  --music-accent: #f1bb67;
  --music-accent-2: #ffd997;
  display: grid;
  gap: 28px;
  padding-bottom: 140px;
}

.playlist-head {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 28px;
  align-items: end;
  padding: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.04)),
    rgba(22, 10, 10, 0.42);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.18);
}

.playlist-head img {
  width: 220px;
  height: 220px;
  border-radius: 28px;
  object-fit: cover;
  box-shadow: 0 24px 60px rgba(8, 2, 2, 0.42);
}

.playlist-kicker {
  margin: 0 0 8px;
  color: rgba(255, 205, 160, 0.72);
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.playlist-copy h3 {
  margin: 0;
  color: #fff7ed;
  font-size: 42px;
  line-height: 1.05;
}

.playlist-copy span,
.playlist-copy small {
  display: block;
  color: rgba(255, 234, 214, 0.74);
  line-height: 1.7;
}

.playlist-copy span {
  margin-top: 14px;
  font-size: 15px;
}

.playlist-copy small {
  margin-top: 14px;
  font-size: 14px;
  max-width: 720px;
}

.playlist-actions {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}

.playlist-btn {
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff8ef;
  cursor: pointer;
  padding: 10px 18px;
}

.playlist-btn--accent {
  background: rgba(241, 187, 103, 0.18);
  color: var(--music-accent);
}

@media (max-width: 720px) {
  .playlist-head {
    grid-template-columns: 1fr;
    padding: 18px;
    gap: 18px;
  }

  .playlist-head img {
    width: 180px;
    height: 180px;
  }

  .playlist-copy h3 {
    font-size: 28px;
  }
}
</style>
