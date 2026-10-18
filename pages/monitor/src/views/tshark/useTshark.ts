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
/**
 * 实时推送往列表里追加的上限。
 *
 * <p>长跑会话每秒可能几十条，无上限追加会把 DOM 和滚动位置拖垮；
 * 到顶后只刷新统计数字，不再新增行 —— 用户需要更早的包时翻页即可。</p>
 */
const LIVE_ROW_CAP = 500

export function useTshark(options: { source?: string } = {}) {
  /**
   * 会话来源过滤：抓包分析页传 {@code 'live'}、PCAP 分析页传 {@code 'import'}。
   *
   * <p>过滤放后端（sessions 接口的 source 参数）而不是前端：两类会话共用一张表，
   * 只拉回自己那一类才不会让「已加载 N/M」的总数被对方的数据撑大，
   * 也省掉「拉 200 条再丢掉一半」的浪费。</p>
   */
  const sessionSource = options.source ?? ''

  // ===== TShark 环境 =====
  const tsharkOk = ref(false)
  const interfaces = ref<TsharkInterface[]>([])

  // ===== 抓包参数 =====
  const iface = ref('')
  const filter = ref('')
  const count = ref(500)
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
      if (list.length > 0 && (currentGone || (resetActive && activeSessionId.value == null))) {
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
  async function startCapture() {
    if (!iface.value) {
      message.warning('请选择网卡')
      return
    }
    starting.value = true
    try {
      await startTsharkCapture({
        name: `${iface.value} 抓包 ${new Date().toLocaleTimeString()}`,
        captureInterface: iface.value,
        captureFilter: filter.value || undefined,
        count: count.value > 0 ? count.value : undefined,
        timeout: timeout.value > 0 ? timeout.value : undefined,
      })
      message.success('抓包已启动')
      await loadSessions()
    } catch (e: any) {
      message.error('启动抓包失败: ' + (e?.message || e))
    } finally {
      starting.value = false
    }
  }

  /**
   * 导入 pcap 文件（PCAP 分析）。
   *
   * <p>上传成功后后端先把会话落库、再在后台整份解析，所以这里要显式选中刚建的那条：
   * 用户点完「导入」马上就想看到包在往里进，不该再让他去列表里找。
   * 解析进度靠会话推送刷新（包数在长），不需要前端轮询。</p>
   *
   * @param file 选中的 pcap 文件
   * @param name 会话名（可空，后端回退用原始文件名）
   * @returns 是否上传成功；失败已弹提示，页面据此决定要不要清空已选文件
   */
  async function importPcap(file: File, name = ''): Promise<boolean> {
    importing.value = true
    try {
      const created = await importTsharkPcap(file, name.trim())
      message.success('pcap 已上传，后台开始解析 —— 报文数会陆续增长')
      // resetActive=false：不抢用户当前的选中项；紧接着再显式选中新建的那条
      await loadSessions(false)
      const id = created?.id ?? null
      if (id != null) selectSession(id)
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
    try {
      packetDetail.value = await getTsharkPacketDetail(row.id) as TsharkPacket
      detailOpen.value = true
    } catch (e: any) {
      message.error('加载详情失败: ' + (e?.message || e))
    }
  }

  // ==================== socket.io 实时推送 ====================
  // 后端 MonitorPushService 协议：module=monitor，event=tshark-packet / tshark-session，
  // dataId=sessionId；当前会话匹配时新包去重追加，统计与图表增量刷新。
  const socket = useSocketService()
  const socketUnsubs: Array<() => void> = []

  if (socket) {
    socketUnsubs.push(socket.subscribe('monitor', 'tshark-packet', (msg: any) => {
      const packet = msg?.data ?? msg
      if (activeSessionId.value == null || packet == null) return
      const sid = String(msg?.dataId ?? packet?.sessionId)
      if (sid !== String(activeSessionId.value)) return
      if (packets.value.some(p => p.id === packet?.id)) return

      liveCount.value++
      packetTotal.value++
      // 协议分布是整会话口径，任何一页都该跟着涨
      const proto = packet?.protocol || 'OTHER'
      const hit = protoStats.value.find(s => s.protocol === proto)
      if (hit) hit.count++
      else protoStats.value.push({ protocol: proto, count: 1 })
      statsVersion.value++

      // 只在第一页、且没有关键字过滤时往列表里插行：
      //  - 关键字生效时列表是「库里按关键字筛出来的子集」，塞不匹配的行会让总数与页码对不上；
      //  - 翻在第 2 页及以后时，新包属于第 1 页，插进来是错位的。
      if (packetKeyword.value.trim()) return
      if (packetPage.value !== 1) return
      packets.value.unshift(packet as TsharkPacket)
      if (packets.value.length > LIVE_ROW_CAP) packets.value.length = LIVE_ROW_CAP
    }))
    socketUnsubs.push(socket.subscribe('monitor', 'tshark-session', () => {
      // 会话增删改由后端推送：刷新列表但不抢用户的选中项
      loadSessions(false)
    }))
    // socket 自身没有 connected 事件，用轮询把它映射成一个可响应的标志
    const tick = setInterval(() => { liveConnected.value = !!socket.isConnected }, 2000)
    socketUnsubs.push(() => clearInterval(tick))
  }

  onBeforeUnmount(() => {
    socketUnsubs.forEach(fn => fn?.())
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
    importPcap,
  }
}
