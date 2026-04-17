<template>
  <ScDialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="600px"
    :close-on-click-modal="false"
    @close="handleCancel"
   layout="simple">
    <div class="sc-cell-editor">
      <DateTimeEditor
        v-if="editorType === 'datetime'"
        v-model="localValue"
        :field-type="fieldType"
      />
      <JsonEditor
        v-else-if="editorType === 'json'"
        v-model="localValue"
        :field-name="fieldName"
        @validate-error="handleValidateError"
      />
      <HexEditor
        v-else-if="editorType === 'hex'"
        v-model="localValue"
      />
      <ImageEditor
        v-else-if="editorType === 'image'"
        v-model="localValue"
      />
      <UrlEditor
        v-else-if="editorType === 'url'"
        v-model="localValue"
      />
      <TextEditor
        v-else
        v-model="localValue"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ScButton @click="handleCancel">取消</ScButton>
        <ScButton type="primary" :disabled="!!validateError" @click="handleSave">保存</ScButton>
      </div>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { resolveEditorType } from './resolveEditorType.js'
import DateTimeEditor from './editors/DateTimeEditor.vue'
import JsonEditor from './editors/JsonEditor.vue'
import HexEditor from './editors/HexEditor.vue'
import ImageEditor from './editors/ImageEditor.vue'
import UrlEditor from './editors/UrlEditor.vue'
import TextEditor from './editors/TextEditor.vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null
  },
  fieldName: {
    type: String,
    default: ''
  },
  fieldType: {
    type: String,
    default: ''
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'update:visible', 'save', 'cancel'])

const localValue = ref(props.modelValue)
const originalValue = ref(props.modelValue)
const validateError = ref('')

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const editorType = computed(() => resolveEditorType(props.fieldType, props.fieldName))

const dialogTitle = computed(() => {
  const typeMap = {
    datetime: '编辑日期时间',
    json: '编辑 JSON',
    hex: '编辑二进制数据',
    image: '编辑图像',
    url: '编辑 URL',
    text: '编辑文本'
  }
  return typeMap[editorType.value] || '编辑单元格'
})

// 打开时记录原始值
watch(() => props.visible, (val) => {
  if (val) {
    localValue.value = props.modelValue
    originalValue.value = props.modelValue
    validateError.value = ''
  }
})

watch(() => props.modelValue, (val) => {
  if (props.visible) {
    localValue.value = val
  }
})

const handleValidateError = (msg) => {
  validateError.value = msg
}

const handleSave = () => {
  if (validateError.value) return
  emit('update:modelValue', localValue.value)
  emit('save', {
    fieldName: props.fieldName,
    fieldType: props.fieldType,
    value: localValue.value
  })
  emit('update:visible', false)
}

const handleCancel = () => {
  localValue.value = originalValue.value
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
.sc-cell-editor {
  min-height: 120px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
