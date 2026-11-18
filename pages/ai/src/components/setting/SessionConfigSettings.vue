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
        label="输入历史记录数量"
        description="输入框按 ↑ 能翻回的历史条数上限（1-1000，默认 100）。这些记录加密保存在本浏览器的 IndexedDB 里，不随账号同步；调小后多余的老记录会在下一次发送时自动清理"
      >
        <el-select
          v-model="historyLimitModel"
          class="w-56"
          aria-label="输入历史记录数量"
          @change="onHistoryLimitChange"
        >
          <el-option v-for="n in historyLimitOptions" :key="n" :label="`${n} 条`" :value="n" />
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
        label="最后一条回复默认折叠"
        description="开启后，最新一轮 AI 回复的正文默认只显示一行预览，点击左侧图标位的箭头或预览行即可展开全文；关闭则每条回复都一直展开全文"
      >
        <div class="session-config-controls">
          <el-switch
            :model-value="collapseLastReply"
            :loading="saving"
            :disabled="loading"
            aria-label="最后一条回复默认折叠"
            @change="onCollapseLastReplyChange"
          />
          <span class="session-config-state">{{ collapseStateLabel }}</span>
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

      <SettingsRow
        label="单轮执行超时"
        description="这一轮总共跑这么久（秒）仍未完成就结束并中断执行，即使一直在输出也会收口；填 0 = 不限制"
      >
        <el-select
          v-model="turnTimeoutModel"
          :disabled="loading"
          class="w-56"
          aria-label="单轮执行超时（秒）"
          @change="onTurnTimeoutChange"
        >
          <el-option
            v-for="m in TURN_TIMEOUT_OPTIONS"
            :key="m"
            :label="m === 0 ? '不限制' : `${m} 秒`"
            :value="m"
          />
        </el-select>
      </SettingsRow>

      <SettingsRow
        label="失败自动重试次数"
        description="本轮的正文/思考/工具结果都还没输出时失败，自动重发几次；已经开始输出后失败不会重试（避免拼出两段回复）"
      >
        <el-select
          v-model="retryMaxModel"
          :disabled="loading"
          class="w-56"
          aria-label="失败自动重试次数"
          @change="onRetryMaxChange"
        >
          <el-option
            v-for="m in RETRY_MAX_OPTIONS"
            :key="m"
            :label="m === 0 ? '不重试' : `${m} 次`"
            :value="m"
          />
        </el-select>
      </SettingsRow>

      <SettingsRow
        label="重试间隔"
        description="每次重试前等待多久；开启指数退避后，第 n 次重试等待「间隔 × 2^(n-1)」"
      >
        <el-select
          v-model="retryIntervalModel"
          :disabled="loading"
          class="w-56"
          aria-label="重试间隔（秒）"
          @change="onRetryIntervalChange"
        >
          <el-option
            v-for="m in RETRY_INTERVAL_OPTIONS"
            :key="m"
            :label="`${m} 秒`"
            :value="m"
          />
        </el-select>
      </SettingsRow>

      <SettingsRow
        label="重试指数退避"
        description="关闭时每次重试都按固定间隔等待；开启后间隔逐次翻倍，避免上游持续故障时被连续轰击"
      >
        <div class="session-config-controls">
          <el-switch
            :model-value="retryBackoff"
            :loading="saving"
            :disabled="loading"
            aria-label="重试是否启用指数退避"
            @change="onRetryBackoffChange"
          />
          <span class="session-config-state">{{ retryBackoff ? '已开启' : '固定间隔' }}</span>
        </div>
      </SettingsRow>

      <SettingsRow
        label="重启后自动继续"
        description="服务重启时，如果有一轮「已经提问、助手还没回完」的对话，自动补发「继续」把它跑完；工作区终端也会自动输入一次「继续」"
      >
        <div class="session-config-controls">
          <el-switch
            :model-value="autoContinue"
            :loading="saving"
            :disabled="loading"
            aria-label="重启后是否自动继续未完成的回合"
            @change="onAutoContinueChange"
          />
          <span class="session-config-state">{{ autoContinue ? '已开启' : '已关闭' }}</span>
        </div>
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
            <!-- 输入框左侧图标与弹框行同一套回退链：模型 logo → 上游通道 → 供应商 logo。
                 原先取不到模型图时一律画 OpenAI 图标，聚合渠道里会误标成 OpenAI。 -->
            <ModelRowLogo
              v-if="selectedModelRow(item.field)"
              :model="selectedModelRow(item.field)?.model"
              :provider="selectedModelRow(item.field)?.provider"
              :size="16"
              class="mr-1"
            />
            <OpenAI v-else class="w-4 h-4" />
          </template>
          <template #suffix>
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </template>
        </el-input>
      </SettingsRow>
    </SettingsCard>

    <!-- 模型选择弹框：与「默认模型」页共用 ModelPickerDialog（搜索 / 供应商分组 /
         类型标签 / 输入输出 / 延迟 / 图标回退链 / 清空），不再在本页单独实现一套。 -->
    <ModelPickerDialog
      :visible="modelDialogVisible"
      :providers="providers"
      :selected-id="tempModelId"
      empty-text="没有匹配「对话」类型的模型"
      @update:visible="(v) => (modelDialogVisible = v)"
      @select="selectModel"
      @clear="clearModelField"
    />
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
import { ArrowDown } from '@element-plus/icons-vue'
import { OpenAI } from '@/components/icons'
import ModelPickerDialog from './dms/ModelPickerDialog.vue'
import ModelRowLogo from '@/components/models/ModelRowLogo.vue'
import { mapProviderModel, findPickedModel } from '@/components/models/modelMeta'
import { invalidateInitialLoadTurnsCache, invalidateCollapseLastReplyCache } from '../../services/modules/message.api'
import {
  DEFAULT_MESSAGE_HISTORY_LIMIT,
  MAX_MESSAGE_HISTORY_LIMIT,
  getMessageHistoryLimit,
  setMessageHistoryLimit,
} from '@repo/utils'

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
/** 「最后一条回复默认折叠」开关：与后端 SessionGlobalSettingProvider 的 collapse_last_reply 逐字一致 */
const FIELD_LAST_REPLY_COLLAPSE = 'collapse_last_reply'
/** 初始化加载轮次的默认值：与后端 SPI 声明的 10 对齐，配置缺失时不让下拉空着 */
const DEFAULT_INITIAL_TURNS = 10
/** 会话超时字段名（分钟） */
const FIELD_IDLE_TIMEOUT = 'stream_idle_timeout_minutes'
/** 流式首包等待上限（毫秒）：超时即判定该密钥卡顿并切换 */
const FIELD_FIRST_TOKEN_TIMEOUT = 'stream_first_token_timeout_millis'
/** 整段回复等待上限（秒） */
const FIELD_COMPLETION_WAIT = 'stream_completion_wait_seconds'
/**
 * 会话超时兜底值（分钟）：与后端 {@code SessionGlobalSettingProvider} 里
 * {@code stream_idle_timeout_minutes} 的 {@code defaultValue}（5）逐字对齐。
 *
 * <p>后端未返回该字段（老版本后端 / 接口异常）时用它，不让输入框空着；
 * 这里若与后端默认值不同，用户在设置页看到的就是一个服务端并不认的值。</p>
 */
const DEFAULT_IDLE_TIMEOUT = 5
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

/** 单轮执行超时字段名（秒，0=不限制） */
const FIELD_TURN_TIMEOUT = 'stream_turn_timeout_seconds'
/** 失败重试次数字段名 */
const FIELD_RETRY_MAX = 'stream_retry_max'
/** 重试间隔字段名（秒） */
const FIELD_RETRY_INTERVAL = 'stream_retry_interval_seconds'
/** 重试指数退避开关字段名 */
const FIELD_RETRY_BACKOFF = 'stream_retry_backoff'
/** 重启后自动继续开关字段名 */
const FIELD_AUTO_CONTINUE = 'auto_continue_on_restart'

/** 单轮执行超时默认值（秒）：与后端 SessionGlobalSettingProvider 的 600 对齐 */
const DEFAULT_TURN_TIMEOUT = 600
/** 失败重试默认次数 */
const DEFAULT_RETRY_MAX = 2
/** 重试间隔默认值（秒） */
const DEFAULT_RETRY_INTERVAL = 5

/** 单轮执行超时可选档位（秒），0 = 不限制 */
const TURN_TIMEOUT_OPTIONS = [0, 60, 120, 300, 600, 900, 1800, 3600]
/** 失败重试次数可选档位 */
const RETRY_MAX_OPTIONS = [0, 1, 2, 3, 5, 10]
/** 重试间隔可选档位（秒） */
const RETRY_INTERVAL_OPTIONS = [2, 5, 10, 15, 30, 60]

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

/**
 * 输入历史记录数量的可选档位（条）。
 *
 * <p>默认 100 与 {@code DEFAULT_MESSAGE_HISTORY_LIMIT} 对齐。这一项与上面几条不同：
 * 历史记录存在**本浏览器的 IndexedDB**（AES 加密）里，条数是本机配置，不进服务端
 * 覆盖层——换一台机器、换一个浏览器就没有那份记录可谈「同步条数」。</p>
 */
const HISTORY_LIMIT_OPTIONS = [50, DEFAULT_MESSAGE_HISTORY_LIMIT, 200, 300, 500, MAX_MESSAGE_HISTORY_LIMIT]

// ===================== 对话路由（runtime 分组的模型选择） =====================

/** 对话路由分组：与后端 RuntimeGlobalSettingProvider.GROUP 一致 */
const RUNTIME_GROUP = 'runtime'

/**
 * 会话相关的模型字段。
 *
 * <p>只保留后端真正定义并被消费的 {@code runtime.default_model}。原先还有
 * 「标题总结 / 历史压缩 / 翻译」三项，它们既不在 {@code RuntimeGlobalSettingProvider}
 * 的定义里，也在全仓 Java 源码里没有消费方（写进用户覆盖层后没人读），属于假配置，
 * 已移除。历史压缩的真实字段是 {@code runtime.modelId}（见「通用 → 对话上下文」），
 * 不要在这里再开第二个入口。</p>
 */
const MODEL_FIELDS = [
  { field: 'default_model', label: '默认对话模型', description: '会话默认使用的对话模型' },
]

/** runtime 分组合并值：field -> { value, overridden, origin } */
const runtimeValues = ref<Record<string, any>>({})

/** 模型弹框状态 */
const modelDialogVisible = ref(false)
const currentField = ref('')
const tempModelId = ref('')

/** 模型数据源（与 DefaultModelSettings 同源：/api/providers） */
const models = ref<any[]>([])
const providers = ref<any[]>([])
let modelsLoadPromise: Promise<void> | null = null

/**
 * 加载模型列表（in-flight 去重，避免 onMounted 与弹框并发触发双份请求）。
 *
 * <p>候选行由 {@code mapProviderModel} 统一构造：类型标签、输入/输出、延迟与
 * 「这一行真正接的上游通道」都带上，弹框才能与「默认模型」页长得一样。
 * 这四个字段都是对话路由，只保留能跑对话（含 text 类型）的模型。</p>
 */
const loadModels = () => {
  if (modelsLoadPromise) return modelsLoadPromise
  modelsLoadPromise = (async () => {
    try {
      // 只要已开启的模型（口径由账号模块判定）
      const body = await adminApi.get('/api/providers')
      const data = Array.isArray(body) ? body : body?.data || []
      const all: any[] = []
      const provs: any[] = []
      for (const p of data) {
        if (!p?.provider_id) continue
        const list = (p.models || [])
          .map((m: any) => mapProviderModel(p, m))
          .filter((m: any) => (m.types || []).includes('text'))
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
 * 模型字段当前选中的模型行（值形如 providerId:model）。
 *
 * <p>只给输入框左侧的图标用：优先取已加载的候选行（带 description，
 * 能还原这一行真正接的上游通道），与弹框行同一套回退链。</p>
 *
 * @param field 字段名
 * @returns 模型行；未配置时返回 null
 */
const selectedModelRow = (field: string) => findPickedModel(runtimeItem(field)?.value, providers.value)

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
/** 单轮执行超时（秒） */
const turnTimeout = ref(DEFAULT_TURN_TIMEOUT)
const turnTimeoutModel = ref(DEFAULT_TURN_TIMEOUT)
/** 失败重试次数 */
const retryMax = ref(DEFAULT_RETRY_MAX)
const retryMaxModel = ref(DEFAULT_RETRY_MAX)
/** 重试间隔（秒） */
const retryInterval = ref(DEFAULT_RETRY_INTERVAL)
const retryIntervalModel = ref(DEFAULT_RETRY_INTERVAL)
/** 重试是否指数退避 */
const retryBackoff = ref(false)
/** 重启后是否自动继续未完成的回合 */
const autoContinue = ref(true)
const initialTurnsModel = ref(DEFAULT_INITIAL_TURNS)
/** 「AI 正在思考…」占位文案（多行文本，一行一句）；空 = 用内置默认文案 */
const thinkingPhrasesText = ref('')
/** 「最后一条回复默认折叠」开关：false=一直展开（默认），true=默认收成一行 */
const collapseLastReply = ref(false)
const defaultCollapseLastReply = ref(false)
const overriddenCollapseLastReply = ref(false)
/** 输入历史记录数量（本浏览器的 IndexedDB 配置，默认 100） */
const historyLimitModel = ref(getMessageHistoryLimit())

/**
 * 条数档位：库里若被手工写成档位外的值（例如 137），下拉也要能显示它。
 */
const historyLimitOptions = computed(() => {
  const list = [...HISTORY_LIMIT_OPTIONS]
  if (!list.includes(historyLimitModel.value)) list.push(historyLimitModel.value)
  return list.sort((a, b) => a - b)
})

/**
 * 保存输入历史记录数量。
 *
 * @param value 用户选中的档位（条）
 */
const onHistoryLimitChange = (value: number) => {
  historyLimitModel.value = setMessageHistoryLimit(value)
  notify.success('已保存', `输入历史最多保留 ${historyLimitModel.value} 条（仅保存在本浏览器）`)
}

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

/** 折叠开关的状态文案：区分「继承默认值」与「已覆盖」两种来源 */
const collapseStateLabel = computed((): string => {
  if (!overriddenCollapseLastReply.value) {
    return `跟随默认（${defaultCollapseLastReply.value ? '开' : '关'}）`
  }
  return collapseLastReply.value ? '已开启' : '已关闭'
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
    // 0 是合法值（= 不限制超时），所以不能用 `|| DEFAULT` 兜底，否则 0 会被吞成 5
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
    const turnTimeoutItem = pickField(response, FIELD_TURN_TIMEOUT)
    const turnTimeoutValue = Number(turnTimeoutItem?.value ?? turnTimeoutItem?.defaultValue)
    // 0 = 不限制，是合法值，不能用 `|| DEFAULT` 兜底
    turnTimeout.value = Number.isFinite(turnTimeoutValue) && turnTimeoutValue >= 0
      ? Math.min(Math.trunc(turnTimeoutValue), 86400)
      : DEFAULT_TURN_TIMEOUT
    turnTimeoutModel.value = nearestOption(turnTimeout.value, TURN_TIMEOUT_OPTIONS, DEFAULT_TURN_TIMEOUT)
    const retryMaxItem = pickField(response, FIELD_RETRY_MAX)
    const retryMaxValue = Number(retryMaxItem?.value ?? retryMaxItem?.defaultValue)
    retryMax.value = Number.isFinite(retryMaxValue) && retryMaxValue >= 0
      ? Math.min(Math.trunc(retryMaxValue), 10)
      : DEFAULT_RETRY_MAX
    retryMaxModel.value = nearestOption(retryMax.value, RETRY_MAX_OPTIONS, DEFAULT_RETRY_MAX)
    const retryIntervalItem = pickField(response, FIELD_RETRY_INTERVAL)
    const retryIntervalValue = Number(retryIntervalItem?.value ?? retryIntervalItem?.defaultValue)
    retryInterval.value = Number.isFinite(retryIntervalValue) && retryIntervalValue > 0
      ? Math.min(Math.trunc(retryIntervalValue), 300)
      : DEFAULT_RETRY_INTERVAL
    retryIntervalModel.value = nearestOption(retryInterval.value, RETRY_INTERVAL_OPTIONS, DEFAULT_RETRY_INTERVAL)
    const backoffItem = pickField(response, FIELD_RETRY_BACKOFF)
    retryBackoff.value = String(backoffItem?.value ?? backoffItem?.defaultValue ?? 'false').toLowerCase() === 'true'
    const autoContinueItem = pickField(response, FIELD_AUTO_CONTINUE)
    autoContinue.value = String(autoContinueItem?.value ?? autoContinueItem?.defaultValue ?? 'true').toLowerCase() === 'true'
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

    const collapseItem = pickField(response, FIELD_LAST_REPLY_COLLAPSE)
    if (collapseItem) {
      overriddenCollapseLastReply.value = collapseItem.overridden === true
      collapseLastReply.value = String(collapseItem.value ?? '').toLowerCase() === 'true'
      defaultCollapseLastReply.value = String(collapseItem.defaultValue ?? 'false').toLowerCase() === 'true'
    }
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
    // 会话折叠开关在回合侧有一份进程内缓存（见 TurnItem 的 ensureCollapseLastReplyLoaded），
    // 不在这里失效的话，用户改完设置再开会话，读到的还是旧折叠值，得刷新页面才生效。
    invalidateInitialLoadTurnsCache()
    invalidateCollapseLastReplyCache()
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

/** 「最后一条回复默认折叠」开关变更：写本人覆盖层 */
const onCollapseLastReplyChange = (value: boolean | string | number) => {
  collapseLastReply.value = value === true
  saveOverrides({ [FIELD_LAST_REPLY_COLLAPSE]: collapseLastReply.value })
}

/** 单轮执行超时变更：写本人覆盖层（秒，0=不限制） */
const onTurnTimeoutChange = (value: number | undefined) => {
  if (!Number.isFinite(value)) {
    return
  }
  turnTimeout.value = nearestOption(Math.trunc(Number(value)), TURN_TIMEOUT_OPTIONS, DEFAULT_TURN_TIMEOUT)
  turnTimeoutModel.value = turnTimeout.value
  saveOverrides({ [FIELD_TURN_TIMEOUT]: turnTimeout.value })
}

/** 失败重试次数变更：写本人覆盖层（0=不重试） */
const onRetryMaxChange = (value: number | undefined) => {
  if (!Number.isFinite(value)) {
    return
  }
  retryMax.value = nearestOption(Math.trunc(Number(value)), RETRY_MAX_OPTIONS, DEFAULT_RETRY_MAX)
  retryMaxModel.value = retryMax.value
  saveOverrides({ [FIELD_RETRY_MAX]: retryMax.value })
}

/** 重试间隔变更：写本人覆盖层（秒） */
const onRetryIntervalChange = (value: number | undefined) => {
  if (!Number.isFinite(value)) {
    return
  }
  retryInterval.value = nearestOption(Math.trunc(Number(value)), RETRY_INTERVAL_OPTIONS, DEFAULT_RETRY_INTERVAL)
  retryIntervalModel.value = retryInterval.value
  saveOverrides({ [FIELD_RETRY_INTERVAL]: retryInterval.value })
}

/** 重试指数退避开关变更：写本人覆盖层 */
const onRetryBackoffChange = (value: boolean | string | number) => {
  retryBackoff.value = value === true
  saveOverrides({ [FIELD_RETRY_BACKOFF]: retryBackoff.value })
}

/** 重启后自动继续开关变更：写本人覆盖层 */
const onAutoContinueChange = (value: boolean | string | number) => {
  autoContinue.value = value === true
  saveOverrides({ [FIELD_AUTO_CONTINUE]: autoContinue.value })
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
</style>