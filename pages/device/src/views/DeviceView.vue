<template>
  <div class="device-page flex flex-col h-full">
    <!-- 页头 -->
    <header class="flex items-start justify-between gap-4 px-5 pt-5">
      <div class="min-w-0">
        <h2 class="text-xl font-semibold text-el-text">设备台账</h2>
        <p class="text-sm text-el-text-secondary mt-1">
          统一管理摄像头、门禁、报警与对讲设备，支持厂商同步、在线监测、视频预览与空间定位。
        </p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <el-button @click="refreshAll">
          <el-icon class="mr-1"><Refresh /></el-icon>刷新
        </el-button>
        <el-button @click="orgVisible = true">
          <el-icon class="mr-1"><OfficeBuilding /></el-icon>组织管理
        </el-button>
        <el-button @click="goScreen">
          <el-icon class="mr-1"><Monitor /></el-icon>大屏
        </el-button>
        <el-button @click="goProvider">
          <el-icon class="mr-1"><Connection /></el-icon>厂商接入
        </el-button>
        <el-button @click="exportDevices">
          <el-icon class="mr-1"><Download /></el-icon>导出
        </el-button>
        <el-button type="primary" @click="openCreate">
          <el-icon class="mr-1"><Plus /></el-icon>新增设备
        </el-button>
      </div>
    </header>

    <!-- 统计卡片 -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4 px-5 pt-4">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="stat-card"
        :class="card.accent"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm text-el-text-secondary">{{ card.label }}</span>
          <el-icon class="text-lg" :class="card.iconClass"><component :is="card.icon" /></el-icon>
        </div>
        <div class="text-2xl font-semibold mt-2 text-el-text">{{ card.value }}</div>
        <div class="text-xs text-el-text-secondary mt-1">{{ card.hint }}</div>
      </div>
    </section>

    <!-- 筛选 -->
    <section class="filter-bar mx-5 mt-4">
      <el-input
        v-model="filters.keyword"
        class="filter-keyword"
        clearable
        placeholder="搜索名称 / 编码 / IP / 序列号 / 负责人"
        @keyup.enter="applyFilters"
        @clear="applyFilters"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>

      <el-select v-model="filters.vendor" clearable placeholder="厂商" class="filter-select" @change="applyFilters">
        <el-option
          v-for="vendor in vendors"
          :key="vendor.vendor"
          :label="vendor.name"
          :value="vendor.vendor"
        />
      </el-select>

      <el-select v-model="filters.category" clearable placeholder="设备大类" class="filter-select" @change="applyFilters">
        <el-option
          v-for="(label, value) in CATEGORY_LABELS"
          :key="value"
          :label="label"
          :value="value"
        />
      </el-select>

      <el-select v-model="filters.online" clearable placeholder="在线状态" class="filter-select" @change="applyFilters">
        <el-option label="在线" value="online" />
        <el-option label="离线" value="offline" />
      </el-select>

      <el-select v-model="filters.status" clearable placeholder="资产状态" class="filter-select" @change="applyFilters">
        <el-option
          v-for="opt in DEVICE_STATUS_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>

      <el-select v-model="filters.groupId" clearable placeholder="设备分组" class="filter-select" @change="applyFilters">
        <el-option label="未分组" value="__none__" />
        <el-option
          v-for="node in groupOptions"
          :key="node.groupId"
          :label="node.label"
          :value="node.groupId"
        />
      </el-select>

      <el-cascader
        v-model="filters.orgId"
        class="filter-org"
        clearable
        placeholder="所属组织"
        :options="orgTree"
        :props="orgCascaderProps"
        @change="applyFilters"
      />

      <div class="flex items-center gap-2 ml-auto">
        <span class="text-xs text-el-text-secondary whitespace-nowrap">
          状态通道：{{ realtimeMode === 'socket' ? '实时' : '轮询' }}
        </span>
        <el-button @click="resetFilters">重置</el-button>
        <el-button type="primary" @click="applyFilters">查询</el-button>
      </div>
    </section>

    <!-- 批量操作 -->
    <section v-if="selection.length" class="batch-bar mx-5 mt-3">
      <span class="text-sm text-el-text">已选 {{ selection.length }} 台设备</span>
      <div class="flex items-center gap-2">
        <el-button size="small" type="primary" plain @click="openVideoWizard">视频预览</el-button>
        <el-button size="small" @click="batchReconnect">批量重连</el-button>
        <el-button size="small" @click="openBatchGroups">设置分组</el-button>
        <el-button size="small" type="danger" plain @click="batchRemove">批量删除</el-button>
      </div>
    </section>

    <!-- 设备列表 -->
    <section class="mx-5 mt-3">
      <el-table
        v-loading="loading"
        :data="rows"
        row-key="deviceInfoId"
        stripe
        class="device-table"
        @selection-change="onSelectionChange"
        @row-dblclick="openDetail"
      >
        <el-table-column type="selection" width="44" reserve-selection />

        <el-table-column label="设备" min-width="250">
          <template #default="{ row }">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-el-text truncate">{{ row.deviceInfoName }}</span>
                <el-tag :type="statusMeta(row.deviceInfoStatus).type" size="small" effect="plain">
                  {{ statusMeta(row.deviceInfoStatus).label }}
                </el-tag>
                <el-tag v-if="row.deviceInfoSource === 'vendor'" size="small" effect="plain" type="info">
                  同步
                </el-tag>
              </div>
              <div class="flex items-center gap-1 mt-1 text-xs text-el-text-secondary">
                <span class="font-mono truncate">{{ row.deviceInfoCode || '未编码' }}</span>
                <el-button
                  v-if="row.deviceInfoCode"
                  link
                  size="small"
                  @click.stop="copyCode(row.deviceInfoCode)"
                >
                  复制
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="厂商 / 型号" min-width="150">
          <template #default="{ row }">
            <div class="text-sm text-el-text">{{ vendorLabel(row.deviceInfoVendor) }}</div>
            <div class="text-xs text-el-text-secondary mt-0.5 truncate">
              {{ row.deviceInfoModel || '—' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="在线状态" width="130">
          <template #default="{ row }">
            <div class="leading-tight">
              <DeviceStatusPulse :online="row.deviceInfoOnline" />
              <div class="text-xs text-el-text-secondary mt-0.5">
                {{ row.deviceInfoOnline ? '心跳正常' : lastOnlineText(row) }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="负责人" min-width="150">
          <template #default="{ row }">
            <DeviceOwnerCell :device="row" />
          </template>
        </el-table-column>

        <el-table-column label="分组" min-width="150">
          <template #default="{ row }">
            <div v-if="groupBadgesOf(row.deviceInfoId).length" class="flex flex-wrap gap-1">
              <el-tag
                v-for="g in groupBadgesOf(row.deviceInfoId)"
                :key="g.groupId"
                size="small"
                effect="plain"
                type="info"
                class="cursor-pointer"
                @click.stop="filters.groupId = g.groupId; applyFilters()"
              >
                {{ g.groupName }}
              </el-tag>
            </div>
            <span v-else class="text-xs text-el-text-secondary">未分组</span>
          </template>
        </el-table-column>

        <el-table-column label="码流" width="120">
          <template #default="{ row }">
            <DeviceStreamTags :device="row" @preview="(streamType) => previewStream(row, streamType)" />
          </template>
        </el-table-column>

        <el-table-column label="位置" min-width="160">
          <template #default="{ row }">
            <DeviceLocationCell :device="row" />
          </template>
        </el-table-column>

        <el-table-column label="创建 / 更新" width="150">
          <template #default="{ row }">
            <div class="text-xs text-el-text">{{ formatDateTime(row.deviceInfoUpdatedAt) }}</div>
            <div class="text-xs text-el-text-secondary mt-0.5">
              建 {{ formatDateTime(row.deviceInfoCreatedAt) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="openDetail(row)">详情</el-button>
            <el-button link type="primary" size="small" @click.stop="openEdit(row)">编辑</el-button>
            <el-dropdown trigger="click" @command="(cmd: string) => onRowCommand(cmd, row)">
              <el-button link type="primary" size="small" @click.stop>
                更多<el-icon class="ml-0.5"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="reconnect">重新连接</el-dropdown-item>
                  <el-dropdown-item command="refresh">刷新状态</el-dropdown-item>
                  <el-dropdown-item command="groups">设置分组</el-dropdown-item>
                  <el-dropdown-item command="remove" divided>删除设备</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>

        <template #empty>
          <div class="py-10 text-sm text-el-text-secondary">暂无设备，可点击右上角「新增设备」或前往「厂商接入」同步。</div>
        </template>
      </el-table>
    </section>

    <!-- 分页 -->
    <footer class="flex items-center justify-between px-5 py-3">
      <span class="text-xs text-el-text-secondary">
        共 {{ page.total }} 台，当前第 {{ page.pageNo }} / {{ Math.max(page.totalPages, 1) }} 页
      </span>
      <el-pagination
        v-model:current-page="page.pageNo"
        v-model:page-size="page.pageSize"
        :total="page.total"
        :page-sizes="[20, 50, 100, 200]"
        layout="sizes, prev, pager, next, jumper"
        background
        @current-change="fetchPage"
        @size-change="onPageSizeChange"
      />
    </footer>

    <!-- 新增 / 编辑 -->
    <ReDeviceFormDialog
      v-model="formVisible"
      :device="editingDevice"
      :vendors="vendors"
      :org-tree="orgTree"
      @saved="onDeviceSaved"
    />

    <!-- 详情抽屉 -->
    <ReDeviceDetailDrawer
      v-model="detailVisible"
      :device="currentDevice"
      :devices="rows"
      :vendors="vendors"
      @edit="openEdit"
      @refreshed="refreshAll"
    />

    <!-- 组织管理 -->
    <el-dialog v-model="orgVisible" title="组织管理" width="560">
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs text-el-text-secondary">组织来自厂商平台同步，用于设备分组与筛选。</span>
        <el-button size="small" :loading="orgSyncing" @click="syncOrg">
          <el-icon class="mr-1"><Refresh /></el-icon>同步组织
        </el-button>
      </div>
      <div class="max-h-[420px] overflow-auto border border-el-border rounded-lg p-2">
        <el-tree
          v-if="orgTree.length"
          :data="orgTree"
          node-key="deviceOrganizationId"
          :props="{ label: 'deviceOrganizationName', children: 'children' }"
          default-expand-all
          empty-text="暂无组织"
        />
        <div v-else class="py-8 text-center text-sm text-el-text-secondary">暂无组织，点击「同步组织」从厂商拉取。</div>
      </div>
    </el-dialog>

    <!-- 视频预览 -->
    <el-dialog v-model="previewVisible" :title="previewTitle" width="760px" destroy-on-close>
      <div class="bg-black rounded-lg overflow-hidden aspect-video">
        <ReVideo
          v-if="previewUrl"
          :url="previewUrl"
          :protocol="'hls'"
          :channel="previewChannel"
          @error="onPreviewError"
        />
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
    <!-- 视频布局向导 -->
    <el-dialog v-model="videoWizardVisible" title="视频预览" width="480px" destroy-on-close>
      <div class="space-y-4">
        <div>
          <div class="text-sm mb-2">布局</div>
          <el-radio-group v-model="videoLayout">
            <el-radio-button :value="1">1×1</el-radio-button>
            <el-radio-button :value="4">2×2</el-radio-button>
            <el-radio-button :value="9">3×3</el-radio-button>
            <el-radio-button :value="16">4×4</el-radio-button>
          </el-radio-group>
        </div>
        <div>
          <div class="text-sm mb-2">打开方式</div>
          <el-radio-group v-model="videoOpenMode">
            <el-radio value="current">当前页</el-radio>
            <el-radio value="new">新窗口</el-radio>
          </el-radio-group>
        </div>
        <el-checkbox v-model="videoRemind">打开后提示（remind=true）</el-checkbox>
        <div class="text-xs text-el-text-secondary">
          已选 {{ selection.length }} 台设备；超出布局数量时按布局分页轮播，单画面全屏默认主码流。
        </div>
      </div>
      <template #footer>
        <el-button @click="videoWizardVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmVideoWizard">打开预览</el-button>
      </template>
    </el-dialog>

    <!-- 设置分组（单台 / 批量） -->
    <el-dialog v-model="groupDialogVisible" :title="groupDialogTitle" width="460px" destroy-on-close>
      <div class="text-xs text-el-text-secondary mb-3">
        一台设备可以同时属于多个分组；保存会用勾选结果整体替换{{ groupDialogDeviceIds.length > 1 ? '这些设备' : '该设备' }}的分组。
      </div>
      <div v-if="groupOptions.length" class="max-h-[360px] overflow-auto">
        <el-checkbox-group v-model="groupDialogChecked" class="flex flex-col gap-2">
          <el-checkbox v-for="node in groupOptions" :key="node.groupId" :value="node.groupId">
            {{ node.label }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <div v-else class="py-6 text-center text-sm text-el-text-secondary">
        还没有分组，先到「设备分组」页创建。
      </div>
      <template #footer>
        <el-button @click="groupDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="groupSaving" @click="saveDeviceGroups">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { message } from '@repo/core'
import {
  ArrowDown,
  Connection,
  Download,
  OfficeBuilding,
  Plus,
  Refresh,
  Search,
  Monitor,
  Link,
  WarningFilled,
  LocationInformation
} from '@element-plus/icons-vue'

import DeviceStatusPulse from '@pages/device/src/components/DeviceStatusPulse.vue'
import DeviceOwnerCell from '@pages/device/src/components/DeviceOwnerCell.vue'
import DeviceLocationCell from '@pages/device/src/components/DeviceLocationCell.vue'
import DeviceStreamTags from '@pages/device/src/components/DeviceStreamTags.vue'
import ReDeviceFormDialog from '@pages/device/src/components/ReDeviceFormDialog.vue'
import ReDeviceDetailDrawer from '@pages/device/src/components/ReDeviceDetailDrawer.vue'
import ReVideo from '@pages/device/src/components/ReVideo.vue'

import { deviceApi } from '@pages/device/src/api/deviceApi'
import { useDeviceRealtime } from '@pages/device/src/composables/useDeviceRealtime'
import { CATEGORY_LABELS } from '@pages/device/src/utils/deviceCategory'
import {
  DEVICE_STATUS_OPTIONS,
  buildOrgTree,
  copyText,
  formatDateTime,
  formatRelative,
  statusMeta
} from '@pages/device/src/utils/deviceFormat'
import type {
  DeviceGroupNode,
  DeviceInfo,
  DevicePageQuery,
  DeviceStatusEvent,
  DeviceVendorDescriptor,
  OrgNode
} from '@pages/device/src/types/device'

const router = useRouter()

const rows = ref<DeviceInfo[]>([])
const vendors = ref<DeviceVendorDescriptor[]>([])
const orgTree = ref<OrgNode[]>([])
const groups = ref<DeviceGroupNode[]>([])
const assignments = ref<Array<{ deviceId: string; groupId: string }>>([])
const loading = ref(false)
const selection = ref<DeviceInfo[]>([])

/** 设置分组弹窗 */
const groupDialogVisible = ref(false)
const groupDialogDeviceIds = ref<string[]>([])
const groupDialogChecked = ref<string[]>([])
const groupSaving = ref(false)

/** 视频布局向导：多选设备 → 选择布局/打开方式 → 视频预览页 */
const videoWizardVisible = ref(false)
const videoLayout = ref(4)
const videoOpenMode = ref<'current' | 'new'>('current')
const videoRemind = ref(true)

function openVideoWizard() {
  if (!selection.value.length) {
    message.warning('请先选择设备')
    return
  }
  videoWizardVisible.value = true
}

function confirmVideoWizard() {
  const ids = selection.value.map((item) => item.deviceInfoId).filter(Boolean).join(',')
  if (!ids) {
    message.warning('所选设备缺少设备 ID')
    return
  }
  const target = router.resolve({
    path: '/device/video-wall',
    query: {
      ids,
      layout: String(videoLayout.value),
      remind: videoRemind.value ? 'true' : 'false'
    }
  })
  videoWizardVisible.value = false
  if (videoOpenMode.value === 'new') {
    window.open(target.href, '_blank', 'noopener')
  } else {
    router.push(target)
  }
}
const stats = reactive({ total: 0, online: 0, offline: 0, noLocation: 0 })

const filters = reactive({
  keyword: '',
  vendor: '',
  category: '',
  online: '',
  status: '',
  groupId: '',
  orgId: ''
})

const page = reactive({ pageNo: 1, pageSize: 20, total: 0, totalPages: 0 })

const orgCascaderProps = {
  value: 'deviceOrganizationId',
  label: 'deviceOrganizationName',
  children: 'children',
  emitPath: false
} as const

/** 分组树拍平（带层级缩进），用于筛选与勾选 */
const groupOptions = computed(() => {
  const out: Array<{ groupId: string; groupName: string; label: string }> = []
  const walk = (nodes: DeviceGroupNode[], depth: number) => {
    for (const node of nodes || []) {
      if (!node.groupId) continue
      out.push({
        groupId: node.groupId,
        groupName: node.groupName,
        label: `${'　'.repeat(depth)}${node.groupName}`
      })
      if (node.children?.length) walk(node.children, depth + 1)
    }
  }
  walk(groups.value, 0)
  return out
})

const groupNameMap = computed(() => {
  const map = new Map<string, string>()
  for (const node of groupOptions.value) map.set(node.groupId, node.groupName)
  return map
})

const groupDialogTitle = computed(() =>
  groupDialogDeviceIds.value.length > 1
    ? `设置分组（${groupDialogDeviceIds.value.length} 台设备）`
    : '设置分组'
)

function groupBadgesOf(deviceId: string) {
  const ids = assignments.value
    .filter((item) => item.deviceId === deviceId)
    .map((item) => item.groupId)
  return ids.map((groupId) => ({
    groupId,
    groupName: groupNameMap.value.get(groupId) || '未知分组'
  }))
}

const formVisible = ref(false)
const editingDevice = ref<DeviceInfo | null>(null)
const detailVisible = ref(false)
const currentDevice = ref<DeviceInfo | null>(null)
const orgVisible = ref(false)
const orgSyncing = ref(false)

const previewVisible = ref(false)
const previewUrl = ref('')
const previewTitle = ref('视频预览')
const previewChannel = ref(1)

const statCards = computed(() => [
  {
    key: 'total',
    label: '设备总数',
    value: stats.total,
    hint: '全部已登记设备',
    icon: Monitor,
    accent: 'accent-blue',
    iconClass: 'text-blue-500'
  },
  {
    key: 'online',
    label: '在线',
    value: stats.online,
    hint: '心跳正常',
    icon: Link,
    accent: 'accent-emerald',
    iconClass: 'text-emerald-500'
  },
  {
    key: 'offline',
    label: '离线',
    value: stats.offline,
    hint: '需关注',
    icon: WarningFilled,
    accent: 'accent-orange',
    iconClass: 'text-orange-500'
  },
  {
    key: 'noLocation',
    label: '未定位',
    value: stats.noLocation,
    hint: '尚未配置经纬度',
    icon: LocationInformation,
    accent: 'accent-slate',
    iconClass: 'text-slate-500'
  }
])

const realtime = useDeviceRealtime({
  onStatus: patchStatus,
  onRefresh: () => {
    fetchStats()
    fetchPage()
  },
  pollInterval: 15000
})
const { mode: realtimeMode } = realtime

function vendorLabel(vendor?: string): string {
  if (!vendor) return '—'
  return vendors.value.find((item) => item.vendor === vendor)?.name || vendor
}

function lastOnlineText(row: DeviceInfo): string {
  if (!row.deviceInfoLastOnlineAt) return '从未上线'
  return `最后在线 ${formatRelative(row.deviceInfoLastOnlineAt)}`
}

function buildQuery(): DevicePageQuery {
  return {
    pageNo: page.pageNo,
    pageSize: page.pageSize,
    keyword: filters.keyword || undefined,
    vendor: filters.vendor || undefined,
    category: filters.category || undefined,
    orgId: filters.orgId || undefined,
    status: filters.status || undefined,
    online: filters.online === 'online' ? true : filters.online === 'offline' ? false : undefined,
    groupId: filters.groupId && filters.groupId !== '__none__' ? filters.groupId : undefined,
    ungrouped: filters.groupId === '__none__' ? true : undefined,
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  }
}

async function fetchPage() {
  loading.value = true
  try {
    const result = await deviceApi.page(buildQuery())
    // 兼容后端分页结构调整：标准 PageResult 使用 data，旧结构使用 records
    const list = (result as unknown as { data?: DeviceInfo[]; records?: DeviceInfo[] })?.data
      ?? (result as unknown as { records?: DeviceInfo[] })?.records
      ?? []
    rows.value = list
    page.total = Number((result as unknown as { total?: number })?.total ?? 0)
    page.totalPages = Number(
      (result as unknown as { totalPages?: number })?.totalPages
      ?? Math.ceil(page.total / page.pageSize)
    )
  } catch (err) {
    rows.value = []
    page.total = 0
    page.totalPages = 0
    message.error('加载设备列表失败：' + errorText(err))
  } finally {
    loading.value = false
  }
}

async function fetchStats() {
  try {
    const result = await deviceApi.stats({
      orgId: filters.orgId || undefined,
      vendor: filters.vendor || undefined
    })
    stats.total = Number(result?.total ?? 0)
    stats.online = Number(result?.online ?? 0)
    stats.offline = Number(result?.offline ?? 0)
    stats.noLocation = Number(result?.noLocation ?? 0)
  } catch {
    // 统计失败不阻断列表
  }
}

async function fetchVendors() {
  try {
    vendors.value = (await deviceApi.listVendors()) || []
  } catch {
    vendors.value = []
  }
}

async function fetchOrgTree() {
  try {
    const list = await deviceApi.getOrgTree()
    orgTree.value = buildOrgTree(list)
  } catch {
    orgTree.value = []
  }
}

async function fetchGroups() {
  try {
    const [tree, links] = await Promise.all([
      deviceApi.groupTree(),
      deviceApi.groupAssignments()
    ])
    groups.value = tree || []
    assignments.value = links || []
  } catch {
    groups.value = []
    assignments.value = []
  }
}

function applyFilters() {
  page.pageNo = 1
  fetchPage()
  fetchStats()
}

function resetFilters() {
  filters.keyword = ''
  filters.vendor = ''
  filters.category = ''
  filters.online = ''
  filters.status = ''
  filters.groupId = ''
  filters.orgId = ''
  applyFilters()
}

function onPageSizeChange() {
  page.pageNo = 1
  fetchPage()
}

function refreshAll() {
  fetchStats()
  fetchPage()
}

function patchStatus(event: DeviceStatusEvent) {
  const row = rows.value.find((item) => item.deviceInfoId === event.deviceId)
  if (!row) return
  const wasOnline = !!row.deviceInfoOnline
  row.deviceInfoOnline = event.online
  if (event.latitude != null) row.deviceInfoLatitude = Number(event.latitude)
  if (event.longitude != null) row.deviceInfoLongitude = Number(event.longitude)
  if (event.lastOnlineAt) row.deviceInfoLastOnlineAt = event.lastOnlineAt
  if (event.lastOfflineAt) row.deviceInfoLastOfflineAt = event.lastOfflineAt
  if (wasOnline !== event.online) {
    stats.online += event.online ? 1 : -1
    stats.offline += event.online ? -1 : 1
  }
}

function onSelectionChange(value: DeviceInfo[]) {
  selection.value = value
}

function openCreate() {
  editingDevice.value = null
  formVisible.value = true
}

function openEdit(device: DeviceInfo) {
  editingDevice.value = device
  detailVisible.value = false
  formVisible.value = true
}

function openDetail(device: DeviceInfo) {
  currentDevice.value = device
  detailVisible.value = true
}

function onDeviceSaved() {
  formVisible.value = false
  editingDevice.value = null
  refreshAll()
}

async function copyCode(code?: string) {
  if (!code) return
  const ok = await copyText(code)
  if (ok) {
    message.success('设备编码已复制')
  } else {
    message.warning('复制失败，请手动选择文本')
  }
}

function onRowCommand(command: string, row: DeviceInfo) {
  if (command === 'reconnect') {
    reconnect(row)
  } else if (command === 'refresh') {
    refreshStatus(row)
  } else if (command === 'groups') {
    openDeviceGroups(row)
  } else if (command === 'remove') {
    removeDevice(row)
  }
}

/** 单台设备设置分组 */
async function openDeviceGroups(row: DeviceInfo) {
  groupDialogDeviceIds.value = [row.deviceInfoId]
  groupDialogChecked.value = assignments.value
    .filter((item) => item.deviceId === row.deviceInfoId)
    .map((item) => item.groupId)
  if (!groupDialogChecked.value.length) {
    try {
      groupDialogChecked.value = (await deviceApi.deviceGroups(row.deviceInfoId)) || []
    } catch {
      // 回显失败不阻断弹窗
    }
  }
  groupDialogVisible.value = true
}

/** 批量设置分组：以所选设备的共同分组为初始值 */
function openBatchGroups() {
  const ids = selection.value.map((item) => item.deviceInfoId).filter(Boolean)
  if (!ids.length) {
    message.warning('请先选择设备')
    return
  }
  groupDialogDeviceIds.value = ids
  const [first, ...rest] = ids
  const common = new Set(
    assignments.value.filter((item) => item.deviceId === first).map((item) => item.groupId)
  )
  for (const id of rest) {
    const own = new Set(
      assignments.value.filter((item) => item.deviceId === id).map((item) => item.groupId)
    )
    for (const groupId of [...common]) {
      if (!own.has(groupId)) common.delete(groupId)
    }
  }
  groupDialogChecked.value = [...common]
  groupDialogVisible.value = true
}

async function saveDeviceGroups() {
  const ids = groupDialogDeviceIds.value
  if (!ids.length) return
  groupSaving.value = true
  try {
    await Promise.all(ids.map((id) => deviceApi.assignDeviceGroups(id, groupDialogChecked.value)))
    message.success(ids.length > 1 ? `已更新 ${ids.length} 台设备的分组` : '分组已更新')
    groupDialogVisible.value = false
    await fetchGroups()
    if (filters.groupId) fetchPage()
  } catch (err) {
    message.error('设置分组失败：' + errorText(err))
  } finally {
    groupSaving.value = false
  }
}

async function reconnect(row: DeviceInfo) {
  try {
    await deviceApi.reconnect(row.deviceInfoId)
    message.success('重连指令已下发')
    refreshStatus(row)
  } catch (err) {
    message.error('重连失败：' + errorText(err))
  }
}

async function refreshStatus(row: DeviceInfo) {
  try {
    await deviceApi.refreshStatus(row.deviceInfoId)
    message.success('状态已刷新')
    fetchPage()
    fetchStats()
  } catch (err) {
    message.error('刷新状态失败：' + errorText(err))
  }
}

async function removeDevice(row: DeviceInfo) {
  try {
    await ElMessageBox.confirm(
      `确认删除设备「${row.deviceInfoName}」？删除后将断开连接，且不可恢复。`,
      '删除设备',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  try {
    await deviceApi.remove(row.deviceInfoId)
    message.success('设备已删除')
    refreshAll()
  } catch (err) {
    message.error('删除失败：' + errorText(err))
  }
}

async function batchReconnect() {
  const targets = [...selection.value]
  if (!targets.length) return
  const results = await Promise.allSettled(targets.map((row) => deviceApi.reconnect(row.deviceInfoId)))
  const ok = results.filter((item) => item.status === 'fulfilled').length
  message.success(`已下发 ${ok} 台设备的重连指令`)
  refreshAll()
}

async function batchRemove() {
  const targets = [...selection.value]
  if (!targets.length) return
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${targets.length} 台设备？该操作不可恢复。`,
      '批量删除',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  const results = await Promise.allSettled(targets.map((row) => deviceApi.remove(row.deviceInfoId)))
  const ok = results.filter((item) => item.status === 'fulfilled').length
  message.success(`已删除 ${ok} 台设备`)
  refreshAll()
}

async function previewStream(device: DeviceInfo, streamType: 'main' | 'sub') {
  const channel = device.channels?.[0]?.deviceChannelNo ?? 1
  previewChannel.value = channel
  previewTitle.value = `${device.deviceInfoName} · ${streamType === 'main' ? '主码流' : '子码流'}`
  try {
    previewUrl.value = await deviceApi.getVideoStream(device.deviceInfoId, channel, 'hls', streamType)
    previewVisible.value = true
  } catch (err) {
    previewUrl.value = ''
    message.error('获取视频流失败：' + errorText(err))
  }
}

function onPreviewError(err: unknown) {
  message.error('视频播放失败：' + errorText(err))
}

async function syncOrg() {
  orgSyncing.value = true
  try {
    await deviceApi.syncOrg()
    message.success('组织同步完成')
    await fetchOrgTree()
  } catch (err) {
    message.error('组织同步失败：' + errorText(err))
  } finally {
    orgSyncing.value = false
  }
}

function goScreen() {
  router.push('/device/screen')
}

function goProvider() {
  router.push('/device/provider')
}

async function exportDevices() {
  try {
    const blob = await deviceApi.exportDevices(filters.orgId || undefined)
    const url = URL.createObjectURL(new Blob([blob as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }))
    const link = document.createElement('a')
    link.href = url
    link.download = `设备台账_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
    message.success('导出成功')
  } catch (err) {
    message.error('导出失败：' + errorText(err))
  }
}

function errorText(err: unknown): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    || (err as Error)?.message
    || '未知错误'
}

onMounted(async () => {
  await Promise.all([fetchVendors(), fetchOrgTree(), fetchGroups()])
  refreshAll()
})
</script>

<style scoped>
.device-page {
  background: var(--el-bg-color);
}

.stat-card {
  position: relative;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay);
  overflow: hidden;
}
.stat-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
}
.accent-blue::before { background: var(--el-color-primary); }
.accent-emerald::before { background: var(--el-color-success); }
.accent-orange::before { background: var(--el-color-warning); }
.accent-slate::before { background: var(--el-color-info); }

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
}
.filter-keyword { width: 260px; }
.filter-select { width: 140px; }
.filter-org { width: 180px; }

.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
  border-radius: 10px;
}

.device-table :deep(.el-table__cell) {
  vertical-align: middle;
}

@media (max-width: 1280px) {
  .filter-keyword { width: 200px; }
  .filter-org { width: 150px; }
}
</style>
