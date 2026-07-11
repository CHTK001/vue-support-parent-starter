<template>
  <div class="capture-home">
    <div class="controls-card">
      <div class="controls-header">
        <h2>数据包捕获</h2>
        <div class="header-actions">
          <el-tag :type="statusTagType" size="small">{{ statusLabel }}</el-tag>
          <el-button size="small" @click="importPcap" :loading="importing">导入 pcap</el-button>
        </div>
      </div>

      <div class="controls-form">
        <el-form :model="captureForm" inline>
          <el-form-item label="网络接口">
            <el-select v-model="captureForm.interfaceName" placeholder="选择接口" style="width: 200px" :disabled="captureState !== 'idle'">
              <el-option v-for="iface in interfaces" :key="iface" :label="iface" :value="iface" />
            </el-select>
          </el-form-item>

          <el-form-item label="BPF 过滤器">
            <el-input v-model="captureForm.filter" placeholder="如: tcp port 80" style="width: 240px" :disabled="captureState !== 'idle'" />
          </el-form-item>

          <el-form-item>
            <template v-if="captureState === 'idle'">
              <el-button type="primary" @click="startCapture" :loading="loading">开始捕获</el-button>
            </template>
            <template v-else-if="captureState === 'running'">
              <el-button @click="pauseCapture" :loading="loading">暂停</el-button>
              <el-button type="danger" @click="stopCapture" :loading="loading">停止</el-button>
            </template>
            <template v-else-if="captureState === 'paused'">
              <el-button type="primary" @click="resumeCapture" :loading="loading">继续</el-button>
              <el-button type="danger" @click="stopCapture" :loading="loading">停止</el-button>
            </template>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="sessions-card">
      <div class="card-header">
        <h3>捕获会话</h3>
        <el-button size="small" @click="exportAll">导出全部</el-button>
      </div>
      <el-table :data="sessions" stripe style="width: 100%">
        <el-table-column prop="sessionName" label="名称" />
        <el-table-column prop="interfaceName" label="接口" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'running' ? 'success' : row.status === 'paused' ? 'warning' : 'info'" size="small">
              {{ row.status === 'running' ? '运行中' : row.status === 'paused' ? '已暂停' : '已停止' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="packetCount" label="数据包数" width="100" />
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button size="small" @click="viewPackets(row.id)">查看</el-button>
            <el-button size="small" @click="viewStats(row.id)">统计</el-button>
            <el-button size="small" @click="exportSession(row)">导出</el-button>
            <el-button size="small" type="danger" @click="deleteSession(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="realtime-card" v-if="captureState !== 'idle'">
      <div class="card-header">
        <h3>实时数据包</h3>
        <el-tag size="small">{{ realtimePackets.length }}</el-tag>
      </div>
      <el-table :data="realtimePackets" stripe style="width: 100%" max-height="400" @row-click="viewPacketDetail">
        <el-table-column prop="packetNumber" label="#" width="60" />
        <el-table-column prop="sourceIp" label="源地址" />
        <el-table-column prop="destinationIp" label="目的地址" />
        <el-table-column prop="protocol" label="协议" width="80" />
        <el-table-column prop="length" label="长度" width="80" />
        <el-table-column prop="info" label="信息" show-overflow-tooltip />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { captureApi, type CaptureSession, type PacketCapture } from '@/api/capture'

const router = useRouter()
const loading = ref(false)
const importing = ref(false)
const captureState = ref<'idle' | 'running' | 'paused'>('idle')
const interfaces = ref<string[]>([])
const sessions = ref<CaptureSession[]>([])
const realtimePackets = ref<PacketCapture[]>([])
const activeSessionId = ref<number | null>(null)

const captureForm = ref({
  interfaceName: '',
  filter: '',
})

const statusTagType = computed(() => {
  if (captureState.value === 'running') return 'success'
  if (captureState.value === 'paused') return 'warning'
  return 'info'
})

const statusLabel = computed(() => {
  if (captureState.value === 'running') return '捕获中'
  if (captureState.value === 'paused') return '已暂停'
  return '已停止'
})

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await loadInterfaces()
  await loadSessions()
  await checkStatus()
})

onUnmounted(() => {
  stopPolling()
})

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function pollRealtimePackets() {
  if (!activeSessionId.value) return
  try {
    const result = await captureApi.listPackets(activeSessionId.value, 0, 50)
    realtimePackets.value = result.data.reverse()
  } catch {
    // ignore polling errors
  }
}

function startPolling() {
  stopPolling()
  pollTimer = setInterval(pollRealtimePackets, 2000)
}

async function loadInterfaces() {
  try {
    interfaces.value = await captureApi.listInterfaces()
    if (interfaces.value.length > 0) {
      captureForm.value.interfaceName = interfaces.value[0]
    }
  } catch (e) {
    console.error('Failed to load interfaces', e)
  }
}

async function loadSessions() {
  try {
    sessions.value = await captureApi.listSessions()
  } catch (e) {
    console.error('Failed to load sessions', e)
  }
}

async function checkStatus() {
  try {
    const status = await captureApi.getStatus()
    if (status.status === 'running') {
      captureState.value = 'running'
      activeSessionId.value = status.sessionId
      startPolling()
    } else if (status.status === 'paused') {
      captureState.value = 'paused'
      activeSessionId.value = status.sessionId
      realtimePackets.value = []
    } else {
      captureState.value = 'idle'
    }
  } catch (e) {
    console.error('Failed to check status', e)
  }
}

async function startCapture() {
  if (!captureForm.value.interfaceName) {
    ElMessage.warning('请选择网络接口')
    return
  }
  loading.value = true
  try {
    const session = await captureApi.startCapture({
      name: `Capture ${new Date().toLocaleTimeString()}`,
      interface: captureForm.value.interfaceName,
      filter: captureForm.value.filter,
    })
    captureState.value = 'running'
    activeSessionId.value = session.id
    realtimePackets.value = []
    startPolling()
    await loadSessions()
    ElMessage.success('捕获已开始')
  } catch (e) {
    ElMessage.error('启动捕获失败')
  } finally {
    loading.value = false
  }
}

async function pauseCapture() {
  loading.value = true
  try {
    await captureApi.pauseCapture()
    captureState.value = 'paused'
    stopPolling()
    await loadSessions()
    ElMessage.success('捕获已暂停')
  } catch (e) {
    ElMessage.error('暂停捕获失败')
  } finally {
    loading.value = false
  }
}

async function resumeCapture() {
  loading.value = true
  try {
    await captureApi.resumeCapture()
    captureState.value = 'running'
    startPolling()
    await loadSessions()
    ElMessage.success('捕获已继续')
  } catch (e) {
    ElMessage.error('继续捕获失败')
  } finally {
    loading.value = false
  }
}

async function stopCapture() {
  loading.value = true
  try {
    await captureApi.stopCapture()
    captureState.value = 'idle'
    stopPolling()
    activeSessionId.value = null
    await loadSessions()
    ElMessage.success('捕获已停止')
  } catch (e) {
    ElMessage.error('停止捕获失败')
  } finally {
    loading.value = false
  }
}

async function importPcap() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pcap,.pcapng,.cap'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return

    importing.value = true
    try {
      const buf = await file.arrayBuffer()
      const bytes = new Uint8Array(buf)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64 = btoa(binary)

      const session = await captureApi.importPcap({
        name: file.name.replace(/\.(pcap|pcapng|cap)$/i, ''),
        file: base64,
        filename: file.name,
      })
      await loadSessions()
      ElMessage.success(`导入完成: ${session.sessionName} (${session.packetCount} 个数据包)`)
    } catch (e) {
      ElMessage.error('导入失败')
    } finally {
      importing.value = false
    }
  }
  input.click()
}

function exportAll() {
  captureApi.exportSessions().then(data => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tshark-sessions.json'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  }).catch(() => {
    ElMessage.error('导出失败')
  })
}

function exportSession(session: CaptureSession) {
  captureApi.listPackets(session.id, 0, session.packetCount || 10000).then(result => {
    const exportData = {
      version: '1.0',
      type: 'tshark-capture',
      items: [{
        type: 'capture_session',
        id: session.id,
        sessionName: session.sessionName,
        interfaceName: session.interfaceName,
        filterExpression: session.filterExpression,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        packetCount: session.packetCount,
        createdAt: session.createdAt,
        packets: result.data,
      }],
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.sessionName}.json`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  }).catch(() => {
    ElMessage.error('导出失败')
  })
}

function viewPackets(sessionId: number) {
  router.push(`/packets/${sessionId}`)
}

function viewPacketDetail(row: PacketCapture) {
  router.push(`/packet/${row.id}`)
}

function viewStats(sessionId: number) {
  router.push(`/stats/${sessionId}`)
}

async function deleteSession(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除该会话吗？', '确认')
    await captureApi.deleteSession(id)
    await loadSessions()
    ElMessage.success('删除成功')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}
</script>

<style scoped>
.capture-home {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.controls-card,
.sessions-card,
.realtime-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 24px;
}

.controls-header,
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.controls-header h2,
.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.controls-form {
  margin-top: 16px;
}
</style>
