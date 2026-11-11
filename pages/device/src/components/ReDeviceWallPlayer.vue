<template>
  <ReDialog
    v-model="visible"
    title="设备大屏"
    width="92vw"
    top="5vh"
    :draggable="false"
    :fullscreenable="true"
    :close-on-click-modal="false"
    :show-footer="false"
    destroy-on-close
  >
    <div class="dwall__body">
      <ReDevicePlayPanel
        v-if="visible"
        mode="wall"
        :device="null"
        :devices="devices"
        :vendors="vendors"
      />
    </div>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 设备大屏播放台
 *
 * <p>顶部「设备大屏」按钮打开：左侧是所有可播放设备的通道，右侧是画面墙，
 * 直接复用播放页签的取流与拖拽逻辑（{@link ReDevicePlayPanel} 的 wall 形态），
 * 不再跳到独立的 DeviceScreen 路由。</p>
 *
 * <p>弹窗内不携带任何台账信息，只解决「现在把哪几路画面摆到一起看」。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import ReDialog from '@repo/ui/re-dialog'
import ReDevicePlayPanel from '../components/ReDevicePlayPanel.vue'
import type { DeviceInfo, DeviceVendorDescriptor } from '../types/device'

defineProps<{
  /** 台账里的全部设备（可播放的才会进入画面源） */
  devices: DeviceInfo[]
  /** 厂商描述符：提供能力位，判断哪些设备能出画面 */
  vendors: DeviceVendorDescriptor[]
}>()

const visible = defineModel<boolean>({ default: false })
</script>

<style scoped>
/* 弹窗 body 已有内边距，这里只把播放台撑到接近整屏 */
.dwall__body {
  height: calc(84vh - 110px);
  min-height: 420px;
}
</style>
