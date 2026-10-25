<!--
  一行会话（抓包 / 导入）的操作按钮。

  抽出来的理由与 ACME 的 CertRowActions 相同：同一组操作要在密集表行尾、卡片脚、
  档案柜详情底栏三处出现，各写一遍迟早出现「表格里能停止、卡片上忘了加」。
  另外「报文 / 统计 / 会话流」是三个入口，收进一个下拉比排三个按钮更省横向空间。
-->
<template>
  <template v-if="mode === 'full'">
    <ReButton @click="emit('open', 'packet')">报文</ReButton>
    <ReButton @click="emit('open', 'stats')">统计</ReButton>
    <ReButton @click="emit('open', 'flow')">会话流</ReButton>
    <ReButton
      :disabled="session.packetCount === 0"
      tip="下载原始 pcap（用 Wireshark 打开）"
      @click="emit('download')"
    >下载原件</ReButton>
    <ReButton v-if="canStop && session.running" type="warning" @click="emit('stop')">停止抓包</ReButton>
    <ReButton type="danger" @click="emit('remove')">删除</ReButton>
  </template>

  <template v-else>
    <button type="button" class="pk-link" @click="emit('open', 'packet')">报文</button>
    <button type="button" class="pk-link" @click="emit('open', 'stats')">统计</button>

    <ElDropdown trigger="click" placement="bottom-end" @command="onCommand">
      <button type="button" class="pk-link" aria-label="更多操作">更多</button>
      <template #dropdown>
        <ElDropdownMenu>
          <ElDropdownItem command="flow">会话流</ElDropdownItem>
          <ElDropdownItem command="download" :disabled="session.packetCount === 0">下载原件</ElDropdownItem>
          <ElDropdownItem v-if="canStop && session.running" command="stop">停止抓包</ElDropdownItem>
          <ElDropdownItem command="remove" divided>删除</ElDropdownItem>
        </ElDropdownMenu>
      </template>
    </ElDropdown>
  </template>
</template>

<script setup lang="ts">
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import ReButton from '@repo/ui/re-button'
import type { TsharkTabKey } from './types'
import type { SessionView } from './sessionView'

defineProps<{
  /** 会话展示行 */
  session: SessionView
  /** 是否可以停止抓包（导入记录没有这个动作） */
  canStop?: boolean
  /** `compact` 收进「更多」；`full` 全部平铺（详情底栏用） */
  mode?: 'compact' | 'full'
}>()

const emit = defineEmits<{
  (e: 'open', tab: TsharkTabKey): void
  (e: 'download'): void
  (e: 'stop'): void
  (e: 'remove'): void
}>()

/**
 * 「更多」里的命令分发
 *
 * @param command 命令名
 */
function onCommand(command: string): void {
  if (command === 'flow') emit('open', 'flow')
  else if (command === 'download') emit('download')
  else if (command === 'stop') emit('stop')
  else if (command === 'remove') emit('remove')
}
</script>
