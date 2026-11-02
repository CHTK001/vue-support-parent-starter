<template>
  <div class="ddp">
    <header class="ddp__head">
      <div class="ddp__ident">
        <div class="ddp__title-row">
          <span class="ddp__name" :title="device?.deviceInfoName">{{ device?.deviceInfoName || '设备名称' }}</span>
          <DeviceStatusPulse :online="device?.deviceInfoOnline" />
        </div>
        <div class="ddp__sub">
          {{ device?.deviceInfoCode || device?.deviceInfoSerial || device?.deviceInfoIp || '无' }}
        </div>
      </div>
      <div class="ddp__actions">
        <el-button size="small" @click="editDevice">编辑</el-button>
        <el-button size="small" @click="refreshStatus">刷新状态</el-button>
        <el-button size="small" type="primary" @click="reconnect">重连</el-button>
      </div>
    </header>

    <div v-if="device" class="ddp__body">
      <el-tabs v-model="activeTab" class="device-tabs">
        <el-tab-pane v-if="tabKeys.includes('overview')" label="概览" name="overview">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="设备编码">
              <span class="inline-flex items-center gap-1">
                {{ device.deviceInfoCode || '无' }}
                <el-button
                  v-if="device.deviceInfoCode"
                  link
                  size="small"
                  @click="copy(device.deviceInfoCode)"
                >
                  复制
                </el-button>
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="厂商 / 型号">
              {{ vendorName(device.deviceInfoVendor) }} / {{ device.deviceInfoModel || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusMeta(device.deviceInfoStatus).type" size="small" effect="plain">
                {{ statusMeta(device.deviceInfoStatus).label }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="分类 / 小类">
              {{ getCategoryLabel(device.deviceInfoCategory) }} / {{ device.deviceInfoSubCategory || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="IP / 端口">
              {{ device.deviceInfoIp ? `${device.deviceInfoIp}:${device.deviceInfoPort}` : '平台接入' }}
            </el-descriptions-item>
            <el-descriptions-item label="序列号 / 固件">
              {{ device.deviceInfoSerial || '无' }} / {{ device.deviceInfoFirmware || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="通道数">{{ device.deviceInfoChannelCount ?? 0 }}</el-descriptions-item>
            <el-descriptions-item label="责任人">
              {{ device.deviceInfoOwnerName || '未填写' }}
              <span v-if="ownerSubText(device)" class="text-el-text-secondary">
                （{{ ownerSubText(device) }}）
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="来源">{{ sourceLabel(device.deviceInfoSource) }}</el-descriptions-item>
            <el-descriptions-item label="位置">
              <button v-if="hasLocation(device)" class="text-el-primary text-left" @click="openMap">
                {{ formatCoord(device.deviceInfoLatitude, device.deviceInfoLongitude) }}
                <div class="text-xs text-el-text-secondary">{{ device.deviceInfoAddress || '打开地图' }}</div>
              </button>
              <span v-else class="text-el-text-secondary">未定位</span>
            </el-descriptions-item>
            <el-descriptions-item label="区域/楼层">{{ device.deviceInfoArea || '无' }}</el-descriptions-item>
            <el-descriptions-item label="标签">{{ device.deviceInfoTags || '无' }}</el-descriptions-item>
            <el-descriptions-item label="最后在线">
              <span :title="formatDateTimeFull(device.deviceInfoLastOnlineAt)">
                {{ formatRelative(device.deviceInfoLastOnlineAt) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="最后离线">
              <span :title="formatDateTimeFull(device.deviceInfoLastOfflineAt)">
                {{ formatRelative(device.deviceInfoLastOfflineAt) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="离线阈值">
              {{ device.deviceInfoOfflineThreshold ?? '使用默认' }} 秒
            </el-descriptions-item>
            <el-descriptions-item label="安装 / 维保">
              {{ device.deviceInfoInstallAt || '无' }} / {{ device.deviceInfoWarrantyEnd || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(device.deviceInfoCreatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDateTime(device.deviceInfoUpdatedAt) }}</el-descriptions-item>
          </el-descriptions>
          <div class="mt-4">
            <ReTimeline title="设备时间线" :items="timeline" />
          </div>
          <div v-if="device.deviceInfoRemark" class="mt-3 text-sm text-el-text-secondary">
            备注：{{ device.deviceInfoRemark }}
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="tabKeys.includes('map')" label="地图" name="map">
          <ReMap :devices="mapDevices" @select="onMapSelect" />
        </el-tab-pane>

        <el-tab-pane label="通道" name="channel">
          <ReChannelManager :device-id="device.deviceInfoId" />
        </el-tab-pane>

        <el-tab-pane label="视频" name="video">
          <div class="flex gap-4">
            <div class="flex-1 min-w-0">
              <ReVideo
                :url="videoUrl"
                :protocol="videoProtocol"
                :channel="currentChannel"
                :gateway="RTSP_GATEWAY"
                class="rounded-xl overflow-hidden bg-black aspect-video"
                @error="onVideoError"
              />
              <div class="flex flex-wrap items-center gap-2 mt-3">
                <el-select v-model="currentChannel" placeholder="通道" style="width: 130px" @change="reloadStream">
                  <el-option
                    v-for="ch in channelOptions"
                    :key="ch.no"
                    :label="ch.name"
                    :value="ch.no"
                  />
                </el-select>
                <el-radio-group v-model="streamType" size="small" @change="reloadStream">
                  <el-radio-button label="main">主码流</el-radio-button>
                  <el-radio-button label="sub">子码流</el-radio-button>
                </el-radio-group>
                <el-select v-model="videoProtocol" placeholder="协议" style="width: 105px" @change="reloadStream">
                  <el-option label="HLS" value="hls" />
                  <el-option label="FLV" value="flv" />
                  <el-option label="RTSP" value="rtsp" />
                </el-select>
                <el-button type="primary" plain @click="reloadStream">
                  <el-icon class="mr-1"><Refresh /></el-icon>刷新
                </el-button>
                <el-button type="primary" plain @click="openMultiView">
                  <el-icon class="mr-1"><Grid /></el-icon>多路
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="云台" name="ptz">
          <RePtzControl
            :presets="presets"
            :zoom="zoom"
            :focus="focus"
            @move="ptzControl"
            @zoom="(v: number) => (zoom = v)"
            @focus="(v: number) => (focus = v)"
            @add-preset="addPreset"
            @call-preset="callPreset"
            @delete-preset="deletePreset"
          />
        </el-tab-pane>

        <el-tab-pane label="门禁" name="access">
          <ReAccessPanel
            :doors="device.doors || []"
            :events="accessEvents"
            @unlock="remoteUnlock"
            @refresh="fetchAccessEvents"
          />
        </el-tab-pane>

        <el-tab-pane label="事件" name="events">
          <ReEventPanel
            :events="events"
            :filter="eventFilter"
            :realtime="eventRealtime"
            @query="fetchEvents"
            @update:filter="(v: any) => (eventFilter = v)"
            @update:realtime="(v: boolean) => (eventRealtime = v)"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <ReMultiVideo
      v-model="multiViewVisible"
      :layout="multiLayout"
      :urls="multiUrls"
      :channels="multiChannels"
      :channel-list="channelOptions.map((ch) => ({ deviceChannelNo: ch.no, deviceChannelName: ch.name })) as any"
      :gateway="RTSP_GATEWAY"
      @update:layout="(v: number) => (multiLayout = v)"
      @channel-change="onMultiChannelChange"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 设备详情面板
 *
 * 抽屉（ReDeviceDetailDrawer）与工作区页签（设备详情 tab）共用同一份内容：
 * 概览 / 地图 / 通道 / 视频 / 云台 / 门禁 / 事件。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { message } from '@repo/core'
import { Grid, Refresh } from '@element-plus/icons-vue'
import ReVideo from '@pages/device/src/components/ReVideo.vue'
import ReMultiVideo from '@pages/device/src/components/ReMultiVideo.vue'
import RePtzControl from '@pages/device/src/components/RePtzControl.vue'
import ReAccessPanel from '@pages/device/src/components/ReAccessPanel.vue'
import ReEventPanel from '@pages/device/src/components/ReEventPanel.vue'
import ReTimeline from '@pages/device/src/components/ReTimeline.vue'
import ReMap from '@pages/device/src/components/ReMap.vue'
import ReChannelManager from '@pages/device/src/components/ReChannelManager.vue'
import DeviceStatusPulse from '@pages/device/src/components/DeviceStatusPulse.vue'
import { RTSP_GATEWAY } from '../utils/streamConfig'
import { deviceApi } from '@pages/device/src/api/deviceApi'
import { getCategoryLabel } from '@pages/device/src/utils/deviceCategory'
import {
  copyText,
  formatCoord,
  formatDateTime,
  formatDateTimeFull,
  formatRelative,
  hasLocation,
  mapLinks,
  ownerSubText,
  sourceLabel,
  statusMeta
} from '@pages/device/src/utils/deviceFormat'
import type {
  AccessEvent,
  DeviceEvent,
  DeviceInfo,
  DeviceVendorDescriptor,
  Preset,
  TimelineItem
} from '@pages/device/src/types/device'

const props = defineProps<{
  device: DeviceInfo | null
  devices: DeviceInfo[]
  vendors: DeviceVendorDescriptor[]
}>()

const emit = defineEmits<{
  (e: 'edit', device: DeviceInfo): void
  (e: 'refreshed'): void
}>()

const activeTab = ref('overview')
const videoUrl = ref('')
const videoProtocol = ref<'hls' | 'flv' | 'rtsp'>('hls')
const streamType = ref<'main' | 'sub'>('main')
const currentChannel = ref(1)
const channels = ref<{ no: number; name: string }[]>([])
const multiViewVisible = ref(false)
const multiLayout = ref(4)
const multiChannels = ref<number[]>([])
const multiUrls = ref<string[]>([])
const zoom = ref(50)
const focus = ref(50)
const presets = ref<Preset[]>([])
const accessEvents = ref<AccessEvent[]>([])
const events = ref<DeviceEvent[]>([])
const eventFilter = ref<{ type: string; dateRange: any }>({ type: '', dateRange: null })
const eventRealtime = ref(true)

const mapDevices = computed(() => {
  if (!props.device) return props.devices
  return [props.device, ...props.devices.filter((item) => item.deviceInfoId !== props.device?.deviceInfoId)]
})

const channelOptions = computed(() => {
  if (channels.value.length) return channels.value
  const count = Math.max(props.device?.deviceInfoChannelCount || 1, 1)
  return Array.from({ length: count }, (_, index) => ({
    no: index + 1,
    name: `通道 ${index + 1}`
  }))
})

const timeline = computed<TimelineItem[]>(() => {
  const device = props.device
  if (!device) return []
  const items: TimelineItem[] = []
  if (device.deviceInfoCreatedAt) {
    items.push({ id: 'created', time: formatDateTime(device.deviceInfoCreatedAt), type: 'primary', content: '设备录入' })
  }
  if (device.deviceInfoLastOnlineAt) {
    items.push({ id: 'online', time: formatDateTime(device.deviceInfoLastOnlineAt), type: 'success', content: '设备上线' })
  }
  if (device.deviceInfoLastOfflineAt) {
    items.push({ id: 'offline', time: formatDateTime(device.deviceInfoLastOfflineAt), type: 'warning', content: '设备离线' })
  }
  return items
})

function vendorName(vendor?: string): string {
  return props.vendors.find((item) => item.vendor === vendor)?.name || vendor || '无'
}

function editDevice() {
  if (props.device) emit('edit', props.device)
}

async function copy(text?: string) {
  const ok = await copyText(text)
  ok ? message.success('已复制') : message.warning('复制失败，请手动选择')
}

function openMap() {
  if (!props.device) return
  const link = mapLinks(props.device)[0]
  if (link) window.open(link.url, '_blank', 'noopener,noreferrer')
}

function onMapSelect(device: DeviceInfo) {
  if (device.deviceInfoId !== props.device?.deviceInfoId) {
    emit('edit', device)
  }
}

async function loadChannels() {
  if (!props.device) return
  try {
    const res = (await deviceApi.listChannels(props.device.deviceInfoId)) as any[]
    channels.value = (res || []).map((item) => ({
      no: item.deviceChannelNo,
      name: item.deviceChannelName || `通道 ${item.deviceChannelNo}`
    }))
  } catch {
    channels.value = []
  }
  currentChannel.value = channels.value[0]?.no || 1
}

async function reloadStream() {
  if (!props.device) return
  try {
    const res = await deviceApi.getVideoStream(
      props.device.deviceInfoId,
      currentChannel.value,
      videoProtocol.value,
      streamType.value
    )
    videoUrl.value = String(res || '')
    if (!videoUrl.value) message.warning('后端未返回播放地址，请检查平台账号配置')
  } catch (err: unknown) {
    videoUrl.value = ''
    message.error('获取视频流失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误'))
  }
}

function onVideoError(err: unknown) {
  message.error('视频播放失败: ' + ((err as Error)?.message || '未知错误'))
}

async function reconnect() {
  if (!props.device) return
  try {
    await deviceApi.reconnect(props.device.deviceInfoId)
    message.success('设备重连成功')
    emit('refreshed')
    if (activeTab.value === 'video') reloadStream()
  } catch (err: unknown) {
    message.error('设备重连失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误'))
  }
}

async function refreshStatus() {
  if (!props.device) return
  try {
    await deviceApi.refreshStatus(props.device.deviceInfoId)
    message.success('状态已刷新')
    emit('refreshed')
  } catch (err: unknown) {
    message.error('刷新状态失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误'))
  }
}

async function openMultiView() {
  if (!props.device) return
  const n = multiLayout.value
  const list = channelOptions.value
  multiChannels.value = Array.from({ length: n }, (_, index) => list[index % list.length]?.no || 1)
  const urls = await Promise.all(
    multiChannels.value.map((channel) =>
      deviceApi
        .getVideoStream(props.device!.deviceInfoId, channel, videoProtocol.value, streamType.value)
        .then((res) => String(res || ''))
        .catch(() => '')
    )
  )
  multiUrls.value = urls
  multiViewVisible.value = true
}

/**
 * 从外部直接打开视频页签并加载指定码流（主/子），标签复用。
 *
 * @param device      设备
 * @param type        码流类型
 */
async function openVideo(device: DeviceInfo, type: 'main' | 'sub') {
  if (!device) return
  activeTab.value = 'video'
  streamType.value = type
  await nextTick()
  await reloadStream()
}

defineExpose({ openVideo })

async function onMultiChannelChange(payload: { index: number; value: number }) {
  if (!props.device) return
  try {
    const res = await deviceApi.getVideoStream(
      props.device.deviceInfoId,
      payload.value,
      videoProtocol.value,
      streamType.value
    )
    multiUrls.value[payload.index] = String(res || '')
  } catch {
    multiUrls.value[payload.index] = ''
  }
}

async function ptzControl(cmd: string) {
  if (!props.device) return
  try {
    await deviceApi.ptzControl(props.device.deviceInfoId, cmd)
    message.success(`云台 ${cmd}`)
  } catch (err: unknown) {
    message.error('云台控制失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误'))
  }
}

async function addPreset() {
  if (!props.device) return
  const name = prompt('请输入预置位名称')
  if (!name) return
  try {
    const presetId = Date.now()
    await deviceApi.setPreset(props.device.deviceInfoId, presetId, name)
    presets.value.push({ devicePresetNo: presetId, devicePresetName: name })
    message.success('添加预置位成功')
  } catch (err: unknown) {
    message.error('添加预置位失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误'))
  }
}

async function callPreset(id: number) {
  if (!props.device) return
  try {
    await deviceApi.callPreset(props.device.deviceInfoId, id)
    message.success(`调用预置位 ${id}`)
  } catch (err: unknown) {
    message.error('调用预置位失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误'))
  }
}

async function deletePreset(id: number) {
  if (!props.device) return
  try {
    await deviceApi.deletePreset(props.device.deviceInfoId, id)
    presets.value = presets.value.filter((preset) => preset.devicePresetNo !== id)
    message.success('删除预置位成功')
  } catch (err: unknown) {
    message.error('删除预置位失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误'))
  }
}

async function remoteUnlock(doorId: number) {
  if (!props.device) return
  try {
    await deviceApi.unlock(props.device.deviceInfoId, doorId)
    message.success(`门 ${doorId} 已开`)
  } catch (err: unknown) {
    message.error('远程开门失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误'))
  }
}

async function loadPresets() {
  if (!props.device) return
  try {
    presets.value = ((await deviceApi.listPresets(props.device.deviceInfoId)) as Preset[]) || []
  } catch {
    presets.value = []
  }
}

async function fetchAccessEvents() {
  if (!props.device) return
  const now = new Date()
  const start = new Date(now.getTime() - 24 * 3600 * 1000)
  const fmt = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ')
  try {
    const res = (await deviceApi.queryAccessRecords(props.device.deviceInfoId, fmt(start), fmt(now))) as any[]
    accessEvents.value = (res || []).map((item) => ({
      time: item.time || '',
      doorName: item.doorId || '',
      eventType: item.eventType || '',
      cardNo: item.cardNo || '',
      userName: item.userName || ''
    }))
  } catch {
    accessEvents.value = []
  }
}

async function fetchEvents() {
  if (!props.device) return
  try {
    const res = await deviceApi.queryEvents({ deviceId: props.device.deviceInfoId, type: eventFilter.value.type })
    events.value = (res as DeviceEvent[]) || []
  } catch {
    events.value = []
  }
}

async function init() {
  activeTab.value = 'overview'
  videoUrl.value = ''
  multiViewVisible.value = false
  await loadChannels()
  loadPresets()
  fetchAccessEvents()
  fetchEvents()
}

onMounted(() => {
  if (props.device) init()
})

watch(
  () => props.device?.deviceInfoId,
  () => {
    if (props.device) init()
  }
)
watch(activeTab, (tab) => {
  if (tab === 'video' && !videoUrl.value) reloadStream()
})
</script>

<style scoped>
.ddp {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.ddp__head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 4px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.ddp__ident {
  min-width: 0;
}

.ddp__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ddp__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ddp__sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ddp__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
}

.ddp__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-top: 8px;
}
</style>
