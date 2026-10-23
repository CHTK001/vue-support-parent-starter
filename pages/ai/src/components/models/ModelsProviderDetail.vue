<template>
  <div class="h-full overflow-auto detail-scroll">
    <div class="px-5 py-4">
      <!-- 供应商头部 -->
      <section class="d-band">
        <div class="d-band-logo">
          <ProviderLogo :pid="getProviderIcon(provider)" :name="provider?.name" size="lg" />
        </div>
        <div class="d-band-info min-w-0">
          <div class="d-band-name-row">
            <h1 class="d-band-name truncate">{{ provider?.name }}</h1>
          </div>
          <!--
            ONNX 本地推理没有远端地址：后端写死的 ai.onnx.base-url（默认
            http://127.0.0.1:8080/v1）只是「与其它提供商同构」的占位值，对本地推理
            不起作用。把它显示成供应商地址，用户会以为模型是从这个 HTTP 地址来的 ——
            实际模型文件在本机磁盘上，地址与路径毫无关系。
            这里改用后端回传的 model_root（真实绝对路径）；只有管理员能看到
            （后端 listProviders 对非管理员整体不返回 ONNX 行）。
          -->
          <div v-if="isOnnx" class="d-band-url" :title="onnxModelRoot || '尚未选择模型目录'">
            <el-icon :size="13"><Folder24Regular /></el-icon>
            <span class="d-band-url-text">{{ onnxModelRoot || '尚未选择模型目录' }}</span>
          </div>
          <div v-else-if="provider?.apiUrl" class="d-band-url" :title="provider.apiUrl">
            <el-icon :size="13"><LinkOutlined /></el-icon>
            <span class="d-band-url-text">{{ provider.apiUrl }}</span>
          </div>
        </div>
        <div class="d-band-actions">
          <!--
            ONNX 供应商已在启动时被物化进 provider 表（见 OnnxProviderMaterializer），
            因此「编辑供应商」与其它供应商走同一套流程，可正常调用 updateProvider。
            「删除」仍屏蔽：ONNX 供应商由模型注册表驱动，下次启动会被重新物化，
            删除既无意义也会让用户以为模型丢失。
          -->
          <el-button @click="emit('edit-provider')" round>
            <template #icon><EditOutlined /></template>
            编辑供应商
          </el-button>
          <el-button v-if="canDelete" round class="d-del-btn" @click="emit('delete-provider')">
            <template #icon><DeleteOutlined /></template>
            删除
          </el-button>
          <el-button type="primary" round @click="handleAdd">
            <template #icon><PlusOutlined /></template>
            {{ t('settings.providerDetail.addModel') }}
          </el-button>
          <el-button v-if="!isOnnx" round :loading="syncPricingLoading" @click="handleSyncPricing">
            <template #icon><Timer /></template>
            同步价格
          </el-button>
        </div>
      </section>

      <!-- 空状态 -->
      <div v-if="models.length === 0" class="d-empty">
        <el-icon size="42" class="d-empty-icon"><Box16Regular /></el-icon>
        <p class="d-empty-title">{{ t('settings.providerDetail.noModels') }}</p>
        <p class="d-empty-desc">{{ t('settings.providerDetail.noModelsDesc') }}</p>
        <el-button type="primary" round class="mt-5" @click="handleAdd">
          <template #icon><PlusOutlined /></template>
          {{ t('settings.providerDetail.addModel') }}
        </el-button>
      </div>

      <!-- 模型卡片网格 -->
      <template v-else>
        <div class="d-section-head">
          <!-- 第一行：标题 + 计数 + 搜索 + 批量工具栏 -->
          <div class="d-head-row">
            <span class="d-section-title">模型</span>
            <span class="d-section-count">
              {{ filteredModels.length }}/{{ models.length }}
            </span>
            <!-- 搜索框：支持模型名 / 类型 / 子类型 / 能力关键词 -->
            <el-input
              v-model="modelSearch"
              size="small"
              placeholder="搜索名称 / 类型 / 能力…"
              clearable
              class="model-search-input"
            >
              <template #prefix>
                <el-icon :size="13"><SearchOutlined /></el-icon>
              </template>
            </el-input>

            <!-- 批量操作工具栏：始终占位，避免选中后把卡片网格往下顶 -->
            <div class="batch-toolbar" :class="{ 'is-visible': selected.length > 0 }">
              <template v-if="selected.length > 0">
                <span class="batch-count">已选 {{ selected.length }} 个</span>
                <span
                  class="batch-select-all"
                  :class="{ 'is-all': selected.length === filteredModels.length && filteredModels.length > 0 }"
                  @click="toggleSelectAllFiltered"
                >{{ selected.length === filteredModels.length ? '取消全选' : '全选当前筛选' }}</span>
                <el-button size="small" type="success" @click="batchEnable">启用</el-button>
                <el-button size="small" type="warning" @click="batchDisable">停用</el-button>
                <el-button size="small" @click="selected = []">取消</el-button>
              </template>
            </div>
          </div>

          <!-- 第二行：状态 / 类型 / 上下文大小筛选 -->
          <div class="d-head-filters">
            <div class="filter-group">
              <el-radio-group v-model="statusFilter" size="small">
                <el-radio-button value="">全部</el-radio-button>
                <el-radio-button value="active">已启用</el-radio-button>
                <el-radio-button value="inactive">已停用</el-radio-button>
              </el-radio-group>
            </div>
            <div class="filter-group">
              <el-select v-model="typeFilter" placeholder="按类型" clearable size="small" class="type-select">
                <el-option value="chat" label="对话" />
                <el-option value="embedding" label="嵌入" />
                <el-option value="ocr" label="OCR" />
                <el-option value="vision" label="视觉" />
                <el-option value="rerank" label="重排序" />
                <el-option value="tts" label="语音合成" />
                <el-option value="stt" label="语音识别" />
                <el-option value="face" label="人脸" />
                <el-option value="image" label="图像生成" />
              </el-select>
            </div>
            <!-- 上下文大小过滤：常用档位标签，多选 = 并集；「未知」= 无上下文数据 -->
            <div class="ctx-filter">
              <span class="ctx-filter-title">{{ t('common.contextSize.title') }}</span>
              <span v-for="tag in CONTEXT_SIZE_TAGS" :key="tag.key" class="ctx-tag"
                :class="{ 'ctx-tag-active': ctxFilter.includes(tag.key) }"
                @click="toggleCtxTag(tag.key)">
                {{ t(`common.contextSize.${tag.key}`) }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="filteredModels.length === 0" class="ctx-no-match">
          {{ t('common.contextSize.noMatch') }}
        </div>
        <div v-else class="model-grid">
          <article v-for="model in filteredModels" :key="model.id" class="mc"
            :class="{ 'is-selected': selected.includes(getModelId(model)) }">
            <div class="mc-head">
              <Avatar class="w-10 h-10 shrink-0 mr-3" :src="getModelAvatar(model)"
                :name="getModelDisplayName(model.modelName)" type="assistant" :round="false" />
              <div class="mc-head-text min-w-0">
                <span class="mc-name" :title="getModelDisplayName(model.modelName)">
                  {{ getModelDisplayName(model.modelName) }}
                </span>
                <!--
                  模型的全部标签统一走 ModelTagStrip（图标 + tooltip）：
                  类型（OCR 识别 / 人脸识别 / 图像识别 / 语音合成 …）、细分类型
                  （文字识别 / 人脸特征提取 …）、特性（工具调用 / 深度思考 / 在线检索）。

                  为什么连主类型也不再用文字：一张卡片同时有类型 + 细分类型 + 特性时，
                  纯文字徽标会占掉标题行大半宽度；长名称（「人脸特征提取」「文字超分修复」）
                  还会互相挤压、把行撑高。统一成图标后，占用只跟图标个数相关。

                  规则：最多显示 2 个，其余折叠为 +N；悬停图标看名称，
                  悬停 +N 弹 popover 列出全部（图标 + 中文名）。
                -->
                <ModelTagStrip
                  v-if="modelTags(model).length"
                  :tags="modelTags(model)"
                  :max="2"
                />
              </div>
              <!-- 批量选择 checkbox：固定在头部右侧，不单独占行 -->
              <span class="mc-check" title="选择该模型">
                <el-checkbox
                  :model-value="selected.includes(getModelId(model))"
                  @change="toggleSelect(model)"
                />
              </span>
            </div>

            <!-- 能力：输入种类 → 输出种类（所有类型统一展示） -->
            <div class="mc-caps">
              <span class="mc-cap-group">
                <el-icon v-for="(k, i) in model.config?.inputCapabilities || []" :key="'in-'+i"
                  class="cap-i" :class="'kind-'+k" :size="14">
                  <component :is="KIND_ICONS[k]" />
                </el-icon>
                <el-icon class="cap-arrow" :size="11"><ArrowRight24Regular /></el-icon>
                <el-icon v-for="(k, i) in model.config?.outputCapabilities || []" :key="'out-'+i"
                  class="cap-i" :class="'kind-'+k" :size="14">
                  <component :is="KIND_ICONS[k]" />
                </el-icon>
              </span>
            </div>

            <!-- 参数与官方指标：手填值优先，缺失回退指标表（sys_ai_model_metrics） -->
            <div v-if="cardMeta(model).length" class="mc-meta">
              <span v-for="item in cardMeta(model)" :key="item.label" class="mc-meta-item" :title="item.title">
                <span class="mc-meta-label">{{ item.label }}</span>
                <span class="mc-meta-val">{{ item.value }}</span>
              </span>
            </div>

            <!-- 底部：与其它供应商一致（启用开关 + 编辑 + 删除） -->
            <div class="mc-foot">
              <span v-if="model.external" class="mc-src is-ext">外部目录</span>
              <!--
                启用开关必须能真的生效，否则就是「可见可点、点了必失败」的假按钮。
                内置 Agent 供应商的模型行不带后端 id（不在 sys_ai_provider_model 里），
                PUT /v2/models/{providerId}:{model}/toggle-active 恒回 404
                「模型不存在」—— 实测（2026-10-07 逐按钮 sweep + 定点探针）：
                裸 id 回 400 格式非法，补全成 providerId:modelName 后回 404 查无此模型。
                所以没有原生 id 时直接禁用开关并给出原因，而不是让用户点了报错。
                判据用 `=== false`：只有 mapModel 明确判定「无原生 id」才禁用，
                外部来源的模型（无该字段）保持原行为不受影响。
              -->
              <el-switch
                v-model="model.isActive"
                :disabled="model.hasNativeId === false"
                :title="model.hasNativeId === false ? t('settings.providerDetail.modelToggleUnavailable') : ''"
                @change="handleToggle(model)"
              />
              <div class="mc-foot-btns">
                <button
                  v-if="!isLocalProvider"
                  class="mc-btn"
                  :title="model.hasNativeId === false ? '该模型无原生记录，暂无法测试' : '测试延迟'"
                  :disabled="model.testing || model.hasNativeId === false"
                  @click="testLatency(model)"
                >
                  <el-icon :size="16"><Timer /></el-icon>
                </button>
                <button class="mc-btn" :title="t('common.edit')" @click="handleEdit(model)">
                  <el-icon :size="16"><SettingsOutlined /></el-icon>
                </button>
                <button class="mc-btn danger" :title="t('common.delete')" @click="handleDelete(model)">
                  <el-icon :size="16"><RemoveCircleOutlineRound /></el-icon>
                </button>
              </div>
            </div>
          </article>
        </div>
      </template>
    </div>

    <!-- 弹窗 -->
    <ModelFormDialog
      ref="formRef"
      :provider="provider"
      :model-presets="modelPresets"
      @saved="emit('changed')"
      @request-fetch="handleRequestFetch"
    />
    <!--
      「添加模型」默认直接打开手工表单；
      表单上的「获取」按钮再拉取该供应商的全部模型，
      想一次全要就点「全部录入」（后端批量落库），只想挑一个再点行内「选择」，
      供应商没配地址/Key 或想手工建则直接在表单里操作。
    -->
    <ModelFetchDialog
      ref="fetchRef"
      @select="handleFetchSelect"
      @imported="emit('changed')"
      @manual="handleManualAdd"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from '@repo/core'
import Avatar from '../ui/Avatar.vue'
import CardAvatar from '../ui/CardAvatar.vue'
import {
  SettingsOutlined, RemoveCircleOutlineRound, ScienceOutlined,
  PlusOutlined, LinkOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined,
} from '@vicons/material'
import {
  TextT24Regular, Image24Regular, ArrowRight24Regular,
  WrenchScrewdriver24Regular, LightbulbFilament24Regular, Box16Regular,
  Speaker224Regular, Video24Regular, Group24Regular, Scan24Regular,
  Folder24Regular,
} from '@vicons/fluent'
import { Timer } from '@element-plus/icons-vue'
import { apiService } from '../../services/ApiService'
import { modelApi } from '@/services/javaApi'
import { usePopup } from '../../composables/usePopup'
import {
  getModelDisplayName, getModelAvatarPath,
  CONTEXT_SIZE_TAGS, matchesContextTags,
} from '@/utils/modelUtils'
import ProviderLogo from './ProviderLogo.vue'
import ModelFormDialog from './ModelFormDialog.vue'
import ModelFetchDialog from './ModelFetchDialog.vue'
import ModelTagStrip from './ModelTagStrip.vue'
import {
  LOCAL_PROVIDER_IDS, MODEL_SUBTYPE_LABELS, MODEL_SUBTYPE_OPTIONS,
  MODEL_TYPE_ICON, MODEL_TYPE_KIND,
} from './model.constants'

const props = defineProps<{
  provider: any
  models: any[]
  modelPresets: any[]
}>()

const emit = defineEmits<{
  back: []
  changed: []
  'edit-provider': []
  'delete-provider': []
}>()

const { t } = useI18n()
const { confirm } = usePopup()

const formRef = ref<any>(null)
const fetchRef = ref<any>(null)

/* ==================== 上下文大小过滤（与模型选择卡片共用同一套标签） ==================== */

/** 选中的档位 key 集合（多选 = 并集；空 = 不过滤） */
const ctxFilter = ref<string[]>([])

/** 关键字搜索 */
const modelSearch = ref('')

/** 状态筛选：active / inactive / '' */
const statusFilter = ref('')

/** 类型筛选：modelType 值 */
const typeFilter = ref('')

/** 批量选中的模型 id */
const selected = ref<string[]>([])

/**
 * 切换上下文档位标签：已选中则取消，否则加入。
 *
 * @param key CONTEXT_SIZE_TAGS 的 key
 */
const toggleCtxTag = (key: string) => {
  const idx = ctxFilter.value.indexOf(key)
  if (idx >= 0) ctxFilter.value.splice(idx, 1)
  else ctxFilter.value.push(key)
}

/** 搜索能力别名：让「嵌入」「人脸」「视觉」等中文也能命中 */
const SEARCH_ALIASES: Record<string, string[]> = {
  嵌入: ['embedding', 'embed'],
  人脸: ['face', 'face_recognition'],
  视觉: ['vision', 'image'],
  ocr: ['ocr'],
  重排: ['rerank'],
  语音: ['tts', 'stt', 'speech'],
  工具: ['tools'],
  思考: ['thinking'],
}

const matchesSearch = (m: any, kw: string) => {
  const displayName = getModelDisplayName(m.modelName).toLowerCase()
  const typeLabel = typeMeta(m.modelType).label.toLowerCase()
  const subLabel = (subTypeLabel(m.subType) || '').toLowerCase()
  const features = (m.config?.features || []).join(' ').toLowerCase()
  const tasks = (m.config?.inputCapabilities || [])
    .concat(m.config?.outputCapabilities || [])
    .join(' ')
    .toLowerCase()
  return (
    displayName.includes(kw) ||
    typeLabel.includes(kw) ||
    subLabel.includes(kw) ||
    features.includes(kw) ||
    tasks.includes(kw) ||
    SEARCH_ALIASES[kw]?.some((a) => features.includes(a) || tasks.includes(a) || displayName.includes(a))
  )
}

/** 命中档位标签的模型（过滤只影响展示；增删改仍走全量 props.models） */
const filteredModels = computed(() => {
  const kw = modelSearch.value.trim().toLowerCase()
  const matched = props.models.filter((m: any) => {
    if (!matchesContextTags(m, ctxFilter.value)) return false
    if (statusFilter.value === 'active' && !m.isActive) return false
    if (statusFilter.value === 'inactive' && m.isActive) return false
    if (typeFilter.value && m.modelType !== typeFilter.value) return false
    if (kw && !matchesSearch(m, kw)) return false
    return true
  })
  // 已启用优先，同状态按后台 sort_order 升序，避免把排序规则丢掉
  return [...matched].sort((a: any, b: any) => {
    if (!!a.isActive !== !!b.isActive) return a.isActive ? -1 : 1
    const ao = Number(a.sort_order ?? a.sortOrder ?? 0)
    const bo = Number(b.sort_order ?? b.sortOrder ?? 0)
    return ao - bo || String(a.modelName || '').localeCompare(String(b.modelName || ''))
  })
})

/**
 * 是否为 ONNX 本地推理供应商。
 *
 * <p>ONNX 供应商已物化进 provider 表，可编辑；仅「删除」对它屏蔽——
 * 它由模型注册表驱动，下次启动会被重新物化。</p>
 */
const isOnnx = computed(
  () => props.provider?.id === 'onnx' || props.provider?.provider_id === 'onnx',
)

/**
 * 是否为本地推理供应商。
 *
 * <p>本地模型不走远端 HTTP 延迟测试，行内不展示「测试延迟」按钮，
 * 避免点击后由不存在的远端服务报错。</p>
 */
const isLocalProvider = computed(() => {
  const id = String(props.provider?.id ?? props.provider?.provider_id ?? '').toLowerCase()
  return LOCAL_PROVIDER_IDS.has(id)
})

/**
 * ONNX 的真实模型根目录（绝对路径）。
 *
 * <p>取自后端 /providers 回传的 {@code model_root}（见 ApiProviderController.toProviderResponse），
 * 不是供应商行的 base_url —— 后者对 ONNX 是写死的 http 占位值，与模型实际位置无关。</p>
 */
const onnxModelRoot = computed(() => String(props.provider?.model_root || '').trim())

/**
 * 「删除供应商」按钮是否可删。
 *
 * 必须与 ModelsPage.handleDeleteProvider 的早退守卫
 * `if (!p || p.id === 'agent' || p.id === 'onnx') return` **完全一致**，
 * 否则按钮可见可点、点了却静默什么都不做（真死按钮）。
 *
 * 实测（2026-10-07 逐按钮 sweep，dist 生产形态）：/models 选中内置
 * `Agent` 供应商后，头部「删除」按钮 visible=true、disabled=false，
 * 点击后 muts=0、无弹窗、无 toast、无接口请求 —— 纯静默无操作。
 * 侧栏的删除图标（ModelsPage `v-if="p.id !== 'agent' && p.id !== 'onnx'"`）
 * 早就做了双供应商判断，只有这里漏了 `agent`，现已补齐。
 */
const canDelete = computed(() => {
  const id = props.provider?.id ?? props.provider?.provider_id
  return !isOnnx.value && id !== 'agent'
})

const getLableName = (type: string) => {
  switch (type) {
    case 'visual': return t('settings.providerDetail.visual')
    case 'tools': return t('settings.providerDetail.toolCalling')
    case 'thinking': return t('settings.providerDetail.mixedThinking')
    case 'web-search': {
      const v = t('settings.providerDetail.webSearch')
      return v === 'settings.providerDetail.webSearch' ? '在线检索' : v
    }
    default: return type
  }
}

const getProviderIcon = (item: any) => item?.provider || item?.platform || item?.id

const getModelAvatar = (model: any) => {
  if (!model || !model.modelName) return undefined
  const path = getModelAvatarPath(model.modelName, props.provider?.name || undefined)
  return path || undefined
}

const fmtNum = (v: number) =>
  v >= 1000 ? (v >= 1000000 ? (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'M' : Math.round(v / 1000) + 'K') : String(v)

/** 最近使用时间展示：支持秒/毫秒时间戳和 ISO 字符串；解析失败返回空 */
const formatRecentUse = (v: any): string => {
  let d: Date | null = null
  if (typeof v === 'number') {
    const ms = v > 1e12 ? v : v * 1000
    d = new Date(ms)
  } else if (typeof v === 'string' && v.trim()) {
    const parsed = Date.parse(v.trim())
    if (!Number.isNaN(parsed)) d = new Date(parsed)
  }
  if (!d || Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 宽松数值解析：空值 / 非数字一律返回 null（区分「未填」与 0） */
const numOrNull = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

/** 人类可读的小数值：42.30 → 42.3 */
const humanDecimal = (v: number, digits = 1) => String(Number(v.toFixed(digits)))

/** 人类可读的价格（指标表为 USD / 百万 token）：0.15 → $0.15，15 → $15 */
const humanPrice = (v: number) => {
  const s = v < 1 ? v.toFixed(3) : v.toFixed(2)
  return '$' + s.replace(/0+$/, '').replace(/\.$/, '')
}

/**
 * 模型卡片上的参数 / 官方指标条目。
 *
 * <p>「输入最大 token」手填优先（sys_ai_provider_model.context_window），
 * 未填则回退指标表的上下文窗口；「输出最大 token」指标表没有对应字段，只认手填。
 * 官方估价与速度 / 智能指数来自指标表（sys_ai_model_metrics），
 * 由后端 toProviderModelResponse 合并进 model.metrics。</p>
 */
const cardMeta = (model: any) => {
  const cfg = model?.config || {}
  const mt = model?.metrics || {}
  const items: Array<{ label: string; value: string; title: string }> = []

  // 最近使用时间：后端若有 last_used_at / lastUsedAt 就展示；没有时不占位。
  const recentUse = model?.last_used_at ?? model?.lastUsedAt ?? model?.recent_use_at ?? model?.used_at
  if (recentUse) {
    const t = formatRecentUse(recentUse)
    if (t) {
      items.push({ label: '最近使用', value: t, title: `最近使用时间：${t}` })
    }
  }

  const manualCtx = numOrNull(cfg.contextWindow)
  const ctx = manualCtx ?? numOrNull(mt.context_window_tokens)
  if (ctx) {
    items.push({
      label: '输入',
      value: fmtNum(ctx),
      title: `输入最大 token：${ctx.toLocaleString()}${manualCtx != null ? '（手动填写）' : '（指标表上下文窗口）'}`,
    })
  }

  const out = numOrNull(cfg.maxOutputTokens)
  if (out) {
    items.push({ label: '输出', value: fmtNum(out), title: `输出最大 token：${out.toLocaleString()}（手动填写）` })
  }

  const latency = numOrNull(model.modelLastLatency ?? mt.probe_latency_ms ?? mt.latency_ms)
  if (latency != null) {
    items.push({
      label: '延迟',
      value: `${Math.round(latency)}ms`,
      title: model.modelLastLatency != null
        ? `最近一次延迟测试：${Math.round(latency)}ms`
        : `实测延迟：${Math.round(latency)}ms`,
    })
  }

  const pIn = numOrNull(mt.price_input_per_musd)
  const pOut = numOrNull(mt.price_output_per_musd)
  if (pIn != null || pOut != null) {
    const f = (v: number | null) => (v == null ? '—' : humanPrice(v))
    items.push({
      label: '价格',
      value: `${f(pIn)}/${f(pOut)}`,
      title: `官方估价（USD / 百万 token）：输入 ${f(pIn)}，输出 ${f(pOut)}`,
    })
  }

  const speed = numOrNull(mt.output_speed_tps)
  if (speed != null) {
    items.push({ label: '速度', value: `${humanDecimal(speed)} t/s`, title: '输出速度（token/秒）' })
  }

  const idx = numOrNull(mt.intelligence_index)
  if (idx != null) {
    items.push({ label: '智能', value: humanDecimal(idx), title: '智能指数（Artificial Analysis）' })
  }

  const hle = numOrNull(mt.hle_score)
  if (hle != null) {
    items.push({
      label: 'HLE',
      value: `${(hle * 100).toFixed(1)}%`,
      title: "Humanity's Last Exam 得分（Artificial Analysis）",
    })
  }

  const omni = numOrNull(mt.omniscience_index)
  if (omni != null) {
    items.push({ label: '全知', value: humanDecimal(omni), title: '全知指数（知识准确-幻觉，Artificial Analysis）' })
  }

  return items
}

// 模型类型 → 卡片标签（文字 + 配色），与系统配置「默认模型」类型体系一致
const TYPE_META: Record<string, { label: string; cls: string }> = {
  text: { label: '对话', cls: 'chat' },
  embedding: { label: '嵌入', cls: 'emb' },
  rerank: { label: '重排序', cls: 'info' },
  image: { label: '文生图', cls: 'img' },
  video: { label: '文生视频', cls: 'vid' },
  image_cv: { label: '图片识别', cls: 'info' },
  ocr: { label: 'OCR识别', cls: 'info' },
  face: { label: '人脸识别', cls: 'info' },
  layout: { label: '布局识别', cls: 'info' },
  detection: { label: '检测', cls: 'info' },
  asr: { label: '语音识别', cls: 'info' },
  tts: { label: '语音合成', cls: 'info' },
}
const typeMeta = (type: string) => TYPE_META[type] || TYPE_META.text
const subTypeLabel = (subType: any) => MODEL_SUBTYPE_LABELS[String(subType || '')] || String(subType || '')

/**
 * 规范类型 → 图标 / 配色：直接用 model.constants 里的共享映射。
 *
 * <p>不在本文件再派生一份：类型下拉（MODEL_TYPE_OPTIONS）、本卡片的标签、
 * 以及「拉取模型」弹框的标签都用同一份图标表，加类型时不会三处走散。</p>
 */
const TYPE_ICONS = MODEL_TYPE_ICON
const TYPE_KIND = MODEL_TYPE_KIND

/** 特性 key → 图标（未登记的回退到通用科学图标） */
const FEATURE_ICONS: Record<string, any> = {
  tools: WrenchScrewdriver24Regular,
  thinking: LightbulbFilament24Regular,
  visual: ScienceOutlined,
  'web-search': ScienceOutlined,
}

/**
 * 模型卡片的全部标签：**类型 + 细分类型 + 特性**。
 *
 * <p>三者统一交给 {@link ModelTagStrip} 渲染为「图标 + tooltip、最多 2 个、
 * 超出 +N、悬停 popover 看全」。</p>
 *
 * <p><b>为什么主类型也用图标而不是文字</b>：卡片标题行同时承载模型名与这些标签，
 * 纯文字下一个「人脸特征提取」就能吃掉半行；类型 + 细分类型 + 特性三项并列时
 * （实测 `agnes-2.0-flash` 就有 3 项）还会换行撑高卡片。改成图标后，占用只与
 * 图标个数相关，具体名称在悬停时给出。</p>
 *
 * <p>细分类型继承其父类型的图标与配色：`ocr_recognition` 属于 `ocr`，
 * 因此与类型同色同图标，用户一眼能看出「这是 OCR 这条线下的角色」。
 * 归属关系从 {@link MODEL_SUBTYPE_OPTIONS} 反查，不硬编码。</p>
 *
 * @param model 已由 mapModel 加工过的模型行
 * @returns 标签项列表（可能为空）
 */
const modelTags = (model: any) => {
  const tags: Array<{ key: string; label: string; icon: any; kind: string }> = []
  const parentType = String(model?.modelType || '')

  // ① 类型（OCR 识别 / 人脸识别 / 图像识别 / 语音合成 …）——放第一位，它是模型身份
  const typeLabel = typeMeta(parentType).label
  if (typeLabel) {
    tags.push({
      key: `type:${parentType || 'text'}`,
      label: typeLabel,
      icon: TYPE_ICONS[parentType] || TextT24Regular,
      kind: TYPE_KIND[parentType] || 'chat',
    })
  }

  // ② 细分类型：从 MODEL_SUBTYPE_OPTIONS 反查它属于哪个父类型，以继承图标/配色
  const sub = model?.subType
  if (sub) {
    const parent = Object.entries(MODEL_SUBTYPE_OPTIONS)
      .find(([, opts]) => opts.some((o) => o.value === String(sub)))?.[0] || parentType
    tags.push({
      key: `sub:${sub}`,
      label: subTypeLabel(sub),
      icon: TYPE_ICONS[parent] || Scan24Regular,
      kind: TYPE_KIND[parent] || 'info',
    })
  }

  // ③ 特性：tools / thinking / visual / web-search
  for (const f of model?.config?.features || []) {
    tags.push({
      key: `feat:${f}`,
      label: getLableName(f),
      icon: FEATURE_ICONS[f] || ScienceOutlined,
      kind: 'tool',
    })
  }

  return tags
}

// 能力种类 → 图标（输入/输出流可视化）
const KIND_ICONS: Record<string, any> = {
  text: TextT24Regular,
  image: Image24Regular,
  audio: Speaker224Regular,
  video: Video24Regular,
  vector: Group24Regular,
}

const handleAdd = () => {
  // 默认直接打开手工表单；表单里的「获取」按钮再拉取上游模型列表
  formRef.value.openAdd()
}
const handleManualAdd = () => {
  // 来自 fetchDialog 的「手动添加」：fetchDialog 已自行关闭，
  // 表单-dialog 此时已打开（从 handleAdd / handleRequestFetch 而来），
  // 用 show() 而不是 openAdd()，避免重置用户已填的内容
  formRef.value?.show?.()
}
const handleEdit = (model: any) => formRef.value.openEdit(model)

const testLatency = async (model: any) => {
  const providerId = model?.providerId ?? props.provider?.id ?? props.provider?.provider_id
  const modelName = model?.model ?? model?.modelName ?? model?.name
  if (!providerId || !modelName || model.testing || model.hasNativeId === false) return
  model.testing = true
  try {
    const res: any = await modelApi.testProviderModelLatency(providerId, modelName)
    const body = res?.data ?? res
    if (body?.success === false) throw new Error(body?.message || '延迟测试失败')
    const raw = body?.latency ?? res?.latency ?? res?.data?.latency
    const latency = raw != null && Number.isFinite(Number(raw)) ? Number(raw) : null
    if (latency != null) {
      model.modelLastLatency = latency
      model.metrics = {
        ...(model.metrics || {}),
        probe_latency_ms: latency,
        latency_ms: latency,
      }
    }
    message.success(latency != null ? `测试延迟：${latency}ms` : '延迟测试完成', { duration: 2500 })
  } catch (error: any) {
    const detail = error?.response?.data?.message
      || error?.response?.data?.msg
      || error?.message
      || '延迟测试失败'
    message.error(String(detail), { duration: 2500 })
  } finally {
    model.testing = false
  }
}

const handleDelete = async (model: any) => {
  const ok = await confirm(
    t('settings.providerDetail.deleteModel'),
    t('settings.providerDetail.deleteModelConfirm'),
  )
  if (!ok) return
  await apiService.deleteModel(model.id)
  message.success(t('settings.providerDetail.modelDeleted'))
  emit('changed')
}

/** 同步价格：从服务商指标端点拉取价格/能力数据写入指标库 */
const syncPricingLoading = ref(false)
const handleSyncPricing = async () => {
  const providerId = props.provider?.id ?? props.provider?.provider_id
  if (!providerId) return
  syncPricingLoading.value = true
  try {
    const res: any = await modelApi.syncPricing(providerId)
    const body = res?.data ?? res
    if (body?.success === false) throw new Error(body?.message || '同步失败')
    const updated: number = body?.updated ?? 0
    const inserted: number = body?.inserted ?? 0
    const providerModels: number = body?.provider_models ?? 0
    const source: string = body?.source ?? ''
    if (body?.supported === false) {
      const pricingUrl: string = body?.pricing_url ?? ''
      message.warning(
        `该服务商暂未接入自动同步指标${pricingUrl ? `（官方价格页：${pricingUrl}）` : ''}`,
        { duration: 4000 },
      )
    } else {
      const parts: string[] = []
      if (updated > 0) parts.push(`更新 ${updated} 条`)
      if (inserted > 0) parts.push(`新增 ${inserted} 条`)
      if (providerModels > 0) parts.push(`回写模型 ${providerModels} 行`)
      if (parts.length === 0) {
        message.success(`指标已是最新${source ? `（来源：${source}）` : ''}`, { duration: 3000 })
      } else {
        message.success(`价格同步完成：${parts.join('，')}${source ? `（来源：${source}）` : ''}`, { duration: 4000 })
      }
    }
    emit('changed')
  } catch (error: any) {
    const detail = error?.response?.data?.message
      || error?.response?.data?.msg
      || error?.message
      || '同步价格失败'
    message.error(String(detail), { duration: 3000 })
  } finally {
    syncPricingLoading.value = false
  }
}

const handleToggle = async (model: any) => {
  try {
    const result = await apiService.toggleModelActive(model.id)
    model.isActive = result.isActive
    message.success(
      result.isActive ? t('settings.providerDetail.modelEnabled') : t('settings.providerDetail.modelDisabled'),
      { duration: 2000 },
    )
    emit('changed')
  } catch (error) {
    const apiError = error as { response?: { data?: { message?: string; msg?: string } }; message?: string };
    const detail = apiError?.response?.data?.message
      || apiError?.response?.data?.msg
      || apiError?.message
      || t('settings.providerDetail.toggleModelError')
    message.error(String(detail), { duration: 2000 })
    model.isActive = !model.isActive
  }
}

// ==================== 批量操作 ====================

/** 模型唯一标识：优先后端 id，回退模型名 */
const getModelId = (m: any) => m.id || m.modelName

const toggleSelect = (m: any) => {
  const id = getModelId(m)
  const idx = selected.value.indexOf(id)
  if (idx >= 0) selected.value.splice(idx, 1)
  else selected.value.push(id)
}

/** 全选 / 取消全选当前筛选结果（保留其它筛选下已选中的模型） */
const toggleSelectAllFiltered = () => {
  const ids = filteredModels.value.map(getModelId)
  const allSelected = ids.length > 0 && ids.every((id) => selected.value.includes(id))
  if (allSelected) {
    selected.value = selected.value.filter((id) => !ids.includes(id))
  } else {
    selected.value = Array.from(new Set([...selected.value, ...ids]))
  }
}

const findModel = (id: string) => props.models.find((m: any) => getModelId(m) === id)

/** 批量启用：只处理当前停用的模型，避免把已启用模型也切一遍 */
const batchEnable = async () => {
  const targets = selected.value.map(findModel).filter((m: any) => m && m.isActive === false)
  selected.value = []
  if (!targets.length) {
    message.info('所选模型均已启用')
    return
  }
  await Promise.allSettled(
    targets.map((m: any) => {
      m.isActive = true
      return handleToggle(m)
    }),
  )
}

/** 批量停用：只处理当前启用的模型，避免把已停用模型也切一遍 */
const batchDisable = async () => {
  const targets = selected.value.map(findModel).filter((m: any) => m && m.isActive === true)
  selected.value = []
  if (!targets.length) {
    message.info('所选模型均已停用')
    return
  }
  await Promise.allSettled(
    targets.map((m: any) => {
      m.isActive = false
      return handleToggle(m)
    }),
  )
}

const handleRequestFetch = () =>
  // false：这条是从模型表单里点「获取」来的，失败时不要回退 openAdd()，
  // 否则会把表单里已经填好的模型名/参数清空
  fetchRef.value.open(props.provider, props.models, false)
const handleFetchSelect = (model: any) => formRef.value.prefillFromFetch(model)
</script>

<style scoped>
/* 详情滚动区：垂直滚动即可；内容（超长模型名 / 极窄窗口下的卡片网格）一律不产生横向滚动条。
   背景：模型管理里超长文字（如 NewAPI 模板描述）曾把整页顶出水平滚动条（用户需求 1）。 */
.detail-scroll { scrollbar-gutter: stable both-edges; overflow-x: hidden; }

/* 供应商头部（扁平：实色表面，无渐变） */
.d-band {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-radius: calc(var(--size-surface-radius) + 4px);
  background: var(--color-surface);
  border: 1px solid var(--color-surface-border);
}
.d-band-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: calc(var(--size-surface-radius) + 2px);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
}
.d-band-info { flex: 1; min-width: 0; }
.d-band-name-row { display: flex; align-items: center; gap: 10px; min-width: 0; }
.d-band-name { margin: 0; font-size: 18px; font-weight: 700; color: var(--color-text); }
.d-band-url { display: flex; align-items: center; gap: 5px; margin-top: 4px; color: var(--color-text-disabled); }
.d-band-url-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.d-band-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.d-del-btn {
  --el-button-text-color: var(--el-color-danger);
  --el-button-border-color: color-mix(in srgb, var(--el-color-danger) 35%, var(--color-surface-border));
  --el-button-hover-text-color: var(--el-color-danger);
  --el-button-hover-bg-color: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  --el-button-hover-border-color: var(--el-color-danger);
  --el-button-active-bg-color: color-mix(in srgb, var(--el-color-danger) 14%, transparent);
}

/* 空 */
.d-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 16px;
  padding: 52px 20px;
  border-radius: calc(var(--size-surface-radius) + 4px);
  background: var(--color-surface);
  border: 1px solid var(--color-surface-border);
}
.d-empty-icon { color: var(--color-text-disabled); }
.d-empty-title { margin: 16px 0 0; font-size: 15px; font-weight: 600; color: var(--color-text-gray); }
.d-empty-desc { margin: 6px 0 0; font-size: 13px; color: var(--color-text-disabled); }

/* 区块标题 */
.d-section-head { display: flex; flex-direction: column; gap: 8px; margin: 22px 2px 12px; }
.d-head-row {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.d-head-filters {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.d-section-title { font-size: 13px; font-weight: 700; color: var(--color-text); }
.d-section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 19px; height: 18px; padding: 0 6px;
  /* 原值 9px，18px 高的计数胶囊；用 full 令牌表达同一种形状 */
  border-radius: var(--el-radius-full, 9999px);
  font-size: 11px; font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-border-color-lighter);
}

/* 模型搜索框 */
.model-search-input { width: 210px; }

/* 状态/类型筛选 */
.filter-group { display: flex; align-items: center; }
.type-select { width: 110px; }

/* 批量操作工具栏：默认占位固定高度，选中时淡入，避免卡片网格上下跳动 */
.batch-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  min-height: 34px;
  padding: 4px 8px;
  border-radius: var(--el-radius-base);
  background: transparent;
  border: 1px dashed transparent;
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.18s ease, visibility 0.18s, background 0.18s ease, border-color 0.18s ease;
}
.batch-toolbar.is-visible {
  visibility: visible;
  opacity: 1;
  background: var(--el-fill-color-light);
  border-color: var(--el-border-color-lighter);
}
.batch-count { font-size: 12px; color: var(--el-text-color-secondary); }
.batch-select-all {
  font-size: 12px;
  color: var(--el-color-primary);
  cursor: pointer;
  user-select: none;
}
.batch-select-all:hover { opacity: 0.8; }
.batch-select-all.is-all { color: var(--el-text-color-regular); }

/* 上下文大小过滤（与模型选择卡片共用同一套标签） */
.ctx-filter {
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.ctx-filter-title { font-size: 12px; color: var(--color-text-gray); }
.ctx-tag {
  padding: 2px 8px;
  /* 原值 99px → 胶囊最小档 */
  border-radius: var(--el-radius-full, 9999px);
  font-size: 11px;
  line-height: 16px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s, color 0.15s;
}
.ctx-tag:hover { background: var(--el-fill-color-dark); }
.ctx-tag-active { color: #fff; background: var(--color-primary); }
.ctx-no-match {
  padding: 34px 0 20px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-disabled);
}

/* 模型卡片 */
.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(258px, 1fr));
  /* 每行等高，信息少的卡片底栏也贴底，不会出现按钮悬在半空 */
  grid-auto-rows: 1fr;
  gap: 13px;
}
.mc {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 16px;
  border-radius: calc(var(--size-surface-radius) + 4px);
  background: var(--color-surface);
  border: 1px solid var(--color-surface-border);
  transition: border-color 0.18s ease, background 0.18s ease;
}
.mc:hover {
  border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-surface-border));
  background: color-mix(in srgb, var(--color-primary) 3%, var(--color-surface));
}
/* 批量选中态 */
.mc.is-selected {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 4%, var(--color-surface));
}
/* 批量选择 checkbox：放在头部右侧，小圆底背景让元素看起来像可控件而非占位 */
.mc-check {
  margin-left: auto;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-top: -2px;
  border-radius: var(--el-radius-full, 9999px);
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
  cursor: pointer;
  /* 只用内阴影表达选中，不用外扩散阴影，避免点击时卡片视觉位置跳动 */
  transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}
.mc:hover .mc-check { background: var(--el-fill-color-dark); }
.mc.is-selected .mc-check {
  color: #fff;
  background: var(--color-primary);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 55%, #fff);
}
.mc.is-selected .mc-check:hover {
  background: color-mix(in srgb, var(--color-primary) 88%, var(--color-surface));
}
.mc-check :deep(.el-checkbox) {
  height: auto;
  margin-right: 0;
  line-height: 0;
}
.mc-check :deep(.el-checkbox__inner) {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  /* 去掉 Element Plus 自带动画：选中/取消时不缩放、不旋转、不移动 */
  transition: none;
  animation: none;
}
.mc-check :deep(.el-checkbox__inner::after) { transition: none; }
.mc-check :deep(.el-checkbox.is-checked .el-checkbox__inner) {
  background-color: transparent;
  border-color: #fff;
}
.mc-check :deep(.el-checkbox.is-checked .el-checkbox__inner::after) {
  border-color: #fff;
  transform: rotate(45deg) scale(1);
}
.mc-head { display: flex; align-items: flex-start; margin-bottom: 12px; }
.mc-head-text { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; flex: 1; }
.mc-name {
  font-size: 14px; font-weight: 700; color: var(--color-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
/* .mc-type / .mc-type.sub 已随标签改造移除：类型、细分类型、特性
   统一由 ModelTagStrip 以「图标 + tooltip」渲染，不再占用文字宽度。 */

.mc-caps { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: 24px; }
.mc-cap-group { display: inline-flex; align-items: center; gap: 2px; color: var(--color-primary); }
.mc-cap-group.dim { color: var(--color-text-disabled); font-size: 12px; }
.cap-i { color: var(--color-primary); }
.cap-i.kind-text { color: var(--color-primary); }
.cap-i.kind-image { color: var(--el-color-warning); }
.cap-i.kind-audio { color: var(--el-color-info); }
.cap-i.kind-video { color: var(--el-color-danger); }
.cap-i.kind-vector { color: var(--el-color-success); }
.cap-arrow { color: var(--color-text-disabled); }
/* .mc-feature 已随「其它标签」改造移除：特性改由 ModelTagStrip 以图标 + tooltip 渲染 */

.mc-meta {
  display: flex;
  /* 条目数量不定（输入/输出/价格/速度/智能），允许换行避免撑破卡片 */
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 11px;
  padding-top: 11px;
  border-top: 1px solid var(--color-surface-border);
}
.mc-meta-item { display: inline-flex; align-items: baseline; gap: 5px; }
.mc-meta-label { font-size: 11px; color: var(--color-text-gray); }
.mc-meta-val { font-size: 12px; font-weight: 700; color: var(--color-text); }

.mc-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 信息少/多导致卡片内容高度不齐时，底部工具栏始终贴齐卡片底边 */
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--color-surface-border);
}
.mc-src {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 999px;
}
.mc-src.is-in { color: var(--el-text-color-secondary); background: var(--el-fill-color); }
.mc-src.is-ext { color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.mc-foot-btns { display: flex; gap: 2px; }
.mc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px; height: 30px;
  border: none;
  border-radius: calc(var(--size-surface-radius) - 2px);
  color: var(--color-text-gray);
  background: transparent;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}
.mc-btn:hover { color: var(--color-primary); background: var(--color-surface-border); }
.mc-btn:disabled { cursor: not-allowed; opacity: .45; }
.mc-btn:disabled:hover { color: var(--color-text-gray); background: transparent; }
.mc-btn.danger:hover { color: var(--el-color-danger); background: color-mix(in srgb, var(--el-color-danger) 12%, transparent); }

/* 动效降级：系统开启「减少动态效果」时，模型卡的描边/底色与卡片按钮的颜色直接到位。
   逐个列出，不写 `*` / .mc * 通配，
   避免把卡内 el-tag / el-switch / el-dialog 内部 Element Plus 组件的合法过渡一起掐掉。
   这两个都只带 transition（无 animation），hover 态本身是静态样式，照常成立。 */
@media (prefers-reduced-motion: reduce) {
  .mc,
  .mc-btn {
    transition: none;
  }
}
</style>
