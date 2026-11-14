<template>
  <ReDialog
    v-model="visible"
    :title="isEdit ? '编辑设备' : '新增设备'"
    width="780"
    append-to-body
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="96px"
      class="device-form"
    >
      <div class="form-section">基本信息</div>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="设备名称" prop="deviceInfoName">
            <el-input v-model="form.deviceInfoName" placeholder="如 1 号楼门口枪机" maxlength="100" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="设备编码">
            <el-input v-model="form.deviceInfoCode" placeholder="资产编码/设备编号，可留空" maxlength="64" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属组织">
            <ReOrgTreeSelect v-model="form.deviceInfoOrgId" :data="orgTree" placeholder="选择组织" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="设备状态">
            <ReRadioGroup v-model="form.deviceInfoStatus">
              <ReRadio
                v-for="opt in DEVICE_STATUS_OPTIONS"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </ReRadio>
            </ReRadioGroup>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分类">
            <el-select v-model="form.deviceInfoCategory" class="w-full" @change="onCategoryChange">
              <el-option
                v-for="opt in CATEGORY_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="小类">
            <el-select v-model="form.deviceInfoSubCategory" class="w-full" clearable>
              <el-option
                v-for="opt in getSubCategoryOptions(form.deviceInfoCategory)"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="设备型号">
            <el-input v-model="form.deviceInfoModel" placeholder="如 DS-2CD3T46" maxlength="100" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="通道数">
            <el-input-number v-model="form.deviceInfoChannelCount" :min="0" :max="1024" class="w-full" />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="form-section">接入信息</div>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="厂商" prop="deviceInfoVendor">
            <el-select v-model="form.deviceInfoVendor" class="w-full" @change="onVendorChange">
              <el-option
                v-for="vendor in vendors"
                :key="vendor.vendor"
                :label="vendor.name"
                :value="vendor.vendor"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="接入方式" prop="authType">
            <ReRadioGroup v-model="form.authType" @change="onAuthTypeChange">
              <ReRadioButton
                v-for="auth in authTypes"
                :key="auth.code"
                :label="auth.code"
              >
                {{ auth.name }}
              </ReRadioButton>
            </ReRadioGroup>
          </el-form-item>
        </el-col>
      </el-row>

      <template v-if="form.authType === 'PLATFORM'">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="平台">
              <el-select v-model="form.platformType" class="w-full" @change="onPlatformChange">
                <el-option
                  v-for="platform in platforms"
                  :key="platform.code"
                  :label="platform.name"
                  :value="platform.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备序列号" prop="deviceSerial">
              <el-input v-model="form.deviceSerial" placeholder="输入平台设备序列号" maxlength="128" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="平台凭证">
              <el-select
                v-model="form.deviceInfoCredentialId"
                class="w-full"
                clearable
                placeholder="可选，使用该厂商默认凭证"
              >
                <el-option
                  v-for="item in credentialOptions"
                  :key="item.deviceCredentialId"
                  :label="credentialLabel(item)"
                  :value="item.deviceCredentialId as string"
                />
              </el-select>
              <div class="text-xs text-el-text-secondary mt-1">
                同一厂商可登记多个 AK/SK，
                <router-link to="/device/provider" class="text-el-primary">去厂商接入页管理</router-link>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <template v-else>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="IP 地址" prop="deviceInfoIp">
              <el-input v-model="form.deviceInfoIp" placeholder="192.168.1.64" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="端口">
              <el-input-number v-model="form.deviceInfoPort" :min="1" :max="65535" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户名">
              <el-input v-model="form.deviceInfoUsername" placeholder="admin" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密码">
              <el-input
                v-model="form.deviceInfoPassword"
                type="password"
                show-password
                :placeholder="isEdit ? '留空则不修改' : '设备密码'"
                maxlength="128"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="序列号">
              <el-input v-model="form.deviceInfoSerial" placeholder="设备序列号" maxlength="128" />
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <div class="form-section">资产与位置</div>
      <el-row :gutter="16">
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
        <el-col :span="8">
          <el-form-item label="区域/楼层">
            <el-input v-model="form.deviceInfoArea" placeholder="如 A 栋 1 层" maxlength="128" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
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
        <el-col :span="8">
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
        <el-col :span="12">
          <el-form-item label="标签">
            <el-input v-model="form.deviceInfoTags" placeholder="逗号分隔，如 重点、室外" maxlength="255" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="离线阈值">
            <el-input-number
              v-model="form.deviceInfoOfflineThreshold"
              :min="5"
              :max="86400"
              :step="5"
              class="w-full"
            />
            <span class="text-xs text-el-text-secondary ml-2">秒</span>
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
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">
        {{ isEdit ? '保存' : '保存并连接' }}
      </el-button>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { message } from '@repo/core'
import type { FormInstance, FormRules } from 'element-plus'
import ReDialog from '@repo/ui/re-dialog'
import { ReRadio, ReRadioGroup, ReRadioButton } from '@repo/ui/re-kit';
import { deviceApi } from '../api/deviceApi'
import ReOrgTreeSelect from '../components/ReOrgTreeSelect.vue'
import { CATEGORY_OPTIONS, getSubCategoryOptions } from '../utils/deviceCategory'
import { DEVICE_STATUS_OPTIONS } from '../utils/deviceFormat'
import type {
  DeviceCategory,
  DeviceInfo,
  DeviceStatus,
  DeviceVendorDescriptor,
  OrgNode,
  ProviderCredential
} from '../types/device'

const props = defineProps<{
  modelValue: boolean
  device?: DeviceInfo | null
  vendors: DeviceVendorDescriptor[]
  orgTree: OrgNode[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

interface DeviceFormModel {
  deviceInfoId?: string
  deviceInfoName: string
  deviceInfoCode: string
  deviceInfoOrgId: string
  deviceInfoVendor: string
  deviceInfoModel: string
  deviceInfoCategory: DeviceCategory
  deviceInfoSubCategory: string
  deviceInfoIp: string
  deviceInfoPort: number
  deviceInfoUsername: string
  deviceInfoPassword: string
  deviceInfoSerial: string
  deviceInfoFirmware: string
  deviceInfoChannelCount?: number
  deviceInfoLatitude?: number
  deviceInfoLongitude?: number
  deviceInfoAddress: string
  deviceInfoOfflineThreshold?: number
  deviceInfoCredentialId: string
  deviceInfoOwnerName: string
  deviceInfoOwnerDept: string
  deviceInfoOwnerPhone: string
  deviceInfoArea: string
  deviceInfoTags: string
  deviceInfoStatus: DeviceStatus
  deviceInfoRemark: string
  deviceInfoInstallAt: string
  deviceInfoWarrantyEnd: string
  authType: string
  platformType: string
  deviceSerial: string
}

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const isEdit = computed(() => Boolean(form.deviceInfoId))
const formRef = ref<FormInstance>()
const submitting = ref(false)
const credentials = ref<ProviderCredential[]>([])

/** 精讯云是传感器/继电器平台，新增时默认落到「其他」大类 */
const SENNOR_VENDOR = 'sennor'

function emptyForm(): DeviceFormModel {
  return {
    deviceInfoName: '',
    deviceInfoCode: '',
    deviceInfoOrgId: '',
    deviceInfoVendor: '',
    deviceInfoModel: '',
    deviceInfoCategory: 'camera',
    deviceInfoSubCategory: 'bullet',
    deviceInfoIp: '',
    deviceInfoPort: 8000,
    deviceInfoUsername: 'admin',
    deviceInfoPassword: '',
    deviceInfoSerial: '',
    deviceInfoFirmware: '',
    deviceInfoChannelCount: undefined,
    deviceInfoLatitude: undefined,
    deviceInfoLongitude: undefined,
    deviceInfoAddress: '',
    deviceInfoOfflineThreshold: 60,
    deviceInfoCredentialId: '',
    deviceInfoOwnerName: '',
    deviceInfoOwnerDept: '',
    deviceInfoOwnerPhone: '',
    deviceInfoArea: '',
    deviceInfoTags: '',
    deviceInfoStatus: 'normal',
    deviceInfoRemark: '',
    deviceInfoInstallAt: '',
    deviceInfoWarrantyEnd: '',
    authType: 'PLATFORM',
    platformType: '',
    deviceSerial: ''
  }
}

const form = reactive<DeviceFormModel>(emptyForm())

const vendorDescriptor = computed(() =>
  props.vendors.find((vendor) => vendor.vendor === form.deviceInfoVendor)
)
const authTypes = computed(() => vendorDescriptor.value?.authTypes || [])
const platforms = computed(() => vendorDescriptor.value?.platforms || [])
const credentialOptions = computed(() =>
  credentials.value.filter((item) => {
    if (item.deviceCredentialEnabled === false) return false
    if (!form.platformType) return true
    return (
      !item.deviceCredentialPlatformType ||
      item.deviceCredentialPlatformType === form.platformType
    )
  })
)

const rules: FormRules = {
  deviceInfoName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  deviceInfoVendor: [{ required: true, message: '请选择厂商', trigger: 'change' }],
  authType: [{ required: true, message: '请选择接入方式', trigger: 'change' }]
}

function initForm() {
  Object.assign(form, emptyForm())
  const device = props.device
  if (device) {
    Object.assign(form, {
      deviceInfoId: device.deviceInfoId,
      deviceInfoName: device.deviceInfoName || '',
      deviceInfoCode: device.deviceInfoCode || '',
      deviceInfoOrgId: device.deviceInfoOrgId || '',
      deviceInfoVendor: device.deviceInfoVendor || '',
      deviceInfoModel: device.deviceInfoModel || '',
      deviceInfoCategory: device.deviceInfoCategory || 'camera',
      deviceInfoSubCategory: device.deviceInfoSubCategory || '',
      deviceInfoIp: device.deviceInfoIp || '',
      deviceInfoPort: device.deviceInfoPort || 8000,
      deviceInfoUsername: device.deviceInfoUsername || 'admin',
      deviceInfoPassword: '',
      deviceInfoSerial: device.deviceInfoSerial || '',
      // 平台设备序列号与本地序列号共用后端 deviceInfoSerial 字段：
      // 编辑时必须回填，否则平台接入校验会判定为空而无法保存。
      deviceSerial: device.deviceInfoSerial || '',
      deviceInfoFirmware: device.deviceInfoFirmware || '',
      deviceInfoChannelCount: device.deviceInfoChannelCount,
      deviceInfoLatitude: device.deviceInfoLatitude,
      deviceInfoLongitude: device.deviceInfoLongitude,
      deviceInfoAddress: device.deviceInfoAddress || '',
      deviceInfoOfflineThreshold: device.deviceInfoOfflineThreshold ?? 60,
      deviceInfoCredentialId: device.deviceInfoCredentialId || '',
      deviceInfoOwnerName: device.deviceInfoOwnerName || '',
      deviceInfoOwnerDept: device.deviceInfoOwnerDept || '',
      deviceInfoOwnerPhone: device.deviceInfoOwnerPhone || '',
      deviceInfoArea: device.deviceInfoArea || '',
      deviceInfoTags: device.deviceInfoTags || '',
      deviceInfoStatus: device.deviceInfoStatus || 'normal',
      deviceInfoRemark: device.deviceInfoRemark || '',
      deviceInfoInstallAt: device.deviceInfoInstallAt || '',
      deviceInfoWarrantyEnd: device.deviceInfoWarrantyEnd || '',
      authType: device.deviceInfoIp ? 'SDK' : 'PLATFORM',
      platformType: ''
    })
    if (!device.deviceInfoCategory && device.deviceInfoVendor === SENNOR_VENDOR) {
      form.deviceInfoCategory = 'other'
      form.deviceInfoSubCategory = ''
    }
  } else {
    const vendor = props.vendors[0]
    if (vendor) {
      form.deviceInfoVendor = vendor.vendor
      form.authType = vendor.authTypes[0]?.code || 'PLATFORM'
      form.platformType = vendor.platforms[0]?.code || ''
      form.deviceInfoOfflineThreshold = vendor.defaultOfflineThreshold || 60
      applyVendorCategory(vendor)
    }
  }
  loadCredentials()
}

/**
 * 厂商切换后的表单默认值：精讯云设备没有视频通道，默认归到「其他」。
 *
 * @param vendor 厂商描述符
 */
function applyVendorCategory(vendor?: DeviceVendorDescriptor) {
  if (vendor?.vendor !== SENNOR_VENDOR) return
  form.deviceInfoCategory = 'other'
  form.deviceInfoSubCategory = ''
}

function onVendorChange() {
  const vendor = vendorDescriptor.value
  form.authType = vendor?.authTypes[0]?.code || 'PLATFORM'
  form.platformType = vendor?.platforms[0]?.code || ''
  form.deviceInfoOfflineThreshold = vendor?.defaultOfflineThreshold ?? 60
  applyVendorCategory(vendor)
  form.deviceInfoCredentialId = ''
  loadCredentials()
}

function onAuthTypeChange() {
  if (form.authType === 'SDK') {
    form.platformType = ''
    form.deviceInfoCredentialId = ''
    form.deviceSerial = ''
  } else {
    form.platformType = platforms.value[0]?.code || ''
    loadCredentials()
  }
}

function onPlatformChange() {
  form.deviceInfoCredentialId = ''
  loadCredentials()
}

function onCategoryChange() {
  const options = getSubCategoryOptions(form.deviceInfoCategory)
  form.deviceInfoSubCategory = options[0]?.value || ''
}

async function loadCredentials() {
  if (!form.deviceInfoVendor) {
    credentials.value = []
    return
  }
  try {
    credentials.value = ((await deviceApi.listCredentials(form.deviceInfoVendor)) as ProviderCredential[]) || []
  } catch {
    credentials.value = []
  }
}

function credentialLabel(item: ProviderCredential): string {
  const platform = item.deviceCredentialPlatformType || '通用'
  return `${item.deviceCredentialName}（${platform}${item.deviceCredentialIsDefault ? '，默认' : ''}）`
}

async function submit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  if (form.authType === 'PLATFORM' && !form.deviceSerial.trim() && !form.deviceInfoSerial.trim()) {
    message.warning('平台接入需要填写设备序列号')
    return
  }
  if (form.authType === 'SDK') {
    if (!form.deviceInfoIp.trim()) {
      message.warning('SDK 直连需要填写设备 IP')
      return
    }
    if (!isEdit.value && !form.deviceInfoPassword) {
      message.warning('新增 SDK 设备需要填写设备密码')
      return
    }
  }

  const payload: Record<string, unknown> = { ...form, connect: true }
  delete payload.deviceInfoId
  if (form.authType === 'SDK') {
    payload.platformType = undefined
    payload.deviceSerial = undefined
    payload.deviceInfoCredentialId = undefined
  } else {
    payload.deviceInfoIp = undefined
    payload.deviceInfoPort = undefined
    payload.deviceInfoUsername = undefined
    payload.deviceInfoPassword = undefined
    // 平台序列号是后端唯一序列号字段：优先取平台序列号输入，其次取本地序列号
    payload.deviceInfoSerial = form.deviceSerial || form.deviceInfoSerial
  }
  if (isEdit.value && !form.deviceInfoPassword) {
    delete payload.deviceInfoPassword
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      await deviceApi.update(form.deviceInfoId as string, payload)
      message.success('设备已更新')
    } else {
      await deviceApi.add(payload)
      message.success('设备已添加')
    }
    visible.value = false
    emit('saved')
  } catch (err: unknown) {
    const msg =
      (err as any)?.response?.data?.message ||
      (err as Error)?.message ||
      '未知错误'
    message.error((isEdit.value ? '更新失败: ' : '新增失败: ') + msg)
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) initForm()
  }
)
watch(
  () => props.device,
  () => {
    if (props.modelValue) initForm()
  }
)
</script>

<style scoped>
.device-form {
  max-height: 66vh;
  overflow: auto;
  padding-right: 8px;
}
.form-section {
  margin: 4px 0 12px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
