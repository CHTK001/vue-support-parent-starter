<template>
    <teleport to="body">
        <div v-if="show" ref="popoverRef"
            class="popover-shell fixed border border-white/40 dark:border-white/10 shadow-[0_0_16px_rgba(0,0,0,0.10)] dark:shadow-[0_0_8px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col z-2000 pointer-events-auto px-1 py-1 backdrop-blur-xl backdrop-saturate-150"
            :class="[popperClass, entering ? 'pop-init' : 'pop-run']" :style="popoverStyle" @click.stop
            @mouseenter="$emit('mouseenter', $event)" @mouseleave="$emit('mouseleave', $event)">
                <!-- Header 槽位 -->
                <div v-if="$slots.header" class="">
                    <slot name="header"></slot>
                </div>
                <div class="popover-content">
                    <slot></slot>
                </div>
            </div>
    </teleport>
</template>
<style scoped>
/* 外壳圆角与底色。
   原本写在模板里的 rounded-(--size-dialog-rounded-radius) / bg-(--color-surface)/70
   会被基线的 UnoCSS transformerVariantGroup() 当成变体分组，改写成
   rounded---size-dialog-rounded-radius / bg---color-surface/70，编译产物对不上，
   于是浮层实际是「0 圆角 + 全透明」——只剩毛玻璃，压住内容时直接透字。
   按项目口径把令牌值落到 scoped 样式里，模板只保留结构类。 */
.popover-shell {
    border-radius: var(--size-dialog-rounded-radius, 18px);
    /*
      92% 不透明而不是 70%：弹层下面常常压着图片/正文，70% + 模糊仍能看出
      底色与文字轮廓透进来（「背景色穿透」），读选项时很脏。
      保留一点透明度只为和页面层次呼应，实际观感接近实面。
    */
    background: color-mix(in srgb, var(--color-surface, #ffffff) 92%, transparent);
}

.popover-content {
    overflow-y: auto;
}
</style>
<script setup lang="ts">
import { computed, ref, watch, nextTick, onUnmounted } from 'vue'

interface Props {
    show: boolean
    width?: number | string
    maxHeight?: number | string
    popperClass?: string
    anchorEl?: HTMLElement | null
    /** 直接指定 fixed 坐标 { left, top }，跳过自动定位 */
    position?: { left: number; top: number } | null
    /**
     * 宽度跟随锚点元素（左右边界与锚点完全对齐）。
     *
     * <p>输入区弹层（指令 / 附件 / MCP）要求「和输入框一样宽」：只给一个固定
     * px 宽度，窄窗会溢出、宽窗会缩在中间；用锚点实测宽度才能两边都对齐。</p>
     */
    matchAnchorWidth?: boolean
    /** 水平对齐方式：center 以锚点居中（默认，菜单类小弹层）/ start 左对齐 / end 右对齐 */
    align?: 'center' | 'start' | 'end'
    /** 与锚点的垂直间距（px），默认 8 */
    offset?: number
    /**
     * 弹出方向：auto 上下（默认，按可用空间选上或下）/ right 贴锚点右侧、垂直居中。
     *
     * <p>侧栏会话行用 right：上下弹会盖住相邻的会话行，看不到列表本身；
     * 右侧弹只压住内容区，鼠标从行末横移进卡片也不会经过别的行。</p>
     */
    placement?: 'auto' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
    show: false,
    width: 320,
    maxHeight: 400,
    popperClass: '',
    anchorEl: null,
    position: null,
    matchAnchorWidth: false,
    align: 'center',
    offset: 8,
    placement: 'auto',
})

const emit = defineEmits<{
    'update:show': [value: boolean]
    mouseenter: [event: MouseEvent]
    mouseleave: [event: MouseEvent]
}>()

const popoverRef = ref<HTMLElement | null>(null)
const positionStyle = ref<Record<string, any>>({})
// 进入中：初始 opacity:0，下一帧切到 opacity:1 触发 transition；不依赖会被暂停的 rAF/动画
const entering = ref(true)
let resizeObserver: ResizeObserver | null = null

// rAF 在隐藏页面会被暂停，导致定位不执行；隐藏时退化为 setTimeout 兜底
const safeRaf = (cb: () => void) => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible'
        && typeof window.requestAnimationFrame === 'function') {
        return window.requestAnimationFrame(cb)
    }
    return window.setTimeout(cb, 18)
}

// 计算并更新位置
const updatePosition = () => {
    // 如果外部直接传入了坐标，直接使用
    if (props.position) {
        positionStyle.value = {
            position: 'fixed',
            left: `${props.position.left}px`,
            top: `${props.position.top}px`
        }
        return
    }

    if (!props.anchorEl || !popoverRef.value) return

    const rect = props.anchorEl.getBoundingClientRect()
    const popoverElement = popoverRef.value
    const spacing = props.offset
    // 宽度：跟随锚点时用锚点实测宽度，否则按入参（数字 / CSS 长度），
    // 最后退回元素实测宽度 —— 传字符串宽度时旧实现一律按 320 算，横向定位会偏。
    const popoverWidth = props.matchAnchorWidth
        ? rect.width
        : (typeof props.width === 'number' ? props.width : (popoverElement.offsetWidth || 320))

    // 计算水平位置：默认以按钮为中心对齐；输入区弹层用 start / end 贴边
    let left: number
    if (props.align === 'start') {
        left = rect.left
    } else if (props.align === 'end') {
        left = rect.right - popoverWidth
    } else {
        left = rect.left + (rect.width / 2) - (popoverWidth / 2)
    }

    // 边界检查：确保不超出视口左右边界
    const viewportWidth = window.innerWidth

    // 侧向弹出：贴锚点右侧垂直居中；右边放不下就翻到左侧（不留半截在屏幕外）。
    // 这一支不参与「上/下」判定，否则侧栏会话行的卡片会盖住相邻行。
    if (props.placement === 'right') {
        const rightSide = rect.right + spacing
        const leftSide = rect.left - popoverWidth - spacing
        let sideLeft = rightSide + popoverWidth > viewportWidth - 10 && leftSide >= 10
            ? leftSide
            : rightSide
        sideLeft = Math.max(10, Math.min(sideLeft, Math.max(10, viewportWidth - popoverWidth - 10)))

        // 先落宽度与横向位置，避免首帧以默认宽度闪动
        const sideStyle: Record<string, any> = {
            position: 'fixed',
            left: `${sideLeft}px`,
        }
        if (props.matchAnchorWidth) {
            sideStyle.width = `${popoverWidth}px`
        }
        positionStyle.value = sideStyle

        safeRaf(() => {
            const actualHeight = popoverElement.offsetHeight
            // 以锚点垂直中心对齐，再夹进视口；卡片比行高，贴顶会让鼠标一进卡片就掉出可视区
            let top = rect.top + rect.height / 2 - actualHeight / 2
            top = Math.max(10, Math.min(top, window.innerHeight - actualHeight - 10))
            positionStyle.value = {
                ...sideStyle,
                top: `${top}px`,
                bottom: 'auto',
            }
        })
        return
    }

    if (left < 10) {
        left = 10
    } else if (left + popoverWidth > viewportWidth - 10) {
        left = Math.max(10, viewportWidth - popoverWidth - 10)
    }

    // 先把宽度与横向位置落下去：整宽弹层如果等下一帧才改宽度，
    // 打开瞬间会以默认宽度闪一下再跳到输入框宽度，看起来像「弹歪了」。
    const baseStyle: Record<string, any> = {
        position: 'fixed',
        left: `${left}px`,
    }
    if (props.matchAnchorWidth) {
        baseStyle.width = `${popoverWidth}px`
    }
    positionStyle.value = baseStyle

    // 等待下一帧确保元素已渲染
    safeRaf(() => {
        const actualHeight = popoverElement.offsetHeight

        // 计算垂直位置：优先显示在按钮上方
        const spaceAbove = rect.top
        const spaceBelow = window.innerHeight - rect.bottom

        let showAbove: boolean

        if (spaceAbove >= actualHeight + spacing) {
            showAbove = true
        } else if (spaceBelow >= actualHeight + spacing) {
            showAbove = false
        } else {
            showAbove = spaceAbove > spaceBelow
        }

        if (showAbove) {
            // 上方：用 bottom 定位，高度变化时底部不变，不跳动
            positionStyle.value = {
                ...baseStyle,
                bottom: `${window.innerHeight - rect.top + spacing}px`,
                top: 'auto'
            }
        } else {
            // 下方：用 top 定位
            positionStyle.value = {
                ...baseStyle,
                top: `${rect.bottom + spacing}px`,
                bottom: 'auto'
            }
        }
    })
}

// 处理全局点击事件 - 点击外部关闭弹窗
const handleGlobalClick = (e: MouseEvent) => {
    if (!props.show) return

    const target = e.target as EventTarget | null
    // SVG/文本节点等非 Element 目标统一做 Node 守卫，避免 contains 抛参
    const node: Node | null = target instanceof Node ? target : null

    // 如果点击在弹窗内部，不关闭
    if (node && popoverRef.value && popoverRef.value.contains(node)) {
        return
    }

    // 如果点击在锚点元素上，不关闭（避免触发 toggle 后立即关闭）
    if (node && props.anchorEl && props.anchorEl.contains(node)) {
        return
    }

    // 如果有 position（级联模式），检查是否在触发元素上
    if (props.position) {
        // 级联模式下点击外部直接关闭
        if (node && popoverRef.value && popoverRef.value.contains(node)) return
    }

    // 否则关闭弹窗
    emit('update:show', false)
}

// 处理 Esc 键关闭弹窗
const handleEscKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.show) {
        emit('update:show', false)
    }
}

// 计算弹窗位置和样式
const popoverStyle = computed(() => {
    const style: Record<string, any> = {
        width: typeof props.width === 'number' ? `${props.width}px` : props.width,
        maxHeight: typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight
    }

    // 合并动态位置
    return { ...style, ...positionStyle.value }
})

// 处理窗口 resize 和 scroll 事件，更新位置
const handleWindowEvent = (e: Event) => {
    if (!props.show) return
    // resize 事件的 target 是 window（非 Node），直接重定位，不做 contains 判断
    if (e.type === 'resize') {
        updatePosition()
        return
    }
    // 如果 scroll 事件来自弹窗内部，忽略
    // scroll 事件不冒泡，但捕获阶段可以拦截（document 的 target 可能是 document 自身）
    const target = e.target
    const node: Node | null = target instanceof Node ? target : null
    if (node && popoverRef.value && popoverRef.value.contains(node)) return
    updatePosition()
}

// 监听可见性变化，统一管理所有副作用
watch(() => props.show, async (newVal) => {
    if (newVal) {
        entering.value = true
        // DOM 更新后计算位置
        await nextTick()
        updatePosition()
        // 下一帧（隐藏时 safeRaf 退化为 setTimeout）切换到 opacity:1，触发淡入 transition
        safeRaf(() => { entering.value = false })

        // 监听内容尺寸变化，自动重新定位
        if (popoverRef.value && !resizeObserver) {
            resizeObserver = new ResizeObserver(() => {
                if (props.show) updatePosition()
            })
            resizeObserver.observe(popoverRef.value)
        }

        // 延迟添加监听器，避免立即触发关闭
        await nextTick()
        document.addEventListener('click', handleGlobalClick, true)
        document.addEventListener('keydown', handleEscKey)
        window.addEventListener('resize', handleWindowEvent)
        window.addEventListener('scroll', handleWindowEvent, true)
    } else {
        entering.value = true
        // 移除所有监听器
        if (resizeObserver) {
            resizeObserver.disconnect()
            resizeObserver = null
        }
        document.removeEventListener('click', handleGlobalClick, true)
        document.removeEventListener('keydown', handleEscKey)
        window.removeEventListener('resize', handleWindowEvent)
        window.removeEventListener('scroll', handleWindowEvent, true)
    }
})

// 组件卸载时清理监听器
onUnmounted(() => {
    if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
    }
    document.removeEventListener('click', handleGlobalClick, true)
    document.removeEventListener('keydown', handleEscKey)
    window.removeEventListener('resize', handleWindowEvent)
    window.removeEventListener('scroll', handleWindowEvent, true)
})
</script>

<style scoped>
/* 进入淡入：初始 pop-init opacity:0，下一帧切到 pop-run opacity:1 并带 transition。
   类切换由 safeRaf（隐藏时退化为 setTimeout）驱动，不依赖会在隐藏页面暂停的 rAF/动画。*/
.pop-init {
    opacity: 0;
}

.pop-run {
    opacity: 1;
    transition: opacity 0.18s ease-out;
}
</style>
