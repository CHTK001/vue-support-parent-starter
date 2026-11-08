<template>
  <div class="sc-control">
    <!-- 顶部工具条：状态 + 全局动作 -->
    <div class="ctrl-bar">
      <div class="bar-title">设备远程控制</div>
      <span class="pill" :class="statusTone">
        <i class="dot" :class="statusTone"></i>
        {{ status.text }}
      </span>
      <span v-if="form.sessionId" class="pill mono">{{ form.sessionId }}</span>
      <span class="bar-grow"></span>
      <el-button size="small" :icon="Key" :type="keyboardMode ? 'primary' : 'default'" plain
                 :disabled="!controls.connected" @click="onToggleKeyboard">
        {{ keyboardMode ? '键盘已开启' : '开启键盘' }}
      </el-button>
      <el-button size="small" plain @click="toggleLog">
        {{ logOpen ? '收起日志' : '展开日志' }}
      </el-button>
      <el-button size="small" type="danger" plain :disabled="!controls.connected" @click="onDisconnect">
        断开
      </el-button>
    </div>

    <!-- 后端不可用时的可读提示（代替一片黑） -->
    <div v-if="backendNotice" class="notice">
      <span class="notice-tag">后端</span>
      <span class="notice-text">{{ backendNotice }}</span>
      <el-button link type="primary" size="small" @click="refreshBackend">重新检测</el-button>
    </div>

    <div class="ctrl-body">
      <!-- 左栏：接入设置（选目标 → 信令 → 建立连接）+ 活跃会话 -->
      <div class="rail">
        <section class="card">
          <header class="card-head">
            <span>接入设置</span>
            <span class="bar-grow"></span>
            <span class="conn" :class="controls.connected ? 'ok' : controls.connecting ? 'warn' : 'idle'">
              {{ controls.connected ? '信令已连接' : controls.connecting ? '连接中' : '信令未连接' }}
            </span>
          </header>
          <div class="card-body">
            <div class="group">
              <div class="group-title">
                <span class="step" :class="{ dim: !!form.sessionId }">1</span>
                <span>目标设备</span>
              </div>
              <label class="field">
                <span>会话 ID</span>
                <el-input v-model="form.sessionId" placeholder="device-001" :disabled="controls.connected" />
              </label>
              <label class="field">
                <span>Peer ID</span>
                <el-input v-model="form.peerId" placeholder="browser-001" :disabled="controls.connected" />
              </label>
              <em class="field-tip">与后端会话一致；重复填写同一 ID 会复用会话</em>
            </div>

            <div class="group">
              <div class="group-title">
                <span class="step" :class="{ dim: controls.connected }">2</span>
                <span>信令地址</span>
              </div>
              <label class="field">
                <el-input v-model="form.wsUrl" class="mono" placeholder="ws://host:10000/webrtc"
                          :disabled="controls.connected" />
              </label>
            </div>

            <el-button type="primary" class="full" :loading="controls.connecting" :disabled="!form.sessionId"
                       @click="onConnect">
              建立连接
            </el-button>
          </div>
        </section>

        <section class="card grow">
          <header class="card-head">
            <span>活跃会话</span>
            <span class="count">{{ sessions.length }}</span>
            <span class="bar-grow"></span>
            <el-button link type="primary" size="small" :loading="sessionLoading" @click="refreshSessions">
              刷新
            </el-button>
          </header>
          <div class="card-body tight">
            <div v-for="s in sessions" :key="s.sessionId" class="session" @click="onPickSession(s.sessionId)">
              <i class="dot" :class="s.capturing ? 'ok' : 'idle'"></i>
              <span class="session-id mono">{{ s.sessionId }}</span>
              <span class="session-meta">{{ s.peerCount }} 端</span>
              <span class="session-pick">接入</span>
            </div>
            <div v-if="!sessions.length" class="empty-mini">无活跃会话</div>
          </div>
        </section>
      </div>

      <!-- 右栏：画面 -->
      <section class="screen">
        <header class="screen-head">
          <div class="tabs">
            <button type="button" class="tab" :class="{ on: activeTab === 'video' }" @click="activeTab = 'video'">
              画面
            </button>
            <button type="button" class="tab" :class="{ on: activeTab === 'screens' }" @click="switchScreens">
              屏幕源
            </button>
          </div>
          <span class="bar-grow"></span>
          <span class="hint mono">{{ coords }}</span>
        </header>

        <div v-show="activeTab === 'video'" class="stage"
             @mousedown="onMouseDown"
             @mouseup="onMouseUp"
             @mousemove="onMouseMove"
             @wheel.prevent="onWheel"
             @contextmenu.prevent>
          <video id="remoteVideo" ref="videoRef" preload="auto" muted></video>

          <div v-if="!controls.connected" class="stage-empty">
            <div class="ring">▣</div>
            <h4>{{ form.sessionId ? '还没有接入画面' : '还没有选择目标设备' }}</h4>
            <p>
              填好左侧会话 ID 后点「建立连接」。连上之后，鼠标与键盘会直接作用在远端桌面。
            </p>
            <div class="chips">
              <span>1 填会话 ID</span>
              <span>2 建立连接</span>
              <span>3 开始操作</span>
            </div>
          </div>

          <span class="stage-badge">{{ controls.connected ? 'LIVE' : 'OFFLINE' }}</span>
        </div>

        <div v-show="activeTab === 'screens'" class="screen-list">
          <div class="screen-list-head">
            <span>桌面采集源</span>
            <span class="bar-grow"></span>
            <el-button size="small" plain :loading="screenLoading" @click="loadScreens">重新枚举</el-button>
          </div>
          <div v-for="s in screens" :key="s.id" class="screen-row">
            <span class="mono">{{ s.id }}</span>
            <span class="screen-name">{{ s.name }}</span>
            <span class="mono">{{ s.width }} × {{ s.height }}</span>
          </div>
          <div v-if="!screens.length" class="empty-mini">
            {{ screenLoading ? '枚举中…' : '没有可用的桌面源（后端未提供采集实现时恒为空）' }}
          </div>
        </div>
      </section>
    </div>

    <!-- 底部日志抽屉 -->
    <section v-show="logOpen" class="log">
      <header class="log-head">
        <span>输出日志</span>
        <span class="count">{{ logLines.length }}</span>
        <span class="bar-grow"></span>
        <el-button link size="small" @click="clearLog">清空</el-button>
        <el-button link size="small" @click="toggleLog">收起</el-button>
      </header>
      <div ref="logContent" class="log-body">
        <div v-for="(line, i) in logLines" :key="i" class="log-line" :class="line.type">
          <span class="tm">{{ line.time }}</span>
          <span class="msg">{{ line.text }}</span>
        </div>
        <div v-if="!logLines.length" class="empty-mini">暂无日志</div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  /**
   * 设备远程控制页面（任务流版式）
   *
   * <p>与 Java WebRtcServer 的交互协议（`/webrtc` 信令 WebSocket）：</p>
   * <ul>
   *   <li>浏览器作为 offerer：先建一个 DataChannel（让 offer 携带 SCTP），再发送首帧
   *       `{"peerId":"&lt;会话ID&gt;","type":"offer","payload":"&lt;SDP offer&gt;"}`（payload 为 SDP 文本）</li>
   *   <li>接收 `{"type":"answer","payload":"&lt;SDP answer&gt;"}` → setRemoteDescription</li>
   *   <li>接收 `{"type":"ice-candidate","payload":"&lt;候选人 JSON 文本&gt;"}` → addIceCandidate</li>
   *   <li>Java 侧创建 "control" 数据通道 → 浏览器 ondatachannel 收到后发送键鼠事件</li>
   *   <li>Java 侧推送桌面视频轨道 → ontrack → video</li>
   * </ul>
   *
   * <p>注意：Java 端把首个帧里的 `peerId` 当作会话 ID，因此这里发送的 `peerId`
   * 使用表单里的「会话 ID」，保证与 REST 创建的会话一致。</p>
   *
   * <p>版式：左栏是一条三步流程（选目标 → 信令 → 会话），右栏是画面，日志收进可折叠抽屉。
   * 后端未挂载时（`/control/**` 404/403/500）在顶部给出可读提示，而不是让画面一片黑。</p>
   *
   * @author CH
   * @since 4.0.0.50
   */
  import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Key } from '@element-plus/icons-vue'
  import {
    createControlSession,
    destroyControlSession,
    listControlSessions,
    listControlScreens,
    keyboardEventJson,
    mouseEventJson,
    signalingUrl,
  } from '../api/controlApi'
  import type { ControlScreen, ControlSession, KeyboardEventPayload, MouseEventPayload } from '../api/controlApi'

  /** WebRTC 信令服务端点 */
  const WS_URL = signalingUrl()

  /** 远程桌面视频流 */
  const remoteStream = ref<MediaStream | null>(null)
  const videoRef = ref<HTMLVideoElement>()
  const logContent = ref<HTMLDivElement>()

  /** 状态 */
  const controls = reactive<{ connecting: boolean; connected: boolean; online: boolean }>({
    connecting: false,
    connected: false,
    online: false,
  })

  const status = reactive<{ type: 'info' | 'success' | 'warning' | 'error'; text: string }>({
    type: 'info',
    text: '未连接',
  })

  const form = reactive<{ sessionId: string; peerId: string; wsUrl: string }>({
    sessionId: '',
    peerId: '',
    wsUrl: WS_URL,
  })

  const logLines = ref<{ time: string; type: string; text: string }[]>([])
  const sessions = ref<ControlSession[]>([])
  const screens = ref<ControlScreen[]>([])

  /** 面板状态：日志抽屉、右侧页签、加载中、后端可用性 */
  const logOpen = ref(true)
  const activeTab = ref<'video' | 'screens'>('video')
  const sessionLoading = ref(false)
  const screenLoading = ref(false)
  const backendNotice = ref('')

  /** 连入端通道 */
  let ws: WebSocket | null = null
  let pc: RTCPeerConnection | null = null
  let controlChannel: RTCDataChannel | null = null

  /** 本地 ICE 候选缓冲：offer 帧发送前先缓存，保证首帧携带会话 ID */
  let pendingCandidates: { sdpMid: string | null; sdpMLineIndex: number | null; sdp: string }[] = []
  /** offer 是否已发送 */
  let offerSent = false

  /** 键盘模式 */
  const keyboardMode = ref(false)

  /** 鼠标坐标显示（未进入画面时是占位符，不代表连接状态） */
  const coords = ref('—')

  /** 状态胶囊的色调 */
  const statusTone = computed(() => {
    switch (status.type) {
      case 'success':
        return 'ok'
      case 'warning':
        return 'warn'
      case 'error':
        return 'err'
      default:
        return 'idle'
    }
  })

  function addLog(type: string, ...args: any[]): void {
    const now = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    logLines.value.push({ time: now, type, text: args.join(' ') })
    if (logLines.value.length > 300) logLines.value = logLines.value.slice(-300)
    nextTick(() => {
      if (logContent.value) logContent.value.scrollTop = logContent.value.scrollHeight
    })
  }

  function clearLog(): void {
    logLines.value = []
  }

  function toggleLog(): void {
    logOpen.value = !logOpen.value
  }

  function setStatus(type: 'info' | 'success' | 'warning' | 'error', text: string): void {
    status.type = type
    status.text = text
    addLog(type === 'error' ? 'err' : type === 'warning' ? 'warn' : 'ok', `[status] ${text}`)
  }

  /**
   * 把后端请求失败翻译成一句人话。
   *
   * <p>`/control/**` 在网关鉴权兜底与「映射不存在」两种情况下都可能返回 403，
   * 前端看到的只是状态码，因此这里按状态码给出可执行的下一步提示。</p>
   *
   * @param e 抛出的异常
   * @returns 提示文本；能确认后端可用时返回空串
   */
  function describeBackendError(e: unknown): string {
    const text = String((e as Error)?.message ?? e)
    if (/\b500\b/.test(text)) {
      return '后端 /control 接口返回 500：控制模块已挂载但内部实现不可用（多为 WebRTC 采集/信令未就绪）。'
    }
    if (/\b403\b/.test(text)) {
      return '后端 /control 接口返回 403：monitor 后端没有挂载远程控制模块，或当前会话未通过鉴权。'
    }
    if (/\b404\b/.test(text)) {
      return '后端 /control 接口返回 404：monitor 后端没有挂载远程控制模块。'
    }
    if (/用户信息不存在|重新登录/.test(text)) {
      return '后端 /control 接口未放行：网关报「用户信息不存在」，通常是该路径未在鉴权白名单内。'
    }
    return ''
  }

  /** 创建并挂接本地 PeerConnection */
  function createPeer(): RTCPeerConnection {
    const rtc = new RTCPeerConnection({ iceServers: [] })

    // 关键：offerer 必须先建 DataChannel，SDP 才会带 m=application(SCTP)，
    // Java 端创建的 "control" 通道才能协商成功。
    rtc.createDataChannel('browser')

    // 关键：offer 必须自带一条 video m-line（只收不发）。
    // 后端 WebRtcPeerImpl 是在收到 offer 之后才 addTrack(桌面轨道) 并 createAnswer；
    // 而 answer 不允许新增 offer 里没有的 m-line。少了这句，SDP 只有 data channel，
    // 后端加轨被 Chrome 丢弃 —— 表现为「已连接、DataChannel 通、但没有画面、video 宽高为 0」。
    rtc.addTransceiver('video', { direction: 'recvonly' })

    rtc.ondatachannel = (e: RTCDataChannelEvent) => {
      const ch = e.channel
      addLog('ok', `[channel] ${ch.readyState} → ${ch.label}`)
      ch.onopen = () => {
        controlChannel = ch
        addLog('ok', `[control] channel open: ${ch.label}`)
      }
      ch.onclose = () => {
        addLog('ok', `[control] channel close: ${ch.label}`)
        controlChannel = null
      }
      ch.onmessage = (ev: MessageEvent) => {
        const msg = ev.data instanceof ArrayBuffer ? new TextDecoder().decode(ev.data) : String(ev.data)
        addLog('ok', `[control] ${msg}`)
      }
      if (ch.readyState === 'open') {
        controlChannel = ch
        addLog('ok', `[control] channel already open: ${ch.label}`)
      }
    }

    rtc.ontrack = (e: RTCTrackEvent) => {
      addLog('ok', `[media] remote track: ${e.track?.id} streams=${e.streams.length}`)
      const stream = e.streams[0] ?? new MediaStream([e.track])
      if (remoteStream.value) remoteStream.value.getTracks().forEach((t) => t.stop())
      remoteStream.value = stream
      if (videoRef.value) {
        videoRef.value.srcObject = stream
        playVideo()
      }
    }

    rtc.onconnectionstatechange = () => {
      const s = rtc.connectionState
      addLog('ok', `[state] ${s}`)
      switch (s) {
        case 'connected':
          controls.online = true
          controls.connected = true
          coords.value = '—'
          setStatus('success', '已连接')
          // 会话在 onConnect 里才创建，挂载时那一次刷新拿不到；连上后补一次，
          // 左栏「活跃会话」才不会一直是 0。
          void refreshSessions()
          break
        case 'failed':
          controls.connected = false
          controls.online = false
          setStatus('error', '连接失败')
          break
        case 'disconnected':
        case 'closed':
          controls.connected = false
          controls.online = false
          setStatus('info', '连接已断开')
          break
      }
    }

    rtc.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
      if (!e.candidate) return
      const init = {
        sdpMid: e.candidate.sdpMid,
        sdpMLineIndex: e.candidate.sdpMLineIndex,
        sdp: e.candidate.candidate,
      }
      if (!offerSent) {
        pendingCandidates.push(init)
        return
      }
      sendSignaling({ peerId: form.sessionId, type: 'ice-candidate', payload: JSON.stringify(init) })
      addLog('ok', `[ice] sent candidate: ${init.sdp}`)
    }
    return rtc
  }

  /** 手动暴露远程桌面视频流 */
  async function playVideo(): Promise<void> {
    const el = videoRef.value
    if (!el) return
    try {
      await el.play()
    } catch {
      // 自动播放被拦截时不抛错
    }
  }

  /** 建立 WS 长连接（等待 onopen 完成） */
  function connectWs(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      ws = new WebSocket(form.wsUrl)
      ws.binaryType = 'arraybuffer'
      ws.onopen = () => {
        addLog('ok', '[ws] connected')
        resolve()
      }
      ws.onclose = () => {
        addLog('warn', '[ws] closed')
        reject(new Error('WebSocket closed'))
      }
      ws.onerror = () => {
        addLog('err', '[ws] error')
        reject(new Error('WebSocket error'))
      }
      ws.onmessage = (ev: MessageEvent) => {
        handleFrame(ev.data)
      }
    })
  }

  /** 将信令消息发送至 Java 服务端 */
  function sendSignaling(msg: Record<string, unknown>): void {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
      return
    }
    addLog('warn', '[sig] ws not ready')
  }

  /** 处理入站信令帧 */
  function handleFrame(data: any): void {
    const raw = (typeof data === 'string' && data) || (data instanceof ArrayBuffer && new TextDecoder().decode(data))
    if (!raw) {
      addLog('warn', '[sig] unknown frame', typeof data)
      return
    }
    let frame: { type?: string; payload?: string }
    try {
      frame = JSON.parse(raw)
    } catch {
      addLog('warn', '[sig] parse fail', raw)
      return
    }
    const { type, payload } = frame
    switch (type) {
      case 'answer':
        addLog('ok', `[sdp] answer received (len=${payload ? payload.length : 0})`)
        if (!pc) return
        pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: payload! }))
          .then(() => addLog('ok', '[sdp] remote description set (answer)'))
          .catch((e: any) => addLog('err', `[sdp] setRemoteDescription failed: ${String(e)}`))
        break
      case 'ice-candidate':
        if (!pc || !payload) return
        try {
          const init = JSON.parse(payload) as {
            sdpMid?: string | null
            sdpMLineIndex?: number | null
            sdp?: string
            candidate?: string
          }
          pc.addIceCandidate({
            candidate: init.candidate ?? init.sdp ?? '',
            sdpMid: init.sdpMid ?? undefined,
            sdpMLineIndex: init.sdpMLineIndex ?? undefined,
          })
            .then(() => addLog('ok', '[ice] candidate added'))
            .catch((e: any) => addLog('err', `[ice] addIceCandidate failed: ${String(e)}`))
        } catch (e: any) {
          addLog('err', `[ice] parse failed: ${String(e)}`)
        }
        break
      case 'ok':
        addLog('ok', '[sig] ok')
        break
      default:
        addLog('warn', `[sig] unknown type: ${type}`)
    }
  }

  /** 映射鼠标坐标到远端视频流像素空间 */
  function mapPixel(e: MouseEvent): { x: number; y: number } {
    const el = videoRef.value
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const streamW = el.videoWidth || rect.width
    const streamH = el.videoHeight || rect.height
    return {
      x: Math.floor((x * streamW) / rect.width),
      y: Math.floor((y * streamH) / rect.height),
    }
  }

  /** 发送原始控制事件 JSON（字段平铺到根节点） */
  function sendRaw(json: string, label: string): void {
    const ch = controlChannel
    if (!ch || ch.readyState !== 'open') {
      addLog('warn', '[control] channel not ready')
      return
    }
    ch.send(json)
    addLog('ok', `[control] ${label}`)
  }

  /** 发送鼠标事件 */
  function sendMouse(payload: MouseEventPayload): void {
    sendRaw(mouseEventJson(payload), `mouse ${payload.action} (${payload.x},${payload.y})`)
  }

  /** 发送键盘事件 */
  function sendKeyboard(payload: KeyboardEventPayload): void {
    sendRaw(keyboardEventJson(payload), `keyboard ${payload.action} keyCode=${payload.keyCode}`)
  }

  /** 退出连接 */
  async function onDisconnect(): Promise<void> {
    const sessionId = form.sessionId
    if (pc) {
      pc.close()
      pc = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
    if (remoteStream.value) {
      remoteStream.value.getTracks().forEach((t) => t.stop())
      remoteStream.value = null
    }
    const video = videoRef.value
    if (video) {
      video.srcObject = null
      video.pause()
    }
    controlChannel = null
    pendingCandidates = []
    offerSent = false
    controls.connected = false
    controls.online = false
    keyboardMode.value = false
    coords.value = '—'
    setStatus('info', '已断开')
    if (sessionId) {
      try {
        await destroyControlSession(sessionId)
      } catch {
        // 会话可能不存在，忽略
      }
    }
  }

  /** 连接（先建 WebSocket，再走 Offer/Answer 信令） */
  async function onConnect(): Promise<void> {
    if (!form.sessionId) {
      ElMessage.warning('请填写会话 ID')
      return
    }
    if (controls.connecting) return
    controls.connecting = true
    controls.connected = false
    controls.online = false
    setStatus('warning', '连接中...')
    clearLog()

    try {
      const session = await createControlSession({ sessionId: form.sessionId, peerId: form.peerId })
      addLog('ok', `[session] created: ${JSON.stringify(session)}`)
    } catch (e) {
      // 会话创建失败（如后端未提供）时仍继续，信令端点本身可协商
      addLog('warn', `[session] create fail (ignored): ${String(e)}`)
    }

    try {
      await connectWs()
      addLog('ok', '[ws] signaling connection established')
    } catch (e) {
      addLog('err', `[ws] signaling fail: ${String(e)}`)
      ElMessage.error('信令连接失败: ' + String(e))
      // 失败后必须落回可重试的状态，否则顶部胶囊会一直停在「连接中...」
      if (ws) {
        ws.onclose = null
        ws.onerror = null
        ws.onmessage = null
        try { ws.close() } catch { /* 已关闭 */ }
        ws = null
      }
      controls.connecting = false
      controls.connected = false
      controls.online = false
      setStatus('error', '信令连接失败')
      return
    }

    try {
      offerSent = false
      pendingCandidates = []
      pc = createPeer()
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      addLog('ok', '[sdp] offer created')
      sendSignaling({ peerId: form.sessionId, type: 'offer', payload: String(offer.sdp ?? '') })
      offerSent = true
      // 发送 offer 前缓存的 ICE 候选
      for (const candidate of pendingCandidates) {
        sendSignaling({ peerId: form.sessionId, type: 'ice-candidate', payload: JSON.stringify(candidate) })
      }
      pendingCandidates = []
      controls.connecting = false
      addLog('ok', '[sdp] offer sent to signaling server')
    } catch (e) {
      addLog('err', `[signaling] offer fail: ${String(e)}`)
      ElMessage.error('信令失败: ' + String(e))
      await onDisconnect()
      controls.connecting = false
    }
  }

  /** 枚举远端桌面源 */
  async function loadScreens(): Promise<void> {
    screenLoading.value = true
    try {
      const screensList = await listControlScreens()
      screens.value = screensList
      backendNotice.value = ''
      addLog('ok', `[screens] ${screensList.length} 个屏幕源`)
      screensList.forEach((s) => addLog('ok', `[screens] ${s.id} ${s.name} ${s.width}x${s.height}`))
    } catch (e) {
      screens.value = []
      const hint = describeBackendError(e)
      if (hint) backendNotice.value = hint
      addLog('warn', `[screens] load fail: ${String(e)}`)
    } finally {
      screenLoading.value = false
    }
  }

  /** 切到「屏幕源」页签并刷新 */
  async function switchScreens(): Promise<void> {
    activeTab.value = 'screens'
    await loadScreens()
  }

  /** 刷新活跃会话；失败时给出后端状态提示 */
  async function refreshSessions(): Promise<void> {
    sessionLoading.value = true
    try {
      const list = await listControlSessions()
      sessions.value = list
      backendNotice.value = ''
      addLog('ok', `[session] ${list.length} active sessions`)
    } catch (e) {
      sessions.value = []
      const hint = describeBackendError(e)
      backendNotice.value = hint
      addLog('warn', `[session] load fail: ${String(e)}`)
    } finally {
      sessionLoading.value = false
    }
  }

  /** 顶部「重新检测」：重新探一次会话列表 */
  async function refreshBackend(): Promise<void> {
    await refreshSessions()
  }

  /** 点会话行：填进目标设备 */
  function onPickSession(sessionId: string): void {
    if (controls.connected) return
    form.sessionId = sessionId
    addLog('ok', `[session] 选中 ${sessionId}`)
  }

  function onToggleKeyboard(): void {
    keyboardMode.value = !keyboardMode.value
    if (keyboardMode.value) {
      window.addEventListener('keydown', onKeyDown, true)
      window.addEventListener('keyup', onKeyUp, true)
    } else {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
    }
    ElMessage.info(keyboardMode.value ? '已进入键盘控制模式' : '已退出键盘控制模式')
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (!keyboardMode.value) return
    e.preventDefault()
    sendKeyboard({
      type: 'keyboard',
      path: 'control',
      timestamp: Date.now(),
      keyCode: e.keyCode,
      action: 'down',
      control: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey,
    })
  }

  function onKeyUp(e: KeyboardEvent): void {
    if (!keyboardMode.value) return
    e.preventDefault()
    sendKeyboard({
      type: 'keyboard',
      path: 'control',
      timestamp: Date.now(),
      keyCode: e.keyCode,
      action: 'up',
      control: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey,
    })
  }

  function onMouseDown(e: MouseEvent): void {
    if (!controls.connected || !videoRef.value) return
    const { x, y } = mapPixel(e)
    const button = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left'
    sendMouse({ type: 'mouse', path: 'control', timestamp: Date.now(), x, y, button, action: 'press', delta: 0 })
  }

  function onMouseUp(e: MouseEvent): void {
    if (!controls.connected || !videoRef.value) return
    const { x, y } = mapPixel(e)
    const button = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left'
    sendMouse({ type: 'mouse', path: 'control', timestamp: Date.now(), x, y, button, action: 'release', delta: 0 })
  }

  function onMouseMove(e: MouseEvent): void {
    if (!videoRef.value) return
    const { x, y } = mapPixel(e)
    coords.value = `${x}, ${y}`
    if (!controls.connected) return
    sendMouse({ type: 'mouse', path: 'control', timestamp: Date.now(), x, y, button: 'left', action: 'move', delta: 0 })
  }

  function onWheel(e: WheelEvent): void {
    if (!controls.connected || !videoRef.value) return
    const { x, y } = mapPixel(e)
    const delta = e.deltaY > 0 ? -1 : 1
    sendMouse({ type: 'mouse', path: 'control', timestamp: Date.now(), x, y, button: 'middle', action: 'wheel', delta })
  }

  onMounted(async () => {
    addLog('ok', '[control] loaded')
    setStatus('warning', '准备连接')
    await refreshSessions()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyDown, true)
    window.removeEventListener('keyup', onKeyUp, true)
    onDisconnect()
  })
</script>

<style scoped>
  /*
   * 版式令牌全部走 monitor（koi/Element）的全局变量，并给出同色 fallback，
   * 这样本页被单独挂载时也不会退回自造暗色皮肤。
   */
  .sc-control {
    --c-brand: var(--brand-500, #1677ff);
    --c-brand-weak: #eef5ff;
    --c-bg: var(--bg-layout, #f2f3f7);
    --c-surface: var(--bg-container, #fff);
    --c-fill: var(--bg-fill, #f5f7fa);
    --c-line: var(--border-subtle, #e5e6eb);
    --c-line-2: var(--border-secondary, #d0d3d8);
    --c-text: var(--text-primary, #1d2129);
    --c-text-2: var(--text-secondary, #4e5359);
    --c-text-3: var(--text-tertiary, #8d9196);
    --c-ok: #16a34a;
    --c-warn: #d97706;
    --c-err: #dc2626;
    --c-radius: var(--radius-md, 8px);
    --c-mono: var(--font-mono, ui-monospace, SFMono-Regular, Consolas, monospace);

    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--c-bg);
    color: var(--c-text);
    font-size: 13px;
  }

  /* ── 顶部工具条 ───────────────────────────── */
  .ctrl-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 16px;
    background: var(--c-surface);
    border-bottom: 1px solid var(--c-line);
    flex: none;
  }

  .bar-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--c-text);
  }

  .bar-grow {
    flex: 1;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 9px;
    border-radius: 999px;
    background: var(--c-fill);
    border: 1px solid var(--c-line);
    color: var(--c-text-2);
    font-size: 12px;
    line-height: 18px;
  }

  .pill.mono {
    font-family: var(--c-mono);
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--c-text-3);
    flex: none;
  }

  .dot.ok {
    background: var(--c-ok);
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.16);
  }

  .dot.warn {
    background: var(--c-warn);
  }

  .dot.err {
    background: var(--c-err);
  }

  .dot.idle {
    background: var(--c-line-2);
  }

  /* ── 后端提示 ─────────────────────────────── */
  .notice {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 12px 16px 0;
    padding: 8px 12px;
    border: 1px solid rgba(217, 119, 6, 0.35);
    background: #fffbeb;
    border-radius: var(--c-radius);
    color: #92400e;
    font-size: 12.5px;
    flex: none;
  }

  .notice-tag {
    flex: none;
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--c-warn);
    color: #fff;
    font-size: 11px;
  }

  .notice-text {
    flex: 1;
    line-height: 1.5;
  }

  /* ── 主体 ────────────────────────────────── */
  .ctrl-body {
    flex: 1;
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    gap: 14px;
    padding: 14px 16px;
    min-height: 0;
  }

  .rail {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    /* 步骤卡按内容占高；剩余高度给「活跃会话」，不够时整栏滚动而不是压扁 */
    overflow-y: auto;
    padding-right: 2px;
  }

  /*
   * monitor 的 pages.css 里有同名全局类（.card / .card-head / .tabs / .mono），
   * 这里把它们漏出来的 padding / shadow / margin / justify-content 显式覆盖掉，
   * 否则卡片会被撑开、标题被推到右边、页签下面多一条线。
   */
  .card {
    background: var(--c-surface);
    border: 1px solid var(--c-line);
    border-radius: var(--c-radius);
    box-shadow: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 0 0 auto;
  }

  .card.grow {
    flex: 1 1 0;
    min-height: 96px;
  }

  .card-head {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    padding: 9px 12px;
    margin-bottom: 0;
    border-bottom: 1px solid var(--c-line);
    font-weight: 600;
    font-size: 12.5px;
    color: var(--c-text);
    flex: none;
  }

  .card-body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
  }

  .card-body.tight {
    padding: 6px;
    gap: 2px;
    overflow: auto;
  }

  .step {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--c-brand);
    color: #fff;
    display: grid;
    place-items: center;
    font-size: 11px;
    font-weight: 600;
    flex: none;
  }

  .step.dim {
    background: var(--c-line-2);
  }

  .count {
    padding: 0 6px;
    border-radius: 8px;
    background: var(--c-fill);
    color: var(--c-text-2);
    font-size: 11px;
    font-weight: 500;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .field > span {
    font-size: 12px;
    color: var(--c-text-2);
  }

  .field-tip {
    font-style: normal;
    font-size: 11.5px;
    line-height: 1.5;
    color: var(--c-text-3);
  }

  .field.mono :deep(.el-input__inner),
  .mono {
    font-family: var(--c-mono);
    font-size: 12px;
  }

  /* ── 接入设置里的分组（目标 / 信令） ───────── */
  .group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-bottom: 12px;
    border-bottom: 1px dashed var(--c-line);
  }

  .group:last-of-type {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .group-title {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--c-text);
  }

  /* 卡片标题右侧的信令状态 */
  .conn {
    font-size: 11.5px;
    color: var(--c-text-3);
    font-weight: 500;
  }

  .conn.ok {
    color: var(--c-ok);
  }

  .conn.warn {
    color: var(--c-warn);
  }

  .full {
    width: 100%;
  }

  .session {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px;
    border-radius: 6px;
    cursor: pointer;
  }

  .session:hover {
    background: var(--c-fill);
  }

  .session-id {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: var(--c-text);
  }

  .session-meta,
  .session-pick {
    font-size: 11.5px;
    color: var(--c-text-3);
    flex: none;
  }

  .session-pick {
    color: var(--c-brand);
  }

  .empty-mini {
    padding: 14px 8px;
    text-align: center;
    font-size: 12px;
    color: var(--c-text-3);
  }

  /* ── 画面区 ──────────────────────────────── */
  .screen {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    background: var(--c-surface);
    border: 1px solid var(--c-line);
    border-radius: var(--c-radius);
    overflow: hidden;
  }

  .screen-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px;
    border-bottom: 1px solid var(--c-line);
    flex: none;
  }

  .tabs {
    display: flex;
    gap: 2px;
    border-bottom: 0;
    margin-bottom: 0;
  }

  .tab {
    border: 0;
    background: transparent;
    padding: 5px 12px;
    border-radius: 6px;
    font: inherit;
    font-size: 12.5px;
    color: var(--c-text-2);
    cursor: pointer;
  }

  .tab:hover {
    background: var(--c-fill);
  }

  .tab.on {
    background: var(--c-brand-weak);
    color: var(--c-brand);
    font-weight: 600;
  }

  .hint {
    font-size: 11.5px;
    color: var(--c-text-3);
  }

  .stage {
    position: relative;
    flex: 1;
    min-height: 0;
    background: #0d1117;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: crosshair;
  }

  #remoteVideo {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .stage-empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px;
    text-align: center;
    color: #93a1b5;
    pointer-events: none;
  }

  .stage-empty h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #d8e0ea;
  }

  .stage-empty p {
    margin: 0;
    max-width: 420px;
    font-size: 12.5px;
    line-height: 1.7;
  }

  .ring {
    width: 52px;
    height: 52px;
    border: 2px dashed #2a3444;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: #6d7d92;
    font-size: 16px;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
  }

  .chips span {
    padding: 3px 10px;
    border: 1px solid #2a3444;
    background: #121a25;
    border-radius: 999px;
    font-size: 12px;
    color: #9fb0c6;
  }

  .stage-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(6, 12, 20, 0.72);
    color: #cfe0f6;
    font-family: var(--c-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    pointer-events: none;
  }

  .screen-list {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 0 0 8px;
  }

  .screen-list-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    border-bottom: 1px solid var(--c-line);
    font-size: 12.5px;
    font-weight: 600;
    color: var(--c-text);
  }

  .screen-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 12px;
    border-bottom: 1px dashed var(--c-line);
    font-size: 12px;
    color: var(--c-text-2);
  }

  .screen-name {
    flex: 1;
    color: var(--c-text);
  }

  /* ── 日志抽屉 ────────────────────────────── */
  .log {
    flex: none;
    height: 150px;
    margin: 0 16px 14px;
    display: flex;
    flex-direction: column;
    background: var(--c-surface);
    border: 1px solid var(--c-line);
    border-radius: var(--c-radius);
    overflow: hidden;
  }

  .log-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 12px;
    border-bottom: 1px solid var(--c-line);
    font-size: 12px;
    color: var(--c-text-2);
    flex: none;
  }

  .log-body {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
    font-family: var(--c-mono);
    font-size: 11.5px;
    line-height: 1.65;
  }

  .log-line {
    display: flex;
    gap: 10px;
    padding: 1px 12px;
    color: var(--c-text-2);
  }

  .log-line .tm {
    flex: none;
    color: var(--c-text-3);
  }

  .log-line .msg {
    word-break: break-all;
  }

  .log-line.ok .msg {
    color: #2f7d32;
  }

  .log-line.warn .msg {
    color: #b26a00;
  }

  .log-line.err .msg {
    color: #c0392b;
  }

  /* 窄屏：左栏折到上面，画面保底高度 */
  @media (max-width: 1100px) {
    .ctrl-body {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto minmax(320px, 1fr);
    }

    .rail {
      max-height: 260px;
      overflow: auto;
    }
  }
</style>
