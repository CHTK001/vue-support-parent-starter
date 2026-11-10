// 模型管理：数据映射与工具函数
import { TASK_TO_TYPE, LOCAL_PROVIDER_IDS, PROVIDER_SOURCE_LABEL, taskHintForName, PROVIDER_TEMPLATES } from './model.constants'

/**
 * 转发 model.constants 里的这几个符号。
 *
 * <p>必须显式再导出，不能只 import 进来：ESM 下「import 进来」不等于「再导出」，
 * ModelFetchDialog.vue 一直是 `import { taskHintForName } from './model.utils'`，
 * 于是运行期报</p>
 *
 * <pre>The requested module '.../model.utils.ts' does not provide an export
 * named 'taskHintForName'</pre>
 *
 * <p>这个错直接让整个 Bots 路由白屏（2026-10-14 全量点击扫描实测：Bots 0 可点、
 * 加载期 pageerror 1 条）。import 未使用的 TASK_TO_TYPE 等同样转发，避免以后再有人
 * 从 utils 取它们时踩同一个坑。</p>
 */
export { TASK_TO_TYPE, LOCAL_PROVIDER_IDS, PROVIDER_SOURCE_LABEL, taskHintForName, PROVIDER_TEMPLATES }

export interface ModelConfig {
  inputCapabilities: string[]
  outputCapabilities: string[]
  features: any[]
  contextWindow: number | null
  maxOutputTokens: number | null
  temperature: number | null
  topP: number | null
  frequencyPenalty: number | null
  /** 单次请求最多携带几张输入图片（null = 不限制） */
  imageInputCount: number | null
  /** 单次生成最多几张输出图片（null = 不限制） */
  imageOutputCount: number | null
  /** 是否支持参考图（图生图 / 参考图编辑） */
  imageReference: boolean
  customParameters: Record<string, any>
  vectorDimensions: number | null
  // TTS 语音合成
  ttsVoice: string
  ttsSpeed: number | null
  ttsFormat: string
  // Rerank 重排序
  rerankTopN: number | null
  rerankMaxLength: number | null
  // 图片识别（图像分类 / 目标检测）与检测类型
  cvMode: string
  cvConfidence: number | null
  /** 生成参数（仅 image / video 类型）：随模型走 capabilities[].generate 节点 */
  generate: ModelGenerateConfig
  /**
   * 思考强度档位（none/minimal/low/medium/high/max）：随模型走 capabilities[].thinking_efforts 节点。
   * 空数组视为「未配置」，前端按默认集合兜底；'default' 由会话层表示「不传」。
   */
  thinkingEfforts: string[]
  /**
   * 能力开关（Models.dev 回填 / 手动配置）：attachment / reasoning / tool_call / temperature / open_weights
   */
  capabilities: string[]
  [key: string]: any
}

/**
 * 模型级生成参数。
 *
 * <p>与后端 {@code GenerateConfigSupport} 一一对应，落库到
 * {@code capabilities[].generate}（复用已有 JSON 列，不新增数据库字段）。
 * 前端「图像生成」页据此渲染可选分辨率、张数上限、参考图入口。</p>
 */
export interface ModelGenerateConfig {
  /** 是否支持参考图（图生图 / 图生视频） */
  referenceImage: boolean
  /** 是否支持负面提示词 */
  negativePrompt: boolean
  /** 是否支持随机种子 */
  seed: boolean
  /** 单次生成张数上限 */
  maxCount: number
  /** 可用分辨率列表 */
  sizes: string[]
  /** 可用视频时长（秒），仅 video */
  durations: number[]
  stepsMin: number | null
  stepsMax: number | null
  stepsDefault: number | null
  /**
   * 是否支持 style 参数。
   *
   * 关闭时不展示风格入口、提交也不带 style —— 部分上游（如 Agnes）
   * 会直接拒绝该参数。
   */
  style: boolean
  /** 可用风格 key 列表；留空表示沿用前端内置默认风格表 */
  styles: string[]
}

/** 生成参数默认值：文生图基础档 */
export function createDefaultGenerateConfig(src: any = {}): ModelGenerateConfig {
  return {
    referenceImage: src.referenceImage ?? false,
    negativePrompt: src.negativePrompt ?? true,
    seed: src.seed ?? true,
    maxCount: src.maxCount ?? 1,
    sizes: Array.isArray(src.sizes) && src.sizes.length ? [...src.sizes] : ['1024x1024'],
    durations: Array.isArray(src.durations) ? [...src.durations] : [],
    stepsMin: src.stepsMin ?? null,
    stepsMax: src.stepsMax ?? null,
    stepsDefault: src.stepsDefault ?? null,
    style: src.style ?? true,
    styles: Array.isArray(src.styles) ? [...src.styles] : [],
  }
}

// 默认模型配置（新增 / 编辑 / 拉取预填统一使用）
export function createDefaultModelConfig(src: any = {}): ModelConfig {
  return {
    inputCapabilities: src.inputCapabilities || ['text'],
    outputCapabilities: src.outputCapabilities || ['text'],
    features: src.features || [],
    contextWindow: src.contextWindow ?? null,
    maxOutputTokens: src.maxOutputTokens ?? null,
    temperature: src.temperature ?? null,
    topP: src.topP ?? null,
    frequencyPenalty: src.frequencyPenalty ?? null,
    imageInputCount: src.image?.inputCount ?? src.imageInputCount ?? null,
    imageOutputCount: src.image?.outputCount ?? src.imageOutputCount ?? null,
    imageReference: src.image?.reference ?? src.imageReference ?? false,
    customParameters: src.customParameters || {},
    vectorDimensions: src.vectorDimensions ?? null,
    ttsVoice: src.ttsVoice || '',
    ttsSpeed: src.ttsSpeed ?? null,
    ttsFormat: src.ttsFormat || 'mp3',
    rerankTopN: src.rerankTopN ?? null,
    rerankMaxLength: src.rerankMaxLength ?? null,
    cvMode: src.cvMode || 'classify',
    cvConfidence: src.cvConfidence ?? null,
    generate: createDefaultGenerateConfig(src.generate),
    // 思考强度档位：默认 none/minimal/low/medium/high/max（用户可在模型管理里改；清空视为未配置，
    // 保存时仍会写成空数组，前端读取时再按默认集合兜底）
    thinkingEfforts: Array.isArray(src.thinkingEfforts) && src.thinkingEfforts.length
      ? [...src.thinkingEfforts]
      : ['none', 'minimal', 'low', 'medium', 'high', 'max'],
    // 能力开关：默认空，由 Models.dev 回填或手动勾选
    capabilities: Array.isArray(src.capabilities) ? [...src.capabilities] : [],
  }
}

// 解析后端 models 字段（可能是数组或 JSON 字符串）
function parseModels(raw: any): any[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw) {
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }
  return []
}

// 解析后端 api_keys 字段（数组或逗号/空格分隔字符串）
function parseApiKeys(raw: any): string[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw) {
    return raw.split(/[\s,]+/).filter(Boolean)
  }
  return []
}

// ===== 供应商品牌（logo）解析 =====
// 品牌映射统一维护在 providerIcons.ts，此处仅转发，避免多处重复定义。
import { resolveProviderBrand, PROTOCOL_IDS } from './providerIcons'

// 转发 resolveProviderBrand，供 ProviderFormDialog 等从 model.utils 导入
export { resolveProviderBrand }

// 从模型 capabilities 推断接入协议
function deriveProtocol(p: any, modelsArr: any[]): string {
  if (p.protocol) return p.protocol
  for (const m of modelsArr) {
    const caps = Array.isArray(m.capabilities) ? m.capabilities : []
    for (const c of caps) {
      const pr = typeof c === 'string' ? null : c?.protocol
      if (pr) return pr
    }
  }
  const plat = String(p.platform || '').toLowerCase()
  if (PROTOCOL_IDS.has(plat) && plat !== 'custom' && plat !== 'agent') return plat
  return 'openai'
}

// headers 对象 -> 文本（编辑回显，与 parseHeaders 互逆）
export function headersToText(headers: any): string {
  if (!headers || typeof headers !== 'object') return ''
  return Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
}

// 后端供应商对象 -> 前端供应商对象
export function mapProvider(p: any): any {
  const modelsArr = parseModels(p.models)
  const apiKeysArr = parseApiKeys(p.api_keys)
  // 品牌（用于匹配 logo），与接入协议解耦
  const brand = resolveProviderBrand({ ...p, models: modelsArr })
  // 扩展配置：后端把 load_strategy / custom_headers / auth_header / auth_prefix 都放在 extra 里
  const extra = (p.extra && typeof p.extra === 'object') ? p.extra : {}
  return {
    ...p,
    provider: brand,
    platform: brand,
    rawPlatform: p.platform,
    id: p.provider_id || p.id,
    // 页面里不少分支（路由组面板 / 能力页）按 providerId 取 ID，
    // 只给 id 会让这些分支的 v-if 永远不成立。
    providerId: p.provider_id || p.id,
    apiUrl: p.base_url || p.apiUrl,
    protocol: deriveProtocol(p, modelsArr),
    models: modelsArr,
    api_keys: apiKeysArr,
    apiKeyList: apiKeysArr,
    description: p.description || (modelsArr.length > 0 ? `${modelsArr.length} 个模型已配置` : ''),
    // ── 认证与扩展配置（编辑回显用；此前只透传了 ...p，这几项一直是空的）──
    authScheme: p.auth_scheme || 'api_key',
    authHeader: extra.auth_header || '',
    authPrefix: extra.auth_prefix || '',
    loadStrategy: extra.load_strategy || 'failover',
    // 后端存的是 extra.custom_headers，需反序列化成「键: 值」多行文本才能回显
    customHeaders: headersToText(extra.custom_headers),
  }
}

// 依据模型名推断规范类型（与系统配置 inferTypeByName 对齐）
function inferTypeByName(name: any): string {
  const l = String(name || '').toLowerCase()
  if (!l) return 'text'
  if (l.includes('embedding') || l.includes('embed') || l.includes('-bge-')) return 'embedding'
  if (l.includes('rerank')) return 'rerank'
  if (l.includes('tts') || l.includes('speech-synthesis') || l.includes('speech_synthesis')) return 'tts'
  if (l.includes('whisper') || l.includes('asr') || l.includes('speech-recognition')
    || l.includes('transcribe') || l.includes('transcription')) return 'asr'
  if (l.includes('detect') || l.includes('-det-') || l.includes('yolo')
    || l.includes('scrfd') || l.includes('nms')) return 'detection'
  if (l.includes('dall-e') || l.includes('image-gen') || l.includes('cogview') || l.includes('flux') || l.includes('image')) return 'image'
  if (l.includes('cogvideo') || l.includes('video-gen') || l.includes('video')) return 'video'
  return 'text'
}

// 附加特性任务（属于 features，不是主类型）
const FEATURE_TASKS = new Set(['thinking', 'web-search', 'tools', 'tool_calls'])

/**
 * 推导模型细分类型：优先 capabilities 里的 subtype，其次取行字段，最后按模型名兜底。
 *
 * <p>OCR/人脸组合管线需要用细分类型区分 detector、recognizer、corrector、
 * restore、anime 等模型槽位；细分类型随 capabilities[].subtype 保存。</p>
 */
export function inferSubType(m: any, modelType: string): string {
  const rawCaps = Array.isArray(m?.capabilities) ? m.capabilities : []
  for (const c of rawCaps) {
    const sub = typeof c === 'object' ? c?.subtype ?? c?.subType : undefined
    if (sub && String(sub).trim()) return String(sub).trim()
  }
  const direct = m?.subType ?? m?.subtype ?? m?.model_subtype ?? m?.modelSubType
  if (direct && String(direct).trim()) return String(direct).trim()

  const name = String(m?.model || m?.modelName || '').toLowerCase()
  if (!name) return ''
  if (modelType === 'ocr') {
    if (name.includes('检测') || name.includes('detect') || name.includes('dbnet') || name.includes('pse')) return 'ocr_detection'
    if (name.includes('校正') || name.includes('矫正') || name.includes('correct') || name.includes('macbert') || name.includes('csc') || name.includes('corrector')) return 'ocr_correction'
    if (name.includes('识别') || name.includes('recogn') || name.includes('svtr') || name.includes('crnn')) return 'ocr_recognition'
    if (name.includes('方向') || name.includes('旋转') || name.includes('direction') || name.includes('rotat') || name.includes('deskew')) return 'ocr_direction'
    if (name.includes('修复') || name.includes('超分') || name.includes('restor') || name.includes('super') || name.includes('upscale')) return 'ocr_restore'
    return ''
  }
  if (modelType === 'face') {
    if (name.includes('动漫') || name.includes('anime') || name.includes('cartoon')) return 'anime_face_detection'
    if (name.includes('检测') || name.includes('detect') || name.includes('scrfd')) return 'face_detection'
    if (name.includes('特征') || name.includes('feature') || name.includes('arcface') || name.includes('embedding')) return 'face_feature'
    if (name.includes('关键点') || name.includes('landmark') || name.includes('keypoint')) return 'face_landmark'
    if (name.includes('活体') || name.includes('liveness')) return 'face_liveness'
    if (name.includes('修复') || name.includes('增强') || name.includes('超分') || name.includes('restore') || name.includes('enhance') || name.includes('gan')) return 'face_restore'
    if (name.includes('属性') || name.includes('attribute')) return 'face_attribute'
    if (name.includes('表情') || name.includes('emotion')) return 'face_emotion'
    if (name.includes('换脸') || name.includes('deepfake')) return 'face_deepfake'
    if (name.includes('姿态') || name.includes('pose')) return 'face_pose'
    if (name.includes('识别') || name.includes('比对') || name.includes('搜索') || name.includes('recogn') || name.includes('verif')) return 'face_recognition'
    return ''
  }
  if (modelType === 'detection' || modelType === 'image_cv') {
    if (name.includes('缺陷') || name.includes('defect') || name.includes('flaw')) return 'defect_detection'
    if (name.includes('分类') || name.includes('classif') || name.includes('resnet') || name.includes('vit')) return 'image_classification'
    if (name.includes('检测') || name.includes('detect') || name.includes('yolo')) return 'object_detection'
    return ''
  }
  return ''
}

// 各类型的「输入种类 → 输出种类」
const FLOW_BY_TYPE: Record<string, [string, string]> = {
  text: ['text', 'text'],
  rerank: ['text', 'text'],
  embedding: ['text', 'vector'],
  image: ['text', 'image'],
  video: ['text', 'video'],
  image_cv: ['image', 'text'],
  detection: ['image', 'text'],
  ocr: ['image', 'text'],
  face: ['image', 'text'],
  layout: ['image', 'text'],
  asr: ['audio', 'text'],
  tts: ['text', 'audio'],
}

/** 宽松转字符串数组：非数组返回空数组，元素去空后取字符串 */
function listOf(v: any): string[] {
  return Array.isArray(v) ? v.filter(Boolean).map(String) : []
}

/**
 * 推导规范模型类型：优先 capabilities[].task，其次按模型名推断。
 *
 * @param m 后端模型行（或已 mapModel 的前端模型对象）
 * @returns 规范类型（text / embedding / image / asr …）
 */
export function inferModelType(m: any): string {
  const rawCaps = Array.isArray(m?.capabilities) ? m.capabilities : []
  for (const c of rawCaps) {
    const task = typeof c === 'string' ? c : c?.task
    if (task && TASK_TO_TYPE[task]) {
      return TASK_TO_TYPE[task]
    }
  }
  // 上游「从提供商获取」行没有 capabilities，只有 tasks / task；
  // 不读它们的话，拉取列表与预填表单里的模型类型会一律落成 text。
  for (const task of listOf(m?.tasks)) {
    const key = String(task || '').toLowerCase()
    if (TASK_TO_TYPE[key]) {
      return TASK_TO_TYPE[key]
    }
  }
  const singleTask = String(m?.task ?? m?.model_type ?? '').toLowerCase()
  if (TASK_TO_TYPE[singleTask]) {
    return TASK_TO_TYPE[singleTask]
  }
  return inferTypeByName(m?.model || m?.modelName)
}

/** 宽松布尔判定：兼容 boolean / 字符串 / 数字（上游元数据三种形态都有） */
function truthyFlag(v: unknown): boolean {
  return v === true || v === 'true' || v === 1 || v === '1'
}

/**
 * 上游模态 → 规范输入/输出种类。
 *
 * <p>上游 {@code /models} 常见三种写法：{@code modalities{input,output}}、
 * {@code architecture.input_modalities}、{@code input_modalities[]}。
 * 后端已归一成 {@code modalities}，这里做最后一道白名单过滤。</p>
 */
function fetchModalities(m: any): { input: string[]; output: string[] } {
  const known = new Set(['text', 'image', 'audio', 'video', 'file', 'vector'])
  const rename: Record<string, string> = { embedding: 'vector', embeddings: 'vector' }
  const normalize = (v: any): string[] => {
    const out: string[] = []
    for (const item of listOf(v)) {
      const key = rename[String(item).toLowerCase()] || String(item).toLowerCase()
      if (known.has(key) && !out.includes(key)) out.push(key)
    }
    return out
  }
  const mod = m?.modalities ?? m?.metrics?.modalities
  return {
    input: normalize(mod?.input ?? m?.input_modalities ?? m?.metrics?.input_modalities),
    output: normalize(mod?.output ?? m?.output_modalities ?? m?.metrics?.output_modalities),
  }
}

/**
 * 由上游拉取行推导模型表单配置（输入输出能力、特性、窗口、采样参数、能力开关）。
 *
 * <p>「从提供商获取」的行是扁平的上游行（{@code context_window} / {@code modalities} /
 * {@code attachment} …），既没有 {@code config} 也没有 {@code capabilities[].traits}。
 * 不给它做这层映射，用户选中后表单里的输入/输出能力与其它参数全是空的。</p>
 *
 * @param m         上游模型行
 * @param modelType 规范类型，缺省按 {@link inferModelType} 推导
 * @returns 可直接传给 {@code createDefaultModelConfig} 的配置片段
 */
export function deriveFetchedModelConfig(m: any, modelType?: string): Partial<ModelConfig> {
  const type = modelType || inferModelType(m)
  const [flowIn, flowOut] = FLOW_BY_TYPE[type] || ['text', 'text']
  const mod = fetchModalities(m)
  const metrics = m?.metrics && typeof m.metrics === 'object' ? m.metrics : {}
  const num = (v: any): number | null => {
    if (v === null || v === undefined || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  const features: string[] = []
  // 前端复选框的键是 tools / thinking（与 model.constants 的 FEATURE_TASKS 一致），
  // 这里若写 tool_call / tools 两套口径，表单里会「勾了不显示」。
  if (truthyFlag(m?.reasoning ?? metrics.reasoning)) features.push('thinking')
  if (truthyFlag(m?.tool_call ?? metrics.function_calling)) features.push('tools')
  if (truthyFlag(metrics.web_search ?? m?.web_search)) features.push('web-search')
  const capabilities: string[] = []
  if (truthyFlag(m?.attachment ?? metrics.attachment)) capabilities.push('attachment')
  if (truthyFlag(m?.reasoning ?? metrics.reasoning)) capabilities.push('reasoning')
  if (truthyFlag(m?.tool_call ?? metrics.function_calling)) capabilities.push('tool_call')
  if (truthyFlag(m?.temperature_supported ?? metrics.temperature)) capabilities.push('temperature')
  if (truthyFlag(m?.open_weights ?? metrics.open_weights)) capabilities.push('open_weights')
  return {
    inputCapabilities: mod.input.length ? mod.input : [flowIn],
    outputCapabilities: mod.output.length ? mod.output : [flowOut],
    features,
    contextWindow: num(m?.context_window ?? m?.contextWindow ?? metrics.context_window_tokens),
    maxOutputTokens: num(m?.max_tokens ?? m?.maxTokens ?? metrics.max_output_tokens),
    temperature: num(m?.temperature ?? metrics.temperature),
    topP: num(m?.top_p ?? m?.topP),
    frequencyPenalty: num(m?.frequency_penalty ?? m?.frequencyPenalty),
    capabilities,
  }
}

/** 模型价格（USD / 百万 token）；{@code known=false} 表示上游未给价格 */
export interface ModelPrice {
  known: boolean
  free: boolean
  input: number | null
  output: number | null
}

/**
 * 读取模型价格，并识别「免费」（输入输出均为 0）。
 *
 * @param m 后端模型行或上游拉取行（价格可能在顶层或 metrics 里）
 * @returns 价格信息
 */
export function modelPriceOf(m: any): ModelPrice {
  const read = (v: any): number | null => {
    if (v === null || v === undefined || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  const input = read(m?.price_input_per_musd ?? m?.metrics?.price_input_per_musd)
  const output = read(m?.price_output_per_musd ?? m?.metrics?.price_output_per_musd)
  const known = input != null || output != null
  return {
    known,
    // 只有输入价与输出价都明确为 0 才能标免费；缺一边是价格不完整，不能误报免费。
    free: input === 0 && output === 0,
    input,
    output,
  }
}

/**
 * 行内描述：弹窗「从供应商获取模型」每行模型名下的一行小字，说明模型作用。
 *
 * <p>优先级：后端 description（ONNX 本地行有「ONNX 本地模型 · OCR 识别」这类
 * 真实描述）> 按 capabilities.task 推的类型说明 > 空。</p>
 *
 * @param m 上游条目（已 map 的行也可，读 modelName/model/description/task）
 * @returns 描述文本；无可用信息时返回空串
 */
export function describeFetchRow(m: any): string {
  const direct = String(m?.description ?? '').trim()
  if (direct) return direct
  const rawCaps = Array.isArray(m?.capabilities) ? m.capabilities : []
  const tasks: string[] = []
  for (const c of rawCaps) {
    const t = typeof c === 'string' ? c : c?.task
    if (t && typeof t === 'string' && !tasks.includes(t)) tasks.push(t)
  }
  const t0 = String(m?.task ?? '').trim()
  if (t0 && !tasks.includes(t0)) tasks.unshift(t0)
  const ups = Array.isArray(m?.tasks) ? m.tasks.filter((t: any) => typeof t === 'string') : []
  for (const t of ups) {
    if (!tasks.includes(t)) tasks.push(t)
  }
  if (!tasks.length) return ''
  const names = tasks.map((t) => TASK_TO_TYPE[t] || t)
  return names.join(' / ')
}

/**
 * 行内来源徽标：区分本地推理与云 API。
 *
 * <p>判定只看供应商标识（onnx / ollama 即本地），不看模型行 —— 上游 /models
 * 与本地门面都不返回来源语义，行里没有可靠依据。</p>
 *
 * @param providerId 当前供应商标识
 * @returns { label, kind }；label 供显示，kind 供样式（local/cloud）
 */
export function sourceBadgeFor(providerId: any): { label: string; kind: 'local' | 'cloud' } {
  const id = String(providerId || '').toLowerCase()
  if (LOCAL_PROVIDER_IDS.has(id)) {
    return { label: PROVIDER_SOURCE_LABEL.local, kind: 'local' }
  }
  return { label: PROVIDER_SOURCE_LABEL.cloud, kind: 'cloud' }
}

/** 模型的「模态」（输入/输出种类）与「能力」（附加特性） */
export interface ModelTraits {
  /** 输入种类：text / image / audio / video / vector / file */
  inputCapabilities: string[]
  /** 输出种类：同输入种类 */
  outputCapabilities: string[]
  /** 附加特性：tools / thinking / web-search */
  features: string[]
}

/**
 * 派生模型的「模态」与「能力」，供模型管理卡片与模型选择器悬停卡共用。
 *
 * <p>输入/输出种类保存时编码在 {@code capabilities[].traits}（{@code input:image} /
 * {@code output:image}），读回来优先用它；历史数据没有 traits 时才按模型类型
 * 推导的默认流兜底。已映射过的前端模型（走 {@link mapModel}，带 config）直接读
 * config，避免二次推导。</p>
 *
 * @param m 后端模型行（或已 mapModel 的前端模型对象）
 * @param modelType 规范模型类型，缺省时按 {@link inferModelType} 推导
 * @returns 模态与能力列表
 */
export function deriveModelTraits(m: any, modelType?: string): ModelTraits {
  const cfg = m?.config && typeof m.config === 'object' ? m.config : {}
  const type = modelType || m?.modelType || inferModelType(m)
  const rawCaps = Array.isArray(m?.capabilities) ? m.capabilities : []

  const configuredFeatures = listOf(cfg.features)
  const features = configuredFeatures.length
    ? configuredFeatures
    : rawCaps
      .map((c: any) => (typeof c === 'string' ? c : c?.task))
      .filter((t: any) => typeof t === 'string' && FEATURE_TASKS.has(t))
      .map((t: string) => (t === 'tool_calls' ? 'tools' : t))

  const [inKind, outKind] = FLOW_BY_TYPE[type] || ['text', 'text']
  const allTraits = rawCaps.flatMap((c: any) => (Array.isArray(c?.traits) ? c.traits : []))
  const pickKind = (prefix: string): string[] =>
    allTraits
      .filter((t: any) => typeof t === 'string' && t.startsWith(prefix))
      .map((t: string) => t.slice(prefix.length))
      .filter(Boolean)

  const resolveKinds = (configured: any, prefix: string, fallback: string): string[] => {
    const list = listOf(configured)
    if (list.length) {
      return list
    }
    const fromTraits = pickKind(prefix)
    return fromTraits.length ? fromTraits : [fallback]
  }

  return {
    inputCapabilities: resolveKinds(cfg.inputCapabilities, 'input:', inKind),
    outputCapabilities: resolveKinds(cfg.outputCapabilities, 'output:', outKind),
    features,
  }
}

// 后端模型对象 -> 前端模型对象
export function mapModel(m: any, providerId: string): any {
  const modelType = inferModelType(m)
  const subType = inferSubType(m, modelType)
  const traits = deriveModelTraits(m, modelType)
  // 后端模型行**自带 id**（如 "agnes:agnes-2.0-flash"）⇒ 该行来自 sys_ai_provider_model，
  // 启停/删除/收藏这几个 {compositeId} 端点都能解析到它。
  // 不带 id（实测内置 Agent 供应商的 agent-fixture-zip，行里只有 model+provider_id）
  // ⇒ 不在那张表里，就算按契约拼出 providerId:modelName 也会回
  //   404「模型不存在: agent-fixture-zip」—— 开关就成了**点了必失败**的按钮。
  // 这里把该事实透出给模板：没有原生 id 就禁用开关，别让用户去点一个注定失败的控件。
  // （与 ModelsProviderDetail 的 canDelete 同属一类问题，见那里的注释。）
  const hasNativeId = !!(m.id || m.model_id)
  return {
    ...m,
    providerId,
    hasNativeId,
    // ★ 复合 id 必须恒为 providerId:modelName（AiModelController.toggleActive 契约，
    //   其 @PathVariable("compositeId") 校验 separator>0 && separator<len-1）。
    //   此前兜底写的是 `m.model`（裸模型名，无冒号）：后端 /api/providers 返回的模型行
    //   偶尔不带 id/model_id，于是 PUT /v2/models/agent-fixture-zip/toggle-active
    //   直接 400 INVALID_PARAM，delete/update/favorite 四个端点同样全废。
    //   改用 provider_id:model 兜底后与后端合成 id（27/28 行均为该形态）以及
    //   DefaultModelSettings/TavernPage 的自建 id 完全一致；provider_id 缺时回退 providerId。
    id: m.id || m.model_id || (m.model ? `${m.provider_id || providerId}:${m.model}` : undefined),
    name: m.name || m.model,
    model: m.model,
    modelName: m.model,
    modelType,
    subType,
    modelSubType: subType,
    isActive: m.enabled !== false,
    config: {
      inputCapabilities: traits.inputCapabilities,
      outputCapabilities: traits.outputCapabilities,
      features: traits.features,
      modelSubType: subType,
      // 手填值（后端 sys_ai_provider_model 同名列）；null 表示未指定，
      // 模型卡片会回退到指标表 sys_ai_model_metrics 的官方值
      contextWindow: m.context_window ?? m.contextWindow ?? null,
      maxOutputTokens: m.max_tokens ?? m.maxTokens ?? null,
      temperature: m.temperature ?? null,
      topP: m.top_p ?? m.topP ?? null,
      frequencyPenalty: m.frequency_penalty ?? m.frequencyPenalty ?? null,
      // 能力开关：优先实体列（attachment/reasoning/tool_call/temperature_supported/open_weights），
      // 缺省回退 metrics JSON 里的布尔键
      capabilities: deriveCapabilitySwitches(m),
      // 模型信息回填（实体列 + metrics 双存，编辑弹窗只读展示）
      family: m.family ?? m.metrics?.model_family ?? null,
      knowledge: m.knowledge ?? m.metrics?.knowledge_cutoff ?? null,
      releaseDate: m.release_date ?? m.releaseDate ?? m.metrics?.release_date ?? null,
      lastUpdated: m.last_updated ?? m.lastUpdated ?? m.metrics?.last_updated ?? null,
      modalities: m.modalities ?? m.metrics?.modalities ?? null,
      openWeights: m.open_weights ?? m.openWeights ?? m.metrics?.open_weights ?? null,
    },
  }
}

/** 能力开关可选项（与 ModelFormDialog 的开关组一致） */
const CAPABILITY_SWITCH_KEYS = ['attachment', 'reasoning', 'tool_call', 'temperature', 'open_weights'] as const

/**
 * 从模型行推导能力开关集合。
 *
 * <p>实体列（attachment / reasoning / tool_call / temperature_supported / open_weights）
 * 为布尔；旧数据没有实体列时，回退到 metrics JSON 里的布尔键（attachment /
 * reasoning / function_calling / temperature / open_weights）。</p>
 *
 * @param m 后端模型行
 * @returns 开启的能力开关数组
 */
export function deriveCapabilitySwitches(m: any): string[] {
  const flags: string[] = []
  const pick = (truthy: unknown): boolean => truthy === true || truthy === 'true' || truthy === 1 || truthy === '1'
  if (pick(m?.attachment ?? m?.metrics?.attachment)) flags.push('attachment')
  if (pick(m?.reasoning ?? m?.metrics?.reasoning ?? m?.metrics?.reasoning_model)) flags.push('reasoning')
  if (pick(m?.tool_call ?? m?.toolCall ?? m?.metrics?.function_calling ?? m?.metrics?.tool_call)) flags.push('tool_call')
  if (pick(m?.temperature_supported ?? m?.temperatureSupported ?? m?.metrics?.temperature)) flags.push('temperature')
  if (pick(m?.open_weights ?? m?.openWeights ?? m?.metrics?.open_weights)) flags.push('open_weights')
  return flags
}

// 解析 headers 文本为对象
export function parseHeaders(text: string): Record<string, string> {
  const headers: Record<string, string> = {}
  const lines = (text || '').trim().split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue
    const key = trimmed.substring(0, colonIndex).trim()
    const value = trimmed.substring(colonIndex + 1).trim()
    if (key) headers[key] = value
  }
  return headers
}

// 校验 headers 格式，返回错误信息数组
export function validateHeadersText(
  text: string,
  t: (key: string, params?: Record<string, any>) => string,
): string[] {
  const errors: string[] = []
  const lines = (text || '').trim().split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) {
      errors.push(t('settings.models.headerFormatError', { line: i + 1 }))
    } else {
      const key = line.substring(0, colonIndex).trim()
      if (!key) errors.push(t('settings.models.headerNameEmpty', { line: i + 1 }))
    }
  }
  return errors
}
