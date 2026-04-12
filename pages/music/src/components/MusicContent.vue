<template>
  <main v-loading="loading" class="content-panel">
    <MusicHeaderBar
      :title="pageTitle"
      :description="pageDescription"
      :active-source-label="activeSourceLabel"
      :search-keyword="searchKeyword"
      :loading="isSearchLoading"
      @update:search-keyword="emit('update:searchKeyword', $event)"
      @search="emit('search')"
    />

    <section
      v-if="activeSection === 'discover' || activeSection === 'moon'"
      class="keyword-card"
    >
      <div class="keyword-head">
        <div>
          <p class="keyword-kicker">
            {{ activeSection === "moon" ? "Moon Hall" : "热点" }}
          </p>
          <h3>{{ activeSection === "moon" ? "月馆精选" : "热搜直达" }}</h3>
        </div>
        <span>
          {{
            activeSection === "moon"
              ? "夜色歌单和情绪搜索都收在这里"
              : "点击即可检索全来源歌曲"
          }}
        </span>
      </div>

      <div class="keyword-wall">
        <button
          v-for="tag in visibleKeywords"
          :key="tag"
          class="keyword-pill"
          @click="emit('search-tag', tag)"
        >
          {{ tag }}
        </button>
      </div>
    </section>

    <MusicPlaylistGrid
      v-if="activeSection === 'discover'"
      kicker="热门"
      :title="activeCategoryName || '热门歌单'"
      :playlists="hotPlaylists"
      compact
      empty-text="当前没有热门歌单。"
      @open-playlist="emit('open-playlist', $event)"
    />

    <MusicPlaylistGrid
      v-if="activeSection === 'discover'"
      kicker="官方歌单"
      title="官方歌单"
      :playlists="officialPlaylists"
      compact
      empty-text="当前没有官方歌单。"
      @open-playlist="emit('open-playlist', $event)"
    />

    <MusicPlaylistGrid
      v-if="activeSection === 'discover'"
      kicker="最新发行"
      title="最新发行"
      :playlists="latestPlaylists"
      compact
      empty-text="当前没有最新发行。"
      @open-playlist="emit('open-playlist', $event)"
    />

    <MusicPlaylistGrid
      v-if="activeSection === 'moon'"
      kicker="月馆"
      title="月下精选"
      :playlists="moonPlaylists"
      compact
      empty-text="当前没有月馆推荐。"
      @open-playlist="emit('open-playlist', $event)"
    />

    <MusicPlaylistGrid
      v-if="activeSection === 'moon'"
      kicker="夜色新声"
      title="深夜最新发行"
      :playlists="moonLatestPlaylists"
      compact
      empty-text="当前没有月馆新发行。"
      @open-playlist="emit('open-playlist', $event)"
    />

    <MusicPlaylistGrid
      v-if="activeSection === 'search' && playlistResults.length"
      kicker="歌单结果"
      title="搜索到的歌单"
      :playlists="playlistResults"
      empty-text="暂无相关歌单。"
      @open-playlist="emit('open-playlist', $event)"
    />

    <MusicTrackTable
      v-if="activeSection === 'search'"
      kicker="搜索结果"
      :title="searchKeyword.trim() ? `“${searchKeyword.trim()}”` : '搜索结果'"
      :tracks="searchResults"
      :current-track-key="currentTrackKey"
      :favorite-keys="favoriteKeys"
      empty-text="没有搜索到歌曲。"
      @play-track="handlePlayTrack"
      @download-track="handleDownloadTrack"
      @toggle-favorite="handleToggleFavorite"
    />

    <MusicTrackTable
      v-else-if="activeSection === 'favorites'"
      kicker="我的喜欢"
      title="喜欢的歌曲"
      :tracks="favorites"
      :current-track-key="currentTrackKey"
      :favorite-keys="favoriteKeys"
      empty-text="还没有收藏歌曲。"
      @play-track="handlePlayTrack"
      @download-track="handleDownloadTrack"
      @toggle-favorite="handleToggleFavorite"
    />

    <MusicTrackTable
      v-else-if="activeSection === 'history'"
      kicker="最近播放"
      title="播放历史"
      :tracks="history"
      :current-track-key="currentTrackKey"
      :favorite-keys="favoriteKeys"
      empty-text="还没有播放历史。"
      @play-track="handlePlayTrack"
      @download-track="handleDownloadTrack"
      @toggle-favorite="handleToggleFavorite"
    />
  </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import MusicHeaderBar from "./MusicHeaderBar.vue";
import MusicPlaylistGrid from "./MusicPlaylistGrid.vue";
import MusicTrackTable from "./MusicTrackTable.vue";
import type {
  MusicPlaylistCategoryCatalog,
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
  playlistCategories: MusicPlaylistCategoryCatalog | null;
  activeCategoryId: string;
  activeCategoryName: string;
  categoryPlaylists: MusicPlaylistSummary[];
  categoryTotal: number;
  isCategoryLoading: boolean;
  favorites: MusicTrackSummary[];
  history: MusicTrackSummary[];
  hotKeywords: string[];
}>();

const emit = defineEmits<{
  (e: "update:searchKeyword", value: string): void;
  (e: "search"): void;
  (e: "search-tag", tag: string): void;
  (e: "back-playlist"): void;
  (e: "open-playlist", playlist: MusicPlaylistSummary): void;
  (e: "play-track", track: MusicTrackSummary, queue: MusicTrackSummary[]): void;
  (e: "toggle-favorite", track: MusicTrackSummary): void;
  (e: "download-track", track: MusicTrackSummary): void;
}>();

const discoverPlaylists = computed(() => {
  return props.categoryPlaylists.length
    ? props.categoryPlaylists
    : props.featuredPlaylists;
});

const mergedPlaylists = computed(() => {
  const bucket = new Map<string, MusicPlaylistSummary>();
  [
    ...props.featuredPlaylists,
    ...props.categoryPlaylists,
    ...props.playlistResults,
  ].forEach((item) => {
    bucket.set(`${item.source}:${item.playlistId}`, item);
  });
  return Array.from(bucket.values());
});

const hotPlaylists = computed(() => {
  return discoverPlaylists.value.slice(0, 6);
});

const officialPlaylists = computed(() => {
  if (props.featuredPlaylists.length) {
    return props.featuredPlaylists.slice(0, 6);
  }
  return discoverPlaylists.value.slice(0, 6);
});

const latestPlaylists = computed(() => {
  return [...mergedPlaylists.value].reverse().slice(0, 6);
});

const moonPlaylists = computed(() => {
  const source = discoverPlaylists.value.length
    ? discoverPlaylists.value
    : mergedPlaylists.value;
  return [
    ...source.filter((_, index) => index % 2 === 0),
    ...source.filter((_, index) => index % 2 === 1),
  ].slice(0, 6);
});

const moonLatestPlaylists = computed(() => {
  return [...latestPlaylists.value].reverse().slice(0, 6);
});

const favoriteKeys = computed(() => {
  return props.favorites.map((track) => `${track.source}:${track.trackId}`);
});

const visibleKeywords = computed(() => {
  if (props.activeSection === "moon") {
    return props.hotKeywords.slice().reverse().slice(0, 6);
  }
  return props.hotKeywords.slice(0, 8);
});

const pageTitle = computed(() => {
  if (props.activeSection === "favorites") return "我的喜欢";
  if (props.activeSection === "history") return "最近播放";
  if (props.activeSection === "search") return "搜索结果";
  if (props.activeSection === "moon") return "月馆";
  return "音乐首页";
});

const pageDescription = computed(() => {
  if (props.activeSection === "favorites")
    return "把喜欢的歌曲固定到你的专属列表。";
  if (props.activeSection === "history")
    return "播放过的歌曲会自动进入最近播放。";
  if (props.activeSection === "search")
    return "搜索直接访问后台聚合接口，支持跨音源检索。";
  if (props.activeSection === "moon")
    return "把夜色氛围、月下精选和深夜新声放进一个更安静的入口。";
  return "热点、热门歌单、搜索和播放器都收在同一页，交互更接近 QQ 音乐桌面首页。";
});

function handlePlayTrack(track: MusicTrackSummary, queue: MusicTrackSummary[]) {
  emit("play-track", track, queue);
}

function handleToggleFavorite(track: MusicTrackSummary) {
  emit("toggle-favorite", track);
}

function handleDownloadTrack(track: MusicTrackSummary) {
  emit("download-track", track);
}
</script>

<style scoped lang="scss">
.content-panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
}

.keyword-card {
  border: 1px solid var(--music-stroke);
  border-radius: 28px;
  background: rgba(69, 31, 28, 0.72);
  box-shadow: var(--music-shadow);
  padding: 16px 18px;
  backdrop-filter: blur(18px);
}

.keyword-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.keyword-kicker {
  margin: 0 0 8px;
  color: var(--music-subtle);
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.keyword-head h3 {
  margin: 0;
  font-size: 22px;
}

.keyword-head span {
  color: var(--music-muted);
}

.keyword-wall {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.keyword-pill {
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--music-text);
  cursor: pointer;
  padding: 10px 16px;
}

.keyword-pill:hover {
  background: rgba(241, 187, 103, 0.16);
}

@media (max-width: 860px) {
  .keyword-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
