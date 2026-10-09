<script setup lang="ts">
/**
 * 音视频预览面板组件
 *
 * <p>此前音视频走 iframe + {@code ?preview=true}：后端把字节内联回来，靠浏览器
 * 默认播放器渲染。能播，但播放器样式游离于主题之外，也没有时长、分辨率等上下文。
 * 改为主应用文档内直接渲染 {@code <video>}/{@code <audio>}：读同一份 koi 主题变量
 * （暗色模式自动跟随），票据、Range 拖动与包内下钻复用既有网关通道，零服务端改动。</p>
 *
 * <p><b>票据过期怎么办。</b>票据 TTL 300 秒，而一次播放可能超过它 —— 播到一半
 * 拖动进度会带着旧票据请求，网关回 410，媒体元素报错。这里在<b>首次</b>错误时
 * 重新签一张票据并续播（记住 currentTime，续上后恢复播放）；若重签后拿到的还是
 * 同一条地址（说明不是过期，而是编码本身浏览器解不了），才落到错误态并给出
 * 「下载后用 VLC 打开」这类可执行的出路。</p>
 *
 * @author Buffy
 * @since 2026/10/07
 */
import { computed, ref, watch } from "vue";
import { Download, Refresh } from "@element-plus/icons-vue";
import { resolveObjectUrl } from "../api/filestorageApi";
import { kindOf } from "../utils/fileKind";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（含目录前缀）；传 inner 时是压缩包自身的 Key */
  objectKey: string;
  /** 文件名（顶层对象名；包内条目时为压缩包名，展示与判型请用生效名） */
  fileName: string;
  /** 压缩包内条目路径（空串表示对象本身） */
  inner?: string;
  /** 文件大小（字节），列表行传入；包内条目暂无从得知时为 0 */
  size?: number;
}>();

/**
 * 生效文件名：包内条目取路径末段。
 *
 * <p>下钻时 {@link props.fileName} 是压缩包自己的名字（.zip），拿它判型会把
 * 包里的 mp4 判成压缩包 —— 必须用条目路径的末段。</p>
 */
const effectiveName = computed(() => {
  const p = props.inner;
  if (!p) {
    return props.fileName;
  }
  const slash = p.lastIndexOf("/");
  return slash >= 0 ? p.slice(slash + 1) : p;
});

/** 媒体形态：按生效名的类型判 video 还是 audio */
const mediaKind = computed(() => (kindOf(effectiveName.value) === "audio" ? "audio" : "video"));

/** 扩展名大写（统计条展示，如 MP4 / MP3） */
const extLabel = computed(() => {
  const n = effectiveName.value;
  const dot = n.lastIndexOf(".");
  return dot >= 0 && dot < n.length - 1 ? n.slice(dot + 1).toUpperCase() : "-";
});

/** 播放地址（票据直链；解析完成前为空串，媒体元素不发起请求） */
const src = ref("");
/** 元数据加载中 */
const loading = ref(true);
/** 错误文案（空串表示无错） */
const errorText = ref("");
/** 时长（秒），元数据就绪后回填 */
const duration = ref(0);
/** 分辨率（如 1920×1080），仅视频有意义 */
const resolution = ref("");

/** 媒体元素引用（video / audio 按形态二选一，同一 ref 承接） */
const mediaEl = ref<HTMLVideoElement | HTMLAudioElement | null>(null);

/** 本次加载是否已尝试过「续票据」——只重试一次，避免错误循环 */
let renewed = false;
/** 续播时待恢复的播放位置（-1 表示无） */
let pendingSeek = -1;
/** 续播前是否在播放 */
let resumePlaying = false;

/** 字节数可读化 */
function formatSize(bytes?: number): string {
  if (!bytes || bytes < 0) {
    return "-";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** 秒 → mm:ss（h:mm:ss 超过一小时才带小时位） */
function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) {
    return "--:--";
  }
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  const m = Math.floor((sec / 60) % 60).toString().padStart(2, "0");
  const h = Math.floor(sec / 3600);
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

/**
 * 按需签发票据并刷新播放地址。
 *
 * <p>包内条目必须带 {@code preview=true&inner=}：票据直读通道对 {@code inner}
 * 的提取只挂在预览分支上（见后端 {@code writeInnerEntryPreview}），只传 inner
 * 不传 preview 会拿到整个压缩包的字节。</p>
 */
async function load(): Promise<void> {
  renewed = false;
  pendingSeek = -1;
  resumePlaying = false;
  duration.value = 0;
  resolution.value = "";
  errorText.value = "";
  loading.value = true;
  src.value = "";
  try {
    const params: Record<string, string> = {};
    if (props.inner) {
      params.preview = "true";
      params.inner = props.inner;
    }
    const url = await resolveObjectUrl(props.bucket, props.objectKey, { params });
    if (!url) {
      loading.value = false;
      errorText.value = "获取播放地址失败";
      return;
    }
    src.value = url;
  } catch {
    loading.value = false;
    errorText.value = "获取播放地址失败";
  }
}

/**
 * 初始加载 + 变更重载。
 *
 * <p>必须 {@code immediate: true} —— 面板是随弹层挂载的，非 immediate 的 watch
 * 只在<b>后续</b>属性变化时触发，首帧永远等不到 load()：表现为骨架一直转、
 * 媒体元素因 src 为空根本不渲染（实测卡在「正在加载媒体信息…」）。</p>
 */
watch(() => [props.bucket, props.objectKey, props.inner], load, { immediate: true });

/** 元数据就绪：收起骨架，回填时长 / 分辨率；有待恢复的播放位置则续播 */
function onLoadedMetadata(): void {
  loading.value = false;
  const el = mediaEl.value;
  if (!el) {
    return;
  }
  duration.value = Number.isFinite(el.duration) ? el.duration : 0;
  if (mediaKind.value === "video") {
    const v = el as HTMLVideoElement;
    resolution.value = v.videoWidth > 0 ? `${v.videoWidth}×${v.videoHeight}` : "-";
    if (pendingSeek >= 0) {
      try {
        v.currentTime = pendingSeek;
      } catch {
        /* 元数据未包含目标位置时 seek 可能抛错，忽略即可 */
      }
      pendingSeek = -1;
      if (resumePlaying) {
        void v.play().catch(() => undefined);
      }
    }
  }
}

/**
 * 媒体加载错误。
 *
 * <p>第一次错误先怀疑票据过期：重签一张、恢复播放位置续播。
 * 重签后地址不变（票据没问题，是解码器不支持）才进入错误态。</p>
 */
function onMediaError(): void {
  if (renewed) {
    loading.value = false;
    errorText.value = mediaKind.value === "video"
      ? "浏览器无法解码该视频（可能是容器或编码不受支持），请下载后用 VLC / PotPlayer 打开"
      : "浏览器无法解码该音频，请下载后用播放器打开";
    return;
  }
  renewed = true;
  void renewTicket();
}

/** 重签票据并尝试续播 */
async function renewTicket(): Promise<void> {
  const el = mediaEl.value;
  pendingSeek = el && Number.isFinite(el.currentTime) ? el.currentTime : -1;
  resumePlaying = !!el && !el.paused && !el.ended;
  try {
    const params: Record<string, string> = {};
    if (props.inner) {
      params.preview = "true";
      params.inner = props.inner;
    }
    const fresh = await resolveObjectUrl(props.bucket, props.objectKey, { params });
    if (fresh && fresh !== src.value) {
      // 换地址触发媒体元素重新加载；loadedmetadata 里恢复播放位置
      loading.value = true;
      errorText.value = "";
      src.value = fresh;
      return;
    }
  } catch {
    /* 落到下面的错误态 */
  }
  loading.value = false;
  errorText.value = "播放失败：地址已失效或文件无法解码";
}

/** 手动刷新：重走一次签发与加载 */
function reload(): void {
  void load();
}

/**
 * 下载本体。
 *
 * <p>顶层对象带 {@code download=true} 走附件下载；包内条目改为在新标签打开
 * 条目字节（{@code preview+inner}）—— 网关的包内通道固定内联响应，不认
 * download 参数，硬拼上只会让人以为点了下载却弹出播放器。</p>
 */
async function downloadSelf(): Promise<void> {
  const params: Record<string, string> = {};
  if (props.inner) {
    params.preview = "true";
    params.inner = props.inner;
  } else {
    params.download = "true";
  }
  const url = await resolveObjectUrl(props.bucket, props.objectKey, { params }).catch(() => "");
  if (url) {
    window.open(url, "_blank");
  }
}

/** 面板内展示的名称：包内条目带「位于 压缩包名」的归属提示由页脚承载 */
const displayName = computed(() => effectiveName.value);

/** 统计条「类型」文案 */
const typeText = computed(() => `${mediaKind.value === "video" ? "视频" : "音频"} ${extLabel.value}`);

/**
 * 统计条「大小」：包内条目显示 -。
 *
 * <p>压缩包树的 {@code open-entry} 只回传条目路径，行大小无从得知；这里能拿到的
 * {@link props.size} 是<b>压缩包自己</b>的体积，标成条目大小就是错的
 * （516.8 KB 的 wav 会显示成 105.6 KB 的 zip 体积）。条目真实体积
 * 压缩包面板里已逐行列明，不重复猜测。</p>
 */
const sizeText = computed(() => (props.inner ? "-" : formatSize(props.size)));

/** 页脚右侧的状态文案 */
const statusText = computed(() => {
  if (errorText.value) {
    return "无法播放";
  }
  return mediaKind.value === "video" ? "在线播放 · 支持进度拖动" : "在线播放";
});
</script>

<template>
  <!-- 无自带 header：文件名与关闭按钮由外层 el-dialog 承担 -->
  <section class="media" aria-label="音视频预览">
    <!-- ===== 统计条 ===== -->
    <div class="media__stats">
      <div class="media__stat">
        <span class="media__stat-label">类型</span>
        <b class="media__stat-value media__stat-value--accent">{{ typeText }}</b>
      </div>
      <div class="media__stat">
        <span class="media__stat-label">大小</span>
        <b class="media__stat-value">{{ sizeText }}</b>
      </div>
      <div class="media__stat">
        <span class="media__stat-label">时长</span>
        <b class="media__stat-value">{{ duration > 0 ? formatDuration(duration) : "--:--" }}</b>
      </div>
      <div v-if="mediaKind === 'video'" class="media__stat">
        <span class="media__stat-label">分辨率</span>
        <b class="media__stat-value">{{ resolution || "-" }}</b>
      </div>
    </div>

    <!-- ===== 工具条 ===== -->
    <div class="media__toolbar">
      <span class="media__hint">{{ inner ? `位于 ${fileName}` : displayName }}</span>
      <div class="media__spacer" />
      <el-button :icon="Refresh" :loading="loading" title="重新加载" aria-label="刷新" @click="reload" />
      <el-button :icon="Download" title="下载文件" @click="downloadSelf">
        {{ inner ? "打开" : "下载" }}
      </el-button>
    </div>

    <!-- ===== 主体 ===== -->
    <div v-if="errorText" class="media__placeholder">
      <el-empty :description="errorText">
        <el-button type="primary" :icon="Refresh" @click="reload">重试</el-button>
        <el-button :icon="Download" @click="downloadSelf">下载文件</el-button>
      </el-empty>
    </div>
    <div v-else class="media__body">
      <!-- 骨架只在首次取地址/等元数据时出现；播放中不遮挡画面 -->
      <div v-if="loading" class="media__placeholder">
        <el-skeleton :rows="3" animated />
        <p class="media__loading-text">正在加载媒体信息…</p>
      </div>
      <video
        v-if="src && mediaKind === 'video'"
        v-show="!loading"
        ref="mediaEl"
        class="media__el"
        :src="src"
        controls
        playsinline
        preload="metadata"
        @loadedmetadata="onLoadedMetadata"
        @error="onMediaError"
      />
      <audio
        v-else-if="src"
        v-show="!loading"
        ref="mediaEl"
        class="media__el media__el--audio"
        :src="src"
        controls
        preload="metadata"
        @loadedmetadata="onLoadedMetadata"
        @error="onMediaError"
      />
    </div>

    <!-- ===== 底部状态栏 ===== -->
    <footer class="media__footer">
      <span>{{ displayName }}</span>
      <span :class="{ 'is-error': !!errorText }">{{ statusText }}</span>
    </footer>
  </section>
</template>

<style scoped>
/* ========================================================
   音视频预览面板（koi / Element Plus 变量体系）

   与 CAD / 压缩包面板同一套结构：统计条 + 工具条 + 主体 + 状态栏。
   颜色走 --el-* 令牌，暗色模式自动跟随。
   ======================================================== */
.media {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 8px);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  overflow: hidden;
}

/* ---- 统计条 ---- */
.media__stats {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}

.media__stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  white-space: nowrap;
}

.media__stat:first-child {
  padding-left: 0;
}

.media__stat + .media__stat {
  border-left: 1px solid var(--el-border-color-lighter);
}

.media__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.media__stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.media__stat-value--accent {
  color: var(--el-color-primary);
}

/* ---- 工具条 ---- */
.media__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.media__hint {
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media__spacer {
  flex: 1;
  min-width: 0;
}

/* ---- 主体 ---- */
.media__body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-bg-color-page);
  /* 制图式细网格：给视频留出「画框」感，也标示出内容区边界 */
  background-image:
    linear-gradient(to right, var(--el-border-color-extra-light, var(--el-border-color-lighter)) 1px, transparent 1px),
    linear-gradient(to bottom, var(--el-border-color-extra-light, var(--el-border-color-lighter)) 1px, transparent 1px);
  background-size: 24px 24px;
}

.media__el {
  display: block;
  width: 100%;
  height: 100%;
  max-height: 100%;
  background: #000;
  object-fit: contain;
}

.media__el--audio {
  /* 音频没有画面：给一条居中的「唱片」宽度，不铺满整块黑 */
  width: min(560px, 92%);
  height: 56px;
  background: transparent;
}

.media__placeholder {
  width: 100%;
  padding: 20px;
}

.media__loading-text {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

/* ---- 底部状态栏 ---- */
.media__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.media__footer span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media__footer .is-error {
  color: var(--el-color-danger);
}
</style>
