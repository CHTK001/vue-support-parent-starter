<template>
  <!--
    参考图裁剪弹层。
    上传参考图后先在这里按目标画幅比例裁一次，再进 shrink/提交流程：
    图生图模型按固定比例出图，原始照片比例不合时整图硬塞会被拉伸或裁边，
    与其让模型猜，不如让用户在这里把构图定下来。
    比例由父组件按当前选中画幅传入；没有画幅信息时不约束（自由裁剪）。
  -->
  <el-dialog
    :model-value="open"
    title="裁剪参考图"
    width="560px"
    append-to-body
    :close-on-click-modal="false"
    @update:model-value="emit('update:open', $event)"
  >
    <div class="grc-body">
      <Cropper
        v-if="src"
        ref="cropperRef"
        :src="src"
        :stencil-props="{ aspectRatio: aspectRatio, movable: true, resizable: true }"
        class="grc-cropper"
      />
    </div>
    <template #footer>
      <el-button @click="emit('update:open', false)">取消</el-button>
      <el-button type="primary" @click="onConfirm">确认裁剪</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const props = defineProps<{
  open: boolean
  src: string
  /** 目标画幅比例（宽/高数字）；缺省时不约束比例 */
  aspectRatio?: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [payload: { dataUrl: string; width: number; height: number }]
}>()

const cropperRef = ref<InstanceType<typeof Cropper> | null>(null)

/**
 * 输出垫白底的 JPEG：裁剪结果可能带透明区（PNG 源 + 自由比例），
 * 直接 toDataURL('image/jpeg') 会把透明变黑块；图生图铺白底与 shrink 同一口径。
 */
const onConfirm = () => {
  const canvas = cropperRef.value?.getResult()?.canvas
  if (!canvas || !canvas.width || !canvas.height) {
    emit('update:open', false)
    return
  }
  const out = document.createElement('canvas')
  out.width = canvas.width
  out.height = canvas.height
  const ctx = out.getContext('2d')
  if (!ctx) {
    emit('update:open', false)
    return
  }
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, out.width, out.height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(canvas, 0, 0)
  emit('confirm', {
    dataUrl: out.toDataURL('image/jpeg', 0.9),
    width: out.width,
    height: out.height,
  })
  emit('update:open', false)
}
</script>

<style scoped>
.grc-body {
  display: flex;
  justify-content: center;
}

.grc-cropper {
  width: 100%;
  height: 420px;
  background: var(--color-secondary-surface, #f5f5f5);
}
</style>
