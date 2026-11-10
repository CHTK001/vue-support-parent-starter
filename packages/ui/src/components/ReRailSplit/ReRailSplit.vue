<template>
  <div
    class="re-rail-split"
    :class="{ 'is-dragging': dragging }"
    role="separator"
    aria-orientation="vertical"
    :aria-label="label"
    :aria-valuenow="Math.round(width)"
    :aria-valuemin="min"
    :aria-valuemax="Math.round(maxWidth)"
    :title="title"
    tabindex="0"
    @pointerdown.prevent="start"
    @dblclick.prevent="reset"
    @keydown.left.prevent="nudge(-16)"
    @keydown.right.prevent="nudge(16)"
  />
</template>

<script setup lang="ts">
/**
 * ReRailSplit — 左右分栏拖拽手柄
 *
 * <p>与「渠道管理」左栏使用同一套交互：</p>
 * <ul>
 *   <li>按住拖拽改左栏宽度（父组件用 v-model:width 绑定）；</li>
 *   <li>松手把宽度写入 localStorage，刷新后保持；</li>
 *   <li>双击复位默认宽度；手柄可聚焦，←/→ 每次微调 16px。</li>
 * </ul>
 *
 * <p>只负责「宽度 + 手柄」，栏目的宽度由父组件作用到自己的左栏上，
 * 因此折叠态、响应式断点仍由各页面自己掌控。</p>
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { readRailWidth } from './readRailWidth'

const props = withDefaults(
  defineProps<{
    /** 当前左栏宽度（px），配合 v-model:width 使用 */
    width: number
    /** 左栏最小宽度 */
    min?: number
    /** 左栏最大宽度 */
    max?: number
    /** 双击复位后的宽度 */
    defaultWidth?: number
    /** 宽度偏好的 localStorage 键；为空则只在本次会话生效 */
    storageKey?: string
    /** 右栏至少保留的可视宽度，用来算拖拽上限 */
    rightMin?: number
    /** 手柄的无障碍名称 */
    label?: string
    /** 手柄的 hover 提示 */
    title?: string
  }>(),
  {
    min: 200,
    max: 560,
    defaultWidth: 268,
    storageKey: '',
    rightMin: 360,
    label: '拖拽调整左栏宽度',
    title: '拖拽调整左栏宽度（双击复位）'
  }
)

const emit = defineEmits<{ (e: 'update:width', value: number): void }>()

/** 是否正在拖拽（用于把握把加深） */
const dragging = ref(false)

/** 拖拽上限：不超过 max，也不把右栏挤到 rightMin 以下 */
const maxWidth = computed(() => {
  const room = typeof window === 'undefined' ? props.max : window.innerWidth - props.rightMin
  return Math.min(props.max, Math.max(props.min, room))
})

function clamp(value: number): number {
  return Math.min(maxWidth.value, Math.max(props.min, value))
}

/** 拖拽起点：鼠标 x 与起始宽度 */
let startX = 0
let startWidth = 0
/** 最近一次下发的宽度（松手时 props 还没回写，用它落盘） */
let lastWidth = 0

function onMove(e: PointerEvent): void {
  lastWidth = clamp(startWidth + (e.clientX - startX))
  emit('update:width', lastWidth)
}

function persist(value: number): void {
  if (!props.storageKey) return
  try {
    localStorage.setItem(props.storageKey, String(Math.round(value)))
  } catch {
    /* 隐私模式 / 配额满：宽度只在本次会话生效 */
  }
}

function stop(): void {
  document.removeEventListener('pointermove', onMove)
  document.removeEventListener('pointerup', stop)
  document.removeEventListener('pointercancel', stop)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
  dragging.value = false
  persist(lastWidth || props.width)
}

function start(e: PointerEvent): void {
  startX = e.clientX
  startWidth = props.width
  lastWidth = props.width
  dragging.value = true
  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', stop)
  document.addEventListener('pointercancel', stop)
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'
}

/** 双击复位 */
function reset(): void {
  const value = clamp(props.defaultWidth)
  emit('update:width', value)
  persist(value)
}

/** 键盘微调（手柄可聚焦，←/→ 每次 ±16px） */
function nudge(delta: number): void {
  const value = clamp(props.width + delta)
  emit('update:width', value)
  persist(value)
}

onBeforeUnmount(stop)
</script>

<style scoped>
.re-rail-split {
  flex: none;
  align-self: stretch;
  width: 11px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: col-resize;
  touch-action: none;
  outline: none;
  z-index: 1;
}
/* 常显一条 4px 圆角竖条 + 中间三点握把，hover / 拖拽加深 */
.re-rail-split::before {
  content: '';
  width: 4px;
  height: 44px;
  border-radius: 999px;
  background: var(--border-default, #e2e9f3);
  box-shadow: 0 0 0 1px var(--bg-container, #fff);
  transition: background-color 0.15s ease, height 0.15s ease;
}
.re-rail-split::after {
  content: '';
  position: absolute;
  width: 2px;
  height: 22px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-image: radial-gradient(circle, var(--text-tertiary, #94a3b8) 1px, transparent 1.2px);
  background-size: 2px 6px;
  background-repeat: repeat-y;
  pointer-events: none;
}
.re-rail-split:hover::before,
.re-rail-split:focus-visible::before,
.re-rail-split.is-dragging::before {
  background: var(--brand-500, #3b82f6);
  height: 72px;
}
.re-rail-split:hover::after,
.re-rail-split.is-dragging::after {
  background-image: radial-gradient(circle, #fff 1px, transparent 1.2px);
}
</style>
