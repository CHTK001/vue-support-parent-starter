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
          <ReNumberSelect
            :model-value="contextCount"
            :min="0"
            :max="50"
            :step="1"

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
import ReNumberSelect from '@/components/ui/ReNumberSelect.vue'
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
  // 输入法正在组合（中文/日文候选词选择）：这个 Enter 属于输入法，不是发送。
  // 不拦住就会出现「拼音还没选完，半截汉字已经发出去了」。
  // keyCode 229 是旧版 Safari / 部分 IME 在组合态下的兼容值。
  if (e.isComposing || e.keyCode === 229) return
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
/* 右侧内容区宽度：与消息流同源（MainLayout 注入 --content-max-width，
   满屏 = none，窄屏 = 820px 居中），保证对话列视觉对齐 */
.composer-card {
  max-width: var(--content-max-width, 820px);
  margin: 0 auto;
  padding: 13px 15px 11px;
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 18px → xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  /* 焦点环保留；输入区是页面内联组件，不叠加常驻装饰投影 */
  box-shadow: none;
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
  /* 原值 9px → md 档 */
  border-radius: var(--el-radius-md, 8px);
}

.composer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-icon {
  margin-right: 3px;
}
/* 原值 11px → lg 档 */
.btn-ai {
  border-radius: var(--el-radius-lg, 12px);
}
/* 原值 11px → lg 档 */
.btn-send {
  border-radius: var(--el-radius-lg, 12px);
}

/* 动效降级：系统开启「减少动态效果」时，输入卡的描边与焦点环保留的补间直接到位。
   只关 .composer-card 自己的 transition，不写 `*` / .composer-card * 通配，
   避免把内部 el-textarea / el-input-number / el-icon 组件的合法过渡一起掐掉。
   特别说明：:focus-within 那条 3px 主色光环是本组件的焦点指示本身，
   它是静态 box-shadow 声明，关掉 transition 只会让它瞬间出现、不会消失，
   无障碍效果不受影响。 */
@media (prefers-reduced-motion: reduce) {
  .composer-card {
    transition: none;
  }
}
</style>
