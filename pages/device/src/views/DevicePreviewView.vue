<template>
  <div class="dpv">
    <!-- 概览指标 -->
    <section class="dpv-kpis">
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

    <div class="dpv-body">
      <!-- 左：可选设备 -->
      <section class="dpv-panel dpv-panel--fill dpv-side">
        <header class="dpv-panel__head">
          <span class="dpv-panel__bar" />
          <span>设备清单</span>
          <span class="dpv-panel__count">{{ filteredDevices.length }}</span>
        </header>

        <div class="dpv-side__filter">
          <ReInput v-model="keyword" placeholder="搜索设备 / IP" clearable prefix-icon="Search" />
          <ReSelect v-model="filters.online" :options="ONLINE_OPTIONS" placeholder="全部状态" clearable />
        </div>

        <div v-if="filteredDevices.length" class="dpv-side__list">
          <article
            v-for="d in filteredDevices"
            :key="d.deviceInfoId"
            class="dpv-dev"
            :class="{ 'is-on': isOnWall(d.deviceInfoId) }"
            @click="addToWall(d)"
          >
            <span class="dpv-dev__icon">
              <el-icon><VideoCamera /></el-icon>
            </span>
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
      </section>

      <!-- 右：预览墙 -->
      <section class="dpv-panel dpv-panel--fill dpv-wall">
        <header class="dpv-panel__head">
          <span class="dpv-panel__bar" />
          <span>预览墙</span>
          <span class="dpv-panel__count">{{ wall.length }} / {{ layoutSize }}</span>
          <div class="dpv-panel__ops">
            <ReSelect v-model="protocol" :options="PROTOCOL_OPTIONS" class="dpv-wall__select" />
            <ReSelect v-model="layout" :options="LAYOUT_OPTIONS" class="dpv-wall__select" />
            <ReButton icon="RefreshRight" layout="square" tip="重载全部画面" :loading="reloading" @click="reloadAll" />
            <ReButton icon="Delete" layout="square" tip="清空预览墙" :disabled="!wall.length" @click="clearWall" />
          </div>
        </header>

        <div class="dpv-grid" :style="gridStyle">
          <article v-for="tile in wall" :key="tile.key" class="dpv-tile">
            <ReVideo
              v-if="tile.url"
              :url="tile.url"
              :protocol="protocol"
              :channel="tile.channel"
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
              <span class="dpv-tile__name">{{ tile.name }}</span>
              <span class="dpv-tile__ch">CH{{ tile.channel }}</span>
              <el-icon class="dpv-tile__close" title="移除画面" @click="removeTile(tile.key)"><Close /></el-icon>
            </header>
          </article>

          <article v-for="n in emptySlots" :key="`slot-${n}`" class="dpv-tile dpv-tile--empty">
            <el-icon class="dpv-tile__slot-icon"><VideoCamera /></el-icon>
            <span class="dpv-tile__slot-text">点击左侧设备加入预览</span>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 设备预览 —— 多路实时画面墙。
 *
 * 数据来自 device-starter 的 `/api/device`：
 *   - GET /list                 可选设备（摄像机类）
 *   - GET /video/stream        按 设备 + 通道 + 协议 取拉流地址
 *
 * 选手法：点左侧设备加入画面，满墙后替换最后一路；离开页面时清空画面，
 * 避免后台继续拉流。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, Close, Connection, Grid, VideoCamera } from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReInput from '@repo/ui/re-input'
import ReSelect from '@repo/ui/re-select'
import ReStatCard from '@repo/ui/re-stat-card'
import ReTag from '@repo/ui/re-tag'

import ReVideo from '@/components/ReVideo.vue'
import deviceApi from '@/api/deviceApi'
import type { DeviceInfo } from '@/types/device'

/** 在线状态下拉 */
const ONLINE_OPTIONS = [
  { value: 'online', label: '在线' },
  { value: 'offline', label: '离线' },
]

const PROTOCOL_OPTIONS = [
  { value: 'hls', label: 'HLS' },
  { value: 'flv', label: 'FLV' },
  { value: 'rtsp', label: 'RTSP' },
]

const LAYOUT_OPTIONS = [
  { value: '1', label: '1 画面' },
  { value: '4', label: '4 画面' },
  { value: '9', label: '9 画面' },
]

/** 预览墙上的一路画面 */
interface Tile {
  key: string
  deviceId: string
  name: string
  channel: number
  online: boolean
  url: string
  error: string
}

const devices = ref<DeviceInfo[]>([])
const wall = ref<Tile[]>([])
const keyword = ref('')
const filters = reactive({ online: '' })
const protocol = ref('hls')
const layout = ref('4')
const reloading = ref(false)

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

const emptySlots = computed(() => Math.max(0, layoutSize.value - wall.value.length))

const gridStyle = computed(() => {
  const cols = layoutSize.value <= 1 ? 1 : layoutSize.value <= 4 ? 2 : 3
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

function isOnWall(deviceId: string): boolean {
  return wall.value.some((t) => t.deviceId === deviceId)
}

/** 点设备加入画面：已在墙上就不重复加，满墙替换最后一路 */
function addToWall(d: DeviceInfo): void {
  if (isOnWall(d.deviceInfoId)) {
    ElMessage.info(`「${d.deviceInfoName || d.deviceInfoId}」已在预览墙上`)
    return
  }
  const tile: Tile = {
    key: `${d.deviceInfoId}-${Date.now()}`,
    deviceId: d.deviceInfoId,
    name: d.deviceInfoName || d.deviceInfoId,
    channel: 1,
    online: d.deviceInfoOnline,
    url: '',
    error: '',
  }
  if (wall.value.length >= layoutSize.value) {
    wall.value.splice(wall.value.length - 1, 1, tile)
  } else {
    wall.value.push(tile)
  }
  void loadStream(tile)
}

async function loadStream(tile: Tile): Promise<void> {
  try {
    const url = await deviceApi.getVideoStream(tile.deviceId, tile.channel, protocol.value)
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

function removeTile(key: string): void {
  wall.value = wall.value.filter((t) => t.key !== key)
}

function clearWall(): void {
  wall.value = []
}

function errText(e: unknown): string {
  return (e as { msg?: string })?.msg || (e instanceof Error ? e.message : String(e))
}

async function fetchDevices(): Promise<void> {
  try {
    devices.value = ((await deviceApi.list()) as DeviceInfo[]) || []
  } catch (e: unknown) {
    devices.value = []
    ElMessage.error(`设备清单加载失败：${errText(e)}`)
  }
}

/** 协议变了，墙上的画面按新协议重新取流 */
watch(protocol, () => void reloadAll())

// 切换布局后超出墙位的画面要摘掉，否则「N / 4」与实际画面数不一致
watch(layout, () => {
  if (wall.value.length > layoutSize.value) {
    wall.value = wall.value.slice(0, layoutSize.value)
  }
})

onMounted(fetchDevices)
onBeforeUnmount(() => {
  wall.value = []
})
</script>

<style scoped>
.dpv {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 12px 12px;
  /* 高度够就吃满剩余空间（画面墙内滚），不够就自然撑开让主区滚动 */
  min-height: 100%;
  color: var(--el-text-color-primary);
}

.dpv-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.dpv-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(260px, 320px) 1fr;
  gap: 14px;
}
@media (max-width: 1100px) {
  .dpv-body {
    grid-template-columns: 1fr;
  }
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
.dpv-panel__ops {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dpv-wall__select {
  width: 108px;
}

.dpv-side__filter {
  flex: none;
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.dpv-side__filter :deep(.el-input),
.dpv-side__filter :deep(.el-select) {
  width: 100%;
}
.dpv-side__filter > :first-child {
  flex: 1;
}
.dpv-side__filter > :last-child {
  width: 108px;
}

.dpv-side__list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dpv-dev {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  cursor: pointer;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  transition: border-color 0.15s, background-color 0.15s;
}
.dpv-dev:hover {
  border-color: var(--el-color-primary-light-5);
  background: color-mix(in srgb, var(--el-color-primary) 4%, transparent);
}
.dpv-dev.is-on {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
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
  font-size: 13.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dpv-dev__meta {
  font-size: 12px;
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
}
.dpv-tile {
  position: relative;
  min-height: 140px;
  overflow: hidden;
  background: #05070c;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
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
  font-size: 12px;
}
.dpv-tile__head {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.55), transparent);
}
.dpv-tile__dot {
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dpv-tile__ch {
  opacity: 0.75;
}
.dpv-tile__close {
  cursor: pointer;
  opacity: 0.8;
}
.dpv-tile__close:hover {
  opacity: 1;
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
</style>
