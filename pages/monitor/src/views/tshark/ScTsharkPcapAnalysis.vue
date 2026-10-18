<!--
  PCAP 分析（导入 pcap → 解析入库 → 下载原件）

  形态与「抓包分析」不同，这是刻意的：抓包分析的主数据是**报文流水**（边抓边来、宽而扁），
  所以它进来就是四个标签页；PCAP 分析的主数据是**一份份文件** —— 用户来到这一页的第一个问题
  永远是「我传的那份解出来了没」，而不是「第 3 个字节是什么」。

  所以这一页做成「目录 → 详情」两级，同一时刻只出现一级：

    ① 目录（默认）：导入条 + 导入记录表。整页只有这一张表，不摆任何别的标签 ——
       一个还没有文件的页面如果铺开「报文 / 统计 / 会话流」三个空标签，只会稀释
       「先导入一个文件」这个当下唯一的动作。
    ② 详情：点某一行（整行可点）后整块换成这份文件的报文 / 统计 / 会话流。
       头部条负责交代「这是哪一份、解到哪了、原件能不能下」，「返回」回到目录，
       并保留目录上的搜索词与页码（都在 useTshark 里，清掉也是白清）。

  为什么不是「上半屏列表 + 下半屏详情」：导入记录的列很宽（文件名 / 状态 / 报文数 /
  时间范围 / 时长 / 操作），压到左栏会折行，压到上半屏则详情只剩半屏高度 ——
  而报文表恰恰是最吃高度的那个。而且「点进去看」本来就符合看文件的心智：
  挑文件是低频动作，进去看报文才是高频动作。

  数据层复用 useTshark（source=import 只列导入的会话；autoSelectFirst=false 让目录页
  不替用户挑一条），报文 / 统计 / 会话流面板整块复用 —— 两边看数的方式完全一样。
-->
<template>
  <!-- 拖拽落点放在整页：用户从资源管理器拖文件过来时，鼠标未必正停在按钮上 -->
  <div class="tshark-page" @dragover.prevent @drop.prevent="onDrop">
    <!-- ==================== ① 目录：导入记录 ==================== -->
    <template v-if="activeSessionId == null">
      <div class="tshark-bar">
        <div class="tshark-bar__group">
          <span class="tshark-status" :class="tsharkOk ? 'tshark-status--ok' : 'tshark-status--bad'">
            <span class="tshark-status__dot"></span>
            <span>{{ tsharkOk ? 'TShark 可用' : 'TShark 未就绪' }}</span>
          </span>
          <span class="tshark-dim pcap-page__hint">点任意一行查看它的报文 / 统计 / 会话流</span>
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
          @select="openSession"
          @download="downloadPcap"
          @remove="deleteSession"
          @refresh="loadSessions(false)"
        />
      </div>
    </template>

    <!-- ==================== ② 详情：某一份文件的报文 ==================== -->
    <template v-else>
      <div class="tshark-bar pcap-detail-bar">
        <ReButton class="pcap-back" link type="primary" icon="ArrowLeft" show-text @click="backToList">
          返回导入记录
        </ReButton>

        <span class="tshark-bar__sep"></span>

        <div class="pcap-detail__title">
          <span class="pcap-detail__name" :title="detailName">{{ detailName }}</span>
          <ReTag :type="detailStatus.type" effect="plain">{{ detailStatus.text }}</ReTag>
          <span v-if="parsing" class="tshark-dim pcap-detail__parsing">报文数会陆续增长</span>
        </div>

        <span class="tshark-bar__spacer"></span>

        <div class="pcap-detail__meta">
          <span>{{ packetTotal }} 个报文</span>
          <span class="pcap-detail__dot">·</span>
          <span>{{ detailRange }}</span>
          <span class="pcap-detail__dot">·</span>
          <span>{{ detailDuration }}</span>
        </div>

        <ReButton
          icon="Download"
          show-text
          :disabled="packetTotal === 0"
          tip="下载原始 pcap（用 Wireshark 打开）"
          @click="onDownload"
        >
          下载原件
        </ReButton>
      </div>

      <div class="tshark-work">
        <ReTab
          variant="underline"
          :tabs="detailTabs"
          :model-value="activeTab"
          stretch
          @update:model-value="onTabChange"
        >
          <!-- 报文 -->
          <template #packet>
            <ScTsharkPacketPanel
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
          </template>

          <!-- 统计 -->
          <template #stats>
            <ScTsharkStatsPanel
              :proto-stats="protoStats"
              :top-flows="topFlows"
              :packet-total="packetTotal"
              :version="statsVersion"
              @pick-protocol="onPickProtocol"
            />
          </template>

          <!-- 会话流 -->
          <template #flow>
            <ScTsharkFlowPanel
              :top-flows="topFlows"
              :packet-total="packetTotal"
              :version="statsVersion"
            />
          </template>
        </ReTab>
      </div>
    </template>

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
import { sessionName, statusOf, timeRange, fmtDuration, fmtSize } from './tsharkFormat'
import type { TsharkTabKey } from './types'
import './tshark.css'

/**
 * 上传上限，必须与后端 spring.servlet.multipart.max-file-size 一致。
 *
 * <p>前端这一道是「提前拦住」：超限时后端会在进 Controller 之前就抛
 * MaxUploadSizeExceededException，前端只看到 500，看不出是文件太大了。</p>
 */
const MAX_UPLOAD_BYTES = 2048 * 1024 * 1024

/**
 * source=import 只列导入的会话（实时抓包的历史留在「抓包分析」页，两边各看各的）；
 * autoSelectFirst=false 是为了让 activeSessionId 的 null/非 null 直接就是
 * 「目录 / 详情」这一级状态 —— 不另设 showDetail 标志，少一处能与真实选中项不一致的状态。
 */
const {
  tsharkOk, importing,
  loadingSessions, sessions, sessionBackendTotal, sessionKeyword,
  sessionPage, activeSessionId, activeSession, filteredSessions, pagedSessions,
  runningCount: parsingCount, sessionPageSize,
  loadingPackets, packets, packetPage, packetTotal, packetKeyword,
  packetPageSize, protoStats, topFlows, statsVersion,
  detailOpen, packetDetail,
  init, loadSessions, selectSession, setSessionKeyword,
  clearActiveSession, loadPackets, setPacketKeyword, filterByProtocol,
  exportCsv, downloadPcap, deleteSession, openPacketDetail, importPcap,
} = useTshark({ source: 'import', autoSelectFirst: false })

/**
 * 详情里当前停在哪个标签。
 *
 * <p>只在详情里有意义（目录不渲染标签页），但状态放在页面上：从统计点某个协议要跳到报文，
 * 返回目录再进来也该从「报文」开始（用户点进来就是为了看报文）。</p>
 */
const activeTab = ref<TsharkTabKey>('packet')

const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const importName = ref('')

const detailTabs = computed(() => [
  { name: 'packet', label: '报文', icon: 'Tickets', badge: packetTotal.value || null },
  { name: 'stats', label: '统计', icon: 'PieChart' },
  { name: 'flow', label: '会话流', icon: 'TrendCharts' },
])

// ==================== 详情头部条 ====================
// 选中项可能在翻查期间被别处删掉（后端推送刷新后 activeSession 会是 null），
// 所以每个取值都给一条兜底文案，不让头部突然空掉。
const detailName = computed(() =>
  activeSession.value ? sessionName(activeSession.value) : `导入 ${activeSessionId.value}`)
const detailStatus = computed(() =>
  activeSession.value ? statusOf(activeSession.value) : { type: 'info' as const, text: '—' })
const detailRange = computed(() =>
  activeSession.value ? timeRange(activeSession.value) : '—')
const detailDuration = computed(() => fmtDuration(activeSession.value?.captureDuration))
const parsing = computed(() => activeSession.value?.captureStatus === 1)

const packetEmptyText = computed(() =>
  packetKeyword.value.trim() ? '没有匹配的报文，试试清空关键字' : '这条导入记录还没有解析出报文')

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
  // autoSelect=false：上传成功停在目录上，看新那行的报文数往上涨；不跳进还空着的报文页
  const ok = await importPcap(f, importName.value, false)
  if (!ok) return
  // 清掉已选文件：上传成功后它会占着提示位，而下一次导入必然换文件
  file.value = null
  importName.value = ''
}

/** 进详情：目录里点某一行（或那一行的「查看」），一律从「报文」开始 */
function openSession(id: number) {
  activeTab.value = 'packet'
  selectSession(id)
}

/** 回目录：清掉选中项即可（模板按 activeSessionId 两级切换） */
function backToList() {
  clearActiveSession()
  activeTab.value = 'packet'
}

/** 下载原件：只有真选中了一条才可用（模板 v-else 分支挡不住 TS 的 null 收窄） */
function onDownload() {
  const id = activeSessionId.value
  if (id == null) return
  downloadPcap(id, detailName.value)
}

function onTabChange(name: string) {
  activeTab.value = (name || 'packet') as TsharkTabKey
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

onMounted(init)
</script>
