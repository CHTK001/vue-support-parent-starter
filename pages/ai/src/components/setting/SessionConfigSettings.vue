<template>
  <div class="session-config-page">
    <SettingsCard title="会话配置" subtitle="配置会话的行为开关（只影响你自己的会话）">
      <SettingsRow
        label="AI 联想下一个任务"
        description="开启后，会话页会在输入框上方、目标条下方展示 AI 建议的下一步任务，点击即可作为当前目标开始"
      >
        <div class="session-config-controls">
          <el-switch
            :model-value="enabled"
            :loading="saving"
            :disabled="loading"
            aria-label="是否允许 AI 联想下一个任务"
            @change="onToggle"
          />
          <span class="session-config-state">{{ stateLabel }}</span>
        </div>
      </SettingsRow>

      <SettingsRow
        label="最多联想条数"
        description="每次让 AI 联想多少条下一步任务（1-10）"
      >
        <el-select
          v-model="maxCountModel"
          :disabled="loading"
          class="w-56"
          aria-label="AI 每次最多联想多少条下一步任务"
          @change="onMaxChange"
        >
          <el-option v-for="n in MAX_COUNT_OPTIONS" :key="n" :label="`${n} 条`" :value="n" />
        </el-select>
      </SettingsRow>

      <SettingsRow
        label="初始化加载最新的记录数量"
        description="打开会话时先加载最近多少条用户提问（含每轮对应的助手回复）；更早的记录在滚动到顶部时继续加载。调小可以让长会话打开更快"
      >
        <el-select
          v-model="initialTurnsModel"
          :disabled="loading"
          class="w-56"
          aria-label="打开会话时初始化加载最新的记录数量（用户轮次）"
          @change="onInitialTurnsChange"
        >
          <el-option v-for="n in INITIAL_LOAD_TURNS_OPTIONS" :key="n" :label="`${n} 条`" :value="n" />
        </el-select>
      </SettingsRow>

      <SettingsRow
        label="「AI 正在思考…」占位文案"
        description="AI 答复的首字还没回来时，气泡里显示哪一句。一行一句，随机轮换且不会连着两次相同；留空则用内置的默认文案"
      >
        <div class="flex flex-col gap-2 w-full">
          <el-input
            v-model="thinkingPhrasesText"
            type="textarea"
            :rows="4"
            :disabled="loading || saving"
            resize="vertical"
            placeholder="一行一句，例如：&#10;AI 正在思考…&#10;正在翻阅小抄…"
            aria-label="AI 正在思考占位文案列表"
          />
          <el-button class="self-start" type="primary" :loading="saving" :disabled="loading" @click="onThinkingPhrasesSave">
            保存文案
          </el-button>
        </div>
      </SettingsRow>

      <SettingsRow
        label="会话超时时间"
        description="一次回复连续这么久（分钟）没有任何输出就判定为超时，服务端结束该次回复并给出超时提示；填 0 = 不限制"
      >
        <el-select
          v-model="idleTimeoutModel"
          :disabled="loading"
          class="w-56"
          aria-label="会话超时时间（分钟）"
          @change="onIdleTimeoutChange"
        >
          <el-option
            v-for="m in IDLE_TIMEOUT_OPTIONS"
            :key="m"
            :label="m === 0 ? '不限制' : `${m} 分钟`"
            :value="m"
          />
        </el-select>
      </SettingsRow>

      <SettingsRow
        label="流式首包等待上限"
        description="发出请求后超过这么久（毫秒）还没出第一个字，就判定该密钥卡顿并切换；范围 1-600000"
      >
        <el-select
          v-model="firstTokenModel"
          :disabled="loading"
          class="w-56"
          aria-label="流式首包等待上限（毫秒）"
          @change="onFirstTokenChange"
        >
          <el-option
            v-for="m in FIRST_TOKEN_OPTIONS"
            :key="m"
            :label="`${m / 1000} 秒`"
            :value="m"
          />
        </el-select>
      </SettingsRow>

      <SettingsRow
        label="整段回复等待上限"
        description="已经开始输出后，最多等这么久（秒）就结束本次回复并提示"
      >
        <el-select
          v-model="completionWaitModel"
          :disabled="loading"
          class="w-56"
          aria-label="整段回复等待上限（秒）"
          @change="onCompletionWaitChange"
        >
          <el-option
            v-for="m in COMPLETION_WAIT_OPTIONS"
            :key="m"
            :label="`${m} 秒`"
            :value="m"
          />
        </el-select>
      </SettingsRow>

      <p class="session-config-note">
        <span class="session-config-note__icon"><el-icon><InfoFilled /></el-icon></span>
        <span class="session-config-note__text">
          提示：这里改的是<b>默认值</b>。每个会话会保留自己当时的取值，之后再改默认值不会回溯改写已有会话；
          想让某个会话重新跟随默认值，可在会话页把该会话的开关关掉再打开。
        </span>
      </p>
    </SettingsCard>

    <!--
      对话路由（runtime 分组）：默认对话模型、标题总结、历史压缩、翻译模型。
      原先与默认模型页的模型选择混在一起，语义上却全属「会话」——挪到这里后，
      「会话用什么模型」在一页内一次配完。
    -->
    <SettingsCard title="对话路由" subtitle="会话使用的默认模型（按用户隔离，只影响你自己的会话）">
      <SettingsRow
        v-for="item in modelFields"
        :key="item.field"
        :label="item.label"
        :description="item.description"
      >
        <el-input
          :model-value="displayValue(item.field)"
          readonly
          class="cursor-pointer"
          @click="openModelDialog(item.field)"
        >
          <template #prefix>
            <img v-if="modelLogo(item.field)" :src="modelLogo(item.field) ?? undefined" alt="" class="w-4 h-4 object-contain" />
            <OpenAI v-else class="w-4 h-4" />
          </template>
          <template #suffix>
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </template>
        </el-input>
      </SettingsRow>
    </SettingsCard>

    <ReDialog :close-on-click-modal="true" v-model="modelDialogVisible" title="选择模型" width="600px">
      <div class="md-body">
        <el-input v-model="modelSearchText" placeholder="搜索模型..." clearable>
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <div class="md-list">
          <div v-for="provider in filteredProviders" :key="provider.id">
            <div class="md-provider">{{ provider.name }}</div>
            <div v-for="model in provider.models" :key="model.id" class="md-row" @click="selectModel(model.id)">
              <div class="md-row-left">
                <span class="md-name">{{ model.model }}</span>
              </div>
              <el-icon v-if="tempModelId === model.id" class="md-check" :size="18"><CheckCircleFilled /></el-icon>
            </div>
          </div>
          <div v-if="filteredProviders.length === 0" class="md-empty">
            <div class="md-empty-main">没有匹配「对话」类型的模型</div>
            <div class="md-empty-sub">请先在「模型管理」中添加对应类型的模型</div>
          </div>
        </div>
      </div>
      <template #footer>
        <ReButton type="default" @click="clearModelField">清空（使用默认）</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiService } from '../../services/ApiService'
import { normalizeThinkingPhrases, setCustomThinkingPhrases } from '../../utils/thinkingPhrases'
import { usePopup } from '../../composables/usePopup'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { adminApi } from '@/framework/context'
import { Search, ArrowDown } from '@element-plus/icons-vue'
import { CheckCircleFilled } from '@vicons/material'
import { OpenAI } from '@/components/icons'
import ReDialog from '@repo/ui/re-dialog'
import ReButton from '@/components/ui/ReButton.vue'
import { getModelAvatarPath } from '@/utils/modelUtils'
import { invalidateInitialLoadTurnsCache } from '../../services/modules/message.api'

const { t } = useI18n()
const { notify } = usePopup()

/** 配置分组：与后端 SessionGlobalSettingProvider.GROUP 一致 */
const GROUP = 'session'
/** 开关字段名 */
const FIELD_ENABLED = 'ai_next_task_enabled'
/** 条数字段名 */
const FIELD_MAX = 'ai_next_task_max'
/**
 * 初始化加载轮次字段名：与后端 SessionGlobalSettingProvider 的 initial_load_turns 逐字一致。
 *
 * <p>单位是**用户轮次**而不是消息条数：一轮问答里助手回复也各占一条消息，
 * 按条数配会让「同样填 10」在不同会话里落成 10 轮或 6 轮。用户说的「10 条」
 * 指的是 10 次提问，所以配置项本身也按轮次定义（后端按 user 消息取窗口边界）。</p>
 */
const FIELD_INITIAL_TURNS = 'initial_load_turns'
/**
 * 「AI 正在思考…」占位文案（一行一句）。
 *
 * 存**文本**而不是 JSON 数组：用户是在多行输入框里一句一行地填，文本形态最省事；
 * 读取侧统一用 normalizeThinkingPhrases 规整（见 utils/thinkingPhrases.ts），
 * 空串 = 用内置默认文案。
 */
const FIELD_THINKING_PHRASES = 'thinking_placeholder_phrases'
/** 初始化加载轮次的默认值：与后端 SPI 声明的 10 对齐，配置缺失时不让下拉空着 */
const DEFAULT_INITIAL_TURNS = 10
/** 会话超时字段名（分钟） */
const FIELD_IDLE_TIMEOUT = 'stream_idle_timeout_minutes'
/** 流式首包等待上限（毫秒）：超时即判定该密钥卡顿并切换 */
const FIELD_FIRST_TOKEN_TIMEOUT = 'stream_first_token_timeout_millis'
/** 整段回复等待上限（秒） */
const FIELD_COMPLETION_WAIT = 'stream_completion_wait_seconds'
/** 会话超时兜底值：后端未返回时用它，不让输入框空着 */
const DEFAULT_IDLE_TIMEOUT = 30
const DEFAULT_FIRST_TOKEN_TIMEOUT = 8000
const DEFAULT_COMPLETION_WAIT = 100

/**
 * 会话超时的可选档位（分钟）。0 = 不限制。
 *
 * <p>用下拉而不是数字框：本页原先用 el-input-number，实测它的 +/- 按钮点了没反应
 * （直接 click span 与内部 icon 都试过，输入框仍是原值；同一组件在别的页面正常）。
 * 超时本就该选档位而不是手打任意分钟数，顺带也避开了这个控件问题。</p>
 */
const IDLE_TIMEOUT_OPTIONS = [0, 5, 10, 15, 30, 45, 60, 120]

/** 首包等待可选档位（毫秒）：默认 8s，与后端定义 defaultValue 对齐 */
const FIRST_TOKEN_OPTIONS = [3000, 5000, 8000, 15000, 30000, 60000]
/** 整段回复等待可选档位（秒）：默认 100s */
const COMPLETION_WAIT_OPTIONS = [60, 100, 180, 300, 600, 1800]

/** 联想条数的可选档位 */
const MAX_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10]

/**
 * 初始化加载轮次的可选档位。
 *
 * <p>档位与 {@link MAX_COUNT_OPTIONS} 同风格（升序、取整），上限 50 与后端
 * {@code AiSessionController.MAX_INITIAL_TURNS} 对齐：再大就等于「打开会话把整段历史铺出来」，
 * 正是这个配置要解决的问题。</p>
 */
const INITIAL_LOAD_TURNS_OPTIONS = [5, 10, 15, 20, 30, 50]

// ===================== 对话路由（runtime 分组的模型选择） =====================

/** 对话路由分组：与后端 RuntimeGlobalSettingProvider.GROUP 一致 */
const RUNTIME_GROUP = 'runtime'

/**
 * 会话相关的模型字段。
 *
 * <p>原先这些字段在「默认模型」页里与图片识别/人脸/OCR 等模型并列，语义上却全属
 * 「会话用哪个模型」；挪到这里后一次配完。字段名与后端 runtime 分组定义一致。</p>
 */
const MODEL_FIELDS = [
  { field: 'default_model', label: '默认对话模型', description: '会话默认使用的对话模型' },
  { field: 'default_title_summary_model', label: '标题总结模型', description: '生成会话标题用的模型' },
  { field: 'default_history_compression_model', label: '历史压缩模型', description: '压缩长会话历史记录用的模型' },
  { field: 'default_translation_model', label: '翻译模型', description: '跨语言对话用的翻译模型' },
]

/** runtime 分组合并值：field -> { value, overridden, origin } */
const runtimeValues = ref<Record<string, any>>({})

/** 模型弹框状态 */
const modelDialogVisible = ref(false)
const modelSearchText = ref('')
const currentField = ref('')
const tempModelId = ref('')

/** 模型数据源（与 DefaultModelSettings 同源：/api/providers） */
const models = ref<any[]>([])
const providers = ref<any[]>([])
let modelsLoadPromise: Promise<void> | null = null

/**
 * 加载模型列表（in-flight 去重，避免 onMounted 与弹框并发触发双份请求）。
 */
const loadModels = () => {
  if (modelsLoadPromise) return modelsLoadPromise
  modelsLoadPromise = (async () => {
    try {
      const body = await adminApi.get('/api/providers')
      const data = Array.isArray(body) ? body : body?.data || []
      const all: any[] = []
      const provs: any[] = []
      for (const p of data) {
        const list = (p.models || []).filter((m: any) => m.enabled !== false).map((m: any) => ({
          id: `${p.provider_id}:${m.model}`,
          model: m.model,
          providerId: p.provider_id,
          providerName: p.name,
        }))
        if (list.length) {
          all.push(...list)
          provs.push({ id: p.provider_id, name: p.name, models: list })
        }
      }
      models.value = all
      providers.value = provs
    } catch (e) {
      console.error('获取模型列表失败:', e)
    } finally {
      modelsLoadPromise = null
    }
  })()
  return modelsLoadPromise
}

/** 过滤后的模型列表：模板里引用了未声明的 computed，先用 computed 包一层保持响应式 */
const filteredProviders = computed(() => {
  const kw = modelSearchText.value.trim().toLowerCase()
  if (!kw) return providers.value
  return providers.value
    .map((p) => ({ ...p, models: p.models.filter((m: any) => m.model.toLowerCase().includes(kw)) }))
    .filter((p) => p.models.length > 0)
})

/**
 * runtime 分组合并视图里取字段值。
 *
 * @param field 字段名
 * @returns 合并项；未取到时返回 undefined
 */
const runtimeItem = (field: string) => runtimeValues.value[field]

/**
 * 模型字段的展示文本：未配置/系统种子显示「请选择模型」，已覆盖显示具体模型名。
 *
 * @param field 字段名
 */
const displayValue = (field: string): string => {
  const item = runtimeItem(field)
  if (!item || !item.value || item.origin === 'SYSTEM_DEFAULT') return '请选择模型'
  return item.overridden === false ? `继承全局：${item.value}` : item.value
}

/**
 * 模型字段的 logo（值形如 providerId:model，剥前缀后取本地图标）。
 *
 * @param field 字段名
 */
const modelLogo = (field: string): string | null => {
  const v = String(runtimeItem(field)?.value ?? '')
  if (!v) return null
  const name = v.includes(':') ? v.split(':').slice(1).join(':') : v
  return getModelAvatarPath(name)
}

/**
 * 打开模型选择弹框。
 *
 * @param field 目标字段名
 */
const openModelDialog = async (field: string) => {
  currentField.value = field
  tempModelId.value = String(runtimeItem(field)?.value ?? '')
  modelDialogVisible.value = true
  if (models.value.length === 0) await loadModels()
}

/**
 * 选择模型：写 runtime 分组的本人覆盖层。
 *
 * @param modelId providerId:model
 */
const selectModel = (modelId: string) => {
  if (!modelId || !currentField.value) return
  saveRuntimeField(currentField.value, modelId)
  modelDialogVisible.value = false
}

/**
 * 清空字段：写空值覆盖，使其回到「未配置」。
 */
const clearModelField = () => {
  if (!currentField.value) return
  saveRuntimeField(currentField.value, '')
  modelDialogVisible.value = false
}

/**
 * 写入单个 runtime 字段的用户覆盖并刷新。
 *
 * @param field 字段名
 * @param value 值；空串表示撤销（回落继承值）
 */
const saveRuntimeField = async (field: string, value: string) => {
  try {
    await apiService.updateUserGroupOverrides(RUNTIME_GROUP, { [field]: value === '' ? null : value })
    await loadRuntime()
  } catch (error) {
    console.error(`保存 runtime.${field} 失败:`, error)
    notify.error('保存设置失败', error)
  }
}

/**
 * 加载 runtime 分组合并视图到本地映射。
 */
const loadRuntime = async () => {
  try {
    const response = await apiService.fetchMergedGroupSettings(RUNTIME_GROUP)
    const first = response?.data ?? response
    const items = Array.isArray(first) ? first : Array.isArray(first?.data) ? first.data : []
    const map: Record<string, any> = {}
    for (const item of items) {
      if (item?.field) map[item.field] = item
    }
    runtimeValues.value = map
  } catch (error) {
    console.error('获取 runtime 分组设置失败:', error)
  }
}

/** 模板用的模型字段清单 */
const modelFields = MODEL_FIELDS

const loading = ref(false)
const saving = ref(false)
const enabled = ref(false)
const defaultEnabled = ref(false)
const overridden = ref(false)
const maxCount = ref(3)
const idleTimeout = ref(DEFAULT_IDLE_TIMEOUT)
const initialTurns = ref(DEFAULT_INITIAL_TURNS)
/**
 * 下拉框的 v-model 绑定目标。
 *
 * <p>存的是「已归一化到可选档位内」的值：库里若被手工填了档位外的数字（例如 37），
 * 这里会落到最近的合法档位，避免下拉显示成一个列表里不存在的项。</p>
 */
const maxCountModel = ref(3)
const idleTimeoutModel = ref(DEFAULT_IDLE_TIMEOUT)
const firstTokenTimeout = ref(DEFAULT_FIRST_TOKEN_TIMEOUT)
const firstTokenModel = ref(DEFAULT_FIRST_TOKEN_TIMEOUT)
const completionWait = ref(DEFAULT_COMPLETION_WAIT)
const completionWaitModel = ref(DEFAULT_COMPLETION_WAIT)
const initialTurnsModel = ref(DEFAULT_INITIAL_TURNS)
/** 「AI 正在思考…」占位文案（多行文本，一行一句）；空 = 用内置默认文案 */
const thinkingPhrasesText = ref('')

/**
 * 保存占位文案。
 *
 * <p>先落进内存里的文案库再写用户覆盖层，顺序刻意如此：写库失败时本次会话也已经是新文案，
 * 不会出现「设置页显示已改、气泡里还是旧句子」的错位。</p>
 */
const onThinkingPhrasesSave = async () => {
  const text = normalizeThinkingPhrases(thinkingPhrasesText.value).join('\n')
  thinkingPhrasesText.value = text
  setCustomThinkingPhrases(text)
  await saveOverrides({ [FIELD_THINKING_PHRASES]: text })
}

/**
 * 把任意数值归一化到给定档位里最近的一个。
 *
 * @param value   原始值
 * @param options 合法档位（升序）
 * @param fallback 全部不可用时的兜底
 * @returns 归一化后的档位值
 */
function nearestOption(value: number, options: number[], fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback
  }
  if (options.includes(value)) {
    return value
  }
  let best = options[0]
  for (const option of options) {
    if (Math.abs(option - value) < Math.abs(best - value)) {
      best = option
    }
  }
  return best
}

/**
 * 开关状态文案：区分「继承默认值」与「已覆盖」两种来源。
 *
 * 后端 merged 视图里 `overridden=false` 表示继承全局默认；此时直接说「关闭」会让人
 * 以为是自己关掉的，实际改一次默认值就会跟着变。
 */
const stateLabel = computed((): string => {
  if (!overridden.value) {
    return `跟随默认（${defaultEnabled.value ? '开' : '关'}）`
  }
  return enabled.value ? '已开启' : '已关闭'
})

/**
 * 从 merged 响应里取到指定字段的值。
 *
 * merged 响应是双层信封（见 DefaultModelSettings 的 pickGroups 注释），
 * 这里对数组/对象两种形态都兜住。
 *
 * @param response 接口响应
 * @param field    字段名
 * @returns 字段值；取不到时返回 undefined
 */
const pickField = (response: any, field: string): any => {
  const first = response?.data ?? response
  const items = Array.isArray(first) ? first : Array.isArray(first?.data) ? first.data : []
  return items.find((item: any) => item?.field === field)
}

/**
 * 加载该分组的合并视图（全局默认 + 本人覆盖）。
 */
const load = async () => {
  loading.value = true
  try {
    const response = await apiService.fetchMergedGroupSettings(GROUP)
    const item = pickField(response, FIELD_ENABLED)
    if (item) {
      overridden.value = item.overridden === true
      enabled.value = String(item.value ?? '').toLowerCase() === 'true'
      defaultEnabled.value = String(item.defaultValue ?? '').toLowerCase() === 'true'
    }
    const maxItem = pickField(response, FIELD_MAX)
    const max = Number(maxItem?.value ?? maxItem?.defaultValue)
    maxCount.value = Number.isFinite(max) && max >= 1 ? Math.min(max, 10) : 3
    maxCountModel.value = nearestOption(maxCount.value, MAX_COUNT_OPTIONS, 3)
    const idleItem = pickField(response, FIELD_IDLE_TIMEOUT)
    const idle = Number(idleItem?.value ?? idleItem?.defaultValue)
    // 0 是合法值（= 不限制超时），所以不能用 `|| DEFAULT` 兜底，否则 0 会被吞成 30
    idleTimeout.value = Number.isFinite(idle) && idle >= 0
      ? Math.min(idle, 180)
      : DEFAULT_IDLE_TIMEOUT
    idleTimeoutModel.value = nearestOption(idleTimeout.value, IDLE_TIMEOUT_OPTIONS, DEFAULT_IDLE_TIMEOUT)
    const firstTokenItem = pickField(response, FIELD_FIRST_TOKEN_TIMEOUT)
    const firstToken = Number(firstTokenItem?.value ?? firstTokenItem?.defaultValue)
    firstTokenTimeout.value = Number.isFinite(firstToken) && firstToken > 0
      ? Math.min(Math.trunc(firstToken), 600000)
      : DEFAULT_FIRST_TOKEN_TIMEOUT
    firstTokenModel.value = nearestOption(firstTokenTimeout.value, FIRST_TOKEN_OPTIONS, DEFAULT_FIRST_TOKEN_TIMEOUT)
    const completionItem = pickField(response, FIELD_COMPLETION_WAIT)
    const completion = Number(completionItem?.value ?? completionItem?.defaultValue)
    completionWait.value = Number.isFinite(completion) && completion > 0
      ? Math.min(Math.trunc(completion), 3600)
      : DEFAULT_COMPLETION_WAIT
    completionWaitModel.value = nearestOption(completionWait.value, COMPLETION_WAIT_OPTIONS, DEFAULT_COMPLETION_WAIT)
    const turnsItem = pickField(response, FIELD_INITIAL_TURNS)
    const turns = Number(turnsItem?.value ?? turnsItem?.defaultValue)
    initialTurns.value = Number.isFinite(turns) && turns >= 1
      ? Math.min(Math.trunc(turns), INITIAL_LOAD_TURNS_OPTIONS[INITIAL_LOAD_TURNS_OPTIONS.length - 1])
      : DEFAULT_INITIAL_TURNS
    initialTurnsModel.value = nearestOption(initialTurns.value, INITIAL_LOAD_TURNS_OPTIONS, DEFAULT_INITIAL_TURNS)

    const phrasesItem = pickField(response, FIELD_THINKING_PHRASES)
    const phrases = normalizeThinkingPhrases(phrasesItem?.value ?? phrasesItem?.defaultValue)
    thinkingPhrasesText.value = phrases.join('\n')
    // 同步进内存文案库：设置页里读到的就是气泡里将要显示的那一份，两处不各持一份状态
    setCustomThinkingPhrases(phrases)
  } catch (error) {
    console.error('获取 session 分组设置失败:', error)
    notify.error(t('settings.loadFailed'), error)
  } finally {
    loading.value = false
  }
}

/**
 * 写入用户覆盖层（不动全局默认）。
 *
 * @param payload 字段值集合
 */
const saveOverrides = async (payload: Record<string, unknown>) => {
  saving.value = true
  try {
    await apiService.updateUserGroupOverrides(GROUP, payload)
    // 会话首屏加载轮次在消息出口侧有一份进程内缓存（见 message.api.ts）。
    // 不在这里失效的话，用户改完设置立刻开会话，读到的还是旧轮次，得刷新页面才生效。
    invalidateInitialLoadTurnsCache()
    await load()
  } catch (error) {
    console.error('保存 session 分组设置失败:', error)
    notify.error('保存设置失败', error)
  } finally {
    saving.value = false
  }
}

/**
 * 开关切换：写本人覆盖层。
 *
 * @param value 切换后的值
 */
const onToggle = async (value: boolean | string | number) => {
  enabled.value = value === true
  await saveOverrides({ [FIELD_ENABLED]: enabled.value })
}

/**
 * 条数变更：写本人覆盖层。
 *
 * @param value 变更后的值
 */
const onMaxChange = (value: number | undefined) => {
  if (!Number.isFinite(value)) {
    return
  }
  maxCount.value = nearestOption(Math.trunc(Number(value)), MAX_COUNT_OPTIONS, 3)
  maxCountModel.value = maxCount.value
  saveOverrides({ [FIELD_MAX]: maxCount.value })
}

/**
 * 会话超时变更：写本人覆盖层。
 *
 * @param value 变更后的分钟数
 */
const onIdleTimeoutChange = (value: number | undefined) => {
  if (!Number.isFinite(value)) {
    return
  }
  // 0 = 不限制，是合法取值，必须原样写下去
  idleTimeout.value = nearestOption(Math.trunc(Number(value)), IDLE_TIMEOUT_OPTIONS, DEFAULT_IDLE_TIMEOUT)
  idleTimeoutModel.value = idleTimeout.value
  saveOverrides({ [FIELD_IDLE_TIMEOUT]: idleTimeout.value })
}

/**
 * 流式首包等待上限变更：写本人覆盖层（毫秒）。
 *
 * @param value 变更后的毫秒数
 */
const onFirstTokenChange = (value: number | undefined) => {
  if (!Number.isFinite(value)) {
    return
  }
  firstTokenTimeout.value = nearestOption(Math.trunc(Number(value)), FIRST_TOKEN_OPTIONS, DEFAULT_FIRST_TOKEN_TIMEOUT)
  firstTokenModel.value = firstTokenTimeout.value
  saveOverrides({ [FIELD_FIRST_TOKEN_TIMEOUT]: firstTokenTimeout.value })
}

/**
 * 整段回复等待上限变更：写本人覆盖层（秒）。
 *
 * @param value 变更后的秒数
 */
const onCompletionWaitChange = (value: number | undefined) => {
  if (!Number.isFinite(value)) {
    return
  }
  completionWait.value = nearestOption(Math.trunc(Number(value)), COMPLETION_WAIT_OPTIONS, DEFAULT_COMPLETION_WAIT)
  completionWaitModel.value = completionWait.value
  saveOverrides({ [FIELD_COMPLETION_WAIT]: completionWait.value })
}

/**
 * 初始化加载轮次变更：写本人覆盖层。
 *
 * @param value 变更后的用户轮次数
 */
const onInitialTurnsChange = (value: number | undefined) => {
  if (!Number.isFinite(value)) {
    return
  }
  initialTurns.value = nearestOption(
    Math.trunc(Number(value)),
    INITIAL_LOAD_TURNS_OPTIONS,
    DEFAULT_INITIAL_TURNS,
  )
  initialTurnsModel.value = initialTurns.value
  saveOverrides({ [FIELD_INITIAL_TURNS]: initialTurns.value })
}

onMounted(() => {
  load()
  loadRuntime()
})
</script>

<style scoped>
.session-config-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-config-controls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.session-config-state {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  white-space: nowrap;
}

/* 底部说明：SettingsCard 自身无内边距，里面的 .set-row 各带 15px 18px，
   这段裸 <p> 直接贴着卡片左右边框与下边缘，看起来像溢出。补齐 18px 左右 +
   底部留白，并用一条与 .set-row 分隔线同源的细线把「说明」和「配置项」分开。 */
.session-config-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  padding: 14px 18px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.session-config-note__icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--el-text-color-placeholder);
}

.session-config-note__text {
  min-width: 0;
}

/* <b> 就在本组件模板里，scoped 样式直接命中，无需 :deep */
.session-config-note b {
  color: var(--el-text-color-regular);
  font-weight: 600;
}

/* 模型选择弹框：与 DefaultModelSettings 同一套结构，样式就近维护 */
.md-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.md-list {
  max-height: 360px;
  overflow-y: auto;
}
.md-provider {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding: 6px 4px;
}
.md-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
}
.md-row:hover {
  background: var(--el-fill-color-light);
}
.md-row-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.md-name {
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.md-check {
  color: var(--el-color-primary);
}
.md-empty {
  text-align: center;
  padding: 24px 0;
}
.md-empty-main {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.md-empty-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>