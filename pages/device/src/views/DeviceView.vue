<template>
  <div class="dv">
    <!-- 概览指标 -->
    <section class="dv-kpis">
      <ReStatCard
        v-for="k in kpis"
        :key="k.key"
        size="compact"
        :title="k.title"
        :value="k.value"
        :desc="k.desc"
        :icon="k.icon"
        :icon-color="k.iconColor"
      />
    </section>

    <div class="dv-body">
      <!-- 左侧：组织树 + 设备清单 -->
      <aside class="dv-side">
        <ReDeviceTree
          :org-tree="orgTree"
          :devices="devices"
          :selected-id="selectedDevice?.deviceInfoId"
          @select="selectDevice"
          @org-select="onOrgSelect"
          @sync-org="syncOrg"
          @add="showAddDialog"
        />
      </aside>

      <!-- 右侧：主机卡牌 + 详情 / 设备总览 -->
      <main class="dv-main">
        <template v-if="selectedDevice">
          <!-- 主机卡牌：一屏看清这台主机的全部关键信息 -->
          <section class="dv-hero">
            <span class="dv-hero__icon" :class="{ 'is-off': !selectedDevice.deviceInfoOnline }">
              <el-icon :size="24"><component :is="categoryIcon(selectedDevice.deviceInfoCategory)" /></el-icon>
            </span>

            <div class="dv-hero__main">
              <div class="dv-hero__title">
                <span class="dv-hero__name">{{ selectedDevice.deviceInfoName }}</span>
                <ReTag :type="selectedDevice.deviceInfoOnline ? 'success' : 'info'" size="small" dot>
                  {{ selectedDevice.deviceInfoOnline ? '在线' : '离线' }}
                </ReTag>
                <ReTag size="small" effect="plain">
                  {{ getCategoryLabel(selectedDevice.deviceInfoCategory) }} · {{ selectedDevice.deviceInfoSubCategory || '—' }}
                </ReTag>
              </div>

              <div class="dv-hero__chips">
                <span class="dv-chip">
                  <em>IP</em>{{ selectedDevice.deviceInfoIp || '未配置' }}:{{ selectedDevice.deviceInfoPort || '—' }}
                </span>
                <span class="dv-chip">
                  <em>厂商</em>{{ selectedDevice.deviceInfoVendor || '—' }}
                </span>
                <span class="dv-chip">
                  <em>型号</em>{{ selectedDevice.deviceInfoModel || '—' }}
                </span>
                <span class="dv-chip">
                  <em>通道</em>{{ selectedDevice.deviceInfoChannelCount ?? 0 }}
                </span>
                <span class="dv-chip">
                  <em>序列号</em>{{ selectedDevice.deviceInfoSerial || '—' }}
                </span>
                <span class="dv-chip">
                  <em>位置</em>{{ selectedDevice.deviceInfoAddress || '未配置' }}
                </span>
                <span class="dv-chip">
                  <em>离线阈值</em>{{ selectedDevice.deviceInfoOfflineThreshold ?? '厂商默认' }}
                  <template v-if="selectedDevice.deviceInfoOfflineThreshold"> 秒</template>
                </span>
              </div>

              <!--
                预留扩展信息位：后续新增的设备字段（如 责任人 / 所属项目 / 标签 / 自定义属性）
                直接补进 heroExtra，卡牌布局与行高都不用动。
              -->
              <div v-if="heroExtra.length" class="dv-hero__extra">
                <span v-for="item in heroExtra" :key="item.label" class="dv-chip dv-chip--soft">
                  <em>{{ item.label }}</em>{{ item.value }}
                </span>
              </div>
            </div>

            <div class="dv-hero__ops">
              <ReButton icon="Refresh" layout="square" tip="刷新设备状态" @click="refreshDeviceStatus" />
              <ReButton icon="Connection" layout="square" tip="重连设备" @click="reconnectDevice" />
              <ReButton icon="Timer" :show-text="true" @click="showThresholdDialog">离线检测</ReButton>
            </div>
          </section>

          <!-- 详情页签 -->
          <section class="dv-tabpanel">
            <ReTab v-model="activeTab" :tabs="DEVICE_TABS">
              <template #overview>
                <div class="dv-overview">
                  <div class="dv-info-grid">
                    <div v-for="item in detailFields" :key="item.label" class="dv-info">
                      <span class="dv-info__label">{{ item.label }}</span>
                      <span class="dv-info__value">{{ item.value }}</span>
                    </div>
                  </div>
                  <ReTimeline title="操作时间轴" :items="timeline" @refresh="fetchTimeline" />
                </div>
              </template>

              <template #map>
                <ReMap :devices="devices" @select="selectDevice" />
              </template>

              <template #channel>
                <ReChannelManager :device-id="selectedDevice.deviceInfoId" />
              </template>

              <template #video>
                <div class="dv-video">
                  <ReVideo
                    :url="videoUrl"
                    :protocol="videoProtocol"
                    :channel="currentChannel"
                    class="dv-video__player"
                    @error="onVideoError"
                  />
                  <div class="dv-video__bar">
                    <span class="dv-video__label">通道</span>
                    <ReSelect
                      v-model="currentChannel"
                      :options="channelOptions"
                      placeholder="选择通道"
                      class="dv-video__select"
                    />
                    <span class="dv-video__label">协议</span>
                    <ReSelect v-model="videoProtocol" :options="PROTOCOL_OPTIONS" class="dv-video__select dv-video__select--sm" />
                    <div class="dv-video__ops">
                      <ReButton icon="Refresh" :show-text="true" type="primary" @click="reloadStream">刷新拉流</ReButton>
                      <ReButton icon="Connection" :show-text="true" @click="reconnectDevice">重连</ReButton>
                      <ReButton icon="Grid" :show-text="true" @click="openMultiView">多路播放</ReButton>
                    </div>
                  </div>
                </div>
              </template>

              <template #ptz>
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
              </template>

              <template #access>
                <ReAccessPanel
                  :doors="selectedDevice.doors || []"
                  :events="accessEvents"
                  @unlock="remoteUnlock"
                  @refresh="fetchAccessEvents"
                />
              </template>

              <template #events>
                <ReEventPanel
                  :events="events"
                  :filter="eventFilter"
                  :realtime="eventRealtime"
                  @query="fetchEvents"
                  @update:filter="onEventFilterChange"
                  @update:realtime="onEventRealtimeChange"
                />
              </template>
            </ReTab>
          </section>
        </template>

        <!-- 未选设备：主机卡牌总览 -->
        <template v-else>
          <section class="dv-filter">
            <div class="dv-field dv-field--search">
              <ReInput v-model="deviceKeyword" placeholder="搜索设备名称 / IP" clearable prefix-icon="Search" />
            </div>
            <div class="dv-field">
              <ReSelect v-model="statusFilter" placeholder="全部状态" clearable :options="STATUS_OPTIONS" />
            </div>
            <div class="dv-field">
              <ReSelect v-model="categoryFilter" placeholder="全部大类" clearable :options="CATEGORY_OPTIONS" />
            </div>
            <span class="dv-filter__meta">{{ filteredDevices.length }} / {{ devices.length }} 台</span>
            <ReButton icon="Search" :show-text="true" type="primary" :loading="devicesLoading" @click="fetchDevices">
              查询
            </ReButton>
            <div class="dv-toolbar-ops">
              <ReButton icon="Plus" layout="square" type="primary" tip="添加设备" @click="showAddDialog" />
              <ReButton icon="Download" layout="square" tip="导出 Excel" @click="exportDevices" />
              <ReButton icon="Share" layout="square" tip="同步厂商组织" @click="syncOrg" />
              <ReButton icon="RefreshRight" layout="square" tip="刷新设备列表" :loading="devicesLoading" @click="fetchDevices" />
            </div>
          </section>

          <div class="dv-grid" :class="{ 'is-empty': !filteredDevices.length }">
            <article
              v-for="dev in filteredDevices"
              :key="dev.deviceInfoId"
              class="dcard"
              :class="{ 'is-off': !dev.deviceInfoOnline }"
              @click="selectDevice(dev)"
            >
              <header class="dcard__head">
                <span class="dcard__icon">
                  <el-icon :size="20"><component :is="categoryIcon(dev.deviceInfoCategory)" /></el-icon>
                </span>
                <div class="dcard__title">
                  <span class="dcard__name">{{ dev.deviceInfoName }}</span>
                  <span class="dcard__sub">{{ dev.deviceInfoVendor || '未知厂商' }} · {{ dev.deviceInfoModel || '未知型号' }}</span>
                </div>
                <ReStatusIndicator :type="dev.deviceInfoOnline ? 'success' : 'info'" :pulse="dev.deviceInfoOnline" />
              </header>

              <div class="dcard__chips">
                <span class="dv-chip dv-chip--soft">
                  <em>IP</em>{{ dev.deviceInfoIp || '未配置' }}
                </span>
                <span class="dv-chip dv-chip--soft">
                  <em>大类</em>{{ getCategoryLabel(dev.deviceInfoCategory) }}
                </span>
                <span class="dv-chip dv-chip--soft">
                  <em>通道</em>{{ dev.deviceInfoChannelCount ?? 0 }}
                </span>
              </div>

              <footer class="dcard__foot">
                <span class="dcard__addr">{{ dev.deviceInfoAddress || '未配置位置' }}</span>
                <span class="dcard__link">
                  进入设备
                  <el-icon><ArrowRight /></el-icon>
                </span>
              </footer>
            </article>

            <ReEmpty
              v-if="!filteredDevices.length"
              description="暂无设备，点击右上角「添加设备」接入厂商平台或 SDK 直连"
              :image-size="90"
            />
          </div>
        </template>
      </main>
    </div>

    <ReMultiVideo
      v-model="multiViewVisible"
      :layout="multiLayout"
      :urls="multiUrls"
      :channels="multiChannels"
      :channel-list="selectedDevice?.channels || []"
      @update:layout="(v: number) => (multiLayout = v)"
      @channel-change="onMultiChannelChange"
    />

    <!-- 添加设备 -->
    <ReDialog v-model="addDialogVisible" title="添加设备" width="580px" append-to-body :close-on-click-modal="false">
      <el-form label-position="top" class="dv-form">
        <ReFormItem label="设备名称" required>
          <ReInput v-model="addForm.deviceInfoName" placeholder="例如 大厅球机" />
        </ReFormItem>
        <ReFormItem label="接入方式" required>
          <el-radio-group v-model="addForm.authType">
            <el-radio-button value="PLATFORM">平台接入</el-radio-button>
            <el-radio-button value="SDK">SDK 直连</el-radio-button>
          </el-radio-group>
        </ReFormItem>
        <ReFormItem label="厂商" required>
          <ReSelect v-model="addForm.vendor" :options="VENDOR_OPTIONS" style="width: 100%" />
        </ReFormItem>

        <template v-if="addForm.authType === 'PLATFORM'">
          <ReFormItem label="平台类型" required>
            <el-select v-model="addForm.platformType" style="width: 100%">
              <el-option-group label="海康">
                <el-option label="海康云耀" value="cloud-yao" />
                <el-option label="海康云眸" value="cloud-eye" />
                <el-option label="海康安防平台" value="secure-platform" />
              </el-option-group>
              <el-option-group label="大华">
                <el-option label="大华云睿" value="dahua-cloud" />
                <el-option label="大华乐橙" value="lechange" />
              </el-option-group>
            </el-select>
          </ReFormItem>
          <ReFormItem label="AppKey">
            <ReInput v-model="addForm.appKey" placeholder="厂商开放平台分配的 AppKey" />
          </ReFormItem>
          <ReFormItem label="AppSecret">
            <ReInput v-model="addForm.appSecret" type="password" show-password placeholder="厂商开放平台分配的 AppSecret" />
          </ReFormItem>
          <ReFormItem label="设备序列号">
            <ReInput v-model="addForm.deviceSerial" placeholder="平台侧的设备序列号" />
          </ReFormItem>
        </template>

        <template v-else>
          <ReFormItem label="大类" required>
            <ReSelect v-model="addForm.deviceInfoCategory" :options="CATEGORY_OPTIONS" style="width: 100%" />
          </ReFormItem>
          <ReFormItem label="小类" required>
            <ReSelect
              v-model="addForm.deviceInfoSubCategory"
              :options="getSubCategoryOptions(addForm.deviceInfoCategory)"
              style="width: 100%"
            />
          </ReFormItem>
          <ReFormItem label="IP 地址" required>
            <ReInput v-model="addForm.deviceInfoIp" placeholder="例如 192.168.1.64" />
          </ReFormItem>
          <ReFormItem label="端口">
            <ReInputNumber v-model="addForm.deviceInfoPort" :min="1" :max="65535" style="width: 100%" />
          </ReFormItem>
          <ReFormItem label="用户名">
            <ReInput v-model="addForm.deviceInfoUsername" />
          </ReFormItem>
          <ReFormItem label="密码">
            <ReInput v-model="addForm.deviceInfoPassword" type="password" show-password />
          </ReFormItem>
        </template>
      </el-form>
      <template #footer>
        <ReButton @click="addDialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="addSaving" @click="submitAdd">确定</ReButton>
      </template>
    </ReDialog>

    <!-- 离线检测（单台设备阈值；厂商级阈值与自动同步已收进「提供商配置 → 凭据卡右键 → 高级设置」） -->
    <ReDialog v-model="thresholdDialogVisible" title="离线检测设置" width="460px" :close-on-click-modal="false">
      <el-form label-position="top" class="dv-form">
        <ReFormItem label="设备离线阈值" required>
          <ReInputNumber v-model="deviceThreshold" :min="5" :max="86400" :step="5" style="width: 100%" />
          <span class="dv-hint">超过该秒数未收到心跳即判定离线；留空表示沿用厂商默认值</span>
        </ReFormItem>

        <div class="dv-provider">
          <div class="dv-provider__head">
            <span class="dv-panel__bar" />
            <span>厂商默认阈值</span>
          </div>
          <div class="dv-provider__hint">
            按厂商统一生效的阈值已移到「提供商配置 → 凭据卡右键 → 高级设置」，避免两处各存一份。
          </div>
        </div>
      </el-form>
      <template #footer>
        <ReButton @click="thresholdDialogVisible = false">取消</ReButton>
        <ReButton type="primary" @click="saveDeviceThreshold">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { message } from '@repo/core'
import { computed, markRaw, onMounted, onUnmounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'

import {
  ArrowRight,
  Bell,
  ChatDotRound,
  CircleCheck,
  CircleClose,
  Connection,
  Download,
  Grid,
  Lock,
  Monitor,
  Plus,
  Refresh,
  RefreshRight,
  Share,
  Tickets,
  Timer,
  VideoCamera,
} from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReEmpty from '@repo/ui/re-empty'
import ReInput from '@repo/ui/re-input'
import ReInputNumber from '@repo/ui/re-input-number'
import { ReFormItem } from '@repo/ui/re-kit'
import ReSelect from '@repo/ui/re-select'
import ReStatCard from '@repo/ui/re-stat-card'
import ReStatusIndicator from '@repo/ui/re-status-indicator'
import ReTab from '@repo/ui/re-tab'
import type { ReTabItem } from '@repo/ui/re-tab'
import ReTag from '@repo/ui/re-tag'

import ReVideo from '@/components/ReVideo.vue'
import ReDeviceTree from '@/components/ReDeviceTree.vue'
import ReTimeline from '@/components/ReTimeline.vue'
import RePtzControl from '@/components/RePtzControl.vue'
import ReMultiVideo from '@/components/ReMultiVideo.vue'
import ReAccessPanel from '@/components/ReAccessPanel.vue'
import ReEventPanel from '@/components/ReEventPanel.vue'
import ReMap from '@/components/ReMap.vue'
import ReChannelManager from '@/components/ReChannelManager.vue'

import { deviceApi } from '@/api/deviceApi'
import { getCategoryLabel, getSubCategoryOptions } from '@/utils/deviceCategory'
import { rawDirection } from '@/utils/accessDirection'
import type { AccessEvent, DeviceEvent, DeviceInfo, OrgNode, Preset, TimelineItem } from '@/types/device'

/** 详情页签（图标用 Element Plus 图标名，由 ReTab → ReIcon 解析） */
const DEVICE_TABS: ReTabItem[] = [
  { name: 'overview', label: '概览', icon: 'DataBoard' },
  { name: 'map', label: '地图', icon: 'Location' },
  { name: 'channel', label: '通道', icon: 'Grid' },
  { name: 'video', label: '视频', icon: 'VideoCamera' },
  { name: 'ptz', label: '云台', icon: 'Aim' },
  { name: 'access', label: '门禁', icon: 'Lock' },
  { name: 'events', label: '事件', icon: 'Bell' },
]

const CATEGORY_OPTIONS = [
  { label: '摄像头', value: 'camera' },
  { label: '门禁', value: 'accessControl' },
  { label: '报警', value: 'alarm' },
  { label: '对讲', value: 'intercom' },
]

const STATUS_OPTIONS = [
  { label: '在线', value: 'online' },
  { label: '离线', value: 'offline' },
]

const VENDOR_OPTIONS = [
  { label: '海康威视', value: 'hikvision' },
  { label: '大华', value: 'dahua' },
]

const PROTOCOL_OPTIONS = [
  { label: 'HLS', value: 'hls' },
  { label: 'FLV', value: 'flv' },
  { label: 'RTSP', value: 'rtsp' },
]

/** 大类 → 图标（markRaw 避免被响应式代理） */
const CATEGORY_ICONS: Record<string, unknown> = {
  camera: markRaw(VideoCamera),
  accessControl: markRaw(Lock),
  alarm: markRaw(Bell),
  intercom: markRaw(ChatDotRound),
}

function categoryIcon(category?: string): unknown {
  return (category && CATEGORY_ICONS[category]) || markRaw(Monitor)
}

const orgTree = ref<OrgNode[]>([])
const devices = ref<DeviceInfo[]>([])
const devicesLoading = ref(false)
const selectedDevice = ref<DeviceInfo | null>(null)
const activeTab = ref('overview')
const timeline = ref<TimelineItem[]>([])
const currentChannel = ref(1)
const videoUrl = ref('')
const videoProtocol = ref('hls')
const multiViewVisible = ref(false)
const multiLayout = ref(4)
const multiChannels = ref<number[]>([])
const multiUrls = ref<string[]>([])
const zoom = ref(50)
const focus = ref(50)
const presets = ref<Preset[]>([])
const accessEvents = ref<AccessEvent[]>([])
const events = ref<DeviceEvent[]>([])
const eventFilter = ref({ type: '', dateRange: null as any })
const eventRealtime = ref(true)
const addDialogVisible = ref(false)
const addSaving = ref(false)
const thresholdDialogVisible = ref(false)
const deviceThreshold = ref<number>()

/** 总览筛选 */
const deviceKeyword = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')

const addForm = ref({
  deviceInfoName: '',
  vendor: 'hikvision',
  authType: 'PLATFORM',
  platformType: 'cloud-eye',
  appKey: '',
  appSecret: '',
  deviceSerial: '',
  deviceInfoCategory: 'camera',
  deviceInfoSubCategory: 'bullet',
  deviceInfoIp: '',
  deviceInfoPort: 8000,
  deviceInfoUsername: 'admin',
  deviceInfoPassword: '',
})

let pollTimer: ReturnType<typeof setInterval> | null = null

/* ==================== 派生数据 ==================== */

const onlineCount = computed(() => devices.value.filter((d) => d.deviceInfoOnline).length)

const kpis = computed(() => [
  {
    key: 'total',
    title: '设备总数',
    value: devices.value.length,
    desc: `组织 ${orgTree.value.length} 个节点`,
    icon: VideoCamera,
    iconColor: 'var(--el-color-primary)',
  },
  {
    key: 'online',
    title: '在线设备',
    value: onlineCount.value,
    desc: devices.value.length ? `在线率 ${Math.round((onlineCount.value / devices.value.length) * 100)}%` : '暂无设备',
    icon: CircleCheck,
    iconColor: 'var(--el-color-success)',
  },
  {
    key: 'offline',
    title: '离线设备',
    value: devices.value.length - onlineCount.value,
    desc: '超过离线阈值未心跳即判定',
    icon: CircleClose,
    iconColor: 'var(--el-color-danger)',
  },
  {
    key: 'channels',
    title: '通道总数',
    value: devices.value.reduce((sum, d) => sum + (d.deviceInfoChannelCount ?? 0), 0),
    desc: '按设备登记的通道数汇总',
    icon: Tickets,
    iconColor: 'var(--el-color-warning)',
  },
])

const filteredDevices = computed(() => {
  const kw = deviceKeyword.value.trim().toLowerCase()
  return devices.value.filter((d) => {
    if (statusFilter.value === 'online' && !d.deviceInfoOnline) return false
    if (statusFilter.value === 'offline' && d.deviceInfoOnline) return false
    if (categoryFilter.value && d.deviceInfoCategory !== categoryFilter.value) return false
    if (!kw) return true
    return (d.deviceInfoName || '').toLowerCase().includes(kw) || (d.deviceInfoIp || '').toLowerCase().includes(kw)
  })
})

/** 卡牌上的「预留扩展信息位」内容：后续新字段往这里补即可 */
const heroExtra = computed(() => {
  const d = selectedDevice.value
  if (!d) return [] as { label: string; value: string }[]
  const list: { label: string; value: string }[] = []
  if (d.deviceInfoFirmware) list.push({ label: '固件', value: d.deviceInfoFirmware })
  if (d.deviceInfoCreatedAt) list.push({ label: '接入时间', value: d.deviceInfoCreatedAt })
  return list
})

/** 概览页签的详细字段 */
const detailFields = computed(() => {
  const d = selectedDevice.value
  if (!d) return [] as { label: string; value: string }[]
  return [
    { label: '设备名称', value: d.deviceInfoName || '—' },
    { label: '厂商 / 型号', value: `${d.deviceInfoVendor || '—'} / ${d.deviceInfoModel || '—'}` },
    { label: 'IP / 端口', value: `${d.deviceInfoIp || '—'}:${d.deviceInfoPort ?? '—'}` },
    { label: '大类 / 小类', value: `${getCategoryLabel(d.deviceInfoCategory)} / ${d.deviceInfoSubCategory || '—'}` },
    { label: '序列号 / 固件', value: `${d.deviceInfoSerial || '-'} / ${d.deviceInfoFirmware || '-'}` },
    { label: '通道数', value: String(d.deviceInfoChannelCount ?? 0) },
    { label: '安装位置', value: d.deviceInfoAddress || '未配置' },
    { label: '离线阈值', value: d.deviceInfoOfflineThreshold ? `${d.deviceInfoOfflineThreshold} 秒` : '厂商默认' },
  ]
})

const channelOptions = computed(() =>
  (selectedDevice.value?.channels || []).map((ch) => ({
    label: ch.deviceChannelName || `通道 ${ch.deviceChannelNo}`,
    value: ch.deviceChannelNo,
  })),
)

/* ==================== 设备交互 ==================== */

function selectDevice(dev: DeviceInfo) {
  selectedDevice.value = dev
  if (dev.channels && dev.channels.length) {
    currentChannel.value = dev.channels[0].deviceChannelNo
  }
  reloadStream()
  fetchTimeline()
  loadPresets(dev.deviceInfoId)
  fetchAccessEvents()
  fetchEvents()
}

function reloadStream() {
  if (!selectedDevice.value) return
  deviceApi
    .getVideoStream(selectedDevice.value.deviceInfoId, currentChannel.value, videoProtocol.value)
    .then((res: unknown) => {
      videoUrl.value = String(res || '')
      if (!videoUrl.value) {
        message.warning('后端未返回拉流地址，请检查平台账号配置')
      }
    })
    .catch((err: unknown) => {
      videoUrl.value = ''
      message.error('获取视频流失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误'))
    })
}

function refreshDeviceStatus() {
  if (!selectedDevice.value) return
  deviceApi
    .refreshStatus(selectedDevice.value.deviceInfoId)
    .then(() => {
      message.success('设备状态已刷新')
      fetchDevices()
    })
    .catch((err: unknown) =>
      message.error('刷新状态失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误')),
    )
}

function reconnectDevice() {
  if (!selectedDevice.value) return
  deviceApi
    .reconnect(selectedDevice.value.deviceInfoId)
    .then(() => {
      message.success('设备重连成功')
      reloadStream()
    })
    .catch((err: unknown) =>
      message.error('设备重连失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误')),
    )
}

function onVideoError(err: unknown) {
  message.error('视频加载失败: ' + ((err as Error)?.message || '未知错误'))
}

function openMultiView() {
  const n = multiLayout.value
  const chs = selectedDevice.value?.channels || []
  const deviceId = selectedDevice.value?.deviceInfoId
  multiChannels.value = Array.from({ length: n }, (_, i) => (chs.length ? chs[i % chs.length].deviceChannelNo : 1))
  Promise.all(
    multiChannels.value.map((ch) =>
      deviceApi
        .getVideoStream(deviceId || '', ch, videoProtocol.value)
        .then((res: unknown) => String(res || ''))
        .catch(() => ''),
    ),
  ).then((urls) => {
    multiUrls.value = urls
    multiViewVisible.value = true
  })
}

function onMultiChannelChange(payload: { index: number; value: number }) {
  const deviceId = selectedDevice.value?.deviceInfoId
  if (!deviceId) return
  deviceApi
    .getVideoStream(deviceId, payload.value, videoProtocol.value)
    .then((res: unknown) => {
      multiUrls.value[payload.index] = String(res || '')
    })
    .catch(() => {
      multiUrls.value[payload.index] = ''
    })
}

/* ==================== 云台 ==================== */

function ptzControl(cmd: string) {
  if (!selectedDevice.value) return
  deviceApi
    .ptzControl(selectedDevice.value.deviceInfoId, cmd)
    .then(() => {
      timeline.value.unshift({
        id: Date.now().toString(),
        time: new Date().toLocaleString(),
        type: 'primary',
        content: `云台 ${cmd}`,
      })
    })
    .catch((err: unknown) =>
      message.error('云台控制失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误')),
    )
}

async function addPreset() {
  if (!selectedDevice.value) return
  try {
    const { value } = await ElMessageBox.prompt('预置位名称', '添加预置位', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '例如 大门全景',
    })
    const name = (value || '').trim()
    if (!name) return
    deviceApi
      .setPreset(selectedDevice.value.deviceInfoId, Date.now(), name)
      .then(() => {
        presets.value.push({ devicePresetNo: Date.now(), devicePresetName: name })
        message.success('添加预置位成功')
      })
      .catch((err: unknown) =>
        message.error('添加预置位失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误')),
      )
  } catch {
    /* 用户取消 */
  }
}

function callPreset(id: number) {
  if (!selectedDevice.value) return
  deviceApi
    .callPreset(selectedDevice.value.deviceInfoId, id)
    .then(() => message.success(`调用预置位 ${id}`))
    .catch((err: unknown) =>
      message.error('调用预置位失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误')),
    )
}

function deletePreset(id: number) {
  if (!selectedDevice.value) return
  deviceApi
    .deletePreset(selectedDevice.value.deviceInfoId, id)
    .then(() => {
      presets.value = presets.value.filter((p: Preset) => p.devicePresetNo !== id)
      message.success('删除预置位成功')
    })
    .catch((err: unknown) =>
      message.error('删除预置位失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误')),
    )
}

function remoteUnlock(doorId: number) {
  if (!selectedDevice.value) return
  deviceApi
    .unlock(selectedDevice.value.deviceInfoId, doorId)
    .then(() => message.success(`门 ${doorId} 已开`))
    .catch((err: unknown) =>
      message.error('远程开门失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误')),
    )
}

/* ==================== 组织 / 列表 ==================== */

function syncOrg() {
  deviceApi
    .syncOrg()
    .then(() => {
      message.success('组织树同步成功')
      fetchOrgTree()
    })
    .catch((err: unknown) =>
      message.error('组织树同步失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误')),
    )
}

function onOrgSelect(org: OrgNode) {
  const kw = (org.deviceOrganizationName || '').trim()
  if (!kw) return
  deviceKeyword.value = kw
  message.info(`已按组织「${kw}」过滤设备`)
}

function fetchTimeline() {
  timeline.value = []
}

function loadPresets(deviceId: string) {
  deviceApi
    .listPresets(deviceId)
    .then((res: unknown) => {
      presets.value = (res as Preset[]) || []
    })
    .catch(() => {
      presets.value = []
    })
}

function fetchAccessEvents() {
  if (!selectedDevice.value) return
  const now = new Date()
  const start = new Date(now.getTime() - 24 * 3600 * 1000)
  const fmt = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ')
  deviceApi
    .queryAccessRecords(selectedDevice.value.deviceInfoId, fmt(start), fmt(now))
    .then((res: unknown) => {
      accessEvents.value = ((res as any[]) || []).map((r: any) => ({
        time: r.time || '',
        doorName: r.doorId || '',
        eventType: r.eventType || '',
        cardNo: r.cardNo || '',
        userName: r.userName || '',
        photoUrl: r.photoUrl || r.pictureURL || r.pictureUrl || r.imageUrl || '',
        direction: String(rawDirection(r) ?? ''),
      }))
    })
    .catch(() => {
      accessEvents.value = []
    })
}

function fetchEvents() {
  if (!selectedDevice.value) return
  deviceApi
    .queryEvents({ deviceId: selectedDevice.value.deviceInfoId, type: eventFilter.value.type })
    .then((res: unknown) => {
      events.value = (res as DeviceEvent[]) || []
    })
    .catch(() => {
      events.value = []
    })
}

function onEventFilterChange(v: { type: string; dateRange: unknown }) {
  eventFilter.value = v
}

function onEventRealtimeChange(v: boolean) {
  eventRealtime.value = v
}

/* ==================== 弹窗 ==================== */

function showAddDialog() {
  addDialogVisible.value = true
}

function showThresholdDialog() {
  deviceThreshold.value = selectedDevice.value?.deviceInfoOfflineThreshold
  thresholdDialogVisible.value = true
}

function saveDeviceThreshold() {
  if (!selectedDevice.value) return
  const threshold = deviceThreshold.value
  if (threshold == null || threshold <= 0) {
    message.warning('请输入有效的阈值（秒）')
    return
  }
  deviceApi
    .updateOfflineThreshold(selectedDevice.value.deviceInfoId, threshold)
    .then(() => {
      selectedDevice.value!.deviceInfoOfflineThreshold = threshold
      message.success('设备离线阈值已保存')
      thresholdDialogVisible.value = false
    })
    .catch((err: unknown) =>
      message.error('保存失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误')),
    )
}

function exportDevices() {
  deviceApi
    .exportDevices()
    .then((res: unknown) => {
      const blob = new Blob([res as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '设备列表.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      message.success('导出成功')
    })
    .catch((err: unknown) =>
      message.error('导出失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误')),
    )
}

function submitAdd() {
  if (!addForm.value.deviceInfoName.trim()) {
    message.warning('请填写设备名称')
    return
  }
  addSaving.value = true
  deviceApi
    .add(addForm.value)
    .then((res: unknown) => {
      const added = res as DeviceInfo | undefined
      if (added && added.deviceInfoId) {
        devices.value.push(added)
      } else {
        fetchDevices()
      }
      message.success('设备添加成功')
      addDialogVisible.value = false
    })
    .catch((err: unknown) =>
      message.error('设备添加失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误')),
    )
    .finally(() => {
      addSaving.value = false
    })
}

/* ==================== 生命周期 ==================== */

function fetchDevices() {
  devicesLoading.value = true
  deviceApi
    .list()
    .then((res: unknown) => {
      devices.value = (res as DeviceInfo[]) || []
    })
    .catch((err: unknown) => {
      message.error('加载设备列表失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误'))
      devices.value = []
    })
    .finally(() => {
      devicesLoading.value = false
    })
}

function fetchOrgTree() {
  deviceApi
    .getOrgTree()
    .then((res: unknown) => {
      orgTree.value = (res as OrgNode[]) || []
    })
    .catch((err: unknown) => {
      message.error('加载组织树失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误'))
      orgTree.value = []
    })
}

onMounted(() => {
  fetchDevices()
  fetchOrgTree()
  // 事件实时模式：选中设备时按 5s 轮询刷新事件列表
  pollTimer = setInterval(() => {
    if (eventRealtime.value && selectedDevice.value && activeTab.value === 'events') {
      fetchEvents()
    }
  }, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.dv {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 12px 12px;
  height: 100%;
  min-height: 0;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-blank, var(--el-bg-color));
}

.dv-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.dv-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 14px;
}
.dv-side {
  min-height: 0;
}
.dv-main {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: auto;
  padding-right: 2px;
}

/* ==================== 主机卡牌（详情头） ==================== */
.dv-hero {
  flex: none;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.dv-hero__icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  flex: none;
  border-radius: 16px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.dv-hero__icon.is-off {
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-text-color-primary) 8%, transparent);
}
.dv-hero__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dv-hero__title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dv-hero__name {
  font-size: 17px;
  font-weight: 650;
  letter-spacing: 0.01em;
}
.dv-hero__chips,
.dv-hero__extra {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
/* 预留扩展信息位：与主信息同一视觉语言，靠上一条细分隔线区分 */
.dv-hero__extra {
  margin-top: 2px;
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
.dv-hero__ops {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

.dv-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-text-color-primary) 4%, transparent);
}
.dv-chip em {
  font-style: normal;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.dv-chip--soft {
  background: color-mix(in srgb, var(--el-text-color-primary) 3%, transparent);
}

/* ==================== 页签面板 ==================== */
.dv-tabpanel {
  flex: 1;
  min-height: 0;
  padding: 14px 16px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.dv-overview {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dv-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.dv-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: var(--el-radius-lg, 12px);
  background: color-mix(in srgb, var(--el-text-color-primary) 3%, transparent);
}
.dv-info__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dv-info__value {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

/* ==================== 视频 ==================== */
.dv-video {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dv-video__player {
  aspect-ratio: 16 / 9;
  width: 100%;
  border-radius: var(--el-radius-lg, 12px);
}
.dv-video__bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.dv-video__label {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.dv-video__select {
  width: 170px;
}
.dv-video__select--sm {
  width: 110px;
}
.dv-video__ops {
  display: inline-flex;
  gap: 8px;
  margin-left: auto;
}

/* ==================== 设备总览 ==================== */
.dv-filter {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.dv-field {
  width: 170px;
}
.dv-field--search {
  width: 250px;
}
.dv-field :deep(.el-input),
.dv-field :deep(.el-select) {
  width: 100%;
}
.dv-filter__meta {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.dv-toolbar-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px solid var(--el-border-color-lighter);
}

.dv-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  align-content: start;
  gap: 14px;
  padding-bottom: 8px;
}
.dv-grid.is-empty {
  grid-template-columns: 1fr;
  align-content: stretch;
  place-items: center;
}

.dcard {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}
.dcard:hover {
  transform: translateY(-2px);
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow);
}
.dcard.is-off {
  opacity: 0.86;
}
.dcard__head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dcard__icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex: none;
  border-radius: 13px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.dcard.is-off .dcard__icon {
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-text-color-primary) 8%, transparent);
}
.dcard__title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.dcard__name {
  font-size: 15px;
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dcard__sub {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dcard__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.dcard__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.dcard__addr {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dcard__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: none;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-color-primary);
}

/* ==================== 表单 / 弹窗 ==================== */
.dv-form {
  display: flex;
  flex-direction: column;
}
.dv-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dv-panel__bar {
  width: 5px;
  height: 14px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.dv-provider {
  margin-top: 6px;
  padding: 12px 14px;
  border-radius: var(--el-radius-lg, 12px);
  background: color-mix(in srgb, var(--el-text-color-primary) 3%, transparent);
}
.dv-provider__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
}
.dv-provider__hint {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

@media (max-width: 1100px) {
  .dv-body {
    grid-template-columns: 1fr;
  }
  .dv-side {
    max-height: 420px;
  }
}
</style>
