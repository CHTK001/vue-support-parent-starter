<template>
  <div class="re-event space-y-4">
    <div class="flex items-center gap-4">
      <el-select :model-value="filter.type" placeholder="事件类型" clearable style="width: 140px" @update:model-value="(v: string) => emit('update:filter', { ...filter, type: v })">
        <el-option label="移动侦测" value="MOTION" />
        <el-option label="IO报警" value="IO_ALARM" />
        <el-option label="门禁" value="ACCESS" />
        <el-option label="温度" value="TEMP" />
        <el-option label="网络" value="NETWORK" />
        <el-option label="其他" value="OTHER" />
      </el-select>
      <el-date-picker
        :model-value="filter.dateRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"

        @update:model-value="(v: any) => emit('update:filter', { ...filter, dateRange: v })"
      />
      <el-button type="primary" @click="emit('query')">查询</el-button>
      <el-switch :model-value="realtime" active-text="实时" inactive-text="轮询" @update:model-value="(v: boolean) => emit('update:realtime', v)" />
    </div>

    <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM，
         既有 :deep(.el-table…) 覆盖与 e2e 选择器一概不失效；
         pagination/toolbar 关闭 —— 不新增页码控件与工具栏按钮，按钮清单与改造前一致；
         原表未写 border → settings.border=false 显式抑制 ReTable 默认边框；
         max-height="500" → layout-table.maxHeight（已给固定高度，hasFixedHeight 为真，
         fill 天然关闭、空态走 fixed-height 分支，故按规格例外不再补 minHeight）。
         events 是 defineProps 里的接口数组（无索引签名），直接喂 data 会 TS2322，
         按仓内既有写法（Leaks.vue / ServerMonitor.vue）做收窄转换。 -->
    <ReTable
      :data="events as unknown as Record<string, unknown>[]"
      :columns="eventColumns"
      engine="element"
      :pagination="false"
      :toolbar="false"
      :layout-table="{ maxHeight: 500 }"
      :settings="{ border: false }"
      style="width:100%"
    >
      <template #empty>
        <el-empty description="无事件" :image-size="60" />
      </template>
    </ReTable>
  </div>
</template>

<script setup lang="ts">
import type { DeviceEvent } from '@/types/device'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'

/**
 * 列配置：原模板 4 个 el-table-column 收敛到数组。
 * 标题是静态文案（无 t()），故用普通常量即可，不需要 computed。
 */
const eventColumns: ReTableColumn[] = [
  { prop: 'deviceEventRecordOccurredAt', label: '时间', width: 180 },
  { prop: 'deviceEventRecordEventType', label: '类型', width: 120 },
  { prop: 'deviceEventRecordChannelNo', label: '通道', width: 80 },
  { prop: 'deviceEventRecordDetail', label: '详情' },
]

defineProps<{
  events: DeviceEvent[]
  filter: { type: string; dateRange: any }
  realtime: boolean
}>()

const emit = defineEmits<{
  (e: 'query'): void
  (e: 'update:filter', val: { type: string; dateRange: any }): void
  (e: 'update:realtime', val: boolean): void
}>()
</script>
