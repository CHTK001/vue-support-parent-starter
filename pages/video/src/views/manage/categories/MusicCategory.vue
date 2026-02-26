<template>
  <div class="music-category">
    <div class="music-category__container">
      <div class="music-category__header">
        <h2 class="music-category__title">音乐播放器</h2>
        <el-button type="primary" plain size="small" @click="navigateToAll">查看全部</el-button>
      </div>

      <!-- 音乐播放器控制面板 -->
      <div class="music-player" v-if="currentMusic">
        <div class="music-player__bg-gradient"></div>
        <div class="music-player__content">
          <div class="music-player__now-playing">
            <div class="music-player__now-playing-cover">
              <img :src="currentMusic.musicCover" :alt="currentMusic.musicTitle" />
              <div class="music-player__now-playing-disc" :class="{ 'is-playing': isPlaying }"></div>
            </div>
            <div class="music-player__now-playing-info">
              <div class="music-player__now-playing-title">{{ currentMusic.musicTitle }}</div>
              <div class="music-player__now-playing-artist">{{ currentMusic.musicArtist }}</div>
            </div>
          </div>

          <div class="music-player__control-center">
            <div class="music-player__progress-container">
              <span class="music-player__time">{{ formattedCurrentTime }}</span>
              <div class="music-player__progress-bar" ref="progressBarRef" @click="seekTo">
                <div class="music-player__progress-current" :style="{ width: `${progress}%` }"></div>
                <div class="music-player__progress-handle" :style="{ left: `${progress}%` }"></div>
              </div>
              <span class="music-player__time">{{ formattedDuration }}</span>
            </div>

            <div class="music-player__control-buttons">
              <el-button circle @click="toggleRandom" class="music-player__control-btn">
                <IconifyIconOnline :icon="isRandom ? 'ri:shuffle-fill' : 'ri:shuffle-line'" :style="{ color: isRandom ? 'var(--el-color-primary)' : '' }" />
              </el-button>
              <el-button circle @click="playPrev" class="music-player__control-btn">
                <IconifyIconOnline icon="ri:skip-back-fill" />
              </el-button>
              <el-button circle size="large" @click="togglePlay" class="music-player__control-btn music-player__control-btn--play">
                <IconifyIconOnline :icon="isPlaying ? 'ri:pause-fill' : 'ri:play-fill'" />
              </el-button>
              <el-button circle @click="playNext" class="music-player__control-btn">
                <IconifyIconOnline icon="ri:skip-forward-fill" />
              </el-button>
              <el-button circle @click="toggleLoop" class="music-player__control-btn">
                <IconifyIconOnline :icon="isLoop ? 'ri:repeat-one-fill' : 'ri:repeat-line'" :style="{ color: isLoop ? 'var(--el-color-primary)' : '' }" />
              </el-button>
            </div>
          </div>

          <div class="music-player__control-right">
            <el-button circle @click="toggleMute" class="music-player__control-btn">
              <IconifyIconOnline :icon="isMuted ? 'ri:volume-mute-fill' : volume > 50 ? 'ri:volume-up-fill' : 'ri:volume-down-fill'" />
            </el-button>
            <ScSlider v-model="volume" :disabled="isMuted" @input="adjustVolume" class="music-player__volume-slider" />
            <el-button circle @click="showLyrics = !showLyrics" class="music-player__control-btn" :class="{ 'is-active': showLyrics }">
              <IconifyIconOnline icon="ri:file-list-line" />
            </el-button>
            <el-button circle @click="showPlaylistDrawer = !showPlaylistDrawer" class="music-player__control-btn" :class="{ 'is-active': showPlaylistDrawer }">
              <IconifyIconOnline icon="ri:list-check" />
            </el-button>
          </div>
        </div>
      </div>

      <!-- 歌词显示区域 -->
      <div class="music-lyrics" v-if="showLyrics && currentMusic && currentMusic.musicLyrics">
        <div class="music-lyrics__container">
          <div class="music-lyrics__header">
            <div class="music-lyrics__title">歌词</div>
            <el-button type="text" @click="showLyrics = false" class="music-lyrics__close">
              <IconifyIconOnline icon="ri:close-line" />
            </el-button>
          </div>
          <div class="music-lyrics__content">
            <p v-for="(line, index) in parsedLyrics" :key="index" :class="{ active: currentLyricIndex === index }">
              {{ line.text }}
            </p>
          </div>
        </div>
      </div>

      <!-- 音乐列表 -->
      <div class="music-category__section">
        <div class="music-category__header">
          <h2 class="music-category__title">热门歌曲</h2>
          <el-button type="primary" plain size="small" @click="navigateToPopular">查看全部</el-button>
        </div>

        <div class="music-category__list">
          <div v-for="(music, index) in musicList" :key="music.musicId" class="music-category__item" :class="{ active: currentMusic && currentMusic.musicId === music.musicId }" @click="playMusic(index)">
            <div class="music-category__item-index" :class="{ 'is-playing': currentMusic && currentMusic.musicId === music.musicId && isPlaying }">
              <span class="music-category__item-number">{{ index + 1 }}</span>
              <IconifyIconOnline icon="ri:volume-up-fill" class="music-category__item-playing-icon" />
            </div>
            <div class="music-category__item-cover">
              <img :src="music.musicCover" :alt="music.musicTitle" />
              <div class="music-category__item-play-icon" :class="{ 'is-playing': currentMusic && currentMusic.musicId === music.musicId && isPlaying }">
                <IconifyIconOnline :icon="currentMusic && currentMusic.musicId === music.musicId && isPlaying ? 'ri:pause-fill' : 'ri:play-fill'" />
              </div>
            </div>
            <div class="music-category__item-info">
              <div class="music-category__item-title">{{ music.musicTitle }}</div>
              <div class="music-category__item-artist">{{ music.musicArtist }}</div>
            </div>
            <div class="music-category__item-duration">{{ formatDuration(music.musicDuration) }}</div>
            <div class="music-category__item-actions">
              <el-button circle size="small" class="music-category__item-action-btn">
                <IconifyIconOnline icon="ri:heart-line" />
              </el-button>
              <el-button circle size="small" class="music-category__item-action-btn">
                <IconifyIconOnline icon="ri:download-line" />
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 播放列表抽屉 -->
      <sc-drawer v-model="showPlaylistDrawer" title="播放列表" direction="rtl" size="350px" custom-class="music-playlist-drawer">
        <template #header>
          <div class="music-playlist__header">
            <div class="music-playlist__title">播放列表 ({{ musicList.length }})</div>
            <div class="music-playlist__actions">
              <el-button type="text" size="small"> <IconifyIconOnline icon="ri:add-line" /> 添加歌曲 </el-button>
              <el-button type="text" size="small"> <IconifyIconOnline icon="ri:delete-bin-line" /> 清空 </el-button>
            </div>
          </div>
        </template>
        <div class="music-playlist">
          <div v-for="(music, index) in musicList" :key="music.musicId" class="music-playlist__item" :class="{ active: currentMusic && currentMusic.musicId === music.musicId }" @click="playMusic(index)">
            <div class="music-playlist__item-index" :class="{ 'is-playing': currentMusic && currentMusic.musicId === music.musicId && isPlaying }">
              <span class="music-playlist__item-number">{{ index + 1 }}</span>
              <IconifyIconOnline icon="ri:volume-up-fill" class="music-playlist__item-playing-icon" />
            </div>
            <div class="music-playlist__item-info">
              <div class="music-playlist__item-title">{{ music.musicTitle }}</div>
              <div class="music-playlist__item-artist">{{ music.musicArtist }}</div>
            </div>
            <div class="music-playlist__item-duration">{{ formatDuration(music.musicDuration) }}</div>
            <div class="music-playlist__item-actions">
              <el-button circle size="small" class="music-playlist__item-action-btn">
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </div>
          </div>
        </div>
      </sc-drawer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { ScSlider } from "@repo/components";

// 音乐信息接口
interface MusicInfo {
  musicId: string;
  musicTitle: string;
  musicArtist: string;
  musicAlbum: string;
  musicCover: string;
  musicUrl: string;
  musicLyrics?: string;
  musicDuration: number;
  musicType: string;
  musicPlatform: string;
}

// 歌词行接口
interface LyricLine {
  time: number;
  text: string;
}

const router = useRouter();
const musicList = ref<MusicInfo[]>([]);
const currentIndex = ref(0);
const currentMusic = ref<MusicInfo | null>(null);
const audioRef = ref<HTMLAudioElement | null>(null);
const progressBarRef = ref<HTMLElement | null>(null);
const isPlaying = ref(false);
const isMuted = ref(false);
const isRandom = ref(false);
const isLoop = ref(false);
const volume = ref(50);
const currentTime = ref(0);
const duration = ref(0);
const showLyrics = ref(false);
const showPlaylistDrawer = ref(false);
const parsedLyrics = ref<LyricLine[]>([]);
const currentLyricIndex = ref(-1);

// 模拟音乐数据
const mockMusicList: MusicInfo[] = [
  {
    musicId: "1",
    musicTitle: "稻香",
    musicArtist: "周杰伦",
    musicAlbum: "魔杰座",
    musicCover: "https://p2.music.126.net/hhM1n_dLTErQ5G5lWv4rZQ==/109951167805892228.jpg",
    musicUrl: "https://music.163.com/song/media/outer/url?id=185809.mp3",
    musicLyrics:
      "[00:00.000] 作词 : 周杰伦\n[00:01.000] 作曲 : 周杰伦\n[00:02.000] 编曲 : 黄雨勋\n[00:03.000] 制作人 : 周杰伦\n[00:27.410]对这个世界如果你有太多的抱怨\n[00:30.380]跌倒了就不敢继续往前走\n[00:33.670]为什么人要这么的脆弱堕落\n[00:39.660]请你打开电视看看\n[00:42.660]多少人为生命在努力勇敢的走下去\n[00:46.360]我们是不是该知足\n[00:49.660]珍惜一切就算没有拥有\n[00:54.880]还记得你说家是唯一的城堡\n[00:58.650]随着稻香河流继续奔跑\n[01:01.880]微微笑小时候的梦我知道\n[01:08.150]不要哭让萤火虫带着你逃跑\n[01:11.880]乡间的歌谣永远的依靠\n[01:15.150]回家吧回到最初的美好",
    musicDuration: 238,
    musicType: "pop",
    musicPlatform: "netease",
  },
  {
    musicId: "2",
    musicTitle: "晴天",
    musicArtist: "周杰伦",
    musicAlbum: "叶惠美",
    musicCover: "https://p1.music.126.net/cUTk0ewrQtYGP2YpPZoUng==/3265549553028224.jpg",
    musicUrl: "https://music.163.com/song/media/outer/url?id=186016.mp3",
    musicLyrics:
      "[00:00.000] 作词 : 周杰伦\n[00:01.000] 作曲 : 周杰伦\n[00:28.636]故事的小黄花\n[00:32.380]从出生那年就飘着\n[00:35.897]童年的荡秋千\n[00:39.380]随记忆一直晃到现在\n[00:42.897]ㄖㄨㄟ ㄙㄡ ㄙㄡ ㄒ一 ㄉㄡ ㄒ一ㄌㄚ\n[00:46.880]ㄙㄡ ㄌㄚ ㄒ一 ㄒ一 ㄒ一 ㄒ一 ㄌㄚ ㄒ一 ㄌㄚ ㄙㄡ\n[00:50.397]吹着前奏望着天空\n[00:53.880]我想起花瓣试着掉落\n[00:57.397]为你翘课的那一天\n[01:00.880]花落的那一天\n[01:04.397]教室的那一间\n[01:07.880]我怎么看不见\n[01:11.397]消失的下雨天\n[01:14.880]我好想再淋一遍",
    musicDuration: 269,
    musicType: "pop",
    musicPlatform: "netease",
  },
  {
    musicId: "3",
    musicTitle: "七里香",
    musicArtist: "周杰伦",
    musicAlbum: "七里香",
    musicCover: "https://p1.music.126.net/9ajCyv1uxj_C3Yyv7eC39g==/109951167533469373.jpg",
    musicUrl: "https://music.163.com/song/media/outer/url?id=186001.mp3",
    musicDuration: 210,
    musicType: "pop",
    musicPlatform: "netease",
  },
  {
    musicId: "4",
    musicTitle: "可惜没如果",
    musicArtist: "林俊杰",
    musicAlbum: "新地球",
    musicCover: "https://p2.music.126.net/X0EDfXzxMQJiQ-71JFGdZw==/3238061746556733.jpg",
    musicUrl: "https://music.163.com/song/media/outer/url?id=29814898.mp3",
    musicDuration: 261,
    musicType: "pop",
    musicPlatform: "netease",
  },
  {
    musicId: "5",
    musicTitle: "那些你很冒险的梦",
    musicArtist: "林俊杰",
    musicAlbum: "学不会",
    musicCover: "https://p1.music.126.net/qkbZpB3-d1SkQEfbV1TV5g==/109951163187405670.jpg",
    musicUrl: "https://music.163.com/song/media/outer/url?id=108478.mp3",
    musicDuration: 249,
    musicType: "pop",
    musicPlatform: "netease",
  },
  {
    musicId: "6",
    musicTitle: "不能说的秘密",
    musicArtist: "周杰伦",
    musicAlbum: "不能说的秘密 电影原声带",
    musicCover: "https://p1.music.126.net/R6pCjd9qmH4LQm1idWOZig==/109951163168782834.jpg",
    musicUrl: "https://music.163.com/song/media/outer/url?id=185815.mp3",
    musicDuration: 301,
    musicType: "pop",
    musicPlatform: "netease",
  },
];

// 计算属性：进度百分比
const progress = computed(() => {
  if (duration.value <= 0) return 0;
  return (currentTime.value / duration.value) * 100;
});

// 计算属性：格式化当前时间
const formattedCurrentTime = computed(() => {
  return formatDuration(currentTime.value);
});

// 计算属性：格式化总时长
const formattedDuration = computed(() => {
  return formatDuration(duration.value);
});

// 格式化时间函数
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// 解析歌词
const parseLyrics = (lyrics: string) => {
  if (!lyrics) return [];

  const lines = lyrics.split("\n");
  const result: LyricLine[] = [];

  lines.forEach((line) => {
    const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/);
    if (match) {
      const mins = parseInt(match[1]);
      const secs = parseInt(match[2]);
      const time = mins * 60 + secs;
      const text = match[4].trim();
      result.push({ time, text });
    }
  });

  return result;
};

// 更新当前歌词索引
const updateCurrentLyricIndex = () => {
  if (!parsedLyrics.value.length) return;

  for (let i = parsedLyrics.value.length - 1; i >= 0; i--) {
    if (currentTime.value >= parsedLyrics.value[i].time) {
      currentLyricIndex.value = i;
      return;
    }
  }

  currentLyricIndex.value = -1;
};

// 初始化音频元素
const initAudio = () => {
  audioRef.value = new Audio();

  // 设置音量
  audioRef.value.volume = volume.value / 100;

  // 监听事件
  audioRef.value.addEventListener("timeupdate", () => {
    if (audioRef.value) {
      currentTime.value = audioRef.value.currentTime;
      updateCurrentLyricIndex();
    }
  });

  audioRef.value.addEventListener("loadedmetadata", () => {
    if (audioRef.value) {
      duration.value = audioRef.value.duration;
    }
  });

  audioRef.value.addEventListener("ended", () => {
    if (isLoop.value) {
      // 单曲循环
      if (audioRef.value) {
        audioRef.value.currentTime = 0;
        audioRef.value.play();
      }
    } else {
      // 播放下一首
      playNext();
    }
  });
};

// 播放音乐
const playMusic = (index: number) => {
  if (index < 0 || index >= musicList.value.length) return;

  currentIndex.value = index;
  currentMusic.value = musicList.value[index];

  if (audioRef.value) {
    audioRef.value.src = currentMusic.value.musicUrl;
    audioRef.value.load();
    audioRef.value
      .play()
      .then(() => {
        isPlaying.value = true;
      })
      .catch((error) => {
        console.error("播放失败:", error);
        isPlaying.value = false;
      });

    // 解析歌词
    if (currentMusic.value.musicLyrics) {
      parsedLyrics.value = parseLyrics(currentMusic.value.musicLyrics);
    } else {
      parsedLyrics.value = [];
    }
  }
};

// 切换播放/暂停
const togglePlay = () => {
  if (!audioRef.value || !currentMusic.value) return;

  if (isPlaying.value) {
    audioRef.value.pause();
    isPlaying.value = false;
  } else {
    audioRef.value
      .play()
      .then(() => {
        isPlaying.value = true;
      })
      .catch((error) => {
        console.error("播放失败:", error);
      });
  }
};

// 播放下一首
const playNext = () => {
  if (!musicList.value.length) return;

  let nextIndex;
  if (isRandom.value) {
    // 随机播放
    nextIndex = Math.floor(Math.random() * musicList.value.length);
  } else {
    // 顺序播放
    nextIndex = (currentIndex.value + 1) % musicList.value.length;
  }

  playMusic(nextIndex);
};

// 播放上一首
const playPrev = () => {
  if (!musicList.value.length) return;

  let prevIndex;
  if (isRandom.value) {
    // 随机播放
    prevIndex = Math.floor(Math.random() * musicList.value.length);
  } else {
    // 顺序播放
    prevIndex = (currentIndex.value - 1 + musicList.value.length) % musicList.value.length;
  }

  playMusic(prevIndex);
};

// 切换随机播放
const toggleRandom = () => {
  isRandom.value = !isRandom.value;
};

// 切换单曲循环
const toggleLoop = () => {
  isLoop.value = !isLoop.value;
};

// 切换静音
const toggleMute = () => {
  if (!audioRef.value) return;

  isMuted.value = !isMuted.value;
  audioRef.value.muted = isMuted.value;
};

// 调整音量
const adjustVolume = () => {
  if (!audioRef.value) return;

  audioRef.value.volume = volume.value / 100;
  if (volume.value > 0 && isMuted.value) {
    isMuted.value = false;
    audioRef.value.muted = false;
  }
};

// 跳转到指定位置
const seekTo = (event: MouseEvent) => {
  if (!audioRef.value || !progressBarRef.value) return;

  const rect = progressBarRef.value.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const percentage = offsetX / rect.width;
  const seekTime = percentage * duration.value;

  audioRef.value.currentTime = seekTime;
  currentTime.value = seekTime;
};

// 导航到全部音乐
const navigateToAll = () => {
  router.push({
    path: "/video/search",
    query: {
      type: "music",
    },
  });
};

// 导航到热门音乐
const navigateToPopular = () => {
  router.push({
    path: "/video/search",
    query: {
      type: "music",
      sortBy: "popular",
    },
  });
};

// 初始化
onMounted(() => {
  // 初始化音频元素
  initAudio();

  // 加载音乐列表
  musicList.value = mockMusicList;

  // 默认播放第一首
  if (musicList.value.length > 0) {
    playMusic(0);
  }
});

// 组件销毁前清理
onBeforeUnmount(() => {
  if (audioRef.value) {
    audioRef.value.pause();
    audioRef.value.src = "";
    audioRef.value.removeEventListener("timeupdate", () => {});
    audioRef.value.removeEventListener("loadedmetadata", () => {});
    audioRef.value.removeEventListener("ended", () => {});
  }
});
</script>

<style lang="scss" scoped>
.music-category {
  &__container {
    margin-bottom: 24px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    position: relative;
    margin: 0;

    &::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: -6px;
      width: 40px;
      height: 3px;
      background-color: var(--el-color-primary);
      border-radius: 3px;
    }
  }

  &__section {
    margin-top: 40px;
  }

  &__list {
    background-color: var(--el-bg-color-overlay);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  &__item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    transition: all 0.3s;
    cursor: pointer;
    border-bottom: 1px solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: #f5f7fa;

      .music-category__item-play-icon {
        opacity: 1;
        transform: scale(1);
      }

      .music-category__item-actions {
        opacity: 1;
      }
    }

    &.active {
      background-color: #ecf5ff;

      .music-category__item-title {
        color: var(--el-color-primary);
      }
    }
  }

  &__item-index {
    width: 30px;
    text-align: center;
    font-size: 14px;
     color: var(--el-text-color-primary);
    position: relative;

    .music-category__item-number {
      transition: opacity 0.3s;
    }

    .music-category__item-playing-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: var(--el-color-primary);
      opacity: 0;
      font-size: 16px;
    }

    &.is-playing {
      .music-category__item-number {
        opacity: 0;
      }

      .music-category__item-playing-icon {
        opacity: 1;
        animation: musicIconPulse 1.5s infinite;
      }
    }
  }

  &__item-cover {
    position: relative;
    width: 50px;
    height: 50px;
    margin-right: 16px;
    border-radius: 6px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }

    &:hover img {
      transform: scale(1.05);
    }
  }

  &__item-play-icon {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
    color: var(--el-text-color-primary);
    opacity: 0;
    transform: scale(0.8);
    transition: all 0.3s;

    &.is-playing {
      opacity: 1;
      transform: scale(1);
      background-color: rgba(0, 0, 0, 0.6);
    }

    .el-icon {
      font-size: 24px;
    }
  }

  &__item-info {
    flex: 1;
    min-width: 0;
  }

  &__item-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.3s;
  }

  &__item-artist {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item-duration {
    font-size: 14px;
     color: var(--el-text-color-primary);
    margin-left: 16px;
    margin-right: 16px;
  }

  &__item-actions {
    display: flex;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.3s;
  }

  &__item-action-btn {
    padding: 6px;
    height: auto;
    width: auto;
     color: var(--el-text-color-primary);

    &:hover {
      color: var(--el-color-primary);
    }
  }
}

.music-player {
  position: relative;
  background-color: var(--el-bg-color-overlay);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;

  &__bg-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(66, 99, 235, 0.05) 0%, rgba(147, 77, 255, 0.05) 100%);
    z-index: 0;
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__now-playing {
    display: flex;
    align-items: center;
  }

  &__now-playing-cover {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 20px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 50%;
      box-shadow: inset 0 0 0 4px rgba(255, 255, 255, 0.2);
    }
  }

  &__now-playing-disc {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    background-color: #fff;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;

    &.is-playing {
      animation: discRotate 8s linear infinite;
    }
  }

  &__now-playing-info {
    flex: 1;
    min-width: 0;
  }

  &__now-playing-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__now-playing-artist {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__control-center {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__progress-container {
    display: flex;
    align-items: center;
    width: 100%;
  }

  &__time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    width: 40px;
    text-align: center;
  }

  &__progress-bar {
    flex: 1;
    height: 4px;
    background-color: rgba(228, 231, 237, 0.6);
    border-radius: 2px;
    margin: 0 8px;
    cursor: pointer;
    position: relative;

    &:hover {
      .music-player__progress-handle {
        transform: scale(1);
      }
    }
  }

  &__progress-current {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: linear-gradient(90deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    border-radius: 2px;
  }

  &__progress-handle {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    background-color: var(--el-bg-color-overlay);
    border: 2px solid var(--el-color-primary);
    border-radius: 50%;
    transform: scale(0);
    transition: transform 0.2s;
    margin-left: -6px;
    margin-top: -6px;
  }

  &__control-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin: 10px 0;
  }

  &__control-btn {
    transition: all 0.3s;

    &:hover {
      transform: scale(1.1);
      color: var(--el-color-primary);
    }

    &--play {
      background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
      color: var(--el-text-color-primary);
      transform: scale(1.2);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);

      &:hover {
        transform: scale(1.3);
        color: var(--el-text-color-primary);
      }
    }

    &.is-active {
      color: var(--el-color-primary);
    }
  }

  &__control-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }

  &__volume-slider {
    width: 80px;
    margin: 0 8px;
  }
}

.music-lyrics {
  background-color: var(--el-bg-color-overlay);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__close {
    padding: 4px;
  }

  &__content {
    max-height: 200px;
    overflow-y: auto;
    padding-right: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;

    p {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin: 8px 0;
      transition: all 0.3s;
      text-align: center;
      width: 100%;

      &.active {
        color: var(--el-color-primary);
        font-size: 16px;
        font-weight: 500;
      }
    }
  }
}

.music-playlist {
  &__header {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__actions {
    display: flex;
    gap: 16px;
  }

  &__item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    transition: all 0.3s;
    cursor: pointer;
    border-bottom: 1px solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: #f5f7fa;

      .music-playlist__item-actions {
        opacity: 1;
      }
    }

    &.active {
      background-color: #ecf5ff;

      .music-playlist__item-title {
        color: var(--el-color-primary);
      }
    }
  }

  &__item-index {
    width: 30px;
    text-align: center;
    font-size: 14px;
     color: var(--el-text-color-primary);
    position: relative;

    .music-playlist__item-number {
      transition: opacity 0.3s;
    }

    .music-playlist__item-playing-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: var(--el-color-primary);
      opacity: 0;
      font-size: 16px;
    }

    &.is-playing {
      .music-playlist__item-number {
        opacity: 0;
      }

      .music-playlist__item-playing-icon {
        opacity: 1;
        animation: musicIconPulse 1.5s infinite;
      }
    }
  }

  &__item-info {
    flex: 1;
    min-width: 0;
    margin-left: 12px;
  }

  &__item-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.3s;
  }

  &__item-artist {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item-duration {
    font-size: 12px;
     color: var(--el-text-color-primary);
    margin-left: 16px;
    margin-right: 8px;
  }

  &__item-actions {
    opacity: 0;
    transition: opacity 0.3s;
  }

  &__item-action-btn {
    padding: 6px;
    height: auto;
    width: auto;
     color: var(--el-text-color-primary);

    &:hover {
      color: var(--el-color-primary);
    }
  }
}

.music-playlist-drawer {
  .el-drawer__header {
    margin-bottom: 0;
    padding: 16px;
  }

  .el-drawer__body {
    padding: 0;
  }
}

@keyframes musicIconPulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes discRotate {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
</style>
