<!--
  模板预览（只读）

  仅加载模板设计描述并以 hiprint 的 print 模式渲染，不含设计器外壳与操作控件。
-->
<template>
  <div class="preview">
    <div class="preview__empty" v-if="template === null">加载中</div>
    <div class="preview__body" ref="bodyRef"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * 只读预览：从后端取模板 JSON 描述，交给 hiprint 直接打印。
 * 使用前先确保 window.jQuery + hiprint.init 已在 @packages/app 的 index.html 中注入。
 */
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { templateApi } from '../api/templateApi'
import type { TemplateDesignerPayload, TemplateInfo } from '../types/template'

const route = useRoute()
const router = useRouter()

const template = ref<TemplateDesignerPayload | null>(null)
const bodyRef = ref<HTMLDivElement | null>(null)
const loading = ref(true)

/** 加载模板 */
onMounted(async () => {
  const id = route.params.id as string
  if (!id) {
    ElMessage.error('未指定模板')
    router.replace('/template')
    return
  }
  loading.value = true
  try {
    const payload = await templateApi.designer(id)
    template.value = payload
  } catch (err) {
    ElMessage.error(String(err))
    router.replace('/template')
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.preview__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--el-text-color-secondary);
}

.preview__body {
  flex: 1;
  overflow: auto;
}
</style>
