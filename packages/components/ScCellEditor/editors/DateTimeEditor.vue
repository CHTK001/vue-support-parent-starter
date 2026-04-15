<template>
  <div class="datetime-editor">
    <el-date-picker
      v-model="localValue"
      :type="pickerType"
      :format="displayFormat"
      :value-format="valueFormat"
      placeholder="请选择日期时间"
      style="width: 100%"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null
  },
  fieldType: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  localValue.value = val
})

watch(localValue, (val) => {
  emit('update:modelValue', val)
})

const pickerType = computed(() => {
  const t = (props.fieldType || '').toUpperCase()
  if (t.startsWith('DATE') && !t.startsWith('DATETIME')) return 'date'
  if (t.startsWith('TIME') && !t.startsWith('TIMESTAMP')) return 'time'
  return 'datetime'
})

const displayFormat = computed(() => {
  const t = pickerType.value
  if (t === 'date') return 'YYYY-MM-DD'
  if (t === 'time') return 'HH:mm:ss'
  return 'YYYY-MM-DD HH:mm:ss'
})

const valueFormat = computed(() => displayFormat.value)
</script>

<style scoped>
.datetime-editor {
  padding: 8px 0;
}
</style>
