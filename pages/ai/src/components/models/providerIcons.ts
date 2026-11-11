// 供应商图标统一配置
// ============================================================
// 所有供应商图标映射集中在这里，新增供应商只需在此添加一行。
//
// key   = 供应商品牌 id（与 ProviderLogo 的 pid 对应）
// value = 图标文件名（含扩展名），对应 public/images/providers/{value}
//
// 注意：
// - 图标文件**只**放在 apps/vue-support-ai-starter/public/images/providers/，
//   其他应用（system / monitor / eduai …）由 createVite 的 serveSharedAiImages
//   插件按 /images/** 从这一份目录回源，仓库根 public/images 不再保留副本。
// - 优先用 .svg（矢量清晰），其次 .png；官方只发布位图的品牌才用 png
// ============================================================

import { PROVIDER_TEMPLATES } from './model.constants'

export const PROVIDER_ICONS: Record<string, string> = {
  // ===== 国际主流 =====
  openai: 'openai.svg',
  anthropic: 'anthropic.svg',
  google: 'google.svg',
  azure: 'azure.png',
  'aws-bedrock': 'aws-bedrock.png',
  xai: 'xai.svg',
  mistral: 'mistral.svg',
  groq: 'groq.svg',
  together: 'together.png',
  cerebras: 'cerebras.png',
  cohere: 'cohere.png',
  perplexity: 'perplexity.png',
  huggingface: 'huggingface.png',
  nvidia: 'nvidia.svg',

  // ===== 聚合 / 路由 =====
  openrouter: 'openrouter.svg',
  commandcode: 'commandcode.png',
  agnes: 'agnes.svg',
  opencode: 'opencode.svg',
  'opencode-go': 'opencode.svg',
  siliconflow: 'siliconflow.svg',
  'siliconflow-cn': 'siliconflow.svg',
  bai: 'bai.png',
  ai302: 'ai302.svg',
  '302ai': '302ai.svg',
  '360ai': '360ai.svg',
  dots: 'dots.png',
  'perplexity-agent': 'perplexity.png',

  // ===== 国产厂商 =====
  qwen: 'qwen.png',
  'alibaba': 'qwen.png',
  'alibaba-cn': 'qwen.png',
  'alibaba-coding-plan': 'qwen.png',
  'alibaba-coding-plan-cn': 'qwen.png',
  'alibaba-token-plan': 'qwen.png',
  'alibaba-token-plan-cn': 'qwen.png',
  'aliyun-bailian': 'aliyun-bailian.svg',
  baidu: 'baidu.svg',
  'baidu-wenxin': 'baidu-wenxin.png',
  qianfan: 'qianfan.png',
  doubao: 'doubao.png',
  volcengine: 'volcengine.svg',
  'volcengine-coding-plan': 'volcengine.svg',
  spark: 'spark.png',
  flytek: 'flytek.png',
  hunyuan: 'hunyuan.png',
  tencent: 'tencent.png',
  'tencent-coding-plan': 'tencent.png',
  'tencent-token-plan': 'tencent.png',
  'tencent-tokenhub': 'tencent.png',
  zhipu: 'zhipu.png',
  'zhipuai': 'zhipu.png',
  'zhipuai-coding-plan': 'zhipu.png',
  minimax: 'minimax.svg',
  'minimax-cn': 'minimax.svg',
  'minimax-coding-plan': 'minimax.svg',
  'minimax-cn-coding-plan': 'minimax.svg',
  moonshot: 'moonshot.png',
  'moonshotai': 'moonshot.png',
  'moonshotai-cn': 'moonshot.png',
  'kimi-code-plan-cn': 'moonshot.png',
  'kimi-code-plan-global': 'moonshot.png',
  deepseek: 'deepseek.svg',
  baichuan: 'baichuan.png',
  stepfun: 'stepfun.svg',
  'stepfun-ai': 'stepfun.svg',
  'stepfun-step-plan': 'stepfun.svg',
  'stepfun-ai-step-plan': 'stepfun.svg',
  modelscope: 'modelscope.png',
  sensenova: 'sensenova.png',
  sensetime: 'sensenova.png',
  longcat: 'longcat.svg',
  iflytek: 'spark.png',


  // ===== 路由 / 免费 / 兼容（模型管理侧自定标识，干净品牌图标） =====
  'router-group': 'router-group.svg',
  'free-channel': 'free-channel.svg',
  free: 'free.svg',
  'openai-compatible': 'openai-compatible.svg',
  moss: 'moss.svg',
  newapi: 'newapi.png',
  tempr: 'tempr.svg',

  // ===== 本地 / 其他 =====
  onnx: 'onnx.svg',
  ollama: 'ollama.png',
  'ollama-cloud': 'ollama.png',
  custom: '', // 无图标，走首字母
  agent: '', // 虚拟供应商，无图标

  // ===== OAuth 渠道 =====
  cline: 'cline.svg',
  'cline-pass': 'cline-pass.png',
  qoder: 'qoder.png',
  'qoder-cn': 'qoder.png',
  gemini: 'gemini.svg',
  trae: 'trae.svg',
  zcode: 'zcode.png',
  raccoon: 'raccoon.png',
  loomy: 'loomy.png',
  lobsterai: 'lobsterai.png',

  // ===== Models.dev 扩展厂商 =====
  // 以下按字母顺序排列，图标文件名与 key 相同（.png 或 .svg）
  abacus: 'abacus.png',
  'abliteration-ai': 'abliteration-ai.png',
  above: 'above.png',
  agentrouter: 'agentrouter.png',
  'ai-router': 'ai-router.png',
  ai21: 'ai21.png',
  aiand: 'aiand.png',
  aimlapi: 'aimlapi.png',
  ainetcafe: 'ainetcafe.png',
  aixy: 'aixy.png',
  'aki-io': 'aki-io.png',
  ambient: 'ambient.png',
  amd: 'amd.png',
  anyapi: 'anyapi.png',
  arcee: 'arcee.png',
  auriko: 'auriko.png',
  bailing: 'bailing.png',
  baseten: 'baseten.png',
  bee: 'bee.png',
  berget: 'berget.png',
  blueclaw: 'blueclaw.png',
  bothub: 'bothub.png',
  boundless: 'boundless.png',
  chutes: 'chutes.png',
  clarifai: 'clarifai.png',
  claudinio: 'claudinio.png',
  'cloudferro-sherlock': 'cloudferro-sherlock.png',
  coralbricks: 'coralbricks.png',
  cortecs: 'cortecs.png',
  crossmodel: 'crossmodel.png',
  crusoe: 'crusoe.png',
  daoxe: 'daoxe.png',
  digitalocean: 'digitalocean.png',
  dinference: 'dinference.png',
  drun: 'drun.png',
  ebcloud: 'ebcloud.png',
  echo: 'echo.png',
  edenai: 'edenai.png',
  empiriolabs: 'empiriolabs.png',
  engy: 'engy.png',
  evroc: 'evroc.png',
  fastrouter: 'fastrouter.png',
  'fireworks-ai': 'fireworks-ai.png',
  freemodel: 'freemodel.png',
  friendli: 'friendli.png',
  frogbot: 'frogbot.png',
  'github-copilot': 'github-copilot.png',
  gmicloud: 'gmicloud.png',
  greenpt: 'greenpt.png',
  helicone: 'helicone.png',
  hetzner: 'hetzner.png',
  'hpc-ai': 'hpc-ai.png',
  hyper: 'hyper.png',
  iflowcn: 'iflowcn.png',
  impossibl: 'impossibl.png',
  inception: 'inception.png',
  inceptron: 'inceptron.png',
  inco: 'inco.png',
  infer: 'infer.png',
  inference: 'inference.png',
  inferx: 'inferx.png',
  'io-net': 'io-net.png',
  iteracompute: 'iteracompute.png',
  jalapeno: 'jalapeno.png',
  jiekou: 'jiekou.png',
  kenari: 'kenari.png',
  kilo: 'kilo.svg',
  klokintegration: 'klokintegration.png',
  kosmik: 'kosmik.png',
  'kuae-cloud-coding-plan': 'kuae-cloud-coding-plan.png',
  lilac: 'lilac.png',
  liquid: 'liquid.png',
  llama: 'llama.png',
  llmgateway: 'llmgateway.png',
  'llmgateway-providers': 'llmgateway-providers.png',
  llmtech: 'llmtech.png',
  llmtr: 'llmtr.png',
  lowrouter: 'lowrouter.png',
  lucidquery: 'lucidquery.png',
  meganova: 'meganova.png',
  melious: 'melious.png',
  'merge-gateway': 'merge-gateway.png',
  mixlayer: 'mixlayer.png',
  moark: 'moark.png',
  modal: 'modal.png',
  'model-oracle-ai': 'model-oracle-ai.png',
  modelis: 'modelis.png',
  morph: 'morph.png',
  nan: 'nan.png',
  'nano-gpt': 'nano-gpt.png',
  nearai: 'nearai.png',
  nebius: 'nebius.png',
  neosmith: 'neosmith.png',
  neuralwatt: 'neuralwatt.png',
  nova: 'nova.png',
  'novita-ai': 'novita-ai.png',
  oci: 'oci.png',
  ofox: 'ofox.png',
  openreason: 'openreason.png',
  opper: 'opper.png',
  orcarouter: 'orcarouter.png',
  ovhcloud: 'ovhcloud.png',
  pareto: 'pareto.png',
  pendra: 'pendra.png',
  pioneer: 'pioneer.png',
  poe: 'poe.png',
  poolside: 'poolside.png',
  prime: 'prime.png',
  'qihang-ai': 'qihang-ai.png',
  'qiniu-ai': 'qiniu-ai.png',
  reflection: 'reflection.png',
  'regolo-ai': 'regolo-ai.png',
  requesty: 'requesty.png',
  'routing-run': 'routing-run.png',
  runinfra: 'runinfra.png',
  sakana: 'sakana.png',
  sambanova: 'sambanova.png',
  sarvam: 'sarvam.png',
  scaleway: 'scaleway.png',
  'scnet-token-plan': 'scnet-token-plan.png',
  'scx-ai': 'scx-ai.png',
  stackit: 'stackit.png',
  standardcompute: 'standardcompute.png',
  subconscious: 'subconscious.png',
  submodel: 'submodel.png',
  synthetic: 'synthetic.png',
  tensorx: 'tensorx.png',
  'the-grid-ai': 'the-grid-ai.png',
  thinkingmachines: 'thinkingmachines.png',
  'thinking-machines': 'thinkingmachines.png',
  tinfoil: 'tinfoil.png',
  tokengo: 'tokengo.png',
  tokenrouter: 'tokenrouter.png',
  trustedrouter: 'trustedrouter.png',
  'umans-ai': 'umans-ai.png',
  'umans-ai-coding-plan': 'umans-ai-coding-plan.png',
  unorouter: 'unorouter.png',
  upstage: 'upstage.png',
  vancine: 'vancine.png',
  vispark: 'vispark.png',
  vivgrid: 'vivgrid.png',
  vultr: 'vultr.png',
  'wafer.ai': 'wafer.ai.png',
  wallaby: 'wallaby.png',
  wandb: 'wandb.png',
  coreweave: 'wandb.png',
  xiaomi: 'xiaomi.png',
  'xiaomi-token-plan-ams': 'xiaomi.png',
  'xiaomi-token-plan-cn': 'xiaomi.png',
  'xiaomi-token-plan-sgp': 'xiaomi.png',
  xpersona: 'xpersona.png',
  zai: 'zai.png',
  'zai-coding-plan': 'zai.png',
  zeldoc: 'zeldoc.png',
  zenifra: 'zenifra.png',
  zenmux: 'zenmux.png',
  meta: 'meta.svg',

  // ===== 特殊别名 =====
  'openai-response': 'openai.svg',
  huiqing: 'huiqing.svg',
  mock: 'mock.svg',
  xqapi: 'xqapi.svg',
  shusheng: 'shusheng.svg',
  '360': '360.svg',
}

// 以下常量由 model.utils.ts 导入使用

// 模板库所有 id（含已下载图标的），用于 resolveProviderBrand 兜底匹配
const TEMPLATE_BRAND_IDS = new Set(PROVIDER_TEMPLATES.map((t) => String(t.id).toLowerCase()))

// 已知品牌 id（与 public/images/providers 下的图标文件名对应，不含扩展名）
const BRAND_IDS = new Set(Object.keys(PROVIDER_ICONS))

// 这些是「协议」值，单独出现不能作为品牌（避免把中转服务误标成 OpenAI）
export const PROTOCOL_IDS = new Set(['', 'openai', 'openai-response', 'anthropic', 'gemini', 'agent', 'custom'])

// base_url 域名片段 -> 品牌（按顺序匹配，靠前的优先）
const DOMAIN_BRANDS: Array<[string, string]> = [
  ['deepseek', 'deepseek'],
  ['agnes', 'agnes'],
  ['openrouter', 'openrouter'],
  ['commandcode', 'commandcode'],
  ['siliconflow', 'siliconflow'],
  ['bigmodel', 'zhipu'],
  ['moonshot', 'moonshot'],
  ['minimax', 'minimax'],
  ['baichuan', 'baichuan'],
  ['stepfun', 'stepfun'],
  ['sensenova', 'sensenova'],
  ['volcengine', 'volcengine'],
  ['ark.cn', 'volcengine'],
  ['xf-yun', 'spark'],
  ['spark-api', 'spark'],
  ['hunyuan', 'hunyuan'],
  ['tencent', 'tencent'],
  ['modelscope', 'modelscope'],
  ['dashscope', 'qwen'],
  ['qianfan', 'baidu'],
  ['baidu', 'baidu'],
  ['360', '360ai'],
  ['ai302', 'ai302'],
  ['302.ai', 'ai302'],
  ['opencode', 'opencode'],
  // 免费池里 api.kilo.ai 是另一条上游通道，图标按通道走，不再落到聚合供应商
  ['kilo', 'kilo'],
  ['ollama', 'ollama'],
  ['onnx', 'onnx'],
  ['x.ai', 'xai'],
  ['mistral', 'mistral'],
  ['groq', 'groq'],
  ['together', 'together'],
  ['cerebras', 'cerebras'],
  ['cohere', 'cohere'],
  ['perplexity', 'perplexity'],
  ['huggingface', 'huggingface'],
  ['nvidia', 'nvidia'],
  ['anthropic', 'anthropic'],
  ['openai.com', 'openai'],
  ['google', 'google'],
  ['gemini', 'google'],
  ['googleapis', 'google'],
  ['azure', 'azure'],
  ['bedrock', 'aws-bedrock'],
  ['longcat', 'longcat'],
  ['huiqing', 'huiqing'],
  ['xqapi', 'xqapi'],
  ['b.ai', 'bai'],
  ['ai.cn', 'dots'],
  ['discovery-api.intern-ai.org.cn', 'shusheng'],
]

// 名称片段 -> 品牌（中文/英文名兜底）
const NAME_BRANDS: Array<[string, string]> = [
  ['deepseek', 'deepseek'], ['深度求索', 'deepseek'],
  ['agnes', 'agnes'],
  ['openrouter', 'openrouter'],
  ['commandcode', 'commandcode'],
  ['siliconflow', 'siliconflow'], ['硅基', 'siliconflow'],
  ['zhipu', 'zhipu'], ['智谱', 'zhipu'], ['glm', 'zhipu'],
  ['moonshot', 'moonshot'], ['kimi', 'moonshot'], ['月之暗面', 'moonshot'],
  ['minimax', 'minimax'], ['海螺', 'minimax'],
  ['baichuan', 'baichuan'], ['百川', 'baichuan'],
  ['stepfun', 'stepfun'], ['阶跃', 'stepfun'],
  ['sensenova', 'sensenova'], ['商汤', 'sensenova'],
  ['volcengine', 'volcengine'], ['方舟', 'volcengine'],
  ['doubao', 'doubao'], ['豆包', 'doubao'],
  ['spark', 'spark'], ['星火', 'spark'], ['讯飞', 'spark'],
  ['hunyuan', 'hunyuan'], ['混元', 'hunyuan'],
  ['tencent', 'tencent'], ['腾讯', 'tencent'],
  ['modelscope', 'modelscope'], ['魔搭', 'modelscope'],
  ['qwen', 'qwen'], ['通义', 'qwen'], ['千问', 'qwen'], ['dashscope', 'qwen'], ['阿里', 'qwen'],
  ['qianfan', 'baidu'], ['千帆', 'baidu'], ['文心', 'baidu'], ['baidu', 'baidu'], ['百度', 'baidu'],
  ['360', '360ai'],
  ['mistral', 'mistral'],
  ['groq', 'groq'],
  ['together', 'together'],
  ['cerebras', 'cerebras'],
  ['cohere', 'cohere'],
  ['perplexity', 'perplexity'],
  ['huggingface', 'huggingface'],
  ['nvidia', 'nvidia'],
  ['anthropic', 'anthropic'], ['claude', 'anthropic'],
  ['openai', 'openai'], ['gpt', 'openai'],
  ['gemini', 'gemini'], ['google', 'google'],
  // 账号渠道：名称兜底（platform 可能是脏值，靠 name 命中）
  ['cline', 'cline'], ['qoder', 'qoder'], ['trae', 'trae'],
  ['zcode', 'zcode'], ['raccoon', 'raccoon'], ['loomy', 'loomy'],
  ['lobsterai', 'lobsterai'], ['opencode', 'opencode'],
  ['azure', 'azure'],
  ['bedrock', 'aws-bedrock'],
  ['ollama', 'ollama'],
  ['onnx', 'onnx'],
  ['dots', 'dots'], ['点点', 'dots'],
  ['xai', 'xai'], ['grok', 'xai'],
  ['opencode', 'opencode'],
  ['ai302', 'ai302'],
  ['longcat', 'longcat'],
  ['huiqing', 'huiqing'],
  ['xqapi', 'xqapi'],
  ['b.ai', 'bai'],
  ['shusheng', 'shusheng'],
  ['书生', 'shusheng'],
]

/**
 * 从供应商对象解析品牌 id（用于 ProviderLogo）。
 * 优先用 base_url 域名匹配，其次名称匹配，最后 platform。
 */
export function resolveProviderBrand(p: any): string {
  if (!p) return 'custom'
  const rawId = String(p.provider_id || p.id || '').toLowerCase()
  if (rawId === 'agent') return 'agent'

  // 1) 域名优先
  const rawUrl = String(p.base_url || p.apiUrl || p.api_url || '')
  let host = rawUrl.toLowerCase()
  try { host = new URL(rawUrl).host.toLowerCase() } catch { /* keep raw */ }
  for (const [token, brand] of DOMAIN_BRANDS) {
    if (host.includes(token)) return brand
  }

  // 2) 名称兜底
  const nm = String(p.name || '').toLowerCase().replace(/[\s\-_/()（）]+/g, '')
  for (const [token, brand] of NAME_BRANDS) {
    if (nm.includes(token)) return brand
  }

  // 2b) 模板名称兜底
  for (const tpl of PROVIDER_TEMPLATES) {
    const tplNm = String(tpl.name || '').toLowerCase().replace(/[\s\-_/()（）]+/g, '')
    if (tplNm && nm.includes(tplNm)) return String(tpl.id).toLowerCase()
  }

  // 3) platform 本身就是品牌
  const plat = String(p.platform || p.provider || '').toLowerCase()
  if (plat && !PROTOCOL_IDS.has(plat) && (BRAND_IDS.has(plat) || TEMPLATE_BRAND_IDS.has(plat))) {
    return plat
  }
  return 'custom'
}

/**
 * 模型行的上游通道 baseUrl。
 *
 * <p>免费聚合渠道（FreeChannel）把同一批模型按路由拆到不同上游：
 * {@code https://opencode.ai/...}、{@code https://api.kilo.ai/...}、{@code https://free.xort.fun/...}。
 * 批量录入时后端把「协议 · baseUrl · 认证方式」写进了模型描述，因此从描述里取
 * 第一个 http(s) 地址即可还原这一行走的是哪条上游通道；前端若已经拿到
 * base_url / baseUrl 字段则优先用它。</p>
 *
 * @param model 模型行
 * @returns baseUrl；拿不到返回空串
 */
export function upstreamBaseUrlOf(model: any): string {
  if (!model) return ''
  for (const key of ['base_url', 'baseUrl', 'api_url']) {
    const v = model[key]
    if (typeof v === 'string' && /^https?:\/\//i.test(v)) return v
  }
  const desc = String(model.description || '')
  const hit = desc.match(/https?:\/\/[^\s·|;,，]+/i)
  return hit ? hit[0] : ''
}

/**
 * 模型行的上游通道品牌 id（交给 ProviderLogo 出图标）。
 *
 * <p>与「从供应商获取模型」弹窗行首的通道图标同一套 {@link resolveProviderBrand}：
 * 聚合渠道下的模型不再一律显示聚合供应商自己的 logo，而是显示真正接的
 * opencode / kilo / xort 等通道图标；解析不出时返回空串，由调用方回退供应商 logo。</p>
 *
 * @param model 模型行
 * @returns 品牌 id；解析不出返回空串
 */
export function resolveModelChannelBrand(model: any): string {
  const url = upstreamBaseUrlOf(model)
  if (!url) return ''
  // 只按域名认通道：模型的 provider 字段是**协议**（openai / anthropic），
  // 不能拿去走名称兜底，否则所有走聚合渠道的模型都会被认成 OpenAI。
  const protocol = String(model?.provider || '').toLowerCase()
  const brand = resolveProviderBrand({
    base_url: url,
    ...(protocol && !PROTOCOL_IDS.has(protocol) ? { provider: protocol } : {}),
  })
  return brand && brand !== 'custom' ? brand : ''
}
