<template>
  <section class="chm">
    <header class="chm__head">
      <span class="chm__bar" />
      <span>通道列表</span>
      <span class="chm__count">{{ channels.length }}</span>
      <div class="chm__ops">
        <ReButton icon="RefreshRight" layout="square" tip="重新加载通道" :loading="loading" @click="load" />
        <ReButton icon="Plus" :show-text="true" type="primary" @click="openAdd">添加通道</ReButton>
      </div>
    </header>

    <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM；
         pagination/toolbar 关闭，不新增页码控件与工具栏按钮；
         v-loading → :loading（同语义透传）；
         原表未写 border → settings.border=false 显式抑制默认边框；
         原表无 height/maxHeight → layout-table.minHeight=0：抑制 ReTable 缺省开启的
         fill（表头固定内滚）与空态 440px min-height，保持「内容多高表多高 + 整页滚动」。 -->
    <ReTable
      :data="channels"
      :columns="channelColumns"
      engine="element"
      :pagination="false"
      :toolbar="false"
      :loading="loading"
      :layout-table="{ minHeight: 0 }"
      :settings="{ border: false }"
      style="width: 100%"
    >
      <template #col-deviceChannelNo="{ row }">
        <span class="chm__chip">CH{{ row.deviceChannelNo }}</span>
      </template>
      <template #col-deviceChannelName="{ row }">
        <span class="chm__name">{{ row.deviceChannelName || '未命名通道' }}</span>
      </template>
      <template #col-deviceChannelType="{ row }">
        <ReTag :type="channelTypeColor(channelOf(row).deviceChannelType)" size="small">
          {{ channelTypeLabel(channelOf(row).deviceChannelType) }}
        </ReTag>
      </template>
      <template #col-status="{ row }">
        <el-switch
          :model-value="channelOf(row).deviceChannelStatus === 'enabled'"
          active-text="启用"
          inactive-text="禁用"
          @change="(val: any) => toggleStatus(channelOf(row), val)"
        />
      </template>
      <template #col-actions="{ row }">
        <div class="chm__row-ops">
          <ReButton icon="EditPen" layout="square" tip="编辑通道" @click="openEdit(channelOf(row))" />
          <ReButton icon="Delete" layout="square" tip="删除通道" @click="removeChannel(channelOf(row))" />
        </div>
      </template>
      <template #empty>
        <ReEmpty description="暂无通道，点击「添加通道」登记" :image-size="70" />
      </template>
    </ReTable>

    <ReDialog v-model="dialogVisible" :title="isEdit ? '编辑通道' : '添加通道'" width="460px" append-to-body>
      <el-form label-position="top" class="chm-form">
        <ReFormItem label="通道号">
          <ReInputNumber v-model="form.deviceChannelNo" :min="1" :max="999" style="width: 100%" />
        </ReFormItem>
        <ReFormItem label="通道名称">
          <ReInput v-model="form.deviceChannelName" placeholder="例如 大厅球机" />
        </ReFormItem>
        <ReFormItem label="通道类型">
          <ReSelect v-model="form.deviceChannelType" :options="CHANNEL_TYPE_OPTIONS" style="width: 100%" />
        </ReFormItem>
        <ReFormItem label="排序">
          <ReInputNumber v-model="form.deviceChannelSort" :min="0" :max="999" style="width: 100%" />
        </ReFormItem>
      </el-form>
      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" @click="submit">确定</ReButton>
      </template>
    </ReDialog>
  </section>
</template>

<script setup lang="ts">
import { message } from '@repo/core'
import { ref, watch, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'

import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReEmpty from '@repo/ui/re-empty'
import ReInput from '@repo/ui/re-input'
import ReInputNumber from '@repo/ui/re-input-number'
import { ReFormItem } from '@repo/ui/re-kit'
import ReSelect from '@repo/ui/re-select'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
import ReTag from '@repo/ui/re-tag'

import { deviceApi } from '@/api/deviceApi'
import type { DeviceChannel } from '@/types/device'

/** 通道类型下拉项（与后端 deviceChannelType 取值对齐） */
const CHANNEL_TYPE_OPTIONS = [
  { label: '视频', value: 'video' },
  { label: '门禁', value: 'door' },
  { label: '报警', value: 'alarm' },
  { label: '对讲', value: 'intercom' },
]

/**
 * 列配置：原模板 6 个 el-table-column 收敛到数组。
 * 标题是静态文案（无 t()），普通常量即可。
 * 「状态」「操作」两列原本就没有 prop（纯模板列），按规格造合成 prop status / actions。
 */
const channelColumns: ReTableColumn[] = [
  { prop: 'deviceChannelNo', label: '通道号', width: 100, slot: 'deviceChannelNo' },
  { prop: 'deviceChannelName', label: '通道名称', minWidth: 160, slot: 'deviceChannelName' },
  { prop: 'deviceChannelType', label: '类型', width: 110, slot: 'deviceChannelType' },
  { prop: 'deviceChannelSort', label: '排序', width: 80, align: 'center' },
  { prop: 'status', label: '状态', width: 120, slot: 'status' },
  { prop: 'actions', label: '操作', width: 130, align: 'right', slot: 'actions' },
]

/**
 * ReTable 列插槽的 row 是宽类型（字段为 unknown），直接传给
 * {@link channelTypeLabel} / {@link openEdit} / {@link toggleStatus} 等强类型函数会 TS2345。
 * 这里统一收窄回 {@link DeviceChannel}，模板里不再散落断言。
 */
function channelOf(row: Record<string, unknown>): DeviceChannel {
  return row as unknown as DeviceChannel
}

const props = defineProps<{
  deviceId: string
}>()

const channels = ref<DeviceChannel[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref('')
const form = ref({
  deviceChannelNo: 1,
  deviceChannelName: '',
  deviceChannelType: 'video',
  deviceChannelSort: 0,
})

function load() {
  if (!props.deviceId) return
  loading.value = true
  deviceApi
    .listChannels(props.deviceId)
    .then((res: any) => {
      channels.value = res || []
    })
    .catch(() => {
      channels.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

function openAdd() {
  isEdit.value = false
  editingId.value = ''
  form.value = { deviceChannelNo: channels.value.length + 1, deviceChannelName: '', deviceChannelType: 'video', deviceChannelSort: 0 }
  dialogVisible.value = true
}

function openEdit(row: DeviceChannel) {
  isEdit.value = true
  editingId.value = row.deviceChannelId
  form.value = {
    deviceChannelNo: row.deviceChannelNo,
    deviceChannelName: row.deviceChannelName,
    deviceChannelType: row.deviceChannelType,
    deviceChannelSort: row.deviceChannelSort,
  }
  dialogVisible.value = true
}

function submit() {
  const payload = {
    ...form.value,
    deviceChannelDeviceId: props.deviceId,
    deviceChannelStatus: 'enabled',
  }
  const req = isEdit.value ? deviceApi.updateChannel(editingId.value, payload) : deviceApi.addChannel(payload)
  req
    .then(() => {
      message.success(isEdit.value ? '通道已更新' : '通道已添加')
      dialogVisible.value = false
      load()
    })
    .catch(() => message.error('操作失败'))
}

function toggleStatus(row: DeviceChannel, val: boolean) {
  const status = val ? 'enabled' : 'disabled'
  deviceApi
    .toggleChannelStatus(row.deviceChannelId, status)
    .then(() => {
      row.deviceChannelStatus = status
      message.success(val ? '已启用' : '已禁用')
    })
    .catch(() => message.error('状态更新失败'))
}

function removeChannel(row: DeviceChannel) {
  ElMessageBox.confirm(`确认删除通道「${row.deviceChannelName}」？`, '提示', { type: 'warning' })
    .then(() => deviceApi.deleteChannel(row.deviceChannelId))
    .then(() => {
      message.success('通道已删除')
      load()
    })
    .catch(() => null)
}

function channelTypeLabel(type: string): string {
  const map: Record<string, string> = { video: '视频', door: '门禁', alarm: '报警', intercom: '对讲' }
  return map[type] || type || '-'
}

/** 通道类型 → 标签色 */
function channelTypeColor(type: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
    video: 'primary',
    door: 'success',
    alarm: 'danger',
    intercom: 'warning',
  }
  return map[type] || 'info'
}

onMounted(load)
watch(() => props.deviceId, load)
</script>

<style scoped>
.chm {
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.chm__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.chm__bar {
  width: 6px;
  height: 16px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.chm__count {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.chm__ops {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.chm__chip {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-text-color-primary) 6%, transparent);
}
.chm__name {
  font-size: 13.5px;
  color: var(--el-text-color-primary);
}
.chm__row-ops {
  display: inline-flex;
  gap: 6px;
  justify-content: flex-end;
}
.chm :deep(.el-table th.el-table__cell) {
  background: transparent !important;
  color: var(--el-text-color-secondary);
  font-weight: 600;
}

.chm-form {
  display: flex;
  flex-direction: column;
}
</style>
