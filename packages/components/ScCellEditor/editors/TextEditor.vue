<template>
  <div class="text-editor">
    <el-input
      v-model="localValue"
      type="textarea"
      :rows="8"
      placeholder="请输入内容"
      @input="handleInput"
    />
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

watch(() => props.modelValue, (val) => {
  localValue.value = val != null ? String(val) : ''
})

const handleInput = (val) => {
  emit('update:modelValue', val)
}
</script>

<style scoped>
.text-editor {
  padding: 4px 0;
}
</style>
