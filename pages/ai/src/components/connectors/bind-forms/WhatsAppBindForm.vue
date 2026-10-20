<template>
  <el-form label-position="top">
    <el-form-item label="Phone Number ID" required>
      <el-input v-model="formData.phoneNumberId" placeholder="Meta 应用 → WhatsApp → API 设置中的号码 ID" />
    </el-form-item>
    <el-form-item label="Access Token" required>
      <el-input
        v-model="formData.accessToken"
        type="password"
        placeholder="Meta 应用生成的访问令牌（临时令牌 24 小时过期）"
        show-password
      />
    </el-form-item>
    <el-form-item label="App Secret" required>
      <el-input
        v-model="formData.appSecret"
        type="password"
        placeholder="用于校验入站 X-Hub-Signature-256 签名"
        show-password
      />
    </el-form-item>
    <el-form-item label="Verify Token" required>
      <el-input
        v-model="formData.verifyToken"
        type="password"
        placeholder="自定义校验令牌，需与 Meta 后台 Webhook 配置一致"
        show-password
      />
    </el-form-item>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="需在 Meta 后台把 Webhook 指向 /v2/webhook/whatsapp 并订阅 messages 字段"
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
  phoneNumberId: props.modelValue.phoneNumberId || '',
  accessToken: props.modelValue.accessToken || '',
  appSecret: props.modelValue.appSecret || '',
  verifyToken: props.modelValue.verifyToken || '',
})

watch(formData, (newVal) => {
  // 保留父组件已有的 model 等字段，避免覆盖绑定时选择的模型
  emit('update:modelValue', { ...props.modelValue, ...newVal })
}, { deep: true })
</script>
