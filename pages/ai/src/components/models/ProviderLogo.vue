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

/**
 * 静态资源 URL：拼上应用 base。
 *
 * <p>内嵌宿主时 base 可能不是 '/'（public 资源经 {@code /<base>/images/**} 服务），
 * 绝对路径 {@code /images/providers/*} 必然 404。{@code import.meta.env.BASE_URL}
 * 由各应用 vite 注入：独立运行 '/'，内嵌时随之变化。</p>
 */
function assetUrl(rel: string): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')
  return `${base}/${rel.replace(/^\/+/, '')}`
}

/**
 * 只有 .svg、没有 .png 的品牌 id（对应 public/images/providers 下的实际文件）。
 *
 * 实测：这类 id 先试 .png 必然 404（如 openai/anthropic/deepseek/google/onnx 共 22 个），
 * 等于每次渲染供应商卡都往控制台丢一个 404。逐按钮 sweep 会把它记成该路由的
 * 4xx 证据，干扰「生产级无未知 4xx」的判据。这里直连 .svg 消掉这条假 404；
 * 清单缺项时仍走下面的 png→svg 兜底，最坏只是退回原来的探测行为。
 */
const SVG_ONLY_IDS = new Set([
  '360', 'agnes', 'ai302', 'aliyun-bailian', 'anthropic', 'deepseek', 'google', 'groq',
  'huiqing', 'longcat', 'minimax', 'minimax-color', 'mock', 'nvidia', 'onnx', 'openai',
  'openai-response', 'openrouter', 'siliconflow', 'stepfun', 'volcengine', 'xai',
])

watch(() => props.pid, (pid) => {
  const id = String(pid || '').toLowerCase()
  // agent = 内置 Agent 虚拟供应商（后端合成，无 logo 文件）：png/svg 双探必 404
  // （2026-10-08 import-all gate 实测 agent.png/agent.svg 双 404），与 custom 同款走首字头像
  if (!id || id === 'custom' || id === 'agent') { currentSrc.value = null; triedSvg.value = false; return }
  if (SVG_ONLY_IDS.has(id)) {
    currentSrc.value = assetUrl(`images/providers/${id}.svg`)
    triedSvg.value = true // 已是 svg，onError 不再重试
    return
  }
  currentSrc.value = assetUrl(`images/providers/${id}.png`)
  triedSvg.value = false
}, { immediate: true })

const onError = () => {
  if (triedSvg.value) return // png 和 svg 都失败了，不再重试
  const id = String(props.pid || '').toLowerCase()
  if (!id || id === 'custom') return
  currentSrc.value = assetUrl(`images/providers/${id}.svg`)
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