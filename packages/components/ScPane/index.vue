<template>
  <el-container class="sc-pane" direction="vertical" ref="rootRef">
    <!-- Header -->
    <template v-if="hasHeader">
      <el-header :height="headerPx + 'px'" class="sc-pane__header">
        <slot name="header" :resizable="headerResizable" :resizing="resizing === 'header'" :size="headerSizeInner" />
      </el-header>
      <div
        v-if="headerResizable && hasHeader"
        class="sc-pane__divider sc-pane__divider--horizontal"
        @mousedown="onDragStart('header')"
      />
    </template>

    <!-- Middle -->
    <el-container class="sc-pane__middle">
      <!-- 默认：左 | 中 | 右 -->
      <template v-if="layout === 'default'">
        <template v-if="hasLeft">
          <el-aside :width="leftPx + 'px'" class="sc-pane__left">
            <slot name="left" :resizable="leftResizable" :resizing="resizing === 'left'" :size="leftSizeInner" />
          </el-aside>
          <div
            v-if="leftResizable && hasLeft"
            class="sc-pane__divider sc-pane__divider--vertical"
            @mousedown="onDragStart('left')"
          />
        </template>

        <el-main class="sc-pane__center">
          <slot name="center" :resizable="false" :resizing="false" />
        </el-main>

        <template v-if="hasRight">
          <div
            v-if="rightResizable && hasRight"
            class="sc-pane__divider sc-pane__divider--vertical"
            @mousedown="onDragStart('right')"
          />
          <el-aside :width="rightPx + 'px'" class="sc-pane__right">
            <slot name="right" :resizable="rightResizable" :resizing="resizing === 'right'" :size="rightSizeInner" />
          </el-aside>
        </template>
      </template>

      <!-- 新增：左右；右侧再分 上 | 中 | 下 -->
      <template v-else-if="layout === 'lr-right-3'">
        <!-- 左侧 -->
        <template v-if="hasLeft">
          <el-aside :width="leftPx + 'px'" class="sc-pane__left">
            <slot name="left" :resizable="leftResizable" :resizing="resizing === 'left'" :size="leftSizeInner" />
          </el-aside>
          <div
            v-if="leftResizable && hasLeft"
            class="sc-pane__divider sc-pane__divider--vertical"
            @mousedown="onDragStart('left')"
          />
        </template>

        <!-- 右侧复合区域：上/中/下 -->
        <el-aside :width="rightPx + 'px'" class="sc-pane__right">
          <el-container direction="vertical" class="sc-pane__right-vertical">
            <!-- 上 -->
            <template v-if="hasRightTop">
              <el-header :height="rightTopPx + 'px'" class="sc-pane__right-top">
                <slot name="right-top" :resizable="rightTopResizable" :resizing="resizing === 'rightTop'" :size="rightTopSizeInner" />
              </el-header>
              <div
                v-if="rightTopResizable && hasRightTop"
                class="sc-pane__divider sc-pane__divider--horizontal"
                @mousedown="onDragStart('rightTop')"
              />
            </template>

            <!-- 中（自适应） -->
            <el-main class="sc-pane__right-middle">
              <slot name="right-middle" :resizable="false" :resizing="false" />
            </el-main>

            <!-- 下 -->
            <template v-if="hasRightBottom">
              <div
                v-if="rightBottomResizable && hasRightBottom"
                class="sc-pane__divider sc-pane__divider--horizontal"
                @mousedown="onDragStart('rightBottom')"
              />
              <el-footer :height="rightBottomPx + 'px'" class="sc-pane__right-bottom">
                <slot name="right-bottom" :resizable="rightBottomResizable" :resizing="resizing === 'rightBottom'" :size="rightBottomSizeInner" />
              </el-footer>
            </template>
          </el-container>
        </el-aside>
      </template>
    </el-container>

    <!-- Footer -->
    <template v-if="hasFooter">
      <div
        v-if="footerResizable && hasFooter"
        class="sc-pane__divider sc-pane__divider--horizontal"
        @mousedown="onDragStart('footer')"
      />
      <el-footer :height="footerPx + 'px'" class="sc-pane__footer">
        <slot name="footer" :resizable="footerResizable" :resizing="resizing === 'footer'" :size="footerSizeInner" />
      </el-footer>
    </template>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, useSlots, watch } from 'vue'

/**
 * ScPane 基础布局容器
 * - layout="default"：上中下 + 左中右（中心自适应）
 * - layout="lr-right-3"：左右；右侧为上中下三段
 * - 支持尺寸占比/像素定义，支持分隔条拖拽
 */

const props = withDefaults(defineProps<{
  /** 布局类型：default | lr-right-3 */
  layout?: 'default' | 'lr-right-3'

  /** 头部/底部/左右 尺寸设置 */
  headerSize?: number | string
  footerSize?: number | string
  leftSize?: number | string
  rightSize?: number | string

  /** 右侧（layout=lr-right-3）上下区域尺寸 */
  rightTopSize?: number | string
  rightBottomSize?: number | string

  /** 分隔条是否可拖拽 */
  headerResizable?: boolean
  footerResizable?: boolean
  leftResizable?: boolean
  rightResizable?: boolean
  rightTopResizable?: boolean
  rightBottomResizable?: boolean

  /** 最小像素限制 */
  minHeader?: number
  minFooter?: number
  minLeft?: number
  minRight?: number
  minRightTop?: number
  minRightBottom?: number
}>(), {
  layout: 'default',

  headerSize: 0,
  footerSize: 0,
  leftSize: 0,
  rightSize: 0,
  rightTopSize: 0,
  rightBottomSize: 0,

  headerResizable: false,
  footerResizable: false,
  leftResizable: false,
  rightResizable: false,
  rightTopResizable: false,
  rightBottomResizable: false,

  minHeader: 40,
  minFooter: 40,
  minLeft: 120,
  minRight: 120,
  minRightTop: 80,
  minRightBottom: 80
})

const emit = defineEmits<{
  (e: 'resize', section: 'header' | 'footer' | 'left' | 'right' | 'rightTop' | 'rightBottom', sizePx: number): void
  (e: 'update:headerSize', val: number | string): void
  (e: 'update:footerSize', val: number | string): void
  (e: 'update:leftSize', val: number | string): void
  (e: 'update:rightSize', val: number | string): void
  (e: 'update:rightTopSize', val: number | string): void
  (e: 'update:rightBottomSize', val: number | string): void
}>()

const slots = useSlots()
const rootRef = ref<HTMLElement | null>(null)

// 内部状态（像素）
const state = reactive({
  header: 0,
  footer: 0,
  left: 0,
  right: 0,
  rightTop: 0,
  rightBottom: 0
})

const resizing = ref<null | 'header' | 'footer' | 'left' | 'right' | 'rightTop' | 'rightBottom'>(null)
let startPos = 0
let startVal = 0

// slot 存在与否
const hasHeader = computed(() => !!slots.header)
const hasFooter = computed(() => !!slots.footer)
const hasLeft = computed(() => !!slots.left)
const hasRight = computed(() => !!slots.right || slots['right-top'] || slots['right-middle'] || slots['right-bottom'])
const hasRightTop = computed(() => !!slots['right-top'])
const hasRightBottom = computed(() => !!slots['right-bottom'])

// 将用户尺寸（px/%/ratio）转像素
function toPx(val: number | string | undefined, total: number): number {
  if (val == null) return 0
  if (typeof val === 'number') {
    if (val > 0 && val < 1) return Math.round(total * val)
    return Math.round(val)
  }
  const s = String(val).trim()
  if (s.endsWith('%')) return Math.round((parseFloat(s) / 100) * total)
  if (s.endsWith('px')) return Math.round(parseFloat(s))
  const n = parseFloat(s)
  if (!Number.isNaN(n)) return Math.round(n)
  return 0
}

function fromPx(px: number, raw: number | string | undefined, total: number): number | string {
  if (raw == null) return px
  if (typeof raw === 'number') {
    if (raw > 0 && raw < 1) return +(px / total).toFixed(4)
    return Math.round(px)
  }
  const s = String(raw).trim()
  if (s.endsWith('%')) return +((px / total) * 100).toFixed(2) + '%'
  if (s.endsWith('px')) return Math.round(px) + 'px'
  const n = parseFloat(s)
  if (!Number.isNaN(n)) return Math.round(px)
  return Math.round(px)
}

// 根容器尺寸
const rootHeight = computed(() => rootRef.value?.clientHeight || 0)
const rootWidth = computed(() => rootRef.value?.clientWidth || 0)
const middleHeight = computed(() => Math.max(0, rootHeight.value - (hasHeader.value ? state.header : 0) - (hasFooter.value ? state.footer : 0)))

// 初始化与响应 props
function initSizes() {
  state.header = hasHeader.value ? toPx(props.headerSize, rootHeight.value) : 0
  state.footer = hasFooter.value ? toPx(props.footerSize, rootHeight.value) : 0
  state.left = hasLeft.value ? toPx(props.leftSize, rootWidth.value) : 0
  state.right = hasRight.value ? toPx(props.rightSize, rootWidth.value) : 0

  if (props.layout === 'lr-right-3') {
    state.rightTop = hasRightTop.value ? toPx(props.rightTopSize, middleHeight.value) : 0
    state.rightBottom = hasRightBottom.value ? toPx(props.rightBottomSize, middleHeight.value) : 0
  } else {
    state.rightTop = 0
    state.rightBottom = 0
  }
}

watch([rootHeight, rootWidth], () => initSizes())
watch(() => [props.layout, props.headerSize, props.footerSize, props.leftSize, props.rightSize, props.rightTopSize, props.rightBottomSize], () => initSizes(), { deep: true })

onMounted(() => {
  initSizes()
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
})

// 拖拽
function onDragStart(section: 'header' | 'footer' | 'left' | 'right' | 'rightTop' | 'rightBottom') {
  resizing.value = section
  if (section === 'header') {
    startPos = (window.event as MouseEvent)?.clientY || 0
    startVal = state.header
  } else if (section === 'footer') {
    startPos = (window.event as MouseEvent)?.clientY || 0
    startVal = state.footer
  } else if (section === 'left') {
    startPos = (window.event as MouseEvent)?.clientX || 0
    startVal = state.left
  } else if (section === 'right') {
    startPos = (window.event as MouseEvent)?.clientX || 0
    startVal = state.right
  } else if (section === 'rightTop') {
    startPos = (window.event as MouseEvent)?.clientY || 0
    startVal = state.rightTop
  } else if (section === 'rightBottom') {
    startPos = (window.event as MouseEvent)?.clientY || 0
    startVal = state.rightBottom
  }
  document.body.classList.add('sc-pane--resizing')
}

function onDragMove(e: MouseEvent) {
  if (!resizing.value) return
  if (resizing.value === 'header') {
    const dy = e.clientY - startPos
    state.header = Math.max(props.minHeader, startVal + dy)
  } else if (resizing.value === 'footer') {
    const dy = startPos - e.clientY
    state.footer = Math.max(props.minFooter, startVal + dy)
  } else if (resizing.value === 'left') {
    const dx = e.clientX - startPos
    state.left = Math.max(props.minLeft, startVal + dx)
  } else if (resizing.value === 'right') {
    const dx = startPos - e.clientX
    state.right = Math.max(props.minRight, startVal + dx)
  } else if (resizing.value === 'rightTop') {
    const dy = e.clientY - startPos
    const maxTop = Math.max(props.minRightTop, middleHeight.value - Math.max(props.minRightBottom, state.rightBottom))
    state.rightTop = Math.min(maxTop, Math.max(props.minRightTop, startVal + dy))
  } else if (resizing.value === 'rightBottom') {
    const dy = startPos - e.clientY
    const maxBottom = Math.max(props.minRightBottom, middleHeight.value - Math.max(props.minRightTop, state.rightTop))
    state.rightBottom = Math.min(maxBottom, Math.max(props.minRightBottom, startVal + dy))
  }
}

function onDragEnd() {
  if (!resizing.value) return
  const section = resizing.value
  resizing.value = null
  document.body.classList.remove('sc-pane--resizing')

  if (section === 'header') {
    emit('update:headerSize', fromPx(state.header, props.headerSize, rootHeight.value))
    emit('resize', 'header', state.header)
  } else if (section === 'footer') {
    emit('update:footerSize', fromPx(state.footer, props.footerSize, rootHeight.value))
    emit('resize', 'footer', state.footer)
  } else if (section === 'left') {
    emit('update:leftSize', fromPx(state.left, props.leftSize, rootWidth.value))
    emit('resize', 'left', state.left)
  } else if (section === 'right') {
    emit('update:rightSize', fromPx(state.right, props.rightSize, rootWidth.value))
    emit('resize', 'right', state.right)
  } else if (section === 'rightTop') {
    emit('update:rightTopSize', fromPx(state.rightTop, props.rightTopSize, middleHeight.value))
    emit('resize', 'rightTop', state.rightTop)
  } else if (section === 'rightBottom') {
    emit('update:rightBottomSize', fromPx(state.rightBottom, props.rightBottomSize, middleHeight.value))
    emit('resize', 'rightBottom', state.rightBottom)
  }
}

// 只读像素
const headerPx = computed(() => state.header)
const footerPx = computed(() => state.footer)
const leftPx = computed(() => state.left)
const rightPx = computed(() => state.right)
const rightTopPx = computed(() => state.rightTop)
const rightBottomPx = computed(() => state.rightBottom)

// 提供给插槽的尺寸（维持单位语义）
const headerSizeInner = computed(() => fromPx(state.header, props.headerSize, rootHeight.value))
const footerSizeInner = computed(() => fromPx(state.footer, props.footerSize, rootHeight.value))
const leftSizeInner = computed(() => fromPx(state.left, props.leftSize, rootWidth.value))
const rightSizeInner = computed(() => fromPx(state.right, props.rightSize, rootWidth.value))
const rightTopSizeInner = computed(() => fromPx(state.rightTop, props.rightTopSize, middleHeight.value))
const rightBottomSizeInner = computed(() => fromPx(state.rightBottom, props.rightBottomSize, middleHeight.value))
</script>

<style lang="scss" scoped>
.sc-pane {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.sc-pane__header,
.sc-pane__footer {
  padding: 0;
}

.sc-pane__middle {
  min-height: 0;
}

.sc-pane__left,
.sc-pane__right {
  padding: 0;
}

.sc-pane__center {
  padding: 0;
  min-height: 0;
}

.sc-pane__right-vertical {
  min-height: 0;
}

.sc-pane__divider {
  background-color: var(--el-border-color);
  opacity: 0.6;
  transition: background-color .2s, opacity .2s;
  &--horizontal {
    height: 6px;
    cursor: ns-resize;
  }
  &--vertical {
    width: 6px;
    cursor: ew-resize;
  }
  &:hover {
    opacity: 1;
    background-color: var(--el-color-primary);
  }
}

:global(body.sc-pane--resizing) {
  cursor: col-resize;
}
</style>
