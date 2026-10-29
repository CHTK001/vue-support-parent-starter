<template>
  <div class="te-slider-wrap">
    <div
      ref="trackRef"
      class="te-track"
      role="slider"
      :aria-valuemin="0"
      :aria-valuemax="Math.max(0, options.length - 1)"
      :aria-valuenow="currentIndex"
      :aria-valuetext="getLabel(currentEffort)"
      :aria-label="ariaLabel"
      tabindex="0"
      @click="handleTrackClick"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @keydown="handleKeydown"
    >
      <!-- 未填充轨道 -->
      <div class="te-track-base"></div>
      <!-- 已填充（从左侧到当前档位），蓝色渐变 -->
      <div class="te-track-fill" :style="{ width: fillPercent + '%' }"></div>
      <!-- 档位刻度点 -->
      <div
        v-for="(item, i) in items"
        :key="item.effort"
        class="te-dot"
        :class="{ 'te-dot-filled': i <= currentIndex }"
        :style="{ left: dotLeft(i) }"
      ></div>
      <!-- 白色端帽 -->
      <div class="te-thumb" :class="{ 'is-dragging': dragging }" :style="{ left: thumbLeft }"></div>
    </div>

    <!-- 档位刻度标签 -->
    <div class="te-labels">
      <button
        v-for="(item, i) in items"
        :key="item.effort"
        type="button"
        class="te-label"
        :class="{ 'is-active': i === currentIndex }"
        :data-effort="item.effort"
        @click="handleLabelClick(item.effort)"
      >
        {{ item.label }}
      </button>
    </div>

    <!-- 底部当前强度说明 -->
    <div v-if="showFoot" class="te-foot">
      <span class="te-foot-hint">{{ t('chat.input.thinkingEffortCurrentLevel') }}</span>
      <span class="te-foot-value" :class="{ 'is-off': currentIndex === 0 }">{{ getLabel(currentEffort) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getThinkingEffortLabel } from '@/utils/modelUtils'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  /** 档位列表（等距分布在轨道上），如 ['none','default','low','medium','high','max'] */
  options: string[]
  /** 当前档位；null 或不在 options 内时回落到最左档 */
  modelValue: string | null
  /** 是否显示底部「当前强度」行 */
  showFoot?: boolean
  /** 滑块的 aria-label */
  ariaLabel?: string
}>(), {
  modelValue: null,
  showFoot: true,
  ariaLabel: '',
})

const emit = defineEmits<{
  /** 档位变更（点击 / 拖拽预览 / 键盘），父组件据此更新值 */
  'select': [effort: string]
  /** 用户完成一次确定选择（点标签 / 点轨道 / 键盘），弹层场景据此关闭 */
  'commit': [effort: string]
}>()

const trackRef = ref<HTMLElement | null>(null)
const dragging = ref(false)

/** 档位列表：滑轨等距分布 */
const items = computed(() =>
  props.options.map((effort) => ({
    effort,
    label: getThinkingEffortLabel(effort),
  })),
)

/** 当前档位下标（找不到时取 0 = 最左档） */
const currentIndex = computed(() => {
  const idx = props.options.indexOf(props.modelValue ?? '')
  return idx === -1 ? 0 : idx
})

/** 当前档位值（供 aria-valuetext / 底部展示） */
const currentEffort = computed(() => props.options[currentIndex.value] ?? '')

/** 填充百分比；单档时 0 */
const fillPercent = computed(() => {
  const len = props.options.length
  return len > 1 ? (currentIndex.value / (len - 1)) * 100 : 0
})

/** 刻度点 / 端帽的 left；单档居中 */
function dotLeft(index: number): string {
  const len = props.options.length
  if (len <= 1) return '50%'
  return (index / (len - 1)) * 100 + '%'
}
const thumbLeft = computed(() => dotLeft(currentIndex.value))

function getLabel(effort: string): string {
  return getThinkingEffortLabel(effort)
}

/** 由点击/拖拽位置解析档位并选档（仅值变更，不视为「确定」） */
function selectFromClientX(clientX: number): void {
  const track = trackRef.value
  if (!track) return
  const rect = track.getBoundingClientRect()
  const ratio = (clientX - rect.left) / rect.width
  const len = props.options.length
  let index = Math.round(ratio * (len - 1))
  index = Math.max(0, Math.min(len - 1, index))
  const effort = props.options[index]
  if (effort && effort !== currentEffort.value) {
    emit('select', effort)
  }
}

function handleTrackClick(e: MouseEvent): void {
  // 拖拽结束的 click 会被抑制（pointer 位移足够大时浏览器不派发），
  // 若仍有残余 click，这里用 dragging 兜底避免二次触发。
  if (dragging.value) return
  const track = trackRef.value
  if (!track) return
  const rect = track.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  const len = props.options.length
  let index = Math.round(ratio * (len - 1))
  index = Math.max(0, Math.min(len - 1, index))
  const effort = props.options[index]
  if (effort && effort !== currentEffort.value) {
    emit('select', effort)
  }
  emit('commit', effort ?? '')
}

let downX = 0

function handlePointerDown(e: PointerEvent): void {
  dragging.value = true
  downX = e.clientX
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  selectFromClientX(e.clientX)
}

function handlePointerMove(e: PointerEvent): void {
  if (!dragging.value) return
  // 拖动中实时预览（保留弹层不关闭）
  selectFromClientX(e.clientX)
  if (Math.abs(e.clientX - downX) > 2) {
    e.preventDefault()
  }
}

function handlePointerUp(e: PointerEvent): void {
  if (!dragging.value) return
  dragging.value = false
  ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
}

/** 键盘左右调整档位；选择即「确定」 */
function handleKeydown(e: KeyboardEvent): void {
  const len = props.options.length
  if (len === 0) return
  const step = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0
  if (!step) return
  e.preventDefault()
  const next = Math.max(0, Math.min(len - 1, currentIndex.value + step))
  const effort = props.options[next]
  if (effort) {
    emit('select', effort)
    emit('commit', effort)
  }
}

/** 点击档位标签 = 确定选择 */
function handleLabelClick(effort: string): void {
  emit('select', effort)
  emit('commit', effort)
}
</script>

<style scoped>
.te-slider-wrap {
  padding: 0 2px;
}

.te-track {
  position: relative;
  height: 8px;
  cursor: pointer;
  touch-action: none;
  outline: none;
}
.te-track:focus-visible {
  outline: 2px solid var(--color-primary, var(--el-color-primary));
  outline-offset: 3px;
  border-radius: 999px;
}

.te-track-base {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: var(--color-surface-hover, var(--el-fill-color-light));
}

.te-track-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--brand-400, #60a5fa) 0%, var(--brand-600, #2563eb) 100%);
}

.te-dot {
  position: absolute;
  top: 50%;
  width: 6px;
  height: 6px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: var(--el-color-white, #ffffff);
  border: 1px solid var(--border-default, var(--el-border-color));
  box-shadow: 0 0 0 1px var(--border-default, var(--el-border-color));
  pointer-events: none;
}
.te-dot-filled {
  background: rgba(255, 255, 255, 0.4);
  border-color: transparent;
  box-shadow: none;
}

.te-thumb {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: var(--el-color-white, #ffffff);
  border: 2px solid var(--color-primary, var(--el-color-primary));
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.25);
  pointer-events: none;
  transition: box-shadow 0.15s ease;
}
.te-thumb.is-dragging {
  box-shadow: 0 0 0 5px var(--color-primary-0f, rgba(37, 99, 235, 0.1)), 0 1px 4px rgba(15, 23, 42, 0.25);
}

/* ---------- 档位标签 ---------- */
.te-labels {
  display: flex;
  justify-content: space-between;
  margin: 10px -1px 4px;
}

.te-label {
  flex: 1;
  min-width: 0;
  text-align: center;
  font-size: 12px;
  line-height: 1.2;
  padding: 4px 2px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-gray, var(--el-text-color-secondary));
  background: transparent;
  border: none;
  transition: color 0.15s ease, background 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.te-label:hover {
  color: var(--color-primary, var(--el-color-primary));
  background: var(--color-primary-50, var(--el-color-primary-light-9));
}
.te-label.is-active {
  color: var(--color-primary, var(--el-color-primary));
  font-weight: 600;
}

/* ---------- 底部说明 ---------- */
.te-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 2px 2px 0;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle, var(--el-border-color-lighter));
}

.te-foot-hint {
  font-size: 12px;
  color: var(--color-text-gray, var(--el-text-color-secondary));
}

.te-foot-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary, var(--el-color-primary));
}
.te-foot-value.is-off {
  color: var(--color-text-gray, var(--el-text-color-secondary));
}
</style>