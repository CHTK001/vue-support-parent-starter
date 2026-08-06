<template>
  <div class="dashboard fade-in">
    <!-- 顶部选择栏 -->
    <div class="top-bar">
      <div class="sel-group">
        <label class="sel-label">选择服务器</label>
        <el-select v-model="selectedMonitorId" placeholder="请选择服务器" class="sel-select" filterable @change="onMonitorChange">
          <el-option v-for="m in servers" :key="m.id" :label="`${m.monitorName} [${m.monitorHost}:${m.monitorPort}]`" :value="m.id" />
        </el-select>
      </div>
      <div class="meta-info">
        <span class="meta-item"><span class="dot"></span>{{ currentServer?.serverType || '—' }}</span>
        <span class="meta-item" v-if="currentServer?.monitorGroup"><span class="dot"></span>分组: {{ currentServer.monitorGroup }}</span>
        <span class="meta-item" v-if="currentServer?.serverOsVersion"><span class="dot"></span>{{ currentServer.serverOsVersion }}</span>
        <span class="meta-item"><span class="dot dot-time"></span>最近采集: {{ lastCollect }}</span>
      </div>
      <div class="top-actions">
        <el-button @click="refresh" class="refresh-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="btn-icon"><path d="M21 12a9 9 0 11-3-6.7L13 8"/><path d="M3 7v6h6"/></svg>
          <span>刷新</span>
        </el-button>
      </div>
    </div>

    <!-- 指标网格 -->
    <div v-if="selectedMonitorId" class="metric-grid">
      <!-- CPU -->
      <div class="metric-card" :class="{ warn: cpu.value >= alertThresholds.cpu }">
        <div class="card-head">
          <span class="card-title">CPU</span>
          <span :class="['card-status', cpu.value >= alertThresholds.cpu ? 'warn' : 'ok']">
            {{ cpu.value >= alertThresholds.cpu ? '⚠ 告警' : '正常' }}
          </span>
        </div>
        <div class="metric-body">
          <div class="ring-wrap">
            <div class="ring" :style="{ background: `conic-gradient(${ringColor(cpu.value, cpu.warn)}, #e5e7eb ${cpu.value}%)` }">
              <div class="ring-inner"></div>
            </div>
            <div class="ring-center">
              <span class="ring-value">{{ cpu.value }}</span>
              <span class="ring-unit">%</span>
            </div>
          </div>
          <div class="metric-detail">
            <div class="detail-row">
              <span class="detail-label">核心数</span>
              <span class="detail-value">{{ cpu.cores }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">负载</span>
              <span class="detail-value">{{ cpu.load1 }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">负载 (5m)</span>
              <span class="detail-value">{{ cpu.load5 }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">负载 (15m)</span>
              <span class="detail-value">{{ cpu.load15 }}</span>
            </div>
            <div class="sparkline">
              <svg viewBox="0 0 100 30" preserveAspectRatio="none" class="spark-svg">
                <defs>
                  <linearGradient id="cpuGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" :stop-color="ringColor(cpu.value, cpu.warn)" :stop-opacity="0.4"/>
                    <stop offset="100%" :stop-color="ringColor(cpu.value, cpu.warn)" :stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <path :d="sparkPath(cpu.history)" fill="url(#cpuGrad)" />
                <polyline :points="sparkPoints(cpu.history)" fill="none" :stroke="ringColor(cpu.value, cpu.warn)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="spark-label">CPU 趋势 (最近 12 点)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Memory -->
      <div class="metric-card" :class="{ warn: mem.value >= alertThresholds.memory }">
        <div class="card-head">
          <span class="card-title">内存</span>
          <span :class="['card-status', mem.value >= alertThresholds.memory ? 'warn' : 'ok']">
            {{ mem.value >= alertThresholds.memory ? '⚠ 告警' : '正常' }}
          </span>
        </div>
        <div class="metric-body">
          <div class="ring-wrap">
            <div class="ring" :style="{ background: `conic-gradient(${ringColor(mem.value, mem.warn)}, #e5e7eb ${mem.value}%)` }">
              <div class="ring-inner"></div>
            </div>
            <div class="ring-center">
              <span class="ring-value">{{ mem.value }}</span>
              <span class="ring-unit">%</span>
            </div>
          </div>
          <div class="metric-detail">
            <div class="detail-row">
              <span class="detail-label">已用</span>
              <span class="detail-value">{{ mem.used }} GB</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">总量</span>
              <span class="detail-value">{{ mem.total }} GB</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">空闲</span>
              <span class="detail-value">{{ mem.free }} GB</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Swap</span>
              <span class="detail-value">{{ mem.swap }}</span>
            </div>
            <div class="sparkline">
              <svg viewBox="0 0 100 30" preserveAspectRatio="none" class="spark-svg">
                <defs>
                  <linearGradient id="memGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" :stop-color="ringColor(mem.value, mem.warn)" :stop-opacity="0.4"/>
                    <stop offset="100%" :stop-color="ringColor(mem.value, mem.warn)" :stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <path :d="sparkPath(mem.history)" fill="url(#memGrad)" />
                <polyline :points="sparkPoints(mem.history)" fill="none" :stroke="ringColor(mem.value, mem.warn)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="spark-label">内存趋势</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Disk -->
      <div class="metric-card" :class="{ warn: disk.value >= alertThresholds.disk }">
        <div class="card-head">
          <span class="card-title">磁盘</span>
          <span :class="['card-status', disk.value >= alertThresholds.disk ? 'warn' : 'ok']">
            {{ disk.value >= alertThresholds.disk ? '⚠ 告警' : '正常' }}
          </span>
        </div>
        <div class="metric-body">
          <div class="ring-wrap">
            <div class="ring" :style="{ background: `conic-gradient(${ringColor(disk.value, disk.warn)}, #e5e7eb ${disk.value}%)` }">
              <div class="ring-inner"></div>
            </div>
            <div class="ring-center">
              <span class="ring-value">{{ disk.value }}</span>
              <span class="ring-unit">%</span>
            </div>
          </div>
          <div class="metric-detail">
            <div class="detail-row">
              <span class="detail-label">已用</span>
              <span class="detail-value">{{ disk.used }} GB</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">总量</span>
              <span class="detail-value">{{ disk.total }} GB</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">空闲</span>
              <span class="detail-value">{{ disk.free }} GB</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">分区</span>
              <span class="detail-value">{{ disk.mount }}</span>
            </div>
            <div class="disk-list">
              <div v-for="d in disk.partitions" :key="d.mount" class="disk-item">
                <span class="disk-mount">{{ d.mount }}</span>
                <div class="disk-bar-wrap">
                  <div class="disk-bar" :style="{ width: d.percent + '%', background: `linear-gradient(90deg, ${ringColor(d.percent, d.percent >= alertThresholds.disk)}, ${ringColor(d.percent, d.percent >= alertThresholds.disk)}88)` }"></div>
                </div>
                <span class="disk-pct">{{ d.percent }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Network -->
      <div class="metric-card">
        <div class="card-head">
          <span class="card-title">网络</span>
          <span class="card-status ok">正常</span>
        </div>
        <div class="metric-body">
          <div class="ring-wrap">
            <div class="ring" :style="{ background: `conic-gradient(${netColor(net.usage)}, #e5e7eb ${net.usage}%)` }">
              <div class="ring-inner"></div>
            </div>
            <div class="ring-center">
              <span class="ring-value" style="font-size:18px">{{ net.usage }}</span>
              <span class="ring-unit">%</span>
            </div>
          </div>
          <div class="metric-detail">
            <div class="detail-row">
              <span class="detail-label">↑ 发送</span>
              <span class="detail-value" style="color:#06b6d4">{{ net.upload }} MB/s</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">↓ 接收</span>
              <span class="detail-value" style="color:#10b981">{{ net.download }} MB/s</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">总发送</span>
              <span class="detail-value">{{ net.uploadTotal }} GB</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">总接收</span>
              <span class="detail-value">{{ net.downloadTotal }} GB</span>
            </div>
            <div class="sparkline">
              <svg viewBox="0 0 100 30" preserveAspectRatio="none" class="spark-svg">
                <defs>
                  <linearGradient id="netGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <path :d="sparkPath(net.history)" fill="url(#netGrad)" />
                <polyline :points="sparkPoints(net.history)" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="spark-label">网络趋势</span>
            </div>
          </div>
        </div>
      </div>

      <!-- JVM -->
      <div class="metric-card" :class="{ warn: jvm.heapUsed >= alertThresholds.jvm }">
        <div class="card-head">
          <span class="card-title">JVM</span>
          <span :class="['card-status', jvm.heapUsed >= alertThresholds.jvm ? 'warn' : 'ok']">
            {{ jvm.heapUsed >= alertThresholds.jvm ? '⚠ 告警' : '正常' }}
          </span>
        </div>
        <div class="metric-body">
          <div class="ring-wrap">
            <div class="ring" :style="{ background: `conic-gradient(${ringColor(jvm.heapUsed, jvm.heapUsed >= alertThresholds.jvm)}, #e5e7eb ${jvm.heapUsed}%)` }">
              <div class="ring-inner"></div>
            </div>
            <div class="ring-center">
              <span class="ring-value">{{ jvm.heapUsed }}</span>
              <span class="ring-unit">%</span>
            </div>
          </div>
          <div class="metric-detail">
            <!-- JVM 版本信息 -->
            <div class="jvm-info-bar">
              <span class="jvm-version">{{ jvm.version }}</span>
              <span class="jvm-vendor">{{ jvm.vendor }}</span>
              <span class="jvm-gc">GC: {{ jvm.gcPolicy }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">堆内存</span>
              <span class="detail-value">{{ jvm.heapUsedSize }} / {{ jvm.heapMax }} MB</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">非堆</span>
              <span class="detail-value">{{ jvm.nonHeap }} MB</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">线程数</span>
              <span class="detail-value">{{ jvm.threads }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">GC 次数 / 耗时</span>
              <span class="detail-value">{{ jvm.gcCount }} 次 / {{ jvm.gcTime }} ms</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">进程 ID</span>
              <span class="detail-value" style="font-family:'SF Mono','Cascadia Code',monospace;font-size:11px">{{ jvm.pid }}</span>
            </div>
            <div class="sparkline">
              <svg viewBox="0 0 100 30" preserveAspectRatio="none" class="spark-svg">
                <defs>
                  <linearGradient id="jvmGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <path :d="sparkPath(jvm.history)" fill="url(#jvmGrad)" />
                <polyline :points="sparkPoints(jvm.history)" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="spark-label">JVM 堆趋势 (最近 12 点)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Uptime & Load -->
      <div class="metric-card">
        <div class="card-head">
          <span class="card-title">系统概览</span>
          <span class="card-status ok">运行中</span>
        </div>
        <div class="metric-body">
          <div class="ring-wrap">
            <div class="ring" style="background: conic-gradient(#10b981 100%, #e5e7eb 100%)">
              <div class="ring-inner"></div>
            </div>
            <div class="ring-center">
              <span class="ring-value" style="color:#10b981">●</span>
              <span class="ring-label">RUNNING</span>
            </div>
          </div>
          <div class="metric-detail">
            <div class="detail-row">
              <span class="detail-label">运行时间</span>
              <span class="detail-value">{{ uptime }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">登录用户</span>
              <span class="detail-value">{{ sys.loadCount }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">最大进程</span>
              <span class="detail-value">{{ sys.maxProcesses }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">操作系统</span>
              <span class="detail-value">{{ sys.os }}</span>
            </div>
            <div class="uptime-bar">
              <div class="uptime-bar-fill" :style="{ width: uptimePercent + '%', background: 'linear-gradient(90deg, #10b981, #06b6d4)' }"></div>
            </div>
            <span class="uptime-text">系统健康度: {{ uptimePercent }}%</span>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-else description="请从顶部选择一台服务器" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getMonitors,
  getLatestCpu, getCpuHistory,
  getLatestMemory, getMemoryHistory,
  getLatestDisk,
  getLatestNetwork, getNetworkHistory,
  getLatestJvm, getJvmHistory,
} from '../../api'

const servers = ref<any[]>([])
const selectedMonitorId = ref<number | null>(null)
const lastCollect = ref('—')

const currentServer = computed(() => servers.value.find(s => s.id === selectedMonitorId.value))

const alertThresholds = { cpu: 80, memory: 85, disk: 90, jvm: 85 }

const cpu = ref<any>(null)
const mem = ref<any>(null)
const disk = ref<any>(null)
const net = ref<any>(null)
const jvm = ref<any>(null)
const sys = ref<any>(null)
const loading = ref(false)

const uptime = computed(() => currentServer.value ? `运行中` : '')
const uptimePercent = ref(96)

// ===== Mock 数据兜底 =====
const mockCpu = () => ({
  value: 45 + Math.floor(Math.random() * 30), cores: 8,
  load1: '0.85', load5: '0.72', load15: '0.68',
  history: [38, 42, 55, 48, 60, 52, 45, 50, 58, 44, 47, 53],
})
const mockMem = () => ({
  value: 60 + Math.floor(Math.random() * 25),
  used: (48 + Math.random() * 10).toFixed(1), total: '64.0', free: '16.0', swap: '2.3 GB',
  history: [55, 58, 62, 65, 63, 60, 57, 59, 61, 64, 60, 58],
})
const mockDisk = () => ({
  value: 52 + Math.floor(Math.random() * 15),
  used: '280.0', total: '500.0', free: '220.0', mount: '/dev/sda1',
  partitions: [{ mount: '/', used: '280', total: '500', percent: 56 }, { mount: '/boot', used: '200', total: '512', percent: 39 }],
  history: [50, 52, 54, 55, 53, 56, 54, 55, 57, 55, 56, 58],
})
const mockNet = () => ({
  usage: 12 + Math.floor(Math.random() * 20),
  upload: (0.5 + Math.random() * 3).toFixed(1), download: (1.2 + Math.random() * 5).toFixed(1),
  uploadTotal: '128.5', downloadTotal: '512.8',
  history: [8, 12, 15, 10, 18, 14, 12, 16, 13, 11, 14, 15],
})
const mockJvm = () => ({
  heapUsed: 40 + Math.floor(Math.random() * 25),
  heapUsedSize: '1280', heapMax: '2048', nonHeap: '156',
  gcCount: '42', gcTime: '1,250', threads: '186',
  version: 'JDK 17.0.8', vendor: 'OpenJDK', gcPolicy: 'G1GC', pid: '28461',
  history: [38, 42, 45, 50, 48, 44, 42, 45, 48, 46, 44, 47],
})

// ===== 从后端 API 加载指标 =====
const loadMetrics = async (monitorId: number) => {
  if (!monitorId) return
  loading.value = true
  try {
    const [cpuData, memData, diskData, netData, jvmData,
           cpuHist, memHist, jvmHist, netHist] = await Promise.all([
      getLatestCpu(monitorId).catch(() => null),
      getLatestMemory(monitorId).catch(() => null),
      getLatestDisk(monitorId).catch(() => null),
      getLatestNetwork(monitorId).catch(() => null),
      getLatestJvm(monitorId).catch(() => null),
      getCpuHistory(monitorId, 1).catch(() => []),
      getMemoryHistory(monitorId, 1).catch(() => []),
      getJvmHistory(monitorId, 1).catch(() => []),
      getNetworkHistory(monitorId, 1).catch(() => []),
    ])

    if (cpuData) {
      cpu.value = {
        value: Math.round(cpuData.cpuUsage || 0),
        warn: cpuData.cpuUsage >= alertThresholds.cpu,
        cores: cpuData.cpuCores || 8,
        load1: cpuData.load1 != null ? cpuData.load1.toString() : (cpuHist?.[0]?.cpuUsage ?? '').toString(),
        load5: cpuData.load5 != null ? cpuData.load5.toString() : '—',
        load15: cpuData.load15 != null ? cpuData.load15.toString() : '—',
        history: (cpuHist || []).map((h: any) => Math.round(h.cpuUsage || 0)).slice(-12),
      }
    } else { cpu.value = mockCpu() }

    if (memData) {
      mem.value = {
        value: Math.round(memData.usagePercent || 0),
        warn: memData.usagePercent >= alertThresholds.memory,
        used: ((memData.usedBytes || 0) / 1073741824).toFixed(1),
        total: ((memData.totalBytes || 0) / 1073741824).toFixed(1),
        free: ((memData.freeBytes || 0) / 1073741824).toFixed(1),
        swap: '—',
        history: (memHist || []).map((h: any) => Math.round(h.usagePercent || 0)).slice(-12),
      }
    } else { mem.value = mockMem() }

    if (diskData && diskData.length > 0) {
      const d = diskData[0]
      disk.value = {
        value: Math.round(d.usagePercent || 0),
        warn: d.usagePercent >= alertThresholds.disk,
        used: ((d.usedBytes || 0) / 1073741824).toFixed(1),
        total: ((d.totalBytes || 0) / 1073741824).toFixed(1),
        free: '—',
        mount: d.mountPoint || '/',
        partitions: diskData.map((dd: any) => ({
          mount: dd.mountPoint || '/',
          used: ((dd.usedBytes || 0) / 1073741824).toFixed(1),
          total: ((dd.totalBytes || 0) / 1073741824).toFixed(1),
          percent: Math.round(dd.usagePercent || 0),
        })),
        history: [50, 52, 54, 55, 53, 56, 54, 55, 57, 55, 56, 58],
      }
    } else { disk.value = mockDisk() }

    if (netData) {
      const rx = netData.rxBytes || 0, tx = netData.txBytes || 0
      net.value = {
        usage: Math.round((netData.speedBps || 0) / 1000000 * 10),
        upload: (tx / 1048576).toFixed(1),
        download: (rx / 1048576).toFixed(1),
        uploadTotal: (tx / 1073741824).toFixed(1),
        downloadTotal: (rx / 1073741824).toFixed(1),
        history: (netHist || []).map((h: any) => Math.round(h.rxBytes || 0)).slice(-12),
      }
    } else { net.value = mockNet() }

    if (jvmData) {
      jvm.value = {
        heapUsed: Math.round(jvmData.heapUsagePercent || 0),
        heapUsedSize: (jvmData.heapUsedBytes / 1048576).toFixed(0),
        heapMax: (jvmData.heapMaxBytes / 1048576).toFixed(0),
        nonHeap: '—',
        threads: jvmData.threads?.toString() || '—',
        gcCount: (jvmData.youngGcCount || 0).toString(),
        gcTime: '—',
        version: '—',
        vendor: '—',
        gcPolicy: '—',
        pid: '—',
        history: (jvmHist || []).map((h: any) => Math.round(h.heapUsagePercent || 0)).slice(-12),
      }
    } else { jvm.value = mockJvm() }

    sys.value = { loadCount: '—', maxProcesses: '—', os: currentServer.value?.serverType || '—' }
    lastCollect.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch (e: any) {
    ElMessage.warning('指标数据暂不可用，使用模拟数据')
    cpu.value = mockCpu()
    mem.value = mockMem()
    disk.value = mockDisk()
    net.value = mockNet()
    jvm.value = mockJvm()
    sys.value = { loadCount: '—', maxProcesses: '—', os: '—' }
  }
  loading.value = false
}

const onMonitorChange = () => {
  loadMetrics(selectedMonitorId.value || 0)
}

// 颜色映射（莫兰迪配色）
const ringColor = (value: number, warn: boolean = false): string => {
  if (warn) return '#f97316'
  if (value >= 80) return '#f97316'
  if (value >= 60) return '#eab308'
  return '#3b82f6'
}

const netColor = (value: number): string => {
  if (value >= 80) return '#f97316'
  if (value >= 60) return '#eab308'
  return '#06b6d4'
}

// SVG sparkline 工具函数
const sparkPath = (data: number[]) => {
  const w = 100, h = 30
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h * 0.8 - h * 0.1
    return `${x},${y}`
  })
  return `M ${pts.map(p => p.split(',').join(' ')).join(' L ')} L ${w},${h} L 0,${h} Z`
}

const sparkPoints = (data: number[]) => {
  const w = 100, h = 30
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h * 0.8 - h * 0.1
    return `${x},${y}`
  }).join(' ')
}

let pollTimer: any = null

const refresh = () => {
  if (selectedMonitorId.value) loadMetrics(selectedMonitorId.value)
  else {
    cpu.value = mockCpu()
    mem.value = mockMem()
    disk.value = mockDisk()
    net.value = mockNet()
    jvm.value = mockJvm()
  }
  lastCollect.value = new Date().toLocaleTimeString()
}

const loadServers = async () => {
  try {
    const list = await getMonitors()
    servers.value = list.filter((s: any) => s.serviceType === 'SERVER')
    if (servers.value.length) {
      selectedMonitorId.value = servers.value[0].id
      loadMetrics(selectedMonitorId.value)
    }
  } catch (e: any) { console.error(e) }
}

onMounted(() => {
  loadServers()
  pollTimer = setInterval(refresh, 10000)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

/* 顶部选择栏 */
.top-bar {
  display: flex; align-items: flex-end; gap: 16px;
  background: var(--el-card-bg-color, #ffffff); padding: 14px 18px; border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04); margin-bottom: 20px;
}
.sel-group { display: flex; flex-direction: column; gap: 4px; }
.sel-label { font-size: 12px; color: #9ca3af; font-weight: 500; }
.sel-select { width: 340px; }
.meta-info { display: flex; gap: 16px; flex: 1; align-items: flex-end; padding-bottom: 8px; }
.meta-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #4b5563; }
.meta-item .dot { width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; }
.meta-item .dot-time { background: #9ca3af; }
.top-actions { display: flex; align-items: center; }
.refresh-btn { display: flex; align-items: center; gap: 6px; background: #f1f5f9; color: #4b5563; border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px 16px; font-size: 13px; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.refresh-btn:hover { background: #e2e8f0; transform: translateY(-1px); }
.btn-icon { width: 14px; height: 14px; stroke-width: 2; }

/* 指标网格 */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.metric-card {
  background: var(--el-card-bg-color, #ffffff);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  border: 1px solid var(--el-border-color-lighter, #f0f0f0);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.metric-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.metric-card.warn { border-color: #fed7aa; background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%); }
.metric-card.warn:hover { box-shadow: 0 8px 24px rgba(249, 115, 22, 0.12); }

.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0); }
.card-title { font-size: 14px; font-weight: 600; color: #1f2937; }
.card-status { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 500; }
.card-status.ok { color: #10b981; background: #ecfdf5; }
.card-status.warn { color: #f97316; background: #fff7ed; }

/* 指标主体 */
.metric-body { display: grid; grid-template-columns: 130px 1fr; gap: 12px; align-items: center; }

/* 环形进度 */
.ring-wrap {
  width: 110px; height: 110px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  margin: 0 auto;
}
.ring {
  width: 110px; height: 110px;
  border-radius: 50%;
  padding: 8px;
  box-sizing: content-box;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.ring-inner {
  width: 100%; height: 100%;
  border-radius: 50%;
  background: var(--el-card-bg-color, #ffffff);
  display: flex; align-items: center; justify-content: center;
}
.ring-center {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: none;
}
.ring-value { font-size: 28px; font-weight: 700; color: #1f2937; letter-spacing: -0.5px; line-height: 1; }
.ring-unit { font-size: 11px; color: #9ca3af; margin-top: 4px; font-weight: 500; }
.ring-label { font-size: 11px; color: #10b981; font-weight: 600; letter-spacing: 0.5px; }

/* 指标详情 */
.metric-detail { display: flex; flex-direction: column; gap: 4px; }
.detail-row { display: flex; justify-content: space-between; align-items: baseline; padding: 2px 0; }
.detail-label { font-size: 12px; color: #9ca3af; font-weight: 500; }
.detail-value { font-size: 12.5px; color: #1f2937; font-weight: 500; }

/* Sparkline */
.sparkline {
  display: flex; flex-direction: column; gap: 2px;
  margin-top: 6px; padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter, #e5e7eb);
}
.spark-svg { width: 100%; height: 30px; }
.spark-label { font-size: 10.5px; color: #9ca3af; text-align: center; }

/* JVM 版本信息栏 */
.jvm-info-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  margin-bottom: 4px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}
.jvm-version {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  font-family: 'SF Mono', 'Cascadia Code', 'Menlo', monospace;
  letter-spacing: 0.3px;
}
.jvm-vendor {
  font-size: 11px;
  font-weight: 500;
  color: #4b5563;
  padding: 1px 8px;
  border-radius: 999px;
  background: #e0e7ff;
  color: #3b82f6;
}
.jvm-gc {
  font-size: 11px;
  font-weight: 500;
  color: #4b5563;
  padding: 1px 8px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #10b981;
}

/* 磁盘分区列表 */
.disk-list { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
.disk-item { display: flex; align-items: center; gap: 6px; font-size: 11px; }
.disk-mount { color: #4b5563; min-width: 40px; font-weight: 500; }
.disk-bar-wrap { flex: 1; height: 6px; background: #f3f4f6; border-radius: 3px; overflow: hidden; }
.disk-bar { height: 100%; border-radius: 3px; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.disk-pct { color: #9ca3af; min-width: 36px; text-align: right; }

/* 运行时间条 */
.uptime-bar { height: 6px; background: #f3f4f6; border-radius: 3px; overflow: hidden; margin-top: 6px; }
.uptime-bar-fill { height: 100%; border-radius: 3px; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.uptime-text { font-size: 10.5px; color: #9ca3af; margin-top: 4px; }
</style>
