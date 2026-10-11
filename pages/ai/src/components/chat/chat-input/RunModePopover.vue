<template>
  <CustomPopover :show="visible" @update:show="$emit('update:visible', $event)" :width="280" :anchor-el="anchorEl">
    <template #header>
    </template>
    <div class="popover-content space-y-0.5">
      <div v-for="opt in options" :key="opt.value"
        class="rm-item flex items-center justify-between px-1.5 py-1.5 cursor-pointer transition-all text-sm rounded-(--size-dialog-rounded-radius)"
        @click="handleSelect(opt.value)">
        <div class="flex items-center space-x-2 min-w-0">
          <el-icon size="16" class="text-gray-500 dark:text-gray-400 shrink-0">
            <component :is="opt.icon" />
          </el-icon>
          <div class="flex flex-col min-w-0">
            <span class="truncate">{{ opt.label }}</span>
            <span v-if="opt.desc" class="text-xs text-gray-400 dark:text-gray-500 truncate">{{ opt.desc }}</span>
          </div>
        </div>
        <el-icon v-if="currentValue === opt.value" size="16" class="text-gray-500 dark:text-gray-400 shrink-0">
          <CheckmarkCircle20Filled />
        </el-icon>
      </div>
      <p v-if="options.length === 0" class="px-1.5 py-2 text-xs text-gray-400 dark:text-gray-500">
        {{ t('chat.input.runModeFormEmpty') }}
      </p>
    </div>
  </CustomPopover>
</template>

<script setup lang="ts">
/**
 * 形态切换浮层。
 *
 * <p>选项<b>由调用方传入</b>，本组件不再自带 build/plan 列表——形态定义来自角色
 * 配置（{@code /v2/prompt-forms}），用户在角色里加的第三种形态必须能在这里选到，
 * 否则又变成「配了却选不到」。</p>
 */
import { type Component } from 'vue'
import { ElIcon } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { CheckmarkCircle20Filled } from '@vicons/fluent'
import CustomPopover from '../../ui/CustomPopover.vue'

const { t } = useI18n()

defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
  currentValue: string
  options: Array<{ value: string; label: string; desc?: string; icon: Component }>
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'select': [mode: string]
}>()

function handleSelect(mode: string) {
  emit('select', mode)
  emit('update:visible', false)
}
</script>

<style scoped>
.popover-content {
  padding: 0;
}

.rm-item:hover {
  background: var(--color-sidebar-bg-hover);
}
</style>
