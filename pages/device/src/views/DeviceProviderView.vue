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

    <div class="dpv-hintbar">
      <el-icon><InfoFilled /></el-icon>
      <span>凭据卡上的「更多」可手动同步设备 / 组织，并进入「高级设置」配置离线检测与自动同步。</span>
    </div>

    <div v-if="loadError" class="dpv-error">
      <span>{{ loadError }}</span>
      <ReButton icon="RefreshRight" layout="square" tip="重试" :loading="loading" @click="fetchList" />
    </div>

    <!-- 提供商卡牌：每套凭据一张卡；空态同样用卡呈现，不用整块空状态图 -->
    <div class="dpv-grid">
      <!-- 加载骨架也是一张卡，避免布局跳动 -->
      <article v-if="loading && !rows.length" class="pcard pcard--ghost">
        <ReSkeleton :rows="4" animated />
      </article>

      <article
        v-for="row in filteredRows"
        :key="row.deviceCredentialId"
        class="pcard"
        :class="{ 'is-off': !row.deviceCredentialEnabled }"
      >
        <header class="pcard__head">
          <span
            class="pcard__logo"
            :style="{ color: vendorColor(row.deviceCredentialVendor), background: vendorBg(row.deviceCredentialVendor) }"
          >
            {{ vendorInitial(row.deviceCredentialVendor) }}
          </span>
          <div class="pcard__title">
            <span class="pcard__name">{{ row.deviceCredentialName || '未命名凭据' }}</span>
            <span class="pcard__sub">
              {{ vendorLabel(row.deviceCredentialVendor) }} · {{ platformLabel(row.deviceCredentialPlatformType) }}
            </span>
          </div>
          <!-- 启用/停用：方形开关（ReSwitch layout="square"） -->
          <ReSwitch
            :model-value="row.deviceCredentialEnabled"
            layout="square"
            size="small"
            icon="Power"
            active-icon="CircleCheck"
            :title="row.deviceCredentialEnabled ? '已启用，点击停用' : '已停用，点击启用'"
            :aria-label="row.deviceCredentialEnabled ? '停用该凭据套' : '启用该凭据套'"
            @update:model-value="(v: unknown) => onToggleEnabled(row, v === true)"
          />
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
          <ReButton icon="Setting" :show-text="true" @click="openAdvanced(row)">高级</ReButton>
          <div class="pcard__ops">
            <!-- 更多：点击弹出操作菜单（手动同步 / 高级设置 / 启停 / 编辑 / 删除），不依赖右键 -->
            <el-dropdown
              trigger="click"
              placement="bottom-end"
              @command="(cmd: string) => onCardCommand(cmd, row)"
            >
              <ReButton icon="MoreFilled" :show-text="true">更多</ReButton>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="sync-devices">手动同步设备</el-dropdown-item>
                  <el-dropdown-item command="sync-org">手动同步组织</el-dropdown-item>
                  <el-dropdown-item command="advanced" divided>高级设置（离线 / 自动同步）</el-dropdown-item>
                  <el-dropdown-item command="toggle-enabled">
                    {{ row.deviceCredentialEnabled ? '停用凭据套' : '启用凭据套' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="edit">编辑凭据</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除凭据</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <ReButton icon="Delete" layout="square" tip="删除凭据套" @click="onDelete(row)" />
          </div>
        </footer>
      </article>

      <!-- 空态也是卡：提示卡 + 新增卡，保证「不管有没有数据都是 card」 -->
      <article v-if="!loading && !filteredRows.length" class="pcard pcard--ghost">
        <div class="pcard__head">
          <span class="pcard__logo pcard__logo--ghost">?</span>
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

      <article class="pcard pcard--add" @click="openCreate">
        <span class="pcard__add-icon">
          <el-icon><Plus /></el-icon>
        </span>
        <span class="pcard__add-title">新增凭据套</span>
        <span class="pcard__add-sub">海康云耀 / 云眸 / 安防平台 · 大华云睿 / 乐橙 · SDK 直连</span>
      </article>
    </div>

    <!-- 新增 / 编辑 -->
    <ReDialog
      v-model="dialogVisible"
      :title="editingId ? '编辑凭据套' : '新增凭据套'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top" class="dpv-form">
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
          <template v-if="form.deviceCredentialPlatformType === 'cloud-yao'">
            <ReFormItem label="产品编码 ProductCode" required>
              <ReInput v-model="form.deviceCredentialProductCode" placeholder="例如 1685925205802552" />
              <span class="dpv-hint">云曜按产品维度隔离设备，取流 / 云台 / 门禁接口都会带上</span>
            </ReFormItem>
            <ReFormItem label="项目 ID ProjectID" required>
              <ReInput v-model="form.deviceCredentialProjectId" placeholder="例如 422328139543160" />
            </ReFormItem>
          </template>
        </template>
        <ReFormItem v-else label="说明">
          <span class="dpv-hint">SDK 局域网直连使用设备自身的 IP + 账号密码，无需 AK/SK</span>
        </ReFormItem>
        <ReFormItem label="Endpoint">
          <ReInput v-model="form.deviceCredentialBaseUrl" placeholder="留空使用内置默认地址" />
        </ReFormItem>
        <ReFormItem label="离线阈值" required>
          <ReInputNumber v-model="form.deviceCredentialOfflineThreshold" :min="1" :max="86400" style="width: 100%" />
          <span class="dpv-hint">单位：秒；阈值按套生效，只用这套接入的设备按此判定离线</span>
        </ReFormItem>
        <ReFormItem label="启用">
          <ReSwitch
            v-model="form.deviceCredentialEnabled"
            layout="radio"
            radio-on-label="启用"
            radio-off-label="停用"
          />
        </ReFormItem>
        <ReFormItem label="备注">
          <ReInput v-model="form.deviceCredentialRemark" placeholder="选填，展示在卡牌的扩展信息位" />
        </ReFormItem>
      </el-form>
      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="dialogSaving" @click="onSubmit">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 高级设置：离线检测 + 自动同步（凭据卡右键进入） -->
    <ReDialog v-model="advancedVisible" title="高级设置" width="620px" :close-on-click-modal="false">
      <el-form label-position="top" class="dpv-form">
        <ReFormItem label="凭据套">
          <div class="dpv-vendor">
            <span
              class="pcard__logo"
              :style="{
                color: vendorColor(advancedRow?.deviceCredentialVendor),
                background: vendorBg(advancedRow?.deviceCredentialVendor),
              }"
            >
              {{ vendorInitial(advancedRow?.deviceCredentialVendor) }}
            </span>
            <div class="pcard__title">
              <span class="pcard__name">{{ advancedRow?.deviceCredentialName || '未命名凭据' }}</span>
              <span class="pcard__sub">
                {{ vendorLabel(advancedRow?.deviceCredentialVendor) }} ·
                {{ platformLabel(advancedRow?.deviceCredentialPlatformType) }} · 配置按套生效
              </span>
            </div>
          </div>
        </ReFormItem>

        <!-- 提供商数据：一律用卡牌承载，有没有数据都是卡 -->
        <div class="dpv-advanced">
          <div class="dpv-advanced__head">
            <span class="dpv-panel__bar" />
            <span>离线检测</span>
          </div>
          <div class="dpv-advanced__grid">
            <article class="acard">
              <header class="acard__head">
                <span class="acard__icon"><el-icon><Timer /></el-icon></span>
                <div class="acard__text">
                  <span class="acard__name">本套离线阈值</span>
                  <span class="acard__sub">只用这套凭据接入的设备按此判定离线</span>
                </div>
              </header>
              <div class="acard__row">
                <ReInputNumber
                  v-model="advancedThreshold"
                  :min="5"
                  :max="86400"
                  :step="5"
                  style="width: 140px"
                  placeholder="未配置"
                />
                <span class="acard__unit">秒</span>
                <span v-if="advancedRow" class="acard__meta">
                  当前：{{ advancedRow.deviceCredentialOfflineThreshold ?? '未配置' }}
                </span>
              </div>
            </article>
          </div>
        </div>

        <div class="dpv-advanced">
          <div class="dpv-advanced__head">
            <span class="dv-panel__bar" />
            <span>自动同步</span>
            <span class="dpv-advanced__hint">预留：后端暂无自动同步接口，当前配置只保存在本机</span>
          </div>
          <div class="dpv-advanced__grid dpv-advanced__grid--two">
            <article class="acard">
              <header class="acard__head">
                <span class="acard__icon"><el-icon><Download /></el-icon></span>
                <div class="acard__text">
                  <span class="acard__name">设备自动同步</span>
                  <span class="acard__sub">定时从厂商平台拉取设备列表</span>
                </div>
                <ReSwitch
                  :model-value="advancedForm.deviceSync"
                  layout="square"
                  size="small"
                  icon="Power"
                  active-icon="CircleCheck"
                  :title="advancedForm.deviceSync ? '已开启' : '已关闭'"
                  @update:model-value="(v: unknown) => (advancedForm.deviceSync = v === true)"
                />
              </header>
              <div class="acard__row">
                <span class="acard__label">间隔</span>
                <ReInputNumber
                  v-model="advancedForm.deviceInterval"
                  :min="1"
                  :max="1440"
                  :disabled="!advancedForm.deviceSync"
                  style="width: 130px"
                />
                <span class="acard__unit">分钟</span>
              </div>
            </article>

            <article class="acard">
              <header class="acard__head">
                <span class="acard__icon"><el-icon><Share /></el-icon></span>
                <div class="acard__text">
                  <span class="acard__name">组织自动同步</span>
                  <span class="acard__sub">定时同步厂商侧组织架构</span>
                </div>
                <ReSwitch
                  :model-value="advancedForm.orgSync"
                  layout="square"
                  size="small"
                  icon="Power"
                  active-icon="CircleCheck"
                  :title="advancedForm.orgSync ? '已开启' : '已关闭'"
                  @update:model-value="(v: unknown) => (advancedForm.orgSync = v === true)"
                />
              </header>
              <div class="acard__row">
                <span class="acard__label">间隔</span>
                <ReInputNumber
                  v-model="advancedForm.orgInterval"
                  :min="1"
                  :max="1440"
                  :disabled="!advancedForm.orgSync"
                  style="width: 130px"
                />
                <span class="acard__unit">分钟</span>
              </div>
            </article>
          </div>
        </div>
      </el-form>
      <template #footer>
        <ReButton @click="advancedVisible = false">取消</ReButton>
        <ReButton icon="Refresh" :show-text="true" :loading="syncing" @click="onSyncOrg">立即同步组织</ReButton>
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
 * 本轮交互要点：
 *   1. 表单统一 `label-position="top"`（标签在上、控件在下），不再左右布局；
 *   2. 启用/停用开关用方形开关（ReSwitch layout="square"，表单里用 layout="radio"）；
 *   3. 凭据区**始终**是卡牌：有数据是凭据卡，没数据是提示卡 + 新增卡，不再用整块空状态图；
 *   4. 凭据卡右键 = 手动同步设备 / 手动同步组织 / 高级设置 / 启停 / 编辑 / 删除；
 *   5. 离线检测与设备、组织自动同步收进「高级设置」，按凭据套保存。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, CircleCheck, Download, Grid, InfoFilled, Plus, Share, Timer } from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReInput from '@repo/ui/re-input'
import ReInputNumber from '@repo/ui/re-input-number'
import { ReFormItem } from '@repo/ui/re-kit'
import ReSelect from '@repo/ui/re-select'
import ReSkeleton from '@repo/ui/re-skeleton'
import ReStatCard from '@repo/ui/re-stat-card'
import ReSwitch from '@repo/ui/re-switch'

import deviceApi from '../api/deviceApi'
import type { DeviceInfo, ProviderCredential } from '../types/device'

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

/** 自动同步配置（预留：后端只有 POST /org/sync 手动接口，先落本机 localStorage） */
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

/** 自动同步配置（按凭据套 id 存本机） */
const advancedMap = ref<Record<string, ProviderAdvanced>>(loadAdvancedMap())

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
  deviceCredentialProductCode: '',
  deviceCredentialProjectId: '',
  deviceCredentialBaseUrl: '',
  deviceCredentialOfflineThreshold: 60,
  deviceCredentialEnabled: true,
  deviceCredentialRemark: '',
})

/** 高级设置弹窗（按凭据套配置：设备可来自多套，不再有「默认套」） */
const advancedVisible = ref(false)
const advancedSaving = ref(false)
const advancedRow = ref<ProviderCredential | null>(null)
const advancedThreshold = ref<number>()
const advancedForm = reactive<ProviderAdvanced>({ ...DEFAULT_ADVANCED })
const syncing = ref(false)

const vendorOptions = Object.entries(VENDOR_LABELS).map(([value, label]) => ({ value, label }))

/** 当前所选厂商支持的平台类型 */
const platformOptions = computed(() => VENDOR_PLATFORMS[form.deviceCredentialVendor] ?? [])

/** 凭据名称必填；平台模式下 AK/SK 必填 */
const nameInvalid = computed(() => !form.deviceCredentialName.trim())
const isPlatformMode = computed(() => !!form.deviceCredentialPlatformType)
const akSkInvalid = computed(
  () => isPlatformMode.value && (!form.deviceCredentialAppKey.trim() || !form.deviceCredentialAppSecret.trim()),
)
/** 云曜除 AK/SK 外还需要产品编码 + 项目 ID */
const isCloudYao = computed(
  () => form.deviceCredentialVendor === 'hikvision' && form.deviceCredentialPlatformType === 'cloud-yao',
)
const cloudYaoInvalid = computed(
  () => isCloudYao.value && (!form.deviceCredentialProductCode.trim() || !form.deviceCredentialProjectId.trim()),
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
/** 对接平台数（SDK 直连单独算一档） */
const platformCount = computed(
  () => new Set(rows.value.map((r) => r.deviceCredentialPlatformType || 'sdk')).size,
)

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
    desc: '设备可来自多套凭据',
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
    key: 'platforms',
    title: '对接平台',
    value: platformCount.value,
    desc: '含 SDK 直连，互不干扰',
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

function errText(e: unknown): string {
  return (e as { msg?: string })?.msg || (e instanceof Error ? e.message : String(e))
}

async function fetchList(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    rows.value = (await deviceApi.listCredentials()) || []
  } catch (e: unknown) {
    rows.value = []
    loadError.value = errText(e)
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
    deviceCredentialProductCode: '',
    deviceCredentialProjectId: '',
    deviceCredentialBaseUrl: '',
    deviceCredentialOfflineThreshold: 60,
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
    deviceCredentialProductCode: row.deviceCredentialProductCode || '',
    deviceCredentialProjectId: row.deviceCredentialProjectId || '',
    deviceCredentialBaseUrl: row.deviceCredentialBaseUrl || '',
    deviceCredentialOfflineThreshold: row.deviceCredentialOfflineThreshold ?? 60,
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
  if (nameInvalid.value) {
    ElMessage.warning('请填写凭据名称')
    return
  }
  if (akSkInvalid.value) {
    ElMessage.warning('平台接入需要填写 AppKey / AppSecret')
    return
  }
  if (cloudYaoInvalid.value) {
    ElMessage.warning('云曜平台还需要填写 ProductCode / ProjectID')
    return
  }
  if (form.deviceCredentialOfflineThreshold <= 0) {
    ElMessage.warning('离线阈值需大于 0 秒')
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
    ElMessage.error(`保存失败：${errText(e)}`)
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
    ElMessage.error(`删除失败：${errText(e)}`)
  }
}

/** 启用/停用（方形开关与右键菜单共用） */
async function onToggleEnabled(row: ProviderCredential, next: boolean): Promise<void> {
  try {
    // 只走启停专用接口，避免整对象更新把 AK/SK、默认套等字段一并覆盖
    await deviceApi.updateCredentialEnabled(row.deviceCredentialId!, next)
    ElMessage.success(next ? '凭据套已启用' : '凭据套已停用')
    await fetchList()
  } catch (e: unknown) {
    ElMessage.error(`操作失败：${errText(e)}`)
  }
}

/**
 * 手动同步设备：后端只有「单台 refresh-status」与「组织 sync」，没有厂商级设备同步接口，
 * 这里按厂商过滤设备后逐台刷新，等价于「从厂商侧把设备状态拉一遍」。
 * 待后端补 POST /api/device/provider/sync 后换成一次调用即可。
 */
async function onSyncDevices(row: ProviderCredential): Promise<void> {
  const vendor = row.deviceCredentialVendor
  try {
    const list = ((await deviceApi.list()) as DeviceInfo[]) || []
    const targets = list.filter((d) => d.deviceInfoVendor === vendor)
    if (!targets.length) {
      ElMessage.warning(`${vendorLabel(vendor)} 下暂无设备可同步`)
      return
    }
    const results = await Promise.allSettled(targets.map((d) => deviceApi.refreshStatus(d.deviceInfoId)))
    const ok = results.filter((r) => r.status === 'fulfilled').length
    if (ok === 0) ElMessage.error('同步失败：厂商侧未返回可用设备')
    else ElMessage.success(`已同步 ${ok}/${targets.length} 台设备（${vendorLabel(vendor)}）`)
  } catch (e: unknown) {
    ElMessage.error(`同步设备失败：${errText(e)}`)
  }
}

/** 手动同步组织（POST /api/device/org/sync） */
async function onSyncOrg(): Promise<void> {
  syncing.value = true
  try {
    await deviceApi.syncOrg()
    ElMessage.success('组织架构已从厂商侧同步')
  } catch (e: unknown) {
    ElMessage.error(`同步组织失败：${errText(e)}`)
  } finally {
    syncing.value = false
  }
}

function onCardCommand(cmd: string, row: ProviderCredential): void {
  if (cmd === 'sync-devices') return void onSyncDevices(row)
  if (cmd === 'sync-org') return void onSyncOrg()
  if (cmd === 'advanced') return openAdvanced(row)
  if (cmd === 'toggle-enabled') return void onToggleEnabled(row, !row.deviceCredentialEnabled)
  if (cmd === 'edit') return openEdit(row)
  if (cmd === 'delete') return void onDelete(row)
}

function onResetFilters(): void {
  filters.vendor = ''
  filters.platform = ''
  filters.keyword = ''
}

/* ==================== 高级设置（按套） ==================== */

function openAdvanced(row: ProviderCredential): void {
  advancedRow.value = row
  advancedThreshold.value = row.deviceCredentialOfflineThreshold ?? 60
  Object.assign(advancedForm, advancedMap.value[row.deviceCredentialId || ''] ?? { ...DEFAULT_ADVANCED })
  advancedVisible.value = true
}

async function onSaveAdvanced(): Promise<void> {
  const row = advancedRow.value
  const credentialId = row?.deviceCredentialId
  if (!row || !credentialId) return
  advancedSaving.value = true
  try {
    // 离线阈值本就是该套自己的字段（device_provider_credential.device_credential_offline_threshold）
    const threshold = advancedThreshold.value
    if (threshold && threshold > 0 && threshold !== row.deviceCredentialOfflineThreshold) {
      await deviceApi.updateCredential(credentialId, {
        ...row,
        deviceCredentialOfflineThreshold: threshold,
      })
    }
    // 自动同步：后端只有 POST /org/sync 手动接口，先落本机（预留）
    advancedMap.value = { ...advancedMap.value, [credentialId]: { ...advancedForm } }
    try {
      localStorage.setItem(ADVANCED_KEY, JSON.stringify(advancedMap.value))
    } catch {
      /* 隐私模式下写不进去，忽略 */
    }
    ElMessage.success('高级设置已保存')
    advancedVisible.value = false
    await fetchList()
  } catch (e: unknown) {
    ElMessage.error(`保存失败：${errText(e)}`)
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
  /* 左右内边距交给外层布局(main.el-main)：两层叠加会让右侧空隙过大 */
  padding: 10px 0 12px;
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

.dpv-hintbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: var(--el-radius-base, 8px);
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-text-color-primary) 3%, transparent);
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

/* 提供商卡牌网格（有数据 / 无数据都是卡） */
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
/* el-dropdown 包一层，撑满网格单元，卡牌才能等高 */
.dpv-grid :deep(.el-dropdown) {
  display: block;
  min-width: 0;
}
.dpv-grid :deep(.el-dropdown) > .pcard {
  height: 100%;
}

.pcard {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  transition: box-shadow 0.16s ease, border-color 0.16s ease;
}
.el-dropdown .pcard:hover {
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
.pcard__logo--ghost {
  color: var(--el-text-color-placeholder);
  background: color-mix(in srgb, var(--el-text-color-primary) 6%, transparent);
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
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.pcard__ops {
  display: inline-flex;
  gap: 6px;
  margin-left: auto;
}

/* 空态卡 / 新增卡 */
.pcard--ghost {
  border-style: dashed;
  border-color: var(--el-border-color);
  box-shadow: none;
  background: color-mix(in srgb, var(--el-text-color-primary) 2%, transparent);
}
.pcard__ghost-text {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}
.pcard--add {
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 168px;
  border-style: dashed;
  border-color: var(--el-border-color);
  box-shadow: none;
  background: transparent;
  cursor: pointer;
  text-align: center;
}
.pcard--add:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.pcard__add-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  font-size: 20px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.pcard__add-title {
  font-size: 14px;
  font-weight: 600;
}
.pcard__add-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  max-width: 90%;
  line-height: 1.6;
}

/* 弹窗表单 */
.dpv-form {
  display: flex;
  flex-direction: column;
}
.dpv-hint {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.dpv-vendor {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 高级设置里的配置卡 */
.dpv-advanced {
  margin-bottom: 16px;
}
.dpv-advanced__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
}
.dpv-panel__bar,
.dv-panel__bar {
  width: 5px;
  height: 14px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.dpv-advanced__hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.dpv-advanced__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
.dpv-advanced__grid--two {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}
.acard {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-text-color-primary) 2.5%, transparent);
}
.acard__head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.acard__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 10px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.acard__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.acard__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.acard__sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.acard__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
.acard__label {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.acard__unit {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.acard__meta {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
