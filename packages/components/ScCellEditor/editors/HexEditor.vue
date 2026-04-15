<template>
  <div class="hex-editor">
    <div class="hex-hint">以十六进制格式展示（每字节两位，空格分隔）</div>
    <el-input
      v-model="hexValue"
      type="textarea"
      :rows="8"
      :class="{ 'is-error': errorMsg }"
      placeholder="例：48 65 6C 6C 6F"
      @input="handleInput"
    />
    <div v-if="errorMsg" class="hex-error">
      <el-icon><Warning /></el-icon>
      {{ errorMsg }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Warning } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const errorMsg = ref('')

// 将原始值转为十六进制字符串
function toHex(val) {
  if (val == null || val === '') return ''
  const str = String(val)
  return Array.from(str)
    .map(c => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase())
    .join(' ')
}

// 将十六进制字符串转回原始字符串
function fromHex(hex) {
  const cleaned = hex.replace(/\s+/g, '')
  if (cleaned.length % 2 !== 0) throw new Error('十六进制字符串长度必须为偶数')
  if (!/^[0-9A-Fa-f]*$/.test(cleaned)) throw new Error('包含非法十六进制字符')
  let result = ''
  for (let i = 0; i < cleaned.length; i += 2) {
    result += String.fromCharCode(parseInt(cleaned.slice(i, i + 2), 16))
  }
  return result
}

const hexValue = ref(toHex(props.modelValue))

watch(() => props.modelValue, (val) => {
  hexValue.value = toHex(val)
})

const handleInput = (val) => {
  try {
    const original = fromHex(val)
    errorMsg.value = ''
    emit('update:modelValue', original)
  } catch (e) {
    errorMsg.value = e.message
  }
}
</script>

<style scoped>
.hex-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hex-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.hex-error {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--el-color-danger);
  font-size: 12px;
}
:deep(.is-error .el-textarea__inner) {
  border-color: var(--el-color-danger);
}
</style>
