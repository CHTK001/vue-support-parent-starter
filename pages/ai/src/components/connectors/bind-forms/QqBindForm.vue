<template>
  <el-form label-position="top">
    <el-form-item label="App ID" required>
      <el-input v-model="formData.appId" placeholder="请输入 QQ 机器人 App ID" />
    </el-form-item>
    <el-form-item label="App Secret" required>
      <el-input v-model="formData.appSecret" type="password" placeholder="请输入 QQ 机器人 App Secret" show-password />
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
  (e: 'bind', data: Record<string, any>): void
}>()

const formData = reactive({
  appId: props.modelValue.appId || '',
  appSecret: props.modelValue.appSecret || ''
})

watch(formData, (newVal) => {
  // 保留父组件已有的 model 等字段，避免覆盖绑定时选择的模型
  emit('update:modelValue', { ...props.modelValue, ...newVal })
}, { deep: true })
</script>
