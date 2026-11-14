<template>
  <div class="wall-page">
    <header class="wall-head">
      <div class="wall-head__main">
        <span class="wall-head__title">设备大屏</span>
        <span class="wall-head__sub">{{ devices.length }} 台设备 · 新标签全浏览器模式</span>
      </div>
      <div class="wall-head__ops">
        <ReButton icon="RefreshLeft" layout="square" size="small" tip="返回台账" @click="back" />
        <ReButton icon="RefreshRight" layout="square" size="small" tip="刷新设备" :loading="loading" @click="load" />
      </div>
    </header>

    <main class="wall-main">
      <ReDevicePlayPanel mode="wall" :device="null" :devices="devices" :vendors="vendors" />
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * 设备大屏独立页（新标签打开）。
 *
 * <p>不渲染应用外壳：宿主注册本路由时带 {@code meta.standalone: true}，
 * 新标签页里只有这一屏画面墙，没有侧边栏 / 页签 / Dock。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import ReButton from '@repo/ui/re-button'
import ReDevicePlayPanel from '../components/ReDevicePlayPanel.vue'
import deviceApi from '../api/deviceApi'
import type { DeviceInfo, DeviceVendorDescriptor } from '../types/device'

const router = useRouter()

const devices = ref<DeviceInfo[]>([])
const vendors = ref<DeviceVendorDescriptor[]>([])
const loading = ref(false)

/** 拉设备与厂商描述符：播放台需要能力位判断哪些设备能出画面 */
async function load(): Promise<void> {
  loading.value = true
  try {
    const [list, descriptorList] = await Promise.all([deviceApi.list(), deviceApi.listVendors()])
    devices.value = list
    vendors.value = descriptorList
  } catch {
    // 播放台内部会展示空态
  } finally {
    loading.value = false
  }
}

/** 回到台账：有历史就后退，否则回设备资产首页（两宿主都注册了 /device） */
function back(): void {
  if (window.history.length > 1) {
    router.back()
  } else {
    void router.push('/device')
  }
}

onMounted(load)
</script>

<style scoped>
.wall-page {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100vh;
  min-height: 0;
  padding: 8px;
  box-sizing: border-box;
  background: var(--el-bg-color);
}

.wall-head {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
}

.wall-head__main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.wall-head__title {
  font-size: 13px;
  font-weight: 600;
}

.wall-head__sub {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.wall-head__ops {
  display: flex;
  flex: none;
  gap: 6px;
  margin-left: auto;
}

.wall-main {
  flex: 1;
  min-height: 0;
}
</style>
