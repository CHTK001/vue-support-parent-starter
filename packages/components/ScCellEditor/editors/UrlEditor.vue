<template>
  <div class="url-editor">
    <div class="url-input-row">
      <el-input
        v-model="localValue"
        placeholder="请输入 URL"
        clearable
        @input="handleInput"
      >
        <template #prepend>URL</template>
      </el-input>
      <el-button
        :disabled="!localValue"
        @click="openInNewTab"
      >
        在新标签页打开
      </el-button>
    </div>

    <div v-if="localValue" class="url-preview">
      <div class="preview-header">
        <span class="preview-label">内嵌预览</span>
        <el-button size="small" text @click="refreshPreview">刷新</el-button>
      </div>
      <iframe
        v-if="showPreview"
        :src="localValue"
        :key="previewKey"
        class="url-iframe"
        sandbox="allow-scripts allow-same-origin allow-forms"
        referrerpolicy="no-referrer"
      />
      <div v-else class="preview-placeholder">
        <el-button size="small" @click="showPreview = true">加载预览</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue != null ? String(props.modelValue) : '')
const showPreview = ref(false)
const previewKey = ref(0)

watch(() => props.modelValue, (val) => {
  localValue.value = val != null ? String(val) : ''
})

const handleInput = (val) => {
  emit('update:modelValue', val)
  // 输入变化时重置预览
  showPreview.value = false
}

const openInNewTab = () => {
  if (localValue.value) {
    window.open(localValue.value, '_blank', 'noopener,noreferrer')
  }
}

const refreshPreview = () => {
  previewKey.value++
}
</script>

<style scoped>
.url-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.url-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.url-input-row .el-input {
  flex: 1;
}
.url-preview {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color);
  font-size: 12px;
}
.preview-label {
  color: var(--el-text-color-secondary);
}
.url-iframe {
  width: 100%;
  height: 300px;
  border: none;
  display: block;
}
.preview-placeholder {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-lighter);
}
</style>
