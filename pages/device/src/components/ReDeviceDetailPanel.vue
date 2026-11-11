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

        <el-tab-pane v-if="tabKeys.includes('metrics')" label="指标" name="metrics">
          <ReDeviceMetricPanel :device-id="device.deviceInfoId" />
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
                <el-button type="primary" plain :disabled="!playable" @click="reloadStream">
                  <el-icon class="mr-1"><Refresh /></el-icon>刷新
                </el-button>
                <el-button type="primary" plain :disabled="!playable" @click="openMultiView">
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

        <el-tab-pane label="车闸" name="barrier">
          <div class="ddp-barrier-head">
            <span class="ddp-barrier-title">车闸点位</span>
            <div class="ddp-barrier-actions">
              <el-button size="small" @click="loadBarriers">刷新</el-button>
              <el-button size="small" type="primary" @click="openGateDialog()">新增车闸</el-button>
            </div>
          </div>
          <el-table v-loading="barrierLoading" :data="barriers" size="small" border>
            <el-table-column prop="deviceBarrierGateName" label="车闸名称" min-width="140" />
            <el-table-column label="方向" width="90">
              <template #default="{ row }">{{ barrierDirectionText(row.deviceBarrierGateDirection) }}</template>
            </el-table-column>
            <el-table-column prop="deviceBarrierGateChannelNo" label="通道号" width="80" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">{{ gateStatusText(row.deviceBarrierGateStatus) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openGateDialog(row)">编辑</el-button>
                <el-button link type="danger" @click="removeGate(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="!barrierLoading && !barriers.length" class="ddp-barrier-empty">该设备暂无车闸点位</div>
          <el-divider content-position="left">该设备过车记录</el-divider>
          <el-table v-loading="barrierLoading" :data="barrierPasses" size="small" border>
            <el-table-column prop="deviceVehiclePassPlateNo" label="车牌号" min-width="120" />
            <el-table-column label="方向" width="80">
              <template #default="{ row }">{{ passDirectionText(row.deviceVehiclePassDirection) }}</template>
            </el-table-column>
            <el-table-column prop="deviceVehiclePassTime" label="过车时间" min-width="170" />
          </el-table>
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

    <el-dialog
      v-model="gateDialogVisible"
      :title="gateForm.id ? '编辑车闸' : '新增车闸'"
      width="460px"
      append-to-body
    >
      <el-form label-width="80px">
        <el-form-item label="车闸名称" required>
          <el-input v-model="gateForm.name" maxlength="64" placeholder="如：东门入口道闸" />
        </el-form-item>
        <el-form-item label="方向">
          <el-select v-model="gateForm.direction" style="width: 100%">
            <el-option label="入口" value="in" />
            <el-option label="出口" value="out" />
            <el-option label="双向" value="both" />
          </el-select>
        </el-form-item>
        <el-form-item label="通道号">
          <el-input-number
            v-model="gateForm.channelNo"
            :min="1"
            :max="999"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="gateForm.status" style="width: 100%">
            <el-option label="开启" value="open" />
            <el-option label="关闭" value="closed" />
            <el-option label="离线" value="offline" />
            <el-option label="未知" value="unknown" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="gateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="gateSaving" @click="saveGate">保存</el-button>
      </template>
    </el-dialog>

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
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { message } from '@repo/core'
import { ElMessageBox } from 'element-plus'
import { Grid, Refresh } from '@element-plus/icons-vue'
import ReVideo from '../components/ReVideo.vue'
import ReMultiVideo from '../components/ReMultiVideo.vue'
import RePtzControl from '../components/RePtzControl.vue'
import ReAccessPanel from '../components/ReAccessPanel.vue'
import ReEventPanel from '../components/ReEventPanel.vue'
import ReTimeline from '../components/ReTimeline.vue'
import ReMap from '../components/ReMap.vue'
import ReChannelManager from '../components/ReChannelManager.vue'
import ReDeviceMetricPanel from '../components/ReDeviceMetricPanel.vue'
import DeviceStatusPulse from '../components/DeviceStatusPulse.vue'
import { RTSP_GATEWAY } from '../utils/streamConfig'
import { deviceApi } from '../api/deviceApi'
import { detailTabKeys, isPlayable } from '../utils/deviceCapability'
import { getCategoryLabel } from '../utils/deviceCategory'
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
} from '../utils/deviceFormat'
import type {
  AccessEvent,
  DeviceEvent,
  DeviceInfo,
  DeviceVendorDescriptor,
  Preset,
  TimelineItem
} from '../types/device'

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

/** 车闸点位 */
const barriers = ref<Record<string, any>[]>([])
/** 当前设备的过车记录 */
const barrierPasses = ref<Record<string, any>[]>([])
/** 车闸加载中 */
const barrierLoading = ref(false)
/** 车闸编辑弹窗是否可见 */
const gateDialogVisible = ref(false)
/** 车闸保存中 */
const gateSaving = ref(false)
/** 车闸编辑表单 */
const gateForm = reactive({
  id: '',
  name: '',
  direction: 'in',
  channelNo: 1,
  status: 'closed'
})

/** 车闸方向文案 */
function barrierDirectionText(value?: string): string {
  if (value === 'in') return '入口'
  if (value === 'out') return '出口'
  if (value === 'both') return '双向'
  return '—'
}

/** 车闸状态文案 */
function gateStatusText(value?: string): string {
  if (value === 'open') return '开启'
  if (value === 'closed') return '关闭'
  if (value === 'offline') return '离线'
  return '未知'
}

/**
 * 这台设备该显示哪些页签。
 *
 * <p>按厂商能力位 + 设备大类收敛：门禁不会出现云台，报警主机不会出现视频，
 * 摄像头才有视频 / 云台。设备切换时若当前页签不再可用，回到概览，
 * 避免 el-tabs 停在一个不存在的 pane 上显示空白。</p>
 */
const tabKeys = computed(() => detailTabKeys(props.device, props.vendors))

/** 能不能出画面（决定「多路 / 播放」这类入口是否可点） */
const playable = computed(() => isPlayable(props.device, props.vendors))

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

/** 过车方向文案 */
function passDirectionText(value?: string): string {
  if (value === 'in') return '入场'
  if (value === 'out') return '出场'
  return '—'
}

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
  barriers.value = []
  barrierPasses.value = []
  // 页签按能力位裁剪后，只有能出画面的设备才值得去拉通道 / 预置位 / 事件
  const keys = tabKeys.value
  if (keys.includes('video') || keys.includes('channel')) await loadChannels()
  if (keys.includes('ptz')) loadPresets()
  if (keys.includes('access')) fetchAccessEvents()
  if (keys.includes('events')) fetchEvents()
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

/** 页签集合变化（换设备换了类别）：当前页签不在集合里就回概览 */
watch(tabKeys, (keys) => {
  if (!keys.includes(activeTab.value as never)) activeTab.value = 'overview'
})

watch(activeTab, (tab) => {
  if (tab === 'video' && !videoUrl.value) reloadStream()
  if (tab === 'barrier' && !barriers.value.length) void loadBarriers()
})

/**
 * 打开车闸新增 / 编辑弹窗。
 *
 * @param row 为空表示新增，否则回填该车闸
 */
function openGateDialog(row?: Record<string, any>) {
  gateForm.id = row?.deviceBarrierGateId || ''
  gateForm.name = row?.deviceBarrierGateName || ''
  gateForm.direction = row?.deviceBarrierGateDirection || 'in'
  gateForm.channelNo = Number(row?.deviceBarrierGateChannelNo) || 1
  gateForm.status = row?.deviceBarrierGateStatus || 'closed'
  gateDialogVisible.value = true
}

/**
 * 保存车闸：有主键走更新，否则新增并绑定当前设备。
 */
async function saveGate() {
  const device = props.device
  const name = gateForm.name.trim()
  if (!device) return
  if (!name) {
    message.warning('请填写车闸名称')
    return
  }
  gateSaving.value = true
  try {
    const payload = {
      deviceBarrierGateDeviceId: device.deviceInfoId,
      deviceBarrierGateVendor: device.deviceInfoVendor,
      deviceBarrierGateName: name,
      deviceBarrierGateDirection: gateForm.direction,
      deviceBarrierGateChannelNo: gateForm.channelNo,
      deviceBarrierGateStatus: gateForm.status
    }
    if (gateForm.id) {
      await deviceApi.updateBarrier(gateForm.id, payload)
    } else {
      await deviceApi.addBarrier(payload)
    }
    message.success(gateForm.id ? '车闸已更新' : '车闸已新增')
    gateDialogVisible.value = false
    await loadBarriers()
  } catch (e: any) {
    message.error(e?.message ?? '保存车闸失败')
  } finally {
    gateSaving.value = false
  }
}

/**
 * 删除车闸点位。
 *
 * @param row 车闸行
 */
async function removeGate(row: Record<string, any>) {
  try {
    await ElMessageBox.confirm(`删除车闸「${row.deviceBarrierGateName}」？`, '确认', { type: 'warning' })
    await deviceApi.deleteBarrier(row.deviceBarrierGateId)
    message.success('车闸已删除')
    await loadBarriers()
  } catch (e: any) {
    if (e !== 'cancel' && e !== 'close') message.error(e?.message ?? '删除车闸失败')
  }
}

/**
 * 加载当前设备的车闸点位。
 */
async function loadBarriers() {
  const deviceId = props.device?.deviceInfoId
  if (!deviceId) return
  barrierLoading.value = true
  try {
    const list = (await deviceApi.listBarriers({ deviceId })) as Record<string, any>[]
    barriers.value = Array.isArray(list) ? list : []
    const page = (await deviceApi.pageVehiclePasses({ page: 1, size: 50, deviceId })) as Record<string, any>
    barrierPasses.value = page?.records ?? page?.data ?? []
  } catch {
    barriers.value = []
    barrierPasses.value = []
  } finally {
    barrierLoading.value = false
  }
}
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

.ddp-barrier-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.ddp-barrier-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ddp-barrier-actions {
  display: flex;
  gap: 6px;
}

.ddp__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-top: 8px;
}
</style>
