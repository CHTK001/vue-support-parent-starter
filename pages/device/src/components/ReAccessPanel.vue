<template>
  <div class="re-access space-y-4">
    <div class="grid grid-cols-3 gap-4">
      <el-card
        v-for="door in doors"
        :key="door.deviceDoorNo"
        class="shadow-sm rounded-xl p-4"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-el-text">{{ door.deviceDoorName }}</span>
          <el-button type="primary" @click="emit('unlock', door.deviceDoorNo)">开门</el-button>
        </div>
        <div class="text-xs text-el-text-secondary mt-1">状态: {{ door.deviceDoorStatus }}</div>
      </el-card>
      <el-empty v-if="doors.length === 0" description="无门禁" :image-size="50" />
    </div>

    <el-card class="shadow-sm rounded-xl p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-el-text">门禁事件</span>
        <el-button text @click="emit('refresh')">
          <el-icon class="mr-1"><Refresh /></el-icon>刷新
        </el-button>
      </div>
      <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM；
           pagination/toolbar 关闭，不新增页码控件与工具栏按钮；
           原表未写 border → settings.border=false 显式抑制默认边框；
           原表无 height/maxHeight → layout-table.minHeight=0：抑制 ReTable 缺省开启的
           fill（表头固定内滚）与空态 440px min-height，保持「内容多高表多高 + 整页滚动」。
           下方 el-empty 是原模板里直接挂在 el-table 默认插槽的散子元素（并非 #empty 模板），
           按零回归原样保留为 ReTable 默认插槽子元素，落点与改造前一致（hidden-columns）。 -->
      <ReTable
        :data="events as unknown as Record<string, unknown>[]"
        :columns="accessEventColumns"
        engine="element"
        :layout-table="{ minHeight: 0 }"
        :settings="{ border: false }"
        style="width:100%"
        :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
      >
        <el-empty v-if="events.length === 0" description="无事件" :image-size="40" />
      </ReTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import type { DeviceDoor, AccessEvent } from '../types/device'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'

/**
 * 列配置：原模板 4 个 el-table-column 收敛到数组。
 * 标题是静态文案（无 t()），普通常量即可。
 */
const accessEventColumns: ReTableColumn[] = [
  { prop: 'time', label: '时间', width: 180 },
  { prop: 'doorName', label: '门' },
  { prop: 'eventType', label: '事件类型' },
  { prop: 'cardNo', label: '卡号' },
]

defineProps<{
  doors: DeviceDoor[]
  events: AccessEvent[]
}>()

const emit = defineEmits<{
  (e: 'unlock', doorId: number): void
  (e: 'refresh'): void
}>()
</script>
