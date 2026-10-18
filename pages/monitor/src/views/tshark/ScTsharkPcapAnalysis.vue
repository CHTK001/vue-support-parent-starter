<!--
  PCAP 分析（导入 pcap → 解析入库 → 下载原件）

  与「抓包分析」同构：顶部一条工具条，下面四个标签页（报文 / 导入记录 / 统计 / 会话流），
  报文详情走右侧抽屉。区别只在「数据从哪来」：那边从网卡抓，这边从文件读。

  为什么做成独立页面而不是在抓包页加一个「导入」按钮：
  两者的入口动作、列表语义、状态含义都不同（选网卡 + 开始抓包 + 抓包中 vs 选文件 + 上传解析 +
  解析中），塞进同一条工具条会让两边都变挤；而它们**下游**的看数方式 —— 逐包下钻、协议分布、
  Top 流、原件下载 —— 完全一样。所以下游面板整块复用，只把「入口 + 列表」换掉：
  数据侧复用同一个 useTshark（只是把 source 传成 import），列表换成 ScTsharkImportPanel。

  后端同样是一张会话表（ms_tshark_session，source=import）+ 一张报文表，文件落盘、库只做索引，
  所以「原件下载」直接复用 /sessions/{id}/pcap —— 存进来什么样，下载下去就什么样。
-->
<template>
  <!-- 拖拽落点放在整页：用户从资源管理器拖文件过来时，鼠标未必正停在按钮上 -->
  <div class="tshark-page" @dragover.prevent @drop.prevent="onDrop">
    <div class="tshark-bar">
      <div class="tshark-bar__group">
        <span class="tshark-status" :class="tsharkOk ? 'tshark-status--ok' : 'tshark-status--bad'">
          <span class="tshark-status__dot"></span>
          <span>{{ tsharkOk ? 'TShark 可用' : 'TShark 未就绪' }}</span>
        </span>

        <ReSelect
          class="tshark-bar__session"
          :model-value="activeSessionId"
          :data="sessionOptions"
          placeholder="选择导入记录"
          filterable
          clearable
          @update:model-value="onSelectSession"
        />

        <ReTag v-if="activeSession" :type="activeSession.captureStatus === 1 ? 'warning' : 'info'" effect="light">
          {{ activeSession.captureStatus === 1 ? '解析中' : '已解析' }}
        </ReTag>

        <ReButton icon="Refresh" layout="square" tip="刷新导入记录与报文" @click="refresh" />
      </div>

      <span class="tshark-bar__spacer"></span>
      <span class="tshark-bar__sep"></span>

      <div class="tshark-bar__group">
        <ReInput
          class="tshark-bar__bpf"
          :model-value="importName"
          placeholder="会话名（可空，默认用文件名）"
          clearable
          @update:model-value="onName"
        />
        <input
          ref="fileInput"
          class="pcap-file-input"
          type="file"
          accept=".pcap,.pcapng,.cap,.pcapng.gz,.pcap.gz"
          @change="onPickFile"
        />
        <ReButton icon="FolderOpened" show-text @click="chooseFile">选择文件</ReButton>
        <span class="tshark-dim pcap-file-hint" :title="file?.name || ''">{{ fileText }}</span>
        <ReButton
          type="primary"
          icon="Upload"
          show-text
          :loading="importing"
          :disabled="!canImport"
          :tip="importTip"
          @click="onImport"
        >
          导入并解析
        </ReButton>
      </div>
    </div>

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
            <div class="tshark-panel__empty-icon"><ReIcon name="Files" :size="36" /></div>
            <ReEmpty description="先导入一个 pcap，或在上方选中一条导入记录" layout="modern" />
          </div>
        </template>

        <!-- 导入记录 -->
        <template #import>
          <ScTsharkImportPanel
            :sessions="pagedSessions"
            :loading="loadingSessions"
            :keyword="sessionKeyword"
            :page="sessionPage"
            :page-size="sessionPageSize"
            :total="filteredSessions.length"
            :backend-total="sessionBackendTotal"
            :loaded-count="sessions.length"
            :parsing-count="parsingCount"
            :active-id="activeSessionId"
            @update:keyword="setSessionKeyword"
            @page-change="setSessionPage"
            @select="selectSession"
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
            <ReEmpty description="选择一条导入记录后查看协议统计" layout="modern" />
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
            <ReEmpty description="选择一条导入记录后查看会话流" layout="modern" />
          </div>
        </template>
      </ReTab>
    </div>

    <ScTsharkPacketDetail v-model="detailOpen" :packet="packetDetail" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { message } from '@repo/core'
import { useTshark } from './useTshark'
import ScTsharkImportPanel from './ScTsharkImportPanel.vue'
import ScTsharkPacketPanel from './ScTsharkPacketPanel.vue'
import ScTsharkStatsPanel from './ScTsharkStatsPanel.vue'
import ScTsharkFlowPanel from './ScTsharkFlowPanel.vue'
import ScTsharkPacketDetail from './ScTsharkPacketDetail.vue'
import type { TsharkTabKey } from './types'
import './tshark.css'

/**
 * 上传上限，必须与后端 spring.servlet.multipart.max-file-size 一致。
 *
 * <p>前端这一道是「提前拦住」：超限时后端会在进 Controller 之前就抛
 * MaxUploadSizeExceededException，前端只看到 500，看不出是文件太大了。</p>
 */
const MAX_UPLOAD_BYTES = 2048 * 1024 * 1024

// source=import：只列导入的会话。实时抓包的历史留在「抓包分析」页，
// 两边各看各的，不会混在一张列表里
const {
  tsharkOk, importing,
  loadingSessions, sessions, sessionBackendTotal, sessionKeyword,
  sessionPage, activeSessionId, activeSession, filteredSessions, pagedSessions,
  runningCount: parsingCount, sessionPageSize,
  loadingPackets, packets, packetPage, packetTotal, packetKeyword,
  packetPageSize, protoStats, topFlows, statsVersion,
  detailOpen, packetDetail,
  init, loadSessions, selectSession, setSessionKeyword,
  clearActiveSession, loadPackets, setPacketKeyword, filterByProtocol, refresh,
  exportCsv, downloadPcap, deleteSession, openPacketDetail, importPcap,
} = useTshark({ source: 'import' })

/** 默认停在「导入记录」：这一页才是本页的入口（先有文件才有报文） */
const activeTab = ref<TsharkTabKey>('import')

const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const importName = ref('')

const tabs = computed(() => [
  { name: 'packet', label: '报文', icon: 'Tickets', badge: packetTotal.value || null },
  { name: 'import', label: '导入记录', icon: 'Files', badge: sessions.value.length || null },
  { name: 'stats', label: '统计', icon: 'PieChart' },
  { name: 'flow', label: '会话流', icon: 'TrendCharts' },
])

const packetEmptyText = computed(() =>
  packetKeyword.value.trim() ? '没有匹配的报文，试试清空关键字' : '这条导入记录还没有解析出报文')

const sessionOptions = computed(() => sessions.value.map(s => ({
  label: `${s.sessionName || `导入 ${s.id}`} · ${s.packetCount ?? 0} 包`,
  value: s.id,
})))

const fileText = computed(() =>
  file.value ? `${file.value.name}（${fmtSize(file.value.size)}）` : '未选择文件，也可直接拖入')

/** tshark 是解析器：没有它，文件传上去也解析不出报文，所以一并卡住导入按钮 */
const canImport = computed(() => !!file.value && tsharkOk.value && !importing.value)
const importTip = computed(() => {
  if (!tsharkOk.value) return 'tshark 未就绪，无法解析 pcap'
  if (!file.value) return '请先选择 pcap 文件'
  return '上传后在后台整份解析，报文数会陆续增长'
})

function chooseFile() {
  fileInput.value?.click()
}

function onPickFile(e: Event) {
  const input = e.target as HTMLInputElement
  const picked = input.files?.[0] ?? null
  if (picked) acceptFile(picked)
  // 清空 value：同一个文件连选两次不会再触发 change，用户会以为「点了没反应」
  input.value = ''
}

function onDrop(e: DragEvent) {
  const dropped = e.dataTransfer?.files?.[0] ?? null
  if (dropped) acceptFile(dropped)
}

function acceptFile(f: File) {
  if (f.size === 0) {
    message.warning('这个文件是空的，换一个再试')
    return
  }
  if (f.size > MAX_UPLOAD_BYTES) {
    message.warning(`文件 ${fmtSize(f.size)}，超过 2GB 上传上限`)
    return
  }
  file.value = f
}

async function onImport() {
  const f = file.value
  if (!f) {
    message.warning('请先选择 pcap 文件')
    return
  }
  const ok = await importPcap(f, importName.value)
  if (!ok) return
  // 清掉已选文件：上传成功后它会占着提示位，而下一次导入必然换文件
  file.value = null
  importName.value = ''
  // 留在「导入记录」看解析进度（报文数在涨），而不是切到还空着的报文页
  activeTab.value = 'import'
}

function onTabChange(name: string) {
  activeTab.value = (name || 'import') as TsharkTabKey
}

function onSelectSession(id: number | null) {
  if (id == null) clearActiveSession()
  else selectSession(id)
}

function onName(v: unknown) {
  importName.value = v === null || v === undefined ? '' : String(v)
}

function setSessionPage(p: number) {
  sessionPage.value = p
}

/** 统计面板点协议：填进报文关键字并切过去，省掉「记住协议名 → 回头手打」那一步 */
function onPickProtocol(protocol: string) {
  filterByProtocol(protocol)
  activeTab.value = 'packet'
}

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

onMounted(init)
</script>
