<template>
  <div class="dpw">
    <header class="dpw__head">
      <div class="dpw__ident">
        <span class="dpw__live"><i />LIVE</span>
        <b class="dpw__title">{{ wallMode ? 'Φ«╛σñçσñºσ▒Å' : device?.deviceInfoName || 'µÆ¡µö╛' }}</b>
        <template v-if="wallMode">
          <span class="dpw__meta mono">{{ sources.length }} Φ╖»µ║É ┬╖ {{ tiles.length }}/{{ layoutSize }} σ£¿µÆ¡</span>
        </template>
        <template v-else>
          <span class="dpw__meta mono">{{ device?.deviceInfoIp || 'σ╣│σÅ░µÄÑσàÑ' }} ┬╖ CH{{ currentChannel }}</span>
        </template>
        <span class="dpw__meta">{{ protocol.toUpperCase() }} / {{ streamType === 'main' ? 'Σ╕╗τáüµ╡ü' : 'σ¡Éτáüµ╡ü' }}</span>
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
        <ReButton icon="RefreshRight" layout="square" tip="ΘçìΦ╜╜σ╜ôσëìτö╗Θ¥ó" :loading="loading" @click="reload" />
        <ReButton
          icon="Grid"
          layout="square"
          :tip="wallMode ? 'µîëσ╕âσ▒ÇΘô║µ╗íτö╗Θ¥óµ║É' : 'µîëσ╕âσ▒ÇΦíÑΘ╜ÉΘÇÜΘüô'"
          :disabled="!playable"
          @click="fillFromChannels"
        />
        <ReButton
          v-if="wallMode"
          icon="Delete"
          layout="square"
          tip="µ╕àτ⌐║τö╗Θ¥óσóÖ"
          :disabled="!tiles.length"
          @click="clearWall"
        />
      </div>
    </header>

    <div class="dpw__body">
      <!-- σ╖ª∩╝ÜσÅ»µïûµï╜τÜäτö╗Θ¥óµ║É∩╝êµ£¼Φ«╛σñçΘÇÜΘüô + σÉîσÄéσòåσÅ»µÆ¡µö╛Φ«╛σñç∩╝ë -->
      <aside class="dpw__side">
        <div class="dpw__side-head">
          <span class="dpw__side-title">τö╗Θ¥óµ║É</span>
          <span class="dpw__side-count">{{ sources.length }}</span>
        </div>
        <ReInput v-model="keyword" placeholder="µÉ£τ┤óΦ«╛σñç / ΘÇÜΘüô" clearable prefix-icon="Search" class="dpw__search" />
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
          <div v-if="!filteredSources.length" class="dpw__side-empty">µ▓íµ£ëσÅ»µÆ¡µö╛τÜäΦ«╛σñç / ΘÇÜΘüô</div>
        </ReScrollbar>
        <p class="dpw__side-tip">
          {{ wallMode
            ? 'Σ╗Äσ╖ªΣ╛ºµèèΦ«╛σñçΘÇÜΘüôµïûσê░Σ╗╗µäÅµá╝σ¡É∩╝îΘÜÅµù╢µï╝σç║Φç¬σ╖▒τÜäΣ╕Çσ¥ùσñºσ▒Å∩╝¢µïûσê░τ⌐║τÖ╜σñäΦ┐╜σèá∩╝îσìòσç╗=µö╛Φ┐¢τ¼¼Σ╕ÇΣ╕¬τ⌐║µá╝πÇé'
            : 'µïûσê░σÅ│Σ╛ºτö╗Θ¥óµá╝σ¡ÉΘçîµ¢┐µìóΦ»Ñµá╝∩╝îµêûµïûσê░τ⌐║τÖ╜σñäΦ┐╜σèá∩╝¢σìòσç╗=µö╛Φ┐¢τ¼¼Σ╕ÇΣ╕¬τ⌐║µá╝πÇé' }}
        </p>
      </aside>

      <!-- σÅ│∩╝Üτö╗Θ¥óσóÖ -->
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
              <button type="button" class="dpw-tile__op" title="σà│Θù¡Φ»Ñτö╗Θ¥ó" @click="removeTile(index)">
                <ReIcon name="Close" :size="11" />
              </button>
            </div>
          </article>

          <!-- τ⌐║µá╝σ¡É∩╝ÜµïûΦ┐¢µ¥Ñσì│ΦÉ╜Σ╜ì -->
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
              µïûσàÑτö╗Θ¥óµ║É
            </span>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * µÆ¡µö╛Θí╡τ¡╛∩╝êτ║»µÆ¡µö╛∩╝îΣ╕ìσÉ½σÅ░Φ┤ª∩╝ë
 *
 * <p>Σ╕ÄΦ»ªµâàΘí╡πÇîΦºåΘóæπÇìΘí╡τ¡╛τÜäσêåσ╖Ñ∩╝ÜΦ»ªµâàµÿ»Φ«╛σñçµíúµíê + Θí║µëïτ£ïτö╗Θ¥ó∩╝î
 * µÆ¡µö╛Θí╡τ¡╛σÅ¬σüÜΣ╕ÇΣ╗╢Σ║ïΓÇöΓÇöτ¢»τö╗Θ¥óπÇéσ╖ªΣ╛ºµÿ»τö╗Θ¥óµ║É∩╝êµ£¼Φ«╛σñçσÉäΘÇÜΘüô + σÉîσÄéσòåσà╢σ«âσÅ»µÆ¡µö╛Φ«╛σñç∩╝ë∩╝î
 * µïûσê░σÅ│Σ╛ºΣ╗╗Σ╜òµá╝σ¡ÉΘçîµ¢┐µìóΦ»Ñµá╝∩╝îµïûσê░τ⌐║τÖ╜σñäΦ┐╜σèá∩╝îτö¿µ¥ÑτÄ░σ£║Σ╕┤µï╝Σ╕ÇΣ╕¬Σ╕┤µù╢τö╗Θ¥óσóÖπÇé</p>
 *
 * <p>σÅûµ╡üΦ╡░ {@code deviceApi.getVideoStream}∩╝îΣ╕ÄΦ»ªµâà / ΦºåΘóæΘóäΦºêΘí╡σÉîΣ╕Çµ¥íΘô╛Φ╖»∩╝î
 * Σ╕ìΘó¥σñûσ╝òσàÑτ¼¼Σ║îσÑùµÆ¡µö╛ΘÇ╗Φ╛æπÇé</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref, watch } from 'vue'
import ReButton from '@repo/ui/re-button'
import ReIcon from '@repo/ui/re-icon'
import ReInput from '@repo/ui/re-input'
import ReScrollbar from '@repo/ui/re-scrollbar'
import ReVideo from '@pages/device/src/components/ReVideo.vue'
import { RTSP_GATEWAY } from '@pages/device/src/utils/streamConfig'
import { getCategoryIcon } from '@pages/device/src/utils/deviceCategory'
import { isPlayable } from '@pages/device/src/utils/deviceCapability'
import { deviceApi } from '@pages/device/src/api/deviceApi'
import type { DeviceInfo, DeviceVendorDescriptor } from '@pages/device/src/types/device'

const props = defineProps<{
  device: DeviceInfo | null
  /** σÅ»σÅéΣ╕Äµï╝σóÖτÜäΦ«╛σñç∩╝êσÉîσÄéσòå / σà¿Θâ¿∩╝ë */
  devices: DeviceInfo[]
  vendors: DeviceVendorDescriptor[]
  /**
   * σ╜óµÇü∩╝Ü
   * - device∩╝ÜΦ«╛σñçΘí╡τ¡╛∩╝îτö╗Θ¥óµ║ÉΣ╗ÑΦ┐ÖσÅ░Φ«╛σñçτÜäΘÇÜΘüôΣ╕║Σ╕╗
   * - wall∩╝ÜΦ«╛σñçσñºσ▒Åσ╝╣τ¬ù∩╝îτö╗Θ¥óµ║Éµÿ»σà¿Θâ¿σÅ»µÆ¡µö╛Φ«╛σñç
   */
  mode?: 'device' | 'wall'
}>()

/** Σ╕ÇΣ╕¬τö╗Θ¥óµ║É∩╝ÜµƒÉσÅ░Φ«╛σñçτÜäµƒÉΣ╕¬ΘÇÜΘüô */
interface PlaySource {
  key: string
  deviceId: string
  channel: number
  label: string
  sub: string
  icon: string
  online: boolean
}

/** σóÖΣ╕èτÜäΣ╕ÇΣ╕¬τö╗Θ¥ó */
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

/** Φ«╛σñçσñºσ▒Åσ╜óµÇü∩╝Üτö╗Θ¥óµ║Éµ¥ÑΦç¬σà¿Θâ¿σÅ»µÆ¡µö╛Φ«╛σñç∩╝îΣ╕ìτ╗æσ«ÜσìòσÅ░Φ«╛σñç */
const wallMode = computed(() => props.mode === 'wall')

const streamSegments = [
  { label: 'Σ╕╗τáüµ╡ü', value: 'main' },
  { label: 'σ¡Éτáüµ╡ü', value: 'sub' }
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

/** µ£¼Φ«╛σñçτÜäΘÇÜΘüôµò░∩╝ÜΣ╝ÿσàêµÄÑσÅú∩╝îΘÇÇσîûΣ╕║ deviceInfoChannelCount */
function channelCountOf(device: DeviceInfo): number {
  return Math.max(device.deviceInfoChannelCount || 1, 1)
}

/**
 * τö╗Θ¥óµ║ÉπÇé
 *
 * <p>Φ«╛σñçΘí╡τ¡╛∩╝Üµ£¼Φ«╛σñçΘÇÜΘüôσà¿σêùσç║∩╝îσÉîσÄéσòåσà╢σ«âσÅ»µÆ¡µö╛Φ«╛σñçσÉäΦíÑ 1 Φ╖»∩╝¢
 * σñºσ▒Åσ╜óµÇü∩╝Üσà¿Θâ¿σÅ»µÆ¡µö╛Φ«╛σñç∩╝îµ»ÅσÅ░µ£ÇσñÜσÅû 4 Φ╖»ΘÇÜΘüô∩╝îµû╣Σ╛┐τÄ░σ£║Φç¬τö▒µï╝σóÖπÇé</p>
 */
const sources = computed<PlaySource[]>(() => {
  const out: PlaySource[] = []
  const push = (device: DeviceInfo, channel: number, channelName?: string) => {
    out.push({
      key: `${device.deviceInfoId}#${channel}`,
      deviceId: device.deviceInfoId,
      channel,
      label: channelName || device.deviceInfoName || device.deviceInfoId,
      sub: `${device.deviceInfoName || device.deviceInfoId} ┬╖ CH${channel}`,
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
          name: `ΘÇÜΘüô ${index + 1}`
        }))
    for (const ch of list) push(props.device, ch.no, ch.name)
  }
  // σÉîσÄéσòåτÜäσà╢σ«âσÅ»µÆ¡µö╛Φ«╛σñç∩╝Üµ»ÅσÅ░σàêτ╗Öτ¼¼ 1 Φ╖»∩╝îτÄ░σ£║µï╝σóÖσñƒτö¿Σ╕öσêùΦí¿Σ╕ìΦç│Σ║Äτêåτé╕
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

/** σÅûµ╡üσ£░σ¥Ç∩╝êσñ▒Φ┤ÑΦ┐öσ¢₧τ⌐║Σ╕▓∩╝îτö╗Θ¥óµÿ╛τñ║σìáΣ╜ìΦÇîΣ╕ìµÿ»µò┤Θí╡µèÑΘöÖ∩╝ë */
async function streamUrl(deviceId: string, channel: number): Promise<string> {
  try {
    const res = await deviceApi.getVideoStream(deviceId, channel, protocol.value, streamType.value)
    return String(res || '')
  } catch {
    return ''
  }
}

/** µèèτö╗Θ¥óµ║ÉσÅÿµêÉσóÖΣ╕èτÜäΣ╕ÇΣ╕¬τö╗Θ¥ó */
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

/** ΘçìΦ╜╜σà¿Θâ¿τö╗Θ¥ó∩╝êµìóσìÅΦ«« / µìóτáüµ╡ü / ΘÇÜΘüôσÉÄτ╗ƒΣ╕ÇΦ╡░Φ┐ÖΘçî∩╝ë */
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
    // σìòτö╗Θ¥ó∩╝Üτ¢┤µÄÑσê╖µû░σ╜ôσëìΘÇÜΘüô
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
      name: item.deviceChannelName || `ΘÇÜΘüô ${item.deviceChannelNo}`
    }))
  } catch {
    channelOptions.value = []
  }
  currentChannel.value = channelOptions.value[0]?.no || 1
}

/** σìòσç╗τö╗Θ¥óµ║É∩╝Üµö╛Φ┐¢τ¼¼Σ╕ÇΣ╕¬τ⌐║µá╝∩╝êµ╗íΣ║åσ░▒µ¢┐µìóτ¼¼Σ╕Çµá╝∩╝ë */
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
  // µá╝σ¡ÉΣ╣ïΘù┤Σ╣ƒΦâ╜µïû∩╝Üµî¬Σ╜ìτ╜«
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

/** ΦÉ╜σê░µƒÉΣ╕Çµá╝∩╝ê-1 = σóÖΣ╕èτÜäτ⌐║τÖ╜σî║σƒƒ∩╝îΦ┐╜σèá∩╝ë */
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

/** µîëσ╕âσ▒ÇΘô║µ╗í∩╝ÜΦ«╛σñçΘí╡τ¡╛ΦíÑµ£¼µ£║ΘÇÜΘüô∩╝îσñºσ▒Åσ╜óµÇüΘô║τö╗Θ¥óµ║É */
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

/** µ╕àτ⌐║τö╗Θ¥óσóÖ */
function clearWall(): void {
  tiles.value = []
}

/**
 * σê¥σºïσîû / µìóΦ«╛σñçπÇé
 *
 * <p>Φ«╛σñçΘí╡τ¡╛∩╝ÜΘçìτ╜«σÉÄτ¢┤µÄÑµÆ¡τ¼¼ 1 Φ╖»∩╝¢
 * σñºσ▒Åσ╜óµÇü∩╝Üµëôσ╝Çσì│ΘóäΘô║ 4 µá╝∩╝îσàêτ╗Öσç║Σ╕ÇΣ╕¬Φâ╜τ£ïτÜäτö╗Θ¥óσóÖ∩╝îσåìΦ«⌐τö¿µê╖µïûµï╜Φ░âµò┤πÇé</p>
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

/** σ╕âσ▒Çτ╝⌐σ░Å∩╝ÜσñÜσç║µ¥ÑτÜäτö╗Θ¥óτ¢┤µÄÑΦúüµÄë */
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

/* σ╖ª∩╝Üτö╗Θ¥óµ║É */
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

/* σÅ│∩╝Üτö╗Θ¥óσóÖ */
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
