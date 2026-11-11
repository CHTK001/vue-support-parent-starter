<template>
  <div class="video-wall">
    <header class="wall-head">
      <div class="flex items-center gap-3">
        <el-button size="small" @click="back">返回台账</el-button>
        <h2 class="text-lg font-semibold">视频预览</h2>
        <span v-if="protocol === 'rtsp' && !hasRtspGateway()" class="text-xs text-el-color-warning">RTSP 需转流</span>
        <span class="text-xs text-el-text-secondary">{{ devices.length }} 台设备 · 第 {{ page + 1 }} / {{ pageCount }} 页</span>
      </div>
      <div class="flex items-center gap-3">
        <el-segmented v-model="layout" :options="layoutSegments" size="small" />
        <el-segmented v-model="protocol" :options="protocolSegments" size="small" />
        <el-button size="small" :disabled="page <= 0" @click="page--">上一页</el-button>
        <el-button size="small" :disabled="page >= pageCount - 1" @click="page++">下一页</el-button>
        <ReButton size="small" :plain="rotate" type="primary" @click="toggleRotate">
          {{ rotate ? '停止轮巡' : '开始轮巡' }}
        </ReButton>
      </div>
    </header>

    <div v-if="remindVisible && remind" class="remind-bar">
      <span>已按所选设备打开预览：{{ devices.map((item) => item.deviceInfoName).join('、') }}</span>
      <el-button link type="primary" @click="remindVisible = false">知道了</el-button>
    </div>

    <div v-if="pageDevices.length" v-loading="loading" class="wall-grid" :style="gridStyle">
      <div
        v-for="device in pageDevices"
        :key="device.deviceInfoId"
        class="wall-tile"
        :class="{ offline: !device.deviceInfoOnline }"
      >
        <div class="tile-head">
          <span class="tile-name" :title="device.deviceInfoName">{{ device.deviceInfoName || device.deviceInfoId }}</span>
          <span class="tile-status" :class="{ online: device.deviceInfoOnline }">
            {{ device.deviceInfoOnline ? '在线' : '离线' }}
          </span>
          <el-icon class="tile-head__op" @click.stop="openRepair(device)" title="取流配置"><Setting /></el-icon>
          <el-icon class="tile-head__op" @click.stop="onRestart(device)" title="重载"><RefreshRight /></el-icon>
          <ReButton
            icon="FullScreen"
            size="small"
            :plain="!!fullscreenDevice && fullscreenDevice.deviceInfoId === device.deviceInfoId"
            type="primary"
            @click="openFullscreen(device)"
          >
            全屏
          </ReButton>
        </div>
        <div class="tile-body">
          <ReVideo
            :url="urlFor(device)"
            :protocol="protocolFor(device)"
            :channel="channelFor(device)"
            :gateway="RTSP_GATEWAY"
            muted
            autoplay
            class="w-full h-full"
          />
        </div>
        <div class="tile-foot">
          <ReButton
            v-for="n in channelChoices(device)"
            :key="n"
            :type="channelFor(device) === n ? 'primary' : ''"
            size="small"
            @click="onDeviceChannel(device, n)"
          >
            CH{{ n }}
          </ReButton>
          <el-segmented
            :model-value="streamFor(device)"
            :options="STREAM_SEGMENTS"
            size="small"
            @update:model-value="onDeviceStream(device, $event)"
          />
        </div>
      </div>
    </div>

    <!-- 空状态：必须在 grid 外面，否则 pageDevices 为空时 .empty 随 grid 一起不渲染 -->
    <div v-if="!pageDevices.length && !loading" class="empty">没有可测试的视频流，请返回台账选择设备。</div>

    <div v-if="fullscreenDevice" class="fullscreen-mask" @click.self="closeFullscreen">
      <div class="fullscreen-panel">
        <div class="tile-head">
          <span class="tile-name">{{ fullscreenDevice.deviceInfoName }} · {{ streamFor(fullscreenDevice) === 'main' ? '主码流' : '副码流' }}</span>
          <el-button link type="danger" @click="closeFullscreen">退出全屏</el-button>
        </div>
        <div class="fullscreen-body">
          <ReVideo :url="fullscreenUrl" :protocol="protocol" :gateway="RTSP_GATEWAY" controls autoplay />
        </div>
      </div>
    </div>

    <!-- 逐设备取流配置：通道 / 主码流 / 副码流 / 取流协议 / 自定义地址（手动兜底） -->
    <ReDialog v-model="repairVisible" :title="repairTitle" width="560px" :close-on-click-modal="false">
      <el-form label-position="top" class="dpv-form">
        <ReFormItem label="设备">
          <span class="dpv-form__ro">{{ repairTarget?.deviceInfoName || repairTarget?.deviceInfoId }}</span>
        </ReFormItem>
        <ReFormItem label="通道">
          <ReInputNumber v-model="repairForm.channel" :min="1" :max="512" style="width: 100%" />
          <span class="dpv-form__hint">设备侧通道号；已知通道可直接点选</span>
          <div v-if="repairChannelNos.length" class="dpv-form__chips">
            <button
              v-for="n in repairChannelNos"
              :key="n"
              type="button"
              class="dpv-chip"
              :class="{ on: repairForm.channel === n }"
              @click="repairForm.channel = n"
            >
              CH{{ n }}
            </button>
          </div>
        </ReFormItem>
        <ReFormItem label="码流">
          <el-segmented v-model="repairForm.stream" :options="STREAM_SEGMENTS" />
        </ReFormItem>
        <ReFormItem label="取流协议">
          <el-segmented v-model="repairForm.protocol" :options="protocolSegments" />
        </ReFormItem>
        <ReFormItem label="自定义流地址（兜底）">
          <ReInput v-model="repairForm.url" placeholder="留空则用平台返回的地址；取流失败时填一路自己的地址" clearable />
        </ReFormItem>
      </el-form>
      <template #footer>
        <ReButton v-if="repairHasSaved" @click="clearRepair">清除覆盖</ReButton>
        <ReButton @click="repairVisible = false">取消</ReButton>
        <ReButton type="primary" @click="saveRepair">保存并重载</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RefreshRight, Setting } from '@element-plus/icons-vue'
import ReVideo from '../components/ReVideo.vue'
import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReInput from '@repo/ui/re-input'
import ReInputNumber from '@repo/ui/re-input-number'
import { ReFormItem } from '@repo/ui/re-kit'
import { deviceApi } from '../api/deviceApi'
import type { DeviceInfo } from '../types/device'
import { RTSP_GATEWAY, hasRtspGateway } from '../utils/streamConfig'

const route = useRoute()
const router = useRouter()

const STREAM_SEGMENTS = [
  { label: '主码流', value: 'main' },
  { label: '副码流', value: 'sub' },
]
const protocolSegments = [
  { label: 'HLS', value: 'hls' },
  { label: 'FLV', value: 'flv' },
  { label: 'RTSP', value: 'rtsp' },
]
const layoutSegments = [
  { label: '1x1', value: 1 },
  { label: '2x2', value: 4 },
  { label: '3x3', value: 9 },
  { label: '4x4', value: 16 },
]

interface DeviceStream {
  channel: number
  streamMode: 'main' | 'sub'
}

const devices = ref<DeviceInfo[]>([])
const loading = ref(false)
const layout = ref(Number(route.query.layout) || 4)
const page = ref(0)
const protocol = ref('hls')
const urls = reactive<Record<string, string>>({})
const streamCfg = reactive<Record<string, DeviceStream>>({})
const channelCache = reactive<Record<string, number[]>>({})
const remind = computed(() => route.query.remind === 'true')
const remindVisible = ref(true)
const rotate = ref(false)

const fullscreenDevice = ref<DeviceInfo | null>(null)
const fullscreenUrl = ref('')

/** 逐设备的主/副码流指标 */
function streamFor(d: DeviceInfo): 'main' | 'sub' {
  return streamCfg[d.deviceInfoId]?.streamMode ?? 'main'
}
/** 逐设备的通道号 */
function channelFor(d: DeviceInfo): number {
  return streamCfg[d.deviceInfoId]?.channel ?? 1
}
/** 逐设备的 URL */
function urlFor(d: DeviceInfo): string {
  return urls[d.deviceInfoId] || ''
}
/** 逐设备的取流协议（页面级，RTSP 转流交给 ReVideo 的 gateway 处理） */
function protocolFor(d: DeviceInfo): string {
  return protocol.value
}
/** 逐设备的通道候选（还没拉到时按设备通道数兜底） */
function channelChoices(d: DeviceInfo): number[] {
  const known = channelCache[d.deviceInfoId]
  if (known?.length) return known
  const base = Array.from({ length: Math.max(d.deviceInfoChannelCount ?? 0, 1) }, (_, i) => i + 1)
  const cur = channelFor(d)
  if (!base.includes(cur)) base.push(cur)
  return base
}

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

function toggleRotate() {
  rotate.value = !rotate.value
  if (rotate.value) {
    rotateTimer = setInterval(() => {
      page.value = (page.value + 1) % pageCount.value
    }, 15000)
  } else {
    clearInterval(rotateTimer)
    rotateTimer = undefined
  }
}

async function loadDevices() {
  const idList = String(route.query.ids || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  if (!idList.length) return
  loading.value = true
  try {
    const list = await Promise.all(idList.map((id) => deviceApi.get(id).catch(() => null)))
    devices.value = list.filter((item): item is DeviceInfo => !!item)
    // 把通道号尽早补出来，避免页面初显时用纯编号兜底
    void Promise.all(devices.value.map((d) => loadChannels(d))).catch(() => {})
    loadRepairs()
  } finally {
    loading.value = false
  }
}

async function loadRepairs(): Promise<void> {
  try {
    const raw = localStorage.getItem(REPAIR_KEY) || ''
    const cfgs = JSON.parse(raw) as Record<string, { channel?: number; stream?: 'main' | 'sub'; protocol?: string; url?: string }>
    for (const device of devices.value) {
      const cfg = cfgs[device.deviceInfoId]
      if (!cfg) continue
      streamCfg[device.deviceInfoId] = {
        channel: cfg.channel ?? channelFor(device),
        streamMode: cfg.stream ?? 'main',
      }
      repairs.value[device.deviceInfoId] = cfg
    }
  } catch {
    /* ignore */
  }
}

async function loadStreams() {
  await Promise.all(
    pageDevices.value.map(async (device) => {
      const cfg = repairs.value[device.deviceInfoId] ?? {}
      if (cfg.url) {
        urls[device.deviceInfoId] = cfg.url
        return
      }
      try {
        const cfg_ = streamCfg[device.deviceInfoId] ?? { channel: 1, streamMode: 'main' }
        const url = await deviceApi.getVideoStream(device.deviceInfoId, cfg_.channel, protocol.value, cfg_.streamMode)
        urls[device.deviceInfoId] = String(url || '')
      } catch {
        urls[device.deviceInfoId] = ''
      }
    })
  )
}

/** 逐设备的通道、码流变更：立即取流并记忆（页面刷新前重试以下一次为准） */
function onDeviceChannel(d: DeviceInfo, value: number): void {
  streamCfg[d.deviceInfoId] = { channel: Number(value), streamMode: streamFor(d) }
  void loadStreams()
}

function onDeviceStream(d: DeviceInfo, value: string): void {
  streamCfg[d.deviceInfoId] = { channel: channelFor(d), streamMode: value as 'main' | 'sub' }
  void loadStreams()
}

async function loadChannels(d: DeviceInfo): Promise<void> {
  if (channelCache[d.deviceInfoId]?.length) return
  try {
    const list = (await deviceApi.listChannels(d.deviceInfoId)) as { deviceChannelNo: number }[]
    if (list.length) channelCache[d.deviceInfoId] = list.map((i) => i.deviceChannelNo)
  } catch {
    /* 忽略：通道候选有兜底 */
  }
}

/** 逐设备手动兜底配置的本地键（按设备存；后端没有「自定义流地址」接口） */
const REPAIR_KEY = 'device:preview-wall-repair'

/** 逐设备那段手动修复配置 */
const repairs = ref<Record<string, { channel?: number; stream?: 'main' | 'sub'; protocol?: string; url?: string }>>({})
const repairVisible = ref(false)
const repairTarget = ref<DeviceInfo | null>(null)
const repairForm = reactive({ channel: 1, stream: 'main' as string, protocol: 'hls' as string, url: '' })

/** 修过的设备可选通道（去掉已经修过的推导） */
const repairChannelNos = computed(() =>
  repairTarget.value ? (channelCache[repairTarget.value.deviceInfoId] || []) : [],
)
const repairTitle = computed(() => `取流配置 · ${repairTarget.value?.deviceInfoName || ''}`)
const repairHasSaved = computed(() => !!repairTarget.value && !!repairs.value[repairTarget.value.deviceInfoId])

function openRepair(d: DeviceInfo): void {
  const cfg = repairs.value[d.deviceInfoId] ?? {}
  repairTarget.value = d
  repairForm.channel = cfg.channel ?? channelFor(d)
  repairForm.stream = cfg.stream ?? streamFor(d)
  repairForm.protocol = cfg.protocol ?? protocol.value
  repairForm.url = cfg.url ?? ''
  streamCfg[d.deviceInfoId] = {
    channel: repairForm.channel,
    streamMode: repairForm.stream as 'main' | 'sub',
  }
  repairVisible.value = true
  void loadChannels(d)
}

function saveRepair(): void {
  const d = repairTarget.value
  if (!d) return
  repairs.value = {
    ...repairs.value,
    [d.deviceInfoId]: {
      channel: repairForm.channel,
      stream: repairForm.stream as 'main' | 'sub',
      protocol: repairForm.protocol,
      url: repairForm.url,
    },
  }
  streamCfg[d.deviceInfoId] = { channel: repairForm.channel, streamMode: repairForm.stream as 'main' | 'sub' }
  persistRepairs()
  repairVisible.value = false
  void loadStreams()
}

function clearRepair(): void {
  const d = repairTarget.value
  if (!d) return
  delete repairs.value[d.deviceInfoId]
  persistRepairs()
  delete streamCfg[d.deviceInfoId]
  repairForm.channel = 1
  repairForm.stream = 'main'
  repairForm.protocol = 'hls'
  repairForm.url = ''
  repairVisible.value = false
}

function persistRepairs(): void {
  try {
    localStorage.setItem(REPAIR_KEY, JSON.stringify(repairs.value))
  } catch {
    /* ignore */
  }
}

/** 手动点一下断掉的流重试一次 */
async function onRestart(d: DeviceInfo): Promise<void> {
  try {
    const cfg = streamCfg[d.deviceInfoId] ?? { channel: 1, streamMode: 'main' }
    urls[d.deviceInfoId] = String(await deviceApi.getVideoStream(d.deviceInfoId, cfg.channel, protocol.value, cfg.streamMode) || '')
  } catch {
    urls[d.deviceInfoId] = ''
  }
}

async function openFullscreen(device: DeviceInfo) {
  fullscreenDevice.value = device
  fullscreenUrl.value = ''
  try {
    const cfg = streamCfg[device.deviceInfoId] ?? { channel: 1, streamMode: 'main' }
    const url = await deviceApi.getVideoStream(device.deviceInfoId, cfg.channel, protocol.value, cfg.streamMode)
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
watch([pageDevices, protocol], loadStreams)
/** 逐设备的主/副码流 & 通道变更后即时取流 */
watch(streamCfg, loadStreams, { deep: true })

onBeforeUnmount(() => {
  if (rotateTimer) clearInterval(rotateTimer)
})

loadDevices().then(() => {})
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
  transition: border-color 0.2s ease;
}
.wall-tile.offline {
  border-color: var(--el-border-color-lighter);
  opacity: 0.55;
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
.tile-head__op {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #fff;
  background: color-mix(in srgb, #fff 14%, transparent);
  cursor: pointer;
  opacity: 0.7;
  transition: background 0.15s ease, opacity 0.15s ease;
}
.tile-head__op:hover {
  background: color-mix(in srgb, var(--el-color-primary) 25%, transparent);
  opacity: 1;
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
.tile-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: var(--el-fill-color-lighter);
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
}
.tile-foot .el-segmented {
  font-size: 12px;
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
