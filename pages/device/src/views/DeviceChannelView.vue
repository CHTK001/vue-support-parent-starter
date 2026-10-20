<template>
  <div class="dcv">
    <!-- 概览指标 -->
    <section class="dcv-kpis">
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

    <!-- 筛选与操作 -->
    <section class="dcv-filter">
      <div class="dcv-field dcv-field--device">
        <ReSelect
          v-model="filters.deviceId"
          placeholder="选择设备（必选）"
          clearable
          filterable
          :options="deviceOptions"
          @change="fetchChannels"
        />
      </div>
      <el-segmented v-model="filters.status" :options="statusSegments" class="dcv-seg" />
      <div class="dcv-field dcv-field--search">
        <ReInput v-model="filters.keyword" placeholder="搜索通道名称 / 通道号" clearable prefix-icon="Search" />
      </div>
      <span class="dcv-filter__meta">{{ filteredChannels.length }} / {{ channels.length }} 个通道</span>
      <div class="dcv-ops">
        <ReButton icon="RefreshRight" layout="square" tip="重新拉取通道" :loading="loading" :disabled="!filters.deviceId" @click="fetchChannels" />
        <ReButton icon="Plus" :show-text="true" type="primary" :disabled="!filters.deviceId" @click="openCreate">
          新增通道
        </ReButton>
      </div>
    </section>

    <!-- 通道列表 -->
    <section class="dcv-panel dcv-panel--fill">
      <header class="dcv-panel__head">
        <span class="dcv-panel__bar" />
        <span>通道列表</span>
        <span class="dcv-panel__count">{{ filteredChannels.length }}</span>
        <span class="dcv-panel__hint">{{ currentDeviceName }}</span>
      </header>

      <div v-if="loadError" class="dcv-error">
        <span>{{ loadError }}</span>
        <ReButton icon="RefreshRight" layout="square" tip="重试" :loading="loading" @click="fetchChannels" />
      </div>

      <ReTable
        v-if="filteredChannels.length"
        :data="filteredChannels"
        :columns="columns"
        engine="element"
        table-id="device-channels"
        row-key="deviceChannelId"
        :pagination="true"
        :page-size="20"
        :page-sizes="[10, 20, 50, 100]"
        :toolbar="false"
        :layout-table="{ fill: 'auto' }"
        :settings="{ border: false }"
        style="width: 100%"
      >
        <template #col-deviceChannelNo="{ row }">
          <span class="dcv-mono">CH{{ row.deviceChannelNo }}</span>
        </template>
        <template #col-deviceChannelStatus="{ row }">
          <ReTag :type="row.deviceChannelStatus === 'enabled' ? 'success' : 'info'" size="small" effect="plain">
            {{ row.deviceChannelStatus === 'enabled' ? '启用' : '禁用' }}
          </ReTag>
        </template>
        <template #col-actions="{ row }">
          <div class="dcv-acts">
            <ReButton icon="Edit" layout="square" tip="编辑通道" @click="openEdit(row)" />
            <ReButton
              :icon="row.deviceChannelStatus === 'enabled' ? 'VideoPause' : 'VideoPlay'"
              layout="square"
              :tip="row.deviceChannelStatus === 'enabled' ? '禁用通道' : '启用通道'"
              @click="onToggle(row)"
            />
            <ReButton icon="Delete" layout="square" tip="删除通道" type="danger" @click="onDelete(row)" />
          </div>
        </template>
      </ReTable>

      <!-- 空态：未选设备 / 设备无通道两套文案 -->
      <article v-else class="dcv-ghost">
        <span class="dcv-ghost__icon"><el-icon><Connection /></el-icon></span>
        <p class="dcv-ghost__title">{{ filters.deviceId ? '该设备暂无通道' : '先选择一台设备' }}</p>
        <p class="dcv-ghost__desc">
          {{
            filters.deviceId
              ? '通道由设备接入时同步，也可以在这里手动登记；登记后可单独启停、排序。'
              : '通道挂在设备下：选中设备后查看它的通道，再按需新增或启停。'
          }}
        </p>
      </article>
    </section>

    <!-- 新增 / 编辑 -->
    <ReDialog
      v-model="dialogVisible"
      :title="editingId ? '编辑通道' : '新增通道'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top" class="dcv-form">
        <ReFormItem label="所属设备">
          <span class="dcv-hint">{{ currentDeviceName }}</span>
        </ReFormItem>
        <ReFormItem label="通道号" required>
          <ReInputNumber v-model="form.deviceChannelNo" :min="1" :max="512" style="width: 100%" />
          <span v-if="noInvalid" class="dcv-hint dcv-hint--bad">该通道号已被占用，请换一个</span>
          <span v-else class="dcv-hint">设备侧的通道编号，同一设备内不可重复</span>
        </ReFormItem>
        <ReFormItem label="通道名称" required>
          <ReInput v-model="form.deviceChannelName" placeholder="如「东门枪机」" />
        </ReFormItem>
        <ReFormItem label="类型">
          <ReInput v-model="form.deviceChannelType" placeholder="如：main / sub" />
        </ReFormItem>
        <ReFormItem label="排序">
          <ReInputNumber v-model="form.deviceChannelSort" :min="0" :max="9999" style="width: 100%" />
        </ReFormItem>
        <ReFormItem label="状态">
          <el-segmented v-model="form.deviceChannelStatus" :options="STATUS_SEGMENTS" />
        </ReFormItem>
      </el-form>
      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="dialogSaving" :disabled="formInvalid" @click="onSubmit">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 通道管理 —— 设备下的通道台账与启停。
 *
 * 数据来自 device-starter 的 `/api/device/channel/*`：
 *   - GET    /channel/list?deviceId=  某设备的通道
 *   - POST   /channel                新增
 *   - PUT    /channel/{id}           更新
 *   - PUT    /channel/{id}/status    启停
 *   - DELETE /channel/{id}           删除
 *
 * 通道必须挂在设备下（deviceId 为必填），所以未选设备时不查、也不允许新增。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck, Connection, Grid, Tickets } from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReInput from '@repo/ui/re-input'
import ReInputNumber from '@repo/ui/re-input-number'
import { ReFormItem } from '@repo/ui/re-kit'
import ReSelect from '@repo/ui/re-select'
import ReStatCard from '@repo/ui/re-stat-card'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
import ReTag from '@repo/ui/re-tag'

import deviceApi from '../api/deviceApi'
import type { DeviceChannel, DeviceInfo } from '../types/device'

/** 表单里的状态分片（启用 / 禁用） */
const STATUS_SEGMENTS = [
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
]

const devices = ref<DeviceInfo[]>([])
const channels = ref<DeviceChannel[]>([])
const loading = ref(false)
const loadError = ref('')

const filters = reactive({ deviceId: '', status: 'all', keyword: '' })

const dialogVisible = ref(false)
const dialogSaving = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({
  deviceChannelNo: 1,
  deviceChannelName: '',
  deviceChannelType: 'main',
  deviceChannelSort: 1,
  deviceChannelStatus: 'enabled',
})

const columns: ReTableColumn[] = [
  { prop: 'deviceChannelNo', label: '通道号', width: 110, slot: 'deviceChannelNo' },
  { prop: 'deviceChannelName', label: '通道名称', minWidth: 180, showOverflowTooltip: true },
  { prop: 'deviceChannelType', label: '类型', width: 120, showOverflowTooltip: true },
  { prop: 'deviceChannelStatus', label: '状态', width: 110, slot: 'deviceChannelStatus' },
  { prop: 'deviceChannelSort', label: '排序', width: 90, align: 'center' },
  { prop: 'actions', label: '操作', width: 170, slot: 'actions' },
]

const deviceOptions = computed(() =>
  devices.value.map((d) => ({
    value: d.deviceInfoId,
    label: `${d.deviceInfoName || d.deviceInfoId}${d.deviceInfoOnline ? '' : '（离线）'}`,
  })),
)

const currentDeviceName = computed(
  () => devices.value.find((d) => d.deviceInfoId === filters.deviceId)?.deviceInfoName || '未选择设备',
)

const enabledCount = computed(() => channels.value.filter((c) => c.deviceChannelStatus === 'enabled').length)

/** 状态筛选：分片（带计数） */
const statusSegments = computed(() => [
  { label: `全部 ${channels.value.length}`, value: 'all' },
  { label: `启用 ${enabledCount.value}`, value: 'enabled' },
  { label: `禁用 ${channels.value.length - enabledCount.value}`, value: 'disabled' },
])

const filteredChannels = computed(() => {
  const kw = filters.keyword.trim().toLowerCase()
  return channels.value.filter((c) => {
    if (filters.status !== 'all' && c.deviceChannelStatus !== filters.status) return false
    if (!kw) return true
    return `${c.deviceChannelName || ''} ${c.deviceChannelNo}`.toLowerCase().includes(kw)
  })
})

/** 已被其他通道占用的通道号（编辑时排除自身） */
const usedNos = computed(
  () => new Set(channels.value.filter((c) => c.deviceChannelId !== editingId.value).map((c) => c.deviceChannelNo)),
)

const noInvalid = computed(() => !form.deviceChannelNo || usedNos.value.has(form.deviceChannelNo))
const formInvalid = computed(() => noInvalid.value || !form.deviceChannelName.trim())

const kpis = computed(() => [
  {
    key: 'total',
    title: '通道总数',
    value: channels.value.length,
    desc: currentDeviceName.value,
    icon: Tickets,
    iconColor: 'var(--el-color-primary)',
  },
  {
    key: 'enabled',
    title: '已启用',
    value: enabledCount.value,
    desc: '可出流 / 可上报',
    icon: CircleCheck,
    iconColor: 'var(--el-color-success)',
  },
  {
    key: 'disabled',
    title: '已禁用',
    value: channels.value.length - enabledCount.value,
    desc: '不占用采集资源',
    icon: Grid,
    iconColor: 'var(--el-color-info)',
  },
  {
    key: 'devices',
    title: '可选设备',
    value: devices.value.length,
    desc: '来自设备台账',
    icon: Connection,
    iconColor: 'var(--metric-disk, var(--el-color-warning))',
  },
])

async function fetchDevices(): Promise<void> {
  try {
    devices.value = ((await deviceApi.list()) as DeviceInfo[]) || []
  } catch (e: unknown) {
    devices.value = []
    ElMessage.error(`设备清单加载失败：${errText(e)}`)
  }
}

async function fetchChannels(): Promise<void> {
  if (!filters.deviceId) {
    channels.value = []
    loadError.value = ''
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    channels.value = ((await deviceApi.listChannels(filters.deviceId)) as DeviceChannel[]) || []
  } catch (e: unknown) {
    channels.value = []
    loadError.value = errText(e)
    ElMessage.error(`通道加载失败：${loadError.value}`)
  } finally {
    loading.value = false
  }
}

function openCreate(): void {
  if (!filters.deviceId) {
    ElMessage.warning('请先选择设备')
    return
  }
  editingId.value = null
  Object.assign(form, {
    deviceChannelNo: 1,
    deviceChannelName: '',
    deviceChannelType: 'main',
    deviceChannelSort: channels.value.length + 1,
    deviceChannelStatus: 'enabled',
  })
  dialogVisible.value = true
}

function openEdit(row: DeviceChannel): void {
  editingId.value = row.deviceChannelId
  Object.assign(form, {
    deviceChannelNo: row.deviceChannelNo,
    deviceChannelName: row.deviceChannelName,
    deviceChannelType: row.deviceChannelType,
    deviceChannelSort: row.deviceChannelSort,
    deviceChannelStatus: row.deviceChannelStatus || 'enabled',
  })
  dialogVisible.value = true
}

async function onSubmit(): Promise<void> {
  if (formInvalid.value) return
  dialogSaving.value = true
  try {
    const payload = { ...form, deviceChannelDeviceId: filters.deviceId } as unknown as DeviceChannel
    if (editingId.value) {
      await deviceApi.updateChannel(editingId.value, payload)
      ElMessage.success('通道已更新')
    } else {
      await deviceApi.addChannel(payload)
      ElMessage.success('通道已新增')
    }
    dialogVisible.value = false
    await fetchChannels()
  } catch (e: unknown) {
    ElMessage.error(`保存失败：${errText(e)}`)
  } finally {
    dialogSaving.value = false
  }
}

async function onToggle(row: DeviceChannel): Promise<void> {
  const next = row.deviceChannelStatus === 'enabled' ? 'disabled' : 'enabled'
  try {
    await deviceApi.toggleChannelStatus(row.deviceChannelId, next)
    ElMessage.success(next === 'enabled' ? '已启用' : '已禁用')
    await fetchChannels()
  } catch (e: unknown) {
    ElMessage.error(`操作失败：${errText(e)}`)
  }
}

async function onDelete(row: DeviceChannel): Promise<void> {
  const label = row.deviceChannelName || `CH${row.deviceChannelNo}`
  try {
    await ElMessageBox.confirm(`确认删除通道「${label}」？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deviceApi.deleteChannel(row.deviceChannelId)
    ElMessage.success('通道已删除')
    await fetchChannels()
  } catch (e: unknown) {
    ElMessage.error(`删除失败：${errText(e)}`)
  }
}

function errText(e: unknown): string {
  return (e as { msg?: string })?.msg || (e instanceof Error ? e.message : String(e))
}

onMounted(fetchDevices)
</script>

<style scoped>
.dcv {
  display: flex;
  flex-direction: column;
  gap: 14px;
  /* 左右内边距交给外层布局(main.el-main)：两层叠加会让右侧空隙过大 */
  padding: 10px 0 12px;
  /* 高度够就吃满剩余空间（表格内滚、筛选常驻），不够就自然撑开让主区滚动 */
  min-height: 100%;
  color: var(--el-text-color-primary);
}

.dcv-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.dcv-filter {
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
.dcv-field {
  width: 160px;
}
.dcv-seg {
  flex: none;
}
.dcv-field--device {
  width: 230px;
}
.dcv-field--search {
  width: 230px;
}
.dcv-field :deep(.el-input),
.dcv-field :deep(.el-select) {
  width: 100%;
}
.dcv-filter__meta {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.dcv-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px solid var(--el-border-color-lighter);
}
@media (max-width: 1100px) {
  .dcv-field,
  .dcv-field--device,
  .dcv-field--search {
    width: 100%;
  }
  .dcv-filter__meta {
    margin-left: 0;
  }
  .dcv-ops {
    padding-left: 0;
    border-left: none;
  }
}

.dcv-panel {
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.dcv-panel--fill {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.dcv-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.dcv-panel__bar {
  width: 6px;
  height: 16px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.dcv-panel__count {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.dcv-panel__hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.dcv-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-radius: var(--el-radius-base, 8px);
}

.dcv-acts {
  display: flex;
  align-items: center;
  gap: 6px;
}
.dcv-mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 12.5px;
}

.dcv-ghost {
  flex: 1;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px;
  text-align: center;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-lg, 12px);
}
.dcv-ghost__icon {
  font-size: 30px;
  color: var(--el-text-color-placeholder);
}
.dcv-ghost__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.dcv-ghost__desc {
  margin: 0;
  max-width: 460px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.dcv-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dcv-hint--bad {
  color: var(--el-color-danger);
}
</style>
