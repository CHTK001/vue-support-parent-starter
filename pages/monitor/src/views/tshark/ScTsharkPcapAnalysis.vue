<!--
  PCAP 分析（导入 pcap → 解析入库 → 下载原件）

  形态与「抓包分析」不同，这是刻意的：抓包分析的主数据是**报文流水**（边抓边来、宽而扁）；
  PCAP 分析的主数据是**一份份文件** —— 用户来到这一页的第一个问题永远是
  「我传的那份解出来了没」，而不是「第 3 个字节是什么」。

  所以这一页做成「目录 → 详情」两级，同一时刻只出现一级：

    ① 目录（默认）：控制栏 + 导入记录列表。整页只有这一块列表，不摆任何别的标签 ——
       一个还没有文件的页面如果铺开「报文 / 统计 / 会话流」三个空标签，只会稀释
       「先导入一个文件」这个当下唯一的动作。列表本身交给 TsharkSessionStage
       （与抓包分析共用的节奏视图），这一页只提供自己的动作按钮（选文件 / 导入），
       且与搜索框同处控制栏一张卡 —— 不另占一行页头。
       导入不再单独问「会话名」：留空即由后端回退成原始文件名，多问一步只是拦路。
    ② 详情：点某一行（整行可点）后整块换成这份文件的报文 / 统计 / 会话流。
       头部条负责交代「这是哪一份、解到哪了、原件能不能下」，「返回」回到目录，
       并保留目录上的搜索词（词放在页面上，见 script 里的 listKeyword）。

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
      <TsharkSessionStage
        :rows="sessions"
        title="PCAP 分析"
        noun="导入记录"
        running-label="解析中"
        search-placeholder="搜索文件名 / 会话名"
        v-model:keyword="listKeyword"
        empty-text="还没有导入过 pcap"
        empty-hint="点搜索栏里的「选择文件」，或直接把文件拖到页面上。"
        :loading="loadingSessions"
        :iface-label="ifaceLabel"
        @open="openSessionTab"
        @download="downloadPcap"
        @remove="deleteSession"
        @refresh="loadSessions(false)"
      >
        <template #bar-actions>
          <button
            type="button"
            class="tshark-status"
            :class="tsharkOk ? 'tshark-status--ok' : 'tshark-status--bad'"
            :title="runtime?.message || '查看 TShark 安装状态'"
            @click="installVisible = true"
          >
            <span class="tshark-status__dot" />
            <span>{{ statusText }}</span>
          </button>

          <input
            ref="fileInput"
            class="pcap-file-input"
            type="file"
            accept=".pcap,.pcapng,.cap,.pcapng.gz,.pcap.gz"
            @change="onPickFile"
          />
          <ReButton icon="FolderOpened" show-text @click="chooseFile">选择文件</ReButton>

          <!-- 已选文件：只在选了之后出现（空态不占位），点 × 取消选择 -->
          <span v-if="file" class="pcap-file-chip" :title="`${file.name}（${fmtSize(file.size)}）`">
            <span class="pcap-file-chip__name">{{ file.name }}</span>
            <button type="button" class="pcap-file-chip__x" title="取消选择" @click="clearFile">
              <ReIcon name="Close" />
            </button>
          </span>

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
        </template>

        <!-- 加载范围说明：列表只拉最近若干条，搜索范围要交代清楚 -->
        <template v-if="loadedNote" #alerts>
          <p class="pcap-note">{{ loadedNote }}</p>
        </template>
      </TsharkSessionStage>
    </template>

    <!-- ==================== ② 详情：某一份文件的报文 ==================== -->
    <template v-else>
      <div class="tshark-bar pcap-detail-bar">
        <ReButton class="pcap-back" text type="primary" icon="ArrowLeft" show-text @click="backToList">
          返回导入记录
        </ReButton>

        <span class="tshark-bar__sep" />

        <div class="pcap-detail__title">
          <span class="pcap-detail__name" :title="detailName">{{ detailName }}</span>
          <ReTag :type="detailStatus.type" effect="plain">{{ detailStatus.text }}</ReTag>
          <span v-if="parsing" class="tshark-dim pcap-detail__parsing">报文数会陆续增长</span>
        </div>

        <span class="tshark-bar__spacer" />

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
        <ScTsharkFilterBar
          :model-value="packetFilter"
          :error="filterError"
          @apply="applyPacketFilter"
        />
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
              :empty-text="packetEmptyText"
              @page-change="loadPackets"
              @open-detail="openPacketDetail"
              @open-lifecycle="openLifecycle"
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
              :timeline="timeline"
              :bucket="timelineBucket"
              @pick-protocol="onPickProtocol"
              @timeline-bucket="loadTimeline"
            />
          </template>

          <!-- 会话流 -->
          <template #flow>
            <ScTsharkFlowPanel
              :top-flows="topFlows"
              :packet-total="packetTotal"
              :version="statsVersion"
              @pick-flow="onPickFlow"
            />
          </template>

          <!-- 异常诊断 -->
          <template #insight>
            <ScTsharkInsightsPanel
              :anomalies="anomalies"
              :filtered="!!packetFilter.trim()"
              :loading="loadingStats"
              @pick-anomaly="onPickAnomaly"
            />
          </template>
        </ReTab>
      </div>
    </template>

    <ScTsharkPacketDetail v-model="detailOpen" :packet="packetDetail" :http-transaction="packetHttpTx" />
    <ScTsharkLifecycleDialog
      v-model="lifecycleVisible"
      :packet="lifecyclePacket"
      :session-id="activeSessionId"
      @open-detail="openPacketDetailById"
    />

    <!-- 安装进度：与「抓包分析」页共用同一个组件与同一份状态 -->
    <ScTsharkInstallDialog
      v-model="installVisible"
      :status="runtime"
      @retry="installNow"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { message } from '@repo/core'
import { useTshark } from './useTshark'
import TsharkSessionStage from './TsharkSessionStage.vue'
import ScTsharkFilterBar from './ScTsharkFilterBar.vue'
import ScTsharkPacketPanel from './ScTsharkPacketPanel.vue'
import ScTsharkStatsPanel from './ScTsharkStatsPanel.vue'
import ScTsharkFlowPanel from './ScTsharkFlowPanel.vue'
import ScTsharkInsightsPanel from './ScTsharkInsightsPanel.vue'
import ScTsharkPacketDetail from './ScTsharkPacketDetail.vue'
import ScTsharkLifecycleDialog from './ScTsharkLifecycleDialog.vue'
import ScTsharkInstallDialog from './ScTsharkInstallDialog.vue'
import { sessionName, statusOf, timeRange, fmtDuration, fmtSize } from './tsharkFormat'
import type { TsharkFlow, TsharkPacket, TsharkTabKey } from './types'
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
  tsharkOk, runtime, installActive, statusText, installNow, ifaceOptions, importing,
  loadingSessions, sessions, sessionBackendTotal,
  activeSessionId, activeSession,
  runningCount: parsingCount,
  loadingPackets, packets, packetPage, packetTotal, packetFilter, filterError,
  packetPageSize, protoStats, topFlows, statsVersion, loadingStats,
  timeline, timelineBucket, anomalies,
  detailOpen, packetDetail, packetHttpTx,
  init, loadSessions, selectSession,
  clearActiveSession, loadPackets, applyPacketFilter, filterByProtocol, filterByFlow,
  loadTimeline,
  exportCsv, downloadPcap, deleteSession, openPacketDetail, openPacketDetailById, importPcap,
} = useTshark({ source: 'import', autoSelectFirst: false })

/** 安装进度框：两个页面共用同一个组件与同一份状态 */
const installVisible = ref(false)
const installDismissed = ref(false)
watch(installActive, (active) => {
  if (active && !installDismissed.value) installVisible.value = true
}, { immediate: true })
watch(installVisible, (visible) => {
  if (!visible && installActive.value) installDismissed.value = true
})

/** 生命周期弹层：右键报文触发，与「抓包分析」页同一套组件 */
const lifecycleVisible = ref(false)
const lifecyclePacket = ref<TsharkPacket | null>(null)

function openLifecycle(row: TsharkPacket) {
  lifecyclePacket.value = row
  lifecycleVisible.value = true
}

/**
 * 详情里当前停在哪个标签。
 *
 * <p>只在详情里有意义（目录不渲染标签页），但状态放在页面上：从统计点某个协议要跳到报文，
 * 返回目录再进来也该从「报文」开始（用户点进来就是为了看报文）。</p>
 */
const activeTab = ref<TsharkTabKey>('packet')

const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)

/**
 * 目录列表的搜索词。
 *
 * <p>放在页面上而不是列表组件里：进详情时列表组件会整个销毁，词若只活在组件内部，
 * 返回目录就丢了 —— 而用户刚才是「搜到那一份、点进去看」，回来还得再搜一遍。</p>
 */
const listKeyword = ref('')

const detailTabs = computed(() => [
  { name: 'packet', label: '报文', icon: 'Tickets', badge: packetTotal.value || null },
  { name: 'stats', label: '统计', icon: 'PieChart' },
  { name: 'flow', label: '会话流', icon: 'TrendCharts' },
  { name: 'insight', label: '诊断', icon: 'FirstAidKit' },
])

// ==================== 目录：加载范围说明 ====================

/**
 * 列表只拉最近若干条（SESSION_FETCH_SIZE），所以后端总数更大时要说明白 ——
 * 否则用户搜一个半年期的文件名搜不到，会以为是搜索坏了。
 */
const loadedNote = computed(() => {
  const loaded = sessions.value.length
  const total = Number(sessionBackendTotal.value ?? 0)
  const capped = total > loaded ? `（已加载 ${loaded}/${total}）` : ''
  const parsing = parsingCount.value > 0 ? `，${parsingCount.value} 份解析中` : ''
  if (!capped && !parsing) return ''
  return `搜索只在这 ${loaded} 条内进行${capped}${parsing}`
})

/**
 * 网卡显示名：导入记录一般没有网卡（报文来自文件），有值时用友好名，没有给破折号。
 *
 * @param value 网卡原始值
 */
function ifaceLabel(value?: string | null): string {
  if (!value) return '—'
  const hit = ifaceOptions.value.find(o => o.value === value)
  if (hit) return hit.label
  return value
}

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
  packetFilter.value.trim() ? '没有匹配的报文，试试清除或修改过滤' : '这条导入记录还没有解析出报文')

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

/** 取消已选文件：导入按钮随之回到禁用态 */
function clearFile() {
  file.value = null
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
  // 会话名留空：后端回退用原始文件名，页面不再多问一步
  // autoSelect=false：上传成功停在目录上，看新那行的报文数往上涨；不跳进还空着的报文页
  const ok = await importPcap(f, '', false)
  if (!ok) return
  // 清掉已选文件：上传成功后它会占着提示位，而下一次导入必然换文件
  file.value = null
}

/** 进详情：目录里点某一行（或那一行的操作）时，默认停在用户点的那一页 */
function openSessionTab(id: number, tab: TsharkTabKey) {
  activeTab.value = tab
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

/** 统计面板点协议：填进报文关键字并切过去，省掉「记住协议名 → 回头手打」那一步 */
function onPickProtocol(protocol: string) {
  filterByProtocol(protocol)
  activeTab.value = 'packet'
}

/** 会话流面板点某条流：按该流过滤并切回报文页 */
function onPickFlow(flow: TsharkFlow) {
  filterByFlow(flow)
  activeTab.value = 'packet'
}

/** 诊断面板点某个异常：回填后端给的等价过滤并切回报文页 */
function onPickAnomaly(filterText: string) {
  applyPacketFilter(filterText)
  activeTab.value = 'packet'
}

onMounted(init)
</script>

<style scoped>
/* 已选文件：只占一个小胶囊，紧跟在「选择文件」后面 —— 用户点了按钮之后
   总得看见自己选的是哪一份，但空着的时候不占位（不写「未选择文件」这种废话） */
.pcap-file-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  max-width: 260px;
  height: 28px;
  padding: 0 4px 0 9px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-sm, 6px);
}

.pcap-file-chip__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pcap-file-chip__x {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--el-text-color-placeholder);
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.pcap-file-chip__x:hover {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color);
}

.pcap-file-chip__x:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}

/* 加载范围说明：控制栏与列表之间的一行小字，没有内容时整行不渲染 */
.pcap-note {
  margin: 0;
  padding: 0 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 文件选择框由 tshark.css 里的 .pcap-file-input 隐藏；
   这里不再重复，否则两处都改才生效 */
</style>
