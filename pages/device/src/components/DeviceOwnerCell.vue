<template>
  <div class="leading-tight">
    <div class="text-sm text-el-text">{{ ownerText(device) }}</div>
    <div v-if="ownerSubText(device)" class="text-xs text-el-text-secondary mt-0.5">
      {{ ownerSubText(device) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ownerSubText, ownerText } from '@pages/device/src/utils/deviceFormat'
import type { DeviceInfo } from '@pages/device/src/types/device'

defineProps<{
  device: DeviceInfo
}>()
</script>
