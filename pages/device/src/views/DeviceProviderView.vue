<template>
  <div class="dpv">
    <div class="dpv-body">
      <!-- ==================== 左：厂商导轨 ==================== -->
      <aside class="dpv-rail">
        <header class="dpv-rail__head">
          <span class="dpv-bar" />
          <span class="dpv-rail__title">提供商</span>
          <span class="dpv-count">{{ vendors.length }}</span>
          <span class="dpv-grow" />
          <ReButton
            icon="Plus"
            layout="square"
            size="small"
            type="primary"
            :disabled="!vendors.length"
            tip="新增凭据"
            @click="openCreate()"
          />
        </header>
        <p class="dpv-rail__desc">按厂商归档 AK/SK，同一厂商可按区域配多套账号。</p>

        <div class="dpv-vendors">
          <button
            type="button"
            class="dpv-vendor"
            :class="{ 'is-active': !credentialFilter }"
            @click="clearVendorFilter"
          >
            <span class="dpv-vendor__tile is-all"><ReIcon name="Grid" :size="14" /></span>
            <span class="dpv-vendor__body">
              <span class="dpv-vendor__name">全部厂商</span>
              <span class="dpv-vendor__meta">{{ vendors.length }} 家 · {{ credentials.length }} 套凭据</span>
            </span>
          </button>

          <button
            v-for="vendor in vendors"
            :key="vendor.vendor"
            type="button"
            class="dpv-vendor"
            :class="{ 'is-active': credentialFilter === vendor.vendor }"
            @click="filterByVendor(vendor.vendor)"
          >
            <span class="dpv-vendor__tile">{{ monogram(vendor.name) }}</span>
            <span class="dpv-vendor__body">
              <span class="dpv-vendor__name">{{ vendor.name }}</span>
              <span class="dpv-vendor__meta">{{ vendor.vendor }} · {{ credentialsOf(vendor.vendor).length }} 套</span>
            </span>
            <span class="dpv-vendor__caps" :title="capabilityTitle(vendor)">
              <i v-for="cap in CAP_ORDER" :key="cap" :class="{ 'is-on': vendor.capabilities.includes(cap) }" />
            </span>
          </button>

          <p v-if="!vendors.length" class="dpv-vendors__empty">
            未发现已注册的设备厂商，请确认后端 device 模块已启用。
          </p>
        </div>

        <footer class="dpv-rail__foot">
          <span class="dpv-live" />{{ enabledCount }} 启用
          <span class="dpv-sep" />
          {{ defaultCount }} 默认
          <span class="dpv-grow" />
          <ReButton
            v-if="canSyncOrg"
            icon="Connection"
            layout="square"
            size="small"
            :tip="activeVendor ? `同步「${activeVendor.name}」组织` : '同步全部厂商组织'"
            :loading="orgSyncing"
            @click="syncOrg"
          />
        </footer>
      </aside>

      <!-- ==================== 右：凭据表 + 底部条 ==================== -->
      <section class="dpv-work">
        <header class="dpv-work__head">
          <span class="dpv-bar" />
          <span class="dpv-work__title">接入凭据</span>
          <span class="dpv-count">{{ filteredCredentials.length }}</span>
          <button v-if="credentialFilter" type="button" class="dpv-filter" @click="clearVendorFilter">
            {{ vendorLabel(credentialFilter) }}
            <span class="dpv-filter__x">×</span>
          </button>
          <span class="dpv-grow" />
          <ReButton icon="Refresh" layout="square" size="small" tip="刷新" :loading="loading" @click="refreshAll" />
          <ReButton icon="Monitor" layout="square" size="small" tip="设备台账" @click="goLedger" />
          <ReButton
            icon="Refresh"
            size="small"
            :show-text="true"
            :loading="syncing"
            :disabled="!vendors.length"
            @click="syncDevices"
          >
            同步设备
          </ReButton>
          <ReButton
            icon="Plus"
            size="small"
            type="primary"
            :show-text="true"
            :disabled="!vendors.length"
            @click="openCreate()"
          >
            新增凭据
          </ReButton>
        </header>

        <div class="dpv-table-wrap">
          <ReTable
            class="dpv-table"
            table-id="device-provider-credentials"
            :data="tableRows"
            :columns="columns"
            :loading="loading"
            :pagination="false"
            :toolbar="false"
            row-key="deviceCredentialId"
            :layout-table="{ fill: true }"
            :settings="{ border: false, highlightCurrentRow: true }"
            stripe
            @row-click="onRowClick"
          >
            <template #col-credential="{ row }">
              <div class="dpv-cred">
                <div class="dpv-cred__top">
                  <span class="dpv-cred__name" :title="String(row.deviceCredentialName || '')">
                    {{ row.deviceCredentialName }}
                  </span>
                  <ReTag v-if="row.deviceCredentialIsDefault" size="small" effect="plain" type="warning">默认</ReTag>
                </div>
                <div class="dpv-cred__remark">{{ row.deviceCredentialRemark || '未填写备注' }}</div>
              </div>
            </template>

            <template #col-vendor="{ row }">
              <div class="dpv-cell">
                <span class="dpv-cell__main">{{ vendorLabel(String(row.deviceCredentialVendor || '')) }}</span>
                <span class="dpv-cell__sub">
                  {{ platformLabel(String(row.deviceCredentialVendor || ''), row.deviceCredentialPlatformType as string | undefined) }}
                </span>
              </div>
            </template>

            <template #col-ak="{ row }">
              <span class="dpv-mono" :title="String(row.deviceCredentialAppKey || '')">
                {{ row.deviceCredentialAppKey || '—' }}
              </span>
            </template>

            <template #col-status="{ row }">
              <ReTag :type="row.deviceCredentialEnabled ? 'success' : 'info'" size="small" effect="plain">
                {{ row.deviceCredentialEnabled ? '启用' : '停用' }}
              </ReTag>
            </template>

            <template #col-updated="{ row }">
              <span class="dpv-time">
                {{ formatDateTime(row.deviceCredentialUpdatedAt as string | undefined) }}
              </span>
            </template>

            <template #col-actions="{ row }">
              <span class="dpv-ops" @click.stop>
                <ReButton
                  layout="square"
                  type="primary"
                  size="small"
                  icon="Connection"
                  :loading="testingId === row.deviceCredentialId"
                  tip="测试连接"
                  @click="testCredential(asCredential(row))"
                />
                <ReButton
                  layout="square"
                  type="primary"
                  size="small"
                  icon="EditPen"
                  tip="编辑"
                  @click="openEdit(asCredential(row))"
                />
                <ReButton
                  layout="square"
                  type="danger"
                  size="small"
                  icon="Delete"
                  tip="删除"
                  @click="removeCredential(asCredential(row))"
                />
              </span>
            </template>

            <template #empty>
              <div class="dpv-ghost">
                <span class="dpv-ghost__icon"><ReIcon name="Connection" :size="20" /></span>
                <span class="dpv-ghost__title">
                  {{ credentialFilter ? '该厂商还没有接入凭据' : '还没有接入凭据' }}
                </span>
                <span class="dpv-ghost__text">
                  {{
                    credentialFilter
                      ? '同一厂商可以配置多套账号，按区域分别同步设备与组织。'
                      : '登记厂商平台的 AK/SK 后，就能同步设备、组织与通道。'
                  }}
                </span>
                <ReButton
                  icon="Plus"
                  size="small"
                  type="primary"
                  :show-text="true"
                  :disabled="!vendors.length"
                  @click="openCreate(credentialFilter || undefined)"
                >
                  新增凭据
                </ReButton>
              </div>
            </template>
          </ReTable>
        </div>

        <footer class="dpv-foot">
          <template v-if="activeCredential">
            <span class="dpv-foot__name" :title="activeCredential.deviceCredentialName">
              {{ activeCredential.deviceCredentialName }}
            </span>
            <ReTag v-if="activeCredential.deviceCredentialIsDefault" size="small" effect="plain" type="warning">默认</ReTag>
            <ReTag :type="activeCredential.deviceCredentialEnabled ? 'success' : 'info'" size="small" effect="plain">
              {{ activeCredential.deviceCredentialEnabled ? '启用' : '停用' }}
            </ReTag>
            <span class="dpv-foot__sep" />
            <span class="dpv-foot__item">
              <span class="dpv-foot__k">AK</span>
              <span class="dpv-mono">{{ activeCredential.deviceCredentialAppKey || '—' }}</span>
            </span>
            <span class="dpv-foot__item">
              <span class="dpv-foot__k">SK</span>
              <span class="dpv-mono">{{ secretText(activeCredential) }}</span>
            </span>
            <span class="dpv-foot__item dpv-foot__item--url">
              <span class="dpv-foot__k">Base URL</span>
              <span class="dpv-mono">{{ activeCredential.deviceCredentialBaseUrl || '平台默认' }}</span>
            </span>
            <span class="dpv-foot__item">
              <span class="dpv-foot__k">阈值</span>
              <span>{{ activeCredential.deviceCredentialOfflineThreshold ?? '—' }} 秒</span>
            </span>
            <span class="dpv-grow" />
            <span class="dpv-foot__tools">
              <ReButton
                v-if="syncEntry.device"
                layout="square"
                size="small"
                type="primary"
                icon="Refresh"
                :loading="credSyncLoading('device')"
                tip="同步设备"
                @click="syncCredential('device')"
              />
              <ReButton
                v-if="syncEntry.org"
                layout="square"
                size="small"
                type="primary"
                icon="Grid"
                :loading="credSyncLoading('org')"
                tip="同步组织"
                @click="syncCredential('org')"
              />
              <ReButton
                v-if="syncEntry.person"
                layout="square"
                size="small"
                type="primary"
                icon="User"
                :loading="credSyncLoading('person')"
                tip="同步人员"
                @click="syncCredential('person')"
              />
            </span>
            <ReButton
              icon="Connection"
              size="small"
              :show-text="true"
              :loading="testingId === activeCredential.deviceCredentialId"
              @click="testCredential(activeCredential)"
            >
              测试连接
            </ReButton>
            <ReButton size="small" @click="openEdit(activeCredential)">编辑</ReButton>
          </template>

          <template v-else>
            <span class="dpv-foot__name">共 {{ credentials.length }} 套凭据</span>
            <span class="dpv-foot__sep" />
            <span class="dpv-foot__item">启用 {{ enabledCount }}</span>
            <span class="dpv-foot__item">默认 {{ defaultCount }}</span>
            <span class="dpv-foot__item">厂商 {{ vendors.length }}</span>
            <span class="dpv-grow" />
            <span class="dpv-foot__hint">点选一条凭据，在这里查看 AK / SK / Base URL 与阈值</span>
          </template>
        </footer>
      </section>
    </div>

    <!-- ==================== 凭据表单 ==================== -->
    <ReDialog
      v-model="dialogVisible"
      :title="editingCredentialId ? '编辑凭据' : '新增凭据'"
      width="640px"
      destroy-on-close
    >
      <el-form :model="form" label-position="top" class="dpv-form">
        <div class="dpv-form__grid">
          <el-form-item label="厂商" required>
            <el-select v-model="form.deviceCredentialVendor" class="dpv-w" placeholder="选择厂商" @change="onVendorChange">
              <el-option
                v-for="vendor in vendors"
                :key="vendor.vendor"
                :label="vendor.name"
                :value="vendor.vendor"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="平台">
            <el-select
              v-model="form.deviceCredentialPlatformType"
              class="dpv-w"
              placeholder="SDK 直连"
              @change="onPlatformChange"
            >
              <el-option
                v-for="platform in currentPlatforms"
                :key="platform.code"
                :label="platform.name"
                :value="platform.code"
              />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="凭据名称" required>
          <el-input v-model="form.deviceCredentialName" maxlength="64" placeholder="例如：华东区域主账号" @keyup.enter="submit" />
        </el-form-item>

        <div class="dpv-form__grid">
          <el-form-item
            v-for="field in currentCredentialFields"
            :key="field.key"
            :label="field.label"
            :required="fieldFormRequired(field)"
          >
            <el-input
              :model-value="fieldFormValue(field)"
              @update:model-value="(v: string) => form[fieldFormKey(field)] = v"
              :type="field.secret ? 'password' : 'text'"
              :show-password="field.secret"
              :maxlength="256"
              :placeholder="field.placeholder"
              @keyup.enter="submit"
              class="dpv-w"
            />
          </el-form-item>
        </div>
        <p class="dpv-form__hint">凭证由后端加密存储，接口不回传明文；编辑时留空即保持原值。字段由厂商描述符（credentialFields）驱动，新增厂商无需改前端。</p>

        <el-form-item label="Base URL">
          <el-input v-model="form.deviceCredentialBaseUrl" maxlength="255" placeholder="留空使用平台默认地址" />
        </el-form-item>

        <div class="dpv-form__grid">
          <el-form-item label="离线阈值（秒，超时判离线）">
            <el-input-number
              v-model="form.deviceCredentialOfflineThreshold"
              :min="5"
              :max="86400"
              :step="5"
              class="dpv-w"
            />
          </el-form-item>
          <el-form-item label="选项">
            <div class="dpv-checks">
              <el-checkbox v-model="form.deviceCredentialIsDefault">设为厂商默认</el-checkbox>
              <el-checkbox v-model="form.deviceCredentialEnabled">启用</el-checkbox>
            </div>
          </el-form-item>
        </div>

        <!-- 高级配置：该凭据维度的自动任务开关与间隔（默认全部关闭） -->
        <div class="dpv-adv">
          <header class="dpv-adv__head">
            <ReIcon name="Timer" :size="15" />
            <span class="dpv-adv__title">高级配置（定时任务开关）</span>
          </header>
          <p class="dpv-adv__desc">打开开关后，该凭据维度的自动任务（在离线检测 / 设备同步 / 组织同步）由时间轮按下方间隔驱动；间隔留空或写 0 时沿用任务页上的间隔（没有则默认 30 秒），开关关闭则整个任务下线。</p>
          <div class="dpv-adv__grid">
            <div class="dpv-adv__row">
              <span class="dpv-adv__row__label">在离线检测</span>
              <el-switch v-model="form.deviceCredentialOfflineDetectEnabled" size="small" />
              <el-input-number
                v-model="form.deviceCredentialOfflineDetectInterval"
                :min="1"
                :max="86400"
                :step="5"
                size="small"
                :disabled="!form.deviceCredentialOfflineDetectEnabled"
                class="dpv-adv__row__input"
              />
              <span class="dpv-adv__row__unit">秒</span>
            </div>
            <div class="dpv-adv__row">
              <span class="dpv-adv__row__label">设备自动同步</span>
              <el-switch v-model="form.deviceCredentialDeviceSyncEnabled" size="small" />
              <el-input-number
                v-model="form.deviceCredentialDeviceSyncInterval"
                :min="1"
                :max="86400"
                :step="5"
                size="small"
                :disabled="!form.deviceCredentialDeviceSyncEnabled"
                class="dpv-adv__row__input"
              />
              <span class="dpv-adv__row__unit">秒</span>
            </div>
            <div class="dpv-adv__row">
              <span class="dpv-adv__row__label">组织自动同步</span>
              <el-switch v-model="form.deviceCredentialOrgSyncEnabled" size="small" />
              <el-input-number
                v-model="form.deviceCredentialOrgSyncInterval"
                :min="1"
                :max="86400"
                :step="5"
                size="small"
                :disabled="!form.deviceCredentialOrgSyncEnabled"
                class="dpv-adv__row__input"
              />
              <span class="dpv-adv__row__unit">秒</span>
            </div>
          </div>
        </div>

        <el-form-item label="备注">
          <el-input
            v-model="form.deviceCredentialRemark"
            type="textarea"
            :rows="2"
            maxlength="255"
            show-word-limit
            placeholder="选填，例如使用范围"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="submitting" @click="submit">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 提供商配置（Deck 布局，对齐设备资产页）
 *
 * 左侧厂商导轨按厂商归档凭据，右侧 ReTable 列出接入凭据；底部常驻条展示
 * 选中凭据的 AK / SK / Base URL / 阈值，并就近提供「测试连接 / 编辑」。
 *
 * 交互约定：
 *   - 点厂商只切换过滤（点「全部厂商」清空），不重新请求；
 *   - 点凭据行只选中，底部条跟随；每行仍有测试 / 编辑 / 删除；
 *   - 厂商能力用 8 点阵表示（设备 / 通道 / 视频 / 云台 / 事件 / 门禁 / 组织 / 停车），
 *     hover 有完整清单；「同步组织」只在当前厂商（或任一厂商）支持 ORG 时出现。
 *
 * 数据仍是一次性全量拉取 + 前端过滤：厂商数、凭据数、启用 / 默认计数在过滤态下
 * 也必须稳定，交给后端过滤会让左栏统计随筛选跳变。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { message } from '@repo/core'
import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReIcon from '@repo/ui/re-icon'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
import ReTag from '@repo/ui/re-tag'

import { deviceApi } from '@pages/device/src/api/deviceApi'
import { formatDateTime } from '@pages/device/src/utils/deviceFormat'
import type {
  CredentialFieldDescriptor,
  DeviceCapability,
  DeviceVendorDescriptor,
  ProviderCredential,
  SyncResult
} from '@pages/device/src/types/device'

const router = useRouter()

/** 能力固定顺序：点阵的列位与 tooltip 文案都按它来 */
const CAP_ORDER: DeviceCapability[] = [
  'DEVICE',
  'CHANNEL',
  'MEDIA',
  'PTZ',
  'EVENT',
  'ACCESS',
  'ORG',
  'PARKING'
]

const vendors = ref<DeviceVendorDescriptor[]>([])
/** 全量凭据（不再带 vendor 查参，过滤在前端做，统计才稳定） */
const credentials = ref<ProviderCredential[]>([])
const credentialFilter = ref('')
const loading = ref(false)
const orgSyncing = ref(false)

const dialogVisible = ref(false)
const submitting = ref(false)
const syncing = ref(false)
const testingId = ref('')
const editingCredentialId = ref('')

/** 底部条跟随的凭据 */
const activeCredentialId = ref('')

/** 凭据表单：描述符字段通过索引签名回填到同一 object 里 */
interface FormPayload extends ProviderCredential {
  [key: string]: unknown
}

const form = reactive<FormPayload>({
  deviceCredentialVendor: '',
  deviceCredentialPlatformType: '',
  deviceCredentialName: '',
  deviceCredentialAppKey: '',
  deviceCredentialAppSecret: '',
  deviceCredentialBaseUrl: '',
  deviceCredentialProductCode: '',
  deviceCredentialProjectId: '',
  deviceCredentialOfflineThreshold: 60,
  deviceCredentialIsDefault: false,
  deviceCredentialEnabled: true,
  deviceCredentialRemark: ''
})

const currentVendor = computed(() =>
  vendors.value.find((item) => item.vendor === form.deviceCredentialVendor)
)
const currentPlatforms = computed(() => currentVendor.value?.platforms || [])

/** 描述符字段 key → form 属性名（字段名以 deviceCredential 为前缀） */
const CREDENTIAL_FIELD_BIND: Record<string, string> = {
  appKey: 'deviceCredentialAppKey',
  appSecret: 'deviceCredentialAppSecret',
  productCode: 'deviceCredentialProductCode',
  projectId: 'deviceCredentialProjectId',
  baseUrl: 'deviceCredentialBaseUrl'
}

/** 描述符字段 → form 中绑定的属性名 */
function fieldFormKey(field: CredentialFieldDescriptor): string {
  return CREDENTIAL_FIELD_BIND[field.key]
    ?? `deviceCredential${field.key.charAt(0).toUpperCase() + field.key.slice(1)}`
}

/** 字段的只读值 */
function fieldFormValue(field: CredentialFieldDescriptor): string {
  return String(form[fieldFormKey(field)] ?? '')
}

/** 字段是否必填（编辑时密钥留空即不修改） */
function fieldFormRequired(field: CredentialFieldDescriptor): boolean {
  if (!field.required) return false
  if (editingCredentialId.value && field.secret) return false
  return true
}

/** 当前平台描述符驱动的字段（不再写死 AK / SK） */
const currentCredentialFields = computed<CredentialFieldDescriptor[]>(
  () =>
    currentVendor.value?.platforms.find((item) => item.code === form.deviceCredentialPlatformType)
      ?.credentialFields || []
)

/** 凭据维度同步的加载态（device / org / person） */
const syncLoading = reactive({ device: false, org: false, person: false })

/** 当前过滤的厂商（「全部」时为 null） */
const activeVendor = computed(() =>
  vendors.value.find((item) => item.vendor === credentialFilter.value) || null
)

/** 过滤后的凭据（列表与底部条取值的唯一来源） */
const filteredCredentials = computed<ProviderCredential[]>(() => {
  if (!credentialFilter.value) return credentials.value
  return credentials.value.filter((item) => item.deviceCredentialVendor === credentialFilter.value)
})

const activeCredential = computed<ProviderCredential | null>(
  () => credentials.value.find((item) => item.deviceCredentialId === activeCredentialId.value) || null
)

const enabledCount = computed(() => credentials.value.filter((item) => item.deviceCredentialEnabled !== false).length)
const defaultCount = computed(() => credentials.value.filter((item) => item.deviceCredentialIsDefault).length)

/** 当前厂商支持 ORG 才给「同步组织」；「全部」时任一厂商支持即可 */
const canSyncOrg = computed(() =>
  activeVendor.value
    ? activeVendor.value.capabilities.includes('ORG')
    : vendors.value.some((item) => item.capabilities.includes('ORG'))
)

/* ==================== 凭据表（ReTable） ==================== */
/** ReTable 只收 Record 数组，真实结构是 ProviderCredential */
const tableRows = computed<Array<Record<string, unknown>>>(
  () => filteredCredentials.value as unknown as Array<Record<string, unknown>>
)

const columns: ReTableColumn[] = [
  { prop: 'deviceCredentialName', label: '凭据名称', slot: 'credential', minWidth: 230 },
  { prop: 'deviceCredentialVendor', label: '厂商 / 平台', slot: 'vendor', minWidth: 190 },
  { prop: 'deviceCredentialAppKey', label: 'AK', slot: 'ak', minWidth: 160 },
  {
    prop: 'deviceCredentialOfflineThreshold',
    label: '阈值',
    width: 84,
    align: 'center',
    formatter: (row) =>
      row.deviceCredentialOfflineThreshold == null ? '—' : `${row.deviceCredentialOfflineThreshold} 秒`
  },
  { prop: 'deviceCredentialEnabled', label: '状态', slot: 'status', width: 84 },
  { prop: 'deviceCredentialUpdatedAt', label: '更新时间', slot: 'updated', minWidth: 140 },
  { prop: 'deviceCredentialActions', label: '操作', slot: 'actions', width: 158, fixed: 'right' }
]

function asCredential(row: Record<string, unknown>): ProviderCredential {
  return row as unknown as ProviderCredential
}

function onRowClick(row: Record<string, unknown>): void {
  activeCredentialId.value = String(row.deviceCredentialId || '')
}

/** 过滤变化 / 刷新后把选中态落回列表里的第一条，避免底部条指向不存在的行 */
function syncActiveCredential(): void {
  const list = filteredCredentials.value
  if (list.some((item) => item.deviceCredentialId === activeCredentialId.value)) return
  activeCredentialId.value = list[0]?.deviceCredentialId || ''
}

watch(credentialFilter, syncActiveCredential)

/* ==================== 展示辅助 ==================== */
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

/** 厂商首字（中文取首字，英文取首字母） */
function monogram(name?: string): string {
  const text = (name || '').trim()
  return text ? text.slice(0, 1) : '?'
}

/** 8 点阵的悬浮清单：支持 / 不支持都写清楚，避免只靠颜色猜 */
function capabilityTitle(vendor: DeviceVendorDescriptor): string {
  return CAP_ORDER.map((cap) => `${capabilityLabel(cap)}${vendor.capabilities.includes(cap) ? ' ✓' : ' ✗'}`).join(
    ' · '
  )
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

/* ==================== 过滤 ==================== */
function filterByVendor(vendor: string): void {
  credentialFilter.value = credentialFilter.value === vendor ? '' : vendor
}

function clearVendorFilter(): void {
  credentialFilter.value = ''
}

/* ==================== 数据 ==================== */
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
    credentials.value = (await deviceApi.listCredentials()) || []
    syncActiveCredential()
  } catch (err) {
    credentials.value = []
    activeCredentialId.value = ''
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
  form.deviceCredentialProductCode = ''
  form.deviceCredentialProjectId = ''
  form.deviceCredentialOfflineThreshold = vendors.value[0]?.defaultOfflineThreshold ?? 60
  form.deviceCredentialIsDefault = false
  form.deviceCredentialEnabled = true
  form.deviceCredentialOfflineDetectEnabled = false
  form.deviceCredentialOfflineDetectInterval = 30
  form.deviceCredentialDeviceSyncEnabled = false
  form.deviceCredentialDeviceSyncInterval = 30
  form.deviceCredentialOrgSyncEnabled = false
  form.deviceCredentialOrgSyncInterval = 30
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
  form.deviceCredentialProductCode = row.deviceCredentialProductCode || ''
  form.deviceCredentialProjectId = row.deviceCredentialProjectId || ''
  form.deviceCredentialOfflineThreshold = row.deviceCredentialOfflineThreshold ?? 60
  form.deviceCredentialIsDefault = !!row.deviceCredentialIsDefault
  form.deviceCredentialEnabled = row.deviceCredentialEnabled !== false
  form.deviceCredentialOfflineDetectEnabled = !!row.deviceCredentialOfflineDetectEnabled
  form.deviceCredentialOfflineDetectInterval = row.deviceCredentialOfflineDetectInterval ?? 30
  form.deviceCredentialDeviceSyncEnabled = !!row.deviceCredentialDeviceSyncEnabled
  form.deviceCredentialDeviceSyncInterval = row.deviceCredentialDeviceSyncInterval ?? 30
  form.deviceCredentialOrgSyncEnabled = !!row.deviceCredentialOrgSyncEnabled
  form.deviceCredentialOrgSyncInterval = row.deviceCredentialOrgSyncInterval ?? 30
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
  /** 描述符驱动的必填字段：任何 platform 的字段都走统一验证 */
  for (const field of currentCredentialFields.value) {
    if (fieldFormRequired(field) && !fieldFormValue(field)) {
      message.warning(`请填写 ${field.label}`)
      return
    }
  }

  submitting.value = true
  try {
    const payload: Record<string, unknown> = {
      deviceCredentialVendor: form.deviceCredentialVendor,
      deviceCredentialPlatformType: form.deviceCredentialPlatformType || null,
      deviceCredentialName: form.deviceCredentialName.trim(),
      deviceCredentialBaseUrl: String(form.deviceCredentialBaseUrl || '').trim() || null,
      deviceCredentialOfflineThreshold: form.deviceCredentialOfflineThreshold,
      deviceCredentialIsDefault: form.deviceCredentialIsDefault,
      deviceCredentialEnabled: form.deviceCredentialEnabled,
      deviceCredentialOfflineDetectEnabled: !!form.deviceCredentialOfflineDetectEnabled,
      deviceCredentialOfflineDetectInterval: form.deviceCredentialOfflineDetectInterval,
      deviceCredentialDeviceSyncEnabled: !!form.deviceCredentialDeviceSyncEnabled,
      deviceCredentialDeviceSyncInterval: form.deviceCredentialDeviceSyncInterval,
      deviceCredentialOrgSyncEnabled: !!form.deviceCredentialOrgSyncEnabled,
      deviceCredentialOrgSyncInterval: form.deviceCredentialOrgSyncInterval,
      deviceCredentialRemark: String(form.deviceCredentialRemark || '').trim() || null
    }
    /** 描述符驱动的字段：非空即回填，未提交的字段不加 key（不传 null） */
    for (const field of currentCredentialFields.value) {
      const value = fieldFormValue(field)
      if (!value) continue
      payload[fieldFormKey(field)] = value
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

/** 厂商侧能力位：决定凭据维度同步入口的显隐 */
function canSyncVendor(vendor: string, kind: 'device' | 'org' | 'person'): boolean {
  const descriptor = vendors.value.find((item) => item.vendor === vendor)
  if (!descriptor) return false
  switch (kind) {
    case 'device': return descriptor.capabilities.includes('DEVICE')
    case 'org':
    case 'person': return descriptor.capabilities.includes('ORG')
    default: return false
  }
}

/** 当前凭据身上有能力的入 textBox（device / org / person） */
const syncEntry = computed<{ device: boolean; org: boolean; person: boolean }>(() => {
  const credential = activeCredential.value
  if (!credential || !credential.deviceCredentialVendor) return { device: false, org: false, person: false }
  return {
    device: canSyncVendor(credential.deviceCredentialVendor, 'device'),
    org: canSyncVendor(credential.deviceCredentialVendor, 'org'),
    person: canSyncVendor(credential.deviceCredentialVendor, 'person')
  }
})

/** 凭据维度同步（按该套凭据建连，拉取设备的目录/组织/人员，不触其他厂商） */
async function syncCredential(kind: 'device' | 'org' | 'person') {
  const credential = activeCredential.value
  if (!credential || !credential.deviceCredentialId) {
    message.warning('请先选择一条凭据')
    return
  }
  syncLoading[kind] = true
  try {
    let result: SyncResult
    switch (kind) {
      case 'device':
        result = await deviceApi.syncDevicesByCredential(credential.deviceCredentialId)
        break
      case 'org':
        result = await deviceApi.syncOrgByCredential(credential.deviceCredentialId)
        break
      case 'person':
        result = await deviceApi.syncPersonsByCredential(credential.deviceCredentialId)
        break
      default:
        throw new Error('未知的同步方向')
    }
    message.success(
      `「${credential.deviceCredentialName}」同步完成：新增 ${result.created}，更新 ${result.updated}，跳过 ${result.skipped}`
    )
    await fetchCredentials()
  } catch (err) {
    message.error(`凭据维度同步失败：${errorText(err)}`)
  } finally {
    syncLoading[kind] = false
  }
}

/** 底部条 / 导轨的加载态 */
function credSyncLoading(kind: 'device' | 'org' | 'person'): boolean {
  return syncLoading[kind]
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
/* ============================================================
   提供商配置（Deck 布局）
   左：厂商导轨（含「全部厂商」）；右：凭据表 + 底部常驻条。
   吃满父容器高度，只有导轨与表格各自滚动；外层不再叠卡片/内边距，
   间距由宿主 .main 与本页 gap 提供。
   ============================================================ */
.dpv {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 10px 0 12px;
  box-sizing: border-box;
  color: var(--el-text-color-primary);
}

.dpv-body {
  display: flex;
  flex: 1 1 auto;
  gap: 12px;
  min-height: 0;
}

/* ============================================================
   左侧：厂商导轨
   ============================================================ */
.dpv-rail {
  display: flex;
  flex: none;
  flex-direction: column;
  width: 268px;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

.dpv-rail__head {
  display: flex;
  flex: none;
  align-items: center;
  gap: 7px;
  padding: 11px 12px 6px;
}

.dpv-bar {
  width: 4px;
  height: 14px;
  border-radius: 999px;
  background: var(--el-color-primary);
  flex: none;
}

.dpv-rail__title {
  font-size: 14px;
  font-weight: 600;
}

.dpv-count {
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
}

.dpv-grow {
  flex: 1;
  min-width: 0;
}

.dpv-rail__desc {
  flex: none;
  margin: 0;
  padding: 0 12px 9px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.dpv-vendors {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px;
}

.dpv-vendor {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 8px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.dpv-vendor + .dpv-vendor {
  margin-top: 2px;
}

.dpv-vendor:hover {
  background: var(--el-fill-color-light);
}

.dpv-vendor.is-active {
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}

.dpv-vendor__tile {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.dpv-vendor__tile.is-all {
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}

.dpv-vendor.is-active .dpv-vendor__tile {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.dpv-vendor__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.dpv-vendor__name {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dpv-vendor.is-active .dpv-vendor__name {
  color: var(--el-color-primary);
  font-weight: 600;
}

.dpv-vendor__meta {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 能力点阵：8 格，亮 = 支持；hover 有完整清单 */
.dpv-vendor__caps {
  display: grid;
  flex: none;
  grid-template-columns: repeat(4, 5px);
  gap: 2px;
}

.dpv-vendor__caps i {
  width: 5px;
  height: 5px;
  border-radius: 2px;
  background: var(--el-border-color);
}

.dpv-vendor__caps i.is-on {
  background: var(--el-color-primary);
}

.dpv-vendor.is-active .dpv-vendor__caps i {
  background: color-mix(in srgb, var(--el-color-primary) 22%, transparent);
}

.dpv-vendor.is-active .dpv-vendor__caps i.is-on {
  background: var(--el-color-primary);
}

.dpv-vendors__empty {
  margin: 0;
  padding: 22px 12px;
  font-size: 12px;
  line-height: 1.7;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.dpv-rail__foot {
  display: flex;
  flex: none;
  align-items: center;
  gap: 7px;
  padding: 6px 10px 6px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.dpv-live {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-success);
}

.dpv-sep {
  width: 1px;
  height: 10px;
  background: var(--el-border-color);
}

/* ============================================================
   右侧：凭据表 + 底部常驻条
   ============================================================ */
.dpv-work {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

.dpv-work__head {
  display: flex;
  flex: none;
  align-items: center;
  gap: 7px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.dpv-work__title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.dpv-filter {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 21px;
  padding: 0 7px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  color: var(--el-color-primary);
  font-size: 11px;
  cursor: pointer;
}

.dpv-filter__x {
  font-size: 12px;
  line-height: 1;
  opacity: 0.7;
}

.dpv-table-wrap {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
}

/* ReTable 自带卡片外壳与内边距，这里由外层卡片提供壳，故把它的壳抹平，
   避免「卡片套卡片 / 双层 16px 内距」 */
.dpv-table {
  flex: 1 1 0;
  min-height: 0;
  --rt-padding: 0;
  --rt-bg: transparent;
  border: none;
  border-radius: 0;
}

.dpv-table :deep(.re-table__main) {
  padding: 0;
}

.dpv-cred__top {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.dpv-cred__name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dpv-cred__remark {
  margin-top: 1px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dpv-cell {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.dpv-cell__main {
  font-size: 12.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dpv-cell__sub {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dpv-mono {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 11.5px;
  color: var(--el-text-color-regular);
}

.dpv-time {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.dpv-ops {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

/* 空态：与门禁记录的 ghost 卡同一套（虚线 + 浅底 + 图标块） */
.dpv-ghost {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  margin: 14px;
  padding: 26px 16px;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-xl, 16px);
  background: color-mix(in srgb, var(--el-text-color-primary) 2%, transparent);
  text-align: center;
}

.dpv-ghost__icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  color: var(--el-text-color-placeholder);
  background: color-mix(in srgb, var(--el-text-color-primary) 6%, transparent);
}

.dpv-ghost__title {
  font-size: 13.5px;
  font-weight: 600;
}

.dpv-ghost__text {
  max-width: 420px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

/* ============================================================
   底部常驻条
   ============================================================ */
.dpv-foot {
  display: flex;
  flex: none;
  align-items: center;
  gap: 9px;
  min-height: 42px;
  padding: 6px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter, #fafafa);
  font-size: 12px;
  color: var(--el-text-color-regular);
  overflow: hidden;
}

.dpv-foot__name {
  font-weight: 600;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dpv-foot__sep {
  flex: none;
  width: 1px;
  height: 12px;
  background: var(--el-border-color);
}

.dpv-foot__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  white-space: nowrap;
}

.dpv-foot__item--url {
  max-width: 260px;
  overflow: hidden;
}

/** 凭据维度的同步入口：与 AK / SK 行分组的内联按钮组 */
.dpv-foot__tools {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 6px;
  border-left: 1px solid var(--el-border-color-lighter);
}
.dpv-foot__item--url .dpv-mono {
  overflow: hidden;
  text-overflow: ellipsis;
}

.dpv-foot__k {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
}

.dpv-foot__hint {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

/* ============================================================
   表单
   ============================================================ */
.dpv-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 14px;
}

.dpv-w {
  width: 100%;
}

.dpv-form__hint {
  margin: -6px 0 10px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.dpv-checks {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  min-height: 32px;
}

/* 高级配置：该凭据维度的定时任务开关 + 间隔（默认全部关闭） */
.dpv-adv {
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.dpv-adv__head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dpv-adv__icon {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary);
}

.dpv-adv__title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dpv-adv__desc {
  margin: 0 0 10px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.dpv-adv__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0 16px;
}

.dpv-adv__row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dpv-adv__row__label {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.dpv-adv__row__input {
  flex: 1;
  width: 0;
}

.dpv-adv__row__unit {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 1100px) {
  .dpv-rail {
    width: 232px;
  }
  .dpv-foot__item--url {
    max-width: 160px;
  }
}
</style>
