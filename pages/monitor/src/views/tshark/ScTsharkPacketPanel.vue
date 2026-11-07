<!--
  报文明细面板（工作台主视图）

  全宽铺开，列宽按「时间 / 协议 / 源 / 目的 / 长度 / 摘要」的实际长度分配 ——
  这是布局 C 相对原主从布局的主要收益：报文列不再被 300px 的会话栏挤掉。
-->
<template>
  <div class="tshark-panel">
    <div class="tshark-panel__tools">
      <!-- 过滤在上方的统一过滤条里做（报文 / 统计 / 会话流共用一份表达式）。
           这里只保留与当前页相关的操作。 -->
      <span class="tshark-dim packet-hint">右键报文可查看 TCP 生命周期</span>

      <span class="tshark-panel__spacer"></span>
      <span class="tshark-dim packet-count">共 {{ total }} 条</span>
      <ReButton
        icon="Download"
        :disabled="packets.length === 0"
        tip="把当前页结果导出为 CSV"
        @click="emit('export')"
      >
        导出 CSV
      </ReButton>
    </div>

    <div class="tshark-panel__body">
      <ReTable
        class="tshark-table"
        :data="packets"
        :loading="loading"
        border
        stripe
        size="small"
        row-key="id"
        :pagination="false"
        :toolbar="false"
        :columns="tableColumns"
        :context-menu="packetMenu"
        :empty-text="emptyText"
        :layout-table="{ fill: true }"
        virtual-scroll
        :virtual-scroll-gt="50"
        @context-menu-select="onPacketMenuSelect"
      >
        <template #col-packetTime="{ row }">
          <span class="tshark-mono tshark-dim">{{ row.packetTime || '—' }}</span>
        </template>
        <template #col-protocol="{ row }">
          <ReTag :class="['tshark-proto', protoClass(row.protocol)]" effect="plain">
            {{ row.protocol || 'OTHER' }}
          </ReTag>
        </template>
        <template #col-sourceIp="{ row }">
          <span class="tshark-mono">{{ addr(row.sourceIp, row.sourcePort) }}</span>
        </template>
        <template #col-destIp="{ row }">
          <span class="tshark-mono">{{ addr(row.destIp, row.destPort) }}</span>
        </template>
        <template #col-packetLength="{ row }">
          <span class="tshark-mono">{{ row.packetLength ?? 0 }}</span>
        </template>
        <template #col-packetInfo="{ row }">
          <span class="tshark-ellipsis" :title="row.packetInfo">{{ row.packetInfo || row.restoredText || '—' }}</span>
        </template>
        <template #actions="{ row }">
          <ReButton text type="primary" @click="emit('open-detail', row)">详情</ReButton>
          <ReButton text type="primary" @click="emit('open-lifecycle', row)">生命周期</ReButton>
        </template>
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
import { Connection, Document } from '@element-plus/icons-vue'
import type { ReTableColumn, ReTableContextMenuContext, ReTableContextMenuItem } from '@repo/ui/re-table'
import type { TsharkPacket } from './types'

defineProps<{
  packets: TsharkPacket[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  emptyText: string
}>()

const emit = defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'open-detail', row: TsharkPacket): void
  (e: 'open-lifecycle', row: TsharkPacket): void
  (e: 'export'): void
}>()

/**
 * 报文列表列定义（ReTable columns 数组形态）。
 *
 * <p>大小字段（协议还原 / 原始数据）已被后端从列表接口排除，这里只用列表行
 * 携带的字段；详情面板打开时再按需拉取大小字段（见 useTshark.openPacketDetail）。</p>
 */
const tableColumns: ReTableColumn[] = [
  { prop: 'packetTime', label: '时间', width: 176, align: 'center',
    formatter: (row: Record<string, unknown>) => String(row.packetTime ?? '—') },
  { prop: 'protocol', label: '协议', width: 96, align: 'center',
    formatter: (row: Record<string, unknown>) => String(row.protocol ?? 'OTHER') },
  { prop: 'sourceIp', label: '源', width: 206,
    formatter: (row: Record<string, unknown>) => String(row.sourceIp ?? '') },
  { prop: 'destIp', label: '目的', width: 206,
    formatter: (row: Record<string, unknown>) => String(row.destIp ?? '') },
  { prop: 'packetLength', label: '长度', width: 88, align: 'right' },
  { prop: 'packetInfo', label: '摘要', minWidth: 260,
    formatter: (row: Record<string, unknown>) => String((row.packetInfo as string) || (row.restoredText as string) || '—') },
  { prop: 'actions', label: '操作', width: 176, align: 'center', slot: 'actions' },
]

/**
 * 报文右键菜单。
 *
 * <p>「查看生命周期」调后端 `/packets/{id}/handshake`：按四元组还原整条 TCP 流，
 * 给出三次/四次握手判定与按时间排好的报文序列（HTTP / TLS 等 TCP 上的协议同样支持），
 * 页面据此画时序图。UDP / ICMP / ARP 没有握手，弹层里会明确提示不支持。</p>
 */
const packetMenu: ReTableContextMenuItem[] = [
  { key: 'detail', label: '查看报文详情', icon: Document },
  { key: 'lifecycle', label: '查看生命周期', icon: Connection, divided: true },
]

function onPacketMenuSelect(item: ReTableContextMenuItem, ctx: ReTableContextMenuContext) {
  const row = ctx.row as unknown as TsharkPacket
  if (item.key === 'detail') {
    emit('open-detail', row)
    return
  }
  if (item.key === 'lifecycle') {
    emit('open-lifecycle', row)
  }
}

/** 「IP:端口」；端口缺失（ARP / ICMP 这类）时只留 IP，不要拖一个孤零零的冒号 */
function addr(ip?: string | null, port?: number | null): string {
  const host = ip || '?'
  return port === null || port === undefined ? host : `${host}:${port}`
}

/** 协议色 class；与统计面板共用一套（见 tshark.css 的协议配色段） */
function protoClass(p?: string | null): string {
  const map: Record<string, string> = {
    TCP: 'tshark-proto--tcp', UDP: 'tshark-proto--udp', HTTP: 'tshark-proto--http',
    HTTPS: 'tshark-proto--http', TLS: 'tshark-proto--tls', DNS: 'tshark-proto--dns',
    ICMP: 'tshark-proto--icmp', ARP: 'tshark-proto--arp', SSH: 'tshark-proto--ssh',
    QUIC: 'tshark-proto--quic',
  }
  return map[p || ''] || ''
}
</script>

<style scoped>
.packet-hint { font-size: 11.5px; }
.packet-count { font-size: 12px; font-variant-numeric: tabular-nums; }
</style>
