<template>
  <el-form label-position="top">
    <el-form-item label="Corp ID" required>
      <el-input v-model="formData.corpId" placeholder="请输入企业微信 Corp ID" />
    </el-form-item>
    <el-form-item label="Agent ID" required>
      <el-input v-model="formData.agentId" placeholder="请输入应用 Agent ID" />
    </el-form-item>
    <el-form-item label="Secret" required>
      <el-input v-model="formData.secret" type="password" placeholder="请输入应用 Secret" show-password />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

const props = defineProps<{
  modelValue: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
}>()

const formData = reactive({
  corpId: props.modelValue.corpId || '',
  agentId: props.modelValue.agentId || '',
  secret: props.modelValue.secret || ''
})

watch(formData, (newVal) => {
  emit('update:modelValue', { ...newVal })
}, { deep: true })
</script>
