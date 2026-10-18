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

/** 工作台标签页 */
export type TsharkTabKey = 'packet' | 'session' | 'stats' | 'flow'

/** 会话列表的状态筛选（前端做，见 useTshark 的说明） */
export type TsharkSessionFilter = 'all' | 'running' | 'stopped'
