<template>
  <!-- 图片 URL -->
  <img v-if="isUrl" :src="icon ?? ''" :alt="name" class="plugin-icon object-contain flex-shrink-0"
    :class="sizeClass" :style="radiusStyle" @error="onError" />
  <!-- 已知 fluent 组件名 -->
  <el-icon v-else-if="fluentComp" :class="['plugin-icon flex-shrink-0', sizeClass]" :style="radiusStyle">
    <component :is="fluentComp" />
  </el-icon>
  <!-- 兜底：首字母头像 -->
  <CardAvatar v-else :name="name" :size="avatarSize" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElIcon } from 'element-plus'
import CardAvatar from './CardAvatar.vue'
import {
  BookSearch20Regular,
  Folder20Regular,
  Globe20Regular,
  Lightbulb20Regular,
  NumberSymbol20Regular,
  Clock20Regular,
  Star20Regular,
  Search20Regular,
  BrainCircuit20Regular,
  Document20Regular,
  Toolbox20Regular,
  Cloud20Regular,
  PlugConnected20Regular,
  DocumentTable20Regular,
  DocumentPdf20Regular,
  DocumentBulletList20Regular,
  DocumentHeader20Regular,
  SlideLayout20Regular,
  Code20Regular,
  Bug20Regular,
  Database20Regular,
  Mail20Regular,
  Branch20Regular,
  Box20Regular,
  ChartMultiple20Regular,
  Diagram20Regular,
  Beaker20Regular,
  Notepad20Regular,
  MathSymbols20Regular,
  LocalLanguage20Regular,
  Braces20Regular,
  WindowConsole20Regular,
  Rocket20Regular,
  ScanType20Regular,
  ReadingList20Regular,
} from '@vicons/fluent'

const props = withDefaults(defineProps<{
  icon?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'sm',
})

// 后端内置卡片使用 fluent 导出短名；这里集中解析，保证离线可用
const FLUENT_MAP: Record<string, unknown> = {
  BookSearch20Regular,
  Folder20Regular,
  Globe20Regular,
  Lightbulb20Regular,
  NumberSymbol20Regular,
  Clock20Regular,
  Star20Regular,
  Search20Regular,
  BrainCircuit20Regular,
  Document20Regular,
  Toolbox20Regular,
  Cloud20Regular,
  PlugConnected20Regular,
  DocumentTable20Regular,
  DocumentPdf20Regular,
  DocumentBulletList20Regular,
  DocumentHeader20Regular,
  SlideLayout20Regular,
  Code20Regular,
  Bug20Regular,
  Database20Regular,
  Mail20Regular,
  Branch20Regular,
  Box20Regular,
  ChartMultiple20Regular,
  Diagram20Regular,
  Beaker20Regular,
  Notepad20Regular,
  MathSymbols20Regular,
  LocalLanguage20Regular,
  Braces20Regular,
  WindowConsole20Regular,
  Rocket20Regular,
  ScanType20Regular,
  ReadingList20Regular,
}

const failed = ref(false)

const isUrl = computed(() => {
  if (!props.icon || failed.value) return false
  const v = props.icon.trim()
  return /^(https?:|data:|\/)/i.test(v)
})

const fluentComp = computed(() => {
  if (!props.icon) return null
  return FLUENT_MAP[props.icon.trim()] || null
})

const sizeClass = computed(() => {
  const map = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' }
  return map[props.size]
})

const avatarSize = computed(() => props.size)

const radiusStyle = computed(() => ({ 'border-radius': 'var(--size-surface-radius)' }))

function onError() {
  failed.value = true
}
</script>
