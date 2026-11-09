<template>
  <div class="flex-1">
    <!-- 语言设置 -->
    <SettingsCard :title="t('common.language')">
      <SettingsRow :label="t('settings.general.language')" :description="t('settings.general.languageDesc')" control-width="208px">
        <el-select v-model="selectedLanguage" @change="handleLanguageChange">
          <el-option label="简体中文" value="zh-CN" />
          <el-option label="English" value="en-US" />
        </el-select>
      </SettingsRow>
    </SettingsCard>

    <!-- 登录设置 -->
    <SettingsCard :title="t('settings.general.login')">
      <SettingsRow :label="t('settings.general.autoLoginMode')" :description="t('settings.general.autoLoginDesc')">
        <el-switch v-model="settingsForm.autoLoginEnabled" />
      </SettingsRow>
    </SettingsCard>

    <!-- 工作目录 -->
    <SettingsCard :title="t('settings.general.workspace')">
      <SettingsRow :label="t('settings.general.workspaceBaseDir')" :description="t('settings.general.workspaceBaseDirDesc')" control-flex>
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
      <SettingsRow :label="t('settings.general.agentImpl')" :description="t('settings.general.agentImplDesc')" control-width="208px">
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
      <SettingsRow :label="t('settings.general.maxToolIterations')" :description="t('settings.general.maxToolIterationsDesc')" control-width="128px">
        <el-select v-model="settingsForm.maxToolIterations">
          <el-option label="10" :value="10" />
          <el-option label="50" :value="50" />
          <el-option label="100" :value="100" />
          <el-option label="200" :value="200" />
          <el-option label="500" :value="500" />
        </el-select>
      </SettingsRow>
      <SettingsRow :label="t('settings.general.llmRequestTimeout')" :description="t('settings.general.llmRequestTimeoutDesc')" control-width="144px">
        <el-select v-model="settingsForm.llmRequestTimeoutMs">
          <el-option label="30 秒" :value="30" />
          <el-option label="60 秒" :value="60" />
          <el-option label="120 秒" :value="120" />
          <el-option label="300 秒" :value="300" />
          <el-option label="600 秒" :value="600" />
        </el-select>
      </SettingsRow>
      <SettingsRow :label="t('settings.general.llmIdleTimeout')" :description="t('settings.general.llmIdleTimeoutDesc')" control-width="144px">
        <el-select v-model="settingsForm.llmIdleTimeoutMs">
          <el-option label="10 秒" :value="10" />
          <el-option label="30 秒" :value="30" />
          <el-option label="60 秒" :value="60" />
          <el-option label="120 秒" :value="120" />
          <el-option label="300 秒" :value="300" />
        </el-select>
      </SettingsRow>
    </SettingsCard>

    <!-- 对话上下文（runtime 分组的上下文压缩） -->
    <SettingsCard title="对话上下文"
      subtitle="普通用户只可配置压缩模型；开关、余量、压缩模式与令牌上限由管理员在定义中控制">
      <SettingsRow
        v-for="item in compressionItems"
        :key="item.field"
        :label="compressionLabel(item)"
        :description="item.description"
        control-width="208px"
      >
        <FieldControl
          :item="item"
          :value="compressionValues[item.field] ?? ''"
          :is-model-field="isModelField('runtime', item.field)"
          :is-enum-field="isEnumField(item)"
          :is-prompt-field="false"
          :logo="compressionModelLogo(item.field)"
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
    <SettingsCard title="对话过程">
      <SettingsRow label="折叠回复过程" description="回复成功完成后，将最终正文前的过程文本、思考和工具调用收进活动详情。">
        <el-switch v-model="settingsForm.collapseReplyProcess" />
      </SettingsRow>
      <SettingsRow label="耗时显示格式" description="控制会话流和回复结果里的执行耗时精度。" control-width="128px">
        <el-select v-model="settingsForm.durationDisplayFormat">
          <el-option label="整数秒" value="seconds" />
          <el-option label="精确到毫秒" value="milliseconds" />
          <el-option label="分秒格式" value="mmss" />
        </el-select>
      </SettingsRow>
      <SettingsRow label="思考状态 Loader" description="选择思考状态文案左侧的加载动效。" control-width="160px">
        <el-select v-model="settingsForm.thinkingLoaderStyle">
          <el-option label="Matrix（默认）" value="matrix" />
          <el-option label="Music" value="music" />
          <el-option label="Bird" value="bird" />
          <el-option label="Fish" value="fish" />
          <el-option label="ASCII" value="ascii" />
          <el-option label="Dots" value="dots" />
        </el-select>
      </SettingsRow>
      <SettingsRow label="思考状态文案" description="同时自定义思考期间轮换显示的中文和英文文案。">
        <el-button @click="openThinkingTextDialog">编辑文案</el-button>
      </SettingsRow>
    </SettingsCard>

    <!-- 加载动画演示 -->
    <SettingsCard title="加载动画">
      <!--
        加载动画的款式在「主题配置 → 外观 → 加载动画」里选，选一次三处同时生效：
        首屏 loader（public/loader.js）、应用内 ReLoader、设置里的缩略预览。
        这里只提供「在当前页面上全屏演示一次」的入口，方便确认实际观感。
      -->
      <SettingsRow label="当前动画"
        description="加载动画由「主题配置 → 外观 → 加载动画」统一管理，首屏与应用内用同一款。这里可全屏演示 3 秒。"
        control-width="320px">
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
      :logo-for="getModelRowLogo"
      @update:visible="(v) => (modelDialogVisible = v)"
      @select="selectModel"
      @clear="clearModelField"
    />

    <!-- 菜单显示控制 -->
    <SettingsCard title="菜单显示控制">
      <SettingsRow label="显示角色管理" description="在左侧菜单显示角色管理入口">
        <el-switch v-model="settingsForm.showCharactersMenu" />
      </SettingsRow>
      <SettingsRow label="显示机器人管理" description="在左侧菜单显示机器人管理入口">
        <el-switch v-model="settingsForm.showBotsMenu" />
      </SettingsRow>
      <SettingsRow label="显示知识库" description="在左侧菜单显示知识库入口">
        <el-switch v-model="settingsForm.showKnowledgeBaseMenu" />
      </SettingsRow>
      <SettingsRow label="显示插件市场" description="在左侧菜单显示插件市场入口">
        <el-switch v-model="settingsForm.showPluginsMenu" />
      </SettingsRow>
      <SettingsRow label="显示模型管理" description="在左侧菜单显示模型管理入口">
        <el-switch v-model="settingsForm.showModelsMenu" />
      </SettingsRow>
      <SettingsRow label="显示用量管理" description="在左侧菜单显示用量管理入口">
        <el-switch v-model="settingsForm.showUsageMenu" />
      </SettingsRow>
      <SettingsRow label="显示定时任务" description="在左侧菜单显示定时任务入口">
        <el-switch v-model="settingsForm.showSchedulerMenu" />
      </SettingsRow>
    </SettingsCard>
  </div>
</template>

<script setup lang="ts">
import { message, isAdmin } from '@repo/core'
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus';
import { WarningFilled } from '@element-plus/icons-vue'
import { useDebounceFn } from '@vueuse/core'
import { apiService } from '@/services/ApiService'
import { adminApi } from '@/framework/context'
import { usePopup } from '@/composables/usePopup'
import { useAuthStore } from '@/stores/auth'
import { useLanguage } from '@/composables/useLanguage'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'
import FieldControl from './dms/FieldControl.vue'
import ModelPickerDialog from './dms/ModelPickerDialog.vue'
import { getModelAvatarPath } from '@/utils/modelUtils'
import { useModelConfigStore } from '@/stores/modelConfig'
import { LOADER_ANIMATION_META, useLoaderAnimation } from '@repo/ui/re-loader'

const authStore = useAuthStore()
const modelConfig = useModelConfigStore()
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
const settingsForm = reactive({
  autoLoginEnabled: false,
  workspaceBaseDir: '',
  maxToolIterations: 100,
  llmRequestTimeoutMs: 600,   // 秒（后端存储为毫秒）
  llmIdleTimeoutMs: 120,     // 秒
  showCharactersMenu: true,         // 显示角色管理
  showBotsMenu: true,               // 显示机器人管理
  showKnowledgeBaseMenu: true,      // 显示知识库
  showPluginsMenu: true,            // 显示插件市场
  showModelsMenu: true,             // 显示模型管理
  showUsageMenu: true,              // 显示用量管理
  showConnectorsMenu: true,         // 显示连接器
  showSchedulerMenu: true,          // 显示定时任务
  collapseReplyProcess: true,        // 折叠回复过程
  durationDisplayFormat: 'seconds',  // 耗时显示格式
  thinkingLoaderStyle: 'matrix',     // 思考状态 Loader
  thinkingTextCN: '思考中',          // 思考状态中文文案
  thinkingTextEN: 'Thinking',        // 思考状态英文文案
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

/** 压缩模型字段右侧的提供商 logo（字段名形如 providerId:modelName） */
const compressionModelLogo = (field: string): string | undefined => {
  const v = compressionValues[field]
  if (!v) return undefined
  const name = v.includes(':') ? v.split(':').slice(1).join(':') : v
  return getModelAvatarPath(name) ?? undefined
}

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

/** 模型弹框行的 logo（通过模型名取修补） */
const getModelRowLogo = (model: any) => getModelAvatarPath(model?.model || '')

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
        .map((m: any) => ({
          id: `${provider.provider_id}:${m.model}`,
          modelName: `${provider.name}/${m.model}`,
          model: m.model,
          providerId: provider.provider_id,
          providerName: provider.name,
          types: ['text'],
          displayTags: [{ value: 'type:text', label: '对话', tagType: 'primary' }],
        }))
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

// 监听设置变化自动保存
watch(() => ({
  autoLoginEnabled: settingsForm.autoLoginEnabled,
  workspaceBaseDir: settingsForm.workspaceBaseDir,
  maxToolIterations: settingsForm.maxToolIterations,
  llmRequestTimeoutMs: settingsForm.llmRequestTimeoutMs,
  llmIdleTimeoutMs: settingsForm.llmIdleTimeoutMs,
  showCharactersMenu: settingsForm.showCharactersMenu,
  showBotsMenu: settingsForm.showBotsMenu,
  showKnowledgeBaseMenu: settingsForm.showKnowledgeBaseMenu,
  showPluginsMenu: settingsForm.showPluginsMenu,
  showModelsMenu: settingsForm.showModelsMenu,
  showUsageMenu: settingsForm.showUsageMenu,
  showConnectorsMenu: settingsForm.showConnectorsMenu,
  showSchedulerMenu: settingsForm.showSchedulerMenu,
  collapseReplyProcess: settingsForm.collapseReplyProcess,
  durationDisplayFormat: settingsForm.durationDisplayFormat,
  thinkingLoaderStyle: settingsForm.thinkingLoaderStyle,
  thinkingTextCN: settingsForm.thinkingTextCN,
  thinkingTextEN: settingsForm.thinkingTextEN
}), () => {
  debouncedSave()
}, { deep: true })

// 加载 system 分组设置
const loadSettings = async () => {
  try {
    const response = await apiService.fetchGroupSettings('system')
    // 后端返回两层data嵌套：{ success: true, data: {...} }
    const data = response?.data || response

    // 填充表单
    settingsForm.autoLoginEnabled = data.autoLoginEnabled === true || data.autoLoginEnabled === 'true'
    settingsForm.workspaceBaseDir = data.workspaceBaseDir || ''
    settingsForm.maxToolIterations = Number(data.maxToolIterations) || 100
    settingsForm.llmRequestTimeoutMs = Math.round(Number(data.llmRequestTimeoutMs) / 1000) || 600
    settingsForm.llmIdleTimeoutMs = Math.round(Number(data.llmIdleTimeoutMs) / 1000) || 120

    // 从 localStorage 加载菜单显示配置
    const menuSettings = JSON.parse(localStorage.getItem('menuDisplaySettings') || '{}')
    settingsForm.showCharactersMenu = menuSettings.showCharactersMenu !== false
    settingsForm.showBotsMenu = menuSettings.showBotsMenu !== false
    settingsForm.showKnowledgeBaseMenu = menuSettings.showKnowledgeBaseMenu !== false
    settingsForm.showPluginsMenu = menuSettings.showPluginsMenu !== false
    settingsForm.showModelsMenu = menuSettings.showModelsMenu !== false
    settingsForm.showUsageMenu = menuSettings.showUsageMenu !== false
    settingsForm.showConnectorsMenu = menuSettings.showConnectorsMenu !== false
    settingsForm.showSchedulerMenu = menuSettings.showSchedulerMenu !== false
    settingsForm.collapseReplyProcess = data.collapseReplyProcess !== false
    settingsForm.durationDisplayFormat = data.durationDisplayFormat || 'seconds'
    settingsForm.thinkingLoaderStyle = data.thinkingLoaderStyle || 'matrix'
    settingsForm.thinkingTextCN = data.thinkingTextCN || '思考中'
    settingsForm.thinkingTextEN = data.thinkingTextEN || 'Thinking'
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
    // 保存菜单显示配置到 localStorage
    const menuSettings = {
      showCharactersMenu: settingsForm.showCharactersMenu,
      showBotsMenu: settingsForm.showBotsMenu,
      showKnowledgeBaseMenu: settingsForm.showKnowledgeBaseMenu,
      showPluginsMenu: settingsForm.showPluginsMenu,
      showModelsMenu: settingsForm.showModelsMenu,
      showUsageMenu: settingsForm.showUsageMenu,
      showConnectorsMenu: settingsForm.showConnectorsMenu,
      showSchedulerMenu: settingsForm.showSchedulerMenu,
    }
    localStorage.setItem('menuDisplaySettings', JSON.stringify(menuSettings))

    // 验证工作目录基路径
    const path = settingsForm.workspaceBaseDir.trim()
    if (path) {
      const isAbsolute = /^[a-zA-Z]:\\/.test(path) || path.startsWith('/')
      if (!isAbsolute) {
        message.error(t('settings.general.pathMustBeAbsolute'))
        return
      }
    }

    // 构造保存数据
    const dataToSave = {
      autoLoginEnabled: settingsForm.autoLoginEnabled,
      workspaceBaseDir: path || null,
      maxToolIterations: settingsForm.maxToolIterations,
      llmRequestTimeoutMs: settingsForm.llmRequestTimeoutMs * 1000,
      llmIdleTimeoutMs: settingsForm.llmIdleTimeoutMs * 1000,
    }

    // 使用分组设置接口更新 system 分组
    await apiService.updateGroupSettings('system', dataToSave)

    // 保存成功后更新原始数据备份
    originalSettings.value = JSON.parse(JSON.stringify(settingsForm))

    // 同步更新 authStore 中的免登录状态
    authStore.autoLoginEnabled = settingsForm.autoLoginEnabled

    notify.success(t('common.saveSuccess'), t('settings.general.updated'))
  } catch (error: any) {
    console.error('保存设置失败:', error)
    notify.error(t('common.saveFailed'), error.message || t('common.error.unknown'))
  }
}

// 打开思考文案编辑弹窗
const openThinkingTextDialog = () => {
  ElMessageBox.prompt('请输入思考状态中文文案（多个用逗号分隔）', '编辑思考状态文案', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: settingsForm.thinkingTextCN,
  }).then(({ value }) => {
    settingsForm.thinkingTextCN = value
    message.success('思考状态文案已更新')
  }).catch(() => {})
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

