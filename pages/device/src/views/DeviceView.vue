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
                <span v-if="hasGeo(selectedDevice)" class="dv-chip">
                  <em>经纬度</em>{{ fmtCoord(selectedDevice) }}
                </span>
                <button
                  v-if="hasGeo(selectedDevice)"
                  type="button"
                  class="dv-chip dv-chip--action"
                  @click="activeTab = 'map'"
                >
                  <el-icon><Location /></el-icon>
                  地图
                </button>
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
              <div v-else class="dv-hero__extra dv-hero__extra--reserve">
                <span class="dv-hero__reserve">＋ 预留信息位</span>
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
            <ReTab v-model="activeTab" :tabs="deviceTabs">
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
                <ReMap :devices="devices" :selected-id="selectedDevice?.deviceInfoId" @select="openDeviceMap" />
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
                    <el-segmented v-model="videoProtocol" :options="PROTOCOL_OPTIONS" size="small" />
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
            <el-segmented v-model="statusFilter" :options="statusSegments" class="dv-seg" />
            <div class="dv-field">
              <ReSelect v-model="categoryFilter" placeholder="全部大类" clearable :options="CATEGORY_OPTIONS" />
            </div>
            <span class="dv-filter__meta">{{ pageTotal }} 台</span>
            <ReButton icon="Search" :show-text="true" type="primary" :loading="pageLoading" @click="onQuery">
              查询
            </ReButton>
            <div class="dv-toolbar-ops">
              <ReButton icon="Plus" layout="square" type="primary" tip="添加设备" @click="showAddDialog" />
              <ReButton icon="Download" layout="square" tip="导出 Excel" @click="exportDevices" />
              <ReButton icon="Share" layout="square" tip="同步厂商组织" @click="syncOrg" />
              <ReButton icon="RefreshRight" layout="square" tip="刷新设备列表" :loading="pageLoading" @click="onQuery" />
            </div>
          </section>

          <div
            v-loading="pageLoading"
            class="dv-grid"
            :class="{ 'is-empty': !pageLoading && !pageRows.length }"
          >
            <article
              v-for="dev in pageRows"
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
                <span v-if="hasGeo(dev)" class="dv-chip dv-chip--soft">
                  <em>经纬度</em>{{ fmtCoord(dev) }}
                </span>
              </div>

              <footer class="dcard__foot">
                <span class="dcard__addr">{{ dev.deviceInfoAddress || '未配置位置' }}</span>
                <button
                  v-if="hasGeo(dev)"
                  type="button"
                  class="dcard__geo"
                  title="在地图上查看"
                  @click.stop="openDeviceMap(dev)"
                >
                  <el-icon><Location /></el-icon>
                  地图
                </button>
                <span class="dcard__link">
                  进入设备
                  <el-icon><ArrowRight /></el-icon>
                </span>
              </footer>
            </article>

            <ReEmpty
              v-if="!pageLoading && !pageRows.length"
              description="暂无设备，点击右上角「添加设备」接入厂商平台或 SDK 直连"
              :image-size="90"
            />
          </div>

          <div v-if="pageTotal > 0" class="dv-pager">
            <span class="dv-pager__total">共 {{ pageTotal }} 台</span>
            <el-pagination
              v-model:current-page="pageNo"
              v-model:page-size="pageSize"
              :total="pageTotal"
              :page-sizes="[8, 12, 24, 48]"
              layout="sizes, prev, pager, next"
              background
              @current-change="fetchPage"
              @size-change="resetPageAndFetch"
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
          <ReInput v-model="addForm.deviceInfoName" placeholder="例如 大厅球机 / 3F 门禁一体机" />
        </ReFormItem>
        <ReFormItem label="接入方式" required>
          <el-segmented v-model="addForm.authType" :options="AUTH_TYPE_SEGMENTS" />
        </ReFormItem>
        <ReFormItem label="设备大类" required>
          <ReSelect v-model="addForm.deviceInfoCategory" :options="CATEGORY_OPTIONS" style="width: 100%" />
        </ReFormItem>
        <ReFormItem label="设备小类" required>
          <ReSelect
            v-model="addForm.deviceInfoSubCategory"
            :options="getSubCategoryOptions(addForm.deviceInfoCategory)"
            style="width: 100%"
          />
        </ReFormItem>

        <template v-if="addForm.authType === 'PLATFORM'">
          <ReFormItem label="提供商凭据" required>
            <ReSelect
              v-model="addForm.credentialId"
              :options="credentialOptions"
              filterable
              clearable
              :loading="credentialsLoading"
              placeholder="选择已登记的提供商 AK/SK"
              style="width: 100%"
              @change="onCredentialChange"
            />
            <span v-if="!credentialsLoading && !credentialOptions.length" class="dv-hint">
              还没有启用的提供商凭据，请先到「提供商配置」登记 AK/SK（云曜还需 ProductCode / ProjectID）
            </span>
            <span v-else class="dv-hint">
              厂商、平台与 AK/SK 由所选凭据带出；设备表单不再保存密钥
            </span>
          </ReFormItem>
          <div v-if="selectedCredential" class="dv-provider">
            <div class="dv-provider__head">
              <span class="dv-panel__bar" />
              <span>{{ selectedCredential.deviceCredentialName }}</span>
            </div>
            <div class="dv-provider__hint">
              {{ vendorLabelOf(selectedCredential.deviceCredentialVendor) }} ·
              {{ platformLabelOf(selectedCredential.deviceCredentialPlatformType) }} · AK
              {{ selectedCredential.deviceCredentialAppKey || '—' }}
            </div>
          </div>
          <ReFormItem label="设备序列号" required>
            <ReInput v-model="addForm.deviceSerial" placeholder="平台侧设备序列号，例如 DS-2DE7A425IW..." />
          </ReFormItem>
        </template>

        <template v-else>
          <ReFormItem label="厂商" required>
            <ReSelect v-model="addForm.vendor" :options="VENDOR_OPTIONS" style="width: 100%" />
          </ReFormItem>
          <ReFormItem label="IP 地址" required>
            <ReInput v-model="addForm.deviceInfoIp" placeholder="例如 192.168.1.64" />
          </ReFormItem>
          <ReFormItem label="端口">
            <ReInputNumber
              v-model="addForm.deviceInfoPort"
              :min="1"
              :max="65535"
              placeholder="默认 8000"
              style="width: 100%"
            />
          </ReFormItem>
          <ReFormItem label="用户名">
            <ReInput v-model="addForm.deviceInfoUsername" placeholder="设备登录账号，例如 admin" />
          </ReFormItem>
          <ReFormItem label="密码">
            <ReInput
              v-model="addForm.deviceInfoPassword"
              type="password"
              show-password
              placeholder="设备登录密码"
            />
          </ReFormItem>
        </template>

        <ReFormItem label="安装位置">
          <ReInput v-model="addForm.deviceInfoAddress" placeholder="例如 A 栋 1F 大厅 / 园区南门" />
        </ReFormItem>
        <div class="dv-form__row">
          <ReFormItem label="纬度">
            <ReInputNumber
              v-model="addForm.deviceInfoLatitude"
              :precision="6"
              :step="0.000001"
              :controls="false"
              placeholder="例如 30.274100"
              style="width: 100%"
            />
          </ReFormItem>
          <ReFormItem label="经度">
            <ReInputNumber
              v-model="addForm.deviceInfoLongitude"
              :precision="6"
              :step="0.000001"
              :controls="false"
              placeholder="例如 120.155100"
              style="width: 100%"
            />
          </ReFormItem>
        </div>
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
import { computed, markRaw, onMounted, onUnmounted, ref, watch } from 'vue'
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
  Location,
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

import ReVideo from '../components/ReVideo.vue'
import ReDeviceTree from '../components/ReDeviceTree.vue'
import ReTimeline from '../components/ReTimeline.vue'
import RePtzControl from '../components/RePtzControl.vue'
import ReMultiVideo from '../components/ReMultiVideo.vue'
import ReAccessPanel from '../components/ReAccessPanel.vue'
import ReEventPanel from '../components/ReEventPanel.vue'
import ReMap from '../components/ReMap.vue'
import ReChannelManager from '../components/ReChannelManager.vue'

import { deviceApi } from '../api/deviceApi'
import { getCategoryLabel, getSubCategoryOptions } from '../utils/deviceCategory'
import { rawDirection } from '../utils/accessDirection'
import type {
  AccessEvent,
  DeviceEvent,
  DeviceInfo,
  OrgNode,
  PageResult,
  Preset,
  ProviderCredential,
  TimelineItem,
} from '../types/device'

/** 详情页签（图标用 Element Plus 图标名，由 ReTab → ReIcon 解析） */
const TAB_OVERVIEW: ReTabItem = { name: 'overview', label: '概览', icon: 'DataBoard' }
const TAB_MAP: ReTabItem = { name: 'map', label: '地图', icon: 'Location' }
const TAB_CHANNEL: ReTabItem = { name: 'channel', label: '通道', icon: 'Grid' }
const TAB_VIDEO: ReTabItem = { name: 'video', label: '视频', icon: 'VideoCamera' }
const TAB_PTZ: ReTabItem = { name: 'ptz', label: '云台', icon: 'Aim' }
const TAB_ACCESS: ReTabItem = { name: 'access', label: '门禁', icon: 'Lock' }
const TAB_EVENTS: ReTabItem = { name: 'events', label: '事件', icon: 'Bell' }

/** 支持云台的摄像机小类：球机 / 云台；枪机、半球固定安装，不出云台页签 */
const PTZ_SUB_CATEGORIES = new Set(['dome', 'ptz'])

const CATEGORY_OPTIONS = [
  { label: '摄像头', value: 'camera' },
  { label: '门禁', value: 'accessControl' },
  { label: '报警', value: 'alarm' },
  { label: '对讲', value: 'intercom' },
]

/** 接入方式（表单分片） */
const AUTH_TYPE_SEGMENTS = [
  { label: '平台接入', value: 'PLATFORM' },
  { label: 'SDK 直连', value: 'SDK' },
]

const VENDOR_OPTIONS = [
  { label: '海康威视', value: 'hikvision' },
  { label: '大华', value: 'dahua' },
]

const VENDOR_LABELS: Record<string, string> = {
  hikvision: '海康威视',
  dahua: '大华',
}

const PLATFORM_LABELS: Record<string, string> = {
  'cloud-yao': '云曜',
  'cloud-eye': '云眸',
  'secure-platform': '安防平台',
  'dahua-cloud': '云睿',
  lechange: '乐橙',
}

function vendorLabelOf(vendor?: string): string {
  return vendor ? VENDOR_LABELS[vendor] || vendor : '未知厂商'
}

function platformLabelOf(platform?: string): string {
  return platform ? PLATFORM_LABELS[platform] || platform : 'SDK 直连'
}

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

/** 是否配置了经纬度：有坐标才显示地图标志 / 地图页签内容 */
function hasGeo(d?: DeviceInfo | null): boolean {
  return d?.deviceInfoLatitude != null && d?.deviceInfoLongitude != null
}

function fmtCoord(d: DeviceInfo): string {
  const lat = Number(d.deviceInfoLatitude)
  const lng = Number(d.deviceInfoLongitude)
  if (Number.isNaN(lat) || Number.isNaN(lng)) return '—'
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

/** 顶部查询：同时刷新左侧树 / KPI 与右侧分页卡片 */
function onQuery(): void {
  fetchDevices()
  resetPageAndFetch()
}

const orgTree = ref<OrgNode[]>([])
const devices = ref<DeviceInfo[]>([])
const devicesLoading = ref(false)
const selectedDevice = ref<DeviceInfo | null>(null)
const activeTab = ref('overview')

/* ==================== 设备能力 → 详情页签 ==================== */

/**
 * 页签跟着设备能力走，而不是所有设备都摊同一排。
 *
 * <p>摄像机：通道 / 视频 /（球机、云台才有）云台 / 事件；
 * 门禁与对讲：通道 / 视频 / 门禁 / 事件，不出现云台；
 * 报警器：只保留概览 / 地图 / 事件，不出现通道、视频、云台、门禁。</p>
 */
function hasPtzCapability(d: DeviceInfo): boolean {
  if (d.deviceInfoCategory !== 'camera') return false
  const sub = (d.deviceInfoSubCategory || '').toLowerCase()
  return PTZ_SUB_CATEGORIES.has(sub) || sub.includes('ptz')
}

function hasVideoCapability(d: DeviceInfo): boolean {
  if (d.deviceInfoCategory === 'camera' || d.deviceInfoCategory === 'intercom') return true
  // 人脸 / 可视门禁一体机通常带摄像头：有通道才给视频页签
  if (d.deviceInfoCategory === 'accessControl') {
    return (d.deviceInfoChannelCount ?? 0) > 0 || (d.channels?.length ?? 0) > 0
  }
  return false
}

function hasChannelCapability(d: DeviceInfo): boolean {
  if (d.deviceInfoCategory === 'camera') return true
  // 门禁 / 对讲只有在登记了通道时才给通道与视频页签（读卡器等纯门禁设备没有通道）
  if (d.deviceInfoCategory === 'accessControl' || d.deviceInfoCategory === 'intercom') {
    return (d.deviceInfoChannelCount ?? 0) > 0 || (d.channels?.length ?? 0) > 0
  }
  return false
}

function hasAccessCapability(d: DeviceInfo): boolean {
  return (
    d.deviceInfoCategory === 'accessControl' ||
    d.deviceInfoCategory === 'intercom' ||
    (d.doors?.length ?? 0) > 0
  )
}

const deviceTabs = computed<ReTabItem[]>(() => {
  const d = selectedDevice.value
  if (!d) return []
  const tabs: ReTabItem[] = [TAB_OVERVIEW, TAB_MAP]
  if (hasChannelCapability(d)) tabs.push(TAB_CHANNEL)
  if (hasVideoCapability(d)) tabs.push(TAB_VIDEO)
  if (hasPtzCapability(d)) tabs.push(TAB_PTZ)
  if (hasAccessCapability(d)) tabs.push(TAB_ACCESS)
  tabs.push(TAB_EVENTS)
  return tabs
})

// 换了设备后原页签可能已不存在（例如从摄像机切到报警器），落回概览
watch(deviceTabs, (tabs) => {
  if (!tabs.some((t) => t.name === activeTab.value)) activeTab.value = 'overview'
})

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
  credentialId: '',
  platformType: '',
  deviceSerial: '',
  deviceInfoCategory: 'camera',
  deviceInfoSubCategory: 'bullet',
  deviceInfoIp: '',
  deviceInfoPort: 8000,
  deviceInfoUsername: 'admin',
  deviceInfoPassword: '',
  deviceInfoLatitude: undefined as number | undefined,
  deviceInfoLongitude: undefined as number | undefined,
  deviceInfoAddress: '',
})

/** 已登记的提供商凭据：设备表单只选凭据，不再手填 AK/SK */
const credentials = ref<ProviderCredential[]>([])
const credentialsLoading = ref(false)

/** 设备卡片网格：服务端分页 */
const pageRows = ref<DeviceInfo[]>([])
const pageLoading = ref(false)
const pageNo = ref(1)
const pageSize = ref(12)
const pageTotal = ref(0)

/** 页签懒加载：只有点到某个页签才拉该页签的数据 */
const tabLoaded = ref({ video: false, ptz: false, access: false, events: false })

/** 下拉里只展示启用中的平台凭据：SDK 直连凭据没有平台类型，不应出现在平台接入里 */
const enabledCredentials = computed(() =>
  credentials.value.filter((c) => c.deviceCredentialEnabled !== false && !!c.deviceCredentialPlatformType),
)

const credentialOptions = computed(() =>
  enabledCredentials.value.map((c) => ({
    value: c.deviceCredentialId || '',
    label: `${c.deviceCredentialName || '未命名凭据'} · ${vendorLabelOf(c.deviceCredentialVendor)} · ${platformLabelOf(
      c.deviceCredentialPlatformType,
    )}`,
  })),
)

const selectedCredential = computed(
  () => enabledCredentials.value.find((c) => c.deviceCredentialId === addForm.value.credentialId) || null,
)

function onCredentialChange(id: string): void {
  const credential = enabledCredentials.value.find((c) => c.deviceCredentialId === id)
  if (!credential) return
  addForm.value.vendor = credential.deviceCredentialVendor
  addForm.value.platformType = credential.deviceCredentialPlatformType || ''
}

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

/** 分段计数口径：先套上搜索与大类，避开「状态」自己筛自己 */
const baseDevices = computed(() => {
  const kw = deviceKeyword.value.trim().toLowerCase()
  return devices.value.filter((d) => {
    if (categoryFilter.value && d.deviceInfoCategory !== categoryFilter.value) return false
    if (!kw) return true
    return (d.deviceInfoName || '').toLowerCase().includes(kw) || (d.deviceInfoIp || '').toLowerCase().includes(kw)
  })
})

/** 状态分片（带计数）：全部 / 在线 / 离线 */
const statusSegments = computed(() => {
  const base = baseDevices.value
  const online = base.filter((d) => d.deviceInfoOnline).length
  return [
    { label: `全部 ${base.length}`, value: 'all' },
    { label: `在线 ${online}`, value: 'online' },
    { label: `离线 ${base.length - online}`, value: 'offline' },
  ]
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
    { label: '经纬度', value: hasGeo(d) ? fmtCoord(d) : '未配置' },
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
  activeTab.value = 'overview'
  tabLoaded.value = { video: false, ptz: false, access: false, events: false }
  if (dev.channels && dev.channels.length) {
    currentChannel.value = dev.channels[0].deviceChannelNo
  }
  // 首屏只展示概览；视频 / 云台 / 门禁 / 事件在点开对应页签时再取
  videoUrl.value = ''
  presets.value = []
  accessEvents.value = []
  events.value = []
  fetchTimeline()
}

/**
 * 页签懒加载：点到哪个页签才拉哪个页签的数据，避免选设备时一次性打满接口。
 */
function ensureTabData(tab: string): void {
  const dev = selectedDevice.value
  if (!dev) return
  if (tab === 'video' && hasVideoCapability(dev) && !tabLoaded.value.video) {
    tabLoaded.value.video = true
    reloadStream()
  } else if (tab === 'ptz' && hasPtzCapability(dev) && !tabLoaded.value.ptz) {
    tabLoaded.value.ptz = true
    loadPresets(dev.deviceInfoId)
  } else if (tab === 'access' && hasAccessCapability(dev) && !tabLoaded.value.access) {
    tabLoaded.value.access = true
    fetchAccessEvents()
  } else if (tab === 'events' && !tabLoaded.value.events) {
    tabLoaded.value.events = true
    fetchEvents()
  }
}

watch(activeTab, (tab) => ensureTabData(tab))

/** 卡片上的地图标志：选中设备并直接切到地图页签 */
function openDeviceMap(dev: DeviceInfo): void {
  selectDevice(dev)
  activeTab.value = 'map'
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
      fetchPage()
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
      fetchDevices()
      fetchPage()
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
  Object.assign(addForm.value, {
    deviceInfoName: '',
    vendor: 'hikvision',
    authType: 'PLATFORM',
    credentialId: '',
    platformType: '',
    deviceSerial: '',
    deviceInfoCategory: 'camera',
    deviceInfoSubCategory: 'bullet',
    deviceInfoIp: '',
    deviceInfoPort: 8000,
    deviceInfoUsername: 'admin',
    deviceInfoPassword: '',
    deviceInfoLatitude: undefined,
    deviceInfoLongitude: undefined,
    deviceInfoAddress: '',
  })
  addDialogVisible.value = true
  void fetchCredentials(true)
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
  const form = addForm.value
  if (!form.deviceInfoName.trim()) {
    message.warning('请填写设备名称')
    return
  }
  if (form.authType === 'PLATFORM' && !selectedCredential.value) {
    message.warning('请选择提供商凭据')
    return
  }
  if (form.authType === 'PLATFORM' && !form.deviceSerial.trim()) {
    message.warning('请填写平台侧设备序列号')
    return
  }
  if (form.authType === 'SDK' && !form.deviceInfoIp.trim()) {
    message.warning('请填写设备 IP 地址')
    return
  }
  addSaving.value = true
  const payload = {
    vendor: form.vendor,
    authType: form.authType,
    platformType: selectedCredential.value?.deviceCredentialPlatformType || undefined,
    deviceSerial: form.deviceSerial.trim() || undefined,
    ip: form.deviceInfoIp.trim() || undefined,
    port: form.deviceInfoPort,
    username: form.deviceInfoUsername,
    password: form.deviceInfoPassword,
    extra: {
      credentialId: form.credentialId || undefined,
      deviceInfoName: form.deviceInfoName.trim(),
      deviceInfoCategory: form.deviceInfoCategory,
      deviceInfoSubCategory: form.deviceInfoSubCategory,
      deviceInfoSerial: form.deviceSerial.trim() || undefined,
      deviceInfoLatitude: form.deviceInfoLatitude,
      deviceInfoLongitude: form.deviceInfoLongitude,
      deviceInfoAddress: form.deviceInfoAddress || undefined,
    },
  }
  deviceApi
    .add(payload)
    .then(() => {
      message.success('设备添加成功')
      addDialogVisible.value = false
      fetchDevices()
      fetchPage()
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
      // /page 未上线或首屏分页请求先于列表返回时，用本机分页兜底
      if (pageMode === 'client' || (pageRows.value.length === 0 && pageTotal.value === 0 && !hasActiveFilters())) {
        applyClientPage()
      }
    })
    .catch((err: unknown) => {
      message.error('加载设备列表失败: ' + ((err as any)?.response?.data?.message || (err as Error)?.message || '未知错误'))
      devices.value = []
    })
    .finally(() => {
      devicesLoading.value = false
    })
}

/**
 * 本机分页：按当前筛选条件过滤后切片。
 *
 * <p>不依赖后端新增的 /page：现场后端版本参差，只要 /list 能拿到设备，这里就能分页。
 * 数据量再大时再把 /page 接回来，页面上的分页交互不用改。</p>
 */
function applyClientPage(): void {
  const kw = deviceKeyword.value.trim().toLowerCase()
  const list = devices.value.filter((d) => {
    if (categoryFilter.value && d.deviceInfoCategory !== categoryFilter.value) return false
    if (statusFilter.value === 'online' && !d.deviceInfoOnline) return false
    if (statusFilter.value === 'offline' && d.deviceInfoOnline) return false
    if (!kw) return true
    return [d.deviceInfoName, d.deviceInfoIp, d.deviceInfoSerial, d.deviceInfoAddress]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(kw))
  })
  const total = list.length
  const maxPage = Math.max(1, Math.ceil(total / pageSize.value))
  if (pageNo.value > maxPage) pageNo.value = maxPage
  const start = (pageNo.value - 1) * pageSize.value
  pageRows.value = list.slice(start, start + pageSize.value)
  pageTotal.value = total
}

function fetchPage() {
  applyClientPage()
}

function resetPageAndFetch(): void {
  pageNo.value = 1
  fetchPage()
}

/** 提供商凭据：设备表单从这里选，而不是手填 AK/SK */
async function fetchCredentials(selectFirst = false): Promise<void> {
  credentialsLoading.value = true
  try {
    const res = (await deviceApi.listCredentials()) as ProviderCredential[]
    credentials.value = (res || []).filter((c) => c.deviceCredentialEnabled !== false)
    if (selectFirst && !addForm.value.credentialId) {
      const first = credentials.value[0]
      if (first?.deviceCredentialId) {
        addForm.value.credentialId = first.deviceCredentialId
        onCredentialChange(first.deviceCredentialId)
      }
    }
  } catch {
    credentials.value = []
  } finally {
    credentialsLoading.value = false
  }
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

let filterTimer: ReturnType<typeof setTimeout> | null = null

// 筛选条件变化 → 回到第一页重新查；250ms 防抖，避免输入时每敲一下打一次接口
watch([deviceKeyword, statusFilter, categoryFilter], () => {
  if (filterTimer) clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    filterTimer = null
    resetPageAndFetch()
  }, 250)
})

onMounted(() => {
  fetchDevices()
  fetchPage()
  fetchOrgTree()
  fetchCredentials()
  // 事件实时模式：选中设备时按 5s 轮询刷新事件列表
  pollTimer = setInterval(() => {
    if (eventRealtime.value && selectedDevice.value && activeTab.value === 'events') {
      fetchEvents()
    }
  }, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (filterTimer) clearTimeout(filterTimer)
})
</script>

<style scoped>
.dv {
  display: flex;
  flex-direction: column;
  gap: 14px;
  /* 左右内边距交给外层布局(main.el-main)：两层叠加会让右侧空隙过大 */
  padding: 10px 0 12px;
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
.dv-hero__extra--reserve {
  padding-top: 8px;
}
.dv-hero__reserve {
  padding: 2px 10px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  border: 1px dashed var(--el-border-color);
  border-radius: 999px;
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
.dv-chip--action {
  border: none;
  cursor: pointer;
  font: inherit;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.dv-chip--action:hover {
  background: var(--el-color-primary-light-8);
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
/* 状态筛选分片：不再由 .dv-field 定宽 */
.dv-seg {
  flex: none;
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
  flex: 1;
  min-width: 0;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dcard__geo {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex: none;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 12.5px;
  color: var(--el-color-primary);
}
.dcard__geo:hover {
  text-decoration: underline;
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

/* ==================== 分页 ==================== */
.dv-pager {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 2px 2px 6px;
}
.dv-pager__total {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

/* ==================== 表单 / 弹窗 ==================== */
.dv-form {
  display: flex;
  flex-direction: column;
}
.dv-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 600px) {
  .dv-form__row {
    grid-template-columns: 1fr;
  }
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
