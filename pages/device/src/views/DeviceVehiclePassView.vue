<template>
  <div class="dvp">
    <header class="dvp-head">
      <div>
        <h2 class="dvp-title">过车记录</h2>
        <p class="dvp-sub">车闸过车流水，支持按设备、车闸、方向与时间筛选。</p>
      </div>
      <el-button :loading="loading" @click="loadPasses">刷新</el-button>
    </header>

    <div class="dvp-bar">
      <el-select v-model="deviceId" placeholder="全部设备" clearable filterable style="width: 240px">
        <el-option v-for="d in deviceOptions" :key="d.value" :label="d.label" :value="d.value" />
      </el-select>
      <el-input v-model="gateId" placeholder="车闸 ID" clearable style="width: 180px" />
      <el-select v-model="direction" placeholder="全部方向" clearable style="width: 140px">
        <el-option label="入场" value="in" />
        <el-option label="出场" value="out" />
      </el-select>
      <el-date-picker
        v-model="range"
        type="datetimerange"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        value-format="YYYY-MM-DD HH:mm:ss"
      />
      <el-button type="primary" @click="loadPasses">查询</el-button>
      <span class="dvp-count">{{ rows.length }} 条</span>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column prop="deviceVehiclePassPlateNo" label="车牌号" min-width="120" />
      <el-table-column label="设备" min-width="160">
        <template #default="{ row }">{{ deviceName(row.deviceVehiclePassDeviceId) }}</template>
      </el-table-column>
      <el-table-column prop="deviceVehiclePassGateId" label="车闸 ID" min-width="150" />
      <el-table-column label="方向" width="90">
        <template #default="{ row }">{{ directionText(row.deviceVehiclePassDirection) }}</template>
      </el-table-column>
      <el-table-column prop="deviceVehiclePassTime" label="过车时间" min-width="180" />
      <el-table-column prop="deviceVehiclePassVehicleType" label="车辆类型" width="120" />
      <el-table-column label="抓拍" width="90">
        <template #default="{ row }">
          <el-link v-if="row.deviceVehiclePassPhotoUrl" :href="row.deviceVehiclePassPhotoUrl" target="_blank">
            查看
          </el-link>
          <span v-else>—</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
/**
 * 过车记录页。
 *
 * @author CH
 * @since 4.0.0.52
 */
import { onMounted, ref } from 'vue'
import { deviceApi } from '../api/deviceApi'

const loading = ref(false)
const deviceId = ref('')
const gateId = ref('')
const direction = ref('')
const range = ref<[string, string] | null>(null)
const rows = ref<Record<string, any>[]>([])
const deviceOptions = ref<Array<{ value: string; label: string }>>([])

const directionText = (value?: string) =>
  value === 'in' ? '入场' : value === 'out' ? '出场' : '—'
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

async function loadPasses() {
  loading.value = true
  try {
    const page: any = await deviceApi.pageVehiclePasses({
      page: 1,
      size: 500,
      deviceId: deviceId.value,
      gateId: gateId.value,
      direction: direction.value,
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
  void loadPasses()
})
</script>

<style scoped>
.dvp {
  padding: 16px;
}
.dvp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.dvp-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.dvp-sub {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.dvp-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.dvp-count {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
