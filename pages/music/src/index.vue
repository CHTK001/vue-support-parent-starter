<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
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
    ElMessage.error("初始化数据失败，请刷新页面重试");
  }
};

// 搜索音乐
const searchMusic = async () => {
  if (!env.keyword.trim()) {
    ElMessage.warning("请输入搜索关键词");
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
      ElMessage.error("搜索失败，请稍后重试");
    }
  } catch (error) {
    console.error("搜索失败:", error);
    ElMessage.error("搜索失败，请稍后重试");
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
  ElMessage.success("搜索历史已清空");
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
            ElMessage.error("播放失败，请稍后重试");
          });
        }
      });
    }
  } catch (error) {
    console.error("获取音乐详情失败:", error);
    ElMessage.error("获取音乐详情失败，请稍后重试");
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
    ElMessage.error("加载歌单详情失败，请稍后重试");
  }
};

// 播放歌单
const playPlaylist = (songs: MusicInfo[]) => {
  if (songs.length === 0) {
    ElMessage.warning("歌单中没有歌曲");
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
  <div class="music-player">
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
  height: 100%;
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);

  &__main {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
}
</style>
