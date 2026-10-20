<template>
  <div class="sc-map rounded-xl border border-el-border overflow-hidden bg-el-bg">
    <div class="map-canvas relative h-96">
      <svg class="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
        <g class="map-grid" stroke="var(--el-border-color)" stroke-width="1">
          <line v-for="i in 8" :key="'v' + i" :x1="i * 100" y1="0" :x2="i * 100" y2="400" />
          <line v-for="i in 4" :key="'h' + i" x1="0" :y1="i * 100" x2="800" :y2="i * 100" />
        </g>
        <g class="map-road" stroke="var(--el-border-color-lighter)" stroke-width="14" fill="none">
          <line x1="0" y1="200" x2="800" y2="200" />
          <line x1="400" y1="0" x2="400" y2="400" />
        </g>
        <g
          v-for="(dev, idx) in positionedDevices"
          :key="dev.deviceInfoId"
          class="cursor-pointer"
          @click="emit('select', dev)"
        >
          <circle
            :cx="dev._x"
            :cy="dev._y"
            r="10"
            :fill="dev.deviceInfoOnline ? 'var(--el-color-success)' : 'var(--el-color-info)'"
            opacity="0.85"
          />
          <circle :cx="dev._x" :cy="dev._y" r="16" fill="transparent" stroke="var(--el-color-primary)" stroke-width="1" opacity="0.4" />
          <text
            :x="dev._x"
            :y="dev._y - 16"
            text-anchor="middle"
            class="fill-el-text"
            style="font-size: 12px"
          >{{ dev.deviceInfoName }}</text>
          <text
            :x="dev._x"
            :y="dev._y + 4"
            text-anchor="middle"
            style="font-size: 9px"
            class="fill-white"
          >{{ idx + 1 }}</text>
        </g>
      </svg>
    </div>
    <div class="flex items-center gap-6 px-4 py-2 border-t border-el-border text-xs text-el-text-secondary">
      <span class="flex items-center gap-1">
        <span class="w-2.5 h-2.5 rounded-full" style="background: var(--el-color-success)" />在线
      </span>
      <span class="flex items-center gap-1">
        <span class="w-2.5 h-2.5 rounded-full" style="background: var(--el-color-info)" />离线
      </span>
      <span class="ml-auto">共 {{ positionedDevices.length }} 台设备</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DeviceInfo } from '@pages/device/src/types/device'

const props = defineProps<{
  devices: DeviceInfo[]
}>()

const emit = defineEmits<{
  (e: 'select', dev: DeviceInfo): void
}>()

const MAP_WIDTH = 800
const MAP_HEIGHT = 400

const positionedDevices = computed(() => {
  const list = props.devices || []
  const total = list.length
  return list.map((dev, idx) => {
    let x: number
    let y: number
    const lat = dev.deviceInfoLatitude
    const lng = dev.deviceInfoLongitude
    if (lat != null && lng != null) {
      x = ((lng + 180) / 360) * MAP_WIDTH
      y = ((90 - lat) / 180) * MAP_HEIGHT
    } else {
      const cols = Math.ceil(Math.sqrt(total || 1))
      const col = idx % cols
      const row = Math.floor(idx / cols)
      x = 80 + col * ((MAP_WIDTH - 160) / (cols || 1))
      y = 60 + row * 80
    }
    return { ...dev, _x: Math.max(24, Math.min(MAP_WIDTH - 24, x)), _y: Math.max(24, Math.min(MAP_HEIGHT - 24, y)) }
  })
})
</script>

<style scoped>
.fill-el-text {
  fill: var(--el-text-color-primary);
}
/* 序号文字压在在线/离线彩色圆点上，用 EP 常量白而非 --el-text-color-primary：
   暗色模式下后者是近黑字，压在彩色圆点上会读不出（EP 的 --el-color-white 亮暗不变） */
.fill-white {
  fill: var(--el-color-white);
}
</style>
