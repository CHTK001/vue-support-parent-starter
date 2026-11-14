<template>
  <div class="screen-page">
    <header class="screen-head">
      <div class="flex items-center gap-3">
        <el-button size="small" @click="back">返回台账</el-button>
        <h1 class="screen-title">设备大屏</h1>
        <span class="screen-sub">{{ filtered.length }} / {{ devices.length }} 台设备</span>
      </div>
      <div class="flex items-center gap-2">
        <el-button size="small" @click="toolbarVisible = !toolbarVisible">
          {{ toolbarVisible ? '隐藏工具栏' : '显示工具栏' }}
        </el-button>
        <el-button size="small" :loading="loading" @click="load">刷新</el-button>
      </div>
    </header>

    <div v-show="toolbarVisible" class="screen-toolbar">
      <ReRadioGroup v-model="category" size="small">
        <ReRadioButton value="all">全部</ReRadioButton>
        <ReRadioButton v-for="(label, key) in CATEGORY_LABELS" :key="key" :value="key">
          {{ label }}
        </ReRadioButton>
      </ReRadioGroup>
      <el-checkbox v-model="onlineOnly" size="small">仅在线</el-checkbox>
      <el-checkbox v-model="locatedOnly" size="small">仅已定位</el-checkbox>
    </div>

    <div class="screen-body">
      <aside v-show="toolbarVisible" class="screen-side">
        <div class="stat-grid">
          <div class="stat-card">
            <span class="stat-label">设备总数</span>
            <strong>{{ devices.length }}</strong>
          </div>
          <div class="stat-card online">
            <span class="stat-label">在线</span>
            <strong>{{ onlineCount }}</strong>
          </div>
          <div class="stat-card offline">
            <span class="stat-label">离线</span>
            <strong>{{ devices.length - onlineCount }}</strong>
          </div>
        </div>
        <div class="side-list">
          <div
            v-for="device in filtered"
            :key="device.deviceInfoId"
            class="side-item"
            :class="{ active: selected?.deviceInfoId === device.deviceInfoId }"
            @click="selected = device"
          >
            <span class="dot" :class="{ online: device.deviceInfoOnline }" />
            <span class="side-name">{{ device.deviceInfoName }}</span>
            <span class="side-cat">{{ getCategoryLabel(device.deviceInfoCategory) }}</span>
          </div>
          <div v-if="!filtered.length" class="side-empty">暂无符合条件的设备</div>
        </div>
      </aside>

      <main class="screen-map">
        <ReMap :devices="filtered" @select="selected = $event" />
        <div v-if="selected" class="device-card">
          <div class="flex items-center justify-between">
            <strong>{{ selected.deviceInfoName }}</strong>
            <el-button link type="primary" @click="selected = null">关闭</el-button>
          </div>
          <div class="card-row">
            <span>状态</span>
            <span :class="selected.deviceInfoOnline ? 'text-green-500' : 'text-gray-400'">
              {{ selected.deviceInfoOnline ? '在线' : '离线' }}
            </span>
          </div>
          <div class="card-row"><span>编码</span><span>{{ selected.deviceInfoCode || '-' }}</span></div>
          <div class="card-row"><span>厂商</span><span>{{ selected.deviceInfoVendor || '-' }}</span></div>
          <div class="card-row"><span>分类</span><span>{{ getCategoryLabel(selected.deviceInfoCategory) }}</span></div>
          <div class="card-row"><span>负责人</span><span>{{ selected.deviceInfoOwnerName || '-' }}</span></div>
          <div class="card-row">
            <span>位置</span>
            <span>
              {{ selected.deviceInfoLatitude ?? '-' }}, {{ selected.deviceInfoLongitude ?? '-' }}
            </span>
          </div>
          <el-button class="mt-2" size="small" type="primary" plain @click="openDetail(selected)">
            查看详情
          </el-button>
        </div>
      </main>
    </div>

    <ReDialog v-model="detailVisible" :title="detailTitle" width="640px" destroy-on-close>
      <div class="text-sm space-y-2">
        <div>设备编码：{{ selected?.deviceInfoCode || '-' }}</div>
        <div>厂商 / 型号：{{ selected?.deviceInfoVendor || '-' }} / {{ selected?.deviceInfoModel || '-' }}</div>
        <div>在线状态：{{ selected?.deviceInfoOnline ? '在线' : '离线' }}</div>
        <div>负责人：{{ selected?.deviceInfoOwnerName || '-' }}</div>
        <div>地址：{{ selected?.deviceInfoAddress || '-' }}</div>
      </div>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ReMap from '../components/ReMap.vue'
import ReDialog from '@repo/ui/re-dialog'
import { deviceApi } from '../api/deviceApi'
import { CATEGORY_LABELS, getCategoryLabel } from '../utils/deviceCategory'
import type { DeviceInfo } from '../types/device'
import { ReRadioGroup, ReRadioButton } from "@repo/ui/re-kit";

const router = useRouter()
const devices = ref<DeviceInfo[]>([])
const loading = ref(false)
const toolbarVisible = ref(true)
const category = ref<string>('all')
const onlineOnly = ref(false)
const locatedOnly = ref(false)
const selected = ref<DeviceInfo | null>(null)
const detailVisible = ref(false)

const onlineCount = computed(() => devices.value.filter((item) => item.deviceInfoOnline).length)
const filtered = computed(() =>
  devices.value.filter((item) => {
    if (category.value !== 'all' && item.deviceInfoCategory !== category.value) return false
    if (onlineOnly.value && !item.deviceInfoOnline) return false
    if (locatedOnly.value && (item.deviceInfoLatitude == null || item.deviceInfoLongitude == null)) return false
    return true
  })
)
const detailTitle = computed(() => selected.value?.deviceInfoName || '设备详情')

function back() {
  router.push('/device')
}

function openDetail(device: DeviceInfo) {
  selected.value = device
  detailVisible.value = true
}

async function load() {
  loading.value = true
  try {
    const result = await deviceApi.page({ pageNo: 1, pageSize: 500 })
    const list = (result as unknown as { data?: DeviceInfo[] })?.data
      ?? (result as unknown as { records?: DeviceInfo[] })?.records
      ?? []
    devices.value = list
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.screen-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  min-height: calc(100vh - 110px);
  background: var(--el-bg-color-page);
}
.screen-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.screen-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.screen-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.screen-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color-overlay);
}
.screen-body {
  flex: 1;
  display: flex;
  gap: 10px;
  min-height: 0;
}
.screen-side {
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 6px;
  border-radius: 10px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
}
.stat-card strong {
  font-size: 18px;
}
.stat-card.online strong {
  color: var(--el-color-success);
}
.stat-card.offline strong {
  color: var(--el-color-danger);
}
.stat-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.side-list {
  flex: 1;
  overflow: auto;
  border-radius: 10px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  padding: 6px;
}
.side-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}
.side-item:hover,
.side-item.active {
  background: var(--el-color-primary-light-9);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-info);
}
.dot.online {
  background: var(--el-color-success);
}
.side-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.side-cat {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.side-empty {
  padding: 18px 10px;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.screen-map {
  position: relative;
  flex: 1;
  min-height: 520px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay);
}
.screen-map :deep(.re-map-wrap) {
  height: 100%;
  min-height: 520px;
  border: none;
}
.device-card {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 260px;
  padding: 12px;
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-light);
  font-size: 12px;
}
.card-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 3px 0;
  color: var(--el-text-color-regular);
}
</style>
