<script setup lang="ts">
import { ref, computed, watch, nextTick, useSlots, onBeforeUnmount, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  width?: string | number
  alignCenter?: boolean
  closeOnClickModal?: boolean
  closeOnPressEscape?: boolean
  destroyOnClose?: boolean
  appendToBody?: boolean
  showClose?: boolean
}>(), {
  title: '',
  width: '50%',
  alignCenter: true,
  closeOnClickModal: true,
  closeOnPressEscape: true,
  destroyOnClose: false,
  appendToBody: false,
  showClose: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  open: []
  close: []
  closed: []
}>()

const slots = useSlots()
/** mounted：overlay 是否在 DOM 中；rendered：body 内容是否存在（destroyOnClose）；shown：是否已应用可见态（opacity） */
const mounted = ref(props.modelValue)
const rendered = ref(true)
const shown = ref(props.modelValue)

let closeTimer: ReturnType<typeof setTimeout> | undefined
const FADE_MS = 180

/** overlay 根元素引用，用于在进入过渡前强制 reflow，锁定 opacity:0 起始态 */
const overlayEl = ref<HTMLElement | null>(null)

watch(() => props.modelValue, (val) => {
  if (val) open()
  else close()
})

function open() {
  clearTimeout(closeTimer)
  mounted.value = true
  rendered.value = true
  emit('update:modelValue', true)
  emit('open')
  // 等 overlay 真正插入 DOM（opacity:0），强制一次 reflow 锁定起始态，
  // 再添加 is-shown，保证 opacity 0→1 过渡必定触发且收敛到 1。
  void nextTick(() => {
    const el = overlayEl.value
    if (el) {
      void el.offsetWidth
    }
    shown.value = true
  })
}

function close() {
  shown.value = false
  emit('update:modelValue', false)
  emit('close')
  // 等待淡出结束后再卸载 overlay / 销毁内容（定时器在隐藏页也会触发，仅可能被节流）
  closeTimer = setTimeout(() => {
    mounted.value = false
    if (props.destroyOnClose) {
      rendered.value = false
    }
    emit('closed')
  }, FADE_MS)
}

function handleOverlayClick() {
  if (props.closeOnClickModal) {
    close()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.closeOnPressEscape) {
    close()
  }
}

const hasHeader = computed(() => {
  return !!(props.title || slots.header)
})

const hasFooter = computed(() => {
  return !!slots.footer
})

const dialogStyle = computed(() => {
  const w = typeof props.width === 'number' ? `${props.width}px` : props.width
  return { width: w, maxWidth: 'calc(100vw - 32px)' }
})

onBeforeUnmount(() => {
  clearTimeout(closeTimer)
  if (mounted.value) {
    emit('update:modelValue', false)
    emit('close')
  }
})
</script>

<template>
  <Teleport :to="appendToBody ? 'body' : undefined" :disabled="!appendToBody">
    <div
      v-if="mounted"
      ref="overlayEl"
      class="l-dialog__overlay"
      :class="{ 'l-dialog__overlay--top': !alignCenter, 'is-shown': shown }"
      :style="{ opacity: shown ? 1 : 0 }"
      @click.self="handleOverlayClick"
      @keydown.esc="handleKeydown"
      tabindex="-1"
    >
      <div
        class="l-dialog"
        v-bind="attrs"
        :style="dialogStyle"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header: only rendered when title or header slot exists -->
        <div v-if="hasHeader" class="l-dialog__header">
          <slot name="header">
            <span class="l-dialog__title">{{ title }}</span>
          </slot>
          <button
            v-if="showClose"
            class="l-dialog__close-btn"
            type="button"
            @click="close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        <!-- Floating close button when no header -->
        <button
          v-else-if="showClose"
          class="l-dialog__close-btn l-dialog__close-btn--floating"
          type="button"
          @click="close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>

        <!-- Body -->
        <div v-if="rendered" class="l-dialog__body">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="hasFooter" class="l-dialog__footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.l-dialog__overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 5vh 16px;
  /* 初始隐藏；显隐由内联 opacity 直接驱动（不使用 CSS 过渡，避免挂载时序下冻结在 0） */
  opacity: 0;
}

.l-dialog__overlay.is-shown {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .l-dialog__overlay {
    transition: none;
  }
}

.l-dialog__overlay::before {
  content: "";
  position: absolute;
  inset: 0;
  background-color: var(--color-overlay-bg, rgba(0, 0, 0, 0.5));
  opacity: 0.8;
  pointer-events: none;
}

html.dark .l-dialog__overlay::before {
  opacity: 0.75;
}

.l-dialog__overlay > .l-dialog {
  position: relative;
  z-index: 1;
}

.l-dialog__overlay--top {
  align-items: flex-start;
}

.l-dialog {
  margin: 0 auto;
  max-height: 85vh;
  border-radius: var(--size-dialog-rounded-radius, 12px);
  background-color: var(--color-dialog-bg, var(--color-bg));
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--color-dialog-border, var(--color-border));
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

html.dark .l-dialog {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.4);
}

.l-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 8px;
  flex-shrink: 0;
}

.l-dialog__title {
  font-size: var(--size-text-sm, 14px);
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.5;
}

.l-dialog__close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-text-gray, #999);
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
  padding: 0;
}

.l-dialog__close-btn:hover {
  background: var(--color-surface-hover, rgba(0, 0, 0, 0.06));
  color: var(--color-text);
}

.l-dialog__close-btn--floating {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.l-dialog__body {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  min-height: 0;
}

.l-dialog__footer {
  padding: 8px 12px 10px;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
