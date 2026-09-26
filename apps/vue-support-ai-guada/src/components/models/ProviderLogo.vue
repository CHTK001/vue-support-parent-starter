<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElImage } from 'element-plus'

const props = withDefaults(defineProps<{
  pid?: string
  name?: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'sm',
})

const sizeMap: Record<string, string> = { sm: '32px', md: '40px', lg: '48px' }
const currentSrc = ref<string | null>(null)
const triedSvg = ref(false)

watch(() => props.pid, (pid) => {
  const id = String(pid || '').toLowerCase()
  if (!id || id === 'custom') { currentSrc.value = null; triedSvg.value = false; return }
  currentSrc.value = `/images/providers/${id}.png`
  triedSvg.value = false
}, { immediate: true })

const onError = () => {
  if (triedSvg.value) return // png 和 svg 都失败了，不再重试
  const id = String(props.pid || '').toLowerCase()
  if (!id || id === 'custom') return
  currentSrc.value = `/images/providers/${id}.svg`
  triedSvg.value = true
}
</script>

<template>
  <el-image
    v-if="currentSrc"
    :src="currentSrc"
    :style="{ width: sizeMap[props.size], height: sizeMap[props.size], 'border-radius': 'var(--size-surface-radius)' }"
    @error="onError"
  />
  <div
    v-else
    class="avatar-auto flex items-center justify-center flex-shrink-0 font-bold"
    :style="{ width: sizeMap[props.size], height: sizeMap[props.size], '--avatar-hue': 'var(--color-primary)' }"
  >
    {{ (props.name || '?').trim().charAt(0) || '?' }}
  </div>
</template>