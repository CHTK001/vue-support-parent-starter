<template>
  <!-- 已知品牌：使用真实软件图标（与 bot 卡片同源资源 public/images/bots） -->
  <img
    v-if="logoSrc && !failed"
    :src="logoSrc"
    :alt="altText"
    class="connector-brand-logo"
    :style="boxStyle"
    draggable="false"
    @error="failed = true"
  />
  <!-- 未知类型 / 图标加载失败：退回手绘插头 -->
  <svg
    v-else
    class="connector-plug-icon"
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M9 2v6" />
    <path d="M15 2v6" />
    <path d="M6 8h12v3a6 6 0 0 1-12 0z" />
    <path d="M12 17v5" />
  </svg>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { fixFrontendAssetUrl } from '@/utils/url'

const props = withDefaults(defineProps<{ type?: string; size?: number }>(), { size: 26 })

/** 品牌图标 → 真实软件 logo；lark 是飞书海外名，两种键都收 */
const LOGOS: Record<string, string> = {
  ilink: '/images/bots/wechat.png',
  wechat: '/images/bots/wechat.png',
  'wechat-personal': '/images/bots/wechat.png',
  feishu: '/images/bots/lark.png',
  lark: '/images/bots/lark.png',
  wecom: '/images/bots/wecom-bot.png',
  qq: '/images/bots/qq.png',
  dingtalk: '/images/bots/dingtalk.svg',
  discord: '/images/bots/discord.svg',
}

const boxStyle = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }))

const logoSrc = computed(() => {
  const path = LOGOS[props.type || '']
  return path ? fixFrontendAssetUrl(path) : ''
})

const altText = computed(() => `${props.type || '未知'} 图标`)

const failed = ref(false)
watch(logoSrc, () => {
  failed.value = false
})
</script>

<style scoped>
.connector-brand-logo {
  object-fit: contain;
  /* 品牌图标多为彩色实心图，禁用浏览器默认拖拽与图片拦截样式 */
  pointer-events: none;
}

.connector-plug-icon {
  /* 底色为浅色调，不能沿用容器的 text-white */
  color: #9ca3af;
}
</style>
