<template>
  <div class="market-toolbar">
    <div class="market-toolbar__count">
      <span>{{ t('plugins.market.resultTotal', { count: total }) }}</span>
      <span v-if="filtered !== total" class="market-toolbar__filtered">
        {{ t('plugins.market.resultFiltered', { count: filtered }) }}
      </span>
    </div>
    <div class="market-toolbar__sort" role="group" :aria-label="t('plugins.market.sortLabel')">
      <button type="button" :class="{ active: slice.sort === 'default' }"
        :aria-pressed="slice.sort === 'default'" @click="slice.sort = 'default'">
        {{ t('plugins.market.sortDefault') }}
      </button>
      <button type="button" :class="{ active: slice.sort === 'name' }"
        :aria-pressed="slice.sort === 'name'" @click="slice.sort = 'name'">
        {{ t('plugins.market.sortName') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { pluginsMarket, type MarketKey } from './plugins-market'

const props = defineProps<{
  /** 所属市场（读写该市场的共享排序状态） */
  market: MarketKey
  /** 市场条目总数（未过滤） */
  total: number
  /** 当前筛选命中的条数 */
  filtered: number
}>()

const { t } = useI18n()

const slice = pluginsMarket[props.market]
</script>

<style scoped>
.market-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.market-toolbar__count {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.market-toolbar__filtered {
  color: var(--el-color-primary);
}
.market-toolbar__sort {
  display: inline-flex;
  flex: none;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  overflow: hidden;
}
.market-toolbar__sort button {
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1;
  padding: 5px 12px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.market-toolbar__sort button + button {
  border-left: 1px solid var(--el-border-color);
}
.market-toolbar__sort button:hover {
  color: var(--el-color-primary);
}
.market-toolbar__sort button.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}
.market-toolbar__sort button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
</style>
