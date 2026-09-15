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
.re-modal :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.re-modal :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  margin: 0;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

.re-modal :deep(.el-dialog__title) {
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: 0.01em;
}

.re-modal :deep(.el-dialog__headerbtn) {
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.re-modal :deep(.el-dialog__headerbtn:hover) {
  background: #f1f5f9;
}

.re-modal :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.re-modal-body {
  color: #475569;
  line-height: 1.6;
}

.re-modal :deep(.el-dialog__footer) {
  padding: 16px 24px 20px;
  border-top: 1px solid #f1f5f9;
  background: #fafbfc;
}

.re-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
