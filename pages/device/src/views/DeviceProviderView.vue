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
        <ReInput v-model="filters.keyword" placeholder="搜索名称 / AK / 备注..." clearable prefix-icon="Search" />
      </div>
      <span class="dpv-filter__meta">{{ filteredRows.length }} / {{ rows.length }} 套</span>
      <ReButton icon="Search" :show-text="true" type="primary" :loading="loading" @click="fetchList">查询</ReButton>
      <div class="dpv-toolbar-ops">
        <ReButton icon="Plus" layout="square" type="primary" tip="新增凭据套" @click="openCreate" />
        <ReButton icon="RefreshRight" layout="square" tip="重新加载" :loading="loading" @click="fetchList" />
        <ReButton icon="Delete" layout="square" tip="重置筛选条件" @click="onResetFilters" />
      </div>
    </section>

    <div v-if="loadError" class="dpv-error">
      <span>{{ loadError }}</span>
      <ReButton icon="RefreshRight" layout="square" tip="重试" :loading="loading" @click="fetchList" />
    </div>

    <!-- 提供商卡牌：每套凭据一张卡，信息 + 扩展位 -->
    <div class="dpv-grid" :class="{ 'is-empty': !loading && !filteredRows.length }">
      <ReSkeleton v-if="loading && !rows.length" :rows="6" animated />

      <template v-else-if="filteredRows.length">
        <article v-for="row in filteredRows" :key="row.deviceCredentialId" class="pcard" :class="{ 'is-off': !row.deviceCredentialEnabled }">
          <header class="pcard__head">
            <span class="pcard__logo" :style="{ color: vendorColor(row.deviceCredentialVendor), background: vendorBg(row.deviceCredentialVendor) }">
              {{ vendorInitial(row.deviceCredentialVendor) }}
            </span>
            <div class="pcard__title">
              <span class="pcard__name">
                {{ row.deviceCredentialName || '未命名凭据' }}
                <ReTag v-if="row.deviceCredentialIsDefault" type="warning" size="small">默认套</ReTag>
              </span>
              <span class="pcard__sub">{{ vendorLabel(row.deviceCredentialVendor) }} · {{ platformLabel(row.deviceCredentialPlatformType) }}</span>
            </div>
            <ReTag :type="row.deviceCredentialEnabled ? 'success' : 'info'" size="small" dot>
              {{ row.deviceCredentialEnabled ? '启用' : '停用' }}
            </ReTag>
          </header>

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
            <div class="pcard__row">
              <dt>Endpoint</dt>
              <dd class="pcard__mono">{{ row.deviceCredentialBaseUrl || '内置默认地址' }}</dd>
            </div>
            <div class="pcard__row">
              <dt>离线阈值</dt>
              <dd>{{ row.deviceCredentialOfflineThreshold ?? '—' }} 秒</dd>
            </div>
          </dl>

          <!--
            预留扩展信息位：后续新增的凭据字段（如 归属区域 / 责任人 / 容量配额 / 到期时间）
            直接在这块里继续往下加 pcard__row，卡牌布局与网格列宽都不用动。
          -->
          <div class="pcard__extra">
            <template v-if="row.deviceCredentialRemark">
              <span class="pcard__extra-label">备注</span>
              <span class="pcard__extra-text">{{ row.deviceCredentialRemark }}</span>
            </template>
            <span v-else class="pcard__reserve">＋ 预留信息位</span>
          </div>

          <footer class="pcard__foot">
            <ReButton icon="EditPen" :show-text="true" @click="openEdit(row)">编辑</ReButton>
            <div class="pcard__ops">
              <ReButton
                :icon="row.deviceCredentialIsDefault ? 'StarFilled' : 'Star'"
                layout="square"
                :tip="row.deviceCredentialIsDefault ? '取消默认套' : '设为该厂商默认套'"
                @click="onToggleDefault(row)"
              />
              <ReButton
                :icon="row.deviceCredentialEnabled ? 'VideoPause' : 'VideoPlay'"
                layout="square"
                :tip="row.deviceCredentialEnabled ? '停用' : '启用'"
                @click="onToggleEnabled(row)"
              />
              <ReButton icon="Delete" layout="square" tip="删除凭据套" @click="onDelete(row)" />
            </div>
          </footer>
        </article>
      </template>

      <ReEmpty
        v-else
        description="暂无凭据，点击「新增凭据套」登记厂商的 AK/SK"
        :image-size="90"
      />
    </div>

    <!-- 新增 / 编辑 -->
    <ReDialog
      v-model="dialogVisible"
      :title="editingId ? '编辑凭据套' : '新增凭据套'"
      width="560px"
      :close-on-click-modal="false"
    >
      <div class="dpv-form">
        <ReFormItem label="厂商" required>
          <ReSelect
            v-model="form.deviceCredentialVendor"
            :options="vendorOptions"
            style="width: 100%"
            :disabled="!!editingId"
            @change="onVendorChange"
          />
        </ReFormItem>
        <ReFormItem label="平台类型" required>
          <ReSelect
            v-model="form.deviceCredentialPlatformType"
            :options="[...platformOptions, SDK_PLATFORM]"
            style="width: 100%"
            :disabled="!!editingId"
          />
        </ReFormItem>
        <ReFormItem label="凭据名称" required>
          <ReInput v-model="form.deviceCredentialName" placeholder="如「华东区账号」" />
        </ReFormItem>
        <template v-if="isPlatformMode">
          <ReFormItem label="AppKey (AK)" required>
            <ReInput v-model="form.deviceCredentialAppKey" placeholder="厂商开放平台分配的 AppKey" />
          </ReFormItem>
          <ReFormItem label="AppSecret (SK)" required>
            <ReInput
              v-model="form.deviceCredentialAppSecret"
              type="password"
              show-password
              placeholder="厂商开放平台分配的 AppSecret"
            />
          </ReFormItem>
        </template>
        <ReFormItem v-else label="说明">
          <span class="dpv-hint">SDK 局域网直连使用设备自身的 IP + 账号密码，无需 AK/SK</span>
        </ReFormItem>
        <ReFormItem label="Endpoint">
          <ReInput v-model="form.deviceCredentialBaseUrl" placeholder="留空使用内置默认地址" />
        </ReFormItem>
        <ReFormItem label="离线阈值" required>
          <ReInputNumber v-model="form.deviceCredentialOfflineThreshold" :min="1" :max="86400" style="width: 100%" />
          <span class="dpv-hint">单位：秒；厂商级阈值取默认套的值</span>
        </ReFormItem>
        <ReFormItem label="默认套">
          <ReSwitch v-model="form.deviceCredentialIsDefault" />
          <span class="dpv-hint">每厂商至多一套，建连与阈值都优先取它</span>
        </ReFormItem>
        <ReFormItem label="启用">
          <ReSwitch v-model="form.deviceCredentialEnabled" />
        </ReFormItem>
        <ReFormItem label="备注">
          <ReInput v-model="form.deviceCredentialRemark" placeholder="选填，展示在卡牌的扩展信息位" />
        </ReFormItem>
      </div>
      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="dialogSaving" :disabled="formInvalid" @click="onSubmit">保存</ReButton>
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
 * （如多个海康账号分属不同区域），每厂商至多一套标记为默认，
 * 厂商级离线阈值取默认套的阈值。
 *
 * 可选平台类型直接对应后台 SPI 的实现：
 *   - hikvision：cloud-yao 云耀 / cloud-eye 云眸 / secure-platform 安防平台（另有 SDK 局域网直连）
 *   - dahua   ：dahua-cloud 云睿 / lechange 乐橙（另有 SDK 局域网直连）
 * SDK 直连走 IP+账号密码，不需要 AK/SK，故平台类型留空。
 *
 * 视觉与布局对齐监控台的「代理管理 / 提供商配置」：无顶部 hero、4 张紧凑 ReStatCard、
 * 筛选与操作合并成一行、内容区吃满剩余高度；差异是本页把表格换成**卡牌**，
 * 每张卡自带一个「预留信息位」用于承载后续新增字段。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, CircleCheck, Grid, Share } from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReEmpty from '@repo/ui/re-empty'
import ReInput from '@repo/ui/re-input'
import ReInputNumber from '@repo/ui/re-input-number'
import { ReFormItem } from '@repo/ui/re-kit'
import ReSelect from '@repo/ui/re-select'
import ReSkeleton from '@repo/ui/re-skeleton'
import ReStatCard from '@repo/ui/re-stat-card'
import ReSwitch from '@repo/ui/re-switch'
import ReTag from '@repo/ui/re-tag'

import deviceApi from '@/api/deviceApi'
import type { ProviderCredential } from '@/types/device'

/** 厂商码 → 中文名 */
const VENDOR_LABELS: Record<string, string> = {
  hikvision: '海康威视',
  dahua: '大华',
}

/** 各厂商支持的平台类型（取自后台 SPI：HikvisionProvider / DahuaProvider 的 connect 分支） */
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

/** 平台类型留空 = SDK 局域网直连（IP + 账号密码，不需要 AK/SK） */
const SDK_PLATFORM = { value: '', label: 'SDK 直连' }

/** 厂商卡牌配色（仅用于卡牌左上角的字母块） */
const VENDOR_TINTS: Record<string, { color: string; bg: string }> = {
  hikvision: { color: 'var(--el-color-primary)', bg: 'var(--el-color-primary-light-9)' },
  dahua: { color: 'var(--el-color-success)', bg: 'var(--el-color-success-light-9)' },
}

const rows = ref<ProviderCredential[]>([])
const loading = ref(false)
const loadError = ref('')

/** 筛选 */
const filters = reactive({ vendor: '', platform: '', keyword: '' })

/** 已展开明文的 SK 卡牌 id 集合 */
const revealed = ref<Set<string>>(new Set())

/** 新增/编辑弹窗 */
const dialogVisible = ref(false)
const dialogSaving = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({
  deviceCredentialVendor: 'hikvision',
  deviceCredentialPlatformType: 'cloud-yao',
  deviceCredentialName: '',
  deviceCredentialAppKey: '',
  deviceCredentialAppSecret: '',
  deviceCredentialBaseUrl: '',
  deviceCredentialOfflineThreshold: 60,
  deviceCredentialIsDefault: false,
  deviceCredentialEnabled: true,
  deviceCredentialRemark: '',
})

const vendorOptions = Object.entries(VENDOR_LABELS).map(([value, label]) => ({ value, label }))

/** 当前所选厂商支持的平台类型 */
const platformOptions = computed(() => VENDOR_PLATFORMS[form.deviceCredentialVendor] ?? [])

/** 凭据名称必填；平台模式下 AK/SK 必填 */
const nameInvalid = computed(() => !form.deviceCredentialName.trim())
const isPlatformMode = computed(() => !!form.deviceCredentialPlatformType)
const akSkInvalid = computed(
  () => isPlatformMode.value && (!form.deviceCredentialAppKey.trim() || !form.deviceCredentialAppSecret.trim()),
)
const formInvalid = computed(
  () => nameInvalid.value || akSkInvalid.value || form.deviceCredentialOfflineThreshold <= 0,
)

const filteredRows = computed(() => {
  const kw = filters.keyword.trim().toLowerCase()
  return rows.value.filter((r) => {
    if (filters.vendor && r.deviceCredentialVendor !== filters.vendor) return false
    if (filters.platform && (r.deviceCredentialPlatformType || '') !== filters.platform) return false
    if (!kw) return true
    return [r.deviceCredentialName, r.deviceCredentialAppKey, r.deviceCredentialRemark]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(kw))
  })
})

const enabledCount = computed(() => rows.value.filter((r) => r.deviceCredentialEnabled).length)
const defaultCount = computed(() => rows.value.filter((r) => r.deviceCredentialIsDefault).length)

const kpis = computed(() => [
  {
    key: 'vendors',
    title: '接入厂商',
    value: new Set(rows.value.map((r) => r.deviceCredentialVendor)).size,
    desc: `当前筛选 ${filteredRows.value.length} 套`,
    icon: Share,
    iconColor: 'var(--el-color-primary)',
  },
  {
    key: 'total',
    title: '凭据套数',
    value: rows.value.length,
    desc: '同厂商可登记多套',
    icon: Grid,
    iconColor: 'var(--el-color-info)',
  },
  {
    key: 'enabled',
    title: '已启用',
    value: enabledCount.value,
    desc: '停用的套不参与建连',
    icon: CircleCheck,
    iconColor: 'var(--el-color-success)',
  },
  {
    key: 'default',
    title: '默认套',
    value: defaultCount.value,
    desc: '每厂商至多一套，离线阈值取自它',
    icon: Bell,
    iconColor: 'var(--el-color-warning)',
  },
])

function vendorLabel(vendor?: string): string {
  if (!vendor) return '—'
  return VENDOR_LABELS[vendor] || vendor
}

/** 卡牌字母块：厂商中文首字 */
function vendorInitial(vendor?: string): string {
  const label = vendorLabel(vendor)
  return label && label !== '—' ? label.slice(0, 1) : '?'
}

function vendorColor(vendor?: string): string {
  return VENDOR_TINTS[vendor || '']?.color || 'var(--el-text-color-regular)'
}

function vendorBg(vendor?: string): string {
  return VENDOR_TINTS[vendor || '']?.bg || 'color-mix(in srgb, var(--el-text-color-primary) 6%, transparent)'
}

function platformLabel(platform?: string): string {
  if (!platform) return 'SDK 直连'
  const hit = Object.values(VENDOR_PLATFORMS)
    .flat()
    .find((p) => p.value === platform)
  return hit ? hit.label : platform
}

/** SK 默认掩码展示，点一下明文/掩码切换 */
function secretOf(row: ProviderCredential): string {
  const id = row.deviceCredentialId || ''
  const raw = row.deviceCredentialAppSecret || ''
  if (!raw) return '—'
  if (revealed.value.has(id)) return raw
  return `${raw.slice(0, 2)}${'*'.repeat(Math.max(4, Math.min(10, raw.length - 2)))}${raw.slice(-2)}`
}

function toggleSecret(row: ProviderCredential): void {
  const id = row.deviceCredentialId || ''
  const next = new Set(revealed.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  revealed.value = next
}

async function fetchList(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    rows.value = (await deviceApi.listCredentials()) || []
  } catch (e: unknown) {
    rows.value = []
    loadError.value = (e as { msg?: string })?.msg || (e instanceof Error ? e.message : String(e))
    ElMessage.error(`凭据加载失败：${loadError.value}`)
  } finally {
    loading.value = false
  }
}

function openCreate(): void {
  editingId.value = null
  Object.assign(form, {
    deviceCredentialVendor: 'hikvision',
    deviceCredentialPlatformType: 'cloud-yao',
    deviceCredentialName: '',
    deviceCredentialAppKey: '',
    deviceCredentialAppSecret: '',
    deviceCredentialBaseUrl: '',
    deviceCredentialOfflineThreshold: 60,
    deviceCredentialIsDefault: false,
    deviceCredentialEnabled: true,
    deviceCredentialRemark: '',
  })
  dialogVisible.value = true
}

function openEdit(row: ProviderCredential): void {
  editingId.value = row.deviceCredentialId ?? null
  Object.assign(form, {
    deviceCredentialVendor: row.deviceCredentialVendor,
    deviceCredentialPlatformType: row.deviceCredentialPlatformType || '',
    deviceCredentialName: row.deviceCredentialName || '',
    deviceCredentialAppKey: row.deviceCredentialAppKey || '',
    deviceCredentialAppSecret: row.deviceCredentialAppSecret || '',
    deviceCredentialBaseUrl: row.deviceCredentialBaseUrl || '',
    deviceCredentialOfflineThreshold: row.deviceCredentialOfflineThreshold ?? 60,
    deviceCredentialIsDefault: !!row.deviceCredentialIsDefault,
    deviceCredentialEnabled: row.deviceCredentialEnabled ?? true,
    deviceCredentialRemark: row.deviceCredentialRemark || '',
  })
  dialogVisible.value = true
}

/** 切换厂商时把平台类型重置为该厂商的首个平台，避免留下不匹配的组合 */
function onVendorChange(): void {
  const opts = VENDOR_PLATFORMS[form.deviceCredentialVendor] ?? []
  const stillValid = opts.some((o) => o.value === form.deviceCredentialPlatformType)
  if (!stillValid) form.deviceCredentialPlatformType = opts[0]?.value ?? ''
}

async function onSubmit(): Promise<void> {
  if (formInvalid.value) {
    ElMessage.warning('请补全凭据名称、AK/SK 与合法阈值')
    return
  }
  dialogSaving.value = true
  try {
    const payload: ProviderCredential = { ...form }
    if (editingId.value) {
      await deviceApi.updateCredential(editingId.value, payload)
      ElMessage.success('凭据已更新')
    } else {
      await deviceApi.createCredential(payload)
      ElMessage.success('凭据已新增')
    }
    dialogVisible.value = false
    await fetchList()
  } catch (e: unknown) {
    ElMessage.error(`保存失败：${(e as { msg?: string })?.msg || e}`)
  } finally {
    dialogSaving.value = false
  }
}

async function onDelete(row: ProviderCredential): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确认删除凭据「${row.deviceCredentialName}」？删除后该套不再参与建连。`,
      '删除确认',
      { type: 'warning' },
    )
  } catch {
    return
  }
  try {
    await deviceApi.deleteCredential(row.deviceCredentialId!)
    ElMessage.success('凭据已删除')
    await fetchList()
  } catch (e: unknown) {
    ElMessage.error(`删除失败：${(e as { msg?: string })?.msg || e}`)
  }
}

/** 设为/取消默认套 */
async function onToggleDefault(row: ProviderCredential): Promise<void> {
  try {
    await deviceApi.updateCredential(row.deviceCredentialId!, {
      ...row,
      deviceCredentialIsDefault: !row.deviceCredentialIsDefault,
    })
    ElMessage.success(row.deviceCredentialIsDefault ? '已取消默认' : '已设为该厂商默认套')
    await fetchList()
  } catch (e: unknown) {
    ElMessage.error(`操作失败：${(e as { msg?: string })?.msg || e}`)
  }
}

/** 启用/停用 */
async function onToggleEnabled(row: ProviderCredential): Promise<void> {
  try {
    await deviceApi.updateCredential(row.deviceCredentialId!, {
      ...row,
      deviceCredentialEnabled: !row.deviceCredentialEnabled,
    })
    await fetchList()
  } catch (e: unknown) {
    ElMessage.error(`操作失败：${(e as { msg?: string })?.msg || e}`)
  }
}

function onResetFilters(): void {
  filters.vendor = ''
  filters.platform = ''
  filters.keyword = ''
}

onMounted(fetchList)
</script>

<style scoped>
.dpv {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 12px 12px;
  height: 100%;
  min-height: 0;
  color: var(--el-text-color-primary);
}

.dpv-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.dpv-filter {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.dpv-field {
  width: 170px;
}
.dpv-field--vendor {
  width: 200px;
}
.dpv-field--search {
  width: 240px;
}
.dpv-field :deep(.el-input),
.dpv-field :deep(.el-select) {
  width: 100%;
}
.dpv-filter__meta {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.dpv-toolbar-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px solid var(--el-border-color-lighter);
}
@media (max-width: 900px) {
  .dpv-field,
  .dpv-field--vendor,
  .dpv-field--search {
    width: 100%;
  }
  .dpv-filter__meta {
    margin-left: 0;
  }
  .dpv-toolbar-ops {
    padding-left: 0;
    border-left: none;
  }
}

.dpv-error {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: var(--el-radius-base, 8px);
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  font-size: 13px;
}

/* 提供商卡牌网格 */
.dpv-grid {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  align-content: start;
  gap: 14px;
  padding: 2px 2px 8px;
}
.dpv-grid.is-empty {
  grid-template-columns: 1fr;
  align-content: stretch;
  place-items: center;
}

.pcard {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  transition: box-shadow 0.16s ease, border-color 0.16s ease;
}
.pcard:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow);
}
.pcard.is-off {
  opacity: 0.85;
}
.pcard__head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pcard__logo {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex: none;
  border-radius: 13px;
  font-size: 17px;
  font-weight: 700;
}
.pcard__title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.pcard__name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pcard__sub {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pcard__info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
}
.pcard__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.pcard__row dt {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  flex: none;
}
.pcard__row dd {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-primary);
  min-width: 0;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pcard__mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-variant-numeric: tabular-nums;
}
.pcard__secret {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* 预留扩展信息位 */
.pcard__extra {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
.pcard__extra-label {
  flex: none;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pcard__extra-text {
  font-size: 12.5px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
}
.pcard__reserve {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  border: 1px dashed var(--el-border-color);
  border-radius: 999px;
  padding: 2px 10px;
}
.pcard__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.pcard__ops {
  display: inline-flex;
  gap: 6px;
}

.dpv-form {
  display: flex;
  flex-direction: column;
}
.dpv-hint {
  margin-left: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
