<template>
  <span
    class="inline-flex items-center gap-2 whitespace-nowrap"
    :class="online ? 'text-emerald-600' : 'text-el-text-secondary'"
    :title="online ? '设备在线' : '设备离线'"
  >
    <span class="pulse-dot" :class="online ? 'is-online' : 'is-offline'" />
    <span class="text-xs font-medium">{{ online ? '在线' : '离线' }}</span>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  online?: boolean
}>()
</script>

<style scoped>
.pulse-dot {
  position: relative;
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
}
.is-online {
  background: var(--el-color-success);
}
.is-online::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 9999px;
  border: 1px solid var(--el-color-success);
  animation: device-pulse 1.8s ease-out infinite;
}
.is-offline {
  background: var(--el-color-info);
}
@keyframes device-pulse {
  0% {
    transform: scale(0.6);
    opacity: 0.8;
  }
  70% {
    transform: scale(1.6);
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .is-online::after {
    animation: none;
  }
}
</style>
