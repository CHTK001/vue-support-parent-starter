<!--
  导入记录面板（PCAP 分析）

  职责与「抓包分析」的会话面板相同 —— 列出可选的数据来源、切换、下载原件、删除 ——
  但列的是一份份导入进来的 pcap：文件名、解析状态、报文数、报文时间范围、时长。

  为什么不直接复用会话面板：那边卡片的「网卡」「抓包中 / 已停止」对导入的文件没有意义
  （导入会话的网卡恒为空，状态含义是「解析中 / 已解析」），硬套会出现一整列「—」
  以及一个说法对不上内容的标签。两张表讲的是两件事，各自一张更省解释成本。

  分页、搜索都在父级（useTshark）算好再传进来 —— 搜索必须在「已拉取的全量」上做，
  只搜当前页会「搜不到」（见 useTshark 的 SESSION_FETCH_SIZE 说明）。
-->
<template>
  <div class="tshark-panel">
    <div class="tshark-panel__tools">
      <ReInput
        class="tshark-sessions-filter"
        :model-value="keyword"
        placeholder="搜索文件名 / 会话名"
        clearable
        @update:model-value="onKeyword"
      >
        <template #prefix><ReIcon name="Search" :size="13" /></template>
      </ReInput>

      <span class="tshark-panel__spacer"></span>
      <span class="tshark-dim import-summary">{{ summaryText }}</span>
      <ReButton icon="Refresh" layout="square" tip="刷新导入记录" @click="emit('refresh')" />
    </div>

    <div class="tshark-panel__body">
      <ReTable
        class="tshark-table"
        :data="sessions"
        :loading="loading"
        border
        row-key="id"
        :pagination="false"
        :toolbar="false"
        :empty-text="emptyText"
      >
        <ReTableColumn label="文件 / 会话名" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span
              class="tshark-mono import-name"
              :class="{ 'is-active': row.id === activeId }"
              :title="sessionName(row)"
            >{{ sessionName(row) }}</span>
          </template>
        </ReTableColumn>

        <ReTableColumn label="状态" width="100" align="center">
          <template #default="{ row }">
            <ReTag :type="statusOf(row).type" effect="plain">{{ statusOf(row).text }}</ReTag>
          </template>
        </ReTableColumn>

        <ReTableColumn label="报文数" width="104" align="right">
          <template #default="{ row }">
            <!-- 解析期间这个数字在长（后端每 2000 条落一次包数并推送），
                 所以它本身就是进度指示，不必再画进度条 -->
            <span class="import-num">{{ row.packetCount ?? 0 }}</span>
          </template>
        </ReTableColumn>

        <ReTableColumn label="报文时间范围" min-width="250">
          <template #default="{ row }">
            <span class="tshark-mono tshark-dim">{{ timeRange(row) }}</span>
          </template>
        </ReTableColumn>

        <ReTableColumn label="时长" width="96" align="right">
          <template #default="{ row }">
            <span class="import-num">{{ fmtDuration(row.captureDuration) }}</span>
          </template>
        </ReTableColumn>

        <ReTableColumn label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <ReButton link type="primary" @click="emit('select', row.id)">查看</ReButton>
            <ReButton
              link
              :disabled="(row.packetCount ?? 0) === 0"
              tip="下载原始 pcap（用 Wireshark 打开）"
              @click="emit('download', row.id, sessionName(row))"
            >下载</ReButton>
            <ReButton link type="danger" @click="emit('remove', row.id)">删除</ReButton>
          </template>
        </ReTableColumn>
      </ReTable>
    </div>

    <div class="tshark-panel__foot">
      <RePagination
        small
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="(p: number) => emit('page-change', p)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TsharkSession } from './types'

const props = defineProps<{
  /** 当前页要显示的导入记录（父级已完成搜索 + 分页） */
  sessions: TsharkSession[]
  loading: boolean
  keyword: string
  page: number
  pageSize: number
  /** 搜索后的条数（分页 total） */
  total: number
  /** 已拉取到本地的条数 */
  loadedCount: number
  /** 后端返回的总条数，可能大于已拉取条数 */
  backendTotal: number
  /** 其中还在解析的条数 */
  parsingCount: number
  activeId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:keyword', v: string): void
  (e: 'page-change', page: number): void
  (e: 'select', id: number): void
  (e: 'download', id: number, name: string): void
  (e: 'remove', id: number): void
  (e: 'refresh'): void
}>()

const summaryText = computed(() => {
  const all = props.loadedCount
  const capped = props.backendTotal > all ? `（已加载 ${all}/${props.backendTotal}）` : ''
  const parsing = props.parsingCount > 0 ? `，${props.parsingCount} 份解析中` : ''
  if (props.total === all) return `共 ${all} 份导入文件${parsing}${capped}`
  return `筛选出 ${props.total} / ${all} 份${parsing}${capped}`
})

const emptyText = computed(() =>
  props.keyword.trim()
    ? '没有匹配的导入记录'
    : '还没有导入过 pcap —— 点上方「选择文件」，或直接把文件拖到页面上')

function onKeyword(v: unknown) {
  emit('update:keyword', v === null || v === undefined ? '' : String(v))
}

function sessionName(s: TsharkSession): string {
  return s.sessionName || `导入 ${s.id}`
}

/**
 * 解析状态。
 *
 * <p>三态而不是两态：报文数为 0 的「已解析」多半是文件本身不含报文（或格式不对），
 * 和正常解析完的文件混在一起会让人以为数据丢了，所以单独标成「无报文」。</p>
 */
function statusOf(s: TsharkSession): { type: 'warning' | 'info' | 'success'; text: string } {
  if (s.captureStatus === 1) return { type: 'warning', text: '解析中' }
  if ((s.packetCount ?? 0) === 0) return { type: 'info', text: '无报文' }
  return { type: 'success', text: '已解析' }
}

/** 报文的首末时间。解析中时后端还没回填结束时间，就只显示起点 + 「解析中」 */
function timeRange(s: TsharkSession): string {
  const from = fmtTime(s.startTime)
  if (!from) return '—'
  const to = fmtTime(s.endTime)
  if (!to) return `${from} → 解析中`
  return `${from} → ${to}`
}

/** 后端给的是「2026-10-18T13:36:38」或「2026-10-18 13:36:38」两种形态，都要吃得下 */
function fmtTime(t?: string | null): string {
  if (!t) return ''
  const d = t.includes('T') ? new Date(t) : new Date(t.replace(/-/g, '/'))
  if (isNaN(d.getTime())) return t
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** 把「秒」说成人话；小于 1 秒的抓包很常见，直接显示 0s 会显得像没抓到东西 */
function fmtDuration(sec?: number | null): string {
  if (sec === null || sec === undefined) return '—'
  if (sec <= 0) return '<1s'
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m < 60) return s ? `${m}m${s}s` : `${m}m`
  const h = Math.floor(m / 60)
  return `${h}h${m % 60}m`
}
</script>

<style scoped>
.import-summary {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
</style>
