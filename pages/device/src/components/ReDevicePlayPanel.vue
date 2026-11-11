<template>
  <div class="dpw">
    <header class="dpw__head">
      <div class="dpw__ident">
        <span class="dpw__live"><i />LIVE</span>
        <b class="dpw__title">{{ wallMode ? '设备大屏' : device?.deviceInfoName || '播放' }}</b>
        <template v-if="wallMode">
          <span class="dpw__meta mono">{{ sources.length }} 路源 · {{ tiles.length }}/{{ layoutSize }} 在播</span>
        </template>
        <template v-else>
          <span class="dpw__meta mono">{{ device?.deviceInfoIp || '平台接入' }} · CH{{ currentChannel }}</span>
        </template>
        <span class="dpw__meta">{{ protocol.toUpperCase() }} / {{ streamType === 'main' ? '主码流' : '子码流' }}</span>
      </div>
      <div class="dpw__ops">
        <el-select
          v-if="!wallMode"
          v-model="currentChannel"
          size="small"
          style="width: 118px"
          @change="reload"
        >
          <el-option v-for="ch in channelOptions" :key="ch.no" :label="ch.name" :value="ch.no" />
        </el-select>
        <el-segmented v-model="streamType" :options="streamSegments" size="small" @change="reload" />
        <el-segmented v-model="protocol" :options="protocolSegments" size="small" @change="reload" />
        <el-segmented v-model="layout" :options="layoutSegments" size="small" />
        <ReButton icon="RefreshRight" layout="square" tip="重载当前画面" :loading="loading" @click="reload" />
        <ReButton
          icon="Grid"
          layout="square"
          :tip="wallMode ? '按布局铺满画面源' : '按布局补齐通道'"
          :disabled="!playable"
          @click="fillFromChannels"
        />
        <ReButton
          v-if="wallMode"
          icon="Delete"
          layout="square"
          tip="清空画面墙"
          :disabled="!tiles.length"
          @click="clearWall"
        />
      </div>
    </header>

    <div class="dpw__body">
      <!-- 左：可拖拽的画面源（本设备通道 + 同厂商可播放设备） -->
      <aside class="dpw__side">
        <div class="dpw__side-head">
          <span class="dpw__side-title">画面源</span>
          <span class="dpw__side-count">{{ sources.length }}</span>
        </div>
        <ReInput v-model="keyword" placeholder="搜索设备 / 通道" clearable prefix-icon="Search" class="dpw__search" />
        <ReScrollbar class="dpw__sources">
          <div
            v-for="source in filteredSources"
            :key="source.key"
            class="dpw-src"
            :class="{ 'is-used': usedKeys.has(source.key) }"
            draggable="true"
            :title="source.label"
            @dragstart="onDragStart($event, source)"
            @dragend="dragging = null"
            @click="addSource(source)"
          >
            <span class="dpw-src__grip"><ReIcon name="Rank" :size="12" /></span>
            <ReIcon :name="source.icon" :size="14" class="dpw-src__icon" />
            <span class="dpw-src__text">
              <b>{{ source.label }}</b>
              <span class="mono">{{ source.sub }}</span>
            </span>
            <i class="dpw-src__dot" :class="source.online ? 'is-on' : 'is-off'" />
          </div>
          <div v-if="!filteredSources.length" class="dpw__side-empty">没有可播放的设备 / 通道</div>
        </ReScrollbar>
        <p class="dpw__side-tip">
          {{ wallMode
            ? '从左侧把设备通道拖到任意格子，随时拼出自己的一块大屏；拖到空白处追加，单击=放进第一个空格。'
            : '拖到右侧画面格子里替换该格，或拖到空白处追加；单击=放进第一个空格。' }}
        </p>
      </aside>

      <!-- 右：画面墙 -->
      <section class="dpw__wall" :class="{ 'is-dragging': !!dragging }" @dragover.prevent @drop="onWallDrop($event, -1)">
        <div class="dpw__grid" :style="gridStyle">
          <article
            v-for="(tile, index) in tiles"
            :key="tile.key"
            class="dpw-tile"
            :class="{ 'is-over': overIndex === index }"
            draggable="true"
            @dragstart.stop="onTileDragStart($event, index)"
            @dragover.prevent="overIndex = index"
            @dragleave="overIndex === index && (overIndex = -1)"
            @drop.prevent.stop="onWallDrop($event, index)"
          >
            <ReVideo
              :url="tile.url"
              :protocol="tile.protocol"
              :channel="tile.channel"
              :gateway="RTSP_GATEWAY"
              class="dpw-tile__video"
            />
            <div class="dpw-tile__bar">
              <span class="dpw-tile__name" :title="tile.label">{{ tile.label }}</span>
              <span class="dpw-tile__ch mono">CH{{ tile.channel }}</span>
              <button type="button" class="dpw-tile__op" title="关闭该画面" @click="removeTile(index)">
                <ReIcon name="Close" :size="11" />
              </button>
            </div>
          </article>

          <!-- 空格子：拖进来即落位 -->
          <article
            v-for="slot in emptySlots"
            :key="`empty-${slot}`"
            class="dpw-tile is-empty"
            :class="{ 'is-over': overIndex === tiles.length + slot - 1 }"
            @dragover.prevent="overIndex = tiles.length + slot - 1"
            @dragleave="overIndex === tiles.length + slot - 1 && (overIndex = -1)"
            @drop.prevent.stop="onWallDrop($event, tiles.length + slot - 1)"
          >
            <span class="dpw-tile__ghost">
              <ReIcon name="VideoCamera" :size="18" />
              拖入画面源
            </span>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 播放页签（纯播放，不含台账）
 *
 * <p>与详情页「视频」页签的分工：详情是设备档案 + 顺手看画面，
 * 播放页签只做一件事——盯画面。左侧是画面源（本设备各通道 + 同厂商其它可播放设备），
 * 拖到右侧任何格子里替换该格，拖到空白处追加，用来现场临拼一个临时画面墙。</p>
 *
 * <p>取流走 {@code deviceApi.getVideoStream}，与详情 / 视频预览页同一条链路，
 * 不额外引入第二套播放逻辑。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref, watch } from 'vue'
import ReButton from '@repo/ui/re-button'
import ReIcon from '@repo/ui/re-icon'
import ReInput from '@repo/ui/re-input'
import ReScrollbar from '@repo/ui/re-scrollbar'
import ReVideo from '../components/ReVideo.vue'
import { RTSP_GATEWAY } from '../utils/streamConfig'
import { getCategoryIcon } from '../utils/deviceCategory'
import { isPlayable } from '../utils/deviceCapability'
import { deviceApi } from '../api/deviceApi'
import type { DeviceInfo, DeviceVendorDescriptor } from '../types/device'

const props = defineProps<{
  device: DeviceInfo | null
  /** 可参与拼墙的设备（同厂商 / 全部） */
  devices: DeviceInfo[]
  vendors: DeviceVendorDescriptor[]
  /**
   * 形态：
   * - device：设备页签，画面源以这台设备的通道为主
   * - wall：设备大屏弹窗，画面源是全部可播放设备
   */
  mode?: 'device' | 'wall'
}>()

/** 一个画面源：某台设备的某个通道 */
interface PlaySource {
  key: string
  deviceId: string
  channel: number
  label: string
  sub: string
  icon: string
  online: boolean
}

/** 墙上的一个画面 */
interface Tile {
  key: string
  url: string
  label: string
  channel: number
  protocol: string
  sourceKey: string
}

const channelOptions = ref<{ no: number; name: string }[]>([])
const currentChannel = ref(1)
const streamType = ref<'main' | 'sub'>('main')
const protocol = ref('hls')
const layout = ref('4')
const loading = ref(false)

/** 设备大屏形态：画面源来自全部可播放设备，不绑定单台设备 */
const wallMode = computed(() => props.mode === 'wall')

const streamSegments = [
  { label: '主码流', value: 'main' },
  { label: '子码流', value: 'sub' }
]
const protocolSegments = [
  { label: 'HLS', value: 'hls' },
  { label: 'FLV', value: 'flv' },
  { label: 'RTSP', value: 'rtsp' }
]
const layoutSegments = [
  { label: '1', value: '1' },
  { label: '4', value: '4' },
  { label: '9', value: '9' },
  { label: '16', value: '16' }
]

const tiles = ref<Tile[]>([])
const keyword = ref('')
const dragging = ref<PlaySource | null>(null)
const overIndex = ref(-1)

const playable = computed(() =>
  wallMode.value
    ? props.devices.some((device) => isPlayable(device, props.vendors))
    : isPlayable(props.device, props.vendors)
)
const layoutSize = computed(() => Number(layout.value) || 4)
const emptySlots = computed(() => Math.max(0, layoutSize.value - tiles.value.length))
const usedKeys = computed(() => new Set(tiles.value.map((tile) => tile.sourceKey)))

const gridStyle = computed(() => {
  const columns = Math.round(Math.sqrt(layoutSize.value)) || 1
  return { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
})

/** 本设备的通道数：优先接口，退化为 deviceInfoChannelCount */
function channelCountOf(device: DeviceInfo): number {
  return Math.max(device.deviceInfoChannelCount || 1, 1)
}

/**
 * 画面源。
 *
 * <p>设备页签：本设备通道全列出，同厂商其它可播放设备各补 1 路；
 * 大屏形态：全部可播放设备，每台最多取 4 路通道，方便现场自由拼墙。</p>
 */
const sources = computed<PlaySource[]>(() => {
  const out: PlaySource[] = []
  const push = (device: DeviceInfo, channel: number, channelName?: string) => {
    out.push({
      key: `${device.deviceInfoId}#${channel}`,
      deviceId: device.deviceInfoId,
      channel,
      label: channelName || device.deviceInfoName || device.deviceInfoId,
      sub: `${device.deviceInfoName || device.deviceInfoId} · CH${channel}`,
      icon: getCategoryIcon(device.deviceInfoCategory),
      online: !!device.deviceInfoOnline
    })
  }
  if (wallMode.value) {
    for (const device of props.devices) {
      if (!device.deviceInfoId || !isPlayable(device, props.vendors)) continue
      const count = Math.min(channelCountOf(device), 4)
      for (let channel = 1; channel <= count; channel += 1) push(device, channel)
    }
    return out
  }
  if (props.device) {
    const list = channelOptions.value.length
      ? channelOptions.value
      : Array.from({ length: channelCountOf(props.device) }, (_, index) => ({
          no: index + 1,
          name: `通道 ${index + 1}`
        }))
    for (const ch of list) push(props.device, ch.no, ch.name)
  }
  // 同厂商的其它可播放设备：每台先给第 1 路，现场拼墙够用且列表不至于爆炸
  for (const device of props.devices) {
    if (!device.deviceInfoId || device.deviceInfoId === props.device?.deviceInfoId) continue
    if (device.deviceInfoVendor !== props.device?.deviceInfoVendor) continue
    if (!isPlayable(device, props.vendors)) continue
    push(device, 1)
  }
  return out
})

const filteredSources = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return sources.value
  return sources.value.filter((source) =>
    `${source.label} ${source.sub}`.toLowerCase().includes(kw)
  )
})

/** 取流地址（失败返回空串，画面显示占位而不是整页报错） */
async function streamUrl(deviceId: string, channel: number): Promise<string> {
  try {
    const res = await deviceApi.getVideoStream(deviceId, channel, protocol.value, streamType.value)
    return String(res || '')
  } catch {
    return ''
  }
}

/** 把画面源变成墙上的一个画面 */
async function makeTile(source: PlaySource): Promise<Tile> {
  return {
    key: `${source.key}-${Date.now()}`,
    url: await streamUrl(source.deviceId, source.channel),
    label: source.label,
    channel: source.channel,
    protocol: protocol.value,
    sourceKey: source.key
  }
}

/** 重载全部画面（换协议 / 换码流 / 通道后统一走这里） */
async function reload(): Promise<void> {
  if (wallMode.value) {
    if (!tiles.value.length) return
    loading.value = true
    try {
      tiles.value = await Promise.all(
        tiles.value.map(async (tile) => {
          const [deviceId] = tile.sourceKey.split('#')
          return { ...tile, url: await streamUrl(deviceId, tile.channel), protocol: protocol.value }
        })
      )
    } finally {
      loading.value = false
    }
    return
  }
  if (!props.device) return
  loading.value = true
  try {
    // 单画面：直接刷新当前通道
    if (!tiles.value.length) {
      const source: PlaySource = {
        key: `${props.device.deviceInfoId}#${currentChannel.value}`,
        deviceId: props.device.deviceInfoId,
        channel: currentChannel.value,
        label: props.device.deviceInfoName || props.device.deviceInfoId,
        sub: '',
        icon: '',
        online: !!props.device.deviceInfoOnline
      }
      tiles.value = [await makeTile(source)]
      return
    }
    tiles.value = await Promise.all(
      tiles.value.map(async (tile) => {
        const [deviceId] = tile.sourceKey.split('#')
        return { ...tile, url: await streamUrl(deviceId, tile.channel), protocol: protocol.value }
      })
    )
  } finally {
    loading.value = false
  }
}

async function loadChannels(): Promise<void> {
  if (!props.device) return
  try {
    const res = (await deviceApi.listChannels(props.device.deviceInfoId)) as Array<{
      deviceChannelNo: number
      deviceChannelName?: string
    }>
    channelOptions.value = (res || []).map((item) => ({
      no: item.deviceChannelNo,
      name: item.deviceChannelName || `通道 ${item.deviceChannelNo}`
    }))
  } catch {
    channelOptions.value = []
  }
  currentChannel.value = channelOptions.value[0]?.no || 1
}

/** 单击画面源：放进第一个空格（满了就替换第一格） */
async function addSource(source: PlaySource): Promise<void> {
  if (tiles.value.length >= layoutSize.value) {
    tiles.value.splice(0, 1)
  }
  const tile = await makeTile(source)
  tiles.value = [...tiles.value, tile]
}

function onDragStart(event: DragEvent, source: PlaySource): void {
  dragging.value = source
  event.dataTransfer?.setData('text/plain', source.key)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy'
}

function onTileDragStart(event: DragEvent, index: number): void {
  // 格子之间也能拖：挪位置
  const tile = tiles.value[index]
  dragging.value = {
    key: tile.sourceKey,
    deviceId: tile.sourceKey.split('#')[0],
    channel: tile.channel,
    label: tile.label,
    sub: '',
    icon: '',
    online: true
  }
  event.dataTransfer?.setData('text/plain', tile.sourceKey)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

/** 落到某一格（-1 = 墙上的空白区域，追加） */
async function onWallDrop(event: DragEvent, index: number): Promise<void> {
  event.preventDefault()
  overIndex.value = -1
  const source = dragging.value
  dragging.value = null
  if (!source) return
  const tile = await makeTile(source)
  if (index < 0 || index >= tiles.value.length) {
    if (tiles.value.length >= layoutSize.value) tiles.value = tiles.value.slice(0, layoutSize.value - 1)
    tiles.value = [...tiles.value, tile]
    return
  }
  const next = [...tiles.value]
  next.splice(index, 1, tile)
  tiles.value = next
}

function removeTile(index: number): void {
  tiles.value = tiles.value.filter((_, i) => i !== index)
}

/** 按布局铺满：设备页签补本机通道，大屏形态铺画面源 */
async function fillFromChannels(): Promise<void> {
  const size = layoutSize.value
  if (wallMode.value) {
    const list = sources.value
    if (!list.length) return
    const next: Tile[] = []
    for (let i = 0; i < size; i += 1) {
      const source = list[i % list.length]
      const tile = await makeTile(source)
      next.push({ ...tile, key: `${tile.key}-slot${i}` })
    }
    tiles.value = next
    return
  }
  if (!props.device) return
  const list = channelOptions.value.length
    ? channelOptions.value.map((ch) => ch.no)
    : Array.from({ length: channelCountOf(props.device) }, (_, index) => index + 1)
  const next: Tile[] = []
  for (let i = 0; i < size; i += 1) {
    const channel = list[i % list.length]
    next.push({
      key: `${props.device.deviceInfoId}#${channel}-slot${i}`,
      url: await streamUrl(props.device.deviceInfoId, channel),
      label: props.device.deviceInfoName || props.device.deviceInfoId,
      channel,
      protocol: protocol.value,
      sourceKey: `${props.device.deviceInfoId}#${channel}`
    })
  }
  tiles.value = next
}

/** 清空画面墙 */
function clearWall(): void {
  tiles.value = []
}

/**
 * 初始化 / 换设备。
 *
 * <p>设备页签：重置后直接播第 1 路；
 * 大屏形态：打开即预铺 4 格，先给出一个能看的画面墙，再让用户拖拽调整。</p>
 */
watch(
  () => [props.mode, props.device?.deviceInfoId] as const,
  async () => {
    tiles.value = []
    if (wallMode.value) {
      await fillFromChannels()
      return
    }
    await loadChannels()
    if (props.device) reload()
  },
  { immediate: true }
)

/** 布局缩小：多出来的画面直接裁掉 */
watch(layoutSize, (size) => {
  if (tiles.value.length > size) tiles.value = tiles.value.slice(0, size)
})

defineExpose({ reload })
</script>

<style scoped>
.dpw {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
}

.dpw__head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 7px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
}
.dpw__ident { display: flex; align-items: center; gap: 8px; min-width: 0; }
.dpw__live {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}
.dpw__live i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--el-color-danger);
}
.dpw__title { font-size: 13px; }
.dpw__meta { font-size: 11.5px; color: var(--el-text-color-secondary); }
.dpw__ops { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

.dpw__body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 8px;
}

/* 左：画面源 */
.dpw__side {
  flex: none;
  width: 212px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
}
.dpw__side-head { display: flex; align-items: center; gap: 6px; }
.dpw__side-title { font-size: 12px; font-weight: 600; }
.dpw__side-count {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 999px;
  padding: 0 6px;
}
.dpw__search { flex: none; }
.dpw__sources { flex: 1; min-height: 0; }
.dpw__side-tip {
  margin: 0;
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
.dpw__side-empty { padding: 16px 4px; font-size: 11.5px; color: var(--el-text-color-secondary); text-align: center; }

.dpw-src {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border-radius: 8px;
  cursor: grab;
  color: var(--el-text-color-regular);
}
.dpw-src:hover { background: var(--el-fill-color-light); }
.dpw-src.is-used { opacity: 0.55; }
.dpw-src__grip { color: var(--el-text-color-placeholder); }
.dpw-src__icon { flex: none; color: var(--el-text-color-secondary); }
.dpw-src__text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.dpw-src__text b {
  font-size: 11.5px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dpw-src__text span {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dpw-src__dot { flex: none; width: 6px; height: 6px; border-radius: 50%; }
.dpw-src__dot.is-on { background: var(--el-color-success); }
.dpw-src__dot.is-off { background: var(--el-text-color-placeholder); }

/* 右：画面墙 */
.dpw__wall {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-blank, var(--el-bg-color));
}
.dpw__wall.is-dragging { border-color: var(--el-color-primary-light-5); }
.dpw__grid {
  display: grid;
  gap: 6px;
  height: 100%;
  grid-auto-rows: 1fr;
}
.dpw-tile {
  position: relative;
  min-height: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #0b0f16;
  outline: 1px solid transparent;
}
.dpw-tile.is-over { outline: 2px dashed var(--el-color-primary); }
.dpw-tile__video { width: 100%; height: 100%; }
.dpw-tile__bar {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.62));
  color: #e8f1ff;
}
.dpw-tile__name {
  flex: 1;
  min-width: 0;
  font-size: 10.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dpw-tile__ch { font-size: 10px; opacity: 0.75; }
.dpw-tile__op {
  display: inline-flex;
  border: none;
  background: rgba(255, 255, 255, 0.14);
  color: inherit;
  border-radius: 4px;
  padding: 1px 3px;
  cursor: pointer;
}
.dpw-tile.is-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-linear-gradient(
    45deg,
    var(--el-fill-color-light),
    var(--el-fill-color-light) 6px,
    transparent 6px,
    transparent 12px
  );
}
.dpw-tile__ghost {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
</style>
