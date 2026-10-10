<template>
  <CustomPopover :show="visible" @update:show="$emit('update:visible', $event)" :width="180" :anchor-el="anchorEl">
    <template #header>
      <div class="flex items-center gap-2">
        <el-icon size="16" class="text-gray-600 dark:text-gray-400">
          <LightbulbFilament24Regular />
        </el-icon>
        <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ t('chat.input.thinkingLevelTitle') }}</span>
      </div>
    </template>
    <div class="popover-content space-y-0.5">
      <template v-for="item in items" :key="item.effort">
        <!-- 分组分隔线：把「不思考 / 默认」与「模型配置的档位」分开（对齐设计稿） -->
        <div v-if="item.divider" class="te-divider" role="separator"></div>
        <div
          class="te-item flex items-center justify-between px-2 py-1.5 rounded-(--size-dialog-rounded-radius) cursor-pointer transition-all text-sm"
          :class="{ 'te-item-active': currentValue === item.effort }" :data-effort="item.effort"
          @click="handleSelect(item.effort)">
          <span>{{ getLabel(item.effort) }}</span>
          <el-icon v-if="currentValue === item.effort" size="14" class="text-primary">
            <Checkmark24Regular />
          </el-icon>
        </div>
      </template>
    </div>
  </CustomPopover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElIcon } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { LightbulbFilament24Regular, Checkmark24Regular } from '@vicons/fluent'
import CustomPopover from '../../ui/CustomPopover.vue'
import { getThinkingEffortLabel } from '@/utils/modelUtils'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
  options: string[]
  currentValue: string
  /** 在该档位之后插入分组分隔线（模型配置档位与「默认」之间的视觉分组） */
  dividerAfter?: string
}>(), {
  dividerAfter: 'default',
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'select': [effort: string]
}>()

/** 列表项：标记哪些项之前需要画分隔线 */
const items = computed(() =>
  props.options.map((effort, index) => ({
    effort,
    divider: index > 0 && props.options[index - 1] === props.dividerAfter,
  })),
)

/**
 * 获取思考强度的显示标签
 */
function getLabel(effort: string): string {
  return getThinkingEffortLabel(effort)
}

/**
 * 处理选择思考强度
 */
function handleSelect(effort: string) {
  emit('select', effort)
  emit('update:visible', false)
}
</script>

<style scoped>
.popover-content {
  padding: 4px 0;
}

.te-item:hover {
  background: var(--color-sidebar-bg-hover);
}

.te-item-active {
  background: var(--color-sidebar-bg-active);
}

/* 分组分隔线：「默认」与模型配置档位之间 */
.te-divider {
  height: 1px;
  margin: 4px 6px;
  background: var(--el-border-color-extra-light, var(--el-border-color-lighter));
}
</style>
