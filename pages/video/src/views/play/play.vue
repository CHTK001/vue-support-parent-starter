<template>
  <div class="system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header-content">
        <IconifyIconOnline icon="ep:video-play" class="page-header-icon" />
        <div>
          <h2 class="page-header-title">{{ videoTitle || '视频播放' }}</h2>
          <p class="page-header-desc">在线播放视频内容</p>
        </div>
      </div>
    </div>

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
          <ScIcon class="loading-icon"><Loading /></ScIcon>
          <p class="loading-text">正在加载视频...</p>
        </div>

        <!-- 错误状态 -->
        <div v-if="error" class="error-overlay">
          <IconifyIconOnline icon="ep:warning-filled" class="error-icon" />
          <p class="error-message">{{ error }}</p>
          <ScButton type="primary" @click="retryLoad" class="retry-btn">
            <IconifyIconOnline icon="ep:refresh" />
            重试
          </ScButton>
        </div>
      </div>

      <!-- 播放控制信息 -->
      <div class="player-info" v-if="!loading && !error">
        <div class="info-card">
          <div class="info-row">
            <IconifyIconOnline icon="ep:link" class="info-icon" />
            <span class="info-label">播放地址:</span>
            <span class="info-value">{{ videoUrl }}</span>
          </div>
          <div class="info-row" v-if="videoInfo.duration">
            <IconifyIconOnline icon="ep:clock" class="info-icon" />
            <span class="info-label">视频时长:</span>
            <span class="info-value">{{ formatTime(videoInfo.duration) }}</span>
          </div>
          <div class="info-row" v-if="videoInfo.resolution">
            <IconifyIconOnline icon="ep:monitor" class="info-icon" />
            <span class="info-label">分辨率:</span>
            <span class="info-value">{{ videoInfo.resolution }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/utils";
import Hls from "hls.js";
import { Loading } from "@element-plus/icons-vue";
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

<style scoped lang="scss">
/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.page-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-header-icon {
  font-size: 48px;
  opacity: 0.9;
}

.page-header-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.page-header-desc {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.player-wrapper {
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.video-container {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.video-player {
  width: 100%;
  height: auto;
  min-height: 500px;
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
  background: rgba(0, 0, 0, 0.85);
  color: white;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.loading-icon {
  font-size: 48px;
  color: var(--el-color-primary);
  margin-bottom: 16px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin: 0;
  font-size: 16px;
  color: white;
}

.error-icon {
  font-size: 64px;
  color: #f56565;
  margin-bottom: 16px;
}

.error-message {
  text-align: center;
  margin-bottom: 24px;
  font-size: 16px;
  color: white;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
}

.player-info {
  margin-top: 24px;
}

.info-card {
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.info-row:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.info-icon {
  font-size: 18px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.info-label {
  font-weight: 600;
  color: var(--el-text-color-regular);
  min-width: 90px;
  flex-shrink: 0;
}

.info-value {
  color: var(--el-text-color-primary);
  word-break: break-all;
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 16px;
  }

  .page-header-icon {
    font-size: 36px;
  }

  .page-header-title {
    font-size: 20px;
  }

  .player-wrapper {
    padding: 16px;
  }

  .video-player {
    min-height: 300px;
  }

  .info-card {
    padding: 16px;
  }

  .info-row {
    flex-wrap: wrap;
  }

  .info-label {
    min-width: auto;
    width: 100%;
  }
}
</style>
