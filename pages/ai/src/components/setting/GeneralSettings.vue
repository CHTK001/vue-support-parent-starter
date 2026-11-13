<template>
  <div class="flex-1">
    <!-- 语言设置 -->
    <SettingsCard :title="t('common.language')">
      <SettingsRow :label="t('settings.general.language')" :description="t('settings.general.languageDesc')">
        <el-select v-model="selectedLanguage" @change="handleLanguageChange">
          <el-option label="简体中文" value="zh-CN" />
          <el-option label="English" value="en-US" />
        </el-select>
      </SettingsRow>
    </SettingsCard>

    <!-- 工作目录 -->
    <SettingsCard :title="t('settings.general.workspace')">
      <SettingsRow :label="t('settings.general.workspaceBaseDir')" :description="t('settings.general.workspaceBaseDirDesc')">
        <div class="flex gap-2 w-full">
          <el-input v-model="settingsForm.workspaceBaseDir" :placeholder="t('settings.general.workspaceBaseDirPlaceholder')" clearable />
          <el-button @click="selectFolder" type="primary" plain>
            {{ t('settings.general.selectFolder') }}
          </el-button>
        </div>
      </SettingsRow>
    </SettingsCard>

    <!-- Agent 设置 -->
    <SettingsCard :title="t('settings.general.agent')">
      <SettingsRow :label="t('settings.general.agentImpl')" :description="t('settings.general.agentImplDesc')">
        <el-select v-model="agentImpl">
          <el-option label="OpenCode Server" value="opencode-server" />
          <el-option label="AgentScope" value="agentscope" />
        </el-select>
      </SettingsRow>
      <!-- opencode-server 由本机常驻的 opencode serve 单实例承载（127.0.0.1 HTTP + SSE）。
           首次使用会自动下载并启动；下载/启动失败时后端自动降级到 agentscope，
           这里把「装没装、起没起、降到哪、为什么」直接摊给管理员看。 -->
      <div v-if="agentImpl === 'opencode-server'" class="agent-impl-warning" role="note">
        <el-icon><WarningFilled /></el-icon>
        <span>{{ t('settings.general.agentImplWarning') }}</span>
      </div>
      <div v-if="agentImpl === 'opencode-server' && engineStatus?.degraded" class="agent-impl-degraded" role="alert">
        <el-icon><WarningFilled /></el-icon>
        <span>{{ t('settings.general.engineDegraded', {
          engine: engineFallbackLabel,
          reason: engineStatus?.reason || t('settings.general.engineReasonUnknown')
        }) }}</span>
      </div>
      <div v-if="agentImpl === 'opencode-server'" class="agent-engine-status">
        <el-tag size="small" effect="plain" :type="engineStatus?.opencode?.installed ? 'success' : 'info'">
          {{ engineStatus?.opencode?.installed ? t('settings.general.engineInstalled') : t('settings.general.engineNotInstalled') }}
        </el-tag>
        <el-tag size="small" effect="plain" :type="engineStateType">{{ engineStateText }}</el-tag>
        <span class="agent-engine-binary" :title="engineStatus?.opencode?.binary || ''">
          {{ engineStatus?.opencode?.binary || t('settings.general.engineBinaryUnknown') }}
        </span>
        <template v-if="isAdmin()">
          <span class="agent-engine-spacer" />
          <el-switch v-model="opencodeAutoInstall" size="small" @change="handleAutoInstallChange" />
          <span class="agent-engine-auto-label">{{ t('settings.general.engineAutoInstall') }}</span>
          <el-button size="small" :loading="enginePreparing" :disabled="enginePreparing" @click="prepareOpencode">
            {{ t('settings.general.enginePrepare') }}
          </el-button>
        </template>
      </div>
      <!--
        这里原先还有「最大工具调用轮次」「请求超时」「空闲超时」三个下拉：
        写进 system 分组后，全仓 Java 源码里没有任何消费方（聊天侧读的是
        runtime.timeout_millis 与 session 的流式三项，工具轮次由 agent 策略
        max_tool_iterations 决定），配置了也不生效，属于假配置，已移除。
        真要开放这些旋钮，先在后端接上消费点再回到这里加。
      -->
    </SettingsCard>

    <!-- 对话上下文（runtime 分组的上下文压缩） -->
    <SettingsCard title="对话上下文"
      subtitle="普通用户只可配置压缩模型；开关、余量、压缩模式与令牌上限由管理员在定义中控制">
      <SettingsRow
        v-for="item in compressionItems"
        :key="item.field"
        :label="compressionLabel(item)"
        :description="item.description"
      >
        <FieldControl
          :item="item"
          :value="compressionValues[item.field] ?? ''"
          :is-model-field="isModelField('runtime', item.field)"
          :is-enum-field="isEnumField(item)"
          :is-prompt-field="false"
          :model-row="compressionModelRow(item.field)"
          :model-display="compressionModelDisplay(item.field)"
          :options="compressionOptions(item)"
          :step="compressionStep(item.field)"
          :precision="compressionPrecision(item.field)"
          @change="onCompressionChange(item.field, $event)"
          @pick-model="openModelPicker(item.field)"
        />
      </SettingsRow>
    </SettingsCard>

    <!-- 对话过程 -->
    <!--
      「对话过程」卡（折叠回复过程 / 耗时格式 / 思考 Loader / 思考文案）已删除：
      这四项既没有写进任何分组（保存载荷里从来没有它们），也没有任何前端消费方，
      刷新即回默认值。要让它们生效，先补一个真正读这些字段的存储与消费点。
    -->

    <!-- 加载动画演示 -->
    <SettingsCard title="加载动画">
      <!--
        加载动画的款式在「主题配置 → 外观 → 加载动画」里选，选一次三处同时生效：
        首屏 loader（public/loader.js）、应用内 ReLoader、设置里的缩略预览。
        这里只提供「在当前页面上全屏演示一次」的入口，方便确认实际观感。
      -->
      <SettingsRow label="当前动画"
        description="加载动画由「主题配置 → 外观 → 加载动画」统一管理，首屏与应用内用同一款。这里可全屏演示 3 秒。">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="loader-demo-name">{{ currentLoaderName }}</span>
          <el-button size="small" type="primary" @click="demoReLoader">演示</el-button>
        </div>
      </SettingsRow>
    </SettingsCard>

    <!-- 模型选择对话框（在“对话上下文”的 modelId 字段上复用 ModelPickerDialog） -->
    <ModelPickerDialog
      :visible="modelDialogVisible"
      :providers="filteredProviders"
      :selectedId="tempModelId"
      :empty-text="`没有匹配「对话」类型的模型`"
      @update:visible="(v) => (modelDialogVisible = v)"
      @select="selectModel"
      @clear="clearModelField"
    />

    <!--
      侧栏菜单显隐统一由「系统 → 菜单管理」维护：那边与侧栏同源（config/sidebarMenu.ts
      的单一清单）、逐项写 localStorage 且即时生效。此处原先的 7 个开关是同一批 showKey
      的第二份实现，还会用整对象覆盖写把菜单管理里改过的其它项清掉，故只保留入口。
    -->
    <SettingsCard title="菜单显示">
      <SettingsRow label="侧栏菜单" description="在「系统 → 菜单管理」里逐项显示或隐藏，修改立即生效。">
        <el-button type="primary" plain @click="gotoMenuManage">去菜单管理</el-button>
      </SettingsRow>
    </SettingsCard>
  </div>
</template>

<script setup lang="ts">
import { message, isAdmin } from '@repo/core'
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { WarningFilled } from '@element-plus/icons-vue'
import { useDebounceFn } from '@vueuse/core'
import { apiService } from '@/services/ApiService'
import { adminApi } from '@/framework/context'
import { usePopup } from '@/composables/usePopup'
import { useLanguage } from '@/composables/useLanguage'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'
import FieldControl from './dms/FieldControl.vue'
import ModelPickerDialog from './dms/ModelPickerDialog.vue'
import { mapProviderModel, findPickedModel } from '@/components/models/modelMeta'
import { useModelConfigStore } from '@/stores/modelConfig'
import { LOADER_ANIMATION_META, useLoaderAnimation } from '@repo/ui/re-loader'

const modelConfig = useModelConfigStore()
const router = useRouter()
const { notify } = usePopup()
const { t } = useI18n()
const { locale: currentLocale, setLanguage } = useLanguage()
const selectedLanguage = ref(currentLocale.value)

// Agent 引擎实现：管理员在「Agent 设置」里切换，保存到 runtime.agent_impl
// 默认 opencode-server（本机常驻 opencode serve）；不可用时后端自动降级 agentscope
const agentImpl = ref('opencode-server')
const agentRuntimeLoaded = ref(false)

/** 引擎解析结果（对应 runtime 分组的 __runtime 块） */
interface AgentEngineStatus {
  selected?: string
  requested?: string
  effective?: string
  degraded?: boolean
  fallback?: string | null
  reason?: string | null
  preparing?: boolean
  autoInstall?: boolean
  opencode?: {
    installed?: boolean
    binary?: string | null
    serverReady?: boolean
    preparing?: boolean
    degraded?: boolean
    reason?: string | null
    baseUrl?: string | null
  }
}

const engineStatus = ref<AgentEngineStatus | null>(null)
const opencodeAutoInstall = ref(true)
const enginePreparing = ref(false)
let enginePollTimer: ReturnType<typeof setInterval> | null = null

/** 降级目标显示名 */
const engineFallbackLabel = computed(() =>
  engineStatus.value?.fallback === 'agentscope' ? 'AgentScope' : (engineStatus.value?.fallback || 'AgentScope'))

/** 当前是否正在下载/启动 */
const engineWorking = computed(() => Boolean(
  engineStatus.value?.preparing || engineStatus.value?.opencode?.preparing || enginePreparing.value))

/** 状态标签文案 */
const engineStateText = computed(() => {
  if (engineStatus.value?.opencode?.serverReady) return t('settings.general.engineReady')
  if (engineWorking.value) return t('settings.general.enginePreparing')
  if (engineStatus.value?.opencode?.installed) return t('settings.general.engineNotReady')
  return t('settings.general.engineNotInstalled')
})

/** 状态标签配色 */
const engineStateType = computed(() => {
  if (engineStatus.value?.opencode?.serverReady) return 'success'
  if (engineWorking.value) return 'warning'
  if (engineStatus.value?.degraded) return 'danger'
  return 'info'
})

/** 读取引擎解析结果（设置页打开时初始化，准备过程中轮询） */
async function loadEngineStatus() {
  if (agentImpl.value !== 'opencode-server') return
  try {
    const response = await apiService.fetchAgentEngineStatus()
    const data = response?.data || response
    if (data && typeof data === 'object') {
      engineStatus.value = data
      if (typeof data.autoInstall === 'boolean') {
        opencodeAutoInstall.value = data.autoInstall
      }
    }
  } catch (error) {
    // 状态查询失败不影响引擎下拉与会话链路，只是看不到可用性明细
    console.warn('获取 Agent 引擎状态失败:', error)
  }
}

/** 保存「自动下载并启动」开关到 runtime 分组 */
async function handleAutoInstallChange(value: boolean | string | number) {
  const enabled = value === true || value === 'true'
  try {
    await apiService.updateGroupSettings('runtime', { opencode_auto_install: String(enabled) })
    notify.success(t('common.saveSuccess'), t('settings.general.updated'))
    if (enabled) {
      startEnginePolling()
      await loadEngineStatus()
    }
  } catch (error: any) {
    opencodeAutoInstall.value = !enabled
    notify.error(t('common.saveFailed'), error.message || t('common.error.unknown'))
  }
}

/** 管理员手动触发一次下载 + 启动 */
async function prepareOpencode() {
  enginePreparing.value = true
  try {
    await apiService.prepareAgentEngine()
    startEnginePolling()
    await loadEngineStatus()
  } catch (error: any) {
    notify.error(t('common.saveFailed'), error.message || t('common.error.unknown'))
  } finally {
    enginePreparing.value = false
  }
}

/** 准备过程中每 3 秒刷新一次状态，就绪或停止准备后自动收尾 */
function startEnginePolling() {
  stopEnginePolling()
  enginePollTimer = setInterval(async () => {
    await loadEngineStatus()
    if (!engineWorking.value) stopEnginePolling()
  }, 3000)
}

function stopEnginePolling() {
  if (enginePollTimer) {
    clearInterval(enginePollTimer)
    enginePollTimer = null
  }
}

function handleLanguageChange(val: string) {
  setLanguage(val as 'zh-CN' | 'en-US')
}



/** 当前加载动画（在「主题配置 → 外观 → 加载动画」里选，这里只读） */
const loaderAnimation = useLoaderAnimation()
const currentLoaderName = computed(() => LOADER_ANIMATION_META[loaderAnimation.value].name)

/**
 * 全屏演示一次当前加载动画。
 *
 * <p>不传 {@code variant}：命令式 loader 会跟随全局选择 —— 于是这里演示的
 * 就是用户在任何页面会看到的那一款，而不是另写死的样例。</p>
 */
async function demoReLoader() {
  try {
    const mod = await import('@repo/ui/re-loader')
    const h = mod.loader.open({
      size: 'lg',
      text: currentLoaderName.value,
    })
    setTimeout(() => h.close(), 3000)
  } catch (e: any) {
    notify.warning('演示失败', e?.message || 'ReLoader 不可用')
  }
}




// 表单数据
//
// 只保留真正会被后端消费、且没有专属入口的 system 字段：
//   · workspaceBaseDir —— 工作目录解析（WorkspacePathResolver / 会话与知识库按账号隔离）
// 其余原字段（免登录、工具轮次、两个超时、对话过程四项）在后端没有消费方，
// 已从界面移除，详见模板里的注释。
const settingsForm = reactive({
  workspaceBaseDir: '',
})

// ===================== 对话上下文：runtime 分组的上下文压缩 =====================
// 定义接口带 adminOnly 标记；合并视图（merged）不带，前端按同一标记控制显隐：
// 非管理员只露 modelId，在其基础上隐藏 adminOnly=true 的行。
const compressionDefs = ref<any[]>([])
// runtime 分组合并值（field -> value，始终以字符串形态与后端交互）
const compressionValues = reactive<Record<string, string>>({})
// 字段的元信息（overridden / origin）：模型字段的回显用
const compressionMeta = reactive<Record<string, any>>({})
// 本次改动的压缩字段：保存时只提交这些字段，避免把未改动的项写进个人覆盖层
const dirtyCompressionFields = reactive<Set<string>>(new Set())

/**
 * 定义接口下发的分组 Item 形态（按 COMPRESSION_FIELDS 回收的字段也长这样）。
 *
 * <p>`adminOnly` 标记用于控制非管理员可见性；`valueType` 决定渲染控件。</p>
 */
interface SettingDefinitionItem {
  field: string
  description: string
  defaultValue: string
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN'
  /** 分组内排序 */
  sort: number
  /** 仅管理员可配 */
  adminOnly: boolean
}

/** 定义接口里的分组壳 */
interface SettingDefinitionGroup {
  group: string
  groupName: string
  items: SettingDefinitionItem[]
}

/** 对话上下文的 7 个压缩字段；手动列出比猜字段名更安全 */
const COMPRESSION_FIELDS = [
  'auto',
  'async',
  'headroomPercent',
  'mode',
  'modelId',
  'recentTokenLimit',
  'validate',
]

/** 压缩字段的中文标签（与 definitions 中描述的首段一致） */
const COMPRESSION_LABELS: Record<string, string> = {
  auto: '是否启用自动上下文压缩',
  async: '是否异步压缩',
  headroomPercent: '压缩触发余量百分比',
  mode: '压缩模式（all/treshold）',
  modelId: '生成摘要用的压缩模型',
  recentTokenLimit: '压缩后保留的最近上下文令牌上限',
  validate: '压缩前是否把首次压缩结果作为基线融合',
}

/** 从定义中拿出的 runtime 压缩项（非管理员按 adminOnly 过滤） */
const compressionItems = computed(() =>
  compressionDefs.value.filter((item) => notAdminOnlyCompression(item))
)

/** 压缩字段的取模：只允许描述里已列出的值，其它一律删掉 */
const COMPRESSION_FIXED_OPTIONS: Record<string, string[]> = {
  mode: ['all', 'threshold'],
}

/** 当前账号是否可见该压缩字段（adminOnly 标记控制显隐） */
const notAdminOnlyCompression = (item: SettingDefinitionItem) => !(item && item.adminOnly === true && !isAdmin())

/** 压缩字段的中文标签：优先走硬编码的表，兜底描述前缀 */
const compressionLabel = (item: SettingDefinitionItem) => {
  const label = COMPRESSION_LABELS[item.field]
  if (label) return label
  const prefix = String(item?.description ?? '').match(/^\s*([^（(：:]{1,16})/)
  return (prefix && /[\u4e00-\u9fa5]/.test(prefix[1])) ? prefix[1].trim() : item.field
}

/** 是否模型字段（字段名包含 "model" 的走模型选择器） */
const isModelField = (group: any, field: string) => {
  if (!field) return false
  return String(field).toLowerCase().includes('model')
}

/** 该字段有哪些可选值（描述里（all/treshold）这类括号词是可选值） */
const compressionOptions = (item: SettingDefinitionItem) => {
  if (item.field in COMPRESSION_FIXED_OPTIONS) return COMPRESSION_FIXED_OPTIONS[item.field]
  return parseEnumOptions(item.description)
}

/** 是否枚举字（STRING 且描述里带多个可选值，固定项优先） */
const isEnumField = (item: SettingDefinitionItem) => {
  if (item.valueType !== 'STRING') return false
  if (item.field in COMPRESSION_FIXED_OPTIONS) return true
  const options = parseEnumOptions(item.description)
  return options.length >= 2 && options.length <= 10
}

/** 压缩模型字段的 el-input 只读态回显（已选/继承全局/未配置） */
const compressionModelDisplay = (field: string) => {
  const value = compressionValues[field]
  const meta = compressionMeta[field]
  // systemDefault 表示这条种子值从未被任何人配过，"生效值"不是用户配置
  if (!value || (meta && meta.origin === 'SYSTEM_DEFAULT')) return '请选择模型'
  return meta && meta.overridden === false ? `继承全局：${value}` : value
}

/** 压缩模型字段左侧的图标依据（字段名形如 providerId:modelName） */
const compressionModelRow = (field: string) => findPickedModel(compressionValues[field], providers.value)

/** 数值字段的步长（与小数位同源） */
const compressionStep = (field: string) => {
  const raw = String(compressionValues[field] ?? '').trim()
  const dot = raw.indexOf('.')
  if (dot < 0) return 1
  return Math.max(1e-6, 10 ** -(raw.length - dot - 1))
}

/** 数值字段的精度（小数位） */
const compressionPrecision = (field: string) => {
  const raw = String(compressionValues[field] ?? '').trim()
  const dot = raw.indexOf('.')
  if (dot < 0) return 0
  return Math.min(6, raw.length - dot - 1)
}

/** 监听单个压缩字段的改动（把数值/布尔转回后端期望的字符串形态） */
const onCompressionChange = (field: string, value: any) => {
  if (value === undefined || value === null) {
    delete compressionValues[field]
    return
  }
  compressionValues[field] = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)
  dirtyCompressionFields.add(field)
  saveCompressionSettings()
}

/**
 * 加载 runtime 分组的合并视图（全局默认 + 本人覆盖）与压缩定义。
 *
 * <p>与 DefaultModelSettings 的 loadGroupValues 同构：合并视图每项含
 * field / value / defaultValue / overridden / origin，**字符串形态**回传。**
 * 需要 type-preserve：BOOLEAN 显示为 el-switch 的布尔，NUMBER 显示为数字，
 * 但写入/展示的值始终是后端弦乐（value 字段本身）。
 */
const loadRuntimeMergedValues = async () => {
  try {
    const response = await apiService.fetchMergedGroupSettings('runtime')
    const items = response?.data ?? response ?? []
    if (!Array.isArray(items)) return
    items.forEach((item) => {
      if (!COMPRESSION_FIELDS.includes(item.field)) return
      compressionValues[item.field] = item.value ?? ''
      compressionMeta[item.field] = {
        overridden: item.overridden === true,
        defaultValue: item.defaultValue ?? '',
        origin: item.origin || (item.overridden === true ? 'USER' : 'GLOBAL'),
      }
    })
  } catch (error) {
    console.error('获取 runtime 压缩配置失败:', error)
    notify.error(t('settings.general.loadFailed'), error.message || t('common.error.unknown'))
  }
}

/**
 * 加载压缩定义（含 adminOnly 标记） + runtime 合并值。
 *
 * <p>定义接口返回某个用户可见的 runtime 分组中全部 29 个 field，
 * 按 COMPRESSION_FIELDS 回收压实现。
 */
const loadCompressionSettings = async () => {
  try {
    const response = await apiService._request('/global-setting-definitions')
    const groups = pickGroups(response)
    const runtime = groups.find((g: SettingDefinitionGroup) => g.group === 'runtime')
    if (runtime) {
      compressionDefs.value = runtime.items
        .filter((item: SettingDefinitionItem) => COMPRESSION_FIELDS.includes(item.field))
        .sort((a: SettingDefinitionItem, b: SettingDefinitionItem) => (a.sort ?? 0) - (b.sort ?? 0))
    }
  } catch (error) {
    console.error('获取 runtime 分组定义失败:', error)
    notify.error(t('settings.general.loadFailed'), error.message || t('common.error.unknown'))
  }
  await loadRuntimeMergedValues()
}

/**
 * 保存本次改动的压缩字段（只写本人覆盖层，不动全局默认）。
 *
 * <p>值传 null 表示撤销该字段的本人覆盖（回落到继承值）。
 * 保存后重新拉合并视图，让「继承全局」状态在界面上刷新。</p>
 *
 * <p>脏标记不清零：字段改写后就是已保存记录，避免某次 PUT 失败后、下一次
 * 改动把前一次的值漏掉（写法与 DefaultModelSettings 的 saveGroupSettings 同构）。</p>
 */
const saveCompressionSettings = async () => {
  const dirty = dirtyCompressionFields
  if (!dirty || dirty.size === 0) return
  const payload: Record<string, any> = {}
  for (const field of dirty) {
    const value = compressionValues[field]
    payload[field] = value === '' || value === null || value === undefined ? null : value
  }
  try {
    await apiService.updateUserGroupOverrides('runtime', payload)
    notify.success(t('common.saveSuccess'), t('settings.general.updated'))
    // 重新拉取合并视图：拿回 overridden/defaultValue，界面上「继承全局」状态才会刷新
    await loadRuntimeMergedValues()
    // 压缩模型是 ChatClient 的运行时配置，保存后即时刷新，侧栏徽标跟着变
    await modelConfig.refresh()
  } catch (error: any) {
    console.error('保存压缩配置失败:', error)
    notify.error(t('common.saveFailed'), error.message || t('common.error.unknown'))
  }
}

// ===================== 模型选择对话框（压缩模型 modelId） =====================
const modelDialogVisible = ref(false)
const tempModelId = ref<string | null>(null)
const currentDialogField = ref('')
// 模型列表（来自 /api/providers，按供应商分组）
const models = ref<any[]>([])
const providers = ref<any[]>([])
const modelSearchText = ref('')

/** 模型弹框的模型列表：按供应商分组 */
const filteredProviders = computed(() => {
  const acceptable = ['text']
  let result = models.value
  if (currentDialogField.value) {
    // 压缩模型走对话类型（text），与 DefaultModelSettings 的 requiredTypeFor 同口径
    result = result.filter((m: any) => (m.types || []).some((t: any) => acceptable.includes(t)))
  }
  if (modelSearchText.value) {
    const q = modelSearchText.value.toLowerCase()
    result = result.filter((m: any) =>
      m.model?.toLowerCase().includes(q) || m.modelName?.toLowerCase().includes(q)
    )
  }
  return providers.value
    .map((p: any) => ({ ...p, models: result.filter((m: any) => m.providerId === p.id) }))
    .filter((p: any) => p.models.length > 0)
})

/** 加载模型列表（/api/providers，按供应商分组） */
const loadModels = async () => {
  if (models.value.length > 0) return
  try {
    const providersBody = await adminApi.get('/api/providers')
    const providersData = Array.isArray(providersBody) ? providersBody : providersBody?.data || []
    providers.value = []
    models.value = []
    providersData.forEach((provider: any) => {
      if (!provider.provider_id) return
      const providerModels = (provider.models || [])
        .filter((m: any) => m.enabled !== false)
        // 行结构与「默认模型」弹框同一份（类型 / 标签 / 输入输出 / 延迟 / 通道信息），
        // 这样压缩模型的候选列表不再把所有模型一律标成「对话」。
        .map((m: any) => mapProviderModel(provider, m))
      models.value.push(...providerModels)
      providers.value.push({
        id: provider.provider_id,
        name: provider.name,
        models: providerModels,
      })
    })
  } catch (error) {
    console.error('获取模型列表失败:', error)
    notify.error('加载模型列表失败', error)
  }
}

/** 打开压缩模型选择框 */
const openModelPicker = async (field: string) => {
  currentDialogField.value = field
  tempModelId.value = compressionValues[field] ?? null
  modelSearchText.value = ''
  modelDialogVisible.value = true
  if (models.value.length === 0) await loadModels()
}

/** 选中模型（modelId 字段存 providerId:modelName） */
const selectModel = (modelId: string) => {
  if (!modelId) return
  onCompressionChange(currentDialogField.value, modelId)
  modelDialogVisible.value = false
}

/**
 * 清空当前字段（写入空值覆盖，使其回到「未配置」）。
 */
const clearModelField = () => {
  if (!currentDialogField.value) return
  onCompressionChange(currentDialogField.value, '')
  modelDialogVisible.value = false
}

/** 从响应里取出分组数组（双层信封：{code, data: {success, data: [groups]}}） */
const pickGroups = (response: any) => {
  const first = response?.data ?? response
  if (Array.isArray(first)) return first
  if (Array.isArray(first?.data)) return first.data
  return []
}

/** 从描述中解析枚举选项（「压缩模式（all/treshold）」 → [all, treshold]） */
const parseEnumOptions = (description: string) => {
  if (!description) return []
  const match = description.match(/[（(]([^）)]+)[）)]/)
  if (!match) return []
  return match[1]
    .split('/')
    .map((opt: string) => opt.trim().split(' ')[0])
    .filter((opt: string) => opt && opt.length < 50)
}

// 原始设置备份，用于对比是否有改动
const originalSettings = ref<any>(null)

// 计算是否有改动
const hasChanges = computed(() => {
  if (!originalSettings.value) return false
  return JSON.stringify(settingsForm) !== JSON.stringify(originalSettings.value)
})

// 自动保存（防抖 300ms）
const debouncedSave = useDebounceFn(async () => {
  if (!hasChanges.value) return
  await handleSave()
}, 300)

// Agent 引擎切换独立保存到 runtime 分组，避免混进 system 分组自动保存
watch(agentImpl, async (value, previous) => {
  if (!agentRuntimeLoaded.value || value === previous) return
  try {
    await apiService.updateGroupSettings('runtime', { agent_impl: value })
    notify.success(t('common.saveSuccess'), t('settings.general.updated'))
    // 切到 opencode 后立刻拉一次可用性：若本机未装会自动触发后台下载，
    // 页面随即开始轮询，管理员能看到「准备中 → 就绪 / 已降级」
    if (value === 'opencode-server') await loadEngineStatus()
  } catch (error: any) {
    console.error('保存 Agent 引擎配置失败:', error)
    notify.error(t('common.saveFailed'), error.message || t('common.error.unknown'))
    agentImpl.value = previous
  }
}, { flush: 'sync' })

// 工作目录自动保存（防抖 300ms）；hasChanges 保证 load 回填不会触发一次空写
watch(() => settingsForm.workspaceBaseDir, () => {
  debouncedSave()
})

// 加载 system 分组设置
const loadSettings = async () => {
  try {
    const response = await apiService.fetchGroupSettings('system')
    // 后端返回两层data嵌套：{ success: true, data: {...} }
    const data = response?.data || response

    // 填充表单（只取本页真正维护的字段）
    settingsForm.workspaceBaseDir = data.workspaceBaseDir || ''
    // 备份原始数据
    originalSettings.value = JSON.parse(JSON.stringify(settingsForm))
  } catch (error: any) {
    console.error('获取通用设置失败:', error)
    notify.error(t('settings.general.loadFailed'), error.message || t('common.error.unknown'))
  }

  // 加载 Agent 引擎实现（runtime 分组）
  try {
    const runtimeResponse = await apiService.fetchGroupSettings('runtime')
    const runtimeData = runtimeResponse?.data || runtimeResponse
    const configuredAgentImpl = String(runtimeData?.agent_impl || '').trim().toLowerCase()
    // 旧配置值 opencode 已由后端统一映射为 opencode-server，界面按新值展示
    const normalizedAgentImpl = configuredAgentImpl === 'opencode' ? 'opencode-server' : configuredAgentImpl
    agentImpl.value = ['agentscope', 'opencode-server'].includes(normalizedAgentImpl)
      ? normalizedAgentImpl
      : 'opencode-server'
    // 后端回带的解析结果：实际生效引擎、降级原因、opencode 可用性
    engineStatus.value = runtimeData?.__runtime || null
    if (typeof runtimeData?.opencode_auto_install === 'boolean') {
      opencodeAutoInstall.value = runtimeData.opencode_auto_install
    }
  } catch (error: any) {
    console.error('获取 Agent 引擎配置失败:', error)
  } finally {
    agentRuntimeLoaded.value = true
    // 后端可能已在后台下载/启动（启动预热或上一轮遗留），继续轮询直到就绪或失败
    if (engineWorking.value) startEnginePolling()
  }
}

// 跳「系统 → 菜单管理」：菜单显隐的唯一维护点（与侧栏同源的清单 + 即时生效）
const gotoMenuManage = () => router.push({ name: 'SystemSettings', params: { tab: 'menu-manage' } })

// 选择文件夹
const selectFolder = async () => {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI
  if (isElectron && window.electronAPI?.selectFolder) {
    try {
      const selectedPath = await window.electronAPI.selectFolder()
      if (selectedPath) {
        settingsForm.workspaceBaseDir = selectedPath
        message.success(t('settings.general.folderSelected'))
      }
    } catch (error) {
      message.error(t('settings.general.selectFolderFailed'))
    }
  } else {
    message.warning(t('settings.general.folderSelectNotSupported'))
  }
}

// 保存设置
const handleSave = async () => {
  try {
    // 验证工作目录基路径。
    // 只在「本次真的改了这个字段」时拦截：历史配置里可能存着相对路径（旧版本没收紧），
    // 每次保存都校验会让纯读取的回填也被它打断。
    const path = settingsForm.workspaceBaseDir.trim()
    const previousPath = String(originalSettings.value?.workspaceBaseDir ?? '').trim()
    if (path && path !== previousPath) {
      // Windows 盘符（C:\ 与 C:/）、POSIX 绝对路径、UNC（\\server\share）都算绝对路径
      const isAbsolute = /^[a-zA-Z]:[\\/]/.test(path) || path.startsWith('/') || path.startsWith('\\\\')
      if (!isAbsolute) {
        message.error(t('settings.general.pathMustBeAbsolute'))
        return
      }
    }

    // 构造保存数据：本页只剩工作目录一个真正生效的 system 字段
    const dataToSave = {
      workspaceBaseDir: path || null,
    }

    // 使用分组设置接口更新 system 分组
    await apiService.updateGroupSettings('system', dataToSave)

    // 保存成功后更新原始数据备份
    originalSettings.value = JSON.parse(JSON.stringify(settingsForm))

    notify.success(t('common.saveSuccess'), t('settings.general.updated'))
  } catch (error: any) {
    console.error('保存设置失败:', error)
    notify.error(t('common.saveFailed'), error.message || t('common.error.unknown'))
  }
}

// 生命周期
onMounted(async () => {
  // 通用设置与压缩配置并行加载：前者管 system 分组表单，后者管 runtime 分组合并值
  await Promise.all([loadSettings(), loadCompressionSettings()])
})

// 离开页面时停掉引擎状态轮询，避免组件卸载后定时器继续打请求
onBeforeUnmount(() => {
  stopEnginePolling()
})
</script>

<style scoped>
/* 引擎能力不对等的提示条：走 Element Plus 的告警色变量，跟随主题与暗色，
   不写死橙色——暗色下写死的橙底会显得刺眼且对比不足。 */
.agent-impl-warning {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 16px 14px;
  padding: 10px 12px;
  border: 1px solid var(--el-color-warning-light-5);
  border-radius: var(--el-border-radius-base, 6px);
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
  font-size: 12.5px;
  line-height: 1.6;
}

.agent-impl-warning .el-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

/* 已降级提示：用危险色区别于普通能力提示，让管理员一眼看到「现在跑的不是你选的引擎」 */
.agent-impl-degraded {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 16px 14px;
  padding: 10px 12px;
  border: 1px solid var(--el-color-danger-light-5);
  border-radius: var(--el-border-radius-base, 6px);
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  font-size: 12.5px;
  line-height: 1.6;
}

.agent-impl-degraded .el-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

/* 引擎运行状态行：安装态 / 服务态 / 二进制路径 + 管理员动作 */
.agent-engine-status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 16px 14px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base, 6px);
  background: var(--el-fill-color-lighter);
  font-size: 12px;
}

.agent-engine-binary {
  flex: 1 1 160px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--el-font-family-mono, monospace);
  color: var(--el-text-color-secondary);
}

.agent-engine-spacer {
  flex: 0 0 auto;
}

.agent-engine-auto-label {
  color: var(--el-text-color-secondary);
}
</style>

