<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from "vue";
import { message } from "@repo/utils";
import MusicHeader from "./components/MusicHeader.vue";
import MusicSidebar from "./components/MusicSidebar.vue";
import MusicPlayer from "./components/MusicPlayer.vue";
import MusicContent from "./components/MusicContent.vue";
import MusicLyrics from "./components/MusicLyrics.vue";
import MusicPlaylistDrawer from "./components/MusicPlaylistDrawer.vue";
import { fetchMusicTypes, fetchMusicPlatforms, fetchHotKeywords, fetchMusicSearch, fetchMusicDetail, fetchRecommendPlaylists, fetchPlaylistDetail, MusicInfo, Playlist } from "./api";

// 音频元素引用
const audioRef = ref<HTMLAudioElement | null>(null);
const progressBarRef = ref<HTMLDivElement | null>(null);
const lyricsContainerRef = ref<HTMLDivElement | null>(null);

// 环境变量
const env = reactive({
  // 搜索相关
  keyword: "",
  searchResults: [] as MusicInfo[],
  searchTotal: 0,
  searchLoading: false,
  currentPage: 1,
  pageSize: 18,
  searchHistory: [] as string[],
  hotKeywords: [] as string[],

  // 筛选相关
  musicTypes: [] as any[],
  musicPlatforms: [] as any[],
  selectedType: "all",
  selectedPlatform: "all",

  // 播放相关
  currentMusic: null as MusicInfo | null,
  currentPlaylist: [] as MusicInfo[],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 80,
  isMuted: false,
  isLoop: false,
  isRandom: false,

  // 歌词相关
  parsedLyrics: [] as { time: number; text: string }[],
  currentLyricIndex: -1,
  showLyrics: false,

  // 收藏和历史
  favorites: [] as MusicInfo[],
  playHistory: [] as MusicInfo[],

  // 界面相关
  activeTab: "discover",
  showPlaylistDrawer: false,

  // 推荐歌单
  recommendPlaylists: [] as Playlist[],
  currentPlaylistDetail: null as { playlist: Playlist; songs: MusicInfo[] } | null,
});

// 计算属性：进度百分比
const progress = computed(() => {
  if (!env.duration) return 0;
  return (env.currentTime / env.duration) * 100;
});

// 计算属性：格式化当前时间
const formattedCurrentTime = computed(() => {
  return formatTime(env.currentTime);
});

// 计算属性：格式化总时长
const formattedDuration = computed(() => {
  return formatTime(env.duration);
});

// 初始化数据
const initData = async () => {
  try {
    // 获取音乐类型
    const typesRes = await fetchMusicTypes();
    if (typesRes.success) {
      env.musicTypes = typesRes.data;
    }

    // 获取音乐平台
    const platformsRes = await fetchMusicPlatforms();
    if (platformsRes.success) {
      env.musicPlatforms = platformsRes.data;
    }

    // 获取热门关键词
    const keywordsRes = await fetchHotKeywords();
    if (keywordsRes.success) {
      env.hotKeywords = keywordsRes.data;
    }

    // 获取推荐歌单
    const playlistsRes = await fetchRecommendPlaylists();
    if (playlistsRes.success) {
      env.recommendPlaylists = playlistsRes.data;
    }

    // 从本地存储加载收藏和历史记录
    const savedFavorites = localStorage.getItem("music-favorites");
    if (savedFavorites) {
      try {
        env.favorites = JSON.parse(savedFavorites);
      } catch (e) {
        console.error("解析收藏记录失败:", e);
      }
    }

    const savedHistory = localStorage.getItem("music-history");
    if (savedHistory) {
      try {
        env.playHistory = JSON.parse(savedHistory);
      } catch (e) {
        console.error("解析播放历史失败:", e);
      }
    }

    const savedSearchHistory = localStorage.getItem("music-search-history");
    if (savedSearchHistory) {
      try {
        env.searchHistory = JSON.parse(savedSearchHistory);
      } catch (e) {
        console.error("解析搜索历史失败:", e);
      }
    }
  } catch (error) {
    console.error("初始化数据失败:", error);
    message("初始化数据失败，请刷新页面重试", { type: "error" });
  }
};

// 搜索音乐
const searchMusic = async () => {
  if (!env.keyword.trim()) {
    message("请输入搜索关键词", { type: "warning" });
    return;
  }

  env.searchLoading = true;
  env.activeTab = "search";

  try {
    const res = await fetchMusicSearch({
      keyword: env.keyword,
      page: env.currentPage,
      pageSize: env.pageSize,
      type: env.selectedType,
      platform: env.selectedPlatform,
    });

    if (res.code === "00000") {
      env.searchResults = res.data.data;
      env.searchTotal = res.data.total;

      // 添加到搜索历史
      addToSearchHistory(env.keyword);
    } else {
      message("搜索失败，请稍后重试", { type: "error" });
    }
  } catch (error) {
    console.error("搜索失败:", error);
    message("搜索失败，请稍后重试", { type: "error" });
  } finally {
    env.searchLoading = false;
  }
};

// 添加到搜索历史
const addToSearchHistory = (keyword: string) => {
  // 如果已存在，先移除
  const index = env.searchHistory.indexOf(keyword);
  if (index !== -1) {
    env.searchHistory.splice(index, 1);
  }

  // 添加到最前面
  env.searchHistory.unshift(keyword);

  // 限制历史记录数量
  if (env.searchHistory.length > 10) {
    env.searchHistory = env.searchHistory.slice(0, 10);
  }

  // 保存到本地存储
  localStorage.setItem("music-search-history", JSON.stringify(env.searchHistory));
};

// 清空搜索历史
const clearSearchHistory = () => {
  env.searchHistory = [];
  localStorage.removeItem("music-search-history");
  message("搜索历史已清空", { type: "success" });
};

// 播放音乐
const playMusic = async (music: MusicInfo) => {
  if (env.currentMusic && env.currentMusic.musicId === music.musicId) {
    // 如果是当前播放的音乐，则切换播放/暂停状态
    togglePlay();
    return;
  }

  try {
    // 获取音乐详情（包含歌词等信息）
    const res = await fetchMusicDetail(music.musicId);
    if (res.success) {
      env.currentMusic = res.data;

      // 解析歌词
      if (env.currentMusic.musicLyrics) {
        parseLyrics(env.currentMusic.musicLyrics);
      } else {
        env.parsedLyrics = [];
      }

      // 重置播放状态
      env.currentTime = 0;
      env.duration = 0;
      env.currentLyricIndex = -1;

      // 添加到播放历史
      addToPlayHistory(env.currentMusic);

      // 等待DOM更新后开始播放
      nextTick(() => {
        if (audioRef.value) {
          audioRef.value.play().catch((error) => {
            console.error("播放失败:", error);
            message("播放失败，请稍后重试", { type: "error" });
          });
        }
      });
    }
  } catch (error) {
    console.error("获取音乐详情失败:", error);
    message("获取音乐详情失败，请稍后重试", { type: "error" });
  }
};

// 检查是否已收藏
const isFavorite = (music: MusicInfo) => {
  return env.favorites.some((item) => item.musicId === music.musicId);
};

// 加载歌单详情
const loadPlaylistDetail = async (playlistId: string) => {
  try {
    const res = await fetchPlaylistDetail(playlistId);
    if (res.success) {
      env.currentPlaylistDetail = res.data;
      env.activeTab = "playlist-detail";
    }
  } catch (error) {
    console.error("加载歌单详情失败:", error);
    message("加载歌单详情失败，请稍后重试", { type: "error" });
  }
};

// 播放歌单
const playPlaylist = (songs: MusicInfo[]) => {
  if (songs.length === 0) {
    message("歌单中没有歌曲", { type: "warning" });
    return;
  }

  env.currentPlaylist = [...songs];
  playMusic(songs[0]);
};

// 格式化时间
const formatTime = (seconds: number) => {
  if (isNaN(seconds) || !isFinite(seconds)) return "00:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// 切换播放/暂停
const togglePlay = () => {
  if (!audioRef.value) return;

  if (env.isPlaying) {
    audioRef.value.pause();
  } else {
    audioRef.value.play().catch((error) => {
      console.error("播放失败:", error);
      message("播放失败，请稍后重试", { type: "error" });
    });
  }
};

// 播放下一首
const playNext = () => {
  if (env.currentPlaylist.length === 0) return;

  const currentIndex = env.currentPlaylist.findIndex((item) => item.musicId === env.currentMusic?.musicId);
  let nextIndex: number;

  if (env.isRandom) {
    // 随机播放
    nextIndex = Math.floor(Math.random() * env.currentPlaylist.length);
  } else {
    // 顺序播放
    nextIndex = currentIndex + 1;
    if (nextIndex >= env.currentPlaylist.length) {
      nextIndex = 0;
    }
  }

  if (nextIndex >= 0 && nextIndex < env.currentPlaylist.length) {
    playMusic(env.currentPlaylist[nextIndex]);
  }
};

// 播放上一首
const playPrev = () => {
  if (env.currentPlaylist.length === 0) return;

  const currentIndex = env.currentPlaylist.findIndex((item) => item.musicId === env.currentMusic?.musicId);
  let prevIndex: number;

  if (env.isRandom) {
    // 随机播放
    prevIndex = Math.floor(Math.random() * env.currentPlaylist.length);
  } else {
    // 顺序播放
    prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = env.currentPlaylist.length - 1;
    }
  }

  if (prevIndex >= 0 && prevIndex < env.currentPlaylist.length) {
    playMusic(env.currentPlaylist[prevIndex]);
  }
};

// 切换随机播放
const toggleRandom = () => {
  env.isRandom = !env.isRandom;
  message(env.isRandom ? "已开启随机播放" : "已关闭随机播放", { type: "success" });
};

// 切换循环播放
const toggleLoop = () => {
  env.isLoop = !env.isLoop;
  message(env.isLoop ? "已开启单曲循环" : "已关闭单曲循环", { type: "success" });
};

// 切换静音
const toggleMute = () => {
  if (!audioRef.value) return;
  env.isMuted = !env.isMuted;
  audioRef.value.muted = env.isMuted;
};

// 调整音量
const adjustVolume = () => {
  if (!audioRef.value) return;
  audioRef.value.volume = env.volume / 100;
  audioRef.value.muted = env.isMuted;
};

// 跳转到指定时间
const seekTo = (time: number) => {
  if (!audioRef.value) return;
  audioRef.value.currentTime = time;
  env.currentTime = time;
};

// 切换收藏状态
const toggleFavorite = (music: MusicInfo) => {
  const index = env.favorites.findIndex((item) => item.musicId === music.musicId);
  if (index !== -1) {
    env.favorites.splice(index, 1);
    message("已取消收藏", { type: "success" });
  } else {
    env.favorites.push(music);
    message("已添加收藏", { type: "success" });
  }
  localStorage.setItem("music-favorites", JSON.stringify(env.favorites));
};

// 解析歌词
const parseLyrics = (lyrics: string) => {
  if (!lyrics) {
    env.parsedLyrics = [];
    return;
  }

  const lines = lyrics.split("\n");
  const parsed: { time: number; text: string }[] = [];

  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, "0"), 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = match[4].trim();
      if (text) {
        parsed.push({ time, text });
      }
    }
  }

  env.parsedLyrics = parsed;
};

// 更新当前歌词索引
const updateCurrentLyric = () => {
  if (env.parsedLyrics.length === 0) {
    env.currentLyricIndex = -1;
    return;
  }

  for (let i = env.parsedLyrics.length - 1; i >= 0; i--) {
    if (env.currentTime >= env.parsedLyrics[i].time) {
      env.currentLyricIndex = i;
      return;
    }
  }
  env.currentLyricIndex = -1;
};

// 添加到播放历史
const addToPlayHistory = (music: MusicInfo) => {
  // 如果已存在，先移除
  const index = env.playHistory.findIndex((item) => item.musicId === music.musicId);
  if (index !== -1) {
    env.playHistory.splice(index, 1);
  }

  // 添加到最前面
  env.playHistory.unshift(music);

  // 限制历史记录数量
  if (env.playHistory.length > 100) {
    env.playHistory = env.playHistory.slice(0, 100);
  }

  // 保存到本地存储
  localStorage.setItem("music-history", JSON.stringify(env.playHistory));
};

// 监听音频事件
const setupAudioListeners = () => {
  if (!audioRef.value) return;

  // 时间更新
  audioRef.value.addEventListener("timeupdate", () => {
    if (audioRef.value) {
      env.currentTime = audioRef.value.currentTime;
      updateCurrentLyric();
    }
  });

  // 加载元数据
  audioRef.value.addEventListener("loadedmetadata", () => {
    if (audioRef.value) {
      env.duration = audioRef.value.duration;
    }
  });

  // 播放结束
  audioRef.value.addEventListener("ended", () => {
    if (env.isLoop) {
      // 单曲循环，重新播放当前歌曲
      if (audioRef.value) {
        audioRef.value.currentTime = 0;
        audioRef.value.play();
      }
    } else {
      // 播放下一首
      playNext();
    }
  });

  // 播放状态变化
  audioRef.value.addEventListener("play", () => {
    env.isPlaying = true;
  });

  audioRef.value.addEventListener("pause", () => {
    env.isPlaying = false;
  });
};

// 监听音频元素引用变化
watch(audioRef, (newVal) => {
  if (newVal) {
    setupAudioListeners();
    // 设置初始音量
    newVal.volume = env.volume / 100;
  }
});

// 监听音量变化
watch(
  () => env.volume,
  () => {
    adjustVolume();
  }
);

// 监听页面变化
watch(
  () => env.currentPage,
  () => {
    if (env.keyword) {
      searchMusic();
    }
  }
);

// 监听筛选条件变化
watch([() => env.selectedType, () => env.selectedPlatform], () => {
  if (env.keyword) {
    env.currentPage = 1;
    searchMusic();
  }
});

// 组件挂载时初始化数据
onMounted(() => {
  initData();
});

// 暴露给子组件的方法和数据
const musicPlayerProps = {
  env,
  audioRef,
  progressBarRef,
  lyricsContainerRef,
  searchMusic,
  clearSearchHistory,
  playMusic,
  togglePlay,
  playNext,
  playPrev,
  toggleRandom,
  toggleLoop,
  toggleMute,
  adjustVolume,
  seekTo,
  toggleFavorite,
  isFavorite,
  loadPlaylistDetail,
  playPlaylist,
  formatTime,
  progress,
  formattedCurrentTime,
  formattedDuration,
};
</script>

<template>
  <div class="music-player system-container modern-bg">
    <!-- 音频元素 -->
    <audio ref="audioRef" :src="env.currentMusic?.url" preload="auto" hidden></audio>

    <!-- 头部搜索区域 -->
    <MusicHeader :env="env" :searchMusic="searchMusic" :clearSearchHistory="clearSearchHistory" />

    <!-- 主内容区 -->
    <div class="music-player__main">
      <!-- 左侧导航和播放列表 -->
      <MusicSidebar :env="env" :playMusic="playMusic" :formatTime="formatTime" />

      <!-- 内容区 -->
      <MusicContent v-bind="musicPlayerProps" />
    </div>

    <!-- 播放器控制栏 -->
    <MusicPlayer v-bind="musicPlayerProps" />

    <!-- 歌词抽屉 -->
    <MusicLyrics v-if="env.showLyrics" :env="env" :lyricsContainerRef="lyricsContainerRef" />

    <!-- 播放列表抽屉 -->
    <MusicPlaylistDrawer v-if="env.showPlaylistDrawer" :env="env" :playMusic="playMusic" :formatTime="formatTime" :isFavorite="isFavorite" :toggleFavorite="toggleFavorite" />
  </div>
</template>

<style lang="scss" scoped>
.music-player {
  display: flex;
  flex-direction: column;
  min-height: 640px;
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  background: var(--card-bg);
  color: var(--app-text-primary);
  box-shadow: var(--card-shadow);
  padding: 12px;
  gap: 12px;

  &__main {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
}
</style>
