<template>
  <div class="packet-detail" v-loading="loading">
    <div class="detail-header">
      <el-button @click="goBack">← 返回</el-button>
      <h2>数据包详情 #{{ packet?.packetNumber }}</h2>
    </div>

    <template v-if="packet">
      <div class="info-card">
        <div class="info-row">
          <span class="label">协议</span>
          <el-tag :type="getProtocolColor(packet.protocol)">{{ packet.protocol }}</el-tag>
        </div>
        <div class="info-row">
          <span class="label">源地址</span>
          <span>{{ packet.sourceIp }}:{{ packet.sourcePort }}</span>
        </div>
        <div class="info-row">
          <span class="label">目的地址</span>
          <span>{{ packet.destinationIp }}:{{ packet.destinationPort }}</span>
        </div>
        <div class="info-row">
          <span class="label">长度</span>
          <span>{{ packet.length }} bytes</span>
        </div>
        <div class="info-row">
          <span class="label">时间</span>
          <span>{{ formatTime(packet.timestamp) }}</span>
        </div>
      </div>

      <div class="lifecycle-card" v-if="lifecycle">
        <h3>TCP 生命周期</h3>
        <div class="lifecycle-timeline">
          <div
            v-for="(step, index) in lifecycleSteps"
            :key="index"
            class="lifecycle-step"
            :class="step.class"
          >
            <div class="step-dot"></div>
            <div class="step-label">{{ step.label }}</div>
          </div>
        </div>
      </div>

      <div class="http-card" v-if="packet.protocol === 'HTTP' && httpData">
        <div class="http-tabs">
          <button
            :class="['tab-btn', { active: httpTab === 'request' }]"
            @click="httpTab = 'request'"
          >请求</button>
          <button
            :class="['tab-btn', { active: httpTab === 'response' }]"
            @click="httpTab = 'response'"
          >响应</button>
        </div>

        <template v-if="httpTab === 'request'">
          <div class="http-request-line">
            <el-tag size="small" type="primary" class="method-tag">{{ httpData.request.method }}</el-tag>
            <span class="url-text">{{ httpData.request.url }}</span>
            <span class="version-text">{{ httpData.request.version }}</span>
          </div>
          <div class="http-headers" v-if="httpData.request.headers.length">
            <h4>请求头</h4>
            <div class="header-row" v-for="h in httpData.request.headers" :key="h[0]">
              <span class="header-key">{{ h[0] }}</span>
              <span class="header-val">{{ h[1] }}</span>
            </div>
          </div>
          <div class="http-body" v-if="httpData.request.body">
            <h4>请求体</h4>
            <pre class="body-content">{{ httpData.request.body }}</pre>
          </div>
        </template>

        <template v-if="httpTab === 'response'">
          <div class="http-status-line">
            <el-tag :type="statusType" size="small" class="status-tag">
              {{ httpData.response.code }} {{ httpData.response.phrase }}
            </el-tag>
            <span class="version-text">{{ httpData.response.version }}</span>
          </div>
          <div class="http-headers" v-if="httpData.response.headers.length">
            <h4>响应头</h4>
            <div class="header-row" v-for="h in httpData.response.headers" :key="h[0]">
              <span class="header-key">{{ h[0] }}</span>
              <span class="header-val">{{ h[1] }}</span>
            </div>
          </div>
          <div class="http-body" v-if="httpData.response.body">
            <h4>响应体</h4>
            <pre class="body-content">{{ httpData.response.body }}</pre>
          </div>
        </template>
      </div>

      <div class="info-card">
        <h3>摘要信息</h3>
        <p class="info-text">{{ packet.info }}</p>
      </div>

      <div class="raw-card">
        <h3>原始数据</h3>
        <pre class="raw-data">{{ formattedRawData }}</pre>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { captureApi, type PacketCapture } from '@/api/capture'

const route = useRoute()
const router = useRouter()
const packetId = Number(route.params.id)

const loading = ref(false)
const packet = ref<PacketCapture | null>(null)
const httpTab = ref<'request' | 'response'>('request')

onMounted(async () => {
  loading.value = true
  try {
    packet.value = await captureApi.getPacket(packetId)
  } catch (e) {
    console.error('Failed to load packet', e)
  } finally {
    loading.value = false
  }
})

const lifecycle = computed(() => {
  if (!packet.value?.lifecycle) return null
  try {
    return JSON.parse(packet.value.lifecycle)
  } catch {
    return null
  }
})

const lifecycleSteps = computed(() => {
  if (!lifecycle.value) return []
  const steps = []
  const flags = lifecycle.value.tcp_flags || ''
  const phase = lifecycle.value.lifecycle || ''

  if (flags.includes('SYN') && !flags.includes('ACK')) {
    steps.push({ label: 'SYN', class: 'syn' })
  }
  if (flags.includes('SYN') && flags.includes('ACK')) {
    steps.push({ label: 'SYN-ACK', class: 'syn-ack' })
  }
  if (flags.includes('ACK') && !flags.includes('SYN')) {
    steps.push({ label: 'ACK', class: 'ack' })
  }
  if (flags.includes('FIN')) {
    steps.push({ label: 'FIN', class: 'fin' })
  }
  if (flags.includes('RST')) {
    steps.push({ label: 'RST', class: 'rst' })
  }
  if (flags.includes('PSH')) {
    steps.push({ label: 'PSH', class: 'psh' })
  }
  if (steps.length === 0 && phase === 'DATA') {
    steps.push({ label: 'DATA', class: 'data' })
  }
  return steps
})

interface HttpData {
  request: {
    method: string
    url: string
    version: string
    headers: [string, string][]
    body: string
  }
  response: {
    code: string
    phrase: string
    version: string
    headers: [string, string][]
    body: string
  }
}

const httpData = computed<HttpData | null>(() => {
  if (!packet.value?.rawData) return null
  try {
    const root = JSON.parse(packet.value.rawData)
    const source = root._source || root
    const layers = source.layers
    if (!layers) return null
    const http = layers.http
    if (!http) return null

    const isRequest = http['http.request'] === '1' || !!http['http.request.method']

    const requestHeaders: [string, string][] = []
    const responseHeaders: [string, string][] = []
    let requestBody = ''
    let responseBody = ''

    const requestPrefix = 'http.request.'
    const responsePrefix = 'http.response.'

    for (const key of Object.keys(http)) {
      if (key === 'http.file_data') {
        responseBody = String(http[key] ?? '')
        continue
      }
      if (key.startsWith(requestPrefix)) continue
      if (key.startsWith(responsePrefix)) continue
      if (key.startsWith('http.')) {
        const headerName = key.replace(/^http\./, '').replace(/_/g, '-')
        const val = http[key]
        if (typeof val === 'string' && val.length > 0) {
          if (isRequest) {
            requestHeaders.push([headerName, val])
          } else {
            responseHeaders.push([headerName, val])
          }
        }
      }
    }

    const method = http['http.request.method'] || 'GET'
    const url = http['http.request.uri'] || '/'
    const reqVersion = http['http.request.version'] || 'HTTP/1.1'
    const respCode = http['http.response.code'] || ''
    const respPhrase = http['http.response.phrase'] || ''
    const respVersion = http['http.response.version'] || 'HTTP/1.1'
    const host = http['http.host'] || ''

    if (host && method && isRequest) {
      requestHeaders.unshift(['Host', host])
    }

    return {
      request: {
        method,
        url,
        version: reqVersion,
        headers: requestHeaders,
        body: requestBody,
      },
      response: {
        code: respCode,
        phrase: respPhrase,
        version: respVersion,
        headers: responseHeaders,
        body: responseBody,
      },
    }
  } catch {
    return null
  }
})

const statusType = computed(() => {
  if (!httpData.value) return 'info'
  const code = parseInt(httpData.value.response.code, 10)
  if (code >= 200 && code < 300) return 'success'
  if (code >= 300 && code < 400) return 'warning'
  if (code >= 400) return 'danger'
  return 'info'
})

const formattedRawData = computed(() => {
  if (!packet.value?.rawData) return ''
  try {
    return JSON.stringify(JSON.parse(packet.value.rawData), null, 2)
  } catch {
    return packet.value.rawData
  }
})

function goBack() {
  router.back()
}

function formatTime(time: string) {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

function getProtocolColor(protocol: string) {
  const colors: Record<string, string> = {
    HTTP: 'success',
    TLS: 'warning',
    DNS: 'info',
    TCP: '',
    UDP: '',
    ICMP: 'danger',
    ARP: 'warning',
  }
  return colors[protocol] || 'info'
}
</script>

<style scoped>
.packet-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.info-card,
.lifecycle-card,
.http-card,
.raw-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 20px;
}

.info-card h3,
.lifecycle-card h3,
.http-card h4,
.raw-card h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  width: 80px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.lifecycle-timeline {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 0;
}

.lifecycle-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--el-color-info-light-3);
}

.lifecycle-step.syn .step-dot { background: var(--el-color-primary); }
.lifecycle-step.syn-ack .step-dot { background: var(--el-color-warning); }
.lifecycle-step.ack .step-dot { background: var(--el-color-success); }
.lifecycle-step.fin .step-dot { background: var(--el-color-danger); }
.lifecycle-step.rst .step-dot { background: var(--el-color-danger); }
.lifecycle-step.psh .step-dot { background: var(--el-color-info); }
.lifecycle-step.data .step-dot { background: var(--el-color-info); }

.step-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.info-text {
  margin: 0;
  font-family: monospace;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.http-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.tab-btn {
  padding: 8px 20px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}

.tab-btn:hover {
  color: var(--el-text-color-primary);
}

.tab-btn.active {
  color: rgb(var(--el-color-primary));
  border-bottom-color: rgb(var(--el-color-primary));
}

.http-request-line,
.http-status-line {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  margin-bottom: 16px;
  font-family: monospace;
  font-size: 13px;
}

.method-tag,
.status-tag {
  flex-shrink: 0;
}

.url-text {
  flex: 1;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.version-text {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.http-headers {
  margin-bottom: 16px;
}

.header-row {
  display: flex;
  gap: 16px;
  padding: 6px 0;
  font-family: monospace;
  font-size: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-key {
  color: var(--el-color-primary);
  flex-shrink: 0;
  min-width: 140px;
  font-weight: 500;
}

.header-val {
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.http-body h4 {
  margin-bottom: 8px;
}

.body-content {
  margin: 0;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  overflow-x: auto;
  max-height: 300px;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--el-text-color-primary);
}

.raw-data {
  margin: 0;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  overflow-x: auto;
  max-height: 400px;
}
</style>
