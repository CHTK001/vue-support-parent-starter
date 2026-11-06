<!--
  一行会话（抓包 / 导入）的操作按钮。

  「报文 / 统计 / 会话流」是三个入口，再叠上下载 / 停止 / 删除，平铺出来会把行尾
  撑到两百多像素、把「开始」「时长」挤走；所以只把最常用的「报文 / 统计」露在外面，
  其余收进「更多」—— 一列 116px 就够，窄屏也不会折行。
-->
<template>
  <button type="button" class="pk-link" @click="emit('open', 'packet')">报文</button>
  <button type="button" class="pk-link" @click="emit('open', 'stats')">统计</button>

  <ElDropdown trigger="click" placement="bottom-end" @command="onCommand">
    <button type="button" class="pk-link" aria-label="更多操作">更多</button>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem command="flow">会话流</ElDropdownItem>
        <ElDropdownItem command="download" :disabled="session.packetCount === 0">下载原件</ElDropdownItem>
        <ElDropdownItem v-if="canStop && session.running" command="stop">停止抓包</ElDropdownItem>
        <!-- 抓包未停止不显示「删除」：删除会连同 pcap 一起抹掉，先停止才有机会保住原件 -->
        <ElDropdownItem v-if="!session.running" command="remove" divided>删除</ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>

<script setup lang="ts">
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import type { TsharkTabKey } from './types'
import type { SessionView } from './sessionView'

defineProps<{
  /** 会话展示行 */
  session: SessionView
  /** 是否可以停止抓包（导入记录没有这个动作） */
  canStop?: boolean
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
