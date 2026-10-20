<template>
  <div class="flex items-center gap-1 whitespace-nowrap">
    <el-tag
      size="small"
      effect="plain"
      type="primary"
      class="cursor-pointer"
      title="预览主码流"
      @click.stop="emit('preview', 'main')"
    >
      主
    </el-tag>
    <el-tag
      size="small"
      effect="plain"
      type="success"
      class="cursor-pointer"
      title="预览子码流"
      @click.stop="emit('preview', 'sub')"
    >
      子
    </el-tag>
    <span class="text-xs text-el-text-secondary ml-1">
      {{ device.deviceInfoChannelCount ?? 0 }} 路
    </span>
  </div>
</template>

<script setup lang="ts">
import type { DeviceInfo } from '@pages/device/src/types/device'

defineProps<{
  device: DeviceInfo
}>()

const emit = defineEmits<{
  (e: 'preview', streamType: 'main' | 'sub'): void
}>()
</script>
