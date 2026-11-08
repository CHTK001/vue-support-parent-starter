<template>
  <div class="sc-control">
    <!-- 顶部状态栏 -->
    <div class="top-bar">
      <div class="left-side">
        <span class="title">设备远程控制</span>
        <el-tag :type="status.type" round size="small" class="status-tag">
          {{ status.text }}
        </el-tag>
      </div>
      <div class="right-side">
        <el-button size="small" :icon="Key" :type="keyboardMode ? 'primary' : 'default'" @click="onToggleKeyboard" :disabled="!controls.connected">
          {{ keyboardMode ? '键盘已开启' : '开启键盘' }}
        </el-button>
        <el-button size="small" type="danger" :disabled="!controls.connected" @click="onDisconnect">
          断开
        </el-button>
      </div>
    </div>

    <div class="body-area">
      <!-- 左侧：连接面板 -->
      <el-card class="connect-panel" shadow="never">
        <template #header>
          <span>连接设置</span>
        </template>
        <el-form :model="form" label-width="100px" :disabled="controls.connected">
          <el-form-item label="会话 ID">
            <el-input v-model="form.sessionId" placeholder="device-001" />
          </el-form-item>
          <el-form-item label="Peer ID">
            <el-input v-model="form.peerId" placeholder="browser-001" />
          </el-form-item>
          <el-form-item label="信令地址">
            <el-input v-model="form.wsUrl" placeholder="ws://host:10000/webrtc" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="controls.connecting" @click="onConnect" :disabled="!form.sessionId">
              连接
            </el-button>
            <el-button type="success" @click="onShare" :disabled="!controls.connected">
              屏幕共享
            </el-button>
            <el-button type="danger" @click="onDisconnect" :disabled="!controls.connected">
              断开
            </el-button>
          </el-form-item>
        </el-form>

        <div class="panel-section">
          <div class="panel-title">活跃会话</div>
          <el-tree
            v-if="sessions.length"
            :data="sessions"
            node-key="sessionId"
            :props="treeProps"
            default-expand-all
            :expand-on-click-node="false"
            class="sessions-tree"
          />
          <el-empty v-else description="无活跃会话" :image-size="40" />
        </div>
      </el-card>

      <!-- 中心：远程桌面 -->
      <div
        class="video-area"
        @mousedown="onMouseDown"
        @mouseup="onMouseUp"
        @mousemove="onMouseMove"
        @wheel.prevent="onWheel"
        @contextmenu.prevent
      >
        <video id="remoteVideo" ref="videoRef" preload="auto" muted></video>
        <div class="coords-display">{{ coords }}</div>
      </div>
    </div>

    <!-- 底部：日志控制台 -->
    <div class="log-panel">
      <div class="log-header">
        <span>输出日志</span>
        <el-button size="small" @click="clearLog">清空</el-button>
      </div>
      <div ref="logContent" class="log-content">
        <div v-for="(line, i) in logLines" :key="i" class="log-entry" :class="line.type">
          {{ line.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  /**
   * 设备远程控制页面
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
   * @author CH
   * @since 4.0.0.50
   */
  import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
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
  import type { ControlSession, KeyboardEventPayload, MouseEventPayload } from '../api/controlApi'

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

  /** 鼠标坐标显示 */
  const coords = ref('未连接')

  /** 会话树 */
  const treeProps = {
    children: 'peers',
    label: 'sessionId',
  }

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

  function setStatus(type: 'info' | 'success' | 'warning' | 'error', text: string): void {
    status.type = type
    status.text = text
    addLog(type === 'error' ? 'err' : type === 'warning' ? 'warn' : 'ok', `[status] ${text}`)
  }

  /** 创建并挂接本地 PeerConnection */
  function createPeer(): RTCPeerConnection {
    const rtc = new RTCPeerConnection({ iceServers: [] })

    // 关键：offerer 必须先建 DataChannel，SDP 才会带 m=application(SCTP)，
    // Java 端创建的 "control" 通道才能协商成功。
    rtc.createDataChannel('browser')

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
          setStatus('success', '已连接')
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
    coords.value = '未连接'
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
      controls.connecting = false
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

  async function onShare(): Promise<void> {
    try {
      const screensList = await listControlScreens()
      addLog('ok', `[screens] ${screensList.length} 个屏幕源`)
      screensList.forEach((s) => addLog('ok', `[screens] ${s.id} ${s.name} ${s.width}x${s.height}`))
    } catch (e) {
      addLog('warn', `[screens] load fail: ${String(e)}`)
    }
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
    try {
      const list = await listControlSessions()
      sessions.value = list
      addLog('ok', `[session] ${list.length} active sessions`)
    } catch (e) {
      addLog('warn', `[session] load fail: ${String(e)}`)
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyDown, true)
    window.removeEventListener('keyup', onKeyUp, true)
    onDisconnect()
  })
</script>

<style scoped>
  .sc-control {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--ctrl-panel, #151922);
    color: var(--ctrl-text, #e6e9ef);
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: var(--ctrl-panel, #151922);
    border-bottom: 1px solid var(--ctrl-border, #252a36);
  }

  .title {
    font-size: 14px;
    font-weight: 600;
    color: var(--ctrl-text, #e6e9ef);
  }

  .body-area {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .connect-panel {
    width: 300px;
    margin: 8px;
    background: var(--ctrl-panel, #151922);
    border: 1px solid var(--ctrl-border, #252a36);
    border-radius: 6px;
  }

  .connect-panel :deep(.el-card__header) {
    border-bottom: 1px solid var(--ctrl-border, #252a36);
    background: var(--ctrl-panel, #151922);
    color: var(--ctrl-text, #e6e9ef);
  }

  .panel-section {
    margin-top: 12px;
  }

  .panel-title {
    font-size: 12px;
    color: var(--ctrl-text, #e6e9ef);
    margin-bottom: 4px;
  }

  .video-area {
    flex: 1;
    margin: 8px;
    position: relative;
    background: #000;
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #remoteVideo {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .coords-display {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-family: Consolas, monospace;
    pointer-events: none;
  }

  .log-panel {
    height: 160px;
    border-top: 1px solid var(--ctrl-border, #252a36);
    background: var(--ctrl-panel, #151922);
    display: flex;
    flex-direction: column;
  }

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    border-bottom: 1px solid var(--ctrl-border, #252a36);
    font-size: 13px;
    color: var(--ctrl-text, #e6e9ef);
  }

  .log-content {
    flex: 1;
    overflow-y: auto;
    font-family: 'Fira Code', Consolas, monospace;
    font-size: 12px;
    line-height: 1.6;
  }

  .log-entry {
    padding: 2px 8px;
  }

  .log-entry.warn {
    color: var(--ctrl-warning, #e6a23c);
  }

  .log-entry.err {
    color: var(--ctrl-danger, #f56c6c);
  }

  .log-entry.ok {
    color: var(--ctrl-success, #67c23a);
  }

  /** 滚动条 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--ctrl-panel, #151922);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--ctrl-border, #252a36);
    border-radius: 4px;
  }
</style>
