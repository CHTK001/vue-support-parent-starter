/**
 * magpie 社区插件渠道快照：左栏「Magpie 插件」分组的数据源。
 *
 * <p><b>为什么是一张前端快照</b>：插件市场清单只有 magpie 管理面的
 * {@code GET /api/plugins?market=true} 才有，而且要访问 npm / GitHub，慢且可能离线；
 * 我们的 {@code /api/channels/magpie/plugins} 只在点「插件市场」时才透传。左栏要在
 * 首屏就列出「magpie 还能接管哪些渠道」，所以把社区 registry 的认证类插件固化在这里：
 * 每行一个插件、带它接管的 provider id 与中文一句话说明。</p>
 *
 * <p><b>数据来源</b>：{@code test/channel-management/magpie-plugin/community-registry.json}
 * （magpie 0.1.3257 / 2026-11-07 实抓：93 个社区插件，其中 43 个带 provider），
 * 加上 2026-11-09 从 {@code GET /api/plugins/market} 补的 {@code agy-cli}：
 * 共 44 行、62 个 provider。magpie 升级后重跑导出脚本补行即可；漏补不影响功能，
 * 只是左栏少一个入口，用户仍可在「插件」页签的插件市场里搜索安装。</p>
 *
 * <p><b>安装规格必须与 registry 的 {@code package} 一致</b>：registry 里 DeepAI Code 的
 * 包名是 {@code magpie-deepaicode}（不是 {@code @magpie-community/opencode-deepaicode}），
 * 规格写错时「安装这个插件」会 404。{@code probe-plugin-snapshot.mjs} 会守住这条。</p>
 *
 * <p><b>点一行会发生什么</b>：不安装、不登录、不写网关。只是跳到网关的「插件」页签
 * 并把这个插件置顶高亮；没装时给出「安装」按钮（用户点 + 二次确认后才会真的装），
 * 已装时给出「已安装」状态。安装是长任务（首次要下载 Bun），所以绝不自动触发。</p>
 *
 * <p>{@code free} 只在<b>明确带免费入口</b>的插件上标：目前是
 * {@code opencode-zen-free}（public 凭证，不需要任何账号）。其他「含免费额度」的
 * 订阅不标免费，避免把「有免费档」说成「不用登录」。</p>
 */
export interface MagpiePluginChannel {
  /** npm 规格，安装时原样传给网关 */
  spec: string
  /** 给人看的渠道名（插件名） */
  name: string
  /** 该插件接管的 magpie provider id（可能多个，如 Qoder 国际 / 国内 / 千问办公） */
  providers: string[]
  /** 一句话说明：登录方式 + 能拿到什么 */
  summary: string
  /** 是否无需账号即可用（public 凭证 / 免 Key） */
  free?: boolean
}

export const MAGPIE_PLUGIN_CHANNELS: MagpiePluginChannel[] = [
  // ── 免费 / 免登录 ──
  {
    spec: '@magpie-community/opencode-zen-free-auth',
    name: 'OpenCode Zen Free',
    providers: ['opencode-zen-free'],
    summary: '用 public 凭证接入 OpenCode Zen 免费模型，不需要登录或 API Key，模型自动发现。',
    free: true,
  },

  // ── 编码订阅 / 客户端账号 ──
  {
    spec: '@magpie-community/opencode-zcode-auth',
    name: 'ZCode',
    providers: ['zcode'],
    summary: 'Z.ai 与智谱 GLM Coding Plan，含 ZCode 免费 Start Plan，可每日领取活动包。',
  },
  {
    spec: '@magpie-community/opencode-qoder-auth',
    name: 'Qoder',
    providers: ['qoder', 'qoder-cn', 'qwenwork', 'qwenwork-enterprise'],
    summary: 'Qoder 国际版 / 中国版，以及千问办公公有云与企业旗舰版，各自一条 provider。',
  },
  {
    spec: '@magpie-community/opencode-workbuddy-auth',
    name: 'WorkBuddy',
    providers: ['workbuddy', 'workbuddy-ai'],
    summary: 'WorkBuddy 国内版（CodeBuddy 套餐）与国际版。',
  },
  {
    spec: '@magpie-community/opencode-trae-auth',
    name: 'Trae',
    providers: ['trae-cn', 'trae-global'],
    summary: 'Trae CN 与 Trae 国际版，含免费版，用 Trae 自己的浏览器登录。',
  },
  {
    spec: '@magpie-community/opencode-cline-auth',
    name: 'Cline',
    providers: ['cline'],
    summary: 'Cline 账号的用量计费、ClinePass 与免费模型，支持设备登录或 API Key。',
  },
  {
    spec: '@magpie-community/opencode-cursor-auth',
    name: 'Cursor',
    providers: ['cursor'],
    summary: 'Cursor Pro / Pro+ / Ultra / Teams，套餐里的全部模型并支持工具调用。',
  },
  {
    spec: '@magpie-community/opencode-kiro-auth',
    name: 'Kiro',
    providers: ['kiro'],
    summary: 'Kiro Free / Pro / Pro+ / Power：Kiro 登录、沿用 kiro-cli，或用 API Key。',
  },
  {
    spec: '@magpie-community/opencode-commandcode-auth',
    name: 'Command Code',
    providers: ['commandcode-plan'],
    summary: 'Command Code 的 Pro、GOAT、Max、Ultra、Go 与 Teams 套餐。',
  },
  {
    spec: '@magpie-community/opencode-devin-auth',
    name: 'Devin',
    providers: ['devin'],
    summary: 'Devin 账号的模型：浏览器登录，或沿用 devin CLI 的登录。',
  },
  {
    spec: '@magpie-community/opencode-factory-auth',
    name: 'Factory',
    providers: ['factory'],
    summary: 'Factory Droid 订阅：Anthropic、OpenAI、xAI 与开源模型共 30 个。',
  },
  {
    spec: '@magpie-community/opencode-grok-auth',
    name: 'Grok',
    providers: ['grok'],
    summary: 'SuperGrok 与 X Premium+，通过 Grok Build CLI 的登录使用。',
  },
  {
    spec: '@magpie-community/opencode-zed-auth',
    name: 'Zed',
    providers: ['zed'],
    summary: '用 Zed 订阅使用它托管的 Claude、GPT、Gemini 与 Grok。',
  },
  {
    spec: '@magpie-community/opencode-warp-auth',
    name: 'Warp',
    providers: ['warp'],
    summary: '用 Warp 终端应用的登录使用 Warp AI 请求额度与 auto 路由。',
  },
  {
    spec: '@magpie-community/opencode-mimo-auth',
    name: 'Xiaomi MiMo',
    providers: ['mimo-app'],
    summary: '用小米账号使用小米 MiMo 模型。',
  },
  {
    spec: '@magpie-community/opencode-minimax-auth',
    name: 'MiniMax Code',
    providers: ['minimax-code', 'minimax-code-global'],
    summary: 'MiniMax Code 积分与 M Plan，设备登录，带搜索、生图、生视频与多模态工具。',
  },
  {
    spec: '@magpie-community/opencode-copilot-auth',
    name: 'GitHub Copilot',
    providers: ['github-copilot'],
    summary: 'GitHub.com 与 GitHub Enterprise，显示请求额度、剩余量与重置时间。',
  },
  {
    spec: '@magpie-community/opencode-joycode-auth',
    name: 'JoyCode',
    providers: ['joycode'],
    summary: '京东账号浏览器登录，含实时模型、积分倍率与套餐额度。',
  },
  {
    spec: '@magpie-community/opencode-kimi-work-auth',
    name: 'Kimi Work',
    providers: ['kimi-work'],
    summary: '复用本机 Kimi 桌面版的 Work 登录，读取 Work 模型与会员共享用量。',
  },
  {
    spec: '@magpie-community/opencode-atomcode-auth',
    name: 'AtomCode',
    providers: ['atomcode'],
    summary: 'AtomGit CodingPlan：浏览器 OAuth 或复用本机 AtomCode CLI 登录。',
  },

  // ── 国内 / 区域厂商 ──
  {
    spec: '@magpie-community/opencode-loomy-auth',
    name: 'Loomy',
    providers: ['loomy'],
    summary: '讯飞 Loomy：短信验证码登录，双积分钱包与每日首登赠送。',
  },
  {
    spec: '@magpie-community/opencode-raccoon-auth',
    name: '商汤小浣熊',
    providers: ['raccoon'],
    summary: '商汤小浣熊模型、积分余额与每日签到，浏览器或桌面端登录态都行。',
  },
  {
    spec: '@magpie-community/opencode-sensenova-auth',
    name: 'SenseNova',
    providers: ['sensenova-token-plan'],
    summary: '商汤日日新 Token Plan：积分池、5 小时 / 7 天窗口与计划内模型。',
  },
  {
    spec: '@magpie-community/opencode-catpaw-auth',
    name: 'CatPaw',
    providers: ['catpaw'],
    summary: '美团妙手 CatPaw：网页登录或桌面端登录态，含模型与积分余额。',
  },
  {
    spec: '@magpie-community/opencode-mclaw-auth',
    name: 'MClaw',
    providers: ['mclaw'],
    summary: '中国移动云 MClaw 智能体：浏览器登录自动收票，aitokens 池用量。',
  },
  {
    spec: '@magpie-community/opencode-orcaterm-auth',
    name: 'OrcaTerm',
    providers: ['orcaterm'],
    summary: '腾讯云遨驰终端 AI 助手：DeepSeek、混元、GLM、Kimi，走每月问答额度。',
  },
  {
    spec: '@magpie-community/opencode-tabbit-auth',
    name: 'Tabbit',
    providers: ['tabbit'],
    summary: '复用本机 Tabbit 浏览器的登录态，含周期用量与每日签到。',
  },
  {
    spec: '@magpie-community/opencode-inkstone-auth',
    name: '书生·端砚',
    providers: ['intern-inkstone'],
    summary: '书生·端砚墨点计划：墨点余额、5 小时 / 7 天窗口与计划内模型。',
  },
  {
    spec: '@magpie-community/opencode-autoclaw-auth',
    name: 'AutoClaw',
    providers: ['autoclaw', 'autoclaw-cn'],
    summary: 'AutoClaw（智谱澳龙）国际版网页登录或国内手机验证码，带积分与签到。',
  },
  {
    spec: '@magpie-community/opencode-codearts-auth',
    name: 'CodeArts / OfficeAce',
    providers: ['codearts', 'officeace'],
    summary: '华为云码道与 OfficeAce，两张卡各自华为云 OAuth 登录，含每日签到。',
  },
  {
    spec: '@magpie-community/opencode-astudio-auth',
    name: 'AStudio',
    providers: ['astudio'],
    summary: '科大讯飞 Astron Studio：浏览器 / 桌面 / 粘贴凭据，含每日积分签到。',
  },
  {
    spec: '@magpie-community/opencode-agnes-auth',
    name: 'Agnes AI',
    providers: ['agnes'],
    summary: 'Agnes AI 国际版，Chrome 登录，显示 Token / Agent Plan 用量与美元余额。',
  },
  {
    spec: '@magpie-community/opencode-agnes-code-auth',
    name: 'Agnes Code',
    providers: ['agnes-code'],
    summary: 'Agnes Code 桌面端：复用登录态，含实时模型、每日积分与余额。',
  },
  {
    spec: 'magpie-deepaicode',
    name: 'DeepAI Code',
    providers: ['deepaicode'],
    summary: 'DeepAI Code：浏览器 / 桌面凭据 / API Key，含每日 Theos 额度与签到。',
  },
  {
    spec: 'magpie-plugin-codar',
    name: 'Codar（科搭）',
    providers: ['codar'],
    summary: '科搭 17 个模型，读本机桌面端令牌或粘贴令牌，含每日签到与点数。',
  },
  {
    spec: '@magpie-community/opencode-opendesign-auth',
    name: 'Open Design',
    providers: ['opendesign'],
    summary: 'Open Design Cloud 的 Design Plan，设备登录，含 5 小时 / 7 天额度。',
  },
  {
    spec: '@magpie-community/opencode-nous-auth',
    name: 'Nous Portal',
    providers: ['nous-portal'],
    summary: 'Nous Portal 模型，用它的设备码登录。',
  },

  // ── 云厂商 / 企业接入 ──
  {
    spec: '@magpie-community/opencode-gcp-ai-auth',
    name: 'GCP AI',
    providers: ['gcp-ai'],
    summary: '本机 gcloud / ADC 登录使用 Vertex AI 模型，并读取 Google Cloud 赠金。',
  },
  {
    spec: '@magpie-community/opencode-cloudflare-workers-ai-auth',
    name: 'Cloudflare Workers AI',
    providers: ['cloudflare-workers-ai'],
    summary: 'Cloudflare API Token 接入 Workers AI，含每日 Neurons 额度行。',
  },
  {
    spec: 'magpie-aws-bedrock-sso',
    name: 'AWS Bedrock SSO',
    providers: ['bedrock-sso'],
    summary: '用本机 AWS CLI 配置（含 SSO）接入 Bedrock 的 Claude 与 GPT，SigV4 签名。',
  },
  {
    spec: '@magpie-community/opencode-sap-aicore-auth',
    name: 'SAP AI Core',
    providers: ['sap-aicore'],
    summary: '本机 client-secret 凭据文件连接已有 SAP AI Core 部署，按资源组发现模型。',
  },
  {
    spec: '@magpie-community/opencode-river-auth',
    name: 'River',
    providers: ['river'],
    summary: 'River 按量计费推理：API Key 接入，模型、推理档位与实时价格都从上游读。',
  },

  // ── 本地 CLI（2026-11-09 插件市场新增） ──
  {
    spec: '@magpie-community/opencode-agy-cli-auth',
    name: 'Antigravity (agy CLI)',
    providers: ['agy-cli'],
    summary: '非官方：通过 ACP 驱动本机已登录的 agy CLI，只提供 agy 开放的模型，带进程池与会话续接。',
  },
  {
    spec: 'magpie-providers-hub',
    name: 'Providers Hub',
    providers: [
      'hub-astudio',
      'hub-accio',
      'hub-lobsterai',
      'hub-magicrew',
      'hub-magicrew-intl',
      'hub-autoclaw',
      'hub-autoclaw-cn',
      'hub-loomy',
      'hub-monkeycode',
      'hub-monkeycode-intl',
      'hub-qiniu',
    ],
    summary: '第三方适配的 11 条反代 / 聚合渠道：AStudio、Accio、LobsterAI、MagiCrew、AutoClaw、Loomy、MonkeyCode、七牛云 MaaS，可各自登录与开关。',
  },
]

/** npm 规格 → 插件渠道 */
export function magpiePluginOfSpec(spec: string): MagpiePluginChannel | undefined {
  return MAGPIE_PLUGIN_CHANNELS.find((p) => p.spec === spec)
}

/** 任一 provider id 命中即返回该插件渠道（插件 / 预设两种装法的兜底） */
export function magpiePluginOfProviders(ids: string[]): MagpiePluginChannel | undefined {
  return MAGPIE_PLUGIN_CHANNELS.find((p) => p.providers.some((x) => ids.includes(x)))
}
