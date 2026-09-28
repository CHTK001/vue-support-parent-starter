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
import type { PropType } from 'vue'
import type { ComponentSize } from 'element-plus'

defineProps({
  type: {
    type: String as PropType<
      '' | 'default' | 'text' | 'primary' | 'success' | 'info' | 'warning' | 'danger'
    >,
    default: 'primary',
  },
  size: { type: String as PropType<ComponentSize | ''>, default: 'default' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  plain: { type: Boolean, default: false },
  round: { type: Boolean, default: true },
  circle: { type: Boolean, default: false },
  icon: { type: [String, Object] as PropType<string | object>, default: undefined },
})

defineEmits(['click'])
</script>

<style scoped>
/* ============ 基础：圆角 / 过渡走 koi 令牌，主题与暗色自动跟随 ============ */
.re-button {
  font-weight: 500;
  /* 原 0.2s + cubic-bezier(0.4, 0, 0.2, 1)：曲线与 ease 等价，时长改由 --el-transition-duration 统管 */
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
  border-radius: var(--el-radius-md, 8px);
  padding: 0 18px;
  height: 36px;
  letter-spacing: 0.01em;
}

/* 悬浮浮起：阴影属 koi 允许的两类之一（另一类是键盘焦点环），
   颜色改从文字色混色而来，暗色模式下不会出现「黑影糊在深底上」 */
.re-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--el-text-color-primary) 15%, transparent);
}

.re-button:active {
  transform: translateY(0);
}

/* 语义色：渐变两端分别取「本色 / 本色 dark-2」两档令牌。
   原来写死的是紫色系渐变，主题切换后会与主色打架，必须跟主题走。 */
.re-button--primary {
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
  border: none;
  color: var(--el-color-white);
}

.re-button--primary:hover {
  background: linear-gradient(135deg, var(--el-color-primary-dark-2) 0%, var(--el-color-primary) 100%);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
}

/* plain 浅底：主色低透明度混色，暗色下由底色透出，仍与文字保持对比 */
.re-button--primary.re-button--plain {
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}

.re-button--success {
  background: linear-gradient(135deg, var(--el-color-success) 0%, var(--el-color-success-dark-2) 100%);
  border: none;
  color: var(--el-color-white);
}

.re-button--warning {
  background: linear-gradient(135deg, var(--el-color-warning) 0%, var(--el-color-warning-dark-2) 100%);
  border: none;
  color: var(--el-color-white);
}

.re-button--danger {
  background: linear-gradient(135deg, var(--el-color-danger) 0%, var(--el-color-danger-dark-2) 100%);
  border: none;
  color: var(--el-color-white);
}

/* default：页面底色 / 细边框 / 常规文字三枚令牌，暗色自动反相 */
.re-button--default {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-regular);
}

.re-button--default:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.re-button :deep(.el-icon) {
  font-size: 16px;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .re-button {
    transition: none;
  }
}
</style>
