<template>
  <div class="channel-manager space-y-4">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium text-el-text">通道列表（{{ channels.length }}）</span>
      <el-button type="primary" @click="openAdd">
        <el-icon class="mr-1"><Plus /></el-icon>添加通道
      </el-button>
    </div>

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
      :loading="loading"
      :layout-table="{ minHeight: 0 }"
      :settings="{ border: false }"
      style="width: 100%"
      :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
    >
      <template #col-deviceChannelType="{ row }">
        <el-tag effect="plain">{{ channelTypeLabel(channelOf(row).deviceChannelType) }}</el-tag>
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
        <el-button link type="primary" @click="openEdit(channelOf(row))">编辑</el-button>
        <el-button link type="danger" @click="removeChannel(channelOf(row))">删除</el-button>
      </template>
      <template #empty>
        <el-empty description="暂无通道" :image-size="50" />
      </template>
    </ReTable>

    <ReDialog v-model="dialogVisible" :title="isEdit ? '编辑通道' : '添加通道'" width="460" append-to-body>
      <el-form :model="form" label-width="90">
        <el-form-item label="通道号">
          <el-input-number v-model="form.deviceChannelNo" :min="1" :max="999" />
        </el-form-item>
        <el-form-item label="通道名称">
          <el-input v-model="form.deviceChannelName" placeholder="例如 大厅球机" />
        </el-form-item>
        <el-form-item label="通道类型">
          <el-select v-model="form.deviceChannelType" class="w-full">
            <el-option label="视频" value="video" />
            <el-option label="门禁" value="door" />
            <el-option label="报警" value="alarm" />
            <el-option label="对讲" value="intercom" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.deviceChannelSort" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, watch, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue'
import { deviceApi } from '@pages/device/src/api/deviceApi'
import type { DeviceChannel } from '@pages/device/src/types/device'


import ReDialog from "@repo/ui/re-dialog";
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'

/**
 * 列配置：原模板 6 个 el-table-column 收敛到数组。
 * 标题是静态文案（无 t()），普通常量即可。
 * 「状态」「操作」两列原本就没有 prop（纯模板列），按规格造合成 prop status / actions。
 */
const channelColumns: ReTableColumn[] = [
  { prop: 'deviceChannelNo', label: '通道号', width: 90 },
  { prop: 'deviceChannelName', label: '通道名称', minWidth: 140 },
  { prop: 'deviceChannelType', label: '类型', width: 100, slot: 'deviceChannelType' },
  { prop: 'deviceChannelSort', label: '排序', width: 80 },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'actions', label: '操作', width: 140, slot: 'actions' },
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
  deviceChannelSort: 0
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
    deviceChannelSort: row.deviceChannelSort
  }
  dialogVisible.value = true
}

function submit() {
  const payload = {
    ...form.value,
    deviceChannelDeviceId: props.deviceId,
    deviceChannelStatus: 'enabled'
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

onMounted(load)
watch(() => props.deviceId, load)
</script>
