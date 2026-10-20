<template>
  <div class="video-wall">
    <header class="wall-head">
      <div class="flex items-center gap-3">
        <el-button size="small" @click="back">返回台账</el-button>
        <h2 class="text-lg font-semibold">视频预览</h2>
        <span class="text-xs text-el-text-secondary">{{ devices.length }} 台设备 · 第 {{ page + 1 }} / {{ pageCount }} 页</span>
      </div>
      <div class="flex items-center gap-3">
        <el-radio-group v-model="layout" size="small">
          <el-radio-button :value="1">1×1</el-radio-button>
          <el-radio-button :value="4">2×2</el-radio-button>
          <el-radio-button :value="9">3×3</el-radio-button>
          <el-radio-button :value="16">4×4</el-radio-button>
        </el-radio-group>
        <el-radio-group v-model="streamMode" size="small">
          <el-radio-button value="sub">子码流</el-radio-button>
          <el-radio-button value="main">主码流</el-radio-button>
        </el-radio-group>
        <el-button size="small" :disabled="page <= 0" @click="page--">上一页</el-button>
        <el-button size="small" :disabled="page >= pageCount - 1" @click="page++">下一页</el-button>
      </div>
    </header>

    <div v-if="remindVisible && remind" class="remind-bar">
      <span>已按所选设备打开预览：{{ devices.map((item) => item.deviceInfoName).join('、') }}</span>
      <el-button link type="primary" @click="remindVisible = false">知道了</el-button>
    </div>

    <div v-loading="loading" class="wall-grid" :style="gridStyle">
      <div v-for="device in pageDevices" :key="device.deviceInfoId" class="wall-tile">
        <div class="tile-head">
          <span class="tile-name">{{ device.deviceInfoName }}</span>
          <span class="tile-status" :class="{ online: device.deviceInfoOnline }">
            {{ device.deviceInfoOnline ? '在线' : '离线' }}
          </span>
          <el-button link type="primary" size="small" @click="openFullscreen(device)">全屏</el-button>
        </div>
        <div class="tile-body">
          <ReVideo :url="urls[device.deviceInfoId] || ''" protocol="hls" muted />
        </div>
      </div>
      <div v-if="!pageDevices.length && !loading" class="empty">没有可预览的设备，请返回台账选择设备。</div>
    </div>

    <div v-if="fullscreenDevice" class="fullscreen-mask" @click.self="closeFullscreen">
      <div class="fullscreen-panel">
        <div class="tile-head">
          <span class="tile-name">{{ fullscreenDevice.deviceInfoName }} · 主码流</span>
          <el-button link type="danger" @click="closeFullscreen">退出全屏</el-button>
        </div>
        <div class="fullscreen-body">
          <ReVideo :url="fullscreenUrl" protocol="hls" controls autoplay />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ReVideo from '@pages/device/src/components/ReVideo.vue'
import { deviceApi } from '@pages/device/src/api/deviceApi'
import type { DeviceInfo } from '@pages/device/src/types/device'

const route = useRoute()
const router = useRouter()

const devices = ref<DeviceInfo[]>([])
const loading = ref(false)
const layout = ref(Number(route.query.layout) || 4)
const page = ref(0)
const streamMode = ref<'sub' | 'main'>('sub')
const urls = reactive<Record<string, string>>({})
const remind = computed(() => route.query.remind === 'true')
const remindVisible = ref(true)

const fullscreenDevice = ref<DeviceInfo | null>(null)
const fullscreenUrl = ref('')

const pageCount = computed(() => Math.max(1, Math.ceil(devices.value.length / layout.value)))
const pageDevices = computed(() =>
  devices.value.slice(page.value * layout.value, (page.value + 1) * layout.value)
)
const gridStyle = computed(() => {
  const columns = Math.max(1, Math.round(Math.sqrt(layout.value)))
  return { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
})

let rotateTimer: ReturnType<typeof setInterval> | undefined

function back() {
  router.push('/device')
}

async function loadDevices() {
  const ids = String(route.query.ids || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  if (!ids.length) return
  loading.value = true
  try {
    const list = await Promise.all(ids.map((id) => deviceApi.get(id).catch(() => null)))
    devices.value = list.filter((item): item is DeviceInfo => !!item)
  } finally {
    loading.value = false
  }
}

async function loadStreams() {
  await Promise.all(
    pageDevices.value.map(async (device) => {
      try {
        const url = await deviceApi.getVideoStream(device.deviceInfoId, 1, 'hls', streamMode.value)
        urls[device.deviceInfoId] = String(url || '')
      } catch {
        urls[device.deviceInfoId] = ''
      }
    })
  )
}

async function openFullscreen(device: DeviceInfo) {
  fullscreenDevice.value = device
  fullscreenUrl.value = ''
  try {
    const url = await deviceApi.getVideoStream(device.deviceInfoId, 1, 'hls', 'main')
    fullscreenUrl.value = String(url || '')
  } catch {
    fullscreenUrl.value = ''
  }
}

function closeFullscreen() {
  fullscreenDevice.value = null
  fullscreenUrl.value = ''
}

watch(page, () => {
  if (page.value > pageCount.value - 1) page.value = 0
})
watch(layout, () => {
  page.value = 0
})
watch([pageDevices, streamMode], loadStreams)

onBeforeUnmount(() => {
  if (rotateTimer) clearInterval(rotateTimer)
})

loadDevices().then(() => {
  if (pageCount.value > 1) {
    rotateTimer = setInterval(() => {
      page.value = (page.value + 1) % pageCount.value
    }, 15000)
  }
})
</script>

<style scoped>
.video-wall {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  min-height: calc(100vh - 120px);
  background: var(--el-bg-color);
}
.wall-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.remind-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  font-size: 13px;
}
.wall-grid {
  flex: 1;
  display: grid;
  gap: 8px;
  min-height: 0;
}
.wall-tile {
  display: flex;
  flex-direction: column;
  min-height: 220px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  overflow: hidden;
  background: #000;
}
.tile-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  font-size: 12px;
}
.tile-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tile-status {
  color: #909399;
}
.tile-status.online {
  color: #67c23a;
}
.tile-body {
  flex: 1;
  min-height: 180px;
}
.empty {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.fullscreen-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
}
.fullscreen-panel {
  width: 92vw;
  height: 88vh;
  display: flex;
  flex-direction: column;
  background: #000;
  border-radius: 10px;
  overflow: hidden;
}
.fullscreen-body {
  flex: 1;
  min-height: 0;
}
</style>
