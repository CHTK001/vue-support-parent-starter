<script setup lang="ts">
/**
 * 模型 / 供应商图标（模型选择变体共用）。
 *
 * <p><b>为什么不能把 Avatar 直接塞进 24px 方框：</b>public/images/models 下的「SVG」
 * 并不都是正方形图标 —— `claude.svg` 是 8.83em × 1em 的文字 logo，`OpenAI.svg` /
 * `Google.svg` 用 `width="1em"`，`DeepSeek.svg` 自带白底。直接丢进固定方框时，
 * <img> 要么按 object-fit: cover 裁掉两侧，要么在无 intrinsic 尺寸时撑满父级，
 * 实测渲染成「一颗大星 / 一个大字母」（2026-10-23 截图确认）。
 *
 * <p>本组件统一口径：<b>量出图片自身宽高比 → contain 缩放并水平居中</b>。
 * 不论源文件是 1:1 图标还是长条文字 logo，视觉上都落在同一个方框内；
 * 无 logo / 加载失败时退回首字头像（沿用 koi 的 --bg-fill / --text-secondary）。
 *
 * <p>令牌口径：全部走 koi 体系（--brand-* / --bg-* / --text-* / --border-* / --el-radius-*）。
 * Phase 2 探索稿 — 仅视觉，不涉及数据逻辑。
 */
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  /** 模型名 / 供应商名：决定首字兜底 */
  name?: string
  /** logo 文件名（/images/models/ 下，含扩展名）；空串 = 无 logo */
  logo?: string
  /** 方框边长（px） */
  size?: number
  /** 圆角档：'sm' 6px / 'md' 8px / 'full' 胶囊 */
  radius?: 'sm' | 'md' | 'full'
}>(), {
  name: '',
  logo: '',
  size: 24,
  radius: 'sm',
})

/** 图片加载成功时才按 contain 渲染；失败 / 未加载走首字兜底 */
const loaded = ref(false)
const failed = ref(false)
const ratio = ref(1)

function onLoad(e: Event) {
  const el = e.target as HTMLImageElement
  const w = el.naturalWidth || 0
  const h = el.naturalHeight || 0
  // SVG 无 intrinsic 尺寸时 naturalWidth 为 0：按 1:1 处理
  ratio.value = w > 0 && h > 0 ? w / h : 1
  loaded.value = true
}
function onError() {
  failed.value = true
  loaded.value = false
}

// 换 logo 时重置，避免复用上一张图的状态
watch(() => props.logo, () => {
  loaded.value = false
  failed.value = false
  ratio.value = 1
})

const src = computed(() => (props.logo ? `/images/models/${props.logo}` : ''))
const initial = computed(() => (props.name || '?').trim().charAt(0).toUpperCase() || '?')

const boxStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderRadius: props.radius === 'full' ? '9999px' : props.radius === 'md' ? '8px' : '6px',
}))

/** 横长的文字 logo 左右留 4px，方形图标留 2px */
const imgStyle = computed(() => {
  const pad = ratio.value > 1.4 ? 4 : 2
  return {
    maxWidth: `calc(100% - ${pad * 2}px)`,
    maxHeight: `calc(100% - ${pad * 2}px)`,
  }
})
</script>

<template>
  <span class="miv" :style="boxStyle">
    <img
      v-if="src && !failed"
      :src="src"
      :alt="name ? `${name} 图标` : ''"
      class="miv__img"
      :style="imgStyle"
      decoding="async"
      @load="onLoad"
      @error="onError"
    />
    <span
      v-if="!src || failed || !loaded"
      class="miv__fallback"
      :style="{ fontSize: `${Math.max(9, Math.round(size * 0.46))}px` }"
    >{{ initial }}</span>
  </span>
</template>

<style scoped>
.miv {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-sizing: border-box;
  /* 白底图标（DeepSeek 自带白底 / 部分 png）与纯黑 logo 都需要可读的浅底：
     浅色固定白底；暗色由下方 html.dark 换成深色面。不加边框，24px 内才不显脏。 */
  background: var(--bg-container, var(--el-bg-color, #ffffff));
}

.miv__img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.miv__fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  line-height: 1;
  color: var(--text-secondary, var(--el-text-color-secondary, #5c6270));
  background: var(--bg-fill, var(--el-fill-color-light, #f1f5fb));
}

html.dark .miv {
  background: var(--bg-elevated, #222633);
}

/* 纯黑 logo（claude / OpenAI）在深底上不可见：只对图片反色，首字兜底保持原色 */
html.dark .miv__img {
  filter: invert(1) hue-rotate(180deg);
}
</style>


