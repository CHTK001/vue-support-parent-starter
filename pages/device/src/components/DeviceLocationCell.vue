<template>
  <div v-if="hasLocation(device)" class="leading-tight">
    <el-dropdown trigger="click" @command="openMap">
      <span class="inline-flex items-center gap-1 text-xs text-el-primary cursor-pointer">
        {{ formatCoord(device.deviceInfoLatitude, device.deviceInfoLongitude) }}
        <el-icon><ArrowDown /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="link in links"
            :key="link.label"
            :command="link.url"
          >
            {{ link.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <div v-if="device.deviceInfoAddress" class="text-xs text-el-text-secondary mt-0.5">
      {{ device.deviceInfoAddress }}
    </div>
  </div>
  <span v-else class="text-xs text-el-text-secondary">未定位</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { formatCoord, hasLocation, mapLinks } from '@pages/device/src/utils/deviceFormat'
import type { DeviceInfo } from '@pages/device/src/types/device'

const props = defineProps<{
  device: DeviceInfo
}>()

const links = computed(() => mapLinks(props.device))

function openMap(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>
