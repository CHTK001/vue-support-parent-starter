<template>
  <div class="dpv">
    <!-- 概览指标 -->
    <section class="dpv-kpis">
      <ReStatCard
        v-for="k in kpis"
        :key="k.key"
        size="compact"
        :title="k.title"
        :value="k.value"
        :desc="k.desc"
        :icon="k.icon"
        :icon-color="k.iconColor"
      />
    </section>

    <!-- 筛选与操作 -->
    <section class="dpv-filter">
      <div class="dpv-field dpv-field--vendor">
        <ReSelect v-model="filters.vendor" placeholder="全部厂商" clearable :options="vendorOptions" />
      </div>
      <div class="dpv-field">
        <ReSelect
          v-model="filters.platform"
          placeholder="全部平台"
          clearable
          :options="[...Object.values(VENDOR_PLATFORMS).flat(), SDK_PLATFORM]"
        />
      </div>
      <div class="dpv-field dpv-field--search">
        <ReInput v-model="filters.keyword" placeholder="搜索凭据名称" clearable prefix-icon="Search" />
      </div>
      <div class="dpv-filter__meta">
        <span class="dpv-badge">{{ filteredRows.length }}/{{ rows.length }} 套</span>
      </div>
      <div class="dpv-toolbar-ops">
        <ReButton icon="Plus" layout="square" type="primary" tip="新增凭据套" @click="openCreate" />
        <ReButton icon="RefreshRight" layout="square" tip="重新加载" :loading="loading" @click="fetchList" />
        <ReButton icon="Delete" layout="square" tip="重置筛选条件" @click="onResetFilters" />
      </div>
    </section>

    <!-- 错误提示 -->
    <div v-if="loadError" class="dpv-hintbar dpv-hintbar--err">
      <el-icon><InfoFilled /></el-icon>
      <span>{{ loadError }}</span>
      <ReButton icon="RefreshRight" layout="square" tip="重试" :loading="loading" @click="fetchList" />
    </div>

    <!-- 凭据卡网格 -->
    <div class="dpv-grid">
      <article
        v-for="row in filteredRows"
        :key="row.deviceCredentialId"
        class="pcard"
        :class="{ 'pcard--off': !row.deviceCredentialEnabled }"
      >
        <!-- 卡头：厂商图标 + 名称 + 启停 -->
        <div class="pcard__head">
          <div class="pcard__logo" :style="{ color: vendorColor(row), background: vendorBg(row) }">
            {{ vendorInitial(row) }}
          </div>
          <div class="pcard__title">
            <span class="pcard__name">{{ row.deviceCredentialName || '未命名凭据' }}</span>
            <span class="pcard__sub">{{ vendorLabel(row) }} · {{ platformLabel(row) }}</span>
          </div>
          <div class="pcard__switch" @click.stop>
            <el-switch
              :model-value="row.deviceCredentialEnabled !== false"
              size="small"
              @change="(v: boolean) => onToggleEnabled(row, v)"
            />
            <span class="pcard__switch-label" :class="row.deviceCredentialEnabled !== false ? 'on' : 'off'">
              {{ row.deviceCredentialEnabled !== false ? '启用' : '停用' }}
            </span>
          </div>
        </div>

        <!-- 关键信息 -->
        <dl class="pcard__info">
          <div class="pcard__row">
            <dt>AppKey</dt>
            <dd class="pcard__mono">{{ row.deviceCredentialAppKey || '—' }}</dd>
          </div>
          <div class="pcard__row">
            <dt>AppSecret</dt>
            <dd class="pcard__mono pcard__secret">
              <span>{{ secretOf(row) }}</span>
              <ReButton
                v-if="row.deviceCredentialAppSecret"
                :icon="revealed.has(row.deviceCredentialId || '') ? 'Hide' : 'View'"
                layout="square"
                :tip="revealed.has(row.deviceCredentialId || '') ? '隐藏 SK' : '显示 SK'"
                @click="toggleSecret(row)"
              />
            </dd>
          </div>
          <div v-if="row.deviceCredentialProductCode" class="pcard__row">
            <dt>ProductCode</dt>
            <dd class="pcard__mono">{{ row.deviceCredentialProductCode }}</dd>
          </div>
          <div v-if="row.deviceCredentialProjectId" class="pcard__row">
            <dt>ProjectID</dt>
            <dd class="pcard__mono">{{ row.deviceCredentialProjectId }}</dd>
          </div>
          <div class="pcard__row">
            <dt>Endpoint</dt>
            <dd class="pcard__mono">{{ row.deviceCredentialBaseUrl || '内置默认地址' }}</dd>
          </div>
          <div class="pcard__row">
            <dt>离线阈值</dt>
            <dd>{{ row.deviceCredentialOfflineThreshold ?? '—' }} 秒</dd>
          </div>
        </dl>

        <!-- 预留扩展信息位 -->
        <div class="pcard__extra">
          <template v-if="row.deviceCredentialRemark">
            <span class="pcard__extra-label">备注</span>
            <span class="pcard__extra-text">{{ row.deviceCredentialRemark }}</span>
          </template>
          <span v-else class="pcard__reserve">＋ 预留信息位</span>
        </div>

        <!-- 操作栏 -->
        <footer class="pcard__foot">
          <ReButton icon="EditPen" layout="square" tip="编辑凭据" @click="openEdit(row)" />
          <ReButton icon="Setting" layout="square" tip="高级设置" @click="openAdvanced(row)" />
          <div class="pcard__ops">
            <el-dropdown trigger="click" placement="bottom-end" @command="(cmd: string) => onCardCommand(cmd, row)">
              <ReButton icon="MoreFilled" layout="square" tip="更多操作" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="sync-devices">手动同步设备</el-dropdown-item>
                  <el-dropdown-item command="sync-org">手动同步组织</el-dropdown-item>
                  <el-dropdown-item command="advanced" divided>高级设置</el-dropdown-item>
                  <el-dropdown-item command="toggle-enabled">
                    {{ row.deviceCredentialEnabled !== false ? '停用凭据套' : '启用凭据套' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="edit">编辑凭据</el-dropdown-item>
                  <el-dropdown-item command="delete" divided style="color: var(--el-color-danger)">删除凭据</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <ReButton icon="Delete" layout="square" tip="删除凭据套" @click="onDelete(row)" />
          </div>
        </footer>
      </article>

      <!-- 空态提示卡 -->
      <article v-if="!loading && !filteredRows.length" class="pcard pcard--ghost">
        <div class="pcard__head">
          <div class="pcard__logo pcard__logo--ghost">?</div>
          <div class="pcard__title">
            <span class="pcard__name">{{ rows.length ? '没有匹配的凭据套' : '还没有接入厂商凭据' }}</span>
            <span class="pcard__sub">
              {{ rows.length ? '换个厂商 / 平台或清空关键字再试' : '登记厂商开放平台的 AK/SK 后即可接入设备' }}
            </span>
          </div>
        </div>
        <p class="pcard__ghost-text">
          同一 (厂商, 平台类型) 可登记多套凭据，例如按区域拆分的多个海康账号；设备可以来自多套凭据，
          离线阈值与自动同步都按套生效，互不干扰。
        </p>
      </article>

      <!-- 新增卡 -->
      <article class="pcard pcard--add" @click="openCreate">
        <span class="pcard__add-icon">
          <el-icon><Plus /></el-icon>
        </span>
        <span class="pcard__add-title">新增凭据套</span>
        <span class="pcard__add-sub">海康云耀 / 云眸 / 安防平台 · 大华云睿 / 乐橙 · SDK 直连</span>
      </article>
    </div>

    <!-- 新增 / 编辑对话框：双列布局，宽度加宽 -->
    <ReDialog
      v-model="dialogVisible"
      :title="editingId ? '编辑凭据套' : '新增凭据套'"
      width="720px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top" class="dpv-form dpv-form--two-col">
        <!-- 第一行：厂商 + 平台类型 -->
        <div class="dpv-form__row">
          <ReFormItem label="厂商" required class="dpv-form__cell">
            <ReSelect
              v-model="form.deviceCredentialVendor"
              :options="vendorOptions"
              style="width: 100%"
              :disabled="!!editingId"
              @change="onVendorChange"
            />
          </ReFormItem>
          <ReFormItem label="平台类型" required class="dpv-form__cell">
            <ReSelect
              v-model="form.deviceCredentialPlatformType"
              :options="[...platformOptions, SDK_PLATFORM]"
              style="width: 100%"
              :disabled="!!editingId"
            />
          </ReFormItem>
        </div>

        <!-- 第二行：凭据名称 + Endpoint -->
        <div class="dpv-form__row">
          <ReFormItem label="凭据名称" required class="dpv-form__cell">
            <ReInput v-model="form.deviceCredentialName" placeholder="如「华东区账号」" />
          </ReFormItem>
          <ReFormItem label="Endpoint" class="dpv-form__cell">
            <ReInput v-model="form.deviceCredentialBaseUrl" placeholder="留空使用内置默认地址" />
          </ReFormItem>
        </div>

        <!-- 平台模式：AppKey + AppSecret -->
        <template v-if="isPlatformMode">
          <div class="dpv-form__row">
            <ReFormItem label="AppKey (AK)" required class="dpv-form__cell">
              <ReInput v-model="form.deviceCredentialAppKey" placeholder="厂商开放平台分配的 AppKey" />
            </ReFormItem>
            <ReFormItem label="AppSecret (SK)" required class="dpv-form__cell">
              <ReInput
                v-model="form.deviceCredentialAppSecret"
                type="password"
                show-password
                placeholder="厂商开放平台分配的 AppSecret"
              />
            </ReFormItem>
          </div>

          <!-- 云曜专属：ProductCode + ProjectID -->
          <template v-if="form.deviceCredentialPlatformType === 'cloud-yao'">
            <div class="dpv-form__row">
              <ReFormItem label="产品编码 ProductCode" required class="dpv-form__cell">
                <ReInput v-model="form.deviceCredentialProductCode" placeholder="例如 1685925205802552" />
                <span class="dpv-hint">云曜按产品维度隔离设备，取流 / 云台 / 门禁接口都会带上</span>
              </ReFormItem>
              <ReFormItem label="项目 ID ProjectID" required class="dpv-form__cell">
                <ReInput v-model="form.deviceCredentialProjectId" placeholder="例如 422328139543160" />
              </ReFormItem>
            </div>
          </template>
        </template>

        <!-- 第三行：离线阈值 + 启用 + 备注（各占 1/3） -->
        <div class="dpv-form__row dpv-form__row--triple">
          <ReFormItem label="离线阈值" class="dpv-form__cell">
            <ReInputNumber
              v-model="form.deviceCredentialOfflineThreshold"
              :min="1"
              :max="86400"
              style="width: 100%"
            />
            <span class="dpv-hint">秒；只用这套接入的设备按此判定离线</span>
          </ReFormItem>
          <ReFormItem label="启用状态" class="dpv-form__cell">
            <div class="dpv-form__switch-row">
              <el-switch
                v-model="form.deviceCredentialEnabled"
                active-text="启用"
                inactive-text="停用"
                inline-prompt
              />
              <span class="dpv-form__switch-hint">
                {{ form.deviceCredentialEnabled ? '凭据立即生效' : '停用后设备会判定为离线' }}
              </span>
            </div>
          </ReFormItem>
          <ReFormItem label="备注" class="dpv-form__cell">
            <ReInput v-model="form.deviceCredentialRemark" placeholder="选填，展示在卡牌扩展信息位" />
          </ReFormItem>
        </div>

        <!-- SDK 说明 -->
        <template v-if="!isPlatformMode">
          <div class="dpv-sdk-hint">
            <el-icon><InfoFilled /></el-icon>
            SDK 局域网直连使用设备自身的 IP + 账号密码，无需 AK/SK，Endpoint 留空即可。
          </div>
        </template>
      </el-form>

      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="dialogSaving" @click="onSubmit">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 高级设置 -->
    <ReDialog v-model="advancedVisible" title="高级设置" width="620px" :close-on-click-modal="false">
      <el-form label-position="top" class="dpv-form">
        <ReFormItem label="凭据套">
          <div class="dpv-vendor">
            <span
              class="pcard__logo"
              :style="{
                color: vendorColor(advancedRow),
                background: vendorBg(advancedRow),
              }"
            >
              {{ vendorInitial(advancedRow) }}
            </span>
            <div class="pcard__title">
              <span class="pcard__name">{{ advancedRow?.deviceCredentialName || '未命名凭据' }}</span>
              <span class="pcard__sub">
                {{ vendorLabel(advancedRow) }} ·
                {{ platformLabel(advancedRow) }}
              </span>
            </div>
          </div>
        </ReFormItem>
        <div class="dpv-adv-row">
          <ReFormItem label="自动同步设备">
            <div class="dpv-adv-control">
              <el-switch v-model="advCfg.deviceSync" />
              <ReInputNumber
                v-if="advCfg.deviceSync"
                v-model="advCfg.deviceInterval"
                :min="5"
                :max="1440"
                style="width: 120px"
              />
              <span v-if="advCfg.deviceSync" class="dpv-hint">分钟 / 次</span>
            </div>
          </ReFormItem>
        </div>
        <div class="dpv-adv-row">
          <ReFormItem label="自动同步组织">
            <div class="dpv-adv-control">
              <el-switch v-model="advCfg.orgSync" />
              <ReInputNumber
                v-if="advCfg.orgSync"
                v-model="advCfg.orgInterval"
                :min="5"
                :max="1440"
                style="width: 120px"
              />
              <span v-if="advCfg.orgSync" class="dpv-hint">分钟 / 次</span>
            </div>
          </ReFormItem>
        </div>
      </el-form>
      <template #footer>
        <ReButton @click="advancedVisible = false">取消</ReButton>
        <ReButton icon="Refresh" layout="square" :loading="syncing" @click="onSyncOrg">同步组织</ReButton>
        <ReButton type="primary" :loading="advancedSaving" @click="onSaveAdvanced">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 提供商配置 —— 厂商自定义的 AK/SK 等接入参数，用卡牌呈现。
 *
 * 数据来自 device-starter 的 `/api/device/provider-credential/*`，落库表
 * `device_provider_credential`。同一 (厂商, 平台类型) 可登记**多套**凭据
 * （如多个海康账号分属不同区域），**没有「默认套」**：设备可以来自多套凭据，
 * 离线阈值、自动同步都按套生效。
 *
 * 可选平台类型直接对应后台 SPI 的实现：
 *   - hikvision：cloud-yao 云耀 / cloud-eye 云眸 / secure-platform 安防平台（另有 SDK 局域网直连）
 *   - dahua   ：dahua-cloud 云睿 / lechange 乐橙（另有 SDK 局域网直连）
 * SDK 直连走 IP+账号密码，不需要 AK/SK，故平台类型留空。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, CircleCheck, Grid, InfoFilled, Plus } from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReInput from '@repo/ui/re-input'
import ReInputNumber from '@repo/ui/re-input-number'
import { ReFormItem } from '@repo/ui/re-kit'
import ReSelect from '@repo/ui/re-select'
import ReStatCard from '@repo/ui/re-stat-card'

import deviceApi from '../api/deviceApi'
import type { ProviderCredential } from '../types/device'

/** 厂商码 → 中文名 */
const VENDOR_LABELS: Record<string, string> = {
  hikvision: '海康威视',
  dahua: '大华',
}

/** 各厂商支持的平台类型（取自后台 SPI） */
const VENDOR_PLATFORMS: Record<string, { value: string; label: string }[]> = {
  hikvision: [
    { value: 'cloud-yao', label: '云耀' },
    { value: 'cloud-eye', label: '云眸' },
    { value: 'secure-platform', label: '安防平台' },
  ],
  dahua: [
    { value: 'dahua-cloud', label: '云睿' },
    { value: 'lechange', label: '乐橙' },
  ],
}

/** 平台类型留空 = SDK 局域网直连 */
const SDK_PLATFORM = { value: '', label: 'SDK 直连' }

/** 厂商卡牌配色 */
const VENDOR_TINTS: Record<string, { color: string; bg: string }> = {
  hikvision: { color: 'var(--el-color-primary)', bg: 'var(--el-color-primary-light-9)' },
  dahua: { color: 'var(--el-color-success)', bg: 'var(--el-color-success-light-9)' },
}

/** 自动同步配置（本地 localStorage 持久化） */
interface ProviderAdvanced {
  deviceSync: boolean
  deviceInterval: number
  orgSync: boolean
  orgInterval: number
}

const ADVANCED_KEY = 'device:provider-advanced'
const DEFAULT_ADVANCED: ProviderAdvanced = { deviceSync: false, deviceInterval: 30, orgSync: true, orgInterval: 60 }

function loadAdvancedMap(): Record<string, ProviderAdvanced> {
  try {
    const raw = localStorage.getItem(ADVANCED_KEY)
    return raw ? (JSON.parse(raw) as Record<string, ProviderAdvanced>) : {}
  } catch {
    return {}
  }
}

const rows = ref<ProviderCredential[]>([])
const loading = ref(false)
const loadError = ref('')

/** 筛选 */
const filters = reactive({ vendor: '', platform: '', keyword: '' })

/** 已展开明文的 SK 卡牌 id 集合 */
const revealed = ref<Set<string>>(new Set())

function secretOf(row: ProviderCredential): string {
  if (!row.deviceCredentialAppSecret) return '—'
  if (revealed.value.has(row.deviceCredentialId || '')) return row.deviceCredentialAppSecret
  return row.deviceCredentialAppSecret.length > 6
    ? row.deviceCredentialAppSecret.slice(0, 3) + '****' + row.deviceCredentialAppSecret.slice(-3)
    : '****'
}

function toggleSecret(row: ProviderCredential) {
  const id = row.deviceCredentialId || ''
  if (revealed.value.has(id)) revealed.value.delete(id)
  else revealed.value.add(id)
}

/** 筛选后的卡列表 */
const filteredRows = computed(() =>
  rows.value.filter((r) => {
    if (filters.vendor && r.deviceCredentialVendor !== filters.vendor) return false
    if (filters.platform && r.deviceCredentialPlatformType !== filters.platform) return false
    if (filters.keyword && !(r.deviceCredentialName || '').toLowerCase().includes(filters.keyword.toLowerCase())) return false
    return true
  }),
)

/** KPI 统计 */
const kpis = computed(() => [
  {
    key: 'total',
    title: '凭据套数',
    value: String(rows.value.length),
    desc: `当前筛选 ${filteredRows.value.length} 套`,
    icon: 'Key',
    iconColor: 'var(--el-color-primary)',
  },
  {
    key: 'enabled',
    title: '已启用',
    value: String(rows.value.filter((r) => r.deviceCredentialEnabled !== false).length),
    desc: '停用的套不参与建连',
    icon: 'CircleCheck',
    iconColor: 'var(--el-color-success)',
  },
  {
    key: 'platform',
    title: '对接平台',
    value: String(new Set(rows.value.map((r) => r.deviceCredentialVendor).filter(Boolean)).size),
    desc: '含 SDK 直连，互不干扰',
    icon: 'Grid',
    iconColor: 'var(--el-color-warning)',
  },
])

/** 厂商下拉选项 */
const vendorOptions = Object.entries(VENDOR_LABELS).map(([value, label]) => ({ value, label }))

/** 当前选中厂商对应的平台类型 */
const platformOptions = computed(() => {
  const vendor = form.value.deviceCredentialVendor
  return VENDOR_PLATFORMS[vendor] || []
})

/** 是否平台接入模式 */
const isPlatformMode = computed(() => !!form.value.deviceCredentialPlatformType)

/** 当前选中厂商的配色 */
function vendorColor(row?: ProviderCredential | null): string {
  return VENDOR_TINTS[row?.deviceCredentialVendor || '']?.color || 'var(--el-text-color-secondary)'
}
function vendorBg(row?: ProviderCredential | null): string {
  return VENDOR_TINTS[row?.deviceCredentialVendor || '']?.bg || 'var(--el-fill-color-lighter)'
}
function vendorInitial(row?: ProviderCredential | null): string {
  const v = row?.deviceCredentialVendor || ''
  return VENDOR_LABELS[v]?.[0] || v[0]?.toUpperCase() || '?'
}
function vendorLabel(row?: ProviderCredential | null): string {
  return VENDOR_LABELS[row?.deviceCredentialVendor || ''] || row?.deviceCredentialVendor || '—'
}
function platformLabel(row?: ProviderCredential | null): string {
  if (!row?.deviceCredentialPlatformType) return 'SDK 直连'
  const vendor = row.deviceCredentialVendor
  const platforms = VENDOR_PLATFORMS[vendor] || []
  return platforms.find((p) => p.value === row.deviceCredentialPlatformType)?.label || row.deviceCredentialPlatformType
}

function errText(e: unknown): string {
  return ((e as any)?.response?.data?.message || (e as Error)?.message || '未知错误') as string
}

/** 加载凭据列表 */
async function fetchList() {
  loading.value = true
  loadError.value = ''
  try {
    rows.value = await deviceApi.listCredentials()
  } catch (e: unknown) {
    loadError.value = `加载失败：${errText(e)}`
  } finally {
    loading.value = false
  }
}

/** 凭据启停：优先专用接口，老后端退回全量更新 */
async function onToggleEnabled(row: ProviderCredential, next: boolean): Promise<void> {
  try {
    await deviceApi.updateCredentialEnabled(row.deviceCredentialId!, next)
  } catch {
    try {
      await deviceApi.updateCredential(row.deviceCredentialId!, { ...row, deviceCredentialEnabled: next })
    } catch (e: unknown) {
      ElMessage.error(`操作失败：${errText(e)}`)
      return
    }
  }
  ElMessage.success(next ? '凭据套已启用' : '凭据套已停用')
  await fetchList()
}

function onResetFilters() {
  filters.vendor = ''
  filters.platform = ''
  filters.keyword = ''
}

async function onSyncOrg() {
  try {
    await deviceApi.syncOrg()
    ElMessage.success('组织已同步')
  } catch (e: unknown) {
    ElMessage.error(`同步失败：${errText(e)}`)
  }
}

async function onSyncDevices(vendor: string) {
  try {
    const devs = await deviceApi.list()
    const arr = Array.isArray(devs) ? devs : []
    const count = arr.filter((d: any) => d.deviceInfoVendor === vendor).length
    ElMessage.success(`已同步 ${count} 台设备`)
  } catch (e: unknown) {
    ElMessage.error(`同步失败：${errText(e)}`)
  }
}

/** 表单相关 */
const dialogVisible = ref(false)
const dialogSaving = ref(false)
const editingId = ref('')

const blank = (): ProviderCredential =>
  ({
    deviceCredentialVendor: '',
    deviceCredentialPlatformType: 'cloud-yao',
    deviceCredentialName: '',
    deviceCredentialAppKey: '',
    deviceCredentialAppSecret: '',
    deviceCredentialProductCode: '',
    deviceCredentialProjectId: '',
    deviceCredentialBaseUrl: '',
    deviceCredentialOfflineThreshold: 60,
    deviceCredentialEnabled: true,
    deviceCredentialRemark: '',
  }) as ProviderCredential

const form = ref<ProviderCredential>(blank())

function openCreate() {
  editingId.value = ''
  form.value = blank()
  dialogVisible.value = true
}

function openEdit(row: ProviderCredential) {
  editingId.value = row.deviceCredentialId || ''
  form.value = {
    deviceCredentialVendor: row.deviceCredentialVendor,
    deviceCredentialPlatformType: row.deviceCredentialPlatformType,
    deviceCredentialName: row.deviceCredentialName,
    deviceCredentialAppKey: row.deviceCredentialAppKey,
    deviceCredentialAppSecret: row.deviceCredentialAppSecret,
    deviceCredentialProductCode: row.deviceCredentialProductCode,
    deviceCredentialProjectId: row.deviceCredentialProjectId,
    deviceCredentialBaseUrl: row.deviceCredentialBaseUrl,
    deviceCredentialOfflineThreshold: row.deviceCredentialOfflineThreshold,
    deviceCredentialEnabled: row.deviceCredentialEnabled !== false,
    deviceCredentialRemark: row.deviceCredentialRemark,
  } as ProviderCredential
  dialogVisible.value = true
}

function onVendorChange() {
  // 切换厂商后重置平台类型为该厂商第一个选项
  const first = platformOptions.value[0]
  if (first) form.value.deviceCredentialPlatformType = first.value
}

function nameInvalid() {
  return !(form.value.deviceCredentialName || '').trim()
}
function akSkInvalid() {
  if (!isPlatformMode.value) return false
  return !(form.value.deviceCredentialAppKey || '').trim() || !(form.value.deviceCredentialAppSecret || '').trim()
}
function cloudYaoInvalid() {
  if (form.value.deviceCredentialPlatformType !== 'cloud-yao') return false
  return !(form.value.deviceCredentialProductCode || '').trim() || !(form.value.deviceCredentialProjectId || '').trim()
}

async function onSubmit(): Promise<void> {
  if (nameInvalid()) {
    ElMessage.warning('请填写凭据名称')
    return
  }
  if (akSkInvalid()) {
    ElMessage.warning('平台接入需要填写 AppKey / AppSecret')
    return
  }
  if (cloudYaoInvalid()) {
    ElMessage.warning('云曜平台还需要填写 ProductCode / ProjectID')
    return
  }
  if ((form.value.deviceCredentialOfflineThreshold ?? 0) <= 0) {
    ElMessage.warning('离线阈值需大于 0 秒')
    return
  }
  dialogSaving.value = true
  try {
    const payload = {
      vendor: form.value.deviceCredentialVendor,
      platformType: form.value.deviceCredentialPlatformType || undefined,
      name: form.value.deviceCredentialName,
      appKey: form.value.deviceCredentialAppKey || undefined,
      appSecret: form.value.deviceCredentialAppSecret || undefined,
      productCode: form.value.deviceCredentialProductCode || undefined,
      projectId: form.value.deviceCredentialProjectId || undefined,
      baseUrl: form.value.deviceCredentialBaseUrl || undefined,
      offlineThreshold: form.value.deviceCredentialOfflineThreshold,
      enabled: form.value.deviceCredentialEnabled,
      remark: form.value.deviceCredentialRemark || undefined,
    }
    if (editingId.value) {
      await deviceApi.updateCredential(editingId.value, payload)
      ElMessage.success('凭据套已更新')
    } else {
      await deviceApi.createCredential(payload)
      ElMessage.success('凭据套已创建')
    }
    dialogVisible.value = false
    await fetchList()
  } catch (e: unknown) {
    ElMessage.error(`${editingId.value ? '更新' : '创建'}失败：${errText(e)}`)
  } finally {
    dialogSaving.value = false
  }
}

async function onDelete(row: ProviderCredential) {
  try {
    await ElMessageBox.confirm(`确认删除凭据套「${row.deviceCredentialName}」？删除后设备将无法通过此套接入。`, '删除确认', { type: 'warning' })
    await deviceApi.deleteCredential(row.deviceCredentialId!)
    ElMessage.success('凭据套已删除')
    await fetchList()
  } catch (e: unknown) {
    if ((e as any) !== 'cancel') ElMessage.error(`删除失败：${errText(e)}`)
  }
}

/** 卡片下拉菜单命令路由 */
function onCardCommand(cmd: string, row: ProviderCredential) {
  if (cmd === 'edit') openEdit(row)
  else if (cmd === 'advanced') openAdvanced(row)
  else if (cmd === 'toggle-enabled') onToggleEnabled(row, !(row.deviceCredentialEnabled !== false))
  else if (cmd === 'sync-devices') onSyncDevices(row.deviceCredentialVendor)
  else if (cmd === 'sync-org') { openAdvanced(row); void onSyncOrg() }
  else if (cmd === 'delete') onDelete(row)
}

/** 高级设置 */
const advancedVisible = ref(false)
const advancedRow = ref<ProviderCredential | null>(null)
const advCfg = ref<ProviderAdvanced>({ ...DEFAULT_ADVANCED })
const advancedSaving = ref(false)
const syncing = ref(false)

function openAdvanced(row: ProviderCredential) {
  advancedRow.value = row
  const saved = loadAdvancedMap()[row.deviceCredentialId || '']
  advCfg.value = saved ? { ...saved } : { ...DEFAULT_ADVANCED }
  advancedVisible.value = true
}

async function onSaveAdvanced() {
  if (!advancedRow.value) return
  advancedSaving.value = true
  try {
    const map = loadAdvancedMap()
    map[advancedRow.value.deviceCredentialId || ''] = { ...advCfg.value }
    localStorage.setItem(ADVANCED_KEY, JSON.stringify(map))
    ElMessage.success('高级设置已保存')
    advancedVisible.value = false
  } finally {
    advancedSaving.value = false
  }
}

onMounted(() => {
  void fetchList()
})
</script>

<style scoped>
.dpv {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 0 12px;
  height: 100%;
  min-height: 0;
  color: var(--el-text-color-primary);
}

/* ==================== KPI 区域 ==================== */
.dpv-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
}

/* ==================== 筛选工具栏 ==================== */
.dpv-filter {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-fill-color-light) 60%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 40%, transparent);
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
}
.dpv-filter::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, color-mix(in srgb, var(--el-color-primary) 6%, transparent) 0%, transparent 60%);
  pointer-events: none;
}

.dpv-field { width: 160px; }
.dpv-field--vendor { width: 190px; }
.dpv-field--search { width: 220px; margin-left: auto; }
.dpv-field :deep(.el-input),
.dpv-field :deep(.el-select) { width: 100%; }

.dpv-filter__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-left: auto;
}
.dpv-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
  font-weight: 600;
  font-size: 12px;
}

.dpv-toolbar-ops {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-left: 10px;
  border-left: 1px solid var(--el-border-color-lighter);
}

/* ==================== 错误提示栏 ==================== */
.dpv-hintbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.dpv-hintbar--err {
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  color: var(--el-color-danger);
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 30%, transparent);
}

/* ==================== 凭据网格 ==================== */
.dpv-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
  align-content: start;
  overflow-y: auto;
  padding-right: 2px;
}

/* ==================== 凭据卡 ==================== */
.pcard {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
  transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease, border-color 0.22s ease;
  position: relative;
  overflow: hidden;
  animation: pcard-in 0.3s ease-out both;
}
@keyframes pcard-in {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.pcard:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
  border-color: color-mix(in srgb, var(--el-color-primary) 40%, transparent);
}
.pcard::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--el-color-primary), color-mix(in srgb, var(--el-color-primary) 50%, var(--el-color-info)));
  opacity: 0;
  transition: opacity 0.2s;
}
.pcard:hover::before { opacity: 1; }

/* 停用态 */
.pcard--off {
  opacity: 0.62;
  filter: grayscale(0.4);
}
.pcard--off::before {
  background: linear-gradient(90deg, var(--el-text-color-placeholder), var(--el-border-color));
  opacity: 1;
}

/* 卡头 */
.pcard__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.pcard__logo {
  flex: none;
  width: 38px; height: 38px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 800;
  letter-spacing: -0.5px;
  transition: transform 0.2s;
}
.pcard:hover .pcard__logo { transform: scale(1.08); }
.pcard__logo--ghost { background: var(--el-fill-color); color: var(--el-text-color-placeholder); }

.pcard__title {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
}
.pcard__name {
  font-size: 14px; font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pcard__sub {
  font-size: 11.5px; color: var(--el-text-color-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* 启停开关 */
.pcard__switch {
  flex: none;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  cursor: pointer;
}
.pcard__switch-label {
  font-size: 10px; font-weight: 500; letter-spacing: 0.3px;
  transition: color 0.2s;
}
.pcard__switch-label.on { color: var(--el-color-success); }
.pcard__switch-label.off { color: var(--el-text-color-placeholder); }

/* 信息行 */
.pcard__info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  padding: 10px 14px;
  flex: 1;
}
.pcard__row {
  display: flex; flex-direction: column; gap: 3px;
  padding: 6px 0;
}
.pcard__row:nth-child(odd) { padding-right: 8px; }
.pcard__row:nth-child(even) { padding-left: 8px; border-left: 1px dashed var(--el-border-color-lighter); }
.pcard__row dt {
  font-size: 10.5px; color: var(--el-text-color-placeholder);
  text-transform: uppercase; letter-spacing: 0.5px;
}
.pcard__row dd {
  font-size: 12px; color: var(--el-text-color-primary);
  word-break: break-all;
}
.pcard__mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 11.5px;
  background: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: -0.3px;
}
.pcard__secret {
  display: flex; align-items: center; gap: 4px;
}

/* 扩展信息 */
.pcard__extra {
  padding: 8px 14px 6px;
  border-top: 1px dashed var(--el-border-color-lighter);
  display: flex; flex-direction: column; gap: 3px;
}
.pcard__extra-label {
  font-size: 10.5px; color: var(--el-text-color-placeholder);
  text-transform: uppercase; letter-spacing: 0.5px;
}
.pcard__extra-text { font-size: 12px; color: var(--el-text-color-secondary); }
.pcard__reserve { font-size: 11.5px; color: var(--el-text-color-placeholder); font-style: italic; }

/* 操作栏 */
.pcard__foot {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 14px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.pcard__ops { margin-left: auto; display: flex; align-items: center; gap: 4px; }

/* 空态提示卡 */
.pcard--ghost {
  align-items: center;
  text-align: center;
  padding: 24px 20px;
  background: color-mix(in srgb, var(--el-fill-color-light) 50%, transparent);
  border-style: dashed;
  animation: none;
}
.pcard--ghost:hover { transform: none; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.pcard--ghost .pcard__head { border: none; justify-content: center; }
.pcard--ghost .pcard__title { align-items: center; }
.pcard__ghost-text {
  font-size: 12.5px; color: var(--el-text-color-secondary);
  line-height: 1.7; margin-top: 10px;
}

/* 新增卡 */
.pcard--add {
  align-items: center; justify-content: center;
  min-height: 180px;
  border-style: dashed;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: all 0.22s ease;
  animation: none;
}
.pcard--add:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 5%, transparent);
  transform: scale(1.01);
}
.pcard__add-icon {
  font-size: 32px; color: inherit; opacity: 0.5;
  margin-bottom: 8px; transition: opacity 0.2s, transform 0.2s;
}
.pcard--add:hover .pcard__add-icon { opacity: 1; transform: scale(1.15); }
.pcard__add-title { font-size: 14px; font-weight: 600; color: inherit; }
.pcard__add-sub { font-size: 11.5px; color: var(--el-text-color-placeholder); margin-top: 4px; }

/* ==================== 双列表单 ==================== */
.dpv-form--two-col { display: flex; flex-direction: column; gap: 4px; }
.dpv-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.dpv-form__row--triple { grid-template-columns: 1fr 1.4fr 1fr; }
.dpv-form__cell { display: flex; flex-direction: column; }

.dpv-hint {
  font-size: 11px; color: var(--el-text-color-secondary);
  margin-top: 2px; line-height: 1.4;
}

.dpv-form__switch-row {
  display: flex; align-items: center; gap: 10px; padding-top: 4px;
}
.dpv-form__switch-hint { font-size: 11.5px; color: var(--el-text-color-secondary); }

.dpv-sdk-hint {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 14px; border-radius: 8px;
  background: color-mix(in srgb, var(--el-color-info-light) 50%, transparent);
  color: var(--el-color-info);
  font-size: 12.5px;
}

/* ==================== 高级设置 ==================== */
.dpv-vendor {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
}
.dpv-adv-row { margin-bottom: 4px; }
.dpv-adv-control { display: flex; align-items: center; gap: 10px; }

/* ==================== 响应式 ==================== */
@media (max-width: 900px) {
  .dpv-field, .dpv-field--vendor, .dpv-field--search { width: 100%; }
  .dpv-field--search { margin-left: 0; }
  .dpv-filter__meta { margin-left: 0; }
  .dpv-toolbar-ops { padding-left: 0; border-left: none; }
  .dpv-form__row { grid-template-columns: 1fr; }
  .dpv-form__row--triple { grid-template-columns: 1fr; }
}
</style>
