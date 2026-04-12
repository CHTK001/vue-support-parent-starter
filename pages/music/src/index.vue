<template>
  <div class="music-shell system-container">
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

    <MusicSidebar
      :sources="sources"
      :active-source="activeSource"
      :nav-items="navItems"
      :active-section="activeSection"
      :hot-keywords="hotKeywords"
      @switch-source="switchSource"
      @change-section="activeSection = $event"
      @search-tag="searchByTag"
    />

    <MusicContent
      v-model:search-keyword="searchKeyword"
      :loading="isOverviewLoading || isPlaylistLoading || isSearchLoading"
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
      :favorites="favorites"
      :history="history"
      @search="performSearch()"
      @change-search-tab="changeSearchTab"
      @back-playlist="selectedPlaylist = null"
      @open-playlist="openPlaylist"
      @play-track="playTrackFromSummary"
      @change-search-page="changeSearchPage"
    />

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
      @prev="playPrev"
      @toggle="togglePlayback"
      @next="playNext"
      @toggle-favorite="toggleFavorite(currentTrack)"
      @seek="seekTo"
      @update-volume="handleVolumeChange"
      @play-track="playTrackFromSummary"
    />
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import {
  fetchMusicOverview,
  fetchMusicPlaylist,
  fetchMusicTrack,
  searchMusicPlaylists,
  searchMusicTracks,
} from "./api";
import MusicContent from "./components/MusicContent.vue";
import MusicPlayerPanel from "./components/MusicPlayerPanel.vue";
import MusicSidebar from "./components/MusicSidebar.vue";
import type {
  MusicNavItem,
  MusicOverview,
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

const navItems: MusicNavItem[] = [
  { code: "discover", label: "发现", hint: "精选歌单与入口" },
  { code: "search", label: "搜索", hint: "按关键词找歌" },
  { code: "favorites", label: "收藏", hint: "本地收藏列表" },
  { code: "history", label: "历史", hint: "最近播放记录" },
];

const audioRef = ref<HTMLAudioElement>();
const sources = ref<MusicSourceOption[]>([]);
const activeSource = ref("demo");
const activeSection = ref<MusicSection>("discover");
const hotKeywords = ref<string[]>([]);
const featuredPlaylists = ref<MusicPlaylistSummary[]>([]);
const searchKeyword = ref("");
const searchTab = ref<MusicSearchTab>("tracks");
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
const currentTime = ref(0);
const duration = ref(0);
const sliderValue = ref(0);
const volume = ref(72);
const favorites = ref<MusicTrackSummary[]>(readLocal(FAVORITES_KEY, []));
const history = ref<MusicTrackSummary[]>(readLocal(HISTORY_KEY, []));

const currentTrackKey = computed(() => {
  return currentTrack.value ? trackKey(currentTrack.value) : "";
});

const activeSourceLabel = computed(() => {
  return sources.value.find((item) => item.code === activeSource.value)?.name || "Music Source";
});

const heroTitle = computed(() => {
  if (selectedPlaylist.value) return selectedPlaylist.value.title;
  if (activeSection.value === "search") return "搜索与即点即播";
  if (activeSection.value === "favorites") return "收藏清单";
  if (activeSection.value === "history") return "最近播放";
  return "发现与播放";
});

const heroDescription = computed(() => {
  if (selectedPlaylist.value) return selectedPlaylist.value.description;
  if (activeSection.value === "search") {
    return "原 CeruMusic 的 IPC 搜索链路已替换成标准 HTTP 查询。";
  }
  if (activeSection.value === "favorites") {
    return "收藏和历史先落浏览器本地，后续再接服务端同步。";
  }
  if (activeSection.value === "history") {
    return "当前先保障 Web 播放器闭环，桌面专属能力后置。";
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

watch(volume, () => updateVolume());

onMounted(async () => {
  await loadOverview();
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

async function switchSource(source: string) {
  if (activeSource.value === source) return;
  activeSource.value = source;
  activeSection.value = "discover";
  searchKeyword.value = "";
  searchTab.value = "tracks";
  searchResults.value = [];
  playlistResults.value = [];
  searchTotal.value = 0;
  playlistTotal.value = 0;
  searchPage.value = 1;
  playlistPage.value = 1;
  await loadOverview();
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
    if (searchTab.value === "tracks") {
      searchPage.value = page;
      const response = await searchMusicTracks(
        keyword,
        activeSource.value,
        searchPage.value,
        searchPageSize,
      );
      searchResults.value = response.data.tracks || [];
      searchTotal.value = response.data.total || 0;
      queue.value = [...searchResults.value];
    } else {
      playlistPage.value = page;
      const response = await searchMusicPlaylists(
        keyword,
        activeSource.value,
        playlistPage.value,
        playlistPageSize,
      );
      playlistResults.value = response.data.playlists || [];
      playlistTotal.value = response.data.total || 0;
    }
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
  }
}

async function openPlaylist(playlist: MusicPlaylistSummary) {
  isPlaylistLoading.value = true;
  try {
    const response = await fetchMusicPlaylist(playlist.source, playlist.playlistId);
    selectedPlaylist.value = response.data;
    queue.value = [...response.data.tracks];
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
    togglePlayback();
    return;
  }

  isTrackLoading.value = true;
  try {
    const response = await fetchMusicTrack(summary.source, summary.trackId);
    currentTrack.value = response.data;
    queue.value = [...nextQueue];
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
  audioRef.value.currentTime = value;
  currentTime.value = value;
}

function updateVolume() {
  if (!audioRef.value) return;
  audioRef.value.volume = Math.max(0, Math.min(1, volume.value / 100));
}

function handleVolumeChange(value: number) {
  volume.value = value;
}

function playNext() {
  if (!currentTrack.value || !queue.value.length) return;
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

function searchByTag(tag: string) {
  searchKeyword.value = tag;
  void performSearch();
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
</script>

<style scoped lang="scss">
.music-shell {
  min-height: calc(100vh - 84px);
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 340px;
  gap: 18px;
  padding: 20px;
  background:
    radial-gradient(circle at top left, rgba(188, 127, 79, 0.16), transparent 26%),
    radial-gradient(circle at bottom right, rgba(47, 93, 115, 0.18), transparent 28%),
    linear-gradient(180deg, #f8f4ea 0%, #ebe4d4 100%);
  color: #14202a;
  font-family: "Avenir Next", "PingFang SC", "Noto Serif SC", serif;
}

.music-shell audio {
  display: none;
}

@media (max-width: 1320px) {
  .music-shell {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  .music-shell :deep(.detail-panel) {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .music-shell {
    grid-template-columns: 1fr;
  }

  .music-shell :deep(.detail-panel) {
    grid-template-columns: 1fr;
  }
}
</style>
