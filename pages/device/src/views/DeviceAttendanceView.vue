<template>
  <div class="dat">
    <header class="dat-head">
      <div>
        <h2 class="dat-title">考勤记录</h2>
        <p class="dat-sub">只读：数据来自考勤 webhook 或门禁记录定时归集，不提供人工增删改。</p>
      </div>
      <el-button :loading="loading" @click="query">刷新</el-button>
    </header>

    <div class="dat-bar">
      <el-select v-model="deviceId" placeholder="全部设备" clearable filterable style="width: 240px">
        <el-option v-for="d in deviceOptions" :key="d.value" :label="d.label" :value="d.value" />
      </el-select>
      <el-input
        v-model="keyword"
        placeholder="姓名 / 工号 / 卡号"
        clearable
        style="width: 220px"
        @keyup.enter="query"
      />
      <el-date-picker
        v-model="range"
        type="datetimerange"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        value-format="YYYY-MM-DD HH:mm:ss"
      />
      <el-button type="primary" @click="query">查询</el-button>
    </div>

    <!-- 服务端分页：loader 供数，不再一次性拉 500 条硬截断 -->
    <ReTable
      ref="tableRef"
      :columns="columns"
      :loader="loadRecords"
      :params="tableParams"
      engine="element"
      row-key="deviceAttendanceRecordId"
      :pagination="true"
      :page-size="20"
      :page-sizes="[10, 20, 50, 100, 200]"
      :toolbar="false"
    >
      <template #col-direction="{ row }">{{ directionText(row.deviceAttendanceRecordDirection) }}</template>
      <template #col-device="{ row }">{{ deviceName(row.deviceAttendanceRecordDeviceId) }}</template>
      <template #col-source="{ row }">{{ sourceText(row.deviceAttendanceRecordSource) }}</template>
    </ReTable>
  </div>
</template>

<script setup lang="ts">
/**
 * 考勤记录页（只读）。
 *
 * @author CH
 * @since 4.0.0.52
 */
import { computed, onMounted, ref } from 'vue'
import ReTable from '@repo/ui/re-table'
import type { RePageResult, ReTableColumn, ReTableLoadParams } from '@repo/ui/re-table'
import { deviceApi } from '../api/deviceApi'

const loading = ref(false)
const deviceId = ref('')
const keyword = ref('')
const range = ref<[string, string] | null>(null)
const deviceOptions = ref<Array<{ value: string; label: string }>>([])

/** ReTable 暴露的方法里只用 reload */
const tableRef = ref<InstanceType<typeof ReTable> | null>(null)

const directionText = (value?: string) =>
  value === 'in' ? '上班' : value === 'out' ? '下班' : '—'
const sourceText = (value?: string) =>
  value === 'webhook' ? 'Webhook' : value === 'access-sync' ? '门禁归集' : (value || '—')
const deviceName = (id?: string) =>
  deviceOptions.value.find((d) => d.value === id)?.label ?? (id || '—')

/** 交给 ReTable 的查询参数（page/pageSize 由组件自己注入，这里不能带） */
const tableParams = computed<Record<string, unknown>>(() => {
  const params: Record<string, unknown> = {}
  if (deviceId.value) params.deviceId = deviceId.value
  if (keyword.value) params.keyword = keyword.value
  if (range.value) {
    params.start = range.value[0]
    params.end = range.value[1]
  }
  return params
})

/** 列定义：与考勤字段一一对应，方向 / 设备 / 来源走插槽渲染 */
const columns: ReTableColumn[] = [
  { prop: 'deviceAttendanceRecordPersonName', label: '姓名', minWidth: 110 },
  { prop: 'deviceAttendanceRecordPersonNo', label: '工号', width: 110 },
  { prop: 'deviceAttendanceRecordCardNo', label: '卡号', width: 130 },
  { prop: 'deviceAttendanceRecordDirection', label: '方向', slot: 'direction', width: 90 },
  { prop: 'deviceAttendanceRecordOccurredAt', label: '考勤时间', minWidth: 180 },
  { prop: 'deviceAttendanceRecordDeviceId', label: '设备', slot: 'device', minWidth: 160 },
  { prop: 'deviceAttendanceRecordSource', label: '来源', slot: 'source', width: 110 },
]

/** ReTable 远程 loader：page/pageSize 由组件给，其余条件来自筛选区 */
async function loadRecords({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  loading.value = true
  try {
    // 后端用 page/size 命名，把组件注入的 page/pageSize 重命名过去
    const filters = { ...params }
    delete filters.page
    delete filters.pageSize
    const res: any = await deviceApi.pageAttendance({ ...filters, page, size: pageSize })
    const list = (res?.records ?? res?.data ?? []) as Record<string, any>[]
    return { total: (res?.total ?? list.length) as number, records: list as unknown as Array<Record<string, unknown>> }
  } catch {
    return { total: 0, records: [] }
  } finally {
    loading.value = false
  }
}

async function loadDevices() {
  try {
    const list = (await deviceApi.listIndex()) as Array<Record<string, any>>
    deviceOptions.value = list.map((d) => ({
      value: d.deviceInfoId,
      label: `${d.deviceInfoName || d.deviceInfoCode || d.deviceInfoId}${d.deviceInfoVendor ? `（${d.deviceInfoVendor}）` : ''}`
    }))
  } catch {
    deviceOptions.value = []
  }
}

/** 查询 / 刷新：reload 重拉当前页 */
function query(): void {
  void tableRef.value?.reload()
}

onMounted(() => {
  void loadDevices()
})
</script>

<style scoped>
.dat {
  padding: 16px;
}
.dat-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.dat-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.dat-sub {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.dat-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
</style>
