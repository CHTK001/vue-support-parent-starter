/**
 * TShark 抓包工作台的数据层
 *
 * 把「取数 + 状态 + 实时推送」从视图里抽出来，页面只负责排布与交互。
 * 原实现全部塞在 1015 行的单文件里：模板、样式、请求、ECharts、socket 混在一起，
 * 任何一个 tab 的调整都要读完整份文件。
 *
 * 几个刻意的取舍写在下面各处（会话全量拉取、实时包只在第一页追加、请求竞态丢弃），
 * 都是原实现踩过或没处理到的点。
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { message, useSocketService } from '@repo/core'
import {
  checkTshark, getTsharkInterfaces, startTsharkCapture, stopTsharkCapture,
  delTsharkSession, getTsharkSessions, getTsharkPackets, getTsharkPacketDetail,
  getTsharkProtocolStats, getTsharkTopFlows, tsharkPcapUrl, importTsharkPcap,
  openTsharkPacketStream,
} from '../../api'
import type {
  TsharkFlow, TsharkInterface, TsharkPacket, TsharkProtocolStat,
  TsharkSession, TsharkSessionFilter,
} from './types'

/** 会话列表每页条数（前端分页） */
const SESSION_PAGE_SIZE = 10
/** 报文列表每页条数（后端分页） */
const PACKET_PAGE_SIZE = 20
/**
 * 会话一次性拉取的上限。
 *
 * <p>后端 `GET /tshark/sessions` 只有 page/size，没有 keyword 参数。会话总量很小
 * （一次抓包一条），所以整批取回后在前端做「搜索 + 状态筛选 + 分页」——
 * 否则搜索只能搜到当前页，翻到第 3 页搜一个在第 1 页的会话会「搜不到」。
 * 报文列表不能这么做（可能几十万条），那边仍旧走后端过滤。</p>
 */
const SESSION_FETCH_SIZE = 200

export function useTshark(options: { source?: string; autoSelectFirst?: boolean } = {}) {
  /**
   * 会话来源过滤：抓包分析页传 {@code 'live'}、PCAP 分析页传 {@code 'import'}。
   *
   * <p>过滤放后端（sessions 接口的 source 参数）而不是前端：两类会话共用一张表，
   * 只拉回自己那一类才不会让「已加载 N/M」的总数被对方的数据撑大，
   * 也省掉「拉 200 条再丢掉一半」的浪费。</p>
   */
  const sessionSource = options.source ?? ''

  /**
   * 列表加载完是否自动选中第一条。
   *
   * <p>抓包分析页要（那份会话就是它当前的工作对象，进页面就该有数据可看）；
   * PCAP 分析页不要 —— 那一页的形态是「目录（导入记录）→ 点进去看某个文件的报文」，
   * 自动选中会让页面一进来就跳过目录、直接停在某个文件的报文上，用户反而找不到自己刚导入的那条。</p>
   */
  const autoSelectFirst = options.autoSelectFirst ?? true

  // ===== TShark 环境 =====
  const tsharkOk = ref(false)
  const interfaces = ref<TsharkInterface[]>([])

  // ===== 抓包参数 =====
  const iface = ref('')
  const filter = ref('')
  /**
   * 过滤语法：auto / bpf / display。
   *
   * <p>「http」这类词只有显示过滤认，塞给捕获过滤（-f）会让 tshark 立刻退出，
   * 页面表现为「新增会话后马上停止」；auto 由后端按文本判断，用户也可以显式指定。</p>
   */
  const filterType = ref('auto')
  /** 会话名（可空，后端按网卡与时间生成） */
  const captureName = ref('')
  /**
   * 包数上限。0 = 不限 —— 默认必须是不限。
   *
   * <p>此前缺省 500，抓满 500 个包 tshark 就带 `-c 500` 自己退出，页面上表现为
   * 「刚抓到数据就结束了」：HTTP 这类流量几百个包几秒就满，用户点开页面时抓包
   * 已经停了。现在只有用户显式填了正数才加 `-c`；要停就点会话上的「停止抓包」。</p>
   */
  const count = ref(0)
  const timeout = ref(0)
  const starting = ref(false)
  /** 导入 pcap 的上传中标志：几百 MB 的文件要传几秒，按钮得转圈，否则用户会重复点 */
  const importing = ref(false)

  // ===== 会话 =====
  const loadingSessions = ref(false)
  const sessions = ref<TsharkSession[]>([])
  /** 后端返回的会话总数。可能大于已拉取的条数（超过 SESSION_FETCH_SIZE 时） */
  const sessionBackendTotal = ref(0)
  const sessionKeyword = ref('')
  const sessionFilter = ref<TsharkSessionFilter>('all')
  const sessionPage = ref(1)
  const activeSessionId = ref<number | null>(null)

  // ===== 报文 =====
  const loadingPackets = ref(false)
  const packets = ref<TsharkPacket[]>([])
  const packetPage = ref(1)
  const packetTotal = ref(0)
  const packetKeyword = ref('')
  let keywordTimer: ReturnType<typeof setTimeout> | null = null

  // ===== 统计 =====
  const loadingStats = ref(false)
  const protoStats = ref<TsharkProtocolStat[]>([])
  const topFlows = ref<TsharkFlow[]>([])
  /**
   * 统计版本号。
   *
   * <p>实时推送是原地 `protoStats.push()`（不换数组引用），图表组件拿不到变更通知；
   * 统一改成「数据变了就自增一个计数器」，图表 watch 它重绘。</p>
   */
  const statsVersion = ref(0)

  // ===== 报文详情 =====
  const detailOpen = ref(false)
  const packetDetail = ref<TsharkPacket | null>(null)

  // ===== 实时推送 =====
  const liveCount = ref(0)
  const liveConnected = ref(false)
  /** 当前会话的 SSE 连接：切会话 / 清空选中 / 卸载时必须断开，否则服务端会一直推旧会话 */
  let packetStream: { close: () => void } | null = null

  /**
   * 关掉当前报文流。
   *
   * <p>单独抽出来是因为「切会话」「清空选中」「组件卸载」三个出口都要做同一件事，
   * 漏掉任意一个都会留下一条后台长连接。</p>
   */
  function closePacketStream() {
    packetStream?.close()
    packetStream = null
    liveConnected.value = false
  }

  /**
   * 打开某个会话的报文 SSE。
   *
   * <p>后端从 4.0.0.42 起把逐包推送从 socket.io 全量广播改成按会话分组的 SSE
   * （`/sessions/{id}/packets/stream`）。前端原本只订阅 socket.io 的
   * `monitor/tshark-packet`，在新后端上要么收不到、要么被其他会话的数据干扰；
   * 这里按会话建连，服务端只推当前在看的这一条。</p>
   *
   * @param sessionId 抓包会话 id
   */
  function openPacketStream(sessionId: number) {
    closePacketStream()
    packetStream = openTsharkPacketStream(sessionId, {
      onOpen: () => {
        liveConnected.value = true
      },
      onError: () => {
        liveConnected.value = false
      },
      onClose: () => {
        liveConnected.value = false
      },
      onMessage: (event: { event?: string; data?: any }) => {
        if (event.event === 'packet') {
          applyLivePacket(event.data as TsharkPacket)
          return
        }
        if (event.event === 'session') {
          // 会话状态变化（停止 / 解析完成）：刷新列表与统计，页数停在第一页时顺手对账
          void loadSessions(false)
          const phase = event.data?.phase
          if (phase === 'parsed' || phase === 'finished') {
            void loadStats()
            if (packetPage.value === 1 && !packetKeyword.value.trim()) {
              void loadPackets(1)
            }
          }
        }
      },
    })
  }

  /**
   * 实时包入库到页面状态。
   *
   * <p>去重按报文 id：SSE 断线重连时后端可能重复推最近的包（`Last-Event-ID` 未启用），
   * 不去重会出现两行一模一样的数据。</p>
   *
   * @param packet 后端推来的精简报文
   */
  function applyLivePacket(packet: TsharkPacket) {
    const sid = activeSessionId.value
    if (sid == null || packet == null || packet.id == null) return
    if (packet.sessionId != null && String(packet.sessionId) !== String(sid)) return
    if (packets.value.some(p => p.id === packet.id)) return

    liveCount.value++
    packetTotal.value++
    const proto = packet.protocol || 'OTHER'
    const hit = protoStats.value.find(s => s.protocol === proto)
    if (hit) hit.count++
    else protoStats.value.push({ protocol: proto, count: 1 })
    statsVersion.value++

    // 关键字生效时列表是「库里筛出来的子集」，翻在第 2 页及以后时新包属于第 1 页，
    // 这两种情况都不插行，避免总数/页码对不上。
    if (packetKeyword.value.trim()) return
    if (packetPage.value !== 1) return
    // 不再截断实时行：历史数据都在库里，页面这一页只承载实时新增，
    // 真到几十万行时用户会翻页 / 过滤，而不是靠偷偷丢弃最新行来省 DOM。
    packets.value.unshift(packet)
  }

  /**
   * 网卡下拉选项。
   *
   * <p>Windows 上 tshark 给的设备名是 `\Device\NPF_{GUID}`，直接展示是一串读不懂的
   * GUID，用户挑不出哪张是自己在用的网卡。这里改显友好名（「以太网 3」）+ IPv4，
   * 并把承载默认出口的那张标「本机」。</p>
   */
  const ifaceOptions = computed(() => interfaces.value.map((i) => {
    // 兜底字符串形态：接口声明与实际返回不一致时不要让下拉整个空掉
    if (typeof i === 'string') return { label: i, value: i }
    const desc = i.description || i.name
    const ip = i.ipv4 && i.ipv4.length ? i.ipv4.join(', ') : '无 IPv4'
    return {
      label: i.local ? `${desc} · ${ip} · 本机出口` : `${desc} · ${ip}`,
      value: i.name,
    }
  }))

  const activeSession = computed(() =>
    sessions.value.find(s => s.id === activeSessionId.value) ?? null)

  /** 状态 + 关键字筛选后的会话（搜索在已拉取的全量上做，见 SESSION_FETCH_SIZE 说明） */
  const filteredSessions = computed(() => {
    const kw = sessionKeyword.value.trim().toLowerCase()
    return sessions.value.filter((s) => {
      if (sessionFilter.value === 'running' && s.captureStatus !== 1) return false
      if (sessionFilter.value === 'stopped' && s.captureStatus === 1) return false
      if (!kw) return true
      return `${s.sessionName ?? ''} ${s.captureInterface ?? ''}`.toLowerCase().includes(kw)
    })
  })

  const pagedSessions = computed(() => {
    const start = (sessionPage.value - 1) * SESSION_PAGE_SIZE
    return filteredSessions.value.slice(start, start + SESSION_PAGE_SIZE)
  })

  const runningCount = computed(() => sessions.value.filter(s => s.captureStatus === 1).length)

  // ==================== 初始化 ====================
  async function init() {
    try {
      tsharkOk.value = await checkTshark()
    } catch {
      tsharkOk.value = false
    }
    await Promise.allSettled([loadInterfaces(), loadSessions()])
  }

  async function loadInterfaces() {
    try {
      interfaces.value = (await getTsharkInterfaces()) as unknown as TsharkInterface[]
    } catch {
      /* 网卡列表取不到不影响会话管理，静默降级 */
    }
  }

  /**
   * 拉取会话列表。
   *
   * @param resetActive 是否重新挑选激活会话。实时推送触发的刷新要传 false：
   *   否则用户切换会话的瞬间恰好来了一条 session 事件，选中项会被拽走。
   */
  async function loadSessions(resetActive = true) {
    loadingSessions.value = true
    try {
      const r = await getTsharkSessions(1, SESSION_FETCH_SIZE, sessionSource)
      const list = (r?.records ?? r?.data ?? []) as TsharkSession[]
      sessions.value = list
      sessionBackendTotal.value = r?.total ?? list.length

      const current = activeSessionId.value
      const currentGone = current != null && !list.some(s => s.id === current)
      if (currentGone) {
        // 当前会话已被删除 / 不在返回里：清掉，避免详情区一直显示一个不存在的会话
        clearActiveSession()
      }
      // 有会话可选、且「刚才选的那个没了」或「本来就没选（首次进入）」时才自动选中；
      // resetActive=false 的推送刷新不会把用户正看着的会话换掉。
      // autoSelectFirst=false 时这一步整个跳过（PCAP 分析页：目录页不替用户挑一条）。
      if (autoSelectFirst && list.length > 0 && (currentGone || (resetActive && activeSessionId.value == null))) {
        selectSession(list[0].id)
      }
      clampSessionPage()
    } catch (e: any) {
      message.error('加载会话失败: ' + (e?.message || e))
    } finally {
      loadingSessions.value = false
    }
  }

  /** 筛选条件变化后页码可能越界（只剩 1 页时还停在第 3 页会是空列表） */
  function clampSessionPage() {
    const max = Math.max(1, Math.ceil(filteredSessions.value.length / SESSION_PAGE_SIZE))
    if (sessionPage.value > max) sessionPage.value = max
    if (sessionPage.value < 1) sessionPage.value = 1
  }

  function setSessionKeyword(v: string) {
    sessionKeyword.value = v
    sessionPage.value = 1
  }

  function setSessionFilter(v: TsharkSessionFilter) {
    sessionFilter.value = v
    sessionPage.value = 1
  }

  function clearActiveSession() {
    closePacketStream()
    activeSessionId.value = null
    packets.value = []
    packetTotal.value = 0
    packetPage.value = 1
    protoStats.value = []
    topFlows.value = []
    liveCount.value = 0
  }

  function selectSession(id: number) {
    activeSessionId.value = id
    liveCount.value = 0
    openPacketStream(id)
    loadPackets(1)
    loadStats()
  }

  // ==================== 报文 ====================
  async function loadPackets(page = packetPage.value) {
    const sid = activeSessionId.value
    if (sid == null) return
    loadingPackets.value = true
    try {
      const r = await getTsharkPackets(sid, page, PACKET_PAGE_SIZE, packetKeyword.value.trim())
      // 竞态丢弃：慢请求回来时用户可能已经切到别的会话，写进去会串数据
      if (sid !== activeSessionId.value) return
      packets.value = (r?.records ?? r?.data ?? []) as TsharkPacket[]
      packetTotal.value = r?.total ?? packets.value.length
      packetPage.value = page
    } catch (e: any) {
      message.error('加载数据包失败: ' + (e?.message || e))
    } finally {
      loadingPackets.value = false
    }
  }

  /** 关键字变化：防抖 300ms 后回第一页重查（换关键字后页码不再有意义） */
  function setPacketKeyword(v: string) {
    packetKeyword.value = v
    if (keywordTimer) clearTimeout(keywordTimer)
    keywordTimer = setTimeout(() => loadPackets(1), 300)
  }

  /** 从统计面板点某个协议跳到报文：直接用它当关键字 */
  function filterByProtocol(protocol: string) {
    if (keywordTimer) clearTimeout(keywordTimer)
    packetKeyword.value = protocol
    loadPackets(1)
  }

  function refresh() {
    loadSessions(false)
    if (activeSessionId.value != null) {
      loadPackets()
      loadStats()
    }
  }

  /**
   * 导出当前查询结果为 CSV。
   *
   * <p>导的是**当前页**结果，不是整会话全量 —— 否则一次导出几十万行会把浏览器拖死。
   * 字段顺序与表格列一致，便于对照。表头的 BOM 与公式转义见下。</p>
   */
  function exportCsv() {
    if (activeSessionId.value == null || packets.value.length === 0) {
      message.warning('当前没有可导出的数据包')
      return
    }
    const head = ['时间', '协议', '源IP', '源端口', '目的IP', '目的端口', '长度(字节)', '摘要']
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? '' : String(v)
      // CSV 里以 = + - @ 开头的值会被 Excel 当公式执行，前置单引号 neutralize
      const safe = /^[=+\-@]/.test(s) ? "'" + s : s
      return /[",\n\r]/.test(safe) ? '"' + safe.replace(/"/g, '""') + '"' : safe
    }
    const lines = [head.join(',')]
    for (const p of packets.value) {
      lines.push([
        p.packetTime, p.protocol || 'OTHER', p.sourceIp, p.sourcePort,
        p.destIp, p.destPort, p.packetLength ?? 0, p.packetInfo || p.restoredText || '',
      ].map(esc).join(','))
    }
    // BOM：没有它 Excel 打开中文表头会乱码
    const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `tshark-session-${activeSessionId.value}-page${packetPage.value}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    message.success(`已导出本页 ${packets.value.length} 条`)
  }

  /** 下载原始 pcap：页面上的摘要只是 tshark 的解析结果，要深挖得拿原件去 Wireshark 打开 */
  function downloadPcap(id: number, name?: string) {
    const a = document.createElement('a')
    a.href = tsharkPcapUrl(id)
    a.download = name || `capture-${id}.pcap`
    a.click()
  }

  // ==================== 统计 ====================
  async function loadStats() {
    const sid = activeSessionId.value
    if (sid == null) {
      protoStats.value = []
      topFlows.value = []
      return
    }
    loadingStats.value = true
    try {
      // 两个统计接口互不依赖，并行发；任一失败只清空自己那一份，不影响另一张图
      const [p, f] = await Promise.allSettled([
        getTsharkProtocolStats(sid),
        getTsharkTopFlows(sid, 10),
      ])
      if (sid !== activeSessionId.value) return
      protoStats.value = p.status === 'fulfilled' ? (p.value as TsharkProtocolStat[]) : []
      topFlows.value = f.status === 'fulfilled' ? (f.value as TsharkFlow[]) : []
      statsVersion.value++
    } finally {
      loadingStats.value = false
    }
  }

  // ==================== 抓包控制 ====================
  async function startCapture(): Promise<boolean> {
    if (!iface.value) {
      message.warning('请选择网卡')
      return false
    }
    starting.value = true
    try {
      await startTsharkCapture({
        name: captureName.value.trim() || undefined,
        captureInterface: iface.value,
        captureFilter: filter.value.trim() || undefined,
        filterType: filterType.value,
        count: count.value > 0 ? count.value : undefined,
        timeout: timeout.value > 0 ? timeout.value : undefined,
      })
      message.success('抓包已启动')
      captureName.value = ''
      await loadSessions()
      return true
    } catch (e: any) {
      message.error('启动抓包失败: ' + (e?.message || e))
      return false
    } finally {
      starting.value = false
    }
  }

  /**
   * 导入 pcap 文件（PCAP 分析）。
   *
   * <p>上传成功后后端先把会话落库、再在后台整份解析，会话是「立刻可见、包数陆续长」的。</p>
   *
   * @param file      选中的 pcap 文件
   * @param name      会话名（可空，后端回退用原始文件名）
   * @param autoSelect 是否在上传成功后直接跳进这条记录的详情。
   *   PCAP 分析页传 false：它的列表本身就是「目录页」，导入完停在这里看包数往上涨，
   *   比直接跳到还空着的报文页更符合预期（合作方要看的是「传上去了没、解出来了没」）。
   * @returns 是否上传成功；失败已弹提示，页面据此决定要不要清空已选文件
   */
  async function importPcap(file: File, name = '', autoSelect = true): Promise<boolean> {
    importing.value = true
    try {
      const created = await importTsharkPcap(file, name.trim())
      message.success('pcap 已上传，后台开始解析 —— 报文数会陆续增长')
      // resetActive=false：不抢用户当前的选中项；紧接着再按 autoSelect 决定要不要选中新建的那条
      await loadSessions(false)
      const id = created?.id ?? null
      if (autoSelect && id != null) selectSession(id)
      return true
    } catch (e: any) {
      message.error('导入失败: ' + (e?.message || e))
      return false
    } finally {
      importing.value = false
    }
  }

  async function stopSession(id: number) {
    try {
      await stopTsharkCapture(id)
      message.success('已停止抓包')
      loadSessions(false)
    } catch (e: any) {
      message.error('停止失败: ' + (e?.message || e))
    }
  }

  async function deleteSession(id: number) {
    try {
      await message.confirm('确认删除该会话及其所有数据包？', '提示', '确定', '取消', 'warning')
    } catch {
      return
    }
    try {
      await delTsharkSession(id)
      message.success('已删除')
      if (activeSessionId.value === id) {
        clearActiveSession()
        detailOpen.value = false
        packetDetail.value = null
      }
      // 传 true：被删的正好是当前会话时（现在已经没有选中项），顺手选中列表第一个；
      // 删的是别的会话时选中项没被清掉，这里也不会被换走（见 loadSessions 里的判定）。
      await loadSessions(true)
    } catch (e: any) {
      message.error('删除失败: ' + (e?.message || e))
    }
  }

  async function openPacketDetail(row: TsharkPacket) {
    await openPacketDetailById(row.id)
  }

  /**
   * 按报文 id 打开详情。
   *
   * <p>生命周期时序图里只有 packetId，没有完整行数据，单独给一个入口，
   * 避免调用方为了凑一个 TsharkPacket 去造空对象。</p>
   *
   * @param id 报文 id
   */
  async function openPacketDetailById(id: number) {
    try {
      packetDetail.value = await getTsharkPacketDetail(id) as TsharkPacket
      detailOpen.value = true
    } catch (e: any) {
      message.error('加载详情失败: ' + (e?.message || e))
    }
  }

  // ==================== socket.io 会话推送 ====================
  // 报文改走上面的按会话 SSE；socket.io 只保留 `tshark-session` 这一路，
  // 用于「别的会话被启动/停止/删除」时刷新列表 —— SSE 只覆盖当前选中的会话。
  const socket = useSocketService()
  const socketUnsubs: Array<() => void> = []

  if (socket) {
    socketUnsubs.push(socket.subscribe('monitor', 'tshark-session', () => {
      loadSessions(false)
    }))
  }

  onBeforeUnmount(() => {
    socketUnsubs.forEach(fn => fn?.())
    closePacketStream()
    if (keywordTimer) clearTimeout(keywordTimer)
  })

  return {
    // 环境
    tsharkOk, interfaces, ifaceOptions,
    // 抓包参数
    iface, filter, count, timeout, starting, importing,
    // 会话
    loadingSessions, sessions, sessionBackendTotal, sessionKeyword, sessionFilter,
    sessionPage, activeSessionId, activeSession, filteredSessions, pagedSessions,
    runningCount, sessionPageSize: SESSION_PAGE_SIZE,
    // 报文
    loadingPackets, packets, packetPage, packetTotal, packetKeyword, packetPageSize: PACKET_PAGE_SIZE,
    // 统计
    loadingStats, protoStats, topFlows, statsVersion,
    // 详情
    detailOpen, packetDetail,
    // 实时
    liveCount, liveConnected,
    // 动作
    init, loadInterfaces, loadSessions, selectSession, setSessionKeyword, setSessionFilter,
    clearActiveSession, loadPackets, setPacketKeyword, filterByProtocol, refresh, exportCsv,
    downloadPcap, loadStats, startCapture, stopSession, deleteSession, openPacketDetail,
    openPacketDetailById,
    importPcap,
  }
}
