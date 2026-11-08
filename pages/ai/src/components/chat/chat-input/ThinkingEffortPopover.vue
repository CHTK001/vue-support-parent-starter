<template>
  <CustomPopover :show="visible" @update:show="$emit('update:visible', $event)" :width="width" :anchor-el="anchorEl"
    popper-class="te-popover">
    <div ref="panelRef" class="te-panel" tabindex="-1" @keydown="onKeydown">
      <!-- 分区标题：截图里第一行就是「思考」，不做带图标的大标题 -->
      <div class="te-caption">{{ t('chat.input.thinkingSectionTitle') }}</div>

      <div class="te-list" role="listbox" :aria-label="t('chat.input.thinkingLevelTitle')">
        <div v-for="(opt, i) in options" :key="opt" class="te-item" :class="{ 'is-active': i === activeIndex }"
          role="option" :aria-selected="opt === currentValue" @click="commit(opt)" @mouseenter="activeIndex = i">
          <span class="te-item__label">{{ getLabel(opt) }}</span>
          <el-icon v-if="opt === currentValue" :size="14" class="te-item__check">
            <Checkmark24Regular />
          </el-icon>
        </div>
      </div>

      <div class="te-foot">
        <span>{{ t('chat.input.hintNavigate') }}</span>
        <span>{{ t('chat.input.hintSelect') }}</span>
        <span>{{ t('chat.input.hintClose') }}</span>
      </div>
    </div>
  </CustomPopover>
</template>

<script setup lang="ts">
/**
 * 思考档位浮层。
 *
 * <p>形态对齐目标 UI：一个纵向列表（默认 / low / medium / high …），
 * 当前档位右侧打勾，底部一行按键提示。原先的滑块形态在面板里占地大、
 * 且档位名称看不全，改成列表后 5 档一屏可见，↑↓ 可直接选。</p>
 */
import { nextTick, ref, watch } from 'vue'
import { ElIcon } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Checkmark24Regular } from '@vicons/fluent'
import CustomPopover from '../../ui/CustomPopover.vue'
import { getThinkingEffortLabel } from '@/utils/modelUtils'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
  options: string[]
  currentValue: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'select': [effort: string]
}>()

const width = 300

const panelRef = ref<HTMLElement | null>(null)
/** 键盘高亮行：与「当前生效档位」分离，↑↓ 只移动高亮，Enter 才落库 */
const activeIndex = ref(0)

function getLabel(effort: string): string {
  return getThinkingEffortLabel(effort)
}

function commit(effort: string): void {
  emit('select', effort)
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
  } else if (e.key === 'Home') {
    e.preventDefault()
    activeIndex.value = 0
  } else if (e.key === 'End') {
    e.preventDefault()
    activeIndex.value = len - 1
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    const opt = props.options[activeIndex.value]
    if (opt) {
      commit(opt)
    }
  } else if (e.key === 'Escape') {
    e.preventDefault()
    emit('update:visible', false)
  }
}

// 打开时把高亮停在当前档位，并把焦点交给面板（否则键盘事件收不到）
watch(() => props.visible, (visible) => {
  if (!visible) {
    return
  }
  const idx = props.options.indexOf(props.currentValue)
  activeIndex.value = idx === -1 ? 0 : idx
  void nextTick(() => panelRef.value?.focus())
}, { immediate: true })
</script>

<style scoped>
.te-panel {
  display: flex;
  flex-direction: column;
  padding: 4px 2px 2px;
  outline: none;
}

.te-caption {
  padding: 4px 8px 6px;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  font-size: 11px;
  line-height: 16px;
  font-weight: 500;
  letter-spacing: 0.02em;
  user-select: none;
}

.te-list {
  display: flex;
  flex-direction: column;
}

/* 行高 30px：与模型 / 智能体下拉的行高一致，三个面板切换时不会跳 */
.te-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.te-item.is-active {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 6%, transparent);
}

.te-item__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.te-item__check {
  flex-shrink: 0;
  color: var(--text-primary, var(--el-text-color-primary));
}

/* 底部按键提示：小号、低对比，只做「这里能用键盘」的声明 */
.te-foot {
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
  .te-item {
    transition: none;
  }
}
</style>
