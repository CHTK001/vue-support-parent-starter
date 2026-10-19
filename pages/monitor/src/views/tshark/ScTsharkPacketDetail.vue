<!--
  报文详情抽屉

  沿用原实现的信息层级（属性表 → 摘要 → 协议还原 → 原始数据），补了两点：
  协议还原 / 原始数据可一键复制；原始数据被截断时写明截断，避免误以为报文就这么短。
-->
<template>
  <ReDrawer
    :model-value="modelValue"
    title="数据包详情"
    size="55%"
    footer-hidden
    @update:model-value="onOpenChange"
  >
    <!-- 走默认插槽：两个主题都能兜住 —— default 主题渲染的是 `<slot />`，
         koi 主题渲染的是 `<slot name="content"><slot /></slot>`。
         （koi 主题另在底部渲染一对「确定 / 取消」按钮，本抽屉是只读详情，
         用 footer-hidden 关掉，否则抽屉底部挂着两个点了没意义的按钮。） -->
    <div v-if="packet" class="packet-detail">
      <div class="packet-detail__head">
        <ReTag :class="['tshark-proto', protoClass(packet.protocol)]" effect="plain">
          {{ packet.protocol || 'OTHER' }}
        </ReTag>
        <span class="tshark-mono tshark-dim">{{ addr(packet.sourceIp, packet.sourcePort) }} → {{ addr(packet.destIp, packet.destPort) }}</span>
        <span class="tshark-panel__spacer"></span>
        <ReButton icon="CopyDocument" @click="copyAll">复制关键字段</ReButton>
      </div>

      <ReDescriptions :column="2" border>
        <ReDescriptionsItem label="协议">{{ packet.protocol || '—' }}</ReDescriptionsItem>
        <ReDescriptionsItem label="长度">{{ packet.packetLength ?? 0 }} 字节</ReDescriptionsItem>
        <ReDescriptionsItem label="源地址">{{ addr(packet.sourceIp, packet.sourcePort) }}</ReDescriptionsItem>
        <ReDescriptionsItem label="目的地址">{{ addr(packet.destIp, packet.destPort) }}</ReDescriptionsItem>
        <ReDescriptionsItem label="时间" :span="2">{{ packet.packetTime || '—' }}</ReDescriptionsItem>
      </ReDescriptions>

      <section class="detail-section">
        <header class="detail-section__head">
          <h4>摘要</h4>
          <ReButton v-if="packet.packetInfo" link type="primary" @click="copy(packet.packetInfo || '', '摘要已复制')">复制</ReButton>
        </header>
        <p class="tshark-mono detail-text">{{ packet.packetInfo || '—' }}</p>
      </section>

      <section v-if="packet.restoredText" class="detail-section">
        <header class="detail-section__head">
          <h4>协议还原</h4>
          <ReButton link type="primary" @click="copy(packet.restoredText || '', '协议还原已复制')">复制</ReButton>
        </header>
        <pre class="detail-block">{{ packet.restoredText }}</pre>
      </section>

      <section v-if="packet.rawData" class="detail-section">
        <header class="detail-section__head">
          <h4>原始数据</h4>
          <span v-if="rawTruncated" class="tshark-dim detail-note">仅显示前 {{ RAW_LIMIT }} 字符</span>
          <ReButton link type="primary" @click="copy(packet.rawData || '', '原始数据已复制')">复制</ReButton>
        </header>
        <pre class="detail-block">{{ rawPreview }}</pre>
      </section>
    </div>

    <div v-else class="tshark-panel__empty">
      <ReEmpty description="选择一个数据包查看详情" layout="modern" />
    </div>
  </ReDrawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { message } from '@repo/core'
import type { TsharkPacket } from './types'

/** 原始数据一次最多渲染的字符数：几十 KB 的十六进制串直接塞进 <pre> 会把抽屉卡住 */
const RAW_LIMIT = 4000

const props = defineProps<{
  modelValue: boolean
  packet: TsharkPacket | null
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const rawPreview = computed(() => (props.packet?.rawData || '').slice(0, RAW_LIMIT))
const rawTruncated = computed(() => (props.packet?.rawData || '').length > RAW_LIMIT)

function onOpenChange(v: unknown) {
  emit('update:modelValue', !!v)
}

function addr(ip?: string | null, port?: number | null): string {
  const host = ip || '?'
  return port === null || port === undefined ? host : `${host}:${port}`
}

function protoClass(p?: string | null): string {
  const map: Record<string, string> = {
    TCP: 'tshark-proto--tcp', UDP: 'tshark-proto--udp', HTTP: 'tshark-proto--http',
    HTTPS: 'tshark-proto--http', TLS: 'tshark-proto--tls', DNS: 'tshark-proto--dns',
    ICMP: 'tshark-proto--icmp', ARP: 'tshark-proto--arp', SSH: 'tshark-proto--ssh',
    QUIC: 'tshark-proto--quic',
  }
  return map[p || ''] || ''
}

async function copy(text: string, okText: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    message.success(okText)
  } catch {
    // 剪贴板权限被拒（非 https / 用户拒绝）时给个出路，而不是静默失败
    message.warning('复制失败，请手动选中文本复制')
  }
}

function copyAll() {
  const p = props.packet
  if (!p) return
  copy([
    `协议: ${p.protocol || ''}`,
    `时间: ${p.packetTime || ''}`,
    `长度: ${p.packetLength ?? 0} 字节`,
    `源: ${addr(p.sourceIp, p.sourcePort)}`,
    `目的: ${addr(p.destIp, p.destPort)}`,
    `摘要: ${p.packetInfo || ''}`,
  ].join('\n'), '关键字段已复制')
}
</script>

<style scoped>
.packet-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.packet-detail__head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-wrap: wrap;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.detail-section__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.detail-section__head h4 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.detail-note {
  font-size: 11px;
}
.detail-text {
  margin: 0;
  color: var(--el-text-color-regular);
  word-break: break-all;
  line-height: 1.6;
}
.detail-block {
  margin: 0;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  font-size: 11px;
  line-height: 1.5;
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--el-text-color-regular);
}
</style>
