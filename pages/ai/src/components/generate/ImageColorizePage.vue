<template>
  <div class="colorize-page">
    <ReCard title="图像上色" subtitle="上传灰度或线稿图片，使用默认上色模型生成彩色效果">
      <template #extra>
        <span v-if="modelReady" class="colorize-model-badge">
          上色模型：{{ modelConfig.colorizeModel || '未配置' }}
        </span>
        <span v-else class="colorize-model-badge is-off">未配置上色模型</span>
      </template>

      <!-- 未配置模型：与以图搜图同口径，优先提示去配置 -->
      <div v-if="!modelReady" class="colorize-hint">
        <el-icon :size="28"><WarningFilled /></el-icon>
        <div>
          <p class="colorize-hint-title">图像上色未启用</p>
          <p class="colorize-hint-desc">
            请到「系统设置 → 默认模型 → 图像上色配置」配置上色模型，保存后立即生效。
          </p>
          <ReButton type="primary" @click="goConfig">去配置模型</ReButton>
        </div>
      </div>

      <div v-else-if="!imageLoaded" class="colorize-empty">
        <div class="colorize-upload-zone" @click="pickFile" @dragover.prevent @drop.prevent="onDrop">
          <div class="colorize-upload-icon">
            <el-icon :size="42"><ImageOutlined /></el-icon>
          </div>
          <p class="colorize-upload-title">点击或拖拽上传图片</p>
          <p class="colorize-upload-desc">支持 JPG / PNG / WebP，建议上传灰度图或线稿效果更佳</p>
        </div>
        <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />
      </div>

      <div v-else class="colorize-workspace">
        <div class="colorize-main">
          <div class="colorize-stage">
            <div class="colorize-stage-head">
              <span class="colorize-stage-title">{{ generating ? '正在上色中…' : (resultUrl ? '上色效果' : '原图预览') }}</span>
              <ReButton size="small" type="default" plain :disabled="generating" @click="pickFile">更换图片</ReButton>
            </div>
            <div class="colorize-canvas-box">
              <img v-if="resultUrl" :src="resultUrl" class="colorize-canvas" alt="上色结果" />
              <img v-else :src="originalUrl" class="colorize-canvas" alt="原图" />
              <div v-if="generating" class="colorize-loading">
                <el-icon class="is-loading" :size="22"><Loading /></el-icon>
                <span>模型生成中...</span>
              </div>
            </div>
          </div>

          <div class="colorize-panel">
            <h3 class="colorize-panel-title">当前模型</h3>
            <p class="colorize-panel-model">{{ modelConfig.colorizeModel || '未配置' }}</p>
            <ReEmpty v-if="resultError" :text="`上色失败：${resultError}`" />
            <ReEmpty v-else-if="!resultUrl && !generating" text="上传图片后会自动调用后端上色模型生成彩色效果" />
            <div class="colorize-actions">
              <ReButton type="success" :disabled="!resultUrl || generating" @click="download">下载上色图</ReButton>
              <ReButton type="primary" plain :disabled="generating || !imageLoaded" @click="colorizeImage">重新上色</ReButton>
              <ReButton type="default" plain :disabled="generating || !resultUrl" @click="resetImage">恢复原图</ReButton>
            </div>
          </div>
        </div>
      </div>
    </ReCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ImageOutlined } from '@vicons/material'
import { Loading, WarningFilled } from '@element-plus/icons-vue'
import ReCard from '@/components/re/ReCard.vue'
import ReButton from '@/components/re/ReButton.vue'
import ReEmpty from '@/components/re/ReEmpty.vue'
import { apiService } from '@/services/ApiService'
import { useModelConfigStore } from '@/stores/modelConfig'
import { message } from '@repo/core'

/**
 * 图像上色：调用后端默认上色模型，不再走本地 Canvas 演示。
 *
 * <p>模型来自 {@code image} 分组的 {@code colorize_model}（默认模型页 → 图像上色配置）；
 * 未配置时沿用「以图搜图」的门禁提示，上传入口不渲染。</p>
 */
const router = useRouter()
const modelConfig = useModelConfigStore()
const modelReady = computed(() => modelConfig.colorizeReady)

const fileInput = ref<HTMLInputElement | null>(null)
const imageLoaded = ref(false)
const generating = ref(false)
const resultError = ref('')
let sourceFile: File | null = null
let originalObjectUrl = ''
let resultObjectUrl = ''

const originalUrl = ref('')
const resultUrl = ref('')

onMounted(async () => {
  // 强制拉一次合并视图：上色模型可能在别处（设置中心）刚改过，
  // 用缓存的 store 会拿旧值把页面误判成「未配置」。
  try {
    await modelConfig.refresh()
  } catch {
    // 读取失败按未配置处理：页面会给出「去配置模型」的提示，不阻断渲染
  }
})

onBeforeUnmount(() => {
  revokeUrls()
})

function revokeUrls() {
  if (originalObjectUrl) URL.revokeObjectURL(originalObjectUrl)
  if (resultObjectUrl) URL.revokeObjectURL(resultObjectUrl)
  originalObjectUrl = ''
  resultObjectUrl = ''
}

function goConfig() {
  router.push('/setting/colorize-config')
}

function loadImageFromFile(file: File) {
  if (!file.type.startsWith('image/')) {
    message.warning('请选择图片文件')
    return
  }
  revokeUrls()
  sourceFile = file
  originalObjectUrl = URL.createObjectURL(file)
  originalUrl.value = originalObjectUrl
  resultUrl.value = ''
  resultError.value = ''
  imageLoaded.value = true
  void colorizeImage()
}

async function colorizeImage() {
  if (!sourceFile || !modelReady.value || generating.value) return
  generating.value = true
  resultError.value = ''
  try {
    const blob = await apiService.colorizeImage(sourceFile, sourceFile.name || 'colorize.png')
    if (!blob) {
      resultError.value = modelReady.value
        ? '上色失败，请检查模型是否可用后重试'
        : '图像上色模型未配置，请先到「系统设置 → 默认模型 → 图像上色配置」配置模型'
      return
    }
    revokeResultUrl()
    resultObjectUrl = URL.createObjectURL(blob)
    resultUrl.value = resultObjectUrl
  } finally {
    generating.value = false
  }
}

function revokeResultUrl() {
  if (resultObjectUrl) URL.revokeObjectURL(resultObjectUrl)
  resultObjectUrl = ''
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) loadImageFromFile(file)
}

function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file) loadImageFromFile(file)
}

function pickFile() {
  fileInput.value?.click()
}

function download() {
  if (!resultUrl.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = `colorized-${Date.now()}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  message.success('已开始下载上色图片')
}

/**
 * 恢复原图预览：只清掉上色结果，不再自动重跑上色。
 *
 * <p>原先这里调用了 {@code colorizeImage()}，点「恢复原图」会立刻重新生成、
 * 结果图马上又盖回原图，按钮等于没效果；需要重跑时用独立的「重新上色」。</p>
 */
function resetImage() {
  revokeResultUrl()
  resultUrl.value = ''
  resultError.value = ''
}
</script>

<style scoped>
.colorize-page {
  padding: 20px;
  max-width: 1100px;
  margin: 0 auto;
}
.colorize-model-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 10%, transparent);
}
.colorize-model-badge.is-off {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
}
.colorize-hint {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 36px 24px;
  border: 1px solid var(--el-color-warning-light-7);
  border-radius: var(--el-radius-lg, 12px);
  background: color-mix(in srgb, var(--el-color-warning) 6%, var(--el-bg-color));
  color: var(--el-color-warning);
}
.colorize-hint-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.colorize-hint-desc {
  margin: 6px 0 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.colorize-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 42px 20px;
}
.colorize-upload-zone {
  width: 100%;
  max-width: 520px;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-light);
  padding: 48px 28px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.colorize-upload-zone:hover {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-fill-color-light));
}
.colorize-upload-icon { color: var(--el-color-primary); }
.colorize-upload-title { font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); margin-top: 12px; }
.colorize-upload-desc { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 8px; }
.colorize-workspace { display: flex; flex-direction: column; gap: 16px; }
.colorize-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
}
@media (max-width: 760px) {
  .colorize-main { grid-template-columns: 1fr; }
}
.colorize-stage-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.colorize-stage-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.colorize-canvas-box {
  position: relative;
  max-height: 600px;
  overflow: auto;
  background: repeating-conic-gradient(#f3f5f7 0% 25%, #fff 0% 50%) 50% / 20px 20px;
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
}
.colorize-canvas { display: block; width: 100%; height: auto; }
.colorize-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-bg-color) 72%, transparent);
}
.colorize-panel { display: flex; flex-direction: column; gap: 14px; }
.colorize-panel-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.colorize-panel-model {
  margin: 0;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  font-size: 12px;
  color: var(--el-text-color-regular);
}
.colorize-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
</style>