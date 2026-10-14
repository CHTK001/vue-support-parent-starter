// 模型管理：常量定义（供应商模板 / Key 策略 / 模型类型）
import {
  TextT24Regular,
  Group24Regular,
  DocumentText24Regular,
  PersonCircle24Regular,
  Grid24Regular,
  Image24Regular,
  Video24Regular,
  Mic24Regular,
  Speaker224Regular,
  ArrowSortDown24Regular,
  Scan24Regular,
} from '@vicons/fluent'

export interface KeyStrategy {
  name: string
  display_name: string
  description: string
}

// 多 Key 负载均衡策略
export const KEY_STRATEGIES: KeyStrategy[] = [
  { name: 'failover', display_name: '故障转移（优先使用第一个可用Key）', description: '按序取第一个可用Key，失败后自动切换到下一个' },
  { name: 'round_robin', display_name: '轮询（依次使用所有Key）', description: '依次使用所有Key，实现负载均衡' },
  { name: 'weighted', display_name: '权重（按权重分配Key）', description: '按权重分配Key，权重越高被选中的概率越大' },
  { name: 'latency', display_name: '延迟（按响应速度分配）', description: '优先选择响应速度快的Key' },
  { name: 'cost', display_name: '成本（按成本最低分配）', description: '优先选择成本最低的Key' },
  { name: 'hybrid', display_name: '混合（综合延迟和成本）', description: '综合考虑延迟和成本，智能分配Key' },
]

// 认证方式：决定出站请求如何携带 API Key
//
// 落库契约（后端 ApiProviderController 收/回传，ModelClientResolver 消费）：
//   auth_scheme       —— 只取 api_key / bearer / oauth / none 四值，保持向后兼容
//   extra.auth_header —— 覆盖认证头名称；留空则用标准的 Authorization
//   extra.auth_prefix —— 值前缀；留空则不加前缀
// 后端解析顺序：none → 不发认证头；auth_header 非空 → 发 <auth_header>: <prefix><key>；
//              否则 → 发 Authorization: Bearer <key>
export interface AuthSchemeOption {
  /** 表单内部值（纯 UI 概念，不落库） */
  value: string
  /** 下拉显示名 */
  label: string
  /** 落库的 auth_scheme */
  authScheme: string
  /** 落库的 extra.auth_header（空串 = 不覆盖，走 Authorization） */
  authHeader: string
  /** 落库的 extra.auth_prefix */
  authPrefix: string
  /** 说明文案 */
  description: string
}

export const AUTH_SCHEMES: AuthSchemeOption[] = [
  {
    value: 'bearer',
    label: 'Authorization: Bearer',
    authScheme: 'api_key',
    authHeader: '',
    authPrefix: '',
    description: '标准 OpenAI 兼容鉴权，发送 Authorization: Bearer <key>',
  },
  {
    value: 'api_key_header',
    label: 'api-key 请求头',
    authScheme: 'api_key',
    authHeader: 'api-key',
    authPrefix: '',
    description: '非标准鉴权（如 Dots Studio），发送 api-key: <key>',
  },
  {
    value: 'none',
    label: '无认证',
    authScheme: 'none',
    authHeader: '',
    authPrefix: '',
    description: '本地模型或内网免鉴权服务，不发送认证头',
  },
  {
    value: 'custom',
    label: '自定义请求头',
    authScheme: 'api_key',
    authHeader: '',
    authPrefix: '',
    description: '自行指定请求头名称与值前缀',
  },
]

/** 默认认证方式（无匹配时回退到标准 Bearer） */
export const DEFAULT_AUTH_SCHEME = 'bearer'

/**
 * 由落库字段反推表单内部认证方式，供编辑回显。
 *
 * @param authScheme 后端 auth_scheme
 * @param authHeader 后端 extra.auth_header
 * @param authPrefix 后端 extra.auth_prefix
 * @returns AUTH_SCHEMES 中的 value
 */
export function deriveAuthMode(
  authScheme?: string | null,
  authHeader?: string | null,
  authPrefix?: string | null,
): string {
  if ((authScheme || '').toLowerCase() === 'none') return 'none'
  const header = (authHeader || '').trim()
  if (!header) return 'bearer'
  if (header.toLowerCase() === 'api-key' && !(authPrefix || '').trim()) return 'api_key_header'
  return 'custom'
}

// 供应商模板
// 模型来源徽标：
//   - 本地（ONNX / Ollama）：本地推理，无需外发请求
//   - 云 API：走供应商 base_url 的远端模型
export const LOCAL_PROVIDER_IDS = new Set(['onnx', 'ollama'])
export const PROVIDER_SOURCE_LABEL: Record<string, string> = {
  local: '本地',
  cloud: '云 API',
}
export interface ProviderTemplate {
  id: string
  name: string
  description: string
  protocol: string
  defaultApiUrl?: string
  defaultUrl?: string
  apiKeyUrl?: string
  /** 模板库搜索关键字（英文/拼音/常见别名） */
  keywords?: string[]
  /** 该供应商要求的认证方式（表单内部值，见 AUTH_SCHEMES） */
  defaultAuthMode?: string
  /** 自定义认证头名称（defaultAuthMode='custom' 时生效） */
  defaultAuthHeader?: string
  /** 认证值前缀（defaultAuthMode='custom' 时生效） */
  defaultAuthPrefix?: string
}

export const PROVIDER_TEMPLATES: ProviderTemplate[] = [
  // ===== 国际主流 =====
  { id: 'openai', name: 'OpenAI', description: 'GPT 系列模型官方 API', protocol: 'openai', defaultApiUrl: 'https://api.openai.com/v1', keywords: ['gpt', 'o1', 'o3', 'chatgpt'] },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude 系列模型官方 API', protocol: 'anthropic', defaultApiUrl: 'https://api.anthropic.com/v1', keywords: ['claude'] },
  { id: 'google', name: 'Google Gemini', description: 'Google Gemini 模型，需代理', protocol: 'gemini', defaultApiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', keywords: ['google', 'gemini', 'imagen'] },
  { id: 'xai', name: 'xAI', description: 'Grok 系列模型官方 API', protocol: 'openai', defaultApiUrl: 'https://api.x.ai/v1', keywords: ['grok', 'elon'] },
  { id: 'mistral', name: 'Mistral', description: 'Mistral 大模型官方 API', protocol: 'openai', defaultApiUrl: 'https://api.mistral.ai/v1', keywords: ['mistral-large', 'codestral', 'le-chat'] },
  { id: 'google', name: 'Google AI Studio', description: 'Gemini 免费额度（Google AI Studio）', protocol: 'gemini', defaultApiUrl: 'https://generativelanguage.googleapis.com/v1beta', keywords: ['ai-studio'] },
  { id: 'groq', name: 'Groq', description: 'Groq 超高速推理 API（LPU 芯片）', protocol: 'openai', defaultApiUrl: 'https://api.groq.com/openai/v1', keywords: ['llama'] },
  { id: 'together', name: 'Together AI', description: '开源模型推理托管平台', protocol: 'openai', defaultApiUrl: 'https://api.together.ai/v1', keywords: ['deepinfra'] },
  { id: 'cerebras', name: 'Cerebras', description: 'Cerebras 超低延迟推理 API', protocol: 'openai', defaultApiUrl: 'https://api.cerebras.ai/v1', keywords: ['llama'] },
  { id: 'cohere', name: 'Cohere', description: '企业级模型与 RAG 平台', protocol: 'openai', defaultApiUrl: 'https://api.cohere.ai/v2', keywords: ['embed', 'rerank'] },
  { id: 'perplexity', name: 'Perplexity', description: '在线搜索增强对话 API', protocol: 'openai', defaultApiUrl: 'https://api.perplexity.ai', keywords: ['sonar', 'search'] },
  { id: 'huggingface', name: 'Hugging Face Inference', description: 'Hugging Face 推理端点', protocol: 'openai', defaultApiUrl: 'https://api-inference.huggingface.co/models', keywords: ['hf', 'inference'] },
  { id: 'nvidia', name: 'NVIDIA NIM', description: '英伟达 AI 推理平台，免费使用多种模型', protocol: 'openai', defaultApiUrl: 'https://integrate.api.nvidia.com/v1', keywords: ['nime', 'nemotron'] },

  // ===== 聚合 / 路由 =====
  { id: 'openrouter', name: 'OpenRouter', description: '聚合 API，支持数百个模型', protocol: 'openai', defaultApiUrl: 'https://openrouter.ai/api/v1', keywords: ['router'] },
  { id: 'commandcode', name: 'commandcode', description: '聚合 API，支持数百个模型', protocol: 'openai', defaultApiUrl: 'https://api.commandcode.ai/provider/v1', keywords: ['router'] },
  { id: 'agnes', name: 'Agnes AI', description: '聚合 API，免费使用多种模型', protocol: 'openai', defaultApiUrl: 'https://apihub.agnes-ai.cn/v1', keywords: ['apihub'] },
  { id: 'opencode', name: 'OpenCode', description: '免费开源 API，支持多种模型', protocol: 'openai', defaultApiUrl: 'https://opencode.ai/zen/v1', keywords: ['zen'] },
  { id: 'siliconflow', name: 'SiliconFlow 硅基流动', description: '国内 AI 模型平台，支持 DeepSeek、Qwen 等', protocol: 'openai', defaultApiUrl: 'https://api.siliconflow.cn/v1', keywords: ['jiguang', 'silicon'] },
  { id: 'bai', name: 'b.ai', description: '免费 AI 模型平台，支持 DeepSeek 等', protocol: 'openai', defaultApiUrl: 'https://api.b.ai/v1', keywords: [] },
  { id: 'ai302', name: 'AI302', description: 'AI302.com 聚合 API', protocol: 'openai', defaultApiUrl: 'https://api.ai302.com/v1', keywords: ['302'] },

  // ===== 国内大模型 =====
  { id: 'deepseek', name: 'DeepSeek', description: '深度求索大模型官方 API', protocol: 'openai', defaultApiUrl: 'https://api.deepseek.com/v1', keywords: ['r1', 'v3', 'seek'] },
  { id: 'qwen', name: '通义千问', description: '阿里通义千问大模型（百炼平台）', protocol: 'openai', defaultApiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', keywords: ['tongyi', 'dashscope', 'bailian', 'aliyun', 'qianwen', 'qianwen'] },
  { id: 'zhipu', name: '智谱 AI', description: '智谱 GLM 系列模型', protocol: 'openai', defaultApiUrl: 'https://open.bigmodel.cn/api/paas/v4', keywords: ['glm', 'chatglm', 'bigmodel', 'bigmodel'] },
  { id: 'moonshot', name: 'Moonshot', description: '月之暗面 Kimi 模型', protocol: 'openai', defaultApiUrl: 'https://api.moonshot.cn/v1', keywords: ['kimi', 'moonshot', 'darkside'] },
  { id: 'minimax', name: 'MiniMax', description: 'MiniMax 海螺 AI 模型', protocol: 'openai', defaultApiUrl: 'https://api.minimaxi.chat/v1', keywords: ['hailuo', 'minimaxi'] },
  { id: 'baichuan', name: '百川', description: '百川智能大模型', protocol: 'openai', defaultApiUrl: 'https://api.baichuan-ai.com/v1', keywords: ['baichuan', 'bc'] },
  { id: 'baichuan', name: '百川（国际）', description: '百川国际站大模型', protocol: 'openai', defaultApiUrl: 'https://api.baichuan-intl.com/v1', keywords: [] },
  { id: 'stepfun', name: '阶跃星辰', description: '阶跃星辰 Step 系列模型', protocol: 'openai', defaultApiUrl: 'https://api.stepfun.com/v1', keywords: ['step2', 'steplinear'] },
  { id: 'qianfan', name: '百度千帆', description: '百度智能云大模型平台', protocol: 'openai', defaultApiUrl: 'https://qianfan.baidubce.com/v2', keywords: ['ernie', '文心', 'wenxin', 'baidu'] },
  { id: 'baidu', name: '百度智能云', description: '百度智能云文心/千帆模型', protocol: 'openai', defaultApiUrl: 'https://qianfan.baidubce.com/v2', keywords: ['ernie', 'wenxin', 'baidu'] },
  { id: 'sensenova', name: 'SenseNova 商汤', description: '商汤科技大模型平台', protocol: 'openai', defaultApiUrl: 'https://token.sensenova.cn/v1', keywords: ['sensenova', 'sensetime'] },
  { id: 'volcengine', name: '火山引擎', description: '字节跳动豆包 Doubao 模型', protocol: 'openai', defaultApiUrl: 'https://ark.cn-beijing.volces.com/api/v3', keywords: ['doubao', 'ark', '豆包'] },
  { id: 'volcengine', name: '火山方舟', description: '火山方舟大模型服务平台（豆包）', protocol: 'openai', defaultApiUrl: 'https://ark.cn-beijing.volces.com/api/v3', keywords: ['doubao', '豆包', 'ep-'] },
  { id: 'spark', name: '讯飞星火', description: '科大讯飞星火大模型', protocol: 'openai', defaultApiUrl: 'https://spark-api.cn-huabei-1.xf-yun.com/v1', keywords: ['spark', 'xfyun', '讯飞'] },
  { id: 'flytek', name: '科大讯飞', description: '讯飞开放平台星火系列', protocol: 'openai', defaultApiUrl: 'https://spark-api.cn-huabei-1.xf-yun.com/v1', keywords: ['spark', 'xfyun'] },
  { id: 'baidu-wenxin', name: '文心一言', description: '百度文心一言大模型', protocol: 'openai', defaultApiUrl: 'https://qianfan.baidubce.com/v2', keywords: ['wenxin', 'ernie', 'baidu'] },
  { id: 'tencent', name: '腾讯混元', description: '腾讯混元大模型（Cloud API）', protocol: 'openai', defaultApiUrl: 'https://api.hunyuan.cloud.tencent.com/v1', keywords: ['hunyuan', '腾讯'] },
  { id: 'hunyuan', name: '腾讯混元', description: '腾讯混元 Hunyuan 大模型', protocol: 'openai', defaultApiUrl: 'https://api.hunyuan.cloud.tencent.com/v1', keywords: ['hunyuan'] },
  { id: 'modelscope', name: '魔搭 ModelScope', description: '阿里达摩院模型社区，免费使用多种开源模型', protocol: 'openai', defaultApiUrl: 'https://api-inference.modelscope.cn/v1', keywords: ['damo', '魔搭'] },
  { id: '360ai', name: '360 智脑', description: '360 安全智脑大模型', protocol: 'openai', defaultApiUrl: 'https://api.360.cn/v1', keywords: ['360', 'zhibo'] },
  { id: 'doubao', name: '豆包', description: '字节跳动豆包大模型（火山引擎）', protocol: 'openai', defaultApiUrl: 'https://ark.cn-beijing.volces.com/api/v3', keywords: ['doubao', '豆包', 'volcengine'] },

  // ===== 云厂商 =====
  { id: 'azure', name: 'Azure OpenAI', description: '微软 Azure OpenAI 服务', protocol: 'openai', defaultApiUrl: 'https://YOUR-RESOURCE.openai.azure.com/openai/v1', keywords: ['microsoft', 'azure-openai'] },
  { id: 'aws-bedrock', name: 'AWS Bedrock', description: '亚马逊 Bedrock 模型平台', protocol: 'openai', defaultApiUrl: 'https://bedrock-runtime.us-east-1.amazonaws.com', keywords: ['amazon', 'amazon', 'claude'] },

  // ===== 本地推理 =====
  { id: 'ollama', name: 'Ollama', description: '本地 Ollama 模型', protocol: 'openai', defaultApiUrl: 'http://localhost:11434/v1', keywords: ['llama', 'qwen2.5'] },
  // 注意：ONNX 不提供 HTTP 模板。后端始终注入 id='onnx' 的虚拟提供者（模型来自
  // ModelRegistry），通过「绑定外部目录」选择服务器本地模型目录加载，不使用 API 地址/API Key。

  // ===== NewAPI =====
  { id: 'newapi', name: 'NewAPI', description: '国产 API 聚合平台，支持 GPT、Claude、DeepSeek 等数十个模型', protocol: 'openai', defaultApiUrl: 'https://newapi.io', keywords: ['newapi', 'newapi.io', 'apihub'] },

  // ===== 自定义 =====
  // ===== 小红书 / Dots Studio =====
  // Dots Studio 只认 api-key 请求头，不认标准的 Authorization: Bearer
  { id: 'dots', name: 'Dots Studio', description: '小红书 Dots Studio 点点大模型', protocol: 'openai', defaultApiUrl: 'https://note3-prev-api.askdiandian.com/v1', keywords: ['dots', '点点', 'rednote'], defaultAuthMode: 'api_key_header' },

  // ===== 自定义 =====
  { id: 'custom', name: '自定义供应商', description: '自定义 OpenAI 兼容协议的供应商', protocol: 'openai', defaultApiUrl: '', keywords: ['custom'] },
]

// logo 由 ProviderLogo 组件统一处理：优先 .png，失败回退 .svg，均失败走 CardAvatar 首字母。
// 此处不再维护任何 logo 映射配置。

// 模型类型选项（与系统配置「默认模型」选择器的类型体系保持一致）
// 注意：检测已是明确的规范类型，表单/保存/回显三处会同步；识别/矫正仍只在行内提示层，
// 不新增 capability.task，避免影响已有分组。
export const MODEL_TYPE_OPTIONS = [
  { value: 'text', label: '对话', icon: TextT24Regular },
  { value: 'embedding', label: '嵌入', icon: Group24Regular },
  { value: 'rerank', label: '重排序', icon: ArrowSortDown24Regular },
  { value: 'image', label: '文生图', icon: Image24Regular },
  { value: 'video', label: '文生视频', icon: Video24Regular },
  { value: 'image_cv', label: '图片识别', icon: Scan24Regular },
  { value: 'detection', label: '检测', icon: Scan24Regular },
  { value: 'ocr', label: 'OCR识别', icon: DocumentText24Regular },
  { value: 'face', label: '人脸识别', icon: PersonCircle24Regular },
  { value: 'layout', label: '布局识别', icon: Grid24Regular },
  { value: 'asr', label: '语音识别', icon: Mic24Regular },
  { value: 'tts', label: '语音合成', icon: Speaker224Regular },
]

// 规范类型 → 后端 capability.task（保存模型时写入 capabilities）
export const TYPE_TO_TASK: Record<string, string> = {
  text: 'chat',
  embedding: 'embedding',
  rerank: 'rerank',
  image: 'image_generation',
  video: 'video_generation',
  image_cv: 'image_cv',
  detection: 'detection',
  ocr: 'ocr',
  face: 'face_recognition',
  layout: 'layout',
  asr: 'speech_recognition',
  tts: 'speech_synthesis',
}

/**
 * 行内三态提示：模型名里带这些关键词时，在弹窗行内直接标出它的管线角色。
 *
 * <p>为什么是关键词匹配而不是类型：上游 /models 与本体都可能不返回这层语义，
 * 识别/矫正两个 task 会造成分组分叉，检测虽已是规范类型，行内提示仍保留，
 * 用于覆盖没有 capabilities 的本地目录行。</p>
 *
 * @param name 模型名
 * @returns 提示文本；无命中时返回空串
 */
export function taskHintForName(name: any): string {
  const l = String(name || '').toLowerCase()
  if (!l) return ''
  // 矫正：先判，macbert 里没有 det/rec 字样不会误伤，下面可放心
  if (l.includes('orientation') || l.includes('direction')
    || l.includes('rotat') || l.includes('deskew') || l.includes('dewarp')
    || l.includes('macbert') || l.includes('csc') || l.includes('corrector')
    || l.includes('text-bsr') || l.includes('restor')) return '矫正'
  if (l.includes('det') || l.includes('detect') || l.includes('localiz')) return '检测'
  if (l.includes('rec') || l.includes('recogn') || l.includes('extract')
    || l.includes('svtr')) return '识别'
  return ''
}

// 后端 capability.task → 规范类型（读取模型时从 capabilities 推导），与系统配置对齐
export const TASK_TO_TYPE: Record<string, string> = {
  chat: 'text',
  text_generation: 'text',
  realtime_conversation: 'text',
  embedding: 'embedding',
  rerank: 'rerank',
  speech_recognition: 'asr',
  asr: 'asr',
  speech_synthesis: 'tts',
  tts: 'tts',
  image_generation: 'image',
  'text-to-image': 'image',
  image: 'image',
  video_generation: 'video',
  'text-to-video': 'video',
  video: 'video',
  image_cv: 'image_cv',
  detection: 'detection',
  detect: 'detection',
  object_detection: 'detection',
  ocr: 'ocr',
  ocr_recognition: 'ocr',
  face: 'face',
  face_recognition: 'face',
  layout: 'layout',
}

/**
 * 模型细分类型：同一个规范类型下不同管线角色使用。
 *
 * <p>OCR/人脸都是组合管线，只标「OCR 识别 / 人脸识别」无法区分
 * detector、recognizer、corrector、restore_model、anime_detector_model
 * 这些独立模型槽位。细分类型跟随 capabilities[].subtype 保存，
 * 模型卡片和默认模型选择器都据此显示/过滤。</p>
 */
export const MODEL_SUBTYPE_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  ocr: [
    { value: 'ocr_detection', label: '文字检测' },
    { value: 'ocr_recognition', label: '文字识别' },
    { value: 'ocr_correction', label: '文字校正' },
    { value: 'ocr_direction', label: '方向矫正' },
    { value: 'ocr_restore', label: '文字超分修复' },
  ],
  face: [
    { value: 'face_detection', label: '人脸检测' },
    { value: 'face_recognition', label: '人脸识别' },
    { value: 'face_feature', label: '人脸特征提取' },
    { value: 'face_landmark', label: '人脸关键点' },
    { value: 'face_liveness', label: '活体检测' },
    { value: 'face_restore', label: '人脸修复' },
    { value: 'face_enhance', label: '人脸增强' },
    { value: 'anime_face_detection', label: '动漫人脸检测' },
    { value: 'face_attribute', label: '人脸属性' },
    { value: 'face_emotion', label: '人脸表情' },
    { value: 'face_deepfake', label: '换脸检测' },
    { value: 'face_pose', label: '人脸姿态' },
    { value: 'face_compare', label: '人脸比对' },
    { value: 'face_search', label: '人脸搜索' },
  ],
  detection: [
    { value: 'object_detection', label: '目标检测' },
    { value: 'defect_detection', label: '缺陷检测' },
    { value: 'image_classification', label: '图像分类' },
  ],
  image_cv: [
    { value: 'image_classification', label: '图像分类' },
    { value: 'object_detection', label: '目标检测' },
  ],
}

export const MODEL_SUBTYPE_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(MODEL_SUBTYPE_OPTIONS).flatMap((opts) => opts.map((o) => [o.value, o.label])),
) as Record<string, string>
