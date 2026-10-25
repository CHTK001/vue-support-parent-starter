/**
 * 服务管理 —— 节点数据到展示数据的映射（纯函数，无 Vue 依赖）
 *
 * <p>为什么单独一层：页面要同时回答「这个端口在听吗」「链上挂了什么」「它转发到哪」
 * 三个问题，答案散在后端行的 {@code config} / {@code filters} / {@code serverUrl} 里，
 * 而且各有一堆兜底口径。若这些口径写在模板里，同一个节点很容易在一个地方写成
 * {@code 0.0.0.0:19080}、在另一个地方写成 {@code 19080}。判断只写一次，页面只负责摆开。</p>
 *
 * <p>本层不重新实现已有的口径：状态灯、统计、关键字匹配、监听地址仍走
 * {@link ../../utils/nodeList}，那里有单测锁着；这里只补「一个节点要展示的全部字段」。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import type { FilterTypeMeta, ServerFilterDescriptor, ServerNodeView } from '../../api/serviceManage'
import {
  deriveStatusMeta,
  formatListenText,
  isProxyProtocol,
  type StatusTone,
} from '../../utils/nodeList'

/** 链路上的一个插件（顺序已排好，启用态已归一） */
export interface ServiceChip {
  /** 唯一键：同一节点内过滤器名不重复，用名 + 下标兜底 */
  key: string
  /** 展示名：优先插件描述，其次类型，最后是名字 */
  text: string
  /** 插件类型（判断有没有深度查看页要用） */
  type: string
  /** 是否启用 */
  enabled: boolean
  /** 执行顺序（后端未给时按数组位置补 1） */
  order: number
  /** 参数条数：一眼看出「挂了个空插件」 */
  paramCount: number
  /** 在节点 filters 数组里的原始下标（深度查看页 / 改参数要用它） */
  index: number
}

/** 一个节点的完整展示数据 */
export interface ServiceNodeCard {
  id: number
  name: string
  /** 协议编码（http / http-proxy …） */
  protocolCode: string
  /** 协议展示名（后端给的中文描述，缺了退回编码） */
  protocolText: string
  /** 是否反向代理类（配色与「需后端地址」提示都看它） */
  isProxy: boolean
  /** 引擎（jdk / nio / aio），空则 `—` */
  engine: string
  host: string
  port: number | null
  /** 端口文本；没有端口给 `—`（空端口是需要被看见的定义缺失） */
  portText: string
  /** `0.0.0.0:19080` */
  listenText: string
  /** 访问地址；没有则空串 */
  url: string
  /** 是否自动启用 */
  enabled: boolean
  /** 自动启用 / 手动启动 */
  enabledText: string
  remark: string
  /** 后端原始状态值 */
  status: string
  statusText: string
  statusTone: StatusTone
  statusPulse: boolean
  /** 异常原因（仅 ERROR 且有值时非空） */
  reason: string
  /** 过滤器链（按 order 升序） */
  chips: ServiceChip[]
  filterCount: number
  /** 链上启用的插件数：「挂了 3 个、生效 2 个」是排障时最想知道的 */
  activeFilterCount: number
  /** 反向代理后端，形如 `→ 127.0.0.1:8112`；非代理或未配置为空串 */
  backendText: string
  /** config 里的其它键值（除后端地址），用于「这条服务还配了什么」 */
  configPairs: Array<{ key: string; value: string }>
}

/** 后端地址用的 config 键（与后端 ServerNodeRequest 的约定一致） */
const BACKEND_HOST_KEY = 'backendHost'
const BACKEND_PORT_KEY = 'backendPort'

/**
 * 插件类型 → 描述。
 *
 * @param filterTypes 插件元数据
 */
export function typeDescMap(filterTypes: readonly FilterTypeMeta[] | null | undefined): Map<string, string> {
  const map = new Map<string, string>()
  if (!Array.isArray(filterTypes)) return map
  for (const meta of filterTypes) {
    if (meta?.type && meta.desc) map.set(meta.type, meta.desc)
  }
  return map
}

/**
 * 把 config 摊平成可展示的键值对。
 *
 * <p>后端把配置原样存在 map 里，键名与类型都不定；这里只做两件事：丢掉后端地址
 * （它单独展示成「→ host:port」），以及把非字符串值安全转成文本。</p>
 *
 * @param config 节点配置
 */
export function configPairsOf(config: Record<string, unknown> | null | undefined): Array<{ key: string; value: string }> {
  if (!config || typeof config !== 'object') return []
  const out: Array<{ key: string; value: string }> = []
  for (const [key, value] of Object.entries(config)) {
    if (key === BACKEND_HOST_KEY || key === BACKEND_PORT_KEY) continue
    if (value === null || value === undefined || value === '') continue
    out.push({ key, value: typeof value === 'object' ? JSON.stringify(value) : String(value) })
  }
  return out
}

/**
 * 反向代理后端地址。
 *
 * @param config 节点配置
 */
export function backendTextOf(config: Record<string, unknown> | null | undefined): string {
  if (!config || typeof config !== 'object') return ''
  const host = config[BACKEND_HOST_KEY]
  const port = config[BACKEND_PORT_KEY]
  if (!host && !port) return ''
  const hostText = host === null || host === undefined || host === '' ? '—' : String(host)
  const portText = port === null || port === undefined || port === '' ? '—' : String(port)
  return `→ ${hostText}:${portText}`
}

/**
 * 过滤器链。
 *
 * <p>按 {@code order} 升序；后端没给 order 的排在所有显式 order 之后，编号接着往下数
 * —— 顺序是链的语义（谁先拿到请求），前端不按顺序展示就等于把语义丢了，而按下标补位
 * 又会让「第一条没写 order」和「第二条写了 order=1」撞成同一步。</p>
 *
 * @param filters 节点上的过滤器
 * @param descMap 插件类型 → 描述
 */
export function chainOf(
  filters: readonly ServerFilterDescriptor[] | null | undefined,
  descMap: Map<string, string>,
): ServiceChip[] {
  if (!Array.isArray(filters)) return []

  // 后端没给 order 时不能直接用数组下标补位：下标 0 补成 1 会和显式 order=1 撞号，
  // 两个插件显示成同一步，排序结果还取决于谁先被遍历。这里先找出最大显式 order，
  // 未给的一律排在其后，编号也接着往下数。
  const explicitOrders = filters.map(filter =>
    typeof filter?.order === 'number' ? filter.order : null,
  )
  let nextOrder = explicitOrders.reduce<number>((max, value) => (value === null ? max : Math.max(max, value)), 0)

  return filters
    .map((filter, index) => {
      const type = String(filter?.type || filter?.name || '')
      const order = explicitOrders[index] ?? ++nextOrder
      return {
        key: `${filter?.name || 'filter'}@${index}`,
        text: descMap.get(type) || type || String(filter?.name ?? '插件'),
        type,
        enabled: filter?.enabled !== false,
        order,
        paramCount: filter?.params ? Object.keys(filter.params).length : 0,
        index,
      }
    })
    .sort((a, b) => a.order - b.order || a.index - b.index)
}

/**
 * 单个节点 → 展示数据。
 *
 * @param node       节点视图
 * @param descMap    插件类型 → 描述
 */
export function toServiceNodeCard(
  node: ServerNodeView,
  descMap: Map<string, string> = new Map(),
): ServiceNodeCard {
  const status = deriveStatusMeta(node)
  const chips = chainOf(node.filters, descMap)
  const port = typeof node.port === 'number' ? node.port : null
  return {
    id: node.id,
    name: node.name || `节点 ${node.id}`,
    protocolCode: node.protocol || '',
    protocolText: node.protocolDesc || node.protocol || '—',
    isProxy: isProxyProtocol(node.protocol),
    engine: node.engine?.trim() ? node.engine.trim() : '—',
    host: node.host?.trim() ? node.host.trim() : '0.0.0.0',
    port,
    portText: port === null ? '—' : String(port),
    listenText: formatListenText(node),
    url: node.serverUrl?.trim() ? node.serverUrl.trim() : '',
    enabled: node.enabled === 1,
    enabledText: node.enabled === 1 ? '随进程启动' : '手动启动',
    remark: node.remark?.trim() ? node.remark.trim() : '',
    status: String(node.status ?? ''),
    statusText: status.text,
    statusTone: status.tone,
    statusPulse: status.pulse,
    reason: status.reason,
    chips,
    filterCount: chips.length,
    activeFilterCount: chips.filter(chip => chip.enabled).length,
    backendText: backendTextOf(node.config as Record<string, unknown> | undefined),
    configPairs: configPairsOf(node.config as Record<string, unknown> | undefined),
  }
}

/**
 * 批量映射。
 *
 * @param nodes   节点列表
 * @param filterTypes 插件元数据
 */
export function toServiceNodeCards(
  nodes: readonly ServerNodeView[] | null | undefined,
  filterTypes: readonly FilterTypeMeta[] | null | undefined,
): ServiceNodeCard[] {
  if (!Array.isArray(nodes)) return []
  const descMap = typeDescMap(filterTypes)
  return nodes.map(node => toServiceNodeCard(node, descMap))
}

/**
 * 状态灯的样式类（三档语义：运行 / 异常 / 其余一律算停止）
 *
 * @param card 展示数据
 */
export function stateClassOf(card: ServiceNodeCard): 'is-run' | 'is-err' | 'is-stop' {
  if (card.status === 'RUNNING') return 'is-run'
  if (card.status === 'ERROR') return 'is-err'
  return 'is-stop'
}

/**
 * 主操作：运行中的能停，其余能启；异常的给重启。
 *
 * <p>运行中的服务主操作是「停」，非运行的绝不能给「停」—— 后端会返回
 * 「已经在运行 / 未运行」这类报错，用户点了只会看到红字。判断只写这一份。</p>
 *
 * @param card 展示数据
 */
export function primaryActionOf(card: ServiceNodeCard): 'start' | 'stop' | 'restart' {
  if (card.status === 'RUNNING') return 'stop'
  if (card.status === 'ERROR') return 'restart'
  return 'start'
}
