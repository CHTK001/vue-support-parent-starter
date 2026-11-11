<template>
  <div class="dvv">
    <header class="dvv-head">
      <div>
        <h2 class="dvv-title">车辆管理</h2>
        <p class="dvv-sub">车闸车辆档案：增删改、绑定设备、车牌所属与有效期续期。</p>
      </div>
      <el-button :loading="loading" @click="loadVehicles">刷新</el-button>
    </header>

    <div class="dvv-bar">
      <el-input
        v-model="keyword"
        placeholder="车牌 / 车主 / 电话"
        clearable
        style="width: 240px"
        @keyup.enter="loadVehicles"
      />
      <el-select v-model="deviceFilter" placeholder="全部设备" clearable filterable style="width: 240px">
        <el-option v-for="d in deviceOptions" :key="d.value" :label="d.label" :value="d.value" />
      </el-select>
      <el-button type="primary" @click="loadVehicles">查询</el-button>
      <el-button @click="openVehicle()">新增车辆</el-button>
    </div>

    <el-table v-loading="loading" :data="vehicles" border>
      <el-table-column prop="deviceVehiclePlateNo" label="车牌号" min-width="120" />
      <el-table-column prop="deviceVehiclePlateColor" label="车牌颜色" width="100" />
      <el-table-column prop="deviceVehicleType" label="车辆类型" width="110" />
      <el-table-column prop="deviceVehicleOwnerName" label="车主" width="110" />
      <el-table-column prop="deviceVehicleOwnerPhone" label="电话" width="130" />
      <el-table-column label="名单" width="90">
        <template #default="{ row }">{{ listTypeText(row.deviceVehicleListType) }}</template>
      </el-table-column>
      <el-table-column label="对应设备" min-width="160">
        <template #default="{ row }">{{ deviceName(row.deviceVehicleDeviceId) }}</template>
      </el-table-column>
      <el-table-column prop="deviceVehicleBelonging" label="车牌所属" min-width="140" />
      <el-table-column label="有效期" min-width="180">
        <template #default="{ row }">
          {{ row.deviceVehicleValidFrom || '—' }} ~ {{ row.deviceVehicleValidTo || '—' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="190" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openVehicle(row)">编辑</el-button>
          <el-button link type="success" @click="openRenew(row)">续期</el-button>
          <el-button link type="danger" @click="removeVehicle(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="vehicleDialog.visible" :title="vehicleDialog.id ? '编辑车辆' : '新增车辆'" width="560px">
      <el-form :model="vehicleDialog.form" label-width="90px">
        <el-form-item label="车牌号" required>
          <el-input v-model="vehicleDialog.form.deviceVehiclePlateNo" />
        </el-form-item>
        <el-form-item label="车牌颜色">
          <el-select v-model="vehicleDialog.form.deviceVehiclePlateColor" style="width: 100%">
            <el-option label="蓝" value="蓝" />
            <el-option label="黄" value="黄" />
            <el-option label="绿" value="绿" />
            <el-option label="白" value="白" />
            <el-option label="黑" value="黑" />
          </el-select>
        </el-form-item>
        <el-form-item label="车辆类型">
          <el-input v-model="vehicleDialog.form.deviceVehicleType" placeholder="小型车 / 大型车 / 新能源" />
        </el-form-item>
        <el-form-item label="对应设备">
          <el-select
            v-model="vehicleDialog.form.deviceVehicleDeviceId"
            placeholder="选择车闸所在设备"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option v-for="d in deviceOptions" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="车牌所属">
          <el-input v-model="vehicleDialog.form.deviceVehicleBelonging" placeholder="单位 / 车场" />
        </el-form-item>
        <el-form-item label="车主">
          <el-input v-model="vehicleDialog.form.deviceVehicleOwnerName" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="vehicleDialog.form.deviceVehicleOwnerPhone" />
        </el-form-item>
        <el-form-item label="名单类型">
          <el-select v-model="vehicleDialog.form.deviceVehicleListType" style="width: 100%">
            <el-option label="普通" value="normal" />
            <el-option label="白名单" value="white" />
            <el-option label="黑名单" value="black" />
          </el-select>
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker
            v-model="vehicleDialog.range"
            type="datetimerange"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="vehicleDialog.form.deviceVehicleRemark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="vehicleDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveVehicle">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="renewDialog.visible" title="车辆续期" width="460px">
      <el-form label-width="90px">
        <el-form-item label="车牌号">{{ renewDialog.plateNo }}</el-form-item>
        <el-form-item label="当前到期">{{ renewDialog.currentValidTo || '—' }}</el-form-item>
        <el-form-item label="续期月数">
          <el-select v-model="renewDialog.months" style="width: 100%" :disabled="!!renewDialog.validTo">
            <el-option label="1 个月" :value="1" />
            <el-option label="3 个月" :value="3" />
            <el-option label="6 个月" :value="6" />
            <el-option label="12 个月" :value="12" />
            <el-option label="24 个月" :value="24" />
          </el-select>
        </el-form-item>
        <el-form-item label="指定到期">
          <el-date-picker
            v-model="renewDialog.validTo"
            type="datetime"
            placeholder="不填则按月顺延"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renewDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitRenew">确认续期</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 车辆管理页：只负责车闸车辆档案，过车记录在独立菜单。
 *
 * @author CH
 * @since 4.0.0.52
 */
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deviceApi } from '../api/deviceApi'

const loading = ref(false)
const saving = ref(false)
const keyword = ref('')
const deviceFilter = ref('')
const vehicles = ref<Record<string, any>[]>([])
const deviceOptions = ref<Array<{ value: string; label: string }>>([])

const vehicleDialog = reactive<{
  visible: boolean
  id: string
  form: Record<string, any>
  range: [string, string] | null
}>({ visible: false, id: '', form: {}, range: null })

const renewDialog = reactive<{
  visible: boolean
  id: string
  plateNo: string
  currentValidTo: string
  months: number
  validTo: string
}>({ visible: false, id: '', plateNo: '', currentValidTo: '', months: 12, validTo: '' })

const listTypeText = (value?: string) =>
  value === 'white' ? '白名单' : value === 'black' ? '黑名单' : '普通'

const deviceName = (id?: string) =>
  deviceOptions.value.find((d) => d.value === id)?.label ?? (id || '—')

const rowsOf = (page: any): Record<string, any>[] => page?.records ?? page?.data ?? []

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

async function loadVehicles() {
  loading.value = true
  try {
    const page = await deviceApi.pageVehicles({ page: 1, size: 500, keyword: keyword.value })
    const rows = rowsOf(page)
    vehicles.value = deviceFilter.value
      ? rows.filter((r) => r.deviceVehicleDeviceId === deviceFilter.value)
      : rows
  } finally {
    loading.value = false
  }
}

function openVehicle(row?: Record<string, any>) {
  vehicleDialog.id = row?.deviceVehicleId ?? ''
  vehicleDialog.form = row
    ? { ...row }
    : { deviceVehicleListType: 'normal', deviceVehiclePlateColor: '蓝' }
  vehicleDialog.range = row?.deviceVehicleValidFrom && row?.deviceVehicleValidTo
    ? [row.deviceVehicleValidFrom, row.deviceVehicleValidTo]
    : null
  vehicleDialog.visible = true
}

async function saveVehicle() {
  if (!vehicleDialog.form.deviceVehiclePlateNo) {
    ElMessage.warning('请填写车牌号')
    return
  }
  vehicleDialog.form.deviceVehicleValidFrom = vehicleDialog.range?.[0] ?? null
  vehicleDialog.form.deviceVehicleValidTo = vehicleDialog.range?.[1] ?? null
  saving.value = true
  try {
    if (vehicleDialog.id) {
      await deviceApi.updateVehicle(vehicleDialog.id, vehicleDialog.form)
    } else {
      await deviceApi.addVehicle(vehicleDialog.form)
    }
    ElMessage.success('已保存')
    vehicleDialog.visible = false
    await loadVehicles()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
  } finally {
    saving.value = false
  }
}

async function removeVehicle(row: Record<string, any>) {
  await ElMessageBox.confirm(`删除车辆「${row.deviceVehiclePlateNo}」？`, '确认', { type: 'warning' })
  await deviceApi.deleteVehicle(row.deviceVehicleId)
  ElMessage.success('已删除')
  await loadVehicles()
}

function openRenew(row: Record<string, any>) {
  renewDialog.id = row.deviceVehicleId
  renewDialog.plateNo = row.deviceVehiclePlateNo
  renewDialog.currentValidTo = row.deviceVehicleValidTo || ''
  renewDialog.months = 12
  renewDialog.validTo = ''
  renewDialog.visible = true
}

async function submitRenew() {
  saving.value = true
  try {
    await deviceApi.renewVehicle(renewDialog.id, {
      months: renewDialog.validTo ? undefined : renewDialog.months,
      validTo: renewDialog.validTo || undefined
    })
    ElMessage.success('续期成功')
    renewDialog.visible = false
    await loadVehicles()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '续期失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadDevices()
  void loadVehicles()
})
</script>

<style scoped>
.dvv {
  padding: 16px;
}
.dvv-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.dvv-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.dvv-sub {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.dvv-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
</style>
