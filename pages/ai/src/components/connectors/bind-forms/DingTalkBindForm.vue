<template>
  <el-form label-position="top">
    <el-form-item label="AppKey（Client ID）" required>
      <el-input v-model="formData.appId" placeholder="请输入钉钉开放平台应用的 AppKey" />
    </el-form-item>
    <el-form-item label="AppSecret（Client Secret）" required>
      <el-input
        v-model="formData.appSecret"
        type="password"
        placeholder="请输入钉钉开放平台应用的 AppSecret"
        show-password
      />
    </el-form-item>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="使用 Stream 模式长连接收发消息，无需配置公网回调地址"
    />
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
  appSecret: props.modelValue.appSecret || '',
})

watch(formData, (newVal) => {
  // 保留父组件已有的 model 等字段，避免覆盖绑定时选择的模型
  emit('update:modelValue', { ...props.modelValue, ...newVal })
}, { deep: true })
</script>
