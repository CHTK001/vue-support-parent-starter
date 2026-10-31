<template>
  <div class="re-switch-wrapper">
    <ReSwitchBase
      v-model="switchValue"
      :title="label || undefined"
      :size="size || undefined"
      :disabled="disabled"
      :active-text="activeText"
      :inactive-text="inactiveText"
      @change="$emit('change', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { ComponentSize } from 'element-plus'
import ReSwitchBase from '@repo/ui/re-switch'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  size: { type: String as PropType<ComponentSize | ''>, default: 'default' },
  disabled: { type: Boolean, default: false },
  activeText: { type: String, default: '' },
  inactiveText: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'change'])

const switchValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>

<style scoped>
.re-switch-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 原 border-radius: 20px 是「写死当前高度」的胶囊：尺寸档一变就露馅。
   改用语义就是胶囊的 --el-radius-full，任意高度下都保持两端满圆。 */
.re-switch-wrapper :deep(.el-switch__core) {
  border-radius: var(--el-radius-full, 9999px);
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}

/* 开启态：与 ReButton 同口径，渐变两端取「本色 / 本色 dark-2」两档令牌 */
.re-switch-wrapper :deep(.el-switch.is-checked .el-switch__core) {
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
  border-color: transparent;
}

/* 滑块：border-radius 保持 50%（圆形滑块不是胶囊，不套 full 档）；
   阴影是滑块叠在轨道上的必要投影，不属于「卡片投影」禁令范围 */
.re-switch-wrapper :deep(.el-switch__core .el-switch__action) {
  border-radius: 50%;
  box-shadow: 0 2px 4px color-mix(in srgb, var(--el-text-color-primary) 20%, transparent);
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .re-switch-wrapper :deep(.el-switch__core) {
    transition: none;
  }
}
</style>