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
/* ============================================================================
   令牌口径（与本应用其余组件统一）：
   1. 颜色/圆角一律走 --el-*。--color-overlay-bg / --color-dialog-bg / --color-border
      虽是 refactor.css 里真实存在的令牌，但都锚在 --color-surface（浅色下是纯白）上，
      遮罩用它会得到一层白幕而不是压暗，故直接换成语义正确的 --el-mask-color。
   2. 弹窗是浮层，投影属于「浮起」表达：直接用 --el-box-shadow，
      它在 element-plus/theme-chalk/dark/css-vars.css 的 html.dark 下会自己变重，
      原先手写的 .dark 覆盖分支可整体去掉。
   ============================================================================ */
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

.l-dialog__overlay::before {
  content: "";
  position: absolute;
  inset: 0;
  /* 原值 var(--color-overlay-bg, rgba(0,0,0,.5))：--color-overlay-bg 在浅色主题下
     等于 --color-surface（纯白），0.8 不透明度会糊出一层白幕而不是压暗背景。
     改用 --el-mask-color：明暗两侧分别是 rgba(15,23,42,.5) / rgba(2,6,14,.65)，
     配合下面 0.8 的 opacity 得到约 40% / 52% 的压暗，语义与观感都对。 */
  background-color: var(--el-mask-color);
  opacity: 0.8;
  pointer-events: none;
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
  /* 原值 var(--size-dialog-rounded-radius, 12px)，refactor.css 里实为 18px → xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  /* 原值 var(--color-dialog-bg, var(--color-bg)) → 浮层底色令牌（明暗自动切换） */
  background-color: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow);
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.l-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 8px;
  flex-shrink: 0;
}

.l-dialog__title {
  /* --size-text-sm 是字号令牌（refactor.css 里实为 14px），不属于颜色/圆角口径，保持原样 */
  font-size: var(--size-text-sm, 14px);
  font-weight: 600;
  color: var(--el-text-color-primary);
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
  /* 原值 var(--color-text-gray, #999) → 次级文字色令牌 */
  color: var(--el-text-color-secondary);
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
  flex-shrink: 0;
  padding: 0;
}

/* 键盘焦点环：28px 的图标按钮上默认 outline 太弱，改用主色光环 */
.l-dialog__close-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.l-dialog__close-btn:hover {
  /* 原值 var(--color-surface-hover, rgba(0,0,0,.06)) → 悬停底色令牌 */
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
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

/* 尊重系统「减少动态效果」偏好。
   注：overlay 的显隐由内联 opacity 驱动、样式里本就没有 transition，
   原先那条 .l-dialog__overlay { transition: none } 是空规则，真正需要关的是关闭按钮。 */
@media (prefers-reduced-motion: reduce) {
  .l-dialog__close-btn {
    transition: none;
  }
}
</style>
