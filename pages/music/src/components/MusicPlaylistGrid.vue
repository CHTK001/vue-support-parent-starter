<template>
  <section class="section-card" :class="{ 'section-card--compact': compact }">
    <div class="section-head">
      <div>
        <p class="section-kicker">{{ kicker }}</p>
        <h3>{{ title }}</h3>
      </div>
      <div class="section-actions">
        <span>{{ playlists.length }} 个入口</span>
        <div v-if="playlists.length > 4" class="switcher">
          <button class="switcher-btn" type="button" aria-label="上一组" @click="scrollBy(-1)">‹</button>
          <button class="switcher-btn" type="button" aria-label="下一组" @click="scrollBy(1)">›</button>
        </div>
      </div>
    </div>

    <div
      v-if="playlists.length"
      ref="scrollerRef"
      class="playlist-grid"
      :class="{ 'playlist-grid--compact': compact }"
    >
      <button
        v-for="playlist in playlists"
        :key="`${playlist.source}:${playlist.playlistId}`"
        class="playlist-card"
        :class="{ 'playlist-card--compact': compact }"
        @click="emit('open-playlist', playlist)"
      >
        <span v-if="playlist.playCount" class="playlist-stat">
          {{ formatCount(playlist.playCount) }} 播放
        </span>
        <img :src="playlist.coverUrl" :alt="playlist.title" />
        <div class="playlist-copy">
          <strong>{{ playlist.title }}</strong>
          <span>{{ playlist.author }}</span>
          <small>{{ playlist.trackCount }} 首</small>
        </div>
      </button>
    </div>

    <div v-else class="empty-state">{{ emptyText }}</div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { MusicPlaylistSummary } from "../types";

defineProps<{
  title: string;
  kicker: string;
  playlists: MusicPlaylistSummary[];
  emptyText: string;
  compact?: boolean;
}>();

const emit = defineEmits<{
  (e: "open-playlist", playlist: MusicPlaylistSummary): void;
}>();

const scrollerRef = ref<HTMLElement>();

function scrollBy(direction: number) {
  scrollerRef.value?.scrollBy({
    left: direction * (scrollerRef.value.clientWidth * 0.78),
    behavior: "smooth"
  });
}

function formatCount(value?: number) {
  if (!value) return "0";
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}亿`;
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return `${value}`;
}
</script>

<style scoped lang="scss">
.section-card {
  border: 1px solid var(--music-stroke);
  border-radius: 28px;
  background: rgba(69, 31, 28, 0.72);
  box-shadow: var(--music-shadow);
  padding: 20px;
  backdrop-filter: blur(18px);
}

.section-card--compact {
  padding: 16px 18px 18px;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.section-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.section-kicker {
  margin: 0 0 8px;
  color: var(--music-subtle);
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.section-head h3 {
  margin: 0;
  font-size: 28px;
}

.section-card--compact .section-head h3 {
  font-size: 22px;
}

.section-head span {
  color: var(--music-muted);
}

.playlist-grid {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  gap: 14px;
  margin-top: 18px;
}

.playlist-grid::-webkit-scrollbar {
  display: none;
}

.playlist-grid--compact {
  gap: 12px;
}

.playlist-card {
  position: relative;
  flex: 0 0 188px;
  overflow: hidden;
  border: 0;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--music-text);
  cursor: pointer;
  padding: 0;
  text-align: left;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.playlist-card--compact {
  flex-basis: 152px;
}

.playlist-stat {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  border-radius: 999px;
  background: rgba(12, 8, 8, 0.68);
  color: #fff6ea;
  padding: 6px 10px;
  font-size: 11px;
}

.playlist-card:hover {
  transform: translateY(-2px);
  box-shadow: inset 0 0 0 1px rgba(241, 187, 103, 0.26);
}

.playlist-card img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.playlist-card--compact img {
  aspect-ratio: 1 / 0.96;
}

.playlist-copy {
  padding: 14px;
}

.playlist-card--compact .playlist-copy {
  padding: 12px;
}

.playlist-copy strong,
.playlist-copy span,
.playlist-copy small {
  display: block;
}

.playlist-copy span,
.playlist-copy small,
.empty-state {
  color: var(--music-muted);
}

.playlist-copy span {
  margin-top: 6px;
}

.playlist-copy small {
  margin-top: 8px;
}

.playlist-card--compact .playlist-copy strong {
  font-size: 14px;
}

.playlist-card--compact .playlist-copy span,
.playlist-card--compact .playlist-copy small {
  font-size: 12px;
}

.empty-state {
  margin-top: 16px;
}

.switcher {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.switcher-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: var(--music-text);
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
}
</style>
