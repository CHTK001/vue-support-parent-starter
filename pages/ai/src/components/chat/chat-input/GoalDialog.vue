<!--
  会话目标弹框（用户口径 2026-11-13，参考图）：目标激活时再次点击靶心按钮打开。

  <p>版式：标题 + 状态条（已暂停/进行中 · 词元 · 续跑次数）+ 目标文本域 + 词元预算勾选
  + 底部「移除目标 / 取消 / 保存目标」。暂停与继续收进状态条右侧的小按钮，
  不额外占一行。</p>
-->
<template>
  <Teleport to="body">
    <div v-if="visible" class="gd-overlay" @click.self="close">
      <section class="gd" role="dialog" aria-modal="true" aria-label="会话目标">
        <header class="gd-head">
          <span class="gd-title">会话目标</span>
          <button type="button" class="gd-x" aria-label="关闭" @click="close">×</button>
        </header>

        <div class="gd-status">
          <span class="gd-dot" :class="`is-${stateKey}`" />
          <span class="gd-state">{{ stateText }}</span>
          <span class="gd-meta">{{ usedText }} 词元</span>
          <span v-if="rounds > 0" class="gd-meta">· {{ rounds }} 次续跑</span>
          <button v-if="canPause" type="button" class="gd-inline" @click="togglePause">
            {{ isPaused ? '继续' : '暂停' }}
          </button>
        </div>

        <div class="gd-field">
          <div class="gd-field-head">
            <span>目标</span>
            <span class="gd-count">{{ usedText }}/{{ budgetText }}</span>
          </div>
          <textarea v-model="title" class="gd-textarea" rows="5" placeholder="写下这个会话要达成的目标" />
        </div>

        <label class="gd-budget">
          <input v-model="budgetEnabled" type="checkbox" />
          <span>词元预算</span>
          <input v-if="budgetEnabled" v-model.number="budget" type="number" min="100" step="100" class="gd-budget-input" />
        </label>

        <footer class="gd-foot">
          <button type="button" class="gd-btn gd-btn--danger" @click="removeGoal">移除目标</button>
          <span class="gd-spacer" />
          <button type="button" class="gd-btn" @click="close">取消</button>
          <button type="button" class="gd-btn gd-btn--primary" :disabled="!title.trim()" @click="save">保存目标</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGoalStore, formatTokenCounter, DEFAULT_GOAL_TOKEN_BUDGET } from '@/stores/goal'

const props = defineProps<{
  visible: boolean
  sessionId: string | null
  goal: any | null
}>()

const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const goalStore = useGoalStore()

const title = ref('')
const budgetEnabled = ref(false)
const budget = ref(DEFAULT_GOAL_TOKEN_BUDGET)

watch(() => props.visible, (visible) => {
  if (!visible) return
  const g = props.goal
  title.value = String(g?.title || '')
  const b = Number(g?.tokenBudget || DEFAULT_GOAL_TOKEN_BUDGET)
  budget.value = Number.isFinite(b) && b > 0 ? b : DEFAULT_GOAL_TOKEN_BUDGET
  budgetEnabled.value = !!g?.tokenBudget
})

const isPaused = computed(() => props.goal?.state === 'PAUSED')
const canPause = computed(() => ['RUNNING', 'PENDING', 'PAUSED'].includes(String(props.goal?.state)))
const stateKey = computed(() => (isPaused.value ? 'paused' : 'running'))
const stateText = computed(() => (props.goal ? goalStore.stateLabel(props.goal.state) : '未设置'))
const usedText = computed(() => formatTokenCounter(Number(props.goal?.tokensUsed || 0)))
const budgetText = computed(() => formatTokenCounter(Number(props.goal?.tokenBudget || DEFAULT_GOAL_TOKEN_BUDGET)))
const rounds = computed(() => Number(props.goal?.rounds || 0))

function close(): void {
  emit('update:visible', false)
}

function sessionKey(): string {
  return props.sessionId == null ? '' : String(props.sessionId)
}

async function save(): Promise<void> {
  const sid = sessionKey()
  const text = title.value.trim()
  if (!sid || !text) return
  await goalStore.setGoal(sid, text, String(props.goal?.detail || ''), budget.value)
  close()
}

async function removeGoal(): Promise<void> {
  const sid = sessionKey()
  if (!sid) return
  try {
    await goalStore.cancel(sid)
  } finally {
    goalStore.remove(sid)
    close()
  }
}

async function togglePause(): Promise<void> {
  const sid = sessionKey()
  if (!sid) return
  if (isPaused.value) await goalStore.resume(sid)
  else await goalStore.pause(sid)
}
</script>

<style scoped>
.gd-overlay {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, #0f172a 34%, transparent);
}

.gd {
  width: min(560px, calc(100vw - 32px));
  max-height: calc(100vh - 64px);
  overflow: auto;
  padding: 16px 18px 14px;
  border-radius: var(--radius-lg, 14px);
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-dark);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gd-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.gd-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.gd-x {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.gd-x:hover { background: var(--el-fill-color-light); }

.gd-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.gd-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--el-color-primary);
}

.gd-dot.is-paused { background: var(--el-color-warning); }

.gd-state { font-weight: 500; }

.gd-meta { color: var(--el-text-color-secondary); }

.gd-inline {
  margin-left: auto;
  padding: 0 8px;
  height: 20px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--el-color-primary);
  font-size: 11.5px;
  cursor: pointer;
}

.gd-inline:hover { background: var(--el-color-primary-light-9); }

.gd-field { display: flex; flex-direction: column; gap: 6px; }

.gd-field-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
}

.gd-count {
  font-family: var(--font-mono, Consolas, monospace);
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

.gd-textarea {
  width: 100%;
  min-height: 108px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
}

.gd-textarea:focus { border-color: var(--el-color-primary); }

.gd-budget {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
}

.gd-budget-input {
  width: 110px;
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-family: var(--font-mono, Consolas, monospace);
}

.gd-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
}

.gd-spacer { flex: 1; }

.gd-btn {
  height: 30px;
  padding: 0 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12.5px;
  cursor: pointer;
}

.gd-btn:hover { background: var(--el-fill-color-light); }

.gd-btn--primary {
  border-color: transparent;
  background: var(--el-color-primary);
  color: #fff;
}

.gd-btn--primary:disabled {
  opacity: 0.5;
  cursor: default;
}

.gd-btn--danger {
  border-color: color-mix(in srgb, var(--el-color-danger) 40%, transparent);
  color: var(--el-color-danger);
}

.gd-btn--danger:hover {
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
}
</style>
