<template>
  <section class="section-card">
    <div class="section-head">
      <div>
        <p class="section-kicker">{{ kicker }}</p>
        <h3>{{ title }}</h3>
      </div>
      <div class="section-actions">
        <span>{{ tracks.length }} 首</span>
        <button
          v-if="showPlayAll && tracks.length"
          class="head-btn head-btn--accent"
          type="button"
          @click="emit('play-all', tracks)"
        >
          播放全部
        </button>
      </div>
    </div>

    <div v-if="tracks.length" class="table-shell">
      <div class="table-head">
        <span>歌曲</span>
        <span>专辑</span>
        <span>时长</span>
        <span>操作</span>
      </div>

      <div
        v-for="track in tracks"
        :key="`${track.source}:${track.trackId}`"
        class="track-row"
        :class="{ active: currentTrackKey === `${track.source}:${track.trackId}` }"
        tabindex="0"
        :aria-label="`播放 ${track.title}`"
        @click="emit('play-track', track, tracks)"
        @keyup.enter="emit('play-track', track, tracks)"
      >
        <div class="track-main">
          <img :src="track.coverUrl" :alt="track.title" />
          <div class="track-copy">
            <strong>{{ track.title }}</strong>
            <span>{{ track.artist }}</span>
            <small v-if="track.playCount || track.commentCount" class="track-meta">
              <em v-if="track.playCount">{{ formatCount(track.playCount) }} 播放</em>
              <em v-if="track.commentCount">{{ formatCount(track.commentCount) }} 评论</em>
            </small>
          </div>
        </div>
        <small>{{ track.album }}</small>
        <span class="track-time">{{ formatDuration(track.durationSeconds) }}</span>
        <div class="row-actions">
          <button class="row-btn" :aria-label="`播放 ${track.title}`" @click.stop="emit('play-track', track, tracks)">
            播放
          </button>
          <button
            v-if="allowDownload"
            class="row-btn"
            :aria-label="`下载 ${track.title}`"
            @click.stop="emit('download-track', track)"
          >
            下载
          </button>
          <button
            class="favorite-btn"
            :class="{ active: favoriteKeys.includes(`${track.source}:${track.trackId}`) }"
            :aria-label="`收藏 ${track.title}`"
            @click.stop="emit('toggle-favorite', track)"
          >
            <el-icon><Star /></el-icon>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">{{ emptyText }}</div>
  </section>
</template>

<script setup lang="ts">
import { Star } from "@element-plus/icons-vue";
import { ElIcon } from "element-plus";
import type { MusicTrackSummary } from "../types";

defineProps<{
  title: string;
  kicker: string;
  tracks: MusicTrackSummary[];
  currentTrackKey: string;
  favoriteKeys: string[];
  emptyText: string;
  showPlayAll?: boolean;
  allowDownload?: boolean;
}>();

const emit = defineEmits<{
  (e: "play-track", track: MusicTrackSummary, queue: MusicTrackSummary[]): void;
  (e: "toggle-favorite", track: MusicTrackSummary): void;
  (e: "play-all", queue: MusicTrackSummary[]): void;
  (e: "download-track", track: MusicTrackSummary): void;
}>();

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
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

.section-head span,
.table-head,
.track-copy span,
.track-meta,
.track-row small,
.track-time,
.empty-state {
  color: var(--music-muted);
}

.table-shell {
  margin-top: 18px;
}

.table-head,
.track-row {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.8fr) 80px 64px;
  gap: 14px;
  align-items: center;
}

.table-head {
  padding: 0 16px 12px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.track-row {
  width: 100%;
  border: 0;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--music-text);
  cursor: pointer;
  margin-bottom: 10px;
  padding: 12px 16px;
  text-align: left;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.track-row:hover,
.track-row.active {
  transform: translateY(-1px);
  background: linear-gradient(135deg, rgba(241, 187, 103, 0.18), rgba(82, 36, 33, 0.96));
  box-shadow: inset 0 0 0 1px rgba(241, 187, 103, 0.22);
}

.track-main {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.track-main img {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  object-fit: cover;
}

.track-copy {
  min-width: 0;
}

.track-copy strong,
.track-copy span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-meta {
  display: inline-flex;
  gap: 10px;
  margin-top: 6px;
  font-size: 11px;
}

.track-meta em {
  font-style: normal;
}

.favorite-btn {
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  color: var(--music-text);
  cursor: pointer;
}

.row-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.row-btn,
.head-btn {
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--music-text);
  cursor: pointer;
  padding: 8px 14px;
}

.head-btn--accent {
  background: rgba(241, 187, 103, 0.18);
  color: var(--music-accent);
}

.favorite-btn.active {
  background: rgba(241, 187, 103, 0.18);
  color: var(--music-accent);
}

@media (max-width: 860px) {
  .table-head {
    display: none;
  }

  .track-row {
    grid-template-columns: 1fr auto;
  }

  .track-row small,
  .track-time {
    display: none;
  }

  .row-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
