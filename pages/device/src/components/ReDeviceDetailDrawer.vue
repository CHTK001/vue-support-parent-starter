<template>
  <el-drawer
    v-model="visible"
    size="72%"
    destroy-on-close
    :with-header="false"
    class="device-detail-drawer"
  >
    <ReDeviceDetailPanel
      ref="panelRef"
      :device="device"
      :devices="devices"
      :vendors="vendors"
      @edit="(d) => emit('edit', d)"
      @refreshed="emit('refreshed')"
    />
  </el-drawer>
</template>

<script setup lang="ts">
/**
 * 设备详情抽屉 —— 内容的唯一实现是 ReDeviceDetailPanel
 *
 * 页面主路径走工作区页签（设备详情 tab），这里保留抽屉形态给「独立页 / 大屏」
 * 等不方便开页签的场景复用，避免同一套概览再写第二遍。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref } from 'vue'
import ReDeviceDetailPanel from '../components/ReDeviceDetailPanel.vue'
import type { DeviceInfo, DeviceVendorDescriptor } from '../types/device'

const props = defineProps<{
  modelValue: boolean
  device: DeviceInfo | null
  devices: DeviceInfo[]
  vendors: DeviceVendorDescriptor[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit', device: DeviceInfo): void
  (e: 'refreshed'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const panelRef = ref<InstanceType<typeof ReDeviceDetailPanel> | null>(null)

defineExpose({
  openVideo: (device: DeviceInfo, type: 'main' | 'sub') => panelRef.value?.openVideo(device, type)
})
</script>

<style scoped>
.device-detail-drawer :deep(.el-drawer__body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 8px 16px 16px;
}
</style>
