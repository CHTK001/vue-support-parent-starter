<template>
  <div class="evt">
    <!-- 筛选行 -->
    <section class="evt-filter">
      <div class="evt-field">
        <ReSelect
          :model-value="filter.type"
          placeholder="全部事件类型"
          clearable
          :options="EVENT_TYPES"
          @update:model-value="(v: any) => emit('update:filter', { ...filter, type: v || '' })"
        />
      </div>
      <div class="evt-field evt-field--range">
        <el-date-picker
          :model-value="filter.dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          style="width: 100%"
          @update:model-value="(v: any) => emit('update:filter', { ...filter, dateRange: v })"
        />
      </div>
      <ReButton icon="Search" :show-text="true" type="primary" @click="emit('query')">查询</ReButton>
      <div class="evt-ops">
        <el-switch
          :model-value="realtime"
          active-text="实时"
          inactive-text="轮询"
          @update:model-value="(v: boolean) => emit('update:realtime', v)"
        />
        <ReButton icon="RefreshRight" layout="square" tip="刷新事件" @click="emit('query')" />
      </div>
    </section>

    <!-- 事件表 -->
    <section class="evt-panel">
      <header class="evt-panel__head">
        <span class="evt-panel__bar" />
        <span>设备事件</span>
        <span class="evt-panel__count">{{ events.length }}</span>
      </header>

      <ReTable
        v-if="events.length"
        :data="events as unknown as Record<string, unknown>[]"
        :columns="eventColumns"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :layout-table="{ maxHeight: 460, minHeight: 0 }"
        :settings="{ border: false }"
        style="width: 100%"
      >
        <template #col-deviceEventRecordOccurredAt="{ row }">
          <span class="evt-mono">{{ row.deviceEventRecordOccurredAt || '—' }}</span>
        </template>
        <template #col-deviceEventRecordEventType="{ row }">
          <ReTag :type="eventTypeColor(String(row.deviceEventRecordEventType || ''))" size="small">
            {{ eventTypeLabel(String(row.deviceEventRecordEventType || '')) }}
          </ReTag>
        </template>
        <template #col-deviceEventRecordChannelNo="{ row }">
          <span class="evt-chip">CH{{ row.deviceEventRecordChannelNo ?? '—' }}</span>
        </template>
      </ReTable>
      <ReEmpty v-else description="暂无事件记录" :image-size="70" />
    </section>
  </div>
</template>

<script setup lang="ts">
import ReButton from '@repo/ui/re-button'
import ReEmpty from '@repo/ui/re-empty'
import ReSelect from '@repo/ui/re-select'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
import ReTag from '@repo/ui/re-tag'
import type { DeviceEvent } from '../types/device'

/** 事件类型筛选项（与后端 EventType 枚举对齐） */
const EVENT_TYPES = [
  { label: '移动侦测', value: 'MOTION' },
  { label: 'IO 报警', value: 'IO_ALARM' },
  { label: '门禁', value: 'ACCESS' },
  { label: '温度', value: 'TEMP' },
  { label: '网络', value: 'NETWORK' },
  { label: '其他', value: 'OTHER' },
]

const EVENT_TYPE_LABELS: Record<string, string> = EVENT_TYPES.reduce(
  (acc, cur) => ({ ...acc, [cur.value]: cur.label }),
  {} as Record<string, string>,
)

/**
 * 列配置：原模板 4 个 el-table-column 收敛到数组。
 * 标题是静态文案（无 t()），故用普通常量即可，不需要 computed。
 */
const eventColumns: ReTableColumn[] = [
  { prop: 'deviceEventRecordOccurredAt', label: '时间', width: 190, slot: 'deviceEventRecordOccurredAt' },
  { prop: 'deviceEventRecordEventType', label: '类型', width: 140, slot: 'deviceEventRecordEventType' },
  { prop: 'deviceEventRecordChannelNo', label: '通道', width: 100, slot: 'deviceEventRecordChannelNo' },
  { prop: 'deviceEventRecordDetail', label: '详情', minWidth: 200 },
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

function eventTypeLabel(type: string): string {
  return EVENT_TYPE_LABELS[type] || type || '—'
}

/** 事件类型 → 标签色：告警类走危险色，侦测类走主色 */
function eventTypeColor(type: string): 'danger' | 'warning' | 'primary' | 'info' {
  if (['IO_ALARM', 'ACCESS'].includes(type)) return 'danger'
  if (['TEMP', 'NETWORK'].includes(type)) return 'warning'
  if (type === 'MOTION') return 'primary'
  return 'info'
}
</script>

<style scoped>
.evt {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.evt-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.evt-field {
  width: 180px;
}
.evt-field--range {
  width: 380px;
}
.evt-ops {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  padding-left: 12px;
  border-left: 1px solid var(--el-border-color-lighter);
}
@media (max-width: 900px) {
  .evt-field,
  .evt-field--range {
    width: 100%;
  }
  .evt-ops {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
  }
}

.evt-panel {
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.evt-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.evt-panel__bar {
  width: 6px;
  height: 16px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.evt-panel__count {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.evt-mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12.5px;
}
.evt-chip {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-text-color-primary) 6%, transparent);
}
.evt-panel :deep(.el-table th.el-table__cell) {
  background: transparent !important;
  color: var(--el-text-color-secondary);
  font-weight: 600;
}
</style>
