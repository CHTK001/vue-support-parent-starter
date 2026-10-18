<template>
  <section class="rt">
    <header class="rt__head">
      <div class="rt__title">
        <span class="rt__dot" />
        <span>{{ title || '操作时间轴' }}</span>
      </div>
      <div class="rt__ops">
        <span class="rt__count">{{ items.length }} 条</span>
        <ReButton icon="RefreshRight" layout="square" tip="刷新时间轴" @click="emit('refresh')" />
      </div>
    </header>

    <div class="rt__body">
      <el-timeline v-if="items.length">
        <el-timeline-item
          v-for="item in items"
          :key="item.id"
          :timestamp="item.time"
          placement="top"
          :type="item.type"
          size="normal"
        >
          <div class="rt__content">{{ item.content }}</div>
        </el-timeline-item>
      </el-timeline>
      <ReEmpty v-else description="暂无操作记录" :image-size="62" />
    </div>
  </section>
</template>

<script setup lang="ts">
import ReButton from '@repo/ui/re-button'
import ReEmpty from '@repo/ui/re-empty'
import type { TimelineItem } from '../types/device'

defineProps<{
  title?: string
  items: TimelineItem[]
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()
</script>

<style scoped>
.rt {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px 6px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.rt__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.rt__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.rt__dot {
  width: 6px;
  height: 16px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.rt__ops {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.rt__count {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.rt__body {
  padding: 10px 0 8px;
}
.rt__body :deep(.el-timeline) {
  padding-left: 4px;
}
.rt__body :deep(.el-timeline-item__timestamp) {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.rt__content {
  font-size: 13.5px;
  color: var(--el-text-color-primary);
}
</style>
