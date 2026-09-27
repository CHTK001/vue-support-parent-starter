<template>
  <!--
    结果行的「基本信息」面板。
    进行中行与结果行共用本组件，保证两边字段、顺序、样式完全一致。
  -->
  <aside class="wg-row-info">
    <span class="wg-badge" :class="badgeClass">{{ badgeText }}</span>
    <p v-if="task.prompt" class="wg-row-title" :title="task.prompt">{{ task.prompt }}</p>
    <div class="wg-info-grid">
      <span class="wg-info-k">模型</span>
      <span class="wg-info-v">{{ modelLabel(task.model) }}</span>
      <span class="wg-info-k">宽高</span>
      <span class="wg-info-v">{{ task.size || '—' }}</span>
      <span class="wg-info-k">张数</span>
      <span class="wg-info-v">{{ task.count ?? 1 }} 张</span>
      <span class="wg-info-k">风格</span>
      <span class="wg-info-v">{{ task.style || '无' }}</span>
      <template v-if="task.type === 'video'">
        <span class="wg-info-k">时长</span>
        <span class="wg-info-v">{{ task.duration ? `${task.duration}s` : '—' }}</span>
      </template>
      <span class="wg-info-k">{{ running ? '进度' : '耗时' }}</span>
      <span class="wg-info-v">
        <template v-if="running">{{ task.progress ?? 0 }}%</template>
        <template v-else>{{ formatElapsed(task.elapsedMillis) }}</template>
      </span>
      <template v-if="running">
        <span class="wg-info-k">已耗时</span>
        <span class="wg-info-v">{{ formatElapsed(runningElapsed(task)) }}</span>
      </template>
      <span class="wg-info-k">时间</span>
      <span class="wg-info-v">{{ formatTime(task.createdAt) }}</span>
      <template v-if="task.referenceImage">
        <span class="wg-info-k">参考图</span>
        <span class="wg-info-v">
          <img :src="task.referenceImage" class="wg-info-thumb" alt="参考图" />
        </span>
      </template>
      <template v-if="task.errorMessage">
        <span class="wg-info-k">错误</span>
        <span class="wg-info-v">{{ task.errorMessage }}</span>
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GenerateTask, GenerateTaskStatus } from '../../services/modules/generate.api'

const props = defineProps<{
  task: GenerateTask
  /** 进行中：展示实时进度而非最终耗时 */
  running?: boolean
  modelLabel: (model: string) => string
  formatElapsed: (value: number | null) => string
  formatTime: (value: number | null) => string
}>()

/** 进行中任务没有后端耗时，用「现在 - 创建时间」实时估算 */
const runningElapsed = (task: GenerateTask) => {
  if (task.elapsedMillis !== null && task.elapsedMillis !== undefined) {
    return task.elapsedMillis
  }
  if (!task.createdAt) {
    return null
  }
  return Math.max(0, Date.now() - task.createdAt)
}

const badgeText = computed(() => {  const map: Record<GenerateTaskStatus, string> = {
    PENDING: '排队中',
    RUNNING: '生成中',
    SUCCESS: '已完成',
    FAILED: '失败',
    CANCELED: '已取消',
  }
  return map[props.task.status] ?? props.task.status
})

const badgeClass = computed(() => {
  if (props.task.status === 'SUCCESS') {
    return 'is-success'
  }
  if (props.task.status === 'FAILED') {
    return 'is-danger'
  }
  if (props.task.status === 'CANCELED') {
    return 'is-info'
  }
  return 'is-primary'
})
</script>

<style scoped>
/*
 * 基本信息面板：进行中行与结果行共用，样式随组件走。
 * 高度锁定为 --wg-media-h，与左侧图片严格等高（父级用 align-items: stretch 传递）。
 */
.wg-row-info {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  gap: 6px;
  align-self: stretch;
  min-width: 0;
  height: var(--wg-media-h, 212px);
  padding: 12px 14px;
  border-radius: var(--size-rounded-radius);
  background: var(--color-input-bg);
  overflow: hidden;
}

/* 状态徽标：与会话胶囊标签同族 */
.wg-badge {
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: var(--el-radius-full);
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
}

.wg-badge.is-success {
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
  color: var(--el-color-success);
}

.wg-badge.is-danger {
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
  color: var(--el-color-danger);
}

.wg-badge.is-info {
  background: var(--color-sidebar-bg-hover);
  color: var(--color-text-gray);
}

.wg-badge.is-primary {
  background: var(--color-sidebar-bg-active);
  color: var(--color-primary);
}

/* 提示词标题限 1 行，保证面板高度稳定、与图片严格对齐 */
.wg-row-title {
  margin: 0;
  overflow: hidden;
  color: var(--color-text);
  font-size: var(--size-text-base, 14px);
  font-weight: 500;
  line-height: 1.6;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wg-info-grid {
  display: grid;
  flex: 1;
  align-content: start;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 3px 12px;
  margin: 0;
  overflow: hidden;
}

.wg-info-k {
  color: var(--color-text-gray);
  font-size: 12px;
  white-space: nowrap;
}

.wg-info-v {
  overflow: hidden;
  color: var(--color-text);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wg-info-thumb {
  width: 32px;
  height: 32px;
  border-radius: var(--size-dialog-rounded-radius);
  object-fit: cover;
}
</style>
