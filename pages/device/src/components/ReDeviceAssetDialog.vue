<template>
  <ReDialog v-model="visible" :title="title" width="640px" destroy-on-close>
    <el-form :model="form" label-width="88px" class="device-asset-form">
      <!-- ============ 资产信息 ============ -->
      <template v-if="section === 'asset'">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="设备名称">
              <el-input v-model="form.deviceInfoName" placeholder="设备名称" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备编码">
              <el-input v-model="form.deviceInfoCode" placeholder="资产编码/设备编号" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备状态">
              <el-select v-model="form.deviceInfoStatus" class="w-full">
                <el-option
                  v-for="opt in DEVICE_STATUS_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标签">
              <el-input v-model="form.deviceInfoTags" placeholder="逗号分隔，如 重点、室外" maxlength="255" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="责任人">
              <el-input v-model="form.deviceInfoOwnerName" placeholder="姓名" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="部门">
              <el-input v-model="form.deviceInfoOwnerDept" placeholder="部门" maxlength="128" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="电话">
              <el-input v-model="form.deviceInfoOwnerPhone" placeholder="联系电话" maxlength="32" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="安装日期">
              <el-date-picker
                v-model="form.deviceInfoInstallAt"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="维保到期">
              <el-date-picker
                v-model="form.deviceInfoWarrantyEnd"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input
                v-model="form.deviceInfoRemark"
                type="textarea"
                :rows="2"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <!-- ============ 位置信息 ============ -->
      <template v-else>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="区域/楼层">
              <el-input v-model="form.deviceInfoArea" placeholder="如 A 栋 1 层 / 机房A" maxlength="128" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纬度">
              <el-input-number
                v-model="form.deviceInfoLatitude"
                :min="-90"
                :max="90"
                :precision="6"
                :step="0.000001"
                controls-position="right"
                class="w-full"
                placeholder="WGS84"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经度">
              <el-input-number
                v-model="form.deviceInfoLongitude"
                :min="-180"
                :max="180"
                :precision="6"
                :step="0.000001"
                controls-position="right"
                class="w-full"
                placeholder="WGS84"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="详细地址">
              <el-input v-model="form.deviceInfoAddress" placeholder="安装位置描述" maxlength="255" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <div class="device-asset-form__tip">
              <span>经纬度使用 WGS84；填上坐标后列表「位置」列才能打开地图。</span>
              <el-button v-if="hasCoord" link type="primary" @click="clearLocation">清除坐标</el-button>
            </div>
          </el-col>
        </el-row>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 设备「资产信息 / 位置信息」独立配置弹窗
 *
 * 设备行右键菜单分两项进入：资产信息（编码 / 状态 / 责任人 / 安装维保 / 标签 / 备注）
 * 与位置信息（区域 / 经纬度 / 详细地址）。两者各自只提交自己那部分字段，
 * 不碰接入参数（IP 密码、平台 AK/SK），避免误配置影响在跑的连接。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, reactive, ref, watch } from 'vue'
import { message } from '@repo/core'
import ReDialog from '@repo/ui/re-dialog'
import { deviceApi } from '@pages/device/src/api/deviceApi'
import { DEVICE_STATUS_OPTIONS } from '@pages/device/src/utils/deviceFormat'
import { hasLocation } from '@pages/device/src/utils/deviceFormat'
import type { DeviceInfo, DeviceStatus } from '@pages/device/src/types/device'

const props = defineProps<{
  modelValue: boolean
  device: DeviceInfo | null
  /** 配置分区：资产信息 / 位置信息 */
  section: 'asset' | 'location'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const title = computed(() => (props.section === 'asset' ? '配置资产信息' : '配置位置信息'))

const submitting = ref(false)

interface AssetForm {
  deviceInfoName: string
  deviceInfoCode: string
  deviceInfoOwnerName: string
  deviceInfoOwnerDept: string
  deviceInfoOwnerPhone: string
  deviceInfoTags: string
  deviceInfoStatus: DeviceStatus
  deviceInfoRemark: string
  deviceInfoInstallAt: string
  deviceInfoWarrantyEnd: string
  deviceInfoArea: string
  deviceInfoLatitude?: number
  deviceInfoLongitude?: number
  deviceInfoAddress: string
}

function emptyForm(): AssetForm {
  return {
    deviceInfoName: '',
    deviceInfoCode: '',
    deviceInfoOwnerName: '',
    deviceInfoOwnerDept: '',
    deviceInfoOwnerPhone: '',
    deviceInfoTags: '',
    deviceInfoStatus: 'normal',
    deviceInfoRemark: '',
    deviceInfoInstallAt: '',
    deviceInfoWarrantyEnd: '',
    deviceInfoArea: '',
    deviceInfoLatitude: undefined,
    deviceInfoLongitude: undefined,
    deviceInfoAddress: ''
  }
}

const form = reactive<AssetForm>(emptyForm())

function initForm(): void {
  Object.assign(form, emptyForm())
  const device = props.device
  if (!device) return
  Object.assign(form, {
    deviceInfoName: device.deviceInfoName || '',
    deviceInfoCode: device.deviceInfoCode || '',
    deviceInfoOwnerName: device.deviceInfoOwnerName || '',
    deviceInfoOwnerDept: device.deviceInfoOwnerDept || '',
    deviceInfoOwnerPhone: device.deviceInfoOwnerPhone || '',
    deviceInfoTags: device.deviceInfoTags || '',
    deviceInfoStatus: device.deviceInfoStatus || 'normal',
    deviceInfoRemark: device.deviceInfoRemark || '',
    deviceInfoInstallAt: device.deviceInfoInstallAt || '',
    deviceInfoWarrantyEnd: device.deviceInfoWarrantyEnd || '',
    deviceInfoArea: device.deviceInfoArea || '',
    deviceInfoLatitude: device.deviceInfoLatitude,
    deviceInfoLongitude: device.deviceInfoLongitude,
    deviceInfoAddress: device.deviceInfoAddress || ''
  })
}

function clearLocation(): void {
  form.deviceInfoLatitude = undefined
  form.deviceInfoLongitude = undefined
}

/** 表单里是否已有成对坐标（决定「清除坐标」是否可用） */
const hasCoord = computed(
  () => typeof form.deviceInfoLatitude === 'number' && typeof form.deviceInfoLongitude === 'number'
)

watch(
  () => props.modelValue,
  (open) => {
    if (open) initForm()
  }
)
watch(
  () => props.device?.deviceInfoId,
  () => {
    if (props.modelValue) initForm()
  }
)

/**
 * 只提交当前分区的字段。
 *
 * <p>后端 PUT /api/device/{id} 的 updateById 会忽略 null 字段，
 * 所以这里不必先回读整台设备，也不会把其它字段冲成空。</p>
 */
function buildPayload(): Record<string, unknown> {
  if (props.section === 'asset') {
    return {
      deviceInfoName: form.deviceInfoName.trim(),
      deviceInfoCode: form.deviceInfoCode.trim(),
      deviceInfoOwnerName: form.deviceInfoOwnerName.trim(),
      deviceInfoOwnerDept: form.deviceInfoOwnerDept.trim(),
      deviceInfoOwnerPhone: form.deviceInfoOwnerPhone.trim(),
      deviceInfoTags: form.deviceInfoTags.trim(),
      deviceInfoStatus: form.deviceInfoStatus,
      deviceInfoRemark: form.deviceInfoRemark,
      deviceInfoInstallAt: form.deviceInfoInstallAt || null,
      deviceInfoWarrantyEnd: form.deviceInfoWarrantyEnd || null
    }
  }
  return {
    deviceInfoArea: form.deviceInfoArea.trim(),
    deviceInfoLatitude: form.deviceInfoLatitude ?? null,
    deviceInfoLongitude: form.deviceInfoLongitude ?? null,
    deviceInfoAddress: form.deviceInfoAddress.trim()
  }
}

async function submit(): Promise<void> {
  const device = props.device
  if (!device) return
  if (props.section === 'asset' && !form.deviceInfoName.trim()) {
    message.warning('设备名称不能为空')
    return
  }
  if (
    props.section === 'location' &&
    ((form.deviceInfoLatitude ?? undefined) === undefined) !== ((form.deviceInfoLongitude ?? undefined) === undefined)
  ) {
    message.warning('经纬度需要成对填写')
    return
  }
  submitting.value = true
  try {
    await deviceApi.update(device.deviceInfoId, buildPayload())
    message.success(props.section === 'asset' ? '资产信息已保存' : '位置信息已保存')
    visible.value = false
    emit('saved')
  } catch (err: unknown) {
    const msg =
      (err as any)?.response?.data?.message || (err as Error)?.message || '未知错误'
    message.error('保存失败: ' + msg)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.device-asset-form {
  padding-right: 4px;
}
.device-asset-form__tip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-base);
}
</style>
