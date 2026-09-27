<template>
  <el-button
    :type="type"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    :plain="plain"
    :round="round"
    :circle="circle"
    :icon="icon"
    @click="$emit('click', $event)"
    class="re-button"
    :class="[`re-button--${type}`, { 're-button--plain': plain }]"
  >
    <slot />
  </el-button>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'

defineProps({
  type: {
    type: String as PropType<
      '' | 'text' | 'primary' | 'default' | 'success' | 'info' | 'warning' | 'danger'
    >,
    default: 'primary',
  },
  size: { type: String as PropType<'' | 'small' | 'default' | 'large'>, default: 'default' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  plain: { type: Boolean, default: false },
  round: { type: Boolean, default: true },
  circle: { type: Boolean, default: false },
  icon: { type: [String, Object], default: undefined },
})

defineEmits(['click'])
</script>

<style scoped>
.re-button {
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  padding: 0 18px;
  height: 36px;
  letter-spacing: 0.01em;
}

.re-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.re-button:active {
  transform: translateY(0);
}

.re-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.re-button--primary:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.re-button--primary.re-button--plain {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.re-button--success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border: none;
  color: white;
}

.re-button--warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border: none;
  color: white;
}

.re-button--danger {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
  border: none;
  color: white;
}

.re-button--default {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.re-button--default:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f8fafc;
}

.re-button :deep(.el-icon) {
  font-size: 16px;
}
</style>
