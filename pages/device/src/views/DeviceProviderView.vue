<template>
  <div class="provider-page flex flex-col h-full">
    <header class="flex items-start justify-between gap-4 px-5 pt-5">
      <div class="min-w-0">
        <h2 class="text-xl font-semibold text-el-text">厂商接入</h2>
        <p class="text-sm text-el-text-secondary mt-1">
          登记各厂商平台的 AK/SK 接入凭据。同一厂商可配置多套账号，用于分区域同步设备与组织。
        </p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <el-button @click="refreshAll">
          <el-icon class="mr-1"><Refresh /></el-icon>刷新
        </el-button>
        <el-button @click="goLedger">
          <el-icon class="mr-1"><Monitor /></el-icon>设备台账
        </el-button>
        <el-button :loading="syncing" :disabled="!vendors.length" @click="syncDevices">
          <el-icon class="mr-1"><Refresh /></el-icon>同步设备
        </el-button>
        <el-button type="primary" :disabled="!vendors.length" @click="openCreate()">
          <el-icon class="mr-1"><Plus /></el-icon>新增凭据
        </el-button>
      </div>
    </header>

    <!-- 厂商能力卡片 -->
    <section class="px-5 pt-4">
      <div class="text-sm font-medium text-el-text mb-2">已接入厂商</div>
      <div v-if="vendors.length" class="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div
          v-for="vendor in vendors"
          :key="vendor.vendor"
          class="vendor-card"
          :class="{ 'is-active': credentialFilter === vendor.vendor }"
          @click="filterByVendor(vendor.vendor)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-base font-semibold text-el-text">{{ vendor.name }}</span>
                <el-tag size="small" effect="plain" type="info">{{ vendor.vendor }}</el-tag>
              </div>
              <p class="text-xs text-el-text-secondary mt-1 line-clamp-2">
                {{ vendor.description || '暂无厂商说明' }}
              </p>
            </div>
            <el-tag size="small" type="success" effect="plain">
              {{ credentialsOf(vendor.vendor).length }} 套凭据
            </el-tag>
          </div>

          <div class="flex flex-wrap items-center gap-1 mt-3">
            <el-tag
              v-for="cap in vendor.capabilities"
              :key="cap"
              size="small"
              effect="plain"
              type="primary"
            >
              {{ capabilityLabel(cap) }}
            </el-tag>
          </div>

          <div class="flex items-center justify-between mt-3 pt-3 border-t border-el-border-lighter">
            <span class="text-xs text-el-text-secondary">
              {{ vendor.platforms.length }} 个平台 · 默认离线阈值 {{ vendor.defaultOfflineThreshold }} 秒
            </span>
            <div class="flex items-center gap-1">
              <el-button
                v-if="vendor.capabilities.includes('ORG')"
                link
                size="small"
                :loading="orgSyncing"
                @click.stop="syncOrg"
              >
                同步组织
              </el-button>
              <el-button link type="primary" size="small" @click.stop="openCreate(vendor.vendor)">
                新增凭据
              </el-button>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-else description="未发现已注册的设备厂商，请确认后端 device 模块已启用。" :image-size="80" />
    </section>

    <!-- 凭据列表 -->
    <section class="flex-1 min-h-0 mx-5 mt-4 mb-4 flex flex-col">
      <div class="flex items-center justify-between mb-2">
        <div class="text-sm font-medium text-el-text">接入凭据</div>
        <div class="flex items-center gap-2">
          <el-select v-model="credentialFilter" clearable placeholder="全部厂商" class="w-40" @change="fetchCredentials">
            <el-option
              v-for="vendor in vendors"
              :key="vendor.vendor"
              :label="vendor.name"
              :value="vendor.vendor"
            />
          </el-select>
        </div>
      </div>

      <el-table v-loading="loading" :data="credentials" row-key="deviceCredentialId" height="100%" stripe>
        <el-table-column label="凭据名称" min-width="170">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <span class="font-medium text-el-text">{{ row.deviceCredentialName }}</span>
              <el-tag v-if="row.deviceCredentialIsDefault" size="small" type="warning" effect="plain">默认</el-tag>
            </div>
            <div class="text-xs text-el-text-secondary mt-0.5">{{ row.deviceCredentialRemark || '—' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="厂商 / 平台" min-width="170">
          <template #default="{ row }">
            <div class="text-sm text-el-text">{{ vendorLabel(row.deviceCredentialVendor) }}</div>
            <div class="text-xs text-el-text-secondary mt-0.5">
              {{ platformLabel(row.deviceCredentialVendor, row.deviceCredentialPlatformType) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="AK" min-width="170">
          <template #default="{ row }">
            <span class="font-mono text-xs text-el-text">{{ row.deviceCredentialAppKey || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="SK" min-width="150">
          <template #default="{ row }">
            <span class="font-mono text-xs text-el-text-secondary">
              {{ secretText(row) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="Base URL" min-width="180">
          <template #default="{ row }">
            <span class="text-xs text-el-text-secondary break-all">{{ row.deviceCredentialBaseUrl || '默认' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="离线阈值" width="100">
          <template #default="{ row }">
            <span class="text-xs text-el-text">{{ row.deviceCredentialOfflineThreshold ?? '—' }} 秒</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.deviceCredentialEnabled ? 'success' : 'info'" size="small" effect="plain">
              {{ row.deviceCredentialEnabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="150">
          <template #default="{ row }">
            <span class="text-xs text-el-text-secondary">{{ formatDateTime(row.deviceCredentialUpdatedAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="190" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              :loading="testingId === row.deviceCredentialId"
              @click="testCredential(row)"
            >
              测试连接
            </el-button>
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="removeCredential(row)">删除</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <div class="py-10 text-sm text-el-text-secondary">
            暂无接入凭据。选择厂商后点击「新增凭据」登记 AK/SK。
          </div>
        </template>
      </el-table>
    </section>

    <!-- 凭据表单 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingCredentialId ? '编辑凭据' : '新增凭据'"
      width="620px"
      destroy-on-close
    >
      <el-form :model="form" label-width="120px" label-position="right">
        <el-form-item label="厂商" required>
          <el-select v-model="form.deviceCredentialVendor" class="w-full" @change="onVendorChange">
            <el-option
              v-for="vendor in vendors"
              :key="vendor.vendor"
              :label="vendor.name"
              :value="vendor.vendor"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="平台">
          <el-select v-model="form.deviceCredentialPlatformType" class="w-full" @change="onPlatformChange">
            <el-option
              v-for="platform in currentPlatforms"
              :key="platform.code"
              :label="platform.name"
              :value="platform.code"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="凭据名称" required>
          <el-input v-model="form.deviceCredentialName" maxlength="64" placeholder="例如：华东区域主账号" @keyup.enter="submit" />
        </el-form-item>

        <el-form-item label="AppKey（AK）" required>
          <el-input v-model="form.deviceCredentialAppKey" maxlength="128" placeholder="平台应用的 AppKey" @keyup.enter="submit" />
        </el-form-item>

        <el-form-item label="AppSecret（SK）" :required="!editingCredentialId">
          <el-input
            v-model="form.deviceCredentialAppSecret"
            type="password"
            show-password
            maxlength="256"
            :placeholder="editingCredentialId ? '已配置，留空表示不修改' : '平台应用的 AppSecret'"
          />
          <div class="text-xs text-el-text-secondary mt-1">
            凭证由后端加密存储，接口不再回传明文。
          </div>
        </el-form-item>

        <el-form-item label="Base URL">
          <el-input v-model="form.deviceCredentialBaseUrl" maxlength="255" placeholder="留空使用平台默认地址" />
        </el-form-item>

        <el-form-item label="离线阈值">
          <el-input-number v-model="form.deviceCredentialOfflineThreshold" :min="5" :max="86400" :step="5" class="w-full" />
          <div class="text-xs text-el-text-secondary mt-1">超过该秒数未收到心跳判定为离线。</div>
        </el-form-item>

        <el-form-item label="选项">
          <div class="flex items-center gap-4">
            <el-checkbox v-model="form.deviceCredentialIsDefault">设为厂商默认</el-checkbox>
            <el-checkbox v-model="form.deviceCredentialEnabled">启用</el-checkbox>
          </div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="form.deviceCredentialRemark"
            type="textarea"
            :rows="2"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { message } from '@repo/core'
import { Monitor, Plus, Refresh } from '@element-plus/icons-vue'

import { deviceApi } from '@pages/device/src/api/deviceApi'
import { formatDateTime } from '@pages/device/src/utils/deviceFormat'
import type {
  DeviceCapability,
  DeviceVendorDescriptor,
  ProviderCredential
} from '@pages/device/src/types/device'

const router = useRouter()

const vendors = ref<DeviceVendorDescriptor[]>([])
const credentials = ref<ProviderCredential[]>([])
const credentialFilter = ref('')
const loading = ref(false)
const orgSyncing = ref(false)

const dialogVisible = ref(false)
const submitting = ref(false)
const syncing = ref(false)
const testingId = ref('')
const editingCredentialId = ref('')

const form = reactive({
  deviceCredentialVendor: '',
  deviceCredentialPlatformType: '',
  deviceCredentialName: '',
  deviceCredentialAppKey: '',
  deviceCredentialAppSecret: '',
  deviceCredentialBaseUrl: '',
  deviceCredentialOfflineThreshold: 60,
  deviceCredentialIsDefault: false,
  deviceCredentialEnabled: true,
  deviceCredentialRemark: ''
})

const currentVendor = computed(() =>
  vendors.value.find((item) => item.vendor === form.deviceCredentialVendor)
)
const currentPlatforms = computed(() => currentVendor.value?.platforms || [])

watch(
  () => form.deviceCredentialPlatformType,
  (code) => {
    const platform = currentPlatforms.value.find((item) => item.code === code)
    if (platform?.defaultBaseUrl && !form.deviceCredentialBaseUrl) {
      form.deviceCredentialBaseUrl = platform.defaultBaseUrl
    }
  }
)

function capabilityLabel(cap: DeviceCapability): string {
  const labels: Record<DeviceCapability, string> = {
    DEVICE: '设备',
    CHANNEL: '通道',
    MEDIA: '视频',
    PTZ: '云台',
    EVENT: '事件',
    ACCESS: '门禁',
    ORG: '组织',
    PARKING: '停车'
  }
  return labels[cap] || cap
}

function vendorLabel(vendor?: string): string {
  if (!vendor) return '—'
  return vendors.value.find((item) => item.vendor === vendor)?.name || vendor
}

function platformLabel(vendor: string, platform?: string): string {
  if (!platform) return 'SDK 直连'
  const descriptor = vendors.value.find((item) => item.vendor === vendor)
  return descriptor?.platforms.find((item) => item.code === platform)?.name || platform
}

function credentialsOf(vendor: string): ProviderCredential[] {
  return credentials.value.filter((item) => item.deviceCredentialVendor === vendor)
}

function secretText(row: ProviderCredential): string {
  if (row.deviceCredentialAppSecretMasked) return row.deviceCredentialAppSecretMasked
  return row.deviceCredentialAppSecretConfigured ? '已配置' : '未配置'
}

function filterByVendor(vendor: string) {
  credentialFilter.value = credentialFilter.value === vendor ? '' : vendor
  fetchCredentials()
}

async function fetchVendors() {
  try {
    vendors.value = (await deviceApi.listVendors()) || []
  } catch (err) {
    vendors.value = []
    message.error('加载厂商列表失败：' + errorText(err))
  }
}

async function fetchCredentials() {
  loading.value = true
  try {
    credentials.value = (await deviceApi.listCredentials(credentialFilter.value || undefined)) || []
  } catch (err) {
    credentials.value = []
    message.error('加载接入凭据失败：' + errorText(err))
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.deviceCredentialVendor = vendors.value[0]?.vendor || ''
  form.deviceCredentialPlatformType = vendors.value[0]?.platforms[0]?.code || ''
  form.deviceCredentialName = ''
  form.deviceCredentialAppKey = ''
  form.deviceCredentialAppSecret = ''
  form.deviceCredentialBaseUrl = vendors.value[0]?.platforms[0]?.defaultBaseUrl || ''
  form.deviceCredentialOfflineThreshold = vendors.value[0]?.defaultOfflineThreshold ?? 60
  form.deviceCredentialIsDefault = false
  form.deviceCredentialEnabled = true
  form.deviceCredentialRemark = ''
}

function openCreate(vendor?: string) {
  editingCredentialId.value = ''
  resetForm()
  if (vendor) {
    form.deviceCredentialVendor = vendor
    const descriptor = vendors.value.find((item) => item.vendor === vendor)
    form.deviceCredentialPlatformType = descriptor?.platforms[0]?.code || ''
    form.deviceCredentialBaseUrl = descriptor?.platforms[0]?.defaultBaseUrl || ''
    form.deviceCredentialOfflineThreshold = descriptor?.defaultOfflineThreshold ?? 60
  }
  dialogVisible.value = true
}

function openEdit(row: ProviderCredential) {
  editingCredentialId.value = row.deviceCredentialId || ''
  form.deviceCredentialVendor = row.deviceCredentialVendor
  form.deviceCredentialPlatformType = row.deviceCredentialPlatformType || ''
  form.deviceCredentialName = row.deviceCredentialName
  form.deviceCredentialAppKey = row.deviceCredentialAppKey || ''
  form.deviceCredentialAppSecret = ''
  form.deviceCredentialBaseUrl = row.deviceCredentialBaseUrl || ''
  form.deviceCredentialOfflineThreshold = row.deviceCredentialOfflineThreshold ?? 60
  form.deviceCredentialIsDefault = !!row.deviceCredentialIsDefault
  form.deviceCredentialEnabled = row.deviceCredentialEnabled !== false
  form.deviceCredentialRemark = row.deviceCredentialRemark || ''
  dialogVisible.value = true
}

function onVendorChange() {
  const descriptor = currentVendor.value
  form.deviceCredentialPlatformType = descriptor?.platforms[0]?.code || ''
  form.deviceCredentialBaseUrl = descriptor?.platforms[0]?.defaultBaseUrl || ''
  form.deviceCredentialOfflineThreshold = descriptor?.defaultOfflineThreshold ?? 60
}

function onPlatformChange() {
  const platform = currentPlatforms.value.find((item) => item.code === form.deviceCredentialPlatformType)
  form.deviceCredentialBaseUrl = platform?.defaultBaseUrl || ''
}

async function submit() {
  if (!form.deviceCredentialVendor) {
    message.warning('请选择厂商')
    return
  }
  if (!form.deviceCredentialName.trim()) {
    message.warning('请填写凭据名称')
    return
  }
  if (!form.deviceCredentialAppKey.trim()) {
    message.warning('请填写 AppKey')
    return
  }
  if (!editingCredentialId.value && !form.deviceCredentialAppSecret.trim()) {
    message.warning('请填写 AppSecret')
    return
  }

  submitting.value = true
  try {
    const payload: Record<string, unknown> = {
      deviceCredentialVendor: form.deviceCredentialVendor,
      deviceCredentialPlatformType: form.deviceCredentialPlatformType || null,
      deviceCredentialName: form.deviceCredentialName.trim(),
      deviceCredentialAppKey: form.deviceCredentialAppKey.trim(),
      deviceCredentialBaseUrl: form.deviceCredentialBaseUrl.trim() || null,
      deviceCredentialOfflineThreshold: form.deviceCredentialOfflineThreshold,
      deviceCredentialIsDefault: form.deviceCredentialIsDefault,
      deviceCredentialEnabled: form.deviceCredentialEnabled,
      deviceCredentialRemark: form.deviceCredentialRemark.trim() || null
    }
    if (form.deviceCredentialAppSecret.trim()) {
      payload.deviceCredentialAppSecret = form.deviceCredentialAppSecret.trim()
    }

    if (editingCredentialId.value) {
      await deviceApi.updateCredential(editingCredentialId.value, payload)
      message.success('凭据已更新')
    } else {
      await deviceApi.createCredential(payload)
      message.success('凭据已创建')
    }
    dialogVisible.value = false
    await fetchCredentials()
  } catch (err) {
    message.error('保存凭据失败：' + errorText(err))
  } finally {
    submitting.value = false
  }
}

async function testCredential(row: ProviderCredential) {
  if (!row.deviceCredentialId) return
  testingId.value = row.deviceCredentialId
  try {
    const ok = await deviceApi.testCredential(row.deviceCredentialId)
    if (ok) {
      message.success(`「${row.deviceCredentialName}」连接成功`)
    } else {
      message.warning(`「${row.deviceCredentialName}」连接失败，请检查 AK/SK 与平台地址`)
    }
  } catch (err) {
    message.error('连接测试失败：' + errorText(err))
  } finally {
    testingId.value = ''
  }
}

async function removeCredential(row: ProviderCredential) {
  if (!row.deviceCredentialId) return
  try {
    await ElMessageBox.confirm(
      `确认删除凭据「${row.deviceCredentialName}」？已绑定该凭据的设备需要重新选择。`,
      '删除凭据',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  try {
    await deviceApi.deleteCredential(row.deviceCredentialId)
    message.success('凭据已删除')
    await fetchCredentials()
  } catch (err) {
    message.error('删除凭据失败：' + errorText(err))
  }
}

async function syncOrg() {
  orgSyncing.value = true
  try {
    await deviceApi.syncOrg()
    message.success('组织同步完成，可在设备台账的「组织管理」查看')
  } catch (err) {
    message.error('组织同步失败：' + errorText(err))
  } finally {
    orgSyncing.value = false
  }
}

function refreshAll() {
  fetchVendors()
  fetchCredentials()
}

async function syncDevices() {
  syncing.value = true
  try {
    const result = await deviceApi.syncDevices()
    message.success(
      `同步完成：新增 ${result.created}，更新 ${result.updated}，跳过 ${result.skipped}`
    )
    await fetchVendors()
  } catch (err) {
    message.error('同步设备失败：' + errorText(err))
  } finally {
    syncing.value = false
  }
}

function goLedger() {
  router.push('/device')
}

function errorText(err: unknown): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    || (err as Error)?.message
    || '未知错误'
}

onMounted(() => {
  refreshAll()
})
</script>

<style scoped>
.provider-page {
  background: var(--el-bg-color);
}
.vendor-card {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color-overlay);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}
.vendor-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}
.vendor-card.is-active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
