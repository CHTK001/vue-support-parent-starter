<template>
  <main v-loading="loading" class="content-panel">
    <header class="hero-card">
      <div>
        <p class="hero-kicker">{{ activeSourceLabel }}</p>
        <h2>{{ heroTitle }}</h2>
        <p>{{ heroDescription }}</p>
      </div>
      <div class="search-strip">
        <el-input
          :model-value="searchKeyword"
          placeholder="搜索歌曲、歌手、专辑"
          size="large"
          clearable
          @update:model-value="emit('update:searchKeyword', $event)"
          @keyup.enter="emit('search')"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button :loading="isSearchLoading" type="primary" size="large" @click="emit('search')">
          搜索
        </el-button>
      </div>
    </header>

    <section v-if="selectedPlaylist" class="playlist-stage">
      <div class="playlist-hero">
        <img :src="selectedPlaylist.coverUrl" :alt="selectedPlaylist.title" />
        <div>
          <p class="playlist-label">Playlist Detail</p>
          <h3>{{ selectedPlaylist.title }}</h3>
          <p class="playlist-desc">{{ selectedPlaylist.description }}</p>
          <div class="playlist-meta">
            <span>{{ selectedPlaylist.author }}</span>
            <span>{{ selectedPlaylist.trackCount }} 首</span>
          </div>
        </div>
        <el-button class="back-btn" plain @click="emit('back-playlist')"> 返回 </el-button>
      </div>

      <div class="track-grid detail-grid">
        <button
          v-for="track in selectedPlaylist.tracks"
          :key="`${track.source}:${track.trackId}`"
          class="track-card"
          :class="{ active: currentTrackKey === `${track.source}:${track.trackId}` }"
          @click="emit('play-track', track, selectedPlaylist.tracks)"
        >
          <img :src="track.coverUrl" :alt="track.title" />
          <div class="track-copy">
            <strong>{{ track.title }}</strong>
            <span>{{ track.artist }}</span>
            <small>{{ track.album }}</small>
          </div>
          <span class="track-time">{{ formatDuration(track.durationSeconds) }}</span>
        </button>
      </div>
    </section>

    <section v-else-if="activeSection === 'search'" class="content-stage">
      <div class="stage-head">
        <h3>搜索结果</h3>
        <p>{{ resultCount }} / {{ resultTotal }} 条</p>
      </div>
      <div class="search-tab-row">
        <el-segmented
          :model-value="searchTab"
          :options="searchTabOptions"
          @change="emit('change-search-tab', $event as MusicSearchTab)"
        />
      </div>
      <div v-if="searchTab === 'tracks' && searchResults.length" class="track-grid">
        <button
          v-for="track in searchResults"
          :key="`${track.source}:${track.trackId}`"
          class="track-card"
          :class="{ active: currentTrackKey === `${track.source}:${track.trackId}` }"
          @click="emit('play-track', track, searchResults)"
        >
          <img :src="track.coverUrl" :alt="track.title" />
          <div class="track-copy">
            <strong>{{ track.title }}</strong>
            <span>{{ track.artist }}</span>
            <small>{{ track.album }}</small>
          </div>
          <span class="track-time">{{ formatDuration(track.durationSeconds) }}</span>
        </button>
      </div>
      <div v-else-if="searchTab === 'playlists' && playlistResults.length" class="playlist-grid">
        <article
          v-for="playlist in playlistResults"
          :key="`${playlist.source}:${playlist.playlistId}`"
          class="playlist-card"
        >
          <button class="playlist-button" @click="emit('open-playlist', playlist)">
            <img :src="playlist.coverUrl" :alt="playlist.title" />
            <div class="playlist-copy">
              <p>{{ playlist.author }}</p>
              <h3>{{ playlist.title }}</h3>
              <span>{{ playlist.description }}</span>
            </div>
          </button>
        </article>
      </div>
      <div v-else class="empty-state">
        <p>还没有搜索结果，输入关键词开始。</p>
      </div>
      <div v-if="resultTotal > currentPageSize" class="pagination-row">
        <el-pagination
          background
          layout="prev, pager, next"
          :current-page="currentPage"
          :page-size="currentPageSize"
          :total="resultTotal"
          @current-change="emit('change-search-page', $event)"
        />
      </div>
    </section>

    <section v-else-if="activeSection === 'favorites'" class="content-stage">
      <div class="stage-head">
        <h3>收藏</h3>
        <p>{{ favorites.length }} 首</p>
      </div>
      <div v-if="favorites.length" class="track-grid">
        <button
          v-for="track in favorites"
          :key="`${track.source}:${track.trackId}`"
          class="track-card"
          :class="{ active: currentTrackKey === `${track.source}:${track.trackId}` }"
          @click="emit('play-track', track, favorites)"
        >
          <img :src="track.coverUrl" :alt="track.title" />
          <div class="track-copy">
            <strong>{{ track.title }}</strong>
            <span>{{ track.artist }}</span>
            <small>{{ track.album }}</small>
          </div>
          <span class="track-time">{{ formatDuration(track.durationSeconds) }}</span>
        </button>
      </div>
      <div v-else class="empty-state">
        <p>当前没有收藏。播放歌曲后可加入收藏。</p>
      </div>
    </section>

    <section v-else-if="activeSection === 'history'" class="content-stage">
      <div class="stage-head">
        <h3>最近播放</h3>
        <p>{{ history.length }} 条</p>
      </div>
      <div v-if="history.length" class="track-grid">
        <button
          v-for="track in history"
          :key="`${track.source}:${track.trackId}`"
          class="track-card"
          :class="{ active: currentTrackKey === `${track.source}:${track.trackId}` }"
          @click="emit('play-track', track, history)"
        >
          <img :src="track.coverUrl" :alt="track.title" />
          <div class="track-copy">
            <strong>{{ track.title }}</strong>
            <span>{{ track.artist }}</span>
            <small>{{ track.album }}</small>
          </div>
          <span class="track-time">{{ formatDuration(track.durationSeconds) }}</span>
        </button>
      </div>
      <div v-else class="empty-state">
        <p>播放历史会保存在浏览器本地。</p>
      </div>
    </section>

    <section v-else class="content-stage">
      <div class="stage-head">
        <h3>精选歌单</h3>
        <p>{{ featuredPlaylists.length }} 个入口</p>
      </div>
      <div class="playlist-grid">
        <article
          v-for="playlist in featuredPlaylists"
          :key="playlist.playlistId"
          class="playlist-card"
        >
          <button class="playlist-button" @click="emit('open-playlist', playlist)">
            <img :src="playlist.coverUrl" :alt="playlist.title" />
            <div class="playlist-copy">
              <p>{{ playlist.author }}</p>
              <h3>{{ playlist.title }}</h3>
              <span>{{ playlist.description }}</span>
            </div>
          </button>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import { computed } from "vue";
import type {
  MusicPlaylistDetail,
  MusicPlaylistSummary,
  MusicSearchTab,
  MusicSection,
  MusicTrackSummary,
} from "../types";

const props = defineProps<{
  loading: boolean;
  selectedPlaylist: MusicPlaylistDetail | null;
  currentTrackKey: string;
  activeSection: MusicSection;
  activeSourceLabel: string;
  heroTitle: string;
  heroDescription: string;
  searchKeyword: string;
  searchTab: MusicSearchTab;
  searchResults: MusicTrackSummary[];
  playlistResults: MusicPlaylistSummary[];
  searchTotal: number;
  playlistTotal: number;
  searchPage: number;
  playlistPage: number;
  searchPageSize: number;
  playlistPageSize: number;
  isSearchLoading: boolean;
  featuredPlaylists: MusicPlaylistSummary[];
  favorites: MusicTrackSummary[];
  history: MusicTrackSummary[];
}>();

const emit = defineEmits<{
  (e: "update:searchKeyword", value: string): void;
  (e: "search"): void;
  (e: "back-playlist"): void;
  (e: "open-playlist", playlist: MusicPlaylistSummary): void;
  (e: "play-track", track: MusicTrackSummary, queue: MusicTrackSummary[]): void;
  (e: "change-search-tab", tab: MusicSearchTab): void;
  (e: "change-search-page", page: number): void;
}>();

const searchTabOptions = [
  { label: "歌曲", value: "tracks" },
  { label: "歌单", value: "playlists" },
] as const;

const resultCount = computed(() => {
  return props.searchTab === "tracks" ? props.searchResults.length : props.playlistResults.length;
});

const resultTotal = computed(() => {
  return props.searchTab === "tracks" ? props.searchTotal : props.playlistTotal;
});

const currentPage = computed(() => {
  return props.searchTab === "tracks" ? props.searchPage : props.playlistPage;
});

const currentPageSize = computed(() => {
  return props.searchTab === "tracks" ? props.searchPageSize : props.playlistPageSize;
});

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}
</script>

<style scoped lang="scss">
.content-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-card,
.content-stage,
.playlist-stage {
  border: 1px solid rgba(20, 32, 42, 0.12);
  border-radius: 28px;
  background: rgba(255, 252, 245, 0.88);
  box-shadow: 0 18px 40px rgba(17, 25, 32, 0.08);
  backdrop-filter: blur(16px);
}

.hero-card {
  padding: 24px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
}

.hero-kicker,
.playlist-label {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.72;
}

.hero-card h2,
.playlist-hero h3 {
  margin: 0;
  line-height: 1.05;
}

.hero-card h2 {
  font-size: 36px;
}

.hero-card p,
.playlist-desc,
.playlist-meta,
.stage-head p,
.track-copy span,
.track-copy small,
.track-time,
.empty-state,
.playlist-copy p,
.playlist-copy span {
  color: #5f6a70;
}

.search-strip {
  display: flex;
  align-items: center;
  gap: 12px;
}

.content-stage,
.playlist-stage {
  min-height: 0;
  overflow: auto;
  padding: 18px;
}

.stage-head,
.playlist-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.search-tab-row {
  display: flex;
  justify-content: flex-start;
  margin-top: 18px;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.playlist-card {
  overflow: hidden;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
}

.playlist-button,
.track-card {
  border: 0;
  cursor: pointer;
  transition: all 0.18s ease;
}

.playlist-button {
  width: 100%;
  padding: 0;
  background: transparent;
  text-align: left;
}

.playlist-button img,
.track-card img,
.playlist-hero img {
  width: 100%;
  object-fit: cover;
}

.playlist-button img {
  aspect-ratio: 1 / 1;
}

.playlist-copy {
  padding: 16px;
}

.playlist-copy h3 {
  margin: 8px 0;
  font-size: 22px;
}

.playlist-hero {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 18px;
  border-bottom: 1px solid rgba(20, 32, 42, 0.12);
}

.playlist-hero img {
  aspect-ratio: 1 / 1;
  border-radius: 22px;
}

.track-grid {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.detail-grid {
  margin-top: 0;
  padding-top: 16px;
}

.track-card {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 12px;
  border-radius: 20px;
  text-align: left;
  background: rgba(255, 255, 255, 0.7);
}

.track-card.active {
  background: linear-gradient(135deg, rgba(188, 127, 79, 0.16), rgba(47, 93, 115, 0.15));
  box-shadow: inset 0 0 0 1px rgba(47, 93, 115, 0.22);
}

.track-card img {
  height: 72px;
  border-radius: 18px;
}

.track-copy strong,
.track-copy span,
.track-copy small {
  display: block;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 960px) {
  .hero-card,
  .playlist-hero {
    grid-template-columns: 1fr;
  }
}
</style>
