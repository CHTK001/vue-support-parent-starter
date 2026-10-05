<template>
  <!--
    AI 联想的下一步任务面板。

    位置：紧跟在 GoalBar 之后、输入框之前 —— 即「输入框上方、目标条下方」。

    为什么整块面板可折叠而不是只留一个图标：联想结果最多 10 条，
    常驻展开会把消息列表顶掉一大截；折叠态只占一行 24px。
  -->
  <section v-if="state" class="next-task" :class="{ 'next-task--collapsed': collapsed }">
    <header class="next-task__head">
      <button
        type="button"
        class="next-task__toggle"
        :aria-expanded="!collapsed"
        :aria-label="collapsed ? '展开 AI 联想的下一步任务' : '收起 AI 联想的下一步任务'"
        @click="collapsed = !collapsed"
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
          :style="{ transform: collapsed ? 'rotate(-90deg)' : 'none' }">
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span class="next-task__title">AI 建议的下一步</span>
      </button>

      <span v-if="state.pinned" class="next-task__pinned" :title="pinnedTitle">本会话已固定</span>
      <span v-else class="next-task__pinned next-task__pinned--inherited" :title="inheritedTitle">
        跟随默认（{{ state.defaultValue ? '开' : '关' }}）
      </span>

      <button
        type="button"
        class="next-task__action"
        :disabled="refreshing"
        :aria-label="refreshing ? '正在重新联想' : '重新联想下一步任务'"
        @click="onRefresh"
      >
        {{ refreshing ? '联想中…' : '重新联想' }}
      </button>

      <button
        type="button"
        class="next-task__action"
        :aria-pressed="state.enabled"
        :aria-label="state.enabled ? '关闭本会话的 AI 联想' : '开启本会话的 AI 联想'"
        @click="onToggle"
      >
        {{ state.enabled ? '关闭本会话' : '开启本会话' }}
      </button>
    </header>

    <ul v-if="!collapsed" class="next-task__list">
      <li v-if="!state.tasks.length && !state.message" class="next-task__empty">
        还没有联想结果，点「重新联想」生成。
      </li>
      <li v-for="task in state.tasks" :key="`${task.order}-${task.title}`" class="next-task__item">
        <button
          type="button"
          class="next-task__item-main"
          :title="task.detail || task.title"
          :aria-label="`把「${task.title}」设为当前会话目标`"
          @click="onPick(task)"
        >
          <span class="next-task__item-title">{{ task.title }}</span>
          <span v-if="task.detail" class="next-task__item-detail">{{ task.detail }}</span>
        </button>
      </li>
    </ul>

    <p v-if="!collapsed && state.message" class="next-task__message">{{ state.message }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { apiService } from '@/services/ApiService'
import { useGoalStore } from '@/stores/goal'
import type { SessionNextTaskItem, SessionNextTaskState } from '@/services/modules/session-next-task.api'

const props = defineProps<{
  /** 会话标识；缺省时不渲染面板 */
  sessionId?: string | null
}>()

const goalStore = useGoalStore()

const state = ref<SessionNextTaskState | null>(null)
const collapsed = ref(false)
const refreshing = ref(false)
/** 后端不可用（端点未上线 / 404）时不再反复请求 */
const unsupported = ref(false)

const pinnedTitle = '该会话已保留开启时的取值，之后设置中心改默认值不会影响它'
const inheritedTitle = '该会话还没有自己的取值，暂时跟随设置中心的默认值'

/**
 * 把某条联想任务设为当前会话目标。
 *
 * 只写本地 goal store：目标的后端端点尚未上线，store 内部已按「本地先落地」
 * 处理，等端点上线会自动切为服务端为准。这里不再额外调接口，避免两处口径。
 *
 * @param task 联想出的任务
 */
async function onPick(task: SessionNextTaskItem): Promise<void> {
  if (!props.sessionId) {
    return
  }
  await goalStore.setGoal(props.sessionId, task.title, task.detail)
}

/**
 * 重新联想。
 */
async function onRefresh(): Promise<void> {
  const sessionId = props.sessionId
  if (!sessionId || refreshing.value) {
    return
  }
  refreshing.value = true
  try {
    state.value = await apiService.refreshSessionNextTask(sessionId)
  } catch (error) {
    console.error('[NextTask] 重新联想失败:', error)
  } finally {
    refreshing.value = false
  }
}

/**
 * 切换该会话的开关（写会话自身，不改设置中心默认值）。
 */
async function onToggle(): Promise<void> {
  const sessionId = props.sessionId
  if (!sessionId || !state.value) {
    return
  }
  try {
    state.value = await apiService.saveSessionNextTaskEnabled(sessionId, !state.value.enabled)
  } catch (error) {
    console.error('[NextTask] 保存开关失败:', error)
  }
}

/**
 * 读取状态：开启则渲染，关闭则整块不渲染。
 *
 * 后端未上线时（404）把 unsupported 置位并保持不渲染 —— 页面不会出现一个
 * 「功能坏了」的空壳面板。
 */
async function load(): Promise<void> {
  const sessionId = props.sessionId
  if (!sessionId || unsupported.value) {
    state.value = null
    return
  }
  try {
    const next = await apiService.fetchSessionNextTaskState(sessionId)
    state.value = next?.enabled ? next : null
    if (next?.enabled && !next.tasks.length && !next.message) {
      // 首次开启且还没联想过：直接生成一次，用户不用多点一次
      await onRefresh()
    }
  } catch (error) {
    const status = (error as any)?.status ?? (error as any)?.response?.status
    if (status === 404 || status === 405) {
      unsupported.value = true
    } else {
      console.error('[NextTask] 读取状态失败:', error)
    }
    state.value = null
  }
}

/** 折叠态下把已有结果留在 store 里，切回展开不重新请求 */
const lastSessionId = computed(() => (props.sessionId == null ? null : String(props.sessionId)))

watch(
  lastSessionId,
  () => {
    collapsed.value = false
    void load()
  },
  { immediate: true },
)
</script>

<style scoped>
/*
  面板与 GoalBar 同层：底色用输入框同族（--color-input-bg），边界靠 1px 细边框与圆角，
  不加投影 —— 与仓库「容器不加装饰投影」的口径一致。
*/
.next-task {
  width: 100%;
  margin-bottom: 8px;
  border: 1px solid var(--color-input-border, var(--el-border-color));
  border-radius: var(--size-rounded-radius, 16px);
  background: var(--color-input-bg, var(--el-bg-color));
  color: var(--color-text);
  font-size: 13px;
  line-height: 20px;
}

.next-task__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
}

.next-task__toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 auto;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.next-task__toggle svg {
  flex: 0 0 auto;
  transition: transform 0.15s ease;
}

.next-task__title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 500;
}

.next-task__pinned {
  flex: 0 0 auto;
  padding: 0 6px;
  border-radius: var(--r-sm, 8px);
  background: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary);
  font-size: 12px;
  line-height: 18px;
}

.next-task__pinned--inherited {
  background: transparent;
  border: 1px dashed var(--color-input-border, var(--el-border-color));
  color: var(--color-text-gray);
}

.next-task__action {
  flex: 0 0 auto;
  height: 24px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--r-sm, 8px);
  background: transparent;
  color: var(--color-text-gray);
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.next-task__action:hover:not(:disabled) {
  background: var(--color-surface-hover, var(--el-fill-color-light));
  color: var(--color-text);
}

.next-task__action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.next-task__list {
  margin: 0;
  padding: 0 6px 6px;
  list-style: none;
}

.next-task__item + .next-task__item {
  margin-top: 4px;
}

.next-task__item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: var(--r-sm, 8px);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.next-task__item-main:hover {
  border-color: var(--el-color-primary-light-5, #a0cfff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}

.next-task__item-title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.next-task__item-detail {
  color: var(--color-text-gray);
  font-size: 12px;
  line-height: 18px;
}

.next-task__empty,
.next-task__message {
  margin: 0;
  padding: 0 10px 8px;
  color: var(--color-text-gray);
  font-size: 12px;
  line-height: 18px;
}
</style>