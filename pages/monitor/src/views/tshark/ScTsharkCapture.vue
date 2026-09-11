<template>
  <div class="tshark-page fade-in">
    <!-- 顶部: tshark 状态 + 新建抓包 -->
    <div class="toolbar">
      <div class="tshark-status">
        <ReStatusIndicator :type="tsharkOk ? 'success' : 'danger'" />
        <span>{{ tsharkOk ? 'TShark 可用' : 'TShark 不可用' }}</span>
        <ReTag v-if="activeSessionId != null" :type="liveConnected ? 'success' : 'info'" size="small" effect="light">
          {{ liveConnected ? `实时推送 +${liveCount}` : '推送未连接' }}
        </ReTag>
      </div>
      <div class="toolbar-right">
        <ReSelect v-model="iface" placeholder="选择网卡" clearable filterable class="iface-select"
          :data="interfaces.map(i => ({ label: i, value: i }))" />
        <ReInput v-model="filter" placeholder="BPF 过滤, 如 tcp port 8080" clearable class="filter-input" />
        <ReInputNumber v-model="count" :min="0" :max="1000000" placeholder="包数(0不限)" class="count-input" />
        <ReInputNumber v-model="timeout" :min="0" :max="86400" placeholder="时长(秒)" class="count-input" />
        <ReButton show-text icon="VideoPlay" type="primary" :loading="starting" @click="startCapture">开始抓包</ReButton>
      </div>
    </div>

    <div class="body-grid">
      <!-- 左: 会话列表 -->
      <div class="session-panel">
        <ReCard layout="simple" :radius="12" :padding="12" shadow="never" class="panel-card">
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
                  <span class="session-name">{{ s.sessionName || s.captureInterface }}</span>
                  <span class="session-status">
                    <ReStatusIndicator :type="s.captureStatus === 1 ? 'success' : 'info'" />
                    <ReTag :type="s.captureStatus === 1 ? 'success' : 'info'" size="small" effect="light">
                      {{ s.captureStatus === 1 ? '抓包中' : '已停止' }}
                    </ReTag>
                  </span>
                </div>
                <div class="session-meta">
                  <span>{{ s.captureInterface }}</span>
                  <span class="dim">{{ s.packetCount ?? 0 }} 包</span>
                </div>
                <div class="session-meta dim">
                  <span>{{ s.startTime || '' }}</span>
                </div>
                <div class="session-actions">
                  <ReButton v-if="s.captureStatus === 1" size="small" link type="warning" icon="VideoPause" show-text @click.stop="stopSession(s.id)">停止</ReButton>
                  <ReButton size="small" link type="danger" icon="Delete" show-text @click.stop="deleteSession(s.id)">删除</ReButton>
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
      </div>

      <!-- 右: 详情 -->
      <div class="detail-panel" v-show="activeSessionId">
        <!-- 统计卡片 -->
        <div class="stat-cards">
          <ReStatCard title="数据包总数" :value="packetTotal" icon="DataLine" icon-color="var(--metric-net)" />
          <ReStatCard title="协议种类" :value="protoStats.length" icon="Collection" icon-color="var(--metric-jvm)" />
          <ReStatCard title="Top流" :value="topFlows.length" icon="TrendCharts" icon-color="var(--metric-db)" />
        </div>

        <!-- 协议分布 + Top 流 -->
        <div class="charts-row">
          <ReCard layout="simple" :radius="12" :padding="12" shadow="never" class="chart-card">
            <template #title><span class="panel-title">协议分布</span></template>
            <div ref="protoChartRef" class="chart-box"></div>
          </ReCard>
          <ReCard layout="simple" :radius="12" :padding="12" shadow="never" class="chart-card">
            <template #title><span class="panel-title">Top 会话流</span></template>
            <div ref="flowChartRef" class="chart-box"></div>
          </ReCard>
        </div>

        <!-- 数据包表格 -->
        <ReCard layout="simple" :radius="12" :padding="12" shadow="never">
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
                <ReButton size="small" link type="primary" @click="openPacketDetail(row)">详情</ReButton>
              </template>
            </ReTableColumn>
          </ReTable>
          <div class="table-footer">
            <RePagination small layout="prev, pager, next" :total="packetTotal" :page-size="20"
                           :current-page="packetPage" @current-change="(p: number) => loadPackets(p)" />
          </div>
        </ReCard>
      </div>

      <!-- 无会话时的提示 -->
      <div class="empty-detail" v-show="!activeSessionId">
        <ReEmpty description="请选择左侧抓包会话，或新建一个抓包任务" layout="modern" />
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

function renderProtoChart() {
  if (!protoChartRef.value) return
  protoChart = echarts.init(protoChartRef.value)
  const data = protoStats.value.slice(0, 12)
  protoChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 10 } },
    series: [{
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4, borderColor: 'var(--bg-container)', borderWidth: 1 },
      label: { show: true, formatter: '{b}: {c}', fontSize: 10 },
      data: data.length
        ? data.map(d => ({ name: d.protocol, value: d.count }))
        : [{ name: '暂无数据', value: 1, itemStyle: { color: 'var(--text-tertiary)' } }],
    }],
  })
}

function renderFlowChart() {
  if (!flowChartRef.value) return
  flowChart = echarts.init(flowChartRef.value)
  const data = topFlows.value.slice(0, 10)
  flowChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '12%', right: '8%', top: '8%', bottom: '10%' },
    xAxis: { type: 'value', name: '包数' },
    yAxis: {
      type: 'category',
      data: data.length ? data.map(d => d.flow) : ['暂无数据'],
      axisLabel: { fontSize: 9 },
    },
    series: [{
      type: 'bar',
      data: data.length ? data.map(d => d.count) : [0],
      itemStyle: { borderRadius: [0, 4, 4, 0], color: 'var(--brand-500)' },
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
.tshark-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--bg-container-card);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-subtle);
  flex-wrap: wrap;
  box-shadow: var(--shadow-card);
}
.tshark-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 600;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.iface-select { width: 150px; }
.filter-input { width: 220px; }
.count-input { width: 110px; }

.body-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 12px;
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
  gap: 12px;
  min-width: 0;
  min-height: 0;
}
.empty-detail {
  grid-column: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  gap: 8px;
}

.panel-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-container-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.session-list {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 2px;
}
.session-item {
  border: 1px solid var(--border-subtle);
  border-radius: var(--border-radius-sm);
  padding: 8px 10px;
  cursor: pointer;
  background: var(--bg-container-card);
  transition: border-color var(--transition-base), box-shadow var(--transition-base), transform var(--transition-base), background-color var(--transition-base);
}
.session-item:hover {
  border-color: var(--metric-net);
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-1px);
}
.session-item:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-color: var(--brand-500);
}
.session-item.active {
  border-color: var(--metric-net);
  background: color-mix(in srgb, var(--metric-net) 6%, transparent);
}
.session-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.session-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.session-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.session-meta {
  display: flex;
  gap: 8px;
  font-size: 10.5px;
  color: var(--text-tertiary);
  margin-top: 3px;
}
.session-actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  justify-content: flex-end;
}
.session-footer {
  padding-top: 8px;
  display: flex;
  justify-content: center;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 768px) {
  .stat-cards { grid-template-columns: 1fr; }
}
.stat-cards :deep(.re-stat-card) {
  transition: box-shadow var(--transition-base), transform var(--transition-base), opacity var(--transition-base);
}
.stat-cards :deep(.re-stat-card:hover) {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.chart-card {
  min-height: 220px;
  background: var(--bg-container-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
}
.chart-box { height: 200px; width: 100%; }

.table-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}
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
  border-radius: var(--border-radius-sm);
  padding: 10px;
  font-size: 11px;
  line-height: 1.5;
  max-height: 260px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
