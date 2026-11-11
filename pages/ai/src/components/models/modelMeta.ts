/**
 * 模型的「规范类型 / 展示标签」与「选择器候选行」的统一构造。
 *
 * <p><b>为什么单独成模块。</b>配置中心里有多处模型选择弹框（默认模型页、
 * 会话页的对话路由、通用设置的压缩模型、ReID 配置页）。原先每个页面各自把
 * `/api/providers` 的裸行映射成自己的结构：有的带 `types` / `displayTags`，
 * 有的只有 `id + model`，于是同一个弹框在不同页面里标签、副信息、图标都不一样 ——
 * 用户看到「配置中心里的选择模型弹框怎么长得不一样」。这里把映射逻辑收成一份，
 * 各页面只决定「取哪些类型」，不再各自造行。</p>
 *
 * <p>类型推断口径与模型管理卡片、后端 {@code inferTasks} 保持一致：
 * 先看 {@code capabilities[].task}，能力的任务不在类型表里时按附加特性处理；
 * {@code capabilities} 没给出确定类型时才按模型名纠偏（避免把
 * {@code cn-clip-rn50-image} 这类图像特征模型误判成文生图）。</p>
 */

import { MODEL_SUBTYPE_LABELS, TASK_TO_TYPE as BASE_TASK_TO_TYPE } from './model.constants'
import { deriveModelTraits, inferSubType } from './model.utils'

/**
 * capability.task → 规范类型。
 *
 * <p>在 {@code model.constants.TASK_TO_TYPE} 的基础上补两条：后端
 * {@code ApiProviderController.classifyOnnxTask} 的兜底分支会把
 * {@code image_feature} / {@code feature_extraction}（resnet / clip / dino 等）
 * 归到图片识别。常量表里缺这两项时，这些模型既不进类型也不进特性，
 * 「图像特征模型」字段的弹框里一个 CV 模型都看不到。</p>
 */
const TASK_TO_TYPE: Record<string, string> = {
  ...BASE_TASK_TO_TYPE,
  image_feature: 'image_cv',
  feature_extraction: 'image_cv',
}

/** 规范类型的中文标签 */
export const TYPE_LABELS: Record<string, string> = {
  text: '对话',
  embedding: '嵌入',
  asr: '语音识别',
  tts: '语音合成',
  image: '文生图',
  video: '文生视频',
  rerank: '重排序',
  ocr: 'OCR识别',
  face: '人脸识别',
  layout: '布局识别',
  image_cv: '图片识别',
  detection: '检测',
}

/** 规范类型 → ReTag 配色 */
const TYPE_TAG_TYPE: Record<string, string> = {
  text: 'primary',
  embedding: 'success',
  asr: 'info',
  tts: 'info',
  image: 'warning',
  video: 'danger',
  rerank: 'info',
  ocr: 'info',
  face: 'info',
  layout: 'info',
  image_cv: 'info',
  detection: 'info',
}

/** feature 类 capability（附加能力，不是主类型） */
const FEATURE_LABELS: Record<string, string> = {
  thinking: '深度思考',
  'web-search': '在线检索',
  tools: '工具调用',
  tool_calls: '工具调用',
}

/**
 * 依据模型名推断规范类型（与后端 inferTasks 对齐）。
 *
 * @param modelName 模型名
 * @returns 规范类型
 */
export function inferTypeByName(modelName: string): string {
  const l = String(modelName || '').toLowerCase()
  if (l.includes('embedding') || l.includes('embed') || l.includes('-bge-')) return 'embedding'
  if (l.includes('rerank')) return 'rerank'
  if (l.includes('tts') || l.includes('speech-synthesis') || l.includes('speech_synthesis')) return 'tts'
  if (l.includes('whisper') || l.includes('asr') || l.includes('speech-recognition')) return 'asr'
  if (l.includes('detect') || l.includes('-det-') || l.includes('yolo')
    || l.includes('scrfd') || l.includes('nms')) return 'detection'
  if (l.includes('dall-e') || l.includes('image-gen') || l.includes('cogview') || l.includes('flux') || l.includes('image')) return 'image'
  if (l.includes('cogvideo') || l.includes('video-gen') || l.includes('video')) return 'video'
  return 'text'
}

/** {@link resolveModelMeta} 的返回值 */
export interface ModelMeta {
  /** 规范类型（首项为主类型） */
  types: string[]
  /** 附加特性（thinking / web-search / tools） */
  features: string[]
  /** 主类型 */
  primaryType: string
  /** 弹框行上的标签（类型 / 细分类型 / 特性） */
  displayTags: Array<{ value: string; label: string; tagType: string }>
  /** 细分类型（OCR / 人脸的管线角色等） */
  subTypes: string[]
}

/**
 * 从 capabilities + 模型名解析模型的类型与特性。
 *
 * @param modelName    模型名
 * @param capabilities 后端模型行的 capabilities
 * @returns 类型、特性、标签与细分类型
 */
export function resolveModelMeta(modelName: string, capabilities: any): ModelMeta {
  const types: string[] = []
  const features: string[] = []
  const subTypes: string[] = []
  ;(Array.isArray(capabilities) ? capabilities : []).forEach((cap: any) => {
    const task = cap?.task
    if (!task) return
    if (TASK_TO_TYPE[task]) {
      const t = TASK_TO_TYPE[task]
      if (!types.includes(t)) types.push(t)
    } else if (FEATURE_LABELS[task]) {
      if (!features.includes(task)) features.push(task)
    }
    const sub = cap?.subtype ?? cap?.subType
    if (sub && MODEL_SUBTYPE_LABELS[String(sub)] && !subTypes.includes(String(sub))) {
      subTypes.push(String(sub))
    }
  })
  // 名称强类型纠偏：**仅在 capabilities 没给出任何确定类型时**才生效。
  //
  // 原为「名称无条件优先」，本意是修正 capabilities 误标（如 agnes-image 被标成 chat）。
  // 但它会把 cn-clip-rn50-image、resnet50-feature 这类「名字里带 image 的图像特征模型」
  // 经 inferTypeByName 的 'image' 分支拽到「文生图」去 —— 而 capabilities 已经明确
  // 给了 embedding / image_cv。
  const nameType = inferTypeByName(modelName)
  const hasDefinitive = types.some((t) => t !== 'text')
  if (!hasDefinitive && nameType !== 'text') {
    for (let i = types.length - 1; i >= 0; i--) {
      if (types[i] === 'text') types.splice(i, 1)
    }
    if (!types.includes(nameType)) types.unshift(nameType)
  }
  if (types.length === 0) types.push(nameType)

  const primaryType = types[0]
  const inferredSubType = inferSubType({ model: modelName, capabilities }, primaryType)
  if (inferredSubType && !subTypes.includes(inferredSubType)) {
    subTypes.push(inferredSubType)
  }
  const displayTags: ModelMeta['displayTags'] = [
    { value: `type:${primaryType}`, label: TYPE_LABELS[primaryType] || primaryType, tagType: TYPE_TAG_TYPE[primaryType] || 'info' },
  ]
  subTypes.forEach((sub) => displayTags.push({
    value: `sub:${sub}`,
    label: MODEL_SUBTYPE_LABELS[sub] || sub,
    tagType: 'info',
  }))
  // thinking / web-search / tools 等特性仅对话模型有意义
  if (primaryType === 'text') {
    features.slice(0, 2).forEach((f) =>
      displayTags.push({ value: `feat:${f}`, label: FEATURE_LABELS[f], tagType: 'info' }),
    )
  }
  return { types, features, primaryType, displayTags, subTypes }
}

/**
 * 从「字段已选值」还原成弹框行（输入框左侧图标用）。
 *
 * <p>模型字段存的是 {@code providerId:model} 复合键，图标需要的不只是模型名：
 * 优先在已加载的分组里找到**真实候选行**（带 description，能还原上游通道），
 * 找不到时退化成只有名字的最小行，至少还能按模型名匹配品牌图。</p>
 *
 * @param value     字段值（providerId:model 或裸模型名）
 * @param providers 已加载的供应商分组（弹框数据源）
 * @returns 模型行与所属供应商；空值返回 null
 */
export function findPickedModel(value: any, providers: any[]): { model: any; provider: any } | null {
  const raw = String(value ?? '')
  if (!raw) return null
  const idx = raw.indexOf(':')
  const providerId = idx > 0 ? raw.slice(0, idx) : ''
  const modelName = idx >= 0 ? raw.slice(idx + 1) : raw
  if (!modelName) return null
  const groups = Array.isArray(providers) ? providers : []
  const group = groups.find((p) => p?.id === providerId) || groups.find((p) =>
    (p?.models || []).some((m: any) => String(m?.model || '') === modelName))
  const row = (group?.models || []).find((m: any) => String(m?.model || '') === modelName)
  if (row) return { model: row, provider: group }
  return { model: { model: modelName, providerId }, provider: group || null }
}

/**
 * 宽松数值解析：空值 / 非数字一律返回 null（区分「未采集」与 0）。
 *
 * @param v 原始值
 * @returns 数字或 null
 */
function numOrNull(v: any): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

/**
 * 把 `/api/providers` 的一条模型行映射成模型选择弹框的候选行。
 *
 * <p>行里保留 {@code description} / {@code base_url} / {@code provider}（协议）：
 * 聚合渠道（FreeChannel）把每一行真正接的上游通道写进了描述，
 * 弹框的通道图标要靠它还原（与模型管理卡片同一套 {@code resolveModelChannelBrand}）。</p>
 *
 * @param provider 供应商行（/api/providers 的原始对象）
 * @param m        模型行
 * @returns 弹框候选行（id 形如 providerId:model）
 */
export function mapProviderModel(provider: any, m: any) {
  const meta = resolveModelMeta(m?.model, m?.capabilities)
  const traits = deriveModelTraits(m, meta.primaryType)
  // 延迟：优先最近一次实测（modelLastLatency / probe_latency_ms / latency_ms），
  // 都没有时回退指标表的官方首字延迟（latency_first_token_seconds，秒*1000→ms）。
  const metrics = m?.metrics || {}
  const officialLatencySec = numOrNull(metrics.latency_first_token_seconds)
  const latencyMs = numOrNull(m?.modelLastLatency ?? metrics.probe_latency_ms ?? metrics.latency_ms)
    ?? (officialLatencySec != null ? officialLatencySec * 1000 : null)
  return {
    id: `${provider.provider_id}:${m.model}`,
    modelName: `${provider.name}/${m.model}`,
    model: m.model,
    providerId: provider.provider_id,
    providerName: provider.name,
    // 通道图标与「真接哪条上游」的原始依据
    description: m.description,
    base_url: m.base_url ?? m.baseUrl ?? m.api_url,
    provider: m.provider,
    inputKinds: traits.inputCapabilities,
    outputKinds: traits.outputCapabilities,
    latencyMs,
    ...meta,
  }
}
