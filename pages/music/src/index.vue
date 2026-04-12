<template>
  <div
    class="music-shell system-container"
    :class="{ 'is-dock-minimized': dockMinimized }"
  >
    <audio
      ref="audioRef"
      :src="currentTrack?.streamUrl"
      preload="auto"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoadedMetadata"
      @ended="playNext"
      @error="handleAudioError"
      @play="isPlaying = true"
      @pause="isPlaying = false"
    />

    <div class="music-layout">
      <MusicSidebar
        :active-section="activeSection"
        :favorites-count="favorites.length"
        :history-count="history.length"
        :featured-playlists="featuredPlaylists"
        :current-track="currentTrack"
        @change-section="changeSection"
        @open-playlist="openPlaylist"
      />

      <MusicContent
        v-model:search-keyword="searchKeyword"
        :loading="isOverviewLoading || isPlaylistLoading || isSearchLoading || isCategoryLoading"
        :selected-playlist="selectedPlaylist"
        :current-track-key="currentTrackKey"
        :active-section="activeSection"
        :active-source-label="activeSourceLabel"
        :hero-title="heroTitle"
        :hero-description="heroDescription"
        :search-tab="searchTab"
        :search-results="searchResults"
        :playlist-results="playlistResults"
        :search-total="searchTotal"
        :playlist-total="playlistTotal"
        :search-page="searchPage"
        :playlist-page="playlistPage"
        :search-page-size="searchPageSize"
        :playlist-page-size="playlistPageSize"
        :is-search-loading="isSearchLoading"
        :featured-playlists="featuredPlaylists"
        :playlist-categories="playlistCategories"
        :active-category-id="activeCategoryId"
        :active-category-name="activeCategoryName"
        :category-playlists="categoryPlaylists"
        :category-total="categoryTotal"
        :is-category-loading="isCategoryLoading"
        :favorites="favorites"
        :history="history"
        :hot-keywords="hotKeywords"
        @search="performSearch()"
        @search-tag="searchByTag"
        @back-playlist="handleBackPlaylist"
        @open-playlist="openPlaylist"
        @play-track="playTrackFromSummary"
        @download-track="downloadTrack"
        @toggle-favorite="toggleFavorite"
      />
    </div>

    <div class="music-dock" :class="{ 'is-minimized': dockMinimized }">
      <MusicPlayerPanel
        :loading="isTrackLoading"
        :is-playing="isPlaying"
        :current-track="currentTrack"
        :current-track-key="currentTrackKey"
        :favorite-active="isFavorite(currentTrack)"
        :queue="queue"
        :parsed-lyrics="parsedLyrics"
        :active-lyric-index="activeLyricIndex"
        :current-time="currentTime"
        :duration="duration"
        :slider-value="sliderValue"
        :volume="volume"
        :loop-mode="loopMode"
        :minimized="dockMinimized"
        @prev="playPrev"
        @toggle="togglePlayback"
        @next="playNext"
        @toggle-loop="toggleLoopMode"
        @toggle-favorite="toggleFavorite(currentTrack)"
        @preview-seek="previewSeek"
        @seek="seekTo"
        @update-volume="handleVolumeChange"
        @play-track="playTrackFromSummary"
        @open-detail="detailOpen = true"
        @open-lyrics="detailOpen = true"
        @toggle-minimize="dockMinimized = !dockMinimized"
      />
    </div>

    <MusicPlaylistDrawer
      :visible="Boolean(selectedPlaylist)"
      :playlist="selectedPlaylist"
      :current-track-key="currentTrackKey"
      :favorite-keys="favoriteKeys"
      @update:visible="handlePlaylistDrawerVisible"
      @play-track="playTrackFromSummary"
      @play-all="playQueue"
      @download-track="downloadTrack"
      @toggle-favorite="toggleFavorite"
    />

    <MusicExpandedPlayer
      v-if="detailOpen && currentTrack"
      :is-playing="isPlaying"
      :current-track="currentTrack"
      :favorite-active="isFavorite(currentTrack)"
      :parsed-lyrics="parsedLyrics"
      :active-lyric-index="activeLyricIndex"
      :current-time="currentTime"
      :duration="duration"
      :slider-value="sliderValue"
      :volume="volume"
      :loop-mode="loopMode"
      @close="detailOpen = false"
      @prev="playPrev"
      @toggle="togglePlayback"
      @next="playNext"
      @toggle-loop="toggleLoopMode"
      @toggle-favorite="toggleFavorite(currentTrack)"
      @preview-seek="previewSeek"
      @seek="seekTo"
      @update-volume="handleVolumeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  fetchMusicCategoryPlaylists,
  fetchMusicOverview,
  fetchMusicPlaylistCategories,
  fetchMusicPlaylist,
  fetchMusicTrack,
  searchMusicPlaylists,
  searchMusicTracks,
} from "./api";
import MusicContent from "./components/MusicContent.vue";
import MusicExpandedPlayer from "./components/MusicExpandedPlayer.vue";
import MusicPlaylistDrawer from "./components/MusicPlaylistDrawer.vue";
import MusicPlayerPanel from "./components/MusicPlayerPanel.vue";
import MusicSidebar from "./components/MusicSidebar.vue";
import type {
  MusicLoopMode,
  MusicOverview,
  MusicPlaylistCategoryCatalog,
  MusicPlaylistDetail,
  MusicPlaylistSummary,
  MusicSearchTab,
  MusicSection,
  MusicSourceOption,
  MusicTrackDetail,
  MusicTrackSummary,
} from "./types";

const FAVORITES_KEY = "music-module:favorites";
const HISTORY_KEY = "music-module:history";
const VALID_SECTIONS: MusicSection[] = ["discover", "moon", "search", "favorites", "history"];
const VALID_SEARCH_TABS: MusicSearchTab[] = ["tracks", "playlists"];

const route = useRoute();
const router = useRouter();
const audioRef = ref<HTMLAudioElement>();
const sources = ref<MusicSourceOption[]>([]);
const activeSource = ref(readRouteSource());
const activeSection = ref<MusicSection>(readRouteSection());
const hotKeywords = ref<string[]>([]);
const featuredPlaylists = ref<MusicPlaylistSummary[]>([]);
const playlistCategories = ref<MusicPlaylistCategoryCatalog | null>(null);
const activeCategoryId = ref(readRouteCategory());
const activeCategoryName = ref("热门");
const categoryPlaylists = ref<MusicPlaylistSummary[]>([]);
const categoryTotal = ref(0);
const searchKeyword = ref(readRouteKeyword());
const searchTab = ref<MusicSearchTab>(readRouteSearchTab());
const searchResults = ref<MusicTrackSummary[]>([]);
const playlistResults = ref<MusicPlaylistSummary[]>([]);
const searchTotal = ref(0);
const playlistTotal = ref(0);
const searchPage = ref(1);
const playlistPage = ref(1);
const searchPageSize = 24;
const playlistPageSize = 12;
const selectedPlaylist = ref<MusicPlaylistDetail | null>(null);
const currentTrack = ref<MusicTrackDetail | null>(null);
const queue = ref<MusicTrackSummary[]>([]);
const isPlaying = ref(false);
const isOverviewLoading = ref(false);
const isSearchLoading = ref(false);
const isPlaylistLoading = ref(false);
const isTrackLoading = ref(false);
const isCategoryLoading = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const sliderValue = ref(0);
const volume = ref(72);
const loopMode = ref<MusicLoopMode>("all");
const favorites = ref<MusicTrackSummary[]>(readLocal(FAVORITES_KEY, []));
const history = ref<MusicTrackSummary[]>(readLocal(HISTORY_KEY, []));
const syncingRoute = ref(false);
const detailOpen = ref(false);
const isSeeking = ref(false);
const dockMinimized = ref(false);
const baseDocumentTitle = document.title || "音乐";

const currentTrackKey = computed(() => {
  return currentTrack.value ? trackKey(currentTrack.value) : "";
});

const activeSourceLabel = computed(() => {
  return sources.value.find((item) => item.code === activeSource.value)?.name || "Music Source";
});

const heroTitle = computed(() => {
  if (selectedPlaylist.value) return selectedPlaylist.value.title;
  if (activeSection.value === "search") return "搜索与即点即播";
  if (activeSection.value === "moon") return "月馆";
  if (activeSection.value === "favorites") return "收藏清单";
  if (activeSection.value === "history") return "最近播放";
  return activeCategoryName.value ? `${activeCategoryName.value}歌单` : "发现与播放";
});

const heroDescription = computed(() => {
  if (selectedPlaylist.value) return selectedPlaylist.value.description;
  if (activeSection.value === "search") {
    return "原 CeruMusic 的 IPC 搜索链路已替换成标准 HTTP 查询。";
  }
  if (activeSection.value === "moon") {
    return "把夜色氛围、月下精选和深夜新声放进一个更安静的入口。";
  }
  if (activeSection.value === "favorites") {
    return "收藏和历史先落浏览器本地，后续再接服务端同步。";
  }
  if (activeSection.value === "history") {
    return "当前先保障 Web 播放器闭环，桌面专属能力后置。";
  }
  if (activeSection.value === "discover") {
    return "按 CeruMusic 的发现页思路补齐分类歌单，桌面 IPC 已经替换成 Java HTTP 接口。";
  }
  return "保留 CeruMusic 的产品骨架，播放数据和音源扩展全部走 Java 后端。";
});

const parsedLyrics = computed(() => parseLyrics(currentTrack.value?.lyrics || ""));

const activeLyricIndex = computed(() => {
  for (let index = parsedLyrics.value.length - 1; index >= 0; index -= 1) {
    if (currentTime.value >= parsedLyrics.value[index].time) {
      return index;
    }
  }
  return -1;
});

const favoriteKeys = computed(() => {
  return favorites.value.map(track => `${track.source}:${track.trackId}`);
});

watch(volume, () => updateVolume());
watch(
  () => currentTrack.value?.title,
  title => {
    document.title = title ? `${title} - ${baseDocumentTitle}` : baseDocumentTitle;
  },
  { immediate: true }
);

watch(
  () => route.fullPath,
  async () => {
    if (syncingRoute.value) return;
    const routeSource = readRouteSource();
    if (routeSource !== activeSource.value) {
      await switchSource(routeSource, { syncRoute: false, resetView: false });
    }

    const routeSection = readRouteSection();
    if (routeSection !== activeSection.value) {
      await changeSection(routeSection);
    }

    const routeKeyword = readRouteKeyword();
    const routeTab = readRouteSearchTab();
    const shouldRefreshSearch =
      routeSection === "search" &&
      routeKeyword.trim() &&
      (routeKeyword !== searchKeyword.value || routeTab !== searchTab.value);
    if (routeKeyword !== searchKeyword.value) {
      searchKeyword.value = routeKeyword;
    }
    if (routeTab !== searchTab.value) {
      searchTab.value = routeTab;
    }
    if (shouldRefreshSearch) {
      await performSearch();
    }

    const routeCategory = readRouteCategory();
    if (
      routeCategory !== activeCategoryId.value &&
      routeSection === "discover" &&
      playlistCategories.value
    ) {
      const category = findCategoryById(playlistCategories.value, routeCategory);
      if (category) {
        await loadCategoryPlaylists(category.tagId, category.name);
      }
    }

    const routePlaylist = typeof route.query.playlist === "string" ? route.query.playlist : "";
    const routePlaylistSource =
      typeof route.query.playlistSource === "string" ? route.query.playlistSource : activeSource.value;
    if (
      routePlaylist &&
      (!selectedPlaylist.value ||
        selectedPlaylist.value.playlistId !== routePlaylist ||
        selectedPlaylist.value.source !== routePlaylistSource)
    ) {
      await openPlaylist({
        playlistId: routePlaylist,
        source: routePlaylistSource,
        title: "歌单详情",
        description: "",
        coverUrl: "",
        author: "",
        trackCount: 0,
      });
      return;
    }
    if (!routePlaylist && selectedPlaylist.value) {
      selectedPlaylist.value = null;
    }
  },
);

onMounted(async () => {
  await loadOverview();
  await loadPlaylistCategories({ syncRoute: false });
  await hydrateRouteState();
  await nextTick();
  updateVolume();
});

async function loadOverview() {
  isOverviewLoading.value = true;
  try {
    const response = await fetchMusicOverview(activeSource.value);
    const overview = response.data as MusicOverview;
    sources.value = overview.sources || [];
    activeSource.value = overview.defaultSource || activeSource.value;
    hotKeywords.value = overview.hotKeywords || [];
    featuredPlaylists.value = overview.featuredPlaylists || [];
    selectedPlaylist.value = null;
  } catch (error) {
    console.error(error);
    ElMessage.error("加载音乐首页失败");
  } finally {
    isOverviewLoading.value = false;
  }
}

async function switchSource(
  source: string,
  options: {
    syncRoute?: boolean;
    resetView?: boolean;
  } = {},
) {
  if (activeSource.value === source) return;
  const { syncRoute: shouldSyncRoute = true, resetView = true } = options;
  activeSource.value = source;
  if (resetView) {
    selectedPlaylist.value = null;
    activeSection.value = "discover";
    searchKeyword.value = "";
    searchTab.value = "tracks";
    searchResults.value = [];
    playlistResults.value = [];
    playlistCategories.value = null;
    activeCategoryId.value = "";
    activeCategoryName.value = "热门";
    categoryPlaylists.value = [];
    categoryTotal.value = 0;
    searchTotal.value = 0;
    playlistTotal.value = 0;
    searchPage.value = 1;
    playlistPage.value = 1;
  }
  await loadOverview();
  await loadPlaylistCategories({ syncRoute: shouldSyncRoute });
  if (shouldSyncRoute) {
    await syncRouteState();
  }
}

async function loadPlaylistCategories(
  options: {
    syncRoute?: boolean;
  } = {},
) {
  const { syncRoute: shouldSyncRoute = true } = options;
  isCategoryLoading.value = true;
  try {
    const response = await fetchMusicPlaylistCategories(activeSource.value);
    playlistCategories.value = response.data || null;
    const preferredCategory = activeCategoryId.value;
    const matchedCategory = findCategoryById(response.data, preferredCategory);
    const firstHot = matchedCategory || response.data?.hotTags?.[0];
    activeCategoryId.value = firstHot?.tagId || "";
    activeCategoryName.value = firstHot?.name || "热门";
    await loadCategoryPlaylists(activeCategoryId.value, activeCategoryName.value, {
      syncRoute: shouldSyncRoute,
    });
  } catch (error) {
    console.error(error);
    playlistCategories.value = null;
    categoryPlaylists.value = [...featuredPlaylists.value];
    categoryTotal.value = featuredPlaylists.value.length;
  } finally {
    isCategoryLoading.value = false;
  }
}

async function loadCategoryPlaylists(
  tagId: string,
  tagName?: string,
  options: {
    syncRoute?: boolean;
  } = {},
) {
  const { syncRoute: shouldSyncRoute = true } = options;
  isCategoryLoading.value = true;
  try {
    activeSection.value = "discover";
    selectedPlaylist.value = null;
    activeCategoryId.value = tagId;
    activeCategoryName.value = tagName || activeCategoryName.value || "热门";
    const response = await fetchMusicCategoryPlaylists(activeSource.value, tagId, 1, 12);
    categoryPlaylists.value = response.data.playlists || [];
    categoryTotal.value = response.data.total || 0;
    if (response.data.categoryName) {
      activeCategoryName.value = response.data.categoryName;
    }
    if (shouldSyncRoute) {
      await syncRouteState();
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("加载分类歌单失败");
  } finally {
    isCategoryLoading.value = false;
  }
}

async function performSearch(page: number = 1) {
  const keyword = searchKeyword.value.trim();
  if (!keyword) {
    ElMessage.warning("请输入搜索关键词");
    return;
  }
  isSearchLoading.value = true;
  try {
    activeSection.value = "search";
    selectedPlaylist.value = null;
    searchPage.value = page;
    playlistPage.value = 1;
    const [trackResponse, playlistResponse] = await Promise.all([
      searchMusicTracks(keyword, undefined, searchPage.value, searchPageSize),
      searchMusicPlaylists(keyword, undefined, playlistPage.value, playlistPageSize),
    ]);
    searchResults.value = trackResponse.data.tracks || [];
    searchTotal.value = trackResponse.data.total || 0;
    playlistResults.value = playlistResponse.data.playlists || [];
    playlistTotal.value = playlistResponse.data.total || 0;
    queue.value = [...searchResults.value];
    await syncRouteState();
  } catch (error) {
    console.error(error);
    ElMessage.error("搜索失败");
  } finally {
    isSearchLoading.value = false;
  }
}

function changeSearchPage(page: number) {
  void performSearch(page);
}

function changeSearchTab(tab: MusicSearchTab) {
  if (searchTab.value === tab) return;
  searchTab.value = tab;
  if (searchKeyword.value.trim()) {
    void performSearch(1);
    return;
  }
  void syncRouteState();
}

async function openPlaylist(playlist: MusicPlaylistSummary) {
  isPlaylistLoading.value = true;
  try {
    const response = await fetchMusicPlaylist(playlist.source, playlist.playlistId);
    selectedPlaylist.value = response.data;
    queue.value = [...response.data.tracks];
    activeSection.value = "discover";
    await syncRouteState();
  } catch (error) {
    console.error(error);
    ElMessage.error("加载歌单失败");
  } finally {
    isPlaylistLoading.value = false;
  }
}

async function playTrackFromSummary(
  summary: MusicTrackSummary,
  nextQueue: MusicTrackSummary[],
) {
  if (currentTrackKey.value === trackKey(summary)) {
    queue.value = [...nextQueue];
    if (!isPlaying.value) {
      togglePlayback();
    }
    return;
  }

  isTrackLoading.value = true;
  try {
    const response = await fetchMusicTrack(summary.source, summary.trackId);
    currentTrack.value = response.data;
    dockMinimized.value = false;
    queue.value = [...nextQueue];
    isSeeking.value = false;
    currentTime.value = 0;
    duration.value = response.data.durationSeconds || 0;
    sliderValue.value = 0;
    pushHistory(summary);
    await nextTick();
    await audioRef.value?.play();
  } catch (error) {
    console.error(error);
    ElMessage.error("播放失败");
  } finally {
    isTrackLoading.value = false;
  }
}

function playQueue(nextQueue: MusicTrackSummary[]) {
  if (!nextQueue.length) {
    return;
  }
  void playTrackFromSummary(nextQueue[0], nextQueue);
}

function togglePlayback() {
  if (!audioRef.value || !currentTrack.value) return;
  if (isPlaying.value) {
    audioRef.value.pause();
    return;
  }
  audioRef.value.play().catch((error) => {
    console.error(error);
    ElMessage.error("音频播放失败");
  });
}

function handleTimeUpdate() {
  if (!audioRef.value) return;
  if (isSeeking.value) return;
  currentTime.value = audioRef.value.currentTime || 0;
  sliderValue.value = currentTime.value;
}

function handleLoadedMetadata() {
  if (!audioRef.value) return;
  duration.value = Number.isFinite(audioRef.value.duration) ? audioRef.value.duration : 0;
  sliderValue.value = 0;
}

function handleAudioError() {
  isPlaying.value = false;
  ElMessage.error("音频流加载失败");
}

function seekTo(value: number) {
  if (!audioRef.value) return;
  isSeeking.value = false;
  audioRef.value.currentTime = value;
  currentTime.value = value;
  sliderValue.value = value;
}

function previewSeek(value: number) {
  isSeeking.value = true;
  currentTime.value = value;
  sliderValue.value = value;
}

function updateVolume() {
  if (!audioRef.value) return;
  audioRef.value.volume = Math.max(0, Math.min(1, volume.value / 100));
}

function handleVolumeChange(value: number) {
  volume.value = value;
}

async function downloadTrack(track: MusicTrackSummary) {
  try {
    const response = await fetchMusicTrack(track.source, track.trackId);
    const detail = response.data;
    if (!detail.streamUrl) {
      ElMessage.warning("当前音源没有可下载的音频流");
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = detail.streamUrl;
    anchor.download = `${detail.artist || "未知歌手"} - ${detail.title}.mp3`;
    anchor.target = "_blank";
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } catch (error) {
    console.error(error);
    ElMessage.error("下载失败");
  }
}

function playNext() {
  if (!currentTrack.value || !queue.value.length) return;
  if (loopMode.value === "one") {
    seekTo(0);
    void audioRef.value?.play();
    return;
  }
  const index = queue.value.findIndex((item) => trackKey(item) === currentTrackKey.value);
  const next = queue.value[(index + 1) % queue.value.length];
  void playTrackFromSummary(next, queue.value);
}

function playPrev() {
  if (!currentTrack.value || !queue.value.length) return;
  const index = queue.value.findIndex((item) => trackKey(item) === currentTrackKey.value);
  const prev = queue.value[(index - 1 + queue.value.length) % queue.value.length];
  void playTrackFromSummary(prev, queue.value);
}

function toggleLoopMode() {
  loopMode.value = loopMode.value === "all" ? "one" : "all";
}

function searchByTag(tag: string) {
  searchKeyword.value = tag;
  void performSearch();
}

async function handleBackPlaylist() {
  selectedPlaylist.value = null;
  await syncRouteState();
}

function handlePlaylistDrawerVisible(value: boolean) {
  if (!value) {
    void handleBackPlaylist();
  }
}

async function changeSection(section: MusicSection) {
  if (activeSection.value === section && !selectedPlaylist.value) {
    return;
  }
  activeSection.value = section;
  selectedPlaylist.value = null;
  if (section === "discover" && !categoryPlaylists.value.length) {
    await loadCategoryPlaylists(activeCategoryId.value, activeCategoryName.value);
    return;
  }
  await syncRouteState();
}

function isFavorite(track: MusicTrackSummary | MusicTrackDetail | null) {
  if (!track) return false;
  return favorites.value.some((item) => trackKey(item) === trackKey(track));
}

function toggleFavorite(track: MusicTrackSummary | MusicTrackDetail | null) {
  if (!track) return;
  const summary = toSummary(track);
  const index = favorites.value.findIndex((item) => trackKey(item) === trackKey(summary));
  if (index >= 0) {
    favorites.value.splice(index, 1);
    ElMessage.success("已取消收藏");
  } else {
    favorites.value.unshift(summary);
    favorites.value = favorites.value.slice(0, 100);
    ElMessage.success("已加入收藏");
  }
  writeLocal(FAVORITES_KEY, favorites.value);
}

function pushHistory(track: MusicTrackSummary | MusicTrackDetail) {
  const summary = toSummary(track);
  history.value = history.value.filter((item) => trackKey(item) !== trackKey(summary));
  history.value.unshift(summary);
  history.value = history.value.slice(0, 100);
  writeLocal(HISTORY_KEY, history.value);
}

function trackKey(track: Pick<MusicTrackSummary, "source" | "trackId">) {
  return `${track.source}:${track.trackId}`;
}

function toSummary(track: MusicTrackSummary | MusicTrackDetail): MusicTrackSummary {
  return {
    trackId: track.trackId,
    source: track.source,
    title: track.title,
    artist: track.artist,
    album: track.album,
    coverUrl: track.coverUrl,
    durationSeconds: track.durationSeconds,
  };
}

function parseLyrics(lyrics: string) {
  return lyrics
    .split("\n")
    .map((line) => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
      if (!match) return null;
      const time =
        Number.parseInt(match[1], 10) * 60 +
        Number.parseInt(match[2], 10) +
        Number.parseInt(match[3], 10) / 100;
      return { time, text: match[4].trim() };
    })
    .filter((item): item is { time: number; text: string } => Boolean(item));
}

function readLocal<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readRouteSource() {
  const source = route.query.source;
  return typeof source === "string" && source.trim() ? source : "tx";
}

function readRouteSection(): MusicSection {
  const section = route.query.section;
  if (typeof section === "string" && VALID_SECTIONS.includes(section as MusicSection)) {
    return section as MusicSection;
  }
  return "discover";
}

function readRouteKeyword() {
  return typeof route.query.keyword === "string" ? route.query.keyword : "";
}

function readRouteCategory() {
  return typeof route.query.category === "string" ? route.query.category : "";
}

function readRouteSearchTab(): MusicSearchTab {
  const tab = route.query.tab;
  if (typeof tab === "string" && VALID_SEARCH_TABS.includes(tab as MusicSearchTab)) {
    return tab as MusicSearchTab;
  }
  return "tracks";
}

function findCategoryById(catalog: MusicPlaylistCategoryCatalog | null | undefined, tagId: string) {
  if (!catalog) return null;
  return (
    catalog.hotTags.find((item) => item.tagId === tagId) ||
    catalog.groups.flatMap((item) => item.tags).find((item) => item.tagId === tagId) ||
    null
  );
}

async function hydrateRouteState() {
  const routeSource = readRouteSource();
  if (routeSource && routeSource !== activeSource.value) {
    await switchSource(routeSource, { syncRoute: false, resetView: false });
  }

  const routeSection = readRouteSection();
  activeSection.value = routeSection;
  searchKeyword.value = readRouteKeyword();
  searchTab.value = readRouteSearchTab();

  const routeCategory = readRouteCategory();
  if (routeCategory && routeCategory !== activeCategoryId.value) {
    const category = findCategoryById(playlistCategories.value, routeCategory);
    if (category) {
      await loadCategoryPlaylists(category.tagId, category.name);
    }
  }

  const playlistId = typeof route.query.playlist === "string" ? route.query.playlist : "";
  if (playlistId) {
    const source = typeof route.query.playlistSource === "string" ? route.query.playlistSource : activeSource.value;
    const summary =
      [...featuredPlaylists.value, ...categoryPlaylists.value, ...playlistResults.value].find(
        (item) => item.playlistId === playlistId && item.source === source,
      ) ||
      ({
        playlistId,
        source,
        title: "歌单详情",
        description: "",
        coverUrl: "",
        author: "",
        trackCount: 0,
      } as MusicPlaylistSummary);
    await openPlaylist(summary);
    return;
  }

  if (routeSection === "search" && searchKeyword.value.trim()) {
    await performSearch();
    return;
  }

  await syncRouteState();
}

async function syncRouteState() {
  if (syncingRoute.value) return;
  syncingRoute.value = true;
  try {
    const nextQuery: Record<string, string> = {};
    if (activeSource.value && activeSource.value !== "tx") nextQuery.source = activeSource.value;
    if (activeSection.value !== "discover") nextQuery.section = activeSection.value;
    if (activeCategoryId.value) nextQuery.category = activeCategoryId.value;
    if (searchKeyword.value.trim()) nextQuery.keyword = searchKeyword.value.trim();
    if (searchTab.value !== "tracks") nextQuery.tab = searchTab.value;
    if (selectedPlaylist.value) {
      nextQuery.playlist = selectedPlaylist.value.playlistId;
      nextQuery.playlistSource = selectedPlaylist.value.source;
    }
    await router.replace({ query: nextQuery });
  } finally {
    syncingRoute.value = false;
  }
}
</script>

<style scoped lang="scss">
.music-shell {
  --music-dock-space: 228px;
  --music-panel: linear-gradient(180deg, rgba(83, 39, 34, 0.92), rgba(53, 24, 20, 0.95));
  --music-panel-soft: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
  --music-stroke: rgba(255, 255, 255, 0.08);
  --music-shadow: 0 30px 80px rgba(24, 8, 7, 0.34);
  --music-text: #fff7ee;
  --music-muted: rgba(246, 225, 212, 0.72);
  --music-subtle: rgba(236, 203, 182, 0.56);
  --music-accent: #f1bb67;
  --music-accent-2: #ffd997;
  position: relative;
  min-height: calc(100vh - 84px);
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 20px;
  overflow: hidden;
  padding: 20px 20px var(--music-dock-space);
  background:
    radial-gradient(circle at top left, rgba(165, 92, 72, 0.28), transparent 24%),
    radial-gradient(circle at 82% 10%, rgba(92, 43, 95, 0.22), transparent 24%),
    radial-gradient(circle at bottom left, rgba(235, 147, 62, 0.22), transparent 30%),
    linear-gradient(180deg, #3a2032 0%, #4a261f 48%, #5a2c0e 100%);
  color: var(--music-text);
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

.music-shell.is-dock-minimized {
  --music-dock-space: 112px;
}

.music-shell::before,
.music-shell::after {
  position: absolute;
  inset: auto;
  pointer-events: none;
  content: "";
}

.music-shell::before {
  top: -80px;
  right: -40px;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 210, 116, 0.16), transparent 68%);
}

.music-shell::after {
  left: -120px;
  bottom: -160px;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 171, 74, 0.18), transparent 72%);
}

.music-shell audio {
  display: none;
}

.music-layout {
  position: relative;
  z-index: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 18px;
}

.music-dock {
  position: fixed;
  left: 20px;
  right: 20px;
  bottom: 20px;
  z-index: 3200;
}

.music-dock.is-minimized {
  left: auto;
  width: min(620px, calc(100vw - 40px));
}

.music-layout :deep(.nav-panel),
.music-layout :deep(.content-panel),
.music-dock :deep(.detail-panel) {
  min-width: 0;
}

@media (max-width: 1320px) {
  .music-layout {
    grid-template-columns: 196px minmax(0, 1fr);
  }
}

@media (max-width: 960px) {
  .music-shell {
    padding: 14px 14px 168px;
    gap: 16px;
  }

  .music-shell.is-dock-minimized {
    padding-bottom: 118px;
  }

  .music-layout {
    grid-template-columns: 1fr;
  }

  .music-dock {
    left: 14px;
    right: 14px;
    bottom: 14px;
  }

  .music-dock.is-minimized {
    left: 14px;
    right: 14px;
    width: auto;
  }
}
</style>
