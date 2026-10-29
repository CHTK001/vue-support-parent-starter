<template>
  <div class="da">
    <!-- ==================== 左：组织树 + 设备列表右区 ==================== -->
    <div class="da-body">
      <!-- 左侧：设备组织树（含「全部」） -->
      <aside class="da-rail" :class="{ 'is-collapsed': railCollapsed }">
        <!-- 折叠态：只留计数与展开按钮 -->
        <div v-if="railCollapsed" class="da-strip">
          <button type="button" class="da-strip__count" title="展开组织树" @click="toggleRail">
            <b>{{ filtered.length }}</b>
            <span>/{{ rows.length }}</span>
          </button>
          <span class="da-strip__dots">
            <i class="is-on" :title="`在线 ${onlineCount}`" />
            <i class="is-off" :title="`离线 ${offlineCount}`" />
          </span>
          <span class="da-strip__gap" />
          <button type="button" class="da-strip__toggle" title="展开组织树" @click="toggleRail">
            <ReIcon name="ArrowRight" :size="13" />
          </button>
        </div>

        <div v-show="!railCollapsed" class="da-rail__head">
          <div class="da-rail__row">
            <span class="da-rail__title">设备资产</span>
            <span class="da-rail__count">{{ filtered.length }}<i>/{{ rows.length }}</i></span>
            <span class="da-rail__gap" />
            <button type="button" class="da-tool" title="刷新" :disabled="loading" @click="fetchAll">
              <ReIcon name="RefreshRight" :size="12" />
            </button>
            <button type="button" class="da-tool" title="设备大屏" @click="goScreen">
              <ReIcon name="DataBoard" :size="12" />
            </button>
            <button type="button" class="da-tool" title="厂商接入" @click="goProvider">
              <ReIcon name="Connection" :size="12" />
            </button>
            <button type="button" class="da-tool" title="导出台账" :disabled="!rows.length" @click="exportDevices">
              <ReIcon name="Download" :size="12" />
            </button>
            <button type="button" class="da-tool is-primary" title="新增设备" @click="openCreate">
              <ReIcon name="Plus" :size="12" />
            </button>
          </div>
          <ReInput v-model="keyword" placeholder="搜索名称 / 编码 / IP" clearable class="da-search" />
          <div class="da-filters">
            <button
              v-for="f in statusFilters"
              :key="f.value"
              type="button"
              class="da-chip"
              :class="{ 'is-active': onlineFilter === f.value }"
              @click="onlineFilter = f.value"
            >
              <span>{{ f.label }}</span>
              <b>{{ f.count }}</b>
            </button>
          </div>
        </div>

        <!-- 组织树 -->
        <ReScrollbar v-show="!railCollapsed" class="da-tree">
          <div class="da-tree__ops">
            <button type="button" class="da-tree__op" :class="{ 'is-on': orgExpandedAll }" title="全部展开 / 收起" @click="toggleOrgExpand">
              <ReIcon name="Sort" :size="11" />
            </button>
            <button type="button" class="da-tree__op" title="同步组织" :disabled="orgSyncing" @click="syncOrg">
              <ReIcon :name="orgSyncing ? 'Loading' : 'RefreshRight'" :size="11" />
            </button>
          </div>
          <el-tree
            ref="treeRef"
            :key="`org-tree-${orgExpandedAll}`"
            :data="orgOptions"
            node-key="deviceOrganizationId"
            :props="{ label: 'deviceOrganizationName', children: 'children' }"
            :default-expand-all="orgExpandedAll"
            :current-node-key="orgCurrentKey"
            :expand-on-click-node="false"
            highlight-current
            class="da-tree__el"
            @node-click="onOrgSelect"
          >
            <template #default="{ data }">
              <span class="da-tree__node">
                <span class="da-tree__dot" :class="{ 'is-all': data.deviceOrganizationId === ALL_ORG_ID }" />
                <span class="da-tree__name">{{ data.deviceOrganizationName }}</span>
                <span class="da-tree__count">{{ data.deviceCount }}</span>
              </span>
            </template>
          </el-tree>
        </ReScrollbar>

        <div v-show="!railCollapsed" class="da-rail__foot">
          <div class="da-rail__row">
            <span class="da-foot__sum">
              <i class="is-on" />{{ onlineCount }}
              <i class="is-off" />{{ offlineCount }}
            </span>
            <span class="da-foot__hint">{{ rows.length }} 台设备</span>
          </div>
          <button type="button" class="da-rail__fold" title="收起组织树" @click="toggleRail">
            <ReIcon name="ArrowLeft" :size="12" />
          </button>
        </div>
      </aside>

      <!-- 右侧：设备列表 + 底部信息条 -->
      <section class="da-work">
        <!-- 批量操作：仅多选时显示 -->
        <div v-if="selection.length" class="da-batch">
          <span class="da-batch__text">已选 {{ selection.length }} 台设备</span>
          <div class="da-batch__ops">
            <ReButton icon="VideoCamera" :show-text="true" size="small" type="primary" plain @click="openVideoWizard">视频预览</ReButton>
            <ReButton icon="Refresh" :show-text="true" size="small" @click="batchReconnect">批量重连</ReButton>
            <ReButton icon="FolderOpened" :show-text="true" size="small" @click="openBatchGroups">设置分组</ReButton>
            <ReButton icon="Delete" :show-text="true" size="small" type="danger" plain @click="batchRemove">批量删除</ReButton>
          </div>
        </div>

        <div class="da-table-wrap">
          <ReTable
            class="da-table"
            table-id="device-assets"
            :data="tableRows"
            :columns="columns"
            :loading="loading"
            :pagination="false"
            :toolbar="false"
            row-key="deviceInfoId"
            :layout-table="{ fill: true }"
            :context-menu="tableMenu"
            show-selection
            stripe
            @row-click="onRowClick"
            @cell-click="onCellClick"
            @selection-change="onSelectionChange"
            @context-menu-select="onTableMenuSelect"
          >
            <template #col-device="{ row }">
              <div class="da-dev">
                <div class="da-dev__top">
                  <span class="da-dev__name" :title="row.deviceInfoName">{{ row.deviceInfoName }}</span>
                  <el-tag :type="statusMeta(row.deviceInfoStatus).type" size="small" effect="plain">
                    {{ statusMeta(row.deviceInfoStatus).label }}
                  </el-tag>
                  <el-tag v-if="row.deviceInfoSource === 'vendor'" size="small" effect="plain" type="info">同步</el-tag>
                </div>
                <div class="da-dev__code mono">{{ row.deviceInfoCode || '未编码' }}</div>
              </div>
            </template>
            <template #col-vendor="{ row }">
              <div class="da-vendor__name">{{ vendorLabel(row.deviceInfoVendor) }}</div>
              <div class="da-vendor__model">{{ row.deviceInfoModel || '—' }}</div>
            </template>
            <template #col-ip="{ row }">
              <span v-if="row.deviceInfoIp" class="da-ip mono">
                <ReIcon name="Monitor" :size="12" />
                {{ row.deviceInfoIp }}:{{ row.deviceInfoPort ?? '' }}
              </span>
              <span v-else class="da-muted">平台接入</span>
            </template>
            <template #col-status="{ row }">
              <div class="da-status">
                <DeviceStatusPulse :online="row.deviceInfoOnline" />
                <div class="da-status__hint">{{ row.deviceInfoOnline ? '心跳正常' : lastOnlineText(row) }}</div>
              </div>
            </template>
            <template #col-location="{ row }">
              <DeviceLocationCell :device="asDevice(row)" />
            </template>
            <template #col-owner="{ row }">
              <DeviceOwnerCell :device="asDevice(row)" />
            </template>
            <template #empty>
              <div class="da-empty">
                <ReIcon name="Files" :size="26" />
                <span>暂无设备，可点左上角「+」新增，或前往「厂商接入」同步。</span>
              </div>
            </template>
          </ReTable>
        </div>

        <!-- 底部信息条：选中设备的 IP / 在线 / 经纬度 等基础信息 -->
        <footer class="da-bar">
          <template v-if="statusDevice">
            <div class="da-bar__id">
              <span class="da-bar__name" :title="statusDevice.deviceInfoName">{{ statusDevice.deviceInfoName }}</span>
              <el-tag size="small" effect="plain" :type="statusDevice.deviceInfoOnline ? 'success' : 'info'">
                {{ statusDevice.deviceInfoOnline ? '在线' : '离线' }}
              </el-tag>
            </div>
            <div class="da-bar__item mono">
              <ReIcon name="Monitor" :size="12" />
              <span>{{ statusDevice.deviceInfoIp ? `${statusDevice.deviceInfoIp}:${statusDevice.deviceInfoPort ?? ''}` : '平台接入' }}</span>
            </div>
            <div class="da-bar__item" :title="hasLocation(statusDevice) ? formatCoord(statusDevice.deviceInfoLatitude, statusDevice.deviceInfoLongitude) : '未配置经纬度'">
              <ReIcon name="LocationInformation" :size="12" />
              <span>{{ hasLocation(statusDevice) ? formatCoord(statusDevice.deviceInfoLatitude, statusDevice.deviceInfoLongitude) : '未定位' }}</span>
            </div>
            <div class="da-bar__item">
              <ReIcon name="Shop" :size="12" />
              <span>{{ vendorLabel(statusDevice.deviceInfoVendor) }} / {{ statusDevice.deviceInfoModel || '—' }}</span>
            </div>
            <div class="da-bar__item">
              <ReIcon name="Grid" :size="12" />
              <span>{{ getCategoryLabel(statusDevice.deviceInfoCategory) }}</span>
            </div>
            <div class="da-bar__item" v-if="statusDevice.deviceInfoOwnerName">
              <ReIcon name="User" :size="12" />
              <span>{{ statusDevice.deviceInfoOwnerName }}</span>
            </div>
            <div class="da-bar__gap" />
            <ReButton icon="Position" :show-text="true" size="small" @click="openDetail(statusDevice)">详情</ReButton>
          </template>
          <template v-else>
            <div class="da-bar__id">
              <span class="da-bar__name">设备资产</span>
            </div>
            <div class="da-bar__item">共 <b>{{ filtered.length }}</b> 台</div>
            <div class="da-bar__item"><ReIcon name="Position" :size="12" />在线 {{ onlineCount }}</div>
            <div class="da-bar__item"><ReIcon name="LocationInformation" :size="12" />已定位 {{ locatedCount }}</div>
            <div class="da-bar__gap" />
            <span class="da-bar__hint">点选设备查看基础信息，右键打开功能菜单</span>
          </template>
        </footer>
      </section>
    </div>

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

    <!-- 通道管理（从设备右键打开，嵌入式） -->
    <el-drawer v-model="channelsVisible" title="通道管理" size="68%" destroy-on-close>
      <DeviceChannelView :device-id="drawerDeviceId" />
    </el-drawer>

    <!-- 设备日志（从设备右键打开，嵌入式） -->
    <el-drawer v-model="eventsVisible" title="设备日志" size="68%" destroy-on-close>
      <DeviceEventLogView :device-id="drawerDeviceId" />
    </el-drawer>

    <!-- 视频预览向导 -->
    <ReDialog v-model="videoWizardVisible" title="视频预览" width="480px" destroy-on-close>
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
    </ReDialog>

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
/**
 * 设备资产（Deck 布局，对齐主机资产）
 *
 * 左侧是设备组织树（含「全部」根节点），右侧是 ReTable 设备列表；
 * 底部常驻条显示选中设备的 IP / 在线 / 经纬度 / 厂商 / 分类 / 负责人等基础信息。
 *
 * 交互约定：单击设备行只选中（底部条跟随），双击打开详情，
 * <b>全部功能入口统一收敛到设备行右键菜单</b>：详情 / 编辑 / 通道管理 / 设备日志 /
 * 重连 / 刷新状态 / 设置分组 / 视频预览 / 删除。
 * 通道管理与设备日志不再是独立菜单页，作为右键菜单项以抽屉方式嵌入。
 *
 * 列表不挂自动刷新：状态以手动刷新（左栏刷新按钮 / 右键「刷新状态」）为准。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  Connection,
  Delete,
  EditPen,
  FolderOpened,
  Position,
  Refresh,
  RefreshRight,
  Tickets,
  VideoCamera
} from '@element-plus/icons-vue'
import { message } from '@repo/core'
import ReDialog from '@repo/ui/re-dialog'
import ReIcon from '@repo/ui/re-icon'
import ReInput from '@repo/ui/re-input'
import ReScrollbar from '@repo/ui/re-scrollbar'
import ReButton from '@repo/ui/re-button'
import ReTable from '@repo/ui/re-table'
import type {
  ReTableCellClickPayload,
  ReTableColumn,
  ReTableContextMenuContext,
  ReTableContextMenuItem
} from '@repo/ui/re-table'

import DeviceStatusPulse from '@pages/device/src/components/DeviceStatusPulse.vue'
import DeviceOwnerCell from '@pages/device/src/components/DeviceOwnerCell.vue'
import DeviceLocationCell from '@pages/device/src/components/DeviceLocationCell.vue'
import ReDeviceFormDialog from '@pages/device/src/components/ReDeviceFormDialog.vue'
import ReDeviceDetailDrawer from '@pages/device/src/components/ReDeviceDetailDrawer.vue'
import DeviceChannelView from '@pages/device/src/views/DeviceChannelView.vue'
import DeviceEventLogView from '@pages/device/src/views/DeviceEventLogView.vue'

import { deviceApi } from '@pages/device/src/api/deviceApi'
import { getCategoryLabel } from '@pages/device/src/utils/deviceCategory'
import {
  buildOrgTree,
  formatCoord,
  formatRelative,
  hasLocation,
  statusMeta
} from '@pages/device/src/utils/deviceFormat'
import type {
  DeviceGroupNode,
  DeviceInfo,
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

/* ==================== 左侧组织树 ==================== */
const railCollapsed = ref(false)
const keyword = ref('')
const onlineFilter = ref<'all' | 'online' | 'offline'>('all')
const orgId = ref('')
/** 组织树「全部」节点的合成 key（真实组织 id 不会与它冲突） */
const ALL_ORG_ID = '__all__'
const orgExpandedAll = ref(true)
const orgSyncing = ref(false)
const treeRef = ref<{ setCurrentKey: (k?: string) => void } | null>(null)

/** 树当前高亮 key：orgId 为空即「全部」 */
const orgCurrentKey = computed(() => orgId.value || ALL_ORG_ID)

interface OrgTreeOption extends OrgNode {
  deviceCount: number
  children?: OrgTreeOption[]
}

const statusFilters = computed(() => [
  { label: '全部', value: 'all' as const, count: rows.value.length },
  { label: '在线', value: 'online' as const, count: onlineCount.value },
  { label: '离线', value: 'offline' as const, count: offlineCount.value }
])

/** 底部信息条跟随的设备：最近点选 / 右键的行优先，其次唯一勾选的那台 */
const statusDevice = computed<DeviceInfo | null>(
  () => activeDevice.value ?? (selection.value.length === 1 ? selection.value[0] : null)
)

const onlineCount = computed(() => rows.value.filter((item) => item.deviceInfoOnline).length)
const offlineCount = computed(() => rows.value.length - onlineCount.value)
const locatedCount = computed(() => rows.value.filter((item) => hasLocation(item)).length)

/** 组织树选项：最前插「全部」根节点，各组织节点带（含下级）设备数 */
const orgOptions = computed<OrgTreeOption[]>(() => {
  const direct = new Map<string, number>()
  rows.value.forEach((d) => {
    if (!d.deviceInfoOrgId) return
    direct.set(d.deviceInfoOrgId, (direct.get(d.deviceInfoOrgId) || 0) + 1)
  })
  const build = (nodes: OrgNode[]): OrgTreeOption[] =>
    (nodes || []).map((n) => {
      const kids = build(n.children || [])
      const own = direct.get(n.deviceOrganizationId) || 0
      const count = own + kids.reduce((s, k) => s + k.deviceCount, 0)
      return { ...n, deviceCount: count, children: kids }
    })
  return [
    { deviceOrganizationId: ALL_ORG_ID, deviceOrganizationName: '全部', deviceCount: rows.value.length, children: [] },
    ...build(orgTree.value)
  ]
})

/** 一个组织节点（含下级）的全部 orgId 集合 */
function subtreeOrgIds(id: string): Set<string> {
  const out = new Set<string>()
  const walk = (n: OrgTreeOption) => {
    out.add(n.deviceOrganizationId)
    ;(n.children || []).forEach(walk)
  }
  const find = (nodes: OrgTreeOption[]): boolean => {
    for (const n of nodes) {
      if (n.deviceOrganizationId === id) {
        walk(n)
        return true
      }
      if (find(n.children || [])) return true
    }
    return false
  }
  find(orgOptions.value)
  return out
}

const filtered = computed<DeviceInfo[]>(() => {
  let list = rows.value
  if (orgId.value) {
    const ids = subtreeOrgIds(orgId.value)
    list = list.filter((d) => d.deviceInfoOrgId && ids.has(d.deviceInfoOrgId))
  }
  if (onlineFilter.value === 'online') list = list.filter((d) => d.deviceInfoOnline)
  else if (onlineFilter.value === 'offline') list = list.filter((d) => !d.deviceInfoOnline)
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (d) =>
        `${d.deviceInfoName || ''} ${d.deviceInfoCode || ''} ${d.deviceInfoIp || ''} ${d.deviceInfoSerial || ''}`
          .toLowerCase()
          .includes(kw)
    )
  }
  return list
})

function onOrgSelect(data: OrgTreeOption): void {
  // 「全部」= 不按组织过滤
  orgId.value = data.deviceOrganizationId === ALL_ORG_ID ? '' : data.deviceOrganizationId || ''
}

function toggleOrgExpand(): void {
  orgExpandedAll.value = !orgExpandedAll.value
  nextTick(() => treeRef.value?.setCurrentKey(orgCurrentKey.value))
}

function toggleRail(): void {
  railCollapsed.value = !railCollapsed.value
}

/* ==================== 设备表（ReTable） ==================== */
/** 行数据：ReTable 只收 Record 数组，真实结构是 DeviceInfo */
const tableRows = computed<Array<Record<string, unknown>>>(
  () => filtered.value as unknown as Array<Record<string, unknown>>
)

const columns: ReTableColumn[] = [
  { prop: 'deviceInfoName', label: '设备', slot: 'device', minWidth: 240 },
  { prop: 'deviceInfoVendor', label: '厂商 / 型号', slot: 'vendor', minWidth: 150 },
  { prop: 'deviceInfoIp', label: 'IP : 端口', slot: 'ip', minWidth: 150 },
  { prop: 'deviceInfoOnline', label: '在线状态', slot: 'status', width: 140 },
  { prop: 'deviceInfoLatitude', label: '位置', slot: 'location', minWidth: 170 },
  { prop: 'deviceInfoOwnerName', label: '负责人', slot: 'owner', minWidth: 130 }
]

/** 插槽里的行数据回退成 DeviceInfo */
function asDevice(row: Record<string, unknown>): DeviceInfo {
  return row as unknown as DeviceInfo
}

/** 底部条跟随的行：点选 / 右键都算 */
const activeDevice = ref<DeviceInfo | null>(null)

/** 通道 / 日志抽屉当前设备 id（右键时落盘，抽屉独立于菜单状态） */
const drawerDeviceId = ref('')
const channelsVisible = ref(false)
const eventsVisible = ref(false)

/** 行右键菜单：详情 / 编辑 / 通道管理 / 设备日志 / 重连 / 刷新状态 / 分组 / 预览 / 删除 */
const tableMenu: ReTableContextMenuItem[] = [
  { key: 'detail', label: '设备详情', icon: Position },
  { key: 'edit', label: '编辑设备', icon: EditPen },
  { key: 'channels', label: '通道管理', icon: Connection, divided: true },
  { key: 'events', label: '设备日志', icon: Tickets },
  { key: 'reconnect', label: '重新连接', icon: RefreshRight, divided: true },
  { key: 'refresh', label: '刷新状态', icon: Refresh },
  { key: 'groups', label: '设置分组', icon: FolderOpened },
  { key: 'preview', label: '视频预览', icon: VideoCamera },
  { key: 'remove', label: '删除设备', icon: Delete, divided: true }
]

/** 右键菜单选中：ctx.row 就是被右键的设备 */
function onTableMenuSelect(item: ReTableContextMenuItem, ctx: ReTableContextMenuContext): void {
  const d = asDevice(ctx.row)
  activeDevice.value = d
  switch (item.key) {
    case 'detail':
      openDetail(d)
      break
    case 'edit':
      openEdit(d)
      break
    case 'channels':
      drawerDeviceId.value = d.deviceInfoId
      channelsVisible.value = true
      break
    case 'events':
      drawerDeviceId.value = d.deviceInfoId
      eventsVisible.value = true
      break
    case 'reconnect':
      reconnect(d)
      break
    case 'refresh':
      refreshStatus(d)
      break
    case 'groups':
      openDeviceGroups(d)
      break
    case 'preview':
      openPreviewWindow(d)
      break
    case 'remove':
      removeDevice(d)
      break
  }
}

function onRowClick(row: Record<string, unknown>): void {
  activeDevice.value = asDevice(row)
}

/** 双击（第二次 click 的 detail=2）打开详情 */
function onCellClick(payload: ReTableCellClickPayload): void {
  if (payload.event?.detail !== 2) return
  openDetail(asDevice(payload.row))
}

function onSelectionChange(value: Array<Record<string, unknown>>): void {
  selection.value = value.map(asDevice)
  // 只勾一台时，底部信息条跟着它走（勾选也算一次「点选」）
  if (value.length === 1) activeDevice.value = asDevice(value[0])
}

/**
 * 刷新后把选中态换成新列表里的同一台设备对象。
 *
 * <p>列表不挂自动刷新，状态只由手动刷新拉取；刷新回来的是**全新对象**，
 * 不重新对齐的话底部信息条会停在旧快照上（在线状态 / 经纬度不更新），
 * 设备已被删除时还会显示一台不存在的设备。</p>
 */
function syncPicked(list: DeviceInfo[]): void {
  const pick = (d: DeviceInfo | null): DeviceInfo | null =>
    d ? list.find((item) => item.deviceInfoId === d.deviceInfoId) ?? null : null
  activeDevice.value = pick(activeDevice.value)
  selection.value = selection.value
    .map((d) => pick(d))
    .filter((d): d is DeviceInfo => d !== null)
}

/** 单台预览：新窗口打开预览页（带设备 id、1×1 布局） */
function openPreviewWindow(device: DeviceInfo): void {
  if (!router.hasRoute('DevicePreview')) {
    message.warning('当前宿主未接入视频预览页')
    return
  }
  const target = router.resolve({
    name: 'DevicePreview',
    query: { ids: device.deviceInfoId, layout: '1', remind: 'true' }
  })
  window.open(target.href, '_blank', 'noopener')
}

/* ==================== 增删改 / 分组 ==================== */
const formVisible = ref(false)
const editingDevice = ref<DeviceInfo | null>(null)
const detailVisible = ref(false)
const currentDevice = ref<DeviceInfo | null>(null)

const groupDialogVisible = ref(false)
const groupDialogDeviceIds = ref<string[]>([])
const groupDialogChecked = ref<string[]>([])
const groupSaving = ref(false)

const groupDialogTitle = computed(() =>
  groupDialogDeviceIds.value.length > 1
    ? `设置分组（${groupDialogDeviceIds.value.length} 台设备）`
    : '设置分组'
)

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

function openCreate(): void {
  editingDevice.value = null
  formVisible.value = true
}

function openEdit(device: DeviceInfo): void {
  detailVisible.value = false
  editingDevice.value = device
  formVisible.value = true
}

function openDetail(device: DeviceInfo): void {
  currentDevice.value = device
  detailVisible.value = true
}

function onDeviceSaved(): void {
  formVisible.value = false
  editingDevice.value = null
  refreshAll()
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
    refreshAll()
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
    fetchAll()
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

/* ==================== 视频预览 ==================== */
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
  if (!router.hasRoute('DevicePreview')) {
    message.warning('当前宿主未接入视频预览页')
    return
  }
  const target = router.resolve({
    name: 'DevicePreview',
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

/* ==================== 数据 ==================== */
function vendorLabel(vendor?: string): string {
  if (!vendor) return '—'
  return vendors.value.find((item) => item.vendor === vendor)?.name || vendor
}

function lastOnlineText(row: DeviceInfo): string {
  if (!row.deviceInfoLastOnlineAt) return '从未上线'
  return `最后在线 ${formatRelative(row.deviceInfoLastOnlineAt)}`
}

/** 全量拉取设备（组织 / 在线 / 关键词均在前端过滤，无需分页） */
async function fetchAll() {
  loading.value = true
  try {
    const result = await deviceApi.page({ pageNo: 1, pageSize: 2000, sortBy: 'updatedAt', sortOrder: 'desc' })
    const list = (result as unknown as { data?: DeviceInfo[]; records?: DeviceInfo[] })?.data
      ?? (result as unknown as { records?: DeviceInfo[] })?.records
      ?? []
    rows.value = list
    syncPicked(list)
  } catch (err) {
    rows.value = []
    syncPicked([])
    message.error('加载设备列表失败：' + errorText(err))
  } finally {
    loading.value = false
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
    nextTick(() => treeRef.value?.setCurrentKey(orgCurrentKey.value))
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

function refreshAll() {
  fetchAll()
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
  if (!router.hasRoute('DeviceScreen')) {
    message.warning('当前宿主未接入设备大屏页')
    return
  }
  router.push({ name: 'DeviceScreen' })
}

/** 厂商接入 = 「提供商配置」菜单页（宿主路由名 DeviceProviders，独立包为 DeviceProvider） */
function goProvider() {
  if (router.hasRoute('DeviceProviders')) {
    router.push({ name: 'DeviceProviders' })
    return
  }
  if (router.hasRoute('DeviceProvider')) {
    router.push({ name: 'DeviceProvider' })
  }
}

async function exportDevices() {
  try {
    const blob = await deviceApi.exportDevices(orgId.value || undefined)
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
  fetchAll()
})
</script>

<style scoped>
.da {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

.da-body {
  display: flex;
  flex: 1 1 auto;
  gap: 12px;
  min-height: 0;
}

/* ============ 左侧：组织树 ============ */
.da-rail {
  display: flex;
  flex: none;
  flex-direction: column;
  width: 268px;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  transition: width 0.18s ease;
}
.da-rail.is-collapsed {
  width: 44px;
}

.da-strip {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px 0 10px;
}
.da-strip__count {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 2px 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--el-text-color-primary);
  font-family: var(--el-font-family-mono, monospace);
}
.da-strip__count b { font-size: 15px; line-height: 1; }
.da-strip__count span { font-size: 10px; opacity: 0.6; }
.da-strip__dots {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.da-strip__dots i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.da-strip__dots i.is-on { background: var(--el-color-success); }
.da-strip__dots i.is-off { background: var(--el-color-info); }
.da-strip__gap { flex: 1; }
.da-strip__toggle {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  padding: 4px;
}

.da-rail__head {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 10px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.da-rail__row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.da-rail__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}
.da-rail__count {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: var(--el-font-family-mono, monospace);
  margin-left: 4px;
}
.da-rail__count i { font-style: normal; opacity: 0.55; }
.da-rail__gap { flex: 1; }

.da-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: background 0.15s ease;
}
.da-tool:hover { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.da-tool.is-primary { background: var(--el-color-primary); color: var(--el-color-white); }
.da-tool.is-primary:hover { opacity: 0.9; }
.da-tool:disabled { opacity: 0.4; cursor: not-allowed; }

.da-search :deep(.re-input__inner) {
  height: 28px;
}

.da-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.da-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: var(--el-bg-color-overlay);
  font-size: 11px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}
.da-chip b { font-family: var(--el-font-family-mono, monospace); }
.da-chip.is-active {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.da-tree {
  flex: 1;
  min-height: 0;
  padding: 8px 6px;
}
.da-tree__ops {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  padding: 0 4px 6px;
}
.da-tree__op {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}
.da-tree__op:hover { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.da-tree__op.is-on { color: var(--el-color-primary); }
.da-tree__op:disabled { opacity: 0.4; cursor: not-allowed; }

.da-tree__el {
  background: transparent;
  --el-tree-node-content-height: 26px;
}
.da-tree__el :deep(.el-tree-node__content) {
  border-radius: 8px;
  margin: 1px 0;
}
.da-tree__node {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 13px;
}
.da-tree__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-info);
  flex: none;
}
.da-tree__dot.is-all {
  background: var(--el-color-primary);
}
.da-tree__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.da-tree__count {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: var(--el-font-family-mono, monospace);
  background: var(--el-fill-color-light, var(--el-color-primary-light-9));
  border-radius: 999px;
  padding: 0 6px;
}

.da-rail__foot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px 6px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.da-rail__row { flex: 1; min-width: 0; }
.da-foot__sum {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: var(--el-font-family-mono, monospace);
}
.da-foot__sum i {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.da-foot__sum i.is-on { background: var(--el-color-success); }
.da-foot__sum i.is-off { background: var(--el-color-info); }
.da-foot__hint { font-size: 11px; color: var(--el-text-color-secondary); }
.da-rail__fold {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  padding: 2px;
}
.da-rail__fold:hover { color: var(--el-color-primary); }

/* ============ 右侧：设备列表 + 底部信息条 ============ */
.da-work {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.da-batch {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  border-radius: 10px;
}
.da-batch__text { font-size: 13px; color: var(--el-text-color-primary); }
.da-batch__ops { display: flex; gap: 8px; flex-wrap: wrap; }

/* ReTable 自带卡片内边距与边框，这里只负责让它吃满剩余高度 */
.da-table-wrap {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.da-table-wrap > .da-table {
  flex: 1 1 0;
  min-height: 0;
}

.da-dev__top {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.da-dev__name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.da-dev__code {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.da-vendor__name { color: var(--el-text-color-regular); font-size: 12.5px; }
.da-vendor__model {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.da-status { line-height: 1.2; }
.da-status__hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.da-muted { font-size: 11px; color: var(--el-text-color-secondary); }
.da-ip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--el-text-color-regular);
  font-size: 12.5px;
}

.da-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.mono { font-family: var(--el-font-family-mono, monospace); }

/* ============ 底部信息条 ============ */
.da-bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 8px 14px;
  min-height: 40px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  font-size: 12.5px;
  color: var(--el-text-color-regular);
}
.da-bar__id {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.da-bar__name {
  font-weight: 600;
  color: var(--el-text-color-primary);
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.da-bar__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
}
.da-bar__item b { color: var(--el-text-color-primary); }
.da-bar__gap { flex: 1; }
.da-bar__hint { font-size: 12px; color: var(--el-text-color-secondary); }
</style>