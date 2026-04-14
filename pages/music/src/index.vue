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
        :radio-tracks="radioTracks"
        :radar-tracks="radarTracks"
        :hot-keywords="hotKeywords"
        :show-track-source="showTrackSource"
        :source-label-map="sourceLabelMap"
        @search="performSearch()"
        @open-settings="openSettings"
        @search-tag="searchByTag"
        @back-playlist="handleBackPlaylist"
        @open-playlist="openPlaylist"
        @play-track="playTrackFromSummary"
        @download-track="downloadTrack"
        @toggle-favorite="toggleFavorite"
        @start-radio="startRadio"
        @refresh-radar="refreshRadar"
        @random-play="playRandom"
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
      :show-source-label="showTrackSource"
      :source-label-map="sourceLabelMap"
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

    <MusicSettingsOverlay
      :visible="settingsOpen"
      :sources="adminSources"
      :saving-codes="sourceSavingCodes"
      :show-track-source="showTrackSource"
      @update:visible="settingsOpen = $event"
      @update:show-track-source="showTrackSource = $event"
      @toggle-source="handleToggleAdminSource"
    />
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/utils";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  fetchMusicAdminSources,
  fetchMusicCategoryPlaylists,
  fetchMusicOverview,
  fetchMusicPlaylistCategories,
  fetchMusicPlaylist,
  fetchMusicTrack,
  searchMusicPlaylists,
  searchMusicTracks,
  updateMusicAdminSource,
} from "./api";
import MusicContent from "./components/MusicContent.vue";
import MusicExpandedPlayer from "./components/MusicExpandedPlayer.vue";
import MusicPlaylistDrawer from "./components/MusicPlaylistDrawer.vue";
import MusicPlayerPanel from "./components/MusicPlayerPanel.vue";
import MusicSettingsOverlay from "./components/MusicSettingsOverlay.vue";
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

interface MusicFailureLogItem {
  time: number;
  source: string;
  stage: string;
  trackId?: string;
  title?: string;
  reason?: string;
}

const FAVORITES_KEY = "music-module:favorites";
const HISTORY_KEY = "music-module:history";
const SETTINGS_KEY = "music-module:settings";
const SOURCE_HEALTH_KEY = "music-module:source-health";
const FAILURE_LOG_KEY = "music-module:failure-log";
const RANDOM_RECENT_KEY = "music-module:random-recent-keys";
const VALID_SECTIONS: MusicSection[] = [
  "discover",
  "moon",
  "radio",
  "radar",
  "search",
  "favorites",
  "history",
];
const VALID_SEARCH_TABS: MusicSearchTab[] = ["tracks", "playlists"];

const route = useRoute();
const router = useRouter();
const audioRef = ref<HTMLAudioElement>();
const sources = ref<MusicSourceOption[]>([]);
const adminSources = ref<MusicSourceOption[]>([]);
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
const radioTracks = ref<MusicTrackSummary[]>([]);
const radarTracks = ref<MusicTrackSummary[]>([]);
const syncingRoute = ref(false);
const detailOpen = ref(false);
const settingsOpen = ref(false);
const isSeeking = ref(false);
const dockMinimized = ref(false);
const sourceSavingCodes = ref<string[]>([]);
const showTrackSource = ref(readSettings().showTrackSource);
const sourceHealth = ref<Record<string, { success: number; fail: number }>>(
  readLocal(SOURCE_HEALTH_KEY, {}),
);
const failureLog = ref<MusicFailureLogItem[]>(readLocal(FAILURE_LOG_KEY, []));
const randomRecentKeys = ref<string[]>(readLocal(RANDOM_RECENT_KEY, []));
const baseDocumentTitle = document.title || "音乐";
const TRACK_LOAD_TIMEOUT_MS = 15000;
const SOURCE_BLOCK_FAIL_THRESHOLD = 4;
const SOURCE_SHARE_RATIO = 0.42;
const FAILURE_LOG_LIMIT = 200;
const RANDOM_RECENT_LIMIT = 40;

const currentTrackKey = computed(() => {
  return currentTrack.value ? trackKey(currentTrack.value) : "";
});

const activeSourceLabel = computed(() => {
  return sources.value.find((item) => item.code === activeSource.value)?.name || "Music Source";
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

const heroTitle = computed(() => {
  if (selectedPlaylist.value) return selectedPlaylist.value.title;
  if (activeSection.value === "search") return "搜索与即点即播";
  if (activeSection.value === "moon") return "月馆";
  if (activeSection.value === "radio") return "音乐电台";
  if (activeSection.value === "radar") return "音乐雷达";
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
  if (activeSection.value === "radio") {
    return "自动聚合你常听内容，持续生成可直接播放的电台队列。";
  }
  if (activeSection.value === "radar") {
    return "按当前歌曲与近期偏好做相似推荐，快速发现新歌。";
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

const favoriteKeys = computed(() => {
  return favorites.value.map(track => `${track.source}:${track.trackId}`);
});

const sourceLabelMap = computed(() => {
  const map: Record<string, string> = {};
  [...adminSources.value, ...sources.value].forEach((item) => {
    map[item.code] = item.name;
  });
  return map;
});

watch(volume, () => updateVolume());
watch(showTrackSource, (value) => {
  writeSettings({ showTrackSource: value });
});
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
  installFailureDebugBackdoor();
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
    message("加载音乐首页失败", { type: "error" });
  } finally {
    isOverviewLoading.value = false;
  }
}

async function loadAdminSources() {
  try {
    const response = await fetchMusicAdminSources();
    adminSources.value = response.data || [];
  } catch (error) {
    console.error(error);
    message("加载音源设置失败", { type: "error" });
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
    radioTracks.value = [];
    radarTracks.value = [];
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
    message("加载分类歌单失败", { type: "error" });
  } finally {
    isCategoryLoading.value = false;
  }
}

async function openSettings() {
  settingsOpen.value = true;
  await loadAdminSources();
}

async function performSearch(page: number = 1) {
  const keyword = searchKeyword.value.trim();
  if (!keyword) {
    message("请输入搜索关键词", { type: "warning" });
    return;
  }
  isSearchLoading.value = true;
  try {
    activeSection.value = "search";
    selectedPlaylist.value = null;
    searchPage.value = page;
    playlistPage.value = 1;
    const [trackResponse, playlistResponse] = await Promise.all([
      searchMusicTracks(keyword, activeSource.value, searchPage.value, searchPageSize),
      searchMusicPlaylists(keyword, activeSource.value, playlistPage.value, playlistPageSize),
    ]);
    searchResults.value = trackResponse.data.tracks || [];
    searchTotal.value = trackResponse.data.total || 0;
    playlistResults.value = playlistResponse.data.playlists || [];
    playlistTotal.value = playlistResponse.data.total || 0;
    queue.value = [...searchResults.value];
    await syncRouteState();
  } catch (error) {
    console.error(error);
    message("搜索失败", { type: "error" });
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
    message("加载歌单失败", { type: "error" });
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
    const detail = await withTimeout(
      resolvePlayableTrack(summary),
      TRACK_LOAD_TIMEOUT_MS,
      "歌曲加载超时，请重试",
    );
    if (!detail) {
      throw new Error("未找到可用音频流");
    }
    currentTrack.value = detail;
    dockMinimized.value = false;
    queue.value = [...nextQueue];
    isSeeking.value = false;
    currentTime.value = 0;
    duration.value = detail.durationSeconds || 0;
    sliderValue.value = 0;
    pushHistory(detail);
    pushRandomRecentKey(trackKey(detail));
    await nextTick();
    const playTask = audioRef.value?.play();
    if (playTask) {
      void playTask.catch((error) => {
        console.error(error);
        message("音频播放失败", { type: "error" });
      });
    }
  } catch (error) {
    console.error(error);
    message(error instanceof Error ? error.message || "播放失败" : "播放失败", { type: "error" });
  } finally {
    isTrackLoading.value = false;
  }
}

function playQueue(nextQueue: MusicTrackSummary[]) {
  if (!nextQueue.length) {
    return;
  }
  const queueForPlay = loopMode.value === "random" ? shuffleTracks(nextQueue) : [...nextQueue];
  const target =
    loopMode.value === "random"
      ? pickRandomTrack(queueForPlay, currentTrackKey.value) || queueForPlay[0]
      : queueForPlay[0];
  void playTrackFromSummary(target, queueForPlay);
}

function togglePlayback() {
  if (!audioRef.value || !currentTrack.value) return;
  if (isPlaying.value) {
    audioRef.value.pause();
    return;
  }
  audioRef.value.play().catch((error) => {
    console.error(error);
    message("音频播放失败", { type: "error" });
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
  isTrackLoading.value = false;
  if (currentTrack.value?.source) {
    markSourceFailure(currentTrack.value.source, {
      stage: "audio-error",
      trackId: currentTrack.value.trackId,
      title: currentTrack.value.title,
      reason: "audio-element-error",
    });
  }
  message("音频流加载失败", { type: "error" });
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
      message("当前音源没有可下载的音频流", { type: "warning" });
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
    message("下载失败", { type: "error" });
  }
}

function playNext() {
  if (!currentTrack.value || !queue.value.length) return;
  if (loopMode.value === "one") {
    seekTo(0);
    void audioRef.value?.play();
    return;
  }
  if (loopMode.value === "random") {
    const randomTrack = pickRandomTrack(queue.value, currentTrackKey.value);
    if (!randomTrack) return;
    void playTrackFromSummary(randomTrack, queue.value);
    return;
  }
  const index = queue.value.findIndex((item) => trackKey(item) === currentTrackKey.value);
  const next = queue.value[(index + 1) % queue.value.length];
  void playTrackFromSummary(next, queue.value);
}

function playPrev() {
  if (!currentTrack.value || !queue.value.length) return;
  if (loopMode.value === "random") {
    const randomTrack = pickRandomTrack(queue.value, currentTrackKey.value);
    if (!randomTrack) return;
    void playTrackFromSummary(randomTrack, queue.value);
    return;
  }
  const index = queue.value.findIndex((item) => trackKey(item) === currentTrackKey.value);
  const prev = queue.value[(index - 1 + queue.value.length) % queue.value.length];
  void playTrackFromSummary(prev, queue.value);
}

function toggleLoopMode() {
  loopMode.value =
    loopMode.value === "all" ? "one" : loopMode.value === "one" ? "random" : "all";
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

function persistSourceHealth() {
  writeLocal(SOURCE_HEALTH_KEY, sourceHealth.value);
}

function appendFailureLog(item: Omit<MusicFailureLogItem, "time">) {
  failureLog.value = [
    {
      ...item,
      time: Date.now(),
    },
    ...failureLog.value,
  ].slice(0, FAILURE_LOG_LIMIT);
  writeLocal(FAILURE_LOG_KEY, failureLog.value);
}

function pushRandomRecentKey(key: string) {
  randomRecentKeys.value = [key, ...randomRecentKeys.value.filter((item) => item !== key)].slice(
    0,
    RANDOM_RECENT_LIMIT,
  );
  writeLocal(RANDOM_RECENT_KEY, randomRecentKeys.value);
}

function clearFailurePersistence() {
  sourceHealth.value = {};
  failureLog.value = [];
  writeLocal(SOURCE_HEALTH_KEY, sourceHealth.value);
  writeLocal(FAILURE_LOG_KEY, failureLog.value);
}

function installFailureDebugBackdoor() {
  const debugApi = {
    getSourceHealth: () => sourceHealth.value,
    getFailureLog: () => failureLog.value,
    getRandomRecentKeys: () => randomRecentKeys.value,
    clearFailures: () => clearFailurePersistence(),
    clearRandomRecent: () => {
      randomRecentKeys.value = [];
      writeLocal(RANDOM_RECENT_KEY, randomRecentKeys.value);
    },
  };
  (window as any).__MUSIC_FAILURE_DEBUG__ = debugApi;
}

function randomInt(max: number) {
  if (max <= 0) return 0;
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function getEnabledSourceCodes() {
  const fromAdmin = adminSources.value.filter((item) => item.enabled).map((item) => item.code);
  if (fromAdmin.length) return fromAdmin;
  const fromOverview = sources.value.filter((item) => item.enabled).map((item) => item.code);
  return fromOverview.length ? fromOverview : [activeSource.value];
}

function getDiscoverySource() {
  const codes = getEnabledSourceCodes();
  if (!codes.length) return activeSource.value;
  if (codes.length === 1) return codes[0];
  return "all";
}

function getSourceStats(source: string) {
  return sourceHealth.value[source] || { success: 0, fail: 0 };
}

function markSourceSuccess(source: string) {
  const stats = getSourceStats(source);
  sourceHealth.value[source] = {
    success: stats.success + 1,
    fail: stats.fail,
  };
  persistSourceHealth();
}

function markSourceFailure(
  source: string,
  meta: {
    stage?: string;
    trackId?: string;
    title?: string;
    reason?: string;
  } = {},
) {
  const stats = getSourceStats(source);
  sourceHealth.value[source] = {
    success: stats.success,
    fail: stats.fail + 1,
  };
  persistSourceHealth();
  appendFailureLog({
    source,
    stage: meta.stage || "unknown",
    trackId: meta.trackId,
    title: meta.title,
    reason: meta.reason,
  });
}

function getSourceFailureRatio(source: string) {
  const stats = getSourceStats(source);
  const total = stats.success + stats.fail;
  if (total <= 0) return 0;
  return stats.fail / total;
}

function isSourceBlocked(source: string) {
  const stats = getSourceStats(source);
  return stats.fail >= SOURCE_BLOCK_FAIL_THRESHOLD && stats.success <= 0;
}

function getSourceRank(source: string) {
  const stats = getSourceStats(source);
  const ratio = getSourceFailureRatio(source);
  const blockedPenalty = isSourceBlocked(source) ? 1000 : 0;
  const qqPenalty = source === "tx" && getEnabledSourceCodes().length > 1 ? 8 : 0;
  return blockedPenalty + qqPenalty + ratio * 100 + stats.fail - stats.success * 0.1;
}

function dedupeTracks(tracks: MusicTrackSummary[]) {
  const bucket = new Map<string, MusicTrackSummary>();
  tracks.forEach((track) => {
    bucket.set(trackKey(track), track);
  });
  return Array.from(bucket.values());
}

function rebalanceTracksBySource(tracks: MusicTrackSummary[]) {
  const deduped = dedupeTracks(tracks);
  if (deduped.length <= 1) return deduped;

  const grouped = new Map<string, MusicTrackSummary[]>();
  deduped.forEach((track) => {
    if (!grouped.has(track.source)) {
      grouped.set(track.source, []);
    }
    grouped.get(track.source)?.push(track);
  });
  const sourcesInTracks = Array.from(grouped.keys());
  if (sourcesInTracks.length <= 1) return deduped;

  const healthySources = sourcesInTracks.filter((source) => !isSourceBlocked(source));
  const effectiveSources = healthySources.length ? healthySources : sourcesInTracks;
  const maxPerSource = Math.max(8, Math.ceil(deduped.length * SOURCE_SHARE_RATIO));

  const sourceOrder = [...effectiveSources].sort((left, right) => {
    return getSourceRank(left) - getSourceRank(right);
  });
  sourceOrder.forEach((source) => {
    const list = grouped.get(source) || [];
    grouped.set(source, shuffleTracks(list));
  });

  const result: MusicTrackSummary[] = [];
  const sourceCounter = new Map<string, number>();
  let moved = true;
  while (moved) {
    moved = false;
    sourceOrder.forEach((source) => {
      const list = grouped.get(source) || [];
      if (!list.length) return;
      const pickedCount = sourceCounter.get(source) || 0;
      if (pickedCount >= maxPerSource && sourceOrder.length > 1) return;
      const next = list.shift();
      if (!next) return;
      result.push(next);
      sourceCounter.set(source, pickedCount + 1);
      moved = true;
    });
  }

  return result.length ? result : deduped;
}

function shuffleTracks(tracks: MusicTrackSummary[]) {
  const shuffled = [...tracks];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInt(index + 1);
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function pickRandomTrack(tracks: MusicTrackSummary[], excludeKey?: string) {
  const deduped = dedupeTracks(tracks);
  if (!deduped.length) return null;
  if (deduped.length === 1) return deduped[0];

  const candidatePool = excludeKey
    ? deduped.filter((item) => trackKey(item) !== excludeKey)
    : deduped;
  if (!candidatePool.length) return deduped[0];

  const recentWindow = randomRecentKeys.value.slice(
    0,
    Math.min(Math.max(3, Math.floor(candidatePool.length / 2)), 12),
  );
  const recentSet = new Set(recentWindow);
  const freshPool = candidatePool.filter((item) => !recentSet.has(trackKey(item)));
  const finalPool = freshPool.length ? freshPool : candidatePool;
  return finalPool[randomInt(finalPool.length)];
}

function collectLocalSeedTracks() {
  return dedupeTracks([
    ...queue.value,
    ...history.value,
    ...favorites.value,
    ...searchResults.value,
    ...(selectedPlaylist.value?.tracks || []),
  ]);
}

function buildRadarKeywords() {
  const current = currentTrack.value;
  const keywords = new Set<string>();
  if (current?.title) keywords.add(current.title);
  if (current?.artist) keywords.add(current.artist);
  if (current?.album) keywords.add(current.album);
  favorites.value.slice(0, 4).forEach((item) => {
    if (item.artist) keywords.add(item.artist);
  });
  history.value.slice(0, 4).forEach((item) => {
    if (item.title) keywords.add(item.title);
  });
  hotKeywords.value.slice(0, 6).forEach((item) => {
    if (item) keywords.add(item);
  });
  return Array.from(keywords).map((item) => item.trim()).filter(Boolean);
}

async function collectTracksByKeywords(
  keywords: string[],
  options: {
    maxKeywords?: number;
    pageSize?: number;
  } = {},
) {
  const { maxKeywords = 5, pageSize = 12 } = options;
  const selectedKeywords = keywords
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxKeywords);
  if (!selectedKeywords.length) return [];

  const results = await Promise.all(
    selectedKeywords.map(async (keyword) => {
      try {
        const response = await searchMusicTracks(keyword, getDiscoverySource(), 1, pageSize);
        return response.data?.tracks || [];
      } catch (error) {
        console.warn("[Music] 关键词检索失败", keyword, error);
        return [];
      }
    }),
  );
  return rebalanceTracksBySource(results.flat());
}

async function ensureRadioTracks(force: boolean = false) {
  if (!force && radioTracks.value.length) return;
  const seeds = collectLocalSeedTracks();
  const keywords = [
    ...hotKeywords.value,
    ...favorites.value.slice(0, 5).map((item) => item.artist),
    currentTrack.value?.title || "",
    currentTrack.value?.artist || "",
  ].filter(Boolean);
  const fetched = await collectTracksByKeywords(keywords, { maxKeywords: 6, pageSize: 10 });
  radioTracks.value = rebalanceTracksBySource([...fetched, ...seeds]).slice(0, 120);
}

async function ensureRadarTracks(force: boolean = false) {
  if (!force && radarTracks.value.length) return;
  const keywords = buildRadarKeywords();
  const fetched = await collectTracksByKeywords(keywords, { maxKeywords: 6, pageSize: 10 });
  const currentKey = currentTrackKey.value;
  const base = dedupeTracks([...fetched, ...collectLocalSeedTracks()]).filter(
    (item) => trackKey(item) !== currentKey,
  );
  if (!currentTrack.value) {
    radarTracks.value = base.slice(0, 120);
    return;
  }
  const currentArtist = currentTrack.value.artist.trim().toLowerCase();
  const currentAlbum = currentTrack.value.album.trim().toLowerCase();
  const ranked = [...base]
    .sort((left, right) => {
      const leftScore =
        (left.artist.trim().toLowerCase() === currentArtist ? 3 : 0) +
        (left.album.trim().toLowerCase() === currentAlbum ? 1 : 0) -
        getSourceRank(left.source) * 0.02;
      const rightScore =
        (right.artist.trim().toLowerCase() === currentArtist ? 3 : 0) +
        (right.album.trim().toLowerCase() === currentAlbum ? 1 : 0) -
        getSourceRank(right.source) * 0.02;
      return rightScore - leftScore;
    });
  radarTracks.value = rebalanceTracksBySource(ranked).slice(0, 120);
}

async function startRadio() {
  await ensureRadioTracks();
  if (!radioTracks.value.length) {
    message("当前没有可用电台歌曲，请先搜索或播放几首歌", { type: "warning" });
    return;
  }
  const queueForPlay =
    loopMode.value === "random" ? shuffleTracks(radioTracks.value) : [...radioTracks.value];
  const target = pickRandomTrack(queueForPlay, currentTrackKey.value) || queueForPlay[0];
  void playTrackFromSummary(target, queueForPlay);
}

async function refreshRadar() {
  await ensureRadarTracks(true);
  if (!radarTracks.value.length) {
    message("当前没有雷达推荐，请先播放或搜索歌曲", { type: "warning" });
    return;
  }
  message(`雷达已更新，共 ${radarTracks.value.length} 首推荐`, { type: "success" });
}

async function playRandom() {
  let pool: MusicTrackSummary[] = [];
  if (activeSection.value === "radio") {
    await ensureRadioTracks();
    pool = radioTracks.value;
  } else if (activeSection.value === "radar") {
    await ensureRadarTracks();
    pool = radarTracks.value;
  } else if (activeSection.value === "search") {
    pool = searchResults.value;
  } else if (activeSection.value === "favorites") {
    pool = favorites.value;
  } else if (activeSection.value === "history") {
    pool = history.value;
  } else {
    pool = selectedPlaylist.value?.tracks?.length
      ? selectedPlaylist.value.tracks
      : collectLocalSeedTracks();
  }
  const deduped = dedupeTracks(pool);
  if (!deduped.length) {
    message("当前页面没有可随机播放的歌曲", { type: "warning" });
    return;
  }
  const queueForPlay = shuffleTracks(rebalanceTracksBySource(deduped));
  const target = pickRandomTrack(queueForPlay, currentTrackKey.value) || queueForPlay[0];
  void playTrackFromSummary(target, queueForPlay);
}

async function resolvePlayableTrack(summary: MusicTrackSummary): Promise<MusicTrackDetail | null> {
  try {
    const direct = await fetchMusicTrack(summary.source, summary.trackId);
    if (direct.data?.streamUrl) {
      markSourceSuccess(summary.source);
      return direct.data;
    }
    markSourceFailure(summary.source, {
      stage: "direct-empty-stream",
      trackId: summary.trackId,
      title: summary.title,
      reason: "empty-stream-url",
    });
  } catch (error) {
    markSourceFailure(summary.source, {
      stage: "direct-error",
      trackId: summary.trackId,
      title: summary.title,
      reason: error instanceof Error ? error.message : "direct-fetch-error",
    });
    console.warn("[Music] 直接拉取音频失败，尝试回退检索", error);
  }

  try {
    const keyword = `${summary.title} ${summary.artist}`.trim();
    const fallbackSearch = await searchMusicTracks(keyword, getDiscoverySource(), 1, 24);
    const rawCandidates = fallbackSearch.data.tracks || [];
    const candidates = dedupeTracks(rawCandidates).sort((left, right) => {
      const leftTitleMatched = left.title.replace(/\s+/g, "").toLowerCase() === summary.title.replace(/\s+/g, "").toLowerCase() ? 1 : 0;
      const rightTitleMatched = right.title.replace(/\s+/g, "").toLowerCase() === summary.title.replace(/\s+/g, "").toLowerCase() ? 1 : 0;
      const leftSameSourcePenalty = left.source === summary.source ? 1 : 0;
      const rightSameSourcePenalty = right.source === summary.source ? 1 : 0;
      const leftRank = getSourceRank(left.source);
      const rightRank = getSourceRank(right.source);
      return (rightTitleMatched - leftTitleMatched) || (leftSameSourcePenalty - rightSameSourcePenalty) || (leftRank - rightRank);
    });
    if (!candidates.length) {
      return null;
    }
    for (const candidate of candidates.slice(0, 8)) {
      try {
        const fallback = await fetchMusicTrack(candidate.source, candidate.trackId);
        if (fallback.data?.streamUrl) {
          markSourceSuccess(candidate.source);
          return fallback.data;
        }
        markSourceFailure(candidate.source, {
          stage: "fallback-empty-stream",
          trackId: candidate.trackId,
          title: candidate.title,
          reason: "empty-stream-url",
        });
      } catch (error) {
        markSourceFailure(candidate.source, {
          stage: "fallback-error",
          trackId: candidate.trackId,
          title: candidate.title,
          reason: error instanceof Error ? error.message : "fallback-fetch-error",
        });
        console.warn("[Music] 候选歌曲不可播放", candidate.source, candidate.trackId, error);
      }
    }
  } catch (error) {
    console.warn("[Music] 回退检索失败", error);
  }

  return null;
}

async function handleToggleAdminSource(sourceCode: string, enabled: boolean) {
  if (sourceSavingCodes.value.includes(sourceCode)) {
    return;
  }

  sourceSavingCodes.value = [...sourceSavingCodes.value, sourceCode];
  try {
    await updateMusicAdminSource(sourceCode, enabled);
    await loadAdminSources();
    await refreshMusicAfterSourceChange();
    message(enabled ? "音源已开启" : "音源已停用", { type: "success" });
  } catch (error) {
    console.error(error);
    message("更新音源状态失败", { type: "error" });
  } finally {
    sourceSavingCodes.value = sourceSavingCodes.value.filter((item) => item !== sourceCode);
  }
}

async function refreshMusicAfterSourceChange() {
  await loadOverview();
  await loadPlaylistCategories({ syncRoute: false });
  radioTracks.value = [];
  radarTracks.value = [];
  if (activeSection.value === "search" && searchKeyword.value.trim()) {
    await performSearch(1);
    return;
  }
  if (activeSection.value === "radio") {
    await ensureRadioTracks();
  }
  if (activeSection.value === "radar") {
    await ensureRadarTracks();
  }
  await syncRouteState();
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
  if (section === "radio") {
    await ensureRadioTracks();
    await syncRouteState();
    return;
  }
  if (section === "radar") {
    await ensureRadarTracks();
    await syncRouteState();
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
    message("已取消收藏", { type: "success" });
  } else {
    favorites.value.unshift(summary);
    favorites.value = favorites.value.slice(0, 100);
    message("已加入收藏", { type: "success" });
  }
  writeLocal(FAVORITES_KEY, favorites.value);
}

async function withTimeout<T>(task: Promise<T>, timeoutMs: number, timeoutMessage: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
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

function readSettings() {
  return readLocal(SETTINGS_KEY, {
    showTrackSource: true,
  });
}

function writeSettings(value: { showTrackSource: boolean }) {
  writeLocal(SETTINGS_KEY, value);
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

  if (routeSection === "radio") {
    await ensureRadioTracks();
  }
  if (routeSection === "radar") {
    await ensureRadarTracks();
  }

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
  z-index: 5200;
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
