<template>
  <div
    class="dpv"
    :class="{ 'dpv--standalone': standalone }"
    @dragenter="preventNativeDrop"
    @dragover="preventNativeDrop"
    @drop="onGlobalDrop"
  >
    <!-- 独立窗口：只保留一条细工具条（没有外壳的侧栏/顶栏/标签栏） -->
    <header v-if="standalone" class="dpv-std">
      <span class="dpv-std__dot" />
      <span class="dpv-std__title">设备预览 · 独立窗口</span>
      <span class="dpv-std__meta">{{ wall.length }} / {{ layoutSize }} 路 · {{ protocol.toUpperCase() }}</span>
      <div class="dpv-std__ops">
        <ReButton icon="RefreshRight" layout="square" tip="重载全部画面" :loading="reloading" @click="reloadAll" />
        <ReButton icon="Close" layout="square" tip="关闭窗口" @click="closeWindow" />
      </div>
    </header>

    <!-- 向导进入的提示条：携带 ids 参数时展示，可一键关闭 -->
    <div v-if="!standalone && remindBarVisible" class="dpv-remind">
      <span class="dpv-remind__text">
        已按所选设备打开预览：{{ remindText }}
      </span>
      <div class="dpv-remind__ops">
        <ReButton icon="Close" layout="square" tip="关闭提示" @click="dismissRemindBar" />
      </div>
    </div>

    <!-- 概览指标（管理页才有；独立窗口把空间全留给画面） -->
    <section v-if="!standalone" class="dpv-kpis">
      <ReStatCard
        v-for="k in kpis"
        :key="k.key"
        size="compact"
        :title="k.title"
        :value="k.value"
        :desc="k.desc"
        :icon="k.icon"
        :icon-color="k.iconColor"
      />
    </section>

    <div class="dpv-body" :class="`dpv-body--${sideMode}`">
      <!-- 左：可选设备（可拖到右侧预览墙） -->
      <section v-show="sideMode === 'full'" class="dpv-panel dpv-panel--fill dpv-side">
        <header class="dpv-panel__head">
          <span class="dpv-panel__bar" />
          <span>设备清单</span>
          <span class="dpv-panel__count">{{ filteredDevices.length }}</span>
          <div class="dpv-panel__ops">
            <ReButton icon="Fold" layout="square" tip="折叠为导轨" @click="sideMode = 'mini'" />
            <ReButton icon="DArrowLeft" layout="square" tip="隐藏左侧" @click="sideMode = 'hidden'" />
          </div>
        </header>

        <el-segmented v-model="filters.online" :options="onlineSegments" size="small" class="dpv-side__seg" />
        <ReInput
          v-model="keyword"
          class="dpv-side__search"
          placeholder="搜索设备 / IP"
          clearable
          prefix-icon="Search"
        />

        <div v-if="filteredDevices.length" class="dpv-side__list">
          <article
            v-for="d in filteredDevices"
            :key="d.deviceInfoId"
            class="dpv-dev"
            :class="{ 'is-on': isOnWall(d.deviceInfoId) }"
            draggable="true"
            @dragstart="onDeviceDragStart($event, d)"
            @dragend="endDrag"
            @click="onDeviceClick(d)"
          >
            <span class="dpv-dev__grip"><el-icon><Rank /></el-icon></span>
            <span class="dpv-dev__icon"><el-icon><VideoCamera /></el-icon></span>
            <div class="dpv-dev__text">
              <span class="dpv-dev__name">{{ d.deviceInfoName || d.deviceInfoId }}</span>
              <span class="dpv-dev__meta">{{ d.deviceInfoIp || '无 IP' }} · {{ d.deviceInfoVendor || '未知厂商' }}</span>
            </div>
            <ReTag :type="d.deviceInfoOnline ? 'success' : 'info'" size="small" effect="plain">
              {{ d.deviceInfoOnline ? '在线' : '离线' }}
            </ReTag>
          </article>
        </div>

        <article v-else class="dpv-ghost">
          <span class="dpv-ghost__icon"><el-icon><VideoCamera /></el-icon></span>
          <p class="dpv-ghost__title">没有可预览的设备</p>
          <p class="dpv-ghost__desc">
            预览只列出摄像机类设备；先在「提供商配置」登记厂商凭据，设备同步上来后这里就有了。
          </p>
        </article>

        <p v-if="filteredDevices.length" class="dpv-side__tip">
          <el-icon><Rank /></el-icon>
          拖动设备到右侧预览墙，或直接点一下加画面
        </p>
      </section>

      <!-- 左：折叠成导轨 -->
      <button v-if="sideMode === 'mini'" class="dpv-rail" type="button" title="展开设备清单" @click="sideMode = 'full'">
        <el-icon><Expand /></el-icon>
        <span class="dpv-rail__label">设备清单</span>
        <span class="dpv-rail__count">{{ filteredDevices.length }}</span>
      </button>

      <!-- 右：预览墙 -->
      <section class="dpv-panel dpv-panel--fill dpv-wall">
        <header class="dpv-panel__head dpv-panel__head--wall">
          <span class="dpv-panel__bar" />
          <span>预览墙</span>
          <span class="dpv-panel__count">{{ wall.length }} / {{ layoutSize }}</span>
          <div class="dpv-panel__ops">
            <el-segmented v-model="protocol" :options="protocolSegments" size="small" @change="onProtocolChange" />
            <span
              v-if="protocol === 'rtsp' && !hasRtspGateway()"
              class="dpv-rtsp-hint"
              title="RTSP 没有后端转流服务，需服务端转成 FLV / HLS / MP4 后播放"
              >RTSP 需转流</span
            >
            <el-segmented v-model="layout" :options="layoutSegments" size="small" />
            <ReButton icon="RefreshRight" layout="square" tip="重载全部画面" :disabled="!wall.length" :loading="reloading" @click="reloadAll" />
            <el-segmented v-model="viewMode" :options="viewModeSegments" size="small" />
            <ReButton
              v-if="!standalone"
              icon="TopRight"
              layout="square"
              tip="在新窗口打开（只留设备与画面）"
              @click="popout"
            />
            <ReButton icon="Delete" layout="square" tip="清空预览墙" :disabled="!wall.length" @click="clearWall" />
          </div>
        </header>

        <!-- 3D 机柜视图 -->
        <ReMachineRoom
          v-if="viewMode === 'room'"
          :tiles="wall"
          @select="onRoomSelect"
        />

        <!-- 网格视图 -->
        <div
          v-else
          class="dpv-grid"
          :class="{ 'is-dragging': dragActive }"
          :style="gridStyle"
          @dragover.prevent="onGridDragOver"
          @drop.prevent="onGridDrop"
        >
          <article
            v-for="(tile, i) in wall"
            :key="tile.key"
            class="dpv-tile"
            :class="{
              'is-drop': dropIndex === i,
              'is-moving': dragState.kind === 'tile' && dragState.index === i,
            }"
            draggable="true"
            @dragstart="onTileDragStart($event, i)"
            @dragend="endDrag"
            @dragover.prevent="onTileDragOver($event, i)"
            @drop.prevent="onTileDrop($event, i)"
          >
            <ReVideo
              v-if="tile.url"
              :key="`${tile.key}-${tile.url}`"
              :url="tile.url"
              :protocol="effectiveProtocol(tile)"
              :channel="tile.channel"
              :gateway="RTSP_GATEWAY"
              muted
              autoplay
              class="dpv-tile__video"
            />
            <div v-else class="dpv-tile__blank">
              <el-icon class="dpv-tile__blank-icon"><VideoCamera /></el-icon>
              <span class="dpv-tile__blank-text">{{ tile.error || '正在取流...' }}</span>
            </div>

            <header class="dpv-tile__head">
              <span class="dpv-tile__dot" :class="{ 'is-off': !tile.online }" />
              <span class="dpv-tile__name" :title="tile.name">{{ tile.name }}</span>
              <span class="dpv-tile__ch">CH{{ tile.channel }} · {{ tile.stream === 'sub' ? '副码流' : '主码流' }}</span>
              <el-icon class="dpv-tile__op" title="取流配置（手动修复）" @click.stop="openRepair(tile)"><Setting /></el-icon>
              <el-icon class="dpv-tile__op" title="重载这一路" @click.stop="loadStream(tile)"><Refresh /></el-icon>
              <el-icon class="dpv-tile__op" title="移除画面" @click.stop="removeTile(tile.key)"><Close /></el-icon>
            </header>

            <!-- 每路单独切主/副码流与通道 -->
            <footer class="dpv-tile__foot">
              <el-segmented
                :model-value="tile.stream"
                :options="STREAM_SEGMENTS"
                size="small"
                @change="(v: string | number | boolean) => setTileStream(tile, String(v))"
              />
              <el-select
                :model-value="tile.channel"
                size="small"
                class="dpv-tile__chsel"
                @change="(v: number | string) => setTileChannel(tile, Number(v))"
              >
                <el-option v-for="n in channelChoices(tile)" :key="n" :label="`CH${n}`" :value="n" />
              </el-select>
            </footer>
          </article>

          <article
            v-for="n in emptySlots"
            :key="`slot-${n}`"
            class="dpv-tile dpv-tile--empty"
            :class="{ 'is-drop': dropIndex === wall.length + n - 1 }"
            @dragover.prevent="onTileDragOver($event, wall.length + n - 1)"
            @drop.prevent="onTileDrop($event, wall.length + n - 1)"
          >
            <el-icon class="dpv-tile__slot-icon"><VideoCamera /></el-icon>
            <span class="dpv-tile__slot-text">拖设备到这里，或点左侧设备加画面</span>
          </article>
        </div>
      </section>

      <!-- 左：隐藏后的把手 -->
      <button v-if="sideMode === 'hidden'" class="dpv-handle" type="button" @click="sideMode = 'full'">
        <el-icon><DArrowRight /></el-icon>
        <span>设备清单</span>
      </button>
    </div>

    <!-- 取流配置：平台取不到流时手动兜底 -->
    <ReDialog v-model="repairVisible" :title="repairTitle" width="560px" :close-on-click-modal="false">
      <el-form label-position="top" class="dpv-form">
        <ReFormItem label="设备">
          <span class="dpv-form__ro">{{ repairTarget?.name }} · {{ repairTarget?.deviceId }}</span>
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
          <ReInput
            v-model="repairForm.url"
            placeholder="留空则用平台返回的地址；取流失败时填一路自己的地址"
            clearable
          />
          <span class="dpv-form__hint">按设备保存到本机浏览器，只影响本页取流</span>
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
/**
 * 设备预览 —— 多路实时画面墙（管理页 / 独立窗口两种形态）。
 *
 * 数据来自 device-starter 的 `/api/device`：
 *   - GET /list                 可选设备（摄像机类）
 *   - GET /channel/list         设备通道（每路切通道用）
 *   - GET /video/stream         按 设备 + 通道 + 协议 + 码流 取拉流地址
 *
 * 交互：
 *   - 左清单 → 右预览墙 拖拽加画面（也支持点击加入）；
 *   - 墙内画面拖动可换位置；画面顺序 / 布局 / 协议 存本机缓存，重开页面原样恢复；
 *   - 每路画面自带 主/副码流 与 通道 切换；
 *   - 平台取不到流时，用「取流配置」按设备手动兜底（通道 / 码流 / 协议 / 自定义地址，存本机）；
 *   - 「新窗口打开」走 meta.standalone 路由，页面上只剩左侧设备 + 右侧画面。
 *
 * <p>刻意<b>不</b>写地址栏：改 query 会触发路由重渲染（画面重取、看着像刷新），
 * 而且拖一次画面就多一条历史。墙面的状态全部落 localStorage，独立窗口读同一份缓存。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  CircleCheck,
  Close,
  Connection,
  DArrowLeft,
  DArrowRight,
  Expand,
  Fold,
  Grid,
  Rank,
  Refresh,
  Setting,
  TopRight,
  VideoCamera,
} from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReInput from '@repo/ui/re-input'
import ReInputNumber from '@repo/ui/re-input-number'
import { ReFormItem } from '@repo/ui/re-kit'
import ReStatCard from '@repo/ui/re-stat-card'
import ReTag from '@repo/ui/re-tag'

import ReVideo from '../components/ReVideo.vue'
import ReMachineRoom from '../components/ReMachineRoom.vue'
import deviceApi from '../api/deviceApi'
import type { DeviceChannel, DeviceInfo } from '../types/device'
import { RTSP_GATEWAY, hasRtspGateway } from '../utils/streamConfig'

/** 独立窗口形态：路由 props 注入（/device/preview/standalone） */
const props = defineProps<{ standalone?: boolean }>()
const standalone = computed(() => !!props.standalone)

/** 路由（消费向导传入的 ids / layout / remind） */
const route = useRoute()

const REMIND_BAR_KEY = 'device:preview-remind-dismissed'
const remindBarVisible = ref(true)
const remindText = ref('')

/** 从地址栏恢复：ids 为逗号分隔设备 ID；layout 为 1/4/9；remind=false 则不再展示提示条 */
function applyRouteQuery(): { ids: string[]; layout: string | null; remind: boolean } {
  const rawIds = String(route.query.ids || '')
  const ids = rawIds
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const queryLayout = String(route.query.layout || '')
  const remind = route.query.remind !== 'false'
  if (queryLayout && ['1', '4', '9', '16'].includes(queryLayout)) {
    layout.value = queryLayout
  }
  if (ids.length) {
    // 设备清单可能还没加载，提示文本放到设备就绪后补（见 refreshRemindText）
    remindText.value = ids.slice(0, 4).join(', ')
  }
  // 已主动关闭过提示条，或 URL 显式 remind=false → 不再展示
  let dismissed = false
  try {
    dismissed = localStorage.getItem(REMIND_BAR_KEY) === '1'
  } catch {
    /* ignore */
  }
  remindBarVisible.value = ids.length > 0 && remind && !dismissed
  return { ids, layout: queryLayout, remind: remindBarVisible.value }
}

/** 设备清单就绪后把提示条上的名称补全 */
function refreshRemindText(ids: string[]): void {
  if (!ids.length) return
  const names = videoDevices.value
    .filter((d) => ids.includes(d.deviceInfoId))
    .map((d) => d.deviceInfoName || d.deviceInfoId)
  remindText.value = names.length ? names.slice(0, 4).join('、') : ids.slice(0, 4).join(', ')
}

type StreamKey = 'main' | 'sub'

const STREAM_SEGMENTS = [
  { label: '主码流', value: 'main' },
  { label: '副码流', value: 'sub' },
]

const protocolSegments = [
  { label: 'HLS', value: 'hls' },
  { label: 'FLV', value: 'flv' },
  { label: 'RTSP', value: 'rtsp' },
]

const viewModeSegments = [
  { label: '网格', value: 'grid' },
  { label: '机柜', value: 'room' },
]

const layoutSegments = [
  { label: '1 画面', value: '1' },
  { label: '4 画面', value: '4' },
  { label: '9 画面', value: '9' },
  { label: '16 画面', value: '16' },
]

/** 手动兜底配置的本地键（按设备存；后端没有「自定义流地址」接口） */
const REPAIR_KEY = 'device:preview-repair'

/** 预览墙上的一路画面 */
interface Tile {
  key: string
  deviceId: string
  name: string
  channel: number
  stream: StreamKey
  online: boolean
  url: string
  error: string
}

/** 手动修复配置 */
interface RepairCfg {
  channel?: number
  stream?: StreamKey
  protocol?: string
  url?: string
}

const devices = ref<DeviceInfo[]>([])
const wall = ref<Tile[]>([])
const selectedDevice = ref<DeviceInfo | null>(null)
const activeTab = ref('overview')
const keyword = ref('')
const filters = reactive({ online: 'all' })
const protocol = ref('hls')
const layout = ref('4')
const viewMode = ref<'grid' | 'room'>('grid')
const reloading = ref(false)
/** 左侧：完整清单 / 折叠导轨 / 完全隐藏 */
const sideMode = ref<'full' | 'mini' | 'hidden'>('full')
/** 缓存恢复完成前不回写，避免把待恢复的画面又抹掉 */
const ready = ref(false)
/** 被 keep-alive 停掉的画面（回到页面再重新取流） */
const paused = ref(false)

const repairs = ref<Record<string, RepairCfg>>({})
const channelNos = ref<Record<string, number[]>>({})

const repairVisible = ref(false)
const repairTarget = ref<Tile | null>(null)
const repairForm = reactive({ channel: 1, stream: 'main' as string, protocol: 'hls' as string, url: '' })

const layoutSize = computed(() => Number(layout.value) || 4)

/** 可预览设备：摄像机类，或带了通道的设备 */
const videoDevices = computed(() =>
  devices.value.filter((d) => d.deviceInfoCategory === 'camera' || (d.deviceInfoChannelCount ?? 0) > 0),
)

const filteredDevices = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return videoDevices.value.filter((d) => {
    if (filters.online === 'online' && !d.deviceInfoOnline) return false
    if (filters.online === 'offline' && d.deviceInfoOnline) return false
    if (!kw) return true
    return `${d.deviceInfoName || ''} ${d.deviceInfoId} ${d.deviceInfoIp || ''}`.toLowerCase().includes(kw)
  })
})

const onlineCount = computed(() => videoDevices.value.filter((d) => d.deviceInfoOnline).length)

/** 状态筛选：分片（带计数），与「状态」类控件统一用分片插件 */
const onlineSegments = computed(() => [
  { label: `全部 ${videoDevices.value.length}`, value: 'all' },
  { label: `在线 ${onlineCount.value}`, value: 'online' },
  { label: `离线 ${videoDevices.value.length - onlineCount.value}`, value: 'offline' },
])

const emptySlots = computed(() => Math.max(0, layoutSize.value - wall.value.length))

const gridStyle = computed(() => {
  // 1×1/2×2/3×3/4×4 横平竖直的网格；16 格时 4×4 是哪个都行
  const cols = Math.max(1, Math.round(Math.sqrt(layoutSize.value)))
  return {
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gridAutoRows: layoutSize.value <= 4 ? 'minmax(180px, 1fr)' : 'minmax(140px, 1fr)',
  }
})

const kpis = computed(() => [
  {
    key: 'total',
    title: '可预览设备',
    value: videoDevices.value.length,
    desc: '摄像机 / 带通道的设备',
    icon: VideoCamera,
    iconColor: 'var(--el-color-primary)',
  },
  {
    key: 'online',
    title: '在线设备',
    value: onlineCount.value,
    desc: `离线 ${videoDevices.value.length - onlineCount.value} 台`,
    icon: CircleCheck,
    iconColor: 'var(--el-color-success)',
  },
  {
    key: 'wall',
    title: '预览中',
    value: wall.value.length,
    desc: `墙位 ${layoutSize.value} 个`,
    icon: Grid,
    iconColor: 'var(--metric-disk, var(--el-color-warning))',
  },
  {
    key: 'protocol',
    title: '取流协议',
    value: protocol.value.toUpperCase(),
    desc: '切换后重新取流',
    icon: Connection,
    iconColor: 'var(--el-color-info)',
  },
])

/* ============================ 取流 ============================ */

function errText(e: unknown): string {
  return (e as { msg?: string })?.msg || (e instanceof Error ? e.message : String(e))
}

function cfgOf(deviceId: string): RepairCfg {
  return repairs.value[deviceId] || {}
}

/** 这一路实际用的协议：设备级覆盖优先 */
function effectiveProtocol(tile: Tile): string {
  return cfgOf(tile.deviceId).protocol || protocol.value
}

async function loadStream(tile: Tile): Promise<void> {
  const cfg = cfgOf(tile.deviceId)
  tile.error = ''
  // 手动兜底：填了自定义地址就直接用，不再问平台
  if (cfg.url) {
    tile.url = cfg.url
    return
  }
  // 来自拖拽 URL 文本的墙位：地址直出，不占用设备取流接口
  if (!tile.deviceId) {
    return
  }
  try {
    const url = await deviceApi.getVideoStream(tile.deviceId, tile.channel, effectiveProtocol(tile), tile.stream)
    tile.url = String(url || '')
    tile.error = tile.url ? '' : '后端未返回拉流地址'
  } catch (e: unknown) {
    tile.url = ''
    tile.error = `取流失败：${errText(e)}`
  }
}

async function reloadAll(): Promise<void> {
  if (!wall.value.length) return
  reloading.value = true
  try {
    await Promise.all(wall.value.map((t) => loadStream(t)))
  } finally {
    reloading.value = false
  }
}

/** 切换协议：先落缓存，再按新协议重新取流 */
function onProtocolChange(): void {
  persistWall()
  void reloadAll()
}

/* ============================ 画面 ============================ */

function onRoomSelect(tile: { deviceId: string }): void {
  const d = devices.value.find((x) => x.deviceInfoId === tile.deviceId)
  if (d) selectDevice(d)
}

function selectDevice(dev: DeviceInfo) {
  selectedDevice.value = dev
  activeTab.value = 'overview'
  void fetchChannelList(dev.deviceInfoId)
}

async function fetchChannelList(deviceId: string) {
  // 选设备时预拉通道（不在这里阻塞，异步拉）
  try {
    const chs = ((await deviceApi.listChannels(deviceId)) as DeviceChannel[]) || []
    channelNos.value = { ...channelNos.value, [deviceId]: chs.map((c) => c.deviceChannelNo) }
  } catch { /* ignore */ }
}

function isOnWall(deviceId: string): boolean {
  return wall.value.some((t) => t.deviceId === deviceId)
}

function makeTile(d: DeviceInfo): Tile {
  const cfg = cfgOf(d.deviceInfoId)
  return {
    key: `${d.deviceInfoId}#${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    deviceId: d.deviceInfoId,
    name: d.deviceInfoName || d.deviceInfoId,
    channel: cfg.channel ?? 1,
    stream: cfg.stream ?? 'main',
    online: d.deviceInfoOnline,
    url: '',
    error: '',
  }
}

/** 点设备加入画面：已在墙上就提示，满墙替换最后一路 */
function addToWall(d: DeviceInfo): void {
  addDeviceAt(d, -1)
}

function addDeviceAt(d: DeviceInfo, index: number): void {
  if (isOnWall(d.deviceInfoId)) {
    ElMessage.info(`「${d.deviceInfoName || d.deviceInfoId}」已在预览墙上`)
    return
  }
  const tile = makeTile(d)
  const next = [...wall.value]
  const at = index >= 0 && index <= next.length ? index : next.length
  if (next.length >= layoutSize.value) {
    // 满墙：替换落点那一格（落到空白处则替换最后一格），而不是把新画面直接截掉
    next.splice(Math.min(at, layoutSize.value - 1), 1, tile)
  } else {
    next.splice(at, 0, tile)
  }
  wall.value = next
  // 结构变化立刻落本机缓存：不经过地址栏，也不等 watch 的下一拍
  persistWall()
  void loadStream(tile)
  void ensureChannelNos(d.deviceInfoId)
}

function removeTile(key: string): void {
  wall.value = wall.value.filter((t) => t.key !== key)
  persistWall()
}

function clearWall(): void {
  wall.value = []
  persistWall()
}

/** 每路切主/副码流 */
function setTileStream(tile: Tile, stream: string): void {
  const next: StreamKey = stream === 'sub' ? 'sub' : 'main'
  if (tile.stream === next) return
  tile.stream = next
  persistWall()
  void loadStream(tile)
}

/** 每路切通道 */
function setTileChannel(tile: Tile, channel: number): void {
  if (!channel || tile.channel === channel) return
  tile.channel = channel
  persistWall()
  void loadStream(tile)
}

/** 通道候选：设备已知通道优先，否则按通道数 / 兜底 1-4，并保证当前通道在内 */
function channelChoices(tile: Tile): number[] {
  const known = channelNos.value[tile.deviceId]
  const count = devices.value.find((d) => d.deviceInfoId === tile.deviceId)?.deviceInfoChannelCount ?? 0
  const base = known?.length ? [...known] : count > 0 ? Array.from({ length: count }, (_, i) => i + 1) : [1, 2, 3, 4]
  if (!base.includes(tile.channel)) base.push(tile.channel)
  return base.sort((a, b) => a - b)
}

/** 拉一次设备通道号（拉不到就算了，候选里还有兜底通道） */
async function ensureChannelNos(deviceId: string): Promise<void> {
  if (!deviceId || channelNos.value[deviceId]?.length) return
  try {
    const list = ((await deviceApi.listChannels(deviceId)) as DeviceChannel[]) || []
    if (list.length) {
      channelNos.value = {
        ...channelNos.value,
        [deviceId]: list.map((c) => c.deviceChannelNo).sort((a, b) => a - b),
      }
    }
  } catch {
    // 忽略：通道候选有兜底
  }
}

/* ============================ 拖拽 ============================ */

/**
 * 拖拽负载用自定义 MIME，不写 text/plain。
 *
 * <p>把设备 id / 序号写进 text/plain 时，落点一旦没被处理，浏览器会把它当成
 * 「拖入的文本或 URL」自己接管：轻则整页刷新，重则地址栏跳到 device:xxx。
 * 自定义类型不会被浏览器当作导航内容，落点仍由本页的 drop 处理器接管。</p>
 */
const DRAG_DEVICE_MIME = 'application/x-device-preview-device'
const DRAG_TILE_MIME = 'application/x-device-preview-tile'

const dragState = reactive<{ kind: 'tile' | 'device' | 'none'; index: number; deviceId: string }>({
  kind: 'none',
  index: -1,
  deviceId: '',
})
const dropIndex = ref(-1)

/** 拖拽刚结束时部分浏览器还会补一次 click；短暂屏蔽，避免同一台设备被加两次 */
const suppressClick = ref(false)
let suppressTimer: ReturnType<typeof setTimeout> | null = null

const dragActive = computed(() => dragState.kind !== 'none')

function markDragged(): void {
  suppressClick.value = true
  if (suppressTimer) clearTimeout(suppressTimer)
  suppressTimer = setTimeout(() => {
    suppressClick.value = false
    suppressTimer = null
  }, 260)
}

function onDeviceDragStart(e: DragEvent, d: DeviceInfo): void {
  dragState.kind = 'device'
  dragState.deviceId = d.deviceInfoId
  dragState.index = -1
  markDragged()
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData(DRAG_DEVICE_MIME, d.deviceInfoId)
  }
}

function onTileDragStart(e: DragEvent, i: number): void {
  dragState.kind = 'tile'
  dragState.index = i
  dragState.deviceId = ''
  markDragged()
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData(DRAG_TILE_MIME, String(i))
  }
}

function resetDrag(): void {
  dragState.kind = 'none'
  dragState.index = -1
  dragState.deviceId = ''
  dropIndex.value = -1
}

/** dragend：清掉拖拽状态；click 抑制交给 markDragged 的定时器自然结束 */
function endDrag(): void {
  resetDrag()
}

/** 左侧清单点击：拖拽松手后的补发 click 直接忽略 */
function onDeviceClick(d: DeviceInfo): void {
  if (suppressClick.value) return
  addToWall(d)
}

function setDropEffect(e: DragEvent): void {
  if (e.dataTransfer) e.dataTransfer.dropEffect = dragState.kind === 'tile' ? 'move' : 'copy'
}

function onTileDragOver(e: DragEvent, i: number): void {
  if (!dragActive.value) return
  setDropEffect(e)
  dropIndex.value = i
}

function onGridDragOver(e: DragEvent): void {
  if (!dragActive.value) return
  setDropEffect(e)
  dropIndex.value = -1
}

function onGridDrop(e: DragEvent): void {
  applyDrop(e, -1)
}

function onTileDrop(e: DragEvent, i: number): void {
  applyDrop(e, i)
}

/**
 * 从拖入的文本里猜流地址。
 *
 * <p>地址栏/编辑框拖出的文本可能是 <code>text/uri-list</code>（浏览器地址栏的标准）、
 * <code>text/plain</code>（剪贴板里的纯文本）或两者都有。只收以 http/https 开头的
 * 地址：设备 id、UUID、点名都不会误触发。</p>
 */
function urlsFromDropText(e: DragEvent): string[] {
  const types = e.dataTransfer ? Array.from(e.dataTransfer.types) : []
  // uri-list（每行一个 URL，可选分号标注）优先于 plain
  const mime = types.includes('text/uri-list') ? 'text/uri-list' : types.includes('text/plain') ? 'text/plain' : ''
  if (!mime) return []
  const text = (e.dataTransfer && e.dataTransfer.getData(mime)) || ''
  const found: string[] = []
  for (const line of text.split(/[\r\n]+/)) {
    for (const token of line.trim().split(/[\s，、]/)) {
      const u = token.trim()
      if (/^https?:\/\/[^\s]+$/i.test(u)) found.push(u)
    }
  }
  return found
}

/**
 * 由拖入的文本新建一路：地址取自文本，空位送到落点，满了挤掉最后一路。
 */
function addTextTile(urls: string[], index: number): void {
  const url = urls[0]
  if (!url) return
  const tile: Tile = {
    key: `url#${url}#${Date.now().toString(36)}`,
    deviceId: '',
    name: url,
    channel: 1,
    stream: 'main',
    online: true,
    url,
    error: '',
  }
  const next = [...wall.value]
  const at = index >= 0 && index <= next.length ? index : next.length
  if (next.length >= layoutSize.value) {
    next.splice(Math.min(at, layoutSize.value - 1), 1, tile)
  } else {
    next.splice(at, 0, tile)
  }
  wall.value = next
  persistWall()
}

/** 落点统一处理：墙内换位 / 从清单拖入 / 拖入（半）个 URL */
function applyDrop(e: DragEvent, index: number): void {
  // 拖入的是 http/https 文本：按流地址开好格子
  const texts = urlsFromDropText(e)
  if (texts.length > 0) {
    addTextTile(texts, index < 0 ? wall.value.length : index)
    endDrag()
    return
  }
  // 优先读响应式状态；状态因 dragend 提前清掉时再回退到自定义 MIME
  const deviceId =
    dragState.kind === 'device' ? dragState.deviceId : (e.dataTransfer?.getData(DRAG_DEVICE_MIME) || '')
  const tileIndexRaw =
    dragState.kind === 'tile' ? String(dragState.index) : (e.dataTransfer?.getData(DRAG_TILE_MIME) || '')
  const from = Number(tileIndexRaw)

  if (!deviceId && Number.isInteger(from) && from >= 0) {
    if (index < 0 || index >= wall.value.length) {
      // 落到空白处：移到最后一格
      moveTile(from, wall.value.length - 1)
    } else {
      moveTile(from, index)
    }
  } else if (deviceId) {
    const d = devices.value.find((x) => x.deviceInfoId === deviceId)
    if (d) addDeviceAt(d, index < 0 || index >= wall.value.length ? -1 : index)
  }
  endDrag()
}

function moveTile(from: number, to: number): void {
  if (from < 0 || to < 0 || from === to || from >= wall.value.length) return
  const next = [...wall.value]
  const [tile] = next.splice(from, 1)
  next.splice(Math.min(to, next.length), 0, tile)
  wall.value = next
  persistWall()
}

/* ============================ 墙面持久化（本机缓存） ============================ */

/**
 * 画面 / 布局 / 协议 存本机。
 *
 * <p>不写地址栏：改 query 会触发路由重渲染（墙上画面重取，看着像整页刷新），
 * 拖几下就堆一串历史记录。独立窗口与主页面同源，读同一份缓存即可对齐。</p>
 */
const WALL_KEY = 'device:preview-wall'

interface WallStore {
  layout?: string
  protocol?: string
  tiles?: { deviceId: string; channel?: number; stream?: string }[]
}

/** 缓存里的一路画面（还没找到设备详情） */
interface PendingTile {
  deviceId: string
  channel: number
  stream: StreamKey
}

function persistWall(): void {
  if (!ready.value) return
  try {
    localStorage.setItem(
      WALL_KEY,
      JSON.stringify({
        layout: layout.value,
        protocol: protocol.value,
        tiles: wall.value.map((t) => ({ deviceId: t.deviceId, channel: t.channel, stream: t.stream })),
      }),
    )
  } catch {
    // 忽略：存不下只影响下次打开
  }
}

/** 读缓存：返回待恢复画面 + 本机是否存过（没存过才给默认画面） */
function readWall(): { tiles: PendingTile[]; restored: boolean } {
  let raw = ''
  let store: WallStore = {}
  try {
    raw = localStorage.getItem(WALL_KEY) || ''
    store = (JSON.parse(raw) as WallStore) || {}
  } catch {
    store = {}
  }
  if (store.layout && ['1', '4', '9', '16'].includes(store.layout)) layout.value = store.layout
  if (store.protocol && ['hls', 'flv', 'rtsp'].includes(store.protocol)) protocol.value = store.protocol
  const tiles = (store.tiles || [])
    .filter((t) => !!t?.deviceId)
    .map((t) => ({
      deviceId: String(t.deviceId),
      channel: Number(t.channel) || 1,
      stream: (t.stream === 'sub' ? 'sub' : 'main') as StreamKey,
    }))
    .slice(0, Number(layout.value) || 4)
  return { tiles, restored: raw.length > 0 }
}

/** 按缓存把画面重建出来（keep-alive 回来也走这里） */
function materialize(pending: PendingTile[]): Tile[] {
  return pending.map((p, i) => {
    const d = devices.value.find((x) => x.deviceInfoId === p.deviceId)
    const cfg = cfgOf(p.deviceId)
    return {
      key: `${p.deviceId}#restore${i}`,
      deviceId: p.deviceId,
      name: d?.deviceInfoName || p.deviceId,
      channel: cfg.channel ?? p.channel,
      stream: cfg.stream ?? p.stream,
      online: !!d?.deviceInfoOnline,
      url: '',
      error: '',
    } satisfies Tile
  })
}

/* ============================ 取流配置（手动修复） ============================ */

const repairChannelNos = computed(() => (repairTarget.value ? channelNos.value[repairTarget.value.deviceId] || [] : []))

const repairTitle = computed(() => `取流配置 · ${repairTarget.value?.name || ''}`)

const repairHasSaved = computed(() => !!repairTarget.value && !!repairs.value[repairTarget.value.deviceId])

function openRepair(tile: Tile): void {
  const cfg = cfgOf(tile.deviceId)
  repairTarget.value = tile
  repairForm.channel = tile.channel
  repairForm.stream = tile.stream
  repairForm.protocol = cfg.protocol || protocol.value
  repairForm.url = cfg.url || ''
  repairVisible.value = true
  void ensureChannelNos(tile.deviceId)
}

function persistRepairs(): void {
  try {
    localStorage.setItem(REPAIR_KEY, JSON.stringify(repairs.value))
  } catch {
    // 忽略：存不下只影响下次打开
  }
}

function readRepairs(): void {
  try {
    repairs.value = JSON.parse(localStorage.getItem(REPAIR_KEY) || '{}') as Record<string, RepairCfg>
  } catch {
    repairs.value = {}
  }
}

/** 保存：只记非默认项，避免脏配置 */
function saveRepair(): void {
  const tile = repairTarget.value
  if (!tile) return
  const cfg: RepairCfg = {}
  if (repairForm.channel && repairForm.channel !== 1) cfg.channel = repairForm.channel
  if (repairForm.stream === 'sub') cfg.stream = 'sub'
  if (repairForm.protocol && repairForm.protocol !== 'hls') cfg.protocol = repairForm.protocol
  if (repairForm.url.trim()) cfg.url = repairForm.url.trim()
  repairs.value = { ...repairs.value, [tile.deviceId]: cfg }
  persistRepairs()

  // 同一设备的所有画面跟着走
  for (const t of wall.value) {
    if (t.deviceId !== tile.deviceId) continue
    t.channel = repairForm.channel || t.channel
    t.stream = repairForm.stream === 'sub' ? 'sub' : 'main'
  }
  repairVisible.value = false
  ElMessage.success('已按新配置重新取流')
  void reloadAll()
}

function clearRepair(): void {
  const tile = repairTarget.value
  if (!tile) return
  const next = { ...repairs.value }
  delete next[tile.deviceId]
  repairs.value = next
  persistRepairs()
  repairForm.protocol = protocol.value
  repairForm.url = ''
  repairVisible.value = false
  ElMessage.success('已清除该设备的取流覆盖')
  void reloadAll()
}

/* ============================ 独立窗口 ============================ */

function popout(): void {
  // 独立窗口跟主页面同源，读同一份本机缓存，不用把画面编到 URL 里
  persistWall()
  const url = `${window.location.origin}/device/preview/standalone`
  const win = window.open(url, '_blank', 'width=1600,height=900')
  if (!win) {
    ElMessage.warning('浏览器拦住了新窗口，允许弹窗后再试')
    return
  }
  win.focus()
}

function closeWindow(): void {
  window.close()
}

/** 关闭向导提示条：记住本次选择，下次不再打扰 */
function dismissRemindBar(): void {
  remindBarVisible.value = false
  try {
    localStorage.setItem(REMIND_BAR_KEY, '1')
  } catch {
    /* ignore */
  }
}

/* ============================ 装载 ============================ */

async function fetchDevices(): Promise<void> {
  try {
    devices.value = ((await deviceApi.list()) as DeviceInfo[]) || []
  } catch (e: unknown) {
    devices.value = []
    ElMessage.error(`设备清单加载失败：${errText(e)}`)
  }
}

/** 首选设备：相机/带通道的才可预览，避免挑到报警主机 */
function firstVideoDevice(): DeviceInfo | undefined {
  return videoDevices.value.find((d) => d.deviceInfoOnline) || videoDevices.value[0]
}

async function bootstrap(): Promise<void> {
  readRepairs()
  const { ids, layout: queryLayout, remind } = applyRouteQuery()
  const { tiles, restored } = readWall()
  if (!devices.value.length) await fetchDevices()
  wall.value = materialize(tiles)
  ready.value = true
  // 向导进入：把所选设备直接铺进预览墙（覆盖本地缓存，保持“选了就看”的语义）
  if (ids.length) {
    const picked = videoDevices.value.filter((d) => ids.includes(d.deviceInfoId))
    if (queryLayout && ['1', '4', '9', '16'].includes(queryLayout)) {
      layout.value = queryLayout
    }
    if (picked.length) {
      wall.value = picked.slice(0, layoutSize.value).map(makeTile)
    }
    if (remind) refreshRemindText(ids)
  } else if (!wall.value.length && !restored) {
    // 本机从没存过墙面（第一次打开）：给一路在线摄像机，墙不至于是空的
    const d = firstVideoDevice()
    if (d) wall.value = [makeTile(d)]
  }
  // 结构由向导/缓存决定后立刻落缓存，独立窗口同源读取一致
  persistWall()
  for (const t of wall.value) void ensureChannelNos(t.deviceId)
  await Promise.all(wall.value.map((t) => loadStream(t)))
}

/**
 * 拖拽根节点的兜底。
 *
 * <p>墙内落点由 grid / tile 的 drop 处理器先处理；这一层只负责把默认行为拦掉，
 * 避免松手落在标题、留白或面板边缘时被浏览器当成「打开拖入内容」而整页刷新。
 * 不再改地址栏，所有墙面状态直接写 localStorage。</p>
 */
function preventNativeDrop(e: DragEvent): void {
  if (dragActive.value || e.defaultPrevented) e.preventDefault()
  // 拖入的是 http/https 文本：必须取消“在地址栏打开它”的浏览器默认行为，
  // 否则地址还没到达页面，浏览器就已经把 URL 当导航跳走了
  else if (urlsFromDropText(e).length > 0) e.preventDefault()
}

/** 全域 drop 拦截：URL 文本滚一套格子，其他逻辑交给页面自己处理 */
function onGlobalDrop(e: DragEvent): void {
  if (e.defaultPrevented) return
  const texts = urlsFromDropText(e)
  if (texts.length > 0) {
    e.preventDefault()
    addTextTile(texts, -1)
    endDrag()
    return
  }
  preventNativeDrop(e)
}

/**
 * 拖到页面其他区域（顶栏 / 侧栏 / 外壳留白）时的最后一道拦截。
 *
 * <p>这里用 {@code dragState.kind} 而不是 computed：drop 冒泡到 document 时，
 * 元素上的处理器可能已经把 kind 清成 none，只看 computed 会漏拦。</p>
 */
function blockNativeDrop(e: DragEvent): void {
  if (dragState.kind !== 'none' || e.defaultPrevented) e.preventDefault()
}

onMounted(() => {
  document.addEventListener('dragenter', blockNativeDrop)
  document.addEventListener('dragover', blockNativeDrop)
  document.addEventListener('drop', blockNativeDrop)
  void bootstrap()
})

onDeactivated(() => {
  // 页面被缓存：停掉画面，避免后台一直拉流；回来再取
  paused.value = true
  wall.value.forEach((t) => {
    t.url = ''
    t.error = ''
  })
})

onActivated(() => {
  if (!paused.value) return
  paused.value = false
  void reloadAll()
})

onBeforeUnmount(() => {
  document.removeEventListener('dragenter', blockNativeDrop)
  document.removeEventListener('dragover', blockNativeDrop)
  document.removeEventListener('drop', blockNativeDrop)
  if (suppressTimer) clearTimeout(suppressTimer)
  suppressTimer = null
  // 先停写缓存再清空画面，避免卸载瞬间把空墙覆盖到本机缓存
  ready.value = false
  wall.value = []
})

// 布局变小 → 超出墙位的画面摘掉，否则「N / 4」与实际画面数对不上
watch(layout, () => {
  if (wall.value.length > layoutSize.value) {
    wall.value = wall.value.slice(0, layoutSize.value)
  }
})

// 画面顺序 / 布局 / 协议 → 本机缓存（不动地址栏）
watch([wall, layout, protocol], persistWall, { deep: true })
</script>

<style scoped>
.dpv {
  display: flex;
  flex-direction: column;
  gap: 14px;
  /* 左右不再自带内边距：外层布局(main.el-main)已留过一份，两层层层叠加会让右侧空隙过大 */
  padding: 10px 0 12px;
  /* 高度够就吃满剩余空间（画面墙内滚），不够就自然撑开让主区滚动 */
  min-height: 100%;
  color: var(--el-text-color-primary);
}
.dpv--standalone {
  padding: 10px 12px 12px;
  min-height: 100vh;
  background: var(--el-bg-color-page, var(--el-bg-color));
}

/* 独立窗口的细工具条 */
.dpv-std {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}
.dpv-std__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.dpv-std__title {
  font-size: 13.5px;
  font-weight: 600;
}
.dpv-std__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dpv-std__ops {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 向导进入的提示条 */
.dpv-remind {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  background: var(--el-color-primary-light-9, var(--el-color-primary-light-8));
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: var(--el-radius-lg, 12px);
}
.dpv-remind__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dpv-remind__ops {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dpv-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.dpv-body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: grid;
  gap: 14px;
  align-items: stretch;
}
.dpv-body--full {
  grid-template-columns: minmax(260px, 320px) 1fr;
}
.dpv-body--mini {
  grid-template-columns: 44px 1fr;
}
.dpv-body--hidden {
  grid-template-columns: 1fr;
}
@media (max-width: 1100px) {
  .dpv-body--full {
    grid-template-columns: 1fr;
  }
}

/* 折叠导轨 */
.dpv-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  cursor: pointer;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.dpv-rail:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}
.dpv-rail__label {
  writing-mode: vertical-rl;
  font-size: 12.5px;
  letter-spacing: 2px;
}
.dpv-rail__count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 完全隐藏后的把手 */
.dpv-handle {
  position: absolute;
  top: 8px;
  left: -1px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 12.5px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-left: none;
  border-radius: 0 var(--el-radius-base, 8px) var(--el-radius-base, 8px) 0;
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.dpv-handle:hover {
  color: var(--el-color-primary);
}

.dpv-panel {
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.dpv-panel--fill {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.dpv-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.dpv-panel__head--wall {
  flex-wrap: wrap;
}
.dpv-panel__bar {
  width: 6px;
  height: 16px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.dpv-panel__count {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.dpv-rtsp-hint {
  font-size: 11px;
  font-weight: 500;
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 25%, transparent);
  border-radius: 999px;
  padding: 1px 7px;
}
.dpv-panel__ops {
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.dpv-side__seg {
  margin-bottom: 8px;
}
.dpv-side__search {
  flex: none;
  margin-bottom: 10px;
}
.dpv-side__list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dpv-side__tip {
  flex: none;
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dpv-dev {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px 9px 4px;
  cursor: grab;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  transition: border-color 0.15s, background-color 0.15s;
}
.dpv-dev:active {
  cursor: grabbing;
}
.dpv-dev:hover {
  border-color: var(--el-color-primary-light-5);
  background: color-mix(in srgb, var(--el-color-primary) 4%, transparent);
}
.dpv-dev.is-on {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
}
.dpv-dev__grip {
  display: grid;
  place-items: center;
  color: var(--el-text-color-placeholder);
  cursor: grab;
}
.dpv-dev__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  border-radius: var(--el-radius-base, 8px);
}
.dpv-dev__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dpv-dev__name {
  font-size: 12.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dpv-dev__meta {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dpv-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  gap: 10px;
  overflow: auto;
  align-content: stretch;
}
.dpv-tile {
  position: relative;
  min-height: 140px;
  overflow: hidden;
  background: #05070c;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  cursor: grab;
}
.dpv-tile.is-moving {
  opacity: 0.4;
}
.dpv-tile.is-drop {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary);
}
.dpv-tile__video {
  width: 100%;
  height: 100%;
}
.dpv-tile__blank {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
}
.dpv-tile__blank-icon {
  font-size: 26px;
  opacity: 0.6;
}
.dpv-tile__blank-text {
  font-size: 11px;
  opacity: 0.75;
}
.dpv-tile__head {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  font-size: 11px;
  color: rgba(255,255,255,0.92);
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.55), transparent);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
  z-index: 2;
}
.dpv-tile:hover .dpv-tile__head,
.dpv-tile__head:has(~ *:hover) {
  opacity: 1;
}
.dpv-tile__dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--el-color-success);
}
.dpv-tile__dot.is-off {
  background: var(--el-text-color-placeholder);
}
.dpv-tile__name {
  flex: 1;
  min-width: 0;
  font-size: 11.5px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dpv-tile__ch {
  flex: none;
  font-size: 10.5px;
  opacity: 0.8;
}
.dpv-tile__op {
  flex: none;
  cursor: pointer;
  opacity: 0.85;
}
.dpv-tile__op:hover {
  opacity: 1;
}
.dpv-tile__foot {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.55), transparent);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
  z-index: 2;
}
.dpv-tile:hover .dpv-tile__foot { opacity: 1; }
.dpv-tile__chsel {
  width: 84px;
  flex: none;
}
.dpv-tile--empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: color-mix(in srgb, var(--el-text-color-primary) 4%, transparent);
  border-style: dashed;
  border-color: var(--el-border-color);
  color: var(--el-text-color-placeholder);
  cursor: default;
}
.dpv-tile__slot-icon {
  font-size: 24px;
}
.dpv-tile__slot-text {
  font-size: 12px;
}

.dpv-ghost {
  flex: 1;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px;
  text-align: center;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-lg, 12px);
}
.dpv-ghost__icon {
  font-size: 28px;
  color: var(--el-text-color-placeholder);
}
.dpv-ghost__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.dpv-ghost__desc {
  margin: 0;
  max-width: 380px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.dpv-form__ro {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.dpv-form__hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dpv-form__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.dpv-chip {
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  background: transparent;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
}
.dpv-chip:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}
.dpv-chip.on {
  color: var(--el-color-white);
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
</style>
