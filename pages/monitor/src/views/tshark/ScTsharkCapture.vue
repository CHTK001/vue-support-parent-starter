<template>
  <div class="tshark-page fade-in">
    <!-- 顶部工具条：状态 + 新建抓包 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="status-pill" :class="tsharkOk ? 'status-ok' : 'status-bad'">
          <span class="status-dot"></span>
          <span>{{ tsharkOk ? 'TShark 可用' : 'TShark 不可用' }}</span>
        </div>
        <ReTag v-if="activeSessionId != null" :type="liveConnected ? 'success' : 'info'" size="small" effect="light">
          {{ liveConnected ? `实时推送中 +${liveCount}` : '推送未连接' }}
        </ReTag>
      </div>

      <div class="toolbar-right">
        <ReSelect v-model="iface" placeholder="选择网卡" clearable filterable class="iface-select"
          :data="interfaces.map(i => ({ label: i, value: i }))" />
        <ReInput v-model="filter" placeholder="BPF 过滤，如 tcp port 8080" clearable class="filter-input" />
        <ReInputNumber v-model="count" :min="0" :max="1000000" placeholder="包数" class="count-input" />
        <ReInputNumber v-model="timeout" :min="0" :max="86400" placeholder="时长/s" class="count-input" />
        <ReButton show-text icon="VideoPlay" type="primary" :loading="starting" @click="startCapture">开始抓包</ReButton>
      </div>
    </div>

    <div class="body-grid">
      <!-- 左侧：会话列表 -->
      <aside class="session-panel">
        <ReCard layout="simple" :radius="14" shadow="never" class="panel-card">
          <template #title>
            <span class="panel-title"><ReIcon name="Folder" :size="13" /> 抓包会话</span>
          </template>
          <ReSkeleton :loading="loadingSessions" :count="3" :rows="2" animated>
            <div class="session-list">
              <div v-for="s in sessions" :key="s.id"
                   :class="['session-item', { active: activeSessionId === s.id }]"
                   tabindex="0"
                   @click="selectSession(s.id)"
                   @keydown.enter="selectSession(s.id)">
                <div class="session-head">
                  <span class="session-name" :title="s.sessionName || s.captureInterface">{{ s.sessionName || s.captureInterface }}</span>
                  <span class="session-state" :class="s.captureStatus === 1 ? 'state-run' : 'state-stop'"></span>
                </div>
                <div class="session-meta">
                  <span class="meta-iface">{{ s.captureInterface }}</span>
                  <span class="meta-count">{{ s.packetCount ?? 0 }} 包</span>
                  <span class="meta-time">{{ fmtTime(s.startTime) }}</span>
                </div>
                <div class="session-actions">
                  <ReTag :type="s.captureStatus === 1 ? 'success' : 'info'" size="small" effect="plain">
                    {{ s.captureStatus === 1 ? '抓包中' : '已停止' }}
                  </ReTag>
                  <div class="action-btns">
                    <ReButton v-if="s.captureStatus === 1" link type="warning" icon="VideoPause" show-text size="small" @click.stop="stopSession(s.id)">停止</ReButton>
                    <ReButton link type="danger" icon="Delete" show-text size="small" @click.stop="deleteSession(s.id)">删除</ReButton>
                  </div>
                </div>
              </div>
              <ReEmpty v-if="!loadingSessions && sessions.length === 0" description="暂无抓包会话" layout="modern" />
            </div>
          </ReSkeleton>
          <div class="session-footer">
            <RePagination small layout="prev, pager, next" :total="sessionTotal" :page-size="10"
                           :current-page="sessionPage" @current-change="(p: number) => loadSessions(p)" />
          </div>
        </ReCard>
      </aside>

      <!-- 右侧：详情 -->
      <section class="detail-panel" v-show="activeSessionId">
        <!-- 统计卡片 -->
        <div class="stat-cards">
          <div class="stat-card stat-net">
            <div class="stat-icon"><ReIcon name="DataLine" :size="16" /></div>
            <div class="stat-body">
              <span class="stat-label">数据包总数</span>
              <span class="stat-value">{{ packetTotal }}</span>
            </div>
          </div>
          <div class="stat-card stat-jvm">
            <div class="stat-icon"><ReIcon name="Collection" :size="16" /></div>
            <div class="stat-body">
              <span class="stat-label">协议种类</span>
              <span class="stat-value">{{ protoStats.length }}</span>
            </div>
          </div>
          <div class="stat-card stat-db">
            <div class="stat-icon"><ReIcon name="TrendCharts" :size="16" /></div>
            <div class="stat-body">
              <span class="stat-label">Top 流</span>
              <span class="stat-value">{{ topFlows.length }}</span>
            </div>
          </div>
        </div>

        <!-- 图表 -->
        <div class="charts-row">
          <ReCard layout="simple" :radius="14" :padding="14" shadow="never" class="chart-card">
            <template #title><span class="panel-title">协议分布</span></template>
            <div ref="protoChartRef" class="chart-box"></div>
          </ReCard>
          <ReCard layout="simple" :radius="14" :padding="14" shadow="never" class="chart-card">
            <template #title><span class="panel-title">Top 会话流</span></template>
            <div ref="flowChartRef" class="chart-box"></div>
          </ReCard>
        </div>

        <!-- 数据包表格 -->
        <ReCard layout="simple" :radius="14" :padding="14" shadow="never" class="packet-card">
          <template #title>
            <span class="panel-title"><ReIcon name="List" :size="13" /> 数据包明细</span>
          </template>
          <ReTable :data="packets" :loading="loadingPackets" border stripe size="small" :pagination="false" :toolbar="false"
            :layout-table="{ height: 320 }">
            <ReTableColumn prop="packetTime" label="时间" width="170" align="center">
              <template #default="{ row }"><span class="mono dim">{{ row.packetTime || '' }}</span></template>
            </ReTableColumn>
            <ReTableColumn label="协议" width="90" align="center">
              <template #default="{ row }">
                <ReTag :class="['proto-tag', protoClass(row.protocol)]" effect="plain" size="small">{{ row.protocol || 'OTHER' }}</ReTag>
              </template>
            </ReTableColumn>
            <ReTableColumn label="源" width="170">
              <template #default="{ row }">
                <span class="mono">{{ row.sourceIp || '?' }}:{{ row.sourcePort ?? '' }}</span>
              </template>
            </ReTableColumn>
            <ReTableColumn label="目的" width="170">
              <template #default="{ row }">
                <span class="mono">{{ row.destIp || '?' }}:{{ row.destPort ?? '' }}</span>
              </template>
            </ReTableColumn>
            <ReTableColumn prop="packetLength" label="长度" width="80" align="right">
              <template #default="{ row }"><span class="mono">{{ row.packetLength ?? 0 }}</span></template>
            </ReTableColumn>
            <ReTableColumn label="摘要" min-width="240">
              <template #default="{ row }">
                <span class="info-cell" :title="row.packetInfo">{{ row.packetInfo || row.restoredText || '—' }}</span>
              </template>
            </ReTableColumn>
            <ReTableColumn label="操作" width="80" align="center">
              <template #default="{ row }">
                <ReButton link type="primary" size="small" @click="openPacketDetail(row)">详情</ReButton>
              </template>
            </ReTableColumn>
          </ReTable>
          <div class="table-footer">
            <RePagination small layout="prev, pager, next" :total="packetTotal" :page-size="20"
                           :current-page="packetPage" @current-change="(p: number) => loadPackets(p)" />
          </div>
        </ReCard>
      </section>

      <!-- 无会话提示 -->
      <div class="empty-detail" v-show="!activeSessionId">
        <div class="empty-illustration"><ReIcon name="Monitor" :size="36" /></div>
        <ReEmpty description="选择左侧抓包会话，或新建一个抓包任务" layout="modern" />
      </div>
    </div>

    <!-- 数据包详情抽屉 -->
    <ReDrawer v-model="detailOpen" title="数据包详情" size="55%">
      <template #content>
        <div v-if="packetDetail" class="packet-detail">
          <ReDescriptions :column="2" border size="small">
            <ReDescriptionsItem label="协议">{{ packetDetail.protocol }}</ReDescriptionsItem>
            <ReDescriptionsItem label="长度">{{ packetDetail.packetLength }} 字节</ReDescriptionsItem>
            <ReDescriptionsItem label="源地址">{{ packetDetail.sourceIp }}:{{ packetDetail.sourcePort }}</ReDescriptionsItem>
            <ReDescriptionsItem label="目的地址">{{ packetDetail.destIp }}:{{ packetDetail.destPort }}</ReDescriptionsItem>
            <ReDescriptionsItem label="时间" :span="2">{{ packetDetail.packetTime }}</ReDescriptionsItem>
          </ReDescriptions>
          <div class="detail-section">
            <h4>摘要</h4>
            <p class="mono">{{ packetDetail.packetInfo || '—' }}</p>
          </div>
          <div class="detail-section" v-if="packetDetail.restoredText">
            <h4>协议还原</h4>
            <pre class="restored">{{ packetDetail.restoredText }}</pre>
          </div>
          <div class="detail-section" v-if="packetDetail.rawData">
            <h4>原始数据</h4>
            <pre class="raw">{{ packetDetail.rawData.slice(0, 4000) }}</pre>
          </div>
        </div>
      </template>
    </ReDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import { message, useSocketService } from '@repo/core'
import {
  checkTshark, getTsharkInterfaces, startTsharkCapture, stopTsharkCapture,
  delTsharkSession, getTsharkSessions, getTsharkPackets, getTsharkPacketDetail,
  getTsharkProtocolStats, getTsharkTopFlows,
} from '../../api'

const tsharkOk = ref(false)
const interfaces = ref<string[]>([])
const iface = ref('')
const filter = ref('')
const count = ref(500)
const timeout = ref(0)
const starting = ref(false)
const liveCount = ref(0)
const liveConnected = ref(false)

const loadingSessions = ref(false)
const sessions = ref<any[]>([])
const sessionPage = ref(1)
const sessionTotal = ref(0)
const activeSessionId = ref<number | null>(null)

const loadingPackets = ref(false)
const packets = ref<any[]>([])
const packetPage = ref(1)
const packetTotal = ref(0)

const protoStats = ref<any[]>([])
const topFlows = ref<any[]>([])

const detailOpen = ref(false)
const packetDetail = ref<any>(null)

const protoChartRef = ref<HTMLElement | null>(null)
const flowChartRef = ref<HTMLElement | null>(null)
let protoChart: echarts.ECharts | null = null
let flowChart: echarts.ECharts | null = null

const packetTotalText = computed(() => {
  const s = sessions.value.find(x => x.id === activeSessionId.value)
  return s ? (s.packetCount ?? 0) : packets.value.length
})

function fmtTime(t?: string | null): string {
  if (!t) return ''
  const d = t.includes('T') ? new Date(t) : new Date(t.replace(/-/g, '/'))
  if (isNaN(d.getTime())) return t
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

async function init() {
  try {
    tsharkOk.value = await checkTshark()
  } catch {
    tsharkOk.value = false
  }
  loadInterfaces()
  loadSessions(1)
}

async function loadInterfaces() {
  try {
    interfaces.value = await getTsharkInterfaces()
  } catch { /* 忽略 */ }
}

async function loadSessions(page = sessionPage.value) {
  loadingSessions.value = true
  try {
    const r = await getTsharkSessions(page, 10)
    sessions.value = r?.records ?? r?.data ?? []
    sessionTotal.value = r?.total ?? sessions.value.length
    sessionPage.value = page
    if (activeSessionId.value == null && sessions.value.length > 0) {
      selectSession(sessions.value[0].id)
    }
  } catch (e: any) {
    message.error('加载会话失败: ' + (e?.message || e))
  } finally {
    loadingSessions.value = false
  }
}

function selectSession(id: number) {
  activeSessionId.value = id
  liveCount.value = 0
  loadPackets(1)
  loadStats()
}

async function loadPackets(page = packetPage.value) {
  if (activeSessionId.value == null) return
  loadingPackets.value = true
  try {
    const r = await getTsharkPackets(activeSessionId.value, page, 20)
    packets.value = r?.records ?? r?.data ?? []
    packetTotal.value = r?.total ?? packets.value.length
    packetPage.value = page
  } catch (e: any) {
    message.error('加载数据包失败: ' + (e?.message || e))
  } finally {
    loadingPackets.value = false
  }
}

async function loadStats() {
  if (activeSessionId.value == null) return
  try {
    protoStats.value = await getTsharkProtocolStats(activeSessionId.value)
  } catch { protoStats.value = [] }
  try {
    topFlows.value = await getTsharkTopFlows(activeSessionId.value, 10)
  } catch { topFlows.value = [] }
  await nextTick()
  renderProtoChart()
  renderFlowChart()
}

const CHART_THEME = {
  font: "'Inter', -apple-system, 'Segoe UI', sans-serif",
  brand: getComputedStyle(document.documentElement).getPropertyValue('--brand-500').trim() || '#6366f1',
  net: getComputedStyle(document.documentElement).getPropertyValue('--metric-net').trim() || '#0ea5e9',
  jvm: getComputedStyle(document.documentElement).getPropertyValue('--metric-jvm').trim() || '#a855f7',
  db: getComputedStyle(document.documentElement).getPropertyValue('--metric-db').trim() || '#f59e0b',
  cpu: getComputedStyle(document.documentElement).getPropertyValue('--metric-cpu').trim() || '#ef4444',
  disk: getComputedStyle(document.documentElement).getPropertyValue('--metric-disk').trim() || '#22c55e',
  textSecondary: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#64748b',
  textTertiary: getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#94a3b8',
}

const PROTO_COLORS: Record<string, string> = {
  TCP: 'var(--metric-cpu)', UDP: 'var(--status-success)', HTTP: 'var(--metric-disk)',
  TLS: 'var(--text-tertiary)', DNS: 'var(--status-error)', ICMP: 'var(--metric-jvm)',
  ARP: 'var(--metric-disk)', SSH: 'var(--metric-net)', QUIC: 'var(--text-secondary)',
}

function renderProtoChart() {
  if (!protoChartRef.value) return
  const theme = CHART_THEME
  protoChart?.dispose()
  protoChart = echarts.init(protoChartRef.value)
  const data = protoStats.value.slice(0, 12)
  protoChart.setOption({
    tooltip: { trigger: 'item', borderWidth: 0, textStyle: { fontSize: 11, fontFamily: theme.font } },
    legend: { bottom: 0, type: 'scroll', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10, color: theme.textSecondary, fontFamily: theme.font } },
    series: [{
      type: 'pie',
      radius: ['38%', '66%'],
      center: ['50%', '44%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 5, borderWidth: 3, borderColor: 'transparent' },
      label: { show: false },
      emphasis: { scaleSize: 4 },
      data: data.length
        ? data.map(d => ({ name: d.protocol, value: d.count, itemStyle: { color: PROTO_COLORS[d.protocol] || theme.textSecondary } }))
        : [{ name: '暂无数据', value: 1, itemStyle: { color: theme.textTertiary } }],
    }],
  })
}

function renderFlowChart() {
  if (!flowChartRef.value) return
  const theme = CHART_THEME
  flowChart?.dispose()
  flowChart = echarts.init(flowChartRef.value)
  const data = topFlows.value.slice(0, 10)
  flowChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, borderWidth: 0, textStyle: { fontSize: 11, fontFamily: theme.font } },
    grid: { left: '12%', right: '8%', top: '6%', bottom: '10%', containLabel: false },
    xAxis: { type: 'value', name: '包数', nameTextStyle: { fontSize: 10, color: theme.textTertiary }, axisLabel: { fontSize: 10, color: theme.textSecondary }, splitLine: { lineStyle: { color: 'rgba(128,128,128,.12)' } } },
    yAxis: {
      type: 'category',
      data: data.length ? data.map(d => d.flow) : ['暂无数据'],
      axisLabel: { fontSize: 9, color: theme.textSecondary },
      axisLine: { show: false }, axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: data.length ? data.map(d => d.count) : [0],
      itemStyle: { borderRadius: [0, 6, 6, 0], color: theme.net },
      barWidth: '55%',
    }],
  })
}

async function startCapture() {
  if (!iface.value) { message.warning('请选择网卡'); return }
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
    loadSessions(1)
  } catch (e: any) {
    message.error('启动抓包失败: ' + (e?.message || e))
  } finally {
    starting.value = false
  }
}

async function stopSession(id: number) {
  try {
    await stopTsharkCapture(id)
    message.success('已停止抓包')
    loadSessions()
  } catch (e: any) {
    message.error('停止失败: ' + (e?.message || e))
  }
}

async function deleteSession(id: number) {
  try {
    await message.confirm('确认删除该会话及其所有数据包？', '提示', '确定', '取消', 'warning')
  } catch { return }
  try {
    await delTsharkSession(id)
    message.success('已删除')
    if (activeSessionId.value === id) {
      activeSessionId.value = null
      packets.value = []
      protoStats.value = []
      topFlows.value = []
    }
    loadSessions()
  } catch (e: any) {
    message.error('删除失败: ' + (e?.message || e))
  }
}

async function openPacketDetail(row: any) {
  try {
    packetDetail.value = await getTsharkPacketDetail(row.id)
    detailOpen.value = true
  } catch (e: any) {
    message.error('加载详情失败: ' + (e?.message || e))
  }
}

function protoClass(p: string) {
  const map: Record<string, string> = {
    TCP: 'proto-tcp', UDP: 'proto-udp', HTTP: 'proto-http', TLS: 'proto-tls',
    DNS: 'proto-dns', ICMP: 'proto-icmp', ARP: 'proto-arp', SSH: 'proto-ssh',
    QUIC: 'proto-quic',
  }
  return map[p] || ''
}

// ==================== socket.io 实时推送 ====================
// 后端 MonitorPushService 协议：module=monitor, event=tshark-packet / tshark-session，
// dataId=sessionId；当前会话匹配时新包去重追加，统计与图表增量刷新
const socket = useSocketService()
const socketUnsubs: Array<() => void> = []

if (socket) {
  socketUnsubs.push(socket.subscribe('monitor', 'tshark-packet', (msg) => {
    const packet = msg?.data ?? msg
    if (activeSessionId.value == null || packet == null) return
    const sid = String(msg?.dataId ?? (packet as any)?.sessionId)
    if (sid !== String(activeSessionId.value)) return
    if (packets.value.some((p: any) => p.id === (packet as any).id)) return
    packets.value.unshift(packet as any)
    if (packets.value.length > 500) packets.value.length = 500
    packetTotal.value++
    liveCount.value++
    const proto = (packet as any).protocol || 'OTHER'
    const hit = protoStats.value.find((s: any) => s.protocol === proto)
    if (hit) hit.count++
    else protoStats.value.push({ protocol: proto, count: 1 })
    renderProtoChart()
  }))
  socketUnsubs.push(socket.subscribe('monitor', 'tshark-session', () => {
    loadSessions()
  }))
  const tick = setInterval(() => { liveConnected.value = !!socket.isConnected }, 2000)
  socketUnsubs.push(() => clearInterval(tick))
}

onMounted(() => {
  init()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  socketUnsubs.forEach(fn => fn?.())
  protoChart?.dispose()
  flowChart?.dispose()
})

function resizeCharts() {
  protoChart?.resize()
  flowChart?.resize()
}
</script>

<style scoped>
/* ==================== 布局 ==================== */
.tshark-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  padding: 4px;
}

/* ==================== 顶部工具条 ==================== */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-container-card);
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
  flex-wrap: wrap;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
}
.status-ok {
  color: var(--status-success, #16c916);
  background: rgba(22, 201, 22, 0.10);
}
.status-bad {
  color: var(--status-error, #ff4c4c);
  background: rgba(255, 76, 76, 0.10);
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 color-mix(in srgb, currentColor 40%, transparent); }
  50% { opacity: 0.6; box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 0%, transparent); }
}

.iface-select { width: 150px; }
.iface-select :deep(.el-select__wrapper),
.iface-select :deep(.el-select__wrapper:hover),
.iface-select :deep(.el-select.is-focused .el-select__wrapper) {
  box-shadow: none !important;
  border-color: var(--border-subtle) !important;
}
.iface-select :deep(.el-select__wrapper:hover) { background: var(--bg-hover); }
.filter-input { width: 220px; }
.count-input { width: 110px; }

/* ==================== 主区网格 ==================== */
.body-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 14px;
  flex: 1;
  min-height: 0;
}
@media (max-width: 900px) {
  .body-grid { grid-template-columns: 1fr; }
  .empty-detail { grid-column: 1; }
}
.session-panel { min-width: 0; }
.detail-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}
.empty-detail {
  grid-column: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-tertiary);
  min-height: 320px;
}
.empty-illustration {
  color: rgba(99, 102, 241, 0.30);
  opacity: 0.7;
}

/* ==================== 会话面板 ==================== */
.panel-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-container-card);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.session-list {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px 4px;
}
.session-item {
  position: relative;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md, 10px);
  padding: 10px 12px;
  cursor: pointer;
  background: var(--bg-container-card);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease, background-color 0.18s ease;
}
.session-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--brand-500);
  opacity: 0;
  transition: opacity 0.18s ease;
}
.session-item:hover {
  border-color: rgba(99, 102, 241, 0.45);
  background: var(--bg-hover);
  transform: translateY(-1px);
}
.session-item:hover::before { opacity: 0.5; }
.session-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
  border-color: var(--brand-500);
}
.session-item.active {
  border-color: var(--brand-500);
  background: rgba(99, 102, 241, 0.06);
  box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.30);
}
.session-item.active::before { opacity: 1; }

.session-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.session-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.session-state {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.state-run { background: var(--status-success); box-shadow: 0 0 0 3px rgba(22, 201, 22, 0.20); animation: pulse 2s ease-in-out infinite; }
.state-stop { background: var(--text-tertiary); }

.session-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10.5px;
  color: var(--text-tertiary);
  margin-top: 4px;
  flex-wrap: wrap;
}
.meta-iface {
  font-family: 'SF Mono', 'Cascadia Code', monospace;
  color: var(--text-secondary);
}
.meta-time { margin-left: auto; }

.session-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
}
.action-btns {
  display: flex;
  align-items: center;
  gap: 2px;
}
.session-footer {
  padding-top: 10px;
  display: flex;
  justify-content: center;
  border-top: 1px solid var(--border-subtle);
  margin-top: 4px;
}

/* ==================== 统计卡片 ==================== */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 768px) {
  .stat-cards { grid-template-columns: 1fr; }
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-container-card);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.18s ease, transform 0.18s ease;
  cursor: default;
}
.stat-card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}
.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md, 10px);
  flex-shrink: 0;
}
.stat-net { --sc: var(--metric-net); }
.stat-jvm { --sc: var(--metric-jvm); }
.stat-db { --sc: var(--metric-db); }
.stat-net .stat-icon, .stat-jvm .stat-icon, .stat-db .stat-icon {
  background: color-mix(in srgb, var(--sc) 12%, transparent);
  color: var(--sc);
}
.stat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-label {
  font-size: 11px;
  color: var(--text-tertiary);
}
.stat-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

/* ==================== 图表 ==================== */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 720px) {
  .charts-row { grid-template-columns: 1fr; }
}
.chart-card {
  min-height: 220px;
  background: var(--bg-container-card);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-card);
}
.chart-box { height: 200px; width: 100%; }

/* ==================== 表格 ==================== */
.packet-card {
  background: var(--bg-container-card);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-card);
}
.table-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}

/* ==================== 通用 ==================== */
.mono { font-family: 'SF Mono', 'Cascadia Code', monospace; font-size: 11px; }
.dim { color: var(--text-tertiary); }
.info-cell {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.proto-tag { font-family: 'SF Mono', monospace; }
.proto-tcp { color: var(--metric-cpu); }
.proto-udp { color: var(--status-success); }
.proto-http { color: var(--metric-disk); }
.proto-tls { color: var(--text-tertiary); }
.proto-dns { color: var(--status-error); }
.proto-icmp { color: var(--metric-jvm); }
.proto-arp { color: var(--metric-disk); }
.proto-ssh { color: var(--metric-net); }
.proto-quic { color: var(--text-secondary); }

.packet-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.detail-section h4 {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--text-primary);
}
.restored, .raw {
  background: var(--bg-fill);
  border-radius: var(--radius-sm, 8px);
  padding: 12px;
  font-size: 11px;
  line-height: 1.5;
  max-height: 260px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (prefers-reduced-motion: reduce) {
  .status-dot, .session-state { animation: none; }
  .session-item, .stat-card { transition: none; }
}
</style>