<!-- components/KnowledgeBasePage/UploadTaskModal.vue -->
<template>
  <ReDialog v-model="visible" :title="t('knowledge.uploadTask.title')" :width="600" :close-on-click-modal="false">
    <!-- 上传任务列表 -->
    <div v-if="uploadTasks.length > 0" class="space-y-3 max-h-[400px] overflow-y-auto">
      <div
        v-for="task in uploadTasks"
        :key="task.id"
        class="re-surface re-surface--dense re-surface--hover flex flex-col"
      >
        <!-- 文件信息 + 状态 -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <el-icon size="16" class="text-[var(--rm-text-secondary)] shrink-0"><Document /></el-icon>
            <span class="text-sm text-[var(--rm-text)] truncate" :title="task.fileName">{{ task.fileName }}</span>
          </div>
          <ReTag :type="getStatusType(task.processingStatus)" size="small" class="shrink-0">
            {{ getStatusText(task.processingStatus) }}
          </ReTag>
        </div>

        <!-- 进度条 -->
        <div v-if="task.processingStatus === 'uploading' || task.processingStatus === 'processing'" class="mt-2">
          <el-progress :percentage="task.progressPercentage" :stroke-width="6" />
          <div v-if="task.currentStep" class="mt-1 text-xs text-[var(--rm-text-secondary)]">
            {{ task.currentStep }}
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="task.processingStatus === 'failed' && task.errorMessage" class="mt-2">
          <div class="text-xs p-2 rounded-[var(--rm-radius-sm,6px)] bg-[var(--rm-bg-subtle)] border border-[var(--rm-danger)] text-[var(--rm-danger)]">
            {{ task.errorMessage }}
          </div>
        </div>

        <!-- 失败操作 -->
        <div v-if="task.processingStatus === 'failed'" class="mt-2 flex justify-end gap-2">
          <ReButton type="default" @click="emit('retry', task)">{{ t('common.retry') }}</ReButton>
          <ReButton type="danger" @click="emit('delete', task)">{{ t('common.delete') }}</ReButton>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <ReEmpty v-else :text="t('knowledge.uploadTask.empty')" />
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 上传任务弹框。
 *
 * <p>风格与系统一致：外壳用仓库标准 {@code ReDialog}（koi，标题栏可拖拽）；每条任务用组件库基线
 * {@code re-surface}（含 hover 态），状态标签与按钮用 {@code ReTag} / {@code ReButton}，
 * 空态用 {@code ReEmpty}；颜色只用 koi 令牌 {@code --rm-*} —— 原先的
 * {@code border-gray-200} / {@code dark:border-gray-800} / {@code hover:bg-gray-50} /
 * {@code dark:hover:bg-[#2a2c30]} / {@code text-gray-*} / {@code dark:text-gray-400} /
 * {@code dark:text-gray-600} / {@code text-red-600 dark:text-red-400} 等已全部移除。</p>
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Document } from '@element-plus/icons-vue'
import type { KBFile } from '@/stores/knowledgeBase'
import ReDialog from '@repo/ui/re-dialog'
import ReTag from '@/components/ui/ReTag.vue'
import ReButton from '@/components/ui/ReButton.vue'
import ReEmpty from '@/components/ui/ReEmpty.vue'

/** 组件属性 */
interface Props {
  /** 是否显示（v-model） */
  modelValue: boolean
  /** 上传任务列表 */
  uploadTasks: KBFile[]
}

const props = defineProps<Props>()

const { t } = useI18n()

const emit = defineEmits<{
  /** 同步显示状态 */
  (e: 'update:modelValue', value: boolean): void
  /** 重试某条任务 */
  (e: 'retry', task: KBFile): void
  /** 删除某条任务 */
  (e: 'delete', task: KBFile): void
}>()

/** 弹框显隐 */
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

/** 关闭弹框 */
function handleClose() {
  visible.value = false
}

/**
 * 状态对应的标签类型。
 *
 * @param status 处理状态
 * @returns 标签类型
 */
function getStatusType(status: string): 'primary' | 'success' | 'info' | 'warning' | 'danger' {
  const types: Record<string, 'primary' | 'success' | 'info' | 'warning' | 'danger'> = {
    'queued': 'info',
    'uploading': 'warning',
    'uploaded': 'success',
    'completed': 'success',
    'failed': 'danger',
  }
  return types[status] || 'info'
}

/**
 * 状态对应的展示文案。
 *
 * @param status 处理状态
 * @returns 展示文案
 */
function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    'queued': t('knowledge.status.queuedShort'),
    'uploading': t('knowledge.status.uploading'),
    'uploaded': t('knowledge.status.uploadedShort'),
    'failed': t('knowledge.status.failed'),
  }
  return texts[status] || status
}
</script>