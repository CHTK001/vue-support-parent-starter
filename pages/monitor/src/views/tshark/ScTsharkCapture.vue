<!--
  抓包分析（TShark）

  页面结构：
    ① 会话列表：交给 TsharkSessionStage —— 页头 + 控制栏 + 五个方向
       （工单台 / 节奏 / 仪表 / 档案柜 / 卡片墙），方向由右下角方向坞切换。
    ② 顶部只有两个动作：「新增会话」（抓包参数全在弹层里）与「执行日志」式的
       环境状态点；刷新在控制栏里。
    ③ 报文 / 统计 / 会话流 / 诊断在会话详情弹层里看，不常驻占满整页。
       诊断页把重置、ICMP 不可达、重传、乱序、零窗口、DNS / HTTP / TLS 异常列成体检表，
       点一行即回填等价显示过滤并切到报文页。

  为什么列表让共用组件画：PCAP 分析（ScTsharkPcapAnalysis.vue）看的是同一类数据，
  两页各自写五个方向就是十套画布，键盘可达性与空态引导会立刻分叉。共用组件只负责
  「怎么把会话摆开」，这一页仍然独占自己的页头动作与详情弹层。

  报文右键「查看生命周期」仍在详情弹层的报文页里：按四元组还原整条 TCP 流
  （HTTP / TLS / SSH 等 TCP 上的协议同样支持），时序图 + ReTable 明细。
-->
<template>
  <div class="tshark-page">
    <TsharkSessionStage
      :rows="sessions"
      page-key="monitor.tshark-capture"
      title="抓包分析"
      desc="在选定网卡上实时抓包并按会话入库；报文 / 统计 / 会话流在详情里看。"
      noun="抓包会话"
      can-stop
      search-placeholder="搜索会话名 / 网卡"
      empty-text="还没有抓包会话"
      empty-hint="点右上角「新增会话」选择网卡开始抓包。"
      :loading="loadingSessions"
      :iface-label="ifaceLabel"
      @open="openDetail"
      @download="downloadPcap"
      @stop="stopSession"
      @remove="deleteSession"
      @refresh="refresh"
    >
      <template #head-actions>
        <span class="tshark-status" :class="tsharkOk ? 'tshark-status--ok' : 'tshark-status--bad'">
          <span class="tshark-status__dot" />
          <span>{{ tsharkOk ? 'TShark 可用' : 'TShark 未就绪' }}</span>
        </span>
        <ReButton type="primary" icon="Plus" :disabled="!tsharkOk" @click="createVisible = true">
          新增会话
        </ReButton>
      </template>
    </TsharkSessionStage>

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
import { useTshark } from './useTshark'
import TsharkSessionStage from './TsharkSessionStage.vue'
import ScTsharkCreateDialog from './ScTsharkCreateDialog.vue'
import ScTsharkSessionDetailDialog from './ScTsharkSessionDetailDialog.vue'
import ScTsharkPacketPanel from './ScTsharkPacketPanel.vue'
import ScTsharkStatsPanel from './ScTsharkStatsPanel.vue'
import ScTsharkFlowPanel from './ScTsharkFlowPanel.vue'
import ScTsharkInsightsPanel from './ScTsharkInsightsPanel.vue'
import ScTsharkPacketDetail from './ScTsharkPacketDetail.vue'
import ScTsharkLifecycleDialog from './ScTsharkLifecycleDialog.vue'
import type { TsharkFlow, TsharkPacket, TsharkTabKey } from './types'
import './tshark.css'

/**
 * 列表页不自动选中会话：详情是用户点「报文 / 统计 / 会话流」才打开的，
 * 自动选中会让 SSE 在没人看的时候也一直连着。
 */
const {
  tsharkOk, ifaceOptions, iface, filter, filterType, captureName, count, timeout, maxSizeMb, starting,
  loadingSessions, sessions,
  activeSessionId, activeSession,
  loadingPackets, packets, packetPage, packetTotal, packetFilter, filterError, packetPageSize,
  protoStats, topFlows, statsVersion, liveConnected, liveCount, loadingStats,
  timeline, timelineBucket, anomalies,
  detailOpen, packetDetail,
  init, loadPackets, applyPacketFilter, selectSession, clearActiveSession,
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

/**
 * 新增会话：启动成功才关弹层；失败（过滤器语法错等）留在弹层里改参数。
 */
async function onCreate() {
  const ok = await startCapture()
  if (ok) createVisible.value = false
}

/**
 * 打开某会话的详情，并默认停在用户点的那一页。
 *
 * <p>入参是 id 而不是整行：画布只认识行 id，而选中会话这件事本来就只要 id ——
 * `selectSession` 会去会话列表里取最新那一份，避免拿弹层里过期的行对象。</p>
 *
 * @param id  会话 id
 * @param tab 目标标签页
 */
function openDetail(id: number, tab: TsharkTabKey) {
  detailTab.value = tab
  detailVisible.value = true
  selectSession(id)
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
