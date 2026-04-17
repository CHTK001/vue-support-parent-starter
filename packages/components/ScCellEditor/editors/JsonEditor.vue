<template>
  <div class="json-editor">
    <el-input
      v-model="localValue"
      type="textarea"
      :rows="12"
      :class="{ 'is-error': errorMsg }"
      placeholder="请输入 JSON"
      @input="handleInput"
    />
    <div v-if="errorMsg" class="json-error">
      <el-icon><Warning /></el-icon>
      {{ errorMsg }}
    </div>

    <div class="json-actions">
      <ScButton size="small" @click="formatJson">格式化</ScButton>
      <ScButton size="small" @click="showExtractDialog = true">复制 JSON_EXTRACT 表达式</ScButton>
    </div>

    <!-- JSON_EXTRACT 表达式生成对话框 -->
    <ScDialog
      v-model="showExtractDialog"
      title="生成 JSON_EXTRACT 表达式"
      width="420px"
      append-to-body
     layout="simple">
      <el-form label-width="80px">
        <el-form-item label="字段名">
          <el-input v-model="extractColumn" :placeholder="fieldName || 'column'" />
        </el-form-item>
        <el-form-item label="JSON 路径">
          <el-input v-model="extractPath" placeholder="$.key 或 $.a.b" />
        </el-form-item>
        <el-form-item label="表达式">
          <el-input :value="extractExpr" readonly />
        </el-form-item>
      </el-form>
      <template #footer>
        <ScButton @click="showExtractDialog = false">关闭</ScButton>
        <ScButton type="primary" @click="copyExtractExpr">复制到剪贴板</ScButton>
      </template>
    </ScDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null
  },
  fieldName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'validate-error'])

const localValue = ref(
  props.modelValue != null ? formatJsonStr(String(props.modelValue)) : ''
)
const errorMsg = ref('')
const showExtractDialog = ref(false)
const extractColumn = ref(props.fieldName || '')
const extractPath = ref('$.key')

watch(() => props.modelValue, (val) => {
  localValue.value = val != null ? formatJsonStr(String(val)) : ''
})

watch(() => props.fieldName, (val) => {
  extractColumn.value = val || ''
})

function formatJsonStr(str) {
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

const extractExpr = computed(() => {
  const col = extractColumn.value || props.fieldName || 'column'
  const path = extractPath.value || '$.key'
  return `JSON_EXTRACT(${col}, '${path}')`
})

const handleInput = (val) => {
  if (!val || !val.trim()) {
    errorMsg.value = ''
    emit('validate-error', '')
    emit('update:modelValue', val)
    return
  }
  try {
    JSON.parse(val)
    errorMsg.value = ''
    emit('validate-error', '')
    emit('update:modelValue', val)
  } catch (e) {
    errorMsg.value = `JSON 格式错误：${e.message}`
    emit('validate-error', errorMsg.value)
  }
}

const formatJson = () => {
  try {
    const parsed = JSON.parse(localValue.value)
    localValue.value = JSON.stringify(parsed, null, 2)
    errorMsg.value = ''
    emit('validate-error', '')
    emit('update:modelValue', localValue.value)
  } catch (e) {
    errorMsg.value = `JSON 格式错误：${e.message}`
    emit('validate-error', errorMsg.value)
  }
}

const copyExtractExpr = async () => {
  try {
    await navigator.clipboard.writeText(extractExpr.value)
    ElMessage.success('已复制到剪贴板')
    showExtractDialog.value = false
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}
</script>

<style scoped>
.json-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.json-error {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--el-color-danger);
  font-size: 12px;
}
.json-actions {
  display: flex;
  gap: 8px;
}
:deep(.is-error .el-textarea__inner) {
  border-color: var(--el-color-danger);
}
</style>
