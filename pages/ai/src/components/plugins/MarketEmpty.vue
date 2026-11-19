<template>
  <div class="market-empty">
    <svg class="market-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    <div class="market-empty__title">{{ title }}</div>
    <div v-if="hint" class="market-empty__hint">{{ hint }}</div>
    <button v-if="clearable" type="button" class="market-empty__clear" @click="clearFilters">
      {{ t('plugins.market.emptyClearFilters') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { pluginsMarket, type MarketKey } from './plugins-market'

const props = defineProps<{
  /** 所属市场（用于一键清空该市场的共享筛选状态） */
  market: MarketKey
  /** 空态主文案（由调用方传入已翻译文案） */
  title: string
  /** 空态辅助说明（如命中的关键词），可省略 */
  hint?: string
  /** 是否展示「清空筛选」按钮；纯「无数据」空态应关掉 */
  clearable?: boolean
}>()

const { t } = useI18n()

/** 与 PluginsPage.clearAllFilters 同口径：清空关键词 / 类目 / 状态 */
function clearFilters() {
  const slice = pluginsMarket[props.market]
  slice.keyword = ''
  slice.category = ''
  slice.status = ''
}
</script>

<style scoped>
.market-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 16px;
  color: var(--el-text-color-secondary);
}
.market-empty__icon {
  width: 40px;
  height: 40px;
  margin-bottom: 12px;
  opacity: 0.45;
}
.market-empty__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}
.market-empty__hint {
  font-size: 12px;
  margin-top: 4px;
  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.market-empty__clear {
  margin-top: 14px;
  padding: 5px 14px;
  font-size: 12px;
  line-height: 1;
  border-radius: 999px;
  border: 1px solid var(--el-border-color);
  background: transparent;
  color: var(--el-color-primary);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.market-empty__clear:hover {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
}
.market-empty__clear:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
</style>
