<template>
  <section class="emap">
    <header class="emap__head">
      <div class="emap__title">
        <span class="emap__bar" />
        <span>设备分布</span>
      </div>
      <div class="emap__legend">
        <span class="emap__legend-item">
          <i class="emap__legend-dot emap__legend-dot--on" />在线
        </span>
        <span class="emap__legend-item">
          <i class="emap__legend-dot emap__legend-dot--off" />离线
        </span>
        <span class="emap__total">共 {{ positionedDevices.length }} 台</span>
      </div>
    </header>

    <!-- 地图层：瓦片（绝对定位） -->
    <div ref="tileRef" class="emap__tiles" />

    <!-- 标记层：设备标记（独立于瓦片层） -->
    <div ref="mapRef" class="emap__canvas">
      <div
        v-for="(dev, idx) in positionedDevices"
        :key="dev.deviceInfoId"
        class="emap__node"
        :class="{ 'is-selected': selectedId === dev.deviceInfoId }"
        :style="markerStyle(dev)"
        @click.stop="emit('select', dev)"
        :title="dev.deviceInfoName"
      >
        <div class="emap__marker" :class="dev.deviceInfoOnline ? 'is-on' : 'is-off'">
          <span class="emap__marker-num">{{ idx + 1 }}</span>
        </div>
        <div class="emap__label">{{ dev.deviceInfoName }}</div>
      </div>

      <!-- 空态 -->
      <div v-if="!positionedDevices.length" class="emap__empty">
        <el-icon :size="32"><Location /></el-icon>
        <span>暂无已配置经纬度的设备</span>
        <span class="emap__empty-hint">在设备表单中填写纬度 / 经度后，这里会出现地图标记</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { Location } from '@element-plus/icons-vue'
import type { DeviceInfo } from '../types/device'

const props = defineProps<{
  devices: DeviceInfo[]
  selectedId?: string
}>()

const emit = defineEmits<{
  (e: 'select', dev: DeviceInfo): void
}>()

const tileRef = ref<HTMLElement | null>(null)
const mapRef = ref<HTMLElement | null>(null)

// OpenStreetMap 瓦片配置
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const MIN_ZOOM = 3
const MAX_ZOOM = 18
const DEFAULT_ZOOM = 13

const center = ref({ lat: 30.27, lng: 120.15, zoom: DEFAULT_ZOOM })

const tileCache = new Map<string, HTMLImageElement>()

onMounted(() => {
  if (!tileRef.value) return
  renderTiles()

  const el = tileRef.value.parentElement!
  el.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  el.addEventListener('wheel', onWheel, { passive: false })

  const ro = new ResizeObserver(() => renderTiles())
  ro.observe(el)
})

const drag = { active: false, startX: 0, startY: 0, startLng: 0, startLat: 0 }

function onMouseDown(e: MouseEvent) {
  drag.active = true
  drag.startX = e.clientX
  drag.startY = e.clientY
  drag.startLng = center.value.lng
  drag.startLat = center.value.lat
}
function onMouseMove(e: MouseEvent) {
  if (!drag.active) return
  const zoom = center.value.zoom
  const n = Math.pow(2, zoom)
  const dLng = -((e.clientX - drag.startX) / 256) * 360 / n
  const dLat = ((e.clientY - drag.startY) / 256) * 360 / n
  center.value = { ...center.value, lng: drag.startLng + dLng, lat: drag.startLat - dLat }
  renderTiles()
}
function onMouseUp() { drag.active = false }

function onWheel(e: WheelEvent) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -1 : 1
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, center.value.zoom + delta))
  if (newZoom !== center.value.zoom) {
    center.value = { ...center.value, zoom: newZoom }
    renderTiles()
  }
}

function renderTiles() {
  if (!tileRef.value || !mapRef.value) return
  const { width: W, height: H } = tileRef.value.parentElement!.getBoundingClientRect()
  const zoom = Math.floor(center.value.zoom)
  const n = Math.pow(2, zoom)
  const centerTX = Math.floor(((center.value.lng + 180) / 360) * n)
  const centerTY = Math.floor((0.5 - Math.log(Math.tan(center.value.lat * Math.PI / 180) + 1 / Math.cos(center.value.lat * Math.PI / 180)) / (2 * Math.PI)) * n)
  const centerWX = ((center.value.lng + 180) / 360) * 256 * n
  const centerWY = (0.5 - Math.log(Math.tan(center.value.lat * Math.PI / 180) + 1 / Math.cos(center.value.lat * Math.PI / 180)) / (2 * Math.PI)) * 256 * n

  tileRef.value.innerHTML = ''
  const tilesX = Math.ceil(W / 256) + 2
  const tilesY = Math.ceil(H / 256) + 2

  for (let dx = -1; dx <= tilesX; dx++) {
    for (let dy = -1; dy <= tilesY; dy++) {
      const tx = centerTX + dx
      const ty = centerTY + dy
      if (tx < 0 || tx >= n || ty < 0 || ty >= n) continue
      const key = `${zoom}/${tx}/${ty}`
      if (!tileCache.has(key)) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.referrerPolicy = 'no-referrer'
        img.src = TILE_URL.replace('{x}', String(tx)).replace('{y}', String(ty)).replace('{z}', String(zoom))
        tileCache.set(key, img)
      }
      const img = tileCache.get(key)!
      img.style.cssText = `position:absolute;width:256px;height:256px;left:${tx * 256 - centerWX + W / 2}px;top:${ty * 256 - centerWY + H / 2}px;pointer-events:none`
      tileRef.value!.appendChild(img)
    }
  }
}

watch(() => props.devices, () => nextTick(() => renderTiles()), { deep: true })

const positionedDevices = computed(() =>
  (props.devices || []).filter((d) => d.deviceInfoLatitude != null && d.deviceInfoLongitude != null),
)

function markerStyle(dev: DeviceInfo) {
  if (!mapRef.value) return {}
  const { width: W, height: H } = mapRef.value.getBoundingClientRect()
  const zoom = center.value.zoom
  const n = Math.pow(2, zoom)
  const centerWX = ((center.value.lng + 180) / 360) * 256 * n
  const centerWY = (0.5 - Math.log(Math.tan(center.value.lat * Math.PI / 180) + 1 / Math.cos(center.value.lat * Math.PI / 180)) / (2 * Math.PI)) * 256 * n
  const devWX = ((dev.deviceInfoLongitude! + 180) / 360) * 256 * n
  const devWY = (0.5 - Math.log(Math.tan(dev.deviceInfoLatitude! * Math.PI / 180) + 1 / Math.cos(dev.deviceInfoLatitude! * Math.PI / 180)) / (2 * Math.PI)) * 256 * n
  return { left: `${devWX - centerWX + W / 2}px`, top: `${devWY - centerWY + H / 2}px` }
}
</script>

<style scoped>
.emap {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

.emap__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  z-index: 2;
}
.emap__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.emap__bar {
  width: 6px; height: 16px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.emap__legend {
  display: inline-flex; align-items: center; gap: 14px;
  font-size: 12.5px; color: var(--el-text-color-secondary);
}
.emap__legend-item { display: inline-flex; align-items: center; gap: 6px; }
.emap__legend-dot { width: 8px; height: 8px; border-radius: 50%; }
.emap__legend-dot--on { background: var(--el-color-success); }
.emap__legend-dot--off { background: var(--el-color-info); }
.emap__total { padding-left: 12px; border-left: 1px solid var(--el-border-color-lighter); }

/* 瓦片层 */
.emap__tiles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

/* 标记层 */
.emap__canvas {
  position: relative;
  flex: 1;
  min-height: 320px;
  overflow: hidden;
  cursor: grab;
  z-index: 1;
}
.emap__canvas:active { cursor: grabbing; }

.emap__node {
  position: absolute;
  transform: translate(-50%, -120%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  z-index: 10;
  animation: emap-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes emap-pop {
  from { opacity: 0; transform: translate(-50%, -100%) scale(0.6); }
  to   { opacity: 1; transform: translate(-50%, -120%) scale(1); }
}
.emap__marker {
  width: 26px; height: 26px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.emap__marker:hover { transform: rotate(-45deg) scale(1.2); }
.emap__marker.is-on { background: var(--el-color-success); }
.emap__marker.is-off { background: var(--el-color-info); }
.emap__marker-num {
  transform: rotate(45deg);
  font-size: 10px; font-weight: 800; color: #fff; line-height: 1;
}
.emap__label {
  font-size: 11px; font-weight: 600;
  color: var(--el-text-color-primary);
  background: rgba(255,255,255,0.92);
  padding: 2px 6px; border-radius: 4px;
  white-space: nowrap; max-width: 110px; overflow: hidden; text-overflow: ellipsis;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12); pointer-events: none;
}
.emap__node.is-selected .emap__marker { transform: rotate(-45deg) scale(1.3); }
.emap__node.is-selected .emap__label { background: var(--el-color-primary); color: #fff; }

.emap__empty {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  color: var(--el-text-color-secondary); font-size: 13px;
  background: rgba(240,242,245,0.85); backdrop-filter: blur(4px);
}
.emap__empty-hint { font-size: 12px; color: var(--el-text-color-placeholder); }
</style>
