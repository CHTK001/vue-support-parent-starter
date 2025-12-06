<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";

export interface Props {
  width?: string | number;
  height?: string | number;
  src?: string;
  poster?: string;
  second?: number;
  fit?: "none" | "fill" | "contain" | "cover";
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  preload?: "auto" | "metadata" | "none";
  playIcon?: boolean;
  iconSize?: number;
  // 新增属性
  showCustomControls?: boolean; // 是否显示自定义控制条
  title?: string; // 视频标题
  theme?: "dark" | "light"; // 主题
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 450,
  src: undefined,
  poster: undefined,
  second: 0.5,
  fit: "contain",
  autoplay: false,
  controls: true,
  loop: false,
  muted: false,
  preload: "metadata",
  playIcon: true,
  iconSize: 80,
  showCustomControls: true,
  title: "",
  theme: "dark",
});
const veoRef = ref(); // 视频元素模板引用
const containerRef = ref(); // 容器引用
const veoPoster = ref(); // 自动截取视频帧生成的封面
const playing = ref<boolean>(false); // 是否正在播放
const originPlay = ref<boolean>(true); // 是否第一次播放
const showPlayIcon = ref<boolean>(false); // 是否展示播放器中间的播放按钮图标
const showControls = ref<boolean>(false); // 是否显示控制条
const currentTime = ref<number>(0); // 当前播放时间
const duration = ref<number>(0); // 视频总时长
const volume = ref<number>(1); // 音量 0-1
const isMuted = ref<boolean>(props.muted); // 是否静音
const isFullscreen = ref<boolean>(false); // 是否全屏
const playbackRate = ref<number>(1); // 播放速度
const buffered = ref<number>(0); // 缓冲进度
const showVolumeSlider = ref<boolean>(false); // 是否显示音量滑块
const showSpeedMenu = ref<boolean>(false); // 是否显示速度菜单
const hideControlsTimer = ref<number | null>(null); // 隐藏控制条定时器

const emits = defineEmits(["play", "pause", "ended", "timeupdate", "volumechange"]);

// 播放速度选项
const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];
const veoWidth = computed(() => {
  if (typeof props.width === "number") {
    return `${props.width}px`;
  }
  return props.width;
});
const veoHeight = computed(() => {
  if (typeof props.height === "number") {
    return `${props.height}px`;
  }
  return props.height;
});
watch(
  () => props.second,
  () => {
    getPoster();
  }
);
watch(
  () => props.autoplay,
  to => {
    if (to) {
      showPlayIcon.value = false;
      originPlay.value = false;
      playing.value = true;
    } else {
      showPlayIcon.value = true;
      originPlay.value = true;
      playing.value = false;
      veoRef.value?.pause();
    }
  },
  {
    immediate: true,
    flush: "post"
  }
);
/*
  自定义设置播放速度，经测试：
  在vue2中需设置：this.$refs.veoRef.playbackRate = 2
  在vue3中需设置：veoRef.value.defaultPlaybackRate = 2
*/
// veoRef.value.defaultPlaybackRate = 2
/*
  loadedmetadata 事件在元数据（metadata）被加载完成后触发
  loadeddata 事件在媒体当前播放位置的视频帧（通常是第一帧）加载完成后触发
    若在移动/平板设备的浏览器设置中开启了流量节省（data-saver）模式，该事件则不会被触发。
  preload 为 none 时不会触发
*/
function getPoster() {
  // 在未设置封面时，自动截取视频0.5s对应帧作为视频封面
  // 由于不少视频第一帧为黑屏，故设置视频开始播放时间为0.5s，即取该时刻帧作为封面图
  if (veoRef.value) {
    veoRef.value.currentTime = props.second;
    // 创建canvas元素
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    // canvas画图
    canvas.width = veoRef.value.videoWidth;
    canvas.height = veoRef.value.videoHeight;
    ctx?.drawImage(veoRef.value, 0, 0, canvas.width, canvas.height);
    // 把canvas转成base64编码格式
    veoPoster.value = canvas.toDataURL("image/png");
  }
}
function onClickPlay() {
  if (originPlay.value) {
    originPlay.value = false;
    veoRef.value.currentTime = 0;
  }
  if (playing.value) {
    veoRef.value.pause();
  } else {
    veoRef.value.play();
  }
}
function onPause() {
  playing.value = false;
  if (props.playIcon) {
    showPlayIcon.value = true;
  }
  emits("pause");
}
function onPlay() {
  playing.value = true;
  if (props.playIcon) {
    showPlayIcon.value = false;
  }
  emits("play");
}
function play() {
  if (originPlay.value) {
    originPlay.value = false;
    veoRef.value.currentTime = 0;
  }
  if (!playing.value) {
    veoRef.value.play();
  }
}
function pause() {
  if (playing.value) {
    veoRef.value.pause();
  }
}

// 格式化时间
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// 进度条点击
function onProgressClick(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  if (veoRef.value) {
    veoRef.value.currentTime = percent * duration.value;
  }
}

// 时间更新
function onTimeUpdate() {
  if (veoRef.value) {
    currentTime.value = veoRef.value.currentTime;
    // 更新缓冲进度
    if (veoRef.value.buffered.length > 0) {
      buffered.value = veoRef.value.buffered.end(veoRef.value.buffered.length - 1);
    }
    emits("timeupdate", currentTime.value);
  }
}

// 视频加载完成
function onLoadedMetadata() {
  if (veoRef.value) {
    duration.value = veoRef.value.duration;
    if (!props.poster) {
      getPoster();
    }
  }
}

// 音量变化
function onVolumeChange(val: number) {
  volume.value = val;
  if (veoRef.value) {
    veoRef.value.volume = val;
    isMuted.value = val === 0;
  }
  emits("volumechange", val);
}

// 切换静音
function toggleMute() {
  isMuted.value = !isMuted.value;
  if (veoRef.value) {
    veoRef.value.muted = isMuted.value;
  }
}

// 切换全屏
function toggleFullscreen() {
  if (!containerRef.value) return;
  
  if (!isFullscreen.value) {
    if (containerRef.value.requestFullscreen) {
      containerRef.value.requestFullscreen();
    } else if (containerRef.value.webkitRequestFullscreen) {
      containerRef.value.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    }
  }
}

// 监听全屏变化
function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
}

// 设置播放速度
function setPlaybackRate(rate: number) {
  playbackRate.value = rate;
  if (veoRef.value) {
    veoRef.value.playbackRate = rate;
  }
  showSpeedMenu.value = false;
}

// 鼠标进入显示控制条
function onMouseEnter() {
  showControls.value = true;
  if (hideControlsTimer.value) {
    clearTimeout(hideControlsTimer.value);
  }
}

// 鼠标移动重置隐藏定时器
function onMouseMove() {
  showControls.value = true;
  if (hideControlsTimer.value) {
    clearTimeout(hideControlsTimer.value);
  }
  if (playing.value) {
    hideControlsTimer.value = window.setTimeout(() => {
      showControls.value = false;
    }, 3000);
  }
}

// 鼠标离开隐藏控制条
function onMouseLeave() {
  if (playing.value) {
    hideControlsTimer.value = window.setTimeout(() => {
      showControls.value = false;
    }, 1000);
  }
}

// 视频结束
function onEnded() {
  playing.value = false;
  showPlayIcon.value = true;
  showControls.value = true;
  emits("ended");
}

// 进度百分比
const progressPercent = computed(() => {
  if (!duration.value) return 0;
  return (currentTime.value / duration.value) * 100;
});

// 缓冲百分比
const bufferedPercent = computed(() => {
  if (!duration.value) return 0;
  return (buffered.value / duration.value) * 100;
});

onMounted(() => {
  document.addEventListener("fullscreenchange", onFullscreenChange);
});

onUnmounted(() => {
  document.removeEventListener("fullscreenchange", onFullscreenChange);
  if (hideControlsTimer.value) {
    clearTimeout(hideControlsTimer.value);
  }
});

defineExpose({
  play,
  pause,
  toggleFullscreen,
  setPlaybackRate,
});
</script>
<template>
  <div 
    ref="containerRef"
    class="sc-video" 
    :class="[
      `sc-video--${theme}`,
      { 
        'is-playing': playing,
        'is-fullscreen': isFullscreen,
        'show-controls': showControls || !playing
      }
    ]"
    :style="`--video-width: ${veoWidth}; --video-height: ${veoHeight}; --video-icon-scale: ${iconSize / 80};`"
    @mouseenter="onMouseEnter"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- 视频标题 -->
    <div v-if="title" class="sc-video__title">
      {{ title }}
    </div>

    <!-- 视频元素 -->
    <video
      ref="veoRef"
      class="sc-video__element"
      :style="`object-fit: ${fit};`"
      :src="src"
      :poster="poster ? poster : veoPoster"
      :autoplay="autoplay"
      :controls="!showCustomControls && !originPlay && controls"
      :loop="loop"
      :muted="autoplay || isMuted"
      :preload="preload"
      crossorigin="anonymous"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @pause="onPause"
      @play="onPlay"
      @ended="onEnded"
      @click.prevent="onClickPlay"
      v-bind="$attrs"
    >
      您的浏览器不支持video标签。
    </video>

    <!-- 中央播放按钮 -->
    <div 
      v-show="(originPlay || playIcon) && showPlayIcon" 
      class="sc-video__play-btn"
      @click="onClickPlay"
    >
      <svg class="play-icon" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="23" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
        <path d="M18 14 L36 24 L18 34 Z" fill="white"/>
      </svg>
    </div>

    <!-- 自定义控制条 -->
    <div v-if="showCustomControls" class="sc-video__controls">
      <!-- 进度条 -->
      <div class="sc-video__progress" @click="onProgressClick">
        <div class="progress-buffered" :style="{ width: `${bufferedPercent}%` }"></div>
        <div class="progress-played" :style="{ width: `${progressPercent}%` }">
          <span class="progress-thumb"></span>
        </div>
      </div>

      <!-- 控制按钮行 -->
      <div class="sc-video__bar">
        <!-- 左侧控制 -->
        <div class="bar-left">
          <!-- 播放/暂停 -->
          <button class="control-btn" @click="onClickPlay">
            <svg v-if="playing" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86a1 1 0 00-1.5.86z"/>
            </svg>
          </button>

          <!-- 音量控制 -->
          <div class="volume-wrapper" @mouseenter="showVolumeSlider = true" @mouseleave="showVolumeSlider = false">
            <button class="control-btn" @click="toggleMute">
              <svg v-if="isMuted || volume === 0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a1 1 0 00-1.42 1.42 3 3 0 010 4.24 1 1 0 001.42 1.42 5 5 0 000-7.08z"/>
                <path d="M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <svg v-else-if="volume < 0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <path d="M15.54 8.46a1 1 0 00-1.42 1.42 3 3 0 010 4.24 1 1 0 001.42 1.42 5 5 0 000-7.08z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <path d="M15.54 8.46a5 5 0 010 7.08 1 1 0 01-1.42-1.42 3 3 0 000-4.24 1 1 0 011.42-1.42z"/>
                <path d="M19.07 4.93a10 10 0 010 14.14 1 1 0 01-1.42-1.42 8 8 0 000-11.3 1 1 0 011.42-1.42z"/>
              </svg>
            </button>
            <div v-show="showVolumeSlider" class="volume-slider">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                :value="volume"
                @input="onVolumeChange(Number(($event.target as HTMLInputElement).value))"
              />
            </div>
          </div>

          <!-- 时间显示 -->
          <span class="time-display">
            {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
          </span>
        </div>

        <!-- 右侧控制 -->
        <div class="bar-right">
          <!-- 播放速度 -->
          <div class="speed-wrapper">
            <button class="control-btn speed-btn" @click="showSpeedMenu = !showSpeedMenu">
              {{ playbackRate }}x
            </button>
            <div v-show="showSpeedMenu" class="speed-menu">
              <div 
                v-for="speed in speedOptions" 
                :key="speed"
                class="speed-option"
                :class="{ active: playbackRate === speed }"
                @click="setPlaybackRate(speed)"
              >
                {{ speed }}x
              </div>
            </div>
          </div>

          <!-- 全屏 -->
          <button class="control-btn" @click="toggleFullscreen">
            <svg v-if="isFullscreen" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.sc-video {
  width: var(--video-width);
  height: var(--video-height);
  position: relative;
  background: #000;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;

  &.is-fullscreen {
    width: 100vw !important;
    height: 100vh !important;
    border-radius: 0;
  }

  // 视频标题
  &__title {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 16px 20px;
    background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%);
    color: #fff;
    font-size: 16px;
    font-weight: 500;
    z-index: 10;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
  }

  &.show-controls &__title {
    opacity: 1;
    transform: translateY(0);
  }

  // 视频元素
  &__element {
    display: block;
    width: 100%;
    height: 100%;
  }

  // 中央播放按钮
  &__play-btn {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 15;
    cursor: pointer;
    transition: all 0.3s ease;

    .play-icon {
      width: calc(80px * var(--video-icon-scale));
      height: calc(80px * var(--video-icon-scale));
      filter: drop-shadow(0 4px 20px rgba(0,0,0,0.5));
      transition: all 0.3s ease;
    }

    &:hover .play-icon {
      transform: scale(1.1);
    }
  }

  // 控制条
  &__controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%);
    padding: 20px 16px 12px;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;
    z-index: 20;
  }

  &.show-controls &__controls {
    opacity: 1;
    transform: translateY(0);
  }

  // 进度条
  &__progress {
    width: 100%;
    height: 4px;
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    margin-bottom: 12px;
    transition: height 0.2s;

    &:hover {
      height: 6px;

      .progress-thumb {
        opacity: 1;
        transform: scale(1);
      }
    }

    .progress-buffered {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: rgba(255,255,255,0.3);
      border-radius: 2px;
    }

    .progress-played {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: var(--el-color-primary, #409eff);
      border-radius: 2px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .progress-thumb {
      width: 14px;
      height: 14px;
      background: #fff;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transform: scale(0);
      opacity: 0;
      transition: all 0.2s ease;
      margin-right: -7px;
    }
  }

  // 控制按钮行
  &__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .bar-left,
  .bar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: transparent;
    border: none;
    color: #fff;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover {
      background: rgba(255,255,255,0.15);
    }

    &.speed-btn {
      width: auto;
      padding: 0 12px;
      font-size: 13px;
      font-weight: 500;
    }
  }

  .time-display {
    color: rgba(255,255,255,0.9);
    font-size: 13px;
    font-family: "SF Mono", "Monaco", monospace;
    margin-left: 8px;
  }

  // 音量滑块
  .volume-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .volume-slider {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 8px;
    background: rgba(0,0,0,0.9);
    border-radius: 8px;
    margin-bottom: 8px;

    input[type="range"] {
      writing-mode: vertical-lr;
      direction: rtl;
      width: 6px;
      height: 80px;
      appearance: none;
      background: rgba(255,255,255,0.2);
      border-radius: 3px;

      &::-webkit-slider-thumb {
        appearance: none;
        width: 14px;
        height: 14px;
        background: #fff;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
    }
  }

  // 速度菜单
  .speed-wrapper {
    position: relative;
  }

  .speed-menu {
    position: absolute;
    bottom: 100%;
    right: 0;
    background: rgba(0,0,0,0.95);
    border-radius: 8px;
    padding: 8px 0;
    margin-bottom: 8px;
    min-width: 80px;
    backdrop-filter: blur(10px);

    .speed-option {
      padding: 8px 16px;
      color: rgba(255,255,255,0.8);
      font-size: 13px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba(255,255,255,0.1);
        color: #fff;
      }

      &.active {
        color: var(--el-color-primary, #409eff);
        font-weight: 600;
      }
    }
  }

  // 亮色主题
  &--light {
    .sc-video__controls {
      background: linear-gradient(0deg, rgba(255,255,255,0.95) 0%, transparent 100%);
    }

    .control-btn {
      color: #333;

      &:hover {
        background: rgba(0,0,0,0.1);
      }
    }

    .time-display {
      color: #333;
    }

    .sc-video__progress {
      background: rgba(0,0,0,0.1);

      .progress-buffered {
        background: rgba(0,0,0,0.2);
      }
    }
  }
}
</style>
