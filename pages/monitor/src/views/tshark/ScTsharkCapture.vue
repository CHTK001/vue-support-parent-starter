<template>
  <div class="tshark-page fade-in">
    <!-- 顶部工具条：状态 + 新建抓包 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="status-pill" :class="tsharkOk ? 'status-ok' : 'status-bad'">
          <span class="status-dot"></span>
          <span>{{ tsharkOk ? 'TShark 可用' : 'TShark 不可用' }}</span>
        </div>
        <ReTag v-if="activeSessionId != null" :type="liveConnected ? 'success' : 'info'" effect="light">
          {{ liveConnected ? `实时推送中 +${liveCount}` : '推送未连接' }}
        </ReTag>
      </div>

      <div class="toolbar-right">
        <ReSelect v-model="iface" placeholder="选择网卡" clearable filterable class="iface-select"
          :data="interfaces.map(i => ({ label: i, value: i }))" />
        <ReInput v-model="filter" placeholder="BPF 过滤，如 tcp port 8080" clearable class="filter-input" />
        <ReInputNumber v-model="count" :min="0" :max="1000000" placeholder="包数" class="count-input" />
        <ReInputNumber v-model="timeout" :min="0" :max="86400" placeholder="时长/s" class="count-input" />
        <ReButton show-text icon="VideoPlay" type="primary" :loading="starting" :disabled="!tsharkOk"
          :title="tsharkOk ? '' : 'tshark 未安装或不在 PATH 中，无法抓包'" @click="startCapture">开始抓包</ReButton>
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
                  <ReTag :type="s.captureStatus === 1 ? 'success' : 'info'" effect="plain">
                    {{ s.captureStatus === 1 ? '抓包中' : '已停止' }}
                  </ReTag>
                  <div class="action-btns">
                    <ReButton v-if="s.captureStatus === 1" icon="VideoPause" layout="square" tip="停止抓包" @click.stop="stopSession(s.id)" />
                    <ReButton icon="Delete" layout="square" type="danger" tip="删除会话" @click.stop="deleteSession(s.id)" />
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
        <!-- 统计卡片：改用 ReStatCard 紧凑档，与「代理管理 / 账号管理 / 服务管理」
             同一套规格（渐变图标圆 + 数值 + 标题 + 描述）。原先是手写的
             .stat-card div，图标是没有底色的裸 ReIcon，与全站卡片外观不一致。 -->
        <div class="stat-cards">
          <ReStatCard size="compact" title="数据包总数" :value="packetTotal" desc="已入库明细" :icon="DataLine" icon-color="var(--metric-cpu)" />
          <ReStatCard size="compact" title="协议种类" :value="protoStats.length" desc="按协议层统计" :icon="Collection" icon-color="var(--el-color-success)" />
          <ReStatCard size="compact" title="Top 会话流" :value="topFlows.length" desc="按字节量排序" :icon="TrendCharts" icon-color="var(--el-color-warning)" />
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
          <ReTable :data="packets" :loading="loadingPackets" border stripe :pagination="false" :toolbar="false">
            <ReTableColumn prop="packetTime" label="时间" width="170" align="center">
              <template #default="{ row }"><span class="mono dim">{{ row.packetTime || '' }}</span></template>
            </ReTableColumn>
            <ReTableColumn label="协议" width="90" align="center">
              <template #default="{ row }">
                <ReTag :class="['proto-tag', protoClass(row.protocol)]" effect="plain" >{{ row.protocol || 'OTHER' }}</ReTag>
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
                <ReButton link type="primary" @click="openPacketDetail(row)">详情</ReButton>
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
          <ReDescriptions :column="2" border >
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
import { Collection, DataLine, TrendCharts } from '@element-plus/icons-vue'
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
/* 本文件原先整套用 pages/monitor/src/styles/tokens.css 的私有令牌（--bg-* / --text-*
   / --border-subtle / --brand-500 / --status-* / --shadow-card / --radius-*），
   而那份 tokens.css 只有 :root、没有暗色变体，暗色模式下这些值全部停留在亮色。
   已统一改走 EP 语义令牌；--metric-* 是「网络/中间件域各自的固定色相」，
   需要彼此可区分，保留不换成 EP 语义色。 */
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
  background: var(--el-bg-color);
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  /* koi 规约：工具条是容器，静止态不加投影，边界由上面那圈边框承载 */
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
  border-radius: var(--el-radius-full, 9999px);
  font-size: 12px;
  font-weight: 600;
  /* 原来写 transition: all 0.2s，all 会把布局属性也纳入过渡；显式列出真实会变的属性 */
  transition:
    color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.status-ok {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}
.status-bad {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--el-radius-full, 9999px);
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
  border-color: var(--el-border-color-lighter) !important;
}
.iface-select :deep(.el-select__wrapper:hover) { background: var(--el-fill-color-light); }
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
  /* 窄屏改成上下堆叠。统计卡必须固定一行三列：按 auto-fit 换行时 760 宽会变成
     两行、占 265px，再叠会话列表，留给报文明细的就只剩几十像素，等于看不见。
     限高与图表让位规则见下方各自的媒体查询。 */
  .stat-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .empty-detail { grid-column: 1; }
}

/* 窄屏把统计卡压成「图标 + 数值」单行：标题与描述都是重复信息，让位给报文明细。
   ReStatCard 紧凑档 value 20px / min-height 22px，这里降到 16px 并清掉 min-height。
   断点 1000px 来自实测：880 宽时三列 + 仅隐藏描述行 → 统计卡仍占 76px、明细只剩 109.6px。 */
@media (max-width: 1000px) {
  .stat-cards { gap: 6px; }
  .stat-cards :deep(.re-stat-card) { padding: 5px 8px; }
  .stat-cards :deep(.re-stat-card__title),
  .stat-cards :deep(.re-stat-card__desc) { display: none; }
  .stat-cards :deep(.re-stat-card__value) { font-size: 16px; min-height: 0; line-height: 1.1; }
  .stat-cards :deep(.re-stat-card__icon) { width: 24px; height: 24px; }
}

/* 窄到连「图标 + 数值」都排不开时（每列 < 130px），把图标也去掉，只留数值 ——
   数字本身不依赖图标即可读，再挤下去三列就会互相压字。
   760×1000 实测：三列 + 图标时统计卡占 156px，明细只剩 74px。 */
@media (max-width: 800px) {
  .stat-cards :deep(.re-stat-card__aside) { display: none; }
  .stat-cards :deep(.re-stat-card) { padding: 4px 6px; text-align: center; }
  .stat-cards :deep(.re-stat-card__value) { font-size: 18px; }
}

/* 窄屏上下堆叠时，会话列表必须限高，否则列表按内容长高、把明细挤没。
   限得太死又会让明细看不见 —— 实测折中：
     200px → 760 宽时明细只剩 44px（不够一行表头）
     160px → 760 宽时明细 74px、880 宽时 186px，两档都可用
   160px 还能显示 3 条以上会话（每条约 48px 加头尾）。 */
@media (max-width: 900px) {
  .body-grid {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 160px) minmax(0, 1fr);
  }
  .session-panel { overflow: auto; }
}

/* 视口又窄又矮时，图表是唯一还能整块让位的东西：它高度固定（232px），
   在 760×1000 这种组合下会把明细压到几十 px。与其让用户面对一条看不见的表格，
   不如先撤掉图表（协议分布 / Top 流随时可切到别的会话去看）。 */
@media (max-width: 900px), (max-height: 860px) {
  .charts-row { display: none; }
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
  color: var(--el-text-color-secondary);
  min-height: 320px;
}
.empty-illustration {
  color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  opacity: 0.7;
}

/* ==================== 会话面板 ==================== */
.panel-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-lg, 12px);
  /* koi 规约：面板容器静止态不加投影 */
  overflow: hidden;
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
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
  border: 1px solid var(--el-border-color-lighter);
  /* 原来是 var(--radius-md)（tokens.css 里解析为 8px）→ md 档 */
  border-radius: var(--el-radius-md, 8px);
  padding: 10px 12px;
  cursor: pointer;
  background: var(--el-bg-color);
  /* 原生可点行：去掉默认轮廓，改用自绘焦点环 */
  outline: none;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease,
    transform var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.session-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 0 var(--el-radius-full, 9999px) var(--el-radius-full, 9999px) 0;
  background: var(--el-color-primary);
  opacity: 0;
  transition: opacity var(--el-transition-duration-fast, 0.2s) ease;
}
.session-item:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 45%, transparent);
  background: var(--el-fill-color-light);
  transform: translateY(-1px);
}
.session-item:hover::before { opacity: 0.5; }
.session-item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border-color: var(--el-color-primary);
}
.session-item.active {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  /* 原来还有 inset 0 0 0 1px rgba(99,102,241,.30) 这圈内描边，属于重复表达：
     选中态已有主色边框 + 浅底 + 左侧强调条（:before opacity:1），故去掉 */
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
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.session-state {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: var(--el-radius-full, 9999px);
}
.state-run { background: var(--el-color-success); box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 20%, transparent); animation: pulse 2s ease-in-out infinite; }
.state-stop { background: var(--el-text-color-placeholder); }

.session-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  flex-wrap: wrap;
}
.meta-iface {
  font-family: 'SF Mono', 'Cascadia Code', monospace;
  color: var(--el-text-color-regular);
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
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: 4px;
}

/* ==================== 统计卡片 ====================
   卡面规格统一交给 ReStatCard（渐变图标圆 / 数值 / 标题 / 描述 / 悬停抬升），
   这里只负责排布。原先手写的 .stat-card / .stat-icon / .stat-body / .stat-value
   已随模板一并删除 —— 留着就是没人引用的死样式。 */
.stat-cards {
  flex: none;
  display: grid;
  /* 紧凑档单卡较窄，用 auto-fit 自动换行；原来的固定 3 列在窄面板会挤成一条 */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
@media (max-width: 768px) {
  .stat-cards { grid-template-columns: 1fr; }
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
  background: var(--el-bg-color);
  border-radius: var(--el-radius-lg, 12px);
  /* koi 规约：图表容器静止态不加投影 */
}
.chart-box { height: 200px; width: 100%; }

/* ==================== 表格 ==================== */
/* 数据包表吃满剩余高度：统计卡与图表固定高，只有这张卡伸展。
   这里刻意不给 .packet-card 设 min-height 下限 —— 下限一旦生效，表格就被钉死
   在固定像素上，可用高度只能变成 .detail-panel 的纵向滚动条。改成 min-height:0
   后空间不足由 .detail-panel 的 overflow:auto 兜底，空间充足则一路吃到面板底边。 */
.charts-row { flex: none; }
/* 空间实在不够时（窄屏 + 统计卡换行），整块图表让位给表格。
   图表是可再生的概览，报文明细才是这个页面的主数据；把稀缺高度优先给主数据，
   而不是让表格被压成一条 22px 后再让面板出滚动条。 */
/* 纵向空间不足时整块图表让位给表格（宽屏 + 高视口场景）。
   断点 960px 来自实测：1080 高时三块都装得下；900 高时宽屏装得下但明细偏矮。
   窄屏的让位规则见下方 max-width:1000px 那组，两者取并集。 */
@media (max-height: 960px) {
  .charts-row { display: none; }
}
.packet-card {
  flex: 1 1 0;
  /* 不要 min-height 下限：它一旦生效，表格就被钉死在 240px，剩下的可用高度
     只能变成 .detail-panel 的纵向滚动条（实测 1000px 视口下 panel 溢出 109px）。
     改成 min-height:0 后空间不足时由 .detail-panel 的 overflow:auto 统一兜底，
     空间充足时表格可以一直吃到面板底边。 */
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-lg, 12px);
  /* koi 规约：表格容器静止态不加投影 */
}
/* ReCard 把内容包在 .el-card__body 里，必须让它也成为可伸展的 flex 列，
   否则里面的表格拿到的仍是内容高度。 */
.packet-card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.packet-card :deep(.re-table) {
  flex: 1 1 0;
  min-height: 0;
}
.table-footer {
  flex: none;
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}

/* ==================== 通用 ==================== */
.mono { font-family: 'SF Mono', 'Cascadia Code', monospace; font-size: 11px; }
.dim { color: var(--el-text-color-secondary); }
.info-cell {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.proto-tag { font-family: 'SF Mono', monospace; }
/* --metric-* 保留原色相（各协议/指标需彼此可区分）；--status-* 换成 EP 语义色 */
.proto-tcp { color: var(--metric-cpu); }
.proto-udp { color: var(--el-color-success); }
.proto-http { color: var(--metric-disk); }
.proto-tls { color: var(--el-text-color-placeholder); }
.proto-dns { color: var(--el-color-danger); }
.proto-icmp { color: var(--metric-jvm); }
.proto-arp { color: var(--metric-disk); }
.proto-ssh { color: var(--metric-net); }
.proto-quic { color: var(--el-text-color-regular); }

.packet-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.detail-section h4 {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--el-text-color-primary);
}
.restored, .raw {
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  padding: 12px;
  font-size: 11px;
  line-height: 1.5;
  max-height: 260px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (prefers-reduced-motion: reduce) {
  /* 状态点 / 运行中指示的呼吸动画：这两个状态本来就由点的底色（成功绿 / 危险红 / 禁用灰）
     表达，动画只是附加动效，不是唯一信息，可以安全停掉 */
  .status-dot, .session-state { animation: none; }
  /* .stat-card 已随模板删除（改用 ReStatCard），此处改指组件根类，
     否则统计卡的悬停抬升动效在「减少动态效果」偏好下反而没被停掉 */
  .session-item, :deep(.re-stat-card) { transition: none; }
  .status-pill,
  .session-item::before {
    transition: none;
  }
}
</style>