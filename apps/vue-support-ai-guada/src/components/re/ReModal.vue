<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    :destroy-on-close="destroyOnClose"
    class="re-modal"
    @close="$emit('close')"
    @open="$emit('open')"
  >
    <div class="re-modal-body">
      <slot />
    </div>
    <template #footer>
      <div class="re-modal-footer">
        <slot name="footer">
          <ReButton type="default" @click="handleCancel">{{ cancelText }}</ReButton>
          <ReButton type="primary" :loading="loading" @click="handleConfirm">{{ confirmText }}</ReButton>
        </slot>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ReButton from './ReButton.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: [String, Number], default: '520px' },
  cancelText: { type: String, default: '取消' },
  confirmText: { type: String, default: '确定' },
  loading: { type: Boolean, default: false },
  destroyOnClose: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'close', 'open', 'cancel', 'confirm'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const handleCancel = () => {
  emit('cancel')
  visible.value = false
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<style scoped>
/* 弹窗是浮层不是卡片，投影保留，但改用 Element Plus 的浮层阴影令牌（暗色自动切换） */
.re-modal :deep(.el-dialog) {
  border-radius: var(--el-radius-xl, 16px);
  overflow: hidden;
  box-shadow: var(--el-box-shadow);
}

.re-modal :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  margin: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  /* 原 #f8fafc → #ffffff 是浅色硬编码，暗色下会变成一条白带；改用「浅填充 → 页面底色」两枚令牌 */
  background: linear-gradient(135deg, var(--el-fill-color-light) 0%, var(--el-bg-color) 100%);
}

.re-modal :deep(.el-dialog__title) {
  font-size: 17px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0.01em;
}

.re-modal :deep(.el-dialog__headerbtn) {
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  border-radius: var(--el-radius-md, 8px);
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}

.re-modal :deep(.el-dialog__headerbtn:hover) {
  background: var(--el-fill-color-light);
}

/* Element Plus 给关闭按钮写了 outline: none 且没有替代指标（只有图标变色），
   键盘用户看不到焦点落点，这里补回统一焦点环；图标变色保留，两种信号叠加 */
.re-modal :deep(.el-dialog__headerbtn:focus-visible) {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.re-modal :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.re-modal-body {
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.re-modal :deep(.el-dialog__footer) {
  padding: 16px 24px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.re-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .re-modal :deep(.el-dialog__headerbtn) {
    transition: none;
  }
}
</style>
