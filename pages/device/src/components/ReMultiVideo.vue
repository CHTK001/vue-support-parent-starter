<template>
  <ReDialog
    :model-value="modelValue"
    title="多路视频"
    width="82%"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="mvv">
      <header class="mvv__head">
        <span class="mvv__label">宫格布局</span>
        <el-radio-group
          :model-value="layout"
          size="small"
          @update:model-value="(v: number) => emit('update:layout', v)"
        >
          <el-radio-button :value="1">1 分屏</el-radio-button>
          <el-radio-button :value="4">4 分屏</el-radio-button>
          <el-radio-button :value="9">9 分屏</el-radio-button>
          <el-radio-button :value="16">16 分屏</el-radio-button>
        </el-radio-group>
        <span class="mvv__hint">每个格子可独立选择通道</span>
      </header>

      <div class="mvv__grid" :style="`grid-template-columns: repeat(${Math.sqrt(layout)}, 1fr)`">
        <div v-for="i in layout" :key="i" class="mvv__cell">
          <ReVideo :url="urls[i - 1]" :channel="channels[i - 1]" class="mvv__video" />
          <el-select
            :model-value="channels[i - 1]"
            class="mvv__select"
            size="small"
            placeholder="通道"
            @update:model-value="(v: number) => emit('channelChange', { index: i - 1, value: v })"
          >
            <el-option
              v-for="ch in channelList"
              :key="ch.deviceChannelId || ch.deviceChannelNo"
              :label="ch.deviceChannelName || `通道 ${ch.deviceChannelNo}`"
              :value="ch.deviceChannelNo"
            />
          </el-select>
          <span class="mvv__slot">{{ i }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <ReButton @click="emit('update:modelValue', false)">关闭</ReButton>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReVideo from './ReVideo.vue'
import type { DeviceChannel } from '../types/device'

defineProps<{
  modelValue: boolean
  layout: number
  urls: string[]
  channels: number[]
  channelList: DeviceChannel[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'update:layout', val: number): void
  (e: 'channelChange', payload: { index: number; value: number }): void
}>()
</script>

<style scoped>
.mvv {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mvv__head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  border-radius: var(--el-radius-lg, 12px);
  background: color-mix(in srgb, var(--el-text-color-primary) 4%, transparent);
}
.mvv__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.mvv__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.mvv__grid {
  display: grid;
  gap: 10px;
}
.mvv__cell {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
  background: #05070c;
}
.mvv__video {
  width: 100%;
  height: 100%;
}
.mvv__select {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 132px;
}
.mvv__slot {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: color-mix(in srgb, #000 42%, transparent);
}
</style>
