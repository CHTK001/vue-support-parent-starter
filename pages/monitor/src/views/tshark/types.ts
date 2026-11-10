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
  /** 1 = 正在抓包/解析中，0 = 已停止，2 = 异常 */
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
  /**
   * 异常原因 / 停止说明。
   *
   * <p>进程异常退出、服务重启中断、达到大小上限自动停止等都会落在这里，正常结束为空。
   * 页面在状态标签上用 tooltip 展示，或在详情里给一行提示。</p>
   */
  lastError?: string | null
  /** pcap 文件大小（字节） */
  fileSize?: number | null
  /** 会话大小上限（MB），0 或空表示不限 */
  maxSizeMb?: number | null
}

/** 一条已入库的报文 */
export interface TsharkPacket {
  id: number
  sessionId?: number
  /** tshark 帧号（frame.number） */
  frameNo?: number | null
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
  /** tshark 的 tcp.stream（同一四元组可能复用成多条连接，配对 HTTP 事务用它） */
  tcpStream?: number | null
  /** HTTP 请求头（含起始行与空行）；非请求帧为空 */
  httpRequestHead?: string | null
  /** HTTP 响应头（含起始行与空行）；非响应帧为空 */
  httpResponseHead?: string | null
  /**
   * HTTP 正文（已按 Content-Encoding 解压、按 charset 解码、按上限截断）。
   *
   * <p>纯二进制正文没有可读文本，后端把它压成 `HEX <十六进制预览>` 串；
   * 要按字节看用 {@link httpBodyHex}，不要把这段串再当十六进制解析。</p>
   */
  httpBody?: string | null
  /**
   * HTTP 正文字节（十六进制串，无 0x 前缀、无空白）。
   *
   * <p>与 {@link httpBody} 是同一份字节的两种视图：正文文本 / JSON 美化用 httpBody，
   * HEX 视图用这一段。老会话（该列上线前入库）为空，前端退回按文本重新编码。</p>
   */
  httpBodyHex?: string | null
  /** HTTP 实体类型，如 text/html / application/json */
  httpContentType?: string | null
  /** HTTP 内容编码，如 gzip / br */
  httpContentEncoding?: string | null
  /** HTTP 实体原始字节数（不是截断后的字符数） */
  httpContentLength?: number | null
  /** HTTP 请求方法 */
  httpMethod?: string | null
  /** HTTP 请求 URI */
  httpUri?: string | null
  /** HTTP 响应状态码 */
  httpStatus?: number | null
}

/**
 * 一条 HTTP 事务：同一流上配好对的请求帧与响应帧。
 *
 * <p>`GET /tshark/sessions/{sessionId}/packets/{id}/http-transaction` 返回。
 * 一帧只承载一个方向，详情抽屉只看当前帧时永远只有半条事务；后端按
 * `tcp.stream` 把相邻的请求 / 响应配成对，并合并「起始帧 + 收全帧」的重复落点、
 * 取正文更完整的那一份。没有响应（请求刚发出）时 response 为 null。</p>
 */
export interface TsharkHttpTransaction {
  anchorId: number
  request?: TsharkPacket | null
  response?: TsharkPacket | null
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
  /** 按时间排好的报文序列（步骤过多时被截断，只保留首尾与锚点包） */
  steps: TsharkStep[]
  /** 截断前的完整步骤数 */
  totalSteps?: number
  /** 步骤是否被截断 */
  truncated?: boolean
  /** TCP 建连 RTT（SYN → SYN-ACK）毫秒；抓不到为 null */
  rttMs?: number | null
  /** 首字节时间（首个 HTTP 请求 → 首个 HTTP 响应）毫秒；无 HTTP 为 null */
  ttfbMs?: number | null
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
  /** 阶段：TCP / TLS / HTTP / DATA / CLOSE */
  phase?: string | null
  /** 是否为重传 / 乱序 / 重复 ACK */
  retransmission?: boolean
  /** 是否带 RST */
  reset?: boolean
  /** 该包的协议还原明文（来自 -T json 通道的回填，离线也留得下）：HTTP / TLS / SSH / DNS / FTP / SMTP / MQTT ...，不一定有 */
  restored?: string | null
}

/**
 * TsharkTcpStreamFrame：Follow TCP Stream 还原出的一条载荷帧。
 *
 * <p>按 frame.time 排序后，从同一端连续发出的报文段合成一条帧；
 * 控制帧（ACK / RST / PSH-Only）没有 hex / 文字，前端不占载荷位。</p>
 */
export interface TsharkTcpStreamFrame {
  /** pcap 内自然递增的帧号 */
  frameNo: number
  /** 帧时间 */
  time: string
  /** 载荷十六进制（tshark -x） */
  payload?: string | null
  /** 载荷文字（tshark -T fields 人可读摘要） */
  text?: string | null
  /** 该帧相对于流的 START 时间偏移（秒） */
  offset: number
}

/**
 * TsharkTcpStream：Once TCP 流的双向载荷还原。
 *
 * <p>与 `TsharkHandshake` 合用：一个看握手，一个看数据。
 * 前端按 `src/srcPort → dst/dstPort` 拆出双向载荷帧展示：
 * 源侧发出的标 S，对端发回的标 R。</p>
 */
export interface TsharkTcpStream {
  sessionId: number
  protocol: string
  /** 链路初始方向的源侧 */
  src: string
  srcPort: number
  dst: string
  dstPort: number
  frames: TsharkTcpStreamFrame[]
}

/** 协议分布的一项 */
export interface TsharkProtocolStat {
  protocol: string
  count: number
}

/**
 * 流量时间轴的一桶（`GET /tshark/sessions/{id}/stats/timeline`）。
 *
 * <p>后端按 `bucketSeconds` 聚合成「某个时间点 → 报文数 / 字节数」，
 * 前端据此画报文量与流量曲线。</p>
 */
export interface TsharkTimelinePoint {
  /** `yyyy-MM-dd HH:mm:ss`（桶起点） */
  t: string
  packets: number
  bytes: number
}

/**
 * 异常诊断的一项（`GET /tshark/sessions/{id}/stats/anomalies`）。
 *
 * <p>`filter` 是后端给的等价显示过滤表达式，点这一行就能筛到对应报文。</p>
 */
export interface TsharkAnomaly {
  /** 稳定标识：reset / unreachable / retransmission … */
  key: string
  label: string
  /** danger / warning / info */
  severity: string
  count: number
  /** 可回填到显示过滤条的表达式 */
  filter?: string | null
}

/** Top 会话流的一项 */
export interface TsharkFlow {
  /** 「源 → 目的」形式的流标识 */
  flow: string
  count: number
  /** 字节数，部分实现不返回 */
  bytes?: number
  /** 源 / 目的地址与端口，用于点击后生成精确的显示过滤 */
  sourceIp?: string | null
  sourcePort?: number | null
  destIp?: string | null
  destPort?: number | null
}

/**
 * tshark 运行时状态。
 *
 * <p>类型只有一份，定义在 {@code api/index.ts}（接口的返回类型在那里），这里转出，
 * 让视图层仍然从 {@code ./types} 取，不破坏既有的引用习惯。</p>
 */
export type { TsharkRuntimeStatus } from '../../api'

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
export type TsharkTabKey = 'packet' | 'session' | 'import' | 'stats' | 'flow' | 'insight'

/** 会话列表的状态筛选（前端做，见 useTshark 的说明） */
export type TsharkSessionFilter = 'all' | 'running' | 'stopped' | 'error'
