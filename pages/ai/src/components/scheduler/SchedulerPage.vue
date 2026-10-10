<template>
  <div class="h-full overflow-hidden flex flex-col">
    <PageHeader />
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Tab 头部（固定不滚动） -->
      <div class="shrink-0 px-4 w-full md:max-w-260 md:mx-auto">
        <el-tabs v-model="activeTab" class="scheduler-tabs">
          <el-tab-pane :label="t('scheduler.page.tabConfigured')" name="tasks">
            <template #label>
              <div class="flex items-center gap-1.5">
                <span>{{ t('scheduler.page.tabConfigured') }}</span>
                <span v-if="tasks.length > 0" class="text-xs text-gray-400 dark:text-[#6b6d75]">{{ tasks.length }}</span>
              </div>
            </template>
          </el-tab-pane>
          <el-tab-pane :label="t('scheduler.page.tabTemplates')" name="templates" />
        </el-tabs>
      </div>

      <!-- 内容区（独立滚动） -->
      <div class="flex-1 overflow-auto pb-4" style="scrollbar-gutter: stable both-edges;">
        <div class="py-3 px-4 w-full md:max-w-260 md:mx-auto">
          <!-- 已配置：任务卡片 -->
          <template v-if="activeTab === 'tasks'">
            <!-- 标题区 -->
            <div class="flex items-center justify-between gap-4 mb-8 mt-2">
              <div class="min-w-0">
                <h1 class="text-xl font-bold text-gray-900 dark:text-[#e8e9ed]">{{ t('scheduler.page.title') }}</h1>
                <p class="text-sm text-gray-500 dark:text-[#8b8d95] mt-1">{{ t('scheduler.page.subtitle') }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <el-button @click="loadTasks" :loading="loading">
                  <template #icon><RefreshOutlined /></template>
                  {{ t('scheduler.page.refresh') }}
                </el-button>
                <el-button @click="handleAddTask">
                  <template #icon><AddOutlined /></template>
                  {{ t('scheduler.page.createManual') }}
                </el-button>
                <el-button type="primary" @click="handleCreateInChat">
                  <template #icon><ChatBubbleOutlineOutlined /></template>
                  {{ t('scheduler.page.createInChat') }}
                </el-button>
              </div>
            </div>

            <!-- 任务卡片网格 -->
            <div v-if="tasks.length > 0" class="grid gap-y-4 gap-x-3" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
              <div v-for="task in tasks" :key="task.id"
                class="task-card re-surface re-surface--dense flex flex-col overflow-hidden cursor-pointer"
                @click="handleEditTask(task)">
                <!-- Header: name + schedule -->
                <div class="flex items-center gap-2.5 mb-3">
                  <CardAvatar :name="task.name" />
                  <h3 class="font-semibold text-gray-900 dark:text-[#e8e9ed] truncate flex-1 min-w-0" style="font-size: var(--size-text-sm);">
                    {{ task.name }}
                  </h3>
                  <el-tag effect="plain" class="shrink-0 font-mono">{{ scheduleText(task) }}</el-tag>
                </div>

                <!-- Description: prompt -->
                <div class="text-gray-400 dark:text-[#6b6d75] line-clamp-2 h-[2.5rem]" style="font-size: calc(var(--size-text-base) - 2px);">
                  {{ task.prompt }}
                </div>

                <!-- Meta: 执行目标 + 运行态（后端 state，真实回传） -->
                <div class="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-[#6b6d75] min-w-0">
                  <span class="flex items-center gap-1 shrink-0">
                    <el-icon :size="13"><CalendarTodayOutlined /></el-icon>
                    {{ targetText(task) }}
                  </span>
                  <span class="shrink-0">{{ t('scheduler.page.executionCount', { count: task.state.runCount }) }}</span>
                  <span v-if="task.state.lastRunAt" class="shrink-0">
                    {{ t('scheduler.page.lastRun') }} {{ formatDateTime(task.state.lastRunAt) }}
                  </span>
                </div>

                <!-- Footer: actions + switch -->
                <div class="flex items-center justify-between gap-2 mt-3">
                  <div class="flex items-center gap-2 shrink-0">
                    <el-button link :loading="runningId === task.id" @click.stop="handleRunNow(task)">
                      {{ t('scheduler.page.runNow') }}
                    </el-button>
                    <el-button link @click.stop="handleViewLogs(task)">{{ t('scheduler.page.logs') }}</el-button>
                    <el-button link type="danger" @click.stop="handleDeleteTask(task)">{{ t('scheduler.page.delete') }}</el-button>
                  </div>
                  <el-switch v-model="task.enabled" :active-value="true" :inactive-value="false"
                    :loading="togglingId === task.id" @change="handleToggleTask(task)" @click.stop inline-prompt
                    :active-text="t('scheduler.page.enable')" :inactive-text="t('scheduler.page.disable')" />
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else-if="!loading" class="re-surface p-12 text-center">
              <div class="w-14 h-14 rounded-full bg-gray-100 dark:bg-[#2a2c30] flex items-center justify-center mx-auto mb-4">
                <el-icon :size="28" class="text-gray-400 dark:text-[#6b6d75]">
                  <ScheduleOutlined />
                </el-icon>
              </div>
              <p class="text-sm text-gray-500 dark:text-[#8b8d95]">{{ t('scheduler.page.empty') }}</p>
              <el-button type="primary" class="mt-4" @click="handleAddTask">
                {{ t('scheduler.page.createManual') }}
                <template #icon><ArrowForwardOutlined /></template>
              </el-button>
            </div>
          </template>

          <!-- 任务模板 -->
          <template v-else-if="activeTab === 'templates'">
            <div class="flex items-center justify-between gap-4 mb-8 mt-2">
              <div class="min-w-0">
                <h1 class="text-xl font-bold text-gray-900 dark:text-[#e8e9ed]">{{ t('scheduler.page.templatesTitle') }}</h1>
                <p class="text-sm text-gray-500 dark:text-[#8b8d95] mt-1">{{ t('scheduler.page.templatesSubtitle') }}</p>
              </div>
            </div>
            <div class="re-surface p-12 text-center">
              <div class="w-14 h-14 rounded-full bg-gray-100 dark:bg-[#2a2c30] flex items-center justify-center mx-auto mb-4">
                <el-icon :size="28" class="text-gray-400 dark:text-[#6b6d75]">
                  <DashboardOutlined />
                </el-icon>
              </div>
              <p class="text-sm text-gray-500 dark:text-[#8b8d95]">{{ t('scheduler.page.templatesInProgress') }}</p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>

  <!-- 新建/编辑任务弹窗 -->
  <TaskEditDialog v-model="showEditDialog" :is-edit="isEditMode" :task="currentTask" :cron-presets="cronPresets"
    @save="handleSaveTask" />

  <!-- 运行记录抽屉 -->
  <TaskLogDrawer v-model="showLogDrawer" :task="currentTask" :runs="taskRuns" :loading="logsLoading"
    @refresh="() => loadTaskRuns()" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElButton, ElTag, ElSwitch, ElIcon, ElTabs, ElTabPane } from 'element-plus'
import {
  AddOutlined,
  RefreshOutlined,
  ScheduleOutlined,
  CalendarTodayOutlined,
  ChatBubbleOutlineOutlined,
  ArrowForwardOutlined,
  DashboardOutlined
} from '@vicons/material'
import PageHeader from '@/components/PageHeader.vue'
import { apiService } from '../../services/ApiService'
import { usePopup } from '../../composables/usePopup'
import { usePrefillInput } from '../../composables/usePrefillInput'
import CardAvatar from '@/components/ui/CardAvatar.vue'
import type { ScheduledTask, ScheduledTaskForm, ScheduledTaskRun } from '../../types/scheduler'
import TaskEditDialog from './TaskEditDialog.vue'
import TaskLogDrawer from './TaskLogDrawer.vue'

const router = useRouter()
const { t } = useI18n()
const { setPrefill } = usePrefillInput()
const { toast, confirm } = usePopup()

const activeTab = ref<string>('tasks')

// 任务列表
const tasks = ref<ScheduledTask[]>([])
const loading = ref(false)
// 单次操作进行中的任务标识（立即执行 / 启停）
const runningId = ref<string | null>(null)
const togglingId = ref<string | null>(null)

// 弹窗状态
const showEditDialog = ref(false)
const isEditMode = ref(false)
const currentTask = ref<ScheduledTask | null>(null)

// 运行记录抽屉状态
const showLogDrawer = ref(false)
const taskRuns = ref<ScheduledTaskRun[]>([])
const logsLoading = ref(false)

// Cron 预设（GET /api/cron/jobs/cron-presets）
const cronPresets = ref<{ label: string; value: string }[]>([])

/**
 * 加载任务列表（GET /api/cron/jobs）
 */
async function loadTasks() {
  loading.value = true
  try {
    tasks.value = await apiService.fetchScheduledTasks()
  } catch (err: any) {
    console.error('加载定时任务失败:', err)
    toast.error(err.message || t('scheduler.page.loadFailed'))
  } finally {
    loading.value = false
  }
}

/**
 * 加载 Cron 预设（GET /api/cron/jobs/cron-presets）
 */
async function loadCronPresets() {
  try {
    cronPresets.value = await apiService.fetchCronPresets()
  } catch (err: any) {
    console.error('加载 Cron 预设失败:', err)
  }
}

/**
 * 加载任务运行记录（GET /api/cron/jobs/{id}/runs）
 */
async function loadTaskRuns(taskId?: string) {
  const id = taskId || currentTask.value?.id
  if (!id) return
  logsLoading.value = true
  try {
    taskRuns.value = await apiService.fetchScheduledTaskRuns(id)
  } catch (err: any) {
    console.error('加载任务运行记录失败:', err)
    toast.error(err.message || t('scheduler.page.loadLogsFailed'))
  } finally {
    logsLoading.value = false
  }
}

/**
 * 新建任务
 */
function handleAddTask() {
  isEditMode.value = false
  currentTask.value = null
  showEditDialog.value = true
}

/**
 * 在对话中创建任务 — 跳转到新建会话页面并预填模板文本
 */
function handleCreateInChat() {
  const template = t('scheduler.page.chatTemplate')
  setPrefill(template)
  router.push({ name: 'Chat', params: { sessionId: 'new-session' } })
}

/**
 * 编辑任务
 */
function handleEditTask(task: ScheduledTask) {
  isEditMode.value = true
  currentTask.value = { ...task }
  showEditDialog.value = true
}

/**
 * 保存任务（POST / PUT /api/cron/jobs/{id}）
 */
async function handleSaveTask(data: ScheduledTaskForm) {
  try {
    if (isEditMode.value && currentTask.value) {
      await apiService.updateScheduledTask(currentTask.value.id, data)
      toast.success(t('common.updateSuccess'))
    } else {
      await apiService.createScheduledTask(data)
      toast.success(t('common.createSuccess'))
    }
    showEditDialog.value = false
    await loadTasks()
  } catch (err: any) {
    console.error('保存任务失败:', err)
    toast.error(err.message || t('scheduler.page.saveFailed'))
  }
}

/**
 * 删除任务（DELETE /api/cron/jobs/{id}）
 */
async function handleDeleteTask(task: ScheduledTask) {
  try {
    const confirmed = await confirm(t('scheduler.page.deleteTitle'), t('scheduler.page.deleteConfirm', { name: task.name }))
    if (!confirmed) return

    await apiService.deleteScheduledTask(task.id)
    tasks.value = tasks.value.filter(t => t.id !== task.id)
    toast.success(t('common.deleteSuccess'))
  } catch (err: any) {
    if (err !== 'cancelled') {
      console.error('删除任务失败:', err)
      toast.error(err.message || t('common.deleteFailed'))
    }
  }
}

/**
 * 启停任务：后端无独立 toggle 路由，走 PUT /api/cron/jobs/{id} 的 enabled 键
 */
async function handleToggleTask(task: ScheduledTask) {
  togglingId.value = task.id
  const next = task.enabled
  try {
    const updated = await apiService.updateScheduledTask(task.id, { enabled: next })
    const index = tasks.value.findIndex(t => t.id === task.id)
    if (index >= 0) tasks.value[index] = updated
    toast.success(next ? t('common.enabled') : t('common.disabled'))
  } catch (err: any) {
    console.error('切换状态失败:', err)
    toast.error(err.message || t('scheduler.page.toggleFailed'))
    task.enabled = !next
  } finally {
    togglingId.value = null
  }
}

/**
 * 立即执行一次（POST /api/cron/jobs/{id}/run），后端返回本次执行新建的 conversation_id
 */
async function handleRunNow(task: ScheduledTask) {
  runningId.value = task.id
  try {
    const result = await apiService.runScheduledTask(task.id)
    toast.success(result.conversationId
      ? t('scheduler.page.runNowSuccess', { id: result.conversationId })
      : t('scheduler.page.runNowSuccessNoConversation'))
    const updated = await apiService.fetchScheduledTask(task.id)
    const index = tasks.value.findIndex(t => t.id === task.id)
    if (updated && index >= 0) tasks.value[index] = updated
  } catch (err: any) {
    console.error('立即执行失败:', err)
    toast.error(err.message || t('scheduler.page.runNowFailed'))
  } finally {
    runningId.value = null
  }
}

/**
 * 查看运行记录
 */
function handleViewLogs(task: ScheduledTask) {
  currentTask.value = task
  taskRuns.value = []
  showLogDrawer.value = true
  loadTaskRuns(task.id)
}

/**
 * 调度文案：kind=every 显示间隔，否则显示 cron 表达式
 */
function scheduleText(task: ScheduledTask): string {
  const schedule = task.schedule
  if (schedule.kind === 'every') {
    const minutes = Math.round((schedule.every_ms || 0) / 60000)
    return minutes >= 60
      ? t('scheduler.page.everyHours', { hours: Math.round(minutes / 60) })
      : t('scheduler.page.everyMinutes', { minutes: minutes || 0 })
  }
  return schedule.cron || schedule.description || '-'
}

/**
 * 执行目标：后端只有 execution_mode 自由串，真正生效的是 metadata.conversation_id
 */
function targetText(task: ScheduledTask): string {
  return task.conversationId ? t('scheduler.page.targetExistingSession') : t('scheduler.page.targetNewSession')
}

/**
 * 毫秒时间戳格式化（后端 created_at / last_run_at_ms 为 epoch millis）
 */
function formatDateTime(value: number | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadTasks()
  loadCronPresets()
})
</script>

<style scoped>
.scheduler-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.scheduler-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

.scheduler-tabs :deep(.el-tabs__item) {
  padding: 0 18px;
  height: 44px;
  line-height: 44px;
  font-size: 14px;
}
</style>
