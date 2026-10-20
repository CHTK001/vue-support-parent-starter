<template>
  <section class="rmap">
    <header class="rmap__head">
      <div class="rmap__title">
        <span class="rmap__bar" />
        <span>设备分布</span>
      </div>
      <div class="rmap__legend">
        <span class="rmap__legend-item">
          <i class="rmap__legend-dot rmap__legend-dot--on" />在线
        </span>
        <span class="rmap__legend-item">
          <i class="rmap__legend-dot rmap__legend-dot--off" />离线
        </span>
        <span class="rmap__total">共 {{ positionedDevices.length }} 台</span>
      </div>
    </header>

    <div class="rmap__canvas">
      <svg class="rmap__svg" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
        <g class="rmap__grid">
          <line v-for="i in 8" :key="'v' + i" :x1="i * 100" y1="0" :x2="i * 100" y2="400" />
          <line v-for="i in 4" :key="'h' + i" x1="0" :y1="i * 100" x2="800" :y2="i * 100" />
        </g>
        <g class="rmap__road">
          <line x1="0" y1="200" x2="800" y2="200" />
          <line x1="400" y1="0" x2="400" y2="400" />
        </g>

        <g
          v-for="(dev, idx) in positionedDevices"
          :key="dev.deviceInfoId"
          class="rmap__node"
          :class="{ 'is-selected': selectedId === dev.deviceInfoId }"
          @click="emit('select', dev)"
        >
          <circle :cx="dev._x" :cy="dev._y" r="18" class="rmap__halo" :class="dev.deviceInfoOnline ? 'is-on' : 'is-off'" />
          <circle :cx="dev._x" :cy="dev._y" r="9" :fill="dev.deviceInfoOnline ? 'var(--el-color-success)' : 'var(--el-color-info)'" />
          <text :x="dev._x" :y="dev._y + 3.5" text-anchor="middle" class="rmap__index">{{ idx + 1 }}</text>
          <text :x="dev._x" :y="dev._y - 18" text-anchor="middle" class="rmap__label">{{ dev.deviceInfoName }}</text>
        </g>
      </svg>
      <div v-if="!positionedDevices.length" class="rmap__empty">
        <el-icon :size="26"><Location /></el-icon>
        <span>暂无已配置经纬度的设备</span>
        <span class="rmap__empty-hint">在设备表单中填写纬度 / 经度后，这里才会出现地图标志</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
<<<<<<< HEAD
import type { DeviceInfo } from '@pages/device/src/types/device'
=======
import { Location } from '@element-plus/icons-vue'
import type { DeviceInfo } from '../types/device'
>>>>>>> feat/device-stream

const props = defineProps<{
  devices: DeviceInfo[]
  /** 当前选中的设备：在地图上加一圈高亮 */
  selectedId?: string
}>()

const emit = defineEmits<{
  (e: 'select', dev: DeviceInfo): void
}>()

const MAP_WIDTH = 800
const MAP_HEIGHT = 400

/**
 * 只画真正有经纬度的设备。
 *
 * <p>没有坐标的设备以前会被铺到一张“假网格”上，看起来像有位置，实际是随机摆放。
 * 现在宁可不画，也不误导；空态里提示去设备表单补经纬度。</p>
 */
const positionedDevices = computed(() => {
  const list = props.devices || []
  return list
    .filter((dev) => dev.deviceInfoLatitude != null && dev.deviceInfoLongitude != null)
    .map((dev) => {
      const x = ((Number(dev.deviceInfoLongitude) + 180) / 360) * MAP_WIDTH
      const y = ((90 - Number(dev.deviceInfoLatitude)) / 180) * MAP_HEIGHT
      return {
        ...dev,
        _x: Math.max(24, Math.min(MAP_WIDTH - 24, x)),
        _y: Math.max(24, Math.min(MAP_HEIGHT - 24, y)),
      }
    })
})
</script>

<style scoped>
.rmap {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.rmap__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.rmap__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.rmap__bar {
  width: 6px;
  height: 16px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.rmap__legend {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.rmap__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.rmap__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.rmap__legend-dot--on {
  background: var(--el-color-success);
}
.rmap__legend-dot--off {
  background: var(--el-color-info);
}
.rmap__total {
  padding-left: 12px;
  border-left: 1px solid var(--el-border-color-lighter);
}
.rmap__canvas {
  position: relative;
  height: 380px;
  background:
    radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--el-color-primary) 6%, transparent), transparent 55%),
    var(--el-fill-color-blank, var(--el-bg-color));
}
.rmap__svg {
  width: 100%;
  height: 100%;
  display: block;
}
.rmap__empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  background: color-mix(in srgb, var(--el-bg-color) 70%, transparent);
}
.rmap__empty-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.rmap__node.is-selected .rmap__halo {
  opacity: 1;
  stroke-width: 3;
}
.rmap__grid line {
  stroke: var(--el-border-color-lighter);
  stroke-width: 1;
}
.rmap__road line {
  stroke: color-mix(in srgb, var(--el-border-color) 70%, transparent);
  stroke-width: 14;
  stroke-linecap: round;
}
.rmap__node {
  cursor: pointer;
}
.rmap__node:hover .rmap__halo {
  opacity: 1;
}
.rmap__halo {
  fill: transparent;
  stroke-width: 1.5;
  opacity: 0.45;
  transition: opacity 0.16s ease;
}
.rmap__halo.is-on {
  stroke: var(--el-color-success);
}
.rmap__halo.is-off {
  stroke: var(--el-color-info);
}
.rmap__index {
  font-size: 9px;
  font-weight: 700;
  fill: var(--el-color-white);
}
.rmap__label {
  font-size: 11.5px;
  fill: var(--el-text-color-regular);
}
</style>
