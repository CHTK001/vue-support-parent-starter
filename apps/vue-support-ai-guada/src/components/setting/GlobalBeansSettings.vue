<template>
  <div class="global-beans-settings">
    <el-alert
      title="全局Bean配置用于系统内部使用，包括ChatClient会话、各管线模型等"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    />
    <el-form :model="form" label-width="160px" class="settings-form">
      <el-form-item label="ChatClient会话">
        <el-input v-model="form.chatClient" placeholder="ChatClient Bean名称" clearable />
      </el-form-item>
      <el-form-item label="文生图模型">
        <el-input v-model="form.textToImage" placeholder="文生图模型Bean" clearable />
      </el-form-item>
      <el-form-item label="文生视频模型">
        <el-input v-model="form.textToVideo" placeholder="文生视频模型Bean" clearable />
      </el-form-item>
      <el-form-item label="OCR模型">
        <el-input v-model="form.ocr" placeholder="OCR模型Bean" clearable />
      </el-form-item>
      <el-form-item label="布局分析模型">
        <el-input v-model="form.layout" placeholder="布局分析模型Bean" clearable />
      </el-form-item>
      <el-form-item label="人脸识别模型">
        <el-input v-model="form.face" placeholder="人脸识别模型Bean" clearable />
      </el-form-item>
      <el-form-item label="图片识别模型">
        <el-input v-model="form.imageRecognition" placeholder="图片识别模型Bean" clearable />
      </el-form-item>
    </el-form>
    <div class="form-actions">
      <el-button type="primary" @click="save" :loading="saving">保存全局Bean</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { settingsApi } from '@/services/javaApi'

const form = ref({
  chatClient: '',
  textToImage: '',
  textToVideo: '',
  ocr: '',
  layout: '',
  face: '',
  imageRecognition: '',
})

const saving = ref(false)

const load = async () => {
  try {
    const res = await settingsApi.globalBeans('default')
    const data = res?.data || res
    if (data) {
      form.value = { ...form.value, ...data }
    }
  } catch (e) {
    console.error('加载全局Bean失败:', e)
  }
}

const save = async () => {
  saving.value = true
  try {
    await settingsApi.updateGlobalBeans('default', form.value)
    ElMessage.success('全局Bean保存成功')
  } catch (e) {
    console.error('保存全局Bean失败:', e)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.global-beans-settings {
  max-width: 700px;
}

.settings-form {
  background: var(--el-bg-color);
  padding: 24px;
  /* 原值 12px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
}

.form-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
