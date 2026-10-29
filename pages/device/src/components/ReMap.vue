<template>
  <div class="re-map-wrap">
    <ReMap
      ref="mapRef"
      class="re-map-wrap__map"
      :map-type="MapType.OSM"
      :map="mapConfig"
      :map-key="{}"
      :map-tile="MapTile.NORMAL"
      :center="center"
      :zoom="zoom"
      :show-toolbar="false"
      :show-scale-line="false"
      :height="height"
      :dragging="true"
      :scroll-wheel-zoom="true"
      @map-initialized="onMapInitialized"
      @marker-click="onMarkerClick"
    />
    <div class="re-map-wrap__legend">
      <span class="re-map-wrap__item">
        <span class="re-map-wrap__dot is-on" />在线
      </span>
      <span class="re-map-wrap__item">
        <span class="re-map-wrap__dot is-off" />离线
      </span>
      <span class="re-map-wrap__count">共 {{ positionedDevices.length }} 台设备</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReMap —— 设备地图（Leaflet 真实地图）。
 *
 * 内部封装 @repo/re-map（OSM 免 key），对外保持原有接口：
 *   - props: { devices: DeviceInfo[] }
 *   - event: (e: 'select', dev: DeviceInfo) => void
 *
 * 行为：
 *   - 有经纬度的设备按 WGS84 [lat, lng] 落为 marker；无坐标的设备不上图；
 *   - 「选择设备」向下兼容原 SVG 版：点 marker 派发原始 DeviceInfo；
 *   - 地图初始视野按已定位设备包络（无定位设备时退回全国视野）。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, nextTick, ref, watch } from 'vue'
import ReMap, { MapType, MapTile, DEFAULT_MAP_CONFIG } from '@repo/re-map'
import type { MarkerOptions, MapUrlConfig } from '@repo/re-map'
import type { DeviceInfo } from '@pages/device/src/types/device'

const props = withDefaults(
  defineProps<{
    devices: DeviceInfo[]
    height?: number
  }>(),
  { height: 520 }
)

const emit = defineEmits<{
  (e: 'select', dev: DeviceInfo): void
}>()

/** re-map 暴露的方法（index.vue 为 @ts-nocheck，这里按使用面收敛类型） */
interface ReMapHandle {
  addMarker?: (options: MarkerOptions) => string
  clearMarkers?: () => void
  setCenter?: (lat: number, lng: number) => void
  setZoom?: (zoom: number) => void
  getMapInstance?: () => unknown
}

const mapRef = ref<ReMapHandle | null>(null)

// 默认中心：华东（杭州），与设备演示数据同区；无设备时也有一块地图可看
const DEFAULT_CENTER: [number, number] = [30.25, 120.15]
const DEFAULT_ZOOM = 6

/** 瓦片配置：OSM 免 key，直接复用 @repo/re-map 的默认配置 */
const mapConfig = DEFAULT_MAP_CONFIG as {
  [key in MapType]: { [key: string]: MapUrlConfig }
}

const center = ref<[number, number]>(DEFAULT_CENTER)
const zoom = ref(DEFAULT_ZOOM)

/** 已定位设备：latitude/longitude 都非空才可上图 */
const positionedDevices = computed(() =>
  (props.devices || []).filter(
    (d) => d.deviceInfoLatitude != null && d.deviceInfoLongitude != null
  )
)

/** Marker 与设备的映射：marker.id → device */
const deviceById = new Map<string, DeviceInfo>()

function markerIdOf(device: DeviceInfo): string {
  return `device:${device.deviceInfoId}`
}

function resetMarkers(): void {
  const rm = mapRef.value
  if (!rm || typeof rm.clearMarkers !== 'function') return
  deviceById.clear()
  rm.clearMarkers()
}

function renderMarkers(): void {
  const rm = mapRef.value
  if (!rm || typeof rm.addMarker !== 'function') return
  resetMarkers()
  for (const device of positionedDevices.value) {
    const lat = Number(device.deviceInfoLatitude)
    const lng = Number(device.deviceInfoLongitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const id = markerIdOf(device)
    deviceById.set(id, device)
    const options: MarkerOptions = {
      id,
      position: [lat, lng],
      title: device.deviceInfoName || device.deviceInfoId,
      data: { deviceInfoId: device.deviceInfoId },
      icon: {
        className: 're-map-device-marker',
        html: `<span class="re-map-device-pin ${device.deviceInfoOnline ? 'is-on' : 'is-off'}"></span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      }
    }
    rm.addMarker(options)
  }
}

function fitBounds(): void {
  const rm = mapRef.value
  const list = positionedDevices.value
  if (!list.length) return
  const lats = list.map((d) => Number(d.deviceInfoLatitude))
  const lngs = list.map((d) => Number(d.deviceInfoLongitude))
  if (!lats.length || lats.some((v) => !Number.isFinite(v))) return
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  if (minLat === maxLat && minLng === maxLng) {
    rm?.setCenter?.(minLat, minLng)
    rm?.setZoom?.(15)
    return
  }
  const pad = 0.05
  const bounds = [
    [minLat - pad, minLng - pad],
    [maxLat + pad, maxLng + pad]
  ] as [[number, number], [number, number]]
  const inst = rm?.getMapInstance?.() as { fitBounds?: (b: [[number, number], [number, number]]) => void } | undefined
  if (inst && typeof inst.fitBounds === 'function') {
    inst.fitBounds(bounds)
  } else {
    rm?.setCenter?.((minLat + maxLat) / 2, (minLng + maxLng) / 2)
    rm?.setZoom?.(list.length <= 1 ? 15 : 8)
  }
}

function onMapInitialized(): void {
  renderMarkers()
  fitBounds()
}

function onMarkerClick(payload: any): void {
  const markerData = payload?.data as MarkerOptions | undefined
  if (!markerData) return
  const id = markerData.id
  const device = deviceById.get(id || '')
  if (device) emit('select', device)
}

// 设备列表变化 → 重画 marker（首次 init 前挂的渲染由 onMapInitialized 兜底）
watch(
  () => props.devices,
  () => {
    void nextTick(renderMarkers)
  },
  { deep: false }
)

defineExpose({
  /** 取 Leaflet 地图实例（高级用法） */
  getMapInstance: () => mapRef.value?.getMapInstance?.(),
  /** 按经纬度移动视野 */
  flyTo: (lat: number, lng: number, z?: number) => {
    mapRef.value?.setCenter?.(lat, lng)
    if (z != null) mapRef.value?.setZoom?.(z)
  }
})
</script>

<style scoped>
.re-map-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay);
}
.re-map-wrap__map {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

/* 图例：压在地图右下角 */
.re-map-wrap__legend {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-bg-color) 88%, transparent);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  backdrop-filter: blur(4px);
}
.re-map-wrap__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.re-map-wrap__dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
}
.re-map-wrap__dot.is-on {
  background: var(--el-color-success);
}
.re-map-wrap__dot.is-off {
  background: var(--el-color-info);
}
</style>

<style>
/* marker 外层容器已由 re-map 生成，这里只定样式（非 scoped） */
.re-map-device-pin {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid var(--el-color-white, #fff);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}
.re-map-device-pin.is-on {
  background: var(--el-color-success, #67c23a);
}
.re-map-device-pin.is-off {
  background: var(--el-color-info, #909399);
}
</style>