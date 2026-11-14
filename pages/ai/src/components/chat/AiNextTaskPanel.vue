<template>
  <!--
    AI 联想的下一步任务面板。

    位置：紧跟在 GoalBar 之后、输入框之前 —— 即「输入框上方、目标条下方」。

    为什么整块面板可折叠而不是只留一个图标：联想结果最多 10 条，
    常驻展开会把消息列表顶掉一大截；折叠态只占一行 24px。

    为什么没有建议时整块不渲染（visible）：面板挂着一排按钮却没有内容，
    对用户就是一块噪音 —— 没联想出结果就当它不存在，等 load/重新联想
    拿到结果自然出现。
  -->
  <section v-if="visible && state" class="next-task" :class="{ 'next-task--collapsed': collapsed }">
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
        :aria-label="state.enabled ? 'AI 联想当前已开启，点击关闭本会话的联想' : 'AI 联想当前已关闭，点击开启本会话的联想'"
        @click="onToggle"
      >
        <!-- 旧文案「关闭本会话/开启本会话」是动作而非状态，用户看不出当前到底是开还是关；
             这里显式写成「联想：已开启（点击关闭）」——状态在前、动作在后。 -->
        {{ state.enabled ? '联想：已开启（点击关闭）' : '联想：已关闭（点击开启）' }}
      </button>
    </header>

    <ul v-if="!collapsed" class="next-task__list">
      <li v-for="task in state.tasks" :key="`${task.order}-${task.title}`" class="next-task__item">
        <button
          type="button"
          class="next-task__item-main"
          :title="task.detail || task.title"
          :aria-label="`发送「${task.title}」`"
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
import { computed, onUnmounted, ref, watch } from 'vue'
import { apiService } from '@/services/ApiService'
import { useSessionStore } from '@/stores/session'
import type { SessionNextTaskItem, SessionNextTaskState } from '@/services/modules/session-next-task.api'

const props = defineProps<{
  /** 会话标识；缺省时不渲染面板 */
  sessionId?: string | null
  /**
   * 「用户自己发消息」信号：父组件每次自发送 +1，面板据此销毁自己。
   *
   * <p>为什么用单向信号而不是父组件拿模板 ref 调 dismiss()：后者在本仓库实测触发
   * `Maximum recursive updates exceeded in <ChatInput>` —— 父组件持有子实例后每次 patch
   * 都会回写那个 ref，形成环，整个会话页渲染不出来。信号是单向的、没有回写。</p>
   */
  dismissSignal?: number
}>()

const emit = defineEmits<{
  /** 用户点了一条建议：直接作为用户消息发出（由 ChatInput 负责真正发送） */
  (e: 'send-suggestion', text: string): void
}>()

const state = ref<SessionNextTaskState | null>(null)
const collapsed = ref(false)
const refreshing = ref(false)
/** 后端不可用（端点未上线 / 404）时不再反复请求 */
const unsupported = ref(false)

const sessionStore = useSessionStore()

/** 当前会话 id（空串 = 还没有会话，例如新会话的第一条消息发出前） */
const currentSessionId = computed(() => (props.sessionId == null ? '' : String(props.sessionId)))

/**
 * 本会话是否正在流式回复。
 *
 * <p>两条硬规则由它决定：</p>
 * <ol>
 *   <li><b>回复期间整块收起</b>：上一轮留下的建议还在输入框上方挂着，
 *       会让人以为「话还没说完就先把建议给了」——用户实拍报障的正是这个。</li>
 *   <li><b>回复结束才重新联想</b>：建议必须基于刚结束的这一轮，否则永远是
 *       第一次联想时的旧内容（用户原话「整个建议是上一个的吧」）。</li>
 * </ol>
 */
const streaming = computed(() => {
  const id = currentSessionId.value
  return !!id && sessionStore.sessionIsStreaming(id)
})

/**
 * 当前这批建议是否已被用户处理掉（点建议 / 自己发消息），且后端还没生成更新的一代
 */
const dismissed = computed(() => {
  const sid = props.sessionId == null ? null : String(props.sessionId)
  if (!sid || !state.value) return false
  const mark = readMark(sid)
  return mark > 0 && (state.value.generatedAt ?? 0) <= mark
})

/**
 * 是否渲染整块面板：**没有建议就什么都不显示**。
 *
 * 空状态占位（「还没有联想结果…」）随之去掉 —— 挂着一排按钮却没内容，
 * 对用户只是噪音。load() 在首次开启时会自动联想一次，只要联想出结果，
 * 面板就自己出现，不需要用户多点一步。
 */
const visible = computed(
  () =>
    !!state.value &&
    (state.value.tasks?.length ?? 0) > 0 &&
    !dismissed.value &&
    !streaming.value,
)

const pinnedTitle = '该会话已保留开启时的取值，之后设置中心改默认值不会影响它'
const inheritedTitle = '该会话还没有自己的取值，暂时跟随设置中心的默认值'

/**
 * 点击某条联想任务：直接作为用户消息发送出去（用户已明确要求：不是设为目标）。
 *
 * <p><b>点一条 = 消费整块</b>：点后清空本地列表，整块面板随即卸载（与点 X 同效果），
 * 既避免「建议已经发出去了还挂着、还能被反复点」的假状态，也符合用户口径
 * 「点了建议就把这个组件销毁」。<b>不是</b>只摘掉被点的那一条。</p>
 *
 * <p>只做本地清空：后端仍持有原列表，下一次 {@code load()}／「重新联想」以后端返回为准
 * —— 新对话轮次后由后端重新生成的建议是「新的建议」，不该被本地的历史点击永久屏蔽。</p>
 *
 * @param task 联想出的任务
 */
async function onPick(task: SessionNextTaskItem): Promise<void> {
  if (!props.sessionId) {
    return
  }
  const text = [task.title, task.detail].filter(Boolean).join('\n')
  if (!text.trim()) {
    return
  }
  // 「点了建议」= 消费整块（见 dismiss 注释），不是只摘掉被点的那一条
  dismiss()
  emit('send-suggestion', text)
}

/**
 * 「已被用户处理掉的建议」水位：key → 那一批建议的 generatedAt。
 *
 * <p>为什么必须**落 sessionStorage**（三层原因，都是实测踩出来的）：</p>
 * <ol>
 *   <li>组件在流式期间可能被父组件重挂 → 组件内的 ref 会丢，同一批建议又挂回来；</li>
 *   <li>整页重载（刷新/路由重建）连模块作用域的 Map 也一起清空 → 用户刷新一次建议就回来；</li>
 *   <li><b>新会话第一次发送时 sessionId 还是 null</b>，没有 key 可记 ——
 *       用户截图里那条正是新会话的第一条消息，于是"发了消息建议还在"。</li>
 * </ol>
 *
 * <p>语义：只要后端还没生成**更新的一代**建议（generatedAt 变大）就一直隐藏；
 * 下一轮结束后后端重新联想，面板自然带着新建议回来。</p>
 */
const DISMISS_STORE = 'ai-next-task-dismissed'
/** 会话尚未建立时的占位 key：新会话首次发送记在这里，建会话后由 load() 继承 */
const PENDING_KEY = '__pending__'

function readMarks(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(DISMISS_STORE) || '{}') as Record<string, number>
  } catch {
    return {}
  }
}

function readMark(key: string): number {
  return readMarks()[key] ?? 0
}

function writeMark(key: string, at: number): void {
  try {
    const marks = readMarks()
    // 取较大值：同一批建议被处理多次时水位只前进不后退
    marks[key] = Math.max(marks[key] ?? 0, at)
    sessionStorage.setItem(DISMISS_STORE, JSON.stringify(marks))
  } catch {
    /* 隐私模式下 sessionStorage 可能不可用：退化成"仅本次内存生效"，不因此报错 */
  }
}

/**
 * 销毁面板：记录水位 + 清空本地列表 → {@code visible=false} → 整块卸载。
 *
 * <p>两个时机共用这一条路径：点了某条建议；或用户自己在输入框里发了消息
 * （= 明确不采纳当前这批建议）。**没有 sessionId 也要记**（记到 PENDING_KEY），
 * 否则新会话首条消息发出的那一次等于没记。</p>
 */
function dismiss(): void {
  const sid = props.sessionId == null ? PENDING_KEY : String(props.sessionId)
  writeMark(sid, state.value?.generatedAt ?? Date.now())
  if (state.value) {
    state.value.tasks = []
  }
}

defineExpose({ dismiss })

/**
 * 父组件的「用户自己发消息」信号 → 销毁面板。
 *
 * <p>单向信号、组件内部只读，不存在回写，因此不会像模板 ref 那样形成更新环
 * （那个写法实测把整个会话页打白）。</p>
 */
watch(
  () => props.dismissSignal,
  (now, before) => {
    if ((now ?? 0) !== (before ?? 0)) {
      dismiss()
    }
  },
)

/**
 * 重新联想。
 */
async function onRefresh(): Promise<void> {
  const sessionId = props.sessionId
  if (!sessionId || refreshing.value) {
    return
  }
  // 流式期间不联想：此刻会话里还没有这一轮的答案，生成出来的建议必然对不上
  if (streaming.value) {
    return
  }
  refreshing.value = true
  try {
    const next = await apiService.refreshSessionNextTask(sessionId)
    /*
     * 后端在「这次没联想出任务」时会把**上一次的**结果连同原因一起返回
     * （SessionNextTaskService.refresh 的保留策略，为了让面板不突然空掉）。
     * 但这一轮已经结束、上一批建议已被用户这一条消息消费掉，
     * 再把它们挂回来就是用户报障的「建议还是上一个的」。
     * 因此：只要带回原因文案，就按「这一轮没有新建议」处理 —— 整块不渲染。
     */
    state.value = next.message ? { ...next, tasks: [] } : next
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
    /*
     * 继承「新会话首次发送」记下的 pending 水位：
     * 那一刻还没有会话 id，标记只能先记在 PENDING_KEY 上；
     * 建好会话、面板带着真 id 挂上来时，如果这批建议**生成于那次发送之前**，
     * 就说明用户当时已经用行动拒绝了它 —— 补记到该会话名下并清掉 pending。
     */
    const pending = readMark(PENDING_KEY)
    if (pending > 0 && (next?.generatedAt ?? 0) <= pending) {
      writeMark(sessionId, pending)
      writeMark(PENDING_KEY, 0)
    }
    state.value = next?.enabled ? next : null
    if (next?.enabled && !next.tasks.length && !next.message && !streaming.value) {
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

/**
 * 回复结束 → 按刚结束的这一轮重新联想。
 *
 * <p>后端只在被调用时联想（{@code refresh}），没有「回合结束自动联想」的钩子；
 * 之前前端也只在「会话里还没有任何建议」时联想一次，于是第一次生成的建议会一直
 * 挂到下一次手动点「重新联想」——这就是用户看到的「建议还是上一个的」。</p>
 *
 * <p>延时是为了让后端先把这一轮最后一条 assistant 消息落库：联想读的是持久化消息，
 * 抢在前面读会漏掉刚生成的那半段，得到的仍然像上一轮。</p>
 *
 * <p><b>这段必须放在下面 {@code immediate: true} 的会话 watch 之前</b>：
 * 那个 watch 在 setup 阶段同步执行，会调 {@link clearFinishTimer}；若定时器变量
 * 声明在后面，此时仍处于 TDZ，抛 `Cannot access 'finishTimer' before initialization`，
 * 整个会话页白屏（实测已踩）。</p>
 */
const FINISH_REFRESH_DELAY_MS = 900
/** 待触发的回合结束联想；切会话/卸载/又开始流式时必须取消 */
let finishTimer: number | undefined

function clearFinishTimer(): void {
  if (finishTimer !== undefined) {
    window.clearTimeout(finishTimer)
    finishTimer = undefined
  }
}

watch(streaming, (now, before) => {
  clearFinishTimer()
  // 只在 true → false 时触发；首次求值时 before 为 undefined，不当作「刚结束」
  if (!before || now) {
    return
  }
  if (!state.value?.enabled || unsupported.value) {
    return
  }
  finishTimer = window.setTimeout(() => {
    finishTimer = undefined
    // 先把上一轮的建议摘掉：联想是一次同步模型调用（数秒到十几秒），
    // 不摘的话这段时间里旧建议照旧挂着，等于「说完了还给我看上一轮的」。
    // 联想失败时后端会把旧建议连同原因一起返回，页面不会空着。
    if (state.value) {
      state.value.tasks = []
    }
    void onRefresh()
  }, FINISH_REFRESH_DELAY_MS)
})

onUnmounted(clearFinishTimer)

/** 折叠态下把已有结果留在 store 里，切回展开不重新请求 */
const lastSessionId = computed(() => (props.sessionId == null ? null : String(props.sessionId)))

watch(
  lastSessionId,
  () => {
    collapsed.value = false
    clearFinishTimer()
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

.next-task__message {
  margin: 0;
  padding: 0 10px 8px;
  color: var(--color-text-gray);
  font-size: 12px;
  line-height: 18px;
}
</style>