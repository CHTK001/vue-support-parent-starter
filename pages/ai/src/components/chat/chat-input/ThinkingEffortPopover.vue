<template>
  <CustomPopover :show="visible" @update:show="$emit('update:visible', $event)" :width="width" :anchor-el="anchorEl">
    <template #header>
      <div class="te-header">
        <div class="te-title-row">
          <el-icon size="16" class="te-title-icon">
            <LightbulbFilament24Regular />
          </el-icon>
          <span class="te-title">{{ t('chat.input.thinkingEffortSelectorTitle') }}</span>
        </div>
        <span class="te-current-badge" :class="{ 'is-off': currentIndex === 0 }">{{ getLabel(currentValue) }}</span>
      </div>
    </template>

    <ThinkingEffortSlider
      :options="options"
      :model-value="currentValue"
      :aria-label="t('chat.input.thinkingEffortSelectorTitle')"
      @select="handleSliderSelect"
      @commit="handleSliderCommit"
    />
  </CustomPopover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElIcon } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { LightbulbFilament24Regular } from '@vicons/fluent'
import CustomPopover from '../../ui/CustomPopover.vue'
import ThinkingEffortSlider from './ThinkingEffortSlider.vue'
import { getThinkingEffortLabel } from '@/utils/modelUtils'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
  options: string[]
  currentValue: string
  /** 该档位之后曾用于分组分隔线；滑块形态下仅用于定位「默认」位置，无视觉分隔 */
  dividerAfter?: string
}>(), {
  dividerAfter: 'default',
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'select': [effort: string]
}>()

const width = 300

/** 当前档位下标（找不到时取 0 = 最左「不思考」） */
const currentIndex = computed(() => {
  const idx = props.options.indexOf(props.currentValue)
  return idx === -1 ? 0 : idx
})

function getLabel(effort: string): string {
  return getThinkingEffortLabel(effort)
}

/** 滑块值变更（点击/拖拽/键盘）：转发给父组件 */
function handleSliderSelect(effort: string): void {
  emit('select', effort)
}

/** 滑块完成确定选择（点标签/点轨道/键盘）：转发并收起弹层 */
function handleSliderCommit(effort: string): void {
  emit('select', effort)
  emit('update:visible', false)
}
</script>

<style scoped>
.te-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 2px 2px 10px;
}

.te-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.te-title-icon {
  color: var(--color-primary, var(--el-color-primary));
  flex-shrink: 0;
}

.te-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, var(--el-text-color-primary));
  white-space: nowrap;
}

.te-current-badge {
  flex-shrink: 0;
  font-size: 12px;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 999px;
  color: var(--color-primary, var(--el-color-primary));
  background: var(--color-primary-50, var(--el-color-primary-light-9));
}
.te-current-badge.is-off {
  color: var(--color-text-gray, var(--el-text-color-secondary));
  background: var(--color-surface-hover, var(--el-fill-color-light));
}
</style>