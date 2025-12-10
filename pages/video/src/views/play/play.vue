<template>
  <div class="video-player-container">
    <!-- 视频播放器 -->
    <div class="player-wrapper" ref="playerContainer">
      <div class="video-container" ref="videoContainer">
        <video
          ref="videoElement"
          class="video-player"
          controls
          preload="metadata"
          :poster="videoPoster"
          @loadstart="onLoadStart"
          @loadedmetadata="onLoadedMetadata"
          @canplay="onCanPlay"
          @error="onError"
          @timeupdate="onTimeUpdate"
          @ended="onEnded"
        >
          您的浏览器不支持视频播放
        </video>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-overlay">
          <el-loading-spinner />
          <p>正在加载视频...</p>
        </div>

        <!-- 错误状态 -->
        <div v-if="error" class="error-overlay">
          <IconifyIconOnline icon="ep:warning" class="error-icon" />
          <p class="error-message">{{ error }}</p>
          <el-button type="primary" @click="retryLoad">重试</el-button>
        </div>
      </div>

      <!-- 播放控制信息 -->
      <div class="player-info" v-if="!loading && !error">
        <div class="info-row">
          <span class="info-label">播放地址:</span>
          <span class="info-value">{{ videoUrl }}</span>
        </div>
        <div class="info-row" v-if="videoInfo.duration">
          <span class="info-label">视频时长:</span>
          <span class="info-value">{{ formatTime(videoInfo.duration) }}</span>
        </div>
        <div class="info-row" v-if="videoInfo.resolution">
          <span class="info-label">分辨率:</span>
          <span class="info-value">{{ videoInfo.resolution }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/utils";
import Hls from "hls.js";
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

// 响应式数据
const videoElement = ref<HTMLVideoElement>();
const videoContainer = ref<HTMLDivElement>();
const playerContainer = ref<HTMLDivElement>();
const loading = ref(true);
const error = ref("");
const isFullscreen = ref(false);
const videoUrl = ref("");
const videoTitle = ref("");
const videoPoster = ref("");
const videoInfo = ref({
  duration: 0,
  resolution: "",
  currentTime: 0,
});

let hls: Hls | null = null;

// 初始化
onMounted(async () => {
  await nextTick();
  initializePlayer();
});

// 清理资源
onUnmounted(() => {
  destroyPlayer();
});

// 初始化播放器
const initializePlayer = () => {
  try {
    // 获取URL参数
    const urlParam = route.query.url as string;
    const titleParam = route.query.title as string;

    if (!urlParam) {
      error.value = "缺少视频播放地址";
      loading.value = false;
      return;
    }

    videoUrl.value = decodeURIComponent(urlParam);
    videoTitle.value = titleParam || "在线播放";

    loadVideo();
  } catch (err) {
    console.error("初始化播放器失败:", err);
    error.value = "初始化播放器失败";
    loading.value = false;
  }
};

// 加载视频
const loadVideo = () => {
  if (!videoElement.value) {
    error.value = "视频元素未找到";
    loading.value = false;
    return;
  }

  const video = videoElement.value;

  // 检查是否为HLS流
  if (videoUrl.value.includes(".m3u8")) {
    loadHlsVideo(video);
  } else {
    loadDirectVideo(video);
  }
};

// 加载HLS视频
const loadHlsVideo = (video: HTMLVideoElement) => {
  if (Hls.isSupported()) {
    // 销毁之前的HLS实例
    if (hls) {
      hls.destroy();
    }

    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
    });

    hls.loadSource(videoUrl.value);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log("HLS manifest parsed");
      loading.value = false;
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error("HLS error:", data);
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            error.value = "网络错误，无法加载视频";
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            error.value = "媒体错误，视频格式不支持";
            break;
          default:
            error.value = "HLS播放器错误";
            break;
        }
        loading.value = false;
      }
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    // Safari原生支持HLS
    video.src = videoUrl.value;
    loading.value = false;
  } else {
    error.value = "浏览器不支持HLS播放";
    loading.value = false;
  }
};

// 加载直接视频
const loadDirectVideo = (video: HTMLVideoElement) => {
  video.src = videoUrl.value;
  loading.value = false;
};

// 销毁播放器
const destroyPlayer = () => {
  if (hls) {
    hls.destroy();
    hls = null;
  }
};

// 重试加载
const retryLoad = () => {
  error.value = "";
  loading.value = true;
  loadVideo();
};

// 监听全屏状态变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

// 视频事件处理
const onLoadStart = () => {
  console.log("视频开始加载");
};

const onLoadedMetadata = () => {
  if (videoElement.value) {
    videoInfo.value.duration = videoElement.value.duration;
    videoInfo.value.resolution = `${videoElement.value.videoWidth}x${videoElement.value.videoHeight}`;
  }
};

const onCanPlay = () => {};

const onError = (event: Event) => {
  console.error("视频播放错误:", event);
  error.value = "视频播放失败，请检查网络连接或视频地址";
  loading.value = false;
};

const onTimeUpdate = () => {
  if (videoElement.value) {
    videoInfo.value.currentTime = videoElement.value.currentTime;
  }
};

const onEnded = () => {
  console.log("视频播放结束");
  message("视频播放完毕", { type: "info" });
};

// 格式化时间
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// 监听全屏事件
onMounted(() => {
  document.addEventListener("fullscreenchange", handleFullscreenChange);
});

onUnmounted(() => {
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
});
</script>

<style scoped>
.video-player-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

.video-title {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fullscreen-btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-wrapper {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.video-container {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: auto;
  min-height: 400px;
  display: block;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
  color: var(--el-text-color-primary);
  z-index: 10;
}

.loading-overlay p,
.error-overlay p {
  margin: 15px 0;
  font-size: 16px;
}

.error-icon {
  font-size: 48px;
  color: #f56565;
  margin-bottom: 10px;
}

.error-message {
  text-align: center;
  margin-bottom: 20px;
}

.player-info {
  margin-top: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
  align-items: center;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 600;
  color: var(--el-text-color-primary);
  min-width: 80px;
  margin-right: 10px;
}

.info-value {
  color: var(--el-text-color-primary);
  word-break: break-all;
  flex: 1;
}

/* 全屏样式 */
.video-player-container:fullscreen {
  padding: 0;
  background: #000;
}

.video-player-container:fullscreen .player-header {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  z-index: 100;
  background: rgba(0, 0, 0, 0.8);
  color: var(--el-text-color-primary);
}

.video-player-container:fullscreen .player-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: transparent;
  padding: 0;
}

.video-player-container:fullscreen .video-container {
  max-width: none;
  height: 100%;
}

.video-player-container:fullscreen .video-player {
  height: 100%;
  object-fit: contain;
}

.video-player-container:fullscreen .player-info {
  display: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-player-container {
    padding: 10px;
  }

  .player-header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .header-left {
    flex-direction: column;
    gap: 10px;
  }

  .video-title {
    font-size: 18px;
  }

  .player-wrapper {
    padding: 15px;
  }

  .video-player {
    min-height: 250px;
  }
}
</style>
