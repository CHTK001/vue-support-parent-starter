<!--
  抓包工作台（TShark）

  布局：全宽标签工作台 —— 顶部一条抓包条，下面四个标签页（报文 / 会话 / 统计 / 会话流），
  报文表吃满整幅宽度，报文详情走右侧抽屉。

  为什么是这个形状：抓包这个场景的主数据是报文列表，宽而扁；原来的「300px 会话侧栏 +
  右侧主区」在 1280 宽的屏幕上要切掉近四分之一给会话栏，而会话栏大部分时间是空的。
  会话改成标签页后，报文列（尤其是「源 / 目的 / 摘要」）拿到全部宽度；需要挑会话时切到
  「会话」标签，或直接用抓包条上的会话切换器。

  数据与副作用都在 useTshark 里，这里只负责排布与把用户操作接回去。
-->
<template>
  <div class="tshark-page">
    <ScTsharkCaptureBar
      :tshark-ok="tsharkOk"
      :sessions="sessions"
      :active-session-id="activeSessionId"
      :active-session="activeSession"
      :live-connected="liveConnected"
      :live-count="liveCount"
      :iface-options="ifaceOptions"
      :iface="iface"
      :filter="filter"
      :count="count"
      :timeout="timeout"
      :starting="starting"
      @update:iface="setIface"
      @update:filter="setFilter"
      @update:count="setCount"
      @update:timeout="setTimeoutValue"
      @select-session="onSelectSession"
      @start="startCapture"
      @refresh="refresh"
    />

    <div class="tshark-work">
      <ReTab
        variant="underline"
        :tabs="tabs"
        :model-value="activeTab"
        stretch
        @update:model-value="onTabChange"
      >
        <!-- 报文 -->
        <template #packet>
          <ScTsharkPacketPanel
            v-if="activeSessionId != null"
            :packets="packets"
            :loading="loadingPackets"
            :page="packetPage"
            :page-size="packetPageSize"
            :total="packetTotal"
            :keyword="packetKeyword"
            :empty-text="packetEmptyText"
            @update:keyword="setPacketKeyword"
            @page-change="loadPackets"
            @open-detail="openPacketDetail"
            @export="exportCsv"
          />
          <div v-else class="tshark-panel__empty">
            <div class="tshark-panel__empty-icon"><ReIcon name="Monitor" :size="36" /></div>
            <ReEmpty description="先选择一个抓包会话，或在上方选好网卡后点「开始抓包」" layout="modern" />
          </div>
        </template>

        <!-- 会话 -->
        <template #session>
          <ScTsharkSessionPanel
            :sessions="pagedSessions"
            :loading="loadingSessions"
            :keyword="sessionKeyword"
            :filter="sessionFilter"
            :page="sessionPage"
            :page-size="sessionPageSize"
            :total="filteredSessions.length"
            :backend-total="sessionBackendTotal"
            :loaded-count="sessions.length"
            :running-count="runningCount"
            :active-id="activeSessionId"
            @update:keyword="setSessionKeyword"
            @update:filter="setSessionFilter"
            @page-change="setSessionPage"
            @select="selectSession"
            @stop="stopSession"
            @download="downloadPcap"
            @remove="deleteSession"
            @refresh="loadSessions(false)"
          />
        </template>

        <!-- 统计 -->
        <template #stats>
          <ScTsharkStatsPanel
            v-if="activeSessionId != null"
            :proto-stats="protoStats"
            :top-flows="topFlows"
            :packet-total="packetTotal"
            :version="statsVersion"
            @pick-protocol="onPickProtocol"
          />
          <div v-else class="tshark-panel__empty">
            <div class="tshark-panel__empty-icon"><ReIcon name="PieChart" :size="36" /></div>
            <ReEmpty description="选择一个抓包会话后查看协议统计" layout="modern" />
          </div>
        </template>

        <!-- 会话流 -->
        <template #flow>
          <ScTsharkFlowPanel
            v-if="activeSessionId != null"
            :top-flows="topFlows"
            :packet-total="packetTotal"
            :version="statsVersion"
          />
          <div v-else class="tshark-panel__empty">
            <div class="tshark-panel__empty-icon"><ReIcon name="TrendCharts" :size="36" /></div>
            <ReEmpty description="选择一个抓包会话后查看会话流" layout="modern" />
          </div>
        </template>
      </ReTab>
    </div>

    <ScTsharkPacketDetail v-model="detailOpen" :packet="packetDetail" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTshark } from './useTshark'
import ScTsharkCaptureBar from './ScTsharkCaptureBar.vue'
import ScTsharkSessionPanel from './ScTsharkSessionPanel.vue'
import ScTsharkPacketPanel from './ScTsharkPacketPanel.vue'
import ScTsharkStatsPanel from './ScTsharkStatsPanel.vue'
import ScTsharkFlowPanel from './ScTsharkFlowPanel.vue'
import ScTsharkPacketDetail from './ScTsharkPacketDetail.vue'
import type { TsharkTabKey } from './types'
import './tshark.css'

const {
  tsharkOk, ifaceOptions, iface, filter, count, timeout, starting,
  loadingSessions, sessions, sessionBackendTotal, sessionKeyword, sessionFilter,
  sessionPage, activeSessionId, activeSession, filteredSessions, pagedSessions,
  runningCount, sessionPageSize, loadingPackets, packets, packetPage, packetTotal, packetKeyword,
  packetPageSize, protoStats, topFlows, statsVersion,
  detailOpen, packetDetail, liveCount, liveConnected,
  init, loadSessions, selectSession, setSessionKeyword, setSessionFilter,
  clearActiveSession, loadPackets, setPacketKeyword, filterByProtocol, refresh,
  exportCsv, downloadPcap, startCapture, stopSession, deleteSession, openPacketDetail,
} = useTshark({ source: 'live' })

const activeTab = ref<TsharkTabKey>('packet')

const tabs = computed(() => [
  { name: 'packet', label: '报文', icon: 'Tickets', badge: packetTotal.value || null },
  { name: 'session', label: '会话', icon: 'Folder', badge: sessions.value.length || null },
  { name: 'stats', label: '统计', icon: 'PieChart' },
  { name: 'flow', label: '会话流', icon: 'TrendCharts' },
])

const packetEmptyText = computed(() =>
  packetKeyword.value.trim() ? '没有匹配的数据包，试试清空关键字' : '该会话还没有抓到的数据包')

function onTabChange(name: string) {
  activeTab.value = (name || 'packet') as TsharkTabKey
}

/*
 * 抓包参数与会话页码的写入口。
 *
 * <p>不在模板里直接写 `v => (count = v ?? 0)`：`count` 是从 useTshark() 解构出来的
 * ref，模板编译对这类「来源不可静态判定」的绑定会生成 isRef 三元判断，
 * 写成显式函数后语义一目了然，`?? 0` 这类归一化也只在一处。</p>
 */
function setIface(v: string) {
  iface.value = v
}
function setFilter(v: string) {
  filter.value = v
}
function setCount(v: number | undefined) {
  count.value = v ?? 0
}
function setTimeoutValue(v: number | undefined) {
  timeout.value = v ?? 0
}
function setSessionPage(p: number) {
  sessionPage.value = p
}

/** 抓包条上的会话切换器：清空选择时释放详情区，而不是继续显示上一个会话的数据 */
function onSelectSession(id: number | null) {
  if (id == null) clearActiveSession()
  else selectSession(id)
}

/** 统计面板点协议：填进报文关键字并切过去，省掉「记住协议名 → 回头手打」那一步 */
function onPickProtocol(protocol: string) {
  filterByProtocol(protocol)
  activeTab.value = 'packet'
}

onMounted(init)
</script>
