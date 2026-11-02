/**
 * 页面版式探索 · 数据规格（Phase 2 专用）。
 *
 * <p>为什么用「规格 + 渲染器」而不是给每个页面复制三份组件：
 * 42 个页面里有大量同构页面（供应商 / 渠道 / 连接器都是「实体清单 + 指标 + 操作」），
 * 复制三份会让三个变体漂移成三种字体、三种间距。这里把<b>内容</b>抽成规格，
 * <b>版式</b>由渲染器决定：同一份规格换渲染器，差异只来自版式本身。</p>
 *
 * <p>数据全部为 mock，不连后端 —— 探索阶段只评审版式，选定后才动真实页面。</p>
 */

/** 渲染器种类：决定用哪一组版式 */
export type Archetype = 'management' | 'conversation' | 'usage'

/** 表格列 */
export interface SpecColumn {
  key: string
  label: string
  /** 列宽（CSS 值），缺省自适应 */
  width?: string
  /** 右对齐（数字列） */
  numeric?: boolean
}

/** 表格行：键值对 + 状态 */
export interface SpecRow {
  id: string
  cells: Record<string, string>
  /** 状态点语义 */
  status?: 'on' | 'off' | 'warn'
  /** 第二行说明（列表页用） */
  note?: string
}

/** 指标 */
export interface SpecStat {
  label: string
  value: string
  /** 副说明 */
  hint?: string
  /** 变化语义 */
  tone?: 'up' | 'down' | 'flat'
}

/** 会话列表项（对话页左栏） */
export interface SpecSession {
  id: string
  title: string
  meta: string
  group: string
  active?: boolean
  unread?: boolean
}

/** 消息 */
export interface SpecMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  time: string
  /** 工具调用摘要（assistant） */
  tools?: string[]
  /** 代码块（assistant） */
  code?: { lang: string; body: string }
}

/** 页面规格 */
export interface PageSpec {
  id: string
  label: string
  archetype: Archetype
  /** 页面说明句（Brief 类版式会用它） */
  subtitle: string
  /** 主操作 */
  primaryAction: string
  secondaryAction?: string
  /** 筛选胶囊 */
  filters: string[]
  stats: SpecStat[]
  columns?: SpecColumn[]
  rows?: SpecRow[]
  /** 实体称谓：卡片墙与主从版式用 */
  entity?: { singular: string; plural: string }
  /** 右侧上下文（对话页） */
  context?: { title: string; items: { title: string; meta: string }[] }
  sessions?: SpecSession[]
  messages?: SpecMessage[]
}

const MODEL_PAGE: PageSpec = {
  id: 'models',
  label: '模型管理',
  archetype: 'management',
  subtitle: '按供应商管理模型接入：密钥、模型清单、上下架与探活，一页改完。',
  primaryAction: '添加供应商',
  secondaryAction: '从模板库添加',
  filters: ['全部', '已启用', '未配置', '本地 ONNX', '仅对话'],
  entity: { singular: '供应商', plural: '供应商' },
  stats: [
    { label: '供应商', value: '9', hint: '3 个为自建' },
    { label: '模型', value: '184', hint: '本周 +12', tone: 'up' },
    { label: '已启用', value: '141', hint: '占 76.6%' },
    { label: '异常', value: '2', hint: '最近 1 小时', tone: 'down' },
  ],
  columns: [
    { key: 'name', label: '供应商' },
    { key: 'kind', label: '类型', width: '96px' },
    { key: 'models', label: '模型', width: '72px', numeric: true },
    { key: 'enabled', label: '已启用', width: '88px', numeric: true },
    { key: 'latency', label: '首字延迟', width: '104px', numeric: true },
    { key: 'sync', label: '最近同步', width: '132px' },
  ],
  rows: [
    { id: 'qwen', status: 'on', cells: { name: '阿里云百炼', kind: '云端', models: '42', enabled: '38', latency: '412 ms', sync: '12 分钟前' }, note: 'qwen3-max / qwen3-vl / wanx' },
    { id: 'deepseek', status: 'on', cells: { name: 'DeepSeek', kind: '云端', models: '16', enabled: '14', latency: '689 ms', sync: '26 分钟前' }, note: 'deepseek-v4 / deepseek-vl2' },
    { id: 'zhipu', status: 'on', cells: { name: '智谱 GLM', kind: '云端', models: '23', enabled: '19', latency: '523 ms', sync: '1 小时前' }, note: 'glm-5 / glm-4.7 / cogview' },
    { id: 'moonshot', status: 'on', cells: { name: 'Moonshot', kind: '云端', models: '11', enabled: '9', latency: '744 ms', sync: '2 小时前' }, note: 'kimi-k3 / moonshot-v2' },
    { id: 'openai', status: 'warn', cells: { name: 'OpenAI 兼容', kind: '云端', models: '31', enabled: '22', latency: '—', sync: '昨天 21:40' }, note: '中转站 / 自建网关' },
    { id: 'onnx', status: 'off', cells: { name: '本地 ONNX', kind: '本地', models: '28', enabled: '8', latency: '96 ms', sync: '3 天前' }, note: '检测 / 特征 / 上色 / OCR' },
    { id: 'workbuddy', status: 'on', cells: { name: 'WorkBuddy', kind: '账号池', models: '9', enabled: '9', latency: '1.2 s', sync: '8 分钟前' }, note: '腾讯 CodeBuddy · 网关轮换' },
  ],
}

const CHANNEL_PAGE: PageSpec = {
  id: 'channel',
  label: '渠道管理',
  archetype: 'management',
  subtitle: '把各家账号接进来统一调度：登录态、账号池、配额与签到都在这里看。',
  primaryAction: '添加渠道',
  secondaryAction: '刷新状态',
  filters: ['全部渠道', '已连接', '等待授权', '账号池', '需签到'],
  entity: { singular: '渠道', plural: '渠道' },
  stats: [
    { label: '渠道', value: '12', hint: '11 个账号类' },
    { label: '已连接', value: '7', hint: '2 个待续期', tone: 'up' },
    { label: '账号', value: '31', hint: '今日新增 4' },
    { label: '今日调用', value: '12.4k', hint: '失败率 0.8%', tone: 'up' },
  ],
  columns: [
    { key: 'name', label: '渠道' },
    { key: 'login', label: '登录方式', width: '128px' },
    { key: 'accounts', label: '账号', width: '80px', numeric: true },
    { key: 'quota', label: '今日余量', width: '116px' },
    { key: 'checkin', label: '签到', width: '96px' },
    { key: 'state', label: '状态', width: '112px' },
  ],
  rows: [
    { id: 'loomy', status: 'on', cells: { name: 'Loomy', login: '扫码登录', accounts: '3', quota: '86%', checkin: '已完成', state: '已连接' }, note: '微信扫码 · 今日 3,281 次' },
    { id: 'workbuddy', status: 'on', cells: { name: 'WorkBuddy（腾讯）', login: '浏览器授权', accounts: '2', quota: '64%', checkin: '—', state: '已连接' }, note: 'CodeBuddy · cn 区网关' },
    { id: 'trae', status: 'on', cells: { name: 'Trae', login: '浏览器授权', accounts: '4', quota: '51%', checkin: '—', state: '已连接' }, note: '国际版 · 每 6h 轮换' },
    { id: 'copilot', status: 'warn', cells: { name: 'GitHub Copilot', login: '设备码', accounts: '1', quota: '12%', checkin: '—', state: '待续期' }, note: '令牌 2 天后到期' },
    { id: 'qwen', status: 'on', cells: { name: '通义千问', login: 'API Key', accounts: '6', quota: '73%', checkin: '—', state: '已连接' }, note: '账号池最大 6 并发' },
    { id: 'kiro', status: 'off', cells: { name: 'Kiro', login: '浏览器授权', accounts: '0', quota: '—', checkin: '—', state: '未连接' }, note: '尚未绑定账号' },
  ],
}

const CONNECTOR_PAGE: PageSpec = {
  id: 'connectors',
  label: '连接器',
  archetype: 'management',
  subtitle: '把 AI 机器人接到你常用的平台上：飞书、企业微信、QQ、Telegram 一次配好。',
  primaryAction: '新建连接器',
  secondaryAction: '查看接入文档',
  filters: ['全部平台', '运行中', '已停止', '需要配置'],
  entity: { singular: '连接器', plural: '连接器' },
  stats: [
    { label: '连接器', value: '8', hint: '5 个平台' },
    { label: '运行中', value: '5', hint: '2 个近 24h 有消息', tone: 'up' },
    { label: '今日消息', value: '1,284', hint: '峰值 21:00', tone: 'up' },
    { label: '失败投递', value: '6', hint: '重试队列 2 条', tone: 'down' },
  ],
  columns: [
    { key: 'name', label: '连接器' },
    { key: 'platform', label: '平台', width: '120px' },
    { key: 'agent', label: '绑定助手', width: '144px' },
    { key: 'messages', label: '今日消息', width: '104px', numeric: true },
    { key: 'last', label: '最近活动', width: '128px' },
    { key: 'state', label: '状态', width: '104px' },
  ],
  rows: [
    { id: 'feishu', status: 'on', cells: { name: '产品群助手', platform: '飞书', agent: '需求分析助手', messages: '682', last: '刚刚', state: '运行中' }, note: '已绑定 3 个群 · 长连接' },
    { id: 'wecom', status: 'on', cells: { name: '客服工单助手', platform: '企业微信', agent: '工单分诊', messages: '318', last: '3 分钟前', state: '运行中' }, note: '回调地址已校验' },
    { id: 'qq', status: 'on', cells: { name: '频道播报', platform: 'QQ', agent: '日报机器人', messages: '146', last: '18 分钟前', state: '运行中' }, note: '频道 + 私聊白名单' },
    { id: 'ilink', status: 'warn', cells: { name: '测试通道', platform: 'iLink', agent: '未绑定', messages: '0', last: '昨天', state: '需要配置' }, note: '缺少 AppSecret' },
    { id: 'tg', status: 'off', cells: { name: '海外社群', platform: 'Telegram', agent: '翻译助手', messages: '138', last: '2 小时前', state: '已停止' }, note: '手动停止 · 等待续费' },
  ],
}

const CHAT_PAGE: PageSpec = {
  id: 'chat',
  label: '会话',
  archetype: 'conversation',
  subtitle: '新建会话、切换模型、看工具调用与产物。',
  primaryAction: '新建会话',
  secondaryAction: '搜索会话',
  filters: [],
  stats: [],
  context: {
    title: '上下文',
    items: [
      { title: '工作区文件', meta: 'ai-starter / 12 个变更' },
      { title: '待办', meta: '3 项进行中 · 1 项阻塞' },
      { title: '本次用量', meta: '18.4k tokens · 42 秒' },
    ],
  },
  sessions: [
    { id: 's1', title: 'WorkBuddy 渠道接入收尾', meta: '刚刚 · 18 条消息', group: '今天', active: true },
    { id: 's2', title: '免费渠道路由聚合排查', meta: '32 分钟前', group: '今天' },
    { id: 's3', title: '等待框 Console 变体落地', meta: '2 小时前', group: '今天', unread: true },
    { id: 's4', title: '知识库模板导入脚本', meta: '昨天 22:10', group: '昨天' },
    { id: 's5', title: '用量页指标口径对齐', meta: '昨天 16:32', group: '昨天' },
  ],
  messages: [
    { id: 'm1', role: 'user', text: '把 WorkBuddy 作为渠道接进渠道管理，用真实网关验证到 OAuth 授权页。', time: '14:02' },
    {
      id: 'm2',
      role: 'assistant',
      text: '已接入。渠道以 @Spi("workbuddy") 注册，登录走浏览器授权：管理密钥登录网关 → 发起 OAuth → 返回腾讯授权页 → 轮询完成后取 API Key 落库。',
      time: '14:03',
      tools: ['读取 WorkBuddyAccountChannelAuthManager.java', '执行 mvn test（10 个用例）', '部署 ai-starter-app.jar'],
    },
    {
      id: 'm3',
      role: 'assistant',
      text: '端到端验证结果：',
      time: '14:05',
      code: {
        lang: 'text',
        body: '/api/channels  → 含 workbuddy（browser-oauth）\nstart-login     → verifyUrl=https://copilot.tencent.com/login?...\nflowId=43 字符   cookie 已下发   realm=cn',
      },
    },
    { id: 'm4', role: 'user', text: '好，接着把 12 个渠道的卡片视觉统一一下。', time: '14:07' },
    { id: 'm5', role: 'assistant', text: '正在改渠道管理页的卡片栅格与状态标签，先给你三个版式方向选。', time: '14:08' },
  ],
}

const USAGE_PAGE: PageSpec = {
  id: 'usage',
  label: '用量管理',
  archetype: 'usage',
  subtitle: '实时 Token 用量、配额、消费趋势与明细的一页看板。',
  primaryAction: '导出用量',
  filters: ['今天', '近7天', '近30天', '全部', '自定义'],
  stats: [
    { label: '今日 Token', value: '0', hint: '免费额度' },
    { label: '范围 Token', value: '0', hint: '已选区间' },
    { label: '请求数', value: '0', hint: '近期调用' },
    { label: '费用', value: '0', hint: '区间消费' },
  ],
}

/** 已注册规格：新增页面只需在末尾追加一项 */
export const PAGE_SPECS: PageSpec[] = [CHAT_PAGE, MODEL_PAGE, CHANNEL_PAGE, CONNECTOR_PAGE, USAGE_PAGE]

/** 按 id 取规格 */
export function getPageSpec(id: string): PageSpec | undefined {
  return PAGE_SPECS.find((p) => p.id === id)
}

export type VariantKey = 'a' | 'b' | 'c' | 'd' | 'e' | 'f'

/** 每套方向的名称与一句话定位（预览顶栏与选择页共用） */
export const VARIANT_META: Record<string, { key: VariantKey; name: string; desc: string }[]> = {
  management: [
    { key: 'a', name: '台账', desc: '贴边工具条 + 全宽表格，一屏看最多行，适合天天泡在里面的管理台' },
    { key: 'b', name: '卡片墙', desc: '大标题 + 实体卡片栅格，每个对象都能「看清楚」而不是「扫一行」' },
    { key: 'c', name: '主从', desc: '左侧实体列常驻 + 右侧详情，选中即看，不跳页' },
  ],
  conversation: [
    { key: 'a', name: '沉浸', desc: '单列 720px，去掉一切干扰，只留对话与输入框' },
    { key: 'b', name: '双栏', desc: '会话列表常驻 + 对话区，消息用气泡，上下文收进抽屉' },
    { key: 'c', name: '三栏', desc: '会话 / 对话 / 上下文三栏并行，工具调用与产物体贴可见' },
  ],
  usage: [
    { key: 'a', name: '航站楼', desc: '横向三段式：航行情报条 + 引擎驾驶舱 + 仪表盘' },
    { key: 'b', name: 'Studio', desc: '浅色工作台，KPI 统计条 + 看板 + 排行 + 趋势面板' },
    { key: 'c', name: 'Dark Focus', desc: '暗色单列，环形图通栏 + 横向滚动排行' },
    { key: 'd', name: 'Bento', desc: '浅色 12 列宫格，KPI 行 + 多跨度单元格' },
    { key: 'e', name: 'Lattice', desc: '浅色无圆角，Tab 左条 + 全宽行，边框分割' },
    { key: 'f', name: 'Portal', desc: '暗色 2×2 网格，KPI/图表对格，密度行' },
  ],
}