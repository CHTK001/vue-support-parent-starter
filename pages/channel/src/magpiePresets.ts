/**
 * magpie 内置预设目录：「新增上游」里「预设」下拉的选项。
 *
 * <p><b>为什么要这张表</b>：magpie 的 {@code presets} 只存在于它自己的
 * {@code GET /api/providers} 响应里，而我们的 {@code /api/channels/magpie/providers}
 * 在 {@code MagpieUpstreamAdmin.list()} 与 {@code ApiChannelAuthController}
 * 两层都只挑固定字段转发，预设目录到不了前端。与其为了一个下拉改两个模块并重启
 * 共享的 8082，不如在这里放一份快照：选预设时用户只需要补 API Key，
 * 地址与模型目录由 magpie 按预设补全。</p>
 *
 * <p><b>数据来源</b>：magpie 0.1.3257（2026-11-08 实抓）。magpie 升级新增预设时，
 * 跑 {@code test/channel-management/magpie-ownership/dump-magpie-presets.mjs} 对照补行；
 * 不补不会出错，只是下拉里没有它，用户仍可切「自定义地址」接入。</p>
 *
 * <p>{@code host} 用于选中后说明「请求会发到哪」，{@code keys} 是官方拿 Key 的页面
 * （没有的留空，前端就不显示链接）。排序按 厂商直连 → 中转 → 合作方 → 本地 → 远程，
 * 让下拉一打开就是常见选择。</p>
 */
export interface MagpiePreset {
  /** 写进网关的预设标识，同时作为新上游的默认 ID */
  id: string
  /** 给人看的名字 */
  name: string
  /** vendor / relay / partner / local / remote */
  kind: string
  /** 上游主机（选中后展示） */
  host: string
  /** 官方 API Key 页面；没有则空串 */
  keys: string
}

export const MAGPIE_PRESETS: MagpiePreset[] = [
  // ── 厂商直连 ──
  { id: 'anthropic', name: 'Anthropic', kind: 'vendor', host: 'console.anthropic.com', keys: 'https://console.anthropic.com/settings/keys' },
  { id: 'openai', name: 'OpenAI', kind: 'vendor', host: 'api.openai.com', keys: 'https://platform.openai.com/api-keys' },
  { id: 'google', name: 'Google Gemini', kind: 'vendor', host: 'generativelanguage.googleapis.com', keys: 'https://aistudio.google.com/apikey' },
  { id: 'google-vertex', name: 'Google Vertex AI', kind: 'vendor', host: 'docs.cloud.google.com', keys: '' },
  { id: 'deepseek', name: 'DeepSeek', kind: 'vendor', host: 'api.deepseek.com', keys: 'https://platform.deepseek.com/api_keys' },
  { id: 'xai', name: 'xAI', kind: 'vendor', host: 'api.x.ai', keys: 'https://console.x.ai' },
  { id: 'moonshot', name: 'Kimi', kind: 'vendor', host: 'api.moonshot.ai', keys: 'https://platform.kimi.ai/console/api-keys?aff=magpie' },
  { id: 'moonshot-cn', name: 'Kimi (China)', kind: 'vendor', host: 'api.moonshot.cn', keys: 'https://platform.kimi.com/console/api-keys?aff=magpie' },
  { id: 'kimi-code', name: 'Kimi Code', kind: 'vendor', host: 'api.kimi.ai', keys: 'https://www.kimi.ai/code/console?aff=magpie' },
  { id: 'kimi-code-cn', name: 'Kimi Code (China)', kind: 'vendor', host: 'api.kimi.com', keys: 'https://www.kimi.com/code/console?aff=magpie' },
  { id: 'zhipu', name: 'Zhipu GLM', kind: 'vendor', host: 'open.bigmodel.cn', keys: 'https://open.bigmodel.cn/usercenter/proj-mgmt/apikeys' },
  { id: 'zai', name: 'Z.ai', kind: 'vendor', host: 'api.z.ai', keys: 'https://z.ai/manage-apikey/apikey-list' },
  { id: 'minimax', name: 'MiniMax', kind: 'vendor', host: 'api.minimax.io', keys: 'https://platform.minimax.io/user-center/basic-information/interface-key' },
  { id: 'minimax-cn', name: 'MiniMax (China)', kind: 'vendor', host: 'api.minimaxi.com', keys: 'https://platform.minimaxi.com/user-center/basic-information/interface-key' },
  { id: 'stepfun', name: 'StepFun', kind: 'vendor', host: 'api.stepfun.ai', keys: 'https://platform.stepfun.ai/interface-key' },
  { id: 'stepfun-cn', name: 'StepFun (China)', kind: 'vendor', host: 'api.stepfun.com', keys: 'https://platform.stepfun.com/interface-key' },
  { id: 'xiaomi', name: 'Xiaomi MiMo', kind: 'vendor', host: 'token-plan-cn.xiaomimimo.com', keys: 'https://platform.xiaomimimo.com/token-plan' },
  { id: 'longcat', name: 'LongCat', kind: 'vendor', host: 'api.longcat.chat', keys: 'https://longcat.chat/platform/api_keys' },
  { id: 'baidu-qianfan', name: 'Baidu Qianfan', kind: 'vendor', host: 'qianfan.baidubce.com', keys: 'https://console.bce.baidu.com/qianfan/resource/token-plan' },
  { id: 'tencent-cloud', name: 'Tencent Cloud', kind: 'vendor', host: 'tokenhub.tencentmaas.com', keys: 'https://console.cloud.tencent.com/tokenhub/tokenplan' },
  { id: 'huaweicloud', name: 'Huawei Cloud MaaS', kind: 'vendor', host: 'api.modelarts-maas.com', keys: 'https://console.huaweicloud.com/modelarts/?#/model-studio/authmanage' },
  { id: 'volcengine', name: 'Volcengine Ark', kind: 'vendor', host: 'ark.cn-beijing.volces.com', keys: 'https://ark.volcengine.com/region:cn-beijing/apikey' },
  { id: 'qwen', name: 'Qwen', kind: 'vendor', host: 'dashscope-intl.aliyuncs.com', keys: 'https://modelstudio.console.alibabacloud.com/?tab=playground#/api-key' },
  { id: 'qwen-cn', name: 'Qwen (China)', kind: 'vendor', host: 'dashscope.aliyuncs.com', keys: 'https://bailian.console.aliyun.com/?tab=model#/api-key' },
  { id: 'qwen-token-plan', name: 'Qwen Token Plan', kind: 'vendor', host: 'token-plan.maas.qianwenaiapi.com', keys: 'https://platform.qianwenai.com/home/analytics/token-plan/individual' },
  { id: 'bailian-token-plan', name: 'Bailian Token Plan', kind: 'vendor', host: 'token-plan.cn-beijing.maas.aliyuncs.com', keys: 'https://bailian.console.aliyun.com/cn-beijing/subscription/token-plan/personal' },
  { id: 'qwencloud-token-plan', name: 'Qwen Cloud Token Plan', kind: 'vendor', host: 'token-plan.maas.qwencloudapi.com', keys: 'https://home.qwencloud.com/analytics/token-plan/individual' },
  { id: 'qwencloud', name: 'Qwen Cloud', kind: 'vendor', host: 'ap-southeast-1.maas.qwencloudapi.com', keys: 'https://home.qwencloud.com/api-keys' },
  { id: 'mistral', name: 'Mistral', kind: 'vendor', host: 'api.mistral.ai', keys: 'https://console.mistral.ai/api-keys' },
  { id: 'voyage', name: 'Voyage AI', kind: 'vendor', host: 'api.voyageai.com', keys: 'https://dashboard.voyageai.com/organization/api-keys' },
  { id: 'groq', name: 'Groq', kind: 'vendor', host: 'api.groq.com', keys: 'https://console.groq.com/keys' },
  { id: 'bedrock', name: 'Amazon Bedrock', kind: 'vendor', host: 'bedrock-runtime.us-east-1.amazonaws.com', keys: 'https://console.aws.amazon.com/bedrock/home#/api-keys' },
  { id: 'bedrock-mantle', name: 'Amazon Bedrock (Mantle)', kind: 'vendor', host: 'bedrock-mantle.us-east-1.api.aws', keys: 'https://console.aws.amazon.com/bedrock/home#/api-keys' },
  { id: 'azure', name: 'Azure OpenAI', kind: 'vendor', host: 'ai.azure.com', keys: 'https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/OpenAI' },
  { id: 'ollama-cloud', name: 'Ollama Cloud', kind: 'vendor', host: 'ollama.com', keys: 'https://ollama.com/settings/keys' },
  { id: 'nous', name: 'Nous Portal', kind: 'vendor', host: 'inference-api.nousresearch.com', keys: 'https://portal.nousresearch.com' },
  { id: 'typesafe', name: 'TypeSafe Jev', kind: 'vendor', host: 'typesafe.ai', keys: 'https://console.typesafe.ai/keys' },
  { id: 'bailian-decision', name: 'Bailian Decision Model', kind: 'vendor', host: 'help.aliyun.com', keys: 'https://bailian.console.aliyun.com/?tab=model#/api-key' },
  { id: 'qwen-decision', name: 'Qwen Decision Model', kind: 'vendor', host: 'www.qianwenai.com', keys: 'https://platform.qianwenai.com/home/api-keys' },
  { id: 'volcengine-decision', name: 'Volcengine Ark Decision', kind: 'vendor', host: 'www.volcengine.com', keys: 'https://ark.volcengine.com/region:cn-beijing/apikey' },

  // ── 中转 / 聚合 ──
  { id: 'openrouter', name: 'OpenRouter', kind: 'relay', host: 'openrouter.ai', keys: 'https://openrouter.ai/keys' },
  { id: 'opencode-go', name: 'OpenCode Go', kind: 'relay', host: 'opencode.ai', keys: 'https://opencode.ai/auth' },
  { id: 'clinepass', name: 'ClinePass', kind: 'relay', host: 'api.cline.bot', keys: 'https://app.cline.bot' },
  { id: 'opencode-zen', name: 'OpenCode Zen', kind: 'relay', host: 'opencode.ai', keys: 'https://opencode.ai/auth' },
  { id: 'kilo', name: 'Kilo Gateway', kind: 'relay', host: 'api.kilo.ai', keys: 'https://app.kilo.ai' },
  { id: 'commandcode', name: 'Command Code', kind: 'relay', host: 'api.commandcode.ai', keys: 'https://commandcode.ai/settings/keys' },
  { id: 'together', name: 'Together AI', kind: 'relay', host: 'api.together.xyz', keys: 'https://api.together.ai/settings/api-keys' },
  { id: 'fireworks', name: 'Fireworks', kind: 'relay', host: 'api.fireworks.ai', keys: 'https://app.fireworks.ai/settings/users/api-keys' },
  { id: 'siliconflow', name: 'SiliconFlow', kind: 'relay', host: 'api.siliconflow.cn', keys: 'https://cloud.siliconflow.cn/account/ak' },
  { id: 'nvidia', name: 'NVIDIA NIM', kind: 'relay', host: 'integrate.api.nvidia.com', keys: 'https://build.nvidia.com/settings/api-keys' },
  { id: 'modelscope', name: 'ModelScope', kind: 'relay', host: 'api-inference.modelscope.cn', keys: 'https://modelscope.cn/my/myaccesstoken' },
  { id: 'aihubmix', name: 'AiHubMix', kind: 'relay', host: 'aihubmix.com', keys: 'https://console.aihubmix.com/token' },
  { id: 'pipellm', name: 'PipeLLM', kind: 'relay', host: 'api.pipellm.ai', keys: 'https://console.pipellm.ai' },
  { id: '302ai', name: '302.AI', kind: 'relay', host: 'api.302.ai', keys: 'https://302.ai/api-keys/list' },
  { id: 'cherryin', name: 'CherryIN', kind: 'relay', host: 'open.cherryin.ai', keys: 'https://open.cherryin.ai/console/token' },
  { id: 'yylx', name: '鱼鱼连线', kind: 'relay', host: 'app.yylx.io', keys: 'https://app.yylx.io/keys' },
  { id: 'vercel-jev', name: 'Jev · Vercel AI Gateway', kind: 'relay', host: 'vercel.com', keys: 'https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai-gateway%2Fapi-keys' },
  { id: 'cloudflare-jev', name: 'Cloudflare Workers AI · Jev, Clef', kind: 'relay', host: 'developers.cloudflare.com', keys: 'https://dash.cloudflare.com/profile/api-tokens' },

  // ── magpie 合作方 ──
  { id: 'kimi', name: 'Kimi Code', kind: 'partner', host: 'api.kimi.com', keys: 'https://usemagpie.ai/go/kimi/keys/cn' },
  { id: 'apikeyfan', name: 'APIKEY.FAN', kind: 'partner', host: 'api.apikey.fan', keys: 'https://usemagpie.ai/go/apikeyfan/keys' },
  { id: 'wandapi', name: 'WandAPI', kind: 'partner', host: 'api.wandapi.ai', keys: 'https://usemagpie.ai/go/wandapi/keys' },
  { id: 'corecode', name: 'CoreCode', kind: 'partner', host: 'corecode.live', keys: 'https://usemagpie.ai/go/corecode/keys' },
  { id: 'sidrune', name: 'Sidrune AI', kind: 'partner', host: 'sidrune.ai', keys: 'https://usemagpie.ai/go/sidrune/keys/cn' },
  { id: 'fastai', name: 'FastAIToken', kind: 'partner', host: 'www.fastaitoken.com', keys: 'https://usemagpie.ai/go/fastai/keys' },

  // ── 本地模型 ──
  { id: 'ollama', name: 'Ollama', kind: 'local', host: 'localhost:11434', keys: '' },
  { id: 'lmstudio', name: 'LM Studio', kind: 'local', host: 'localhost:1234', keys: '' },
  { id: 'omlx', name: 'oMLX', kind: 'local', host: 'localhost:8000', keys: '' },
  { id: 'mlx-serve', name: 'MLX-Serve', kind: 'local', host: 'localhost:11234', keys: '' },

  // ── 远程网关 ──
  { id: 'remote-magpie', name: 'Remote magpie', kind: 'remote', host: '', keys: '' },
]

/** 预设 id → 条目；未知 id 返回 undefined（编辑老数据时会兜底显示原值） */
export function magpiePresetOf(id: string): MagpiePreset | undefined {
  return MAGPIE_PRESETS.find((p) => p.id === id)
}
