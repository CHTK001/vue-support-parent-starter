<template>
  <div class="image-editor">
    <div class="image-preview">
      <el-image
        v-if="localValue"
        :src="imageSrc"
        fit="contain"
        style="width: 100%; max-height: 240px"
        :preview-src-list="[imageSrc]"
      >
        <template #error>
          <div class="image-error">
            <el-icon><Picture /></el-icon>
            <span>图像加载失败</span>
          </div>
        </template>
      </el-image>
      <div v-else class="image-placeholder">
        <el-icon><Picture /></el-icon>
        <span>暂无图像</span>
      </div>
    </div>

    <el-upload
      :show-file-list="false"
      :before-upload="beforeUpload"
      accept="image/*"
      class="image-upload"
    >
      <ScButton size="small" type="primary">上传新图像</ScButton>
      <template #tip>
        <div class="upload-tip">支持 JPG、PNG、GIF、WebP 格式</div>
      </template>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  localValue.value = val
})

// 判断是否已经是 base64 或 URL
const imageSrc = computed(() => {
  const val = localValue.value
  if (!val) return ''
  const str = String(val)
  if (str.startsWith('data:') || str.startsWith('http')) return str
  // 尝试作为 base64 图像处理
  return `data:image/png;base64,${str}`
})

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图像文件')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('图像大小不能超过 10MB')
    return false
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const base64 = e.target.result
    localValue.value = base64
    emit('update:modelValue', base64)
  }
  reader.onerror = () => {
    ElMessage.error('图像读取失败，保留原有图像')
  }
  reader.readAsDataURL(file)

  // 阻止默认上传行为（我们自己处理）
  return false
}
</script>

<style scoped>
.image-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.image-preview {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-lighter);
}
.image-placeholder,
.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  padding: 24px;
}
.image-placeholder .el-icon,
.image-error .el-icon {
  font-size: 40px;
}
.upload-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>
