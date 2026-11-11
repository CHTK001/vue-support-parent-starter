<template>
  <div class="dat">
    <header class="dat-head">
      <div>
        <h2 class="dat-title">考勤记录</h2>
        <p class="dat-sub">只读：数据来自考勤 webhook 或门禁记录定时归集，不提供人工增删改。</p>
      </div>
      <el-button :loading="loading" @click="loadRecords">刷新</el-button>
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
        @keyup.enter="loadRecords"
      />
      <el-date-picker
        v-model="range"
        type="datetimerange"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        value-format="YYYY-MM-DD HH:mm:ss"
      />
      <el-button type="primary" @click="loadRecords">查询</el-button>
      <span class="dat-count">{{ rows.length }} 条</span>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column prop="deviceAttendanceRecordPersonName" label="姓名" min-width="110" />
      <el-table-column prop="deviceAttendanceRecordPersonNo" label="工号" width="110" />
      <el-table-column prop="deviceAttendanceRecordCardNo" label="卡号" width="130" />
      <el-table-column label="方向" width="90">
        <template #default="{ row }">{{ directionText(row.deviceAttendanceRecordDirection) }}</template>
      </el-table-column>
      <el-table-column prop="deviceAttendanceRecordOccurredAt" label="考勤时间" min-width="180" />
      <el-table-column label="设备" min-width="160">
        <template #default="{ row }">{{ deviceName(row.deviceAttendanceRecordDeviceId) }}</template>
      </el-table-column>
      <el-table-column label="来源" width="110">
        <template #default="{ row }">{{ sourceText(row.deviceAttendanceRecordSource) }}</template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
/**
 * 考勤记录页（只读）。
 *
 * @author CH
 * @since 4.0.0.52
 */
import { onMounted, ref } from 'vue'
import { deviceApi } from '../api/deviceApi'

const loading = ref(false)
const deviceId = ref('')
const keyword = ref('')
const range = ref<[string, string] | null>(null)
const rows = ref<Record<string, any>[]>([])
const deviceOptions = ref<Array<{ value: string; label: string }>>([])

const directionText = (value?: string) =>
  value === 'in' ? '上班' : value === 'out' ? '下班' : '—'
const sourceText = (value?: string) =>
  value === 'webhook' ? 'Webhook' : value === 'access-sync' ? '门禁归集' : (value || '—')
const deviceName = (id?: string) =>
  deviceOptions.value.find((d) => d.value === id)?.label ?? (id || '—')

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

async function loadRecords() {
  loading.value = true
  try {
    const page: any = await deviceApi.pageAttendance({
      page: 1,
      size: 500,
      deviceId: deviceId.value,
      keyword: keyword.value,
      start: range.value?.[0],
      end: range.value?.[1]
    })
    rows.value = page?.records ?? page?.data ?? []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadDevices()
  void loadRecords()
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
.dat-count {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
