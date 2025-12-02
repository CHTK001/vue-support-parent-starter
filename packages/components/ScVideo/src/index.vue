<template>
  <div class="sc-video-container" :style="containerStyle">
    <video ref="videoRef" class="sc-video-player" :poster="poster" :autoplay="autoplay" :loop="loop" :muted="muted" :playsinline="playsinline" crossorigin="anonymous">
      <source v-if="src" :src="src" :type="getVideoType(src)" />
      <track v-for="(track, index) in tracks" :key="index" :kind="track.kind" :label="track.label" :srclang="track.srclang" :src="track.src" :default="track.default" />
      您的浏览器不支持 video 标签
    </video>
  </div>
</template>

<script setup lang="ts">
/**
 * ScVideo 视频播放器组件
 * 基于 Plyr.js 实现，支持多种视频格式和高级功能
 * @author CH
 * @version 2.0.0
 * @since 2025-12-02
 */
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import Hls from "hls.js";

/** 字幕轨道类型 */
interface Track {
  kind: "subtitles" | "captions" | "descriptions";
  label: string;
  srclang: string;
  src: string;
  default?: boolean;
}

/** 清晰度选项 */
interface Quality {
  label: string;
  value: number | string;
  src: string;
}

const props = withDefaults(
  defineProps<{
    /** 视频源地址 */
    src?: string;
    /** 视频封面 */
    poster?: string;
    /** 宽度 */
    width?: string | number;
    /** 高度 */
    height?: string | number;
    /** 自动播放 */
    autoplay?: boolean;
    /** 循环播放 */
    loop?: boolean;
    /** 静音 */
    muted?: boolean;
    /** 显示控制栏 */
    controls?: boolean;
    /** 行内播放（移动端） */
    playsinline?: boolean;
    /** 字幕轨道 */
    tracks?: Track[];
    /** 清晰度选项 */
    qualities?: Quality[];
    /** 播放速度选项 */
    speeds?: number[];
    /** 语言 */
    language?: string;
    /** 主题色 */
    theme?: string;
    /** 支持的视频类型 */
    type?: "video" | "hls" | "dash" | "youtube" | "vimeo";
    /** Plyr 配置 */
    options?: Partial<Plyr.Options>;
  }>(),
  {
    src: "",
    poster: "",
    width: "100%",
    height: "100%",
    autoplay: false,
    loop: false,
    muted: false,
    controls: true,
    playsinline: true,
    tracks: () => [],
    qualities: () => [],
    speeds: () => [0.5, 0.75, 1, 1.25, 1.5, 2],
    language: "zh",
    theme: "#00b3ff",
    type: "video",
    options: () => ({})
  }
);

const emit = defineEmits<{
  play: [];
  pause: [];
  ended: [];
  timeupdate: [time: number];
  volumechange: [volume: number];
  qualitychange: [quality: number | string];
  ready: [player: Plyr];
}>();

const videoRef = ref<HTMLVideoElement>();
let player: Plyr | null = null;
let hls: Hls | null = null;

const containerStyle = computed(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
  height: typeof props.height === "number" ? `${props.height}px` : props.height
}));

/**
 * 获取视频类型
 */
function getVideoType(url: string): string {
  if (!url) return "";
  const ext = url.split(".").pop()?.toLowerCase();
  const typeMap: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    ogg: "video/ogg",
    m3u8: "application/x-mpegURL",
    mpd: "application/dash+xml"
  };
  return typeMap[ext || ""] || "video/mp4";
}

/**
 * 初始化播放器
 */
function initPlayer(): void {
  if (!videoRef.value) return;

  // 处理 HLS 流
  if (props.type === "hls" || props.src.includes(".m3u8")) {
    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(props.src);
      hls.attachMedia(videoRef.value);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        initPlyr();
      });
    } else if (videoRef.value.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari 原生支持 HLS
      videoRef.value.src = props.src;
      initPlyr();
    }
  } else {
    initPlyr();
  }
}

/**
 * 初始化 Plyr
 */
function initPlyr(): void {
  if (!videoRef.value) return;

  const plyrOptions: Plyr.Options = {
    controls: ["play-large", "play", "progress", "current-time", "duration", "mute", "volume", "captions", "settings", "pip", "airplay", "fullscreen"],
    i18n: getI18nConfig(),
    settings: ["captions", "quality", "speed"],
    quality: {
      default: props.qualities[0]?.value || 720,
      options: props.qualities.map(q => q.value),
      forced: true,
      onChange: (quality: number) => {
        emit("qualitychange", quality);
        updateQuality(quality);
      }
    },
    speed: {
      selected: 1,
      options: props.speeds
    },
    autoplay: props.autoplay,
    muted: props.muted,
    loop: { active: props.loop },
    ...props.options
  };

  player = new Plyr(videoRef.value, plyrOptions);

  // 设置主题色
  if (props.theme) {
    document.documentElement.style.setProperty("--plyr-color-main", props.theme);
  }

  // 事件监听
  player.on("play", () => emit("play"));
  player.on("pause", () => emit("pause"));
  player.on("ended", () => emit("ended"));
  player.on("timeupdate", () => emit("timeupdate", player?.currentTime || 0));
  player.on("volumechange", () => emit("volumechange", player?.volume || 0));
  player.on("ready", () => emit("ready", player!));
}

/**
 * 更新清晰度
 */
function updateQuality(quality: number | string): void {
  const qualityOption = props.qualities.find(q => q.value === quality);
  if (qualityOption && player) {
    const currentTime = player.currentTime;
    const wasPlaying = !player.paused;

    if (hls) {
      hls.loadSource(qualityOption.src);
    } else {
      player.source = {
        type: "video",
        sources: [{ src: qualityOption.src, type: getVideoType(qualityOption.src) }]
      };
    }

    player.once("loadedmetadata", () => {
      player!.currentTime = currentTime;
      if (wasPlaying) {
        player!.play();
      }
    });
  }
}

/**
 * 获取国际化配置
 */
function getI18nConfig(): Plyr.I18nConfig {
  const i18nMap: Record<string, Partial<Plyr.I18nConfig>> = {
    zh: {
      restart: "重新播放",
      rewind: "快退 {seektime}秒",
      play: "播放",
      pause: "暂停",
      fastForward: "快进 {seektime}秒",
      seek: "跳转",
      seekLabel: "{currentTime} / {duration}",
      played: "已播放",
      buffered: "已缓冲",
      currentTime: "当前时间",
      duration: "总时长",
      volume: "音量",
      mute: "静音",
      unmute: "取消静音",
      enableCaptions: "开启字幕",
      disableCaptions: "关闭字幕",
      download: "下载",
      enterFullscreen: "进入全屏",
      exitFullscreen: "退出全屏",
      frameTitle: "{title} 播放器",
      captions: "字幕",
      settings: "设置",
      pip: "画中画",
      menuBack: "返回上级菜单",
      speed: "播放速度",
      normal: "正常",
      quality: "清晰度",
      loop: "循环播放",
      start: "开始",
      end: "结束",
      all: "全部",
      reset: "重置",
      disabled: "禁用",
      enabled: "启用",
      advertisement: "广告"
    },
    en: {}
  };

  return (i18nMap[props.language] || i18nMap.zh) as Plyr.I18nConfig;
}

/**
 * 销毁播放器
 */
function destroyPlayer(): void {
  if (player) {
    player.destroy();
    player = null;
  }
  if (hls) {
    hls.destroy();
    hls = null;
  }
}

// 监听 src 变化
watch(
  () => props.src,
  () => {
    if (player && props.src) {
      if (hls && (props.type === "hls" || props.src.includes(".m3u8"))) {
        hls.loadSource(props.src);
      } else {
        player.source = {
          type: "video",
          sources: [{ src: props.src, type: getVideoType(props.src) }]
        };
      }
    }
  }
);

onMounted(() => {
  nextTick(() => {
    initPlayer();
  });
});

onUnmounted(() => {
  destroyPlayer();
});

// 暴露方法
defineExpose({
  play: () => player?.play(),
  pause: () => player?.pause(),
  stop: () => {
    player?.pause();
    if (player) player.currentTime = 0;
  },
  seek: (time: number) => {
    if (player) player.currentTime = time;
  },
  setVolume: (volume: number) => {
    if (player) player.volume = volume;
  },
  toggleFullscreen: () => player?.fullscreen.toggle(),
  getPlayer: () => player
});
</script>

<style lang="scss" scoped>
.sc-video-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #000;

  :deep(.plyr) {
    border-radius: 8px;
  }

  :deep(.plyr__control--overlaid) {
    background: var(--plyr-color-main, #00b3ff);
  }

  :deep(.plyr__controls) {
    background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.75));
  }

  :deep(.plyr--video .plyr__controls) {
    padding: 10px;
  }

  :deep(.plyr__menu__container) {
    border-radius: 4px;
  }
}

.sc-video-player {
  width: 100%;
  height: 100%;
}
</style>
