<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElImage } from 'element-plus'
import { MONO_DARK_ICONS, PROVIDER_ICONS } from './providerIcons'

const props = withDefaults(defineProps<{
  pid?: string
  name?: string
  /** 预设档位 32/40/48；传数字则按像素直出（模型选择器的 18px 头像位用） */
  size?: 'sm' | 'md' | 'lg' | number
}>(), {
  size: 'sm',
})

const sizeMap: Record<string, string> = { sm: '32px', md: '40px', lg: '48px' }
const currentSrc = ref<string | null>(null)

/** 尺寸样式：预设档位走 sizeMap，数字档位直接按像素 */
const sizeStyle = computed(() => {
  const px = typeof props.size === 'number' ? `${props.size}px` : sizeMap[props.size || 'sm']
  return { width: px, height: px }
})

/**
 * 首字兜底头像的内联样式。
 *
 * <p>字号随盒子尺寸收敛（约 45%）：这个组件还被用在 18px 的模型选择器头像位，
 * 固定字号的首字会在小盒子里溢出。</p>
 */
const fallbackStyle = computed(() => {
  const box = typeof props.size === 'number'
    ? props.size
    : parseInt(sizeMap[props.size || 'sm'], 10) || 32
  return {
    ...sizeStyle.value,
    '--avatar-hue': 'var(--color-primary)',
    fontSize: `${Math.max(9, Math.round(box * 0.45))}px`,
  }
})

/**
 * 静态资源 URL：拼上应用 base。
 *
 * <p>内嵌宿主时 base 不是 '/'（系统平台挂在 /system/ 下，public 资源经
 * {@code /system/images/**} 服务），绝对路径 {@code /images/providers/*}
 * 必然 404 —— 2026-10-14 实测 ElImage 默认错误槽渲染「加载失败」。
 * {@code import.meta.env.BASE_URL} 由各应用 vite 注入：独立运行 '/'、
 * 内嵌 '/system/'，两种形态下都拼出正确路径。</p>
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
watch(() => props.pid, (pid) => {
  const id = String(pid || '').toLowerCase()
  const mappedFile = PROVIDER_ICONS[id]
  // 没有品牌映射的虚拟 / 自定义供应商显示首字；有映射时使用图板中的精确文件名，
  // 兼容别名复用图标（例如 opencode-go → opencode.svg），不再盲猜扩展名。
  // 以 `/` 开头的是应用根相对路径（如系统 logo），直接拼 base，不加 providers 前缀。
  currentSrc.value = id && id !== 'custom' && id !== 'agent' && mappedFile
    ? assetUrl(mappedFile.startsWith('/') ? mappedFile : `images/providers/${mappedFile}`)
    : null
}, { immediate: true })

const onError = () => {
  // 图板映射资源缺失时降级为首字头像，不再额外请求一个猜测扩展名的 URL。
  currentSrc.value = null
}

/**
 * 该品牌是否为「纯单色深色图标」。
 *
 * <p>这类图在深色主题下与背景同色（黑压黑），需要一个反色补偿；
 * 品牌色图标不反色，避免把品牌色一起翻掉。见 {@link MONO_DARK_ICONS}。</p>
 */
const monoDark = computed(() => MONO_DARK_ICONS.has(String(props.pid || '').toLowerCase()))
</script>

<template>
  <el-image
    v-if="currentSrc"
    :src="currentSrc"
    fit="contain"
    :class="{ 'pl-mono': monoDark }"
    :style="{ ...sizeStyle, 'border-radius': 'var(--size-surface-radius)' }"
    @error="onError"
  />
  <div
    v-else
    class="avatar-auto flex items-center justify-center flex-shrink-0 font-bold"
    :style="fallbackStyle"
  >
    {{ (props.name || '?').trim().charAt(0) || '?' }}
  </div>
</template>

<style scoped>
/*
 * 图片必须撑满外层方框，否则「同一行图标大小不一」。
 *
 * <p>el-image 的内层 &lt;img&gt; 靠 element-plus 的 image 组件样式拿
 * {@code width:100%;height:100%}。本应用按需引入 EP（main.js 只显式引了
 * message / dialog 等组件的 style）并未引入 image 的样式，内层图就退回
 * 素材原始像素：16px 的 google / openrouter / xai 只有 16px，34px 的
 * qwen 是 34px，48x48 的 openai 被外层 40px 裁到 40px —— 模板库同一网格里
 * 就会出现「有的图标大、有的小一半」。这里在组件内固化尺寸，不依赖宿主
 * 是否加载了 EP 的 image 样式；fit=contain 的 object-fit 由 el-image 内联
 * 提供，两处一致的写法在已加载 EP 样式时也不会产生差异。</p>
 */
:deep(.el-image__inner),
:deep(img) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/*
 * 纯单色深色图标的深色主题补偿。
 *
 * 这类品牌图是黑/深灰描边 + 透明底（如 OpenAI 结、Ollama 羊驼、xAI 的 X），
 * 直接放在深色卡片上等于「黑压黑」，看起来像图标丢了或图错了。
 * 反色只发生在深色主题，且只作用于 MONO_DARK_ICONS 里的品牌；
 * 带品牌色的图标与浅色主题都不动。
 */
:global(html.dark) .pl-mono {
  filter: invert(1) hue-rotate(180deg);
}
</style>