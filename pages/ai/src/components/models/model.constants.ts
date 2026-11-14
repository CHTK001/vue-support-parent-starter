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
//
// 账号渠道（auth_scheme='oauth'）：
//   凭据由渠道管理模块（ChannelManagementPage）负责绑定/刷新/落库，
//   provider 表单不采集 API Key，仅回显已绑定账号并跳转渠道管理页。
//   识别依据：platform ∈ CHANNEL_PROVIDER_IDS 或 auth_scheme === 'oauth'。
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
    value: 'oauth_account',
    label: '账号渠道',
    authScheme: 'oauth',
    authHeader: '',
    authPrefix: '',
    description: '账号类渠道（Cline / Qoder / Trae / Gemini 等），凭据由渠道管理页统一绑定',
  },
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

/**
 * 账号渠道 provider 的 platform 标识集合。
 *
 * 渠道类 provider 在 sys_ai_provider 中的 platform 字段值即 channel 标识
 * （如 cline / qoder / qoder-cn / trae / gemini），与 SPI 注册别名一一对应。
 * 用于：
 *   ① ProviderFormDialog 识别「是否渠道类 provider」→ 走账号绑定 UI 而非 API Key 输入
 *   ② 模型管理过滤：仅允许选择渠道管理中已启用渠道/已启用模型
 *
 * 新增渠道 SPI 时须同步加入本集合（否则表单侧无法识别）。
 */
export const CHANNEL_PROVIDER_IDS: ReadonlySet<string> = new Set([
  'cline',
  'qoder',
  'qoder-cn',
  'trae',
  'gemini',
  'minimax',
  'zcode',
  'raccoon',
  'loomy',
  'lobsterai',
  'opencode',
])

/**
 * 判断一个 provider 是否为账号渠道类。
 *
 * @param provider provider 对象（来自 /api/providers 或 /api/channels）
 * @returns platform ∈ CHANNEL_PROVIDER_IDS 或 auth_scheme/authScheme === 'oauth'
 */
export function isChannelProvider(provider: any): boolean {
  if (!provider) return false
  const platform = String(provider.platform ?? provider.provider ?? '').toLowerCase()
  if (CHANNEL_PROVIDER_IDS.has(platform)) return true
  const authScheme = String(provider.auth_scheme ?? provider.authScheme ?? '').toLowerCase()
  return authScheme === 'oauth'
}

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
  const scheme = (authScheme || '').toLowerCase()
  if (scheme === 'oauth') return 'oauth_account'
  if (scheme === 'none') return 'none'
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
  { id: 'free-channel', name: '免费渠道', description: '聚合多个免费模型，按模型自动切换上游地址与全局 Key，支持多账号限流切换', protocol: 'openai', defaultApiUrl: 'https://free.nomifun.com/v1', keywords: ['free', 'channel', 'mianfei', '免费渠道'] },
  { id: 'opencode', name: 'OpenCode', description: '免费开源 API，支持多种模型', protocol: 'openai', defaultApiUrl: 'https://opencode.ai/zen/v1', keywords: ['zen'] },
  { id: 'siliconflow', name: 'SiliconFlow 硅基流动', description: '国内 AI 模型平台，支持 DeepSeek、Qwen 等', protocol: 'openai', defaultApiUrl: 'https://api.siliconflow.cn/v1', keywords: ['jiguang', 'silicon'] },
  { id: 'bai', name: 'b.ai', description: '免费 AI 模型平台，支持 DeepSeek 等', protocol: 'openai', defaultApiUrl: 'https://api.b.ai/v1', keywords: [] },
  { id: 'ai302', name: 'AI302', description: 'AI302.com 聚合 API', protocol: 'openai', defaultApiUrl: 'https://api.ai302.com/v1', keywords: ['302'] },
  // 路由组也是一个供应商：没有真实上游地址，成员来自已添加的模型库，
  // 实际选谁由组内的策略（按顺序/轮流/智能…）决定。
  { id: 'router-group', name: '路由组', description: '本地化管理抽象，成员来自模型库，按组内策略挑选真实调用的模型', protocol: 'openai', keywords: ['router', 'route', '路由', '组合'] },

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
  { id: 'moss', name: 'Moss', description: 'Moss 开放平台（mosi.cn），语音合成 / 图像生成', protocol: 'openai', defaultApiUrl: 'https://api.mosi.cn/v1', keywords: ['moss', 'mosi', 'moss-tts'] },
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
  { id: 'shusheng', name: '书生', description: '书生大模型平台（好未来 InternAgent）', protocol: 'openai', defaultApiUrl: 'https://discovery-api.intern-ai.org.cn/v1', keywords: ['shusheng', '书生'] },

  // ===== 云厂商 =====
  { id: 'azure', name: 'Azure OpenAI', description: '微软 Azure OpenAI 服务', protocol: 'openai', defaultApiUrl: 'https://YOUR-RESOURCE.openai.azure.com/openai/v1', keywords: ['microsoft', 'azure-openai'] },
  { id: 'aws-bedrock', name: 'AWS Bedrock', description: '亚马逊 Bedrock 模型平台', protocol: 'openai', defaultApiUrl: 'https://bedrock-runtime.us-east-1.amazonaws.com', keywords: ['amazon', 'amazon', 'claude'] },

  // ===== 本地推理 =====
  { id: 'ollama', name: 'Ollama', description: '本地 Ollama 模型', protocol: 'openai', defaultApiUrl: 'http://localhost:11434/v1', keywords: ['llama', 'qwen2.5'] },
  // ONNX 也必须由用户自己添加（2026-11-14 用户口径：启动时凭空多出一行是错的）。
  // 它是纯本地推理：没有 API 地址与 Key，模型来自模型注册表——通过「绑定目录」
  // 选择服务器上的模型目录（POST /api/onnx/external），表单里地址与鉴权整块不适用。
  // 落库时 platform 由名称反推成 onnx，后端统一把 id 也落成 'onnx'。
  { id: 'onnx', name: 'ONNX 本地推理', description: '本地 ONNX 模型（OCR / 人脸 / 向量 / 版面分析），模型文件放在服务器上', protocol: 'openai', keywords: ['onnx', '本地推理', '离线', 'ocr', 'local'] },

  // ===== NewAPI =====
  { id: 'newapi', name: 'NewAPI', description: '国产 API 聚合平台，支持 GPT、Claude、DeepSeek 等数十个模型', protocol: 'openai', defaultApiUrl: 'https://newapi.io', keywords: ['newapi', 'newapi.io', 'apihub'] },

  // ===== 自定义 =====
  // ===== 小红书 / Dots Studio =====
  // Dots Studio 只认 api-key 请求头，不认标准的 Authorization: Bearer
  { id: 'dots', name: 'Dots Studio', description: '小红书 Dots Studio 点点大模型', protocol: 'openai', defaultApiUrl: 'https://note3-prev-api.askdiandian.com/v1', keywords: ['dots', '点点', 'rednote'], defaultAuthMode: 'api_key_header' },

  // ===== Models.dev 扩展厂商（185 家，键与 sys_ai_provider_metric 一致） =====
  { id: '302ai', name: '302.AI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.302.ai/v1', keywords: ['302', 'ai'] },
  { id: 'abacus', name: 'Abacus', description: '', protocol: 'openai', defaultApiUrl: 'https://routellm.abacus.ai/v1', keywords: ['abacus'] },
  { id: 'abliteration-ai', name: 'abliteration.ai', description: '', protocol: 'openai', defaultApiUrl: 'https://api.abliteration.ai/v1', keywords: ['abliteration', 'ai'] },
  { id: 'above', name: 'above.dev', description: '', protocol: 'openai', defaultApiUrl: 'https://api.above.dev/v1', keywords: ['above', 'dev'] },
  { id: 'agentrouter', name: 'AgentRouter', description: '', protocol: 'openai', defaultApiUrl: 'https://agentrouter.org/v1', keywords: ['agentrouter'] },
  { id: 'ai-router', name: 'AI-ROUTER', description: '', protocol: 'openai', defaultApiUrl: 'https://api.ai-router.dev/v1', keywords: ['ai', 'router'] },
  { id: 'ai21', name: 'AI21 Labs', description: '', protocol: 'openai', defaultApiUrl: 'https://api.ai21.com/studio/v1', keywords: ['ai21', 'labs'] },
  { id: 'aiand', name: 'ai&', description: '', protocol: 'openai', defaultApiUrl: 'https://api.aiand.com/v1', keywords: ['ai'] },
  { id: 'aimlapi', name: 'AI/ML API', description: '', protocol: 'openai', defaultApiUrl: 'https://api.aimlapi.com/v1', keywords: ['ai', 'ml', 'api'] },
  { id: 'ainetcafe', name: 'ainetcafe', description: '', protocol: 'openai', defaultApiUrl: 'https://microquickjs.com/v1', keywords: ['ainetcafe'] },
  { id: 'aixy', name: 'Aixy', description: '', protocol: 'openai', defaultApiUrl: 'https://api.aixy-gateway.com/v1', keywords: ['aixy'] },
  { id: 'aki-io', name: 'AKI.IO', description: '', protocol: 'openai', defaultApiUrl: 'https://aki.io/v1', keywords: ['aki', 'io'] },
  { id: 'ambient', name: 'Ambient', description: '', protocol: 'openai', defaultApiUrl: 'https://api.ambient.xyz/v1', keywords: ['ambient'] },
  { id: 'amd', name: 'AMD', description: '', protocol: 'openai', defaultApiUrl: 'https://developer.amd.com.cn/radeon/api/v1', keywords: ['amd'] },
  { id: 'anyapi', name: 'AnyAPI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.anyapi.ai/v1', keywords: ['anyapi'] },
  { id: 'arcee', name: 'Arcee', description: '', protocol: 'openai', defaultApiUrl: 'https://api.arcee.ai/api/v1', keywords: ['arcee'] },
  { id: 'auriko', name: 'Auriko', description: '', protocol: 'openai', defaultApiUrl: 'https://api.auriko.ai/v1', keywords: ['auriko'] },
  { id: 'baseten', name: 'Baseten', description: '', protocol: 'openai', defaultApiUrl: 'https://inference.baseten.co/v1', keywords: ['baseten'] },
  { id: 'bee', name: 'Bee by HEOSSI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.bee.heossi.com/bee', keywords: ['bee', 'by', 'heossi'] },
  { id: 'berget', name: 'Berget.AI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.berget.ai/v1', keywords: ['berget', 'ai'] },
  { id: 'blueclaw', name: 'Blue Claw', description: '', protocol: 'openai', defaultApiUrl: 'https://openai.blueclaw.network/v1', keywords: ['blue', 'claw'] },
  { id: 'bothub', name: 'Bothub', description: '', protocol: 'openai', defaultApiUrl: 'https://openai.bothub.ru/v1', keywords: ['bothub'] },
  { id: 'boundless', name: 'Boundless', description: '', protocol: 'openai', defaultApiUrl: 'https://api.inference.boundless.network/v1', keywords: ['boundless'] },
  { id: 'chutes', name: 'Chutes', description: '', protocol: 'openai', defaultApiUrl: 'https://llm.chutes.ai/v1', keywords: ['chutes'] },
  { id: 'clarifai', name: 'Clarifai', description: '', protocol: 'openai', defaultApiUrl: 'https://api.clarifai.com/v2/ext/openai/v1', keywords: ['clarifai'] },
  { id: 'claudinio', name: 'Claudinio', description: '', protocol: 'openai', defaultApiUrl: 'https://api.claudin.io/v1', keywords: ['claudinio'] },
  { id: 'cline', name: 'ClinePass', description: '', protocol: 'openai', defaultApiUrl: 'https://api.cline.bot/api/v1', keywords: ['clinepass'] },
  { id: 'cloudferro-sherlock', name: 'CloudFerro Sherlock', description: '', protocol: 'openai', defaultApiUrl: 'https://api-sherlock.cloudferro.com/openai/v1/', keywords: ['cloudferro', 'sherlock'] },
  { id: 'coralbricks', name: 'CoralBricks', description: '', protocol: 'openai', defaultApiUrl: 'https://inference.coralbricks.ai/v1', keywords: ['coralbricks'] },
  { id: 'cortecs', name: 'Cortecs', description: '', protocol: 'openai', defaultApiUrl: 'https://api.cortecs.ai/v1', keywords: ['cortecs'] },
  { id: 'crossmodel', name: 'CrossModel', description: '', protocol: 'openai', defaultApiUrl: 'https://api.crossmodel.ai/v1', keywords: ['crossmodel'] },
  { id: 'crusoe', name: 'Crusoe', description: '', protocol: 'openai', defaultApiUrl: 'https://api.inference.crusoecloud.com/v1', keywords: ['crusoe'] },
  { id: 'daoxe', name: 'DaoXE', description: '', protocol: 'openai', defaultApiUrl: 'https://daoxe.com/v1', keywords: ['daoxe'] },
  { id: 'digitalocean', name: 'DigitalOcean', description: '', protocol: 'openai', defaultApiUrl: 'https://inference.do-ai.run/v1', keywords: ['digitalocean'] },
  { id: 'dinference', name: 'DInference', description: '', protocol: 'openai', defaultApiUrl: 'https://api.dinference.com/v1', keywords: ['dinference'] },
  { id: 'drun', name: 'D.Run (China)', description: '', protocol: 'openai', defaultApiUrl: 'https://chat.d.run/v1', keywords: ['d', 'run', 'china'] },
  { id: 'ebcloud', name: 'EBCloud', description: '', protocol: 'openai', defaultApiUrl: 'https://maas-api.ebcloud.com/v1', keywords: ['ebcloud'] },
  { id: 'echo', name: 'Echo', description: '', protocol: 'openai', defaultApiUrl: 'https://echo.tracerml.ai/v1', keywords: ['echo'] },
  { id: 'edenai', name: 'Eden AI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.edenai.run/v3', keywords: ['eden', 'ai'] },
  { id: 'empiriolabs', name: 'EmpirioLabs AI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.empiriolabs.ai/v1', keywords: ['empiriolabs', 'ai'] },
  { id: 'engy', name: 'engy', description: '', protocol: 'openai', defaultApiUrl: 'https://api.engy.ai/v1', keywords: ['engy'] },
  { id: 'evroc', name: 'evroc', description: '', protocol: 'openai', defaultApiUrl: 'https://models.think.evroc.com/v1', keywords: ['evroc'] },
  { id: 'fastrouter', name: 'FastRouter', description: '', protocol: 'openai', defaultApiUrl: 'https://go.fastrouter.ai/api/v1', keywords: ['fastrouter'] },
  { id: 'fireworks-ai', name: 'Fireworks AI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.fireworks.ai/inference/v1/', keywords: ['fireworks', 'ai'] },
  { id: 'freemodel', name: 'FreeModel', description: '', protocol: 'openai', defaultApiUrl: 'https://cc.freemodel.dev/v1', keywords: ['freemodel'] },
  { id: 'friendli', name: 'Friendli', description: '', protocol: 'openai', defaultApiUrl: 'https://api.friendli.ai/serverless/v1', keywords: ['friendli'] },
  { id: 'frogbot', name: 'FrogBot', description: '', protocol: 'openai', defaultApiUrl: 'https://app.frogbot.ai/api/v1', keywords: ['frogbot'] },
  { id: 'github-copilot', name: 'GitHub Copilot', description: '', protocol: 'openai', defaultApiUrl: 'https://api.githubcopilot.com', keywords: ['github', 'copilot'] },
  { id: 'gmicloud', name: 'GMI Cloud', description: '', protocol: 'openai', defaultApiUrl: 'https://api.gmi-serving.com/v1', keywords: ['gmi', 'cloud'] },
  { id: 'greenpt', name: 'GreenPT', description: '', protocol: 'openai', defaultApiUrl: 'https://api.greenpt.ai/v1', keywords: ['greenpt'] },
  { id: 'helicone', name: 'Helicone', description: '', protocol: 'openai', defaultApiUrl: 'https://ai-gateway.helicone.ai/v1', keywords: ['helicone'] },
  { id: 'hetzner', name: 'Hetzner', description: '', protocol: 'openai', defaultApiUrl: 'https://inference.hetzner.com/api/v1', keywords: ['hetzner'] },
  { id: 'hpc-ai', name: 'HPC-AI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.hpc-ai.com/inference/v1', keywords: ['hpc', 'ai'] },
  { id: 'hyper', name: 'Charm Hyper', description: '', protocol: 'openai', defaultApiUrl: 'https://hyper.charm.land/v1', keywords: ['charm', 'hyper'] },
  { id: 'iflowcn', name: 'iFlow', description: '', protocol: 'openai', defaultApiUrl: 'https://apis.iflow.cn/v1', keywords: ['iflow'] },
  { id: 'impossibl', name: 'Impossibl', description: '', protocol: 'openai', defaultApiUrl: 'https://api.impossibl.com/v1', keywords: ['impossibl'] },
  { id: 'inception', name: 'Inception', description: '', protocol: 'openai', defaultApiUrl: 'https://api.inceptionlabs.ai/v1/', keywords: ['inception'] },
  { id: 'inceptron', name: 'Inceptron', description: '', protocol: 'openai', defaultApiUrl: 'https://api.inceptron.io/v1', keywords: ['inceptron'] },
  { id: 'inco', name: 'Inco', description: '', protocol: 'openai', defaultApiUrl: 'https://api.inco.ai/v1', keywords: ['inco'] },
  { id: 'infer', name: 'Infer by Flow7', description: '', protocol: 'openai', defaultApiUrl: 'https://infer.flow7.org/v1', keywords: ['infer', 'by', 'flow7'] },
  { id: 'inference', name: 'Inference', description: '', protocol: 'openai', defaultApiUrl: 'https://inference.net/v1', keywords: ['inference'] },
  { id: 'inferx', name: 'InferX', description: '', protocol: 'openai', defaultApiUrl: 'https://model.inferx.net/endpoints/v1', keywords: ['inferx'] },
  { id: 'io-net', name: 'IO.NET', description: '', protocol: 'openai', defaultApiUrl: 'https://api.intelligence.io.solutions/api/v1', keywords: ['io', 'net'] },
  { id: 'iteracompute', name: 'IteraCompute', description: '', protocol: 'openai', defaultApiUrl: 'https://api.iteracompute.com/v1', keywords: ['iteracompute'] },
  { id: 'jalapeno', name: 'Jalapeno Cloud', description: '', protocol: 'openai', defaultApiUrl: 'https://api.jalapeno-cloud.ai/v1', keywords: ['jalapeno', 'cloud'] },
  { id: 'jiekou', name: 'Jiekou.AI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.jiekou.ai/openai', keywords: ['jiekou', 'ai'] },
  { id: 'kenari', name: 'Kenari', description: '', protocol: 'openai', defaultApiUrl: 'https://kenari.id/v1', keywords: ['kenari'] },
  { id: 'kilo', name: 'Kilo Gateway', description: '', protocol: 'openai', defaultApiUrl: 'https://api.kilo.ai/api/gateway', keywords: ['kilo', 'gateway'] },
  { id: 'klokintegration', name: 'klokintegration.se', description: '', protocol: 'openai', defaultApiUrl: 'https://api-gw.klok.ipaas.se/proxy/kloker-key/v1', keywords: ['klokintegration', 'se'] },
  { id: 'kosmik', name: 'Kosmik Compute', description: '', protocol: 'openai', defaultApiUrl: 'https://api.koscompute.com/v1', keywords: ['kosmik', 'compute'] },
  { id: 'kuae-cloud-coding-plan', name: 'KUAE Cloud Coding Plan', description: '', protocol: 'openai', defaultApiUrl: 'https://coding-plan-endpoint.kuaecloud.net/v1', keywords: ['kuae', 'cloud', 'coding', 'plan'] },
  { id: 'lilac', name: 'Lilac', description: '', protocol: 'openai', defaultApiUrl: 'https://api.getlilac.com/v1', keywords: ['lilac'] },
  { id: 'liquid', name: 'Liquid Inference', description: '', protocol: 'openai', defaultApiUrl: 'https://router.inference.ai.exchange/v1', keywords: ['liquid', 'inference'] },
  { id: 'llama', name: 'Llama', description: '', protocol: 'openai', defaultApiUrl: 'https://api.llama.com/compat/v1/', keywords: ['llama'] },
  { id: 'llmgateway', name: 'DevPass (LLM Gateway)', description: '', protocol: 'openai', defaultApiUrl: 'https://api.llmgateway.io/v1', keywords: ['devpass', 'llm', 'gateway'] },
  { id: 'llmgateway-providers', name: 'LLM Gateway', description: '', protocol: 'openai', defaultApiUrl: 'https://api.llmgateway.io/v1', keywords: ['llm', 'gateway'] },
  { id: 'llmtech', name: 'LLM Tech', description: '', protocol: 'openai', defaultApiUrl: 'https://api.llmtech.eu/v1', keywords: ['llm', 'tech'] },
  { id: 'llmtr', name: 'LLMTR', description: '', protocol: 'openai', defaultApiUrl: 'https://llmtr.com/v1', keywords: ['llmtr'] },
  { id: 'longcat', name: 'LongCat', description: '', protocol: 'openai', defaultApiUrl: 'https://api.longcat.chat/openai', keywords: ['longcat'] },
  { id: 'lowrouter', name: 'LowRouter', description: '', protocol: 'openai', defaultApiUrl: 'https://api.lowrouter.ai/v1', keywords: ['lowrouter'] },
  { id: 'lucidquery', name: 'LucidQuery', description: '', protocol: 'openai', defaultApiUrl: 'https://api.lucidquery.com/v1', keywords: ['lucidquery'] },
  { id: 'meganova', name: 'Meganova', description: '', protocol: 'openai', defaultApiUrl: 'https://api.meganova.ai/v1', keywords: ['meganova'] },
  { id: 'melious', name: 'Melious', description: '', protocol: 'openai', defaultApiUrl: 'https://api.melious.ai/v1', keywords: ['melious'] },
  { id: 'merge-gateway', name: 'Merge Gateway', description: '', protocol: 'openai', defaultApiUrl: 'https://api-gateway.merge.dev/v1/ai-sdk', keywords: ['merge', 'gateway'] },
  { id: 'meta', name: 'Meta', description: '', protocol: 'openai', defaultApiUrl: 'https://api.meta.ai/v1', keywords: ['meta'] },
  { id: 'mixlayer', name: 'Mixlayer', description: '', protocol: 'openai', defaultApiUrl: 'https://models.mixlayer.ai/v1', keywords: ['mixlayer'] },
  { id: 'moark', name: 'Moark', description: '', protocol: 'openai', defaultApiUrl: 'https://moark.com/v1', keywords: ['moark'] },
  { id: 'modal', name: 'Modal', description: '', protocol: 'openai', defaultApiUrl: 'https://inference.us-west.modal.direct/v1', keywords: ['modal'] },
  { id: 'model-oracle-ai', name: 'Model Oracle AI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.modeloracle.com/api/v1', keywords: ['model', 'oracle', 'ai'] },
  { id: 'modelis', name: 'Modelis', description: '', protocol: 'openai', defaultApiUrl: 'https://modelishub.com/v1', keywords: ['modelis'] },
  { id: 'morph', name: 'Morph', description: '', protocol: 'openai', defaultApiUrl: 'https://api.morphllm.com/v1', keywords: ['morph'] },
  { id: 'nan', name: 'NaN', description: '', protocol: 'openai', defaultApiUrl: 'https://api.nan.builders/v1', keywords: ['nan'] },
  { id: 'nano-gpt', name: 'NanoGPT', description: '', protocol: 'openai', defaultApiUrl: 'https://nano-gpt.com/api/v1', keywords: ['nanogpt'] },
  { id: 'nearai', name: 'NEAR AI Cloud', description: '', protocol: 'openai', defaultApiUrl: 'https://cloud-api.near.ai/v1', keywords: ['near', 'ai', 'cloud'] },
  { id: 'nebius', name: 'Nebius Token Factory', description: '', protocol: 'openai', defaultApiUrl: 'https://api.tokenfactory.nebius.com/v1', keywords: ['nebius', 'token', 'factory'] },
  { id: 'neosmith', name: 'NeoSmith', description: '', protocol: 'openai', defaultApiUrl: 'https://router.neosmith.ai/v1', keywords: ['neosmith'] },
  { id: 'neuralwatt', name: 'Neuralwatt', description: '', protocol: 'openai', defaultApiUrl: 'https://api.neuralwatt.com/v1', keywords: ['neuralwatt'] },
  { id: 'novita-ai', name: 'Novita AI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.novita.ai/openai', keywords: ['novita', 'ai'] },
  { id: 'oci', name: 'OCI Generative AI', description: '', protocol: 'openai', defaultApiUrl: 'https://inference.generativeai.us-chicago-1.oci.oraclecloud.com/openai/v1', keywords: ['oci', 'generative', 'ai'] },
  { id: 'ofox', name: 'Ofox', description: '', protocol: 'openai', defaultApiUrl: 'https://api.ofox.ai/v1', keywords: ['ofox'] },
  { id: 'ollama-cloud', name: 'Ollama Cloud', description: '', protocol: 'openai', defaultApiUrl: 'https://ollama.com/v1', keywords: ['ollama', 'cloud'] },
  { id: 'opencode-go', name: 'OpenCode Go', description: '', protocol: 'openai', defaultApiUrl: 'https://opencode.ai/inference/go/openai/v1', keywords: ['opencode', 'go'] },
  { id: 'openreason', name: 'OpenReason', description: '', protocol: 'openai', defaultApiUrl: 'https://api.openreason.app/v1', keywords: ['openreason'] },
  { id: 'opper', name: 'Opper', description: '', protocol: 'openai', defaultApiUrl: 'https://api.opper.ai/v3/compat', keywords: ['opper'] },
  { id: 'orcarouter', name: 'OrcaRouter', description: '', protocol: 'openai', defaultApiUrl: 'https://api.orcarouter.ai/v1', keywords: ['orcarouter'] },
  { id: 'ovhcloud', name: 'OVHcloud AI Endpoints', description: '', protocol: 'openai', defaultApiUrl: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1', keywords: ['ovhcloud', 'ai', 'endpoints'] },
  { id: 'pareto', name: 'Pareto Inference', description: '', protocol: 'openai', defaultApiUrl: 'https://api.paretoinference.com/v1', keywords: ['pareto', 'inference'] },
  { id: 'pendra', name: 'Pendra', description: '', protocol: 'openai', defaultApiUrl: 'https://api.pendra.ai/api/v1', keywords: ['pendra'] },
  { id: 'perplexity-agent', name: 'Perplexity Agent', description: '', protocol: 'openai', defaultApiUrl: 'https://api.perplexity.ai/v1', keywords: ['perplexity', 'agent'] },
  { id: 'pioneer', name: 'Pioneer', description: '', protocol: 'openai', defaultApiUrl: 'https://api.fastino.ai/v1', keywords: ['pioneer'] },
  { id: 'poe', name: 'Poe', description: '', protocol: 'openai', defaultApiUrl: 'https://api.poe.com/v1', keywords: ['poe'] },
  { id: 'poolside', name: 'Poolside', description: '', protocol: 'openai', defaultApiUrl: 'https://inference.poolside.ai/v1', keywords: ['poolside'] },
  { id: 'prime', name: 'Prime Inference', description: '', protocol: 'openai', defaultApiUrl: 'https://api.pinference.ai/api/v1', keywords: ['prime', 'inference'] },
  { id: 'qihang-ai', name: 'QiHang', description: '', protocol: 'openai', defaultApiUrl: 'https://api.qhaigc.net/v1', keywords: ['qihang'] },
  { id: 'qiniu-ai', name: 'Qiniu 七牛', description: '七牛云 AI 大模型推理（OpenAI 兼容）', protocol: 'openai', defaultApiUrl: 'https://api.qnaigc.com/v1', keywords: ['qiniu', '七牛', '七牛云', 'qnaigc'] },
  { id: 'reflection', name: 'Reflection', description: '', protocol: 'openai', defaultApiUrl: 'https://api.reflection.ai/openai/v1', keywords: ['reflection'] },
  { id: 'regolo-ai', name: 'Regolo AI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.regolo.ai/v1', keywords: ['regolo', 'ai'] },
  { id: 'requesty', name: 'Requesty', description: '', protocol: 'openai', defaultApiUrl: 'https://router.requesty.ai/v1', keywords: ['requesty'] },
  { id: 'routing-run', name: 'routing.run', description: '', protocol: 'openai', defaultApiUrl: 'https://api.routing.run/v1', keywords: ['routing', 'run'] },
  { id: 'runinfra', name: 'RunInfra', description: '', protocol: 'openai', defaultApiUrl: 'https://api.runinfra.ai/v1', keywords: ['runinfra'] },
  { id: 'sakana', name: 'Sakana AI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.sakana.ai/v1', keywords: ['sakana', 'ai'] },
  { id: 'sambanova', name: 'SambaNova', description: '', protocol: 'openai', defaultApiUrl: 'https://api.sambanova.ai/v1', keywords: ['sambanova'] },
  { id: 'sarvam', name: 'Sarvam AI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.sarvam.ai/v1', keywords: ['sarvam', 'ai'] },
  { id: 'scaleway', name: 'Scaleway', description: '', protocol: 'openai', defaultApiUrl: 'https://api.scaleway.ai/v1', keywords: ['scaleway'] },
  { id: 'scnet-token-plan', name: 'SCNet Token Plan', description: '', protocol: 'openai', defaultApiUrl: 'https://api.scnet.cn/api/llm/v1', keywords: ['scnet', 'token', 'plan'] },
  { id: 'scx-ai', name: 'SCX.ai', description: '', protocol: 'openai', defaultApiUrl: 'https://api.scx.ai/v1', keywords: ['scx', 'ai'] },
  { id: 'stackit', name: 'STACKIT', description: '', protocol: 'openai', defaultApiUrl: 'https://api.openai-compat.model-serving.eu01.onstackit.cloud/v1', keywords: ['stackit'] },
  { id: 'standardcompute', name: 'Standard Compute', description: '', protocol: 'openai', defaultApiUrl: 'https://api.stdcmpt.com/v1', keywords: ['standard', 'compute'] },
  { id: 'subconscious', name: 'Subconscious', description: '', protocol: 'openai', defaultApiUrl: 'https://api.subconscious.dev/v1', keywords: ['subconscious'] },
  { id: 'submodel', name: 'submodel', description: '', protocol: 'openai', defaultApiUrl: 'https://llm.submodel.ai/v1', keywords: ['submodel'] },
  { id: 'synthetic', name: 'Synthetic', description: '', protocol: 'openai', defaultApiUrl: 'https://api.synthetic.new/openai/v1', keywords: ['synthetic'] },
  { id: 'tempr', name: 'Tempr Gateway', description: '', protocol: 'openai', defaultApiUrl: 'https://api.temprhq.io/v1', keywords: ['tempr', 'gateway'] },
  { id: 'tencent-coding-plan', name: 'Tencent Coding Plan (China)', description: '', protocol: 'openai', defaultApiUrl: 'https://api.lkeap.cloud.tencent.com/coding/v3', keywords: ['tencent', 'coding', 'plan', 'china'] },
  { id: 'tencent-token-plan', name: 'Tencent Token Plan', description: '', protocol: 'openai', defaultApiUrl: 'https://api.lkeap.cloud.tencent.com/plan/v3', keywords: ['tencent', 'token', 'plan'] },
  { id: 'tencent-tokenhub', name: 'Tencent TokenHub', description: '', protocol: 'openai', defaultApiUrl: 'https://tokenhub.tencentmaas.com/v1', keywords: ['tencent', 'tokenhub'] },
  { id: 'tensorx', name: 'TensorX', description: '', protocol: 'openai', defaultApiUrl: 'https://api.tensorx.ai/v1', keywords: ['tensorx'] },
  { id: 'the-grid-ai', name: 'The Grid AI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.thegrid.ai/v1', keywords: ['the', 'grid', 'ai'] },
  { id: 'thinkingmachines', name: 'Thinking Machines', description: '', protocol: 'openai', defaultApiUrl: 'https://tinker.thinkingmachines.dev/services/tinker-prod/anthropic/api/v1', keywords: ['thinking', 'machines'] },
  { id: 'tinfoil', name: 'Tinfoil', description: '', protocol: 'openai', defaultApiUrl: 'https://inference.tinfoil.sh/v1', keywords: ['tinfoil'] },
  { id: 'tokengo', name: 'TokenGo', description: '', protocol: 'openai', defaultApiUrl: 'https://api.tokengo.com/v1', keywords: ['tokengo'] },
  { id: 'tokenrouter', name: 'TokenRouter', description: '', protocol: 'openai', defaultApiUrl: 'https://api.tokenrouter.com/v1', keywords: ['tokenrouter'] },
  { id: 'trustedrouter', name: 'TrustedRouter', description: '', protocol: 'openai', defaultApiUrl: 'https://api.trustedrouter.com/v1', keywords: ['trustedrouter'] },
  { id: 'umans-ai', name: 'Umans AI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.code.umans.ai/v1', keywords: ['umans', 'ai'] },
  { id: 'umans-ai-coding-plan', name: 'Umans AI Coding Plan', description: '', protocol: 'openai', defaultApiUrl: 'https://api.code.umans.ai/v1', keywords: ['umans', 'ai', 'coding', 'plan'] },
  { id: 'unorouter', name: 'UnoRouter', description: '', protocol: 'openai', defaultApiUrl: 'https://api.unorouter.com/v1', keywords: ['unorouter'] },
  { id: 'upstage', name: 'Upstage', description: '', protocol: 'openai', defaultApiUrl: 'https://api.upstage.ai/v1/solar', keywords: ['upstage'] },
  { id: 'vancine', name: 'Vancine', description: '', protocol: 'openai', defaultApiUrl: 'https://vancine.com/v1', keywords: ['vancine'] },
  { id: 'vispark', name: 'Vispark', description: '', protocol: 'openai', defaultApiUrl: 'https://api.lab.vispark.in/v1', keywords: ['vispark'] },
  { id: 'vivgrid', name: 'Vivgrid', description: '', protocol: 'openai', defaultApiUrl: 'https://api.vivgrid.com/v1', keywords: ['vivgrid'] },
  { id: 'vultr', name: 'Vultr', description: '', protocol: 'openai', defaultApiUrl: 'https://api.vultrinference.com/v1', keywords: ['vultr'] },
  { id: 'wafer.ai', name: 'Wafer', description: '', protocol: 'openai', defaultApiUrl: 'https://pass.wafer.ai/v1', keywords: ['wafer'] },
  { id: 'wallaby', name: 'Wallaby', description: '', protocol: 'openai', defaultApiUrl: 'https://api.wallabytoken.com/v1', keywords: ['wallaby'] },
  { id: 'wandb', name: 'CoreWeave', description: '', protocol: 'openai', defaultApiUrl: 'https://api.inference.wandb.ai/v1', keywords: ['coreweave'] },
  { id: 'xiaomi', name: 'Xiaomi', description: '', protocol: 'openai', defaultApiUrl: 'https://api.xiaomimimo.com/v1', keywords: ['xiaomi'] },
  { id: 'xiaomi-token-plan-ams', name: 'Xiaomi Token Plan (Europe)', description: '', protocol: 'openai', defaultApiUrl: 'https://token-plan-ams.xiaomimimo.com/v1', keywords: ['xiaomi', 'token', 'plan', 'europe'] },
  { id: 'xiaomi-token-plan-cn', name: 'Xiaomi Token Plan (China)', description: '', protocol: 'openai', defaultApiUrl: 'https://token-plan-cn.xiaomimimo.com/v1', keywords: ['xiaomi', 'token', 'plan', 'china'] },
  { id: 'xiaomi-token-plan-sgp', name: 'Xiaomi Token Plan (Singapore)', description: '', protocol: 'openai', defaultApiUrl: 'https://token-plan-sgp.xiaomimimo.com/v1', keywords: ['xiaomi', 'token', 'plan', 'singapore'] },
  { id: 'xpersona', name: 'Xpersona', description: '', protocol: 'openai', defaultApiUrl: 'https://www.xpersona.co/v1', keywords: ['xpersona'] },
  { id: 'zai', name: 'Z.AI', description: '', protocol: 'openai', defaultApiUrl: 'https://api.z.ai/api/paas/v4', keywords: ['z', 'ai'] },
  { id: 'zai-coding-plan', name: 'Z.AI Coding Plan', description: '', protocol: 'openai', defaultApiUrl: 'https://api.z.ai/api/coding/paas/v4', keywords: ['z', 'ai', 'coding', 'plan'] },
  { id: 'zeldoc', name: 'Zeldoc', description: '', protocol: 'openai', defaultApiUrl: 'https://api.zeldoc.ai/v1', keywords: ['zeldoc'] },
  { id: 'zenifra', name: 'Zenifra', description: '', protocol: 'openai', defaultApiUrl: 'https://ai.zenifra.com/v1', keywords: ['zenifra'] },
  { id: 'zenmux', name: 'ZenMux', description: '', protocol: 'openai', defaultApiUrl: 'https://zenmux.ai/api/v1', keywords: ['zenmux'] },

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

/**
 * 规范类型 → 图标。
 *
 * <p>由 {@link MODEL_TYPE_OPTIONS} 派生，不另维护一份：类型下拉与卡片/弹框里的
 * 标签图标必须同源，否则加类型时两边会走散。</p>
 */
export const MODEL_TYPE_ICON: Record<string, any> = Object.fromEntries(
  MODEL_TYPE_OPTIONS.map((o) => [o.value, o.icon]),
)

/**
 * 规范类型 → 标签配色类别（供 ModelTagStrip 的图标着色）。
 *
 * <p>与模型卡片 `cap-i.kind-*` 的语义分类保持一致：对话类走主色、视觉类走警告色、
 * 音频类走信息色、视频类走危险色、向量类走成功色。</p>
 */
export const MODEL_TYPE_KIND: Record<string, string> = {
  text: 'chat',
  embedding: 'vector',
  rerank: 'vector',
  image: 'image',
  video: 'video',
  image_cv: 'image',
  detection: 'vision',
  ocr: 'doc',
  face: 'vision',
  layout: 'doc',
  asr: 'audio',
  tts: 'audio',
}

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
 * 思考强度档位全集（模型配置可勾选、会话选择器可选）。
 *
 * <p>六档：none（不思考）/ minimal（最小）/ low / medium / high / max。
 * 文案统一走 {@code common.thinkingEffort.<key>}。</p>
 */
export const THINKING_EFFORT_LEVELS = ['none', 'minimal', 'low', 'medium', 'high', 'max'] as const

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
