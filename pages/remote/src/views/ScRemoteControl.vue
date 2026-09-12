<template>
  <div class="remote-control">
    <el-card class="connect-panel" shadow="never">
      <template #header>
        <div class="panel-header">
          <span>远程连接</span>
          <el-tag :type="wsConnected ? 'success' : 'info'" size="small">
            {{ wsConnected ? '已连接' : '未连接' }}
          </el-tag>
        </div>
      </template>
      <el-form :model="form" label-width="100px" :disabled="wsConnected">
        <el-form-item label="被控端ID">
          <el-input v-model="form.agentId" placeholder="agent-xxx" />
        </el-form-item>
        <el-form-item label="验证码">
          <el-input v-model="form.verifyCode" placeholder="0000" />
        </el-form-item>
        <el-form-item label="连接方式">
          <el-select v-model="form.connMethod" style="width: 100%">
            <el-option label="SSH (WebSocket)" value="ssh" />
            <el-option label="远程桌面 (WebRTC)" value="rdp" />
          </el-select>
        </el-form-item>
        <el-form-item label="反向隧道">
          <el-switch v-model="form.reverseTunnel" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="doConnect" :loading="connecting">连接</el-button>
          <el-button type="danger" @click="doDisconnect" :disabled="!wsConnected">断开</el-button>
        </el-form-item>
      </el-form>
      <el-alert v-if="verifyResult" :title="verifyResult.message || ''" :type="verifyResult.success ? 'success' : 'error'" show-icon :closable="false" />
    </el-card>

    <div class="work-area">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="SSH 终端" name="ssh">
          <div ref="terminalRef" class="terminal-container" />
          <div class="terminal-input">
            <el-input v-model="cmdInput" placeholder="输入命令..." @keydown.enter="sendCmd" :disabled="!wsConnected">
              <template #append>
                <el-button @click="sendCmd" :disabled="!wsConnected">发送</el-button>
              </template>
            </el-input>
          </div>
        </el-tab-pane>
        <el-tab-pane label="远程桌面" name="desktop">
          <div class="desktop-container" ref="desktopRef">
            <span v-if="!desktopFrame" class="placeholder">等待远程桌面数据...</span>
            <canvas v-else ref="desktopCanvas" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 远程控制页面
 *
 * 通过 Agent 网关建立 WebSocket 连接，提供 SSH 终端与 WebRTC 远程桌面（JPEG 帧渲染）。
 * @author CH
 * @since 4.0.0
 */
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { verifyAgent, createGatewayWsUrl } from '../api/remoteApi'

const form = reactive({
  agentId: '',
  verifyCode: '',
  connMethod: 'ssh',
  reverseTunnel: false,
})

const connecting = ref(false)
const wsConnected = ref(false)
const verifyResult = ref<{ success: boolean; message?: string } | null>(null)
const activeTab = ref('ssh')
const cmdInput = ref('')
const terminalRef = ref<HTMLDivElement>()
const desktopRef = ref<HTMLDivElement>()
const desktopCanvas = ref<HTMLCanvasElement>()
const desktopFrame = ref<boolean>(false)

let ws: WebSocket | null = null
let sshSessionId: string | null = null

/** 校验并连接网关 */
function doConnect() {
  if (!form.agentId || !form.verifyCode) {
    ElMessage.warning('请填写ID和验证码')
    return
  }
  connecting.value = true
  verifyAgent(form.agentId, form.verifyCode, form.reverseTunnel)
    .then(async (result) => {
      verifyResult.value = result
      if (!result.success) {
        connecting.value = false
        return
      }
      await connectWebSocket(result.gatewayWsUrl || createGatewayWsUrl(form.agentId))
    })
    .catch((err) => {
      verifyResult.value = { success: false, message: '请求异常: ' + err.message }
    })
    .finally(() => {
      connecting.value = false
    })
}

/**
 * 建立网关 WebSocket 连接
 * @param url WebSocket URL
 */
function connectWebSocket(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(url)
    ws.binaryType = 'arraybuffer'
    ws.onopen = () => {
      ws!.send(JSON.stringify({ action: 'connect', clientId: form.agentId, serverUrl: url }))
      wsConnected.value = true
      ElMessage.success('已连接到网关')
      if (form.connMethod === 'ssh') {
        startSSHSession()
      }
      resolve()
    }
    ws.onmessage = (e) => {
      if (typeof e.data === 'string') {
        handleTextMessage(JSON.parse(e.data))
      } else {
        handleBinaryFrame(new Uint8Array(e.data))
      }
    }
    ws.onerror = () => {
      ElMessage.error('WebSocket连接失败')
      reject(new Error('WebSocket error'))
    }
    ws.onclose = () => {
      wsConnected.value = false
      sshSessionId = null
      ElMessage.info('连接已断开')
    }
  })
}

/** 启动 SSH 会话 */
function startSSHSession() {
  sshSessionId = 'ssh-' + Date.now()
  ws!.send(JSON.stringify({
    action: 'ssh',
    sshAction: 'start',
    sessionId: sshSessionId,
    cols: 80,
    rows: 24,
  }))
}

/**
 * 处理文本消息（SSH 输出）
 * @param msg 消息对象
 */
function handleTextMessage(msg: any) {
  if (msg.type === 'ssh') {
    appendTerminalOutput(msg.data, msg.stream === 'stderr')
  }
}

/**
 * 处理二进制帧（JPEG 画面）
 * @param bytes 帧数据
 */
function handleBinaryFrame(bytes: Uint8Array) {
  if (bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    renderJPEG(bytes)
  }
}

/**
 * 追加终端输出
 * @param text 输出文本
 * @param isError 是否为 stderr
 */
function appendTerminalOutput(text: string, isError: boolean) {
  if (!terminalRef.value) return
  const span = document.createElement('span')
  span.style.color = isError ? '#ff4757' : '#00ff41'
  span.textContent = text
  terminalRef.value.appendChild(span)
  terminalRef.value.scrollTop = terminalRef.value.scrollHeight
}

/**
 * 渲染 JPEG 画面帧到 canvas
 * @param bytes JPEG 数据
 */
function renderJPEG(bytes: Uint8Array) {
  desktopFrame.value = true
  nextTick(() => {
    const canvas = desktopCanvas.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const blob = new Blob([bytes], { type: 'image/jpeg' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      if (canvas.width !== img.width || canvas.height !== img.height) {
        canvas.width = img.width
        canvas.height = img.height
      }
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

/** 发送终端命令 */
function sendCmd() {
  if (!cmdInput.value || !ws || !sshSessionId) return
  ws.send(JSON.stringify({
    action: 'ssh',
    sshAction: 'input',
    sessionId: sshSessionId,
    data: btoa(unescape(encodeURIComponent(cmdInput.value + '\n'))),
  }))
  appendTerminalOutput('$ ' + cmdInput.value + '\n', false)
  cmdInput.value = ''
}

/** 断开连接 */
function doDisconnect() {
  if (sshSessionId && ws) {
    ws.send(JSON.stringify({ action: 'ssh', sshAction: 'stop', sessionId: sshSessionId }))
  }
  if (ws) {
    ws.close()
    ws = null
  }
  sshSessionId = null
  wsConnected.value = false
}

onBeforeUnmount(() => {
  doDisconnect()
})
</script>

<style scoped>
.remote-control {
  display: flex;
  gap: 16px;
  height: 100%;
  padding: 16px;
}
.connect-panel {
  width: 320px;
  flex-shrink: 0;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.work-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.terminal-container {
  flex: 1;
  background: #0c0c0c;
  color: #00ff41;
  font-family: 'Cascadia Code', 'Fira Code', monospace;
  font-size: 13px;
  padding: 12px;
  overflow-y: auto;
  white-space: pre-wrap;
  min-height: 400px;
}
.terminal-input {
  margin-top: 8px;
}
.desktop-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0c0c0c;
  min-height: 400px;
}
.desktop-container canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.placeholder {
  color: #666;
  font-size: 14px;
}
</style>
