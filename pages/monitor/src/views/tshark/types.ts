/**
 * TShark 抓包工作台的领域模型
 *
 * 这些结构对应后端 `MsMonitorTsharkSession` / `PacketRecord` 与两个统计接口的返回。
 * 字段一律按「后端可能给 null」声明：抓包进程中途被杀时 endTime 为空、
 * UDP 报文没有端口，用非空类型会在模板里到处写 `?? ''` 还挡不住运行时。
 */

/** 一次抓包任务（一个会话） */
export interface TsharkSession {
  id: number
  /** 会话名，用户未命名时后端可能回退成网卡名 */
  sessionName?: string | null
  /** 抓包网卡（Windows 上是 `\Device\NPF_{GUID}` 形态的设备名） */
  captureInterface?: string | null
  /** 1 = 正在抓包，其它值 = 已停止 */
  captureStatus?: number | null
  /** 已入库的报文条数 */
  packetCount?: number | null
  startTime?: string | null
  endTime?: string | null
  /**
   * 会话来源：live=网卡实时抓包 / import=导入的 pcap。
   *
   * <p>「抓包分析」与「PCAP 分析」两个页面各看各的，过滤在后端做（sessions 接口的 source 参数），
   * 前端只拿它做展示与文案区分。</p>
   */
  source?: string | null
  /** 持续时长（秒）。实时抓包是预设时长，导入会话由首末报文时间算出 */
  captureDuration?: number | null
}

/** 一条已入库的报文 */
export interface TsharkPacket {
  id: number
  sessionId?: number
  /** 抓包时间戳，格式由后端决定（详情与列表同一份数据） */
  packetTime?: string | null
  /** 最高层协议名，如 TCP / HTTP / DNS */
  protocol?: string | null
  sourceIp?: string | null
  sourcePort?: number | null
  destIp?: string | null
  destPort?: number | null
  packetLength?: number | null
  /** tshark 的 `_ws.col.Info` 摘要 */
  packetInfo?: string | null
  /** 协议还原出的明文（仅部分协议实现） */
  restoredText?: string | null
  /** 报文原始十六进制 / 转义文本 */
  rawData?: string | null
}

/**
 * 一条 TCP 流的握手 / 关闭生命周期（`GET /tshark/packets/{id}/handshake`）。
 *
 * <p>HTTP / TLS / SSH 等跑在 TCP 上的协议也能取到：后端按四元组匹配整条流，
 * 握手与挥手帧不会因为协议列不同被过滤掉。</p>
 */
export interface TsharkHandshake {
  sessionId: number
  /** 主动发起方（发第一个 SYN 的一侧） */
  clientIp?: string | null
  clientPort?: number | null
  serverIp?: string | null
  serverPort?: number | null
  handshake: {
    /** THREE_WAY / FOUR_WAY / NONE */
    kind: string
    /** 中文标签，直接展示 */
    label: string
    /** 补充说明（如为什么判定为四次） */
    detail?: string | null
    /** 是否已完成握手 */
    completed: boolean
    /** 是否已双向 FIN 关闭 */
    closed: boolean
  }
  /** 按时间排好的报文序列 */
  steps: TsharkStep[]
}

/** 生命周期时序里的一步 */
export interface TsharkStep {
  packetId: number
  /** HH:mm:ss.SSS */
  time?: string | null
  /** true = 主动方 → 被动方 */
  fromClient: boolean
  /** 解析出的 TCP 标志位，如 `SYN,ACK`；HTTP 数据帧为空 */
  flags?: string | null
  seq?: string | null
  ack?: string | null
  length?: number | null
  info?: string | null
  /** 相对本流第一个包的耗时（毫秒） */
  relativeMs: number
}

/** 协议分布的一项 */
export interface TsharkProtocolStat {
  protocol: string
  count: number
}

/** Top 会话流的一项 */
export interface TsharkFlow {
  /** 「源 → 目的」形式的流标识 */
  flow: string
  count: number
  /** 字节数，部分实现不返回 */
  bytes?: number
}

/**
 * 网卡信息。
 *
 * 后端接口的 TS 声明写的是 `string[]`，但实现返回的是对象（Windows 上直接展示
 * tshark 给的设备名会是一串 GUID，用户挑不出哪张网卡，所以实现补了友好名）。
 * 这里按真实结构声明，取值处再兜底字符串形态。
 */
export interface TsharkInterface {
  /** 设备名，抓包时回传给后端的值 */
  name: string
  /** 友好名，如「以太网 3」 */
  description?: string
  ipv4?: string[]
  /** 是否承载默认出口的本机网卡 */
  local?: boolean
}

/**
 * 工作台标签页。
 *
 * <p>{@code session} 是「抓包分析」的会话页、{@code import} 是「PCAP 分析」的导入记录页 ——
 * 两个页面共用同一套标签骨架，只是把「列表」那一页换成各自的面板，其余（报文 / 统计 /
 * 会话流）完全一致，所以枚举放一处、共用一套 key。</p>
 */
export type TsharkTabKey = 'packet' | 'session' | 'import' | 'stats' | 'flow'

/** 会话列表的状态筛选（前端做，见 useTshark 的说明） */
export type TsharkSessionFilter = 'all' | 'running' | 'stopped'
