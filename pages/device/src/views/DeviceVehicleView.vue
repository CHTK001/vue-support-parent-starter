<template>
  <div class="dvv">
    <header class="dvv-head">
      <div>
        <h2 class="dvv-title">车辆与车闸</h2>
        <p class="dvv-sub">车辆档案、车闸点位（含方向）与过车记录；数据落本地台账，厂商接口就绪后可同步。</p>
      </div>
      <el-button :loading="loading" @click="reloadAll">刷新</el-button>
    </header>

    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <el-tab-pane label="门禁记录" name="access">
        <DeviceAccessRecordView />
      </el-tab-pane>
      <el-tab-pane label="车辆档案" name="vehicle">
        <div class="dvv-bar">
          <el-input
            v-model="vehicleKeyword"
            placeholder="车牌 / 车主 / 电话"
            clearable
            style="width: 240px"
            @keyup.enter="loadVehicles"
          />
          <el-button type="primary" @click="loadVehicles">查询</el-button>
          <el-button @click="openVehicle()">新增车辆</el-button>
        </div>
        <el-table v-loading="loading" :data="vehicles" border>
          <el-table-column prop="deviceVehiclePlateNo" label="车牌号" min-width="120" />
          <el-table-column prop="deviceVehiclePlateColor" label="车牌颜色" width="100" />
          <el-table-column prop="deviceVehicleType" label="车辆类型" width="120" />
          <el-table-column prop="deviceVehicleOwnerName" label="车主" width="120" />
          <el-table-column prop="deviceVehicleOwnerPhone" label="电话" width="140" />
          <el-table-column prop="deviceVehicleListType" label="名单" width="100" />
          <el-table-column label="有效期" min-width="180">
            <template #default="{ row }">
              {{ row.deviceVehicleValidFrom || '—' }} ~ {{ row.deviceVehicleValidTo || '—' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openVehicle(row)">编辑</el-button>
              <el-button link type="danger" @click="removeVehicle(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="车闸点位" name="barrier">
        <div class="dvv-bar">
          <el-input v-model="gateDeviceId" placeholder="设备 ID" clearable style="width: 220px" />
          <el-select v-model="gateDirection" placeholder="方向" clearable style="width: 140px">
            <el-option label="入口" value="in" />
            <el-option label="出口" value="out" />
            <el-option label="双向" value="both" />
          </el-select>
          <el-button type="primary" @click="loadGates">查询</el-button>
          <el-button @click="openGate()">新增车闸</el-button>
        </div>
        <el-table v-loading="loading" :data="gates" border>
          <el-table-column prop="deviceBarrierGateName" label="名称" min-width="160" />
          <el-table-column prop="deviceBarrierGateDeviceId" label="设备 ID" min-width="160" />
          <el-table-column prop="deviceBarrierGateChannelNo" label="通道号" width="90" />
          <el-table-column label="方向" width="90">
            <template #default="{ row }">{{ directionText(row.deviceBarrierGateDirection) }}</template>
          </el-table-column>
          <el-table-column prop="deviceBarrierGateStatus" label="状态" width="100" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openGate(row)">编辑</el-button>
              <el-button link type="danger" @click="removeGate(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="过车记录" name="pass">
        <div class="dvv-bar">
          <el-input v-model="passGateId" placeholder="车闸 ID" clearable style="width: 200px" />
          <el-select v-model="passDirection" placeholder="方向" clearable style="width: 140px">
            <el-option label="入场" value="in" />
            <el-option label="出场" value="out" />
          </el-select>
          <el-date-picker
            v-model="passRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
          <el-button type="primary" @click="loadPasses">查询</el-button>
        </div>
        <el-table v-loading="loading" :data="passes" border>
          <el-table-column prop="deviceVehiclePassPlateNo" label="车牌号" min-width="120" />
          <el-table-column prop="deviceVehiclePassGateId" label="车闸 ID" min-width="160" />
          <el-table-column label="方向" width="90">
            <template #default="{ row }">{{ directionText(row.deviceVehiclePassDirection) }}</template>
          </el-table-column>
          <el-table-column prop="deviceVehiclePassTime" label="过车时间" min-width="180" />
          <el-table-column prop="deviceVehiclePassVehicleType" label="车辆类型" width="120" />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="vehicleDialog.visible" :title="vehicleDialog.id ? '编辑车辆' : '新增车辆'" width="520px">
      <el-form :model="vehicleDialog.form" label-width="90px">
        <el-form-item label="车牌号" required>
          <el-input v-model="vehicleDialog.form.deviceVehiclePlateNo" />
        </el-form-item>
        <el-form-item label="车牌颜色">
          <el-input v-model="vehicleDialog.form.deviceVehiclePlateColor" />
        </el-form-item>
        <el-form-item label="车辆类型">
          <el-input v-model="vehicleDialog.form.deviceVehicleType" />
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
        <el-form-item label="备注">
          <el-input v-model="vehicleDialog.form.deviceVehicleRemark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="vehicleDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveVehicle">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="gateDialog.visible" :title="gateDialog.id ? '编辑车闸' : '新增车闸'" width="520px">
      <el-form :model="gateDialog.form" label-width="90px">
        <el-form-item label="名称" required>
          <el-input v-model="gateDialog.form.deviceBarrierGateName" />
        </el-form-item>
        <el-form-item label="设备 ID">
          <el-input v-model="gateDialog.form.deviceBarrierGateDeviceId" />
        </el-form-item>
        <el-form-item label="通道号">
          <el-input-number v-model="gateDialog.form.deviceBarrierGateChannelNo" :min="0" />
        </el-form-item>
        <el-form-item label="方向">
          <el-select v-model="gateDialog.form.deviceBarrierGateDirection" style="width: 100%">
            <el-option label="入口" value="in" />
            <el-option label="出口" value="out" />
            <el-option label="双向" value="both" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="gateDialog.form.deviceBarrierGateStatus" style="width: 100%">
            <el-option label="未知" value="unknown" />
            <el-option label="开" value="open" />
            <el-option label="关" value="closed" />
            <el-option label="离线" value="offline" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="gateDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveGate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 车辆与车闸页：车辆档案、车闸点位（方向）、过车记录。
 *
 * 数据来自 device-starter：
 *   - /api/device/vehicle/**  车辆 CRUD
 *   - /api/device/barrier/**  车闸 CRUD + /pass 过车记录
 *
 * @author CH
 * @since 4.0.0.51
 */
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deviceApi } from '../api/deviceApi'
import DeviceAccessRecordView from './DeviceAccessRecordView.vue'

const activeTab = ref<'access' | 'vehicle' | 'barrier' | 'pass'>('access')
const loading = ref(false)
const saving = ref(false)

const vehicles = ref<Record<string, any>[]>([])
const gates = ref<Record<string, any>[]>([])
const passes = ref<Record<string, any>[]>([])

const vehicleKeyword = ref('')
const gateDeviceId = ref('')
const gateDirection = ref('')
const passGateId = ref('')
const passDirection = ref('')
const passRange = ref<[string, string] | null>(null)

const vehicleDialog = reactive<{ visible: boolean; id: string; form: Record<string, any> }>({
  visible: false,
  id: '',
  form: {}
})
const gateDialog = reactive<{ visible: boolean; id: string; form: Record<string, any> }>({
  visible: false,
  id: '',
  form: {}
})

/** 方向文案 */
function directionText(value?: string) {
  if (value === 'in') return '入口/入场'
  if (value === 'out') return '出口/出场'
  if (value === 'both') return '双向'
  return '—'
}

/** 取分页行 */
function rowsOf(page: any): Record<string, any>[] {
  return page?.records ?? page?.data ?? []
}

async function loadVehicles() {
  loading.value = true
  try {
    vehicles.value = rowsOf(await deviceApi.pageVehicles({ page: 1, size: 200, keyword: vehicleKeyword.value }))
  } finally {
    loading.value = false
  }
}

async function loadGates() {
  loading.value = true
  try {
    gates.value = await deviceApi.listBarriers({ deviceId: gateDeviceId.value, direction: gateDirection.value })
  } finally {
    loading.value = false
  }
}

async function loadPasses() {
  loading.value = true
  try {
    passes.value = rowsOf(
      await deviceApi.pageVehiclePasses({
        page: 1,
        size: 200,
        gateId: passGateId.value,
        direction: passDirection.value,
        start: passRange.value?.[0],
        end: passRange.value?.[1]
      })
    )
  } finally {
    loading.value = false
  }
}

function reloadAll() {
  void loadVehicles()
  void loadGates()
  void loadPasses()
}

function onTabChange(name: string) {
  if (name === 'access') return
  if (name === 'vehicle') void loadVehicles()
  else if (name === 'barrier') void loadGates()
  else void loadPasses()
}

function openVehicle(row?: Record<string, any>) {
  vehicleDialog.id = row?.deviceVehicleId ?? ''
  vehicleDialog.form = row
    ? { ...row }
    : { deviceVehicleListType: 'normal', deviceVehiclePlateColor: '蓝' }
  vehicleDialog.visible = true
}

async function saveVehicle() {
  if (!vehicleDialog.form.deviceVehiclePlateNo) {
    ElMessage.warning('请填写车牌号')
    return
  }
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

function openGate(row?: Record<string, any>) {
  gateDialog.id = row?.deviceBarrierGateId ?? ''
  gateDialog.form = row
    ? { ...row }
    : { deviceBarrierGateDirection: 'both', deviceBarrierGateStatus: 'unknown' }
  gateDialog.visible = true
}

async function saveGate() {
  if (!gateDialog.form.deviceBarrierGateName) {
    ElMessage.warning('请填写车闸名称')
    return
  }
  saving.value = true
  try {
    if (gateDialog.id) {
      await deviceApi.updateBarrier(gateDialog.id, gateDialog.form)
    } else {
      await deviceApi.addBarrier(gateDialog.form)
    }
    ElMessage.success('已保存')
    gateDialog.visible = false
    await loadGates()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
  } finally {
    saving.value = false
  }
}

async function removeGate(row: Record<string, any>) {
  await ElMessageBox.confirm(`删除车闸「${row.deviceBarrierGateName}」？`, '确认', { type: 'warning' })
  await deviceApi.deleteBarrier(row.deviceBarrierGateId)
  ElMessage.success('已删除')
  await loadGates()
}

onMounted(() => {
  void loadVehicles()
  void loadGates()
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
  margin-bottom: 8px;
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
