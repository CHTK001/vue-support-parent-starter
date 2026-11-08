<template>
  <div v-if="goal" class="goal-bar" :class="stateClass">
    <!-- 目标图标：与输入条上的「目标」按钮同形（靶心 + 一支扎进去的箭），
         颜色随状态走 —— 进行中主色、已暂停警示色、完成成功色。 -->
    <span class="goal-bar__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11.4" cy="12.6" r="7.4" />
        <circle cx="11.4" cy="12.6" r="2.8" />
        <path d="M15.6 8.4 21 3" />
        <path d="M21 3h-3.4M21 3v3.4" />
      </svg>
    </span>

    <span class="goal-bar__title" :title="tooltip">{{ goal.title }}</span>

    <span class="goal-bar__state">{{ stateLabel(goal.state) }}</span>

    <button v-if="pausable" type="button" class="goal-bar__action" title="暂停目标" @click.stop="onPause">
      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
        <rect x="6" y="5" width="4" height="14" rx="1" />
        <rect x="14" y="5" width="4" height="14" rx="1" />
      </svg>
      <span>暂停</span>
    </button>
    <button v-else-if="resumable" type="button" class="goal-bar__action" title="继续目标" @click.stop="onResume">
      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
        <path d="M8 5.5v13l11-6.5z" />
      </svg>
      <span>继续</span>
    </button>

    <!-- 取消是低频且有破坏性的动作：平时不占视觉，悬停 / 键盘聚焦才出现 -->
    <button v-if="!isTerminal" type="button" class="goal-bar__close" title="取消目标" aria-label="取消目标"
      @click.stop="onCancel">
      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * 会话目标条：输入卡上方的一行状态条。
 *
 * <p>形态对齐目标 UI：靶心图标 + 目标标题 + 状态 + 暂停/继续，取消按钮悬停才出现。
 * 「添加目标」的入口已经收进输入卡工具条（ChatInput 的目标按钮），
 * 所以这里不再渲染那条虚线窄条 —— 没有目标时整块不占高度。</p>
 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGoalStore } from '@/stores/goal'

const props = defineProps<{
  /** 会话标识；缺省时不渲染目标条 */
  sessionId?: string | null
}>()

const goalStore = useGoalStore()
// 注意：storeToRefs 只提取 state/getter；stateLabel/formatTokens 是普通函数，
// 必须直接从 store 解构，否则模板里会是 undefined 并抛 render error。
const { goalOf } = storeToRefs(goalStore)
const { stateLabel } = goalStore

/**
 * 当前会话的目标。
 */
const goal = computed(() => goalOf.value(props.sessionId))

/**
 * 状态对应的配色类。
 */
const stateClass = computed(() => {
  const state = goal.value?.state
  if (state === 'PAUSED') {
    return 'goal-bar--paused'
  }
  if (state === 'COMPLETED') {
    return 'goal-bar--done'
  }
  if (state === 'FAILED' || state === 'CANCELED') {
    return 'goal-bar--failed'
  }
  return 'goal-bar--running'
})

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
</script>

<style scoped>
/* 目标条：输入卡上方的常驻条，和输入卡同一套「填充底 + 1px 细描边 + 圆角」语言，
   但矮一档（28~30px），只表达状态，不抢输入框的视觉权重。 */
.goal-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 30px;
  margin-bottom: 6px;
  padding: 3px 8px 3px 10px;
  border: 1px solid var(--border-default, var(--color-input-border, var(--el-border-color)));
  border-radius: var(--radius-lg, 12px);
  background: color-mix(in srgb, var(--text-primary, #0f172a) 4%, var(--color-surface, var(--el-bg-color)));
  color: var(--color-text);
  font-size: 12.5px;
  line-height: 18px;
  --goal-color: var(--el-color-primary);
}

.goal-bar--paused {
  --goal-color: var(--el-color-warning, #d97706);
}

.goal-bar--done {
  --goal-color: var(--el-color-success, #3da35d);
}

.goal-bar--failed {
  --goal-color: var(--el-color-danger, #dc2626);
}

.goal-bar__icon {
  display: inline-flex;
  flex: 0 0 auto;
  color: var(--goal-color);
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
  color: var(--goal-color);
  font-size: 12px;
  font-weight: 500;
}

.goal-bar__action {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 7px;
  border: none;
  border-radius: var(--radius-md, 8px);
  background: transparent;
  color: var(--color-text-gray);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.goal-bar__action:hover {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 6%, transparent);
  color: var(--text-primary, var(--color-text));
}

.goal-bar__close {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: var(--radius-md, 8px);
  background: transparent;
  color: var(--color-text-gray);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.goal-bar:hover .goal-bar__close,
.goal-bar:focus-within .goal-bar__close {
  opacity: 1;
}

.goal-bar__close:hover,
.goal-bar__close:focus-visible {
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  color: var(--el-color-danger, #dc2626);
  opacity: 1;
}

.goal-bar__action:focus-visible,
.goal-bar__close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--goal-color) 20%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .goal-bar__action,
  .goal-bar__close {
    transition: none;
  }
}
</style>
