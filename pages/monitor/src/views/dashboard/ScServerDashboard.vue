<template>
  <div class="dashboard fade-in">
    <ReCard v-if="selectedMonitorId" layout="simple" :radius="12" :padding="14" shadow="never">
      <div class="top-bar">
        <div class="sel-group">
          <label class="sel-label">选择服务器</label>
          <ReSelect v-model="selectedMonitorId" placeholder="请选择服务器" class="sel-select" filterable @change="onMonitorChange"
            :data="servers.map(m => ({ label: `${m.monitorName} [${m.monitorHost}:${m.monitorPort}]`, value: m.id }))" />
        </div>
        <div class="meta-info">
          <span class="meta-item"><span class="dot"></span>{{ currentServer?.serverType || '—' }}</span>
          <span class="meta-item" v-if="currentServer?.monitorGroup"><span class="dot"></span>分组: {{ currentServer.monitorGroup }}</span>
          <span class="meta-item" v-if="currentServer?.serverOsVersion"><span class="dot"></span>{{ currentServer.serverOsVersion }}</span>
          <span class="meta-item"><span class="dot dot-time"></span>最近采集: {{ lastCollect }}</span>
        </div>
        <div class="top-actions">
          <ReButton show-text icon="RefreshLeft" plain @click="refresh">刷新</ReButton>
        </div>
      </div>
    </ReCard>

    <!-- cpu/mem/disk 未加载完成（接口失败或尚在请求）时不能进模板，否则 cpu.value 直接空指针 -->
    <div v-if="selectedMonitorId && cpu && mem && disk" class="metric-grid">
      <ReCard layout="simple" :radius="12" :padding="14" shadow="never" :class="{ 'metric-card warn': cpu.value >= alertThresholds.cpu }" class="metric-card">
        <div class="card-head">
          <span class="card-title">CPU</span>
          <span :class="['card-status', cpu.value >= alertThresholds.cpu ? 'warn' : 'ok']">
            {{ cpu.value >= alertThresholds.cpu ? '⚠ 告警' : '正常' }}
          </span>
        </div>
        <div class="metric-body">
          <div class="ring-wrap">
            <div class="ring" :style="{ background: `conic-gradient(${ringColor(cpu.value, cpu.warn)}, var(--el-border-color-lighter) ${cpu.value}%)` }">
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
                <path :d="sparkPath(cpu.history)" :fill="ringColor(cpu.value, cpu.warn)" fill-opacity="0.15" />
                <polyline :points="sparkPoints(cpu.history)" fill="none" :stroke="ringColor(cpu.value, cpu.warn)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
               <span class="spark-label">CPU 趋势 (最近 12 点)</span>
             </div>
           </div>
         </div>
       </ReCard>

      <ReCard layout="simple" :radius="12" :padding="14" shadow="never" :class="{ 'metric-card warn': mem.value >= alertThresholds.memory }" class="metric-card">
        <div class="card-head">
          <span class="card-title">内存</span>
          <span :class="['card-status', mem.value >= alertThresholds.memory ? 'warn' : 'ok']">
            {{ mem.value >= alertThresholds.memory ? '⚠ 告警' : '正常' }}
          </span>
        </div>
        <div class="metric-body">
          <div class="ring-wrap">
            <div class="ring" :style="{ background: `conic-gradient(${ringColor(mem.value, mem.warn)}, var(--el-border-color-lighter) ${mem.value}%)` }">
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
                <path :d="sparkPath(mem.history)" :fill="ringColor(mem.value, mem.warn)" fill-opacity="0.15" />
                <polyline :points="sparkPoints(mem.history)" fill="none" :stroke="ringColor(mem.value, mem.warn)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
               <span class="spark-label">内存趋势</span>
             </div>
           </div>
         </div>
       </ReCard>

      <ReCard layout="simple" :radius="12" :padding="14" shadow="never" :class="{ 'metric-card warn': disk.value >= alertThresholds.disk }" class="metric-card">
        <div class="card-head">
          <span class="card-title">磁盘</span>
          <span :class="['card-status', disk.value >= alertThresholds.disk ? 'warn' : 'ok']">
            {{ disk.value >= alertThresholds.disk ? '⚠ 告警' : '正常' }}
          </span>
        </div>
        <div class="metric-body">
          <div class="ring-wrap">
            <div class="ring" :style="{ background: `conic-gradient(${ringColor(disk.value, disk.warn)}, var(--el-border-color-lighter) ${disk.value}%)` }">
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
                  <div class="disk-bar" :style="{ width: d.percent + '%', background: ringColor(d.percent, d.percent >= alertThresholds.disk) }"></div>
                </div>
                <span class="disk-pct">{{ d.percent }}%</span>
              </div>
            </div>
          </div>
        </div>
      </ReCard>

      <ReCard layout="simple" :radius="12" :padding="14" shadow="never" class="metric-card">
        <div class="card-head">
          <span class="card-title">网络</span>
          <span class="card-status ok">正常</span>
        </div>
        <div class="metric-body">
          <div class="ring-wrap">
            <div class="ring" :style="{ background: `conic-gradient(${netColor(net.usage)}, var(--el-border-color-lighter) ${net.usage}%)` }">
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
              <span class="detail-value" style="color:var(--el-color-info)">{{ net.upload }} MB/s</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">↓ 接收</span>
              <span class="detail-value" style="color:var(--el-color-success)">{{ net.download }} MB/s</span>
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
                <path :d="sparkPath(net.history)" :fill="netColor(net.usage)" fill-opacity="0.15" />
                <polyline :points="sparkPoints(net.history)" fill="none" :stroke="netColor(net.usage)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
               <span class="spark-label">网络趋势</span>
             </div>
           </div>
         </div>
       </ReCard>

      <ReCard layout="simple" :radius="12" :padding="14" shadow="never" :class="{ 'metric-card warn': jvm.heapUsed >= alertThresholds.jvm }" class="metric-card">
        <div class="card-head">
          <span class="card-title">JVM</span>
          <span :class="['card-status', jvm.heapUsed >= alertThresholds.jvm ? 'warn' : 'ok']">
            {{ jvm.heapUsed >= alertThresholds.jvm ? '⚠ 告警' : '正常' }}
          </span>
        </div>
        <div class="metric-body">
          <div class="ring-wrap">
            <div class="ring" :style="{ background: `conic-gradient(${ringColor(jvm.heapUsed, jvm.heapUsed >= alertThresholds.jvm)}, var(--el-border-color-lighter) ${jvm.heapUsed}%)` }">
              <div class="ring-inner"></div>
            </div>
            <div class="ring-center">
              <span class="ring-value">{{ jvm.heapUsed }}</span>
              <span class="ring-unit">%</span>
            </div>
          </div>
          <div class="metric-detail">
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
                <path :d="sparkPath(jvm.history)" fill="var(--el-color-primary)" fill-opacity="0.15" />
                <polyline :points="sparkPoints(jvm.history)" fill="none" stroke="var(--el-color-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
               <span class="spark-label">JVM 堆趋势 (最近 12 点)</span>
             </div>
           </div>
         </div>
       </ReCard>

      <ReCard layout="simple" :radius="12" :padding="14" shadow="never" class="metric-card">
        <div class="card-head">
          <span class="card-title">系统概览</span>
          <span class="card-status ok">运行中</span>
        </div>
        <div class="metric-body">
          <div class="ring-wrap">
            <div class="ring" style="background: conic-gradient(var(--el-color-success) 100%, var(--el-border-color-lighter) 100%)">
              <div class="ring-inner"></div>
            </div>
            <div class="ring-center">
              <span class="ring-value" style="color:var(--el-color-success)">●</span>
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
              <div class="uptime-bar-fill" :style="{ width: uptimePercent + '%', background: 'var(--el-color-success)' }"></div>
            </div>
          <span class="uptime-text">系统健康度: {{ uptimePercent }}%</span>
        </div>
      </div>
    </ReCard>
    </div>

    <ReEmpty v-else description="请从顶部选择一台服务器" :image-size="60" />

    <!-- 指标趋势曲线(echarts)：优先时序接口，未启用时降级历史接口 -->
    <ReCard v-if="selectedMonitorId" layout="simple" :radius="14" :padding="0" shadow="never">
      <template #header>
        <div class="viz-head">
          <div class="viz-title-wrap">
            <ReIcon name="TrendCharts" :size="18" />
            <span class="viz-title">指标趋势 (近 {{ trendHours }}h)</span>
          </div>
          <div class="viz-actions">
            <ReSelect v-model="trendHours" style="width: 80px; margin-right: 8px" @change="onMonitorChange"
              :data="[{ value: 1, label: '1h' }, { value: 6, label: '6h' }, { value: 12, label: '12h' }, { value: 24, label: '24h' }]" />
            <span class="viz-sub">{{ seriesSourceLabel }}</span>
          </div>
        </div>
      </template>
      <div ref="trendChartRef" style="width: 100%; height: 300px" />
    </ReCard>

    <ReCard v-if="selectedMonitorId" layout="simple" :radius="14" :padding="0" shadow="never">
      <template #header>
        <div class="viz-head">
          <div class="viz-title-wrap">
            <ReIcon name="PieChart" :size="18" />
            <span class="viz-title">3D 指标全景</span>
          </div>
          <span class="viz-sub">CPU / 内存 / 磁盘 | 高度=使用率</span>
        </div>
      </template>
      <div class="viz-body">
        <ReThree :height="260" :render="renderMetrics3D" :animate="animateMetrics3D" :auto-rotate="true" :auto-rotate-speed="0.8" />
      </div>
    </ReCard>

    <SoftwareMetricTable
      v-if="selectedMonitorId"
      :monitor-id="selectedMonitorId"
      :refresh-key="swRefreshKey"
    />
  </div>
</template>

<script setup lang="ts" name="ReServerDashboard">
import { ref, computed, onMounted, onBeforeUnmount, shallowRef, nextTick } from 'vue'
import * as THREE from 'three'
import * as echarts from 'echarts'
import type { ReThreeContext } from '@repo/ui/re-three'
import { message, useSocketService } from '@repo/core'
import {
  getMonitors,
  getLatestCpu, getCpuHistory,
  getLatestMemory, getMemoryHistory,
  getLatestDisk,
  getLatestNetwork, getNetworkHistory,
  getLatestJvm, getJvmHistory,
  getMetricSeries,
} from '../../api'
import SoftwareMetricTable from '../../software/SoftwareMetricTable.vue'

const servers = ref<any[]>([])
const selectedMonitorId = ref<number | null>(null)
/** 软件指标表的外层刷新信号：变化即重新拉取软件识别结果 */
const swRefreshKey = ref(0)
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
const trendHours = ref(1)

const uptime = computed(() => currentServer.value ? `运行中` : '')
const uptimePercent = ref(96)

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
      getCpuHistory(monitorId, trendHours.value).catch(() => []),
      getMemoryHistory(monitorId, trendHours.value).catch(() => []),
      getJvmHistory(monitorId, trendHours.value).catch(() => []),
      getNetworkHistory(monitorId, trendHours.value).catch(() => []),
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
    }

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
    }

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
        history: [],
      }
    }

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
    }

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
    }

    sys.value = { loadCount: '—', maxProcesses: '—', os: currentServer.value?.serverType || '—' }
    lastCollect.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch (e: any) {
    message.warning('指标数据加载失败')
    cpu.value = null
    mem.value = null
    disk.value = null
    net.value = null
    jvm.value = null
    sys.value = { loadCount: '—', maxProcesses: '—', os: '—' }
  }
  loading.value = false
  // 曲线图异步刷新（不阻塞指标卡片）
  await nextTick()
  renderTrendChart(monitorId)
}

// ==================== 指标趋势曲线(echarts) ====================

/** 图表容器 */
const trendChartRef = ref<HTMLElement | null>(null)

/** echarts 实例（非响应式） */
let trendChart: echarts.ECharts | null = null

/** 数据源标注 */
const seriesSourceLabel = ref('InfluxDB')

/**
 * 渲染趋势曲线：CPU / 内存 / JVM 堆
 * series 接口失败时降级为历史接口数据。
 *
 * @param monitorId 监控目标 ID
 */
const renderTrendChart = async (monitorId: number) => {
  if (!trendChartRef.value) return
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }
  const [cpuSeries, memSeries, jvmSeries] = await Promise.all([
    getMetricSeries('ms_monitor_metric_cpu', monitorId, 1, '1m'),
    getMetricSeries('ms_monitor_metric_memory', monitorId, 1, '1m'),
    getMetricSeries('ms_monitor_metric_jvm', monitorId, 1, '1m'),
  ])
  // 时序接口无数据时降级：用历史接口构造 [[now-12*i, v],...] 序列
  const fallback = (arr: number[]): [number, number][] => {
    const now = Date.now()
    return arr.map((v, i) => [now - (arr.length - i) * 5_000, v] as [number, number])
  }
  const cpuData = cpuSeries.length ? cpuSeries : fallback(cpu.value?.history ?? [])
  const memData = memSeries.length ? memSeries : fallback(mem.value?.history ?? [])
  const jvmData = jvmSeries.length ? jvmSeries : fallback(jvm.value?.history ?? [])
  seriesSourceLabel.value = (cpuSeries.length || memSeries.length || jvmSeries.length) ? 'InfluxDB' : 'MySQL 历史(降级)'
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['CPU %', '内存 %', 'JVM 堆 %'], textStyle: { fontSize: 11 } },
    grid: { left: 40, right: 16, top: 36, bottom: 28 },
    xAxis: {
      type: 'time',
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' },
    },
    series: [
      {
        name: 'CPU %',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: cpuData,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.12 },
      },
      {
        name: '内存 %',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: memData,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.12 },
      },
      {
        name: 'JVM 堆 %',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: jvmData,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.12 },
      },
    ],
  })
}

/** 窗口尺寸变化时重绘图表 */
const onResize = () => {
  trendChart?.resize()
}

const onMonitorChange = () => {
  loadMetrics(selectedMonitorId.value || 0)
  swRefreshKey.value++
}

const ringColor = (value: number, warn: boolean = false): string => {
  if (warn) return 'var(--el-color-warning)'
  if (value >= 80) return 'var(--el-color-warning)'
  if (value >= 60) return 'var(--el-color-info)'
  return 'var(--el-color-primary)'
}

const netColor = (value: number): string => {
  if (value >= 80) return 'var(--el-color-warning)'
  if (value >= 60) return 'var(--el-color-info)'
  return 'var(--el-color-info)'
}

const sparkPath = (data: number[]) => {
  const w = 100, h = 30
  if (!data || data.length < 2) return `M 0,${h} L ${w},${h} L ${w},${h} L 0,${h} Z`
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
  if (!data || data.length < 2) return `0,${h} ${w},${h}`
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h * 0.8 - h * 0.1
    return `${x},${y}`
  }).join(' ')
}

const metricGroup = shallowRef<THREE.Group | null>(null)
const metricColorMap = { cpu: 0xef4444, mem: 0x5b8def, disk: 0xf59e0b, net: 0x06b6d4, jvm: 0xa855f7, sys: 0x22c55e }

const renderMetrics3D = (ctx: ReThreeContext) => {
  const { scene, THREE } = ctx
  const grp = new THREE.Group()
  scene.add(grp)
  metricGroup.value = grp

  const metrics = [
    { key: 'cpu', label: 'CPU', value: cpu.value?.value ?? 0 },
    { key: 'mem', label: 'MEM', value: mem.value?.value ?? 0 },
    { key: 'disk', label: 'DISK', value: disk.value?.value ?? 0 },
    { key: 'net', label: 'NET', value: net.value?.usage ?? 0 },
    { key: 'jvm', label: 'JVM', value: jvm.value?.heapUsed ?? 0 },
    { key: 'sys', label: 'SYS', value: uptimePercent.value },
  ]

  metrics.forEach((m, i) => {
    const angle = (i / metrics.length) * Math.PI * 2
    const radius = 25
    const cx = Math.cos(angle) * radius
    const cz = Math.sin(angle) * radius
    const height = Math.max(1, m.value) * 0.4
    const color = (metricColorMap as Record<string, number>)[m.key] || 0x94a3b8

    const geo = new THREE.CylinderGeometry(3, 3, height, 24)
    geo.translate(0, height / 2, 0)
    const mat = new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.85, shininess: 60 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(cx, 0, cz)
    grp.add(mesh)
  })

  ctx.camera.position.set(0, 30, 70)
  ctx.camera.lookAt(0, 10, 0)
}

const animateMetrics3D = (ctx: ReThreeContext) => {
  if (metricGroup.value) {
    const t = Date.now() * 0.001
    metricGroup.value.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        child.scale.y = 1 + Math.sin(t * 1.2 + i * 0.8) * 0.04
      }
    })
  }
}

let pollTimer: any = null

/** socket 订阅句柄（组件卸载时释放） */
const unsubs: Array<() => void> = []

/** 实时指标推送：命中当前监控目标时立即刷新 */
function initLivePush(): void {
  const socket = useSocketService()
  if (!socket) return
  unsubs.push(socket.subscribe("monitor", "metric", (msg) => {
    const data = (msg.data ?? msg) as any
    const payload = data && typeof data === "object" ? (data.data ?? data) : data
    if (!payload || payload.monitorId == null) return
    if (selectedMonitorId.value != null && payload.monitorId != null && String(payload.monitorId) !== String(selectedMonitorId.value)) return
    loadMetrics(payload.monitorId)
  }))
}

const refresh = () => {
  if (selectedMonitorId.value) loadMetrics(selectedMonitorId.value)
  swRefreshKey.value++
  lastCollect.value = new Date().toLocaleTimeString()
}

const loadServers = async () => {
  try {
    const list = await getMonitors()
    servers.value = list.filter((s: any) => s.serviceType === 'SERVER')
    if (servers.value.length) {
      selectedMonitorId.value = servers.value[0].id
      loadMetrics(servers.value[0].id)
    }
  } catch (e: any) { console.error(e) }
}

onMounted(() => {
  loadServers()
  initLivePush()
  pollTimer = setInterval(refresh, 10000)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  unsubs.forEach(fn => fn?.())
  if (pollTimer) clearInterval(pollTimer)
  window.removeEventListener('resize', onResize)
  trendChart?.dispose()
  trendChart = null
})
</script>

 <style scoped>
/* 本文件原先整套用 pages/monitor/src/styles/tokens.css 的私有令牌（--bg-* / --text-*
   / --border-subtle / --status-success / --shadow-card* / --border-radius* /
   --transition-base），而那份 tokens.css 只有 :root、没有暗色变体，暗色模式下这些值
   全部停留在亮色。已统一改走 EP 语义令牌；--metric-* 是各监控域的固定色相
   （CPU 蓝 / 内存紫 / 磁盘橙，需彼此可区分），保留不换。 */
/* 页面入场淡入：0.35s 刻意慢于微交互档（整块内容从下方 8px 升起，需要时间被看清），
   且 both 填充保证动画结束后停在终态，reduced-motion 下直接停掉不会留残影 */
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

.top-bar {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding: 16px;
  background: var(--el-bg-color);
  /* 原为 var(--border-radius)（tokens.css 里是 10px），10px 距 8/12 等距，取 12px(lg) */
  border-radius: var(--el-radius-lg, 12px);
  /* koi 规约：容器静止态不加投影，边界改由这圈 1px 边框承载 */
  border: 1px solid var(--el-border-color-lighter);
}
.sel-group { display: flex; flex-direction: column; gap: 4px; }
.sel-label { font-size: 11.5px; color: var(--el-text-color-secondary); font-weight: 500; }
.sel-select { width: 340px; }
.meta-info { display: flex; gap: 14px; flex: 1; align-items: flex-end; }
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: var(--el-text-color-regular);
}
.meta-item .dot {
  width: 5px;
  height: 5px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--metric-cpu);
}
.meta-item .dot-time { background: var(--el-text-color-placeholder); }
.top-actions { display: flex; align-items: center; }
/* 注意：.refresh-btn 在模板里已经没有对应元素（刷新按钮换成了 ReButton），
   属于遗留死规则；本次只做令牌化，不删它，留给后续清理 */
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--el-radius-sm, 6px);
  padding: 7px 14px;
  font-size: 12.5px;
  font-weight: 500;
  transition:
    color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}

.metric-card {
  /* koi 规约：卡片静止态不加投影，边界由边框承载；
     注意 border 必须写在 border-left 之前，否则左侧 3px 强调条会被 1px 边框顶掉 */
  border: 1px solid var(--el-border-color-lighter);
  border-left: 3px solid transparent;
  /* 原为 var(--transition-base)（展开即 all 0.18s ease），显式列出真实会变的属性并取 0.2s 档 */
  transition:
    box-shadow var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-lg, 12px);
}
/* 允许的两处投影之一：悬浮抬升反馈 */
.metric-card:hover { box-shadow: var(--el-box-shadow); }
.metric-card.warn { border-left-color: var(--metric-disk); }

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.card-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.card-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--el-radius-full, 9999px);
  font-size: 10.5px;
  font-weight: 600;
}
.card-status.ok {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}
.card-status.warn {
  color: var(--metric-disk);
  background: color-mix(in srgb, var(--metric-disk) 10%, transparent);
}

.metric-body {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 12px;
  align-items: center;
}

.ring-wrap {
  width: 110px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 0 auto;
}
.ring {
  width: 110px;
  height: 110px;
  border-radius: var(--el-radius-full, 9999px);
  padding: 8px;
  box-sizing: content-box;
  /* 保留 0.4s 与 transition: all：进度环的底色是模板 inline style 拼的 conic-gradient，
     真正要过渡的正是这个 background 渐变（数据刷新时让数值变化看得见），不属于微交互档 */
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.ring-inner {
  width: 100%;
  height: 100%;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
}
.ring-center {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.ring-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: -0.5px;
  line-height: 1;
}
.ring-unit {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  font-weight: 500;
}
.ring-label {
  font-size: 11px;
  color: var(--el-color-success);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.metric-detail { display: flex; flex-direction: column; gap: 4px; }
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 2px 0;
}
.detail-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}
.detail-value {
  font-size: 12.5px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.sparkline {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
.spark-svg { width: 100%; height: 30px; }
.spark-label {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.jvm-info-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  margin-bottom: 4px;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  border: 1px solid var(--el-border-color-lighter);
}
.jvm-version {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-family: 'SF Mono', 'Cascadia Code', 'Menlo', monospace;
  letter-spacing: 0.3px;
}
.jvm-vendor {
  font-size: 11px;
  font-weight: 500;
  padding: 1px 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: color-mix(in srgb, var(--metric-cpu) 12%, transparent);
  color: var(--metric-cpu);
}
.jvm-gc {
  font-size: 11px;
  font-weight: 500;
  padding: 1px 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
  color: var(--el-color-success);
}

.disk-list { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
.disk-item { display: flex; align-items: center; gap: 6px; font-size: 11px; }
.disk-mount { color: var(--el-text-color-regular); min-width: 40px; font-weight: 500; }
.disk-bar-wrap {
  flex: 1;
  height: 6px;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-xs, 4px);
  overflow: hidden;
}
.disk-bar {
  height: 100%;
  border-radius: var(--el-radius-xs, 4px);
  /* 进度条宽度过渡刻意慢于微交互档：磁盘占用的数值变化要看得见 */
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.disk-pct { color: var(--el-text-color-secondary); min-width: 36px; text-align: right; }

.uptime-bar {
  height: 6px;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-xs, 4px);
  overflow: hidden;
  margin-top: 6px;
}
.uptime-bar-fill {
  height: 100%;
  border-radius: var(--el-radius-xs, 4px);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.uptime-text { font-size: 10.5px; color: var(--el-text-color-secondary); margin-top: 4px; }

.viz-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.viz-title-wrap { display: flex; align-items: center; gap: 8px; }
.viz-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.viz-sub { font-size: 11.5px; color: var(--el-text-color-secondary); }
.viz-body { width: 100%; }

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  /* 入场淡入可停：animation 用 both 填充，终态是完全不透明且无位移，停掉即直接呈现 */
  .fade-in {
    animation: none;
  }
  .metric-card,
  .refresh-btn {
    transition: none;
  }
  /* 三个进度类动画（环形 conic-gradient、磁盘条、运行时长条）都可停：
     它们的终值是脚本直接给的，动画只是让它平滑一点，不是唯一信息来源 */
  .ring,
  .disk-bar,
  .uptime-bar-fill {
    transition: none;
  }
}
 </style>
