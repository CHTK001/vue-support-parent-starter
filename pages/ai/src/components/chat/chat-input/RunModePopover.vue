<template>
  <CustomPopover :show="visible" @update:show="$emit('update:visible', $event)" :width="260" :anchor-el="anchorEl"
    popper-class="rm-popover">
    <div ref="panelRef" class="rm-panel" tabindex="-1" @keydown="onKeydown">
      <div class="rm-caption">{{ t('chat.input.agentSectionTitle') }}</div>

      <div v-if="options.length" class="rm-list" role="listbox" :aria-label="t('chat.input.agentSectionTitle')">
        <div v-for="(opt, i) in options" :key="opt.value" class="rm-item" :class="{ 'is-active': i === activeIndex }"
          role="option" :aria-selected="opt.value === currentValue" :title="opt.desc || opt.label"
          @click="handleSelect(opt.value)" @mouseenter="activeIndex = i">
          <span class="rm-dot" :class="dotClass(opt.value)" aria-hidden="true"></span>
          <span class="rm-item__label">{{ opt.label }}</span>
          <el-icon v-if="currentValue === opt.value" :size="14" class="rm-item__check">
            <Checkmark24Regular />
          </el-icon>
        </div>
      </div>

      <p v-else class="rm-empty">{{ t('chat.input.runModeFormEmpty') }}</p>

      <div class="rm-foot">
        <span>{{ t('chat.input.hintNavigate') }}</span>
        <span>{{ t('chat.input.hintSelect') }}</span>
        <span>{{ t('chat.input.hintClose') }}</span>
      </div>
    </div>
  </CustomPopover>
</template>

<script setup lang="ts">
/**
 * 形态（智能体）切换浮层。
 *
 * <p>选项<b>由调用方传入</b>：形态定义来自角色配置（{@code /v2/prompt-forms}），
 * 用户在角色里加的第三种形态必须能在这里选到。</p>
 *
 * <p>形态对齐目标 UI：一行一个圆点 + 名称 + 当前项打勾；描述不占行，
 * 收进 title，避免每行两行文字把面板撑高。</p>
 */
import { nextTick, ref, watch } from 'vue'
import { ElIcon } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Checkmark24Regular } from '@vicons/fluent'
import CustomPopover from '../../ui/CustomPopover.vue'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
  currentValue: string
  options: Array<{ value: string; label: string; desc?: string }>
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'select': [mode: string]
}>()

const panelRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)

/**
 * 圆点配色：构建 = 暖橙、规划 = 青绿，其余自定义形态回落主色。
 *
 * @param value 形态 key
 * @returns 追加到 .rm-dot 的类名
 */
function dotClass(value: string): string {
  if (value === 'build') {
    return 'is-build'
  }
  if (value === 'plan') {
    return 'is-plan'
  }
  return ''
}

function handleSelect(mode: string): void {
  emit('select', mode)
  emit('update:visible', false)
}

/**
 * 键盘导航：↑↓ 移动、Enter/Space 选中、Esc 关闭。
 *
 * @param e 键盘事件
 */
function onKeydown(e: KeyboardEvent): void {
  const len = props.options.length
  if (!len) {
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % len
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + len) % len
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    const opt = props.options[activeIndex.value]
    if (opt) {
      handleSelect(opt.value)
    }
  } else if (e.key === 'Escape') {
    e.preventDefault()
    emit('update:visible', false)
  }
}

watch(() => props.visible, (visible) => {
  if (!visible) {
    return
  }
  const idx = props.options.findIndex(o => o.value === props.currentValue)
  activeIndex.value = idx === -1 ? 0 : idx
  void nextTick(() => panelRef.value?.focus())
}, { immediate: true })
</script>

<style scoped>
.rm-panel {
  display: flex;
  flex-direction: column;
  padding: 4px 2px 2px;
  outline: none;
}

.rm-caption {
  padding: 4px 8px 6px;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  font-size: 11px;
  line-height: 16px;
  font-weight: 500;
  letter-spacing: 0.02em;
  user-select: none;
}

.rm-list {
  display: flex;
  flex-direction: column;
}

.rm-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 8px;
  border-radius: 6px;
  color: var(--text-primary, var(--el-text-color-primary));
  font-size: 13px;
  line-height: 18px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.12s ease;
}

.rm-item.is-active {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 6%, transparent);
}

/* 6px 圆点：截图里「Build / Plan」左侧的彩色点，是形态唯一的高饱和元素 */
.rm-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--el-color-primary);
}

.rm-dot.is-build {
  background: var(--el-color-warning, #e6a23c);
}

.rm-dot.is-plan {
  background: var(--el-color-success, #3da35d);
}

.rm-item__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rm-item__check {
  flex-shrink: 0;
  color: var(--text-primary, var(--el-text-color-primary));
}

.rm-empty {
  margin: 0;
  padding: 6px 8px 10px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-size: 12px;
  line-height: 18px;
}

.rm-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  padding: 6px 8px 2px;
  border-top: 1px solid var(--border-default, var(--el-border-color-lighter));
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-size: 11px;
  line-height: 16px;
  user-select: none;
}

@media (prefers-reduced-motion: reduce) {
  .rm-item {
    transition: none;
  }
}
</style>
