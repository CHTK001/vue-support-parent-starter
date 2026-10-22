<template>
  <span
    ref="triggerRef"
    class="l-tooltip__trigger"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @focus="onMouseEnter"
    @blur="onMouseLeave"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import {
  showTooltip,
  hideTooltip,
  type TooltipPlacement,
  type TooltipEffect,
} from './tooltip'

const props = withDefaults(
  defineProps<{
    content?: string
    placement?: TooltipPlacement
    effect?: TooltipEffect
  }>(),
  {
    content: '',
    placement: 'top',
    effect: 'dark',
  },
)

const triggerRef = ref<HTMLElement | null>(null)

function onMouseEnter(): void {
  if (!props.content || !triggerRef.value) return
  showTooltip(triggerRef.value, props.content, props.placement, props.effect)
}

function onMouseLeave(): void {
  hideTooltip()
}

onUnmounted(() => {
  hideTooltip()
})
</script>

<style scoped>
.l-tooltip__trigger {
  display: inline-flex;
}
</style>

<!--
  全局 tooltip 样式必须随组件自身分发，而不是依赖宿主应用的全局样式表：
  LTooltip 把 .l-tooltip 元素 append 到 document.body，若它只在 app 的
  style.css / refactor.css 里定义，AI 页面被其它模块（如 eduai 的 ai-provider）
  嵌入集成时宿主没加载那份全局 CSS，tooltip 就只剩固定定位、没有背景/描边。
  这里用非 scoped style 声明一遍，凡引用本组件的页面都会自带这套样式。
-->
<style>
.l-tooltip {
  --l-tooltip-bg: #0f172a;
  --l-tooltip-text: #fff;
}
.l-tooltip[data-effect="light"] {
  --l-tooltip-bg: #fff;
  --l-tooltip-text: #0f172a;
}
.l-tooltip__content {
  display: block;
  background: var(--l-tooltip-bg);
  color: var(--l-tooltip-text);
  font-size: 12px;
  line-height: 1.4;
  padding: 6px 11px;
  border-radius: 8px;
  max-width: 300px;
  word-break: break-word;
  white-space: pre-line;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
}
.l-tooltip__arrow {
  position: absolute;
  width: 0;
  height: 0;
  border: 5px solid transparent;
}
.l-tooltip[data-placement="top"] .l-tooltip__arrow {
  border-top-color: var(--l-tooltip-bg);
  left: 50%;
  transform: translateX(-50%);
  top: 100%;
}
.l-tooltip[data-placement="bottom"] .l-tooltip__arrow {
  border-bottom-color: var(--l-tooltip-bg);
  left: 50%;
  transform: translateX(-50%);
  top: -5px;
}
.l-tooltip[data-placement="left"] .l-tooltip__arrow {
  border-left-color: var(--l-tooltip-bg);
  top: 50%;
  transform: translateY(-50%);
  left: 100%;
}
.l-tooltip[data-placement="right"] .l-tooltip__arrow {
  border-right-color: var(--l-tooltip-bg);
  top: 50%;
  transform: translateY(-50%);
  left: -5px;
}
</style>
