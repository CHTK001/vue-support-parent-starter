<!--
  报文明细面板（工作台主视图）

  全宽铺开，列宽按「时间 / 协议 / 源 / 目的 / 长度 / 摘要」的实际长度分配 ——
  这是布局 C 相对原主从布局的主要收益：报文列不再被 300px 的会话栏挤掉。
-->
<template>
  <div class="tshark-panel">
    <div class="tshark-panel__tools">
      <!-- 关键字走后端（库里筛），不是前端筛当前页：否则翻到第 3 页搜一个只出现在
           第 1 页的包会「搜不到」。导出同理，导的是当前页结果。 -->
      <ReInput
        class="tshark-filter"
        :model-value="keyword"
        placeholder="过滤：协议 / IP / 端口 / 摘要"
        clearable
        @update:model-value="onKeyword"
      >
        <template #prefix><ReIcon name="Search" :size="13" /></template>
      </ReInput>
      <span v-if="keyword" class="tshark-dim packet-hint">后端在库中按「{{ keyword }}」筛选</span>
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
        row-key="id"
        :pagination="false"
        :toolbar="false"
        :context-menu="packetMenu"
        :empty-text="emptyText"
        @context-menu-select="onPacketMenuSelect"
      >
        <ReTableColumn prop="packetTime" label="时间" width="176" align="center">
          <template #default="{ row }">
            <span class="tshark-mono tshark-dim">{{ row.packetTime || '—' }}</span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="协议" width="96" align="center">
          <template #default="{ row }">
            <ReTag :class="['tshark-proto', protoClass(row.protocol)]" effect="plain">
              {{ row.protocol || 'OTHER' }}
            </ReTag>
          </template>
        </ReTableColumn>
        <ReTableColumn label="源" width="206">
          <template #default="{ row }">
            <span class="tshark-mono">{{ addr(row.sourceIp, row.sourcePort) }}</span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="目的" width="206">
          <template #default="{ row }">
            <span class="tshark-mono">{{ addr(row.destIp, row.destPort) }}</span>
          </template>
        </ReTableColumn>
        <ReTableColumn prop="packetLength" label="长度" width="88" align="right">
          <template #default="{ row }">
            <span class="tshark-mono">{{ row.packetLength ?? 0 }}</span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="摘要" min-width="260">
          <template #default="{ row }">
            <span class="tshark-ellipsis" :title="row.packetInfo">{{ row.packetInfo || row.restoredText || '—' }}</span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="操作" width="80" align="center">
          <template #default="{ row }">
            <ReButton link type="primary" @click="emit('open-detail', row)">详情</ReButton>
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
import { Connection, Document } from '@element-plus/icons-vue'
import type { ReTableContextMenuContext, ReTableContextMenuItem } from '@repo/ui/re-table'
import type { TsharkPacket } from './types'

defineProps<{
  packets: TsharkPacket[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  keyword: string
  emptyText: string
}>()

const emit = defineEmits<{
  (e: 'update:keyword', v: string): void
  (e: 'page-change', page: number): void
  (e: 'open-detail', row: TsharkPacket): void
  (e: 'open-lifecycle', row: TsharkPacket): void
  (e: 'export'): void
}>()

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

function onKeyword(v: unknown) {
  emit('update:keyword', v === null || v === undefined ? '' : String(v))
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
