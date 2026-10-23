<template>
  <el-drawer v-model="drawerVisible" :title="drawerTitle" size="480px" destroy-on-close>
    <div class="flex flex-col h-full">
      <!-- 头部操作 -->
      <div class="flex justify-between items-center mb-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ t('scheduler.log.count', { count: runs.length }) }}
        </div>
        <el-button @click="handleRefresh" :loading="loading">
          <template #icon>
            <RefreshOutlined />
          </template>
          {{ t('scheduler.log.refresh') }}
        </el-button>
      </div>

      <!-- 任务运行态汇总：来自 GET /api/cron/jobs 的 state 字段（真实回传），统一用 ReStatCard 呈现 -->
      <div v-if="task" class="grid grid-cols-2 gap-2.5 mb-4">
        <ReStatCard
          :title="t('scheduler.log.runCount')"
          :value="task.state.runCount"
          :icon="PlayCircleFilled"
          icon-color="var(--color-primary)"
        />
        <ReStatCard
          :title="t('scheduler.log.lastStatus')"
          :value="task.state.lastStatus || '-'"
          :icon="lastStatusIcon"
          :icon-color="lastStatusColor"
        />
        <ReStatCard
          :title="t('scheduler.log.lastRunAt')"
          :value="formatDateTime(task.state.lastRunAt)"
          :icon="HourglassEmptyFilled"
          icon-color="var(--color-text-gray)"
        />
        <ReStatCard
          :title="t('scheduler.log.nextRunAt')"
          :value="formatDateTime(task.state.nextRunAt)"
          :icon="ScheduleFilled"
          icon-color="var(--color-primary)"
        />
        <!-- 上次失败原因没有独立指标位，并到"上次状态"卡片下方，避免丢失运维关键信息 -->
        <div v-if="task.state.lastError" class="col-span-2 run-item__error">
          {{ task.state.lastError }}
        </div>
      </div>

      <!-- 运行记录列表：GET /api/cron/jobs/{id}/runs（后端内存实现，恒返回空列表） -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="runs.length > 0" class="space-y-3">
          <div v-for="run in runs" :key="run.id" class="re-surface re-surface--dense">
            <div class="flex items-center justify-between mb-2">
              <el-tag :type="getStatusType(run.status)" effect="light">
                {{ getStatusLabel(run.status) }}
              </el-tag>
              <span class="text-xs text-(--color-text-gray)">
                {{ formatDateTime(run.startedAt) }}
              </span>
            </div>

            <div v-if="run.conversationId" class="text-xs text-(--color-text-gray) mb-1">
              {{ t('scheduler.log.session') }}: {{ run.conversationId }}
            </div>

            <div v-if="run.error" class="run-item__error">
              {{ run.error }}
            </div>

            <div v-if="run.finishedAt" class="text-xs text-(--color-text-gray) mt-2">
              {{ t('scheduler.log.finishedAt') }}: {{ formatDateTime(run.finishedAt) }}
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="py-12 text-center text-(--color-text-gray)">
          <el-icon size="48" class="mb-3 opacity-50">
            <InboxOutlined />
          </el-icon>
          <div>{{ t('scheduler.log.empty') }}</div>
          <div class="text-sm mt-2">{{ t('scheduler.log.emptyHint') }}</div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
/* 运行记录条目直接用组件库基线 re-surface（ReStatCard 规格），此处只留错误条：
   底色用 color-mix 与表面色融合，避免硬编码表面色 */
.run-item__error {
  margin-top: 8px;
  padding: 8px;
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  font-size: 12px;
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElDrawer, ElTag, ElButton, ElIcon } from 'element-plus'
import { RefreshOutlined, InboxOutlined } from '@vicons/material'
import {
  CheckCircleFilled,
  ErrorFilled,
  HourglassEmptyFilled,
  PendingActionsFilled,
  PlayCircleFilled,
  ScheduleFilled,
} from '@vicons/material'
import ReStatCard from '@repo/ui/re-stat-card'
import type { ScheduledTask, ScheduledTaskRun } from '../../types/scheduler'

interface Props {
  modelValue: boolean
  task: ScheduledTask | null
  runs: ScheduledTaskRun[]
  loading: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'refresh': []
}>()

const { t } = useI18n()

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const drawerTitle = computed(() => {
  return props.task ? t('scheduler.log.titleWithTask', { name: props.task.name }) : t('scheduler.log.title')
})

/** 上次状态的图标与配色（与运行记录条目的状态色保持同一套语义） */
const lastStatusIcon = computed(() => {
  switch (props.task?.state.lastStatus) {
    case 'completed':
    case 'ok':
      return CheckCircleFilled
    case 'failed':
    case 'error':
      return ErrorFilled
    case 'running':
      return PendingActionsFilled
    default:
      return HourglassEmptyFilled
  }
})

const lastStatusColor = computed(() => {
  switch (props.task?.state.lastStatus) {
    case 'completed':
    case 'ok':
      return 'var(--color-success, #67c23a)'
    case 'failed':
    case 'error':
      return 'var(--color-error, #f56c6c)'
    case 'running':
      return 'var(--color-primary)'
    default:
      return 'var(--color-text-gray)'
  }
})

/**
 * 获取状态标签类型
 */
function getStatusType(status: string): 'primary' | 'success' | 'info' | 'warning' | 'danger' {
  switch (status) {
    case 'completed':
    case 'ok':
      return 'success'
    case 'running':
      return 'primary'
    case 'failed':
    case 'error':
      return 'danger'
    case 'pending':
    default:
      return 'info'
  }
}

/**
 * 获取状态显示文本
 */
function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
    case 'ok':
      return t('scheduler.log.statusCompleted')
    case 'running':
      return t('scheduler.log.statusRunning')
    case 'failed':
    case 'error':
      return t('scheduler.log.statusFailed')
    case 'pending':
      return t('scheduler.log.statusPending')
    default:
      return status
  }
}

/**
 * 格式化毫秒时间戳（后端 runs 的时间字段为 epoch millis）
 */
function formatDateTime(value: number | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 刷新运行记录
 */
function handleRefresh() {
  emit('refresh')
}
</script>
