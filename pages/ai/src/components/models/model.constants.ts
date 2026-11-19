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
  // 后端已有 SPI 实现、此前前端未识别的渠道：不补会把它们当普通 API Key 提供商，
  // 表单要求填 Key，而正确路径是渠道管理页绑定账号。
  'eac',
  'kilo',
  'workbuddy',
  // SCNet 超算互联网：OpenAI 兼容 + API Key（SPI @Spi("scnet")）
  'scnet',
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
 * 免登录内置对话渠道。
 *
 * <p>这类渠道没有上游地址、也没有 API Key：模型目录由后端 {@code ChatClient}
 * 扩展（SPI）自己给出，鉴权由客户端按渠道自己的登录态处理。前端据此：</p>
 * <ul>
 *   <li>表单不校验 API 地址；</li>
 *   <li>「从提供商获取模型列表」不要求地址与 Key，直接走后端内置模型清单。</li>
 * </ul>
 *
 * <p>值为 SPI 扩展名；渠道管理物化出来的 {@code chat-<渠道>} 行会去掉前缀后再比对。</p>
 */
export const KEYLESS_CHANNEL_PROVIDER_IDS: ReadonlySet<string> = new Set([
  'duckduckgo',
])

/**
 * 判断 provider 是否为免登录内置对话渠道。
 *
 * @param provider provider 对象（来自 /api/providers）
 * @returns platform（去掉 {@code chat-} 前缀）∈ {@link KEYLESS_CHANNEL_PROVIDER_IDS}
 */
export function isKeylessChannelProvider(provider: any): boolean {
  if (!provider) return false
  let platform = String(provider.platform ?? provider.provider ?? '').toLowerCase().trim()
  if (platform.startsWith('chat-')) platform = platform.slice('chat-'.length)
  return KEYLESS_CHANNEL_PROVIDER_IDS.has(platform)
}

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
/**
 * 供应商模板的端点变体：同一家厂商、不同 baseUrl（如火山方舟的标准端点
 * 与 Coding Plan 编程套餐端点）。变体只覆盖差异字段，其余随主模板。
 */
export interface ProviderTemplateVariant {
  id: string
  name: string
  description?: string
  defaultApiUrl: string
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
  /** 同一家厂商的其它接入端点：新增渠道表单里切换，选中后回填变体地址 */
  variants?: ProviderTemplateVariant[]
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
  // 免费渠道＝渠道管理的统一入口：模型取自渠道管理里所有已开启的模型，调用时按模型
  // 自动切换到对应渠道的上游地址与凭据。它没有自己的上游地址，模板不带 defaultApiUrl，
  // 表单也不再要求填写（地址/Key 都在渠道管理维护）。
  { id: 'free-channel', name: '免费渠道', description: '渠道管理统一入口：模型来自渠道管理所有已开启的模型，按模型自动切换上游地址与凭据', protocol: 'openai', keywords: ['free', 'channel', 'mianfei', '免费渠道'] },
  // 免登录对话渠道：没有上游地址、也没有 Key，模型目录由后端 ChatClient 扩展自己提供
  // （见 model.constants.ts 的 KEYLESS_CHANNEL_PROVIDER_IDS）。落库 auth_scheme=none、
  // base_url 留空；「从提供商获取模型列表」走内置模型清单，加进来的模型可直接调用。
  { id: 'duckduckgo', name: 'DuckDuckGo', description: '免登录对话渠道，无需 API 地址与 Key（模型由内置客户端提供）', protocol: 'openai', keywords: ['duck', 'ddg', '免登录', 'duck.ai'], defaultAuthMode: 'none' },
  { id: 'opencode', name: 'OpenCode', description: '免费开源 API，支持多种模型', protocol: 'openai', defaultApiUrl: 'https://opencode.ai/zen/v1', keywords: ['zen'] },
  // SCNet 超算互联网：官方 OpenAI 兼容入口（/api/llm/v1），API Key 鉴权；
  // 渠道鉴权由后端 ScnetAccountChannelAuthManager 负责，模型目录走 GET /models。
  { id: 'scnet', name: 'SCNet 超算互联网', description: '国家超算互联网模型服务，OpenAI 兼容接口，API Key 鉴权', protocol: 'openai', defaultApiUrl: 'https://api.scnet.cn/api/llm/v1', keywords: ['scnet', '超算', 'scnet-max'] },
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
  { id: 'sensenova', name: '商汤日日新 SenseNova', description: '商汤科技日日新（SenseNova）大模型平台，OpenAI 兼容接口', protocol: 'openai', defaultApiUrl: 'https://token.sensenova.cn/v1', keywords: ['sensenova', 'sensetime', '日日新', '商汤', 'ririxin'] },
  { id: 'moss', name: 'Moss', description: 'Moss 开放平台（mosi.cn），语音合成 / 图像生成', protocol: 'openai', defaultApiUrl: 'https://api.mosi.cn/v1', keywords: ['moss', 'mosi', 'moss-tts'] },
  // 火山引擎（豆包 / 火山方舟）合并为一个入口：doubao 是本家别名（keywords 命中），
  // Coding Plan 编程套餐端点（/api/coding/v3）是本家变体，新增渠道表单里切换。
  { id: 'volcengine', name: '火山引擎', description: '字节跳动豆包 Doubao 模型（火山方舟）', protocol: 'openai', defaultApiUrl: 'https://ark.cn-beijing.volces.com/api/v3', keywords: ['doubao', 'ark', '豆包', 'ep-', 'volcengine-coding-plan', 'coding', 'plan'], variants: [{ id: 'volcengine-coding-plan', name: 'Coding Plan 端点', description: '火山方舟编程套餐端点（/api/coding/v3）', defaultApiUrl: 'https://ark.cn-beijing.volces.com/api/coding/v3' }] },
  { id: 'spark', name: '讯飞星火', description: '科大讯飞星火大模型', protocol: 'openai', defaultApiUrl: 'https://spark-api.cn-huabei-1.xf-yun.com/v1', keywords: ['spark', 'xfyun', '讯飞'] },
  { id: 'flytek', name: '科大讯飞', description: '讯飞开放平台星火系列', protocol: 'openai', defaultApiUrl: 'https://spark-api.cn-huabei-1.xf-yun.com/v1', keywords: ['spark', 'xfyun'] },
  { id: 'baidu-wenxin', name: '文心一言', description: '百度文心一言大模型', protocol: 'openai', defaultApiUrl: 'https://qianfan.baidubce.com/v2', keywords: ['wenxin', 'ernie', 'baidu'] },
  { id: 'tencent', name: '腾讯混元', description: '腾讯混元大模型（Cloud API）', protocol: 'openai', defaultApiUrl: 'https://api.hunyuan.cloud.tencent.com/v1', keywords: ['hunyuan', '腾讯'] },
  { id: 'hunyuan', name: '腾讯混元', description: '腾讯混元 Hunyuan 大模型', protocol: 'openai', defaultApiUrl: 'https://api.hunyuan.cloud.tencent.com/v1', keywords: ['hunyuan'] },
  { id: 'modelscope', name: '魔搭 ModelScope', description: '阿里达摩院模型社区，免费使用多种开源模型', protocol: 'openai', defaultApiUrl: 'https://api-inference.modelscope.cn/v1', keywords: ['damo', '魔搭'] },
  { id: '360ai', name: '360 智脑', description: '360 安全智脑大模型', protocol: 'openai', defaultApiUrl: 'https://api.360.cn/v1', keywords: ['360', 'zhibo'] },
  { id: 'shusheng', name: '书生·端砚', description: '上海人工智能实验室书生（InternLM）大模型平台', protocol: 'openai', defaultApiUrl: 'https://discovery-api.intern-ai.org.cn/v1', keywords: ['shusheng', '书生', 'internlm', '浦语', '上海人工智能实验室'] },
  // 蚂蚁百灵（Ant Ling）：蚂蚁集团 Ling / Ming 两个模型家族的官方入口。
  // 地址与控制台取自官方文档 developer.ant-ling.com（OpenAI 兼容，Bearer 鉴权）。
  { id: 'bailing', name: '蚂蚁百灵', description: '蚂蚁集团 Ling / Ming 系列大模型官方 API，OpenAI 兼容接口', protocol: 'openai', defaultApiUrl: 'https://api.ant-ling.com/v1', keywords: ['bailing', '百灵', '蚂蚁百灵', 'ant-ling', 'antling', 'ling', 'ming', 'inclusionai'] },

  // ===== 国产套餐 / 区域站（地址取自 models.dev 的官方端点，不猜值） =====
  { id: 'alibaba-coding-plan-cn', name: '阿里云百炼 Coding Plan（国内）', description: '阿里云百炼编程套餐端点（国内站），OpenAI 兼容', protocol: 'openai', defaultApiUrl: 'https://coding.dashscope.aliyuncs.com/v1', keywords: ['alibaba', 'bailian', '百炼', 'coding', 'plan', 'qwen'] },
  { id: 'alibaba-coding-plan', name: '阿里云百炼 Coding Plan（国际）', description: '阿里云百炼编程套餐端点（国际站），OpenAI 兼容', protocol: 'openai', defaultApiUrl: 'https://coding-intl.dashscope.aliyuncs.com/v1', keywords: ['alibaba', 'bailian', '百炼', 'coding', 'plan'] },
  { id: 'alibaba-token-plan-cn', name: '阿里云百炼 Token 套餐（国内）', description: '阿里云百炼 Token 套餐端点（国内站），OpenAI 兼容', protocol: 'openai', defaultApiUrl: 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1', keywords: ['alibaba', 'bailian', '百炼', 'token', 'plan'] },
  { id: 'alibaba-token-plan', name: '阿里云百炼 Token 套餐（国际）', description: '阿里云百炼 Token 套餐端点（国际站），OpenAI 兼容', protocol: 'openai', defaultApiUrl: 'https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1', keywords: ['alibaba', 'bailian', '百炼', 'token', 'plan'] },
  // Qwen Cloud（百炼国际站）：与国内 dashscope 是同一家、不同站点，地址取自 models.dev 的 alibaba
  { id: 'alibaba', name: 'Qwen Cloud（百炼国际站）', description: '阿里云百炼国际站（DashScope International），Qwen 系列模型，OpenAI 兼容', protocol: 'openai', defaultApiUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', keywords: ['qwen', 'dashscope', 'alibaba', 'intl', '百炼', '国际站'] },
  { id: 'zhipuai-coding-plan', name: '智谱 Coding Plan', description: '智谱 GLM 编程套餐端点（bigmodel.cn）', protocol: 'openai', defaultApiUrl: 'https://open.bigmodel.cn/api/coding/paas/v4', keywords: ['zhipu', 'glm', '智谱', 'coding', 'plan'] },
  { id: 'moonshotai', name: '月之暗面（国际站）', description: 'Moonshot AI 国际站 Kimi 模型 API', protocol: 'openai', defaultApiUrl: 'https://api.moonshot.ai/v1', keywords: ['moonshot', 'kimi', '月之暗面'] },
  { id: 'kimi-code-plan-cn', name: 'Kimi 编程套餐（kimi.com）', description: 'Kimi 编程套餐端点（kimi.com 国内站）', protocol: 'openai', defaultApiUrl: 'https://api.kimi.com/coding/v1', keywords: ['kimi', 'moonshot', 'coding', 'plan'] },
  { id: 'kimi-code-plan-global', name: 'Kimi 编程套餐（kimi.ai）', description: 'Kimi 编程套餐端点（kimi.ai 国际站）', protocol: 'openai', defaultApiUrl: 'https://api.kimi.ai/coding/v1', keywords: ['kimi', 'moonshot', 'coding', 'plan'] },
  { id: 'stepfun-step-plan', name: '阶跃星辰 Step Plan（国内）', description: '阶跃星辰 Step 编程套餐端点（国内站）', protocol: 'openai', defaultApiUrl: 'https://api.stepfun.com/step_plan/v1', keywords: ['stepfun', 'step', 'plan', '阶跃'] },
  { id: 'stepfun-ai', name: '阶跃星辰（国际站）', description: '阶跃星辰 Step 系列模型国际站 API', protocol: 'openai', defaultApiUrl: 'https://api.stepfun.ai/v1', keywords: ['stepfun', 'step', '阶跃'] },
  { id: 'stepfun-ai-step-plan', name: '阶跃星辰 Step Plan（国际）', description: '阶跃星辰 Step 编程套餐端点（国际站）', protocol: 'openai', defaultApiUrl: 'https://api.stepfun.ai/step_plan/v1', keywords: ['stepfun', 'step', 'plan'] },
  { id: 'drun', name: 'D.Run 中国', description: 'D.Run 算力平台模型服务（国内站），OpenAI 兼容', protocol: 'openai', defaultApiUrl: 'https://chat.d.run/v1', keywords: ['drun', 'd.run'] },
  { id: 'kuae-cloud-coding-plan', name: '摩尔线程 KUAE Coding Plan', description: '摩尔线程 KUAE 云编程套餐端点，OpenAI 兼容', protocol: 'openai', defaultApiUrl: 'https://coding-plan-endpoint.kuaecloud.net/v1', keywords: ['kuae', 'mthreads', '摩尔线程', 'coding', 'plan'] },
  { id: 'moark', name: 'Moark', description: 'Moark 开放平台（moark.com）文本生成接口', protocol: 'openai', defaultApiUrl: 'https://moark.com/v1', keywords: ['moark'] },
  { id: 'qihang-ai', name: '启航 QiHang', description: '启航 AI 网关（qhaigc.net），OpenAI 兼容', protocol: 'openai', defaultApiUrl: 'https://api.qhaigc.net/v1', keywords: ['qihang', '启航', 'qhaigc'] },


  // ===== 云厂商 =====
  { id: 'azure', name: 'Azure OpenAI', description: '微软 Azure OpenAI 服务', protocol: 'openai', defaultApiUrl: 'https://YOUR-RESOURCE.openai.azure.com/openai/v1', keywords: ['microsoft', 'azure-openai'] },
  // 华为云 MAAS：ModelArts Studio 的模型即服务，官方 OpenAI 兼容入口（地址取自 models.dev）
  { id: 'huawei-maas', name: '华为云 MAAS', description: '华为云 ModelArts Studio 模型即服务，OpenAI 兼容', protocol: 'openai', defaultApiUrl: 'https://api.modelarts-maas.com/openai/v1', keywords: ['huawei', '华为云', 'modelarts', 'maas', '盘古'] },
  { id: 'aws-bedrock', name: 'AWS Bedrock', description: '亚马逊 Bedrock 模型平台', protocol: 'openai', defaultApiUrl: 'https://bedrock-runtime.us-east-1.amazonaws.com', keywords: ['amazon', 'amazon', 'claude'] },

  // ===== 本地推理 =====
  { id: 'ollama', name: 'Ollama', description: '本地 Ollama 模型', protocol: 'openai', defaultApiUrl: 'http://localhost:11434/v1', keywords: ['llama', 'qwen2.5'] },
  // ONNX 也必须由用户自己添加（2026-11-14 用户口径：启动时凭空多出一行是错的）。
  // 它是纯本地推理：没有 API 地址与 Key，模型来自模型注册表——通过「绑定目录」
  // 选择服务器上的模型目录（POST /api/onnx/external），表单里地址与鉴权整块不适用。
  // 落库时 platform 由名称反推成 onnx，后端统一把 id 也落成 'onnx'。
  { id: 'onnx', name: 'ONNX 本地推理', description: '本地 ONNX 模型（OCR / 人脸 / 向量 / 版面分析），模型文件放在服务器上', protocol: 'openai', keywords: ['onnx', '本地推理', '离线', 'ocr', 'local'] },

  // ===== 自建网关 / 中转 =====
  // 这两类都是「自建部署」：没有统一的上游地址，地址填自己的部署域名，Key 用该实例签发的令牌。
  { id: 'newapi', name: 'New API', description: '开源自建 AI 网关（One API 增强版），地址填自己的部署域名', protocol: 'openai', keywords: ['new-api', 'newapi', 'one-api', '网关', '聚合', '中转'] },
  { id: 'sub2api', name: 'Sub2API', description: '开源自建订阅转 API 中转，Claude/OpenAI/Gemini/Grok 订阅统一接入', protocol: 'openai', keywords: ['sub2api', 'sub-api', '订阅转api', '拼车', '中转'] },

  // ===== 小红书 / Dots Studio =====
  // Dots Studio 只认 api-key 请求头，不认标准的 Authorization: Bearer
  { id: 'dots', name: 'Dots Studio', description: '小红书 Dots Studio 点点大模型', protocol: 'openai', defaultApiUrl: 'https://note3-prev-api.askdiandian.com/v1', keywords: ['dots', '点点', 'rednote'], defaultAuthMode: 'api_key_header' },

  // ===== Models.dev 扩展厂商（精选，键与 sys_ai_provider_metric 一致） =====
  // 口径（2026-11-18）：
  //   1) 国外优先「官方」——模型自研或自有算力的厂商（DeepInfra、Hyperbolic、
  //      Cortecs 这类托管推理），以及云厂商的推理服务；
  //   2) 中转站 / 聚合网关只保留常见的几个（OpenRouter、OpenCode、commandcode、
  //      Kilo、Poe、New API、Sub2API、ClinePass、Vercel AI Gateway、NanoGPT、
  //      Requesty、AI/ML API、Abacus），冷门聚合（AgentRouter、Eden AI、Helicone、
  //      LLM Gateway、Opper…）走「自定义供应商」添加，不占模板库；
  //   3) 国内的中转聚合（302.AI、接口 AI、ZenMux、Agnes、b.ai、启航）保留，方便直接用。
  { id: '302ai', name: '302.AI', description: '按量付费 AI 聚合平台，一张 Key 调用数百个模型', protocol: 'openai', defaultApiUrl: 'https://api.302.ai/v1', keywords: ['302', 'ai'] },
  { id: 'abacus', name: 'Abacus.AI', description: 'Abacus.AI 的 RouteLLM 模型路由服务，OpenAI 兼容', protocol: 'openai', defaultApiUrl: 'https://routellm.abacus.ai/v1', keywords: ['abacus', 'routellm', 'router'] },
  { id: 'ai21', name: 'AI21 Labs', description: 'AI21 Labs Jamba 系列模型官方 API', protocol: 'openai', defaultApiUrl: 'https://api.ai21.com/studio/v1', keywords: ['ai21', 'labs'] },
  { id: 'aimlapi', name: 'AI/ML API', description: 'AI/ML API 聚合平台，文本 / 图像 / 视频模型统一入口', protocol: 'openai', defaultApiUrl: 'https://api.aimlapi.com/v1', keywords: ['aimlapi', 'ai/ml', 'aggregator'] },
  { id: 'amd', name: 'AMD', description: 'AMD Radeon 开发者平台模型推理接口', protocol: 'openai', defaultApiUrl: 'https://developer.amd.com.cn/radeon/api/v1', keywords: ['amd'] },
  { id: 'arcee', name: 'Arcee', description: 'Arcee AI 开源模型推理 API', protocol: 'openai', defaultApiUrl: 'https://api.arcee.ai/api/v1', keywords: ['arcee'] },
  { id: 'baseten', name: 'Baseten', description: '模型部署与推理托管平台', protocol: 'openai', defaultApiUrl: 'https://inference.baseten.co/v1', keywords: ['baseten'] },
  { id: 'chutes', name: 'Chutes', description: '去中心化算力推理，托管开源模型', protocol: 'openai', defaultApiUrl: 'https://llm.chutes.ai/v1', keywords: ['chutes'] },
  { id: 'clarifai', name: 'Clarifai', description: '视觉与多模态 AI 平台，OpenAI 兼容入口', protocol: 'openai', defaultApiUrl: 'https://api.clarifai.com/v2/ext/openai/v1', keywords: ['clarifai'] },
  // ClinePass 走 API Key（api.cline.bot）；id 不能叫 cline —— 'cline' 是设备码登录的账号渠道，
  // 表单会切到账号绑定 UI，这里用 models.dev 的 id 'cline-pass' 区分
  { id: 'cline-pass', name: 'ClinePass', description: 'Cline 编程助手的订阅套餐端点，OpenAI 兼容（API Key）', protocol: 'openai', defaultApiUrl: 'https://api.cline.bot/api/v1', keywords: ['cline', 'clinepass', 'coding', 'plan'] },
  // Cloudflare Workers AI：地址里必须带自己的 Account ID，模板给的是官方占位形态
  { id: 'cloudflare-workers-ai', name: 'Cloudflare Workers AI', description: 'Cloudflare Workers AI 推理（把地址中的 {account_id} 换成自己的账号 ID）', protocol: 'openai', defaultApiUrl: 'https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1', keywords: ['cloudflare', 'workers', 'ai'] },
  { id: 'cortecs', name: 'Cortecs', description: 'Cortecs 欧洲模型推理平台，OpenAI 兼容', protocol: 'openai', defaultApiUrl: 'https://api.cortecs.ai/v1', keywords: ['cortecs'] },
  { id: 'deepinfra', name: 'DeepInfra', description: 'DeepInfra 托管开源模型推理，OpenAI 兼容入口', protocol: 'openai', defaultApiUrl: 'https://api.deepinfra.com/v1/openai', keywords: ['deepinfra', 'serverless'] },
  { id: 'crusoe', name: 'Crusoe', description: 'Crusoe Cloud 托管推理服务', protocol: 'openai', defaultApiUrl: 'https://api.inference.crusoecloud.com/v1', keywords: ['crusoe'] },
  { id: 'digitalocean', name: 'DigitalOcean', description: 'DigitalOcean Gradient 模型推理平台', protocol: 'openai', defaultApiUrl: 'https://inference.do-ai.run/v1', keywords: ['digitalocean'] },
  { id: 'fireworks-ai', name: 'Fireworks AI', description: '开源模型推理托管，支持微调与低延迟', protocol: 'openai', defaultApiUrl: 'https://api.fireworks.ai/inference/v1/', keywords: ['fireworks', 'ai'] },
  { id: 'friendli', name: 'Friendli', description: 'FriendliAI 高吞吐推理引擎', protocol: 'openai', defaultApiUrl: 'https://api.friendli.ai/serverless/v1', keywords: ['friendli'] },
  { id: 'github-copilot', name: 'GitHub Copilot', description: 'GitHub Copilot 模型端点，需 Copilot 订阅', protocol: 'openai', defaultApiUrl: 'https://api.githubcopilot.com', keywords: ['github', 'copilot'] },
  { id: 'gmicloud', name: 'GMI Cloud', description: 'GMI Cloud GPU 云的模型推理', protocol: 'openai', defaultApiUrl: 'https://api.gmi-serving.com/v1', keywords: ['gmi', 'cloud'] },
  { id: 'hetzner', name: 'Hetzner', description: '德国云厂商 Hetzner 的推理服务', protocol: 'openai', defaultApiUrl: 'https://inference.hetzner.com/api/v1', keywords: ['hetzner'] },
  { id: 'hyperbolic', name: 'Hyperbolic', description: 'Hyperbolic 去中心化 GPU 云推理，OpenAI 兼容', protocol: 'openai', defaultApiUrl: 'https://api.hyperbolic.xyz/v1', keywords: ['hyperbolic'] },
  { id: 'iflowcn', name: 'iFlow', description: '心流 AI 助手开放接口（iflow.cn）', protocol: 'openai', defaultApiUrl: 'https://apis.iflow.cn/v1', keywords: ['iflow'] },
  { id: 'inception', name: 'Inception', description: 'Inception Labs Mercury 扩散式大模型 API', protocol: 'openai', defaultApiUrl: 'https://api.inceptionlabs.ai/v1/', keywords: ['inception'] },
  { id: 'inference', name: 'Inference', description: 'Inference.net 去中心化推理服务', protocol: 'openai', defaultApiUrl: 'https://inference.net/v1', keywords: ['inference'] },
  { id: 'io-net', name: 'IO.NET', description: '去中心化 GPU 云推理服务（IO.NET）', protocol: 'openai', defaultApiUrl: 'https://api.intelligence.io.solutions/api/v1', keywords: ['io', 'net'] },
  { id: 'jiekou', name: 'Jiekou.AI', description: '接口 AI 聚合平台，OpenAI 兼容', protocol: 'openai', defaultApiUrl: 'https://api.jiekou.ai/openai', keywords: ['jiekou', 'ai'] },
  { id: 'kilo', name: 'Kilo Gateway', description: 'Kilo Code 的模型网关', protocol: 'openai', defaultApiUrl: 'https://api.kilo.ai/api/gateway', keywords: ['kilo', 'gateway'] },
  { id: 'liquid', name: 'Liquid Inference', description: 'Liquid AI（LFM）模型推理服务', protocol: 'openai', defaultApiUrl: 'https://router.inference.ai.exchange/v1', keywords: ['liquid', 'inference'] },
  { id: 'llama', name: 'Llama', description: 'Meta Llama API 官方兼容端点', protocol: 'openai', defaultApiUrl: 'https://api.llama.com/compat/v1/', keywords: ['llama'] },
  { id: 'longcat', name: 'LongCat', description: '美团 LongCat 大模型 API', protocol: 'openai', defaultApiUrl: 'https://api.longcat.chat/openai', keywords: ['longcat'] },
  { id: 'meta', name: 'Meta', description: 'Meta AI（Llama）模型 API', protocol: 'openai', defaultApiUrl: 'https://api.meta.ai/v1', keywords: ['meta'] },
  { id: 'modal', name: 'Modal', description: 'Modal 无服务器 GPU 推理平台', protocol: 'openai', defaultApiUrl: 'https://inference.us-west.modal.direct/v1', keywords: ['modal'] },
  { id: 'morph', name: 'Morph', description: 'Morph LLM 高速代码编辑模型 API', protocol: 'openai', defaultApiUrl: 'https://api.morphllm.com/v1', keywords: ['morph'] },
  { id: 'nano-gpt', name: 'NanoGPT', description: 'NanoGPT 按量付费聚合平台，OpenAI 兼容', protocol: 'openai', defaultApiUrl: 'https://nano-gpt.com/api/v1', keywords: ['nano', 'gpt', 'nanogpt'] },
  { id: 'nearai', name: 'NEAR AI Cloud', description: 'NEAR 去中心化 AI 云推理服务', protocol: 'openai', defaultApiUrl: 'https://cloud-api.near.ai/v1', keywords: ['near', 'ai', 'cloud'] },
  { id: 'nebius', name: 'Nebius Token Factory', description: 'Nebius Token Factory 托管推理服务', protocol: 'openai', defaultApiUrl: 'https://api.tokenfactory.nebius.com/v1', keywords: ['nebius', 'token', 'factory'] },
  { id: 'novita-ai', name: 'Novita AI', description: 'GPU 云与开源模型推理平台', protocol: 'openai', defaultApiUrl: 'https://api.novita.ai/openai', keywords: ['novita', 'ai'] },
  { id: 'nous-portal', name: 'Nous Portal', description: 'Nous Research 官方推理端点（Hermes 系列模型）', protocol: 'openai', defaultApiUrl: 'https://inference-api.nousresearch.com/v1', keywords: ['nous', 'nousresearch', 'hermes'] },
  { id: 'oci', name: 'OCI Generative AI', description: '甲骨文云 Generative AI 推理服务', protocol: 'openai', defaultApiUrl: 'https://inference.generativeai.us-chicago-1.oci.oraclecloud.com/openai/v1', keywords: ['oci', 'generative', 'ai'] },
  { id: 'ollama-cloud', name: 'Ollama Cloud', description: 'Ollama 官方云端托管推理', protocol: 'openai', defaultApiUrl: 'https://ollama.com/v1', keywords: ['ollama', 'cloud'] },
  { id: 'opencode-go', name: 'OpenCode Go', description: 'OpenCode Go 编程套餐模型端点', protocol: 'openai', defaultApiUrl: 'https://opencode.ai/inference/go/openai/v1', keywords: ['opencode', 'go'] },
  { id: 'ovhcloud', name: 'OVHcloud AI Endpoints', description: 'OVHcloud 欧洲云 AI 推理服务', protocol: 'openai', defaultApiUrl: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1', keywords: ['ovhcloud', 'ai', 'endpoints'] },
  { id: 'perplexity-agent', name: 'Perplexity Agent', description: 'Perplexity Agent API（Sonar）', protocol: 'openai', defaultApiUrl: 'https://api.perplexity.ai/v1', keywords: ['perplexity', 'agent'] },
  { id: 'pioneer', name: 'Pioneer', description: 'Fastino 的模型微调与推理平台', protocol: 'openai', defaultApiUrl: 'https://api.fastino.ai/v1', keywords: ['pioneer'] },
  { id: 'poe', name: 'Poe', description: 'Quora Poe 的模型 API', protocol: 'openai', defaultApiUrl: 'https://api.poe.com/v1', keywords: ['poe'] },
  { id: 'poolside', name: 'Poolside', description: 'Poolside 代码模型 API', protocol: 'openai', defaultApiUrl: 'https://inference.poolside.ai/v1', keywords: ['poolside'] },
  { id: 'prime', name: 'Prime Inference', description: 'Prime Intellect 去中心化推理', protocol: 'openai', defaultApiUrl: 'https://api.pinference.ai/api/v1', keywords: ['prime', 'inference'] },
  { id: 'qiniu-ai', name: 'Qiniu 七牛', description: '七牛云 AI 大模型推理（OpenAI 兼容）', protocol: 'openai', defaultApiUrl: 'https://api.qnaigc.com/v1', keywords: ['qiniu', '七牛', '七牛云', 'qnaigc'] },
  { id: 'reflection', name: 'Reflection', description: 'Reflection AI 推理端点', protocol: 'openai', defaultApiUrl: 'https://api.reflection.ai/openai/v1', keywords: ['reflection'] },
  { id: 'requesty', name: 'Requesty', description: 'Requesty LLM 路由网关，OpenAI 兼容', protocol: 'openai', defaultApiUrl: 'https://router.requesty.ai/v1', keywords: ['requesty', 'router'] },
  { id: 'sakana', name: 'Sakana AI', description: 'Sakana AI 模型 API', protocol: 'openai', defaultApiUrl: 'https://api.sakana.ai/v1', keywords: ['sakana', 'ai'] },
  { id: 'sambanova', name: 'SambaNova', description: 'SambaNova 云推理（RDU 芯片）', protocol: 'openai', defaultApiUrl: 'https://api.sambanova.ai/v1', keywords: ['sambanova'] },
  { id: 'sarvam', name: 'Sarvam AI', description: '印度多语言模型 API（Sarvam AI）', protocol: 'openai', defaultApiUrl: 'https://api.sarvam.ai/v1', keywords: ['sarvam', 'ai'] },
  { id: 'scaleway', name: 'Scaleway', description: '法国云厂商 Scaleway 生成式 AI 推理', protocol: 'openai', defaultApiUrl: 'https://api.scaleway.ai/v1', keywords: ['scaleway'] },
  { id: 'scnet-token-plan', name: 'SCNet Token Plan', description: '超算互联网 Token 套餐端点', protocol: 'openai', defaultApiUrl: 'https://api.scnet.cn/api/llm/v1', keywords: ['scnet', 'token', 'plan'] },
  { id: 'stackit', name: 'STACKIT', description: '德国 STACKIT 云的模型服务', protocol: 'openai', defaultApiUrl: 'https://api.openai-compat.model-serving.eu01.onstackit.cloud/v1', keywords: ['stackit'] },
  { id: 'synthetic', name: 'Synthetic', description: 'Synthetic.new 推理服务', protocol: 'openai', defaultApiUrl: 'https://api.synthetic.new/openai/v1', keywords: ['synthetic'] },
  { id: 'tencent-coding-plan', name: 'Tencent Coding Plan (China)', description: '腾讯云编程套餐模型端点', protocol: 'openai', defaultApiUrl: 'https://api.lkeap.cloud.tencent.com/coding/v3', keywords: ['tencent', 'coding', 'plan', 'china'] },
  { id: 'tencent-token-plan', name: 'Tencent Token Plan', description: '腾讯云 Token 套餐端点', protocol: 'openai', defaultApiUrl: 'https://api.lkeap.cloud.tencent.com/plan/v3', keywords: ['tencent', 'token', 'plan'] },
  { id: 'tencent-tokenhub', name: 'Tencent TokenHub', description: '腾讯 TokenHub 模型服务', protocol: 'openai', defaultApiUrl: 'https://tokenhub.tencentmaas.com/v1', keywords: ['tencent', 'tokenhub'] },
  { id: 'thinkingmachines', name: 'Thinking Machines', description: 'Thinking Machines 的 Tinker 推理 API', protocol: 'openai', defaultApiUrl: 'https://tinker.thinkingmachines.dev/services/tinker-prod/anthropic/api/v1', keywords: ['thinking', 'machines'] },
  { id: 'tinfoil', name: 'Tinfoil', description: '机密计算推理服务（tinfoil.sh）', protocol: 'openai', defaultApiUrl: 'https://inference.tinfoil.sh/v1', keywords: ['tinfoil'] },
  { id: 'upstage', name: 'Upstage', description: '韩国 Upstage Solar 模型 API', protocol: 'openai', defaultApiUrl: 'https://api.upstage.ai/v1/solar', keywords: ['upstage'] },
  { id: 'vercel', name: 'Vercel AI Gateway', description: 'Vercel AI 网关，OpenAI 兼容入口（ai-gateway.vercel.sh）', protocol: 'openai', defaultApiUrl: 'https://ai-gateway.vercel.sh/v1', keywords: ['vercel', 'gateway', 'ai'] },
  // Voyage AI 只有嵌入 / 重排接口，没有对话类模型
  { id: 'voyage', name: 'Voyage AI', description: 'Voyage AI 向量化与重排模型 API（嵌入专用）', protocol: 'openai', defaultApiUrl: 'https://api.voyageai.com/v1', keywords: ['voyage', 'embedding', 'rerank', '向量', '嵌入'] },
  { id: 'vultr', name: 'Vultr', description: 'Vultr 云 GPU 推理服务', protocol: 'openai', defaultApiUrl: 'https://api.vultrinference.com/v1', keywords: ['vultr'] },
  { id: 'wandb', name: 'CoreWeave', description: 'CoreWeave 推理服务（原 W&B Inference）', protocol: 'openai', defaultApiUrl: 'https://api.inference.wandb.ai/v1', keywords: ['coreweave'] },
  { id: 'xiaomi', name: 'Xiaomi', description: '小米 MiMo 大模型 API', protocol: 'openai', defaultApiUrl: 'https://api.xiaomimimo.com/v1', keywords: ['xiaomi'] },
  { id: 'xiaomi-token-plan-ams', name: 'Xiaomi Token Plan (Europe)', description: '小米 MiMo Token 套餐（欧洲）', protocol: 'openai', defaultApiUrl: 'https://token-plan-ams.xiaomimimo.com/v1', keywords: ['xiaomi', 'token', 'plan', 'europe'] },
  { id: 'xiaomi-token-plan-cn', name: 'Xiaomi Token Plan (China)', description: '小米 MiMo Token 套餐（中国）', protocol: 'openai', defaultApiUrl: 'https://token-plan-cn.xiaomimimo.com/v1', keywords: ['xiaomi', 'token', 'plan', 'china'] },
  { id: 'xiaomi-token-plan-sgp', name: 'Xiaomi Token Plan (Singapore)', description: '小米 MiMo Token 套餐（新加坡）', protocol: 'openai', defaultApiUrl: 'https://token-plan-sgp.xiaomimimo.com/v1', keywords: ['xiaomi', 'token', 'plan', 'singapore'] },
  { id: 'zai', name: 'Z.AI', description: '智谱 GLM 国际站 API（Z.AI）', protocol: 'openai', defaultApiUrl: 'https://api.z.ai/api/paas/v4', keywords: ['z', 'ai'] },
  { id: 'zai-coding-plan', name: 'Z.AI Coding Plan', description: '智谱 GLM 编程套餐端点', protocol: 'openai', defaultApiUrl: 'https://api.z.ai/api/coding/paas/v4', keywords: ['z', 'ai', 'coding', 'plan'] },
  { id: 'zenmux', name: 'ZenMux', description: '多模型统一网关（zenmux.ai）', protocol: 'openai', defaultApiUrl: 'https://zenmux.ai/api/v1', keywords: ['zenmux'] },

  // ===== 自定义 =====


  { id: 'custom', name: '自定义供应商', description: '自定义 OpenAI 兼容协议的供应商', protocol: 'openai', defaultApiUrl: '', keywords: ['custom'] },
]

// logo 由 ProviderLogo 组件统一处理：优先 .png，失败回退 .svg，均失败走 CardAvatar 首字母。
// 此处不再维护任何 logo 映射配置。

/**
 * 热门供应商：模板库置顶顺序（国内可直接开通的在前，其次国际主流）。
 * 只影响展示顺序与卡片角标，不改变模板本身的声明顺序与判重口径。
 */
export const HOT_PROVIDER_IDS: string[] = [
  'deepseek',
  'qwen',
  'volcengine',
  'openai',
  'anthropic',
  'google',
  'zhipu',
  'moonshot',
  'siliconflow',
  'openrouter',
  'xai',
  'mistral',
  'minimax',
  'tencent',
  'ollama',
  'free-channel',
  'router-group',
]

const HOT_RANK = new Map(HOT_PROVIDER_IDS.map((id, i) => [id, i]))

/** 是否热门模板（模板库卡片上的「热门」角标） */
export const isHotTemplate = (tpl: { id?: string } | null | undefined): boolean =>
  !!tpl?.id && HOT_RANK.has(tpl.id)

/**
 * 热门置顶排序：热门按 HOT_PROVIDER_IDS 的顺序排在最前，其余保持原有声明顺序。
 * 用稳定分组而不是整体重排，避免非热门模板在每次新增供应商时跳位。
 */
export const sortTemplatesByHot = <T extends { id?: string }>(list: T[]): T[] => {
  const hot: T[] = []
  const rest: T[] = []
  list.forEach((tpl) => (isHotTemplate(tpl) ? hot : rest).push(tpl))
  hot.sort((a, b) => (HOT_RANK.get(a.id!) ?? 0) - (HOT_RANK.get(b.id!) ?? 0))
  return [...hot, ...rest]
}

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
