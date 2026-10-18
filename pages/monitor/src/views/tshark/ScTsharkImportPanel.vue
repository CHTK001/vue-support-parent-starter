<!--
  导入记录面板（PCAP 分析）

  职责与「抓包分析」的会话面板相同 —— 列出可选的数据来源、切换、下载原件、删除 ——
  但列的是一份份导入进来的 pcap：文件名、解析状态、报文数、报文时间范围、时长。

  为什么不直接复用会话面板：那边卡片的「网卡」「抓包中 / 已停止」对导入的文件没有意义
  （导入会话的网卡恒为空，状态含义是「解析中 / 已解析」），硬套会出现一整列「—」
  以及一个说法对不上内容的标签。两张表讲的是两件事，各自一张更省解释成本。

  分页、搜索都在父级（useTshark）算好再传进来 —— 搜索必须在「已拉取的全量」上做，
  只搜当前页会「搜不到」（见 useTshark 的 SESSION_FETCH_SIZE 说明）。

  整行可点（row-click → select）：这张表就是 PCAP 分析页的目录页，
  「看这个文件的报文」是绝对主操作，让它必须瞄准右边那个「查看」小字是不合理的；
  「查看」按钮仍保留，因为按钮是「这里能点」最直白的信号。
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
        @row-click="onRowClick"
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
import { sessionName, statusOf, timeRange, fmtDuration } from './tsharkFormat'
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

/** 整行点击 = 「查看这个文件」；ReTable 的 row-click 会多带列与事件两个参数，这里只取行 */
function onRowClick(row: TsharkSession) {
  emit('select', row.id)
}
</script>

<style scoped>
.import-summary {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

/* 整行是按钮：指针形态告诉用户「这行能点」，否则只有右边那个小字像链接 */
.tshark-table :deep(.el-table__row) {
  cursor: pointer;
}
</style>
