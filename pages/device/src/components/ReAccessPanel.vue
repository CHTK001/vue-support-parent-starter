<template>
  <div class="acc">
    <!-- 门禁点位 -->
    <section class="acc-panel">
      <header class="acc-panel__head">
        <span class="acc-panel__bar" />
        <span>门禁点位</span>
        <span class="acc-panel__count">{{ doors.length }}</span>
      </header>

      <div v-if="doors.length" class="acc-doors">
        <article v-for="door in doors" :key="door.deviceDoorNo" class="acc-door">
          <div class="acc-door__main">
            <span class="acc-door__icon">
              <el-icon><Lock /></el-icon>
            </span>
            <div class="acc-door__text">
              <span class="acc-door__name">{{ door.deviceDoorName || `门 ${door.deviceDoorNo}` }}</span>
              <span class="acc-door__meta">编号 {{ door.deviceDoorNo }}</span>
            </div>
          </div>
          <div class="acc-door__ops">
            <ReTag :type="doorStatusType(door.deviceDoorStatus)" size="small">
              {{ door.deviceDoorStatus || '未知' }}
            </ReTag>
            <ReButton icon="Unlock" :show-text="true" type="primary" @click="emit('unlock', door.deviceDoorNo)">
              远程开门
            </ReButton>
          </div>
        </article>
      </div>
      <ReEmpty v-else description="该设备未挂载门禁点位" :image-size="70" />
    </section>

    <!-- 门禁事件 -->
    <section class="acc-panel">
      <header class="acc-panel__head">
        <span class="acc-panel__bar" />
        <span>门禁事件</span>
        <span class="acc-panel__count">{{ events.length }}</span>
        <div class="acc-panel__ops">
          <ReButton icon="RefreshRight" layout="square" tip="刷新门禁事件" @click="emit('refresh')" />
        </div>
      </header>

      <ReTable
        v-if="events.length"
        :data="eventRows as unknown as Record<string, unknown>[]"
        :columns="accessEventColumns"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :layout-table="{ minHeight: 0 }"
        :settings="{ border: false }"
        style="width: 100%"
      >
        <template #col-photo="{ row }">
          <el-image
            v-if="row.photoUrl"
            :src="String(row.photoUrl)"
            :preview-src-list="[String(row.photoUrl)]"
            :preview-teleported="true"
            :hide-on-click-modal="true"
            fit="cover"
            class="acc-photo"
          >
            <template #error>
              <span class="acc-photo__none" title="抓拍加载失败"><el-icon><Picture /></el-icon></span>
            </template>
          </el-image>
          <span v-else class="acc-photo__none" title="厂商未回传抓拍"><el-icon><Picture /></el-icon></span>
        </template>
        <template #col-time="{ row }">
          <span class="acc-mono">{{ row.time }}</span>
        </template>
        <template #col-direction="{ row }">
          <ReTag
            :type="row.directionKey === 'in' ? 'primary' : row.directionKey === 'out' ? 'warning' : 'info'"
            size="small"
            effect="plain"
          >
            {{ row.directionLabel }}
          </ReTag>
        </template>
        <template #col-eventType="{ row }">
          <ReTag type="primary" size="small">{{ row.eventType || '—' }}</ReTag>
        </template>
      </ReTable>
      <ReEmpty v-else description="近 24 小时无门禁事件" :image-size="70" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Lock, Picture } from '@element-plus/icons-vue'
import ReButton from '@repo/ui/re-button'
import ReEmpty from '@repo/ui/re-empty'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
import ReTag from '@repo/ui/re-tag'
import type { DeviceDoor, AccessEvent } from '../types/device'
import { directionOf } from '../utils/accessDirection'

/**
 * 列配置：原模板 4 个 el-table-column 收敛到数组。
 * 标题是静态文案（无 t()），普通常量即可。
 */
const accessEventColumns: ReTableColumn[] = [
  { prop: 'photoUrl', label: '抓拍', width: 76, slot: 'photo', align: 'center' },
  { prop: 'time', label: '时间', width: 190, slot: 'time' },
  { prop: 'doorName', label: '门', minWidth: 120 },
  { prop: 'directionLabel', label: '方向', width: 88, slot: 'direction', align: 'center' },
  { prop: 'eventType', label: '事件类型', width: 150, slot: 'eventType' },
  { prop: 'cardNo', label: '卡号', minWidth: 140 },
]

const props = defineProps<{
  doors: DeviceDoor[]
  events: AccessEvent[]
}>()

/**
 * 事件表行：方向归一后展示。
 *
 * 归一口径与门禁记录页共用 @/utils/accessDirection，避免同一份记录两处显示不一致。
 */
const eventRows = computed(() =>
  props.events.map((e) => {
    const dir = directionOf(e.direction)
    return { ...e, directionKey: dir.key, directionLabel: dir.label }
  }),
)

const emit = defineEmits<{
  (e: 'unlock', doorId: number): void
  (e: 'refresh'): void
}>()

/** 门状态 → 标签色（后端状态是自由字符串，未知一律灰） */
function doorStatusType(status?: string): 'success' | 'warning' | 'danger' | 'info' {
  const s = (status || '').toLowerCase()
  if (['open', 'normal', 'online', 'idle', 'closed'].includes(s)) return 'success'
  if (['alarm', 'forced', 'held'].includes(s)) return 'danger'
  if (['offline', 'unknown'].includes(s)) return 'warning'
  return 'info'
}
</script>

<style scoped>
.acc {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.acc-panel {
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.acc-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.acc-panel__bar {
  width: 6px;
  height: 16px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.acc-panel__count {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.acc-panel__ops {
  margin-left: auto;
}
.acc-doors {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}
.acc-door {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-text-color-primary) 2.5%, transparent);
  transition: box-shadow 0.16s ease, border-color 0.16s ease;
}
.acc-door:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: var(--el-box-shadow-light);
}
.acc-door__main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.acc-door__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: none;
  border-radius: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.acc-door__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.acc-door__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.acc-door__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.acc-door__ops {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.acc-mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12.5px;
}
/* 抓拍缩略图：点开看大图 */
.acc-photo {
  display: block;
  width: 48px;
  height: 36px;
  margin: 0 auto;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  background: color-mix(in srgb, var(--el-text-color-primary) 4%, transparent);
  cursor: zoom-in;
}
.acc-photo__none {
  display: grid;
  place-items: center;
  width: 48px;
  height: 36px;
  margin: 0 auto;
  border-radius: 6px;
  border: 1px dashed var(--el-border-color);
  color: var(--el-text-color-placeholder);
  font-size: 15px;
}
.acc-panel :deep(.el-table th.el-table__cell) {
  background: transparent !important;
  color: var(--el-text-color-secondary);
  font-weight: 600;
}
</style>
