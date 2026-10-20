<!--
  抓包分析（TShark）

  页面结构：
    ① 顶部工具栏：「新增会话」+ 刷新 + 运行状态；
    ② 遥测条：会话总数 / 运行中 / 报文累计 / 已落盘（只读，等宽数字）；
    ③ 会话表（ReTable）：一行一个抓包会话，操作列给出「报文 / 统计 / 会话流」，
       另附停止、下载原件、删除。
  抓包参数（网卡 / 过滤语法 / 过滤表达式 / 上限）全部收进「新增会话」弹层；
  报文 / 统计 / 会话流 / 诊断在会话详情弹层里看，不再常驻占满整页。
  诊断页把重置、ICMP 不可达、重传、乱序、零窗口、DNS / HTTP / TLS 异常列成体检表，
  点一行即回填等价显示过滤并切到报文页。

  报文右键「查看生命周期」仍在详情弹层的报文页里：按四元组还原整条 TCP 流
  （HTTP / TLS / SSH 等 TCP 上的协议同样支持），时序图 + ReTable 明细。
-->
<template>
  <div class="tshark-page capture-page">
    <div class="tshark-bar">
      <div class="tshark-bar__group">
        <span class="tshark-status" :class="tsharkOk ? 'tshark-status--ok' : 'tshark-status--bad'">
          <span class="tshark-status__dot" />
          <span>{{ tsharkOk ? 'TShark 可用' : 'TShark 未就绪' }}</span>
        </span>
      </div>

      <span class="tshark-bar__spacer" />
      <ReButton icon="Refresh" layout="square" tip="刷新会话列表" @click="refresh" />
      <ReButton type="primary" icon="Plus" :disabled="!tsharkOk" @click="createVisible = true">
        新增会话
      </ReButton>
    </div>

    <!-- 遥测条：会话表的只读总览，数字逐位对齐，运行中用信号色点出来 -->
    <div class="ts-tele">
      <div class="ts-tele__cell">
        <span class="ts-tele__value">{{ filteredSessions.length }}</span>
        <span class="ts-tele__label">会话总数</span>
      </div>
      <div class="ts-tele__cell" :class="{ 'is-hot': runningCount > 0 }">
        <span class="ts-tele__value">{{ runningCount }}</span>
        <span class="ts-tele__label">运行中</span>
      </div>
      <div class="ts-tele__cell">
        <span class="ts-tele__value">{{ totalPacketsText }}</span>
        <span class="ts-tele__label">报文累计</span>
      </div>
      <div class="ts-tele__cell">
        <span class="ts-tele__value">{{ totalSizeText }}</span>
        <span class="ts-tele__label">已落盘</span>
      </div>
    </div>

    <div class="tshark-work">
      <ReTable
        class="tshark-table capture-table"
        :data="filteredSessions"
        :loading="loadingSessions"
        :pagination="true"
        :page-sizes="[10, 20, 50]"
        v-model:page="sessionPage"
        v-model:page-size="sessionPageSize"
        :toolbar="false"
        size="small"
        row-key="id"
        stripe
        :row-class-name="sessionRowClass"
        empty-text="还没有抓包会话，点右上角「新增会话」选择网卡开始"
      >
        <ReTableColumn prop="sessionName" label="会话" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="session-name__text" :title="row.sessionName">{{ row.sessionName || `会话 ${row.id}` }}</span>
          </template>
        </ReTableColumn>

        <ReTableColumn label="网卡" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span :title="row.captureInterface">{{ ifaceLabel(row.captureInterface) }}</span>
          </template>
        </ReTableColumn>

        <ReTableColumn label="状态" width="106" align="center">
          <template #default="{ row }">
            <span v-if="row.captureStatus === 2" class="ts-pill ts-pill--err" :title="row.lastError || '抓包 / 解析异常'">
              <span class="ts-pill__dot" />异常
            </span>
            <span v-else-if="row.captureStatus === 1" class="ts-pill ts-pill--run">
              <span class="ts-pill__dot" />抓包中
            </span>
            <span v-else class="ts-pill ts-pill--stop">
              <span class="ts-pill__dot" />已停止
            </span>
          </template>
        </ReTableColumn>

        <ReTableColumn prop="packetCount" label="报文数" width="96" align="right">
          <template #default="{ row }"><span class="ts-num">{{ row.packetCount ?? 0 }}</span></template>
        </ReTableColumn>

        <ReTableColumn label="大小" width="96" align="right">
          <template #default="{ row }">
            <span class="ts-num" :title="sizeTitle(row)">{{ fileSizeText(row.fileSize) }}</span>
          </template>
        </ReTableColumn>

        <ReTableColumn prop="startTime" label="开始时间" width="170">
          <template #default="{ row }"><span class="ts-num">{{ row.startTime || '—' }}</span></template>
        </ReTableColumn>

        <ReTableColumn label="时长" width="84" align="right">
          <template #default="{ row }">
            <span class="ts-num">{{ durationText(row) }}</span>
          </template>
        </ReTableColumn>

        <ReTableColumn label="操作" width="330" align="center" fixed="right">
          <template #default="{ row }">
            <div class="capture-ops">
              <ReButton link type="primary" @click="openDetail(row, 'packet')">报文</ReButton>
              <ReButton link type="primary" @click="openDetail(row, 'stats')">统计</ReButton>
              <ReButton link type="primary" @click="openDetail(row, 'flow')">会话流</ReButton>
              <span class="capture-ops__sep" />
              <ReButton
                v-if="row.captureStatus === 1"
                icon="VideoPause"
                layout="square"
                tip="停止抓包"
                @click="stopSession(row.id)"
              />
              <ReButton
                icon="Download"
                layout="square"
                tip="下载原始 pcap（用 Wireshark 打开）"
                @click="downloadPcap(row.id, row.sessionName)"
              />
              <ReButton
                icon="Delete"
                type="danger"
                layout="square"
                tip="删除会话及其报文"
                @click="deleteSession(row.id)"
              />
            </div>
          </template>
        </ReTableColumn>
      </ReTable>
    </div>

    <!-- 新增会话 -->
    <ScTsharkCreateDialog
      v-model="createVisible"
      v-model:iface="iface"
      v-model:filter="filter"
      v-model:filter-type="filterType"
      v-model:capture-name="captureName"
      v-model:count="count"
      v-model:timeout="timeout"
      v-model:max-size-mb="maxSizeMb"
      :tshark-ok="tsharkOk"
      :iface-options="ifaceOptions"
      :starting="starting"
      @start="onCreate"
    />

    <!-- 会话详情：报文 / 统计 / 会话流 -->
    <ScTsharkSessionDetailDialog
      v-model="detailVisible"
      :session="activeSession"
      :iface-label="ifaceLabel(activeSession?.captureInterface)"
      :initial-tab="detailTab"
      :live-connected="liveConnected"
      :live-count="liveCount"
      :packet-filter="packetFilter"
      :filter-error="filterError"
      @apply-filter="applyPacketFilter"
    >
      <template #packet>
        <ScTsharkPacketPanel
          v-if="activeSessionId != null"
          :packets="packets"
          :loading="loadingPackets"
          :page="packetPage"
          :page-size="packetPageSize"
          :total="packetTotal"
          :empty-text="packetEmptyText"
          @page-change="loadPackets"
          @open-detail="openPacketDetail"
          @open-lifecycle="openLifecycle"
          @export="exportCsv"
        />
        <div v-else class="tshark-panel__empty">
          <ReEmpty description="选择一个抓包会话后查看报文" layout="modern" />
        </div>
      </template>

      <template #stats>
        <ScTsharkStatsPanel
          v-if="activeSessionId != null"
          :proto-stats="protoStats"
          :top-flows="topFlows"
          :packet-total="packetTotal"
          :version="statsVersion"
          :timeline="timeline"
          :bucket="timelineBucket"
          @pick-protocol="onPickProtocol"
          @timeline-bucket="loadTimeline"
        />
        <div v-else class="tshark-panel__empty">
          <ReEmpty description="选择一个抓包会话后查看统计" layout="modern" />
        </div>
      </template>

      <template #flow>
        <ScTsharkFlowPanel
          v-if="activeSessionId != null"
          :top-flows="topFlows"
          :packet-total="packetTotal"
          :version="statsVersion"
          @pick-flow="onPickFlow"
        />
        <div v-else class="tshark-panel__empty">
          <ReEmpty description="选择一个抓包会话后查看会话流" layout="modern" />
        </div>
      </template>

      <template #insight>
        <ScTsharkInsightsPanel
          v-if="activeSessionId != null"
          :anomalies="anomalies"
          :filtered="!!packetFilter.trim()"
          :loading="loadingStats"
          @pick-anomaly="onPickAnomaly"
        />
        <div v-else class="tshark-panel__empty">
          <ReEmpty description="选择一个抓包会话后查看诊断" layout="modern" />
        </div>
      </template>
    </ScTsharkSessionDetailDialog>

    <ScTsharkPacketDetail v-model="detailOpen" :packet="packetDetail" />
    <ScTsharkLifecycleDialog
      v-model="lifecycleVisible"
      :packet="lifecyclePacket"
      @open-detail="openPacketDetailById"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ReButton from '@repo/ui/re-button'
import ReEmpty from '@repo/ui/re-empty'
import ReTable from '@repo/ui/re-table'
import { useTshark } from './useTshark'
import { fmtDuration } from './tsharkFormat'
import ScTsharkCreateDialog from './ScTsharkCreateDialog.vue'
import ScTsharkSessionDetailDialog from './ScTsharkSessionDetailDialog.vue'
import ScTsharkPacketPanel from './ScTsharkPacketPanel.vue'
import ScTsharkStatsPanel from './ScTsharkStatsPanel.vue'
import ScTsharkFlowPanel from './ScTsharkFlowPanel.vue'
import ScTsharkInsightsPanel from './ScTsharkInsightsPanel.vue'
import ScTsharkPacketDetail from './ScTsharkPacketDetail.vue'
import ScTsharkLifecycleDialog from './ScTsharkLifecycleDialog.vue'
import type { TsharkFlow, TsharkPacket, TsharkSession, TsharkTabKey } from './types'
import './tshark.css'

/**
 * 列表页不自动选中会话：详情是用户点「报文 / 统计 / 会话流」才打开的，
 * 自动选中会让 SSE 在没人看的时候也一直连着。
 */
const {
  tsharkOk, ifaceOptions, iface, filter, filterType, captureName, count, timeout, maxSizeMb, starting,
  loadingSessions, filteredSessions, runningCount,
  sessionPage, sessionPageSize, activeSessionId, activeSession,
  loadingPackets, packets, packetPage, packetTotal, packetFilter, filterError, packetPageSize,
  protoStats, topFlows, statsVersion, liveConnected, liveCount, loadingStats,
  timeline, timelineBucket, anomalies,
  detailOpen, packetDetail,
  init, loadSessions, selectSession, clearActiveSession, loadPackets, applyPacketFilter,
  filterByProtocol, filterByFlow, refresh, exportCsv, downloadPcap, startCapture, stopSession, deleteSession,
  loadTimeline,
  openPacketDetail, openPacketDetailById,
} = useTshark({ source: 'live', autoSelectFirst: false })

const createVisible = ref(false)
const detailVisible = ref(false)
const detailTab = ref<TsharkTabKey>('packet')

const lifecycleVisible = ref(false)
const lifecyclePacket = ref<TsharkPacket | null>(null)

const packetEmptyText = computed(() =>
  packetFilter.value.trim() ? '没有匹配的数据包，试试清除或修改过滤' : '该会话还没有抓到的数据包')

/** 遥测条：报文累计（带千分位） */
const totalPacketsText = computed(() => {
  const total = filteredSessions.value.reduce((sum, s) => sum + (Number(s.packetCount) || 0), 0)
  return total.toLocaleString('en-US')
})

/** 遥测条：已落盘总量；复用同一套单位换算，避免两处口径不一致 */
const totalSizeText = computed(() => {
  const total = filteredSessions.value.reduce((sum, s) => sum + (Number(s.fileSize) || 0), 0)
  return total > 0 ? fileSizeText(total) : '0 B'
})

/** 运行中的会话整行打标：左侧信号亮条与淡色底由 tshark.css 接管 */
function sessionRowClass({ row }: { row: TsharkSession }): string {
  return row.captureStatus === 1 ? 'is-run' : ''
}

/** 字节数转可读大小；空 / 0 显示 — */
function fileSizeText(bytes?: number | null): string {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

/** 大小列的悬停说明：带出配置的大小上限 */
function sizeTitle(row: TsharkSession): string {
  const used = fileSizeText(row.fileSize)
  const max = Number(row.maxSizeMb)
  return Number.isFinite(max) && max > 0 ? `已写入 ${used}，上限 ${max} MB` : `已写入 ${used}，未设上限`
}

/**
 * 网卡显示名：表格里不直接铺 \Device\NPF_{GUID}（又长又没法读）。
 * 优先用 tshark -D 返回的友好名（Ethernet / WLAN），找不到再退回去掉前缀的 GUID。
 */
function ifaceLabel(value?: string | null): string {
  if (!value) return '—'
  const hit = ifaceOptions.value.find(o => o.value === value)
  if (hit) return hit.label
  return value.replace(/^\\Device\\NPF_/, '').replace(/[{}]/g, '') || value
}

/** 后端没回填 captureDuration 时（停止后只落 start/end），用起止时间补一个时长 */
function durationText(row: TsharkSession): string {
  const start = parseTime(row.startTime)
  const end = parseTime(row.endTime)
  if (start !== null && end !== null && end >= start) {
    return fmtDuration(Math.round((end - start) / 1000))
  }
  const seconds = Number(row.captureDuration)
  return Number.isFinite(seconds) && seconds > 0 ? fmtDuration(seconds) : '—'
}

function parseTime(t?: string | null): number | null {
  if (!t) return null
  const d = t.includes('T') ? new Date(t) : new Date(t.replace(/-/g, '/'))
  return isNaN(d.getTime()) ? null : d.getTime()
}

/**
 * 新增会话：启动成功才关弹层；失败（过滤器语法错等）留在弹层里改参数。
 */
async function onCreate() {
  const ok = await startCapture()
  if (ok) createVisible.value = false
}

/** 打开某会话的详情，并默认停在用户点的那一页 */
function openDetail(row: TsharkSession, tab: TsharkTabKey) {
  detailTab.value = tab
  detailVisible.value = true
  selectSession(row.id)
}

/**
 * 关闭详情：清掉选中会话，顺带断开 SSE。
 * 生命周期 / 报文详情是叠在详情上的弹层，一并收掉，避免下次打开残留上一条会话的数据。
 */
watch(detailVisible, visible => {
  if (visible) return
  lifecycleVisible.value = false
  detailOpen.value = false
  clearActiveSession()
})

/** 统计页点协议：切回报文页并按协议过滤 */
function onPickProtocol(protocol: string) {
  filterByProtocol(protocol)
  detailTab.value = 'packet'
}

/** 会话流页点某条流：切回报文页并按该流过滤 */
function onPickFlow(flow: TsharkFlow) {
  filterByFlow(flow)
  detailTab.value = 'packet'
}

/**
 * 诊断页点某个异常：把后端给的等价过滤回填，并切到报文页。
 *
 * <p>过滤条本身会显示这条表达式，用户能看清「现在筛的是什么」，也方便改。
 * 表达式由后端按同一套规则生成，和统计时的 SQL 口径一致。</p>
 */
function onPickAnomaly(filterText: string) {
  applyPacketFilter(filterText)
  detailTab.value = 'packet'
}

function openLifecycle(row: TsharkPacket) {
  lifecyclePacket.value = row
  lifecycleVisible.value = true
}

onMounted(init)
</script>

<style scoped>
.capture-page {
  gap: 10px;
}
.capture-table {
  min-width: 0;
}
.session-name__text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.capture-ops {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.capture-ops__sep {
  width: 1px;
  height: 14px;
  margin: 0 2px;
  background: var(--el-border-color-lighter);
}
</style>
