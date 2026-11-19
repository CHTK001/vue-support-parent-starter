<template>
  <button type="button" class="market-fav" :class="{ 'market-fav--on': active }"
    :aria-pressed="active"
    :title="active ? t('plugins.market.favRemove') : t('plugins.market.favAdd')"
    :aria-label="active ? t('plugins.market.favRemove') : t('plugins.market.favAdd')"
    @click.stop.prevent="toggle">
    <svg viewBox="0 0 24 24" width="16" height="16" :fill="active ? 'currentColor' : 'none'"
      stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { isFavorite, toggleFavorite, type MarketKey } from './plugins-market'

const props = defineProps<{
  /** 所属市场（收藏集合按市场隔离） */
  market: MarketKey
  /** 条目稳定 id（收藏集合的键） */
  id: string
}>()

const { t } = useI18n()

/** 收藏态（读共享 reactive Set，切换后所有引用处同步刷新） */
const active = computed(() => isFavorite(props.market, props.id))

function toggle() {
  toggleFavorite(props.market, props.id)
}
</script>

<style scoped>
/* 卡片右上角收藏星标：宿主卡片需 position:relative（各市场 cell/card 均已补） */
.market-fav {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--el-text-color-placeholder, #a8abb2);
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease, transform 0.15s ease;
}
.market-fav:hover {
  color: var(--el-color-warning, #e6a23c);
  background: color-mix(in srgb, var(--el-color-warning, #e6a23c) 12%, transparent);
}
.market-fav:active { transform: scale(0.92); }
.market-fav--on { color: var(--el-color-warning, #e6a23c); }
.market-fav:focus-visible {
  outline: 2px solid var(--el-color-primary, #409eff);
  outline-offset: 1px;
}
</style>
