<template>
  <div class="da">
    <!-- ==================== 左：三分支树 + 设备列表右区 ==================== -->
    <div class="da-body">
      <!-- 左侧：设备分组（含「全部」） -->
      <aside class="da-rail" :class="{ 'is-collapsed': railCollapsed }">
        <!-- 折叠态：只留计数与展开按钮 -->
        <div v-if="railCollapsed" class="da-strip">
          <button type="button" class="da-strip__count" title="展开分组树" @click="toggleRail">
            <b>{{ filtered.length }}</b>
            <span>/{{ rows.length }}</span>
          </button>
          <span class="da-strip__dots">
            <i class="is-on" :title="`在线 ${onlineCount}`" />
            <i class="is-off" :title="`离线 ${offlineCount}`" />
          </span>
          <span class="da-strip__gap" />
          <button type="button" class="da-strip__toggle" title="展开分组树" @click="toggleRail">
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

        <!-- 左侧树：上方切换维度（组织 / 分组 / 厂家），下面只显示当前维度的树 -->
        <ReScrollbar v-show="!railCollapsed" class="da-tree">
          <div class="da-tree__ops">
            <button type="button" class="da-tree__op" title="新建分组" @click="openGroupCreate(null)">
              <ReIcon name="Plus" :size="12" />
            </button>
            <button type="button" class="da-tree__op" title="刷新" :disabled="loading" @click="fetchAll">
              <ReIcon :name="loading ? 'Loading' : 'RefreshRight'" :size="12" />
            </button>
          </div>

          <!-- 维度切换：一次只显示一个维度，避免三棵树同时摊开 -->
          <div class="da-tree__modes">
            <button
              v-for="mode in railModes"
              :key="mode.value"
              type="button"
              class="da-tree__mode"
              :class="{ 'is-active': railMode === mode.value }"
              @click="switchRail(mode.value)"
            >
              {{ mode.label }}
            </button>
          </div>

          <template v-for="row in treeNodes" :key="row.key">
            <!-- 组织 / 分组：有下一级时可展开；点行即筛选，点箭头只折叠 -->
            <el-dropdown
              v-if="row.kind === 'group'"
              class="da-tree__dd"
              placement="bottom-start"
              trigger="contextmenu"
              @command="(cmd: string) => onGroupCommand(cmd, row)"
            >
              <div
                class="da-tree__item"
                :class="{ 'is-active': filterState?.kind === 'group' && filterState?.id === row.id }"
                :style="{ paddingLeft: `${10 + row.depth * 14}px` }"
                @click="selectFilter({ kind: 'group', id: row.id })"
              >
                <span
                  v-if="row.hasChildren"
                  class="da-tree__caret"
                  :class="{ 'is-open': row.expanded }"
                  @click.stop="toggleNode(row.key)"
                >
                  <ReIcon name="ArrowRight" :size="10" />
                </span>
                <span v-else class="da-tree__caret is-leaf" />
                <span class="da-tree__dot is-group" />
                <span class="da-tree__name">{{ row.label }}</span>
                <span v-if="row.hint" class="da-tree__hint">{{ row.hint }}</span>
                <span class="da-tree__count">{{ row.count }}</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="topo" :icon="Grid">在拓扑中查看</el-dropdown-item>
                  <el-dropdown-item command="add" :icon="Plus">新增子分组</el-dropdown-item>
                  <el-dropdown-item command="assign" :icon="FolderOpened">分配设备</el-dropdown-item>
                  <el-dropdown-item command="clear" :icon="Delete">清空分组设备</el-dropdown-item>
                  <el-dropdown-item command="edit" :icon="EditPen">重命名</el-dropdown-item>
                  <el-dropdown-item command="delete" divided style="color: var(--el-color-danger)">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <!-- 厂家：可右键（查看拓扑） -->
            <el-dropdown
              v-else-if="row.kind === 'vendor'"
              class="da-tree__dd"
              placement="bottom-start"
              trigger="contextmenu"
              @command="(cmd: string) => onVendorCommand(cmd, row)"
            >
              <div
                class="da-tree__item"
                :class="{ 'is-active': filterState?.kind === 'vendor' && filterState?.id === row.id }"
                @click="selectFilter({ kind: 'vendor', id: row.id })"
              >
                <span class="da-tree__caret is-leaf" />
                <span class="da-tree__dot is-vendor" />
                <span class="da-tree__name">{{ row.label }}</span>
                <span class="da-tree__count">{{ row.count }}</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="topo" :icon="Grid">在拓扑中查看</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <!-- 组织：点击筛选本组织（含后代组织）下的设备 -->
            <div
              v-else-if="row.kind === 'org'"
              class="da-tree__item"
              :class="{ 'is-active': filterState?.kind === 'org' && filterState?.id === row.id }"
              :style="{ paddingLeft: `${10 + row.depth * 14}px` }"
              @click="selectFilter({ kind: 'org', id: row.id })"
            >
              <span
                v-if="row.hasChildren"
                class="da-tree__caret"
                :class="{ 'is-open': row.expanded }"
                @click.stop="toggleNode(row.key)"
              >
                <ReIcon name="ArrowRight" :size="10" />
              </span>
              <span v-else class="da-tree__caret is-leaf" />
              <span class="da-tree__dot is-org" />
              <span class="da-tree__name">{{ row.label }}</span>
              <span class="da-tree__count">{{ row.count }}</span>
            </div>
          </template>

          <div v-if="!treeNodes.length" class="da-tree__empty">
            {{ railMode === 'vendor' ? '暂无厂家数据' : railMode === 'org' ? '暂无组织数据' : '暂无分组' }}
          </div>
        </ReScrollbar>

        <div v-show="!railCollapsed" class="da-rail__foot">
          <div class="da-rail__row">
            <span class="da-foot__sum">
              <i class="is-on" />{{ onlineCount }}
              <i class="is-off" />{{ offlineCount }}
            </span>
            <span class="da-foot__hint">{{ rows.length }} 台设备</span>
          </div>
          <button type="button" class="da-rail__fold" title="收起分组树" @click="toggleRail">
            <ReIcon name="ArrowLeft" :size="12" />
          </button>
        </div>
      </aside>

      <!-- 右侧：设备列表 + 底部信息条 -->
      <section class="da-work">
        <!-- 列表工具条：高度固定，未选中时显示台账概览，选中后切成批量操作（避免多选时列表回流跳动） -->
        <div class="da-batch" :class="{ 'is-batch': selection.length > 0 }">
          <template v-if="selection.length">
            <span class="da-batch__text">已选 <b>{{ selection.length }}</b> 台设备</span>
            <div class="da-batch__ops">
              <ReButton icon="VideoCamera" :show-text="true" size="small" type="primary" plain @click="openVideoWizard">视频预览</ReButton>
              <ReButton icon="Refresh" :show-text="true" size="small" @click="batchReconnect">批量重连</ReButton>
              <ReButton icon="FolderOpened" :show-text="true" size="small" @click="openBatchGroups">设置分组</ReButton>
              <ReButton icon="Delete" :show-text="true" size="small" type="danger" plain @click="batchRemove">批量删除</ReButton>
            </div>
          </template>
          <template v-else>
            <span class="da-batch__text">共 <b>{{ filtered.length }}</b> 台设备</span>
            <div class="da-batch__ops">
              <span class="da-batch__hint">勾选设备后可批量视频预览、重连、设置分组或删除</span>
            </div>
          </template>
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

            <template #col-group="{ row }">
              <div class="da-group-list">
                <ReTag v-for="g in deviceGroupLabels(row)" :key="g.groupId" type="primary" effect="plain" size="small" @click="selectGroup(g)">
                  {{ g.groupName }}
                </ReTag>
              </div>
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

    <!-- 新建 / 编辑分组：按组织添加，分组所有权归组织 -->
    <ReDialog v-model="groupCreateVisible" title="新建分组" width="480px">
      <el-form label-position="top" class="da-group-form">
        <el-form-item label="分组名称" required>
          <el-input v-model="groupForm.groupName" placeholder="例如 研发中心 / 一期机房" maxlength="64" />
        </el-form-item>
        <el-form-item :label="groupCreateKind === 'sub' ? '上级分组' : '上级组织'">
          <el-select v-model="groupForm.groupParent" :placeholder="groupCreateKind === 'sub' ? '选一个上级分组' : '按组织把分组挂上去（可选新分组）'" clearable class="w-full">
            <el-option v-for="option in parentOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
          <div class="da-group-form__hint">按组织添加：分组随组织归集，车间/大厦/楼层看组织的结构</div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="groupForm.groupRemark" type="textarea" :rows="2" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <ReButton @click="groupCreateVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="groupCreating" @click="saveGroup">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 分配设备到分组（全量替换分组下的设备） -->
    <ReDialog v-model="assignVisible" title="分配设备" width="800px">
      <div class="da-assign-tip">全量替换：操作会覆盖该分组下已有设备，请确认。</div>
      <div class="da-assign-list">
        <div
          v-for="d in assignDevices"
          :key="d.deviceInfoId"
          class="da-assign-cell"
          :class="{ 'is-assigned': pendingAssigned.has(d.deviceInfoId || '') }"
          @click="pendingToggle(d)"
        >
          <div class="da-assign-cell__head">
            <span class="da-assign-cell__name">{{ d.deviceInfoName }}</span>
            <el-icon class="da-assign-cell__check">
              <Check v-if="pendingAssigned.has(d.deviceInfoId || '')" /><Plus v-else />
            </el-icon>
          </div>
          <div class="da-assign-cell__meta">{{ vendorLabel(d.deviceInfoVendor) }} · {{ d.deviceInfoIp || '无 IP' }}</div>
        </div>
      </div>
      <template #footer>
        <ReButton @click="assignVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="assignSaving" @click="onAssignSave">确认分配 ({{ pendingAssigned.size }})</ReButton>
      </template>
    </ReDialog>

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

    <!-- 机房拓扑：从右键菜单（分组 / 厂家 / 设备）在抽屉中查看 -->
    <el-drawer v-model="topoVisible" title="机房拓扑" size="88%" destroy-on-close>
      <DeviceTopoView :filter="topoFilter" />
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
 * 左侧是设备分组（含「全部」），右侧是 ReTable 设备列表；
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
import { computed, defineAsyncComponent, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  Connection,
  Check,
  Delete,
  EditPen,
  FolderOpened,
  Grid,
  Plus,
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
import ReTag from '@repo/ui/re-tag'

import DeviceStatusPulse from '@pages/device/src/components/DeviceStatusPulse.vue'
import DeviceOwnerCell from '@pages/device/src/components/DeviceOwnerCell.vue'
import DeviceLocationCell from '@pages/device/src/components/DeviceLocationCell.vue'
import ReDeviceFormDialog from '@pages/device/src/components/ReDeviceFormDialog.vue'
import ReDeviceDetailDrawer from '@pages/device/src/components/ReDeviceDetailDrawer.vue'
import DeviceChannelView from '@pages/device/src/views/DeviceChannelView.vue'
import DeviceEventLogView from '@pages/device/src/views/DeviceEventLogView.vue'

/** 账台账拓扑页签按需加载：首屏不背着机房拓扑的代码 */
const DeviceTopoView = defineAsyncComponent(() => import('@pages/device/src/views/DeviceTopoView.vue'))

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

/* ==================== 左侧分组列 ==================== */
const railCollapsed = ref(false)
const keyword = ref('')
const onlineFilter = ref<'all' | 'online' | 'offline'>('all')

/* ==================== 左侧树：组织 / 分组 / 厂家 三维度切换 ==================== */
/** 厂家节点：从当前台账归并（显示名优先取厂商描述符） */
const vendorNodes = computed<Array<{ vendor: string; label: string; count: number }>>(() => {
  const map = new Map<string, { vendor: string; label: string; count: number }>()
  for (const device of rows.value) {
    const vendor = device.deviceInfoVendor || ''
    if (!vendor) continue
    const item = map.get(vendor) || { vendor, label: vendors.value.find((v) => v.vendor === vendor)?.name || vendor, count: 0 }
    item.count += 1
    map.set(vendor, item)
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
})

/** 当前维度：组织树 / 分组树 / 厂家列表，一次只显示一棵 */
type RailMode = 'org' | 'group' | 'vendor'
const railMode = ref<RailMode>('group')
const railModes: Array<{ value: RailMode; label: string }> = [
  { value: 'org', label: '组织' },
  { value: 'group', label: '分组' },
  { value: 'vendor', label: '厂家' }
]

/** 切维度时清掉不匹配的筛选，避免右侧列表还挂着上一维度的条件 */
function switchRail(mode: RailMode): void {
  railMode.value = mode
  const f = filterState.value
  if (f && f.kind !== mode) filterState.value = undefined
}

/** 树节点折叠态：按「维度 + 节点 id」记，默认展开 */
const collapsed = ref<Set<string>>(new Set())
function toggleNode(key: string): void {
  const next = new Set(collapsed.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  collapsed.value = next
}
function isCollapsed(key: string): boolean {
  return collapsed.value.has(key)
}

/** 左侧树筛选：一次只保留一组（组织 / 分组 / 厂家）；再点同一节点即取消 */
const filterState = ref<{ kind: RailMode; id: string } | undefined>(undefined)
function selectFilter(payload: { kind: RailMode; id: string } | null): void {
  if (!payload) {
    filterState.value = undefined
    return
  }
  const current = filterState.value
  filterState.value = current && current.kind === payload.kind && current.id === payload.id ? undefined : payload
}

/** 组织树平铺（带 depth），供父级选项与组织行用 */
const orgFlat = computed<Array<OrgNode & { depth: number }>>(() => {
  const out: Array<OrgNode & { depth: number }> = []
  const walk = (nodes: OrgNode[], depth: number) => {
    if (!Array.isArray(nodes)) return
    for (const node of nodes) {
      out.push({ ...node, depth })
      if (node.children?.length) walk(node.children, depth + 1)
    }
  }
  walk(orgTree.value, 0)
  return out
})

/** 上级选项：新增分组 = 组织树（分组归属组织），新增子分组/重命名 = 分组树 */
const parentOptions = computed<Array<{ value: string; label: string }>>(() => {
  if (groupCreateKind.value === 'sub') {
    return flatGroups.value.map((node) => ({
      value: node.groupId,
      label: `${'　'.repeat(node.depth)}${node.groupName}`
    }))
  }
  return orgFlat.value.map((node) => ({
    value: node.deviceOrganizationId,
    label: `${'　'.repeat(node.depth)}${node.deviceOrganizationName}`
  }))
})

/** 组织（含其下的子孙组织）关联的设备数 */
const orgDeviceCount = (orgId: string): number => {
  const ids = orgDescendants(orgId)
  return rows.value.filter((d) => ids.has(d.deviceInfoOrgId || '')).length
}

/** 组织 id 集合：含后代（设备 id 不在组织树时，回退为自身） */
const orgDescendants = (orgId: string): Set<string> => {
  const ids = new Set<string>([orgId])
  const walk = (nodes?: OrgNode[]) => {
    if (!nodes) return
    for (const node of nodes) {
      ids.add(node.deviceOrganizationId)
      walk(node.children)
    }
  }
  const node = orgFlat.value.find((n) => n.deviceOrganizationId === orgId)
  walk(node?.children)
  return ids
}

/** 子树是否应展开：折叠集合里没有它，且任一祖先都没被折叠 */
function subtreeOpen(ancestors: string[]): boolean {
  return !ancestors.some((key) => isCollapsed(key))
}

/**
 * 当前维度的树行（已按折叠态裁剪）。
 *
 * <p>组织与分组是真树：父节点折叠时其子孙整段不出现；厂家是平铺一行一个。</p>
 */
const treeNodes = computed<Array<TreeRow>>(() => {
  const out: Array<TreeRow> = []
  if (railMode.value === 'org') {
    const walk = (nodes: OrgNode[], depth: number, ancestors: string[]) => {
      for (const node of nodes) {
        const key = `org-${node.deviceOrganizationId}`
        const hasChildren = !!node.children?.length
        out.push({
          key,
          kind: 'org',
          label: node.deviceOrganizationName,
          depth,
          id: node.deviceOrganizationId,
          count: orgDeviceCount(node.deviceOrganizationId),
          hasChildren,
          expanded: hasChildren && subtreeOpen([key])
        })
        if (hasChildren && subtreeOpen([key])) walk(node.children!, depth + 1, [...ancestors, key])
      }
    }
    walk(orgTree.value, 0, [])
    return out
  }
  if (railMode.value === 'group') {
    const walk = (nodes: DeviceGroupNode[], depth: number) => {
      for (const node of nodes) {
        if (!node.groupId) continue
        const key = `group-${node.groupId}`
        const hasChildren = !!node.children?.length
        const parent = node.groupParent
        out.push({
          key,
          kind: 'group',
          label: node.groupName,
          depth,
          id: node.groupId,
          count: groupDeviceIds(node.groupId).size,
          remark: node.groupRemark,
          hint: parent && !isGroupId(parent) ? orgLabelOf(parent) : undefined,
          hasChildren,
          expanded: hasChildren && subtreeOpen([key])
        })
        if (hasChildren && subtreeOpen([key])) walk(node.children!, depth + 1)
      }
    }
    walk(groups.value, 0)
    return out
  }
  for (const node of vendorNodes.value) {
    out.push({
      key: `vendor-${node.vendor}`,
      kind: 'vendor',
      label: node.label,
      depth: 0,
      id: node.vendor,
      count: node.count,
      hasChildren: false,
      expanded: false
    })
  }
  return out
})

/** 组织名（分组行的提示用） */
function orgLabelOf(orgId: string): string | undefined {
  return orgFlat.value.find((node) => node.deviceOrganizationId === orgId)?.deviceOrganizationName
}

/** 该 id 是分组而不是组织？（分组树的上级既可能是分组，也可能是组织） */
function isGroupId(id?: string): boolean {
  return !!id && flatGroups.value.some((node) => node.groupId === id)
}

/** 分组的直接上级：可能是上级分组，也可能是所属组织（分组树根节点的 groupParent 指向组织） */
function groupParentIdOf(groupId: string): string | undefined {
  return flatGroups.value.find((node) => node.groupId === groupId)?.groupParent || undefined
}

/** 拓扑抽屉：从右键菜单投递的视图限制（按分组 / 厂商 / 设备） */
const topoVisible = ref(false)
const topoFilter = ref<{ kind: 'group' | 'vendor' | 'device'; id: string; label?: string } | null>(null)

/** 在拓扑中查看（按分组/厂商/设备给拓扑加上视图限制） */
function openTopology(groupId?: string, vendor?: string, deviceId?: string): void {
  const kind = groupId ? ('group' as const) : vendor ? ('vendor' as const) : ('device' as const)
  const id = groupId ?? vendor ?? deviceId
  if (!id) return
  const label =
    kind === 'group' ? flatGroups.value.find((g) => g.groupId === id)?.groupName
      : kind === 'vendor' ? vendorNodes.value.find((v) => v.vendor === id)?.label
        : rows.value.find((d) => d.deviceInfoId === id)?.deviceInfoName
  topoFilter.value = { kind, id, label: label || id }
  topoVisible.value = true
}

const statusFilters = computed(() => {
  const list = filtered.value
  const online = list.filter((item) => item.deviceInfoOnline).length
  return [
    { label: '全部', value: 'all' as const, count: list.length },
    { label: '在线', value: 'online' as const, count: online },
    { label: '离线', value: 'offline' as const, count: list.length - online }
  ]
})

/** 底部信息条跟随的设备：最近点选 / 右键的行优先，其次唯一勾选的那台 */
const statusDevice = computed<DeviceInfo | null>(
  () => activeDevice.value ?? (selection.value.length === 1 ? selection.value[0] : null)
)

const onlineCount = computed(() => rows.value.filter((item) => item.deviceInfoOnline).length)
const offlineCount = computed(() => rows.value.length - onlineCount.value)
const locatedCount = computed(() => rows.value.filter((item) => hasLocation(item)).length)

const filtered = computed<DeviceInfo[]>(() => {
  let list = rows.value
  const f = filterState.value
  if (f) {
    if (f.kind === 'org') {
      const ids = orgDescendants(f.id)
      list = list.filter((d) => ids.has(d.deviceInfoOrgId || ''))
    } else if (f.kind === 'group') {
      const ids = groupDeviceIds(f.id)
      list = list.filter((d) => ids.has(d.deviceInfoId || ''))
    } else if (f.kind === 'vendor') {
      list = list.filter((d) => (d.deviceInfoVendor || '') === f.id)
    }
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
  { prop: 'deviceInfoOwnerName', label: '负责人', slot: 'owner', minWidth: 130 },
  { prop: 'deviceInfoGroup', label: '分组', slot: 'group', width: 200 }
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

/** 行右键菜单：详情 / 编辑 / 通道管理 / 设备日志 / 拓扑 / 重连 / 刷新状态 / 分组 / 预览 / 删除 */
const tableMenu: ReTableContextMenuItem[] = [
  { key: 'detail', label: '设备详情', icon: Position },
  { key: 'edit', label: '编辑设备', icon: EditPen },
  { key: 'topo', label: '在拓扑中查看', icon: Grid, divided: true },
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
    case 'topo':
      openTopology(undefined, undefined, d.deviceInfoId)
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
    /** 接口可能回传非数组（对象/字符串/空值），安全展开；空值走兜底 */
    if (!Array.isArray(nodes)) return
    for (const node of nodes) {
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

/** 分组：展开到最深层的节点（带深度），用于左侧树与「新增子分组」的上级选择 */
const flatGroups = computed<Array<DeviceGroupNode & { depth: number }>>(() => {
  const out: Array<DeviceGroupNode & { depth: number }> = []
  const walk = (nodes: DeviceGroupNode[], depth: number) => {
    /** 接口可能回传非数组（对象/字符串/空值），安全展开 */
    if (!Array.isArray(nodes)) return
    for (const n of nodes) {
      if (!n.groupId) continue
      out.push({ ...n, depth })
      if (n.children?.length) walk(n.children, depth + 1)
    }
  }
  walk(groups.value, 0)
  return out
})

/** 左侧树的显示行：组织 / 分组 / 厂家 三个维度之一，一次只渲染一棵树 */
type TreeRow = {
  /** 行键（同时用作折叠态键） */
  key: string
  /** 行类别：组织 / 分组 / 厂家 */
  kind: RailMode
  /** 显示名 */
  label: string
  /** 缩进深度 */
  depth: number
  /** 筛选值 */
  id: string
  /** 计数（本节点及其子树的设备数） */
  count: number
  /** 分组备注 */
  remark?: string
  /** 节点附加说明（分组显示所属组织） */
  hint?: string
  /** 是否有下一级（决定是否显示展开箭头） */
  hasChildren: boolean
  /** 当前是否展开 */
  expanded: boolean
}

/** 分组筛选：点击左侧节点 → 右侧按组筛选设备（点击左侧树/列内标签） */
function selectGroup(node: DeviceGroupNode | null): void {
  filterState.value = node ? { kind: 'group', id: node.groupId } : undefined
}

/** 分组下设备的 id 集合（含子分组的设备，即当前视图的组数据源） */
function groupDeviceIds(groupId: string): Set<string> {
  const groupIds = groupSubtreeIds(groupId)
  return new Set(
    assignments.value
      .filter((item) => groupIds.has(item.groupId))
      .map((item) => item.deviceId)
  )
}

/** 分组自身 + 全部子孙分组的 id 集合 */
function groupSubtreeIds(groupId: string): Set<string> {
  const ids = new Set<string>([groupId])
  const walk = (nodes: DeviceGroupNode[]): void => {
    for (const node of nodes) {
      if (ids.has(node.groupId)) {
        for (const child of node.children || []) {
          if (!ids.has(child.groupId)) {
            ids.add(child.groupId)
            walk([child])
          }
        }
      } else if (node.children?.length) {
        walk(node.children)
      }
    }
  }
  walk(groups.value)
  return ids
}

/** 某台设备所处的分组标签列表（可点，点它即筛选该组设备） */
function deviceGroupLabels(row: DeviceInfo): DeviceGroupNode[] {
  const ids = assignments.value
    .filter((item) => item.deviceId === row.deviceInfoId)
    .map((item) => item.groupId)
  return flatGroups.value.filter((node) => ids.includes(node.groupId))
}

/** 分组节点右键菜单 */
function onGroupCommand(cmd: string, row: TreeRow): void {
  if (row.kind !== 'group' || !row.id) return
  switch (cmd) {
    case 'topo': openTopology(row.id); break
    case 'add': openGroupCreate(row.id); break
    case 'assign': openDeviceAssign(row); break
    case 'clear': clearGroup(row); break
    case 'edit': openGroupEdit(row); break
    case 'delete': removeGroup(row); break
  }
}

/** 厂家节点右键菜单 */
function onVendorCommand(cmd: string, node: TreeRow): void {
  if (cmd === 'topo') openTopology(undefined, node.id)
}

/** 创建/编辑分组 */
const groupCreateKind = ref<'root' | 'sub'>('root')
const editingGroupId = ref('')
const groupCreateVisible = ref(false)
const groupCreating = ref(false)
const groupForm = reactive({ groupName: '', groupParent: '', groupRemark: '' })

function openGroupCreate(parentId?: string | null): void {
  editingGroupId.value = ''
  groupForm.groupName = ''
  groupForm.groupParent = parentId || ''
  groupForm.groupRemark = ''
  groupCreateKind.value = parentId ? 'sub' : 'root'
  groupCreateVisible.value = true
}

/** 编辑分组（重命名） */
function openGroupEdit(row: TreeRow): void {
  editingGroupId.value = row.id!
  groupForm.groupName = row.label
  const parent = groupParentIdOf(row.id!)
  groupForm.groupParent = parent || ''
  groupForm.groupRemark = row.remark || ''
  /** 上级是分组时按分组选，否则按组织选 */
  groupCreateKind.value = isGroupId(parent) ? 'sub' : 'root'
  groupCreateVisible.value = true
}

/** 分配设备到分组（按分组全量替换） */
const assignVisible = ref(false)
const assignSaving = ref(false)
const assignGroupId = ref('')
const assignDevices = ref<DeviceInfo[]>([])
const pendingAssigned = ref<Set<string>>(new Set())

async function openDeviceAssign(row: TreeRow): Promise<void> {
  if (!row.id) return
  assignGroupId.value = row.id
  try {
    assignDevices.value = (await deviceApi.list()) as DeviceInfo[]
    // 分配弹窗只回显该分组的直属设备（子分组的归属不在这里改）
    pendingAssigned.value = new Set(
      assignments.value.filter((item) => item.groupId === row.id).map((item) => item.deviceId)
    )
  } catch {
    assignDevices.value = []
    pendingAssigned.value = new Set()
  }
  assignVisible.value = true
}

function pendingToggle(d: DeviceInfo): void {
  const id = d.deviceInfoId || ''
  if (pendingAssigned.value.has(id)) pendingAssigned.value.delete(id)
  else pendingAssigned.value.add(id)
}

async function onAssignSave(): Promise<void> {
  if (!assignGroupId.value) return
  assignSaving.value = true
  try {
    await deviceApi.assignGroupDevices(assignGroupId.value, [...pendingAssigned.value])
    message.success('分配成功')
    assignVisible.value = false
    await fetchGroups()
    refreshAll()
  } catch (err) {
    message.error('分配失败：' + errorText(err))
  } finally {
    assignSaving.value = false
  }
}

/** 清空分组下的设备 */
async function clearGroup(row: TreeRow): Promise<void> {
  if (!row.id) return
  try {
    await ElMessageBox.confirm(`清空分组「${row.label}」下的全部设备？`, '确认', { type: 'warning' })
  } catch { return }
  try {
    // 只清空该分组的直属设备，子分组的归属保持不变
    await deviceApi.assignGroupDevices(row.id, [])
    message.success('已清空')
    if (filterState.value?.kind === 'group' && filterState.value.id === row.id) filterState.value = undefined
    await fetchGroups()
  } catch (err) {
    message.error('操作失败：' + errorText(err))
  }
}

/** 删除分组（子孙分组一并删除，设备本身不动） */
async function removeGroup(row: TreeRow): Promise<void> {
  if (!row.id) return
  try {
    await ElMessageBox.confirm(`删除分组「${row.label}」？分组内设备将移出。`, '确认', { type: 'warning' })
  } catch { return }
  try {
    await deviceApi.deleteGroup(row.id)
    message.success('分组已删除')
    if (filterState.value?.kind === 'group' && filterState.value.id === row.id) filterState.value = undefined
    await fetchGroups()
  } catch (err) {
    message.error('删除失败：' + errorText(err))
  }
}

async function saveGroup() {
  if (!groupForm.groupName.trim()) {
    message.warning('请填写分组名称')
    return
  }
  groupCreating.value = true
  try {
    const body = { groupName: groupForm.groupName.trim(), groupParent: groupForm.groupParent || undefined, groupRemark: groupForm.groupRemark || undefined }
    if (editingGroupId.value) {
      await deviceApi.updateGroup(editingGroupId.value, body)
      message.success('分组已更新')
    } else {
      await deviceApi.createGroup(body)
      message.success('分组已创建')
    }
    groupCreateVisible.value = false
    await fetchGroups()
  } catch (err) {
    message.error('操作失败：' + errorText(err))
  } finally {
    groupCreating.value = false
  }
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
    const blob = await deviceApi.exportDevices()
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

/* ============ 台账主体：左树 + 右列表 ============ */
.da-body {
  display: flex;
  flex: 1 1 auto;
  gap: 12px;
  min-height: 0;
}

/* ============ 左侧：分组树 ============ */
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

/* 左侧树：三个顶级分支（组织 / 分组 / 厂家） */
/* el-dropdown 默认 inline-block，在树里必须独占一行，否则同级分组会并排挤成多个列 */
.da-tree__dd { display: block; }
.da-tree__branch {
  gap: 4px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.da-tree__branch:hover { background: transparent; }
.da-tree__branch .da-tree__count { background: transparent; }
.da-tree__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  flex: none;
  color: var(--el-text-color-placeholder);
  transform: rotate(0deg);
  transition: transform 0.16s ease;
}
.da-tree__branch.is-expanded .da-tree__toggle { transform: rotate(90deg); }
.da-tree__dot.is-org { background: var(--el-color-primary-light-3); }
.da-tree__dot.is-group { background: var(--el-color-success); }
.da-tree__dot.is-vendor { background: var(--el-color-warning); }
.da-tree__item--root { margin-bottom: 2px; }
.da-tree__empty {
  padding: 12px 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
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

.da-tree__item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  background: transparent;
  cursor: pointer;
}
.da-tree__item:hover { background: var(--el-fill-color-light, var(--el-color-primary-light-9)); }
.da-tree__item.is-active { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.da-tree__item:active { background: var(--el-color-primary-light-8); }
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
/* 分组行的所属组织：很淡，放名字右边，挤不下就先省略 */
.da-tree__hint {
  flex: 0 1 auto;
  max-width: 96px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
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

/* 列表工具条：高度固定，未选中时是台账概览，选中后变成批量操作条
   —— 两种状态同高，多选时列表不会回流跳动 */
.da-batch {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  height: 46px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank, var(--el-bg-color));
  border-radius: 10px;
  transition: background 0.16s ease, border-color 0.16s ease;
}
.da-batch.is-batch {
  border-color: var(--el-color-primary-light-7);
  background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
}
.da-batch__text { font-size: 13px; color: var(--el-text-color-primary); }
.da-batch__text b { font-family: var(--el-font-family-mono, monospace); }
.da-batch__hint { font-size: 12px; color: var(--el-text-color-secondary); }
.da-batch__ops { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

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