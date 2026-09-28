<template>
  <div
    class="set-row"
    :class="{ 'set-row--clickable': clickable, 'set-row--stack': stack, 'is-disabled': disabled }"
    @click="clickable && $emit('row-click', $event)"
  >
    <div class="set-row-body">
      <div class="set-row-text">
        <span class="set-row-label">
          <slot name="label">{{ label }}</slot>
          <span v-if="badge" class="set-row-badge">{{ badge }}</span>
        </span>
        <span v-if="description || $slots.description" class="set-row-desc">
          <slot name="description">{{ description }}</slot>
        </span>
      </div>
      <div v-if="$slots.default" class="set-row-control" :style="controlStyle">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 统一的设置行（现代化扁平设计系统）：左侧标签 + 说明，右侧控件。
 * 同一卡片内相邻行自动出现内凹分隔线；控件右缘对齐；全部走 CSS 变量，自动适配深色。
 */
defineOptions({ name: 'SettingsRow' })
const props = defineProps<{
  label?: string
  description?: string
  badge?: string
  /** 控件区宽度（CSS 值，如 220px） */
  controlWidth?: string
  /** 控件区占满剩余宽度 */
  controlFlex?: boolean
  /** 整行可点击（出现 hover 反馈） */
  clickable?: boolean
  /** 控件在标签下方（竖向布局） */
  stack?: boolean
  disabled?: boolean
}>()
defineEmits<{ 'row-click': [evt: MouseEvent] }>()

const controlStyle = computed(() => {
  if (props.controlFlex) return { flex: '0 1 380px', width: '380px', maxWidth: '100%', minWidth: '180px' }
  if (props.controlWidth) {
    // 静态属性传入无单位字符串（如 "200"），补 px
    const width = /^\d+(\.\d+)?$/.test(props.controlWidth)
      ? `${props.controlWidth}px`
      : props.controlWidth
    return { width, flex: '0 0 auto' }
  }
  return { flex: '0 0 auto' }
})
</script>

<style scoped>
.set-row { position: relative; }
.set-row + .set-row::before {
  content: ''; position: absolute; top: 0;
  left: 18px; right: 18px; height: 1px;
  background: var(--el-border-color-lighter);
  pointer-events: none;
}

.set-row-body {
  display: flex; align-items: center; justify-content: space-between;
  gap: 20px; padding: 15px 18px;
}
.set-row--stack .set-row-body { flex-direction: column; align-items: stretch; gap: 12px; }

.set-row-text { min-width: 0; display: flex; flex-direction: column; gap: 4px; flex: 1 1 auto; padding-right: 8px; }
.set-row-label {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 13.5px; font-weight: 600; line-height: 1.4;
  color: var(--el-text-color-primary);
}
.set-row-badge {
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.set-row-desc { font-size: 12px; line-height: 1.6; color: var(--el-text-color-secondary); }

.set-row-control {
  display: flex; align-items: center; justify-content: flex-end;
  min-width: 0; flex-shrink: 0;
}
.set-row--stack .set-row-control { justify-content: flex-start; }
.set-row-control :deep(.el-switch) { flex-shrink: 0; }

.set-row--clickable { cursor: pointer; transition: background 0.16s ease; }
.set-row--clickable:hover { background: var(--el-fill-color-light); }
.set-row.is-disabled { opacity: 0.55; }

/* 控件宽度占满时，内部表单元素跟随 */
.set-row-control :deep(.el-select),
.set-row-control :deep(.el-input-number),
.set-row-control :deep(.el-input) { width: 100%; }

/* 动效降级：系统开启「减少动态效果」时，可点击行的悬停底色直接到位。
   只关 .set-row--clickable 自己的 transition，不写 `*` / `.set-row *` 通配，
   避免把行内 el-switch / el-select / el-input 内部 Element Plus 组件的合法过渡
   （尤其输入框的 focus 描边）一起掐掉。
   本文件只有 transition、无 animation，hover 底色本身是静态样式。 */
@media (prefers-reduced-motion: reduce) {
  .set-row--clickable {
    transition: none;
  }
}

/* 键盘焦点可见性：可点击设置行是带 @click 的 div（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式原有 cursor: pointer 已在上面声明，不重复写。
   环用主色 12% —— 行底色透明、落在设置卡片表面色上，一档主色描边足够可见。 */
.set-row--clickable {
  outline: none;
}

.set-row--clickable:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
</style>
