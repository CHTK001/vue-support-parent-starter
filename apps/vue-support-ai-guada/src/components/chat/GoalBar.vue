<template>
  <div v-if="goal" class="goal-bar" :class="{ 'goal-bar--paused': goal.state === 'PAUSED' }">
    <!-- 目标图标（内联 SVG，避免为一个小图标引入图标依赖） -->
    <span class="goal-bar__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    </span>

    <span class="goal-bar__title" :title="tooltip">{{ goal.title }}</span>

    <span class="goal-bar__state">{{ stateLabel(goal.state) }}</span>
    <span v-if="goal.tokensUsed > 0" class="goal-bar__tokens">{{ formatTokens(goal.tokensUsed) }}</span>

    <button v-if="pausable" type="button" class="goal-bar__action" @click.stop="onPause">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
        <rect x="6" y="5" width="4" height="14" rx="1" />
        <rect x="14" y="5" width="4" height="14" rx="1" />
      </svg>
      <span>暂停</span>
    </button>
    <button v-else-if="resumable" type="button" class="goal-bar__action" @click.stop="onResume">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
        <path d="M8 5.5v13l11-6.5z" />
      </svg>
      <span>继续</span>
    </button>

    <button v-if="!isTerminal" type="button" class="goal-bar__close" title="取消目标" aria-label="取消目标"
      @click.stop="onCancel">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  </div>

  <!-- 无目标时：提供添加入口（会话添加目标） -->
  <button v-else-if="sessionId" type="button" class="goal-add" @click.stop="onAdd">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
    <span>添加目标</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessageBox } from 'element-plus'
import { useGoalStore } from '@/stores/goal'

const props = defineProps<{
  /** 会话标识；缺省时不渲染目标条 */
  sessionId?: string | null
}>()

const goalStore = useGoalStore()
// 注意：storeToRefs 只提取 state/getter；stateLabel/formatTokens 是普通函数，
// 必须直接从 store 解构，否则模板里会是 undefined 并抛 render error。
const { goalOf } = storeToRefs(goalStore)
const { stateLabel, formatTokens } = goalStore

/**
 * 当前会话的目标。
 */
const goal = computed(() => goalOf.value(props.sessionId))

/**
 * 悬停提示：标题较长时给出完整标题 + 说明 + 轮次。
 */
const tooltip = computed(() => {
  const current = goal.value
  if (!current) {
    return ''
  }
  const parts = [current.title]
  if (current.detail) {
    parts.push(current.detail)
  }
  if (current.rounds > 0) {
    parts.push(`已执行 ${current.rounds} 轮`)
  }
  return parts.join('\n')
})

/**
 * 是否可暂停（进行中/待开始）。
 */
const pausable = computed(() => {
  const state = goal.value?.state
  return state === 'RUNNING' || state === 'PENDING'
})

/**
 * 是否可恢复（已暂停）。
 */
const resumable = computed(() => goal.value?.state === 'PAUSED')

/**
 * 是否已进入终态（终态不再提供取消按钮）。
 * 注意：取消目标会直接销毁整个目标条（内存 + localStorage 都删除），
 * 因此本地不会出现 CANCELED，这里仅做防御性保留。
 */
const isTerminal = computed(() => {
  const state = goal.value?.state
  return state === 'COMPLETED' || state === 'FAILED' || state === 'CANCELED'
})

/**
 * 暂停目标。
 */
async function onPause(): Promise<void> {
  if (props.sessionId) {
    await goalStore.pause(props.sessionId)
  }
}

/**
 * 恢复目标。
 */
async function onResume(): Promise<void> {
  if (props.sessionId) {
    await goalStore.resume(props.sessionId)
  }
}

/**
 * 取消目标。
 */
async function onCancel(): Promise<void> {
  if (props.sessionId) {
    await goalStore.cancel(props.sessionId)
  }
}

/**
 * 添加目标：向用户索取目标描述后写入 store（后端端点未上线时落本地）。
 */
async function onAdd(): Promise<void> {
  if (!props.sessionId) {
    return
  }
  try {
    const { value } = await ElMessageBox.prompt(
      '描述这次会话要达成的目标，AI 会围绕它持续工作，直到完成或被暂停。',
      '添加目标',
      {
        confirmButtonText: '开始',
        cancelButtonText: '取消',
        inputPlaceholder: '例如：把默认角色改成通用并自测通过',
        inputValidator: (input: string) => (!!input && input.trim().length > 0) || '目标不能为空',
      },
    )
    await goalStore.setGoal(props.sessionId, value.trim())
  } catch {
    // 用户取消输入，无需处理
  }
}
</script>

<style scoped>
/* 目标条：输入框上方的常驻条。底色用输入框同族（--color-input-bg）保持同层，
   边界靠 1px 细边框与圆角表达，不加投影——与仓库「容器不加装饰投影」的口径一致。 */
.goal-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 8px;
  padding: 6px 10px;
  border: 1px solid var(--color-input-border, var(--el-border-color));
  border-radius: var(--size-rounded-radius, 16px);
  background: var(--color-input-bg, var(--el-bg-color));
  color: var(--color-text);
  font-size: 13px;
  line-height: 20px;
}

.goal-bar--paused {
  border-color: var(--el-color-warning, #d97706);
}

.goal-bar__icon {
  display: inline-flex;
  flex: 0 0 auto;
  color: var(--el-color-primary);
}

.goal-bar--paused .goal-bar__icon {
  color: var(--el-color-warning, #d97706);
}

.goal-bar__title {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 500;
}

.goal-bar__state {
  flex: 0 0 auto;
  color: var(--el-color-primary);
  font-weight: 600;
}

.goal-bar--paused .goal-bar__state {
  color: var(--el-color-warning, #d97706);
}

.goal-bar__tokens {
  flex: 0 0 auto;
  color: var(--color-text-gray);
}

.goal-bar__action,
.goal-bar__close {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--r-sm, 8px);
  background: transparent;
  color: var(--color-text-gray);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.goal-bar__action:hover,
.goal-bar__close:hover {
  background: var(--color-surface-hover, var(--el-fill-color-light));
  color: var(--color-text);
}

.goal-bar__close {
  padding: 0 6px;
}

/* 无目标时的添加入口：虚线细边框的窄条，不抢输入框的视觉权重 */
.goal-add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  flex: 0 0 auto;
  min-width: 96px;
  white-space: nowrap;
  margin-bottom: 8px;
  padding: 4px 10px;
  border: 1px dashed var(--color-input-border, var(--el-border-color));
  border-radius: var(--size-rounded-radius, 16px);
  background: transparent;
  color: var(--color-text-gray);
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.goal-add:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
</style>
