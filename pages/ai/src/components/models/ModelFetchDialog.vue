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
          免费模型一键全选：上游 pricing 里输入/输出价均为 0 的行标记为免费。
          没有免费行时按钮禁用，不会出现「点了没反应」。
        -->
        <el-button
          :disabled="freeRows.length === 0 || fetching"
          @click="toggleSelectFree"
        >
          {{ allFreeSelected
            ? t('settings.providerDetail.clearFreeSelection')
            : t('settings.providerDetail.selectAllFree', { n: freeRows.length }) }}
        </el-button>
      </div>
      <div class="fetch-actions">
        <span class="fetch-selected-count">
          {{ t('settings.providerDetail.selectedCount', { n: selected.length }) }}
        </span>
        <el-button
          type="primary"
          :loading="importing"
          :disabled="selected.length === 0 || fetching"
          @click="handleImportSelected"
        >
          <template #icon><Download /></template>
          {{ importing
            ? t('settings.providerDetail.importing')
            : t('settings.providerDetail.importSelected', { n: selected.length }) }}
        </el-button>
        <!--
          一键批量录入：整批走后端 POST /providers/{id}/models/import-all，
          后端负责调上游取目录 + 落库（已存在的跳过），用户不必逐条点「选择」。
        -->
        <el-button
          :loading="importingAll"
          :disabled="fetched.length === 0 || fetching"
          @click="handleImportAll"
        >
          <template #icon><Download /></template>
          {{ importingAll
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
            <li v-for="model in filtered" :key="model.modelName" class="fetch-row"
              :class="{ 'is-picked': isSelected(model) }">
              <!-- 多选：默认不勾，用户逐条勾选后「录入选中」批量落库 -->
              <el-checkbox
                class="fetch-check"
                :model-value="isSelected(model)"
                @change="toggleRow(model)"
              />
              <div class="fetch-main">
                <div class="fetch-id">
                  <span class="fetch-name">{{ model.modelName }}</span>
                  <!-- 价格 / 免费：上游 pricing 经后端归一成每百万 token 美元 -->
                  <span
                    v-if="modelPriceOf(model).known"
                    class="fetch-price"
                    :class="{ 'is-free': modelPriceOf(model).free }"
                  >
                    {{ priceText(model) }}
                  </span>
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
                <ModelTagStrip :tags="rowIoTags(model)" :max="2" />
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
        <!-- 拉取失败时显示错误信息，并提供「重新拉取」按钮（Connection 失败等可恢复错误） -->
        <ReErrorBar
          v-else-if="loadError"
          :message="loadError"
          retryText="重新拉取"
          @retry="retryFetch"
        />
        <!-- 无模型不是「操作成功」：统一 ReEmpty，保留明确的重新拉取动作 -->
        <ReEmpty v-else-if="hasFetched && routeHint" :text="routeHint">
          <el-button type="primary" @click="retryFetch">重新拉取</el-button>
        </ReEmpty>
        <!-- 只有真正拉取过且无数据时才显示空状态；初始未拉取时不显示任何列表内容 -->
        <ReEmpty v-else-if="hasFetched && fetched.length === 0" text="该提供商没有返回模型">
          <el-button type="primary" @click="retryFetch">重新拉取</el-button>
        </ReEmpty>
        <!-- 有数据但当前搜索词筛不出结果 -->
        <ReEmpty v-else-if="hasFetched" :text="t('settings.providerDetail.noMatchFound')" />
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
import ReErrorBar from '@repo/ui/re-error-bar'
import ReEmpty from '@/components/ui/ReEmpty.vue'
import {
  describeFetchRow, sourceBadgeFor, taskHintForName, resolveProviderBrand,
  deriveFetchedModelConfig, modelPriceOf, inferModelType,
} from './model.utils'
import {
  MODEL_SUBTYPE_LABELS, MODEL_TYPE_ICON, MODEL_TYPE_KIND, TASK_TO_TYPE, TYPE_TO_TASK,
} from './model.constants'
import { isChannelProvider } from './model.constants'
import { channelApi } from '@/services/javaApi'
import { SearchOutlined, ScienceOutlined } from '@vicons/material'
import {
  WrenchScrewdriver24Regular, LightbulbFilament24Regular,
  Desktop24Regular, Cloud24Regular, Scan24Regular, DocumentText24Regular, Wand24Regular,
  TextT24Regular, Image24Regular, Speaker224Regular, Video24Regular, Folder24Regular,
} from '@vicons/fluent'
import { Loading, Download } from '@element-plus/icons-vue'
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
/** 正在批量录入「全部」 */
const importingAll = ref(false)
/** 已勾选的模型名（多选批量录入） */
const selected = ref<string[]>([])
const loadError = ref('')
/** 当前参数：open() 记住供应商，fetch 失败后「重新拉取」按钮用 */
const currentProvider = ref<any>(null)
/** 免费渠道提示：extra.routes 未配置时后端只回传 hint，前端展示它而不是空状态 */
const routeHint = ref('')
/** 当前供应商标识：批量录入要按它落库，open 时记下，避免再以 props 里猜 */
const providerId = ref('')
/** 本次 open 的是否渠道 provider（决定 handleImportAll 走逐条 createModel 还是后端 import-all） */
const openIsChannel = ref(false)
/** 是否已经真正执行过拉取（用于区分「还没拉取」和「拉完了但没数据」） */
const hasFetched = ref(false)
let existingModels: any[] = []
/**
 * 已知在库里的模型名（打开时来自既有模型，每次录入成功后并入返回的新行）。
 * 用来判断「上游这次没返回的，是不是本来就录过了」——否则上游短返回时会误报
 * 「部分录入」，让用户对着已经录全的列表反复点。
 */
const knownPresent = new Set<string>()
/** 拉取列表行的模型名（上游条目字段名不统一，modelName/name/id 三处都可能有） */
const fetchRowName = (m: any) => String(m?.modelName ?? m?.name ?? m?.id ?? '')

/** 非空数组优先，否则回退推导值 */
const listOr = (primary: any, fallback: any) =>
  Array.isArray(primary) && primary.length ? primary : fallback

/**
 * 归一错误文案。
 *
 * <p>后端信封的成功 msg 是「操作成功」，个别链路会把它带进 error.message；
 * 这种成功文案绝不能当成错误展示，否则会出现「操作成功 + 重新拉取」的怪状态。
 * 拿不到真实错误时返回空串，交给上层走「无数据 / 正常」分支。</p>
 *
 * @param error 捕获到的异常
 * @returns 可展示的错误文案；无有效错误时为空串
 */
const normalizeLoadError = (error: any): string => {
  const candidates = [
    error?.response?.data?.error,
    error?.response?.data?.msg,
    error?.data?.error,
    error?.data?.msg,
    error?.error,
    error?.message,
  ]
  for (const c of candidates) {
    const text = String(c ?? '').trim()
    if (text && text !== t('common.operationSuccess')) return text
  }
  return ''
}

/** 勾选状态 */
const isSelected = (m: any) => selected.value.includes(fetchRowName(m))

/**
 * 勾选/取消一行。
 *
 * @param m 上游模型行
 */
const toggleRow = (m: any) => {
  const key = fetchRowName(m)
  if (!key) return
  const index = selected.value.indexOf(key)
  if (index >= 0) selected.value.splice(index, 1)
  else selected.value.push(key)
}

/** 当前筛选结果里的免费模型（价格已知且输入输出均为 0） */
const freeRows = computed(() => filtered.value.filter((m) => modelPriceOf(m).free))

/** 免费行是否已全选 */
const allFreeSelected = computed(() =>
  freeRows.value.length > 0 && freeRows.value.every((m) => isSelected(m)))

/**
 * 全选/取消全选免费模型（只作用于当前筛选结果，配合搜索使用）。
 */
const toggleSelectFree = () => {
  const keys = freeRows.value.map(fetchRowName).filter(Boolean)
  if (allFreeSelected.value) {
    selected.value = selected.value.filter((k) => !keys.includes(k))
  } else {
    for (const key of keys) {
      if (!selected.value.includes(key)) selected.value.push(key)
    }
  }
}

/**
 * 价格文案：免费直接标注；有价格时显示「输入/输出 $/M」；未知不占位。
 *
 * @param m 上游模型行
 * @returns 文案；无价格信息时返回空串
 */
const priceText = (m: any): string => {
  const price = modelPriceOf(m)
  if (!price.known) return ''
  if (price.free) return '免费'
  const fmt = (v: number | null) => (v == null ? '—' : `$${Number(v.toFixed(4))}`)
  return `收费 · ${fmt(price.input)} / ${fmt(price.output)} / 1M`
}

const MODALITY_LABELS: Record<string, string> = {
  text: '文本', image: '图片', audio: '音频', video: '视频', file: '文件', vector: '向量',
}

const MODALITY_ICON: Record<string, any> = {
  text: TextT24Regular,
  image: Image24Regular,
  audio: Speaker224Regular,
  video: Video24Regular,
  file: DocumentText24Regular,
  vector: Folder24Regular,
}

/** 输入 / 输出模态标签（图标 + tooltip，由 ModelTagStrip 统一渲染）。
 *
 * <p>上游 /models 极少携带价格，输入输出模态也不一定齐全；
 * 这里只展示上游 genuinely 声明的模态，没有时不渲染，不做假能力。</p>
 *
 * @param m 上游模型行
 * @returns 标签项列表（可能为空）
 */
const rowIoTags = (m: any) => {
  const cfg = m?.config || deriveFetchedModelConfig(m, String(m?.modelType || inferModelType(m) || 'text'))
  const tags: Array<{ key: string; label: string; icon: any; kind: string }> = []
  const inList = Array.isArray(cfg?.inputCapabilities) ? cfg.inputCapabilities : []
  const outList = Array.isArray(cfg?.outputCapabilities) ? cfg.outputCapabilities : []
  if (inList.length) {
    tags.push({
      key: 'io:in',
      label: `输入：${inList.map((v: string) => MODALITY_LABELS[String(v).toLowerCase()] || String(v)).join(' + ')}`,
      icon: MODALITY_ICON[String(inList[0]).toLowerCase()] || ScienceOutlined,
      kind: 'doc',
    })
  }
  if (outList.length) {
    tags.push({
      key: 'io:out',
      label: `输出：${outList.map((v: string) => MODALITY_LABELS[String(v).toLowerCase()] || String(v)).join(' + ')}`,
      icon: MODALITY_ICON[String(outList[0]).toLowerCase()] || ScienceOutlined,
      kind: 'doc',
    })
  }
  return tags
}

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
 * 打开拉取列表。
 *
 * @param provider 供应商对象（含 id/apiUrl/apiKey）
 * @param models 该供应商已有的模型（用于「已有」标记）
 * @param fallbackToManual 拉不动时是否回退手工表单。**只有「添加模型」这个主入口
 *   才该回退**；从模型表单里点「获取」触发时不能回退——那会把用户已经填好的字段
 *   重置掉（openAdd 会清空表单）。
 */
const open = async (provider: any, models: any[], fallbackToManual = true) => {
  // 注册供应商：重新拉取（模型源连不上时 ReErrorBar 上的「重新拉取」）用
  currentProvider.value = provider
  // 账号渠道 provider：模型目录由渠道管理页统一管理，不走云端 fetchRemoteModels（没有 apiKey）
  const channelProviderFlag = isChannelProvider(provider)
  const channelPlatform = String(provider?.platform || provider?.provider || provider?.id || '').toLowerCase()
  // FreeChannel 是模型路由表聚合，不是 OAuth 渠道：即使不配置自身 Key，也应直接
  // 读取后端 extra.routes 的路由键清单，而不是拦在「请先配 API 地址与 Key」。
  const rawPlatform = String(provider?.rawPlatform || provider?.platform || provider?.provider || '').toLowerCase()
  const freeChannelProvider = rawPlatform === 'free-channel' || rawPlatform === 'free'

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
    selected.value = []
    loadError.value = ''
    routeHint.value = ''
    visible.value = true
    fetching.value = true
    hasFetched.value = false
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
      const apiModels: any[] = enabledModels.map((m: any) => {
        // 不要把渠道管理返回的价格、modality、tasks 等元数据裁掉；模型列表要能说明
        // 输入/输出能力以及是否免费。渠道摘要字段可能是 contextWindow 驼峰形式。
        const modelName = m.model || m.modelName || m.alias || m.id
        const modelType = String(m.modelType || inferModelType(m) || 'text')
        const config = deriveFetchedModelConfig({
          ...m,
          context_window: m.context_window ?? m.contextWindow,
        }, modelType)
        return { ...m, modelName, modelType, config }
      })
      const enriched = apiModels.map((apiModel: any) => {
        const existing = existingModels.find((m: any) => m.modelName === apiModel.modelName || m.model === apiModel.modelName)
        if (!existing) return apiModel
        const oldConfig = existing.config || {}
        return {
          ...apiModel,
          id: existing.id,
          config: {
            ...apiModel.config,
            ...oldConfig,
            inputCapabilities: listOr(oldConfig.inputCapabilities, apiModel.config.inputCapabilities),
            outputCapabilities: listOr(oldConfig.outputCapabilities, apiModel.config.outputCapabilities),
            features: listOr(oldConfig.features, apiModel.config.features),
          },
        }
      })
      fetched.value = enriched
      // 明确清除旧错误：渠道拉取成功，不能留上一次的痕迹
      loadError.value = ''
      if (enriched.length > 0) {
        message.success(
          t('settings.providerDetail.fetchSuccess', { n: enriched.length }),
          { duration: 2000 },
        )
      }
    } catch (error: any) {
      fetched.value = []
      loadError.value = normalizeLoadError(error)
      console.error('拉取渠道模型失败:', error)
    } finally {
      fetching.value = false
      hasFetched.value = true
    }
    return
  }

  if (!isLocalProvider && !freeChannelProvider) {
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
  selected.value = []
  loadError.value = ''
  routeHint.value = ''
  visible.value = true
  fetching.value = true
  hasFetched.value = false
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
    // hint 不限于免费渠道：连接失败时后端回空列表 + hint，这里同样展示，
    // 避免用户只看到一句「无匹配」而不知道原因。
    routeHint.value = routeHintMessage
    const models = isFreeChannel
      ? (Array.isArray(dataField?.models) ? dataField.models : [])
      : (data.items ?? (Array.isArray(dataField) ? dataField : dataField?.items) ?? [])
    const apiModels: Model[] = models
    const enriched = apiModels.map((apiModel: any) => {
      const key = String(apiModel?.id ?? apiModel?.name ?? apiModel?.modelName ?? '')
      // 规范类型：上游行的 tasks / 模型名推断；输入输出能力、窗口、采样参数、
      // 能力开关由 deriveFetchedModelConfig 从上游元数据推导，避免选中后表单全空。
      const type = String(apiModel?.modelType || inferModelType(apiModel) || 'text')
      const derived = deriveFetchedModelConfig(apiModel, type)
      const rowName = apiModel?.modelName || apiModel?.name || key
      const existing = existingModels.find((m: any) =>
        m?.modelName === rowName || m?.model === rowName)
      // 已存在的模型：以库里的配置为准，但空数组/空值不能盖掉从上游推导出的能力，
      // 否则重新拉取后表单里的输入输出又回到空。
      const config = existing?.config
        ? {
            ...derived,
            ...existing.config,
            inputCapabilities: listOr(existing.config.inputCapabilities, derived.inputCapabilities),
            outputCapabilities: listOr(existing.config.outputCapabilities, derived.outputCapabilities),
            features: listOr(existing.config.features, derived.features),
          }
        : derived
      return {
        ...apiModel,
        modelName: rowName,
        modelType: existing?.modelType || type,
        ...(existing?.id ? { id: existing.id } : {}),
        config,
      }
    })
    fetched.value = enriched
    // 明确清除旧错误：上游拉取成功，不能留上一次的痕迹
    loadError.value = ''
    if (isFreeChannel) {
      // 有路由表时提示拉取完成；未配置路由时只展示 hint（空列表不是成功，不要贺电）
      if (routeHintMessage) {
        message.warning(routeHintMessage, { duration: 5000 })
      } else if (enriched.length) {
        message.success(t('settings.providerDetail.fetchSuccess', { n: enriched.length }), { duration: 2000 })
      }
    } else {
      if (enriched.length) {
        message.success(t('settings.providerDetail.fetchSuccess', { n: enriched.length }), { duration: 2000 })
      } else if (routeHintMessage) {
        message.warning(routeHintMessage, { duration: 5000 })
      }
    }
  } catch (error: any) {
    fetched.value = []
    loadError.value = normalizeLoadError(error)
    console.error('获取模型列表失败:', error)
  } finally {
    fetching.value = false
    hasFetched.value = true
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

/**
 * 重新拉取：用 open() 记住的供应商再跑一次（远程拉取 / 渠道拉取两者的错误都归到
 * loadError，所以只靠它就能决定走哪条路）。loadError 由 open() 在 fetch 前清空、
 * fetch 成功后再次确认清空，确保重新拉取成功时错误的痕迹不残留。
 */
const retryFetch = async () => {
  if (!currentProvider.value) return
  loadError.value = ''
  await open(currentProvider.value, existingModels)
}
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
 * 把一行上游模型整理成「保存模型」接口的入参。
 *
 * <p>渠道 provider 没有后端 import-all 通路，只能逐条 createModel；
 * 这里带上推导出的能力/参数，避免录进来的模型丢失上游元数据。</p>
 *
 * @param m 上游模型行
 * @returns createModel 入参
 */
const createModelPayload = (m: any) => {
  const type = String(m?.modelType || inferModelType(m) || 'text')
  const cfg = m?.config && Object.keys(m.config).length ? m.config : deriveFetchedModelConfig(m, type)
  const caps = Array.isArray((cfg as any).capabilities) ? (cfg as any).capabilities : []
  return {
    providerId: providerId.value,
    modelName: fetchRowName(m),
    alias: m?.alias || '',
    modelType: type,
    enabled: true,
    sort_order: 0,
    config: cfg,
    capabilities: [{ task: TYPE_TO_TASK[type] || 'chat', traits: [] }],
    attachment: caps.includes('attachment'),
    reasoning: caps.includes('reasoning'),
    tool_call: caps.includes('tool_call'),
    temperature_supported: caps.includes('temperature'),
    open_weights: caps.includes('open_weights'),
    ...(m?.family ? { family: m.family } : {}),
    ...(m?.knowledge ? { knowledge: m.knowledge } : {}),
    ...(m?.release_date ? { release_date: m.release_date } : {}),
    ...(m?.last_updated ? { last_updated: m.last_updated } : {}),
    ...(m?.modalities ? { modalities: m.modalities } : {}),
    ...(Array.isArray(m?.thinking_efforts) ? { thinking_efforts: m.thinking_efforts } : {}),
  }
}

/**
 * 一键批量录入（全部）。
 */
const handleImportAll = async () => {
  if (importingAll.value || importing.value || !providerId.value || fetched.value.length === 0) return
  importingAll.value = true
  try {
    await doImport(fetched.value, true)
  } finally {
    importingAll.value = false
  }
}

/**
 * 录入勾选的模型（多选）。
 */
const handleImportSelected = async () => {
  if (importing.value || importingAll.value || !providerId.value || selected.value.length === 0) return
  importing.value = true
  try {
    await doImport(fetched.value.filter((m) => isSelected(m)), false)
  } finally {
    importing.value = false
  }
}

/**
 * 执行批量录入。
 *
 * <p>非渠道 provider 统一走后端 import-all：选中子集时把模型名放进
 * {@code models} 过滤，仍复用后端同一套元数据回填与去重逻辑
 * （逐条 createModel 会丢掉上游 metrics）。</p>
 *
 * @param rows  待录入行
 * @param isAll 是否「全部录入」
 */
const doImport = async (rows: any[], isAll: boolean) => {
  if (!providerId.value || rows.length === 0) return
  try {
    // 账号渠道 provider：后端 import-all 走 fetchModelsFromUpstream，对 oauth 类 provider 会失败
    // 渠道 provider 逐条走 createModel（PUT /api/provider-models）
    if (openIsChannel.value) {
      // 逐条创建，已存在的跳过
      let imported = 0
      let skipped = 0
      for (const m of rows) {
        const name = fetchRowName(m)
        if (!name || knownPresent.has(name)) { skipped++; continue }
        try {
          await apiService.createModel(createModelPayload(m))
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
      return
    }

    const names = rows.map(fetchRowName).filter(Boolean)
    const res = await apiService.importAllModels(
      providerId.value,
      isAll ? undefined : { models: names },
    )
    const imported = Number(res?.imported ?? 0)
    const skipped = Number(res?.skipped ?? 0)
    const total = Number(res?.total ?? imported + skipped)
    if (total === 0) {
      // 后端没返回/没有可录入模型不是成功：清空列表，交给 ReEmpty +「重新拉取」状态提示。
      fetched.value = []
      selected.value = []
      return
    }
    const processed = imported + skipped
    const expected = rows.length
    for (const row of res?.models || []) {
      const n = String(row?.model ?? row?.modelName ?? '')
      if (n) knownPresent.add(n)
    }
    const missingLocally = rows.filter((m) => !knownPresent.has(fetchRowName(m))).length
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
  } catch (error: any) {
    message.error(
      error?.response?.data?.message
        || error?.response?.data?.msg
        || error?.data?.error
        || error?.message
        || String(error),
      { duration: 5000 },
    )
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
/* 多选批量录入：勾选态 + 底部操作条 */
.fetch-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
  margin-bottom: 16px;
}
.fetch-selected-count {
  margin-right: auto;
  font-size: 12px;
  color: var(--color-text-gray);
}
.fetch-check { flex-shrink: 0; margin-right: 10px; }
.fetch-row.is-picked { background: color-mix(in srgb, var(--color-primary) 8%, transparent); }
.fetch-price {
  flex-shrink: 0;
  padding: 0 6px;
  font-size: 11.5px;
  line-height: 18px;
  color: var(--color-text-gray);
  border-radius: var(--el-radius-sm, 4px);
  background: var(--el-fill-color-light);
}
.fetch-price.is-free {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}
.fetch-price.is-unknown {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
}
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
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fetch-io {
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-regular);
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
/* 动效降级：系统开启「减少动态效果」时，供应商行的悬停底色直接到位。
   逐个列出，不写 `*` / .fetch-row * 通配，
   避免把 el-dialog / el-tag 内部 Element Plus 组件的合法过渡一起掐掉。 */
@media (prefers-reduced-motion: reduce) {
  .fetch-row {
    transition: none;
  }
}
</style>
