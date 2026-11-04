<template>
  <ReDialog
    v-model="visible"
    :title="t('settings.providerDetail.fetchModelsTitle')"
    width="600px"
    align-center
    class="model-fetch-dialog"
    append-to-body
  >
    <div class="dialog-content">
      <div class="fetch-search">
        <el-input
          v-model="searchName"
          class="fetch-input"
          :placeholder="t('settings.providerDetail.searchModelName')"
          clearable
        >
          <template #prefix>
            <el-icon><SearchOutlined /></el-icon>
          </template>
        </el-input>
        <!--
          一键批量录入：整批走后端 POST /providers/{id}/models/import-all，
          后端负责调上游取目录 + 落库（已存在的跳过），用户不必逐条点「选择」。
        -->
        <el-button
          type="primary"
          :loading="importing"
          :disabled="fetched.length === 0 || fetching"
          @click="handleImportAll"
        >
          <template #icon><Download /></template>
          {{ importing
            ? t('settings.providerDetail.importing')
            : t('settings.providerDetail.importAll', { n: fetched.length }) }}
        </el-button>
      </div>

      <div v-if="fetching" class="fetch-loading">
        <el-icon class="is-loading" style="font-size: 32px; color: var(--color-primary);">
          <Loading />
        </el-icon>
      </div>
      <div v-else class="pb-4">
        <div v-if="filtered.length > 0">
          <ul class="fetch-list">
            <li v-for="model in filtered" :key="model.modelName" class="fetch-row">
              <div class="fetch-main">
                <div class="fetch-id">
                  <span class="fetch-name">{{ model.modelName }}</span>
                  <!--
                    免费渠道行：后端每行补了 provider / baseUrl / authScheme，
                    用 resolveProviderBrand 把 route provider 转成品牌 id，
                    再由 ProviderLogo 出图标，让用户一眼看到这一行实际走哪个上游通道。
                  -->
                  <ProviderLogo
                    v-if="channelBrand(model)"
                    :pid="channelBrand(model)"
                    :name="model.provider"
                    size="sm"
                    class="fetch-brand"
                  />
                  <!--
                    行内标签统一走 ModelTagStrip（图标 + tooltip）：
                    类型 / 细分类型 / 来源（本地·云 API）/ 管线角色（检测·识别·矫正）/ 特性。

                    为什么改：本弹框只有 600px 宽而模型名常很长，此前四个纯文字徽标
                    （类型、来源、三态提示，外加特性文字）会把一行挤满甚至换行；
                    「OCR识别 · 文字识别」这种复合徽标单独就占 100px 以上。
                    图标化后每项只占 22px，最多显示 2 个、其余折叠成 +N，悬停看全。

                    注意：类型徽标曾只认「非 text 即嵌入」，导致云端拉回的对话模型
                    全被标成「嵌入」；推断逻辑保留在 fetchTypeBadge 里不动，这里只是换渲染。
                  -->
                  <ModelTagStrip :tags="rowTags(model)" :max="2" />
                </div>
                <!-- 行内小字描述：后端 description 优先（ONNX 本地行自带真实描述），
                     云端上游目录不带描述时按 task 推类型说明，都没有则不渲染 -->
                <div v-if="describeFetchRow(model)" class="fetch-desc">
                  {{ describeFetchRow(model) }}
                </div>
              </div>
              <el-button link type="primary" @click="handleSelect(model)">
                {{ t('settings.providerDetail.select') }}
              </el-button>
            </li>
          </ul>
        </div>
        <div v-else-if="loadError" class="fetch-error">
          <el-icon class="fetch-error-icon" :size="20"><CircleCloseFilled /></el-icon>
          <div class="fetch-error-text">
            <div class="fetch-error-title">获取失败</div>
            <div class="fetch-error-desc">{{ loadError }}</div>
          </div>
        </div>
        <!-- 免费渠道未配置路由表时，后端只回传 hint（不是错误）：给用户提示，
             配上路由再拉，不要落到「无匹配」的空状态里 -->
        <div v-else-if="routeHint" class="fetch-hint">
          <el-icon class="fetch-hint-icon" :size="16"><Wand24Regular /></el-icon>
          <div class="fetch-hint-text">{{ routeHint }}</div>
        </div>
        <div v-else class="fetch-empty">
          {{ t('settings.providerDetail.noMatchFound') }}
        </div>
      </div>

      <!-- 逐条挑完就走；只想手工建一个（或供应商还没配好地址/Key）时走这里 -->
      <div class="fetch-foot">
        <el-button link type="primary" @click="handleManual">
          {{ t('settings.providerDetail.manualAdd') }}
        </el-button>
      </div>
    </div>
  </ReDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Model } from '@/types/api'
import ReDialog from '@repo/ui/re-dialog'
import { describeFetchRow, sourceBadgeFor, taskHintForName, resolveProviderBrand } from './model.utils'
import {
  MODEL_SUBTYPE_LABELS, MODEL_TYPE_ICON, MODEL_TYPE_KIND, TASK_TO_TYPE,
} from './model.constants'
import { isChannelProvider } from './model.constants'
import { channelApi } from '@/services/javaApi'
import { SearchOutlined, ScienceOutlined } from '@vicons/material'
import {
  WrenchScrewdriver24Regular, LightbulbFilament24Regular,
  Desktop24Regular, Cloud24Regular, Scan24Regular, DocumentText24Regular, Wand24Regular,
} from '@vicons/fluent'
import { Loading, CircleCloseFilled, Download } from '@element-plus/icons-vue'
import { apiService } from '../../services/ApiService'
import { message } from '@repo/core'
import ModelTagStrip from './ModelTagStrip.vue'
import ProviderLogo from './ProviderLogo.vue'

const emit = defineEmits<{
  /** 逐条挑一个模型 → 预填表单 */
  select: [model: any]
  /** 已经批量录入完成，父组件据此刷新供应商的模型列表 */
  imported: []
  /** 打开手动新建模型表单（列表看不看得到都行，这里是逃生口） */
  manual: []
}>()

const { t } = useI18n()

const visible = ref(false)
const fetching = ref(false)
const importing = ref(false)
const searchName = ref('')
const fetched = ref<any[]>([])
const loadError = ref('')
/** 免费渠道提示：extra.routes 未配置时后端只回传 hint，前端展示它而不是空状态 */
const routeHint = ref('')
/** 当前供应商标识：批量录入要按它落库，open 时记下，避免再以 props 里猜 */
const providerId = ref('')
/** 本次 open 的是否渠道 provider（决定 handleImportAll 走逐条 createModel 还是后端 import-all） */
const openIsChannel = ref(false)
let existingModels: any[] = []
/**
 * 已知在库里的模型名（打开时来自既有模型，每次录入成功后并入返回的新行）。
 * 用来判断「上游这次没返回的，是不是本来就录过了」——否则上游短返回时会误报
 * 「部分录入」，让用户对着已经录全的列表反复点。
 */
const knownPresent = new Set<string>()
/** 拉取列表行的模型名（上游条目字段名不统一，modelName/name/id 三处都可能有） */
const fetchRowName = (m: any) => String(m?.modelName ?? m?.name ?? m?.id ?? '')

const filtered = computed(() => {
  if (!searchName.value) return fetched.value
  const term = searchName.value.toLowerCase()
  return fetched.value.filter((m) => m.modelName.toLowerCase().includes(term))
})

const getLableName = (type: string) => {
  switch (type) {
    case 'visual':
      return t('settings.providerDetail.visual')
    case 'tools':
      return t('settings.providerDetail.toolCalling')
    case 'thinking':
      return t('settings.providerDetail.mixedThinking')
    default:
      return type
  }
}

/**
 * 上游任务（task） → 规范模型类型，与 model.constants 的 TASK_TO_TYPE 对齐。
 *
 * <p>免费渠道行来自 extra.routes，后端只回传 tasks（如 ["chat"]），
 * 没有 modelType / model_type，所以类型推断降全靠它。</p>
 *
 * @param tasks 上游 tasks（数组、单个字符串或 JSON 字符串）
 * @returns 规范类型（text / embedding / rerank / asr / tts / image / video）
 */
const inferTypeFromTask = (tasks: any): string => {
  for (const t of toArray(tasks)) {
    const key = String(t || '').toLowerCase()
    if (TASK_TO_TYPE[key]) return TASK_TO_TYPE[key]
  }
  return 'text'
}

/** 把 task 拍平成字符串数组：非数组时自动拆分（分号/逗号/空格）或尝试 JSON 解析 */
const toArray = (v: any): string[] => {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string' && !!String(x).trim())
  if (!v) return []
  const s = String(v).trim()
  if (!s) return []
  if (s.startsWith('[')) {
    try {
      return toArray(JSON.parse(s))
    } catch {
      return []
    }
  }
  return [s]
}

/**
 * 打开拉取列表。
 *
 * @param provider 供应商对象（含 id/apiUrl/apiKey）
 * @param models 该供应商已有的模型（用于「已有」标记）
 * @param fallbackToManual 拉不动时是否回退手工表单。**只有「添加模型」这个主入口
 *   才该回退**；从模型表单里点「获取」触发时不能回退——那会把用户已经填好的字段
 *   重置掉（openAdd 会清空表单）。
 */
const open = async (provider: any, models: any[], fallbackToManual = true) => {
  // 账号渠道 provider：模型目录由渠道管理页统一管理，不走云端 fetchRemoteModels（没有 apiKey）
  const channelProviderFlag = isChannelProvider(provider)
  const channelPlatform = String(provider?.platform || provider?.provider || provider?.id || '').toLowerCase()

  // 本地推理（ONNX）无需 base_url 与 Key：模型目录由后端本地模型门面提供，
  // 不能沿用云端提供商的「必须配好地址和 Key 才允许拉取」的前置校验，否则加模型流程会被堵死
  const isLocalProvider =
    provider?.id === 'onnx' ||
    provider?.provider_id === 'onnx' ||
    String(provider?.platform || provider?.provider || '').toLowerCase().includes('onnx')

  if (channelProviderFlag) {
    // 渠道 provider：从渠道管理页拉取已启用模型（渠道总开关 + 单模型开关双重过滤）
    providerId.value = provider?.id || provider?.provider_id || ''
    openIsChannel.value = true
    existingModels = models || []
    knownPresent.clear()
    for (const m of existingModels) {
      const n = String(m?.model ?? m?.modelName ?? '')
      if (n) knownPresent.add(n)
    }
    searchName.value = ''
    fetched.value = []
    loadError.value = ''
    visible.value = true
    fetching.value = true
    try {
      const res: any = await channelApi.list()
      const allChannels: any[] = (res as any)?.data ?? res
      const channelList = Array.isArray(allChannels) ? allChannels : []
      const hit = channelList.find((c: any) => c.channel === channelPlatform || c.providerId === provider?.id)
      if (!hit) throw new Error('未找到该渠道信息，请先到渠道管理页绑定账号')
      if (hit.enabled === false) throw new Error('该渠道当前未启用，请在渠道管理页开启总开关')
      // 从渠道摘要的 models 字段取已启用模型
      const rawModels: any[] = Array.isArray(hit.models) ? hit.models : []
      const enabledModels = rawModels.filter((m: any) => m.enabled !== false)
      const apiModels: any[] = enabledModels.map((m: any) => ({
        modelName: m.model || m.alias,
        modelType: 'text',
        config: { contextWindow: m.contextWindow ?? undefined, features: [] },
      }))
      const enriched = apiModels.map((apiModel: any) => {
        const existing = existingModels.find((m: any) => m.modelName === apiModel.modelName)
        if (existing) {
          return { ...apiModel, id: existing.id, config: { ...existing.config } }
        }
        return { ...apiModel, config: apiModel.config || { features: [] } }
      })
      fetched.value = enriched
      message.success(
        t('settings.providerDetail.fetchSuccess', { n: enriched.length }),
        { duration: 2000 },
      )
    } catch (error: any) {
      fetched.value = []
      loadError.value = error?.message || t('settings.providerDetail.fetchFailed')
      console.error('拉取渠道模型失败:', error)
    } finally {
      fetching.value = false
    }
    return
  }

  if (!isLocalProvider) {
    const hasApiKey =
      provider.apiKey ||
      (provider.apiKeyList && provider.apiKeyList.length > 0) ||
      (provider.api_keys && provider.api_keys.length > 0)
    if (!provider.apiUrl || !hasApiKey) {
      message.error(
        t('settings.providerDetail.configApiError'),
        { duration: 2000 },
      )
      // 没配地址/Key 就拉不到目录，此时如果既不开列表也不开表单，
      // 用户会被卡死在「添加模型」按钮上 —— 主入口直接退回手工新建表单；
      // 表单内点「获取」的分支不回退（见 open 的 fallbackToManual）。
      if (fallbackToManual) {
        emit('manual')
      }
      return
    }
  }

  providerId.value = provider?.id || provider?.provider_id || ''
  openIsChannel.value = false
  existingModels = models || []
  knownPresent.clear()
  for (const m of existingModels) {
    const n = String(m?.model ?? m?.modelName ?? '')
    if (n) knownPresent.add(n)
  }
  searchName.value = ''
  fetched.value = []
  loadError.value = ''
  routeHint.value = ''
  visible.value = true
  fetching.value = true
  try {
    const data = await apiService.fetchRemoteModels(provider.id)
    // 上游鉴权失败时后端返回 200 + success:false（避免被误判为会话过期而登出）
    if (data && data.success === false) {
      throw new Error(data.error || t('settings.providerDetail.fetchFailed'))
    }
    // 免费渠道：模型列表来自后端 extra.routes 路由表（不是调上游 /models），
    // 行用 route_keys 标记（key 即路由键，也是模型名，命中 ChatClient.route(model) 的路由键）。
    // 未配置路由表时只有 hint 没有模型——后端不抛错，前端也不抛：给用户提示，
    // 让用户去供应商列表配好路由再拉。
    const dataField = data?.data as any | undefined
    const isFreeChannel = Boolean(data?.route_keys) || Boolean(dataField?.route_keys)
    const routeHintMessage = (data?.hint as string | undefined) || (dataField?.hint as string | undefined) || ''
    routeHint.value = isFreeChannel ? routeHintMessage : ''
    const models = isFreeChannel
      ? (Array.isArray(dataField?.models) ? dataField.models : [])
      : (data.items ?? (Array.isArray(dataField) ? dataField : dataField?.items) ?? [])
    const apiModels: Model[] = models
    const enriched = apiModels.map((apiModel: any) => {
      const key = String(apiModel?.id ?? apiModel?.name ?? apiModel?.modelName ?? '')
      if (isFreeChannel) {
        // 路由 key 即模型名（ChatClient 按模型名命中路由），模型类型按 tasks 归一化，
        // 特性走 traits（与后端 inferTasks 的语义一致）
        return {
          ...apiModel,
          modelName: apiModel?.name || key,
          modelType: inferTypeFromTask(apiModel?.tasks),
          config: { ...(apiModel?.config || {}), features: toArray(apiModel?.traits) },
        }
      }
      const existing = existingModels.find((m: any) => m.modelName === apiModel.modelName)
      if (existing) {
        return { ...apiModel, id: existing.id, config: { ...existing.config } }
      }
      return { ...apiModel, config: apiModel.config || { features: [] } }
    })
    fetched.value = enriched
    if (isFreeChannel) {
      // 有路由表时提示拉取完成；未配置路由时只展示 hint（空列表不是成功，不要贺电）
      if (routeHintMessage) {
        message.warning(routeHintMessage, { duration: 5000 })
      } else if (enriched.length) {
        message.success(t('settings.providerDetail.fetchSuccess', { n: enriched.length }), { duration: 2000 })
      }
    } else {
      message.success(t('settings.providerDetail.fetchSuccess', { n: enriched.length }), { duration: 2000 })
    }
  } catch (error: any) {
    fetched.value = []
    loadError.value =
      error?.response?.data?.error ||
      error?.data?.error ||
      error?.error ||
      error?.message ||
      t('settings.providerDetail.fetchFailed')
    console.error('获取模型列表失败:', error)
  } finally {
    fetching.value = false
  }
}

/**
 * 上游 task → 中文标签（与 TYPE_META / DefaultModelSettings 的 TYPE_LABELS 同义，
 * 这里只为弹窗服务，不动那两处）。
 */
const FETCH_TASK_LABELS: Record<string, string> = {
  embedding: '嵌入',
  rerank: '重排序',
  image_generation: '文生图',
  image_edit: '文生图',
  video_generation: '文生视频',
  speech_recognition: '语音识别',
  speech_synthesis: '语音合成',
  asr: '语音识别',
  tts: '语音合成',
  image: '文生图',
  video: '文生视频',
  image_cv: '图片识别',
  detection: '检测',
  detect: '检测',
  object_detection: '检测',
  ocr: 'OCR识别',
  ocr_recognition: 'OCR识别',
  face: '人脸识别',
  face_recognition: '人脸识别',
  layout: '布局识别',
}
const typeLabelFor = (t: any): string => {
  const tl = String(t || '').toLowerCase()
  if (FETCH_TASK_LABELS[tl]) return FETCH_TASK_LABELS[tl]
  return String(t || '')
}

const subTypeFor = (m: any): string => {
  const direct = m?.subtype ?? m?.subType ?? m?.modelSubType ?? m?.config?.subType ?? m?.config?.modelSubType
  if (direct) return String(direct).trim()
  if (Array.isArray(m?.capabilities)) {
    for (const c of m.capabilities) {
      const sub = typeof c === 'object' ? (c?.subtype ?? c?.subType) : undefined
      if (sub) return String(sub).trim()
    }
  }
  return ''
}

/**
 * 类型徽标（修复 Q3 报告的误标）。
 *
 * <p>云端上游条目没有 modelType（落库时才有），原模板 `modelType !== 'text'` 恒真，
 * 对话模型也被打上「嵌入」。这里走 capabilities.task / task / tasks 的真实信息
 * 推断：chat/realtime_conversation 这类不显示徽标，其它类型显示中文。</p>
 *
 * @param m 上游条目
 * @returns { label, kind }；不该显示时返回 null
 */
const fetchTypeBadge = (m: any): { label: string; kind: string } | null => {
  const direct = String(m?.modelType ?? '').trim()
  if (direct) {
    if (direct === 'text') return null
    const label = typeLabelFor(direct) || direct
    const sub = subTypeFor(m)
    const subLabel = sub ? MODEL_SUBTYPE_LABELS[sub] || sub : ''
    return { label: subLabel ? `${label} · ${subLabel}` : label, kind: direct }
  }
  const tasks: string[] = []
  const push = (t: any) => {
    if (typeof t === 'string' && t.trim() && !tasks.includes(t.trim())) tasks.push(t.trim())
  }
  const one = (m?.task ?? m?.model_type ?? m?.type)
  if (typeof one === 'string') push(one)
  if (Array.isArray(m?.tasks)) m.tasks.forEach(push)
  if (Array.isArray(m?.capabilities)) {
    m.capabilities.forEach((c: any) => push(typeof c === 'string' ? c : c?.task))
  }
  for (const t of tasks) {
    const tl = t.toLowerCase()
    if (tl === 'chat' || tl === 'realtime_conversation' || tl === 'text' || tl === 'text_generation') continue
    const label = typeLabelFor(t) || t
    const sub = subTypeFor(m)
    const subLabel = sub ? MODEL_SUBTYPE_LABELS[sub] || sub : ''
    return { label: subLabel ? `${label} · ${subLabel}` : label, kind: tl }
  }
  return null
}

/** 来源徽标：整场弹窗同一个供应商，算一次即可 */
const fetchSourceBadge = computed(() => sourceBadgeFor(providerId.value))

/**
 * 通道徽标（免费渠道行专属）：路由表节点里的 upstream provider 经
 * {@link resolveProviderBrand} 解析成品牌 id，交给 ProviderLogo 出图标。
 *
 * <p>路由的 provider  field 就是品牌 id（openai / kilo / openrouter），
 * 不是协议名，所以必须把 `name` 也喂成 route provider，否则 'openai'
 * 这类值会被 resolveProviderBrand 按协议拦截、赛成 'custom'。</p>
 *
 * @param m 上游模型行
 * @returns 品牌 id（没有 route provider 时返回空，不渲染徽标）
 */
const channelBrand = (m: any): string => {
  if (!m?.provider) return ''
  return resolveProviderBrand({ ...m, name: m.provider, provider: m.provider, base_url: m.baseUrl }) || ''
}

/** 管线角色（检测/识别/矫正）→ 图标 */
const HINT_ICONS: Record<string, any> = {
  检测: Scan24Regular,
  识别: DocumentText24Regular,
  矫正: Wand24Regular,
}

/** 特性 key → 图标 */
const FEATURE_ICONS: Record<string, any> = {
  tools: WrenchScrewdriver24Regular,
  thinking: LightbulbFilament24Regular,
  visual: ScienceOutlined,
  'web-search': ScienceOutlined,
}

/**
 * 把一行上游模型的各项标识组装成标签条标签（图标 + tooltip）。
 *
 * <p>组成顺序：类型 → 细分类型 → 来源 → 管线角色 → 特性。
 * 由 {@link ModelTagStrip} 统一渲染为「最多 2 个，其余 +N，悬停看全」。</p>
 *
 * <p>类型徽标原先是一个复合字符串（`OCR识别 · 文字识别`），在 600px 的弹框里
 * 单独就占 100px 以上。这里把它拆成**两个独立标签**，各自带图标，tooltip 各自
 * 给出名称；kind 经 {@link TASK_TO_TYPE} 归一到规范类型，以便取到图标与配色。</p>
 *
 * @param m 上游模型行
 * @returns 标签项列表（可能为空）
 */
const rowTags = (m: any) => {
  const tags: Array<{ key: string; label: string; icon: any; kind: string }> = []

  // ① 类型 + 细分类型（fetchTypeBadge 已做推断，这里只拆开展示）
  const badge = fetchTypeBadge(m)
  if (badge) {
    const rawKind = String(badge.kind || '').toLowerCase()
    const typeKey = TASK_TO_TYPE[rawKind] || rawKind || 'text'
    const [mainLabel, subLabel] = String(badge.label || '').split('·').map((s) => s.trim())
    if (mainLabel) {
      tags.push({
        key: `type:${typeKey}`,
        label: mainLabel,
        icon: MODEL_TYPE_ICON[typeKey] || ScienceOutlined,
        kind: MODEL_TYPE_KIND[typeKey] || 'chat',
      })
    }
    if (subLabel) {
      tags.push({
        key: `sub:${subLabel}`,
        label: subLabel,
        icon: MODEL_TYPE_ICON[typeKey] || Scan24Regular,
        kind: MODEL_TYPE_KIND[typeKey] || 'info',
      })
    }
  }

  // ② 来源：本地推理 vs 云 API（本地/云必须一眼分开，图标也要能区分）
  const src = fetchSourceBadge.value
  if (src?.label) {
    const local = src.kind === 'local'
    tags.push({
      key: `src:${src.kind}`,
      label: src.label,
      icon: local ? Desktop24Regular : Cloud24Regular,
      kind: local ? 'tool' : 'info',
    })
  }

  // ③ 管线角色（检测 / 识别 / 矫正）——只影响显示，不动任何分组
  const hint = taskHintForName(m?.modelName)
  if (hint) {
    tags.push({
      key: `hint:${hint}`,
      label: `管线角色：${hint}`,
      icon: HINT_ICONS[hint] || Scan24Regular,
      kind: 'doc',
    })
  }

  // ④ 特性
  for (const f of m?.config?.features || []) {
    tags.push({
      key: `feat:${f}`,
      label: getLableName(f),
      icon: FEATURE_ICONS[f] || ScienceOutlined,
      kind: 'tool',
    })
  }

  return tags
}

const close = () => { visible.value = false }
/** 点击「手动添加」：先关掉 fetchDialog，让表单-dialog 露出来。
 * 表单-dialog 在「添加模型」时就已打开，这里不能调 openAdd 重置用户内容。 */
const handleManual = () => {
  visible.value = false
  emit('manual')
}
defineExpose({ open, close })

const handleSelect = (model: any) => {
  visible.value = false
  emit('select', model)
}

/**
 * 一键批量录入：整个动作在后端一次完成（调上游取目录 + 写库），
 * 前端只负责把统计结果说清楚。
 *
 * <p>去重语义由后端保证（模型名已存在则跳过、不覆盖用户改过的参数），
 * 所以这里**不做本地预判**，重复点击只是把新出现的模型补录进来。</p>
 */
const handleImportAll = async () => {
  if (importing.value || !providerId.value || fetched.value.length === 0) return
  importing.value = true
  try {
    // 账号渠道 provider：后端 import-all 走 fetchModelsFromUpstream，对 oauth 类 provider 会失败
    // 渠道 provider 逐条走 createModel（PUT /api/provider-models）
    const channelFlag = openIsChannel.value
    if (channelFlag) {
      // 逐条创建，已存在的跳过
      let imported = 0
      let skipped = 0
      for (const m of fetched.value) {
        const name = fetchRowName(m)
        if (!name || knownPresent.has(name)) { skipped++; continue }
        try {
          await apiService.createModel({
            providerId: providerId.value,
            modelName: name,
            enabled: true,
            sort_order: imported,
            config: {},
            capabilities: [{ task: 'chat', traits: [] }],
          })
          knownPresent.add(name)
          imported++
        } catch (e: any) {
          // 已存在等错误视为跳过
          if (String(e?.message || '').includes('已存在') || String(e?.message || '').includes('exist')) skipped++
          else throw e
        }
      }
      message.success(
        t('settings.providerDetail.importDone', { imported, skipped }),
        { duration: 3000 },
      )
      emit('imported')
      visible.value = false
    } else {
      const res = await apiService.importAllModels(providerId.value)
      const imported = Number(res?.imported ?? 0)
      const skipped = Number(res?.skipped ?? 0)
      const total = Number(res?.total ?? imported + skipped)
      if (total === 0) {
        message.warning(
          t('settings.providerDetail.fetchSuccess', { n: 0 }),
          { duration: 3000 },
        )
        return
      }
      const processed = imported + skipped
      const expected = fetched.value.length
      for (const row of res?.models || []) {
        const n = String(row?.model ?? row?.modelName ?? '')
        if (n) knownPresent.add(n)
      }
      const missingLocally = fetched.value.filter((m) => !knownPresent.has(fetchRowName(m))).length
      if (processed < expected && missingLocally > 0) {
        message.warning(
          t('settings.providerDetail.importPartialDesc', { got: processed, expected, imported, skipped }),
          { duration: 6000 },
        )
        emit('imported')
        return
      }
      message.success(
        t('settings.providerDetail.importDone', { imported, skipped }),
        { duration: 3000 },
      )
      emit('imported')
      visible.value = false
    }
  } catch (error: any) {
    message.error(
      error?.response?.data?.message
        || error?.response?.data?.msg
        || error?.data?.error
        || error?.message
        || String(error),
      { duration: 5000 },
    )
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.fetch-search {
  position: sticky;
  top: 0;
  z-index: 10;
  margin-bottom: 12px;
  /* 搜索框 + 「全部录入」并排：录入是主操作，不能藏在列表里 */
  display: flex;
  align-items: center;
  gap: 8px;
}
.fetch-input { flex: 1; min-width: 0; }
.fetch-foot {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}
.fetch-loading { display: flex; justify-content: center; align-items: center; padding: 48px 0; }
.fetch-list {
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
}
.fetch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background 0.15s ease;
}
.fetch-row:last-child { border-bottom: none; }
.fetch-row:hover { background: var(--el-fill-color-light); }
.fetch-main { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; margin-right: 16px; }
.fetch-desc {
  font-size: 12px;
  color: var(--color-text-gray);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fetch-id { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; margin-right: 16px; }
/* 通道徽标：把 ProviderLogo 压到行内图标量级，跟在模型名后面 */
.fetch-brand {
  width: 24px;
  height: 24px;
  margin-right: 6px;
  flex-shrink: 0;
}
.fetch-brand :deep(.el-image),
.fetch-brand :deep(.avatar-auto) {
  width: 24px !important;
  height: 24px !important;
}
.fetch-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* .fetch-badge / .fetch-feature 已随标签改造移除：
   类型、来源、管线角色、特性统一由 ModelTagStrip 以「图标 + tooltip」渲染，
   不再有纯文字徽标，配色也由该组件的 kind-* 负责。 */
.fetch-empty { text-align: center; padding: 48px 0; font-size: 13px; color: var(--color-text-disabled); }
/* 免费渠道提示：路由表未配置时给用户指引，不是错误， warn 色即可 */
.fetch-hint {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin-top: 6px;
  padding: 14px 15px;
  border-radius: var(--el-radius-lg, 12px);
  background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 30%, transparent);
}
.fetch-hint-icon { color: var(--el-color-warning); flex-shrink: 0; margin-top: 1px; }
.fetch-hint-text { font-size: 13px; color: var(--color-text); line-height: 1.5; }
.fetch-error {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin-top: 6px;
  padding: 14px 15px;
  /* 原值 11px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 30%, transparent);
}
.fetch-error-icon { color: var(--el-color-danger); flex-shrink: 0; margin-top: 1px; }
.fetch-error-text { min-width: 0; }
.fetch-error-title { font-size: 13px; font-weight: 700; color: var(--el-color-danger); }
.fetch-error-desc {
  font-size: 12px;
  color: var(--color-text-gray);
  margin-top: 3px;
  line-height: 1.5;
  word-break: break-word;
}

/* 动效降级：系统开启「减少动态效果」时，供应商行的悬停底色直接到位。
   逐个列出，不写 `*` / .fetch-row * 通配，
   避免把 el-dialog / el-tag 内部 Element Plus 组件的合法过渡一起掐掉。 */
@media (prefers-reduced-motion: reduce) {
  .fetch-row {
    transition: none;
  }
}
</style>
