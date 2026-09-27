<template>
  <div class="composer-wrap">
    <div class="composer-card">
      <el-input
        :model-value="modelValue"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 6 }"
        :disabled="disabled"
        resize="none"
        :placeholder="disabled ? '请先选择左侧会话' : '输入消息，Enter 发送，Shift+Enter 换行'"
        class="composer-input"
        @update:model-value="v => $emit('update:modelValue', v)"
        @keydown="handleKeydown"
      />

      <div class="composer-toolbar">
        <div class="composer-context">
          <el-icon :size="15" class="context-icon"><History24Regular /></el-icon>
          <span class="context-label">上下文条数</span>
          <el-input-number
            :model-value="contextCount"
            :min="0"
            :max="50"
            :step="1"
            size="small"
            controls-position="right"
            class="context-number"
            @update:model-value="v => $emit('update:contextCount', v ?? 0)"
          />
        </div>

        <div class="composer-actions">
          <el-button
            :disabled="disabled || empty || sending || aiSending"
            :loading="aiSending"
            class="btn-ai"
            @click="$emit('ai-send')"
          >
            <el-icon :size="15" class="btn-icon"><Sparkle24Regular /></el-icon>
            AI 发送
          </el-button>
          <el-button
            type="primary"
            :disabled="disabled || empty || sending || aiSending"
            :loading="sending"
            class="btn-send"
            @click="$emit('send')"
          >
            <el-icon :size="15" class="btn-icon"><Send24Regular /></el-icon>
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Send24Regular, Sparkle24Regular, History24Regular,
} from '@vicons/fluent'

defineOptions({ name: 'ConnectorMessageComposer' })

const props = defineProps<{
  modelValue: string
  contextCount: number
  sending: boolean
  aiSending: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'update:contextCount', v: number): void
  (e: 'send'): void
  (e: 'ai-send'): void
}>()

const empty = computed(() => !props.modelValue || !props.modelValue.trim())

function handleKeydown(e: Event | KeyboardEvent) {
  if (!('key' in e)) return
  if (e.key !== 'Enter') return
  if (e.shiftKey) return // 换行
  e.preventDefault()
  if (props.disabled || empty.value || props.sending || props.aiSending) return
  emit('send')
}
</script>

<style scoped>
.composer-wrap {
  flex-shrink: 0;
  padding: 10px 24px 20px;
  background: var(--color-bg);
}
.composer-card {
  max-width: 820px;
  margin: 0 auto;
  padding: 13px 15px 11px;
  border: 1px solid var(--color-surface-border);
  border-radius: 18px;
  background: var(--color-surface);
  box-shadow: var(--el-box-shadow-lighter);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.composer-card:focus-within {
  border-color: var(--el-color-primary-light-6);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
}

.composer-input :deep(.el-textarea__inner) {
  border: none;
  box-shadow: none !important;
  background: transparent;
  font-size: 14px;
  line-height: 1.6;
  padding: 2px 2px;
  resize: none;
}

.composer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
}
.composer-context {
  display: flex;
  align-items: center;
  gap: 6px;
}
.context-icon {
  color: var(--color-text-gray);
}
.context-label {
  font-size: 12px;
  color: var(--color-text-gray);
}
.context-number {
  width: 108px;
}
.context-number :deep(.el-input__wrapper) {
  border-radius: 9px;
}

.composer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-icon {
  margin-right: 3px;
}
.btn-ai {
  border-radius: 11px;
}
.btn-send {
  border-radius: 11px;
}
</style>
