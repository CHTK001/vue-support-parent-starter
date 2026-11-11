<script setup lang="ts">
/**
 * 模型行图标：模型自身 logo → 上游通道品牌 → 供应商 logo → 首字。
 *
 * <p>配置中心的模型选择弹框原先只用 {@code getModelAvatarPath(模型名)}：
 * 这条路只认「模型名以某个已知品牌开头」，免费渠道里绝大多数模型名（如
 * {@code gpt-5-mini-free}、{@code grok-4-fast-free}）都匹配不上，于是弹框里
 * 每一行都是空白 —— 用户看到的就是「选中模型的弹框怎么没有模型图标」。</p>
 *
 * <p>这里与模型管理卡片、会话页模型面板同一套回退链：先按模型名取专属图，
 * 取不到（或图片 404）再看这一行真正接的上游通道（FreeChannel 的描述里写着
 * baseUrl），最后落到供应商自己的 logo。弹框只有一行的高度，所以尺寸按
 * 像素传入（默认 28）。</p>
 */
import { computed, ref, watch } from 'vue'
import Avatar from '@/components/ui/Avatar.vue'
import ProviderLogo from '@/components/models/ProviderLogo.vue'
import { getModelAvatarPath, getModelDisplayName } from '@/utils/modelUtils'
import { resolveModelChannelBrand, resolveProviderBrand } from '@/components/models/providerIcons'

const props = withDefaults(defineProps<{
  /** 模型行（弹框候选行或 /api/providers 裸行均可） */
  model?: any
  /** 所属供应商（用于通道解析不出时回退供应商 logo） */
  provider?: any
  /** 图标边长（px） */
  size?: number
}>(), {
  size: 28,
})

/** 模型 logo 加载失败：路径存在 ≠ 资源存在，404 后必须换供应商 logo */
const failed = ref(false)

const px = computed(() => `${props.size}px`)

/** 模型名（兼容裸行、弹框行与 providerId:model 形态） */
const modelName = computed(() => {
  const raw = String(props.model?.model || props.model?.modelName || '')
  return raw.includes(':') ? raw.split(':').slice(1).join(':') : raw
})

const src = computed(() => getModelAvatarPath(modelName.value, props.provider?.name) || '')

const fallbackName = computed(() =>
  props.provider?.name || props.model?.providerName || getModelDisplayName(modelName.value) || '?',
)

/**
 * 回退图标用的品牌 id。
 *
 * <p>先认「这一行接的上游通道」，再按供应商对象解析品牌（名称 / baseUrl / 平台），
 * 都解析不出时直接用 supplier id 交给 ProviderLogo 走首字兜底。</p>
 */
const fallbackPid = computed(() => {
  const channel = resolveModelChannelBrand(props.model)
  if (channel) return channel
  const p = props.provider
  if (p) {
    const brand = resolveProviderBrand({
      provider_id: p.id || p.provider_id,
      name: p.name,
      platform: p.platform,
      provider: p.provider,
      base_url: p.base_url || p.baseUrl || p.apiUrl || p.api_url,
    })
    if (brand && brand !== 'custom') return brand
  }
  return String(props.model?.providerId || p?.id || p?.provider_id || '')
})

// 换一行模型（弹框列表复用节点）时复位失败标记，否则同一行位置会一直显示兜底图标
watch(modelName, () => {
  failed.value = false
})

const onError = () => {
  failed.value = true
}
</script>

<template>
  <span class="mrl" :style="{ width: px, height: px }">
    <Avatar
      v-if="src && !failed"
      :src="src"
      :name="fallbackName"
      type="assistant"
      :round="false"
      fit="contain"
      class="w-full h-full"
      @error="onError"
    />
    <ProviderLogo v-else :pid="fallbackPid" :name="fallbackName" :size="size" />
  </span>
</template>

<style scoped>
/* 固定方框，避免不同品牌图的宽高比把行高撑开（词标 contain 后四周留白） */
.mrl {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mrl :deep(.el-image) {
  border-radius: var(--size-surface-radius);
}
</style>
