<template>
  <div class="mc-kpi">
    <div v-for="item in items" :key="item.label" class="mc-kpi__item">
      <span class="mc-kpi__value" :class="item.tone ? `is-${item.tone}` : ''">{{ item.value }}</span>
      <span class="mc-kpi__label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts" name="CardKpi">
/**
 * 卡片里的 KPI 数值行（卡片内部共用）
 *
 * <p>抽出来是为了让十几张卡片的「大数字 + 小标题」长得一样：监控面板上
 * 数字的字号、基线、等宽数字特性一旦各写一份就会漂移，扫视时特别硌眼。</p>
 */
import type { CardKpiItem } from "./types";

defineProps<{ items: CardKpiItem[] }>();
</script>

<style lang="scss" scoped>
.mc-kpi {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
  gap: 8px;
}

.mc-kpi__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 9px;
  background: var(--el-fill-color-light);
  min-width: 0;
}

.mc-kpi__value {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mc-kpi__value.is-ok {
  color: var(--el-color-success);
}

.mc-kpi__value.is-warn {
  color: var(--el-color-warning);
}

.mc-kpi__value.is-danger {
  color: var(--el-color-danger);
}

.mc-kpi__value.is-muted {
  color: var(--el-text-color-secondary);
}

.mc-kpi__label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
