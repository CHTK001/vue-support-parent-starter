<!--
  VideoPreviewPanel.vue — flv/m4v 自研视频面板。
  这两个扩展名不在 file-viewer renderer-media 的 formats 清单里：
  - m4v 是 MP4 容器的别称：字节直出 <video> 原生播放；
  - flv 浏览器原生不解：flv.js（transmux FLV → fMP4 → MSE）attachMediaElement 播放。
  字节获取与 FvMediaPanel 同口径：包内条目走 preview=true&inner= 通道，
  顶层对象签票据后补 raw=true 直出字节，令牌只走请求头。
-->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { authHeaders, rawBytesUrl, resolveObjectUrl } from "../api/filestorageApi";
import { extensionOf } from "../utils/officeRenderer";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（含目录前缀）；传 inner 时是压缩包自身的 Key */
  objectKey: string;
  /** 文件名（顶层对象名；包内条目时为压缩包名，判型用生效名） */
  fileName: string;
  /** 压缩包内条目路径（空串表示对象本身） */
  inner?: string;
  /** 文件大小（字节），列表行传入 */
  size?: number;
}>();

/** flv.js 最小接口（避免依赖其 d.ts 的导出形态） */
interface FlvPlayerLike {
  attachMediaElement(el: HTMLMediaElement): void;
  load(): void;
  play(): Promise<void> | void;
  destroy(): void;
}
interface FlvJsLike {
  isSupported(): boolean;
  createPlayer(dataSource: { type: string; url: string }, config?: Record<string, unknown>): FlvPlayerLike;
}

/** 生效文件名：包内条目取路径末段（下钻时 fileName 是压缩包自己的名字） */
const effectiveName = computed(() => {
  const p = props.inner;
  if (!p) return props.fileName;
  const slash = p.lastIndexOf("/");
  return slash >= 0 ? p.slice(slash + 1) : p;
});

const ext = computed(() => extensionOf(effectiveName.value).toLowerCase());
/** flv 走 flv.js 解码；m4v 按 MP4 容器原生播放 */
const isFlv = computed(() => ext.value === "flv");

const loading = ref(true);
const failReason = ref("");
/** 已就绪的字节 Blob URL（m4v 直接做 video src；flv 交给 flv.js） */
const blobUrl = ref("");
const videoEl = shallowRef<HTMLVideoElement | null>(null);

let flvPlayer: FlvPlayerLike | null = null;

/** 释放上一轮播放器与 Blob URL */
function release(): void {
  if (flvPlayer) {
    try {
      flvPlayer.destroy();
    } catch {
      /* 播放器可能尚未完成 attach，忽略销毁异常 */
    }
    flvPlayer = null;
  }
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value);
    blobUrl.value = "";
  }
}

async function load(): Promise<void> {
  if (!props.bucket || !props.objectKey) return;
  loading.value = true;
  failReason.value = "";
  release();
  try {
    const params: Record<string, string> = {};
    if (props.inner) {
      params.preview = "true";
      params.inner = props.inner;
    }
    let url = await resolveObjectUrl(props.bucket, props.objectKey, { params });
    if (!url) throw new Error("获取播放地址失败");
    // 顶层走票据通道时补 raw=true 直出对象字节，否则会拿到服务端预览页 HTML；
    // 包内条目通道本身回条目字节，保持原样。
    const finalUrl = props.inner ? url : rawBytesUrl(url);
    const res = await fetch(finalUrl, { headers: authHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ab = await res.arrayBuffer();
    if (!ab.byteLength) throw new Error("预览通道返回空响应体");
    blobUrl.value = URL.createObjectURL(
      new Blob([ab], { type: isFlv.value ? "video/x-flv" : "video/mp4" }),
    );
    if (isFlv.value) {
      // flv.js 需要媒体元素先挂载（attachMediaElement 要求已连接文档）
      await nextTick();
      const el = videoEl.value;
      if (!el) throw new Error("播放器容器尚未就绪");
      const mod = await import("flv.js");
      const flvjs = ((mod as { default?: FlvJsLike }).default ?? mod) as FlvJsLike;
      if (!flvjs.isSupported()) {
        throw new Error("当前浏览器不支持 FLV 软解码（flv.js / MSE）");
      }
      flvPlayer = flvjs.createPlayer({ type: "flv", url: blobUrl.value });
      flvPlayer.attachMediaElement(el);
      flvPlayer.load();
      void el.play().catch(() => {
        /* 自动播放被拦截时保持可控进度条，用户点击播放即可 */
      });
    }
  } catch (e) {
    const msg = (e as Error)?.message ?? "视频加载失败";
    console.warn("[VideoPreviewPanel] 视频加载失败", e);
    failReason.value = `视频播放失败（${effectiveName.value}）：${msg}`;
    release();
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.bucket, props.objectKey, props.inner, props.fileName],
  () => void load(),
  { immediate: true },
);

onBeforeUnmount(release);
</script>

<template>
  <div class="video-preview-panel">
    <div v-if="loading" class="video-preview-panel__mask">
      <span class="video-preview-panel__mask-text">加载中…</span>
    </div>
    <div v-else-if="failReason" class="video-preview-panel__mask">
      <span class="video-preview-panel__mask-text">{{ failReason }}</span>
    </div>
    <video
      v-else-if="blobUrl"
      ref="videoEl"
      class="video-preview-panel__video"
      :src="isFlv ? undefined : blobUrl"
      controls
      autoplay
      playsinline
    ></video>
  </div>
</template>

<style scoped>
.video-preview-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}
.video-preview-panel__video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.video-preview-panel__mask {
  padding: 24px;
}
.video-preview-panel__mask-text {
  color: #909399;
}
</style>
