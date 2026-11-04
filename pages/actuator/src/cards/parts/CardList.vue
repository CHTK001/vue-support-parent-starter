<template>
  <div class="mc-list">
    <div v-for="row in rows" :key="row.key" class="mc-list__row" :class="{ 'has-bar': row.pct !== undefined }">
      <span class="mc-list__name" :title="row.key">{{ row.key }}</span>
      <span v-if="row.pct !== undefined" class="mc-list__bar">
        <i class="mc-list__fill" :class="row.tone ? `is-${row.tone}` : ''" :style="{ width: `${Math.max(0, Math.min(100, row.pct))}%` }" />
      </span>
      <span class="mc-list__value" :class="row.tone ? `is-${row.tone}` : ''">{{ row.value }}</span>
    </div>
    <div v-if="!rows.length" class="mc-list__empty">{{ empty }}</div>
  </div>
</template>

<script setup lang="ts" name="CardList">
/**
 * 卡片里的「名称 → 数值」列表（可选占比条）
 *
 * <p>用于 status 分布、线程状态、Top URI、Bean 前缀统计这类结构一致的内容。</p>
 */
import type { CardListRow } from "./types";

withDefaults(defineProps<{ rows: CardListRow[]; empty?: string }>(), { empty: "暂无数据" });
</script>

<style lang="scss" scoped>
.mc-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: auto;
  min-height: 0;
}

.mc-list__row {
  display: grid;
  grid-template-columns: minmax(60px, 1fr) auto;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  min-width: 0;
}

/* 有进度条时多占一列 */
.mc-list__row.has-bar {
  grid-template-columns: minmax(60px, 1fr) 52px auto;
}

.mc-list__name {
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mc-list__bar {
  height: 6px;
  border-radius: 999px;
  background: var(--el-fill-color);
  overflow: hidden;
}

.mc-list__fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--el-color-primary);
}

.mc-list__fill.is-ok {
  background: var(--el-color-success);
}

.mc-list__fill.is-warn {
  background: var(--el-color-warning);
}

.mc-list__fill.is-danger {
  background: var(--el-color-danger);
}

.mc-list__value {
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.mc-list__value.is-ok {
  color: var(--el-color-success);
}

.mc-list__value.is-warn {
  color: var(--el-color-warning);
}

.mc-list__value.is-danger {
  color: var(--el-color-danger);
}

.mc-list__empty {
  padding: 10px;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
