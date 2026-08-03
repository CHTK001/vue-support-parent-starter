<template>
  <div ref="containerRef" class="re-video relative w-full h-full bg-black rounded-xl overflow-hidden">
    <video
      ref="videoRef"
      class="w-full h-full object-contain bg-black"
      :poster="poster"
      :muted="muted"
      :autoplay="autoplay"
      :controls="controls"
      :playsinline="true"
      @error="onVideoError"
      @loadedmetadata="onLoaded"
    ></video>

    <div
      v-if="!url || error"
      class="absolute inset-0 flex flex-col items-center justify-center text-el-text-secondary gap-2 pointer-events-none"
    >
      <el-icon :size="32"><VideoCamera /></el-icon>
      <span class="text-xs">{{ error || '暂无视频' }}</span>
      <span v-if="protocol" class="text-[10px] opacity-70">协议: {{ protocol }}</span>
    </div>

    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
      <span class="text-xs text-white">加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { VideoCamera } from '@element-plus/icons-vue'
import Hls from 'hls.js'
// @ts-ignore flv.js 无 d.ts
import flvjs from 'flv.js'

const props = defineProps<{
  url: string
  protocol?: string
  channel?: number
  muted?: boolean
  autoplay?: boolean
  controls?: boolean
  poster?: string
}>()

const emit = defineEmits<{
  (e: 'error', err: unknown): void
  (e: 'loaded'): void
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const error = ref<string>('')
const loading = ref(false)

let hls: Hls | null = null
// @ts-ignore flv.js 无 d.ts
let flvPlayer: any = null

function detectProtocol(url: string, hint?: string): string {
  if (hint) return hint.toLowerCase()
  const u = url.toLowerCase()
  if (u.endsWith('.m3u8') || u.includes('.m3u8?')) return 'hls'
  if (u.endsWith('.flv') || u.includes('.flv?')) return 'flv'
  if (u.endsWith('.mp4') || u.includes('.mp4?')) return 'mp4'
  if (u.startsWith('ws://') || u.startsWith('wss://')) return 'ws'
  return 'mp4'
}

function destroy() {
  if (hls) {
    try {
      hls.destroy()
    } catch (e) {
      // ignore
    }
    hls = null
  }
  if (flvPlayer) {
    try {
      flvPlayer.destroy()
    } catch (e) {
      // ignore
    }
    flvPlayer = null
  }
  const v = videoRef.value
  if (v) {
    v.removeAttribute('src')
    try {
      v.load()
    } catch (e) {
      // ignore
    }
  }
}

function playHls(url: string) {
  const v = videoRef.value
  if (!v) return
  destroy()
  if (Hls.isSupported()) {
    hls = new Hls({ enableWorker: true, lowLatencyMode: true })
    hls.loadSource(url)
    hls.attachMedia(v)
    // @ts-ignore Hls 事件类型
    hls.on(Hls.Events.ERROR, (_event: unknown, data: any) => {
      if (data.fatal) {
        error.value = `HLS 错误: ${data.type} - ${data.details}`
        emit('error', data)
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls?.startLoad()
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls?.recoverMediaError()
        }
      }
    })
  } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
    v.src = url
  } else {
    error.value = '当前浏览器不支持 HLS 播放'
    emit('error', new Error(error.value))
  }
}

function playFlv(url: string) {
  const v = videoRef.value
  // @ts-ignore flv.js
  if (!v || !flvjs.isSupported()) {
    error.value = '当前浏览器不支持 FLV 播放'
    emit('error', new Error(error.value))
    return
  }
  destroy()
  // @ts-ignore flv.js
  flvPlayer = flvjs.createPlayer(
    { type: 'flv', url, isLive: true },
    { enableWorker: false, enableStashBuffer: false, stashInitialSize: 128 },
  )
  // @ts-ignore
  flvPlayer.attachMediaElement(v)
  // @ts-ignore
  flvPlayer.load()
  // @ts-ignore
  flvPlayer.play().catch((e: unknown) => emit('error', e))
  // @ts-ignore
  flvPlayer.on(flvjs.Events.ERROR, (errType: string, errDetail: string) => {
    error.value = `FLV 错误: ${errType} - ${errDetail}`
    emit('error', new Error(error.value))
  })
}

function playNative(url: string) {
  const v = videoRef.value
  if (!v) return
  destroy()
  v.src = url
}

function load() {
  error.value = ''
  loading.value = true
  if (!props.url) {
    loading.value = false
    return
  }
  try {
    const proto = detectProtocol(props.url, props.protocol)
    if (proto === 'hls') {
      playHls(props.url)
    } else if (proto === 'flv') {
      playFlv(props.url)
    } else {
      playNative(props.url)
    }
    if (props.autoplay) {
      videoRef.value?.play().catch((e: unknown) => {
        console.warn('[ReVideo] autoplay blocked:', (e as Error)?.message)
      })
    }
  } catch (e: unknown) {
    error.value = (e as Error)?.message || '视频加载失败'
    emit('error', e)
  } finally {
    loading.value = false
  }
}

function onVideoError(e: unknown) {
  error.value = '视频播放错误'
  emit('error', e)
}

function onLoaded() {
  emit('loaded')
}

watch(
  () => [props.url, props.protocol],
  () => load(),
)

onMounted(load)
onBeforeUnmount(destroy)
</script>

<style scoped>
.re-video :deep(video) {
  width: 100%;
  height: 100%;
}
</style>
