<template>
  <div v-if="chips.length > 0" class="w-full flex items-center gap-1.5 mb-1 flex-wrap px-5">
    <div
      v-for="chip in chips"
      :key="`${chip.typeId}-${chip.id}`"
      class="attachment-chip group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors"
    >
      <span class="truncate max-w-24 text-gray-700 dark:text-[#c5c7cc]">{{ chip.name }}</span>
      <span v-if="chip.subtitle" class="opacity-50 text-[10px] text-gray-500 dark:text-[#8b8d95]">{{ chip.subtitle }}</span>
      <button
        class="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 leading-none"
        @click.stop="$emit('remove', chip.typeId, chip.id)"
        :aria-label="`remove ${chip.name}`"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface AttachmentChip {
  typeId: string
  id: string
  name: string
  subtitle?: string
}

const props = defineProps<{
  chips: AttachmentChip[]
}>()

defineEmits<{
  remove: [typeId: string, id: string]
}>()
</script>

<style scoped>
/* 令牌口径：玻璃拟态小药丸。--color-secondary-surface / rgba(42,42,42,.8) 这类
   手写半透明底色在换肤后必然对不上，改用 --el-fill-color-lighter 掺透明表达；
   该令牌明暗两侧都有定义（浅色 #f7f9fd / 深色 #1a2230），故 .dark 分支可整体去掉。 */
.attachment-chip {
  /* 原值 var(--color-secondary-surface) 不透明 + .dark 下 rgba(42,42,42,.8) 半透明；
     统一成 82% 掺透明，保留 backdrop-filter 需要的通透感 */
  background: color-mix(in srgb, var(--el-fill-color-lighter) 82%, transparent);
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  /* 原值 rgba(0,0,0,.06) / 深色下 rgba(255,255,255,.08) → 边框色令牌，明暗自动切换 */
  border: 1px solid var(--el-border-color-lighter);
  cursor: default;
}

/* 原值 rgba(229,231,235,1) / 深色下 rgba(58,58,62,.9) → 悬停底色走 --el-fill-color */
.attachment-chip:hover {
  background: var(--el-fill-color);
}

/* 过渡写在模板的 Tailwind 类上（transition-colors / transition-opacity），
   这些元素同样带 scoped 标记，故这里能覆盖到。 */
@media (prefers-reduced-motion: reduce) {
  .attachment-chip,
  .attachment-chip button {
    transition: none;
  }
}
</style>
