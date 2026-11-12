<template>
  <CustomPopover :show="visible" @update:show="$emit('update:visible', $event)" :width="width" :anchor-el="anchorEl"
    popper-class="te-popover">
    <div ref="panelRef" class="te-panel" tabindex="-1" @keydown="onKeydown">
      <!-- 分区标题：截图里第一行就是「思考」，不做带图标的大标题 -->
      <div class="te-caption">{{ t('chat.input.thinkingSectionTitle') }}</div>

      <div class="te-list" role="listbox" :aria-label="t('chat.input.thinkingLevelTitle')">
        <div v-for="(opt, i) in options" :key="opt" class="te-item" :class="{ 'is-active': i === activeIndex }"
          role="option" :aria-selected="opt === currentValue" @click="commit(opt)" @mouseenter="activeIndex = i">
          <!-- 主标签是英文档位名（none / minimal / low / medium / high / max），
               副标题是当前语言的解释。英文界面下两者相同，副标题自动不渲染。 -->
          <span class="te-item__body">
            <span class="te-item__label">{{ getPrimaryLabel(opt) }}</span>
            <span v-if="getSubLabel(opt)" class="te-item__sub">{{ getSubLabel(opt) }}</span>
          </span>
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

/**
 * 主标签：英文档位规范名（none / low / medium / high / max …）。
 *
 * <p>取不到翻译时退回原始值，保证任何后端白名单值都有可读文字。</p>
 *
 * @param effort 档位键
 * @returns 英文规范名
 */
function getPrimaryLabel(effort: string): string {
  const key = `common.thinkingEffortLabel.${effort}`
  const label = t(key)
  return label !== key ? label : effort
}

/**
 * 副标题：当前语言的解释（中文界面就是「不思考 / 低强度」）。
 *
 * @param effort 档位键
 * @returns 副标题；与主标签相同时返回空串，界面不渲染第二行
 */
function getSubLabel(effort: string): string {
  const localized = getLabel(effort)
  return localized === getPrimaryLabel(effort) ? '' : localized
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

/* 行高：单行档位 30px，带副标题的两行档位约 40px。
   同一行内右侧勾选始终垂直居中，列表不会因为有无副标题而错位。 */
.te-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 30px;
  padding: 5px 8px;
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

/* 主标签 + 副标题：主标签是英文档位名，副标题是当前语言的解释 */
.te-item__body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.te-item__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.te-item__sub {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  line-height: 15px;
  color: var(--text-tertiary, var(--el-text-color-secondary));
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
