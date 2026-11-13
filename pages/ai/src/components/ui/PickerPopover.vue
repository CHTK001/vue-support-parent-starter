<template>
    <!--
        下拉选择的外壳：和会话页（ChatInput 的模型 / 思考 / 形态面板）同一套弹层。

        会话里所有下拉都是 CustomPopover + 面板内 30px 行 + 分区小标题 + 页脚按键提示；
        生图页早先用 el-popover，圆角、底色、阴影、进出场各一套，两个页面来回切
        观感是割裂的。这里把外壳统一收口：调用方只给触发器和面板内容。
    -->
    <span ref="anchorRef" class="picker-anchor">
        <slot name="trigger" :toggle="toggle" :open="show"></slot>
    </span>
    <CustomPopover :show="show" :width="width" :max-height="maxHeight" :anchor-el="anchorRef" :align="align"
        :offset="offset" :popper-class="'picker-popover'" @update:show="onShow">
        <div ref="panelRef" class="picker-panel" tabindex="-1" @keydown="onKeydown">
            <slot :close="close"></slot>
        </div>
    </CustomPopover>
</template>

<script setup lang="ts">
/**
 * 统一的下拉选择弹层（CustomPopover 外壳 + 会话同款交互）。
 *
 * <p>键盘：↑↓ 在 `.wg-menu-item` 之间移动（`.is-nav` 高亮）、Enter 触发当前项、
 * Esc 关闭。鼠标与键盘共用同一批行，键盘移动时把 `.is-nav` 滚进可视区。</p>
 */
import { nextTick, ref, watch } from 'vue'
import CustomPopover from './CustomPopover.vue'

const props = withDefaults(
    defineProps<{
        show: boolean
        /** 弹层宽度（px 或 CSS 长度） */
        width?: number | string
        /** 弹层最大高度 */
        maxHeight?: number | string
        /** 与触发器的水平对齐：start 左对齐 / end 右对齐 / center 居中 */
        align?: 'start' | 'end' | 'center'
        /** 与触发器的垂直间距 */
        offset?: number
    }>(),
    {
        width: 300,
        maxHeight: 420,
        align: 'start',
        offset: 8,
    },
)

const emit = defineEmits<{
    'update:show': [value: boolean]
}>()

const anchorRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

/** 键盘移动的落点；-1 表示还没有键盘高亮 */
const navIndex = ref(-1)

/** 可选行：会话面板里的行就是列表项，选项和危险操作共用 .wg-menu-item */
const navItems = (): HTMLElement[] => {
    const root = panelRef.value
    if (!root) {
        return []
    }
    return Array.from(root.querySelectorAll<HTMLElement>('.wg-menu-item')).filter(
        (el) => !el.hasAttribute('disabled'),
    )
}

const clearNav = () => {
    navIndex.value = -1
    navItems().forEach((el) => el.classList.remove('is-nav'))
}

const moveNav = (delta: number) => {
    const items = navItems()
    if (!items.length) {
        return
    }
    const next = (navIndex.value + delta + items.length) % items.length
    navIndex.value = next
    items.forEach((el, i) => el.classList.toggle('is-nav', i === next))
    items[next]?.scrollIntoView({ block: 'nearest' })
}

const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
        e.preventDefault()
        moveNav(1)
    } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        moveNav(-1)
    } else if (e.key === 'Enter') {
        const items = navItems()
        const hit = items[navIndex.value]
        if (hit) {
            e.preventDefault()
            hit.click()
        }
    }
}

/** 点触发器：切换。父级用 v-model:show 收口，同一个页面只保留一个弹层 */
const toggle = () => {
    emit('update:show', !props.show)
}

const close = () => {
    emit('update:show', false)
}

const onShow = (value: boolean) => {
    emit('update:show', value)
}

watch(
    () => props.show,
    (visible) => {
        if (!visible) {
            clearNav()
            return
        }
        // 打开后把焦点放进面板：不抢焦点的话 ↑↓ 落在输入框上，键盘导航成了死代码
        void nextTick(() => panelRef.value?.focus())
    },
)
</script>

<style scoped>
.picker-anchor {
    display: inline-flex;
    min-width: 0;
}

.picker-panel {
    display: flex;
    flex-direction: column;
    padding: 4px 2px 2px;
    outline: none;
}
</style>
